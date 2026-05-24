# Sprint 10 — kickoff prompts (Tasks 216–221a)

> Shared hard contract (top of every prompt): You are Claude Code Sonnet 4.6 working in `lero-al`.
> No scope change; no invented architecture — if anything is ambiguous, STOP and ask the orchestrator.
> Literal AC only. Update `docs/backlog.md` + add a `docs/sessions/` log. 0 new lint/typecheck errors;
> `npm run build` passes; governance PASS. Locale parity sq/en/uk/it (every new string ×4). Responsive
> 320/375/390/768/1280/1440/2560 for any UI. Apply the **Global Change Verification Rule** and, for any
> task that touches UI, the **UI pre-flight checklist** in `docs/ui-rules.md` (canonical control height,
> canonical spacing, Combobox-only, z-index scale, all 7 breakpoints). Owner runs git + SQL: end with a
> single `git add -A` then `git log -1`; for any schema change, write the exact SQL into the session log
> for the owner to run — do NOT run SQL yourself.

---

## Task 224 — P0 HOTFIX — Signup email-confirmation link 404

```
Hard contract: see top. PRODUCTION P0 — no one can complete registration. Run this BEFORE 216/217.

BUG (production): the registration email-confirmation button/link returns 404 after the user clicks it.

Root cause (verified against the working tree — TWO compounding defects + one likely env trigger):
- The confirmation link is built by the email hook as
  `${SUPABASE_URL}/auth/v1/verify?token=<token_hash>&type=signup&redirect_to=${SITE_URL}/auth/callback?next=/${locale}/auth/verified`
  (`src/app/api/auth-email-hook/route.ts` buildActionUrl ~L189-191, signup case ~L232-241;
  `AuthSheet.tsx:550` sets the `emailRedirectTo`).
- `src/app/auth/callback/route.ts` ONLY handles the PKCE `?code=` branch (L13-28). On any miss it
  redirects to `${origin}/auth/login` (L30) — a NON-LOCALIZED path that does NOT exist (login lives at
  `/[locale]/auth/login`) → **404**. This is the lone non-localized `/auth/login` left in the repo
  (grep proof: every other one is `/${locale}/auth/login`); it is the sibling Task 195 missed.
- Env RULED OUT as the cause (owner-confirmed 2026-05-23): `NEXT_PUBLIC_SITE_URL` is absent → `SITE_URL`
  falls back to `'https://lero.al'`, which IS the correct production host; the Supabase redirect allowlist
  already contains `https://lero.al/auth/callback`. So the host is correct — the 404 is the callback
  LOGIC above, not the link host. (Setting `NEXT_PUBLIC_SITE_URL` explicitly is still good hygiene.)
- CONFIRMED — not an application-code regression. The 2026-05-23 auth commits are all behaviourally
  irrelevant to this flow (git-verified diffs): 183 = `window.location.origin`→`SITE_URL` host swap
  (identical host on lero.al); 184 = `<html lang>` layouts; 188 = +3 lines validation; 189 = register
  field-preservation (does NOT touch the `signUp`/`emailRedirectTo` line). The TRIGGER is the **Send
  Email Hook (Task 122) becoming active ~2026-05-22**: once active, Supabase sends the CUSTOM email whose
  link is the Supabase `/auth/v1/verify?token=<token_hash>&type=signup` (**token_hash / OTP**) endpoint.
  That endpoint CONSUMES the token_hash and redirects to `redirect_to` (`/auth/callback`) WITHOUT a
  PKCE `?code=` our SSR callback can use → `if(code)` is skipped → non-localized `/auth/login` → 404.
  Before the hook was active, Supabase's DEFAULT email used a PKCE code link that `/auth/callback`
  handled — that is exactly why it "worked yesterday". Fix = use the Supabase SSR **token_hash**
  pattern (a `verifyOtp` confirm route the email points at), not the PKCE callback.

