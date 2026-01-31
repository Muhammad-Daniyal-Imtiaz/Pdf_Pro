import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts, PDFFont } from 'pdf-lib'

// Type definitions matching the store
interface EditorStyle {
    fontFamily: string
    fontSize: number
    fontWeight: string
    fontStyle: 'normal' | 'italic'
    textDecoration: 'none' | 'underline' | 'line-through'
    textAlign: 'left' | 'center' | 'right' | 'justify'
    color: string
    backgroundColor?: string
    lineHeight: number
    padding: number
    margin: number
    width: number
    height: number
    borderRadius?: number
    borderWidth?: number
    borderColor?: string
    opacity?: number
}

interface EditorElement {
    id: string
    type: 'heading' | 'paragraph' | 'list' | 'image' | 'divider'
    content: string
    x: number
    y: number
    style: EditorStyle
}

interface RequestBody {
    contentBlocks: EditorElement[]
    docTitle?: string
    showTitle?: boolean
    documentType?: string
}

// PDF Dimensions
const A4_WIDTH_PTS = 595.28
const A4_HEIGHT_PTS = 841.89

// Conversion: 1 px (at 96 DPI) = 0.75 pts (at 72 DPI)
const PX_TO_PT = 0.75

// Editor assumptions
const EDITOR_PAGE_MARGIN_PX = 40

