const mongoose = require('mongoose');

let lastError = null;
let connectPromise = null;

const getMongoUri = () => String(process.env.MONGO_URI || process.env.MONGODB_URI || '').trim();

const hasUsableMongoUri = () => {
    const uri = getMongoUri();
    if (!uri) return false;
    return !uri.includes('<db_password>') && !uri.includes('<user>') && !uri.includes('your-cluster');
};

/**
 * Connect to MongoDB when a usable connection string is configured.
 *
 * The connection attempt is cached so that API middleware can await the same
 * promise on the first request.  This matters on serverless platforms: the
 * module is evaluated and the handler may receive a request before the async
 * connection has settled.  Without awaiting, the first request would see
 * `readyState !== 1` and wrongly fall back to ephemeral storage.
 *
 * The app deliberately keeps working without MongoDB (JSON/in-memory fallback)
 * so local development is frictionless.  In production you should always set a
 * real MONGO_URI — serverless filesystems are read-only and ephemeral.
 */
const connectDB = () => {
    if (connectPromise) return connectPromise;

    // Support both common names so deployments can use whichever they prefer.
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

    connectPromise = (async () => {
        try {
            mongoose.set('strictQuery', true);
            const conn = await mongoose.connect(uri, {
                serverSelectionTimeoutMS: 5000,
            });
            lastError = null;
            console.log(`[Kamiwear Backend] MongoDB Connected: ${conn.connection.host}`);
            return conn;
        } catch (error) {
            lastError = error.message;
            console.error(`[Kamiwear Backend] MongoDB connection failed: ${error.message}`);
            console.error('[Kamiwear Backend] Falling back to local JSON storage.');
            return null;
        }
    })();

    return connectPromise;
};

const ensureDbReady = () => connectPromise || connectDB();

const isMongoReady = () => mongoose.connection.readyState === 1;

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
module.exports.getDbStatus = getDbStatus;
