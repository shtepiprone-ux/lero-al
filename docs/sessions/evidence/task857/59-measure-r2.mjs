// Task 857 Revision 2 measurements: Playwright against the rebuilt storybook-static.
import fs from 'node:fs'
import { chromium } from 'playwright'

const BASE = 'http://127.0.0.1:6090'
const EV = 'docs/sessions/evidence/task857/'
const LOCALES = ['sq', 'en', 'uk', 'it']
const out = { table: [], wrapped: [], audit: [], visibility: [], dialogs: [], gr: [] }

const browser = await chromium.launch()
const ctx = await browser.newContext()
const page = await ctx.newPage()

async function open(id, locale, w) {
  await page.setViewportSize({ width: w, height: 900 })
  await page.goto(`${BASE}/iframe.html?id=${id}&globals=locale:${locale}&viewMode=story`, { waitUntil: 'networkidle' })
  await page.waitForSelector('#storybook-root > *, [role="dialog"]', { timeout: 15000 }).catch(() => {})
  await page.waitForTimeout(700)
}

// A. Table scroll + insets (AC12)
const tableFn = () => {
  const table = document.querySelector('[data-testid="admin-table"] table')
  if (!table) return { noTable: true }
  const card = table.closest('.mantine-Paper-root')
  const vp = table.closest('.mantine-ScrollArea-viewport')
  const cardR = card.getBoundingClientRect()
  const rows = [...table.querySelectorAll('tbody tr')]
  const firstRowCells = [...rows[0].querySelectorAll('td')].filter(td => td.getBoundingClientRect().width > 0)
  const first = firstRowCells[0].getBoundingClientRect()
  const last = firstRowCells[firstRowCells.length - 1].getBoundingClientRect()
  // padding-left of first cell content / padding-right of last cell
  const firstPad = parseFloat(getComputedStyle(firstRowCells[0]).paddingLeft)
  const lastPad = parseFloat(getComputedStyle(firstRowCells[firstRowCells.length - 1]).paddingRight)
  const clipped = []
  table.querySelectorAll('td *').forEach(el => {
    if (el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflowX !== 'visible' && el.clientWidth > 0) {
      clipped.push(el.textContent.trim().slice(0, 30))
    }
  })
  return {
    vpScrollW: vp.scrollWidth,
    vpClientW: vp.clientWidth,
    scrolls: vp.scrollWidth > vp.clientWidth,
    firstInset: Math.round(first.left - cardR.left + firstPad),
    lastInset: Math.round(cardR.right - last.right + lastPad),
    firstCellLeftToBorder: Math.round(first.left - cardR.left),
    lastCellRightToBorder: Math.round(cardR.right - last.right),
    tableW: Math.round(table.getBoundingClientRect().width),
    cardW: Math.round(cardR.width),
    titleColW: Math.round(firstRowCells[1]?.getBoundingClientRect().width ?? 0),
    clipped,
    cols: firstRowCells.length,
  }
}
for (const id of ['patterns-mantine-adminlistingsview--default', 'patterns-mantine-adminlistingsview--paginated']) {
  for (const w of [640, 768, 1024, 1280, 1440]) {
    for (const l of LOCALES) {
      await open(id, l, w)
      out.table.push({ id, w, l, ...(await page.evaluate(tableFn)) })
    }
  }
}
for (const w of [1024, 1440]) {
  for (const l of LOCALES) {
    await open('patterns-mantine-admintable--wrapped-title-column', l, w)
    out.wrapped.push({ w, l, ...(await page.evaluate(tableFn)) })
  }
}

// cards below 640: left/right content inset equal
const cardsFn = () => {
  const root = document.querySelector('[data-testid="admin-table"]')
  const res = []
  root.querySelectorAll('.mantine-Paper-root').forEach(c => {
    const r = c.getBoundingClientRect()
    if (r.width === 0) return
    let minL = Infinity, maxR = -Infinity
    c.querySelectorAll('*').forEach(el => {
      if (el.children.length === 0 && el.textContent.trim()) {
        const b = el.getBoundingClientRect()
        if (b.width > 0) { minL = Math.min(minL, b.left); maxR = Math.max(maxR, b.right) }
      }
    })
    res.push({ left: Math.round(minL - r.left), right: Math.round(r.right - maxR), w: Math.round(r.width) })
  })
  return res
}
for (const w of [320, 390]) {
  for (const l of LOCALES) {
    await open('patterns-mantine-adminlistingsview--default', l, w)
    const cards = await page.evaluate(cardsFn)
    out.table.push({ id: 'cards', w, l, cards: cards.slice(0, 6), pageOverflow: await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth) })
  }
}

// audit links 14px
for (const l of LOCALES) {
  await open('patterns-mantine-adminlistingsview--hidden-eligible', l, 1024)
  out.audit.push({ l, sizes: await page.evaluate(() => [...document.querySelectorAll('[data-testid="admin-listings-table"] button.mantine-UnstyledButton-root')]
    .filter(b => /\d/.test(b.textContent)).map(b => ({ t: b.textContent.trim().slice(0, 28), fz: getComputedStyle(b.querySelector('p, .mantine-Text-root') ?? b).fontSize }))) })
}

// R18 visibility filter (AC15)
const visFn = () => {
  const el = document.querySelector('[data-testid="listings-visibility-filter"]')
  const search = document.querySelector('[data-testid="listings-search"]')
  if (!el) return { none: true }
  const isInput = el.tagName === 'INPUT'
  const wrap = isInput ? el.closest('.mantine-InputWrapper-root') ?? el.parentElement : el
  const w = Math.round(wrap.getBoundingClientRect().width)
  const sw = Math.round((search.closest('.mantine-InputWrapper-root') ?? search.parentElement).getBoundingClientRect().width)
  return {
    kind: isInput ? 'select' : (el.className.includes('SegmentedControl') ? 'segmented' : el.tagName),
    w, searchW: sw,
    labelClipped: isInput ? el.scrollWidth > el.clientWidth + 1 : null,
    value: isInput ? el.value : null,
    segmented: !!document.querySelector('.mantine-SegmentedControl-root'),
  }
}
for (const w of [320, 390, 640, 1024]) {
  for (const l of LOCALES) {
    for (const id of ['patterns-mantine-adminlistingsview--default', 'patterns-mantine-adminlistingsview--hidden-eligible']) {
      await open(id, l, w)
      out.visibility.push({ id, w, l, ...(await page.evaluate(visFn)) })
    }
  }
}

fs.writeFileSync(EV + '59-measurements-r2.json', JSON.stringify(out, null, 1))
await browser.close()
console.log('done', out.table.length, out.wrapped.length, out.visibility.length)
