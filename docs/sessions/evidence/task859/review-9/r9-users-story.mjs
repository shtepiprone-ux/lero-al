// Task 859 Revision 7 (Sonnet) - AC46. Extended copy of review-8/r8-users-story.mjs: OPERATES every control of
// Patterns/Mantine/AdminUsersTable at 1440 and 390 (sq, DPR 1) in the built Storybook and records what changed.
// Pass: the shield toggles and nothing throws; search narrows the rows; each role and status option changes the rows;
// the tabs switch; LocationFilter shows 1 row and removing its chip shows all; pagination moves; 0 page errors.
// Output: r9-users-story.json + r7-users-<export>-<w>.png.
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
}).listen(6193)
const NAMES = ['Arben', 'Oksana', 'Marco', 'Gentiana']
const browser = await chromium.launch()
const net404 = new Set()
const checks = []
function check(width, story, name, pass, detail) { checks.push({ width, story, name, pass: !!pass, detail }) }

async function open(id, width) {
  const ctx = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 }, deviceScaleFactor: 1 })
  const page = await ctx.newPage()
  const log = []
  page.on('pageerror', e => log.push('pageerror: ' + String(e.message).slice(0, 300)))
  // The static server has no API: the admin shell's presence poll (`/api/presence`) always answers 404 in a built
  // Storybook, in every Story and at HEAD (review-8/r8-users-story.json has it too). It is recorded in `net404`, not
  // counted as a page error; every other console error and every uncaught page error still fails the check.
  page.on('response', r => { if (r.status() === 404) net404.add(new URL(r.url()).pathname) })
  page.on('console', m => { if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) log.push('console.error: ' + m.text().slice(0, 300)) })
  await page.goto(`http://127.0.0.1:6193/iframe.html?id=${id}&globals=locale:sq&viewMode=story`)
  await page.waitForSelector('[data-testid="admin-users-table"]', { timeout: 20000 }).catch(() => null)
  await page.waitForTimeout(1500)
  return { ctx, page, log }
}
const names = page => page.evaluate(n => { const t = document.querySelector('#storybook-root')?.innerText ?? ''; return n.filter(x => t.includes(x)) }, NAMES)
const same = (a, b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort())
const count = (page, tid) => page.locator(`[data-testid="${tid}"]`).count()
async function segment(page, testId, value) {
  await page.locator(`[data-testid="${testId}"] input[value="${value}"]`).evaluate(el => el.labels?.[0]?.click() ?? el.click())
  await page.waitForTimeout(400)
}

