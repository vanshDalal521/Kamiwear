const SESSION_COOKIE = 'kw_session';
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const MIN_SECRET_LENGTH = 32;
const DEV_SECRET = 'kamiwear_local_development_secret_change_me_2026';

function isProduction() {
    return process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
}

/**
 * The JWT secret must be a real secret in production. Falling back to a
 * hard-coded value would let anyone forge a session cookie, so we fail closed
 * instead of silently using the old `kamiwear_secret_key` default.
 */
function getJwtSecret() {
    const secret = String(process.env.JWT_SECRET || '').trim();

    if (secret.length >= MIN_SECRET_LENGTH) return secret;

    if (isProduction()) {
        throw new Error(
            `JWT_SECRET must be set to a random value of at least ${MIN_SECRET_LENGTH} characters. ` +
            'Generate one with: openssl rand -hex 32'
        );
    }

    if (!secret) {
        console.warn(
            '[Kamiwear Security] JWT_SECRET is not set — using a development-only secret. ' +
            'Set JWT_SECRET before deploying.'
        );
        return DEV_SECRET;
    }

    console.warn(
        `[Kamiwear Security] JWT_SECRET is shorter than ${MIN_SECRET_LENGTH} characters. ` +
        'Use a stronger secret before deploying.'
    );
    return secret;
}

function sessionCookieOptions() {
    return {
        httpOnly: true,
        secure: isProduction(),
        sameSite: 'lax',
        path: '/',
        maxAge: SESSION_MAX_AGE_MS,
    };
}

function clearSessionCookieOptions() {
    return {
        httpOnly: true,
        secure: isProduction(),
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
    };
}

function getAllowedOrigins() {
    const configured = String(process.env.ALLOWED_ORIGINS || '')
        .split(',')
        .map(value => value.trim().replace(/\/$/, ''))
        .filter(Boolean);

    const defaults = [
        'https://kamiwear.vercel.app',
        'https://kamiwear-j2b9.vercel.app',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5500',
        'http://127.0.0.1:5500',
    ];

    const storeUrl = String(process.env.STORE_URL || '').trim().replace(/\/$/, '');
    if (storeUrl) defaults.push(storeUrl);

    return Array.from(new Set([...defaults, ...configured]));
}

function isAllowedOrigin(origin, requestHost = '') {
    if (!origin) return true;

    let parsed;
    try {
        parsed = new URL(origin);
    } catch (error) {
        return false;
    }

    // Same-origin requests are always allowed (the request host is the site
    // itself). This also covers Vercel preview URLs without hard-coding them.
    if (requestHost && parsed.host.toLowerCase() === String(requestHost).toLowerCase()) {
        return true;
    }

    return getAllowedOrigins().includes(parsed.origin);
}

function getAdminKey() {
    const key = String(process.env.ADMIN_API_KEY || '').trim();
    return key.length >= 16 ? key : '';
}

module.exports = {
    SESSION_COOKIE,
    SESSION_MAX_AGE_MS,
    DEV_SECRET,
    isProduction,
    getJwtSecret,
    sessionCookieOptions,
    clearSessionCookieOptions,
    getAllowedOrigins,
    isAllowedOrigin,
    getAdminKey,
};
