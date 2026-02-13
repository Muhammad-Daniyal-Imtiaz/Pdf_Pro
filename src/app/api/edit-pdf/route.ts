// app/api/edit-pdf/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export const runtime = 'nodejs'
export const maxDuration = 60

// Helper to parse color string (#RRGGBB) to RGB values (0-1)
const parseColor = (hex: string) => {
    const cleanHex = hex?.replace('#', '') || '000000'
    return {
        r: parseInt(cleanHex.substring(0, 2), 16) / 255,
        g: parseInt(cleanHex.substring(2, 4), 16) / 255,
        b: parseInt(cleanHex.substring(4, 6), 16) / 255,
    }
}

// Coordinate System Transformation
// Screen: 96 DPI, Origin Top-Left
// PDF: 72 DPI, Origin Bottom-Left
const transformCoords = (x: number, y: number, height: number, pageHeight: number) => {
    const scale = 72 / 96 // 0.75
    // 1. Scale pixels to points
    const ptX = x * scale
    const ptY = y * scale
    const ptH = height * scale

    // 2. Flip Y axis relative to page height
    const pdfY = pageHeight - ptY - ptH

    return { x: ptX, y: pdfY, scale }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { originalPdf, elements, title = 'edited-document' } = body

        if (!originalPdf) {
            return NextResponse.json({ error: 'No original PDF provided' }, { status: 400 })
        }

        // 1. Load the original PDF from Base64
        const pdfBytes = Buffer.from(originalPdf, 'base64')
        const pdfDoc = await PDFDocument.load(pdfBytes)

        // 2. Embed Fonts
        const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
        const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

        const pages = pdfDoc.getPages()

        // 3. Process Elements
        for (const el of elements) {
            // Skip unmodified imported elements or empty content
            if (el.isImported && !el.isModified) continue
            if (!el.content && el.type !== 'line' && el.type !== 'image') continue

            const pageIndex = Math.min(el.pageIndex || 0, pages.length - 1)
            const page = pages[pageIndex]
            const { width: pageWidth, height: pageHeight } = page.getSize()

            // Transform coordinates
            const { x, y, scale } = transformCoords(el.x, el.y, el.style.height, pageHeight)
            const width = el.style.width * scale
            const fontSize = (el.style.fontSize || 14) * scale

            // Color
            const color = parseColor(el.style.color)

            // 4. Draw based on type
            if (el.type === 'text' || el.type === 'heading' || el.type === 'paragraph') {
                // Whiteout background for edited text
                if (el.isModified) {
                    page.drawRectangle({
                        x: x - 2,
                        y: y - 2,
                        width: width + 4,
                        height: (el.style.height * scale) + 4,
                        color: rgb(1, 1, 1), // White
                    })
                }

                page.drawText(el.content, {
                    x,
                    y: y + ((el.style.height * scale - fontSize) / 2), // Vertically center text
                    size: fontSize,
                    font: el.style.fontWeight === 'bold' ? helveticaBold : helvetica,
                    color: rgb(color.r, color.g, color.b),
                    maxWidth: width,
                })
            }
            else if (el.type === 'line') {
                const lineColor = parseColor(el.style.backgroundColor)
                page.drawRectangle({
                    x,
                    y,
                    width: el.style.width * scale,
                    height: el.style.height * scale,
                    color: rgb(lineColor.r, lineColor.g, lineColor.b),
                })
            }
            else if (el.type === 'image' && el.content) {
                // Note: pdf-lib requires embedding the image first. 
                // Ideally, send base64 data in el.content.
                try {
                    let image
                    if (el.content.includes('image/png')) {
                        const imgBytes = await fetch(el.content).then(res => res.arrayBuffer())
                        image = await pdfDoc.embedPng(imgBytes)
                    } else {
                        const imgBytes = await fetch(el.content).then(res => res.arrayBuffer())
                        image = await pdfDoc.embedJpg(imgBytes)
                    }

                    page.drawImage(image, {
                        x,
                        y,
                        width,
                        height: el.style.height * scale,
                    })
                } catch (imgErr) {
                    console.error('Failed to embed image, drawing placeholder', imgErr)
                    page.drawRectangle({ x, y, width, height: el.style.height * scale, color: rgb(0.8, 0.8, 0.8) })
                }
            }
        }

        // 5. Save and Return
        const pdfBytesModified = await pdfDoc.save()
        const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase()

        return new NextResponse(pdfBytesModified, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${safeTitle}.pdf"`,
            },
        })

    } catch (error) {
        console.error('PDF Edit Error:', error)
        return NextResponse.json({ error: 'Failed to edit PDF' }, { status: 500 })
    }
}