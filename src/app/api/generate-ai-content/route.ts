import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { type, role, experience, topic, documentType, prompt } = await request.json()

    // Import AI service dynamically
    const { aiService } = await import('../../lib/ai-service')

    let generatedContent = ''
    
    if (type === 'cv') {
      generatedContent = await aiService.generateCVContent(role, experience)
    } else {
      generatedContent = await aiService.generateDocumentContent(topic, documentType)
    }

    // Post-process the content
    if (type === 'cv') {
      // Format CV content properly
      generatedContent = generatedContent
        .replace(/\n\n/g, '\n\n')
        .replace(/•/g, '\n•')
        .trim()
    }

    return NextResponse.json({ content: generatedContent })
  } catch (error) {
    console.error('AI Content Generation Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate content with AI' },
      { status: 500 }
    )
  }
}