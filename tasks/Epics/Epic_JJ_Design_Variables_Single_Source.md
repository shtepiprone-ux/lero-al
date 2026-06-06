# Epic JJ — Project-Wide Design Variables (single-source tokens)

> **Owner directive (2026-06-06):** introduce Figma-style **Variables** across the ENTIRE project so there is
> no chaotic component, no component clone, and no hardcoded style value. One place to change → the change
> propagates everywhere. **Code-only single source** (decided by owner: no Figma sync pipeline for now —
> tokens live in `src/app/globals.css` `@theme`; structure stays Figma-compatible so a sync can be added later).

## Goal (end state)

1. A **complete, canonical Design Variables layer** — every style primitive the project uses is a named token
   defined ONCE in `src/app/globals.css` (`@theme inline` + `:root`), documented in `docs/design-system.md`:
   - **Already present (keep + audit):** color (brand/neutral scales + semantic), radius scale, font families.
   - **To add (owner-selected, all four categories):**
     - **Spacing scale** — `--space-*` (replaces raw `px`/`rem` gaps/padding/margins).
     - **Typography scale** — `--text-*` (size + line-height), `--font-weight-*`, `--tracking-*`.
     - **Elevation + z-index + motion** — `--shadow-*`, `--z-*` (canonical z-scale, ui-rules §16), `--duration-*`, `--ease-*`.
     - **Breakpoints + sizing** — the canonical viewport widths as tokens, control heights (§15), icon sizes, container max-widths.
2. **The whole `src/**` consumes tokens** — zero raw hex/`rgb()`/`hsl()` literals, zero raw `px`/`rem` in
   `className`/inline `style`, zero raw z-index / shadow / duration magic numbers. Every consumer routes through a token
   (Tailwind utility backed by the `@theme` token, or `var(--token)`).
3. **A STRICT gate** (`check:design-tokens`) — owner-selected **strict, no baseline**: any raw style value in
   `src/**` fails CI. Because a blocking gate can only be green once the tree is clean, the gate lands in **report
   mode first** and is **flipped to blocking as the final task**, when the refactor is complete (no permanent
   baseline allowlist — only a short, justified exemption list for genuinely un-tokenizable cases, e.g. third-party
   map tiles).

## Non-goals

- **No Figma sync pipeline** (owner deferred). Token structure stays export-friendly (`tokens.json` may be emitted
  later) but no plugin/automation in this epic.
- **No visual redesign.** Tokens MIRROR current values — every refactor task is visually inert (proven by
  before/after rendered evidence). Changing the look is a separate, explicit future task.
- **No new components / no behavior change.** This epic is tokens + refactor-to-tokens only.

## Why now

The project already has a mature DS (Tailwind v4 `@theme`, canonical primitives, no-hardcode-string gate Task 396/399,
story-coverage gate Task 398). The missing layer is a *complete, enforced* style-value token system. This epic closes
the last hardcode blind spot (style values) the way Task 396 closed the i18n-string blind spot.

## Sequencing (strict end-state, green-on-flip)

| Phase | Task | Summary |
|---|---|---|
| 1 — Foundation | **401** | Define the COMPLETE token layer in `globals.css` `@theme` (spacing, type, elevation, z, motion, breakpoint, sizing) + document the canonical registry in `docs/design-system.md`. Visually inert (no consumer changes yet). |
| 2 — Detector | **402** | Build `check:design-tokens` in **report mode**: scan `src/**` for raw hex/`rgb`/`hsl`, raw `px`/`rem` in class/style, raw z-index/shadow/duration. Emit a full inventory grouped by area. Negative-flow planted violations proven. Wired to CI as **non-blocking report** only. |
| 3 — Refactor by area | **403–406** | Refactor consumers to tokens, one area per task (reviewable diffs): **403** `ui/` primitives → **404** `shared/` + `layout/` → **405** `admin/` → **406** `listing/` + `auth/` + remaining. Each: visually inert (rendered before/after matrix 320·375·390·768·1280 × sq/en/uk/it where UI renders), mobile <640 full-width gate verified, 0 new raw values introduced. |
| 4 — Flip to strict | **407** | Flip `check:design-tokens` to **blocking** (exit 1 on any raw value), remove report-mode, add the short justified exemption list, wire into CI + Windows pre-commit. Gate is GREEN on landing (tree already clean from 403–406). Document final contract in `design-system.md`. |

> Each task is a separate kickoff file in `/tasks/Sprints/` with its own number, positive + negative flows, pre-reads,
> mobile full-width gate, and machine-proven AC — per `docs/orchestrator-role.md` + `agent-contract.md` (clauses 1–14).

## Pre-reads (per task; selected from `docs/rule-index.md`)

- All: `agent-contract.md`, `backlog.md`.
- Token/styling tasks (401, 402, 407): `docs/tailwind-governance.md`, `docs/tailwind-canonical-fragments.md`,
  `docs/tailwind-entropy-audit.md`, `docs/ui-rules.md`, `docs/design-system.md`, `docs/qa-rules.md`.
- Refactor tasks (403–406, UI): the **UI / layout / component** bundle (`design-system.md` first) + the styling bundle above.

## Risks / guard-rails

- **Visual regression** is the #1 risk. Mitigation: tokens mirror exact current values (oklch/px); every refactor task
  must attach before/after rendered evidence proving zero visual diff. A pixel change without owner sign-off = REJECT.
- **Scope creep into redesign.** Forbidden — see non-goals. STOP & ASK if a "better" value is tempting.
- **Tailwind v4 specifics.** Spacing/type tokens must be wired so Tailwind utilities resolve to them (`@theme`), not
  parallel-defined — otherwise we create a SECOND source of truth, the exact thing this epic kills.

## Acceptance (epic-level, met when Task 407 lands)

- `check:design-tokens` is **blocking** and **green** on a clean `src/**`.
- `docs/design-system.md` documents the full token registry as the single source of truth.
- No raw hex/`rgb`/`hsl`/`px`/`rem`/z-index/shadow/duration literal remains in `src/**` (except the short justified
  exemption list).
- All refactor tasks proven visually inert at the canonical breakpoints × four locales.
