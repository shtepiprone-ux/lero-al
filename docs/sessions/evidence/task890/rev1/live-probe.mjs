// Task 890 rev 1, step 5 — live proof against `npm run start` (:3000), signed in as staff.
// node docs/sessions/evidence/task890/rev1/live-probe.mjs
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')

const BASE = 'http://localhost:3000'
const STATE = path.resolve('playwright/.auth/admin-storage-state.json')
const OUT = path.resolve('docs/sessions/evidence/task890/rev1/live')
fs.mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch()
const lines = []
const log = (s) => { lines.push(s); console.log(s) }

async function visit(urlPath, width, locale, tag) {
  const ctx = await browser.newContext({ storageState: STATE, viewport: { width, height: 1000 } })
  await ctx.addCookies([{ name: 'admin-locale', value: locale, url: BASE }])
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  const res = await page.goto(BASE + urlPath, { waitUntil: 'load' })
  await page.waitForSelector('h1', { timeout: 30000 }).catch(() => {})
  await page.waitForTimeout(3500)
  const m = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth
    const cards = [...document.querySelectorAll('.mantine-Card-root')]
    const top0 = cards.length ? Math.round(cards[0].getBoundingClientRect().top) : 0
    const titleOf = (c) => (c.querySelector('h2')?.textContent ?? c.innerText.split('\n')[0]).trim().slice(0, 30)
    const row = (pred) => cards.filter(pred).map((c) => `${titleOf(c)}=${Math.round(c.getBoundingClientRect().width)}`)
    const row1 = row((c) => Math.abs(Math.round(c.getBoundingClientRect().top) - top0) <= 2)
    const workTitles = ['Moderation queue', 'Complaints', 'Support queue', 'Location requests']
    const row4 = cards.filter((c) => workTitles.includes(c.querySelector('h2')?.textContent?.trim()) || /Модерац|Скарги|Підтримк|Запити/.test(c.querySelector('h2')?.textContent ?? '')).map((c) => `${titleOf(c)}=${Math.round(c.getBoundingClientRect().width)}`)
    const clipped = [...document.querySelectorAll('main p, main a, main span')]
      .filter((el) => el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 1 && ['hidden', 'auto', 'scroll', 'clip'].includes(getComputedStyle(el).overflowX))
      .map((el) => `${el.tagName.toLowerCase()}[${el.textContent.trim().slice(0, 26)}] ${el.scrollWidth}>${el.clientWidth}`)
    const activityCard = cards.find((c) => /Platform activity|Активність платформи/.test(c.textContent))
    const areaPts = activityCard ? activityCard.querySelectorAll('.apexcharts-series-markers circle, .apexcharts-marker').length : -1
    const lineSeries = activityCard ? [...activityCard.querySelectorAll('.apexcharts-series[seriesName]')].map((s) => s.querySelectorAll('path').length) : []
    const xLabels = activityCard ? activityCard.querySelectorAll('.apexcharts-xaxis-texts-g text').length : -1
    const trendCard = cards.find((c) => /New listings and new users|Нові оголошення та нові користувачі/.test(c.textContent))
    const trendCats = trendCard ? trendCard.querySelectorAll('.apexcharts-xaxis-texts-g text').length : -1
    const sparkBars = cards.slice(0, 4).map((c) => c.querySelectorAll('.apexcharts-bar-area').length)
    return {
      vw, overflow: document.documentElement.scrollWidth > vw + 1, row1, row4, clipped,
      title: document.querySelector('h1')?.textContent, cardCount: cards.length,
      xLabels, trendCats, sparkBars, lineSeries,
      bodyText: document.body.innerText.length,
    }
  })
  log(`${tag} ${urlPath} ${width} ${locale}: status ${res?.status()} overflow ${m.overflow} cards ${m.cardCount} title ${m.title} row1 ${JSON.stringify(m.row1)} row4 ${JSON.stringify(m.row4)} spark-bars ${JSON.stringify(m.sparkBars)} activity-xlabels ${m.xLabels} trend-xlabels ${m.trendCats} clipped ${JSON.stringify(m.clipped)}${errors.length ? ' ERR ' + errors[0].slice(0, 100) : ''}`)
  await page.screenshot({ path: path.join(OUT, `${tag}-${width}-${locale}.png`), fullPage: true })
  // series point counts from the chart DOM: count data points via ApexCharts' own global, if reachable
  const pts = await page.evaluate(() => {
    const out = {}
    const charts = window.Apex?._chartInstances ?? []
    out.instances = charts.length
    out.series = charts.map((c) => ({ type: c.chart.w.config.chart.type, n: c.chart.w.config.series.map((s) => (s.data ? s.data.length : 0)), cats: (c.chart.w.config.xaxis.categories ?? []).length }))
    return out
  })
  log(`   chart-instances ${JSON.stringify(pts)}`)
  await ctx.close()
}

await visit('/admin', 1024, 'en', 'a')
await visit('/admin', 1280, 'en', 'a')
await visit('/admin', 1440, 'en', 'a')
await visit('/admin', 1024, 'uk', 'b')
await visit('/admin?period=7d', 1440, 'en', 'c')
await visit('/admin?period=bogus', 1440, 'en', 'd')
await visit('/admin', 390, 'uk', 'e')
fs.writeFileSync(path.join(OUT, 'live-probe.out.txt'), lines.join('\n') + '\n')
await browser.close()
