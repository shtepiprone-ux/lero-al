// Task 923 R103 (kickoff 54.5): the rendered probe of Patterns/Mantine/ListingAccessRestrictedView (Guest, SignedIn) on the BUILT Storybook, at 320, 390, 639, 640, 767, 768, 1024
// and 1440 px in sq, en, uk and it. One JSON line per Story x width x locale. It measures, with getBoundingClientRect / getComputedStyle (never by eye):
//   pageOverflow      the page scrolls horizontally
//   cut               a text element that clips (scrollWidth > clientWidth or scrollHeight > clientHeight with a hidden/clip overflow, a line clamp, or an ellipsis)
//   wordSplit         a text element narrower than its longest word (GR-3i; the word is measured with the element's own computed font)
//   outside           a text element or the action that reaches past the viewport
//   rhythm            GR-3h: the gaps between consecutive blocks of the empty state's own stack, against that stack's gap
//   action            the action's width against the stack's width, its height, and whether it is full width (required below 640) or its own width (from 640)
//   smallTarget       below 768 px the action's smaller side is under 44 px (the project's touch token)
// usage: node docs/sessions/evidence/task923/r30-80-restricted-probe.mjs > docs/sessions/evidence/task923/r30-80-restricted-probe.jsonl   (needs storybook-static)
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const ROOT = path.resolve(import.meta.dirname, '..', '..', '..', '..')
const require = createRequire(path.join(ROOT, 'package.json'))
const { chromium } = require('playwright')
const STATIC = path.join(ROOT, 'storybook-static')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' }
const PORT = Number(process.env.PORT ?? 6643)
const server = http.createServer((req, res) => {
  const file = path.join(STATIC, decodeURIComponent(req.url.split('?')[0]))
  fs.readFile(file, (error, data) => {
    if (error) { res.writeHead(404); res.end(); return }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] ?? 'application/octet-stream' })
    res.end(data)
  })
}).listen(PORT)

const index = JSON.parse(fs.readFileSync(path.join(STATIC, 'index.json'), 'utf8'))
const IDS = Object.values(index.entries).filter((e) => e.type === 'story' && e.title === 'Patterns/Mantine/ListingAccessRestrictedView').map((e) => e.id)
if (IDS.length !== 2) { console.error(`expected the Stories Guest and SignedIn, found ${IDS.length}: ${IDS.join(', ')}`); server.close(); process.exit(1) }
const WIDTHS = (process.env.W ?? '320,390,639,640,767,768,1024,1440').split(',').map(Number)
const LOCALES = (process.env.L ?? 'sq,en,uk,it').split(',')
const SHOTS = process.env.SHOTS ? path.resolve(ROOT, process.env.SHOTS) : null
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true })
const jobs = []
for (const id of IDS) for (const w of WIDTHS) for (const loc of LOCALES) jobs.push({ id, w, loc })

const browser = await chromium.launch()
let failures = 0

