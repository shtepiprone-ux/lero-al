# Task 615 — `MantineListingDetailPattern` contact-CTA never switches to row at `sm+` (inline-`style` specificity bug)

Sprint 44 (Epic MM Phase-2). Orchestrator-opened 2026-07-16 from the **Task 609 review** (out-of-scope
observation, flagged not fixed — no scope creep on 609). This is the follow-up that fixes it.

## Pre-read (rule-index: UI / layout / component task)
- **Always:** `docs/agent-contract.md`, `docs/backlog.md`, `docs/critical-flow-registry.md` (scan — this touches
  the "Listing card / detail rendering" pattern group; the pattern is Storybook-only, not yet wired to the live
  page, so no live critical-flow behavior changes — the rendered gate IS the coverage).
- **Required:** `docs/mantine-responsive-design-system.md` (**FIRST** — §7 mobile gate, **§the responsive-prop
  system** `Flex direction={{ base, sm }}` is the canonical way to switch axis by breakpoint; §18 Mantine CSS
  pitfalls — inline `style` vs `styles` precedence), `docs/tailadmin-style-reference.md` (§6a Button chrome — the
  buttons' visual chrome must stay byte-identical), `docs/ui-rules.md`, `docs/component-rules.md`, `docs/qa-rules.md`.
- **Storybook gate:** `docs/storybook-governance.md` §14 + §14.4 (geometry checks) — the fix must keep
  `--mantine-only` green with 0 FAIL.

## Root cause (confirmed in the Task 609 review)
`MantineListingDetailPattern.tsx:129`:
```tsx
<Group gap="sm" style={{ flexDirection: 'column' }} styles={{ root: { '@media (min-width: 40em)': { flexDirection: 'row' } } }}>
```
The inline `style={{ flexDirection: 'column' }}` is applied as an element inline style, which **always beats a
stylesheet rule** — including a `styles`-prop rule nested inside `@media (min-width: 40em)`, regardless of whether
the media condition matches. So the `@media … { flexDirection: 'row' }` override is dead: the two contact CTAs
(`Call` + `WhatsApp`) stay **column-stacked at every width**, never switching to a side-by-side row at `sm+`
(≥640px) as the component's own JSDoc (lines 30–39) and the Task 609 kickoff both specify.

## Current behavior to preserve (do NOT regress)
- **`<640` (base / P0 mobile gate):** the two CTAs are **full-width, stacked** (column). This is correct today and
  MUST stay exactly as-is — full-width, ≥44px touch targets, labels wrap in all four locales (`sq/en/uk/it`), no
  clip, no horizontal overflow at 320.
- Button chrome (color `brand` / `green`, `size="md"`, `fullWidth` at base) — visually byte-identical (TailAdmin
  §6a). This is a layout-axis fix, NOT a restyle.
- Everything else in the pattern (Grid `gutter={0}` + `pr`/`mb` from Task 609, sticky contact `Paper`
  `position:sticky; top:80`, gallery, features `SimpleGrid`) — **untouched**.

## Required after-behavior (the delta)
1. At **`sm+` (≥640px)** the two CTAs render **side by side in a row**, sharing the available width of the contact
   column equally (each ≈ 50% of the row minus the `gap="sm"`), each still ≥44px tall, labels wrapping (never
   clipping) in all four locales.
2. At **`<640`** the CTAs stay **full-width stacked** — byte-identical to today.
3. **Fix the axis switch the canonical Mantine way — remove the inline-`style` specificity trap entirely.** Replace
   the `Group` + inline `style` + `styles`-`@media` hack with a Mantine responsive-prop switch, e.g. a
   `Flex direction={{ base: 'column', sm: 'row' }} gap="sm"` (canonical per `mantine-responsive-design-system.md`),
   and make each `Button` share the `sm+` row (drop `fullWidth` at `sm+` and give each `flex: 1` / `style={{ flex: 1 }}`,
   or the Mantine-idiomatic equivalent). Do **NOT** leave any inline `style` that hard-pins `flexDirection`. No
   breakpoint fork / duplicated JSX — one element tree, responsive props only.

## Positive flow
- Storybook `Patterns/Mantine/ListingDetailPattern/Default`, viewport ≥640 (e.g. 1024), any locale → the two CTAs
  are in a single row, side by side, equal width, labels intact.
- Same story at 320/375/390 → CTAs full-width, stacked (unchanged from today).
- `npm run screenshots:assert -- --mantine-only` → `ListingDetailPattern` 16/16 PASS (0 `horizontal-overflow`,
  0 `text-clipped`), overall **0 FAIL, 0 KNOWN-FAILURE, exit 0**; the 27 pre-existing AMBIGUOUS cells unchanged.

## Negative flow
- **Labels can't fit two-across without clipping** in the narrow `span 4` contact column at `sm` (768px is the
  tightest two-column width; `uk`/`it` are the longest labels) → the buttons must **wrap the label text**
  (`whitespace-normal`, no clip), NOT overflow or shrink below 44px height. If two-across genuinely cannot render
  without clipping/overflow at any `sm+` breakpoint × locale, **STOP and ASK** the owner (stacked-full-width may be
  the deliberate choice for the narrow column) — do not silently ship a clipped or overflowing row.
