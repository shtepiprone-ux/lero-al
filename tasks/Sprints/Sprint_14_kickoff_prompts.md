# Sprint 14 — kickoff prompts (Tasks 250, 262, 263, 251, 252, 244, 242, 248)

> **Mandatory rules — non-negotiable on every task in this sprint:**
>
> - `docs/agent-contract.md` **clause 6a** (Positive + Negative flow gate, Task 255). Every task MUST contain two explicit sections: `Positive flow (happy path)` and `Negative flow (every off-happy-path branch)`. A diff that ships only the happy path is INCOMPLETE — orchestrator routes it back.
> - `docs/agent-contract.md` **clause 10** + `CLAUDE.md` "Commit hand-off" + `docs/ai-behavior.md` "Commit Rules" (Task 264). Sonnet MUST include a "Files Changed" table in the session log (path + 1-line rationale per file). Sonnet MUST NOT emit `git add` / `git commit` commands. The orchestrator (Opus) emits explicit-path commit commands during review.

> **Shared hard contract (top of every prompt).** You are Claude Code Sonnet 4.6 working in `lero-al`. **P0 contract:** read `docs/agent-contract.md` FIRST — clauses 1-10 + clause 6a (Positive+Negative) + clause 10 (Files Changed table, no commit commands).
>
> **Pre-read selection:** every task lists its `Pre-read` from `docs/rule-index.md` under the matching task type — never "read all docs".
>
> Long-form rules: `docs/orchestrator-role.md` → "Hard contract embedded in EVERY Sonnet prompt" + the new "Orchestrator-owned commit emission (Task 264)" section. Notes 18/19/20/21/22/23 in `docs/ai-behavior.md` — non-optional.
>
> **No scope change; no invented architecture (STOP & ask the orchestrator if anything is ambiguous);** literal AC; self-validate BEFORE the "complete" claim (`tsc=0`, AC-by-AC audit table, diff self-review, runtime check in `uk` 320px); preserve UX flow and existing controls (before/after inventory); update `docs/backlog.md` + add session log under `docs/sessions/` with a "Files Changed" table; 0 new lint/typecheck errors; `npm run build` passes; governance PASS; locale parity sq/en/uk/it (every new string ×4); responsive 320/375/390/768/1280/1440/2560 for any UI. Owner runs SQL — emit any new SQL into the session log; the executor NEVER runs git or SQL itself.
>
> **Every task below uses this Pre-read header:**
> 1. `docs/agent-contract.md` (P0 contract, INCLUDING clause 6a Positive+Negative + clause 10 Files Changed)
> 2. `docs/backlog.md`
> 3. Task-relevant docs from `docs/rule-index.md` (named per task)
> 4. Inspect `package.json` for current validation scripts.

---

## Task 250 — R.3a — `role_permissions` hardening + `role_permission_events` audit log

