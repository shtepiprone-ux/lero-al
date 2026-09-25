# Sprint 80 — the Data API privileges nobody audited against what the code actually uses

**Opened:** 2026-09-23 · **Status:** 🟠 **OPEN** · **Landed tasks:** 1 (870) · **Kickoffs filed:** 3 (870, 871, 881) · **Reserved:** 0

> **These counts drift.** Re-derive them from the Tasks table below, never from this line.

> **Opened by owner instruction, 2026-09-23** (verbatim): *"Задачу створи, щоб уникнути дірок."* The session started
> from Supabase's notice that from 2026-10-30 new `public` tables get no automatic Data API grants. The owner's
> measurements that day are in `docs/sessions/evidence/task870/00-owner-grids-2026-09-23.txt`.

## The defect, and why it gets its own sprint

The grant question was audited once, in **Task 275** (2026-05-28). That audit went through **tables** and never
checked the privileges Supabase hands out by default for the privileges it did not name. Three results from the
owner's 2026-09-23 grids show what that missed:

- **`public.public_user_profiles` was writable by anyone.** It is a `security_invoker=false` view over `users`. It
  is owned by `postgres` (`bypassrls=true`) and it is auto-updatable. `anon` and `authenticated` both held `UPDATE`
  and `INSERT` on it. The public anon key was therefore enough to rewrite `is_verified`, `user_type`, `name`,
  `company_name`, `avatar_url` or `deleted_at` on **any** user's row, outside `users`' RLS. Task 266 granted it
  `SELECT` to `authenticated` only. Task 275 listed it as "✅ OK". The owner closed it the same day with a hotfix.
  This sprint puts that hotfix on record.
- **Tables the rules say are service-role only are not.** `email_change_tokens`, `user_status_history` and
  `user_change_log` give `anon` and `authenticated` `SELECT` and `INSERT`. `docs/rls-rules.md` and Task 275 both say
  "service_role only". Task 275's script only *granted* to `service_role`; it never revoked the defaults. RLS
  currently hides the rows, so the gap is latent, not live.
- **Fifteen tables have no consumer in `src/` at all (`history_clear_events` only through a service-role RPC), and `anon` has full DML on them.** RLS and predicates are
  what currently neutralise them (Task 865's 2026-09-21 predicate scan). Nothing grants them on purpose.

The 2026-09-21 schema sweep behind Task 865 had exactly this blind spot: it covered the 50 **tables** and concluded
that "`rowsecurity = true` on every one". A view has no RLS and no policies, so a policy/predicate scan cannot see it.
**A check's scoping rule is also its blind spot** (Sprint 75's rule). This sprint makes the audit cover views,
default privileges and functions, and makes it repeatable.

## Why a new sprint — goal fit checked against every open sprint

| Sprint | Its goal | Fits? |
|---|---|---|
| **46** | ListingCard de-Tailwind + overlay exit | No — one card family. |
| **55 · 56 · 57** | ARIA semantics / raw enum leaks / deleting unused code | No — detector and removal families. 57 deletes *code*; 870 deletes no table. |
| **61 · 62** | Projection layer no gate reads / Tailwind runtime tokens | No — gate families over CSS/docs. |
| **69 · 70 · 71 · 72 · 74** | `/listings`, site chrome, listing detail, similar listings, card width | No — UI migration goals. |
| **73** | A sold listing is reachable by link but never listed | No — scope-locked to listing-status visibility (D73-1…D73-3). |
| **77** | The full test suite is red, and no gate runs it | No — test-suite health, widened only for six named numbers. |
| **78** | Admin and agent dashboards on canonical Mantine | No. It hosts **865** only "by discovery, not goal fit", and 865 is **scope-locked narrow by owner decision 2026-09-21** (*"865 залишити вузьким … не роздувати його в повний schema-wide аудит"*). 870 does not widen 865: it is a separate number with a separate write set, and it keeps `listing_views` out of its scope. |
| **79** | The CMS pages nobody outside the admin can read | **Closest, and still no.** 79's goal is one table (`pages`) and one route, closed by 867. 870 leaves `pages` alone and is schema-wide. |

