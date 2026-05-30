# Sprint 23 — Task 305 kickoff (Epic HH Phase 1 — Admin modal / dialog / popover / sheet canonical spec)

> **Mandatory rules:** `docs/agent-contract.md` clauses 1, 2, 6a, 9, 10. Sonnet writes "Files Changed" table; orchestrator emits commits.

> **Shared hard contract:** You are Claude Code Sonnet 4.6 in `lero-al`. Read `docs/agent-contract.md` FIRST. This is a **PURE AUDIT/SPEC TASK — no production code**. Pre-read `docs/orchestrator-role.md`, `docs/ai-behavior.md` (Notes 18/19/20/21/22/23), `docs/ui-rules.md`, `docs/component-rules.md`, `docs/tailwind-canonical-fragments.md`, `docs/qa-rules.md`, `tasks/Epics/Epic_HH_Admin_UX_System.md` (APPROVED owner decisions 4 + 5), `docs/sessions/2026-05-29-task-282-design-system-lockdown.md` (canonical Dialog/Sheet/Tabs precedent), `docs/sessions/2026-05-24-task-201-email-template-modal-width.md` (modal-width precedent). No scope change; STOP & ASK if ambiguous.

> **Numbering:** Task 305 is Epic HH Phase 1 task #3. Active now because owner approved Decisions 4 + 5 on 2026-05-30.

> **⚠️ 2026-05-30 owner directive (`issues2.md`):** Task 305 MUST consume Task 303 evidence (the per-route × per-breakpoint × per-locale audit matrix with severity tags) and produce CONCRETE canonical modal rules anchored to specific Task 303 findings + this task's own modal inventory. Abstract / generic spec language is forbidden — every rule cites either a Task 303 audit row or a Task 305 modal inventory row that motivated it. If a proposed rule has no anchor, STOP & ASK.

---

```
Type:        audit + canonical spec (DOCUMENTATION ONLY — no production code, no migration, no copy changes)
Priority:    HIGH (blocks Phase 5 modal standardisation; also informs Phase 2 primitives and Phase 3+ page migrations)
Area:        every admin modal / dialog / popover / sheet — width tier + mobile fallback assignment
```

## Why this task exists

Owner approved on 2026-05-30:

**Decision 4 — Modal width tiers (CONFIRMED):**
| Tier | Width | Typical use |
|---|---|---|
| `sm` | 400px | Confirmation dialogs, single-field prompts |
| `md` | 560px | Standard create / edit forms |
| `lg` | 720px | Multi-section forms, detail panels with sidebar |
| `xl` | 960px | Wide editors, content management modals |

**Decision 5 — Mobile modal fallback:**
- Action-heavy create / edit / destructive workflows below `md:` → Sheet (bottom drawer) OR full-height Sheet (mandatory when modal has form fields, pickers, or multi-step actions)
- Read-only detail surfaces → may remain `Dialog` if usable at 320/375/390
- If a Dialog reproduces overflow / clipping at 320 → spec recommends Sheet / full-screen fallback (no implementation in Task 305)

This task audits every admin Dialog / Sheet / Popover / AlertDialog / DropdownMenu (when used as a modal-like surface), classifies each by:
- current width / `max-w-*` class
- proposed canonical tier (sm/md/lg/xl)
- current mobile behaviour (Dialog or Sheet today)
- proposed mobile fallback (Dialog stays / migrate to Sheet / migrate to full-height Sheet)
- artifacts / spacing / accessibility issues observed

Output is a spec doc + audit report. **No implementation.** Phase 5 (Task 311) applies the spec.

## Goal

Extend `docs/admin-ux-rules.md` (created by Task 303, extended by Task 304) with a new section:

**"Modal / Dialog / Sheet / Popover canonical rules"** — encode Decisions 4 + 5 verbatim; per-modal width-tier assignment; per-modal mobile-fallback assignment; canonical action-footer pattern; canonical destructive-action confirmation pattern; canonical title + description pattern; canonical scroll behaviour for tall content; accessibility expectations (focus trap, escape, backdrop click, return-focus); status-badge-inside-modal pattern.

