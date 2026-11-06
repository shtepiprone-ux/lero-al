# Epic II — Task 319 kickoff — Notification locale-binding fix (Model C: template-ID + typed params, render-time localisation)

> **You are Claude Code Sonnet 4.6 in `lero-al`. Read `docs/agent-contract.md` (clauses 1–14) FIRST.** Conforms to the
> current P0 contract. This is a **product-code task** (DB migration + server actions + render layer + locale files) —
> NOT docs-only. **The orchestrator (Opus) emits all `git add`/`git commit` commands at review; you NEVER run git.**
> **Depends on Task 318 audit** (`docs/governance-reports/2026-06-13-notification-locale-audit.md`) and the Task 317/423
> dynamic-key scanner (`scripts/check-i18n-dynamic.mjs` + manifest). **Owner decisions are recorded in "Owner decisions
> (LOCKED)" below — do NOT re-open them; if anything else is ambiguous, STOP & ASK the orchestrator.**

```
Type:        bug (systemic i18n locale-binding fix) — Epic II Phase 2
Priority:    high (live wrong-locale bug: "Скарга на ваш акаунт" renders inside an sq UI)
Area:        notifications storage + render + producers
             - supabase/migrations/<new>_notifications_template_columns.sql (NEW)
             - src/types/database.ts (Notification interface)
             - src/modules/notifications/lib/mutations.ts (createNotification signature)
             - src/modules/notifications/components/NotificationItem.tsx (render layer)
             - src/modules/admin/actions/index.ts (producers #1 createSupportTicket, #2 updateTicketStatus)
             - src/app/api/cron/saved-searches/route.ts (producer #3)
             - src/app/api/cron/price-alerts/route.ts (producer #4)
             - src/modules/listings/actions/reportListing.ts (producer #5)
             - messages/{sq,en,uk,it}.json (notifications.* namespace)
             - scripts/i18n-dynamic-manifest.json (register the new dynamic template keys)
Output:      All NEW notifications are stored as a canonical template ID + small typed params and localised at RENDER
             time in the VIEWER's current locale. Legacy rows keep rendering via graceful verbatim fallback. The live
             wrong-locale bug class is eliminated for all new notifications.
```

---

## Goal (concrete)

