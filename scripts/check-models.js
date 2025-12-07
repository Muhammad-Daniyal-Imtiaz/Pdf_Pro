
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

async function listModels() {
    const key = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!key) {
        console.error("No API Key found in .env.local");
        return;
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const data = await response.json();

        if (data.models) {
            const output = data.models.map(m => m.name).join('\n');
            fs.writeFileSync('models.txt', output);
            console.log("Wrote models to models.txt");
        } else {
            fs.writeFileSync('models.txt', "Error: " + JSON.stringify(data, null, 2));
        }
    } catch (error) {
        fs.writeFileSync('models.txt', "Error: " + error.message);
    }
}

listModels();
