# Sprint 30 — Task 342 kickoff (Opus) — In-service listing chat architecture (extends Epic BB)

> **You are Opus 4.7 orchestrator / architect / reviewer.** Planning + spec only. Allowed: `docs/`, `tasks/`. Forbidden: `src/`, `messages/`, migrations, scripts. Single-writer git.
>
> **Numbering:** Task 342 = Opus architectural (renumbered from old "341"). Sonnet sub-task ≥ 343 (Phase 1 only; Phases 2…N consume the free pool sequentially per phase). Wave 2 (last priority — largest scope).
>
> **Epic placement:** EXTENDS existing `tasks/Epics/Epic_BB_Listing_Inquiries_Report_and_Message.md` as **Epic BB.3 — In-service listing chat (Path B promotion)**. Epic BB.2 (Task 243) originally specified Path A (minimal inquiry via Resend) as default and explicitly forbade Path B (real-time chat) without owner approval. The owner has now approved Path B in writing (issues.md 2026-05-31). **No new Epic Z2 is created** — the collision with Sprint 29 Epic Z.2 (modal pattern) is the reason renumbering happened in the first place.
>
> **Cross-references:**
> - **Epic BB Task 243** (BB.2 — Path A minimal inquiry) supersedes condition: Path B (this task) replaces the Path A default once Phase 1 ships. Until Phase 1 ships, Path A (if implemented) stays. If Path A was never shipped, the existing ListingContact.tsx Send-message surface skips Path A entirely and lands directly on Phase 1.
> - **Task 338** (admin notification architecture, Opus) — chat events MUST integrate with the Phase-1 admin notification primitive; do NOT invent a parallel notifier.
> - **Task 336** (deleted-account cleanup + mailing DB, Opus) — chat retention + tombstoning policy MUST align with the account-deletion contract from Task 336.
> - **Task 340** (Global Responsive Design System Contract v1, Opus) — chat surfaces use the 14-width × 4-locale canon set in Task 340; until 340 propagates, this kickoff cites the canon inline.
>
> **Source:** `issues.md` 2026-05-31 — owner request "in-service chat between user and listing owner with admin moderation console + support-ticket transcript workflow".

```
Type:     architecture / feature / messaging / RLS / admin moderation / support / i18n / UX
Priority: high (largest new-feature in Sprint 30; phased)
Area:     Public listing detail "Надіслати повідомлення" button (src/modules/listings/components/ListingContact.tsx)
          NEW chat surfaces (user-side thread view + composer)
          NEW admin moderation console (admin reads / locks / takes-over / exports threads)
          Support-ticket transcript export workflow (chat → support ticket with full transcript snapshot)
          NEW canonical doc docs/messaging-chat-architecture.md
          Phase 1 Sonnet sub-task: tasks/Sprints/Sprint_30_kickoff_prompt_Task_<NEXT_FREE>.md (NEW, assigned when Task 342 is executed)
          Subsequent phases: tasks/Sprints/Sprint_30_kickoff_prompt_Task_<NEXT_FREE_AFTER_PHASE_1..N>.md (NEW, assigned sequentially in later Opus phase sessions)
          Epic update: tasks/Epics/Epic_BB_Listing_Inquiries_Report_and_Message.md (BB.3 row added)
          docs/sessions/2026-05-31-task-342-listing-chat-architecture.md
```

## Pre-read

