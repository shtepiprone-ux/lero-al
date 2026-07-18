# Task 623R — Complete the `FooterView` Mantine migration, fix the `check:story-coverage` gate, restore full Q3 proof

## Mode and task type

- Mode: implementation kickoff for a fresh Sonnet session (execute via `.claude/skills/execute-task/SKILL.md`).
- Task type: **UI — Mantine migration completion + governance-gate repair + Q3 visual proof.**
- This is the **revision** of Task 623, which returned `NEEDS REVISION`. Task 623's Phase 1 (container/view split
  + story) is **APPROVED and must not be redone**. This task completes Phase 2 and closes three gaps.
- Blast radius: every public page (`src/app/[locale]/layout.tsx:53`), plus **two shared artifacts**
  (`src/design-system/mantine/theme.ts`, `scripts/check-story-coverage.mjs`) — see `Shared-artifact risk`.

## What Task 623 already established (do NOT redo)

Verified by orchestrator review on 2026-07-18. Treat as the starting baseline:

- `src/components/layout/Footer.tsx` is a correct container: 4 awaited data calls, all derivations, byte-identical
  to the pre-task original. **Do not touch it** except where this task explicitly requires.
- `src/components/layout/FooterView.tsx` is hook-free and prop-driven. Structure already uses `Box`/`Stack`/
  `Group`/`Flex`.
- `src/stories/mantine/primitives/FooterView.stories.tsx` exists, title `Mantine/Primitives/FooterView`, 2 fixtures,
  all strings via `storyT`, 11 `storybook.mantine.footer_*` keys in all 4 message files.
- R1, R2, R4, R5, R8, R9, R10 are `VERIFIED`. **Owner ruling: `next/link` is permitted** — the R1 prohibition covers
  `next/navigation`, router hooks, Supabase, and data/network imports only. Client-side navigation and prefetch
  **must be preserved**.
- `--mantine-only` gate is green: `941/968 PASS, 0 FAIL, 27 AMBIGUOUS` (all 27 pre-existing Combobox/
  RangeDatePicker/Tabs/NotificationBellView overlay cells; zero FooterView entries). Independently confirmed by the
  owner on 2026-07-18T17-06.

## Owner rulings that CHANGE the original task contract

These supersede Task 623's A2, OQ1, R6, and R7. Read them before anything else.

1. **OQ1 is decided: structural-only migration is REJECTED.** `FooterView` must be fully migrated — layout,
   responsive behavior, spacing, typography, and links. No Tailwind utility may control geometry, breakpoints,
   spacing, text, or link styling.
2. **`next/link` is preserved via composition with Mantine `Anchor`** (`<Anchor component={Link} href=…>`), not
   removed. Losing prefetch is a regression, not a simplification.
3. **Three theme values are authorized** (and only these three) — see `Theme additions`.
4. **A 1536px breakpoint is NOT authorized.** Use the existing Mantine breakpoints.
5. **A2 is amended.** Task 623's "appearance-preserving, ±1px everywhere" no longer holds universally. Exactly one
   deliberate visual change is authorized — see `Authorized visual change`. Everywhere else, pixel parity still
   governs and `stop and report` still applies.

## Authorized visual change (the ONLY one)

Because the 1536px step is dropped, at viewports **≥1536px** the content column's `padding-inline` becomes 32px
instead of the legacy 48px.

| Property | Legacy (≥1536) | Required after | Status |
|---|---|---|---|
| Container `max-width` | 1408px | 1408px | **Unchanged — P0** |
| Container centering | `margin-inline: auto` | centered | **Unchanged — P0** |
| `padding-inline` | 48px | 32px | **Authorized change** |
| Resulting content width | 1312px | 1344px | **Authorized change (+32px)** |

Any other pixel delta at any viewport is a regression, not a consequence of this ruling. Do not use this row to
excuse an unrelated difference.

## Requirements

