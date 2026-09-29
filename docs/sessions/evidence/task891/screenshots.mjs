import { chromium } from 'playwright'
const BASE = 'http://127.0.0.1:6321'
const browser = await chromium.launch()
const page = await browser.newPage()

async function shot(id, locale, width, name) {
  await page.setViewportSize({ width, height: 1400 })
  await page.goto(`${BASE}/iframe.html?id=${id}&viewMode=story&globals=locale:${locale}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  await page.screenshot({ path: `docs/sessions/evidence/task891/${name}.png`, fullPage: true })
}

await shot('patterns-mantine-agentstatisticsview--default', 'en', 1440, 'default-en-1440')
await shot('patterns-mantine-agentstatisticsview--default', 'en', 390, 'default-en-390')
await shot('patterns-mantine-agentstatisticsview--activity-stale', 'en', 1440, 'activitystale-en-1440')
await shot('patterns-mantine-agentstatisticsview--activity-error', 'en', 1440, 'activityerror-en-1440')
await shot('patterns-mantine-agentstatisticsview--no-activity', 'en', 1440, 'noactivity-en-1440')
await shot('patterns-mantine-agentstatisticsview--sorted-by-views', 'en', 1440, 'sortedbyviews-en-1440')

await browser.close()
console.log('done')
