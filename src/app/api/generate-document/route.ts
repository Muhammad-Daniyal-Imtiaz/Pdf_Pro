import { NextRequest, NextResponse } from 'next/server'
import { generateCvDocumentFromTemplate, analyzeTemplateContamination } from '@/app/lib/ai-service-document'
import { mapCvDocumentToTemplate } from '@/app/lib/ai-config'
import { sanitizeContent } from '@/app/lib/sanitize'

export const runtime = 'nodejs'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

const userHistory = new Map<string, { key: string; document: any; template: any; createdAt: number }[]>()
const userRequests = new Map<string, { count: number; timestamp: number }>()

function sanitizeTemplateStrings(value: any): any {
  if (value == null) return value
  if (typeof value === 'string') {
    return sanitizeContent(value)
  }
  if (Array.isArray(value)) {
    return value.map(v => sanitizeTemplateStrings(v))
  }
  if (typeof value === 'object') {
    const result: any = {}
    Object.entries(value).forEach(([k, v]) => {
      result[k] = sanitizeTemplateStrings(v)
    })
    return result
  }
  return value
}

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

    const { document, sanitizedTemplateSchema, originalTemplateStrings } =
      await generateCvDocumentFromTemplate({
        templateId,
        templateSchema,
        rawText: rawCvText,
        locale,
        idempotencyKey,
        revision
      })

    const filledTemplate = mapCvDocumentToTemplate(templateId, sanitizedTemplateSchema, document)
    const sanitizedTemplate = sanitizeTemplateStrings(filledTemplate)

    const contamination = analyzeTemplateContamination(document, originalTemplateStrings)

    recordHistory(ip, document.meta.idempotencyKey, document, sanitizedTemplate)

    const durationMs = Date.now() - start

    return NextResponse.json({
      success: true,
      document,
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

