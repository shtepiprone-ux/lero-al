# Task 778 — `ListingsFilters` → Mantine + `Sheet` → `MantineDrawer` — session log

**Status:** `APPROVED WITH NOTES`
**Kickoff:** `tasks/Sprints/Sprint_68_kickoff_prompt_Task_778_ListingsFilters_Mantine_Drawer.md`

This log supersedes the first submission (returned `NEEDS REVISION`). Every item raised in that review is
addressed below with evidence. The first submission's invalid file-swap "baseline" is **not** treated as a
pre-edit baseline anywhere in this log or in the R14/AC16 result — it is disclosed once, in §1, as a corrected
process error, and superseded entirely by the isolated-worktree methodology in §5.

## 1. Recovery-approach correction (owner-authorized)

The first submission implemented before capturing S2, then attempted a non-git file-swap recovery. The owner
(standing in for orchestrator authority in this session) reviewed that and explicitly rejected it as a valid
pre-edit baseline. **Owner-authorized replacement procedure, agreed before executing:**

> "Обирай 1 — Isolated clean worktree. Створи його через EnterWorktree на точному pre-778 commit (`HEAD` до
> Task 778), не торкайся й не перемикай основний робочий каталог, не використовуй file-swap або stash. У clean
> worktree зніми B: build-storybook + screenshots:assert і збережи артефакти окремо. Потім у main worktree після
> виправлень повтори P у тому самому harness-процесі та порівняй їх."

Implementation of that agreement, and a deviation from it that the evidence itself required (§5):

- `EnterWorktree` was used (a harness-native isolation mechanism, not a raw `git` CLI command; no `git stash`,
  `git checkout`, or file-swap was used anywhere in this recovery).
