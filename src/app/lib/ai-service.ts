// ai-service.ts - PRODUCTION-GRADE AI SERVICE WITH ENTITY EXTRACTION
// =============================================================================

import { GoogleGenerativeAI } from '@google/generative-ai'
import { AI_CONFIG, AI_PROMPTS, detectTemplateType, validateExtractedEntities } from './ai-config'

// =============================================================================
// TYPES
// =============================================================================
interface ExtractedEntities {
  personal?: {
    full_name?: string
    email?: string
    phone?: string
    location?: string
    linkedin?: string
    github?: string
    website?: string
  }
  professional?: {
    job_title?: string
    current_company?: string
    years_experience?: string
    industry?: string
  }
  summary?: {
    professional_summary?: string
    objective?: string
  }
  experience?: Array<{
    position?: string
    company_name?: string
    duration?: string
    achievements?: string[]
  }>
  education?: Array<{
    degree?: string
    institution?: string
    year?: string
    details?: string
  }>
  skills?: {
    technical?: string[]
    soft?: string[]
    languages?: string[]
    tools?: string[]
  }
  company?: any
  client?: any
  proposal?: any
  sender?: any
  recipient?: any
  content?: any
}

interface TemplateElement {
  id: string
  type: string
  x: number
  y: number
  content: string
  style: any
  pageIndex: number
  [key: string]: any
}

interface ContentUpdate {
  id: string
  content: string
}

