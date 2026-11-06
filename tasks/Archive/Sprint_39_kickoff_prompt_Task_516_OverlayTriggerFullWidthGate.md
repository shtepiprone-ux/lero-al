# Task 516 — Overlay trigger width: mobile=full-width / desktop=natural (Batch C fix; corrects 513 + 515)

> **Program:** `docs/mantine-tailadmin-migration-tracker.md` → Phase 1 → Batch C overlays.
> **Executor:** Sonnet 4.6. **Orchestrator:** Opus (reviews diff + clicked-open rendered matrix at 320/375/390 × 4 locales).
>
> **Owner decision (2026-07-01):** the **component GUARANTEES** the trigger width — the trigger must be full-width at
> <640 for text triggers and natural/content width at ≥640, WITHOUT each consumer having to remember it. Icon-only kebab
> (⋮) triggers are the documented exemption via an explicit opt-out prop.

## Why this task (root cause — verified by orchestrator on rendered proof, 2026-07-01)
On the Task 515 (DropdownMenu) and Task 513 (Popover) rendered proof the trigger button is **mirrored** vs the P0 gate:
content-width at <640, full-width at ≥640 — the exact inverse of clause 11. Confirmed mechanism:

1. **Desktop (≥640) stretches** — the Mantine `Stack` wrapping every primitive story defaults to `align: "stretch"`
   (`@mantine/core` Stack `defaultProps.align="stretch"`). On desktop, `MantineDropdownMenu`/`MantinePopover` render the
   bare `<Button>` directly through `Menu.Target`/`Popover.Target`, so the Button is a direct flex child of that Stack and
   stretches edge-to-edge.
2. **Mobile (<640) does NOT stretch** — the mobile path wraps the trigger in
   `<Box component="span" style={{ display:'inline-block' }}>` (identical in `MantineDropdownMenu.tsx:71-77` and
   `MantinePopover.tsx:74`). The span absorbs the stretch; the `<Button>` inside stays content-width, left-aligned.

Net: bare Button stretches on desktop, wrapped Button stays small on mobile → mirror of the P0 gate. It reproduces on
**both** patterns that use the span-onClick wrapper (DropdownMenu + Popover — the only two). This is a shared-pattern
defect, so the fix lives in those two components (and, if the wrapper is centralised, in the Task 514 source area) — NOT
in a single story.

## Pre-read (UI / overlay task — from `docs/rule-index.md`)
**Always:** `docs/agent-contract.md` (clauses 11–12 = the mobile full-width gate), `docs/backlog.md`,
`docs/critical-flow-registry.md` (SCAN — this is foundation+story only, no product surface).
**Required (FIRST READ):** `docs/mantine-responsive-design-system.md` — §7 mobile gate, §8.2 (one section per STATE,
overlays open by real click — NO `defaultOpened`), §12 patterns, §18 CSS pitfalls. Then `docs/ui-rules.md` (§15a mobile
gate), `docs/component-rules.md` (canonical-first, Task 426), `docs/qa-rules.md`, `docs/storybook-governance.md`.
**Study before coding (REUSE, do not gratuitously modify):**
- `src/design-system/mantine/patterns/responsiveBottomSheet.tsx` (Task 514 single source — do not change bottom-sheet mechanics).
- `src/design-system/mantine/patterns/MantineDropdownMenu.tsx` + `MantinePopover.tsx` (the two consumers to fix).
- `src/stories/mantine/primitives/DropdownMenu.stories.tsx` + `Popover.stories.tsx` (the proof stories).

## Scope (exactly this — no more)
1. **Trigger-width guarantee in `MantineDropdownMenu` + `MantinePopover`:**
   - At **<640** the trigger renders **full-width** (edge-to-edge within its container) for text triggers — the mobile
     wrapper must be a block-level, `width:100%` container AND the trigger button inside it must fill that width (e.g.
     clone the trigger to inject `fullWidth`, or an equivalent width:100% mechanism). The small content-width span is the bug.
   - At **≥640** the trigger renders at **natural/content width** regardless of a stretch-aligned parent — i.e. the
     component must NOT let a parent `Stack align:"stretch"` stretch the desktop trigger (wrap the desktop `Menu.Target`/
     `Popover.Target` in an inline-flex/inline-block/`w:max-content` container, or equivalent).
   - **Icon-only opt-out:** add an explicit prop (e.g. `iconOnlyTrigger?: boolean` / `fullWidthTrigger?: boolean`,
     default = full-width ON) so kebab (⋮) icon triggers stay compact at <640 per the clause-11 icon-only exemption.
     Name/shape is your call, but it MUST be one consistent prop across BOTH components. If the cleanest place for this
     logic is the shared Task 514 source rather than duplicated in each consumer → **STOP and ASK** before editing the source.
