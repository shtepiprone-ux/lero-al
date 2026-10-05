// Does page.clock.setFixedTime (as used by probe-states.mjs pass B) actually move Date.now() in the page?
import { createRequire } from 'node:module'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const browser = await chromium.launch()
const results = {}
for (const mode of ['setFixedTime only', 'install + setFixedTime']) {
  const page = await browser.newPage()
  if (mode === 'install + setFixedTime') await page.clock.install({ time: new Date('2027-03-01T00:00:00.000Z') })
  await page.clock.setFixedTime(new Date('2027-03-01T00:00:00.000Z'))
  await page.goto('about:blank')
  results[mode] = await page.evaluate(() => ({ nowIso: new Date(Date.now()).toISOString(), newDateIso: new Date().toISOString() }))
  await page.close()
}
await browser.close()
console.log(JSON.stringify(results, null, 2))
