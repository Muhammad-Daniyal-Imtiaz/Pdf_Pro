import { NextRequest, NextResponse } from 'next/server'

const userRequests = new Map<string, { count: number; timestamp: number }>()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, role, experience, topic, documentType, prompt } = body

    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const now = Date.now()
    const userData = userRequests.get(ip) || { count: 0, timestamp: now }

    // Reset per minute
    if (now - userData.timestamp > 60000) {
      userData.count = 0
      userData.timestamp = now
    }

    if (userData.count >= 10) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again in 1 minute.' },
        { status: 429 }
      )
    }

    userData.count++
    userRequests.set(ip, userData)

    const { aiService } = await import('@/app/lib/ai-service')

    let result = ''

    if (type === 'cv') {
      result = await aiService.generateCVContent(role, experience)
    }

    else if (type === 'contract') {
      result = await aiService.generateContractContent(prompt)
      try {
        result = JSON.stringify(JSON.parse(result), null, 2)
      } catch { }
    }

    else {
      result = await aiService.generateDocumentContent(topic, documentType)
    }

    return NextResponse.json({
      success: true,
      content: result,
      timestamp: new Date().toISOString(),
    })
  } catch (err: any) {
    return NextResponse.json(
      {
        error: 'AI service unavailable.',
        details: err.message,
      },
      { status: 500 }
    )
  }
}

// Cleanup every hour
setInterval(() => {
  const now = Date.now()
  for (const [ip, data] of userRequests.entries()) {
    if (now - data.timestamp > 3600000) {
      userRequests.delete(ip)
    }
  }
}, 3600000)