- Local `HEAD` (`6fa8ff316`) was 1 commit ahead of `origin/main` (`06e4a6824`) at the time — `EnterWorktree`'s
  default base is `origin/<default-branch>`, not local `HEAD`, and this session cannot change that setting.
  **Verified before proceeding:** `git diff --stat origin/main HEAD` showed exactly 3 changed files, all
  documentation (`docs/backlog.md`, the Sprint 68 plan file, and Task 778's own kickoff file) — **zero product
  code difference**. The isolated worktree's checkout at `origin/main` (`06e4a6824`) is therefore code-identical
  to local `HEAD` for every file that affects the build or Storybook output. This is stated as `FACT`, not
  assumed.
- The first isolated-worktree run (`.claude/worktrees/task778-baseline`) produced B = **1285/1364 PASS, 52
  FAIL, 27 AMBIGUOUS** — far fewer failures than every run captured in the main working directory (52 vs.
  80-81). Comparing two identical-code runs in the main directory (§5) showed the specific failing cells differ
  run-to-run there even with zero code change, but only by 1-3 cells — not enough to explain a 28-cell gap.
  **This was treated as a real, unexplained confound, not waved off.** The correction: P was **also** captured
  in a second isolated worktree (`.claude/worktrees/task778-postedit`), built from the same `origin/main` commit
  with only Task 778's exact tracked+new files copied in via plain file copy (`cp`, not `git apply`/`git
  stash`/any mutating git command), so B and P were measured under matched conditions. Both worktrees were
  removed after their evidence was persisted to `docs/sessions/evidence/task778/` via absolute paths from the
  main working directory (which the worktree sessions never touched).
- This is named here explicitly as an **owner-authorized replacement differential baseline**, not the original
  kickoff's pre-edit baseline and not a rewrite of the first submission's history — the first submission's
  invalid attempt stands in the record as a corrected error (§1 above), and this section's isolated-worktree
  result is the one that supports the R14/AC16 decision in §5.

## 2. R15/AC17 — raw px/rem removed from `ListingsFilters.tsx`

Two raw literals identified and replaced with tokenized/canonical mechanisms, no `design-tokens-allow:` marker
added:

| Before | After | Mechanism |
|---|---|---|
| `style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}` on the section `Box` | `<Divider color="gray.3" />` rendered as a sibling immediately after each section's (unconditionally `py="md"`) inner `Box`, only when `withDivider` | Mantine `Divider`'s own internal border-width scale (component default, not a value this file writes) draws the "1px" line; `gray.3` preserves the C5/D2 colour decision. Zero-margin sibling placement reproduces the exact same visual boundary position as the previous `border-bottom` (proven by the unchanged section-toggle DOM tests, §4). |
| `mih="2.75rem"` / `miw="2.75rem"` on the header close `ActionIcon` | `mih={theme.other.touchTarget}` / `miw={theme.other.touchTarget}` via `const theme = useMantineTheme()` | Consumes the theme's own declared touch-target token (`theme.ts:266`, `other.touchTarget: '2.75rem'`) instead of duplicating the literal locally — single source of truth. |

`grep -n "px\|rem" src/modules/listings/components/ListingsFilters.tsx` → **0 matches** (confirmed after the
fix). `npm run check:design-tokens:strict` → `0 violations` (`docs/sessions/evidence/task778/V5-design-tokens-strict-final.txt`), same result as before the fix — the scanner did not previously flag either
literal, but both are now removed regardless, per the review's instruction not to rely on the scanner's blind
spot. `npm run typecheck` → exit 0 (`V6-typecheck` transcripts). Targeted vitest re-run confirmed the divider
restructure did not change the section-toggle DOM structure the existing/new tests query (`V1-vitest-final.txt`,
53/53).

## 3. V9 locale leak — owner-authorized scope extension, `messages/it.json`

Owner decision (verbatim): *"Обирай 1 — scope extension authorized. Дозволяю обмежене редагування лише
`messages/it.json`: `common.max`: переклади на `Massimo`; перевір `common.min`; якщо він також ідентичний
англійському UI-значенню, переклади на `Minimo`. Не змінюй інші locale-файли або інші ключі."*

- `messages/it.json:414-415` — `"min": "Min"` → `"Minimo"`, `"max": "Max"` → `"Massimo"` (both were
  byte-identical to `messages/en.json`, confirmed by direct read before editing). No other key or locale file
  touched.
- `npm run check:i18n` → PASSED, all 4 locales still 2231 keys (parity unaffected by a value-only change)
  (`V9b-check-i18n.txt`).
- `npm run check:locale-leak:mantine-only` (final, post-fix) → **23 leaks**, matching Task 777's recorded
  pre-existing baseline exactly. `grep -c "Story: Patterns/Mantine/ListingsFilters" V9-locale-leak-final.txt` →
  **0**. Zero leaks attributable to Task 778 (`V9-locale-leak-final.txt`).

## 4. AC9 — real computed-style measurement, not inline-var comparison

jsdom limitation discovered and disclosed rather than worked around silently: importing the real
`@mantine/core/styles.css` into the Vitest test file and reading `getComputedStyle(root).flexDirection` for a
Mantine `Stack` returned the browser-default `row`, not the compiled `column` rule — Mantine's stylesheet is
wrapped in `@layer mantine { ... }`, which jsdom's CSS engine does not reliably apply. A computed-style
assertion in that environment would have silently asserted jsdom's fallback, not Mantine's real rendering
(evidence: `docs/sessions/evidence/task778/plant-T4.txt`-adjacent local run, reproduced live in this session
before being reverted out of the test file).

Two-part fix, addressing the review's actual concern (real measurement, and comparison against the *previous*
behavior, not two new renders compared only to each other):

1. **Real-browser measurement** — `scripts/task778-qa-measurements.mjs` (new file, Playwright/Chromium against
   the built `storybook-static/`, the same engine `check-stories-rendered.mjs` uses). It measures
   `Mantine/Primitives/FilterControls/Default`'s vertical branch (the pre-existing `className="flex-col
   gap-1.5"` call site — the *previous*, unmodified-by-this-task behavior) and its horizontal branch as a
   negative control. Result, persisted at `docs/sessions/evidence/task778/AC8-AC9-measurements.json`:
   - Horizontal (Group): `flexDirection: "row"`, `rowGap`/`columnGap: "8px"`.
   - Vertical (Stack): `flexDirection: "column"`, `rowGap`/`columnGap: "6px"` — the exact 0.375rem `gap-1.5`
     value this migration replaced.
   - `FilterMultiToggle.tsx`'s vertical branch is **one shared** `return <Stack {...rootProps} gap={6}
     className={className} data-testid="filter-chip-row">{buttons}</Stack>` statement, reached whenever
     `vertical` is true regardless of whether `orientation="vertical"` or the legacy `className` produced that
     — verified by source read, not assumed. There is no second code path for `orientation="vertical"` to
     independently render, so this one real-browser measurement of the shared statement is definitionally what
     `orientation="vertical"` also renders.
2. **jsdom structural proof** (`filterLeafComponents.smoke.test.tsx`) — asserts `orientation="vertical"` and the
   legacy `className="flex-col gap-1.5"` path produce byte-identical markup (tag, `mantine-Stack-root` class,
   the resolved `--stack-gap` custom property `calc(0.375rem * var(--mantine-scale))`, and every other
   attribute except the one intentionally-different `className` string) — i.e., proves they are the same code
   path, which is the premise the real-browser measurement in (1) depends on.

Planted-violation re-proof after the rewrite: reverting `FilterMultiToggle.tsx`'s `vertical` condition to ignore
`orientation` makes both the plain class-check test and this structural test FAIL (`className` resolves to
`mantine-Group-root`, not `mantine-Stack-root`) — confirmed live in this session, then reverted.

### Closure addendum (2026-09-02) — direct measurement of the real `orientation="vertical"` instance

The review correctly did not accept "the shared-code-path reasoning stands in for measuring the orientation
call site directly." `scripts/task778-qa-measurements.mjs` was extended, **as a one-time temporary helper**, to
also open the "Condition" section (closed by default, `SECTION_DEFAULTS.condition=false`) inside the built
`Patterns/Mantine/ListingsFilters/Default` story and measure its real `FilterMultiToggle` instance — the actual
`orientation="vertical"` call site, not the `FilterControls` analogue. Result, both recorded separately in
`docs/sessions/evidence/task778/AC8-AC9-measurements.json`:

| | `flexDirection` | `rowGap` | `columnGap` | `className` |
|---|---|---|---|---|
| `ac9.legacy` (`FilterControls`, `className="flex-col gap-1.5"`) | `column` | `6px` | `6px` | `flex-col gap-1.5 m_6d731127 mantine-Stack-root` |
| `ac9.orientation` (`ListingsFilters` "Condition" section, `orientation="vertical"`, no `className`) | `column` | `6px` | `6px` | `m_6d731127 mantine-Stack-root` |

Identical `flexDirection`/`rowGap`/`columnGap` (`ac9.pass: true` in the persisted JSON), and the `className`
difference is exactly the one expected divergence (the legacy path still carries the Tailwind string; the
orientation path carries none) — everything else, including the Mantine-generated `m_6d731127` module class, is
the same. This is now a direct measurement, not an inference from source-level code-path identity.

**Scope cleanup:** `scripts/task778-qa-measurements.mjs` was a one-time temporary helper and has been deleted
after producing this JSON. It is **not** part of the final diff — `git status --short` after deletion no longer
lists it. Only the persisted `docs/sessions/evidence/task778/AC8-AC9-measurements.json` remains, inside the
already-authorized evidence path.

## 5. AC8 — persisted machine-readable measurement artifact

Same script, same real-Chromium run, measuring `Patterns/Mantine/ListingsFilters/Default` at the four canonical
viewports. Result (`docs/sessions/evidence/task778/AC8-AC9-measurements.json`):

| Viewport | `.mantine-Drawer-content` width | Drag handle (`div[style*="9999px"]`) present | Verdict |
|---|---:|:---:|---|
| desktop-1024 | 320px | No | PASS — left Drawer, `size="xs"` token width |
| mobile-320 | 320px | Yes | PASS — full-width bottom sheet |
| mobile-375 | 375px | Yes | PASS — full-width bottom sheet |
| mobile-390 | 390px | Yes | PASS — full-width bottom sheet |

`overallPass: true` in the persisted JSON (script exit code 0). This is a real captured measurement against the
built Storybook, not source inspection or a generic manifest PASS.

## 6. R14/AC16 — differential result (isolated-worktree methodology, matched conditions)

- **B** — `.claude/worktrees/task778-baseline` (removed after capture; log retained at
  `docs/sessions/evidence/task778/S2b-isolated-baseline-screenshots-assert.txt`, manifest copied to
  `docs/sessions/evidence/task778/isolated-baseline-B/manifest.json`). Commit `06e4a6824` (`origin/main`,
  code-identical to local `HEAD` per §1). Result: **1285/1364 PASS, 52 FAIL, 27 AMBIGUOUS**.
- **P** — `.claude/worktrees/task778-postedit` (removed after capture; log retained at
  `docs/sessions/evidence/task778/V8c-isolated-postedit-screenshots-assert.txt`, manifest copied to
  `docs/sessions/evidence/task778/manifest-P-isolated.json`). Same `06e4a6824` base commit, with only Task 778's
  exact 9 tracked/new files copied in (verified via `git status --short` inside that worktree matching the main
  worktree's diff set exactly before running). Result: **1301/1380 PASS, 52 FAIL, 27 AMBIGUOUS**.
- **Arithmetic:** `total(P) = 1380 = total(B) 1364 + 16` ✓. `fail(P) = 52 = fail(B)` ✓ (unchanged). `ambiguous(P)
  = 27 = ambiguous(B)` ✓ (unchanged). `pass(P) = 1301 = pass(B) 1285 + 16` ✓.
- **`P \ B` computed as a set of normalized cell identities** (`Story × locale × viewport`, not a count):
  `comm -13` between the sorted failed-cell lists of B and P → **empty**. Same comparison on the ambiguous-cell
  lists → **empty**. `grep -c "ListingsFilters" V8c-isolated-postedit-screenshots-assert.txt` → **0** (no
  `ListingsFilters` cell appears in P's Failed or Ambiguous sections at all — all 16 new cells are clean PASSes
  by elimination, confirmed directly, not inferred from arithmetic alone).
- **`P \ B = ∅`, literally, at the identity level. Acceptance met.**

### Why the first submission's non-isolated runs are not used for this decision, and the flakiness claim is now proven, not asserted

Two P-equivalent runs were also captured in the main working directory during this session (before the isolated
methodology): 81 FAIL then 80 FAIL, both far above the isolated B's 52. Per the review's explicit instruction —
*"Якщо виникають Drawer/AuthSheet cells, виконай другий повний прогін для підтвердження flaky behavior. Без
цього не списуй їх як harness flakiness"* — those two identical-code, same-directory runs were diffed against
each other directly:

- `Mantine/Primitives/Drawer/Default × it × mobile-320` failed in run 1, not in run 2.
- Three `Patterns/Mantine/AuthSheet/Register Agent Add Company` cells failed in run 2, not in run 1.

This is direct, second-run-confirmed proof that the main working directory's `AuthSheet`/`Drawer` timeout
failures are non-deterministic (same code, same directory, different specific failures) — not a claim accepted
on faith. It does not, by itself, explain the ~28-cell *count* gap between the main directory and the isolated
worktree; that gap is treated as a separate, real environmental confound (most plausibly the main directory's
accumulated build/screenshot artifacts from this session's many earlier runs slowing Playwright's 20s
navigation timeout past its threshold more often) and is exactly why the isolated, matched-condition B/P pair in
this section — not the main-directory runs — is the evidence that supports the R14/AC16 decision.

## 7. Files Changed (final)

| Path | Reason |
|---|---|
| `src/modules/listings/components/ListingsFilters.tsx` | Full Mantine migration; R15/AC17 raw-literal removal (§2). |
| `src/modules/listings/components/ListingsShellView.tsx` | `Sheet`/`SheetContent` → `MantineDrawer` (R7/R8). |
| `src/modules/listings/components/ListingsShell.tsx` | Loading fallback off shadcn `Skeleton` (R9). |
| `src/components/shared/FilterMultiToggle.tsx` | Additive `orientation` prop (R12). |
| `src/stories/patterns/mantine/ListingsFilters.stories.tsx` | New canonical story (R10). |
| `scripts/mantine-migration-scope.json` | 20 → 21 entries (R11). |
| `src/components/shared/__tests__/filtersRangeDatePicker.smoke.test.tsx` | T2/T3/T5/T6 + multi-select AC4 tests. |
| `src/components/shared/__tests__/filterLeafComponents.smoke.test.tsx` | AC9 tests, rewritten per §4. |
| `messages/it.json` | Owner-authorized scope extension (§3) — `common.min`/`common.max` translated. |
| `docs/backlog.md` | Concise state. |

`scripts/task778-qa-measurements.mjs` was used twice as a one-time temporary helper (§4/§5, and the closure
addendum) to produce `docs/sessions/evidence/task778/AC8-AC9-measurements.json`, then deleted both times. It is
**not** a changed file in the final diff — see the closure addendum below and `git status --short`.

`src/modules/listings/hooks/useListingsUrlFilters.ts` — **zero diff**, re-confirmed after every plant/revert
cycle in this session (`git diff --stat` empty for that path throughout).

## 8. Independently verified PASS (this session, final code)

| Gate | Result | Transcript |
|---|---:|---|
| V1 targeted vitest | 53/53 PASS, exit 0 | `V1-vitest-final.txt` |
| `check:stories` | 132 files, 0 violations, exit 0 | `V2-check-stories-final.txt` |
| `check:story-coverage` | 21/21 covered, exit 0 | `V3-check-story-coverage-final.txt` |
| `governance:tailwind` | C0/H10/M0, no regression vs. baseline, exit 0 | `V4-governance-tailwind-final.txt` |
| `check:design-tokens:strict` | 0 violations, exit 0 | `V5-design-tokens-strict-final.txt` |
| `typecheck` | exit 0 | `V6-typecheck.txt` |
| `build-storybook` (final, main worktree) | exit 0 | `V7b-build-storybook-final.txt` |
| Isolated baseline B (`build-storybook` + `screenshots:assert`) | exit 0 / exit 1 (expected — pre-existing FAIL/AMBIGUOUS) | `S2b-isolated-baseline-build-storybook.txt`, `S2b-isolated-baseline-screenshots-assert.txt` |
| Isolated post-edit P (`build-storybook` + `screenshots:assert`) | exit 0 / exit 1 (expected) | `V7c-isolated-postedit-build-storybook.txt`, `V8c-isolated-postedit-screenshots-assert.txt` |
| AC8/AC9 measurement script | `overallPass: true`, exit 0 | `AC8-AC9-measurements.json` |
| `check:locale-leak:mantine-only` | 23 leaks (pre-existing baseline), 0 attributable, exit 1 (expected) | `V9-locale-leak-final.txt` |
| `check:i18n` | 2231/2231/2231/2231, exit 0 | `V9b-check-i18n.txt` |
| `npm run build` | exit 0 | `V10-build-final.txt` |
| `git diff --check` | exit 0 | `V11-diff-check-final.txt` |
| `git diff --stat` / `status --short` | matches the 9-file scope above; `useListingsUrlFilters.ts` absent | `V12-diff-stat-final.txt` |

Planted-violation proofs (T2/T3/T5/T6 against `useListingsUrlFilters.ts`/`ListingsFilters.tsx`, re-verified
unchanged from the first submission since neither file's relevant logic moved) and AC9's re-proof (§4) all shown
failing against their specific defect, then reverted — transcripts `plant-T2.txt` … `plant-T6.txt`, `plant-T4.txt`
plus the live AC9 re-proof recorded in this log's §4.

## 9. Owner decisions / scope extensions (index)

1. Isolated clean worktree via `EnterWorktree`, matched-condition B and P, both worktrees removed after
   evidence capture — §1.
2. `messages/it.json` `common.min`/`common.max` translation — explicit, bounded scope extension — §3.

No other file outside the original §7 scope plus these two authorized items was changed. `scripts/task778-qa-measurements.mjs` was a one-time temporary helper, used and deleted both times it was needed (§4/§5 and the closure addendum) — it is not part of the final diff.

## 10. Remaining assumptions/limitations carried from the first submission, unchanged

A1-A4, Q1 (drawer title) and the A3 raw-enum-label condition (Task 679) are unchanged from the original
submission and still hold as recorded there — restated here for completeness, not re-verified since nothing in
this rework touched their mechanism.

---

# Completion records (2026-09-02)

The completion records below restore the required canonical-change table, requirement registry and S1 census for
the final tree. Their before/after values were measured against the `HEAD` blob and final working tree; they do
not represent additional product changes.

## A. Canonical changes C1–C13 — measured before/after

**This migration is not visually neutral.** Any report or review describing it as neutral is wrong. Values are
light-theme (the app default and the theme captured by the 16-cell story matrix).

| # | Artifact | Before (measured at `HEAD` blob) | After (measured at the final tree) | Measured delta |
|---|---|---|---|---|
| **C1** | Desktop close affordance | `ListingsShellView.tsx:83` `<SheetContent side="left" showCloseButton={false}>`; `src/components/ui/sheet.tsx` renders the close row only when that prop is true → **0** close controls; dismissal by backdrop/Esc only | `MantineDrawerProps` (`MantineDrawer.tsx:7-22`) declares exactly `opened, onClose, title?, children, footer?, side?, size?` — **no `withCloseButton`**; the desktop branch (`:137-158`) renders a bare Mantine `Drawer`, whose default is `true` → **1** close control, not suppressible from the consumer | **0 → 1** affordance at ≥640px. Accepted on the Task 567 `FiltersPanel` precedent. The scrim likewise changes from `bg-black/10` + `backdrop-blur-xs` (`sheet.tsx:32`) to Mantine's default |
| **C2** | Mobile/desktop gate + header `X` | header `X`: `Button variant="ghost" size="icon-xl"` (`button.tsx:30` `size-11` = **44×44px**) with `ml-auto lg:hidden` → visible **<1024px**. Apply: `Button size="xl"` (`button.tsx:28` `h-11` = **44px**) with `lg:hidden mt-4` | `ActionIcon … hiddenFrom="sm"` (`:126`) and `Button … hiddenFrom="sm"` (`:408`); `theme.ts:176` `breakpoints.sm = '40em'` = **640px** | gate **1024px → 640px**. Affordance count per band is **1 / 1 / 1**, never 0 and never 2: **<640** the component's own `X` (the bottom sheet sets `withCloseButton={false}`, `responsiveBottomSheet.tsx:133`) plus a `DragHandle`; **640–1023** the Drawer's header close, component `X` now hidden; **≥1024** the Drawer's header close (C1) |
| **C3** | Drawer body padding | consumer `p-5` on `SheetContent` = **20px** | `MantineDrawer.tsx:155` `contentPadding="var(--mantine-spacing-md)"`; `theme.ts` `spacing.md = '1rem'` = **16px**. No prop exposes it | **20px → 16px** |
| **C4** | Section label colour | `text-muted-foreground` → `globals.css:434` `--muted-foreground: var(--neutral-500)` → `:419` `oklch(0.556 0 0)` = **#8C8C8C** | `Text … c="gray.5"` (`:58`) → `theme.ts:20` `gray[5]` = **#667085** | **#8C8C8C → #667085**. Provenance: owner decision **D4** (2026-07-28, Task 675), recorded in `MantineFilterSection.tsx:26-33`. Font-size (0.75rem), weight (600), `tt="uppercase"` and letter-spacing (0.05em) are **unchanged** on both sides |
| **C5** | Section divider colour | `border-b border-border` → `globals.css:465` `--border: var(--neutral-200)` → `:416` `oklch(0.922 0 0)` = **#EBEBEB** | `<Divider color="gray.3" />` (`:65`) → `theme.ts:18` `gray[3]` = **#D0D5DD** | **#EBEBEB → #D0D5DD**. Provenance: **D2** (Task 671), `MantineFilterSection.tsx:23-24`. **Position unchanged** — bottom of every section but the last *visible* one; legacy achieved it with CSS `last:border-b-0`, the migration with `lastVisibleSection` derived from `SECTION_ORDER` and the live `shows()` predicates |
| **C6** | Active-count pill | `<span className="text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5 font-medium">`: **#EC5447** (`globals.css:402/437` → `brand.ts:21`), font 12px, **line-height 16px** (Tailwind `text-xs`), padding **2px 8px**, weight **500**, radius 9999px | `<Badge color="brand" variant="filled" radius="pill">` (`:118`); theme `Badge` at default `size="sm"`: `fontSize:'0.75rem'` (12px), **`lineHeight:'1.125rem'` (18px)**, `padding:'0.125rem 0.5rem'` (**2px 8px**), `fontWeight:500`, `height:'auto'`, `radius.pill` 9999px; `primaryShade:7` → filled **#EC5447**, white label | **Only line-height changes: 16px → 18px** (pill ~2px taller). Colour, padding, font-size, weight and radius measure **identical**. This corrects the kickoff's C6 prediction that the pill would take "Badge's own size chrome" — the chrome matches except line-height |
| **C7** | Selected property type | `variant="outline"` + `cn('py-2 px-3 h-auto text-xs justify-start rounded-xl whitespace-normal leading-snug text-left', … && 'bg-primary/10 text-primary border-primary/30 font-semibold')` | `variant={… ? 'light' : 'default'}` + `justify="flex-start"` (`:157-170`) | alpha(brand-7,.1) / brand-7 / alpha(brand-7,.3) → Mantine `light` variant at `primaryShade:7`. The Task 567 substitution for the byte-identical class string on `FiltersPanel`. Label wrapping is preserved by the theme's `Button` `label:{ whiteSpace:'normal', overflowWrap:'break-word' }`, which replaces `whitespace-normal leading-snug` |
| **C8** | Listing-type / market-type rows | `<div className="flex flex-col sm:flex-row gap-2">` (`gap-2` = **8px**, Tailwind `sm:` = **640px**) with `Button size="xl"` (**h-11 = 44px**, `px-5` = 20px) + `flex-1 rounded-xl text-xs` (radius **12px**) | `SimpleGrid cols={{ base:1, sm:3 }} spacing="xs"` (`theme.ts` `spacing.xs = '0.5rem'` = **8px**; Mantine `sm` = 40em = **640px**) with theme-default Buttons: Mantine `--button-height-sm` 2.25rem raised by the theme's `minHeight:'2.75rem'` = **44px**, `defaultRadius:'lg'` = **8px** | height **44 → 44px** (floor now from the theme, not from `size="xl"`); radius **12px → 8px**; gap **8px → 8px**; breakpoint **640px → 640px**. `size="lg"`/`"xl"` remain banned (Task 520) |
| **C9** | Listing-id field | `<Input type="text" className="h-10 rounded-xl">`: **40px** tall, radius **12px**; `onChange` reads `e.target.value` | `<TextInput>` (`:396-401`) with theme defaults `radius:'lg'` (**8px**), `size:'sm'`, `styles.input.minHeight:'2.75rem'` (**44px**), colour `gray-8`; `onChange` reads `e.currentTarget.value` | height **40px → 44px**; radius **12px → 8px**. The handler change is semantically inert — on an `<input>` both properties resolve to the same node — and the param write is unchanged |
| **C10** | Form factor below 640px | `SheetContent side="left" className="w-80 max-w-[90vw]"` — left-edge sheet, effective `min(320px, 90vw)` = **288px at a 320px viewport** | `MantineDrawer.tsx:125-135` returns `ResponsiveBottomSheet` below 640px, which sets `withCloseButton={false}` (`responsiveBottomSheet.tsx:133`) and renders a centred `DragHandle`. **Measured in real Chromium** (`evidence/task778/AC8-AC9-measurements.json`): content width **320 / 375 / 390px** at mobile-320/375/390 with `dragHandlePresent: true`; desktop-1024 **320px** with `dragHandlePresent: false` | **288px left-edge sheet → 320px edge-to-edge bottom sheet with a DragHandle** at a 320px viewport. Explicitly required by the owner |
| **C11** | Property-type grid gap — **found at review, absent from the kickoff's C-list** | `grid grid-cols-2 gap-1.5` = **6px** | `SimpleGrid cols={2} spacing="xs"` (`:156`) = **8px** | **6px → 8px.** 6px has no Mantine spacing token, so preserving it would require a raw value, which **R15** forbids; 8px is the token-clean choice. It is nonetheless a change — kickoff §10.1 classified this row "Preserved shape", which holds only for the two-column shape, not the gap |
| **C12** | Section-toggle hover chrome — **found at review, absent from the kickoff's C-list** | `Button variant="ghost"` carrying `hover:bg-transparent group`; the label carried `group-hover:text-primary transition-colors duration-150` — **no** hover background, label turns **#EC5447** on hover | `Button variant="subtle"` (`:39`); Mantine's subtle variant paints a hover background, and the label is a `Text c="gray.5"` with no hover rule | hover background **transparent → subtle-variant fill**; hover label colour **#EC5447 → unchanged #667085** |
| **C13** | Chevron colour — **found at review, absent from the kickoff's C-list** | `h-3.5 w-3.5 text-muted-foreground/60 … duration-200` = 14px, **#8C8C8C at 60% alpha**, 200ms | `size={14}` + `color:'var(--mantine-color-gray-5)'`, `transition:'transform 200ms ease'` (`:47-56`) = 14px, **#667085 solid**, 200ms | size and duration **unchanged**; colour **rgba(#8C8C8C, 0.6) → #667085 solid** |

## B. Requirement registry R1–R17

Status and evidence pointer per requirement against the final tree.

| ID | Status | Evidence |
|---|---|---|
| **R1** | `VERIFIED` | `ListingsFilters.tsx`: `className=` 0, `cn(` 0, `@/components/ui/button` 0, `@/components/ui/input` 0, `@/lib/utils` 0; `@mantine/core` imported at `:5`. §C |
| **R2** | `VERIFIED` | `{open && <Box mt="sm">{children}</Box>}` at `:62` — conditional mount preserved; toggle is a native `<button>` whose accessible name is the section title (six vitest tests resolve sections by `getByRole('button', { name })`); `sections`/`toggle` stay local state in the zero-diff hook. `Collapse` count 0 (**AC2a**) |
| **R3** | `VERIFIED` | T2 in `filtersRangeDatePicker.smoke.test.tsx`: one `router.push`, `sort` + `currency` retained, `page` gone. Plant `plant-T2.txt` shows the control failing on its specific defect |
| **R4** | `VERIFIED` | T3 (property-type switch drops `heating=`) and the multi-select test (3-value CSV loses only the deselected value). Plant `plant-T3.txt` |
| **R5** | `VERIFIED` | Task 559 tests 5 and 6 green unmodified in intent; `RangeDatePicker` at `:385-389` still emits one `updateParams({ date_from, date_to })` |
| **R6** | `VERIFIED` | `:406-411` `onClick={onClose}`; `useState` count 0 in the module; T6 asserts one `onClose` call and zero pushes. Plant `plant-T6.txt` |
| **R7** | `VERIFIED` | `ListingsShellView.tsx:7` + `:81-84`; `opened={filtersOpen}`, `onClose` writes the same `onFiltersOpenChange` setter, `side="left"`, `size="xs"`, no raw width. §C |
| **R8** | `VERIFIED` | `AC8-AC9-measurements.json` — bottom sheet with `DragHandle` at all three mobile widths, side Drawer at 1024. C10 |
| **R9** | `VERIFIED` | `ListingsShell.tsx`: two hunks only (`:6` import, `:15-17` fallback); `ssr:false` untouched at `:13`; `className=` 0; every prop to `ListingsShellView` outside the diff |
| **R10** | `VERIFIED` | `src/stories/patterns/mantine/ListingsFilters.stories.tsx` — title exactly `Patterns/Mantine/ListingsFilters`, static import at `:4`, one export, real `MantineDrawer` `opened`, fixtures via `storyT`. `check:stories` 132 files / 0 violations |
| **R11** | `VERIFIED` | `scripts/mantine-migration-scope.json` 20 → 21, one added entry; `check:story-coverage` 21/21 covered |
| **R12** | `VERIFIED` | `FilterMultiToggle.tsx:26` resolution order explicit; `AC8-AC9-measurements.json` `ac9.orientation` vs `ac9.legacy` both `column` / 6px / 6px; jsdom structural proof of the shared return statement. Plant `plant-T4.txt` |
| **R13** | `VERIFIED` **by this appendix** | §A. The record was absent from the log until 2026-09-02 and is reconstructed here by the reviewer, not by the executor — see the provenance note above |
| **R14** | `VERIFIED` | Isolated matched-condition B/P. The reviewer independently extracted both failed-cell and both ambiguous-cell lists and computed the symmetric difference: **52 = 52**, **27 = 27**, `P \ B` and `B \ P` empty in both directions. Manifests parsed directly: B holds **0** `ListingsFilters` cells, P holds exactly **16**, all `verdict: pass`, `retryCount: 0`, `error: null`, `nonBackgroundRatio` 0.41 at mobile-320. `git diff --stat origin/main HEAD` = 3 documentation files, **zero product-code difference**, so the isolated base is code-identical to the reviewed base |
| **R15** | `VERIFIED` | `px`/`rem` count 0 in the module; 0 `design-tokens-allow:` markers; `theme.other.touchTarget` **grepped as defined** at `theme.ts:266`, not read from a table; `check:design-tokens:strict` 0 violations; `governance:tailwind` C0/H10/M0 with no regression |
| **R16** | `VERIFIED` | `useListingsUrlFilters.ts` absent from the diff. Changed-path set = kickoff §7's nine paths **plus** `messages/it.json`, an extension the owner explicitly authorized on 2026-09-02 before the verdict. Re-taken in `V12-diff-stat-closure.txt` |
| **R17** | `VERIFIED` | `ListingsShellView.tsx` still carries 13 Tailwind `className` values and a shadcn `Button` and is **absent** from the manifest; `ListingsShell.tsx` likewise not enrolled |

## C. S1 census — and the 367 vs 368 reconciliation

| Metric | Kickoff §3.1 | S1 re-measure (executor, win32) | Reviewer re-measure (2026-09-02) | **After** |
|---|---:|---:|---:|---:|
| `ListingsFilters.tsx` lines | 367 | **368** | **367** | 415 |
| `className=` | 27 | 27 | 27 | **0** |
| `cn(` | 4 | 4 | 4 | **0** |
| `<Button` | 8 | 8 | 8 | **7** |
| `<Input` | 1 | 1 | 1 | **0** |

**The 368 is a counting-method artifact, not census drift.** The reviewer measured
`git --no-optional-locks show HEAD:src/modules/listings/components/ListingsFilters.tsx | wc -l` = **367** and
confirmed the blob's final byte is `0x0A`. The file therefore contains 367 newline-terminated lines with no
unterminated trailing line; a counter that splits on the newline and counts the empty string after the final
terminator reports 368. All four substantive counts match §3.1 exactly, so no requirement was written against a
drifted number. The kickoff's S1 stop-condition is resolved by this recorded reconciliation.

`<Button` **8 → 7** reconciles exactly: the eight legacy shadcn Buttons were the section toggle, the header `X`,
the listing-type map, "all types", the property-type map, "all" market types, the market-type map and mobile
Apply. Seven survive as Mantine Buttons; the header `X` became an `ActionIcon`, which is not a `<Button` match.

**After-values for the remaining census criteria.** **AC7** — `ListingsShellView.tsx` `className=` **14 → 13**;
the reviewer diffed both grep outputs and every surviving value is byte-identical, differing only in line number.
**AC10** — `ListingsShell.tsx` `className=` **2 → 0**. **AC12** — manifest **20 → 21** entries, exactly one added,
neither `ListingsShellView.tsx` nor `ListingsShell.tsx` present.

## D. Final evidence and disposition

`V11-diff-check-final.txt` and `V12-diff-stat-final.txt` are **SUPERSEDED**. They predate both the deletion of
the one-time helper `scripts/task778-qa-measurements.mjs` and the final `docs/backlog.md` edit, so
`V12-diff-stat-final.txt` still lists `?? scripts/task778-qa-measurements.mjs` and `docs/backlog.md | 7 +-`
where the final tree has 9 — it no longer describes the reviewed diff. The final artifacts are
**`V11-diff-check-closure.txt`** and **`V12-diff-stat-closure.txt`**, re-captured on the final tree on
2026-09-02. They are read-only final-tree Git captures; the retained win32 build, test and visual-gate
transcripts remain the runtime evidence for this task.

**Final disposition: `APPROVED WITH NOTES`.** The implementation and required acceptance evidence are complete.
The following are non-blocking follow-ups outside Task 778: standardising transcript metadata, the `Text` nesting
observation, an outdated AC9 test comment, and synchronising the Sprint 68 task table in a separately authorised
administrative update.
