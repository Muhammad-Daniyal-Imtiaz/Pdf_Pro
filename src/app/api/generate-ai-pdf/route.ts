import { NextRequest, NextResponse } from 'next/server'
import { aiService } from '@/app/lib/ai-service'
import { processAIGeneratedElements, findNextAvailableY, LayoutBounds } from '@/app/lib/server-text-measurement'
import { A4_WIDTH, A4_HEIGHT } from '@/app/store/useEditorStore'
import { NextRequest as NodeNextRequest } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { prompt, documentType = 'report', pageCount = 1 } = await req.json()

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const rawElements = await aiService.generateFullDocumentLayout(documentType, prompt)

    if (!Array.isArray(rawElements) || rawElements.length === 0) {
      return NextResponse.json({ error: 'No elements generated from AI' }, { status: 500 })
    }

    const measuredElements = processAIGeneratedElements(rawElements, A4_WIDTH, A4_HEIGHT)

    const pages: any[] = []
    const elementsPerPage = Math.max(1, Math.ceil(measuredElements.length / pageCount))

    for (let pageIdx = 0; pageIdx < pageCount; pageIdx++) {
      const startIndex = pageIdx * elementsPerPage
      const endIndex = Math.min(startIndex + elementsPerPage, measuredElements.length)
      const pageElements = measuredElements.slice(startIndex, endIndex)

      const existing: LayoutBounds[] = []
      const processedPageElements = pageElements.map((el) => {
        const isTextElement = ['heading', 'paragraph', 'text', 'link'].includes(el.type)
        const width = el.style?.width || (el.type === 'heading' ? 674 : 500)
        const height = el.style?.height || (isTextElement ? 60 : 100)

        const bounds: LayoutBounds = {
          x: el.x || 60,
          y: el.y || 80,
          width,
          height,
        }

        const adjustedY = findNextAvailableY(bounds, existing, bounds.y, 30)

        existing.push({ ...bounds, y: adjustedY })

        let style = { ...(el.style || {}) }

        if (el.type === 'heading') {
          style = {
            ...style,
            width: 674,
            fontWeight: 700,
            textAlign: style.textAlign || 'center',
            resizeMode: 'auto-height',
            color: style.color || '#1a1a1a',
            fontSize: style.fontSize || 32,
          }
        }

        if (el.type === 'paragraph') {
          style = {
            ...style,
            width: style.width || 500,
            resizeMode: 'auto-height',
            fontSize: style.fontSize || 14,
            fontWeight: 400,
            lineHeight: 1.6,
            color: style.color || '#374151',
          }
        }

        if (el.type === 'text') {
          style = {
            ...style,
            width: style.width || 300,
            fontSize: style.fontSize || 12,
            color: style.color || '#64748b',
            resizeMode: style.resizeMode || 'auto-width',
          }
        }

        if (el.type === 'container') {
          style = {
            ...style,
            backgroundColor: style.backgroundColor || '#f8fafc',
            borderRadius: style.borderRadius || 8,
            borderWidth: style.borderWidth ?? 1,
            borderColor: style.borderColor || '#e2e8f0',
            padding: style.padding || 16,
            resizeMode: 'auto-height',
          }
        }

        if (el.type === 'line') {
          style = {
            ...style,
            backgroundColor: style.backgroundColor || '#cbd5e1',
            height: style.height || 2,
          }
        }

        if (el.type === 'social-icon') {
          style = {
            ...style,
            width: style.width || 24,
            height: style.height || 24,
            resizeMode: 'fixed',
          }
        }

        if (el.type === 'image') {
          style = {
            ...style,
            resizeMode: 'fixed',
          }
        }

        if (el.type === 'link') {
          style = {
            ...style,
            color: '#2563eb',
            resizeMode: 'auto-width',
          }
        }

        return {
          ...el,
          pageIndex: pageIdx,
          y: adjustedY,
          style,
        }
      })

      pages.push({
        id: `page-${pageIdx}`,
        elements: processedPageElements,
      })
    }

    return NextResponse.json({
      success: true,
      pages,
      width: A4_WIDTH,
      height: A4_HEIGHT,
    })
  } catch (error: any) {
    console.error('Generate AI PDF error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to generate AI layout',
      },
      { status: 500 },
    )
  }
}

