export const AI_CONFIG = {
  // Your API key
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',

  // ✅ USE THESE MODELS FROM YOUR DASHBOARD:
  models: [
    'gemini-2.5-flash-lite',    // 10 RPM - Best for free tier
    'gemma-3-1b',               // 30 RPM - More requests
    'gemma-3-4b',               // 30 RPM - Better quality
    'gemini-2.5-flash',         // 5 RPM - Good quality
  ],

  // Rate limits (from your dashboard)
  rateLimits: {
    'gemini-2.5-flash-lite': { rpm: 10, tpm: 250000, rpd: 20 },
    'gemma-3-1b': { rpm: 30, tpm: 15000, rpd: 14400 },
    'gemma-3-4b': { rpm: 30, tpm: 15000, rpd: 14400 },
    'gemini-2.5-flash': { rpm: 5, tpm: 250000, rpd: 20 },
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
}