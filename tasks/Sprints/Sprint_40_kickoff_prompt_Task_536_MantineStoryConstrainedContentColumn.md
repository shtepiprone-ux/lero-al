# Task 536 — Constrain Mantine story canvas to a TailAdmin content column (kill the >640 "rubber" render) + theme.ts intrinsic-width audit

> **Sprint 40 — TailAdmin conformance (ALL primitives). Owner P0 (agent-contract clause 16).**
> **Executor: Sonnet 4.6.** Read the Pre-read list, then implement EXACTLY this scope. Do NOT invent
> architecture; if anything below is genuinely ambiguous, **STOP and ASK the orchestrator** — do not guess.
> **You do not run git.** End with a "Files Changed" table; the orchestrator emits commit commands.

## Why this task exists (owner report, 2026-07-03)

Every Mantine primitive story renders with `parameters.skipCanvas: true` + `layout: 'fullscreen'` and only a
bare `<Box p="xl">` wrapper. That adds padding but **no max-width**, so at **≥640px the primitive stretches
edge-to-edge across the whole viewport** ("резинова" / rubber). TailAdmin never does this — its component
showcase renders each primitive inside a **constrained content column**: a white card
(`rounded-2xl border border-gray-200 bg-white shadow-theme-xs`) on a **gray page background**, capped to a
content-column max-width. The owner has repeatedly found visual inconsistencies from this and wants it fixed
for **ALL 23 Mantine primitive stories**, not just Tabs.

Owner decisions (2026-07-03):
1. **Width model = a shared, constrained TailAdmin content column** (single-source wrapper), NOT per-primitive
   ad-hoc widths.
2. **Scope = stories + `theme.ts` primitive defaults** — also correct any primitive whose *intrinsic* default
   width diverges from TailAdmin (audit-driven; change only where justified and documented).

Existing partial intent already in the docs (align to it, do not contradict):
- `docs/tailadmin-style-reference.md` lines ~110–123: Tabs are **content-width on desktop (NOT stretched)**,
  full-width only `<640`; `grow` unconditional is the "stretched-tabs bug". (theme.ts line ~315 already sets
  Tabs `fullWidth` NOT set — good; do not regress it.)
- `docs/mantine-responsive-design-system.md` §8.1: "Full-bleed is NEVER acceptable for page-content stories."
  §8.1 added a responsive **gutter** (`px={{ base:'md', sm:'xl' }}`) but **no width cap** — that is the gap
  this task closes.

## Pre-read (UI/layout/component task — from `docs/rule-index.md`)

Always required: `docs/agent-contract.md`, `docs/backlog.md`, `docs/critical-flow-registry.md` (scan — this task
does not touch a registered runtime flow; confirm and note it).
Required:
- 🔴 `docs/tailadmin-style-reference.md` + `demo_tailadmin_com.zip` (STYLE SOURCE OF TRUTH — clause 16)
- `docs/mantine-responsive-design-system.md` (read §7 mobile gate, §8 + **§8.1** story canvas rules, §8.2, §18 theming pitfalls)
- `docs/ui-rules.md`, `docs/component-rules.md`, `docs/qa-rules.md`
- `docs/storybook-governance.md` §14 (enforced story gate) — this task touches `*.stories.tsx`

## Source-of-truth extraction FIRST (clause 16 — do this BEFORE writing any code)

There is **no authoritative row** for the showcase content-column shell yet. Before implementing, **extract it
from `demo_tailadmin_com.zip`** (its `css/style.css` tokens + the UI-Elements page HTML — the pages that show
each component in a white card on a gray page) into a **new `docs/tailadmin-style-reference.md §6m` row**:
- page background color token (gray ramp),
- card chrome (bg, border color, radius, shadow, padding) — reconcile with the existing card rows (§ container
  white / `#e4e7ec` / radius / `shadow-theme-xs`); cite them,
- the **content-column max-width** the showcase uses (the measured cap; cite the exact value — do NOT invent a px).

If the zip does not contain an unambiguous content-column max-width, **STOP and ASK** the orchestrator for the
target value rather than guessing. Every value in §6m must trace to a zip token / measured class.

## Current behavior to preserve (do NOT regress)

- **Mobile <640 P0 gate:** every text control, Tabs list, Select/Combobox trigger, input, button, CTA, and every
  popup (Drawer/Modal/Popover/DropdownMenu/NavigationMenu/Select-open/Tooltip) is **full-width / full-bleed
  bottom sheet** at `<640`. This task must NOT weaken any of that.
