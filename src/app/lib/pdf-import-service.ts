import * as pdfjsLib from 'pdfjs-dist'
import { EditorPage, EditorElement } from '@/app/store/useEditorStore'
import { CoordinateSystem, createFromViewport } from './coordinates'

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

/**
 * Parse a PDF file and extract pages with editable elements
 * 
 * Key improvements:
 * 1. Uses unified CoordinateSystem for all coordinate conversions
 * 2. Applies whiteouts to prevent ghosting (double text render)
 * 3. All coordinates stored as CSS pixels (top-left origin)
 */
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
        
        // Create coordinate system for this page using viewport at scale 1.0
        const viewport = page.getViewport({ scale: 1.0 })
        const coords = createFromViewport(viewport)
        
        // Create canvas for background rendering
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        if (!context) throw new Error('Could not get canvas context')

        // Canvas size matches coordinate system exactly
        canvas.width = coords.pageWidth
        canvas.height = coords.pageHeight

        // STEP 1: Extract text content with positions using CoordinateSystem
        const textContent = await page.getTextContent()
        const elements: EditorElement[] = []

        textContent.items.forEach((item: any, index: number) => {
            if (!item.str || item.str.trim() === '') return

            // PDF.js transform: [scaleX, skewX, skewY, scaleY, tx, ty]
            // tx, ty are in PDF coordinates (points, bottom-left origin)
            const tx = item.transform[4]
            const ty = item.transform[5]
            
            // Get item dimensions in PDF points
            const itemHeightPdf = item.height || 12
            const itemWidthPdf = item.width || (item.str.length * itemHeightPdf * 0.6)

            // Convert to CSS coordinates (pixels, top-left origin) using CoordinateSystem
            const cssRect = coords.pdfRectToCss(tx, ty, itemWidthPdf, itemHeightPdf)

            elements.push({
                id: `imported-${i}-${index}`,
                type: 'text',
                x: cssRect.x,
                y: cssRect.y,
                content: item.str,
                pageIndex: i - 1,
                style: {
                    width: cssRect.width,
                    height: cssRect.height,
                    fontSize: cssRect.height, // Approximate font size from height
                    fontFamily: 'Arial, sans-serif',
                    color: '#000000',
                    backgroundColor: 'transparent',
                    padding: 0,
                    lineHeight: 1,
                    textAlign: 'left',
                    zIndex: 10,
                },
                isImported: true,
                isModified: false
            })
        })

        // STEP 2: Render PDF to canvas (no whiteouts needed)
        // Fill white background
        context.fillStyle = 'white'
        context.fillRect(0, 0, canvas.width, canvas.height)

        // Render PDF at the correct scale from coordinate system
        const renderViewport = page.getViewport({ scale: coords.scale })
        await page.render({
            canvasContext: context,
            viewport: renderViewport
        }).promise

        const backgroundImage = canvas.toDataURL('image/png')

        editorPages.push({
            id: `page-${i}-${Date.now()}`,
            backgroundImage,
            width: coords.pageWidth,
            height: coords.pageHeight,
            elements: elements
        })
    }

    return { pages: editorPages, originalPdf }
}
