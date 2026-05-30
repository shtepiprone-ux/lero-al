# Sprint 24 — Task 316 kickoff (Epic II Phase 1 — Project-wide dynamic-key + missing-key i18n audit)

> **Mandatory rules:** `docs/agent-contract.md` clauses 1, 2, 6a, 9, 10. Sonnet writes "Files Changed" table; orchestrator emits commits.

> **Shared hard contract:** You are Claude Code Sonnet 4.6 in `lero-al`. Read `docs/agent-contract.md` FIRST. This is a **PURE AUDIT/SPEC TASK — no production code, no script edits**. Pre-read `docs/orchestrator-role.md`, `docs/ai-behavior.md` (i18n + Notes 18), `docs/component-rules.md`, `docs/qa-rules.md`, `tasks/Epics/Epic_II_Global_i18n_Hardening.md`, `docs/sessions/2026-05-29-task-288-i18n-hardcode-audit.md` (Task 288 — static hardcode precedent). No scope change; STOP & ASK if ambiguous.

> **Numbering:** Task 316 is Epic II Phase 1 task #1. NOT blocked on Epic HH owner decisions — Epic II Phase 1 ships standalone per owner directive 2026-05-30.

---

```
Type:        audit/spec (DOCUMENTATION ONLY — no production code, no script changes, no migration)
Priority:    HIGH (blocks Epic II Phase 2 remediation — Tasks 319/320/321/322)
Area:        project-wide i18n — every dynamic t(`...${var}`) call site + per-locale missing-key matrix
```

## Why this task exists

Task 288 (2026-05-29) burned down STATIC hardcoded strings. Task 300 (Sprint 21) ships an emergency hotfix for one specific missing-key class (`admin.support.role_*` + `support_status_*`). But the underlying class of bug — DYNAMIC `t()` calls with no parity guard — is unaudited project-wide. Every `t(\`role_${role}\`)`, `t(\`status_${state}\`)`, `t(\`type_${kind}\`)` etc. is a potential runtime `MISSING_MESSAGE` waiting to happen the next time a new enum value lands without locale files being updated.

This task statically enumerates every dynamic `t()` call and cross-references each against the 4 locale files. Output is a remediation list + audit report. **Phase 2 (Task 320) fills the gaps; Task 316 just identifies them.**

## Goal

Produce **`docs/governance-reports/2026-05-31-i18n-dynamic-key-audit.md`** (NEW; date = actual run date) containing:

1. **Per-call-site inventory** — every dynamic `t()` call in the repo (file:line, namespace, template, source enum / variable).
2. **Per-call-site enumeration** — every possible resolved key based on the source enum / array / union type.
3. **Per-locale missing-key matrix** — for each enumerated key, ✅ / ❌ in `sq` / `en` / `uk` / `it`.
4. **Raw-key leakage risks** — any place a fallback string could leak `namespace.key` to the user (no fallback → MISSING_MESSAGE error visible; or fallback that silently shows the key).
5. **Remediation buckets** — group missing keys by namespace + by source enum for Task 320 (Phase 2) batches.

Plus **`docs/i18n-rules.md`** (NEW) — canonical rules document with sections:
- Dynamic `t()` pattern requirements (source enum citation, no untyped variable templates).
- Locale parity rule (all four files always).
- Static-key fallback policy (when `t()` may have a default arg).
- Notification / email / toast / modal i18n hardening checklist (placeholder sections; Tasks 318/321/322 extend).

**NO production code changes.** **NO script changes.** **NO new locale keys** (Task 320 fills them in Phase 2). **NO `messages/*.json` edits.**

## Current behavior to preserve (Note 19)

Audit-only — no behaviour changes. But the audit must capture the EXISTING runtime behaviour (which keys leak, which throw, which silently fallback) so Phase 2 remediation knows what each gap looks like.

## Required investigation (PASTE summary in session log)

