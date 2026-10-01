import path from 'node:path'
import fs from 'node:fs'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const BASE = 'http://localhost:3000'
const browser = await chromium.launch()
async function bars(url) {
  const ctx = await browser.newContext({ storageState: path.resolve('playwright/.auth/admin-storage-state.json'), viewport: { width: 1440, height: 1000 } })
  await ctx.addCookies([{ name: 'admin-locale', value: 'en', url: BASE }])
  const page = await ctx.newPage()
  await page.goto(BASE + url, { waitUntil: 'load' })
  await page.waitForSelector('.apexcharts-bar-area', { state: 'attached', timeout: 30000 })
  await page.waitForTimeout(3500)
  const r = await page.evaluate(() => [...document.querySelectorAll('.mantine-Card-root')].slice(0, 4).map((c) => [...c.querySelectorAll('.apexcharts-bar-area')].map((b) => Number(b.getAttribute('val')))))
  await ctx.close()
  return r
}
const a = await bars('/admin')
const c = await bars('/admin?period=7d')
const out = `/admin           bar values (val attr) per KPI card: ${JSON.stringify(a)}\n/admin?period=7d bar values (val attr) per KPI card: ${JSON.stringify(c)}\nidentical: ${JSON.stringify(a) === JSON.stringify(c)}\n`
console.log(out)
fs.writeFileSync('docs/sessions/evidence/task890/rev1/live/sparkline-compare.txt', out)
await browser.close()
