# Task 545 — Separator primitive → TailAdmin (Phase 1 · P1.25)

> **Sprint 40 / Epic MM — Phase 1 primitive slice. Owner P0, agent-contract clause 16.**
> **Executor:** Sonnet 4.6. **Type:** UI / Mantine primitive slice (theme defaults + thin wrapper only if needed +
> story + rendered proof). Follows the P1.23 (Progress) / P1.24 (Skeleton) precedent: **primitive + story ONLY,
> zero consumer migration** (that is Phase 2). **Status:** OPEN.
> Tracker row: `docs/mantine-tailadmin-migration-tracker.md` P1.25 (`separator.tsx` → Mantine `Divider`, ref §6).

## Scope

Build the canonical Mantine `Divider` primitive (the Mantine equivalent of the legacy `separator.tsx`) styled to the
TailAdmin divider look, plus a `Mantine/Primitives/Separator` story with rendered proof. Do NOT migrate any consumer;
do NOT touch other primitives.

**Legacy contract to preserve** (`src/components/ui/separator.tsx`, Base-UI `Separator`): a 1px line —
horizontal → `h-px w-full`; vertical → `w-px self-stretch`; color `bg-border`. It is a plain, non-interactive
divider. Mantine `Divider` (props: `orientation`, `size`, `color`, `variant` solid/dashed/dotted, `label`,
`labelPosition`) is a strict superset — prefer importing Mantine `Divider` directly (like Skeleton imported
`Skeleton`), no wrapper, unless a real behavior gap appears (if so, STOP and ASK before adding one).

## 🔴 Step 0 — EXTRACT the reference FIRST (clause 16 — no invented values)

There is **no authoritative standalone Divider/Separator §-row yet** — only incidental divider cites exist
(`§Table` "row divider gray-100", card "bottom divider", breadcrumb "slash separator gray-400"). Before writing any
code, extract TailAdmin's standalone divider/horizontal-rule chrome from `demo_tailadmin_com.zip` (`css/style.css`
tokens + the `<hr>` / divider markup in its HTML pages) into a NEW `docs/tailadmin-style-reference.md §6x` row:
- **Color** — which gray token the standalone divider uses. Candidate anchors already in the doc: **gray-100
  `#f2f4f7`** (table/card row divider) vs **gray-200 `#e4e7ec`** (the border ramp / Card border, Task 527). Confirm
  from the zip which one a content `<hr>`/divider actually renders — do NOT assume; cite the exact class / `css/style.css` line.
- **Thickness** — 1px (confirm; map to the Mantine `size` that yields 1px).
- **Style** — solid (confirm no dashed/dotted default).
- If the zip has no standalone divider element, extract from its closest cited divider (table row / card header
  bottom border) and say so explicitly, reusing that already-cited token (same honest-negative-fallback pattern as
  §6n Skeleton).

Every value in the implementation must trace to that new §-row — zero invented color/px/style.

## Required after-behavior

- **`theme.ts` `Divider` handling per §6x, `var(--mantine-*)` tokens only.** Mantine `Divider`'s default line color
  is `gray-3` (light) — override to the §6x token. **Mechanism preference (per `mantine-responsive-design-system.md`
  §18):** try `theme.components.Divider.defaultProps.color` / a `vars` override FIRST — a Divider's border color is a
  normal element style (NOT a pseudo-element), so unlike Skeleton it should be reachable without a `*-chrome.css`
  file. Only fall back to a scoped `divider-chrome.css` (input/pagination/skeleton-chrome precedent) if you PROVE the
  color can't be set via theme (document the proof). Do NOT re-implement what Mantine already gives correctly
  (orientation/size geometry) — document any zero-override decision, like Progress/Skeleton did.
- **`Mantine/Primitives/Separator` story** (`skipCanvas: true` + `layout: 'fullscreen'`, `MantineStoryShell`): show
  the states — (1) a horizontal divider separating two text blocks (full-width), (2) a vertical divider between two
  inline items (intrinsic height), and (3) — only if §6x confirms TailAdmin supports it — a labeled divider. Each a
  static, determinate render matching the §6x reference.
  - **🔴 i18n:** every visible caption/label in the story MUST come from `storyT()` against `storybook.mantine.*` with
    full sq/en/uk/it parity — the canonical pattern used by all 25 sibling primitive stories (Progress, etc.). Do NOT
    hardcode English captions. (Task 544's dev-annotation exemption, `storybook-governance.md §14.9.11`, is scoped to
    THAT one story only — it does not license new hardcoded captions here.)