for (const width of [1440, 390]) {
  { // Default
    const { ctx, page, log } = await open('patterns-mantine-adminuserstable--default', width)
    const s = 'Default'
    check(width, s, 'all four users shown', same(await names(page), NAMES), await names(page))
    const revokeBefore = await count(page, 'revoke-btn')
    await page.locator('[data-testid="verify-btn"]').first().evaluate(el => el.click())
    await page.waitForTimeout(500)
    check(width, s, 'shield: a verify toggle became a revoke toggle', (await count(page, 'revoke-btn')) > revokeBefore, { before: revokeBefore, after: await count(page, 'revoke-btn') })
    check(width, s, 'shield: no page error', log.length === 0, [...log])
    await page.locator('[data-testid="users-search"]').fill('Marco'); await page.waitForTimeout(500)
    check(width, s, 'search "Marco" narrows to Marco', same(await names(page), ['Marco']), await names(page))
    await page.locator('[data-testid="users-search"]').fill(''); await page.waitForTimeout(500)
    check(width, s, 'clearing search restores all', same(await names(page), NAMES), await names(page))
    const roleExpect = { agent: ['Arben'], user: ['Oksana', 'Gentiana'], moderator: ['Marco'], admin: [], '': NAMES }
    for (const [v, exp] of Object.entries(roleExpect)) { await segment(page, 'role-segmented-control', v); check(width, s, `role "${v || 'all'}"`, same(await names(page), exp), await names(page)) }
    const statusExpect = { active: ['Arben', 'Oksana', 'Marco'], inactive: [], blocked: ['Gentiana'], '': NAMES }
    for (const [v, exp] of Object.entries(statusExpect)) { await segment(page, 'status-segmented-control', v); check(width, s, `status "${v || 'all'}"`, same(await names(page), exp), await names(page)) }
    await page.screenshot({ path: path.join(DIR, `r9-users-default-${width}.png`) })
    check(width, s, '0 page or console errors for the whole story', log.length === 0, [...log])
    await ctx.close()
  }
  { // VerifiedTab via the tabs of Default
    const { ctx, page, log } = await open('patterns-mantine-adminuserstable--default', width)
    const s = 'Default tabs'
    await page.getByRole('tab').nth(1).click(); await page.waitForTimeout(500)
    check(width, s, 'verified tab shows only the verified agent', same(await names(page), ['Arben']), await names(page))
    await page.getByRole('tab').nth(0).click(); await page.waitForTimeout(500)
    check(width, s, 'all tab shows everyone again', same(await names(page), NAMES), await names(page))
    check(width, s, '0 page errors', log.length === 0, [...log])
    await ctx.close()
  }
  { // VerifiedTab export: revoke
    const { ctx, page, log } = await open('patterns-mantine-adminuserstable--verified-tab', width)
    const s = 'VerifiedTab'
    check(width, s, 'agent shown', same(await names(page), ['Arben']), await names(page))
    await page.locator('[data-testid="revoke-btn"]').first().evaluate(el => el.click()); await page.waitForTimeout(500)
    check(width, s, 'revoke removes the agent from the list', same(await names(page), []), await names(page))
    check(width, s, '0 page errors', log.length === 0, [...log])
    await page.screenshot({ path: path.join(DIR, `r9-users-verifiedtab-${width}.png`) })
    await ctx.close()
  }
  { // Empty
    const { ctx, page, log } = await open('patterns-mantine-adminuserstable--empty', width)
    check(width, 'Empty', 'no user shown, 0 page errors', same(await names(page), []) && log.length === 0, { names: await names(page), log })
    await ctx.close()
  }
  { // LocationFilter
    const { ctx, page, log } = await open('patterns-mantine-adminuserstable--location-filter', width)
    const s = 'LocationFilter'
    check(width, s, 'filter on shows exactly 1 row (Oksana)', same(await names(page), ['Oksana']), await names(page))
    await page.screenshot({ path: path.join(DIR, `r9-users-locationfilter-${width}.png`) })
    await page.locator('[data-testid="location-request-filter"] button').click(); await page.waitForTimeout(500)
    check(width, s, 'removing the chip shows all four', same(await names(page), NAMES), await names(page))
    check(width, s, 'the chip is gone', (await count(page, 'location-request-filter')) === 0, null)
    check(width, s, '0 page errors', log.length === 0, [...log])
    await ctx.close()
  }
  { // Paginated
    const { ctx, page, log } = await open('patterns-mantine-adminuserstable--paginated', width)
    const s = 'Paginated'
    const first = await names(page)
    await page.locator('[data-testid="next-page"]').click(); await page.waitForTimeout(500)
    const second = await names(page)
    check(width, s, 'next page shows different users', !same(first, second) && second.length > 0, { first, second })
    await page.locator('[data-testid="prev-page"]').click(); await page.waitForTimeout(500)
    check(width, s, 'prev page returns', same(await names(page), first), await names(page))
    check(width, s, '0 page errors', log.length === 0, [...log])
    await ctx.close()
  }
}
await browser.close(); server.close()
fs.writeFileSync(path.join(DIR, 'r9-users-story.json'), JSON.stringify({ platform: process.platform, node: process.version, net404: [...net404], checks }, null, 1))
console.log('404 paths (static server, not page errors):', [...net404].join(', '))
const failed = checks.filter(c => !c.pass)
console.log('checks', checks.length, 'failed', failed.length)
for (const f of failed) console.log('FAIL', f.width, f.story, f.name, JSON.stringify(f.detail))
