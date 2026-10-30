// Task 927 Review 13 (Opus), read-only probe on `npm run dev` at http://localhost:3000 (Playwright Chromium; the Chrome extension was not connected).
// 1. The sign-in sheet's Google button opens Google's window in the click; the window's address carries Amendment 10's query; Google's page loads.
// 2. The window is closed by the person: once this page has focus again the attempt ends with no notice and the button is ready again; a second click opens a new attempt.
// 3. Vercel Analytics in development (debug script): the pageview of a normal page is logged, the callback page's is not (R56, withoutAuthCallback).
// No account is chosen in Google's window: no sign-in happens.
import { chromium } from 'playwright'

const BASE = 'http://localhost:3000'
const log = (...a) => console.log(...a)
const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
let failures = 0
const check = (ok, label) => { log(`${ok ? 'ok  ' : 'FAIL'} ${label}`); if (!ok) failures++ }

// --- 3. analytics on a normal page and on the callback page
const analyticsOf = async (url) => {
  const page = await context.newPage()
  const lines = []
  page.on('console', m => { const t = m.text(); if (/Vercel (Web Analytics|Speed Insights)/i.test(t)) lines.push(t.replace(/\s+/g, ' ').slice(0, 220)) })
  await page.goto(url, { waitUntil: 'load', timeout: 180000 })
  await page.waitForTimeout(6000)
  const href = page.isClosed() ? '(closed)' : page.url()
  if (!page.isClosed()) await page.close()
  return { lines, href }
}
const home = await analyticsOf(`${BASE}/en`)
log('home analytics lines:'); home.lines.forEach(l => log('  ' + l))
check(home.lines.some(l => /\[view\] http:\/\/localhost:3000\/en/.test(l)) && home.lines.some(l => /transformed by `beforeSend`/.test(l)),'a normal page sends its view through beforeSend')
const callback = await analyticsOf(`${BASE}/auth/google/callback#id_token=zz.synthetic.idtoken&state=zz-state`)
log('callback analytics lines:'); callback.lines.forEach(l => log('  ' + l))
check(!callback.lines.some(l => /\[view\]/.test(l)) && callback.lines.some(l => /ignored by `beforeSend` because null was returned/.test(l)),'the callback page sends no view: beforeSend returned null')
check(!callback.lines.some(l => l.includes('zz.synthetic.idtoken')), 'no analytics line carries the token')

// --- 1. the Google window
const page = await context.newPage()
await page.goto(`${BASE}/en`, { waitUntil: 'load', timeout: 180000 })
await page.waitForTimeout(3000)
await page.evaluate(() => window.dispatchEvent(new CustomEvent('lero:open-auth-sheet', { detail: { view: 'login' } })))
const button = page.locator('[data-google-sign-in]').first()
await button.waitFor({ state: 'visible', timeout: 60000 })
await page.waitForTimeout(1500)
await page.evaluate(() => {
  window.__opens = []
  const original = window.open
  window.open = function (...args) { window.__opens.push({ url: String(args[0]), name: args[1], features: args[2], activation: navigator.userActivation ? navigator.userActivation.isActive : null }); return original.apply(this, args) }
})
const [popup] = await Promise.all([context.waitForEvent('page', { timeout: 30000 }), button.click()])
const opens = await page.evaluate(() => window.__opens)
check(opens.length === 1, `one window.open per click (${opens.length})`)
check(opens[0]?.activation === true, `window.open ran with the click's user activation (isActive=${opens[0]?.activation})`)
const url = new URL(opens[0].url)
log('window name/features:', opens[0].name, opens[0].features)
check(`${url.origin}${url.pathname}` === 'https://accounts.google.com/o/oauth2/v2/auth', 'Google\'s authorization endpoint')
const q = Object.fromEntries(url.searchParams)
log('query keys:', Object.keys(q).join(','))
check(q.redirect_uri === `${BASE}/auth/google/callback` && q.response_type === 'id_token' && q.scope === 'openid email profile' && q.prompt === 'select_account' && q.hl === 'en', 'query values')
check(/^[0-9a-f]{64}$/.test(q.nonce) && /^[A-Za-z0-9_-]{43}$/.test(q.state), 'hashed nonce and state')
await popup.waitForLoadState('domcontentloaded', { timeout: 60000 }).catch(() => {})
await popup.waitForTimeout(4000)
const popupHost = new URL(popup.url()).host
const popupText = (await popup.locator('body').innerText().catch(() => '')).replace(/\s+/g, ' ')
log('popup host:', popupHost)
log('popup text (first 300):', popupText.slice(0, 300))
check(popupHost === 'accounts.google.com', 'the window shows Google\'s page')
check(/lero\.al/i.test(popupText), 'Google\'s page names Lero.al')
check(await button.getAttribute('data-loading') !== null || await button.isDisabled(), 'the button is pending while the window is open')

// --- 2. the person closes the window
await popup.close()
await page.bringToFront()
await page.waitForTimeout(1500)
const hasFocus = await page.evaluate(() => document.hasFocus())
log('opener hasFocus after close:', hasFocus)
const pendingAfter = (await button.getAttribute('data-loading')) !== null
const alerts = await page.locator('[role="alert"]').allInnerTexts()
check(!pendingAfter, 'the button is ready again after the closed window')
check(!alerts.some(t => /Google/i.test(t)), `no Google notice after a closed window (${JSON.stringify(alerts)})`)
await page.waitForTimeout(1000)
const [popup2] = await Promise.all([context.waitForEvent('page', { timeout: 30000 }), button.click()])
const opens2 = await page.evaluate(() => window.__opens)
const state2 = new URL(opens2[1].url).searchParams.get('state')
check(opens2.length === 2 && state2 !== q.state, 'a second click opens a new attempt with a new state')
await popup2.close()

await browser.close()
log(`failures ${failures}`)
process.exit(failures ? 1 : 0)
