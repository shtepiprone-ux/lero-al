# Epic II — Task 316 kickoff — Project-wide dynamic-key + missing-key i18n AUDIT (audit/spec only, ZERO product code)

> **You are Claude Code Sonnet 4.6 in `lero-al`. Read `docs/agent-contract.md` (clauses 1–13) FIRST.** Conforms to the
> current P0 contract. **AUDIT-ONLY: produces documentation, NO product-code changes, NO new scripts (Task 317 does the
> script).** Re-issue of `tasks/Sprints/Sprint_24_kickoff_prompt_Task_316.md`, brought to the current contract.

```
Type:        audit / spec (no product code)
Priority:    high (Epic II Phase 1; the wrong-locale notification + raw-key class is systemic)
Area:        whole repo — every dynamic t() call site (admin + public + notifications + emails + toasts + DB labels)
Output:      docs/governance-reports/2026-06-XX-i18n-dynamic-key-audit.md (NEW)
```

## Goal
Statically enumerate every **dynamic** `t()` call (`t(\`...${var}\`)`, `t(\`prefix_${enum}\`)`, `t(variableExpr)`), resolve
each to its full set of possible keys from the source enum/array/object, and cross-reference against
`messages/{sq,en,uk,it}.json` to produce a **per-file, per-call-site missing-key matrix** + a raw-key-leakage risk list.
This is the evidence base Task 317 (scanner) and Task 320 (remediation) consume.

## Pre-read (mandatory)
1. `docs/agent-contract.md` (1–13) · `docs/backlog.md`
2. `docs/rule-index.md` → "Analytics / SEO task" is NOT it — use the i18n rules in `docs/ai-behavior.md` → "Localization
   (i18n) Rules" + `docs/qa-rules.md`. Read `docs/integrations.md` "Outbound email language policy" (email is sq-only).
3. `tasks/Epics/Epic_II_Global_i18n_Hardening.md` (Task 316 spec + phase plan) + `tasks/Sprints/Sprint_24_kickoff_prompt_Task_316.md`
   (original) + Task 288 session log (static hardcode audit — this is the dynamic-key layer above it).
4. The existing `scripts/check-i18n-parity.mjs` / `check:i18n` (to understand what parity already catches vs. the gap).

## Required investigation
1. Grep the repo for dynamic `t()` patterns (template literals with `${}`, variable-expression args). Cover
   `src/app`, `src/components`, `src/modules`, notification/email/toast layers.
2. For each call site: record file:line, the dynamic expression, and the **source of the variable** (which enum / union /
   array / DB column drives it), then enumerate EVERY possible resolved key.
3. Cross-reference each enumerated key against all 4 locale files; mark missing per locale.
4. Flag raw-key-leakage risks (any path where a missing key would render the literal dot-path to a user).
5. Tabulate: per-file → per-call-site → enumerated keys → missing-in-{sq,en,uk,it}.

## Acceptance criteria
- `docs/governance-reports/2026-06-XX-i18n-dynamic-key-audit.md` exists with: the dynamic-call inventory (file:line +
  expression + source enum), the full enumerated-key set per call site, the per-locale missing-key matrix, and the
  raw-key-leakage risk list.
- The notification wrong-locale class (Epic II "Скарга на ваш аккаунт" bug) is explicitly cross-referenced to Task 318.
- **ZERO product-code changes** (`git diff --stat src messages scripts` empty) — audit doc only. No new scripts (Task 317).
- `docs/backlog.md` + `docs/sessions/` updated; **Files Changed table** (the audit doc + session log + backlog only);
  **no git from executor**.

## Mobile / rendered / no-hardcode gates
- Clauses 11/12/13 are **N/A** (no UI rendered, no stories touched) — state this explicitly in the session log so the
  reviewer confirms it was considered, not skipped. Any UI remediation is Task 320 (out of scope here).

## Out of scope
- Fixing any missing key (Task 320). Writing the scanner script (Task 317). Touching notification render code (Task 319).
- Adding languages beyond sq/en/uk/it. Email language scope (stays sq-only).
