# Project Backlog

> Lightweight index. Full per-task detail lives in `docs/sessions/`. Do **not** paste multi-line per-task blocks into this file — see "Backlog & Session Log Rules" in `docs/ai-behavior.md`. Target: ~80 lines of active content above the Session Archive table. Older "Last Session" blocks are intentionally collapsed into the Session Archive table at the bottom (one row per task, with its log link).

## Last Session

**2026-05-23 — Task 216 — Profile save dead: catalog-driven `preferred_currency` ✅**

- Root cause: `users_preferred_currency_check` was frozen to `('ALL','EUR','USD','GBP')`; selector is catalog-driven (Task 177/214/215) → admin-added currency rejected with Postgres 23514 on save.
- Fix 1: `src/types/database.ts` — `PreferredCurrency = 'ALL'|'EUR'|'USD'|'GBP'` → `PreferredCurrency = string`.
- Fix 2: `src/modules/cabinet/actions/index.ts` — added catalog validation guard before DB write; rejects unknown/inactive codes with `'save_failed'` (no raw 23514 ever reaches the user).
- Fix 3: `src/modules/cabinet/components/ProfileTab.tsx` — removed redundant `as PreferredCurrency` cast + unused import.
- SQL for owner: `DROP CONSTRAINT users_preferred_currency_check` + `ADD CONSTRAINT users_preferred_currency_fkey FOREIGN KEY (preferred_currency) REFERENCES currencies(code) ON UPDATE CASCADE` (see session log).
- Global grep: no frozen `'ALL'|'EUR'|'USD'|'GBP'` union remaining for `preferred_currency`; `ListingCurrency` untouched.
- `tsc --noEmit` → 0 errors.

→ [Task 216 session log](sessions/2026-05-23-task-216-preferred-currency-catalog-driven.md)

**Previous: 2026-05-23 — Task 224 — P0 HOTFIX: registration email-confirmation link 404 ✅**

- Root cause: Send Email Hook (Task 122) sends token_hash `/auth/v1/verify` links; `/auth/callback` only handled PKCE `?code=` → miss redirected to non-localized `${origin}/auth/login` → 404.
- Fix 1: `src/app/auth/confirm/route.ts` (NEW) — token-hash confirmation route; calls `verifyOtp({ token_hash, type })` → `ensureUserProfile()` → redirects to `next`. Cross-device (no PKCE code_verifier cookie needed).
- Fix 2: `auth-email-hook/route.ts` `buildActionUrl` → `buildConfirmUrl`: now builds `${appOrigin}/auth/confirm?token_hash=...&type=...&next=...` for signup/invite/recovery/magiclink. `email_change` stays on Supabase verify (custom cabinet flow; not triggered by hook in production).
- Fix 3: `src/lib/auth/server.ts`: added `verifyOtp()` + extracted shared `ensureUserProfile()` (was local in callback).
- Fix 4: `/auth/callback` fallback fixed: `${origin}/auth/login` → `${origin}/${locale}/auth/login?error=auth_callback_failed` (locale from `next` param).
- Global grep: 0 non-localized `/auth/login` redirects remaining.
- Owner infra: add `https://lero.al/auth/confirm` to Supabase redirect-URL allowlist; set `NEXT_PUBLIC_SITE_URL` explicitly in Vercel.
- `tsc --noEmit` → 0 errors.

→ [Task 224 session log](sessions/2026-05-23-task-224-email-confirm-fix.md)

**Previous: 2026-05-23 — Orchestration (Opus 4.7): 214/215 APPROVED, Sprint 10 + Epic V filed, UI gate hardened**

- Reviewed Tasks 214/215 against the working tree (read-only) → **APPROVED; Epic M CLOSED** (175·176·177·178·214·215). Verdicts in `tasks/Epics/Epic_M_kickoff_prompts.md`.
- Owner reported 6 new issues (2 production regressions + 2 drawer bugs + UI audit + Contacts feature) + a **P0: signup email-confirmation link 404** (`auth/callback` non-localized `/auth/login` fallback + token_hash flow + likely `NEXT_PUBLIC_SITE_URL` env). Grounded each in real code; filed **Sprint 10** (216–221, +**224 P0**) + **Epic V — Contacts** (222–223) with code-anchored kickoffs.
- Hardened `docs/ui-rules.md` (§15 control-height alignment, §16 z-index scale, §17 mandatory UI pre-flight checklist) + the orchestrator review gate — response to the recurring responsive/UI failures.

**Previous: 2026-05-23 — Task 196 — R.2: Admin edit-screen side-panel actions pattern ✅**

- Created `src/components/admin/AdminEditLayout.tsx` — reusable two-column wrapper (`flex-col lg:flex-row`; main = `flex-1 min-w-0`; sidebar = `w-72 xl:w-80 shrink-0 lg:sticky lg:top-20`). Single source for the admin edit-screen layout pattern.
- `src/app/admin/users/[id]/page.tsx`: widened container `max-w-3xl` → `max-w-5xl`.
- `src/components/admin/AdminUserProfile.tsx`: restructured entire render section:
  - Back button + error banner above `AdminEditLayout`.
  - `main` slot: header card, location request, BasicInfo (profile type always `mode="view"`), Contact, Location, Business, PasswordInfo, ChangeLog, StatusHistory.
  - `sidebar` slot: **view mode** — Actions card (Edit, Deactivate, Delete permanently) + Account Status overview (profile type badge, status badge, block info). **Edit/create mode** — Actions card (Save, Cancel) + Role & Status card (profile type Combobox, status Combobox, block reason Input, DatePicker for suspended_until).
  - AccountStatus section removed from main (moved to sidebar).
- 4 locale files (`sq/en/uk/it`): added `admin.user_profile.sections.actions`, `admin.user_profile.sections.role_status`, `admin.user_profile.actions.delete_permanently`.
- `tsc --noEmit` → 0 errors.

→ [Task 196 session log](sessions/2026-05-23-task-196-admin-edit-layout.md)

**Previous: 2026-05-23 — Task 195 — R.1: Fix /admin 404 — locale-prefixed auth redirect ✅**

- Root cause: `AdminLayout` redirected unauthenticated users to `/auth/login?next=/admin` — a path that doesn't exist (login lives at `/{locale}/auth/login`). The `admin-locale` cookie was read after the redirect, too late to use.
- Fix (`src/app/admin/layout.tsx`): moved `cookies()` + `resolveLocale()` to top of function, before `getUser()`. Changed redirects:
  - Unauthenticated: `/auth/login?next=/admin` → `/${locale}/auth/login?next=/admin`
  - Non-admin: `/` → `/${locale}` (consistent locale prefix)
- Auth flow now: unauthenticated → `/{locale}/auth/login?next=/admin` (AuthRedirect stores next in sessionStorage, opens AuthSheet) → after login → `/admin` → admin layout passes role check → dashboard.
- `tsc --noEmit` → 0 errors.

→ [Task 195 session log](sessions/2026-05-23-task-195-admin-auth-redirect.md)

**Previous: 2026-05-23 — Task 194 — Q.5: Card/list view toggle — smooth active-state rounding ✅**

