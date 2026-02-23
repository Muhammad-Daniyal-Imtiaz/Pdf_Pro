import { GoogleGenerativeAI } from "@google/generative-ai";
import { AI_CONFIG } from "./ai-config";

const genAI = new GoogleGenerativeAI(AI_CONFIG.apiKey);

export interface SmartPDFRequest {
    prompt: string;
    documentType: 'cv' | 'proposal' | 'report' | 'letter' | 'brochure' | 'invoice';
    pageCount: number;
    style?: string;
    role?: string;
    experience?: string;
    topic?: string;
    // Optional design token palette from the client (for consistent theming)
    designTokens?: {
        primary?: string;
        secondary?: string;
        accent?: string;
        text?: string;
        textMuted?: string;
        bg?: string;
        surface?: string;
        border?: string;
        headingFont?: string;
        bodyFont?: string;
        [key: string]: any;
    };
    // Optional layout archetype description (e.g. two-column CV, tri-fold brochure)
    archetypeHint?: string;
}

export interface GeneratedElement {
    id: string;
    type: 'heading' | 'paragraph' | 'container' | 'line' | 'text' | 'image' | 'link';
    x: number;
    y: number;
    content: string;
    style: {
        width: number;
        height: number;
        fontSize?: number;
        fontWeight?: number;
        color?: string;
        backgroundColor?: string;
        borderRadius?: number;
        padding?: number;
        textAlign?: 'left' | 'center' | 'right';
        borderWidth?: number;
        borderColor?: string;
        resizeMode?: 'auto-height' | 'fixed';
        opacity?: number;
        letterSpacing?: number;
        boxShadow?: string;
    };
    pageIndex: number;
    iconType?: string;
}

/**
 * ULTRA-PRODUCTION GRADE SMART PDF ARCHITECT v3.0 (GOD-MODE)
 * The world's most sophisticated AI Layout System.
 */
export async function generateSmartPDF(request: SmartPDFRequest): Promise<{
    pages: Array<{ id: string; elements: GeneratedElement[] }>;
    width: number;
    height: number;
}> {
    console.log(`💎 Architect v3.0: Orchestrating elite ${request.documentType} [Style: ${request.style}]...`);

    if (!AI_CONFIG.apiKey) {
        throw new Error('Gemini API Key missing.');
    }

    const modelAttempts = [
        "gemini-flash-latest",
        "gemini-2.0-flash-lite",
        "gemma-3-4b-it",
        "gemini-pro-latest"
    ];

    let lastError: any = null;

    for (const modelName of modelAttempts) {
        try {
            console.log(`🧠 Brain: Consulting elite model ${modelName}...`);
            const model = genAI.getGenerativeModel({
                model: modelName,
                generationConfig: {
                    temperature: 0.85,
                    maxOutputTokens: 16000,
                    topP: 0.95,
                    topK: 40,
                }
            });

            const prompt = generateGodModePrompt(request);
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            const elements = parseGeneratedLayout(text, request.pageCount);
            const pages = organizeIntoPages(elements, request.pageCount);

            console.log(`👑 Architect: Vision manifested using ${modelName}`);
            return { pages, width: 794, height: 1123 };
        } catch (error: any) {
            lastError = error;
            const isRetryable = error.message?.includes('429') || error.message?.includes('404') || error.message?.includes('quota');

            if (isRetryable) {
                console.warn(`🏗️ Architect: Scaling to fallback due to ${modelName} unavailability.`);
                continue;
            } else {
                console.error(`❌ Architect: Fatal vision failure with ${modelName}:`, error);
                break;
            }
        }
    }

    throw new Error(`The Architect failed to manifest the vision. ${lastError?.message}`);
}

