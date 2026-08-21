# Task 762 — Tailwind runtime tokens in CSS Modules: the detector first, then the five modules

**Kickoff:** `tasks/Sprints/Sprint_62_kickoff_prompt_Task_762_tailwind_runtime_tokens.md` · **Sprint:** 62 ·
**QA profile:** `Q4 Release/Critical Flow` · **Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`

## Requirement and acceptance-criteria evidence

| Req/AC | Evidence |
|---|---|
| R1 (AC1) | `scripts/check-tailwind-runtime-tokens.mjs`, registered `npm run check:tailwind-runtime-tokens`, CI-wired in `.github/workflows/governance-pr.yml` (after the design-token strict gate). Exits 0 on the corrected tree — `docs/sessions/evidence/task762/armB-reverted-gate.log` (last clean run: 28 found = 28 baseline, 0 new debt, 0 stale). |
| AC2 / R1 | Two-armed plant, both genuinely failing, pre-plant census green under both — see "Two-armed plant" below. Both reverted and re-verified green. |
| AC3 / R1 | Baseline = 28 exact `{file, property}` pairs in `scripts/tailwind-runtime-token-baseline.json`. Derivation: live ownership scan (see "Ownership derivation" below), re-measured after R2's fix. |
| AC4 / R2 | `grep -rn -- "var(--default-transition" src/` → empty (exit 1 = no match). `docs/sessions/evidence/task762/ac4-empty-grep.log`. |
| AC5 / R2 | Live computed-style probe, one element per changed file, before AND after, via Storybook + Playwright. **0 delta in all 5 files** — see "Computed-style evidence" below. |
| AC6 | `docs/critical-flow-registry.md` row "Listing card rendering — Mantine pattern is the COMPLETE single source of truth" (Task 602/605) — `npx vitest run src/modules/listings/components/__tests__/ListingCard.smoke.test.tsx`: 13/13 PASS, exit 0 (`docs/sessions/evidence/task762/ac6-listingcard-smoke.log`). `npm run screenshots:assert -- --mantine-only`: result recorded below. Hover + `prefers-reduced-motion` supplementary probes captured live (see "MantineListingCardPattern hover/reduced-motion" below) — both assertions hold, `.cardTitle`'s transition-duration/-timing-function change is not targeted by the `prefers-reduced-motion` media query at all (only `.card`/`.imageSection img` are), so R2's change has zero interaction with that branch by construction, confirmed live. |
| AC7 | All gates run; results in "Validation evidence" below. `check:locale-leak` executed full mode; literal exit code and counts recorded there per D757-4a wording. |
| AC8 / R3 | `docs/design-system.md` §23.7 added, cross-references §22.3's banner and §23.6.c rather than duplicating it. |
| AC9 | `git status --porcelain` — see "Files Changed"; two pre-existing untracked files (`docs/sessions/2026-05-31-task-306-*.md`, `src/hooks/useIsMobile.ts`) predate this session (present in the session's starting `git status`) and were not touched. |
| AC10 | `npm run screenshots:assert -- --mantine-only` rendered-evidence result, stated as a diff outcome — see "Validation evidence". |

## Exact current state — re-measured 2026-08-21

**Method used:** ownership-based live scan (`scripts/check-tailwind-runtime-tokens.mjs`'s own `runScan`), not the kickoff's Python regex sweep. This is a **declaration-count** method (one row per referenced custom-property name per file, not per raw occurrence), so it is not directly comparable to the kickoff's raw-occurrence figures.

### Category A (this task's fix scope) — re-measured before R2

| File | Line(s) (pre-fix) | Form | Fixed to |
|---|---|---|---|
| `MobileBottomNavView.module.css` | 92 | `transition-timing-function: var(--tw-ease, var(--default-transition-timing-function))` — timing-function only, no duration declaration | `var(--tw-ease, cubic-bezier(0.4, 0, 0.2, 1))` — outer `--tw-ease` hook preserved (Category C, out of scope), inner Tailwind-default fallback replaced |
| `MobileNavDrawer.module.css` | 9-10 | plain form, both properties, marker on duration line | both replaced with literals; marker moved to match the literal's detected form |
| `MantineCopyIdButton.module.css` | 28-29 | same plain form + marker | same treatment |
| `MantineListingCardPattern.module.css` | 220, 226 | both guarded (`var(--tw-ease, …)` / `var(--tw-duration, …, .15s)`) | outer hooks preserved (Category C), inner Tailwind-default fallbacks collapsed to one literal `150ms`/`cubic-bezier(...)` fallback — resolved value unchanged |
| `NotificationItem.module.css` | 5-6 | plain form + marker | both replaced with literals |

Confirmed per-file: three files (`MobileNavDrawer`, `MantineCopyIdButton`, `NotificationItem`) broke outright pre-fix (duration → `0s` on Tailwind removal); `MantineListingCardPattern` degraded gracefully (`.15s` fallback); `MobileBottomNavView` was timing-only (no duration dependency at all). The five are not uniform, confirmed as the kickoff stated — **all five are now free of `--default-transition-*` dependencies.**

### Categories B/C/D — re-measured, ownership-derived (not pattern-matched)

**28 `{file, property}` entries, 5 files** (`scripts/tailwind-runtime-token-baseline.json`) — this DIFFERS from the kickoff's own "58 refs, 8 files" figure in two ways, both explained below, not carried forward unverified:

1. **Files.** My scan finds `HeroSearchView.module.css` (1 entry, bare `--spacing`) and `ListingCard.module.css` (7 entries, `--tw-*` family) as out-of-scope debt carriers — `ListingCard.module.css` matches the kickoff's own Category C file list; `HeroSearchView.module.css` does **not** appear in the kickoff's B/C/D file list at all. It was missed by the kickoff's pattern-based sweep because a bare `var(--spacing)` (Tailwind's own spacing multiplier, distinct from this project's `--spacing-N`) does not match any of the 4 shapes (`--default-transition-*`, `--text-*`, `--tw-*`, `--leading-/--ease-/--duration-`) the kickoff's regex filtered for. **Newly found by this task's ownership-based method, not by the kickoff's own census.** `FooterView.module.css`/`HeaderView.module.css`, named by the kickoff for Category B, do **not** appear in my scan at all — see the ownership-derivation limitation below.
2. **Category B is not detected by this gate.** `--text-sm`/`--text-sm--line-height`/etc. are declared inside `globals.css`'s own `@theme inline` block (its comment: "mirrors Tailwind v4 default sizes (visually inert)") — my ownership rule (declared in `globals.css`'s `@theme`/`@theme inline`/`:root`) classifies these as project-owned, so they are never flagged. This is a **named, acknowledged limitation** — see "Ownership derivation" below and `check-tailwind-runtime-tokens.mjs`'s own header comment. It is not silently missed: the gap is documented in the gate's own source, in `docs/design-system.md` §23.7, and here.

Both discrepancies are stated, not carried forward from the kickoff unverified, per the standing "the kickoff's own measured facts are not exempt" corollary.

## Ownership derivation (R1 — how the gate decides, and its limitation)

A name in `var(--…)` is classified into exactly one of three buckets, never "cannot classify":

1. **Project-owned** — declared in `src/app/globals.css`'s `@theme`/`@theme inline`/`:root` blocks (block-scoped extraction, reused from `check-css-var-resolvability.mjs`'s own `extractOwnedNames` precedent; `.dark` excluded, same reasoning). Not flagged.
2. **Known-external, non-Tailwind** — `--mantine-` prefix (Mantine's ~112 own runtime CSS variables; unrelated to Tailwind's presence — removing Tailwind does not remove Mantine). This mirrors `check-design-tokens.mjs`'s own `EXTERNAL_VAR_PREFIXES` precedent; without it every Mantine-styled module would false-positive. Not flagged.
3. **Everything else** — presumed Tailwind-owned, checked against the baseline.

**Investigated and rejected during design:** literally excluding `@theme inline` from bucket 1 (reading R1's "@theme/:root" phrasing at face value, since `globals.css` has no bare `@theme` block at all) was tested and produces a flood of false positives — `--space-N`, `--radius-lg`, `--icon-*`, `--control-h-*` and dozens of other genuinely project-owned tokens all live inside the one `@theme inline` block in this file, and none of them are Tailwind defaults. Measured: this reading flags essentially every migrated `.module.css` file in the repository. Rejected as producing an unusable baseline, not because it was inconvenient.

**Known, named limitation (not closed here):** bucket 1 cannot distinguish a name this project genuinely authors a distinct value for from a name `@theme inline` merely re-declares as an inert mirror of an identical Tailwind default. Verified empirically for `--text-sm--line-height`: Tailwind's own default (`node_modules/tailwindcss/theme.css:350`) is the unitless ratio `calc(1.25 / 0.875)`; this project's mirror (`globals.css:178`) is the absolute `1.25rem`; the shipped CSS emits `1.25rem` (this project's value, not Tailwind's), proving the two sources are not reliably distinguishable by a simple value-equality check either — the emission mechanism differs per-token in ways this session did not fully reverse-engineer. Category B (`--text-*` typography family) is real, latent debt of the identical risk class as this task's Category A, and is **not detected** by this gate. Named in the gate's own header comment, in `docs/design-system.md` §23.7, and here — not silently shipped as full coverage. The Sprint 62 plan names Task 763 (Category B/C/D closure) as the owner of closing this gap; it will need either a different ownership signal or explicit owner guidance on how to treat `@theme inline` mirrors.

**Fail-closed:** every reference resolves into exactly one of the three buckets above deterministically — there is no unclassifiable state to skip. `globals.css` unreadable or parsing to 0 owned names is a fatal exit 1, not a vacuous pass (matches `check-css-var-resolvability.mjs`'s own precedent).

## Two-armed plant (R1, AC2)

**Pre-plant census (both arms):** before each plant, `tsc`, `check:design-tokens --strict`, `check:stories`, and `npm run build` were run against the corrected (pre-plant) tree and confirmed green (see final validation table). Each arm's plant was then applied and the SAME four commands re-run — all four stayed green under both plants, proving none of them would have caught either defect.

### Arm A — new debt (re-introduce a category-A reference)

Planted `transition-duration: var(--default-transition-duration)` (with its original marker) back into `NotificationItem.module.css`.

| Command | Result under plant |
|---|---|
| `npx tsc --noEmit` | exit 0 (`armA-tsc.log`) |
| `npm run check:design-tokens -- --strict` | 0 violations, exit 0 (`armA-design-tokens.log`) |
| `npm run check:stories` | 129 files, 0 violations, exit 0 (`armA-stories.log`) |
| `npm run build` | 40/40 pages, exit 0 (`armA-build.log`) |
| `node scripts/check-tailwind-runtime-tokens.mjs` | **`❌ 1 Tailwind-owned reference(s) NOT in the baseline` — `NotificationItem.module.css var(--default-transition-duration)` — exit 1** (`armA-new-gate.log`) |

Reverted; re-run: gate exits 0, 28/28 (`armA-reverted-gate.log`); `git status --porcelain` on the file shows only the R2 fix (no plant residue).

### Arm B — as literally specified, plus a genuine stale-baseline supplementary test

**Task-design correction, recorded per the established "kickoff citation is wrong, correct in place" precedent (Task 757R Revision 1):** the kickoff's plant table labels Arm B ("delete one entry from the baseline while its reference still exists") as exercising "the stale-baseline rule." It does not. Deleting a baseline row while the code reference remains means the scan still **finds** that reference but the baseline no longer **contains** it — that is the *not-in-baseline* ("new debt") path, the same one Arm A exercises, not the *stale-baseline* path (which requires the inverse: a baseline row whose reference has been removed from the code). Both governing sentences in the kickoff's own R1 prose ("a reference that is not in the baseline → fail (new debt); a baseline entry whose reference no longer exists → fail (stale baseline)") are unambiguous and consistent with this; only the plant table's own label for Arm B is wrong. The gate still genuinely fails as AC2 requires (`exit ≠ 0`); the mechanism is simply the other rule. Both directions are proven below.

**As specified — delete `{HeroSearchView.module.css, --spacing}` from the baseline while the reference remains in the file:**

| Command | Result under plant |
|---|---|
| `npx tsc --noEmit` | exit 0 (`armB-tsc.log`) |
| `npm run check:design-tokens -- --strict` | 0 violations, exit 0 (`armB-design-tokens.log`) |
| `npm run check:stories` | 129 files, 0 violations, exit 0 (`armB-stories.log`) |
| `npm run build` | 40/40 pages, exit 0 (`armB-build.log`) |
| `node scripts/check-tailwind-runtime-tokens.mjs` | **`❌ 1 Tailwind-owned reference(s) NOT in the baseline` — `HeroSearchView.module.css var(--spacing)` — exit 1** (`armB-new-gate.log`) — the not-in-baseline path, not stale-baseline |

Reverted; re-run: gate exits 0, 28/28 (`armB-reverted-gate.log`).

**Supplementary — genuine stale-baseline direction:** with the baseline unchanged (28 entries, including `MantineListingCardPattern.module.css`/`--leading-tight`), temporarily removed the `--leading-tight` reference itself (`line-height: var(--leading-tight, 1.25);` → `line-height: 1.25;`):

```
❌  1 baseline entrie(s) whose reference no longer exists (stale baseline):
    src/design-system/mantine/patterns/MantineListingCardPattern.module.css  var(--leading-tight)