1. `docs/agent-contract.md`, `docs/orchestrator-role.md`, `docs/backlog.md`
2. `docs/ai-behavior.md` Notes 14 / 18 / 19 / 20 + "Localization (i18n) Rules" + "Canonical Task Template"
3. `docs/architecture.md` (modular monolith boundaries; chat is a NEW module `src/modules/messaging/`)
4. `docs/data-access-rules.md` + `docs/rls-rules.md` + `docs/state-authority.md` (realtime + SSR vs client authority)
5. `docs/domain-rules.md` (role model — guest / user / agent / admin / moderator) + `docs/admin-ux-rules.md`
6. `docs/ui-rules.md` + `docs/component-rules.md` + `docs/qa-rules.md` + `docs/integrations.md` (Supabase Realtime, Resend)
7. `docs/analytics-rules.md` + `docs/performance.md` (realtime cost budget)
8. `docs/env.md` (any new env vars Phase 1 needs — none expected; if any, documented here)
9. `tasks/Epics/Epic_BB_Listing_Inquiries_Report_and_Message.md` (THIS task is BB.3)
10. `tasks/Epics/Epic_V_Contacts_and_Inquiries.md` (Path A pattern — reused for transcript export plumbing)
11. `tasks/Epics/Epic_C_Trust_Safety_and_Moderation.md` (reports schema — abuse controls reuse it)
12. `tasks/Sprints/Sprint_30_kickoff_prompt_Task_336.md` (account deletion ↔ chat retention)
13. `tasks/Sprints/Sprint_30_kickoff_prompt_Task_338.md` (admin notification primitive)
14. `tasks/Sprints/Sprint_30_kickoff_prompt_Task_340.md` (14-width × 4-locale canon)
15. `src/modules/listings/components/ListingContact.tsx` (entry point — "Надіслати повідомлення" button)
16. `src/modules/listings/components/ListingReportDialog.tsx` (abuse-report pattern reused)
17. `src/modules/notifications/lib/emails/*` (Resend senders — fallback email path)
18. `src/lib/auth/*` (session shape; guest vs signed-in fork)
19. `messages/{sq,en,uk,it}.json` (existing namespaces; new `messaging.*` namespace)
20. `supabase/migrations/` (current schema reference; Phase 1 adds NEW migration file — owner runs it)

## Owner problem

Public listing detail has a visible "Надіслати повідомлення" button (`ListingContact.tsx`). It currently 404s / leads nowhere usable. Owner has now decided (issues.md 2026-05-31) that the lero.al MVP shipped surface MUST be a **real in-service chat** — not an emailed inquiry — because:

1. Inquirers expect a familiar marketplace chat UX (OLX / dom.ria / Booking-style threaded messaging) and bounce when a Resend email round-trip is implied.
2. The platform needs **admin moderation** of every conversation (spam, scams, off-platform price negotiation, fraud — owner explicitly called out scam patterns).
3. The platform needs a **support-ticket transcript workflow**: when either party flags a thread (or admin escalates), the full chat transcript becomes the body of a support ticket — no copy-paste, no screenshot collection.

This is the largest single feature in Sprint 30. It MUST be phased (≥ 5 phases). Opus writes only the contract + Phase 1 Sonnet sub-task; subsequent phases are written in later Opus sessions.

## Current behavior / existing entry point

Investigation requirements (Opus does this during the Wave-2 session — output goes into `docs/messaging-chat-architecture.md` §"Current behavior"):

1. Open `src/modules/listings/components/ListingContact.tsx`. Document: every control on the surface (button labels, `onClick` targets, `<Link href>` if any, `data-track` attributes, conditional rendering by `isOwner` / `isGuest` / `role`). Capture before-state per Note 20.
2. Grep the repo for any chat / message / thread / inquiry infrastructure that may have been started and abandoned: `rg -n "messag(e|ing)|chat|thread|inquir(y|ies)|conversation" src supabase`. List every hit + classify (live · stub · dead) in the canonical doc.
3. Confirm there is no existing `messages` / `chat_threads` / `chat_messages` table in `supabase/migrations/`. If anything resembling chat persistence already exists, Opus STOPS and asks the owner whether to extend it or scrap it — Path B does NOT silently overwrite prior schema.
4. Confirm `Epic_V` `contact_inquiries` is NOT reused as the chat store — Path B uses a NEW schema. `contact_inquiries` may stay for the generic "contact form" surface.
5. Confirm where the existing "Поскаржитись" / report path lands (`ListingReportDialog` + `reportListingAction`). Abuse controls reuse the `reports` schema with a new `report_target_type = 'chat_thread' | 'chat_message'` discriminator.

## Required architecture output

### 1. Canonical doc — `docs/messaging-chat-architecture.md` (NEW)

Cross-referenced from `docs/rule-index.md` + `docs/architecture.md` + `docs/data-access-rules.md` + `docs/rls-rules.md` + Epic BB.

Required sections, in order:

