# Task 544 — Skeleton primitive → TailAdmin (Phase 1 · P1.24)

> **Sprint 40 / Epic MM — Phase 1 primitive slice. Owner P0, agent-contract clause 16.**
> **Executor:** Sonnet 4.6. **Type:** UI / Mantine primitive slice (theme defaults + thin wrapper if needed + story +
> rendered proof). Follows the P1.21 (Combobox) / P1.23 (Progress) precedent: **primitive + story ONLY, zero consumer
> migration** (that is Phase 2). **Status:** OPEN.
> Tracker row: `docs/mantine-tailadmin-migration-tracker.md` P1.24 (`skeleton.tsx` → Mantine `Skeleton`, ref §5/§6).

## Scope

Build the canonical Mantine `Skeleton` primitive styled to the TailAdmin loading-placeholder look, plus a
`Mantine/Primitives/Skeleton` story with rendered proof. Do NOT migrate any consumer; do NOT touch other primitives.

## 🔴 Step 0 — EXTRACT the reference FIRST (clause 16 — no invented values)

There is **no authoritative Skeleton §-row yet.** Before writing any code, extract TailAdmin's skeleton/loading-
placeholder chrome from `demo_tailadmin_com.zip` (`css/style.css` tokens + the skeleton/loading markup in its HTML)
into a NEW `docs/tailadmin-style-reference.md §6x` row: **base color** (which gray token — likely `gray-1`/`gray-2`
from the ramp, confirm), **border-radius** (which token), and the **pulse/shimmer animation** (opacity keyframes +
duration + timing function, or a shimmer gradient — whichever TailAdmin uses). Cite the exact `css/style.css`
lines / class. If the zip has no dedicated skeleton component, extract from its closest loading placeholder and say so.
Every value in the implementation must trace to that new §-row — zero invented color/px/radius/duration.

## Required after-behavior

- `theme.ts` `Skeleton` block (+ a thin `MantineSkeleton` wrapper only if a behavior gap requires it — prefer
  theme-only, like Progress): radius + base color + animation per the new §6x row. Use `var(--mantine-*)` tokens only.
- Mantine's `Skeleton` already renders a pulsing placeholder (`animate`, `height`, `width`, `radius`, `circle`,
  `visible` props). Override only what diverges from §6x (do NOT re-implement what Mantine already gives correctly —
  document any zero-override decision, like Progress did for track/fill).
- `Mantine/Primitives/Skeleton` story (`skipCanvas: true` + `layout: 'fullscreen'`, `MantineStoryShell`, `storyT()`
  i18n with sq/en/uk/it parity for any visible label): show the states — a text-line skeleton, a block/card skeleton,
  a circle (avatar) skeleton, and a realistic composite (e.g. a card row: circle + two lines) — each a determinate
  static render.
- **🔴 Loader-allowlist:** a Skeleton is an INTENTIONAL perpetual loading placeholder — its story will trip the
  readiness/loader heuristic exactly like Progress (Task 542) and the existing `primitives-skeleton--listing-card-skeleton`
  entry. Add `mantine-primitives-skeleton--default` to `LOADER_ALLOWLIST` in `scripts/check-stories-rendered.mjs`
  (same narrow, documented mechanism as Task 542), and record it in `docs/storybook-governance.md` §14.9.x with the
  rendered proof. Do NOT weaken loader detection globally.
- **Consumer audit (migrate none):** `grep -rl "@/components/ui/skeleton" src` — list every consumer in the session
  log; migrate ZERO this task (Phase 2). If there are zero consumers, state it (like Progress).

## Mobile <640 full-width gate (clause 11)

Skeleton placeholders are layout-driven (width set by the consumer/story). In the story, block/line skeletons span the
full content width at `<640` (no fixed px that clips at 320); the circle skeleton stays its intrinsic size. No h-scroll
at 320 in any locale. ≥44px is N/A (non-interactive) — note the exemption.

## Positive + Negative flow

- **Positive:** `Mantine/Primitives/Skeleton` at `≥640` and `320` × sq/en/uk/it renders line/block/circle/composite
  skeletons with the §6x base color, radius, and pulse animation — visibly matching the TailAdmin reference.
- **Negative:** (a) uk@320/375/390 — no clip, no h-scroll, block/line skeletons full-width. (b) `visible={false}`
  (Mantine Skeleton passthrough) renders the children, not the placeholder — verify the passthrough still works.
  (c) No other primitive regressed (theme-only change scoped to `Skeleton`).

## Pre-read (rule-index → UI / layout / component + Storybook)

- `docs/agent-contract.md` (1–16) + `docs/backlog.md` + `docs/critical-flow-registry.md` (scan — primitive, no flow).
- 🔴 `docs/tailadmin-style-reference.md` + `demo_tailadmin_com.zip` — extract the §6x Skeleton row FIRST (Step 0).
- `docs/mantine-responsive-design-system.md` §7, §12, §16, §18 (theming pitfalls — `theme.styles` inline vs CSS).
- `docs/storybook-governance.md` §14 (+ §14.9 for the loader-allowlist record).
- `docs/ui-rules.md`, `docs/component-rules.md`, `docs/qa-rules.md`.

## Gates to close (HELD until green)

- `npm run screenshots:assert -- --mantine-only` — new Skeleton story allowlisted (loader), all cells resolved,
  uk@320/375/390 clean, no new FAIL elsewhere; rendered side-by-side with the zip skeleton reference. Attach manifest.
- Planted-violation FAIL transcript (prove the gate still catches a real overflow on this surface; revert after).
- `tsc --noEmit`, `check:stories`, `check:i18n`, `check:mojibake`, `check:design-tokens -- --strict`,
  `check:file-integrity` — all green.
- Regression (clause 15): no registry flow touched — confirm & state.

## Acceptance criteria

1. New `tailadmin-style-reference.md §6x` Skeleton row extracted from the zip FIRST (base color, radius, animation),
   every implementation value cited to it — zero invented (clause 16).
2. `theme.ts` `Skeleton` block (+ wrapper only if justified) + `Mantine/Primitives/Skeleton` story (line/block/circle/
   composite states, i18n parity) render matching the reference at ≥640 and 320 × sq/en/uk/it.
3. `mantine-primitives-skeleton--default` added to `LOADER_ALLOWLIST` (narrow, documented §14.9.x) — Progress precedent.
4. Consumer audit in the session log (migrate zero — Phase 2). No other primitive regressed.
5. Rendered `--assert` matrix (uk@320/375/390 + ≥640) + planted-violation transcript; all light gates green.
6. Session log: Files-Changed table, AC-by-AC self-audit, `Self-validation: …` line. **Do NOT run git.**

## Commit hand-off (HELD)

Do NOT emit `git add`/`git commit`. HELD — orchestrator reviews the real diff + rendered matrix, then emits the
explicit-path commit (`theme.ts` [+ wrapper] + story + `scripts/check-stories-rendered.mjs` + `tailadmin-style-reference.md`
+ `storybook-governance.md` + i18n messages + session log + tracker + backlog). Owner runs it after the native gate.
