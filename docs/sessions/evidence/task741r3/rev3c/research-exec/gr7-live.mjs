// Task 741 R3c GR-7 live check (execution). Usage: node gr7-live.mjs
import { createRequire } from 'node:module'
import { writeFile } from 'node:fs/promises'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const out = 'C:/Claude_Code_Projects/lero-al/docs/sessions/evidence/task741r3/rev3c/research-exec'
const pages = [
  ['lahomes-property-grid', 'https://techzaa.in/lahomes/admin/property-grid.html'],
  ['lahomes-ui-badge', 'https://techzaa.in/lahomes/admin/ui-badge.html'],
  ['kamr-ui-badge', 'https://kamr-vite.vercel.app/ui-badge', true],
  ['omah-property-list', 'https://omah.dexignzone.com/xhtml/property-list.html'],
  ['tailadmin-badge', 'https://demo.tailadmin.com/badge'],
]
const browser = await chromium.launch()
const res = {}
for (const [id, url, login] of pages) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 })
    if (login || page.url().includes('login') || page.url().includes('signin')) {
      const u = page.locator('input[type=text],input[name=username],input[type=email]').first()
      if (await u.count()) { await u.fill('admin'); await page.locator('input[type=password]').first().fill('123456'); await page.keyboard.press('Enter'); await page.waitForTimeout(2500); await page.goto(url, { waitUntil: 'networkidle' }) }
    }
    await page.waitForTimeout(1500)
    await page.screenshot({ path: `${out}/${id}-1440.png`, fullPage: true })
    res[id] = await page.evaluate(() => {
      const els = [...document.querySelectorAll('[class*=badge],[class*=Badge],[class*=label],[class*=tag]')].filter(e => e.children.length === 0 && e.textContent.trim() && e.getBoundingClientRect().width > 0).slice(0, 14)
      return { url: location.href, title: document.title, n: els.length, badges: els.map(e => { const s = getComputedStyle(e); return { text: e.textContent.trim().slice(0, 24), fs: s.fontSize, fw: s.fontWeight, radius: s.borderTopLeftRadius, color: s.color, bg: s.backgroundColor, pad: s.padding } }) }
    })
  } catch (e) { res[id] = { url, error: String(e).slice(0, 200) } }
  await page.close()
}
await browser.close()
await writeFile(`${out}/gr7-live.json`, JSON.stringify(res, null, 2) + '\n', 'utf8')
console.log(JSON.stringify(Object.fromEntries(Object.entries(res).map(([k, v]) => [k, v.error ?? `${v.n} badges @ ${v.url}`])), null, 1))
