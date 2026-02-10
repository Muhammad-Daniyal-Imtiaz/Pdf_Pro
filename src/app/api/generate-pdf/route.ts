import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

export const runtime = 'nodejs'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pages, title = 'document', originalPdf } = body

    if (!pages || !Array.isArray(pages) || pages.length === 0) {
      return NextResponse.json({ error: 'Invalid pages data' }, { status: 400 })
    }

    console.log(`Generating PDF with ${pages.length} pages...`)

    let pdfDoc: PDFDocument

    // Load original PDF or create new
    if (originalPdf) {
      const originalBytes = Buffer.from(originalPdf, 'base64')
      pdfDoc = await PDFDocument.load(originalBytes)
    } else {
      pdfDoc = await PDFDocument.create()
    }

    // Embed fonts
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    // Process each page
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i]
      let pdfPage = pdfDoc.getPage(i)
      
      if (!pdfPage) {
        pdfPage = pdfDoc.addPage([page.width || 794, page.height || 1123])
      }

      const { width, height } = pdfPage.getSize()

      // Draw elements
      for (const el of page.elements || []) {
        if (el.isImported && !el.isModified) continue // Skip unmodified imported elements

        const x = el.x * 0.75 // Convert CSS pixels to PDF points (72/96)
        const y = height - (el.y * 0.75) - (el.style.height * 0.75) // Flip Y and scale

        // Parse color
        const hex = el.style.color?.replace('#', '') || '000000'
        const r = parseInt(hex.substring(0, 2), 16) / 255
        const g = parseInt(hex.substring(2, 4), 16) / 255  
        const b = parseInt(hex.substring(4, 6), 16) / 255

        if (el.type === 'text' || el.type === 'heading' || el.type === 'paragraph') {
          const font = el.style.fontWeight === 'bold' ? helveticaBold : helvetica
          const fontSize = (el.style.fontSize || 14) * 0.75

          // Add whiteout background for modified imported elements
          if (el.isImported && el.isModified) {
            pdfPage.drawRectangle({
              x: x - 2,
              y: y - 2,
              width: (el.style.width || 200) * 0.75 + 4,
              height: (el.style.height || 20) * 0.75 + 4,
              color: rgb(1, 1, 1), // White background
            })
          }

          pdfPage.drawText(el.content || '', {
            x,
            y,
            size: fontSize,
            font,
            color: rgb(r, g, b),
            maxWidth: (el.style.width || 200) * 0.75,
          })
        } else if (el.type === 'line') {
          pdfPage.drawRectangle({
            x,
            y,
            width: (el.style.width || 100) * 0.75,
            height: (el.style.height || 2) * 0.75,
            color: rgb(r, g, b),
          })
        }
      }
    }

    // Save PDF
    const pdfBytes = await pdfDoc.save()
    console.log(`PDF generated: ${pdfBytes.length} bytes`)

    // Create safe filename
    const safeFilename = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'document'

    return new NextResponse(new Uint8Array(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeFilename}.pdf"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    })

  } catch (error) {
    console.error('PDF Generation Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate PDF',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'Ready',
    endpoint: '/api/generate-pdf',
    method: 'POST',
    required_fields: {
      pages: 'Array of page objects with elements',
      title: 'Document title (optional)',
      originalPdf: 'Base64 encoded original PDF (optional)'
    }
  })
}