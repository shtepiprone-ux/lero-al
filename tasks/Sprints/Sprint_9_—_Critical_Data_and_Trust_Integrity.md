# Sprint 9 — Critical Data & Trust Integrity

> Opened 2026-05-22 by the Opus 4.7 orchestrator. The cross-cutting **critical** batch pulled forward
> from Epics M (currency), N (localization) and P (favorites/auth/account) — the bugs that show users
> wrong money, wrong language, or wrong account state, plus broken email links. These are grounded in a
> real code read (not abstract): each kickoff cites the exact files/lines found during planning.

## Why these first

The owner flagged these as the top priority: prices and price/m² shown in the wrong currency, a single
rate source (iliria98.com), language mixing across pages, confirmation emails pointing to `localhost`,
the guest "Add to favorites" dead-click, and the false "Account deleted" contact card. They erode trust
in the platform's core data, so they ship before UI polish, admin, and IDs.

## Tasks

| Task | Epic | Summary | Kickoff |
|---|---|---|---|
| 210 | — (baseline) | **Runs first.** Green `tsc --noEmit` baseline: fix stale `MOCK_USER` fixtures missing `suspended_until` + `inactivity_warning_sent_at` | `Sprint_9_kickoff_prompt_Task_210.md` |
| 175 | M.1 | iliria98.com as single source of truth for FX rates | `Sprint_9_kickoff_prompt_Task_175.md` |
| 176 | M.2 | Fix price & price-per-m² currency/unit mismatch | `Sprint_9_kickoff_prompt_Task_176.md` |
| 177 | M.3 | Admin Currency table from iliria98.com; one catalog everywhere | `Sprint_9_kickoff_prompt_Task_177.md` |
| 178 | M.4 | Currency selector = canonical Combobox everywhere | `Sprint_9_kickoff_prompt_Task_178.md` |
| 179 | N.1 | Deep locale-mixing audit + fixes | `Sprint_9_kickoff_prompt_Task_179.md` |
| 180 | N.3 | Admin↔site two-way locale persistence | `Sprint_9_kickoff_prompt_Task_180.md` |
| 181 | P.1 | Guest "Add to favorites" opens auth flow | `Sprint_9_kickoff_prompt_Task_181.md` |
| 182 | P.2 | Contact card "Sign in", not "Account deleted" | `Sprint_9_kickoff_prompt_Task_182.md` |
| 183 | P.4 | Canonical lero.al URL for all generated links | `Sprint_9_kickoff_prompt_Task_183.md` |

## Sequencing & dependencies

- **210 runs first** — green the `tsc --noEmit` baseline so every later task's "0 new typecheck errors"
  gate is verifiable (it becomes "0 total"). Added 2026-05-22 after Sonnet surfaced pre-existing fixture
  errors during Task-175 prep (stale `MOCK_USER` fixtures vs the current `User` type — the exact failure
  the Global Change Verification Rule guards against).
- **175 → 177 → 178** (rate source → currency catalog → selector consume it). **176** (m² display) is
  independent of 175 and can run in parallel.
- **179** and **180** are independent (both localization).
- **181**, **182**, **183** are independent; 181 & 182 may share an AuthContext root cause — whoever runs
  them second should reuse the first's fix, not re-patch locally.

## Hard contract (applies to every task here)

Embedded in each kickoff and verified against the diff: no scope change; no self-invented architecture
(stop & ask if ambiguous); literal AC; updates `docs/backlog.md` + `docs/sessions/`; 0 new lint/typecheck
errors; governance PASS; locale parity sq/en/uk/it; responsive 320/375/390/768/1280/1440/2560 where UI;
**Global Change Verification Rule** (no diverging sibling left unfixed); commit + push with a single
`git add -A`, then `git log -1` pasted. **Owner runs all git and all SQL** (single-writer rules).

## Out of scope (this sprint)

UI-primitive consolidation (Epic Q), auth/registration/phone (Epic O), admin panel (Epic R), numeric IDs
(Epic S), UX polish/toasts (Epic T), performance diagnostics (Epic U), and the non-critical tails of
Epics N (Task 184 `<html lang>`) and P (Task 185 stale header name).

## Orchestrator review notes

### Task 175 (M.1) — ✅ APPROVED — 2026-05-22

Reviewed commit `5eb6b6db5` by reading the working tree (git was idle post-push; orchestrator ran NO git).
Diff = 4 files (`src/lib/getExchangeRate.ts` + `docs/integrations.md` + session log + backlog), 195/-45.

- **AC met.** `scrapeIliria98Rates(['EUR','USD','GBP'])` now scrapes all three directly from iliria98;
  `fetchCrossRates()` (open.er-api.com) is demoted to a documented derivation **denominator only**, firing
  solely when a currency is absent from iliria98 and always pivoting through iliria98's EUR/ALL. No
  undocumented second source remains. `convertPrice`, `getExchangeRates` 1h cache, and the public API are
  unchanged. `integrations.md` "Exchange Rate Pipeline" section + session log present.
- **Scope/contract clean.** Only 4 files; no new deps (import = `next/cache` only); no UI/selector/m²/admin
  touched (those are 176/177/178). Locale/responsive N/A (no user-visible text). Good removal of the
  hardcoded `1.08`/`0.86` fallbacks (no stale magic numbers — matches the no-hardcode rule).
- **Carry-over → Task 177 (M.3), not a blocker.** Because the hardcoded fallbacks were removed and
  `ExchangeRates` is a fixed `{EUR,USD,GBP}` shape, if a currency is missing from iliria98 AND
  open.er-api.com is down, `fetchAllRates` returns `null` for the WHOLE batch (EUR conversion breaks too).
  Acceptable now; harden in 177 by making `ExchangeRates` a partial/extensible record so one missing
  currency doesn't null the batch.
