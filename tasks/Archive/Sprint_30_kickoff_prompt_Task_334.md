# Sprint 30 — Task 334 kickoff (Sonnet) — Owner post-edit redirect for listings with "На модерації" status

> **Mandatory rules:** `docs/agent-contract.md` clauses 1, 2, 3, 5, 6, 6a, 7, 8, 9, 10. Sonnet writes "Files Changed" table; orchestrator emits commits. Sonnet MUST NOT run git.
>
> **Numbering:** Task 334 = second direct Sonnet task in Sprint 30 (renumbered from old "333"). Parallel-safe with Tasks 330 + 335 (disjoint file scope). Wave 1.
>
> **Cross-references:**
> - **Task 341** (Opus) covers admin/moderator preview for unpublished listings + original-price label. Tasks 334 + 341 share root (published-only public route 404s for non-published) but solve DIFFERENT halves (334 = owner-side redirect, 341 = admin-side preview). Disjoint scope.
> - **Task 338** (Opus) covers the admin notification for `listing → pending moderation`. Independent of 334.
>
> **Source:** `issues.md` 2026-05-31 — "Fix owner post-edit redirect for listings with 'На модерації' status".

```
Type:     bugfix / listing lifecycle / routing / UX
Priority: HIGH (production bug — owner cannot edit own pending listing without 404)
Area:     Owner listing edit page (path via investigation — likely src/app/[locale]/listings/[slug]/edit/page.tsx or src/modules/listings/components/ListingFormShell.tsx)
          Server action saving listing updates (src/modules/listings/actions/applyListingTransition.ts and/or the update action)
          Public listing detail route src/app/[locale]/listings/[slug]/page.tsx (status-gated notFound — DO NOT WEAKEN)
          Owner "Мої оголошення" tab (src/modules/cabinet/components/ListingsTab.tsx)
          messages/{sq,en,uk,it}.json
```

## Pre-read (bundle: "Profile / edit-flow" + "DB / server action / RLS")

1. `docs/agent-contract.md` (always)
2. `docs/backlog.md` (always)
3. `docs/ui-rules.md` + `docs/component-rules.md` + `docs/qa-rules.md`
4. `docs/ai-behavior.md` → Notes 14 / 18 / 19 / 20 / 23
5. `docs/data-access-rules.md` + `docs/rls-rules.md` + `docs/domain-rules.md` (listing status enum)
6. `docs/state-authority.md` (router.refresh; SSR vs client cache)
7. `tasks/Sprints/Sprint_30_—_Owner_Issues_2026-05-31.md`
8. `src/app/[locale]/listings/[slug]/page.tsx` (public detail + notFound)
9. `src/modules/listings/domain/listingTransitionEngine.ts` + `listingSemanticHelpers.ts` + `listingSemanticLayer.ts`
10. `src/modules/listings/actions/applyListingTransition.ts`
11. `src/modules/cabinet/components/ListingsTab.tsx`
12. Listing edit page + save action (find via grep `updateListing|saveListing|ListingEdit|edit/page`)
13. `messages/{sq,en,uk,it}.json`

## Owner-reported problem

Listing has status «На модерації». Owner opens it from profile, edits, saves. Listing detail page appears for a few seconds, then redirects to 404. Refresh keeps the 404. Cause: post-save redirect goes through public-only route that returns 404 for non-published statuses.

## Required after behavior

When owner edits + saves a listing with status «На модерації»:
- Save succeeds.
- Listing stays in «На модерації» unless business rules intentionally reset.
- Owner is NOT sent to a public-only route that 404s.
- Owner receives clear localized success state.
- Owner lands on a valid owner-accessible route (edit page with success banner OR «Мої оголошення» with success toast OR existing owner preview route if any).
- Guests / unrelated users STILL see 404 for pending listings.

## Critical routing rule

**Do NOT** fix this by making `На модерації` listings publicly available. The fix is **status-aware post-save routing** for the owner only.

## Status-aware post-save redirect matrix

