# Epic II — Task 318 kickoff — Notification locale-binding audit (audit / spec only — NO code)

> **You are Claude Code Sonnet 4.6 in `lero-al`. Read `docs/agent-contract.md` (clauses 1–14) FIRST.** Conforms to the
> current P0 contract. **AUDIT / DOCS ONLY: one new governance report + a one-line pointer in `docs/i18n-rules.md`.
> ZERO production code changes — `git diff --stat src` MUST be empty.** This task DIAGNOSES the wrong-locale
> notification bug; the FIX is Task 319 (Phase 2) and is explicitly out of scope here.
> **Refreshed 2026-06-13 to clauses 1–14 and the actual notification-code analysis** (replaces the earlier 1–13 draft /
> the Sprint 24 re-issue). Epic II Phase 1, final slice. Depends on Task 316 (`65a97a8cc`) + Task 317 (committed) — both shipped.

```
Type:        chore (governance audit / spec)
Priority:    high (Epic II Phase 1 — surfaces the live "Скарга на ваш аккаунт" Ukrainian-in-sq notification bug)
Area:        docs/governance-reports/2026-06-13-notification-locale-audit.md (NEW) +
             docs/i18n-rules.md (one-line cross-reference pointer only)
Output:      a per-producer locale-binding map for every in-app notification path, a render-layer localisation map,
             a named root-cause for the wrong-locale bug, and concrete fix recommendations that seed Task 319.
             DIAGNOSIS ONLY — changes no runtime behaviour, fills no key, edits no producer.
```

## Why this task exists (the live bug)

