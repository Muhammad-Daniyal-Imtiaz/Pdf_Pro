// api/generate-ai-content/route.ts - PRODUCTION-GRADE AI CONTENT API
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'

// Rate limiting store
const userRequests = new Map<string, { count: number; timestamp: number }>()

// =============================================================================
// POST - Generate AI Content
// =============================================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      type, 
      role, 
      experience, 
      topic, 
      documentType, 
      prompt,
      templateId, 
      templateName,
      templateData,  // NEW: Full template data for intelligent replacement
      userDetails    // NEW: Structured user details for entity extraction
    } = body

    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const now = Date.now()
    const userData = userRequests.get(ip) || { count: 0, timestamp: now }

    if (now - userData.timestamp > 60000) {
      userData.count = 0
      userData.timestamp = now
    }

    if (userData.count >= 15) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again in 1 minute.', retryAfter: 60 },
        { status: 429 }
      )
    }

    userData.count++
    userRequests.set(ip, userData)

    // Import AI service
    const { aiService } = await import('@/app/lib/ai-service')

    // ===========================================================================
    // CASE 1: Template-based AI generation with full template data
    // ===========================================================================
    if (templateId && templateData && prompt) {
      console.log(`🚀 Full template AI generation for: ${templateId}`)
      
      try {
        const elements = await aiService.generateCompleteTemplateContent(
          templateId,
          templateData,
          prompt
        )
        
        return NextResponse.json({
          success: true,
          content: elements,
          type: 'template-elements',
          templateId,
          timestamp: new Date().toISOString(),
        })
      } catch (error: any) {
        console.error('Template generation error:', error)
        
        // Fallback: Try legacy method
        const elements = await aiService.generateTemplateContent(
          templateId,
          templateName || templateId,
          prompt
        )
        
        return NextResponse.json({
          success: true,
          content: elements,
          type: 'template-elements',
          templateId,
          fallback: true,
          timestamp: new Date().toISOString(),
        })
      }
    }

    // ===========================================================================
    // CASE 2: Template-based generation (legacy - without full template data)
    // ===========================================================================
    if (templateId && templateName && prompt) {
      console.log(`📝 Legacy template AI generation for: ${templateId}`)
      
      const elements = await aiService.generateTemplateContent(
        templateId,
        templateName,
        prompt
      )
      
      return NextResponse.json({
        success: true,
        content: elements,
        type: 'template-elements',
        timestamp: new Date().toISOString(),
      })
    }

    // ===========================================================================
    // CASE 3: CV generation
    // ===========================================================================
    if (type === 'cv' && role) {
      const result = await aiService.generateCVContent(role, experience || '3')
      
      return NextResponse.json({
        success: true,
        content: result,
        type: 'text-content',
        timestamp: new Date().toISOString(),
      })
    }

    // ===========================================================================
    // CASE 4: Contract generation
    // ===========================================================================
    if (type === 'contract' && prompt) {
      let result = await aiService.generateContractContent(prompt)
      
      // Try to format as JSON if possible
      try {
        result = JSON.stringify(JSON.parse(result), null, 2)
      } catch { }
      
      return NextResponse.json({
        success: true,
        content: result,
        type: 'text-content',
        timestamp: new Date().toISOString(),
      })
    }

    // ===========================================================================
    // CASE 5: Layout update
    // ===========================================================================
    if (type === 'layout' && prompt) {
      const { currentContext } = body
      const elements = await aiService.generateLayoutUpdate(prompt, currentContext || '[]')
      
      return NextResponse.json({
        success: true,
        content: elements,
        type: 'template-elements',
        timestamp: new Date().toISOString(),
      })
    }

    // ===========================================================================
    // CASE 6: Markdown generation
    // ===========================================================================
    if (type === 'markdown' && prompt) {
      const result = await aiService.generateMarkdownFromPrompt(prompt)
      
      return NextResponse.json({
        success: true,
        content: result,
        type: 'markdown',
        timestamp: new Date().toISOString(),
      })
    }

    // ===========================================================================
    // CASE 7: General document generation
    // ===========================================================================
    if (topic && documentType) {
      const result = await aiService.generateDocumentContent(topic, documentType)
      
      return NextResponse.json({
        success: true,
        content: result,
        type: 'text-content',
        timestamp: new Date().toISOString(),
      })
    }

    // ===========================================================================
    // CASE 8: Generic prompt (fallback)
    // ===========================================================================
    if (prompt) {
      const result = await aiService.generateDocumentContent(prompt, 'document')
      
      return NextResponse.json({
        success: true,
        content: result,
        type: 'text-content',
        timestamp: new Date().toISOString(),
      })
    }

    // No valid parameters
    return NextResponse.json(
      { 
        error: 'Missing required parameters', 
        required: 'templateId + templateData + prompt OR type + prompt'
      },
      { status: 400 }
    )

  } catch (err: any) {
    console.error('AI Service Error:', err)
    
    return NextResponse.json(
      {
        error: 'AI service error',
        details: err.message,
        suggestion: 'Please try again or check your API key configuration'
      },
      { status: 500 }
    )
  }
}

// =============================================================================
// Cleanup old rate limit entries every hour
// =============================================================================
setInterval(() => {
  const now = Date.now()
  for (const [ip, data] of userRequests.entries()) {
    if (now - data.timestamp > 3600000) {
      userRequests.delete(ip)
    }
  }
}, 3600000)
