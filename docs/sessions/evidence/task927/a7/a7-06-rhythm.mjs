// Task 927 Amendment 7, AC30 (a7-06): on the built Storybook (storybook-static, read-only) it opens the two Google sections of the Modal Story `DeleteConfirmPassword`
// (the census rows `~delete-google` and `~delete-google-ready`, opened through their own triggers) over 16 widths x sq, en, uk, it, and checks:
//  - GR-3h: every dialog section box has a computed padding-top and padding-bottom equal to `var(--mantine-spacing-lg)` (the rhythm token of MantineDialogSections, C189);
//  - GR-3i: the typed field's label has scrollWidth <= clientWidth, no ellipsis and no line clamp;
//  - the field follows the Google section in DOM order (three sections: message, Google, typed field), and the red primary is disabled while the field is empty;
//  - the dialog has no horizontal overflow.
// Usage (repository root): node docs/sessions/evidence/task927/a7/a7-06-rhythm.mjs [outfile]
import http from 'node:http'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(path.resolve('package.json'))
const { chromium } = require('playwright')
const outFile = process.argv[2] ?? 'docs/sessions/evidence/task927/a7/a7-06-rhythm.txt'
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
const STORY = 'mantine-primitives-modal--delete-confirm-password'
const url = (l) => `http://127.0.0.1:${port}/iframe.html?id=${STORY}&viewMode=story&globals=locale:${l}`
const WIDTHS = [320, 375, 390, 480, 560, 639, 640, 680, 768, 810, 960, 1024, 1200, 1440, 1920, 2560]
const LOCALES = ['sq', 'en', 'uk', 'it']
// GOOGLE_SEL (Task 927 Review 11) selects our own button ([data-google-sign-in], Amendment 10) instead of the class of the button Google draws
const GOOGLE = process.env.GOOGLE_SEL ?? '.nsm7Bb-HzV7m-LgbsSe'

// the two census rows come from the registry itself, so the probe opens exactly what the census opens
const registry = JSON.parse(fs.readFileSync('scripts/rendered-interaction-states.json', 'utf8'))
const ROWS = [`${STORY}~delete-google`, `${STORY}~delete-google-ready`].map((id) => {
  const row = registry.states.find((s) => s.id === id)
  if (!row) throw new Error(`census row ${id} is not in the registry`)
  return { id, trigger: row.trigger, ready: id.endsWith('-ready') }
})

// runs inside the page, with the dialog open: measures the dialog's sections and the typed field
function measureDialog(GOOGLE) {
  const problems = []
  const dialog = document.querySelector('[role="dialog"]')
  if (!dialog) return { problems: ['no dialog'] }
  const input = dialog.querySelector('input')
  if (!input) return { problems: ['no typed field in the dialog'] }
  // the section boxes: the input's section Stack, then its `Box py="lg"`, then the wrapper that holds every section box and the dividers between them
  const typedSection = input.closest('.mantine-Stack-root')
  const typedBox = typedSection.parentElement
  const wrapper = typedBox.parentElement
  const boxes = [...wrapper.children].filter((c) => !c.classList.contains('mantine-Divider-root') && c.getAttribute('role') !== 'separator')

  // the rhythm token, resolved by the browser
  const ref = document.createElement('div')
  ref.style.paddingTop = 'var(--mantine-spacing-lg)'
  ref.style.paddingBottom = 'var(--mantine-spacing-lg)'
  dialog.appendChild(ref)
  const expected = { top: parseFloat(getComputedStyle(ref).paddingTop), bottom: parseFloat(getComputedStyle(ref).paddingBottom) }
  ref.remove()
  if (!(expected.top > 0)) problems.push(`the token --mantine-spacing-lg resolved to ${expected.top}px`)

  const padding = boxes.map((box) => {
    const cs = getComputedStyle(box)
    return { top: parseFloat(cs.paddingTop), bottom: parseFloat(cs.paddingBottom) }
  })
  padding.forEach((p, i) => {
    if (p.top !== expected.top || p.bottom !== expected.bottom) problems.push(`section ${i + 1} padding ${p.top}/${p.bottom}px, token ${expected.top}/${expected.bottom}px`)
  })

  // order: message, Google, typed field; the field follows the Google section in DOM order
  if (boxes.length !== 3) problems.push(`the dialog has ${boxes.length} sections, expected 3 (message, Google, typed field)`)
  const typedIndex = boxes.indexOf(typedBox)
  if (typedIndex !== 2) problems.push(`the typed field is in section ${typedIndex + 1}, expected 3`)
  const googleBox = boxes[1]
  const follows = googleBox ? Boolean(googleBox.compareDocumentPosition(input) & Node.DOCUMENT_POSITION_FOLLOWING) : false
  if (!follows) problems.push('the typed field does not follow the Google section in DOM order')

  // GR-3i: the label wraps instead of being cut
  const label = dialog.querySelector(`label[for="${input.id}"]`)
  let text = null
  if (!label) problems.push('the typed field has no label')
  else {
    const cs = getComputedStyle(label)
    const lineHeight = parseFloat(cs.lineHeight)
    text = {
      sw: label.scrollWidth, cw: label.clientWidth, sh: label.scrollHeight, ch: label.clientHeight,
      ellipsis: cs.textOverflow === 'ellipsis', clamp: cs.webkitLineClamp !== 'none' && cs.webkitLineClamp !== '',
      lines: Math.round(label.getBoundingClientRect().height / lineHeight), text: label.textContent,
    }
    if (label.scrollWidth > label.clientWidth) problems.push(`the label is clipped (${label.scrollWidth} > ${label.clientWidth})`)
    if (label.scrollHeight > label.clientHeight) problems.push(`the label is clipped in height (${label.scrollHeight} > ${label.clientHeight})`)
    if (text.ellipsis) problems.push('the label has an ellipsis')
    if (text.clamp) problems.push('the label has a line clamp')
  }

  // the red primary waits for the word
  const buttons = [...dialog.querySelectorAll('button')]
  const primary = buttons[buttons.length - 1]
  const primaryDisabled = Boolean(primary && primary.disabled)
  if (!primaryDisabled) problems.push('the primary is not disabled while the field is empty')

  const overflow = dialog.scrollWidth - dialog.clientWidth
  const page = document.documentElement
  if (overflow > 0 || page.scrollWidth - page.clientWidth > 0) problems.push(`horizontal overflow dialog ${overflow}px, page ${page.scrollWidth - page.clientWidth}px`)
  return { problems, sections: boxes.length, padding: padding.map((p) => `${p.top}/${p.bottom}`).join(' '), token: `${expected.top}/${expected.bottom}`, text, primaryDisabled, overflow, googleDrawn: Boolean(document.querySelector(`[role="dialog"] ${GOOGLE}`)) }
}

