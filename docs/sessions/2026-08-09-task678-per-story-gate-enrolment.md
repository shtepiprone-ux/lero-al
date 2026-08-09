# Session Log — Task 678: Per-story gate enrolment; 699's xxl gap + AdminUsersTable

**Status: IMPLEMENTED — AWAITING ORCHESTRATOR REVIEW**

Kickoff: `tasks/Sprints/Sprint_52_kickoff_prompt_Task_678_PerStory_Gate_Enrolment.md` (Q4).
Companions: `Sprint_52_Task_678_execution_contract.md`, `Sprint_52_Task_678_rule_compliance_ledger.md`.
Executed under `.claude/skills/execute-task/SKILL.md`.

## 1. Files Changed

| Path | Action | Reason |
|---|---|---|
| `scripts/lib/mantine-story-scope.mjs` | modified | R1 — added `MANTINE_STORY_ENROLLED_TITLES` (exact-title enrolment map) + reasons; `isCanonicalMantineTitle()` now checks prefix OR exact enrolled title; prefix list untouched |
| `scripts/check-stories-rendered.mjs` | modified | R1 — `discoverMantinePrimitiveStories()` switched from a local re-implementation of the prefix check to the shared `isCanonicalMantineTitle()`; `componentName` derivation extended for non-prefixed (enrolled) titles; two log/error lines now mention enrolled titles; R4 — `MANTINE_STORY_EXTRA_VIEWPORTS.HowItWorksSteps = [wide-1440]` added; `MANTINE_VIEWPORTS` untouched (R8) |
| `scripts/__tests__/mantine-story-scope.test.ts` | created | R1 — unit proof: prefix regression, exact-title enrolment, sibling exclusion, no-substring-match, empty-enrolment fail-closed case (D32), non-string input |
| `docs/storybook-governance.md` | modified | §14.9.30 — full record of the mechanism, what it was spent on, the R5 disposition, and the negative-plant proof |
| `docs/backlog.md` | modified | "Last Session" block replaced (not appended); task registry updated to reserve Task 735 (`System/FeaturedListings`, deferred) |
| `docs/sessions/2026-08-09-task678-per-story-gate-enrolment.md` | created | this log |

**Reversible probe, reverted before final verification (not in the diff):** `src/stories/Containers.stories.tsx`
`meta.title` was temporarily changed to `Admin/AdminUsersTableSibling` (R6 negative plant), then reverted.
`git hash-object` post-revert = `f6370fe8bb3c54ec85249035ed037c9499968184`, identical to the pre-plant value; the
path is absent from `git status --porcelain` (`K5-restore.txt`, captured after the final gate run).

`git status --porcelain` at time of writing:
```
 M docs/backlog.md
 M docs/storybook-governance.md
 M scripts/check-stories-rendered.mjs
 M scripts/lib/mantine-story-scope.mjs
?? scripts/__tests__/mantine-story-scope.test.ts
```
Matches the file list above exactly (5 entries); `Containers.stories.tsx` is absent, confirming restoration.

## 2. Dirty-worktree manifest (A1)

Pre-write `git status --porcelain` (Checkpoint 0): **empty** — worktree started clean. `git show
HEAD:docs/backlog.md | wc -l` = **89** (R11 baseline, read before the first edit).

## 3. Requirement / acceptance-criteria evidence

| Req/AC | Evidence |
|---|---|
| R1 / AC1 | `mantine-story-scope.mjs` diff; `mantine-story-scope.test.ts` (7/7 pass, §7 below); prefix list byte-identical (`git diff` shows only additive lines before it) |
| R2 / AC2 | §5 — three gates' scoped counts, before and after, each with delta explained |
| R3 / AC3 | `K2-scope-delta.log` — 1 of 21 `Admin/*` titles in scope, 20 excluded, stated as a count |
| R4 / AC4 | `MANTINE_STORY_EXTRA_VIEWPORTS.HowItWorksSteps` diff; §5 — +4 cells, all PASS, at `wide-1440` |
| R5 / AC5 | `storybook-governance.md` §14.9.30 — `System/LatestListings` out of scope (route-level, story never renders the heading); `System/FeaturedListings` reserved as Task 735 in `docs/backlog.md` |
| R6 / AC6 | `K4-negative-plant.log` (positive: plant absent from all 3 gates) + `K5-restore.txt` (hash + porcelain, captured after final gate run) |
| R7 | §5.3 — both new FAIL cells and all 13 locale-leak findings named, attributed, none suppressed |
| R8 / AC8 | `git diff scripts/check-stories-rendered.mjs` — `MANTINE_VIEWPORTS` block (`:392-397`) has zero changed lines |
| R9 | §5 — final matrix stated against `1146/1184 PASS, 16 FAIL, 22 AMBIGUOUS`, denominator moved to 1204, every moved cell attributed |
| R10 / AC9 | §6 — tsc exit 0, build exit 0, `check:assertion-liveness` exit 0 |
| R11 / AC10 | §2 (baseline) + §8 (two integrity passes) |

