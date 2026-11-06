# Task 329 — Z.2 — Mobile + Tablet bottom-sheet modal pattern (canonical)

Type:        feature + refactor (UI primitive change + 2 bespoke migrations)
Priority:    high (cross-cutting UX — every modal in the app on mobile/tablet)
Area:        `src/components/ui/dialog.tsx` (primitive); 2 admin bespoke modals; responsive + UI docs
Filed by:    Opus 4.7 orchestrator on 2026-05-31 — owner request: "Я хотів би щоб модальні вікна виглядали як на прикладі, щоб вони були на всю ширину екрану, а також виїзджали знизу" (mobile + tablet, full-width, slide-up bottom sheet — 2026 UX standard, per owner reference screenshot).
Owner decision (2026-05-31, captured in this kickoff): apply to **ALL modals (site + admin), including bespoke `div.fixed.inset-0` modals**; activate on **<lg (mobile + tablet, width < 1024px)**; revert to centered Dialog at **lg+**.
Sprint:      **29** — assigned 2026-05-31 by orchestrator. Plan: `tasks/Sprints/Sprint_29_—_Modal_Pattern_and_Sprint_27_Closure.md`. Runs AFTER Sprint 28 closes (308 + 309 committed). Parallel-safe with Task 326B inside Sprint 29.
Epic:        Epic Z — Modal Canonical Pattern (`tasks/Epics/Epic_Z_Modal_Canonical_Pattern.md`). This task is **Z.2**, riding on the audit already produced by Task 305.

---

## Pre-read (MANDATORY — read before editing anything)

