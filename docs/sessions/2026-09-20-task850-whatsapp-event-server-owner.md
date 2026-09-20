# Task 850 — WhatsApp click event: DB resolves the owner, one server write path, guest clicks recorded

Kickoff: `tasks/Sprints/Sprint_78_kickoff_prompt_Task_850_WhatsApp_Event_Server_Owner.md` · QA profile **Q4** · Executor: Sonnet 5
Status: **IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW** (AC5 is owner-native and pending — O78-4)
Evidence root: `docs/sessions/evidence/task850/`

## Start gate

- `CANONICAL REUSE PREFLIGHT LOADED — docs/golden-rules.md GR-0; docs/agent-contract.md 16b–16c.`
- GR-0 / GR-1 / GR-3 / GR-3a: not applicable — no visible artifact changes (R4 drops one call argument; the diff in
  AC4 shows only that). Clause 16d census: no surface markup is changed, so no component is excluded.
- I0: `win32 v22.22.3`; `git status --porcelain` before edits: only ` M docs/sessions/evidence/task861/storybook-dev.log`
  (unrelated, pre-existing); `git grep trackListingContactEvent -- src` = the action + `ListingContact.tsx:125`,
  `WhatsAppContactButton.tsx:51`, `ListingMobileCTA.tsx:60` (exactly the expected three callers).
- Pre-edit hashes: `contactEvents.ts` 6a0cb7a2 · `ListingContact.tsx` f42ec9f8 · `WhatsAppContactButton.tsx` 82ca3102 ·
  `ListingMobileCTA.tsx` 2c61996a · `database.ts` a4c77503 · `schema-drift-check.sql` bbd2f231 · `backlog.md` c5bc5151.

## Requirement ledger

| ID | Implemented in | Evidence |
|---|---|---|
| R1 | `scripts/task-850-step1-owner-trigger.sql` | column `actor_ip_hash`; indexes `listing_contact_events_listing_actor_idx`, `…_listing_iphash_idx`; trigger function `listing_contact_events_set_owner()` `security definer`, `set search_path = public`, raises `foreign_key_violation` when the listing is missing, sets `listing_owner_id` and `is_owner_click`; all idempotent; header names deploy order + rollback |
| R2 | `scripts/task-850-step2-revoke-client-insert.sql` | `drop policy if exists "events_insert_authenticated"`; `revoke insert … from authenticated`; header names deploy order + rollback |
| R3 | `src/modules/listings/actions/contactEvents.ts` | session → admin-client listing resolve (`active/sold/rented/archived`) → actor (user id, or guest ip hash built as `view/route.ts`) → 30-min de-dup → service-role insert → `insert_failed` logged with `{ code, listingId }` → `self_click` after the row is written |
| R4 | three callers | diff below: one property removed per file, nothing else |
| R5 | `src/modules/listings/actions/__tests__/contactEvents.test.ts` | 9 cases, all pass (the 7 required + `session_error` + no-IP guest) |

## Acceptance criteria