```
Hard contract: see top.

REFERENCE KICKOFF: `tasks/Epics/Epic_R_kickoff_prompt_Task_250.md` (the pre-existing full kickoff).
Sprint 14 delta below adds the Task 255 Positive/Negative flow sections + Task 264 Files Changed
table requirement — both missing from the reference kickoff.

GOAL (verbatim from reference): harden the role_permissions table introduced in Task 197 + add a
`role_permission_events` audit-log table so every grant/revoke is observable. Supersedes the SQL
in Task 197 (which is no longer to be run). Owner runs all SQL.

Pre-read (in addition to the Sprint-wide always-required header):
- `docs/rule-index.md` → "DB / server action / RLS task" bundle:
  - docs/data-access-rules.md
  - docs/domain-rules.md
  - docs/rls-rules.md
  - docs/qa-rules.md
- `docs/rule-index.md` → "Schema / migration task" bundle:
  - docs/architecture.md
- `tasks/Epics/Epic_R_kickoff_prompt_Task_250.md` (full original kickoff — Sprint 14 inherits it)
- Task 197 session log (the SQL this task SUPERSEDES)
- `src/lib/auth/assertPermission.ts` (the gate that consults role_permissions)
- `src/components/admin/AdminPermissionsManager.tsx` (admin UI if present — list/grant/revoke)

Current behavior to preserve:
- Affected surfaces: admin permissions management UI; every `assertPermission(...)` call site.
- Existing controls: every existing permission row + every existing role.
- Existing access boundaries: any role that currently has a permission keeps it (no silent revoke).
- Existing audit logging (if any): preserved + extended.

**Admin Table Preservation Rule (Note 22):** Before editing the permissions admin surface, inventory in the session log: columns, row click, inline controls, filters, search, pagination, sort, empty state, loading state, mobile layout. After the change, every existing admin action remains reachable.

Required after behavior:
As an admin/moderator:
1. The `role_permissions` table is hardened per the reference kickoff scope (FK constraints, indexes, RLS policies as documented).
2. Every grant/revoke event writes a row to `role_permission_events` (actor_id, role, permission, action: grant|revoke, ts).
3. `/admin/permissions` (if present) shows the audit log OR exposes it via a separate page (orchestrator decides — STOP & ask if unclear).
4. `assertPermission(...)` continues to work for every existing call site without regression.

Positive flow (happy path):
- Actor: admin with `permissions.manage`.
- Preconditions: owner has applied the new idempotent SQL emitted in the session log.
- Steps:
  1. Admin opens permissions UI → sees current grants.
  2. Admin grants `listings.set_premium` to role `moderator` → server action calls grantPermission → DB insert in role_permissions → DB insert in role_permission_events.
  3. UI refreshes → grant visible; audit row visible.
  4. Admin revokes same → DB delete from role_permissions → DB insert in role_permission_events with action='revoke'.

Negative flow (every off-happy-path branch):
- Owner has NOT applied the new SQL → `assertPermission(...)` may fail; document a defensive "schema not ready" state in the UI; do not silently break. STOP & ask the orchestrator before shipping the code if SQL is not yet applied.
- Non-admin attempts grant/revoke → assertPermission throws → toast.error(t('permissions.error_forbidden')) (new key ×4).
- Duplicate grant (already exists) → INSERT ... ON CONFLICT DO NOTHING; do NOT write an audit row for a no-op. UI shows toast.info(t('permissions.already_granted')) (new key ×4).
- Revoke of a permission that doesn't exist → similar no-op + toast.info(t('permissions.not_granted')) (new key ×4).
- DB error → toast.error(t('permissions.error_transient')) (new key ×4); UI state NOT mutated.
- Concurrent grant by another admin → realtime/refresh handles it; no silent state divergence.
- Cancel/Esc on any dialog → no DB write.
- Audit log query fails → admin sees "audit unavailable" banner; permissions UI still works.

Scope:
1. Read the reference kickoff in full (Epic_R_kickoff_prompt_Task_250.md). Apply its scope items 1-N.
2. Add the audit log table + grant/revoke event writes per the reference.
3. Add the negative-flow toasts + locale keys (4-6 new keys ×4 locales).
4. Files Changed table in session log per Task 264.

Acceptance criteria:
- All AC from the reference kickoff Epic_R_kickoff_prompt_Task_250.md.
- Positive flow steps 2-4 verifiable in diff at the action file + UI component + locale files.
- Every negative-flow branch above has a verifiable handler in diff with the correct locale key.
- Idempotent SQL emitted in session log (supersedes Task 197 SQL).
- "Files Changed" table in session log per Task 264 (path + 1-line rationale per file).
- Self-validation block per Note 18.
- 0 new lint/typecheck errors; `npm run build` passes; 4 locales; 7 breakpoints for any UI.
- docs/backlog.md updated; session log: docs/sessions/2026-05-2N-task-250-r3a-role-permissions.md.

Out of scope: anything outside the reference kickoff's scope; new permission keys (separate task); UI redesign of the permissions admin surface.
```

---

## Task 262 — X.3 — `market_type` DB column audit + `Listing` type alignment