Plus produce **`docs/governance-reports/2026-05-30-admin-modal-audit.md`** (NEW; date = actual run date) — the audit data behind the spec.

**NO production code changes.** **NO source files in `src/` touched.** **NO migrations.** **NO locale changes.**

## Current behavior to preserve (Notes 19 + 20)

For every admin modal inventoried, capture:
- trigger button / link / action (where it opens from)
- current width class (`sm:max-w-sm` / `sm:max-w-2xl` / etc.)
- current mobile behaviour (Dialog stays, or already a Sheet)
- title text + description text (existing locale keys, no copy edits)
- form fields / content blocks
- footer action buttons (primary, secondary, destructive)
- close pattern (X button / backdrop / Esc / Cancel)
- success state (toast / inline / redirect)
- error state
- whether it currently has artifacts / clipping / overflow at 320

The spec assignment must accommodate every captured behaviour. If a proposed tier or mobile fallback drops a capability, route as STOP & ASK.

## Required investigation (PASTE summary in session log)

```
# 1. Inventory every admin Dialog usage
grep -rn '<Dialog\|<DialogContent\|<DialogHeader\|<DialogFooter\|<DialogTitle' src/components/admin/ src/app/admin/ src/modules/admin/ | head -80

# 2. Inventory every admin Sheet usage
grep -rn '<Sheet\|<SheetContent\|<SheetHeader' src/components/admin/ src/app/admin/ src/modules/admin/

# 3. Inventory admin AlertDialog (destructive confirm)
grep -rn '<AlertDialog\|<AlertDialogContent' src/components/admin/ src/app/admin/ src/modules/admin/

# 4. Inventory admin Popover (where used as modal-like surface)
grep -rn '<Popover\|<PopoverContent' src/components/admin/

# 5. Inventory current max-w-* classes on Dialog/Sheet content
grep -rn 'max-w-\(sm\|md\|lg\|xl\|2xl\|3xl\|4xl\|5xl\|6xl\)\|max-w-\[' src/components/admin/ | head -40

# 6. Render every admin modal in dev at 320/375/390 in `uk` (longest labels). Capture: overflow / clipping / scroll-jank / off-screen artifacts per modal.
#    Repeat at 768 / 1280 / 1440 / 2560 to confirm desktop tier choice.

# 7. Cross-reference Task 282 (Design System Lockdown) for canonical Dialog/Sheet migrations
cat docs/sessions/2026-05-29-task-282-design-system-lockdown.md
```

After investigation, paste:
- Per-modal inventory matrix (trigger → component → current width → current mobile → content type → action footer pattern)
- Per-modal proposed tier (sm/md/lg/xl) + 1-line rationale
- Per-modal proposed mobile fallback (Dialog / Sheet / full-Sheet) + 1-line rationale
- Artifacts/clipping/overflow findings per modal at 320

## STOP & ASK before finalising the spec

Before extending `admin-ux-rules.md`:
1. **Tier boundary calls** — for any modal whose content is on the boundary between two tiers (e.g. md vs. lg), justify the call and STOP & ASK if owner preference differs.
2. **Mobile fallback edge cases** — for a modal that is partly read-only + partly action, propose Sheet OR keep Dialog with an embedded scroll container. STOP & ASK.
3. **Destructive-action canonical** — propose ONE pattern: `<AlertDialog>` separate from create/edit `<Dialog>` vs. `<Dialog>` with destructive variant footer. STOP & ASK.
4. **Title + description rule** — propose canonical: Title required, Description optional, both via existing canonical primitives. STOP & ASK if any admin modal lacks one and it should be added (no implementation here — just flag for Phase 5).
5. **Status badge inside modal** — observed admin pattern: status badge in modal header. Confirm canonical placement (header right vs. body top vs. footer left).

