# Sprint 13 — kickoff prompts (Tasks 255, 256, 257, 258, 259, 260, 261)

> **🆕 New mandatory rule (owner directive 2026-05-27 — codified in `docs/orchestrator-role.md`
> "Orchestrator standing rules" + `docs/agent-contract.md` clause 6a).**
>
> Every task in this sprint MUST be implemented with BOTH a `Positive flow (happy path)` AND a
> `Negative flow (every off-happy-path branch)`. A diff that only ships the happy path is INCOMPLETE
> — the orchestrator will route it back without approval. Every negative branch listed in this file
> must produce a verifiable handler/guard/toast/early-return in the diff.

> **Shared hard contract (top of every prompt).** You are Claude Code Sonnet 4.6 working in
> `lero-al`. **P0 contract:** read `docs/agent-contract.md` FIRST — it is the short,
> non-negotiable contract every Sonnet task must follow, INCLUDING the new clause 6a (Positive +
> Negative flow). Long-form rules: `docs/orchestrator-role.md` → "Hard contract embedded in EVERY
> Sonnet prompt" + "Orchestrator standing rules" (Task 255 entry) and the existing 2026-05-25 +
> 2026-05-27 rules in `docs/ai-behavior.md` — Notes 18/19/20/21/22/23 — non-optional.
>
> **Pre-read selection:** every task lists its `Pre-read` from `docs/rule-index.md` under the
> matching task type — never "read all docs".
>
> **No scope change; no invented architecture (STOP & ask the orchestrator if anything is
> ambiguous); literal AC; self-validate BEFORE the "complete" claim** (tsc=0 in shell, AC-by-AC
> audit table in session log, diff self-review, runtime check in `uk` 320px); **preserve UX flow
> and existing controls** (before/after inventory in session log); update `docs/backlog.md` + add
> session log under `docs/sessions/`; 0 new lint/typecheck errors; `npm run build` passes;
> governance PASS; locale parity sq/en/uk/it (every new string ×4); responsive
> 320/375/390/768/1280/1440/2560 for any UI.
>
> **Owner runs git AND SQL** — emit ready-to-run `git add <paths>` (or `git add -A`) +
> `git commit -m "<type>(TaskN): …"` as plain text at the end; emit any new SQL into the session
> log; the executor NEVER runs git or SQL itself.
>
> **Every task below uses this Pre-read header:**
> 1. `docs/agent-contract.md` (P0 contract, INCLUDING new clause 6a Positive+Negative flow)
> 2. `docs/backlog.md`
> 3. Task-relevant docs from `docs/rule-index.md` (named per task)
> 4. Inspect `package.json` for current validation scripts.
>
> **Every task below also carries:**
> - A `Current behavior to preserve` block (the surface inventory the orchestrator filled — Sonnet re-verifies in the session log).
> - A `Required after behavior` block (the user-facing outcome).
> - A `Positive flow (happy path)` block — step by step.
> - A `Negative flow (every off-happy-path branch)` block — branch by branch, each with: trigger, expected system response, what is shown to the user (toast + locale key), what is NOT done (DB / email / nav), recovery.
> - The conditional rule blocks (Notes 21/22/23) where the task type matches.

---

## Task 255 — V.4 — Admin inquiry detail: reply history visible (Bug 1)

```
Hard contract: see top.

BUG (owner 2026-05-27): on /admin/inquiries the admin opens an inquiry and only sees the original
user request — the admin's / moderator's replies are not visible in the detail dialog. The reply
record IS being inserted (Task 223 / contact_inquiry_replies), so the regression is either:
(a) the page is not loading the replies and passing them into <AdminInquiriesManager replies>,
(b) the replies array does not refresh after sendInquiryReply succeeds (locally added but lost on
    re-open / page nav),
(c) RLS on contact_inquiry_replies blocks the SELECT for the admin role.

The detail dialog ALREADY has rendering code for replies — `AdminInquiriesManager.tsx` lines
274-294 map `selectedReplies` and render the reply card. The bug is that `selectedReplies` is empty
at runtime. Verify which of (a)/(b)/(c) is the cause BEFORE fixing — paste evidence into the
session log.

Pre-read (in addition to the Sprint-wide always-required header):
- `docs/rule-index.md` → "Admin table / admin control task" bundle:
  - docs/ui-rules.md
  - docs/component-rules.md
  - docs/component-governance.md §11
  - docs/domain-rules.md
  - docs/rls-rules.md
  - docs/qa-rules.md
- docs/ai-behavior.md → Note 19 (UX flow preservation) + Note 22 (Admin Table Preservation) + Note 18 (self-validation) + No Fake Fixes Policy
- Task 223 session log (V.2 — contact_inquiry_replies table + RLS + sendInquiryReply + AdminInquiriesManager)
- src/app/admin/inquiries/page.tsx (the SSR page that loads inquiries + replies)
- src/components/admin/AdminInquiriesManager.tsx (lines 69-95 — how replies are filtered; lines 274-294 — render block)
- src/modules/contacts/actions/index.ts (sendInquiryReply — what it returns)

Current behavior to preserve:
- Affected surface: /admin/inquiries detail dialog.
- Existing controls: status filter row, mailbox filter row (all/support/sales), the inquiry list, the detail dialog (Open + Close + Esc + backdrop), the status Combobox, the reply Textarea, the Send reply Button.
- Existing data: contact_inquiries table + contact_inquiry_replies table (Task 223) — unchanged in shape.
- Existing read-only labels: From, Topic, Received, the original message block.
- Existing success/error toasts: `t('status_updated')`, `t('status_error')`, `t('reply_success')`, `t('reply_error')`.

**Admin Table Preservation Rule (Note 22):** Before changing the page, paste the current control
inventory into the session log: columns/rows on /admin/inquiries, row click → detail dialog,
inline controls, filters (status + mailbox), pagination if any, empty state, loading state,
mobile layout. After the change, every existing control still works.

Required after behavior:
As an admin or moderator, on /admin/inquiries, in any of the four locales:
1. The inquiry list still works as before.
2. Clicking any inquiry opens the detail dialog.
3. The dialog ALWAYS shows every admin/moderator reply ever recorded for that inquiry, in
   chronological order, with the replier's name and timestamp.
4. After sending a new reply, the new reply appears immediately in the history without manual
   reload AND it persists after closing/re-opening the dialog AND after `router.refresh()`.
5. The reply count badge on the list row updates immediately on send.

Positive flow (happy path):
- Actor: admin/moderator (auth + role assertion).
- Preconditions: inquiry exists; admin opens /admin/inquiries; at least one reply MAY already exist.
- Steps:
  1. Admin lands on /admin/inquiries → SSR loads ALL inquiries + ALL replies (or replies for the
     loaded inquiry set) and passes them via the `replies` prop to AdminInquiriesManager.
  2. Admin clicks a row → openDetail(inquiry) sets `selected`; selectedReplies derives from
     `allReplies.filter(r => r.inquiry_id === selected.id)` → renders the reply history block.
  3. Admin types a reply ≥ 5 chars → Send → server action `sendInquiryReply` inserts a row in
     contact_inquiry_replies AND returns the newly inserted reply row (id, body, created_at,
     replied_by, replier.name) — see "Scope" item 3.
  4. Client appends the returned reply to the local `allReplies` state (or `selectedReplies`) so
     the history block updates without a refetch.
  5. Reply count badge on the list row increments; status moves new → in_progress.
  6. Toast: `t('reply_success')`.
- Post-conditions:
  - DB: 1 new row in contact_inquiry_replies; inquiry row's reply_count +1, handled_by/at set,
    status → in_progress if was new.
  - Email: reply email sent to the original requester (Task 223 behaviour; preserved).
  - UI: reply history shows the new reply at the bottom; closing/re-opening the dialog still
    shows it; router.refresh() persists it.

Negative flow (every off-happy-path branch):
- Cancel / dismiss the dialog (Esc / backdrop / close button): no DB write, no email, no nav,
  no state mutation. Local reply textarea is reset on next openDetail (already implemented).
- Empty inquiry list: existing `t('no_inquiries')` empty state preserved; no change.
- Reply body < 5 chars: Send button stays disabled (already implemented via
  `replyBody.trim().length < 5`); no toast, no action call. Document the threshold in the
  session log (it must match server-side validation in sendInquiryReply).
- Server returns `{ error: 'validation' }`: toast `t('reply_error')`; reply NOT inserted; reply
  body NOT cleared; admin can edit and retry. (Already implemented; preserve.)
- Server returns `{ error: 'forbidden' }` (assertAdminOrModerator returned null — e.g. role
  revoked mid-session): toast `t('reply_error')`; route NOT changed automatically (admin can
  navigate away). Add a follow-up task if a forced re-auth is needed (out of scope here).
- Server returns `{ error: 'not_found' }` (inquiry deleted concurrently): toast
  `t('reply_error')`; on next list refresh the row disappears. Preserve.
- Server returns `{ error: 'save_failed' }` (DB insert error): toast `t('reply_error')`; reply
  body preserved.
- RLS blocks SELECT on contact_inquiry_replies for the admin role: this is the suspected root
  cause of Bug 1. If the audit confirms (c), update the RLS policy in the migration script and
  paste the SQL into the session log for the owner to run. Add a guard: if SSR loads 0 replies
  AND the inquiry has reply_count > 0, log a warning and surface an admin-only banner
  `t('reply_history_load_failed')` (new key ×4 locales) — NOT silently empty.
- Network/offline on Send: the server action rejects, surfaced via the existing transition;
  toast `t('reply_error')`; reply body preserved.
- Double-submit: the Send button is `disabled={isPending}` (already implemented) — preserve.
- Locale switch mid-session: the dialog text re-renders correctly (no hardcoded strings); reply
  history preserved.

Scope:
1. Diagnose. Open /admin/inquiries with an inquiry that has ≥ 1 reply in the DB. Confirm which
   of (a)/(b)/(c) is the cause. Paste evidence (page query, replies count from the SSR fetch,
   RLS policy text) into the session log.
2. Fix (a) if the page loads only the inquiries: extend `src/app/admin/inquiries/page.tsx` to
   also SELECT contact_inquiry_replies joined by inquiry_id (admin-scope, no RLS surprise) and
   pass them as the `replies` prop.
3. Fix (b) if local state diverges: make `sendInquiryReply` return the newly inserted reply
   row shape — `{ reply: { id, inquiry_id, body, created_at, replied_by, replier: { name } } }` —
   and have AdminInquiriesManager append it to a local `allReplies` state seeded from the prop.
4. Fix (c) if RLS blocks: update the RLS policy on contact_inquiry_replies to allow SELECT for
   admin + moderator roles. Emit the idempotent SQL into the session log; owner runs it.
5. Add an empty-vs-error distinction: if SSR loads 0 replies AND `reply_count > 0`, render the
   `t('reply_history_load_failed')` banner instead of silently hiding the history block.
6. Locale parity for any new key (×4: sq, en, uk, it).

Acceptance criteria:
- Positive flow step 3 (sendInquiryReply returns the new reply row) verifiable in the diff at
  src/modules/contacts/actions/index.ts:<line>.
- Positive flow step 4 (client appends without refetch) verifiable in the diff at
  src/components/admin/AdminInquiriesManager.tsx:<line>.
- Negative flow → RLS / SSR load failure (load_failed banner) verifiable in the diff at
  AdminInquiriesManager:<line> + 4 locale files at the new key path.
- Negative flow → cancel/Esc/backdrop preserved (no diff regression on existing behavior).
- Negative flow → Send disabled on body < 5 chars + on isPending — preserved in diff.
- §17 UI pre-flight output in the session log.
- Self-validation block per Note 18.
- 0 new lint/typecheck errors; `npm run build` passes; 4 locales; 7 breakpoints.
- docs/backlog.md updated; session log: docs/sessions/2026-05-27-task-255-v4-admin-reply-history.md.

Out of scope: redesigning the dialog layout; threading multiple replies into a conversation
view; the topic-translation bug (Task 257); the sales-mailbox delivery issue (Task 256).
```

