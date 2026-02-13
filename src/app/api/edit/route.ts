import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { pages, originalPdf } = body

        if (!originalPdf) {
            return NextResponse.json({ error: 'Original PDF is required for editing' }, { status: 400 })
        }

        // Load original PDF
        const pdfBytes = Buffer.from(originalPdf, 'base64')
        const pdfDoc = await PDFDocument.load(pdfBytes)
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
        const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

        const pdfPages = pdfDoc.getPages()

        for (let i = 0; i < pages.length; i++) {
            const editorPage = pages[i]
            if (i >= pdfPages.length) break // Should not happen with current logic

            const page = pdfPages[i]
            const { width: pWidth, height: pHeight } = page.getSize()
            const scaleX = pWidth / 794
            const scaleY = pHeight / 1123

            // Elements on this page
            const elements = editorPage.elements || []

            for (const el of elements) {
                const style = el.style || {}

                // Skip unmodified imported elements
                if (el.isImported && !el.isModified) continue

                // Coordinate transformation:
                const x = el.x * scaleX
                const y = pHeight - (el.y * scaleY) - ((style.height || 0) * scaleY)
                const width = (style.width || 0) * scaleX
                const height = (style.height || 0) * scaleY

                // 1. If modified imported element, WHITE OUT original area
                if (el.isImported && el.isModified) {
                    page.drawRectangle({
                        x,
                        y,
                        width,
                        height,
                        color: rgb(1, 1, 1), // White
                    })
                }

                // 2. Draw Element
                switch (el.type) {
                    case 'container':
                        // Draw Background/Border
                        const bgColor = parseColor(style.backgroundColor || 'transparent')
                        const borderColor = parseColor(style.borderColor || '#000000')
                        const borderWidth = (style.borderWidth || 0) * scaleX

                        if (style.backgroundColor && style.backgroundColor !== 'transparent') {
                            page.drawRectangle({
                                x,
                                y,
                                width,
                                height,
                                color: rgb(bgColor.r, bgColor.g, bgColor.b),
                            })
                        }

                        if (borderWidth > 0) {
                            page.drawRectangle({
                                x,
                                y,
                                width,
                                height,
                                borderColor: rgb(borderColor.r, borderColor.g, borderColor.b),
                                borderWidth,
                            })
                        }
                        // Continue to draw text content (fallback to default text handling)
                        const fontSizeC = (style.fontSize || 12) * scaleY
                        page.drawText(el.content || '', {
                            x: x + (style.padding || 8) * scaleX,
                            y: y + height - (style.padding || 8) * scaleY - fontSizeC,
                            size: fontSizeC,
                            font: helveticaFont,
                            color: rgb(0, 0, 0),
                            maxWidth: width - (style.padding || 8) * 2 * scaleX,
                        })
                        break

                    case 'text':
                    case 'heading':
                    case 'paragraph':
                        const color = parseColor(style.color || '#000000')
                        const fontSize = (style.fontSize || 12) * scaleY
                        const isBold = style.fontWeight === 'bold' || (style.fontWeight && parseInt(style.fontWeight.toString()) >= 600)

                        page.drawText(el.content || '', {
                            x,
                            y: y + (style.padding || 0) * scaleY, // Minor adjustment for baseline differences
                            size: fontSize,
                            font: isBold ? helveticaBold : helveticaFont,
                            color: rgb(color.r, color.g, color.b),
                            maxWidth: width,
                            lineHeight: fontSize * (style.lineHeight || 1.1),
                            rotate: degrees(style.rotation || 0),
                        })
                        break

                    case 'image':
                        if (el.content && el.content.startsWith('data:image')) {
                            try {
                                const imgData = el.content.split(',')[1]
                                const imgBytes = Buffer.from(imgData, 'base64')
                                const isPng = el.content.includes('image/png')
                                const image = isPng ? await pdfDoc.embedPng(imgBytes) : await pdfDoc.embedJpg(imgBytes)

                                page.drawImage(image, {
                                    x,
                                    y,
                                    width,
                                    height,
                                    rotate: degrees(style.rotation || 0),
                                    opacity: style.opacity || 1,
                                })
                            } catch (err) {
                                console.error('Error embedding image:', err)
                            }
                        }
                        break

                    case 'line':
                        const lineColor = parseColor(style.backgroundColor || '#000000')
                        page.drawRectangle({
                            x,
                            y,
                            width,
                            height,
                            color: rgb(lineColor.r, lineColor.g, lineColor.b),
                            rotate: degrees(style.rotation || 0),
                            opacity: style.opacity || 1,
                        })
                        break
                }
            }
        }

        const finalPdfBytes = await pdfDoc.save()

        return new NextResponse(Buffer.from(finalPdfBytes), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="edited_document.pdf"`,
            },
        })
    } catch (error: any) {
        console.error('Advanced PDF Editing Error:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}

function parseColor(hex: string) {
    if (!hex || hex === 'transparent' || !hex.startsWith('#')) return { r: 0, g: 0, b: 0 }
    hex = hex.replace('#', '')
    if (hex.length === 3) {
        hex = hex.split('').map(s => s + s).join('')
    }
    const r = parseInt(hex.substring(0, 2), 16) / 255 || 0
    const g = parseInt(hex.substring(2, 4), 16) / 255 || 0
    const b = parseInt(hex.substring(4, 6), 16) / 255 || 0
    return { r, g, b }
}