- **🔴 Loader-allowlist — VERIFY, do not assume:** a Divider is a static line and should trip NONE of
  `waitForStoryReady`'s 6 loader signals. Confirm this empirically on the built story (like Task 544 §14.9.10 did for
  Skeleton — the kickoff assumption was wrong there, so verify, don't copy an assumption). If (as expected) no signal
  fires, `LOADER_ALLOWLIST` stays UNCHANGED and you record the verified finding in `docs/storybook-governance.md`
  §14.9.x. If a signal unexpectedly fires, STOP and ASK.
- **Consumer audit (migrate none):** `grep -rl "@/components/ui/separator" src` — list every consumer in the session
  log; migrate ZERO this task (Phase 2). Current expectation: **zero consumers** (verified at kickoff time) — state it.

## Mobile <640 full-width gate (clause 11)

A horizontal divider is inherently full-width (`w-full`) — confirm it spans edge-to-edge in the story at `<640` with
no fixed px that clips at 320. A vertical divider stays its intrinsic 1px width / stretches to sibling height
(documented exemption — a vertical rule is not a full-width surface, same class as Skeleton's circle exemption). No
h-scroll at 320 in any locale. ≥44px is N/A (non-interactive) — note the exemption.

## Positive + Negative flow

- **Positive:** `Mantine/Primitives/Separator` at `≥640` and `320` × sq/en/uk/it renders the horizontal (full-width),
  vertical (intrinsic), [and labeled if §6x] dividers with the §6x color + 1px thickness + solid style — visibly
  matching the TailAdmin reference side-by-side with the zip.
- **Negative:** (a) uk@320/375/390 — horizontal divider full-width, no clip, no h-scroll; long uk/it captions (if any
  labeled variant) wrap, never clip. (b) vertical divider does NOT stretch full-width (stays 1px). (c) No other
  primitive regressed (theme-only change scoped to `Divider`; confirm no shared token touched).

## Pre-read (rule-index → UI / layout / component + Storybook)

- `docs/agent-contract.md` (clauses 1–16) + `docs/backlog.md` + `docs/critical-flow-registry.md` (scan — primitive,
  no registered flow expected; confirm).
- 🔴 `docs/tailadmin-style-reference.md` + `demo_tailadmin_com.zip` — extract the §6x Divider row FIRST (Step 0).
- `docs/mantine-responsive-design-system.md` §7, §12, §16, §18 (theming pitfalls — theme defaultProps/vars vs a
  `*-chrome.css` file; when a value IS reachable via theme, prefer it).
- `docs/storybook-governance.md` §14 (+ §14.9 for the loader-allowlist verification record; note §14.9.11 scope).
- `docs/ui-rules.md`, `docs/component-rules.md`, `docs/qa-rules.md`.

## Gates to close (HELD until green)

- `npm run screenshots:assert -- --mantine-only` — new Separator story, all cells resolved, uk@320/375/390 clean, no
  new FAIL elsewhere; rendered side-by-side with the zip divider reference. Attach the manifest.
- Planted-violation FAIL transcript (prove the gate still catches a real overflow on this surface — e.g. a fixed
  over-wide element — then revert clean and reconfirm the baseline).
- `tsc --noEmit`, `check:stories`, `check:i18n`, `check:mojibake`, `check:design-tokens -- --strict`,
  `check:file-integrity` — all green (paste transcripts).
- Regression (clause 15): confirm no `critical-flow-registry.md` flow touched — state it.

## Acceptance criteria

1. New `tailadmin-style-reference.md §6x` Divider row extracted from the zip FIRST (color, thickness, style), every
   implementation value cited to it — zero invented (clause 16).
2. `theme.ts` `Divider` handling (theme defaultProps/vars preferred; `divider-chrome.css` only with proof) +
   `Mantine/Primitives/Separator` story (horizontal / vertical [/ labeled if §6x] states, `storyT` i18n parity)
   render matching the reference at ≥640 and 320 × sq/en/uk/it.
3. `LOADER_ALLOWLIST` verified empirically — UNCHANGED if no signal fires (expected), documented in
   `storybook-governance.md` §14.9.x with rendered proof. No assumption copied from Task 544.
4. Consumer audit in the session log (expect zero; migrate zero — Phase 2). No other primitive regressed.
5. Rendered `--assert` matrix (uk@320/375/390 + ≥640) + planted-violation transcript; all light gates green.
6. Session log: Files-Changed table, AC-by-AC self-audit, `Self-validation: …` line. **Do NOT run git.**

## Commit hand-off (HELD)

Do NOT emit `git add`/`git commit`. HELD — the orchestrator reviews the real diff (Read-tool, no sandbox git) + the
rendered matrix, then emits the explicit-path commit (`theme.ts` [+ `divider-chrome.css` only if justified] + the
Separator story + `scripts/check-stories-rendered.mjs` only if the allowlist changed + `tailadmin-style-reference.md`
+ `storybook-governance.md` + any new i18n message keys (sq/en/uk/it) + session log + tracker + backlog). Owner runs
it in PowerShell after the native gate.
