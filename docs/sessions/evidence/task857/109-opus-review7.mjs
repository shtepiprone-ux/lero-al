// Opus review 7 (Revision 6): independent AC23 check — every Radio state's computed chrome, keyboard focus on the
// plain and the error radio, the disabled dot, and PremiumDialogView Saving. Usage: node.exe 109-opus-review7.mjs <out-json>
import { createRequire } from 'node:module'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const ROOT = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }
const server = http.createServer((req, res) => { const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] ?? 'application/octet-stream' }); res.end(d) }) }).listen(6127)
const browser = await chromium.launch()
const out = { platform: `${process.platform} ${process.version}` }
const read = () => [...document.querySelectorAll('.mantine-Radio-radio')].map((el) => {
  const cs = getComputedStyle(el); const ic = el.parentElement.querySelector('.mantine-Radio-icon'); const ib = ic.getBoundingClientRect(); const ics = getComputedStyle(ic)
  return { checked: el.checked, disabled: el.disabled, error: el.hasAttribute('data-error'), focusVisible: el.matches(':focus-visible'), bg: cs.backgroundColor, border: cs.borderColor, shadow: cs.boxShadow, iconColor: ics.color, iconOpacity: ics.opacity, iconWH: [ib.width, ib.height], rootOpacity: getComputedStyle(el.closest('.mantine-Radio-root')).opacity }
})
async function open(id) {
  const page = await (await browser.newContext({ deviceScaleFactor: 1, viewport: { width: 1440, height: 1000 } })).newPage()
  await page.goto(`http://127.0.0.1:6127/iframe.html?id=${id}&globals=locale:sq&viewMode=story`)
  await page.waitForSelector('.mantine-Radio-radio', { timeout: 20000 }); await page.waitForTimeout(600)
  return page
}
// Keyboard focus: focus the radio before the target, then Tab, so :focus-visible comes from the keyboard.
async function kbdFocus(page, index) {
  await page.locator('.mantine-Radio-radio').nth(index - 1).focus(); await page.keyboard.press('Tab'); await page.waitForTimeout(200)
  return page.evaluate(() => { const el = document.activeElement; const cs = getComputedStyle(el); return { radioIndex: [...document.querySelectorAll('.mantine-Radio-radio')].indexOf(el), focusVisible: el.matches(':focus-visible'), error: el.hasAttribute('data-error'), border: cs.borderColor, shadow: cs.boxShadow } })
}
{ const page = await open('mantine-primitives-radio--default'); out.defaultRest = await page.evaluate(read); out.focusPlain = await kbdFocus(page, 2); out.focusError = await kbdFocus(page, 3)
  await page.mouse.click(5, 5); await page.locator('.mantine-Radio-radio').nth(0).click({ force: true }); await page.waitForTimeout(200)
  out.mouseFocus = await page.evaluate(() => { const el = document.activeElement; const cs = getComputedStyle(el); return { focusVisible: el.matches(':focus-visible'), border: cs.borderColor, shadow: cs.boxShadow } }) }
{ const page = await open('patterns-mantine-premiumdialogview--saving'); out.saving = await page.evaluate(read) }
{ const page = await open('patterns-mantine-premiumdialogview--not-premium'); out.notPremium = await page.evaluate(read) }
fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 2)); await browser.close(); server.close(); console.log('ok')
