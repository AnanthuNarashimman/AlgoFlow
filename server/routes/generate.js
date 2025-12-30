const express = require('express');
const router = express.Router();
const { genAI } = require('../services/ai');
const { FLOWCHART_SYSTEM_PROMPT } = require('../prompts/flowchart');
const config = require('../config');

router.post('/', async (req, res) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ error: "No code provided" });
        }

        console.log("Analyzing code...");

        const model = genAI.getGenerativeModel({
            model: config.geminiModel,
            generationConfig: { responseMimeType: "application/json" }
        });

        const result = await model.generateContent([
            FLOWCHART_SYSTEM_PROMPT,
            `Analuze this code:\n${code}`
        ]);

        const responseText = result.response.text();
        const data = JSON.parse(responseText);

        console.log("Flowchart generated successfully!");
        res.json(data);
    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({
            error: "Failed to generate flowchart",
            details: error.message
        });
    }
});

module.exports = router;
