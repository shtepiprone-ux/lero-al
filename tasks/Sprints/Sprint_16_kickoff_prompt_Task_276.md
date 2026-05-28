# Sprint 16 — Task 276 kickoff (Password-changed notification email — sq-only, wired into both password-change paths)

> **Mandatory rules — non-negotiable:**
>
> - `docs/agent-contract.md` **clause 6a** (Positive + Negative flow gate, Task 255).
> - `docs/agent-contract.md` **clause 10** + `CLAUDE.md` "Commit hand-off" + `docs/ai-behavior.md` "Commit Rules" (Task 264). Sonnet MUST include a "Files Changed" table in the session log. Sonnet MUST NOT emit `git add` / `git commit` commands.

> **Shared hard contract:** You are Claude Code Sonnet 4.6 working in `lero-al`. Read `docs/agent-contract.md` FIRST (clauses 1–10 + 6a + 10). Pre-read selection per `docs/rule-index.md` — for this task: **"Email / auth lifecycle task" bundle**. No scope change; STOP & ASK if ambiguous; literal AC; self-validate before "complete" claim (`tsc=0`, AC table, diff self-review, runtime check). Owner runs git; executor never runs git.

> **Dependency notice:** This task ships AFTER Task 273 (Cabinet
> reauth) so the cabinet integration site (`changeCabinetPassword`
> server action) exists. If Task 273 has not yet shipped at the moment
> this task is picked up, STOP & ASK — do NOT stub Task 273's
> server-action signature. Run order in `Sprint_16_—_Auth_Security_…md`.

---

## Task 276 — Password-changed notification email (sq-only)

