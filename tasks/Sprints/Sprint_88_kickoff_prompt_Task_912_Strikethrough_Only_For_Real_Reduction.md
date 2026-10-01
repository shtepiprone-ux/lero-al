# Task 912 — a price is struck through only when the owner lowered it

**Sprint:** 88 ([plan](Sprint_88_A_Struck_Price_Means_A_Reduction.md)) · **Priority:** P1 · **QA profile:** Q4 ·
**Filed:** 2026-10-01 · **Executor workflow:** `.claude/skills/execute-task/SKILL.md` · **Required final status:**
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED` — never self-approval.

## 1. Mode and task type

`TASK DESIGN` → bug fix (regression) on current Mantine UI, plus a latent instance of the same rule in the listing
card. Two production files change; no new component, Story, string, token or route.

## 2. Objective

The owner's rule, verbatim (2026-10-01): *"Перекреслена ціна має бути лише тоді, коли власник оголошення змінив ціну
на меньшу і тільки на меньшу."* After this task, every listing surface strikes a price through **only** when
`price_old > price`. The converted-currency disclosure ("Original price: …") is a plain line.

## 3. Verified context

All facts below were read in this session (2026-10-01) from the working tree. Re-measure at I0 (freshness only).

| # | Label | Fact | Source |
|---|---|---|---|
| F1 | FACT | The contact card renders `{originalPriceLabel}: {originalPrice}` inside `<Text size="xs" c="dimmed" td="line-through">`. | `src/design-system/mantine/patterns/MantineListingContactPattern.tsx:156-160` |
| F2 | FACT | `originalPrice` is the converted-currency disclosure, not an old price: the route sets `originalPriceStr = needsConversion ? formatPrice(listing.price, listing.currency, locale) : null`, where `needsConversion = !!exchangeRates && !!authUser && preferredCurrency !== listing.currency`. | `src/app/[locale]/listings/[slug]/page.tsx:227,234` |
| F3 | FACT | It reaches the card through `ListingDetailView.tsx:355-356` → `LazyListingContact` → `ListingContact.tsx:213-217` → `MantineListingContactPattern` `price.originalPrice`. | those lines |
| F4 | FACT | The detail block renders the **same** disclosure without strikethrough (`MantineListingDetailPattern.tsx:219-223`), and strikes `priceOld` only when the view passes it, which `ListingDetailView.tsx:289` gates on `isPriceReduced` = `listing.price_old && listing.price < listing.price_old` (`page.tsx:221`; admin preview `preview/page.tsx:77`). | those lines |
| F5 | FACT | Regression origin: before `9596c60a5` (Task 793, 2026-09-06) the live card was legacy markup that rendered the line plainly: `<p className="text-xs text-muted-foreground mt-0.5">{originalPriceLabel}: {originalPrice}</p>`. The pattern's `td="line-through"` dates from `4715ad093` (Task 616) and went live only when 793 swapped the pattern in. | `git show 9596c60a5^:src/modules/listings/components/ListingContact.tsx` lines 161-163; `git log -S'td="line-through"'` on the pattern |
| F6 | FACT | `ListingCard` passes `priceOld` whenever `listing.price_old` is truthy, in **both** branches: `priceOld: displayPriceOld ? formatPrice(...) : undefined` with `displayPriceOld = listing.price_old ? … : null`. The pattern then renders it with `td="line-through"` (`MantineListingCardPattern.tsx:228-232` list, `:366-373` grid). | `src/modules/listings/components/ListingCard.tsx:123-125,203,292` |
| F7 | FACT | The same file's badge already uses the correct predicate: `if (listing.price_old && listing.price < listing.price_old)` → `price_reduced`. So today a card with `price_old <= price` shows a struck price with **no** "price reduced" badge. | `ListingCard.tsx:99` |
| F8 | FACT | `price_old` is a free owner-entered optional field with no relation to `price` in validation: `price_old: z.number().positive().optional()`. A `price_old` at or below `price` is therefore storable. | `src/modules/listings/validations/index.ts:9` |
| F9 | FACT | The card's own converted-currency line (`originalPriceStr`) is rendered plain (`.originalPriceList`, no `text-decoration`), and stays out of scope. | `MantineListingCardPattern.module.css:315-329`; `ListingCard.tsx:128-130` |
| F10 | FACT | Worktree at design time: the four files this task writes are clean; `docs/critical-flow-registry.md` is modified by **Task 868**'s uncommitted work. | `git status --porcelain` 2026-10-01 |
| F11 | FACT | Pre-change blob hashes: `MantineListingContactPattern.tsx` `cb418386cafbc00aac8cd64d30c5f396314843fb`; `ListingCard.tsx` `d58d07b20e6e27a3bf39271382a57a3401c8e6db`; `ListingContactPattern.stories.tsx` `c068f3d8ba5378cf2606aeba8e116aa7bd52e0f3`. | `git hash-object` 2026-10-01 |
| F12 | FACT | Story fixtures that pass `originalPrice` to the contact card: `ListingContactPattern.stories.tsx:77` (`Default`) and `ListingDetailPattern.stories.tsx:164` (the shared `contact` fixture rendered by `Default`). Both render the struck line today. No source change is needed in either; their rendered output changes. | those lines |
| F13 | FACT | `ListingCard.smoke.test.tsx` already asserts the reduced case (`:142-154` grid, `:251-262` list) and the plain case (`:156-160`); it has no case for `price_old >= price`. No test renders `MantineListingContactPattern`. | test files |
| F14 | FACT | Two critical-flow rows bind `ListingCard`'s price output: "Listings display — price + date formatting" (`docs/critical-flow-registry.md:62`, command: the three `src/lib/__tests__/*-parity`/`icu-independence` vitest files) and "Listing card rendering" (`:63`). | registry |
| F15 | INFERENCE | The detail block and the admin preview are already correct (F4); the contact card (F1) and the card (F6) are the only two places a price is struck for a non-reduction. Basis: every `td="line-through"` in `src/` was enumerated (`Grep line-through\|td=` → 4 pattern sites + `StepPreview.tsx:62`). `StepPreview.tsx` is in the dead `steps/` directory that **905** deletes; it is out of scope (§8). | grep, 2026-10-01 |

### 3.1 GR-1 census (receipts from `scripts/check-surface-census.mjs`, 2026-10-01, `win32`)

- `--surface src\design-system\mantine\patterns\MantineListingContactPattern.tsx` →
  `GR-1 CENSUS COMPLETE — 1 nodes; tier1 1 migrated+enrolled+story; tier2 0 imports removed; tier3 0 listed and filed as none.`
- `--surface src\modules\listings\components\ListingCard.tsx` →
  `GR-1 CENSUS COMPLETE — 7 nodes; tier1 7 migrated+enrolled+story; tier2 0 imports removed; tier3 0 listed and filed as none.`
- **Parent, listed and not changed by this task:** `ListingContact.tsx`'s census reports `ListingInquiryDialog` and
  `ListingReportDialog` as `tier1-unenrolled-or-unstoried` (with `@/components/ui/{button,dialog,input,label,textarea}`).
  Both are baselined (`scripts/surface-census-baseline.json:820,823`) and owned by reserved **795** (Sprint 71, "the
  three legacy `@/components/ui/dialog` dialogs"). This task does **not** edit `ListingContact.tsx`; if the executor
  finds it must, stop with `BLOCKED — CLAUSE 16d` instead.

### 3.2 Visual source map

| Visible artifact/state | Component/markup | Selector / prop | Token path | Disposition | Evidence |
|---|---|---|---|---|---|
| Contact card — converted-currency line | `MantineListingContactPattern` `<Text size="xs" c="dimmed">` | `td="line-through"` → removed | `fontSizes.xs` 0.75rem (`theme.ts:685`), `c="dimmed"` | **changed**: decoration removed; size/colour preserved | F1, F5 |
| Contact card — main price | same file `:153-155` | — | — | preserved | read |
| Card — struck `priceOld` (grid + list) | `MantineListingCardPattern` `:228-232`, `:366-373` | `td="line-through"` kept | unchanged | **preserved** in the pattern; the container stops passing `priceOld` unless reduced | F6 |
| Card — `price_reduced` badge | `ListingCard.tsx:99` | — | `sale` | preserved (predicate shared, §10) | F7 |
| Detail block `priceOld` + disclosure | `MantineListingDetailPattern` `:207-223` | — | — | preserved, out of scope | F4 |

### 3.3 Canonical UI decision record

| Visible artifact | Search queries and inspected paths | Canonical Mantine story/source | Disposition | Shared style/token path and registration |
|---|---|---|---|---|
| Converted-currency line in the contact card | `line-through`, `originalPrice`, `priceOld` over `src/`; inspected `MantineListingContactPattern.tsx`, `MantineListingDetailPattern.tsx:219-223` (the same line, plain), `ListingContactPattern.stories.tsx`, `ListingDetailPattern.stories.tsx` | `Patterns/Mantine/ListingContactPattern` (`src/stories/patterns/mantine/ListingContactPattern.stories.tsx`, imports the pattern directly, `:7`) | **reuse** — the pattern stays the owner; one prop is removed from it. The detail pattern's plain `<Text size="xs" c="dimmed">` is the matching precedent. | No new value. Already enrolled in `scripts/mantine-migration-scope.json` (census `manifest:yes story:yes`). |

`GR-0 CANONICAL REUSE PREFLIGHT — request: converted-currency line styling in the contact card; semantic queries: line-through, originalPrice, priceOld, original_price; inspected candidates: MantineListingContactPattern.tsx + Patterns/Mantine/ListingContactPattern, MantineListingDetailPattern.tsx:219-223 + Patterns/Mantine/ListingDetailPattern, MantineListingCardPattern.tsx + its .module.css; decision: REUSE; selected canonical owner: src/design-system/mantine/patterns/MantineListingContactPattern.tsx; Mantine/TailAdmin token path: theme.fontSizes.xs, c="dimmed"; new hardcoded visual values: NONE; rationale: the fix removes a decoration; no new style.`

`GR-3a STORY PREFLIGHT — MantineListingContactPattern × converted-price line; canonical candidates: Patterns/Mantine/ListingContactPattern (Default), Patterns/Mantine/ListingDetailPattern (Default); direct-import evidence: ListingContactPattern.stories.tsx:7; toolbar coverage: locale=toolbar globals.locale, viewport=toolbar; decision: REUSE; target: Patterns/Mantine/ListingContactPattern — Default; rationale: the state already exists in the Story (F12); no Story source change.`

`GR-3 STORY PROVEN — MantineListingContactPattern ← src/stories/patterns/mantine/ListingContactPattern.stories.tsx`

### 3.4 Type-scale table (GR-3c)

| Element | Role | base | sm | md | lg | Theme key | Provenance |
|---|---|---|---|---|---|---|---|
| Contact card converted-currency line | label / meta | 12px | 12px | 12px | 12px | `xs` (all) | `theme.ts:685`; unchanged by this task (decoration only) |

No changed text is 24px or larger.

### 3.5 Width and gutter contracts (GR-3b, GR-3d) for the owner-matrix Stories

- `Patterns/Mantine/ListingContactPattern` — `Default`: width — the Story's `Grid.Col span={{ base: 12, md: 5, xl: 4 }}`
  reproduces the pattern's default `sidebarFrom='md'` `rightSpan` (`MantineListingDetailPattern.tsx:146`); Story not
  changed. **GR-3d:** top/right/bottom/left = `profile` — `StoryPageGutter` all (`ListingContactPattern.stories.tsx:84`);
  the card's `Paper p="lg"` is internal padding, not a page gutter. Action: `profile present`.
- `Patterns/Mantine/ListingDetailPattern` — `Default` (blast radius: its contact column renders the changed line):
  width fluid inside `StoryPageGutter` (`:268`); Story not changed. **GR-3d:** all four sides `profile` —
  `StoryPageGutter` all (`:268`). Action: `profile present`.

If either measures a side at 0 or a doubled gutter, GR-3d binds the executor to fix it in this task.

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | Owner 2026-10-01 | The contact card's converted-currency line renders with **no** `text-decoration: line-through`; its text, label, size (`xs`) and colour (`dimmed`) are unchanged. | P1 | new pattern test (AC1) + rendered check (AC6) | Confirmed |
| R2 | Owner 2026-10-01 | `ListingCard` (grid and list) passes `priceOld` to the pattern **only** when `price_old` is set and `price_old > price`. For `price_old == price` or `price_old < price`, no struck price renders. | P1 | `ListingCard.smoke.test.tsx` new cases (AC2, AC3) | Confirmed |
| R3 | F7 | One predicate decides both the card's struck price and its `price_reduced` badge, so they cannot disagree. | P2 | source inspection + AC2/AC3 badge assertions | Confirmed |
| R4 | Preserve | A real reduction (`price_old > price`) still shows the struck old price + badge on the card in both branches, with currency conversion applied to both values; the detail block's reduction display is unchanged. | P1 | existing tests `:142`, `:251` green; AC4 | Confirmed |
| R5 | Clause 15 | Both critical-flow regression commands keep their baseline result; the new tests are recorded under the "Listing card rendering" / "Listings display — price" rows. | P1 | §13 commands; §10.4 | Confirmed |
| R6 | Q4 | A planted violation proves each new test can fail. | P1 | AC5 | Confirmed |

## 5. Assumptions and open questions

- **D88-1 (owner decision 2026-10-01, quoted in the Sprint 88 plan).** The contact card **will** show the reduced old
  price (struck, small, only when `price_old > price`), with the original-currency line on the next line — but that
  change belongs to **795**, the last open task in the contact-card chain, not to 912. In 912 the contact card still
  shows no old price; do **not** add one, and do not edit `ListingContact.tsx` or `ListingDetailView.tsx`.
- **A2.** `price_old` stays a free owner-entered field. Whether the edit flow should set or clear it automatically is a
  product question outside this bug (F8); this task makes the display truthful whatever is stored.
- Open owner decisions: **none**.

## 6. Pre-read rule bundle

`docs/golden-rules.md` (GR-0, GR-1, GR-2, GR-3a, GR-3b, GR-3c, GR-3d, GR-4) · `docs/agent-contract.md` (clauses 1, 3, 9,
14, 15, 16b-16d) · `docs/qa-profiles.md` · `docs/critical-flow-registry.md` rows at `:62` and `:63` ·
`docs/component-rules.md` → "Container / Presentational Primitive Split" · `docs/mantine-responsive-design-system.md`
(only if a rendered check surprises you).

## 7. Scope

Write paths (exact):

1. `src/design-system/mantine/patterns/MantineListingContactPattern.tsx` — remove `td="line-through"` from the
   converted-currency `Text` (`:157`).
2. `src/modules/listings/components/ListingCard.tsx` — one local predicate (§10.2) used by `getBadges` and by both
   `priceOld` sites.
3. `src/design-system/mantine/patterns/__tests__/MantineListingContactPattern.smoke.test.tsx` — **new**.
4. `src/modules/listings/components/__tests__/ListingCard.smoke.test.tsx` — new cases.
5. `docs/critical-flow-registry.md` — only under §10.4's condition.
6. `docs/sessions/2026-10-0X-task912-strikethrough-only-for-reduction.md` (new), `docs/backlog.md` (912's own row
   state only), and evidence under `docs/sessions/evidence/task912/`.

## 8. Out of scope

- `ListingContact.tsx`, `ListingDetailView.tsx`, `[slug]/page.tsx`, `admin/listings/[id]/preview/page.tsx` — already
  correct (F4) or pure pass-through (F3). Do not edit.
- `MantineListingCardPattern.tsx` and its CSS — the pattern renders what it is given; the decision belongs to the
  container (component-rules split).
- `StepPreview.tsx` (`steps/`, deleted by **905**).
- Story source files, `messages/*.json` (dirty with 868's work), fixture key names such as `card_price_old_1`.
- The contact card's reduced old price (D88-1 → **795**) and how `price_old` is written (A2).

## 9. Current and required behavior

| Case | Today | Required |
|---|---|---|
| Signed-in, preferred currency ≠ listing currency, no reduction | Contact card: "Original price: 120 000 EUR" **struck through** | Same line, **not** struck |
| Same, and `price_old > price` | Detail block: struck old price (converted) + badge; contact card: struck "Original price" | Detail block unchanged; contact card line not struck |
| Card, `price_old > price` | Struck old price + "Price reduced" badge | Unchanged |
| Card, `price_old == price` or `price_old < price` | Struck `price_old`, **no** badge | No struck price, no badge |
| Card, `price_old` null | Plain price | Unchanged |
| Guest, or rates unavailable | No disclosure line | Unchanged |

## 10. Implementation requirements

1. **Contact pattern.** Delete only the `td="line-through"` prop at `:157`. Keep `size="xs" c="dimmed"`, the
   conditional, and the text. No other change in the file.
2. **Card predicate.** In `ListingCard.tsx`, compute once per render, from the raw listing values (same currency,
   before conversion):
   `const isPriceReduced = listing.price_old != null && listing.price < listing.price_old`.
   Use it for the badge (`:99` — `getBadges` receives it or computes it through the same named helper; do not keep two
   copies of the comparison) and for both `priceOld` sites: `priceOld: isPriceReduced && displayPriceOld != null ?
   formatPrice(displayPriceOld, activeCurrency, locale) : undefined`. A module-level function
   `isListingPriceReduced(listing)` in the same file, called from both places, satisfies R3; no new module.
3. **Tests (observable behaviour).**
   - New `MantineListingContactPattern.smoke.test.tsx` (harness: copy the `MantineProvider` + `matchMedia` stub shape
     of `MantineListingCardPattern.smoke.test.tsx:15-35`): render `state="normal"` with `price.originalPrice` and
     `originalPriceLabel`; assert the line's text is present and its decoration is **not** `line-through` (same
     assertion form as `ListingCard.smoke.test.tsx:148`, negated); and that without `originalPrice` the line is absent.
   - `ListingCard.smoke.test.tsx`: for **both** variants add `price_old == price` and `price_old < price` cases
     asserting no element with `line-through` decoration contains the old price, and no "Price reduced" badge.
     Add one converted-currency reduced case (`displayCurrency` + `rates`, `price_old > price`) asserting the struck
     value is the **converted** old price.
4. **Critical-flow registry.** At I0 run `git status --porcelain -- docs/critical-flow-registry.md`. If it prints
   nothing, add the new test files to rows `:62`/`:63`'s regression-test cell and command. If it prints a line (868's
   uncommitted work), **do not edit the file**; write the exact row text you would add into the session log under
   "Registry addition owed", for the orchestrator to apply at review.

## 11. Positive and negative flows

**Positive:** signed-in user sets preferred currency ALL, opens a EUR listing with no reduction → main price in ALL;
contact card shows "Original price: X EUR" plain; no struck text anywhere on the page.

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| `price_old` equal to or below `price` (owner input) | Yes | F8 | No struck price, no badge, on card and detail | AC2, AC3 |
| Exchange rates unavailable | Yes (preserve) | `page.tsx:227` | No conversion, no disclosure line | existing behaviour; AC1 absent-case |
| Guest viewer | Yes (preserve) | `page.tsx:227` `!!authUser` | No disclosure | unchanged code path |
| Validation / Authorization / Offline / Concurrent writer | No | read-only display change | N/A | — |

## 12. Acceptance criteria

- **AC1 [R1]** Given `MantineListingContactPattern` with `price.originalPrice` set, when rendered, then the
  "Original price: …" text is present and its `text-decoration-line` is not `line-through`; given no `originalPrice`,
  the line is absent.
- **AC2 [R2, R3]** Given a `ListingCard` (grid and list) with `price_old === price`, when rendered, then no element
  whose text is the old price has `line-through` decoration, and "Price reduced" is absent.
- **AC3 [R2, R3]** Given `price_old < price`, the same as AC2.
- **AC4 [R4]** Given `price_old > price` with and without currency conversion, then the struck old price (converted
  when conversion is active) and "Price reduced" render in both variants; the existing tests at `:142` and `:251`
  pass unchanged.
- **AC5 [R6]** Given each new test, when its fix is reverted (plant: re-add `td="line-through"` at `:157`; plant:
  restore `displayPriceOld ? …` at both `priceOld` sites), then that test fails; when restored, it passes and the
  file's `git hash-object` equals its post-fix value.
- **AC6 [R1]** Given Storybook, when `Patterns/Mantine/ListingContactPattern` → `Default` and
  `Patterns/Mantine/ListingDetailPattern` → `Default` are opened, then the contact card's "Original price" line has
  computed `text-decoration-line: none` at 320 and 1440, and all four GR-3d sides are non-zero.
- **AC7 [R5]** Given the two critical-flow commands, when run before and after, then their pass/fail sets are equal
  apart from the new tests, which pass.

`GR-4 AC AUDIT — 7 criteria; each states an observable property; absolutes: none.`

## 13. QA profile and verification plan

**Q4** — the change touches two critical-flow rows (F14); visible change on an existing surface (Q2 rendered widths).
No new primitive, overlay or layout, so not Q3.

### 13.1 I0 baseline (before any write)

```powershell
node.exe -p process.platform
git --no-optional-locks status --porcelain
git hash-object src\design-system\mantine\patterns\MantineListingContactPattern.tsx src\modules\listings\components\ListingCard.tsx src\stories\patterns\mantine\ListingContactPattern.stories.tsx
npx.cmd vitest run src/lib/__tests__/price-format-ssr-parity.smoke.test.ts src/lib/__tests__/date-format-icu-independence.smoke.test.ts src/lib/__tests__/date-format-ssr-parity.smoke.test.ts
npx.cmd vitest run src/modules/listings/components/__tests__/ListingCard.smoke.test.tsx
```

Expected: `win32`; hashes equal F11 (a mismatch is a stop — report it); record each vitest pass/fail list verbatim.
`ListingCard.smoke.test.tsx` may already be red on the two archived-badge cases (reserved **790**); record, do not fix.

### 13.2 Final gate block (after the last write, one pass, transcript retained)

```powershell
node.exe -p process.platform
npx.cmd vitest run src/design-system/mantine/patterns/__tests__/MantineListingContactPattern.smoke.test.tsx src/modules/listings/components/__tests__/ListingCard.smoke.test.tsx
npx.cmd vitest run src/lib/__tests__/price-format-ssr-parity.smoke.test.ts src/lib/__tests__/date-format-icu-independence.smoke.test.ts src/lib/__tests__/date-format-ssr-parity.smoke.test.ts
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run check:design-tokens
npm.cmd run check:rendered-scope
npm.cmd run check:mojibake
npm.cmd run build
git hash-object src\design-system\mantine\patterns\MantineListingContactPattern.tsx src\modules\listings\components\ListingCard.tsx src\design-system\mantine\patterns\__tests__\MantineListingContactPattern.smoke.test.tsx src\modules\listings\components\__tests__\ListingCard.smoke.test.tsx
git --no-optional-locks status --porcelain
```

Expected: new tests pass; pre-existing failures equal the I0 list; every `npm.cmd` command exits 0 (`build` is the hard
gate); status shows only §7 paths plus pre-existing unrelated entries.

### 13.3 Plants (AC5)

Use Node `readFileSync`/`writeFileSync` (never `Get-Content -Raw`); record `git hash-object` before the plant, after
the restore, and require equality with the post-fix hash. Plant A on the pattern → the new pattern test fails. Plant B
on the card → the AC2/AC3 cases fail. Retain both transcripts.

### 13.4 Rendered checks (AC6, GR-3b/3d)

Build Storybook, then measure on both Stories at **320, 390, 768, 1024, 1440** in `en`, and in `sq`, `uk`, `it` at 320
and 1440 (`uk@320` mandatory): the original-price line's computed `text-decoration-line`, its `font-size`, and all
four edge distances. Emit `GR-3b`, `GR-3c` and `GR-3d` receipts per Story.

### 13.5 OWNER VISUAL QA REQUIRED

| Story | State | Locales | Viewports |
|---|---|---|---|
| `Patterns/Mantine/ListingContactPattern` | `Default` (normal section, "Original price" line) | sq · en · uk · it | 320 · 1440 |
| `Patterns/Mantine/ListingDetailPattern` | `Default` (sidebar contact card) | en · uk | 390 · 1440 |

Owner live check after deploy (non-command steps):

1. Sign in, set the preferred currency in settings to one different from a listing's currency.
2. Open that listing (one without a reduction): no struck-through price anywhere.
3. Open a listing whose owner lowered the price: the old price is struck in the detail block, converted to the
   preferred currency.

## 14. Completion report contract

Session log `docs/sessions/2026-10-0X-task912-strikethrough-only-for-reduction.md` with: Files Changed table matching
`git status`; R1-R6 status; every command with exit code; I0 vs final vitest pass/fail lists; plant transcripts with
hashes; rendered measurements; receipts GR-0, GR-1 (re-run both §3.1 censuses), GR-3, GR-3a, GR-3b, GR-3c, GR-3d; the
registry outcome (§10.4); assumptions, deviations, limitations. Update only 912's row in `docs/backlog.md`. End with
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`. No git commands.

## 15. Task quality gate

- Fresh-session executable: every path, line, hash and command above was read or run on 2026-10-01.
- Absence claim F15 ("only two struck-for-non-reduction sites") rests on a whole-`src` grep of `line-through|td=`,
  with each hit opened; `StepPreview.tsx` named and excluded with its owner (905).
- No new visual value, Story, string or token; the only removed value is a decoration with a precedent (F4).
- Dirty-worktree: the one shared path (`docs/critical-flow-registry.md`, 868) has an explicit conditional (§10.4).
- Clause 16d: changed surfaces' censuses are clean; the parent's two unmigrated dialogs are listed and owned by 795.
