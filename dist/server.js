"use strict";
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const path = require('path');
// Custom require to handle TypeScript files
const requireModule = (modulePath) => {
    try {
        // First try to require the module directly (for JS files)
        return require(modulePath);
    }
    catch (error) {
        if (error.code === 'MODULE_NOT_FOUND') {
            // If not found, try with .js extension
            return require(`${modulePath}.js`);
        }
        throw error;
    }
};
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
app.prepare().then(() => {
    const server = createServer((req, res) => {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
    });
    const port = process.env.PORT || 3000;
    server.listen(port, (err) => {
        if (err)
            throw err;
    });
});
