// Task 918 amendment (D89-10) — GR-7 live: owner reference https://rozetka.com.ua/ (D89-3): product tiles, struck old price above the current price.
import { createRequire } from 'node:module'
import { writeFile } from 'node:fs/promises'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
// Headless Chromium got HTTP 403 (bot wall); a headed Chrome channel is used instead (owner re-supplied the URL 2026-10-04).
const browser = await chromium.launch({ channel: 'chrome', headless: false, args: ['--disable-blink-features=AutomationControlled'] })
const out = {}
for (const w of [1440, 390]) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1, locale: 'uk-UA' })
  await page.addInitScript(() => Object.defineProperty(navigator, 'webdriver', { get: () => undefined }))
  const resp = await page.goto('https://rozetka.com.ua/', { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(e => ({ status: () => 'ERR ' + e.message.slice(0, 80) }))
  await page.waitForTimeout(9000)
  await page.mouse.wheel(0, 1600); await page.waitForTimeout(2500)
  out[w] = { status: resp?.status?.(), title: await page.title().catch(() => ''), tiles: await page.evaluate(() => {
    const olds = [...document.querySelectorAll('[class*="old"]')].filter(e => e.children.length === 0 && /\d/.test(e.textContent) && e.getBoundingClientRect().width > 0).slice(0, 4)
    return olds.map(o => { let t = o; for (let i = 0; i < 4 && t.parentElement; i++) t = t.parentElement; const cur = [...t.querySelectorAll('*')].find(e => e !== o && e.children.length === 0 && /\d[\d\s]*₴/.test(e.textContent) && !/old/.test(e.className)); const so = getComputedStyle(o), ro = o.getBoundingClientRect(); const rc = cur?.getBoundingClientRect(); return { old: o.textContent.trim(), oldStyle: `${so.fontSize}/${so.fontWeight} ${so.color} ${so.textDecorationLine}`, cur: cur?.textContent.trim(), curStyle: cur ? `${getComputedStyle(cur).fontSize}/${getComputedStyle(cur).fontWeight} ${getComputedStyle(cur).color}` : null, oldAbove: rc ? ro.bottom <= rc.top + 1 : null } })
  }) }
  await page.screenshot({ path: `docs/sessions/evidence/task741r3/rev3e/design/rozetka-${w}.png` })
  await page.close()
}
await browser.close()
await writeFile('docs/sessions/evidence/task741r3/rev3e/design/gr7-rozetka.json', JSON.stringify(out, null, 1) + '\n')
console.log(JSON.stringify(out, null, 1))
