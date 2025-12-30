require('dotenv').config();

const config = {
    port: process.env.PORT || 4000,
    geminiApiKey: process.env.GEMINI_API_KEY,
    mem0ApiKey: process.env.MEM0_API_KEY,
    geminiModel: "gemini-2.5-flash-lite"
};

// Debug: Check if MEM0_API_KEY is loaded
console.log('MEM0_API_KEY loaded:', config.mem0ApiKey ? 'Yes (length: ' + config.mem0ApiKey.length + ')' : 'No - MISSING!');

module.exports = config;
