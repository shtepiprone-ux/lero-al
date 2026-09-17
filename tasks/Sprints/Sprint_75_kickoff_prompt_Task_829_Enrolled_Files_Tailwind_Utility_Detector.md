# Task 829 — Manifest enrolment is not a Tailwind check: a compiler-backed detector for Tailwind utilities in enrolled files, the 3 non-gallery tokens migrated, the 27 gallery tokens baselined to Task 794

Sprint 75 · P2 · QA profile **Q4**

**Status: `NEEDS REVISION` 2026-09-17 (review 1).** Re-entry is **§16** — read it first; it overrides R6, R7, AC7 and
§13.2 where they differ. Route fixed by owner decision 2026-09-17 (§5.1). **Sequence after Task 830** (both edit
`docs/design-system.md`).

## 1. Mode and task type

`IMPLEMENTATION` — a new blocking governance gate with a remove-only baseline, plus a value-preserving de-Tailwind of
two enrolled patterns. Bundles: **Regression / Critical Flow Coverage** (new gate), **UI / Mantine current path** (two
patterns), **TailAdmin / Styling Governance**.

## 2. Objective

`scripts/mantine-migration-scope.json` enrolment tells every census "migrated", but nothing checks that an enrolled file
has stopped rendering Tailwind utilities. Build `check:enrolled-tailwind`. It extracts static class tokens from every
enrolled file's `className`/`classNames` expressions and asks the project's own Tailwind compiler which of them
generate CSS. It is blocking in CI, prints its scope and blind spots, and proves itself with planted arms. Migrate the 3
tokens owned by this task to canonical Mantine sources. Record the 27 gallery tokens in a versioned, remove-only
baseline owned by Task 794, which is obliged to empty it.

## 3. Verified context — measured 2026-09-17 on `HEAD` `c177a0920`

### 3.1 The measured set

`FACT` — `docs/sessions/evidence/task829/design/01_manifest-tailwind-compile-scan.txt` (script
`90_scan829.mjs`; `tailwindcss` 4.3.0; `@tailwindcss/node` `__unstable__loadDesignSystem(globals.css).candidatesToCss`):
`manifest entries 73; files with Tailwind-compiling className tokens 4`:

| File | Tokens | Owner |
|---|---|---|
| `src/modules/listings/components/ListingDetailView.tsx` | `hidden` (1) | **794** |
| `src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx` | `flex items-center justify-center bg-muted h-[var(--listing-gallery-h-mobile)] sm:h-[var(--listing-gallery-h-tablet)] md:h-[var(--listing-gallery-h-desktop)] h-10 w-10 text-muted-foreground relative overflow-hidden rounded-lg absolute inset-0 block h-full w-full shrink-0 pointer-events-none bottom-2 left-2 rounded-full px-2 py-0.5 text-xs` (26 distinct) | **794** |
| `src/design-system/mantine/patterns/MantineListingContactPattern.tsx` | `animate-spin` (1) | **829** |
| `src/design-system/mantine/patterns/MantineListingDetailPattern.tsx` | `shrink-0 text-muted-foreground` (2) | **829** |

`FACT, EXECUTED` — false-positive probe inside the same scan: global non-Tailwind classes present in enrolled files
(`container-wide` in `MantineHomeSection.tsx:51`, `featured-listings`/`latest-listings` in the Views, and the
`listing-card` family) produced **no** finding. CSS-module references (`styles.x`) produce no string token.

`FACT` — the Task 825 heuristic (`docs/sessions/evidence/task825/design/02_manifest-tailwind-utility-scan.txt`) found
3 files and missed `MantineListingContactPattern.tsx`. The compiler oracle is strictly more complete on this set.

### 3.2 Why the gallery tokens belong to 794

`FACT` — `docs/backlog-reserved.md:18` (794, Sprint 71): "**The LCP mechanism is the constraint, not the layout** —
the static frame emits the `fetchPriority="high"` `<img>` into the SSR HTML and `ListingGallery`'s `useEffect` swaps it
for `#gallery-interactive-shell`, keyed on three DOM ids and the shared `--listing-gallery-h-*` heights;
`MantineListingGalleryPattern` reproduces none of it … so this task decides whether the pattern adopts the mechanism".

