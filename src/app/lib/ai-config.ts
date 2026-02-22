// ai-config.ts - PRODUCTION-GRADE AI CONFIGURATION WITH ENTITY EXTRACTION
// =============================================================================

export const AI_CONFIG = {
  // API key from environment
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',

  // Prioritized models - Flash models work best for free tier
  models: [
    'gemini-flash-latest',
    'gemma-3-4b-it',
    'gemini-2.0-flash-lite',
    'gemini-pro-latest',
  ],

  // Rate limits per model
  rateLimits: {
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
// ENTITY EXTRACTION SCHEMAS - Define what data we can extract from user prompts
// =============================================================================
export const ENTITY_SCHEMAS = {
  cv: {
    personal: ['full_name', 'email', 'phone', 'location', 'linkedin', 'github', 'website', 'portfolio'],
    professional: ['job_title', 'current_company', 'years_experience', 'industry'],
    summary: ['professional_summary', 'objective', 'about_me'],
    experience: ['company_name', 'position', 'start_date', 'end_date', 'description', 'achievements'],
    education: ['degree', 'institution', 'graduation_year', 'gpa', 'major', 'minor'],
    skills: ['technical_skills', 'soft_skills', 'languages', 'certifications'],
  },
  cover_letter: {
    sender: ['full_name', 'email', 'phone', 'location', 'current_position'],
    recipient: ['hiring_manager_name', 'company_name', 'company_address', 'job_title_applying'],
    content: ['opening_paragraph', 'body_paragraphs', 'closing_paragraph', 'key_achievements'],
  },
  business_proposal: {
    company: ['company_name', 'company_address', 'contact_person', 'email', 'phone'],
    client: ['client_name', 'client_company', 'client_address'],
    proposal: ['title', 'reference_number', 'date', 'executive_summary', 'objectives', 'scope'],
    services: ['service_name', 'description', 'deliverables', 'price'],
    timeline: ['phase_name', 'duration', 'milestones'],
    investment: ['item', 'cost', 'total'],
  },
  invoice: {
    company: ['company_name', 'address', 'email', 'phone', 'tax_id'],
    client: ['client_name', 'client_address', 'client_email'],
    invoice: ['invoice_number', 'date', 'due_date', 'payment_terms'],
    items: ['description', 'quantity', 'unit_price', 'total'],
    totals: ['subtotal', 'tax', 'discount', 'grand_total'],
  },
  brochure: {
    company: ['company_name', 'tagline', 'description', 'mission', 'vision'],
    services: ['service_name', 'service_description', 'features'],
    contact: ['address', 'phone', 'email', 'website', 'social_media'],
    highlights: ['achievement', 'statistic', 'testimonial'],
  },
}

export interface CvMetric {
  label: string
  value?: string
  keywords?: string[]
}

export interface CvSubAchievement {
  text: string
  metrics?: CvMetric[]
  keywords?: string[]
}

export interface CvJobAchievement {
  title: string
  items: CvSubAchievement[]
}

export interface CvJob {
  id: string
  title: string
  company: string
  location?: string
  startDate?: string
  endDate?: string
  achievements: CvJobAchievement[]
}

export interface CvEducation {
  id: string
  degree: string
  institution: string
  startDate?: string
  endDate?: string
  details?: string
}

export interface CvProject {
  id: string
  name: string
  role?: string
  description: string
  metrics?: CvMetric[]
  keywords?: string[]
}

export interface CvCertification {
  id: string
  name: string
  issuer?: string
  date?: string
}

export interface CvAward {
  id: string
  title: string
  issuer?: string
  date?: string
  description?: string
}

export interface CvLanguageSkill {
  name: string
  proficiency: string
}

export interface CvReference {
  name: string
  role?: string
  company?: string
  contact?: string
}

export interface CvDocumentMeta {
  templateId: string
  locale: string
  idempotencyKey: string
  revision: number
  model: string
  generatedAt: string
}

export interface CvDocument {
  meta: CvDocumentMeta
  personal: {
    fullName: string
    email?: string
    phone?: string
    location?: string
    socials?: {
      linkedin?: string
      github?: string
      website?: string
      twitter?: string
      portfolio?: string
    }
  }
  summary: string
  jobs: CvJob[]
  education: CvEducation[]
  skills: {
    categories: {
      name: string
      items: string[]
    }[]
  }
  projects?: CvProject[]
  certifications?: CvCertification[]
  awards?: CvAward[]
  languages?: CvLanguageSkill[]
  hobbies?: string[]
  references?: CvReference[]
  rawText: string
}

// =============================================================================
// TEMPLATE FIELD MAPPINGS - Map template element IDs to entity fields
// =============================================================================
export const TEMPLATE_FIELD_MAPPINGS: Record<string, Record<string, string>> = {
  // CV Templates
  'cv-modern-blue': {
    'header-name': 'personal.full_name',
    'header-title': 'professional.job_title',
    'contact-info': 'contact_info_formatted',
    'summary-content': 'summary.professional_summary',
    'job-1-title': 'experience.0.position',
    'job-1-company': 'experience.0.company_formatted',
    'job-1-description': 'experience.0.achievements_formatted',
    'skills-content': 'skills.formatted',
    'education-content': 'education.formatted',
  },
  // Business Proposal Templates
  'business-proposal-standard': {
    'proposal-title': 'proposal.title',
    'proposal-subtitle': 'client.formatted',
    'proposal-ref': 'proposal.reference_formatted',
    'prepared-by-name': 'company.contact_person',
    'prepared-by-title': 'company.position_company',
    'prepared-for-name': 'client.client_name',
    'prepared-for-company': 'client.client_company',
    'executive-summary-content': 'proposal.executive_summary',
    'objectives-list': 'proposal.objectives_formatted',
  },
}

// =============================================================================
// AI PROMPTS - Production-Grade with Entity Extraction
// =============================================================================
export const AI_PROMPTS = {
  // =========================================================================
  // MASTER ENTITY EXTRACTION PROMPT
  // =========================================================================
  entityExtraction: (userPrompt: string, templateType: string) => `
You are an ELITE Entity Extraction AI. Your ONLY job is to extract REAL DATA from the user's input and categorize it for document generation.

=== USER INPUT ===
"${userPrompt}"

=== TEMPLATE TYPE ===
${templateType}

=== YOUR MISSION (NESTED REASONING) ===
1. RESEARCH: Identify every proper noun, date, metric, and skill in the input.
2. CATEGORIZE: Map these pieces to the standard document schema for ${templateType}.
3. ENRICH: If the user provides raw experience, REASON about their achievements and format them as professional bullet points.
4. SYNTHESIZE: Generate a high-impact summary that ties the extracted data together.

=== OUTPUT FORMAT (JSON ONLY) ===
Return a JSON object with these nested categories:

{
  "personal": {
    "full_name": "string or null",
    "email": "string or null",
    "phone": "string or null",
    "location": "string or null",
    "socials": { "linkedin": "string", "github": "string", "website": "string" }
  },
  "professional": {
    "job_title": "string or null",
    "experience_summary": "1-sentence punchy summary",
    "total_years": "string"
  },
  "summary": { "professional_summary": "2-3 sentence impactful summary" },
  "experience": [
    {
      "position": "string",
      "company": "string",
      "duration": "string",
      "highlights": ["achievement 1", "achievement 2"]
    }
  ],
  "education": [
    { "degree": "string", "institution": "string", "year": "string", "details": "string" }
  ],
  "skills": {
    "technical": ["skill1", "skill2"],
    "soft": ["skill1"],
    "formatted": "A categorization of all skills for a resume"
  }
}

Return ONLY valid JSON.
`,

  // =========================================================================
  // NESTED TEMPLATE CONTENT GENERATION PROMPT
  // =========================================================================
  templateContentGeneration: (
    templateId: string,
    templateElements: any[],
    extractedEntities: any,
    userPrompt: string
  ) => `
You are the world's most sophisticated "AI Document Studio" engine. 
You are filling a specialized template with IDs that follow a specific document logic.

=== TEMPLATE CONTEXT ===
ID: ${templateId}
ELEMENTS: ${JSON.stringify(templateElements.map(el => ({
    id: el.id,
    type: el.type,
    purpose: inferElementPurpose(el.id, el.type)
  })), null, 2)}

=== USER DATA (EXTRACTED) ===
${JSON.stringify(extractedEntities, null, 2)}

=== USER REQUEST ===
"${userPrompt}"

=== PRODUCTION-GRADE REASONING (DO THIS INTERNALLY) ===
1. THEME ANALYSIS: Based on the template IDs (e.g., 'cv-modern-blue'), identify the expected tone and layout density.
2. CONTENT MAPPING: Map the extracted user data to the element IDs. 
   - 'header-name' -> personal.full_name
   - 'job-1-description' -> experience[0].highlights
3. INTELLIGENT FILL: If an element is a 'heading' used as a section title, keep it as it is in the template UNLESS the user explicitly asked to change it.
4. OVERFLOW AWARENESS: Keep responses concise. Real estate in PDF templates is limited.
5. NESTED SYNTHESIS: Ensure cross-element consistency (e.g., the name in the header matches the footer).

=== YOUR MISSION ===
Return a JSON array of element updates. Fill EVERY relevant element.
If you have no data for an element, and it's a placeholder like "Company Name", replace it with "[Your Company]" or something clean. 
NEVER leave template dummy data like "MUHAMMAD DANIYAL" if the user provided their own name.

=== OUTPUT FORMAT (JSON ARRAY ONLY) ===
[
  { "id": "element-id", "content": "filled content" },
  ...
]

Return ONLY the JSON array. NO prose. NO explanation.
`,

  // =========================================================================
  // FULL DOCUMENT GENERATION (When no template selected)
  // =========================================================================
  fullDocumentGeneration: (documentType: string, userPrompt: string, extractedEntities: any) => `
You are an ELITE Document Architect. Create a COMPLETE professional ${documentType}.

=== USER REQUEST ===
"${userPrompt}"

=== EXTRACTED DATA ===
${JSON.stringify(extractedEntities, null, 2)}

=== CANVAS SPECIFICATIONS ===
- A4: 794px x 1123px
- Content Area: x: 60-734, y: 80-1063
- Minimum element spacing: 30px

=== REQUIRED ELEMENTS FOR ${documentType.toUpperCase()} ===
${getRequiredElementsForType(documentType)}

=== ELEMENT SCHEMA ===
Each element MUST have:
{
  "id": "unique-descriptive-id",
  "type": "heading" | "paragraph" | "text" | "container" | "line" | "social-icon",
  "x": number (60-734),
  "y": number (calculated - NO COLLISIONS),
  "content": "actual text content",
  "pageIndex": 0,
  "iconType": "email|phone|linkedin|github|location" (for social-icon only),
  "lineOrientation": "horizontal|vertical" (for line only),
  "style": {
    "width": number,
    "height": number (calculated based on content),
    "fontSize": number,
    "fontWeight": 400|600|700,
    "color": "#hex",
    "textAlign": "left|center|right",
    "lineHeight": 1.5|1.6,
    "resizeMode": "auto-both",
    "backgroundColor": "#hex" (for containers),
    "borderRadius": number (for containers),
    "padding": number
  }
}

=== HEIGHT CALCULATION ===
- chars_per_line = width / (fontSize * 0.55)
- lines = ceil(content.length / chars_per_line)
- height = (lines * fontSize * lineHeight) + (padding * 2) + 10
- MINIMUM: fontSize * 2

=== COLLISION PREVENTION ===
- Start at y: 80
- Each element: next_y = current_y + height + 30
- NEVER allow overlapping elements

=== OUTPUT ===
Return JSON array of 12-20 elements. NO markdown, NO explanation.
`,

  // Legacy prompts for backward compatibility
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
Act as a Professional Document Architect.
Generate high-fidelity Markdown content for: "${prompt}"
Use proper headings, tables, lists, and emphasis.
Output ONLY Markdown - no explanation.
`,

  layoutIntelligence: (prompt: string, currentContext: string) => `
You are a SENIOR DOCUMENT ART DIRECTOR and LAYOUT ENGINEER.
Your job is to design world-class, print-ready A4 layouts that look like they were crafted by a top 1% designer.

CANVAS SPEC:
- A4: 794px x 1123px
- Safe content area: x: 60–734, y: 80–1063
- Use a clear vertical rhythm and consistent spacing (24–40px)

CURRENT LAYOUT (may be empty "[]"):
${currentContext}

USER REQUEST (content and document type/style hints):
"${prompt}"

REQUIRED OUTPUT:
- Return ONLY a JSON array (no markdown, no comments, no prose).
- Each item is an element placed on the canvas.

ELEMENT SCHEMA (STRICT):
[
  {
    "id": "unique-descriptive-id",
    "type": "heading" | "paragraph" | "text" | "container" | "line" | "social-icon" | "image" | "link",
    "x": number (60–734),
    "y": number (80–1063, no overlaps),
    "pageIndex": number (0-based),
    "content": "visible text label or body copy (can be empty for decorative lines/images)",
    "iconType": "email" | "phone" | "linkedin" | "github" | "location" | "website" | "twitter" | "instagram" | "facebook" | "youtube" | "whatsapp" | "calendar" | "user" (for social-icon only),
    "lineOrientation": "horizontal" | "vertical" (for line only),
    "lineStyle": "solid" | "dashed" | "dotted" (for line only),
    "style": {
      "width": number,
      "height": number,
      "fontSize": number,
      "fontWeight": 400 | 500 | 600 | 700,
      "color": "#hex",
      "backgroundColor": "#hex (for containers or hero bands)",
      "borderWidth": number,
      "borderColor": "#hex",
      "borderRadius": number,
      "textAlign": "left" | "center" | "right",
      "lineHeight": 1.5 | 1.6,
      "padding": number,
      "resizeMode": "auto-both" | "auto-width" | "auto-height" | "fixed",
      "opacity": number
    }
  }
]

3) PRODUCTION-GRADE LAYOUT RULES
- VERTICAL RHYTHM: Use a strict "Stack" approach. next_y = prev_y + prev_height + gap (24-40px).
- COLLISION PREVENTION: NEVER overlap elements. Horizontal overlaps are fine if vertical gap is at least 32px.
- HEIGHT CALCULATION: 
  * chars_per_line = (width - padding*2) / (fontSize * 0.55)
  * lines = ceil(content.length / chars_per_line)
  * height = (lines * fontSize * lineHeight) + (padding * 2) + 12
- SAFE ZONE: Keep all elements within x:60-730 and y:60-1060.
- TYPOGRAPHY: 
  * Main Title: 32-42px, weight 800
  * Section Titles: 18-22px, weight 700, margin-bottom 12px
  * Body: 11-13px, weight 400, line-height 1.6

3) PROFESSIONAL REPORT / ARTICLE STYLE (when the prompt mentions "report", "analysis", "insights", etc.)
- Create a hero header at the top of page 0:
  - Main title heading centered or left-aligned.
  - Optional subtitle/strapline paragraph.
  - Optional thin horizontal line or hero band underneath.
- Below the hero, build clearly separated sections such as:
  - "Executive Summary"
  - "Key Insights" or "Top SaaS Ideas"
  - For each idea: use a container card with a heading and a paragraph.
  - "Conclusion" or "Next Steps".
- Use containers to group related content into cards with subtle backgroundColor and rounded corners.
- Use lines as elegant dividers between major sections.

4) MULTI-PAGE LAYOUT
- If the requested page count or scope implies multiple pages, distribute content across pages:
  - pageIndex 0: title, summary, high-level overview.
  - pageIndex 1+: deeper sections, per-idea analysis, tables, or grids.
