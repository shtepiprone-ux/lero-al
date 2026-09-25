# Session Archive: Task 882 — the notification bell updates live, without a page reload — 2026-09-25

Task: `tasks/Archive/Sprint_82_kickoff_prompt_Task_882_Notification_Bell_Updates_Live.md`
Sprint 82 · P1 · Q4 · Executor: Sonnet (`claude-sonnet-5`)

`GR-0 CANONICAL REUSE PREFLIGHT — request: NONE (no visible UI/Story/style change; per kickoff §8, NotificationBell.tsx/NotificationBellView.tsx and every visual file are explicitly out of scope, and no rendered chrome changed); semantic queries: NONE; inspected candidates: NONE; decision: STOP-not-applicable (data hook only); selected canonical owner: NONE; Mantine/TailAdmin token path: NONE; new hardcoded visual values: NONE; rationale: the whole task is a client data hook (subscription scoping, status recovery, visibility refetch, fetch-error handling) plus an owner-run Node probe script — no component, Story, or visual value is created or touched.`

## Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`

## Requirement and acceptance-criteria evidence

| ID | Requirement | Evidence | Result |
|---|---|---|---|
| R1 / AC1 | `useNotifications` takes the id from `useAuth()`; no subscribe without a user; subscribes with `filter: 'user_id=eq.<id>'` on a channel name containing the id when known; removes the channel on id change/removal | `src/modules/notifications/hooks/useNotifications.ts:9-31,54-64,85` (subscribe effect gated on `userId`, cleanup on every id change via effect deps `[userId, fetchAll]`) + 3 tests in `useNotifications — subscription is scoped to the signed-in user (Task 882 R1)` (no-user/channel-not-called, filter+channel-name, A→B switch removes A's channel handle and opens B's) | ✅ |
| R2 / AC2 | Status callback passed to `.subscribe()`; `SUBSCRIBED` after an earlier non-`SUBSCRIBED` triggers one `fetchAll()`; `CHANNEL_ERROR`/`TIMED_OUT`/`CLOSED` (excluding the hook's own cleanup) logged via `console.warn('[notifications] realtime <status>', err)`, never swallowed | `useNotifications.ts:66-82` (`cancelled` guard skips status handling during the hook's own `removeChannel` teardown; `hadNonSubscribed` flag distinguishes "first ever SUBSCRIBED" from "recovered SUBSCRIBED") + `useNotifications — realtime status recovery (Task 882 R2)`: CHANNEL_ERROR→SUBSCRIBED sequence (warn×1, `fromSpy` 1→2) and a first-ever-SUBSCRIBED negative test (no extra fetch) | ✅ |
| R3 / AC3 | `visibilitychange`→`visible` calls `fetchAll()` once; listener removed on unmount | `useNotifications.ts:84-93` + `useNotifications — tab visibility recovery (Task 882 R3)`: one extra fetch on a simulated `visibilitychange`, then none after `unmount()` | ✅ |
| R4 / AC4 | A failed `fetchAll()` logs `console.error('[notifications] fetch failed', error)` and keeps the previous list; `.select()` column string unchanged | `useNotifications.ts:15-32` (`if (error) { console.error(...); return }` before any `setNotifications` call) + `useNotifications — a failed fetch keeps the previous list (Task 882 R4)` + the unmodified Task 596 `.select()` assertions (both still pass, unweakened) | ✅ |
| R5 / AC5 | `scripts/task-882-realtime-probe.mjs`, owner-run only; arm A (delivered, latency) vs arm B (anonymous, not delivered); prints `ARM A <ms\|MISSING>` / `ARM B <none\|RECEIVED>`; deletes the probe row in `finally`; exits 0 only on A-arrived+B-absent | Script created, `node --check` clean (`docs/sessions/evidence/task882/06-check-file-integrity.txt`); **not run** — requires a real Supabase test account and network access the executor sandbox does not have. `MISSING EVIDENCE`, owed by the owner per §13.3 (O82-4) | MISSING EVIDENCE (owner) |
| AC6 | §13.2 gate block, every command exits 0, no out-of-scope path beyond `00-i0.txt` | `docs/sessions/evidence/task882/01`–`09` (see Validation evidence below); final `git status --porcelain` below | ✅ |
| AC7 | Owner, after deploy, two browsers | Not executable pre-deploy | MISSING EVIDENCE (owner, O82-5) |