`FACT` — `ListingDetailView.tsx:335` `<div id="gallery-interactive-shell" className="hidden">` and
`MantineListingGalleryPattern.tsx:67,76` (`h-[var(--listing-gallery-h-*)]`) are that mechanism's DOM.

### 3.3 The 3 tokens this task migrates

`FACT` — `MantineListingContactPattern.tsx:205,219`:
`leftSection={loading ? <Loader2 size={theme.other.iconSize.comfortable} className="animate-spin" /> : <Phone|MessageCircle …/>}`
on `color="brand"` / `color="green"` filled `Button`s. Canonical Mantine precedent in enrolled code:
`SaveSearchButton.tsx:97` `leftSection={isPending ? <Loader size={theme.other.iconSize.compact} color="white" /> : <Bookmark …/>}`
(also `ListingsShellView.tsx:170`, `SaveToCollectionButton.tsx:226`).

`FACT` — `MantineListingDetailPattern.tsx:220,227,233` `<MapPin|Eye|CalendarDays size={theme.other.iconSize.standard} className="shrink-0 text-muted-foreground" />`,
and `:250` `<span className="shrink-0 text-muted-foreground">{f.icon}</span>`, each a child of
`<Group gap="tight" wrap="nowrap">` beside `<Text … c="dimmed">`.

`FACT` — `text-muted-foreground` resolves to `var(--muted-foreground)`, defined in `:root` at `src/app/globals.css:439`
(`var(--neutral-500)`) and in `.dark` at `:556`. It is **not** a Tailwind `@theme` name (`@theme`'s own is
`--color-muted-foreground`, `:48`), so it survives removing Tailwind. Migrated Mantine code already consumes it directly:
`FeaturedListingsView.tsx` `c="var(--muted-foreground)"`. Lucide icons accept a `color` prop
(`ListingsFilters.tsx:139` precedent). `flexShrink: 0` via `style` has enrolled-pattern precedent
(`GalleryThumbnailButton.tsx:26`, `MantineCombobox.tsx:252`).

`FACT` — Stories: `Patterns/Mantine/ListingContactPattern` (`Default` renders a `loading` state, story `:104-121`) and
`Patterns/Mantine/ListingDetailPattern` (`Default`).

`GR-1 CENSUS COMPLETE — 8 nodes; tier1 8 migrated+enrolled+story; tier2 0 imports removed; tier3 0 listed and filed as
none.` (`02_census_MantineListingDetailPattern.tsx.txt`; the ContactPattern census is a 1-node subset,
`02_census_MantineListingContactPattern.tsx.txt`.)

### 3.4 Where it plugs in

