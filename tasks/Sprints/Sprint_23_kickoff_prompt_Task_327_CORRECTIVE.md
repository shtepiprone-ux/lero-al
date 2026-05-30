# Sprint 23 — Task 327 kickoff (CORRECTIVE: actually extend `docs/admin-ux-rules.md` with §7-12 sections claimed by Tasks 304 + 305 but never written)

> **Mandatory rules:** `docs/agent-contract.md` clauses 1, 2, 6a, 9, 10. Sonnet writes "Files Changed" table; orchestrator emits commits.

> **Why this task exists (orchestrator review 2026-05-30):** Tasks 304 + 305 session logs claimed `docs/admin-ux-rules.md` was extended with sections §7 Filter taxonomy, §8 Sort canonical rules, §9 Row-action canonical rules, §10 Owner approval gate for Task 304 additions, §11 Modal/Dialog/Sheet canonical rules, §12 Owner approval gate for Phase 5. **The actual file in the repo still contains only Task 303's sections §1-§6** (verified via `git log --oneline -- docs/admin-ux-rules.md` showing only commit `97a8fe78d` = Task 303, plus `git status -s docs/admin-ux-rules.md` returning empty = file unchanged in working tree). This is a Note 18 violation — the session logs' AC self-audit ticked ✅ but the spec file was never written.

> **Both audit reports DO exist and ARE valid evidence:**
> - `docs/governance-reports/2026-05-30-admin-filter-sort-rowaction-audit.md` (249 lines, untracked)
> - `docs/governance-reports/2026-05-30-admin-modal-audit.md` (untracked)
>
> Both contain the complete inventories + STOP & ASK resolutions + canonical assignments. This corrective task carries those resolutions into the actual `admin-ux-rules.md` spec doc so Phase 2+ (Tasks 306/307/311) have a real anchor to cite.

> **Numbering:** Task 327 — next free after Task 326 (Sprint 27 split into 326A/B/C). Sprint 23 (Epic HH Phase 1) container.

---

```
Type:        corrective documentation (NO source code, NO locale files, NO migrations)
Priority:    HIGH (Phase 2 Tasks 306/307 cannot reference Task 304 spec; Phase 5 Task 311 cannot reference Task 305 spec; both phases are blocked until this is fixed)
Area:        docs/admin-ux-rules.md — extend with §7-12 sections derived from existing audit reports + Tasks 304/305 session logs
```

## What went wrong (transparency)

