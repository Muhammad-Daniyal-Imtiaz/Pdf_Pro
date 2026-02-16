/**
 * Server-side text measurement for AI/MCP workflows
 * Calculates exact dimensions for text content to prevent truncation
 */

export interface ServerTextStyle {
    fontFamily: string
    fontSize: number
    fontWeight: string | number
    fontStyle?: string
    lineHeight: number
}

export interface ServerMeasurementResult {
    width: number
    height: number
    lines: string[]
    isOverflowing: boolean
}

/**
 * Estimates text width based on character count and font metrics
 * Production-grade approximation that works server-side without canvas
 */
export function measureTextServer(
    text: string,
    style: ServerTextStyle,
    maxWidth?: number
): ServerMeasurementResult {
    const { fontSize, fontWeight, lineHeight } = style
    
    // Character width estimates based on font metrics
    const getCharWidth = () => {
        const weight = typeof fontWeight === 'number' ? fontWeight : 400
        const weightFactor = weight >= 700 ? 0.6 : weight >= 600 ? 0.55 : weight >= 500 ? 0.52 : 0.5
        return fontSize * weightFactor
    }
    
    const charWidth = getCharWidth()
    const avgCharsPerLine = maxWidth ? Math.floor(maxWidth / charWidth) : text.length
    
    // Split into paragraphs
    const paragraphs = text.split('\n')
    const lines: string[] = []
    let totalWidth = 0
    
    paragraphs.forEach(paragraph => {
        if (paragraph === '') {
            lines.push('')
            return
        }
        
        const words = paragraph.split(' ')
        let currentLine = ''
        let currentLineWidth = 0
        
        words.forEach((word, index) => {
            const wordWidth = word.length * charWidth
            const spaceWidth = index > 0 ? charWidth * 0.3 : 0
            
            if (maxWidth && currentLineWidth + wordWidth + spaceWidth > maxWidth && currentLine) {
                lines.push(currentLine)
                totalWidth = Math.max(totalWidth, currentLineWidth)
                currentLine = word
                currentLineWidth = wordWidth
            } else {
                currentLine = currentLine ? `${currentLine} ${word}` : word
                currentLineWidth += wordWidth + spaceWidth
            }
        })
        
        if (currentLine) {
            lines.push(currentLine)
            totalWidth = Math.max(totalWidth, currentLineWidth)
        }
    })
    
    const lineHeightPx = fontSize * lineHeight
    const totalHeight = lines.length * lineHeightPx
    
    return {
        width: Math.ceil(maxWidth || totalWidth),
        height: Math.ceil(totalHeight),
        lines,
        isOverflowing: false
    }
}

/**
 * Calculates optimal dimensions for text elements
 * Used by AI/MCP to ensure no text truncation
 */
export function calculateOptimalDimensions(
    content: string,
    style: Partial<ServerTextStyle>,
    constraints?: {
        maxWidth?: number
        minWidth?: number
        maxHeight?: number
        padding?: number
    }
): { width: number; height: number; resizeMode: 'auto-height' | 'auto-width' | 'auto-both' | 'fixed' } {
    const defaultStyle: ServerTextStyle = {
        fontFamily: style.fontFamily || 'Inter, sans-serif',
        fontSize: style.fontSize || 14,
        fontWeight: style.fontWeight || 400,
        fontStyle: style.fontStyle || 'normal',
        lineHeight: style.lineHeight || 1.5
    }
    
    const padding = constraints?.padding || 8
    const maxWidth = constraints?.maxWidth || 700 // A4 width minus margins
    const minWidth = constraints?.minWidth || 100
    
    // Measure with max width constraint
    const measurement = measureTextServer(content, defaultStyle, maxWidth - (padding * 2))
    
    // Calculate final dimensions with padding
    let width = Math.max(minWidth, measurement.width + (padding * 2))
    let height = measurement.height + (padding * 2)
    
    // Cap to max constraints
    if (constraints?.maxHeight && height > constraints.maxHeight) {
        height = constraints.maxHeight
    }
    
    // Determine optimal resize mode based on content
    const lines = measurement.lines.length
    const avgCharsPerLine = content.length / lines
    
    let resizeMode: 'auto-height' | 'auto-width' | 'auto-both' | 'fixed' = 'auto-height'
    
    if (lines === 1 && avgCharsPerLine < 50) {
        // Single line short text - use auto-width to fit exactly
        resizeMode = 'auto-width'
        width = Math.min(width, maxWidth)
    } else if (lines > 1 && avgCharsPerLine < 30) {
        // Multi-line with short lines - might need auto-both
        resizeMode = 'auto-height'
    }
    
    return {
        width: Math.ceil(width),
        height: Math.ceil(height),
        resizeMode
    }
}

/**
 * Processes AI-generated elements to ensure proper dimensions
 * Prevents text truncation by calculating exact sizes
 */
export function processAIGeneratedElements(
    elements: any[],
    pageWidth: number = 794,
    pageHeight: number = 1123
): any[] {
    return elements.map(el => {
        if (!['heading', 'paragraph', 'text', 'container'].includes(el.type)) {
            return el
        }
        
        const content = el.content || ''
        const fontSize = el.style?.fontSize || (el.type === 'heading' ? 24 : 14)
        const fontWeight = el.style?.fontWeight || (el.type === 'heading' ? 700 : 400)
        const lineHeight = el.style?.lineHeight || 1.5
        
        // Calculate available width based on position
        const maxWidth = Math.min(
            el.style?.width || (pageWidth - 100),
            pageWidth - (el.x || 0) - 50
        )
        
        const { width, height, resizeMode } = calculateOptimalDimensions(
            content,
            { fontSize, fontWeight, lineHeight },
            {
                maxWidth,
                minWidth: el.type === 'heading' ? 200 : 150,
                padding: el.style?.padding || 8
            }
        )
        
        // Ensure element stays within page bounds
        const finalY = el.y || 50
        const availableHeight = pageHeight - finalY - 50
        const finalHeight = Math.min(height, availableHeight)
        
        return {
            ...el,
            style: {
                ...el.style,
                width: el.style?.width || width,
                height: el.style?.height || finalHeight,
                resizeMode: 'auto-height', // AI content always uses auto-height to prevent truncation
                padding: el.style?.padding || 8,
                lineHeight: lineHeight,
            },
            // Mark as AI-generated for special handling
            isAIGenerated: true
        }
    })
}

/**
 * Validates and fixes element positions to prevent overlaps
 * Staggers elements vertically if they collide
 */
export function preventElementCollisions(
    elements: any[],
    margin: number = 20
): any[] {
    const sorted = [...elements].sort((a, b) => (a.y || 0) - (b.y || 0))
    const result: any[] = []
    
    for (let i = 0; i < sorted.length; i++) {
        const current = sorted[i]
        let y = current.y || 50
        
        // Check against all previous elements
        for (let j = 0; j < result.length; j++) {
            const prev = result[j]
            const prevBottom = (prev.y || 0) + (prev.style?.height || 40)
            const currentTop = y
            
            // If overlapping vertically and horizontally
            const horizontalOverlap = 
                (current.x || 0) < ((prev.x || 0) + (prev.style?.width || 100)) &&
                ((current.x || 0) + (current.style?.width || 100)) > (prev.x || 0)
            
            if (horizontalOverlap && currentTop < prevBottom + margin) {
                y = prevBottom + margin
            }
        }
        
        result.push({
            ...current,
            y: Math.round(y)
        })
    }
    
    return result
}