EXIT_CODE=1
```
(`supplementary-stale-baseline-gate.log`). Reverted; re-run: gate exits 0, 28/28 (`supplementary-reverted-gate.log`); `git hash-object` of the file after revert (`ad38011276694c91baab9c18dbbb70611bd64eb8`) matches its corrected-state hash recorded before any plant.

## Computed-style evidence (AC5)

Captured live via Storybook + Playwright (`storybook-static`, static-served, `getComputedStyle`), one element per changed file, in two full before/after cycles:

1. **After** (corrected code): `build-storybook-after.log` (exit 0) → `computed-styles-after.json`.
2. **Before**: all 5 files byte-restored to `HEAD` content via `git show HEAD:<path>` (never `git checkout`/`stash`), hash-verified against `HEAD` (`yes` for all 5) → `build-storybook-before.log` (exit 0) → `computed-styles-before.json`.
3. **Restored**: all 5 files re-edited back to the corrected content and hash-verified byte-identical to the pre-restoration recording (`MATCH` for all 5) → `build-storybook-final.log` (exit 0, the retained final build-storybook evidence for AC7).

| File | Element | Before | After |
|---|---|---|---|
| `MobileBottomNavView.module.css` | `.fab` | `duration=0.15s, timing=cubic-bezier(0.4, 0, 0.2, 1)` | identical |
| `MobileNavDrawer.module.css` | `.navLink` | `duration=0.15s, timing=cubic-bezier(0.4, 0, 0.2, 1)` | identical |
| `MantineCopyIdButton.module.css` | `.copyId` | `duration=0.15s, timing=cubic-bezier(0.4, 0, 0.2, 1)` | identical |
| `MantineListingCardPattern.module.css` | `.cardTitle` | `duration=0.15s, timing=cubic-bezier(0.4, 0, 0.2, 1)` | identical |
| `NotificationItem.module.css` | `.root` | `duration=0.15s, timing=cubic-bezier(0.4, 0, 0.2, 1)` | identical |

`transitionProperty` also recorded and unchanged in every case (not touched by this task). **0 delta across all 5 files, both properties.** `MobileBottomNavView` reports timing-function only in scope (no duration declaration existed to change; the file's `.15s` was already literal before this task and untouched).

### MantineListingCardPattern hover/reduced-motion (AC6 supplementary)

- Hover: `box-shadow` `none` → `rgba(16, 24, 40, 0.08) 0px 12px 16px -4px, rgba(16, 24, 40, 0.03) 0px 4px 6px -2px` — changes, matching the registry row's assertion.
- `prefers-reduced-motion: reduce` (browser-context emulation): `.card`'s `transition` computes `none`.
- `.cardTitle`'s own `transition-duration`/`transition-timing-function` (the property this task changed) are **not** targeted by the `@media (prefers-reduced-motion: reduce)` rule at all — only `.card`/`.imageSection img` are (`MantineListingCardPattern.module.css:72-83`). R2's change to `.cardTitle` therefore has zero interaction with this branch by construction; confirmed live, not merely asserted.

## Files Changed

| File | Reason |
|---|---|
| `scripts/check-tailwind-runtime-tokens.mjs` (new) | R1 — the gate. |
| `scripts/tailwind-runtime-token-baseline.json` (new) | R1 — 28 Category B/C/D entries. |
| `package.json` | R1 — `check:tailwind-runtime-tokens` script registration. |
| `.github/workflows/governance-pr.yml` | R1 — CI wiring, after the design-token strict gate. |
| `src/components/layout/MobileBottomNavView.module.css` | R2 — timing-function literal, `--tw-ease` hook preserved. |
| `src/components/layout/MobileNavDrawer.module.css` | R2 — both properties literal. |
| `src/design-system/mantine/patterns/MantineCopyIdButton.module.css` | R2 — both properties literal. |
| `src/design-system/mantine/patterns/MantineListingCardPattern.module.css` | R2 — inner fallbacks collapsed to literals, `--tw-ease`/`--tw-duration` hooks preserved. |
| `src/modules/notifications/components/NotificationItem.module.css` | R2 — both properties literal. |
| `docs/design-system.md` | R3 — new §23.7. |
| `docs/sessions/evidence/task762/*` (new) | Retained evidence artifacts. |
| `docs/sessions/2026-08-21-task762-tailwind-runtime-tokens.md` (new) | This session log. |
| `docs/backlog.md` | Concise state update. |
| `tasks/Sprints/Sprint_62_Tailwind_Runtime_Tokens_Outlive_Tailwind.md` | Tasks table state update. |

`scripts/_tmp-task762-computed-style.mjs` (one-off capture tooling) deleted before handoff, same convention as Task 757R's `_tmp-task757R-*.mjs`.

## Validation evidence

| Command | Result |
|---|---|
| `npm run check:tailwind-runtime-tokens` | 28 found = 28 baseline, 0 new debt, 0 stale, exit 0 |
| `npx tsc --noEmit` | exit 0 (`final-tsc.log`) |
| `npm run check:design-tokens -- --strict` | 0 violations, 0 stale-marker(s), 0 missing-reason error(s), exit 0 |
| `npm run check:i18n` | 2218 keys × 4 locales, parity PASSED, exit 0 (`final-i18n.log`) |
| `npm run check:story-coverage` | every manifest-enrolled component covered, exit 0 (`final-story-coverage.log`) |
| `npm run check:stories` | 129 files, 0 violations, exit 0 (`final-stories.log`) |
| `npm run build-storybook` (final) | built, exit 0 (`build-storybook-final.log`) |
| `npm run build` (final) | 40/40 pages, exit 0 (`build-final.log`) |
| `node scripts/check-locale-leak.mjs` (full) | see below — attributed per D757-4a |
| `grep -rn -- "var(--default-transition" src/` | empty (AC4) |
| `npx vitest run …/ListingCard.smoke.test.tsx` | 13/13 PASS, exit 0 |
| `npm run screenshots:assert -- --mantine-only` | see below (AC6/AC10) |

**`check:locale-leak` (full mode, D757-4a):** `EXIT_CODE=1`, **328 leaks / 46 story titles** — byte-identical to Task 757R's own recorded baseline (328/46), **zero drift since 757R**. `NotificationItem/All Cases` carries 3 of the 328 (`sq`/`uk`/`it` × `"Statusi i listimit u ndryshua"`, a hardcoded Albanian fixture `title` string in the story, not an i18n key) — this diff touches only `.module.css` transition properties, never story fixture text/props, so it cannot have produced or changed this finding; confirmed pre-existing by the identical 328/46 total. Full transcript: `docs/sessions/evidence/task762/check-locale-leak-full.log`; report: `.screenshots/locale-leak/2026-08-21T15-02/report.json`.

**`screenshots:assert --mantine-only` (AC6/AC10):** `1209/1316 PASS, 80 FAIL, 27 AMBIGUOUS`, exit 1 (`docs/sessions/evidence/task762/ac6-ac10-screenshots-assert.log`). **All 80 FAIL + 27 AMBIGUOUS cells are on unrelated stories** — grepped the full failure/ambiguous listing for the 5 changed files' names: zero matches. All 80 failures are `Patterns/Mantine/AuthSheet/*` (`text button not full-width at <640` layout finding + `page.goto: Timeout 20000ms exceeded` navigation errors, matching the documented pre-existing "late-run Playwright browser crash unrelated to this task's stories" class recorded at Task 571/606). **The 5 changed files' own enrolled stories: 80/80 PASS** — `mantine-primitives-copyidbutton--default` 16/16, `mantine-primitives-mobilebottomnavview--guest` 16/16, `mantine-primitives-mobilebottomnavview--authenticated` 16/16, `mantine-primitives-mobilenavdrawer--default` 16/16, `patterns-mantine-listingcardpattern--default` 16/16 (all verdict `pass`, queried directly from `.screenshots/rendered-assert/2026-08-21T15-06/manifest.json`). `NotificationItem` is not enrolled in this gate's `mantine-migration-scope.json` manifest (its `Notifications/` title prefix is outside `Mantine/Primitives/`/`Patterns/Mantine/`) — covered instead by the live computed-style capture and the 13/13 `ListingCard.smoke.test.tsx` pass above. **AC10 diff outcome: zero delta** — no cell that exercises a changed class regressed; the full FAIL/AMBIGUOUS set is pre-existing noise on stories this diff never touches.

## Assumptions, deviations, and limitations

- Category B (`--text-*` typography mirrors inside `globals.css`'s `@theme inline`) is not detected by this gate — see "Ownership derivation" above. Named, not silently shipped.
- The kickoff's own Category B/C/D file/reference counts ("58 refs, 8 files") were not reproduced by this task's ownership-based method; this task's own re-measurement (28 entries, 5 out-of-scope-file baseline rows: `MobileBottomNavView`, `HeroSearchView`, `MantineListingCardPattern`, `ListingCard` carry baseline debt; `MobileNavDrawer`/`MantineCopyIdButton`/`NotificationItem` are fully clean after R2) is what is actually enforced. `HeroSearchView.module.css` is a newly-found baseline file the kickoff's pattern sweep missed (bare `--spacing`).
- Arm B's plant-table label ("stale-baseline rule") does not match its own mechanism — corrected above, both real directions independently proven.
- One-off evidence-capture tooling (`scripts/_tmp-task762-computed-style.mjs`) deleted before handoff.
- `docs/backlog.md`'s pre-edit baseline was `git show HEAD:docs/backlog.md | wc -l` = 79 lines, read before any edit in this session.

## Opus handoff

Evidence: `docs/sessions/evidence/task762/`. Open questions for review: (1) is the Category B ownership gap (documented above) acceptable for this task's closure, or does it need a design change before approval; (2) the Arm B plant-table correction — confirm the two-directions-proven approach satisfies AC2's intent; (3) `HeroSearchView.module.css`'s newly-found baseline entry — confirm it belongs in this task's baseline (out-of-scope-fix, in-scope-gate) rather than a scope violation. No mutating Git run; no commit/push suggested.

## Backlog update

See `docs/backlog.md` "Last Session", the Sprint 62 line, and the 762 registry row — all updated to `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. Pre-edit baseline 79 lines (`git show HEAD:docs/backlog.md | wc -l`); post-edit 79 lines — no `BACKLOG LIMIT BREACH`.

Status: **`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`**
