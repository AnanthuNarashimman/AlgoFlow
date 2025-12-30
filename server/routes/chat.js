const express = require('express');
const router = express.Router();
const { genAI, memory } = require('../services/ai');
const { CHAT_SYSTEM_PROMPT } = require('../prompts/chat');
const config = require('../config');

router.post('/', async (req, res) => {
    try {
        const { code, message, conversationHistory, userId = 'default_user' } = req.body;

        if (!message) {
            return res.status(400).json({ error: "No message provided" });
        }

        console.log("Processing chat request with Mem0...");

        // Search for relevant memories from past conversations
        const relevantMemories = await memory.search(message, {
            user_id: userId,
            limit: 3  // Get top 3 most relevant past interactions
        });

        console.log(`Found ${relevantMemories.length} relevant memories`);

        const model = genAI.getGenerativeModel({
            model: config.geminiModel
        });

        // Simplified context - Mem0 handles the heavy lifting
        let contextPrompt = CHAT_SYSTEM_PROMPT;

        // Add current code context if provided
        if (code && code.trim()) {
            contextPrompt += `\n\nCurrent code in editor:\n\`\`\`python\n${code}\n\`\`\`\n\n`;
        }

        // Add relevant memories from Mem0 (instead of full conversation history)
        if (relevantMemories && relevantMemories.length > 0) {
            contextPrompt += "\n\nRelevant context from previous conversations:\n";
            relevantMemories.forEach((mem, idx) => {
                contextPrompt += `${idx + 1}. ${mem.memory}\n`;
            });
            contextPrompt += "\n";
        }

        // Only add recent conversation history (last 2-3 messages) instead of all
        if (conversationHistory && conversationHistory.length > 0) {
            const recentHistory = conversationHistory.slice(-3);  // Only last 3 messages
            contextPrompt += "Recent conversation:\n";
            recentHistory.forEach(msg => {
                contextPrompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.text}\n`;
            });
        }

        contextPrompt += `\n\nUser: ${message}\n\nAssistant:`;

        const result = await model.generateContent(contextPrompt);
        const responseText = result.response.text();

        // Store this interaction in Mem0 for future reference
        await memory.add(
            [
                { role: "user", content: message },
                { role: "assistant", content: responseText }
            ],
            {
                user_id: userId,
                metadata: {
                    has_code: !!(code && code.trim()),
                    timestamp: new Date().toISOString(),
                    topic: message.slice(0, 50)  // First 50 chars as topic
                }
            }
        );

        console.log("Chat response generated and stored in Mem0!");
        res.json({ response: responseText });
    } catch (error) {
        console.error("Chat Error:", error);
        res.status(500).json({
            error: "Failed to process chat",
            details: error.message
        });
    }
});

module.exports = router;
