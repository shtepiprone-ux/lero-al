# Sprint 30 — Task 336 kickoff (Opus) — Deleted-account cleanup + consent-based mailing DB architecture + MVP Sonnet sub-task

> **You are Opus 4.7 orchestrator / architect / reviewer.** Planning + spec only. Allowed: `docs/`, `tasks/`. Forbidden: `src/`, `messages/`, migrations, scripts. Single-writer git.
>
> **Numbering:** Task 336 = Opus architectural (renumbered from old "335"). MVP Sonnet sub-task ≥ 343. Phase 2–5 deferred. Wave 2.
>
> **Critical scope-split with Task 337:** Task 336 MVP fixes **backend lifecycle ONLY** (account deletion unblocks same-email re-registration). **Final delete-account COPY polish belongs to Task 337**, not 336. Task 336 MVP may include a minimally-truthful copy fix ONLY if the current copy is dangerously misleading (e.g. "deleted permanently" while soft-deleting). Otherwise copy stays untouched and Task 337 ships the polish after 336 lifecycle is verified.
>
> **Source:** `issues.md` 2026-05-31 — "Design deleted-account cleanup + consent-based mailing database architecture and admin export UX".

```
Type:     architecture / data lifecycle / privacy / admin / UX
Priority: high
Area:     docs/account-deletion-and-mailing-contacts-architecture.md (NEW)
          tasks/Sprints/Sprint_30_kickoff_prompt_Task_<NEXT_FREE>.md (NEW MVP Sonnet ≥ 343)
          docs/sessions/2026-05-31-task-336-account-deletion-mailing-contacts-architecture.md
```

## Pre-read

1. `docs/agent-contract.md`, `docs/orchestrator-role.md`, `docs/backlog.md`
2. `docs/ai-behavior.md` Notes 14 / 19 / 20 / 22
3. `docs/data-access-rules.md` + `docs/rls-rules.md` + `docs/domain-rules.md`
4. `docs/architecture.md` (modular monolith)
5. `docs/integrations.md` (Supabase Auth + Albanian-only outbound email policy)
6. `docs/env.md` + `docs/qa-rules.md`
7. `tasks/Epics/Epic_P_Favorites_Guest_Auth_and_Account_Lifecycle.md` + `Epic_R_Admin_Panel_2026.md` + `Epic_GG_Albanian_Only_Outbound_Email.md`
8. `src/modules/cabinet/components/ProfileTab.tsx` (delete UI entry)
9. `src/modules/cabinet/actions/index.ts` (deletion server action — find via grep)
10. `src/lib/supabase/admin.ts`
11. `src/modules/admin/actions/index.ts`
12. `src/components/admin/AdminSidebar.tsx` (future mailing nav placement)
13. `src/app/api/cron/inactivity/route.ts` (inactivity adjacent)
14. `messages/{sq,en,uk,it}.json` — `cabinet.delete_*` + future `admin.mailing_*`

## Owner-reported problem

User deletes account; Supabase still prevents same-email re-registration because email/auth record remains. Owner wants account data removed → email reusable. Owner ALSO wants contact data retained in a separate admin-managed mailing DB for future mailings, plus future admin section (view/copy/export CSV+JSON, local download).

## Critical architecture clarification (BLOCKING)

System MUST NOT claim "all account data deleted permanently" while retaining personal data in mailing DB. Either:
- Copy truthfully describes partial retention (consent-based marketing retention), OR
- Retention restricted to data with explicit consent flag, OR
- No retention until consent + status architecture ships.

Opus must NOT silently implement hidden retention. Principle: **active account deletion clears auth/profile blocker → mailing retention is explicit, minimal, source-labeled, consent-aware.**

## Required Opus output

### 1. Canonical doc `docs/account-deletion-and-mailing-contacts-architecture.md`

Sections (per `issues.md`):

