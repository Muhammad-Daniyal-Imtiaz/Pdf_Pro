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

// CV Types
interface CVTemplate {
  id: string
  name: string
  category: string
  description: string
  thumbnail: string
  structure: CVSection[]
  styles: CVStyles
}

interface CVSection {
  id: string
  type: 'personal' | 'summary' | 'experience' | 'education' | 'skills' | 'projects' | 'languages' | 'certifications'
  title: string
  content: string
  fields?: CVField[]
}

interface CVField {
  id: string
  label: string
  value: string
  type: 'text' | 'textarea' | 'date' | 'select'
}

interface CVStyles {
  fontFamily: string
  primaryColor: string
  secondaryColor: string
  layout: 'classic' | 'modern' | 'creative' | 'minimal'
  spacing: number
}

export async function POST(request: NextRequest) {
  try {
    const { contentBlocks, styles, layout, template, cvTemplate, documentType } = await request.json()

    // Handle CV Generation
    if (documentType === 'cv' && cvTemplate) {
      return await generateCVPDF(cvTemplate)
    }

    // Handle Regular Document Generation
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
    const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)
    const fontBoldItalic = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique)

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
    const wrapText = (text: string, fontType: any, fontSize: number, maxWidth: number): string[] => {
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
          const textWidth = fontType.widthOfTextAtSize(testLine, fontSize)
          
          if (textWidth <= maxWidth) {
            currentLine = testLine
          } else {
            lines.push(currentLine)
            currentLine = word
          }
        } catch {
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
        } catch {
          console.warn('Failed to draw title line:', line)
          yPosition -= 25 // Still move position even if drawing fails
        }
      })
      
      yPosition -= 20
    }

    // Add content blocks dynamically
    for (const block of contentBlocks) {
      const [r, g, b] = hexToRgb(block.styles?.color || '#000000')
      
      // Choose appropriate font based on styles
      let blockFont = font
      if (block.styles?.fontWeight === 'bold') {
        blockFont = fontBold
      }

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
        } catch {
          console.warn('Failed to draw text line:', line)
          // Fallback: draw a simple version without width calculation
          try {
            page.drawText(cleanText(line), {
              x: margin,
              y: yPosition,
              size: fontSize,
              font: blockFont,
              color: rgb(r, g, b),
            })
          } catch {
            console.error('Fallback drawing also failed')
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
        } catch {
          console.warn('Failed to draw footer')
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

// CV PDF Generation Function
async function generateCVPDF(cvTemplate: CVTemplate) {
  try {
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595.28, 841.89]) // A4 in points
    
    // Embed fonts
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    
    // Helper function to convert hex color to RGB
    const hexToRgb = (hex: string): [number, number, number] => {
      if (!hex || typeof hex !== 'string') {
        return [0, 0, 0]
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

    const [primaryR, primaryG, primaryB] = hexToRgb(cvTemplate.styles.primaryColor)
    const [secondaryR, secondaryG, secondaryB] = hexToRgb(cvTemplate.styles.secondaryColor)

    let yPosition = 800 // Start from top

    // Get personal information
    const personalSection = cvTemplate.structure.find(s => s.type === 'personal')
    const nameField = personalSection?.fields?.find(f => f.id === 'name')
    const titleField = personalSection?.fields?.find(f => f.id === 'title')

    // Draw Name
    if (nameField?.value) {
      page.drawText(nameField.value, {
        x: 50,
        y: yPosition,
        size: 24,
        font: fontBold,
        color: rgb(primaryR, primaryG, primaryB),
      })
      yPosition -= 40
    }

    // Draw Title
    if (titleField?.value) {
      page.drawText(titleField.value, {
        x: 50,
        y: yPosition,
        size: 16,
        font: font,
        color: rgb(secondaryR, secondaryG, secondaryB),
      })
      yPosition -= 30
    }

    // Draw contact information
    const contactFields = personalSection?.fields?.filter(f => 
      f.id !== 'name' && f.id !== 'title' && f.value
    ) || []
    
    const contactText = contactFields.map(f => f.value).join(' • ')
    if (contactText) {
      page.drawText(contactText, {
        x: 50,
        y: yPosition,
        size: 10,
        font: font,
        color: rgb(0.4, 0.4, 0.4),
      })
      yPosition -= 40
    }

    // Draw sections
    for (const section of cvTemplate.structure.filter(s => s.type !== 'personal')) {
      // Check if we need a new page
      if (yPosition < 100) {
        pdfDoc.addPage([595.28, 841.89])
        yPosition = 800
      }

      // Section title
      page.drawText(section.title, {
        x: 50,
        y: yPosition,
        size: 16,
        font: fontBold,
        color: rgb(primaryR, primaryG, primaryB),
      })
      yPosition -= 25

      // Section content
      if (section.content) {
        const lines = section.content.split('\n').filter(line => line.trim())
        for (const line of lines) {
          if (yPosition < 50) {
            pdfDoc.addPage([595.28, 841.89])
            yPosition = 800
          }
          
          page.drawText(line.trim(), {
            x: 50,
            y: yPosition,
            size: 11,
            font: font,
            color: rgb(0.2, 0.2, 0.2),
          })
          yPosition -= 15
        }
      } else if (section.fields) {
        for (const field of section.fields.filter(f => f.value)) {
          if (yPosition < 50) {
            pdfDoc.addPage([595.28, 841.89])
            yPosition = 800
          }
          
          page.drawText(`${field.label}: ${field.value}`, {
            x: 50,
            y: yPosition,
            size: 11,
            font: font,
            color: rgb(0.2, 0.2, 0.2),
          })
          yPosition -= 15
        }
      }

      yPosition -= 20 // Space between sections
    }

    // Add footer
    page.drawText(`Generated on ${new Date().toLocaleDateString()} • PDF Craft Pro CV Builder`, {
      x: 50,
      y: 30,
      size: 8,
      font: font,
      color: rgb(0.5, 0.5, 0.5),
    })

    const pdfBytes = await pdfDoc.save()
    const pdfBuffer = Buffer.from(pdfBytes)

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="cv.pdf"',
        'Content-Length': pdfBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('CV PDF generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate CV PDF. Please try again.' },
      { status: 500 }
    )
  }
}

// Optional: Separate endpoint for CV generation
export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'PDF Generation API' })
}