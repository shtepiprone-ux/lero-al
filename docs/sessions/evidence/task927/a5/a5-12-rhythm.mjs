// Task 927 Amendment 5, AC26 (a5-12): on the built Storybook (storybook-static, read-only) it measures the returning person's view in the four GoogleWelcomeBack Stories and the
// AuthSheet `WelcomeBack` Story, over 16 widths x sq, en, uk, it:
//  - GR-3h: every gap between consecutive children of each Stack of the view (the root and the identity block) equals that Stack's computed `row-gap`;
//  - GR-3i: the name and the masked e-mail have scrollWidth <= clientWidth, no ellipsis and no line clamp; the long name wraps at 320 (more than one line);
//  - GR-3j: no horizontal overflow of the page, the view or the sheet;
//  - one look: the height of Google's button (`.nsm7Bb-HzV7m-LgbsSe`) in `WelcomeBack`, in `Login` and in the ready section of the deletion Story (Modal `DeleteConfirmPassword`).
// Usage (repository root): node docs/sessions/evidence/task927/a5/a5-12-rhythm.mjs [outfile]
import http from 'node:http'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(path.resolve('package.json'))
const { chromium } = require('playwright')
const outFile = process.argv[2] ?? 'docs/sessions/evidence/task927/a5/a5-12-rhythm.txt'
const ROOT = path.resolve('storybook-static')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png' }
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
const browser = await chromium.launch()
const url = (id, l) => `http://127.0.0.1:${port}/iframe.html?id=${id}&viewMode=story&globals=locale:${l}`
// A5_ONLY="<locale>:<width>" re-measures one cell (a rerun after Google's script did not answer within the wait); without it the whole matrix runs.
const only = process.env.A5_ONLY ? process.env.A5_ONLY.split(':') : null
const WIDTHS = only ? [Number(only[1])] : [320, 375, 390, 480, 560, 639, 640, 680, 768, 810, 960, 1024, 1200, 1440, 1920, 2560]
const LOCALES = only ? [only[0]] : ['sq', 'en', 'uk', 'it']
const VIEWS = [
  ['patterns-mantine-googlewelcomeback--initials', 'Initials'],
  ['patterns-mantine-googlewelcomeback--picture', 'Picture'],
  ['patterns-mantine-googlewelcomeback--long-name', 'LongName'],
  ['patterns-mantine-googlewelcomeback--with-alerts', 'WithAlerts'],
  ['patterns-mantine-authsheet--welcome-back', 'AuthSheet WelcomeBack'],
]
// GOOGLE_SEL (Task 927 Review 11) selects our own button ([data-google-sign-in], Amendment 10) instead of the class of the button Google draws
const GOOGLE = process.env.GOOGLE_SEL ?? '.nsm7Bb-HzV7m-LgbsSe'

// runs inside the page: measures the view found through its avatar (identity Stack = the avatar's parent, root Stack = that Stack's parent)
function measureView(GOOGLE) {
  const avatar = document.querySelector('.mantine-Avatar-root')
  if (!avatar) return { error: 'no avatar' }
  const identity = avatar.parentElement
  const root = identity.parentElement
  const problems = []
  const gaps = []
  for (const [label, stack] of [['root', root], ['identity', identity]]) {
    if (!stack.classList.contains('mantine-Stack-root')) problems.push(`${label} is not a Mantine Stack`)
    const rowGap = parseFloat(getComputedStyle(stack).rowGap)
    const kids = [...stack.children].filter((k) => getComputedStyle(k).display !== 'none')
    for (let i = 1; i < kids.length; i++) {
      const gap = kids[i].getBoundingClientRect().top - kids[i - 1].getBoundingClientRect().bottom
      gaps.push(`${label}:${Math.round(gap * 100) / 100}/${rowGap}`)
      if (Math.abs(gap - rowGap) > 0.5) problems.push(`${label} gap ${i} is ${gap}px, row-gap ${rowGap}px`)
    }
  }
  const name = identity.children[1], email = identity.children[2]
  const text = {}
  for (const [label, el] of [['name', name], ['email', email]]) {
    const cs = getComputedStyle(el)
    const lineHeight = parseFloat(cs.lineHeight)
    text[label] = { sw: el.scrollWidth, cw: el.clientWidth, ellipsis: cs.textOverflow === 'ellipsis', clamp: cs.webkitLineClamp !== 'none' && cs.webkitLineClamp !== '', lines: Math.round(el.getBoundingClientRect().height / lineHeight) }
    if (el.scrollWidth > el.clientWidth) problems.push(`${label} is clipped (${el.scrollWidth} > ${el.clientWidth})`)
    if (cs.textOverflow === 'ellipsis') problems.push(`${label} has an ellipsis`)
    if (text[label].clamp) problems.push(`${label} has a line clamp`)
  }
  const page = document.documentElement
  const dialog = document.querySelector('[role="dialog"]')
  const overflow = { page: page.scrollWidth - page.clientWidth, view: root.scrollWidth - root.clientWidth, dialog: dialog ? dialog.scrollWidth - dialog.clientWidth : 0 }
  if (overflow.page > 0 || overflow.view > 0 || overflow.dialog > 0) problems.push(`horizontal overflow ${JSON.stringify(overflow)}`)
  const google = document.querySelector(GOOGLE)
  return { problems, gaps, text, overflow, googleHeight: google ? Math.round(google.getBoundingClientRect().height * 100) / 100 : null }
}

