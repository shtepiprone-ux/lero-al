# Sprint 21 — Task 300 kickoff (CRITICAL: Admin Support i18n missing keys hotfix — admin.support.role_* + support_status_*)

> **Mandatory rules:** `docs/agent-contract.md` clauses 1, 2, 6a, 9, 10 (Task 264 commit hand-off). Sonnet writes "Files Changed" table; orchestrator emits commits.

> **Shared hard contract:** You are Claude Code Sonnet 4.6 in `lero-al`. Read `docs/agent-contract.md` FIRST. This is a **runtime i18n hotfix** — pre-read `qa-rules.md`, `component-rules.md` (Localization governance), `docs/sessions/2026-05-29-task-284-admin-unification.md` (closest prior context: AdminSupportManager). No scope change; STOP & ASK if ambiguous.

---

```
Type:        bugfix (i18n runtime; CRITICAL)
Priority:    CRITICAL — production console errors + raw translation keys visible on /admin/support
Area:        admin/support — AdminSupportManager.tsx — messages/{sq,en,uk,it}.json
```

## Why this task exists (2026-05-30 owner browser verification)

Owner browser validation on `/admin/support` surfaced runtime MISSING_MESSAGE console errors and raw translation keys visible in UI. Reproduced by orchestrator on 2026-05-30:

```
$ python3 -c "import json; ..." (admin.support keys per locale)
admin.support.role_*:           [] in sq/en/uk/it  ← MISSING
admin.support.support_status_*: [] in sq/en/uk/it  ← MISSING
```

AdminSupportManager.tsx uses `useTranslations('admin.support')` and calls:
- `t(\`role_${user.role}\`)` at lines 112 + 224 — needs `role_user`, `role_agent`, `role_moderator`, `role_admin`
- `t(\`support_status_${status}\`)` at lines 312 + 346 + 691 — needs `support_status_open`, `support_status_in_progress`, `support_status_resolved`, `support_status_closed`

`TicketStatus` enum in `src/types/database.ts:46` is the canonical source for the 4 status values. User roles are the canonical 4-role set (`user` / `agent` / `moderator` / `admin`).

Total missing: **8 keys × 4 locales = 32 string additions** to `messages/{sq,en,uk,it}.json` under `admin.support`.

## Goal

Add the 8 missing keys (4 role labels + 4 support-status labels) to all four locale files under `admin.support`. After this task:
- `/admin/support` renders localized role badges and localized status badges.
- No raw `admin.support.role_*` or `admin.support.support_status_*` strings visible in UI.
- No MISSING_MESSAGE console errors when:
  - opening the support ticket list,
  - opening the Create / New ticket dialog,
  - searching users in UserPicker,
  - opening an existing ticket detail modal,
  - viewing event timeline (status changes).
- All four locales (sq/en/uk/it) render correctly at runtime.

## Current behavior to preserve (Notes 19 + 20 + 22)

- AdminSupportManager.tsx source code STAYS UNCHANGED — the dynamic `t(\`role_${role}\`)` and `t(\`support_status_${status}\`)` patterns are intentional and remain. The fix is in the message files only.
- All existing `admin.support.*` keys (filter_all, cancel_btn, col_status, etc. — see investigation output) remain untouched. No renames. No deletions. No moves.
- Ticket status lifecycle, role list, business logic — ZERO changes.
- All other admin namespaces (`admin.users`, `admin.listings`, etc.) untouched.
- Existing notification / toast / dialog / modal copy untouched.

This is a pure additive locale-file change. The only files Sonnet may touch are the four message JSONs + the session log + backlog.

## Positive flow (happy path)

As an admin at `uk` locale, viewport 1280px (desktop default):
1. Navigate to `/uk/admin/support`.
2. Ticket list renders. Each row shows:
   - Localized status badge (e.g. "Відкритий", "В роботі", "Вирішений", "Закритий") — NOT raw `support_status_open`.
   - Localized reporter role badge ("Користувач", "Агент", "Модератор", "Адміністратор") — NOT raw `role_user`.
