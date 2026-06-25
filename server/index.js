const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const config = require('./config');

const generateRoute = require('./routes/generate');
const chatRoute = require('./routes/chat');
const keyRoute = require('./routes/key');

const app = express();

app.use(cors({
    origin: config.clientUrl,
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api/generate', generateRoute);
app.use('/api/chat', chatRoute);
app.use('/api/key', keyRoute);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(config.port, () => {
    console.log(`AlgoFlow Backend running on http://localhost:${config.port}`);
});
