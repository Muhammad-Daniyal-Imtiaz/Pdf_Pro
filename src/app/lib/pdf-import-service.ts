
import { A4_HEIGHT, A4_WIDTH, EditorElement, EditorPage } from '../store/useEditorStore'
// import * as pdfjsLib from 'pdfjs-dist'

// Set worker source logic - handled in the component usually, but we can try to set it here if needed.
// For now, we assume the caller (EditPage) ensures the worker is set up globally or passed.
// Actually, safely setting it here is better if possible, but the worker path is often relative to public.
// We'll let the component handle GlobalWorkerOptions for now to avoid SSR issues with `window`.

interface TextItem {
    str: string
    dir: string
    transform: number[]
    width: number
    height: number
    fontName: string
    hasEOL: boolean
}

interface PDFPageProxy {
    getViewport: (options: { scale: number }) => { width: number; height: number; convertToViewportPoint: (x: number, y: number) => number[] }
    getTextContent: () => Promise<{ items: TextItem[]; styles: any }>
    render: (params: any) => { promise: Promise<void> }
}

const FONT_MAPPING: Record<string, string> = {
    'TimesNewRoman': 'Times New Roman, serif',
    'Times-Roman': 'Times New Roman, serif',
    'Helvetica': 'Arial, sans-serif',
    'Arial': 'Arial, sans-serif',
    'Courier': 'Courier New, monospace',
    'Courier-New': 'Courier New, monospace',
    'Verdana': 'Verdana, sans-serif',
    'Georgia': 'Georgia, serif',
    'ComicSansMS': 'Comic Sans MS, cursive',
    'Trebuchet': 'Trebuchet MS, sans-serif',
    'Garamond': 'Garamond, serif',
    'Palatino': 'Palatino, serif',
    'BookAntiqua': 'Book Antiqua, serif',
}

const getFontFamily = (fontName: string): string => {
    const baseName = fontName.split('+').pop() || ''
    // Check for bold/italic in name to strip? 
    // Let's just lookup partial matches
    for (const key in FONT_MAPPING) {
        if (baseName.includes(key)) return FONT_MAPPING[key]
    }
    if (baseName.toLowerCase().includes('bold')) return 'Arial, sans-serif' // Fallback
    return 'Arial, sans-serif'
}

const getFontWeight = (fontName: string): number => {
    const lower = fontName.toLowerCase()
    if (lower.includes('bold') || lower.includes('bd')) return 700
    if (lower.includes('medium')) return 500
    if (lower.includes('light')) return 300
    return 400
}

const getFontStyle = (fontName: string): string => {
    if (fontName.toLowerCase().includes('italic') || fontName.toLowerCase().includes('it')) return 'italic'
    return 'normal'
}


// Helper to get most common color from samples
const getDominantColor = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number): string => {
    // Sample points around the box to find background color
    // We sample a bit further out (8-10px) to avoid letter anti-aliasing pixels
    const p1 = 4
    const p2 = 8
    const points = [
        // Above
        { x: x + width / 2, y: y - p1 },
        { x: x + width / 2, y: y - p2 },
        // Below
        { x: x + width / 2, y: y + height + p1 },
        { x: x + width / 2, y: y + height + p2 },
        // Left
        { x: x - p1, y: y + height / 2 },
        { x: x - p2, y: y + height / 2 },
        // Right
        { x: x + width + p1, y: y + height / 2 },
        { x: x + width + p2, y: y + height / 2 },
        // Corners
        { x: x - p1, y: y - p1 },
        { x: x + width + p1, y: y - p1 },
        { x: x - p1, y: y + height + p1 },
        { x: x + width + p1, y: y + height + p1 },
    ]

    const colorCounts: Record<string, number> = {}
    let maxCount = 0
    let dominant = 'rgba(255, 255, 255, 1)'

    points.forEach(p => {
        if (p.x < 0 || p.y < 0) return
        try {
            const pixel = ctx.getImageData(Math.round(p.x), Math.round(p.y), 1, 1).data
            if (pixel[3] < 50) return

            const color = `rgba(${pixel[0]}, ${pixel[1]}, ${pixel[2]}, 1)`
            colorCounts[color] = (colorCounts[color] || 0) + 1
            if (colorCounts[color] > maxCount) {
                maxCount = colorCounts[color]
                dominant = color
            }
        } catch (e) { }
    })
    return rgbaToHex(dominant)
}

