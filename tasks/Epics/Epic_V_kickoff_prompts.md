# Epic V — kickoff prompts (Tasks 222–223)

> Shared hard contract (top of every prompt): You are Claude Code Sonnet 4.6 working in `lero-al`.
> No scope change; no invented architecture — STOP & ask the orchestrator if ambiguous. Literal AC.
> Update `docs/backlog.md` + add a `docs/sessions/` log. 0 new lint/typecheck errors; `npm run build`
> passes; governance PASS. Locale parity sq/en/uk/it (every string ×4). Responsive
> 320/375/390/768/1280/1440/2560. Apply the Global Change Verification Rule + the UI pre-flight checklist
> in `docs/ui-rules.md`. RLS per `docs/rls-rules.md`. Owner runs git + SQL: end with a single
> `git add -A` then `git log -1`; write the EXACT SQL (table + RLS) into the session log for the owner —
> do NOT run SQL. Read addresses/secrets from env/config — never hardcode mailboxes.

---

## Task 222 — V.1 — Public Contacts page + inquiry form + routing + persistence

```
Hard contract: see top. Depends on owner provisioning support@/sales@ + env (document what's needed).

GOAL: a public "Contacts" page (linked in the footer/nav where other static pages live) with an inquiry
form: subject topic (preset list + "Other"→custom subject), the user's name, email, and message. On
submit, persist the inquiry and route it to the correct mailbox by topic.

Pre-read:
- docs/integrations.md (Resend), docs/env.md (env/secret rules + canonical site URL rule),
  docs/rls-rules.md, docs/data-access-rules.md, docs/component-rules.md, docs/ui-rules.md
- src/modules/notifications/lib/emails/* (existing Resend senders, e.g. emailChange.ts) — reuse the
  sender pattern; do not introduce a second email path
- an existing public static page + its route/layout for structure parity (e.g. a legal/about page)
- the canonical Combobox (subject topic select), form validation pattern (react-hook-form +
  validations), the canonical Button/Input

Topic set + routing (localize ×4; see Epic_V plan for the table). Put the topic→mailbox map in ONE
constant; "Other" reveals a custom-subject field and routes to support@ by default.

Scope:
1. DB (OWNER runs; write EXACT SQL + RLS to the session log): `contact_inquiries`
   (id uuid pk, created_at, topic text, custom_subject text null, name text, email text, message text,
   target_mailbox text, status text default 'new' check in ('new','in_progress','closed'),
   handled_by uuid null, handled_at timestamptz null, reply_count int default 0). RLS: admin/moderator
   read/update; INSERT only via the server action (no public direct table insert) — match how other
   public-write flows are secured in this repo.
2. Public page + form: subject Combobox (preset topics + Other), name, email (validated), message
   (min length). Localized labels/placeholders/errors ×4. Canonical controls only; responsive on all 7
   breakpoints; success + error toasts (canonical toast).
3. Server action: validate, derive target_mailbox from the topic map, rate-limit (reuse the existing
   rate-limit approach used elsewhere, e.g. email-change), insert the row. On insert, send a
   notification email to the routed mailbox via Resend (From = a configured no-reply / the mailbox,
   include the user's email as Reply-To) so staff see it immediately. Read all addresses from env/config.
4. Confirmation to the user: show on-screen success; (optional, only if trivially consistent with the
   existing senders) an acknowledgement email — if it adds risk, STOP and ask before adding it.

Acceptance criteria:
- Submitting the form persists a `contact_inquiries` row with the correct `target_mailbox` per topic
  ("Other"→support@), and notifies the routed mailbox via Resend (Reply-To = user email).
- Validation + localized errors ×4; canonical controls; responsive 7 breakpoints; RLS prevents public
  table reads/writes except via the action.
- Exact table + RLS SQL in the session log for the owner; required env documented in docs/env.md;
  0 new lint/typecheck errors; build passes; backlog + session log updated.

Out of scope: the admin handling screen (Task 223).
```

---

## Task 223 — V.2 — Admin Inquiries page (list + view + reply via Resend) + status

```
Hard contract: see top. Depends on Task 222 (table + topic map). Reply transport = Resend (owner
decision). Admin/moderator only.

GOAL: a new admin page that lists inquiries, lets an admin/moderator open one, read it, set status, and
reply by email. The reply is sent to the user's email via Resend (From = the routed mailbox by topic,
Reply-To = the routed mailbox), and the exchange is recorded.

Pre-read:
- Task 222 session log (table shape + topic→mailbox map), src/modules/notifications/lib/emails/*
  (Resend sender pattern), docs/integrations.md, docs/rls-rules.md
- existing admin pages for layout/role-gate parity (AdminSidebar, an existing admin manager screen,
  AdminPageHeader), the admin auth/role guard, the canonical toast
- docs/ui-rules.md (UI pre-flight checklist), docs/component-rules.md

Scope:
1. Admin route + sidebar entry "Inquiries" (admin + moderator). List inquiries with topic, mailbox,
   name/email, status, created_at; filter by status/mailbox; paginate consistent with other admin lists.
2. Detail view: full message + metadata; status control (new/in_progress/closed) persisted; a reply
   composer (textarea). On send: email the user via Resend (From = routed mailbox per topic, Reply-To =
   routed mailbox, To = inquiry.email), increment reply_count, set handled_by/handled_at, optionally move
   status to in_progress/closed. Record the reply (either a `contact_inquiry_replies` child table — write
   its EXACT SQL + RLS to the session log — or, if the owner prefers minimal, store last reply fields on
   the row; STOP & ask if unsure which).
3. All actions are server actions guarded by the admin/moderator role + RLS; localized UI ×4; responsive
   7 breakpoints; canonical controls + toasts.

Acceptance criteria:
- Admin/moderator can list, open, status-change, and reply to an inquiry; the reply email reaches the
  user's address via Resend with the correct From (routed mailbox) and Reply-To; reply_count/handled_by/
  handled_at update; non-admins are blocked (RLS + route guard).
- Any new table/columns' EXACT SQL + RLS written to the session log for the owner; localized ×4;
  responsive 7 breakpoints; 0 new lint/typecheck errors; build passes; backlog + session log updated.

Out of scope: the public page (Task 222); analytics on inquiries.
```
