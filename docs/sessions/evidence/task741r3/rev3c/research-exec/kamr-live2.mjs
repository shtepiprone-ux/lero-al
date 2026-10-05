import { createRequire } from 'node:module'
import { readFile, writeFile } from 'node:fs/promises'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const out = 'C:/Claude_Code_Projects/lero-al/docs/sessions/evidence/task741r3/rev3c/research-exec'
const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto('https://kamr-vite.vercel.app/dashboard', { waitUntil: 'networkidle' }); console.log('dashboard direct ->', page.url())
if (page.url().includes('login')) {
  await page.locator('input[type=email]').fill('admin'); await page.locator('input[type=password]').fill('123456')
  await page.locator('input[type=email]').evaluate(e => { e.type = 'text' })
  await page.locator('button').filter({ hasText: /sign|log/i }).first().click().catch(() => {})
  await page.waitForTimeout(3000); console.log('after login ->', page.url(), (await page.locator('body').innerText()).slice(0, 200).replace(/\s+/g, ' '))
}
await page.goto('https://kamr-vite.vercel.app/ui-badge', { waitUntil: 'networkidle' }); await page.waitForTimeout(1500)
await page.screenshot({ path: `${out}/kamr-ui-badge-1440.png`, fullPage: true })
const r = await page.evaluate(() => { const els = [...document.querySelectorAll('[class*=badge],[class*=Badge]')].filter(e => e.children.length === 0 && e.textContent.trim() && e.getBoundingClientRect().width > 0).slice(0, 14); return { url: location.href, n: els.length, badges: els.map(e => { const s = getComputedStyle(e); return { text: e.textContent.trim().slice(0, 24), fs: s.fontSize, fw: s.fontWeight, radius: s.borderTopLeftRadius, color: s.color, bg: s.backgroundColor } }) } })
const j = JSON.parse(await readFile(`${out}/gr7-live.json`, 'utf8')); j['kamr-ui-badge'] = r
await writeFile(`${out}/gr7-live.json`, JSON.stringify(j, null, 2) + '\n', 'utf8')
console.log(r.url, r.n, JSON.stringify(r.badges.slice(0, 3))); await b.close()