`FACT` — `.github/workflows/governance-pr.yml:119-125`, `governance` job: `check:story-coverage`, then
`check:rendered-scope` and its `:verify`, all blocking. `docs/design-system.md` §23 holds every detector's contract, and
the last subsection is §23.9 (`:1568`).

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | §5.1 | New `scripts/check-enrolled-tailwind.mjs`. Scope: exactly the paths in `scripts/mantine-migration-scope.json`. A listed path that does not exist is a fail-closed error (exit 2). | **P0** | AC1, AC3 | Confirmed |
| **R2** | §3.1 | Extraction via the TypeScript AST, per file: JSX attributes `className` and `classNames`. Inside their expressions, collect string literals, no-substitution templates, template static parts, and string leaves of object/array literals. Recurse into conditional/logical expressions and **all** call arguments (`cn`, `clsx`, …). Identifiers resolve to module-level `const` initializers (recursively, with cycle guard), including property/element access on such consts. Tokens = whitespace split. | **P0** | AC3 | Confirmed |
| **R3** | §3.1 | Oracle: a token is a Tailwind utility iff the project design system (`@tailwindcss/node` `__unstable__loadDesignSystem` over `src/app/globals.css`) returns non-null CSS for it (`candidatesToCss`). If that API is missing or throws, the gate exits 2 naming it. It never passes on a failed oracle. | **P0** | AC3 | Confirmed |
| **R4** | §5.1, §3.2 | Baseline `scripts/enrolled-tailwind-baseline.json`: `{ "version": 1, "entries": { "<file> :: <token>": { "count": n, "owner": "794", "reason": "…" } } }`. `count` = occurrences of the token in that file's extracted set. The real run fails (exit 1) on a key not in the baseline, on a count above baseline (**new**), or on a baseline key whose count dropped or vanished (**stale**, with the command to fix it). | **P0** | AC2, AC3 | Confirmed |
| **R5** | §5.1 | Writers. `--seed-baseline` runs only when the baseline file does not exist. It writes only findings in `SEEDABLE_FILES = [MantineListingGalleryPattern.tsx, ListingDetailView.tsx]` (constant, with the owner decision date in a comment), and refuses with no write if any finding exists outside them. `--update-baseline` may only lower counts or delete keys; any key or count increase is refused with no write. | **P0** | AC3 | Confirmed |
| **R6** | §3.3, §16 | `MantineListingContactPattern.tsx`: both loading icons become `<Loader size={theme.other.iconSize.comfortable} color="currentColor" />` (Mantine `Loader`). **Revision 1:** not `color="white"` — the button is `disabled` while loading, and white arcs measured ≈1.24:1 on its background (§16.1). `Loader2` import removed if unused. | **P0** | AC4, AC5, AC7 | Confirmed |
| **R7** | §3.3, §16 | `MantineListingDetailPattern.tsx`: the three lucide icons use `style={{ color: 'var(--muted-foreground)', flexShrink: 0 }}` with no `className` (**Revision 1:** the lucide `color` prop sets the `stroke` attribute and does not set the CSS `color` property, measured §16.1). The features `<span>` becomes `<Box component="span" c="var(--muted-foreground)" style={{ flexShrink: 0 }}>`. Computed `color` and `flex-shrink` of all four are identical before and after (value-preserving). | **P0** | AC4, AC5 | Confirmed |
| **R8** | GR-2 | Every run prints: scope (manifest path + entry count), oracle (Tailwind version + CSS entry), baseline path and entry count, and **cannot see**: class strings built in another module and imported, runtime-computed strings (function returns), Tailwind applied through CSS (`@apply` in `.module.css`), non-enrolled files (owned by `check:surface-census:changed`), and `class`/other attribute names. | P1 | AC1 | Confirmed |
| **R9** | Q4 | `--verify-gate`, synthetic in-memory fixtures (no tracked writes): (1) literal Tailwind `className` → finding; (2) `container-wide listing-card` → none; (3) `className={styles.x}` → none; (4) module const string used via `cn(A, 'p-2')` → both tokens found; (5) `classNames={{ root: 'flex' }}` → finding; (6) key absent from baseline → exit 1; (7) baseline key with count above current → stale, exit 1; (8) `--seed-baseline` with a finding outside `SEEDABLE_FILES` → refused, no write; (9) oracle loader injected to throw → exit 2; (10) the `--update-baseline` decision function given a current count above the prior baseline → refused, and the write function is not called. | **P0** | AC3 | Confirmed |
| **R10** | CI | `package.json`: `check:enrolled-tailwind`, `check:enrolled-tailwind:verify`, `check:enrolled-tailwind:update-baseline`. `governance-pr.yml` `governance` job: the gate and its `:verify` as two blocking steps immediately after `check:rendered-scope:verify`. | **P0** | AC6 | Confirmed |
| **R11** | docs | `docs/design-system.md` new §23.10 "Enrolled files carry no Tailwind utilities: `check:enrolled-tailwind` (Task 829)": detects, oracle, baseline semantics, the remove-only rule, the 794 ownership quote, and R8's blind spots. | P1 | AC6 | Confirmed |
| **R12** | GR-5 | The 794 obligation was recorded at task design (2026-09-17) in `docs/backlog-reserved.md` (794 row) and `tasks/Sprints/Sprint_71_The_Listing_Detail_Route_Leaves_Tailwind.md` (794 row), naming 27 keys. The executor confirms the seeded baseline holds 27 keys. Only if it differs does it correct the number in both rows. | P1 | AC6 | Confirmed |

## 5. Assumptions and open questions

### 5.1 Owner decisions — 2026-09-17, quoted verbatim

> ми не покриваємо тестами TailWind Stories, ми покриваємо лише Minetine, тому всі Tailwind Stories мають бути
> виключені з тестів!

On Task 829, same session:

> Детектор + 3 токени, галерея в 794 (Recommended)

Option text shown to the owner: "829 додає блокуючий детектор із самотестом, мігрує DetailPattern і ContactPattern.
27 галерейних токенів ідуть у versioned fail-on-new baseline з власником 794; 794 зобов'язаний його спустошити."

