// Task 891 review 2, F8 — the complete GR-3b/GR-3c measurement set review 1 (F5) left incomplete:
// the table/RelativeTime Stories at all 5 widths, the KPI value font sizes, the open-select-portal
// check, and (F7/AC19) a live cross-check that every top-listings bar value equals its listing's
// AGT-10 Views cell, and every KPI value equals the sum of that export's by-listing metric.
import { chromium } from 'playwright'

const BASE = process.env.SB_BASE || 'http://127.0.0.1:6322'
const browser = await chromium.launch()
const page = await browser.newPage()

async function go(id, locale = 'en') {
  await page.goto(`${BASE}/iframe.html?id=${id}&viewMode=story&globals=locale:${locale}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(700)
}

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
const TABLE_STORY = 'mantine-primitives-table--cards-below-md'
const RELATIVETIME_STORY = 'mantine-primitives-relativetime--with-base-date'

const results = { perStory: {} }

// ── generic per-export × per-width measurement (F8) ──────────────────────────────────────────
async function measureGeneric(storyId) {
  const perWidth = []
  for (const w of ALL_WIDTHS) {
    await page.setViewportSize({ width: w, height: 1400 })
    await go(storyId)
    const r = await page.evaluate(() => {
      const root = document.getElementById('storybook-root') || document.body
      const rootRect = root.getBoundingClientRect()
      const tableScrollAreas = Array.from(root.querySelectorAll('.mantine-ScrollArea-viewport')).filter((el) => el.querySelector('table'))
      const scrollAreaReadings = tableScrollAreas.map((el) => ({ scrollWidth: el.scrollWidth, clientWidth: el.clientWidth, overflow: el.scrollWidth > el.clientWidth + 1 }))
      const anyScrollAreaOverflow = scrollAreaReadings.some((r2) => r2.overflow)
      const bodyOverflow = document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
      const h1 = root.querySelector('h1')
      const h2 = root.querySelector('h2')
      // KPI values: the bold (fw:700) <p> text inside each Card of the first SimpleGrid row (top row).
      const topRow = root.querySelector('.mantine-SimpleGrid-root')
      const kpiCards = topRow ? Array.from(topRow.querySelectorAll('.mantine-Card-root')) : []
      const kpiValues = kpiCards.map((card) => {
        const bold = Array.from(card.querySelectorAll('p')).find((p) => getComputedStyle(p).fontWeight === '700')
        return bold ? { text: bold.textContent, fontSize: Math.round(parseFloat(getComputedStyle(bold).fontSize)) } : null
      })
      const tableCellText = root.querySelector('.mantine-Table-td p, table tbody tr td p') || root.querySelector('time')
      const openPortals = Array.from(document.querySelectorAll('.mantine-Portal, [data-portal]')).length
      return {
        rootWidth: Math.round(rootRect.width),
        viewportWidth: window.innerWidth,
        scrollAreaReadings,
        anyScrollAreaOverflow,
        bodyOverflow,
        pageTitleFontSize: h1 ? Math.round(parseFloat(getComputedStyle(h1).fontSize)) : null,
        cardTitleFontSize: h2 ? Math.round(parseFloat(getComputedStyle(h2).fontSize)) : null,
        kpiValueFontSizes: kpiValues.map((v) => (v ? v.fontSize : null)),
        kpiValueCount: kpiCards.length,
        tableCellFontSize: tableCellText ? Math.round(parseFloat(getComputedStyle(tableCellText).fontSize)) : null,
        openPortalCount: openPortals,
      }
    })
    perWidth.push({ width: w, ...r })
  }
  return perWidth
}

for (const storyId of AGENT_STORIES) {
  results.perStory[storyId] = await measureGeneric(storyId)
}
results.perStory[TABLE_STORY] = await measureGeneric(TABLE_STORY)
results.perStory[RELATIVETIME_STORY] = await measureGeneric(RELATIVETIME_STORY)

// ── open-select-portal check: Default's AGT-10 status filter, 320 and 1440/en ───────────────
async function openStatusFilter(width) {
  await page.setViewportSize({ width, height: 1400 })
  await go('patterns-mantine-agentstatisticsview--default')
  const trigger = page.locator('input[placeholder="Status"]').first()
  await trigger.click()
  await page.waitForTimeout(350)
  const opened = await page.evaluate(() => {
    // The mobile path renders a Drawer whose listbox exists but is visually suppressed
    // (`dropdownOpened={false}`) — pick the first candidate with real, non-zero geometry, not the
    // first DOM match.
    const candidates = [
      ...document.querySelectorAll('[role="listbox"]'),
      ...document.querySelectorAll('.mantine-Combobox-dropdown'),
      ...document.querySelectorAll('.mantine-Drawer-content'),
      ...document.querySelectorAll('.mantine-Modal-content'),
    ]
    const bodyOverflow = document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    const dropdown = candidates.find((el) => {
      const r = el.getBoundingClientRect()
      return r.width > 0 && r.height > 0
    })
    if (!dropdown) {
      return {
        found: false,
        bodyOverflow,
        candidateCount: candidates.length,
        candidateRects: candidates.map((el) => {
          const r = el.getBoundingClientRect()
          return { className: el.className, width: Math.round(r.width), height: Math.round(r.height) }
        }),
      }
    }
    const r = dropdown.getBoundingClientRect()
    return {
      found: true,
      tag: dropdown.className,
      rect: { left: Math.round(r.left), top: Math.round(r.top), right: Math.round(r.right), bottom: Math.round(r.bottom), width: Math.round(r.width), height: Math.round(r.height) },
      viewport: { width: window.innerWidth, height: window.innerHeight },
      insideViewportX: r.left >= -1 && r.right <= window.innerWidth + 1,
      bodyOverflow,
    }
  })
  await page.keyboard.press('Escape')
  await page.waitForTimeout(200)
  return opened
}
results.selectPortal320 = await openStatusFilter(320)
results.selectPortal1440 = await openStatusFilter(1440)

// ── AC19: bar value vs AGT-10 Views cell + KPI value vs by-listing total, 1440/en ────────────
async function crossCheckStory(storyId) {
  await page.setViewportSize({ width: 1440, height: 1400 })
  await go(storyId)

  // AGT-10 rows: title -> views cell text.
  const agt10Rows = await page.evaluate(() => {
    const root = document.getElementById('storybook-root') || document.body
    const rows = Array.from(root.querySelectorAll('table tbody tr'))
    return rows.map((tr) => {
      const titleEl = tr.querySelector('td:first-child a, td:first-child p')
      const cells = Array.from(tr.querySelectorAll('td')).map((td) => td.textContent.trim())
      return { title: titleEl ? titleEl.textContent.trim() : null, cells }
    })
  })
  // Views is column index 4 (title/status/visibility/expires/views/...).
  const agt10ViewsByTitle = new Map(agt10Rows.map((r) => [r.title, r.cells[4]]))

  // Top-listings chart: the bar-area group with 1..5 bars (never the 30-bar sparklines).
  const chartScope = await page.evaluate(() => {
    const root = document.getElementById('storybook-root') || document.body
    const canvases = Array.from(root.querySelectorAll('.apexcharts-canvas'))
    const idx = canvases.findIndex((c) => {
      const n = c.querySelectorAll('.apexcharts-bar-area').length
      return n > 0 && n <= 5
    })
    return { canvasIndex: idx, barCount: idx >= 0 ? canvases[idx].querySelectorAll('.apexcharts-bar-area').length : 0 }
  })

  const bars = []
  if (chartScope.canvasIndex >= 0) {
    const canvasLocator = page.locator('#storybook-root .apexcharts-canvas').nth(chartScope.canvasIndex)
    for (let i = 0; i < chartScope.barCount; i++) {
      const barLocator = canvasLocator.locator('.apexcharts-bar-area').nth(i)
      // `.hover()` auto-scrolls the bar into view first — the chart card sits below the fold at
      // 1400px viewport height, so a raw `page.mouse.move` to an off-screen y coordinate silently
      // misses the element (the review-2 bug this fixes: bars 4-5 always read null).
      let tooltip = null
      for (let attempt = 0; attempt < 3 && !tooltip; attempt++) {
        await page.mouse.move(5, 5)
        await page.waitForTimeout(80)
        await barLocator.hover({ force: true })
        await page.waitForTimeout(500)
        tooltip = await page.evaluate(() => {
          const tt = document.querySelector('.apexcharts-tooltip.apexcharts-active')
          if (!tt) return null
          const title = tt.querySelector('.apexcharts-tooltip-title')
          const value = tt.querySelector('.apexcharts-tooltip-text-y-value')
          return { title: title ? title.textContent.trim() : null, value: value ? value.textContent.trim() : null }
        })
      }
      bars.push({ barIndex: i, tooltip })
    }
  }

  const barVsRow = bars.map((b) => {
    const title = b.tooltip?.title ?? null
    const barValueRaw = b.tooltip?.value ?? null
    const barValue = barValueRaw ? Number(barValueRaw.replace(/[^\d-]/g, '')) : null
    const agt10ViewsRaw = title ? agt10ViewsByTitle.get(title) ?? null : null
    const agt10Views = agt10ViewsRaw ? Number(agt10ViewsRaw.replace(/[^\d-]/g, '')) : null
    return { title, barValueRaw, barValue, agt10ViewsRaw, agt10Views, equal: barValue !== null && agt10Views !== null && barValue === agt10Views }
  })

  // KPI values: hero (AGT-02, not activity-derived) is card 0; cards 1-3 are views/whatsapp/forms.
  const kpiValues = await page.evaluate(() => {
    const root = document.getElementById('storybook-root') || document.body
    const topRow = root.querySelector('.mantine-SimpleGrid-root')
    const cards = topRow ? Array.from(topRow.querySelectorAll('.mantine-Card-root')) : []
    return cards.map((card) => {
      const bold = Array.from(card.querySelectorAll('p')).find((p) => getComputedStyle(p).fontWeight === '700')
      return bold ? bold.textContent.trim() : null
    })
  })
  const kpiNumbers = kpiValues.map((v) => (v ? Number(v.replace(/[^\d-]/g, '')) : null))

  return { agt10RowCount: agt10Rows.length, chartScope, barVsRow, kpiValuesRaw: kpiValues, kpiNumbers }
}

results.ac19Default = await crossCheckStory('patterns-mantine-agentstatisticsview--default')
results.ac19ActivityStale = await crossCheckStory('patterns-mantine-agentstatisticsview--activity-stale')
results.ac19SortedByViews = await crossCheckStory('patterns-mantine-agentstatisticsview--sorted-by-views')

// Known by-listing totals (computed directly from the fixture source arrays — see the session log's
// F7 section for the derivation): CANONICAL_BY_LISTING (Default/ActivityStale) = 103/9/3;
// SORTED_BY_LISTING (SortedByViews) = 1550/55/9. kpiNumbers index 0 is the AGT-02 hero (not
// activity-derived — excluded); indices 1-3 are views/whatsapp/forms.
results.ac19ExpectedTotals = {
  default: { views: 103, whatsapp: 9, forms: 3 },
  activityStale: { views: 103, whatsapp: 9, forms: 3 },
  sortedByViews: { views: 1550, whatsapp: 55, forms: 9 },
}

console.log(JSON.stringify(results, null, 2))
await browser.close()