## 4. Current versus required behavior

**Current (before).** Scope was a two-entry prefix list (`Mantine/Primitives/`, `Patterns/Mantine/`). No mechanism
existed to enrol a single story: `AdminUsersTable` could only be reached via an `Admin/` prefix, which would have
enrolled 20 unmigrated shadcn siblings alongside it. `HowItWorksSteps` was in scope but `MANTINE_VIEWPORTS` never
samples above 1024px, so its own `SECTION_HEADING_FZ` xxl step (≥1440) was never rendered.

**Required (after).** A story can be enrolled by exact title without enrolling siblings. `Admin/AdminUsersTable` is
in scope; the other 20 `Admin/*` titles are not. `HowItWorksSteps` has rendered cells at 1440. The `System/*` pair
has a recorded disposition. `MANTINE_VIEWPORTS` is untouched. Every newly-failing cell is named, not suppressed.

**Applicable negative flows (kickoff §11):**

| Negative flow | Result |
|---|---|
| Enrolling one story silently enrols its siblings | Did not happen — `K2-scope-delta.log` (source) + `K4-negative-plant.log` (rendered/browser gates) both prove it |
| A gate changed without measuring the other two | Did not happen — §5 measures all three, before and after |
| Newly-enrolled cells fail and are suppressed | 2 FAIL + 13 locale-leak findings occurred; none suppressed — named/attributed in §5.3, no new tolerance/skip/allowlist added anywhere in the diff |
| `MANTINE_VIEWPORTS` edited "while we're here" | Did not happen — `git diff` shows the block untouched |
| A newly-enrolled story makes an assertion dead-everywhere | Did not happen — `check:assertion-liveness` still reports 5/5 LIVE, 0 DEAD-NEW (§6) |
| Plant left in the tree | Did not happen — §1, `K5-restore.txt` |
| Locale/i18n regression | N/A — no `messages/*` edit; `check:i18n` still exit 0 (§6). Note `check:locale-leak`'s **scope** did change per R2, and it surfaced a real pre-existing `sq` gap on `AdminUsersTable` — a finding, not a regression this task introduced |
| Auth/RLS/data-loss | N/A — scripts and story scope only |

## 5. Three-gate before/after (R2/AC2)

All commands use `--mantine-only`. "Before" = clean HEAD, fresh `build-storybook`. "After"/"Final" = post
R1+R3+R4 edit, fresh `build-storybook` (the plant-present intermediate run used for R6 produced byte-identical
numbers to the final run, confirming the plant contributed nothing — see §7).

### 5.1 `check:story-coverage` (source-parsed, no build required)

| | Canonical story files | of total | Manifest entries | Covered | Missing |
|---|---:|---:|---:|---:|---:|
| Before | 67 | 122 | 15 | 15 | 0 |
| After | 68 | 122 | 15 | 15 | 0 |

Delta: **+1** canonical file (`Admin/AdminUsersTable`). `AdminUsersTable.tsx` is not in
`scripts/mantine-migration-scope.json`, so the manifest-coverage figure (15/15) is unaffected — only the
denominator ("of 122") moves. Exit 0 before and after.

### 5.2 `check:locale-leak --mantine-only`

| | Scoped stories | Leaks |
|---|---:|---:|
| Before | 71 | 0 |
| After | 72 | 13 |

