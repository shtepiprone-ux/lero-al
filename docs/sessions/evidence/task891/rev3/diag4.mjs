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
  const portfolioCard = cards.find((c) => (c.querySelector('h2')?.textContent || '').toLowerCase().includes('portfolio'))
  const centerEl = portfolioCard.querySelector('.mantine-Center-root')
  const groupEl = portfolioCard.querySelector('.mantine-Group-root')
  const rect = (el) => (el ? (({ left, right, width }) => ({ left: Math.round(left), right: Math.round(right), width: Math.round(width) }))(el.getBoundingClientRect()) : null)
  return {
    centerFound: !!centerEl,
    centerClass: centerEl ? centerEl.className : null,
    centerRect: rect(centerEl),
    centerDisplay: centerEl ? getComputedStyle(centerEl).display : null,
    groupRect: rect(groupEl),
    groupDisplay: groupEl ? getComputedStyle(groupEl).display : null,
    groupParentTag: groupEl ? groupEl.parentElement.tagName : null,
    groupParentClass: groupEl ? groupEl.parentElement.className : null,
    groupIsDirectChildOfCenter: groupEl && centerEl ? groupEl.parentElement === centerEl : null,
  }
})

console.log(JSON.stringify(result, null, 2))
await browser.close()
