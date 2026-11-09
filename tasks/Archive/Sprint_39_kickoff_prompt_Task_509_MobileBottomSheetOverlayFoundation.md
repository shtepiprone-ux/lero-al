# Task 509 — Mobile bottom-sheet foundation for DROPDOWN overlays (Batch C foundation, P1.16-pre)

> **Program:** `docs/mantine-tailadmin-migration-tracker.md` (Phase 1 → Batch C overlays). **Owner decision
> 2026-06-28:** build the bottom-sheet *foundation first*, before migrating individual overlays. **Executor:**
> Sonnet 4.6 (writes code). **Orchestrator:** Opus (this kickoff; reviews the rendered story side-by-side at <640).
> **Reference (copy-source):** the EXISTING `src/design-system/mantine/patterns/MantineDialogDrawerPattern.tsx`
> (Modal/Drawer bottom-sheet already canonical, Task 482) + `docs/tailadmin-style-reference.md` + `demo_tailadmin_com.zip`.

## Why this task (root-cause)
The Modal/Dialog bottom-sheet is **already solved** (`MantineDialogDrawerPattern`: `useMediaQuery('(max-width: 40em)')`
→ `Drawer position="bottom"` with drag handle, top-only radius, ≤90dvh, internal scroll, backdrop+Esc, stacked
full-width actions). The UNSOLVED gap — and the reason **Task 495 (Select) deferred its `<640` bottom-sheet with a
STOP-and-ASK** — is the **dropdown-type overlays**: Select / Combobox / Menu / Popover / NavigationMenu render their
dropdown as an anchored mini-dropdown on mobile, which VIOLATES the owner P0 ("ALL popups = full-width bottom sheet
at <640, no exceptions", `agent-contract.md` clause 11). Batch C (Modal/Drawer/Popover/DropdownMenu/NavigationMenu/
Tooltip) cannot start until this dropdown mechanism is canonical. **This task builds it once and proves it on Select.**

## Pre-read (UI / overlay task — from `docs/rule-index.md`)
**Always:** `docs/agent-contract.md`, `docs/backlog.md`, `docs/critical-flow-registry.md` (SCAN — Select is used in
admin/listing filters; if a touched flow has a registry row, clause 15 applies).
**Required:** `docs/mantine-responsive-design-system.md` — **FIRST READ.** §7 mobile gate, §12 canonical patterns,
**§18 Mantine theming/CSS pitfalls (MANDATORY before any overlay/CSS styling)**, plus the overlay map (§11 legacy→Mantine,
the P0-popup-gate row ~L226, and the `DialogDrawerPattern` rows). `docs/ui-rules.md` (§15a mobile gate, §16 z-index,
non-canonical-dropdown grep), `docs/component-rules.md`, `docs/qa-rules.md`, `docs/storybook-governance.md`.
**Study before coding:** `src/design-system/mantine/patterns/MantineDialogDrawerPattern.tsx` (the P0 treatment to REUSE),
`src/design-system/mantine/theme.ts` (`Select`, `Modal`, `Drawer` defaults), `src/design-system/mantine/input-chrome.css`
(`.mantine-Select-input` chrome from Task 495/507 — DO NOT regress it).

## Scope (exactly this — no more)
1. **A canonical, reusable mobile-bottom-sheet mechanism for DROPDOWN overlays** in the design-system layer
   (`src/design-system/mantine/**`). At `<640` (`max-width: 40em`) a dropdown overlay's content renders as a
   **full-width bottom sheet** (reusing the EXACT P0 treatment from `MantineDialogDrawerPattern`: `Drawer position="bottom"`,
   edge-to-edge, top-only radius, centered drag handle, ≤90dvh + internal scroll, backdrop tap + Esc to close, focus
   returns to trigger); at `≥640` the normal anchored Mantine dropdown is used, unchanged. Mechanism shape =
   **a shared hook/wrapper** (e.g. `useResponsiveDropdown` / `MantineBottomSheetSelect`), NOT a per-call-site copy.
2. **Reference-implement it on the `Select` primitive** — closing Task 495's deferral. `Select` dropdown = anchored on
   desktop, full-width bottom sheet on mobile, with the §6d input chrome (Task 495/507) intact (border gray-2, chevron,
   brand focus, 44px, disabled whole-control fade).
3. **Document the canonical dropdown-bottom-sheet pattern** in `docs/mantine-responsive-design-system.md` (new sub-section
   under the overlay/§12 area) + a pointer row in `docs/tailadmin-style-reference.md`, so Batch C (Menu/Popover/Combobox/
   NavigationMenu/Tooltip) consumes the SAME mechanism — no re-invention per overlay.
