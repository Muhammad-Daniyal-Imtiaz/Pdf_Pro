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

  maxTokens: 2048,
  temperature: 0.7,
}

export const AI_PROMPTS = {
  cvContent: (role: string, experience: string) => `
    Generate professional CV content for a ${role} with ${experience} years experience.
    Keep it concise and practical.
  `,
  documentContent: (topic: string, type: string) => `
    Create a ${type} about "${topic}". Be informative.
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
    Act as a World-Class Document Architect & Layout Engineer (PDF Expert).
    Your goal is to create PERFECT, collision-free PDF layouts with professional typography.
    
    === CRITICAL RULES ===
    1. ABSOLUTE COLLISION PREVENTION: Each element MUST be positioned so it NEVER overlaps another.
    2. VERTICAL SPACING FORMULA: y_position = previous_element_y + previous_element_height + 30px margin
    3. AUTO-HEIGHT REQUIRED: ALL text elements MUST use resizeMode: 'auto-height' - NEVER use 'fixed'
    4. HEIGHT CALCULATION: For auto-height, calculate actual needed height based on content length
    
    === TYPOGRAPHY HIERARCHY ===
    - Main Title (H1): fontSize 32-40, fontWeight 700, width: 674 (full width), y starts at 60px from top, resizeMode: 'auto-height'
    - Subtitle (H2): fontSize 24-28, fontWeight 600, width: 674, margin-top 40px from previous, resizeMode: 'auto-height'
    - Section Heading (H3): fontSize 18-20, fontWeight 600, width: 500, margin-top 30px, resizeMode: 'auto-height'
    - Body Paragraph: fontSize 14-16, fontWeight 400, lineHeight 1.6, width: 500, margin-top 20px, resizeMode: 'auto-height'
    - Small Text/Captions: fontSize 12, fontWeight 400, width: 300, margin-top 15px, resizeMode: 'auto-height'
    
    === LAYOUT SPECIFICATIONS ===
    - Canvas: A4 = 794px x 1123px
    - Margins: 60px left/right, 80px top/bottom
    - Content Width: max 674px (794 - 60 - 60)
    - Default Text Width: 500px for paragraphs, 300px for side notes
    - Element Spacing: Minimum 30px between elements
    
    === HEIGHT CALCULATION FORMULA ===
    For text elements with auto-height:
    - Characters per line ≈ width / (fontSize * 0.5)
    - Estimated lines = content.length / characters_per_line
    - Height = (estimated lines * fontSize * lineHeight) + (padding * 2) + 10px buffer
    
    === ELEMENT SCHEMA ===
    {
        id: string (unique, descriptive like "main-title", "section-1-heading");
        type: 'heading' | 'paragraph' | 'text' | 'social-icon' | 'image' | 'line' | 'container';
        x: number (60 for left margin, or center using 397 - width/2);
        y: number (calculated based on previous element position);
        content: string (the actual text content);
        style: {
            width: number (max 674, typically 500 for full-width text);
            height: number (calculated based on content - see formula above);
            fontSize: number (follow typography hierarchy);
            fontWeight: 400 | 600 | 700;
            textAlign: 'left' | 'center' | 'right';
            color: string (use professional colors: #1a1a1a for text, #333333 for headings);
            backgroundColor: string (transparent or subtle);
            padding: number (recommended 8-12);
            resizeMode: 'auto-height'; // CRITICAL: ALWAYS auto-height
            lineHeight: 1.5-1.6;
        }
    }

    CURRENT LAYOUT CONTEXT (existing elements):
    ${currentContext}

    USER REQUEST:
    "${prompt}"

    === YOUR TASK ===
    1. Analyze the request and create a professional document structure
    2. Calculate EXACT y positions ensuring NO overlaps (use 30px minimum gap)
    3. Calculate EXACT heights based on content length using the formula
    4. Center main titles (x = 397 - width/2), left-align body text (x = 60)
    5. Use diverse font sizes to create visual hierarchy
    6. Add visual elements (lines as dividers) between sections
    7. Return a complete, collision-free layout

    OUTPUT: Return ONLY a valid JSON array of elements. NO markdown, NO explanation.
    Ensure every text element has resizeMode: 'auto-height'.
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