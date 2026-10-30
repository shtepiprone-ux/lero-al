// Task 927 Amendment 10 (Opus, 2026-10-26): rewrites the security contract's button cases for our own Google button and Google's popup (owner D25),
// adds the popup and callback cases, removes the two cases of the button's script (no script is loaded for the button any more), and adds the
// new paths to the scope. The One Tap cases and the GIS loader case stay: One Tap is still Google's prompt (D16). Keeps line endings; idempotent.
// Leaves executionStatus as it is (the readiness script sets it). Usage: node docs/sessions/evidence/task927/review-11/rv11-12-contract.mjs
import fs from 'node:fs'

const FILE = 'tasks/Sprints/Sprint_91_kickoff_prompt_Task_927_Google_Sign_In_Shows_Lero_Al.security.json'
const SHEET = 'src/modules/auth/components/__tests__/AuthSheet.google.security.test.tsx'
const POPUP = 'src/lib/auth/__tests__/googlePopup.test.ts'
const RELAY = 'src/app/auth/google/callback/__tests__/GoogleCallbackRelay.security.test.tsx'
const REAUTH = 'src/modules/cabinet/components/__tests__/ProfileTab.googleReauth.security.test.tsx'
const HEADER = 'src/components/layout/__tests__/Header.google.security.test.tsx'

const t = fs.readFileSync(FILE, 'utf8')
const eol = t.includes('\r\n') ? '\r\n' : '\n'
const c = JSON.parse(t)
const byId = (id) => c.cases.find((x) => x.id === id)
const set = (id, fields) => Object.assign(byId(id), fields)

set('SEC-927-FE-ALLOW', {
  invariant: "A Google sign-in creates a session only from the ID token that Google's popup returned for this attempt's state, with this attempt's raw nonce, and lands only on a path of this site",
  resource: 'the AuthSheet login view, GoogleSignInButton and googlePopup',
  input: 'a click on the Google button, then a message from this origin carrying this attempt\'s state and the credential "zz.synthetic.idtoken"; stored destination /en/favorites?tab=2',
  response: 'window.open called once with Google\'s authorization URL whose nonce is sha256hex(raw nonce) and whose state is the message\'s; signInWithGoogleIdToken called once with the credential and the raw nonce; onOpenChange(false); router.push("/en/favorites?tab=2"); the storage key removed',
  forbiddenEffects: ['the raw nonce given to Google', 'the hashed nonce given to Supabase', 'a request to /auth/callback', 'router.push of any other value', 'a second window opened'],
  testName: '[SEC-927-FE-ALLOW] a visitor who picks a Google account in Google\'s window is signed in with that credential and the raw nonce whose SHA-256 Google got, the sheet closes and the stored same-site destination opens',
})
set('SEC-927-FE-DENY-REPLAY', {
  input: 'a second click while the first attempt is pending; two messages for the first state; then a click after the first sign-in failed',
  response: 'window.open called once for the first two clicks; signInWithGoogleIdToken called once for the first state; the next attempt\'s URL carries a new state and the hash of a new raw nonce',
  testName: '[SEC-927-FE-DENY-REPLAY] a second click or a second credential during a pending sign-in does nothing, and the next attempt uses a new state and a new nonce',
})
set('SEC-927-FE-DENY-NOAUTO', {
  input: 'mount of the login view, no click',
  response: 'window.open never called; signInWithGoogleIdToken never called; no Google Identity Services script element in the document; prompt never called',
  testName: '[SEC-927-FE-DENY-NOAUTO] nothing signs a visitor in automatically: no Google window, no Google script and no One Tap before a click',
})
set('SEC-927-FE-ERR-NOCLIENT', {
  input: 'clientId undefined',
  response: 'no Google button rendered; alert text auth.google_unavailable; window.open never called',
  testName: '[SEC-927-FE-ERR-NOCLIENT] without a client ID no Google button is shown and the slot shows the unavailable alert',
})
set('SEC-927-FE-REAUTH-ALLOW', {
  input: "server answers reauth_required, then a click and a message for that attempt's state with a credential whose payload e-mail is Person@Example.com; signInWithGoogleIdToken resolves with this profile's id",
  response: "the authorization URL carries login_hint person@example.com and the SHA-256 hex of the raw nonce; signInWithGoogleIdToken called once with the credential and the raw nonce; the action repeated once",
})
set('SEC-927-FE-REAUTH-ERR', {
  input: 'signInWithGoogleIdToken answers an error; then it throws; then window.open returns null',
  response: 'cabinet.reauth_google_failed twice, then the alert auth.google_popup_blocked; the action not repeated; no leaked credential',
})
set('SEC-927-FE-REAUTH-ONE-CONFIG', {
  response: 'no GoogleSignInButton of the e-mail section is mounted while the dialog is open; after the dialog closes a message carrying the e-mail section\'s state signs in once; initiateEmailChange called a second time with the same new address; deleteOwnAccount not called again',
  forbiddenEffects: ['a message of the dialog\'s attempt completing the e-mail section', 'the deletion repeated', 'two Google buttons mounted at once'],
})
set('SEC-927-FE-REMEMBER-ALLOW', {
  response: "localStorage holds exactly sub, name, maskedEmail and picture under lero:google-account; the reopened sheet shows Welcome back, Arta Krasniqi and ar•••••@example.com; a click on its Google button opens Google's authorization URL with login_hint 000000000000000000001",
})
set('SEC-927-FE-WELCOME-DENY-BANNED', {
  input: 'a click on the Welcome back Google button and a message for its state with the synthetic credential while signInWithGoogleIdToken resolves with a banned error',
})

