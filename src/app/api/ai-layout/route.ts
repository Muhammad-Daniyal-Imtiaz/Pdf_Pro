import { NextRequest, NextResponse } from 'next/server'
import { aiService } from '@/app/lib/ai-service'

export async function POST(req: NextRequest) {
    try {
        const { prompt, context } = await req.json()

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
        }

        console.log(`🧠 Processing Layout Intelligence for prompt: "${prompt.substring(0, 50)}..."`)

        const layoutChanges = await aiService.generateLayoutUpdate(prompt, context || '[]')

        console.log(`✅ AI generated ${layoutChanges.length} layout changes`)

        return NextResponse.json({
            success: true,
            changes: layoutChanges
        })

    } catch (error: any) {
        console.error('❌ AI Layout Intelligence Error:', error)
        return NextResponse.json({
            error: error.message || 'Failed to generate layout updates'
        }, { status: 500 })
    }
}
