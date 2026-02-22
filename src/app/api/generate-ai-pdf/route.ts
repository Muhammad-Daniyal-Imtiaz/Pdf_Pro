// app/api/generate-ai-pdf/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// WORLD-CLASS AI PDF GENERATION ENGINE v4
// Key fix: AI is prompted with 794×1123 (96 DPI) — the REAL editor canvas size.
// Output is run through enforceLayout() which fixes z-index, overflow,
// collision, and icon sizing before elements reach the editor.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { enforceLayout } from '@/app/lib/layout-engine'
import { CANVAS_WIDTH_PX, CANVAS_HEIGHT_PX } from '@/lib/constants'

export const runtime = 'nodejs'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_API_KEY ||
  process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
  ''
)

// ─── In-memory rate limiter (upgrade to Redis for multi-instance) ──────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_MAX = 15
const RATE_LIMIT_WINDOW_MS = 60_000

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT_MAX) return false
  entry.count++
  return true
}

// ─── Full A4 Element Schema (injected into every AI call) ────────────────────
// NOTE: We prompt with 794×1123 (96 DPI) which is the ACTUAL editor canvas.
const A4_ELEMENT_SCHEMA = `
=== CANVAS SPECIFICATION (A4 at 96 DPI — Screen Resolution) ===
Canvas: 794px wide × 1123px tall. Origin (0,0) = top-left corner.
Safe zone: x: 20–774, y: 20–1103. NEVER place elements outside this zone.
Standard margins: left=40, right=754, top=40, bottom=1083.

=== ELEMENT TYPES (ONLY these are valid) ===

1. TEXT ELEMENT
   Required: type:"text", id(unique string), x(number), y(number), content(string)
   style: { width(number), height(number), fontSize(8–72), fontWeight(400|600|700|800),
            color(hex string), fontFamily(string), textAlign("left"|"center"|"right"),
            backgroundColor("transparent"|hex), padding(0–20), lineHeight(1.2–2.0), zIndex(number), 
            letterSpacing(number), boxShadow(optional e.g. "0 4px 10px rgba(0,0,0,0.1)") }

2. SHAPE ELEMENT  
   Required: type:"shape", id, x, y
   style: { width, height, backgroundColor(hex), borderRadius(0–100),
            opacity(0.05–1.0), zIndex, borderWidth(optional), borderColor(optional hex),
            boxShadow(optional e.g. "0 10px 15px rgba(0,0,0,0.05)") }

3. LINE ELEMENT
   Required: type:"line", id, x, y, lineOrientation("horizontal"|"vertical")
   style: { width(line length), height(line thickness 1–6), backgroundColor(hex), zIndex }

4. IMAGE PLACEHOLDER
   Required: type:"image", id, x, y, content:""
   style: { width, height, backgroundColor("#f3f4f6"), borderRadius(optional), zIndex }

5. SOCIAL ICON
   Required: type:"social-icon", id, x, y, iconType("linkedin"|"email"|"phone"|"github"|"website"|"location"|"twitter"|"calendar"|"user")
   style: { width(20–60), height(20–60), zIndex }

=== ABSOLUTE RULES ===
1. CANVAS BOUNDS: x + style.width ≤ 794; y + style.height ≤ 1123.
2. HEADING PLACEMENT ON BANNERS (CRITICAL):
   - When you place a heading ON a banner/background shape, the heading must use:
     - type: "heading" (never "text" for a main title)
     - zIndex: 6 (always above the banner which is at zIndex -1 or 0)
     - color: "#ffffff" if the banner is dark, or the primary token if on white
     - x and y must be WITHIN the banner's bounds (not outside)
   - Example: Banner at {x:0, y:0, width:794, height:240, zIndex:0}
     Then heading at {type:"heading", x:40, y:70, style:{width:714, height:90, zIndex:6, color:"#fff", fontSize:56, fontWeight:800}}
3. HEIGHT CALCULATION (NON-NEGOTIABLE):
   - chars_per_line = (width - padding*2) / (fontSize * 0.52)
   - lines = ceil(content.length / chars_per_line)
   - height = (lines * fontSize * lineHeight) + (padding * 2) + 20    ← always add 20px buffer
   - NEVER give a height smaller than this value.
4. COLLISION PREVENTION for CONTENT elements:
   - Sort all content elements by y ascending.
   - For each element, next_y = previous_bottom + gap (minimum 8px, recommended 20px).
   - EXCEPTION: Elements in different columns (x ranges don't overlap) do NOT need y gaps between them.
   - DO NOT apply collision rules to background shapes (zIndex -1 or 0).
5. Every id MUST be unique: use "el-{pageIndex}-{sequenceNumber}".
6. SOCIAL ICONS:
   - Width and height MUST be equal (square): use 22x22 for inline rows, 32x32 for standalone.
   - For a row of N icons, space them: x = startX + (i * (iconSize + gap))
   - Never place two icons in the same x/y position.
7. BACKGROUND SHAPES must use: x:0, y:0, width:794, height:1123, zIndex:-1.
   BANNER SHAPES (partial) must use: x:0, y:0, width:794, height:170-250, zIndex:0.

=== Z-INDEX LAYER REFERENCE ===
   -1 → Full-page background fill
    0 → Banner / section background shape  
    1 → Images
    2 → Lines / dividers
    3 → Body text / paragraph
    4 → Social icons
    5 → HEADINGS (always render on top)

=== TYPOGRAPHY SCALE (PRODUCTION GRADE) ===
- Main Page Title: type:"heading", fontSize 36-48, fontWeight 800, zIndex 5
- Section Headings: type:"heading", fontSize 16-22, fontWeight 700, zIndex 5  
- Sub-headings: type:"text", fontSize 12-14, fontWeight 600
- Body Text: type:"text" or "paragraph", fontSize 9-11, fontWeight 400, lineHeight 1.5-1.6
- Captions/Labels: type:"text", fontSize 7-9, fontWeight 600

=== DESIGN WOW FACTORS ===
- Use a full-width hero banner (zIndex:0 shape) at top of page 0 with primary token background
- Always place main title heading directly INSIDE the banner (same y range), with zIndex:5
- Use box-shadow on section cards: "0 4px 16px rgba(0,0,0,0.08)"
- Use borderRadius 10-14px on section cards for modern look
- Horizontal spacing: left margin x:40, right side at x:315 for 2-column
- Vertical rhythm: 30-40px gap between major sections

=== OUTPUT FORMAT (strict JSON, NO markdown) ===
{
  "pages": [
    {
      "pageIndex": 0,
      "elements": [ ...elements ]
    }
  ]
}
`