1. Purpose + scope (what Path B is and is NOT — explicitly not group chat, not multi-listing threads, not WebSocket-custom-server, not E2E-encrypted).
2. Current behavior (from investigation §"Current behavior / existing entry point" above).
3. Module placement: `src/modules/messaging/` (server actions, RSC views, client composer, realtime hooks). Imports allowed FROM listings + notifications + auth; imports INTO messaging from other modules go through a thin `src/modules/messaging/api.ts` barrel.
4. **Data model** (canonical SQL — owner runs migration, never Sonnet). See §Data model below.
5. **RLS / security policies** (every table). See §RLS/security below.
6. **Realtime channel design** — Supabase Realtime on `chat_messages` filtered by `thread_id` for participants only. Admin moderation channel is a SEPARATE channel with admin-scoped RLS. Document message ordering guarantee (server `created_at` is source of truth; client optimistic IDs reconciled).
7. **Notification fan-out** (see §Notifications).
8. **User chat UX** (see §User chat UX).
9. **Admin moderation UX** (see §Admin moderation UX).
10. **Support-ticket transcript workflow** (see §Support-ticket transcript workflow).
11. **Privacy / audit** (see §Privacy/audit).
12. **Abuse controls** (see §Abuse controls).
13. **Localization sq/en/uk/it** (see §Localization).
14. **Responsive 14-width canon** (see §Responsive).
15. **Phased Sonnet plan** (see §Phased Sonnet plan).
16. **Out of scope for Path B v1** — group chat, voice/video, file attachments > image, end-to-end encryption, off-platform price negotiation enforcement beyond detection, multi-listing threads, message-edit history beyond soft-delete.

### 2. Phase 1 Sonnet sub-task kickoff file

Opus writes `tasks/Sprints/Sprint_30_kickoff_prompt_Task_<NEXT_FREE>.md` per §First Phase 1 Sonnet sub-task below. The exact Sonnet task number is assigned from the free pool when Task 342 is actually executed. All later phases consume subsequent free task numbers in later Opus sessions AFTER each preceding phase ships and PASSes owner manual QA.

### 3. Epic BB update

Append BB.3 row to `tasks/Epics/Epic_BB_Listing_Inquiries_Report_and_Message.md` cross-referencing this kickoff + the phase tasks.

### 4. Session log + backlog update

Standard `docs/sessions/2026-05-31-task-342-listing-chat-architecture.md` + `docs/backlog.md` entry.

## Data model

NEW migration (owner runs it; Sonnet writes the SQL file under `supabase/migrations/<UTC_TS>_messaging_chat_phase_1.sql`). Tables:

- **`chat_threads`** — `id uuid pk`, `listing_id uuid fk listings.id on delete restrict`, `inquirer_id uuid fk auth.users.id on delete set null` (tombstone on account deletion per Task 336), `owner_id uuid fk auth.users.id on delete set null`, `status text check in ('open','locked','closed_by_admin','escalated_to_support')`, `created_at timestamptz default now()`, `last_message_at timestamptz`, `locked_at timestamptz`, `locked_by uuid fk auth.users.id`, `lock_reason text`. Unique `(listing_id, inquirer_id)` — one thread per (listing, inquirer) pair. (Owner can open multiple threads from different inquirers; one inquirer cannot open duplicate threads against the same listing.)
- **`chat_messages`** — `id uuid pk`, `thread_id uuid fk chat_threads.id on delete cascade`, `sender_id uuid fk auth.users.id on delete set null`, `sender_role text check in ('inquirer','owner','admin')`, `body text not null check (length(body) between 1 and 4000)`, `attachment_url text`, `created_at timestamptz default now()`, `edited_at timestamptz`, `deleted_at timestamptz` (soft delete; original body preserved for admin/audit but UI shows "[видалено]"), `flagged_at timestamptz`, `flagged_by uuid`, `flag_reason text`.
- **`chat_thread_participants`** (derived view OR denormalized table — Opus picks based on RLS-performance trade-off, documents in canonical doc) — convenient lookup of (thread_id, user_id, role) for RLS.
- **`chat_thread_audit_log`** — append-only audit of every admin action on a thread: lock/unlock, take-over, transcript export, force-close, message hide. Columns: `id`, `thread_id`, `actor_id` (admin), `action text`, `metadata jsonb`, `created_at`.
- **Index policy** — `chat_messages(thread_id, created_at desc)`; `chat_threads(owner_id, last_message_at desc)`; `chat_threads(inquirer_id, last_message_at desc)`; `chat_threads(status) where status != 'open'` partial index for admin queue.

