// GR-7 research for Task 912 Revision 4 (review 4): how the three references colour a price.
// Step 1: enumerate each reference's sidebar links. Step 2: open every page whose URL or text suggests prices,
// and record every leaf element whose text looks like a price: text, color, font-size, font-weight,
// text-decoration-line. Screenshots of the pages with prices go next to this file.
import fs from 'node:fs'
import { chromium } from 'playwright'

const dir = 'docs/sessions/evidence/task912/research'
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 })
const page = await ctx.newPage()
const result = {}

async function links(url, sel) {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {})
  await page.waitForTimeout(1500)
  return page.evaluate((sel) => [...new Set(Array.from(document.querySelectorAll(sel)).map((a) => a.href).filter((h) => h && !h.endsWith('#') && !h.startsWith('javascript')))], sel)
}

async function prices(url, shot) {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {})
  await page.waitForTimeout(1500)
  const rows = await page.evaluate(() => {
    const re = /^[\s]*([$€£₴]\s?\d[\d,.\s]*|\d[\d,.\s]*\s?([$€£₴]|USD|EUR|ALL))(\s*\/\s*\w+)?\s*$/
    const out = []
    for (const el of document.querySelectorAll('body *')) {
      if (el.children.length) continue
      const t = (el.textContent || '').trim()
      if (!re.test(t)) continue
      const cs = getComputedStyle(el)
      const b = el.getBoundingClientRect()
      if (!b.width) continue
      out.push({ t, color: cs.color, fs: cs.fontSize, fw: cs.fontWeight, td: cs.textDecorationLine })
    }
    return out
  })
  if (rows.length && shot) await page.screenshot({ path: `${dir}/${shot}.png`, fullPage: false }).catch(() => {})
  return rows
}

// TailAdmin
const ta = await links('https://demo.tailadmin.com/', 'aside a')
result.tailadmin = { pages: ta, prices: {} }
for (const u of ta) {
  const r = await prices(u, null)
  if (r.length) result.tailadmin.prices[u] = r
}
// Lahomes
const lh = await links('https://techzaa.in/lahomes/admin/', '#leftside-menu-container a, .app-sidebar a, .main-nav a, aside a, nav a')
result.lahomes = { pages: lh, prices: {} }
for (const u of lh) {
  const r = await prices(u, null)
  if (r.length) result.lahomes.prices[u] = r
}
// Kamr (login form is prefilled)
await page.goto('https://kamr-vite.vercel.app/dashboard', { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {})
await page.waitForTimeout(1500)
const btn = page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Login"), button:has-text("Log in")').first()
if (await btn.count()) { await btn.click().catch(() => {}); await page.waitForTimeout(3000) }
const km = await page.evaluate(() => [...new Set(Array.from(document.querySelectorAll('aside a, nav a')).map((a) => a.href).filter((h) => h && !h.endsWith('#')))])
result.kamr = { pages: km, prices: {} }
for (const u of km) {
  const r = await prices(u, null)
  if (r.length) result.kamr.prices[u] = r
}
await browser.close()
fs.writeFileSync(`${dir}/rv4-price-colour-research.json`, JSON.stringify(result, null, 2))
for (const [ref, v] of Object.entries(result)) {
  console.log(`${ref}: ${v.pages.length} pages, ${Object.keys(v.prices).length} with prices`)
  for (const [u, rows] of Object.entries(v.prices)) {
    const sig = {}
    for (const r of rows) { const k = `${r.color} ${r.fs} ${r.fw} ${r.td}`; (sig[k] ||= []).push(r.t) }
    console.log('  ' + u)
    for (const [k, ts] of Object.entries(sig)) console.log(`     ${k}  e.g. ${ts.slice(0, 3).join(' | ')} (${ts.length})`)
  }
}