// =============================================================================
// AI SERVICE CLASS
// =============================================================================
class AIService {
  private genAI: GoogleGenerativeAI
  private models: string[] = AI_CONFIG.models
  private currentModelIndex = 0
  private requestCount = 0
  private lastResetTime = Date.now()
  private isInitialized = false

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
      this.isInitialized = true
    }
  }

  // ===========================================================================
  // CORE: Generate content with model fallback
  // ===========================================================================
  async generateContent(prompt: string, retries = 3): Promise<string> {
    // Reset counter every minute
    if (Date.now() - this.lastResetTime > 60000) {
      this.requestCount = 0
      this.lastResetTime = Date.now()
    }

    // Attempt loop with model fallback
    for (let attempt = 0; attempt < retries; attempt++) {
      const currentModelName = this.models[this.currentModelIndex]
      const limits = AI_CONFIG.rateLimits[currentModelName as keyof typeof AI_CONFIG.rateLimits]

      // Check rate limit
      if (limits && this.requestCount >= limits.rpm) {
        console.log(`⏳ Rate limit for ${currentModelName}, switching...`)
        this.currentModelIndex = (this.currentModelIndex + 1) % this.models.length
        continue
      }

      console.log(`🤖 AI Request - Attempt ${attempt + 1}/${retries} - Model: ${currentModelName}`)

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

        this.requestCount++
        console.log(`✅ Success with ${currentModelName}`)
        return text

      } catch (error: any) {
        console.error(`❌ Error with ${currentModelName}:`, error.message)
        this.currentModelIndex = (this.currentModelIndex + 1) % this.models.length

        if (error.message.includes('429') || error.message.includes('quota')) {
          await new Promise(resolve => setTimeout(resolve, 2000))
        } else {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
    }

    // All attempts failed
    console.log('🔄 All models failed, using fallback')
    throw new Error('AI service temporarily unavailable. Please try again.')
  }

  // ===========================================================================
  // ENTITY EXTRACTION: Extract user data from prompt
  // ===========================================================================
  async extractEntities(userPrompt: string, templateType: string): Promise<ExtractedEntities> {
    console.log(`🔍 Extracting entities for ${templateType}...`)
    
    const prompt = AI_PROMPTS.entityExtraction(userPrompt, templateType)
    
    try {
      const result = await this.generateContent(prompt)
      const entities = this.parseJSON(result)
      
      // Validate extraction
      const validation = validateExtractedEntities(entities, templateType)
      if (!validation.valid) {
        console.warn(`⚠️ Missing fields: ${validation.missing.join(', ')}`)
      }
      
      console.log(`✅ Extracted entities:`, Object.keys(entities))
      return entities
      
    } catch (error) {
      console.error('❌ Entity extraction failed:', error)
      return this.createFallbackEntities(userPrompt, templateType)
    }
  }

  // ===========================================================================
  // TEMPLATE CONTENT GENERATION: Fill template with extracted data
  // ===========================================================================
  async generateTemplateContentWithEntities(
    templateId: string,
    templateElements: TemplateElement[],
    extractedEntities: ExtractedEntities,
    userPrompt: string
  ): Promise<ContentUpdate[]> {
    console.log(`📝 Generating content for ${templateId} with ${templateElements.length} elements...`)
    
    const prompt = AI_PROMPTS.templateContentGeneration(
      templateId,
      templateElements,
      extractedEntities,
      userPrompt
    )
    
    try {
      const result = await this.generateContent(prompt)
      const updates = this.parseJSON(result) as ContentUpdate[]
      
      if (!Array.isArray(updates)) {
        throw new Error('AI response is not an array')
      }
      
      console.log(`✅ Generated ${updates.length} content updates`)
      return updates
      
    } catch (error) {
      console.error('❌ Template content generation failed:', error)
      return this.createFallbackContentUpdates(templateElements, extractedEntities)
    }
  }

  // ===========================================================================
  // MAIN API: Generate complete template content
  // ===========================================================================
  async generateCompleteTemplateContent(
    templateId: string,
    templateData: any,
    userPrompt: string
  ): Promise<TemplateElement[]> {
    console.log(`🚀 Starting complete template generation for ${templateId}`)
    
    // Step 1: Detect template type
    const templateType = detectTemplateType(templateId)
    console.log(`📋 Template type: ${templateType}`)
    
    // Step 2: Extract entities from user prompt
    const entities = await this.extractEntities(userPrompt, templateType)
    
    // Step 3: Get template elements
    const templateElements = this.flattenTemplateElements(templateData)
    console.log(`📄 Template has ${templateElements.length} elements across ${templateData.pages?.length || 1} pages`)
    
    // Step 4: Generate content updates
    const contentUpdates = await this.generateTemplateContentWithEntities(
      templateId,
      templateElements,
      entities,
      userPrompt
    )
    
    // Step 5: Apply updates to template elements
    const updatedElements = this.applyContentUpdates(templateElements, contentUpdates)
    
    console.log(`✅ Template generation complete!`)
    return updatedElements
  }

  // ===========================================================================
  // HELPER: Flatten template pages into elements array
  // ===========================================================================
  private flattenTemplateElements(templateData: any): TemplateElement[] {
    const elements: TemplateElement[] = []
    
    if (templateData.pages && Array.isArray(templateData.pages)) {
      templateData.pages.forEach((page: any, pageIndex: number) => {
        if (page.elements && Array.isArray(page.elements)) {
          page.elements.forEach((el: any) => {
            elements.push({
              ...el,
              pageIndex: el.pageIndex ?? pageIndex
            })
          })
        }
      })
    } else if (templateData.elements && Array.isArray(templateData.elements)) {
      elements.push(...templateData.elements)
    }
    
    return elements
  }

  // ===========================================================================
  // HELPER: Apply content updates to elements
  // ===========================================================================
  private applyContentUpdates(elements: TemplateElement[], updates: ContentUpdate[]): TemplateElement[] {
    const updateMap = new Map(updates.map(u => [u.id, u.content]))
    
    return elements.map(el => {
      const newContent = updateMap.get(el.id)
      if (newContent !== undefined) {
        return {
          ...el,
          content: newContent,
          isModified: true,
          isAIGenerated: true
        }
      }
      return el
    })
  }

  // ===========================================================================
  // HELPER: Parse JSON with robust error handling
  // ===========================================================================
  private parseJSON(text: string): any {
    // Clean the response
    let cleaned = text
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/gi, '')
      .replace(/^[\s\S]*?(\[|\{)/, '$1')
      .replace(/(\]|\})[\s\S]*$/, '$1')
      .trim()

    try {
      return JSON.parse(cleaned)
    } catch (e1) {
      // Try to fix common issues
      try {
        cleaned = cleaned
          .replace(/,\s*]/g, ']')
          .replace(/,\s*}/g, '}')
          .replace(/'/g, '"')
          .replace(/[\x00-\x1F\x7F]/g, '')
        
        return JSON.parse(cleaned)
      } catch (e2) {
        // Try regex extraction
        const arrayMatch = text.match(/\[[\s\S]*\]/)
        const objectMatch = text.match(/\{[\s\S]*\}/)
        
        if (arrayMatch) {
          try {
            return JSON.parse(arrayMatch[0])
          } catch (e3) {}
        }
        
        if (objectMatch) {
          try {
            return JSON.parse(objectMatch[0])
          } catch (e4) {}
        }
        
        throw new Error('Failed to parse AI response as JSON')
      }
    }
  }

  // ===========================================================================
  // FALLBACK: Create fallback entities from user prompt
  // ===========================================================================
  private createFallbackEntities(userPrompt: string, templateType: string): ExtractedEntities {
    const prompt = userPrompt.toLowerCase()
    
    // Simple extraction patterns
    const nameMatch = userPrompt.match(/(?:my name is|i am|i'm)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i)
    const emailMatch = userPrompt.match(/[\w.-]+@[\w.-]+\.\w+/)
    const phoneMatch = userPrompt.match(/\+?[\d\s-().]{10,}/)
    const yearsMatch = userPrompt.match(/(\d+)\s*(?:years?|yrs?)/)
    
    // Extract skills
    const techKeywords = ['javascript', 'typescript', 'react', 'node', 'python', 'java', 'aws', 'docker', 'git']
    const extractedSkills = techKeywords.filter(skill => prompt.includes(skill))
    
    // Build fallback entities
    const entities: ExtractedEntities = {
      personal: {
        full_name: nameMatch?.[1] || '[Your Name]',
        email: emailMatch?.[0] || '[your.email@example.com]',
        phone: phoneMatch?.[0] || '[Your Phone]',
      },
      professional: {
        job_title: this.extractJobTitle(prompt),
        years_experience: yearsMatch?.[1] || '',
      },
      summary: {
        professional_summary: `Experienced professional with expertise in ${extractedSkills.join(', ') || 'various technologies'}.`
      },
      skills: {
        technical: extractedSkills,
        soft: [],
        languages: [],
        tools: []
      }
    }
    
    return entities
  }

  // ===========================================================================
  // HELPER: Extract job title from prompt
  // ===========================================================================
  private extractJobTitle(prompt: string): string {
    const titlePatterns = [
      /(?:as\s+(?:a|an)\s+)?(\w+\s+(?:developer|engineer|designer|manager|analyst|consultant))/i,
      /(?:position|role|job)\s+(?:of|as|:)?\s*(\w+(?:\s+\w+)?)/i,
      /(senior|junior|lead|staff|principal)?\s*(\w+\s+(?:developer|engineer))/i
    ]
    
    for (const pattern of titlePatterns) {
      const match = prompt.match(pattern)
      if (match) {
        return match[1] || match[0]
      }
    }
    
    return '[Job Title]'
  }

  // ===========================================================================
  // FALLBACK: Create fallback content updates
  // ===========================================================================
  private createFallbackContentUpdates(
    elements: TemplateElement[],
    entities: ExtractedEntities
  ): ContentUpdate[] {
    const updates: ContentUpdate[] = []
    
    for (const el of elements) {
      const idLower = el.id.toLowerCase()
      let newContent: string | null = null
      
      // Map elements to entity fields
      if (idLower.includes('name') && !idLower.includes('company')) {
        newContent = entities.personal?.full_name || el.content
      } else if (idLower.includes('title') && !idLower.includes('section')) {
        newContent = entities.professional?.job_title || el.content
      } else if (idLower.includes('email')) {
        newContent = entities.personal?.email || el.content
      } else if (idLower.includes('phone')) {
        newContent = entities.personal?.phone || el.content
      } else if (idLower.includes('summary') && !idLower.includes('title')) {
        newContent = entities.summary?.professional_summary || el.content
      }
      
      if (newContent && newContent !== el.content) {
        updates.push({ id: el.id, content: newContent })
      }
    }
    
    return updates
  }

  // ===========================================================================
  // LEGACY METHODS FOR BACKWARD COMPATIBILITY
  // ===========================================================================
  async generateCVContent(role: string, experience: string): Promise<string> {
    const prompt = AI_PROMPTS.cvContent(role, experience)
    return this.generateContent(prompt)
  }

  async generateDocumentContent(topic: string, type: string): Promise<string> {
    const prompt = AI_PROMPTS.documentContent(topic, type)
    return this.generateContent(prompt)
  }

  async generateContractContent(userPrompt: string): Promise<string> {
    return this.generateContent(`Generate contract: ${userPrompt}`)
  }

  async generateMarkdownFromPrompt(userPrompt: string): Promise<string> {
    const prompt = AI_PROMPTS.mcpMarkdown(userPrompt)
    return this.generateContent(prompt)
  }

  async generateFullDocumentLayout(documentType: string, userPrompt: string): Promise<any[]> {
    const templateType = documentType
    const entities = await this.extractEntities(userPrompt, templateType)
    const prompt = AI_PROMPTS.fullDocumentGeneration(templateType, userPrompt, entities)
    const result = await this.generateContent(prompt)
    try {
      return this.parseJSON(result)
    } catch (error) {
      console.error('Failed to parse full document layout:', error)
      return this.getTemplateMockContent(templateType, entities)
    }
  }

  async generateLayoutUpdate(userPrompt: string, currentContext: string): Promise<any[]> {
    const prompt = AI_PROMPTS.layoutIntelligence(userPrompt, currentContext)
    const result = await this.generateContent(prompt)
    return this.parseJSON(result)
  }

  async generateTemplateContent(templateId: string, templateName: string, userPrompt: string): Promise<any[]> {
    // This is the old method - now redirects to the new system
    console.log(`📌 Legacy generateTemplateContent called for ${templateId}`)
    
    const templateType = detectTemplateType(templateId)
    const entities = await this.extractEntities(userPrompt, templateType)
    
    // Generate full layout based on template type
    const prompt = AI_PROMPTS.fullDocumentGeneration(templateType, userPrompt, entities)
    const result = await this.generateContent(prompt)
    
    try {
      return this.parseJSON(result)
    } catch (error) {
      console.error('Failed to parse template content:', error)
      return this.getTemplateMockContent(templateId, entities)
    }
  }

  // ===========================================================================
  // MOCK CONTENT GENERATORS
  // ===========================================================================
  private getTemplateMockContent(templateId: string, entities: ExtractedEntities): any[] {
    const name = entities.personal?.full_name || 'JOHN DOE'
    const title = entities.professional?.job_title || 'Professional'
    const summary = entities.summary?.professional_summary || 'Experienced professional with diverse skills.'

    return [
      {
        id: "header-name",
        type: "heading",
        x: 60, y: 60,
        content: name.toUpperCase(),
        pageIndex: 0,
        style: { width: 674, height: 50, fontSize: 36, fontWeight: 700, color: "#1a1a1a", resizeMode: "auto-height" }
      },
      {
        id: "header-title",
        type: "text",
        x: 60, y: 115,
        content: title,
        pageIndex: 0,
        style: { width: 400, height: 30, fontSize: 18, fontWeight: 500, color: "#6b7280", resizeMode: "auto-width" }
      },
      {
        id: "section-divider",
        type: "line",
        x: 60, y: 155,
        content: "",
        pageIndex: 0,
        lineOrientation: "horizontal",
        lineStyle: "solid",
        style: { width: 674, height: 2, backgroundColor: "#e5e7eb" }
      },
      {
        id: "summary-title",
        type: "heading",
        x: 60, y: 180,
        content: "Professional Summary",
        pageIndex: 0,
        style: { width: 674, height: 30, fontSize: 16, fontWeight: 700, color: "#1e3a8a", resizeMode: "auto-height" }
      },
      {
        id: "summary-content",
        type: "paragraph",
        x: 60, y: 220,
        content: summary,
        pageIndex: 0,
        style: { width: 674, height: 60, fontSize: 14, fontWeight: 400, color: "#374151", lineHeight: 1.6, resizeMode: "auto-height" }
      }
    ]
  }

  async generateMarkdownFromCanvas(canvasContext: string): Promise<string> {
    const prompt = AI_PROMPTS.mcpAICanvasExport(canvasContext)
    return this.generateContent(prompt)
  }

  async testAllModels(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {}

    for (const modelName of this.models) {
      try {
        console.log(`Testing ${modelName}...`)
        const model = this.genAI.getGenerativeModel({ model: modelName })
        const result = await model.generateContent('Test')
        const response = await result.response
        results[modelName] = !!response.text()
        console.log(`✅ ${modelName} works!`)
      } catch {
        results[modelName] = false
        console.log(`❌ ${modelName} failed`)
      }
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    return results
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================
export const aiService = new AIService()