```
# 1. Find every dynamic t() template call
grep -rEn 't\(`[^`]*\$\{' src/ | head -80
grep -rEn 't\(`[^`]*\$\{' src/ | wc -l    # total count

# 2. Find every t(variableExpression) call (rare but possible)
grep -rEn 't\(\s*\w+\s*[),]' src/ --include='*.tsx' --include='*.ts' | head -40

# 3. For each call site, identify the source enum / array / type
#    Example for AdminSupportManager.tsx t(`role_${user.role}`):
sed -n '<line>' src/types/database.ts   # find UserRole union type

# 4. Build per-locale key inventory
python3 -c "
import json
for loc in ['sq','en','uk','it']:
    with open(f'messages/{loc}.json') as f: data = json.load(f)
    print(f'{loc}: top-level={list(data.keys())[:20]}')
"

# 5. Read Task 288 (static hardcode audit) precedent
cat docs/sessions/2026-05-29-task-288-i18n-hardcode-audit.md | head -80

# 6. Read existing check:i18n script if any
cat scripts/check-i18n* 2>/dev/null || cat scripts/governance/i18n* 2>/dev/null || echo "no existing scanner"
ls -la scripts/governance/ scripts/check-* 2>&1 | head -20

# 7. Sanity check Task 300 context (admin.support.role_* / support_status_*)
grep -n 'role_user\|support_status_open\|complaint_type_' messages/sq.json messages/en.json messages/uk.json messages/it.json | head -10
```

After investigation, paste:
- Total dynamic `t()` call site count + per-file distribution.
- Sampled examples per pattern (`role_${...}`, `status_${...}`, `type_${...}`, `*_label`).
- Per-namespace missing-key totals.
- Estimated Phase 2 remediation effort (number of keys × 4 locales = total string additions).

## Scope (files Sonnet may touch)

- `docs/governance-reports/2026-05-31-i18n-dynamic-key-audit.md` (NEW; adjust date if run later — task number stays 316)
- `docs/i18n-rules.md` (NEW)
- `docs/sessions/2026-05-31-task-316-i18n-dynamic-key-audit.md` (NEW; adjust date)
- `docs/backlog.md` (closure entry)
- OPTIONAL: extend `docs/ai-behavior.md` i18n section with a forward reference to `docs/i18n-rules.md` (1-paragraph addition only)

**MUST NOT touch:**
- Any file under `src/`
- Any file under `messages/` (Task 320 fills missing keys in Phase 2)
- Any file under `scripts/` (Task 317 writes the scanner script)
- Sprint 21 / 22 / 23 files
- Canonical primitives
- DB / RLS

**Maximum SOURCE-FILE delta: 0.** If you touch `src/`, STOP & ASK.

## Acceptance criteria (literal)

- `docs/governance-reports/2026-05-31-i18n-dynamic-key-audit.md` exists with the 5 sections from Goal #1.
- `docs/i18n-rules.md` exists with the 4 sections from Goal #2.
- Per-call-site inventory covers EVERY dynamic `t()` call in `src/` (grep-verifiable count matches the inventory size).
- Per-call-site enumeration cites the source enum / type for each — no "unknown source" entries.
- Per-locale missing-key matrix is exhaustive (every enumerated key × 4 locales = full matrix).
- Raw-key leakage analysis identifies which call sites lack a fallback string vs. which silently show the raw key.
- Remediation buckets for Task 320 are concrete (namespace + key list per batch).
- Zero source / locale / script / migration changes.
- `npx tsc --noEmit` → 0. `npm run build` → passes. `npm run lint` → 0/0. `npm run governance:tailwind` → C0/H0/M0.
- Note 18 self-validation block + AC self-audit table + "Files Changed" table.
- Verdict line: `Self-validation: tsc=0 · build=passes · lint=0/0 · dynamic-t-call inventory complete (N sites) · per-locale missing-key matrix shipped · i18n-rules.md scaffold shipped · src diff=empty · Phase 2 remediation buckets ready · PASS`.

## Out of scope

- Filling missing keys — Task 320 (Phase 2).
- Writing the scanner script — Task 317 (Phase 1).
- Notification locale-binding audit — Task 318 (Phase 1).
- Email template i18n audit — Task 321 (Phase 2).
- Toast / modal i18n audit — Task 322 (Phase 2).
- CI gate wiring — Task 323 (Phase 3).
- Any source / locale / script edit.
- Re-litigating static hardcode work from Task 288.

## Final report required

1. Files Changed table.
2. Total dynamic `t()` call site count + per-file distribution.
3. Per-call-site inventory matrix (file:line | namespace | template | source enum).
4. Per-locale missing-key matrix per enumerated key.
5. Raw-key leakage risk list.
6. Remediation bucket recommendations for Task 320.
7. AC-by-AC self-audit table.
8. Confirmation no source / locale / script file was edited.

Do NOT emit git commands. Do NOT run git. Do NOT touch source / locale / scripts. STOP & ASK if any call-site source cannot be statically resolved.