On an `sq`-locale session, a notification popup rendered Ukrainian text — "Скарга на ваш аккаунт…" ("Complaint
about your account…"). Notifications are not reliably locale-bound to the **recipient**. This audit must locate
**exactly where** each notification's display text gets its locale, and name the precise mechanism that let a
non-`sq` string reach an `sq` recipient. The audit's output is the spec Task 319 implements against.

## The binding model you are auditing (orchestrator's pre-analysis — VERIFY, do not assume)

The orchestrator's read of the code (confirm every line yourself; correct the report if reality differs):

- **Storage:** `createNotification({ userId, type, title, body, link })` in
  `src/modules/notifications/lib/mutations.ts` inserts `title` and `body` into the `notifications` table **as
  pre-rendered plain strings**. There is no `locale` column and no key+params storage. **Therefore the display
  locale of most notifications is bound at CREATION time, by whatever locale the producer used to build those
  strings.**
- **Render layer:** `src/modules/notifications/components/NotificationItem.tsx` renders `notification.title` and
  `notification.body` **verbatim**, with TWO exceptions that are re-localised at render time in the viewer's
  active locale:
  - `listing_status_change` → `resolveStatusBody()` re-localises JSON `{from,to}` status codes (the correct,
    locale-safe pattern — body stores *codes*, not prose);
  - `saved_search_match` → `t('saved_search_match_body', { count })` (body stores a *count*, not prose).
  Every OTHER type (`new_message`, `support_reply`, `report_outcome`, `listing_expires_soon`, `agent_verified`,
  `marketing`, `price_change`) renders the **raw stored string** → its locale is frozen at creation.
- **Recipient locale source:** `src/modules/notifications/lib/emails/resolveUserLocale.ts` reads
  `users.preferred_locale` (fallback chain → `requestLocale` → `'sq'`). It is `@deprecated` for *email* (Albanian-only
  outbound policy, Epic GG) but its docstring states two consumers remain in `admin/actions/index.ts` for **in-app
  notification locale**. So SOME producers localise to the recipient; others may not. **Mapping this per-producer is
  the core of the audit.**

## The producers to enumerate (confirm completeness with `grep -rn "createNotification(" src`)

The orchestrator found these seven call sites — your audit MUST cover every one, AND prove (via the grep) that the
list is complete (e.g. the `inactivity` cron almost certainly adds one more — enumerate it):

| # | File:line | `type` | Recipient (`userId`) | How title/body are built (← the question to answer) |
|---|---|---|---|---|
| 1 | `src/modules/admin/actions/index.ts:835` | `support_reply` | `reportedUserId` | `s.created_title` / `s.created_body` — **where is `s` localised, to whose locale?** |
| 2 | `src/modules/admin/actions/index.ts:898` | `report_outcome` | `ticket.reported_user_id` | `s.resolved_title`/`s.closed_*` — **prime suspect for the live bug** |
| 3 | `src/app/api/cron/saved-searches/route.ts:135` | `saved_search_match` | `search.user_id` | `s.title(name)` raw / body=count (re-localised at render) |
| 4 | `src/app/api/cron/price-alerts/route.ts:156` | `price_change` | `fav.user_id` | `s.title()`/`s.body()` raw — **cron context: no request locale — what locale?** |
| 5 | `src/modules/listings/actions/reportListing.ts:160` | `report_outcome` | `reporterUserId` | `s.heading` / `s.body` raw |
| 6 | `src/modules/listings/actions/applyListingTransition.ts:114` | `listing_status_change` | `ownerId` | body = JSON status codes (correct render-time pattern — the reference example) |
| 7 | `src/app/api/cron/inactivity/route.ts` (enumerate exact line) | (confirm) | (confirm) | (confirm `s` locale source) |

For EACH producer, the report must record, in a table: **(a)** the actor/trigger context (admin action / cron / user
action / auth), **(b)** whether a request locale even exists in that context, **(c)** where the `s` strings come from
(inline literal? a `getTranslations({ locale })` call? a hand-rolled per-locale object? `resolveUserLocale(recipient)`?),
**(d)** WHOSE locale that resolves to — **actor's, recipient's (`preferred_locale`), a hardcoded default, or a
fallback** — and **(e)** verdict: `RECIPIENT-CORRECT` / `WRONG-LOCALE-RISK` / `RENDER-TIME-SAFE` / `UNRESOLVED — STOP&ASK`.

## Pre-read (mandatory — do NOT "read all docs"; rule-index: Email/auth-lifecycle + DB/server-action, audit-only)

1. **Always:** `docs/agent-contract.md` (clauses **1–14**) · `docs/backlog.md`.
2. `tasks/Epics/Epic_II_Global_i18n_Hardening.md` — Phase 1 Task 318 definition + Phase 2 Task 319 scope (so your fix
   recommendations land in 319's lane, not this task's).
3. `docs/i18n-rules.md` — canonical i18n rules (the Epic's home doc; your one-line pointer lands here).
4. `docs/integrations.md` → "Outbound email language policy" — the Albanian-only email policy (Epic GG) that
   `resolveUserLocale` is deprecated against. **In-app notification locale is a SEPARATE concern from outbound email
   language — do not conflate them in the report.**
5. `docs/domain-rules.md` (notification types / roles) + `docs/data-access-rules.md` (how `notifications` rows are
   created/queried) + `docs/rls-rules.md` (recipient scoping — `createNotification` uses the service-role admin client,
   reads are RLS-owner-scoped). Read only the notification-relevant sections.
6. **Source files to read in full (this is an audit — read, do not edit):**
   `src/modules/notifications/lib/mutations.ts`, `src/modules/notifications/components/NotificationItem.tsx`,
   `src/modules/notifications/lib/emails/resolveUserLocale.ts`, and **every** `createNotification(...)` call site +
   the definition of each producer's `s` strings object. Also `src/types/database.ts` for the `notifications` row +
   `NotificationType` union + whether a recipient-locale column exists.

## Scope decisions (DECIDED by the orchestrator — do NOT re-invent; if blocking, STOP & ASK)

1. **Audit/spec ONLY. No production code changes whatsoever** — no producer edit, no new DB column, no key added, no
   render change. `git diff --stat src` MUST be empty. Any actual fix is Task 319.
2. **Deliverable = ONE new report** at `docs/governance-reports/2026-06-13-notification-locale-audit.md` (mirror the
   structure/section conventions of `docs/governance-reports/2026-06-13-i18n-dynamic-key-audit.md` — Task 316). Plus a
   **one-line pointer** added to `docs/i18n-rules.md` (a "Notification locale binding" cross-reference to the report) —
   do NOT duplicate the report body into the rules doc.
3. **The report MUST name the root cause of the live "Скарга на ваш аккаунт" bug** to a specific producer + locale-source
   line (most likely #2 `report_outcome` in `admin/actions/index.ts`, or a cron path with no recipient-locale binding).
   If the evidence is ambiguous between two producers, list both as candidates with the disqualifying/confirming
   evidence for each — do NOT guess a single culprit without proof.
4. **Fix recommendations are RECOMMENDATIONS, scoped to Task 319** — e.g. "store key+params not prose", or "localise `s`
   via `resolveUserLocale(recipientUserId)` at creation", or "add a render-time re-localisation path per type". Present
   the trade-offs (creation-time vs render-time binding; DB migration vs none; legacy already-stored rows). Do NOT pick
   and implement one — that decision + implementation is Task 319, owner-gated. Any proposed SQL (e.g. a recipient-locale
   column) is written into the report as a PROPOSAL only — never executed.
5. **Legacy already-stored rows** (notifications already written in the wrong locale) must be called out as a distinct
   concern with a recommendation (backfill? accept? render-time override?) — again recommendation-only.
6. **If any producer's locale source is genuinely unresolvable from the code** (e.g. `s` comes from data you cannot
   trace statically), mark that row `UNRESOLVED — STOP&ASK` in the report and raise it in the session log rather than
   inventing an answer.

## Positive flow (happy path — what a COMPLETE audit deliverable contains)

- **Actor:** Sonnet performs a static read-only audit of the notification subsystem on the current `main` tree.
- **Preconditions:** Tasks 316/317 shipped; no notification code has changed since.
- **Ordered steps & outputs:**
  1. `grep -rn "createNotification(" src` → enumerate ALL producers; confirm the 7 above + any missed (inactivity cron).
  2. For each producer, trace the `s` strings object to its locale source; fill the per-producer table columns (a)–(e).
  3. Map the render layer (`NotificationItem.tsx`): per `NotificationType`, mark `render-time re-localised` vs
     `renders raw stored string`. Cross this against the producer table.
  4. Identify and NAME the root cause of the live `sq`-recipient-sees-`uk` bug, with the file:line of the offending
     locale source and an explanation of why it produced `uk`/non-recipient text.
  5. Write `docs/governance-reports/2026-06-13-notification-locale-audit.md`: §1 binding model, §2 per-producer map
     (the table), §3 render-layer map, §4 root-cause of the live bug, §5 fix recommendations for Task 319 (with
     trade-offs), §6 legacy-rows concern, §7 Task 319 hand-off checklist.
  6. Add the one-line pointer to `docs/i18n-rules.md`.
- **Success state:** report exists, every producer row has a verdict, the live bug has a named root cause with
  file:line evidence, recommendations are concrete and scoped to 319. `git diff --stat src` empty.
- **Post-conditions:** `docs/backlog.md` updated (Last Session + Epic II queue → Task 319 next), session log under
  `docs/sessions/` with a "Files Changed" table; NO git run by the executor.

## Negative flow (failure modes the AUDIT MUST trace + the audit's own edge handling)

Each of these is a locale-binding failure scenario the report MUST explicitly address (this is the "negative flow"
for an audit — the off-happy-path branches the diagnosis must not skip):

- **Actor-locale-instead-of-recipient:** producer builds `s` in the acting admin's / triggering user's locale →
  recipient sees the wrong language. (Suspected live-bug mechanism.) Document which producers are at risk.
- **No request locale (cron/system context):** `price-alerts`, `saved-searches`, `inactivity` run with no incoming
  locale — what do they default to? If a hardcoded/module-default non-`sq` locale, that is a wrong-locale source.
- **Recipient has no `preferred_locale`:** fallback chain resolves to `'sq'` — is that correct for a uk/en/it user?
  Document the fallback's correctness per path.
- **Type renders raw vs re-localised:** confirm exactly which `NotificationType`s are frozen-at-creation (raw) vs
  re-localised at render; a type that *should* be render-safe but stores prose is a finding.
- **Marketing / broadcast to many recipients of mixed locales:** one stored string cannot be correct for all — call out.
- **Legacy rows already stored wrong:** existing DB rows in the wrong locale won't be fixed by a creation-time change.
- **Audit's own edge handling:** if `grep` finds a producer not in the table → add it; if a locale source is
  untraceable → mark `UNRESOLVED — STOP&ASK` (do not guess); if reality contradicts the orchestrator's pre-analysis
  above → correct it in the report and note the discrepancy in the session log.

## Acceptance criteria (each maps to a flow above)

- `docs/governance-reports/2026-06-13-notification-locale-audit.md` exists with §1–§7 as above; **every** `createNotification`
  producer (proven complete via the pasted `grep -rn` output) appears in the §2 table with columns (a)–(e) filled and a
  verdict. (Positive flow steps 1–5.)
- The §3 render-layer map states, per `NotificationType`, raw-vs-re-localised, consistent with `NotificationItem.tsx`.
- §4 names the live-bug root cause to a specific file:line locale source (or two evidenced candidates) — not a vague
  "notifications aren't localised". (Negative flow: actor-locale / no-request-locale branches.)
- §5 fix recommendations are concrete, scoped to **Task 319**, with trade-offs; §6 addresses legacy rows; §7 is a
  Task 319 hand-off checklist. **No fix is implemented here.**
- **`docs/i18n-rules.md`** gains exactly one cross-reference line to the report (no duplicated body).
- **No production code changes — `git diff --stat src` empty** (paste the empty result in the session log). Only
  `docs/governance-reports/**` + `docs/i18n-rules.md` + `docs/backlog.md` + `docs/sessions/**` change.
- **Clause 11/12/13 N/A** (no UI rendered, no story, no breakpoint) — state explicitly in the session log; the mobile
  <640 full-width gate and the breakpoint × locale render matrix do not apply.
- **Clause 14 (file-integrity):** after writing each file, read it back; before claiming complete, paste the GREEN
  integrity transcript for every touched file — `tr -cd '\000' < f | wc -c` = 0, no BOM, and re-read the tail to prove
  it is not truncated mid-section. A claimed-complete report contradicted by a truncated/NUL file = TASK FAILURE.
- `docs/backlog.md` + a session log under `docs/sessions/` updated; **"Files Changed" table present** (one row per
  touched path + rationale); **executor emits NO git** (orchestrator commits on review).

## Out of scope

- **Any fix** — localising producers, adding a recipient-locale binding, a DB migration, a render-time re-localisation
  path, or backfilling legacy rows. All of that is **Task 319** (Phase 2), owner-gated, kickoff written only after this
  audit is reviewed.
- Filling missing dynamic keys (Task 320) and email-template i18n (Task 321) and toast/modal i18n (Task 322).
- Changing the Albanian-only **outbound email** policy (Epic GG — unrelated to in-app notification locale).
- Any change to `messages/{sq,en,uk,it}.json` (no key add/edit — this is diagnosis only).
- CI wiring (Task 323).
