# Task 651 — Correct the false "Tailwind wins / `@layer mantine` separate cascade / no conflict" claims in `docs/mantine-responsive-design-system.md` (§1/§2/§5 tables): `@mantine/core/styles.css` is imported UNLAYERED, so Mantine component CSS beats Tailwind utilities; add the practical `Box`/`unstyled` rule

- **Task number:** 651
- **Epic:** none (governance doc-correction — Q0).
- **Parent / origin:** Independently confirmed twice — Task 629 (HeaderView) and Task 650 (HeroSearchView) — that `docs/mantine-responsive-design-system.md`'s claim "Tailwind utilities can override Mantine" / "`@layer mantine` is separate from `@layer utilities` / no conflict" is **wrong**. `@mantine/core/styles.css` is imported plainly (unlayered) in `src/app/layout.tsx:6`, so Mantine's own component CSS is UNLAYERED and beats Tailwind's `@layer utilities` (unlayered CSS always wins over any cascade layer). This has caused executors to hit silent style overrides (Task 629 fixed via `unstyled`; Task 650 used `Box` instead of `Paper`). This task fixes the doc so future tasks don't repeat the trap.

## Mode and task type

- **Mode:** implementation kickoff for a fresh Sonnet session (execute via `.claude/skills/execute-task/SKILL.md`).
- **Task type:** **Q0 governance doc-correction** — edit `docs/mantine-responsive-design-system.md` only. No code, no UI, no i18n. (Q0 → the mandatory `npm run build` gate does NOT apply.)

## Objective

In `docs/mantine-responsive-design-system.md`, correct the three table rows that assert Mantine CSS is layered / Tailwind overrides it, replacing them with the verified reality (Mantine styles.css is unlayered → Mantine component CSS beats Tailwind utilities), and add a short, practical rule: when a Tailwind utility must win over a Mantine component's own styling, either use the component's `unstyled` prop (Task 629 precedent) or use `Box` instead of a styled surface primitive like `Paper`/`Card` (Task 650 precedent).

## Verified context

