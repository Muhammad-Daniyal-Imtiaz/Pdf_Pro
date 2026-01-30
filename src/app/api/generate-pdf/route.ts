import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

// Enhanced type definitions matching the new store
interface EditorStyle {
    fontFamily: string
    fontSize: number
    fontWeight: string
    fontStyle: 'normal' | 'italic'
    textDecoration: 'none' | 'underline'
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
    cvTemplate?: any
}

// PDF page dimensions in points
const A4_WIDTH = 595.28
const A4_HEIGHT = 841.89
const MM_TO_POINTS = 2.834645669

export async function POST(request: NextRequest) {
    try {
        const body: RequestBody = await request.json()
        const { contentBlocks, docTitle = '', showTitle = true } = body

        if (!Array.isArray(contentBlocks)) {
            return NextResponse.json(
                { error: 'Invalid content blocks' },
                { status: 400 }
            )
        }

        const pdfDoc = await PDFDocument.create()
        const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT])

        // Embed standard fonts
        const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
        const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
        const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)
        const courier = await pdfDoc.embedFont(StandardFonts.Courier)

        // Helper to convert hex to RGB (0-1 scale)
        const hexToRgb = (hex: string): [number, number, number] => {
            if (!hex || typeof hex !== 'string') return [0, 0, 0]
            hex = hex.replace(/^#/, '')

            let r, g, b
            if (hex.length === 3) {
                r = parseInt(hex[0] + hex[0], 16) / 255
                g = parseInt(hex[1] + hex[1], 16) / 255
                b = parseInt(hex[2] + hex[2], 16) / 255
            } else if (hex.length === 6) {
                r = parseInt(hex.slice(0, 2), 16) / 255
                g = parseInt(hex.slice(2, 4), 16) / 255
                b = parseInt(hex.slice(4, 6), 16) / 255
            } else {
                return [0, 0, 0]
            }

            return [r, g, b]
        }

        // Helper to wrap text
        const wrapText = (text: string, font: any, fontSize: number, maxWidth: number): string[] => {
            if (!text) return []
            const words = text.split(' ')
            const lines: string[] = []
            let currentLine = ''

            for (const word of words) {
                const testLine = currentLine ? `${currentLine} ${word}` : word
                const textWidth = font.widthOfTextAtSize(testLine, fontSize)

                if (textWidth > maxWidth && currentLine) {
                    lines.push(currentLine)
                    currentLine = word
                } else {
                    currentLine = testLine
                }
            }

            if (currentLine) lines.push(currentLine)
            return lines
        }

        // Select appropriate font
        const getFontForStyle = (style: EditorStyle) => {
            const isBold = style.fontWeight === '700' || style.fontWeight === 'bold'
            const isItalic = style.fontStyle === 'italic'

            if (style.fontFamily?.toLowerCase().includes('courier') || style.fontFamily?.toLowerCase().includes('mono')) {
                return courier
            }

            if (isBold) return helveticaBold
            if (isItalic) return helveticaOblique
            return helvetica
        }

        // Draw title if enabled
        if (showTitle && docTitle) {
            const [r, g, b] = hexToRgb('#1f2937')
            const maxWidth = A4_WIDTH - 40
            const titleLines = wrapText(docTitle, helveticaBold, 28, maxWidth)

            let yPos = A4_HEIGHT - 40
            for (const line of titleLines) {
                try {
                    page.drawText(line, {
                        x: 40,
                        y: yPos,
                        size: 28,
                        font: helveticaBold,
                        color: rgb(r, g, b),
                    })
                    yPos -= 40
                } catch (e) {
                    console.error('Error drawing title:', e)
                }
            }

            // Add separator line
            page.drawLine({
                start: { x: 40, y: yPos + 10 },
                end: { x: A4_WIDTH - 40, y: yPos + 10 },
                thickness: 1,
                color: rgb(0.8, 0.8, 0.8),
            })
        }

        // Draw elements - using absolute positioning from the editor
        // Scale factor: editor uses pixels, PDF uses points (1px ≈ 0.75 points)
        const SCALE = 0.75

        for (const element of contentBlocks) {
            const xPos = element.x * SCALE + 40 // Add page margin
            const yPos = (A4_HEIGHT - (element.y * SCALE) - 40) // Flip Y-axis for PDF
            const font = getFontForStyle(element.style)
            const [r, g, b] = hexToRgb(element.style.color || '#000000')

            try {
                switch (element.type) {
                    case 'heading':
                    case 'paragraph': {
                        const maxWidth = (element.style.width * SCALE) - (element.style.padding * SCALE * 2)
                        const fontSize = element.style.fontSize * SCALE
                        const lines = wrapText(element.content, font, fontSize, maxWidth)

                        let currentY = yPos
                        for (const line of lines) {
                            if (currentY < 40) break // Don't write below margin

                            page.drawText(line, {
                                x: xPos + (element.style.padding * SCALE),
                                y: currentY,
                                size: fontSize,
                                font,
                                color: rgb(r, g, b),
                            })
                            currentY -= (fontSize * element.style.lineHeight)
                        }
                        break
                    }

                    case 'list': {
                        const lines = element.content.split('\n').filter(l => l.trim())
                        const fontSize = element.style.fontSize * SCALE
                        const maxWidth = (element.style.width * SCALE) - (element.style.padding * SCALE * 2) - 15

                        let currentY = yPos
                        for (const line of lines) {
                            if (currentY < 40) break

                            // Draw bullet
                            page.drawText('•', {
                                x: xPos + (element.style.padding * SCALE),
                                y: currentY,
                                size: fontSize,
                                font,
                                color: rgb(r, g, b),
                            })

                            // Wrap and draw text
                            const text = line.replace(/^[•\-\*]\s*/, '')
                            const wrappedLines = wrapText(text, font, fontSize, maxWidth)
                            for (let i = 0; i < wrappedLines.length; i++) {
                                if (currentY < 40) break

                                page.drawText(wrappedLines[i], {
                                    x: xPos + (element.style.padding * SCALE) + 15,
                                    y: currentY,
                                    size: fontSize,
                                    font,
                                    color: rgb(r, g, b),
                                })
                                currentY -= (fontSize * element.style.lineHeight)
                            }
                        }
                        break
                    }

                    case 'divider': {
                        const dividerY = yPos - (element.style.height * SCALE) / 2
                        page.drawLine({
                            start: { x: xPos, y: dividerY },
                            end: { x: xPos + (element.style.width * SCALE), y: dividerY },
                            thickness: 1,
                            color: rgb(r, g, b),
                        })
                        break
                    }

                    case 'image':
                        // Image support would require additional handling
                        console.warn(`Image elements not yet supported: ${element.id}`)
                        break
                }
            } catch (error) {
                console.error(`Error drawing element ${element.id}:`, error)
            }
        }

        // Generate PDF
        const pdfBytes = await pdfDoc.save()
        const pdfBuffer = Buffer.from(pdfBytes)

        return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename="document.pdf"',
                'Content-Length': pdfBuffer.length.toString(),
            },
        })
    } catch (error) {
        console.error('PDF generation error:', error)
        return NextResponse.json(
            {
                error: 'Failed to generate PDF',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        )
    }
}

export async function GET(request: NextRequest) {
    return NextResponse.json({ message: 'PDF Generation API - POST required' })
}
