const { GoogleGenerativeAI } = require("@google/generative-ai");
const { MemoryClient } = require('mem0ai');
const config = require('../config');

// Memory stays as a singleton — uses the server's Mem0 key
const memory = new MemoryClient({ apiKey: config.mem0ApiKey });

// Creates a per-request Gemini client using the user's own key
function createGenAI(apiKey) {
    return new GoogleGenerativeAI(apiKey);
}

module.exports = { createGenAI, memory };
