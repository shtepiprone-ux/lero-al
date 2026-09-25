# Task 860 — changing your email works again: the email-change sender stops throwing on an invalid time zone

Sprint 78 (hosted by discovery, not goal fit; the owner may move it) · **P1** · QA profile **Q4** (critical flow
"Email change", account lifecycle) · no dependencies · **Status: `KICKOFF FILED` 2026-09-25**

Sprint plan: [`Sprint_78_Admin_And_Agent_Dashboards_On_Canonical_Mantine.md`](Sprint_78_Admin_And_Agent_Dashboards_On_Canonical_Mantine.md).
Reserved 2026-09-18 while designing Task 846; the reserved row's text moves into §3.

## 1. Mode and task type

`IMPLEMENTATION`. A one-line server fix with its regression test, plus one repository-wide guard test. Bundles:
**Auth / Email / Account Lifecycle**, **Regression / Critical Flow Coverage**. No UI, no Story, no locale key, no
schema. GR-0/1/3/3a are not applicable: nothing visible in the app changes. The only visible effect is the timestamp
text inside one email (§9).

## 2. Objective

1. `sendEmailChangeEmails` never throws on its timestamp. The verification email reaches the new address, and the
   security notice reaches the old one.
2. Its timestamp is the Tirana wall clock from the project's canonical zone constant and formatter, not a hand-typed
   zone id.
3. A test fails if any source file in `src/` passes an invalid IANA time-zone id, so the same typo cannot come back
   anywhere.

## 3. Verified context — measured 2026-09-25 (re-measure at I0)

- **F1 FACT — the defect, reproduced natively today.** `src/modules/notifications/lib/emails/emailChange.ts:177`:
  `new Date().toLocaleString('en-GB', { timeZone: 'Europe/Tirana' })`.
  - `win32`, Node `v22.22.3`, ICU `78.2`, tz `2026a`: `'Europe/Tirana'` → `RangeError: Invalid time zone specified:
    Europe/Tirana`; `'Europe/Tirane'` → `29/03/2026, 01:30:00`.
  - Line 177 is the second statement of `sendEmailChangeEmails` (`:166`), so the function throws before either
    `sendEmail` call (`:187-198`).
- **F2 FACT — no caller catches it.** Both callers are in `src/modules/cabinet/actions/index.ts`, and each `await`s
  the sender with no `try`:
  - `initiateEmailChange`, `:383`. Before the call it has already inserted an `email_change_tokens` row (`:358-363`)
    and set `users.pending_email` (`:371`).
  - `resendEmailVerification`, `:435`. Before the call it has already **rotated the token hash** of the active token
    (`:422-425`).
- **F3 INFERENCE (F1, F2).**
  - Every "change email" attempt ends in a rejected server action. No verification email and no security notice are
    sent, yet a pending token exists and the attempt counts against the 3-per-hour limit (`:331-334`).
  - Every "resend" attempt invalidates the previous link and sends no new one.
  - The flow cannot complete. How many real users hit it is **UNKNOWN** (see §13.3, optional log check).
- **F4 FACT — why every suite stayed green.** The module is mocked wholesale by both tests that import its callers:
  `src/modules/cabinet/actions/__tests__/deleteOwnAccount.smoke.test.ts:57` and
  `src/modules/__tests__/rls-write-guards.smoke.test.ts:68`. No test imports the real `emailChange.ts`.
- **F5 FACT — the canonical sources already exist.**
  - `src/lib/dashboard/period.ts:20` has `export const TIRANE_TZ = 'Europe/Tirane'`. Its doc comment (`:4`) says
    `Europe/Tirana` is rejected by the runtime.
  - `src/lib/formatters.ts` has `formatDateTimeInZone(dateStr, locale, timeZone)`, the zone-aware formatter from Task
    846. It uses the per-locale layout, is documented as server-only, and **returns `'—'` on an invalid zone and never
    throws**.
  - `period.ts` imports only from `@/lib/formatters` (`:18`), so importing `TIRANE_TZ` from a server email module
    pulls in nothing client-side.
- **F6 FACT — every other zone id in `src` is valid.** `git grep -n "timeZone\|Europe/Tiran" -- src ':!*.test.*'`
  finds, besides F1, only `'Europe/Tirane'`:
  - `PasswordChangedEmail.tsx:22,29`;
  - `TIRANE_TZ`, and a `timeZone` parameter in `formatters.ts:175-182`;
  - comments and docs.
