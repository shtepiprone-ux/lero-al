# Task 882 — the notification bell updates live, without a page reload

Sprint 82 · **P1** · QA profile **Q4** (live delivery depends on the signed-in user's JWT passing RLS on the Realtime
path; the change touches the header bell's data hook, which carries critical-flow rows `:39` and `:77`) · owner decision
**D82-7** · owner actions **O82-4**, **O82-5** · **Status: 📝 KICKOFF FILED 2026-09-24**

Sprint plan: [`Sprint_82_Notifications_That_Were_Never_Delivered.md`](Sprint_82_Notifications_That_Were_Never_Delivered.md).
Independent of 878 and 880: no shared file.

## 1. Mode and task type

`IMPLEMENTATION` — client data hook plus an owner-run live probe. It makes no UI chrome change and no schema change.

## 2. Objective

A signed-in user sees a new notification appear in the header bell **without reloading the page**. The owner, D82-7,
verbatim: *"на Lero.al сповіщення приходе швидко, але треба перезавантажувати стоірнку, що не зручно. Сповіщення мають
приходити без перезавантаження сторінки"*. The subscription must also never fail silently again.

## 3. Verified context — measured 2026-09-24

- **F1 (FACT, owner-observed on lero.al, 2026-09-24).** A new notification appears only after a manual reload.
- **F2 (FACT).** `src/modules/notifications/hooks/useNotifications.ts`:
  - on mount, it calls `fetchAll()`, a `select … order(created_at desc) limit(30)` whose `error` is discarded;
  - it subscribes with `supabase.channel('user-notifications').on('postgres_changes', { event: '*', schema: 'public',
    table: 'notifications' }, () => fetchAll()).subscribe()`;
  - that subscription has **no `filter`**, **no status callback** (a `CHANNEL_ERROR`, `TIMED_OUT` or `CLOSED` is never
    seen), is **not** tied to the signed-in user, and does **no** refetch on reconnect or when the tab regains focus.

  The only consumer is `NotificationBell.tsx`, the container rendered once by `Header.tsx:78` when `headerUser` is set.
- **F3 (FACT).** `src/lib/supabase/client.ts` returns a **singleton** `createBrowserClient` (`@supabase/ssr` 0.10.3,
  `@supabase/supabase-js` / `realtime-js` 2.105.4). The signed-in user is available from `useAuth().user`
  (`src/modules/auth/context/AuthContext.tsx:58`).
- **F4 (FACT, live DB, owner-run 2026-09-24).**
  - `notifications` is in the `supabase_realtime` publication;
  - `authenticated` holds `SELECT`;
  - SELECT policies are `auth.uid() = user_id`.
- **F5 (FACT, reviewer probe 2026-09-24, win32).** An anonymous `postgres_changes` channel on `public.notifications`,
  joined with the public anon key, reaches **`SUBSCRIBED`**. Realtime is enabled for the project and does not reject a
  public channel. That probe script had a recursion bug in its own cleanup (`removeChannel` inside the status
  callback), so only its first status line is evidence.
- **F6 (UNKNOWN, measured by I0 below).** Whether an **authenticated** subscriber receives an INSERT on its own row, and
  with which subscription shape. No agent can sign in as a production user, so the owner runs the probe (O82-4). The
  fix below is written to be correct whatever the answer. The probe tells the review whether it was sufficient.
- **F7 (FACT).** Existing tests:
  - `src/modules/notifications/hooks/__tests__/useNotifications.smoke.test.ts` (Task 596) mocks
    `from/select/order/limit` and `channel/on/subscribe/removeChannel`, and asserts the `.select()` column string
    (critical-flow row `:77`). It must keep passing, extended, never weakened;
  - `src/components/layout/__tests__/header-hydration-id-parity.test.tsx` (row `:39`).

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | D82-7, F2, F3 | `useNotifications` takes the signed-in user id from `useAuth()`. It does **not** subscribe while there is no user. When the id is known, it subscribes to `postgres_changes` on `public.notifications` with `filter: 'user_id=eq.<id>'`, on a channel name that includes the id. When the id changes or goes away, it removes the channel. | P1 | AC1 | Confirmed |
| **R2** | F2 | The subscription passes a status callback. `SUBSCRIBED` after any earlier non-`SUBSCRIBED` state triggers one `fetchAll()`, so events missed while disconnected are recovered. `CHANNEL_ERROR`, `TIMED_OUT` and `CLOSED` (other than the hook's own cleanup) are logged with `console.warn('[notifications] realtime <status>', err)` and are never swallowed. | P1 | AC2 | Confirmed |
| **R3** | F1 | When the document becomes visible again (`visibilitychange` → `visible`), the hook calls `fetchAll()` once. The listener is removed on unmount. | P2 | AC3 | Confirmed |
| **R4** | F2 | `fetchAll()` logs a failed query with `console.error('[notifications] fetch failed', error)` and keeps the previous list instead of replacing it with `[]`. The `.select()` column string is unchanged. | P2 | AC4 | Confirmed |
| **R5** | F6 | `scripts/task-882-realtime-probe.mjs` is owner-run and never in CI. It reads `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` from `.env.local`, and `PROBE_EMAIL`/`PROBE_PASSWORD` from the process environment. It never prints secrets, and the credentials are never committed. **Arm A:** sign in as the probe user, subscribe exactly as R1 does, insert one notification for that user through the service role (`type 'marketing'`, `title '[task-882 probe]'`), wait up to 10 s for the INSERT event, and record the latency. **Arm B:** an anonymous client with the same filter must **not** receive it within 10 s. Always delete the probe row in `finally`. Exit 0 when A arrives and B does not, 1 otherwise, 2 on a setup error. Print `ARM A <ms|MISSING>` and `ARM B <none|RECEIVED>`. Clean up channels outside the status callback (see F5). | P1 | AC5, O82-4 | Confirmed |

## 5. Assumptions and open questions

1. **STOP condition, not a second route.** If O82-4's Arm A reports `MISSING` against the **shipped** R1 code, Realtime
   does not deliver to an authenticated subscriber on this project. The task then stops with
   `STOP — OWNER DECISION REQUIRED`, and the choice becomes (a) investigate Supabase's Realtime settings, or (b) add a
   polling interval. Polling is not built now.
2. Sprint 82 hosts this task: its goal is notifications actually reaching the user.

## 6. Pre-read rule bundle

- `docs/golden-rules.md`: GR-0 to GR-6.
- `docs/agent-contract.md`: clauses 1, 3, 5, 6a, 9, 14, 15.
- `docs/state-authority.md`: client state versus the server.
- `docs/data-access-rules.md`: browser client, and no service role in client code.
- `docs/qa-rules.md` and `docs/qa-profiles.md` (Q4).
- `docs/critical-flow-registry.md`: rows `:39` and `:77`.

## 7. Scope

- `src/modules/notifications/hooks/useNotifications.ts`: R1–R4
- `src/modules/notifications/hooks/__tests__/useNotifications.smoke.test.ts`: extend it
- `scripts/task-882-realtime-probe.mjs` (new): R5
- `docs/critical-flow-registry.md`: row `:77`, adding the live-update behavior and the new tests
- `docs/sessions/2026-09-2?-task882-*.md`, `docs/sessions/evidence/task882/**`, and `docs/backlog.md` (the 882 state
  only)

## 8. Out of scope

- `NotificationBell.tsx`, `NotificationBellView.tsx` and every visual file. There is no visible change, so no Story
  work is needed; GR-1 does not apply because no rendered chrome changes.
- Grants and RLS (**881**), notification producers (**880**), and polling (§5.1).

## 9. Current and required behavior

| | Current | Required |
|---|---|---|
| New notification while the page is open | appears only after a reload | appears without a reload |
| Realtime join failure | silent | logged with its status |
| Missed events during a disconnect or a hidden tab | lost until reload | recovered by one refetch |
| Failed fetch | list silently becomes empty | error logged, previous list kept |
| Signed out | subscription opened anyway | no subscription |

## 10. Implementation requirements

### 10.1 I0

1. Record the platform (`win32`), `git status --porcelain`, and a hash of every ` M` path → `00-i0.txt`.
2. Read F2 and F7 at their current lines.

### 10.2 Tests (extend `useNotifications.smoke.test.ts`; mock `useAuth`)

- No user: `channel` is never called.
- With a user: `channel` is called with a name containing the id, and `on` is called with
  `filter: 'user_id=eq.<id>'`.
- The user changes from A to B: `removeChannel` is called for A's channel and a new one is created for B.
- The status sequence `CHANNEL_ERROR` → `SUBSCRIBED`: `console.warn` fires once, and `fetchAll` (the `from` spy) runs
  once more after `SUBSCRIBED`.
- `visibilitychange` to `visible`: one extra fetch. After unmount: none.
- A fetch returning `{ error }`: `console.error` is called and the previously loaded rows are kept.
- The Task 596 `.select()` assertion is unchanged and passes.

**Planted proof:**
1. Drop the `filter` option: the filter test fails.
2. Drop the `SUBSCRIBED` refetch: the reconnect test fails.

Restore both through Node `fs`, and record a `git hash-object` before and after for each file.

### 10.3 Rules

- No service-role key in client code. The probe is a Node script only.
- UTF-8 without BOM.
- Record every exit code as `$LASTEXITCODE` immediately after its command, written BOM-free.

## 11. Positive and negative flows

**Positive.** A user is on any page. A moderator resolves their report, and the bell's count and list update within
seconds, with no reload.

| Branch | Applicable | Expected | Evidence |
|---|---:|---|---|
| Signed out | Yes | no channel | AC1 |
| User switches account in the same tab | Yes | old channel removed, new one scoped to the new user | AC1 |
| Realtime error or timeout | Yes | warned; refetch on the next `SUBSCRIBED` | AC2 |
| Tab hidden while an event arrives | Yes | refetch on visible | AC3 |
| Fetch error | Yes | logged, list kept | AC4 |
| Another user's notification | Yes | not delivered: the filter plus RLS | AC5 arm B |
| Realtime does not deliver at all | Yes | STOP, owner decision (§5.1) | O82-4 |

## 12. Acceptance criteria

- **AC1 [R1]** Given the §10.2 tests, when run, then the no-user, filter and user-switch assertions pass, and plant 1
  fails.
- **AC2 [R2]** Given the status-sequence test, when run, then it passes, and plant 2 fails.
- **AC3 [R3]** Given the visibility test, when run, then it passes.
- **AC4 [R4]** Given the fetch-error test and the unchanged Task 596 assertion, when run, then both pass.
- **AC5 [R5]** Given O82-4's transcript, when read, then `ARM A` shows a latency (not `MISSING`), `ARM B` shows `none`,
  the exit code is 0, and the script reports the probe row deleted.
- **AC6 [all]** Given the §13.2 block, when run, then every command exits 0, and the final status lists no path outside
  §7 beyond `00-i0.txt`.
- **AC7 [Objective] — owner (O82-5), after deploy:** with two browsers, a notification appears in the receiving user's
  bell without a reload.

`GR-4 AC AUDIT — 7 criteria; each states an observable property; absolutes: none — AC5's 10 s is the probe's stated wait window, not a latency promise.`

## 13. QA profile and verification plan

**Q4:** the live-delivery proof needs a real authenticated subscriber on the production project (O82-4) and a
two-armed test plant.

### 13.1 Re-entry

From scratch. Evidence root: `docs/sessions/evidence/task882/`.

### 13.2 Gate block (executor, Windows PowerShell, project root)

```powershell
$ev = "docs\sessions\evidence\task882"
node.exe -p "process.platform + ' ' + process.version"
npx.cmd vitest run src/modules/notifications
npx.cmd vitest run src/components/layout/__tests__/header-hydration-id-parity.test.tsx
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
npm.cmd run build
git --no-optional-locks hash-object src/modules/notifications/hooks/useNotifications.ts src/modules/notifications/hooks/__tests__/useNotifications.smoke.test.ts scripts/task-882-realtime-probe.mjs
git --no-optional-locks status --porcelain
```

Write each command's output to `$ev\NN-<name>.txt` through the BOM-free writer
`[System.IO.File]::WriteAllText(path, text, (New-Object System.Text.UTF8Encoding $false))`, and append
`EXIT_CODE=$LASTEXITCODE` taken immediately after each command. Expected: every command exits 0.

### 13.3 Owner steps

**O82-4: live probe, after the executor reports, before approval.** Sign in with a **test** account, never a real
user's. Run from the project root:

```powershell
$env:PROBE_EMAIL = "test-account-2@example.com"
$env:PROBE_PASSWORD = "the-test-account-password"
node.exe scripts\task-882-realtime-probe.mjs
Remove-Item Env:PROBE_EMAIL, Env:PROBE_PASSWORD
```

Replace the two values in the first two lines with the test account's own. Expected:
- `ARM A <number> ms`;
- `ARM B none`;
- `probe row deleted`;
- exit 0.

Return the whole output. If it shows `ARM A MISSING`, the task stops for your decision (§5.1).

**O82-5: after deploy, on lero.al.**
1. Sign in as account 2 in one browser and leave any page open.
2. In another browser, as a moderator, resolve a report that account 1 filed on account 2's listing.
3. Within a few seconds, and **without a reload**, account 2's bell shows the new notification.

## 14. Completion report contract

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`. Never self-approve.

Report:
- changed files with their hashes;
- R1–R5 and AC1–AC4 and AC6 (AC5 and AC7 = `MISSING EVIDENCE`, owed by the owner);
- every command with its exit code;
- both plants.

Update the 882 backlog state cell and write the session log.

## 15. Task quality gate

| Check | Result |
|---|---|
| Root cause | F2 is measured (unfiltered, statusless, user-agnostic subscription with no recovery). F6 is **UNKNOWN** and is closed by O82-4 against the shipped code, not assumed |
| Two-armed controls | two test plants (§10.2); the probe's arm A (delivered) versus arm B (anonymous, not delivered) |
| Single route | yes; §5.1 is a STOP condition, not a second implementation |
| Critical flows | row `:77`'s Task 596 assertion preserved; row `:39`'s hydration test in the gate block |
| Secrets | the probe reads them from `.env.local` and the process environment, prints none, and commits none |
| GR-1 | not applicable: no visible surface changes (§8) |