Phase 1 ships ONLY `chat_threads` + `chat_messages` + the participant view; audit + flagging + soft-delete + admin take-over land in later phases — but their columns ARE created in Phase 1 (nullable / default), so no destructive migration later.

## RLS / security

Every table is `enable row level security`. Policies (canonical doc §RLS spells out each, with exact SQL):

- **`chat_threads` SELECT** — `auth.uid() in (inquirer_id, owner_id)` OR `is_admin(auth.uid())`. Guests CANNOT read any thread.
- **`chat_threads` INSERT** — only via `create_chat_thread(listing_id)` server action which sets `inquirer_id = auth.uid()` and looks up `owner_id` from `listings.owner_id`. Direct `insert` from client is blocked at policy level (no policy → default deny).
- **`chat_threads` UPDATE** — admin only (lock / status change). Participants do NOT update threads directly; their actions go through server actions that mutate via service role or `security definer` functions with explicit guards.
- **`chat_messages` SELECT** — `thread_id` participant OR `is_admin(auth.uid())`.
- **`chat_messages` INSERT** — `thread_id` participant AND thread `status = 'open'` AND `length(body) between 1 and 4000`. Admin can also insert with `sender_role = 'admin'` (broadcast warning, take-over).
- **`chat_messages` UPDATE / DELETE** — admin only; sender soft-edit allowed within 5 minutes of `created_at` (later phase, NOT Phase 1).
- **`is_admin()` helper** — reuse the existing project helper; if missing, Opus documents which existing role function is canonical and references it. Do NOT invent a new role check.
- **Server actions** must `requireSession()` for all write paths and re-verify thread membership inside the action (defense in depth — never trust client `thread_id`).
- **Guest path** — guests CANNOT chat. The "Надіслати повідомлення" button on `ListingContact.tsx` for guests opens an auth prompt ("Sign in to message the owner") with deep-link return-to-listing after sign-in. Phase 1 documents this; Path A fallback (email-only inquiry for guests) is NOT shipped in Path B — guests must register. Owner has confirmed this is acceptable in `issues.md`.

## Notifications

- **In-app** — new message in a thread the user does NOT currently have open triggers an unread-badge update via the Task 338 admin notification primitive (re-used; chat is one event type alongside listing-pending). Inquirer and owner each see unread counts on their cabinet entrypoint.
- **Email** — Resend digest, NOT per-message. Per-message email would create spam. Phase 1 ships a single delayed digest at T+15min if the recipient has NOT opened the thread (configurable later). Email body shows sender display name + first 240 chars + Reply-To set to a no-reply address (replies-by-email are NOT supported in Path B v1 — owner accepted this).
- **Push / SMS** — out of scope for Path B v1.
- **Admin notifications** — chat thread `status` transition into `flagged` / `escalated_to_support` triggers admin notification via Task 338 primitive.

## User chat UX

Surface decisions (canonical doc §User chat UX):

1. **Entry point** — `src/modules/listings/components/ListingContact.tsx`. The "Надіслати повідомлення" button:
   - **Guest:** opens auth modal → returns to listing post-sign-in.
   - **Signed-in non-owner:** opens chat thread (creates if none for this listing+user) and navigates to `/{locale}/cabinet/messages/{thread_id}`.
   - **Owner-of-listing:** button hidden (cannot message self).
2. **Cabinet inbox** — `/{locale}/cabinet/messages` lists threads (last message, listing thumbnail, unread badge, search). Reuse existing cabinet shell + sidebar.
3. **Thread view** — `/{locale}/cabinet/messages/{thread_id}` — header (listing card + counterpart display name + status badge if locked/escalated), message list (oldest top → newest bottom, sticky composer, auto-scroll on new message), composer (textarea, 4000-char limit with counter, Send button, optional image attachment in later phase). Realtime subscribe to channel `thread:{thread_id}`. Optimistic send with reconcile on server ACK.
4. **Empty state** — when inquirer opens for the first time, a system message frames context: «Це початок розмови з власником оголошення. Будь ласка, не діліться платіжними даними поза платформою.» (sq/en/uk/it canonical wording in §Localization).
5. **Status banners** — locked / escalated / closed_by_admin / counterparty_deleted (Task 336 cross-ref) each render a distinct banner; composer is disabled when status ≠ `open`.
6. **Report message / report thread** — every message row has a kebab → "Поскаржитись" that opens the existing `ListingReportDialog` pattern with `report_target_type = 'chat_message'`. Thread header has "Поскаржитись на розмову" → `report_target_type = 'chat_thread'`.

