# Task 860 — email-change sender stops throwing on an invalid time zone

Kickoff: `tasks/Sprints/Sprint_78_kickoff_prompt_Task_860_Email_Change_Timezone_RangeError.md`
Status: **IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW**
Evidence: `docs/sessions/evidence/task860/`

## Requirement and acceptance-criteria evidence

| ID | Requirement | Evidence | Result |
|---|---|---|---|
| R1 → AC1 | `emailChange.ts:177` (now :179) uses `formatDateTimeInZone(new Date().toISOString(), 'sq', TIRANE_TZ)`, importing `TIRANE_TZ` from `@/lib/dashboard/period` and `formatDateTimeInZone` from `@/lib/formatters`. | `18-hash-object.txt`; `git diff` shows only the two imports + the one line changed; no `'Europe/Tirana'` string remains in the file (confirmed by R3's own PASS on the final tree). | MET |
| R2 → AC2, AC4 | New `emailChange.test.ts` imports the real module, mocks only `./send`, fixes the clock to `2026-03-29T00:30:00Z`. T1: resolves, `sendEmail` called twice (new/old), security html contains `29.03.2026, 01:30 p.d.`. T2: mobile device hint present. | `05-red.txt` (fails pre-R1 with the real `RangeError`), `10-new-tests.txt` (3/3 pass on final tree), `08-plant-p3.txt` (P3 rejects with `RangeError`). | MET |
| R3 → AC3, AC4 | New `timezone-literals.test.ts` scans non-test `src/**/*.{ts,tsx}` for quoted IANA-shaped literals, asserts each is `Intl`-valid, fails naming file+id, and asserts ≥1 id found. | `05-red.txt` (fails pre-R1 naming `emailChange.ts`/`Europe/Tirana`), `10-new-tests.txt` (passes on final tree, `foundCount` includes `Europe/Tirane` elsewhere in `src`), `06-plant-p1.txt` and `07-plant-p2.txt` (each plant fails naming its file+id). | MET |
| R4 → AC5 | `package.json` `test:auth` gains both new files; `docs/critical-flow-registry.md` "Email change" row's command cell gets both files and one coverage note. | `18-hash-object.txt` (package.json, critical-flow-registry.md hashes); diff touches only those two named cells. | MET — see note below on `test:auth`'s exit code |
| all → AC6 | `npm run build` exits 0; `typecheck`, `lint`, `check:file-integrity`, `check:mojibake` exit 0; `git status` shows no path outside §7. | `17-build.txt` (0), `13-typecheck.txt` (0), `14-lint.txt` (0 errors, 95 pre-existing warnings, none in Task 860 files), `15-file-integrity.txt` (219 files clean), `16-mojibake.txt` (0 artifacts / 7369 files), `19-status-after.txt`. | MET |

## Current versus required behavior

| Situation | Current (pre-fix) | Required after | Verified |
|---|---|---|---|
| User requests an email change | action rejects with `RangeError`; no email sent; pending token and `pending_email` already written | both emails sent; `{ pendingEmail }` returned | `emailChange.test.ts` T1/T2 exercise the sender directly; the caller path (`cabinet/actions/index.ts`) is unchanged and out of scope (§8) |
| User presses "resend" | token rotated, action rejects, no email | a new link is emailed | same sender fix applies; caller unchanged |
| Security notice timestamp | never rendered (throw happens before) | Tirana wall clock, `sq` layout, format changed per owner decision (§5.1) | T1 asserts the literal `29.03.2026, 01:30 p.d.` |
| Verification email content, link, subject | never sent | unchanged from template | T1 confirms `sendEmail` called with `to: newEmail`; template code untouched |
| `sendEmail` itself fails | logged, function returns | unchanged | not touched by R1; existing `if (verifyResult.error)`/`if (securityResult.error)` branches are unchanged |

Negative-flow applicability (kickoff §11): invalid zone id anywhere in `src` → R3 fails naming file+id (verified, P1/P2). Old buggy line restored → T1 rejects (verified, P3). `sendEmail` error path, rate limit/same-email/taken-email, token consumption/expiry, locale/viewport — all unchanged/not applicable, per kickoff.

## Files Changed

| Path | Reason |
|---|---|
| `src/modules/notifications/lib/emails/emailChange.ts` | R1 — replaced the invalid-zone `toLocaleString` call with the canonical `TIRANE_TZ` + `formatDateTimeInZone` |
| `src/modules/notifications/lib/emails/__tests__/emailChange.test.ts` (new) | R2 — real-module regression test (T1, T2) |
| `src/lib/__tests__/timezone-literals.test.ts` (new) | R3 — repo-wide invalid-zone-literal guard |
| `package.json` | R4 — `test:auth` string gains both new test files |
| `docs/critical-flow-registry.md` | R4 — "Email change" row's command cell + one coverage note |
| `docs/backlog.md` | Sonnet concise state update for the 860 registry cell |
| `docs/sessions/evidence/task860/*` | I0/red/plant/final-gate evidence (19 files) |
| `docs/sessions/2026-09-27-task860-email-change-timezone-rangeerror.md` (this file, new) | session log |

No other path changed (`19-status-after.txt`). `src/lib/dashboard/period.ts` and `src/lib/formatters.ts` were read, not edited (§8 — consumed, not changed). `src/modules/cabinet/actions/index.ts` and `PasswordChangedEmail.tsx` were read for context/plants only and are hash-verified unchanged in their final state.

## Validation evidence

All commands run from the project root, `win32`, Node `v22.22.3`, ICU `78.2` (`09-platform.txt`).

| Step | Command | Result |
|---|---|---|
| I0.1 | platform/version check | `win32 v22.22.3 78.2` — matches kickoff's measured runtime |
| I0.2 | `git --no-optional-locks status --porcelain` + hash-object | `01-status-before.txt`, `01b-hash-before.txt` — dirty tree at I0 was Task 854/889 in-progress work, entirely outside §7 |
| I0.3 | repro F1 | `02-repro.txt` → `RangeError: Invalid time zone specified: Europe/Tirana` — no premise drift |
| I0.4 | zone-literal grep | `03-zone-literals.txt` — confirms F6: only `emailChange.ts:177` is invalid; every other literal is `Europe/Tirane` |
| I0.5 | `npm run test:auth` baseline | `04-test-auth-before.txt` — **exit 1**, 1 pre-existing failure unrelated to Task 860 (see note below), 70/71 passing otherwise |
| Red | new tests vs. unchanged source | `05-red.txt` — T1/T2 reject with the real `RangeError`; R3 fails naming `emailChange.ts`/`Europe/Tirana` — exit 1 |
| Green | new tests vs. R1 | `05b-green.txt` — 2 files / 3 tests pass — exit 0 |
| P1 | `emailChange.ts`: `TIRANE_TZ` → `'Europe/Tirana'` | `06-plant-p1.txt` — R3 fails naming `emailChange.ts`/`Europe/Tirana`; T1/T2 fail because the safe formatter silently returns `'—'` (no throw) — hash before/after equal (`fed32ed…`) |
| P2 | `PasswordChangedEmail.tsx`: `'Europe/Tirane'` → `'Europe/Kyev'` | `07-plant-p2.txt` — R3 fails naming `PasswordChangedEmail.tsx`/`Europe/Kyev` (×2 occurrences) — hash before/after equal (`899107b…`) |
| P3 | `emailChange.ts`: restore original buggy line | `08-plant-p3.txt` — T1/T2 reject with `RangeError` — hash before/after equal (`fed32ed…`) |
| Final | `09-platform.txt` … `19-status-after.txt` | see AC6 row above |

**AC5 / `test:auth` note.** The baseline (I0.5) already failed before any Task 860 edit: `postSignOut.test.ts`'s `SESSION_REQUIRED_ROUTE_PATTERNS` drift test reports `extra: [/cabinet/statistics]`. This is caused by Task 854/889's uncommitted `/cabinet/statistics` route (already present in the tree at I0, confirmed in `01-status-before.txt`), which added a session-required cabinet subroute without updating `SESSION_REQUIRED_ROUTE_PATTERNS` (`src/lib/auth/postSignOut.ts:3-8`) — entirely outside Task 860's §7 scope and not a file this task may touch. The final gate run (`11-test-auth.txt`) reproduces the identical single failure with the same message, plus all 3 new Task 860 tests passing (74 total, 1 failed, 73 passed vs. baseline's 71 total, 1 failed, 70 passed). `npm run test:auth` therefore does not exit 0 end-to-end, but the gap is pre-existing, unrelated to this task's diff, and unchanged by it — flagged to Opus below rather than silently reported as met.

