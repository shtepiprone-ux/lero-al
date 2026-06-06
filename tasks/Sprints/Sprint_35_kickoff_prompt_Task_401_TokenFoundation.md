# Sprint 35 — Task 401 — Design-Variables foundation (complete `@theme` token layer + registry doc)

> **Read `docs/agent-contract.md` (clauses 1–14) FIRST. STOP & ASK if anything is ambiguous — do NOT invent values.**
> Implements **Epic JJ** Phase 1. This task ONLY defines tokens + documents them. It changes NO component and MUST be
> **visually inert** (nothing consumes the new tokens yet). Refactoring consumers to tokens is Tasks 403–406, NOT here.

```
Type:        styling/tokens (foundation) + governance docs
Priority:    HIGH — unblocks the whole Epic JJ refactor chain
Depends on:  nothing (foundation). Blocks 402–407.
Area:        src/app/globals.css (ADD tokens only — do not alter existing token VALUES),
             docs/design-system.md (NEW §20 "Design Variables — canonical token registry")
NON-goal:    Changing any existing token value; refactoring any component to use the new tokens;
             any visual change; adding a gate (that is Task 402).
```

## Why this task exists

`globals.css` already defines color (brand/neutral/semantic), radius, and font-family tokens via Tailwind v4 `@theme inline`.
Epic JJ needs the FULL style-value vocabulary as named variables so that Tasks 403–406 can replace every raw `px`/`rem`/
hex/z-index/shadow/duration in `src/**` with a token. This task creates that vocabulary — once, in one place — and the
documentation that makes it the single source of truth. No consumer changes yet, so the site looks identical before/after.

## Current behavior to preserve

- All existing tokens (`--color-*`, `--brand-*`, `--neutral-*`, `--radius-*`, `--font-*`) keep their EXACT current values
  and names. Do not rename, remove, or re-value any of them.
- The site renders pixel-identical before and after this task (no component consumes the new tokens yet).
- `@theme inline` continues to expose color/radius/font as Tailwind utilities exactly as today.

## Required after-behavior

Add (do not modify existing) the following token groups. **Every value must MIRROR what the codebase already uses** —
derive the scale from the current Tailwind defaults + the existing `globals.css` + the values found by grepping `src/**`
(see step 1). If a needed value is genuinely undefined in the current code, STOP & ASK rather than invent one.

1. **Spacing scale** — `--space-0 … --space-N` (mirror the Tailwind spacing steps actually used in `src/**`; wire via
   `@theme` so spacing utilities resolve to the tokens, NOT a parallel definition). Document the px/rem each maps to.
2. **Typography scale** — `--text-xs … --text-Nxl` (size + matching line-height), `--font-weight-{normal,medium,semibold,bold}`,
   `--tracking-{tight,normal,wide}`. Mirror current font sizes/weights in use. Wire through `@theme`.
3. **Elevation / z-index / motion:**
   - `--shadow-{xs,sm,md,lg,xl}` mirroring current shadow usage.
   - `--z-{base,dropdown,sticky,overlay,modal,popover,toast}` — a single canonical z-scale (reconcile with the
     z-index scale referenced in `ui-rules.md §16`; if it already names tiers, REUSE those exact names/values).
   - `--duration-{fast,base,slow}` + `--ease-{standard,in,out}` mirroring current animation timings.
4. **Breakpoints + sizing:**
   - The canonical viewport widths (from `design-system.md §3`) as `--bp-*` reference tokens (documentation/JS use; Tailwind
     breakpoints stay as configured — do NOT fork them, just expose the canon as named tokens + note the source of truth).
   - `--control-h-{sm,md,lg}` (the §15 control heights), `--icon-{sm,md,lg}`, `--container-max` mirroring current values.

5. **`docs/design-system.md` → NEW `§20 — Design Variables (canonical token registry)`:** a table per group listing
   token name → value → meaning → "use via" (Tailwind utility or `var()`), plus a top note: "This registry is the single
   source of truth for all style values. Raw hex/rgb/hsl/px/rem/z-index/shadow/duration literals in `src/**` are forbidden
   (enforced by `check:design-tokens`, Task 402/407). To change a value project-wide, change it HERE."

## Positive flow (happy path)

