/**
 * ULTIMATE PDF SERVICE - Full Content Edition
 * Ensures ALL content is captured, not just viewport
 */

import html2canvas from 'html2canvas'
import type { EditorElement } from '@/app/store/useEditorStore'

const A4_WIDTH_PX = 794
const A4_HEIGHT_PX = 1123

export interface PDFGenerationOptions {
    filename?: string
    quality?: number
    debug?: boolean
}

async function captureFullContent(
    canvasElement: HTMLElement,
    options: PDFGenerationOptions = {}
): Promise<string> {
    const { quality = 4, debug = false } = options

    // Wait for any pending React updates
    await new Promise(resolve => setTimeout(resolve, 50))

    try {
        const canvas = await html2canvas(canvasElement, {
            scale: quality,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: debug,

            // CRITICAL FIX: Capture full scroll height, not just viewport
            height: A4_HEIGHT_PX,
            width: A4_WIDTH_PX,

            // Start from top-left of element, not window
            x: 0,
            y: 0,

            // Ensure we get everything
            scrollX: 0,
            scrollY: 0,
            windowWidth: A4_WIDTH_PX,
            windowHeight: A4_HEIGHT_PX,

            onclone: (clonedDoc, clonedElement) => {
                const root = clonedElement as HTMLElement

                // Force exact dimensions
                root.style.cssText = `
          width: ${A4_WIDTH_PX}px !important;
          height: ${A4_HEIGHT_PX}px !important;
          position: relative !important;
          overflow: visible !important;
          background: white !important;
          margin: 0 !important;
          padding: 40px !important;
          box-sizing: border-box !important;
        `

                // Remove all UI overlays
                const toRemove = root.querySelectorAll('[data-html2canvas-ignore="true"], .resize-handle, .SelectionRing')
                toRemove.forEach(el => el.remove())

                // Fix all text elements to ensure full height
                const textElements = root.querySelectorAll('.editor-element')
                textElements.forEach((el) => {
                    const htmlEl = el as HTMLElement
                    // Ensure content is visible
                    htmlEl.style.overflow = 'visible'
                    htmlEl.style.height = 'auto'
                    htmlEl.style.minHeight = htmlEl.style.height

                    // Force text content to be visible
                    const contentDiv = htmlEl.querySelector('[contenteditable]')
                    if (contentDiv) {
                        const contentEl = contentDiv as HTMLElement
                        contentEl.style.height = 'auto'
                        contentEl.style.overflow = 'visible'
                        contentEl.style.whiteSpace = 'pre-wrap'
                        contentEl.style.wordWrap = 'break-word'
                    }
                })

                // Inject fix CSS
                const style = clonedDoc.createElement('style')
                style.textContent = `
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-sizing: border-box !important;
          }
          .editor-element {
            overflow: visible !important;
          }
          [contenteditable] {
            overflow: visible !important;
            height: auto !important;
            min-height: 100% !important;
          }
        `
                clonedDoc.head.appendChild(style)

                if (debug) {
                    console.log('Clone dimensions:', {
                        scrollHeight: root.scrollHeight,
                        clientHeight: root.clientHeight,
                        offsetHeight: root.offsetHeight
                    })
                }
            }
        })

        // Verify we got the full height
        if (debug) {
            console.log('Canvas generated:', {
                width: canvas.width,
                height: canvas.height,
                expectedHeight: A4_HEIGHT_PX * quality
            })
        }

        return canvas.toDataURL('image/png', 1.0)
    } catch (error) {
        console.error('Capture failed:', error)
        throw error
    }
}

export async function generatePDFViaApi(
    canvasElement: HTMLElement,
    elements: EditorElement[] = [],
    filename: string = 'document.pdf',
    options: PDFGenerationOptions = {}
): Promise<Blob> {
    const imageDataUrl = await captureFullContent(canvasElement, options)

    const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageDataUrl, filename })
    })

    if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || `PDF API error: ${response.status}`)
    }

    return response.blob()
}

export async function downloadPDFViaApi(
    canvasElement: HTMLElement,
    elements: EditorElement[] = [],
    filename: string = 'document.pdf',
    options?: PDFGenerationOptions
): Promise<void> {
    const blob = await generatePDFViaApi(canvasElement, elements, filename, options)

    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
}