- Keep each page visually balanced; do not cram all content into one page.

5) COLLISION-FREE PLACEMENT
- Never overlap elements.
- For each new element on a page, choose y so that:
  newElement.y >= previousElement.y + previousElement.height + 30
- Ensure containers are tall enough to hold their inner text comfortably.

6) VISUAL POLISH
- Use consistent colors and font weights to create a clear hierarchy.
- Align icons and labels in neat rows where used (e.g., contact/info strips).
- Prefer a clean, modern aesthetic (plenty of white space, restrained color palette).

FINAL INSTRUCTIONS:
- Focus on BEAUTIFUL, PRACTICAL layouts suitable for export to PDF.
- Respect the schema exactly.
- Return ONLY a JSON array of elements.
`,

  mcpAICanvasExport: (canvasContext: string) => `
Transform canvas JSON to professional Markdown.
CANVAS: ${canvasContext}
Output ONLY Markdown.
`,
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function inferElementPurpose(id: string, type: string): string {
  const idLower = id.toLowerCase()

  // Name/Header patterns
  if (idLower.includes('name') || idLower.includes('header-name')) return 'PERSON_NAME'
  if (idLower.includes('title') && idLower.includes('job')) return 'JOB_TITLE'
  if (idLower.includes('header-title')) return 'JOB_TITLE'

  // Contact patterns
  if (idLower.includes('contact') || idLower.includes('info')) return 'CONTACT_INFO'
  if (idLower.includes('email')) return 'EMAIL'
  if (idLower.includes('phone')) return 'PHONE'
  if (idLower.includes('location') || idLower.includes('address')) return 'LOCATION'

  // Summary patterns
  if (idLower.includes('summary')) return 'PROFESSIONAL_SUMMARY'
  if (idLower.includes('objective')) return 'OBJECTIVE'
  if (idLower.includes('about')) return 'ABOUT'

  // Experience patterns
  if (idLower.includes('experience') || idLower.includes('job')) return 'EXPERIENCE'
  if (idLower.includes('company')) return 'COMPANY'
  if (idLower.includes('description') || idLower.includes('achievement')) return 'ACHIEVEMENTS'

  // Skills patterns
  if (idLower.includes('skill')) return 'SKILLS'

  // Education patterns
  if (idLower.includes('education') || idLower.includes('degree')) return 'EDUCATION'

  // Proposal patterns
  if (idLower.includes('proposal')) return 'PROPOSAL_TITLE'
  if (idLower.includes('executive')) return 'EXECUTIVE_SUMMARY'
  if (idLower.includes('objective')) return 'OBJECTIVES'
  if (idLower.includes('timeline')) return 'TIMELINE'
  if (idLower.includes('investment') || idLower.includes('cost')) return 'INVESTMENT'
  if (idLower.includes('prepared-by')) return 'PREPARED_BY'
  if (idLower.includes('prepared-for')) return 'PREPARED_FOR'

  // Section titles
  if (type === 'heading') return 'SECTION_TITLE'

  // Default
  return 'CONTENT'
}

function getRequiredElementsForType(documentType: string): string {
  const requirements: Record<string, string> = {
    'cv': `
