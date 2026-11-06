# Sprint 35 — Task 402 — `check:design-tokens` detector (REPORT mode) + `--container-max` cleanup

> **Read `docs/agent-contract.md` (clauses 1–14) FIRST. STOP & ASK if anything is ambiguous.**
> Implements **Epic JJ** Phase 2. This task builds the raw-style-value **detector** and runs it in **report mode only**
> (always exit 0). It does NOT refactor any consumer (that is 403–406) and does NOT block CI yet (the strict flip is
> Task 407, after the tree is clean). Depends on **Task 401** (token foundation) being committed.

```
Type:        tooling (detector/gate) + governance + tiny token cleanup
Priority:    HIGH — produces the inventory that scopes Tasks 403–406
Depends on:  401 (token layer committed). Reuse the gate/baseline conventions from
             scripts/check-hardcoded-i18n.mjs (396), check-story-coverage.mjs (398), check-file-integrity.mjs (400).
Area:        scripts/check-design-tokens.mjs (NEW), scripts/design-tokens-allowlist.json (NEW),
             package.json (scripts), .github/workflows/governance-pr.yml (NON-blocking report step),
             docs/design-system.md (§22 note + §23 gate doc), src/app/globals.css (--container-max rename)
NON-goal:    Refactoring any component to use tokens (403–406). Making the gate BLOCK CI (407).
             Auto-fixing violations. Scanning non-src dirs.
```

## Why this task exists

Task 401 created the token vocabulary. Before we can refactor consumers (403–406) and then flip a strict gate (407), we
need a **detector** that enumerates every raw style-value literal in `src/**` — raw hex/`rgb`/`hsl`/`oklch`, raw `px`/`rem`
in arbitrary class values + inline styles, raw `z-[…]`, `shadow-[…]`, `duration-[…]`. In **report mode** it just produces a
grouped inventory (always exit 0) so we can see and scope the real refactor surface. The **strict** code path is built now
(behind a flag) and unit-proven, but only WIRED to block CI in Task 407.

## Part A — the detector (`scripts/check-design-tokens.mjs`)

### Detection rules (scan `src/**`, file types `.tsx`/`.ts`/`.css`)
Flag as a raw-style-value violation:
- **Color literals:** `#rgb` / `#rrggbb` / `#rrggbbaa`, `rgb(` / `rgba(` / `hsl(` / `hsla(` / `oklch(` — in TSX/TS/CSS.
- **Length literals in utilities/inline:** arbitrary Tailwind values `*-[<n>px]` / `*-[<n>rem]` (e.g. `p-[13px]`,
  `max-w-[220px]`, `h-[340px]`), and raw `px`/`rem` numeric values inside inline `style={{ … }}` objects.
- **Z-index literals:** `z-[<n>]` and inline `zIndex: <n>`.
- **Shadow literals:** `shadow-[…]` arbitrary values.
- **Duration literals:** `duration-[…]` arbitrary values and inline `transitionDuration`/`animationDuration` raw ms.

Do NOT flag (these are the correct token forms):
- `var(--token)` references; named token utilities (`p-4`, `text-sm`, `shadow-md`, `z-50`, `max-w-md`, `duration-200`);
- values inside `src/app/globals.css` `@theme`/`:root` token DEFINITIONS (that file is the source of truth);
- anything in the committed allowlist (Part A.2).

### A.2 — Allowlist (`scripts/design-tokens-allowlist.json`)
A committed JSON map `"<path or path:pattern>": "<one-line justification>"` for genuinely un-tokenizable raws:
- HTML **email templates** (`src/modules/notifications/lib/emails/**`) — email clients need inline literal styles.
- Third-party **brand SVG** fills (e.g. Google icon `#4285F4/#34A853/#FBBC05/#EA4335` in `AuthSheet.tsx`).
- Any **map/Leaflet** literal — if encountered, STOP & ASK (per agent-contract clause 11 map-marker exemption).
- Seed it from the Task 401 grep audit (the session log already lists these). Each entry needs a real justification (no stubs).
- Stale-entry check: an allowlist entry pointing at a non-existent file → warning (mirror the 398 stale-entry pattern).

### A.3 — Modes (reuse the 396/398 convention)
- `--report` (DEFAULT for this task): print the full grouped inventory (by area: ui / shared / layout / admin / listing /
  auth / app / modules), counts per category, **always exit 0**.
- `--strict` (BUILT NOW, NOT wired to CI until 407): exit 1 on any non-allowlisted violation, naming file:line + category.
- `--update-allowlist`: seed/refresh the allowlist from the current scan (writes stubs for owner review).

### A.4 — CLI/script wiring (`package.json`)
- `check:design-tokens` → `node scripts/check-design-tokens.mjs --report`
- `check:design-tokens:strict` → `node scripts/check-design-tokens.mjs --strict`  (exists, not in CI yet)
- `check:design-tokens:update-allowlist` → `… --update-allowlist`

