// Task 891 review 5, revision 4 (§21.4/§21.5) — AC30-AC37 measurements. Extended from rev3/measure.mjs.
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
const WITHCOUNTS_STORY = 'patterns-mantine-dashboarddonut--with-counts'

const results = {}

// ── AC30: row-1 alignment, AGT-05 info trigger, aria-label, tooltip content ─────────────────────
async function measureAC30(width) {
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
      const infoBtn = card.querySelector('button[aria-label]')
      const infoRect = infoBtn ? infoBtn.getBoundingClientRect() : null
      return {
        cardHeight: Math.round(rect.height),
        sparklineTop: sparklineRect ? Math.round(sparklineRect.top) : null,
        valueBottom: valueRect ? Math.round(valueRect.bottom) : null,
        valueTop: valueRect ? Math.round(valueRect.top) : null,
        infoAriaLabel: infoBtn ? infoBtn.getAttribute('aria-label') : null,
        infoTop: infoRect ? Math.round(infoRect.top) : null,
      }
    })
    return { cardCount: cards.length, cardInfo }
  })
}
results.ac30 = {}
for (const w of [1440, 1024]) results.ac30[w] = await measureAC30(w)

// Focus the AGT-05 info trigger (3rd card) and read the tooltip text.
await page.setViewportSize({ width: 1440, height: 2400 })
await go('patterns-mantine-agentstatisticsview--default')
results.ac30.agt05TooltipFocus = await page.evaluate(() => {
  const root = document.getElementById('storybook-root') || document.body
  const grid = root.querySelectorAll('.mantine-SimpleGrid-root')[0]
  const cards = grid ? Array.from(grid.children).filter((c) => c.tagName === 'DIV' && c.className.includes('mantine-Card-root')) : []
  const agt05 = cards[2]
  const btn = agt05 ? agt05.querySelector('button[aria-label]') : null
  return { found: !!btn, ariaLabel: btn ? btn.getAttribute('aria-label') : null }
})
if (results.ac30.agt05TooltipFocus.found) {
  const grid = page.locator('#storybook-root .mantine-SimpleGrid-root').first()
  const btn = grid.locator('> div.mantine-Card-root').nth(2).locator('button[aria-label]').first()
  await btn.focus()
  await page.waitForTimeout(400)
  results.ac30.agt05TooltipContent = await page.evaluate(() => {
    const tooltip = document.querySelector('.mantine-Tooltip-tooltip')
    return { text: tooltip ? tooltip.textContent : null }
  })
}

// ── AC31: DashboardCard Fill + DashboardDonut WithCounts, width contract at all 5 widths ────────
async function measureFillWidths() {
  const perWidth = []
  for (const w of ALL_WIDTHS) {
    await page.setViewportSize({ width: w, height: 1200 })
    await go(FILL_STORY)
    const r = await page.evaluate(() => {
      const root = document.getElementById('storybook-root') || document.body
      const cards = Array.from(root.querySelectorAll('.mantine-Card-root'))
      const rects = cards.map((c) => c.getBoundingClientRect())
      const stacked = rects.length === 2 ? Math.round(rects[0].left) === Math.round(rects[1].left) : null
      const bottoms = rects.map((r2) => Math.round(r2.bottom))
      const container = root.querySelector('.mantine-Flex-root, div')
      const containerWidth = container ? Math.round(container.getBoundingClientRect().width) : null
      return {
        cardCount: cards.length,
        widths: rects.map((r2) => Math.round(r2.width)),
        stackedSameLeft: stacked,
        bottoms,
        bottomsEqualWithin1: bottoms.length === 2 ? Math.abs(bottoms[0] - bottoms[1]) <= 1 : null,
        containerWidth,
      }
    })
    perWidth.push({ width: w, ...r })
  }
  return perWidth
}
results.ac31 = { fill: await measureFillWidths() }

async function measureWithCountsWidths() {
  const perWidth = []
  for (const w of ALL_WIDTHS) {
    await page.setViewportSize({ width: w, height: 900 })
    await go(WITHCOUNTS_STORY)
    const r = await page.evaluate(() => {
      const root = document.getElementById('storybook-root') || document.body
      const card = root.querySelector('.mantine-Card-root')
      const cardRect = card ? card.getBoundingClientRect() : null
      const bodyOverflow = document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
      return {
        cardWidth: cardRect ? Math.round(cardRect.width) : null,
        viewportWidth: window.innerWidth,
        bodyOverflow,
      }
    })
    perWidth.push({ width: w, ...r })
  }
  return perWidth
}
results.ac31.withCounts = await measureWithCountsWidths()