Today every prose-producing notification bakes its display locale into `notifications.title`/`body` **at creation time**
(from a frequently-drifting `users.preferred_locale` snapshot, or a hardcoded `'sq'` copied off the EMAIL policy), and
`NotificationItem.tsx` renders that frozen string **verbatim** — so a string written while the recipient was momentarily
on `uk` shows **uk text inside an otherwise-`sq` UI** forever (Task 318 §4, root cause named to
`src/modules/admin/actions/index.ts:728` `SUPPORT_NOTIFY_STRINGS.uk.created_title` via producer #1 `createSupportTicket`).

Task 319 changes the storage + render model so notification copy is **never** frozen at creation: producers store a
**template ID + typed params**, and the renderer resolves them with `useTranslations('notifications')` in the **viewer's
`useLocale()`** — generalising the already-correct, owner-endorsed `listing_status_change` pattern (Task 318 producer #6,
the only `RENDER-TIME-SAFE` row) to every prose producer.

---

## Owner decisions (LOCKED — do NOT re-open; from the AskUserQuestion gate on this kickoff, 2026-06-13)

1. **Storage model = Model C (template-ID + small typed params hybrid).** Do NOT implement Model B (prose +
   `notification_locale` column). Do NOT force full key+params onto freeform/marketing/legacy content — only the **system
   notifications** that today produce prose from a small enumerable string set (producers #1–#5) are migrated. System
   notifications must become render-time localised from **canonical template IDs + small typed params**.
2. **Legacy rows = graceful compatibility fallback ONLY. NO bulk backfill / no mutation of existing notification rows in
   Task 319.** If a row has no `template_id`, the renderer shows its stored `title`/`body` exactly as today. Any future
   backfill is a SEPARATE owner-approved task after 319 proves the new model. Do NOT attempt prose→template reverse-lookup.
3. **Price formatting: fold into 319 ONLY for the notification path.** `price_change` (producer #4) must STOP storing
   preformatted, locale-bound price prose and instead store **numeric params** `{ oldPrice, newPrice, currency,
   listingName | listingId }`; final price formatting happens at **render time in the viewer's locale**. Do NOT expand
   this into any site-wide price-formatting cleanup — `fmtPrice`/`.toLocaleString('en')` elsewhere is out of scope.

---

## Architecture decisions (DECIDED by the orchestrator — do NOT re-invent; if any is blocking, STOP & ASK)

1. **New nullable columns on `notifications`** (migration): `template_id text NULL` and `template_params jsonb NULL`.
   Both nullable so **every existing row stays valid with `NULL`** (legacy fallback, decision 2). Keep `title text` and
   `body text` columns — they are now the **sq safety-fallback** (see decision 3) and the legacy render path.
2. **Belt-and-suspenders: new rows ALSO write an sq rendering into `title`/`body`.** Every migrated producer, in addition
   to `template_id` + `template_params`, writes the **`sq`** rendering of that template into `title`/`body`. Rationale:
   if the renderer ever fails to resolve a template (missing key, params shape drift, a non-template-aware consumer), the
   worst case degrades to **Albanian (the canonical base locale)** — NEVER to a wrong non-sq locale. This directly
   guarantees the reported bug ("uk text in an sq UI") cannot recur even on a resolution miss. Producers already hold the
   4-locale string tables, so picking `sq` for the fallback is free.
3. **Render precedence in `NotificationItem.tsx`:** if `notification.template_id` is present → resolve
   `t(<template_id>, <params>)` for title and (where applicable) body in the viewer's `useLocale()`. If `template_id` is
   `NULL` (legacy) → keep the EXACT current behavior: the `saved_search_match` count special-case, the
   `listing_status_change` `resolveStatusBody()` special-case, otherwise verbatim `title`/`body`. **Do not remove or alter
   the two existing render-time special-cases** — `listing_status_change` (producer #6) and `saved_search_match` body —
   they stay as the reference pattern; new `saved_search_match` rows additionally carry a `template_id` for the title.
4. **Template namespace = `notifications.*` in `messages/{sq,en,uk,it}.json`.** Promote the inline 4-locale string tables
   (`SUPPORT_NOTIFY_STRINGS` in `admin/actions/index.ts:710-743`, the `NOTIF` objects in the two cron routes, and the
   in-app subset of `getReporterNotificationEmailStrings` in `reportListing.ts`) into this namespace with **full sq/en/uk/it
   parity (clause 7)**. Use ICU params for interpolation (`{searchName}`, `{listingName}`, `{oldPrice}`, `{newPrice}`,
   `{currency}`, `{count}`). After promotion, the inline objects used for the NOTIFICATION path are deleted; **the EMAIL
   path keeps its own `sq` strings unchanged** (decision below).
5. **Canonical template IDs (derive exact key set from the source tables; this is the required mapping):**
   - Producer #1 `createSupportTicket` (`support_reply`): `support_created` (no params).
   - Producer #2 `updateTicketStatus` (`report_outcome`): `support_resolved`, `support_closed` (no params) — it only ever
     selects `resolved_*`/`closed_*` (Task 318 §4).
   - Producer #3 `cron/saved-searches` (`saved_search_match`): title → `saved_search_match_title` with `{searchName}`;
     body → keep the existing render-time `saved_search_match_body` `{count}` path (already locale-safe). The new row
     stores `template_id='saved_search_match'`, `template_params={ searchName, count }`.
   - Producer #4 `cron/price-alerts` (`price_change`): `price_change` with params `{ oldPrice:number, newPrice:number,
     currency:string, listingName?:string, listingId:string }`. Title + body both resolved at render; price numbers
     formatted with `Intl.NumberFormat(viewerLocale)` (decision 3 of Owner decisions).
   - Producer #5 `reportListing.notifyReporter` (`report_outcome`): `report_resolved`, `report_dismissed` (status-based,
     no free params).
   - Producer #6 `applyListingTransition` (`listing_status_change`): **UNCHANGED** — it already stores status codes + a
     proper-noun title and localises at render. Do not touch it beyond confirming the new render precedence (decision 3)
     leaves its `resolveStatusBody()` path intact.
6. **Separate `emailLocale` from `notificationLocale` (Task 318 §5.2).** In producers #3/#4/#5 the single
   `const locale = 'sq'` currently feeds BOTH the email and the in-app notification. Split them: keep
   `const emailLocale = 'sq'` (Albanian-only outbound policy — Epic GG / `docs/integrations.md`, UNCHANGED) for the
   `sendEmail()` calls, and remove the in-app notification's dependence on a baked locale entirely (it now uses
   `template_id` + params, localised at render). Producers #1/#2 stop calling `resolveUserLocale(...)` for the in-app
   string (the snapshot is the root cause) — they pass `template_id` + the sq-fallback prose instead.
7. **`createNotification` signature change** (`mutations.ts`): extend to
   `createNotification({ userId, type, title, body, link?, templateId?, templateParams? })`, inserting `template_id` and
   `template_params` alongside the existing columns. `title`/`body` remain **required** (they carry the sq fallback for
   new rows, decision 2). Existing call sites that do not pass `templateId` continue to work unchanged (legacy-compatible
   signature). This is the ONLY change to the function body.
8. **Register the new dynamic keys in `scripts/i18n-dynamic-manifest.json`** (Task 317/423) so `npm run check:i18n-dynamic`
   guards the new `notifications.*` template keys' 4-locale parity. Follow the existing manifest entry shape
   (`{ id, site, namespace, keys, note? }`). Do NOT modify the scanner script itself.
9. **RLS / write path unchanged.** `createNotification` keeps using the service-role admin client (system-only write,
   RLS-bypass on write, owner-scoped reads) — see `docs/rls-rules.md`. The new columns inherit the existing
   `notifications` RLS. No policy change. If you believe a policy change is needed, STOP & ASK.

---

## Pre-read (mandatory — do NOT "read all docs")

1. **Always:** `docs/agent-contract.md` (clauses **1–14**) · `docs/backlog.md`.
2. **The authoritative source:** `docs/governance-reports/2026-06-13-notification-locale-audit.md` (Task 318). Its **§2**
   (per-producer map), **§3** (render-layer map), **§4** (named root cause), **§5–§7** (fix options + hand-off checklist).
3. **Schema / migration + DB:** `docs/data-access-rules.md` · `docs/rls-rules.md` · `docs/domain-rules.md` ·
   `docs/qa-rules.md` · `docs/architecture.md` (notifications module boundary).
4. **i18n:** `docs/i18n-rules.md` (§8 notification cross-ref + the dynamic-key manifest rule from Task 317/423) +
   `docs/ai-behavior.md` → "Localization (i18n) Rules".
5. **Email policy (do not regress):** `docs/integrations.md` → "Outbound email language policy" (sq-only, Epic GG).
6. **UI render-layer (NotificationItem):** `docs/ui-rules.md` · `docs/component-rules.md`.
7. **Existing conventions to MATCH:** the `listing_status_change` / `resolveStatusBody()` render-time pattern in
   `NotificationItem.tsx` (the reference); an existing `supabase/migrations/*.sql` file for the migration style.
8. Inspect `package.json` for current validation scripts (`tsc`, `lint`, `check:i18n`, `check:i18n-dynamic`).

## Current behavior to preserve

- **Affected surfaces:** the notification bell dropdown/sheet that renders `NotificationItem` (header + any mobile
  notification sheet); the 5 producer server actions / cron routes listed in "Area".
- **Existing controls (NotificationItem):** click-to-read (`handleClick` → `markNotificationRead`), keyboard
  Enter/Space activation, unread dot + `aria-label`, optional `<a href={link}>` wrapper, relative-time via date-fns in
  the viewer locale, type icon. **ALL must remain** — this task changes only the title/body *text resolution*, not the
  item's structure, controls, or layout (clause 3 / Note 20).
- **Existing render-time special-cases:** `saved_search_match` body (`t('saved_search_match_body', {count})`) and
  `listing_status_change` (`resolveStatusBody()` with NEW-JSON + LEGACY-string parsing). Both MUST keep working for
  legacy rows AND new rows (decision 3).
- **Existing email behavior:** producers #3/#4/#5 send sq emails via `sendEmail()`. This is UNCHANGED — only the in-app
  notification locale binding changes (decision 6).
- **Existing mobile behavior (320px in uk):** the notification item text wraps within the bell popup; no horizontal
  scroll. Preserve — and verify (this is the whole point: uk text must render correctly in the viewer locale).

Any existing control must remain, move to a named new place, or be explicitly listed as removed with authorisation.
Silent removal is forbidden (Note 20). **This task removes NO controls.**

---

## Positive flow (happy path)

**Flow A — admin opens a user_complaint ticket (the live-bug path, producer #1):**
- **Actor / preconditions:** an admin opens a `user_complaint` support ticket against user U (`createSupportTicket`,
  `/admin/support`). U previously clicked the 🇺🇦 flag at some point (so `preferred_locale='uk'`), but is currently
  browsing in `sq`.
1. `createSupportTicket` succeeds; instead of `resolveUserLocale(U)` + baking uk prose, it calls
   `createNotification({ userId:U, type:'support_reply', templateId:'support_created', templateParams:{}, title:<sq
   created_title>, body:<sq created_body> })`.
2. **System:** row inserted with `template_id='support_created'`, `template_params='{}'`, `title`/`body` = the **sq**
   strings.
3. U opens the bell while browsing in `sq` → `NotificationItem` sees `template_id`, renders
   `t('support_created')` in `sq` → **"Ankesë për llogarinë tuaj"**. U switches to `en` → same row now renders the `en`
   string at render time; switches to `uk` → uk string. **No wrong-locale, ever.**
4. **Success state:** the notification reads in the viewer's CURRENT locale on every view; click marks read; unread dot
   clears; `link` (if any) navigates.
5. **Post-conditions:** DB row carries `template_id`+`params`+sq fallback; no email change; bell badge count updates as
   today.

**Flow B — cron price alert (producer #4, price params):**
1. Cron finds a price drop on listing L for favouriting user F.
2. `createNotification({ userId:F, type:'price_change', templateId:'price_change', templateParams:{ oldPrice, newPrice,
   currency, listingName, listingId }, title:<sq price_change title>, body:<sq price_change body> })`; the EMAIL still
   sends in `sq` via `emailLocale='sq'`.
3. F opens the bell in `it` → title/body render via `t('price_change', {...})` in `it`, prices formatted with
   `Intl.NumberFormat('it', { style:'currency'|'decimal', currency })` (viewer locale).
4. **Success state:** correct it copy + it-formatted prices; click/link/read all work.

**Flows C–E (producers #2 `support_resolved`/`support_closed`, #3 `saved_search_match` title, #5
`report_resolved`/`report_dismissed`):** same shape — store template ID (+ params where listed in decision 5) + sq
fallback; render in viewer locale. Producer #6 (`listing_status_change`) is unchanged and continues via
`resolveStatusBody()`.

## Negative flow (every off-happy-path branch — implement ALL)

- **Legacy row (no `template_id`):** renderer detects `template_id == null` → falls back to current behavior verbatim
  (incl. the two special-cases). Existing uk-in-sq legacy rows still show their frozen prose (accepted, documented —
  decision 2); they are **not** mutated. **Verifiable:** the `template_id ? … : <legacy branch>` conditional in
  `NotificationItem.tsx`.
- **Unknown / missing template key at render:** if `t(template_id)` would miss (key absent in a locale), the renderer
  MUST NOT throw a `MISSING_MESSAGE` to the user. Guard: fall back to the stored `title`/`body` (the sq safety string).
  Use next-intl's safe pattern (e.g. check existence / `t.has(...)` or a try/catch wrapper) → never render a raw key.
  **Verifiable:** the fallback branch + a planted-missing-key test note in the session log.
- **Malformed / missing `template_params`:** e.g. `price_change` row with absent `newPrice`, or `saved_search_match`
  with no `searchName` → render with a safe substitution (omit/`listingId` instead of `listingName`; skip price line
  rather than render `NaN`/`undefined`). **Verifiable:** param-guard in the render path.
- **`createNotification` insert error:** unchanged behavior — `console.error`, no throw; producers keep their existing
  `try/catch` so a notification failure never breaks ticket creation / cron / report resolution. **Verifiable:** the
  preserved `if (error) console.error(...)` and producer-side `catch`.
- **Locale switch after creation:** the ENTIRE fix — re-render uses `useLocale()` each time, so switching sq↔en↔uk↔it
  re-localises new rows live. **Verifiable:** runtime locale-switch step in the matrix.
- **Email path unaffected:** confirm `sendEmail(...)` still receives `emailLocale='sq'` in #3/#4/#5 (no regression to
  Epic GG). **Verifiable:** the split `emailLocale`/`notificationLocale` in the diff.
- **`saved_search_match` / `listing_status_change` legacy special-cases:** both still resolve at render for legacy rows.
  **Verifiable:** the special-case branches remain reachable in the `template_id == null` path.
- **Migration on existing data:** new columns are nullable with no default backfill → existing rows are unaffected and
  remain valid; the migration is reversible (down migration drops the two columns). **Verifiable:** the migration file.
- **Double-submit / re-entry (admin clicks "create ticket" twice):** unchanged from today — out of scope to add new
  guards; do NOT regress existing behavior.

---

## Acceptance criteria (each maps to a flow / decision above)

- **Migration** `supabase/migrations/<ts>_notifications_template_columns.sql` adds `template_id text NULL` +
  `template_params jsonb NULL` to `notifications`, reversible; existing rows valid with `NULL` (Negative: migration). The
  `Notification` interface in `src/types/database.ts:421-430` gains `template_id: string | null` and
  `template_params: Record<string, unknown> | null` (or a typed shape).
- **`createNotification`** accepts optional `templateId`/`templateParams` and inserts them; `title`/`body` still required
  (sq fallback); existing call sites without the new args still compile and run (decision 7).
- **Producers #1–#5** store `template_id` (+ params per decision 5) **and** the **sq** rendering in `title`/`body`; they
  no longer bind in-app copy to `resolveUserLocale`/`preferred_locale` (#1/#2) or to a notification `'sq'` reused from the
  email policy (#3/#4/#5). `emailLocale='sq'` preserved for `sendEmail` (Positive A/B + Negative email). Producer #6
  unchanged.
- **`price_change`** stores numeric `{ oldPrice, newPrice, currency, listingName?, listingId }`; render formats prices via
  `Intl.NumberFormat(viewerLocale)`; no preformatted price prose stored (Owner decision 3 + Positive B).
- **`NotificationItem.tsx`** render precedence implemented (decision 3): `template_id` → `t(template_id, params)` in
  `useLocale()`; else legacy verbatim + the two existing special-cases preserved. Missing-key + missing-param guards
  present (Negative). All existing controls/states preserved (Note 20 before/after inventory in the session log).
- **`messages/{sq,en,uk,it}.json`** contain the full `notifications.*` template key set with **4-locale parity** (clause
  7) and ICU params; inline NOTIFICATION string tables removed from the 5 producers (email sq strings kept). New keys
  registered in `scripts/i18n-dynamic-manifest.json`; `npm run check:i18n` and `npm run check:i18n-dynamic` exit 0.
- **Clause 11/12 — Mobile <640 full-width gate + rendered matrix:** see the dedicated section below. The session log MUST
  include the rendered breakpoints × sq/en/uk/it matrix for the notification item, with **uk@320/375/390 mandatory**.
- **Clause 9 / 14:** `npx tsc --noEmit` → 0 errors; `npm run build` passes (non-trivial); AC-by-AC self-audit table +
  final "Self-validation:" line; after writing each file, read it back; paste the GREEN file-integrity transcript for
  every touched file (`tr -cd '\000' < f | wc -c`=0, no BOM, `node --check`/`tsc`, `JSON.parse` on each `.json` + the
  migration sanity).
- **Clause 10:** `docs/backlog.md` updated; session log under `docs/sessions/` with a **"Files Changed" table**; executor
  emits **NO** git (orchestrator commits at review).
- Existing working controls/flows preserved unless explicitly removed by this kickoff (this kickoff removes none).

## Mobile <640 full-width gate (OWNER P0 — clause 11/12) — MANDATORY

- **In-scope surface:** `NotificationItem` as rendered inside the notification bell dropdown/sheet. This task changes
  **text resolution only** — it introduces **no** new container, button, dialog, sheet, select, or popover, and must NOT
  alter the existing notification popup's mobile treatment.
- **Required after-behavior at `max-sm` (<640):** every notification item's title/body text **wraps** (`whitespace-normal
  break-words`, no clip, no truncation that hides meaning beyond the existing `line-clamp-2` on the body), with **no
  horizontal scroll at 320px** in any of sq/en/uk/it. uk and it strings are the longest — they MUST wrap cleanly.
- **The popup container's full-width bottom-sheet behavior at <640 is owned by the bell/sheet component, NOT this task.**
  Do NOT change it; just verify it is not regressed. If you find the notification popup is NOT already a full-width
  bottom sheet at <640 (i.e. it would need new full-width work), **STOP & ASK** — do not silently expand scope here.
- **No new interactive controls** are added, so the `max-sm:w-full` button/control rule has nothing new to apply to;
  state this explicitly in the session log. Touch targets on the existing click area stay ≥44px.
- **Rendered proof (clause 12):** matrix rows = 320·375·390·768·1280·1440·2560 (uk@320/375/390 mandatory), columns =
  sq·en·uk·it, each cell = real evidence (text wraps? no clip? no h-scroll? correct locale rendered after switch?). A
  log with only tsc/build green = INCOMPLETE → the orchestrator will route it back.

## Required investigation

1. Read Task 318 audit §2/§3/§4 — confirm the 5 producer call sites + the 2 render special-cases against current source.
2. Read `NotificationItem.tsx` `resolveStatusBody()` (lines 41-62) + the render conditional (lines 96-105) — this is the
   pattern to mirror for the new `template_id` precedence.
3. Read `SUPPORT_NOTIFY_STRINGS` (`admin/actions/index.ts:710-743`) + the two cron `NOTIF` objects + the in-app subset of
   `getReporterNotificationEmailStrings` (reportListing.ts) — these are the strings to promote into `notifications.*`.
4. Inspect an existing `supabase/migrations/*.sql` for the project's migration conventions (naming, `up`/`down`, RLS
   notes) before writing the new migration.
5. Confirm `scripts/i18n-dynamic-manifest.json` entry shape from a Task 317/423 entry before adding the new keys.

## Out of scope

- **Backfilling / mutating existing notification rows** (Owner decision 2) — legacy fallback only. A future
  owner-approved task may backfill; not here.
- **Model A (full key+params for every NotificationType)** and **Model B (prose + `notification_locale` column)** —
  explicitly rejected (Owner decision 1).
- **Producers with NO current call site** — `new_message`, `listing_expires_soon`, `agent_verified`, `marketing` (Task
  318 §3 "type exists, no producer"). Do NOT add producers for them. If one is added LATER it must follow this task's
  template-ID pattern (note only).
- **Producer #6 `listing_status_change`** — already render-safe; do NOT refactor it.
- **Any site-wide price-formatting / `fmtPrice` / `.toLocaleString` cleanup** outside the `price_change` notification
  path (Owner decision 3).
- **The outbound EMAIL language policy** (sq-only, Epic GG) — UNCHANGED; only the in-app notification locale binding moves.
- **The `check:i18n-dynamic` scanner script itself** (Task 317/423) — only ADD manifest entries; do not edit the script.
- **Notification bell / sheet container layout** — verify-only; STOP & ASK if it needs new full-width work (see gate).
- **Any `git add`/`git commit`** — executor never runs git; orchestrator emits commits at review (clause 10).
```
