const crypto = require('crypto');
const config = require('../config');

function deriveKey() {
    return crypto.scryptSync(config.cookieSecret, 'algoflow-salt', 32);
}

function encryptKey(apiKey) {
    const key = deriveKey();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(apiKey, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

function decryptKey(encryptedData) {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) throw new Error('Invalid format');
    const [ivHex, authTagHex, encryptedHex] = parts;
    const key = deriveKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encryptedBuf = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    return decipher.update(encryptedBuf).toString('utf8') + decipher.final('utf8');
}

function requireKey(req, res, next) {
    const encryptedKey = req.cookies?.algoflow_key;
    if (!encryptedKey) {
        return res.status(401).json({ error: 'no_key', message: 'No API key configured' });
    }
    try {
        req.geminiKey = decryptKey(encryptedKey);
        next();
    } catch {
        return res.status(401).json({ error: 'invalid_session', message: 'Key session invalid' });
    }
}

module.exports = { encryptKey, decryptKey, requireKey };