- **F7 FACT — the critical flow.** `docs/critical-flow-registry.md:37` is "Email change"
  (`initiateEmailChange`/`consumeEmailChangeToken` → `/auth/confirm-email`, Task 441). Its tests cover token
  consumption only, with the sender mocked. CI runs `npm run test:auth` (`.github/workflows/governance-pr.yml:68`).

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | F1, F5 | `emailChange.ts:177` becomes `const timestamp = formatDateTimeInZone(new Date().toISOString(), 'sq', TIRANE_TZ)`, importing `TIRANE_TZ` from `@/lib/dashboard/period` and `formatDateTimeInZone` from `@/lib/formatters`. `'sq'` because the email is Albanian-only (Task 251, the comment at `:175-176`). No other line in the file changes. | P0 | AC1, AC2 | Confirmed |
| **R2** | F4 | New `src/modules/notifications/lib/emails/__tests__/emailChange.test.ts` imports the **real** `emailChange.ts`. It mocks only `./send` (`sendEmail` resolves `{ error: null }`) and fixes the clock with `vi.setSystemTime(new Date('2026-03-29T00:30:00Z'))`. **T1:** `sendEmailChangeEmails({...})` resolves (does not reject); `sendEmail` is called twice, once `to: newEmail` and once `to: oldEmail`; the security email's `html` contains the literal **`29.03.2026, 01:30 p.d.`**. That is the value of `formatDateTimeInZone('2026-03-29T00:30:00.000Z', 'sq', 'Europe/Tirane')`, measured by the orchestrator on 2026-09-25 (win32, Node 22.22.3, ICU 78.2). The test asserts the literal, not a re-computation. **T2:** with `ip` and a mobile `userAgent`, the security html contains the device hint (`Mobile`). T2 pins the rest of the function unchanged. | P0 | AC2, AC4 | Confirmed |
| **R3** | F6 | New `src/lib/__tests__/timezone-literals.test.ts`. It reads every `src/**/*.{ts,tsx}` file that is not a test, not a story and not under `__tests__`, through `fs`. It collects every quoted string matching `/(['"])((?:Africa\|America\|Antarctica\|Asia\|Atlantic\|Australia\|Europe\|Indian\|Pacific)\/[A-Za-z_\-+/]+)\1/g`, and asserts that `new Intl.DateTimeFormat('en-US', { timeZone: id })` does not throw for each. It fails naming the file and the id. It also asserts that at least one id was found (`'Europe/Tirane'`), so an empty scan cannot pass. | P1 | AC3, AC4 | Confirmed |
| **R4** | F7 | `package.json` `test:auth` gains both new test files, so CI runs them. `docs/critical-flow-registry.md` row "Email change" (`:37`) gets the two files in its command cell and one coverage note: *"Task 860: the real sender is exercised (was mocked everywhere); an invalid zone id fails R3's repo-wide guard."* No other cell changes. | P1 | AC5 | Confirmed |

## 5. Assumptions and open questions

1. **The timestamp text changes format**, from `en-GB` (`29/03/2026, 01:30:00`) to the project's `sq` layout from
   `formatDateTimeInZone` (`29.03.2026, 01:30 p.d.`, measured).
   **Owner decision 2026-09-25, verbatim: *"у Європі ми використовуємо 24 години, а не 12 годин!"*.** The 12-hour `p.d.` comes from the canonical `sq` layout that every date on the site shares, so the
   switch is made once, in **Task 885**, right after this task. 860 keeps using the canonical formatter unchanged, and
   T1 asserts today's literal. 885 flips the layout and updates T1's literal together with the other 12-hour
   assertions. 860 does not add a private 24-hour format: that would fork the canonical layout. The email is Albanian-only, so the Albanian layout is the consistent one. §9 records the
   change, and §13.3 has the owner read one real email.
2. **Not in scope, recorded:** rolling back the pending token when a send fails, and surfacing a send failure to the
   user. Today `sendEmailChangeEmails` logs `sendEmail` errors and returns (`:200-205`). After R1 it has no other
   throw path the callers must handle. A behaviour change there would be its own number if the owner wants one.
3. **Users caught by the bug** already hold a pending token and `pending_email`. After the fix, "resend" sends a
   working link (`resendEmailVerification` rotates the token and now reaches `sendEmail`). No data repair is needed.

## 6. Pre-read rule bundle

