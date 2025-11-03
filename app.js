const next = require('next');
const http = require('http');
const { parse } = require('url');

// Load environment variables
require('dotenv').config({ path: '.env.production' });

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = process.env.PORT || 3000; // Passenger will provide this
const HOST = process.env.HOST || '0.0.0.0';

app.prepare().then(() => {
  http.createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(PORT, HOST, (err) => {
    if (err) throw err;
    console.log(`CSO Self-Assessment Tool running on http://${HOST}:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
