import { GoogleGenerativeAI } from '@google/generative-ai'
import { AI_CONFIG, AI_PROMPTS } from './ai-config'

class AIService {
  private genAI: GoogleGenerativeAI
  private models: string[] = AI_CONFIG.models
  private currentModelIndex = 0
  private requestCount = 0
  private lastResetTime = Date.now()

  constructor() {
    const apiKey = AI_CONFIG.apiKey

    if (!apiKey || apiKey.trim() === '') {
      console.error('❌ ERROR: No Gemini API key found!')
      console.error('   Get FREE key: https://makersuite.google.com/app/apikey')
      console.error('   Add to .env.local: NEXT_PUBLIC_GEMINI_API_KEY=your_key')
      this.genAI = new GoogleGenerativeAI('dummy')
    } else {
      console.log('✅ Gemini API key loaded')
      this.genAI = new GoogleGenerativeAI(apiKey)

      // Log available models
      console.log('📋 Available models:')
      AI_CONFIG.models.forEach((model, i) => {
        const limits = AI_CONFIG.rateLimits[model as keyof typeof AI_CONFIG.rateLimits]
        console.log(`   ${i + 1}. ${model} - ${limits?.rpm || '?'} RPM`)
      })
    }
  }

  async generateContent(prompt: string, retries = 3): Promise<string> {
    // Reset counter every minute
    if (Date.now() - this.lastResetTime > 60000) {
      this.requestCount = 0
      this.lastResetTime = Date.now()
    }

    // Attempt loop
    for (let attempt = 0; attempt < retries; attempt++) {
      // 1. GET MODEL NAME INSIDE THE LOOP
      // This ensures if we switch indexes, we actually use the new name
      const currentModelName = this.models[this.currentModelIndex]
      const limits = AI_CONFIG.rateLimits[currentModelName as keyof typeof AI_CONFIG.rateLimits]

      // Check simple local rate limiter
      if (limits && this.requestCount >= limits.rpm) {
        console.log(`⏳ Rate limit soft-cap for ${currentModelName}, switching...`)
        this.currentModelIndex = (this.currentModelIndex + 1) % this.models.length
        continue; // Skip to next iteration with new model
      }

      console.log(`🤖 Request - Attempt ${attempt + 1} - Model: ${currentModelName}`)

      try {
        const model = this.genAI.getGenerativeModel({
          model: currentModelName,
          generationConfig: {
            maxOutputTokens: AI_CONFIG.maxTokens,
            temperature: AI_CONFIG.temperature
          }
        })

        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text()

        this.requestCount++ // Increment only on success or attempt
        console.log(`✅ Success with ${currentModelName}`)
        return text

      } catch (error: any) {
        console.error(`❌ Error with ${currentModelName}:`, error.message)

        // 2. SWITCH MODEL ON FAILURE
        // Move to the next model in the list for the next loop iteration
        this.currentModelIndex = (this.currentModelIndex + 1) % this.models.length

        // If it was a 429 (Rate Limit), wait a bit before retrying
        if (error.message.includes('429') || error.message.includes('quota')) {
          await new Promise(resolve => setTimeout(resolve, 2000))
        } else {
          // For 404s or other errors, retry faster
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
    }

    // All attempts failed - use mock
    console.log('🔄 All models failed, using mock data')
    return this.getMockResponse(prompt)
  }

  private getMockResponse(prompt: string): string {
    const mockResponses = [
      "This is AI-generated content for demonstration.",
      "Professional content would appear here with a valid API key.",
      "Add your Gemini API key to get real AI responses.",
      "Mock response - the AI service is working but rate limited.",
      "Free tier has limits. Consider upgrading for more requests."
    ]

    const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)]

    if (prompt.toLowerCase().includes('cv') || prompt.includes('resume')) {
      return `CV CONTENT\n\nRole: Professional\nExperience: 5+ years\nSkills: Leadership, Communication\nEducation: Relevant degree`
    }

    if (prompt.toLowerCase().includes('contract')) {
      return `{"contract": "example", "status": "mock"}`
    }

    return randomResponse
  }

  async generateCVContent(role: string, experience: string): Promise<string> {
    const prompt = `Create CV for ${role} with ${experience} years experience.`
    return this.generateContent(prompt)
  }

  async generateDocumentContent(topic: string, type: string): Promise<string> {
    const prompt = `Write ${type} about ${topic}.`
    return this.generateContent(prompt)
  }

  async generateContractContent(userPrompt: string): Promise<string> {
    const prompt = `Generate contract: ${userPrompt}`
    return this.generateContent(prompt)
  }

  async generateMarkdownFromPrompt(userPrompt: string): Promise<string> {
    const prompt = AI_PROMPTS.mcpMarkdown(userPrompt)
    return this.generateContent(prompt)
  }

  async generateLayoutUpdate(userPrompt: string, currentContext: string): Promise<any[]> {
    const prompt = AI_PROMPTS.layoutIntelligence(userPrompt, currentContext)
    const result = await this.generateContent(prompt)

    try {
      // Clean the result in case the AI included markdown blocks
      const jsonStr = result.replace(/```json/g, '').replace(/```/g, '').trim()
      return JSON.parse(jsonStr)
    } catch (error) {
      console.error('Failed to parse AI layout response:', error)
      throw new Error('AI returned an invalid layout format. Please try again.')
    }
  }

  async generateMarkdownFromCanvas(canvasContext: string): Promise<string> {
    const prompt = AI_PROMPTS.mcpAICanvasExport(canvasContext)
    return this.generateContent(prompt)
  }

  // Test all models
  async testAllModels(): Promise<{ [key: string]: boolean }> {
    const results: { [key: string]: boolean } = {}

    for (const modelName of this.models) {
      try {
        console.log(`Testing ${modelName}...`)
        const model = this.genAI.getGenerativeModel({ model: modelName })
        const result = await model.generateContent('Test')
        const response = await result.response

        if (response.text()) {
          results[modelName] = true
          console.log(`✅ ${modelName} works!`)
        } else {
          results[modelName] = false
        }
      } catch {
        results[modelName] = false
        console.log(`❌ ${modelName} failed`)
      }

      await new Promise(resolve => setTimeout(resolve, 500))
    }

    return results
  }
}

export const aiService = new AIService()