# Task 622 — Fix theme-wide Mantine Button vertical-centering (`height:'auto'` breaks inner `height:100%`)

## Mode and task type

- Mode: implementation kickoff for a fresh Sonnet session (execute via `.claude/skills/execute-task/SKILL.md`).
- Task type: **UI — shared Mantine primitive fix** (design-system `theme.ts` Button styles). High blast radius: every Mantine `Button` site-wide.
- UI boundary: **current Mantine/TailAdmin path**. Source of truth: `docs/mantine-responsive-design-system.md` (behavior/responsive) + `docs/tailadmin-style-reference.md` (chrome/density).

## Objective

Make the canonical Mantine `Button` vertically center its content (icon + label) inside the enforced 44px touch-target box, at the **shared theme level**, so the fix applies to every Button instead of being patched per-control. This generalizes the local override shipped in Task 621 (`AgentCtaButton.tsx`). The fix must not regress height, width, full-width behavior, label wrapping, variant chrome, or any prior Button theme behavior (Tasks 502, 527, 567, 587, 589).

## Verified context

All facts below were inspected in the repo on 2026-07-17. Re-open the cited files to implement; do not re-derive.

### Root cause (verified against compiled Mantine CSS + theme source)

- Mantine root `.m_77c9d27d` (`node_modules/@mantine/core/styles/Button.css:12-48`): `display: inline-block`, `height: var(--button-height, var(--button-height-sm))`, `vertical-align: middle`. The **root does not flex-center its own children** — it relies on the inner element to fill the root's explicit height and center the content.
- Inner `.m_80f1301b` (`Button.css:122-127`): `display: flex; align-items: center; justify-content: var(--button-justify, center); height: 100%; overflow: visible;`. Centering is delegated to the inner, and depends on `height: 100%` resolving against a **definite** root height.
- Theme override `src/design-system/mantine/theme.ts` Button `styles.root` (lines 304-312): sets `minHeight: '2.75rem'` (44px touch target, unconditional), `fontWeight: '500'`, and **`height: 'auto'`** (added for Task 502 so the root can grow past `minHeight` when a long label wraps).
- **Defect:** a percentage height (`inner { height: 100% }`) cannot resolve against an `auto`-height parent (CSS spec) → the inner collapses to its own content height (~16-20px). Because the root is `inline-block` (not flex), the extra `min-height` slack (44px − ~18px) is left below the content, so the icon+label group renders **top-aligned**, not centered. Task 621 measured a **~13px vertical offset** (`rootCenter` 613.48 vs `label/sectionCenter` 600.48 at 1920px).
- **Scope of impact:** any Button whose natural content height is less than the 44px `minHeight` — i.e. effectively **all app buttons**, most visibly those with a `leftSection`/`rightSection`. `leftSection` appears in 20 files; `rightSection` in 13; 43 files consume `@mantine/core` `Button`.

### Local precedent to generalize (verified)

- Task 621 `src/components/shared/AgentCtaButton.tsx:22-29` fixed this **for one control** with `styles.root: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }` (plus a separate `paddingInlineStart` fix, unrelated to centering). Verified result: `rootCenter === innerCenter === labelCenter` to sub-pixel at 320/390/768/1024/1440/1920.

### Constraints that any theme-level fix must preserve (verified)

- **Full-width buttons** rely on Mantine `[data-block] { display: block; width: 100% }` (`Button.css:50-53`). Consumers: `MobileNavDrawer.tsx:88,91` (`fullWidth`), `FiltersPanel.tsx:89` (`fullWidth` + `leftSection`), `MantineAuthFormPattern.tsx:105` (`fullWidth size="md"`), `MantineCountButton` pattern. A root-level `display` override that is not gated on `fullWidth` **would break these** (shrink-to-fit instead of 100%). This is exactly the regression Task 621 caught locally (`display:flex` → full-width bug → corrected to `inline-flex`).
- **No `justify=` Button consumers exist** (grep: 0 hits) — so `--button-justify` space-between layouts are not a current concern, but the fix must still not hard-code `justify-content` in a way that would fight `--button-justify` if introduced later.
- **Label wrapping** (Tasks 502/567): `styles.label` sets `whiteSpace: 'normal'; overflowWrap: 'break-word'` and root `height: 'auto'` must remain so a wrapped 2–3 line label still grows the button. The fix must keep wrap-growth working.
- **Variant chrome via `vars`** (Tasks 587/589): `transparent`/`outline`/`default` overrides live in `vars` (not `styles`) for merge-precedence reasons. Do not move or duplicate them.

