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

  async generateTemplateContent(templateId: string, templateName: string, userPrompt: string): Promise<any[]> {
    const templatePrompts = {
      // CV/Resume Templates
      'cv-modern-blue': `Generate a professional CV/Resume based on: "${userPrompt}". Use modern blue styling. Include personal info, summary, experience, skills, education. Return as JSON array.`,
      'cv-executive-gray': `Generate an executive-level CV/Resume based on: "${userPrompt}". Use sophisticated gray styling. Include leadership experience, achievements, skills. Return as JSON array.`,
      'cv-creative-purple': `Generate a creative CV/Resume for designers based on: "${userPrompt}". Use vibrant purple styling. Include portfolio, creative skills, design experience. Return as JSON array.`,
      'cv-minimalist-black': `Generate a minimalist CV/Resume based on: "${userPrompt}". Use clean black typography. Focus on essential information only. Return as JSON array.`,
      'cv-nature-green': `Generate a fresh CV/Resume based on: "${userPrompt}". Use natural green colors. Include environmental or sustainability focus if relevant. Return as JSON array.`,
      'cv-tech-teal': `Generate a tech-focused CV/Resume based on: "${userPrompt}". Use modern teal styling. Include technical skills, projects, experience. Return as JSON array.`,
      'cv-elegant-rose': `Generate an elegant CV/Resume based on: "${userPrompt}". Use sophisticated rose accents. Include refined professional experience. Return as JSON array.`,
      'cv-bold-orange': `Generate a bold CV/Resume based on: "${userPrompt}". Use eye-catching orange styling. Make it stand out visually. Return as JSON array.`,
      'cv-clean-white': `Generate a clean CV/Resume based on: "${userPrompt}". Use pure white minimalist design. Focus on clarity and simplicity. Return as JSON array.`,
      'cv-corporate-navy': `Generate a corporate CV/Resume based on: "${userPrompt}". Use professional navy blue theme. Include business experience. Return as JSON array.`,

      // Cover Letter Templates
      'cover-letter-professional': `Generate a professional cover letter for: "${userPrompt}". Use standard business format. Include proper salutation, introduction, body, closing. Return as JSON array.`,
      'cover-letter-executive': `Generate an executive-level cover letter for: "${userPrompt}". Use formal styling. Include leadership experience and strategic thinking. Return as JSON array.`,
      'cover-letter-creative': `Generate a creative cover letter for: "${userPrompt}". Use artistic design. Focus on creative skills and portfolio. Return as JSON array.`,
      'cover-letter-minimalist': `Generate a minimalist cover letter for: "${userPrompt}". Use clean simple design. Focus on essential points only. Return as JSON array.`,
      'cover-letter-tech': `Generate a tech-focused cover letter for: "${userPrompt}". Include technical skills and project experience. Return as JSON array.`,
      'cover-letter-traditional': `Generate a traditional cover letter for: "${userPrompt}". Use classic formal format. Follow standard business letter conventions. Return as JSON array.`,
      'cover-letter-modern': `Generate a modern cover letter for: "${userPrompt}". Use contemporary styling. Include current industry trends. Return as JSON array.`,
      'cover-letter-elegant': `Generate an elegant cover letter for: "${userPrompt}". Use sophisticated refined language. Focus on professional presentation. Return as JSON array.`,
      'cover-letter-simple': `Generate a simple cover letter for: "${userPrompt}". Use straightforward format. Focus on clarity and directness. Return as JSON array.`,
      'cover-letter-academic': `Generate an academic cover letter for: "${userPrompt}". Include research experience, publications, academic achievements. Return as JSON array.`,

      // Business Proposal Templates
      'business-proposal-standard': `Generate a standard business proposal for: "${userPrompt}". Include executive summary, problem, solution, timeline, budget. Return as JSON array.`,
      'business-proposal-premium': `Generate a premium business proposal for: "${userPrompt}". Use high-end formatting. Include comprehensive details and professional presentation. Return as JSON array.`,
      'business-proposal-express': `Generate an express business proposal for: "${userPrompt}". Focus on quick turnaround. Include essential points only. Return as JSON array.`,
      'business-proposal-corporate': `Generate a corporate business proposal for: "${userPrompt}". Use formal corporate language. Include detailed business case. Return as JSON array.`,
      'business-proposal-startup': `Generate a startup business proposal for: "${userPrompt}". Use modern startup language. Include innovation and growth potential. Return as JSON array.`,
      'business-proposal-tech': `Generate a tech business proposal for: "${userPrompt}". Include technical specifications, implementation details. Return as JSON array.`,
      'business-proposal-consulting': `Generate a consulting business proposal for: "${userPrompt}". Include service offerings, methodology, deliverables. Return as JSON array.`,
      'business-proposal-sales': `Generate a sales-focused business proposal for: "${userPrompt}". Include sales strategy, conversion tactics, ROI analysis. Return as JSON array.`,
      'business-proposal-partnership': `Generate a partnership business proposal for: "${userPrompt}". Include collaboration benefits, shared goals, terms. Return as JSON array.`,
      'business-proposal-template': `Generate a generic business proposal for: "${userPrompt}". Include all standard proposal sections. Return as JSON array.`,

      // Professional Report Templates
      'professional-report-annual': `Generate an annual professional report on: "${userPrompt}". Include yearly performance, trends, future outlook. Return as JSON array.`,
      'professional-report-quarterly': `Generate a quarterly professional report on: "${userPrompt}". Include quarterly metrics, analysis, recommendations. Return as JSON array.`,
      'professional-report-financial': `Generate a financial professional report for: "${userPrompt}". Include financial statements, analysis, forecasts. Return as JSON array.`,
      'professional-report-project': `Generate a project status report for: "${userPrompt}". Include progress, milestones, issues, next steps. Return as JSON array.`,

      // Invoice Templates
      'invoice-standard': `Generate a standard invoice for: "${userPrompt}". Include itemized services, costs, payment terms. Return as JSON array.`,
      'invoice-professional': `Generate a professional invoice for: "${userPrompt}". Include detailed billing information and terms. Return as JSON array.`,
      'invoice-simple': `Generate a simple invoice for: "${userPrompt}". Include basic billing information only. Return as JSON array.`,
      'invoice-detailed': `Generate a detailed invoice for: "${userPrompt}". Include comprehensive itemization and breakdown. Return as JSON array.`,
      'invoice-template': `Generate a generic invoice for: "${userPrompt}". Include all standard invoice elements. Return as JSON array.`,

      // Contract Templates
      'contract-service': `Generate a service contract for: "${userPrompt}". Include scope of work, deliverables, payment terms. Return as JSON array.`,
      'contract-employment': `Generate an employment contract for: "${userPrompt}". Include job duties, compensation, terms. Return as JSON array.`,
      'contract-nda': `Generate an NDA contract for: "${userPrompt}". Include confidentiality terms, obligations, duration. Return as JSON array.`,
      'contract-partnership': `Generate a partnership contract for: "${userPrompt}". Include partnership terms, responsibilities, profit sharing. Return as JSON array.`,
      'contract-template': `Generate a generic contract for: "${userPrompt}". Include standard contract elements and clauses. Return as JSON array.`,

      // Company Brochure Templates
      'company-brochure-corporate': `Generate a corporate company brochure for: "${userPrompt}". Use professional business language. Include company overview, services. Return as JSON array.`,
      'company-brochure-creative': `Generate a creative company brochure for: "${userPrompt}". Use artistic language. Include unique selling points. Return as JSON array.`,
      'company-brochure-minimal': `Generate a minimal company brochure for: "${userPrompt}". Use clean design language. Focus on essential information. Return as JSON array.`,
      'company-brochure-luxury': `Generate a luxury company brochure for: "${userPrompt}". Use premium language. Highlight exclusivity and quality. Return as JSON array.`,
      'company-brochure-tech': `Generate a tech company brochure for: "${userPrompt}". Include technical specifications, innovation. Return as JSON array.`,
      'company-brochure-startup': `Generate a startup company brochure for: "${userPrompt}". Use dynamic language. Include vision and mission. Return as JSON array.`,
      'company-brochure-modern': `Generate a modern company brochure for: "${userPrompt}". Use contemporary language. Include current trends. Return as JSON array.`,
      'company-brochure-classic': `Generate a classic company brochure for: "${userPrompt}". Use traditional business language. Include heritage and stability. Return as JSON array.`,
      'company-brochure-professional': `Generate a professional company brochure for: "${userPrompt}". Use business-focused language. Include key benefits. Return as JSON array.`,
      'company-brochure-template': `Generate a generic company brochure for: "${userPrompt}". Include all standard brochure sections. Return as JSON array.`
    }

    const prompt = templatePrompts[templateId as keyof typeof templatePrompts] || 
      `Generate professional content for ${templateName} based on: "${userPrompt}". 
      Return as JSON array of properly positioned and styled elements suitable for the document type.`

    const result = await this.generateContent(prompt)
    
    try {
      let jsonStr = result
        
      // More robust JSON extraction
      // 1. Remove any HTML/DOCTYPE prefixes
      jsonStr = jsonStr.replace(/<!DOCTYPE[^>]*>/gi, '')
      jsonStr = jsonStr.replace(/<[^>]*>/gi, '')
      
      // 2. Extract JSON array from response
      const jsonMatch = jsonStr.match(/(\[[\s\S]*\])/)
      if (jsonMatch) {
        jsonStr = jsonMatch[1]
      } else {
        // Fallback: try to find JSON between markers
        jsonStr = jsonStr
          .replace(/```json\s*/gi, '')
          .replace(/```\s*$/gi, '')
          .replace(/^[\s\S]*?(\[)/, '[')
          .replace(/\][\s\S]*$/, ']')
          .trim()
      }
      
      // 3. Fix common JSON issues
      jsonStr = jsonStr
        .replace(/,\s*]/g, ']')  // Remove trailing commas
        .replace(/,\s*}/g, '}')  // Remove trailing commas in objects
        .replace(/(['"])?([a-zA-Z_][a-zA-Z0-9_]*)\1\s*:/g, '"$2":')  // Quote unquoted property names
      
      console.log('Cleaned JSON string:', jsonStr.substring(0, 200) + '...')
      
      const parsed = JSON.parse(jsonStr)
      
      if (!Array.isArray(parsed)) {
        throw new Error('AI response is not a JSON array')
      }
      
      return parsed
    } catch (error) {
      console.error('Failed to parse template AI response:', error)
      console.error('Raw AI response:', result.substring(0, 500) + '...')
      return this.getTemplateMockContent(templateId)
    }
  }

  private getTemplateMockContent(templateId: string): any[] {
    const mockContents = {
      // CV/Resume Templates
      'cv-modern-blue': [
        {
          id: "mock-name",
          type: "heading",
          x: 60, y: 60,
          content: "JOHN DOE",
          pageIndex: 0,
          style: { width: 674, height: 50, fontSize: 36, fontWeight: 700, color: "#1a1a1a", resizeMode: "auto-height" }
        },
        {
          id: "mock-title",
          type: "text",
          x: 60, y: 115,
          content: "Senior Software Engineer",
          pageIndex: 0,
          style: { width: 400, height: 30, fontSize: 18, fontWeight: 500, color: "#6b7280", resizeMode: "auto-width" }
        }
      ],
      'business-proposal': [
        {
          id: "mock-proposal-title",
          type: "heading",
          x: 60, y: 60,
          content: "BUSINESS PROPOSAL",
          pageIndex: 0,
          style: { width: 674, height: 40, fontSize: 28, fontWeight: 700, color: "#1e2937", resizeMode: "auto-height" }
        }
      ],
      'professional-report': [
        {
          id: "mock-report-title",
          type: "heading",
          x: 60, y: 60,
          content: "PROFESSIONAL REPORT",
          pageIndex: 0,
          style: { width: 674, height: 40, fontSize: 28, fontWeight: 700, color: "#1e2937", resizeMode: "auto-height" }
        }
      ],
      'cover-letter': [
        {
          id: "mock-letter-header",
          type: "text",
          x: 60, y: 60,
          content: "John Doe\n123 Main Street\nSan Francisco, CA 94102",
          pageIndex: 0,
          style: { width: 300, height: 60, fontSize: 14, fontWeight: 400, color: "#1f2937", resizeMode: "auto-height" }
        }
      ],
      'company-brochure': [
        {
          id: "mock-brochure-title",
          type: "heading",
          x: 60, y: 60,
          content: "INNOVATE. INSPIRE. TRANSFORM.",
          pageIndex: 0,
          style: { width: 674, height: 60, fontSize: 42, fontWeight: 800, color: "#ffffff", resizeMode: "auto-height" }
        }
      ]
    }
    
    return mockContents[templateId as keyof typeof mockContents] || []
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