| Actor | Listing status after save | Redirect target |
|---|---|---|
| Owner | `published` / "active" | Existing public detail route if currently correct — preserve |
| Owner | `pending` / `moderation` / «На модерації» | **Owner-safe route**: stay on edit page with success banner, OR redirect to «Мої оголошення» with success toast. NEVER public detail. |
| Owner | `draft` | Owner-safe route only |
| Owner | `rejected` | Owner-safe route only (rejection reason visible if available) |
| Owner | `archived` | Owner-safe route only |
| Admin / moderator | any non-published | Behavior aligned with Task 341 (preview architecture). DO NOT implement preview here — preserve current admin behavior if any. |
| Guest / unrelated user | any | Cannot reach edit route — preserve existing 401/403/redirect |

**Implementation hint:** add `getPostSaveRedirect(listing, currentUser): string` helper in listing domain. Server action returns canonical redirect path; client uses `router.push()` (NEVER `window.location.href`).

## Current behavior to preserve (Notes 19/20/23)

Before editing, inventory in session log:
- All editable fields on the listing edit form.
- Image upload/removal behavior.
- Validation (Zod + server).
- Save button states (idle / loading / disabled / success / error).
- Cancel / back behavior.
- Status display.
- Owner permission check (only owner can open edit).
- Loading / error / success state.
- Current post-save redirect target (this is what we fix).
- Filters / status labels in «Мої оголошення».
- Optimistic UI / cache invalidation (`router.refresh` / `revalidatePath` / `revalidateTag`).

**Every editable field MUST remain editable.** Image, validation, save action, owner check, listing status logic — preserved.

## Positive flow (happy path)

As listing owner on the edit page for a listing with status «На модерації»:

1. Open the listing from "Мої оголошення" → click "Edit".
2. Modify safe field(s).
3. Click "Save". Submit button → loading.
4. Server action validates + persists + returns `{ ok: true, listing }`.
5. `revalidatePath` / `revalidateTag` runs for the listing + owner's "Мої оголошення".
6. Status remains `pending` (unless business rules reset).
7. Client receives `{ ok: true, redirectTo: '/{locale}/cabinet/listings?saved=1&id=<id>' }` (or project canonical equivalent).
8. `router.push(redirectTo)` runs.
9. Destination loads — owner sees listing in "Мої оголошення" + success toast «Зміни збережено. Оголошення очікує модерації.» (sq/en/uk/it).
10. Refresh keeps owner on the safe destination (no 404).

## Negative flow (every off-happy-path branch)

| Branch | Trigger | Expected response | What is NOT done | Locale key |
|---|---|---|---|---|
| Validation error | Invalid field | Form re-renders with inline error; no redirect; status unchanged | No DB write; no nav | existing form-validation keys |
| Server 500 | Unexpected DB error | Toast `listing.save_failed`; form stays editable | No nav; no status change | `listing.save_failed` |
| Permission denied | Non-owner attempts save (RLS rejects) | Toast `cabinet.unauthorized`; redirect to login if session expired | No DB write | existing auth |
| Listing not-found during save | Concurrently removed | Toast `listing.not_found`; redirect to "Мої оголошення" | No write | `listing.not_found` |
| Network offline | Fetch fails | Toast `common.network_error`; form keeps draft state | No nav; no write | `common.network_error` |
| Double-submit | Owner clicks Save twice fast | Second click no-ops via `submitting` guard | No duplicate write | n/a |
| Status reset by business rule | Edit triggers status change | Redirect matrix uses FINAL status returned | n/a | success message keyed to final status |
| Refresh after save | Owner reloads destination | Destination owner-accessible — NO 404 | n/a | n/a |
| Guest opens edit URL | No session | 401 → login redirect | No edit access | existing |
| Non-owner authenticated opens edit URL | Wrong owner | 403 → redirect to public listing (if published) OR "Мої оголошення" | No edit access | existing |
| Admin/moderator opens edit URL | Admin role | Existing admin behavior preserved (Task 341 owns preview) | n/a | n/a |
| Locale mismatch | Save runs in `en` but listing was created in `uk` | Locale of success toast = current viewer locale; redirect URL respects current locale | n/a | n/a |
| Optimistic concurrency | Another writer updated listing | Server returns 409; show toast `listing.concurrent_edit`; allow retry | No silent overwrite | `listing.concurrent_edit` |

## Required investigation

