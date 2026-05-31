# Sprint 30 — Task 341 kickoff (Opus) — Admin listing preview (no public exposure) + "Початкова ціна" → "Оригінальна ціна" label semantics

> **You are Opus 4.7 orchestrator / architect / reviewer.** Planning + spec only. Allowed: `docs/`, `tasks/`. Forbidden: `src/`, `messages/`, migrations, scripts. Single-writer git.
>
> **Numbering:** Task 341 = Opus architectural (renumbered from old "340"). Sonnet sub-task ≥ 343 (one combined: admin preview + price label rename). Wave 2.
>
> **Cross-references:**
> - **Task 334** (Sonnet, separate kickoff) fixes the owner-side post-save redirect. Task 341 fixes admin-side preview. Both share root (published-only public route 404s for non-published) but solve different halves. Disjoint scope.
>
> **Source:** `issues.md` 2026-05-31 — "Define Sonnet fix task for admin listing preview before publication + original price label semantics".

```
Type:     architecture / admin / listing lifecycle / i18n / UX
Priority: high
Area:     Public listing detail route src/app/[locale]/listings/[slug]/page.tsx (status-gating)
          Admin listings row "Переглянути оголошення" action (src/components/admin/AdminListingsTable.tsx)
          Listing detail price block (src/modules/listings/components/ListingCard.tsx + listing detail page)
          Possible NEW admin preview route (e.g. src/app/admin/listings/[id]/preview/page.tsx) OR role-aware public route
          docs/admin-listing-preview-architecture.md (NEW) OR addendum to docs/admin-ux-rules.md
          tasks/Sprints/Sprint_30_kickoff_prompt_Task_<NEXT_FREE>.md (NEW Sonnet ≥ 343)
          docs/sessions/2026-05-31-task-341-admin-listing-preview-and-price-label.md
```

## Pre-read

1. `docs/agent-contract.md`, `docs/orchestrator-role.md`, `docs/backlog.md`
2. `docs/ai-behavior.md` Notes 14 / 18 / 19 / 20
3. `docs/admin-ux-rules.md` + `docs/rls-rules.md` + `docs/data-access-rules.md` + `docs/domain-rules.md`
4. `docs/ui-rules.md` + `docs/qa-rules.md`
5. `docs/analytics-rules.md` (preview must be excluded from analytics)
6. `tasks/Sprints/Sprint_30_kickoff_prompt_Task_334.md` (cross-ref — owner-side redirect)
7. `tasks/Epics/Epic_M_Currency_and_Exchange_Rate_Integrity.md` + `Epic_R_Admin_Panel_2026.md` + `Epic_HH_Admin_UX_System.md`
8. `src/app/[locale]/listings/[slug]/page.tsx` (current detail + notFound)
9. `src/components/admin/AdminListingsTable.tsx` (row action target)
10. `src/modules/listings/components/ListingCard.tsx` + `ListingContact.tsx`
11. `src/modules/listings/domain/listingTransitionEngine.ts`
12. `src/lib/getExchangeRate.ts`
13. `messages/{sq,en,uk,it}.json`

## Owner-reported problems

### Issue 1 — Admin "Переглянути оголошення" opens 404 for «На модерації»

Admin Listings row action opens the public URL → 404 because listing not published. "View listing" useless for admins/moderators.

**Required:**
- Admin/moderator can preview unpublished listings.
- Preview allows moderation review WITHOUT making the listing publicly visible.
- Guests + normal users still see 404 for pending listings.
- Admin/moderator access role-gated **server-side**, not only hidden in UI.
- Preview does NOT mutate status, does NOT publish, does NOT silently affect analytics.
- Preview shows visible banner that this is an unpublished/moderation preview.

### Issue 2 — "Початкова ціна" label is wrong

Main price shown in viewer's preferred currency. Below it, original owner-entered price + currency labeled «Початкова ціна» (= "starting price"). Wrong: lero-al is NOT an auction.

**Required:** Rename across all four locales — uk: «Оригінальна ціна» · en: "Original price" · sq: «Çmimi origjinal» · it: "Prezzo originale".

## Preview route concretics (per owner comment on Task 341)

The Sonnet sub-task MUST implement these preview-route requirements explicitly:

1. **`noindex` meta tag** on preview route (HTTP `X-Robots-Tag: noindex, nofollow` OR `<meta name="robots" content="noindex,nofollow">`). Preview MUST NOT be indexed by search engines.
2. **Excluded from analytics** — fire NO analytics event (`data-track="…"` attributes suppressed, `gtag` / `posthog` / `sentry` page-view events not fired) when route renders in preview mode. If analytics layer doesn't support per-render suppression, document workaround.
3. **Visible preview banner** at top of preview view — sq/en/uk/it:
   - uk: «Режим попереднього перегляду — оголошення ще не опубліковане»
   - sq: «Modaliteti i pamjes paraprake — shpallja ende nuk është publikuar»
   - en: "Preview mode — listing is not yet published"
   - it: "Modalità anteprima — l'annuncio non è ancora pubblicato"
4. **Locale policy for preview rendering** (explicit decision — Opus picks ONE and documents):
   - **Option A (recommend): query param `?locale=uk` on preview route**, defaulting to listing owner's locale if available, else admin's session locale. Allows admin to test localized rendering of any locale without switching admin UI locale.
   - **Option B: admin's session locale** (simpler; matches admin UI but does not test localized rendering of other locales).
   - **Option C: listing's `owner_locale` field** if it exists (most faithful to what the public user would see).
   - Opus MUST pick one and document why. Sonnet sub-task MUST NOT default silently.