```
Hard contract: see top.

KICKOFF FILE: `tasks/Epics/Epic_X_kickoff_prompt_Task_262.md` — **already compliant** with Task 255
(Positive + Negative flow) and Task 264 (Files Changed table required in session log). Read and
execute that file in full. No Sprint 14 delta needed.

Files Changed table requirement (Task 264 reminder): include in the session log at the end.
```

---

## Task 263 — T.7 — Listing-detail contact card RLS cleanup (revert Task 258 admin-client bypass)

```
Hard contract: see top.

KICKOFF FILE: `tasks/Epics/Epic_T_kickoff_prompt_Task_263.md` — **already compliant** with Task 255
+ Task 264. Read and execute that file in full. No Sprint 14 delta needed.

Owner-action gate (verbatim from the kickoff): DO NOT ship the code revert until the owner
confirms the RLS SQL ran. The kickoff already documents this gate.

Files Changed table requirement (Task 264 reminder): include in the session log at the end.
```

---

## Task 251 — GG.1 — Albanian-only outbound email policy

```
Hard contract: see top.

REFERENCE KICKOFF: `tasks/Epics/Epic_GG_kickoff_prompt_Task_251.md`. Sprint 14 delta below adds
Positive/Negative flow + Files Changed table.

GOAL (verbatim from reference): every outbound email sent via Resend (registration verify, password
reset, admin reply, contact notification, inquiry reply, saved-search alert, price-change alert,
inactivity reminder, etc.) is sent in **Albanian (sq)** regardless of the recipient's
preferred_locale or in-app locale. Owner directive 2026-05-25.

Pre-read (in addition to the Sprint-wide always-required header):
- `docs/rule-index.md` → "Email / auth lifecycle task" bundle:
  - docs/env.md
  - docs/domain-rules.md
  - docs/qa-rules.md
  - docs/integrations.md
- `tasks/Epics/Epic_GG_kickoff_prompt_Task_251.md` (full original kickoff)
- src/modules/notifications/lib/emails/* (every email template + send helper)
- messages/sq.json (the Albanian source-of-truth for email copy)

Current behavior to preserve:
- Affected surfaces: every outbound email send call.
- Existing controls: email templates, send helpers, admin reply composer, contact form — preserved.
- Existing data: contact_inquiries, contact_inquiry_replies, users.preferred_locale — preserved.
- Existing read-only labels: NONE removed; only the locale routing changes.
- Existing in-app behavior: unchanged (the app UI still localizes to the user's selected locale).

Required after behavior:
As any user receiving any outbound email from lero.al in any of the existing flows (registration verify, password reset, admin reply, contact notification, inquiry reply, saved-search alert, price-change alert, inactivity reminder, etc.):
1. The email body is in Albanian (sq), regardless of the recipient's preferred_locale.
2. The email subject is in Albanian.
3. The CTA links inside the email point to `${NEXT_PUBLIC_SITE_URL}/sq/...` (Albanian locale path).
4. Any from-the-app context preserved (no change to the user's in-app locale).

Positive flow (happy path):
- Actor: any flow that calls a Resend send helper.
- Preconditions: every email helper accepts an explicit `locale` param OR reads from a central constant.
- Steps:
  1. The send helper is called (with or without recipient.preferred_locale).
  2. The helper IGNORES recipient.preferred_locale and ALWAYS uses `sq` for getTranslations + URL building.
  3. The email is rendered using sq locale messages; CTAs use /sq/... links.
  4. Resend delivers the email; the body + subject are Albanian.

Negative flow (every off-happy-path branch):
- A caller still passes `locale: recipient.preferred_locale`: the helper IGNORES it (defensive) and forces sq. Document this in the helper as a comment so future devs don't try to "fix" it back to multi-locale.
- sq.json is missing a required key: the email render falls back to the message key — DO NOT silently send an English fallback. Add a defensive grep test in `npm run test` or pre-commit that checks every email template's required keys exist in sq.json.
- Recipient has zero account state (e.g. contact form inquiry — no preferred_locale): no behavior change (already sq by force).
- Re-send of an existing email after policy change: the next send is sq even if the original was a different locale.
- Locale audit: list every send helper in the codebase; confirm each forces sq. ANY helper that doesn't is a regression. Add an inline lint/grep guard.

Scope:
1. Identify every Resend send helper in src/modules/notifications/lib/emails/*.
2. Force `locale = 'sq'` at the helper-layer (not the caller layer).
3. Update CTAs / generated links to use `/sq/...`.
4. Locale audit: list every send site in the session log with the locale param passed before vs after.
5. Defensive: add a comment + (optional) a unit test asserting the helper ignores non-sq locale param.

Acceptance criteria:
- Positive flow step 2 (helper forces sq) verifiable in every send helper file in diff.
- Negative flow → "caller passes non-sq locale, helper ignores" verifiable per helper (with defensive comment).
- Negative flow → missing sq key surfaces as render error (NOT silent fallback to en).
- Audit table in session log: send site × locale-before × locale-after.
- "Files Changed" table in session log per Task 264.
- Self-validation block per Note 18.
- 0 new lint/typecheck errors; `npm run build` passes; sq.json key parity preserved.
- docs/backlog.md updated; session log: docs/sessions/2026-05-2N-task-251-gg1-albanian-email.md.

Out of scope: in-app locale switching (preserved); email template visual redesign; new email flows.
```

