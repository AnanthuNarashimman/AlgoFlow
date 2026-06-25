const express = require('express');
const router = express.Router();
const { createGenAI, memory } = require('../services/ai');
const { getChatPrompt, detectScenario } = require('../prompts/chat');
const { requireKey } = require('../middleware/keyAuth');
const config = require('../config');

const ALLOWED_MODELS = [
    'gemini-2.5-flash-lite',
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
];

router.post('/', requireKey, async (req, res) => {
    try {
        const { code, message, conversationHistory, userId = 'default_user', model: requestedModel } = req.body;
        if (!message) return res.status(400).json({ error: "No message provided" });

        const chatModel = ALLOWED_MODELS.includes(requestedModel) ? requestedModel : config.geminiModel;

        const relevantMemories = await memory.search(message, { user_id: userId, limit: 3 });

        const genAI = createGenAI(req.geminiKey);
        const model = genAI.getGenerativeModel({ model: chatModel });

        const scenario = detectScenario(message);
        let contextPrompt = getChatPrompt(scenario);

        if (code?.trim()) {
            contextPrompt += `\n\nCurrent code in editor:\n\`\`\`python\n${code}\n\`\`\`\n\n`;
        }

        if (relevantMemories?.length > 0) {
            contextPrompt += "\n\nRelevant context from previous conversations:\n";
            relevantMemories.forEach((mem, idx) => {
                contextPrompt += `${idx + 1}. ${mem.memory}\n`;
            });
        }

        if (conversationHistory?.length > 0) {
            const recent = conversationHistory.slice(-3);
            contextPrompt += "Recent conversation:\n";
            recent.forEach(msg => {
                contextPrompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.text}\n`;
            });
        }

        contextPrompt += `\n\nUser: ${message}\n\nAssistant:`;

        const result = await model.generateContent(contextPrompt);
        const responseText = result.response.text();

        await memory.add(
            [{ role: "user", content: message }, { role: "assistant", content: responseText }],
            {
                user_id: userId,
                metadata: {
                    has_code: !!(code?.trim()),
                    timestamp: new Date().toISOString(),
                    topic: message.slice(0, 50)
                }
            }
        );

        res.json({ response: responseText });
    } catch (error) {
        const status = error.status || error.statusCode;
        if (status === 429) {
            const isRateLimit = error.message?.toLowerCase().includes('rate_limit') ||
                                error.message?.toLowerCase().includes('rate limit');
            return res.status(429).json({
                error: isRateLimit ? 'rate_limit' : 'quota_exceeded',
                message: isRateLimit
                    ? "You've hit Gemini's rate limit. Try again in a few seconds."
                    : "Your Gemini quota is exhausted. Check usage at aistudio.google.com"
            });
        }
        console.error("Chat error:", error);
        res.status(500).json({ error: "Failed to process chat", details: error.message });
    }
});

module.exports = router;
