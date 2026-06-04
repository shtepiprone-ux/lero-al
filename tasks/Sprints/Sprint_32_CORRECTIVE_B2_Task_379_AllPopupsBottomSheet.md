### Task 379 — CORRECTIVE B2: ALL remaining popups → full-width BOTTOM SHEET at <640px (owner "всі попапи, без винятку")

> # 🔴 OWNER P0 (2026-06-03): "всі попапи мають бути Full-width bottom sheet. Всі! Без винятку!" Task 373 handles
> Dialog + Sheet. THIS task handles **every other overlay/popup primitive**. Read `docs/agent-contract.md` clauses 11–12
> (mobile full-width P0 + rendered-evidence P0) FIRST. NOT committed until owner says (372–379 batch).
>
> > **Execution order (Sprint 32 correctives) — REVISED 2026-06-03 (owner): `372 (incl. folded 378) → 373 → 379 → 374 →
> > 375 → 376 → 377`, strictly sequential.** **379 runs immediately after 373 and BEFORE 374/375/376/377** — because it
> > changes the Select/Combobox/Popover/Dropdown/Command primitives that 376 (Select label) and 377 (full sweep) later
> > certify; doing it first prevents those tasks from certifying soon-to-change stories. 379 reuses the bottom-sheet
> > pattern 373 establishes. **377 is the FINAL certification sweep** (runs only after 372–376 AND 379 all land).

Type:      corrective primitive — overlay/popup mobile model (owner P0)
Priority:  CRITICAL
Area:      `src/components/ui/select.tsx` · `popover.tsx` · `dropdown-menu.tsx` · `navigation-menu.tsx` · `command.tsx`
           · `src/components/shared/Combobox.tsx` (+ `LocationCombobox.tsx` · `PropertyTypeCombobox.tsx` · `YearCombobox.tsx`)
           · their stories

## Required pre-read
`docs/agent-contract.md` (clauses 11–12) · `docs/backlog.md` · `docs/ui-rules.md` §16 (z-index/overlay) ·
`docs/design-system.md` (overlay rules) · `docs/component-rules.md` · `docs/qa-rules.md` · the Task 373 session log +
`dialog.tsx`/`sheet.tsx` as the reference bottom-sheet implementation (reuse the SAME pattern/tokens — Note 14 single-source).

## Canonical mobile bottom-sheet contract (the required after-behavior — identical for every popup)
At **<640px (`max-sm`)** EVERY popup/menu surface below renders as a **full-width bottom sheet**:
- **Bottom-anchored**, **full viewport width edge-to-edge** (no side margins, no anchored-to-trigger positioning, no
  `max-w`/fixed width leaking below 640), **rounded TOP corners only**, **slide-up from bottom**, height to content up to
  `max-sm:max-h-[90dvh]` with **internal vertical scroll** when long; ≥44px touch targets on every option/item; option/label
  text wraps (sq/en/uk/it), never clips; **no horizontal scroll at 320**.
- A **backdrop/scrim** behind the sheet on mobile; **closes on backdrop tap AND Esc** (focus returns to trigger).
- A **top-center drag-handle bar** on every mobile bottom sheet (visual affordance; swipe-to-dismiss only if trivially
  supported — otherwise the handle is visual-only and documented). Use the SAME handle treatment as Dialog/Sheet (373).
- At **≥640px the existing desktop anchored-popup behavior is fully RESTORED** (Select/Combobox/DropdownMenu/Popover/Nav
  anchor to their trigger exactly as today — desktop must be visually unchanged).
- **Keyboard / focus semantics — preserve EACH primitive's expected behavior; do NOT impose a uniform focus trap
  (clarified 2026-06-03).** Keep arrow/Home/End/typeahead, `aria-*`, and selection semantics intact for every primitive.
  **Focus must return to the trigger on close where applicable.** A Dialog-style focus TRAP is correct for Dialog/Sheet
  (Task 373) but MUST NOT be added to Select/Combobox/DropdownMenu/NavigationMenu/Popover/Command if the underlying
  Base-UI primitive does not already use one — do not change a primitive's native focus model to force a trap. If making
  a given primitive a bottom sheet appears to require altering its focus/keyboard model, STOP and ASK rather than break
  accessibility semantics.