Do NOT silently pick defaults — every contested call goes to STOP & ASK.

## Scope (files Sonnet may touch)

- `docs/admin-ux-rules.md` (EXTEND — add one new section "Modal / Dialog / Sheet / Popover canonical rules")
- `docs/governance-reports/2026-05-30-admin-modal-audit.md` (NEW; adjust date if run later — task number stays 305)
- `docs/sessions/2026-05-30-task-305-admin-modal-spec.md` (NEW; adjust date)
- `docs/backlog.md` (closure entry)

**MUST NOT touch:**
- Any file under `src/` (including `Dialog.tsx`, `Sheet.tsx`, `AlertDialog.tsx`, `Popover.tsx`)
- Any file under `messages/`
- Any file under `scripts/`
- Sprint 21 / 22 / 24 files
- Task 303 / 304 spec sections (only ADD new section, do not edit existing)
- Canonical primitives
- DB migrations / RLS

**Maximum SOURCE-FILE delta: 0.** If you touch `src/`, STOP & ASK.

## Locale + responsive coverage

- Locales: sq / en / uk / it — audit modals at all 4 to spot text-overflow / button-wrap problems.
- Breakpoints: 320 / 375 / 390 / 768 / 1280 / 1440 / 2560 — narrow-3 confirms mobile fallback proposal; tablet+ confirms tier choice.

## Acceptance criteria (literal)

- `docs/admin-ux-rules.md` has new section "Modal / Dialog / Sheet / Popover canonical rules" opening with verbatim Decision 4 (width tiers table) + Decision 5 (mobile fallback rule).
- `docs/governance-reports/2026-05-30-admin-modal-audit.md` exists with per-modal inventory matrix + per-modal proposed assignments + artifacts/overflow findings at 320.
- Every admin modal inventoried (Dialog + Sheet + AlertDialog + Popover-as-modal) — no surface omitted.
- Every modal has: proposed tier (sm/md/lg/xl) + proposed mobile fallback (Dialog/Sheet/full-Sheet) + rationale + current vs. proposed evidence.
- Action-footer canonical pattern documented (primary right vs. left, secondary placement, destructive style, mobile reflow).
- Destructive-action canonical pattern documented.
- Title + description canonical pattern documented.
- Status-badge-inside-modal canonical placement documented.
- Accessibility expectations documented (focus trap, escape, backdrop click, return-focus).
- All conflicts surfaced as STOP & ASK + resolved before the spec is finalised.
- Zero source / locale / migration changes.
- `npx tsc --noEmit` → 0 errors. `npm run build` → passes. `npm run lint` → 0/0. `npm run governance:tailwind` → C0/H0/M0.
- Note 18 self-validation block + AC self-audit table + "Files Changed" table.
- Verdict line: `Self-validation: tsc=0 · build=passes · lint=0/0 · governance:tailwind=C0/H0/M0 · admin modal spec section shipped · src diff=empty · owner approval gate set for Phase 5 · PASS`.

## Out of scope

- Modal implementation migration — Phase 5 (Task 311).
- Public-site modal audit — explicit owner-scope expansion required (not in 305).
- Any DB or server-action change.
- Any visual redesign — colors / spacing / typography of modals.
- New canonical primitives (Dialog / Sheet / AlertDialog / Popover are stable).
- Re-litigating Decisions 4 / 5.

## Final report required

1. Files Changed table.
2. Per-modal inventory matrix.
3. Per-modal tier + mobile fallback assignment + rationale.
4. Action-footer / destructive / title-description / status-badge / accessibility canonical patterns.
5. Artifacts / overflow / clipping findings per modal at 320.
6. STOP & ASK transcript.
7. AC-by-AC self-audit table.
8. Confirmation NO source file was edited.

Do NOT emit git commands. Do NOT run git. Do NOT touch source code. STOP & ASK on every contested call.
