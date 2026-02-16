import { NextRequest, NextResponse } from 'next/server'
import { aiService } from '@/app/lib/ai-service'
import { processAIGeneratedElements, findNextAvailableY, LayoutBounds } from '@/app/lib/server-text-measurement'

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
        
        // Prevent element collisions with smart positioning
        // If elements overlap, find next available Y position
        const existingElements: LayoutBounds[] = []
        processedChanges = processedChanges.map((change, index) => {
            const newElement: LayoutBounds = {
                x: change.x || 60,
                y: change.y || 80,
                width: change.style?.width || 300,
                height: change.style?.height || 60
            }
            
            // Check if this position would collide with existing elements
            const adjustedY = findNextAvailableY(newElement, existingElements, newElement.y, 30)
            
            // Add to existing elements for next iteration
            existingElements.push({
                ...newElement,
                y: adjustedY
            })
            
            return {
                ...change,
                y: adjustedY,
                style: {
                    ...change.style,
                    // Force full width for headings to allow proper text wrapping
                    width: change.type === 'heading' ? 674 : (change.style?.width || 300),
                    // Force auto-height for all text elements to prevent truncation
                    resizeMode: 'auto-height'
                }
            }
        })
        
        console.log(`✅ AI generated ${processedChanges.length} layout changes with collision prevention`)

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
