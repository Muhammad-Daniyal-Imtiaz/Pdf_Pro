// app/api/generate-ai-pdf/route.ts - SIMPLE, CLEAN, PROFESSIONAL PDF GENERATOR
import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const runtime = 'nodejs'
export const maxDuration = 60

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY || 
  process.env.NEXT_PUBLIC_GEMINI_API_KEY || 
  ''
)

// SIMPLE PROMPT - Generates clean, collision-free layouts
function generatePrompt(request: any): string {
  const { prompt, documentType, pageCount = 1, role, experience, topic } = request
  
  const userContent = prompt || topic || role || 'Professional document'
  
  return `You are a PROFESSIONAL DOCUMENT DESIGNER. Create a SIMPLE, CLEAN, BLACK-AND-WHITE ${documentType}.

USER REQUEST: ${userContent}
${role ? `\nRole: ${role}` : ''}
${experience ? `\nExperience: ${experience} years` : ''}

CRITICAL RULES:
1. BLACK TEXT ONLY: All text must be #000000 on white background
2. NO COLORS: No colored backgrounds, no decorative elements
3. CLEAN SPACING: 30px minimum between elements
4. NO OVERLAPS: Each element BELOW the previous one
5. SIMPLE LAYOUT: Left-aligned, single column, professional

CANVAS SIZE: 794px wide × 1123px tall
SAFE AREA: X between 60-700, Y starts at 80

POSITIONING FORMULA (MANDATORY):
- Start at Y = 80
- For each new element: Y = previous_Y + previous_height + 30
- All elements at X = 60 (left-aligned)
- Width = 674 (full content width)

ELEMENT TYPES:
{
  "id": "unique-id",
  "type": "heading" | "paragraph" | "line",
  "x": 60,
  "y": calculated_position,
  "content": "actual text",
  "pageIndex": 0,
  "style": {
    "width": 674,
    "height": calculated,
    "fontSize": 12-32,
    "fontWeight": 400 | 700,
    "color": "#000000",
    "backgroundColor": "transparent",
    "textAlign": "left",
    "lineHeight": 1.5,
    "padding": 0
  }
}

HEIGHT CALCULATION:
- heading: 40-50px
- paragraph: (content.length / 80) * 20 + 20
- line: 2px

DOCUMENT STRUCTURE FOR ${documentType}:
${getDocumentStructure(documentType, userContent, role, experience)}

RETURN ONLY JSON ARRAY - NO MARKDOWN:
[
  { element1 },
  { element2 },
  ...
]`
}

function getDocumentStructure(docType: string, content: string, role: string, exp: string): string {
  const structures: Record<string, string> = {
    cv: `
1. Name (heading, fontSize 32, fontWeight 700, y=80, height=50)
2. Job Title (paragraph, fontSize 16, y=150, height=30)
3. Divider Line (y=200, height=2)
4. "Professional Summary" (heading, fontSize 18, y=230, height=35)
5. Summary text (paragraph, fontSize 13, y=280, height=80)
6. "Experience" (heading, fontSize 18, y=390, height=35)
7. Job 1 Title + Company (paragraph, fontSize 14, y=440, height=25)
8. Job 1 Description (paragraph, fontSize 12, y=480, height=60)
9. Job 2 Title + Company (paragraph, fontSize 14, y=560, height=25)
10. Job 2 Description (paragraph, fontSize 12, y=600, height=60)
11. "Education" (heading, fontSize 18, y=690, height=35)
12. Degree + School (paragraph, fontSize 13, y=740, height=40)
13. "Skills" (heading, fontSize 18, y=810, height=35)
14. Skills list (paragraph, fontSize 12, y=860, height=60)

Use realistic content for ${role || 'Professional'} with ${exp || '5'} years experience.`,
    
    proposal: `
1. Title (heading, fontSize 28, fontWeight 700, y=80, height=45)
2. Subtitle (paragraph, fontSize 14, y=145, height=25)
3. Divider (y=190, height=2)
4. "Executive Summary" (heading, fontSize 18, y=220, height=35)
5. Summary text (paragraph, fontSize 12, y=270, height=100)
6. "Project Objectives" (heading, fontSize 18, y=400, height=35)
7. Objectives text (paragraph, fontSize 12, y=450, height=80)
8. "Proposed Solution" (heading, fontSize 18, y=560, height=35)
9. Solution text (paragraph, fontSize 12, y=610, height=100)
10. "Timeline" (heading, fontSize 18, y=740, height=35)
11. Timeline text (paragraph, fontSize 12, y=790, height=60)
12. "Investment" (heading, fontSize 18, y=880, height=35)
13. Pricing text (paragraph, fontSize 12, y=930, height=60)

Topic: ${content}`,
    
    report: `
1. Title (heading, fontSize 28, y=80, height=45)
2. Date (paragraph, fontSize 12, y=145, height=20)
3. Divider (y=185, height=2)
4. "Abstract" (heading, fontSize 18, y=215, height=35)
5. Abstract text (paragraph, fontSize 12, y=265, height=80)
6. "Introduction" (heading, fontSize 18, y=375, height=35)
7. Introduction text (paragraph, fontSize 12, y=425, height=100)
8. "Findings" (heading, fontSize 18, y=555, height=35)
9. Findings text (paragraph, fontSize 12, y=605, height=120)
10. "Conclusion" (heading, fontSize 18, y=755, height=35)
11. Conclusion text (paragraph, fontSize 12, y=805, height=80)

Topic: ${content}`,
    
    letter: `
1. Your Name (heading, fontSize 20, y=80, height=35)
2. Your Address (paragraph, fontSize 11, y=130, height=40)
3. Date (paragraph, fontSize 11, y=190, height=20)
4. Recipient Name (paragraph, fontSize 11, y=230, height=20)
5. Company (paragraph, fontSize 11, y=265, height=20)
6. Salutation (paragraph, fontSize 12, y=305, height=25)
7. Opening paragraph (paragraph, fontSize 12, y=350, height=60)
8. Body paragraph 1 (paragraph, fontSize 12, y=430, height=80)
9. Body paragraph 2 (paragraph, fontSize 12, y=530, height=80)
10. Closing paragraph (paragraph, fontSize 12, y=630, height=60)
11. Sign-off (paragraph, fontSize 12, y=710, height=25)
12. Your Name (paragraph, fontSize 12, y=755, height=25)

For ${role || 'Position'}`,
    
    invoice: `
1. "INVOICE" (heading, fontSize 32, y=80, height=50)
2. Invoice Number (paragraph, fontSize 12, y=150, height=20)
3. Date (paragraph, fontSize 12, y=185, height=20)
4. Divider (y=225, height=2)
5. "From:" (heading, fontSize 14, y=255, height=25)
6. Your company details (paragraph, fontSize 11, y=295, height=60)
7. "To:" (heading, fontSize 14, y=385, height=25)
8. Client details (paragraph, fontSize 11, y=425, height=60)
9. Divider (y=505, height=2)
10. "Description" header (heading, fontSize 14, y=535, height=25)
11. Service 1 (paragraph, fontSize 12, y=575, height=25)
12. Service 2 (paragraph, fontSize 12, y=615, height=25)
13. Divider (y=660, height=2)
14. "Total:" (heading, fontSize 16, y=690, height=30)
15. Amount (paragraph, fontSize 16, y=735, height=30)

Topic: ${content}`,
    
    brochure: `
1. Company Name (heading, fontSize 32, y=80, height=50)
2. Tagline (paragraph, fontSize 14, y=150, height=25)
3. Divider (y=195, height=2)
4. "About Us" (heading, fontSize 18, y=225, height=35)
5. About text (paragraph, fontSize 12, y=275, height=80)
6. "Our Services" (heading, fontSize 18, y=385, height=35)
7. Service 1 (paragraph, fontSize 13, y=435, height=50)
8. Service 2 (paragraph, fontSize 13, y=505, height=50)
9. Service 3 (paragraph, fontSize 13, y=575, height=50)
10. "Contact Us" (heading, fontSize 18, y=655, height=35)
11. Contact details (paragraph, fontSize 12, y=705, height=60)

Topic: ${content}`
  }
  
  return structures[docType] || structures.report
}

