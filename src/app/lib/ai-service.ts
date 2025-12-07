import { GoogleGenerativeAI } from '@google/generative-ai'
import { AI_CONFIG } from './ai-config'

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

    // Check rate limits
    const currentModel = this.models[this.currentModelIndex]
    const limits = AI_CONFIG.rateLimits[currentModel as keyof typeof AI_CONFIG.rateLimits]

    if (limits && this.requestCount >= limits.rpm) {
      console.log(`⏳ Rate limit reached for ${currentModel}, switching model...`)
      this.currentModelIndex = (this.currentModelIndex + 1) % this.models.length
    }

    this.requestCount++

    console.log(`🤖 Request ${this.requestCount}/${limits?.rpm || '?'} - Model: ${currentModel}`)

    // Try with current model
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const model = this.genAI.getGenerativeModel({
          model: currentModel,
          generationConfig: {
            maxOutputTokens: AI_CONFIG.maxTokens,
            temperature: AI_CONFIG.temperature
          }
        })

        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text()

        console.log(`✅ Success with ${currentModel}`)
        return text

      } catch (error: any) {
        console.error(`❌ Attempt ${attempt + 1} failed:`, error.message)

        // If model not found, try next one
        if (error.message.includes('404') || error.message.includes('not found')) {
          this.currentModelIndex = (this.currentModelIndex + 1) % this.models.length
          console.log(`🔄 Switching to: ${this.models[this.currentModelIndex]}`)
          await new Promise(resolve => setTimeout(resolve, 500))
          continue
        }

        // If rate limited, switch model immediately
        if (error.message.includes('429') || error.message.includes('quota')) {
          this.currentModelIndex = (this.currentModelIndex + 1) % this.models.length
          console.log(`🚫 Rate limited, switching to: ${this.models[this.currentModelIndex]}`)
          await new Promise(resolve => setTimeout(resolve, 2000))
          continue
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000))
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