- All existing story STATES (resting/closed · error · disabled · loading · empty · long-label), the single
  `Default` export per group, `storyT()` i18n, `skipCanvas: true` + `layout:'fullscreen'`, toolbar-driven
  viewport/locale proof (§8/§8.2), no `Ukrainian*`/per-viewport exports.
- Tabs staying content-width (theme.ts) and every other primitive's existing chrome (border/radius/focus/shadow/
  font) already conformed in Tasks 528–535 — do not touch chrome; this task changes **layout width only**.

## Required after-behavior (concrete)

### A. Shared story shell (single-source) — applies to all 23 primitive stories
1. Create ONE shared wrapper component (single source of truth — no per-story copy), e.g.
   `src/stories/mantine/_MantineStoryShell.tsx`, that renders children inside the TailAdmin content column from
   §6m: **gray page background**, a **centered content column capped to the §6m max-width at ≥640**, and (for
   page-content primitives) the TailAdmin **white card chrome** around the demo. Consume `storyT`/locale as
   needed but the shell itself renders no user-facing strings (no hardcode).
2. **Responsive rule (P0-safe):** at **`<640` the column is full-bleed edge-to-edge** (respecting the canonical
   page gutter, mirroring §8.1's `px={{ base:'md', sm:'xl' }}`); at **`≥640` it is capped to the §6m max-width
   and centered**. The primitive fills the column width (that IS TailAdmin — inputs are 100% *within* the
   column), it just no longer fills the whole viewport.
3. Replace the bare `<Box p="xl">` (and equivalent ad-hoc wrappers) in **all 23** `src/stories/mantine/primitives/*.stories.tsx`
   with this shared shell. Keep each story's STATE sections and i18n intact — only the outer layout wrapper changes.
4. **Overlay primitives (Drawer, Modal, Popover, DropdownMenu, NavigationMenu, Select, Tooltip):** the **trigger**
   sits inside the content column; the **popup/sheet itself is unchanged** (bottom sheet `<640`, anchored `≥640`
   per the existing overlay foundation). Do NOT put the bottom sheet inside the column. If any specific overlay's
   correct placement is ambiguous, **STOP and ASK**.

### B. theme.ts intrinsic-width audit (`src/design-system/mantine/theme.ts`)
5. Audit each primitive's `theme.components.*` default for an intrinsic width that diverges from its TailAdmin
   §-row (e.g. an unconditional `grow`/`fullWidth`/`w:'100%'` that TailAdmin renders content-width). For **each**
   primitive, record in the session log: `primitive → current default → TailAdmin §-row → change? (Y/N + why)`.
6. Change ONLY where a genuine divergence exists, and preserve the `<640` full-width P0 behavior in every change
   (use `{ base:'100%', sm:'auto' }`-style responsive width, never a flat desktop-only width that breaks mobile).
   Tabs already correct — do not touch. If the audit finds nothing to change beyond the shell, that is a valid
   outcome — the audit table is the deliverable, changes are optional per-row.

## Positive flow (happy path)
- **Actor:** owner viewing Storybook. **Precondition:** Storybook running, Mantine primitive story open.
- Step 1 — open any `Mantine/Primitives/*` story at a **≥640** viewport (toolbar 768/1024/1440/1920).
  → the primitive renders inside a **centered content column on a gray page background**, capped to the §6m
  max-width, in TailAdmin card chrome — **not** stretched edge-to-edge.
- Step 2 — switch the toolbar to **<640** (320/375/390). → the column goes **full-bleed** and the control is
  **full-width** (P0 gate intact). No horizontal scroll at 320.
- Step 3 — switch locale (en/uk/sq/it) on the toolbar. → labels translate via `storyT`, long uk labels wrap
  (no clip, no overflow) within the column.
- **Success state / post-conditions:** every primitive story matches the TailAdmin showcase at ≥640 and the P0
  full-width behavior at <640; `check:stories`, `check:i18n`, lint, tsc all green; the rendered `--assert`
  matrix passes with the new constrained widths.

## Negative flow (every off-happy-path branch)
- **Long uk/it label at 320 in the column:** label wraps (`whitespace-normal break-words`); NO clip, NO
  horizontal scroll. (If any control clips → task failure.)
- **Overlay trigger clicked at <640:** popup still opens as full-width bottom sheet (top-only radius, drag
  handle, ≤90dvh, closes on backdrop + Esc); the shell does NOT trap or reshape the sheet.
- **Overlay trigger clicked at ≥640:** popup still opens anchored; the content-column cap does NOT clip the
  anchored popup (popups render in a portal — verify no new clipping from the column's overflow).
- **Empty/loading/error/disabled STATE sections** (where a primitive has them): each still renders correctly
  inside the column; none removed.
- **Missing §6m value:** if the zip lacks an unambiguous content-column max-width → STOP and ASK; do NOT invent.
- **theme.ts change would break <640 full-width:** forbidden — revert to responsive `{ base:'100%', sm:… }`.

## 🔴 Mobile <640 full-width gate (OWNER P0) — MANDATORY
Every in-scope primitive stays **full-width at `max-sm`** and every popup a **full-bleed bottom sheet at <640**.
The content-column cap applies **only ≥640**. ≥44px touch targets; sq/en/uk/it labels wrap. Any text/container
surface non-full-width at <640 = REJECT. No exemptions in this task (all primitives are text/container surfaces).

## 🔴 TailAdmin conformance gate (OWNER P0, clause 16) — MANDATORY
§6m extracted from the zip BEFORE implementing; every color/px/radius/shadow/max-width traces to a §-row or zip
token (ZERO invented values); brand stays `#EC5447`. Rendered proof is **side-by-side vs the zip showcase** — the
Mantine story column must visibly match the TailAdmin UI-Elements card-on-gray layout at the canonical
breakpoints × sq/en/uk/it. `tsc=0`/build-green is NOT style proof.

## 🔴 Rendered verification matrix (clause 12) + Storybook gate (clause 13) — MANDATORY
- Rendered matrix (breakpoints × sq/en/uk/it) with **uk@320/375/390 mandatory** for a representative set that
  MUST include: Tabs, TextInput, Button, Select, Table, plus one overlay (Drawer or Popover) and one compact
  primitive (Badge/Avatar). Machine-produced `responsive-screenshots --assert` PNG/JSON — not self-reported.
- `npm run check:stories` green: no `parameters.layout:'centered'|'padded'`, no raw `<button>/<input>/<select>`,
  no hardcoded strings, no `Ukrainian*`/per-viewport exports. Paste a planted-violation FAIL transcript proving
  the gate is real.

## Self-validation (Note 18) — before writing "complete"
`npx tsc --noEmit` → 0 errors; `npm run build` if non-trivial; AC-by-AC self-audit table (each AC → file:line or
runtime step, ✅/❌, citing Positive/Negative flows by name); read back every written file (clause 14: 0 NUL, parses,
not truncated) and paste the green integrity transcript; final "Self-validation: tsc=0 · build=passes · AC=all
green · runtime uk PASS · scope=clean" line.

## Acceptance criteria (each maps to a flow)
- [ ] AC1 — §6m row added to `tailadmin-style-reference.md`, every value cited to a zip token/class (Extraction).
- [ ] AC2 — single-source `_MantineStoryShell` created; consumed by ALL 23 primitive stories; no per-story
      duplicate of the column (Positive step 1; canonical-first).
- [ ] AC3 — ≥640 renders the constrained gray-page + capped card column; <640 full-bleed full-width
      (Positive steps 1–2; Mobile gate).
- [ ] AC4 — overlay triggers in-column, popups unchanged (bottom sheet <640 / anchored ≥640), no column clip
      (Negative: overlay branches).
- [ ] AC5 — theme.ts intrinsic-width audit table present; only justified changes; every change preserves <640
      full-width; Tabs untouched (Scope B).
- [ ] AC6 — rendered `--assert` matrix (uk@320/375/390 incl.) + side-by-side TailAdmin proof; `check:stories`/
      `check:i18n`/lint/tsc green + planted-violation FAIL transcript (clauses 12/13/16).
- [ ] AC7 — no state/control removed from any story; all STATE sections intact (Negative: state branches).
- [ ] AC8 — session log has Files Changed table + self-validation block; NO `git add`/`git commit` emitted by Sonnet.

## Files likely touched (confirm in the Files Changed table)
- `docs/tailadmin-style-reference.md` (new §6m)
- `src/stories/mantine/_MantineStoryShell.tsx` (new, single-source)
- `src/stories/mantine/primitives/*.stories.tsx` (all 23 — swap outer wrapper only)
- `src/design-system/mantine/theme.ts` (only if the audit justifies a change)
- `docs/mantine-responsive-design-system.md` §8.1 (add the width-cap rule referencing §6m)
- `docs/backlog.md` + `docs/sessions/2026-07-03-task536-*.md`
