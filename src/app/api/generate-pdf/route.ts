import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument } from 'pdf-lib'

export const runtime = 'nodejs'

const A4_WIDTH_PTS = 595.28
const A4_HEIGHT_PTS = 841.89

type SnapshotRequestBody = {
    imageDataUrl: string
    filename?: string
    docTitle?: string
    page?: {
        widthPt?: number
        heightPt?: number
        format?: 'a4'
        orientation?: 'portrait' | 'landscape'
    }
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

function getPageSizePts(page?: SnapshotRequestBody['page']): { width: number; height: number } {
    if (page?.widthPt && page?.heightPt) return { width: page.widthPt, height: page.heightPt }
    if (page?.format === 'a4' && page?.orientation === 'landscape') return { width: A4_HEIGHT_PTS, height: A4_WIDTH_PTS }
    return { width: A4_WIDTH_PTS, height: A4_HEIGHT_PTS }
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
        const pageSize = getPageSizePts(body.page)

        const pdfDoc = await PDFDocument.create()
        const page = pdfDoc.addPage([pageSize.width, pageSize.height])

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

        // Draw full-bleed to page. This ensures pixel-perfect WYSIWYG based on the snapshot.
        page.drawImage(embedded, {
            x: 0,
            y: 0,
            width: pageSize.width,
            height: pageSize.height
        })

        const pdfBytes = await pdfDoc.save()

        const rawName = (body.filename || body.docTitle || 'document')
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