### 5.2 Assumptions and stops

- `ASSUMPTION` (I0) — the scan still yields §3.1's set. **Stop:** a finding in any file not in §3.1 is `BLOCKED` with
  the file and tokens. It is not seeded (R5 refuses it) and not migrated ad hoc.
- `ASSUMPTION` — the Loader swap is a visible change: a Mantine oval replaces the lucide ring. Precedent makes it the
  canonical spinner. Owner visual review decides (§13.3). R7 is value-preserving and is measured.
- **Stop:** if R7's before/after computed values differ, return `BLOCKED` with both.
- `__unstable__loadDesignSystem` is an unstable Tailwind API. R3's exit 2 makes a future breakage loud. The version is
  printed (R8).

## 6. Pre-read rule bundle

`docs/golden-rules.md` · `docs/agent-contract.md` 9, 13, 14, 15, 16–16d · `docs/qa-profiles.md` (Q4) ·
`docs/mantine-responsive-design-system.md` (Loader / icon color usage) · `docs/tailadmin-style-reference.md` (spinner,
muted text) · `docs/component-rules.md` · `docs/design-system.md` §23 intro, §23.7, §23.9 · `scripts/check-rendered-scope.mjs`
(baseline + self-test shape to mirror) · `docs/sessions/evidence/task829/design/*` · the two pattern files and their stories ·
`SaveSearchButton.tsx:90-100` · this kickoff.

## 7. Scope

- **New:** `scripts/check-enrolled-tailwind.mjs` · `scripts/enrolled-tailwind-baseline.json` (produced by
  `--seed-baseline`, never hand-written).
- **Edited:** `src/design-system/mantine/patterns/MantineListingContactPattern.tsx` ·
  `src/design-system/mantine/patterns/MantineListingDetailPattern.tsx` · `package.json` (3 scripts) ·
  `.github/workflows/governance-pr.yml` (2 steps) · `docs/design-system.md` (§23.10) · `docs/backlog.md` (829 state). Conditionally (R12, only on a key-count mismatch):
  `docs/backlog-reserved.md` (794 row) · `tasks/Sprints/Sprint_71_The_Listing_Detail_Route_Leaves_Tailwind.md` (794 row).
- **Written:** `docs/sessions/evidence/task829/*` (not `design/`) · `docs/sessions/<date>-task829-*.md`.

## 8. Out of scope

`MantineListingGalleryPattern.tsx` and `ListingDetailView.tsx` source (794) · the manifest · stories (no story change is
needed: both existing stories render the changed states) · every other detector.

## 9. Current and required behavior

**Before.** An enrolled file can hold any number of Tailwind utilities and every gate reads it as migrated. Contact
loading shows a lucide spinner via Tailwind `animate-spin`, and detail meta icons are muted via Tailwind.
**After.** A new Tailwind utility in any enrolled file fails CI naming file and token. The 27 gallery tokens are visible
debt with a named owner. Contact loading uses Mantine `Loader`. Detail icons keep their exact color and shrink through
Mantine props.

## 10. Implementation requirements

1. **I0**: status snapshot, hashes of every scoped file, re-run `docs/sessions/evidence/task829/design/90_scan829.mjs`
   (expect §3.1). Probe R7's four computed `color`/`flex-shrink` values and the ContactPattern loading-state rect in
   Storybook (`patterns-mantine-listingdetailpattern--default`, `patterns-mantine-listingcontactpattern--default`, 1440×900
   `en`). Retain the JSON.
2. Write the gate and `--verify-gate` (R1–R5, R8, R9). Run `--verify-gate` → exit 0.
3. **Failing arm, required:** run the real gate with **no** baseline file → exit 1 naming all 30 tokens across 4 files.
   Retain it. Run `--seed-baseline` → it refuses (ContactPattern/DetailPattern findings exist outside
   `SEEDABLE_FILES`) and writes nothing. Retain that too.
4. Migrate R6/R7. Re-run the gate with no baseline → exit 1 naming only the 27 gallery tokens.
5. `--seed-baseline` → writes 27 keys (count-weighted). Real gate → exit 0.
6. In-place plant and restore: record `git hash-object src/design-system/mantine/patterns/MantineListingDetailPattern.tsx`,
   add `className="p-2"` to one icon through Node UTF-8 I/O → gate exit 1 naming `p-2`. Restore the saved bytes through
   Node I/O, confirm the hash equals the recorded one, and re-run → exit 0.
