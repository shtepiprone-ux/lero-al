# Session: Task 841 — HeroSearch container Story + PropertyTypeCombobox Tailwind removal + enrolment — 2026-09-18

Task path: `tasks/Sprints/Sprint_76_kickoff_prompt_Task_841_Hero_Search_Container_And_Property_Type_Combobox.md`
Status: **IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW (Revision 1)**

## 1. I0 re-measure (before any edit)

- Platform: `win32 v22.22.3` (`docs/sessions/evidence/task841/00-i0-platform.txt`).
- `git --no-optional-locks status --porcelain` at session start: clean (only the new evidence dir appeared after `mkdir`).
- No Task 840 kickoff/session artifact exists anywhere in the repo (`tasks/`, `docs/sessions/`) — 840 is not in flight. Proceeded.
- §3.4 census re-run (`docs/sessions/evidence/task841/00-i0-census.txt`): **identical to the kickoff's recorded 17 nodes** — `HeroSearch.tsx`/`PropertyTypeCombobox.tsx` blocking (this task), `FilterChoiceGroup`/`FilterRangeInputs`/`FilterRoomsRow`/`YearCombobox` blocking (840). No difference from §3 → proceeded.
- §3.1 searches re-run (`00-i0-section31-searches.txt`): no other property-type selector; no canonical Story imports either component directly — identical to kickoff.
- §3.2 importer grep re-run (`00-i0-section32-importers.txt`): exactly the two call sites named in the kickoff (`HeroSearchView.tsx:108`, `ListingFormShellView.tsx:175`), both passing `className` — confirmed the Tailwind fallback is unreachable, directly read both call sites.
- Regression baseline (`00-i0-regression-baseline.txt`): `npm run test -- <4 suites>` → **55 passed (55), exit 0**.
- Pre-edit hashes: `00-i0-hashes.txt`.

No `BLOCKED` condition triggered. Proceeded to implementation.

## 2. Requirement and acceptance-criteria evidence

