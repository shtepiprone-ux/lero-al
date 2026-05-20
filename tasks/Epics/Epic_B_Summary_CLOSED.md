# Epic B — Auth, Registration & Agent Onboarding

**Status:** CLOSED ✅
**Opened:** 2026-05-19
**Closed on:** 2026-05-20
**Plan:** [`Epic_B_Auth_Registration_and_Agent_Onboarding.md`](./Epic_B_Auth_Registration_and_Agent_Onboarding.md)

---

## Completed tasks (5 / 5)

| Task | Subtask | Title | Commit | Session log |
|---|---|---|---|---|
| Task 108 | B.1 | Side popup auth flow (`AuthSheet`) | `39f23709b` | [link](../../docs/sessions/2026-05-19-task-108-side-popup-auth.md) |
| Task 112 | B.2 | Agent city selection (`LocationCombobox` in AuthSheet) | `258875b11` | [link](../../docs/sessions/2026-05-20-task-112-agent-city-selection.md) |
| Task 113 | B.3 | Agent company selection (companies table + `CompanyField`) | `2395b1f6a` | [link](../../docs/sessions/2026-05-20-task-113-agent-company-selection.md) |
| Task 114 | B.4 | Company logo upload (validation, preview, Cloudinary) | `289c044f2` | [link](../../docs/sessions/2026-05-20-task-114-company-logo-upload.md) |
| Task 115 | B.5 | Admin company management page (CRUD, sidebar, dialogs) | `cf015ae4d` (+ fix `5e5646965`) | [link](../../docs/sessions/2026-05-20-task-115-admin-company-management.md) |

All commits are on `origin/main`.

---

## What shipped

- **Side popup auth (B.1):** canonical `Sheet`-based `AuthSheet` with three views (Login / Register / Register-as-agent), view switching in one Sheet instance, Epic A error-code contract, Google OAuth preserved, post-login `router.refresh()`.
- **Agent city (B.2):** optional canonical `LocationCombobox` (portal, no clipping) in the agent register view; reuses the existing city data source; persists to the agent profile; registration succeeds without a city.
- **Agent company (B.3):** new `companies` table (with SQL migration + RLS); `CompanyField` lets an agent pick an existing company or add a new one — replaced the temporary plain-text `company` field from Task 108.
- **Company logo (B.4):** logo upload constrained to 256×256 px, format validation (JPG/PNG/WebP), preview before save, Cloudinary path.
- **Admin company management (B.5):** `/admin/companies` page with CRUD, sidebar entry, dialogs; client-side search via inline `Input` (fix `5e5646965` replaced a non-canonical `AdminSearchInput`).

---

## Notes / decisions

- The temporary plain-text `company` field introduced in Task 108 was correctly superseded by the `CompanyField` selector in Task 113 — no leftover temp field remains.
- New `companies` table required a SQL migration (applied). Confirm it is present in the Supabase project / migrations folder before relying on company features in a fresh environment.
- Admin company management follows the existing admin table pattern (Epic K — Admin Tables Standardization — is not yet done, so B.5 used the current convention; revisit during Epic K for full canonicalization).

---

## ⚠️ Incident note (2026-05-20)

After Task 118, a working-tree corruption event truncated several files (`AuthSheet.tsx` cut to 347/600 lines, locale files −85 keys each, etc.) — NOT a real task. It was recovered via `git restore` to HEAD (Task 118). All Epic B work was already committed and pushed to `origin/main`, so nothing from this epic was lost. A phantom "Task 119" referenced during that session never existed as a commit or session log.

---

## Carry-over

- None specific to Epic B. The remaining cross-cutting item is the Epic K admin-table canonicalization (B.5's company table will be revisited there).

## Verification — checked at closure

- [x] All five subtasks have commits on `origin/main` and session logs.
- [x] `git status` clean; `npm run dev` compiles after the 2026-05-20 restore.
- [x] Temporary `company` text field replaced by canonical `CompanyField`.
- [x] `companies` table migration applied.