- **Fix reintroduces horizontal overflow** (row buttons wider than the column) → REJECT-worthy; the row must fit the
  contact column at every `sm+` breakpoint. Re-verify the geometry gate stays 0 FAIL.
- **`<640` behavior changes** (CTAs no longer full-width stacked) → P0 mobile-gate regression, REJECT.
- **Sticky contact panel breaks** (the fix introduces an `overflow`/`transform`/`contain` ancestor) → REJECT; the
  `position:sticky; top:80` panel must still stick. It should not be at risk (this change is inside the panel), but
  confirm it.

## Acceptance criteria
1. `sm+`: CTAs side-by-side row, equal width, ≥44px tall, labels wrap not clip — rendered proof at 768 + 1024 ×
   `sq/en/uk/it`. (clause 12 + TailAdmin clause 16)
2. `<640`: CTAs full-width stacked, byte-identical to today — rendered proof at 320/375/390 × 4 locales; `uk@320`
   mandatory. (clause 11 + 12)
3. No inline `style` pinning `flexDirection` remains; the switch is a Mantine responsive prop (`file:line`); no
   breakpoint fork / duplicated JSX.
4. `npm run screenshots:assert -- --mantine-only` → `ListingDetailPattern` 16/16 PASS, overall 0 FAIL,
   0 KNOWN-FAILURE, exit 0; the 27 pre-existing AMBIGUOUS cells unchanged (full transcript).
5. Anti-regression (clause 13): plant a real overflow/clip in the CTA row, show the geometry gate FAILs, then revert
   — proves the fix didn't neuter the check. (planted-then-reverted transcript)
6. `npx tsc --noEmit`, `npm run check:file-integrity`, `npm run check:mojibake`, `npm run check:stories` all clean.
   Session log + `docs/backlog.md` (mark 615 done, tidy) + "Files Changed" table. **NO git commands** (single-writer).

## Scope (files)
**In scope:** `src/design-system/mantine/patterns/MantineListingDetailPattern.tsx` (the `Group`→responsive-`Flex`
CTA fix only), the persisted screenshots dir, `docs/backlog.md`, session log. If the geometry gate's persisted
inventory report auto-regenerates on the assert run, that mechanical change is in scope too.
**Out of scope:** the Grid gutter (Task 609, done — do not touch `gutter={0}`/`pr`/`mb`), the sticky panel, gallery,
features, the stale JSDoc `cols={{…}}` comment (cosmetic, separate if ever), every other pattern/primitive,
`ListingDetailView.tsx` live-page wiring.

## Hard contract
No scope creep — CTA axis switch ONLY. `<640` full-width-stacked behavior byte-identical (P0 mobile gate). Button
chrome byte-identical (TailAdmin). No inline `style` `flexDirection` pin left behind; canonical Mantine responsive
prop only; no breakpoint fork. Preserve the sticky contact panel. Mandatory planted-violation anti-regression proof
(AC5). Rendered matrix at 320/375/390/768/1024 × `sq/en/uk/it`, `uk@320` mandatory. STOP and ASK if two-across
clips in the narrow column at any `sm+` cell. Executor emits NO git.
