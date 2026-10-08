// Task 859 review 8 (Opus) — reproduce the owner's O78-13 return on Patterns/Mantine/AdminUsersTable:
// Default: click the shield (verify) icon, open the role and status filters, type in search; LocationFilter: render.
// Records page errors, console errors, what changed, and screenshots. sq, 1440.
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
}).listen(6177)
const browser = await chromium.launch()
const out = {}
async function open(id) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
  const page = await ctx.newPage()
  const log = []
  page.on('pageerror', e => log.push('pageerror: ' + String(e.message).slice(0, 300)))
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') log.push(m.type() + ': ' + m.text().slice(0, 300)) })
  await page.goto(`http://127.0.0.1:6177/iframe.html?id=${id}&globals=locale:sq&viewMode=story`)
  await page.waitForSelector('table, [data-testid]', { timeout: 20000 }).catch(() => null)
  await page.waitForTimeout(1500)
  return { ctx, page, log }
}
const rows = page => page.evaluate(() => document.querySelectorAll('tbody tr').length)
const bodyText = page => page.evaluate(() => document.querySelector('#storybook-root')?.innerText.slice(0, 400))

{ // Default: shield
  const { ctx, page, log } = await open('patterns-mantine-adminuserstable--default')
  await page.screenshot({ path: path.join(DIR, 'r8-users-default-0.png') })
  const before = await rows(page)
  const btn = page.locator('[data-testid="verify-btn"]:visible, [data-testid="revoke-btn"]:visible').first()
  const had = await btn.count()
  if (had) { await btn.click(); await page.waitForTimeout(2500) }
  await page.screenshot({ path: path.join(DIR, 'r8-users-default-1-shield.png') })
  out.shield = { verifyButtons: had, rowsBefore: before, rowsAfter: await rows(page), text: await bodyText(page), log: [...log] }
  await ctx.close()
}
{ // Default: filters + search
  const { ctx, page, log } = await open('patterns-mantine-adminuserstable--default')
  const inputs = await page.locator('#storybook-root input:not([type=hidden]):not([type=checkbox])').evaluateAll(els => els.map(e => ({ ph: e.placeholder, ro: e.readOnly, type: e.type, aria: e.getAttribute('aria-haspopup') })))
  const rowsBefore = await rows(page)
  const search = page.locator('#storybook-root input[placeholder]:visible').first()
  await search.fill('zzz-no-such-user'); await page.waitForTimeout(1500)
  const rowsAfterSearch = await rows(page)
  const selects = page.locator('#storybook-root input[aria-haspopup="listbox"]:visible, #storybook-root input[readonly]:visible')
  const nSel = await selects.count()
  let options = null, afterPick = null
  if (nSel) {
    await selects.first().click(); await page.waitForTimeout(800)
    options = await page.locator('[role=option]').allInnerTexts()
    if (options.length > 1) { await page.locator('[role=option]').nth(1).click(); await page.waitForTimeout(1500) }
    afterPick = { value: await selects.first().inputValue(), rows: await rows(page) }
  }
  await page.screenshot({ path: path.join(DIR, 'r8-users-default-2-filters.png') })
  out.filters = { inputs, rowsBefore, rowsAfterSearch, selects: nSel, options, afterPick, log: [...log] }
  await ctx.close()
}
{ // LocationFilter
  const { ctx, page, log } = await open('patterns-mantine-adminuserstable--location-filter')
  await page.screenshot({ path: path.join(DIR, 'r8-users-locationfilter.png'), fullPage: true })
  out.locationFilter = { rows: await rows(page), text: await bodyText(page), log: [...log] }
  await ctx.close()
}
await browser.close(); server.close()
fs.writeFileSync(path.join(DIR, 'r8-users-story.json'), JSON.stringify({ platform: process.platform, node: process.version, out }, null, 1))
console.log(JSON.stringify(out, null, 1).slice(0, 6000))