// ── AC32: GR-3b (<component w>/<parent w>) + GR-3c receipts, Fill/WithCounts/AccentWithSubstats ─
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
      const firstCard = root.querySelector('.mantine-Card-root')
      const firstCardRect = firstCard ? firstCard.getBoundingClientRect() : null
      const parentRect = firstCard && firstCard.parentElement ? firstCard.parentElement.getBoundingClientRect() : null
      return {
        rootWidth: Math.round(rootRect.width),
        viewportWidth: window.innerWidth,
        anyScrollAreaOverflow,
        bodyOverflow,
        pageTitleFontSize: h1 ? Math.round(parseFloat(getComputedStyle(h1).fontSize)) : null,
        cardTitleFontSize: h2 ? Math.round(parseFloat(getComputedStyle(h2).fontSize)) : null,
        componentW: firstCardRect ? Math.round(firstCardRect.width) : null,
        parentW: parentRect ? Math.round(parentRect.width) : null,
      }
    })
    perWidth.push({ width: w, ...r })
  }
  return perWidth
}
results.ac32 = { perStory: {} }
for (const storyId of [FILL_STORY, WITHCOUNTS_STORY, ACCENT_SUBSTATS_STORY, ...AGENT_STORIES]) {
  results.ac32.perStory[storyId] = await measureGeneric(storyId)
}

// ── AC33: record — check:locale-leak:mantine-only completion (recorded separately in the report) ─
results.ac33 = { note: 'recorded in the session log from docs/sessions/evidence/task891/rev4/check-locale-leak.txt' }

// ── AC34: hero scrollHeight <= clientHeight+1, all 4 sub-stat links inside the hero box ─────────
async function measureAC34(width) {
  await page.setViewportSize({ width, height: 2400 })
  await go('patterns-mantine-agentstatisticsview--default')
  return page.evaluate(() => {
    const root = document.getElementById('storybook-root') || document.body
    const heroCard = Array.from(root.querySelectorAll('.mantine-Card-root')).find((c) => getComputedStyle(c).backgroundImage.includes('linear-gradient'))
    if (!heroCard) return { found: false }
    const heroRect = heroCard.getBoundingClientRect()
    const links = Array.from(heroCard.querySelectorAll('a'))
    const linksInside = links.map((a) => {
      const r = a.getBoundingClientRect()
      return r.top >= heroRect.top - 1 && r.bottom <= heroRect.bottom + 1 && r.left >= heroRect.left - 1 && r.right <= heroRect.right + 1
    })
    return {
      found: true,
      scrollHeight: heroCard.scrollHeight,
      clientHeight: heroCard.clientHeight,
      withinBound: heroCard.scrollHeight <= heroCard.clientHeight + 1,
      linkCount: links.length,
      allLinksInside: linksInside.every(Boolean),
    }
  })
}
results.ac34 = {}
for (const w of [1440, 1024]) results.ac34[w] = await measureAC34(w)

// ── AC35: day cell 39x39 + month/year trigger widths (D891-1 sizes unchanged) at 1440/en ────────
// NOTE: `MantinePopover`'s dropdown is portaled to `document.body` (Mantine's shared portal node),
// NOT a descendant of `#storybook-root` — every query below searches `document`, not `root`.
await page.setViewportSize({ width: 1440, height: 1000 })
await go('mantine-primitives-rangedatepicker--open-bounded-no-value')
await page.waitForSelector('.range-day-cell', { timeout: 10000 })
results.ac35 = await page.evaluate(() => {
  const dayCell = document.querySelector('.range-day-cell')
  const dayCellBox = dayCell ? dayCell.parentElement.getBoundingClientRect() : null
  // The month/year triggers sit together in the one `Group gap="xs"` that also holds
  // `FocusTrap.InitialFocus` (a `[data-autofocus]` sibling) — distinguishes them from the
  // range-summary field, which is also `readonly` but lives in a different Group.
  const selectorGroup = Array.from(document.querySelectorAll('.mantine-Group-root')).find((g) => g.querySelector('[data-autofocus]'))
  const combos = selectorGroup ? Array.from(selectorGroup.querySelectorAll('.mantine-Input-input[readonly]')) : []
  const triggerWidths = combos.map((el) => Math.round(el.getBoundingClientRect().width))
  const clearLink = Array.from(document.querySelectorAll('button, a')).find((el) => (el.textContent || '').trim() === 'Clear')
  return {
    dayCellSize: dayCellBox ? { w: Math.round(dayCellBox.width), h: Math.round(dayCellBox.height) } : null,
    triggerWidths,
    clearLinkFound: !!clearLink,
    clearLinkText: clearLink ? clearLink.textContent.trim() : null,
  }
})

