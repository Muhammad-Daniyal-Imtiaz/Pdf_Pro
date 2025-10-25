import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

interface Styles {
  fontSize: number
  fontFamily: string
  color: string
  lineHeight: number
  margin: number
  fontWeight?: string
  textAlign?: string
  backgroundColor?: string
}

interface Layout {
  pageSize: string
  orientation: string
  columns: number
}

interface ContentBlock {
  id: string
  type: 'heading' | 'paragraph' | 'container' | 'custom'
  content: string
  styles: Styles
}

export async function POST(request: NextRequest) {
  try {
    const { contentBlocks, styles, layout, template } = await request.json()

    // Validate input
    if (!contentBlocks || !Array.isArray(contentBlocks)) {
      return NextResponse.json(
        { error: 'Invalid content blocks' },
        { status: 400 }
      )
    }

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create()

    // Get page dimensions based on layout
    const getPageDimensions = () => {
      const pointsPerInch = 72
      const mmToPoints = (mm: number) => (mm * pointsPerInch) / 25.4
      
      switch (layout.pageSize) {
        case 'A4':
          return layout.orientation === 'portrait' 
            ? [mmToPoints(210), mmToPoints(297)] 
            : [mmToPoints(297), mmToPoints(210)]
        case 'A3':
          return layout.orientation === 'portrait' 
            ? [mmToPoints(297), mmToPoints(420)] 
            : [mmToPoints(420), mmToPoints(297)]
        case 'Letter':
          return layout.orientation === 'portrait' 
            ? [mmToPoints(216), mmToPoints(279)] 
            : [mmToPoints(279), mmToPoints(216)]
        case 'Legal':
          return layout.orientation === 'portrait' 
            ? [mmToPoints(216), mmToPoints(356)] 
            : [mmToPoints(356), mmToPoints(216)]
        default:
          return [mmToPoints(210), mmToPoints(297)]
      }
    }

    const [width, height] = getPageDimensions()
    let page = pdfDoc.addPage([width, height])

    // Embed fonts
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    // Helper function to convert hex color to RGB
    const hexToRgb = (hex: string): [number, number, number] => {
      if (!hex || typeof hex !== 'string') {
        return [0, 0, 0] // Default to black if invalid
      }
      
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

    // Clean text - remove or replace problematic characters
    const cleanText = (text: string): string => {
      if (!text || typeof text !== 'string') {
        return ''
      }
      
      // Replace problematic characters with spaces or remove them
      return text
        .replace(/\n/g, ' ') // Replace newlines with spaces
        .replace(/\r/g, ' ') // Replace carriage returns with spaces
        .replace(/\t/g, ' ') // Replace tabs with spaces
        .replace(/[^\x20-\x7E]/g, '') // Remove non-printable ASCII characters
        .trim()
    }

    // Smart text wrapping function with character cleaning
    const wrapText = (text: string, font: any, fontSize: number, maxWidth: number): string[] => {
      const cleanedText = cleanText(text)
      if (!cleanedText) {
        return ['']
      }
      
      const words = cleanedText.split(' ')
      const lines: string[] = []
      let currentLine = words[0] || ''

      for (let i = 1; i < words.length; i++) {
        const word = words[i]
        const testLine = currentLine + ' ' + word
        
        try {
          const textWidth = font.widthOfTextAtSize(testLine, fontSize)
          
          if (textWidth <= maxWidth) {
            currentLine = testLine
          } else {
            lines.push(currentLine)
            currentLine = word
          }
        } catch (error) {
          // If there's an error with this line, push current line and continue
          lines.push(currentLine)
          currentLine = word
        }
      }
      
      if (currentLine) {
        lines.push(currentLine)
      }
      
      return lines.filter(line => line.trim().length > 0)
    }

    // Dynamic margin calculation
    const margin = Math.max((styles?.margin || 20) * 0.75, 20)
    const maxWidth = width - (margin * 2)
    let yPosition = height - margin

    // Add template header if content exists
    if (contentBlocks.length > 0) {
      const templateTitles: Record<string, string> = {
        modern: 'Modern Document',
        classic: 'Classic Report',
        business: 'Business Document',
        creative: 'Creative Portfolio',
        minimal: 'Minimal Design',
        technical: 'Technical Specification'
      }

      const title = templateTitles[template] || 'Generated Document'
      
      // Add title
      const titleLines = wrapText(title, fontBold, 20, maxWidth)
      titleLines.forEach(line => {
        if (yPosition < margin + 30) {
          page = pdfDoc.addPage([width, height])
          yPosition = height - margin
        }
        
        try {
          page.drawText(line, {
            x: margin,
            y: yPosition,
            size: 20,
            font: fontBold,
            color: rgb(0.2, 0.2, 0.2),
          })
          yPosition -= 25
        } catch (error) {
          console.warn('Failed to draw title line:', line, error)
          yPosition -= 25 // Still move position even if drawing fails
        }
      })
      
      yPosition -= 20
    }

    // Add content blocks dynamically
    for (const block of contentBlocks) {
      const [r, g, b] = hexToRgb(block.styles?.color || '#000000')
      
      // Choose appropriate font based on styles
      let blockFont = block.styles?.fontWeight === 'bold' ? fontBold : font

      // Calculate dynamic font size based on block type
      let fontSize = Math.max(block.styles?.fontSize || 12, 8)
      if (block.type === 'heading') {
        fontSize = Math.max(fontSize, 18)
      }

      const lineHeight = fontSize * (block.styles?.lineHeight || 1.5)

      // Wrap text for the block
      const lines = wrapText(block.content || '', blockFont, fontSize, maxWidth)

      // Draw each line with proper positioning
      for (const line of lines) {
        // Skip empty lines
        if (!line.trim()) {
          yPosition -= lineHeight
          continue
        }

        // Check if we need a new page
        if (yPosition < margin + fontSize) {
          page = pdfDoc.addPage([width, height])
          yPosition = height - margin
        }

        // Handle text alignment dynamically
        let xPosition = margin
        
        try {
          const textWidth = blockFont.widthOfTextAtSize(line, fontSize)
          const textAlign = block.styles?.textAlign || 'left'
          
          if (textAlign === 'center') {
            xPosition = (width - textWidth) / 2
          } else if (textAlign === 'right') {
            xPosition = width - margin - textWidth
          }

          // Draw the text line with error handling
          page.drawText(line, {
            x: xPosition,
            y: yPosition,
            size: fontSize,
            font: blockFont,
            color: rgb(r, g, b),
          })
        } catch (error) {
          console.warn('Failed to draw text line:', line, error)
          // Fallback: draw a simple version without width calculation
          try {
            page.drawText(cleanText(line), {
              x: margin,
              y: yPosition,
              size: fontSize,
              font: blockFont,
              color: rgb(r, g, b),
            })
          } catch (fallbackError) {
            console.error('Fallback drawing also failed:', fallbackError)
          }
        }

        yPosition -= lineHeight
      }

      // Add dynamic spacing after block based on block type
      const spacingMap: Record<string, number> = {
        'heading': 15,
        'container': 20,
        'custom': 18,
        'paragraph': 10
      }
      
      const spacing = spacingMap[block.type] || 10
      yPosition -= spacing
    }

    // Add footer if there's content
    if (contentBlocks.length > 0) {
      const footerText = `Generated on ${new Date().toLocaleDateString()} • PDF Craft Pro`
      const cleanedFooter = cleanText(footerText)
      const footerY = 30
      
      if (cleanedFooter) {
        try {
          page.drawText(cleanedFooter, {
            x: margin,
            y: footerY,
            size: 10,
            font: font,
            color: rgb(0.5, 0.5, 0.5),
          })
        } catch (error) {
          console.warn('Failed to draw footer:', error)
        }
      }
    }

    // Serialize the PDF to bytes
    const pdfBytes = await pdfDoc.save()

    // Convert to Buffer
    const pdfBuffer = Buffer.from(pdfBytes)

    // Return the PDF as a response
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
      { error: 'Failed to generate PDF due to content formatting issues. Please check your text content.' },
      { status: 500 }
    )
  }
}