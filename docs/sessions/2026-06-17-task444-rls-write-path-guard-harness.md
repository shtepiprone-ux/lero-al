# Task 444 — Epic RS Slice 5: RLS write-path GUARD harness + manifest

**Date:** 2026-06-17
**Epic:** RS (Regression Shield)
**Slice:** 5 — Server-action / RLS write paths (action-level guards only)
**Status:** IMPLEMENTED — awaiting orchestrator review

## Investigation Notes (AC14)

### Full write-action enumeration
Enumerated 65+ write actions across `src/modules/**/actions/**`. Classified each by guard archetype (A/B/C/D), table(s) written, authn/authz guard, and client type. Full classification in `docs/rls-write-path-manifest.md` Table 1.

### Guard archetype classification
- **A (Anon-allowed public write):** 2 actions — `submitContactInquiry`, `submitListingInquiry`. Guard = validation + IP rate-limit. No session required. Client = service-role.
- **B (Authenticated self-scoped):** ~20 actions — cabinet profile/searches/favorites/collections/listings. Guard = `getUser()` + blocked check. Client = user-scoped. Row anchored to `auth.uid()`.
- **C (Admin/moderator write):** ~30 actions — admin CRUD (currencies, property types, locations, pages, settings, users, listings, exchange providers, email templates, reports). Guard = `assertAdminAccess()`/`assertAdmin()`/`assertPermission()`/`hasPermission()`. Client = service-role.
- **D (Admin-only, NOT moderator):** 4 actions — `setModeratorPermission`, `upsertFooterContent`, `deleteEmailTemplateGroupAction`, `deleteEmailTemplateLocaleAction`. Guard checks `role === 'admin'` explicitly (moderator rejected).

### Representative-action choices + rationale
- **A:** `submitContactInquiry` (`contacts/actions/index.ts:64`) — cleanest anon-write seam: validation + rate-limit + insert + email notification. Not already covered by Slices 2/3/4.
- **B:** `updateCabinetProfile` (`cabinet/actions/index.ts:26`) — canonical self-scoped write: uses `createClient()` (user-scoped), update anchored to `userId`, has `getBlockedError` check. Not already covered.
- **C:** `createCurrency` (`admin/actions/currencies.ts:50`) — clean admin/moderator write: `assertAdmin()` guard, `createAdminClient()`, insert with error handling. Not already covered.
- **D:** `setModeratorPermission` (`admin/actions/permissions.ts:142`) — the canonical admin-but-NOT-moderator boundary: `getAdminUserId()` explicitly checks `role === 'admin'`, rejects moderator. This is the archetype most likely to silently regress (moderator given permission-change access). Not already covered.

### Live-DB-only gap list
Documented in `docs/rls-write-path-manifest.md` Table 2:
1. **Anon INSERT blocked by RLS** — user-scoped tables can't be tested without real Postgres roles
2. **Cross-user row isolation** — `auth.uid() = user_id` policy is DB-enforced, not action-code-enforced
3. **Service-role bypass detection** — action client swap from user-scoped to admin is a code-level check; DB policy enforcement is separate
4. **`email_change_tokens` service-role-only** — table has RLS enabled but no policy rows
5. **Admin-only DB policies** — DB-level admin-only write enforcement

These are honestly marked as ❌ → Slice 5b in both the manifest and the registry.

### Mobile <640 full-width gate
N/A — this slice modifies no rendered UI surface. Tests only.

## Test Results

### `npm run test:rls-guards` (15 tests)
```
Test Files  1 passed (1)
     Tests  15 passed (15)
  Duration  1.08s
```

**Archetype A — submitContactInquiry (4 tests):**
1. positive — valid payload → insert called + email fired → `{}`
2. negative — invalid topic → `{ error: 'validation' }`, no insert
3. negative — rate limited → `{ error: 'rate_limited' }`, no insert
4. diagnosability — insert failure → `console.error('[contact-inquiry] insert failed', error)`