## Goal

1. No view in `public` grants `anon` or `authenticated` any write privilege. A `SECURITY DEFINER` (non-invoker) view
   carries only the `SELECT` grants its documented consumers need.
2. Every table the rules classify as service-role only, and every table with no consumer in `src/`, is out of reach
   of `anon` and `authenticated` at the **grant** layer — not only at the RLS layer.
3. Tables that `postgres` creates in the future inherit no privilege for `anon` or `authenticated`. Every grant is
   written explicitly, per `docs/rls-rules.md`'s template.
4. **The audit is repeatable.** One read-only SQL file returns one result grid that covers views, service-only
   tables, RLS-disabled tables, open write policies, `SECURITY DEFINER` functions and default privileges. Every check
   always prints a row, so an empty check is visible.
5. **No legitimate read is broken by a grant**, in either direction. **871** is the first case found: moderator
   permission checks read a table that `authenticated` cannot `SELECT`.

## Tasks

> **This table is the single state source for the sprint.** Read state here, not from a kickoff header.

| # | Title | Priority | QA | Depends on | State |
|---|---|---|---|---|---|
| **870** | Data API privilege hardening: record the 2026-09-23 `public_user_profiles` hotfix, revoke `anon`/`authenticated` from the three service-only tables and the fifteen tables with no consumer (guarded, fail-closed SQL), remove the `anon`/`authenticated` default privileges on future `postgres` tables and sequences, ship a one-grid repeatable audit and a two-armed anon probe, and update `docs/rls-rules.md` so a view can never again be granted DML | **P1** | **Q4** | — | ✅ `APPROVED WITH NOTES` 2026-09-23 (review 3; archived — owner-applied, AFTER audit A1/A3/A4/A7 = 0, anon probe 42501 on all 18 naming themselves; `clear_user_history` anon EXECUTE found in A6 and revoked the same run; ledger `docs/reviews/2026-09-23-task870-data-api-privilege-hardening.review-ledger.json`) → [`…Task_870…`](Sprint_80_kickoff_prompt_Task_870_Data_API_Privilege_Hardening.md) |
| **871** | Moderator permission checks can never succeed: `roleHasPermission` (`src/lib/auth/permissions.ts:10-16`) reads `role_permissions` through the user-scoped client, and `authenticated` has had no `SELECT` on it since Task 275 | **P2** | Q4 | — | `KICKOFF FILED` 2026-09-25 — owner route (a), 2026-09-23: *"Задача 871 - я вибираю варіант а) читати role_permissions через service role, права в базі не змінюються."* Scope also covers `getModeratorPermissions` (`/admin/permissions`), which reads the same table the same way (kickoff F5/F6) → [`…Task_871…`](Sprint_80_kickoff_prompt_Task_871_Moderator_Permission_Reads_Through_Service_Role.md) |
| **881** | `notifications` least-privilege: the live grid (2026-09-24, owner-run) gives `anon` and `authenticated` **every** privilege on `public.notifications`, while `scripts/grant-discipline-audit.sql:158-160` declares `select` to `authenticated` and `all` to `service_role` — and that declaration is itself wrong, because `markNotificationRead`/`markAllNotificationsRead` (`src/modules/notifications/lib/mutations.ts`) update through the user-scoped client and need `UPDATE` | P2 | Q4 | — | `PARTIALLY VERIFIED` 2026-09-25 (review 3; code-side ACs verified; **O80-5 owed now**; P3 gate hardening RV7 at kickoff §18 in parallel) — `KICKOFF FILED` 2026-09-25 (reserved 2026-09-24 by owner decision **D82-4**, *"Separate task (Recommended)"*). `anon` loses everything; `authenticated` keeps `SELECT` + `UPDATE (is_read)`; static gate `check:notifications-grants`; owner-run two-armed probe incl. mark-as-read and the live bell → [`…Task_881…`](Sprint_80_kickoff_prompt_Task_881_Notifications_Least_Privilege_Grants.md) |