7. R7 after-probe, R10, R11, R12.

## 11. Positive and negative flows

**Positive.** A PR adds `className="mt-2"` to an enrolled pattern and CI fails on `check:enrolled-tailwind`, naming the
file and `mt-2`. A PR in 794 removes the gallery Tailwind and runs `--update-baseline`, and the baseline shrinks.

| Negative flow | Applicable | Expected |
|---|---|---|
| Enrolled path missing | Yes | exit 2 (R1) |
| Tailwind API unavailable | Yes | exit 2 (R3, arm 9) |
| Global non-Tailwind class | Yes | no finding (arm 2) |
| Someone tries to baseline new debt | Yes | `--update-baseline` refuses (R5, AC3) |
| Gallery debt paid without updating baseline | Yes | stale → exit 1 with fix command (R4, arm 7) |
| Dark theme muted color | Yes | `var(--muted-foreground)` has its `.dark` value (`globals.css:556`), unchanged path |

## 12. Acceptance criteria

- **AC1 [R1, R8]** — the real run's header prints scope `73` entries, the Tailwind version, baseline path/count and
  every R8 "cannot see" item. Quote it.
- **AC2 [R4]** — final real run exits 0 with `baseline entries: <n>` equal to the key count in
  `scripts/enrolled-tailwind-baseline.json`, and every key's file is one of the two 794 files. Quote the run and a Node
  one-liner listing distinct files in the baseline.
- **AC3 [R1–R5, R9]** — `npm run check:enrolled-tailwind:verify` exits 0 with 10/10 arms. §10.3 and §10.4 transcripts show
  the failing arms (30 tokens, refused seed, then 27 tokens). §10.6's plant exits 1 naming `p-2` and restores with equal
  hash.
- **AC4 [R6, R7]** — `node.exe docs/sessions/evidence/task829/design/90_scan829.mjs` on the final tree reports only the
  two 794 files. `git diff` of both patterns shows only the R6/R7 substitutions. Quote both.
- **AC5 [R7]** — before/after JSON: the four detail elements' computed `color` and `flex-shrink` strings are byte-equal.
  The contact loading `Button`'s rect height is unchanged (±0.5px). Quote the values.
- **AC7 [R6]** — in `patterns-mantine-listingcontactpattern--default` at 390 and 1440 (`en`), for every loading `Button`
  (each one containing `.mantine-Loader-root`): the computed `border-top-color` of the Loader's `::after` equals the
  button's computed `color`, and the button is still `disabled`. Quote both values per button.
- **AC6 [R10–R12]** — quote the workflow diff (two new steps after `check:rendered-scope:verify`), the three
  `package.json` lines, the §23.10 heading and its 794 paragraph, and a Node one-liner printing the baseline key count next to the "27" stated
  in the two 794 rows.

`GR-4 AC AUDIT — 6 criteria; each states an observable property; absolutes: "byte-equal computed values" in AC5 is the
value-preservation contract of R7 (measured, reversible stop in §5.2), and AC2's "only 794 files" is the owner's route.`

## 13. QA profile and verification plan

**`Q4`** — a new blocking gate needs planted proof, and two enrolled patterns change. Owner visual review covers the
visible spinner change and the preserved icon color (§13.3).

