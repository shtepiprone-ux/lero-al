// Opus, Task 923: adds the security cases of R73-R80 (kickoff section 31, the owner's answers D46, D48-D58) to the D8_D9 contract, renames
// SEC-X-SRV-RATE-REPORT-UPLOAD to SEC-X-SRV-RATE-REPORT without its upload part (R76, D49), and withdraws D28's three restore cases (D58).
// Idempotent: an id already present is replaced.
import { readFileSync, writeFileSync } from 'node:fs'

const path = 'tasks/Sprints/Sprint_78_Task_923_security_record_D8_D9.security.json'
const contract = JSON.parse(readFileSync(path, 'utf8'))

const c = (id, layer, outcome, boundary, critical, invariant, actor, resource, input, response, forbiddenEffects, testFile, title) => ({
  id, layer, outcome, boundary, critical, invariant, actor, resource, input, response, forbiddenEffects, testFile,
  testName: `${testFile.split('/').pop().replace(/\.(?:security|integration)\.test\.tsx?$/, '')} [${id}] ${title}`,
})

const EDIT = 'An owner\'s edit of an active listing reaches a visitor only after staff approve it; other statuses are not moderated (D53)'
const KEYS = 'A moderator does only what the administrator allowed through a key'
const PERMS = 'Only an administrator reads or changes the moderator switches (D55)'
const CLOSED = 'A visitor reads sold and rented listings and their photos, and never an archived, pending, inactive or expired one'
const cases = [
  c('SEC-X-SRV-EDIT-MODERATION', 'server', 'deny', 'unit', true, EDIT,
    'listing owner', 'their active, sold, rented, inactive and expired listings',
    'updateListing with valid content and a database double that records the order of calls; once more on the active one with the transition failing',
    'active: the transition to pending before the content write, the answer pending; transition_failed and no write when it fails; other statuses: no transition, status unchanged',
    ['a content write while an active listing is still visible', 'a content write after a failed transition', 'a transition for a non-active listing'],
    'src/modules/listings/actions/__tests__/updateListing.security.test.ts', 'only an active listing goes to pending, before the content is written'),
  c('SEC-X-INT-EDIT-MODERATION-ALLOW', 'server', 'allow', 'integration', false, EDIT,
    'moderator', 'the approved development project', 'updateListing on a synthetic active listing, then a guest read',
    'the listing stays active; the guest reads the new content', ['a refusal of the permitted request'],
    'src/modules/listings/actions/updateListing.integration.test.ts', 'a staff edit keeps the listing public'),
  c('SEC-X-INT-EDIT-MODERATION-DENY', 'server', 'deny', 'integration', false, EDIT,
    'listing owner', 'the approved development project', 'updateListing on their synthetic active listing, then a guest read, then a staff approval',
    'pending; the guest reads no row until the approval, then the new content', ['the edited content readable by a guest before the approval'],
    'src/modules/listings/actions/updateListing.integration.test.ts', 'an owner edit hides the listing until staff approve'),
  c('SEC-X-SRV-CLOSED-PAGE', 'server', 'deny', 'unit', false, CLOSED,
    'guest, signed-in visitor, the listing owner, moderator', 'the listing page and its metadata',
    'an archived, a sold and a rented listing, with updated_at before and after archived_noindex_days',
    'not found for a visitor on archived and the page for its owner and staff; noindex on sold and rented only after the days',
    ['an archived listing shown to a visitor', 'archived among the requested statuses', 'noindex before the days'],
    'src/app/[locale]/listings/[slug]/__tests__/closedListing.security.test.ts', 'visitors open sold and rented, not archived'),
  c('SEC-X-FE-EDIT-MODERATION', 'frontend', 'deny', 'unit', false, EDIT,
    'listing owner saving an active listing', 'the real ListingFormShell after a save',
    'the save action answering status pending', 'the pending status shown and the redirect for pending',
    ['active shown after the save', 'the redirect for an active listing'],
    'src/modules/listings/components/__tests__/ListingFormShell.moderation.security.test.tsx', 'the owner sees the listing went to moderation'),
  c('SEC-X-SRV-MOD-KEYS', 'server', 'deny', 'unit', true, KEYS,
    'moderator with the key off, moderator with the key on, administrator', 'every Server Action and route that admits a moderator',
    'each action called with a permission double answering false, then true; the administrator with no row',
    'forbidden before any read or write when the key is off; the action runs when it is on, and for the administrator',
    ['a read or write with the key off', 'an action admitting a moderator without a key check'],
    'src/lib/auth/__tests__/moderatorKeys.security.test.ts', 'every moderator action checks its key'),
  c('SEC-X-INT-MOD-KEYS-ALLOW', 'server', 'allow', 'integration', false, KEYS,
    'synthetic moderator, users.edit allowed', 'the approved development project', 'updateUserProfile on a synthetic user',
    'the profile changed (restored by the test)', ['a refusal of the permitted request'],
    'src/tests/integration/moderatorKeys.integration.test.ts', 'a moderator with the key acts'),
  c('SEC-X-INT-MOD-KEYS-DENY', 'server', 'deny', 'integration', false, KEYS,
    'synthetic moderator, users.edit refused', 'the approved development project', 'updateUserProfile on a synthetic user',
    'forbidden; the row unchanged', ['a changed profile'],
    'src/tests/integration/moderatorKeys.integration.test.ts', 'a moderator without the key is refused'),
  c('SEC-X-SRV-PERMS-ADMIN-ONLY', 'server', 'deny', 'unit', false, PERMS,
    'moderator, signed-in user, guest; administrator', 'getModeratorPermissions, getPermissionEvents, setModeratorPermission and the /admin/permissions page',
    'each called by each viewer with a database double', 'forbidden / not found for all but the administrator; the administrator reads and sets',
    ['a switch value or event returned to a moderator', 'a write by anyone but the administrator', 'an unknown key written'],
    'src/modules/admin/actions/__tests__/permissions.security.test.ts', 'the switches are for the administrator only'),
  c('SEC-X-SRV-INACTIVITY-REMIND', 'server', 'deny', 'unit', false,
    'An inactive person is reminded once per absence at 3 months, and the job changes no account',
    'the cron caller with the secret', 'accounts absent 2, 3 and 4 months, one reminded and back since',
    'a real run with a database double and an e-mail double',
    'one reminder for the 3-month account, one for the returned and again absent one; no account changed',
    ['a second reminder in the same absence', 'an account changed by the job', 'a reminder before 3 months'],
    'src/app/api/cron/inactivity/__tests__/inactivity.security.test.ts', 'one reminder per absence and no account change'),
  c('SEC-X-SRV-JOBS-PAUSED', 'server', 'deny', 'unit', false,
    'Until the lifecycle tasks ship, no job deactivates, deletes or expires anything (D56, D58)',
    'the cron caller with the secret', 'an account absent 13 months and an active listing past expires_at',
    'a real run of the inactivity job and of the listing expiry job with database and e-mail doubles',
    'counts only; no users, listings or auth write and no e-mail for the 12-month step or the expiry',
    ['a deactivated, deleted or archived account', 'an expired listing', 'a final e-mail'],
    'src/app/api/cron/__tests__/jobsPaused.security.test.ts', 'the 12-month step and the expiry only count'),
  c('SEC-X-SRV-NO-AUTO-RESTORE', 'server', 'deny', 'unit', false,
    'A marked account is never restored by its own return (D58)',
    'a person whose account carries the inactivity mark, with a live session', 'api/presence and refreshSession',
    'a presence ping and a page request', 'no restore write; the session ends as for any account without access',
    ['deleted_at cleared', 'status set to active', 'a restore RPC call'],
    'src/lib/auth/__tests__/noAutoRestore.security.test.ts', 'a return does not restore a marked account'),
  c('SEC-X-SRV-RATES-LAST-GOOD', 'server', 'deny', 'unit', false,
    'Rates come from iliria98.com only, and a failed read never removes the rates visitors see (D57)',
    'any visitor', 'getExchangeRates', 'a successful read, then a failed read; a currency iliria98 does not publish',
    'the stored set after the failure; the unpublished currency without a rate; no other host fetched',
    ['a request to open.er-api.com', 'null rates after one failed read', 'a cached failure'],
    'src/lib/__tests__/exchangeRates.security.test.ts', 'one source and the last good rates'),
  c('SEC-X-FE-DELETE-PASSWORD', 'frontend', 'deny', 'unit', false,
    'An account is deleted by its owner only after the current password, or a recent Google sign-in, is proven',
    'signed-in account owner', 'the real cabinet deletion dialog', 'the dialog opened, a wrong password, then the right one; a Google-only account',
    'the password field instead of the DELETE word; invalid_password shown; the action called with the password; Google confirmation offered',
    ['a deletion sent without a password', 'the DELETE word as the only check'],
    'src/modules/cabinet/components/__tests__/ProfileTab.deletePassword.security.test.tsx', 'the cabinet deletion asks for the password'),
  c('SEC-DB-X-CLOSED-READ-ALLOW', 'database', 'allow', 'integration', true, CLOSED,
    'anon key, no session', 'synthetic sold and rented listings and their listing_images', 'REST select by id',
    'one row each and their photos', ['a refusal'], 'src/tests/integration/accessHardening.integration.test.ts', 'a guest reads sold and rented'),
  c('SEC-DB-X-CLOSED-READ-DENY', 'database', 'deny', 'integration', true, CLOSED,
    'anon key, no session', 'synthetic archived, pending, inactive and expired listings and their listing_images', 'REST select by id',
    'zero rows and zero photos for each', ['a hidden listing or its photo read by a guest'],
    'src/tests/integration/accessHardening.integration.test.ts', 'a guest reads no hidden listing or photo'),
  c('SEC-DB-X-PERMS-NO-SESSION', 'database', 'deny', 'integration', true, PERMS,
    'anon key with no session; moderator session token', 'role_permissions and role_permission_events',
    'REST select, insert and update', '42501 for each; no row changed', ['a switch read or written by a session'],
    'src/tests/integration/accessHardening.integration.test.ts', 'a browser session cannot touch the switches'),
  c('SEC-X-INT-PERMS-ADMIN-ALLOW', 'server', 'allow', 'integration', false, PERMS,
    'synthetic administrator', 'the approved development project', 'setModeratorPermission(users.edit, false), then true',
    'both values stored, two event rows; the value restored by the test', ['a refusal of the administrator', 'a change without its event row'],
    'src/tests/integration/moderatorKeys.integration.test.ts', 'the administrator changes a switch on the real project'),
]