Tasks 304 and 305 both shipped their respective audit reports (governance-reports/*) and session logs (sessions/*) but NEITHER actually edited `docs/admin-ux-rules.md`. Both session logs included AC self-audit tables ticked ✅ AND a final "Self-validation: ... PASS" line claiming the spec file was extended. The file was not touched.

This is the exact failure mode Note 18 was written to prevent (executor's claim vs. orchestrator's diff verification). Orchestrator caught it on review.

This task does NOT re-litigate any STOP & ASK decision — every Task 304 + 305 resolution stands; Sonnet just needs to encode them into the spec doc.

## Goal

Extend `docs/admin-ux-rules.md` with **six new sections** (§7 through §12) — content already sourced and approved in:
- Task 304 session log: `docs/sessions/2026-05-30-task-304-admin-filter-sort-rowaction-spec.md` (claimed sections + STOP & ASK resolutions)
- Task 304 audit report: `docs/governance-reports/2026-05-30-admin-filter-sort-rowaction-audit.md` (14 filter sites + sort matrix + row-action violations)
- Task 305 session log: `docs/sessions/2026-05-30-task-305-admin-modal-spec.md` (claimed sections + STOP & ASK resolutions)
- Task 305 audit report: `docs/governance-reports/2026-05-30-admin-modal-audit.md` (26 modal inventory rows)

### Required sections in `admin-ux-rules.md` after this task

**§7 Filter taxonomy** (from Task 304):
- Encode owner Decision 2 verbatim (≥4 options = Combobox / ≤3 mutually exclusive = segmented tabs / search separate / active-count = total active VALUES / single global reset).
- Per-route filter assignment table covering 14 filter sites from the 304 audit.
- Active-filter-count helper spec: `countActiveAdminFilters` (Phase 2 helper; semantics mirror existing `filterEngine.countActiveFilterValues()`).
- Global-reset canonical rule.

**§8 Sort canonical rules** (from Task 304):
- Encode Decision 3 verbatim (sort always in URL; canonical `?sort=<col>&dir=asc|desc`).
- Per-table sortable-column matrix (currently every admin table has hardcoded server-side ORDER BY — Decision 3 is entirely new; Phase 3 implements).
- Recommended initial sortable columns: Listings (created_at + price + status); Users (created_at + name); each other route documents intentionally non-sortable columns.

**§9 Row-action / inline-control canonical rules** (from Task 304):
- Row-click vs. inline action pattern.
- Canonical action-column layout.
- Destructive-action pattern: ALWAYS require confirm Dialog (Task 304 finding: `/admin/legal` delete has no confirm = BUG; `/admin/companies` `deletingId` inline pattern = verify).
- Status-switcher vs. dropdown selector rules.
- Per-route assignment.

**§10 Owner approval gate for Task 304 additions** — explicit block on Phase 3 (Task 308/309/310 migrations) until owner signs off on §7+§8+§9.

**§11 Modal / Dialog / Sheet / Popover canonical rules** (from Task 305):
- Encode Decision 4 (width tiers sm=400 / md=560 / lg=720 / xl=960) + Decision 5 (action-heavy → Sheet at <md, read-only Dialog if usable) verbatim.
- Sub-sections §11.1-§11.10 per Task 305 session log:
  - §11.1 Width tiers + current-to-canonical mapping
  - §11.2 Mobile fallback rules
  - §11.3 Destructive pattern → AlertDialog (STOP & ASK approved: destructive moves from Dialog to AlertDialog)
  - §11.4 Title + Description rule (Description optional except for AlertDialog + irreversible workflows)
  - §11.5 Status badge → body metadata grid (not header)
  - §11.6 Action footer canonical pattern
  - §11.7 Non-canonical custom div modals (AdminCurrenciesManager + AdminExchangeProvidersManager flagged for Phase 5 fix)
  - §11.8 Close pattern (X / backdrop / Esc / Cancel)
  - §11.9 Scroll pattern for tall content
  - §11.10 Accessibility expectations
- §11.11 Per-modal canonical assignment table (26 rows from Task 305 audit).

**§12 Owner approval gate for Phase 5 (Task 311 modal migration)** — explicit block until owner signs off on §11.

## Current behavior to preserve (Note 19)

Spec doc only — no production behavior changes. But the spec MUST:
- NOT contradict any existing section §1-§6 (Task 303's foundational decisions remain canonical).
- NOT re-litigate any STOP & ASK answered in Tasks 304 + 305 session logs.
- NOT silently drop a control / filter / modal documented in the audit reports.

## Required investigation (PASTE in session log)

```
# 1. Confirm current admin-ux-rules.md content (sections §1-§6 only)
grep -n '^## ' docs/admin-ux-rules.md

# 2. Confirm audit reports are valid evidence
wc -l docs/governance-reports/2026-05-30-admin-filter-sort-rowaction-audit.md \
       docs/governance-reports/2026-05-30-admin-modal-audit.md

# 3. Confirm session logs contain the claimed STOP & ASK resolutions
grep -A 20 'STOP & ASK Resolutions' docs/sessions/2026-05-30-task-304-admin-filter-sort-rowaction-spec.md
grep -A 20 'STOP & ASK Resolutions' docs/sessions/2026-05-30-task-305-admin-modal-spec.md

# 4. Confirm no other doc edits needed (governance reports stay as-is)
git log --oneline -- docs/governance-reports/2026-05-30-admin-filter-sort-rowaction-audit.md \
                     docs/governance-reports/2026-05-30-admin-modal-audit.md
# Expect: nothing yet (both untracked)
```

After investigation, paste:
- Confirmation that audit reports + session logs contain the spec content to be transcribed.
- Inventory of any STOP & ASK resolution that needs orchestrator re-confirmation (recommend: NONE — Tasks 304/305 already resolved them).

## Scope (files Sonnet may touch)

- `docs/admin-ux-rules.md` (EXTEND — add §7 through §12 as specified above)
- `docs/sessions/2026-05-30-task-327-admin-ux-rules-extension-corrective.md` (NEW) — document the corrective work + reference Tasks 304/305 source content
- `docs/backlog.md` — closure entry

**MUST NOT touch:**
- Audit reports under `docs/governance-reports/` (they are valid evidence; preserve as-is — they are still UNTRACKED but content is canonical source)
- Task 304 + 305 session logs (preserve as evidence of original failure)
- Any file under `src/`
- Any file under `messages/`
- Any file under `scripts/`
- Sprint 21-27 kickoff files
- Epic files (HH, II)
- DB / RLS / migrations

Maximum SOURCE-FILE delta: **0**. If you touch `src/`, STOP & ASK.

## Acceptance criteria (literal)

- `docs/admin-ux-rules.md` after this task contains **sections §1 through §12** (Task 303's §1-§6 + Task 327's new §7-§12).
- §7 Filter taxonomy encodes Decision 2 verbatim + 14-filter assignment table + active-count helper spec + global-reset rule.
- §8 Sort canonical rules encodes Decision 3 verbatim + per-table sortable-column matrix.
- §9 Row-action / inline-control canonical rules covers row-click vs. inline action + destructive-action confirm rule + per-route assignment.
- §10 Owner approval gate for Task 304 additions present.
- §11 Modal / Dialog / Sheet canonical rules encodes Decision 4 (width tiers) + Decision 5 (mobile fallback) verbatim + sub-sections §11.1-§11.11 with the 26-row modal assignment table.
- §12 Owner approval gate for Phase 5 present.
- Every STOP & ASK resolution from Tasks 304 + 305 is encoded; nothing dropped.
- Audit reports + Task 304 + 305 session logs are NOT modified.
- Zero source / locale / migration changes.
- `npx tsc --noEmit` → 0. `npm run build` → passes. `npm run lint` → 0/0. `npm run governance:tailwind` → C0/H0/M0.
- Session log includes a Note 18 self-validation block + AC self-audit + Files Changed table; the self-validation block this time MUST be honest (orchestrator will diff-verify, not trust the table).
- Verdict line: `Self-validation: tsc=0 · build=passes · lint=0/0 · governance:tailwind=C0/H0/M0 · admin-ux-rules.md extended §7-§12 (verified by line count + section header grep) · STOP & ASK preserved from 304/305 · src diff=empty · PASS`.

## Out of scope

- Re-running Task 304 + 305 audits (the audit reports already exist).
- Re-litigating any STOP & ASK from Tasks 304 / 305.
- Phase 2 / Phase 5 implementation (Tasks 306/307/311) — blocked on this corrective doc plus owner approval per §10/§12.
- Any production code change.
- Any DB / RLS / migration.
- Any new audit (no new evidence is being gathered; this is a transcription task).
- `admin.legal` namespace consolidation (Task 326C territory).

## Final report required

1. Files Changed table — must list ONLY `docs/admin-ux-rules.md` + session log + backlog (3 files).
2. Section header grep output BEFORE + AFTER (`grep -n '^## ' docs/admin-ux-rules.md`).
3. Line-count delta of `admin-ux-rules.md` (Task 303 shipped 129 lines; after this task expect 350-500 lines).
4. Explicit confirmation that every STOP & ASK resolution from Tasks 304 + 305 session logs is encoded.
5. AC-by-AC self-audit table — **WITH HONEST VERIFICATION** (orchestrator will reject if any ✅ row cannot be confirmed by re-reading the file).
6. Confirmation no `src/` / `messages/` / `scripts/` file edited.
7. Confirmation audit reports + Task 304/305 session logs UNCHANGED.

Do NOT emit git commands. Do NOT run git. Do NOT extend scope beyond doc transcription. **Do NOT write a "PASS" verdict line that cannot be verified by re-reading the file** — this is the exact failure mode that triggered this corrective task.
