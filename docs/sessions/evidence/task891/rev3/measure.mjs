// Task 891 review 4, revision 3 (§20.4/§20.5) — AC23-AC29. Extended from rev2/measure.mjs.
import { chromium } from 'playwright'

const BASE = process.env.SB_BASE || 'http://127.0.0.1:6323'
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
const ACCENT_SUBSTATS_STORY = 'patterns-mantine-dashboardstatcard--accent-with-substats'
const FILL_STORY = 'patterns-mantine-dashboardcard--fill'

const results = {}

// ── AC23: row 1, 3 StatCards, sparkline-beside-value, no duplicate tooltip text ─────────────────
async function measureRow1(width) {
  await page.setViewportSize({ width, height: 2400 })
  await go('patterns-mantine-agentstatisticsview--default')
  return page.evaluate(() => {
    const root = document.getElementById('storybook-root') || document.body
    const grid = root.querySelectorAll('.mantine-SimpleGrid-root')[0]
    const cards = grid ? Array.from(grid.children).filter((c) => c.tagName === 'DIV' && c.className.includes('mantine-Card-root')) : []
    const cardInfo = cards.map((card) => {
      const rect = card.getBoundingClientRect()
      const sparkline = card.querySelector('[role="img"]')
      const sparklineRect = sparkline ? sparkline.getBoundingClientRect() : null
      const boldValue = Array.from(card.querySelectorAll('p')).find((p) => getComputedStyle(p).fontWeight === '700')
      const valueRect = boldValue ? boldValue.getBoundingClientRect() : null
      const bodyText = card.textContent || ''
      const visibleTooltipDuplicate = bodyText.includes('confirm a message') || bodyText.includes('confirm email')
      return {
        cardHeight: Math.round(rect.height),
        sparklineTop: sparklineRect ? Math.round(sparklineRect.top) : null,
        valueBottom: valueRect ? Math.round(valueRect.bottom) : null,
        besideNotUnder: sparklineRect && valueRect ? sparklineRect.top < valueRect.bottom : null,
        visibleTooltipDuplicate,
      }
    })
    return { cardCount: cards.length, cardInfo }
  })
}
results.ac23 = {}
for (const w of [1440, 1024]) results.ac23[w] = await measureRow1(w)

// ── AC24: hero position, substat hrefs, no StatRows in portfolio card ───────────────────────────
async function measureAC24(width) {
  await page.setViewportSize({ width, height: 2400 })
  await go('patterns-mantine-agentstatisticsview--default')
  return page.evaluate(() => {
    const root = document.getElementById('storybook-root') || document.body
    const heroCard = Array.from(root.querySelectorAll('.mantine-Card-root')).find((c) => getComputedStyle(c).backgroundImage.includes('linear-gradient'))
    const heroParent = heroCard ? heroCard.parentElement : null
    // Mantine injects a `<style>` runtime CSS-vars tag as an actual DOM child alongside real
    // elements — filter to DIV children (the real Cards) before checking "first child".
    const heroIsFirstChild = heroParent ? Array.from(heroParent.children).filter((c) => c.tagName === 'DIV')[0] === heroCard : null
    const substatLinks = heroCard ? Array.from(heroCard.querySelectorAll('a')) : []
    const hrefs = substatLinks.map((a) => a.getAttribute('href'))
    const portfolioCard = Array.from(root.querySelectorAll('.mantine-Card-root')).find((c) => (c.querySelector('h2')?.textContent || '').toLowerCase().includes('portfolio'))
    const statRowsInPortfolio = portfolioCard ? portfolioCard.querySelectorAll('a[href*="cabinet?tab=listings"]').length : null
    const bodyOverflow = document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    return { heroFound: !!heroCard, heroIsFirstChild, substatLinkCount: substatLinks.length, hrefs, statRowsInPortfolioCard: statRowsInPortfolio, bodyOverflow }
  })
}
results.ac24 = { at1440: await measureAC24(1440) }
// AccentWithSubstats renders with no overflow at 320 and 1440.
results.ac24.accentWithSubstatsOverflow = {}
for (const w of [320, 1440]) {
  await page.setViewportSize({ width: w, height: 800 })
  await go(ACCENT_SUBSTATS_STORY)
  results.ac24.accentWithSubstatsOverflow[w] = await page.evaluate(() => {
    const root = document.getElementById('storybook-root') || document.body
    return {
      bodyOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      anchorCount: root.querySelectorAll('a').length,
    }
  })
}