### Visual source map (required for UI)

| Visible artifact/state | Component/markup | Class/selector | Utility, cascade, and token path | Disposition | Evidence |
|---|---|---|---|---|---|
| Icon+label vertical position | Mantine `Button` inner | `.m_80f1301b { height:100%; align-items:center }` | percentage-height vs theme root `height:auto` → unresolved → top-aligned | **Changed** — must render vertically centered within the 44px box | `Button.css:122-127`, `theme.ts:308` |
| 44px touch target | theme root | `styles.root.minHeight: '2.75rem'` | unconditional 44px floor | **Preserved** — height/min-height must stay 44px | `theme.ts:306` |
| Wrap-growth for long labels | theme root | `styles.root.height: 'auto'` + `styles.label` | Task 502/567 | **Preserved** — wrapped labels still grow the button | `theme.ts:308,318` |
| Full-width buttons | Mantine `[data-block]` | `display:block; width:100%` | Mantine fullWidth | **Preserved** — fullWidth stays 100% wide | `Button.css:50-53`, `MobileNavDrawer.tsx:88` |
| Variant fills/borders | theme `vars` | `--button-bg/-color/-bd` | Tasks 587/589 | **Out of scope** — untouched | `theme.ts:280-295` |

## Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | Task 621 finding #3 | Mantine `Button` content (icon+label) is vertically centered within the enforced 44px box, applied at the shared theme level (`theme.ts`), not per-control | P1 | DOM measurement: `rootCenter ≈ innerCenter ≈ labelCenter` (±1px) across the Button story matrix | Confirmed |
| R2 | Preserve | 44px `minHeight` touch target unchanged for every button/size/variant | P0 | Measured height = 44px (≥44px when wrapped) | Confirmed |
| R3 | Preserve | Full-width (`fullWidth`) buttons remain 100% wide; natural-width buttons remain shrink-to-fit | P0 | Measured width at the fullWidth consumers + a natural-width button | Confirmed |
| R4 | Preserve (Task 502/567) | Long/​wrapping labels still grow the button vertically; no clipping, no horizontal overflow at 320px | P1 | Rendered wrap cell at 320 incl. `uk` | Confirmed |
| R5 | Preserve (Task 587/589) | `filled`/`default`/`outline`/`subtle`/`light`/`transparent` chrome (fill, border, color, hover) unchanged | P1 | Story visual diff across variants + TailAdmin side-by-side | Confirmed |
| R6 | DRY / regression | The Task 621 Homepage Agent-CTA still renders correctly (centered, full-width <640, natural ≥640) after the theme fix | P1 | Re-measure the Homepage CTA at 320/390/768/1440 | Confirmed |
| R7 | Design-system integrity | Fix is display-agnostic OR correctly gated so it cannot break `[data-block]`; no new off-token raw values (rem exemption for touch-target only) | P1 | `check:design-tokens`; diff inspection | Confirmed |

## Assumptions and open questions

