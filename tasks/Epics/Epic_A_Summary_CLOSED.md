# Epic A — Localization & Locale Consistency

**Status:** CLOSED ✅
**Opened:** 2026-05-19
**Closed on:** 2026-05-19
**Plan:** [`Epic_A_Localization_and_Locale_Consistency.md`](./Epic_A_Localization_and_Locale_Consistency.md)
**Epic commit:** `c2f3ecd97` — *feat(Epic A): localization & locale consistency — Tasks 103–106*

---

## Completed tasks (4 / 4)

| Task | Subtask | Title | Session log |
|---|---|---|---|
| Task 103 | A.1 | Full audit of all four locale files + locale-aware API error contract | [link](../../docs/sessions/2026-05-19-task-103-locale-audit.md) |
| Task 104 | A.2 | Canonical language names + currency-code policy | [link](../../docs/sessions/2026-05-19-task-104-language-names-currency-policy.md) |
| Task 105 | A.3 | Persist selected locale between public site and admin (cookie + middleware sync) | [link](../../docs/sessions/2026-05-19-task-105-locale-persistence-admin.md) |
| Task 106 | A.4 | Move mobile locale switcher to header as canonical Combobox | [link](../../docs/sessions/2026-05-19-task-106-mobile-locale-switcher-header.md) |

---

## Final epic state

- **Lint:** 0 errors / 5 pre-existing warnings (every task at baseline)
- **Governance — localization:** ✅ PASS at every task (C0 / H0 / M18 baseline)
- **i18n key balance:** **862 per locale** (sq / en / uk / it identical) — up from 826 at Sprint 1 close (+36 keys from the new error-code namespace introduced in Task 103)
- **API error contract:** Server returns stable English error codes (`no_file`, `invalid_type`, `file_too_large`, `db_save_failed`, etc.); client resolves to localized text via `t()`. Implemented end-to-end on `/api/upload-avatar`. Sprint 1 carry-over #1 RESOLVED.
- **Locale persistence site ↔ admin:** Middleware syncs `admin-locale` cookie on every public-site request when locale changes. `httpOnly: true`. SSR-safe (admin layout reads cookie before render). No hydration mismatches.
- **Mobile UX:** Locale switcher promoted to the header as a canonical `Combobox` (`portal`, 44px touch target). Removed from the hamburger drawer.
- **Policy updates:** 3 rules formalized in `docs/ai-behavior.md` § Localization (i18n) Rules (Task 104).
- **Build:** `npm run build` was NOT run as part of the epic (per project policy — user runs manually).

---

## Sprint 1 carry-over — closed by Epic A

✅ **Italian server / API error strings.** Sprint 1 only patched UI strings via `tc(...)`. Task 103 introduced a stable error-code contract: API routes and server actions now return English keys (`no_file`, `invalid_type`, `file_too_large`, `db_save_failed`, `save_failed`, etc.) and the client translates them via `t()`. `/api/upload-avatar` is the reference implementation; future routes follow the same shape. The audit also caught two client-display bugs in `AdminUserProfile.tsx` (create-mode avatar toast + delete-action error) and fixed them as part of A.1.

---

## Carry-over to next epics (from Epic A)

1. **`governance:primitives` H:+30 pre-existing debt** — unchanged since Sprint 1; belongs in **Epic K** or a standalone primitive-audit task.
2. **Dead-code server actions** — `uploadCabinetAvatar` (cabinet) and `uploadUserAvatar` (admin) have no remaining callers since `/api/upload-avatar` superseded them. Schedule a cleanup task (chore, ~30 min).

---

## Verification — what was checked at closure

- [x] Tasks 103, 104, 105, 106 each have a session log under `docs/sessions/`.
- [x] All four session logs report lint pass + `governance:localization` PASS.
- [x] One epic-scoped commit `c2f3ecd97` ties all tasks together.
- [x] `docs/backlog.md` updated: Last Session shows Task 106 → 103 chain, plus 4 Session Archive rows.
- [x] All four locale files have identical key sets (862).
- [x] Currency codes (`ALL`, `EUR`, `USD`) are not wrapped in `t()` anywhere.
- [x] No new lint warnings introduced; existing 5 warnings are pre-existing.
- [x] Sprint 1 carry-over #1 (Italian API errors) is resolved end-to-end.

---

## Lessons

- A **single epic-scoped commit** (`c2f3ecd97`) made sense here because the four tasks share the same i18n surface and the changes are correlated. Reviewable diff is large but coherent. For future heterogeneous epics (e.g. Epic B touching auth + agent + companies + admin), prefer per-task commits.
- The **server-side error-code contract** is now the canonical pattern: server returns stable codes, client resolves via `t()`. New API routes added in later epics (Email D, Trust C, Companies B, etc.) MUST follow this contract from the start.
- **Cookie hardening** (`httpOnly: true`) during A.3 is a small but important security improvement — the locale cookie no longer needs JS access since middleware handles all sync.