4. **Storybook story** (Mantine proof path) demonstrating Select: closed, open-anchored (≥640), open-bottom-sheet (<640),
   disabled, long-uk option. `src/stories/mantine/primitives/Select.stories.tsx` already exists (Task 495) — EXTEND it
   with the open/bottom-sheet states; do not duplicate.

**OUT OF SCOPE (do NOT touch):** Menu, Popover, Combobox, NavigationMenu, Tooltip migrations (those are Batch C, they
only CONSUME this foundation later); any product-surface (`src/app/**`, `src/components/admin/**`) edits; the existing
Modal/Drawer pattern (already canonical — reuse, don't modify). PhoneField (Task 504, separate, owner chose new-native).

## 🔴 STOP-and-ASK triggers (do NOT invent architecture — `agent-contract.md` clause 2)
- If wrapping the Mantine `Select` dropdown in a `Drawer` at `<640` is NOT achievable via the Mantine `Combobox` store +
  props (controlled dropdown open state + rendering `Combobox.Options` inside a `Drawer`), and would require forking/
  reimplementing `Select` as a fully custom `Combobox` — **STOP and ASK** before building a custom component.
- If the P0 bottom-sheet treatment cannot be shared from `MantineDialogDrawerPattern` without duplicating its style
  block (i.e. it needs extraction into a shared `bottomSheetStyles`/CSS) — propose the extraction and **ASK** before
  diverging from the single source.
- If `useMediaQuery` SSR/hydration (returns `false` first render — see the pattern file's documented caveat) causes any
  flash or layout shift for the Select trigger/dropdown — **STOP and ASK** rather than papering over it.

## Current behavior to preserve
- `Select` desktop (≥640): anchored dropdown, §6d chrome (gray-2 border, chevron, brand focus ring, 44px, disabled fade)
  — ALL of Task 495/507 stays pixel-identical on desktop.
- Every existing `Select` consumer keeps its props (value/onChange/data/searchable/disabled/placeholder). No API break.
- The existing `MantineDialogDrawerPattern` (Modal/Drawer) is UNCHANGED and remains the canonical dialog pattern.

## Required after-behavior
- At `<640`, opening the `Select` shows a full-width bottom sheet (drag handle, top-only radius, ≤90dvh internal scroll,
  options list, backdrop+Esc close, focus back to trigger). Selecting an option closes the sheet and updates the value.
- At `≥640`, the `Select` opens the normal anchored dropdown — visually unchanged from Task 495/507.
- The mechanism is reusable (one hook/wrapper) and documented so Batch C overlays adopt it without copy-paste.

## Positive flow (happy path)
Actor: user on a 320–375px viewport. 1) Sees the `Select` trigger (full-width input chrome, 44px, chevron). 2) Taps it →
a full-width bottom sheet slides up from the bottom edge, edge-to-edge, rounded top corners, drag handle centered at top,
backdrop dims the page. 3) Scrolls the options inside the sheet (≤90dvh, internal scroll, no page h-scroll). 4) Taps an
option → sheet closes, value updates, focus returns to the trigger, trigger shows the selected label. Post-conditions:
the same `onChange` fires as on desktop; no DB/network involved (pure UI). On `≥640`: step 2 instead opens the anchored
dropdown unchanged.

## Negative flow (every off-happy-path branch)
- **Backdrop tap** → sheet closes, no selection committed, focus returns to trigger.
- **Esc key** → sheet closes, no selection, focus returns to trigger.
- **Disabled Select** → trigger shows the §6d disabled whole-control fade (opacity 0.5, not-allowed); tap does NOT open
  the sheet; no focus ring.
- **Empty/placeholder** → sheet opens with the placeholder/empty-options state legible; no crash on zero options.
- **Long uk option** (`Адміністратор` / a long locale string) → wraps inside the sheet row, no clip, no h-scroll at 320.
- **Keyboard / a11y** → trigger is focusable; sheet is an accessible dialog (focus trap, `aria` roles preserved by
  Mantine Drawer/Combobox); arrow-key option navigation still works where Mantine provides it.
- **SSR/first paint** → overlay is closed on SSR (no flash); trigger renders correctly server-side (document the
  `useMediaQuery` caveat as the existing pattern does).
- **Rapid re-open / double-tap** → no duplicate sheets; open state is controlled.

