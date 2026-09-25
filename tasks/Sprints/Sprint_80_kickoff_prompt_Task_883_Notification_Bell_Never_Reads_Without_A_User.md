# Task 883 — the notification bell never reads `notifications` without a signed-in user

Sprint 80 · **P3** · QA profile **Q4** (the change is in `useNotifications.ts`, the data source of critical-flow rows
`docs/critical-flow-registry.md:39` and `:77`; same profile as Task 882 on the same hook) · depends on **881** (archived)
· owner action **O80-6** · **Status: `KICKOFF FILED` 2026-09-25**

Sprint plan: [`Sprint_80_The_Data_API_Privileges_Nobody_Audited.md`](Sprint_80_The_Data_API_Privileges_Nobody_Audited.md).
Hosted in Sprint 80 by discovery, not goal fit: it is the consequence of 881's grant change. The owner may move it.
Origin: Task 881 review 4, finding **F3** (`docs/reviews/2026-09-25-task881-notifications-least-privilege.review-ledger.json`).

## 1. Mode and task type

`IMPLEMENTATION`. It changes one client data hook and extends its test file. Bundles: **Regression / Critical Flow
Coverage** and the client-data part of **DB / Server Action / RLS** (the refusal comes from 881's grants).

**No component, JSX, `className`, style, locale key or Storybook change.** `NotificationBell.tsx` and
`NotificationBellView.tsx` are unchanged. §3.4 records why GR-0, GR-1, GR-3 and GR-3a do not apply. The executor stops
and reports `SCOPE DRIFT` if the fix needs any file outside §7.

## 2. Objective

1. `useNotifications` issues **no** request to `notifications` while `useAuth().user` is null. This covers the mount/effect
   path, the tab-visibility refetch and the returned `refetch`.
2. When the user becomes null, the hook clears its list and unread count. This is the state the bell showed on sign-out
   before 881, when the anonymous read returned `200 []`.
3. A response that arrives after the user changed or signed out is discarded. It must never repopulate the cleared
   state or show user A's rows to user B.
4. Every Task 882 behaviour is preserved: the scoped subscription, status recovery, the visibility refetch for a
   signed-in user, and a failed fetch keeping the list.

## 3. Verified context — measured 2026-09-25

### 3.1 The defect, observed live

- **F1 FACT (owner, 881 O80-5 step 10, `docs/sessions/evidence/task881/19c-manual-checks.txt`).** On lero.al (production)
  the owner signed out with DevTools open. `POST …/logout?scope=global` returned **204**, then
  `GET …/rest/v1/notifications?select=id,user_id,type,…&order=cre…` returned **401**. The DevTools error badge read 5.
- **F2 FACT.** Since 881 (applied 2026-09-25), `anon` holds no privilege on `public.notifications`
  (`docs/sessions/evidence/task881/19-audit-after.tsv`: N1 `anon` all `false`; probe A1 AFTER `401 42501 grant`). Before
  881, the same anonymous read returned `200 []` (RLS). The request itself is older than 881; only its outcome changed.

### 3.2 Why the request happens — the causal chain

- **F3 FACT.** `src/modules/notifications/hooks/useNotifications.ts:39-42`: the effect calls `fetchAll()` **before**
  `if (!userId) return`, so every run with `userId === null` issues the read. `fetchAll` (`:18-37`) never consults
  `userId` (its `useCallback` deps are `[]`).
- **F4 FACT.** The visibility effect (`:83-93`) calls `fetchAll()` on every `visibilitychange` to visible, whatever the
  user.
- **F5 FACT.** The hook returns `refetch: fetchAll` (`:95`). Its only consumer passes it as `onRead`:
  `src/modules/notifications/components/NotificationBell.tsx:7,13`. `git grep` over `src` (non-test) finds no other
  `useNotifications` consumer.
- **F6 FACT — why the bell is still mounted while the user is null.** `src/components/layout/Header.tsx:24-30` holds the
  pre-sign-out user while `isSigningOut` ("~0.5s window", Task 876 F4). `headerUser = isSigningOut ? heldUser : user`,
  and `:78` mounts `<NotificationBell />` while `headerUser` is truthy. `useUser()` is `useAuth()`
  (`src/modules/auth/hooks/useUser.ts:4-6`). During that window the hook's `userId` is already null while the bell is
  still mounted, so the effect re-runs with null and F3's read goes out unauthenticated.
- **F7 FACT — the error branch keeps the previous user's rows.** `:26-31`: on `{ error }` the hook logs
  `[notifications] fetch failed` and returns without touching the list. The 401 therefore leaves the signed-out user's
  notifications in state for the rest of the window.
- **F8 INFERENCE (F3, `:20-24`).** A read started for user A that resolves after A signs out calls
  `setNotifications(A's rows)` with no check that A is still the user. This path exists in the code; whether it occurs
  live is **UNKNOWN**. R3 closes it either way.

### 3.3 Tests that exist today

- **F9 FACT.** `src/modules/notifications/hooks/__tests__/useNotifications.smoke.test.ts` (241 lines) mocks
  `@/lib/supabase/client` (`from`/`select`/`order`/`limit` spies, `channel`/`on`/`subscribe`, `removeChannel`) and
  `useAuth` via a mutable `mockUser`.
- **F10 FACT — one existing test pins the defect.** `:124-131` "no user: channel is never called" sets
  `mockUser = null` and **waits for `limitSpy` to be called**, so it asserts that the anonymous read happens. After this
  task it cannot pass as written. R5 rewrites its wait and adds the assertion that no read happens. This is the only
  existing test R5 may change.
- **F11 FACT.** Every other test in the file uses a non-null `mockUser`. Their assertions (`fromSpy` call counts,
  channel scoping, status recovery, visibility refetch, error keeps the list) must still pass unchanged.

### 3.4 Visible-surface classification (GR-0 / GR-1 / GR-3 / GR-3a)

**NOT APPLICABLE, with evidence.** No component, JSX, `className` or style changes. The only rendered effect is the
bell's data during the ~0.5 s sign-out window: before, the previous list was kept after a 401; after, the list is empty
with an unread count of 0. That is a state `NotificationBellView` already renders in its canonical Story
(`src/stories/mantine/primitives/NotificationBellView.stories.tsx`, `Default` renders `unreadCount={0}` variants at
`:99` and `:111`). It is also what the bell showed on sign-out before 881 (F2). Task 882 classified the same hook
change the same way (`tasks/Archive/Sprint_82_kickoff_prompt_Task_882_Notification_Bell_Updates_Live.md:89-90`).

### 3.5 Critical flows (`docs/critical-flow-registry.md`)

- `:77` "Notifications panel — template-driven title/body localization": `useNotifications.ts` is its data source. Its
  command runs `useNotifications.smoke.test.ts`.
- `:39` "Authenticated header hydration — NotificationBell SSR shell": authoritative command
  `npm run test:header-hydration-id-parity`. The hook runs only in effects, so SSR output is unchanged. The command is
  run as regression proof (§13.2).

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| **R1** | F1, F3–F5 | With `userId` null, `fetchAll` performs **no** `createClient().from('notifications')` call. This holds on the effect path, the visibility handler and `refetch`. The guard lives in `fetchAll` itself, so all three callers inherit it; `fetchAll`'s `useCallback` deps include `userId`. | P1 | AC1, AC2, AC3 | Confirmed |
| **R2** | F2, F7 | When `userId` is null, the hook's state is `notifications = []`, `unreadCount = 0`, `loading = false`, and no `console.error` is emitted. | P1 | AC2 | Confirmed |
| **R3** | F8 | A `fetchAll` response is applied only if `userId` is still the value it was called with. Use a ref holding the current `userId`, compared after the `await`. Otherwise it is dropped, and a dropped error is not logged. | P2 | AC4 | Confirmed (INFERENCE-driven hardening) |
| **R4** | F11; Task 882 | Everything 882 shipped is preserved for a signed-in user: the initial fetch, the channel name/filter, teardown on user change, `CHANNEL_ERROR → SUBSCRIBED` single refetch, no refetch on the first `SUBSCRIBED`, visibility refetch, listener removed on unmount, and the error branch keeping the list and logging `[notifications] fetch failed`. | P1 | AC5 | Confirmed |
| **R5** | F9, F10 | `useNotifications.smoke.test.ts`: rewrite only the `:124-131` test (below), and add a `describe('… no read without a user (Task 883)')` block with four tests. **(a)** `mockUser = null` on mount → `fromSpy` never called and `channelSpy` never called. This is the rewritten `:124` test; it waits a tick, never for `limitSpy`. **(b)** Sign-out: mount with user A and one row; `waitFor` the row; set `mockUser = null` and `rerender()`. Then `fromSpy` count is unchanged, `notifications` is `[]`, `unreadCount` is 0, and the `console.error` spy was not called. **(c)** `mockUser = null`, dispatch `visibilitychange` to visible, and `await result.current.refetch()` → `fromSpy` never called. **(d)** Stale response: `limitSpy` returns a deferred promise for user A; set `mockUser = null`, `rerender()`, then resolve with one row → `notifications` stays `[]`. | P1 | AC1–AC4, AC6 | Confirmed |
| **R6** | agent-contract 15 | `docs/critical-flow-registry.md:77` notes Task 883's signed-out arms in its evidence/status cell. Nothing else in the row changes. | P3 | AC7 | Confirmed |
| **R7** | F1 | O80-6, owner-native after deploy, repeats 881's step 10. After sign-out, no `notifications?select` request appears in Network and no `[notifications] fetch failed` appears in Console. The signed-in bell still loads, marks read and updates live. | P1 | AC8 | Confirmed (owner-native) |

## 5. Assumptions and open questions

1. **Clearing is the required behaviour, not keeping the list.** 882's R4 keeps the list on a *failed* fetch for a
   signed-in user, and R4 here preserves that. No user is a different state: there is nothing valid to keep, and
   before 881 the bell cleared (F2). No owner decision is needed.
2. **The in-flight race (F8) is not observed live.** R3 is cheap hardening justified by the code path. AC4 proves it
   with a deferred promise.
3. **No server-side change.** 881's grants stay as they are. Re-granting `anon` `SELECT` to silence the 401 is
   explicitly rejected (§8).

## 6. Pre-read rule bundle

- `docs/golden-rules.md`: GR-2, GR-4, GR-5, GR-6. Read GR-0/1/3/3a only far enough to confirm §3.4.
- `docs/agent-contract.md`: clauses 1, 3, 5, 9, 10, 14, 15.
- `docs/rule-index.md`: "Regression / Critical Flow Coverage".
- `docs/qa-profiles.md`: the `Q4` row and "Negative-flow applicability".
- `docs/qa-rules.md`; `docs/state-authority.md` (client state authority).
- `docs/critical-flow-registry.md`: rows `:39` and `:77`.
- Read-only context: `tasks/Archive/Sprint_82_kickoff_prompt_Task_882_Notification_Bell_Updates_Live.md` §4
  (the behaviours R4 preserves); `docs/sessions/evidence/task881/19c-manual-checks.txt`.
- `docs/orchestrator-procedures.md` → the 818/819 corollary (Node I/O and `git hash-object` witnesses for plants).

Do not read the UI bundles.

## 7. Scope — the exact allowed write set

1. `src/modules/notifications/hooks/useNotifications.ts`
2. `src/modules/notifications/hooks/__tests__/useNotifications.smoke.test.ts`
3. `docs/critical-flow-registry.md`: row `:77` only (R6)
4. `docs/sessions/2026-09-2?-task883-notification-bell-no-read-without-user.md` and `docs/sessions/evidence/task883/*`
5. `docs/backlog.md`: the 883 registry cell only

## 8. Out of scope

- `NotificationBell.tsx`, `NotificationBellView.tsx`, `Header.tsx` (its held-user window is Task 876's deliberate
  behaviour), every Story and every visual file.
- Grants, policies and RLS on `notifications`, including any re-grant to `anon`. 881's contract stands.
- `mutations.ts` and the mark-as-read server actions.
- Polling, pagination and `PAGE_SIZE`.

## 9. Current and required behavior

| Situation | Current | Required after |
|---|---|---|
| Signed in, bell mounts | one read, list shown, channel subscribed | **unchanged** |
| Signed in, tab becomes visible | one read | **unchanged** |
| Signed in, fetch returns `{ error }` | logged, list kept | **unchanged** (882 R4) |
| Signed in, user changes A → B | A's channel removed, B subscribed, B read | **unchanged**; a late A response is dropped (R3) |
| Sign-out window (bell mounted, `userId` null) | anonymous read → **401**, `[notifications] fetch failed`, A's list kept | **no read**, list `[]`, unread 0, no error log |
| `userId` null + tab becomes visible | anonymous read → 401 | **no read** |
| `userId` null + `refetch()` (`onRead`) | anonymous read → 401 | **no read** |
| A read for A resolves after A signed out | A's rows set into state | **dropped** |

## 10. Implementation requirements

### 10.1 I0 — before writing anything

1. Record `node.exe -p "process.platform + ' ' + process.version + ' ' + process.cwd()"`; it must start `win32`.
2. Save `git --no-optional-locks status --porcelain` to `docs/sessions/evidence/task883/01-status-before.txt`, plus the
   `git hash-object` of every path it lists as modified.
3. Re-read `useNotifications.ts:18-95` and the test file `:120-160`. If F3, F4 or F10 no longer hold, stop and report
   `PREMISE DRIFT`.
4. Baselines, before any edit: `npx.cmd vitest run src/modules/notifications` → `02-baseline-notifications.txt`, and
   `npm.cmd run test:header-hydration-id-parity` → `03-baseline-header-hydration.txt`. Both are expected to exit 0.

### 10.2 Order

I0 → R5 tests first. The new describe block and the rewritten `:124` test **fail** on the unchanged hook; save this as
`04-tests-red.txt`, the proof they can see the defect. → R1–R3 in the hook → the tests pass → plants → R6 → gate block
→ report.

### 10.3 Plants (two-armed, hash-witnessed, restored through the Edit tool or Node, never PowerShell `Get-Content -Raw`)

Each plant's evidence file contains the planted file's `git hash-object` before the plant, the test output with
`EXIT_CODE=`, and the hash after the restore. The two hashes must be equal.

| Plant | Edit in `useNotifications.ts` | Must fail | Evidence |
|---|---|---|---|
| **P1** (R1) | remove the null-`userId` early return from `fetchAll` | R5(a) and (c) (`fromSpy` called) | `05-plant-p1.txt` |
| **P2** (R2) | keep the early return but delete the state clear | R5(b) (`notifications` not `[]`) | `06-plant-p2.txt` |
| **P3** (R3) | remove the post-`await` user-id comparison | R5(d) | `07-plant-p3.txt` |

## 11. Positive and negative flows

**Positive flow.** A signed-in user opens the site: the bell loads, marks read, and a new notification appears live.
They sign out: the bell shows no rows during the held-user window and then unmounts. No request is made to
`notifications` without a session, and nothing is logged.

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Unauthenticated effect run (sign-out window) | **Yes** | R1, R2 | no read, state cleared | R5(b), AC2, O80-6 |
| Unauthenticated visibility / `refetch` | **Yes** | R1 | no read | R5(c), AC3 |
| Mount with no user | **Yes** | R1 | no read, no channel | R5(a), AC1 |
| Stale in-flight response | **Yes** | R3 | dropped | R5(d), AC4 |
| Signed-in fetch error | **Yes** | R4 | logged, list kept (unchanged) | existing 882 R4 test, AC5 |
| User change A → B | **Yes** | R4 | channel swap unchanged; late A response dropped | existing 882 R1 test + R5(d) |
| Validation (form/input) | No | no input | — | — |
| Locale / viewport | No | no string or layout change (§3.4) | — | — |
| Concurrent writer | No | client read path only | — | — |

## 12. Acceptance criteria

- **AC1 [R1, R5]** Given `mockUser = null` at mount, when the hook renders and one tick passes, then `fromSpy` and
  `channelSpy` were never called (R5(a)).
- **AC2 [R1, R2, R5]** Given a signed-in user with one loaded row, when the user becomes null and the hook re-renders,
  then `fromSpy`'s count does not increase, `notifications` is `[]`, `unreadCount` is 0, and `console.error` was not
  called (R5(b)).
- **AC3 [R1, R5]** Given `mockUser = null`, when `visibilitychange` fires to visible and `refetch()` is awaited, then
  `fromSpy` was never called (R5(c)).
- **AC4 [R3, R5]** Given a read for user A still pending, when A signs out and the read then resolves with one row, then
  `notifications` stays `[]` (R5(d)).
- **AC5 [R4]** Given the Task 596/882 tests other than the rewritten `:124` test, then each passes with its assertions
  unchanged. The test file's diff shows no removed or edited line inside them.
- **AC6 [R1–R3]** Given `04-tests-red.txt`, the new/rewritten tests fail on the unchanged hook. Under P1, P2 and P3 the
  named test fails (`05`–`07`). After each restore it passes, with equal hash witnesses.
- **AC7 [R6]** Given `git diff docs/critical-flow-registry.md`, then only row `:77`'s evidence/status cell changed.
- **AC8 [R7]** Given O80-6 (owner, after deploy), then the Network panel shows no `notifications?select` request after
  `logout`, the Console shows no `[notifications] fetch failed`, and the signed-in bell loads, marks read and updates
  live.
- **AC9 [all]** `npm.cmd run build` exits 0 on the final tree. `typecheck`, the notifications suite,
  `test:header-hydration-id-parity`, `check:file-integrity` and `check:mojibake` exit 0. `git status` shows no path
  outside §7.

`GR-4 AC AUDIT — 9 criteria; each states an observable property; absolutes: none.` AC5's "no removed or edited line"
is scoped to named tests whose assertions R4 requires unchanged; it is the preservation property itself, not a proxy.

## 13. QA profile and verification plan

**Q4.** Reasons: the hook is the data source of critical-flow rows `:39`/`:77` (§3.5), and the defect was found at a
security boundary (881's grants). Required evidence: baselines (I0.4), a red-then-green changed-behaviour test (AC6),
planted failures P1–P3, and the owner-native live check O80-6. No visual matrix: §3.4.

### 13.1 Re-entry

From scratch. Pre-existing read-only artifact: `docs/sessions/evidence/task881/19c-manual-checks.txt`.

### 13.2 Final gate block (executor, Windows PowerShell, project root)

Run the §10.3 plants first, by hand. Then:

```powershell
$ev = "docs\sessions\evidence\task883"
node.exe -p "process.platform + ' ' + process.version + ' ' + process.cwd()" | Tee-Object "$ev\08-platform.txt"
npx.cmd vitest run src/modules/notifications *>&1 | Tee-Object "$ev\09-notifications-suite.txt"
npm.cmd run test:header-hydration-id-parity *>&1 | Tee-Object "$ev\10-header-hydration.txt"
npm.cmd run typecheck *>&1 | Tee-Object "$ev\11-typecheck.txt"
npx.cmd eslint src\modules\notifications\hooks\useNotifications.ts src\modules\notifications\hooks\__tests__\useNotifications.smoke.test.ts *>&1 | Tee-Object "$ev\12-eslint.txt"
npm.cmd run check:file-integrity *>&1 | Tee-Object "$ev\13-check-file-integrity.txt"
npm.cmd run check:mojibake *>&1 | Tee-Object "$ev\14-check-mojibake.txt"
npm.cmd run build *>&1 | Tee-Object "$ev\15-build.txt"
git --no-optional-locks hash-object src\modules\notifications\hooks\useNotifications.ts src\modules\notifications\hooks\__tests__\useNotifications.smoke.test.ts docs\critical-flow-registry.md | Tee-Object "$ev\16-hash-object.txt"
git --no-optional-locks diff -- src\modules\notifications\hooks\__tests__\useNotifications.smoke.test.ts | Tee-Object "$ev\17-test-diff.txt"
git --no-optional-locks status --porcelain | Tee-Object "$ev\18-status-after.txt"
```

Append `EXIT_CODE=$LASTEXITCODE` after each command in the session log. Evidence files must be UTF-8 without BOM:
Windows PowerShell 5.1's `Tee-Object` writes UTF-16LE, so normalise each file through Node before
`check:file-integrity`. Stop any dev server before `build`.

Expected:

- `08` starts with `win32`.
- `09`, `10`, `11`, `13`, `14`, `15`: exit 0. `12`: no errors.
- `17`: added tests plus the rewritten `:124` test only (AC5).
- `18` vs `01`: no path outside §7.

### 13.3 Owner-native check O80-6 (after the approved change is deployed)

No command; browser steps on lero.al:

1. Open DevTools on the **Network** tab and filter by `notifications`. Sign in as a normal user and open the bell. It
   shows the list, and one `notifications?select` request returns 200.
2. Mark one notification read. From a second account, trigger a notification to the first, for example by reporting
   one of its listings. It appears without a reload.
3. Sign out. **Expected:** no new `notifications?select` request appears after `logout`. The **Console** tab shows no
   `[notifications] fetch failed`.

Return: a screenshot of the Network panel after step 3 and a yes/no for the Console line.

## 14. Completion report contract

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`. Never self-approved.

- The changed files with their `16-hash-object.txt` values.
- Requirement IDs completed.
- Every command in §10.1, §10.3 and §13.2 with its real exit code and evidence path.
- `04-tests-red.txt` quoted (which tests failed, and why).
- The plant table with its hash pairs.
- The test-file diff summary (AC5).
- Assumptions, deviations, limitations, and any `PREMISE DRIFT` / `SCOPE DRIFT` stop.
- O80-6 stated as owed, never as done.

Sonnet updates the 883 cell of the `docs/backlog.md` registry row (state only). It writes the session log with a
"Files Changed" table matching the real diff, and emits no git command.

## 15. Task quality gate

| Check | Result |
|---|---|
| Executable without chat context | Yes: cause chain (§3.2), exact test edits (R5), plants (§10.3), owner steps (§13.3) |
| One active route | Yes: Appendix C |
| Every requirement has a binary AC and a verification | R1→AC1–AC3 · R2→AC2 · R3→AC4 · R4→AC5 · R5→AC1–AC4, AC6 · R6→AC7 · R7→AC8 · all→AC9 |
| Two-armed control that can demonstrably fail | the red-first run (`04`), plus P1–P3 each against a named test |
| Detector blind spot stated | The hook test mocks the client: it proves no `from()` call is made, not what PostgREST would answer (881's probe owns that). It cannot see a read made outside this hook; F5's grep shows none exists. O80-6 is the live proof |
| Material absence claims traced | "Only consumer of `refetch`": `git grep useNotifications` over non-test `src`, one hit (`NotificationBell.tsx:3,7,13`). "Bell mounted while `userId` null": `Header.tsx:24-30,78` + `useUser.ts:4-6` |
| Dirty worktree handled | Clean at design time (881 committed and pushed; `origin/main...HEAD` = 0 0); I0 snapshot anyway |
| No owner exception claimed | None needed. §3.4's classification follows 882's precedent with evidence |

---

## Appendix A — Evidence preflight (task design)

| Field | Value |
|---|---|
| Mode | `TASK DESIGN` |
| Execution state | `from-scratch` |
| Exact start step | §10.1 I0 |
| Reused artifacts | `docs/sessions/evidence/task881/19c-manual-checks.txt` (read-only) |
| Owner decision required? | no |

| Claim | Source inspected | Status |
|---|---|---|
| 401 on sign-out, live | owner Network screenshot, transcribed in 881 `19c` | VERIFIED |
| Read issued before the `userId` guard | `useNotifications.ts:39-42` | VERIFIED |
| Visibility and `refetch` paths ungated | `:83-95`, `NotificationBell.tsx:7,13` | VERIFIED |
| Bell mounted while hook user null | `Header.tsx:24-30,78`, `useUser.ts:4-6` | VERIFIED |
| Existing test pins the defect | test `:124-131` waits for `limitSpy` with `mockUser = null` | VERIFIED |
| Stale response can repopulate | `:20-37` has no post-`await` check | VERIFIED as a code path; live occurrence UNKNOWN |
| Empty state already a proven Story state | `NotificationBellView.stories.tsx:73`, `unreadCount={0}` at `:99`, `:111` | VERIFIED |

## Appendix B — Rule-compliance ledger

| Rule source and clause | Applicability | Mandatory outcome | Evidence | Result |
|---|---|---|---|---|
| `agent-contract` 3, 5 | bell behaviour | signed-in capabilities preserved | R4, AC5 | COMPLIANT |
| `agent-contract` 9 | non-Q0 | `npm run build` exit 0 | `15-build.txt` | COMPLIANT |
| `agent-contract` 14 | new evidence files, plants | UTF-8 no BOM; Node I/O; hash witnesses | §10.3, §13.2 | COMPLIANT |
| `agent-contract` 15 + registry `:39`, `:77` | critical flows | automated regression + recorded command | §13.2 `09`, `10`; R6 | COMPLIANT |
| `qa-profiles.md` Q4 | critical flow | baseline + changed-behaviour test + planted failure + owner-native | I0.4, AC6, P1–P3, O80-6 | COMPLIANT |
| GR-0 / GR-1 / GR-3 / GR-3a | UI rules | — | NOT APPLICABLE, §3.4 | NOT APPLICABLE |
| Task 881 grant contract | neighbouring scope | no re-grant | §8 | COMPLIANT |

## Appendix C — Execution contract

| Field | Value |
|---|---|
| Task | 883 |
| Active route | single route: red tests → hook guard + clear + stale-drop → plants → registry note; owner checks live after deploy |
| Decision source | Task 881 review 4, finding F3 (ledger cited in the header) |
| Starting worktree mode | clean at design time; I0 snapshot regardless |
| Exact allowed final write set | §7 |
| Blocked rule or decision | none |

| # | Checkpoint | Producer → artifact | Comparator / failure |
|---|---|---|---|
| 0 | Platform + status | I0.1–2 → `01`, `08` | not `win32` → stop |
| 1 | Premise | I0.3 | F3/F4/F10 drifted → `PREMISE DRIFT` |
| 2 | Baselines | I0.4 → `02`, `03` | red → recorded, not fixed |
| 3 | Red-first | R5 on the unchanged hook → `04` | new tests pass before the fix → the tests cannot see the defect → fix the tests |
| 4 | Plants | §10.3 → `05`–`07` | a plant passes → a test defect |
| 5 | Gates | §13.2 → `08`–`18` | any non-zero → `PARTIALLY IMPLEMENTED` |
| 6 | Owner live | O80-6 | a request after `logout` or the Console line → finding |
