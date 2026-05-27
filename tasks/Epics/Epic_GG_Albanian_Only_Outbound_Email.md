# Epic GG — Albanian-Only Outbound Email Policy

**Status:** OPEN — opened 2026-05-25 by the Opus 4.7 orchestrator.
**Source:** owner directive 2026-05-25 (this chat):
> Підтримку інших мов прибираємо, має бути лише албанська мова, бо вона є офіційною в Албанії.
> Вже створені шаблони в адмінці, а також майбутні шаблони в адмінці мають бути також тільки
> албанською мовою.
> Concrete trigger: emails sent to `support@lero.al` / `sales@lero.al` from the public contact
> form arrive in English regardless of site locale. Default must be Albanian.

**Kickoffs:** `Epic_GG_kickoff_prompt_Task_251.md` (Task 251).

> Albanian is the official language of Albania and the project's primary locale (`sq` already is
> the default site locale). This Epic collapses all OUTBOUND email transport to `sq` only. The
> SITE UI remains 4-locale (sq/en/uk/it) — only outbound mail collapses. This is a policy
> reversal of Epic D's multi-locale design; we keep the multi-locale schema intact (reversible)
> but cease using non-`sq` rows.

## Concrete bug rooted at

- `src/modules/contacts/actions/index.ts:124` and `:226` — both call sites hardcode
  `locale: 'en'` when invoking the contact-inquiry sender. Effective behaviour: every outbound
  contact-inquiry email is English, regardless of which site locale the visitor used.
- `src/modules/notifications/lib/emails/contactInquiry.ts` — 4-locale STRINGS map
  (`sq | en | uk | it`); function defaults to `'sq'` when no locale is passed, but the caller is
  passing `'en'` explicitly. Same bug shape applies to the admin reply path
  (`sendContactInquiryReply` — same file).

## Goal

Every outbound email (existing + future) goes out in Albanian (`sq`):

- public contact-inquiry notification to staff (Task 222 / V.1);
- admin reply to user (Task 223 / V.2);
- every Epic D system email — verification, recovery, magic link, re-auth, email-change,
  inactivity warning + final, reporter notification;
- every templated email going through `sendTemplatedEmail` (saved-search alerts, price-change
  alerts, …);
- every future admin-managed `email_templates` row.

Site UI stays 4-locale. Admin email-template editor hides non-`sq` locale tabs.

## Dependencies

- Epic D (Email Infrastructure) — CLOSED. Templates + `BaseEmail` + `sendTemplatedEmail` shape
  intact; we change CALLERS not the underlying senders.
- Epic V — Contacts & Inquiries. CLOSED, **reopens** for Task 252 (V.3 Sales inbox split) +
  participates in GG (callers fixed).
- `src/modules/notifications/lib/emails/resolveUserLocale.ts` — currently resolves to
  `preferred_locale → requestLocale → 'sq'`. After GG, the resolver is bypassed for outbound
  email (locale is constant `'sq'`); the file itself is deprecated, not deleted (reversible).
- `src/components/admin/AdminEmailTemplatesManager.tsx` — multi-locale editor; GG hides non-`sq`
  tabs in the UI; DB rows for `en/uk/it` remain (reversible).
- `messages/*.json` — unchanged by GG. Site UI i18n is unrelated to outbound email language.

## Tasks

- **Task 251 — GG.1** — Collapse all outbound email transport to `sq`; deprecate (do not delete)
  multi-locale rows + UI tabs; document the policy in `docs/integrations.md` + `docs/env.md`.

## Epic-level acceptance

Every outbound email lands in Albanian. The DB shape (`email_templates` per-locale rows,
`users.preferred_locale` column) is preserved so the policy is reversible. Admin template
editor only shows `sq` going forward. No site UI string is touched.
