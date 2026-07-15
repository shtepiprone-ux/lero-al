# Task 607 — Extend the canonical Mantine rendered gate to `Patterns/Mantine/*` (all 13 pattern stories)

Sprint 44 (Epic MM Phase-2 — Mantine/TailAdmin migration · gate hardening). Owner-directed 2026-07-15
(chose "All 13 pattern stories" via AskUserQuestion at the Task 606 review).

> **⚠ Orchestrator note — this is a GATE/GOVERNANCE task, not product UI.** You are changing
> `scripts/check-stories-rendered.mjs` (the canonical rendered gate) so it also covers the
> `Patterns/Mantine/*` story group. Do NOT edit any product component or any pattern/story to make
> a cell pass — if a pattern story genuinely fails the gate, **STOP and ASK**; a real defect it
> surfaces is a separate follow-up task, never silently patched here.

## Why this exists (Task 606 review, 2026-07-15)

The canonical gate `scripts/check-stories-rendered.mjs` auto-discovers Mantine stories ONLY by the
title prefix `Mantine/Primitives/` (`MANTINE_PRIMITIVES_TITLE_PREFIX`, line 263 + `discoverMantinePrimitiveStories`,
line 314). The `Patterns/Mantine/*` group is therefore invisible to the richer Mantine gate and to
`--mantine-only` runs entirely. Consequence found at the Task 605/606 reviews: `Patterns/Mantine/ListingCardPattern`
had **no machine rendered coverage**, forcing a throwaway ad-hoc QA script and hand-verified pixels.
In **full** mode these pattern stories do get Phase-2 *geometry-only* coverage (no-h-scroll / full-width),
but they get none of the richer render/anchor/open-trigger/style assertions, and **nothing under `--mantine-only`**
(the fast path most task reviews use). Close the hole for the whole group so it can never drift per-story.

## Blast radius (grep-verified 2026-07-15) — all 13 `Patterns/Mantine/*` stories

`AdminSurfacePattern`, `AppShellFoundation`, `AuthFormPattern`, `CardGrid`, `DialogDrawerPattern`,
`EmptyLoadingErrorState`, `FormSectionStack`, `ListingCardPattern`, `ListingDetailPattern`,
`NotificationPattern`, `PageHeaderWithActions`, `ResponsiveActionFooter`, `TwoColumnForm`
(all under `src/stories/patterns/mantine/*.stories.tsx`).

## Pre-read (rule-index → Storybook / visual snapshot task)

**Always:** `docs/agent-contract.md` (clauses 1, 2, 9, 12, 13, 14 — esp. 12/13 rendered-evidence + enforceable
gate, 14 file-integrity), `docs/backlog.md`, `docs/critical-flow-registry.md` (scan — this task changes a
rendered gate that guards registry rows).
**Required:** `docs/mantine-responsive-design-system.md` §8 (Mantine Storybook proof) + §13 (rebuild plan),
`docs/storybook-governance.md` (§14 enforced gates — read the Task 529 auto-discovery note + §14.9.x allowlist
discipline), `docs/storybook-visual-snapshots.md`, `docs/component-rules.md`, `docs/qa-rules.md`.
**Read (the file you are changing):** `scripts/check-stories-rendered.mjs` — in full: `MANTINE_PRIMITIVES_TITLE_PREFIX`
(263), `MANTINE_OVERLAY_PRIMITIVES` (270), `MANTINE_VIEWPORTS` (281), `MANTINE_STORY_EXTRA_VIEWPORTS` (306),
`discoverMantinePrimitiveStories` (314), the zero-match guard (1233), and the `geometryOnlyStories` exclusion (1219).

## Current behavior to preserve

- `Mantine/Primitives/*` discovery, viewport set, overlay open-triggers, extra-viewport map, and the loud
  zero-match guard all keep working byte-for-identical for the primitives (no regression to the ~37 existing
  primitive stories or their pass/fail).
- `ASSERT_STORIES` (Phase 1) and the full-mode geometry-only enumeration (Phase 2) keep their current behavior
  for every NON-`Patterns/Mantine/*` story.