- **A1 (recommended fix — verify empirically):** Add an **`inner`** override to `theme.ts` Button `styles`: `inner: { minHeight: '2.75rem' }`. Rationale: this makes the inner itself ≥44px, so its existing `align-items: center` centers the content; the `inline-block` root shrink-wraps the inner (staying 44px), and a wrapping label still grows inner→root. This is **display-agnostic** — it does not touch root `display`, so `[data-block]` full-width (R3) and shrink-to-fit are both untouched, and there is no `justify-content` hard-coding (R5-safe). The executor MUST confirm centering by DOM measurement and confirm no height/width/wrap regression before accepting A1.
- **A2 (documented fallback if A1 fails measurement):** generalize the Task 621 local fix to the theme, but **gated on full-width** to protect R3, e.g. `styles.root` = `{ display: props.fullWidth ? 'flex' : 'inline-flex', alignItems: 'center', justifyContent: 'center' }`. Higher risk (root display change); only use if A1 does not center correctly, and re-run the full R3 fullWidth matrix.
- **OQ1 (owner decision, NOT in this task):** Mantine also reduces padding on the section side (`[data-with-left-section] { padding-inline-start: calc(var(--button-padding-x)/1.5) }`, `Button.css:55-56`) → asymmetric padding on buttons with a `leftSection` (Task 621 finding #2, fixed locally only on the Homepage CTA). Whether to make section-side padding symmetric **site-wide** is a separate visual-design decision and is **out of scope here**. Flag for a possible follow-up.

## Pre-read rule bundle

Executor reads exactly:

- `docs/agent-contract.md`
- `docs/rule-index.md` → **UI / Current Mantine path** + **shared component / design-system** sections
- `docs/qa-profiles.md`
- `docs/mantine-responsive-design-system.md`
- `docs/tailadmin-style-reference.md` (§6 Buttons)
- `docs/component-rules.md` (shared-primitive / no-duplicate rules)
- `docs/qa-rules.md`
- `docs/backlog.md`
- `node_modules/@mantine/core/styles/Button.css` (root `.m_77c9d27d`, inner `.m_80f1301b`, `[data-block]`, `[data-with-*-section]`)

## Scope

1. Edit `src/design-system/mantine/theme.ts` Button `styles` only, applying the A1 fix (or A2 fallback if A1 fails measurement). Keep `minHeight`, `height:'auto'`, `fontWeight`, `label`, and all `vars` overrides intact.
2. Verify the fix across the full Button story matrix and re-verify the Task 621 Homepage CTA (R6).

## Out of scope

- `AgentCtaButton.tsx` — leave Task 621's local `styles.root` override in place; it is redundant-but-harmless once the theme centers correctly (root flex-center + inner min-height both center; no conflict). Removing it is optional DRY cleanup for a later pass, not this task.
- Section-side padding symmetry (OQ1) — separate design decision.
- Any `vars`/variant-chrome change (Tasks 587/589), any non-Button component, any consumer markup.
- Changing `size` defaults, radius, or density.

## Current and required behavior

**Current:** Every Mantine Button enforces `minHeight:44px` but, due to theme root `height:'auto'` defeating inner `height:100%`, renders its icon+label top-aligned inside the box (~13px offset), except where a control patches it locally (Task 621 `AgentCtaButton`).

**Required after:** Every Mantine Button renders its content vertically centered within the 44px box at the theme level, with 44px touch target, full-width behavior, label wrap-growth, and all variant chrome unchanged.

## Implementation requirements

- Prefer the display-agnostic A1 fix; only fall back to A2 (fullWidth-gated) if A1 does not center by measurement.
- `styles` is `(_theme, props) => ({...})`; if gating on `props.fullWidth` (A2), read it from the second arg — do not add a new prop.
- No raw px/rem outside the existing touch-target exemption; reuse `'2.75rem'` consistent with the existing `minHeight`.

## Positive and negative flows

**Positive flow:** A user views any Button (filled sm with `leftSection`, e.g. FiltersPanel reset, the Homepage Agent-CTA, MobileNavDrawer fullWidth CTAs) → the icon and label sit vertically centered within a 44px-tall pill at every viewport and locale.

**Negative-flow applicability:**

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Validation | No | No form/input logic touched | N/A | — |
| Authorization/RLS | No | Pure presentational theme change | N/A | — |
| Offline/network | No | No network path | N/A | — |
| Concurrent writer | No | No write path | N/A | — |
| Long-label wrap / 320px overflow | **Yes** | Task 502/567; `uk` longest | Wrapped label grows the button, stays ≥44px, no horizontal overflow at 320 | Story wrap cell + Homepage CTA `uk@320` |
| Full-width regression | **Yes** | R3; `[data-block]` consumers | `fullWidth` buttons stay 100% wide; natural buttons stay shrink-to-fit | Measure MobileNavDrawer/FiltersPanel/auth-form + a natural button |

## Acceptance criteria

- **AC1 [R1]** Given the `mantine-primitives-button--default` story, when a filled `sm` button (with and without `leftSection`) renders, then measured `rootCenter`, `innerCenter`, and `labelCenter` agree within ±1px (vertically centered).
- **AC2 [R2]** Given every variant/size cell, then measured button height is 44px (or ≥44px only when the label wraps).
- **AC3 [R3]** Given `MobileNavDrawer`, `FiltersPanel` (reset, fullWidth+leftSection), and `MantineAuthFormPattern`, then each `fullWidth` button is 100% of its container width; a natural-width button (Homepage CTA ≥640) remains shrink-to-fit.
- **AC4 [R4]** Given a wrapping label at 320px incl. `uk`, then the button grows vertically, content stays centered, and there is no horizontal overflow or clipping.
- **AC5 [R5]** Given `filled`/`default`/`outline`/`subtle`/`light`/`transparent`, then fill, border, text color, and hover are unchanged vs the pre-fix story render (visual diff) and match TailAdmin §6.
- **AC6 [R6]** Given the Homepage Agent-CTA at 320/390/768/1440, then it stays centered, full-width <640, and natural width ≥640 (Task 621 behavior preserved).
- **AC7 [R7]** Given the diff, then only `theme.ts` Button `styles` changed; `check:design-tokens` shows no new violation attributable to this change.

## QA profile and verification plan

**Profile: `Q3 Full Visual Matrix`.** Justification: shared Mantine primitive with site-wide blast radius (43 consumers, 20+ with sections, fullWidth consumers) → per `docs/qa-profiles.md` this is Q3, not Q2. Full canonical widths + 4 locales + TailAdmin side-by-side required; DOM-measurement proof required for centering and no-regression.

Run and record **actual** results:

1. `npm run typecheck` → 0 errors.
2. `npm run lint` (touched file) → no new finding in `theme.ts`.
3. `npm run check:design-tokens` → no new violation in `theme.ts`.
4. `npm run check:file-integrity` + `npm run check:mojibake` → pass on touched file.
5. Storybook proof for `mantine-primitives-button--default` at the Q3 matrix (`320/375/390/480/560/680/768/810/960/1024/1200/1440/1920`), all four locales at 320 + one desktop; capture variants, sizes, `leftSection`/`rightSection`, and `fullWidth` cells.
6. DOM measurement (`getBoundingClientRect`) proving `rootCenter ≈ innerCenter ≈ labelCenter` (±1px) for: filled sm, filled sm + leftSection, fullWidth + leftSection, compact, and a wrapping-label cell at 320. Record before/after numbers.
7. Full-width regression: measured widths for `MobileNavDrawer`, `FiltersPanel` reset, `MantineAuthFormPattern`, plus a natural-width button.
8. Homepage Agent-CTA re-verification (R6) at 320/390/768/1440 incl. `uk@320` (ad-hoc Playwright against `next dev`, as Task 621 did — `screenshots:responsive` cannot capture app routes; see Task 621 kickoff-defect note).
9. `npm run check:hydration` → Homepage en/sq/uk PASS (warm run; the gate is cold-compile-flaky — prime routes first, see Task 621 note).
10. TailAdmin §6 Button side-by-side for chrome parity (R5).

If any command cannot run in the executor sandbox, record it as **missing evidence** with the exact native command and expected artifact — never substitute a confidence claim (agent-contract clause 9).

## Completion report contract

Sonnet's session log (`docs/sessions/<date>-task622-*.md`) and a concise `docs/backlog.md` update must include:

- A "Files Changed" table matching the real diff.
- R1–R7 with the evidence location for each.
- Every verification-plan command with the **actual** result.
- Before/after DOM-measurement numbers for centering (AC1) and full-width (AC3).
- Rendered artifact paths (story matrix + Homepage CTA incl. `uk@320` + TailAdmin side-by-side).
- Which fix was used (A1 recommended, or A2 fallback with the measurement that forced it).
- Assumptions, deviations, limitations, unresolved issues.
- Final status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED` — never self-approval.

Handoff: execute via `.claude/skills/execute-task/SKILL.md` against this file path. Do not run or emit mutating git commands.

## Task quality gate

- [x] A fresh Sonnet session can execute without hidden chat context (exact files, lines, CSS classes, commands named).
- [x] Every primary requirement (R1–R7) has ≥1 binary acceptance criterion and ≥1 verification method.
- [x] Scope names what must not change (minHeight, height:auto, vars, fullWidth, wrap-growth) and protects prior Button tasks (502/527/567/587/589).
- [x] Current Mantine path, Q3 profile, four-locale need, and Storybook + DOM-measurement proof path are explicit.
- [x] Each changed/preserved visual artifact is traced to inspected markup/classes/tokens (visual source map); centering is distinguished from height, width, wrap, and chrome.
- [x] The recommended fix (A1) is display-agnostic and cannot break `[data-block]`; the higher-risk fallback (A2) is gated and marked as fallback-only.
- [x] Negative flows are selected by applicability (wrap + fullWidth), not copied generically.
- [x] No command, file, class, or behavior claimed without inspection (Mantine CSS lines, theme lines, consumer lines, story ID all verified).
- [x] Gates prove the changed behavior (measured centering + no height/width/wrap/chrome regression), not mere procedure.
- [x] Assumptions (A1/A2) and the out-of-scope padding decision (OQ1) are visible to executor and reviewer.
