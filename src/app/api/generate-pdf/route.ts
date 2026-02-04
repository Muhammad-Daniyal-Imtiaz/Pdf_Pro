import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument } from 'pdf-lib'

export const runtime = 'nodejs'

type SnapshotRequestBody = {
    imageDataUrl: string
    filename?: string
}

function parseDataUrl(dataUrl: string): { mime: string; bytes: Uint8Array } {
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
    if (!match) {
        throw new Error('Invalid imageDataUrl: expected data:<mime>;base64,<data>')
    }
    const [, mime, base64] = match
    return {
        mime,
        bytes: new Uint8Array(Buffer.from(base64, 'base64'))
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as Partial<SnapshotRequestBody>

        if (!body?.imageDataUrl || typeof body.imageDataUrl !== 'string') {
            return NextResponse.json(
                { error: 'Invalid request: expected { imageDataUrl: string }' },
                { status: 400 }
            )
        }

        const { mime, bytes } = parseDataUrl(body.imageDataUrl)

        const pdfDoc = await PDFDocument.create()

        let embedded
        if (mime === 'image/png') {
            embedded = await pdfDoc.embedPng(bytes)
        } else if (mime === 'image/jpeg' || mime === 'image/jpg') {
            embedded = await pdfDoc.embedJpg(bytes)
        } else {
            return NextResponse.json(
                { error: `Unsupported image mime type: ${mime}. Use image/png or image/jpeg.` },
                { status: 400 }
            )
        }

        // CRITICAL: EXACT 1:1 WYSIWYG MAPPING
        // We do NOT use fixed A4 dimensions. 
        // We use the dimensions of the captured image.
        // If image is 794x1123px, PDF is 794x1123px.
        // This guarantees what you see is what you get.
        const imgWidth = embedded.scale(1).width
        const imgHeight = embedded.scale(1).height

        const page = pdfDoc.addPage([imgWidth, imgHeight])

        // Draw image filling the page exactly
        page.drawImage(embedded, {
            x: 0,
            y: 0,
            width: imgWidth,
            height: imgHeight
        })

        const pdfBytes = await pdfDoc.save()

        const rawName = (body.filename || 'document')
        const safeName = rawName.replace(/\.pdf$/i, '').replace(/\s+/g, '_')

        return new NextResponse(Buffer.from(pdfBytes) as any, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${safeName}.pdf"`,
                'Cache-Control': 'no-store'
            }
        })
    } catch (error) {
        console.error('PDF Gen Error:', error)
        return NextResponse.json(
            { error: 'Failed to generate PDF', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}

export async function GET() {
    return NextResponse.json({
        status: 'Ready',
        mode: 'snapshot',
        requiredBody: {
            imageDataUrl: 'data:image/png;base64,...'
        }
    })
}