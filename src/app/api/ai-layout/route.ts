import { NextRequest, NextResponse } from 'next/server'
import { aiService } from '@/app/lib/ai-service'
import { processAIGeneratedElements, findNextAvailableY, LayoutBounds } from '@/app/lib/server-text-measurement'

/**
 * PRODUCTION-GRADE AI Layout API
 * Processes AI-generated layouts with full component support and pixel-perfect precision
 */
export async function POST(req: NextRequest) {
    const startTime = Date.now()
    
    try {
        const { prompt, context, pageCount = 1 } = await req.json()

        if (!prompt) {
            return NextResponse.json({ 
                success: false,
                error: 'Prompt is required',
                details: 'Please provide a prompt for AI layout generation'
            }, { status: 400 })
        }

        console.log(`🧠 Processing Layout Intelligence for: "${prompt.substring(0, 50)}..." (${pageCount} page${pageCount > 1 ? 's' : ''})`)

        // Generate layout from AI with enhanced error handling
        let layoutChanges
        try {
            layoutChanges = await aiService.generateLayoutUpdate(prompt, context || '[]')
        } catch (aiError) {
            console.error('AI Service Error:', aiError)
            return NextResponse.json({
                success: false,
                error: 'AI generation failed',
                details: aiError instanceof Error ? aiError.message : 'Unknown AI error'
            }, { status: 500 })
        }

        if (!layoutChanges || !Array.isArray(layoutChanges) || layoutChanges.length === 0) {
            return NextResponse.json({
                success: false,
                error: 'No layout elements generated',
                details: 'AI failed to generate any layout elements'
            }, { status: 500 })
        }

        // Process and enhance AI-generated elements
        console.log(`📏 Processing ${layoutChanges.length} elements for production...`)
        
        // First pass: ensure all elements have proper dimensions
        let processedChanges
        try {
            processedChanges = processAIGeneratedElements(layoutChanges)
        } catch (processingError) {
            console.error('Element Processing Error:', processingError)
            return NextResponse.json({
                success: false,
                error: 'Element processing failed',
                details: processingError instanceof Error ? processingError.message : 'Processing error'
            }, { status: 500 })
        }
        
        // Distribute elements across pages with intelligent layout
        const pages: any[] = []
        const elementsPerPage = Math.max(1, Math.ceil(processedChanges.length / pageCount))
        
        for (let pageIdx = 0; pageIdx < pageCount; pageIdx++) {
            const startIndex = pageIdx * elementsPerPage
            const endIndex = Math.min(startIndex + elementsPerPage, processedChanges.length)
            const pageElements = processedChanges.slice(startIndex, endIndex)
            
            // Second pass: professional styling and collision prevention
            const existingElements: LayoutBounds[] = []
            const processedPageElements = pageElements.map((change, index) => {
                const isTextElement = ['heading', 'paragraph', 'text', 'link'].includes(change.type)
                const isContainer = change.type === 'container'
                const isLine = change.type === 'line'
                const isIcon = change.type === 'social-icon'
                const isImage = change.type === 'image'
                
                // Calculate proper dimensions with production-grade precision
                const width = change.style?.width || (change.type === 'heading' ? 674 : 500)
                const height = change.style?.height || (isTextElement ? 60 : 100)
                
                const newElement: LayoutBounds = {
                    x: change.x || 60,
                    y: change.y || 80,
                    width,
                    height
                }
                
                // Smart collision prevention
                const adjustedY = findNextAvailableY(newElement, existingElements, newElement.y, 30)
                
                // Add to existing elements for next iteration
                existingElements.push({
                    ...newElement,
                    y: adjustedY
                })
                
                // Professional styling based on element type
                let enhancedStyle = { ...change.style }
                
                // HEADING: Bold, centered, full width
                if (change.type === 'heading') {
                    enhancedStyle = {
                        ...enhancedStyle,
                        width: 674,
                        fontWeight: 700, // BOLD heading
                        textAlign: enhancedStyle.textAlign || 'center',
                        resizeMode: 'auto-height',
                        color: enhancedStyle.color || '#1a1a1a',
                        fontSize: enhancedStyle.fontSize || 32,
                    }
                }
                
                // PARAGRAPH: Body text with proper line height
                if (change.type === 'paragraph') {
                    enhancedStyle = {
                        ...enhancedStyle,
                        width: enhancedStyle.width || 500,
                        resizeMode: 'auto-height',
                        fontSize: enhancedStyle.fontSize || 14,
                        fontWeight: 400,
                        lineHeight: 1.6,
                        color: enhancedStyle.color || '#374151',
                    }
                }
                
                // TEXT: Small labels/metadata
                if (change.type === 'text') {
                    enhancedStyle = {
                        ...enhancedStyle,
                        width: enhancedStyle.width || 300,
                        fontSize: enhancedStyle.fontSize || 12,
                        color: enhancedStyle.color || '#64748b',
                        resizeMode: enhancedStyle.resizeMode || 'auto-width',
                    }
                }
                
                // CONTAINER: Cards with subtle styling
                if (change.type === 'container') {
                    enhancedStyle = {
                        ...enhancedStyle,
                        backgroundColor: enhancedStyle.backgroundColor || '#f8fafc',
                        borderRadius: enhancedStyle.borderRadius || 8,
                        borderWidth: enhancedStyle.borderWidth ?? 1,
                        borderColor: enhancedStyle.borderColor || '#e2e8f0',
                        padding: enhancedStyle.padding || 16,
                        resizeMode: 'auto-height',
                    }
                }
                
                // LINE: Dividers
                if (change.type === 'line') {
                    enhancedStyle = {
                        ...enhancedStyle,
                        backgroundColor: enhancedStyle.backgroundColor || '#cbd5e1',
                        height: enhancedStyle.height || 2,
                    }
                }
                
                // SOCIAL-ICON: Fixed size
                if (change.type === 'social-icon') {
                    enhancedStyle = {
                        ...enhancedStyle,
                        width: enhancedStyle.width || 24,
                        height: enhancedStyle.height || 24,
                        resizeMode: 'fixed',
                    }
                }
                
                // IMAGE: Fixed size
                if (change.type === 'image') {
                    enhancedStyle = {
                        ...enhancedStyle,
                        resizeMode: 'fixed',
                    }
                }
                
                // LINK: Colored text
                if (change.type === 'link') {
                    enhancedStyle = {
                        ...enhancedStyle,
                        color: '#2563eb',
                        resizeMode: 'auto-width',
                    }
                }
                
                return {
                    ...change,
                    pageIndex: pageIdx,
                    y: adjustedY,
                    style: enhancedStyle
                }
            })
            
            pages.push(...processedPageElements)
        }
        
        console.log(`✅ Processed ${processedChanges.length} elements across ${pageCount} page${pageCount > 1 ? 's' : ''} with professional styling`)

        return NextResponse.json({
            success: true,
            changes: pages.flat(),
            meta: {
                elementCount: processedChanges.length,
                pageCount: pageCount,
                types: processedChanges.reduce((acc, el) => {
                    acc[el.type] = (acc[el.type] || 0) + 1
                    return acc
                }, {} as Record<string, number>)
            }
        })

    } catch (error: any) {
        console.error('❌ AI Layout Intelligence Error:', error)
        return NextResponse.json({
            error: error.message || 'Failed to generate layout updates'
        }, { status: 500 })
    }
}