3. Click "Нова скарга" / New complaint → dialog opens; UserPicker search shows users with localized role badges.
4. Click a ticket row → detail modal opens; status switcher buttons show localized labels for all 4 statuses; event timeline shows localized status-change events; no raw keys.
5. Switch locale to `sq` → repeat steps 2-4; all labels show in Albanian.
6. Switch to `en` and `it` → same behavior; all labels render localized.
7. Open browser DevTools Console → **0 `MISSING_MESSAGE` warnings** for any `admin.support.role_*` or `admin.support.support_status_*` key.

## Negative flow (every off-happy-path branch)

- **Unknown / new ticket status arrives via DB** (e.g. a future status not in the 4-enum set): `t(\`support_status_${status}\`)` will MISSING_MESSAGE again. This is acceptable — the enum is the canonical source of truth, and adding a new status requires a coordinated migration. Do NOT add a runtime fallback in this task; doing so would mask a future migration gap.
- **Unknown user role**: same — `role_*` keys are tied to the canonical 4-role enum. Do not add wildcard fallback.
- **Locale file syntax error** (trailing comma, duplicated key, missing brace): `npm run build` or `npx tsc --noEmit` does NOT catch this — `npm run dev` will fail with `next-intl` parse error, and `npm run check:i18n` (if present) validates parity. After every edit, run a JSON parse check (see Required investigation) AND `next-intl` runtime parity guard if available.
- **Key parity violation**: if any one of the four locale files ends up with a different key set than the other three, parity guard fails. Add all 8 keys to all 4 files in the same diff — paste the parity verification output in the session log.
- **Locale string contains untranslated English** in `sq` / `uk` / `it`: this is a content failure. Use the recommended labels in the next section; do not ship English fallback in non-English locales.

## Required investigation (PASTE in session log)

```
# Reproduce missing keys
python3 -c "
import json
for loc in ['sq','en','uk','it']:
    with open(f'messages/{loc}.json') as f: data = json.load(f)
    sup = data.get('admin', {}).get('support', {})
    print(loc, sorted([k for k in sup if k.startswith('role_') or k.startswith('support_status_')]))
"
# Expected output before fix: empty lists in all 4 locales

# Inspect dynamic call sites
grep -n 't(\`role_\|t(\`support_status_' src/components/admin/AdminSupportManager.tsx

# Confirm canonical enum
grep -n 'export type TicketStatus' src/types/database.ts

# After adding keys, parse + parity check
for f in messages/sq.json messages/en.json messages/uk.json messages/it.json; do
  python3 -c "import json; json.load(open('$f'))" && echo "$f OK" || echo "$f FAIL"
done

# If npm run check:i18n exists, run it (parity guard)
npm run check:i18n 2>&1 || true
```

## Required content (paste these labels verbatim)