### 13.1 Baseline (I0)

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p process.platform
node.exe --version
git --no-optional-locks status --porcelain
git --no-optional-locks hash-object src/design-system/mantine/patterns/MantineListingContactPattern.tsx src/design-system/mantine/patterns/MantineListingDetailPattern.tsx package.json .github/workflows/governance-pr.yml docs/design-system.md
node.exe docs/sessions/evidence/task829/design/90_scan829.mjs (Get-Location).Path
npm.cmd run build-storybook
```

Expected: `win32`; the scan equals §3.1; Storybook exit 0. Then the R7/R6 before-probe (§10.1).

### 13.2 Final gate block

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p process.platform
npm.cmd run check:enrolled-tailwind:verify
npm.cmd run check:enrolled-tailwind
node.exe docs/sessions/evidence/task829/design/90_scan829.mjs (Get-Location).Path
npm.cmd run check:design-tokens:strict
npm.cmd run check:tailwind-runtime-tokens
npm.cmd run check:story-coverage
npm.cmd run check:rendered-scope
node.exe scripts/check-surface-census.mjs --surface src/design-system/mantine/patterns/MantineListingDetailPattern.tsx
npm.cmd run typecheck
npm.cmd run lint
npx.cmd vitest run src/design-system/mantine
npm.cmd run build-storybook
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
git --no-optional-locks diff --stat
git --no-optional-locks status --porcelain
git --no-optional-locks hash-object scripts/check-enrolled-tailwind.mjs scripts/enrolled-tailwind-baseline.json src/design-system/mantine/patterns/MantineListingContactPattern.tsx src/design-system/mantine/patterns/MantineListingDetailPattern.tsx package.json .github/workflows/governance-pr.yml docs/design-system.md docs/backlog.md docs/backlog-reserved.md tasks/Sprints/Sprint_71_The_Listing_Detail_Route_Leaves_Tailwind.md
```

Expected: every command exit 0. `vitest run src/design-system/mantine` may carry the pre-existing, unrelated
`theme.d69-18` `FooterView` failure tracked by Task 790. Quote it and confirm it is the only failure. Each command
gets its own unpiped transcript with `EXIT_CODE=`.

### 13.3 Owner visual review — `OWNER VISUAL QA REQUIRED`

| Story | Widths | Locales | Owner checks |
|---|---|---|---|
| `patterns-mantine-listingcontactpattern--default` (loading block) | 390, 1440 | en, uk | Call/WhatsApp buttons in loading state show a Mantine spinner, same button size, label readable |
| `patterns-mantine-listingdetailpattern--default` (meta row + features grid) | 390, 1440 | en, uk | location/views/date icons and feature icons keep their muted color and never shrink next to long text |

## 14. Completion report contract

Files with hashes · R1–R12 · I0 transcripts and probe JSON · failing-arm transcripts (§10.3/§10.4/§10.6) · AC1–AC6
quotes · every command with exit code and path · assumptions · deviations · limitations · §13.3 matrix handed over.
Status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`. No self-approval, no git.

## 15. Task quality gate

| Question | Answer |
|---|---|
| Why a compiler oracle, not a regex? | The regex heuristic missed a file (§3.1). The compiler is the definition of "is a Tailwind utility", and a global class that Tailwind does not generate is correctly ignored (executed probe). |
| Is the baseline a waiver? | It is the owner's route (§5.1): remove-only, seedable only for the two 794 files, owner-named. New debt cannot enter. |
| Why `var(--muted-foreground)` and not `c="dimmed"`? | `dimmed` = `gray.6` `#475467`, a visible darkening. The task removes Tailwind and is not a restyle. `--muted-foreground` is a `:root` token already consumed by migrated Mantine code (§3.3). |
| GR-1 / 16d? | Receipt in §3.3: all 8 nodes tier-1 enrolled with own stories. |
| GR-3? | `MantineListingContactPattern` ← `ListingContactPattern.stories.tsx`; `MantineListingDetailPattern` ← `ListingDetailPattern.stories.tsx` (each imports its component by name). |

## Appendix — rule-compliance ledger and execution contract

| Rule | Mandatory outcome | Evidence | Result |
|---|---|---|---|
| Owner decision 2026-09-17 | detector + 3 tokens + 794-owned baseline | R4, R5, R12 | COMPLIANT |
| `qa-profiles` Q4 | planted failing arms | R9, §10.3–§10.6 | COMPLIANT |
| `agent-contract` 16b | canonical sources with precedent | §3.3, R6/R7 | COMPLIANT |
| GR-2 | printed scope + blind spots | R8 | COMPLIANT |
| `agent-contract` 9 / 14 | build exit 0; encoding-safe writes; plant restore hash | §13.2, §10.6 | COMPLIANT |
| owner rule 2026-09-03 | owner visual matrix, no `screenshots:assert` | §13.3 | COMPLIANT |

