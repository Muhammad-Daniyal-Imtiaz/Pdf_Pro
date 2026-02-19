import { NextRequest, NextResponse } from 'next/server'
import { generateCvDocumentFromTemplate, analyzeTemplateContamination } from '@/app/lib/ai-service-document'
import { sanitizeContent } from '@/app/lib/sanitize'

export const runtime = 'nodejs'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

const userHistory = new Map<string, { key: string; document: any; template: any; createdAt: number }[]>()
const userRequests = new Map<string, { count: number; timestamp: number }>()

function recordHistory(userId: string, key: string, document: any, template: any) {
  const existing = userHistory.get(userId) || []
  const entry = { key, document, template, createdAt: Date.now() }
  existing.unshift(entry)
  const trimmed = existing.slice(0, 10)
  userHistory.set(userId, trimmed)
}

export async function POST(request: NextRequest) {
  const start = Date.now()
  try {
    const body = await request.json()
    const {
      templateId,
      templateSchema,
      rawCvText,
      locale = 'en',
      idempotencyKey,
      revision,
      rollbackKey
    } = body || {}

    if (rollbackKey) {
      const ip = request.headers.get('x-forwarded-for') || 'unknown'
      const history = userHistory.get(ip) || []
      const match = history.find(h => h.key === rollbackKey)
      if (!match) {
        return NextResponse.json(
          { error: 'Rollback key not found' },
          { status: 404 }
        )
      }
      return NextResponse.json({
        success: true,
        document: match.document,
        template: match.template,
        meta: {
          rolledBackFromKey: rollbackKey
        }
      })
    }

    if (!templateId || !templateSchema || !rawCvText) {
      return NextResponse.json(
        {
          error: 'templateId, templateSchema, and rawCvText are required'
        },
        { status: 400 }
      )
    }

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

    // Stage 1: Generate Document using AI Document Studio
    // The new logic is "template-aware" and fills elements directly based on the JSON schema
    const result = await generateCvDocumentFromTemplate({
      templateId,
      templateSchema,
      rawText: rawCvText,
      locale,
      idempotencyKey,
      revision
    })

    if (!result.success) {
      throw new Error('AI Document Studio failed to generate content')
    }

    // Stage 2: Post-generation hygiene and safety
    const sanitizedTemplate = {
      ...templateSchema,
      pages: templateSchema.pages.map((page: any, pIdx: number) => ({
        ...page,
        elements: result.elements
          .filter((el: any) => el.pageIndex === pIdx)
          .map((el: any) => ({
            ...el,
            content: sanitizeContent(el.content || '')
          }))
      }))
    }

    // Stage 3: Quality metrics (how much of original template remains?)
    const originalElements = templateSchema.pages.flatMap((p: any) => p.elements || [])
    const contamination = analyzeTemplateContamination(result.elements, originalElements)

    // Stage 4: Record history for rollback protection
    recordHistory(ip, result.document.meta.idempotencyKey, result.document, sanitizedTemplate)

    const durationMs = Date.now() - start

    return NextResponse.json({
      success: true,
      document: result.document,
      template: sanitizedTemplate,
      contamination,
      performance: {
        durationMs
      }
    })
  } catch (error: any) {
    console.error('generate-document error:', error)
    return NextResponse.json(
      {
        error: error?.message || 'Failed to generate document',
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    )
  }
}

