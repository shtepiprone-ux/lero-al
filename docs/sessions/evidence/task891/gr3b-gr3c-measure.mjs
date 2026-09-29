import { chromium } from 'playwright'

const BASE = 'http://127.0.0.1:6321'
const browser = await chromium.launch()
const page = await browser.newPage()

async function go(id, locale = 'en') {
  await page.goto(`${BASE}/iframe.html?id=${id}&viewMode=story&globals=locale:${locale}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(700)
}

const WIDTHS_B = [320, 390, 1024, 1440]
const WIDTHS_C = [320, 390, 768, 1440]

const results = {}

async function measureGr3b(storyId) {
  const rows = []
  for (const w of WIDTHS_B) {
    await page.setViewportSize({ width: w, height: 1400 })
    await go(storyId)
    const r = await page.evaluate(() => {
      const root = document.getElementById('storybook-root') || document.body
      const rootRect = root.getBoundingClientRect()
      // Scope to #storybook-root: Storybook's own `sb-preparing-docs` docs-mode pre-render (present
      // whenever the project enables autodocs) mounts a second, zero-size copy of some components
      // OUTSIDE #storybook-root — every query below must exclude it or it double-counts elements.
      const tableScrollAreas = Array.from(root.querySelectorAll('.mantine-ScrollArea-viewport')).filter((el) => el.querySelector('table'))
      const overflow = tableScrollAreas.some((el) => el.scrollWidth > el.clientWidth + 1)
      const bodyOverflow = document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
      return {
        rootWidth: Math.round(rootRect.width),
        viewportWidth: window.innerWidth,
        tableScrollAreaCount: tableScrollAreas.length,
        scrollAreaOverflow: overflow,
        bodyOverflow,
      }
    })
    rows.push({ width: w, ...r })
  }
  return rows
}

async function measureGr3c(storyId, selectors) {
  const rows = []
  for (const w of WIDTHS_C) {
    await page.setViewportSize({ width: w, height: 1400 })
    await go(storyId)
    const r = await page.evaluate((sels) => {
      const root = document.getElementById('storybook-root') || document.body
      const out = {}
      for (const [label, sel] of Object.entries(sels)) {
        const el = root.querySelector(sel)
        out[label] = el ? Math.round(parseFloat(getComputedStyle(el).fontSize)) : null
      }
      return out
    }, selectors)
    rows.push({ width: w, ...r })
  }
  return rows
}

// ── GR-3b: AgentStatisticsView Default ──────────────────────────────────────
results.agentStatsDefaultGr3b = await measureGr3b('patterns-mantine-agentstatisticsview--default')

// ── GR-3c: AgentStatisticsView Default — page title, card title, KPI value, table cell ──────
results.agentStatsDefaultGr3c = await measureGr3c('patterns-mantine-agentstatisticsview--default', {
  pageTitle: 'h1',
  cardTitle: 'h2',
  tableCell: '.mantine-Table-td p',
})

// ── AC10: AGT-10 ScrollArea overflow + title lineClamp at 4 widths/locales ──────────────────
const ac10Widths = [
  { width: 1440, locale: 'en' },
  { width: 768, locale: 'en' },
  { width: 1024, locale: 'en' },
  { width: 1280, locale: 'en' },
  { width: 1440, locale: 'uk' },
]
const ac10 = []
for (const { width, locale } of ac10Widths) {
  await page.setViewportSize({ width, height: 1400 })
  await go('patterns-mantine-agentstatisticsview--default', locale)
  const r = await page.evaluate(() => {
    const root = document.getElementById('storybook-root') || document.body
    const viewport = Array.from(root.querySelectorAll('.mantine-ScrollArea-viewport')).find((el) => el.querySelector('table'))
    // The title link is specifically the first <td> of each visible (desktop) row — excludes the
    // Edit-action <a> in the last column, and excludes the CSS-hidden mobile card tree entirely
    // (cardsBelow="md" keeps both trees in the DOM; only `visibleFrom="md"` one is on-screen).
    const titleLinks = Array.from(root.querySelectorAll('table tbody tr td:first-child a'))
    const lineHeights = titleLinks.map((a) => {
      const cs = getComputedStyle(a)
      const lh = parseFloat(cs.lineHeight)
      const h = a.getBoundingClientRect().height
      return Math.round(h / lh)
    })
    return {
      scrollWidth: viewport ? viewport.scrollWidth : null,
      clientWidth: viewport ? viewport.clientWidth : null,
      titleRowCount: titleLinks.length,
      titleLineCounts: lineHeights,
    }
  })
  ac10.push({ width, locale, ...r })
}
results.ac10 = ac10

// ── AC10 wrap-column check: Mantine/Primitives/Table CardsBelowMd at 800 ────────────────────
await page.setViewportSize({ width: 800, height: 1200 })
await go('mantine-primitives-table--cards-below-md')
results.tableWrapCheck = await page.evaluate(() => {
  const root = document.getElementById('storybook-root') || document.body
  const ths = Array.from(root.querySelectorAll('table thead th'))
  const tds = Array.from(root.querySelectorAll('table tbody tr:first-child td'))
  return {
    columnCount: ths.length,
    thWhiteSpace: ths.map((th) => getComputedStyle(th).whiteSpace),
    tdWhiteSpace: tds.map((td) => getComputedStyle(td).whiteSpace),
    // Column order is name/status/role/date (makeArgs) — index 3 is the wrapped 'date' column.
    wrappedColumnIndex: 3,
  }
})

console.log(JSON.stringify(results, null, 2))
await browser.close()