async function run({ id, w, loc }) {
  const page = await browser.newPage({ viewport: { width: w, height: 844 }, deviceScaleFactor: 1 })
  try {
    await page.goto(`http://127.0.0.1:${PORT}/iframe.html?id=${id}&viewMode=story&globals=locale:${loc}`, { waitUntil: 'load' })
    await page.waitForFunction(() => document.querySelector('#storybook-root')?.innerText.trim().length > 0, null, { timeout: 20000 })
    await page.waitForTimeout(1200)
    const r = await page.evaluate((viewportWidth) => {
      const root = document.querySelector('#storybook-root')
      const visible = (e) => { const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return b.width > 0 && b.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' }
      const text = (e) => (e.textContent || '').trim().replace(/\s+/g, ' ')
      const out = { pageOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 0.5, cut: [], wordSplit: [], outside: [], rhythm: null, action: null, smallTarget: false, storybookError: document.body.classList.contains('sb-show-errordisplay') }

      // the text leaves: an element with text of its own and no child that carries the same text
      const leaves = [...root.querySelectorAll('*')].filter((e) => visible(e) && text(e) && ![...e.children].some((c) => text(c) === text(e)) && !e.closest('style, script'))
      const canvas = document.createElement('canvas').getContext('2d')
      for (const e of leaves) {
        const cs = getComputedStyle(e)
        const label = text(e).slice(0, 40)
        const hidden = /hidden|clip/.test(cs.overflowX + cs.overflowY)
        if ((cs.webkitLineClamp && cs.webkitLineClamp !== 'none') || (cs.textOverflow === 'ellipsis' && hidden)) out.cut.push(`clamp/ellipsis "${label}"`)
        if (hidden && (e.scrollWidth > e.clientWidth + 0.5 || e.scrollHeight > e.clientHeight + 0.5)) out.cut.push(`clipped "${label}"`)
        // the word split: the longest word, in the element's own font, against the element's content width
        if (e.children.length === 0) {
          canvas.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
          const longest = Math.max(...text(e).split(' ').map((word) => canvas.measureText(word).width))
          const content = e.getBoundingClientRect().width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
          if (cs.display !== 'inline' && content + 0.5 < longest) out.wordSplit.push(`"${label}" ${Math.round(content)}<${Math.round(longest)}`)
        }
        const b = e.getBoundingClientRect()
        if (b.right > viewportWidth + 0.5 || b.left < -0.5) out.outside.push(`"${label}" ${Math.round(b.left)}..${Math.round(b.right)}`)
      }

      // the empty state's own stack: the title's parent holds the icon, title, text and action
      const title = leaves.find((e) => getComputedStyle(e).fontWeight === '600' && e.closest('[class*="Stack"]'))
      const stack = title ? title.closest('[class*="Stack"]') : null
      const link = [...root.querySelectorAll('a')].find((a) => !a.closest('nav') && visible(a))
      if (stack) {
        const kids = [...stack.children].filter(visible)
        const stackCs = getComputedStyle(stack)
        const expected = parseFloat(stackCs.rowGap)
        const gaps = kids.slice(1).map((k, i) => Math.round((k.getBoundingClientRect().top - kids[i].getBoundingClientRect().bottom) * 100) / 100)
        out.rhythm = { blocks: kids.length, stackGap: expected, gaps, equal: gaps.every((g) => Math.abs(g - expected) < 0.51) }
        if (link) {
          const lb = link.getBoundingClientRect(), sb = stack.getBoundingClientRect()
          const pad = parseFloat(stackCs.paddingLeft) + parseFloat(stackCs.paddingRight)
          out.action = { width: Math.round(lb.width * 100) / 100, height: Math.round(lb.height * 100) / 100, stackWidth: Math.round((sb.width - pad) * 100) / 100, fullWidth: Math.abs(lb.width - (sb.width - pad)) < 1.5 }
          out.smallTarget = viewportWidth < 768 && Math.min(lb.width, lb.height) < 44 - 0.5
        }
      } else out.rhythm = { error: 'the empty state stack was not found' }
      out.linkCount = [...root.querySelectorAll('a')].filter((a) => !a.closest('nav')).length
      out.title = title ? text(title).slice(0, 80) : null
      return out
    }, w)
    // the required outcomes: no overflow, no clipping, no split word, nothing outside, an even rhythm, one action, a 44 px target below 768, full width below 640 and its own width from 640
    const problems = []
    if (r.pageOverflow) problems.push('pageOverflow')
    if (r.cut.length) problems.push('cut')
    if (r.wordSplit.length) problems.push('wordSplit')
    if (r.outside.length) problems.push('outside')
    if (!r.rhythm || r.rhythm.error || !r.rhythm.equal) problems.push('rhythm')
    if (r.linkCount !== 1) problems.push('actionCount')
    if (r.smallTarget) problems.push('smallTarget')
    if (r.storybookError) problems.push('storybookError')
    if (!r.action) problems.push('noAction')
    else if (w < 640 && !r.action.fullWidth) problems.push('actionNotFullBelow640')
    else if (w >= 640 && r.action.fullWidth) problems.push('actionFullFrom640')
    if (problems.length) failures++
    console.log(JSON.stringify({ id, w, loc, pass: problems.length === 0, problems, ...r }))
    if (SHOTS && [390, 1440].includes(w) && ['en', 'uk'].includes(loc)) await page.screenshot({ path: path.join(SHOTS, `${id.split('--')[1]}-${loc}-${w}.png`), fullPage: false })
  } catch (error) {
    failures++
    console.log(JSON.stringify({ id, w, loc, pass: false, problems: ['probe'], error: String(error).slice(0, 200) }))
  }
  await page.close()
}

let next = 0
await Promise.all(Array.from({ length: 4 }, async () => { while (next < jobs.length) await run(jobs[next++]) }))
await browser.close()
server.close()
console.error(`done: ${jobs.length} jobs (${IDS.length} Stories x ${WIDTHS.length} widths x ${LOCALES.length} locales), ${failures} with a problem`)
process.exitCode = failures ? 1 : 0
