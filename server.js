const path = require('path');
const dotenv = require('dotenv');

// Load environment variables with explicit path (no-op on Vercel, where env vars are injected)
dotenv.config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const connectDB = require('./config/db');
const {
    ensureDbReady,
    getDbStatus,
    isMongoConfigured,
    isMongoReady,
} = require('./config/db');
const { ensureIndexes } = require('./config/indexes');
const { getGoogleClientId } = require('./config/google');
const {
    getAllowedOrigins,
    isProduction,
} = require('./config/security');
const { getPaymentConfig, getUpiConfig, SUPPORT_EMAIL } = require('./config/store');
const emailService = require('./services/emailService');
const sanitizeRequest = require('./middleware/sanitize');
const originGuard = require('./middleware/originGuard');
const { apiLimiter } = require('./middleware/rateLimit');

// Kick off the connection immediately, but let API routes await it below so a
// serverless cold start does not accidentally use ephemeral storage.
connectDB();

const app = express();
const PORT = process.env.PORT || 3000;

app.disable('x-powered-by');
app.set('trust proxy', 1);

// ---------------------------------------------------------------- Security
app.use(helmet({
    contentSecurityPolicy: {
        useDefaults: false,
        directives: {
            defaultSrc: ["'self'"],
            baseUri: ["'self'"],
            fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
            formAction: ["'self'"],
            frameAncestors: ["'self'"],
            frameSrc: ["'self'", 'https://accounts.google.com'],
            imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
            mediaSrc: ["'self'", 'blob:'],
            objectSrc: ["'none'"],
            scriptSrc: [
                "'self'",
                "'unsafe-inline'",
                'https://cdn.tailwindcss.com',
                'https://accounts.google.com',
                'https://apis.google.com',
            ],
            scriptSrcAttr: ["'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            connectSrc: ["'self'", 'https://accounts.google.com', 'https://www.googleapis.com'],
            workerSrc: ["'self'", 'blob:'],
            manifestSrc: ["'self'"],
            ...(isProduction() ? { upgradeInsecureRequests: [] } : { upgradeInsecureRequests: null }),
        },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    crossOriginResourcePolicy: { policy: 'same-origin' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    hsts: isProduction() ? { maxAge: 15552000, includeSubDomains: true } : false,
}));

const allowedOrigins = new Set(getAllowedOrigins());
app.use(cors({
    origin(origin, callback) {
        if (!origin) return callback(null, true);
        return callback(null, allowedOrigins.has(origin));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'X-Admin-Key'],
    optionsSuccessStatus: 200,
    maxAge: 600,
}));

app.use(compression());
app.use(express.json({ limit: '256kb' }));
app.use(cookieParser());
app.use(sanitizeRequest);

// CSRF protection for cookie-authenticated state-changing requests.
app.use('/api', originGuard);

// API responses can contain account/order data and must never be cached by a
// browser, proxy, or CDN.
app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store, max-age=0');
    res.set('Pragma', 'no-cache');
    next();
});

app.use('/api', apiLimiter);

// Data-backed routes wait for the (cached) MongoDB connection attempt before
// running their handlers. If MongoDB is configured but unreachable we return
// 503 instead of silently writing to ephemeral storage.
app.use(['/api/auth', '/api/orders'], async (req, res, next) => {
    try {
        await ensureDbReady();
    } catch (error) {
        console.error('[Kamiwear Backend] Database readiness check failed:', error.message);
    }

    const status = getDbStatus();
    const ephemeralAllowed = String(process.env.ALLOW_EPHEMERAL_DB || '').toLowerCase() === 'true';
    const isOrderRoute = String(req.originalUrl || '').startsWith('/api/orders');

    if (status.configured && !status.connected) {
        return res.status(503).json({
            error: 'The database is temporarily unavailable. Please try again in a moment.',
            code: 'DATABASE_UNAVAILABLE',
        });
    }

    // On Vercel, api/auth and api/orders can be separate function bundles with
    // separate ephemeral stores. Without MongoDB an account created by one
    // bundle is invisible to the other, so checkout would fail with a
    // misleading "session expired" error. Fail clearly instead of accepting
    // orders that cannot be stored or reconciled.
    if (isOrderRoute && !isMongoConfigured() && isProduction() && !ephemeralAllowed) {
        return res.status(503).json({
            error: 'Checkout is temporarily unavailable because the store database is not configured. Set MONGO_URI to enable orders.',
            code: 'DATABASE_NOT_CONFIGURED',
        });
    }

    if (isMongoConfigured() && status.connected) {
        await ensureIndexes();
    }

    if (
        !isMongoConfigured() &&
        isProduction() &&
        !ephemeralAllowed &&
        String(process.env.REQUIRE_MONGO || '').toLowerCase() === 'true'
    ) {
        return res.status(503).json({
            error: 'The store database is not configured yet.',
            code: 'DATABASE_NOT_CONFIGURED',
        });
    }

    next();
});

// ------------------------------------------------------------- API routes
// Fail closed if production auth is misconfigured instead of letting every
// login/registration attempt end in an opaque 500.
app.use('/api/auth', (req, res, next) => {
    if (isProduction() && String(process.env.JWT_SECRET || '').length < 32) {
        return res.status(503).json({
            error: 'Authentication is not configured on this deployment. Set JWT_SECRET.',
            code: 'AUTH_NOT_CONFIGURED',
        });
    }
    next();
});

app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);

