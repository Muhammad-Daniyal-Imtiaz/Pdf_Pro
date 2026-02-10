// lib/pdf-export-service.ts - Direct PDF manipulation for WYSIWYG export
// Uses pdf-lib to burn edits directly into the original PDF

import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from 'pdf-lib'
import { EditorPage, EditorElement } from '@/app/store/useEditorStore'
import { CoordinateSystem } from './coordinates'

export interface ExportOptions {
  title?: string
  author?: string
  subject?: string
}

/**
 * Export pages to PDF by burning edits into the original PDF
 * 
 * Strategy:
 * 1. Load original PDF (if available)
 * 2. For each page, overlay modified/new elements using pdf-lib
 * 3. Unmodified imported elements are skipped (already in original)
 * 4. Return the merged PDF bytes
 */
export async function exportToPdf(
  pages: EditorPage[],
  originalPdfBytes: Uint8Array | null,
  options: ExportOptions = {}
): Promise<Uint8Array> {
  let pdfDoc: PDFDocument
  
  if (originalPdfBytes && originalPdfBytes.length > 0) {
    // Load original PDF as base
    pdfDoc = await PDFDocument.load(originalPdfBytes)
  } else {
    // Create new PDF
    pdfDoc = await PDFDocument.create()
  }

  // Embed standard font
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  // Process each page
  for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
    const page = pages[pageIndex]
    let pdfPage: PDFPage

    if (originalPdfBytes && pageIndex < pdfDoc.getPageCount()) {
      // Use existing page
      pdfPage = pdfDoc.getPage(pageIndex)
    } else {
      // Add new page with correct dimensions
      pdfPage = pdfDoc.addPage([page.width || 794, page.height || 1123])
    }

    const { width: pageWidth, height: pageHeight } = pdfPage.getSize()
    
    // Create coordinate system for this page
    const coords = new CoordinateSystem(pageWidth, pageHeight)

    // Draw elements onto the page
    for (const element of page.elements) {
      await drawElement(pdfPage, element, coords, helveticaFont, helveticaBold)
    }
  }

  // Set metadata
  if (options.title) {
    pdfDoc.setTitle(options.title)
  }
  if (options.author) {
    pdfDoc.setAuthor(options.author)
  }
  if (options.subject) {
    pdfDoc.setSubject(options.subject)
  }

  // Save and return
  return await pdfDoc.save()
}

/**
 * Draw a single element onto a PDF page
 */
async function drawElement(
  page: PDFPage,
  element: EditorElement,
  coords: CoordinateSystem,
  font: PDFFont,
  boldFont: PDFFont
): Promise<void> {
  const { type, x, y, content, style } = element
  
  // Convert CSS coordinates to PDF coordinates
  const pdfPos = coords.cssToPdf(x, y, style.height)
  const pdfWidth = coords.scaleCssToPdf(style.width)
  const pdfHeight = coords.scaleCssToPdf(style.height)

  switch (type) {
    case 'text':
    case 'heading':
    case 'paragraph':
      drawTextElement(page, pdfPos.x, pdfPos.y, pdfWidth, pdfHeight, content, style, font, boldFont)
      break
    
    case 'image':
      // Images would be embedded here if needed
      break
    
    case 'line':
      drawLineElement(page, pdfPos.x, pdfPos.y, pdfWidth, pdfHeight, style)
      break
  }
}

/**
 * Draw text element on PDF page
 */
function drawTextElement(
  page: PDFPage,
  x: number,
  y: number,
  width: number,
  height: number,
  text: string,
  style: EditorElement['style'],
  font: PDFFont,
  boldFont: PDFFont
): void {
  // Parse color
  const color = parseColor(style.color || '#000000')
  
  // Calculate font size (convert CSS px to PDF points)
  const fontSize = style.fontSize ? style.fontSize * 0.75 : 12
  
  // Select font based on weight
  const selectedFont = style.fontWeight === 'bold' || style.fontWeight === '700' ? boldFont : font
  
  // Draw text
  // Note: PDF-lib draws from bottom-left, so we need to adjust Y position
  page.drawText(text, {
    x: x,
    y: y + height - fontSize, // Adjust for baseline
    size: fontSize,
    font: selectedFont,
    color: rgb(color.r, color.g, color.b),
    maxWidth: width,
    lineHeight: (style.lineHeight || 1.2) * fontSize,
  })
}

/**
 * Draw line element on PDF page
 */
function drawLineElement(
  page: PDFPage,
  x: number,
  y: number,
  width: number,
  height: number,
  style: EditorElement['style']
): void {
  const color = parseColor(style.backgroundColor || '#000000')
  
  page.drawRectangle({
    x: x,
    y: y,
    width: width,
    height: height,
    color: rgb(color.r, color.g, color.b),
  })
}

/**
 * Parse hex color to RGB
 */
function parseColor(hex: string): { r: number; g: number; b: number } {
  // Remove # if present
  const cleanHex = hex.replace('#', '')
  
  // Parse 6-digit hex
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16) / 255
    const g = parseInt(cleanHex.substring(2, 4), 16) / 255
    const b = parseInt(cleanHex.substring(4, 6), 16) / 255
    return { r, g, b }
  }
  
  // Parse 3-digit hex
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16) / 255
    const g = parseInt(cleanHex[1] + cleanHex[1], 16) / 255
    const b = parseInt(cleanHex[2] + cleanHex[2], 16) / 255
    return { r, g, b }
  }
  
  // Default to black
  return { r: 0, g: 0, b: 0 }
}

/**
 * Convert Uint8Array to base64 string
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = ''
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/**
 * Convert base64 string to Uint8Array
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}