---

## Task 256 — V.5 — `sales@lero.al` delivery investigation + sender verification (Bug 2)

```
Hard contract: see top.

BUG (owner 2026-05-27): no email is being delivered to sales@lero.al. The contact form (Task 222)
routes topics {sales, partnership, press} to the sales mailbox; admin email replies (Task 223)
also may use sales@lero.al as the From depending on inquiry.target_mailbox. The pending action
items table in docs/backlog.md already flags "Resend sender verification: support@lero.al,
sales@lero.al" — Bug 2 is the production symptom of that unfinished verification.

Pre-read (in addition to the Sprint-wide always-required header):
- `docs/rule-index.md` → "Email / auth lifecycle task" bundle:
  - docs/env.md
  - docs/domain-rules.md
  - docs/qa-rules.md
  - docs/integrations.md
- docs/ai-behavior.md → No Fake Fixes Policy + Note 14 (Global Change Verification) + Note 18 (self-validation)
- Task 222 session log (V.1 — contact_inquiries + ContactForm + staff email notification)
- Task 223 session log (V.2 — admin replies via sendInquiryReply, contactInquiry email helpers)
- Task 251 plan (Epic GG — Albanian-only outbound email) — preserve that policy.
- src/modules/contacts/actions/index.ts (`resolveMailbox`, `submitContactInquiry`,
  `sendInquiryReply`)
- src/modules/notifications/lib/emails/contactInquiry.ts (the send helper — both notification
  and reply paths)
- src/lib/email (or wherever Resend client is initialized — find by grep on `resend.emails.send`)

Current behavior to preserve:
- Affected surfaces: public ContactForm submit, admin inquiry reply.
- Existing controls: ContactForm (topic Combobox, name, email, custom_subject when other,
  message), submit button, admin reply Textarea + Send button — all preserved.
- Existing server logic: TOPIC_MAILBOX routing (general/support/other → support; sales/
  partnership/press → sales); resolveMailbox returns env-var or null; sendContactInquiryNotification
  fire-and-forget; sendContactInquiryReply fire-and-forget.
- Existing read-only labels: contact page copy, email subject lines.

Required after behavior:
As any user submitting a contact form with topic = sales / partnership / press, OR as an admin
replying from an inquiry whose target_mailbox = sales@lero.al:
1. The corresponding email is delivered to sales@lero.al (visible in the inbox or in the Resend
   dashboard delivery log).
2. The send helper returns a structured `{ ok: true, id }` OR `{ ok: false, reason }` — not
   fire-and-forget — so the action can surface failures.
3. When the From / domain is NOT verified in Resend (sales@lero.al missing verification), the
   server action returns `{ error: 'mailbox_unverified' }` (new typed error), logs the cause,
   and surfaces a clear admin-visible warning instead of swallowing the failure.

Positive flow (happy path):
- Actor (A): public visitor submitting ContactForm with topic = sales / partnership / press.
  Actor (B): admin replying from /admin/inquiries to an inquiry whose target_mailbox =
  sales@lero.al.
- Preconditions: env CONTACT_SALES_EMAIL = sales@lero.al; Resend sender + domain verified.
- Steps (A):
  1. User fills the form → submit → submitContactInquiry validates → inserts row →
     resolveMailbox('sales') returns 'sales@lero.al' → sendContactInquiryNotification fires
     with `to = sales@lero.al`, `replyTo = <user email>`.
  2. Resend accepts; email lands in sales@lero.al inbox.
  3. User sees the success toast (existing).
- Steps (B):
  1. Admin opens inquiry → types reply → Send → sendInquiryReply asserts admin → inserts reply
     row → calls sendContactInquiryReply with `fromMailbox = inquiry.target_mailbox` (=
     sales@lero.al) → Resend accepts; email lands in the requester's inbox AND a copy/CC may
     reach sales@lero.al if Task 256 adds a BCC for archiving (decide with orchestrator before
     adding — STOP & ask).
- Post-conditions:
  - DB: contact_inquiries row inserted (A) or contact_inquiry_replies row inserted (B).
  - Email: delivered with verified From / signed domain (SPF + DKIM pass).
  - Logging: Resend message id stored in the row's `provider_message_id` column (new — see Scope
    item 4) OR at minimum logged with the inquiry id for auditability.

Negative flow (every off-happy-path branch):
- Validation fail (already covered): return `{ error: 'validation' }`; no DB insert; no email.
- Rate limited: `{ error: 'rate_limited' }`; no DB insert; no email.
- `resolveMailbox('sales')` returns null (env var missing): currently returns
  `{ error: 'no_mailbox' }` AND the row is NOT inserted (because the early return). PRESERVE
  this; add an explicit log line naming `CONTACT_SALES_EMAIL` so ops can diagnose. The contact
  form already shows an error toast — preserve.
- Sender not verified in Resend (typical Bug 2 cause): Resend returns 403 / "from not verified"
  → wrap `resend.emails.send` to surface `{ ok: false, reason: 'unverified_sender' }`. Action
  layer maps it to `{ error: 'mailbox_unverified' }`. UI shows toast
  `t('contact.errors.mailbox_unverified')` (new key ×4) — does NOT show generic success.
- Domain not verified (DKIM/SPF fail): same as unverified sender path; differentiate via the
  reason field if Resend distinguishes; log accordingly.
- Resend network timeout / 5xx: `{ ok: false, reason: 'transient' }` → action returns
  `{ error: 'email_transient' }`; the DB row IS inserted (so the inquiry is not lost); UI shows
  `t('contact.errors.email_transient')` toast; ops can manually re-send via admin later. Add a
  follow-up task for an auto-retry queue (out of scope here).
- Reply email path: same negative branches as above, surfaced via the existing
  `t('reply_error')` toast OR a new `t('admin.inquiries.reply_email_failed')` toast (×4) so the
  admin knows the DB write succeeded but the email did NOT (so the admin can copy the body and
  send manually).
- Admin role revoked mid-session: `assertAdminOrModerator` returns null → `{ error: 'forbidden' }`
  → toast `t('reply_error')`.
- Wrong / typo'd env value (e.g. `CONTACT_SALES_EMAIL = "sales@lero.l"`): Resend will reject
  the recipient; surface as `unverified_sender` OR validate the value at server startup (cheap
  format check) and log a startup warning.
- Mailbox set but inbound MX not configured (i.e. the address can SEND but cannot RECEIVE):
  out of scope of the server action — owner must verify the inbox is provisioned and the MX
  records resolve. Document this in the session log as an owner action.

Scope:
1. Audit. From the session log, list:
   - the current value of `CONTACT_SALES_EMAIL` (do NOT paste it — say "set" / "unset"),
   - the current Resend sender + domain verification status (owner-confirmed by reading the
     Resend dashboard — Sonnet cannot check this; ask the orchestrator if unclear, then STOP
     and ask the owner).
2. Wrap Resend send calls. In src/modules/notifications/lib/emails/contactInquiry.ts (and any
   sibling email helpers used by Tasks 222/223), return `{ ok: true, id }` or
   `{ ok: false, reason }` instead of fire-and-forget. Do NOT change the calling order of DB
   insert vs email — DB first; email second. The action MUST log AND return a typed error so the
   UI can show a meaningful toast.
3. Surface the error in submitContactInquiry + sendInquiryReply:
   - submitContactInquiry: extend the return union with `'mailbox_unverified' | 'email_transient'`
     and wire ContactForm to show the matching toast (new locale keys ×4).
   - sendInquiryReply: extend with `'reply_email_failed'` (DB write succeeded, email failed) so
     the admin sees a distinct toast.
4. (Optional, STOP & ask) Persist Resend `id` to a new `provider_message_id` column on
   contact_inquiries / contact_inquiry_replies for audit. If approved, emit the idempotent
   ALTER TABLE SQL into the session log.
5. Owner action items (paste into the session log, NOT into code):
   - Verify sales@lero.al as a Resend sender (dashboard step).
   - Verify the lero.al domain SPF + DKIM in Resend (dashboard + DNS step).
   - Confirm that sales@lero.al inbox actually exists and MX records resolve to a mailbox the
     owner can read.

Acceptance criteria:
- Positive flow step 2 (Resend send returns structured ok/reason) verifiable in the diff in
  src/modules/notifications/lib/emails/contactInquiry.ts:<line>.
- Negative flow → mailbox_unverified path verifiable in submitContactInquiry + ContactForm +
  4 locale files.
- Negative flow → email_transient path verifiable; DB row IS inserted; UI toast shown.
- Negative flow → reply_email_failed verifiable in sendInquiryReply + AdminInquiriesManager + 4
  locale files.
- Owner action list (Resend sender + DKIM/SPF + MX) explicit in the session log AND added to
  docs/backlog.md "Pending Action Items".
- Self-validation block per Note 18.
- 0 new lint/typecheck errors; `npm run build` passes; 4 locales; 7 breakpoints (for the new toasts).
- docs/backlog.md updated; session log: docs/sessions/2026-05-27-task-256-v5-sales-mailbox.md.

Out of scope: changing TOPIC_MAILBOX routing (Task 252 covers further inbox-splits); designing
an auto-retry queue (separate follow-up); changing email template content (Epic GG / Task 251).
```

