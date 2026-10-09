// Review 11 (Opus) - Task 859 Revision 9: does every `play` of the Stories that render a badge or a Radio.Card option
// finish without an exception on the final storybook-static? Storybook 9 reports a failed play on its channel
// (`storyErrored` / `playFunctionThrewException`) and, with `throwPlayFunctionExceptions`, rethrows it; this probe
// listens to the iframe's channel and its page/console errors. Stories: every Story whose source has `play:` among the
// Stories Revision 9 changed or whose component Revision 9 changed (badge consumers, dialog options).
// usage: node r12-play-check.mjs     Output: r12-play-check.json
import { createRequire } from 'node:module'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const ROOT = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const DIR = path.dirname(fileURLToPath(import.meta.url))
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' }
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]))
  fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] ?? 'application/octet-stream' }); res.end(d) })
}).listen(6315)
const index = JSON.parse(fs.readFileSync(path.join(ROOT, 'index.json'), 'utf8'))
const PREFIXES = ['patterns-mantine-dashboardheader--', 'patterns-mantine-dashboardcard--', 'patterns-mantine-dashboardworklist--', 'patterns-mantine-dashboardstatrows--',
  'mantine-primitives-badge--', 'mantine-primitives-radiocardoption--', 'mantine-primitives-radio--', 'mantine-primitives-modal--',
  'patterns-mantine-ticketdetaildialogview--', 'patterns-mantine-premiumdialogview--', 'patterns-mantine-listingcardpattern--',
  'patterns-mantine-listinggallerypattern--', 'patterns-mantine-adminpermissionsview--', 'patterns-mantine-admintable--', 'patterns-mantine-adminsurfacepattern--']
const ids = Object.values(index.entries).filter(e => e.type === 'story' && PREFIXES.some(p => e.id.startsWith(p))).map(e => e.id)
const browser = await chromium.launch()
const out = []
for (const id of ids) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
  const page = await ctx.newPage(); const errors = []
  page.on('pageerror', e => errors.push('pageerror: ' + String(e.message).slice(0, 200)))
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 200)) })
  await page.goto(`http://127.0.0.1:6315/iframe.html?id=${id}&globals=locale:en&viewMode=story`, { timeout: 30000 })
  await page.waitForSelector('#storybook-root > *, #error-message', { state: 'attached', timeout: 15000 }).catch(() => null)
  await page.waitForTimeout(2500)
  const status = await page.evaluate(() => {
    const err = document.querySelector('.sb-show-errordisplay, #error-message')
    const shown = document.body.classList.contains('sb-show-errordisplay')
    return { errorDisplay: shown, errorText: shown ? (document.querySelector('#error-message')?.textContent ?? '').slice(0, 200) : '' }
  })
  out.push({ id, ...status, errors })
  await ctx.close()
}
await browser.close(); server.close()
fs.writeFileSync(path.join(DIR, 'r12-play-check.json'), JSON.stringify({ platform: process.platform, node: process.version, stories: ids.length, out }, null, 1))
const bad = out.filter(r => r.errorDisplay || r.errors.length)
console.log('stories', ids.length, 'with an error', bad.length)
for (const r of bad) console.log('ERR', r.id, r.errorDisplay ? `[error display] ${r.errorText}` : '', r.errors.join(' | '))
