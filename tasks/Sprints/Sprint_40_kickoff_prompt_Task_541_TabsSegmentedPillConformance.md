# Task 541 — Tabs → TailAdmin segmented/pill conformance (drop the underline variant)

> **Sprint 40 (TailAdmin Conformance — All Primitives). Owner P0, 2026-07-04.**
> **Executor:** Sonnet 4.6. **Type:** UI / primitive chrome conformance (`theme.ts` + `input-chrome.css` + the
> Tabs story) — NOT product code.
> **Status:** OPEN. Sequence AFTER Task 539 (SegmentedControl) is committed, since both touch `input-chrome.css`.
> **Origin:** Task 539 Scope C surfaced a STOP-AND-ASK — `tailadmin-style-reference.md` §6c (line 110) and §6l
> (lines 430–433) both state, twice and measured, that TailAdmin's canonical tab bar is the **segmented/pill
> style, NOT underline (`border-b-2`)**. Our `Tabs.stories.tsx` renders Mantine's **default (underline)** variant.
> **Owner decision (2026-07-04):** *"переробити Tabs на стиль як у TailAdmin, щоб нічого взагалі не відрізнялось"* —
> convert Tabs to the segmented/pill look so nothing differs from TailAdmin.

## 🔴 Step 0 (do FIRST) — revert the premature Task 539 Tabs text-color rules

Task 539 added a stop-gap text-color fix to the **underline** Tabs (inactive `gray-5` / active `brand-7`) in
`src/design-system/mantine/input-chrome.css` (the `.mantine-Tabs-tab` + `.mantine-Tabs-tab[data-active]` block,
"Tabs — §6c-analog inactive/active label chrome (Task 539 Scope C finding)"). That fix is **superseded** by this
redesign (a segmented tab has a *white active pill + gray-9 text*, not brand-colored text on an underline). **Delete
that block** before implementing the segmented chrome, so no stale/contradictory rule remains. This step is why 541
must land after 539's SegmentedControl commit (shared file).

## Current behavior to preserve

- `Tabs.stories.tsx` (`Mantine/Primitives/Tabs`): single `Default` export, `skipCanvas: true` + `layout:'fullscreen'`,
  `storyT()` i18n keys (`storybook.mantine.tabs_demo_tab_overview|details|activity`, `..._panel_text`) with full
  `sq/en/uk/it` parity, `MantineStoryShell width="constrained"`, three tabs (overview/details/activity) + three panels,
  the swipe-on-overflow `ScrollArea type="auto" scrollbars="x" scrollbarSize={0}` wrapper, and `Tabs.List
  flexWrap:'nowrap'` (owner P0 — tabs never wrap to a second line). Keep all panels, all three tabs, and the i18n.
- `theme.ts` `components.Tabs`: keep `color:'brand'`, `styles.tab.minHeight:'2.75rem'` (≥44px), `styles.list.flexWrap:'nowrap'`.

Do NOT remove any tab, panel, or state. Do NOT touch any other primitive. Single-source only — fixes live in
`theme.ts` / `input-chrome.css` / the Tabs story, **no per-story chrome overrides**, no new component clone.

## Required after behavior — segmented/pill chrome, every value cited to §6c/§6l (zero invented)

Switch Tabs from the underline variant to the **segmented/pill** look that visually equals `SegmentedControl`
(§6c). Use Mantine `variant="pills"` on the `Tabs` root (story) and drive the chrome from the canonical theme +
`input-chrome.css` state selectors (§18.1 — inline `theme.styles` cannot express `[data-active]`/`:hover`, so state
colors go in `input-chrome.css`, exactly as the SegmentedControl fix did). All tokens below already exist in
`theme.ts`; use `var(--mantine-color-*)` / `var(--mantine-radius-*)` / `var(--mantine-shadow-xs)`.

**Container (`Tabs.List` slot) — §6c "Segment toggle → Container" + §6l Tabs (measured):**
- `background: var(--mantine-color-gray-1)` — §6c `bg-gray-100` (track).
- `border: 1px solid var(--mantine-color-gray-2)` — §6c `border border-gray-200`.
- `border-radius: var(--mantine-radius-lg)` (8px) — §6c `rounded-lg` / §6l measured 8px.
- `padding: 0.25rem` (4px) — §6c `p-1` / §6l measured 4px.
- `gap: 0.25rem` (4px) — §6c `gap-1`.
- content-width, left-aligned at `≥640`; **full-width `<640`** (mobile gate below).