// Validate and fix layout to prevent collisions
function validateLayout(elements: any[]): any[] {
  const fixed: any[] = []
  let currentY = 80
  
  for (const el of elements) {
    if (!el.type || !el.style) continue
    
    // Fix coordinates
    const x = 60
    let y = Math.max(currentY, Number(el.y) || currentY)
    
    // Calculate proper height
    let height = Number(el.style.height) || 40
    if (['heading', 'paragraph', 'text'].includes(el.type)) {
      const content = String(el.content || '')
      const fontSize = Number(el.style.fontSize) || 13
      const width = 674
      const charsPerLine = Math.max(1, width / (fontSize * 0.5))
      const lines = Math.max(1, Math.ceil(content.length / charsPerLine))
      height = Math.ceil(lines * fontSize * 1.5 + 20)
    }
    
    // Ensure within page bounds
    if (y + height > 1050) {
      height = Math.max(20, 1050 - y)
    }
    
    fixed.push({
      ...el,
      id: el.id || `el-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      x,
      y,
      pageIndex: 0,
      style: {
        width: 674,
        height,
        fontSize: el.style.fontSize || 13,
        fontWeight: el.style.fontWeight || 400,
        color: '#000000',
        backgroundColor: 'transparent',
        textAlign: 'left',
        lineHeight: 1.5,
        padding: 0,
        resizeMode: 'auto-height'
      }
    })
    
    currentY = y + height + 30
  }
  
  return fixed
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!process.env.GEMINI_API_KEY && !process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      throw new Error('API key not configured')
    }

    const prompt = generatePrompt(body)
    
    // Try models in order
    const models = ['gemini-2.0-flash-exp', 'gemini-flash-latest', 'gemini-pro-latest']
    
    for (const modelName of models) {
      try {
        console.log(`🤖 Trying ${modelName}...`)
        
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 8192,
          }
        })

        const result = await model.generateContent(prompt)
        const text = result.response.text()
        
        // Parse JSON
        let cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim()
        const jsonMatch = cleaned.match(/\[[\s\S]*\]/)
        if (jsonMatch) cleaned = jsonMatch[0]
        
        const elements = JSON.parse(cleaned)
        
        if (!Array.isArray(elements) || elements.length === 0) {
          throw new Error('Invalid response')
        }
        
        // Validate and fix
        const validated = validateLayout(elements)
        
        console.log(`✅ Generated ${validated.length} elements`)
        
        return NextResponse.json({
          success: true,
          pages: [{
            id: 'page-0',
            pageIndex: 0,
            elements: validated
          }],
          width: 794,
          height: 1123
        })
        
      } catch (err: any) {
        console.warn(`⚠️ ${modelName} failed:`, err.message)
        continue
      }
    }
    
    throw new Error('All models failed')
    
  } catch (error: any) {
    console.error('❌ Error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'Ready - Simple Professional PDF Generator',
    endpoint: '/api/generate-ai-pdf',
    method: 'POST'
  })
}