---

## Task 257 — V.6 — Admin inquiry topic translated in detail + list (Bug 3)

```
Hard contract: see top.

BUG (owner 2026-05-27): in /admin/inquiries, the topic displays as the raw enum value — e.g.
"Тема general" in `uk` — instead of the localized topic label. Cause is exact and reproducible:
- src/components/admin/AdminInquiriesManager.tsx lines 108-110 — `displaySubject` returns
  `inq.topic` raw when topic !== 'other'.
- Translations DO already exist under namespace `contact.topics.{general|sales|support|
  partnership|press|other}` in all four locales (verified: messages/{sq,en,uk,it}.json line 1313
  area). The admin viewer just isn't using them.

Pre-read (in addition to the Sprint-wide always-required header):
- `docs/rule-index.md` → "Admin table / admin control task" bundle (minus the migration files
  since this is locale-only):
  - docs/ui-rules.md
  - docs/component-rules.md
  - docs/component-governance.md §11
  - docs/qa-rules.md
- docs/ai-behavior.md → Localization (i18n) Rules + Note 14 (Global Change Verification) + Note 18 (self-validation)
- src/components/admin/AdminInquiriesManager.tsx (the `displaySubject` helper + the two render
  sites: list row line 208 + detail header line 244)
- messages/{sq,en,uk,it}.json — confirm `contact.topics.*` is the canonical key path AND check
  whether `admin.inquiries` has any topic-related keys that should be added instead (decide
  with orchestrator — STOP & ask if unclear).

Current behavior to preserve:
- Affected surface: /admin/inquiries list rows + detail dialog.
- Existing controls: status filter, mailbox filter, the inquiry list, detail Dialog (status
  Combobox, reply Textarea, Send).
- Existing read-only labels: From, Topic label, Received label.
- Existing logic: `topic === 'other'` → render `inq.custom_subject` (user-typed free text).
  This must remain — DO NOT try to translate `custom_subject`; it's user input.

Required after behavior:
As an admin/moderator on /admin/inquiries in any of the four locales:
1. Each list row's topic line shows the LOCALIZED topic label (e.g. uk: "Загальне запитання"
   instead of "general"; en: "General question"; it: "Domanda generale"; sq: "Pyetje e
   përgjithshme").
2. The detail dialog's `topic_label` field shows the same localized label.
3. When `topic === 'other'`, BOTH surfaces show `custom_subject` verbatim (user-typed text —
   not translated).
4. Unknown / future topic values render a defensive fallback — see Negative flow.

Positive flow (happy path):
- Actor: admin/moderator viewing /admin/inquiries.
- Preconditions: inquiry rows exist; `topic` is one of the canonical enum values
  (general / sales / support / partnership / press / other).
- Steps:
  1. Page SSR loads inquiries (unchanged).
  2. AdminInquiriesManager renders the list — for each row, `displaySubject(inq)` calls
     `t('topics.<inq.topic>')` from the `contact` namespace (or the agreed canonical
     namespace — confirm with orchestrator if you propose moving the keys under
     `admin.inquiries.topics.*` instead).
  3. Admin opens the detail dialog → the same `displaySubject` returns the localized label.
- Post-conditions:
  - DB: unchanged (topic enum stays as the canonical machine value).
  - UI: localized topic label visible in all four locales at all seven breakpoints.

Negative flow (every off-happy-path branch):
- `topic === 'other'`: PRESERVE the existing behavior — render `inq.custom_subject` (user-typed
  text) verbatim, with no translation lookup. (Already correct in the current code; ensure the
  fix does NOT regress this branch.)
- `inq.custom_subject` is null when `topic === 'other'` (data bug, should not happen because
  the server validates it): defensive fallback — render `t('topics.other')` so the admin still
  sees *something* sensible instead of an empty label.
- Unknown `topic` value (e.g. a new enum value added to the DB before the locale keys ship):
  defensive fallback — render the raw `inq.topic` value but log a `console.warn` for ops;
  optionally surface a `Badge variant="warning"` so the admin notices. STOP & ask the
  orchestrator before adding a warning Badge — that's the "no invented architecture" rule.
- Missing locale key (developer error during migration): next-intl will throw or fall back per
  the project config. Verify behavior matches what the rest of the admin uses; do NOT silence
  with a `try/catch` (that's a Fake Fix).
- Locale switch mid-session: the labels re-render correctly without manual reload (next-intl
  handles this; verify in the runtime check at `uk` 320px → switch to `sq` → switch back).
- Empty list: existing `t('no_inquiries')` empty state preserved.

Scope:
1. Decide the key namespace WITH the orchestrator before writing code. Options:
   - (A) Reuse the existing `contact.topics.{general|sales|support|partnership|press|other}`
     keys — zero locale churn, but cross-namespace import in an admin component.
   - (B) Add a new `admin.inquiries.topics.{...}` key set (×4 locales) — locale parity
     audit-friendly, but duplicates strings.
   The orchestrator's recommendation: (A) — it avoids duplicated strings and the contact
   topics are the single source of truth. Sonnet MUST STOP & confirm if it disagrees.
2. Update `displaySubject` (AdminInquiriesManager.tsx ~ line 108) to:
   - If topic === 'other': render `inq.custom_subject ?? t('topics.other')`.
   - Else: render the localized label via the decision in (1).
3. Locale parity ×4: verify the chosen keys exist in all four files with sensible translations
   (already true for `contact.topics.*` — verified in audit).
4. Walk the runtime end-to-end in each of the four locales: each row + each detail dialog →
   the topic label is localized; `other` shows custom_subject.

Acceptance criteria:
- Positive flow step 2 (displaySubject uses t(...)) verifiable in the diff at
  AdminInquiriesManager.tsx:~108.
- Negative flow → `topic === 'other'` with non-null custom_subject still renders
  custom_subject verbatim (preserved branch).
- Negative flow → `topic === 'other'` with null custom_subject renders the localized fallback.
- Negative flow → unknown topic renders defensively without crashing (test by inserting a fake
  enum value via a unit test or in-app stub).
- Locale parity ×4 confirmed (key-count delta in session log = 0 if reusing existing keys; else
  +6 keys ×4).
- §17 UI pre-flight output in the session log.
- Self-validation block per Note 18.
- 0 new lint/typecheck errors; `npm run build` passes; 4 locales; 7 breakpoints.
- docs/backlog.md updated; session log: docs/sessions/2026-05-27-task-257-v6-admin-topic-translation.md.

Out of scope: redesigning the dialog (Task 255 / 261); changing the topic enum on the DB or
in the contact form Combobox; adding new topic values.
```

