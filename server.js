/**
 * server.js - Backend entry point
 *
 * Minimal production-ready server.
 * This file only imports modules that exist in the current project root
 * and can be loaded directly without assuming routes/ or src/ folders.
 */
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = Number(process.env.PORT) || 3001;

const safeRequire = (modulePath) => {
    try {
        return require(modulePath);
    } catch (err) {
        console.warn('[server] Skipped ' + modulePath + ': ' + err.message);
        return null;
    }
};

const rateLimit = safeRequire('./rateLimit');
const firebase = safeRequire('./firebase');
const redis = safeRequire('./redis');
const response = safeRequire('./Response');

const globalLimiter = rateLimit?.globalLimiter || ((req, res, next) => next());
const notFound = response?.notFound || ((res, message) => {
    res.status(404).json({ success: false, error: message });
});
const serverError = response?.serverError || ((res, err) => {
    console.error('Server Error:', err);
    res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'development'
            ? err.message
            : 'Internal server error',
    });
});

app.disable('x-powered-by');
app.set('trust proxy', Number(process.env.TRUST_PROXY) || 1);

app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
}));
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '1mb' }));

app.use(globalLimiter);

app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        status: 'ok',
        service: 'rakab-backend',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});

app.use((req, res) => {
    notFound(res, 'Route not found');
});

app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);
    serverError(res, err);
});

const startServer = async () => {
    if (typeof firebase?.initFirebase === 'function') {
        firebase.initFirebase();
    }

    if (typeof redis?.initRedis === 'function') {
        await redis.initRedis();
    }

    app.listen(PORT, () => {
        console.log('Backend server running on port ' + PORT);
    });
};

startServer().catch((err) => {
    console.error('Failed to start backend server:', err);
    process.exit(1);
});

module.exports = app;