1. Purpose
2. Current architecture (from investigation)
3. Current cause of same-email blocker (verified OR marked Sonnet-to-verify)
4. **Recommended active-account deletion lifecycle:**
   - Delete Supabase Auth user via admin client (`supabase.auth.admin.deleteUser(userId)`).
   - Delete or anonymize `public.users` / `profiles` row per FK constraints.
   - Archive listings per existing project policy (preserved if intentional).
   - Cascade per FK: favorites / saved searches / contact events — confirm via investigation; do NOT change FK behavior without justification.
   - Transactionality + repair path if auth-delete succeeds but DB-cleanup fails (or vice versa).
5. **Recommended mailing/contact DB schema** (separate table — do NOT pollute `users`):
   - Suggested table: `marketing_contacts` (Opus picks; document why).
   - Fields: `id`, `email`, `email_normalized`, `email_hash`, `first_name`, `last_name`, `phone`, `locale`, `source` enum (`deleted_account` / `newsletter_signup` / `admin_import` / `contact_form`), `source_user_id` (nullable; soft pointer; no FK back to users), `consent_status` enum (`pending` / `granted` / `revoked` / `suppressed`), `consent_source`, `consent_at`, `unsubscribed_at`, `suppressed_at`, `deleted_from_active_account_at`, `notes`, `created_at`, `updated_at`.
   - RLS — admin-only via server-only admin client.
   - Indexes — unique `(email_normalized, source)`.
6. **Consent / source / status model:**
   - Default: opt-out (do NOT retain marketing data without explicit consent).
   - Delete-account flow: explicit "I agree my email may be retained for future updates" checkbox. If unchecked → NO row written to `marketing_contacts`.
   - If checked → `consent_status='granted'`, `consent_source='delete_account_flow'`, `consent_at=NOW()`.
7. Truthful UX + consent — delete-account warning copy MUST match real behavior. **Final copy polish → Task 337** (do NOT bundle into 336 MVP).
8. **Admin mailing-database section UX** (Phase 3):
   - Path: `/admin/marketing/contacts` (recommend).
   - Role: `admin` always; `moderator` read-only or none (Opus picks).
   - Columns + filters + search + bulk + export (CSV + JSON, local browser download via `URL.createObjectURL`; filename `lero-al-mailing-contacts-YYYY-MM-DD.csv` / `.json`).
   - Confirmation dialog before exporting sensitive data.
   - States: empty / loading / error / permission-denied / no-results / mobile stacked.
9. CSV format — UTF-8 BOM, escaped commas/quotes/newlines, stable column order, machine column keys.
10. JSON format — array of contact objects + optional wrapper `{ exported_at, exporter_user_id, filter_applied }`.
11. Role / permission matrix.
12. Localization sq/en/uk/it (admin UI + delete-account consent checkbox + export confirmation).
13. Responsive 14-width canon.
14. Privacy + audit (recommend audit logging for export; defer if no audit infra).
15. **Phased Sonnet plan:**
    - **Phase 1 (MVP — kickoff produced now)**: fix account deletion lifecycle so deleted users can register again with same email. **DO NOT touch delete-account copy beyond minimal-truthful fix if currently dangerously misleading.** Final copy polish → Task 337.
    - Phase 2: create `marketing_contacts` table + server-only APIs + RLS.
    - Phase 3: admin mailing list UI.
    - Phase 4: CSV + JSON export + copy-to-clipboard + confirmation + local download.
    - Phase 5: future newsletter integrations.

### 2. MVP Sonnet sub-task kickoff (Opus writes file ≥ 343)

Title: `Task <NEXT_FREE> — Sonnet: Fix account deletion lifecycle so same email can register again (MVP)`.

The Sonnet sub-task MUST follow Canonical Task Template and include ALL: Pre-read · Current behavior to preserve · Required after behavior · **Positive flow · Negative flow** (auth-delete fails / DB-cleanup fails / FK constraint blocks / RLS rejects / orphan rows / network offline / cron concurrency / locale mismatch / permission-denied) · Implementation · AC (citing both flows) · Out of scope · Validation (pnpm + owner-SQL block) · Manual QA · Final report.

