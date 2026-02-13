// app/api/edit-pdf/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts, PDFFont } from 'pdf-lib'

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

// Helper to handle Data URIs efficiently
const dataUriToBuffer = (dataUri: string) => {
    try {
        const split = dataUri.split(',')
        if (split.length < 2) return Buffer.from([])
        return Buffer.from(split[1], 'base64')
    } catch (e) {
        return Buffer.from([])
    }
}

// Coordinate System Transformation
// Screen: 96 DPI, Origin Top-Left
// PDF: 72 DPI, Origin Bottom-Left
const transformCoords = (x: number, y: number, width: number, height: number, pageHeight: number) => {
    const scale = 72 / 96 // 0.75

    // Scale inputs
    const pdfW = width * scale
    const pdfH = height * scale
    const pdfX = x * scale
    const pdfY_Top = y * scale

    // PDF Y (Bottom-Left origin)
    // The "y" passed to pdf-lib usually represents the bottom-left corner of the object (for rects/images)
    // For text, it's the baseline.
    const pdfY = pageHeight - pdfY_Top - pdfH

    return { x: pdfX, y: pdfY, w: pdfW, h: pdfH, scale }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { originalPdf, elements, title = 'edited-document' } = body

        if (!originalPdf) {
            return NextResponse.json({ error: 'No original PDF provided' }, { status: 400 })
        }

        // 1. Load the original PDF
        const pdfBytes = Buffer.from(originalPdf, 'base64')
        const pdfDoc = await PDFDocument.load(pdfBytes)

        // Set Metadata
        pdfDoc.setTitle(title)
        pdfDoc.setProducer('Pdf Pro Editor')
        pdfDoc.setModificationDate(new Date())

        // 2. Embed Standard Fonts
        const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
        const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
        // Add more fonts if needed
        const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman)

        const pages = pdfDoc.getPages()

        // 3. Process Elements
        for (const el of elements) {
            // Skip unmodified imported elements (like the base PDF image itself) 
            // BUT: If the user draws a NEW image, we must process it.
            // Our app treats the background PDF as an 'image' element with isImported: true.
            // We assume the underlying PDF *IS* the background, so we don't redraw the "imported" element 
            // which is just a screenshot of the page.
            if (el.isImported) continue
            if (!el.content && el.type !== 'line' && el.type !== 'rect' && el.type !== 'circle') continue

            const pageIndex = Math.min(el.pageIndex || 0, pages.length - 1)
            const page = pages[pageIndex]
            const { width: pageWidth, height: pageHeight } = page.getSize()

            // Safe style defaults
            const elWidth = el.style.width || 100
            const elHeight = el.style.height || 100
            const elColor = parseColor(el.style.color || '#000000')
            const elBgColor = parseColor(el.style.backgroundColor || '#ffffff')
            const elBorderColor = parseColor(el.style.borderColor || '#000000')
            const elBorderWidth = (el.style.borderWidth || 0) * 0.75 // Scale border

            const { x, y, w, h, scale } = transformCoords(el.x, el.y, elWidth, elHeight, pageHeight)

            // 4. Draw Elements
            try {
                if (el.type === 'text' || el.type === 'heading' || el.type === 'paragraph') {
                    const fontSize = (el.style.fontSize || 14) * scale
                    const font = el.style.fontWeight === 'bold' || (el.style.fontWeight && (el.style.fontWeight as number) >= 700)
                        ? helveticaBold
                        : (el.style.fontFamily === 'Times New Roman' ? timesRoman : helvetica)

                    // Draw Background if set (and not transparent default)
                    if (el.style.backgroundColor && el.style.backgroundColor !== 'transparent') {
                        page.drawRectangle({
                            x: x - 2,
                            y: y + h - fontSize - 2, // Approximate text bounding box
                            width: w + 4,
                            height: fontSize + 4,
                            color: rgb(elBgColor.r, elBgColor.g, elBgColor.b),
                        })
                    }

                    // Draw Text
                    // Fix: pdf-lib draws text from baseline. 
                    // To approximate top-left alignment matching HTML:
                    // y is the bottom of the element box.
                    // We want the text top to be at y + h.
                    // The baseline is typically fontSize * 0.8 down from top.
                    // So baselineY = (y + h) - (fontSize * 0.8)
                    const baselineY = (y + h) - (fontSize * 0.85)

                    page.drawText(el.content || '', {
                        x: x,
                        y: baselineY,
                        size: fontSize,
                        font: font,
                        color: rgb(elColor.r, elColor.g, elColor.b),
                        maxWidth: w + 10, // Allow slight overflow
                    })
                }
                else if (el.type === 'rect') {
                    page.drawRectangle({
                        x, y, width: w, height: h,
                        color: el.style.backgroundColor ? rgb(elBgColor.r, elBgColor.g, elBgColor.b) : undefined,
                        borderColor: el.style.borderWidth ? rgb(elBorderColor.r, elBorderColor.g, elBorderColor.b) : undefined,
                        borderWidth: elBorderWidth,
                        opacity: el.style.opacity ?? 1,
                    })
                }
                else if (el.type === 'circle') {
                    // pdf-lib drawEllipse uses center x,y and xRadius, yRadius
                    const centerX = x + (w / 2)
                    const centerY = y + (h / 2)
                    page.drawEllipse({
                        x: centerX,
                        y: centerY,
                        xScale: w / 2,
                        yScale: h / 2,
                        color: el.style.backgroundColor ? rgb(elBgColor.r, elBgColor.g, elBgColor.b) : undefined,
                        borderColor: el.style.borderWidth ? rgb(elBorderColor.r, elBorderColor.g, elBorderColor.b) : undefined,
                        borderWidth: elBorderWidth,
                        opacity: el.style.opacity ?? 1,
                    })
                }
                else if (el.type === 'line') {
                    // Line element typically has height ~2px in UI, or is defined by x2,y2 (not in our model yet?)
                    // Assuming simple horizontal line or using width/height as box
                    page.drawRectangle({
                        x, y, width: w, height: h,
                        color: rgb(elBgColor.r, elBgColor.g, elBgColor.b),
                    })
                }
                else if ((el.type === 'image' || el.type === 'icon') && el.content) {
                    let image
                    const imgBuffer = el.content.startsWith('data:')
                        ? dataUriToBuffer(el.content)
                        : await fetch(el.content).then(res => res.arrayBuffer())

                    if (el.content.includes('image/png') || el.content.startsWith('data:image/png')) {
                        image = await pdfDoc.embedPng(imgBuffer)
                    } else {
                        // Fallback to JPG for others
                        image = await pdfDoc.embedJpg(imgBuffer)
                    }

                    page.drawImage(image, {
                        x,
                        y,
                        width: w,
                        height: h,
                        opacity: el.style.opacity ?? 1,
                    })
                }
            } catch (elemErr) {
                console.warn(`Failed to render element ${el.id} (${el.type})`, elemErr)
            }
        }

        // 4. Flatten Form Fields (Optional: Locks in any filled forms if we had them)
        try {
            const form = pdfDoc.getForm()
            form.flatten()
        } catch (e) {
            // Ignore if no form exists
        }

        // 5. Save
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