- `src/modules/listings/components/ListingsSortBar.tsx`: replaced `border border-border rounded-xl overflow-hidden` container + `rounded-none` buttons with segmented-control pattern: `bg-muted rounded-xl p-1` container + `size="icon-sm"` buttons (built-in `rounded-[min(var(--radius-md),12px)]` ≈ 9.6px). No `overflow-hidden` → active state has its own smooth token-consistent rounding.
- Icons: `h-4 w-4` → `size-4` (prevents `icon-sm`'s SVG size override).
- Outer height preserved: 28px button + 4px padding × 2 = 36px = h-9.
- `tsc --noEmit` → 0 errors.

→ [Task 194 session log](sessions/2026-05-23-task-194-view-toggle-rounding.md)

**Previous: 2026-05-23 — Task 193 — Q.4: Listings status tabs — canonical Tabs + remove stray border ✅**

- `src/modules/listings/components/ListingsStatusTabs.tsx`: replaced parallel implementation (custom `TabButton` + `Button` + `border-b` container + manual `border-b-2 -mb-px` active state) with canonical `Tabs/TabsList/TabsTrigger` (`variant="line"`). Removed `Button`, `cn` imports.
- Controlled via `value={activeTab} onValueChange={switchTab}` — URL navigation logic unchanged.
- `variant="line"` gives per-tab underline indicator (`::after` pseudo-element) with no full-width `border-b` across the container.
- `tsc --noEmit` → 0 errors.

→ [Task 193 session log](sessions/2026-05-23-task-193-listings-tabs.md)

**Previous: 2026-05-23 — Task 192 — Q.3: Header icon buttons — single canonical config ✅**

- `src/components/layout/Header.tsx`: defined module-level `const ICON_BTN = 'rounded-xl'` — single override applied to all header icon-action buttons.
- Favorites (auth Link): changed from `size="sm" px-2 gap-1` to `size="icon" + ICON_BTN`; icon from `h-4 w-4` → `size-5` (matches NotificationBell).
- Favorites (unauth Button): same — `size="icon" + ICON_BTN`; icon `h-4 w-4` → `size-5`.
- Mobile hamburger SheetTrigger: added `ICON_BTN` (was `size="icon"` without `rounded-xl`).
- NotificationBell: already correct (`size="icon" rounded-xl size-5`) — no change.
- All 3 surfaces now: 40×40px square, `rounded-xl`, `variant="ghost"`, 20px icon.
- `tsc --noEmit` → 0 errors.

→ [Task 192 session log](sessions/2026-05-23-task-192-header-icon-buttons.md)

**Previous: 2026-05-23 — Task 191 — Q.2: Suppress mobile keyboard on non-typeable comboboxes ✅**

- `src/components/shared/PropertyTypeCombobox.tsx`: switched from default `variant="input"` to `variant="button"` — renders a `<button>` trigger instead of `<input>`, so mobile keyboard no longer pops on tap; removed dead `onKeyDown` prop (unused in button mode).
- `src/components/shared/HeroSearch.tsx`: removed stale `onKeyDown={handleKeyDown}` from `<PropertyTypeCombobox>` (prop deleted from interface).
- All other comboboxes already correct: `LocationCombobox` + `YearCombobox` are legitimately typeable (`variant="input"`); currency/locale/saved-search comboboxes already had `variant="button"`.
- Fix is canonical — one change in the wrapper component, no per-page hacks.
- `tsc --noEmit` → 0 errors.

→ [Task 191 session log](sessions/2026-05-23-task-191-mobile-keyboard.md)

**Previous: 2026-05-23 — Task 190 — Q.1: Combobox consolidation — fold LocationCombobox + YearCombobox into canonical ✅**

- `src/components/shared/Combobox.tsx`: added 3 props — `clearLabel?: string` (always-visible deselect item at top of list), `inputMode?` (passed to `<input>`), `onInputChange?` (fires on each keystroke before onChange, for live-parse wrappers).
- `src/components/shared/LocationCombobox.tsx`: removed ~130 lines of parallel internals (own state, createPortal, dropdown, raw `<input role="combobox">`). Now thin wrapper: maps `locations` → `ComboboxOption[]`, passes `clearLabel={tc('all_locations')}`, delegates all popover/filter/a11y to canonical Combobox. "Add location" admin sub-form kept intact below.
- `src/components/shared/YearCombobox.tsx`: removed ~90 lines of parallel internals. Now thin wrapper: maps `YEAR_OPTIONS` → `ComboboxOption[]`, passes `inputMode="numeric"` + `onInputChange` for live-while-typing year parse.
- `PropertyTypeCombobox.tsx` already compliant (no change).
- Grep proof: `createPortal|role="combobox"|updateDropdownPosition` in `src/components/shared/` → only `Combobox.tsx` (DatePicker has `[open, setOpen]` for calendar popup, not a combobox parallel).
- `tsc --noEmit` → 0 errors.

→ [Task 190 session log](sessions/2026-05-23-task-190-combobox-consolidation.md)

**Previous: 2026-05-23 — Task 189 — O.4: reversible agent-registration step ✅**

- `src/modules/auth/components/AuthSheet.tsx`:
  - Added `SharedRegFields` interface (`name / email / password / phone`).
  - `RegisterView` gained `onBack?`, `initialShared?`, `onSharedChange?` props.
  - `useState` for name/email/password/phone now seeds from `initialShared` — preserves fields across view switch.
  - Each field's `onChange` calls `onSharedChange?.()` to keep `AuthSheet.regShared` in sync.
  - When `isAgent && onBack`: renders `← {t('register_back_to_standard')}` text link at top of form.
  - `AuthSheet` lifts `regShared` state; resets it when sheet opens; passes to both RegisterViews + `onBack={() => setView('register')}` for agent view.
- 4 locale files: added `auth.register_back_to_standard` (sq/en/uk/it).
- `tsc --noEmit` → 0 errors.

→ [Task 189 session log](sessions/2026-05-23-task-189-agent-step-back.md)

**Previous: 2026-05-23 — Task 188 — O.3: client-side validation for email / password / phone / WhatsApp ✅**

- `src/modules/auth/components/AuthSheet.tsx` (LoginView): added `EMAIL_RE.test(email)` + `!password` guards before `signIn()` — fires `error_email_invalid` / `error_weak_password` without a server round-trip.
- `src/modules/cabinet/components/ProfileTab.tsx`: added module-level `EMAIL_RE`; `handleEmailChange` now validates format before calling `initiateEmailChange` → fires `t('error_email_invalid')`.
- All 4 locale files (`sq/en/uk/it`): added `cabinet.error_phone_invalid`, `cabinet.error_phone_no_country_code`, `cabinet.error_email_invalid` — ProfileTab phone-validation toasts now resolve to real strings.
- Remaining surfaces: RegisterView (email + password + phone already validated since Task 158/186); ResetPasswordClient (min-8 + mismatch already validated); AdminUserCreate/Profile (Zod schema + country-aware in onSubmit already in place).
- `tsc --noEmit` → 0 errors.

→ [Task 188 session log](sessions/2026-05-23-task-188-validation.md)

**Previous: 2026-05-23 — Task 187 — O.2: full European country codes + searchable country dropdown ✅**

- `src/lib/phone/index.ts`: `COUNTRY_CODES` expanded from 13 → 45 entries; all European/EU sovereign states included; Russia explicitly absent; Albania first (default); US kept for diaspora; sorted A-Z after Albania.
- `src/components/shared/Combobox.tsx`: added `dropdownMinWidth?: number` prop; applied to portal `dropdownStyle.width = max(rect.width, dropdownMinWidth)` and non-portal `style={{ minWidth: dropdownMinWidth }}`. Backward-compatible (defaults to undefined).
- `src/components/shared/PhoneField.tsx`: `variant="button"` → `variant="input"` (enables live search); option mapping adds `description: c.label` so Combobox filters on both dial code AND country name; `dropdownMinWidth={200}` ensures country names are readable despite the 90px trigger width.
- **Task 186 — O.1** (phone consolidation): already done by Task 158 (Sprint 4) — PhoneField docstring confirms "Replaces four local copies"; all editable phone/WhatsApp inputs use PhoneField; zero `type="tel"` outside PhoneField in production code.
- `tsc --noEmit` → 0 errors.

→ [Task 187 session log](sessions/2026-05-23-task-187-european-country-codes.md)

**Previous: 2026-05-23 — Task 212 — P.5: inline "Create collection" from "Add to collection" ✅**

- `SaveToCollectionButton.tsx`: added `createCollection` to existing action imports; added `Input` import; added `newName`/`isCreating` state + `handleCreate()`.
- `handleCreate`: calls `createCollection(name)` then `addToCollection(newId, listingId)` in one flow; updates `collections` + `memberIds` optimistically; shows `created` toast.
- Dialog: replaced flat ternary with fragment — empty-state shown above the always-visible inline create form (`Input` + `Button`); existing collection-list behavior unchanged.
- No new i18n keys — all strings use existing `collections` namespace keys: `name_placeholder`, `create`, `created`, `no_collections`, `error_generic`.
- `tsc --noEmit` → 0 errors.

→ [Task 212 session log](sessions/2026-05-23-task-212-inline-create-collection.md)

**Previous: 2026-05-23 — Task 185 — P.3: clear stale profile name in header after self-delete ✅**

- Root cause: `handleDeleteAccount` called `router.push()` directly after the server-side delete. The server did `db.auth.admin.signOut(userId)` but the Supabase JS SDK doesn't fire a synchronous `SIGNED_OUT` event from server-side token invalidation — the client auth state (`AuthController`) remained at `{ user: <stale> }` through the redirect.
- Fix: added `useAuth` import + `const { signOut } = useAuth()` in `ProfileTab.tsx`. Replaced `router.push(...)` with `signOut(() => router.push(...))` — same pattern as `handleLogout` in `Header.tsx`. `AuthController.signOut()` commits `{ user: null }` synchronously (via `signing_out` → `unauthenticated` transition) and calls `coreSignOut()` to clear the local Supabase session before the router navigates.
- `tsc --noEmit` → 0 errors.

→ [Task 185 session log](sessions/2026-05-23-task-185-stale-header-after-delete.md)

**Previous: 2026-05-23 — Task 213 — T.4: unify list/card price template; per-m² now in List view ✅**

- Root cause: `ListingCard.tsx` had two duplicated price blocks — vertical had price + old + per-m²; horizontal had price + old only, per-m² missing.
- Fix: extracted `PriceBlock` (interface + function) above `ListingCard`; it renders price row, old/strikethrough, original price string, and per-m² via one `flex items-start justify-between` layout. `priceSize: 'base' | 'lg'` controls font size (base = horizontal, lg = vertical).
- Horizontal: replaced inline price block with `<div className="mt-2"><PriceBlock ... priceSize="base" /></div>`.
- Vertical: replaced `<div className="flex items-start justify-between">` block with `<PriceBlock ... priceSize="lg" />`.
- No `formatPrice` calls remain outside `PriceBlock` for card price rendering. `tsc --noEmit` → 0 errors.

→ [Task 213 session log](sessions/2026-05-23-task-213-price-block-unification.md)

**Previous: 2026-05-23 — Task 184 — N.2: fix `<html lang>` so browser stops offering to translate ✅**

- Root cause: `app/layout.tsx` rendered `<html>` with no `lang`; locale layout had `<div lang={locale}>` (wrong element — browser ignores it).
- Fix: made `RootLayout` async; reads `X-NEXT-INTL-LOCALE` request header (set by next-intl middleware on every locale-prefixed route) with fallback to `admin-locale` cookie (admin routes excluded from middleware) and final fallback `'sq'`. Sets `lang={locale}` on `<html>`.
- Removed now-redundant `<div lang={locale}>` wrapper in `[locale]/layout.tsx`; replaced with a React fragment.
- `tsc --noEmit` → 0 errors.

→ [Task 184 session log](sessions/2026-05-23-task-184-html-lang.md)

**Previous: 2026-05-23 — Task 215 — M.6: multi-currency conversion on every card surface ✅**

- `useHomepageFilters` + `FiltersPanel`: `rate` (EUR-only) → `rates` map; exchange-rate hint now shows `rates[currency]` for the selected currency.
- `FeaturedListings`, `LatestListings`: added `useExchangeRate` + `useAuth`; pass `displayCurrency={user?.preferred_currency ?? 'ALL'}` + `rates` to every `ListingCard`.
- `RecentlyViewedGrid`: same pattern (hooks added directly; component stays client-only).
- `SimilarListings` (Server Component): parallel `getExchangeRates()` + `getUser()` + profile query for preferred_currency; `displayCurrency` + `rates` passed to each card.
- `ListingCard`: removed deprecated `exchangeRate` prop; replaced `effectiveRates` fallback `{ EUR, USD: /1.08, GBP: /0.86 }` with `rates ?? null`. All surfaces now use real iliria98 rates.
- grep `1.08`/`0.86` → no matches. `tsc --noEmit` → 0 errors.

→ [Task 215 session log](sessions/2026-05-23-task-215-multi-currency-cards.md)

**Previous: 2026-05-23 — Task 214 — M.5: dynamic FX engine over the currency catalog ✅**

- `ExchangeRates` type changed from `{ EUR; USD; GBP }` to `Record<string, number>` (extensible).
- `fetchAllRates()` now reads active currency codes from DB (`currencies` table, admin client, dynamic import) with `['EUR','USD','GBP']` fallback when DB unavailable.
- `scrapeIliria98Rates()` now operates on the catalog-driven list (no hardcoded currency list).
- `fetchCrossRates()` generalised to accept arbitrary codes (one open.er-api.com request covers all missing codes).
- Policy: iliria98 absent → derivation fallback; both absent → currency excluded (never faked). Documented in `docs/integrations.md`.
- Remaining `1.08`/`0.86` hardcode is in `ListingCard.tsx:114` — Task 215 scope.
- `tsc --noEmit` → 0 errors.

→ [Task 214 session log](sessions/2026-05-23-task-214-dynamic-fx-engine.md)

**Previous: 2026-05-23 — Sprint 9 (Task 183 — P.4: canonical lero.al URL for all generated links) ✅**

- Root cause: `AuthSheet.tsx` used `window.location.origin` for OAuth callback, password-reset, and sign-up confirmation URLs → emails linked to localhost/preview host.
- Fix: added `src/lib/siteUrl.ts` (`SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lero.al'`); replaced 3 occurrences in AuthSheet. Navigation guard in `useUnsavedChangesGuard.ts` untouched.
- `tsc --noEmit` → 0 errors.

→ [Task 183 session log](sessions/2026-05-23-task-183-canonical-site-url.md)

**Previous: 2026-05-23 — Sprint 9 (Task 182 — P.2: contact card "Account deleted" for guests/zombies) ✅**

- Root cause: `isGuest = !authUser` too broad — zombie sessions (JWT valid, no `public.users` row) gave truthy `authUser` → `ownerRaw = null` → fallback set `deleted_at: 'deleted'` → "Account deleted" shown.
- Fix: added `hasValidProfile = !!profileResult.data` inside `if (authUser)` block; changed `isGuest = !authUser || !hasValidProfile`; fallback `deleted_at` changed from conditional `'deleted'` to always `null`. `canReport` updated to guard via `!isGuest`.
- `tsc --noEmit` → 0 errors.

→ [Task 182 session log](sessions/2026-05-23-task-182-contact-card-deleted-fix.md)

**Previous: 2026-05-23 — Sprint 9 (Task 181 — P.1: guest favorite click opens auth flow) ✅**

- Root cause: guard checked `status === 'unauthenticated'` but status is transiently `'refreshing'` during visibility sync → click silently swallowed. Test suite also failed (no `useAuth` mock → default context `status: 'initializing'` blocked all click tests).
- Fix: changed guard to `status !== 'signing_out'`; added `useAuth`/`openAuthSheet` mocks + 3 new guest tests. 12/12 tests green.

→ [Task 181 session log](sessions/2026-05-23-task-181-guest-favorite-auth.md)

**Previous: 2026-05-23 — Sprint 9 (Task 180 — N.3: admin↔site two-way locale persistence) ✅**

- Root cause: middleware cookie sync (`admin-locale` ← URL locale on every public-site request) overwrites admin user's chosen locale from any background/concurrent public-site request; `Header.switchLocale()` already calls `setAdminLocale()` making the middleware sync redundant and harmful.
- Fix: removed middleware sync block; added `setRequestLocale(locale)` to admin layout so child server components (incl. `email-templates`) inherit correct locale without individual `getAdminLocale()` calls.
- `tsc --noEmit` → 0 errors.

→ [Task 180 session log](sessions/2026-05-23-task-180-admin-locale-persistence.md)

**Previous: 2026-05-23 — Sprint 9 (Task 179 — N.1: deep locale-mixing audit + fixes) ✅**

- All 4 locale files had identical key sets; 4 mixing bugs fixed: `NotificationItem` relative-time locale; `Header` `admin_dashboard`; `StepLocation` GPS labels; `MobileBottomNav` aria-label.
- +5 keys × 4 locales → parity at **1071**. `tsc --noEmit` → 0 errors.

→ [Task 179 session log](sessions/2026-05-23-task-179-locale-mixing-audit.md)

(Earlier sessions are in the Session Archive table at the bottom.)

## Pending Action Items

None open. (Historical ops items — Task 122 Send Email Hook config; Epic F Tasks 136/137 SQL — both done 2026-05-22.)

## Next Immediate Tasks

**Sprint 9 — ✅ CLOSED.** **Epic M — ✅ CLOSED** (175·176·177·178·214·215). Tasks 184–196, 212, 213, 185 shipped 2026-05-23 (owner ran them in sequence; diffs spot-reviewable on request).

**Sprint 10 — Critical Regressions + Drawer + UI Consistency (OPEN):**
**224 ✅** (P0 HOTFIX — done) → **216 ✅** (profile save dead — catalog-driven `preferred_currency`, drop frozen CHECK; owner SQL in session log) → **217** (listings 500 / 42703 — add `offer_type`+`purchase_conditions` columns + form fields) → **218** (homepage drawer footer buttons overflow) → **219** (drawer z-index vs sticky header) → **220** (`/listings` toolbar height/spacing/combobox) → **221** (project-wide canonical control-height/spacing/combobox audit).
Then resume **R (197–202) → S (203–204) → T (205–207) → U (208–209)**, and **Epic V — Contacts LAST** (222 public page+form+routing, 223 admin inquiries + Resend reply).
Plans: `Sprint_10_—_Critical_Regressions_and_UI_Consistency.md` + `Sprint_10_kickoff_prompts.md`; `Epic_V_Contacts_and_Inquiries.md` + `Epic_V_kickoff_prompts.md`. **Last task number: 224.**

> **224 is P0 — registration is broken right now (email-confirmation link 404); run it first.** Then 216 + 217 (production-breaking: profile save + listings filter), both needing owner SQL (exact SQL written into each task's session log). UI tasks (218–221) MUST include the **§17 UI pre-flight** output in their session log, or the orchestrator will not approve them. Task 224: env ruled out (owner-confirmed). Root cause (git-verified — no app code regressed today): the Email Hook (Task 122, active ~2026-05-22) sends a token_hash `/auth/v1/verify` link, but the app only had a PKCE `/auth/callback` → confirmation can't complete → non-localized `/auth/login` 404. Fix: `/auth/confirm` route (`verifyOtp`) + repoint the hook + locale-safe fallbacks; keep `/auth/callback` for OAuth.

Every task MUST follow the Canonical Task Template in `docs/ai-behavior.md`. Per-task verdicts: Sprint 9 file (175–183, 210/211), `Epic_M_kickoff_prompts.md` (214/215), `Sprint_10_…` (216+).

## Active product backlog — Epics M–U (from `issues.txt`, opened 2026-05-22)

Sequencing: **M ✅ · N ✅ · O ✅ · P ✅ · Q ✅** done → OPEN **Sprint 10 (216–221)** next → then resume **R (195–196 ✅; 197–202 open) · S open · T (213 ✅; 205–207 open) · U open** → **Epic V — Contacts (222–223) LAST.** Tasks 175–223, global numbering.

| Epic | Tasks | Notes | Plan | Kickoffs |
|---|---|---|---|---|
| M — Currency & Exchange-Rate Integrity (reopened) | 175–178, 214–215 | 3, 32, 5, 21, +FX | [`Epic_M_…`](../tasks/Epics/Epic_M_Currency_and_Exchange_Rate_Integrity.md) | Sprint 9 (175–178) · [`Epic_M_kickoff_prompts.md`](../tasks/Epics/Epic_M_kickoff_prompts.md) (214–215) |
| N — Localization Consistency v2 | 179, 180, 184 | 15, 31, 4 | [`Epic_N_…`](../tasks/Epics/Epic_N_Localization_Consistency_v2.md) | Sprint 9 (179, 180) · [`Epic_N_kickoff_prompts.md`](../tasks/Epics/Epic_N_kickoff_prompts.md) (184) |
| O — Auth, Registration & Phone Input | 186–189 | 8, 9, 13, 7 | [`Epic_O_…`](../tasks/Epics/Epic_O_Auth_Registration_and_Phone_Input.md) | [`Epic_O_kickoff_prompts.md`](../tasks/Epics/Epic_O_kickoff_prompts.md) |
| P — Favorites, Guest-Auth & Account Lifecycle | 181–183, 185, 212 | 17, 18, 16, 19, +UX | [`Epic_P_…`](../tasks/Epics/Epic_P_Favorites_Guest_Auth_and_Account_Lifecycle.md) | Sprint 9 (181–183) · [`Epic_P_kickoff_prompts.md`](../tasks/Epics/Epic_P_kickoff_prompts.md) (185) |
| Q — Combobox & UI Primitive Single-Source | 190–194 | 1, 12, 6, 22, 23 | [`Epic_Q_…`](../tasks/Epics/Epic_Q_Combobox_and_UI_Primitive_Single_Source.md) | [`Epic_Q_kickoff_prompts.md`](../tasks/Epics/Epic_Q_kickoff_prompts.md) |
| R — Admin Panel 2026 | 195–202 | 20, 34, 33, 28, 29, 30, 26, 27 | [`Epic_R_…`](../tasks/Epics/Epic_R_Admin_Panel_2026.md) | [`Epic_R_kickoff_prompts.md`](../tasks/Epics/Epic_R_kickoff_prompts.md) |
| S — Domain Numeric IDs | 203–204 | 24, 25 | [`Epic_S_…`](../tasks/Epics/Epic_S_Domain_Numeric_IDs.md) | [`Epic_S_kickoff_prompts.md`](../tasks/Epics/Epic_S_kickoff_prompts.md) |
| T — Global UX Polish & Forms | 205–207, 213 | 35, 36, 2 | [`Epic_T_…`](../tasks/Epics/Epic_T_Global_UX_Polish_and_Forms.md) | [`Epic_T_kickoff_prompts.md`](../tasks/Epics/Epic_T_kickoff_prompts.md) |
| U — Performance & RSC Diagnostics | 208–209 | 10, 11 | [`Epic_U_…`](../tasks/Epics/Epic_U_Performance_and_RSC_Diagnostics.md) | [`Epic_U_kickoff_prompts.md`](../tasks/Epics/Epic_U_kickoff_prompts.md) |
| Sprint 10 — Critical Regressions + UI Consistency | 216–221 | owner bugs 2026-05-23 | [`Sprint_10_…`](../tasks/Sprints/Sprint_10_—_Critical_Regressions_and_UI_Consistency.md) | [`Sprint_10_kickoff_prompts.md`](../tasks/Sprints/Sprint_10_kickoff_prompts.md) |
| V — Contacts & Inquiries (LAST) | 222–223 | owner req 2026-05-23 | [`Epic_V_…`](../tasks/Epics/Epic_V_Contacts_and_Inquiries.md) | [`Epic_V_kickoff_prompts.md`](../tasks/Epics/Epic_V_kickoff_prompts.md) |

> Rule-type notes codified into `/docs` during planning: 14 (verify-globally → `ai-behavior.md`), 16 (canonical URL → `env.md`; code in Task 183), 6 + 1 (button/Combobox single-source → `ui-rules.md §0`), plus composition + responsive rules added to `ui-rules.md §0` from the Task 211 review.
>
> **214/215 ✅ done & APPROVED** (Epic M closed). New work 2026-05-23 → **Sprint 10 (216–221)**: profile-save regression (catalog-driven `preferred_currency`), listings 42703 (`offer_type`/`purchase_conditions` columns+form), drawer footer overflow + z-index scale, `/listings` toolbar consistency, project-wide UI audit; + **Epic V (222–223)** Contacts page + admin inquiries (Resend reply). UI gate hardened in `ui-rules.md §15–§17`.

## Closed sprints & epics (historical)

- **Epic A — Localization & Locale Consistency** (Tasks 91, 103–106) — CLOSED (superseded by Epic N v2).
- **Epic B — Auth, Registration & Agent Onboarding** (Tasks 108, 112–115) — CLOSED, see [`Epic_B_Summary_CLOSED.md`](../tasks/Epics/Epic_B_Summary_CLOSED.md)
- **Epic C — Trust, Safety & Moderation** (Tasks 116–118, 125–126) — CLOSED, see [`Epic_C_Summary_CLOSED.md`](../tasks/Epics/Epic_C_Summary_CLOSED.md)
- **Epic D — Email Infrastructure & Account Lifecycle** (Tasks 119–124, 166) — CLOSED, see [`Epic_D_Summary_CLOSED.md`](../tasks/Epics/Epic_D_Summary_CLOSED.md)
- **Epic E — Search, Filters & Saved Search UX** (Tasks 131–133) — CLOSED.
- **Epic F — Favorites Improvements** (Tasks 134–137) — CLOSED, see [`Epic_F_Favorites_Improvements.md`](../tasks/Epics/Epic_F_Favorites_Improvements.md)
- **Epic G — Recently Viewed Listings** (Tasks 138–140, 163–165) — CLOSED.
- **Epic H — Cloudinary Storage Hygiene** (Tasks 141–147) — CLOSED.
- **Epic I — Listing Lifecycle & Status Rules** (Tasks 148–150) — CLOSED.
- **Epic J — Popular Locations Management** (Tasks 151–153) — CLOSED.
- **Epic K — Admin Tables Standardization** (Tasks 127–130) — CLOSED, canonical pattern in `docs/component-governance.md §11`.
- **Epic L — Admin Dashboard 2026** (Tasks 154–155; L.3 folded into L.2) — CLOSED.
- **Sprint 0 — Critical Bugfix / Regression Stabilization** (Tasks 84–90) — CLOSED.
- **Sprint 1 — Bugfix Continuation & Admin Polish** (Tasks 91–102) — CLOSED.
- **Sprint 2 — Technical Debt Cleanup** (Task 107) — CLOSED.
- **Sprint 3 — Primitive & Tailwind Debt Burn-down** (Tasks 109–111) — CLOSED.
- **Sprint 4 — Auth Phone Validation & Flow Consolidation** (Tasks 158–159) — CLOSED.
- **Sprint 5 / 7 / 8** (Tasks 167–168, 170–174) — CLOSED.
- **Listing Detail Performance / LCP Epic** (Tasks 72–83) — CLOSED.
- **Post-Governance Debt Burn-down** (Tasks 64–71) · **Future Maintenance Direction** (Tasks 58–63) · **Responsive/UI Governance** (Tasks 51–57) · **Filter Architecture Stabilization** (Task 50.4) — all CLOSED.
- **I.3 deferred** — Listing status helper API migration `(status) → (listing)`. Trigger: publishing/moderation/lifecycle automation. See `docs/domain-rules.md §Listing Status Helpers — evolution trigger`.

## Session Archive

| Date | Description | Tasks | File |
|------|-------------|-------|------|
| 2026-05-23 | Task 216 — Profile save dead: PreferredCurrency string; catalog validation guard; DROP users_preferred_currency_check + FK (owner SQL) | Task 216 | [sessions/2026-05-23-task-216-preferred-currency-catalog-driven.md](sessions/2026-05-23-task-216-preferred-currency-catalog-driven.md) |
| 2026-05-23 | Task 224 — P0 HOTFIX: /auth/confirm route (verifyOtp token-hash); buildConfirmUrl in hook; ensureUserProfile extracted; callback fallback locale-aware | Task 224 | [sessions/2026-05-23-task-224-email-confirm-fix.md](sessions/2026-05-23-task-224-email-confirm-fix.md) |
| 2026-05-23 | Task 196 — R.2 admin edit-screen layout: AdminEditLayout two-column wrapper; AdminUserProfile sidebar actions/role-status | Task 196 | [sessions/2026-05-23-task-196-admin-edit-layout.md](sessions/2026-05-23-task-196-admin-edit-layout.md) |
| 2026-05-23 | Task 195 — R.1 /admin 404 fix: locale-prefixed auth redirect; cookies/resolveLocale before getUser | Task 195 | [sessions/2026-05-23-task-195-admin-auth-redirect.md](sessions/2026-05-23-task-195-admin-auth-redirect.md) |
| 2026-05-23 | Task 194 — Q.5 view toggle rounding: segmented-control (bg-muted p-1) + icon-sm; h-9 preserved | Task 194 | [sessions/2026-05-23-task-194-view-toggle-rounding.md](sessions/2026-05-23-task-194-view-toggle-rounding.md) |
| 2026-05-23 | Task 193 — Q.4 listings status tabs → canonical Tabs (variant=line); removed custom border-b | Task 193 | [sessions/2026-05-23-task-193-listings-tabs.md](sessions/2026-05-23-task-193-listings-tabs.md) |
| 2026-05-23 | Task 192 — Q.3 header icon buttons single config (ICON_BTN rounded-xl; 40×40 size-5 across all 3) | Task 192 | [sessions/2026-05-23-task-192-header-icon-buttons.md](sessions/2026-05-23-task-192-header-icon-buttons.md) |
| 2026-05-23 | Task 191 — Q.2 suppress mobile keyboard: PropertyTypeCombobox variant=button; removed dead onKeyDown | Task 191 | [sessions/2026-05-23-task-191-mobile-keyboard.md](sessions/2026-05-23-task-191-mobile-keyboard.md) |
| 2026-05-23 | Task 190 — Q.1 combobox consolidation: LocationCombobox + YearCombobox folded into canonical Combobox | Task 190 | [sessions/2026-05-23-task-190-combobox-consolidation.md](sessions/2026-05-23-task-190-combobox-consolidation.md) |
| 2026-05-23 | Task 189 — O.4 reversible agent-registration step (SharedRegFields, onBack, field preservation) | Task 189 | [sessions/2026-05-23-task-189-agent-step-back.md](sessions/2026-05-23-task-189-agent-step-back.md) |
| 2026-05-23 | Task 188 — O.3 client-side validation (login email/password; ProfileTab email; phone toasts ×4) | Task 188 | [sessions/2026-05-23-task-188-validation.md](sessions/2026-05-23-task-188-validation.md) |
| 2026-05-23 | Task 187 — O.2 European country codes: 13→45 entries, Russia excluded, Combobox dropdownMinWidth, PhoneField variant=input + description for name search | Tasks 186+187 | [sessions/2026-05-23-task-187-european-country-codes.md](sessions/2026-05-23-task-187-european-country-codes.md) |
| 2026-05-23 | Task 212 — P.5 inline create-collection: createCollection+addToCollection in one flow; Input+Button always visible below collection list | Task 212 | [sessions/2026-05-23-task-212-inline-create-collection.md](sessions/2026-05-23-task-212-inline-create-collection.md) |
| 2026-05-23 | Task 185 — P.3 stale header after self-delete: signOut() called before router.push; AuthController commits user:null synchronously | Task 185 | [sessions/2026-05-23-task-185-stale-header-after-delete.md](sessions/2026-05-23-task-185-stale-header-after-delete.md) |
| 2026-05-23 | Task 213 — T.4 PriceBlock unification: per-m² added to horizontal list view; shared PriceBlock(priceSize) replaces two diverged price blocks | Task 213 | [sessions/2026-05-23-task-213-price-block-unification.md](sessions/2026-05-23-task-213-price-block-unification.md) |
| 2026-05-23 | Task 184 — N.2 html lang: RootLayout async + X-NEXT-INTL-LOCALE header; admin-locale cookie fallback; div lang removed from locale layout | Task 184 | [sessions/2026-05-23-task-184-html-lang.md](sessions/2026-05-23-task-184-html-lang.md) |
| 2026-05-23 | Task 215 — M.6 multi-currency cards: useHomepageFilters/FiltersPanel rates, FeaturedListings/LatestListings/SimilarListings/RecentlyViewedGrid wired, 1.08/0.86 removed | Task 215 | [sessions/2026-05-23-task-215-multi-currency-cards.md](sessions/2026-05-23-task-215-multi-currency-cards.md) |
| 2026-05-23 | Task 214 — M.5 dynamic FX engine: catalog-driven scrape, Record<string,number> ExchangeRates, generalised fetchCrossRates | Task 214 | [sessions/2026-05-23-task-214-dynamic-fx-engine.md](sessions/2026-05-23-task-214-dynamic-fx-engine.md) |
| 2026-05-23 | Sprint 9 — Task 211 — contact-card action row: flex-wrap overflow fix + FavoriteButton shape prop (icon/pill) | Task 211 | [sessions/2026-05-23-task-211-contact-card-action-row.md](sessions/2026-05-23-task-211-contact-card-action-row.md) |
| 2026-05-23 | Sprint 9 — Task 210 — green tsc baseline: suspended_until + inactivity_warning_sent_at on both MOCK_USER fixtures; 0 tsc errors | Task 210 | [sessions/2026-05-23-task-210-tsc-baseline-green.md](sessions/2026-05-23-task-210-tsc-baseline-green.md) |
| 2026-05-23 | Sprint 9 — Task 179 — N.1 locale-mixing audit: 4 fixes (NotificationItem/Header/StepLocation/MobileBottomNav) + 5 keys ×4 (1071) | Task 179 | [sessions/2026-05-23-task-179-locale-mixing-audit.md](sessions/2026-05-23-task-179-locale-mixing-audit.md) |
| 2026-05-23 | Sprint 9 — Task 178 — M.4 currency selector → canonical Combobox (FiltersPanel/ListingsFilters/ProfileTab; variant=button) | Task 178 | [sessions/2026-05-22-task-178-currency-combobox.md](sessions/2026-05-22-task-178-currency-combobox.md) |
| 2026-05-23 | Sprint 9 — Task 177 — M.3 single currency catalog; AdminCurrencies §11; USD/GBP seed (owner SQL) | Task 177 | [sessions/2026-05-22-task-177-currency-catalog.md](sessions/2026-05-22-task-177-currency-catalog.md) |
| 2026-05-23 | Sprint 9 — Task 176 — price/m² currency fix: displayPrice for per-m², displayPriceOld strikethrough, activeCurrency label | Task 176 | [sessions/2026-05-23-task-176-price-per-sqm-currency-fix.md](sessions/2026-05-23-task-176-price-per-sqm-currency-fix.md) |
| 2026-05-22 | Sprint 9 — Task 175 — M.1 iliria98 canonical FX source; open.er-api demoted to documented fallback denominator | Task 175 | [sessions/2026-05-22-task-175-iliria98-fx-source.md](sessions/2026-05-22-task-175-iliria98-fx-source.md) |
| 2026-05-22 | Sprint 8 — Task 173 — 3 new interfaces (CollectionItem, FavoritePriceAlert, ReportAction); map 24 tables/217 cols | Task 173 | [sessions/2026-05-22-task-173-untyped-tables.md](sessions/2026-05-22-task-173-untyped-tables.md) |
| 2026-05-22 | Sprint 8 — Task 172 — schema-drift guard: check-schema-drift.mjs, schema-drift-check.sql (21 tables/204 cols), qa-rules doc | Task 172 | [sessions/2026-05-22-task-172-schema-drift-guard.md](sessions/2026-05-22-task-172-schema-drift-guard.md) |
| 2026-05-22 | Sprint 7 — Task 170 — `error_phone_invalid`+`error_phone_no_country_code` in `admin.user_profile.validation` × 4 locales | Task 170 | [sessions/2026-05-22-task-170-phone-validation-i18n.md](sessions/2026-05-22-task-170-phone-validation-i18n.md) |
| 2026-05-22 | Sprint 7 — Task 171 — Delete button hidden for non-admins in AdminEmailTemplatesManager; isAdmin prop from page | Task 171 | [sessions/2026-05-22-task-171-email-delete-admin-only-ui.md](sessions/2026-05-22-task-171-email-delete-admin-only-ui.md) |
| 2026-05-22 | Task 162 — E.5 ADR verification: ADR committed, clean working tree, no stray changes | Task 162 | [sessions/2026-05-22-task-162-e5-adr-verify.md](sessions/2026-05-22-task-162-e5-adr-verify.md) |
| 2026-05-22 | Task 161 — Email template delete admin-only: assertAdmin() + RLS matrix documented | Task 161 | [sessions/2026-05-22-task-161-email-template-delete-admin-only.md](sessions/2026-05-22-task-161-email-template-delete-admin-only.md) |
| 2026-05-22 | Task 160 — Block/suspension enforcement: getBlockedError helper, 7 actions, auto-lift, i18n | Task 160 | [sessions/2026-05-22-task-160-block-suspension-enforcement.md](sessions/2026-05-22-task-160-block-suspension-enforcement.md) |
| 2026-05-22 | Task 157 — Recovery security logging: IP+UA+correlationId; email hash; LOG_CORRELATION_SALT | Task 157 | [sessions/2026-05-22-task-157-recovery-security-logging.md](sessions/2026-05-22-task-157-recovery-security-logging.md) |
| 2026-05-22 | Epic L.2 — Dashboard built: 6 KPI cards, status bars, Epic K recent listings, pending reports panel | Task 155 | [sessions/2026-05-22-task-155-l2-dashboard-build.md](sessions/2026-05-22-task-155-l2-dashboard-build.md) |
| 2026-05-22 | Epic L.1 — Dashboard discovery: P0 metrics, wireframes, index plan; signed off | Task 154 | [sessions/2026-05-22-task-154-l1-dashboard-discovery.md](sessions/2026-05-22-task-154-l1-dashboard-discovery.md) |
| 2026-05-22 | Epic J.3 — Filter link: `?location_id=<id>` confirmed canonical; Epic J CLOSED | Task 153 | [sessions/2026-05-22-task-153-j3-filter-link.md](sessions/2026-05-22-task-153-j3-filter-link.md) |
| 2026-05-22 | Epic J.2 — Popular Locations SSR public section; Server Component; hides when empty | Task 152 | [sessions/2026-05-22-task-152-j2-popular-locations-public.md](sessions/2026-05-22-task-152-j2-popular-locations-public.md) |
| 2026-05-22 | Epic J.1 — Popular locations admin CRUD (§11 pattern, photo upload, 4 locales) | Task 151 | [sessions/2026-05-22-task-151-j1-popular-locations-admin.md](sessions/2026-05-22-task-151-j1-popular-locations-admin.md) |
| 2026-05-22 | Epic I.3 — Helper API evolution trigger documented; Epic I CLOSED | Task 150 | [sessions/2026-05-22-task-150-i3-helper-api-evolution.md](sessions/2026-05-22-task-150-i3-helper-api-evolution.md) |
| 2026-05-22 | Epic I.2 — Status helpers: grep verified; helpers table + evolution trigger in domain-rules.md | Task 149 | [sessions/2026-05-22-task-149-i2-status-helpers.md](sessions/2026-05-22-task-149-i2-status-helpers.md) |
| 2026-05-22 | Epic I.1 — "New" badge: hardcoded 7 → LISTING_NEW_DAYS; domain-rules.md rule added | Task 148 | [sessions/2026-05-22-task-148-i1-new-badge-fix.md](sessions/2026-05-22-task-148-i1-new-badge-fix.md) |
| 2026-05-22 | Epic H.7 — Company logo folder companies/<id>/; folder tree complete; Epic H CLOSED | Task 147 | [sessions/2026-05-22-task-147-h7-other-photos-folder.md](sessions/2026-05-22-task-147-h7-other-photos-folder.md) |
| 2026-05-22 | Epic H.5 — Listing image cleanup: orphan diff in updateListing + bulk cleanup in deleteListing | Task 146 | [sessions/2026-05-22-task-146-h5-listing-image-cleanup.md](sessions/2026-05-22-task-146-h5-listing-image-cleanup.md) |
| 2026-05-22 | Epic H.3 — Avatar cleanup: read old URL → upload → DB update → deleteAsset(old) | Task 145 | [sessions/2026-05-22-task-145-h3-avatar-replacement-cleanup.md](sessions/2026-05-22-task-145-h3-avatar-replacement-cleanup.md) |
| 2026-05-22 | Epic H.6 — deleteAsset safety wrapper: reference check, dry-run, structured log, 5 tests | Task 144 | [sessions/2026-05-22-task-144-h6-cloudinary-safety-audit.md](sessions/2026-05-22-task-144-h6-cloudinary-safety-audit.md) |
| 2026-05-22 | Epic H.4 — Listing image folder: uploadFolder prop chain; create=user/listings, edit=user/listings/id | Task 143 | [sessions/2026-05-22-task-143-h4-listing-image-folder.md](sessions/2026-05-22-task-143-h4-listing-image-folder.md) |
| 2026-05-22 | Epic H.2 — Avatar folder: `<user_id>/avatars/` in upload-avatar route | Task 142 | [sessions/2026-05-22-task-142-h2-avatar-folder.md](sessions/2026-05-22-task-142-h2-avatar-folder.md) |
| 2026-05-22 | Epic H.1 — Cloudinary folder infrastructure: shared uploadToCloudinary, publicIdFromUrl, folder tree docs | Task 141 | [sessions/2026-05-22-task-141-h1-cloudinary-folder-structure.md](sessions/2026-05-22-task-141-h1-cloudinary-folder-structure.md) |
| 2026-05-22 | Epic D — Task 166 — Seed email_templates: saved_search_alert + price_change_alert × 4 locales (SQL) | Task 166 | [sessions/2026-05-22-task-166-seed-email-templates.md](sessions/2026-05-22-task-166-seed-email-templates.md) |
| 2026-05-22 | Epic G — Task 165 — RecentlyViewedGrid split + Storybook story + STORY_TARGETS for 7 breakpoints | Task 165 | [sessions/2026-05-22-task-165-recently-viewed-screenshots.md](sessions/2026-05-22-task-165-recently-viewed-screenshots.md) |
| 2026-05-22 | Epic G — Task 164 — correctness closure: showClear scope fix, DB migration confirmed, locale parity | Task 164 | [sessions/2026-05-22-task-164-epic-g-closure.md](sessions/2026-05-22-task-164-epic-g-closure.md) |
| 2026-05-22 | Epic G — Task 163 — P0 recovery: G.2 wiring committed, recentlyViewedQueries.ts staged, build restored | Task 163 | [sessions/2026-05-22-task-163-epic-g-recovery.md](sessions/2026-05-22-task-163-epic-g-recovery.md) |
| 2026-05-22 | Epic G.3 — Clear recently viewed history (clearRecentlyViewed action, Dialog+toast) | Task 140 | [sessions/2026-05-22-task-140-g3-clear-recently-viewed.md](sessions/2026-05-22-task-140-g3-clear-recently-viewed.md) |
| 2026-05-22 | Epic G.2 — Recently viewed UI block (RecentlyViewedSection, listing detail + profile, 4 locales) | Task 139 | [sessions/2026-05-22-task-139-g2-recently-viewed-ui.md](sessions/2026-05-22-task-139-g2-recently-viewed-ui.md) |
| 2026-05-22 | Epic G.1 — Track recently viewed (recently_viewed table+RLS+RPC, cookie for guests, Tracker) | Task 138 | [sessions/2026-05-22-task-138-g1-recently-viewed-tracking.md](sessions/2026-05-22-task-138-g1-recently-viewed-tracking.md) |
| 2026-05-22 | Epic F.3 — Price-change notifications (cron, favorite_price_alerts, email+in-app, dedup) | Task 137 | [sessions/2026-05-22-task-137-f3-price-change-notifications.md](sessions/2026-05-22-task-137-f3-price-change-notifications.md) |
| 2026-05-22 | Epic F.2 — Favorites collections (CollectionsSection, SaveToCollectionButton, DB schema, 20 i18n keys) | Task 136 | [sessions/2026-05-22-task-136-f2-favorites-collections.md](sessions/2026-05-22-task-136-f2-favorites-collections.md) |
| 2026-05-22 | Epic F.4 — Favorites API refactor (addFavorite/removeFavorite; toggleFavorite deleted) | Task 135 | [sessions/2026-05-22-task-135-f4-favorites-api-refactor.md](sessions/2026-05-22-task-135-f4-favorites-api-refactor.md) |
| 2026-05-22 | Epic F.1 — Favorites pagination 25/page (paginated query, loading skeleton, error state, 4 locales) | Task 134 | [sessions/2026-05-22-task-134-f1-favorites-pagination.md](sessions/2026-05-22-task-134-f1-favorites-pagination.md) |
| 2026-05-21 | Task 159 — Sprint 4 — Auth flow consolidation (AuthSheet canonical, legacy forms deleted) | Task 159 | [sessions/2026-05-21-task-159-auth-flow-consolidation.md](sessions/2026-05-21-task-159-auth-flow-consolidation.md) |
| 2026-05-21 | Task 158 — Sprint 4 — Country-aware phone validation (libphonenumber-js, shared PhoneField, 25 tests) | Task 158 | [sessions/2026-05-21-task-158-country-aware-phone-validation.md](sessions/2026-05-21-task-158-country-aware-phone-validation.md) |
| 2026-05-21 | Epic E.5 — URL-state vs server-state ADR (docs/state-authority.md) | Task 133 | [sessions/2026-05-21-task-133-e5-url-state-adr.md](sessions/2026-05-21-task-133-e5-url-state-adr.md) |
| 2026-05-21 | Epic E.4 — Saved-search match notifications (cron + frequency UI + email template) | Task 132 | [sessions/2026-05-21-task-132-e4-saved-search-notifications.md](sessions/2026-05-21-task-132-e4-saved-search-notifications.md) |
| 2026-05-21 | Epic E.1 — Horizontal filter bar (ListingsFilterBar on md+, sidebar removed) | Task 131 | [sessions/2026-05-21-task-131-e1-horizontal-filter-bar.md](sessions/2026-05-21-task-131-e1-horizontal-filter-bar.md) |
| 2026-05-21 | Epic K.4 — All remaining admin tables migrated to canonical pattern | Task 130 | [sessions/2026-05-21-task-130-k4-remaining-tables-canonical.md](sessions/2026-05-21-task-130-k4-remaining-tables-canonical.md) |
| 2026-05-21 | Epic K.3 — AdminUsersTable migrated to canonical pattern | Task 129 | [sessions/2026-05-21-task-129-k3-users-table-canonical.md](sessions/2026-05-21-task-129-k3-users-table-canonical.md) |
| 2026-05-21 | Epic K.2 — AdminListingsTable migrated to canonical pattern | Task 128 | [sessions/2026-05-21-task-128-k2-listings-table-canonical.md](sessions/2026-05-21-task-128-k2-listings-table-canonical.md) |
| 2026-05-21 | Epic K.1 — Canonical AdminTableRow pattern defined (docs/component-governance.md §11) | Task 127 | [sessions/2026-05-21-task-127-k1-admin-table-pattern.md](sessions/2026-05-21-task-127-k1-admin-table-pattern.md) |
| 2026-05-21 | Epic C.5 — Account blocking / suspension tools (suspended_until column, admin DatePicker) | Task 126 | [sessions/2026-05-21-task-126-account-blocking.md](sessions/2026-05-21-task-126-account-blocking.md) |
| 2026-05-21 | Epic C.4 — Reporter notification flow (ReporterNotificationEmail + in-app on status change) | Task 125 | [sessions/2026-05-21-task-125-reporter-notification.md](sessions/2026-05-21-task-125-reporter-notification.md) |
| 2026-05-21 | Epic D.5 — Inactivity emails (re-engagement send schedule + templates) | Task 124 | [sessions/2026-05-21-task-124-inactivity-emails.md](sessions/2026-05-21-task-124-inactivity-emails.md) |
| 2026-05-21 | Epic D.7 — Admin email template manager | Task 123 | [sessions/2026-05-21-task-123-admin-email-template-manager.md](sessions/2026-05-21-task-123-admin-email-template-manager.md) |
| 2026-05-21 | Epic D.6 — Supabase Send Email Hook (/api/auth-email-hook, HMAC-SHA256 sig verification) | Task 122 | [sessions/2026-05-21-task-122-supabase-email-hook.md](sessions/2026-05-21-task-122-supabase-email-hook.md) |
| 2026-05-21 | Epic D.4 — Password recovery (RecoveryEmail, /auth/reset-password, security logging) | Task 121 | [sessions/2026-05-21-task-121-password-recovery.md](sessions/2026-05-21-task-121-password-recovery.md) |
| 2026-05-20 | Epic D.3 — Email verification (VerifyEmail template, /auth/verified page, admin email status badge) | Task 120 | [sessions/2026-05-20-task-120-email-verification.md](sessions/2026-05-20-task-120-email-verification.md) |
| 2026-05-20 | Epic D.1 — Email foundation (BaseEmail, send helper, preferred_locale, emailChange migration) | Task 119 | [sessions/2026-05-20-task-119-email-provider-setup.md](sessions/2026-05-20-task-119-email-provider-setup.md) |
| 2026-05-20 | Epic C.3 — Admin reports dashboard (/admin/reports CRUD + audit log) | Task 118 | [sessions/2026-05-20-task-118-c3-admin-reports-dashboard.md](sessions/2026-05-20-task-118-c3-admin-reports-dashboard.md) |
| 2026-05-20 | Epic C.2 — User report flow (ListingReportDialog, reportListingAction) | Task 117 | [sessions/2026-05-20-task-117-c2-user-report-flow.md](sessions/2026-05-20-task-117-c2-user-report-flow.md) |
| 2026-05-20 | Epic C.1 — Trust & safety research (protection stack decision) | Task 116 | [sessions/2026-05-20-task-116-c1-trust-safety-research.md](sessions/2026-05-20-task-116-c1-trust-safety-research.md) |
| 2026-05-20 | Epic B.5 — Admin company management (/admin/companies CRUD, sidebar nav, Dialog modals) | Task 115 | [sessions/2026-05-20-task-115-admin-company-management.md](sessions/2026-05-20-task-115-admin-company-management.md) |
| 2026-05-20 | Epic B.4 — Company logo upload (API route, client validation, blob preview, non-fatal upload) | Task 114 | [sessions/2026-05-20-task-114-company-logo-upload.md](sessions/2026-05-20-task-114-company-logo-upload.md) |
| 2026-05-20 | Epic B.3 — Agent company selection (companies table, CompanyField, service-role action) | Task 113 | [sessions/2026-05-20-task-113-agent-company-selection.md](sessions/2026-05-20-task-113-agent-company-selection.md) |
| 2026-05-20 | Epic B.2 — Agent city selection (LocationCombobox + portal in AuthSheet, 2 i18n keys × 4 locales) | Task 112 | [sessions/2026-05-20-task-112-agent-city-selection.md](sessions/2026-05-20-task-112-agent-city-selection.md) |
| 2026-05-20 | Sprint 3 — Task 111 — Tailwind entropy burn-down (M:15→M:0, L:43→L:31) | Task 111 | [sessions/2026-05-20-task-111-tailwind-entropy-burndown.md](sessions/2026-05-20-task-111-tailwind-entropy-burndown.md) |
| 2026-05-20 | Sprint 3 — Task 110 — Mobile drawer padding fix (px-4 in Header.tsx drawer) | Task 110 | [sessions/2026-05-20-task-110-mobile-drawer-padding.md](sessions/2026-05-20-task-110-mobile-drawer-padding.md) |
| 2026-05-20 | Sprint 3 — Task 109 — Primitive debt burn-down (H:87→H:57, governance gate PASS) | Task 109 | [sessions/2026-05-20-task-109-primitive-debt-burndown.md](sessions/2026-05-20-task-109-primitive-debt-burndown.md) |
| 2026-05-19 | Epic B.1 — Side popup auth (AuthSheet + error-code contract) | Task 108 | [sessions/2026-05-19-task-108-side-popup-auth.md](sessions/2026-05-19-task-108-side-popup-auth.md) |
| 2026-05-19 | Sprint 2 — Remove dead-code avatar server actions | Task 107 | [sessions/2026-05-19-task-107-remove-dead-avatar-actions.md](sessions/2026-05-19-task-107-remove-dead-avatar-actions.md) |
| 2026-05-19 | Epic A.4 — Mobile locale switcher promoted to header as Combobox | Task 106 | [sessions/2026-05-19-task-106-mobile-locale-switcher-header.md](sessions/2026-05-19-task-106-mobile-locale-switcher-header.md) |
| 2026-05-19 | Epic A.3 — Locale persistence site ↔ admin (middleware cookie sync) | Task 105 | [sessions/2026-05-19-task-105-locale-persistence-admin.md](sessions/2026-05-19-task-105-locale-persistence-admin.md) |
| 2026-05-19 | Epic A.2 — Language name + currency-code policy verification | Task 104 | [sessions/2026-05-19-task-104-language-names-currency-policy.md](sessions/2026-05-19-task-104-language-names-currency-policy.md) |
| 2026-05-19 | Epic A.1 — Full locale audit + API error contract implementation | Task 103 | [sessions/2026-05-19-task-103-locale-audit.md](sessions/2026-05-19-task-103-locale-audit.md) |
| 2026-05-19 | Sprint 1 — closure summary (12 tasks) | Sprint 1 | [sessions/2026-05-19-sprint-1-bugfix-continuation.md](sessions/2026-05-19-sprint-1-bugfix-continuation.md) |
| 2026-05-19 | Sprint 1 — Tasks 91–102 (locale fallback, language names, dropdown clipping, mobile spacing, combobox, translate APIs) | Tasks 91–102 | [sessions/2026-05-19-sprint-1-bugfix-continuation.md](sessions/2026-05-19-sprint-1-bugfix-continuation.md) |
| 2026-05-19 | Sprint 0 — Tasks 84–90 (contact card guest/owner, locale fallbacks, currency label, favorite, dropdown clipping, mobile spacing) | Tasks 84–90 | [sessions/2026-05-19-task-84-listing-contact-card-guest-owner-status.md](sessions/2026-05-19-task-84-listing-contact-card-guest-owner-status.md) |
| 2026-05-19 | Listing Detail Performance / LCP Epic — CLOSED (Speed Insights RES 100); Tasks 72–83 | Tasks 72–83 | [sessions/2026-05-19-listing-detail-lcp-epic-closure-speed-insights.md](sessions/2026-05-19-listing-detail-lcp-epic-closure-speed-insights.md) |
| 2026-05-18 | Post-Governance Debt Burn-down (ESLint taxonomy → closure); Tasks 64–71 | Tasks 64–71 | [sessions/2026-05-18-post-governance-debt-burndown-closure.md](sessions/2026-05-18-post-governance-debt-burndown-closure.md) |
| 2026-05-18 | Future Maintenance Direction Epic (governance, CI, tailwind entropy, Storybook, screenshots, cataloging); Tasks 58–63 | Tasks 58–63 | [sessions/2026-05-18-component-cataloging.md](sessions/2026-05-18-component-cataloging.md) |
| 2026-05-18 | Responsive / UI Governance Epic — 7 phases | Tasks 51–57 | [sessions/2026-05-18-ui-governance-epic.md](sessions/2026-05-18-ui-governance-epic.md) |
| 2026-05-18 | Filter Architecture Stabilization + SSR/Navigation Hardening | Task 50.4 | [sessions/2026-05-18-task-50.4.md](sessions/2026-05-18-task-50.4.md) |
| 2026-05-17 | Notifications, Saved Searches, Currency, Property Types, Admin fixes, i18n | Tasks 17.1, 21–50.3 | [sessions/2026-05-17-tasks-17-50.md](sessions/2026-05-17-tasks-17-50.md) |
| 2026-05-16 | Admin panel, User Profile, Auth, Performance, Favorites, Listings | Tasks 12–20 + bootstrap | [sessions/2026-05-16-tasks-12-19.md](sessions/2026-05-16-tasks-12-19.md) |
