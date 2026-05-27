# Epic GG — kickoff prompt — Task 251 — GG.1 — Albanian-only outbound email

**Filed by:** Opus 4.7 orchestrator 2026-05-25
**Source:** owner directive 2026-05-25.
**Trigger bug:** `src/modules/contacts/actions/index.ts:124, 226` hardcodes `locale: 'en'` →
every contact-inquiry email arrives in English regardless of site locale.

---

You are Claude Code Sonnet 4.6 working in `lero-al`.

**Hard contract** (`docs/orchestrator-role.md` → "Hard contract embedded in EVERY Sonnet prompt"):
no scope change; no invented architecture (STOP & ask the orchestrator if anything is ambiguous);
literal AC; **self-validate BEFORE claiming complete** (Note 18 in `docs/ai-behavior.md` — tsc=0,
AC-by-AC table in session log, diff self-review, runtime check at `uk` 320px on any UI change);
**preserve UX flow** (Note 19 — every entry point + control still works after the change);
**preserve existing controls** (Note 20 — before/after control inventory of the admin email-
template editor in the session log); update `docs/backlog.md` + add session log under
`docs/sessions/`; 0 new lint/typecheck errors; `npm run build` passes; governance PASS; **site UI
locale parity sq/en/uk/it remains untouched** (only outbound transport collapses); responsive 320/
375/390/768/1280/1440/2560 for any UI change; **owner runs all git + SQL** — emit ready-to-run
`git add <paths>` (or `git add -A`) + `git commit` lines at the end and any new SQL into the
session log; the executor NEVER runs git or SQL.

## Pre-read

1. `docs/agent-contract.md` (P0 contract — read first)
2. `docs/backlog.md`
3. Task-relevant docs from `docs/rule-index.md` → **"Email / auth lifecycle task"** + **"Admin table / admin control task"** (the email-templates editor is admin UI):
   - `docs/env.md`
   - `docs/domain-rules.md`
   - `docs/qa-rules.md`
   - `docs/integrations.md` (Resend integration)
   - `docs/ui-rules.md`
   - `docs/component-rules.md`
4. `docs/ai-behavior.md` — Note 18 (self-validation), Note 19 (UX flow), Note 20 (control preservation), **Note 22 (Admin Table Preservation Rule)** for the email-templates editor.
5. `src/modules/contacts/actions/index.ts` (lines 116–126 + 220–230 — the two hardcoded `locale: 'en'` call sites)
6. `src/modules/notifications/lib/emails/contactInquiry.ts` (the 4-locale STRINGS + REPLY_STRINGS maps; functions default to `'sq'` when no locale is passed)
7. `src/modules/notifications/lib/emails/resolveUserLocale.ts` (the locale resolver — to be deprecated, not deleted)
8. `src/modules/notifications/lib/sendTemplatedEmail.ts` (Epic D templated send — figure out how it picks a locale row from `email_templates`)
9. Every other file under `src/modules/notifications/lib/emails/` (`emailChange.ts`, `MagicLinkEmail.tsx`, `ReauthEmail.tsx`, `RecoveryEmail.tsx`, `VerifyEmail.tsx`, `InactivityWarningEmail.tsx`, `InactivityFinalEmail.tsx`, `ReporterNotificationEmail.tsx`, `BaseEmail.tsx`, `send.ts`) — find every caller passing a non-`sq` locale or any locale derived from user preference
10. `src/components/admin/AdminEmailTemplatesManager.tsx` + `src/app/admin/email-templates/*` — the multi-locale template editor UI
11. Inspect `package.json` for current validation scripts.

## Localization coverage

- sq, en, uk, it for the SITE UI (the admin Banner / Alert note "Шаблони надсилаються виключно албанською мовою…" must exist in all four `messages/*.json`).
- The EMAIL outbound transport collapses to `sq` only — that is the entire point of the task.

## Responsive coverage

- 320, 375, 390, 768, 1280, 1440, 2560 for `/admin/email-templates`.

## Current behavior to preserve

Before editing, inspect and list in the session log:

