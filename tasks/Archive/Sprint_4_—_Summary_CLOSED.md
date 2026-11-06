# Sprint 4 — Auth Phone Validation & Flow Consolidation — CLOSED

**Status:** COMPLETE
**Opened:** 2026-05-21
**Closed:** 2026-05-21

---

## Tasks completed

| Task | Description | Session log |
|------|-------------|-------------|
| 158 | Country-aware phone validation — single source of truth | [log](../../docs/sessions/2026-05-21-task-158-country-aware-phone-validation.md) |
| 159 | Auth flow consolidation — AuthSheet as single canonical UI | [log](../../docs/sessions/2026-05-21-task-159-auth-flow-consolidation.md) |

---

## Sprint outcome

**Problem solved:** Two parallel auth flows (AuthSheet drawer + legacy LoginForm/RegisterForm pages) with different validation logic, different error handling, and no country-aware phone validation.

**After Sprint 4:**
- Single `src/lib/phone/index.ts` module with `COUNTRY_CODES` (iso2) + `validateNationalPhone()` via libphonenumber-js — used by all 5 phone-entry surfaces
- Single `PhoneField` shared component replaces 4 local copies
- `/auth/login` and `/auth/register` are thin redirect pages that auto-open AuthSheet
- `LoginForm`, `RegisterForm`, `LoginFormClient`, `RegisterFormClient` deleted
- 25 vitest tests covering phone validation edge cases
