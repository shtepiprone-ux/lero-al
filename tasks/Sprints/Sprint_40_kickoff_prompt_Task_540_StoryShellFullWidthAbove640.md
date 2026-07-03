# Task 540 — `MantineStoryShell` full-width above 640 (+ edge gutter) for all primitive stories except Table & Tabs

> **Sprint 40 (TailAdmin Conformance — All Primitives). Owner P0, 2026-07-03.**
> **Executor:** Sonnet 4.6. **Type:** Storybook / story-shell layout (NOT product code).
> **Status at handoff:** OPEN. Sequence BEFORE the Task 539 audit (539 re-verifies against this final layout).

## Owner directive (verbatim intent, 2026-07-03)

Reviewing the rendered `Mantine/Primitives/*` stories, the owner rejected the current `≥640` render on two points:

1. **Full-width above 640 is ignored.** Above 640 the primitive demo must render **full-width**, not the narrow
   centered 1536px column Task 536 introduced. This applies to **all Mantine primitive stories EXCEPT Table and
   Tabs** (owner answer, 2026-07-03: *"всі Mantine Primitive Stories, окрім таблиць і табів"*).
2. **Container edge gutters are ignored.** The content currently runs to the canvas edges; it must keep a
   consistent gutter from the screen edges at every breakpoint.

## 🔴 This is an explicit OWNER OVERRIDE of §6m — document it, do NOT let the clause-16 gate reject it

Task 536 capped the story column at `1536px` (`--breakpoint-2xl`) centered, and `docs/tailadmin-style-reference.md`
§6m records that as matching TailAdmin's own showcase wrapper (`mx-auto max-w-(--breakpoint-2xl)`). **The owner is
now overriding that for the STORY-HARNESS layer only** — the story canvas must present primitives full-width to
stress responsive behavior across the whole viewport, rather than TailAdmin's capped showcase column. This is a
harness decision, analogous to the brand-color (`#EC5447`) override of TailAdmin's `#465fff`. It does **NOT** change
any product surface — product surfaces still follow TailAdmin exactly.

**You MUST update §6m** (`docs/tailadmin-style-reference.md`) and `docs/mantine-responsive-design-system.md` §8.1 to
record this override with its date + rationale, so the TailAdmin conformance gate (clause 16) reads "full-width story
harness = owner-approved override," not "deviation → reject." Cite this task.

## Pre-read (rule-index → UI / layout / Storybook task)

- `docs/agent-contract.md` (clauses 1–16) + `docs/backlog.md` + `docs/critical-flow-registry.md` (scan; story-shell touches no registry flow — confirm & note).
- 🔴 `docs/tailadmin-style-reference.md` §6m (the row you are overriding) + `demo_tailadmin_com.zip` (gutter source of truth).
- `docs/mantine-responsive-design-system.md` §7 (mobile gate), §8 (Mantine Storybook proof path), §16 (acceptance gates), §18 (theming pitfalls).
- `docs/storybook-governance.md` (§14 enforced gates).
- `docs/ui-rules.md`, `docs/component-rules.md`, `docs/qa-rules.md`.
- Read the current shell: `src/stories/mantine/_MantineStoryShell.tsx` (Task 536).

## Current behavior to preserve

`src/stories/mantine/_MantineStoryShell.tsx` currently wraps every `Mantine/Primitives/*` story:

- `<640`: transparent bg, no card, `px/py = md` (16px) gutter, **full-bleed full-width** (P0 mobile gate). **PRESERVE byte-for-byte — zero mobile regression.**
- `≥640`: gray-0 page bg, content `maw={{sm:1536}}` centered (`mx="auto"`), white card chrome (`1px solid gray-2`, radius `2xl`, no shadow), `px/py = xl`.

Preserve: the `<640` path exactly; the gray page bg + white card chrome at `≥640`; overlay triggers-in-shell / portal-unaffected behavior; the single-source pattern (one shell consumed by all 23 stories, no per-story duplication).

## Required after-behavior

Add a width mode to `MantineStoryShell` (e.g. prop `width?: 'full' | 'constrained'`, **default `'full'`**):

- **`'full'` (default — 21 primitive stories):** at `≥640`, drop the `1536` cap → content spans the **full viewport width minus a symmetric edge gutter**. Keep gray page bg + white card chrome, but the card is full-width-minus-gutter (no `mx-auto` centering of a narrow column). **Gutter = the TailAdmin-cited value: 16px `<768`, 24px `≥768`** (`p-4 md:p-6` / §6m measurement — cite it; do not invent a new number). No max-width cap (owner: full-width).
- **`'constrained'` (Table + Tabs only):** keep Task 536's current `≥640` behavior exactly (1536 centered column). `Table.stories.tsx` and `Tabs.stories.tsx` pass `width="constrained"`.
- `<640` path is identical in BOTH modes (unchanged from today).