1. Name (heading, 36-40px, bold, centered or left)
2. Job Title (text, 16-18px)
3. Contact Info (text with email, phone, location)
4. Line Divider
5. "Professional Summary" heading (24px, bold)
6. Summary paragraph
7. "Experience" heading (24px, bold)
8. Job title + company + dates (for each position)
9. Job description with achievements (bullet points)
10. "Skills" heading (24px, bold)
11. Skills content (categorized)
12. "Education" heading (24px, bold)
13. Education content
`,
    'cover-letter': `
1. Sender info (name, address, contact)
2. Date
3. Recipient info (name, company, address)
4. Salutation
5. Opening paragraph (why applying, enthusiasm)
6. Body paragraph 1 (key qualifications)
7. Body paragraph 2 (specific achievements)
8. Closing paragraph (call to action)
9. Sign-off ("Sincerely,")
10. Sender name
`,
    'business-proposal': `
1. Header with company branding
2. Title: "BUSINESS PROPOSAL"
3. Subtitle with client name
4. Reference number and date
5. Prepared by / Prepared for section
6. Executive Summary heading + content
7. Project Objectives heading + bullet list
8. Proposed Solution heading + content
9. Timeline section
10. Investment Summary with pricing
11. Terms & Conditions
12. Contact section
`,
    'invoice': `
