const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const { SESSION_COOKIE, getJwtSecret } = require('../config/security');

function extractToken(req) {
    const header = req.header('Authorization') || '';
    if (header.startsWith('Bearer ')) return header.slice(7).trim();
    return req.cookies?.[SESSION_COOKIE] || '';
}

module.exports = async (req, res, next) => {
    const token = extractToken(req);
    if (!token) {
        return res.status(401).json({ error: 'Authentication required. No token provided.', code: 'AUTH_REQUIRED' });
    }

    let decoded;
    try {
        decoded = jwt.verify(token, getJwtSecret(), {
            algorithms: ['HS256'],
            issuer: 'kamiwear',
            audience: 'kamiwear-web',
        });
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Your session has expired. Please sign in again.', code: 'TOKEN_EXPIRED' });
        }
        return res.status(401).json({ error: 'Invalid or expired token.', code: 'INVALID_TOKEN' });
    }

    if (!decoded.id || !decoded.sid || decoded.sv === undefined) {
        return res.status(401).json({
            error: 'Your session is outdated. Please sign in again.',
            code: 'SESSION_EXPIRED',
        });
    }

    try {
        const session = await User.getSessionState(decoded.id);
        if (!session) {
            return res.status(401).json({
                error: 'Your session is no longer valid. Please sign in again.',
                code: 'SESSION_EXPIRED',
            });
        }

        const currentSessionId = String(session.activeSessionId || '');
        const currentVersion = Number(session.sessionVersion) || 0;

        if (currentSessionId !== String(decoded.sid) || currentVersion !== Number(decoded.sv)) {
            return res.status(401).json({
                error: 'This account was signed in on another device. Please sign in again here.',
                code: 'SESSION_REPLACED',
            });
        }

        req.user = {
            ...decoded,
            email: session.email || decoded.email,
            name: session.name || decoded.name,
            tier: session.tier || decoded.tier,
            kamiKoins: Number(session.kamiKoins) || 0,
        };
        req.session = session;
        return next();
    } catch (error) {
        console.error('[Kamiwear Auth] Session lookup failed:', error.message);
        return res.status(503).json({
            error: 'Session service is temporarily unavailable. Please try again.',
            code: 'SESSION_UNAVAILABLE',
        });
    }
};
