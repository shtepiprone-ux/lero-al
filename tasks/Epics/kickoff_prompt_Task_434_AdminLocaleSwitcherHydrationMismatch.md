# Task 434 — AdminUserProfile history-timestamp hydration mismatch (FIX)

> **Type:** UI / hydration / SSR-CSR determinism bug. **Root cause CONFIRMED by owner repro 2026-06-15.**
> **(This file keeps its original name; the real root cause is the date-format mismatch below — NOT the
> earlier Base-UI `LocaleSwitcher` id hypothesis, which is withdrawn.)**
> Separate from 433 (deferred), 435 (report submit), 436 (prevention), 437 (perf).

## Confirmed root cause (owner repro)

- **Route:** `/admin/users/[id]`
- **Error:** "Hydration failed because the server rendered text didn't match the client."
- **Code frame:** `src/components/admin/AdminUserProfile.tsx:1149` (status-history entry timestamp).
- **Problem code:** `new Date(entry.changed_at).toLocaleDateString(locale, { day:'2-digit', month:'2-digit',
  year:'numeric', hour:'2-digit', minute:'2-digit' })`
- **Mismatch:** server rendered `06/15/2026, 11:47 PM` (en-US fallback) vs client `15.06.2026, 11:47 m.d.`
  (actual locale). I.e. `toLocaleDateString` produces **different output on server vs browser for the same
  `locale` arg** — classic SSR/CSR `Intl` divergence (server ICU/locale-data fallback and/or timezone
  differs from the browser). This is NOT a Base-UI id issue.

## All affected call sites (fix ALL — Note 14 global-change rule)

`toLocaleDateString(locale, …)` in `AdminUserProfile.tsx` at **three** sites, all must become deterministic:
- **L1149** — status-history entry (date + time) ← the reported one.
- **L1105** — change-log entry (date + time) ← same pattern, same latent mismatch.
- **L762** — `suspended_until` (date only) ← same family; convert for consistency.
- Sweep the file (and sibling admin/history surfaces) for any other `toLocale*` and convert them too — no
  diverging call sites left behind.

## Pre-read (rule-index → UI/layout + profile/edit-flow)

- `docs/agent-contract.md` + `docs/backlog.md` (always)
- `docs/ui-rules.md`, `docs/component-rules.md`, `docs/qa-rules.md`
- `docs/ai-behavior.md` → Note 14 (global-change), Note 23 (edit-flow preservation)
- `src/lib/formatters.ts` (existing hydration-safe `formatPrice`/`formatDate` pattern to extend)

## Required fix (deterministic SSR === CSR text; NO `suppressHydrationWarning`)

`suppressHydrationWarning` is **explicitly forbidden** as the fix. The initial server text and the initial
client text must be **byte-identical**. Pick the approach that GUARANTEES parity and VERIFY it at runtime
(do not assume `Intl` parity — the bug IS `Intl` non-parity):

- **Preferred:** add a deterministic `formatDateTime(dateStr, locale)` (and reuse `formatDate` for the
  date-only L762) to `src/lib/formatters.ts`, built on `Intl.DateTimeFormat(locale, { …, timeZone: <fixed> })`
  with an **explicit `timeZone`** so server (UTC) and client (local) cannot diverge on the time. If
  `Intl`-with-explicit-locale+timeZone still diverges in this environment (server ICU fallback to en-US),
  fall back to **server-preformatting**: format the timestamp in the server component
  (`src/app/admin/users/[id]/page.tsx`) and pass the finished string down so the client renders it verbatim
  with no client-side reformat.
- Whichever path: the helper takes an **explicit locale** (route locale on server, `useLocale()` on client)
  and a fixed timezone; it must return identical output in Node and the browser. Confirm by rendering
  `/admin/users/[id]` and checking the console.
- **Preserve `sq`/`en`/`uk`/`it`** date/time presentation (locale-correct, just deterministic) — verify all
  four. Keep the existing visual format intent (day/month/year + hour:minute).

## Cross-task hook (Task 436)

`/admin/users/[id]` MUST be added to the hydration/console-error gate route list in **Task 436** so this
class is caught automatically going forward. (Do not implement 436 here — just ensure the route is named in
436's coverage; coordinate, don't duplicate.)

## Explicitly OUT of scope / separate

- The OpenTelemetry `import-in-the-middle can't be external` version-mismatch terminal warnings are a
  **separate, unrelated** issue — do NOT touch them in this task.
- Task 433 (globals.css/Tailwind) is deferred/non-reproducible — not part of this work.

## Positive flow

Admin opens `/admin/users/[id]` with status-history + change-log rows → page SSRs the timestamps → hydration
completes with **zero** hydration warnings → timestamps display locale-correctly in sq/en/uk/it.

## Negative flow

- No history rows → sections don't render (unchanged); no regression.
- Invalid/null `changed_at` → helper returns `—` (match existing `formatDate` contract); same on both sides.
- Locale switch (sq/en/uk/it) → format changes locale-correctly AND stays SSR===CSR identical per locale.

## Acceptance criteria

- AC1 — All `toLocale*` timestamp sites in `AdminUserProfile.tsx` (L762, L1105, L1149 + any swept) use the
  deterministic helper / server-preformat; no `suppressHydrationWarning`.
- AC2 — `/admin/users/[id]` loads with **zero** hydration warnings in the browser console — rendered
  evidence (console screenshot/transcript) in the session log, for all four locales.
- AC3 — Server and client initial text are byte-identical (state the chosen mechanism: explicit
  locale+timeZone helper, or server-preformat).
- AC4 — sq/en/uk/it timestamps remain locale-correct (4-locale evidence).
- AC5 — `/admin/users/[id]` named in Task 436's hydration-gate route coverage.
- AC6 — `npx tsc --noEmit` = 0; file-integrity green; "Files Changed" table; no mutating git; OTel warning
  untouched.