---

## Task 258 — T.5 — Listing detail contact card: real owner name + user_type for authed viewers (Bug 4)

```
Hard contract: see top.

BUG (owner 2026-05-27): an authenticated user opens a listing detail page and the contact card
shows "N/A · Приватна особа" instead of the actual owner's name and the correct user_type
("agent" → agency name, "private" → "Private person"). The expected behavior is: when the
viewer is authenticated, the owner row IS reachable via the FK join (RLS allows
authenticated-read of the listing owner's profile fields needed by the contact card).

Two failure modes are possible:
(a) RLS on `users` blocks the embed join from the listing query — so `listing.owner` is null
    for authenticated viewers too. Verify in the running app + the RLS audit.
(b) The owner profile has `name = null` (user registered with phone-only or never completed
    profile). In that case the fix is NOT to invent a fake name but to render a sensible
    fallback (e.g. masked phone, "Owner" with the agency name, or the company_name if
    user_type === 'agent') — and also to surface a profile-completion prompt for owners with
    null name (out of scope for this task; file a follow-up).

Pre-read (in addition to the Sprint-wide always-required header):
- `docs/rule-index.md` → "DB / server action / RLS task" bundle:
  - docs/data-access-rules.md
  - docs/domain-rules.md
  - docs/rls-rules.md
  - docs/qa-rules.md
- Also "UI / layout / component task" bundle (since the rendering rule changes):
  - docs/ui-rules.md
  - docs/component-rules.md
- docs/ai-behavior.md → Note 14 (Global Change Verification) + Note 18 (self-validation) + No Fake Fixes Policy
- Task 84 session log (the original contact card guest/owner status work) — preserve its rules.
- Task 211 session log (T.4 contact card action row + FavoriteButton shape prop)
- Task 213 session log (T.4 PriceBlock unification)
- src/app/[locale]/listings/[slug]/page.tsx (lines 196-243 — the listing query + ownerRaw
  fallback object)
- src/modules/listings/components/ListingContact.tsx (line 92 — `owner.name ?? 'N/A'`;
  lines 98-104 — user_type/company_name/agent_label/private_person)
- Supabase RLS policies on `users` (the orchestrator did not paste them; Sonnet must read them
  via the Supabase dashboard OR a `select * from pg_policies where tablename = 'users';` SQL
  emitted into the session log for the owner to confirm).

Current behavior to preserve:
- Affected surfaces: public listing detail page (`/[locale]/listings/[slug]`) contact card
  (desktop sticky sidebar + mobile fixed bottom bar).
- Existing controls: WhatsApp, Call, Send message buttons (all conditional on data presence);
  FavoriteButton; SaveToCollectionButton; Share; ListingReportDialog (canReport-gated).
- Existing read-only labels: owner name, owner type sub-label, price block.
- Existing branches: guest-CTA (showGuestCTA), owner-deleted (ownerDeleted), normal authed
  viewer — all must continue to render correctly.
- Tests/fixtures: src/stories/fixtures/listing.fixture.ts + ListingGrid stories — verify the
  fixture covers the "authed viewer, normal owner with name + agent type" path.

Required after behavior:
As an authenticated user opening any listing detail page, in any of the four locales:
1. The contact card shows the owner's real `name` (when present in the DB row) — never literal
   "N/A".
2. The owner sub-label shows:
   - "Agent" / agency name → when `user_type === 'agent'` AND `company_name` is set → use
     `company_name`.
   - `t('agent_label')` → when `user_type === 'agent'` AND `company_name` is null.
   - `t('private_person')` → when `user_type === 'private'`.
   - A defensive fallback (see Negative flow) when `user_type` is null/unknown.
3. The mobile bottom bar shows the same `name` (line 249 — also currently
   `owner.name` directly, but only renders when `ownerDeleted` is false; verify the same fix
   applies).
4. The guest CTA branch (`showGuestCTA`) and the owner-deleted branch (`ownerDeleted`) keep
   working exactly as before — this fix is for the third branch (normal authed viewer with
   a real owner).

Positive flow (happy path):
- Actor: authenticated user (`authUser` truthy, `hasValidProfile` true) opens a listing whose
  owner exists and has `name` set, `user_type` set (private or agent), and (if agent)
  `company_name` set.
- Preconditions: RLS on `users` allows authenticated reads of the columns the listing query
  embeds: `id, name, phone, whatsapp, avatar_url, user_type, is_verified, company_name,
  deleted_at`.
- Steps:
  1. SSR loads listing + owner via the embed JOIN; `ownerRaw` is the actual owner row.
  2. `owner = ownerRaw` (no fallback to the empty placeholder).
  3. ListingContact renders the owner block:
     - Avatar: `AvatarImage src={owner.avatar_url ?? undefined}`, fallback initials from
       `owner.name`.
     - Name: `owner.name` (no `?? 'N/A'`).
     - Sub-label: per the decision tree in Required after behavior step 2.
  4. Action buttons render based on presence of `whatsapp` / `phone`.
- Post-conditions: contact card displays the real owner identity in all four locales at all
  seven breakpoints.

Negative flow (every off-happy-path branch):
- Guest viewer (`isGuest === true`): existing `showGuestCTA` branch wins — render the
  sign-in card. PRESERVE.
- Owner deleted (`owner.deleted_at != null`): existing `ownerDeleted` branch wins — render the
  "Account deleted" card. PRESERVE.
- Zombie session (authUser truthy, hasValidProfile false): treated as guest per the existing
  comment at page.tsx:225. PRESERVE.
- `ownerRaw` is null AND viewer is authenticated AND viewer is NOT a guest: this is the
  failure mode Bug 4 surfaces. Audit RLS:
  - If RLS denies the embed join, update the policy to allow `SELECT` on the public-display
    columns of `users` (id, name, avatar_url, user_type, is_verified, company_name,
    deleted_at, phone, whatsapp — confirm with orchestrator before adding phone/whatsapp to
    the public-readable set; STOP & ask) when the requesting auth.uid IS a non-banned
    authenticated user.
  - Emit the idempotent SQL into the session log for the owner to run.
  - In the page, do NOT render the empty placeholder; render a clear "Owner data unavailable"
    state with a `Badge variant="warning"` so the bug doesn't silently regress next time.
- `owner.name === null` but row IS present: render the fallback:
  - If `user_type === 'agent'` and `company_name`: name line shows `company_name` (the agent
    is operating under the agency identity).
  - Else: name line shows `t('owner_name_unavailable')` (new key ×4) — NOT literal "N/A".
  - Also: file a follow-up task to nudge the owner to complete their profile (Out of scope here).
- `owner.user_type` null/unknown: sub-label falls back to `t('private_person')` (the most
  conservative default — never claims to be an agent). Log a `console.warn` once for ops.
- `owner.company_name` empty string vs null: treat empty string as null for the decision
  branch (defensive — current code already uses `||` which handles this; verify).
- Mobile bottom bar (line 248-250): same `owner.name` fix applies. Apply the same fallback.
- Locale switch mid-session: re-render correctly without manual reload.

Scope:
1. Reproduce. Sign in as a user; open a listing whose owner has name + user_type + company_name
   set. Confirm Bug 4 reproduces. Capture the SSR response shape (is `listing.owner` null or
   present?) in the session log. Then sign in as a second user and open one of their own
   listings — confirm whether self-view also fails.
2. Diagnose. Run the pg_policies SQL listed in Pre-read; paste the relevant policy text. If RLS
   is the cause, emit the idempotent update SQL into the session log for the owner.
3. Fix the rendering. In ListingContact.tsx:92 + line 249, replace `owner.name ?? 'N/A'` with
   the fallback tree from Negative flow. Decide the agent/private branch per Required after
   behavior step 2.
4. Add the new locale key `owner_name_unavailable` to `listing` namespace ×4 (sq/en/uk/it).
5. Add the defensive "Owner data unavailable" state for the post-RLS-fix case where ownerRaw is
   STILL null for an authenticated viewer (so the next regression is loud, not silent).
6. Verify cross-flow: guest CTA + owner-deleted + zombie session all still render correctly.

Acceptance criteria:
- Positive flow step 3 (real `owner.name` rendered) verifiable in ListingContact.tsx:<line>;
  the literal `'N/A'` string is gone from the file (grep proof).
- Negative flow → guest CTA branch preserved (no diff regression on showGuestCTA).
- Negative flow → owner-deleted branch preserved.
- Negative flow → ownerRaw null + authed viewer renders the "Owner data unavailable" warning
  state (not silently shows guest CTA or N/A).
- Negative flow → owner.name null + user_type agent + company_name renders the agency name.
- Negative flow → owner.name null + user_type private renders `t('owner_name_unavailable')`.
- RLS audit + (if needed) idempotent ALTER POLICY SQL in the session log.
- Locale parity ×4 for new `owner_name_unavailable` key.
- §17 UI pre-flight output.
- Self-validation block per Note 18.
- 0 new lint/typecheck errors; `npm run build` passes; 4 locales; 7 breakpoints.
- docs/backlog.md updated; session log: docs/sessions/2026-05-27-task-258-t5-contact-card-owner-identity.md.

Out of scope: redesigning the contact card layout; profile-completion nudge for owners with
null name (file as follow-up under Epic T); phone/whatsapp privacy redesign (separate audit).
```

