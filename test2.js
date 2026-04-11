const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const key = env.split('GEMINI_API_KEY=')[1].split('\n')[0].replace(/"/g, '').replace(/'/g, '');

const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(key);

async function check() {
  try {
     const models = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
     const data = await models.json();
     console.log("AVAILABLE MODELS:");
     data.models.filter(m => m.supportedGenerationMethods.includes('generateContent')).forEach(m => {
       console.log(m.name);
     });
  } catch(e) {
     console.error(e);
  }
}
check();
