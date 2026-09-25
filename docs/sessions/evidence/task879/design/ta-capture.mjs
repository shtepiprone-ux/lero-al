// Task 879 design-time clause-16a live capture of demo.tailadmin.com (header + signin auth chrome).
// Usage (from repo root): node.exe <this file> <outDir>
import { createRequire } from 'node:module'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
const require = createRequire(process.cwd() + '/package.json')
const { chromium } = require('playwright')

const outDir = process.argv[2]
mkdirSync(outDir, { recursive: true })
const PROPS = ['display', 'position', 'top', 'zIndex', 'height', 'width', 'backgroundColor', 'backdropFilter',
  'borderTopWidth', 'borderTopColor', 'borderBottomWidth', 'borderBottomStyle', 'borderBottomColor',
  'borderLeftWidth', 'borderRadius', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'columnGap',
  'rowGap', 'fontFamily', 'fontSize', 'lineHeight', 'fontWeight', 'color', 'textTransform', 'textDecorationLine',
  'transitionDuration', 'boxShadow']

async function measure(page, targets) {
  return page.evaluate(({ targets, PROPS }) => {
    const out = {}
    for (const [name, sel] of Object.entries(targets)) {
      const el = typeof sel === 'string' ? document.querySelector(sel) : null
      if (!el) { out[name] = { error: `not found: ${sel}` }; continue }
      const cs = getComputedStyle(el)
      const r = el.getBoundingClientRect()
      const o = { selector: sel, className: el.getAttribute('class'), rect: { x: r.x, y: r.y, w: r.width, h: r.height } }
      for (const p of PROPS) o[p] = cs[p]
      out[name] = o
    }
    return out
  }, { targets, PROPS })
}

const runs = [
  {
    id: 'dashboard', url: 'https://demo.tailadmin.com/', targets: {
      header: 'header',
      headerInner: 'header > div',
      headerTopRow: 'header > div > div',
      headerActionCluster: 'header .flex.items-center.gap-2',
      notificationButton: 'header .flex.items-center.gap-2 button',
      userName: 'header .text-theme-sm.mr-1',
      userAvatar: 'header .mr-3.h-11.w-11',
    },
  },
  {
    id: 'signin', url: 'https://demo.tailadmin.com/signin', targets: {
      orWrap: 'div.relative.py-3',
      orLine: 'div.relative.py-3 .border-t',
      orLabel: 'div.relative.py-3 span',
      forgotLink: 'a[href="/reset-password.html"]',
      signUpLink: 'a[href="/signup.html"]',
      signUpParagraph: 'p:has(> a[href="/signup.html"])',
    },
  },
]

const browser = await chromium.launch()
const result = { capturedAt: new Date().toISOString(), platform: process.platform, node: process.version, playwright: require('playwright/package.json').version, method: 'Playwright chromium headless, page.goto(url, {waitUntil:"networkidle"}), getComputedStyle + getBoundingClientRect, full-page screenshot', runs: [] }
for (const run of runs) {
  for (const width of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } })
    const resp = await page.goto(run.url, { waitUntil: 'networkidle', timeout: 60000 })
    await page.waitForTimeout(1500)
    const m = await measure(page, run.targets)
    const shot = `${run.id}-${width}.png`
    await page.screenshot({ path: join(outDir, shot), clip: { x: 0, y: 0, width, height: run.id === 'dashboard' ? 200 : 900 } })
    result.runs.push({ id: run.id, url: run.url, finalUrl: page.url(), status: resp?.status(), viewport: width, screenshot: shot, measurements: m })
    await page.close()
  }
}
await browser.close()
writeFileSync(join(outDir, 'tailadmin-live-capture.json'), JSON.stringify(result, null, 2))
console.log(JSON.stringify(result.runs.map(r => ({ id: r.id, vp: r.viewport, status: r.status, final: r.finalUrl, missing: Object.entries(r.measurements).filter(([, v]) => v.error).map(([k]) => k) }))))
