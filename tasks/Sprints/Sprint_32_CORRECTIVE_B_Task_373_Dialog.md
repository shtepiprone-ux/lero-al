### Task 373 — CORRECTIVE B: Dialog (and Sheet) visual model correction — no h-scroll, no overlap, no stray gray bg

> # 🔴 OWNER-REJECTED v1 (2026-06-03) — HARD RE-DO v2 REQUIRED. The v1 spec below OMITTED the owner's P0 mobile
> full-width requirement and v1 shipped a centered card (`dialog.tsx:56` `max-w-[calc(100%-2rem)] sm:max-w-sm`) — a
> margined card on mobile, NOT full-width. This block SUPERSEDES/EXTENDS the v1 sections; v1's scroll/overlap/gray-bg
> fixes still apply. Read `docs/agent-contract.md` clauses 11–12 (mobile full-width P0 + rendered-evidence P0) FIRST.
>
> ## 🔴 Mobile full-width BOTTOM SHEET gate (OWNER DECISION 2026-06-03 — the core of this re-do)
> **Owner: "Full-width bottom sheet для діалогу… всі попапи мають бути Full-width bottom sheet. Всі! Без винятку!"**
> 1. **Dialog popup = FULL-WIDTH BOTTOM SHEET at <640px.** Remove the centered-card model on mobile. At `max-sm` the
>    popup is **anchored to the bottom edge**, spans the **FULL viewport width edge-to-edge** (no `max-w-[calc(100%-2rem)]`
>    gap, no `sm:max-w-sm` leaking below 640), has **rounded TOP corners only** (`max-sm:rounded-t-2xl max-sm:rounded-b-none`),
>    **slides up from the bottom**, has a **top-center drag-handle bar** (visual affordance; swipe-to-dismiss only if
>    trivially supported, else visual-only + documented), **closes on backdrop tap AND Esc** (focus returns to trigger),
>    height to content up to `max-sm:max-h-[90dvh]` with internal vertical body scroll;
>    header/footer fixed; X never under the scrollbar; no horizontal scroll at 320. Concretely (executor confirms exact
>    classes): drop the `top-1/2 -translate-y-1/2` vertical-centering at `max-sm` and replace with bottom-anchored
>    (`max-sm:top-auto max-sm:bottom-0 max-sm:translate-y-0 max-sm:left-0 max-sm:translate-x-0 max-sm:w-full
>    max-sm:max-w-none`). At ≥640 the current centered `sm:max-w-sm` card is RESTORED (desktop unchanged).
>    **Sheet** already edge-anchored — verify it is full-width bottom-anchored at <640 (a bottom sheet), not a margined card.
> 2. **The trigger Button is full-width at <640** (inherits the Task 372 Button rule — verify the `DialogTrigger`
>    render-Button is full-width in the stories at 320/375/390, not a small centered pill).
> 3. **Footer action buttons full-width at <640** (already partially done via `w-full sm:w-auto` in `MobileDialog`;
>    apply consistently to ALL dialog/sheet footer buttons in the stories, every locale).
> 4. ≥44px touch targets (`min-h-11`); uk/sq/en/it long title/description/footer labels wrap (`break-words`), never clip.
> 5. **SCOPE NOTE — "all popups":** this task (373) covers ONLY Dialog + Sheet. The remaining popups (Select, Combobox,
>    DropdownMenu, NavigationMenu, Popover, Command) are covered by dedicated **Task 379** — do NOT edit them here.
> 6. **SINGLE-SOURCE HAND-OFF to 379:** write the `max-sm` bottom-sheet fragment (bottom-anchored, `w-full max-w-none`,
>    `rounded-t-2xl rounded-b-none`, slide-up, `max-h-[90dvh]` + internal scroll, drag-handle bar) in a clean, reusable
>    form. Task 379 will EXTRACT these exact classes into a shared single-source helper
>    (`src/components/ui/mobile-bottom-sheet.ts`, pre-authorized in 379) and reuse them across all other popups — so keep
>    Dialog/Sheet's mobile classes consistent and self-contained, not entangled with unrelated dialog styling.
>
> ## 🔴 Mandatory rendered verification matrix (agent-contract clause 12) — REQUIRED to close this task
> Open `Default`, `Long Content`, `Mobile Dialog`, `Locale Variant` (and Sheet stories) and record a matrix:
> rows = 320·375·390·480·560·680·768·810·960·1024·1200·1440·1920·2560, columns = sq·en·uk·it. Per cell at <640 confirm:
> popup is full-width edge-to-edge · trigger full-width · footer buttons full-width · no h-scroll · X not under scrollbar ·
> no stray gray · labels wrap. uk@320/375/390 are MANDATORY stress cells with screenshots/notes. A subset or ≥640-only
> evidence = INCOMPLETE. **Add a `MobileFullWidth` story pinned to 320 (and one at uk@320) that opens the dialog so the
> full-width container is directly visible (use `defaultOpen` ONLY in this isolated story, or document the open step).**
> ⛔ tsc=0 / build=✅ does NOT close this task — only the rendered matrix does.



