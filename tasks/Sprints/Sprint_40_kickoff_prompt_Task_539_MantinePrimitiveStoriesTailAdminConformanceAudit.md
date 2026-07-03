# Task 539 (EXPANDED) — Mantine primitive stories: full TailAdmin conformance audit + fixes

> **Sprint 40 (TailAdmin Conformance — All Primitives). Owner P0, 2026-07-03.**
> **Executor:** Sonnet 4.6. **Type:** UI / primitive chrome conformance (theme.ts + stories) — NOT product code.
> **Status:** HELD (uncommitted) until the whole audit passes the rendered gate. Sequence AFTER Task 540 (shell
> full-width) so the audit is done against the final layout.

## Why this is expanded (owner directive, 2026-07-03)

Task 539 originally shipped only the canonical `MantineProgress` primitive (done, render-verified, held). While
reviewing, the owner spotted that the **SegmentedControl story visibly diverges from TailAdmin's segment toggle**
and called it a conformance failure. Owner decision: **fold the fix into Task 539 and HOLD 539 until a full audit
is done** (*"цю Story також треба додати у 539 задачу"* + "Hold 539 until the audit"). Because one primitive slipped
through despite clause 16, **every primitive is now suspect** — so 539 becomes a systematic side-by-side audit of
all 23 `Mantine/Primitives/*` stories against `demo_tailadmin_com.zip`, fixing every divergence.

## Scope

- **A. Progress primitive — DONE, held.** Already implemented + render-verified (`docs/sessions/2026-07-03-task539-mantine-progress-primitive.md`). No further work unless the audit finds a delta. Do NOT regress it.
- **B. SegmentedControl §6c conformance — CONFIRMED delta, fix it.** See below.
- **C. Full audit of ALL 23 primitives** vs the zip — produce a delta table, fix every divergence found.

## 🔴 SegmentedControl (Scope B) — the confirmed failure

`docs/tailadmin-style-reference.md` §6c specifies the segment toggle:
- Container: `rounded-lg` (8) `border border-gray-200` `bg-gray-100` `p-1`, **content-width desktop**.
- Item base: `rounded-md px-3 py-2 text-theme-sm (14) font-medium (500)` **`text-gray-500`**.
- Item active: `bg-white text-gray-900 shadow-theme-xs`.
- Item hover (inactive): **`text-gray-700`**.

`src/design-system/mantine/theme.ts` (`components.SegmentedControl`) currently matches track/active-pill/shadow/
border/fw/size, BUT **explicitly DEFERS** (comment at the block): *inactive label = gray.7 instead of §6c gray.5*
(labels render too dark) and *hover = black instead of §6c gray.7*. Those deferrals (Task 489 boundary — "needs
`[data-active]:not()` selectors beyond a trivial styles block") are the visible failure the owner sees. **Close
them:** inactive label `gray.5`, hover `gray.7`, active label `gray.9` (already set). Use `input-chrome.css`-style
stable-class CSS selectors if `theme.styles` inline cannot express the `:not([data-active])` state (see
`mantine-responsive-design-system.md` §18 — `theme.styles` is inline-only, no state selectors). Also re-verify item
radius (`rounded-md` 6 vs container `rounded-lg` 8), item padding (`px-3 py-2`), and content-width-on-desktop.

## Scope C — audit method (do BEFORE any further fix; clause 16)

For **each** of the 23 primitives, produce a row in a delta table in the session log:

| Primitive | §-row in tailadmin-style-reference | Rendered story value | Zip/reference value | Match? | Fix (file:line) or N/A |

Method per primitive: render the story (via `screenshots:assert` / Storybook) at a representative `≥640` + a
`320` cell × en, and compare **border color, radius, focus ring, shadow, font family/size/weight, density/padding,
active/hover/disabled state colors** against the zip component (extract live or from the zip HTML/CSS as §6x rows
already do — never eyeball-guess a value; if a needed value is not yet an authoritative §-row, extract it into
`tailadmin-style-reference.md` first, cite the source). Fix every mismatch in `theme.ts` (or `input-chrome.css`
for state selectors) — canonical single-source, no per-story overrides, update every consumer (Note 14 global-change
rule). If a primitive matches, record "✅ match" with the checked attributes — a clean row is a valid outcome.

The 23: Alert, Avatar, Badge, Button, Card, Checkbox, Drawer, DropdownMenu, Label, Modal, NavigationMenu,
Pagination, PasswordInput, Popover, Progress, Radio, SegmentedControl, Select, Switch, Table, Tabs, TextInput,
Textarea, Tooltip, Combobox. (Prior Sprint-40 tasks already conformed several — re-verify, don't assume; record
"already conformed by Task N, re-verified ✅".)

### STOP-and-ASK
If any primitive's correct TailAdmin value is genuinely ambiguous (no zip precedent, or a project override like the
segmented-chips-vs-Filter-dropdown open question at §6c line 129), STOP and ASK the owner — do not invent or silently
pick. Log the question and pause that primitive.

