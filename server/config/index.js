require('dotenv').config();

const config = {
    port: process.env.PORT || 4000,
    mem0ApiKey: process.env.MEM0_API_KEY,
    geminiModel: "gemini-2.5-flash-lite",
    cookieSecret: process.env.COOKIE_SECRET || 'dev-secret-change-in-production',
    clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
    isProduction: process.env.NODE_ENV === 'production'
};

module.exports = config;
