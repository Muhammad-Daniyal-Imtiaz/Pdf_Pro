/**
 * text-measurement-service.ts
 * Provides pixel-perfect text measurements using HTML Canvas API
 */

export interface TextStyle {
    fontFamily: string
    fontSize: number
    fontWeight: string | number
    fontStyle?: string
    lineHeight: number
}

export interface MeasurementResult {
    width: number
    height: number
    lines: string[]
    actualBoundingBoxHeight: number
    isOverflowing: boolean
    overflowHeight: number
}

class TextMeasurementService {
    private canvas: HTMLCanvasElement | null = null
    private cache: Map<string, MeasurementResult> = new Map()
    private maxCacheSize = 1000

    private getCanvasContext(): CanvasRenderingContext2D {
        if (!this.canvas) {
            this.canvas = document.createElement('canvas')
        }
        const ctx = this.canvas.getContext('2d')
        if (!ctx) throw new Error('Could not get canvas context')
        return ctx
    }

    private getCacheKey(text: string, style: TextStyle, maxWidth?: number): string {
        return `${text}|${style.fontFamily}|${style.fontSize}|${style.fontWeight}|${style.lineHeight}|${maxWidth || 'none'}`
    }

    public measureText(text: string, style: TextStyle, maxWidth?: number): MeasurementResult {
        const cacheKey = this.getCacheKey(text, style, maxWidth)
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey)!
        }

        const ctx = this.getCanvasContext()
        const fontStr = `${style.fontStyle || 'normal'} ${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`
        ctx.font = fontStr

        const lines: string[] = []
        let currentWidth = 0
        let totalHeight = 0

        if (!maxWidth || maxWidth <= 0) {
            // No wrapping
            const words = text.split('\n')
            words.forEach(line => {
                lines.push(line)
                const metrics = ctx.measureText(line)
                currentWidth = Math.max(currentWidth, metrics.width)
            })
            totalHeight = lines.length * style.fontSize * style.lineHeight
        } else {
            // Word wrapping
            const paragraphs = text.split('\n')
            paragraphs.forEach(paragraph => {
                if (paragraph === '') {
                    lines.push('')
                    return
                }
                const words = paragraph.split(' ')
                let currentLine = ''

                words.forEach(word => {
                    const testLine = currentLine ? `${currentLine} ${word}` : word
                    const metrics = ctx.measureText(testLine)
                    if (metrics.width > maxWidth && currentLine) {
                        lines.push(currentLine)
                        currentLine = word
                    } else {
                        currentLine = testLine
                    }
                })
                lines.push(currentLine)
            })
            currentWidth = maxWidth
            totalHeight = lines.length * style.fontSize * style.lineHeight
        }

        const result: MeasurementResult = {
            width: Math.ceil(currentWidth),
            height: Math.ceil(totalHeight),
            lines,
            actualBoundingBoxHeight: style.fontSize, // Simplification
            isOverflowing: false,
            overflowHeight: 0
        }

        // Cache cleanup if needed
        if (this.cache.size >= this.maxCacheSize) {
            const firstKey = this.cache.keys().next().value
            this.cache.delete(firstKey)
        }

        this.cache.set(cacheKey, result)
        return result
    }

    public checkOverflow(
        text: string,
        style: TextStyle,
        containerWidth: number,
        containerHeight: number,
        padding: number = 8
    ) {
        const availableWidth = containerWidth - (padding * 2)
        const measurement = this.measureText(text, style, availableWidth)

        const isOverflowing = measurement.height > (containerHeight - (padding * 2))
        const overflowHeight = Math.max(0, measurement.height - (containerHeight - (padding * 2)))
        const overflowLines = Math.ceil(overflowHeight / (style.fontSize * style.lineHeight))

        return {
            isOverflowing,
            overflowHeight,
            overflowLines
        }
    }

    public clearCache() {
        this.cache.clear()
    }
}

let instance: TextMeasurementService | null = null

export const getTextMeasurementService = () => {
    if (!instance) {
        instance = new TextMeasurementService()
    }
    return instance
}