// ─── Document-type specific layout guidance ───────────────────────────────────
const LAYOUT_ARCHETYPES: Record<string, Record<string, string>> = {
  cv: {
    'tech-modern': 'Full-height accent sidebar (x:0, width:190, zIndex:-1, backgroundColor:tokens.surface). Main content at x:220. Bold vertical divider line (x:205, width:1, height:800).',
    'creative-bold': 'Full-width hero header (height:200, backgroundColor:tokens.primary). Use cards (type:shape, borderRadius:12, boxShadow) for each major section.',
    'elegant-minimalist': 'Ultra-clean white space. 60px margins everywhere. Thin dividers (height:1, opacity:0.3). Serif headings (headingFont).',
    'modern-professional': 'Balanced 2-column layout. Contact icons in a horizontal bar below name. Sections clearly separated by 40px gaps.',
    'corporate-formal': 'Single column layout. Section titles with backgrounds (height:30, width:515, borderRadius:4, zIndex:0). High contrast text.',
    'warm-executive': 'Rich colors. Use shapes as left-accent bars for headers (width:4, height:24, x:30). Serif fonts.'
  },
  proposal: {
    'creative-bold': 'Vibrant hero banner with large white title. Page 0 = Title Page with full-width background image placeholder. Content cards with heavy shadows.',
    'corporate-formal': 'Strict grid alignment. Left-aligned headers at x:40. Section numbers. Heavy dividers.',
    'modern-professional': 'Service-based layout. Use large horizontal containers for "Services" and "Pricing".'
  },
  report: {
    'tech-modern': 'Data-driven look. Use lines as grid markers. Small captions for stats. Monospace-feel text.',
    'corporate-formal': 'Header/Footer on every page showing "CONFIDENTIAL". Clear page numbering.'
  }
}