| ID | Source | Observable requirement | Priority | Verification |
|---|---|---|---|---|
| R1' | Owner ruling 1 | `FooterView` contains **no** Tailwind utility class controlling grid, flex, gap, padding, margin, width, breakpoints, font size/weight/transform/tracking/leading, or link color/hover | P0 | Source inspection + the class-audit table (below) |
| R2' | Owner ruling 2 | Every internal link is `<Anchor component={Link} href=…>`; `next/link` still imported; prefetch preserved | P0 | Source inspection + rendered `<a>` attributes |
| R3' | Owner ruling 3 | `theme.ts` gains exactly 3 values (10px, 40px, 56px semantic); no other theme change | P0 | Diff of `theme.ts` |
| R4' | Owner ruling 4 | No new breakpoint in `theme.ts`; footer responsive behavior keys off existing sm=640 / md=768 / lg=1024 | P0 | Diff of `theme.ts` |
| R5' | Amended A2 | Pixel parity holds at **every viewport <1536**; at ≥1536 only the authorized row differs | P0 | Live Q3 matrix, baseline vs final |
| R6' | Owner ruling 1 | Column grid is Mantine `SimpleGrid cols={{base:1, sm:2, md:3}}`; 1/2/3 columns flip at exactly 640/768 | P0 | Rendered proof at 639/640 and 767/768 |
| R7' | **Amended R7** | MobileBottomNav clearance = 56px `<768`, 0 `≥768`, expressed through the semantic theme value. Container: `max-width` 1408px and centered at all widths; `padding-inline` 16/24/32 at 320/640/1024 | P0 | DOM measurement |
| R8' | Owner ruling 8 | At 1536/1920/2560: footer centered, no horizontal overflow, no stretched/degraded appearance | P0 | Wide-desktop visual QA |
| R9' | Owner ruling 6 | `npm run check:story-coverage` exits 0. Gate recognizes a canonical Mantine story by **static import of the component**, not filename and not exemption. All 6 previously-uncovered components pass | P0 | Gate run + planted-violation proof |
| R10' | Owner ruling 7 | `FooterView: [{ name: 'band-680', width: 680, height: 812 }]` in `MANTINE_STORY_EXTRA_VIEWPORTS` | P1 | Gate reports **972 cells, 0 FAIL** |
| R11' | Preserve | Everything R1/R2/R4/R5/R8/R10 of Task 623 proved stays true: hook-free view, unchanged `Footer` API and `layout.tsx`, 2 story fixtures, `storyT` strings, link `target`/`rel` and locale prefixes, container-side fallback logic | P0 | Re-run Task 623's evidence |

## Theme additions — exact and exhaustive

`src/design-system/mantine/theme.ts`. Add these three and nothing else:

```ts
spacing: {
  xxs: '0.625rem',  // 10px — Task 623R: compact spacing (footer nav-link stacks)
  xs:  '0.5rem',
  sm:  '0.75rem',
  md:  '1rem',
  lg:  '1.25rem',
  xl:  '1.5rem',
  xxl: '2.5rem',    // 40px — Task 623R: section/grid spacing
},
other: {
  mobileBottomNavClearance: 56,  // px — Task 623R: clears MobileBottomNav below md
},
```

Rationale to record: these are **existing, visually-approved footer values** relocated into the single source of
truth, not invented ones. `spacing` additions are purely additive — no existing key changes value, so no existing
Mantine component shifts. `other` is Mantine's documented escape hatch for semantic non-scale values.

**Do not** add a breakpoint. **Do not** modify an existing spacing value.

## Migration map — required mechanism per artifact

Every row must end with **zero** Tailwind utilities in the named category.