1. Find owner edit route file:
   ```
   rg -n "updateListing|saveListing|ListingEdit|MyListings|Мої оголошення|owner_id|user_id|edit/page" src
   rg -n "router\\.push.*listing|redirect.*listing|return.*redirect" src/modules/listings src/app/\\[locale\\]
   ```
2. Find current post-save redirect call site.
3. Find listing status enum values (code + DB schema).
4. Find public listing route notFound logic (`src/app/[locale]/listings/[slug]/page.tsx`) — DO NOT weaken.
5. Default canonical owner-safe destination: `/{locale}/cabinet/listings?saved=1&id=<id>`.
6. Determine if separate owner preview route exists. If yes, reuse. If no, default to "Мої оголошення".
7. Determine revalidation strategy (`revalidatePath` / `revalidateTag`).

## Implementation requirements

- Add `getPostSaveRedirect(listing, currentUser): string` helper in listing domain layer (single source of truth — Note 14).
- Save server action returns `{ ok: true, redirectTo }` OR uses server-side `redirect()` — match existing project pattern; do NOT invent.
- Add localized success `listing.saved_pending_moderation` (sq/en/uk/it) — fired as toast on "Мої оголошення" via `?saved=1` query param OR project flash-message pattern.
- Add localized `listing.save_failed` + `listing.not_found` + `listing.concurrent_edit` if missing.
- Preserve public route `notFound()` for non-published statuses — verify with grep no other call site weakened.
- Use `router.push` (NEVER `window.location.href`).
- Revalidate listing detail path + "Мої оголошення" path so destination shows fresh data without flicker.

## Acceptance criteria

- Root cause of delayed 404 documented in session log.
- Owner can edit + save «На модерації» listing.
- After save, owner on owner-safe route — NOT 404.
- Refresh keeps owner on safe destination.
- Pending listings remain hidden from guests/public.
- Unrelated users cannot access edit flow.
- Published-listing save behavior preserved.
- All editable fields + image handling + validation preserved (Notes 20 + 23).
- All changed/new strings localized sq/en/uk/it.
- 14 canonical widths verified: 320/375/390/480/560/680/768/810/960/1024/1200/1440/1920/2560.
- 0 new lint errors / 0 new warnings; `pnpm tsc --noEmit` → 0 errors; `pnpm build` passes.
- `docs/backlog.md` + `docs/sessions/2026-05-31-task-334-owner-pending-listing-post-edit-redirect.md` updated; Files Changed table; Note 18 self-validation block.

## Out of scope

- Do NOT make pending listings public.
- Do NOT redesign listing detail page.
- Do NOT redesign full edit form.
- Do NOT implement admin preview architecture (Task 341).
- Do NOT change original-price label (Task 341).
- Do NOT change currency conversion logic.
- Do NOT change approval/rejection workflow.
- Do NOT change notification behavior (Task 338).
- Do NOT change account-deletion / password / profile flows.
- Do NOT add new listing statuses.
- Do NOT remove existing listing actions.

## Validation

```
pnpm tsc --noEmit
pnpm build
pnpm lint
```

Search:
```
rg -n "notFound\\(|redirect\\(|router\\.push|router\\.replace|revalidatePath|revalidateTag|listing.*status|status.*listing|moderation|pending|На модерації|published|draft|rejected|archived" src docs messages
rg -n "listings/\\[slug\\]|edit/page|updateListing|saveListing|ListingEdit|MyListings|owner_id|user_id" src docs messages
```

## Manual QA

- Create/use a test listing owned by a normal user.
- Put it in «На модерації».
- Log in as owner.
- Open from "Мої оголошення".
- Edit a safe field.
- Save.
- Confirm NO delayed 404.
- Refresh — confirm valid destination.
- Confirm listing NOT publicly visible to a fresh incognito guest.
- Confirm owner can still access edit flow.
- Confirm published-listing save flow still works.
- Confirm sq/en/uk/it where changed.
- Confirm all 14 widths.

## Final report

Files Changed table; root cause; current vs new post-save redirect; status-aware matrix implemented; confirmation pending not made public; confirmation owner can save without 404; confirmation refresh works; confirmation published save preserved; confirmation no controls removed; sq/en/uk/it + 14 widths verified; validation results; backlog + session log paths; Note 18 self-validation verdict line.
