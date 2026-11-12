const { isAllowedOrigin } = require('../config/security');

/**
 * Cookie-authenticated APIs need CSRF protection. Browsers send an Origin
 * header on cross-site POST/PUT/PATCH/DELETE requests; reject any origin that
 * is not this site or an explicitly allowed domain. Requests without an Origin
 * (curl, server-to-server, same-origin GET) are allowed through the normal auth
 * middleware.
 */
module.exports = function originGuard(req, res, next) {
    const method = String(req.method || 'GET').toUpperCase();
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) return next();

    const origin = req.get('origin');
    if (!origin) return next();

    const forwardedHost = String(req.get('x-forwarded-host') || '').split(',')[0].trim();
    const requestHost = forwardedHost || req.get('host') || '';

    if (!isAllowedOrigin(origin, requestHost)) {
        return res.status(403).json({
            error: 'Request origin is not allowed.',
            code: 'ORIGIN_NOT_ALLOWED',
        });
    }

    next();
};
