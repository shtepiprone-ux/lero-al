# Task 820 — One rule for the pattern directory: session log (2026-09-11)

Task path: `tasks/Sprints/Sprint_75_kickoff_prompt_Task_820_One_Rule_For_The_Pattern_Directory.md`

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`

Evidence directory: `docs/sessions/evidence/task820/`

## 1. §13.1 baseline (pre-change), and R3's pre-change frontier projection

Captured before any tracked file changed. Platform `win32`, Node `v22.22.3`, cwd
`C:\Claude_Code_Projects\lero-al`, `git status --short` clean except this evidence directory.

| Command | Result | Transcript |
|---|---|---|
| `Get-ChildItem src\design-system\mantine\patterns -Filter *.tsx \| Measure-Object` | **33** | `Rev0_13.1_baseline.txt` |
| `npm run check:rendered-scope` | exit 0 — 38 manifest entries, 29 baselined / 0 new / 0 stale | `Rev0_13.1_check-rendered-scope.txt` |
| `npm run check:story-coverage` | exit 0 — 38 covered / 0 unproven | `Rev0_13.1_check-story-coverage.txt` |
| `npm run check:surface-census:changed` | exit 0 — 0 surfaces included (HEAD~1..HEAD is docs/tasks only), 690 carried | `Rev0_13.1_check-surface-census-changed.txt` |
| `npm run audit:design-system-patterns` | **exit 1** — 5 enrolled / 11 tier-3 / 17 ungoverned; fails naming `MantineCopyIdButton`, `MantineListingCardPattern`, `MantineListingDetailPattern` as `not-shared` | `Rev0_13.1_audit-design-system-patterns.txt` |

Matches the kickoff's §13.1 expectation exactly.

**R3 — the read-only frontier projection, before any tracked file changed.** Per §5's ASSUMPTION, this was
done as an edit-run-restore probe on the tracked manifest (the script hard-codes its path; no CLI flag
points it elsewhere), captured and reverted before any real edit:

1. `git hash-object scripts/mantine-migration-scope.json` → `9fdc9303c89d98d5e82f28e5ededb16f803924a3` (pre-probe).
2. Manifest temporarily overwritten with all 66 entries (current 38 + the 28 to be added).
3. `npm run check:rendered-scope:report` (always exit 0, never writes the baseline) — `R3_projection_check-rendered-scope-report.txt`:
   - **1 new tier1-unenrolled frontier edge**: `MantineListingGalleryPattern.tsx -> LightboxView.tsx` (a new edge because `MantineListingGalleryPattern` becomes a root).
   - **0 new tier2-legacy-primitive edges.** The three existing tier-2 edges (`ListingCard`/`PopularLocationsView` → `AppImage`, `AuthSheet` → `PasswordRequirementsHint`) are all already baselined. §5's `CONFLICT` does **not** fire.
   - The 11 previously-allowlisted entries become **stale** (expected — R5 requires their removal).
4. `npm run check:story-coverage` against the same scratch manifest — `R3_projection_check-story-coverage.txt` — **exit 1, 28 unproven**, not the 0 the kickoff's §3.1 assumed. See §2 below.
5. Manifest restored via `Write` to its exact original content (the script can't run `git checkout`, which is owner-only mutating git). `git hash-object` → `9fdc9303c89d98d5e82f28e5ededb16f803924a3` (matches). `git status --porcelain -- scripts/mantine-migration-scope.json` → empty.

## 2. A measured contradiction of the kickoff's own §3.1 assumption

`check-story-coverage.mjs` resolves an import specifier to a concrete file path but — unlike
`check-rendered-scope.mjs`/`audit-design-system-patterns.mjs` — never unwraps a single-hop `index.ts(x)`
barrel re-export (confirmed by reading `scripts/check-story-coverage.mjs` directly: it calls
`extractImportSpecifiers` + `resolveImportSpecifier` with no barrel-unwrap step). 27 of the 28
newly-enrolled patterns' own canonical Stories imported their component through the shared
`@/design-system/mantine/patterns` barrel — resolving to `src/design-system/mantine/patterns/index.ts`,
never to the individual component path the manifest names. The kickoff's §3.1 ("`check:story-coverage`
... will accept the other 27 the moment they are enrolled") assumed the resolver unwraps barrels; it does
not. Measured directly (`R3_projection_check-story-coverage.txt`, 28 unproven) before relying on the
assumption.

**Fix, applied as part of this task:** each of the 27 story files' own import switched from the barrel to
the direct component path — the exact convention `MantineAddItemPanel.stories.tsx`/
`MantineFilterSection.stories.tsx` already document for the five originally-enrolled patterns. Zero
behavior/visual change (same imported binding, same render); a one-line import-path edit per file. Files:
`AdminSurfacePattern`, `Combobox`, `CountButton`, `CopyIdButton`, `DropdownMenu`, `Drawer`,
`TwoColumnForm`, `ResponsiveActionFooter`, `PageHeaderWithActions`, `NotificationPattern`, `Progress`,
`Modal`, `Popover`, `NavigationMenu`, `FormSectionStack`, `ListingGalleryPattern`, `RangeDatePicker`,
`ListingCardPattern`, `Pagination`, `DialogDrawerPattern`, `ListingDetailPattern`, `AuthFormPattern`,
`ListingContactPattern`, `AppShellFoundation`, `Select`, `Table`, `Tooltip` (`.stories.tsx`, under
`src/stories/mantine/primitives/` or `src/stories/patterns/mantine/`). `src/stories/patterns/mantine/
ListingsFilters.stories.tsx` was **not** touched — it is a composition story for the already-enrolled
`ListingsFilters` component, not `MantineDrawer`'s own story; `MantineDrawer`'s own story
(`Drawer.stories.tsx`) already provides the required direct-import coverage. This is a deviation from the
kickoff's §7 Scope list (which did not name these 27 files) — required to satisfy the kickoff's own R4/R8/
AC5/AC12/AC14, not a drive-by refactor. `docs/storybook-governance.md` §15.8 and
`docs/design-system-pattern-ownership.md` §7 record it.

Also added: 4 new locale keys (`storybook.mantine.sheet_trigger_open/sheet_title/sheet_body`) to
`messages/{en,sq,uk,it}.json`, consumed by the new `ResponsiveBottomSheet` Story (agent-contract clause 7).

## 3. AC1 — reconciled census

`npm run audit:design-system-patterns` on the pre-change tree (`Rev0_13.1_audit-design-system-patterns.txt`)
reproduces the kickoff's §3 table exactly: **33** pattern files, **5** enrolled, **11** tier-3 allowlisted,
**17** ungoverned, **32** of 33 storied (`responsiveBottomSheet.tsx` the sole exception). No difference to
explain. The 28 added = the 11 tier-3 + the 17 ungoverned.

## 4. AC2/AC3 — the new canonical Story

New file: `src/stories/mantine/primitives/ResponsiveBottomSheet.stories.tsx`.

- `meta.title`: `'Mantine/Primitives/ResponsiveBottomSheet'` — satisfies `isCanonicalMantineTitle`
  (`MANTINE_STORY_TITLE_PREFIXES` includes `'Mantine/Primitives/'`).
- Import: `import { ResponsiveBottomSheet, SheetContent } from '@/design-system/mantine/patterns/responsiveBottomSheet'`
  — direct file import, resolves to `src/design-system/mantine/patterns/responsiveBottomSheet.tsx` exactly.
- Render: `<ResponsiveBottomSheet opened={...} onClose={...} title={t('sheet_title')}><SheetContent><Text>{t('sheet_body')}</Text></SheetContent></ResponsiveBottomSheet>` — the real production composition. `DragHandle` is not imported/placed manually; it is rendered unconditionally inside `ResponsiveBottomSheet`'s own `title` slot (`responsiveBottomSheet.tsx:142-150`), so it is present in the real composition without a stand-in.
- **AC3 — four tuples.** One exported `Default` story renders both a `ClosedSection` (resting, trigger
  button, `opened=false`) and an `OpenedSection` (`opened` fixed `true`, showing the full composition)
  stacked together — the same "multiple sections in one Default story" shape `Drawer.stories.tsx` already
  uses. `OWNER VISUAL QA REQUIRED` tuples (owner rule, `screenshots:assert` retired): `(ResponsiveBottomSheet/
  Default — ClosedSection, en, 390)`, `(ResponsiveBottomSheet/Default — OpenedSection, en, 390)`,
  `(ResponsiveBottomSheet/Default — ClosedSection, en, 1440)`, `(ResponsiveBottomSheet/Default —
  OpenedSection, en, 1440)`.

## 5. AC5 — manifest

`scripts/mantine-migration-scope.json`: **38 → 66** entries. The 28 added are exactly the 28 pattern paths
not previously enrolled (11 former tier-3 + 17 former ungoverned, listed in §3 above). No other entry
changed — the original 38, in original order, are all still present (see the file's `git diff`: pure
appends, byte-identical prefix). `git hash-object` (final): `aa44f6e940d0f541e8e64dcb8cfe7cfca84474c1`.

## 6. AC6 — allowlist

`scripts/rendered-scope-allowlist.json`: **13 → 2** entries. The 11 `owner: "816"` entries removed; the 2
`owner: "813"` entries (`ListingFeatureIcon.tsx`, `FavoriteButton.tsx`) byte-identical to their pre-task
content — see the file's own final content vs. the pre-task read in this session, unchanged field-for-field.
`git hash-object` (final): `bf09fd2f63b542faa14a63bfb44253203422b026`.

## 7. AC7 — `check:rendered-scope` on the final tree

Pre-baseline-update run (`Rev1_check-rendered-scope_pre-baseline.txt`): exit 1, 1 new tier1-unenrolled edge
(`MantineListingGalleryPattern.tsx -> LightboxView.tsx`, matching R3's projection exactly), 0 new tier2, 0
stale (the 11 removed allowlist entries no longer produce stale-allowlist findings because they're gone,
not because they're stale-but-ignored).

`npm run check:rendered-scope:update-baseline` (`Rev1_check-rendered-scope_update-baseline.txt`): **29 → 30**
entries written, 0 tier-2 refusals. Post-update run (`Rev1_check-rendered-scope_post-baseline.txt` /
`Rev2_rendered-scope.txt`): **exit 0, 0 new, 0 stale, 30 baselined.** Self-test
(`Rev2_rendered-scope_verify.txt`): all 5 arms pass. `git hash-object` (final baseline):
`5fbb26aa5cc57f2e77c5775ca3f8108e79adf5a5`.

## 8. AC8 — `check:surface-census:changed` on the final tree

This task's own diff touches **zero** production `src/` consumer files — only `scripts/mantine-migration-
scope.json`, `scripts/rendered-scope-allowlist.json`, `messages/*.json`, `package.json`,
`.github/workflows/governance-pr.yml`, docs, and 28 `.stories.tsx` files (excluded by the mapper's own
`story-or-test-file` rule). Run against `--base HEAD` (working-tree diff, local-probing form; CI supplies
real base/head SHAs) — `Rev2_surface-census-changed.txt`: **0 surfaces included, exit 0, 690 carried, 0 new,
0 stale.** `npm run check:surface-census:changed:update-baseline` (`Rev1_check-surface-census-changed_update-
baseline.txt`): **690 → 690**, `git status --porcelain` for the baseline file empty (byte-identical write).

**Delta explained, not glossed over:** the baseline's already-recorded debt includes blocks that name
now-enrolled-and-storied patterns directly (e.g. `src/app/[locale]/layout.tsx :: .../MantinePopover.tsx ::
tier1-unenrolled-or-unstoried` and `.../responsiveBottomSheet.tsx :: ...`). Those specific blocks are now
factually paid off, but the diff-scoped `--update-baseline` mechanism (Task 819's own design — Arm 7 of its
self-test) only regenerates entries for surfaces the CURRENT diff actually censuses; `layout.tsx` is not
touched by this diff, so its debt is correctly `carried`, not dropped. It will become `stale` (and get
dropped) the first time a future PR's diff actually touches that surface. This is the gate behaving as
designed, not a defect — see `docs/storybook-governance.md` §15.8 for the same note in context.

Self-test (`Rev2_surface-census-changed_verify.txt`): all 8 arms pass.

## 9. AC9 — the parity check on the final tree

New file: `scripts/check-pattern-enrolment.mjs` (+ `check:pattern-enrolment` / `check:pattern-enrolment:
verify` in `package.json`). `Rev2_check-pattern-enrolment.txt`: **exit 0**, prints its scanned/not-scanned/
cannot-see scope on every run, `33` pattern files found, `66` manifest entries, `PASS`.

## 10. AC10 — the planted-failure probe

One manifest entry (`MantineProgress.tsx`) removed via a Node script (never PowerShell `-Raw`, per §10.5).
`node scripts/check-pattern-enrolment.mjs` → **exit 1**, naming `src/design-system/mantine/patterns/
MantineProgress.tsx` as unenrolled (`AC10_planted-failure_probe.txt`, exit code captured unpiped, as its own
statement — not through `tee`, after an initial capture mistake using `tee` was caught and redone, see the
same file's history). Restored via `Write` to the exact 66-entry pre-probe content.
`AC10_restore-verification.txt`: `git hash-object` after restore = `aa44f6e940d0f541e8e64dcb8cfe7cfca84474c1`,
identical to the pre-probe hash; `git --no-optional-locks status --porcelain -- scripts/mantine-migration-
scope.json` → ` M scripts/mantine-migration-scope.json` (the same modified-from-HEAD status the file already
carried as part of this task's real diff — the probe left no additional delta). Post-restore run confirmed
`check:pattern-enrolment` passes again (66 entries, exit 0).

## 11. AC11 — CI wiring

`.github/workflows/governance-pr.yml`, `governance` job, immediately after the Task 819 self-test step:

```yaml
      - name: Pattern-directory enrolment gate (Task 820 — blocking, one rule for the pattern directory)
        run: npm run check:pattern-enrolment

      - name: Pattern-directory enrolment gate self-test (verifies gate detects violations — CI-safe, Task 820)
        run: npm run check:pattern-enrolment:verify
```

No `continue-on-error`, no `|| true`, no `exit 0`, no wrapper — same shape as every neighboring blocking step.

## 12. AC12 — the audit

`npm run audit:design-system-patterns` on the final tree (`Rev2_audit.txt`): **exit 0** — 33 enrolled / 0
tier-3 / 0 ungoverned. `git diff --stat scripts/audit-design-system-patterns.mjs` — empty (confirmed in the
final gate block, §14 below). The audit's logic was not touched; enrolment removed the invalid premise.

## 13. AC13 — documentation

- `docs/golden-rules.md` — GR-1's **Enforcement status table row only** gained a mention of
  `check-pattern-enrolment.mjs`/Task 820. No GR-n rule body, `Command` block, or receipt string touched
  (byte-identity check: `git diff` for this file shows only the one table row's cell text changed — see the
  file's own diff).
- `docs/storybook-governance.md` — new `§15.8` documenting the mechanism, the barrel-import discovery/fix,
  and the measured before/after state.
- `docs/design-system-pattern-ownership.md` — new `§7` recording decision 5's implementation, leaving §2-§6's
  dated 2026-09-11 pre-820 measurement untouched (it is a historical record, not rewritten).

No sentence in any of the three claims an enforcement state the measurements above do not support.

## 14. AC14 — final gate block (run last, after all edits)

All commands captured with their real (unpiped) exit codes; transcripts under
`docs/sessions/evidence/task820/`, filenames prefixed `Rev2_`.

| Command | Result | Transcript |
|---|---|---|
| `node --check scripts/check-pattern-enrolment.mjs` | silent, exit 0 | (inline, `Rev2_13.2_env.txt`) |
| `npm run typecheck` | exit 0 | `Rev2_typecheck.txt` |
| `npx eslint scripts/check-pattern-enrolment.mjs` | exit 0 (file ignored — `scripts/**` is ESLint-ignored repo-wide; confirmed the same for `check-rendered-scope.mjs`, not a new condition) | `Rev2_eslint.txt` |
| `npm run check:pattern-enrolment` | exit 0 | `Rev2_check-pattern-enrolment.txt` |
| `npm run check:pattern-enrolment:verify` | exit 0, 5/5 arms | `Rev2_check-pattern-enrolment_verify.txt` |
| `npm run audit:design-system-patterns` | exit 0 | `Rev2_audit.txt` |
| `npm run check:rendered-scope` | exit 0, 0 new/0 stale | `Rev2_rendered-scope.txt` |
| `npm run check:rendered-scope:verify` | exit 0, 5/5 arms | `Rev2_rendered-scope_verify.txt` |
| `check:surface-census:changed` (`--base HEAD`) | exit 0, 0 new/0 stale | `Rev2_surface-census-changed.txt` |
| `check:surface-census:changed --verify-gate` | exit 0, 8/8 arms | `Rev2_surface-census-changed_verify.txt` |
| `npm run check:story-coverage` | exit 0, **66 covered / 0 unproven** | `Rev2_story-coverage.txt` |
| `npm run check:stories` | exit 0, 145 files, 0 violations | `Rev2_check-stories.txt` |
| `npm run build` | **exit 0** (mandatory, agent-contract clause 9) | `Rev2_build.txt` |
| `npm run check:file-integrity` (git-changed+untracked) | exit 0 → 77 files clean, **after** fixing a self-inflicted defect (below) | `Rev2_file-integrity.txt` |
| `npm run check:file-integrity --all` (whole tracked repo) | **exit 1** — pre-existing, out-of-scope: **57** files fail, across `docs/sessions/evidence/task765/` (24), `docs/sessions/evidence/task767/` (1) and `docs/sessions/evidence/task778/` (32, including `plant-T6.txt`). Not this task's files, not fixed. | `Rev2_file-integrity_all.txt` |
| `npm run check:mojibake` | exit 0, 0 artifacts / 4475 files | `Rev2_mojibake.txt` |

**Self-inflicted defect found and fixed during validation:** the first pass of `check:file-integrity`
(git-changed+untracked) failed — 27 of this session's own evidence transcripts carried a stray UTF-8 BOM,
because they were captured via PowerShell `Out-File -Encoding utf8`, which adds a BOM on Windows PowerShell
5.1 (the exact pitfall §10.5/§10.6 of the kickoff warns about). Fixed by stripping the BOM from all 28
affected files via a Node script (never PowerShell `-Raw`). Re-run: exit 0.

`git diff --stat` for the five named unmodified scripts (`check-rendered-scope.mjs`,
`check-surface-census.mjs`, `check-surface-census-changed.mjs`, `map-changed-surfaces.mjs`,
`audit-design-system-patterns.mjs`): **empty** — confirmed via `git --no-optional-locks diff --stat`.

`git hash-object` of every changed/added file: `Rev2_hash-object_primary-files.txt` (13 entries) and
`Rev2_hash-object_story-imports.txt` (27 entries).

## Files Changed

| Path | Reason |
|---|---|
| `scripts/mantine-migration-scope.json` | +28 pattern paths (R4) |
| `scripts/rendered-scope-allowlist.json` | −11 retired tier-3 entries (R5) |
| `scripts/rendered-scope-baseline.json` | +1 new tier-1 frontier edge, via `--update-baseline` (R6) |
| `scripts/surface-census-baseline.json` | re-run via `--update-baseline`; byte-identical (690=690) — no production surface in this task's diff |
| `scripts/check-pattern-enrolment.mjs` | new — the parity check (R7) |
| `package.json` | +2 npm scripts for the parity check |
| `.github/workflows/governance-pr.yml` | +2 blocking CI steps for the parity check (R7/AC11) |
| `src/stories/mantine/primitives/ResponsiveBottomSheet.stories.tsx` | new canonical Story for `responsiveBottomSheet.tsx` (R2) |
| `messages/{en,sq,uk,it}.json` | +3 locale keys each for the new Story's fixture text (agent-contract 7) |
| 27 existing `*.stories.tsx` under `src/stories/mantine/primitives/` and `src/stories/patterns/mantine/` | switched each pattern's own canonical Story from the shared barrel import to a direct file import — required for `check:story-coverage` to recognize them once enrolled (§2 above); zero behavior/visual change |
| `docs/golden-rules.md` | GR-1 Enforcement status row only |
| `docs/storybook-governance.md` | new §15.8 |
| `docs/design-system-pattern-ownership.md` | new §7 |
| `docs/backlog.md` | Task 820 concise state line updated in place (no line-count growth) |

## Visual source trace

No pattern's visible markup, tokens, or styling changed. `responsiveBottomSheet.tsx` (source) is untouched;
its new Story consumes it as-is. The 27 import-path edits change only which module path a story's own
`import` statement resolves through — the runtime binding, render output, and DOM are identical either way
(barrel vs. direct import of the same named export). No visible artifact requires `OWNER VISUAL QA REQUIRED`
beyond §4's four `ResponsiveBottomSheet` tuples.

## Canonical UI decision record

`ResponsiveBottomSheet` — search: `docs/design-system-pattern-ownership.md` §2/§3, `scripts/mantine-
migration-scope.json`, `src/design-system/mantine/patterns/responsiveBottomSheet.tsx` (read in full).
Disposition: **reuse** — the production component and its `SheetContent`/`DragHandle` are consumed exactly
as authored; no new visual value, token, or style was introduced. Consumed token path: none new (the
component's own existing `bottomSheetDrawerStyles`/`theme.other.overlay.dragHandle` contract, unchanged).

## Assumptions, deviations, limitations

- **Deviation (required, not drive-by):** 27 existing story files outside the kickoff's §7 Scope list were
  edited (import-path only) — necessary to satisfy the kickoff's own R4/R8/AC5/AC12/AC14. See §2 above.
- **Assumption (stated, reversible):** `responsiveBottomSheet.tsx`'s Story placed at `src/stories/mantine/
  primitives/ResponsiveBottomSheet.stories.tsx`, title `Mantine/Primitives/ResponsiveBottomSheet` — it is a
  Drawer-based foundation primitive consumed by other patterns, the same shape as `Drawer.stories.tsx`
  (also a sibling in the same directory), not a `Patterns/Mantine/*` domain composition.
- **Assumption (stated):** "every current and future `.tsx`" (decision 5) excludes `index.ts` (not `.tsx`),
  `__tests__/`, `.module.css` — the directory currently has no subdirectories or excluded files, so this
  exclusion is stated but not yet exercised.
- **Limitation:** `check:surface-census:changed`'s baseline (690 entries) still carries debt naming
  now-enrolled-and-storied patterns for surfaces this task's diff did not touch (e.g. `layout.tsx`). Not a
  defect — see §8 — but it means the 690 number will not visibly shrink until a future PR's diff reaches
  those surfaces.
- **Limitation (pre-existing, out of scope):** `npm run check:file-integrity --all` fails on **57** files,
  across `docs/sessions/evidence/task765/` (24), `docs/sessions/evidence/task767/` (1) and
  `docs/sessions/evidence/task778/` (32, including `plant-T6.txt`) — all pre-existing, committed evidence,
  untouched by this session. Reported, not fixed (Revision 1 R12).
- No `CONFLICT`/`BLOCKED — OWNER DECISION REQUIRED` fired — R3 measured 0 new tier-2 edges.

## Opus handoff

Evidence root: `docs/sessions/evidence/task820/`. Please independently verify: (1) the barrel-import
discovery in §2 — re-derive at least 2-3 of the 27 story-file diffs directly; (2) the AC10 planted-failure
witness (`AC10_planted-failure_probe.txt` + `AC10_restore-verification.txt`); (3) that
`surface-census-baseline.json`'s 690=690 no-op is genuinely explained by zero production-surface changes in
this diff, not a mis-run `--update-baseline`; (4) the five named scripts' empty `git diff --stat`; (5) the
`Rev2_file-integrity_all.txt` pre-existing-defect claim against `git log`/`git status` for that exact path.
