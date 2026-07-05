# Task 550 — Zip-absent primitives: live-reference re-verification (Toast §6r · Slider §6q · Skeleton §6n)

> **Sprint 40 / Epic MM — Phase 1 correction slice. Owner P0, agent-contract clause 16 + NEW clause 16a (Variant A, 2026-07-05).**
> **Executor:** Sonnet 4.6. **Type:** UI / Mantine primitive re-verification (live-reference capture → §6x re-grounding →
> theme adjust only where the live capture proves a divergence → rendered proof). **Status:** OPEN.
> **Why this task exists:** the owner rejected the way Toast (549), Slider (548) and Skeleton (544) were closed. All three
> are "honest-negative on the zip" — `demo_tailadmin_com.zip` contains **zero** reference markup for them — and each was
> closed by (a) formalizing a prior "live-measured" prose line into a `§6x` row and (b) accepting Mantine's own defaults
> as conformant ("zero-override: the default already matches"). Under new clause 16a **both moves are a task failure.**
> The rendered result reads as stock Mantine, not TailAdmin (e.g. Toast keeps Mantine's circular 28px icon badge). The
> crash-and-geometry rendered gate (Task 529) passed because it does NOT check TailAdmin chrome.

## Scope

Re-ground the three zip-absent primitive rows on an **authoritative live capture** from `demo.tailadmin.com`, then bring
each themed primitive into proven visual conformance with that capture. **One primitive at a time**, in this order:
**Toast (§6r) → Slider (§6q) → Skeleton (§6n).**

**In scope (per primitive):** the `§6x` row in `docs/tailadmin-style-reference.md`; the `theme.components.<Primitive>`
block in `src/design-system/mantine/theme.ts`; the matching `*-chrome.css` (only if a value is proven not theme-reachable);
the existing `Mantine/Primitives/<Primitive>` story (adjust visuals only — no new consumers); the four `messages/*.json`
only if a string changes; the relevant governance/reference docs + session log.

**Out of scope:** any consumer migration; any other primitive; shared tokens / semantic color arrays / `globals.css`;
the live overlay-provider positioning (Toast `<Notifications/>` position stays `top-right` — mobile re-anchor remains a
separate noted follow-up, clause 11 STOP-AND-ASK).

## 🔴 Step 0 — LIVE REFERENCE IS PROVIDED BY THE ORCHESTRATOR (clause 16a — executor does NOT browse TailAdmin)

**The orchestrator captures the live `demo.tailadmin.com` reference and writes the provenance-stamped `§6x` rows BEFORE
this kickoff is handed over.** Capturing the source of truth is the orchestrator's job, not the executor's — Sonnet does
**NOT** open Chrome or browse TailAdmin. When you (executor) start, the `§6n` / `§6q` / `§6r` rows in
`docs/tailadmin-style-reference.md` already carry: the measured `getComputedStyle` values, the reference screenshot
reference, and provenance (URL, capture date, method, selector), plus a per-primitive **capture-vs-current-render
divergence list** the orchestrator recorded.

Your job for each primitive:

1. Read the orchestrator's captured `§6x` row (values + divergence list). If the row is missing, lacks provenance, or has
   no divergence list, **STOP and ask the orchestrator** — do NOT browse TailAdmin yourself and do NOT fall back to the
   old prose values.
2. Implement against those captured values only (next section). Every value you write must cite the captured `§6x` figure.
3. Prove your render matches the captured reference side-by-side (see Gates).

## 🔴 Toast (§6r-LIVE) — captured reference + required fixes (orchestrator, 2026-07-05)

Reference captured live at `demo.tailadmin.com/notifications` (UI Elements → Notifications → Toast/Success), recorded in
`docs/tailadmin-style-reference.md` §6r-LIVE. The TailAdmin compact toast is:
`flex items-center justify-between gap-3 w-full sm:max-w-[340px] rounded-md border-b-4 border-success-500 bg-white p-3 shadow-theme-sm`.
Implement these fixes against §6r-LIVE (each is a measured divergence from the current Mantine Notification):

1. **Accent = 4px BOTTOM border** (`border-b-4`, semantic-500 per variant) — NOT the left `::before` bar / circular badge.
2. **Shadow = `shadow-theme-sm`** (this project's `shadows.sm`) — remove the `shadow-lg` reliance.
3. **Icon badge = 40×40 (`h-10 w-10`) `rounded-lg` (8px) tinted `bg-{semantic}-50`, 24px `{semantic}-600` glyph** — NOT
   Mantine's 28px circular solid-fill badge.
4. Radius 6px + `w-full`/`sm:max-w-[340px]` are already correct — verify against §6r-LIVE, keep.

Title 16px/400/#1D2939 (single-line, no separate body in the demo); close button 24px/#98A2B3 (gray-400); Outfit.

> **Slider (§6q) / Skeleton (§6n):** the orchestrator has NOT yet confirmed whether TailAdmin ships these at all (an
> earlier absence claim proved wrong for Toast, so no absence is asserted without a verified capture). **Do NOT start the
> Slider/Skeleton sub-tasks until the orchestrator posts a §6q/§6n live capture OR an explicit verified "no reference
> exists → token-consistency only" ruling.** Toast is unblocked now; Slider/Skeleton are blocked on that capture.

## Required after-behavior (per primitive)

- `§6x` row re-grounded on the live capture with provenance (Step 0).
- `theme.ts` (+ `*-chrome.css` only where proven not theme-reachable) adjusted so **every divergence** found in Step 0.4
  is fixed and every property is positively verified against the capture. `var(--mantine-*)` tokens / cited values only —
  zero invented color/px/radius/shadow.
- Existing `Mantine/Primitives/<Primitive>` story renders the corrected chrome; i18n `storyT` parity (sq/en/uk/it)
  preserved; no hardcoded strings.
- `LOADER_ALLOWLIST` re-verified empirically if the story changes (do not copy a prior finding forward).

## Mobile <640 full-width gate (clause 11)

Unchanged from each primitive's prior kickoff: cards/controls full-width edge-to-edge at `<640`, capped at the
capture-cited max-width at `≥640`; labels wrap; no document h-scroll at 320 in any locale; touch targets ≥44px or a
documented compact-control exemption. Re-confirm with rendered evidence — a chrome change must not regress the mobile gate.

## Positive + Negative flow (per primitive)

- **Positive:** `Mantine/Primitives/<Primitive>` at `≥640` and `320` × sq/en/uk/it renders chrome that **matches the
  live-captured TailAdmin reference side-by-side** (border, radius, shadow, padding, font, icon treatment, semantic accent),
  full-width at `<640` / capped at `≥640`.
- **Negative flow (every branch):**
  - **(a)** long uk/it strings @320/375/390 — full-width, wrap, NO document h-scroll, nothing clips.
  - **(b)** each semantic/variant state (Toast: success/info/warning/error/neutral; Slider: default/disabled;
    Skeleton: each shape) renders its correct captured chrome, no thrown error, no stray color.
  - **(c)** any state-dependent rule (Toast icon+accent together; Slider disabled thumb) still behaves per the compiled-
    source override, now verified against the capture.
  - **(d)** No regression: the theme change does not leak into any other component; no shared token/var/semantic array or
    `globals.css` modified; all existing consumers unchanged (these slices remain theme-only).

## Pre-read (rule-index → UI/layout/component + Storybook)

- `docs/agent-contract.md` (clauses 1–16 **+ 16a**) + `docs/backlog.md` + `docs/critical-flow-registry.md` (scan — theme-
  only, touches zero registered flows; confirm).
- 🔴 `docs/tailadmin-style-reference.md` — the honest-negative-provenance rule (top of §6r) + §6n/§6q/§6r rows to
  re-ground; §6l Alert as the semantic-variant mechanism (Toast).
- `docs/mantine-responsive-design-system.md` §7 (mobile gate), §12, §16, §18 (theming vs `*-chrome.css`).
- `docs/storybook-governance.md` §14 (+ §14.9 loader-allowlist record).
- `docs/ui-rules.md`, `docs/component-rules.md`, `docs/qa-rules.md`.

## Gates to close (HELD until green)

- Per primitive: `npm run screenshots:assert -- --mantine-only` (all cells resolved, uk@320/375/390 clean, no document
  h-scroll, no new FAIL) + attach the manifest **and the Step 0 live-capture screenshots side-by-side**.
- Planted-violation FAIL transcript per changed story, then revert byte-identical (as Task 548 did).
- `tsc --noEmit`, `check:stories`, `check:i18n`, `check:mojibake`, `check:design-tokens -- --strict`,
  `check:file-integrity` — all green (paste transcripts).
- Regression (clause 15): confirm no `critical-flow-registry.md` flow touched — state it.

## Acceptance criteria

1. For EACH of Toast/Slider/Skeleton: `§6x` row re-grounded on a live `demo.tailadmin.com` capture with full provenance
   (URL, date, method, selector) — the "formalized-prose / honest-negative zero-override" justification removed (clause 16a).
2. Every Step 0.4 divergence fixed in `theme.ts` (+ `*-chrome.css` only with compiled-source proof); every property
   positively verified against the capture; zero invented values.
3. Story renders corrected chrome, proven **side-by-side with the live capture** at `≥640` and `320` × sq/en/uk/it; mobile
   gate re-confirmed; `LOADER_ALLOWLIST` re-verified empirically.
4. No regression: theme-only + new-file; no shared token/semantic array / `globals.css` change; all consumers unchanged.
5. Rendered `--assert` matrix + side-by-side captures + planted-violation transcript; all light gates green.
6. Session log: Files-Changed table, AC-by-AC self-audit, `Self-validation: …` line. **Do NOT run git.**

## Commit hand-off (HELD)

Do NOT emit `git add`/`git commit`. HELD — the orchestrator reviews the real diff (Read-tool, no sandbox git) + the
rendered matrix + the Step 0 live captures, verifies clause 16a provenance for each primitive, then emits explicit-path
commits (one per primitive: its `theme.ts` block [+ `*-chrome.css` if justified] + `Mantine/Primitives/<Primitive>` story
+ `docs/tailadmin-style-reference.md` §6x + any `messages/*.json` + session log + tracker + `docs/backlog.md`). Owner runs
them in PowerShell after the native gate.
