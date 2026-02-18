// ai-config.ts - PRODUCTION-GRADE AI CONFIGURATION WITH ENTITY EXTRACTION
// =============================================================================

export const AI_CONFIG = {
  // API key from environment
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',

  // Prioritized models - Flash models work best for free tier
  models: [
    'gemini-2.0-flash',
    'gemini-flash-latest',
    'gemini-2.0-flash-lite',
    'gemini-pro-latest',
    'gemma-3-4b-it',
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
You are an ELITE Entity Extraction AI. Your ONLY job is to extract REAL DATA from the user's input.

=== USER INPUT ===
"${userPrompt}"

=== TEMPLATE TYPE ===
${templateType}

=== YOUR MISSION ===
Extract EVERY piece of factual information from the user's input. DO NOT invent, assume, or generate fake data.
If information is missing, use null or appropriate placeholder like "[Your Name]".

=== OUTPUT FORMAT (JSON ONLY) ===
Return a JSON object with these categories based on template type:

FOR CV/RESUME:
{
  "personal": {
    "full_name": "extracted name or null",
    "email": "extracted email or null",
    "phone": "extracted phone or null",
    "location": "extracted location or null",
    "linkedin": "extracted linkedin or null",
    "github": "extracted github or null",
    "website": "extracted website or null"
  },
  "professional": {
    "job_title": "extracted or desired job title",
    "current_company": "extracted company or null",
    "years_experience": "extracted years or null",
    "industry": "inferred industry"
  },
  "summary": {
    "professional_summary": "GENERATE a compelling 2-3 sentence professional summary based on extracted data"
  },
  "experience": [
    {
      "position": "extracted position",
      "company_name": "extracted company",
      "duration": "extracted dates or duration",
      "achievements": ["list of achievements/responsibilities"]
    }
  ],
  "education": [
    {
      "degree": "extracted degree",
      "institution": "extracted school/university",
      "year": "extracted graduation year",
      "details": "GPA, honors, etc."
    }
  ],
  "skills": {
    "technical": ["extracted technical skills"],
    "soft": ["extracted soft skills"],
    "languages": ["extracted languages"],
    "tools": ["extracted tools/technologies"]
  }
}

FOR BUSINESS PROPOSAL:
{
  "company": {
    "name": "your company name",
    "contact_person": "your name",
    "position": "your position",
    "email": "your email",
    "phone": "your phone"
  },
  "client": {
    "name": "client contact name",
    "company": "client company name",
    "address": "client address"
  },
  "proposal": {
    "title": "proposal title",
    "date": "current date formatted",
    "reference": "proposal reference number",
    "executive_summary": "GENERATE compelling executive summary",
    "objectives": ["list of project objectives"],
    "scope": "project scope description"
  },
  "services": [
    {
      "name": "service name",
      "description": "service description",
      "price": "price if mentioned"
    }
  ],
  "timeline": [
    {
      "phase": "phase name",
      "duration": "duration",
      "description": "what happens in this phase"
    }
  ]
}

FOR COVER LETTER:
{
  "sender": {
    "full_name": "your name",
    "email": "your email",
    "phone": "your phone",
    "location": "your location",
    "current_position": "current job title"
  },
  "recipient": {
    "name": "hiring manager name or 'Hiring Manager'",
    "company": "company applying to",
    "job_title": "position applying for"
  },
  "content": {
    "opening": "GENERATE compelling opening paragraph",
    "body": "GENERATE 2-3 body paragraphs highlighting qualifications",
    "closing": "GENERATE professional closing paragraph",
    "key_points": ["key qualifications to highlight"]
  }
}

=== CRITICAL RULES ===
1. Extract REAL data from user input - do NOT invent names, companies, etc.
2. For missing critical fields, use null or placeholder like "[Your Name]"
3. GENERATE compelling content (summaries, descriptions) based on extracted data
4. If user mentions experience "5 years in React", extract: years_experience: "5", skills.technical: ["React"]
5. Parse natural language intelligently - "I work at Google as a PM" → company: "Google", position: "PM"
6. Return ONLY valid JSON - no markdown, no explanation
`,

  // =========================================================================
  // TEMPLATE CONTENT GENERATION WITH EXTRACTED ENTITIES
  // =========================================================================
  templateContentGeneration: (
    templateId: string,
    templateElements: any[],
    extractedEntities: any,
    userPrompt: string
  ) => `
You are a WORLD-CLASS Document Designer AI. Your job is to fill a template with REAL user data.

=== TEMPLATE ID ===
${templateId}

=== TEMPLATE STRUCTURE ===
${JSON.stringify(templateElements.map(el => ({
  id: el.id,
  type: el.type,
  content: el.content?.substring(0, 100) || '',
  purpose: inferElementPurpose(el.id, el.type)
})), null, 2)}

=== EXTRACTED USER DATA ===
${JSON.stringify(extractedEntities, null, 2)}

=== ORIGINAL USER REQUEST ===
"${userPrompt}"

=== YOUR MISSION ===
Return a JSON array of element updates. For EACH element in the template:
1. If extracted data matches the element's purpose, use the REAL data
2. If data is missing but content should be generated, CREATE professional content
3. Keep layout positions (x, y) EXACTLY as in template
4. Preserve all styling
5. Only update the "content" field

=== OUTPUT FORMAT ===
Return JSON array:
[
  {
    "id": "element-id-from-template",
    "content": "new content with real user data or generated professional content"
  },
  ...
]

=== CONTENT GENERATION RULES ===
1. Names: Use extracted name or "[Your Name]" if missing
2. Contact: Use extracted contact or generate placeholder format
3. Summaries: GENERATE compelling 2-3 sentence professional summaries
4. Experience: Format with bullet points: "• Achievement 1\\n• Achievement 2"
5. Skills: Format as: "Category: skill1, skill2, skill3"
6. Dates: Format consistently: "Month Year - Present" or "Month Year"
7. Make ALL content PROFESSIONAL, COMPELLING, and ACHIEVEMENT-FOCUSED

=== EXAMPLE TRANSFORMATIONS ===
- "header-name" + extracted name "John Doe" → {"id": "header-name", "content": "JOHN DOE"}
- "summary-content" + job title "Software Engineer" → Generate: "Results-driven Software Engineer with..."
- "job-1-description" + achievements → "• Led team of 5 engineers...\\n• Increased performance by 40%..."

Return ONLY the JSON array. No markdown, no explanation.
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
    "resizeMode": "auto-height",
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
Act as an ELITE Document Layout Engineer.
Create PIXEL-PERFECT, COLLISION-FREE layouts.

CURRENT LAYOUT:
${currentContext}

USER REQUEST:
"${prompt}"

Return JSON array of elements with exact positions. NO markdown.
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
