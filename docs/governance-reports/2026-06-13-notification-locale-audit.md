# Notification Locale-Binding Audit — Task 318 (Epic II, Phase 1, final slice)

**Date:** 2026-06-13
**Type:** Audit / spec only — zero product-code changes. `git diff --stat src` empty (confirmed §8).
**Scope:** Every `createNotification(...)` call site in `src/`, the render layer
(`NotificationItem.tsx`), and the recipient-locale resolution helper
(`resolveUserLocale.ts`).
**Depends on:** Task 316 (`65a97a8cc`), Task 317 (committed).
**Feeds:** Task 319 (notification locale-binding fix, implementation, owner-gated).

This report **diagnoses** the live "Скарга на ваш акаунт…" wrong-locale notification bug. It
**fixes nothing** — all recommendations in §5 are scoped to Task 319.

---

## 1. The binding model (confirmed against source)

The orchestrator's pre-analysis is **confirmed correct** in all particulars:

- **Storage (`src/modules/notifications/lib/mutations.ts:9-33`):**
  `createNotification({ userId, type, title, body, link })` inserts `title` and `body` into the
  `notifications` table **as pre-rendered plain strings**, via the service-role admin client
  (bypasses RLS — write path is system-only; reads are RLS-owner-scoped, per
  `docs/rls-rules.md:307`). The `notifications` row type
  (`src/types/database.ts:420-430`) has **no `locale` column** and **no key+params columns** —
  only `type`, `title: string`, `body: string`, `link`, `is_read`, `created_at`.
  **⇒ The display locale of most notification types is bound at CREATION time, baked into the
  stored `title`/`body` strings, and can never be changed or re-derived afterward.**

- **Render layer (`src/modules/notifications/components/NotificationItem.tsx`):** renders
  `notification.title` and `notification.body` **verbatim** (lines 97, 104-105), with exactly
  **two** exceptions re-localised at render time in the viewer's *current* `useLocale()`:
  - `listing_status_change` (line 102-103) → `resolveStatusBody()` parses a JSON
    `{from,to}` status-code payload and calls `getListingStatusLabel(code, tl)` — body stores
    **codes**, not prose. **This is the correct, locale-safe pattern.**
  - `saved_search_match` (line 100-101) → `t('saved_search_match_body', { count })` — body
    stores a **count**, not prose.

  **Every other type** — `new_message`, `support_reply`, `report_outcome`,
  `listing_expires_soon`, `agent_verified`, `marketing`, `price_change` — renders the raw stored
  string verbatim. Its locale is **frozen at creation** and is **completely independent of the
  viewer's current site locale** at render time.

- **Recipient locale source (`src/modules/notifications/lib/emails/resolveUserLocale.ts`):**
  reads `users.preferred_locale` (fallback chain → `requestLocale` param → `'sq'`). Marked
  `@deprecated` for *email* (Albanian-only outbound policy, Epic GG, `docs/integrations.md:254`),
  but its docstring states **two** consumers remain for **in-app notification locale**:
  `src/modules/admin/actions/index.ts:833` and `:896` (both confirmed below).

- **🆕 New finding — how `preferred_locale` itself is set/changed:**
  `users.preferred_locale` is written in exactly two places:
  1. **At signup** (`src/modules/auth/components/AuthSheet.tsx:611`) — set to whatever locale
     the signup form was rendered in.
  2. **On every locale-switcher click, on EVERY page** (`src/components/layout/Header.tsx:110-116`
     `switchLocale()` → calls `setAdminLocale(newLocale)` from
     `src/modules/admin/actions/locale.ts:9-27`, which **best-effort, fire-and-forget** updates
     `users.preferred_locale = newLocale` for the *currently signed-in* user — despite the
     `setAdminLocale` name, this runs from the **public** `Header.tsx`, not just `/admin`).

  **Consequence:** `preferred_locale` is a **point-in-time snapshot of "whatever locale this user
  last had the site in"** — it drifts every time the user clicks the language switcher, and it is
  unrelated to any deliberate "preferred language" setting. A notification created while
  `preferred_locale='uk'` (e.g., the user had briefly switched to uk, or signed up under uk) gets
  uk prose baked in **permanently** — even after the same user switches back to `sq` (which
  updates `preferred_locale` to `sq` for *future* notifications, but does **nothing** to the
  already-stored row).