- `docs/golden-rules.md`: GR-2, GR-4, GR-5, GR-6.
- `docs/agent-contract.md`: clauses 1, 3, 9, 10, 14, 15.
- `docs/rule-index.md`: "Auth / Email / Account Lifecycle", "Regression / Critical Flow Coverage".
- `docs/qa-profiles.md`: `Q4`. `docs/qa-rules.md`. `docs/integrations.md` → "Email Template Architecture".
- `docs/critical-flow-registry.md`: row "Email change".
- `docs/orchestrator-procedures.md` → the 818/819 corollary (Node I/O, hash witnesses).

## 7. Scope — the exact allowed write set

1. `src/modules/notifications/lib/emails/emailChange.ts` (R1 only)
2. `src/modules/notifications/lib/emails/__tests__/emailChange.test.ts` (new)
3. `src/lib/__tests__/timezone-literals.test.ts` (new)
4. `package.json`: the `test:auth` string only
5. `docs/critical-flow-registry.md`: the "Email change" row only
6. `docs/sessions/2026-09-2?-task860-email-change-timezone.md`, `docs/sessions/evidence/task860/*`
7. `docs/backlog.md`: the 860 registry cell only

## 8. Out of scope

- `src/modules/cabinet/actions/index.ts` and its error handling (§5.2).
- `PasswordChangedEmail.tsx` (its literal is valid, and R3 guards it), converting `emailChange.ts` to React Email,
  and any email copy.
- `period.ts` and `formatters.ts` (consumed, not changed).

## 9. Current and required behavior

| Situation | Current | Required after |
|---|---|---|
| User requests an email change | action rejects with `RangeError`; no email sent; pending token and `pending_email` written | both emails sent; `{ pendingEmail }` returned |
| User presses "resend" | token rotated, action rejects, no email — the old link is dead | a new link is emailed |
| Security notice timestamp | never rendered | Tirana wall clock in the `sq` layout (**format changed**, §5.1) |
| Verification email content, link, subject | never sent | unchanged from the template |
| `sendEmail` itself fails | logged, function returns | unchanged |

## 10. Implementation requirements

### 10.1 I0

1. `node.exe -p "process.platform + ' ' + process.version + ' ' + process.versions.icu"` → must start `win32`.
2. `git --no-optional-locks status --porcelain` → `01-status-before.txt`, plus the hash of each modified path.
3. Reproduce F1: `node.exe -e "try{new Date().toLocaleString('en-GB',{timeZone:'Europe/Tirana'});console.log('NO THROW')}catch(e){console.log(e.name+': '+e.message)}"`
   → `02-repro.txt`. Expected: `RangeError: …Europe/Tirana`. If it does **not** throw, stop and report
   `PREMISE DRIFT` with the ICU version.
4. `git --no-optional-locks grep -n "timeZone\|Europe/Tiran" -- src ':!*.test.*'` → `03-zone-literals.txt`. Any
   invalid id other than F1's is listed in the report and handled by R3 (it must fail on it). Do not fix it silently.
5. Baseline: `npm.cmd run test:auth` → `04-test-auth-before.txt` (exit 0 expected).

### 10.2 Order

I0 → R2 and R3 written first and run against the **unchanged** source → `05-red.txt`. T1 must fail with the
`RangeError`; R3 must fail naming `emailChange.ts` and `Europe/Tirana`. → R1 → both green → plants → R4 → gates →
report.

### 10.3 Plants (each file holds the planted file's hash before the plant and after the restore)

| Plant | Edit | Must fail | Evidence |
|---|---|---|---|
| **P1** | `emailChange.ts`: pass `'Europe/Tirana'` instead of `TIRANE_TZ` | R3 names `emailChange.ts`. T1 also fails: the safe formatter returns `'—'` (measured), so the `01:30` literal is absent | `06-plant-p1.txt` |
| **P2** | `PasswordChangedEmail.tsx:22`: `'Europe/Tirane'` → `'Europe/Kyev'` | R3 names `PasswordChangedEmail.tsx` and `Europe/Kyev` | `07-plant-p2.txt` |
| **P3** | `emailChange.ts`: restore the original `toLocaleString('en-GB', { timeZone: 'Europe/Tirana' })` line | T1 rejects with `RangeError` | `08-plant-p3.txt` |

P1 shows why both tests exist. The safe formatter turns a bad id into a silent `'—'` in the email, not an exception. T1 catches that for this sender, and R3 catches it for every file.

## 11. Positive and negative flows