1. Company header with logo placeholder
2. "INVOICE" title
3. Invoice number and date
4. Bill To section
5. Items table header
6. Item rows
7. Subtotal
8. Tax
9. Total
10. Payment terms
11. Bank details or payment instructions
`,
    'brochure': `
1. Company name (large heading)
2. Tagline
3. Hero section with key message
4. About section
5. Services/Products section
6. Features or benefits
7. Testimonials or achievements
8. Contact information
9. Call to action
`,
  }

  return requirements[documentType] || requirements['cv']
}

// =============================================================================
// TEMPLATE TYPE DETECTION
// =============================================================================
export function detectTemplateType(templateId: string): string {
  const idLower = templateId.toLowerCase()

  if (idLower.includes('cv') || idLower.includes('resume')) return 'cv'
  if (idLower.includes('cover-letter')) return 'cover-letter'
  if (idLower.includes('proposal')) return 'business-proposal'
  if (idLower.includes('invoice')) return 'invoice'
  if (idLower.includes('brochure')) return 'brochure'
  if (idLower.includes('contract')) return 'contract'
  if (idLower.includes('report')) return 'report'

  return 'generic'
}

// =============================================================================
// ENTITY VALIDATION
// =============================================================================
export function validateExtractedEntities(entities: any, templateType: string): { valid: boolean; missing: string[] } {
  const missing: string[] = []

  if (templateType === 'cv') {
    if (!entities.personal?.full_name) missing.push('full_name')
    if (!entities.professional?.job_title) missing.push('job_title')
  } else if (templateType === 'business-proposal') {
    if (!entities.proposal?.title) missing.push('proposal_title')
    if (!entities.client?.company) missing.push('client_company')
  } else if (templateType === 'cover-letter') {
    if (!entities.sender?.full_name) missing.push('full_name')
    if (!entities.recipient?.company) missing.push('company_applying_to')
  }

  return { valid: missing.length === 0, missing }
}

function getCvValueByPath(doc: CvDocument, path: string): any {
  if (!path) return undefined
  if (path === 'contact_info_formatted') {
    const p = doc.personal
    const parts = [p.fullName, p.email, p.phone, p.location].filter(Boolean)
    return parts.join(' • ')
  }
  if (path === 'experience.0.company_formatted') {
    const job = doc.jobs[0]
    if (!job) return ''
    const pieces = [job.company, job.location].filter(Boolean)
    return pieces.join(' • ')
  }
  if (path === 'experience.0.achievements_formatted') {
    const job = doc.jobs[0]
    if (!job || !job.achievements?.length) return ''
    const points: string[] = []
    job.achievements.forEach(a => {
      if (a.title) points.push(a.title)
      a.items.forEach(sa => {
        if (sa.text) points.push(sa.text)
        sa.metrics?.forEach(m => {
          if (m.label) points.push(m.label)
        })
      })
    })
    return points.length ? '• ' + points.join('\n• ') : ''
  }
  if (path === 'skills.formatted') {
    const categories = doc.skills.categories || []
    if (!categories.length) return ''
    return categories
      .map(cat => {
        const items = (cat.items || []).join(', ')
        return items ? `${cat.name}: ${items}` : cat.name
      })
      .filter(Boolean)
      .join('\n')
  }
  if (path === 'education.formatted') {
    if (!doc.education?.length) return ''
    return doc.education
      .map(e => {
        const parts = [e.degree, e.institution].filter(Boolean)
        const dates = [e.startDate, e.endDate].filter(Boolean).join(' – ')
        const base = parts.join(' • ')
        if (dates && base) return `${base} (${dates})`
        if (dates) return dates
        return base
      })
      .filter(Boolean)
      .join('\n')
  }
  const segments = path.split('.')
  let current: any = doc as any
  for (const segment of segments) {
    if (!current) return undefined
    if (/^\d+$/.test(segment)) {
      const idx = Number(segment)
      if (!Array.isArray(current) || idx >= current.length) return undefined
      current = current[idx]
    } else {
      const key = segment === 'full_name' ? 'fullName' : segment
      current = current[key]
    }
  }
  return current
}

export function mapCvDocumentToTemplate(templateId: string, templateSchema: any, cv: CvDocument): any {
  const mapping = TEMPLATE_FIELD_MAPPINGS[templateId]
  if (!mapping) return templateSchema
  const applyToElements = (elements: any[]): any[] => {
    return elements.map(el => {
      const fieldPath = mapping[el.id]
      if (!fieldPath) {
        return {
          ...el,
          content: el.content ?? ''
        }
      }
      const value = getCvValueByPath(cv, fieldPath)
      return {
        ...el,
        content: value ?? ''
      }
    })
  }
  if (Array.isArray(templateSchema.pages)) {
    return {
      ...templateSchema,
      pages: templateSchema.pages.map((page: any) => ({
        ...page,
        elements: page.elements ? applyToElements(page.elements) : []
      }))
    }
  }
  if (Array.isArray(templateSchema.elements)) {
    return {
      ...templateSchema,
      elements: applyToElements(templateSchema.elements)
    }
  }
  return templateSchema
}
