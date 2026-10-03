// Task 857 Revision 2, part 2: dialogs (AC13/AC14), gutters and type receipts, AdminTable screenshots.
import fs from 'node:fs'
import { chromium } from 'playwright'

const BASE = 'http://127.0.0.1:6090'
const EV = 'docs/sessions/evidence/task857/'
const SECTION = process.argv[2]
const out = { dialogs: [], gutters: [], fonts: [], titleCol: [], wrapped: [] }
const browser = await chromium.launch()
const page = await (await browser.newContext()).newPage()

async function open(id, locale, w) {
  await page.setViewportSize({ width: w, height: 900 })
  await page.goto(`${BASE}/iframe.html?id=${id}&globals=locale:${locale}&viewMode=story`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('#storybook-root > *, [role="dialog"]', { timeout: 15000 }).catch(() => {})
  await page.waitForTimeout(400); process.stdout.write('.')
}

const dialogFn = () => {
  const d = document.querySelector('[role="dialog"]')
  if (!d) return { none: true }
  const dr = d.getBoundingClientRect()
  const buttons = [...d.querySelectorAll('.mantine-Button-root')].map(b => {
    const r = b.getBoundingClientRect()
    return {
      t: b.textContent.trim(), variant: b.getAttribute('data-variant') ?? 'filled', disabled: b.disabled || b.getAttribute('data-disabled') === 'true',
      top: Math.round(r.top), left: Math.round(r.left), w: Math.round(r.width), h: Math.round(r.height),
      color: getComputedStyle(b).color,
    }
  })
  const filled = buttons.filter(b => b.variant === 'filled')
  return {
    dialogW: Math.round(dr.width), dialogLeft: Math.round(dr.left), buttons, filledCount: filled.length, filled: filled.map(b => b.t),
    hasSelect: !!d.querySelector('[data-testid="status-change-control"]'),
    radios: d.querySelectorAll('input[type="radio"]').length,
    badgePremiumVar: d.innerHTML.includes('--badge-premium'),
    literalOK: buttons.some(b => b.t === 'OK'),
    titleBadge: [...d.querySelectorAll('.mantine-Badge-root')].map(b => b.textContent.trim()),
    overflowX: d.scrollWidth > d.clientWidth + 1,
  }
}
const DIALOGS = [
  'patterns-mantine-listingpreviewdialogview--active', 'patterns-mantine-listingpreviewdialogview--sold-status-actions',
  'patterns-mantine-listingpreviewdialogview--hidden', 'patterns-mantine-listingpreviewdialogview--delete-confirm',
  'patterns-mantine-listingpreviewdialogview--premium',
  'patterns-mantine-premiumdialogview--not-premium', 'patterns-mantine-premiumdialogview--premium',
  'patterns-mantine-premiumdialogview--custom-date', 'patterns-mantine-premiumdialogview--saving',
]
if (SECTION === 'dialogs') for (const id of DIALOGS) {
  for (const w of [390, 1440]) {
    for (const l of ['sq', 'uk']) {
      await open(id, l, w)
      out.dialogs.push({ id, w, l, ...(await page.evaluate(dialogFn)) })
    }
  }
}

// Gutters + fonts (GR-3b/3c/3d) for AdminListingsView and AdminTable stories
const gutFn = () => {
  const root = document.querySelector('#storybook-root')
  const vw = window.innerWidth
  let minL = Infinity, maxR = -Infinity, minT = Infinity, maxB = -Infinity
  root.querySelectorAll('*').forEach(el => {
    const r = el.getBoundingClientRect()
    if (r.width === 0 || r.height === 0) return
    if (el.closest('.mantine-ScrollArea-viewport') && !el.classList.contains('mantine-ScrollArea-viewport') && false) return
    minL = Math.min(minL, r.left); maxR = Math.max(maxR, r.right); minT = Math.min(minT, r.top); maxB = Math.max(maxB, r.bottom + window.scrollY)
  })
  const docH = document.documentElement.scrollHeight
  const fonts = {}
  root.querySelectorAll('h1,h2,h3,h4,p,button,td,th,input,label,span').forEach(el => {
    if (!el.textContent.trim() && el.tagName !== 'INPUT') return
    const k = el.tagName.toLowerCase(); const fs_ = Math.round(parseFloat(getComputedStyle(el).fontSize))
    ;(fonts[k] ??= new Set()).add(fs_)
  })
  return {
    vw, top: Math.round(minT), left: Math.round(minL), right: Math.round(vw - Math.min(maxR, vw)), bottom: Math.round(docH - maxB),
    pageOverflow: document.documentElement.scrollWidth > vw,
    maxFont: Math.max(...Object.values(fonts).flatMap(s => [...s])),
    fonts: Object.fromEntries(Object.entries(fonts).map(([k, s]) => [k, [...s].sort((a, b) => a - b)])),
  }
}
const STORIES = [
  'patterns-mantine-adminlistingsview--default', 'patterns-mantine-adminlistingsview--visible-filter',
  'patterns-mantine-adminlistingsview--hidden-eligible', 'patterns-mantine-adminlistingsview--paginated',
  'patterns-mantine-admintable--wrapped-title-column', 'patterns-mantine-admintable--default',
]
if (SECTION === 'gutters') for (const id of STORIES) {
  for (const w of [320, 390, 768, 1024, 1440]) {
    await open(id, 'en', w)
    out.gutters.push({ id, w, ...(await page.evaluate(gutFn)) })
  }
}

// Title column check at 1440 / 1024 for the real view in 4 locales (AC12 numbers) + wrapped story
const colFn = () => {
  const t = document.querySelector('[data-testid="admin-table"] table')
  if (!t) return { noTable: true }
  const vp = t.closest('.mantine-ScrollArea-viewport')
  const card = t.closest('.mantine-Paper-root').getBoundingClientRect()
  const ths = [...t.querySelectorAll('th')].filter(x => x.getBoundingClientRect().width > 0)
  const cells = [...t.querySelector('tbody tr').querySelectorAll('td')].filter(x => x.getBoundingClientRect().width > 0)
  const nonTitle = cells.reduce((s, c, i) => s + (i === 1 || (cells.length === 8 && i === 1) ? 0 : c.getBoundingClientRect().width), 0)
  const title = [...t.querySelectorAll('tbody tr td')].find(td => td.querySelector('button, .mantine-Text-root'))
  const clamp = t.querySelector('.mantine-Text-root[style*="line-clamp"], .mantine-Text-root[data-line-clamp]')
  return {
    scrolls: vp.scrollWidth > vp.clientWidth, sw: vp.scrollWidth, cw: vp.clientWidth, cardW: Math.round(card.width),
    firstLeft: Math.round(cells[0].getBoundingClientRect().left - card.left),
    lastRight: Math.round(card.right - cells[cells.length - 1].getBoundingClientRect().right),
    cols: cells.map(c => Math.round(c.getBoundingClientRect().width)),
    clampPresent: !!clamp,
  }
}
if (SECTION === 'cols') for (const id of ['patterns-mantine-adminlistingsview--default', 'patterns-mantine-admintable--wrapped-title-column']) {
  for (const w of [768, 1024, 1280, 1440]) {
    for (const l of ['sq', 'en', 'uk', 'it']) {
      await open(id, l, w)
      out.titleCol.push({ id, w, l, ...(await page.evaluate(colFn)) })
    }
  }
}

// AdminTable screenshots @1440 (after)
if (SECTION === 'cols') for (const ex of ['default', 'synthesized', 'empty', 'row-click', 'wrapped-title-column']) {
  await open(`patterns-mantine-admintable--${ex}`, 'en', 1440)
  await page.screenshot({ path: `${EV}60-admintable-${ex}-after-1440.png`, fullPage: true })
}

fs.writeFileSync(EV + `59b-${SECTION}-r2.json`, JSON.stringify(out, null, 1))
await browser.close()
console.log('done')
