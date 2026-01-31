/**
 * PDF Generation Service
 * Uses html2canvas for pixel-perfect capture and jsPDF for PDF creation
 * This ensures WYSIWYG accuracy - what you see is what you get
 */

import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export interface PDFGenerationOptions {
    filename?: string
    quality?: number
    scale?: number
    debug?: boolean
}

/**
 * Capture editor canvas and convert to PDF
 * This is the main entry point for WYSIWYG-perfect PDF generation
 */
export async function generatePDFFromCanvas(
    canvasElement: HTMLElement,
    options: PDFGenerationOptions = {}
): Promise<Blob> {
    const {
        filename = 'document.pdf',
        quality = 2,
        scale = 2,
        debug = false
    } = options

    try {
        // Capture the canvas
        const canvas = await html2canvas(canvasElement, {
            scale: 2.0, // Stable scale for all DPIs
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: debug,
            scrollX: 0,
            scrollY: 0,
            onclone: (doc) => {
                // Add a style block to cloned document to prevent modern CSS parsing issues
                const style = doc.createElement('style')
                style.innerHTML = `
                    * {
                        /* Prevent html2canvas from choking on modern colors if they leak in */
                        color-scheme: light !important;
                        box-sizing: border-box !important;
                    }
                    /* Ensure correct text direction */
                    .editor-canvas, .editor-canvas * {
                        direction: ltr !important;
                        unicode-bidi: bidi-override !important;
                        text-align: inherit !important;
                    }
                    /* Hide UI elements from final PDF */
                    .resize-handle, 
                    .SelectionRing,
                    .HoverIndicator,
                    .MeasurementTooltip,
                    .SelectionLabel,
                    [data-html2canvas-ignore="true"] { 
                        display: none !important; 
                    }
                `
                doc.head.appendChild(style)
            }
        })

        // Get canvas dimensions
        const imgData = canvas.toDataURL('image/jpeg', 0.95)
        const imgWidth = 210 // A4 width in mm
        const imgHeight = 297 // A4 height in mm

        // Create PDF with exact A4 dimensions
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
            compress: true
        })

        // Add image to PDF (full page)
        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight, undefined, 'FAST')

        // Generate blob
        const pdfBlob = pdf.output('blob')
        return pdfBlob
    } catch (error) {
        console.error('PDF generation error:', error)
        throw error
    }
}

/**
 * Download PDF directly to user's device
 */
export async function downloadPDF(
    canvasElement: HTMLElement,
    filename: string = 'document.pdf',
    options?: PDFGenerationOptions
): Promise<void> {
    try {
        const blob = await generatePDFFromCanvas(canvasElement, options)
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
    } catch (error) {
        console.error('Download error:', error)
        throw error
    }
}

/**
 * Generate PDF preview blob for display
 */
export async function generatePDFPreview(
    canvasElement: HTMLElement
): Promise<string> {
    try {
        const canvas = await html2canvas(canvasElement, {
            scale: 2.0,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            scrollX: 0,
            scrollY: 0,
            onclone: (doc) => {
                const style = doc.createElement('style')
                style.innerHTML = `
                    * { 
                        color-scheme: light !important; 
                        box-sizing: border-box !important;
                    }
                    /* Ensure correct text direction */
                    .editor-canvas, .editor-canvas * {
                        direction: ltr !important;
                        unicode-bidi: bidi-override !important;
                        text-align: inherit !important;
                    }
                    /* Hide UI elements from result */
                    .resize-handle, 
                    .SelectionRing,
                    .HoverIndicator,
                    .MeasurementTooltip,
                    .SelectionLabel,
                    [data-html2canvas-ignore="true"] { 
                        display: none !important; 
                    }
                `
                doc.head.appendChild(style)
            }
        })
        return canvas.toDataURL('image/jpeg', 0.8)
    } catch (error) {
        console.error('Preview generation error:', error)
        throw error
    }
}

/**
 * Compare preview image with rendered output
 * Used for quality assurance
 */
export function compareCanvases(
    canvas1: HTMLCanvasElement,
    canvas2: HTMLCanvasElement,
    threshold: number = 10
): { match: boolean; difference: number } {
    const ctx1 = canvas1.getContext('2d')
    const ctx2 = canvas2.getContext('2d')

    if (!ctx1 || !ctx2) return { match: false, difference: 100 }

    const imageData1 = ctx1.getImageData(0, 0, canvas1.width, canvas1.height)
    const imageData2 = ctx2.getImageData(0, 0, canvas2.width, canvas2.height)

    let pixelDifference = 0
    const data1 = imageData1.data
    const data2 = imageData2.data

    for (let i = 0; i < data1.length; i += 4) {
        const r1 = data1[i]
        const g1 = data1[i + 1]
        const b1 = data1[i + 2]

        const r2 = data2[i]
        const g2 = data2[i + 1]
        const b2 = data2[i + 2]

        const diff = Math.sqrt(
            Math.pow(r1 - r2, 2) +
            Math.pow(g1 - g2, 2) +
            Math.pow(b1 - b2, 2)
        )

        if (diff > threshold) pixelDifference++
    }

    const totalPixels = (data1.length / 4)
    const percentageDifference = (pixelDifference / totalPixels) * 100

    return {
        match: percentageDifference < 1,
        difference: percentageDifference
    }
}