async function googleHeightInLogin(page, l) {
  await page.goto(url('patterns-mantine-authsheet--login', l))
  await page.waitForSelector(GOOGLE, { timeout: 30000 }).catch(() => null)
  await page.waitForTimeout(800)
  return page.evaluate((sel) => { const g = document.querySelector(sel); return g ? Math.round(g.getBoundingClientRect().height * 100) / 100 : null }, GOOGLE)
}
async function googleHeightInModal(page, l) {
  await page.goto(url('mantine-primitives-modal--delete-confirm-password', l))
  await page.waitForSelector('#storybook-root button', { timeout: 30000 })
  const opened = await page.evaluate(() => {
    const buttons = [...document.querySelectorAll('#storybook-root button')].filter((b) => b.offsetParent)
    if (buttons.length < 4) return false
    buttons[3].click()
    return true
  })
  if (!opened) return null
  await page.waitForSelector(`[role="dialog"] ${GOOGLE}`, { timeout: 30000 }).catch(() => null)
  await page.waitForTimeout(800)
  return page.evaluate((sel) => { const g = document.querySelector(`[role="dialog"] ${sel}`); return g ? Math.round(g.getBoundingClientRect().height * 100) / 100 : null }, GOOGLE)
}

const results = {}
async function worker(l) {
  const out = []
  for (const width of WIDTHS) {
    const page = await browser.newPage({ viewport: { width, height: 900 } })
    const heights = {}
    for (const [id, label] of VIEWS) {
      await page.goto(url(id, l))
      await page.waitForSelector('.mantine-Avatar-root', { timeout: 30000 }).catch(() => null)
      await page.waitForSelector(GOOGLE, { timeout: 30000 }).catch(() => null)
      await page.waitForTimeout(800)
      const m = await page.evaluate(measureView, GOOGLE)
      if (m.error) { out.push({ l, width, label, problems: [m.error] }); continue }
      if (m.googleHeight === null) m.problems.push('Google button not drawn')
      if (label === 'LongName' && width === 320 && m.text.name.lines < 2) m.problems.push(`the long name does not wrap at 320 (${m.text.name.lines} line)`)
      if (label === 'AuthSheet WelcomeBack') heights.welcome = m.googleHeight
      out.push({ l, width, label, problems: m.problems, gaps: m.gaps.join(' '), text: m.text, overflow: m.overflow, googleHeight: m.googleHeight })
    }
    heights.login = await googleHeightInLogin(page, l)
    heights.modal = await googleHeightInModal(page, l)
    const same = heights.welcome !== null && heights.welcome === heights.login && heights.login === heights.modal
    out.push({ l, width, label: 'google heights', problems: same ? [] : [`Google button heights differ: ${JSON.stringify(heights)}`], gaps: '', heights })
    await page.close()
  }
  results[l] = out
}
await Promise.all(LOCALES.map(worker))

const lines = [
  '# a5-12: rhythm, wrap, overflow and one-look probe of the Welcome back view',
  `platform: ${os.platform()} ${os.release()}`, `node: ${process.version}`, `cwd: ${process.cwd()}`,
  `command: node docs/sessions/evidence/task927/a5/a5-12-rhythm.mjs`, `started: ${new Date().toISOString()}`,
  `widths: ${WIDTHS.join(', ')}; locales: ${LOCALES.join(', ')}; views: ${VIEWS.map(v => v[1]).join(', ')}`, '',
]
let cells = 0, failed = 0
const heightSet = new Set()
for (const l of LOCALES) for (const r of results[l]) {
  cells++
  if (r.heights) heightSet.add(JSON.stringify(r.heights))
  if (r.problems.length) failed++
  lines.push(`${r.l} ${r.width} ${r.label}: ${r.problems.length ? 'FAIL ' + r.problems.join('; ') : 'ok'}${r.gaps ? ' | gaps ' + r.gaps : ''}${r.text ? ' | name ' + JSON.stringify(r.text.name) + ' email ' + JSON.stringify(r.text.email) : ''}${r.overflow ? ' | overflow ' + JSON.stringify(r.overflow) : ''}${r.googleHeight !== undefined && r.googleHeight !== null ? ' | google ' + r.googleHeight + 'px' : ''}`)
}
lines.push('', `distinct triples of Google button heights (welcome, login, modal): ${[...heightSet].join(' ')}`, `cells ${cells}; cells with a problem: ${failed}`, `exit code: ${failed ? 1 : 0}`)
fs.writeFileSync(outFile, lines.join('\n') + '\n')
console.log(lines.slice(-4).join('\n'))
await browser.close()
server.close()
process.exitCode = failed ? 1 : 0
