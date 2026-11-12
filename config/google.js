/**
 * Google OAuth configuration.
 *
 * A client ID is a public identifier (it is sent to every browser that renders
 * the Google button), so it is safe to expose. Set GOOGLE_CLIENT_ID in your
 * hosting environment to enable Google sign-in. When it is not configured the
 * UI shows a short placeholder instead of a broken Google button.
 *
 * The deployed domain must also be listed under "Authorized JavaScript
 * origins" for the client ID in Google Cloud Console.
 */
function getGoogleClientId() {
    const clientId = String(process.env.GOOGLE_CLIENT_ID || '').trim();
    // This fallback ID was committed in older builds but Google rejects it with
    // "The given client ID is not found". Treat it as unconfigured so the UI
    // shows a placeholder instead of a broken sign-in button.
    const retiredIds = new Set([
        '374187214734-d13v68n82a944hbln4k2o3264g9sq57v.apps.googleusercontent.com',
    ]);
    return retiredIds.has(clientId) ? '' : clientId;
}

module.exports = { getGoogleClientId };
