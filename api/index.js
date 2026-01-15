// Vercel Serverless Function entrypoint
// Proxy all requests to the Express app in back/app.js

const app = require('../back/app');

module.exports = (req, res) => app(req, res);
