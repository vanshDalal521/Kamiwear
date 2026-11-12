const fs = require('fs').promises;
const fsSync = require('fs');
const os = require('os');
const path = require('path');

/**
 * Tiny JSON-file store with an in-memory fallback.
 *
 * - Local development: persists to data/*.json
 * - Serverless / read-only filesystem: falls back to a writable temp directory
 *   (e.g. /tmp on Vercel) and finally to memory. Temp data survives while the
 *   same function instance is warm; configure MONGO_URI for durable storage.
 */
function createJsonStore(fileName) {
    const configuredDir = String(process.env.KAMIWEAR_DATA_DIR || '').trim();
    const primaryDir = configuredDir || path.join(__dirname, '../data');
    const fallbackDir = path.join(os.tmpdir(), 'kamiwear-data');

    let filePath = path.join(primaryDir, fileName);
    let memory = [];
    let persistent = false;

    function prepare(dir) {
        try {
            if (!fsSync.existsSync(dir)) fsSync.mkdirSync(dir, { recursive: true });
            const file = path.join(dir, fileName);
            if (!fsSync.existsSync(file)) fsSync.writeFileSync(file, '[]');
            fsSync.accessSync(file, fsSync.constants.W_OK);
            return file;
        } catch (error) {
            return null;
        }
    }

    const primaryFile = prepare(primaryDir);
    if (primaryFile) {
        filePath = primaryFile;
        persistent = true;
    } else {
        const fallbackFile = prepare(fallbackDir);
        if (fallbackFile) {
            filePath = fallbackFile;
            persistent = true;
            console.warn(`[Kamiwear Storage] ${fileName}: using temporary storage (${fallbackDir}).`);
        } else {
            persistent = false;
            memory = [];
            console.warn(`[Kamiwear Storage] ${fileName}: filesystem not writable, using memory.`);
        }
    }

    async function read() {
        if (!persistent) return memory;
        try {
            const raw = await fs.readFile(filePath, 'utf-8');
            const parsed = JSON.parse(raw || '[]');
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            if (error.code !== 'ENOENT') console.error(`[Kamiwear Storage] Read ${fileName}:`, error.message);
            memory = memory || [];
            return memory;
        }
    }

    async function write(records) {
        if (!persistent) {
            memory = records;
            return records;
        }
        try {
            await fs.writeFile(filePath, JSON.stringify(records, null, 2));
        } catch (error) {
            console.error(`[Kamiwear Storage] Write ${fileName}:`, error.message);
            persistent = false;
            memory = records;
        }
        return records;
    }

    return { read, write };
}

module.exports = { createJsonStore };
