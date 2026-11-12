const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const { OAuth2Client } = require('google-auth-library');
const { getGoogleClientId } = require('../config/google');
const {
    SESSION_COOKIE,
    SESSION_MAX_AGE_MS,
    getJwtSecret,
    sessionCookieOptions,
    clearSessionCookieOptions,
} = require('../config/security');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BCRYPT_ROUNDS = 12;
const MAX_FAILED_ATTEMPTS = 10;
const LOCK_MS = 15 * 60 * 1000;

// A real bcrypt hash used when the email does not exist so that failed login
// timing does not reveal whether an account is registered.
const DUMMY_HASH = '$2b$12$qwbKkcYt6PUeurPtifHE7eW20YqXFjCJtb/jgsFzck2VEz0aqUPue';

let googleClient = null;
let googleClientId = null;

function getGoogleClient() {
    const clientId = getGoogleClientId();
    if (!clientId) return null;
    if (!googleClient || googleClientId !== clientId) {
        googleClient = new OAuth2Client(clientId);
        googleClientId = clientId;
    }
    return googleClient;
}

function signToken(user) {
    const raw = typeof user.toObject === 'function' ? user.toObject() : user;
    return jwt.sign(
        {
            id: String(raw._id || raw.id),
            email: raw.email,
            name: raw.name || '',
            tier: raw.tier || 'Genin',
            kamiKoins: Number(raw.kamiKoins) || 0,
            sid: String(raw.activeSessionId || ''),
            sv: Number(raw.sessionVersion) || 0,
        },
        getJwtSecret(),
        {
            algorithm: 'HS256',
            expiresIn: '7d',
            issuer: 'kamiwear',
            audience: 'kamiwear-web',
        }
    );
}

function sanitizeUser(user) {
    const raw = typeof user.toObject === 'function' ? user.toObject() : { ...user };
    delete raw.password;
    delete raw.__v;
    delete raw.googleId;
    delete raw.activeSessionId;
    delete raw.sessionVersion;
    delete raw.failedLoginAttempts;
    delete raw.lockUntil;
    delete raw.lastLoginIp;
    return {
        ...raw,
        _id: String(raw._id || raw.id),
        id: String(raw._id || raw.id),
        kamiKoins: Number(raw.kamiKoins) || 0,
        tier: raw.tier || 'Genin',
    };
}

async function issueSession(user, req, res) {
    const sessionId = crypto.randomUUID();
    const updated = await User.startSession(user._id || user.id, sessionId, { ip: req.ip });
    if (!updated) throw new Error('Could not establish a login session');

    const token = signToken(updated);
    res.cookie(SESSION_COOKIE, token, sessionCookieOptions());

    const payload = {
        user: sanitizeUser(updated),
        expiresIn: SESSION_MAX_AGE_MS,
    };

    // Off by default: the browser stores the session in an httpOnly cookie, so
    // JavaScript/XSS cannot read it. Enable only for trusted API integrations.
    if (String(process.env.AUTH_RETURN_TOKEN || '').toLowerCase() === 'true') {
        payload.token = token;
    }

    return payload;
}

const register = async (req, res) => {
    try {
        const name = String(req.body.name || '').trim();
        const email = String(req.body.email || '').trim().toLowerCase();
        const password = String(req.body.password || '');

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Missing required fields (name, email, password)' });
        }
        if (name.length < 2 || name.length > 80) {
            return res.status(400).json({ error: 'Name must be between 2 and 80 characters' });
        }
        if (email.length > 254 || !EMAIL_RE.test(email)) {
            return res.status(400).json({ error: 'Please enter a valid email address' });
        }
        if (password.length < 8 || password.length > 128) {
            return res.status(400).json({ error: 'Password must be between 8 and 128 characters' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ error: 'An account with this email already exists. Please sign in.' });
        }

        const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
        const newUser = await User.create({ name, email, password: hashedPassword });
        const session = await issueSession(newUser, req, res);

        res.status(201).json(session);
    } catch (error) {
        console.error('Register error:', error.message);
        if (error && error.code === 11000) {
            return res.status(409).json({ error: 'An account with this email already exists. Please sign in.' });
        }
        res.status(500).json({ error: 'Server error during registration' });
    }
};

