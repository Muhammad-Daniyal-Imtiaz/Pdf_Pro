import * as pdfjsLib from 'pdfjs-dist'
import { EditorPage, EditorElement, A4_WIDTH, A4_HEIGHT } from '@/app/store/useEditorStore'

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

export async function parsePdf(file: File): Promise<{ pages: EditorPage[], originalPdf: Uint8Array }> {
    const arrayBuffer = await file.arrayBuffer()
    // Create a copy for PDF.js as it might detach the buffer
    const copyForParsing = arrayBuffer.slice(0)
    const originalPdf = new Uint8Array(arrayBuffer)

    const loadingTask = pdfjsLib.getDocument({ data: copyForParsing })
    const pdf = await loadingTask.promise
    const numPages = pdf.numPages
    const editorPages: EditorPage[] = []

    for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i)

        // Use a scale that maps the PDF width to A4_WIDTH (794px)
        const baseViewport = page.getViewport({ scale: 1.0 })
        const scale = A4_WIDTH / baseViewport.width
        const renderViewport = page.getViewport({ scale: scale })

        // Create canvas exactly at A4 dimensions
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        if (!context) throw new Error('Could not get canvas context')

        canvas.width = A4_WIDTH
        canvas.height = A4_HEIGHT

        // Fill background with white
        context.fillStyle = 'white'
        context.fillRect(0, 0, canvas.width, canvas.height)

        await page.render({
            canvasContext: context,
            viewport: renderViewport
        }).promise

        const backgroundImage = canvas.toDataURL('image/png')

        // Extract text elements
        const textContent = await page.getTextContent()
        const elements: EditorElement[] = []

        textContent.items.forEach((item: any, index: number) => {
            if (!item.str || item.str.trim() === '') return

            // PDF.js transform is [scaleX, skewX, skewY, scaleY, tx, ty]
            // We can use the viewport to transform these coordinates to canvas space
            // The item.transform is in PDF space. 
            // We need to map it to our renderViewport (which is A4_WIDTH wide)

            const tx = item.transform[4]
            const ty = item.transform[5]

            // Map PDF coordinates (tx, ty) to canvas coordinates (x, y)
            // PDF.js viewport.convertToViewportPoint does exactly this
            const [x, y] = renderViewport.convertToViewportPoint(tx, ty)

            // PDF.js returns y from top in viewport coordinates
            // item.height is in PDF points, scale it
            const itemHeight = (item.height || 12) * scale
            const itemWidth = item.width * scale

            elements.push({
                id: `imported-${i}-${index}`,
                type: 'text',
                x: Math.round(x),
                y: Math.round(y - itemHeight), // Viewport y is the baseline usually, shift up by height
                content: item.str,
                pageIndex: i - 1,
                style: {
                    width: Math.round(itemWidth),
                    height: Math.round(itemHeight),
                    fontSize: Math.round(itemHeight),
                    fontFamily: 'Arial, sans-serif',
                    color: 'transparent',
                    padding: 0,
                    lineHeight: 1,
                    textAlign: 'left',
                    zIndex: 10,
                }
            })
        })

        editorPages.push({
            id: `page-${i}-${Date.now()}`,
            backgroundImage,
            elements: elements
        })
    }

    return { pages: editorPages, originalPdf }
}
