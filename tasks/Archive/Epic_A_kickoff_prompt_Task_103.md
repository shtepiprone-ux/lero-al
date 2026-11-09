# Kickoff prompt — Task 103 (Epic A.1)

> Copy-paste the block below into Claude Code (Sonnet 4.6) to start Epic A.

---

```
You are Claude Code Sonnet 4.6 working in the `lero-al` project.

Context:
We are starting Epic A — Localization & Locale Consistency.
The previous completed task is Task 102 (Sprint 1 — Remove Google Translate and DeepL APIs).
Sprint 1 is CLOSED. See:
- tasks/Sprints/Sprint_1_—_Summary_CLOSED.md
- docs/sessions/2026-05-19-sprint-1-bugfix-continuation.md

This task must be documented as Task 103.
Do not rename it to Task A.1.
Preserve global task numbering.

Sprint 1 left two carry-over items relevant to this epic:
1. Italian / API server-side error strings remain hardcoded Ukrainian. UI layer was patched via tc(...) keys in Task 91. Task 103 (Epic A.1) MUST extend the audit to API routes and server actions, not only UI strings.
2. (Out of scope here: H:+30 governance:primitives debt — belongs to Epic K, not Epic A.)

Required pre-read before implementation:

1. Read tasks/Epics/Epic_A_Localization_and_Locale_Consistency.md — the epic plan, especially Task A.1 scope and acceptance.
2. Read docs/backlog.md — current state and Last Session summary.
3. Read docs/ai-behavior.md, especially:
   - Canonical Task Template
   - Localization Rules
   - Pre-Task Mandatory Checklist
   - Backlog & Session Log Rules
4. Read always-governed rules: docs/env.md, docs/rls-rules.md, docs/component-rules.md.
5. Read task-relevant docs:
   - docs/integrations.md (next-intl setup)
   - docs/architecture.md (locale routing and middleware)
   - docs/data-access-rules.md (API route conventions — needed for API-error audit)
   - docs/qa-rules.md
6. Read all four locale files: messages/sq.json, messages/en.json, messages/uk.json, messages/it.json.
7. Read src/i18n/* and any middleware (src/middleware.ts) that resolves the active locale.
8. Inspect existing API routes for hardcoded error strings (start with src/app/api/upload-avatar/ and any admin action routes referenced in Task 91 session log).
9. Inspect package.json for the validation scripts (lint, build, governance:localization, typecheck, test).

Localization coverage required for this task:
- sq, en, uk, it
- All four message files must have identical key sets.
- Mixed-language values flagged and remediated.
- Currency codes (ALL, EUR, USD) must NOT pass through t().
- API/server error strings must be locale-aware (resolution path: either route accepts a locale param/header, or returns a key that the client translates).

Responsive coverage required:
- Audit itself does not change layout, but the validation step must confirm runtime locale switch at:
  320, 375, 390, 768, 1280, 1440, 2560
- At least one screen per namespace verified across all four locales.

Task scope (Task 103 — Epic A.1):

1. Produce a written audit report at docs/sessions/2026-05-19-task-103-locale-audit.md (or the actual run date) listing:
   - per-locale key counts and any deltas
   - keys with mixed-language values
   - keys where currency codes are wrapped in t()
   - every API route / server action that emits hardcoded non-key strings (this is the Sprint 1 carry-over)
2. Remediate the defects found in messages/*.json (rename / move / re-translate keys; preserve set equality across the four files).
3. For API / server-action error strings:
   - Decide on a contract: either (a) accept locale and look up the key on the server, or (b) return an error_key that the client resolves via t().
   - Document the decision in the audit report.
   - Implement at least one example route end-to-end (suggested: src/app/api/upload-avatar) so the contract is real, not just documented.

Acceptance criteria:
- Identical key sets across sq / en / uk / it (key count match documented in session log).
- Zero mixed-language values.
- Zero currency codes wrapped in t().
- API/server-action error contract decided, documented, and applied to at least one route.
- 0 new lint errors / 0 new warnings.
- npm run governance:localization PASSes at baseline or better.
- npm run build is the user’s manual step — do not block on it.
- Update docs/backlog.md "Last Session" block + add Session Archive row.
- Add a session log file under docs/sessions/.

Out of scope:
- Other Epic A tasks (A.2 language names, A.3 locale persistence, A.4 mobile switcher) — do not start them in this task.
- Refactoring the next-intl architecture beyond what the carry-over fix requires.
- Touching governance:primitives H:+30 debt (belongs to Epic K).

Follow every other rule in docs/ai-behavior.md. Do not skip the Pre-Task Mandatory Checklist. Do not start Task 104 or any other Epic A task in this run.
```

---

## After Task 103 closes

Next in queue:
- **Task 104** — Epic A.2 — Canonical language-name translations + currency-code policy
- **Task 105** — Epic A.3 — Persist selected locale between public site and admin
- **Task 106** — Epic A.4 — Move mobile locale switcher to header

Each subsequent task gets its own kickoff prompt following the same template (just swap the task number, epic-subtask reference, and acceptance criteria).