## Admin moderation UX

Canonical doc §Admin moderation UX:

1. **Admin route** — `/{locale}/admin/messaging` (NEW; reuses admin shell from Task 332 admin dashboard work and the admin-table responsive contract from Task 306-Fix → 14-width canon).
2. **Thread list** — paginated table of threads filterable by status, listing, participant; sortable by `last_message_at`. Columns: listing, inquirer, owner, status, last message preview, flag count.
3. **Thread detail** — admin opens any thread read-only by default. Actions: **Lock** (sets `status = 'locked'`, optional reason text — appended as system message), **Unlock**, **Hide message** (soft-delete; original body preserved in `chat_messages.deleted_at` + `audit_log`), **Take over** (admin inserts message with `sender_role = 'admin'`, visible to both participants — used for warnings + de-escalation), **Escalate to support** (creates support ticket per §Support-ticket transcript workflow), **Force close**.
4. **Every admin action** writes a row to `chat_thread_audit_log` with `actor_id`, `action`, `metadata`. The audit log is exposed in the thread detail panel.
5. **Realtime** — admin sees new messages in any thread in near-real-time (admin Realtime channel with admin-only RLS); used to triage active scams.
6. **Bulk actions** — Phase 2+, NOT Phase 1.

## Support-ticket transcript workflow

Canonical doc §Support-ticket transcript workflow:

1. **Escalation** — either an admin action ("Escalate to support" in admin moderation UX) OR a user action ("Open a support ticket about this conversation" in user thread view; later phase, NOT Phase 1).
2. **Transcript snapshot** — at the moment of escalation, the FULL message list of the thread is captured into the support ticket body as immutable text — markdown-formatted with role labels + timestamps. Soft-deleted messages are included with body shown (admin-only ticket) but flagged as deleted.
3. **Support ticket integration** — REUSES the existing support ticket infrastructure (the system already has a support module — Opus confirms during investigation; if missing, Opus stops and asks). The chat thread carries `escalated_support_ticket_id` pointer; the ticket carries `source_chat_thread_id`. Bidirectional traceability.
4. **Thread status** transitions to `escalated_to_support`; composer disabled; participants see banner: «Цю розмову передано до служби підтримки» (canonical sq/en/uk/it in §Localization).
5. **Transcript export (manual)** — admin can download the transcript as `.txt` for legal / abuse reporting. Filename pattern `chat-{thread_id}-{utc_ts}.txt`. Audit-logged.
6. **Phase 1 ships** the data fields + admin escalate-button + transcript-snapshot routine. Support-ticket UI integration ships in Phase 3 (or whichever phase corresponds to support module readiness — Opus picks during planning of Phase 3).

## Privacy / audit

1. **PII in transcripts** — phone numbers / external emails detected by a server-side regex pass are flagged (NOT auto-redacted in Phase 1; just flagged into `flag_reason` for admin review per §Abuse controls).
2. **Retention** — chat messages retained 24 months from `last_message_at`, then archived (NOT deleted) into `chat_messages_archive` (later phase). Phase 1 documents the policy and adds a migration column for `archived_at`; the archival job is later.
3. **Account deletion** (Task 336 cross-ref) — when a participant's account is deleted, their `sender_id` is set to NULL (FK `on delete set null`) and their display name in transcripts becomes "Видалений користувач" (sq/en/uk/it). Message bodies are preserved (audit + counterparty reading rights). Account deletion does NOT cascade-delete chat content.
4. **Audit log** is append-only — no UPDATE / DELETE policy; admins cannot rewrite history.
5. **GDPR / right to erasure** — owner-side decision deferred to Task 336 architecture; Opus DOES NOT invent a policy here. The canonical doc links to Task 336's decision and notes "follow Task 336 contract for erasure scope".

