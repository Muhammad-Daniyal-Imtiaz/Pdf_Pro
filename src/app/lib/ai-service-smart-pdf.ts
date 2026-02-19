import { GoogleGenerativeAI } from "@google/generative-ai";
import { AI_CONFIG } from "./ai-config";

const genAI = new GoogleGenerativeAI(AI_CONFIG.apiKey);

export interface SmartPDFRequest {
    prompt: string;
    documentType: 'cv' | 'proposal' | 'report' | 'letter' | 'brochure' | 'invoice';
    pageCount: number;
    style?: 'modern professional' | 'elegant minimalist' | 'creative bold' | 'corporate formal';
    role?: string;
    experience?: string;
    topic?: string;
}

export interface GeneratedElement {
    id: string;
    type: 'heading' | 'paragraph' | 'container' | 'line' | 'text' | 'social-icon' | 'image' | 'link';
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
    };
    pageIndex: number;
    iconType?: string;
}

/**
 * ULTRA-PRODUCTION GRADE SMART PDF ARCHITECT
 * acts as an Art Director + Layout Engineer.
 */
export async function generateSmartPDF(request: SmartPDFRequest): Promise<{
    pages: Array<{ id: string; elements: GeneratedElement[] }>;
    width: number;
    height: number;
}> {
    console.log(`🏗️  AI Document Architect: Designing ${request.documentType} in ${request.style} style...`);

    if (!AI_CONFIG.apiKey) {
        throw new Error('Gemini API Key is missing. Please check NEXT_PUBLIC_GEMINI_API_KEY in your .env file.');
    }

    // Priority models to try if one fails
    const modelAttempts = [
        "gemini-flash-latest",
        "gemma-3-4b-it",
        "gemini-2.0-flash-lite",
        "gemini-pro-latest"
    ];

    let lastError: any = null;

    for (const modelName of modelAttempts) {
        try {
            console.log(`🤖 Architect: Attempting with model ${modelName}...`);
            const model = genAI.getGenerativeModel({
                model: modelName,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 8192,
                }
            });

            const prompt = generateSmartPDFPrompt(request);
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Complex parsing and organization
            const elements = parseGeneratedLayout(text, request.pageCount);
            const pages = organizeIntoPages(elements, request.pageCount);

            console.log(`✨ Architect: Successfully generated layout using ${modelName}`);
            return {
                pages,
                width: 794,
                height: 1123
            };
        } catch (error: any) {
            lastError = error;
            const isQuotaError = error.message?.includes('429') || error.message?.includes('quota');
            const isNotFoundError = error.message?.includes('404') || error.message?.includes('not found');

            if (isQuotaError || isNotFoundError) {
                console.warn(`⚠️ Architect: Issue with model ${modelName} (${isQuotaError ? 'Quota' : 'Not Found'}). Trying fallback...`);
                continue; // Try next model
            } else {
                console.error(`❌ Architect: Critical error with model ${modelName}:`, error);
                break; // Stop if it's not a common transient/availability issue
            }
        }
    }

    throw new Error(`Architect failed after multiple attempts. Last error: ${lastError?.message || 'Unknown failure'}`);
}

function generateSmartPDFPrompt(request: SmartPDFRequest): string {
    const { documentType, pageCount, style = 'modern professional', role, experience, topic, prompt } = request;

    // DESIGN SYSTEM TOKENS
    const designTokens = {
        margins: "40px to 60px",
        gutters: "24px",
        verticalRhythm: "32px increments",
        fontHierarchy: {
            title: "28-36px, Bold",
            heading: "20-24px, SemiBold",
            subheading: "16-18px, Medium",
            body: "12-14px, Regular",
            metadata: "10-11px, Light"
        }
    };

    return `You are a SENIOR ART DIRECTOR at a top 1% Design Agency. Your task is to design a high-fidelity, production-grade ${documentType} layout from scratch.

=== THE BRIEF ===
DOCUMENT: ${documentType.toUpperCase()}
STYLE: ${style.toUpperCase()}
SCOPE: ${pageCount} Page(s)
SUBJECT: ${topic || role || prompt}

=== DESIGN TOKENS ===
- MARGINS: ${designTokens.margins} (SAFE ZONE)
- VERTICAL RHYTHM: Use consistent spacing between sections
- TYPOGRAPHY: ${JSON.stringify(designTokens.fontHierarchy)}
- RESOLUTION: 794px x 1123px (A4)

=== ART DIRECTOR'S VISION (NESTED REASONING) ===
1. GRID: Establish a clean 12-column grid system mentally before placing items.
2. FLOW: Lead the eye from the Hero Section to the critical data points.
3. HIERARCHY: Use font scale and color weight (Primary: #111827, Secondary: #4B5563, Accent: #2563EB) to establish order.
4. SPACING: Ensure NO elements overlap. Calculate Y positions cumulatively based on height + margin.
5. POLISH: Use specialized elements like 'line' for separation and 'container' for grouping.

=== ELEMENT SCHEMA ===
Return a JSON array of elements with this structure:
{
  "id": "unique-slug",
  "type": "heading" | "paragraph" | "container" | "line" | "text" | "social-icon",
  "x": number, "y": number,
  "content": "string",
  "style": { "width": number, "height": number, "fontSize": number, "fontWeight": number, "color": "string", "backgroundColor": "string", "borderRadius": number, "textAlign": "left"|"center"|"right" },
  "pageIndex": number,
  "iconType": "email"|"phone"|"location"|"linkedin" (only for social-icon)
}

=== PRODUCTION RULES ===
1. NO EMPTY BOXES. If you create a container, it must have content or a clear decorative purpose.
2. NO OVERLAP. y(n+1) must be >= y(n) + height(n) + margin.
3. REAL CONTENT only. Generate professional, compelling copy related to ${topic || prompt}.
4. USE AUTO-HEIGHT. Always include "resizeMode": "auto-height" in the style for text-based elements.

OUTPUT ONLY THE JSON ARRAY. NO MARKDOWN. NO COMMENTS.`;
}

function parseGeneratedLayout(text: string, pageCount: number): GeneratedElement[] {
    try {
        let cleaned = text;
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) cleaned = jsonMatch[0];

        const elements = JSON.parse(cleaned);

        return elements.map((el: any, index: number) => ({
            ...el,
            id: el.id || `el-${index}-${Date.now()}`,
            x: Math.max(40, Math.min(754, el.x || 60)),
            y: Math.max(40, Math.min(1083, el.y || (80 + index * 100))),
            style: {
                ...el.style,
                width: el.style?.width || 200,
                height: el.style?.height || 50,
                resizeMode: 'auto-height', // Force high-fidelity visibility
            }
        }));
    } catch (error) {
        console.error('❌ Error parsing Architect layout:', error);
        return [];
    }
}

function organizeIntoPages(elements: GeneratedElement[], pageCount: number): Array<{ id: string; elements: GeneratedElement[] }> {
    const pages: Array<{ id: string; elements: GeneratedElement[] }> = [];

    for (let i = 0; i < pageCount; i++) {
        pages.push({
            id: `page-${i}`,
            elements: elements.filter(el => (el.pageIndex || 0) === i)
        });
    }

    // Ensure at least one page exists
    if (pages.length === 0) {
        pages.push({ id: 'page-0', elements: [] });
    }

    return pages;
}
