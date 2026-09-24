# Task 872 — I0 premise drift, BLOCKED before any implementation write

Kickoff: `tasks/Sprints/Sprint_81_kickoff_prompt_Task_872_Sign_Out_Stays_On_Public_Pages.md`
Status: **BLOCKED — PREMISE DRIFT (I0)**. No R1–R6 write was made. `Header.tsx`, `postSignOut.ts`,
`AuthSheet.stories.tsx`, `mantine-migration-scope.json`, the two baselines, `package.json`, and
`docs/critical-flow-registry.md` are all untouched by this session.

## What happened

Executed the mandatory `10.1 I0` re-entry steps before any related write, per `execute-task/SKILL.md`'s start
gate and the kickoff's own "PREMISE DRIFT: stop" instructions.

1. **Platform** (`docs/sessions/evidence/task872/01-platform.txt`): `win32 v22.22.3` — matches.
2. **F3 grep** (`docs/sessions/evidence/task872/04-f3-grep.txt`): the same four pages
   (`cabinet`, `favorites`, `listings/create`, `listings/[slug]/edit`) contain `auth/login?next=`. **Matches F3.
   No drift on this premise.**
3. **F5 census re-run** (`docs/sessions/evidence/task872/03-census-I0.txt`):
   `node.exe scripts\check-surface-census.mjs --surface src/components/layout/Header.tsx`
   — node count **21** (matches F5) but the FAIL set does **not** match:

   | | F5 (design-time, 2026-09-23/24) | I0 re-run (2026-09-24, this session) |
   |---|---|---|
   | tier1-unenrolled-or-unstoried | `Header.tsx`, `NotificationBell.tsx`, `CaptchaWidget.tsx` (3) | same 3, **plus** `LocaleSwitcher.tsx`, `PhoneField.tsx` (5 total) |
   | tier2-legacy-primitive | `PasswordRequirementsHint.tsx` (1) | same (1) — no drift here |

   `LocaleSwitcher.tsx` and `PhoneField.tsx` both show `story:yes` in the node table (they have canonical
   Mantine Stories — `src/stories/mantine/primitives/LocaleSwitcher.stories.tsx`,
   `src/stories/mantine/primitives/PhoneField.stories.tsx`) but `manifest:no` — neither appears in
   `scripts/mantine-migration-scope.json` (confirmed: `grep -n "LocaleSwitcher\|PhoneField"
   scripts/mantine-migration-scope.json` returns nothing). The census's pass condition requires both
   `manifest:yes` and `story:yes`; a Story alone does not clear `tier1-unenrolled-or-unstoried`.

   This is not caused by any change in this session — no write had been made yet when the census ran. Git
   history shows `scripts/mantine-migration-scope.json` was last touched by Task 861 (`052ba1700`), several
   commits before F5 was measured (2026-09-23/24) and before the Task 872 kickoff commit (`d2220c33f`). The two
   components' own last-touching commits (`486c42ff8` for `LocaleSwitcher.tsx`, `ce0a9afb0` for `PhoneField.tsx`)
   are older still. The most likely explanation is that F5's own measurement undercounted at design time, not
   that intervening work introduced new debt — but the executor cannot resolve that judgment; it is exactly the
   "different set" condition the kickoff's own §10.1 step 2 names and says to stop on.

## Why this blocks rather than proceeding

- §7 (Scope) limits `scripts/mantine-migration-scope.json` to "one entry" and R5 says the same. Enrolling
  `LocaleSwitcher.tsx`/`PhoneField.tsx` to clear their FAILs would exceed the authorized scope.
- R6/AC7 require each regenerated baseline's diff to be **exactly** the `CaptchaWidget` key removals (2 census +
  1 rendered-scope) — "any other added or removed key is `SCOPE GUARD FAILED`: stop and report, do not commit a
  widened baseline." Regenerating either baseline right now, with these two extra unenrolled nodes present,
  risks exactly that.
- §10.2's pre-written GR-1 receipt (`tier1 1 migrated+enrolled+story (CaptchaWidget) + 2 exempt under D81-2
  (Header, NotificationBell)`) accounts for 3 tier1-unenrolled nodes, not 5. Emitting it as written would
  misstate the real census.
- The executor has no authority to file a new task number, narrow this task's own scope, or exempt a component
  under GR-1/16d on its own judgement (`agent-contract.md` 16d: "A node whose tier is genuinely unclear is an
  owner decision, not an executor's judgement call.").

## What Opus needs to decide

`LocaleSwitcher.tsx` and `PhoneField.tsx` are both tier-3 candidates by clause 16d's own definition ("shared
components already proven elsewhere... rendered here but owned by another surface") — each already has its own
canonical Story and is consumed well beyond the header tree (`LocaleSwitcher` also renders inside `AuthSheet`;
`PhoneField` inside `AuthSheet`'s phone inputs). The likely resolution is: add both to
`scripts/mantine-migration-scope.json` (a one-line-each, zero-visual-risk manifest fix, since both already have
passing Stories) either in this task's scope (amending §7/R5/R6/the GR-1 receipt) or as a small separately-numbered
task — an owner/orchestrator call, not the executor's.

## Evidence

- `docs/sessions/evidence/task872/01-platform.txt`
- `docs/sessions/evidence/task872/02-status-before.txt` (pre-existing dirty-tree state: `task861/storybook-dev.log`,
  `scripts/schema-drift-check.sql` — both unrelated to 872, untouched by this session)
- `docs/sessions/evidence/task872/03-census-I0.txt`
- `docs/sessions/evidence/task872/04-f3-grep.txt`
- `docs/sessions/evidence/task872/05-status-final.txt` (added per §17.5 — this session's final `git status`)

## Files Changed

| File | Reason |
|---|---|
| `docs/backlog.md` | 872 row state cell → `BLOCKED — PREMISE DRIFT (I0)`, with the measured drift and this session log's path |
| `docs/sessions/2026-09-24-task872-premise-drift-blocked.md` | this session log (new) |
| `docs/sessions/evidence/task872/01-05-*.txt` | I0 evidence captures (new) — `05-status-final.txt` added per §17.5 |

No product, test, story, manifest, baseline, or registry file was touched.

## Deviations and limitations

- Steps 4 of I0 (open Storybook and record the `CaptchaWidget` branch, F7) was not performed — it is
  downstream of R5, which is blocked by this drift, and would not change the finding.
- `SURFACE_CENSUS_BASE_SHA`/`SURFACE_CENSUS_HEAD_SHA` are only set in CI (`.github/workflows/governance-pr.yml`);
  `npm run check:surface-census:changed` as written in §13.2 will exit 1 locally ("`--base <ref>` is required")
  without one of those set. Not evidence toward this block — noted for whoever runs §13.2 next, since the
  literal command as written will not reproduce a clean local run without `--base` (e.g. the current `HEAD`,
  which via `git diff --name-status <base>` with no `--head` diffs against the working tree).
