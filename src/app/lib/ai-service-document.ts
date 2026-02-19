import { aiService } from './ai-service'
import { detectTemplateType } from './ai-config'

interface GenerateDocumentInput {
  templateId: string
  templateSchema: any
  rawText: string
  locale: string
  idempotencyKey?: string
  revision?: number
}

interface GenerateDocumentResult {
  success: boolean
  elements: any[]
  document: any // For legacy compatibility
}

/**
 * PRODUCTION-GRADE DOCUMENT GENERATOR
 * This service orchestrates the intelligent filling of document templates.
 * It uses a multi-stage AI process: 
 * 1. Analysis: What is this template and what does it need?
 * 2. Extraction: What bits of truth are in the user's messy prompt?
 * 3. Synthesis: How do we fill the template so it looks professional?
 */
export async function generateDocumentFromTemplate(
  input: GenerateDocumentInput
): Promise<GenerateDocumentResult> {
  const { templateId, templateSchema, rawText } = input

  console.log(`💎 AI Document Studio: Processing ${templateId}...`)

  try {
    // Stage 1: Analyze and fill the template using the advanced engine
    // This engine is "template-aware" - it looks at the JSON IDs and content 
    // to decide what should go where.
    const updatedElements = await aiService.generateCompleteTemplateContent(
      templateId,
      templateSchema,
      rawText
    )

    // Stage 2: Post-process for "Production Grade" quality
    // We ensure all elements are properly marked as AI generated and visible
    const finalElements = updatedElements.map(el => ({
      ...el,
      isAIGenerated: true,
      isModified: true,
      style: {
        ...(el.style || {}),
        resizeMode: el.style?.resizeMode || (['paragraph', 'heading', 'text'].includes(el.type) ? 'auto-height' : 'fixed')
      }
    }))

    // Legacy compatibility for the route
    return {
      success: true,
      elements: finalElements,
      document: {
        meta: {
          templateId,
          generatedAt: new Date().toISOString(),
          idempotencyKey: input.idempotencyKey || `ai_${Date.now()}`
        }
      }
    }

  } catch (error) {
    console.error('❌ Document Studio failed:', error)
    throw error
  }
}

// Keep legacy export name but point to new logic or rename in route
export const generateCvDocumentFromTemplate = generateDocumentFromTemplate;

/**
 * Analyze if the generated document still contains "placeholder" text from the template.
 */
export function analyzeTemplateContamination(elements: any[], originalTemplateElements: any[]) {
  const originalStrings = new Set<string>()
  originalTemplateElements.forEach(el => {
    if (typeof el.content === 'string' && el.content.length > 5) {
      originalStrings.add(el.content.trim())
    }
  })

  let survivingCount = 0
  const surviving: string[] = []

  elements.forEach(el => {
    if (originalStrings.has(el.content?.trim())) {
      survivingCount++
      surviving.push(el.content.trim())
    }
  })

  return {
    surviving,
    totalTemplateStrings: originalStrings.size,
    contaminationScore: originalStrings.size > 0 ? (survivingCount / originalStrings.size) : 0
  }
}

