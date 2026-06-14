# Task 237 — Y.2 — Admin moderation preview: temporary listing page

> **Executor:** Sonnet 4.6. **Orchestrator:** Opus (review-on-diff).
> **Epic:** Y — Listing Form & Lifecycle UX. **Source:** `issues.txt` 2026-05-25 #28.
> **Type:** bug + feature. **Priority:** high.
> **Area:** admin `/admin/listings` row action "View" (`btn_view`) + a NEW admin-only preview
> route + a behavior-preserving extraction of the public listing-detail renderer.
> **Supersedes** the 2026-06-05 draft of this file (which left the preview decisions open and used an
> incorrect `/[locale]/admin/...` path). All four decisions are now RESOLVED by the owner — see §1.

This kickoff is the single source of truth. Execute the acceptance criteria **literally**. If
anything here is ambiguous or cannot be implemented as written without inventing architecture,
**STOP and ASK the orchestrator** — do not improvise (agent-contract clause 2).

---

## 0. Pre-read (load ONLY these — `rule-index.md`)

**Always required:** `docs/agent-contract.md` (clauses 1–14), `docs/backlog.md`.

**This is a MIXED task (UI + DB/server-data + admin). Load all three bundles:**

UI / layout / component:
- `docs/design-system.md` — read §24 (forbidden hardcodes), §25 (control-preservation), §26 (mobile <640 full-width + bottom-sheet gate), §27 (Storybook proof contract).
- `docs/ui-rules.md`, `docs/component-rules.md`, `docs/qa-rules.md`.

DB / server-data / RLS:
- `docs/data-access-rules.md`, `docs/rls-rules.md`, `docs/domain-rules.md` (listing status lifecycle).

Admin / behavior preservation:
- `docs/ai-behavior.md` → Note 14 (Global Change Verification), Note 19 (UX Flow Preservation), Note 20 (Existing-Control Preservation).

**Code pre-read (read before writing a line):**
- `src/app/[locale]/listings/[slug]/page.tsx` — the public detail page (data fetch + publish/`notFound()` gate at the `.in('status', ['active','sold','rented','archived']).single()` query, line ~207, + the entire detail body to be extracted).
- `src/app/admin/listings/page.tsx` — admin listings server page (service-role `createAdminClient()` query pattern).
- `src/components/admin/AdminListingsTable.tsx` — the `ListingPreviewDialog` footer where `btn_view` lives (the 404 source, line ~351).
- `src/app/admin/layout.tsx` — the staff guard (getUser + redirect) + `admin-locale` cookie + `NextIntlClientProvider`.
- `src/modules/listings/components/ListingStatusBanner.tsx` — existing banner primitive to model the preview banner on.
- `src/modules/listings/domain/listingSemanticHelpers.ts` — `isListingVisible`, `isListingHidden`, `isListingArchived` (USE these; do NOT hardcode status string lists — Note 14).
- `src/lib/supabase/admin.ts` (`createAdminClient`) and `src/lib/admin/getAdminLocale.ts`.

---

## 1. Decisions already resolved by the owner (do NOT re-litigate; do NOT guess otherwise)

1. **Post-publish behavior:** the `/admin/listings/[id]/preview` route MUST stay reachable for
   admin/moderator for **any non-deleted listing in any status, including after publish**. It MUST
   NOT auto-redirect to the public URL. For a publicly-served listing the route renders the SAME
   detail view, but the banner MUST NOT say "not published" — instead it shows a staff-only
   "Published — public page is live" banner with a link to the public page. Public URL is unaffected.