Exit 0 → exit 1. All 13 leaks are on `Admin/AdminUsersTable/Default`, the newly-enrolled story — **zero** leaks on
any other story (confirming the other 71 stories' behavior is unchanged). Full attribution:

- **2 are a real i18n gap**, escalated not fixed (A2): `admin.users` namespace (`AdminUsersTable.tsx:78`,
  `useTranslations('admin.users')`), `sq` locale — `role_admin`/`role_moderator` are literally identical to the
  English source in `messages/sq.json` (`"role_admin": "Administrator"`, `"role_moderator": "Moderator"`, verified
  identical at every namespace-duplicate occurrence of these keys in that file), while `uk`/`it` are correctly
  translated at the same keys. Pre-existing defect in `AdminUsersTable`/`messages/sq.json`, invisible to this gate
  before because `Admin/` was never in scope.
- **11 are fixture proper nouns**, not a real leak: "Tirana Real Estate Group" (×3: sq/uk/it), "Gentiana Hoxha"
  (×3), "Tirana Real Estate Group · #101" (×3), "Online" (×2: sq/it). Sourced from
  `src/stories/fixtures/admin.fixtures.ts` (company/person names — legitimately locale-invariant), not yet in the
  locale-leak detector's proper-noun allowlist because `Admin/` scope is new.

Per A2, neither is remediated in this task — both are reported here for Opus/owner triage.

### 5.3 `check:stories:rendered --mantine-only`

| | Scoped stories | Total cells | PASS | FAIL | AMBIGUOUS |
|---|---:|---:|---:|---:|---:|
| Before | 71 | 1184 | 1146 | 16 | 22 |
| After (final) | 72 | 1204 | 1164 | 18 | 22 |

Before figures are byte-identical to the kickoff's own quoted baseline (`1146/1184 PASS, 16 FAIL, 22 AMBIGUOUS`).
Delta: **+20 cells** exactly (`AdminUsersTable`: 1 story × 4 locales × 4 `MANTINE_VIEWPORTS` = 16; `HowItWorksSteps`
extra viewport: 1 story × 4 locales × 1 width = 4). +18 PASS, **+2 FAIL**, +0 AMBIGUOUS.

**Both new FAIL cells, named and attributed (R7):**

- `Admin/AdminUsersTable/Default` × `sq` × `mobile-320` — horizontal overflow; `[offscreen-control]` on the
  "Verified agents"/"Agjentë të verifikuar" tab.
- `Admin/AdminUsersTable/Default` × `uk` × `mobile-320` — horizontal overflow; `[offscreen-control]` on the
  "Verified agents"/"Верифіковані агенти" tab.

Both are the same real defect: at 320px, `AdminUsersTable`'s tab row does not accommodate the two longest-string
locale labels for "Verified agents", pushing the tab off-screen. Genuine, newly-exposed responsive gap in
`AdminUsersTable`, not remediated here (A2/§10.4 — this task escalates, does not fix, an admin component).

All 16 pre-existing FAIL cells (`HeroSearch` × 12, `NotificationBellView` × 4) are present, unchanged, out of
scope per kickoff §8. AMBIGUOUS is unchanged at 22 (4 `Combobox` + 16 `PopularLocationsView/Long City Name` + 2
`Tabs`) — no new ambiguous cell was introduced. One harness flake self-recovered via retry
(`Button/Default` × `it` × `mobile-320`, 1 retry), unrelated to this diff.

Manifests: `.screenshots/rendered-assert/2026-08-08T21-46/` (before), `.screenshots/rendered-assert/2026-08-09T08-19/`
(final, post-revert). Reports: `.screenshots/locale-leak/2026-08-08T21-46/report.json` (before),
`.screenshots/locale-leak/2026-08-09T08-19/report.json` (final).

## 6. Every command, actual exit code

| Command | Phase | Result |
|---|---|---|
| `git status --porcelain` | Checkpoint 0 | empty, exit 0 |
| `git show HEAD:docs/backlog.md \| wc -l` | Checkpoint 0 (R11 baseline) | 89 |
| `npm run check:story-coverage` | I1 before | 67/122, 15/15, exit 0 |
| `npm run build-storybook` | I1/I2 before | exit 0 (`build-storybook-before.log`) |
| `node scripts/check-stories-rendered.mjs --mantine-only` | I1/I2 before | 1146/1184 PASS, 16 FAIL, 22 AMBIGUOUS, exit 1 (pre-existing FAILs) |
| `node scripts/check-locale-leak.mjs --mantine-only` | I1 before | 71 stories, 0 leaks, exit 0 |
| `npx vitest run scripts/__tests__/mantine-story-scope.test.ts` | R1 unit proof | 7/7 passed, exit 0 |
| `npm run build-storybook` | with plant | exit 0 (`build-storybook-with-plant.log`) |
| `node scripts/check-stories-rendered.mjs --mantine-only` | with plant | 1164/1204 PASS, 18 FAIL, 22 AMBIGUOUS, exit 1; plant absent (0 grep matches) |
| `node scripts/check-locale-leak.mjs --mantine-only` | with plant | 72 stories, 13 leaks (all `AdminUsersTable`), exit 1; plant absent (0 grep matches) |
| `node scripts/check-story-coverage.mjs` | with plant | 68/122, exit 0; unchanged by plant |
| `git hash-object src/stories/Containers.stories.tsx` (post-revert) | R6 restore | `f6370fe8bb3c54ec85249035ed037c9499968184` = pre-plant value |
| `git status --porcelain src/stories/Containers.stories.tsx` | R6 restore | empty |
| `npm run build-storybook` | final | exit 0 (`build-storybook-final.log`) |
| `node scripts/check-stories-rendered.mjs --mantine-only` | final (Checkpoint 8) | 1164/1204 PASS, 18 FAIL, 22 AMBIGUOUS, exit 1 — identical to with-plant run |
| `node scripts/check-locale-leak.mjs --mantine-only` | final | 72 stories, 13 leaks, exit 1 — identical to with-plant run |
| `node scripts/check-story-coverage.mjs` | final | 68/122, 15/15, exit 0 |
| `npx tsc --noEmit` | Checkpoint 8 | 0 errors, exit 0 |
| `node scripts/check-assertion-liveness.mjs` | Checkpoint 8 | 5 LIVE / 0 DEAD-KNOWN / 0 DEAD-NEW / 0 STALE-ENTRY / 0 ORPHAN-ENTRY, exit 0 |
| `node scripts/check-i18n-parity.mjs` | Checkpoint 8 | 4 locales × 2218 keys, parity PASSED, exit 0 |
| `npm run build` | Checkpoint 8 (mandatory) | exit 0 — see §8 |
| `node scripts/check-file-integrity.mjs` | pass 1 (before session log/backlog) | 5 files clean, exit 0 |
| `node scripts/check-mojibake.mjs` | pass 1 | 0 artifacts in 2120 files, exit 0 |
| `node scripts/check-file-integrity.mjs` | pass 2 (after session log/backlog) | see §8 |
| `node scripts/check-mojibake.mjs` | pass 2 | see §8 |

## 7. R6 negative-plant detail

Plant: `src/stories/Containers.stories.tsx` `meta.title` changed `'System/Containers'` →
`'Admin/AdminUsersTableSibling'` — a deliberate near-miss of the newly-enrolled exact title
`Admin/AdminUsersTable`, chosen to test that the enrolment mechanism matches by string equality only (never
prefix/substring/adjacency). Pre-plant hash: `f6370fe8bb3c54ec85249035ed037c9499968184`.

With the plant present (alongside R1/R3/R4), all three gates' discovery/scope counts moved by exactly the
`AdminUsersTable` contribution and no more:

- `check-stories-rendered.mjs --mantine-only`: "Mantine selected: 72" (71 + `AdminUsersTable` = 72, not 73)
- `check-locale-leak.mjs --mantine-only`: "Mantine selected: 72" (identical accounting)
- `check-story-coverage.mjs`: 68 canonical files (unchanged from the plant-absent R1+R3+R4 measurement)

`grep -in "Sibling|Containers"` against both browser-gate transcripts returns 0 matches — the plant title appears
in neither gate's PASS/FAIL/AMBIGUOUS/leak output. Full detail: `.screenshots/task678-evidence/K4-negative-plant.log`.

Reverted; the with-plant and final (post-revert) full sweeps produced byte-identical PASS/FAIL/AMBIGUOUS figures
(1164/1204/18/22 both times) — direct confirmation the plant contributed zero cells either way.

## 8. `npm run build` final transcript and integrity passes

`npm run build` — **exit 0**, 53 route rows, compiled successfully. Full log:
`.screenshots/task678-evidence/K8-build.log`.

`check:file-integrity` pass 2 (after this session log and the `docs/backlog.md` edit exist) — **6 files clean,
exit 0** (up from 5 in pass 1 — the +1 is this session log itself, counted into the denominator per AC10/R11).
`check:mojibake` pass 2 — **0 artifacts in 2121 files, exit 0** (up from 2120 in pass 1, same +1 reconciled).

## 9. Visual source trace

Not applicable — no visible UI artifact changed. This task edits verification-gate scope logic
(`scripts/lib/mantine-story-scope.mjs`, `scripts/check-stories-rendered.mjs`) and adds a `MANTINE_STORY_EXTRA_VIEWPORTS`
entry (an additional screenshot width for an already-shipped, unmodified component). No `src/` production component
was changed; `AdminUsersTable.tsx`, `HowItWorksSteps.tsx`, and `FeaturedListingsView.tsx` are all byte-identical to
HEAD.

## 10. Canonical UI decision record

Not applicable — no new or changed visible UI artifact; §7.1 of the kickoff explicitly withholds the mechanism's
shape rather than prescribing a UI change.

## 11. Implementation validation notes

- Confirmed via `git diff` that `MANTINE_VIEWPORTS` (`check-stories-rendered.mjs:392-397`) has zero changed lines
  (R8/AC8).
- Confirmed the `discoverMantinePrimitiveStories()` `componentName` derivation does not crash for an enrolled
  (non-prefixed) title: `matchedPrefix` is `undefined` for `Admin/AdminUsersTable`, so `componentName` falls back
  to the title's final path segment (`'AdminUsersTable'`) — verified live via the rendered gate's label output
  (`Admin/AdminUsersTable/Default`) and its correct (non-overlay) `openTrigger: false` classification.
- Investigated (not fixed, per A2) both newly-enrolled-story gate failures to distinguish real defects from
  fixture-data false positives before reporting — §5.2/§5.3 above.
- Re-verified §3.4's "1 of 21 `Admin/*` eligible" claim against the current repository via `K2-scope-delta.log`
  rather than trusting the kickoff's 2026-08-08 snapshot — unchanged.

## 12. Assumptions, deviations, and limitations

- **A1 held.** Worktree started clean (not dirty) — the dirty-worktree manifest procedure was not needed beyond
  the empty pre-write snapshot itself.
- **A2 triggered as predicted.** Both `check:locale-leak` and (trivially, via denominator only)
  `check:story-coverage` were affected by the `AdminUsersTable` enrolment; `check:locale-leak` failed. Per A2,
  stopped short of fixing `AdminUsersTable`/`messages/sq.json` and reported instead (§5.2).
- **A3.** §3.3/§3.4's 2026-08-08 counts were re-derived (§K2-scope-delta.log, §5.1) and matched exactly — no
  divergence to report.
- **Deviation — R5 resolved as two different dispositions, not a single "reserved" or "enrolled" answer for the
  pair.** Investigation found the two `System/*` candidates are not symmetric: `System/LatestListings`'s story
  never renders the heading in question (it lives in `page.tsx`, not `LatestListingsView.tsx`), so enrolling it
  cannot prove anything about `SECTION_HEADING_FZ`, unlike `System/FeaturedListings`. See
  `storybook-governance.md` §14.9.30 for the full reasoning and `docs/backlog.md`'s Task 735 row.
  Task 735 is a **proposed** number matching the backlog's own documented "NEXT FREE" pointer at the time of
  writing (735, since bumped to 736) — Opus should confirm this reservation, not treat it as unilaterally final.
- **Limitation — `.screenshots/` evidence is local-only, gitignored, per D6 precedent**, consistent with prior
  tasks (699, 722, etc.). All referenced logs/manifests live under `.screenshots/task678-evidence/` and the
  standard `rendered-assert`/`locale-leak` output directories.
- **Limitation — the two `AdminUsersTable` findings (i18n gap, 320px tab overflow) are reported, not filed as
  their own numbered tasks.** Left for Opus to triage/file, consistent with A2's "stop and report" instruction
  rather than a Sonnet task-creation action (Sonnet has no task-design authority per `CLAUDE.md`).

## 13. Opus handoff

- Evidence root: `.screenshots/task678-evidence/` — `J0-status.txt` (Checkpoint 0), `I1-before-*.log`/
  `I2-baseline-matrix.log` (before), `K2-scope-delta.log` (R3 sibling exclusion), `J1`/`J2`/`J3-withplant-*.log`
  (with-plant run), `K4-negative-plant.log`/`K5-restore.txt` (R6), `K6-final-*.log` (final matrix), `K8-*.log`
  (tsc/build/liveness/i18n/integrity/mojibake).
- **Please independently verify:** (1) the `sq` `role_admin`/`role_moderator` i18n gap claim against
  `messages/sq.json` directly; (2) the R5 disposition reasoning — that `LatestListingsView.tsx` genuinely does not
  render the `{tl('latest')}` heading (grep `SECTION_HEADING_FZ`/`<Title` in that file — it is absent); (3) the
  proposed Task 735 number against the current backlog registry state (may have moved since this session started);
  (4) `git diff` independently to confirm the 4-file diff shape and that `MANTINE_VIEWPORTS` is untouched.
- No other risk identified beyond the above. Both newly-enrolled-story gate failures are real, pre-existing
  defects newly exposed by this task's scope change — not caused by it, and not remediated per A2/§10.4.

## 14. Backlog update

`docs/backlog.md` "Last Session" block replaced (not appended) with a 4-line summary of this task. Task registry's
"Last used"/"NEXT FREE" pointer updated 734/735 → 735/736, and a new row added reserving 735 for the deferred
`System/FeaturedListings` enrolment. File remains within the ~80-line active-state budget (no `BACKLOG LIMIT
BREACH`).
