# Kickoff prompt — Task 180 (Sprint 9 — N.3: admin↔site two-way locale persistence)

> Note 31: an admin/moderator who picked a non-default locale keeps it on entering admin — but the moment
> they toggle a filter on an admin page, the locale snaps back to default. Task 105 added middleware
> cookie sync site↔admin; this regresses on admin filter changes. The chosen locale is the single
> authority and must persist across filter toggles and navigations, both directions.

```
You are Claude Code Sonnet 4.6 working in `lero-al`.

Hard contract:
- Do NOT change scope: admin-page locale persistence on filter toggle + two-way sync. Not the string
  audit (Task 179), not `<html lang>` (Task 184).
- Do NOT invent architecture. Build on the Task 105 middleware/cookie sync; no new locale store.
- No fake fix: do NOT force a reload or clear cookies to "reset" locale (Auth/Navigation Safety rules).
  Find why the filter toggle drops the locale and fix it at the source.
- Update docs/backlog.md + add docs/sessions/2026-05-22-task-180-admin-locale-persistence.md.
- 0 new lint/typecheck errors; governance PASS; all four locales; all 7 breakpoints (admin shell).
- Commit + push: SINGLE `git add -A`, then `git log -1` (paste real output). Owner runs git/SQL.

Pre-read:
- Task 105 session log (2026-05-19-task-105-locale-persistence-admin.md) — the cookie-sync design
- the middleware (locale cookie), src/components/shared/LocaleSwitcher.tsx
- admin pages that have filters (the ones that lose locale on toggle) + how they build their
  navigation/URLs on filter change (look for router.push/replace that may drop the locale segment/cookie)
- docs/state-authority.md, docs/ai-behavior.md (Navigation Safety + Filter anti-patterns)

Required investigation:
1. Reproduce: set a non-default locale, enter an admin page, toggle a filter → observe the reset. Find
   the navigation that fires on toggle and whether it preserves the locale segment/cookie.
2. Fix so the active locale is preserved through the filter-change navigation and persisted (cookie),
   keeping site↔admin in sync both ways.

Acceptance criteria:
- Toggling any admin filter does NOT change the active locale.
- Chosen locale persists across admin navigations and equals the site locale (two-way).
- Root-caused (no reload/cookie-clear hack).
- 0 new lint/typecheck errors; npm run build passes; all four locales; all 7 breakpoints.

Out of scope:
- String mixing audit (Task 179); `<html lang>` (Task 184).
```