Inspected on 2026-07-20. `src/app/layout.tsx` lines 6–15 import CSS plainly:
```tsx
import '@mantine/core/styles.css'      // ← UNLAYERED (no @layer mantine wrapper)
import '@mantine/notifications/styles.css'
import '@/design-system/mantine/input-chrome.css'
…
import './globals.css'                  // Tailwind v4 — uses @layer base/components/utilities
```
- `@mantine/core/styles.css` is a **plain import**, NOT wrapped in `@layer mantine`. Mantine v7 ships unlayered CSS by default (it does not self-wrap in a layer unless `postcss-preset-mantine`'s layer option is enabled, which this project does not use — confirmed: `postcss.config.mjs` unchanged, no layer wrapping).
- **CSS cascade fact:** unlayered rules beat layered rules regardless of source order (a declaration in no layer always wins over a declaration in any `@layer`). So Mantine's component CSS (unlayered) beats Tailwind utilities (in `@layer utilities`). Tailwind classes therefore do NOT override Mantine component defaults (radius, shadow, border, colors) — the opposite of what the doc claims.
- **Evidence:** Task 629 session log (`@mantine/core/styles.css` unlayered → Header Tailwind classNames silently lost, fixed via `unstyled`); Task 650 session log (`Paper` forced all corners to 16px + collapsed `shadow-xl`, because Paper's unlayered component CSS beat the Tailwind classes; fixed by using `Box`, which has no component CSS).

### The three claims to correct (verbatim locations)

1. **~line 96** (a §1/§2 decision table row):
   > `| Mantine docs — CSS imports | CSS import order | `@mantine/core/styles.css` before app CSS so Tailwind utilities can override | Both imports in `src/app/layout.tsx`; `@layer mantine` is below Tailwind `@layer utilities` | ... |`
   - **Wrong:** "so Tailwind utilities can override"; "`@layer mantine` is below Tailwind `@layer utilities`".
2. **~line 105**:
   > `| Tailwind v4 docs | CSS layer coexistence | Mantine uses `@layer mantine`; Tailwind v4 uses `@layer base, components, utilities` — separate cascade layers, no conflict | No `postcss-preset-mantine` needed; Mantine CSS imported directly | ... |`
   - **Wrong:** "Mantine uses `@layer mantine` … separate cascade layers, no conflict" — Mantine CSS is imported directly and **unlayered**; "imported directly" is the very reason it is unlayered and wins.
3. **~line 144** (§5 Provider architecture table):
   > `| Tailwind boundary | `@layer mantine` is separate from `@layer utilities` | No conflict |`
   - **Wrong:** there is no `@layer mantine`; Mantine's unlayered CSS beats `@layer utilities`.

(Find each by its text, not the exact line number.)

## Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | Correctness | The three rows are rewritten to state: `@mantine/core/styles.css` is imported **unlayered** in `layout.tsx`, so Mantine component CSS **beats** Tailwind `@layer utilities`; Tailwind utilities do NOT override Mantine component styling | P0 | `git diff`; each corrected row states the unlayered reality | Confirmed |
| R2 | Practical rule | A short rule is added (in the most relevant spot, e.g. right after the corrected §5 row or in the §6 theme-architecture area): "To make a Tailwind utility win over a Mantine component's own CSS, use the component's `unstyled` prop (Task 629) or use `Box` instead of a styled surface primitive like `Paper`/`Card` (Task 650)." Cite both tasks | P0 | `git diff` shows the rule | Confirmed |
| R3 | No overreach | Only `docs/mantine-responsive-design-system.md` is edited; the corrections are factual (no invented layer config); clause identifiers / unrelated rows unchanged | P0 | `git diff` scope | Confirmed |
| R4 | Integrity | File stays valid Markdown, UTF-8 no-BOM, no mojibake | P0 | `check:mojibake` exit 0; render check | Confirmed |

## Assumptions and open questions

- **Do not "fix" the code to match the old doc** (i.e. do NOT wrap Mantine CSS in `@layer mantine`) — the current unlayered import is the working state that all migrated components rely on; this task corrects the DOC to match reality, not the reverse.
- If the executor finds additional rows/sentences in the same doc repeating the same false claim, correct those too (same factual fix) and list them; do not leave a contradicting statement elsewhere in the file.
- Keep the corrections concise and factual; cite `src/app/layout.tsx:6` (unlayered import) and Tasks 629/650 as evidence.

## Pre-read rule bundle

- `docs/agent-contract.md` (clauses 1 scope, 2 no-invented-facts, 14 file integrity).
- `docs/mantine-responsive-design-system.md` (target — read §1/§2 decision tables + §5 + §6).
- Evidence: `src/app/layout.tsx` (unlayered import), `docs/sessions/2026-07-19-task629-headerview-chrome-mantine-migration.md` + `docs/sessions/2026-07-20-task650-herosearchview-container-chrome-mantine.md` (the two independent confirmations).

## Scope

1. Correct the three identified rows in `docs/mantine-responsive-design-system.md` to state the unlayered reality (R1), plus any sibling sentence repeating the claim.
2. Add the practical `unstyled`/`Box` rule with Task 629/650 citations (R2).
3. Write the session log + a concise `docs/backlog.md` entry. Keep ≤80 lines (consolidate first if needed).

## Out of scope

- Any code change (`layout.tsx`, `postcss.config.mjs`, components, `theme.ts`) — this is a doc-only correction.
- Rewrapping Mantine CSS in a layer, or any behavioral change.

## Current and required behavior

- **Current:** the doc claims Mantine CSS is layered and Tailwind utilities override it — false; has misled two tasks.
- **Required after:** the doc states that Mantine `styles.css` is unlayered and its component CSS beats Tailwind utilities, with the practical `unstyled`/`Box` escape-hatch rule; no code changes.

## Acceptance criteria

- `AC1 [R1]` Given the diff, then the three rows (import-order, layer-coexistence, provider Tailwind-boundary) state that Mantine CSS is unlayered and beats Tailwind `@layer utilities` (Tailwind does NOT override Mantine component styling).
- `AC2 [R2]` Given the diff, then a concise rule instructs using `unstyled` or `Box` (not `Paper`/`Card`) when a Tailwind utility must win, citing Tasks 629 and 650.
- `AC3 [R3,R4]` Given the diff, then only the doc changed, no false claim remains elsewhere in the file, and `check:mojibake` exits 0 with valid Markdown.

## QA profile and verification plan

**Profile: Q0 (governance doc-correction — no code).** Evidence:

1. `npm run check:mojibake` → 0 artifacts (the doc is scanned).
2. Read-back / Markdown render of the corrected rows + the new rule to confirm they read correctly and no contradicting statement remains.
3. `git status --short` / `git diff --stat` → only `docs/mantine-responsive-design-system.md`, `docs/backlog.md`, and the session log.

(Q0 → `npm run build` NOT required; no `typecheck`/`check:stories` relevance since no code changed — run `check:mojibake` for integrity.)

## Completion report contract

Write `docs/sessions/2026-07-20-task651-doc-correction-unlayered-mantine-css.md` + a concise `docs/backlog.md` update. Include: a Files Changed table; R1–R4 with evidence; the before/after of each corrected row + the new rule; the `check:mojibake` result; confirmation that no code was touched and no contradicting claim remains; and the `layout.tsx:6` + Tasks 629/650 evidence. Final status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` / `PARTIALLY IMPLEMENTED` / `BLOCKED` — never self-approval. Do not run or emit mutating git.

Handoff: execute via `.claude/skills/execute-task/SKILL.md` against this file path.

## Task quality gate

- A fresh Sonnet session can execute this without chat context: the three false claims are quoted with locations, the correct fact (unlayered → Mantine wins) is stated with `layout.tsx:6` evidence, the practical `unstyled`/`Box` rule + Task 629/650 citations are specified, and the doc-only Q0 scope is explicit. ✅
- Every requirement has a binary AC; the "do not fix code to match old doc" trap is called out. ✅
- Scope is doc-only; no invented layer config; Q0 (no build gate). ✅