const login = async (req, res) => {
    try {
        const email = String(req.body.email || '').trim().toLowerCase();
        const password = String(req.body.password || '');

        if (!email || !password) {
            return res.status(400).json({ error: 'Missing email or password' });
        }

        const user = await User.findOne({ email }, { includePassword: true });

        // Always perform a bcrypt comparison, even for unknown emails, so the
        // response time does not reveal whether an account exists.
        if (!user || !user.password) {
            await bcrypt.compare(password, DUMMY_HASH);
            if (user) await User.recordFailedLogin(email, { maxAttempts: MAX_FAILED_ATTEMPTS, lockMs: LOCK_MS });
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        if (user.lockUntil && new Date(user.lockUntil).getTime() > Date.now()) {
            return res.status(429).json({
                error: 'Too many failed login attempts. Please wait 15 minutes and try again.',
                code: 'ACCOUNT_LOCKED',
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            const updated = await User.recordFailedLogin(email, {
                maxAttempts: MAX_FAILED_ATTEMPTS,
                lockMs: LOCK_MS,
            });
            const locked = updated && updated.lockUntil && new Date(updated.lockUntil).getTime() > Date.now();
            return res.status(locked ? 429 : 401).json({
                error: locked
                    ? 'Too many failed login attempts. Please wait 15 minutes and try again.'
                    : 'Invalid email or password',
                ...(locked ? { code: 'ACCOUNT_LOCKED' } : {}),
            });
        }

        const session = await issueSession(user, req, res);
        res.status(200).json(session);
    } catch (error) {
        console.error('Login error:', error.message);
        res.status(500).json({ error: 'Server error during login' });
    }
};

const googleLogin = async (req, res) => {
    try {
        const token = req.body.token || req.body.credential;
        if (!token) return res.status(400).json({ error: 'Missing Google token' });

        const client = getGoogleClient();
        if (!client) {
            return res.status(503).json({
                error: 'Google Sign-In is not configured on this server. Set GOOGLE_CLIENT_ID.',
            });
        }

        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: getGoogleClientId(),
        });

        const payload = ticket.getPayload() || {};
        const email = String(payload.email || '').toLowerCase();
        const name = String(payload.name || (email ? email.split('@')[0] : 'Shinobi')).slice(0, 80);
        const googleId = payload.sub;

        if (!email || !googleId || !payload.email_verified) {
            return res.status(401).json({ error: 'Google account did not return a verified email address' });
        }

        let user = await User.findOne({ email });

        if (!user) {
            user = await User.create({
                email,
                name,
                googleId,
                tier: 'Genin',
                kamiKoins: 0,
            });
        } else if (user.googleId && user.googleId !== googleId) {
            return res.status(409).json({ error: 'This email is linked to a different Google account' });
        } else if (!user.googleId) {
            user.googleId = googleId;
            await user.save();
        }

        const session = await issueSession(user, req, res);
        res.status(200).json(session);
    } catch (error) {
        console.error('Google Auth error:', error.message);
        res.status(401).json({
            error: 'Google authentication failed. Please try again.',
            details: 'Check that this domain is listed under Authorized JavaScript origins for the Google OAuth client.',
        });
    }
};

const getMe = async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.user.id });
        if (!user) {
            return res.status(401).json({ error: 'Session is no longer valid. Please sign in again.', code: 'SESSION_EXPIRED' });
        }
        res.status(200).json({ user: sanitizeUser(user) });
    } catch (error) {
        console.error('getMe error:', error.message);
        res.status(500).json({ error: 'Server error during session verification' });
    }
};

const updateProfile = async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.user.id });
        if (!user) {
            return res.status(401).json({ error: 'Session is no longer valid. Please sign in again.', code: 'SESSION_EXPIRED' });
        }

        const { name, bio, avatarSeed } = req.body;

        if (name !== undefined) {
            const cleanName = String(name).trim();
            if (cleanName.length < 2 || cleanName.length > 80) {
                return res.status(400).json({ error: 'Name must be between 2 and 80 characters' });
            }
            user.name = cleanName;
        }
        if (bio !== undefined) user.bio = String(bio).slice(0, 500);
        if (avatarSeed !== undefined) user.avatarSeed = String(avatarSeed).slice(0, 120);

        await user.save();

        res.status(200).json({ user: sanitizeUser(user), message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Update profile error:', error.message);
        res.status(500).json({ error: 'Server error during profile update' });
    }
};

const logout = async (req, res) => {
    try {
        await User.clearSession(req.user.id, req.user.sid);
    } catch (error) {
        console.error('Logout error:', error.message);
    }
    res.clearCookie(SESSION_COOKIE, clearSessionCookieOptions());
    res.status(200).json({ success: true, message: 'Signed out successfully' });
};

module.exports = { register, login, getMe, googleLogin, updateProfile, logout };
