import { GoogleGenerativeAI } from "@google/generative-ai";
import { AI_CONFIG } from "./ai-config";

const genAI = new GoogleGenerativeAI(AI_CONFIG.apiKey);

export interface TemplateContentRequest {
    templateJson: any; // Complete template structure
    userInfo: {
        fullName: string;
        email: string;
        phone: string;
        address: string;
        summary: string;
        experience: Array<{
            company: string;
            position: string;
            startDate: string;
            endDate: string;
            description: string;
        }>;
        education: Array<{
            institution: string;
            degree: string;
            fieldOfStudy: string;
            startDate: string;
            endDate: string;
        }>;
        skills: string[];
        languages?: Array<{ name: string; proficiency: string }>;
        certifications?: Array<{ name: string; issuer: string; date: string }>;
    };
}

/**
 * PRODUCTION-GRADE TEMPLATE ENGINE
 * This service replaces all content in a template while preserving its professional layout.
 */
export async function generateTemplateContent(request: TemplateContentRequest): Promise<any> {
    if (!AI_CONFIG.apiKey) {
        throw new Error('Gemini API Key is missing. Please check NEXT_PUBLIC_GEMINI_API_KEY in your .env file.');
    }

    console.log("🚀 AI Template Engine: Starting content replacement...");

    const modelAttempts = [
        "gemini-flash-latest",
        "gemma-3-4b-it",
        "gemini-2.0-flash-lite",
        "gemini-pro-latest"
    ];

    let lastError: any = null;

    for (const modelName of modelAttempts) {
        try {
            console.log(`🚀 Template Engine: Attempting with model ${modelName}...`);
            const model = genAI.getGenerativeModel({
                model: modelName,
                generationConfig: {
                    temperature: 0.1, // Low temperature for factual precision
                    topP: 0.95,
                }
            });

            const prompt = generateTemplatePrompt(request);
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Advanced cleanup and parsing
            const updatedTemplate = applyTemplateChanges(request.templateJson, text);
            console.log(`✨ Template Engine: Success using ${modelName}`);
            return updatedTemplate;
        } catch (error: any) {
            lastError = error;
            const isQuotaError = error.message?.includes('429') || error.message?.includes('quota');
            const isNotFoundError = error.message?.includes('404') || error.message?.includes('not found');

            if (isQuotaError || isNotFoundError) {
                console.warn(`⚠️ Template Engine: Issue with model ${modelName} (${isQuotaError ? 'Quota' : 'Not Found'}). Trying fallback...`);
                continue;
            } else {
                console.error(`❌ Template Engine: Critical error with model ${modelName}:`, error);
                break;
            }
        }
    }

    throw new Error(`Template Engine failed after multiple attempts. Last error: ${lastError?.message || 'Unknown failure'}`);
}

function generateTemplatePrompt(request: TemplateContentRequest): string {
    const { templateJson, userInfo } = request;

    return `You are a SENIOR DOCUMENT ARCHITECT and CONTENT ENGINEER. Your mission is to take a professional document template and replace EVERY SINGLE placeholder with real user data while maintaining 100% of the visual intent.

=== TEMPLATE JSON (SCHEMA) ===
${JSON.stringify(templateJson, null, 2)}

=== USER FOLDERS (DATA) ===
PERSONAL:
- Name: ${userInfo.fullName}
- Email: ${userInfo.email}
- Phone: ${userInfo.phone}
- Address: ${userInfo.address}
- Summary: ${userInfo.summary}

PROFESSIONAL EXPERIENCE:
${userInfo.experience.map(exp => `- ${exp.position} at ${exp.company} (${exp.startDate} - ${exp.endDate}): ${exp.description}`).join('\n')}

ACADEMIC BACKGROUND:
${userInfo.education.map(edu => `- ${edu.degree} in ${edu.fieldOfStudy} from ${edu.institution} (${edu.startDate} - ${edu.endDate})`).join('\n')}

TECHNICAL & SOFT SKILLS:
${userInfo.skills.join(', ')}

${userInfo.languages ? `LANGUAGES: ${userInfo.languages.map(l => `${l.name} (${l.proficiency})`).join(', ')}` : ''}
${userInfo.certifications ? `CERTIFICATIONS: ${userInfo.certifications.map(c => `${c.name} - ${c.issuer} (${c.date})`).join(', ')}` : ''}

=== CRITICAL REASONING STEPS (INTERNAL) ===
1. MAP: Analyze element IDs in the template. (e.g., 'header-name' -> ${userInfo.fullName})
2. CONTEXTUALIZE: If an element is a 'social-icon' with type 'email', ensure the content is the user's email.
3. SYNTHESIZE: For experience sections, if the template has multiple "Job Title" items but the user only has 2 jobs, leave the extra ones empty or replace with clean placeholders like "Current Project".
4. POLISH: Format all dates consistently. Capitalize names professionally. Transform long text into clean bullet points if the target element type is a list/paragraph.

=== FINAL OUTPUT RULES ===
1. Return ONLY the modified JSON.
2. DO NOT change X, Y, or STYLE properties.
3. DO NOT leave ANY placeholder text like "John Doe" or "Your Company".
4. Ensure every "content" field is populated with appropriate data.
5. If user data is missing for a required section, use a professional "N/A" or clear placeholder.

RETURN ONLY VALID JSON.`;
}

function applyTemplateChanges(originalTemplate: any, aiResponse: string): any {
    try {
        // Robust JSON extraction
        let cleaned = aiResponse;
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            cleaned = jsonMatch[0];
        }

        const modifiedTemplate = JSON.parse(cleaned);

        // Safety check: ensure we didn't lose schema integrity
        if (!modifiedTemplate.pages && !originalTemplate.pages) {
            console.warn("⚠️ AI Response missing pages field, falling back or merging...");
        }

        return modifiedTemplate;
    } catch (error) {
        console.error('❌ Error parsing AI template response:', error);
        return originalTemplate; // Fail-safe: return original
    }
}
