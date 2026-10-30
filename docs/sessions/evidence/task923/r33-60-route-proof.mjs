// Task 923 R114 (h), AC113: the route proof of the human check on the OWNER'S running local server (default http://localhost:3000; its real site key shows a headless browser the interactive
// challenge, C1039). It signs in with HYDRATION_AGENT1 (HYDRATION_AGENT1_EMAIL / _PASSWORD read from .env.local; nothing secret is printed or saved) and opens the first active listing of /uk/listings
// whose contact card shows Call and Send message. For every width of 320, 360, 390, 639, 640, 1024 and 1440 px in sq, en, uk and it it records, with getBoundingClientRect / getComputedStyle (never by eye):
//   before a press   the human-check box has display:none and takes no space (the next block starts one card gap below the grid); the card and the page have no horizontal overflow;
//   after a press    of Call the challenge is visible, lies inside the card (no horizontal overflow), its top is the card Stack's gap (the theme's md spacing) below the grid's bottom (GR-3h), and the
//                    block after it starts one gap below it; the agent name and the Call, WhatsApp and Send message labels keep their line count (GR-3i).
// At 320 and 1440 px in uk it also opens the message dialog, fills valid values and presses Send: the challenge is visible inside the dialog section, without overflow, one section gap (sm) below the message field.
// Once, at 390 px in uk, it waits until the refusal toast's text appears after the unanswered challenge. Screenshots at 320 and 1440 px are saved.
// Usage (the server must be running; this must run BEFORE `npm run build`, which breaks the running dev server): node docs/sessions/evidence/task923/r33-60-route-proof.mjs [root]
// Environment: PROOF_BASE (default http://localhost:3000), PROOF_WIDTHS, PROOF_LOCALES, PROOF_SKIP_TOAST=1.
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const ROOT = path.resolve(process.argv[2] ?? path.join(import.meta.dirname, '..', '..', '..', '..'))
const require = createRequire(path.join(ROOT, 'package.json'))
const { chromium } = require('playwright')
const BASE = process.env.PROOF_BASE ?? 'http://localhost:3000'
const WIDTHS = (process.env.PROOF_WIDTHS ?? '320,360,390,639,640,1024,1440').split(',').map(Number)
const LOCALES = (process.env.PROOF_LOCALES ?? 'sq,en,uk,it').split(',')
const OUT_DIR = path.join(ROOT, 'docs/sessions/evidence/task923')
const SHOTS = path.join(OUT_DIR, 'r33-60-route-proof-shots')
const JSONL = path.join(OUT_DIR, 'r33-60-route-proof.jsonl')
fs.mkdirSync(SHOTS, { recursive: true })
fs.writeFileSync(JSONL, '')

