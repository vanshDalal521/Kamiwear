const MAX_DEPTH = 8;
const MAX_ITEMS = 200;
const MAX_STRING = 5000;

/**
 * Recursively strip MongoDB operators ($, .) and control characters from
 * request data. This blocks NoSQL injection payloads such as
 * `{ "email": { "$gt": "" } }` before they reach Mongoose.
 */
function sanitizeValue(value, depth = 0) {
    if (depth > MAX_DEPTH) return undefined;

    if (Array.isArray(value)) {
        return value.slice(0, MAX_ITEMS).map(item => sanitizeValue(item, depth + 1));
    }

    if (value && typeof value === 'object') {
        const clean = {};
        for (const [key, item] of Object.entries(value)) {
            if (!key || key.startsWith('$') || key.includes('.') || key === '__proto__' || key === 'constructor' || key === 'prototype') {
                continue;
            }
            const safe = sanitizeValue(item, depth + 1);
            if (safe !== undefined) clean[key] = safe;
        }
        return clean;
    }

    if (typeof value === 'string') {
        return value
            .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
            .slice(0, MAX_STRING);
    }

    return value;
}

module.exports = function sanitizeRequest(req, res, next) {
    if (req.body && typeof req.body === 'object') {
        req.body = sanitizeValue(req.body);
    }
    next();
};

module.exports.sanitizeValue = sanitizeValue;
