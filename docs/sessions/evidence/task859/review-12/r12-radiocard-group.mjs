// Review 11 (Opus) - Task 859 Revision 9, AC54 + GR-12 "a set of choice cards": every Story of storybook-static, en, DPR 1,
// at 1440 and 390. For every `.mantine-RadioCard-card`: the executor's look key (border, radius, padding, indicator, label
// size/weight) PLUS the group geometry the executor's census did not measure: the vertical gap to the next card of the same
// `Radio.Group`, and the card width as a share of the width available to its group (the group root's parent content box).
// `Mantine/Primitives/Modal` `Detail` opens its dialog by pressing its trigger first.
// usage: node r12-radiocard-group.mjs        Output: r12-radiocard-group.json
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
}).listen(6311)
const index = JSON.parse(fs.readFileSync(path.join(ROOT, 'index.json'), 'utf8'))
const ids = Object.values(index.entries).filter(e => e.type === 'story').map(e => e.id)

const probe = () => {
  const groups = [...document.querySelectorAll('[role="radiogroup"]')].filter(g => g.querySelector('.mantine-RadioCard-card'))
  return groups.map(g => {
    const cards = [...g.querySelectorAll('.mantine-RadioCard-card')]
    const parent = g.parentElement
    const ps = getComputedStyle(parent)
    const avail = parent.getBoundingClientRect().width - parseFloat(ps.paddingLeft) - parseFloat(ps.paddingRight)
    const rects = cards.map(c => c.getBoundingClientRect())
    const gaps = rects.slice(1).map((r, i) => Math.round(r.top - rects[i].bottom))
    const looks = cards.map(c => {
      const s = getComputedStyle(c); const ind = c.querySelector('.mantine-RadioIndicator-indicator'); const label = [...c.querySelectorAll('span')].find(x => x.textContent.trim())
      const ls = label ? getComputedStyle(label) : null; const ir = ind?.getBoundingClientRect()
      return [`${s.borderTopWidth} ${s.borderTopStyle}`, s.borderTopLeftRadius, `${s.paddingTop}/${s.paddingLeft}`, ir ? `${Math.round(ir.width)}x${Math.round(ir.height)}` : 'none', ls?.fontSize, ls?.fontWeight].join(' | ')
    })
    return {
      first: cards[0].textContent.trim().slice(0, 24),
      cards: cards.length,
      gaps: [...new Set(gaps)],
      widthShare: [...new Set(rects.map(r => Math.round((r.width / avail) * 100)))],
      looks: [...new Set(looks)],
    }
  })
}

const browser = await chromium.launch()
const raw = []
const jobs = ids.flatMap(id => [1440, 390].map(w => ({ id, w })))
let next = 0
async function worker() {
  while (next < jobs.length) {
    const { id, w } = jobs[next++]
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 })
    const page = await ctx.newPage(); const errors = []
    page.on('pageerror', e => errors.push(String(e.message).slice(0, 160)))
    try {
      await page.goto(`http://127.0.0.1:6311/iframe.html?id=${id}&globals=locale:en&viewMode=story`, { timeout: 30000 })
      await page.waitForSelector('#storybook-root > *, #error-message', { state: 'attached', timeout: 15000 }).catch(() => null)
      await page.waitForTimeout(700)
      if (id === 'mantine-primitives-modal--detail') {
        await page.locator('#storybook-root button').first().click()
        await page.waitForTimeout(900)
      }
      const groups = await page.evaluate(probe)
      if (groups.length) raw.push({ id, w, groups, errors })
    } catch (e) { raw.push({ id, w, error: String(e.message).slice(0, 120) }) }
    await ctx.close()
  }
}
await Promise.all([worker(), worker(), worker(), worker()])
await browser.close(); server.close()

const byGap = {}; const byWidth = {}; const byLook = {}
for (const r of raw) for (const g of r.groups ?? []) {
  for (const x of g.gaps) (byGap[`${x}px`] ??= new Set()).add(`${r.id}@${r.w}`)
  for (const x of g.widthShare) (byWidth[`${x}%`] ??= new Set()).add(`${r.id}@${r.w}`)
  for (const x of g.looks) (byLook[x] ??= new Set()).add(`${r.id}@${r.w}`)
}
const flat = o => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, [...v].sort()]))
const out = { platform: process.platform, node: process.version, stories: ids.length, jobs: jobs.length, gapBetweenCards: flat(byGap), cardWidthShareOfGroupContainer: flat(byWidth), cardLook: flat(byLook), raw }
fs.writeFileSync(path.join(DIR, 'r12-radiocard-group.json'), JSON.stringify(out, null, 1))
console.log('stories', ids.length, 'jobs', jobs.length, 'jobs with a Radio.Card group', raw.filter(r => r.groups).length, 'errors', raw.filter(r => r.error || r.errors?.length).length)
for (const [name, o] of [['gap between cards', out.gapBetweenCards], ['card width / group container', out.cardWidthShareOfGroupContainer], ['card look', out.cardLook]]) {
  console.log(`${name}: ${Object.keys(o).length} value(s)`)
  for (const [k, v] of Object.entries(o)) console.log(`  ${k} -> ${v.length}: ${v.join(', ')}`)
}
for (const r of raw.filter(r => r.error || r.errors?.length)) console.log('ERR', r.id, r.w, r.error ?? r.errors.join(';'))
