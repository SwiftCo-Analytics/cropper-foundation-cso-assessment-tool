const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const path = require('path')

// Load environment variables from .env.production
require('dotenv').config({ path: '.env.production' })

const dev = false // Always false for production
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  })
  
  const port = process.env.PORT || 3003
  server.listen(port, (err) => {
    if (err) throw err
    console.log(`CSO Self-Assessment Tool running on port ${port}`)
  })
}).catch((ex) => {
  console.error('Failed to start application:', ex)
  process.exit(1)
})
