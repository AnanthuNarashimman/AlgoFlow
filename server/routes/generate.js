const express = require('express');
const router = express.Router();
const { createGenAI } = require('../services/ai');
const { FLOWCHART_SYSTEM_PROMPT } = require('../prompts/flowchart');
const { requireKey } = require('../middleware/keyAuth');
const config = require('../config');

router.post('/', requireKey, async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) return res.status(400).json({ error: "No code provided" });

        const genAI = createGenAI(req.geminiKey);
        const model = genAI.getGenerativeModel({
            model: config.geminiModel,
            generationConfig: { responseMimeType: "application/json" }
        });

        const result = await model.generateContent([
            FLOWCHART_SYSTEM_PROMPT,
            `Analyze this code:\n${code}`
        ]);

        res.json(JSON.parse(result.response.text()));
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
        console.error("Generate error:", error);
        res.status(500).json({ error: "Failed to generate flowchart", details: error.message });
    }
});

module.exports = router;