### STOP-and-ASK (do NOT guess — ask the owner in the session log and pause)

1. If keeping the white card chrome + gray page bg while full-width looks wrong to you at very wide viewports (e.g. 2560), STOP and ASK whether the owner wants card chrome retained or a plain full-bleed canvas at `≥640`.
2. If the Table/Tabs "constrained" exemption is ambiguous for any specific story (e.g. a story mixing a table with other primitives), STOP and ASK rather than assume.

## Positive flow (happy path)

1. Open any default primitive story (e.g. `Progress`, `Button`, `SegmentedControl`) at `≥640` (768/1024/1440/1920/2560).
2. Demo renders full-width: card spans viewport minus the 16/24px gutter, no narrow centered column, no content touching the raw screen edge.
3. Open `Table` and `Tabs` stories at the same widths → they stay in the constrained 1536 centered column (exemption honored).
4. Switch toolbar locale (sq/en/uk/it) and viewport (275→1920) → layout reflows correctly, gutter constant, no h-scroll.

## Negative flow (every off-happy-path branch)

- **`<640` (320/375/390) — regression guard:** every story stays full-bleed full-width exactly as before this task (byte-identical `<640` path). uk@320/375/390 mandatory: long uk/it labels wrap, no clip, no horizontal scroll.
- **Table/Tabs at `≥640`:** must NOT become full-width (exemption). If they do, that is a FAIL.
- **Overlay stories (Drawer/Modal/Popover/DropdownMenu/NavigationMenu/Select/Tooltip):** trigger sits in the full-width shell; the portal-rendered popup/bottom-sheet is unaffected — re-verify the `<640` bottom-sheet contract still passes and the `≥640` popup is not clipped by the shell.
- **Empty/loading/error/disabled state sections** inside each story render unchanged.
- **Very wide viewport (2560):** content is full-width minus gutter with no runaway line lengths breaking layout (if it does → STOP-and-ASK #1).

## Mobile <640 full-width gate (clause 11)

Unchanged and MUST stay green — the `<640` shell path is byte-identical to today. Prove it: rendered `<640` cells (320/375/390 × sq/en/uk/it) identical to pre-task.

## TailAdmin conformance gate (clause 16)

The full-width override is owner-approved (above) — but the **gutter value (16/24px) must cite §6m / the zip `p-4 md:p-6`**, the card chrome (gray-2 border, 2xl radius, no shadow) and gray-0 bg are unchanged §6/§6m values. Zero invented numbers. Update §6m + §8.1 to record the override.

## Rendered-evidence gate (clause 12 + 13) — REQUIRED to close

- Machine-produced `npm run screenshots:assert -- --mantine-only` PNG/JSON matrix, **uk@320/375/390 mandatory**, plus `≥640` cells (768/1024/1440/1920/2560) showing full-width for the 21 + constrained for Table/Tabs.
- A **planted-violation FAIL transcript** proving the gate is real (e.g. force a narrow `maw` and show the assert catches it — note the Task 536 finding that the gate is a control-fills-container check; use a `miw`-overflow plant that genuinely FAILs, per Task 536's Attempt 2).
- Green: `tsc --noEmit`, `check:stories`, `check:i18n`, `check:mojibake`, `check:design-tokens:strict`, `check:file-integrity`. tsc/build green is baseline, never style/layout proof.

## Regression coverage (clause 15)

Story-shell layout touches no `docs/critical-flow-registry.md` product flow — confirm via scan and state so in the log. No product regression test required; the rendered gate is the coverage.

## Acceptance criteria (each verifiable in the diff / rendered matrix)

1. `MantineStoryShell` gains a `width` mode, default `'full'`; `≥640` full path drops the 1536 cap, full-width minus 16/24px gutter, card chrome + gray bg retained. (Positive 1–2)
2. `Table.stories.tsx` + `Tabs.stories.tsx` pass `width="constrained"`; both keep Task 536 behavior. (Positive 3, Negative Table/Tabs)
3. `<640` path byte-identical to pre-task; mobile gate green. (Negative regression guard)
4. §6m + §8.1 updated to record the owner override with date + rationale + this task cite; gutter cites the zip. (clause 16)
5. Rendered `--assert` matrix (uk@320/375/390 + ≥640) attached + planted-violation FAIL transcript; all light gates green. (clauses 12/13)
6. No primitive's chrome (border/radius/focus/shadow/font) changed — layout width only. Overlay portals unaffected.
7. Session log: Files-Changed table (one row/path + rationale), AC-by-AC self-audit, `Self-validation: …` line. **Do NOT run git** — the orchestrator emits commits.

## Commit hand-off

Include the Files-Changed table; do **not** emit `git add`/`git commit`. The orchestrator reviews the real diff + rendered matrix and emits explicit-path commit commands. This task is part of the held Sprint-40 conformance batch (see Task 539) — the owner runs commits in PowerShell.