// sq day aria-label contains an Albanian month name.
await go('mantine-primitives-rangedatepicker--open-bounded-no-value', 'sq')
await page.waitForSelector('.range-day-cell', { timeout: 10000 })
results.ac35.sqAriaLabel = await page.evaluate(() => {
  const cell = document.querySelector('.range-day-cell[data-boundary], .range-day-cell:not(:disabled)')
  return { sample: cell ? cell.getAttribute('aria-label') : null }
})

// Story picker width: parent width at 320/390, compactTrigger (280px) at 1024/1440.
results.ac35.storyWidths = {}
for (const w of [320, 390, 1024, 1440]) {
  await page.setViewportSize({ width: w, height: 800 })
  await go('mantine-primitives-rangedatepicker--default')
  results.ac35.storyWidths[w] = await page.evaluate(() => {
    const root = document.getElementById('storybook-root') || document.body
    const trigger = root.querySelector('.mantine-Input-wrapper')
    const rect = trigger ? trigger.getBoundingClientRect() : null
    return { width: rect ? Math.round(rect.width) : null, viewportWidth: window.innerWidth }
  })
}

// ── AC36: OpenBoundedNoValue trigger centring, grid centring, right-month, focus, mobile scroll ─
await page.setViewportSize({ width: 1440, height: 1000 })
await go('mantine-primitives-rangedatepicker--open-bounded-no-value')
await page.waitForSelector('.range-day-cell', { timeout: 10000 })
results.ac36 = await page.evaluate(() => {
  const trigger = document.querySelector('button.mantine-TextInput-input')
  const triggerRect = trigger ? trigger.getBoundingClientRect() : null
  const triggerTextEl = trigger ? Array.from(trigger.querySelectorAll('*')).find((el) => (el.textContent || '').trim().length > 0 && el.children.length === 0) : null
  const triggerTextRect = triggerTextEl ? triggerTextEl.getBoundingClientRect() : null
  // Anchor the whole header traversal on the `[data-autofocus]` span (`FocusTrap.InitialFocus`),
  // which sits inside the month/year `Group` → the left column `Group` → the header `Group`.
  // Nesting (post-redesign): Group(xl)[ Group(xs)[ArrowIcon, Center(w=columnWidth)[selectorGroup]], Group(xs)[Center(w=columnWidth)[label], ArrowIcon] ]
  const focusAnchor = document.querySelector('[data-autofocus]')
  const selectorGroup = focusAnchor ? focusAnchor.closest('.mantine-Group-root') : null
  const leftCenterBox = selectorGroup ? selectorGroup.parentElement : null
  const leftBlock = leftCenterBox ? leftCenterBox.parentElement : null
  const headerRow = leftBlock ? leftBlock.parentElement : null
  const rightBlock = headerRow ? Array.from(headerRow.children).find((c) => c !== leftBlock) : null
  const rightCenterBox = rightBlock ? Array.from(rightBlock.children).find((c) => c.tagName !== 'BUTTON') : null
  const rightLabel = rightCenterBox ? rightCenterBox.firstElementChild : null
  const grids = Array.from(document.querySelectorAll('.mantine-Flex-root')).filter((f) => f.querySelector('.range-day-cell'))
  const leftGrid = grids[0]
  const rightGrid = grids[1]
  function centerX(el) {
    if (!el) return null
    const r = el.getBoundingClientRect()
    return r.left + r.width / 2
  }
  const activeIsSummary = (() => {
    const summary = document.querySelector('input[readonly]')
    return document.activeElement === summary
  })()
  return {
    triggerTextCenterY: triggerTextRect ? Math.round(triggerTextRect.top + triggerTextRect.height / 2) : null,
    triggerCenterY: triggerRect ? Math.round(triggerRect.top + triggerRect.height / 2) : null,
    selectorGroupCenterX: selectorGroup ? Math.round(centerX(selectorGroup)) : null,
    leftGridCenterX: leftGrid ? Math.round(centerX(leftGrid)) : null,
    rightLabelCenterX: rightLabel ? Math.round(centerX(rightLabel)) : null,
    rightGridCenterX: rightGrid ? Math.round(centerX(rightGrid)) : null,
    rightMonthLabelText: rightLabel ? rightLabel.textContent : null,
    activeElementIsSummaryInput: activeIsSummary,
    activeElementTag: document.activeElement ? document.activeElement.tagName : null,
    activeElementHasAutofocus: document.activeElement ? document.activeElement.hasAttribute('data-autofocus') : null,
  }
})

