const path = require('path');
const dotenv = require('dotenv');

// Load environment variables with explicit path
dotenv.config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const connectDB = require('./config/db');

// Initialize DB
connectDB();

const app = express();
const PORT = process.env.PORT || 3000;

// Debug origin
app.use((req, res, next) => {
    console.log(`[CORS Debug] Request from Origin: ${req.get('origin') || 'No Origin'}`);
    next();
});

// Middleware
app.use(cors({
    origin: true, // Reflect the request origin in the Access-Control-Allow-Origin header
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);

// Serve static files from root and structure directory
app.use(express.static(path.join(__dirname, '.')));
app.use(express.static(path.join(__dirname, 'structure')));

// Health check
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Kamiwear Backend is running perfectly.' });
});

const HOST = '0.0.0.0';
const server = app.listen(PORT, HOST, () => {
    console.log(`[Kamiwear Backend] Server is running!`);
    console.log(`- Local: http://localhost:${PORT}`);
    console.log(`- Network: http://127.0.0.1:${PORT}`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`[FATAL] Port ${PORT} is already in use. Please kill the other process or change the port in .env.`);
    } else {
        console.error(`[FATAL] Server error:`, err);
    }
});
