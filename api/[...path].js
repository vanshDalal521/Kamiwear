// Vercel serverless entry point.
//
// The site is deployed as a static frontend (public/) plus this catch-all
// function. Requests to /api/* are routed here and handled by the Express app
// in server.js. Keeping the function at the project root also makes the setup
// work when the Vercel project is configured as a static site rather than an
// Express app.
const app = require('../server');

module.exports = app;