| Checkpoint | Producer / artifact | Comparator / failure |
|---|---|---|
| 0 I0 | scan + probe JSON | scan ≠ §3.1 → `BLOCKED` |
| 1 gate + arms | `:verify` 10/10 | any arm fails → not done |
| 2 red | no-baseline run (30) + refused seed | exit 0 or seed writes → `BLOCKED — TEST BLIND` |
| 3 migrate | no-baseline run (27) + AC5 JSON | extra token or value drift → `BLOCKED` |
| 4 seed | seeded baseline + green run | key outside 794 files → not done |
| 5 plant | plant run + restore hash | hash differs → not done |
| 6 final | §13.2 | any unexplained non-zero → not `IMPLEMENTED` |

## 16. Revision 1 — review 1, 2026-09-17 (re-entry: `remediation`)

### 16.1 What review 1 measured

- `FACT` — **R6 regression.** `docs/sessions/evidence/task829/review/r1_loader_contrast_probe.json` (`win32`, the
  executor's final `storybook-static`): every loading `Button` is `disabled`, background `rgb(228, 231, 236)`, text
  `color` `rgb(102, 112, 133)`; the Loader's `--loader-color` is `#fff` and its `::after` arcs are
  `rgb(255, 255, 255)`. White on that background is ≈1.24:1 (WCAG 1.4.11 asks 3:1 for a graphical indicator).
  Screenshots: `review/r1_loading_button_{1440,390}_{0,1}.png`. Before migration `Loader2` painted with
  `stroke="currentColor"` (`93_probe_before_meta.json` `strokeAttr`), i.e. the button's own `rgb(102, 112, 133)`,
  ≈4.1:1. The `color="white"` idiom in §3.3 was copied from precedents that share the defect — filed as **835**,
  out of scope here.
- `FACT` — **R7 route correction accepted.** `92_probe_after.json` (lucide `color` prop) gives `svgColor`
  `oklch(0.145 0 0)` against `oklch(0.556 0 0)` before; `exec/13_r7_final_probe.json` (`style.color`) is byte-equal
  to `93_probe_before_meta.json` on `svgColor`, `svgStroke` and flex-shrink for all four elements. R7 now names the
  `style` route (§4). The shipped R7 diff stays as it is.
- `FACT` — **gate, baseline and arms verified.** `review/r1_gate_replay.txt` (`review/r1_gate_replay.mjs`, an
  isolated scratch copy, no repo writes) reproduces §10.3 (30 findings, seed refused, no file), §10.4 (27), §10.5
  (seeded bytes equal `scripts/enrolled-tailwind-baseline.json`), §10.6 on the **final** tree (`p-2` exit 1, restore
  hash equal, exit 0), plus stale → `--update-baseline` → green, R1 missing path exit 2 and a real oracle failure
  exit 2. **Do not re-run §10.3–§10.6 and do not touch the baseline or the gate script.**
- `FACT` — §13.2's former `check:surface-census:changed -- --base HEAD` compares committed refs and saw 0 paths on
  an uncommitted diff. §13.2 now runs `check-surface-census.mjs --surface` on the DetailPattern root (8 nodes; it
  renders ContactPattern). Review 1's run printed `GR-1 CENSUS COMPLETE — 8 nodes; tier1 8 …`.

### 16.2 Required change (only this)

1. `MantineListingContactPattern.tsx`, both `<Loader size={theme.other.iconSize.comfortable} color="white" />`:
   `color="white"` → `color="currentColor"`. Nothing else in `src/`.
2. **Stop:** if AC7 does not hold with `currentColor`, return `BLOCKED` with both values. Do not pick another color.

### 16.3 Verification

`npm.cmd run build-storybook`; then an AC7 probe (reuse `review/r1_loader_contrast_probe.mjs`'s selectors, add the
button `color` vs `::after` `border-top-color` comparison) writing only under `docs/sessions/evidence/task829/rev1/`;
then the full §13.2 block into `rev1/`, one unpiped transcript per command with `EXIT_CODE=`, ending with the
`git hash-object` line. §10.x arms are not re-run (§16.1). Update the session log (Files Changed, AC7 quote, R6/R7 as
amended) and 829's state in `docs/backlog.md` line 47. §13.3 owner visual review is still owed and follows this
revision.

### 16.4 Preserved artifacts — do not overwrite

`scripts/enrolled-tailwind-baseline.json` · `scripts/check-enrolled-tailwind.mjs` · `docs/sessions/evidence/task829/*.json`
· `exec/` · `review/` · `design/`.