## Visual source trace

Not applicable — GR-0/GR-1/GR-3/GR-3a are stated not applicable in the kickoff (§1): no visible UI changes. The only user-visible effect is the timestamp text inside the security-notice email body, which is server-rendered HTML in a hand-crafted (non-Mantine, non-Storybook) email template, per `docs/integrations.md` → "Email Template Architecture" (code-first, inline per-template strings, no Storybook proof path for this artifact class).

## Canonical UI decision record

Not applicable (non-visual task). R1 reuses two already-existing canonical sources rather than introducing any new value: `TIRANE_TZ` (`src/lib/dashboard/period.ts:20`) and `formatDateTimeInZone` (`src/lib/formatters.ts`), both established by Task 846 and already documented in F5. No new literal, formatter, or visual value was created.

## Implementation validation notes

- Evidence transcripts captured via PowerShell `Tee-Object`/`Add-Content` carry a stray UTF-8 BOM on this Windows PowerShell 5.1 host (per the orchestrator-procedures 818/819 corollary). All 19 evidence files were normalized to UTF-8 without BOM via Node `fs` I/O (steps 1–9, 12–14) or captured directly via `[System.IO.File]::WriteAllText(..., UTF8Encoding($false))` (steps 10, 11, 15–19) before the final `check:file-integrity` pass, which reports all 219 changed/untracked files clean.
- `check:file-integrity`'s own transcript is necessarily self-referential (the command's output file is itself scanned by the next invocation of the same command over "git-changed + untracked" files); this was resolved by capturing to a clean no-BOM file directly rather than iterating.
- No defect found in the implementation beyond the one the kickoff already specified (F1). No scope drift.