`GR-4 AC AUDIT — 7 criteria; each states an observable property; absolutes: none — AC5's 10 s is the probe's stated wait window, not a latency promise.` (restated from the kickoff; unchanged by this session.)

## Current versus required behavior

| | Current (before) | Required (after) | Verified |
|---|---|---|---|
| New notification while the page is open | appears only after a reload | appears without a reload (Realtime, scoped to the signed-in user) | Implemented; live delivery itself is O82-4/O82-5 (owner, post-implementation/post-deploy) |
| Realtime join failure | silent | logged with its status | ✅ (R2 test) |
| Missed events during a disconnect or a hidden tab | lost until reload | recovered by one refetch (reconnect via R2, hidden-tab via R3) | ✅ (R2 + R3 tests) |
| Failed fetch | list silently becomes empty | error logged, previous list kept | ✅ (R4 test) |
| Signed out | subscription opened anyway | no subscription | ✅ (R1 "no user" test) |

**Negative-flow applicability (kickoff §11):**

| Branch | Applicable | Verified |
|---|---:|---|
| Signed out | Yes | ✅ — no `channel()` call |
| User switches account in the same tab | Yes | ✅ — old handle removed, new channel scoped to the new id |
| Realtime error or timeout | Yes | ✅ — warned; refetch on the next `SUBSCRIBED` |
| Tab hidden while an event arrives | Yes | ✅ — refetch on visible |
| Fetch error | Yes | ✅ — logged, list kept |
| Another user's notification | Yes | Filter + RLS in place (`filter: user_id=eq.<id>`, existing `auth.uid() = user_id` SELECT policy per F4); live proof is R5/O82-4 |
| Realtime does not deliver at all | Yes | Not reachable from this sandbox — owed by O82-4 per kickoff §5.1 |

## Files Changed

| File | Rationale |
|---|---|
| `src/modules/notifications/hooks/useNotifications.ts` | R1–R4: user-scoped subscription with cleanup on id change, status-callback recovery, visibility refetch, fetch-error resilience without clearing the list |
| `src/modules/notifications/hooks/__tests__/useNotifications.smoke.test.ts` | Extended with R1–R4 coverage and both §10.2 planted-violation targets; Task 596's original two tests preserved unmodified (critical-flow row `:77`) |
| `scripts/task-882-realtime-probe.mjs` (new) | R5 — owner-run, two-armed live delivery probe (never in CI) |
| `docs/critical-flow-registry.md` | Row `:77` extended with the live-update behavior and the new R1–R4 test coverage (see below) |
| `docs/sessions/evidence/task882/**` | §13.2 gate-block transcripts + I0 + planted-violation transcripts |
| `docs/sessions/2026-09-25-task882-notification-bell-live-updates.md` | This session log |
| `docs/backlog.md` | Task 882 state updated to `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` |

## Validation evidence

Evidence root: `docs/sessions/evidence/task882/`.