const scope = [
  'src/modules/listings/actions/updateListing.ts', 'src/modules/listings/actions/applyListingTransition.ts',
  'src/modules/listings/domain/listingTransitionEngine.ts', 'src/modules/listings/components/ListingFormShell.tsx',
  'src/app/[locale]/listings/[slug]/page.tsx', 'src/lib/auth/permissionKeys.ts', 'src/lib/auth/permissions.ts',
  'src/components/admin/AdminPermissionsView.tsx', 'src/modules/admin/actions/permissions.ts', 'src/app/admin/permissions/page.tsx',
  'src/app/api/presence/route.ts', 'src/app/api/cron/listings-expiry/route.ts', 'src/lib/getExchangeRateServer.ts',
  'src/modules/cabinet/components/ProfileTab.tsx', 'src/design-system/mantine/patterns/MantineDeleteConfirmModal.tsx',
  'src/modules/admin/actions/exchangeProviders.ts', 'src/app/admin/currency/page.tsx',
  ...new Set(cases.map((x) => x.testFile)),
]

const byId = new Map(contract.cases.map((x) => [x.id, x]))
const rate = byId.get('SEC-X-SRV-RATE-REPORT-UPLOAD')
if (rate) {
  byId.delete(rate.id)
  byId.set('SEC-X-SRV-RATE-REPORT', { ...rate, id: 'SEC-X-SRV-RATE-REPORT', invariant: 'Reports are limited per person and fail closed',
    resource: 'reportListing', input: 'the 11th report in an hour, and a failed count', response: 'rate_limited',
    forbiddenEffects: ['a report past the limit', 'a report after a failed count'],
    testName: 'rateLimits [SEC-X-SRV-RATE-REPORT] reports are limited' })
}
// D58 replaces D28's restore on return: its three restore cases are withdrawn; the account task names their successors.
for (const id of ['SEC-D28-SRV-RESTORE', 'SEC-D28-INT-RESTORE', 'SEC-D28-INT-DENY']) byId.delete(id)
for (const x of cases) byId.set(x.id, x)
contract.cases = [...byId.values()]
contract.scope = [...new Set([...contract.scope, ...scope])]
writeFileSync(path, JSON.stringify(contract, null, 2) + '\n')
console.log(`added ${cases.length}; cases ${contract.cases.length}, scope ${contract.scope.length}`)
