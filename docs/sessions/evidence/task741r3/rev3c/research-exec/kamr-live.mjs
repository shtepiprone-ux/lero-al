import { createRequire } from 'node:module'
import { readFile, writeFile } from 'node:fs/promises'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const out = 'C:/Claude_Code_Projects/lero-al/docs/sessions/evidence/task741r3/rev3c/research-exec'
const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto('https://kamr-vite.vercel.app/login', { waitUntil: 'networkidle' })
const inputs = await page.locator('input').evaluateAll(a => a.map(i => `${i.type}|${i.name}|${i.placeholder}`))
console.log('inputs', inputs)
await page.locator('input').first().fill('admin'); await page.locator('input[type=password]').first().fill('123456')
await page.locator('button[type=submit], button:has-text("Sign"), button:has-text("Log")').first().click()
await page.waitForTimeout(3000); console.log('after login', page.url())
await page.goto('https://kamr-vite.vercel.app/ui-badge', { waitUntil: 'networkidle' }); await page.waitForTimeout(1500)
console.log('badge url', page.url())
await page.screenshot({ path: `${out}/kamr-ui-badge-1440.png`, fullPage: true })
const r = await page.evaluate(() => { const els = [...document.querySelectorAll('[class*=badge],[class*=Badge]')].filter(e => e.children.length === 0 && e.textContent.trim() && e.getBoundingClientRect().width > 0).slice(0, 14); return { url: location.href, n: els.length, badges: els.map(e => { const s = getComputedStyle(e); return { text: e.textContent.trim().slice(0, 24), fs: s.fontSize, fw: s.fontWeight, radius: s.borderTopLeftRadius, color: s.color, bg: s.backgroundColor } }) } })
const j = JSON.parse(await readFile(`${out}/gr7-live.json`, 'utf8')); j['kamr-ui-badge'] = r
await writeFile(`${out}/gr7-live.json`, JSON.stringify(j, null, 2) + '\n', 'utf8')
console.log(r.url, r.n); await b.close()