| Artifact | Current (Task 623 state) | Required mechanism |
|---|---|---|
| Footer band | `Box component="footer"` + `pb-14 md:pb-0` | `pb={{ base: theme.other.mobileBottomNavClearance, md: 0 }}` |
| Content column | `Box className="container-wide py-12"` | `Box maw={1408} mx="auto" w="100%" px={{ base: 16, sm: 24, lg: 32 }} py={48}` |
| Column grid | `Box className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10"` | `SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xxl"` |
| Column stacks | `Stack gap="md"` | unchanged ✓ |
| Nav/info link lists | `Box component="nav" className="flex flex-col gap-2.5"` | `Stack component="nav" gap="xxs" aria-label={…}` |
| Brand wordmark | `Link` + `font-bold text-xl` | `Anchor component={Link}` + `Text component="span" fz="xl" fw={700}` ×2 (brand `c` primary, tld `c` foreground) |
| Tagline | `<p className="text-sm … max-w-55">` | `Text size="sm" lh={1.625} maw={220} c=…` |
| Section headings | `<p className="text-xs font-semibold uppercase tracking-widest …">` | `Text size="xs" fw={600} tt="uppercase" lts="0.1em" c=…` |
| Nav/info links | `Link` + `text-sm text-muted-foreground hover:text-foreground …` | `Anchor component={Link} size="sm" underline="never"` + hover via `footer-chrome.css` |
| Social links | `<a>` + `text-xs …` | `Anchor size="xs" underline="never" target="_blank" rel="noopener noreferrer"` + same hover rule |
| Bottom bar | `Flex direction={{base:'column',sm:'row'}} gap="sm"` + `mt-12 border-t pt-6` | keep `Flex`; move `mt-12`/`pt-6` to `mt={48}`/`pt={24}`; `border-t` may remain (see carve-outs) |
| Social row | `Group gap="lg"` | unchanged ✓ |

### Explicitly allowed carve-outs

These are **not** in the prohibited categories (geometry, breakpoints, spacing, text, link style) and may stay as
token-backed classNames:

- `bg-surface-2` — background color.
- `border-t` — border presence/color.
- `site-footer` — dead hook class, preserved per Task 623 OQ2. Still no CSS anywhere; removal remains a separate
  decision.

Anything not on this list must be gone. If you believe a fourth carve-out is unavoidable, **stop and report** —
do not add it silently. That is the failure mode that returned Task 623.

### Link color and hover

Mantine `Anchor` defaults to the primary color with a hover underline; the footer needs muted→foreground with no
underline. Follow the established chrome-CSS pattern (7 existing files: `input-chrome.css`, `pagination-chrome.css`,
`slider-chrome.css`, …). Create `src/design-system/mantine/footer-chrome.css` and import it in `src/app/layout.tsx`
alongside the others.

`footer-chrome.css` is permitted **only** as scoped, Mantine-compatible chrome. Owner constraints, all P0:

- Every rule scoped under a single footer root selector — it must not be able to leak to any other surface.
- **No Tailwind utilities** and no `@apply`.
- **No raw color values** — no hex, `rgb()`, or `oklch()` literals. Colors resolve to existing token vars
  (`--color-muted-foreground`, `--color-foreground`) or Mantine theme vars.
- **No arbitrary magic numbers.** Any length must be an authorized theme value or an existing token var.
- Hover/focus states derive from the same token source as the base state — do not introduce a one-off shade.

If a required state cannot be expressed under these constraints, **stop and report**. Do not relax a constraint to
finish the file.

## The `check:story-coverage` fix (R9')

Current behavior — verified at `scripts/check-story-coverage.mjs:76-84`: coverage is decided **solely** by
`existsSync(sameDir/<Base>.stories.tsx)`. The script has no concept of `src/stories/**`. Consequence: it fails on 6
components (`FooterView`, `HeaderView`, `HeaderActions`, `MobileNavDrawer`, `UserMenu`, `HeroSearchView`), and
`.github/workflows/governance-pr.yml:92-93` runs it as a **blocking** CI gate. **This PR cannot merge red.**

Required fix, per owner ruling 6:

1. Additionally scan `src/stories/**/*.stories.tsx`.
2. For each, statically parse its **import statements** and resolve which `src/components/**` module(s) it imports.
3. A component counts as covered if some story file statically imports it.
4. **Not** by filename convention. **Not** by directory prefix. **Not** by an exemption entry.
5. Do not add any `story-coverage-exempt.json` entry. Do not weaken the gate. Do not add an
   `--update-exempt`-style escape.

Expected outcome: all 6 components covered, gate exits 0, **without** the exempt list growing.

**Planted-violation proof is mandatory** (agent-contract clause 13 / Q4 gate-claim rule): temporarily delete or
rename the `FooterView` import inside `FooterView.stories.tsx`, confirm the gate **fails**, restore, confirm it
passes. Record both outputs. A gate that cannot fail is not a gate.

## Shared-artifact risk

This task edits three files that other work depends on. Each needs its own regression evidence:

| Artifact | Risk | Required evidence |
|---|---|---|
| `theme.ts` | Additive spacing keys reach ~60 Mantine stories | `--mantine-only` run after the theme edit: **972 cells, 0 FAIL** |
| `check-story-coverage.mjs` | A too-loose rule could mask genuinely uncovered components | Planted-violation proof + before/after uncovered lists |
| `footer-chrome.css` | Global stylesheet import could leak beyond the footer | Every rule scoped under one footer root; confirm no other story's computed styles shift |

## QA profile and verification plan

**Profile: `Q3 Full Visual Matrix`** — unchanged from Task 623, and this time it must actually be produced. Task
623's reduction to 9 cells was declined; "session time constraints" is not an acceptable-reason exemption under
agent-contract clause 9.

Run and record **actual** results:

1. `npm run typecheck` → 0 errors.
2. `npx eslint` on all changed source files → clean.
3. `npm run check:i18n` → pass.
4. `npm run check:i18n-hardcode` → no new finding. Do **not** update the baseline.
5. `npm run check:design-tokens` → no new violation in touched files. Watch `footer-chrome.css` specifically.
6. `npm run check:file-integrity` + `npm run check:mojibake` → pass.
7. `npm run check:stories` → pass.
8. `npm run check:story-coverage` → **exit 0**, plus the planted-violation fail/restore proof.
9. `npm run build-storybook && npm run screenshots:assert -- --mantine-only` → **972 cells, 0 FAIL**. Record the
   `Results:` line verbatim. Ambiguous count should stay 27 and contain zero FooterView entries; any change is a
   finding.
10. **Live Q3 matrix — the full canonical 14 widths × 4 locales**, captured against `next dev` for **baseline**
    (pre-Task-623 footer, restored read-only via `git show`) and **final**:
    `320/375/390/480/560/680/768/810/960/1024/1200/1440/1920/2560` × `sq/en/uk/it`.
    Per cell record: footer bounding box, container `max-width` / `padding-inline` / computed centering,
    `padding-bottom`, and horizontal-overflow check. Then a baseline-vs-final diff.
11. **Transition-point proof:** 639 vs 640 and 767 vs 768. At 639→640 the grid must go 1→2 columns and the bottom
    bar column→row; at 767→768 the grid must go 2→3 columns and `padding-bottom` 56px→0.