---

## Task 252 — V.3 — Sales inbox split (admin reply routing)

```
Hard contract: see top.

REFERENCE KICKOFF: `tasks/Epics/Epic_V_kickoff_prompt_Task_252.md`. Sprint 14 delta below adds
Positive/Negative flow + Files Changed table.

DEPENDENCY: requires Task 251 (Albanian email) shipped first AND Task 256 (Resend sender verification — DONE 2026-05-27).

GOAL (verbatim from reference): when an admin replies to an inquiry, the reply email is sent FROM
the correct mailbox based on the inquiry's `target_mailbox` (sales@lero.al for sales/partnership/press
topics; support@lero.al for general/support/other). Today the reply may go from a single hardcoded
sender. Owner directive 2026-05-25.

Pre-read:
- `docs/rule-index.md` → "Email / auth lifecycle task" bundle:
  - docs/env.md
  - docs/domain-rules.md
  - docs/qa-rules.md
  - docs/integrations.md
- `tasks/Epics/Epic_V_kickoff_prompt_Task_252.md` (full original kickoff)
- Task 256 session log (V.5 sales mailbox — verified senders; structured email return)
- Task 251 (this sprint — Albanian email policy)
- src/modules/contacts/actions/index.ts (sendInquiryReply — currently uses inquiry.target_mailbox)
- src/modules/notifications/lib/emails/contactInquiry.ts (sendContactInquiryReply helper)

Current behavior to preserve:
- Affected surface: admin /admin/inquiries reply composer; the sendInquiryReply server action.
- Existing controls: status filter, mailbox filter, detail dialog, reply Textarea, Send button — preserved.
- Existing data: contact_inquiries.target_mailbox, contact_inquiry_replies — preserved.
- Existing toasts: status_updated, reply_success, reply_error, reply_email_failed — preserved.
- The Task 256 structured email return (mailbox_unverified, reply_email_failed) — preserved.

Required after behavior:
As an admin replying to an inquiry whose target_mailbox is sales@lero.al, in any of the four locales (admin UI; email body is Albanian per Task 251):
1. Click Send → reply email goes FROM `sales@lero.al` to the original requester.
2. The user receives the email at their original email address; the FROM is sales@lero.al; the body is Albanian.
3. Admin UI shows toast.success(t('reply_success')).

Same as above for support@lero.al inquiries.

Positive flow (happy path):
- Actor: admin replying via /admin/inquiries.
- Preconditions: Task 251 done (helper forces sq); Task 256 done (sales@ + support@ verified in Resend); inquiry has target_mailbox set.
- Steps:
  1. Admin types reply ≥5 chars → Send.
  2. sendInquiryReply asserts admin + inserts reply row + calls sendContactInquiryReply with fromMailbox = inquiry.target_mailbox (sales@ or support@).
  3. Helper builds email FROM the resolved mailbox + Albanian body.
  4. Resend accepts; email lands in recipient inbox; FROM is sales@lero.al or support@lero.al.

Negative flow (every off-happy-path branch):
- inquiry.target_mailbox is empty (legacy row pre-V.1): fall back to support@lero.al; log warning; do NOT block.
- mailbox not verified (regression): Resend returns 403; Task 256's typed error returns `unverified_sender`; UI shows toast.warning(t('reply_email_failed')) (existing key from Task 256); reply IS recorded in DB (DB-first ordering preserved).
- target_mailbox is sales@ but Task 256 owner verification was rolled back: same as above (mailbox_unverified).
- Cancel/Esc/backdrop: no DB write, no email send.
- Double-submit: `isPending` guard (existing).
- Reply email succeeds but DB INSERT into contact_inquiry_replies fails (rare): user receives the email but admin sees toast.error(t('reply_error')); reply NOT recorded. This is a known edge — document but do NOT add retry (out of scope).

Scope:
1. Verify sendInquiryReply already uses inquiry.target_mailbox (it does per Task 256 audit). Confirm in audit table.
2. Verify the helper resolves `fromMailbox` correctly: sales@ → 'Lero.al <sales@lero.al>', support@ → 'Lero.al <support@lero.al>'.
3. Audit every inquiry row in DB (read-only query in session log; no data mutation): how many have target_mailbox = sales@ vs support@ vs null?
4. Defensive: if target_mailbox is null/empty, fall back to support@ with a warning log.
5. Locale audit: confirm reply email body is Albanian (Task 251).

Acceptance criteria:
- Positive flow step 4 (FROM matches inquiry.target_mailbox) verifiable in diff at sendContactInquiryReply call.
- Negative flow → target_mailbox null branch verifiable (fallback + warning log).
- Negative flow → mailbox_unverified path preserved (Task 256 wiring intact).
- Audit query result in session log (count by target_mailbox).
- "Files Changed" table per Task 264.
- Self-validation block per Note 18.
- 0 new lint/typecheck errors; `npm run build` passes; 4 locales (any new keys); 7 breakpoints (admin UI unchanged).
- docs/backlog.md updated; session log: docs/sessions/2026-05-2N-task-252-v3-sales-inbox-split.md.

Out of scope: changing the admin reply UI; adding new mailboxes; auto-routing improvements (separate task if owner asks).
```