## Required Opus output

### 1. Canonical doc

Either `docs/admin-listing-preview-architecture.md` (NEW) OR §X addendum to `docs/admin-ux-rules.md`. Opus picks based on existing structure; if new doc, cross-reference from `docs/rule-index.md`.

Sections:

1. Purpose
2. Current behavior (from investigation)
3. **Architectural decision for Issue 1** — pick ONE + justify:
   - **Option A: Authenticated admin preview route** at `/admin/listings/[id]/preview`. Reuses public listing detail UI as child component with `previewMode: 'admin'`. Server-side role-gated via `requireAdmin()` in RSC. **Recommend.**
   - **Option B: Role-aware public route**. `/[locale]/listings/[slug]/page.tsx` checks viewer role. Risk: analytics / SEO / public-facing side effects leak.
   - **Option C: Project-consistent pattern if already exists.**
4. Mandatory constraints for Issue 1 (Guests + non-admin see 404; admin role-gated server-side; preview NOT mutate status; preview NOT publish; preview NOT analytics-tracked; preview banner; admin row-action target updated; `noindex`; locale policy picked).
5. **Canonical wording for Issue 2:**
   - Ukrainian: «Оригінальна ціна»
   - English: "Original price"
   - Albanian: «Çmimi origjinal»
   - Italian: "Prezzo originale"
   - Old key (e.g. `listing.starting_price`) → renamed `listing.original_price` (or kept + value updated — Opus picks; if rename, ALL call sites updated per Note 14).
6. Mandatory constraints for Issue 2 (no auction terminology; no hardcoded labels; existing i18n namespace; sq/en/uk/it; Note 14 — search ALL instances).
7. Localization sq/en/uk/it.
8. Responsive 14-width canon.
9. Sonnet sub-task scope.

### 2. Sonnet sub-task kickoff (Opus writes file ≥ 343)

Title: `Task <NEXT_FREE> — Sonnet: Admin listing preview route + original-price label rename`.

The Sonnet sub-task MUST follow Canonical Task Template + include ALL: Pre-read · Current behavior to preserve · Required after behavior · **Positive flow** (admin opens preview from row action; guest sees 404; admin role-gated server-side; preview banner visible; listing rendering identical to public detail UI; price label = "Оригінальна ціна") **· Negative flow** (guest opens preview URL → 404 (not 401); non-admin authenticated → 403/404; preview status mutation attempt → blocked; analytics event firing in preview → blocked; SEO indexing of preview → `noindex` honored; locale mismatch → handled per chosen policy; listing not found → 404; admin tries to publish from preview → must use existing approve action, not preview) · Implementation · AC (citing both flows) · Out of scope · Validation (pnpm) · Manual QA · Final report.

**MVP scope:**
- Implement chosen architectural option for Issue 1.
- Add visible preview banner in sq/en/uk/it.
- Update admin Listings row action target.
- Add `noindex` to preview route.
- Suppress analytics in preview render mode.
- Implement chosen locale policy.
- Rename "Початкова ціна" → "Оригінальна ціна" across all four locales.
- Search ALL call sites (Note 14):
  ```
  rg -n "Початкова ціна|starting_price|Starting price|original_price|originalPrice|Оригінальна ціна" src messages
  rg -n "listing.*price.*label|price.*display|priceBlock" src messages
  ```
- Verify guests + non-admin still see 404 for non-published.
- Verify role gating server-side.
- Verify preview does NOT mutate status or publish.
- 14 canonical widths × 4 locales.

### 3. Session log + backlog update

Standard.

## Required investigation

1. Read `src/app/[locale]/listings/[slug]/page.tsx`. Document notFound logic + status gating.
2. Read `src/components/admin/AdminListingsTable.tsx`. Find row action target.
3. Confirm non-public statuses (`pending` / `moderation` / `draft` / `rejected` / `archived`).
4. Find existing admin preview patterns (if any).
5. Identify all locale keys + call sites for `Початкова ціна`.
6. Confirm currency conversion architecture is NOT changed.

## Acceptance criteria for THIS Opus task

- Current behavior inspected + summarised.
- Architectural option chosen + justified.
- Preview-route concretics specified (noindex, analytics-exclusion, banner, locale policy).
- Canonical wording for original-price in all four locales.
- Sonnet sub-task kickoff written with ALL canonical sections.
- Localization + 14-width canon required.
- `docs/backlog.md` + session log updated.
- NO `src/` / `messages/` / migration changes.

## Out of scope

- Do NOT redesign listing detail page.
- Do NOT redesign admin listings table.
- Do NOT change publication/moderation workflow beyond enabling safe preview.
- Do NOT expose unpublished listings publicly.
- Do NOT add auction functionality.
- Do NOT change currency conversion rates / currency preference architecture unless direct regression discovered.
- Do NOT merge with Tasks 338 / 334.

## Validation

```
rg -n "preview|notFound|publish|status|listing.*role|Переглянути оголошення|Початкова ціна|Оригінальна ціна" docs tasks src messages
git status --short
```

## Final report

Files changed; current behavior summary; chosen architecture + reason; preview-route concretics (noindex / analytics-exclusion / banner / locale policy); canonical wording for original-price; Sonnet sub-task path; validation; no `src/` / `messages/` / DB changes confirmation; explicit-path owner git commands.