> **Execution order (Sprint 32 correctives) — REVISED 2026-06-03 (owner): `372 (incl. folded 378) → 373 → 379 → 374 → 375 → 376 → 377`, strictly sequential.** Sent to Sonnet one at a time; each starts only after the previous is implemented AND orchestrator diff-reviewed/approved. **377 is the FINAL certification sweep** (runs only after 372–376 AND 379 all land), never a parallel task. **373 runs after 372; it establishes the canonical bottom-sheet pattern that Task 379 then reuses for every other popup primitive.**

Type:      corrective bugfix — overlay primitives (owner-rejected 361)
Priority:  CRITICAL
Area:      src/components/ui/dialog.tsx · src/components/ui/sheet.tsx · their stories

## Owner rejection context
Owner: "жахлива реалізація. Звідки взялись скроли? … Кнопка прилипає до повзунка скролу … Повзунок налазить на кнопку Х
… Звідки взявся сірий background?". Task 361's Dialog is visually unacceptable. Fix the scroll model properly — do NOT
blindly wrap content in scroll containers that create new defects.

## Required pre-read
`docs/agent-contract.md` · `docs/backlog.md` · `docs/design-system.md` (overlay rules) · `docs/ui-rules.md` (§16 z-index,
overlay) · `docs/component-rules.md` · `docs/qa-rules.md` · session log `docs/sessions/2026-06-02-task-361-*`.

## Current broken behavior (file evidence — `ui/dialog.tsx`)
- L56 `DialogContent`: `overflow-hidden rounded-2xl bg-popover p-4 … max-h-[90dvh]`.
- L61 inner wrapper: `overflow-y-auto flex-1 min-h-0 grid gap-4` → vertical scroll track inside the padded box.
- L70 close button: `absolute top-2 right-2` → sits OVER the scroll track; vertical scrollbar overlaps the X.
- L107 footer: `-mx-4 -mb-4 … border-t bg-muted/50 p-4` → the gray bar the owner sees; with the scroll track it can
  collide with the scrollbar.
- L34 overlay: `bg-black/10 supports-backdrop-filter:backdrop-blur-xs`.
- Horizontal scroll appears (owner) — likely from `grid` content width / negative-margin footer / long unbroken tokens.

## Required after behavior (designed scroll model — not a blind wrapper)
- **Normal-content dialogs show NO scrollbars at all** (vertical or horizontal).
- **Horizontal scroll never appears** — content uses `min-w-0`/`break-words`; remove any `overflow-x` source.
- Long-content dialogs scroll **vertically only when content exceeds `max-h`**, and:
  - the scroll lives in the BODY region only; header (title) and footer (actions) stay fixed and OUTSIDE the scroll track;
  - the **close X is outside the scroll track** (or padded safely away) and is NEVER overlapped by the scrollbar;
  - the **scrollbar never overlaps footer/action buttons** (reserve gutter / scrollbar-gutter or padding);
  - the footer has no stray full-width gray fill unless it is an intentional, clean divider treatment — remove the
    `bg-muted/50` bleed if it reads as an accidental gray background; if a footer surface is intended, make it look
    premium and contained (no collision with scrollbar, correct radius).
