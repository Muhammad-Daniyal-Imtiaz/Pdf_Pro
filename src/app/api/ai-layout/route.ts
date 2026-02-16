import { NextRequest, NextResponse } from 'next/server'
import { aiService } from '@/app/lib/ai-service'
import { processAIGeneratedElements, preventElementCollisions } from '@/app/lib/server-text-measurement'

export async function POST(req: NextRequest) {
    try {
        const { prompt, context } = await req.json()

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
        }

        console.log(`🧠 Processing Layout Intelligence for prompt: "${prompt.substring(0, 50)}..."`)

        const layoutChanges = await aiService.generateLayoutUpdate(prompt, context || '[]')

        // Process AI-generated elements to ensure proper dimensions and no truncation
        console.log(`📏 Processing ${layoutChanges.length} elements for optimal dimensions...`)
        let processedChanges = processAIGeneratedElements(layoutChanges)
        
        // Prevent element collisions
        processedChanges = preventElementCollisions(processedChanges)

        console.log(`✅ AI generated ${processedChanges.length} layout changes with auto-height`)

        return NextResponse.json({
            success: true,
            changes: processedChanges
        })

    } catch (error: any) {
        console.error('❌ AI Layout Intelligence Error:', error)
        return NextResponse.json({
            error: error.message || 'Failed to generate layout updates'
        }, { status: 500 })
    }
}
