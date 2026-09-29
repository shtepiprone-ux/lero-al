// Minimal static file server for `storybook-static`, no external deps (Task 891 rev5 — no
// http-server/serve package is a project dependency). Usage: node serve-static.mjs <dir> <port>
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'

const dir = path.resolve(process.argv[2] || 'storybook-static')
const port = Number(process.argv[3] || 6323)

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8',
}

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0])
  if (urlPath === '/') urlPath = '/index.html'
  let filePath = path.join(dir, urlPath)
  if (!filePath.startsWith(dir)) {
    res.writeHead(403)
    res.end()
    return
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404)
      res.end('not found')
      return
    }
    const ext = path.extname(filePath)
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' })
    res.end(data)
  })
})

server.listen(port, '127.0.0.1', () => {
  console.log(`serving ${dir} on http://127.0.0.1:${port}`)
})