---

## Task 244 — CC.1 — Phone Combobox placeholder 9 digits across the project

```
Hard contract: see top.

REPLACES the Sprint 12 kickoff for Task 244 (Sprint_12_kickoff_prompts.md). This Sprint 14 version
adds Positive/Negative flow + Files Changed table.

BUG (issues.txt 2026-05-25 #9): phone-number combobox placeholder shows 8 digits everywhere on
site + admin. Albanian mobile numbers are 9 digits. Placeholder must be 9 digits.

Pre-read:
- `docs/rule-index.md` → "UI / layout / component task" bundle:
  - docs/ui-rules.md
  - docs/component-rules.md
  - docs/qa-rules.md
- docs/ai-behavior.md → Localization (i18n) Rules + Note 14 (Global Change Verification) + Note 18 (self-validation)
- Task 158 session log (libphonenumber-js + PhoneField), Task 170 (phone validation i18n), Task 187 (45 country codes), Task 188 (client validation)
- src/components/shared/PhoneField.tsx
- messages/sq.json / en.json / uk.json / it.json — every key whose value looks like a phone placeholder

Current behavior to preserve:
- Affected surfaces: every phone input across the site + admin (registration, login, profile, listing form, admin user-profile edit, contact form, etc.).
- Existing controls: PhoneField (country-code Combobox + national-number input) — unchanged in behavior.
- Existing editable controls: country-code selector + national-number input — both stay editable.
- Existing validation: libphonenumber-js validation rules unchanged.
- Existing server actions: unchanged.
- Existing read-only label: only the placeholder text changes (8-digit → 9-digit).

Required after behavior:
As any user, on any surface containing a phone input, in any of the four locales:
1. The phone input renders with a 9-digit placeholder (e.g. `691 234 567` — confirm exact string with the orchestrator if no canonical example exists).
2. Validation, country-code selection, and submission behavior are unchanged.
3. Locale parity ×4: all four files carry the 9-digit placeholder in the same key set.

Positive flow (happy path):
- Actor: any user typing in a phone input.
- Steps:
  1. PhoneField mounts → placeholder reads `t('placeholder_phone')` (or similar) → renders the 9-digit example.
  2. User types → existing validation runs unchanged.
  3. Submit → existing server action unchanged.

Negative flow (every off-happy-path branch):
- Locale key missing in one of the 4 files: render-time next-intl warning; verify all 4 files have the key.
- Country-code switched: placeholder MAY change per country if the project supports that (verify in audit; STOP & ask if unclear); default behavior is single 9-digit Albanian placeholder.
- Hardcoded fallback in PhoneField.tsx: grep for any inline placeholder string; replace with the locale key.
- Existing 8-digit example still present anywhere in messages/*.json: grep audit must show 0 remaining 8-digit phone placeholders.
- Sequential entry exceeding 9 digits: existing validation handles it (no change to validation in this task).

Scope:
1. Audit. Grep messages/*.json for any phone-placeholder strings. List them with current 8-digit values.
2. Grep PhoneField.tsx (and any sibling) for a fallback hardcoded placeholder; fix that too.
3. Update every placeholder to a 9-digit example. If there's no canonical example string already in the repo, propose `691 234 567` and STOP to confirm with the orchestrator before shipping.
4. Locale parity ×4: every locale file must carry the 9-digit placeholder.

Acceptance criteria:
- Positive flow step 1 (9-digit placeholder rendered) verifiable in runtime check + grep proof.
- Negative flow → grep proves no remaining 8-digit phone placeholders in messages/*.json OR component fallbacks.
- Locale parity ×4 verified.
- "Files Changed" table per Task 264.
- Self-validation block per Note 18.
- 0 new lint/typecheck errors; `npm run build` passes; 4 locales; 7 breakpoints.
- docs/backlog.md updated; session log: docs/sessions/2026-05-2N-task-244-cc1-phone-placeholder.md.

Out of scope: changing phone validation rules (Tasks 158/170/187/188); changing country-code defaults; CC.2 (multi-lang search match).
```

