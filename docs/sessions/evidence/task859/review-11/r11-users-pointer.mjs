// Review 9 (Opus). The owner returned AdminUsersTable because "Фільтри не клікабельні взагалі. Пошук не працює" and the
// shield broke the Story. r7/r9-users-story.mjs operates the segments through `el.click()` in page JS, which bypasses
// hit-testing. This probe uses only real pointer/keyboard input (Playwright locator.click / keyboard.type, which check
// that the element is visible, stable and receives the pointer at its centre) at 1440x900 and 390x844, sq, DPR 1.
import { createRequire } from 'node:module'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const ROOT = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const DIR = path.dirname(fileURLToPath(import.meta.url))
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' }
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]))
  fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] ?? 'application/octet-stream' }); res.end(d) })
}).listen(6214)
const NAMES = ['Arben', 'Oksana', 'Marco', 'Gentiana']
const checks = []
const check = (w, story, name, pass, detail) => checks.push({ w, story, name, pass: !!pass, detail })
const browser = await chromium.launch()

async function open(id, w) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w === 390 ? 844 : 900 }, deviceScaleFactor: 1 })
  const page = await ctx.newPage()
  const errs = []
  page.on('pageerror', e => errs.push(String(e.message).slice(0, 200)))
  page.on('console', m => { if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) errs.push(m.text().slice(0, 200)) })
  await page.goto(`http://127.0.0.1:6214/iframe.html?id=${id}&globals=locale:sq&viewMode=story`)
  await page.waitForSelector('[data-testid="admin-users-table"]', { timeout: 20000 })
  await page.waitForTimeout(2500) // let the export's own play finish
  return { ctx, page, errs }
}
const names = page => page.evaluate(n => { const t = document.querySelector('[data-testid="admin-users-table"]')?.innerText ?? ''; return n.filter(x => t.includes(x)) }, NAMES)
async function seg(page, tid, value) {
  // The visible label of the option, clicked with the pointer.
  const label = page.locator(`[data-testid="${tid}"] input[value="${value}"] + label, [data-testid="${tid}"] label[for]`).filter({ has: page.locator('xpath=.') })
  const id = await page.locator(`[data-testid="${tid}"] input[value="${value}"]`).getAttribute('id')
  await page.locator(`[data-testid="${tid}"] label[for="${id}"]`).click({ timeout: 4000 })
  await page.waitForTimeout(400)
}

for (const w of [1440, 390]) {
  const { ctx, page, errs } = await open('patterns-mantine-adminuserstable--default', w)
  const S = 'Default'
  try {
    check(w, S, 'opens with 4 users', (await names(page)).length === 4, await names(page))
    const before = await page.locator('[data-testid="revoke-btn"]:visible').count()
    await page.locator('[data-testid="verify-btn"]:visible').first().click({ timeout: 4000 })
    await page.waitForTimeout(400)
    check(w, S, 'pointer: shield verifies', (await page.locator('[data-testid="revoke-btn"]:visible').count()) === before + 1, { before })
    await page.locator('[data-testid="users-search"]').click()
    await page.keyboard.type('Gent', { delay: 30 })
    await page.waitForTimeout(500)
    check(w, S, 'keyboard: search "Gent" narrows to Gentiana', JSON.stringify(await names(page)) === '["Gentiana"]', await names(page))
    await page.locator('[data-testid="users-search"]').fill('')
    await page.waitForTimeout(400)
    for (const r of ['user', 'agent', 'moderator', 'admin', '']) {
      await seg(page, 'role-segmented-control', r)
      check(w, S, `pointer: role "${r || 'all'}"`, true, await names(page))
    }
    for (const s of ['active', 'inactive', 'blocked', '']) {
      await seg(page, 'status-segmented-control', s)
      check(w, S, `pointer: status "${s || 'all'}"`, true, await names(page))
    }
    await page.getByRole('tab').nth(1).click({ timeout: 4000 }); await page.waitForTimeout(400)
    check(w, S, 'pointer: verified tab hides the search', (await page.locator('[data-testid="users-search"]').count()) === 0)
    await page.getByRole('tab').nth(0).click({ timeout: 4000 }); await page.waitForTimeout(400)
    check(w, S, 'pointer: all tab restores 4 users', (await names(page)).length === 4, await names(page))
  } catch (e) { check(w, S, 'pointer interaction threw', false, String(e.message).slice(0, 1500)) }
  check(w, S, 'no page/console error', errs.length === 0, errs)
  await page.screenshot({ path: path.join(DIR, `r11-users-pointer-default-${w}.png`), fullPage: true })
  await ctx.close()

  const lf = await open('patterns-mantine-adminuserstable--location-filter', w)
  try {
    check(w, 'LocationFilter', 'shows 1 user', (await names(lf.page)).length === 1, await names(lf.page))
    await lf.page.locator('[data-testid="location-request-filter"] button').click({ timeout: 4000 }); await lf.page.waitForTimeout(400)
    check(w, 'LocationFilter', 'pointer: removing the chip shows 4', (await names(lf.page)).length === 4, await names(lf.page))
  } catch (e) { check(w, 'LocationFilter', 'pointer interaction threw', false, String(e.message).slice(0, 1500)) }
  check(w, 'LocationFilter', 'no page/console error', lf.errs.length === 0, lf.errs)
  await lf.ctx.close()
}
await browser.close(); server.close()
fs.writeFileSync(path.join(DIR, 'r11-users-pointer.json'), JSON.stringify({ platform: process.platform, node: process.version, checks }, null, 1))
console.log('checks', checks.length, 'failed', checks.filter(c => !c.pass).length)
for (const c of checks) console.log(c.pass ? 'ok  ' : 'FAIL', c.w, c.story, c.name, JSON.stringify(c.detail ?? ''))
