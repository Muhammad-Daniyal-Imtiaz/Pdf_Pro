
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
    // Points: Top-Left, Top-Right, Bottom-Left, Bottom-Right (padded)
    // Also Mid-Left, Mid-Right
    const padding = 4
    const points = [
        { x: x - padding, y: y - padding },
        { x: x + width + padding, y: y - padding },
        { x: x - padding, y: y + height + padding },
        { x: x + width + padding, y: y + height + padding },
        { x: x - padding, y: y + height / 2 },
        { x: x + width + padding, y: y + height / 2 }
    ]

    const colorCounts: Record<string, number> = {}
    let maxCount = 0
    let dominant = 'rgba(255, 255, 255, 1)' // Default White

    points.forEach(p => {
        if (p.x < 0 || p.y < 0) return
        try {
            const pixel = ctx.getImageData(p.x, p.y, 1, 1).data
            // Ignore transparent pixels (if any)
            if (pixel[3] < 50) return

            const color = `rgba(${pixel[0]}, ${pixel[1]}, ${pixel[2]}, 1)`
            colorCounts[color] = (colorCounts[color] || 0) + 1
            if (colorCounts[color] > maxCount) {
                maxCount = colorCounts[color]
                dominant = color
            }
        } catch (e) {
            // Ignore out of bounds
        }
    })

    // Fallback: if no clear winner or mostly white?
    // If dominant count is low (e.g. 1), it might be noise.
    // But for solid backgrounds, it should be consistent.
    // Convert rgba to hex for better style compatibility?
    return rgbaToHex(dominant)
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

        // Background Color Sampling
        let bgColor = '#ffffff'
        if (ctx) {
            bgColor = getDominantColor(ctx, minX, minY, width, height)
        }

        elements.push({
            id: `el-${crypto.randomUUID()}`,
            type,
            x: minX,
            y: minY,
            content: combinedText.trim(),
            style: {
                width: Math.max(width, 20),
                height: Math.max(height, primary.fontSize),
                fontSize: primary.fontSize,
                fontFamily: getFontFamily(primary.fontName),
                fontWeight: getFontWeight(primary.fontName),
                color: '#000000',
                backgroundColor: bgColor, // DYNAMIC MASKING
                textAlign: 'left',
                zIndex: 2,
                lineHeight: 1.2,
                padding: 0
            },
            pageIndex
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
        const isSameLine = Math.abs(verticalDist) < (last.fontSize * 0.5)

        if (isSameLine) {
            const gap = item.x - (last.x + last.width)
            if (gap > (last.fontSize * 3)) {
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
