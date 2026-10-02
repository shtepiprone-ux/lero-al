// Opus review 6: computed chrome of disabled-checked and focus-visible radios (Radio Default, PremiumDialogView Saving).
import { createRequire } from 'node:module'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const ROOT = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }
const server = http.createServer((req, res) => { const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] ?? 'application/octet-stream' }); res.end(d) }) }).listen(6126)
const browser = await chromium.launch()
const out = {}
for (const id of ['mantine-primitives-radio--default', 'patterns-mantine-premiumdialogview--saving']) {
  const page = await (await browser.newContext({ deviceScaleFactor: 1, viewport: { width: 1440, height: 1000 } })).newPage()
  await page.goto(`http://127.0.0.1:6126/iframe.html?id=${id}&globals=locale:sq&viewMode=story`)
  await page.waitForSelector('.mantine-Radio-radio', { timeout: 20000 }); await page.waitForTimeout(600)
  out[id] = await page.evaluate(() => [...document.querySelectorAll('.mantine-Radio-radio')].map((el) => { const cs = getComputedStyle(el); const ic = el.parentElement.querySelector('.mantine-Radio-icon'); return { checked: el.checked, disabled: el.disabled, bg: cs.backgroundColor, border: cs.borderColor, icon: ic ? getComputedStyle(ic).color : null, rootOpacity: getComputedStyle(el.closest('.mantine-Radio-root')).opacity } }))
  if (id.includes('radio--default')) {
    await page.locator('.mantine-Radio-radio').nth(2).focus(); await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab')
    out.focus = await page.evaluate(() => { const el = document.activeElement; const cs = getComputedStyle(el); return { cls: el.className, focusVisible: el.matches(':focus-visible'), border: cs.borderColor, shadow: cs.boxShadow } })
  }
}
fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 2)); await browser.close(); server.close(); console.log(JSON.stringify(out))