- `--fast`, `--mantine-only`, and full-mode invocation semantics unchanged except for the added coverage.

## Required after-behavior (the delta)

1. **Discovery matches BOTH prefixes.** Replace the single `MANTINE_PRIMITIVES_TITLE_PREFIX` match with a
   prefix LIST (e.g. `MANTINE_STORY_TITLE_PREFIXES = ['Mantine/Primitives/', 'Patterns/Mantine/']`).
   `discoverMantinePrimitiveStories` matches a story if its title starts with ANY listed prefix, and derives
   `componentName` by stripping whichever prefix matched (e.g. `Patterns/Mantine/ListingCardPattern` →
   `ListingCardPattern`). NO hardcoded story-id allowlist (preserve the Task 529 no-drift discipline) — the set
   is purely prefix-derived so a future `Patterns/Mantine/*` story is covered automatically.
2. **Auto-exclusion is automatic** — `geometryOnlyStories` (line 1219) already filters out `mantineIds`, so the
   13 pattern stories move from geometry-only into the richer Mantine gate with no extra code. Confirm in the run
   that no pattern story is double-counted (present in BOTH phases).
3. **Overlay open-triggers — triage per pattern, do NOT guess.** Some pattern stories render their content inline
   (no trigger needed); some (`DialogDrawerPattern`, `NotificationPattern`, possibly `ListingDetailPattern`) may
   need a trigger click before the asserted DOM exists — the exact reason `MANTINE_OVERLAY_PRIMITIVES` exists.
   For each of the 13, determine whether the Default story's asserted content is present on load or requires an
   open action. If a pattern needs an open-trigger to render meaningful content, **STOP and ASK the orchestrator**
   with the specific story + what it needs (do not invent a new trigger heuristic silently). Inline-rendering
   patterns need no change.
4. **Zero-match guard stays meaningful.** The guard at line 1233 must still fire loudly if discovery yields zero
   stories total; update its message/prefix references to reflect the prefix LIST (it must not silently accept a
   drift on either prefix).
5. **Honest triage of new cells.** Running the extended gate over the 13 pattern stories WILL likely surface new
   PASS / AMBIGUOUS / FAIL cells. Catalogue every one. A genuine FAIL/AMBIGUOUS that reflects a real defect in a
   pattern/story is **NOT** fixed here — record it, and **STOP and ASK** so the orchestrator opens a targeted
   follow-up. Do NOT edit product components or pattern stories to force green. The ONLY acceptable in-task
   resolutions are: (a) the story genuinely passes, or (b) it needs an open-trigger per item 3 (ask first).

## Positive flow (happy path)

Actor: CI / a reviewer running the rendered gate.
1. `npm run screenshots:assert -- --mantine-only` → discovery now returns the ~37 primitives **plus** the 13
   pattern stories; each runs at 320/375/390/1024 × sq/en/uk/it; the run reports per-story PASS with the pattern
   stories included in the totals.
2. `npm run screenshots:assert` (full) → pattern stories appear in the Mantine gate, NOT in the geometry-only
   phase (no double count); primitive + assert phases unchanged.
3. A fresh `Patterns/Mantine/<New>` story added later is picked up automatically (prove by temporarily adding a
   throwaway entry to the index reasoning / or noting the prefix-derived guarantee) with no allowlist edit.

## Negative flow (every off-happy-path branch)

- **Prefix drift / zero matches** → the line-1233 guard fires with a non-zero exit and a message naming BOTH
  prefixes (never a silent zero-coverage pass).
- **Stale/unreadable `index.json`** → existing hard-abort path (line 1222) still fires; unchanged.
- **A pattern story needs an overlay open-trigger** → executor STOPS and ASKS (item 3); does not guess a trigger.
- **A pattern story genuinely fails geometry/render** (real defect) → recorded + routed back as a follow-up;
  NOT patched in this task; the gate is left correctly RED for that story only if the owner/orchestrator confirms
  it should block (otherwise the follow-up carries the fix and this task documents the known-fail).