- **Single source — shared helper is PRE-AUTHORIZED (clarified 2026-06-03):** factor the shared `max-sm` bottom-sheet
  classes ONCE into **`src/components/ui/mobile-bottom-sheet.ts`** (export a className const, e.g. the `max-sm:` fragment
  reused by every popup; reuse the exact classes Task 373 wrote for Dialog/Sheet). This colocated `.ts` helper is
  consistent with existing convention in `src/components/ui/` (`appImageConfig.ts`, `useAdaptiveImageConfig.ts`) and is
  **NOT "new architecture" — creating it is explicitly approved, no STOP&ASK needed.** Do NOT copy-paste divergent
  fragments across primitives (Note 14). Only STOP and ASK if the single-source requirement turns out to need something
  BEYOND this one shared className helper (e.g. a new shared React component/provider).

## Popups in scope (each MUST be converted AND have a story proving it)
1. `ui/select.tsx` — Select dropdown popup → bottom sheet (options list scrolls inside).
2. `shared/Combobox.tsx` → bottom sheet; verify wrappers `LocationCombobox`, `PropertyTypeCombobox`, `YearCombobox` inherit
   it (no per-wrapper override re-anchors to a mini dropdown).
3. `ui/dropdown-menu.tsx` — menu popup → bottom sheet (items full-width rows, ≥44px).
4. `ui/navigation-menu.tsx` — menu popup → bottom sheet (or document if it is already a Sheet on mobile; if conversion is
   structurally impossible, STOP and ASK — do not skip silently).
5. `ui/popover.tsx` — popover popup → bottom sheet.
6. `ui/command.tsx` — command palette popup → bottom sheet (search field pinned, results scroll).
- **`src/components/shared/Map.tsx` uses a `Popup` too:** if it is a Leaflet/map-marker popup (NOT our overlay system),
  it is OUT OF SCOPE — STOP and ASK before touching it. Do not assume.

## Exact files allowed to edit
The 6 popup primitives above + the 3 Combobox wrappers (ONLY if a wrapper blocks the inherited bottom-sheet), their
`*.stories.tsx`, **the NEW shared helper `src/components/ui/mobile-bottom-sheet.ts` (pre-authorized — see "Single source"
above)**, `docs/design-system.md`, `docs/ui-rules.md`, `docs/backlog.md`, new session log. `messages/*` ONLY to add
keys a story needs (parity). NO unrelated consumer/runtime edits — if a consumer blocks the pattern, STOP and ASK.

## Coordination note — Task 376 also edits `select.tsx` / `select.stories.tsx` (runs AFTER 379)
Task 376 will later add localized-label rendering to `SelectValue` in `ui/select.tsx` and touch `select.stories.tsx`.
379 runs FIRST and owns the `max-sm` bottom-sheet conversion of these files. Keep your Select bottom-sheet change
self-contained (the shared-helper className + the Positioner/Popup mobile classes) so 376's later label change is purely
additive and cannot revert it. Do NOT add value→label mapping here (that is 376's scope).

## Current behavior to preserve
Selection/value semantics, controlled/uncontrolled state, `onValueChange`/`onSelect`, keyboard nav, **each primitive's
native focus model (focus RETURN to trigger on close where applicable — NOT a forced uniform focus trap; see contract
above)**, Esc/tap-outside close, z-index ordering, ALL desktop (≥640) anchored behavior, every consumer's existing
usage/API (no prop renames/removals).

## Positive flow (happy path)
1. At 320/375/390: tap a Select trigger → a full-width bottom sheet slides up edge-to-edge, rounded top, options ≥44px,
   long list scrolls inside, pick one → sheet closes, value set, trigger shows label. 2. Same for Combobox (+ Location/
   PropertyType/Year), DropdownMenu, Popover, Command, NavigationMenu. 3. At ≥640: each opens as today's anchored dropdown
   (desktop unchanged). 4. uk@320 long option labels wrap, no clip, no h-scroll.

## Negative flow (every off-happy-path branch)
- Tap backdrop / Esc → sheet closes, no selection, focus returns to trigger. - Empty list / no results → localized empty
  state inside the sheet, no broken layout. - Very long unbroken uk token → wraps, no horizontal scroll. - Disabled option
  → not selectable, visible disabled state. - Rapid open/close (double-tap) → no stuck backdrop, no duplicate sheet. -
  Keyboard-only: open, arrow to item, Enter selects, Esc closes, focus returns. - Locale mismatch → no English leak in
  sq/uk/it sheets. - Two popups can't both be open stacked.

## Acceptance criteria (each file-verifiable + rendered, with negative branch)
- AC1 Each of the 6 popup primitives renders as a full-width bottom sheet at <640 — verifiable at the `max-sm` classes in
  each `*.tsx` (bottom-anchored, `w-full max-w-none`, `rounded-t-*`, `max-h-[90dvh]`, internal scroll) AND visible in each
  primitive's stories at 320/375/390. Negative: at ≥640 the diff shows desktop anchored behavior preserved (the `max-sm`
  rules are mobile-scoped only).
