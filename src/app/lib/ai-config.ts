export const AI_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY ?? '',
  modelName: 'gemini-pro',        // free tier
  maxTokens: 2048,
  temperature: 0.7,
}
export const AI_PROMPTS = {
  cvContent: (role: string, experience: string) => `
    Generate professional CV content for a ${role} with ${experience} years of experience.
    Include:
    1. Professional summary (2-3 sentences)
    2. Key skills (10-15 relevant skills)
    3. Work experience descriptions (3-4 bullet points per role)
    4. Education details
    Make it concise, professional, and tailored to the role.
  `,
  
  documentContent: (topic: string, type: string) => `
    Generate professional ${type} content about "${topic}".
    Make it well-structured, informative, and engaging.
    Include appropriate headings and sections.
  `,
}