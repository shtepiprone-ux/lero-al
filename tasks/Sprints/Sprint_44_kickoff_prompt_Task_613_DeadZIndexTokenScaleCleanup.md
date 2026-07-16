# Task 613 — Remove/deprecate the DEAD `--z-*` Tailwind z-index token scale (reconcile `ui-rules.md §16`)

Sprint 44. Orchestrator-opened 2026-07-16, split out of the **Task 612 STOP-AND-ASK** (Sonnet discovered, orchestrator
confirmed, the whole `--z-*` scale is dead CSS). **Low priority / cleanup — NOT a blocker for 612.** Do this AFTER 612
lands.

## The finding (confirmed by source read + Sonnet's live `getComputedStyle`)
`src/app/globals.css:245-251` declares a z-index scale inside `@theme inline`:
```
--z-base:0 · --z-dropdown:10 · --z-sticky:30 · --z-overlay:40 · --z-modal:50 · --z-popover:50 · --z-toast:100
```
Tailwind v4 does **NOT** generate `z-*` utilities from the `--z-*` namespace (there is no `--z-index-*` block and no
manual `@utility`/`.z-toast{}` rule anywhere in `src/**/*.css`). So every `z-toast`/`z-sticky`/`z-modal`/`z-overlay`/
`z-popover`/`z-dropdown`/`z-base` class name matches **no rule** → computes to `z-index: auto`. The scale has never
applied. This is dead CSS.

**Why the app still works:** overlays migrated to **Mantine** (own z-index tiers); the remaining raw overlays use
**working core `z-30`/`z-40`/`z-50`** or the allowlisted **`z-[9999]`** escape-hatch. `ui-rules.md §12` already
documents the REAL system as "Chrome `z-30` · scrim `z-40` · floating `z-50`" (core classes), which contradicts the
`--z-*` token scale §16 implies.

## Blast radius (grep `src/**/*.tsx` for the token classes — do this FIRST and paste the result)
As of 2026-07-16 the only live token consumer was `ListingGallery.tsx`'s `z-toast` — **fixed in Task 612** (→
`z-[9999]`). Re-grep at execution: `grep -rnE '\bz-(toast|sticky|modal|overlay|popover|dropdown|base)\b' src --include=*.tsx --include=*.ts`
(exclude comments/tests). Expected ≈ 0 live consumers after 612. If any remain, migrate each to a working core
`z-30/40/50` class or an allowlisted `z-[…]` per its tier — one PR-safe change per consumer, no behavior change.

## Direction (owner steer 2026-07-16: "moving off Tailwind onto Mantine")
Do **NOT** revive the token scale by adding a `--z-index-*` namespace / `@utility` block. **Deprecate it:**
1. Remove the dead `--z-*` declarations from `globals.css:245-251` (or, if any token is still referenced by a
   `var(--z-…)` in CSS — grep to confirm — keep only those and delete the rest). Paste the `grep -rn 'var(--z-' src`
   result to justify what stays vs goes.
2. Reconcile `docs/ui-rules.md §16` + the §12 table: document the SINGLE real z-index story — Mantine tiers for
   Mantine overlays; core `z-30` chrome / `z-40` scrim / `z-50` floating for raw ones; `z-[9999]` allowlisted
   escape-hatch for "above everything" (cite `Combobox.tsx:207` + the Task 612 lightbox). Remove the misleading
   `z-toast:100` / `--z-*` references.

## Pre-read (rule-index: UI + Tailwind/styling governance)
- **Always:** `docs/agent-contract.md`, `docs/backlog.md`, `docs/critical-flow-registry.md` (scan — likely none).
- **Required:** `docs/ui-rules.md` (§12 + §16), `docs/tailwind-governance.md`, `docs/mantine-responsive-design-system.md`
  (§18 — Mantine z-index tiers), `docs/qa-rules.md`.

## Positive flow
Grep proves ≤0 live token consumers → delete the dead `--z-*` declarations (keeping only any still-`var()`-referenced)
→ update `ui-rules.md §16/§12` to the real single story → `tsc`/`eslint`/`check:file-integrity`/`check:mojibake`/the
design-token z-index gate all green → no rendered change anywhere (dead CSS removed changes no pixel).

## Negative flow
- A token is still referenced by `var(--z-…)` in CSS → keep that one declaration, document why, migrate the consumer
  in the same task or STOP-AND-ASK if it's non-trivial.
- The design-token gate expects `--z-*` to exist → update the gate/allowlist in the same change; paste before/after.
- Any consumer whose tier is ambiguous (needs to beat Mantine's z-index) → STOP-AND-ASK, do not guess.

## Acceptance criteria
1. `grep` transcripts: (a) token-class usage in `src` (proves ≤0 live consumers, or lists + migrates each), (b)
   `var(--z-…)` usage (justifies each declaration kept vs deleted). (transcript)
2. Dead `--z-*` declarations removed from `globals.css`; any kept one is justified by a real `var()` reference. (file:line)
3. `docs/ui-rules.md §16` + §12 reconciled to the single real z-index story (Mantine tiers + core `z-30/40/50` +
   `z-[9999]` escape-hatch); no `z-toast`/`--z-*` references remain. (file:line)
4. Zero rendered change — this removes dead CSS only. Spot-render one overlay-heavy page before/after to confirm. (evidence)
5. `npx tsc --noEmit`=0, `eslint` clean, design-token/z-index gate green, `check:file-integrity`+`check:mojibake` clean. (transcript)
6. Session log + `docs/backlog.md` (mark 613 done, tidy, numbering) + "Files Changed" table. NO git.

## Scope (files)
**In scope:** `src/app/globals.css` (remove dead `--z-*`), `docs/ui-rules.md` (§16/§12 reconcile), possibly the
design-token gate config/allowlist if it references `--z-*`, `docs/backlog.md`, session log. Any leftover token
consumer in `src/**` only if the grep finds one (migrate to a working class).
**Out of scope:** the Task 612 lightbox (already fixed), converting anything to Mantine Modal, adding a `--z-index-*`
namespace (explicitly rejected — do not revive Tailwind tokens).

## Hard contract
Deprecate, do NOT revive. No `--z-index-*` namespace, no `@utility` resurrection. Zero pixel change (dead CSS only).
Grep-prove blast radius before deleting. Executor emits NO git; STOP-AND-ASK on any still-referenced token or
gate-config surprise.