- AC2 Combobox wrappers (Location/PropertyType/Year) inherit the sheet — no wrapper re-anchors to a mini dropdown at <640.
- AC3 Shared single-source bottom-sheet classes live in `src/components/ui/mobile-bottom-sheet.ts` (one const/helper) and
  are reused across all popups — grep shows no divergent copy-pasted fragments. Negative: no primitive keeps an
  anchored-only mobile popup.
- AC4 Keyboard nav, Esc/tap-outside close, selection semantics, z-index unchanged at all sizes; focus RETURNS to trigger
  on close where applicable. Negative: no Dialog-style focus trap was added to a primitive that did not previously use one
  (native focus model preserved) — if a trap seemed required, it was STOP&ASK'd, not silently added.
- AC5 `Map.tsx` popup either confirmed out-of-scope (STOP&ASK logged) or untouched.
- AC6 (clause 12) Rendered verification matrix present: rows = 320·375·390·480·560·680·768·810·960·1024·1200·1440·1920·2560,
  columns = sq·en·uk·it, per popup; <640 cells confirm bottom-sheet full-width + ≥44px + wrap + no h-scroll; ≥640 cells
  confirm desktop anchor intact. uk@320/375/390 mandatory. tsc=0/build=✅ does NOT close this task — only the matrix does.

## Out of scope
Dialog/Sheet (Task 373); Tabs/Button (372); FilterBar (374); Phone (375); new popup variants; redesign beyond the
bottom-sheet conversion; Map marker popup (STOP&ASK).

## Required validation
`npx tsc --noEmit` · `npm run lint` · `npm run check:i18n` · `npm run build-storybook` · grep gates (single-source class;
no leftover anchored-only mobile popup) · AC-by-AC self-audit with file:line · the rendered matrix · Manual QA.

## Manual QA checklist (OWNER QA REQUIRED)
Locales sq·en·uk·it. Breakpoints 320·375·390·480·560·680·768·810·960·1024·1200·1440·1920·2560 (uk@320/375/390 mandatory).
Per popup: <640 bottom-sheet full-width, ≥44px items, wrap, no h-scroll, backdrop+Esc close; ≥640 desktop anchor intact.

## Required Sonnet evidence format (MANDATORY — applies to this and every Sprint 32 corrective)
Sonnet must NOT mark any rendered/manual QA cell PASS unless Sonnet PERSONALLY rendered or inspected that cell.
"OWNER QA REQUIRED" means the owner MAY ADDITIONALLY audit — it does NOT replace Sonnet's own evidence. A cell that was
not checked = `NOT CHECKED`, and the task is then INCOMPLETE. `tsc`/`lint`/`build-storybook` are baseline checks only;
they do NOT replace rendered/manual verification, and "it compiles" never counts as PASS.
The final report MUST include:
1. **AC self-audit table** — AC# · requirement · implementation evidence (file:line) · verification evidence (command
   output / rendered matrix cell / grep output / test result) · status `PASS` / `FAIL` / `NOT CHECKED`.
2. **Command transcript** — for each required command: exact command · exit code · short result. If a command was not
   run, state the explicit reason. "Not run" NEVER counts as PASS.
3. **Grep gates** — paste the exact grep command and its RAW output; write `(no output)` if empty; for any false
   positives, provide a triage table separating real hits from documentation/comment/string mentions.
4. **Rendered evidence matrix** (whenever UI is involved) — per surface/story: locale (sq/en/uk/it) · viewport
   (320·375·390·480·560·680·768·810·960·1024·1200·1440·1920·2560) · interaction performed · expected result · observed
   result · evidence reference (screenshot path / story URL / exact written observation) · status `PASS`/`FAIL`/`NOT
   CHECKED`. **uk@320/375/390 are mandatory cells.**
5. **Tests** — test file · cases added/updated · command run · pass/fail · failure output if any.
6. **STOP&ASK log** — every ambiguity found · whether work stopped · what was left unchanged because it was out of scope.
A task is INCOMPLETE if any required AC or any required rendered cell is marked `NOT CHECKED`.

## Final report requirements
Per-popup before/after (anchored→bottom-sheet) with file:line; shared-class single-source evidence; the rendered matrix;
grep outputs; STOP&ASK items (Map, NavigationMenu if applicable); validation outputs; Files Changed table. NO `git add`/`commit`.
