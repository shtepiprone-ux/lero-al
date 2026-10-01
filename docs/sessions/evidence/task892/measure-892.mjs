// Task 892 — GR-3b/3c/3d probe against storybook-static (served on :6892). Real Chromium, getBoundingClientRect / getComputedStyle.
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const IDS = ['default', 'all-allowed', 'saving', 'audit-empty', 'audit-unavailable']
const WIDTHS = [320, 390, 768, 1024, 1440]
const browser = await chromium.launch()
const out = []
for (const id of IDS) {
  for (const w of WIDTHS) {
    const page = await browser.newPage({ viewport: { width: w, height: 900 } })
    await page.goto(`http://127.0.0.1:6892/iframe.html?id=patterns-mantine-adminpermissionsview--${id}&viewMode=story`, { waitUntil: 'networkidle' })
    await page.waitForSelector('[data-testid="admin-permissions-manager"]', { timeout: 15000 })
    const m = await page.evaluate(() => {
      const root = document.querySelector('[data-testid="admin-permissions-manager"]')
      const r = root.getBoundingClientRect()
      const sy = window.scrollY
      const docH = document.documentElement.scrollHeight
      const gutter = root.parentElement.getBoundingClientRect()
      const fs = el => el ? Math.round(parseFloat(getComputedStyle(el).fontSize) * 100) / 100 : null
      const h2 = root.querySelector('h2')
      const row = root.querySelector('[data-testid^="perm-row-"]')
      const name = row.querySelector('p')
      const desc = row.querySelectorAll('p')[1]
      const sw = [...root.querySelectorAll('input[role="switch"]')]
      const rowR = row.getBoundingClientRect()
      return {
        vw: innerWidth, rootW: Math.round(r.width), parentW: Math.round(gutter.width),
        overflow: document.documentElement.scrollWidth > innerWidth,
        top: Math.round(r.top + sy), left: Math.round(r.left), right: Math.round(innerWidth - r.right),
        bottom: Math.round(docH - (r.bottom + sy)),
        sectionTitle: fs(h2), permName: fs(name), permDesc: fs(desc), h2Count: root.querySelectorAll('h2').length,
        rowOverflow: row.scrollWidth > row.clientWidth + 1, rowRight: Math.round(rowR.right), switches: sw.length, disabled: sw.filter(s => s.disabled).length,
        alert: !!root.querySelector('[role="alert"]'),
      }
    })
    out.push({ id, w, ...m })
    await page.close()
  }
}
await browser.close()
console.log(JSON.stringify(out, null, 1))
