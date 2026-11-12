const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = rateLimit;

let redisClient = null;
let redisUnavailable = false;

/**
 * Optional shared rate-limit store. On serverless platforms the default
 * in-memory store is per-instance, so a Redis URL is recommended for a true
 * global limit. Without it the limits still apply per instance.
 */
function getRedisStore(prefix) {
    if (redisUnavailable || !process.env.RATE_LIMIT_REDIS_URL) return undefined;

    try {
        if (!redisClient) {
            const Redis = require('ioredis');
            redisClient = new Redis(process.env.RATE_LIMIT_REDIS_URL, {
                maxRetriesPerRequest: 1,
                enableOfflineQueue: false,
                retryStrategy: times => (times > 3 ? null : Math.min(times * 200, 1000)),
            });
            redisClient.on('error', error => {
                console.error('[Kamiwear Security] Redis rate-limit store error:', error.message);
            });
            redisClient.on('end', () => {
                console.warn('[Kamiwear Security] Redis rate-limit store disconnected — using memory fallback.');
                redisUnavailable = true;
                redisClient = null;
            });
        }

        const { RedisStore } = require('rate-limit-redis');
        return new RedisStore({
            sendCommand: (...args) => redisClient.call(...args),
            prefix: `kw:rl:${prefix}:`,
        });
    } catch (error) {
        console.error('[Kamiwear Security] Could not initialise Redis rate limiting:', error.message);
        redisUnavailable = true;
        return undefined;
    }
}

function makeLimiter({ name, windowMs, limit, message, keyGenerator, skipSuccessfulRequests = false }) {
    return rateLimit({
        windowMs,
        limit,
        standardHeaders: 'draft-8',
        legacyHeaders: false,
        skipSuccessfulRequests,
        store: getRedisStore(name),
        ...(keyGenerator ? { keyGenerator } : {}),
        handler: (req, res) => {
            res.status(429).json({ error: message, code: 'RATE_LIMITED' });
        },
    });
}

// General API ceiling. Kept generous because many customers can share a NAT/IP.
const apiLimiter = makeLimiter({
    name: 'api',
    windowMs: 60 * 1000,
    limit: 600,
    message: 'Too many requests. Please slow down and try again shortly.',
});

// Login/registration attempts per IP.
const authLimiter = makeLimiter({
    name: 'auth',
    windowMs: 15 * 60 * 1000,
    limit: 30,
    skipSuccessfulRequests: true,
    message: 'Too many authentication attempts. Please wait 15 minutes and try again.',
});

// Order creation per authenticated account and IP.
const orderLimiter = makeLimiter({
    name: 'orders',
    windowMs: 10 * 60 * 1000,
    limit: 30,
    message: 'Too many order attempts. Please wait a few minutes and try again.',
    keyGenerator: req => `${req.user?.id || 'anonymous'}:${ipKeyGenerator(req.ip)}`,
});

// Verification-email resend / payment verification endpoints.
const sensitiveLimiter = makeLimiter({
    name: 'sensitive',
    windowMs: 10 * 60 * 1000,
    limit: 20,
    message: 'Too many attempts. Please wait a few minutes and try again.',
});

module.exports = {
    apiLimiter,
    authLimiter,
    orderLimiter,
    sensitiveLimiter,
};