// Helper to get text color by sampling multiple points inside the bounds
const getTextColor = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number): string => {
    // Sample a 3x3 grid in the middle 50% of the box to find the non-background color
    const samples: string[] = []
    const margin = 0.25

    for (let i = 1; i <= 3; i++) {
        for (let j = 1; j <= 3; j++) {
            const sx = x + (width * margin) + (width * (1 - margin * 2) * (i / 4))
            const sy = y + (height * margin) + (height * (1 - margin * 2) * (j / 4))

            try {
                const pixel = ctx.getImageData(Math.round(sx), Math.round(sy), 1, 1).data
                // Only consider it a "text" color if it has some non-white/non-transparent content
                // (Assuming background is usually white-ish)
                if (pixel[3] > 100 && (pixel[0] < 240 || pixel[1] < 240 || pixel[2] < 240)) {
                    samples.push(`rgba(${pixel[0]}, ${pixel[1]}, ${pixel[2]}, 1)`)
                }
            } catch (e) { }
        }
    }

    if (samples.length === 0) return '#000000' // Default to black

    const counts: Record<string, number> = {}
    let max = 0
    let best = '#000000'

    samples.forEach(c => {
        counts[c] = (counts[c] || 0) + 1
        if (counts[c] > max) {
            max = counts[c]
            best = c
        }
    })

    return rgbaToHex(best)
}

const rgbaToHex = (rgba: string) => {
    const parts = rgba.match(/\d+/g)
    if (!parts || parts.length < 3) return '#ffffff'
    const r = parseInt(parts[0]).toString(16).padStart(2, '0')
    const g = parseInt(parts[1]).toString(16).padStart(2, '0')
    const b = parseInt(parts[2]).toString(16).padStart(2, '0')
    return `#${r}${g}${b}`
}

export const extractPDFElements = async (file: File): Promise<{ pages: EditorPage[] }> => {
    // Dynamic Import
    const pdfjsLib = await import('pdfjs-dist')
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

    const pages: EditorPage[] = []

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)

        // 1. Render Page to Image (Context) first to get Colors
        const { image: backgroundImage, context } = await renderPageToContext(page)

        // 2. Process Text with Context for Color Sampling
        const elements = await processPage(page, i - 1, context)

        const bgId = `bg-${crypto.randomUUID()}`

        pages.push({
            id: `page-${crypto.randomUUID()}`,
            elements: [
                // Background MUST be first
                {
                    id: bgId,
                    type: 'image',
                    x: 0,
                    y: 0,
                    content: backgroundImage,
                    style: {
                        width: A4_WIDTH,
                        height: A4_HEIGHT,
                        zIndex: 0,
                        opacity: 1 // Default show
                    },
                    isImported: true, // Marker for "Background"
                    pageIndex: i - 1
                },
                ...elements
            ],
            backgroundImage: backgroundImage // redundant but useful for quick access?
        })
    }

    return { pages }
}

