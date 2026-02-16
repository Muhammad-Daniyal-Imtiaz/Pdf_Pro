export const AI_CONFIG = {
  // Your API key
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',

  // ✅ FREE MODELS FROM YOUR models.txt:
  models: [
    'gemini-flash-latest',      // Verified SUCCESS - Points to latest stable flash (1.5)
    'gemini-2.0-flash',         // Standard 2.0 (Note: some keys have 0 quota for this)
    'gemini-2.0-flash-lite',    // Efficient lite model
    'gemini-pro-latest',        // Stable pro fallback
    'gemma-3-4b-it',            // Lightweight fallback
    'gemini-2.0-flash-exp',     // Experimental (Failed with 404 in logs)
  ],

  // Rate limits (Estimated for free tier)
  rateLimits: {
    'gemini-2.0-flash-exp': { rpm: 15, tpm: 1000000, rpd: 1500 },
    'gemini-2.0-flash': { rpm: 15, tpm: 1000000, rpd: 1500 },
    'gemini-flash-latest': { rpm: 15, tpm: 1000000, rpd: 1500 },
    'gemini-2.0-flash-lite': { rpm: 15, tpm: 1000000, rpd: 1500 },
    'gemini-pro-latest': { rpm: 2, tpm: 32000, rpd: 50 },
    'gemma-3-4b-it': { rpm: 30, tpm: 4000000, rpd: 1500 },
  },

  maxTokens: 8192,
  temperature: 0.7,
}

