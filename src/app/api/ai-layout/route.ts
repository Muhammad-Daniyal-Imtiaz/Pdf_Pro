// app/api/ai-layout/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// AI LAYOUT INTELLIGENCE ENGINE v3
// Modifies existing canvas layouts based on natural language instructions
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const runtime = 'nodejs'
export const maxDuration = 30
export const dynamic = 'force-dynamic'

const genAI = new GoogleGenerativeAI(
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
    ''
)

const LAYOUT_SYSTEM_PROMPT = `You are an expert PDF layout editor AI. You receive the CURRENT state of a PDF canvas and user instructions to modify it.

=== CANVAS ===
A4: 595px wide × 842px tall. Origin top-left. Safe zone: x:20-575, y:20-820.

=== YOUR TASK ===
Analyze the current elements and the user's instruction.
Return ONLY the elements that need to be MODIFIED or ADDED.
- To MODIFY an existing element: include its exact id with updated properties
- To ADD a new element: give it a NEW unique id starting with "new-"
- To DELETE an element: include { id: "...", _delete: true }
- If an element doesn't need changes, DO NOT include it in the response

=== ELEMENT SCHEMA ===
{ id, type("text"|"shape"|"line"|"image"|"social-icon"), x, y,
  content(for text), iconType(for social-icon), lineOrientation(for line),
  style: { width, height, fontSize, fontWeight, color, fontFamily,
           textAlign, backgroundColor, padding, lineHeight, zIndex, 
           borderRadius, opacity, letterSpacing } }

=== RULES ===
- NEVER move elements outside x:20-575 or y:20-820
- Preserve element IDs exactly as given (for modifications)
- Only return elements that actually changed
- For text elements, preserve existing content unless asked to change it
- When moving groups, maintain relative spacing between group members
- zIndex: shape=0, line=2, text=3, social-icon=3

=== RESPONSE FORMAT (strict JSON, NO markdown) ===
{ "changes": [ ...modified/new/deleted elements ], "summary": "brief description of what was changed" }
`

export async function POST(request: NextRequest) {
    let body: any
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const prompt = String(body.prompt || '').slice(0, 1000)
    const context = body.context

    if (!prompt) {
        return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    if (!context || !context.pages) {
        return NextResponse.json({ error: 'Canvas context is required' }, { status: 400 })
    }

    // Build context description — compact but complete
    const contextDescription = `CURRENT CANVAS STATE:
Pages: ${context.pageCount || context.pages?.length || 1}
${(context.pages || []).map((page: any, pi: number) => `
Page ${pi + 1} (${page.elements?.length || 0} elements):
${(page.elements || []).map((el: any) => `  [${el.id}] ${el.type} at (${el.x},${el.y}) size ${el.style?.width}×${el.style?.height}${el.content ? ` content: "${String(el.content).slice(0, 60)}${el.content.length > 60 ? '...' : ''}"` : ''}${el.style?.fontSize ? ` fontSize:${el.style.fontSize}` : ''}${el.style?.color ? ` color:${el.style.color}` : ''}${el.style?.backgroundColor ? ` bg:${el.style.backgroundColor}` : ''}${el.style?.fontWeight ? ` weight:${el.style.fontWeight}` : ''}${el.style?.zIndex !== undefined ? ` z:${el.style.zIndex}` : ''}`).join('\n')}`).join('\n')
        }

USER INSTRUCTION: "${prompt}"

Analyze the current state and return the minimal set of changes needed.`

    const model = genAI.getGenerativeModel({
        model: 'gemini-flash-latest',
        systemInstruction: LAYOUT_SYSTEM_PROMPT,
        generationConfig: {
            temperature: 0.4, // Lower temp for precise, predictable layout changes
            maxOutputTokens: 8192,
            responseMimeType: 'application/json',
        }
    })

    try {
        const response = await model.generateContent(contextDescription)
        const text = response.response.text()

        let result: any
        try {
            result = JSON.parse(text)
        } catch {
            const cleaned = text.replace(/^```(?: json) ?\n ? /m, '').replace(/\n ? ```$/m, '').trim()
            result = JSON.parse(cleaned)
        }

        if (!result.changes || !Array.isArray(result.changes)) {
            throw new Error('Response missing changes array')
        }

        // Clamp all returned elements to safe zone
        const safeChanges = result.changes.map((el: any) => {
            if (el._delete) return el
            const e = { ...el, style: { ...(el.style || {}) } }
            e.x = Math.max(20, Math.min(Number(e.x) || 20, 575))
            e.y = Math.max(20, Math.min(Number(e.y) || 20, 820))
            if (e.style.width) e.style.width = Math.min(Number(e.style.width), 575 - e.x + 20)
            if (e.style.height) e.style.height = Math.min(Number(e.style.height), 820 - e.y + 20)
            if (e.style.fontSize) e.style.fontSize = Math.max(7, Math.min(Number(e.style.fontSize), 72))
            return e
        })

        return NextResponse.json({
            success: true,
            changes: safeChanges,
            summary: result.summary || 'Layout updated',
            changesCount: safeChanges.length
        })

    } catch (err: any) {
        console.error('[ai-layout] Error:', err)
        return NextResponse.json(
            { error: err.message || 'Layout AI failed', success: false },
            { status: 500 }
        )
    }
}