2. **Admin "view" routing:** the admin row action "View" (`btn_view`, label "Përsho" / "Переглянути
   оголошення") MUST **always** route to the admin preview route by **id**, for every non-deleted
   listing state. NOT conditional on status. The public canonical URL stays separate and is reachable
   only via an explicit "Open public page" link (shown only when the listing is publicly served).
3. **Data access:** read the listing inside the already-staff-gated admin area via the existing
   **service-role `createAdminClient()`** path, by exact `id`. Do **NOT** add a new staff RLS policy
   in this task. If implementation proves the service-role path cannot do this safely, **STOP and ASK**
   and document exact idempotent SQL separately — do not add a migration unilaterally.
4. **Render reuse:** extract the public detail body into ONE shared presentational component
   `ListingDetailView` consuming already-fetched data + an `isStaffPreview` flag + a `previewBanner`
   state. The public route KEEPS its current publish/`notFound()` gate and passes its data into the
   shared view. The preview route does its OWN staff-gated fetch-by-id and renders the same shared
   view. **No standalone duplicate renderer, no copy-pasted markup** (Note 14 — no clone).

> **Route path correction (architecture fact, overrides the owner's shorthand):** the admin area in
> this repo is **not** locale-segmented — it lives at `src/app/admin/...` and resolves locale from the
> `admin-locale` cookie via `getAdminLocale()`. The canonical preview route is therefore
> **`/admin/listings/[id]/preview`** (file: `src/app/admin/listings/[id]/preview/page.tsx`), NOT
> `/{locale}/admin/...`. Do not introduce a `[locale]` segment under `/admin` — it would break the
> admin route group and its guard.

---

## 2. Current behavior (what exists today — preserve unless explicitly changed)

- The public detail page (`/[locale]/listings/[slug]`) fetches with
  `.in('status', ['active','sold','rented','archived']).single()` → for `pending`/`inactive`
  listings `listing` is null → `notFound()` → **404**. (This gate STAYS as-is.)
- In `AdminListingsTable.tsx`, clicking a listing opens `ListingPreviewDialog`. Its footer has:
  `btn_view` (ExternalLink → `/${locale}/listings/${listing.slug}`, `target="_blank"`),
  Edit (→ `/${locale}/listings/${listing.slug}/edit`), Premium (opens PremiumDialog), Delete
  (inline confirm). `btn_view` is the control that **404s** for `pending`/`inactive` listings (#28).
- `admin/layout.tsx` already redirects non-staff users away from `/admin/**` (role-gated). Any new
  route under `/admin/**` inherits this guard.
- `ListingStatusBanner` renders for `sold`/`rented`/`archived` on the public page (`mb-6`, full-width).

## 3. Required after-behavior

- A NEW server route `src/app/admin/listings/[id]/preview/page.tsx`:
  1. Inherits the admin staff guard. Additionally **assert admin/moderator role** at the top of the
     route (re-use whatever helper `admin/layout.tsx` / existing admin pages use; if the guard is
     layout-only, add a defensive in-route role check that `redirect`s / `notFound`s a non-staff user
     — STOP and ASK if no role helper exists).
  2. Reads the listing **by `id`** via `createAdminClient()` (service role), selecting the SAME shape
     the public page needs (`*, location:locations(id, name_al, slug, type), images:listing_images(url, is_cover, "order")`),
     **with no status filter**.
  3. If no row, or the row is soft-deleted (`deleted_at` set, if that column exists on `listings`),
     → `notFound()`.
  4. Resolves the owner profile for display via the admin client (e.g. `public_user_profiles` by
     `listing.user_id`) so the contact card renders for staff.
  5. Renders `<ListingDetailView … isStaffPreview previewBanner={…} />`.
  6. `previewBanner` = `'unpublished'` when `isListingHidden(status)` (i.e. `pending`/`inactive`);
     otherwise `'published'`.
- `ListingDetailView` (new, e.g. `src/modules/listings/components/ListingDetailView.tsx`): the public
  detail body (everything currently inside the `return(...)` of `ListingPage` — gallery, title/price/
  badges, features, description, attributes, map, report, recently-viewed, similar, contact sidebar,
  status banner), as a PRESENTATIONAL component. It receives a typed props object containing the
  values the public page already computes immediately before its `return` (listing, owner,
  sortedImages/coverImage, galleryPreload, isNew, isPriceReduced, features, detailAttrs, displayPrice,
  displayCurrencyCode, displayPriceOld, originalPriceStr, pricePerSqm, formattedPrice, relativeTimeStr,
  listingUrl, locale, isGuest, canReport, isInitiallyFavorited, listingId-for-actions) **plus**
  `isStaffPreview: boolean` and `previewBanner: 'unpublished' | 'published' | null`.
  - **If extraction reveals a computed value the preview page cannot supply without new infra, STOP
    and ASK** rather than inventing a parallel data path.
- The public page is refactored to compute exactly what it computes today and pass it into
  `<ListingDetailView … isStaffPreview={false} previewBanner={null} />`. **Rendered output for the
  public page must be equivalent to today** — this is a pure relocation of JSX; verify with a
  before/after screenshot at the canonical breakpoints.
- `isStaffPreview === true` behavior inside `ListingDetailView`:
  - Render the preview banner at the top of the content area (above the grid):
    - `'unpublished'` → warning-style banner: `t('listing.preview_banner_unpublished')`.
    - `'published'` → info-style banner: `t('listing.preview_banner_published')` + a link
      `t('listing.preview_open_public')` → `/${locale}/listings/${slug}` (`target="_blank"`).
  - **Suppress** `ViewTracker`, `RecentlyViewedTracker`, and `RecentlyViewedSection` (do not inflate
    view counts / pollute the staff member's recently-viewed). **Keep** `SimilarListings`.
  - Pass `canReport={false}`, `isInitiallyFavorited={false}`, and omit the favorite `listingId` so
    favorite/report actions are inert in preview.
  - When `isStaffPreview === false`, NONE of the above applies — public behavior is unchanged.
- `AdminListingsTable.tsx` `ListingPreviewDialog` footer:
  - **Re-target** `btn_view`: href → `/admin/listings/${listing.id}/preview` (internal link; keep the
    label `t('btn_view')`; the icon may stay ExternalLink or switch to an Eye — keep ONE clear
    control). It must NOT 404 for any status.
  - **Add** an "Open public page" control (`t('admin.listings.btn_open_public')`, → public slug,
    `target="_blank"`) shown **only when** the listing is publicly served (`!isListingHidden(status)`).
  - Preserve Edit / Premium / Delete exactly (Note 20 — before/after inventory required).

---

## 4. Positive flow (happy path)

**Actor:** admin or moderator, authenticated, on `/admin/listings`.

1. Staff opens `/admin/listings`, clicks a listing row in `pending` status → `ListingPreviewDialog`
   opens (unchanged). **System:** dialog shows status/type/price/agent + status actions + footer.
2. Staff clicks "View" (`btn_view`). **System:** navigates to `/admin/listings/<id>/preview`.
3. Preview route asserts staff role (pass), fetches the listing by id via service role (found),
   resolves owner, renders `<ListingDetailView isStaffPreview previewBanner="unpublished">`.
   **System:** full public-style detail renders; a warning banner reads "PREVIEW — not published…";
   no 404; view count NOT incremented.
4. Staff approves the listing via the existing status action → status becomes `active`.
5. Staff re-opens the same preview URL. **System:** route still works (no redirect); banner now reads
   "Published — public page is live" with an "Open public page" link to `/<locale>/listings/<slug>`.
6. Staff clicks "Open public page". **System:** the public detail page opens in a new tab and renders
   normally.
**Post-conditions:** no DB writes from preview; view-count / recently-viewed untouched; public page
behavior identical to pre-task.

## 5. Negative flow (every off-happy-path branch — each needs a verifiable handler in the diff)

- **Non-staff hits `/admin/listings/<id>/preview` directly** (guest or normal user): blocked by the
  admin guard (redirect to login/forbidden) AND/OR the in-route role assertion → never renders the
  listing. Verify a guest is redirected, not shown the data.
- **`id` does not exist / malformed UUID:** service-role fetch returns no row → `notFound()`
  (admin 404), not a crash.
- **Listing is soft-deleted** (`deleted_at` set, if column exists): `notFound()`. If `listings` has
  no `deleted_at` column, treat "deleted" as "no row" and note this in the session log.
- **Listing has no images / no location / no description / no map coords:** `ListingDetailView`
  renders the same graceful empties the public page does today — confirm extraction preserved every
  `&&` guard.
- **Owner profile missing** (orphaned/deleted owner): contact card falls back exactly as the public
  page does today (the `ownerRaw ?? {…}` fallback) — preserved in the extraction.
- **Public link for a still-hidden listing:** the "Open public page" control is HIDDEN when
  `isListingHidden(status)` — staff cannot click through to a guaranteed 404.
- **DB/transport error on the preview fetch:** surfaces as the standard admin error/empty path
  (no half-rendered page); STOP and ASK if there is no existing admin error convention to follow.
- **Locale:** preview renders correctly in all 4 admin locales (admin-locale cookie); banner +
  "Open public page" label localized, no raw keys.

---

## 6. 🔴 Mobile <640 full-width gate (OWNER P0 — mandatory, verified with rendered evidence)

In-scope surfaces and their required `max-sm` behavior:

- **Preview page (`/admin/listings/[id]/preview`)** is a full PAGE (not a popup) → the bottom-sheet
  rule does NOT apply. It MUST use the same full-width container behavior the public detail page uses
  today; confirm no horizontal scroll at 320 in all 4 locales.
- **Preview banner** (both `unpublished` and `published`): full-width block (model on
  `ListingStatusBanner`: `rounded-2xl border px-5 py-4 mb-6`, spans the content column edge-to-edge);
  long sq/en/uk/it text wraps (`whitespace-normal break-words`), never clips; ≥44px touch target on
  the "Open public page" link.
- **`ListingPreviewDialog` footer action row** (`btn_view`, Edit, Premium, Delete, the new
  `btn_open_public`): at `<640` the action row stacks and each text button is **full-width**
  (`max-sm:w-full`), ≥44px (`min-h-11`), labels wrap. You are already editing this footer — bring the
  WHOLE action row to full-width compliance; do not leave a mixed half-compliant row.

**Exemptions (must be listed in the session log):** icon-only controls only. The `ListingPreviewDialog`
**container's** own `<640` bottom-sheet treatment is a PRE-EXISTING concern and is **out of scope for
Task 237** (we only touch its footer buttons + add one button). If you find the Dialog container is
not already a `<640` bottom sheet, **note it as a pre-existing gap** for the overlay/DS track — do NOT
restructure the Dialog primitive here.

---

## 7. Localization (clause 7 — all four locales, same key set)

Add to `messages/sq.json`, `en.json`, `uk.json`, `it.json` (parity REQUIRED; paste key-count parity
proof in the session log). Suggested copy (review sq/it before commit):

- `listing.preview_banner_unpublished`
  - en: "PREVIEW — this listing is not published. Only staff can see this page."
  - uk: "ПОПЕРЕДНІЙ ПЕРЕГЛЯД — оголошення не опубліковане. Цю сторінку бачить лише персонал."
  - sq: "PARASHIKIM — ky njoftim nuk është publikuar. Vetëm stafi e sheh këtë faqe."
  - it: "ANTEPRIMA — questo annuncio non è pubblicato. Solo lo staff può vedere questa pagina."
- `listing.preview_banner_published`
  - en: "Published — the public page is live." · uk: "Опубліковано — публічна сторінка активна."
  - sq: "Publikuar — faqja publike është aktive." · it: "Pubblicato — la pagina pubblica è online."
- `listing.preview_open_public`
  - en: "Open public page" · uk: "Відкрити публічну сторінку" · sq: "Hap faqen publike" · it: "Apri la pagina pubblica"
- `admin.listings.btn_open_public` — same wording as `listing.preview_open_public` per locale
  (separate key because it lives in the admin namespace).

No other user-facing string may be hardcoded. The extracted `ListingDetailView` must keep every
existing `t(...)` call exactly (no new literals introduced by the move).

---

## 8. Responsive coverage + rendered evidence (clauses 8 + 12 — REQUIRED to pass review)

The session log MUST contain a **rendered verification matrix**: rows = canonical breakpoints
(320·375·390·768·1280·1440·2560), columns = `sq·en·uk·it`, each relevant cell PASS with concrete
evidence (full-width <640? banner wrap? no clip/overflow? no h-scroll at 320?). **uk@320/375/390 are
mandatory stress cells.** Cover BOTH:
- the preview page in `unpublished` AND `published` states, and
- the public detail page after extraction (prove no visual regression vs. before).

"tsc=0 / build=✅" is NOT proof and does not close this task.

---

## 9. Acceptance criteria (each maps to a flow/decision; each must be verifiable in the diff)

- [ ] New route `src/app/admin/listings/[id]/preview/page.tsx` exists; staff-gated; service-role
      fetch-by-id; renders `ListingDetailView`. (Decision 1/3; Positive 2-3)
- [ ] "View" / `btn_view` in `ListingPreviewDialog` routes to `/admin/listings/<id>/preview` for
      EVERY non-deleted status and **never 404s**. (Decision 2; Positive 2; #28 fixed)
- [ ] Preview route still works after publish — no redirect; banner switches to "published" with a
      working "Open public page" link. (Decision 1; Positive 5-6)
- [ ] `ListingDetailView` is a single shared component used by BOTH the public page and the preview
      route; the public page renders identically to before (extraction only). (Decision 4)
- [ ] `previewBanner` / "Open public page" visibility uses `isListingHidden` — no hardcoded status
      arrays. (Note 14)
- [ ] `isStaffPreview` suppresses `ViewTracker`/`RecentlyViewedTracker`/`RecentlyViewedSection` and
      inertizes favorite/report; public mode unchanged. (Positive 3 post-conditions)
- [ ] Non-staff cannot reach the preview (guard + role assert); missing/deleted id → `notFound()`.
      (Negative flow)
- [ ] "Open public page" hidden when `isListingHidden(status)`. (Negative flow)
- [ ] Mobile <640 full-width gate satisfied for banner + footer action row (rendered matrix proof).
      (§6, §8)
- [ ] 4-locale parity for the new keys (key-count proof in log). (§7)
- [ ] Before/after control inventory for `ListingPreviewDialog` footer — nothing removed (Note 20).
- [ ] File-integrity (clause 14): every touched file 0 NUL bytes, no BOM, `.json` parses,
      `.tsx` compiles, not truncated — paste the green integrity transcript.
- [ ] `npx tsc --noEmit` → 0; `npm run build` passes; `check:i18n` + `check:i18n-dynamic` + lint
      green; 0 new warnings.

## 10. Files expected to change (your "Files Changed" table must match the real diff)

- `src/app/admin/listings/[id]/preview/page.tsx` — NEW preview route.
- `src/modules/listings/components/ListingDetailView.tsx` — NEW shared presentational view.
- `src/app/[locale]/listings/[slug]/page.tsx` — refactor to render `ListingDetailView` (extraction).
- `src/components/admin/AdminListingsTable.tsx` — retarget `btn_view`; add `btn_open_public`; footer
  mobile full-width.
- `messages/sq.json`, `messages/en.json`, `messages/uk.json`, `messages/it.json` — new keys ×4.
- `docs/backlog.md` (your "COMPLETE, pending review" line) +
  `docs/sessions/2026-06-14-task237-admin-moderation-preview.md` (session log).

**Do NOT touch:** the public page's `.in('status', …).single()` publish gate; the listing lifecycle /
status actions; the Dialog primitive; any RLS/migration; any unrelated admin page.

## 11. Hard contract (verified against the diff on return)

- No scope change; no invented architecture (STOP and ASK on ambiguity).
- No silent removal of any existing control (Note 20) — footer inventory required.
- Preserve UX flow (Note 19) — public page identical post-extraction; every empty/loading/error
  state intact.
- Implement BOTH the Positive flow and EVERY Negative branch above (clause 6a) — each verifiable in
  the diff.
- 4 locales (clause 7); 7 breakpoints with rendered matrix (clauses 8 + 12); no hardcoded
  strings/tokens (§24).
- Self-validate before claiming complete (clause 9): AC-by-AC self-audit table citing both flows;
  file-integrity transcript (clause 14); UX-flow trace; before/after control inventory; final
  "Self-validation: …" line.
- Update `docs/backlog.md` + add the session log with a "Files Changed" table (one row per path +
  rationale). **Do NOT run git (not even read-only `git diff`). Do NOT emit `git add`/`git commit`**
  — the orchestrator emits commit commands at review (single-writer rule).
