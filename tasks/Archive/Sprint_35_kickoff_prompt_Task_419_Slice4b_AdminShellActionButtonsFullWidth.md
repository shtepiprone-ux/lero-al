# Sprint 35 — Task 419 (Slice 4b) — Admin shell action buttons full-width at `<640` (§26.1)

**Type:** Product-code UI migration (admin shell components) — Slice 4b of the global responsive rework
**Executor:** Sonnet 4.6
**Status:** OPEN — hand off now
**Created by:** orchestrator, 2026-06-12, after Task 418 + REWORK closed the rendered gate (owner-native 3× `screenshots:assert` = 2520/2520, deterministic). Slice 4b was carved out of Slice 4 in `responsive-storybook-inventory.md §5` (admin-shell scope, never implemented).
**Reviewer:** Opus 4.8 orchestrator (diff review + owner-native rendered gate)

> **Read FIRST, in this order:** `docs/agent-contract.md` (clauses 1–14) → `docs/design-system.md` **§26.1** (full-width controls `<640`), **§26.4** (icon-only exemptions), **§26.6** (owner-approved exceptions, incl. AdminSidebar left-nav drawer), **§12a/§12b** (`[&>*]:max-sm:w-full` container pattern) → `docs/responsive-storybook-inventory.md §5 → "Slice 4b"` → `docs/rule-index.md` pre-read for UI/admin task type. Do NOT weaken any assertion or skip a locale.

---

## Why this slice exists

Slice 4 (Task 417) made the 5 admin **data-surface** action-rows/toolbars §26.1-compliant. Slice 4b finishes §26.1 on the admin **shell** chrome — the surrounding page shell, settings screen, sidebar, mobile header, and the shell-demo layout — so every label-bearing interactive control in the admin shell spans the full available width below 640px (`docs/CLAUDE.md` OWNER P0 banner; §26.1). This is a small, container-only change: most of these surfaces are already compliant and are **verify-only**; the audit must prove that with rendered evidence, and fix the few that are not.

## Scope — `src/components/admin/**` shell components ONLY

Per-component required action (audit first, then fix only what is non-compliant — do NOT rewrite compliant code):

### 1. `AdminPageShell.tsx` — VERIFY-ONLY (already compliant)
The actions container already carries `max-sm:w-full [&>*]:max-sm:w-full` (current line ~52) and the header is `flex-col gap-3 sm:flex-row`. **Do not edit.** Prove via rendered QA that the `--with-actions`, `--multiple-actions`, and `--with-tabs-and-actions` stories show full-width action buttons at 320/375/390 and **unchanged** (`sm:`-gated) layout at `≥640`. If — and only if — a story reveals a non-full-width action at `<640`, STOP & ASK before touching the primitive.

### 2. `AdminSettings.tsx` — REAL FIX (Save button); tab bar = verify-only (owner-decided)
- **Save action button (current line ~281–294):** wrapped in `<div className="ml-auto">`, so at `<640` it is right-aligned and content-width — a **§26.1 FAIL**. Fix the **footer row container** so the Save button is full-width at `<640` and **byte-identical at `≥640`** (only `max-sm:`/`sm:` utilities added). **Preferred target shape:**
  - footer row: `max-sm:flex-col max-sm:items-stretch [&>*]:max-sm:w-full`
  - Save wrapper (the `ml-auto` div): `ml-auto max-sm:ml-0 max-sm:w-full`
  - Save `Button`: **unchanged** unless the wrapper stretch is insufficient; only then add `max-sm:w-full` to this Button.

  Do not change the handler, disabled state, or label logic.
- **Tab bar (current line ~122):** a hand-rolled segmented control — `flex gap-1 bg-muted rounded-xl p-1 flex-wrap` of `size="tab"` Buttons. **Tab-bar decision: owner-approved leave-as-is for Task 419.** Treat it as a **compact segmented control, NOT an action-row button group** — do **NOT** make the tab triggers full-width / `flex-1` in this task. **Required:** verify (rendered) there is **no horizontal overflow at 320/375/390 × sq/en/uk/it** and document it in the audit table. Only if rendered QA proves real overflow or unusable wrapping → STOP & ASK before changing the tab bar.