```
Hard contract: see top.

Type:        feature (security notification email; standard hardening signal)
Priority:    medium (defense-in-depth signal; complements Task 273 + Task 271)
Area:        notifications / email / auth lifecycle / i18n (sq only per Task 251 outbound email policy)

GOAL: When a user's password changes successfully — whether via the
cabinet password-change form (NEW in Task 273) OR via the
password-recovery flow (existing `ResetPasswordClient.tsx`) — send the
user a one-time notification email confirming the change. Standard
security best practice: lets the user catch an unauthorised password
change immediately (e.g. from a session-hijack attack the user wasn't
aware of) and provides a clear audit trail.

Albanian-only delivery per Task 251 ("GG.1 Albanian-only email policy",
docs/integrations.md → "Outbound email language policy
(Albanian-only, 2026-05-25)"). The template is sq-only; the
admin-editable email-template surface (if applicable) only shows the sq
tab. No multi-locale fallback in the email body.

Filed by: orchestrator (Opus 4.7) on 2026-05-28. Sprint 16
Auth Security Hardening batch; security UX complement to Task 273.

Pre-read (Email / auth lifecycle bundle from docs/rule-index.md):
- docs/agent-contract.md  (always)
- docs/backlog.md         (always)
- docs/env.md             → RESEND_API_KEY, FROM_ADDRESS, the canonical
                            site URL rule.
- docs/integrations.md    → "Outbound email language policy
                            (Albanian-only, 2026-05-25)" — confirms the
                            sq-only delivery rule. "Resend" integration
                            section for verified senders.
- docs/qa-rules.md
- docs/domain-rules.md
- src/modules/notifications/lib/emails/send.ts — canonical `sendEmail`
                                                  helper.
- src/modules/notifications/lib/emails/BaseEmail.tsx — base template
                                                       wrapper / brand
                                                       header.
- src/modules/notifications/lib/emails/RecoveryEmail.tsx — closest
                                                            pattern
                                                            (recovery
                                                            password
                                                            email; same
                                                            auth lifecycle).
- src/modules/notifications/lib/emails/ReauthEmail.tsx — alternative
                                                          pattern
                                                          reference.
- src/modules/notifications/lib/emails/emailChange.ts — pattern for
                                                         calling
                                                         `sendEmail`
                                                         from a server
                                                         action.
- src/modules/auth/components/ResetPasswordClient.tsx — recovery
                                                          completion
                                                          site (one of
                                                          the two
                                                          integration
                                                          points).
- src/modules/auth/actions/recovery.ts — existing logging hook
                                          (`logPasswordRecoveryCompletion`)
                                          — the email send pairs with
                                          this.
- src/modules/cabinet/actions/index.ts — host module for the cabinet
                                          integration site
                                          (`changeCabinetPassword`
                                          NEW in Task 273).
- tasks/Sprints/Sprint_16_kickoff_prompt_Task_273.md — the cabinet
                                                       integration
                                                       site spec.

Current behavior to preserve:
- All other email templates in `src/modules/notifications/lib/emails/`
  (BaseEmail, VerifyEmail, RecoveryEmail, ReauthEmail, MagicLinkEmail,
  ReporterNotificationEmail, InactivityWarningEmail, InactivityFinalEmail)
  — UNCHANGED.
- `sendEmail` helper signature — UNCHANGED. The new template is delivered
  via the existing `sendEmail({ to, subject, react })` API.
- `FROM_ADDRESS` constant — UNCHANGED. The notification ships from the
  existing verified sender (`Lero.al <noreply@lero.al>`).
- `ResetPasswordClient.tsx`'s existing post-success behavior (success
  state + `signOut()`) — preserved; the email send is added BEFORE the
  signOut, fire-and-forget (do not block the success state on the
  email).
- `changeCabinetPassword` (Task 273) — the email send is added INSIDE
  the server action AFTER the successful `updateUser({ password })`
  call, fire-and-forget (do not block the result on the email; the
  success result returns to the client immediately, the email goes out
  asynchronously).
- The `logPasswordRecoveryCompletion(userId, email)` audit logger in
  `src/modules/auth/actions/recovery.ts` — UNCHANGED. The email send is
  a sibling effect of this logger, not a replacement.
- The Supabase Send Email Hook (`/api/auth-email-hook`) — UNCHANGED.
  This notification is NOT a Supabase-initiated auth email; it is a
  product email triggered by our own server code AFTER the auth update
  has completed. The hook is not involved.

Required after behavior:

1. NEW email template at
   `src/modules/notifications/lib/emails/PasswordChangedEmail.tsx`:
   - Wraps `<BaseEmail>` (same pattern as `RecoveryEmail.tsx`).
   - sq-only body strings (NOT a 4-locale STRINGS map — the policy is
     sq-only per Task 251):
     - Subject: "Fjalëkalimi juaj në Lero.al është ndryshuar"
     - Heading: "Fjalëkalimi i ndryshuar"
     - Body paragraph 1: "Përshëndetje{name ? `, ${name}` : ''}!"
     - Body paragraph 2: "Fjalëkalimi i llogarisë suaj në Lero.al sapo është ndryshuar nga {date} në orën {time} (ora e Tiranës)."
     - Body paragraph 3: "Nëse keni qenë ju, mund ta injoroni këtë email — gjithçka është në rregull."
     - Body paragraph 4: "Nëse NUK ishit ju, dikush mund të ketë akses te llogaria juaj. Klikoni më poshtë për të rivendosur menjëherë fjalëkalimin dhe për të dalë nga të gjitha pajisjet:"
     - CTA button (link): `<Link href="{NEXT_PUBLIC_SITE_URL}/sq/auth/forgot-password">Rivendos fjalëkalimin</Link>` — uses `NEXT_PUBLIC_SITE_URL` per `docs/env.md` canonical site URL rule; do NOT use `window.location.origin`.
     - Body paragraph 5: "Për ndihmë, kontaktoni: support@lero.al"
     - Signature: "Ekipi i Lero.al"
   - Component prop signature: `{ name?: string | null; changedAt: Date }` — accepts optional display name + the timestamp of the change.
   - Formats the date/time in Tirana timezone (`Europe/Tirane`) — use
     `Intl.DateTimeFormat('sq-AL', { timeZone: 'Europe/Tirane', ... })`
     to format both the date (e.g. "28 maj 2026") and time (e.g. "14:32").
   - Brand accent color via the exported `BRAND_ACCENT` constant from
     `BaseEmail.tsx` (consistent with the rest of the email family).

2. NEW helper function at
   `src/modules/notifications/lib/emails/passwordChanged.ts`:
   - Exports `async function sendPasswordChangedEmail({ to, name?: string | null, changedAt?: Date })`.
   - `changedAt` defaults to `new Date()` if omitted (the caller usually doesn't care).
   - Calls `sendEmail({ to, subject: 'Fjalëkalimi juaj në Lero.al është ndryshuar', react: <PasswordChangedEmail name={name} changedAt={changedAt} /> })`.
   - Returns the `SendEmailResult` (same shape as `sendEmail`).
   - Fire-and-forget at the callsite: callers `void sendPasswordChangedEmail(...)` and do NOT await — the user-facing result must not depend on email delivery.
   - Logs a Sentry breadcrumb on any send error (does not throw).

3. Integration site 1 — `ResetPasswordClient.tsx`:
   - The component cannot call email-sending code directly (it's a
     'use client' component and `sendEmail` is server-only).
   - Add the email send INSIDE `logPasswordRecoveryCompletion` in
     `src/modules/auth/actions/recovery.ts` (server action) — the
     existing callsite at `ResetPasswordClient.tsx:62` already invokes
     this, so no change to the client component is needed.
   - `logPasswordRecoveryCompletion` currently logs (per Task 157); add
     a fire-and-forget call to `sendPasswordChangedEmail({ to: userEmail, name: <resolve from users table or null>, changedAt: new Date() })` AFTER the existing logging.
   - On send failure: log to Sentry; do NOT propagate (the user's
     password change has already succeeded; the email is best-effort).

4. Integration site 2 — `changeCabinetPassword` (Task 273):
   - After the successful `updateUser({ password })` call AND before
     returning `{ ok: true }`, fire-and-forget
     `void sendPasswordChangedEmail({ to: user.email, name: <resolve from users table or null>, changedAt: new Date() })`.
   - On send failure: log to Sentry; do NOT block the result.

5. NO new locale keys in `messages/{sq,en,uk,it}.json` (the email is
   sq-only at the template level; no UI strings change).

6. NO change to the Supabase Send Email Hook handler.
7. NO change to other email templates.
8. NO change to `send.ts`.

Positive flow (happy path) — cabinet path (Task 273 integration):
- User changes their password in the cabinet (Task 273 flow).
- `changeCabinetPassword` succeeds; returns `{ ok: true }` to the client.
- Server-side, fire-and-forget: `sendPasswordChangedEmail(...)` builds
  and sends the email via Resend.
- User receives an email in Albanian within ~5 seconds: subject
  "Fjalëkalimi juaj në Lero.al është ndryshuar", body confirming the
  change at {date} {time} (Tirana time) with a "Rivendos fjalëkalimin"
  CTA link to /sq/auth/forgot-password.
- Client-side, the user is already on the success state of the cabinet
  form (signOut → redirect to login).

Positive flow (happy path) — recovery path (ResetPasswordClient.tsx
integration):
- User clicks recovery link in email → enters new password → submits.
- `updatePassword(password)` succeeds.
- `logPasswordRecoveryCompletion(userId, email)` runs; logs the event
  (Task 157 audit logging) AND fires `sendPasswordChangedEmail(...)`.
- User sees the success state, then `signOut()`, then redirect to login.
- User receives an email in Albanian within ~5 seconds.

Negative flow (every off-happy-path branch):
- **Email send fails (Resend 4xx / 5xx, RESEND_API_KEY missing in dev)** — fire-and-forget; the password change still completes; Sentry breadcrumb logged with the failure reason. User-facing result UNCHANGED (`{ ok: true }`).
- **`to` email is null or empty** (defensive — shouldn't happen because the user has just authenticated, but guard anyway) — early return inside `sendPasswordChangedEmail` with `{ error: 'missing_content' }`; Sentry breadcrumb logged; no email sent.
- **`name` is null** (user hasn't set a display name) — the email body uses just "Përshëndetje!" without a name (the `name ? `, ${name}` : ''` template handles this).
- **`changedAt` is the wrong timezone** — `Intl.DateTimeFormat('sq-AL', { timeZone: 'Europe/Tirane' })` always formats in Tirana time regardless of server timezone.
- **The user just changed their password successfully BUT they're a tombstoned/soft-deleted user (`deleted_at IS NOT NULL`)** — they shouldn't be able to log in OR change their password anyway; this is an upstream invariant violation. Defensive: still send the email if the auth path reached this point (the user's email is valid; warning them is the right call).
- **Multiple rapid password changes (e.g. user changes password twice in 30 seconds)** — each triggers one email. No deduplication intended (each event is a real security signal).
- **RESEND_API_KEY missing in production** — `sendEmail` already returns early with a log warning per `send.ts`. The password change still completes. Sentry catches the absence.
- **Resend domain not verified for the sender** — `send.ts` already maps this to `'unverified_sender'`; logged; password change still succeeds. Owner verifies the sender domain.
- **Email body render fails** (React Email render error) — `sendEmail` already catches and returns `{ error: 'send_failed' }`; logged; password change still succeeds.
- **`logPasswordRecoveryCompletion` throws** (existing Task 157 logging fails for unrelated reasons) — wrap the new `sendPasswordChangedEmail` call so that a logger failure does not prevent the email send, AND a send failure does not prevent the existing logger from completing. Both are sibling best-effort calls.
- **The Resend dashboard is rate-limited** — `send.ts` maps to `'transient'`; logged; password change still succeeds.
- **The user's email is `@lero.al`-internal (super-admin)** — they receive the email like any other user; no special handling.
- **The cabinet path's `changeCabinetPassword` returns `{ ok: false, ... }`** — the email is NOT sent (it's only called after `ok: true`).
- **The recovery path's `updatePassword` returns an error** — `logPasswordRecoveryCompletion` is not called (it's only called after `error === null` per `ResetPasswordClient.tsx:60`), so the email is not sent.

Required investigation (paste outputs into the Task 276 session log):

1. Confirm the `sendEmail` helper signature + the `BaseEmail` props:
   ```
   grep -n "^export\|^const\|^export const" src/modules/notifications/lib/emails/send.ts src/modules/notifications/lib/emails/BaseEmail.tsx
   ```

2. Confirm the existing `logPasswordRecoveryCompletion` signature + body:
   ```
   grep -n "logPasswordRecoveryCompletion\|export\|function" src/modules/auth/actions/recovery.ts
   ```
   Specifically: does it currently look up the user's display name? Where does it get the email from?

3. Confirm `Task 273` has shipped (or is shipping in parallel) — the
   cabinet integration site needs `changeCabinetPassword` to exist:
   ```
   grep -n "changeCabinetPassword" src/modules/cabinet/actions/index.ts
   ```
   If absent: STOP & ASK. This task cannot integrate site #2 without
   Task 273 in place.

4. Confirm the existing 'sq' string conventions in
   `Albanian-only email policy`:
   ```
   grep -n "sq\|Albanian" src/modules/notifications/lib/emails/contactInquiry.ts | head -10
   ```

5. Confirm the canonical site URL helper / pattern used in other
   emails:
   ```
   grep -n "NEXT_PUBLIC_SITE_URL\|process.env" src/modules/notifications/lib/emails/RecoveryEmail.tsx
   ```

6. Confirm the date/time formatting convention used elsewhere
   (Tirana timezone):
   ```
   grep -rn "Europe/Tirane\|sq-AL" src/modules/notifications/lib/emails/
   ```

Scope (files Sonnet may touch):

1. `src/modules/notifications/lib/emails/PasswordChangedEmail.tsx` — NEW file.
2. `src/modules/notifications/lib/emails/passwordChanged.ts` — NEW file (helper that wires the template into `sendEmail`).
3. `src/modules/auth/actions/recovery.ts` — add the fire-and-forget call inside `logPasswordRecoveryCompletion`.
4. `src/modules/cabinet/actions/index.ts` — add the fire-and-forget call inside `changeCabinetPassword` (after the successful `updateUser`). REQUIRES Task 273 shipped.
5. `docs/backlog.md` — standard task-closure update (advance "Last task number" to 276; Last Session note; Session Archive row).
6. `docs/sessions/2026-05-28-task-276-password-changed-email.md` — NEW session log per Task 264.

Out of scope (do NOT touch):
- Other email templates.
- `send.ts` (consume as-is).
- `BaseEmail.tsx`.
- Supabase Send Email Hook (`/api/auth-email-hook`).
- Locale message files (this is a sq-only email at the template level; no UI strings change).
- `ResetPasswordClient.tsx` (the integration is at the server-action level via `logPasswordRecoveryCompletion`).
- `AuthSheet.tsx`.
- Cabinet UI component (`CabinetPasswordSection.tsx` from Task 273 — the integration is at the server-action level).
- Admin email-template editor (no UI surface for this template — it's a system email, not an admin-editable one). If the admin email-template editor enumerates templates: STOP & ASK whether this template should also appear there (separate kickoff if so).
- Email preview server (`npm run email`) configuration.

Acceptance criteria (literal):
- `src/modules/notifications/lib/emails/PasswordChangedEmail.tsx` exists, wraps `<BaseEmail>`, has sq-only body with the exact strings above, accepts `{ name?: string | null; changedAt: Date }`, formats date+time in `Europe/Tirane` via `Intl.DateTimeFormat('sq-AL', ...)`, uses `NEXT_PUBLIC_SITE_URL` for the CTA href.
- `src/modules/notifications/lib/emails/passwordChanged.ts` exists, exports `sendPasswordChangedEmail({ to, name?, changedAt? })`, calls `sendEmail` with the new template, returns `SendEmailResult`, logs Sentry on failure, never throws.
- `src/modules/auth/actions/recovery.ts` — `logPasswordRecoveryCompletion` fires `void sendPasswordChangedEmail({ to: email, name: <resolved or null>, changedAt: new Date() })` after the existing logging.
- `src/modules/cabinet/actions/index.ts` — `changeCabinetPassword` fires `void sendPasswordChangedEmail({ to: user.email, name: <resolved or null>, changedAt: new Date() })` after `{ ok: true }` and before returning to client.
- Both integration sites use fire-and-forget (`void`); no `await`; the password change result is independent of email delivery.
- No new locale keys.
- `docs/backlog.md` updated.
- `docs/sessions/2026-05-28-task-276-password-changed-email.md` exists with Files Changed table + Note 18 self-validation block.
- Positive flow runtime: trigger a password reset on staging (or dev with RESEND_API_KEY set) → confirm the new email arrives within ~5 seconds.
- Negative flow audit: each branch above → file:line of the guard / handler / catch.
- `tsc=0` errors.
- Self-validation verdict line:
  `Self-validation: tsc=0 errors · build=passes · AC table=all green · runtime locale=sq PASS (email is sq-only) · scope=clean`.

Final report required from Sonnet:
1. Files Changed table (6 files expected).
2. Email subject + body screenshot (or copy-paste of the rendered HTML) — sq locale.
3. Both integration-site code snippets showing the fire-and-forget call (with file:line).
4. Date/time formatting verification: paste a sample formatted output (e.g. "28 maj 2026 14:32 (ora e Tiranës)").
5. Negative flow audit: each branch → file:line.
6. Note 18 self-validation verdict line.
7. Confirmation that no locale message file was touched.

Do NOT emit `git add` / `git commit` commands. Do NOT run git. Do NOT
modify other email templates. Do NOT modify `send.ts`. Do NOT modify
the Supabase Send Email Hook.
```