## Assumptions, deviations, and limitations

1. Per kickoff §5.1 (owner decision 2026-09-25, quoted verbatim there), the timestamp format changes from `en-GB` to the canonical `sq` layout (`29.03.2026, 01:30 p.d.`, 12-hour). Task 885 (next in Sprint 78) will flip this to 24-hour together with the rest of the site; 860 does not add a private 24-hour format.
2. Rolling back a pending token on send failure, and surfacing a send failure to the user, are explicitly out of scope (kickoff §5.2) — unchanged.
3. R3's detector blind spot (stated in the kickoff and repeated in the test's own header comment): it sees only quoted IANA-shaped literals in non-test `src/` source, not a runtime-built id, an env-sourced id, or an id outside `src/`.
4. AC5's `npm run test:auth` exit-0 clause could not be satisfied end-to-end — see the "AC5 / `test:auth` note" above. This is a pre-existing, out-of-scope condition, not a Task 860 regression.

## Opus handoff

- Evidence root: `docs/sessions/evidence/task860/` (19 files, `01`–`19`).
- **Question for Opus:** `test:auth`'s baseline was already red at I0 due to Task 854/889's in-progress `/cabinet/statistics` route missing from `SESSION_REQUIRED_ROUTE_PATTERNS`. Task 860 did not cause it, cannot fix it in scope, and reproduces the identical single failure at the final gate with all 3 new tests passing. Please confirm this is already tracked under Sprint 78's 854/889/890/891 chain and does not block this task's approval, or direct the correct remediation owner.
- Please independently verify the T1 literal (`29.03.2026, 01:30 p.d.`) against `formatDateTimeInZone`'s actual behavior — reasoned through manually in this session (2026-03-29 00:30 UTC is still CET, before the EU DST transition at 01:00 UTC that same day) and confirmed by the passing test, but worth an independent read given AC1's "only changes" framing.
- Hash witnesses for every changed file are in `18-hash-object.txt`; plant/restore hash equality is inline in `06`/`07`/`08`.

## Backlog update

`docs/backlog.md` row 53 (Sprint 78 reserved-numbers row): the 860 cell updated from `` `KICKOFF FILED` 2026-09-25 `` to `` `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` 2026-09-27 `` plus this session log's path. Physical line count: **80** (unchanged from `git show HEAD:docs/backlog.md`, at the 80-line ceiling — no `BACKLOG LIMIT BREACH`, but no further concise-state additions have headroom without trimming).
