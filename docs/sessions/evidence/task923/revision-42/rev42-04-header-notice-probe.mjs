// Task 923 Revision 42 (Opus, 2026-10-24), R139: on the built Storybook (storybook-static, read-only) it measures `Patterns/Mantine/AdminPageHeader` at the canonical matrix
// of docs/qa-profiles.md plus both sides of the 640 px switch (639, 640, 641), in sq, en, uk and it.
//  - Every export: the header box (`AdminPageHeader`'s `Box`, found as the nearest ancestor of the `h1` with an inline margin-bottom) — its height and its margin below; the
//    page's sideways overflow; every visible text element of the header that is cut (scrollWidth > clientWidth or scrollHeight > clientHeight by more than 0.5 px, an
//    ellipsis, or a line clamp).
//  - An export with a notice (`[role="alert"]` inside the header box): the gap between the dashboard header and the notice against the computed `row-gap` of their common
//    parent (GR-3h: off by more than 0.5 px is off the rhythm), and the notice's width against that parent's (the notice spans the header).
// Usage (repository root): node docs/sessions/evidence/task923/revision-42/rev42-04-header-notice-probe.mjs <export,...> [baseline.txt]
//   <export> is a Story export id suffix: default, with-action, with-notice. With a baseline file (an earlier run's output), each `header` line of an export that the
//   baseline also measured must be equal; every difference is counted as `header changed`.
//   `self-test` (Opus's design-time check, before the notice exists): on the `default` export it wraps the dashboard header in a flex column with a 16 px row-gap and
//   appends a `role="alert"` block, first on the rhythm (expected: no OFF), then 4 px further down (expected: OFF), then half as wide (expected: NARROW); it prints
//   `self-test: PASS` when the three outcomes are as expected, so the notice branch has run before any executor relies on it.
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(path.resolve('package.json'))
const { chromium } = require('playwright')
const exportsArg = (process.argv[2] ?? 'default,with-action,with-notice').split(',')
const baselineFile = process.argv[3]
const ROOT = path.resolve('storybook-static')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff' }
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]))
  if (!p.startsWith(ROOT)) { res.writeHead(404); res.end(); return }
  fs.readFile(p, (e, d) => {
    if (e) { res.writeHead(404); res.end(); return }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] ?? 'application/octet-stream' })
    res.end(d)
  })
})
await new Promise((r) => server.listen(0, r))
const port = server.address().port
const index = JSON.parse(fs.readFileSync(path.join(ROOT, 'index.json'), 'utf8'))
const browser = await chromium.launch()
const WIDTHS = [320, 375, 390, 480, 560, 639, 640, 641, 680, 768, 810, 960, 1024, 1200, 1440, 1920, 2560]
const LOCALES = ['sq', 'en', 'uk', 'it']
const lines = []
const count = { cells: 0, missing: 0, overflow: 0, cut: 0, rhythmOff: 0, narrow: 0, noNotice: 0, latent: 0 }
const measure = () => {
  const h1 = document.querySelector('#storybook-root h1')
  const box = h1.closest('[style*="margin-bottom"]')
  if (!box) return { error: 'no header box' }
  const r = box.getBoundingClientRect()
  // Review 48 (Opus, 2026-10-24; F13): an ellipsis style counts as a cut only where it can cut, the rule of the GR-3j probe r40-05 (lines 72-74): on one line
  // (`white-space` nowrap/pre) or with real overflow. Mantine's own `.mantine-Alert-message` sets `overflow: hidden; text-overflow: ellipsis` and wraps; that latent
  // style clips nothing and is listed as information, not counted.
  const latent = []
  const cut = [...box.querySelectorAll('*')].filter((e) => {
    if (!e.offsetParent || ![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) return false
    const cs = getComputedStyle(e)
    const overflows = e.scrollWidth > e.clientWidth + 0.5 || e.scrollHeight > e.clientHeight + 0.5
    const ellipsisStyle = cs.textOverflow === 'ellipsis' && /hidden|clip/.test(cs.overflowX)
    if (ellipsisStyle && !overflows && !/nowrap|pre/.test(cs.whiteSpace)) latent.push(e.textContent.trim().slice(0, 40))
    return overflows || (ellipsisStyle && /nowrap|pre/.test(cs.whiteSpace)) || (cs.webkitLineClamp && cs.webkitLineClamp !== 'none')
  }).map((e) => e.textContent.trim().slice(0, 40))
  const out = { height: Math.round(r.height * 10) / 10, below: getComputedStyle(box).marginBottom, overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth, cut, latent }
  const alert = box.querySelector('[role="alert"]')
  if (alert) {
    const parent = alert.parentElement
    // Mantine renders a `<style>` element before a component with responsive props (rev42-05b): the block above the notice is the nearest sibling that has a box
    let prev = alert.previousElementSibling
    while (prev && (prev.tagName === 'STYLE' || getComputedStyle(prev).display === 'none')) prev = prev.previousElementSibling
    if (!prev) return { ...out, error: 'the notice has no block above it in its parent' }
    const a = alert.getBoundingClientRect()
    out.notice = {
      rhythm: parseFloat(getComputedStyle(parent).rowGap),
      gap: Math.round((a.top - prev.getBoundingClientRect().bottom) * 10) / 10,
      width: Math.round(a.width * 10) / 10,
      parentWidth: Math.round(parent.getBoundingClientRect().width * 10) / 10,
    }
  }
  return out
}
if (exportsArg[0] === 'self-test') {
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } })
  await page.goto(`http://127.0.0.1:${port}/iframe.html?id=patterns-mantine-adminpageheader--default&viewMode=story&globals=locale:en`)
  await page.waitForSelector('#storybook-root h1', { timeout: 30000 })
  const results = []
  for (const variant of ['on', 'off', 'narrow']) {
    await page.evaluate((v) => {
      const box = document.querySelector('#storybook-root h1').closest('[style*="margin-bottom"]')
      box.querySelector('[data-selftest]')?.replaceWith(...box.querySelector('[data-selftest]').firstElementChild ? [box.querySelector('[data-selftest]').firstElementChild] : [])
      const header = [...box.children].find((e) => e.tagName !== 'STYLE')
      const col = document.createElement('div')
      col.setAttribute('data-selftest', '')
      col.style.cssText = 'display:flex;flex-direction:column;row-gap:16px'
      header.replaceWith(col)
      col.appendChild(header)
      const alert = document.createElement('div')
      alert.setAttribute('role', 'alert')
      alert.textContent = 'self-test notice'
      if (v === 'off') alert.style.marginTop = '4px'
      if (v === 'narrow') alert.style.width = '50%'
      col.appendChild(alert)
    }, variant)
    const m = await page.evaluate(measure)
    const off = m.notice ? Math.abs(m.notice.gap - m.notice.rhythm) > 0.5 : null
    const narrow = m.notice ? m.notice.width < m.notice.parentWidth - 0.5 : null
    results.push({ variant, notice: m.notice, off, narrow })
  }
  // Review 48 (F13): the cut test itself. A one-line ellipsis that hides text is a cut; a wrapping text with the Alert's latent ellipsis style is not.
  for (const variant of ['one-line ellipsis', 'latent ellipsis']) {
    await page.evaluate((v) => {
      const col = document.querySelector('[data-selftest]')
      col.querySelector('[data-selftest-text]')?.remove()
      const text = document.createElement('div')
      text.setAttribute('data-selftest-text', '')
      text.textContent = 'self-test text long enough to need more than one line at this width of the page'
      text.style.cssText = `overflow:hidden;text-overflow:ellipsis;white-space:${v === 'one-line ellipsis' ? 'nowrap' : 'normal'}`
      col.appendChild(text)
    }, variant)
    const m = await page.evaluate(measure)
    results.push({ variant, cut: m.cut.some((x) => x.startsWith('self-test text')), latent: m.latent.some((x) => x.startsWith('self-test text')) })
  }
  const pass = results[0].off === false && results[0].narrow === false && results[1].off === true && results[2].narrow === true
    && results[3].cut === true && results[4].cut === false && results[4].latent === true
  console.log(results.map((x) => JSON.stringify(x)).join('\n'))
  console.log(`self-test: ${pass ? 'PASS' : 'FAIL'}`)
  await browser.close()
  server.close()
  process.exit(pass ? 0 : 1)
}
for (const ex of exportsArg) {
  const id = `patterns-mantine-adminpageheader--${ex}`
  if (!index.entries[id]) { lines.push(`${ex}: NO such Story in this build`); count.missing++; continue }
  for (const l of LOCALES) {
    for (const width of WIDTHS) {
      const page = await browser.newPage({ viewport: { width, height: 900 } })
      await page.goto(`http://127.0.0.1:${port}/iframe.html?id=${id}&viewMode=story&globals=locale:${l}`)
      await page.waitForSelector('#storybook-root h1', { timeout: 30000 })
      await page.waitForTimeout(400)
      const m = await page.evaluate(measure)
      await page.close()
      count.cells++
      if (m.error) { lines.push(`${ex} ${l} ${width}: ${m.error}`); count.missing++; continue }
      lines.push(`header ${ex} ${l} ${width}: height ${m.height}px, margin below ${m.below}`)
      if (m.overflow) { count.overflow++; lines.push(`  page overflow`) }
      if (m.cut.length) { count.cut++; lines.push(`  text cut: ${JSON.stringify(m.cut)}`) }
      if (m.latent.length) { count.latent++; lines.push(`  latent ellipsis style, nothing clipped: ${JSON.stringify(m.latent)}`) }
      if (ex === 'with-notice') {
        if (!m.notice) { count.noNotice++; lines.push('  NO notice in the header') }
        else {
          const off = Math.abs(m.notice.gap - m.notice.rhythm) > 0.5
          const narrow = m.notice.width < m.notice.parentWidth - 0.5
          if (off) count.rhythmOff++
          if (narrow) count.narrow++
          lines.push(`  notice: gap ${m.notice.gap}px against the rhythm ${m.notice.rhythm}px${off ? ' OFF' : ''}; width ${m.notice.width}px of ${m.notice.parentWidth}px${narrow ? ' NARROW' : ''}`)
        }
      }
    }
  }
}
let changed = 0
if (baselineFile) {
  const base = new Map(fs.readFileSync(baselineFile, 'utf8').split(/\r?\n/).filter((x) => x.startsWith('header ')).map((x) => [x.split(':')[0], x]))
  for (const x of lines.filter((y) => y.startsWith('header '))) {
    const before = base.get(x.split(':')[0])
    if (before !== undefined && before !== x) { changed++; lines.push(`CHANGED: ${before}  ->  ${x}`) }
  }
}
lines.push(`cells ${count.cells}; missing ${count.missing}; page overflow: ${count.overflow}; text cut: ${count.cut}; rhythm off: ${count.rhythmOff}; notice narrower than the header: ${count.narrow}; no notice: ${count.noNotice}${baselineFile ? `; header changed: ${changed}` : ''}`)
lines.push(`information, not counted: cells with a latent ellipsis style that clips nothing (Mantine Alert message): ${count.latent}`)
console.log(lines.join('\n'))
await browser.close()
server.close()
process.exitCode = count.missing || count.overflow || count.cut || count.rhythmOff || count.narrow || count.noNotice || changed ? 1 : 0