function generateGodModePrompt(request: SmartPDFRequest): string {
    const {
        documentType,
        pageCount,
        role,
        topic,
        prompt,
        style = 'modern professional',
        designTokens,
        archetypeHint
    } = request;

    const paletteSection = designTokens
        ? `
=== DESIGN TOKENS (CANONICAL PALETTE) ===
Primary: ${designTokens.primary || '#0F172A'}
Secondary: ${designTokens.secondary || '#F9FAFB'}
Accent: ${designTokens.accent || '#3B82F6'}
Text: ${designTokens.text || '#111827'}
Text Muted: ${designTokens.textMuted || '#6B7280'}
Background: ${designTokens.bg || '#FFFFFF'}
Surface: ${designTokens.surface || '#F3F4F6'}
Border: ${designTokens.border || '#E5E7EB'}
Heading Font: ${designTokens.headingFont || 'Inter, system-ui, sans-serif'}
Body Font: ${designTokens.bodyFont || 'Inter, system-ui, sans-serif'}
`
        : '';

    const archetypeSection = archetypeHint
        ? `
=== LAYOUT ARCHETYPE HINT ===
${archetypeHint}
`
        : '';

    return `ACT AS AN ULTRA-HIGH-END BRAND AGENCY ART DIRECTOR & SENIOR ENGINEER.
Your goal is to design a ${documentType} that looks like it cost $50,000 to design. 

=== THE MISSION ===
Design a perfectly composed, production-grade ${documentType} in "${style}" style.
Subject: ${topic || role || prompt}

${paletteSection}
${archetypeSection}

=== DESIGN PRINCIPLES (1000x BETTER) ===
1. **DEEP NESTING & GROUPING**: 
   - Never place text in a vacuum. Use "Container Cards" (#F8FAFC background, 12px padding, 16px border-radius) to group logical sections.
   - Use "Header Bands" (Full-width containers with contrast background like #1E293B) to anchor the page.
   - Use "Sidebar Columns" (e.g., a left container at x:60, width:180) for metadata/contact info.

2. **GOLDEN-RATIO TYPOGRAPHY**:
   - Hero: 48px/800. Section: 20px/700. Label: 11px/600 (Uppercase + LetterSpacing 1px).
   - Body: 14px/400 (Line Height 1.6).

3. **OPTICAL RHYTHM**:
   - Vertical Spacing (Gutters): 24px, 48px, 64px increments.
   - Alignment: Pixel-perfect left-aligning of all elements.

4. **PRODUCTION SEMANTICS**:
   - Use 'line' for elegant dividers (thin 1px, subtle opacity 0.5).

=== ARCHITECTURAL ARCHETYPES ===
Choose the best fit for "${style}":
- **THE STARTUP**: Modern SaaS, geometric fonts, blue/indigo accents, crisp cards.
- **THE EXULTANT**: High-fashion editorial, extreme negative space, serif-style (simulated), thin dividers.
- **THE ENTERPRISE**: Grid-heavy, reliable, blue/gray palette, clear data tables (simulated with containers).

=== STAGE 1: PLAN (INTERNAL REASONING) ===
- I will structure the ${documentType} with a ${pageCount}-page layout.
- Page 1 starts with a high-impact Hero Band.
- I will then transition into a multi-column body using Containers to separate ${topic || prompt} details.

=== STAGE 2: OUTPUT JSON ARRAY ONLY ===
{
  "id": "unique-id",
  "type": "heading"|"paragraph"|"container"|"line"|"text",
  "x": number, "y": number,
  "content": "Professional, descriptive content related to ${topic || prompt}",
  "pageIndex": number,
  "style": { 
     "width": number, "height": number, "fontSize": number, "fontWeight": number, 
     "color": "hex", "backgroundColor": "hex", "borderRadius": number, 
     "textAlign": "left"|"center"|"right", "padding": number, "resizeMode": "auto-both",
     "boxShadow": "string", "opacity": number
  }
}

RULES:
- NO PLACEHOLDERS. generate real, high-quality, professional text.
- X ranges: 60 to 674. Y ranges: 80 to 1040 per page.
- DO NOT overlap. Calculate Y values: y_next = y_prev + height_prev + gap.

START THE DESIGN.`;
}

function parseGeneratedLayout(text: string, pageCount: number): GeneratedElement[] {
    try {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) throw new Error("Manifest not found in response.");

        const raw = JSON.parse(jsonMatch[0]);
        const elements = Array.isArray(raw) ? raw : [];

        // Remove any social-icon elements – we don't want icons in AI-generated layouts
        const filtered = elements.filter((el: any) => el && el.type !== 'social-icon');

        return filtered.map((el: any, index: number) => ({
            ...el,
            id: el.id || `el-${index}-${Math.random().toString(36).substr(2, 5)}`,
            x: Math.max(60, Math.min(734 - (el.style?.width || 0), el.x || 60)),
            y: Math.max(60, Math.min(1063 - (el.style?.height || 0), el.y || (80 + index * 80))),
            pageIndex: Math.min(pageCount - 1, el.pageIndex || 0),
            style: {
                ...el.style,
                width: el.style?.width || 200,
                height: el.style?.height || 40,
                resizeMode: el.type !== 'line' ? 'auto-both' : 'fixed',
                padding: el.style?.padding || 0
            }
        }));
    } catch (error) {
        console.error('❌ Architect Parsing Vision Failure:', error);
        return [];
    }
}

function organizeIntoPages(elements: GeneratedElement[], pageCount: number): Array<{ id: string; elements: GeneratedElement[] }> {
    const pages: Array<{ id: string; elements: GeneratedElement[] }> = [];
    for (let i = 0; i < pageCount; i++) {
        pages.push({
            id: `page-${i}`,
            elements: elements.filter(el => el.pageIndex === i)
        });
    }
    if (pages.length === 0 || (pages[0].elements.length === 0 && elements.length > 0)) {
        return [{ id: 'page-0', elements }];
    }
    return pages;
}