// ── AC25: row2/row3 bottom alignment, activity card body, header tooltip content, <lg stacking ──
async function measureAC25(width) {
  await page.setViewportSize({ width, height: 2400 })
  await go('patterns-mantine-agentstatisticsview--default')
  return page.evaluate(() => {
    const root = document.getElementById('storybook-root') || document.body
    const titled = Array.from(root.querySelectorAll('.mantine-Card-root')).filter((c) => c.querySelector('h2'))
    const byTitle = (needle) => titled.find((c) => (c.querySelector('h2')?.textContent || '').toLowerCase().includes(needle))
    const activityCard = byTitle('activity')
    const agt01Card = byTitle('needs my action') || byTitle('action')
    const topListingsCard = byTitle('top listings')
    const portfolioCard = byTitle('portfolio')
    const bottomOf = (el) => (el ? Math.round(el.getBoundingClientRect().bottom) : null)
    const activityBodyText = activityCard ? activityCard.textContent || '' : ''
    const hasDescriptionParagraph = activityBodyText.includes('de-duplication') || activityBodyText.includes('does not confirm')
    return {
      activityBottom: bottomOf(activityCard),
      agt01Bottom: bottomOf(agt01Card),
      topListingsBottom: bottomOf(topListingsCard),
      portfolioBottom: bottomOf(portfolioCard),
      activityHasDescriptionParagraph: hasDescriptionParagraph,
      bodyOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    }
  })
}
results.ac25 = {}
for (const w of [1440, 1024]) results.ac25[w] = await measureAC25(w)

// Open the activity card's header info tooltip and read its content.
await page.setViewportSize({ width: 1440, height: 2400 })
await go('patterns-mantine-agentstatisticsview--default')
// Find the specific header info ActionIcon inside the activity card by aria-label text match.
results.ac25.headerTooltip = await page.evaluate(() => {
  const root = document.getElementById('storybook-root') || document.body
  const titled = Array.from(root.querySelectorAll('.mantine-Card-root')).filter((c) => c.querySelector('h2'))
  const activityCard = titled.find((c) => (c.querySelector('h2')?.textContent || '').toLowerCase().includes('activity'))
  const icon = activityCard ? activityCard.querySelector('button[aria-label]') : null
  return { found: !!icon, ariaLabel: icon ? icon.getAttribute('aria-label') : null }
})
if (results.ac25.headerTooltip.found) {
  const btn = page.locator('.mantine-Card-root:has(h2)').filter({ hasText: 'Activity' }).locator('button[aria-label]').first()
  await btn.focus()
  await page.waitForTimeout(400)
  results.ac25.headerTooltipContent = await page.evaluate(() => {
    const tooltip = document.querySelector('.mantine-Tooltip-tooltip')
    return { text: tooltip ? tooltip.textContent : null }
  })
}

// Below lg (1024): every card stacks in one column, body overflow false.
results.ac25.belowLg = {}
for (const w of [320, 390, 768]) {
  await page.setViewportSize({ width: w, height: 4000 })
  await go('patterns-mantine-agentstatisticsview--default')
  results.ac25.belowLg[w] = await page.evaluate(() => ({
    bodyOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  }))
}

// ── AC26: donut centring + legend counts + hero/donut visible-count match ───────────────────────
await page.setViewportSize({ width: 1440, height: 2400 })
await go('patterns-mantine-agentstatisticsview--default')
results.ac26 = await page.evaluate(() => {
  const root = document.getElementById('storybook-root') || document.body
  const titled = Array.from(root.querySelectorAll('.mantine-Card-root')).filter((c) => c.querySelector('h2'))
  const portfolioCard = titled.find((c) => (c.querySelector('h2')?.textContent || '').toLowerCase().includes('portfolio'))
  const centerEl = portfolioCard.querySelector('.mantine-Center-root')
  const groupEl = centerEl ? centerEl.querySelector('.mantine-Group-root') : null
  const cardRect = portfolioCard.getBoundingClientRect()
  const cs = getComputedStyle(portfolioCard)
  const contentLeft = cardRect.left + parseFloat(cs.paddingLeft)
  const contentRight = cardRect.right - parseFloat(cs.paddingRight)
  const groupRect = groupEl ? groupEl.getBoundingClientRect() : null
  const legendButtons = Array.from(portfolioCard.querySelectorAll('button[aria-pressed]')).map((b) => b.textContent)
  const heroCard = Array.from(root.querySelectorAll('.mantine-Card-root')).find((c) => getComputedStyle(c).backgroundImage.includes('linear-gradient'))
  const heroValue = heroCard ? Array.from(heroCard.querySelectorAll('p')).find((p) => getComputedStyle(p).fontWeight === '700')?.textContent : null
  return {
    leftGap: groupRect ? Math.round(groupRect.left - contentLeft) : null,
    rightGap: groupRect ? Math.round(contentRight - groupRect.right) : null,
    legendButtons,
    heroValue,
  }
})

// ── AC28: 853 AdminDashboardView unaffected — live heights, default (no new props) path ─────────
await page.setViewportSize({ width: 1440, height: 3000 })
await go('patterns-mantine-admindashboardview--default')
results.ac28 = await page.evaluate(() => {
  const root = document.getElementById('storybook-root') || document.body
  const cards = Array.from(root.querySelectorAll('.mantine-Card-root')).filter((c) => c.tagName === 'DIV')
  return { cardCount: cards.length, heights: cards.map((c) => Math.round(c.getBoundingClientRect().height)) }
})

