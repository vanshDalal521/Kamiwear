const mongoose = require('mongoose');

let lastError = null;
let connectPromise = null;
let lastAttemptAt = 0;
const FAILURE_COOLDOWN_MS = 5000;

const getMongoUri = () => String(process.env.MONGO_URI || process.env.MONGODB_URI || '').trim();

const hasUsableMongoUri = () => {
    const uri = getMongoUri();
    if (!uri) return false;
    return !uri.includes('<db_password>') && !uri.includes('<user>') && !uri.includes('your-cluster');
};

function poolSize() {
    const configured = Number(process.env.MONGO_MAX_POOL_SIZE);
    if (Number.isFinite(configured) && configured > 0) return Math.min(configured, 200);
    return 50;
}

/**
 * Connect to MongoDB when a usable connection string is configured.
 *
 * The connection attempt is cached so API middleware can await the same
 * promise on the first request. A failed attempt is retried after a short
 * cooldown instead of being cached forever.
 */
const connectDB = () => {
    if (connectPromise) return connectPromise;

    const uri = getMongoUri();

    if (!hasUsableMongoUri()) {
        if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
            console.warn(
                '[Kamiwear Backend] MONGO_URI is not configured. Accounts/orders will only live in ' +
                'ephemeral storage on this deployment. Set MONGO_URI in your hosting environment.'
            );
        } else {
            console.warn('[Kamiwear Backend] MONGO_URI not configured — using local JSON storage.');
        }
        connectPromise = Promise.resolve(null);
        return connectPromise;
    }

    if (lastError && Date.now() - lastAttemptAt < FAILURE_COOLDOWN_MS) {
        return Promise.resolve(null);
    }

    lastAttemptAt = Date.now();

    connectPromise = (async () => {
        try {
            mongoose.set('strictQuery', true);
            mongoose.set('sanitizeFilter', true);

            const conn = await mongoose.connect(uri, {
                serverSelectionTimeoutMS: 10000,
                connectTimeoutMS: 10000,
                socketTimeoutMS: 45000,
                maxPoolSize: poolSize(),
                minPoolSize: Math.min(2, poolSize()),
                maxIdleTimeMS: 60000,
                heartbeatFrequencyMS: 10000,
                retryWrites: true,
                w: 'majority',
                autoIndex: false,
            });
            lastError = null;
            console.log(`[Kamiwear Backend] MongoDB Connected: ${conn.connection.host}`);
            return conn;
        } catch (error) {
            lastError = error.message;
            connectPromise = null;
            console.error(`[Kamiwear Backend] MongoDB connection failed: ${error.message}`);
            return null;
        }
    })();

    return connectPromise;
};

const ensureDbReady = () => connectPromise || connectDB();

const isMongoReady = () => mongoose.connection.readyState === 1;

const isMongoConfigured = () => hasUsableMongoUri();

const getDbStatus = () => ({
    connected: isMongoReady(),
    configured: hasUsableMongoUri(),
    state: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown',
    host: isMongoReady() ? mongoose.connection.host : null,
    error: lastError,
});

module.exports = connectDB;
module.exports.connectDB = connectDB;
module.exports.ensureDbReady = ensureDbReady;
module.exports.isMongoReady = isMongoReady;
module.exports.isMongoConfigured = isMongoConfigured;
module.exports.getDbStatus = getDbStatus;