// Public runtime configuration for the frontend (never expose secrets)
app.get('/api/config', (req, res) => {
    const googleClientId = getGoogleClientId();

    res.status(200).json({
        googleClientId,
        googleConfigured: Boolean(googleClientId),
        currency: 'INR',
        payments: getPaymentConfig(),
        upi: getUpiConfig(),
        emailConfigured: emailService.isConfigured(),
        emailProvider: emailService.getEmailProvider(),
        supportEmail: SUPPORT_EMAIL,
        session: {
            cookieAuth: true,
            tokenInBody: String(process.env.AUTH_RETURN_TOKEN || '').toLowerCase() === 'true',
        },
    });
});

// Health check
app.get('/api/health', (req, res) => {
    const database = getDbStatus();
    const storage = database.connected ? 'mongodb' : (process.env.VERCEL ? 'ephemeral' : 'json');
    const warnings = [];

    if (!database.configured) warnings.push('MONGO_URI is not configured; data will not survive a restart.');
    if (!emailService.isConfigured()) warnings.push('Email provider is not configured; order confirmation emails will not be delivered.');
    const jwtSecret = String(process.env.JWT_SECRET || '');
    if (jwtSecret.length < 32) {
        warnings.push(
            isProduction()
                ? 'JWT_SECRET is missing or shorter than 32 characters; authentication will fail in production.'
                : 'JWT_SECRET is using the development fallback or is shorter than 32 characters.'
        );
    }

    const healthy = !(database.configured && !database.connected);

    res.status(healthy ? 200 : 503).json({
        status: healthy ? 'OK' : 'DEGRADED',
        message: healthy ? 'Kamiwear Backend is running.' : 'Kamiwear Backend is running without its database.',
        database: {
            connected: database.connected,
            configured: database.configured,
            state: database.state,
            ...(!isProduction() ? { host: database.host, error: database.error } : {}),
        },
        storage,
        googleConfigured: Boolean(getGoogleClientId()),
        payments: getPaymentConfig(),
        upi: { configured: Boolean(getUpiConfig().id) },
        email: {
            configured: emailService.isConfigured(),
            provider: emailService.getEmailProvider(),
        },
        security: {
            sessionControl: true,
            cookieAuth: true,
            rateLimiting: true,
            requestSanitization: true,
        },
        warnings,
        timestamp: new Date().toISOString(),
    });
});

// Unknown API route -> JSON 404 (instead of the static HTML fallback)
app.use('/api', (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
});

// Serve the frontend (HTML pages, assets, scripts)
app.use(express.static(path.join(__dirname, 'public'), {
    extensions: ['html'],
    etag: true,
    lastModified: true,
    setHeaders(res, filePath) {
        if (/\.html?$/i.test(filePath)) {
            // Always revalidate HTML so a deploy is visible immediately.
            res.setHeader('Cache-Control', 'no-cache');
        } else if (/\.(?:js|css)$/i.test(filePath)) {
            res.setHeader('Cache-Control', 'public, max-age=3600');
        } else {
            res.setHeader('Cache-Control', 'public, max-age=604800');
        }
        res.setHeader('X-Content-Type-Options', 'nosniff');
    },
    maxAge: isProduction() ? '1h' : 0,
}));

// Error handler
app.use((err, req, res, next) => {
    if (err && err.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'Invalid JSON body' });
    }
    if (err && err.type === 'entity.too.large') {
        return res.status(413).json({ error: 'Request body is too large' });
    }
    console.error('[Kamiwear Backend] Unhandled error:', err.message || err);
    res.status(500).json({ error: 'Internal server error' });
});

// Local development / self-hosted: start the HTTP server.
// On Vercel the exported app is used as the request handler instead.
if (require.main === module) {
    const HOST = '0.0.0.0';
    const server = app.listen(PORT, HOST, () => {
        console.log('[Kamiwear Backend] Server is running!');
        console.log(`- Local: http://localhost:${PORT}`);
        console.log(`- Network: http://127.0.0.1:${PORT}`);
        console.log(`- Database: ${getDbStatus().state}`);
        console.log(`- Email: ${emailService.getEmailProvider()}`);
    });

    // Keep-alive tuning for self-hosted/container deployments behind a proxy.
    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`[FATAL] Port ${PORT} is already in use. Please kill the other process or change the port in .env.`);
        } else {
            console.error('[FATAL] Server error:', err);
        }
    });
}

module.exports = app;