---

## 2. Per-producer map

`grep -rn "createNotification(" src` → **6 call sites** (not 7 — see note below table):

```
src\modules\notifications\lib\mutations.ts:9        (the function definition itself — not a call site)
src\modules\admin\actions\index.ts:835
src\modules\admin\actions\index.ts:898
src\app\api\cron\saved-searches\route.ts:135
src\app\api\cron\price-alerts\route.ts:156
src\modules\listings\actions\applyListingTransition.ts:114
src\modules\listings\actions\reportListing.ts:160
```

**Producer-count correction (orchestrator's pre-analysis row #7):** the orchestrator suspected
`src/app/api/cron/inactivity/route.ts` adds an 8th/7th producer. **It does not.** Read in full —
`cron/inactivity` sends `InactivityWarningEmail`/`InactivityFinalEmail` via `sendEmail()` only
(both hardcoded `locale = 'sq'` per the Albanian-only email policy, lines 120/152); it never calls
`createNotification`. **The complete producer set is 6, not 7.** This is corrected here per
decision 6 ("if reality contradicts the pre-analysis, correct it and note the discrepancy" — noted
also in §9 below).

| # | File:line | `type` | Recipient (`userId`) | (a) Actor/trigger context | (b) Request locale exists? | (c) Where `s` strings come from | (d) Whose locale | (e) Verdict |
|---|---|---|---|---|---|---|---|---|
| 1 | `admin/actions/index.ts:835` (`createSupportTicket`) | `support_reply` | `reportedUserId` | Admin action (admin opens a `user_complaint` ticket) | Yes (admin's request), but unused for this string | `getSupportNotifyStrings(locale)` ← `SUPPORT_NOTIFY_STRINGS` (4-locale literal object, lines 710-743) ← `locale = await resolveUserLocale(reportedUserId)` (line 833) | **Recipient's `preferred_locale` AT THE MOMENT OF TICKET CREATION** (a point-in-time snapshot — see §1) | **WRONG-LOCALE-RISK** (creation-time snapshot frozen forever; see §4) |
| 2 | `admin/actions/index.ts:898` (`updateTicketStatus`) | `report_outcome` | `ticket.reported_user_id` | Admin action (admin resolves/closes a ticket) | Yes (admin's request), unused | Same `getSupportNotifyStrings(locale)` / `SUPPORT_NOTIFY_STRINGS`, `locale = await resolveUserLocale(ticket.reported_user_id)` (line 896) | **Recipient's `preferred_locale` AT THE MOMENT OF RESOLUTION/CLOSE** (snapshot) | **WRONG-LOCALE-RISK — primary root-cause candidate, see §4** |
| 3 | `cron/saved-searches/route.ts:135` | `saved_search_match` | `search.user_id` | Cron (no incoming request at all) | **No** — cron context | `getNotif(locale)` ← `NOTIF` (4-locale object, lines 33-41) ← **hardcoded `const locale = 'sq'`** (line 126, comment: *"Albanian-only policy (Task 251): saved-search alert emails always in sq"*) | **Hardcoded `'sq'`, copied from the EMAIL policy onto the in-app notification `title`** | **WRONG-LOCALE-RISK for title** (body is render-safe — see §3) |
| 4 | `cron/price-alerts/route.ts:156` | `price_change` | `fav.user_id` | Cron (no incoming request) | **No** — cron context | `getNotif(locale)` ← `NOTIF` (4-locale object, lines 29-49) ← **hardcoded `const locale = 'sq'`** (line 147, same Task-251 email-policy comment, reused for the in-app notification) | **Hardcoded `'sq'`, copied from the EMAIL policy** | **WRONG-LOCALE-RISK** (title AND body — `price_change` is NOT in the render-time-safe set, see §3) |
| 5 | `listings/actions/reportListing.ts:160` (`notifyReporter`) | `report_outcome` | `reporterUserId` (`data.user_id` from `listing_reports`) | User action (a moderator/admin changed a report's status to `resolved`/`dismissed`; fire-and-forget) | No request locale threaded through `notifyReporter` | `getReporterNotificationEmailStrings(locale, status)` ← **hardcoded `const locale = 'sq'`** (line 156, same Task-251 comment, *"reporter notification email always in sq"* — reused for the in-app `title`/`body` at lines 163-164) | **Hardcoded `'sq'`, copied from the EMAIL policy** | **WRONG-LOCALE-RISK** (title AND body, frozen-at-creation type) |
| 6 | `listings/actions/applyListingTransition.ts:114` (`executeTransition`) | `listing_status_change` | `ownerId` | User/admin/cron action (any listing status transition) | N/A | `title = listingTitle ?? listingId` (a **proper noun** — the listing's name, not translatable prose); `body = JSON.stringify({from, to})` — **status codes, not prose** (lines 117-120, comment explicitly: *"Store status codes as JSON so the renderer can localize them at display time in the viewer's active locale (not baked at write time)"*) | N/A — title is locale-neutral (a name); body is re-localised at render time in the **viewer's current locale** | **RENDER-TIME-SAFE — the reference correct pattern** |

---

## 3. Render-layer map (`NotificationItem.tsx`)

| `NotificationType` | Render behavior | Locale-safety |
|---|---|---|
| `listing_status_change` | `resolveStatusBody()` (lines 41-62) parses `{from,to}` JSON (or legacy `"X → Y"` string) and calls `getListingStatusLabel(code, tl)` — `tl = useTranslations('listing')` in the **viewer's current `useLocale()`** | **Re-localised at render** — body is locale-safe regardless of creation-time locale. Title (`listingTitle`) is a proper noun — locale-neutral by nature. |
| `saved_search_match` | `t('saved_search_match_body', { count: parseInt(notification.body) \|\| 1 })` — `t = useTranslations('notifications')` in viewer's current locale | **Body re-localised at render** — body is locale-safe. **Title is NOT re-localised** — renders `notification.title` verbatim (the `s.title(searchName)` string baked at creation time in whatever locale producer #3 used, currently hardcoded `sq`). |
| `new_message` | Renders `notification.title` / `notification.body` verbatim | **Frozen at creation.** (No `createNotification` producer for this type was found in the 6-site grep — `new_message` exists in the `NotificationType` union and `TYPE_ICON` map but currently has **no producer**; out of scope for this audit, noted for completeness.) |
| `support_reply` | Renders verbatim | **Frozen at creation** — producer #1, `resolveUserLocale(reportedUserId)` snapshot (§2). |
| `report_outcome` | Renders verbatim | **Frozen at creation** — producers #2 (`resolveUserLocale` snapshot) AND #5 (hardcoded `sq`) both write this type with DIFFERENT locale-binding mechanisms (§2). |
| `listing_expires_soon` | Renders verbatim | **Frozen at creation.** No producer found in the 6-site grep — same "type exists, no current producer" note as `new_message`. Out of scope. |
| `agent_verified` | Renders verbatim | **Frozen at creation.** No producer found — same note. Out of scope. |
| `marketing` | Renders verbatim | **Frozen at creation.** No producer found — same note. Out of scope. See also §6 (broadcast-to-mixed-locales concern, applies if/when a producer is added). |
| `price_change` | Renders verbatim | **Frozen at creation** — producer #4, hardcoded `sq` (§2). |

**Cross-check against producer table:** every type with an active producer (`support_reply`,
`report_outcome` ×2, `saved_search_match`, `price_change`, `listing_status_change`) is accounted
for above. `listing_status_change` is the only type that is fully render-time-safe end-to-end.
`saved_search_match` is half-safe (body only). The remaining four producer rows are
frozen-at-creation with no render-time correction.

---

## 4. Root cause of the live "Скарга на ваш акаунт…" bug

**Root cause — NAMED, with file:line evidence:**

The string **"Скарга на ваш акаунт"** (uk: "A complaint about your account") exists in exactly
ONE place in the codebase: `SUPPORT_NOTIFY_STRINGS.uk.created_title`,
`src/modules/admin/actions/index.ts:728`. The **only** two call sites that can ever select this
string are producers **#1** (`createSupportTicket`, line 835, `created_title`) and **#2**
(`updateTicketStatus`, line 898, `resolved_title`/`closed_title` — but #2 only ever selects
`resolved_*`/`closed_*`, never `created_*`). **⇒ Producer #1 (`admin/actions/index.ts:832-841`,
`createSupportTicket`) is the row that produced the exact reported string.**

Mechanism (the "wrong-locale" mechanism the audit was asked to name):

1. An admin opens a `user_complaint` support ticket against some user U (`createSupportTicket`,
   triggered from `/admin/support`).
2. `resolveUserLocale(reportedUserId=U)` (line 833) reads `users.preferred_locale` for U **at
   this exact moment**. Per §1's new finding, `preferred_locale` is whatever locale U's UI was
   last switched to (via `Header.tsx:110-116` `switchLocale` → `setAdminLocale`, fire-and-forget)
   — **U may simply have clicked the 🇺🇦 flag once**, at any point in the past, even on an
   unrelated page, and never touched it again.
3. `resolveUserLocale` returns `'uk'`. `getSupportNotifyStrings('uk')` returns
   `SUPPORT_NOTIFY_STRINGS.uk`, whose `created_title` is **"Скарга на ваш акаунт"**.
4. `createNotification({ userId: U, type: 'support_reply', title: 'Скарга на ваш акаунт', body: ... })`
   inserts this **uk prose** into `notifications.title` **permanently** — there is no locale
   column, no key, no params (§1).
5. **Later**, U switches the site back to `sq` (the new flag click updates
   `preferred_locale='sq'` for any *future* notification — but does nothing to the row written in
   step 4).
6. U opens the notification bell while browsing in `sq`. `NotificationItem.tsx` renders
   `notification.title` **verbatim** (line 97) — **"Скарга на ваш акаунт"** — inside an
   otherwise-`sq` UI. **This is the observed bug.**

**This is a single, unambiguous root cause** — no second candidate is needed. (Producers #3/#4/#5
hardcode `sq`, which cannot produce uk text, so they are **disqualified** as the source of *this
specific* uk string, though they are independently flagged as WRONG-LOCALE-RISK in §2 for non-sq
recipients.)

**The deeper, systemic root cause** (why step 5→6 is possible at all): **the architecture binds
notification display-locale to a creation-time snapshot of a frequently-drifting `preferred_locale`
field, then renders that snapshot verbatim forever, with no way to re-derive or re-localise it
later.** Any producer that stores prose (i.e., every producer except #6) is subject to this same
class of bug — #1/#2 just happen to be the ones that can produce **non-sq** prose (since #3/#4/#5
are hardcoded to `sq` and would only mis-localise for non-`sq` recipients, never show *uk* to an
*sq* viewer).

---

## 5. Fix recommendations for Task 319 (recommendations only — NOT implemented here)

### 5.1 — Storage model: key+params vs creation-time prose (the central decision)

**Option A — Store `i18n_key` + `i18n_params` (JSON), render-time localisation for ALL types
(generalise the `listing_status_change` pattern from producer #6 to every producer).**
- *Pros:* Permanently fixes the bug class — render always uses the viewer's *current*
  `useLocale()`, so locale drift after creation is a non-issue. One pattern for all 7
  `NotificationType`s. Matches the existing, owner-endorsed `listing_status_change` precedent.
- *Cons:* Requires a `notifications` schema change (e.g. add `title_key`, `title_params jsonb`,
  `body_key`, `body_params jsonb`, or a single `payload jsonb`); every producer must be rewritten
  to stop building prose; `NotificationItem.tsx` needs a per-type key/param → `t()` mapping
  (manifest-driven, could reuse the Task 317 `i18n-dynamic-manifest.json` pattern). Largest
  Task 319 scope.

**Option B — Keep creation-time prose, but bind to the recipient's locale CORRECTLY and add a
`notification_locale` column recording which locale the stored prose is in.**
- *Pros:* Smaller schema change (one new column); producers #3/#4/#5 just need to stop hardcoding
  `sq` and call `resolveUserLocale(recipientUserId)` like #1/#2 already (partially) do.
- *Cons:* Does **not** fix the core bug — `preferred_locale` still drifts (§1), so a notification
  created while the recipient was momentarily on `uk` is still permanently `uk`, even with a
  `notification_locale='uk'` column correctly recording that fact — the column documents the
  problem but doesn't solve it. Would need a render-time decision: "if `notification_locale !==
  viewer's current locale`, do what?" — which re-opens Option A's render-time question anyway,
  but without the params to re-localise.

**Option C — Render-time override only for SHORT, ENUMERABLE strings (hybrid).** For types whose
prose is drawn from a small, enumerable set per type (e.g. `SUPPORT_NOTIFY_STRINGS`'s 6 keys ×
4 locales — exactly the shape `getSupportNotifyStrings` already has), store a **template ID**
(e.g. `'support_created'`, `'support_resolved'`, `'support_closed'`) instead of resolved prose,
and have `NotificationItem.tsx` look up `notifications.<template-id>` in
`messages/{locale}.json` at render time in the viewer's current locale — i.e., promote
`SUPPORT_NOTIFY_STRINGS` (currently a hand-rolled 4-locale object inside `admin/actions/index.ts`)
into the standard `messages/*.json` + `useTranslations('notifications')` system, and store only
the template ID + minimal params (e.g. searchName, price strings, count). This is essentially
Option A scoped down to the producers that are *currently* prose-from-a-small-enum
(#1/#2/#3/#4/#5) while #6 already does its own (slightly different, JSON-status-code) version of
this.
- *Pros:* Smallest schema change (`title_key`/`body_key` + small `params jsonb`, OR even reuse
  `link`-style conventions); reuses the existing `messages/*.json` 4-locale infrastructure +
  Task 317's `check:i18n-dynamic` manifest gate for the new dynamic keys; directly extends the
  pattern producer #6 already proved works.
- *Cons:* `price_change` (#4) and `saved_search_match` (#3) interpolate runtime values (prices,
  listing titles, search names, counts) into the prose — these need careful `params jsonb` design
  (e.g. listing title is a proper noun, locale-neutral, but price formatting (`fmtPrice`,
  thousands separator) IS locale-sensitive and currently uses `.toLocaleString('en')`
  unconditionally — a second, smaller finding worth folding into 319's scope).

**Orchestrator/owner should pick A, B, or C** before Task 319's kickoff is written. Given producer
#6 already implements (most of) Option C/A's pattern successfully and is the only
`RENDER-TIME-SAFE` row, **A or C appear most consistent with existing precedent**; B is flagged as
likely insufficient on its own.

### 5.2 — Stop conflating the Albanian-only EMAIL policy with in-app notification locale

Producers #3/#4/#5 each carry a comment "Albanian-only policy (Task 251): ... emails always in
sq" and then **reuse that same `const locale = 'sq'`** for the in-app `createNotification` call
(§2). Whatever Option A/B/C is chosen for §5.1, Task 319 must **separate these two `locale`
variables** — e.g. `const emailLocale = 'sq'` (unchanged, Epic GG) and a distinct
`notificationLocale` derived per §5.1's chosen model. This is a small, mechanical, but
load-bearing fix across 3 files.

### 5.3 — `preferred_locale` semantics

Independent of A/B/C: `preferred_locale` being silently overwritten by *any* locale-switcher click
(§1) means it is unsuitable as a stable "the user reads X language" signal for anything beyond
"what `sq`/`en`/`uk`/`it` should THIS EMAIL right now use" (its current, narrow, deprecated-but-ok
email use). Task 319 should NOT treat `preferred_locale` as authoritative for notification
locale under Option A/C (render-time uses `useLocale()`, not `preferred_locale`, so this becomes
moot) — but if Option B is chosen, this drift behavior is a prerequisite fix or an accepted,
documented limitation.

---

## 6. Legacy already-stored rows (distinct concern)

Every notification row written before Task 319 ships has prose frozen in whatever locale was
resolved at creation time (§1/§4) — **Task 319's fix, whatever shape it takes, cannot retroactively
correct existing rows** unless it includes a backfill.

- **If Option A/C is chosen** (key+params storage): existing rows have prose in `title`/`body`,
  not keys — they **cannot** be mapped to the new schema without a heuristic reverse-lookup
  (match stored prose against the 4-locale string tables to recover a template ID), which is
  fragile and **not recommended**. Recommended: **render-time fallback** — `NotificationItem.tsx`
  checks for the new key/params columns; if absent (legacy row), falls back to the current
  verbatim-render behavior (i.e., legacy rows keep showing their frozen-locale prose, exactly as
  today, until they age out / are marked read and eventually pruned). This is a **documented,
  accepted limitation**, not a regression — legacy rows are no worse than they are today.
- **If Option B** is chosen: existing rows have no `notification_locale` value — backfill could
  set it to `'sq'` (the most common producer default) as a best-effort guess, but this is
  explicitly a guess and should be flagged as such if B is selected.
- **No "fix legacy rows" work should block Task 319's ship** — new notifications stop
  accumulating the bug; legacy rows is a separate, smaller, optional follow-up (could be Task 320
  scope or its own ticket) — Task 319's kickoff should state explicitly which of these it covers.

---

## 7. Task 319 hand-off checklist

- [ ] **Decide §5.1 storage model (A/B/C)** — owner/orchestrator decision, blocks the rest of 319's
  kickoff.
- [ ] Migration (if A/C): add columns to `notifications` (e.g. `title_key`, `title_params jsonb`,
  `body_key`, `body_params jsonb`) — nullable, so legacy rows (§6) remain valid with `NULL`.
- [ ] Rewrite all 5 prose-producing call sites (#1, #2, #3, #4, #5 in §2) to stop building
  4-locale prose strings inline and instead pass key+params (or template ID, per chosen option).
- [ ] Move `SUPPORT_NOTIFY_STRINGS` (admin/actions/index.ts:710-743) and the `NOTIF` objects in
  `cron/saved-searches/route.ts` and `cron/price-alerts/route.ts`, and
  `getReporterNotificationEmailStrings`'s in-app-notification subset, into
  `messages/{sq,en,uk,it}.json` under a `notifications.*` namespace — 4-locale parity required
  (clause 7); register new dynamic keys in `scripts/i18n-dynamic-manifest.json` per
  `docs/i18n-rules.md` (Task 317/423) so `check:i18n-dynamic` covers them.
- [ ] Extend `NotificationItem.tsx` to render the new key/params for `support_reply`,
  `report_outcome`, `saved_search_match` (title), and `price_change` — using
  `useTranslations('notifications')` in the viewer's `useLocale()`, mirroring the existing
  `resolveStatusBody`/`saved_search_match_body` pattern.
- [ ] **§5.2** — split `emailLocale` (`'sq'`, unchanged) from `notificationLocale` in producers
  #3/#4/#5.
- [ ] **§5.3** — if Option B, address `preferred_locale` drift or document the limitation
  explicitly.
- [ ] **§6** — implement the legacy-row fallback render path (recommended: graceful verbatim
  fallback when new columns are `NULL`); explicitly state in 319's kickoff whether legacy-row
  backfill is in/out of scope.
- [ ] **Price formatting locale-sensitivity** (noted in §5.1 Option C "Cons") —
  `fmtPrice()` in `cron/price-alerts/route.ts` uses `.toLocaleString('en')` unconditionally; if
  `price_change` body becomes render-time-localised, number formatting should follow the viewer's
  locale too. Minor, fold into 319 if convenient, else spin out.
- [ ] 4-locale parity (sq/en/uk/it) for every new/changed key — clause 7.
- [ ] `new_message` / `listing_expires_soon` / `agent_verified` / `marketing` (§2/§3 "no current
  producer" types) — out of scope for 319 unless a producer is added in the same task; if any of
  these gain a producer, it must follow whichever pattern 319 establishes (no new
  frozen-creation-time prose producers).

---

## 8. `git diff --stat src` — confirmed EMPTY

```
$ git diff --stat src
(empty)
```

No `src/`, `messages/`, or `package.json` files were modified by this audit. Only
`docs/governance-reports/2026-06-13-notification-locale-audit.md` (this file, new),
`docs/i18n-rules.md` (one-line pointer), `docs/backlog.md`, and
`docs/sessions/2026-06-13-task318-notification-locale-audit.md` (new) change.

---

## 9. Discrepancies vs the orchestrator's pre-analysis (decision 6)

1. **Producer count is 6, not 7** — `cron/inactivity/route.ts` has no `createNotification` call
   (email-only, hardcoded `sq` per Epic GG); see §2.
2. **Producer #2 (`report_outcome` via `updateTicketStatus`) is NOT disqualified, but it is not
   the row that produced the *exact reported string* either** — the orchestrator flagged #2 as
   "prime suspect"; the audit found the `created_title` string (only reachable from producer #1)
   is the unique match for "Скарга на ваш акаунт", while #2 only ever selects `resolved_*`/
   `closed_*` strings. Both #1 and #2 share the **same underlying mechanism** (creation-time
   `resolveUserLocale` snapshot, §1/§4), so both are `WRONG-LOCALE-RISK`, but **#1 is the named
   root cause** for *this specific* reported string (§4).
3. **New finding not in the pre-analysis:** `preferred_locale` is overwritten on **every**
   locale-switcher click via the public `Header.tsx` (not just `/admin`), which is the mechanism
   that makes the creation-time snapshot drift (§1). This is the missing link that explains *how*
   a `uk` string could be baked in for a user who is later seen browsing in `sq`.

---

## Self-validation

**Self-validation: all 6 `createNotification` producers traced to their `s`-string source and a
verdict (§2); render-layer map covers all 9 `NotificationType`s, cross-checked against the
producer table (§3); root cause named to `admin/actions/index.ts:728` (`SUPPORT_NOTIFY_STRINGS.uk.created_title`)
+ the creation-time-snapshot mechanism via `resolveUserLocale`/`preferred_locale` drift (§4), with
producer #1 as the unique match for the exact reported string and producer #2 sharing the same
mechanism; no `UNRESOLVED — STOP&ASK` rows; fix recommendations (§5) present three options (A/B/C)
with trade-offs, scoped to Task 319, none implemented; legacy-rows concern addressed with a
recommended fallback (§6); Task 319 hand-off checklist (§7) is concrete and actionable;
`git diff --stat src` empty (§8); discrepancies vs pre-analysis documented (§9) — PASS**