**Positive.** A signed-in user requests a new email address. The new address receives the verification link, the
old address receives the security notice with the Tirana time, and the action returns the pending email. Following
the link completes the change (Task 441's path, unchanged).

| Branch | Applicable? | Owner/source | Expected | Evidence |
|---|---:|---|---|---|
| Invalid zone id anywhere in `src` | **Yes** | R3 | test fails naming file and id | R3, P1, P2 |
| Old buggy line restored | **Yes** | R2 | T1 rejects | P3 |
| `sendEmail` returns an error | **Yes** | unchanged | logged, resolves | existing code, §9 |
| Rate limit / same email / taken email | No | unchanged caller branches before the sender (`index.ts:331-351`) | — | `test:auth` baseline |
| Token consumption / expiry | No | Task 441, unchanged | — | registry row tests |
| Locale / viewport | No | no UI | — | — |

## 12. Acceptance criteria

- **AC1 [R1]** Given `git diff src/modules/notifications/lib/emails/emailChange.ts`, the only changes are the two
  imports and line 177, now `formatDateTimeInZone(new Date().toISOString(), 'sq', TIRANE_TZ)`. No `'Europe/Tirana'`
  string remains in the file.
- **AC2 [R2]** Given T1 and T2 on the final tree, `sendEmailChangeEmails` resolves, sends both emails, and the
  security html contains the quoted Tirana timestamp (`01:30`) and the device hint.
- **AC3 [R3]** Given the guard, it finds at least one id, every found id is valid on the final tree, and it fails
  naming file and id under P1 and P2.
- **AC4 [R2, R3]** Given `05-red.txt`, T1 and R3 fail on the unchanged source. Given `06`–`08`, each plant fails
  its named test and passes after restore, with equal hashes.
- **AC5 [R4]** Given `package.json`, `test:auth` lists both new files, and `npm.cmd run test:auth` exits 0 naming
  them. Given the registry diff, only the "Email change" row's command and coverage cells changed.
- **AC6 [all]** `npm.cmd run build` exits 0. `typecheck`, `lint`, `check:file-integrity` and `check:mojibake` exit 0.
  `git status` shows no path outside §7.

`GR-4 AC AUDIT — 6 criteria; each states an observable property; absolutes: none.` (AC1's "only changes" is the
one-file diff that is the deliverable.)

## 13. QA profile and verification plan

**Q4.** Reasons: a registered critical flow (account lifecycle) is broken in production. Required evidence: the
baseline, red-then-green tests, planted failures, the build, and an owner-native check after deploy.

### 13.1 Re-entry

From scratch.

### 13.2 Final gate block (executor, Windows PowerShell, project root)

Plants first, by hand. Then:

```powershell
$ev = "docs\sessions\evidence\task860"
node.exe -p "process.platform + ' ' + process.version + ' ' + process.cwd()" | Tee-Object "$ev\09-platform.txt"
npx.cmd vitest run src/modules/notifications/lib/emails/__tests__/emailChange.test.ts src/lib/__tests__/timezone-literals.test.ts *>&1 | Tee-Object "$ev\10-new-tests.txt"
npm.cmd run test:auth *>&1 | Tee-Object "$ev\11-test-auth.txt"
npm.cmd run test:rls-guards *>&1 | Tee-Object "$ev\12-test-rls-guards.txt"
npm.cmd run typecheck *>&1 | Tee-Object "$ev\13-typecheck.txt"
npm.cmd run lint *>&1 | Tee-Object "$ev\14-lint.txt"
npm.cmd run check:file-integrity *>&1 | Tee-Object "$ev\15-file-integrity.txt"
npm.cmd run check:mojibake *>&1 | Tee-Object "$ev\16-mojibake.txt"
npm.cmd run build *>&1 | Tee-Object "$ev\17-build.txt"
git --no-optional-locks hash-object src\modules\notifications\lib\emails\emailChange.ts src\modules\notifications\lib\emails\__tests__\emailChange.test.ts src\lib\__tests__\timezone-literals.test.ts package.json docs\critical-flow-registry.md | Tee-Object "$ev\18-hash-object.txt"
git --no-optional-locks status --porcelain | Tee-Object "$ev\19-status-after.txt"
```

Append `EXIT_CODE=$LASTEXITCODE` after each command. Normalise the `Tee-Object` files (UTF-16LE on Windows
PowerShell 5.1) to UTF-8 without BOM through Node, line for line, before `check:file-integrity`. Stop any running
Next server before `build`.

Expected:
- `09` starts with `win32`.
- `10`–`17`: exit 0.
- `19`: no path outside §7.

### 13.3 Owner-native checks (after the approved change is deployed)

1. On lero.al, signed in with a **test** account, change the email to a second address you control. The new address
   gets the verification email, and the old one gets the security notice with the current Tirana time in the
   Albanian date format. Follow the link: the change completes.
2. *(Optional: how many real users were affected.)* In Vercel → the project → Logs, search the last available days
   for `Invalid time zone specified`. Report the count.

## 14. Completion report contract

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`. Never self-approved.

- the changed files with their `18-hash-object.txt` values;
- the requirement IDs completed;
- every command in §10.1, §10.3 and §13.2 with its real exit code;
- `02-repro.txt` quoted;
- the red run (`05`), with which tests failed and why;
- the plant table with its hash pairs (P1 states T1's actual result);
- the quoted T1 timestamp;
- assumptions, deviations and limitations;
- the §13.3 owner checks stated as owed.

Sonnet updates the 860 cell of `docs/backlog.md` (state only), writes the session log with a "Files Changed" table,
and emits no git command.

## 15. Task quality gate

| Check | Result |
|---|---|
| Executable without chat context | Yes: defect, callers, canonical sources, tests, plants and commands are in this file |
| One active route | Yes: reuse `TIRANE_TZ` + `formatDateTimeInZone`; no caller change |
| Every requirement has a binary AC | R1→AC1 · R2→AC2/AC4 · R3→AC3/AC4 · R4→AC5 · all→AC6 |
| Two-armed control | red-first (`05`) and P1–P3; P1 fails both T1 (silent `'—'`) and R3 |
| Detector blind spot stated | R3 sees quoted IANA-shaped literals in non-test source only: not ids built at runtime, not env values, not ids outside the listed areas. T1 proves the sender with `sendEmail` mocked, not delivery (§13.3 does) |
| Material absence claims traced | "No test imports the real module": the two `vi.mock` sites (F4) and `git grep sendEmailChangeEmails` (3 non-definition hits: 2 callers, 2 mocks). "No other invalid id": `git grep` (F6), re-run at I0 |
| Dirty worktree handled | I0 snapshot; 869's uncommitted files are outside §7 and must not be touched |
| Owner exception claimed | None |

---

## Appendix A — Evidence preflight (task design)

| Claim | Source inspected | Status |
|---|---|---|
| `Europe/Tirana` throws on this runtime | native `node.exe` run 2026-09-25, ICU 78.2 | VERIFIED |
| No caller catches | `cabinet/actions/index.ts:383,435` read | VERIFIED |
| Token and `pending_email` written before the throw | `:358-371`, `:422-425` | VERIFIED |
| Module mocked everywhere | `deleteOwnAccount.smoke.test.ts:57`, `rls-write-guards.smoke.test.ts:68` | VERIFIED |
| Canonical constant and formatter | `period.ts:20`, `formatters.ts` `formatDateTimeInZone`: measured `29.03.2026, 01:30 p.d.` (Tirane) and `—` (Tirana, no throw) | VERIFIED |
| Production users affected | — | UNKNOWN → §13.3 step 2 |

## Appendix B — Rule-compliance ledger

| Rule | Outcome | Evidence | Result |
|---|---|---|---|
| agent-contract 15 + registry | regression coverage for "Email change" | R2, R4 | COMPLIANT |
| Q4 | baseline, changed-behaviour test, plants, owner-native | I0.5, `05`, P1–P3, §13.3 | COMPLIANT |
| agent-contract 9 | build exit 0 | `17-build.txt` | COMPLIANT |
| agent-contract 14 | UTF-8, Node I/O, hashes | §10.3, §13.2 | COMPLIANT |
| canonical reuse (GR-0 spirit, non-visual) | no new zone literal or formatter | R1 | COMPLIANT |

## Appendix C — Execution contract

| # | Checkpoint | Producer → artifact | Failure |
|---|---|---|---|
| 0 | Repro | I0.3 → `02` | no throw → `PREMISE DRIFT` |
| 1 | Red-first | R2/R3 on the unchanged source → `05` | a test green before R1 → the test cannot see the defect |
| 2 | Plants | `06`–`08` | a plant passes → test defect |
| 3 | Gates | §13.2 | non-zero → `PARTIALLY IMPLEMENTED` |
| 4 | Owner | §13.3 | an email missing after deploy → finding |