**Tab item (`Tabs.Tab` slot), inactive resting — §6c "Item base":**
- `border-radius: var(--mantine-radius-md)` (6px) — §6c `rounded-md` (distinct from the 8px container).
- `padding-inline: 0.75rem` (12px) — §6c `px-3`. Vertical height via the existing `minHeight:2.75rem` + flex-center
  (same ≥44px touch exemption as SegmentedControl/Button).
- `font-size: var(--mantine-font-size-sm)` (14px) — §6c `text-theme-sm` (already Mantine default).
- `font-weight: 500` — §6c `font-medium` (already set).
- `color: var(--mantine-color-gray-5)` — §6c `text-gray-500`.
- NO bottom underline/border — remove the underline entirely (that is the whole point).

**Tab item hover (inactive only) — §6c `hover:text-gray-700`:**
- `color: var(--mantine-color-gray-7)`, guarded `@media (hover: hover)` and `:not([data-active])`,
  mirroring the SegmentedControl rule.

**Tab item active — §6c "Item active" + §6l "active = white pill + shadow":**
- `background: var(--mantine-color-white)` — §6c `bg-white`.
- `color: var(--mantine-color-gray-9)` — §6c `text-gray-900`.
- `box-shadow: var(--mantine-shadow-xs)` — §6c `shadow-theme-xs`.
- `border-radius: var(--mantine-radius-md)` (6px).

**Do NOT** leave any brand-colored tab text and **do NOT** keep the `color='brand'` underline indicator visually —
if `color='brand'` no longer has any visible effect under `variant="pills"`, remove it and update the theme comment;
if it still tints something, neutralize it so the active tab is the white pill above (STOP-AND-ASK if Mantine's pills
variant fights this and you cannot reach the white-pill look via theme + `input-chrome.css` without a per-story hack).

Update the `theme.ts` `components.Tabs` block comment: replace the "Inactive/active text-color … deferred" note with
a note that Task 541 converted Tabs to the §6c/§6l segmented/pill chrome (cite the rows).

## 🔴 Mobile <640 full-width gate (agent-contract clause 11) — MANDATORY

- At `<640` the `Tabs.List` container is **full-width edge-to-edge within the shell** (not content-width, not a
  centered pill row). Match the SegmentedControl proven pattern: full-width track + the existing
  `ScrollArea scrollbars="x" scrollbarSize={0}` handles horizontal swipe when the three labels overflow at 320
  (§6l line 431 measured `overflow-x-auto`). Tabs stay in a single row (`flexWrap:'nowrap'`, owner P0) — never wrap.
- At `≥640`: content-width, left-aligned (§6c "content-width on desktop, NOT stretched").
- Touch targets ≥44px (existing `minHeight:2.75rem`). Long `sq/en/uk/it` labels must not clip; no horizontal scroll
  bar chrome visible at 320 (swipe only). If a label genuinely cannot fit at 320 without clipping inside the pill,
  STOP and ASK — do not shrink font below §6c 14px.

## Positive + Negative flow

- **Positive:** `Mantine/Primitives/Tabs` at `≥640` and `320` × `sq/en/uk/it` renders the gray-1 track + gray-2
  border + 8px radius + 4px padding container, inactive tabs `gray-5`/14px/500, active tab **white pill + gray-9 text
  + shadow-xs + 6px radius**, hover (inactive) `gray-7`. Clicking a tab moves the white pill and swaps the panel.
  Visually indistinguishable from the TailAdmin `/tabs` segmented reference and from our `SegmentedControl`.