Add the following 8 keys under `admin.support` in each locale file. Insertion location: alongside existing `filter_all`, `filter_all_status`, etc. (alphabetic or grouped — match the file's existing style; if alphabetic, the keys sort cleanly).

### sq (Albanian — write Albanian first, always)
```json
"role_user": "Përdorues",
"role_agent": "Agjent",
"role_moderator": "Moderator",
"role_admin": "Administrator",
"support_status_open": "I hapur",
"support_status_in_progress": "Në progres",
"support_status_resolved": "I zgjidhur",
"support_status_closed": "I mbyllur"
```

### en (English)
```json
"role_user": "User",
"role_agent": "Agent",
"role_moderator": "Moderator",
"role_admin": "Admin",
"support_status_open": "Open",
"support_status_in_progress": "In progress",
"support_status_resolved": "Resolved",
"support_status_closed": "Closed"
```

### uk (Ukrainian)
```json
"role_user": "Користувач",
"role_agent": "Агент",
"role_moderator": "Модератор",
"role_admin": "Адміністратор",
"support_status_open": "Відкритий",
"support_status_in_progress": "В роботі",
"support_status_resolved": "Вирішений",
"support_status_closed": "Закритий"
```

### it (Italian)
```json
"role_user": "Utente",
"role_agent": "Agente",
"role_moderator": "Moderatore",
"role_admin": "Amministratore",
"support_status_open": "Aperto",
"support_status_in_progress": "In corso",
"support_status_resolved": "Risolto",
"support_status_closed": "Chiuso"
```

If you disagree with any localized label, STOP & ASK the orchestrator BEFORE editing — do not silently substitute.

## Scope (files Sonnet may touch)

- `messages/sq.json`
- `messages/en.json`
- `messages/uk.json`
- `messages/it.json`
- `docs/sessions/2026-05-30-task-300-admin-support-i18n-hotfix.md` (NEW) — date the file with the actual session date
- `docs/backlog.md` (closure entry)

**MUST NOT touch:**
- `src/components/admin/AdminSupportManager.tsx` (the dynamic `t()` calls are correct as-is; do NOT add fallbacks)
- Any other admin component
- Any task 296/295/294/Footer file
- Any other locale namespace (`admin.users`, `admin.listings`, public namespaces, etc.)
- Routes / DB / server actions / RLS

Maximum SOURCE-FILE delta: **4** (the four message JSONs). If you touch more, STOP & ASK.

## Acceptance criteria (literal)

- All 8 keys exist under `admin.support` in `messages/sq.json`, `messages/en.json`, `messages/uk.json`, `messages/it.json` — same key set across all four files.
- Localized strings match the labels in the "Required content" section above (or owner-approved substitutes from STOP & ASK).
- JSON parses cleanly in all 4 files (validated via `python3 -c "import json; json.load(open('messages/XX.json'))"` or `node -e "require('./messages/XX.json')"`).
- Key parity verified: same key count in all four files; same key set; no orphans.
- `npx tsc --noEmit` → 0 errors.
- `npm run build` → passes.
- `npm run lint` → no NEW errors / no NEW warnings vs Task 295 baseline (0/0).
- `npm run check:i18n` (if exists) → passes.
- Runtime verification at `/admin/support` in all 4 locales at viewport 1280px:
  - 0 `MISSING_MESSAGE` console warnings for `admin.support.role_*` or `admin.support.support_status_*`.
  - No raw keys visible in: ticket list rows, Create dialog, UserPicker, ticket detail modal, event timeline.
- Narrow-breakpoint verification at 320 in `uk`: localized strings render (even if the underlying layout is clipped — clipping is a separate Task 301 concern, not part of this hotfix).
- Note 18 self-validation block + AC self-audit table + "Files Changed" table in session log.
- Verdict line: `Self-validation: tsc=0 · build=passes · lint=0/0 · check:i18n=passes · runtime: 0 MISSING_MESSAGE on /admin/support across sq/en/uk/it · scope=clean (4 JSON files only) · PASS`.

## Out of scope

- AdminSupportManager.tsx source code changes (the `t()` calls are correct as-is).
- Any other missing i18n key elsewhere in the project (notifications "Скарга на ваш аккаунт" in `sq` locale, etc. — those belong to **Epic Global i18n Hardening**, not this hotfix).
- Admin Support layout fixes at narrow breakpoints (Task 301 / Admin UX System Epic).
- Verified Agents workflow (Admin UX System Epic).
- Filter UX overhaul (Admin UX System Epic).
- Admin Support business logic / status lifecycle / DB schema.
- Any modal/dialog visual redesign.

## Final report required

1. Files Changed table (4 message JSONs + session log + backlog).
2. Before/after key inventory per locale (paste the python parity-check output before AND after).
3. JSON parse output for all 4 files after edit.
4. AC-by-AC self-audit table.
5. Runtime verification narrative (4 locales × console clean check on `/admin/support`).
6. Confirmation that AdminSupportManager.tsx is byte-identical (no source code edit).
7. Confirmation no other namespace touched.

Do NOT emit git commands. Do NOT run git. Do NOT broaden scope to other i18n bugs. STOP & ASK if any localized label feels wrong.