## Abuse controls

1. **Rate limit** — per `inquirer_id` per `listing_id`: max 5 messages per minute, max 50 per day (Phase 1 ships rate-limit constants; enforcement in the server action; values are tunable in canonical doc).
2. **Length limit** — 4000 chars per message (DB CHECK + server-side validation + composer counter).
3. **Spam regex** — server-side detection of (a) external URLs not on lero.al allowlist, (b) phone-number patterns, (c) crypto-wallet patterns. Detection → set `flagged_at` + `flag_reason`; message still sent (admin queue handles); user sees no UI difference (Phase 1). Auto-block of repeat offenders is Phase 3+.
4. **Report → reports schema** — abuse-report reuses `reports` table (Epic C / Task 117) with NEW discriminator values `chat_message` / `chat_thread`. The reports admin dashboard already handles the queue; only the discriminator columns + report-from-chat trigger source are new.
5. **Block list (later phase)** — owner-side block-this-user → cannot create new threads to me; existing threads transition to `locked` with reason "blocked_by_counterparty". Phase 2+.
6. **Off-platform negotiation detection** — owner explicitly raised this. Phase 1: spam regex flags; admin reviews. Phase 4+: dedicated heuristic + UI nudge "We detected an attempt to negotiate off-platform; protected escrow keeps you safe."

## Localization sq/en/uk/it

All user-visible strings live in a new `messaging.*` namespace across `messages/{sq,en,uk,it}.json` (Sonnet ships them in Phase 1). Canonical wording for the highest-stakes strings (Opus locks these in the doc; Sonnet does not paraphrase):

- **Send-message button (existing key may be reused if already present)** — uk: «Надіслати повідомлення» · sq: «Dërgo një mesazh» · en: "Send a message" · it: "Invia un messaggio".
- **Auth-required modal for guests** — uk: «Увійдіть, щоб написати власнику оголошення» · sq: «Identifikohu për t'i shkruar pronarit të shpalljes» · en: "Sign in to message the listing owner" · it: "Accedi per scrivere al proprietario dell'annuncio".
- **First-message safety banner** — uk: «Це початок розмови з власником оголошення. Будь ласка, не діліться платіжними даними поза платформою.» · sq: «Kjo është fillimi i bisedës me pronarin e shpalljes. Ju lutemi, mos ndani të dhëna pagese jashtë platformës.» · en: "This is the start of your conversation with the listing owner. Please do not share payment details outside the platform." · it: "Questo è l'inizio della conversazione con il proprietario dell'annuncio. Non condividere dati di pagamento al di fuori della piattaforma."
- **Thread locked by admin** — uk: «Цю розмову заблоковано адміністратором» · sq: «Kjo bisedë është bllokuar nga administratori» · en: "This conversation has been locked by an administrator" · it: "Questa conversazione è stata bloccata da un amministratore".
- **Thread escalated to support** — uk: «Цю розмову передано до служби підтримки» · sq: «Kjo bisedë i është dorëzuar shërbimit të mbështetjes» · en: "This conversation has been handed off to support" · it: "Questa conversazione è stata inoltrata al supporto".
- **Counterparty deleted** — uk: «Видалений користувач» · sq: «Përdorues i fshirë» · en: "Deleted user" · it: "Utente eliminato".
- **Hidden message placeholder** — uk: «[видалено]» · sq: «[i fshirë]» · en: "[deleted]" · it: "[eliminato]".

Note 14 applies: Sonnet runs `rg -n "messaging\.|Send a message|Надіслати повідомлення|Dërgo një mesazh|Invia un messaggio"` across `src` + `messages` to ensure no missed keys or duplicates.

## Responsive 14 widths

Canon (until Task 340 propagates globally): **320 / 375 / 390 / 480 / 560 / 680 / 768 / 810 / 960 / 1024 / 1200 / 1440 / 1920 / 2560**. Every chat surface MUST be verified at each width × each locale (4 locales) — 56 visual states per surface. Surfaces: `ListingContact` button, auth-gate modal, cabinet inbox list, cabinet thread view (header / message list / composer), admin messaging list, admin thread detail, transcript-export confirmation. Composer textarea uses auto-grow with max-height; on `<lg` the thread view inherits the Task 329 bottom-sheet pattern where modals are involved (e.g. report dialog inside chat).

