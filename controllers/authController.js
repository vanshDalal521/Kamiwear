const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const { OAuth2Client } = require('google-auth-library');
const { isMongoReady } = require('../config/db');
const { getGoogleClientId } = require('../config/google');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
let googleClient = null;
let googleClientId = null;

function getJwtSecret() {
    return process.env.JWT_SECRET || 'kamiwear_secret_key';
}

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
        },
        getJwtSecret(),
        { expiresIn: '7d' }
    );
}

function sanitizeUser(user) {
    const raw = typeof user.toObject === 'function' ? user.toObject() : { ...user };
    delete raw.password;
    delete raw.__v;
    return { ...raw, _id: String(raw._id || raw.id), id: String(raw._id || raw.id) };
}

const register = async (req, res) => {
    try {
        const name = String(req.body.name || '').trim();
        const email = String(req.body.email || '').trim().toLowerCase();
        const password = String(req.body.password || '');

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Missing required fields (name, email, password)' });
        }
        if (!EMAIL_RE.test(email)) {
            return res.status(400).json({ error: 'Please enter a valid email address' });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ error: 'User with this email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({ name, email, password: hashedPassword });

        res.status(201).json({ user: sanitizeUser(newUser), token: signToken(newUser) });
    } catch (error) {
        console.error('Register error:', error);
        if (error && error.code === 11000) {
            return res.status(409).json({ error: 'User with this email already exists' });
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

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        if (!user.password) {
            return res.status(401).json({ error: 'This account uses Google Sign-In. Please continue with Google.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        res.status(200).json({ user: sanitizeUser(user), token: signToken(user) });
    } catch (error) {
        console.error('Login error:', error);
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
        const name = payload.name || (email ? email.split('@')[0] : 'Shinobi');
        const googleId = payload.sub;

        if (!email || !googleId) {
            return res.status(401).json({ error: 'Google account did not return an email address' });
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
        } else if (!user.googleId) {
            user.googleId = googleId;
            await user.save();
        }

        res.status(200).json({ user: sanitizeUser(user), token: signToken(user) });
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
        const user = await User.findOne({ email: req.user.email });
        if (!user) {
            // On serverless deployments without a database the user record may
            // live in a different (cold) instance. The JWT still contains a safe
            // snapshot of the profile, so return that instead of logging the
            // user out. A real database remains the source of truth.
            if (isMongoReady()) {
                return res.status(404).json({ error: 'User not found' });
            }
            return res.status(200).json({
                user: {
                    _id: String(req.user.id || ''),
                    id: String(req.user.id || ''),
                    email: req.user.email,
                    name: req.user.name || String(req.user.email || '').split('@')[0] || 'Shinobi',
                    tier: req.user.tier || 'Genin',
                    kamiKoins: Number(req.user.kamiKoins) || 0,
                    bio: '',
                    avatarSeed: '',
                },
                ephemeral: true,
            });
        }
        res.status(200).json({ user: sanitizeUser(user) });
    } catch (error) {
        console.error('getMe error:', error);
        res.status(500).json({ error: 'Server error during session verification' });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { name, bio, avatarSeed } = req.body;
        const user = await User.findOne({ email: req.user.email });

        if (!user) {
            if (isMongoReady()) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Ephemeral mode: keep the session profile in sync in the JWT so
            // the UI works even though serverless storage cannot persist it.
            const cleanName = name !== undefined ? String(name).trim() : (req.user.name || 'Shinobi');
            if (cleanName.length < 2) {
                return res.status(400).json({ error: 'Name must be at least 2 characters' });
            }
            const updated = {
                _id: String(req.user.id || ''),
                id: String(req.user.id || ''),
                email: req.user.email,
                name: cleanName,
                tier: req.user.tier || 'Genin',
                kamiKoins: Number(req.user.kamiKoins) || 0,
                bio: bio !== undefined ? String(bio).slice(0, 500) : '',
                avatarSeed: avatarSeed !== undefined ? String(avatarSeed).slice(0, 120) : '',
            };
            return res.status(200).json({
                user: updated,
                token: signToken(updated),
                message: 'Profile updated for this session',
                ephemeral: true,
            });
        }

        if (name !== undefined) {
            const cleanName = String(name).trim();
            if (cleanName.length < 2) {
                return res.status(400).json({ error: 'Name must be at least 2 characters' });
            }
            user.name = cleanName;
        }
        if (bio !== undefined) user.bio = String(bio).slice(0, 500);
        if (avatarSeed !== undefined) user.avatarSeed = String(avatarSeed).slice(0, 120);

        await user.save();

        res.status(200).json({ user: sanitizeUser(user), message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Server error during profile update' });
    }
};

module.exports = { register, login, getMe, googleLogin, updateProfile };
