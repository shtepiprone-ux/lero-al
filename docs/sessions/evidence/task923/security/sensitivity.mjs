// Sensitivity proof for the CRITICAL cases of the D8/D9 security contract (security-test-quality.md "Sensitivity and reproducibility"):
//   baseline PASS  ->  a scoped deliberate break of the protection FAILS the intended assertion  ->  restored PASS.
// A compile / import error, a timeout or a missing service is NOT evidence, so the failure must be an assertion failure of the mapped test itself.
// Output: one raw artifact per case in docs/sessions/evidence/task923/security/sensitivity/<case>.json (vitest JSON of the three runs + the mutation description).
// The break is applied to the working-tree file and restored in `finally`; the restored file must hash identical or the case fails.
//   node docs/sessions/evidence/task923/security/sensitivity.mjs [caseId]            (unit runs)
//   SECURITY_TEST_TARGET=development SECURITY_TEST_PROJECT_REF=<ref> node .../sensitivity.mjs --integration       (also the real-boundary runs; real Auth and database of the approved dev project)
// Task 923 Revision 54 (kickoff §80, R163): the 'fresh' cases below break one protection each and write their own artifact. A source break is a text anchor that must occur exactly once;
// a database break ('db') is applied and restored by db-break.cjs under owner decision D91 (one at a time, a catalog fingerprint before and after, the two must be equal).
//   node .../sensitivity.mjs --check-anchors             (no test is run: every anchor of every source break must occur exactly once in the current working tree)
//   node .../sensitivity.mjs --fresh --source            (the source breaks of R163)      node .../sensitivity.mjs --fresh --db      (the database breaks of R163)
import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, utimesSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const ROOT = resolve(new URL('../../../../../', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'))
const OUT = join(ROOT, 'docs/sessions/evidence/task923/security/sensitivity')
const sha = (t) => createHash('sha256').update(t).digest('hex')
const withInteg = process.argv.includes('--integration')
const checkAnchors = process.argv.includes('--check-anchors')
const freshOnly = process.argv.includes('--fresh')
const kindFilter = process.argv.includes('--source') ? 'source' : process.argv.includes('--db') ? 'db' : null
const only = process.argv.slice(2).find((a) => !a.startsWith('--'))

const GATEWAY = 'src/modules/listings/actions/applyListingTransition.ts'
const ACCESS = 'src/lib/auth/accountAccess.ts'
const ADMIN = 'src/modules/admin/actions/index.ts'
const VIEWER = 'src/lib/auth/requireViewer.ts'
const INQUIRY = 'src/modules/listings/actions/submitListingInquiry.ts'
const STAFF = 'src/lib/auth/staff.ts'
const MIDDLEWARE = 'src/lib/auth/middleware.ts'
const CABINET = 'src/modules/cabinet/actions/index.ts'
// the checks of requireViewer and getStaffRole (R44) and the end of a refused session (R45 (a)); each break is applied once, restored byte for byte
const VIEWER_STATUS = { file: VIEWER, describe: 'the account-state check is removed from requireViewer', from: "    if (!accountHasAccess(data.status, data.suspended_until)) return { ok: false, reason: 'unauthenticated' }\n", to: '' }
const VIEWER_DELETED = { file: VIEWER, describe: 'the deleted mark is no longer a reason to refuse in requireViewer', from: "    if (!data || data.deleted_at) return { ok: false, reason: 'unauthenticated' }\n", to: "    if (!data) return { ok: false, reason: 'unauthenticated' }\n" }
const STAFF_REFUSE = { file: STAFF, describe: 'getStaffRole refuses every account, active staff included', from: "  return viewer.role === 'admin' || viewer.role === 'moderator' ? viewer.role : null\n", to: '  return null\n' }
const VIEWER_REFUSE = { file: VIEWER, describe: 'requireViewer refuses every account, active ones included', from: "    if (!data || data.deleted_at) return { ok: false, reason: 'unauthenticated' }\n", to: "    return { ok: false, reason: 'unauthenticated' }\n" }
const NO_SIGNOUT = { file: MIDDLEWARE, describe: 'refreshSession no longer ends a session that Auth refuses', from: "    await supabase.auth.signOut({ scope: 'local' })\n", to: '' }
const ALWAYS_SIGNOUT = { file: MIDDLEWARE, describe: 'refreshSession ends every session, active ones included', from: "  if (error && (error.code === 'user_banned' || error.code === 'user_not_found')) {\n", to: '  if (true) {\n' }

// Task 923 R70 (a), R66 (d) (Revision 16 part 5): the critical cases of the cabinet's re-authentication and of the e-mail change link.
const NO_REAUTH_EMAIL = { file: CABINET, describe: 'initiateEmailChange no longer asks for re-authentication', from: 'const failure = await reauthenticate(user, data.currentPassword)', to: 'const failure = null as ReauthFailure | null' }
const NO_REAUTH_DELETE = { file: CABINET, describe: 'deleteOwnAccount no longer asks for re-authentication', from: "const failure = await reauthenticate(user, data?.password)\n  if (failure) return { error: failure === 'reauth_unavailable' ? 'delete_failed' : failure }", to: 'const failure = null as ReauthFailure | null' }
const NO_CLAIM_CHECK = { file: CABINET, describe: 'a claim that matched no row is no longer refused', from: "  if (!claimed || claimed.length !== 1) return { error: 'link_already_used', errorCode: 'consumed' }\n", to: '' }
const NO_PENDING_MATCH = { file: CABINET, describe: 'a link whose address is not the pending one is no longer refused', from: 'profile.pending_email.toLowerCase() !== String(token.new_email).toLowerCase()', to: 'false' }
const NO_RETIRE = { file: CABINET, describe: 'a new request no longer retires the earlier links', from: "    .update({ consumed_at: new Date().toISOString() })\n    .eq('user_id', userId)\n    .is('consumed_at', null)\n  if (retireError) {\n    console.error('initiateEmailChange: retiring the earlier links failed', { code: retireError.code })", to: "    .update({})\n    .eq('user_id', userId)\n    .is('consumed_at', null)\n  if (retireError) {\n    console.error('initiateEmailChange: retiring the earlier links failed', { code: retireError.code })" }
const NO_END_SESSIONS = { file: CABINET, describe: 'a completed e-mail change no longer ends the sessions of the account', from: "await db.rpc('end_user_sessions', { p_user: token.user_id })", to: '{ error: null }' }
// Task 923 R81 (b): the per-person limit. One break: the count is never compared with the limit, so none of the three actions refuses (the case's own critical invariant).
const NO_LIMIT = { file: CABINET, describe: 'the count of failed re-authentications is never compared with the limit', from: "    return count >= REAUTH_FAILURE_LIMIT ? 'blocked' : 'open'", to: "    return 'open'" }
const NO_RELEASE = { file: CABINET, describe: 'a failed Auth update no longer releases the claim, so the link is burned', from: "const { error: releaseErr } = await db.from('email_change_tokens').update({ consumed_at: null }).eq('id', token.id)", to: 'const releaseErr = null' }

// id = the contract case; test = the mapped unit test (full collected name from the contract); integ = the real-boundary deny control of the same invariant.
const CASES = [
  {
    id: 'SEC-D8-SRV-DENY', file: GATEWAY,
    describe: 'the guard that refuses `active` to a non-staff actor is removed',
    from: "  if (!canAdminEditListing(actor.role) && !canOwnerSetStatus(currentStatus, toStatus)) {\n    return { ok: false, reason: 'forbidden' }\n  }\n", to: '',
    integ: { id: 'SEC-D8-INT-DENY', file: 'src/modules/listings/actions/ownerPublish.integration.test.ts' },
  },
  {
    id: 'SEC-D9-SRV-DENY', file: ACCESS,
    describe: 'every status is treated as "has access", so no ban is ever requested',
    from: "  if (accountHasAccess(status, suspendedUntil, now)) return 'none'\n", to: "  return 'none'\n",
    integ: { id: 'SEC-D9-INT-DENY', file: 'src/lib/auth/accountAccess.integration.test.ts' },
  },
  {
    id: 'SEC-D9-SRV-ADMIN-DENY', file: ADMIN,
    describe: 'the rank check (an administrator account is acted on only by an administrator) is removed from updateUserProfileFull',
    from: "  if (!(await actorMayActOn(me.id, userId))) return { error: 'Forbidden' }\n  if (data.profileType === 'admin' && myProfile.role !== 'admin') return { error: 'Forbidden' }\n",
    to: "  if (data.profileType === 'admin' && myProfile.role !== 'admin') return { error: 'Forbidden' }\n",
    integ: { id: 'SEC-D9-INT-ADMIN-DENY', file: 'src/modules/admin/actions/accountBan.integration.test.ts' },
  },
  {
    id: 'SEC-CS-SRV-DENY', file: VIEWER,
    describe: 'the account-state check is removed from requireViewer, so a blocked or inactive account passes as a viewer',
    from: "    if (!accountHasAccess(data.status, data.suspended_until)) return { ok: false, reason: 'unauthenticated' }\n", to: '',
    integ: { id: 'SEC-CS-INT-DENY', file: 'src/modules/listings/actions/contactSession.integration.test.ts' },
    second: {
      file: INQUIRY, describe: 'submitListingInquiry no longer asks for a viewer, so a guest passes',
      from: "  if (!viewer.ok) return { error: viewer.reason === 'unauthenticated' ? 'unauthenticated' : 'save_failed' }\n", to: '',
    },
  },
  // Task 923 R44 / R45 (a): the critical cases of owner decisions D26, D27 and D29. 'muts' are applied together in ONE break; 'self' = the case itself is a real-boundary one.
  { id: 'SEC-D27-SRV-VIEWER-DENY', muts: [VIEWER_STATUS, VIEWER_DELETED], integ: { id: 'SEC-D27-INT-VIEWER-DENY', file: 'src/lib/auth/staffAccess.integration.test.ts' } },
  { id: 'SEC-D27-SRV-STAFF-DENY', muts: [VIEWER_STATUS, VIEWER_DELETED], integ: { id: 'SEC-D27-INT-STAFF-DENY', file: 'src/lib/auth/staffAccess.integration.test.ts' } },
  { id: 'SEC-D27-SRV-STAFF-ALLOW', muts: [STAFF_REFUSE], integ: { id: 'SEC-D27-INT-STAFF-ALLOW', file: 'src/lib/auth/staffAccess.integration.test.ts' } },
  { id: 'SEC-D27-INT-VIEWER-ALLOW', muts: [VIEWER_REFUSE], self: true },
  { id: 'SEC-D29-INT-DENY', muts: [NO_SIGNOUT], self: true },
  { id: 'SEC-D29-INT-ALLOW', muts: [ALWAYS_SIGNOUT], self: true },
  { id: 'SEC-X-SRV-REAUTH-EMAIL', muts: [NO_REAUTH_EMAIL], integ: { id: 'SEC-X-INT-REAUTH-EMAIL-DENY', file: 'src/modules/cabinet/actions/reauth.integration.test.ts' } },
  { id: 'SEC-X-SRV-REAUTH-DELETE', muts: [NO_REAUTH_DELETE], integ: { id: 'SEC-X-INT-REAUTH-DELETE-DENY', file: 'src/modules/cabinet/actions/reauth.integration.test.ts' } },
  { id: 'SEC-X-SRV-EMAIL-TOKEN-ONCE', muts: [NO_CLAIM_CHECK], integ: { id: 'SEC-X-INT-EMAIL-TOKEN-ONCE-DENY', file: 'src/modules/cabinet/actions/emailChange.integration.test.ts' } },
  { id: 'SEC-X-SRV-EMAIL-TOKEN-LATEST', muts: [NO_RETIRE, NO_PENDING_MATCH], integ: { id: 'SEC-X-INT-EMAIL-TOKEN-LATEST-DENY', file: 'src/modules/cabinet/actions/emailChange.integration.test.ts' } },
  { id: 'SEC-X-SRV-EMAIL-SESSIONS-END', muts: [NO_END_SESSIONS, NO_RELEASE], integ: { id: 'SEC-X-INT-EMAIL-SESSIONS-END-DENY', file: 'src/modules/cabinet/actions/emailChange.integration.test.ts' } },
  // unit boundary only until the owner applies hardening v7: the real-boundary pair needs public.reauth_failures (R81 (i))
  { id: 'SEC-X-SRV-REAUTH-LIMIT', muts: [NO_LIMIT] },
]

// ── Task 923 Revision 54 (kickoff §80, R163): one named break for each critical case that had no artifact. 'fresh' cases are boundary-driven by the contract (unit or integration). ──
const DELETE_ACCOUNT = 'src/lib/account/deleteAccount.ts'
const DELETE_LISTING = 'src/modules/listings/actions/deleteListing.ts'
const UPDATE_LISTING = 'src/modules/listings/actions/updateListing.ts'
const CONTACT_GATEWAY = 'src/modules/listings/actions/contactGateway.ts'
const INPUTS = 'src/lib/security/inputs.ts'
const TURNSTILE = 'src/lib/captcha/verifyTurnstile.ts'
const SLUG = 'src/modules/listings/lib/generateSlug.ts'
const LISTING_PAGE = 'src/app/[locale]/listings/[slug]/page.tsx'
const AVATAR_ROUTE = 'src/app/api/upload-avatar/route.ts'
const VIEW_ROUTE = 'src/app/api/listings/[slug]/view/route.ts'
const D29_ALL_ERRORS = { file: MIDDLEWARE, describe: 'refreshSession ends the session on every Auth error, a network failure and an expired token included', from: "  if (error && (error.code === 'user_banned' || error.code === 'user_not_found')) {\n", to: '  if (error) {\n' }
const DEL_NO_COMPANY_LOGO = { file: DELETE_ACCOUNT, describe: 'the logos of the companies the person created are no longer collected for release', from: "  failed = await read('companies', (from, to) => db.from('companies').select('logo_url').eq('created_by', userId).order('id').range(from, to),\n    (batch) => batch.forEach((row) => urls.push(row.logo_url)))\n  if (failed) return failed\n\n", to: '' }
const DEL_NO_RANK = { file: ADMIN, describe: 'hardDeleteUser no longer applies the rank rule', from: "  if (!rank.allowed || !rank.actorRole) return { error: 'forbidden' }\n", to: '' }
const DEL_NO_AVATAR_OBJECTS = { file: DELETE_ACCOUNT, describe: 'the avatars objects of the person are no longer removed', from: '  filesNotRemoved += await removeAvatarObjects(db, userId, reason)\n', to: '' }
const DEL_SELF_NOOP = { file: CABINET, describe: 'deleteOwnAccount answers ok without deleting', from: "  const result = await deleteAccount(userId, { reason: 'self' })\n  return result.ok ? {} : { error: 'delete_failed' }\n", to: '  return {}\n' }
const STAFF_NO_MODERATOR = { file: STAFF, describe: 'the staff guard drops the moderator role (getStaffRole and every checkStaff answer null for a moderator)', from: "  const allowed = options.adminOnly ? viewer.role === 'admin' : viewer.role === 'admin' || viewer.role === 'moderator'\n", to: "  const allowed = viewer.role === 'admin'\n" }
const NO_STATUS_PERM = { file: ADMIN, describe: 'updateUserProfileFull no longer asks for users.soft_delete when it deactivates or reactivates an account', from: "    if (!(await hasPermission('users.soft_delete').catch(() => false))) return { error: 'Forbidden' }\n", to: '' }
const NO_LOCATIONS_PERM = { file: ADMIN, describe: 'addLocation no longer asks for locations.manage', from: "  await assertPermission('locations.manage')\n  const db = createAdminClient()\n  const slug = ", to: '  const db = createAdminClient()\n  const slug = ' }
const NO_ACTIVE_CHECK = { file: INQUIRY, describe: 'submitListingInquiry no longer checks that the listing is active', from: "  if ((listing.status as ListingStatus) !== 'active') return { error: 'validation' }\n", to: '' }
const NO_LT_ESCAPE = { file: INPUTS, describe: 'jsonForScript no longer escapes `<`', from: '`[<>&${String.fromCharCode(0x2028)}${String.fromCharCode(0x2029)}]`', to: '`[>&${String.fromCharCode(0x2028)}${String.fromCharCode(0x2029)}]`' }
const NO_AVATAR_RANK = { file: AVATAR_ROUTE, describe: 'the avatar route no longer applies the rank rule to the target account', from: "    if (!rank.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })\n", to: '' }
const PAGE_ANY_ROLE = { file: STAFF, describe: 'requireStaffPage accepts any role', from: "  if (viewer.role !== 'admin' && viewer.role !== 'moderator') notFound()\n", to: '' }
const NO_ZERO_ROW = { file: DELETE_LISTING, describe: 'deleteListingAction no longer requires exactly one deleted row', from: '  if (error || deleted?.length !== 1) {\n', to: '  if (error) {\n' }
const NO_PENDING_MOVE = { file: UPDATE_LISTING, describe: 'the owner\'s edit of an active listing no longer moves it to pending', from: '  if (isOwner && isListingVisible(existing.status as ListingStatus)) {\n', to: '  if (false && isOwner && isListingVisible(existing.status as ListingStatus)) {\n' }
const NO_FIRST_KEY = { file: ADMIN, describe: 'updateUserProfile, the first action of the key matrix, names no permission key', from: "  const actor = await resolveAdminActor('users.edit')\n  // Task 923 Revision 7, finding S44: `data` used to be written as it came.", to: "  const actor = await resolveAdminActor()\n  // Task 923 Revision 7, finding S44: `data` used to be written as it came." }
const NO_HYPHEN_TRIM = { file: SLUG, describe: 'generateSlug no longer trims the hyphens that the 80-character cut leaves at the end', from: "    .slice(0, BASE_MAX_LENGTH)\n    .replace(/-+$/, '')\n", to: '    .slice(0, BASE_MAX_LENGTH)\n' }
const NO_HOSTNAME_CHECK = { file: TURNSTILE, describe: 'the Turnstile answer is no longer checked for this site\'s hostname', from: "  if (!hostnameOk) return { success: false, errorCodes: ['hostname-mismatch'] }\n", to: '' }
const NO_PENDING_STATUS = { file: LISTING_PAGE, describe: 'the listing page treats a pending listing as public', from: "const PUBLIC_LISTING_STATUSES = ['active', 'sold', 'rented']", to: "const PUBLIC_LISTING_STATUSES = ['active', 'sold', 'rented', 'pending']" }
const VIEW_PENDING = { file: VIEW_ROUTE, describe: 'the view route counts a view of a pending listing', from: ".in('status', ['active', 'sold', 'rented', 'archived'])", to: ".in('status', ['active', 'sold', 'rented', 'archived', 'pending'])" }
const CABINET_SPREAD = { file: CABINET, describe: 'updateCabinetProfile writes every field the browser sends', from: "    .update({\n      name: data.name.trim() || null,", to: "    .update({\n      ...(data as Record<string, unknown>),\n      name: data.name.trim() || null," }
const NO_REVEAL_VIEWER ={ file: CONTACT_GATEWAY, describe: 'revealListingContact no longer refuses a caller that requireViewer refused', from: "  if (!viewer.ok) return { ok: false, reason: viewer.reason === 'lookup_failed' ? 'load_failed' : 'unauthenticated' }\n", to: '' }
const LIMIT_21 = { file: CONTACT_GATEWAY, describe: 'the viewer\'s hourly reveal limit goes from 20 to 21', from: 'const REVEAL_LIMIT_ACCOUNT = { perHour: 20, perDay: 60 }', to: 'const REVEAL_LIMIT_ACCOUNT = { perHour: 21, perDay: 60 }' }
const IP_61 = { file: CONTACT_GATEWAY, describe: 'the IP address\'s hourly reveal limit goes from 60 to 61', from: 'const REVEAL_LIMIT_IP = { perHour: 60, perDay: 200 }', to: 'const REVEAL_LIMIT_IP = { perHour: 61, perDay: 200 }' }
const FAIL_OPEN = { file: CONTACT_GATEWAY, describe: 'a failed read of the viewer\'s reveal rows counts as no rows (the error check is removed)', from: "    if (mine.error || !mine.data) {\n      console.error('[contact] reveal rows could not be read: refusing', { code: mine.error?.code })\n      return 'load_failed'\n    }\n", to: '    mine.data ??= []\n' }
const NO_AVATAR_WRITE = { file: AVATAR_ROUTE, describe: 'the avatar route no longer writes the new avatar_url (it rewrites the old one)', from: '.update({ avatar_url: cloudUrl })', to: '.update({ avatar_url: oldAvatarUrl })' }

/** 'fresh' cases: `muts` = a source break (kind 'source'); `db` = the key of a database break of db-break.cjs (kind 'db'). The boundary (unit / integration) is the contract's. */
const FRESH = [
  { id: 'SEC-D29-SRV-DENY', muts: [NO_SIGNOUT] },
  { id: 'SEC-D29-SRV-ALLOW', muts: [D29_ALL_ERRORS] },
  { id: 'SEC-DEL-SRV-ALLOW', muts: [DEL_NO_COMPANY_LOGO] },
  { id: 'SEC-DEL-SRV-DENY', muts: [DEL_NO_RANK] },
  { id: 'SEC-DEL-INT-ALLOW', muts: [DEL_NO_AVATAR_OBJECTS] },
  { id: 'SEC-DEL-INT-DENY', muts: [DEL_NO_RANK] },
  { id: 'SEC-DEL-INT-SELF', muts: [DEL_SELF_NOOP] },
  { id: 'SEC-DEL-INT-STAFF', db: 'SEC-DEL-INT-STAFF' },
  { id: 'SEC-D27-INT-VIEWER-DENY', muts: [VIEWER_STATUS, VIEWER_DELETED] },
  { id: 'SEC-D27-INT-STAFF-DENY', muts: [VIEWER_STATUS, VIEWER_DELETED] },
  { id: 'SEC-D27-INT-STAFF-ALLOW', muts: [STAFF_NO_MODERATOR] },
  { id: 'SEC-X-SRV-STATUS-PERM', muts: [NO_STATUS_PERM] },
  { id: 'SEC-X-SRV-LOCATIONS-PERM', muts: [NO_LOCATIONS_PERM] },
  { id: 'SEC-X-SRV-CONTACT-LIFECYCLE', muts: [NO_ACTIVE_CHECK] },
  { id: 'SEC-X-SRV-SLUG-SCRIPT', muts: [NO_LT_ESCAPE] },
  { id: 'SEC-X-SRV-AVATAR-RANK', muts: [NO_AVATAR_RANK] },
  { id: 'SEC-X-SRV-ADMINPAGE-GUARD', muts: [PAGE_ANY_ROLE] },
  { id: 'SEC-X-SRV-OWNER-DELETE', muts: [NO_ZERO_ROW] },
  { id: 'SEC-X-SRV-EDIT-MODERATION', muts: [NO_PENDING_MOVE] },
  { id: 'SEC-X-SRV-MOD-KEYS', muts: [NO_FIRST_KEY] },
  { id: 'SEC-X-SRV-SLUG-PLAIN', muts: [NO_HYPHEN_TRIM] },
  { id: 'SEC-X-SRV-CONTACT-BOT-DENY', muts: [NO_HOSTNAME_CHECK] },
  { id: 'SEC-X-SRV-RESTRICTED-PAGE-DENY', muts: [NO_PENDING_STATUS] },
  { id: 'SEC-X-SRV-VIEW-DENY', muts: [VIEW_PENDING] },
  { id: 'SEC-X-SRV-PROFILE-PROTECTED-DENY', muts: [CABINET_SPREAD] },
  { id: 'SEC-X-SRV-CONTACT-SESSION-DENY', muts: [NO_REVEAL_VIEWER] },
  { id: 'SEC-X-SRV-REVEAL-LIMIT', muts: [LIMIT_21] },
  { id: 'SEC-X-INT-REVEAL-LIMIT', muts: [LIMIT_21] },
  { id: 'SEC-X-SRV-REVEAL-IP', muts: [IP_61] },
  { id: 'SEC-X-SRV-REVEAL-FAILCLOSED', muts: [FAIL_OPEN] },
  { id: 'SEC-DB-X-AVATARS-STORAGE-ALLOW', muts: [NO_AVATAR_WRITE] },
  ...['SEC-DB-S59-DENY', 'SEC-DB-S59-ALLOW', 'SEC-DB-S61-DENY', 'SEC-DB-S61-ALLOW', 'SEC-DB-ACCESS-DENY', 'SEC-DB-ACCESS-ALLOW', 'SEC-DB-REALTIME-DENY', 'SEC-DB-REALTIME-ALLOW',
    'SEC-DB-X-LISTING-CHECKS-DENY', 'SEC-DB-X-LISTING-CHECKS-ALLOW', 'SEC-DB-X-IMAGE-URL-DENY', 'SEC-DB-X-IMAGE-URL-ALLOW', 'SEC-DB-X-AVATARS-STORAGE-DENY', 'SEC-DB-X-CLOSED-READ-DENY',
    'SEC-DB-X-CLOSED-READ-ALLOW', 'SEC-DB-X-PERMS-NO-SESSION', 'SEC-DB-X-REAUTH-FAILURES-NO-SESSION', 'SEC-DB-X-NO-SELF-RESTORE', 'SEC-X-INT-REVEAL-TABLE-DENY', 'SEC-X-INT-REVEAL-TABLE-SERVER']
    .map((id) => ({ id, db: id })),
]

const contract = JSON.parse(readFileSync(join(ROOT, 'tasks/Sprints/Sprint_78_Task_923_security_record_D8_D9.security.json'), 'utf8'))
const caseOf = (id) => {
  const row = contract.cases.find((c) => c.id === id)
  if (!row) throw new Error(`case ${id} is not in the contract`)
  return row
}

function runVitest(testFile, idToken, integration) {
  const dir = mkdtempSync(join(tmpdir(), 'lero-sens-'))
  try {
    const outputFile = join(dir, 'result.json')
    const args = ['vitest', 'run', ...(integration ? ['--config', 'vitest.integration.config.ts'] : []), testFile, '-t', idToken, '--reporter=json', `--outputFile=${outputFile}`, '--retry=0']
    const run = spawnSync('npx', args, { cwd: ROOT, encoding: 'utf8', shell: true, timeout: 15 * 60 * 1000 })
    let json = null
    try { json = JSON.parse(readFileSync(outputFile, 'utf8')) } catch { /* no result file: reported as such */ }
    return { exitCode: run.status, json }
  } finally { rmSync(dir, { recursive: true, force: true }) }
}
function testResult(result, testName) {
  const rows = (result.json?.testResults ?? []).flatMap((f) => f.assertionResults ?? [])
  const hits = rows.filter((a) => a.fullName === testName)
  return hits.length === 1 ? hits[0] : null
}

function withMutation(mutations, fn) {
  // several breaks in ONE file are applied one after the other to the evolving text (each anchor must still occur exactly once); the original is restored byte for byte
  const files = [...new Set(mutations.map((m) => m.file))].map((file) => ({ file, abs: join(ROOT, file), text: readFileSync(join(ROOT, file), 'utf8'), times: statSync(join(ROOT, file)) }))
  try {
    for (const f of files) {
      const crlf = f.text.includes('\r\n')
      let current = crlf ? f.text.replace(/\r\n/g, '\n') : f.text
      for (const m of mutations.filter((x) => x.file === f.file)) {
        if (current.split(m.from).length !== 2) throw new Error('anchor is not exactly once in ' + f.file)
        current = current.replace(m.from, () => m.to)
      }
      writeFileSync(f.abs, crlf ? current.replace(/\n/g, '\r\n') : current)
    }
    return fn()
  } finally {
    for (const f of files) { writeFileSync(f.abs, f.text); utimesSync(f.abs, f.times.atime, f.times.mtime) }   // same bytes AND the same modification time
    lastRestore = files.map((f) => ({ file: f.file, originalSha256: sha(f.text), restoredSha256: sha(readFileSync(f.abs, 'utf8')) }))   // Task 923 R54: the artifact records the restored hash
    for (const f of files) if (sha(readFileSync(f.abs, 'utf8')) !== sha(f.text)) throw new Error('RESTORE FAILED for ' + f.file)
  }
}

// Task 923 R54 (kickoff §80, R163 (b)): a database break is applied and restored by db-break.cjs (owner decision D91). The fingerprint before and after must be equal; if the restore fails or the fingerprints
// differ, EVERY run stops and the restore SQL is printed (BLOCKED).
let lastRestore = []
const DB_BREAK = join(ROOT, 'docs/sessions/evidence/task923/security/db-break.cjs')
function lastJson(text) {
  const lines = String(text).split(/\r?\n/).filter((l) => l.trim().startsWith('{'))
  return lines.length ? JSON.parse(lines[lines.length - 1]) : null
}
const dbBreak = (command, key) => spawnSync(process.execPath, [DB_BREAK, command, key], { cwd: ROOT, encoding: 'utf8', env: process.env, timeout: 5 * 60 * 1000 })
function withDbBreak(key, fn) {
  const applied = dbBreak('break', key)
  if (applied.status !== 0) throw new Error(`db-break break ${key} failed (exit ${applied.status}): ${applied.stdout}${applied.stderr}`)
  const record = { key, applied: applied.stdout.split(/\r?\n/).filter(Boolean).map((l) => { try { return JSON.parse(l) } catch { return l } }) }
  try {
    record.result = fn()
  } finally {
    const restored = dbBreak('restore', key)
    record.restoreExit = restored.status
    record.restored = lastJson(restored.stdout)
    if (restored.status !== 0 || record.restored?.equal !== true) {
      console.error(`BLOCKED: the database restore of ${key} failed or the fingerprint differs.\n${restored.stdout}${restored.stderr}`)
      process.exit(3)
    }
  }
  return record
}

function sensitivity(id, testFile, testName, mutations, integration, dbKey) {
  const baseline = runVitest(testFile, id, integration)
  const base = testResult(baseline, testName)
  lastRestore = []
  let dbRecord = null
  let mutant
  if (dbKey) { dbRecord = withDbBreak(dbKey, () => runVitest(testFile, id, integration)); mutant = dbRecord.result } else mutant = withMutation(mutations, () => runVitest(testFile, id, integration))
  const hit = testResult(mutant, testName)
  const restored = runVitest(testFile, id, integration)
  const rest = testResult(restored, testName)
  const message = (hit?.failureMessages ?? []).join('\n')
  // the failure must be an assertion of the mapped test, not an import / compile error, a timeout or a missing service
  // Task 923 R54: a failure raised from inside an `expect` (the stack names @vitest/expect, as vitest's own `rejects` / `resolves` message "promise resolved … instead of rejecting" does) is an assertion too
  const failureKind = hit?.status === 'failed' && /AssertionError|expected .* to |toEqual|toBe|toHaveLength|toContain|toMatchObject|@vitest[\\/]expect/.test(message) && !/SyntaxError|Cannot find module|Failed to resolve|Timeout|timed out|ECONNREFUSED|Transform failed/i.test(message.split('\n')[0]) ? 'assertion' : (hit?.status === 'failed' ? 'other' : 'none')
  return {
    id, testFile, testName, boundary: integration ? 'integration' : 'unit',
    baseline: base?.status === 'passed' ? 'passed' : `not passed (${base?.status ?? 'absent'})`,
    mutant: hit?.status === 'failed' ? 'failed' : `not failed (${hit?.status ?? 'absent'})`,
    failureKind,
    restored: rest?.status === 'passed' ? 'passed' : `not passed (${rest?.status ?? 'absent'})`,
    mutation: dbKey ? [{ database: true, description: dbRecord.applied.find((l) => l && l.describe)?.describe ?? dbKey, key: dbKey }] : mutations.map((m) => ({ file: m.file, description: m.describe, from: m.from, to: m.to })),
    ...(dbKey ? { databaseBreak: { key: dbKey, fingerprintBefore: dbRecord.restored?.fingerprintBefore, fingerprintAfter: dbRecord.restored?.fingerprintAfter, equal: dbRecord.restored?.equal === true } } : { restoredFiles: lastRestore }),
    failureMessage: message.slice(0, 1500),
    raw: { baseline: baseline.json, mutant: mutant.json, restored: restored.json },
  }
}

if (checkAnchors) {
  // no test is run: every anchor of every source break must occur exactly once in the current working tree
  let bad = 0
  for (const c of FRESH.filter((x) => x.muts)) {
    for (const m of c.muts) {
      const text = readFileSync(join(ROOT, m.file), 'utf8').replace(/\r\n/g, '\n')
      const times = text.split(m.from).length - 1
      if (times !== 1) bad++
      console.log(`${times === 1 ? 'ok       ' : 'NOT ONCE '} ${c.id} ${m.file} (${times})`)
    }
  }
  const missingDb = FRESH.filter((x) => x.db).map((x) => x.db)
  console.log(`database breaks (db-break.cjs): ${missingDb.length}`)
  process.exit(bad ? 1 : 0)
}

mkdirSync(OUT, { recursive: true })
const summary = []
for (const c of freshOnly ? [] : CASES) {
  if (only && c.id !== only) continue
  const row = caseOf(c.id)
  if (c.self && !withInteg) continue
  const mutations = c.muts ?? [{ file: c.file, describe: c.describe, from: c.from, to: c.to }, ...(c.second ? [c.second] : [])]
  const results = [sensitivity(c.id, row.testFile, row.testName, c.muts ? c.muts : [mutations[0]], !!c.self)]
  if (c.second) results.push({ ...sensitivity(c.id, row.testFile, row.testName, [c.second], false), variant: 'second break' })
  if (withInteg && c.integ) {
    const ir = caseOf(c.integ.id)
    results.push(sensitivity(c.integ.id, ir.testFile, ir.testName, c.muts ? c.muts : [mutations[0]], true))
  }
  const artifact = { version: 1, generatedAt: new Date().toISOString(), case: c.id, results }
  writeFileSync(join(OUT, `${c.id}.json`), JSON.stringify(artifact, null, 1))
  for (const r of results) {
    const ok = r.baseline === 'passed' && r.mutant === 'failed' && r.failureKind === 'assertion' && r.restored === 'passed'
    summary.push({ id: r.id, variant: r.variant ?? '', boundary: r.boundary, ok })
    console.log(`${ok ? 'PROVED    ' : 'NOT PROVED'} ${r.id}${r.variant ? ` (${r.variant})` : ''} [${r.boundary}] baseline=${r.baseline} mutant=${r.mutant} kind=${r.failureKind} restored=${r.restored}`)
  }
}
// Task 923 R54: the fresh cases. Each has its own artifact `sensitivity/<case>.json`; a break that does not fail its own test by an assertion is recorded with its output, never swapped for an easier one.
for (const c of freshOnly ? FRESH : []) {
  if (only && c.id !== only) continue
  if (kindFilter === 'source' && !c.muts) continue
  if (kindFilter === 'db' && !c.db) continue
  const row = caseOf(c.id)
  const integration = row.boundary === 'integration'
  if (integration && !withInteg) { console.log(`SKIPPED    ${c.id}: an integration case (add --integration)`); continue }
  const result = sensitivity(c.id, row.testFile, row.testName, c.muts ?? [], integration, c.db)
  const artifact = { version: 1, generatedAt: new Date().toISOString(), case: c.id, results: [result] }
  writeFileSync(join(OUT, `${c.id}.json`), JSON.stringify(artifact, null, 1))
  const ok = result.baseline === 'passed' && result.mutant === 'failed' && result.failureKind === 'assertion' && result.restored === 'passed'
  summary.push({ id: result.id, variant: '', boundary: result.boundary, ok })
  console.log(`${ok ? 'PROVED    ' : 'NOT PROVED'} ${result.id} [${result.boundary}] baseline=${result.baseline} mutant=${result.mutant} kind=${result.failureKind} restored=${result.restored}`)
}
const bad = summary.filter((s) => !s.ok)
console.log(`\n${summary.length - bad.length} of ${summary.length} sensitivity runs proved.`)
process.exitCode = bad.length ? 1 : 0