- **Negative:**
  - (a) `uk@320/375/390` — three long labels stay one row, swipe-scroll on overflow, no clip, no h-scroll chrome,
    full-width track. (mobile gate)
  - (b) Keyboard: arrow-key tab navigation + `Tab`/`Enter` focus still works (Mantine default — verify not broken by
    the restyle); focus ring visible on the focused tab.
  - (c) No underline/`border-b` remains anywhere on the tab or list.
  - (d) The Task 539 stale `.mantine-Tabs-tab` underline text-color rules are gone (Step 0) — grep proof in the log.
  - (e) Global-change (Note 14): no OTHER Tabs consumer regresses. Grep every `<Tabs` / `Tabs.List` usage in `src/`
    and confirm each still renders correctly (or list them and state none exist outside the story). SegmentedControl
    (Task 539) unchanged — re-verify its cells did not shift.

## Pre-read (rule-index → UI / layout / component task)

- `docs/agent-contract.md` (clauses 1–16) + `docs/backlog.md` + `docs/critical-flow-registry.md` (scan — primitive
  chrome touches no registry flow; confirm & note).
- 🔴 `docs/tailadmin-style-reference.md` — §6c (segment toggle) + §6l Tabs (lines 430–433). Style source of truth;
  every value must trace to a §-row (all needed rows already exist — do NOT invent).
- `docs/mantine-responsive-design-system.md` §7 (mobile gate), §12 (canonical patterns), §16 (acceptance gates),
  **§18 (theming pitfalls — `theme.styles` inline-only; state selectors via `input-chrome.css`; `var()` fallback
  inside parens)**.
- `docs/ui-rules.md`, `docs/component-rules.md`, `docs/qa-rules.md`, `docs/storybook-governance.md` §14.

## Gates to close (clauses 12 + 13 + 16) — HELD until ALL green

- `npm run screenshots:assert -- --mantine-only` full matrix, **`uk@320/375/390` mandatory** + `≥640` cells, with a
  **side-by-side rendered comparison of the Tabs story vs the TailAdmin `/tabs` segmented reference** (the clause-16
  style proof — `tsc=0`/build-green is NOT style proof).
- Planted-violation FAIL transcript proving the gate catches a real chrome/overflow break on the Tabs surface (reuse
  the shell-level `miw={{base:900,sm:0}}` method proven in Tasks 536/539/540; revert after).
- `npx tsc --noEmit`, `npm run check:stories`, `npm run check:i18n`, `npm run check:mojibake`,
  `npm run check:design-tokens -- --strict`, `npm run check:file-integrity` — all green.
- Regression (clause 15): no `docs/critical-flow-registry.md` flow touched — confirm & state.

## Acceptance criteria

1. Step 0 done: the Task 539 `.mantine-Tabs-tab` underline text-color block is removed from `input-chrome.css`
   (grep-verified, shown in the log). (§clause-1 scope, no stale rule)
2. Tabs render the §6c/§6l segmented/pill chrome: gray-1 track, gray-2 border, 8px radius, 4px pad/gap container;
   inactive `gray-5`, hover `gray-7`, active **white pill + gray-9 + shadow-xs + 6px radius**; NO underline. Each
   value cites its §-row; zero invented numbers (clause 16). Rendered proof side-by-side with the zip/`/tabs`.
3. Mobile <640 gate met: full-width track, single-row swipe-scroll, ≥44px, labels don't clip, no h-scroll at 320,
   proven at `uk@320/375/390` (clause 11 + 12).
4. All panels/tabs/i18n/states preserved; keyboard nav + focus ring intact; no other Tabs consumer regressed
   (Note 14); SegmentedControl unchanged (re-verified). No per-story chrome override.
5. Rendered `--assert` matrix + planted-violation FAIL transcript attached; all light gates green.
6. Session log: Files-Changed table (one row/path + rationale), AC-by-AC self-audit, `Self-validation: …` line.
   **Do NOT run git** — HELD for orchestrator diff review + commit emission.

## Commit hand-off (HELD)

Do NOT emit `git add`/`git commit`. HELD — the orchestrator reviews the real diff + the native rendered matrix, then
emits explicit-path commit commands (`theme.ts`, `input-chrome.css`, `Tabs.stories.tsx`, plus the session log /
backlog). Owner runs them in PowerShell after the native gate. Because Task 541 shares `input-chrome.css` with Task
539, **539's SegmentedControl commit must land first** — then 541's `input-chrome.css` diff is only the Tabs
segmented rules (minus the reverted stop-gap).
