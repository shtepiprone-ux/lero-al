# Kickoff prompt — Task 167 (Sprint 5 — dashboard status i18n: status_active / status_inactive)

> Found in post-deploy verification. The admin dashboard renders the **raw keys**
> `listing.status_active` and `listing.status_inactive` (recent-listing status badge + the
> "Статус оголошень" breakdown bars), while `sold` / `rented` / `archived` translate fine.
> Cause: the `listing` namespace is **missing** `status_active` and `status_inactive` in all four
> catalogs (it already has `status_sold`, `status_rented`, `status_archived`, `status_pending`).
> The dashboard code is correct — it calls `tl('status_active')` / `tl('status_inactive')` via the
> `listing` namespace; only the keys are absent. **This is a data (i18n) fix, not a code change.**

```
You are Claude Code Sonnet 4.6 working in `lero-al`.
Hard contract:
- Do NOT change scope; introduce NO new architecture. If anything is ambiguous or missing,
  STOP and ask — do not invent scope.
- Execute the acceptance criteria LITERALLY.
- Update docs/backlog.md + add docs/sessions/2026-05-22-task-167-dashboard-status-i18n.md.
- 0 new lint errors / 0 new warnings; typecheck has no new errors; governance gates PASS.
- Commit + push. Stage with a SINGLE `git add -A` (no `^`/backtick line continuations — they
  silently no-op in PowerShell). After committing, run `git log -1` and paste the real output.

Pre-read:
- messages/sq.json, messages/en.json, messages/uk.json, messages/it.json  (the `listing` object,
  near the existing `status_sold` / `status_rented` / `status_archived` / `status_pending` keys)
- src/app/admin/page.tsx  (StatusBar usage: tl('status_active'), tl('status_inactive'))
- src/components/admin/AdminDashboardRecentListings.tsx  (statusLabel → tl(`status_${status}`))
- (reference for wording only) the existing `cabinet.status_active` / `cabinet.status_inactive`
  values — match them exactly for consistency.

Scope:
Add two keys — `status_active` and `status_inactive` — to the `listing` namespace in ALL FOUR
catalogs, placed next to the other `status_*` keys. Use these exact values:
  - sq:  status_active = "Aktiv"     status_inactive = "Joaktiv"
  - en:  status_active = "Active"    status_inactive = "Inactive"
  - uk:  status_active = "Активне"   status_inactive = "Неактивне"
  - it:  status_active = "Attivo"    status_inactive = "Non attivo"
Do NOT touch any other namespace (cabinet, admin.email_templates) and do NOT rename existing keys.
No source-code changes are expected for this task.

Acceptance criteria:
- listing.status_active and listing.status_inactive exist in sq, en, uk, it with the values above.
- On /admin, the status-breakdown bars and the recent-listing status badge show translated labels
  (no raw `listing.status_*` text) in every locale.
- Locale parity: the four catalogs share the same key set (no key present in one and missing in
  another).
- 0 new lint/typecheck errors; governance PASS; backlog + session log updated.

Out of scope:
- Changing/renaming any other status label or namespace.
- Any dashboard/component code change.
- The Save-button fix (that is Task 168).
```