2. **Proof in BOTH stories** (`DropdownMenu.stories.tsx`, `Popover.stories.tsx`): the existing distinct-STATE sections
   stay (`trigger` + `disabled`; §8.2 — NO per-viewport sections, NO `defaultOpened`). Add a distinct-state section OR a
   second trigger in the resting section that demonstrates the **icon-only exemption** (a compact ⋮ trigger that stays
   compact at <640), so the matrix can prove both the text-trigger full-width path and the icon-only exempt path. All
   labels/aria via `storyT()` with sq/en/uk/it parity.
3. **Docs:** note the trigger-width contract (text = full-width <640 / natural ≥640; icon-only opt-out) in the overlay
   section of `docs/mantine-responsive-design-system.md`. No tracker phase flip (513/515 already ✅ on their own scope; this
   is a corrective).

**OUT OF SCOPE:** NavigationMenu (P1.20), Tooltip (P1.22); the bottom-sheet mechanics inside `responsiveBottomSheet.tsx`
(open/close/DragHandle/Drawer — leave them); MantineSelect (input, different mechanism); any product surface; new
bottom-sheet code.

## 🔴 STOP-and-ASK triggers
- If cloning the trigger to inject `fullWidth` is unsafe because a trigger may not be a Mantine Button (arbitrary
  ReactNode) → **STOP and ASK** (do not silently wrap in a way that breaks non-Button triggers).
- If making the desktop trigger natural-width requires changing the shared Task 514 source (not just the two consumers) →
  **STOP and ASK** before touching `responsiveBottomSheet.tsx`.
- If the icon-only detection can't be inferred safely and needs a different prop contract than proposed → **STOP and ASK.**

## Current behavior to preserve
- Open/close mechanics (span-onClick mobile → `openDrawer()`; anchored Menu/Popover ≥640), item chrome, separators,
  destructive color, disabled no-op, backdrop+Esc, focus return — ALL unchanged. This task changes ONLY trigger WIDTH.
- The Task 514 single source and `MantineDialogDrawerPattern` remain UNCHANGED (unless the owner approves via STOP-and-ASK).
- `grep "function DragHandle" src/design-system/mantine` STILL = ONE match after this task.

## Required after-behavior
- **<640, text trigger:** trigger button spans the full container width, edge-to-edge, ≥44px tall; label wraps sq/en/uk/it,
  no clip, no h-scroll at 320.
- **<640, icon-only trigger (opt-out set):** trigger stays compact (exempt) — documented.
- **≥640:** trigger renders at natural/content width even inside a `Stack align:"stretch"` parent; anchored Menu/Popover unchanged.
- Same behavior for BOTH `MantineDropdownMenu` and `MantinePopover`.

## Positive flow (happy path)
Actor at 320–390px with a text trigger. 1) Sees the trigger filling the full width (≥44px). 2) Taps it → full-width bottom
sheet opens (unchanged mechanics). At ≥640 the SAME trigger renders at natural width and opens the anchored menu/popover.

## Negative flow (every off-happy-path branch)
- **Icon-only trigger (opt-out=true)** → compact at <640, does NOT stretch; still opens the sheet on tap.
- **Disabled trigger** → no-op on both paths; width rule still applies to its resting render (full-width text / compact icon).
- **Parent is `Stack align:"stretch"` (the story case)** → desktop trigger still renders natural width (not stretched).
- **Parent is a normal block/flex-start container** → mobile trigger still full-width; desktop still natural.
- **Long uk label** → wraps inside the full-width trigger at 320, no clip, no h-scroll.
- **Non-Button trigger ReactNode** → no crash; if full-width can't be guaranteed for it, that path is the STOP-and-ASK above.
- **SSR / first paint** → `useMediaQuery` first render false → desktop (natural-width) trigger on SSR; no flash (documented caveat).