const env = Object.fromEntries(fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8').split(/\r?\n/).filter((l) => /^[A-Z0-9_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).replace(/^"|"$/g, '')]))
if (!env.HYDRATION_AGENT1_EMAIL || !env.HYDRATION_AGENT1_PASSWORD) throw new Error('HYDRATION_AGENT1_EMAIL / HYDRATION_AGENT1_PASSWORD are not in .env.local')
const messages = Object.fromEntries(LOCALES.map((loc) => [loc, JSON.parse(fs.readFileSync(path.join(ROOT, 'messages', `${loc}.json`), 'utf8')).listing]))

const record = (row) => fs.appendFileSync(JSONL, JSON.stringify(row) + '\n')
const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await context.newPage()

// ---------------------------------------------------------------- sign in (no secret is printed)
await page.goto(`${BASE}/uk/auth/login`, { waitUntil: 'networkidle', timeout: 240000 })
await page.fill('input[type="email"]', env.HYDRATION_AGENT1_EMAIL)
await page.fill('input[type="password"]', env.HYDRATION_AGENT1_PASSWORD)
await Promise.all([page.waitForURL((u) => !/\/auth\/login/.test(String(u)), { timeout: 90000 }).catch(() => null), page.click('button[type="submit"]')])
const me = await page.request.get(`${BASE}/api/auth/me`)
console.log(`signed in as HYDRATION_AGENT1: /api/auth/me ${me.status()}`)
if (me.status() !== 200) { console.log('FAIL: not signed in'); await browser.close(); process.exit(1) }

// ---------------------------------------------------------------- the first active listing whose card shows Call and Send message
await page.setViewportSize({ width: 1440, height: 900 })
await page.goto(`${BASE}/uk/listings`, { waitUntil: 'load', timeout: 240000 })
await page.waitForSelector('a[href*="/listings/"]', { timeout: 120000 })
const hrefs = await page.evaluate(() => [...new Set([...document.querySelectorAll('a[href*="/listings/"]')].map((a) => new URL(a.href).pathname).filter((p) => /^\/uk\/listings\/[^/]+$/.test(p)))])
let slug = null
for (const href of hrefs.slice(0, 25)) {
  await page.goto(`${BASE}${href}`, { waitUntil: 'load', timeout: 240000 })
  await page.waitForTimeout(1500)
  const found = await page.evaluate(({ call, send }) => {
    const card = document.querySelector('[data-testid="listing-contact-card"]')
    if (!card) return false
    const names = [...card.querySelectorAll('button')].filter((b) => !b.disabled).map((b) => (b.textContent ?? '').trim())
    return names.includes(call) && names.includes(send)
  }, { call: messages.uk.call, send: messages.uk.send_message })
  if (found) { slug = href.split('/').pop(); break }
}
if (!slug) { console.log('FAIL: no active listing with Call and Send message among the first listings of /uk/listings'); await browser.close(); process.exit(1) }
console.log(`listing: ${slug}`)

// ---------------------------------------------------------------- in-page probes
/** everything the page-side measurements share; passed as a string so that it is defined in the page */
const PAGE_HELPERS = `
  const lines = (el) => { if (!el) return null; const r = document.createRange(); r.selectNodeContents(el); return new Set([...r.getClientRects()].filter((q) => q.width > 0 && q.height > 0).map((q) => Math.round(q.top))).size }
  const num = (v) => parseFloat(v)
  const r2 = (n) => Math.round(n * 100) / 100
  const locate = (labels) => {
    const card = document.querySelector('[data-testid="listing-contact-card"]')
    const buttons = [...card.querySelectorAll('button')]
    const callBtn = buttons.find((b) => (b.textContent ?? '').trim() === labels.call)
    const waBtn = buttons.find((b) => (b.textContent ?? '').trim() === labels.whatsapp)
    const sendBtn = buttons.find((b) => (b.textContent ?? '').trim() === labels.send)
    const stack = card.firstElementChild
    const gridWrap = [...stack.children].find((c) => c.contains(callBtn))
    const box = gridWrap.nextElementSibling
    const after = box ? box.nextElementSibling : null
    const agent = [...card.querySelectorAll('p, div')].find((e) => e.children.length === 0 && getComputedStyle(e).fontWeight === '600' && (e.textContent ?? '').trim())
    const label = (b) => b ? (b.querySelector('[class*="Button-label"]') ?? b) : null
    return { card, stack, gridWrap, box, after, callBtn, waBtn, sendBtn, agent, label }
  }
  const cardState = (labels) => {
    const { card, stack, gridWrap, box, after, agent, label, callBtn, waBtn, sendBtn } = locate(labels)
    const cb = card.getBoundingClientRect(), cs = getComputedStyle(card)
    const content = { left: cb.left + num(cs.paddingLeft) + num(cs.borderLeftWidth), right: cb.right - num(cs.paddingRight) - num(cs.borderRightWidth) }
    const gb = gridWrap.getBoundingClientRect()
    const bb = box ? box.getBoundingClientRect() : null
    const ab = after ? after.getBoundingClientRect() : null
    const iframe = box ? box.querySelector('iframe') : null
    const ib = iframe ? iframe.getBoundingClientRect() : null
    const gap = num(getComputedStyle(stack).rowGap)
    return {
      boxDisplay: box ? getComputedStyle(box).display : null,
      boxHeight: bb ? r2(bb.height) : null,
      mdToken: getComputedStyle(document.documentElement).getPropertyValue('--mantine-spacing-md').trim(),
      stackGap: gap,
      gridBottom: r2(gb.bottom),
      boxTopMinusGridBottom: bb && bb.height > 0 ? r2(bb.top - gb.bottom) : null,
      afterTopMinusGridBottom: ab ? r2(ab.top - gb.bottom) : null,
      afterTopMinusBoxBottom: bb && bb.height > 0 && ab ? r2(ab.top - bb.bottom) : null,
      iframeRect: ib ? { left: r2(ib.left), right: r2(ib.right), width: r2(ib.width), height: r2(ib.height) } : null,
      iframeInsideCard: ib ? ib.left >= content.left - 0.5 && ib.right <= content.right + 0.5 : null,
      boxInsideCard: bb && bb.height > 0 ? bb.left >= content.left - 0.5 && bb.right <= content.right + 0.5 : null,
      cardOverflow: card.scrollWidth > card.clientWidth + 0.5,
      pageOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 0.5,
      cardContentWidth: r2(content.right - content.left),
      contentLeft: r2(content.left),
      contentRight: r2(content.right),
      lines: { agent: lines(agent), call: lines(label(callBtn)), whatsapp: lines(label(waBtn)), send: lines(label(sendBtn)) },
      nextBlockIsSend: ab ? !!(after.contains(sendBtn) || after === sendBtn || (sendBtn && after.contains(sendBtn))) : null,
    }
  }
`
const cardProbe = (labels) => page.evaluate(`(() => { ${PAGE_HELPERS}; return cardState(${JSON.stringify(labels)}) })()`)

async function openListing(loc, width) {
  await page.setViewportSize({ width, height: 900 })
  await page.goto(`${BASE}/${loc}/listings/${slug}`, { waitUntil: 'load', timeout: 240000 })
  await page.waitForSelector('[data-testid="listing-contact-card"]', { timeout: 120000 })
  await page.waitForTimeout(1500)
}
/** Cloudflare's iframe sits in a closed shadow root, so it is found through its frame, not through the DOM: its rectangle in the main frame's viewport, or null. */
async function challengeIframeBox() {
  for (const frame of page.frames()) {
    if (!/challenges\.cloudflare\.com/.test(frame.url()) || frame.parentFrame() !== page.mainFrame()) continue
    const handle = await frame.frameElement().catch(() => null)
    const box = handle ? await handle.boundingBox() : null
    if (box && box.width > 0 && box.height > 0) return { left: Math.round(box.x * 100) / 100, right: Math.round((box.x + box.width) * 100) / 100, width: Math.round(box.width * 100) / 100, height: Math.round(box.height * 100) / 100 }
  }
  return null
}
const labelsOf = (loc) => ({ call: messages[loc].call, whatsapp: messages[loc].whatsapp_button_label, send: messages[loc].send_message })
const near = (a, b) => a !== null && b !== null && Math.abs(a - b) < 0.51

async function cardJob(loc, width) {
  const labels = labelsOf(loc)
  const row = { kind: 'card', locale: loc, width, slug, problems: [] }
  try {
    await openListing(loc, width)
    const before = await cardProbe(labels)
    row.before = before
    if (before.boxDisplay !== 'none') row.problems.push(`before a press the human-check box is not display:none (${before.boxDisplay})`)
    if (before.cardOverflow || before.pageOverflow) row.problems.push('horizontal overflow before a press')
    // it takes no space: the block after it starts exactly one gap below the grid
    if (!near(before.afterTopMinusGridBottom, before.stackGap)) row.problems.push(`before a press the next block starts ${before.afterTopMinusGridBottom} below the grid, expected one gap (${before.stackGap})`)

    await page.getByRole('button', { name: labels.call, exact: true }).click()
    await page.waitForFunction(`(() => { ${PAGE_HELPERS}; const { box } = locate(${JSON.stringify(labels)}); return !!box && getComputedStyle(box).display !== 'none' && box.getBoundingClientRect().height > 0 })()`, null, { timeout: 60000 })
    await page.waitForTimeout(1200)
    const afterState = await cardProbe(labels)
    row.after = afterState
    const iframe = await challengeIframeBox()
    afterState.iframeRect = iframe
    afterState.iframeInsideCard = iframe ? iframe.left >= afterState.contentLeft - 0.5 && iframe.right <= afterState.contentRight + 0.5 : null
    if (afterState.boxDisplay === 'none') row.problems.push('after a press the challenge is not visible')
    if (!iframe) row.problems.push('after a press the challenge iframe was not found')
    if (iframe && (Math.abs(iframe.width - 150) > 1 || Math.abs(iframe.height - 140) > 1)) row.problems.push(`the challenge is ${iframe.width} x ${iframe.height}, expected the compact 150 x 140`)
    if (afterState.cardOverflow || afterState.pageOverflow) row.problems.push('horizontal overflow after a press')
    if (afterState.boxInsideCard === false || afterState.iframeInsideCard === false) row.problems.push('the challenge does not lie inside the card')
    if (!near(afterState.boxTopMinusGridBottom, afterState.stackGap)) row.problems.push(`the challenge top is ${afterState.boxTopMinusGridBottom} below the grid, expected the md gap (${afterState.stackGap})`)
    if (afterState.afterTopMinusBoxBottom !== null && !near(afterState.afterTopMinusBoxBottom, afterState.stackGap)) row.problems.push(`the next block starts ${afterState.afterTopMinusBoxBottom} below the challenge, expected the md gap (${afterState.stackGap})`)
    if (afterState.mdToken !== '1rem') row.problems.push(`the md spacing token is ${afterState.mdToken}, expected 1rem`)
    for (const key of Object.keys(before.lines)) if (before.lines[key] !== afterState.lines[key]) row.problems.push(`GR-3i: the ${key} label changed its line count (${before.lines[key]} -> ${afterState.lines[key]})`)
    if ([320, 1440].includes(width)) await page.locator('[data-testid="listing-contact-card"]').screenshot({ path: path.join(SHOTS, `card-${loc}-${width}.png`) })
  } catch (error) { row.problems.push(`probe: ${String(error).slice(0, 240)}`) }
  row.pass = row.problems.length === 0
  record(row)
  console.log(`${row.pass ? 'PASS' : 'FAIL'} card ${loc} ${width}${row.problems.length ? ' :: ' + row.problems.join(' | ') : ''}`)
  return row.pass
}

const DIALOG_HELPERS = `
  const dialogLocate = () => {
    const dialog = document.querySelector('[role="dialog"]')
    const textarea = dialog ? dialog.querySelector('textarea') : null
    if (!textarea) return {}
    let field = textarea
    while (field && !(field.parentElement && field.parentElement.children.length >= 4 && getComputedStyle(field.parentElement).display === 'flex')) field = field.parentElement
    return { dialog, textarea, field, section: field ? field.parentElement : null, box: field ? field.nextElementSibling : null }
  }
`
async function dialogJob(loc, width) {
  const labels = labelsOf(loc)
  const m = messages[loc]
  const row = { kind: 'dialog', locale: loc, width, slug, problems: [] }
  try {
    await openListing(loc, width)
    await page.getByRole('button', { name: labels.send, exact: true }).click()
    await page.getByRole('dialog').waitFor({ timeout: 30000 })
    await page.getByRole('dialog').getByLabel(m.inquiry_name_label).fill('Alba Hoxha')
    await page.getByRole('dialog').getByLabel(m.inquiry_email_label).fill('alba.hoxha@example.com')
    await page.getByRole('dialog').getByLabel(m.inquiry_message_label).fill('Hello, I am interested in this flat. May we arrange a visit this week?')
    const measure = () => page.evaluate(`(() => { ${DIALOG_HELPERS}
      const { dialog, field, section, box } = dialogLocate()
      const r2 = (n) => Math.round(n * 100) / 100
      const fb = field.getBoundingClientRect(), bb = box ? box.getBoundingClientRect() : null, sb = section.getBoundingClientRect()
      const scs = getComputedStyle(section)
      const body = dialog.querySelector('[class*="body"], [class*="Body"]') ?? dialog
      return {
        boxDisplay: box ? getComputedStyle(box).display : null,
        sectionGap: parseFloat(scs.rowGap),
        smToken: getComputedStyle(document.documentElement).getPropertyValue('--mantine-spacing-sm').trim(),
        boxTopMinusFieldBottom: bb && bb.height > 0 ? r2(bb.top - fb.bottom) : null,
        boxInsideSection: bb && bb.height > 0 ? bb.left >= sb.left - 0.5 && bb.right <= sb.right + 0.5 : null,
        sectionLeft: r2(sb.left),
        sectionRight: r2(sb.right),
        dialogOverflow: dialog.scrollWidth > dialog.clientWidth + 0.5 || body.scrollWidth > body.clientWidth + 0.5,
        pageOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 0.5,
      } })()`)
    row.before = await measure()
    if (row.before.boxDisplay !== 'none') row.problems.push(`before Send the human-check box is not display:none (${row.before.boxDisplay})`)
    await page.getByRole('dialog').getByRole('button', { name: m.inquiry_submit, exact: true }).click()
    await page.waitForFunction(`(() => { ${DIALOG_HELPERS}; const { box } = dialogLocate(); return !!box && getComputedStyle(box).display !== 'none' && box.getBoundingClientRect().height > 0 })()`, null, { timeout: 60000 })
    await page.waitForTimeout(1200)
    const after = await measure()
    row.after = after
    const iframe = await challengeIframeBox()
    after.iframeRect = iframe
    after.iframeInsideSection = iframe ? iframe.left >= after.sectionLeft - 0.5 && iframe.right <= after.sectionRight + 0.5 : null
    if (after.boxDisplay === 'none') row.problems.push('after Send the challenge is not visible')
    if (!iframe) row.problems.push('after Send the challenge iframe was not found')
    if (iframe && (Math.abs(iframe.width - 150) > 1 || Math.abs(iframe.height - 140) > 1)) row.problems.push(`the challenge is ${iframe.width} x ${iframe.height}, expected the compact 150 x 140`)
    if (after.boxInsideSection === false || after.iframeInsideSection === false) row.problems.push('the challenge does not lie inside the dialog section')
    if (after.dialogOverflow || after.pageOverflow) row.problems.push('horizontal overflow after Send')
    if (!near(after.boxTopMinusFieldBottom, after.sectionGap)) row.problems.push(`the challenge top is ${after.boxTopMinusFieldBottom} below the message field, expected the sm gap (${after.sectionGap})`)
    if (after.smToken !== '0.75rem') row.problems.push(`the sm spacing token is ${after.smToken}, expected 0.75rem`)
    await page.getByRole('dialog').screenshot({ path: path.join(SHOTS, `dialog-${loc}-${width}.png`) })
  } catch (error) { row.problems.push(`probe: ${String(error).slice(0, 240)}`) }
  row.pass = row.problems.length === 0
  record(row)
  console.log(`${row.pass ? 'PASS' : 'FAIL'} dialog ${loc} ${width}${row.problems.length ? ' :: ' + row.problems.join(' | ') : ''}`)
  return row.pass
}

async function toastJob() {
  const loc = 'uk', width = 390
  const labels = labelsOf(loc)
  const expected = messages[loc].contact_bot_check_failed
  const row = { kind: 'toast', locale: loc, width, slug, expected, problems: [] }
  const started = Date.now()
  try {
    await openListing(loc, width)
    await page.getByRole('button', { name: labels.call, exact: true }).click()
    await page.getByText(expected, { exact: true }).first().waitFor({ timeout: 90000 })
    row.secondsUntilToast = Math.round((Date.now() - started) / 100) / 10
  } catch (error) { row.problems.push(`the refusal toast text did not appear: ${String(error).slice(0, 200)}`) }
  row.pass = row.problems.length === 0
  record(row)
  console.log(`${row.pass ? 'PASS' : 'FAIL'} toast ${loc} ${width}${row.problems.length ? ' :: ' + row.problems.join(' | ') : ` after ${row.secondsUntilToast} s: "${expected}"`}`)
  return row.pass
}

let failures = 0
for (const loc of LOCALES) for (const width of WIDTHS) if (!(await cardJob(loc, width))) failures++
if (LOCALES.includes('uk')) for (const width of [320, 1440].filter((w) => WIDTHS.includes(w))) if (!(await dialogJob('uk', width))) failures++
if (LOCALES.includes('uk') && !process.env.PROOF_SKIP_TOAST) if (!(await toastJob())) failures++
await browser.close()
console.log(failures === 0 ? 'ALL PASS' : `${failures} FAILED`)
process.exit(failures === 0 ? 0 : 1)
