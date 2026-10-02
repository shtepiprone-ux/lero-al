import { createRequire } from 'node:module'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const OUT = 'C:/Users/Nox/AppData/Local/Temp/claude/C--Claude-Code-Projects-lero-al/dd79fd06-85df-4da2-b961-09f0bd748272/scratchpad/refs'
const browser = await chromium.launch()
for (const [name, url, w] of [['lahomes-details', 'https://techzaa.in/lahomes/admin/property-details.html', 1440], ['lahomes-list', 'https://techzaa.in/lahomes/admin/property-list.html', 1440], ['ta-modals-390', 'https://demo.tailadmin.com/modals', 390]]) {
  const p = await (await browser.newContext({ viewport: { width: w, height: 900 } })).newPage()
  await p.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch((e) => console.log(name, e.message))
  if (name === 'ta-modals-390') { await p.locator('main button', { hasText: 'Open Modal' }).first().click().catch(() => {}); await p.waitForTimeout(800) }
  await p.screenshot({ path: `${OUT}/${name}.png`, fullPage: name !== 'ta-modals-390' })
}
await browser.close(); console.log('ok')
