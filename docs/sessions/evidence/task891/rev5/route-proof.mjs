// Task 891 review 6, revision 5 — AC38 route proof: /en/listings' real RangeDatePicker (not the
// Storybook fixture) shows the same day-cell colours now that range-date-picker-chrome.css loads
// wherever the component renders (it already loaded in src/app/layout.tsx; F15 only fixed the
// Storybook gap). Runs against `npm run start` (production build), not `next dev`.
import { chromium } from 'playwright'

const BASE = process.env.APP_BASE || 'http://localhost:3000'
const browser = await chromium.launch()
const results = {}

async function probe(width) {
  const page = await browser.newPage()
  await page.setViewportSize({ width, height: 1000 })
  await page.goto(`${BASE}/en/listings`, { waitUntil: 'networkidle' })

  // Open the Advanced-filters drawer, scroll its own internal scroll region to the bottom (the
  // "Posting period" accordion section sits below the fold), expand that section (Mantine
  // Accordion — its RangeDatePicker only mounts once open), then open the calendar. Every step
  // uses a native `el.click()` dispatch (a real click event React's root listener picks up),
  // sidestepping Playwright actionability flakiness against this drawer's own mount/scroll
  // transitions (confirmed via direct DOM inspection, debug-filters-*.mjs probes).
  const openedFilters = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(
      (b) => (b.textContent || '').includes('Advanced filters') || b.getAttribute('aria-label') === 'Advanced filters',
    )
    if (!btn) return false
    btn.click()
    return true
  })
  if (!openedFilters) return { width, found: false, reason: 'no Advanced filters trigger found' }
  await page.waitForTimeout(700)

  await page.evaluate(() => {
    const d = document.querySelector('[role="dialog"]')
    if (!d) return
    const scrollables = Array.from(d.querySelectorAll('*')).filter((el) => el.scrollHeight > el.clientHeight + 10)
    scrollables.forEach((el) => {
      el.scrollTop = el.scrollHeight
    })
  })
  await page.waitForTimeout(500)

  const expandedSection = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => (b.textContent || '').trim() === 'Posting period')
    if (!btn) return false
    btn.click()
    return true
  })
  if (!expandedSection) return { width, found: false, reason: 'Posting period accordion section not found' }
  await page.waitForTimeout(500)

  let trigger = await page.$('button[aria-haspopup="dialog"].mantine-Input-input')
  if (!trigger) {
    return { width, found: false, reason: 'no date-range trigger found after expanding Posting period' }
  }
  await page.evaluate((el) => el.click(), trigger)
  await page.waitForTimeout(500)
  await page.waitForSelector('.range-day-cell', { timeout: 10000 }).catch(() => {})

  const data = await page.evaluate(() => {
    function tokenVar(name) {
      return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
    }
    function resolveColorToken(raw) {
      const probe = document.createElement('div')
      probe.style.color = raw
      document.body.appendChild(probe)
      const resolved = getComputedStyle(probe).color
      probe.remove()
      return resolved
    }
    const tokens = {
      gray3: resolveColorToken(tokenVar('--mantine-color-gray-3')),
      gray7: resolveColorToken(tokenVar('--mantine-color-gray-7')),
    }
    const cells = Array.from(document.querySelectorAll('.range-day-cell'))
    const today = new Date()
    const iso = (d) => d.toISOString().slice(0, 10)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const blockedCandidate = cells.find((c) => c.getAttribute('data-date') === iso(tomorrow) && c.getAttribute('data-blocked') === 'true')
    const availableCandidate = cells.find((c) => c.getAttribute('data-blocked') !== 'true' && c.getAttribute('data-in-month') === 'true')
    function readCell(cell) {
      if (!cell) return { found: false }
      const cs = getComputedStyle(cell)
      return { found: true, date: cell.getAttribute('data-date'), color: cs.color, opacity: cs.opacity, cursor: cs.cursor }
    }
    return {
      cellCount: cells.length,
      tokens,
      blockedDayAfterToday: readCell(blockedCandidate),
      availableDay: readCell(availableCandidate),
    }
  })
  await page.screenshot({ path: `docs/sessions/evidence/task891/rev5/ac38-route-listings-${width}.png` })
  await page.close()
  return { width, found: true, ...data }
}

results.w1440 = await probe(1440)
results.w390 = await probe(390)

console.log(JSON.stringify(results, null, 2))
await browser.close()
