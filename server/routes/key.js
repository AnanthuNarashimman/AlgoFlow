const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { encryptKey, decryptKey } = require('../middleware/keyAuth');
const config = require('../config');


function cookieOptions() {
    return {
        httpOnly: true,
        secure: config.isProduction,
        sameSite: config.isProduction ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    };
}

// Validate key via countTokens (free call) then store encrypted in HttpOnly cookie
router.post('/', async (req, res) => {
    const { apiKey } = req.body;
    if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
        return res.status(400).json({ error: 'invalid_format', message: 'Invalid API key format' });
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey.trim());
        const model = genAI.getGenerativeModel({ model: config.geminiModel });
        await model.countTokens('ping');

        res.cookie('algoflow_key', encryptKey(apiKey.trim()), cookieOptions());
        res.json({ success: true });
    } catch (error) {
        const status = error.status || error.statusCode;
        if (status === 429) {
            return res.status(429).json({
                error: 'quota_exceeded',
                message: 'Your Gemini quota is exhausted. Check usage at aistudio.google.com'
            });
        }
        return res.status(401).json({
            error: 'invalid_key',
            message: 'Key rejected by Gemini. Verify it at aistudio.google.com'
        });
    }
});

// Return whether a valid encrypted key cookie exists
router.get('/status', (req, res) => {
    const encryptedKey = req.cookies?.algoflow_key;
    if (!encryptedKey) return res.json({ valid: false });
    try {
        decryptKey(encryptedKey);
        res.json({ valid: true });
    } catch {
        res.json({ valid: false });
    }
});

// Clear the key cookie
router.delete('/', (req, res) => {
    res.clearCookie('algoflow_key', cookieOptions());
    res.json({ success: true });
});

module.exports = router;
