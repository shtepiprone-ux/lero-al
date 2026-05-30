# Sprint 24 — Task 318 kickoff (Epic II Phase 1 — Notification locale-binding audit)

> **Mandatory rules:** `docs/agent-contract.md` clauses 1, 2, 6a, 9, 10. Sonnet writes "Files Changed" table; orchestrator emits commits.

> **Shared hard contract:** You are Claude Code Sonnet 4.6 in `lero-al`. Read `docs/agent-contract.md` FIRST. This is a **PURE AUDIT/SPEC TASK — no production code changes**. Pre-read `docs/orchestrator-role.md`, `docs/ai-behavior.md` (i18n + Notes 18), `docs/integrations.md` (outbound email policy + Resend), `docs/data-access-rules.md`, `docs/qa-rules.md`, `tasks/Epics/Epic_II_Global_i18n_Hardening.md`. No scope change; STOP & ASK if ambiguous.

> **Numbering:** Task 318 is Epic II Phase 1 task #3. Independent of 316/317 — runs in parallel.

---

```
Type:        audit/spec (DOCUMENTATION ONLY — no production code changes, no migration, no copy edits)
Priority:    HIGH — surfaces the root cause of the "Скарга на ваш аккаунт..." wrong-locale notification bug owner observed on sq locale
Area:        notifications layer — every creation path that writes a row into `notifications` table — locale-binding map
```

## Why this task exists

Owner observed (2026-05-30): on the public site with `sq` locale, a notification popup rendered Ukrainian text "Скарга на ваш аккаунт...". This is a wrong-locale notification — the recipient is browsing in `sq` but the notification was generated/persisted/rendered in `uk`.

This bug class is fundamentally different from the dynamic-key gap of Task 316:
- Task 316 = `t()` template missing in messages files → key never resolves
- Task 318 = `t()` resolves correctly to the WRONG locale because the locale resolved during notification creation is the actor's locale, the default fallback, or a stale cached value — not the recipient's preferred locale.

Common failure modes (Sonnet must check each):
1. Notification body composed at CREATION TIME using actor's locale (the admin / system process that triggers the notification) instead of recipient's locale.
2. Notification body composed at CREATION TIME using `resolveLocale()` / `getLocale()` which returns the requester's locale, not the target user's preferred locale (`users.preferred_locale` column).
3. Notification body composed at CREATION TIME using server-side default `'sq'` and then over-localised at render with a different locale → render shows the creation-time language.
4. Notification body stored as a single string per row (no per-locale variants) — the creation moment freezes locale.
5. Notification body stored as JSON / i18n keys, but the render path uses the wrong locale resolver (e.g. `getLocale()` from request context instead of `recipient.preferred_locale`).
6. Specific notification helpers (e.g. `notifySupportReply`, `notifyListingApproved`) call locale resolvers in inconsistent ways.

Task 318 audits all of these and produces a per-creation-path locale-binding map + root-cause classification + remediation recommendation per path. Phase 2 (Task 319) implements the fix.

## Goal

Produce **`docs/governance-reports/2026-05-31-notification-locale-audit.md`** (NEW; date = actual run date) containing:

1. **Per-path inventory** — every code path that INSERTs a row into the `notifications` table (creation site → helper used → arguments → locale resolution).
2. **Locale-binding map** — for each path, classify: (a) creation-time locale (actor's? recipient's? default?), (b) render-time locale (recipient's at render time?), (c) string source (i18n key? frozen body?), (d) failure mode probability for the "Скарга на ваш аккаунт..." bug.
3. **Root cause identification** — pinpoint which creation path most likely produced the observed `sq`-recipient-seeing-`uk`-text bug; cite line numbers + reasoning.
4. **Per-path remediation recommendation** — for each path, recommend the fix shape (use recipient's `preferred_locale`; store key + interpolation args + render at delivery; or full restructure).
5. **`users.preferred_locale` field audit** — confirm the column exists; default value; how it's set (signup / locale switch / explicit user setting); how reliably it reflects current preference.

Plus extend **`docs/i18n-rules.md`** (created by Task 316) with section:
- "Notification locale-binding canonical rule" — placeholder spec to be finalised based on this audit's findings. (Final spec encoded by Task 319 implementation.)

**NO production code changes.** **NO migration.** **NO locale file edits.** Audit only.

## Current behavior to preserve (Note 19 — audit-light)

Audit-only — no behaviour changes. But the audit MUST capture every creation path so Phase 2 (Task 319) does not silently drop a notification type.

## Required investigation (PASTE summary in session log)

```
# 1. Find every notification creation site
grep -rn 'createNotification\|notifications.insert\|notify_' src/ | head -60

# 2. Find every helper function used
grep -rn 'export.*function.*notif\|export.*function.*notify' src/ | head -20

# 3. Locale resolver usage at notification sites
grep -rn 'resolveUserLocale\|resolveLocale\|getLocale\|preferred_locale' src/ | head -40

# 4. Confirm users.preferred_locale column exists and is populated
grep -n 'preferred_locale\|preferred_currency' src/types/database.ts scripts/schema-drift-check.sql | head -10

# 5. Inspect specific notification types (support_reply, listing_approved, message_received, etc.)
grep -rn "type: 'support_reply'\|type: 'listing_\|type: 'message_\|type: 'report_" src/

# 6. Notification rendering site (where the body is shown to the recipient)
grep -rn 'NotificationItem\|notifications.select\|NotificationList\|<Notification' src/ | head -20

# 7. Read Task 288 (i18n hardcode audit) for notification context if any
cat docs/sessions/2026-05-29-task-288-i18n-hardcode-audit.md | grep -A 3 -i 'notif' || echo "no notif in 288"

# 8. Look for hardcoded `uk` / `sq` strings that might be the bug source
grep -rn '"Скарга на ваш аккаунт"\|"Complaint about your account"\|"Скаргу"' src/ messages/ | head -10
```

After investigation, paste:
- Total notification creation site count.
- Per-type → helper → locale-resolution mapping.
- Confirmed location of the "Скарга на ваш аккаунт" string (`uk` locale file? hardcoded? generated?).
- Hypothesis for which creation path most likely fired the bug.

## STOP & ASK after investigation

Before writing the spec:
1. **If `users.preferred_locale` does not exist or is unreliable**, STOP & ASK — Phase 2 fix shape changes significantly (would need DB migration to ADD the column).
2. **If a notification helper signature does not currently accept a recipient-locale param** and would need a refactor, document the breaking-change scope for Task 319.
3. **If the "Скарга на ваш аккаунт" string source cannot be located**, STOP & ASK — the bug may originate from a path not covered in the current inventory.

## Scope (files Sonnet may touch)

- `docs/governance-reports/2026-05-31-notification-locale-audit.md` (NEW; adjust date if run later — task number stays 318)
- `docs/i18n-rules.md` (EXTEND — Task 316 created this; Task 318 adds "Notification locale-binding canonical rule" placeholder)
- `docs/sessions/2026-05-31-task-318-notification-locale-audit.md` (NEW; adjust date)
- `docs/backlog.md` (closure entry)

**MUST NOT touch:**
- Any file under `src/`
- Any file under `messages/`
- Any file under `scripts/`
- Sprint 21 / 22 / 23 / 25 / 26 files
- Task 316 / 317 spec doc sections (only EXTEND)
- Canonical primitives
- DB / RLS / migrations

**Maximum SOURCE-FILE delta: 0.** If you touch `src/`, STOP & ASK.

## Acceptance criteria (literal)

- `docs/governance-reports/2026-05-31-notification-locale-audit.md` exists with the 5 sections from Goal #1.
- Per-path inventory covers EVERY `createNotification` / `notifications.insert` call in `src/` (grep-verifiable count matches inventory).
- Per-path locale-binding classification (creation-time vs. render-time vs. string-source vs. failure-mode probability) is exhaustive.
- Root-cause hypothesis cites specific file:line evidence and a reproduction theory.
- `users.preferred_locale` column status confirmed (exists / nullable / default / population reliability).
- `docs/i18n-rules.md` has new section "Notification locale-binding canonical rule" with placeholder + reference to Task 319.
- Phase 2 (Task 319) remediation recommendations are concrete per-path.
- Zero source / locale / script / migration changes.
- `npx tsc --noEmit` → 0. `npm run build` → passes. `npm run lint` → 0/0. `npm run governance:tailwind` → C0/H0/M0.
- Note 18 self-validation block + AC self-audit table + "Files Changed" table.
- Verdict line: `Self-validation: tsc=0 · build=passes · lint=0/0 · notification creation path inventory complete (N paths) · root-cause hypothesis filed · users.preferred_locale audit complete · src diff=empty · Phase 2 remediation roadmap ready · PASS`.

## Out of scope

- Implementing the notification locale-binding fix — Task 319 (Phase 2).
- Dynamic-key audit project-wide — Task 316.
- Missing-key scanner — Task 317.
- Email template i18n correctness — Task 321 (Phase 2).
- Toast / modal i18n audit — Task 322 (Phase 2).
- Public-side notification rendering redesign — separate UX task.
- DB schema changes (adding `preferred_locale` if missing — flag in audit + STOP & ASK).
- Outbound email language scope (sq-only per Epic GG — out of this audit's scope).

## Final report required

1. Files Changed table.
2. Total notification creation site count + per-helper distribution.
3. Per-path inventory matrix (file:line | type | helper | locale resolver | string source).
4. Per-path locale-binding classification.
5. Root cause hypothesis with line-cited reasoning.
6. `users.preferred_locale` field status report.
7. Per-path Phase 2 remediation recommendations.
8. AC-by-AC self-audit table.
9. Confirmation no source / locale / script file was edited.

Do NOT emit git commands. Do NOT run git. Do NOT touch source code. STOP & ASK if root-cause cannot be hypothesised after exhaustive inventory.
