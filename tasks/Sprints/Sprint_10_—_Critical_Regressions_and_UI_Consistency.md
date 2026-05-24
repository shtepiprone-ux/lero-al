# Sprint 10 — Critical Regressions + Drawer + UI Consistency

**Status:** ✅ CLOSED — all tasks 224/216/217/218/219/220/221a done 2026-05-23–24.
**Source:** owner-reported bugs 2026-05-23 (after Tasks 184–196/212/213/185 shipped).

Two of these are **production-breaking data regressions** (profile save dead; listings fetch 500s on a
common filter combo). They lead the sprint. The remaining three are recurring UI/responsive-correctness
defects + a project-wide audit, because the same class of bug keeps re-appearing — see the hardened UI
pre-flight gate added to `docs/ui-rules.md` (this sprint).

Kickoffs: `Sprint_10_kickoff_prompts.md` (Tasks 216–221a).

## Shared hard contract (every task)

No scope change; no invented architecture (STOP & ask if ambiguous); literal AC; update
`docs/backlog.md` + `docs/sessions/`; 0 new lint/typecheck errors; `npm run build` passes; governance
PASS; locale parity sq/en/uk/it; responsive 320/375/390/768/1280/1440/2560 where UI; Global Change
Verification Rule; **mandatory UI pre-flight checklist in `docs/ui-rules.md`** for any task that touches
UI; commit + single `git add -A` then `git log -1` (owner runs git/SQL).

## Tasks

| # | Task | Type | Severity | Owner SQL? |
|---|------|------|----------|------------|
| 224 | **P0 HOTFIX** — signup email-confirmation link 404 | bug/auth | **P0 (registration broken)** | no (owner env check) |
| 216 | Profile save dead — catalog-driven `preferred_currency` (drop frozen CHECK) | bug/data | **critical** | yes |
| 217 | Listings 500 (42703) — add `offer_type` + `purchase_conditions` columns + form fields | bug/data/feature | **critical** | yes |
| 218 | Homepage drawer footer buttons overflow / clip (responsive) | bug/UI | high | no |
| 219 | Homepage drawer overlapped by sticky header — z-index layering scale | bug/UI | high | no |
| 220 | `/listings` toolbar consistency — canonical control height + spacing + combobox | bug/UI | medium | no |
| 221a | Project-wide canonical control-height + spacing + combobox audit | chore/UI | medium | no |

## Sequencing

**224 (P0 hotfix — registration broken) → 216 → 217** (critical data) → 218 → 219 → 220 → 221a. Then resume R → S → T → U; Epic V (Contacts) last.

## Root-cause notes (verified against the working tree 2026-05-23)

- **224 (P0):** signup confirmation link → `${SUPABASE_URL}/auth/v1/verify?...&redirect_to=${SITE_URL}/auth/callback?next=/${locale}/auth/verified`. `auth/callback/route.ts` handles only `?code=` and on any miss redirects to `${origin}/auth/login` (L30) — a non-localized route that does not exist → **404** (the lone non-localized `/auth/login`, sibling Task 195 missed). Env ruled out (owner-confirmed): `NEXT_PUBLIC_SITE_URL` absent → fallback `https://lero.al` = correct prod host; allowlist OK. **CONFIRMED trigger (git-verified — no app code regressed today):** the Send Email Hook (Task 122) became active ~2026-05-22, so Supabase now sends the custom **token_hash** `/auth/v1/verify` link instead of its default PKCE **code** link; the app's `/auth/callback` only handles PKCE `?code=`, so confirmation can't complete → non-localized `/auth/login` → 404. Fix: add `/auth/confirm` route using `verifyOtp({token_hash,type})`, repoint the email hook's `buildActionUrl` at it, locale-safe fallbacks; keep `/auth/callback` for OAuth.
- **216:** `ProfileTab` `CurrencySelector` is fed by the **catalog** (`useCurrencies().filter(is_active)`,
  `ProfileTab.tsx:51–54`), but `PreferredCurrency` is a frozen union `'ALL'|'EUR'|'USD'|'GBP'`
  (`types/database.ts:4`) and the DB has `users_preferred_currency_check` matching it. An admin-added
  catalog currency appears in the profile dropdown → `updateCabinetProfile` (`cabinet/actions/index.ts:47`)
  → `23514 check_violation`. Incomplete global change from Tasks 177/214/215.
- **217:** `applyListingFilters` does `.eq('offer_type', …)` (`filterEngine.ts:243`) and
  `.overlaps('purchase_conditions', …)` (`filterEngine.ts:248`); both columns are missing from `listings`
  → `42703 undefined_column` → `Failed to fetch listings` (api/listings/route.ts + listings/page.tsx).
  `listingFields.ts:27–28` tags them "filter-panel only" but the columns were never migrated.
- **218:** `FiltersPanel` footer (`FiltersPanel.tsx:445–458`) — two `size="xl"` `flex-1` buttons with
  icons + long uk labels in a `max-w-sm` panel → clip/overflow. Same class as Task 211.
- **219:** Header is `sticky top-0 z-50` (`Header.tsx:127`); drawer panel `z-50` + backdrop `z-40`
  (`FiltersPanel.tsx:99,109`). Header ties the panel and is never dimmed by the backdrop. `z-50` is
  overloaded across dialog/sheet/popover/combobox. Needs a layering scale.
- **220:** `ListingsSortBar` + `ListingsFilterBar` already use canonical `Combobox`, but control heights
  (Combobox `sm`=h-9 vs sibling buttons / grid-list toggle) and bar spacing (`py-3 border-b`, tabs
  "pressed against the panel") are inconsistent.
- **221a:** Owner reports many more UI spots with height/spacing/combobox drift — full audit pass.

## Orchestrator review verdicts

_(filled after each task's diff is reviewed against the working tree)_
