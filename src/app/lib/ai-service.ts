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
    // Return a valid JSON array of layout elements for layout generation
    // This ensures the app works even when AI API is rate limited
    const mockLayoutElements = [
      {
        "id": "mock-title",
        "type": "heading",
        "x": 60,
        "y": 80,
        "content": "Professional Document",
        "pageIndex": 0,
        "style": {
          "width": 674,
          "height": 60,
          "fontSize": 36,
          "fontWeight": 700,
          "textAlign": "center",
          "color": "#1a1a1a",
          "resizeMode": "auto-height"
        }
      },
      {
        "id": "mock-subtitle",
        "type": "paragraph",
        "x": 60,
        "y": 155,
        "content": "This is a demonstration layout generated while the AI service is temporarily unavailable due to rate limits.",
        "pageIndex": 0,
        "style": {
          "width": 674,
          "height": 50,
          "fontSize": 16,
          "fontWeight": 400,
          "textAlign": "center",
          "color": "#64748b",
          "lineHeight": 1.6,
          "resizeMode": "auto-height"
        }
      },
      {
        "id": "mock-line-1",
        "type": "line",
        "x": 60,
        "y": 230,
        "content": "",
        "pageIndex": 0,
        "lineOrientation": "horizontal",
        "lineStyle": "solid",
        "style": {
          "width": 674,
          "height": 2,
          "backgroundColor": "#cbd5e1"
        }
      },
      {
        "id": "mock-section-1",
        "type": "heading",
        "x": 60,
        "y": 260,
        "content": "Section One",
        "pageIndex": 0,
        "style": {
          "width": 674,
          "height": 40,
          "fontSize": 24,
          "fontWeight": 700,
          "textAlign": "left",
          "color": "#1a1a1a",
          "resizeMode": "auto-height"
        }
      },
      {
        "id": "mock-para-1",
        "type": "paragraph",
        "x": 60,
        "y": 315,
        "content": "When the AI service is available, this will be replaced with intelligent, professionally designed content based on your request. For now, this mock layout demonstrates the multi-element structure with headings, paragraphs, and dividers.",
        "pageIndex": 0,
        "style": {
          "width": 674,
          "height": 80,
          "fontSize": 14,
          "fontWeight": 400,
          "textAlign": "left",
          "color": "#374151",
          "lineHeight": 1.6,
          "resizeMode": "auto-height"
        }
      },
      {
        "id": "mock-section-2",
        "type": "heading",
        "x": 60,
        "y": 415,
        "content": "Section Two",
        "pageIndex": 0,
        "style": {
          "width": 674,
          "height": 40,
          "fontSize": 24,
          "fontWeight": 700,
          "textAlign": "left",
          "color": "#1a1a1a",
          "resizeMode": "auto-height"
        }
      },
      {
        "id": "mock-para-2",
        "type": "paragraph",
        "x": 60,
        "y": 470,
        "content": "The AI can generate complete documents with 15-30+ elements including containers, icons, images, and more when the API is available. Each element is positioned to prevent collisions and styled professionally.",
        "pageIndex": 0,
        "style": {
          "width": 674,
          "height": 80,
          "fontSize": 14,
          "fontWeight": 400,
          "textAlign": "left",
          "color": "#374151",
          "lineHeight": 1.6,
          "resizeMode": "auto-height"
        }
      },
      {
        "id": "mock-container",
        "type": "container",
        "x": 60,
        "y": 570,
        "content": "Note: AI service is currently rate limited. Please try again in a few minutes for full AI-generated content.",
        "pageIndex": 0,
        "style": {
          "width": 674,
          "height": 80,
          "fontSize": 13,
          "fontWeight": 400,
          "textAlign": "center",
          "color": "#64748b",
          "backgroundColor": "#f8fafc",
          "borderRadius": 8,
          "borderWidth": 1,
          "borderColor": "#e2e8f0",
          "padding": 16,
          "resizeMode": "auto-height"
        }
      }
    ]

    return JSON.stringify(mockLayoutElements)
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
      // More robust JSON cleaning
      let jsonStr = result
        .replace(/```json\s*/gi, '')  // Remove ```json
        .replace(/```\s*$/gi, '')     // Remove closing ```
        .replace(/^[\s\S]*?(\[)/, '[') // Remove everything before first [
        .replace(/\][\s\S]*$/, ']')   // Remove everything after last ]
        .trim()
      
      // Try to parse
      const parsed = JSON.parse(jsonStr)
      
      // Validate it's an array
      if (!Array.isArray(parsed)) {
        throw new Error('AI response is not a JSON array')
      }
      
      return parsed
    } catch (error) {
      console.error('Failed to parse AI layout response:', error)
      console.log('Raw response (first 500 chars):', result.substring(0, 500))
      
      // Try fallback: extract JSON array using regex
      const arrayMatch = result.match(/\[[\s\S]*\]/)
      if (arrayMatch) {
        try {
          const fixed = arrayMatch[0]
            .replace(/'/g, '"')           // Replace single quotes with double
            .replace(/(\w+):/g, '"$1":')  // Quote unquoted property names
            .replace(/,\s*\]/g, ']')      // Remove trailing commas
            .replace(/,\s*\}/g, '}')      // Remove trailing commas in objects
          return JSON.parse(fixed)
        } catch (e) {
          console.error('Fallback parse also failed:', e)
        }
      }
      
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