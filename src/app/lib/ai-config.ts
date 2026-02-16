export const AI_CONFIG = {
  // Your API key
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',

  // ✅ USE THESE EXACT MODEL NAMES:
  models: [
    'gemini-1.5-flash',       // Best for speed & most free limits
    'gemini-1.5-pro',         // Best for reasoning/complex tasks
    'gemini-1.5-flash-8b',    // Ultra-fast, lightweight
    'gemini-1.0-pro',         // Older, reliable fallback
  ],

  // Rate limits (Standard free tier limits)
  rateLimits: {
    'gemini-1.5-flash': { rpm: 15, tpm: 1000000, rpd: 1500 },
    'gemini-1.5-pro': { rpm: 2, tpm: 32000, rpd: 50 },
    'gemini-1.5-flash-8b': { rpm: 15, tpm: 1000000, rpd: 1500 },
    'gemini-1.0-pro': { rpm: 15, tpm: 1000000, rpd: 1500 },
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
    Act as a professional document generator.
    Based on the following request, generate a high-quality, professional document in GitHub Flavored Markdown format.
    
    Request: "${prompt}"
    
    Requirements:
    - Use clear headings (# ## ###).
    - Use tables for structured data if appropriate.
    - Use bold and italic for emphasis.
    - Include a table of contents if long.
    - Use callouts or blockquotes for important notes.
    - Output ONLY the markdown content.
  `,
  layoutIntelligence: (prompt: string, currentContext: string) => `
    Act as a Professional Layout & PDF Design AI.
    Your goal is to modify or generate a PDF layout based on a user request.
    
    PAGE SPECIFICATIONS:
    - Dimensions: 794px width x 1123px height (A4).
    - Coordinate System: (0,0) is TOP-LEFT.
    
    ELEMENT SCHEMA (JSON):
    Interface EditorElement {
        id: string; // Unique ID
        type: 'heading' | 'paragraph' | 'text' | 'social-icon' | 'image' | 'link' | 'line' | 'container';
        x: number; // 0 to 794
        y: number; // 0 to 1123
        content: string; // Text content or image/icon type
        style: {
            width: number;
            height: number;
            fontSize?: number;
            fontFamily?: string;
            color?: string;
            fontWeight?: string | number;
            textAlign?: 'left' | 'center' | 'right' | 'justify';
            backgroundColor?: string;
            // ... other CSS-like props
        }
    }

    CURRENT LAYOUT CONTEXT:
    ${currentContext}

    USER REQUEST:
    "${prompt}"

    INSTRUCTIONS:
    1. Analyze the current context and the request.
    2. If the request is to ADD elements, generate new elements with appropriate coordinates.
    3. If the request is to MODIFY elements, identify them by ID and return updated properties.
    4. Ensure elements do not overlap messily unless intended.
    5. Ensure all elements stay within the 794x1123 page bounds.
    
    OUTPUT FORMAT:
    Return a JSON array of EditorElement objects that represent the CHANGES or NEW elements to be applied.
    Output ONLY THE JSON ARRAY. No markdown bubbles, no explanations.
  `,
}