- **Planted no-op check** → a deliberately broken `Patterns/Mantine/*` story (e.g. inject a `min-width` that
  overflows 320 in `ListingCardPattern`) MUST make `--mantine-only` FAIL that cell; revert after capturing the
  transcript (proves the new coverage is real, not a no-op — clause 13).
- **`--fast`** → still runs the Mantine gate unconditionally (incl. the 13) without the full 14-viewport sweep;
  no new skip.

## Acceptance criteria (each verifiable in the diff / transcript)

1. `discoverMantinePrimitiveStories` matches BOTH `Mantine/Primitives/*` and `Patterns/Mantine/*` via a prefix
   LIST; `componentName` correctly stripped for each; no hardcoded story-id allowlist. (file:line)
2. All 13 `Patterns/Mantine/*` stories appear in the `--mantine-only` run output and in the full-mode Mantine
   phase; NONE appears in the geometry-only phase (no double count). Transcript pasted. (file:line + transcript)
3. Primitives coverage byte-unchanged: the ~37 `Mantine/Primitives/*` stories' discovery, viewports, overlay
   triggers, extra-viewport map, and pass/fail are identical to pre-change (before/after count + a diff of the
   primitive story list). (transcript)
4. Zero-match guard updated to reference the prefix LIST and still exits non-zero on zero discovery. (file:line)
5. Per-story triage table for the 13 patterns: PASS / AMBIGUOUS / FAIL + cause; every non-PASS either (a) an
   open-trigger STOP-AND-ASK, or (b) a recorded real-defect follow-up — NONE resolved by editing a product
   component or a pattern story. (session log)
6. **Anti-no-op proof:** planted-violation transcript showing `--mantine-only` FAILs a broken `Patterns/Mantine/*`
   cell, then reverted to green. (clause 13, transcript)
7. **Rendered evidence:** persist the pattern-story matrix (uk@320/375/390 mandatory + one desktop width × 4
   locales) under `docs/sessions/2026-07-15-task607-assets/` (or dated), with a manifest. (clause 12)
8. Gates: `tsc`=0 (script is `.mjs` → `node --check`), `node --check scripts/check-stories-rendered.mjs` passes,
   `npm run check:stories` green, `check:file-integrity` clean on every touched file, `check:mojibake` clean.
   NO `git add`/`git commit` (orchestrator emits at review).
9. Session log: AC-by-AC self-audit, the per-story triage table, before/after primitive-count proof, planted-
   violation transcript, "Files Changed" table, rendered matrix. `docs/backlog.md` updated. If any pattern needs
   an open-trigger or has a real defect, the STOP-AND-ASK / follow-up is spelled out.

## Scope (files)

**In scope:** `scripts/check-stories-rendered.mjs` (prefix-list discovery + guard message; possibly
`MANTINE_OVERLAY_PRIMITIVES` additions ONLY after the orchestrator approves specific pattern open-triggers per
item 3), `docs/storybook-governance.md` (§14 note recording the `Patterns/Mantine/*` coverage extension),
`docs/critical-flow-registry.md` (if a row references the rendered-gate coverage), the persisted assets dir,
`docs/backlog.md`, session log.

**Out of scope (do NOT touch):** any product component; any `*.stories.tsx` (including the 13 pattern stories —
you may READ them to determine inline-vs-overlay, but not edit them to force green); `ASSERT_STORIES`; the
primitives' viewport/overlay config; the geometry-only phase logic beyond confirming auto-exclusion works.

## Hard contract

No scope change; no invented architecture. In particular: **do NOT hardcode a story-id allowlist** (prefix-derived
only, per Task 529), **do NOT edit any product component or pattern story to make a cell pass**, and **STOP and
ASK** on: any pattern needing an overlay open-trigger, any genuine pattern-story defect the gate surfaces, or any
ambiguity in the prefix/componentName derivation. Both the positive AND every negative branch above must be
exercised in the transcript. The anti-no-op planted-violation transcript is mandatory (clause 13). Self-validate
before "complete"; AC-by-AC table + per-story triage table + "Files Changed" table + rendered matrix required;
executor emits NO git. A gate that silently passes zero pattern stories, or is made green by editing a component/
story instead of surfacing a real defect, is a TASK FAILURE.
