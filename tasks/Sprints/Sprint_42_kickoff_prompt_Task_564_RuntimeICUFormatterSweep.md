# Task 564 — Sweep remaining runtime-ICU-dependent `Intl.*` calls for `sq` SSR/CSR parity

**Type:** Bug-fix / hydration + i18n (product code). **Executor:** Sonnet 4.6.
**Origin:** Opened from the Task 563 orchestrator review (2026-07-09). Task 563 fixed number grouping
(`formatPrice`/`formatCount`) but the SAME root cause — **Chromium's bundled ICU has no `sq` locale data
at all** (`Intl.*.supportedLocalesOf(['sq'])` → `[]`, so any `Intl.*('sq', …)` silently falls back to
`en-GB`) — is still live at several other call sites. Continuation of Tasks 562 (calendar names) + 563 (grouping).
**Critical flow:** listings display + notifications → **clause 15 regression coverage is in scope.**

## Root cause (already verified — do not re-litigate, just fix)

`Intl.NumberFormat('sq')` and `Intl.DateTimeFormat('sq')` produce correct output on the Node server (full ICU)
but on the browser fall back to `en-GB`, so server and client render different text → hydration mismatch on
`/sq/*` and simply-wrong Albanian formatting elsewhere. Verified with Node vs the `en-GB` fallback:

| Formatter | Node (`sq`, full ICU) | Browser (`sq`→`en-GB` fallback) | Diverges |
|---|---|---|---|
| `formatDate` (`2-digit`/`2-digit`/`numeric`) | `17.06.2026` | `17/06/2026` | ✅ |
| `formatDateTime` (+UTC `hh:mm`) | `17.06.2026, 12:00 p.d.` | `17/06/2026, 00:00` | ✅ |
| `formatListingDate` (`numeric`/`short`/`numeric`) | `17 qer 2026` | `17 Jun 2026` | ✅ |
| `NotificationItem` price body (`Intl.NumberFormat('sq')`) | `45 000 ALL` | `45,000 ALL` | ✅ |

## Scope — every remaining runtime-locale `Intl.*` call that can receive `sq`

1. `src/lib/formatters.ts` → `formatListingDate` — `Intl.DateTimeFormat(locale,{day:'numeric',month:'short',year:'numeric'})`.
   Replace the month-name portion with the **static `common.calendar_*` i18n data already created by Task 562**
   (short month names for `sq`/`en`/`uk`/`it`); compose the string deterministically (day + localized short month +
   year) so output is identical on every runtime. **This is the Task-562-shaped fix.**
2. `src/lib/formatters.ts` → `formatDate` + `formatDateTime` — all-numeric date/time. Make output
   runtime-independent: compose from `Date` UTC parts with a per-locale separator/order table (mirror `NUMBER_GROUPING`
   from Task 563), OR another deterministic approach consistent with `state-authority.md`. Preserve the existing
   `en`/`uk`/`it` rendered output byte-for-byte; only `sq` (and any other browser-unsupported locale) changes, toward
   the correct full-ICU `sq` form. Keep the UTC timezone pin in `formatDateTime`.
3. `src/modules/notifications/components/NotificationItem.tsx` → `resolvePriceChangeBody` (~L84) —
   `new Intl.NumberFormat(locale,{maximumFractionDigits:0})`. Route through the deterministic
   `formatCount(value, locale)` / `formatPrice` path from Task 563 (no raw `Intl.NumberFormat`).

**Global-change rule (Note 14):** after this task, `grep -rn "new Intl\.\(Number\|DateTime\)Format(" src/` must return
**only** call sites that pass a hardcoded universally-supported locale (e.g. `'en'`) or are otherwise proven
runtime-deterministic. Any remaining raw runtime-`locale` `Intl.*` call is a diverging site — fix it or list it with
justification. `page.tsx:91` uses `Intl.NumberFormat('en')` (hardcoded → safe, leave as-is; may optionally route
through `formatCount(...,'en')` for consistency).

