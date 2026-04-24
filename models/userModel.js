const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

const USER_FILE = path.join(__dirname, '../data/users.json');

// Ensure data folder and file exist synchronously on startup
if (!fsSync.existsSync(path.join(__dirname, '../data'))) {
    fsSync.mkdirSync(path.join(__dirname, '../data'));
}
if (!fsSync.existsSync(USER_FILE)) {
    fsSync.writeFileSync(USER_FILE, JSON.stringify([]));
}

class UserInstance {
    constructor(data) {
        Object.assign(this, data);
        this._id = data._id || data.id;
    }
    
    async save() {
        const users = JSON.parse(await fs.readFile(USER_FILE, 'utf-8'));
        const index = users.findIndex(u => u._id === this._id || u.email === this.email);
        if (index > -1) {
            users[index] = this.toObject();
        } else {
            users.push(this.toObject());
        }
        await fs.writeFile(USER_FILE, JSON.stringify(users, null, 2));
    }

    toObject() {
        return { ...this };
    }
}

const User = {
    getAll: async () => {
        const data = await fs.readFile(USER_FILE, 'utf-8');
        return JSON.parse(data);
    },

    findOne: async (query) => {
        const users = await User.getAll();
        const user = users.find(u => u.email === query.email);
        return user ? new UserInstance(user) : null;
    },

    create: async (userData) => {
        const users = await User.getAll();
        const newUser = new UserInstance({
            _id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            email: userData.email,
            password: userData.password,
            name: userData.name,
            googleId: userData.googleId,
            kamiKoins: userData.kamiKoins || 0,
            tier: userData.tier || 'Genin',
            createdAt: new Date().toISOString()
        });
        users.push(newUser.toObject());
        await fs.writeFile(USER_FILE, JSON.stringify(users, null, 2));
        return newUser;
    }
};

module.exports = User;