- Affected route: `/admin/email-templates`.
- Affected component: `AdminEmailTemplatesManager.tsx`.
- Existing controls in the editor (4 locale tabs + body + variables + save) — every one of these must remain WORKING in the diff or be explicitly listed as the legitimate single removal authorised by this task (3 of the 4 locale tabs are hidden; the underlying form state and DB rows survive).
- Existing server actions / API routes for sending email (every caller listed in Pre-read).
- Existing success / error / loading state on save.
- Existing mobile behavior at 320px in `uk`.

Any existing control must either remain, move to a specified new place, or be explicitly listed as removed (with kickoff authorisation). Silent removal is forbidden — see Note 20.

**Admin table preservation rule (Note 22) applied to the editor:**
Inventory before editing: tabs (4 locales), body editor, variables list, save button. After the change:
only the `sq` tab is visible; body / variables / save remain identical. The hidden tabs are reversible
(class toggle, no DB row deletion). Document this explicitly in the session log.

## Required after behavior

As a site visitor, submitting the public contact form in any of `sq` / `en` / `uk` / `it`:
1. The staff notification email arrives in Albanian (`sq`).
2. The admin reply email (sent from the admin Inquiries page) also arrives in Albanian.

As a registered user whose `preferred_locale = 'uk'`, on any Epic D lifecycle event (password recovery, email change, inactivity warning, …):
1. The email arrives in Albanian — NEVER in Ukrainian or any other language.

As an admin, on `/admin/email-templates`:
1. Only the `sq` tab is visible.
2. A Banner / Alert (`Alert` canonical primitive) informs that "Шаблони надсилаються виключно албанською мовою (Albanian Only Policy, 2026-05-25)" — this banner has all four locale translations in `messages/*.json`.
3. Saving an edit to the `sq` template works exactly as before (loading → success toast → persisted after refresh).
4. The hidden `en` / `uk` / `it` tabs preserve their underlying DB rows (verifiable in the DB).



## Goal

Collapse OUTBOUND email transport to Albanian (`sq`) only. Site UI stays 4-locale; the change is
entirely in the email layer + admin template editor. Make the policy reversible — do NOT delete
`en`/`uk`/`it` rows in `email_templates`, do NOT delete the 4-locale STRINGS maps in inline-
template files. Just stop using anything other than `sq` at send time.

## Scope — exact changes

1. **Fix the trigger bug.** In `src/modules/contacts/actions/index.ts`, replace both
   `locale: 'en'` arguments (lines ~124 and ~226) with `locale: 'sq'`. This single change makes
   every contact-inquiry email + admin reply Albanian.

2. **Sweep every outbound caller.** Grep the repo for every call to:
   - `sendContactInquiryNotification`, `sendContactInquiryReply`
   - `sendTemplatedEmail`
   - direct `send(...)` calls in `src/modules/notifications/lib/emails/*`
   - `resolveUserLocale(...)` consumers
   - any other email-sender helper

   For each caller: if it passes a `locale` argument or derives one from `preferred_locale` /
   request locale, change it to a constant `'sq'`. If it does not pass a locale (so the helper's
   default `'sq'` already applies), leave it alone.

3. **Deprecate `resolveUserLocale.ts`.** Add a header comment "DEPRECATED 2026-05-25 (Task 251):
   outbound emails are Albanian-only — do not call from new email senders." Do NOT delete; some
   call sites may still import it during the migration. Replace every call with the constant
   `'sq'` at the call site. After this sweep, the file should have ZERO consumers — confirm via
   grep in the session log; if it does, add `@deprecated` JSDoc and leave the file in place
   (reversible policy).

4. **`sendTemplatedEmail` — pick the `sq` row.** Confirm how the helper currently picks a locale
   row from `email_templates`. Change it to always pick the `sq` row regardless of the user's
   `preferred_locale`. Fall back behaviour: if the `sq` row is missing for a template, the helper
   throws (and the caller logs). Do NOT silently fall back to another locale (that defeats the
   policy). If the helper currently has a defaulting cascade, document the BEFORE behaviour in
   the session log and replace with the simple `sq` lookup.