---

## Task 259 — F.5 — Save-to-Collection visibility in Favorites → Collections (Bug 5)

```
Hard contract: see top.

BUG (owner 2026-05-27): on the listing detail page, the contact card has the "Save to
collection" button (`SaveToCollectionButton`). The user creates a new collection from the
dialog; a success toast appears (`t('created')`); the listing is added to the collection (via
`createCollection` + `addToCollection`); BUT the user can't find the new collection in the
Favorites tab → Collections section. Expected: the new collection appears under "Favorites →
Collections" immediately (and certainly after `router.refresh()` / page reload).

Possible causes (verify before fixing):
(a) The Favorites page's SSR query for collections excludes collections created on the listing
    detail page (e.g. RLS, query filter, or missing `revalidatePath('/[locale]/favorites')` in
    `createCollection`).
(b) CollectionsSection only renders `initialCollections` from SSR and does not re-fetch on
    realtime / focus / nav.
(c) The createCollection action succeeds but is wired to a different user_id (auth context
    mismatch — unlikely if Task 212 shipped, but verify).

Pre-read (in addition to the Sprint-wide always-required header):
- `docs/rule-index.md` → "Profile / edit-flow task" bundle (Favorites is a logged-in user
  surface; the edit flow here is "save / unsave / collect"):
  - docs/ui-rules.md
  - docs/component-rules.md
  - docs/qa-rules.md
  - docs/state-authority.md
- docs/ai-behavior.md → Note 19 (UX flow preserved — cross-page reactivity) + Note 18 (self-validation) + No Fake Fixes Policy
- Task 136 session log (F.2 Favorites Collections + SaveToCollectionButton + CollectionsSection)
- Task 212 session log (P.5 inline create-collection — the current SaveToCollectionButton flow)
- src/modules/listings/components/SaveToCollectionButton.tsx (the create-and-add inline flow)
- src/modules/listings/components/FavoritesShell.tsx (the Favorites tab shell, line 178
  CollectionsSection)
- src/modules/listings/components/CollectionsSection.tsx (rendering + state)
- src/modules/listings/actions/collectionActions.ts (createCollection, addToCollection,
  removeFromCollection, getCollectionsWithMembership)
- src/app/[locale]/cabinet/page.tsx OR wherever Favorites is rendered (find the route that
  passes `initialCollections` to FavoritesShell)

Current behavior to preserve:
- Affected surfaces: listing detail page (contact card) + Favorites tab (CollectionsSection).
- Existing controls: SaveToCollectionButton (icon/default variant), the inline create-and-add
  Input + Button inside the dialog, the collection-list toggle rows, the dialog
  Esc/backdrop/close.
- Existing data: `collections` table + `collection_items` table (Task 136). Unchanged in shape.
- Existing server actions: createCollection, addToCollection, removeFromCollection,
  getCollectionsWithMembership — preserved.
- Existing UI on Favorites tab: CollectionsSection card, listings grid, type filter,
  pagination, realtime favorites updates (`useFavoritesRealtime`).

Required after behavior:
As an authenticated user, in any of the four locales:
1. On the listing detail page, click "Save to collection" → Create a new collection → success
   toast appears.
2. Navigate to Favorites (Cabinet → Favorites OR via Header link).
3. The Collections section shows the newly created collection AT THE TOP, with item_count
   reflecting the listing just added (= 1 if the new collection was created on the detail
   page; updated incrementally if more listings get added).
4. Clicking the collection navigates to the collection's listing-set view (existing F.2
   behavior — preserve).
5. The same behavior holds after `router.refresh()` AND after a real page reload.

Positive flow (happy path):
- Actor: authenticated user with at least 0 prior collections.
- Preconditions: user on a listing detail page; SaveToCollectionButton mounted (i.e. `user`
  truthy per line 44).
- Steps:
  1. Click the button → `handleOpen()` → `getCollectionsWithMembership(listingId)` → dialog
     opens with the current collection list.
  2. Type a new name → click Create (or press Enter via the existing `onKeyDown`).
  3. `createCollection(trimmed)` succeeds → returns the new collection row.
  4. `addToCollection(result.collection.id, listingId)` runs → membership row inserted.
  5. Local state appends the new collection with `item_count: 1` and adds the id to
     `memberIds`; toast `t('created')`.
  6. User navigates to Favorites (Cabinet → Favorites).
  7. SSR (re-)fetches collections → the new collection appears at the top of
     CollectionsSection because the page revalidates after createCollection.
- Post-conditions:
  - DB: 1 new `collections` row, 1 new `collection_items` row.
  - UI on detail page: dialog state shows the new collection checked.
  - UI on Favorites: CollectionsSection shows the new collection.

Negative flow (every off-happy-path branch):
- Empty name (whitespace only): `handleCreate` early-returns (already guarded — preserve).
- Duplicate name (same user, same name): decision needed — STOP & ask the orchestrator before
  enforcing uniqueness. Current behavior is to allow duplicate names; preserve unless the
  orchestrator approves otherwise.
- createCollection returns `{ error: ... }`: toast `t('error_generic')`; do NOT call
  addToCollection; isCreating reset; input preserved (already implemented — verify in diff).
- addToCollection returns `{ error: ... }` after createCollection succeeded: the collection
  exists but is empty; surface a SECOND toast `t('error_add_after_create')` (new key ×4) so
  the user knows their collection was created but the listing wasn't added; the user can re-try
  by toggling the checkbox.
- Cancel/Esc/backdrop on the dialog: no DB write happens for the in-progress name; existing
  rows already created (because Save runs immediately on toggle) remain. PRESERVE.
- Permission denied (RLS / role) on createCollection: toast `t('error_generic')`; no DB write.
- Network offline: server action rejects; existing transition surfaces the error; toast shown.
- Double-submit: `isCreating` guards the create flow (preserved).
- The Favorites tab does NOT show the new collection after navigation: this IS the bug.
  Fix candidates (verify in audit first):
  - Add `revalidatePath('/[locale]/cabinet', 'page')` (or the precise Favorites route) inside
    `createCollection` AND inside `addToCollection`.
  - Use Supabase Realtime on the `collections` table for the current user (mirror the
    `useFavoritesRealtime` pattern from F.4 / Task 135).
  - Add a focus-driven re-fetch in CollectionsSection (only if Realtime is rejected for
    scope reasons — STOP & ask the orchestrator before adding focus re-fetch).
- Collection has 0 items (empty collection page): preserve the existing empty state — DO NOT
  hide the collection just because it's empty; the user explicitly created it.
- User created the collection in another tab: Realtime (if added) propagates; else router.refresh
  / next nav picks it up.

Scope:
1. Reproduce. Create a fresh collection from the detail page. Verify whether it appears on the
   Favorites tab (a) immediately after nav, (b) after router.refresh(), (c) after a real page
   reload. Paste the matrix into the session log.
2. Diagnose. Confirm whether `createCollection` calls revalidatePath and what path. Confirm
   how FavoritesShell receives `initialCollections` (SSR prop OR client fetch). Decide the
   minimum fix:
   - Preferred: add `revalidatePath` to the relevant route(s) in `createCollection` and
     `addToCollection` so the next navigation to Favorites picks up the fresh list.
   - Defer Realtime to a separate task unless the owner asks for it now (out of scope; file as
     follow-up if helpful).
3. Implement. Update `createCollection` + `addToCollection` to revalidate the Favorites route.
   If FavoritesShell needs a tweak to pass through the realtime path, do it minimally; do NOT
   refactor.
4. Add the `error_add_after_create` toast key ×4 and wire it in SaveToCollectionButton.
5. Walk the runtime end-to-end: create on detail page → navigate to Favorites → collection
   visible. Repeat in `uk` 320px.

Acceptance criteria:
- Positive flow step 7 (Favorites shows the new collection after nav) verifiable end-to-end in
  the runtime check at `uk` 320px; the diff includes the `revalidatePath` call(s) at
  collectionActions.ts:<line>.
- Negative flow → addToCollection fails after createCollection succeeded: new toast wired +
  ×4 locale keys present.
- Negative flow → cancel/Esc preserved (no diff regression).
- Negative flow → empty collection still listed (preserve empty state).
- §17 UI pre-flight output.
- Self-validation block per Note 18.
- 0 new lint/typecheck errors; `npm run build` passes; 4 locales; 7 breakpoints.
- docs/backlog.md updated; session log: docs/sessions/2026-05-27-task-259-f5-save-collection-visibility.md.

Out of scope: redesigning the SaveToCollectionButton dialog; Realtime sync for collections (file
as follow-up if not approved by orchestrator in scope item 2); duplicate-name enforcement
(STOP & ask before changing).
```