12. **Wide-desktop QA at 1536/1920/2560** (R8'): centered, `max-width` 1408px, no overflow, not visually stretched.
    This is qualitative assessment against the authorized-change table — **not** legacy pixel-match.
13. **Class audit (R1'):** a table of every remaining `className` in `FooterView.tsx` with its category and the
    carve-out that permits it. Any row not matching an allowed carve-out fails R1'.
14. `npm run check:hydration` → 4/4 PASS, warm run (cold-compile flake is a documented Task 582/622 pattern).

Persist every artifact under `.screenshots/task623R/` and **record the paths in the session log**. Task 622 lost its
Q3 proof to a scratchpad; Task 623 lost 5 of 14 widths to time pressure. Do not repeat either.

If a command cannot run in the sandbox, record it as **missing evidence** with the exact native PowerShell command
and expected artifact — never a confidence claim (agent-contract clause 9).

## Positive and negative flows

**Positive:** a visitor on any public page scrolls to the footer → brand + tagline, nav and info columns, bottom bar
with copyright and social links → internal links locale-prefixed and client-side navigated, external links open in a
new tab → layout identical to baseline at every width <1536, and correctly adapted at ≥1536.

| Branch | Applicable? | Expected behavior | Evidence |
|---|---:|---|---|
| Empty/missing DB content | **Yes** | Fallback links + i18n titles render; no empty columns, no crash | Story fallback fixture |
| External vs internal URL | **Yes** | External → `target`/`rel`, no prefix; internal → prefixed, no target, prefetch intact | Rendered `<a>` attribute dump |
| Locale expansion | **Yes** | No clipping or horizontal overflow at 320 in any locale, `uk` worst case | Q3 matrix |
| Breakpoint transition | **Yes** | Correct flip at exactly 640 and 768 | Step 11 |
| Wide desktop ≥1536 | **Yes** | Centered, capped, no stretch, no overflow | Step 12 |
| MobileBottomNav overlap | **Yes** | 56px clearance <768 | DOM measurement |
| `site_name` without TLD | **Yes** | Whole name as brand, empty TLD span, no stray `.` | One fixture value — **actually test it this time** |
| Validation / Authorization / Concurrent writer | No | No form, no write path, public read-only surface | — |

## Acceptance criteria

- **AC1 [R1']** The class audit shows every remaining `className` in `FooterView.tsx` is `bg-surface-2`,
  `border-t`, or `site-footer`. Nothing else.
- **AC2 [R2']** Every internal link renders `<a>` from `Anchor component={Link}`, with the locale prefix, no
  `target`/`rel`, and prefetch behavior intact.
- **AC3 [R3', R4']** `theme.ts` diff contains exactly the 3 authorized additions and no breakpoint change.
- **AC4 [R5']** Baseline-vs-final diff over 14 widths × 4 locales shows zero geometry difference at every width
  <1536.
- **AC5 [R6']** Column count is 1 at 639, 2 at 640, 2 at 767, 3 at 768; bottom bar is column at 639, row at 640.
- **AC6 [R7']** `padding-bottom` 56px at <768 and 0 at ≥768; container `max-width` 1408px and centered at all 14
  widths; `padding-inline` 16/24/32 at 320/640/1024.
- **AC7 [R8']** At 1536/1920/2560 the footer is centered, capped at 1408px, has no horizontal overflow, and reads as
  deliberately laid out rather than stretched.
- **AC8 [R9']** `check:story-coverage` exits 0 with all 6 components covered, `story-coverage-exempt.json`
  unchanged, and the planted-violation run fails then passes on restore.
- **AC9 [R10']** `--mantine-only` reports 972 cells, 0 FAIL, with `FooterView … band-680` present.
- **AC10 [R11']** Task 623's R1/R2/R4/R5/R8/R10 evidence still holds after this task's changes.

## Completion report contract

Session log at `docs/sessions/<date>-task623R-*.md` plus a concise `docs/backlog.md` update, containing:

- A "Files Changed" table matching the real diff.
- R1'–R11' with evidence location for each.
- Every verification command with its **actual** result — including the full `Results:` line from step 9.
- The complete 14×4 baseline-vs-final comparison, per cell, not summarized as "identical".
- Transition-point results for 639/640 and 767/768 as their own stated result.
- The class-audit table.
- Wide-desktop QA assessment at 1536/1920/2560 against the authorized-change table.
- Planted-violation proof for the coverage gate: both the failing and the restored output.
- Artifact paths under `.screenshots/task623R/`.
- Assumptions, deviations, limitations, unresolved issues — **stated as such, not folded into a passing row**.
- Final status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`. Never
  self-approval.

**Explicit instruction on scope pressure:** if a Mantine primitive cannot reproduce a required artifact, or the
evidence cannot be produced in the session, **stop and report with the work done so far**. Do not narrow the scope
and mark the requirement ✅ with a disclosure paragraph — that is precisely what returned Task 623. `PARTIALLY
IMPLEMENTED` with honest gaps is a better outcome than a green table with a footnote.

Handoff: execute via `.claude/skills/execute-task/SKILL.md` against this file path. Do not run or emit mutating git
commands.

## Task quality gate

- [x] A fresh Sonnet session can execute without hidden chat context — exact files, line numbers, tokens, mechanisms,
      commands, and expected numeric results are named.
- [x] Every requirement R1'–R11' has ≥1 binary acceptance criterion and ≥1 verification method.
- [x] The five owner rulings that override the original task contract are stated before any implementation detail.
- [x] The single authorized visual change is quantified (1312px → 1344px content width at ≥1536) so a reviewer
      cannot mistake it for a regression, and cannot be stretched to excuse others.
- [x] The 1536-breakpoint conflict that would have blocked the executor mid-task is resolved **before** handoff.
- [x] Allowed carve-outs are enumerated exhaustively; a fourth requires stop-and-report.
- [x] Shared-artifact risk (`theme.ts`, coverage script, global CSS) each carries its own regression evidence.
- [x] The new gate claim carries a mandatory planted-violation proof.
- [x] Q3 evidence is specified as the full 14×4 matrix with per-cell recording, closing Task 623's reduction.
- [x] Scope-reduction-under-time-pressure is named as the prior failure and explicitly forbidden.
