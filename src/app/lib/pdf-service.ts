/**
 * ULTIMATE PDF SERVICE - "Zero Drift" Edition
 * Uses CoordinateSystem for pixel-perfect mapping
 */

import html2canvas from 'html2canvas'
import { CoordinateSystem } from './geometry-engine/CoordinateSystem'
import { AlignmentEngine, WYSIWYGValidator } from './alignment-service'
import type { EditorElement } from '@/app/store/useEditorStore'

const A4_WIDTH_PX = 794
const A4_HEIGHT_PX = 1123

export interface PDFGenerationOptions {
    filename?: string
    quality?: number
    debug?: boolean
    enforceAlignment?: boolean // NEW: Auto-fix alignment before export
}

async function capturePixelPerfect(
    canvasElement: HTMLElement,
    elements: EditorElement[],
    options: PDFGenerationOptions = {}
): Promise<string> {
    const {
        quality = 4,
        debug = false,
        enforceAlignment = true
    } = options

    // PRE-FLIGHT: Validate and auto-fix alignment
    if (enforceAlignment) {
        const validation = WYSIWYGValidator.validateDocument(elements)
        if (debug && !validation.isValid) {
            console.warn('WYSIWYG Warnings:', validation)
        }

        // Snap icon+text pairs to perfect alignment
        const pairs = AlignmentEngine.detectAndAlignPairs(elements)
        if (debug) console.log('Detected pairs:', pairs.length)
    }

    // Force complete reflow
    await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    })

    try {
        const canvas = await html2canvas(canvasElement, {
            scale: quality,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: debug,
            scrollX: 0,
            scrollY: 0,
            windowWidth: A4_WIDTH_PX,
            windowHeight: A4_HEIGHT_PX,
            imageTimeout: 0, // Don't timeout on images

            // PIXEL-PERFECT CLONE FIX
            onclone: (clonedDoc) => {
                const root = clonedDoc.querySelector('[data-pdf-preview-root="true"]') as HTMLElement
                if (!root) {
                    console.error('PDF root element not found!')
                    return
                }

                // 1. LOCK ROOT DIMENSIONS - CRITICAL
                const body = clonedDoc.body
                body.style.cssText = `
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
          width: ${A4_WIDTH_PX}px !important;
          height: ${A4_HEIGHT_PX}px !important;
        `

                root.style.cssText = `
          width: ${A4_WIDTH_PX}px !important;
          height: ${A4_HEIGHT_PX}px !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          transform: none !important;
          transform-origin: top left !important;
          overflow: hidden !important;
          box-sizing: border-box !important;
          margin: 0 !important;
          padding: 40px !important;
        `

                // 2. REMOVE ALL INTERACTIVE UI
                const removeSelectors = [
                    '.resize-handle',
                    '.SelectionRing',
                    '.SelectionLabel',
                    '.MeasurementTooltip',
                    '.OpticalCenterIndicator',
                    '[data-html2canvas-ignore="true"]',
                    '.editor-canvas > div:first-child' // Grid background
                ]

                removeSelectors.forEach(selector => {
                    clonedDoc.querySelectorAll(selector).forEach(el => {
                        if (el instanceof HTMLElement) {
                            el.remove() // Complete removal, not just hiding
                        }
                    })
                })

                // 3. NORMALIZE ALL ELEMENTS
                const allElements = clonedDoc.querySelectorAll('.editor-element, .social-icon-element, .link-element, .line-element')

                allElements.forEach((el, index) => {
                    if (!(el instanceof HTMLElement)) return

                    const elementId = el.getAttribute('data-element-id')
                    if (!elementId) return

                    // Force visibility and exact rendering
                    el.style.cssText += `
            visibility: visible !important;
            opacity: 1 !important;
            display: flex !important;
            box-sizing: border-box !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          `

                    // Get computed metrics for this specific element
                    const computed = window.getComputedStyle(el)

                    // Ensure fonts match exactly
                    el.style.fontFamily = computed.fontFamily
                    el.style.fontSize = computed.fontSize
                    el.style.lineHeight = computed.lineHeight
                    el.style.letterSpacing = computed.letterSpacing
                })

                // 4. INJECT PDF-OPTIMIZATION CSS
                const style = clonedDoc.createElement('style')
                style.textContent = `
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-sizing: border-box !important;
          }
          
          .editor-element {
            contain: layout style paint !important;
          }
          
          /* Prevent any text selection artifacts */
          ::selection {
            background: transparent !important;
          }
        `
                clonedDoc.head.appendChild(style)

                if (debug) {
                    console.log('PDF Clone complete. Root dimensions:', {
                        width: root.offsetWidth,
                        height: root.offsetHeight,
                        scrollWidth: root.scrollWidth,
                        scrollHeight: root.scrollHeight
                    })
                }
            }
        })

        // Verify canvas dimensions
        if (debug) {
            console.log('Canvas generated:', {
                width: canvas.width,
                height: canvas.height,
                expectedWidth: A4_WIDTH_PX * quality,
                expectedHeight: A4_HEIGHT_PX * quality
            })
        }

        // Return maximum quality PNG
        return canvas.toDataURL('image/png', 1.0)
    } catch (error) {
        console.error('PDF Capture failed:', error)
        throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
}

export async function generatePDFViaApi(
    canvasElement: HTMLElement,
    elements: EditorElement[] = [],
    filename: string = 'document.pdf',
    options: PDFGenerationOptions = {}
): Promise<Blob> {
    const imageDataUrl = await capturePixelPerfect(canvasElement, elements, options)

    // Verify image data
    if (!imageDataUrl.startsWith('data:image/png;base64,')) {
        throw new Error('Invalid image data generated')
    }

    const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            imageDataUrl,
            filename
        })
    })

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `PDF API error: ${response.status}`)
    }

    const blob = await response.blob()

    if (blob.size === 0) {
        throw new Error('Generated PDF is empty')
    }

    return blob
}

export async function downloadPDFViaApi(
    canvasElement: HTMLElement,
    elements: EditorElement[] = [],
    filename: string = 'document.pdf',
    options?: PDFGenerationOptions
): Promise<void> {
    try {
        const blob = await generatePDFViaApi(canvasElement, elements, filename, options)

        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename.replace(/\.pdf$/i, '') + '.pdf'

        // Safe append/remove
        const parent = document.body || document.documentElement
        parent.appendChild(link)
        link.click()

        setTimeout(() => {
            parent.removeChild(link)
            window.URL.revokeObjectURL(url)
        }, 100)
    } catch (error) {
        console.error('PDF Download failed:', error)
        throw error
    }
}