const results = {}
async function worker(l) {
  const out = []
  for (const width of WIDTHS) {
    const page = await browser.newPage({ viewport: { width, height: 900 } })
    for (const row of ROWS) {
      await page.goto(url(l))
      await page.waitForSelector('#storybook-root button', { timeout: 30000 })
      const opened = await page.evaluate((trigger) => {
        const button = document.querySelector('#storybook-root').querySelector(trigger)
        if (!button) return false
        button.click()
        return true
      }, row.trigger)
      if (!opened) { out.push({ l, width, id: row.id, problems: ['the census trigger was not found'] }); continue }
      await page.waitForSelector('[role="dialog"] input', { timeout: 30000 }).catch(() => null)
      if (row.ready) await page.waitForSelector(`[role="dialog"] ${GOOGLE}`, { timeout: 30000 }).catch(() => null)
      await page.waitForTimeout(800)
      const m = await page.evaluate(measureDialog, GOOGLE)
      if (row.ready && m.googleDrawn === false) m.problems.push("Google's button is not drawn in the ready section")
      out.push({ l, width, id: row.id, ...m })
    }
    await page.close()
  }
  results[l] = out
}
await Promise.all(LOCALES.map(worker))

const lines = [
  '# a7-06: rhythm, label wrap, order and overflow probe of the two Google sections of the deletion Story',
  `platform: ${os.platform()} ${os.release()}`, `node: ${process.version}`, `cwd: ${process.cwd()}`,
  `command: node docs/sessions/evidence/task927/a7/a7-06-rhythm.mjs`, `started: ${new Date().toISOString()}`,
  `widths: ${WIDTHS.join(', ')}; locales: ${LOCALES.join(', ')}; rows: ${ROWS.map((r) => r.id.split('~')[1]).join(', ')}`, '',
]
let cells = 0, failed = 0
for (const l of LOCALES) for (const r of results[l]) {
  cells++
  if (r.problems.length) failed++
  const label = r.text ? ` | label ${r.text.sw}/${r.text.cw} lines ${r.text.lines} ellipsis ${r.text.ellipsis} clamp ${r.text.clamp}` : ''
  lines.push(`${r.l} ${r.width} ${r.id.split('~')[1]}: ${r.problems.length ? 'FAIL ' + r.problems.join('; ') : 'ok'}${r.padding ? ` | padding ${r.padding} (token ${r.token})` : ''}${label}${r.primaryDisabled !== undefined ? ` | primary disabled ${r.primaryDisabled}` : ''}`)
}
lines.push('', `cells ${cells}; cells with a problem: ${failed}`, `exit code: ${failed ? 1 : 0}`)
fs.writeFileSync(outFile, lines.join('\n') + '\n')
console.log(lines.slice(-3).join('\n'))
await browser.close()
server.close()
process.exitCode = failed ? 1 : 0
