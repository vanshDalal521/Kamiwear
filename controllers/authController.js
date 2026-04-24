const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Missing required fields (name, email, password)' });
        }

        let existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(409).json({ error: 'User with this email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({ 
            name, 
            email: email.toLowerCase(), 
            password: hashedPassword 
        });

        // Generate token
        const token = jwt.sign({ id: newUser._id, email: newUser.email }, process.env.JWT_SECRET || 'kamiwear_secret_key', { expiresIn: '7d' });

        const { password: _, ...userWithoutPassword } = newUser.toObject();
        res.status(201).json({ user: userWithoutPassword, token });
    } catch (error) {
        res.status(500).json({ error: 'Server error during registration' });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Missing email or password' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (!user.password) {
            return res.status(401).json({ error: 'Account uses Google Login. Please sign in with Google.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET || 'kamiwear_secret_key', { expiresIn: '7d' });

        const { password: _, ...userWithoutPassword } = user.toObject();
        res.status(200).json({ user: userWithoutPassword, token });
    } catch (error) {
        res.status(500).json({ error: 'Server error during login' });
    }
};

const googleLogin = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ error: 'Missing Google token' });

        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { email, name, sub: googleId } = payload;

        let user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            // create user if they don't exist
            user = await User.create({
                email: email.toLowerCase(),
                name: name,
                googleId: googleId,
                tier: 'Genin',
                kamiKoins: 0
            });
        } else if (!user.googleId) {
            // Link google account to existing user if they registered via email first
            user.googleId = googleId;
            await user.save();
        }

        const jwtToken = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET || 'kamiwear_secret_key', { expiresIn: '7d' });

        const { password: _, ...userWithoutPassword } = user.toObject();
        res.status(200).json({ user: userWithoutPassword, token: jwtToken });

    } catch (error) {
        console.error("Google Auth error:", error);
        res.status(500).json({ error: 'Google authentication failed' });
    }
}

const getMe = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.user.email });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const { password: _, ...userWithoutPassword } = user.toObject();
        res.status(200).json({ user: userWithoutPassword });
    } catch (error) {
        res.status(500).json({ error: 'Server error during session verification' });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { name, bio, avatarSeed } = req.body;
        const user = await User.findOne({ email: req.user.email });
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (name) user.name = name;
        if (bio !== undefined) user.bio = bio;
        if (avatarSeed) user.avatarSeed = avatarSeed;

        await user.save();

        const { password: _, ...userWithoutPassword } = user.toObject();
        res.status(200).json({ user: userWithoutPassword, message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Server error during profile update' });
    }
};

module.exports = { register, login, getMe, googleLogin, updateProfile };
