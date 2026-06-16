require('dotenv').config();

const app = require('./app');
const { initFirebase } = require('./config/firebase');
const { initRedis } = require('./config/redis');
const { initPostgres } = require('./config/postgres');
const { initSchema } = require('./services/store');
const logger = require('./utils/logger');

const PORT = Number(process.env.PORT) || 3001;

const start = async () => {
    await initFirebase();
    await initRedis();
    await initPostgres();
    await initSchema();

    const server = app.listen(PORT, () => {
        logger.info('server_started', { port: PORT });
        console.log('Backend server running on port ' + PORT);
    });

    const shutdown = (signal) => {
        logger.info('shutdown_signal_received', { signal });
        server.close(() => {
            logger.info('http_server_closed');
            process.exit(0);
        });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
};

start().catch((err) => {
    logger.error('server_start_failed', { error: err.message, stack: err.stack });
    process.exit(1);
});
