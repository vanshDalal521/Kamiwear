const mongoose = require('mongoose');
const { isMongoReady } = require('../config/db');
const { createJsonStore } = require('./jsonStore');

const store = createJsonStore('users.json');

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true, maxlength: 80 },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            maxlength: 254,
        },
        password: { type: String, default: null, select: false },
        googleId: { type: String, default: null, index: { unique: true, sparse: true } },
        kamiKoins: { type: Number, default: 0, min: 0 },
        tier: { type: String, default: 'Genin' },
        bio: { type: String, default: '', maxlength: 500 },
        avatarSeed: { type: String, default: '', maxlength: 120 },

        // One active session per account. A new login rotates this value, which
        // invalidates every older JWT/cookie immediately.
        sessionVersion: { type: Number, default: 0 },
        activeSessionId: { type: String, default: null },
        lastLoginAt: { type: Date, default: null },
        lastLoginIp: { type: String, default: '' },
        failedLoginAttempts: { type: Number, default: 0 },
        lockUntil: { type: Date, default: null },
    },
    {
        timestamps: true,
        autoIndex: process.env.NODE_ENV !== 'production',
    }
);

userSchema.set('toJSON', {
    transform: (doc, ret) => {
        delete ret.password;
        delete ret.__v;
        delete ret.activeSessionId;
        delete ret.sessionVersion;
        delete ret.failedLoginAttempts;
        delete ret.lockUntil;
        delete ret.lastLoginIp;
        return ret;
    },
});

function MongoUser() {
    return mongoose.models.KamiUser || mongoose.model('KamiUser', userSchema);
}

function duplicateError(field) {
    const error = new Error(`Duplicate value for ${field}`);
    error.code = 11000;
    error.keyPattern = { [field]: 1 };
    return error;
}

class UserInstance {
    constructor(data) {
        Object.assign(this, data);
        this._id = data._id || data.id || Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
        this.id = this._id;
        this.sessionVersion = Number(this.sessionVersion) || 0;
        this.failedLoginAttempts = Number(this.failedLoginAttempts) || 0;
    }

    async save() {
        const users = await store.read();
        const index = users.findIndex(u => u._id === this._id || u.email === this.email);
        const serialized = this.toObject();
        if (index > -1) users[index] = serialized;
        else {
            if (users.some(u => u.email === this.email)) throw duplicateError('email');
            users.push(serialized);
        }
        await store.write(users);
        return this;
    }

    toObject() {
        const { id, ...rest } = this;
        return { ...rest, _id: this._id };
    }
}

