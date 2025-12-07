
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' });

async function listModels() {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
        console.error("No API key found in .env.local");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    try {
        // For GoogleGenerativeAI SDK, we usually just access the model.
        // But to list models we might need to use the model manager if available exposed, 
        // or we just try a few known ones.
        // The error message from previous runs suggests calling ListModels.
        // In the nodejs SDK this might be different.
        // Actually, looking at docs, genAI doesn't have a direct listModels method on the instance usually.
        // It's often on a specific client or we just try generating.

        // Let's try standard ones.
        const modelsToCheck = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro', 'gemini-1.0-pro'];

        console.log("Checking model availability...");

        for (const modelName of modelsToCheck) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent("Hello");
                console.log(`✅ ${modelName} is WORKING`);
            } catch (e) {
                console.log(`❌ ${modelName} FAILED: ${e.message.split(':')[0]}`);
            }
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

listModels();
