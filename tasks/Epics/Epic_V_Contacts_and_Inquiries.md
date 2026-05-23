# Epic V — Contacts & Inquiries

**Status:** OPEN — opened 2026-05-23 by the Opus 4.7 orchestrator.
**Source:** owner request 2026-05-23 (last in queue, after Sprint 10).
**Kickoffs:** `Epic_V_kickoff_prompts.md` (Tasks 222–223).

## Goal

A public **Contacts** page with an inquiry form. The user picks a subject from a preset topic set (or
"Other" + a custom subject), leaves their email + message; the subject routes the inquiry to the right
mailbox (`support@lero.al` or `sales@lero.al`). Every inquiry is persisted and surfaced on a new **admin
Inquiries** page where an admin/moderator can read it and reply; the reply is emailed to the user via the
existing Resend integration (From = the routed mailbox, Reply-To = the user's email).

## Owner decisions (2026-05-23)

- Topic set: orchestrator-provided default (below); admin wording can be tuned later.
- Reply transport: **Resend from the admin page** (not just status flags).

## Topic set + mailbox routing (default — localize ×4)

| Topic key | uk (reference) | Mailbox |
|-----------|----------------|---------|
| `support_technical`   | Технічна проблема            | support@ |
| `support_account`     | Питання щодо акаунту         | support@ |
| `support_report`      | Скарга на оголошення         | support@ |
| `support_general`     | Загальне питання             | support@ |
| `sales_advertising`   | Розміщення реклами           | sales@   |
| `sales_partnership`   | Співпраця / партнерство      | sales@   |
| `sales_agency`        | Послуги для агентств         | sales@   |
| `sales_premium`       | Преміум-розміщення           | sales@   |
| `other`               | Інше (вкажіть свою тему)     | support@ (default) |

"Other" reveals a free-text subject field; it routes to `support@` unless the owner later remaps. The
routing map lives in ONE place (a constant), keyed by topic → mailbox — no hardcoded addresses scattered
across components.

## Dependencies

- Email: existing Resend integration (`src/modules/notifications/lib/emails/*`, e.g.
  `emailChange.ts`); `docs/integrations.md` (Resend) + `docs/env.md` (any new From addresses / env).
- New env / mailbox provisioning (`support@lero.al`, `sales@lero.al`) is an OWNER infra step — document
  required env vars; the code reads addresses from config, never hardcoded.
- DB: a new `contact_inquiries` table (owner runs SQL) + RLS (admin/moderator read; public insert via a
  server action with rate-limiting; see `docs/rls-rules.md`).
- Admin shell + role gate (admin/moderator) — reuse existing admin layout/sidebar patterns.

## Tasks

- **Task 222 — V.1** — Public Contacts page + inquiry form + persistence + routing.
- **Task 223 — V.2** — Admin Inquiries page (list + view + reply via Resend) + status.

## Epic-level acceptance

A working Contacts page that stores inquiries and routes by topic; an admin Inquiries screen where
admin/moderator can read and reply by email (Resend, From = routed mailbox, Reply-To = user); all strings
localized ×4; responsive on all 7 breakpoints; RLS-safe; 0 new lint/typecheck errors; build passes.
