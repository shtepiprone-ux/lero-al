# Sprint 1 — Bugfix Continuation & Admin Polish

**Status:** CLOSED ✅
**Closed on:** 2026-05-19
**Plan:** [`Sprint_1_—_Bugfix_Continuation_and_Admin_Polish.md`](./Sprint_1_—_Bugfix_Continuation_and_Admin_Polish.md)
**Sprint commit:** `4af1c0399` — *Sprint 1 (Tasks 91-102): bugfix continuation and admin polish*
**Sprint session log:** [`docs/sessions/2026-05-19-sprint-1-bugfix-continuation.md`](../../docs/sessions/2026-05-19-sprint-1-bugfix-continuation.md)

---

## Completed tasks (12 / 12)

| Task | Title | Session log | Status |
|---|---|---|---|
| Task 91 | Fix Italian locale fallback to Ukrainian | [link](../../docs/sessions/2026-05-19-task-91-italian-locale-fallback-to-ukrainian.md) | ✅ PASS (UI layer; see carry-over) |
| Task 92 | Verify and complete "Шкіп" → "албанська" language-name translations | [link](../../docs/sessions/2026-05-19-task-92-language-name-translations.md) | ✅ PASS |
| Task 93 | Full site-wide dropdown / popover clipping audit | [link](../../docs/sessions/2026-05-19-task-93-dropdown-clipping-audit.md) | ✅ PASS |
| Task 94 | Full mobile spacing & auth UI audit | [link](../../docs/sessions/2026-05-19-task-94-mobile-spacing-auth-ui-audit.md) | ✅ PASS |
| Task 95 | Active filter chip: entire button as click target | [link](../../docs/sessions/2026-05-19-task-95-filter-chip-click-target.md) | ✅ PASS |
| Task 96 | Replace "Не забувайте" in Premium empty state | [link](../../docs/sessions/2026-05-19-task-96-premium-empty-state.md) | ✅ PASS |
| Task 97 | Fix "Тип" column translation in Listings admin table | [link](../../docs/sessions/2026-05-19-task-97-type-column-translation.md) | ✅ PASS |
| Task 98 | Constrain Combobox scrollbar within dropdown bounds | [link](../../docs/sessions/2026-05-19-task-98-combobox-scrollbar.md) | ✅ PASS |
| Task 99 | Replace local Combobox in Admin User form with canonical | [link](../../docs/sessions/2026-05-19-task-99-canonical-combobox.md) | ✅ PASS |
| Task 100 | Admin User form: success toast + disable Save until changed | [link](../../docs/sessions/2026-05-19-task-100-admin-save-toast-dirty.md) | ✅ PASS |
| Task 101 | Hide "Переглянути всі" when Premium section is empty | [link](../../docs/sessions/2026-05-19-task-101-hide-view-all-empty.md) | ✅ PASS |
| Task 102 | Remove Google Translate API and DeepL API | [link](../../docs/sessions/2026-05-19-task-102-remove-translate-apis.md) | ✅ PASS |

---

## Final sprint state

- **Lint:** 0 errors / 5 warnings (all pre-existing)
- **TypeScript:** 4 pre-existing test-file errors, 0 new
- **Governance — localization:** ✅ PASS at baseline (C0 / H0 / M18)
- **Governance — responsive:** ✅ PASS at baseline
- **Governance — primitives:** MEDIUM M:8 → M:1 (**improvement**); H:+30 is pre-existing (see carry-over)
- **i18n key balance:** 826 per locale — sq / en / uk / it identical
- **Build:** `npm run build` was NOT run as part of the sprint (per project policy — user runs manually).

---

## Carry-over to Sprint 2 (or follow-up technical debt)

These items were explicitly deferred during Sprint 1 and need follow-up:

1. **Italian locale — server / API layer error strings (from Task 91).** The UI fix masks server errors via `tc('avatar_upload_error')` etc. The actual avatar / admin action API routes still return hardcoded Ukrainian strings. Should be addressed by **Epic A — Localization & Locale Consistency** (locale-aware API responses), not as another Sprint 1 patch.

2. **`governance:primitives` H:+30 pre-existing regression (from Task 94).** Sprint 1 fixed 11 `h-11`-on-Button violations but the broader pre-existing High-tier primitive debt was not touched. Sprint 1 documented this as a baseline rather than a new regression. Schedule as a **Component Governance debt task** (likely inside Epic K or as a standalone primitive-audit task).

3. **`docs/backlog.md` is now ~666 lines** — well over the ~80-line cap defined in `docs/ai-behavior.md` "Backlog & Session Log Rules". Needs a cleanup pass: keep only "Last Session" summary + "Next Immediate Tasks" + Session Archive table. Move detailed per-task blocks into their respective `docs/sessions/` files (they are already mirrored there). Standalone chore task — should run before Sprint 2 starts.

---

## Verification — what was checked at closure

- [x] Every Task 91–102 has a matching `docs/sessions/2026-05-19-task-<N>-<slug>.md` with `✅ PASS`.
- [x] Sprint summary session `2026-05-19-sprint-1-bugfix-continuation.md` exists and reflects the same 12 tasks.
- [x] `docs/backlog.md` has both per-task `Sprint 1` blocks and Session Archive rows for all 12 tasks.
- [x] Sprint commit `4af1c0399` lists all expected files (4 message files, 16+ source files, 12 session logs, 1 sprint summary, 2 backlog/risk-register updates).
- [x] All four locale JSONs have identical key counts (826).
- [x] No regressions to Sprint 0 scope (Tasks 84–90).
- [x] Governance checks pass at baseline or improve.

---

## Lessons

- Sprint 1 was delivered as a **single commit** for 12 tasks. That's acceptable when each task has its own session log, but the commit-rules in `docs/ai-behavior.md` prefer "one logical change per commit". For future sprints, consider one-commit-per-task for clearer rollback granularity.
- Server-side error strings are a **separate concern from UI strings**. The locale-aware response contract should be designed at Epic A level rather than patched per-task.
- `docs/backlog.md` already exceeded its line budget — the "Backlog & Session Log Rules" need stricter enforcement at end-of-sprint, not after each task.
