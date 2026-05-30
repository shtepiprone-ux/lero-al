# Task 300 — Admin Support i18n missing keys hotfix

**Date:** 2026-05-30  
**Executor:** Claude Code Sonnet 4.6  
**Task type:** bugfix (i18n runtime, CRITICAL)

---

## Investigation

**Missing keys BEFORE fix:**
```
sq []
en []
uk []
it []
```
All 4 locales confirmed missing `role_*` and `support_status_*` under `admin.support`.

**Dynamic call sites in AdminSupportManager.tsx:**
```
112: t(`role_${user.role}` as `role_admin`)
224: t(`role_${u.role}` as `role_admin`)
312: t(`support_status_${ticket.status}` as `support_status_open`)
346: t(`support_status_${s}` as `support_status_open`)
691: t(`support_status_${tk.status}` as `support_status_open`)
```
5 call sites, 2 key patterns — `role_*` (4 values) + `support_status_*` (4 values).

**AdminSupportManager.tsx NOT MODIFIED** — the dynamic `t()` patterns are correct; fix is locale files only. ✅

---

## Keys added — 8 keys × 4 locales = 32 string additions

### sq
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

### en
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

### uk
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

### it
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

---

## Parity verification AFTER fix

```
sq ["role_admin","role_agent","role_moderator","role_user","support_status_closed","support_status_in_progress","support_status_open","support_status_resolved"]
en ["role_admin","role_agent","role_moderator","role_user","support_status_closed","support_status_in_progress","support_status_open","support_status_resolved"]
uk ["role_admin","role_agent","role_moderator","role_user","support_status_closed","support_status_in_progress","support_status_open","support_status_resolved"]
it ["role_admin","role_agent","role_moderator","role_user","support_status_closed","support_status_in_progress","support_status_open","support_status_resolved"]
```
Identical 8-key set across all 4 locales. ✅

**npm run check:i18n:** `✅ Parity PASSED — all 4 locale files have identical key sets (1368 keys).` (Raw-enum scan warning is a known false positive from status string literals inside `t()` calls — non-blocking.)

## JSON parse

```
sq.json OK
en.json OK
uk.json OK
it.json OK
```

---

## Runtime verification

Claude Code cannot render a browser. Based on code analysis:
- `t(\`role_${user.role}\`)` with `user.role ∈ {user, agent, moderator, admin}` → all 4 keys present in all locales ✅
- `t(\`support_status_${ticket.status}\`)` with `TicketStatus ∈ {open, in_progress, resolved, closed}` → all 4 keys present in all locales ✅
- No MISSING_MESSAGE warnings expected for these key patterns after this fix

**Owner browser verification: PASS (2026-05-30)** — `/admin/support` checked manually by owner across all 4 locales. No visible raw `admin.support.role_*` or `admin.support.support_status_*` keys. Localized labels render correctly in ticket list rows, dialogs, and status badges.

---

## Files Changed table (Task 264)

| Path | Change | Rationale |
|------|--------|-----------|
| `messages/sq.json` | Added 8 keys under `admin.support` (role_user/agent/moderator/admin + support_status_open/in_progress/resolved/closed) | Fix MISSING_MESSAGE — Albanian labels |
| `messages/en.json` | Same 8 keys (English labels) | Fix MISSING_MESSAGE — English labels |
| `messages/uk.json` | Same 8 keys (Ukrainian labels) | Fix MISSING_MESSAGE — Ukrainian labels |
| `messages/it.json` | Same 8 keys (Italian labels) | Fix MISSING_MESSAGE — Italian labels |
| `docs/sessions/2026-05-30-task-300-admin-support-i18n-hotfix.md` | This file | Session log |
| `docs/backlog.md` | Updated Last Session + Session Archive + task counter | Clause 10 |

---

## AC self-audit table

| AC | Status | Evidence |
|----|--------|---------|
| 8 keys in all 4 locale files, identical key set | ✅ | Parity check output above |
| Labels match Required content section verbatim | ✅ | Keys added as-specified, no substitutions |
| JSON parses cleanly ×4 | ✅ | `node` parse output above |
| `npx tsc --noEmit` → 0 | ✅ | Empty output |
| `npm run build` → passes | ✅ | Build completed |
| `npm run lint` → 0/0 | ✅ | Empty output |
| `npm run check:i18n` → passes | ✅ | 1368 keys parity passed |
| `npx vitest run` → no regression | ✅ | 428/428 |
| AdminSupportManager.tsx byte-identical | ✅ | Not touched |
| No other namespace touched | ✅ | Only `admin.support` section modified in 4 JSONs |
| Runtime 0 MISSING_MESSAGE | ✅ | Owner verified 2026-05-30 — no raw keys on /admin/support in all 4 locales |

## Self-validation verdict

`Self-validation: tsc=0 · build=passes · lint=0/0 · check:i18n=passes (1368 keys) · vitest=428/428 · 8 keys × 4 locales added · parity verified · AdminSupportManager.tsx untouched · runtime=PASS (owner verified 2026-05-30) · scope=clean (4 JSON files only) · UNCOMMITTED · PASS`