1. Grep `src/**` to inventory the style values actually in use (see required greps below) — the token scales mirror THESE.
2. Add the token groups to `globals.css` (`:root` raw values + `@theme inline` wiring), grouped + commented per category,
   without touching any existing token.
3. Read the file back; confirm it is complete and well-formed (no truncation, balanced braces).
4. Add `design-system.md §20` registry tables.
5. Run `npm run build` (or `npx tsc --noEmit` + a Storybook/Next build smoke) → passes; the rendered app is unchanged.
6. Update `docs/backlog.md` + add a session log under `docs/sessions/` with the Files-Changed table + integrity transcript.

## Negative flow (must be handled / proven)

- **Missing source value:** if a needed token has no clear current value in `src/**`/`globals.css`, the executor STOPS
  and ASKS — it does NOT invent a value. (Document which token was ambiguous.)
- **Accidental parallel source:** if wiring a spacing/type token would create a SECOND definition diverging from Tailwind's
  resolved value, STOP & ASK — the token must back the utility, not shadow it. Prove via the build that utilities still
  resolve to the intended value.
- **Visual drift guard:** capture a before/after render of 2–3 representative pages/stories at 320 + 1280 (uk + en). They
  MUST be identical. Any diff = the task changed a value it shouldn't have → fix before completing.
- **Existing token altered:** if the diff shows ANY change to an existing `--color-*`/`--brand-*`/`--radius-*`/`--font-*`
  value or name, that is a FAILURE (out of scope) — revert it.
- **File integrity:** `globals.css` and `design-system.md` end complete (0 NUL bytes, no BOM, no mid-token truncation) —
  paste the green integrity transcript (agent-contract clause 14).

## Required greps / audit (paste outputs in the session log)

```bash
# raw hex / rgb / hsl literals in source (the future refactor surface — informational here)
grep -rnoE "#[0-9a-fA-F]{3,8}\b|rgb\(|hsl\(" src --include="*.tsx" --include="*.ts" --include="*.css" | head -50
# raw px / rem inside className or style
grep -rnoE "\[[0-9]+px\]|\b[0-9]+px\b|\b[0-9.]+rem\b" src --include="*.tsx" | head -50
# existing z-index usage
grep -rnoE "z-\[[0-9]+\]|z-[0-9]+|zIndex" src --include="*.tsx" | sort -u | head -50
```

## Acceptance criteria (machine-proven)

- New token groups (spacing, typography, elevation, z-index, motion, breakpoints, sizing) exist in `globals.css`, wired via
  `@theme` where they back utilities; each value mirrors a current in-use value (or was STOP-&-ASK'd). Verifiable in diff.
- **No existing token value or name changed** (diff shows additions only to the token area).
- `docs/design-system.md §20` registry tables present, one per group, with the single-source-of-truth note.
- **Visually inert:** before/after renders at 320 + 1280 (uk + en) identical (attach evidence). `npm run build` passes; `tsc=0`.
- File-integrity transcript green (0 NUL, no BOM, no truncation) for both touched files; both re-read complete.
- `docs/backlog.md` updated; session log with AC-by-AC self-audit table + Files-Changed table.
- **No `git add`/`git commit` from the executor** — the orchestrator emits commits on review.

## Mobile <640 full-width gate

N/A for rendered surfaces (this task adds NO UI and changes NO component). The gate re-applies in full to the refactor
tasks 403–406. Note this explicitly in the session log ("no UI surface in scope; tokens only").

## Pre-read (mandatory — from `docs/rule-index.md`, Tailwind/styling bundle)

- `docs/agent-contract.md` (1–14) · `docs/backlog.md`
- `docs/design-system.md` (§3 viewport canon, §5 spacing, §6 typography, §15 control heights, §16) — read FIRST
- `docs/tailwind-governance.md` · `docs/tailwind-canonical-fragments.md` · `docs/tailwind-entropy-audit.md`
- `docs/ui-rules.md` (§15 control-height alignment, §16 z-index scale) · `docs/qa-rules.md`

## Out of scope

- Building `check:design-tokens` (Task 402). Refactoring any consumer to use the tokens (403–406). Flipping the strict
  gate (407). Any Figma export pipeline (deferred). Any visual change.