## 🔴 Mobile <640 full-width gate (OWNER P0 — `agent-contract.md` clauses 11–12)
- The Select **trigger** is full-width at `<640` (input already 44px; ensure `max-sm` full-width container).
- The Select **dropdown** at `<640` is the full-width edge-to-edge bottom sheet defined above — NOT an anchored
  mini-dropdown, NOT a centered card, NOT `max-w-[calc(100%-2rem)]`. Top-only radius, drag handle, ≤90dvh, internal
  scroll, backdrop+Esc. ≥44px touch targets on every option row. Long sq/en/uk/it labels wrap (`whitespace-normal
  break-words`), never clip; no horizontal scroll at 320.
- At `≥640` the desktop anchored dropdown behavior is restored unchanged.

## 🔴 Zero hardcode (tracker §"Per-slice DoD" item 5)
No raw colors (theme tokens / `var(--mantine-color-*)` / brand only), no raw spacing/radius px except the justified
bottom-sheet exemptions already used by `MantineDialogDrawerPattern` (drag-handle `2.5rem`/`0.25rem`, `90dvh`,
`min-h`/touch `2.75rem`), no hardcoded user-facing strings (`storyT()` ×4 locales in the story; any new `aria-label`
via `t()` with sq/en/uk/it parity), no raw `<button>/<select>`. Enforced by `check:design-tokens` + `check:i18n` +
ESLint; orchestrator also greps the diff for raw hex / raw px / string literals.

## Story (Mantine proof path)
Extend `src/stories/mantine/primitives/Select.stories.tsx` (single `Default`, `skipCanvas:true`, `layout:'fullscreen'`,
toolbar-driven viewport+locale, `storybook.mantine.*` via `storyT()`): sections = trigger (closed), open dropdown
(anchored — viewed at ≥640 in toolbar), open bottom sheet (viewed at <640 in toolbar), disabled, long-uk option. No
new top-level story export; no `parameters.layout:'centered'|'padded'`; no `Ukrainian*` export.

## Rendered proof matrix (clause 12 — MANDATORY, orchestrator verifies side-by-side)
Rows = the 7 states/sections; columns = **uk@320 · uk@375 · uk@390 · en@320 · sq@320 · it@320** (uk@320/375/390
mandatory stress cells). Each cell: open the Select, confirm at <640 the dropdown is a full-width edge-to-edge bottom
sheet (drag handle, top-only radius, ≤90dvh internal scroll, no page h-scroll, option rows ≥44px, long label wraps),
and at ≥640 the anchored dropdown is unchanged. `tsc=0`/`check:stories`/build-green is a BASELINE, NEVER proof.

## Acceptance criteria (each maps to a flow; verifiable in the diff/render)
1. Shared dropdown bottom-sheet mechanism exists in `src/design-system/mantine/**` (one hook/wrapper, reused — not
   copy-pasted) reusing the `MantineDialogDrawerPattern` P0 treatment. *(Scope 1)*
2. `Select` renders anchored dropdown at ≥640 (Task 495/507 chrome intact — verifiable file:line) AND full-width bottom
   sheet at <640. *(Positive flow steps 2–4; Mobile gate)*
3. Backdrop tap + Esc both close the sheet without committing a selection; focus returns to trigger. *(Negative flow —
   each branch has a verifiable handler/guard)*
4. Disabled, empty, long-uk-option, SSR-no-flash branches all handled per Negative flow. *(Negative flow)*
5. Canonical pattern documented in `mantine-responsive-design-system.md` (+ pointer in `tailadmin-style-reference.md`)
   so Batch C consumes it. *(Scope 3)*
6. Story extended (Mantine proof path); rendered matrix complete incl. uk@320/375/390; zero clip/overflow/h-scroll. *(Scope 4; clause 12)*
7. Zero hardcode; locale parity sq/en/uk/it; no `Select` consumer API break; `MantineDialogDrawerPattern` untouched.
8. Gates green: `tsc=0`, `check:stories`, `check:i18n`, `check:design-tokens`, `check:mojibake`; file-integrity clean
   (clause 14: 0 NUL, parses, not truncated) — paste the green transcript.

## Self-validation & hand-off (hard contract)
Run `npx tsc --noEmit` → 0; paste an AC-by-AC self-audit table (each AC → file:line OR runtime step → ✅/❌) citing both
flows by name; walk the Select flow at `uk` 320px end-to-end before writing the "complete" line. Update `docs/backlog.md`
+ add `docs/sessions/2026-06-28-task509-*.md` with a **Files Changed table** (one row per touched path + 1-line rationale)
and the clause-12 rendered matrix. **Emit NO `git add`/`git commit`** — the orchestrator emits commits after diff review.