5. **Admin email-template editor — hide non-`sq` tabs.** In
   `src/components/admin/AdminEmailTemplatesManager.tsx`, hide the `en` / `uk` / `it` editor
   tabs (do NOT delete the underlying form state — reversible). Render a single `sq` editor by
   default. Add a small note in the UI (i18n × 4 in the SITE UI, not the email): "Шаблони
   надсилаються виключно албанською мовою (Albanian Only Policy, 2026-05-25)." Use the canonical
   `Alert`/`Banner` primitive — do NOT invent a new wrapper. Note 20: list every editor control
   that exists today (4 locale tabs + body + variables + save) in the session log; after the
   change, only the `sq` tab + body + variables + save remain; nothing else is removed. If a
   future owner directive flips the policy, restoring the tabs is a one-line className toggle.

6. **Verification — runtime end-to-end.** Submit the public contact form in each of the four
   site locales (`sq`, `en`, `uk`, `it`); confirm every resulting staff email lands in Albanian.
   Submit an admin reply; confirm the reply email also lands in Albanian. For one of the Epic D
   templated emails (e.g. password recovery), confirm the same — set the test user's
   `preferred_locale` to `uk`; the recovery email must still arrive in Albanian.

7. **Documentation update.** Add a new section in `docs/integrations.md` (Resend) titled
   "Outbound email language policy (Albanian-only, 2026-05-25)" describing:
   - what changed
   - why (owner directive — Albanian is official language of Albania)
   - which files are deprecated (`resolveUserLocale.ts`)
   - how to reverse the policy (revert callers; un-hide editor tabs; keep DB rows)

   Also add a one-line cross-reference in `docs/ai-behavior.md` near the Localization Rules
   block: site UI is 4-locale; outbound email is `sq`-only (link to integrations.md section).

## Out of scope

- Deleting any database row, schema column, or template file.
- Touching `messages/*.json` (site UI i18n stays 4-locale).
- Restructuring the admin Inquiries page (that's Task 252 / V.3 Sales inbox split).
- Changing the public contact form's subject options.

## Acceptance criteria

- `src/modules/contacts/actions/index.ts` no longer passes `locale: 'en'`; both call sites use
  `locale: 'sq'`.
- Every outbound email sender uses `'sq'` exclusively — grep proof in the session log (no
  remaining non-`sq` literal locale string in email senders, no remaining `preferred_locale` →
  email-locale derivation).
- `sendTemplatedEmail` selects the `sq` template row only; missing-`sq` raises an error
  (documented in the session log).
- Admin email-template editor renders a single `sq` tab + a "Albanian Only" notice; the
  underlying form/DB rows for other locales are preserved (Note 20 before/after editor-control
  inventory in the session log).
- `resolveUserLocale.ts` is marked deprecated + has zero call-site consumers after the change
  (grep proof in session log). File is NOT deleted (reversible).
- Runtime verification table in the session log: 4 site locales × public contact form + admin
  reply + Epic D templated email = all results Albanian.
- `docs/integrations.md` has the "Outbound email language policy (Albanian-only, 2026-05-25)"
  section; `docs/ai-behavior.md` Localization Rules block has the cross-reference.
- **Self-validation block** per Note 18 (tsc=0 in shell, AC table all green, scope=clean,
  runtime locale=uk PASS on the admin editor surface).
- UX-flow trace per Note 19 (contact form → email + admin reply flow).
- Control inventory per Note 20 (admin email-template editor).
- 0 new lint/typecheck errors; `npm run build` passes; site UI 4-locale parity unchanged
  (key-count audit in the session log to prove `messages/*.json` was not touched); 7
  breakpoints if any UI change.
- `docs/backlog.md` updated (Last Session block for Task 251); session log:
  `docs/sessions/2026-05-25-task-251-gg1-albanian-only-email.md`.

## Hard contract reminder (single-writer)

- Do NOT run git; emit ready-to-run commit commands as plain text at the end (single `git add`
  with explicit paths or `git add -A`; do NOT use `^` / backtick continuations).
- Do NOT delete data, drop columns, or run any SQL.
