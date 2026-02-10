import * as pdfjsLib from 'pdfjs-dist'
import { EditorPage, EditorElement, A4_WIDTH, A4_HEIGHT } from '@/app/store/useEditorStore'

// Set worker source (using local node_modules path or unpkg for browser compatibility)
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

export async function parsePdf(file: File): Promise<{ pages: EditorPage[], originalPdf: Uint8Array }> {
    const arrayBuffer = await file.arrayBuffer()
    const originalPdf = new Uint8Array(arrayBuffer)
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
    const pdf = await loadingTask.promise
    const numPages = pdf.numPages
    const editorPages: EditorPage[] = []

    for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i)
        const viewport = page.getViewport({ scale: 2.0 }) // High scale for better rendering quality

        // Calculate scale to fit A4_WIDTH while maintaining aspect ratio
        const scaleX = A4_WIDTH / viewport.width
        const scaleY = A4_HEIGHT / viewport.height
        const finalScale = 2.0 * Math.min(scaleX, scaleY)

        const renderViewport = page.getViewport({ scale: finalScale })

        // Render page to canvas then to data URL
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        if (!context) throw new Error('Could not get canvas context')

        canvas.width = renderViewport.width
        canvas.height = renderViewport.height

        await page.render({
            canvasContext: context,
            viewport: renderViewport
        }).promise

        const backgroundImage = canvas.toDataURL('image/png')

        // Extract text elements
        const textContent = await page.getTextContent()
        const elements: EditorElement[] = []

        // Group text items by y-coordinate to form paragraphs if they are close
        // For simplicity in this first version, we'll map each text item to an element
        textContent.items.forEach((item: any, index: number) => {
            if (!item.str || item.str.trim() === '') return

            // pdf.js gives coordinates from bottom-left
            // transform property: [scaleX, skewX, skewY, scaleY, translateX, translateY]
            const [scaleX, skewX, skewY, scaleY, tx, ty] = item.transform

            // Convert to our editor coordinates (top-left)
            // Note: y is inverted
            const x = tx * (A4_WIDTH / 595.276) // Normalize to A4_WIDTH (794) from standard PDF (595)
            const y = A4_HEIGHT - (ty * (A4_HEIGHT / 841.89)) // Normalize to A4_HEIGHT (1123) from standard PDF (841)

            elements.push({
                id: `imported-${i}-${index}`,
                type: 'text',
                x: Math.round(x),
                y: Math.round(y - (item.height || 14)), // Adjust y slightly as PDF.js uses baseline
                content: item.str,
                pageIndex: i - 1,
                style: {
                    width: Math.round(item.width * (A4_WIDTH / 595.276)),
                    height: Math.round(item.height * (A4_HEIGHT / 841.89)) || 20,
                    fontSize: Math.round(item.height || 14),
                    fontFamily: item.fontName || 'Arial',
                    color: '#000000',
                    zIndex: 10, // Put imported text above background
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
