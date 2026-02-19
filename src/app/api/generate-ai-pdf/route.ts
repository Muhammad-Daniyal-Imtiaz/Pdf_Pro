import { NextRequest, NextResponse } from 'next/server'
import { generateSmartPDF } from '@/app/lib/ai-service-smart-pdf'
import { A4_WIDTH, A4_HEIGHT } from '@/app/store/useEditorStore'

export const runtime = 'nodejs'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const start = Date.now()
  try {
    const body = await req.json()
    const {
      prompt,
      documentType = 'report',
      pageCount = 1,
      style = 'modern professional',
      role,
      experience,
      topic
    } = body

    if (!prompt && !topic && !role) {
      return NextResponse.json(
        { error: 'Insufficient information provided for AI generation' },
        { status: 400 }
      )
    }

    console.log(`📡 API: Dispatching to Smart PDF Architect [${documentType}]...`)

    try {
      // Stage 1: Generate layout via Architect Engine
      const layout = await generateSmartPDF({
        prompt: (prompt || topic || '').toString(),
        documentType: documentType as any,
        pageCount: Number(pageCount),
        style: style as any,
        role,
        experience,
        topic
      })

      if (!layout.pages || layout.pages.length === 0) {
        throw new Error('Architect failed to generate any pages (Empty Result)')
      }

      // Stage 2: Post-Architect Validation & Enhancement
      const processedPages = layout.pages.map((page, pIdx) => ({
        ...page,
        id: `page-${pIdx}`,
        elements: page.elements.map(el => {
          const isText = ['heading', 'paragraph', 'text', 'container'].includes(el.type)

          return {
            ...el,
            id: el.id || `el-${pIdx}-${Math.random().toString(36).substr(2, 9)}`,
            pageIndex: pIdx,
            // CRITICAL: Ensure elements don't bleed off A4
            x: Math.max(40, Math.min(el.x, 754 - (el.style?.width || 100))),
            y: Math.max(40, Math.min(el.y, 1083 - (el.style?.height || 50))),
            style: {
              ...el.style,
              resizeMode: isText ? 'auto-height' : 'fixed',
              // Production Polish: Add subtle shadows for cards
              boxShadow: el.type === 'container' ? '0 1px 3px rgba(0,0,0,0.05)' : undefined
            }
          }
        })
      }))

      const durationMs = Date.now() - start
      console.log(`✅ API: Layout generated successfully in ${durationMs}ms`)

      return NextResponse.json({
        success: true,
        pages: processedPages,
        width: A4_WIDTH,
        height: A4_HEIGHT,
        performance: { durationMs }
      })
    } catch (serviceError: any) {
      console.error('❌ Service Error (Architect):', serviceError)
      throw serviceError // Re-throw to be caught by outer catch for standardized JSON response
    }

  } catch (error: any) {
    console.error('❌ API Error [generate-ai-pdf]:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Architect failure',
        details: error.toString(),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