// ── AC29: GR-3b/GR-3c per changed export — all 8 AgentStatisticsView + AccentWithSubstats + Fill ─
async function measureGeneric(storyId) {
  const perWidth = []
  for (const w of ALL_WIDTHS) {
    await page.setViewportSize({ width: w, height: 2400 })
    await go(storyId)
    const r = await page.evaluate(() => {
      const root = document.getElementById('storybook-root') || document.body
      const rootRect = root.getBoundingClientRect()
      const tableScrollAreas = Array.from(root.querySelectorAll('.mantine-ScrollArea-viewport')).filter((el) => el.querySelector('table'))
      const anyScrollAreaOverflow = tableScrollAreas.some((el) => el.scrollWidth > el.clientWidth + 1)
      const bodyOverflow = document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
      const h1 = root.querySelector('h1')
      const h2 = root.querySelector('h2')
      const topRow = root.querySelectorAll('.mantine-SimpleGrid-root')[0]
      const kpiCards = topRow ? Array.from(topRow.children).filter((c) => c.tagName === 'DIV' && c.className.includes('mantine-Card-root')) : []
      const kpiValueFontSizes = kpiCards.map((card) => {
        const bold = Array.from(card.querySelectorAll('p')).find((p) => getComputedStyle(p).fontWeight === '700')
        return bold ? Math.round(parseFloat(getComputedStyle(bold).fontSize)) : null
      })
      return {
        rootWidth: Math.round(rootRect.width),
        viewportWidth: window.innerWidth,
        anyScrollAreaOverflow,
        bodyOverflow,
        pageTitleFontSize: h1 ? Math.round(parseFloat(getComputedStyle(h1).fontSize)) : null,
        cardTitleFontSize: h2 ? Math.round(parseFloat(getComputedStyle(h2).fontSize)) : null,
        kpiValueFontSizes,
      }
    })
    perWidth.push({ width: w, ...r })
  }
  return perWidth
}
results.ac29 = { perStory: {} }
for (const storyId of AGENT_STORIES) results.ac29.perStory[storyId] = await measureGeneric(storyId)
results.ac29.perStory[ACCENT_SUBSTATS_STORY] = await measureGeneric(ACCENT_SUBSTATS_STORY)
results.ac29.perStory[FILL_STORY] = await measureGeneric(FILL_STORY)

// ── AC27 cross-check (unchanged since rev2): bars vs rows + KPI totals, at 1440/en ──────────────
async function crossCheckStory(storyId) {
  await page.setViewportSize({ width: 1440, height: 2400 })
  await go(storyId)
  const agt10Rows = await page.evaluate(() => {
    const root = document.getElementById('storybook-root') || document.body
    const rows = Array.from(root.querySelectorAll('table tbody tr'))
    return rows.map((tr) => {
      const titleEl = tr.querySelector('td:first-child a, td:first-child p')
      const cells = Array.from(tr.querySelectorAll('td')).map((td) => td.textContent.trim())
      return { title: titleEl ? titleEl.textContent.trim() : null, cells }
    })
  })
  const agt10ViewsByTitle = new Map(agt10Rows.map((r) => [r.title, r.cells[4]]))
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
    return { title, barValue, agt10Views, equal: barValue !== null && agt10Views !== null && barValue === agt10Views }
  })
  const kpiValues = await page.evaluate(() => {
    const root = document.getElementById('storybook-root') || document.body
    const topRow = root.querySelectorAll('.mantine-SimpleGrid-root')[0]
    const cards = topRow ? Array.from(topRow.children).filter((c) => c.tagName === 'DIV' && c.className.includes('mantine-Card-root')) : []
    return cards.map((card) => {
      const bold = Array.from(card.querySelectorAll('p')).find((p) => getComputedStyle(p).fontWeight === '700')
      return bold ? bold.textContent.trim() : null
    })
  })
  const kpiNumbers = kpiValues.map((v) => (v ? Number(v.replace(/[^\d-]/g, '')) : null))
  return { barVsRow, kpiNumbers }
}
results.ac27 = {
  default: await crossCheckStory('patterns-mantine-agentstatisticsview--default'),
  activityStale: await crossCheckStory('patterns-mantine-agentstatisticsview--activity-stale'),
  sortedByViews: await crossCheckStory('patterns-mantine-agentstatisticsview--sorted-by-views'),
  expectedTotals: { default: { views: 103, whatsapp: 9, forms: 3 }, sortedByViews: { views: 1550, whatsapp: 55, forms: 9 } },
}

console.log(JSON.stringify(results, null, 2))
await browser.close()