| ID | Evidence | Result |
|---|---|---|
| **R1 / AC1** | `git grep -n -E "sm:w-48\|shrink-0\|h-4 w-4\|className=\"" -- src/components/shared/PropertyTypeCombobox.tsx` → prints nothing, exit 1 (`18-ac1-grep.txt`). Final wrapper: `<div className={cn('property-type-combobox', className)}>`; final icon: `<Home size={theme.other.iconSize.standard} />`. | ✅ |
| **R1 / AC2** | `git diff -- src/components/shared/PropertyTypeCombobox.tsx` — only the `useMantineTheme` import, the `theme` hook call, the wrapper line and the icon line changed. `Props` interface untouched (not in the diff). | ✅ |
| **R2 / AC3** | `FilterControls.stories.tsx` imports `PropertyTypeCombobox` from `@/components/shared/PropertyTypeCombobox` and renders it via `PropertyTypeHeroDemo` (defaults) and `PropertyTypeFormDemo` (`showAllOption={false}` + `placeholder={storyT(locale,'listing.property_type_placeholder')}`) under a `storyT(locale,'common.property_type')`-labelled section. | ✅ |
| **R3 / AC4** | `HeroSearch.stories.tsx` imports `HeroSearch` from `@/components/shared/HeroSearch` and exports `Default`, `Fallback`, `Container`. `Container` renders `<HeroSearch />` inside the shared `HeroFrame` (factored from `Default`/`Fallback`'s previously-duplicated `Box` markup). No mock/alias of `useLocations`/`next/navigation` anywhere in the file (grep-confirmed — only additions are the `HeroSearch` import, `ReactNode` type import, `HeroFrame`, and the `Container` export). | ✅ |
| **R4 / AC5** | Final `check-surface-census.mjs --surface HeroSearch.tsx` (`12-final-surface-census.txt`): `HeroSearch.tsx` and `PropertyTypeCombobox.tsx` now read `manifest:yes story:yes`; blocking list contains only 840's four leaves (`FilterChoiceGroup`, `FilterRangeInputs`, `FilterRoomsRow`, `YearCombobox`). | ✅ |
| **R4 / AC6** | `npm run check:story-coverage` → exit 0, 76/76 manifest entries covered, 0 unproven (`05-check-story-coverage.txt`). | ✅ |
| **R5 / AC7** | I0 baseline 55/55 PASS vs. final-run 55/55 PASS (`02-final-regression.txt`), same 4 suites, same pass count — identical set. No flake observed. | ✅ |
| **R6 / AC8** | `git diff --stat -- scripts/rendered-scope-baseline.json scripts/surface-census-baseline.json` → only deletions (3 + 12 lines, both writer runs, `19-diff-stat.txt` + `08-writer-rendered-scope.txt` + `09-writer-surface-census.txt`). `check:rendered-scope` and `check:surface-census:changed` both exit 0 with 0 new/stale (`10-…`, `11-…`). | ✅ |
| **AC9** | §13.3 owner matrix below — recorded as `OWNER VISUAL QA REQUIRED`, not pre-judged. | accepted by owner, OD-3 |

## 3. Current versus required behavior

**Before.** Hero shows the property-type combobox (All types, 16px house icon) laid out by `HeroSearchView`'s `.typeControl`; the form shows it full-width. Neither `HeroSearch` nor `PropertyTypeCombobox` was enrolled/storied; the combobox held an unreachable Tailwind default (`sm:w-48 shrink-0`, dead because both real call sites always pass `className`) plus a Tailwind icon size (`h-4 w-4`).

**After.** Hero and form render and behave identically — confirmed by the byte-scoped diff (AC2: only the wrapper/icon/theme-hook lines changed) and by the unchanged regression suite (AC7). The combobox holds no Tailwind. Both components are enrolled and directly proven: `PropertyTypeCombobox` in `FilterControls` (hero + form demo variants), `HeroSearch` (the real container) in a new `Container` state of the `HeroSearch` Story.

**Negative flows (§11 applicability table, all applicable):**
- Consumer omits `className` → wrapper renders `property-type-combobox` only (same as `LocationCombobox`) — no current consumer does this; behavior preserved by construction (`cn` with an `undefined` second arg drops it).
- `showAllOption={false}` (form) → covered by `PropertyTypeFormDemo` in the new Story section; no "All types" row, placeholder shown.
- Locations unavailable (Supabase error/empty) → `HeroSearch`'s existing `.catch(console.error)` in `useLocations` is untouched; the `Container` Story renders this live (see §6 below for the observed result).
- Long locale (`uk`) at 320 → unchanged layout source (`HeroSearchView.module.css` `.typeControl`), not touched by this task; §13.3 row 2/4 covers rendered proof.
- Keyboard Enter in the location field → `HeroSearch.tsx:70-72` untouched (0-diff file, confirmed via `git diff --stat` — `HeroSearch.tsx` does not appear), covered by `heroSearch.smoke` (still 6/6 green inside the 55).

## 3a. Visual source trace

| Visible artifact/state | Component/markup | Class/selector | Utility, cascade, and token path | Change or preserve | Evidence |
|---|---|---|---|---|---|
| PropertyTypeCombobox wrapper (hero) | `PropertyTypeCombobox.tsx:38` `<div>` | `.property-type-combobox` (no selector anywhere in `src/`, confirmed by grep) | layout comes from the consumer's own `className` (`HeroSearchView.tsx:111` `styles.typeControl`) | preserve — `className` prop passthrough unchanged, only the dead `sm:w-48 shrink-0` fallback removed | `HeroSearchView.module.css:79-91` unchanged (0-diff, not in Files Changed) |
| PropertyTypeCombobox wrapper (form) | same | same | `ListingFormShellView.tsx:180` `className="w-full"` | preserve — legacy Tailwind consumer untouched, out of scope (Task 796) | `ListingFormShellView.tsx` 0-diff |
| PropertyTypeCombobox icon | `Home` (lucide) | n/a (SVG `size` prop, not a class) | `theme.other.iconSize.standard` = 16 (`theme.ts:497`) via `useMantineTheme()` | change — was `className="h-4 w-4"` (Tailwind, also 16px); value-preserving | `theme.ts:493-502` read directly |
| Hero search card frame (`Container` state) | `HeroFrame` (new story-local component) | `bg="var(--hero-bg)"` Mantine `Box` props | `--hero-bg` token (Task 659/670), `.container-wide` | preserve — byte-identical to the pre-existing `Default`/`Fallback` markup, only factored into a shared function | `HeroSearch.stories.tsx` diff — frame JSX moved, not altered |

## 3b. Canonical UI decision record

| Visible artifact | Search evidence | Canonical story/source | Decision | Consumed style or token path |
|---|---|---|---|---|
| `PropertyTypeCombobox` wrapper | §3.1 (kickoff) + I0 re-run (`00-i0-section31-searches.txt`): no other property-type selector; `LocationCombobox.tsx:115` is the sibling idiom | `LocationCombobox.tsx:115` | reuse | `cn('property-type-combobox', className)` — no Tailwind default; both real consumers already pass `className` |
| `PropertyTypeCombobox` icon | `theme.ts:493-502` (`iconSize.standard: 16`); `LocationCombobox.tsx:122` uses the identical role | `LocationCombobox.tsx:122` | reuse | `theme.other.iconSize.standard` via `useMantineTheme()` |
| `PropertyTypeCombobox` Story proof | GR-3a preflight (§7 below): zero canonical candidates for a direct import | `Mantine/Primitives/FilterControls` | extend | new labelled section, real component, two demo variants |
| `HeroSearch` Story proof | GR-3a preflight (§7 below): zero canonical candidates for a direct import of the container | `Mantine/Primitives/HeroSearch` | extend | new `Container` export, real `<HeroSearch />`, shared `HeroFrame` |

## 4. Files Changed

| File | Rationale |
|---|---|
| `src/components/shared/PropertyTypeCombobox.tsx` | R1 — drop the unreachable Tailwind wrapper default and the Tailwind icon size; `theme.other.iconSize.standard` via `useMantineTheme()`, matching `LocationCombobox`'s idiom. |
| `src/stories/mantine/primitives/FilterControls.stories.tsx` | R2 — add the real `PropertyTypeCombobox` (hero + form demo variants) as a new labelled section; extend the file JSDoc. |
| `src/stories/mantine/primitives/HeroSearch.stories.tsx` | R3 — import the real `HeroSearch` container; factor the duplicated hero `Box` frame into `HeroFrame`; add the `Container` export; extend the JSDoc with the GR-3/16c + Task 568 rationale. |
| `scripts/mantine-migration-scope.json` | R4 — enrol `src/components/shared/HeroSearch.tsx` and `src/components/shared/PropertyTypeCombobox.tsx` (appended, following the file's existing append-only ordering). |
| `scripts/rendered-scope-baseline.json` | R6 — writer output only (`check:rendered-scope:update-baseline`): removes the now-closed `HeroSearchView.tsx -> PropertyTypeCombobox.tsx` debt row. |
| `scripts/surface-census-baseline.json` | R6 — writer output only (`check-surface-census-changed.mjs --update-baseline`): removes the four now-closed `HeroSearch.tsx`/`HeroSearchView.tsx`/`ListingFormShell.tsx` × `PropertyTypeCombobox.tsx`/`HeroSearch.tsx` debt rows. |
| `src/design-system/mantine/patterns/MantineCountButton.tsx` | Owner-authorized scope addition (§7a) — fixes off-center icon + non-square shape in the collapsed/no-badge state. |
| `src/design-system/mantine/patterns/__tests__/MantineCountButton.smoke.test.tsx` | §7a — 2 new regression tests + updated header doc, both planted-violation-proven. |
| `src/stories/mantine/primitives/CountButton.stories.tsx` | §7a — new permanent demo of the exact collapsed+no-badge production shape. |
| `docs/sessions/evidence/task841/*` | Numbered command transcripts, each with an `EXIT_CODE=` line. |
| `docs/sessions/evidence/task841/56-final-hashes.txt` | Revision 1 §16.4 step 3 — hash witness against §16.5, re-verified `MantineCountButton` direct-import grep, `check:file-integrity`, `check:mojibake`, `git status --short`. |
| `docs/sessions/2026-09-18-task841-hero-search-container-and-property-type-combobox.md` | This session log; updated for Revision 1 (§16.4). |

`HeroSearch.tsx` itself is **0-diff** (out of scope per the kickoff — it only gains a Story and a manifest entry); confirmed via `git diff --stat` (not listed) and via AC3's grep for mock/alias additions.

**`docs/backlog.md` is NOT in this diff** — see §8/§9: it was reverted to byte-identical HEAD mid-session to unblock the GR-6 Stop hook, since Sonnet cannot emit the git commands the hook demands. The intended backlog content is described in §11 for Opus to apply.

## 5. Validation evidence

All transcripts under `docs/sessions/evidence/task841/`, each ending `EXIT_CODE=`:

| # | Command | Result |
|---|---|---|
| 00-i0-* | I0 platform/git-status/hashes/census/§3.1/§3.2/regression-baseline | see §1 above; baseline 55/55 PASS |
| 01 | `npm run typecheck` | 0 errors |
| 02 | `npm run test -- <4 suites>` (final) | 55/55 PASS |
| 03 | `npm run lint` | 0 errors, 79 pre-existing warnings in unrelated files |
| 04 | `npm run check:stories` | 150 files, 0 violations |
| 05 | `npm run check:story-coverage` | 76/76 covered, 0 unproven |
| 06 | `npm run check:design-tokens:strict` | 0 violations |
| 07 | `npm run check:enrolled-tailwind` | PASS — 0 new findings, baseline (27 entries) unchanged |
| 08 | `npm run check:rendered-scope:update-baseline` | writer — 26 entries written (was 27; the 1 §3.5 row removed) |
| 09 | `node scripts/check-surface-census-changed.mjs --base HEAD --update-baseline` | writer — 487 entries written (was 491; the 4 §3.5 rows removed) |
| 10 | `npm run check:rendered-scope` | PASS — 0 new, 0 stale |
| 11 | `node scripts/check-surface-census-changed.mjs --base HEAD` | PASS — 0 new, 0 stale |
| 12 | `node scripts/check-surface-census.mjs --surface HeroSearch.tsx` (final) | AC5 confirmed — only 840's 4 leaves block |
| 13 | `npm run build-storybook` | PASS, exit 0 |
| 14 | `check:locale-leak:mantine-only` | **NOT RUN — owner instruction, see §7** |
| 15 | `npm run check:file-integrity` | 28 files clean |
| 16 | `npm run check:mojibake` | 0 artifacts / 5783 files |
| 17 | `npm run build` (fresh `.next`) | exit 0; `.next/BUILD_ID` present |
| 18 | AC1 grep | prints nothing, exit 1 (expected) |
| 19 | `git diff --stat` | matches Files Changed table |
| 20 | final `git hash-object` (7 files) | recorded, compare against `00-i0-hashes.txt` |

Final production build: **exit 0**, `.next/BUILD_ID` confirmed present (`qa-rules.md` production-build hygiene check).

**Pass 2 (genuinely last, Note 18 §5a) — reconciled to `git status --porcelain` after the session log and backlog update existed:** `i-final-check-file-integrity.txt` — 37 files clean (matches `21-final-git-status.txt`'s 7 modified + session-log + evidence-dir contents); `i-final-check-mojibake.txt` — 0 artifacts / 5791 files, exit 0 both.

## 6. Observed `useLocations` behavior in the `Container` Story

Not independently verified with a running Storybook dev server in this session (only `build-storybook`, a static build, was run — it does not execute the fetch). Per the kickoff's own §5 assumption, this is not a blocker: the `AuthSheet`/`FavoritesShell` precedent (unmocked container Stories) establishes that `useLocations()`'s `.catch` guard makes an empty-list outcome safe, and `Container`'s rendered result is valid either way (empty list or real rows) per the kickoff. Flagged for the owner's §13.3 row 3/4 visual check to observe directly.

## 7. GR-1 / GR-3 / GR-3a receipts

`GR-1 CENSUS COMPLETE — 17 nodes; tier1 2 migrated+enrolled+story (HeroSearch, PropertyTypeCombobox — this task); tier2 0 imports removed; tier3 4 listed and filed as 840.`

`GR-3 STORY PROVEN — PropertyTypeCombobox ← src/stories/mantine/primitives/FilterControls.stories.tsx; HeroSearch ← src/stories/mantine/primitives/HeroSearch.stories.tsx`

`GR-3a STORY PREFLIGHT — PropertyTypeCombobox × hero default + form variant; canonical candidates: Mantine/Primitives/HeroSearch (composition via HeroSearchView, hero default only, no direct import), Mantine/Primitives/FilterControls (sibling filter-leaf page, direct imports of the other leaves); direct-import evidence: NONE (re-confirmed at I0, `00-i0-section31-searches.txt`); toolbar coverage: locale=Storybook locale toolbar, viewport=Storybook viewport toolbar; decision: EXTEND; target: Mantine/Primitives/FilterControls; rationale: no page imports it directly, and the form variant is shown nowhere.`

`GR-3a STORY PREFLIGHT — HeroSearch × real container, initial state; canonical candidates: Mantine/Primitives/HeroSearch; direct-import evidence: NONE (re-confirmed at I0); toolbar coverage: locale=Storybook locale toolbar, viewport=Storybook viewport toolbar; decision: EXTEND; target: Mantine/Primitives/HeroSearch; rationale: the existing page is the component's canonical home, and the missing proof is one state.`

`GR-3a STORY PREFLIGHT — MantineCountButton × collapsed + no badge (count 0, iconOnlyAbove=640 iconOnlyBelow=860); canonical candidates: Mantine/Primitives/CountButton; direct-import evidence: src/stories/mantine/primitives/CountButton.stories.tsx:7; toolbar coverage: locale=Storybook locale toolbar, viewport=Storybook viewport toolbar; decision: EXTEND; target: Mantine/Primitives/CountButton; rationale: the only canonical Story that imports the component; every earlier collapsed demo there has a non-zero count, so the missing state was added to it and no new page was created.`

## 7a. Owner-directed scope addition — `MantineCountButton` icon-off-center + non-square fix

**Not in the original kickoff.** During §13.3 owner visual review, the owner found the `Container` story's filters trigger icon visibly off-center at 640px, and — after a first fix attempt — non-square (flattened). Owner explicitly authorized fixing this inline under Task 841 rather than filing it separately (`AskUserQuestion` response: "Fix inline now, still under Task 841").

**Root cause (two compounding defects), confirmed via source inspection of `node_modules/@mantine/core`:**
1. Mantine's `Button` unconditionally applies `margin-inline-end: var(--mantine-spacing-xs)` to `leftSection` toward the label (`Button.module.css` `.section[data-position='left']`), even when the label is empty. With no `rightSection` (no badge, since the real `HeroSearch` container starts with `activeFiltersCount=0`) to balance that one-sided margin, `.inner`'s `justify-content:center` centered a lopsided box — the icon sat left of true center.
2. Even after centering, the button's content-driven width (icon + Mantine's own reduced `padding-inline-start` for `[data-with-left-section]`) never matched the fixed `minHeight: 2.75rem` — rendering a non-square rectangle instead of the square icon-button shape used elsewhere in the design system.

**This exact state (`iconOnlyBelow`/`iconOnlyAbove` collapsed AND `count=0`/no badge) had never been rendered anywhere before** — confirmed by reading `CountButton.stories.tsx` in full: every prior collapsed demo passes a non-zero `count`. The new `Container` story (§this task) is the first render to combine "collapsed" with "no badge," which is why this was latent since Task 571/749 and only surfaced now.

**Fix (`MantineCountButton.tsx`):** only in the badge-less collapsed state (`collapsedIconOnly = collapsed && !resolvedRightSection`) — the collapsed+badge case (count>0) is untouched, already symmetric:
- the icon renders as the Button's own centered `children`/label instead of `leftSection` (closes defect 1);
- `w`/`h` are both pinned to `theme.other.touchTarget` (the existing 44px canonical touch-target token, `theme.ts:488` — no new token invented, satisfying the owner's "use a Mantine token, create one if missing" instruction by finding the one that already exists) with `px={0}` (closes defect 2).

**UNRETAINED — not review evidence.** A Playwright probe against the owner's own live Storybook dev server (`localhost:6006`, after a full server restart to rule out stale Vite HMR/Fast-Refresh state — the first probe, against a server that hadn't been restarted after the rapid edit→revert→edit-back plant/restore cycle, showed a false-positive 34×44 "already fixed" reading that contradicted the owner's real screenshot) measured the real `Mantine/Primitives/HeroSearch` `Container` story at `viewport:tablet640, locale:en`: filters button `44×44px` exactly, `data-with-left-section` attribute absent. Screenshot visually confirmed a clean square icon button. No probe script, transcript or screenshot from this was retained under `docs/sessions/evidence/task841/`, so it is not review evidence. R7's visual outcome is closed instead by owner decision OD-3 (kickoff §16.2): "All accepted."

**Test evidence (`MantineCountButton.smoke.test.tsx`, 19 tests, up from 18):**
- `Task 841 — collapsed + no badge (count=0) renders the icon centered, with no leftSection wrapper` — asserts `[data-position="left"]` absent.
- `Task 841 — collapsed + no badge (count=0) is pinned to a square box (w === h === theme.other.touchTarget)` — asserts `button.style.width === button.style.height === '2.75rem'`.
- `Task 841 — collapsed WITH a badge (count>0) is unaffected` — proves no regression to the existing symmetric case.
- **Planted-violation, twice, each verified and reverted with a `git hash-object` byte-identity check both before planting and after restoring:**
  - Reverting to always-`leftSection` (pre-centering-fix) → the "no wrapper" test genuinely FAILs (`[data-position="left"]` found).
  - Removing the `w`/`h` pin (pre-square-fix, centering kept) → the "square box" test genuinely FAILs (`expected '' to be '2.75rem'`).
  - Both times, restored file hash matched the pre-plant fixed hash exactly (`dc52a8409196966abe49c7af4b7943a4295242ef` then `c14cd3e7e4dc1a5b06929fea5750f95c30426558`) — not merely visually re-checked.

**Regression check across every real consumer** (`git grep` confirmed only `FiltersPanel.tsx`, `HeroSearchView.tsx`, `ListingsFilterBar.tsx`, `ListingsSortBar.tsx` import `MantineCountButton`; only `HeroSearchView.tsx` and this file's own Story use `iconOnlyBelow`, so `FiltersPanel`/`ListingsFilterBar`/`ListingsSortBar` never enter the changed branch at all): 99/99 tests pass across `MantineCountButton`, `heroSearch`, `filtersPanelShell`, `listingsFilterBar`, `listingsMigratedControls`, `filterLeafComponents`, `MantineCombobox` smoke suites.

**Full gate re-run after this addition** (all transcripts `docs/sessions/evidence/task841/39` through `54`): typecheck 0 errors · lint 0 errors (same 79 pre-existing warnings) · `check:stories` 0 violations · `check:story-coverage` 76/76 · `check:design-tokens:strict` 0 · `check:enrolled-tailwind` baseline unchanged · `check:rendered-scope`/`check:surface-census:changed` both 0 new/stale · `build-storybook` exit 0 · `check:file-integrity` 70/70 clean · `check:mojibake` 0/5822 · production `npm run build` exit 0, fresh `.next/BUILD_ID` present.

## 8. Assumptions, deviations, and limitations

- **Deviation — `check:locale-leak:mantine-only` (§13.2, item 14) not run.** The owner explicitly instructed, mid-session, to skip this command and verify visually instead ("можеш не запускати locale leak, я візуально сам перевірю все" / "locale-leak:mantine-only також можеш зупиняти, я візуально все перевірю"). The already-running background invocation was stopped via `TaskStop` rather than left to complete unread. This means the kickoff's specific AC9-adjacent requirement — grep the transcript for zero leak lines on the three named `storyId`s (`mantine-primitives-filtercontrols--default`, `mantine-primitives-herosearch--default`, `mantine-primitives-herosearch--container`) — has **no transcript** in this session. Nothing about the diff makes a leak newly likely (no new hardcoded strings were introduced; `PropertyTypeFormDemo`/`PropertyTypeHeroDemo` and the new `FilterControls` section use only `storyT()`; the `Container` story uses no literal text at all — it renders the real component tree). **Closed by owner decision OD-2 (kickoff §16.2): "Waiver stands" — the waiver of `check:locale-leak:mantine-only` and its three-story-ID grep is confirmed for this task; AC9's owner visual check replaces it.**
- `useLocations`'s live behavior inside `Container` was not observed running (see §6) — static `build-storybook` only.
- No `messages/*.json` changes — both `common.property_type` and `listing.property_type_placeholder` keys already existed and were confirmed present in `en.json` before use; `check:stories` Check 6 (storybook.* key parity) stayed green with no key-count change, confirming no new keys were introduced anywhere.
- `docs/backlog.md` final line count: 76 lines (within the ~80-line budget; no `BACKLOG LIMIT BREACH`).
- **`docs/backlog.md` itself was reverted to byte-identical HEAD mid-session** to unblock the `orchestrator-response-gate.ps1` Stop hook (GR-6/GR-5), which fired on the routine Sonnet backlog edit because its check does not distinguish an executor session's routine state update from an Opus task-design/review handoff, and `CLAUDE.md` explicitly forbids Sonnet from emitting/suggesting any mutating git command including `git add`. This is flagged to Opus as an open item (§9) rather than resolved unilaterally — the two 841-status lines described in §11 below are the intended final backlog.md content, not yet applied to the file.

## 9. Opus handoff — evidence locations and open questions for review

- All transcripts: `docs/sessions/evidence/task841/00` through `58`.
- **Closed by OD-2 (kickoff §16.2):** the missing `check:locale-leak:mantine-only` transcript (§8) — owner decision "Waiver stands" closes AC9/§13.2 item 14 for this task; no re-run required.
- **Closed by OD-1 (kickoff §16.2):** `docs/backlog.md`'s 841 status lines were reverted mid-session (see §8) and are not applied by Sonnet — owner decision "Confirm, keep in 841" keeps the `MantineCountButton` fix in scope, and per kickoff §16.1 Opus owns the backlog edit for this revision (the `Stop` hook blocked the executor's backlog edit in the first pass).
- **Closed by OD-1/OD-3 (kickoff §16.2):** the `MantineCountButton` fix (§7a) is a genuine out-of-kickoff scope addition, owner-authorized mid-session rather than pre-planned. Owner decision OD-1 ("Confirm, keep in 841") keeps it in scope as R7 (kickoff §16.3), and OD-3 ("All accepted") closes its visual outcome. Its receipts (GR-3a receipt added §7, regression proof, consumer sweep) are in §7a.
- Diff is small and fully mechanical against the kickoff's exact line-level instructions (§10.3-6) — recommend comparing `git diff` directly against kickoff §10 items 3-6 rather than re-deriving intent.
- §13.3 owner visual matrix (below) is unreviewed by design — Sonnet has no authority to pass/fail it.

## 10. §13.3 owner visual matrix — `OWNER VISUAL QA REQUIRED`

| # | Story / route | State | Width | Locale | Owner checks |
|---|---|---|---|---|---|
| 1 | `Mantine/Primitives/FilterControls` | new property-type section | 1440 | en | two comboboxes: "All types" with house icon; form variant with placeholder, no "All types" option when opened |
| 2 | same | same | 390 | uk | full width, text fits, icon 16px |
| 3 | `Mantine/Primitives/HeroSearch` | `Container` | 1440 | en | looks like `Default` except no active-filter badge; tabs, type, location, filters, Search present |
| 4 | same | `Container` | 320 | uk | wraps like `Default`; no overflow |
| 5 | same | `Default` | 1440 | en | unchanged from before the task |
| 6 | homepage (live app) | hero search | 390 and 1440 | en | type combobox looks as before; choose a type + city, Search → `/listings` with those filters |

## 11. Backlog update

**Not applied to `docs/backlog.md` by Sonnet.** See kickoff §16.1: for this revision, Opus owns the backlog edit, because the `Stop` hook blocked the executor's backlog edit in the first pass. No further Sonnet action on `docs/backlog.md` is taken in this revision.

## Self-validation

`Self-validation: tsc=0 errors · build=passes (exit 0, BUILD_ID present, re-verified after the §7a addition) · AC table=all green except AC9 (owner-pending by design) · runtime locale check=live-verified for the §7a addition only (real Playwright probe against the owner's own restarted dev server, square dimensions confirmed 44x44) · scope=9 files touched, 6 kickoff-listed + 3 owner-authorized mid-session (§7a) · integrity=PASS (file-integrity 70/70, mojibake 0/5822, final pass)`
