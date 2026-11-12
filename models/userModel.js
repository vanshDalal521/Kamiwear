const mongoose = require('mongoose');
const { isMongoReady } = require('../config/db');
const { createJsonStore } = require('./jsonStore');

const store = createJsonStore('users.json');

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
        password: { type: String, default: null },
        googleId: { type: String, default: null },
        kamiKoins: { type: Number, default: 0 },
        tier: { type: String, default: 'Genin' },
        bio: { type: String, default: '' },
        avatarSeed: { type: String, default: '' },
    },
    { timestamps: true }
);

function MongoUser() {
    return mongoose.models.KamiUser || mongoose.model('KamiUser', userSchema);
}

class UserInstance {
    constructor(data) {
        Object.assign(this, data);
        this._id = data._id || data.id || Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
        this.id = this._id;
    }

    async save() {
        const users = await store.read();
        const index = users.findIndex(u => u._id === this._id || u.email === this.email);
        const serialized = this.toObject();
        if (index > -1) users[index] = serialized;
        else users.push(serialized);
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
        if (isMongoReady()) {
            return MongoUser().find({}).lean();
        }
        return store.read();
    },

    async findOne(query = {}) {
        if (isMongoReady()) {
            return MongoUser().findOne(query);
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
            kamiKoins: userData.kamiKoins || 0,
            tier: userData.tier || 'Genin',
            bio: userData.bio || '',
            avatarSeed: userData.avatarSeed || '',
        };

        if (isMongoReady()) {
            return MongoUser().create(payload);
        }

        const users = await store.read();
        const newUser = new UserInstance({
            ...payload,
            _id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
            createdAt: new Date().toISOString(),
        });
        users.push(newUser.toObject());
        await store.write(users);
        return newUser;
    },
};

module.exports = User;