export async function POST(request: NextRequest) {
    try {
        const body: RequestBody = await request.json()
        const { contentBlocks, docTitle = '', showTitle = true } = body

        if (!Array.isArray(contentBlocks)) {
            return NextResponse.json({ error: 'Invalid content blocks' }, { status: 400 })
        }

        const pdfDoc = await PDFDocument.create()
        const page = pdfDoc.addPage([A4_WIDTH_PTS, A4_HEIGHT_PTS])

        // Embed Standard Fonts
        const fontMap = {
            Regular: await pdfDoc.embedFont(StandardFonts.Helvetica),
            Bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
            Italic: await pdfDoc.embedFont(StandardFonts.HelveticaOblique),
            BoldItalic: await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique),
            Courier: await pdfDoc.embedFont(StandardFonts.Courier),
            Times: await pdfDoc.embedFont(StandardFonts.TimesRoman),
        }

        // Helper: Hex to RGB
        const hexToRgb = (hex: string) => {
            const cleanHex = hex.replace('#', '')
            const r = parseInt(cleanHex.substring(0, 2), 16) / 255
            const g = parseInt(cleanHex.substring(2, 4), 16) / 255
            const b = parseInt(cleanHex.substring(4, 6), 16) / 255
            return rgb(isNaN(r) ? 0 : r, isNaN(g) ? 0 : g, isNaN(b) ? 0 : b)
        }

        // Helper: Get Font based on style
        const getFont = (style: EditorStyle): PDFFont => {
            const family = style.fontFamily?.toLowerCase() || ''
            const isBold = style.fontWeight === 'bold' || style.fontWeight === '700'
            const isItalic = style.fontStyle === 'italic'

            if (family.includes('courier') || family.includes('mono')) return fontMap.Courier
            if (family.includes('times') || family.includes('serif')) return fontMap.Times

            // Default to Helvetica (Inter/Roboto replacement)
            if (isBold && isItalic) return fontMap.BoldItalic
            if (isBold) return fontMap.Bold
            if (isItalic) return fontMap.Italic
            return fontMap.Regular
        }

        // Helper: Text Wrapping with Font Metrics
        const wrapText = (text: string, font: PDFFont, size: number, maxWidth: number) => {
            const words = text.split(' ')
            const lines: string[] = []
            let currentLine = words[0]

            for (let i = 1; i < words.length; i++) {
                const word = words[i]
                const width = font.widthOfTextAtSize(`${currentLine} ${word}`, size)
                if (width < maxWidth) {
                    currentLine += ` ${word}`
                } else {
                    lines.push(currentLine)
                    currentLine = word
                }
            }
            if (currentLine) lines.push(currentLine)
            return lines
        }

        // --- Render Elements ---
        for (const el of contentBlocks) {
            const { style, content, x, y } = el

            // 1. Calculate base PDF coordinates
            // Editor X/Y include margins relative to the container (which has padding).
            // But wait, the Store stores "x" and "y" relative to the Canvas Top-Left (0,0).
            // And the Canvas has padding of PAGE_MARGIN (40px).
            // In EditorMain, ResizableElement is absolute positioned inside the canvas div.
            // So el.x = 40 means 40px from left edge of canvas.
            // This maps strictly to: pdfX = el.x * 0.75

            const pdfX = x * PX_TO_PT
            const pdfY = A4_HEIGHT_PTS - (y * PX_TO_PT)

            const fontSize = style.fontSize * PX_TO_PT
            const font = getFont(style)
            const color = hexToRgb(style.color)
            const lineHeight = (style.lineHeight || 1.5) * fontSize

            // Width available for text inside the element's box
            // Element width includes padding. Text width = width - padding*2
            const innerWidth = (style.width - (style.padding * 2)) * PX_TO_PT

            // Start writing text. 
            // In PDF, text is drawn from Baseline. In HTML/CSS, top-left.
            // We need to shift Y down by the font's ascent or approx line height to match "top" alignment.
            let currentY = pdfY - fontSize // Approximate top anchor
            const startX = pdfX + (style.padding * PX_TO_PT)

            try {
                if (el.type === 'image') {
                    // Placeholder for image
                    page.drawRectangle({
                        x: pdfX,
                        y: pdfY - (style.height * PX_TO_PT),
                        width: style.width * PX_TO_PT,
                        height: style.height * PX_TO_PT,
                        color: rgb(0.9, 0.9, 0.9)
                    })
                    continue
                }

                if (el.type === 'divider') {
                    const midY = pdfY - ((style.height * PX_TO_PT) / 2)
                    page.drawLine({
                        start: { x: pdfX, y: midY },
                        end: { x: pdfX + (style.width * PX_TO_PT), y: midY },
                        thickness: 1,
                        color: color
                    })
                    continue
                }

                // Text Elements (Heading, Paragraph, List)
                const textLines = el.type === 'list'
                    ? content.split('\n')
                    : wrapText(content, font, fontSize, innerWidth)

                for (const line of textLines) {
                    if (el.type === 'list') {
                        // Handle list (simple bullet logic)
                        page.drawText('•', {
                            x: startX,
                            y: currentY,
                            size: fontSize,
                            font,
                            color
                        })
                        const stripped = line.replace(/^[•\-\*]\s*/, '')
                        const wrappedListLines = wrapText(stripped, font, fontSize, innerWidth - 15) // Indent

                        let listY = currentY
                        for (const listLine of wrappedListLines) {
                            page.drawText(listLine, {
                                x: startX + 15, // Indent
                                y: listY,
                                size: fontSize,
                                font,
                                color
                            })
                            listY -= lineHeight
                        }
                        currentY = listY // update for next item? List usually has gaps. 
                        // Simplified: just move down by number of lines
                        // currentY -= (lineHeight * wrappedListLines.length) 
                        // But we already did that loop.
                    } else {
                        page.drawText(line, {
                            x: startX,
                            y: currentY,
                            size: fontSize,
                            font,
                            color
                        })

                        // Draw underline if needed
                        if (style.textDecoration === 'underline') {
                            const lineWidth = font.widthOfTextAtSize(line, fontSize)
                            page.drawLine({
                                start: { x: startX, y: currentY - 2 },
                                end: { x: startX + lineWidth, y: currentY - 2 },
                                thickness: 1,
                                color
                            })
                        }

                        // Draw strikethrough if needed
                        if (style.textDecoration === 'line-through') {
                            const lineWidth = font.widthOfTextAtSize(line, fontSize)
                            page.drawLine({
                                start: { x: startX, y: currentY + (fontSize / 3) },
                                end: { x: startX + lineWidth, y: currentY + (fontSize / 3) },
                                thickness: 1,
                                color
                            })
                        }

                        currentY -= lineHeight
                    }
                }

            } catch (err) {
                console.error('Error drawing element:', el.id, err)
            }
        }

        // Generate PDF
        const pdfBytes = await pdfDoc.save()
        // Create a Buffer from the Uint8Array to ensure compatibility
        const pdfBuffer = Buffer.from(pdfBytes)

        return new NextResponse(pdfBuffer as any, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${(docTitle || 'document').replace(/\s/g, '_')}.pdf"`,
            }
        })

    } catch (error) {
        console.error('PDF Gen Error:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

export async function GET() {
    return NextResponse.json({ status: 'Ready' })
}