// Also re-focus the trigger to re-open, then value the trigger text-centring WITH a value staged
// (per AC36 "closed, and with a value") — commit a range first via a fresh render.
results.ac36.withValueTriggerCentre = await (async () => {
  await go('mantine-primitives-rangedatepicker--default')
  return page.evaluate(() => {
    const root = document.getElementById('storybook-root') || document.body
    // second demo row (staged range spanning two months) — its trigger already shows text.
    const wrappers = Array.from(root.querySelectorAll('.mantine-Input-wrapper'))
    const withValue = wrappers.find((w) => /\d{2}\.\d{2}\.\d{4}/.test(w.textContent || ''))
    const trigger = withValue ? withValue.querySelector('button.mantine-TextInput-input') : null
    const triggerRect = trigger ? trigger.getBoundingClientRect() : null
    const textEl = trigger ? Array.from(trigger.querySelectorAll('*')).find((el) => (el.textContent || '').trim().length > 0 && el.children.length === 0) : null
    const textRect = textEl ? textEl.getBoundingClientRect() : null
    return {
      found: !!trigger,
      triggerCenterY: triggerRect ? Math.round(triggerRect.top + triggerRect.height / 2) : null,
      textCenterY: textRect ? Math.round(textRect.top + textRect.height / 2) : null,
    }
  })
})()

// Mobile (390): bottom sheet opens scrolled to September 2026 section — closest section whose
// own offset (relative to the scroll viewport) matches the viewport's actual `scrollTop`, the
// same logic `MobileBody`'s own `handleScrollPositionChange` uses.
await page.setViewportSize({ width: 390, height: 800 })
await go('mantine-primitives-rangedatepicker--open-bounded-no-value')
await page.waitForSelector('.mantine-ScrollArea-viewport', { timeout: 10000 }).catch(() => {})
await page.waitForTimeout(600)
results.ac36.mobile390 = await page.evaluate(() => {
  const viewport = document.querySelector('.mantine-ScrollArea-viewport')
  if (!viewport) return { found: false }
  const sections = Array.from(viewport.querySelectorAll('p')).filter((p) => /\d{4}/.test(p.textContent || ''))
  const vr = viewport.getBoundingClientRect()
  let best = null
  let bestDelta = Infinity
  for (const p of sections) {
    const offsetTop = p.getBoundingClientRect().top - vr.top + viewport.scrollTop
    const delta = Math.abs(offsetTop - viewport.scrollTop)
    if (delta < bestDelta) {
      bestDelta = delta
      best = p
    }
  }
  return { found: true, scrollTop: viewport.scrollTop, visibleSectionTitle: best ? best.textContent : null }
})

// Same trigger-centring check on AgentStatisticsView Default with Custom selected. The period
// control is a Mantine `SegmentedControl` (a `<label>` per option, not a `<button>`).
await page.setViewportSize({ width: 1440, height: 2400 })
await go('patterns-mantine-agentstatisticsview--default')
results.ac36.agentStatisticsCustom = await page.evaluate(() => {
  const root = document.getElementById('storybook-root') || document.body
  const customLabel = Array.from(root.querySelectorAll('label')).find((l) => (l.textContent || '').trim() === 'Custom')
  return { customLabelFound: !!customLabel }
})
if (results.ac36.agentStatisticsCustom.customLabelFound) {
  await page.locator('label').filter({ hasText: /^Custom$/ }).first().click()
  await page.waitForTimeout(500)
  results.ac36.agentStatisticsCustomTrigger = await page.evaluate(() => {
    const root = document.getElementById('storybook-root') || document.body
    const trigger = Array.from(root.querySelectorAll('button.mantine-TextInput-input')).find((b) => b.getAttribute('placeholder') || (b.textContent || '').length > 0)
    if (!trigger) return { found: false }
    const triggerRect = trigger.getBoundingClientRect()
    const textEl = Array.from(trigger.querySelectorAll('*')).find((el) => (el.textContent || '').trim().length > 0 && el.children.length === 0)
    const textRect = textEl ? textEl.getBoundingClientRect() : null
    return {
      found: true,
      triggerCenterY: Math.round(triggerRect.top + triggerRect.height / 2),
      textCenterY: textRect ? Math.round(textRect.top + textRect.height / 2) : null,
    }
  })
}

console.log(JSON.stringify(results, null, 2))
await browser.close()