---

## Task 242 — BB.1 — Listing report button broken on detail page

```
Hard contract: see top.

REPLACES the Sprint 12 kickoff for Task 242. Adds Positive/Negative flow + Files Changed table.

BUG (issues.txt 2026-05-25 #100): the "Поскаржитись" button on public listing detail is visible
but clicking it does nothing. Epic C reports backend exists; UI wiring broken or lost in refactor.

Pre-read:
- `docs/rule-index.md` → "UI / layout / component task" bundle:
  - docs/ui-rules.md
  - docs/component-rules.md
  - docs/qa-rules.md
- docs/ai-behavior.md → Note 19 (UX-flow preserved) + Note 20 (no silent control removal — verify the dialog component still exists) + Note 18 (self-validation)
- Task 117 session log (`ListingReportDialog` + `reportListingAction`)
- Task 118 + Task 125 session logs (admin reports dashboard + reporter notification)
- src/modules/listings/components/ListingContact.tsx (where Report button trigger lives)
- src/modules/listings/components/ListingReportDialog.tsx
- Task 258 (T.5) preserved canReport gating — must not regress

Current behavior to preserve:
- Affected surface: public listing detail page — contact card / actions row containing "Поскаржитись".
- Existing controls: WhatsApp, Call, Send message, FavoriteButton, SaveToCollectionButton, Share, ListingReportDialog — all reachable.
- Existing editable controls: Report dialog form fields (reason, optional comment).
- Existing server actions: `reportListingAction` intact; only UI wiring broken.
- Existing canReport gating: signed-in users who are NOT the listing owner (preserved per Task 258).
- Existing mobile behavior at 320px in uk.

Required after behavior:
As a signed-in user (not owner), on the public listing detail page:
1. Click "Поскаржитись" → canonical `ListingReportDialog` opens.
2. Fill the reason → submit → server action creates a `reports` row → success toast (4 locales).
3. Admin sees the new row in `/admin/reports`.
4. Admin changes the report status → reporter receives in-app notification + email (Task 125; email is Albanian per Task 251).
5. Esc / backdrop / Cancel all behave correctly inside the dialog.

Positive flow (happy path):
- Actor: signed-in user viewing a listing they don't own.
- Steps:
  1. canReport=true → button rendered.
  2. Click → setOpen(true) → ListingReportDialog mounts.
  3. User picks reason + optional comment → Submit → reportListingAction.
  4. DB row created → success toast → dialog closes.
  5. Admin sees new row; reporter notification fires on status change.

Negative flow (every off-happy-path branch):
- Guest viewer (canReport=false): button NOT rendered (existing gating preserved).
- Owner viewer (canReport=false): button NOT rendered.
- Cancel/Esc/backdrop in dialog: no DB write, dialog closes.
- Validation: reason empty → submit disabled OR toast.error(t('listing.report_validation_reason'));
- Server returns `{ error: 'forbidden' }`: toast.error(t('listing.report_error_forbidden')) (preserved or new key ×4).
- Server returns `{ error: 'transient' }`: toast.error(t('listing.report_error_transient')) (preserved or new key ×4); form preserved.
- Duplicate report (same user + same listing): server returns `{ error: 'duplicate' }`; toast.info(t('listing.report_already_filed')) (new key ×4); dialog closes.
- Double-submit: existing isPending guard.

Scope:
1. Reproduce. Capture the broken-state trace (entry → click → ??? ).
2. Root-cause: is Dialog mounted? Is `open` state ever set true? Is trigger pointing at right component? Is the server action returning an error that's silently swallowed?
3. Fix the wiring at the smallest scope. Do NOT redesign the report flow.
4. End-to-end verify: signed-in non-owner reports → row in admin → status change → notification email reaches reporter (Task 125 contract preserved; email Albanian per Task 251 if shipped before this).

Acceptance criteria:
- Positive flow step 2-3 (dialog opens, submit creates row) verifiable in diff.
- Negative flow → cancel/Esc/backdrop preserved (no regression).
- Negative flow → duplicate-report path: confirm with orchestrator if a `duplicate` server-error exists OR if this is out of scope; STOP & ask if unclear.
- Reporter notification fires (no Task 125 regression).
- UX-flow trace + control-inventory in session log.
- "Files Changed" table per Task 264.
- Self-validation block per Note 18.
- 0 new lint/typecheck errors; `npm run build` passes; 4 locales; 7 breakpoints.
- docs/backlog.md updated; session log: docs/sessions/2026-05-2N-task-242-bb1-listing-report-button.md.

Out of scope: redesigning reports schema or admin dashboard; changing email content.
```