| # | Command | Result | File |
|---|---|---|---|
| 00 | I0: platform, `git status --porcelain`, pre-plant `hash-object` baseline | recorded | `00-i0.txt` |
| — | Plant 1 (drop `filter`) → `vitest run .../useNotifications.smoke.test.ts` | **1 failed / 8 passed** — the filter assertion fails exactly as required; restored via Node `fs`, `hash-object` = `972d6647c9a0724f4c91bb97650091b5a0cb930d` (matches baseline) | `plant1-filter-dropped.txt` |
| — | Plant 2 (drop the `SUBSCRIBED` refetch) → same suite | **1 failed / 8 passed** — the reconnect assertion fails exactly as required; restored via Node `fs`, `hash-object` = `972d6647c9a0724f4c91bb97650091b5a0cb930d` (matches baseline) | `plant2-subscribed-refetch-dropped.txt` |
| 01 | `node -p "process.platform + ' ' + process.version"` | `win32 v22.22.3`, EXIT_CODE=0 | `01-platform.txt` |
| 02 | `npx vitest run src/modules/notifications` | 4 files / 23 tests passed, EXIT_CODE=0 | `02-vitest-notifications.txt` |
| 03 | `npx vitest run src/components/layout/__tests__/header-hydration-id-parity.test.tsx` | 1 file / 3 tests passed, EXIT_CODE=0 (critical-flow row `:39`, unaffected — the test's own supabase mock never reaches the `channel()` call because it renders with no `AuthProvider`, so `useAuth()` returns the context default `user:null`) | `03-vitest-header-hydration.txt` |
| 04 | `npm run typecheck` | 0 errors, EXIT_CODE=0 | `04-typecheck.txt` |
| 05 | `npm run lint` | 0 errors / 84 pre-existing warnings (none in touched files), EXIT_CODE=0 | `05-lint.txt` |
| 06 | `npm run check:file-integrity` | 11 files clean, EXIT_CODE=0 | `06-check-file-integrity.txt` |
| 07 | `npm run check:mojibake` | 0 artifacts / 6735 files, EXIT_CODE=0 | `07-check-mojibake.txt` |
| 08 | `Remove-Item .next -Recurse -Force; npm run build` | `Compiled successfully`, `.next\BUILD_ID` present, EXIT_CODE=0 | `08-build.txt` |
| 09 | `git hash-object` (final, post-build) on all 3 scoped implementation files | `useNotifications.ts` = `972d6647c9a0724f4c91bb97650091b5a0cb930d` (== baseline == post-restore, both plants proven byte-identical); test file `ac729de9cfd955f5088020945228ce958d940976`; probe script `bf984c0dc5727ec65cc3c3fef8e840fff2d016d9` | `09-hash-object.txt` |
| 10 | Final `git status --porcelain` (Note 18 §5a Pass 2 — after every artifact including this log and the backlog update exists) | see below | `10-git-status-final.txt` |
| 11 | Final `check:file-integrity` (Pass 2, reconciled to the final path set) | see below | `11-check-file-integrity-final.txt` |
| 12 | Final `check:mojibake` (Pass 2, reconciled to the final path set) | see below | `12-check-mojibake-final.txt` |

**R5/AC5 (`scripts/task-882-realtime-probe.mjs`) and AC7 are `MISSING EVIDENCE`, owed by the owner** — both require a real Supabase test account, network access, and (for AC7) a deployed build, none of which exist in this sandbox. §13.3's O82-4 and O82-5 commands are unchanged from the kickoff.

## Visual source trace

N/A — no visible UI/rendered artifact changes (kickoff §8: `NotificationBell.tsx`/`NotificationBellView.tsx` explicitly out of scope; GR-1 does not apply, no rendered chrome changed).

## Canonical UI decision record

N/A — same reason as above; no visible artifact was created, extended, or styled.

## Implementation validation notes

- **`useAuth()` import.** `useNotifications.ts` now imports `useAuth` from `@/modules/auth/context/AuthContext`. `AuthContext`'s default value (no `AuthProvider` ancestor) is `{ user: null, ... }`, so any existing caller that renders `NotificationBell` outside an `AuthProvider` (e.g. `header-hydration-id-parity.test.tsx`, which renders `HeaderView` directly with no provider) gets `userId = null` and skips subscribing — confirmed by the still-green critical-flow test at row `:39` (evidence `03`).
- **`hadNonSubscribed` semantics (R2).** Deliberately scoped to "since the channel was opened" (a `let` inside the effect, reset on every re-subscribe), not persisted across user switches — each new channel starts its own recovery state, matching R1's "removes the channel on id change" contract.
- **Fetch-error path (R4) sets `loading:false` and returns early**, before touching `notifications`/`unreadCount` — verified by the R4 test asserting the pre-existing 1-row list survives a subsequent failed `refetch()`.
- **No regression to Task 596's hook-level `.select()` guard** (critical-flow row `:77`): both of its original assertions are byte-unmodified in the extended test file and both still pass (evidence `02`).
- Nothing else in the repository imports `useNotifications` besides `NotificationBell.tsx` (unchanged) and the two test files already accounted for above (`Grep` confirmed 5 total hits: the hook itself, its test, `NotificationItem.templateLocalization.smoke.test.tsx` — a string match on "Notifications" heading, not an import — `header-hydration-id-parity.test.tsx`, and `NotificationBell.tsx`).

## Assumptions, deviations, and limitations

- R5's probe script is written to spec but **not executed** — no Supabase test-account credentials or network path are available to this executor session. This is the owed O82-4 owner step per the kickoff, not a deviation.
- AC7 is explicitly owner-only, after deploy (O82-5).
- No product code outside `useNotifications.ts` was touched; `NotificationBell.tsx`/`NotificationBellView.tsx` remain byte-identical (confirmed: not in the changed-file set below).

## Opus handoff

- Evidence root: `docs/sessions/evidence/task882/`.
- Please independently re-read `useNotifications.ts` end to end against R1–R4 and re-run `02`–`08` if you want a second observation, not just this transcript.
- Open question for review: is the `hadNonSubscribed`-scoped-per-channel design (rather than a ref that survives across user switches) the right recovery granularity, or should a switch from user A to user B also trigger a recovery-style refetch on the new channel's very first `SUBSCRIBED`? The kickoff's AC2 only specifies the CHANNEL_ERROR→SUBSCRIBED sequence; I read the "very first SUBSCRIBED never refetches" behavior as intentional (fetchAll() already ran on mount/id-change), but it is worth an explicit check against R1+R2's intent.
- R5/AC5 and AC7 are owed by the owner (O82-4, O82-5) — this task cannot reach `APPROVED`/`APPROVED WITH NOTES` on Q4 without them per `docs/qa-profiles.md`.

## Backlog update

`docs/backlog.md` Task 882 registry row updated to `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, pointing at this session log; no other row touched. Resulting `docs/backlog.md` line count and any `BACKLOG LIMIT BREACH` are recorded in that file's own edit, not restated here.

## Self-validation

Self-validation: tsc=0 errors · build=passes · AC table=all green except R5/AC5+AC7 (MISSING EVIDENCE, owner-owed) · runtime locale=N/A (no UI) · scope=clean (7 paths, all within kickoff §7) · integrity=PASS

## Orchestrator review (Opus, 2026-09-25)

- Review 1: `PARTIALLY VERIFIED`. R1–R4 were verified against the diff, the tests, both plant transcripts and the post-write build; AC5 was owed.
- O82-4 was run by the orchestrator in native PowerShell with the owner-updated test account from `.env.local` (`HYDRATION_ADMIN_*`, read raw as `capture-admin-session.mjs` does). Result: `ARM A 716ms`, `ARM B none`, `probe row deleted`, `EXIT_CODE=0` → `evidence/task882/13-o82-4-realtime-probe.txt`. That transcript supersedes two earlier sign-in setup errors from the stale password; neither reached the insert.
- Review 2: `APPROVED WITH NOTES`. P3: the probe's arm A binds `event: 'INSERT'` where the hook binds `'*'` (same filter and channel shape). NOTE: `00-i0.txt` was recorded after the edits, so it is not a start-state record. AC7/O82-5 (two browsers, after deploy) stays an open owner action in Sprint 82.