### 3. `AdminSidebar.tsx` — VERIFY-ONLY (respect §26.6)
Close button = `size="icon"` (icon-only, §26.4 exempt); Logout already `w-full justify-start`; NavItems already full-width. The mobile drawer is a left-side `Sheet` — **owner-approved §26.6 exception (NOT a bottom sheet)**; do **NOT** convert it. Verify-only; no edits expected. If a non-icon label-bearing control is found not-full-width, STOP & ASK.
**QA must OPEN the drawer first:** the rendered check has to trigger the mobile drawer open (via the hamburger/`onOpen` trigger or the story's open state) and assert full-width on Logout/NavItems **inside the opened drawer** — a closed/hidden drawer must NOT be reported as PASS.

### 4. `AdminMobileHeader.tsx` — VERIFY-ONLY
The only control is the hamburger (`size="icon"`, §26.4 exempt); the header bar is already full-width sticky. No edits expected. (Note: the historical `uk×1920 ERR_NO_BUFFER_SPACE` cell was infra flake — Task 418's harness now retries it; it must render PASS, not be excused.)

### 5. `AdminUserAvatar.tsx` (edit mode) — VERIFY (likely compliant)
Edit-mode buttons (current line ~187) sit in `flex flex-col sm:flex-row gap-2`, so at `<640` they stretch full-width via flex `align-items: stretch`. Confirm with rendered evidence that Replace/Upload + Remove are genuinely full-width at 320/375/390 (no `w-auto`/`self-start`/fixed width defeating the stretch). The absolute camera button is icon-only (§26.4 exempt). Add `max-sm:w-full` only if the stretch is proven NOT to hold; otherwise verify-only.

### 6. `AdminLayout.stories.tsx` (System shell demo) — VERIFY-ONLY
Composes the real shell components; fixing #2 propagates here. Prove the `system-adminlayout--admin-toolbar` story toolbar shows full-width actions at `<640`.

**NOT in scope:**
- No primitive edits (`ui/button.tsx`, `ui/tabs.tsx`, `ui/sheet.tsx`, etc. — already §12b-compliant; verify-only).
- No §26.2 popup/overlay work, no `tableAt`/data-surface work, no locale strings, no handlers/controls/state changes.
- No conversion of the AdminSidebar drawer to a bottom sheet (§26.6 exception stands).
- Do NOT "fix" anything by weakening a story or assertion. If a real `<640` overflow or non-full-width control needs a primitive change → STOP & ASK.

---

## Positive flow (happy path)

1. Audit all six surfaces against §26.1/§26.4/§26.6; record per-component current state (compliant / fix / decision) in the session log with before/after class strings.
2. Apply the **AdminSettings Save-button** full-width fix (container-only, `sm:`-gated, preferred target shape above). Confirm `≥640` is byte-identical in intent (only `max-sm:`/`sm:` utilities added).
3. **Tab bar: leave as-is (owner-decided)** — do NOT make triggers full-width; just verify no `<640` overflow and record it in the audit table.
4. Leave AdminPageShell / AdminSidebar / AdminMobileHeader / AdminUserAvatar / AdminLayout untouched unless the audit proves a real non-compliance (then STOP & ASK before any primitive change).
5. `npx tsc --noEmit` → 0 new; `npm run lint` → 0 new; `npm run build-storybook` builds; `npm run check:stories` / `check:i18n` / `check:story-coverage` / `check:design-tokens` all PASS.
6. **Focused rendered QA:** new `scripts/task419-qa-shell-fullwidth.mjs` (model on `scripts/task417-qa-actionrows.mjs`) over the shell stories — AdminPageShell (`--with-actions`, `--multiple-actions`, `--with-tabs-and-actions`), AdminSettings (`--default`, `--locale-stress`), AdminUserAvatar (`--edit-mode`), AdminMobileHeader (`--default`), AdminSidebar (mobile drawer, **opened**), AdminLayout (`--admin-toolbar`) × **sq/en/uk/it × mobile 320/375/390** (+ a `≥640` control cell per surface to prove no desktop change). **Concrete full-width assertion — for each non-icon button/control below 640:**
   - find the nearest action/container row (the control's flex/grid parent);
   - assert the control's rendered width is **within 2px of the parent's available content width** (parent `clientWidth` minus its horizontal padding);
   - **exclude icon-only buttons** (`size="icon"` / square icon-only accessible pattern) from the full-width assertion;
   - assert **`document.documentElement`/`body` horizontal overflow is 0** (`scrollWidth <= clientWidth`).

   At `≥640`, assert the same controls are **NOT** forced full-width (i.e. unchanged). The AdminSettings tab triggers are exempt from the full-width assertion (verify overflow only). Paste the full PASS matrix.
7. **Full gate:** `npm run screenshots:assert` → expected **2520/2520, 0 FAIL** (owner runs the authoritative native gate, clause 14). Paste the executor sandbox transcript; owner confirms native.
8. Update `docs/backlog.md` (Last Session, 2–4 lines) + `responsive-storybook-inventory.md §5` (mark Slice 4b done) + write the session log with the per-component audit table and Files-Changed table. **Emit NO git commands.**

## Negative flow (every off-happy-path branch)

- **A label-bearing admin-shell control is NOT full-width at `<640`** and the fix requires editing a **primitive** → STOP & ASK; do not edit the primitive unilaterally.
- **Tab bar made full-width / `flex-1`** → forbidden (owner-decided leave-as-is for Task 419) → TASK FAILURE. The only permitted tab-bar action is rendered overflow verification; any code change to it requires a fresh STOP & ASK.
- **AdminSidebar drawer converted to bottom-sheet** → forbidden (§26.6 exception) → TASK FAILURE.
- **Any `≥640` layout shifts** (a non-`sm:`-gated change) → forbidden; every edit must be `max-sm:`/`sm:`-scoped so desktop is provably unchanged.
- **A handler, control, disabled-state, or locale string changed** → out of scope → TASK FAILURE.
- **`screenshots:assert` regresses** (any new FAIL vs the green 2520/2520 baseline) → do NOT weaken assertions; report and STOP & ASK.
- **Forcing single-row full-width tabs that overflow at 320** with `uk`/`it` labels → forbidden (manufactures a `<640` overflow).
- **Scope creep** into §26.2 popups, data surfaces, or non-shell files → forbidden.

---

## Required validation (paste in the session log)

- `npx tsc --noEmit` 0 new · `npm run lint` 0 new · `npm run build-storybook` builds.
- `check:stories` / `check:i18n` / `check:story-coverage` / `check:design-tokens` all PASS (0 new).
- Focused `scripts/task419-qa-shell-fullwidth.mjs` matrix: full PASS, with before/after class strings for the AdminSettings Save fix and a `≥640`-unchanged control cell per surface.
- `npm run screenshots:assert` = 2520/2520, 0 FAIL (executor sandbox transcript; owner-native is the verdict, clause 14).
- File-integrity (clause 14) on every touched file: 0 NUL, no BOM, tail re-read.
- Per-component audit table (compliant / fixed / decision) in the session log.

## Acceptance criteria

- Every label-bearing interactive control in the admin shell is full-width at `<640` (320/375/390 × sq/en/uk/it) with rendered evidence; icon-only controls documented as §26.4 exempt; AdminSidebar drawer left as the §26.6 exception.
- AdminSettings Save button full-width at `<640`, unchanged at `≥640`; no handler/label/state change.
- Tab bar left as-is (owner-decided); no full-width/`flex-1` change; rendered overflow verified clean at 320/375/390 × sq/en/uk/it and recorded in the audit table.
- No primitive edited; no `≥640` layout change; no §26.2 / data-surface / locale / handler change.
- `tsc=0 new`, `lint=0 new`, all governance gates PASS, `screenshots:assert` 2520/2520, file-integrity GREEN.
- `docs/backlog.md` + `responsive-storybook-inventory.md §5` + session log updated; Files-Changed table matches the real diff. Executor emits NO git commands.

## Ordering

419 (Slice 4b, this) → orchestrator diff review → owner-native `screenshots:assert` 2520/2520 (clause 14) → commit (explicit paths: the edited shell component(s) + `scripts/task419-qa-shell-fullwidth.mjs` if tracked + `docs/backlog.md` + `responsive-storybook-inventory.md` + the 419 session log; scratch `task4xx-*.mjs`/`*.txt` EXCLUDED). Then **Slice 5** (public/listing/system 2xl grid + container audit). **Slice 6 proper** (NEW harness DOM assertions for button full-width + popup bottom-sheet — owner approval required before editing `check-stories-rendered.mjs`) remains separate. Then resume **Epic JJ 408 → 407**.
