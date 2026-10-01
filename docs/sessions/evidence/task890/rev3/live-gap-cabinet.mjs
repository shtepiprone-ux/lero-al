// Task 890 rev 3, step 5 — gap between the header's bottom edge and the page title, live (npm run start :3000).
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module'
const require = createRequire(import.meta.url); const { chromium } = require('playwright')
const BASE = 'http://localhost:3000'; const STATE = path.resolve('playwright/.auth/agent1-storage-state.json')
const OUT = path.resolve('docs/sessions/evidence/task890/rev3/live'); const lines = []
const br = await chromium.launch()
async function visit(urlPath, width, tag) {
  const ctx = await br.newContext({ storageState: STATE, viewport: { width, height: 1000 } })
  await ctx.addCookies([{ name: 'admin-locale', value: 'en', url: BASE }, { name: 'NEXT_LOCALE', value: 'en', url: BASE }])
  const page = await ctx.newPage(); const res = await page.goto(BASE + urlPath, { waitUntil: 'load' })
  await page.waitForSelector('h1', { timeout: 20000 }).catch(() => {}); await page.waitForTimeout(3000)
  const m = await page.evaluate(() => {
    const h1 = document.querySelector('h1'); const hdr = document.querySelector('.mantine-AppShell-header, header')
    const nav = document.querySelector('.mantine-AppShell-navbar')
    const hb = hdr ? hdr.getBoundingClientRect().bottom : null; const t = h1 ? h1.getBoundingClientRect() : null
    const grid = h1 ? h1.closest('[class*="mantine-Box-root"]') : null
    return { url: location.pathname, title: h1?.textContent?.trim().slice(0, 40), headerBottom: hb && Math.round(hb), titleTop: t && Math.round(t.top), gap: hb != null && t ? Math.round(t.top - hb) : null, titleLeftFromNavbar: t && nav ? Math.round(t.left - nav.getBoundingClientRect().right) : null, navbar: nav ? Math.round(nav.getBoundingClientRect().width) : null }
  })
  lines.push(`${tag} ${urlPath} ${width}: status ${res?.status()} ${JSON.stringify(m)}`); console.log(lines.at(-1))
  await page.screenshot({ path: path.join(OUT, `${tag}-${width}.png`) }); await ctx.close()
}
await visit('/en/cabinet/statistics', 390, 'cabinet-agent1'); await visit('/en/cabinet/statistics', 1280, 'cabinet-agent1')
fs.writeFileSync(path.join(OUT, 'live-gap-cabinet.out.txt'), lines.join('\n') + '\n'); await br.close()