// =============================================================================
// PRODUCTION-GRADE AI PROMPTS - AI HAS FULL CONTROL OVER ALL COMPONENTS
// =============================================================================
export const AI_PROMPTS = {
  cvContent: (role: string, experience: string) => `
    Generate professional CV content for a ${role} with ${experience} years experience.
    Include: Professional summary, key skills, work experience with achievements, education.
    Make it ATS-friendly and compelling.
  `,
  documentContent: (topic: string, type: string) => `
    Create a comprehensive ${type} about "${topic}".
    Include: Executive summary, key points, detailed sections, conclusion.
    Use professional language and structure.
  `,
  mcpMarkdown: (prompt: string) => `
    Act as a Professional Document Architect & Expert Content Generator.
    Your goal is to generate high-fidelity, production-grade Markdown content that will be converted into a premium PDF.
    
    Request: "${prompt}"
    
    MARKDOWN LAYOUT GUIDELINES:
    1. VISUAL HIERARCHY: Use clear headings (# for main titles, ## for sections, ### for sub-sections).
    2. STRUCTURED DATA: Use Markdown Tables for any comparative data, pricing, or list-heavy sections.
    3. EMPHASIS: Use **Bold** for key terms and *Italic* for secondary emphasis.
    4. SEPARATION: Use horizontal rules (---) to separate major thematic blocks.
    5. CALLOUTS: Use Blockquotes (>) for testimonials, quotes, or important highlights.
    6. LISTS: Use task lists (- [ ]) or bullet points for readability.
    7. SPACING: Ensure appropriate padding between sections for a clean, non-cluttered look.
    
    OUTPUT REQUIREMENTS:
    - Output ONLY the Markdown content.
    - DO NOT include any conversational filler.
    - Ensure the document feels like a professionally designed brochure, proposal, or report.
  `,
  layoutIntelligence: (prompt: string, currentContext: string) => `
    Act as an ELITE Document Architect & Layout Engineer (World-Class PDF Expert).
    You have FULL CONTROL over ALL document components and tools.
    Create PIXEL-PERFECT, PROFESSIONAL, COLLISION-FREE layouts that are 50x better than basic designs.

    === AVAILABLE COMPONENTS (You Can Use ALL of These) ===
    
    1. HEADING (type: 'heading') - Main titles, section headers
       - fontSize: 32-40px for H1, 24-28px for H2, 18-20px for H3
       - fontWeight: 700 (bold)
       - width: 674px (full width), resizeMode: 'auto-height'
       - textAlign: 'center' for main title, 'left' for sections
       - Use for: Document titles, major section headers (MUST BE BOLD)
    
    2. PARAGRAPH (type: 'paragraph') - Body text, descriptions
       - fontSize: 14-16px, fontWeight: 400
       - width: 500-674px, resizeMode: 'auto-height'
       - lineHeight: 1.6
       - textAlign: 'left' or 'justify'
       - Use for: Body content, descriptions, explanations
    
    3. TEXT (type: 'text') - Labels, small text, captions, metadata
       - fontSize: 12-14px
       - width: 200-400px
       - resizeMode: 'auto-width' for single line, 'auto-height' for multi
       - Use for: Labels, dates, contact info, captions
    
    4. CONTAINER (type: 'container') - Boxes, cards, sections, info panels
       - backgroundColor: '#f8fafc', '#f1f5f9', '#eff6ff' (subtle grays/blues)
       - borderRadius: 8-12px for modern look
       - borderWidth: 1, borderColor: '#e2e8f0'
       - width: 300-674px, resizeMode: 'auto-height'
       - padding: 16-24px
       - Use for: Cards, info boxes, grouped content, sidebar sections
    
    5. LINE (type: 'line') - Dividers, separators, underlines
       - lineOrientation: 'horizontal' or 'vertical'
       - lineStyle: 'solid', 'dashed', 'dotted'
       - width: 200-674px (horizontal), height: 2-4px
       - backgroundColor: '#cbd5e1' or '#94a3b8'
       - Use for: Section dividers, under headings, separators
    
    6. SOCIAL-ICON (type: 'social-icon') - Contact/social icons
       - iconType: 'email', 'phone', 'linkedin', 'github', 'website', 'location', 'calendar', 'check', 'star'
       - width/height: 24-48px
       - Use for: Contact info, feature lists, ratings
    
    7. IMAGE (type: 'image') - Logos, photos, placeholders
       - width/height: 100-400px
       - content: placeholder text or URL
       - resizeMode: 'fixed'
       - Use for: Logos, profile photos, diagrams
    
    8. LINK (type: 'link') - Clickable URLs, email links
       - color: '#2563eb', fontSize: 14px
       - url: the actual URL
       - resizeMode: 'auto-width'
       - Use for: Website links, email links, references

    === CRITICAL LAYOUT RULES (NO EXCEPTIONS) ===
    
    1. ABSOLUTE COLLISION PREVENTION:
       - Each element MUST have y >= (previous_y + previous_height + 30px)
       - Track cumulative Y position: nextY = currentY + height + 30
       - NO OVERLAPS - even 1px overlap is a FAILURE
    
    2. PROFESSIONAL TYPOGRAPHY (MANDATORY):
       - Main Title (H1): 36-40px, fontWeight: 700, textAlign: 'center', color: '#1a1a1a'
       - Section Headers (H2): 24-28px, fontWeight: 700, textAlign: 'left', color: '#1a1a1a'
       - Subsections (H3): 18-20px, fontWeight: 600, textAlign: 'left', color: '#333333'
       - Body Text: 14-16px, fontWeight: 400, lineHeight: 1.6, color: '#374151'
       - Captions/Labels: 12-14px, fontWeight: 400, color: '#64748b'
       - ALL headings MUST be bold (fontWeight: 600-700)
    
    3. VISUAL DESIGN (PRODUCTION-GRADE):
       - GENEROUS WHITE SPACE: 40-60px between major sections
       - CONSISTENT ALIGNMENT: Left-align body, center main title
       - COLOR HIERARCHY: Dark text (#1a1a1a) on light backgrounds
       - CONTAINERS: Use subtle backgrounds (#f8fafc) to group related content
       - DIVIDERS: Use lines between sections (2px, #cbd5e1)
       - PADDING: 16-24px inside containers, 30px+ between elements
    
    4. CANVAS SPECIFICATIONS:
       - A4: 794px x 1123px
       - Margins: 60px left/right, 80px top
       - Content Area: x: 60-734, y: 80-1063
       - Center point: x = 397
    
    5. HEIGHT CALCULATION FORMULA:
       - charsPerLine = width / (fontSize * 0.55)
       - estimatedLines = Math.ceil(content.length / charsPerLine)
       - height = (estimatedLines * fontSize * lineHeight) + (padding * 2) + 10
       - Example: 674px width, 16px font, 300 chars → ~25 lines → height ~680px
       - MINIMUM height: fontSize * lineHeight * 2 (for very short content)

    === PROFESSIONAL LAYOUT PATTERNS ===
    
    MODERN HEADER:
    1. Main Title (heading, 36-40px, centered, y: 80)
    2. Subtitle (paragraph, 16-18px, centered, y: +50)
    3. Horizontal Line (y: +30, width: 674)
    4. Contact Bar (container with social-icons + text, y: +40)
    
    TWO-COLUMN RESUME:
    1. Left Sidebar (container, x: 60, width: 240, background: '#f8fafc')
       - Profile Photo (image, centered in sidebar)
       - Contact Info (social-icon + text pairs)
       - Skills (heading + text elements)
    2. Right Content (x: 320, width: 414)
       - Name (heading, 32px)
       - Professional Title (text)
       - Experience Section (heading + multiple paragraphs)
       - Education Section (heading + paragraphs)
    
    BUSINESS PROPOSAL:
    1. Company Logo (image, x: 60, y: 80)
    2. Document Title (heading, 32px, centered)
    3. Date & Ref (text, aligned right)
    4. Line Divider
    5. Executive Summary (container with background)
    6. Services Grid (multiple containers in row if space permits)
    7. Investment/Pricing (container with structured text)
    8. Next Steps (heading + call-to-action paragraph)
    9. Contact Section (social-icons + text)

    === OUTPUT SCHEMA ===
    Return array of elements with these exact properties:
    {
        id: string,           // Descriptive: "main-title", "section-experience", "contact-email"
        type: 'heading' | 'paragraph' | 'text' | 'container' | 'line' | 'social-icon' | 'image' | 'link',
        x: number,            // Exact X position
        y: number,            // Calculated Y (NO COLLISIONS)
        content: string,      // Text content (empty for lines/images unless placeholder)
        pageIndex: 0,
        iconType?: string,    // For social-icon: 'email', 'phone', 'linkedin', etc.
        lineOrientation?: 'horizontal' | 'vertical',
        lineStyle?: 'solid' | 'dashed' | 'dotted',
        url?: string,         // For links
        style: {
            width: number,              // Exact width
            height: number,             // CALCULATED (never 'auto')
            fontSize: number,           // Per hierarchy
            fontWeight: 400 | 600 | 700, // Bold for headings
            textAlign: 'left' | 'center' | 'right',
            color: string,              // Professional colors
            backgroundColor: string,    // For containers
            borderWidth?: number,
            borderColor?: string,
            borderRadius?: number,
            padding: number,            // 8-24px
            lineHeight: 1.5 | 1.6,
            resizeMode: 'auto-height' | 'auto-width' | 'fixed'
        }
    }

    CURRENT LAYOUT CONTEXT:
    ${currentContext}

    USER REQUEST:
    "${prompt}"

    === YOUR MISSION ===
    1. Understand the document type and purpose
    2. Create 8-12 separate elements (compact but professional - NEVER a single container with all text)
    3. Use MULTIPLE headings, paragraphs, containers, lines, icons
    4. Calculate EXACT positions ensuring ZERO collisions
    5. Make headings BOLD and properly sized
    6. Create professional visual hierarchy
    7. Add spacing, dividers, containers for polish
    8. Return production-grade, collision-free layout

    CRITICAL RULES:
    - Return ONLY JSON array - NO markdown, NO explanation
    - ALL text elements: resizeMode: 'auto-height'
    - ALL headings: fontWeight: 700 (bold)
    - 30px minimum spacing between ALL elements
    - Calculate heights precisely using formula
    - Create 50x more professional than basic layouts
  `,
  fullDocumentGeneration: (documentType: string, topic: string, style: string) => `
    Act as a WORLD-CLASS Document Designer & Content Strategist.
    Create a COMPLETE, PROFESSIONAL ${documentType} about "${topic}".
    This should be 50x better than basic templates - truly exceptional design.
    STYLE BRIEF: ${style}
    
    === MANDATORY: MULTI-ELEMENT STRUCTURE ===
    You MUST create 8-12 SEPARATE elements - NEVER put all content in one container.
    Each heading, paragraph, and section must be its own element.
    
    REQUIRED ELEMENT TYPES TO USE:
    1. HEADING (type: 'heading') - For ALL titles and section headers
       - Main Title: 36-40px, fontWeight: 700, textAlign: 'center'
       - Section Headers: 24-28px, fontWeight: 700, textAlign: 'left'
       - Subsections: 18-20px, fontWeight: 600, textAlign: 'left'
    
    2. PARAGRAPH (type: 'paragraph') - For ALL body content
       - fontSize: 14-16px, lineHeight: 1.6
       - width: 500-674px
       - resizeMode: 'auto-height'
    
    3. TEXT (type: 'text') - For metadata, dates, contact info
       - fontSize: 12-14px
       - resizeMode: 'auto-width' or 'auto-height'
    
    4. CONTAINER (type: 'container') - For cards, info boxes, grouped sections
       - backgroundColor: '#f8fafc', '#f1f5f9'
       - borderRadius: 8-12px
       - borderWidth: 1, borderColor: '#e2e8f0'
       - padding: 16-24px
    
    5. LINE (type: 'line') - For section dividers
       - lineOrientation: 'horizontal'
       - width: 200-674px, height: 2px
       - backgroundColor: '#cbd5e1'
    
    6. SOCIAL-ICON (type: 'social-icon') - For contact info
       - iconType: 'email', 'phone', 'linkedin', 'location', etc.
       - width/height: 24-32px
    
    7. IMAGE (type: 'image') - For logos, placeholders
       - width/height: 100-200px
    
    === CONTENT REQUIREMENTS ===
    Write COMPELLING, PROFESSIONAL content:
    - Use industry-standard terminology
    - Include specific details and achievements
    - Create substantive sections (not placeholder text)
    - Match tone to document type (formal for legal, energetic for marketing)
    
    === LAYOUT RULES ===
    - A4: 794px x 1123px
    - Start at y: 80
    - Use formula: nextY = currentY + height + 30px
    - NO COLLISIONS - 30px minimum gap
    - Center main title, left-align body
    
    === EXAMPLE STRUCTURES ===
    
    CV/RESUME (8-12 elements):
    1. Full Name (heading, 40px, centered)
    2. Professional Title (text, 16px, centered)
    3. Contact Container (with social-icons + text)
    4. Horizontal Line
    5. "Professional Summary" (heading, 24px)
    6. Summary paragraph
    7. "Experience" (heading, 24px)
    8. Job 1 Title (heading, 18px)
    9. Job 1 Description (paragraph)
    10. "Education" (heading, 24px)
    11. Degree info (paragraph)
    12. Skills container
    
    BUSINESS PROPOSAL (8-12 elements):
    1. Document Title (heading, 32px, centered)
    2. Subtitle (text, centered)
    3. Line Divider
    4. "Executive Summary" (heading, 24px)
    5. Summary paragraph
    6. "Services" (heading, 24px)
    7. Services paragraph
    8. "Investment" (heading, 24px)
    9. Pricing container
    10. "Contact" (heading, 24px)
    11. Contact info container with icons
    
    === OUTPUT ===
    Return JSON array of 8-12 elements. Each element must have:
    {
      id: string (descriptive),
      type: 'heading' | 'paragraph' | 'text' | 'container' | 'line' | 'social-icon' | 'image',
      x: number,
      y: number (calculated),
      content: string,
      pageIndex: 0,
      iconType?: string,
      lineOrientation?: string,
      style: {
        width: number,
        height: number (calculated),
        fontSize: number,
        fontWeight: 400 | 600 | 700,
        textAlign: 'left' | 'center' | 'right',
        color: string,
        backgroundColor?: string,
        padding?: number,
        lineHeight?: number,
        resizeMode: 'auto-height' | 'auto-width'
      }
    }
    
    Create 50x more professional than basic templates. Use ALL component types creatively.
  `,
  mcpAICanvasExport: (canvasContext: string) => `
    Act as a Professional Document Architect.
    I will provide you with a JSON representation of a PDF document canvas.
    Your goal is to transform this raw data into a high-fidelity, production-grade Markdown document.
    
    CANVAS CONTEXT:
    ${canvasContext}
    
    INSTRUCTIONS:
    1. EXRACT CONTENT: Identify all text elements (headings, paragraphs) and preserve their content and hierarchy.
    2. STRUCTURE: Use # for the main document title (usually the largest heading). Use ## and ### for sections.
    3. VISUAL ELEMENTS: Use horizontal rules (---) where the canvas has divider lines or large gaps.
    4. TABLES: If elements are aligned in a grid-like fashion, represent them as a Markdown Table.
    5. CALLOUTS: Use blockquotes for highlighted notes or sidebar-like info.
    6. POLISH: Ensure the document flows naturally and looks like a top-tier professional report or CV.
    
    OUTPUT: Return ONLY the Markdown content.
  `,
}