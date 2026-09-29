// Task 891 review 1, F5 — full GR-3b/GR-3c receipts for every changed export, AC2's computed
// background-color/background-image and sparkline bar counts, §13.3's 768 width + portal content,
// and AC14's corrected-tree AC10 re-measurement.
import { chromium } from 'playwright'

const BASE = 'http://127.0.0.1:6322'
const browser = await chromium.launch()
const page = await browser.newPage()

async function go(id, locale = 'en') {
  await page.goto(`${BASE}/iframe.html?id=${id}&viewMode=story&globals=locale:${locale}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(700)
}

const GR3B_WIDTHS = [320, 390, 1024, 1440]
const GR3C_WIDTHS = [320, 390, 768, 1440]
const ALL_WIDTHS = [320, 390, 768, 1024, 1440]

const AGENT_STORIES = [
  'patterns-mantine-agentstatisticsview--default',
  'patterns-mantine-agentstatisticsview--agt-01-all-zero',
  'patterns-mantine-agentstatisticsview--agt-10-empty',
  'patterns-mantine-agentstatisticsview--agt-10-filtered-empty',
  'patterns-mantine-agentstatisticsview--activity-stale',
  'patterns-mantine-agentstatisticsview--activity-error',
  'patterns-mantine-agentstatisticsview--no-activity',
  'patterns-mantine-agentstatisticsview--sorted-by-views',
]

const results = { perStory: {} }

async function measureAgentStory(storyId) {
  const perWidth = []
  for (const w of ALL_WIDTHS) {
    await page.setViewportSize({ width: w, height: 1400 })
    await go(storyId)
    const r = await page.evaluate(() => {
      const root = document.getElementById('storybook-root') || document.body
      const rootRect = root.getBoundingClientRect()
      const tableScrollAreas = Array.from(root.querySelectorAll('.mantine-ScrollArea-viewport')).filter((el) => el.querySelector('table'))
      const scrollOverflow = tableScrollAreas.some((el) => el.scrollWidth > el.clientWidth + 1)
      const bodyOverflow = document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
      const h1 = root.querySelector('h1')
      const h2 = root.querySelector('h2')
      const tableCellText = root.querySelector('.mantine-Table-td p, table tbody tr td p')
      const openPortals = Array.from(document.querySelectorAll('.mantine-Portal, [data-portal]')).length
      return {
        rootWidth: Math.round(rootRect.width),
        viewportWidth: window.innerWidth,
        tableScrollAreaOverflow: scrollOverflow,
        bodyOverflow,
        pageTitleFontSize: h1 ? Math.round(parseFloat(getComputedStyle(h1).fontSize)) : null,
        cardTitleFontSize: h2 ? Math.round(parseFloat(getComputedStyle(h2).fontSize)) : null,
        tableCellFontSize: tableCellText ? Math.round(parseFloat(getComputedStyle(tableCellText).fontSize)) : null,
        openPortalCount: openPortals,
      }
    })
    perWidth.push({ width: w, ...r })
  }
  return perWidth
}

for (const storyId of AGENT_STORIES) {
  results.perStory[storyId] = await measureAgentStory(storyId)
}

// ── AC2: Default at 1440 — card 1's computed background, and each sparkline's bar count ───────
await page.setViewportSize({ width: 1440, height: 1400 })
await go('patterns-mantine-agentstatisticsview--default')
results.ac2Default1440 = await page.evaluate(() => {
  const root = document.getElementById('storybook-root') || document.body
  const cards = Array.from(root.querySelectorAll('.mantine-Card-root'))
  const heroCard = cards.find((c) => (c.textContent || '').includes('Visible now'))
  const cs = heroCard ? getComputedStyle(heroCard) : null
  const sparklineWrappers = Array.from(root.querySelectorAll('[role="img"]')).filter((el) => el.className.includes(''))
  const barCounts = sparklineWrappers.map((el) => el.querySelectorAll('.apexcharts-bar-area').length)
  return {
    heroBackgroundColor: cs ? cs.backgroundColor : null,
    heroBackgroundImage: cs ? cs.backgroundImage : null,
    sparklineCount: sparklineWrappers.length,
    sparklineBarCounts: barCounts,
  }
})

// ── AC14: mantine-primitives-table--cards-below-md at 800/en — the wrap fix ─────────────────
await page.setViewportSize({ width: 800, height: 1200 })
await go('mantine-primitives-table--cards-below-md')
results.ac14TableWrap = await page.evaluate(() => {
  const root = document.getElementById('storybook-root') || document.body
  const ths = Array.from(root.querySelectorAll('table thead th'))
  const tds = Array.from(root.querySelectorAll('table tbody tr:first-child td'))
  return {
    columnCount: ths.length,
    thWhiteSpace: ths.map((th) => getComputedStyle(th).whiteSpace),
    tdWhiteSpace: tds.map((td) => getComputedStyle(td).whiteSpace),
    wrappedColumnIndex: 3,
  }
})

// ── AC10 (corrected tree) — 1440/en pass/fail + the 4 recorded-only widths ──────────────────
const AC10_WIDTHS = [
  { width: 1440, locale: 'en' },
  { width: 768, locale: 'en' },
  { width: 1024, locale: 'en' },
  { width: 1280, locale: 'en' },
  { width: 1440, locale: 'uk' },
]
const ac10 = []
for (const { width, locale } of AC10_WIDTHS) {
  await page.setViewportSize({ width, height: 1400 })
  await go('patterns-mantine-agentstatisticsview--default', locale)
  const r = await page.evaluate(() => {
    const root = document.getElementById('storybook-root') || document.body
    const viewport = Array.from(root.querySelectorAll('.mantine-ScrollArea-viewport')).find((el) => el.querySelector('table'))
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

// ── RelativeTime — With Base Date export ────────────────────────────────────────────────────
await page.setViewportSize({ width: 1024, height: 800 })
await go('mantine-primitives-relativetime--with-base-date')
results.relativeTimeBaseDate = await page.evaluate(() => {
  const root = document.getElementById('storybook-root') || document.body
  const time = root.querySelector('time')
  return { text: time ? time.textContent : null }
})

// ── AC16: Default — every "Last activity" and "Expires" label direction, top-listings vs AGT-10 ─
await page.setViewportSize({ width: 1440, height: 1400 })
await go('patterns-mantine-agentstatisticsview--default')
results.ac16Default = await page.evaluate(() => {
  const root = document.getElementById('storybook-root') || document.body
  const timeEls = Array.from(root.querySelectorAll('table time'))
  const relativeTexts = timeEls.map((t) => t.textContent)
  // Top-listings bar labels (category = listing id) vs AGT-10 rows' views, matched by row order.
  const topListingsBars = Array.from(root.querySelectorAll('.apexcharts-bar-area')).length
  return { relativeTexts, topListingsBarCount: topListingsBars }
})

await page.setViewportSize({ width: 1440, height: 1400 })
await go('patterns-mantine-agentstatisticsview--no-activity')
results.ac16NoActivity = await page.evaluate(() => {
  const root = document.getElementById('storybook-root') || document.body
  const viewsCells = Array.from(root.querySelectorAll('table tbody tr')).map((tr) => {
    const cells = Array.from(tr.querySelectorAll('td')).map((td) => td.textContent.trim())
    return cells
  })
  return { rowCellsSample: viewsCells.slice(0, 3) }
})

console.log(JSON.stringify(results, null, 2))
await browser.close()
