// Opus review 6 (Revision 5): independent AC21 / AC22 / GR-3b/3c/3e/3f measurement against storybook-static.
// Usage: node.exe 105-opus-review6.mjs <out-json> <out-crops-png> <out-radio-story-png>
import { createRequire } from 'node:module'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const ROOT = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const [OUT_JSON, OUT_CROPS, OUT_STORY] = process.argv.slice(2)
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' }
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]))
  fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] ?? 'application/octet-stream' }); res.end(d) })
}).listen(6125)
const url = (id, loc) => `http://127.0.0.1:6125/iframe.html?id=${id}&globals=locale:${loc}&viewMode=story`
const LPD = ['active', 'sold-status-actions', 'hidden', 'delete-confirm', 'premium'].map((s) => `patterns-mantine-listingpreviewdialogview--${s}`)
const PD = ['not-premium', 'premium', 'custom-date', 'saving'].map((s) => `patterns-mantine-premiumdialogview--${s}`)
const browser = await chromium.launch()
const out = { platform: `${process.platform} ${process.version}`, dialogs: [], radio: [], radioStates: null }

// AC21 / GR-3e — every visible button or anchor with a label in the dialog, classified by its rendered variant.
for (const id of [...LPD, ...PD]) for (const loc of ['sq', 'uk']) for (const w of [390, 1440]) {
  const ctx = await browser.newContext({ deviceScaleFactor: 1, viewport: { width: w, height: 900 } })
  const page = await ctx.newPage()
  await page.goto(url(id, loc))
  await page.waitForSelector('[role="dialog"]', { timeout: 20000 })
  await page.waitForTimeout(700)
  const r = await page.evaluate(() => {
    const vis = (el) => { const b = el.getBoundingClientRect(); return b.width > 0 && b.height > 0 }
    const dlg = document.querySelector('[role="dialog"]')
    const all = [...dlg.querySelectorAll('button, a')].filter((el) => vis(el) && el.textContent.trim() && !el.closest('.mantine-Combobox-dropdown'))
      .map((el) => { const b = el.getBoundingClientRect(); return { label: el.textContent.trim(), variant: el.getAttribute('data-variant'), tag: el.tagName, top: Math.round(b.top), bottom: Math.round(b.bottom), left: Math.round(b.left), right: Math.round(b.right) } })
    const text = all.filter((b) => ['subtle', 'transparent'].includes(b.variant) || (b.tag === 'A' && !b.variant))
    const pairs = []
    for (let i = 0; i < text.length; i++) for (let j = i + 1; j < text.length; j++) pairs.push({ a: text[i].label, b: text[j].label, shareRow: text[j].top < text[i].bottom && text[i].top < text[j].bottom })
    const heads = [...dlg.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((e) => parseFloat(getComputedStyle(e).fontSize))
    const db = dlg.getBoundingClientRect()
    return { all, text, pairs, headingFs: heads, overflowX: document.documentElement.scrollWidth > window.innerWidth, dlg: { l: Math.round(db.left), r: Math.round(db.right), w: Math.round(db.width) } }
  })
  out.dialogs.push({ id, loc, w, ...r })
  await ctx.close()
}

// AC22 — radio box and checked dot, Radio Default (sq 320/390/1024/1440) and PremiumDialogView NotPremium (sq 1440, first radio checked).
async function radioMeasure(id, w, check) {
  const ctx = await browser.newContext({ deviceScaleFactor: 1, viewport: { width: w, height: 1000 } })
  const page = await ctx.newPage()
  await page.goto(url(id, 'sq'))
  await page.waitForSelector('.mantine-Radio-radio', { timeout: 20000 })
  if (check) await page.locator('.mantine-Radio-radio').first().check({ force: true })
  await page.waitForTimeout(600)
  const r = await page.evaluate(() => ({
    radios: [...document.querySelectorAll('.mantine-Radio-radio')].map((el) => { const b = el.getBoundingClientRect(); const cs = getComputedStyle(el); return { w: b.width, h: b.height, checked: el.checked, radius: cs.borderRadius, border: cs.borderColor, bg: cs.backgroundColor } }),
    checkedIcons: [...document.querySelectorAll('.mantine-Radio-radio:checked ~ .mantine-Radio-icon, .mantine-Radio-radio:checked + .mantine-Radio-icon')].map((el) => { const b = el.getBoundingClientRect(); return { w: b.width, h: b.height } }),
    overflowX: document.documentElement.scrollWidth > window.innerWidth,
    textFs: [...new Set([...document.querySelectorAll('body *')].filter((e) => e.childElementCount === 0 && e.textContent.trim()).map((e) => parseFloat(getComputedStyle(e).fontSize)))],
  }))
  return { page, ctx, r }
}
for (const w of [320, 390, 1024, 1440]) { const { ctx, r } = await radioMeasure('mantine-primitives-radio--default', w, false); out.radio.push({ id: 'mantine-primitives-radio--default', w, ...r }); await ctx.close() }
{ const { ctx, r } = await radioMeasure('patterns-mantine-premiumdialogview--not-premium', 1440, true); out.radio.push({ id: 'patterns-mantine-premiumdialogview--not-premium', w: 1440, firstChecked: true, ...r }); await ctx.close() }

// GR-3f — DPR-1 crops of every radio in Radio Default (incl. keyboard focus on #3, error, disabled) and PremiumDialogView (unchecked + checked).
const crops = []
{
  const ctx = await browser.newContext({ deviceScaleFactor: 1, viewport: { width: 1440, height: 1000 } })
  const page = await ctx.newPage()
  await page.goto(url('mantine-primitives-radio--default', 'sq'))
  await page.waitForSelector('.mantine-Radio-radio', { timeout: 20000 })
  await page.waitForTimeout(600)
  await page.screenshot({ path: OUT_STORY, fullPage: true })
  const names = ['unchecked', 'checked', 'focus (Tab)', 'error unchecked', 'error checked', 'disabled unchecked', 'disabled checked', 'long label']
  const radios = await page.$$('.mantine-Radio-radio')
  for (let i = 0; i < radios.length; i++) {
    if (i === 2) { await page.keyboard.press('Tab'); await page.keyboard.press('Tab'); await page.keyboard.press('Tab'); await radios[2].focus(); await page.waitForTimeout(200) }
    const b = await radios[i].boundingBox()
    crops.push([`Radio Default — ${names[i] ?? i}`, (await page.screenshot({ clip: { x: b.x - 5, y: b.y - 5, width: b.width + 10, height: b.height + 10 } })).toString('base64')])
  }
  out.radioStates = await page.evaluate(() => [...document.querySelectorAll('.mantine-Radio-radio')].map((el) => { const cs = getComputedStyle(el); return { checked: el.checked, disabled: el.disabled, error: el.hasAttribute('data-error'), focusVisible: el.matches(':focus-visible'), border: cs.borderColor, shadow: cs.boxShadow, rootOpacity: getComputedStyle(el.closest('.mantine-Radio-root')).opacity } }))
  await ctx.close()
}
{
  const ctx = await browser.newContext({ deviceScaleFactor: 1, viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  await page.goto(url('patterns-mantine-premiumdialogview--not-premium', 'sq'))
  await page.waitForSelector('.mantine-Radio-radio', { timeout: 20000 })
  await page.locator('.mantine-Radio-radio').first().check({ force: true })
  await page.waitForTimeout(600)
  const radios = await page.$$('.mantine-Radio-radio')
  for (const [i, n] of [[0, 'checked'], [1, 'unchecked']]) { const b = await radios[i].boundingBox(); crops.push([`PremiumDialogView NotPremium — ${n}`, (await page.screenshot({ clip: { x: b.x - 5, y: b.y - 5, width: b.width + 10, height: b.height + 10 } })).toString('base64')]) }
  await ctx.close()
}
const html = `<body style="margin:16px;font:14px sans-serif;background:#fff">${crops.map(([n, b]) => `<div style="display:flex;gap:24px;align-items:center;margin-bottom:10px"><div style="width:260px">${n}</div><img src="data:image/png;base64,${b}" style="image-rendering:pixelated;width:300px"><img src="data:image/png;base64,${b}"></div>`).join('')}</body>`
const p2 = await (await browser.newContext({ viewport: { width: 760, height: 800 } })).newPage()
await p2.setContent(html)
await p2.waitForTimeout(300)
await p2.screenshot({ path: OUT_CROPS, fullPage: true })
fs.writeFileSync(OUT_JSON, JSON.stringify(out, null, 2))
await browser.close(); server.close()
console.log('ok')
