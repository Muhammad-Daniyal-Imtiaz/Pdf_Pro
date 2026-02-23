// app/api/generate-ai-pdf/route.ts - ADVANCED SMART PDF GENERATOR (Architect v3)
import { NextRequest, NextResponse } from 'next/server'
import { generateSmartPDF } from '@/app/lib/ai-service-smart-pdf'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      prompt,
      documentType = 'report',
      pageCount = 1,
      style,
      role,
      experience,
      topic,
      designTokens,
      archetypeHint
    } = body || {}

    const effectivePrompt =
      (prompt && String(prompt).trim()) ||
      (topic && String(topic).trim()) ||
      (role && String(role).trim()) ||
      'Professional document for a modern SaaS product'

    const safePageCount = Math.max(1, Math.min(10, Number(pageCount) || 1))
    const docType =
      documentType === 'cv' ||
      documentType === 'proposal' ||
      documentType === 'report' ||
      documentType === 'letter' ||
      documentType === 'brochure' ||
      documentType === 'invoice'
        ? documentType
        : 'report'

    const result = await generateSmartPDF({
      prompt: effectivePrompt,
      documentType: docType,
      pageCount: safePageCount,
      style,
      role,
      experience,
      topic,
      // Forward rich styling hints to the Architect engine
      designTokens,
      archetypeHint
    } as any)

    return NextResponse.json({
      success: true,
      pages: result.pages,
      width: result.width,
      height: result.height
    })
  } catch (error: any) {
    console.error('❌ /api/generate-ai-pdf failed:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate AI PDF layout' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'Ready - Advanced Smart PDF Generator (Architect v3)',
    endpoint: '/api/generate-ai-pdf',
    method: 'POST'
  })
}