1. `docs/agent-contract.md` (P0 — clauses 6a Positive + Negative flow + clause 10 Files Changed table).
2. `Claude.md` (project entry) + `docs/ai-behavior.md` (UI Primitive Anti-Patterns, Component Catalog Rules, Commit Rules, Task File Location Rules).
3. **`docs/responsive-governance.md` §"Modal Behavior Philosophy"** (currently states `<md` = near-full-width; this task **rewrites** that section — see Doc Updates below).
4. **`docs/ui-rules.md`** §1 (Modal Spacing), §15 (Touch targets), §16 (Z-index), §17 (UI pre-flight checklist).
5. **`docs/admin-ux-rules.md` §11 + §11.2** (admin modal canonical spec from Task 305; mobile fallback rules; per-modal tier assignments — this task does NOT touch the width-tier scheme but DOES change the mobile fallback behavior universally).
6. **`docs/governance-reports/2026-05-30-admin-modal-audit.md`** — the existing 26-row admin modal inventory. **Do NOT re-audit admin modals.** Reuse this list. The 2 non-canonical admin modals (`AdminCurrenciesManager::CurrencyFormDialog` and `AdminExchangeProvidersManager::ProviderFormDialog`) are explicit migration targets in this task.
7. `docs/component-governance.md` §"Modals & Dialogs"; `docs/tailwind-governance.md` (z-scale rules); `docs/qa-rules.md` (verification gates).
8. **`src/components/ui/dialog.tsx`** (the primitive being modified).
9. **`src/components/ui/sheet.tsx`** — read for the `side="bottom"` className recipe (slide-up animation tokens with Base UI's `data-starting-style` / `data-ending-style` `translate-y-[2.5rem]`). DO NOT modify `sheet.tsx`. We mirror its bottom-sheet recipe inside `dialog.tsx` only.
10. Task 305 session log (`docs/sessions/2026-05-30-task-305-admin-modal-spec.md`) — explains how admin modal tiers were resolved.
11. Sprint 28 plan (`tasks/Sprints/Sprint_28*.md` if present) — verify no in-flight Sprint 28 task is currently editing `dialog.tsx` (avoid merge conflict). If a conflict surface exists → STOP and ask before starting.

---

## Problem statement

Every modal in the app (site + admin) currently renders as a **centered dialog** at all breakpoints. On a 320–375px viewport this gives a cramped, awkward popup floating in the middle of the screen with `max-w-[calc(100%-2rem)]` — modern mobile UX (2026 standard, used by every major real-estate marketplace + iOS/Android system patterns) instead presents a **bottom-sheet**: the modal occupies full viewport width, anchors to the bottom edge, slides up from the bottom, has rounded top corners only, and shows a small drag-handle indicator.

The `Sheet` primitive (`src/components/ui/sheet.tsx`) already implements this with `side="bottom"`, but `Sheet` is reserved for navigation/drawer surfaces (mobile menu, filter drawer). Modals (form, confirmation, detail) go through `Dialog`. We do NOT want to migrate every Dialog call site to Sheet — that would explode the API surface and split semantics. Instead, we extend `Dialog` itself so its content automatically renders as a bottom-sheet at `<lg` and as a centered dialog at `lg+`. Every existing Dialog consumer auto-inherits with zero call-site changes.

Two bespoke `div.fixed.inset-0` modals in admin (CurrencyFormDialog + ProviderFormDialog) bypass `Dialog` entirely and would NOT inherit the new behavior. They are migrated to `Dialog` in this same task so the canonical behavior is universal.

---

## Orchestrator decision (2026-05-31) — locked, no STOP&ASK on strategy

**Strategy: extend `DialogContent` className with responsive variants — no new prop, no new wrapper component.**

Why this and not alternatives:
- **Adding a `variant="sheet"` prop** would let callers opt in/out and would defeat the canonical goal. Owner explicitly chose "усі модалки" — single canonical behavior.
- **Forking `Dialog` into a separate `Modal` wrapper** would add a second primitive doing the same job. Epic Z's whole point is one primitive. Rejected.
- **Rewriting every Dialog call site to use `Sheet side="bottom"`** would be ~25 file edits with risk per site and would split semantics (Sheet = drawer, Dialog = modal). Rejected.

The single primitive extension is the smallest correct diff and matches Epic Q's "single source" philosophy.

---

## Scope (literal)

### 1. Primitive change — `src/components/ui/dialog.tsx`

**A. `DialogContent` — responsive positioning + animation.**

Replace the current centered-only className. The element must:

- **Below `lg:` (mobile + tablet, 0–1023px)** — render as bottom-sheet:
  - Position: `fixed inset-x-0 bottom-0 top-auto left-auto right-auto`
  - Size: `w-full max-w-full max-h-[90dvh]`
  - Radius: `rounded-t-2xl rounded-b-none`
  - Padding: keep current `p-4` (canonical, do not change to `p-6` here — the existing footer recipe already accounts for `-mx-4 -mb-4`).
  - Transform reset: `translate-x-0 translate-y-0` (override the desktop centered transforms at this breakpoint).
  - Border: `border-t` (visual top edge against the page).
  - Animation: slide-up — use Base UI's data-state tokens, mirroring `sheet.tsx` `side="bottom"`:
    - `data-starting-style:translate-y-[2.5rem]`
    - `data-ending-style:translate-y-[2.5rem]`
  - Drop the `zoom-in-95` / `zoom-out-95` classes at this breakpoint (they conflict with slide-up).

- **At `lg:` and above (1024px+)** — restore current centered dialog:
  - Position: `lg:fixed lg:top-1/2 lg:left-1/2 lg:bottom-auto lg:inset-x-auto`
  - Size: `lg:w-full lg:max-w-sm lg:max-h-[90dvh]` (preserve existing `max-w-sm` default; consumers that pass `className="max-w-md"` etc. continue to override at `lg:` — verify the Tailwind cascade order; if existing `className=` overrides do NOT win against the new `lg:max-w-sm` default, switch the primitive default to `lg:max-w-sm` AND ensure caller `max-w-*` continues to work by relying on Tailwind's "last wins by source order" + caller-passed `className` being merged via `cn(... , className)` AFTER the primitive's classes. The current `cn(base, className)` order already does this — verify in DialogContent and keep it).
  - Radius: `lg:rounded-2xl`
  - Border: `lg:border` (full border at desktop) — or `lg:border-0` if the current treatment has no border. **Check current rendering** before changing — do not add a border that wasn't there.
  - Transform: `lg:-translate-x-1/2 lg:-translate-y-1/2`
  - Animation: `lg:data-open:zoom-in-95 lg:data-closed:zoom-out-95` (keep current desktop zoom behavior). Remove the slide-y data-style classes at `lg:` by NOT applying them — Tailwind responsive prefix already scopes them.

- **Drag-handle indicator** (small visual affordance — owner-facing 2026 UX standard):
  - Inside `DialogContent`, render at the very top (before children) a horizontally-centered handle: a `<div>` with `mx-auto mt-1 mb-2 h-1.5 w-12 rounded-full bg-muted-foreground/30 lg:hidden` and `aria-hidden="true"`.
  - The handle is purely visual — no JS drag-to-dismiss. Drag-to-dismiss is **out of scope** (would require gesture lib + Base UI dialog API surface investigation; flag as follow-up if owner wants it).
  - Handle is hidden at `lg:` (centered dialog needs no handle).

- **Close button position** (currently `absolute top-2 right-2`):
  - At `<lg:` keep `top-2 right-2` — sits naturally inside the rounded-top corner.
  - At `lg:` no change.
  - Verify touch target ≥44px (canonical `size="icon-sm"` Button — confirm in `Button` variants; if it's below 44px on mobile, this is a §15 violation. If so → STOP and ask; do not silently widen).

**B. `DialogFooter` — full-width stacked buttons on `<lg:`.**

Currently: `-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-2xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end`.

Change `sm:` to `lg:` for the row/justify transition (so the footer keeps `flex-col-reverse` full-width stacked buttons across mobile + tablet, and only goes row at `lg:`):

- `flex-col-reverse gap-2 ... lg:flex-row lg:justify-end`
- Bottom-radius: `rounded-b-none lg:rounded-b-2xl` (in bottom-sheet mode the modal's own bottom is the screen edge — no rounded corner needed; at `lg:` the rounded-bottom comes back).

Stacked-button rule (`docs/ui-rules.md` §"Modal" already implies this for mobile): primary button is **on top** of the stack at `<lg:` (visually first in a `flex-col-reverse` because `flex-col-reverse` reverses DOM order; verify the DOM order in callers matches: most current callers render `<Cancel/> <Confirm/>` so `flex-col-reverse` puts Confirm on top — correct). Do NOT change DOM order in `DialogFooter` itself. Just verify on the 4 highest-traffic modals (see Verification matrix below) that primary lands on top.

**C. `DialogHeader` — no behavioral change.**

Already `flex flex-col gap-2`. Spot-check that titles don't clip with the close button on a 320px viewport — if they do, add `pr-10` (room for the absolute `top-2 right-2` close). Trust the screenshots over the source.

**D. Animation timing.**

Current `duration-100` on overlay + content is fine for desktop. For the slide-up at `<lg:` consider bumping to `duration-150` or `duration-200` (mirrors `sheet.tsx`). Pick `duration-200` for the slide motion to feel native; keep `duration-100` for fade overlay. STOP&ASK if Tailwind's responsive prefixing of `duration-*` does not work cleanly with Base UI's data-state animation pipeline; if so, fall back to `duration-150` everywhere.

### 2. Bespoke modal migrations (2 files only)

The Task 305 audit identified exactly two `div.fixed.inset-0` form modals. Migrate both to `Dialog`/`DialogContent`/`DialogHeader`/`DialogTitle`/`DialogFooter`. After migration they automatically inherit the new bottom-sheet behavior.

- **`src/components/admin/AdminCurrenciesManager.tsx`** — `CurrencyFormDialog` (the inner component declared around line 31, rendered around line 79 as `<div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">`).
  - Replace the outer `div.fixed.inset-0` + backdrop `div` + content `div` with `<Dialog open onOpenChange={v => !v && onClose()}><DialogContent className="max-w-lg">…</DialogContent></Dialog>`.
  - Move the manual `<h2 className="font-semibold text-base">` to `<DialogHeader><DialogTitle>…</DialogTitle></DialogHeader>`.
  - Move action buttons at the bottom of the form into `<DialogFooter>`.
  - Drop the manual backdrop click handler and `role="dialog" aria-modal="true"` attrs — Dialog provides them.
  - Preserve all existing form state, validation, and submit handler exactly as-is.

- **`src/components/admin/AdminExchangeProvidersManager.tsx`** — analogous form modal at ~line 84. Same migration recipe.

### 3. Documentation updates

- **`docs/responsive-governance.md` §"Modal Behavior Philosophy"** — rewrite items 1–3:
  - 1. **Mobile + Tablet (<lg, 0–1023px):** Modals render as bottom-sheet — full width, anchored to bottom edge, slide-up animation, `rounded-t-2xl rounded-b-none`, drag-handle affordance, stacked footer buttons (primary on top). Canonical for ALL Dialog consumers — `DialogContent` handles this automatically.
  - 2. **Desktop (lg+, 1024px+):** Centered dialog — current `top-1/2 left-1/2` translate centering, `rounded-2xl`, `max-w-sm` default (consumers may override via `className`).
  - 3. **Huge desktop (2xl+):** Dialogs MUST have a max-width cap — no dialogs wider than 768px unless explicitly justified. (Keep current rule.)
  - 4. No `overflow-y-hidden` on `<body>` via custom JS — use shadcn primitives which handle scroll lock correctly. (Keep current rule.)
  - 5. Bespoke `div.fixed.inset-0` modals are FORBIDDEN. New occurrences must use `Dialog` (or `Sheet` for drawer/nav surfaces). The 2 historical admin form modals were migrated in Task 329.
- **`docs/ui-rules.md`** — add a "**Modal canonical pattern**" subsection under §1 (or wherever modal spacing currently lives), referencing the responsive recipe above. Single paragraph + the breakpoint matrix from `responsive-governance.md`. Do not duplicate the matrix — link/reference.
- **`docs/admin-ux-rules.md` §11.2 (Mobile fallback rules)** — update to reflect that the **fallback is automatic via `DialogContent`** as of Task 329. Per-modal "Sheet on mobile" notes in §11.11 that were aspirational (Phase 5) are now satisfied by the primitive change for ALL Dialog consumers; admin modals that explicitly need full-height tall-content treatment (e.g. AdminListingsTable ListingPreviewDialog at §2.2) still get `max-h-[90dvh]` from the primitive — verify the action-heavy preview dialog renders correctly on 320 after the primitive change (screenshot in session log; if it still feels cramped, flag a Phase-5 follow-up rather than special-casing here).
- **`docs/component-governance.md` §"Modals & Dialogs"** — confirm canonical rule already says `Dialog` only; add one sentence under the table: "As of Task 329, `DialogContent` automatically renders as a bottom-sheet at `<lg:` and as a centered dialog at `lg:+`. Callers do not opt in."
- **`docs/component-catalog.md`** — if a "Dialog" row exists, append a note to its Variants column: "Auto-responsive: bottom-sheet on `<lg:`, centered on `lg:+`." Do not create a new row.

### 4. Governance check (light)

Verify a runtime grep exists that rejects new `fixed inset-0` modal wrappers in `src/` outside `src/components/ui/`. If `scripts/governance/` contains a relevant check, run it and ensure it PASSes after migration. If no such check exists → STOP and ask (do not invent new check infra unilaterally — orchestrator scopes that separately).

### 5. Locale work

**None.** No new strings. No locale file edits. (The 2 migrated admin modals reuse their existing namespace strings.) `npm run check:i18n` MUST still pass with the same 1419-or-current key count — record before/after in session log.

---

## Out of scope (explicit — Sonnet must NOT touch)

- `src/components/ui/sheet.tsx` — unchanged. Sheet remains the drawer/nav primitive; do NOT migrate Sheet consumers (filter drawer, mobile menu, AuthSheet, AdminSidebar) to Dialog and vice versa.
- `src/modules/listings/components/ListingGallery.tsx` — line 135 raw `div.fixed.inset-0` is a **fullscreen image viewer (lightbox)**, not a form/confirmation modal. It uses `z-[100]` deliberately to sit above all chrome. Out of scope. (Flag as separate concern in session log if review wants a follow-up.)
- Adding `AlertDialog` primitive — Task 305's Phase 5 is the right place for that work; not this task.
- Adding drag-to-dismiss gesture — flag as follow-up if owner wants it; out of scope here.
- Restructuring any modal's content (titles, bodies, button copy, fields). Frame only.
- Touching `Combobox`, `Popover`, `Tooltip`, `Toast`, or any non-modal primitive.
- New props on `DialogContent` (variant, side, size). Single canonical behavior, no opt-in.

---

## STOP & ASK triggers (escalate to orchestrator before deciding)

1. **Tailwind cascade order on `lg:max-w-sm`** — if the caller's `className="max-w-md"` no longer wins at `lg:` after the rewrite, STOP. Do not bandage with `!important`. Diagnose root cause.
2. **Base UI animation pipeline + responsive duration** — if `lg:duration-100` style conflict breaks the slide-up at `<lg:`, STOP and report.
3. **Close-button touch target <44px on mobile** — if `size="icon-sm"` Button measures below 44px on a real 320px render, STOP. §15 violation. Do not silently change Button size.
4. **Sprint 28 in-flight edits to `dialog.tsx`** — if `git log` shows uncommitted local edits to `dialog.tsx` from another Sprint 28 task, STOP and ask the orchestrator to sequence.
5. **A modal in the audit needs a behavior override** — if a specific admin modal breaks visually at `<lg:` after the primitive change (e.g. ListingPreviewDialog at §2.2), STOP. Do not special-case in the primitive. File a follow-up.

---

## Acceptance criteria

- `src/components/ui/dialog.tsx` updated per scope §1: `DialogContent` renders as bottom-sheet at `<lg:` (full width, slide-up, rounded-top, drag-handle, `max-h-[90dvh]`) and as centered dialog at `lg:+` (current behavior preserved). `DialogFooter` stacks at `<lg:`, rows at `lg:+`.
- `src/components/admin/AdminCurrenciesManager.tsx::CurrencyFormDialog` and `src/components/admin/AdminExchangeProvidersManager.tsx` migrated to `Dialog`/`DialogContent`. Zero `fixed inset-0` outside `src/components/ui/`.
  - Verification grep in the session log: `grep -rn "fixed inset-0" src/ --include="*.tsx"` returns ONLY `src/components/ui/dialog.tsx`, `src/components/ui/sheet.tsx`, and `src/modules/listings/components/ListingGallery.tsx` (lightbox, out of scope).
- `docs/responsive-governance.md` §"Modal Behavior Philosophy" rewritten per scope §3.
- `docs/ui-rules.md`, `docs/admin-ux-rules.md` §11.2, `docs/component-governance.md`, `docs/component-catalog.md` — all updated per scope §3.
- `npx tsc --noEmit` → 0 errors.
- `npm run lint` → 0 errors / 0 warnings.
- `npm run build` → succeeds.
- `npm run check:i18n` → passes; key count unchanged.
- Governance: `npm run governance:tailwind` (or whichever script the project uses) → C0/H0/M0.
- **UI pre-flight checklist** (`docs/ui-rules.md` §17) — all 8 checks recorded in session log.
- **7 breakpoints × 4 locales** verification (sq, en, uk, it × 320, 375, 390, 768, 1280, 1440, 2560) on at least these representative modals — screenshots strongly preferred, per-breakpoint notes mandatory:
  - One simple confirmation: `AdminLocationsManager::DeleteConfirmDialog` (or similar sm Dialog).
  - One form modal: `AdminCurrenciesManager::CurrencyFormDialog` (post-migration — verify bespoke→Dialog migration didn't regress).
  - One large detail modal: `AdminListingsTable::ListingPreviewDialog` (action-heavy, action-button-row test).
  - One site-side modal: `ListingReportDialog` (user-facing, uk locale = longest strings).
- **Files Changed table** in the session log (per Task 264 / clause 10 of `docs/agent-contract.md`) — every touched file, 1-line rationale each. The Sonnet executor MUST NOT emit `git add` or `git commit`. The orchestrator (Opus) reads the diff and emits explicit-path commit commands at review time.
- Session log committed to `docs/sessions/2026-05-31-task-329-mobile-tablet-bottom-sheet-modals.md`.
- `docs/backlog.md` "Last Session" updated per the 2–4 line rule.
- Epic file `tasks/Epics/Epic_Z_Modal_Canonical_Pattern.md` updated to add Task 329 row + mark it CLOSED on completion.

---

## Files expected to change (Sonnet completes the "Files Changed" table from real diff)

| File | Expected change |
|------|-----------------|
| `src/components/ui/dialog.tsx` | `DialogContent` + `DialogFooter` className rewrite; drag-handle indicator added |
| `src/components/admin/AdminCurrenciesManager.tsx` | `CurrencyFormDialog` migrated from `div.fixed.inset-0` to `Dialog` |
| `src/components/admin/AdminExchangeProvidersManager.tsx` | Form modal migrated from `div.fixed.inset-0` to `Dialog` |
| `docs/responsive-governance.md` | §"Modal Behavior Philosophy" rewritten (mobile + tablet → bottom-sheet) |
| `docs/ui-rules.md` | "Modal canonical pattern" subsection added/updated |
| `docs/admin-ux-rules.md` | §11.2 mobile fallback updated; primitive-handles-it note |
| `docs/component-governance.md` | One-line addition under §"Modals & Dialogs" |
| `docs/component-catalog.md` | Dialog row variant note |
| `docs/sessions/2026-05-31-task-329-mobile-tablet-bottom-sheet-modals.md` | NEW — session log |
| `docs/backlog.md` | Last Session entry + archive row |
| `tasks/Epics/Epic_Z_Modal_Canonical_Pattern.md` | Task 329 row + closure mark |

No SQL. No locale file edits. No new component files. No new scripts.

---

## Review hook (for the orchestrator — Opus 4.7)

After Sonnet reports completion, Opus reads the real diff and verifies:

1. `dialog.tsx` className diff is responsive-correct (Tailwind cascade order; `lg:` properly scopes desktop overrides; no `!important`; no JS viewport detection).
2. Grep `fixed inset-0` in `src/` matches the AC (3 results, all expected).
3. Both bespoke admin migrations preserve their existing form state + submit handlers byte-equivalent — only the frame changed.
4. The 4 docs touched got the rewrite, not just an additive note (responsive-governance.md and ui-rules.md must REPLACE the obsolete "<md" rule, not append a new conflicting one).
5. `Files Changed` table count matches the diff path count exactly.
6. All 4 locales × 7 breakpoints are recorded for the 4 representative modals.
7. `npm run build` output is in the session log.
8. No scope creep (no new prop on DialogContent; no AlertDialog; no gesture lib; no Sheet edits; no ListingGallery edits).

If review PASSes, Opus emits explicit-path commit commands:

```
git add src/components/ui/dialog.tsx src/components/admin/AdminCurrenciesManager.tsx src/components/admin/AdminExchangeProvidersManager.tsx
git commit -m "refactor(Task329): DialogContent renders as bottom-sheet on mobile+tablet"

git add docs/responsive-governance.md docs/ui-rules.md docs/admin-ux-rules.md docs/component-governance.md docs/component-catalog.md
git commit -m "docs(Task329): canonical bottom-sheet rule for <lg modals"

git add docs/sessions/2026-05-31-task-329-mobile-tablet-bottom-sheet-modals.md docs/backlog.md tasks/Epics/Epic_Z_Modal_Canonical_Pattern.md
git commit -m "chore(Task329): session log + Epic Z closure"
```

(Three logical commits; explicit paths; never `git add -A`. See `docs/agent-contract.md` clause 10 + Claude.md "Commit hand-off".)

---

## Sonnet handoff contract reminder

You are the executor. Do not invent architecture. Do not add new primitives. Do not migrate site-side Dialog consumers individually — the primitive change covers them. Do not run `git add` or `git commit`. Update `docs/backlog.md` Last Session + open the session log + emit the Files Changed table from the REAL diff (not from intent). On any STOP&ASK trigger above, halt and report — do not improvise.
