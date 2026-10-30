// Task 923 Revision 33 design (Opus, 2026-10-22): the D8_D9 security contract for R110–R114 (kickoff section 57, R86). Keeps executionStatus draft while
// designing (shared/orchestration-state.md), adds every R110–R114 path that the scope lacks, amends the planned R86 cases to the saved design (the gateway
// file, the toast refusal, v8a's service-role function, the deleted WhatsApp button) and adds three cases. Idempotent.
// Usage: node r33d-19-sidecar-revision.mjs <repo root> <sidecar path>
import fs from 'node:fs'
import path from 'node:path'

const [root, rel] = process.argv.slice(2)
const file = path.join(root, rel)
const text = fs.readFileSync(file, 'utf8')
const eol = text.includes('\r\n') ? '\r\n' : '\n'
const c = JSON.parse(text)
c.executionStatus = 'draft'
const x = (s) => s + 'x'
const ADD = [
  'src/modules/listings/lib/contactActions.ts',
  'src/modules/listings/lib/contactHumanCheck.ts',
  'src/lib/captcha/__tests__/verifyTurnstile.test.ts',
  x('src/design-system/mantine/patterns/MantineListingContactPattern.ts'),
  x('src/modules/listings/components/ListingMobileCTA.ts'),
  'scripts/story-coverage-exempt.json',
  x('src/design-system/mantine/patterns/__tests__/MantineListingContactPattern.smoke.test.ts'),
  x('src/components/auth/__tests__/CaptchaWidget.language.test.ts'),
  x('src/components/auth/__tests__/CaptchaWidget.humanCheck.test.ts'),
  x('src/modules/listings/components/__tests__/ListingDetailView.favorite.test.ts'),
]
for (const p of ADD) if (!c.scope.includes(p)) c.scope.push(p)
const MUST = [
  'src/modules/listings/actions/contactGateway.ts', x('src/components/auth/CaptchaWidget.ts'), 'src/lib/captcha/verifyTurnstile.ts',
  x('src/modules/listings/components/ListingContact.ts'), x('src/modules/listings/components/ListingInquiryDialog.ts'), x('src/modules/listings/components/ListingInquiryDialogView.ts'),
  'messages/en.json', 'messages/sq.json', 'messages/uk.json', 'messages/it.json', 'src/modules/listings/actions/getListingOwnerContact.ts',
  x('src/components/listing/WhatsAppContactButton.ts'), 'src/modules/listings/actions/contactEvents.ts', 'src/modules/listings/actions/submitListingInquiry.ts',
  'src/__tests__/security/serverEntryGuards.test.ts', 'src/modules/listings/actions/__tests__/visitorActions.security.test.ts',
  'src/modules/listings/actions/__tests__/contactLifecycle.security.test.ts', 'src/modules/listings/actions/contactSession.security.test.ts',
  'src/modules/listings/actions/contactSession.integration.test.ts', 'src/modules/listings/actions/submitListingInquiry.test.ts',
  'src/modules/listings/actions/__tests__/submitListingInquiry.security.test.ts', 'src/modules/listings/actions/__tests__/submitListingInquiry.smoke.test.ts',
  x('src/modules/listings/components/ListingInquiryDialog.session.security.test.ts'), x('src/modules/listings/components/__tests__/ListingContact.bot.security.test.ts'),
  x('src/modules/listings/components/__tests__/ListingInquiryDialog.bot.security.test.ts'), 'src/modules/listings/actions/__tests__/contactGateway.security.test.ts',
  'src/tests/integration/contactGateway.integration.test.ts', 'scripts/surface-census-baseline.json', x('src/modules/auth/components/__tests__/AuthSheet.test.ts'),
]
for (const p of MUST) if (!c.scope.includes(p)) throw new Error('not in scope: ' + p)

