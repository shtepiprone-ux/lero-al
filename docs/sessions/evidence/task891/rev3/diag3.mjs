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

const result = await page.evaluate(() => {
  const root = document.getElementById('storybook-root') || document.body
  const cards = Array.from(root.querySelectorAll('.mantine-Card-root')).filter((c) => c.tagName === 'DIV' && c.querySelector('h2'))
  const portfolioCard = cards.find((c) => (c.querySelector('h2')?.textContent || '').includes('portfolio') || (c.querySelector('h2')?.textContent || '').includes('Portfolio'))
  if (!portfolioCard) return { found: false, titles: cards.map((c) => c.querySelector('h2')?.textContent) }
  const canvas = portfolioCard.querySelector('.apexcharts-canvas')
  const cardRect = portfolioCard.getBoundingClientRect()
  const canvasRect = canvas ? canvas.getBoundingClientRect() : null
  // content box = card rect minus padding
  const cs = getComputedStyle(portfolioCard)
  const padLeft = parseFloat(cs.paddingLeft)
  const padRight = parseFloat(cs.paddingRight)
  const contentLeft = cardRect.left + padLeft
  const contentRight = cardRect.right - padRight
  return {
    found: true,
    cardRect: { left: Math.round(cardRect.left), right: Math.round(cardRect.right) },
    contentBox: { left: Math.round(contentLeft), right: Math.round(contentRight) },
    canvasRect: canvasRect ? { left: Math.round(canvasRect.left), right: Math.round(canvasRect.right) } : null,
    leftGap: canvasRect ? Math.round(canvasRect.left - contentLeft) : null,
    rightGap: canvasRect ? Math.round(contentRight - canvasRect.right) : null,
  }
})

console.log(JSON.stringify(result, null, 2))
await browser.close()
