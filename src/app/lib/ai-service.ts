import { GoogleGenAI } from '@google/genai'
import { AI_CONFIG } from './ai-config'

class AIService {
  private ai: GoogleGenAI

  constructor() {
    if (!AI_CONFIG.apiKey) throw new Error('Gemini API key missing – check .env.local')
    this.ai = new GoogleGenAI({ apiKey: AI_CONFIG.apiKey })
  }

  async generateContent(prompt: string): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model: AI_CONFIG.modelName,           // gemini-pro
        contents: prompt,
        config: { maxOutputTokens: AI_CONFIG.maxTokens, temperature: AI_CONFIG.temperature },
      })
      return response.text
    } catch (err: any) {
      console.error('AI Generation Error:', err)
      throw new Error(err.message || 'Failed to generate content with AI')
    }
  }

  async generateCVContent(role: string, experience: string): Promise<string> {
    const prompt = `Write a concise, professional CV for a ${role} with ${experience} years experience.
Sections: Summary, Key Skills, Work Experience (3 bullet points per role), Education.
Format with headings and bullet points.`
    return this.generateContent(prompt)
  }

  async generateDocumentContent(topic: string, type: string): Promise<string> {
    const prompt = `Create a well-structured ${type} about "${topic}".
Use clear headings, bullet points, and a short conclusion.`
    return this.generateContent(prompt)
  }
}

export const aiService = new AIService()