---

## Task 248 — FF.1 — Header reactivity on profile name change

```
Hard contract: see top.

REPLACES the Sprint 12 kickoff for Task 248. Adds Positive/Negative flow + Files Changed table.

BUG (issues.txt 2026-05-25 #30): user changes name in cabinet Profile tab and saves; the header
user-chip keeps showing the OLD name until manual page reload. Note-19 cross-page-reactivity
violation.

Pre-read:
- `docs/rule-index.md` → "Profile / edit-flow task" bundle:
  - docs/ui-rules.md
  - docs/component-rules.md
  - docs/qa-rules.md
  - docs/state-authority.md
- docs/ai-behavior.md → **Note 19** (cross-page propagation) + **Note 23 (Edit-Flow Preservation Rule)** + Note 18 (self-validation) + No Fake Fixes Policy
- Task 185 session log (P.3 — stale header after self-delete; AuthController commit pattern is the closest precedent)
- src/modules/cabinet/components/ProfileTab.tsx (name edit + save flow)
- header user-chip component (grep — likely src/components/shared/Header*.tsx) + auth context / user state holder

Current behavior to preserve:
- Affected surfaces: cabinet ProfileTab (name edit + save), site header (user chip), sidebar (if it shows name), breadcrumb (if shows name), any greeting surface.
- Existing controls: ProfileTab name input + Save button — both stay editable.
- Existing editable controls: name field — unchanged in editability; only reactivity is being fixed.
- Existing read-only labels: header user-chip — read-only display; just needs to update without manual reload.
- Existing server actions: profile-update server action (preserve behavior; this is a state-authority fix).
- Existing success/error behavior: save toast on success, error toast on failure (preserved).
- Existing mobile behavior at 320px in uk.

**Edit-Flow Preservation Rule (Note 23):**
Name field MUST remain editable. After save, the new name must persist after `router.refresh()` or page reload (true today; do not regress). The header / sidebar / breadcrumb (read-only displays) must reflect the new name without manual reload — that is the FIX.

Required after behavior:
As a signed-in user, in cabinet on Profile tab, in any of the four locales:
1. Edit name field and click Save.
2. Save server action succeeds.
3. Success toast appears (4 locales).
4. Header user-chip IMMEDIATELY shows new name — without manual page reload.
5. Sidebar, breadcrumb, every other surface displaying user name also shows new name without manual reload.
6. After `router.refresh()` or real page reload, new name persists everywhere.
7. Same behavior at 320 / 1280 / 2560 in uk.

Positive flow (happy path):
- Actor: signed-in user editing profile name.
- Steps:
  1. ProfileTab Save → server action updateProfile → DB update.
  2. Success path → state-authority layer (auth context / store) updates user.name.
  3. router.refresh() invalidates SSR cache for relevant routes.
  4. Header user-chip re-renders with new name.
  5. Sidebar, breadcrumb, greetings — all re-render.
  6. Toast: t('profile.save_success').

Negative flow (every off-happy-path branch):
- Empty name: client-side validation blocks save (existing guard).
- Server error: toast.error(t('profile.save_error')); no state mutation.
- Network offline: action rejects; toast.error; preserve form values.
- Double-submit: `isPending` guard.
- Cancel without saving: no state mutation; old name preserved everywhere.
- Concurrent edit in another tab: realtime/refresh handles; document if not addressed.
- Save succeeds, router.refresh fails (rare): the auth context update path still runs → header still updates client-side; next nav reflects truth.
- Avatar reactivity: verify and report status — if also broken, file as follow-up (out of scope here).
- The toast audit v2 (FF.2 / Task 249): separate task; no overlap.

Scope:
1. Map current data path: where does header read name? When does Save invalidate that source? Document in session log.
2. Fix at state-authority layer (server-authoritative → router.refresh() canonical; client-only divergence forbidden per No Fake Fixes).
3. Verify every other surface that renders user name — sidebar, breadcrumb, greetings — propagates the change. Grep proof + runtime note per surface.

Acceptance criteria:
- Positive flow step 4 (header updates without reload) verifiable end-to-end in runtime check.
- Positive flow step 5 (sibling surfaces also update) verifiable per surface.
- Negative flow → server error preserves form state.
- Negative flow → cancel preserves old name.
- UX-flow trace per Note 19 (entry → save → toast → header updates).
- "Files Changed" table per Task 264.
- Self-validation block per Note 18.
- 0 new lint/typecheck errors; `npm run build` passes; 4 locales; 7 breakpoints.
- docs/backlog.md updated; session log: docs/sessions/2026-05-2N-task-248-ff1-header-reactivity.md.

Out of scope: avatar reactivity (verify and report status — file follow-up if also broken); toast audit v2 (FF.2 / Task 249); auth lifecycle changes.
```