function getDocTypeGuidance(docType: string, tokens: any, role: string, experience: string, topic: string, style: string): string {
  const archetypeGuidance = LAYOUT_ARCHETYPES[docType]?.[style] ||
    LAYOUT_ARCHETYPES[docType]?.['modern-professional'] || '';

  const additionalContext = archetypeGuidance ? `\nSPECIFIC STYLE ARCHETYPE: ${archetypeGuidance}\n` : '';

  const guides: Record<string, string> = {
    cv: `
=== CV/RESUME LAYOUT GUIDANCE ===
Structure: Header zone (top 140px) → Contact bar → Section divider → 2-column body OR single column
Required sections: Professional header with name + title, Contact information row with icons,
Summary/Profile paragraph, Experience section with job entries, Skills section, Education section.

Header design:
- Background shape: x:0, y:0, width:595, height:130, backgroundColor:"${tokens.primary}", zIndex:0
- Full name: type:"heading", fontSize 38–44, fontWeight 800, color:"#ffffff", y around 45, zIndex:5
- Job title: type:"text", fontSize 14, fontWeight 400, color:"rgba(255,255,255,0.85)", y around 95, zIndex:4

Contact row (below header around y:145):
- Social icons for email, phone, linkedin, location — spaced evenly, size 20x20
- Contact text labels next to each icon, fontSize 9

Section structure:
- Section heading: fontSize 13, fontWeight 700, color:"${tokens.primary}", uppercase
- Thin separator line after heading: height:1, backgroundColor:"${tokens.border}", full width
- Job title + company: fontSize 11, fontWeight 600
- Date range (right-aligned): fontSize 9, color:"${tokens.textMuted}"
- Bullet point text: fontSize 9–10, leading with "•"

For ${role || 'Professional'} with ${experience || '5'} years experience — tailor all content specifically to this role.
`,
    proposal: `
=== BUSINESS PROPOSAL LAYOUT GUIDANCE ===
Structure: Bold hero section (top 180px) → Executive summary box → 3 content sections → Pricing/CTA

Hero section:
- Background: full-width shape, backgroundColor:"${tokens.primary}", height:180
- Document title: type:"heading", fontSize 32–40, fontWeight 800, color:"#ffffff", zIndex:5
- Subtitle/tagline: type:"text", fontSize 13, color:"rgba(255,255,255,0.8)", zIndex:4
- Prepared by text: fontSize 9, y near bottom of hero

Content sections (use cards — rounded shapes with backgroundColor:"${tokens.surface}"):
- Section headers: fontSize 16, fontWeight 700, color:"${tokens.primary}"
- Body text: fontSize 10, lineHeight 1.6

Include: Overview, Solution/Approach, Timeline, Investment/Pricing, Next Steps
Topic: ${topic || 'Business Services'}
`,
    report: `
=== REPORT LAYOUT GUIDANCE ===  
Structure: Title page header (top 120px) → Abstract/Summary box → Body sections with callouts

Header: Document title, subtitle, date, author/organization
Abstract box: Light background shape, key summary 3-4 lines
Body: Multiple sections with clear headings, data callout boxes for key statistics
Footer: Page number, confidentiality notice

Topic: ${topic || 'Business Report'}
`,
    letter: `
=== COVER LETTER LAYOUT GUIDANCE ===
Structure: Letterhead top (100px) → Date + Recipient block → Salutation → Body (3 paragraphs) → Closing

Letterhead: Applicant name prominent at top, contact info row with icons
Body: Professional paragraph text, fontSize 10, lineHeight 1.6, proper margins (x:50, width:495)
Closing: "Sincerely," + name + signature space

Role applying for: ${role || 'Position'}
`,
    invoice: `
=== INVOICE LAYOUT GUIDANCE ===
Structure: Company header (top 100px) → Invoice meta (number, dates) → Bill-to section → 
           Line items area (table-style with alternating row shapes) → Totals → Payment terms

Include: INVOICE label prominently, invoice number, issue date, due date,
         From section, To section, service description rows, subtotal, tax, TOTAL (large),
         Payment terms, bank details area, thank you note

Topic: ${topic || 'Professional Services'}
`,
    brochure: `
=== BROCHURE LAYOUT GUIDANCE ===
Structure: Full-bleed hero (top 200px) → 3-column features grid → About section → CTA section

Hero: Bold headline, subheadline, tagline — all on colored background
Features: 3 icon+heading+text cards side by side
Use brand colors prominently throughout

Topic: ${topic || 'Company Services'}
`,
  }

  return additionalContext + (guides[docType] || `Create a professional ${docType} document about: ${topic || role || 'General'}`)
}