## Pre-read (rule-index → UI / layout / component task)

- `docs/agent-contract.md` (1–16) + `docs/backlog.md` + `docs/critical-flow-registry.md` (scan; primitive chrome touches no registry flow — confirm & note).
- 🔴 `docs/tailadmin-style-reference.md` (ALL §6x rows) + `demo_tailadmin_com.zip` — style source of truth.
- `docs/mantine-responsive-design-system.md` §7, §12, §16, **§18 (theming pitfalls — MANDATORY before any theme/input styling: `theme.styles`=inline only, state selectors via `input-chrome.css`, `data-error` not `data-invalid`, disabled `:disabled`/`[data-disabled]`/`:has`, `var()` fallback inside parens)**.
- `docs/ui-rules.md`, `docs/component-rules.md`, `docs/qa-rules.md`, `docs/storybook-governance.md` §14.

## Current behavior to preserve

Every primitive's existing correct chrome, every story's state sections (resting/error/disabled/loading/empty/
long-label), single `Default` export, `skipCanvas`+`fullscreen` params, `storyT()` i18n with sq/en/uk/it parity,
the `MantineStoryShell` wrapper (as changed by Task 540), and the Progress primitive (Scope A). Do NOT remove any
control or state section. Do NOT introduce per-story chrome overrides — fixes live in the canonical `theme.ts` /
`input-chrome.css` single source.

## Positive + Negative flow

- **Positive:** each primitive story, at `≥640` and `320` × sq/en/uk/it, renders visibly matching its zip reference (border/radius/focus/shadow/font/density/state colors). SegmentedControl inactive labels are gray.5, hover gray.7, active gray.9 on white pill with shadow-xs.
- **Negative:** (a) uk@320/375/390 — long labels wrap, no clip, no h-scroll (mobile gate). (b) disabled/error/focus states each match §6e/§6c etc. — a disabled render where label/icon do NOT dim with the field = FAIL (owner P0 2026-06-28). (c) no primitive regressed by another's fix (global-change rule — check all consumers). (d) Progress (Scope A) unchanged.

## Gates to close (clauses 12 + 13 + 16) — HELD until ALL green

- `npm run screenshots:assert -- --mantine-only` full matrix, **uk@320/375/390 mandatory**, `≥640` cells for every touched primitive, side-by-side vs the zip reference for each fix.
- Planted-violation FAIL transcript (prove the gate catches a real chrome/overflow break).
- `tsc --noEmit`, `check:stories`, `check:i18n`, `check:mojibake`, `check:design-tokens:strict`, `check:file-integrity` all green. tsc/build green is baseline, never style proof.
- Regression (clause 15): no registry flow touched — confirm & state.

## Acceptance criteria

1. SegmentedControl §6c deferrals closed (inactive gray.5, hover gray.7, active gray.9, radius/padding/border/shadow verified); rendered proof side-by-side with the zip. (Scope B)
2. Delta table present for **all 23** primitives with per-attribute comparison + cited reference values; every mismatch fixed in the canonical single source, every match recorded. (Scope C)
3. Every fixed value cites a §-row / zip token; any new value extracted into `tailadmin-style-reference.md` first. Zero invented numbers. (clause 16)
4. Rendered `--assert` matrix (uk@320/375/390 + ≥640) + planted-violation FAIL transcript attached; all light gates green.
5. No control/state section removed; Progress (Scope A) unchanged; no per-story chrome override; all consumers updated (Note 14).
6. Session log: Files-Changed table (one row/path + rationale), AC-by-AC self-audit, `Self-validation: …` line. **Do NOT run git.**

## Commit hand-off (HELD)

Do NOT emit `git add`/`git commit`. This task is HELD — the orchestrator reviews the real diff + rendered matrix,
then emits **separate explicit-path commit commands per logical change** (Progress / SegmentedControl / each other
primitive group) so the folded work still lands as clean atomic commits. Owner runs them in PowerShell after the
native gate.
