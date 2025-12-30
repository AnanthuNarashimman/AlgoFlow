const express = require('express');
const cors = require('cors');
const config = require('./config');

// Import routes
const generateRoute = require('./routes/generate');
const chatRoute = require('./routes/chat');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/generate', generateRoute);
app.use('/api/chat', chatRoute);

// Start server
app.listen(config.port, () => {
    console.log(`AlgoFlow Backend running on http://localhost:${config.port}`);
});