## 🔴 Mobile <640 full-width gate (clauses 11–12)
Text triggers = full-width edge-to-edge at <640; icon-only = the ONLY exemption, explicitly opted-out and documented.
≥640 = natural width. ≥44px touch target; labels wrap; no h-scroll at 320. This is the whole point of the task — verify with
rendered evidence, not tsc.

## 🔴 Zero hardcode / canonical-first (Task 426)
No raw colors/spacing/radius px; width via Mantine props / tokens (`fullWidth`, `w`, `maw`, `w:max-content` etc.), not raw
CSS px. No hardcoded strings — `storyT()` ×4, any `aria-label` via `t()` with sq/en/uk/it parity. No raw `<button>`. No
duplicated `DragHandle`/`<Drawer>` — grep stays ONE match.

## Rendered proof matrix (clause 12 + §8.2 — MANDATORY, produced from ACTUAL renders)
Rows = `text trigger resting` · `text trigger clicked → open` · `icon-only trigger resting` · `disabled`; columns =
**uk@320 · uk@375 · uk@390 · en@320 · sq@320 · it@320** (uk@320/375/390 mandatory), for **BOTH** DropdownMenu and Popover
stories. Per cell confirm: text trigger FULL-WIDTH at <640 and NATURAL width at ≥640 (capture a ≥640 cell too, e.g.
en@768/1024, to prove no-stretch); icon-only trigger compact at <640; long uk label wraps; no h-scroll@320. `tsc=0`/gates
are BASELINE, never proof.

## Acceptance criteria
1. At <640 the text trigger of BOTH `MantineDropdownMenu` and `MantinePopover` renders full-width edge-to-edge (≥44px);
   verifiable in the diff (block+`width:100%` wrapper + trigger fills it) AND in the rendered matrix. *(Scope 1; Positive flow 1)*
2. At ≥640 the trigger renders natural/content width even inside a `Stack align:"stretch"` parent; verifiable in the diff
   (desktop Target wrapped so it can't stretch) AND in a ≥640 rendered cell. *(Scope 1; Negative flow: Stack-stretch)*
3. A single consistent icon-only opt-out prop exists on BOTH components (default = full-width ON); icon-only trigger stays
   compact at <640 in the rendered matrix. *(Scope 1; clause-11 exemption)*
4. Open/close mechanics, item chrome, separators, destructive, disabled no-op, backdrop+Esc, focus return — UNCHANGED
   (diff shows width-only changes to the trigger wrappers). *(Current behavior to preserve)*
5. `grep "function DragHandle" src/design-system/mantine` = ONE match; `responsiveBottomSheet.tsx` bottom-sheet mechanics
   unchanged (or changed ONLY under an approved STOP-and-ASK). *(canonical-first; Task 514 integrity)*
6. Both stories keep distinct-STATE sections only (NO per-viewport, NO `defaultOpened`) and add the icon-only exemption
   demo; clicked-open + resting rendered matrix complete incl. uk@320/375/390 and a ≥640 no-stretch cell, for BOTH stories. *(Scope 2; clause 12; §8.2)*
7. Docs trigger-width contract row added; locale parity sq/en/uk/it; no consumer API break (new prop is optional, default
   preserves the corrected full-width behavior). *(Scope 3; clause 7)*
8. Gates green: `tsc=0`, `check:stories`, `check:i18n`, `check:design-tokens`, `check:mojibake`; file-integrity clean
   (clause 14) — paste the transcript.

## Self-validation & hand-off (hard contract)
Run `npx tsc --noEmit` → 0; paste an AC-by-AC self-audit (each AC → file:line OR runtime step → ✅/❌) citing both flows by
name; walk BOTH overlays at `uk` 320px (text trigger full-width → open) AND at ≥640 (natural width) end-to-end before
writing "complete". Update `docs/backlog.md` + add `docs/sessions/2026-07-01-task516-overlay-trigger-fullwidth.md` with a
**Files Changed table** + the clause-12 rendered matrix (both stories). **Emit NO `git add`/`git commit`** — the
orchestrator emits commits after diff review. Do NOT start until you have read the two consumers + §8.2 and confirmed the
opt-out prop shape (else STOP-and-ASK).

## Note on Task 515 / 513
Task 515 (DropdownMenu) stays **HELD — row 9 fails** until this corrective lands; Task 513 (Popover) carried the same
latent defect and is corrected here too. After 516 is approved, re-run the 515 row-9 rendered proof to close it.