- **Process.** Session log confirms tsc shows the 2 pre-existing fixture errors → **Task 210 must run** so
  "0 new typecheck errors" is verifiable for 176–183.

### Found during review — Task 211 (ListingContact action row) opened — 2026-05-22

Reviewing the live listing page (owner screenshot) surfaced two UI-system defects on the desktop contact
card, NOT caused by Task 175/210 (those touched FX + test fixtures only; `ListingContact.tsx` mtime
05:40, `page.tsx` 13:46 — both predate the 175 work at 21:02):
- The secondary-action row **overflows the card** — three `flex-1` buttons, no `min-w-0`/`flex-wrap`, so
  the long uk label «Зберегти в колекцію» pushes the row past `p-5` (localization anti-pattern: uk
  longest strings; toolbars must wrap/shrink).
- The favorite heart **doesn't compose** with its sibling pills (`FavoriteButton` bakes
  `rounded-full w-8 h-8 p-0` that fights the passed `flex-1 h-9 rounded-xl border`).

Both are pre-existing, not regressions, but the owner is right to flag them. Opened **Task 211** (kickoff
`Sprint_9_kickoff_prompt_Task_211.md`) to fix the row via the UI system (compose FavoriteButton via a
size/variant prop + audit all consumers; `min-w-0`/wrap/truncate) verified at all 7 breakpoints AND uk.
Codified the lesson in `docs/ui-rules.md §0` ("Composition — no conflicting baked-in styles" +
"Responsive is non-negotiable"). Last task number now **211**.

### Task 210 — ✅ APPROVED — 2026-05-23

Baseline green: `suspended_until: null` + `inactivity_warning_sent_at: null` added to both `MOCK_USER`
fixtures (`controller.test.ts`, `AuthContext.test.tsx`). `tsc --noEmit` = 0 errors; the auth suites pass.
"0 new typecheck errors" is now verifiable for the rest of Sprint 9. Scope clean (test fixtures only).

### Task 176 (M.2) — ✅ APPROVED — 2026-05-23

Reviewed working tree. Detail page: `pricePerSqm` now derives from `displayPrice` (page.tsx:271) and is
rendered with `displayCurrencyCode` (391); `displayPriceOld` added so the strikethrough old price is also
converted (265-267, 390) — value and label now share one currency in every state. ListingCard: per-m²
now passes `activeCurrency` (was `''`) at line 330 and derives from `displayPrice` (128-129); price + old
price use `activeCurrency` in both view blocks. ListingContact unchanged (already receives pre-converted
props). Canonical `formatPrice`/`convertPrice`; currency codes literal; no new deps; scope respected.
Minor (not blocking): the `t('per_sqm').split('/')[1] ?? 'm²'` parse hack remains — fold a clean key into
a later UX pass.

### Task 211 — ✅ APPROVED — 2026-05-23

`FavoriteButton` now gates `rounded-full w-8 h-8 p-0` behind `shape === 'icon'` (FavoriteButton.tsx:91) and
adds `shape?: 'icon'|'pill'` (default 'icon') — matches the new ui-rules §0 composition rule. ListingContact
row is `flex flex-wrap gap-2` (198) with the heart as `shape="pill"` (206) → wraps instead of overflowing;
both ListingCard consumers keep the default `icon` shape (no card regression). Shared-component change
audited per the Global Change Verification Rule.

**Carry-over → Task 181 (P.1):** `FavoriteButton.test.tsx` has 4 pre-existing failures (mocks `next-intl`
+ `favoriteActions` but NOT `useAuth`/`openAuthSheet`; the `if (!user) return` guard blocks every click).
Verified NOT caused by 211 (the `shape` prop is purely visual). Routed into Task 181's AC — it owns that
guard path and must mock `useAuth` and green the suite. Until 181 lands, this suite stays red by design.

### Tasks 177 (M.3) + 178 (M.4) — ✅ APPROVED — 2026-05-23 (commit `4e61e6afd`)

Verified by grep + reads. **177:** `CURRENCY_OPTIONS` literal removed (grep = 0); `useCurrencies()` is the
single catalog, consumed by `ProfileTab`, filters, homepage; `AdminCurrenciesManager` migrated to §11 (CODE
cell = sole click target → `CurrencyDetailDialog`, Actions column gone); USD/GBP seed SQL idempotent, owner
ran it. **178:** all three currency selectors (`FiltersPanel`, `ListingsFilters`, `ProfileTab`) now use the
canonical `Combobox variant="button"` (grep confirms 0 currency button-rows remain) — `variant="button"`
also means no mobile keyboard, so this incidentally satisfies note 12 for these selectors. Currency excluded
from active-filter counts (unchanged); codes rendered literally. Scope clean; no new deps.
Open hardening (tracked in backlog): `ExchangeRates` still fixed `{EUR,USD,GBP}` — make it extensible so a
catalog currency without an FX rate doesn't silently no-op conversion.

### Task 179 (N.1) — ✅ APPROVED — 2026-05-23

Locale parity verified independently: all four catalogs = **1071** keys (equal sets). 4 concrete mixing
fixes documented in the session log (NotificationItem relative-time locale, Header `admin_dashboard`,
StepLocation GPS labels, MobileBottomNav aria-label) + 5 keys × 4. `tsc` clean. Note: "100% of strings
switch at runtime" is an in-browser check — recommend an owner spot-check per locale on the main flows;
the static audit + parity are sound. **Epic M fully closed; N.1/N.3 next (180 remains).**