const processPage = async (page: any, pageIndex: number, ctx: CanvasRenderingContext2D | null): Promise<EditorElement[]> => {
    const viewportUnscaled = page.getViewport({ scale: 1 })
    const scale = A4_WIDTH / viewportUnscaled.width // Scale to fit our editor
    const viewport = page.getViewport({ scale })

    const textContent = await page.getTextContent()
    const items = textContent.items as TextItem[]

    if (items.length === 0) return []

    // 1. Convert to Viewport Coordinates
    const convertedItems = items.map(item => {
        const tx = item.transform
        const [x, y] = viewport.convertToViewportPoint(tx[4], tx[5])

        const pdfFontSize = Math.sqrt(tx[0] * tx[0] + tx[1] * tx[1])
        const fontSize = pdfFontSize * scale

        // Fix Y coordinate (Ascent approx)
        const adjustedY = y - (fontSize * 0.85)

        return {
            ...item,
            x,
            y: adjustedY,
            fontSize,
            width: item.width * scale,
            height: item.height * scale,
            originalTransform: tx
        }
    })

    // 2. Sort Items
    convertedItems.sort((a, b) => {
        if (Math.abs(a.y - b.y) > (Math.min(a.fontSize, b.fontSize) * 0.2)) {
            return a.y - b.y
        }
        return a.x - b.x
    })

    // 3. Merge Items
    const elements: EditorElement[] = []
    let currentGroup: typeof convertedItems = []

    const flushGroup = () => {
        if (currentGroup.length === 0) return

        const first = currentGroup[0]

        let minX = Infinity
        let minY = Infinity
        let maxX = -Infinity
        let maxBottom = -Infinity
        let combinedText = ''

        for (let i = 0; i < currentGroup.length; i++) {
            const item = currentGroup[i]
            const next = currentGroup[i + 1]

            minX = Math.min(minX, item.x)
            minY = Math.min(minY, item.y)
            maxX = Math.max(maxX, item.x + item.width)
            maxBottom = Math.max(maxBottom, item.y + item.fontSize)

            combinedText += item.str

            if (next) {
                const isSameLine = Math.abs(item.y - next.y) < (item.fontSize * 0.5)
                if (isSameLine) {
                    const gap = next.x - (item.x + item.width)
                    if (gap > (item.fontSize * 0.15)) {
                        if (!item.str.endsWith(' ') && !next.str.startsWith(' ')) {
                            combinedText += ' '
                        }
                    }
                } else {
                    if (!item.str.endsWith(' ') && !next.str.startsWith(' ')) {
                        combinedText += ' '
                    }
                }
            }
        }

        const width = maxX - minX
        const height = maxBottom - minY
        const primary = currentGroup[0]
        const type = primary.fontSize > 18 ? 'heading' : 'paragraph'

        // Background & Text Color Sampling
        let bgColor = '#ffffff'
        let textColor = '#000000'
        if (ctx) {
            bgColor = getDominantColor(ctx, minX, minY, width, height)
            textColor = getTextColor(ctx, minX, minY, width, height)
        }

        // Calculate PDF-space coordinates for perfect masking
        const pdfX = Math.min(...currentGroup.map(item => item.originalTransform[4]))
        const pdfY = Math.min(...currentGroup.map(item => item.originalTransform[5]))
        const pdfMaxX = Math.max(...currentGroup.map(item => item.originalTransform[4] + (item.width / scale)))
        const pdfMaxY = Math.max(...currentGroup.map(item => item.originalTransform[5] + (item.height / scale)))
        const pdfW = pdfMaxX - pdfX
        const pdfH = pdfMaxY - pdfY

        // Create "masking box" with safety margin for perfect coverage
        const maskPaddingX = 2
        const maskPaddingY = 2

        elements.push({
            id: `el-${crypto.randomUUID()}`,
            type,
            x: minX - maskPaddingX,
            y: minY - maskPaddingY,
            content: combinedText.trim(),
            style: {
                width: width + (maskPaddingX * 2),
                height: Math.max(height, primary.fontSize) + (maskPaddingY * 2),
                fontSize: primary.fontSize,
                fontFamily: getFontFamily(primary.fontName),
                fontWeight: getFontWeight(primary.fontName),
                fontStyle: getFontStyle(primary.fontName) as 'normal' | 'italic',
                color: textColor,
                backgroundColor: bgColor,
                textAlign: 'left',
                zIndex: 2,
                lineHeight: 1.2,
                padding: maskPaddingY
            },
            pageIndex,
            isImported: true,
            pdfX,
            pdfY,
            pdfW,
            pdfH
        })
        currentGroup = []
    }

    for (const item of convertedItems) {
        if (currentGroup.length === 0) {
            currentGroup.push(item)
            continue
        }

        const last = currentGroup[currentGroup.length - 1]

        const sizeRatio = item.fontSize / last.fontSize
        if (sizeRatio < 0.9 || sizeRatio > 1.1) {
            flushGroup()
            currentGroup = [item]
            continue
        }

        const verticalDist = item.y - last.y
        // Relax threshold for very small items (like dots/bullets) which might have slight offsets
        const isSmallChar = item.str.length === 1 && item.width < (last.fontSize * 0.5)
        const lineThreshold = isSmallChar ? (last.fontSize * 0.8) : (last.fontSize * 0.5)
        const isSameLine = Math.abs(verticalDist) < lineThreshold

        if (isSameLine) {
            const gap = item.x - (last.x + last.width)
            // If the gap is more than roughly 80% of font size, 
            // it's likely a separate logical block (e.g. Phone vs Email)
            if (gap > (last.fontSize * 0.8)) {
                flushGroup()
                currentGroup = [item]
            } else {
                currentGroup.push(item)
            }
        } else {
            const isNextLine = verticalDist > 0 && verticalDist < (last.fontSize * 2.0)
            const isAligned = Math.abs(item.x - currentGroup[0].x) < 20

            if (isNextLine && isAligned) {
                currentGroup.push(item)
            } else {
                flushGroup()
                currentGroup = [item]
            }
        }
    }
    flushGroup()

    return elements
}

const renderPageToContext = async (page: any): Promise<{ image: string, context: CanvasRenderingContext2D | null }> => {
    const viewportUnscaled = page.getViewport({ scale: 1 })
    const scale = A4_WIDTH / viewportUnscaled.width
    const viewport = page.getViewport({ scale })

    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d', { willReadFrequently: true }) // Optimize for reading
    canvas.width = Math.round(viewport.width)
    canvas.height = Math.round(viewport.height)

    if (context) {
        context.fillStyle = 'white'
        context.fillRect(0, 0, canvas.width, canvas.height)
        await page.render({ canvasContext: context, viewport }).promise
        return { image: canvas.toDataURL('image/png'), context }
    }
    return { image: '', context: null }
}