| AC | Result |
|---|---|
| AC1 | Step 1 read back: column, both indexes, `create or replace function … security definer set search_path = public`, `raise exception … using errcode = 'foreign_key_violation'`, `new.is_owner_click := (new.actor_user_id is not null and new.actor_user_id = v_owner)`, `drop trigger if exists`. Every statement idempotent. |
| AC2 | `g-test-850.log`: 9/9 pass, `EXIT_CODE=0`. Red first (`red.log`: 8 failed / 1 passed, `EXIT_CODE=1`). Plant (`plant.log`): `listingOwnerId` re-added to `TrackArgs` and used in the insert → `npm.cmd run typecheck` `PLANT_TYPECHECK_EXIT_CODE=2` including `contactEvents.test.ts(180,7): error TS2578: Unused '@ts-expect-error' directive.`; reverted, hash `fac96fca…` before and after. |
| AC3 | The action has no `listingOwnerId` identifier (`git grep` over the four files hits only the two components' own props, below); the insert uses `createAdminClient()`. `git grep` reads the index and the action is modified, not new, so the grep is not vacuous for it. |
| AC4 | Diff shows only the removed property in each of the three files (WhatsAppContactButton −1, ListingContact ±1 line, ListingMobileCTA ±1 line). |
| AC5 | **Pending — owner-native (O78-4).** `scripts/task-850-verify.sql` created (parts a/b/c). Not run by the executor: no DB access. |
| AC6 | Every command in the §13.2 block exits 0 (table below). |

## Validation evidence (unpiped, exit code appended)

| Command | Result |
|---|---|
| `node.exe -p "process.platform + ' ' + process.version"` | `win32 v22.22.3` |
| `npm.cmd run typecheck` | EXIT_CODE=0 (`g-typecheck.log`) |
| `npm.cmd run lint` | EXIT_CODE=0 — 0 errors, 81 warnings, of which **2 are new from this diff** (see deviations) |
| `npm.cmd run test -- …contactEvents.test.ts` | 9/9, EXIT_CODE=0 |
| `npm.cmd run test:listings` | 6 files / 45 tests, EXIT_CODE=0 |
| `npm.cmd run test:rls-guards` | 1 file / 15 tests, EXIT_CODE=0 |
| `node.exe scripts\check-surface-census-changed.mjs --base HEAD` | PASS, EXIT_CODE=0 |
| `npm.cmd run build` | EXIT_CODE=0 (`g-build.log`) |
| `npm.cmd run check:file-integrity` | EXIT_CODE=0 |
| `npm.cmd run check:mojibake` | EXIT_CODE=0 |

`git grep -n listingOwnerId` over the four files — remaining hits, none an argument to `trackListingContactEvent`:
`WhatsAppContactButton.tsx:12` (Props field) · `:26` (destructure) · `ListingMobileCTA.tsx:19` (Props field) ·
`:23` (destructure). `ListingContact.tsx` has none.

GR-2 SCOPE STATED — the vitest suite mocks the admin client; it cannot see the Postgres trigger, the grants or the
policies. AC1's trigger/grant semantics are closed by reading the SQL, and AC5 by the owner's run of `task-850-verify.sql`.

Final hashes: `contactEvents.ts` fac96fca · `ListingContact.tsx` 2ceacac8 · `WhatsAppContactButton.tsx` 004aebd2 ·
`ListingMobileCTA.tsx` d1c99dd6 · step1 7214780f · step2 9fbaec77 · verify a2b6af24 · test 6ed441b1.

## Files Changed

| Path | Reason |
|---|---|
| `src/modules/listings/actions/contactEvents.ts` | R3 rewrite: no `listingOwnerId`, admin client, guest ip hash, de-dup, new result reasons |
| `src/modules/listings/components/ListingContact.tsx` | R4: drop `listingOwnerId` from the call |
| `src/components/listing/WhatsAppContactButton.tsx` | R4: same |
| `src/modules/listings/components/ListingMobileCTA.tsx` | R4: same |
| `src/types/database.ts` | `ListingContactEvent.actor_ip_hash: string \| null` |
| `scripts/schema-drift-check.sql` | `actor_ip_hash` in both column lists; header `(9 cols)` → `(10 cols)` |
| `scripts/task-850-step1-owner-trigger.sql` | new — R1 |
| `scripts/task-850-step2-revoke-client-insert.sql` | new — R2 |
| `scripts/task-850-verify.sql` | new — AC5 grids |
| `src/modules/listings/actions/__tests__/contactEvents.test.ts` | new — R5 |
| `docs/rls-write-path-manifest.md` | row 42 (Opus-directed follow-up): path `:21` → `:29`, auth cell → `getUser()` (optional) + server-resolved listing, client cell `user-scoped` → `service-role` |
| `docs/backlog.md` | 850 state (line count stays 80) |
| `docs/sessions/2026-09-20-task850-whatsapp-event-server-owner.md` | this log |
| `docs/sessions/evidence/task850/*` | transcripts (red/green/plant/gates) |

`docs/sessions/evidence/task861/storybook-dev.log` is modified in the working tree but is **not** part of this task.

## Assumptions, deviations, limitations

- **Two new lint warnings.** `listingOwnerId` is now a destructured-but-unused prop in `WhatsAppContactButton.tsx:26` and
  `ListingMobileCTA.tsx:23` (`@typescript-eslint/no-unused-vars`, warning, lint exit 0). R4 says no other line changes in
  those files, so I did not remove the prop or touch their consumers. Opus to decide whether to drop the prop.
- **Result union widened** with `not_found` and `deduplicated` (R3). Callers ignore the result (`void`).
- **Inferences beyond R3:** a listing look-up *error* returns `insert_failed` (logged), not `not_found`; a de-dup
  look-up error is logged and the click is still recorded (a lost click is worse than a rare double count).
- **Trigger EXECUTE revoke.** Step 1 also revokes EXECUTE on the trigger function from `public, anon, authenticated`
  per `rls-rules.md` (trigger functions are not REST-callable). Not named in R1; it does not affect trigger firing.
- **30-minute window** is one constant, `DEDUP_WINDOW_MS`, per §5 (INFERENCE, owner may return it).
- `docs/rls-write-path-manifest.md:42` still describes `trackListingContactEvent` as `user-scoped`. It is outside the
  kickoff's scope list, so I left it; it is now service-role. Flagged for Opus.
- SQL is unrun: no database access from the executor. AC5 and the owner's guest-tap check (§13.3 step 5) are pending.