## Phased Sonnet plan

**Phase 1 (<NEXT_FREE>) — Foundation.** Schema migration (`chat_threads` + `chat_messages` + participant view + RLS) + server actions (`create_chat_thread`, `send_chat_message`, `list_my_threads`, `get_thread_messages`) + minimal cabinet inbox + thread view with REALTIME + composer + wiring `ListingContact.tsx` button (guest → auth modal; signed-in → create-or-open thread + redirect). NO admin moderation UI, NO transcript export, NO Resend digest, NO flags/audit yet. Localization sq/en/uk/it for all visible strings shipped in Phase 1.

**Phase 2 (Task <NEXT_FREE_AFTER_PHASE_1>) — Admin moderation MVP.** Admin route `/admin/messaging`, thread list + detail (read-only), lock/unlock, hide message (soft-delete), audit log writes, admin Realtime channel. Reuses Task 332 admin shell + Task 306-Fix responsive contract.

**Phase 3 (Task <NEXT_FREE_AFTER_PHASE_2>) — Support-ticket transcript workflow.** Escalate-to-support action (admin + user), transcript snapshot routine, integration with support module, bidirectional pointers, escalated banner, composer-disabled state. Confirms support module readiness in pre-read.

**Phase 4 (Task <NEXT_FREE_AFTER_PHASE_3>) — Notifications + abuse controls.** Resend digest (T+15min unopened), spam regex (URLs / phone / crypto), rate limit enforcement, flagged-at population, report-from-chat → `reports` table integration with new discriminators.

**Phase 5 (Task <NEXT_FREE_AFTER_PHASE_4>) — Polish + retention.** Soft-edit within 5 min, image attachment, block-user (Phase 2 of abuse), retention/archival job stub, off-platform negotiation nudge UI, full QA at 14-width × 4-locale matrix end-to-end.

Each phase ships in a separate Opus session that writes the corresponding Sonnet kickoff. Phases run sequentially (each gated on owner manual QA PASS of the previous phase).

## First Phase 1 Sonnet sub-task

Opus writes `tasks/Sprints/Sprint_30_kickoff_prompt_Task_<NEXT_FREE>.md` with the title `Task <NEXT_FREE> — Sonnet: In-service chat — Phase 1 foundation (schema + RLS + server actions + cabinet inbox + thread view + ListingContact.tsx wiring)` and the Canonical Task Template applied. The exact task number is assigned from the free pool when Task 342 is executed. The Phase 1 kickoff MUST include:

- Pre-read (this kickoff + the canonical doc once written + agent-contract + UI / data-access / RLS / domain rules + Task 336/338/340 cross-refs).
- Current behavior to preserve on `ListingContact.tsx` (control inventory per Note 20).
- Required after behavior (button → auth-gate-or-thread; cabinet inbox; thread view).
- **Positive flow** — signed-in inquirer clicks Send → thread created (or reused) → redirected to `/cabinet/messages/{thread_id}` → composer ready → message sends → owner receives in real-time → unread badge updates → reply round-trip works.
- **Negative flow** — guest click → auth modal (NOT 404, NOT direct thread); owner clicks own listing's Send button → button hidden; duplicate thread attempt → existing thread reused (unique constraint); message > 4000 chars → composer prevents send + counter shows; RLS violation attempt (forge `thread_id`) → server action 403; realtime subscription to a thread the user is not a participant of → no messages delivered; deleted-counterparty thread → display name = "Видалений користувач" + composer still works if status `open`; thread status `locked` → composer disabled + banner shown.
- Implementation: exact migration filename + SQL (no `IF NOT EXISTS` shortcuts that swallow drift), exact server-action signatures, exact file paths under `src/modules/messaging/`, Realtime hook contract.
- Localization keys + values (sq/en/uk/it) for every visible string in Phase 1.
- AC citing both flows + 14-width × 4-locale verification matrix.
- Out of scope: admin moderation / transcript / digest / flags / soft-edit / attachments (these are Phases 2-5).
- Validation: `pnpm tsc --noEmit && pnpm lint && pnpm build && pnpm test` + `rg` checks for hardcoded strings + RLS smoke test.
- Manual QA checklist (14 widths × 4 locales × 3 roles).
- Final report including the "Files Changed" table per agent-contract clause 10.
- Migration SQL is in a separate file; owner runs it. Sonnet does NOT execute migrations.