// ─── Style-specific design token injection ────────────────────────────────────
function buildDesignTokenPrompt(tokens: any, style: string): string {
  return `
=== DESIGN TOKENS — USE THESE EXACT VALUES ===
Style name: ${style}
Primary color: "${tokens.primary}" — use for main headings, hero backgrounds, accent shapes
Secondary color: "${tokens.secondary}" — use for subtle backgrounds, section fills
Accent color: "${tokens.accent}" — use for highlights, icons, borders
Text color: "${tokens.text}" — use for all body text
Muted text: "${tokens.textMuted}" — use for captions, dates, labels
Background: "${tokens.bg}" — page background (usually applied as full-page shape)
Surface: "${tokens.surface}" — card backgrounds, section containers
Border color: "${tokens.border}" — divider lines, container borders
Heading font: "${tokens.headingFont}"
Body font: "${tokens.bodyFont}"

COLOR RULES:
- Only use colors from the above palette — no random colors
- Text on dark backgrounds (primary) MUST be "#ffffff" or "rgba(255,255,255,0.85)"
- Text on light backgrounds use the text or textMuted colors
- Accent color for small elements: icons, highlights, decorative shapes
`
}

// ─── Main route handler ────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  // Rate limiting
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anonymous'
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please wait a minute before generating again.', success: false },
      { status: 429 }
    )
  }

  // Parse input
  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body', success: false }, { status: 400 })
  }

  // Sanitize and validate inputs
  const docType = ['cv', 'proposal', 'report', 'letter', 'invoice', 'brochure', 'document'].includes(body.documentType)
    ? body.documentType : 'document'
  const pageCount = Math.max(1, Math.min(10, Number(body.pageCount) || 1))
  const style = String(body.style || 'modern-professional').slice(0, 100)
  const role = String(body.role || '').slice(0, 300)
  const experience = String(body.experience || '').slice(0, 50)
  const topic = String(body.topic || '').slice(0, 500)
  const userPrompt = String(body.prompt || '').slice(0, 2000)

  // Get design tokens (from request or use defaults)
  const tokens = body.designTokens || {
    primary: '#1e40af', secondary: '#dbeafe', accent: '#3b82f6',
    text: '#0f172a', textMuted: '#64748b', bg: '#ffffff', surface: '#f8fafc',
    border: '#e2e8f0', headingFont: 'Inter, sans-serif', bodyFont: 'Inter, sans-serif'
  }

  // Build the master system prompt
  const systemPrompt = A4_ELEMENT_SCHEMA +
    buildDesignTokenPrompt(tokens, style) +
    getDocTypeGuidance(docType, tokens, role, experience, topic, style)

  // Build user request
  const numPages = pageCount
  const userRequest = `
Create a ${numPages}-page ${docType} PDF with ${style} styling.
${role ? `For role: ${role}` : ''}
${experience ? `Years of experience: ${experience}` : ''}
${topic ? `Topic/Subject: ${topic}` : ''}
${userPrompt ? `Additional requirements: ${userPrompt}` : ''}
${body.archetypeHint ? body.archetypeHint : ''}

Requirements:
- Generate exactly ${numPages} page(s)
- Each page must have minimum 10 elements, aim for 14–20 for richness
- Make ALL content realistic and specific (no "Lorem ipsum", no "[YOUR NAME]" placeholders)
- If this is a CV, use realistic job titles, company names, dates, skills
- If this is a proposal/report, use realistic business language and specific details
- Ensure pixel-perfect alignment: elements in the same visual group should share x positions
- Create visual depth with colored background shapes behind text sections
- Use the EXACT design tokens provided — no other colors

Output ONLY valid JSON. No markdown. No explanation. Just JSON.
`

  // Configure Gemini model - use Flash for speed + cost efficiency
  const model = genAI.getGenerativeModel({
    model: 'gemini-flash-latest',
    systemInstruction: systemPrompt,
    generationConfig: {
      temperature: 0.75,        // Enough creativity for variety, stable enough for structure
      maxOutputTokens: 16384,   // Large enough for multi-page docs
      responseMimeType: 'application/json', // CRITICAL: Forces pure JSON, no markdown wrapping
    }
  })

  // ── Call with retry logic ──────────────────────────────────────────────────
  let lastError = ''
  let result: any = null

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const retryInstruction = attempt > 0
        ? `\n\nPREVIOUS ATTEMPT FAILED: ${lastError}\nPlease fix this issue and generate valid JSON.`
        : ''

      const response = await model.generateContent(userRequest + retryInstruction)
      const text = response.response.text()

      // Try to parse — handle edge case where AI wraps in ```json``` despite mime type
      let parsed: any
      try {
        parsed = JSON.parse(text)
      } catch {
        // Strip markdown if present (shouldn't happen with responseMimeType but just in case)
        const cleaned = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
        parsed = JSON.parse(cleaned)
      }

      // Validate response structure
      if (!parsed.pages || !Array.isArray(parsed.pages) || parsed.pages.length === 0) {
        throw new Error('Response missing pages array')
      }

      const totalElements = parsed.pages.reduce((sum: number, p: any) => sum + (p.elements?.length || 0), 0)
      if (totalElements < 5) {
        throw new Error(`Only ${totalElements} elements generated — need at least 5`)
      }

      // Ensure pageIndex is set, then run layout enforcement
      parsed.pages = parsed.pages.map((page: any, pageIdx: number) => {
        const rawElements = (page.elements || []).map((el: any, elIdx: number) => ({
          ...el,
          id: el.id || `el-${pageIdx}-${elIdx}-${Date.now()}`,
          pageIndex: el.pageIndex ?? pageIdx
        }))
        // enforceLayout fixes z-index, overflow, collision, icon sizing
        // inputIs595:false because we now prompt the AI with 794px canvas
        const fixedElements = enforceLayout(rawElements, { inputIs595: false })
        return {
          ...page,
          pageIndex: page.pageIndex ?? pageIdx,
          elements: fixedElements
        }
      })

      result = parsed
      break // Success!

    } catch (err: any) {
      lastError = err.message || 'Unknown error'
      console.warn(`[generate-ai-pdf] Attempt ${attempt + 1}/3 failed: ${lastError}`)

      if (attempt < 2) {
        // Exponential backoff before retry
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
      }
    }
  }

  if (!result) {
    return NextResponse.json(
      { error: `AI generation failed after 3 attempts: ${lastError}`, success: false },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    pages: result.pages,
    width: CANVAS_WIDTH_PX,    // 794 — correct editor canvas width
    height: CANVAS_HEIGHT_PX,  // 1123 — correct editor canvas height
    elementCount: result.pages.reduce((sum: number, p: any) => sum + (p.elements?.length || 0), 0),
    pageCount: result.pages.length
  })
}

export async function GET() {
  return NextResponse.json({
    status: 'Ready — World-Class AI PDF Generator v3',
    engine: 'Gemini 1.5 Flash with full schema injection',
    features: ['A4 schema enforcement', 'Design tokens', 'Layout archetypes', 'Retry logic', 'JSON mode'],
    endpoint: '/api/generate-ai-pdf',
    method: 'POST'
  })
}