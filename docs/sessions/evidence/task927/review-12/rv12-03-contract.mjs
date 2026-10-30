// Task 927 Amendment 11 (Opus, 2026-10-26): adds the cases of R53–R58 to the security contract and their paths to the scope. Keeps line endings; idempotent.
// Leaves executionStatus as it is (the readiness script sets it). Usage: node docs/sessions/evidence/task927/review-12/rv12-03-contract.mjs
import fs from 'node:fs'

const FILE = 'tasks/Sprints/Sprint_91_kickoff_prompt_Task_927_Google_Sign_In_Shows_Lero_Al.security.json'
const POPUP = 'src/lib/auth/__tests__/googlePopup.test.ts'
const SHEET = 'src/modules/auth/components/__tests__/AuthSheet.google.security.test.tsx'
const SINKS = 'src/__tests__/security/clientSinks.test.ts'
const ANALYTICS = 'src/lib/analytics/__tests__/beforeSend.security.test.ts'

const t = fs.readFileSync(FILE, 'utf8')
const eol = t.includes('\r\n') ? '\r\n' : '\n'
const c = JSON.parse(t)
const byId = (id) => c.cases.find((x) => x.id === id)

Object.assign(byId('SEC-927-FE-POPUP-CANCEL'), {
  input: 'the window closed once this page has focus; error access_denied; error server_error; 5 minutes with no answer',
})

const add = (x) => { if (!byId(x.id)) c.cases.push({ layer: 'frontend', critical: false, boundary: 'unit', ...x }) }
add({ id: 'SEC-927-FE-POPUP-FOCUS', outcome: 'allow', invariant: "A window that only looks closed while the person is still on Google's page does not end the attempt", actor: 'the visitor on Google\'s page', resource: 'googlePopup', input: 'popup.closed true while document.hasFocus() is false; then document.hasFocus() true', response: 'the attempt stays pending while the page has no focus; it rejects cancelled once the page has focus', forbiddenEffects: ['a rejection while the page has no focus'], testFile: POPUP, testName: '[SEC-927-FE-POPUP-FOCUS] a closed window ends the attempt only once this page has focus again' })
add({ id: 'SEC-927-FE-POPUP-SYNC-OPEN', outcome: 'allow', invariant: "Google's window opens in the click itself, so a browser keeps the click's permission to open it", actor: 'an anonymous visitor in the login view', resource: 'GoogleSignInButton and googlePopup', input: 'the preparation flushed, then fireEvent.click on the Google button', response: 'window.open called once before the test awaits anything, with the prepared URL', forbiddenEffects: ['window.open called after an await in the click'], testFile: SHEET, testName: "[SEC-927-FE-POPUP-SYNC-OPEN] a click opens Google's window at once, with the attempt prepared before it" })
add({ id: 'SEC-927-FE-SINKS-EXCEPTION', outcome: 'deny', invariant: "Only Google's sign-in window, with its exact call in googlePopup.ts, may keep the opener (Task 927 D27)", actor: 'a component that opens a window', resource: 'clientSinks windowOpenViolations', input: 'a planted file holding the allowed call text under another name; a planted googlePopup.ts holding window.open(x, \'y\'); the real source files', response: 'both planted calls reported; the real files give no violation', forbiddenEffects: ['the exception matching another file or another call'], testFile: SINKS, testName: "[SEC-927-FE-SINKS-EXCEPTION] the noopener rule excuses only Google's sign-in window in googlePopup.ts" })
add({ id: 'SEC-927-FE-ANALYTICS-DROP', outcome: 'deny', invariant: 'No analytics event leaves for an /auth page, and no event carries an address fragment', actor: 'the analytics scripts', resource: 'withoutAuthCallback', input: 'events with url http://localhost:3000/auth/google/callback#id_token=zz.synthetic.idtoken&state=s1, https://lero.al/en/listings?x=1#top, https://lero.al/en and not a url', response: 'null for the callback; https://lero.al/en/listings?x=1 for the second; the third unchanged; the fourth unchanged', forbiddenEffects: ['an event for /auth sent', 'zz.synthetic.idtoken in any returned event'], testFile: ANALYTICS, testName: '[SEC-927-FE-ANALYTICS-DROP] analytics drop every /auth event and strip the fragment from every other' })

for (const p of [SINKS, 'src/lib/analytics/beforeSend.ts', ANALYTICS, 'src/app/layout.tsx']) if (!c.scope.includes(p)) c.scope.push(p)

fs.writeFileSync(FILE, JSON.stringify(c, null, 2).replace(/\n/g, eol) + eol)
console.log(`cases ${c.cases.length}; scope ${c.scope.length}; executionStatus ${c.executionStatus}; stage ${c.stage}`)
