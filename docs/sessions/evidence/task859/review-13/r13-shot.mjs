import { chromium } from 'file:///C:/Claude_Code_Projects/lero-al/node_modules/playwright/index.mjs'
const [id, loc, w, out] = process.argv.slice(2)
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +w, height: 900 }, deviceScaleFactor: 2 })
await p.goto(`http://localhost:6111/iframe.html?id=${id}&viewMode=story&globals=locale:${loc}`, { waitUntil: 'networkidle' }); await p.waitForTimeout(800)
const t = p.locator('[data-testid="admin-table"]'); await t.scrollIntoViewIfNeeded(); await t.screenshot({ path: out }); await b.close()