- Dialog looks premium, clean, intentional at every breakpoint and locale.
- Same correction applied to **Sheet** (`ui/sheet.tsx`) where the analogous scroll/overlap/padding issues exist.
- Docs tab must not render stacked/duplicate dialogs.

## Exact files to inspect
`ui/dialog.tsx`, `ui/dialog.stories.tsx`, `ui/sheet.tsx`, `ui/sheet.stories.tsx`, any consumer demonstrating long content.
## Exact files allowed to edit
`ui/dialog.tsx`, `ui/sheet.tsx`, `ui/dialog.stories.tsx`, `ui/sheet.stories.tsx`, `docs/design-system.md`,
`docs/ui-rules.md`, `docs/backlog.md`, new session log. NO consumer runtime changes unless STOP&ASK-approved.

## Current behavior to preserve
X / Esc / backdrop-close behavior; focus trap; z-index ordering; mobile bottom-sheet behavior; existing consumer usage.

## Positive flow
1. Normal dialog (short content) → no scrollbar at all; X top-right with safe padding; clean footer. 2. Long-content
dialog → only the body scrolls vertically; X and footer fixed, never overlapped by the scrollbar; no horizontal scroll.
3. Mobile dialog at 320 → fits, no h-scroll, actions reachable.

## Negative flow
- Very long unbroken token → wraps (`break-words`), no horizontal scrollbar appears.
- Content shorter than max-h → NO vertical scrollbar.
- Esc / backdrop / X → closes; focus restored; no stacked dialog on Docs tab.
- uk long labels in title/footer → wrap, no clip, no overlap.

## Acceptance criteria (visible + file-verifiable, negative branch each)
- AC1 No horizontal scrollbar in ANY dialog/sheet at any breakpoint/locale — grep gate: no `overflow-x-auto`/`overflow-x-scroll`
  on dialog content; verifiable at `dialog.tsx`:line + `Long Content`/`Mobile Dialog` stories.
- AC2 Normal-content dialog shows NO scrollbar — visible in `Default`/`Locale Variant` stories. Negative: only long-content scrolls.
- AC3 Close X never overlapped by the vertical scrollbar; scrollbar never overlaps footer/actions — verifiable at the
  structural change (header/body/footer regions) in `dialog.tsx`:line.
- AC4 No stray gray background; footer treatment clean/premium (or removed) — visible at all breakpoints.
- AC5 Sheet corrected analogously; X/Esc/backdrop/focus-trap preserved; Docs tab shows one dialog.
- Grep gate: `rg "overflow-x" src/components/ui/dialog.tsx src/components/ui/sheet.tsx` → none that cause h-scroll.

## Out of scope
Tabs/Button/FilterBar/Phone/Select; new dialog variants; animation redesign beyond fixing defects.

## Required validation
`npx tsc --noEmit` · `npm run lint` · `npm run check:i18n` · `npm run build-storybook` · grep gates · AC self-audit · Manual QA.

## Manual QA checklist (OWNER QA REQUIRED)
Locales sq/en/uk/it. Breakpoints 320·375·390·480·560·680·768·810·960·1024·1200·1440·1920·2560 (uk@320/375/390 mandatory).
Verify: normal dialog no scrollbar; long-content vertical-only; no h-scroll; X never under scrollbar; footer never collides;
no stray gray; Sheet same; Docs no stacking.

## Required Sonnet evidence format (MANDATORY — applies to this and every Sprint 32 corrective)
Sonnet must NOT mark any rendered/manual QA cell PASS unless Sonnet PERSONALLY rendered or inspected that cell.
"OWNER QA REQUIRED" means the owner MAY ADDITIONALLY audit — it does NOT replace Sonnet's own evidence. A cell that was
not checked = `NOT CHECKED`, and the task is then INCOMPLETE. `tsc`/`lint`/`build-storybook` are baseline checks only;
they do NOT replace rendered/manual verification, and "it compiles" never counts as PASS. Per-defect "notes" are NOT
acceptable unless they map to specific matrix cells (surface · locale · viewport).
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
Before/after screenshots-or-notes per defect; structural diff explanation (header/body/footer regions); grep outputs;
validation outputs; Files Changed table. NO `git add`/`commit`.