---

## Task 260 — R.9 / X.3 — Admin Premium activation/deactivation: error-returning action + DB column (Bug 6)

```
Hard contract: see top.

BUG (owner 2026-05-27): activating Premium for a listing in /admin/listings does not work.

Root-cause hypothesis (verify before fixing): the `setListingPremium` action at
src/modules/admin/actions/index.ts:55-87 has TWO independent failure modes:
(1) It UPDATEs `{ is_premium, premium_until }` on `listings`. The TODO comment on line 71
    explicitly says "premium_until column requires DB migration: ALTER TABLE listings ADD COLUMN
    premium_until timestamptz;". Grep proves `premium_until` appears ONLY in this one file —
    no migration, no row in `src/types/database.ts`. If the column doesn't exist, the UPDATE
    fails with a column-not-found error (PostgreSQL 42703) but the action discards the error
    after a `console.error` and returns void.
(2) The action returns `void` — `setListingPremium` has NO return type indicating success or
    failure. The PremiumDialog at `AdminListingsTable.tsx:79` awaits it and then shows
    `toast.success(t('premium_success'))` unconditionally. This is the "fake success" pattern
    Note 18 + No Fake Fixes Policy explicitly forbid.

Pre-read (in addition to the Sprint-wide always-required header):
- `docs/rule-index.md` → "Admin table / admin control task" bundle:
  - docs/ui-rules.md
  - docs/component-rules.md
  - docs/component-governance.md §11
  - docs/domain-rules.md
  - docs/rls-rules.md
  - docs/qa-rules.md
- Also "Schema / migration task" bundle (because premium_until needs an idempotent migration):
  - docs/data-access-rules.md
  - docs/architecture.md
- docs/ai-behavior.md → No Fake Fixes Policy + Note 14 (Global Change Verification) +
  Note 18 (self-validation) + Note 22 (Admin Table Preservation Rule)
- Task 234 session log (X.1 enum drift) and Task 172 (schema-drift guard) — extend the guard
  to catch this class of bug going forward.
- src/modules/admin/actions/index.ts (lines 55-91 — setListingPremium, toggleListingPremium)
- src/components/admin/AdminListingsTable.tsx (lines 60-160 — PremiumDialog; line 79 + 87
  toast pattern; line 145 `listing.is_premium` conditional)
- src/types/database.ts (Listing type — confirm whether `is_premium` and `premium_until` are
  declared)

Current behavior to preserve:
- Affected surface: /admin/listings + the PremiumDialog (preview dialog "Premium" button → opens
  PremiumDialog).
- Existing controls: tabs (all / premium), filter row, listing rows, listing preview dialog with
  View, Edit, Premium, Delete buttons, the PremiumDialog itself (4 preset buttons +
  custom-date input + OK + "Remove premium" ghost button + Close via X/Esc/backdrop).
- Existing data: `listings.is_premium` boolean (confirmed exists); `listings.premium_until`
  timestamptz (CONFIRM presence in the audit — likely missing).
- Existing logic: assertPermission('listings.set_premium') gates the action. PRESERVE.
- Existing read-only labels: premium badge (Star icon) on the row + preview dialog header.

**Admin Table Preservation Rule (Note 22):** Before changing the table or the dialog, paste the
control inventory into the session log. After the change, every existing control still works
and Premium activation produces a verifiable DB state change.

Required after behavior:
As an admin/moderator (with `listings.set_premium` permission), on /admin/listings, in any of
the four locales:
1. Open a listing's preview dialog → click "Premium set" (or "Premium change" if already
   premium) → PremiumDialog opens.
2. Click a preset (1m / 3m / 6m / 1y) OR pick a custom date → click OK.
3. The server action runs, the DB row is updated (`is_premium = true`, `premium_until = <ts>`),
   the action returns success → success toast appears → dialog closes → page refreshes → the
   row shows the Star badge.
4. Open the same listing again → the dialog shows "Premium change"; clicking the ghost "Remove
   premium" button DEACTIVATES premium → DB row `is_premium = false`, `premium_until = null` →
   success toast → dialog closes → Star badge gone.
5. Premium expiry (`premium_until` past): a follow-up task should auto-revoke (out of scope
   here; file as follow-up under Epic R). At minimum, the admin can see `premium_until` in the
   preview dialog (decide with orchestrator — STOP & ask before adding it as a new label).

Positive flow (happy path):
- Actor: admin/moderator with `listings.set_premium` permission.
- Preconditions: listing exists; `listings.is_premium` and `listings.premium_until` columns
  both present on the DB.
- Steps (activation):
  1. PremiumDialog opens with `listing.is_premium = false`.
  2. Admin clicks "3m" → `apply(90)` computes `until = new Date(Date.now() + 90d).toISOString()`.
  3. `setListingPremium(listing.id, true, until)` → server action gates on permission →
     UPDATE `listings SET is_premium = true, premium_until = '<ts>' WHERE id = ...` → returns
     `{ ok: true }`.
  4. UI awaits the result → toast `t('premium_success')` → setSaving(false) → onDone() →
     dialog closes → router.refresh() → row shows the Star badge.
- Steps (deactivation):
  1. PremiumDialog opens with `listing.is_premium = true`.
  2. Admin clicks "Premium remove" ghost button → `remove()` → `setListingPremium(listing.id,
     false, null)` → UPDATE `listings SET is_premium = false, premium_until = null WHERE id = ...`
     → returns `{ ok: true }`.
  3. toast `t('premium_removed_success')` → dialog closes → router.refresh() → Star badge gone.
- Post-conditions:
  - DB: row updated (verified by re-querying); `premium_until` is a valid timestamptz OR null.
  - UI: badge visible/hidden matches the DB state; row reflects the change without manual
    reload.

Negative flow (every off-happy-path branch):
- Missing permission (assertPermission throws): action throws — wrap in the caller, surface
  toast `t('premium_error_forbidden')` (new key ×4); dialog stays open so the admin sees the
  error.
- DB column `premium_until` missing (the bug we expect to be the actual cause): the UPDATE
  errors with code 42703 → the action MUST return `{ error: 'db_missing_column' }` AND log it →
  UI MUST show toast `t('premium_error_db_schema')` (new key ×4) — NOT show success. The
  session log MUST include the idempotent migration SQL for the owner to run:
  ```sql
  ALTER TABLE listings
    ADD COLUMN IF NOT EXISTS premium_until timestamptz;
  CREATE INDEX IF NOT EXISTS listings_premium_until_idx
    ON listings (premium_until);
  ```
  (Confirm with the orchestrator if the index name is correct or if the orchestrator has a
  naming convention — STOP & ask.)
- Custom date in the past (admin types yesterday): client-side validation already enforces
  `min={today}`; ADD a server-side guard that rejects past dates with
  `{ error: 'premium_date_in_past' }` → toast `t('premium_error_date_past')` (new key ×4).
- Custom date malformed: `new Date(customDate).toISOString()` throws → catch on the client and
  show toast `t('premium_error_date_invalid')` (new key ×4).
- Listing deleted concurrently: UPDATE matches 0 rows → action returns `{ error: 'not_found' }`
  → toast `t('premium_error_not_found')` (new key ×4); dialog closes via onDone() so the user
  isn't stuck.
- Network / Supabase 5xx: action returns `{ error: 'transient' }` → toast
  `t('premium_error_transient')` (new key ×4); dialog stays open so admin can retry.
- Cancel/Esc/backdrop: no DB write; no toast; dialog state cleared.
- Double-click on a preset: `disabled={saving}` already guards (preserve in diff).
- Activate succeeds but revalidatePath fails (very rare): the DB write IS persisted; the UI
  still calls onDone()/router.refresh(); next nav reflects truth.
- Schema-drift guard (Task 172): extend the guard so a future column reference in a server
  action without a matching DB column fails CI. Out of scope to fully reshape the guard, but
  add a one-line addition for `premium_until` at minimum AND file a follow-up to generalise.

Scope:
1. Audit. Confirm whether `premium_until` exists on the `listings` table. Run (or have the
   owner run) `\d listings` OR
   `SELECT column_name FROM information_schema.columns WHERE table_name = 'listings'`. Paste
   the answer in the session log.
2. Migration. If `premium_until` is missing, emit the idempotent ALTER TABLE SQL in the session
   log. DO NOT run it (owner runs SQL). Block AC verification on this column existing.
3. Refactor `setListingPremium` to return a discriminated union:
   `{ ok: true } | { error: 'forbidden' | 'db_missing_column' | 'not_found' | 'transient' | 'date_in_past' }`.
4. Refactor PremiumDialog `apply()` and `remove()` to:
   - check the returned error,
   - show the matching localized toast,
   - NOT auto-close on error (so admin can fix and retry),
   - close + refresh ONLY on `{ ok: true }`.
5. Add the new locale keys ×4 (×6 keys minimum: `premium_error_forbidden`,
   `premium_error_db_schema`, `premium_error_date_past`, `premium_error_date_invalid`,
   `premium_error_not_found`, `premium_error_transient`).
6. Update `toggleListingPremium` to also return the new union (preserve any caller — if no
   other caller exists, document that in the session log).
7. Extend the schema-drift guard (Task 172) with a one-line addition for `premium_until` OR
   file a follow-up if the guard needs more work to detect "column referenced in server
   action but missing in DB".

Acceptance criteria:
- Positive flow step 3 (action returns `{ ok: true }`) verifiable at
  src/modules/admin/actions/index.ts:<line>.
- Positive flow step 4 (UI awaits result, toast on success, dialog close) verifiable in
  AdminListingsTable.tsx:<line>.
- Negative flow → DB column missing returns `{ error: 'db_missing_column' }` + UI toast
  verifiable in diff + 4 locale files.
- Negative flow → custom date in past blocked client-side AND server-side; toast verifiable.
- Negative flow → not_found path verifiable in action; UI toast verifiable.
- Negative flow → forbidden path verifiable (caller wraps the assertPermission throw); UI
  toast verifiable.
- Idempotent ALTER TABLE SQL in the session log + a Pending Action Item row added to
  docs/backlog.md if owner hasn't run it.
- Self-validation block per Note 18.
- 0 new lint/typecheck errors; `npm run build` passes; 4 locales; 7 breakpoints.
- docs/backlog.md updated; session log: docs/sessions/2026-05-27-task-260-r9-x3-premium-activation.md.

Out of scope: auto-expiry cron for premium_until (file as follow-up under Epic R); changing
the preset durations; redesigning the dialog layout; the schema-drift guard refactor (one-line
addition only here).
```

