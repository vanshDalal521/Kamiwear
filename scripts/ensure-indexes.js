#!/usr/bin/env node
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { connectDB, getDbStatus } = require('../config/db');
const { ensureIndexes } = require('../config/indexes');

(async () => {
    await connectDB();
    const status = getDbStatus();
    if (!status.connected) {
        console.error('MongoDB is not connected. Set MONGO_URI first.', status.error || '');
        process.exit(1);
    }
    const ok = await ensureIndexes();
    console.log(ok ? 'Indexes created successfully.' : 'Index creation did not complete.');
    process.exit(ok ? 0 : 1);
})();