**MVP Sonnet scope:**
- Inspect existing delete-account server action.
- Verify same-email blocker root cause (`auth.users.email` unique constraint? `public.users.email`? FK?).
- Update deletion flow to call `supabase.auth.admin.deleteUser(userId)` + cascade-clean dependents per project policy.
- Preserve existing listing archive behavior.
- **Do NOT touch delete-account copy except for minimal-truthful fix if current copy is dangerously misleading.** Final copy polish belongs to Task 337 after this MVP ships and verifies actual behavior.
- Do NOT add marketing retention in MVP (defer to Phase 2).
- If owner explicitly directs minimal consent-aware retention in MVP → add explicit-opt-in checkbox + write to placeholder `marketing_contacts` row — Opus default is DEFER.
- Localize sq/en/uk/it for any unavoidable copy change.
- 14 canonical widths.

### 3. Session log + backlog update

Standard.

## Required investigation

1. Read `ProfileTab.tsx`; document delete-account UI.
2. Find server action: `rg -n "deleteAccount|deleteUser|account.*delete|cabinet.*delete" src/modules/cabinet src/modules/admin`.
3. Read `src/lib/supabase/admin.ts` for `auth.admin.deleteUser` capability.
4. Inspect `src/app/api/cron/inactivity/route.ts` + `presence/route.ts`.
5. Inspect FK constraints: `rg -n "REFERENCES users|REFERENCES auth.users|ON DELETE" scripts`.
6. Confirm same-email blocker: `auth.users.email` UNIQUE? `public.users.email`? Other?
7. Run:
   ```
   rg -n "delete account|deleteAccount|account deletion|Видалити акаунт|auth.admin|deleteUser|users.delete|deleted_at|archive|archived|mailing|newsletter|marketing|contacts|export|csv|json" docs tasks src messages
   ```

## Acceptance criteria for THIS Opus task

- Current deletion architecture inspected + summarised.
- Same-email blocker hypothesis documented.
- Recommended deletion lifecycle documented.
- Recommended mailing/contact DB schema documented (or DEFERRED with reason).
- Consent / source / status model defined.
- Truthful UX vs "permanent deletion" wording conflict resolved + explicitly split (lifecycle → 336 MVP; copy polish → 337).
- Admin mailing UI UX specified (Phase 3).
- CSV + JSON export UX + format specified (Phase 4).
- Role / permission matrix specified.
- Phased Sonnet plan (Phases 1–5).
- MVP Sonnet sub-task kickoff written with ALL canonical sections + Positive/Negative flow + STOP & ASK on consent retention.
- Localization sq/en/uk/it required.
- 14-width canon required.
- `docs/backlog.md` + session log updated.
- NO `src/` / `messages/` / migration changes by Opus.

## Out of scope

- Do NOT implement code.
- Do NOT create migrations.
- Do NOT edit locale files.
- Do NOT change runtime UI.
- Do NOT integrate Mailchimp/SendGrid.
- Do NOT create mass-email builder.
- Do NOT silently retain deleted-user personal data without consent.
- Do NOT claim permanent deletion while retaining personal data.
- Do NOT bundle final copy polish into MVP (Task 337 owns that).
- Do NOT merge with Tasks 338 / 342.

## Validation

```
rg -n "deleteAccount|delete account|auth.admin|marketing_contacts|consent" docs tasks src messages
git status --short        # read-only
```

## Final report

Files changed; current deletion behavior; re-registration blocker hypothesis/evidence; recommended deletion lifecycle; recommended schema; consent model; admin mailing UX; export UX; role matrix; phased plan; MVP Sonnet sub-task path; explicit scope-split with Task 337 noted; risks; out-of-scope; validation; no `src/` / `messages/` / DB changes confirmation; explicit-path owner git commands.
