const { GoogleGenerativeAI } = require("@google/generative-ai");
const { MemoryClient } = require('mem0ai');
const config = require('../config');

const genAI = new GoogleGenerativeAI(config.geminiApiKey);
const memory = new MemoryClient({ apiKey: config.mem0ApiKey });

module.exports = {
    genAI,
    memory
};
