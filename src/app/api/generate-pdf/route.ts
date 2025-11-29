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

    // Clean text
    const cleanText = (text: string): string => {
      if (!text || typeof text !== 'string') {
        return ''
      }
      
      return text
        .replace(/\n/g, ' ')
        .replace(/\r/g, ' ')
        .replace(/\t/g, ' ')
        .replace(/[^\x20-\x7E]/g, '')
        .trim()
    }

    // Smart text wrapping function
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
          lines.push(currentLine)
          currentLine = word
        }
      }
      
      if (currentLine) {
        lines.push(currentLine)
      }
      
      return lines.filter(line => line.trim().length > 0)
    }

    // MULTI-COLUMN LAYOUT SUPPORT
    const margin = 40
    const totalWidth = width - (margin * 2)
    const numColumns = layout.columns || 1
    const columnWidth = totalWidth / numColumns
    const columnGap = 20
    const actualColumnWidth = columnWidth - columnGap

    // Initialize column Y positions
    let columnYPositions: number[] = Array(numColumns).fill(height - margin)
    let currentColumnIndex = 0

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
      
      // Add title (spans all columns)
      const titleLines = wrapText(title, fontBold, 20, totalWidth)
      for (const line of titleLines) {
        if (columnYPositions[0] < margin + 30) {
          page = pdfDoc.addPage([width, height])
          columnYPositions = Array(numColumns).fill(height - margin)
          currentColumnIndex = 0
        }
        
        try {
          page.drawText(line, {
            x: margin,
            y: columnYPositions[0],
            size: 20,
            font: fontBold,
            color: rgb(0.2, 0.2, 0.2),
          })
          columnYPositions[0] -= 25
        } catch (error) {
          console.warn('Failed to draw title line:', line)
          columnYPositions[0] -= 25
        }
      }
      
      // Reset for content and drop all columns equally
      for (let i = 0; i < numColumns; i++) {
        columnYPositions[i] = columnYPositions[0] - 20
      }
      currentColumnIndex = 0
    }

    // Add content blocks with COLUMN SUPPORT
    for (const block of contentBlocks) {
      const [r, g, b] = hexToRgb(block.styles?.color || '#000000')
      
      let blockFont = font
      if (block.styles?.fontWeight === 'bold') {
        blockFont = fontBold
      }

      let fontSize = Math.max(block.styles?.fontSize || 12, 8)
      if (block.type === 'heading') {
        fontSize = Math.max(fontSize, 18)
      }

      const lineHeight = fontSize * (block.styles?.lineHeight || 1.5)
      const lines = wrapText(block.content || '', blockFont, fontSize, actualColumnWidth)

      // Draw each line
      for (const line of lines) {
        if (!line.trim()) {
          columnYPositions[currentColumnIndex] -= lineHeight
          continue
        }

        // Find column with lowest Y position (most space)
        let lowestY = columnYPositions[0]
        currentColumnIndex = 0
        for (let i = 1; i < numColumns; i++) {
          if (columnYPositions[i] > lowestY) {
            lowestY = columnYPositions[i]
            currentColumnIndex = i
          }
        }

        // Check if we need a new page (all columns full)
        if (columnYPositions[currentColumnIndex] < margin + fontSize) {
          page = pdfDoc.addPage([width, height])
          columnYPositions = Array(numColumns).fill(height - margin)
          currentColumnIndex = 0
        }

        // Calculate X position based on column
        const xPosition = margin + (currentColumnIndex * columnWidth) + 10

        try {
          page.drawText(line, {
            x: xPosition,
            y: columnYPositions[currentColumnIndex],
            size: fontSize,
            font: blockFont,
            color: rgb(r, g, b),
          })
        } catch (error) {
          console.warn('Failed to draw text line:', line)
        }

        columnYPositions[currentColumnIndex] -= lineHeight
      }

      // Add dynamic spacing after block
      const spacingMap: Record<string, number> = {
        'heading': 15,
        'container': 20,
        'custom': 18,
        'paragraph': 10
      }
      
      const spacing = spacingMap[block.type] || 10
      columnYPositions[currentColumnIndex] -= spacing
    }

    // Add footer if there's content
    if (contentBlocks.length > 0) {
      const footerText = `Generated on ${new Date().toLocaleDateString()} • PDF Craft Pro`
      const cleanedFooter = cleanText(footerText)
      
      if (cleanedFooter) {
        try {
          page.drawText(cleanedFooter, {
            x: margin,
            y: 30,
            size: 10,
            font: font,
            color: rgb(0.5, 0.5, 0.5),
          })
        } catch (error) {
          console.warn('Failed to draw footer')
        }
      }
    }

    // Serialize the PDF to bytes
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

    let yPosition = 800

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
      if (yPosition < 100) {
        pdfDoc.addPage([595.28, 841.89])
        yPosition = 800
      }

      page.drawText(section.title, {
        x: 50,
        y: yPosition,
        size: 16,
        font: fontBold,
        color: rgb(primaryR, primaryG, primaryB),
      })
      yPosition -= 25

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

      yPosition -= 20
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

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'PDF Generation API' })
}