Opus does NOT write Phase 2-5 kickoffs yet. They are written one at a time in subsequent Opus sessions.

## Acceptance criteria

For THIS Opus task (Task 342, architecture only):

- Investigation §"Current behavior" inspected + summarised in canonical doc.
- `docs/messaging-chat-architecture.md` exists with ALL 16 numbered sections (Purpose … Out of scope) populated — no TBDs.
- Data model SQL is canonical (every column + check + index + FK behavior on delete listed).
- RLS policies are exhaustive (every table × every verb).
- Notifications, User chat UX, Admin moderation UX, Support-ticket transcript workflow, Privacy/audit, Abuse controls sections all populated.
- Localization sq/en/uk/it canonical wordings listed in the doc.
- Responsive 14-width canon cited inline.
- Phased Sonnet plan ≥ 5 phases (Phase 1 = Foundation; Phase 5 = Polish + retention).
- Phase 1 Sonnet kickoff file `tasks/Sprints/Sprint_30_kickoff_prompt_Task_<NEXT_FREE>.md` written with the task number assigned from the free pool when Task 342 is executed; follows Canonical Task Template; includes Positive + Negative flow per Note 6a.
- `tasks/Epics/Epic_BB_Listing_Inquiries_Report_and_Message.md` updated with BB.3 row + cross-ref to Task 342 + Phase 1 task.
- `docs/sessions/2026-05-31-task-342-listing-chat-architecture.md` + `docs/backlog.md` updated.
- ZERO `src/` / `messages/` / migration / script changes by Opus in this session.
- NO new Epic file created (this extends Epic BB).
- NO Epic_Z2 created or referenced (collision avoided).

## Out of scope

- Group chat / multi-listing threads.
- Voice / video / call escalation.
- File attachments beyond image (Phase 5 ships image only).
- End-to-end encryption.
- Off-platform price enforcement beyond detection + nudge.
- Replying to chat by email (Resend Reply-To).
- Building the support module itself (Phase 3 INTEGRATES with the existing support module; it does NOT create one — if missing, Opus halts Phase 3 and asks).
- Push / SMS notifications.
- Writing Phase 2-5 kickoffs in this session.
- Touching `src/` / `messages/` / migrations from THIS kickoff (Opus is planning + spec only).
- Changing the homepage agent CTA copy (that's Task 330).
- Changing the admin notification primitive (that's Task 338).
- Changing the account-deletion contract (that's Task 336).

## Validation

```
rg -n "Надіслати повідомлення|Send a message|Dërgo një mesazh|Invia un messaggio" src messages
rg -n "messag(e|ing)|chat|thread|inquir(y|ies)|conversation" src supabase docs tasks
rg -n "Epic_Z2|Epic Z2" tasks docs   # MUST return zero hits
rg -n "docs/messaging-chat-architecture.md" docs tasks
ls tasks/Sprints/Sprint_30_kickoff_prompt_Task_<ASSIGNED_NUMBER>.md
git status --short
```

Expected: canonical doc exists; Phase 1 kickoff exists under the assigned free-pool task number; Epic BB updated; backlog + session log updated; zero `src/` / `messages/` / migration diff; zero `Epic_Z2` references.

## Final report

Files changed (table per agent-contract clause 10); summary of current behavior found in `ListingContact.tsx` + repo grep; the architectural decisions locked in the canonical doc (module placement, schema shape, RLS posture, Realtime channel design, notification fan-out, escalation contract, abuse posture); the canonical localized wording set sq/en/uk/it; the phased plan with phase boundaries; path to Phase 1 Sonnet kickoff; confirmation that Epic BB was EXTENDED (not Epic_Z2 created); confirmation of zero `src/` / `messages/` / DB / script changes; explicit-path owner git commands for the orchestrator-emitted commit (docs/tasks files only).