Pre-read:
- src/app/auth/callback/route.ts (whole file), src/app/api/auth-email-hook/route.ts (buildActionUrl +
  signup/recovery/magiclink/email_change cases), src/lib/auth/server.ts (exchangeCodeForSession;
  add verifyOtp helper if needed), src/modules/auth/components/AuthSheet.tsx (L550 emailRedirectTo;
  L186 reset redirectTo; L89 oauth)
- src/app/[locale]/auth/verified/page.tsx, src/app/[locale]/auth/confirm-email/page.tsx (existing
  token_hash-style page for the EMAIL-CHANGE flow — reference for verifyOtp usage), src/middleware.ts
  (matcher already excludes /auth/*), Task 195 + Task 183 session logs, docs/env.md, docs/rls-rules.md

Scope:
1. Adopt the Supabase SSR **token_hash** pattern for link-based confirmation emails:
   a. Add `src/app/auth/confirm/route.ts` (non-localized, sibling of `callback`) that reads `token_hash`,
      `type`, `next`, calls `supabase.auth.verifyOtp({ type, token_hash })` (add a `verifyOtp` helper in
      `lib/auth/server.ts` mirroring `exchangeCodeForSession`), then on success runs `ensureUserProfile()`
      (reuse/extract the one currently inside `callback/route.ts`) and redirects to `next`. On failure →
      the locale-aware login fallback (item 3). token_hash verify works cross-device (no PKCE
      code_verifier cookie needed) — this is the core of the fix.
   b. Repoint the email hook to OUR confirm route instead of Supabase's verify endpoint. In
      `auth-email-hook/route.ts` `buildActionUrl`, for link-based emails produce
      `${appOrigin}/auth/confirm?token_hash=<token_hash>&type=<type>&next=<next>` — derive `appOrigin`
      + `next` from the existing `redirect_to` (which already carries
      `${SITE_URL}/auth/callback?next=/${locale}/...`; reuse that origin and locale, point at
      `/auth/confirm`, and forward the user to `/${locale}/auth/verified` (signup) or the appropriate
      `next` for recovery/magiclink/email_change). Map each `email_action_type` to the correct
      `verifyOtp` `type` (signup/invite, recovery, magiclink, email_change). If any type mapping is
      ambiguous against the installed Supabase SDK, STOP and ask the orchestrator.
      CAVEAT — email_change: the cabinet already has its OWN custom email-change flow (custom
      `email_change_tokens` table + `consumeEmailChangeToken` + `/[locale]/auth/confirm-email`, see
      `src/modules/cabinet/actions/index.ts`). Before repointing the hook's `email_change` case, confirm
      whether Supabase-native email_change is actually used; if the custom flow is the live one, do NOT
      reroute email_change through `verifyOtp` (would regress it) — leave it as-is and note this in the
      session log. The P0 must-fix is signup confirmation (+ recovery + magiclink which clearly go
      through the hook).
   c. Keep `/auth/callback` for the OAuth (Google) PKCE `?code=` flow — that is still correct; do not
      remove it. Just fix its fallback (item 3).
2. Verify end-to-end (this is the acceptance gate, not optional): register a NEW account, open the
   confirmation email, click the link → user is signed in and lands on `/${locale}/auth/verified`.
   Test BOTH same-browser and a DIFFERENT browser (cross-device), since that was the failing case.
   Also confirm recovery + magic-link links still work after the hook repoint.
3. Make EVERY failure/edge path locale-aware in BOTH `/auth/confirm` and `/auth/callback` — derive the
   locale from `next` (parse the leading `/(sq|en|uk|it)/…`) or fall back to `'sq'`; redirect to
   `/${locale}/auth/login?error=auth_callback_failed` (NEVER the non-localized `/auth/login`). Guard the
   no-`next` default so it can't drop the locale.
4. Global Change Verification Rule: grep the repo for any other non-localized `/auth/...` redirect or
   `${origin}/auth/...` and fix them (the callback fallback is the only one found today — confirm none
   others were added). Keep the happy-path success URL `/${locale}/auth/verified` unchanged.

Note: env is NOT the fix (owner confirmed `NEXT_PUBLIC_SITE_URL` absent → fallback `https://lero.al`
is the correct host; allowlist already includes `https://lero.al/auth/callback`). Still note in the
session log that setting `NEXT_PUBLIC_SITE_URL` explicitly in prod is recommended hygiene (docs/env.md),
and add `${SITE_URL}/auth/confirm` to the Supabase redirect-URL allowlist (owner infra step).

Acceptance criteria:
- Registering a new account, opening the confirmation email, and clicking the link signs the user in and
  lands on `/${locale}/auth/verified` — verified end-to-end, including the cross-device case (link opened
  in a different browser than the one that signed up).
- No path in the confirmation/callback flow can reach the non-localized `/auth/login`; failures land on
  `/${locale}/auth/login?error=auth_callback_failed`.
- Email confirmation goes through `/auth/confirm` (`verifyOtp`), and the email hook's `buildActionUrl`
  points at `/auth/confirm` (not Supabase's `/auth/v1/verify`); OAuth still uses `/auth/callback`
  (`exchangeCodeForSession`). Recovery + magic-link links verified still working after the repoint.
- grep shows zero non-localized `/auth/login` redirects; owner env/allowlist note documented.
- 0 new lint/typecheck errors; `npm run build` passes; 4 locales (any new error string); backlog +
  session log updated.

Out of scope: redesigning the email templates; the other Sprint 10 tasks.
```

---

## Task 216 — Profile save dead: catalog-driven `preferred_currency`

```
Hard contract: see top.

BUG (production): saving the cabinet profile fails with Postgres 23514
`users_preferred_currency_check`. Root cause (verified): the profile currency selector is fed by the
DB currency catalog, but the column's validity is frozen to 4 values — an admin-added catalog currency
is offered in the dropdown and then rejected on save. This is an incomplete global change from Tasks
177/214/215 (currencies became catalog-driven everywhere EXCEPT users.preferred_currency).

Pre-read:
- src/modules/cabinet/components/ProfileTab.tsx (CurrencySelector ~L51–54: useCurrencies().filter(is_active);
  default 'ALL' ~L97)
- src/modules/cabinet/actions/index.ts (updateCabinetProfile ~L23–58: writes preferred_currency)
- src/types/database.ts (PreferredCurrency = 'ALL'|'EUR'|'USD'|'GBP' ~L4; User.preferred_currency ~L107)
- src/modules/currency/hooks/useCurrencies.ts + the currencies catalog/table (Task 177)
- Task 214/215 session logs (catalog-driven FX); docs/data-access-rules.md; docs/rls-rules.md

Scope:
1. Make `users.preferred_currency` catalog-driven, mirroring how FX/cards now work. Replace the frozen
   union `PreferredCurrency` with a catalog-driven type (`type PreferredCurrency = string`) and update
   all references so typecheck stays green. Do NOT silently keep a parallel hardcoded list.
2. DB: the frozen CHECK must go. Write the EXACT SQL into the session log for the OWNER to run — do not
   run it. Recommended (decide + document; STOP & ask if unsure): drop `users_preferred_currency_check`
   and add a FK `users.preferred_currency REFERENCES currencies(code)` so only catalog codes are valid
   and it auto-extends when an admin adds a currency. Ensure 'ALL' exists in `currencies` (it is the
   pivot) so the default remains valid; if 'ALL' is NOT a catalog row, STOP and ask before choosing the
   constraint shape.
3. App-level guard: validate the submitted currency against the active catalog in `updateCabinetProfile`
   before the update, returning a localized error instead of leaking a raw 23514 (defense in depth).
4. Confirm the selector default ('ALL') and any other writer of preferred_currency (grep) are consistent
   with the new rule (Global Change Verification Rule — find EVERY writer/validator).

Acceptance criteria:
- Saving the profile with ANY active catalog currency (including an admin-added one) succeeds; an
  inactive/unknown code is rejected with a localized error, never a raw DB 23514.
- No frozen 4-value currency list remains for preferred_currency (type + DB + app all catalog-driven);
  grep shows no `'ALL'|'EUR'|'USD'|'GBP'` union for this field.
- Exact SQL migration written to the session log for the owner; 0 new lint/typecheck errors; build passes;
  4 locales for any new error string; backlog + session log updated.

Out of scope: changing the FX engine (Task 214) or card display (Task 215).
```

---

## Task 217 — Listings 500 (42703): add `offer_type` + `purchase_conditions` (columns + form)

```
Hard contract: see top.

BUG (production): `GET listings` returns 500 with Postgres 42703 `column listings.offer_type does not
exist` whenever offer_type/purchase_conditions are in the query. Root cause (verified): the filter UI,
URL params, chips and saved-search all support these two fields and `applyListingFilters` queries them,
but the columns were never added to `listings`.

Owner decision (2026-05-23): make them REAL listing attributes — add the columns AND the create/edit
form fields so the filters actually match data.

Pre-read:
- src/modules/listings/domain/filterEngine.ts (offerType `.eq('offer_type', …)` ~L243;
  purchaseConditions `.overlaps('purchase_conditions', …)` ~L248; parseSearchParams ~L142–143)
- src/modules/listings/domain/listingFields.ts (offer_type/purchase_conditions tagged "filter-panel only"
  ~L27–28) and propertyTypeSchema.ts (which property types show these filters)
- src/modules/listings/constants (OFFER_TYPES, PURCHASE_CONDITIONS — the allowed values)
- src/modules/listings/lib/listingSelect.ts (LISTING_SELECT), src/types/database.ts (Listing type),
  the listing create/edit form (src/modules/listings/components/ListingFormShell.tsx +
  validations/index.ts), scripts/schema-drift-check.sql (Tasks 172/173 — keep the guard in sync)
- docs/data-access-rules.md, docs/domain-rules.md

Scope:
1. DB (OWNER runs; write EXACT SQL to the session log): add `offer_type text NULL` and
   `purchase_conditions text[] NULL DEFAULT '{}'` to `listings`, with values constrained to the
   OFFER_TYPES / PURCHASE_CONDITIONS domains (CHECK or app-validated — match existing conventions like
   market_type/layout_features). Add an index if layout_features/market_type have one.
2. Types + select: add the two fields to the `Listing` type and to `LISTING_SELECT` if listings need to
   read them back; update `scripts/schema-drift-check.sql` so the drift guard knows the columns exist.
3. Form: add offer_type (single-select) + purchase_conditions (multi-select) to the create/edit form,
   gated by the SAME propertyTypeSchema visibility the filters already use (so they only show where
   relevant). Use the canonical controls (FilterToggleGroup/FilterMultiToggle equivalents or the form's
   existing pattern) — no new one-off components. Persist them on create AND edit.
4. Verify the full round-trip: filtering by offer_type/purchase_conditions no longer 500s and actually
   matches listings that have those values. Mirror the array semantics already used (`.overlaps` for
   purchase_conditions, `.eq` for offer_type) — do not change the operators.

Acceptance criteria:
- `GET /listings?...&offer_type=owner&purchase_conditions=installment,mortgage` returns 200 and filters
  correctly; no 42703 anywhere; schema-drift guard passes.
- offer_type + purchase_conditions are settable on create/edit (where the property type allows) and
  persist; round-trip filter matches them.
- Exact SQL written to the session log for the owner; 0 new lint/typecheck errors; build passes; 4
  locales for any new form strings; backlog + session log updated.

Out of scope: new filter values beyond the existing OFFER_TYPES/PURCHASE_CONDITIONS constants.
```

---

## Task 218 — Homepage drawer footer buttons overflow (responsive)

```
Hard contract: see top. UI task → the UI pre-flight checklist is MANDATORY.

BUG: on the homepage filters drawer, the footer "Reset filters" + "Apply filters" buttons sit on one
row and overflow / get clipped by the drawer edge (worst in uk, narrow widths). Recurrence of Task 211.

Pre-read:
- src/components/shared/FiltersPanel.tsx (footer ~L445–458: `flex gap-3`, two `<Button size="xl"
  className="flex-1">` with icons + long labels, panel is `max-w-sm`)
- Task 211 session log (contact-card action-row overflow fix) — reuse that approach, do not reinvent
- docs/ui-rules.md (Composition / Responsive subsections), docs/component-rules.md

Scope:
1. Make the footer button row fit WITHOUT clipping at every breakpoint down to 320px and in all 4
   locales. Allowed techniques (pick the minimal correct one): `min-w-0` on the buttons + label
   truncation, a smaller canonical size, and/or stacking the buttons vertically on the narrowest widths.
   Keep both actions reachable and legible; do not hide labels behind icons only unless an aria-label
   is present.
2. Use the canonical Button sizes (no ad-hoc heights). Verify against the canonical control-height rule
   in docs/ui-rules.md.

Acceptance criteria:
- At 320/375/390 and in sq/en/uk/it, both footer buttons are fully visible inside the drawer, no clip,
  no horizontal scroll; tap targets stay ≥44px.
- No regression at 768/1280/1440/2560; 0 new lint/typecheck errors; build passes; session log includes
  before/after screenshots or a per-breakpoint note; backlog updated.

Out of scope: the drawer's z-index (Task 219); filter logic.
```

---

## Task 219 — Homepage drawer overlapped by sticky header: z-index layering scale

```
Hard contract: see top. UI task → UI pre-flight checklist MANDATORY. If introducing the scale would
change stacking for dialogs/sheets/popovers in a way you can't fully verify, STOP and ask before
touching shared UI primitives.

BUG: the homepage filters drawer is overlapped by the sticky site header (the header shows through /
above the drawer, and the backdrop never dims it).

Root cause (verified): Header is `sticky top-0 z-50` (Header.tsx:127); drawer panel `z-50`, backdrop
`z-40` (FiltersPanel.tsx:99,109). `z-50` is overloaded across header, dialog, sheet, popover, combobox,
and admin modals.

Pre-read:
- src/components/layout/Header.tsx (L127 `z-50`), src/components/layout/MobileBottomNav.tsx (`z-40`)
- src/components/shared/FiltersPanel.tsx (backdrop `z-40` L99, panel `z-50` L109)
- src/components/ui/{dialog,sheet,popover,select,dropdown-menu}.tsx (all `z-50`),
  src/components/shared/Combobox.tsx (portal `z-50` L156)
- docs/ui-rules.md → the new "Z-index layering scale" section (added this sprint by the orchestrator)

Scope:
1. Adopt the canonical z-index scale from docs/ui-rules.md:
   - chrome (sticky site header, mobile bottom nav): `z-30`
   - overlay/scrim (drawer/sheet/dialog backdrops): `z-40`
   - floating surfaces (drawer/sheet/dialog panels, popovers, comboboxes, dropdowns, toasts): `z-50`
2. Lower the site header + mobile bottom nav to `z-30`. Keep drawer backdrop `z-40` (now dims the
   header) and panel `z-50` (now above the header). Verify portaled comboboxes opened INSIDE the drawer
   still render above the panel (DOM order keeps them on top at the same z-50 — confirm visually).
3. Apply the scale consistently; do not leave a second header/nav at `z-50`. Verify dialogs, sheets,
   admin modals, dropdowns still stack correctly.

Acceptance criteria:
- Opening the homepage drawer fully covers + dims the site header; nothing from the header is visible or
  clickable over the drawer; closing restores normal stacking.
- Dialogs/sheets/popovers/comboboxes/admin modals still stack correctly (spot-check each).
- z-index values follow the documented scale (grep shows header/bottom-nav at `z-30`); 0 new
  lint/typecheck errors; build passes; 7 breakpoints; backlog + session log updated.

Out of scope: footer button overflow (Task 218).
```

---

## Task 220 — `/listings` toolbar consistency: canonical height + spacing + combobox

```
Hard contract: see top. UI task → UI pre-flight checklist MANDATORY.

BUG (owner): on /listings the "All types" + sort ("Newest") dropdowns don't read as our canonical
control; the canonical Combobox looks taller than the sibling buttons; and the tabs/bars look pressed
against the filter panel (spacing not maintained).

Pre-read:
- src/modules/listings/components/ListingsSortBar.tsx (sort Combobox `size="sm"` L77–84; grid/list
  toggle; mobile filters button)
- src/modules/listings/components/ListingsFilterBar.tsx (sale/rent buttons `h-9` L51–61; property-type
  Combobox `size="sm"` L67–75; LocationCombobox; `py-3 border-b` L47)
- src/components/shared/Combobox.tsx (heights map: default h-11 | sm h-9 | xs h-8, L137; trigger L226/234)
- src/components/ui/button.tsx (size variants), docs/ui-rules.md (canonical control height + spacing)

Scope:
1. Make all clickable controls in BOTH bars share ONE canonical height (the sort/type comboboxes, the
   sale/rent buttons, the grid/list toggle, the advanced-filters button) per docs/ui-rules.md. If the
   Combobox `variant="button"` trigger doesn't visually match the `h-9` buttons, fix the trigger so
   sizes are pixel-consistent — at the Combobox level so it's fixed everywhere, not via per-call hacks.
2. Fix spacing: give the sort bar / filter bar correct vertical rhythm so they aren't flush against the
   results/filter panel (canonical spacing tokens, not ad-hoc margins).
3. Confirm both bars use the canonical Combobox (no native `<select>`/shadcn Select); if any non-canonical
   dropdown is found here or in the listings results header, replace it.

Acceptance criteria:
- Every interactive control in ListingsSortBar + ListingsFilterBar is the same canonical height and
  visually aligned; spacing around the bars matches the canonical rhythm; no control is flush against
  the panel.
- Only the canonical Combobox is used for these dropdowns; 0 new lint/typecheck errors; build passes;
  4 locales; 7 breakpoints; session log notes before/after; backlog updated.

Out of scope: the global audit (Task 221a) — but record any out-of-scope offenders you spot for 221a.
```

---

## Task 221a — Project-wide canonical control-height + spacing + combobox audit ✅ DONE 2026-05-24

```
Hard contract: see top. UI task → UI pre-flight checklist MANDATORY. This is an AUDIT + targeted
fixes; if a fix is large or risky, list it as a follow-up in the session log instead of forcing it in.

GOAL (owner): the same UI drift (inconsistent control heights, ad-hoc spacing, non-canonical dropdowns)
keeps re-appearing. Do a project-wide pass and bring controls onto the canonical system.

Pre-read:
- docs/ui-rules.md (canonical control height, canonical spacing, Combobox-only §0, z-index scale,
  UI pre-flight checklist), docs/component-rules.md
- src/components/ui/button.tsx, src/components/shared/Combobox.tsx (height map), src/components/ui/select.tsx

Scope:
1. Inventory (write to the session log): grep the codebase for (a) native `<select>` and shadcn `Select`
   usages that should be the canonical Combobox; (b) ad-hoc control heights (`h-8`/`h-10`/`h-11`/`h-12`
   on buttons/inputs/triggers that bypass the canonical sizes); (c) ad-hoc z-index values not on the
   scale; (d) clickable rows that risk overflow (icon + long label, `flex` without `min-w-0`/wrap).
2. Fix the clear, low-risk offenders to the canonical height/spacing/combobox/z-index. For each large or
   ambiguous one, log it as a discrete follow-up task candidate (don't silently rewrite big components).
3. Do NOT introduce a second control system or new tokens — use what docs/ui-rules.md defines.

Acceptance criteria:
- A written inventory in the session log (offenders found, fixed vs deferred) covering selects, control
  heights, spacing, z-index, overflow-risk rows.
- Low-risk offenders fixed onto the canonical system; deferred ones listed as named follow-ups.
- 0 new lint/typecheck errors; build passes; 4 locales; 7 breakpoints on touched screens; backlog
  updated.

Out of scope: building new components; redesigns. This is consolidation onto the existing canon.
```
