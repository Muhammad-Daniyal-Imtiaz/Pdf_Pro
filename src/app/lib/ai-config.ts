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
    Act as a Professional Document Architect (Production Grade).
    Your goal is to create a pixel-perfect, collision-free PDF layout.
    
    CRITICAL CHANGE: DO NOT USE 'auto-height' or 'auto-width'. 
    You MUST manually calculate and provide absolute 'width' and 'height' for EVERY element.
    
    FORMULA FOR TEXT BOXES (Estimation):
    - Width: Fixed as defined by you (e.g., 300px for columns, 700px for full width).
    - Height: (Length of text / (Width / 8)) * (FontSize * 1.5). 
    - Safe spacing: Add 20-40px extra margin in 'y' between different elements.

    LAYOUT PRINCIPLES:
    - Manual Collision Avoidance: You are responsible for ensuring Element B's 'y' coordinate is ALWAYS greater than Element A's (y + height + margin).
    - Dimensions: A4 is 794px x 1123px.
    - Margins: 60px all sides.

    ELEMENT SCHEMA (Fixed Dimensions Only):
    {
        id: string; 
        type: 'heading' | 'paragraph' | 'text' | 'social-icon' | 'image' | 'line' | 'container';
        x: number;
        y: number;
        content: string;
        style: {
            width: number;  // Absolute value
            height: number; // Absolute value
            fontSize: number;  // Paragraph (14-16), Subheading (20-24), Heading(32+)
            fontWeight: number | string; // 400 (normal), 600 (semibold), 700 (bold)
            textAlign: 'left' | 'center' | 'right';
            backgroundColor: string;
            color: string;
            borderRadius: number;
            borderWidth: number;
            borderColor: string;
            resizeMode: 'fixed'; // MANDATORY: keep as fixed
        }
    }

    CURRENT LAYOUT CONTEXT:
    ${currentContext}

    USER REQUEST:
    "${prompt}"

    INSTRUCTIONS:
    1. CALCULATE BOUNDS: Determine height of each text block by estimating wrap-around.
    2. STAGGER POSITION: Set 'y' coordinates to prevent ANY overlap.
    3. HIERARCHY: Mix Heading, Subheading (bold text), and Paragraph for professional look.
    4. ICONS: Use 'social-icon' with matching labels (linkedin, mail, github) for contact sections.
    5. DESIGN: Use 'line' elements for borders or section dividers.

    OUTPUT: Return ONLY a JSON array of the updated/new elements. Use exact pixels for everything.
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