// The button loads no script any more (D25): the two script cases protected a boundary that is removed by the owner's decision.
c.cases = c.cases.filter((x) => !['SEC-927-FE-ERR-SCRIPT', 'SEC-927-FE-ERR-TIMEOUT'].includes(x.id))

const add = (x) => { if (!byId(x.id)) c.cases.push({ layer: 'frontend', critical: false, boundary: 'unit', ...x }) }
add({ id: 'SEC-927-FE-ERR-POPUP', outcome: 'error', invariant: 'A blocked Google window leaves the sheet usable and signs nobody in', actor: 'an anonymous visitor in the login view', resource: 'the AuthSheet login view and GoogleSignInButton', input: 'window.open returns null on the click', response: 'alert text auth.google_popup_blocked; the Google button enabled again; a following e-mail submit calls signIn', forbiddenEffects: ['signInWithGoogleIdToken called', 'a loader left on the button'], testFile: SHEET, testName: '[SEC-927-FE-ERR-POPUP] when the browser blocks Google\'s window the sheet says so, the button works again and the e-mail sign-in still works' })
add({ id: 'SEC-927-FE-ERR-POPUP-TIMEOUT', outcome: 'error', invariant: 'An attempt with no answer from Google ends and signs nobody in', actor: 'an anonymous visitor in the login view', resource: 'the AuthSheet login view and googlePopup', input: 'a click; no message; fake timers advanced 5 minutes', response: 'alert text auth.google_failed; the window closed; the Google button enabled again', forbiddenEffects: ['signInWithGoogleIdToken called', 'a late message accepted after the timeout'], testFile: SHEET, testName: '[SEC-927-FE-ERR-POPUP-TIMEOUT] an attempt that Google never answers ends after 5 minutes with the failure notice and signs nobody in' })
add({ id: 'SEC-927-FE-POPUP-DENY-ORIGIN', outcome: 'deny', invariant: 'Only this site\'s own callback page can hand an ID token to the opener', actor: 'another site posting to the window', resource: 'googlePopup', input: 'a message from origin https://evil.example with the attempt\'s state and a credential, then the same from this origin', response: 'the first message ignored and the promise still pending; the second resolves with that credential and the raw nonce', forbiddenEffects: ['a credential accepted from another origin'], testFile: POPUP, testName: '[SEC-927-FE-POPUP-DENY-ORIGIN] a credential posted from another origin is ignored' })
add({ id: 'SEC-927-FE-POPUP-DENY-STATE', outcome: 'deny', invariant: 'A credential is accepted only for the state this attempt sent to Google', actor: 'a stale or forged callback', resource: 'googlePopup', input: 'a message from this origin with another state, through the window and through the channel', response: 'both ignored; the promise still pending', forbiddenEffects: ['a credential of another attempt accepted'], testFile: POPUP, testName: '[SEC-927-FE-POPUP-DENY-STATE] a credential carrying another state is ignored on both channels' })
add({ id: 'SEC-927-FE-POPUP-CHANNEL', outcome: 'allow', invariant: 'The callback page reaches the opener even when Google\'s pages cut the window\'s opener', actor: 'the visitor', resource: 'googlePopup', input: 'a BroadcastChannel lero-google-sign-in message with the attempt\'s state and a credential', response: 'the promise resolves with the credential and the raw nonce; the channel closed', forbiddenEffects: ['the credential written to storage, the console or the address'], testFile: POPUP, testName: '[SEC-927-FE-POPUP-CHANNEL] the attempt completes through the broadcast channel when no window message arrives' })
add({ id: 'SEC-927-FE-POPUP-CANCEL', outcome: 'error', invariant: 'A closed window, a refusal at Google or no answer ends the attempt without a credential', actor: 'the visitor', resource: 'googlePopup', input: 'the window closed; error access_denied; error server_error; 5 minutes with no answer', response: 'rejects with cancelled, cancelled, google_error and timeout; on timeout the window is closed', forbiddenEffects: ['a resolved credential', 'a listener or timer left after settling'], testFile: POPUP, testName: '[SEC-927-FE-POPUP-CANCEL] a closed window, a refusal, an error and a timeout each end the attempt without a credential' })
add({ id: 'SEC-927-FE-POPUP-ONCE', outcome: 'deny', invariant: 'An attempt settles once and its state cannot be used again', actor: 'a repeated callback', resource: 'googlePopup', input: 'a valid message, then the same message again', response: 'one resolution; the second message changes nothing; the window and the channel listeners removed', forbiddenEffects: ['a second resolution'], testFile: POPUP, testName: '[SEC-927-FE-POPUP-ONCE] an attempt settles once and ignores the same credential again' })
add({ id: 'SEC-927-FE-CALLBACK-RELAY', outcome: 'allow', invariant: 'The callback page hands Google\'s ID token only to this origin and removes it from the address', actor: 'Google redirecting the window back', resource: 'GoogleCallbackRelay', input: 'the address hash #id_token=zz.synthetic.idtoken&state=s1 with an opener', response: 'opener.postMessage({ type: "lero:google-sign-in", state: "s1", credential: "zz.synthetic.idtoken" }, this origin); the channel lero-google-sign-in posted the same; history.replaceState with the path and no hash; window.close called', forbiddenEffects: ['postMessage with the target origin *', 'the token left in the address'], testFile: RELAY, testName: '[SEC-927-FE-CALLBACK-RELAY] the callback page posts Google\'s ID token to this origin only, clears it from the address and closes the window' })
add({ id: 'SEC-927-FE-CALLBACK-DENY-NOSTATE', outcome: 'deny', invariant: 'A callback without a state relays nothing', actor: 'a crafted link to the callback page', resource: 'GoogleCallbackRelay', input: 'the hash #id_token=zz.synthetic.idtoken without a state', response: 'no postMessage and no channel message; the address cleared; window.close called', forbiddenEffects: ['a relayed credential'], testFile: RELAY, testName: '[SEC-927-FE-CALLBACK-DENY-NOSTATE] a callback without a state relays nothing' })
add({ id: 'SEC-927-FE-CALLBACK-ERR', outcome: 'error', invariant: 'A refusal at Google is relayed as an error without a credential', actor: 'Google redirecting the window back', resource: 'GoogleCallbackRelay', input: 'the hash #error=access_denied&state=s1', response: 'opener.postMessage({ type: "lero:google-sign-in", state: "s1", error: "access_denied" }, this origin); window.close called', forbiddenEffects: ['a credential field in the message'], testFile: RELAY, testName: '[SEC-927-FE-CALLBACK-ERR] a refusal at Google is relayed as an error without a credential' })
add({ id: 'SEC-927-FE-CALLBACK-NOLEAK', outcome: 'deny', invariant: 'The callback page writes the ID token nowhere', actor: 'the visitor', resource: 'GoogleCallbackRelay', input: 'the hash #id_token=zz.synthetic.idtoken&state=s1', response: 'console, localStorage, sessionStorage and the final address hold no zz.synthetic.idtoken', forbiddenEffects: ['the token in the console, storage or the address'], testFile: RELAY, testName: '[SEC-927-FE-CALLBACK-NOLEAK] the callback page writes the ID token to no console, storage or address' })

for (const p of [
  'src/lib/auth/googlePopup.ts', POPUP,
  'src/app/auth/google/callback/page.tsx', 'src/app/auth/google/callback/GoogleCallbackRelay.tsx', RELAY,
  'public/brand/google-g.svg', 'src/modules/cabinet/components/CabinetEmailChangeSection.tsx',
]) if (!c.scope.includes(p)) c.scope.push(p)

fs.writeFileSync(FILE, JSON.stringify(c, null, 2).replace(/\n/g, eol) + eol)
console.log(`cases ${c.cases.length}; scope ${c.scope.length}; executionStatus ${c.executionStatus}; stage ${c.stage}`)