## Owner actions this sprint needs

| ID | Action |
|---|---|
| **O80-1** | In Supabase → Integrations → Data API → Settings, switch **"Automatically expose new tables"** OFF and press Save, **before** applying 870's harden SQL. Supabase does this itself on 2026-10-30. Doing it first means the toggle cannot re-add defaults after the SQL removes them. Whether the toggle writes `postgres`'s or only `supabase_admin`'s default ACL is **UNKNOWN**; 870's audit check A7 measures the result either way. |
| **O80-2** | After 870's executor reports: run `scripts/task-870-privilege-audit.sql` (BEFORE grid), run `scripts/task-870-guard-selftest.sql` (it must error), apply `scripts/task-870-harden-privileges.sql`, run the audit again (AFTER grid), then run the anon probe. Return the outputs listed in the kickoff §13.3. The exact block is in the kickoff §13.3. |
| **O80-3** | After O80-2: signed in, open one listing and check the owner's contact card still renders. Signed out, check the same listing shows the sign-in button. As admin, open `/admin/users/<any id>` and check the status-history and change-log sections load. |
| **O80-4** | Task 871, after its executor reports: run `scripts/task-871-moderator-census.sql` (one grid). After approval and deploy: as admin, check `/admin/permissions` shows the stored values and a toggle survives a reload; if a moderator account exists, check a granted capability appears for it. Exact steps: 871 kickoff §13.3. |
| **O80-5** | Task 881, after its executor reports: BEFORE audit + probe, guard selftest (must error), apply the least-privilege SQL, AFTER audit + probe, then the signed-in bell / mark-as-read / live-update checks. Exact block: 881 kickoff §13.3. |

## Explicitly not in this sprint

- **Fixing `SECURITY DEFINER` functions that `anon` can execute.** 870's audit **lists** them (check A6), so none is
  missed. Each fix needs its own caller trace and an Acknowledged-Exceptions decision, and on 2026-09-23 that set was
  **UNKNOWN**. Opus files numbered tasks from the A6 grid at 870's review.
- **Least-privilege on tables the app actually uses** (`users`, `listings`, `favorites`, …). Their blanket `anon`
  DML grants are predicate-neutralised: Task 865's 2026-09-21 scan found exactly one open write predicate,
  `listing_views`. Narrowing them needs a per-table consumer/role matrix. That is a candidate for a later task and
  becomes one when the owner schedules it.
- **`listing_views`** — Task 865 owns it (owner scope lock 2026-09-21).
- **`pages`** — Task 867 owns it (its §16.7 SQL).
- **Dropping the fifteen tables with no consumer.** That loses data. 870 only revokes access.

## Exit criteria

1. The AFTER grid of `scripts/task-870-privilege-audit.sql` (O80-2) reads `0` on the COUNT rows of A1 (view write
   grants), A3 (RLS-disabled reachable tables), A4 (service-only or no-consumer tables reachable by
   `anon`/`authenticated`) and A7 (`anon`/`authenticated` entries in `postgres`'s default ACL).
2. The anon probe's AFTER run gets `42501` (or HTTP 401/403 carrying it) on every table in 870's revoke set and on
   `public_user_profiles`. The BEFORE run, taken by the executor, gets `200` on the revoked tables. That pair is the
   two-armed proof that the **grant**, not RLS, now refuses the request.
3. `npm run test:auth` and `npm run test:admin` pass. `npm run build` exits 0. O80-3's three manual checks come back
   unchanged.
4. `docs/rls-rules.md` forbids view DML grants in the rule text and carries the audit as the post-migration check.
5. **871** has an owner-decided fix route, or has been moved to another sprint by the owner.
