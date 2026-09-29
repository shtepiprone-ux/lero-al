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
  const cards = Array.from(root.querySelectorAll('.mantine-Card-root')).filter((c) => c.tagName === 'DIV')
  // Identify by title text (h2).
  const info = cards.map((c) => {
    const h2 = c.querySelector('h2')
    const rect = c.getBoundingClientRect()
    return { title: h2 ? h2.textContent : null, top: Math.round(rect.top), bottom: Math.round(rect.bottom), height: Math.round(rect.height) }
  })

  // Donut centering: find the portfolio card (title contains "portfolio" ish) -> find its donut ring box.
  const donutBox = root.querySelector('[role="img"][aria-label]')
  let donutCentering = null
  const allImgRoles = Array.from(root.querySelectorAll('[role="img"]'))
  // The donut wrapper is a Box with pos:relative w/h = canvasSize, look for one whose parent Group has 2 children (ring+legend)
  for (const el of allImgRoles) {
    const group = el.closest('.mantine-Group-root')
    if (group && group.querySelectorAll('button[aria-pressed]').length > 0) {
      const cardBody = group.closest('.mantine-Card-root')
      if (cardBody) {
        const cardRect = cardBody.getBoundingClientRect()
        const groupRect = group.getBoundingClientRect()
        donutCentering = {
          cardLeft: Math.round(cardRect.left),
          cardRight: Math.round(cardRect.right),
          groupLeft: Math.round(groupRect.left),
          groupRight: Math.round(groupRect.right),
          leftGap: Math.round(groupRect.left - cardRect.left),
          rightGap: Math.round(cardRect.right - groupRect.right),
        }
      }
      break
    }
  }

  // Legend text with counts.
  const legendButtons = Array.from(root.querySelectorAll('button[aria-pressed]')).map((b) => b.textContent)

  return { info, donutCentering, legendButtons }
})

console.log(JSON.stringify(result, null, 2))
await browser.close()
