# Task 876 — I0 premise drift, BLOCKED before any implementation write

Kickoff: `tasks/Sprints/Sprint_81_kickoff_prompt_Task_876_Sign_Out_Is_One_Visible_Step.md`
Status: **BLOCKED — PREMISE DRIFT (I0)**. No R1–R7 write was made. `AuthContext.tsx`, `Header.tsx`,
`HeaderView.tsx`, `UserMenu.tsx`, both Story files, both test files, `package.json`,
`docs/critical-flow-registry.md`, and `scripts/surface-census-baseline.json` are all untouched by this session.

## What happened

Executed the mandatory `10.1 I0` re-entry steps before any related write, per `execute-task/SKILL.md`'s start
gate and the kickoff's own "PREMISE DRIFT: stop" instructions.

1. **Platform** (`docs/sessions/evidence/task876/10-platform.txt`): `win32 v22.22.3` — matches.
2. **F9 census re-run** (`docs/sessions/evidence/task876/02-census-I0.txt`):
   `node.exe scripts\check-surface-census.mjs --surface src/components/layout/Header.tsx`
   — node count **21** (matches F9) but the FAIL set does **not** match:

   | | F9 (design-time, 2026-09-24) | I0 re-run (2026-09-24, this session) |
   |---|---|---|
   | FAIL lines | `Header.tsx`, `NotificationBell.tsx`, `src/components/ui/PasswordRequirementsHint.tsx` (3) | `Header.tsx`, `NotificationBell.tsx` (2) |

   `PasswordRequirementsHint` no longer appears in the FAIL set at all, and no longer lives under
   `src/components/ui/*`: the census now reports it as
   `src/design-system/mantine/patterns/PasswordRequirementsHint.tsx  tier:tier1  manifest:yes  story:yes`. This
   matches Task 873's own landed commit (`6fc05fb79`, in the repository history at this session's start):
   *"PasswordRequirementsHint moves to design-system patterns and is enrolled"*. 873 is `✅ APPROVED WITH NOTES`
   in the Sprint 81 Tasks table and was merged before this session began — the tier-2 edge F9 recorded as
   "owned by 873" has since been resolved by 873 itself, one FAIL line short of what F9 states.
3. **F2/F3/F5/F6 re-read** (line citations only, no shape change): `controller.ts` signOut is at `:231-250`
   (F2 cited `:231-252` — same shape, `commit(signing_out)` before the first `await`, `try { await coreSignOut()
   } catch {}`, then `commit(unauthenticated)` — off-by-a-couple-lines only). `AuthContext.tsx` `useSyncExternalStore`
   is at `:88-93` and `signOut` at `:108-116` (F3 cited `:84-88`/`:104-117` — same shape: bare `startTransition`
   import, `navigate?.()` called after `await`, outside any transition scope). `Header.tsx` declares `useUser()`
   at `:19` and `handleLogout` at `:48-54` (F5 — matches exactly). `UserMenu.tsx` trigger `Button` is at `:39-45`
   (F6 cited `:38-45` — matches). `HeaderView.tsx` hamburger `ActionIcon` is at `:187-196` (F6 cited `:196-205` —
   same shape, `variant="default"`, `hiddenFrom="md"`, `onClick={onOpenMobile}`, no `loading` prop yet). **No
   shape drift on F2/F3/F5/F6** — line-number drift only, from unrelated intervening commits.

## Why this blocks rather than proceeding

- The kickoff's own `10.1` step 2 is explicit: *"It must show exactly the three FAIL lines of F9. A different set
  means PREMISE DRIFT: stop."* The re-run shows two, not three.
- R7/AC8 require the regenerated `scripts/surface-census-baseline.json` diff to remove **exactly** the one F10
  key (`HeaderView.tsx :: LocaleSwitcher.tsx :: tier1-unenrolled-or-unstoried`) — "any other added or removed key
  is `SCOPE GUARD FAILED`." Whether 873's own baseline regeneration (its commit message: "baselines -13 census
  keys and -1 rendered-scope edge") already removed the `PasswordRequirementsHint` key from
  `scripts/surface-census-baseline.json` is unverified by this session — running the `--update-baseline` step now,
  on a premise that has already shifted, risks a diff this task cannot correctly characterize as "exactly one key."
- The `10.2` GR-1 receipt is pre-written into the kickoff as: *"tier2 0 imports removed (PasswordRequirementsHint
  → 873)"* — that clause is still technically true (876 removes 0 tier-2 imports; 873 already did), but the
  receipt's premise (F9's 3-line FAIL set) no longer matches what the executor can observe, and the executor has
  no authority to silently rewrite a receipt the kickoff pre-committed to a specific fact.
- Per `agent-contract.md` 16d and the `execute-task` skill: a node/tier/premise mismatch of this kind is "an owner
  decision, not an executor's judgement call." Task 872 hit the same class of I0 census drift earlier in this
  sprint (`docs/sessions/2026-09-24-task872-premise-drift-blocked.md`) and was correctly routed back to Opus for a
  kickoff amendment rather than resolved in-session; this follows the same precedent.

## What Opus needs to decide

This drift looks favorable, not harmful: 873 landing before 876 executes already resolved the one tier-2 edge F9
flagged as owed to 873, leaving exactly the two D81-2 container-exempt nodes (`Header`, `NotificationBell`) that
876's own R1–R7 were always going to leave alone. None of R1–R7's file-level requirements appear to depend on the
third FAIL line's presence. The likely resolution is a one-line kickoff amendment: F9 and the `10.2` GR-1 receipt
text updated to state 2 FAIL lines instead of 3, and an explicit confirmation that R7's "exactly one F10 key" scope
guard is still the correct comparator against the **current** `scripts/surface-census-baseline.json` (i.e. that
873's own baseline update already accounted for the `PasswordRequirementsHint` key, so 876's diff should still be
exactly the one `LocaleSwitcher` key) — but this is Opus's verification to make, not the executor's assumption.

## Evidence

- `docs/sessions/evidence/task876/01-status-before.txt` (pre-existing dirty-tree state: `task861/storybook-dev.log`,
  `scripts/schema-drift-check.sql` — both unrelated to 876, untouched by this session; hash-object values recorded)
- `docs/sessions/evidence/task876/02-census-I0.txt`
- `docs/sessions/evidence/task876/03-status-final-I0.txt` (this session's final `git status`)
- `docs/sessions/evidence/task876/10-platform.txt`

## Files Changed

| File | Reason |
|---|---|
| `docs/backlog.md` | 876 row state cell → `BLOCKED — PREMISE DRIFT (I0)`, with the measured drift and this session log's path |
| `docs/sessions/2026-09-24-task876-premise-drift-blocked.md` | this session log (new) |
| `docs/sessions/evidence/task876/01-status-before.txt`, `02-census-I0.txt`, `03-status-final-I0.txt`, `10-platform.txt` | I0 evidence captures (new) |

No product, test, story, manifest, baseline, or registry file was touched.

## Deviations and limitations

- Steps 10.2 (GR-0/GR-3a/GR-3/GR-1 receipts) and all of 10.3/10.4/§13.2 were not performed — they are downstream
  of the blocked I0 premise check and would either be meaningless (receipts written against a stated premise the
  executor cannot confirm) or risk an unauthorized baseline/manifest write ahead of an owner/Opus decision.
- R1–R6 source/test/Story edits were not started. This session made no code change of any kind.
