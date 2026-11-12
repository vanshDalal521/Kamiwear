const path = require('path');
const dotenv = require('dotenv');

// Load environment variables with explicit path (no-op on Vercel, where env vars are injected)
dotenv.config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const connectDB = require('./config/db');
const { ensureDbReady, getDbStatus } = require('./config/db');
const { getGoogleClientId } = require('./config/google');

// Kick off the connection immediately, but let API routes await it below so a
// serverless cold start does not accidentally use ephemeral storage.
connectDB();

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);

// Middleware
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200
}));
app.use(express.json({ limit: '1mb' }));

// Data-backed routes wait for the (cached) MongoDB connection attempt before
// running their handlers. Without MONGO_URI this resolves immediately.
app.use(['/api/auth', '/api/orders'], async (req, res, next) => {
    try {
        await ensureDbReady();
    } catch (error) {
        console.error('[Kamiwear Backend] Database readiness check failed:', error.message);
    }
    next();
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);

// Public runtime configuration for the frontend (never expose secrets)
app.get('/api/config', (req, res) => {
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID || '';
    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET || '';
    const simulatedCard = String(process.env.ENABLE_BANKING_SIM || '').toLowerCase() === 'true';
    const googleClientId = getGoogleClientId();

    res.status(200).json({
        googleClientId,
        googleConfigured: Boolean(googleClientId),
        razorpayKeyId,
        currency: 'INR',
        payments: {
            cod: true,
            upi: true,
            card: Boolean(razorpayKeyId && razorpaySecret),
            simulatedCard,
        },
    });
});

// Health check
app.get('/api/health', (req, res) => {
    const database = getDbStatus();

    res.status(200).json({
        status: 'OK',
        message: 'Kamiwear Backend is running perfectly.',
        database,
        storage: database.connected ? 'mongodb' : (process.env.VERCEL ? 'ephemeral' : 'json'),
        googleConfigured: Boolean(getGoogleClientId()),
        paymentsConfigured: {
            cod: true,
            upi: true,
            razorpay: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
            sandboxCards: String(process.env.ENABLE_BANKING_SIM || '').toLowerCase() === 'true',
        },
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
    maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0,
}));

// JSON body parse errors
app.use((err, req, res, next) => {
    if (err && err.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'Invalid JSON body' });
    }
    console.error('[Kamiwear Backend] Unhandled error:', err);
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
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`[FATAL] Port ${PORT} is already in use. Please kill the other process or change the port in .env.`);
        } else {
            console.error('[FATAL] Server error:', err);
        }
    });
}

module.exports = app;