const User = {
    async getAll() {
        if (isMongoReady()) return MongoUser().find({}).lean();
        return store.read();
    },

    async findOne(query = {}, options = {}) {
        if (isMongoReady()) {
            let request = MongoUser().findOne(query);
            if (options.includePassword) request = request.select('+password');
            return request;
        }

        const users = await store.read();
        const user = users.find(u => {
            if (query.email) return u.email === String(query.email).toLowerCase();
            if (query.googleId) return u.googleId === query.googleId;
            if (query._id) return u._id === query._id || u.id === query._id;
            return false;
        });
        return user ? new UserInstance(user) : null;
    },

    async create(userData) {
        const payload = {
            email: String(userData.email).toLowerCase(),
            password: userData.password || null,
            name: userData.name,
            googleId: userData.googleId || null,
            kamiKoins: Number(userData.kamiKoins) || 0,
            tier: userData.tier || 'Genin',
            bio: userData.bio || '',
            avatarSeed: userData.avatarSeed || '',
            sessionVersion: Number(userData.sessionVersion) || 0,
            activeSessionId: null,
            lastLoginAt: null,
            lastLoginIp: '',
            failedLoginAttempts: 0,
            lockUntil: null,
        };

        if (isMongoReady()) {
            return MongoUser().create(payload);
        }

        const users = await store.read();
        if (users.some(u => u.email === payload.email)) throw duplicateError('email');
        if (payload.googleId && users.some(u => u.googleId === payload.googleId)) {
            throw duplicateError('googleId');
        }

        const newUser = new UserInstance({
            ...payload,
            _id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
            createdAt: new Date().toISOString(),
        });
        users.push(newUser.toObject());
        await store.write(users);
        return newUser;
    },

    /**
     * Rotate the active session. The atomic `$inc` guarantees that two
     * simultaneous logins cannot both keep the same session version.
     */
    async startSession(userId, sessionId, meta = {}) {
        const update = {
            activeSessionId: sessionId,
            lastLoginAt: new Date(),
            lastLoginIp: String(meta.ip || '').slice(0, 80),
            failedLoginAttempts: 0,
            lockUntil: null,
        };

        if (isMongoReady()) {
            try {
                return await MongoUser().findOneAndUpdate(
                    { _id: userId },
                    { $inc: { sessionVersion: 1 }, $set: update },
                    { new: true }
                );
            } catch (error) {
                if (error.name === 'CastError') return null;
                throw error;
            }
        }

        const users = await store.read();
        const index = users.findIndex(u => String(u._id) === String(userId));
        if (index === -1) return null;
        const next = {
            ...users[index],
            ...update,
            sessionVersion: Number(users[index].sessionVersion || 0) + 1,
            lastLoginAt: update.lastLoginAt.toISOString(),
        };
        users[index] = next;
        await store.write(users);
        return new UserInstance(next);
    },

    async getSessionState(userId) {
        if (isMongoReady()) {
            try {
                return await MongoUser()
                    .findById(userId)
                    .select('email name tier kamiKoins sessionVersion activeSessionId')
                    .lean();
            } catch (error) {
                if (error.name === 'CastError') return null;
                throw error;
            }
        }

        const users = await store.read();
        const user = users.find(u => String(u._id) === String(userId) || String(u.id) === String(userId));
        if (!user) return null;
        return {
            _id: user._id,
            email: user.email,
            name: user.name,
            tier: user.tier,
            kamiKoins: Number(user.kamiKoins) || 0,
            sessionVersion: Number(user.sessionVersion) || 0,
            activeSessionId: user.activeSessionId || null,
        };
    },

    async clearSession(userId, sessionId) {
        if (isMongoReady()) {
            try {
                return await MongoUser().findOneAndUpdate(
                    { _id: userId, activeSessionId: sessionId },
                    { $set: { activeSessionId: null }, $inc: { sessionVersion: 1 } },
                    { new: true }
                );
            } catch (error) {
                if (error.name === 'CastError') return null;
                throw error;
            }
        }

        const users = await store.read();
        const index = users.findIndex(
            u => String(u._id) === String(userId) && u.activeSessionId === sessionId
        );
        if (index === -1) return null;
        users[index] = {
            ...users[index],
            activeSessionId: null,
            sessionVersion: Number(users[index].sessionVersion || 0) + 1,
        };
        await store.write(users);
        return new UserInstance(users[index]);
    },

    async recordFailedLogin(email, { maxAttempts = 10, lockMs = 15 * 60 * 1000 } = {}) {
        if (isMongoReady()) {
            const updated = await MongoUser().findOneAndUpdate(
                { email: String(email).toLowerCase() },
                { $inc: { failedLoginAttempts: 1 } },
                { new: true }
            );
            if (updated && updated.failedLoginAttempts >= maxAttempts) {
                await MongoUser().updateOne(
                    { _id: updated._id },
                    { $set: { lockUntil: new Date(Date.now() + lockMs) } }
                );
            }
            return updated;
        }

        const users = await store.read();
        const index = users.findIndex(u => u.email === String(email).toLowerCase());
        if (index === -1) return null;
        const attempts = Number(users[index].failedLoginAttempts || 0) + 1;
        users[index] = {
            ...users[index],
            failedLoginAttempts: attempts,
            lockUntil: attempts >= maxAttempts ? new Date(Date.now() + lockMs).toISOString() : users[index].lockUntil || null,
        };
        await store.write(users);
        return new UserInstance(users[index]);
    },

    /**
     * Award loyalty points atomically. The aggregation-pipeline update avoids a
     * read-modify-write race when thousands of orders complete together.
     */
    async addKamiKoins(userId, earned) {
        const points = Math.max(0, Math.floor(Number(earned) || 0));
        if (points <= 0) return null;

        if (isMongoReady()) {
            try {
                return await MongoUser().findOneAndUpdate(
                    { _id: userId },
                    [
                        { $set: { kamiKoins: { $add: [{ $ifNull: ['$kamiKoins', 0] }, points] } } },
                        {
                            $set: {
                                tier: {
                                    $switch: {
                                        branches: [
                                            { case: { $gt: ['$kamiKoins', 1000] }, then: 'Kage' },
                                            { case: { $gt: ['$kamiKoins', 500] }, then: 'Jonin' },
                                            { case: { $gt: ['$kamiKoins', 200] }, then: 'Chunin' },
                                        ],
                                        default: 'Genin',
                                    },
                                },
                            },
                        },
                    ],
                    { new: true }
                ).select('kamiKoins tier');
            } catch (error) {
                if (error.name === 'CastError') return null;
                throw error;
            }
        }

        const users = await store.read();
        const index = users.findIndex(u => String(u._id) === String(userId));
        if (index === -1) return null;
        const total = (Number(users[index].kamiKoins) || 0) + points;
        users[index] = {
            ...users[index],
            kamiKoins: total,
            tier: total > 1000 ? 'Kage' : total > 500 ? 'Jonin' : total > 200 ? 'Chunin' : 'Genin',
        };
        await store.write(users);
        return new UserInstance(users[index]);
    },

    async ensureIndexes() {
        if (!isMongoReady()) return false;
        await MongoUser().createIndexes();
        return true;
    },
};

module.exports = User;
