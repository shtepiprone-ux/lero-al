/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS evidence script (Task 923), not product code */
// Task 923 Review 37 (Opus, 2026-10-23), after the owner's report that WhatsApp does not always open: measures how long a click's transient activation lasts
// in Chromium, and whether window.open after an await still returns a window. No product code is loaded. Usage: node rv37-31-activation-probe.cjs <repo root> <out file>
const path = require('node:path')
const fs = require('node:fs')
const [root, out] = process.argv.slice(2)
const { chromium } = require(path.join(root, 'node_modules', 'playwright'))

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  await page.setContent('<button id="b">press</button>')
  const lines = [`# chromium ${browser.version()}, node ${process.version}, ${process.platform}, ${new Date().toISOString()}`]
  for (const delay of [0, 1000, 3000, 4500, 5500, 8000]) {
    await page.evaluate((ms) => {
      window.__r = null
      document.getElementById('b').onclick = async () => {
        await new Promise((r) => setTimeout(r, ms))
        const active = navigator.userActivation.isActive
        const w = window.open('about:blank', '_blank')
        window.__r = { active, opened: w !== null }
        if (w) w.close()
      }
    }, delay)
    await page.click('#b')
    await page.waitForFunction(() => window.__r !== null, null, { timeout: 20000 })
    const r = await page.evaluate(() => window.__r)
    lines.push(`await ${delay} ms after the click: userActivation.isActive=${r.active}; window.open returned a window=${r.opened}`)
  }
  await browser.close()
  fs.writeFileSync(out, lines.join('\n') + '\n')
  console.log(lines.join('\n'))
})().catch((e) => { console.error(e); process.exit(1) })
