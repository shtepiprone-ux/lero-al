// Task 859 review 12 (Opus) - GR-7 live check: how wide is a select / text input / radio-card set on the form pages
// of the four references, against the card that holds it? Answers whether a block form control in a showcase sits at
// its content width or at the width of its container. 1440 x 900, DPR 1.
// Output: r12-form-width.json + r12-form-width-<n>-<ref>.png + summary on stdout.
import { createRequire } from 'node:module'
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const DIR = dirname(fileURLToPath(import.meta.url))
const PAGES = [
  ['tailadmin', 'https://demo.tailadmin.com/form-elements'],
  ['tailadmin', 'https://demo.tailadmin.com/form-layout'],
  ['lahomes', 'https://techzaa.in/lahomes/admin/forms-basic.html'],
  ['lahomes', 'https://techzaa.in/lahomes/admin/forms-choices.html'],
  ['lahomes', 'https://techzaa.in/lahomes/admin/forms-checkbox-radio.html'],
  ['kamr', 'https://kamr-vite.vercel.app/form-element'],
  ['omah', 'https://omah.dexignzone.com/xhtml/form-element.html'],
]
const probe = () => {
  const vis = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' }
  const card = el => el.closest('.card-body, .card, [class*="rounded-2xl"], [class*="rounded-xl"], section, form') ?? document.body
  const out = []
  const ctls = [...document.querySelectorAll('select, input[type="text"], input[type="email"], input:not([type]), .choices, [role="combobox"]')].filter(vis)
  for (const el of ctls.slice(0, 40)) {
    const c = card(el); const cs = getComputedStyle(c)
    const inner = c.getBoundingClientRect().width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
    const w = el.getBoundingClientRect().width
    out.push({ tag: el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(/\s+/).slice(0, 2).join('.') : ''), w: Math.round(w), container: Math.round(inner), pct: Math.round(100 * w / inner) })
  }
  return { title: document.title, url: location.href, controls: out }
}
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
const page = await ctx.newPage()
page.on('dialog', d => d.dismiss().catch(() => null))
let kamr = false
const res = []
let i = 0
for (const [ref, url] of PAGES) {
  if (ref === 'kamr' && !kamr) {
    kamr = true
    await page.goto('https://kamr-vite.vercel.app/dashboard', { waitUntil: 'load', timeout: 30000 }).catch(() => null)
    await page.waitForTimeout(2000)
    if ((await page.locator('input[type="password"]').count()) > 0) {
      await page.locator('input[type="email"]').first().fill('demo@example.com').catch(() => null)
      await page.locator('input[type="password"]').first().fill('123456').catch(() => null)
      await page.locator('button[type=submit]').first().click().catch(() => null)
      await page.waitForURL(u => !/login/.test(String(u)), { timeout: 20000 }).catch(() => null)
    }
  }
  const resp = await page.goto(url, { waitUntil: 'load', timeout: 30000 }).catch(e => ({ status: () => String(e).slice(0, 80) }))
  await page.waitForTimeout(2500)
  const r = await page.evaluate(probe).catch(e => ({ error: String(e) }))
  const shot = `r12-form-width-${String(i++).padStart(2, '0')}-${ref}.png`
  await page.screenshot({ path: join(DIR, shot) }).catch(() => null)
  res.push({ ref, url, status: resp?.status?.(), shot, ...r })
}
await browser.close()
writeFileSync(join(DIR, 'r12-form-width.json'), JSON.stringify({ platform: process.platform, node: process.version, at: new Date().toISOString(), res }, null, 1))
for (const r of res) {
  const c = r.controls ?? []
  const full = c.filter(x => x.pct >= 95).length
  console.log(`${r.ref} ${r.url} status ${r.status} final ${r.url === r.url ? '' : ''}${(r.title ?? '').slice(0, 40)} | controls ${c.length}, >=95% of container ${full}, under 60% ${c.filter(x => x.pct < 60).length}`)
}