**Archetype B — updateCabinetProfile (3 tests):**
1. positive — authenticated user → update via user-scoped client, anchored to caller id → `{}`; client-boundary invariant: `createClient()` called, admin client not used for mutation
2. negative — no session → `{ error: 'Unauthorized' }`, no write
3. diagnosability — DB update failure → `console.error('updateCabinetProfile failed', ...)`

**Archetype C — createCurrency (4 tests):**
1. positive — admin → insert via admin client → `{ id: 1 }`
2. negative — unauthenticated → `{ error: 'unauthenticated' }`, no insert
3. negative — regular user → `{ error: 'forbidden' }`, no insert
4. diagnosability — insert failure → `console.error('createCurrency failed', ...)`

**Archetype D — setModeratorPermission (4 tests):**
1. positive — admin → permission upserted + audit event inserted → `{}`
2. negative — moderator actor → `{ error: 'forbidden' }`, no write
3. negative — unauthenticated → `{ error: 'forbidden' }`, no write
4. diagnosability — upsert failure → `console.error('setModeratorPermission upsert failed', ...)`

## Planted-Violation Transcripts (AC8)

### PV1 — Archetype B: admin client swap (client-boundary guard)
**Mutation:** Changed `updateCabinetProfile` to use `createAdminClient()` instead of `createClient()` at `cabinet/actions/index.ts:41`.
**Result:** 2 tests FAIL — `TypeError: supabase.from(...).update is not a function` (admin mock doesn't have the user-scoped routing).
**Revert → PASS:** All 15 tests green.

### PV2 — Archetype C: auth guard removed
**Mutation:** Commented out `assertAdmin()` + early return in `createCurrency` at `currencies.ts:53–54`.
**Result:** 2 tests FAIL — unauthenticated gets `{ id: 1 }` instead of `{ error: 'unauthenticated' }`, regular user gets `{ id: 1 }` instead of `{ error: 'forbidden' }`.
**Revert → PASS:** All 15 tests green.

### PV3 — Archetype D: moderator allowed through
**Mutation:** Changed `getAdminUserId()` at `permissions.ts:39` from `role === 'admin'` to `role === 'admin' || role === 'moderator'`.
**Result:** 1 test FAILS — moderator gets `{}` instead of `{ error: 'forbidden' }`.
**Revert → PASS:** All 15 tests green.

### PV4 — Archetype A: validation guard removed
**Mutation:** Commented out `if (!VALID_TOPICS.has(topic)) return { error: 'validation' }` at `contacts/actions/index.ts:69`.
**Result:** 1 test FAILS — invalid topic gets `{}` instead of `{ error: 'validation' }`.
**Revert → PASS:** All 15 tests green.

## Validation Gates

| Gate | Result |
|------|--------|
| `npx tsc --noEmit` | PASS (clean) |
| `npm run lint` | PASS (clean) |
| `npm run test:rls-guards` | PASS (15/15) |
| `npm run check:file-integrity:all` | PASS (956/956 files clean) |

## AC Self-Audit

| AC | Status | Evidence |
|----|--------|----------|
| AC1 | ✅ | `rls-write-guards.smoke.test.ts` created; harness mirrors existing smokes |
| AC2 | ✅ | 15 tests: 4 archetypes × (positive + negative), literal return shapes/error codes |
| AC3 | ✅ | Archetype B: `createClient()` called + `.eq('id', userId)` ownership; admin client not used for mutation |
| AC4 | ✅ | Archetype D: moderator → `{ error: 'forbidden' }`, no write; admin → upsert + event |
| AC5 | ✅ | Diagnosable failure paths assert `console.error` with exact root-cause strings |
| AC6 | ✅ | `docs/rls-write-path-manifest.md` created: Table 1 (65+ actions classified) + Table 2 (5 live-DB-only gaps) + honesty disclaimer |
| AC7 | ✅ | `test:rls-guards` script added; wired into governance-pr.yml as blocking step |
| AC8 | ✅ | 4 planted-violation transcripts (PV1–PV4), one per archetype |
| AC9 | ✅ | Registry Slice 5 section: 4 archetype rows ✅ + DB-level-RLS row ❌ (Slice 5b) |
| AC10 | ✅ | No product/UI/migration/policy change; existing smokes unedited; no Docker/live DB |
| AC11 | ✅ | `npx tsc --noEmit` clean |
| AC12 | ✅ | `npm run lint` clean |
| AC13 | ✅ | `npm run check:file-integrity:all` — 956/956 clean |
| AC14 | ✅ | Investigation notes above (enumeration, classification, representative choices, live-DB gaps, mobile N/A) |

## Files Changed

| File | Change | Rationale |
|------|--------|-----------|
| `src/modules/__tests__/rls-write-guards.smoke.test.ts` | NEW | Guard smoke: 15 tests (4 archetypes × positive/negative + diagnosability) |
| `docs/rls-write-path-manifest.md` | NEW | Write-action manifest (65+ actions) + live-DB-only gaps + honesty disclaimer |
| `package.json` | MODIFIED | Added `test:rls-guards` script |
| `.github/workflows/governance-pr.yml` | MODIFIED | Added blocking "RLS write-path guard smoke" CI step |
| `docs/critical-flow-registry.md` | MODIFIED | Slice 5: 4 archetype rows ✅ + DB-level-RLS ❌ (Slice 5b) |
| `docs/sessions/2026-06-17-task444-rls-write-path-guard-harness.md` | NEW | This session log |
| `docs/backlog.md` | MODIFIED | Last Session + Task 444 status |

## Orchestrator Review — ✅ APPROVED (Opus, 2026-06-17)

Reviewed against the real working-tree files via the Read tool (not sandbox git — per `orchestrator-role.md` "Orchestrator NEVER runs git/integrity checks in the Cowork sandbox"; authoritative integrity + `git status` remain the owner's native PowerShell run, clause 14 / sandbox=screen).

- **Tests reflect real product behavior (diff-not-report).** Verified every assertion against the actual actions: `submitContactInquiry` (`contacts/actions/index.ts:64–137`), `updateCabinetProfile` (`cabinet/actions/index.ts:26–73`), `createCurrency` (`admin/actions/currencies.ts:50–82`), `setModeratorPermission` (`admin/actions/permissions.ts:142–198`). Guards, return shapes (`validation`/`rate_limited`/`Unauthorized`/`unauthenticated`/`forbidden`/`save_failed`), ownership (`.eq('id', userId)`), the admin-only `role === 'admin'` boundary, and the exact `console.error` root-cause strings all match the tests.
- **CI wiring confirmed:** `package.json` `test:rls-guards` (line 15); `governance-pr.yml` blocking step "RLS write-path guard smoke (Epic RS Slice 5)" (lines 50–51).
- **Registry confirmed honest:** Archetype A–D rows ✅ + DB-level-RLS ❌ (Slice 5b deferred) row present and accurate.
- **Email/network seam (kickoff clarification).** The harness sends NO real email and makes NO network call: `sendContactInquiryNotification`, `createNotification`, and the email-change/password-changed senders are all `vi.mock` stubs (test lines 59–78); Archetype A asserts only the mocked sender. No live Supabase/Postgres/Docker. (Recording this explicitly per the kickoff requirement — it was implemented in the mocks but not previously stated in prose.)

**Non-blocking notes (do NOT reopen 444):**
1. PV1 (Archetype B) fails via `TypeError` (admin mock lacks user-scoped routing) rather than a clean client-boundary assertion. The positive test's explicit `createClient()` + `.eq('id', userId)` + "admin client not used" assertions already lock the boundary, so the regression is caught; the transcript is just less surgical. Acceptable.
2. Archetype D used `setModeratorPermission` instead of the kickoff's `createAdminUser`/`softDeleteUser` examples — accepted as a clean, high-value admin-only seam ("moderator must not gain admin powers"). An optional future slice may add `createAdminUser`/`softDeleteUser` user-management D coverage.

**Verdict: APPROVE.** Regression-coverage gate (clause 15) satisfied — named tests exist, run blocking in CI, and 4 planted-violation FAIL transcripts (PV1–PV4) prove the gate is not a no-op. Commit emitted at review; pending owner native integrity gate + run.
