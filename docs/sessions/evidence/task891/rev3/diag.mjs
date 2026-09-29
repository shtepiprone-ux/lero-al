import { chromium } from 'playwright'

const BASE = 'http://127.0.0.1:6323'
const browser = await chromium.launch()
const page = await browser.newPage()

async function go(id, locale = 'en') {
  await page.goto(`${BASE}/iframe.html?id=${id}&viewMode=story&globals=locale:${locale}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(700)
}

await page.setViewportSize({ width: 1440, height: 2400 })
await go('patterns-mantine-agentstatisticsview--default')

const debugInfo = await page.evaluate(() => {
  const root = document.getElementById('storybook-root') || document.body
  const grids = Array.from(root.querySelectorAll('.mantine-SimpleGrid-root'))
  return grids.map((g, gi) => ({
    gi,
    childCount: g.children.length,
    children: Array.from(g.children).map((c) => ({ tag: c.tagName, cls: c.className, rect: { h: Math.round(c.getBoundingClientRect().height), w: Math.round(c.getBoundingClientRect().width) } })),
  }))
})
console.log('DEBUG GRIDS:', JSON.stringify(debugInfo, null, 1))

const result = await page.evaluate(() => {
  const root = document.getElementById('storybook-root') || document.body
  const topRowCards = Array.from(root.querySelectorAll('.mantine-SimpleGrid-root')[0]?.children ?? []).filter((c) => c.tagName === 'DIV')
  const kpiInfo = topRowCards.map((card) => {
    const rect = card.getBoundingClientRect()
    const sparkline = card.querySelector('[role="img"]')
    const sparklineRect = sparkline ? sparkline.getBoundingClientRect() : null
    const boldValue = Array.from(card.querySelectorAll('p')).find((p) => getComputedStyle(p).fontWeight === '700')
    const valueRect = boldValue ? boldValue.getBoundingClientRect() : null
    const visibleTooltipText = Array.from(card.querySelectorAll('p')).some((p) => p.textContent?.includes('confirm') || p.textContent?.includes('reply') || p.textContent?.includes('reading'))
    return {
      cardHeight: Math.round(rect.height),
      sparklineTop: sparklineRect ? Math.round(sparklineRect.top) : null,
      valueBottom: valueRect ? Math.round(valueRect.bottom) : null,
      visibleTooltipText,
    }
  })

  // Row 2: main (activity, fill) vs side Stack (hero + AGT-01 fill).
  const cards = Array.from(root.querySelectorAll('.mantine-Card-root'))
  // Find hero (has "Visible now"-ish gradient bg) and its siblings.
  const heroCard = cards.find((c) => getComputedStyle(c).backgroundImage.includes('linear-gradient'))
  const heroRect = heroCard ? heroCard.getBoundingClientRect() : null

  return { kpiInfo, heroFound: !!heroCard, heroRect: heroRect ? { top: Math.round(heroRect.top), bottom: Math.round(heroRect.bottom), height: Math.round(heroRect.height) } : null }
})

console.log(JSON.stringify(result, null, 2))
await browser.close()