const INV = 'A contact detail, a message or a contact event reaches the owner only through the server gateway after a verified human check'
const SESSION_INV = 'The contact gateway reveals a number only to a caller the server verified with Supabase Auth, and takes the caller id only from that check (Review 28, deviation 4)'
const GATEWAY_DOUBLES = 'the real revealListingContact, contactHumanCheck and verifyTurnstile; Turnstile HTTP and the database are the I/O doubles'
const AMEND = {
  'SEC-X-FE-CONTACT-BOT-DENY': {
    resource: 'the real ListingContact with a CaptchaWidget double (getToken, reset) and a contactGateway double',
    input: 'press Call and then WhatsApp while the gateway answers bot_check_failed; then a press whose getToken rejects',
    response: 'toast.error with listing.contact_bot_check_failed each time; after a rejected getToken the gateway is not called; reset after every gateway answer; no tel: link, no window.open and no digits in the DOM',
    forbiddenEffects: ['a number or link rendered or opened', 'a client call to trackListingContactEvent', 'the gateway called without a token'],
  },
  'SEC-X-FE-CONTACT-BOT-ALLOW': {
    resource: 'the real ListingContact with a CaptchaWidget double and a contactGateway double',
    input: 'press Call; the widget double resolves a token; the gateway answers a number',
    response: 'the gateway is called once with { listingId, channel: call, captchaToken, locale }; the tel: link opens with the digits; reset is called once',
  },
  'SEC-X-FE-INQUIRY-BOT-DENY': {
    resource: 'the real ListingInquiryDialog with a CaptchaWidget double',
    input: 'submit valid values while submitListingInquiry answers bot_check_failed; then a submit whose getToken rejects',
    response: 'toast.error with listing.contact_bot_check_failed; the dialog stays open with name, e-mail and message; no success toast; the action was called with the token and is not called after a rejected getToken',
    forbiddenEffects: ['a success toast', 'the typed values cleared', 'the action called without a token'],
  },
  'SEC-X-SRV-CONTACT-BOT-DENY': {
    actor: 'a signed-in caller with an active account',
    resource: GATEWAY_DOUBLES,
    input: 'no token; a token Cloudflare refuses (invalid-input-response); a replayed token (timeout-or-duplicate); an answer for the action contact_inquiry; an answer for another hostname; a testing-key answer while NODE_ENV is production',
    response: '{ ok: false, reason: bot_check_failed } for each; get_listing_owner_contact_as is not called and no listing_contact_events row is written',
    forbiddenEffects: ['a phone or WhatsApp number returned', 'the contact function called', 'a contact event written'],
  },
  'SEC-X-SRV-CONTACT-BOT-ALLOW': {
    resource: GATEWAY_DOUBLES,
    input: 'a fresh token answered for the action contact_reveal and the site hostname; once for call and once for whatsapp',
    response: 'get_listing_owner_contact_as is called once through the service role with p_caller = the verified viewer id; call returns only the phone and writes no event; whatsapp returns only the WhatsApp number and writes exactly one listing_contact_events row',
    forbiddenEffects: ['the session client used for a contact function', 'two events for one reveal', 'the number of the other channel returned'],
  },
  'SEC-X-SRV-CONTACT-BOT-ERR': {
    resource: GATEWAY_DOUBLES,
    input: 'Turnstile unreachable (fetch throws), an answer whose success is the string "true", a body that is not JSON; and the contact function answering an error',
    response: 'bot_check_failed for the three Turnstile cases and load_failed for the function error; nothing is revealed or written',
  },
  'SEC-X-SRV-INQUIRY-BOT-DENY': {
    resource: 'the real submitListingInquiry with the real contactHumanCheck and verifyTurnstile; Turnstile HTTP and the database are the I/O doubles',
    input: 'a valid inquiry from a signed-in active caller with no token, with a refused token, and with an answer for the action contact_reveal',
    response: '{ error: bot_check_failed }; no listing_inquiries row; no e-mail; no notification',
    forbiddenEffects: ['an inquiry stored', 'an e-mail sent', 'an owner notification'],
  },
  'SEC-X-INT-CONTACT-RPC-DENY': {
    actor: 'a synthetic signed-in session (hardening v8a applied)',
    resource: 'get_listing_owner_contact_as on the development project',
    input: 'the session\'s direct rpc of get_listing_owner_contact_as',
    response: 'an error (42501 or permission denied) and no number; get_listing_owner_contact joins this case with v8b\'s revoke after the push',
  },
  'SEC-X-INT-CONTACT-RPC-ALLOW': {
    resource: 'get_listing_owner_contact_as on the development project',
    input: 'the service role with an active synthetic listing and an active caller\'s id; then a blocked caller\'s id',
    response: 'the phone for the active caller; error 42501 and no number for the blocked caller',
  },
}
for (const [id, patch] of Object.entries(AMEND)) {
  const row = c.cases.find((k) => k.id === id)
  if (!row) throw new Error('missing case ' + id)
  Object.assign(row, patch)
}
const NEW = [
  {
    id: 'SEC-X-SRV-CONTACT-SESSION-DENY', layer: 'server', outcome: 'deny', boundary: 'unit', critical: true,
    invariant: SESSION_INV,
    actor: 'a guest, a session that was ended (getUser answers no user), a session without a profile, a blocked account; and a signed-in caller who adds another person\'s p_caller to the input',
    resource: 'the real revealListingContact with the real requireViewer; Auth, the database and Turnstile HTTP are the I/O doubles',
    input: 'revealListingContact with a valid listing, channel and token for each caller; and a listingId that is not a UUID',
    response: 'unauthenticated for the four callers without access, before Turnstile is asked and before any contact function call; not_available for the id that is not a UUID, before any lookup; for the signed-in caller get_listing_owner_contact_as is called with p_caller = that caller\'s verified id',
    forbiddenEffects: ['a number returned to a caller without access', 'Turnstile asked before the session check', 'a p_caller taken from the input'],
    testFile: 'src/modules/listings/actions/__tests__/contactGateway.security.test.ts',
    testName: 'contactGateway [SEC-X-SRV-CONTACT-SESSION-DENY] only a verified caller, by its own id',
  },
  {
    id: 'SEC-X-SRV-CONTACT-ENTRY', layer: 'server', outcome: 'deny', boundary: 'unit', critical: false,
    invariant: 'No public endpoint reaches a contact number or records a contact event except the gateway',
    actor: 'any caller of a Server Action',
    resource: 'every "use server" file and every source file under src',
    input: 'the syntax scanner of serverEntryGuards.test.ts',
    response: 'no "use server" file exports trackListingContactEvent; no "use server" file other than contactGateway.ts names get_listing_owner_contact_as; no source file calls rpc(\'get_listing_owner_contact\'',
    forbiddenEffects: ['a second public path to a contact number', 'a public contact-event writer'],
    testFile: 'src/__tests__/security/serverEntryGuards.test.ts',
    testName: 'no "use server" file exports a server-only writer [SEC-X-SRV-CONTACT-ENTRY] only the contact gateway reaches a contact number or records a contact event',
  },
  {
    id: 'SEC-X-INT-CONTACT-SESSION-DENY', layer: 'server', outcome: 'deny', boundary: 'integration', critical: false,
    invariant: SESSION_INV,
    actor: 'a guest client without a session; a synthetic user\'s client after a real sign-out',
    resource: 'the real revealListingContact on the development project, for a synthetic active listing whose synthetic owner has a phone',
    input: 'revealListingContact with channel call and the dummy token, the always-pass test secret set, with each client as the cookie-bound client',
    response: '{ ok: false, reason: unauthenticated } for both; no number; no listing_contact_events row of the run',
    forbiddenEffects: ['a number returned without a verified session', 'an event row'],
    testFile: 'src/tests/integration/contactGateway.integration.test.ts',
    testName: 'contactGateway [SEC-X-INT-CONTACT-SESSION-DENY] no number without a session Supabase Auth verifies',
  },
  {
    id: 'SEC-X-INT-CONTACT-GATEWAY', layer: 'server', outcome: 'allow', boundary: 'integration', critical: false,
    invariant: SESSION_INV,
    actor: 'a synthetic signed-in active user, not the owner',
    resource: 'the real revealListingContact on the development project, with Cloudflare\'s real siteverify and its published test secrets',
    input: 'channel whatsapp for a synthetic active listing whose synthetic owner has a WhatsApp number, with the dummy token and the always-pass test secret; then with the always-fail test secret',
    response: 'the owner\'s WhatsApp number and exactly one listing_contact_events row of the run; then bot_check_failed and no further row',
    forbiddenEffects: ['a number with the failing secret', 'an event row without a number'],
    testFile: 'src/tests/integration/contactGateway.integration.test.ts',
    testName: 'contactGateway [SEC-X-INT-CONTACT-GATEWAY] the real gateway on the real database and siteverify',
  },
]
for (const row of NEW) {
  const at = c.cases.findIndex((k) => k.id === row.id)
  if (at >= 0) c.cases[at] = row
  else c.cases.push(row)
}
fs.writeFileSync(file, JSON.stringify(c, null, 2).replace(/\n/g, eol) + eol)
console.log(`executionStatus ${c.executionStatus}; scope ${c.scope.length}; cases ${c.cases.length}; critical ${c.cases.filter((k) => k.critical).length}`)