---

## Task 261 — T.6 / CC.3 — `cursor-pointer` on every interactive control (Bug 7)

```
Hard contract: see top.

BUG (owner 2026-05-27): on the site + admin, many `<button>`s, Combobox triggers, and Select
triggers do NOT show `cursor: pointer` on hover. The pointer remains the default arrow, which
makes interactive controls look non-interactive.

Root cause: Tailwind v4 + the `Button as ButtonPrimitive` from `@base-ui/react/button` do NOT
default to `cursor-pointer`. The current canonical `buttonVariants` (src/components/ui/button.tsx)
omits `cursor-pointer` entirely. Combobox.tsx line 234 already includes it for the button-variant
trigger; the input-variant trigger and the Select trigger do NOT.

Pre-read (in addition to the Sprint-wide always-required header):
- `docs/rule-index.md` → "UI / layout / component task" bundle:
  - docs/ui-rules.md (especially §0 Canonical Button + §15 control-height + §17 UI pre-flight)
  - docs/component-rules.md
  - docs/qa-rules.md
- Also "Tailwind / styling governance task" bundle (because this is a tokenized class addition):
  - docs/tailwind-governance.md
  - docs/tailwind-canonical-fragments.md
- docs/ai-behavior.md → Note 14 (Global Change Verification — fix in the canonical primitive,
  not at every call site) + Note 18 (self-validation)
- src/components/ui/button.tsx (the canonical buttonVariants — single source per ui-rules.md §0)
- src/components/shared/Combobox.tsx (line 234 has it for button-variant; check input-variant
  trigger at the surrounding lines)
- src/components/ui/select.tsx (if it exists as a separate primitive)

Current behavior to preserve:
- Affected surface: every `<Button>` and `<a>` styled via `buttonVariants`, every Combobox
  trigger, every Select trigger across the site + admin.
- Existing controls: every interactive control — variants, sizes, disabled state, focus ring,
  active state, hover state — all preserved EXACTLY.
- Existing read-only labels: unchanged.

Required after behavior:
On every interactive control (Button, Combobox trigger, Select trigger, any `buttonVariants`
consumer) in any of the four locales at all seven breakpoints, hovering with a mouse pointer
shows the `cursor: pointer` cursor (`cursor-pointer` Tailwind class). When the control is
`disabled`, the cursor remains the disabled cursor (`cursor: not-allowed` via Tailwind's
`disabled:cursor-not-allowed` OR the existing `disabled:pointer-events-none` already in
`buttonVariants` — pick whichever matches the existing project convention; STOP & ask the
orchestrator if both patterns exist and you're unsure which is canonical).

Positive flow (happy path):
- Actor: any user (guest, authed, admin) on any page that renders interactive controls.
- Preconditions: the user is on a non-touch device (touch devices don't have a hover cursor —
  this rule is desktop-relevant only; mobile is unaffected, but the class is harmless on
  mobile).
- Steps:
  1. The user hovers over a Button → cursor becomes a pointer.
  2. The user hovers over a Combobox trigger (input-variant OR button-variant) → cursor becomes
     a pointer.
  3. The user hovers over a Select trigger → cursor becomes a pointer.
- Post-conditions: every interactive control feels interactive. No regressions to focus,
  active, hover, disabled, or aria-* states.

Negative flow (every off-happy-path branch):
- Disabled control (`disabled` prop or `aria-disabled="true"`): cursor stays as
  `cursor-not-allowed` OR remains default (via `disabled:pointer-events-none` which prevents
  hover events). Verify the existing behavior; preserve it. The fix MUST NOT make a disabled
  control look hoverable.
- `<a>` tags styled with `buttonVariants` (e.g. WhatsApp link, Call link, View / Edit links
  in admin): default anchor cursor IS pointer, but only when `href` is present. Verify all
  call sites use `<Link>` or `<a href=...>` and not a bare `<a>` — if any bare `<a>` exists,
  the `cursor-pointer` class from the variant still wins. PRESERVE.
- Form submission button currently mid-submit (`isPending` / `isSaving`): the visual loading
  state must not regress; cursor MAY still be pointer (harmless) OR may be `cursor-wait` if
  the project convention prefers — STOP & ask if no convention exists. Default: no change to
  the loading-cursor behavior.
- Combobox trigger with `disabled` prop: the `cursor-pointer` must NOT apply; verify the
  Combobox.tsx variant logic correctly omits the class when disabled.
- Tooltip-wrapped triggers: the hover should still register the cursor on the trigger
  element. Verify on a representative Tooltip wrap (e.g. admin row actions).
- Read-only text styled with `cursor-pointer` accidentally (developer error): the audit MUST
  grep for `cursor-pointer` on non-interactive elements and remove false positives — this is
  the negative branch for "do not over-apply the rule".

Scope:
1. Update `buttonVariants` in src/components/ui/button.tsx — add `cursor-pointer` to the base
   class string AND add `disabled:cursor-not-allowed` OR confirm that
   `disabled:pointer-events-none` already prevents the cursor from showing pointer on disabled
   buttons (test in the browser; document the decision in the session log).
2. Update Combobox.tsx — ensure BOTH variants (button + input) carry `cursor-pointer` on their
   trigger when NOT disabled. The current code at line 234 covers button-variant; check the
   input-variant trigger and add if missing.
3. Update Select trigger primitive (src/components/ui/select.tsx if it exists; OR the equivalent
   shadcn/base-ui select wrapper) — add `cursor-pointer` (disabled-aware).
4. Grep for raw `<button>` elements (governance anti-pattern per ui-rules.md §0) that escape
   the canonical primitive — these are pre-existing violations; do NOT fix them in this task,
   but list them in the session log so they can be filed as follow-ups under the existing
   governance debt.
5. Grep for `cursor-pointer` already applied elsewhere in the repo; remove duplicates only
   where the parent primitive now provides it (Note 14 — single source).
6. Audit non-interactive elements that may have been styled with `cursor-pointer` by mistake.
   List any false positives in the session log (do NOT remove them unless they are clearly
   non-interactive — STOP & ask if unsure).
7. Walk the runtime: hover every interactive control on /admin/listings, /admin/inquiries, the
   homepage, the listing detail page, the Favorites tab, and the auth sheet. Confirm pointer
   shows for every non-disabled control. Capture a short list in the session log.

Acceptance criteria:
- Positive flow steps 1-3 verifiable by visual hover check (document with the runtime walk in
  the session log).
- Negative flow → disabled control does NOT show pointer (preserve via
  `disabled:pointer-events-none` OR explicit `disabled:cursor-not-allowed`).
- Negative flow → no false positives applied to non-interactive elements.
- Single-source fix (Note 14): `cursor-pointer` lives in `buttonVariants` + Combobox base +
  Select trigger primitive — NOT scattered across consumer components.
- §17 UI pre-flight output in the session log.
- Self-validation block per Note 18.
- 0 new lint/typecheck errors; `npm run build` passes; 4 locales (unaffected — this is a
  pure-CSS / classname change) — verify zero locale key churn; 7 breakpoints.
- docs/backlog.md updated; session log: docs/sessions/2026-05-27-task-261-t6-cc3-cursor-pointer.md.

Out of scope: redesigning the Button or Combobox API; converting raw `<button>` violations to
canonical primitives (file as follow-up if you find any in scope item 4); changing focus or
active states; changing the disabled visual treatment beyond cursor.
```