## Pre-read (rule-index → UI + state-authority + i18n)

- `docs/agent-contract.md` + `docs/backlog.md` + `docs/critical-flow-registry.md` (listings-display + add a notifications row).
- `docs/state-authority.md` (hydration determinism); `docs/qa-rules.md`; `docs/component-rules.md`.
- Task 562 session log `docs/sessions/2026-07-08-task562-rangedatepicker-calendar-localization.md` + the `common.calendar_*`
  i18n data it added (reuse, do not duplicate). Task 563 `formatters.ts` `NUMBER_GROUPING`/`groupDigits` pattern (mirror it).

## Required after-behavior

- `formatDate`, `formatDateTime`, `formatListingDate`, and the `NotificationItem` price body render **byte-identical
  on server and client at all four locales** — no hydration warning on `/sq/listings` (this closes the listing-card
  date-stamp warning Task 563 flagged), the homepage, admin tables, or the notifications panel.
- `en`/`uk`/`it` output is **visually unchanged** (byte-identical before/after); only `sq` (and unsupported-locale
  fallbacks) change, toward the correct full-ICU `sq` form.

## Positive flow

1) Load `/sq/listings` → each card's date stamp renders Albanian short-month (`17 qer 2026`), identical server↔client,
console clean (no price AND no date hydration warning). 2) Trigger a `price_change` notification in `sq` → body shows
`45 000 ALL` (space grouping), not `45,000 ALL`. 3) Any admin surface using `formatDate`/`formatDateTime` in `sq`
renders the full-ICU Albanian numeric form identically server↔client. 4) `en`/`uk`/`it` unchanged everywhere.

## Negative flow

- **`null`/`undefined`/invalid date** → existing `'—'` return preserved, hydration-stable.
- **Unknown/unsupported locale** (not in the static table) → deterministic fallback (e.g. `en`), never a raw
  `Intl.*` fallback that then mismatches; never throws.
- **Missing/malformed notification params** → existing `null` → `sq`-fallback body path preserved.

## Regression coverage (clause 15)

Extend/add a smoke test (mirror `price-format-ssr-parity.smoke.test.ts`): literal-byte assertions for
`formatDate`/`formatDateTime`/`formatListingDate` across all 4 locales (incl. `sq` short month + numeric separators)
+ a monkey-patched-`Intl.DateTimeFormat`-throws simulation proving no dependency on runtime ICU; and a `formatCount`-routed
assertion for the notification body. **Planted violation:** revert any one formatter to a raw `Intl.*(locale)` call →
the corresponding test FAILS; revert → green. Update the listings-display registry row (Task 563's "flagged follow-up")
and add a notifications-display row.

## Acceptance criteria

1. No React hydration mismatch for any date/number formatter at any locale — console-clean evidence on `/sq/listings`
   (date stamp specifically), the notifications panel, and one admin date surface.
2. `formatDate`/`formatDateTime`/`formatListingDate` + notification price body byte-identical server↔client at
   `en`/`uk`/`sq`/`it`; `en`/`uk`/`it` visually unchanged (byte-diff proof).
3. `grep` sweep confirms no remaining raw runtime-`locale` `Intl.*` call (or each is justified).
4. Regression tests + planted-violation transcript; registry rows updated (listings-display flagged row cleared,
   notifications row added).
5. Gates: `tsc=0`, `check:i18n`, `check:design-tokens -- --strict`, `check:mojibake`, `check:file-integrity` green;
   Files-Changed table present. **Do NOT run git — HELD for orchestrator review.**

## Out of scope

The Base-UI `Tabs`/`CompositeRoot`/`DropdownMenu` random-`id` hydration mismatch on `/it/listings` (separate Base-UI
issue, not an ICU/formatter bug — track separately); any listings-query, currency-conversion, or notification-delivery
logic change; visual/chrome restyle (no `max-sm`/TailAdmin surface changes — this is formatter logic only).