### A.5 — CI wiring (`.github/workflows/governance-pr.yml`)
Add a **NON-blocking report step** only: run `npm run check:design-tokens` with `continue-on-error: true` (or as an
informational step) so the inventory shows in PR logs WITHOUT failing the build. **Do NOT add the strict step to CI** —
that is Task 407. Document this explicitly in the step name ("report only — strict gate lands in Task 407").

## Part B — `--container-max` cleanup (the Task 401 footgun, owner-approved fold-in)

`--container-max` (Task 401) sits in Tailwind v4's `--container-*` namespace; the `max` key is shadowed by the static
`max-w-max` keyword (→ `max-content`), so the token is unreachable via `max-w-max` and is a footgun.
- **Rename** `--container-max: 88rem` → a plain prop **`--width-page-max: 88rem`** (NOT in the `--container-*` namespace),
  in `src/app/globals.css`. Update the `§22.7` registry row in `docs/design-system.md` accordingly (note "access via
  `var(--width-page-max)` / the `.container-wide` rule — NOT a `max-w-*` utility, to avoid the `max-w-max` keyword clash").
- **Verify no regression:** `max-w-max` in `navigation-menu.tsx` must still compile to `max-content` (it does — static
  keyword wins; this rename just removes the dead/footgun token). No other consumer references `--container-max`
  (grep to confirm; if any exists, STOP & ASK). Visually inert.

## Positive flow
1. Build the detector with the three modes + the area-grouped report.
2. Seed the allowlist from the Task 401 audit (email/SVG), each with a real justification.
3. Wire the three `package.json` scripts + the **non-blocking** CI report step.
4. Rename `--container-max` → `--width-page-max`; update `§22.7`; grep-confirm no broken consumer.
5. Document the new gate in `docs/design-system.md` (new `§23 — check:design-tokens (report → strict in 407)`).
6. Run `npm run check:design-tokens` → prints the inventory, exit 0. `tsc=0`, `node --check` on the script, integrity green.
7. Update `docs/backlog.md` + session log (Files-Changed table, AC self-audit, integrity transcript).

## Negative flow (must be proven — paste transcripts)
- **Plant violations** in a temp file `src/components/ui/__tok_probe.tsx`: a `#abcdef` color, a `p-[13px]`, a `z-[123]`,
  a `shadow-[0_0_2px_red]`, a `duration-[450ms]`. Run `--strict` → exit 1, each named with file:line + category. Run
  `--report` → same items listed, **exit 0** (proves report mode never blocks). Then DELETE the probe (ask the owner to
  delete if the mount blocks `rm`).
- **No false positives:** `var(--token)`, `p-4`, `text-sm`, `shadow-md`, `z-50`, `max-w-md`, `duration-200`, and the
  `globals.css` token definitions are NOT flagged (show a clean run on the real tree minus allowlist).
- **Allowlist works:** an allowlisted email-template literal is NOT flagged; a stale allowlist entry (non-existent file)
  → warning.
- **Rename safety:** after the `--container-max`→`--width-page-max` rename, grep shows 0 stray `--container-max` refs and
  `max-w-max` still resolves to `max-content` (state how verified).

## Acceptance criteria (machine-proven)
- `scripts/check-design-tokens.mjs` exists with `--report` (default, exit 0), `--strict` (exit 1 on violation, NOT in CI),
  `--update-allowlist`. Negative-flow plant proves `--strict` bites and `--report` stays exit 0.
- Committed `scripts/design-tokens-allowlist.json` with real justifications (0 stubs); stale-entry warning works.
- `package.json` has the three scripts; CI has a **non-blocking** report step only (no strict step yet).
- `--container-max` renamed to `--width-page-max`; `§22.7` updated; 0 stray refs; `max-w-max` still `max-content`.
- `docs/design-system.md §23` documents the gate + the report→strict(407) rollout.
- `node --check` on the script; 0 NUL/BOM/truncation on every touched file (clause 14 transcript); `tsc=0`.
- `docs/backlog.md` updated; session log with AC-by-AC table + Files-Changed table.
- **No `git add`/`commit` from the executor** — orchestrator emits commits on review.

## Mobile <640 full-width gate
**N/A** — no UI surface changes (detector + token rename only). State this in the session log. The gate (and the
**mandatory rendered before/after matrix**) re-applies in FULL to the refactor Tasks 403–406, which DO change components —
for those, build-pass + reasoning will NOT be accepted as proof of inertness.

## Pre-read (mandatory)
- `docs/agent-contract.md` (1–14) · `docs/backlog.md`
- `scripts/check-hardcoded-i18n.mjs` (396) · `scripts/check-story-coverage.mjs` (398) · `scripts/check-file-integrity.mjs` (400) — reuse their mode/allowlist/stale-entry/CI conventions
- `docs/design-system.md` (§22 token registry, §4 container) · `docs/tailwind-governance.md` · `docs/tailwind-entropy-audit.md`
- `docs/ui-rules.md` (§16 z-index) · `docs/qa-rules.md`

## Out of scope
- Refactoring consumers to tokens (403–406). Flipping the gate to blocking (407). Auto-fixing. Scanning non-`src` dirs.
- Any Figma export (deferred).
