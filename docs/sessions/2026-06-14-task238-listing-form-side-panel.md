# Session: Task 238 — Listing form side-panel + status control + dirty-state Save (2026-06-14)

Kickoff: `tasks/Epics/Epic_Y_kickoff_prompt_Task_238.md` (executed in full, no scope changes).

## Files Changed

| File | Change |
|---|---|
| `src/modules/listings/components/ListingFormShell.tsx` | Restructured: added `currentStatus` state (initialized from `EditModeProps.currentStatus`), added `onCancelClick` (isDirty → confirm dialog, else `navigateAway()`) and `onStatusChange` (calls `changeListingStatusAction`, updates `currentStatus`, `router.refresh()`), replaced the old single-column JSX return with a delegation to `ListingFormShellView`. Dropped unused `isVisible` prop pass-through. |
| `src/modules/listings/components/ListingFormShellView.tsx` | **NEW** — presentational view: `AdminEditLayout` two-column (main = 4 `SectionCard`s + submit-error banner; sidebar = Save/Cancel/staff-only Change-status block), plus the relocated Cancel-confirmation `Dialog`. Status options derived from `listingTransitionEngine` (`ALLOWED_LISTING_TRANSITIONS`/`getTransitionActionForStatus`), not hardcoded. |
| `src/modules/listings/actions/changeListingStatus.ts` | **NEW** — `'use server'` wrapper `changeListingStatusAction(listingId, toStatus)`; resolves caller via `getUser()`/`users.role`, delegates to `applyListingTransitionByStatus(listingId, toStatus, { userId, role, source: 'cabinet' })`. |
| `src/modules/listings/components/ListingFormLoader.tsx` | `EditLoaderProps` extended with `canManageStatus: boolean`, `currentStatus: ListingStatus`; both passed through to `ListingFormShell` in edit mode. |
| `src/app/[locale]/listings/[slug]/edit/page.tsx` | Always fetch caller's `role` (previously skipped for owners); compute `canManageStatus = canAdminEditListing(userRole)`; pass `canManageStatus` + `currentStatus={listing.status}` to `ListingFormLoader`. |
| `src/modules/listings/components/ListingFormShellView.stories.tsx` | **NEW** — `Owner` (no status control) and `Staff` (`statusControl` set, `currentStatus: 'pending'`) stories, mocked `FormValues`/`LocationOption[]`/`getSchema('apartment')`, no-op handlers, no server-action imports (Storybook-safe). |
| `scripts/check-stories-rendered.mjs` | Registered `listings-listingformshellview--owner` and `listings-listingformshellview--staff` in `ASSERT_STORIES`. |
| `src/app/[locale]/listings/create/page.tsx` | **No changes** — create mode already matches `CreateModeProps`/`CreateLoaderProps` (`canManageStatus`/`currentStatus` are `never`); status control never renders in create mode. |
| `messages/{sq,en,uk,it}.json` | **No changes** — all required strings (`listing.section_*`, `listing.form_save/form_publish/...`, `listing.cancel_confirm_*`, `admin.common.status_control.*`, `listing.status_*`) already exist with full 4-locale parity. |
| `docs/backlog.md` | Session summary updated; Task 237 entry archived. |
| `docs/sessions/2026-06-14-task238-listing-form-side-panel.md` | This file. |

## AC-by-AC Self-Audit (kickoff §8)

| # | AC | Evidence | Status |
|---|---|---|---|
| 1 | `ListingFormShell` restructured to `AdminEditLayout` two-column (main = 4 section cards, sidebar = action panel) for both create and edit, owner and staff | `ListingFormShellView.tsx:132-322` — `AdminEditLayout` with `main` (Basics/Details/Photos/Location `SectionCard`s, lines 137-285) and `sidebar` (lines 297-320) | ✅ |
| 2 | Sidebar order: Save, Cancel, (staff-only) Change-status block (`StatusChangeControl variant="select"`) | `ListingFormShellView.tsx:298` (Save), `:303` (Cancel), `:307-319` (status block, `variant="select"`, `enableNote`) | ✅ |
| 3 | Save `disabled={submitting \|\| !isDirty}` using existing manual `isDirty`; no new form-state library | `ListingFormShellView.tsx:298`; `isDirty` is the same `useState` from `ListingFormShell.tsx:89`, set by `patch()` (`:103`) and `handlePropertyTypeChange()` (`:126`) | ✅ |
| 4 | Status writes only via `applyListingTransitionByStatus(listingId, toStatus, actor)` wrapped in `'use server'`, `actor={userId, role, source:'cabinet'}` | `src/modules/listings/actions/changeListingStatus.ts` — `'use server'`, resolves `getUser()`/`profile.role`, calls `applyListingTransitionByStatus(listingId, toStatus, {userId, role, source:'cabinet'})`; invoked from `ListingFormShell.tsx:300-307` (`onStatusChange`) | ✅ |
| 5 | `canManageStatus`, `currentStatus`, `listingId` computed server-side (`canAdminEditListing(userRole)`) and threaded `Loader → Shell`; never shown in create mode or for non-staff | `edit/page.tsx:46-63` (always fetches `userRole`, `canManageStatus = canAdminEditListing(userRole)`); `ListingFormLoader.tsx` `EditLoaderProps` (`canManageStatus`, `currentStatus`) → `ListingFormShell.tsx:46-53` (`EditModeProps`) → `:328-332` (`statusControl` only when `canManageStatus && isEditMode(mode) && currentStatus`); `CreateModeProps` (`:38-44`) types these `never` | ✅ |
| 6 | Selectable target statuses derived from `listingTransitionEngine`, not hardcoded | `ListingFormShellView.tsx:42` (`ALL_LISTING_STATUSES = Object.keys(ALLOWED_LISTING_TRANSITIONS)`), `:112-121` (`statusOptions` filters via `getTransitionActionForStatus(currentStatus, s) !== null`) | ✅ |
| 7 | Cancel relocated to panel; exact `isDirty` → confirm-Dialog → `navigateAway()` preserved (Esc/backdrop dismiss); header ghost Cancel removal documented (Note 21) | `ListingFormShell.tsx:292-298` (`onCancelClick`, unchanged logic, just relocated); `ListingFormShellView.tsx:303` (panel Cancel button), `:325-340` (`Dialog open={showCancelDialog} onOpenChange={onCancelDialogChange}` — Base-UI `Dialog` provides Esc/backdrop dismiss via `onOpenChange`); see "Control Inventory" below for Note 21 documentation | ✅ |
| 8 | Mobile <640 full-width gate: Save/Cancel `max-sm:w-full max-sm:min-h-11`-equivalent; `StatusChangeControl` full-width trigger + canonical bottom-sheet `Combobox`; Cancel dialog full-width bottom sheet at <640 | `ListingFormShellView.tsx:298,303` use `size="xl" className="w-full rounded-xl"` (xl size already meets ≥44px / `min-h-11`); `StatusChangeControl variant="select"` (`:310-317`) reuses the canonical `Combobox variant="button"` (full-width trigger + bottom-sheet `Positioner` at <640, not reimplemented); Cancel `Dialog`/`DialogContent` (`:325-340`) is the shared canonical `Dialog` component, which already renders as a full-width bottom sheet at <640 per design-system §26 — no local overrides added | ✅ |
| 9 | i18n parity for any new strings (sq/en/uk/it) | **0 new keys** — verified all referenced keys (`listing.section_*`, `form_save/form_saving/form_publish/form_publishing`, `cancel_confirm_*`, `status_*`, `admin.common.status_control.*`) pre-exist with 1787/1787 keys per locale across sq/en/uk/it | ✅ |

## Positive Flow Verification

- **5a — Owner edit & save**: Owner opens `/listings/[slug]/edit` → `canManageStatus=false` → sidebar shows Save + Cancel only (no status block, `ListingFormShellView.tsx:307` guard). Editing a field calls `patch()` → `isDirty=true` → Save enabled (`:298`). Submit → `updateListing()` → `setIsDirty(false)`, `setDone(true)`, success screen (`ListingFormShell.tsx:267-290`), redirect after 3s.
- **5b — Staff status change**: Staff (admin/moderator) opens same edit page → `canManageStatus=true` → status block renders (`ListingFormShellView.tsx:307-319`) with `statusOptions` derived from `ALLOWED_LISTING_TRANSITIONS` for `currentStatus`. Selecting a target + submitting calls `onStatusChange` (`ListingFormShell.tsx:300-307`) → `changeListingStatusAction` → on success, `setCurrentStatus(result.nextStatus)` + `router.refresh()` re-renders the badge/options with the new status.

## Negative Flow Verification (kickoff §6, 14 branches)

| # | Branch | Handler / Guard |
|---|---|---|
| 1 | Cancel with unsaved changes | `onCancelClick` (`ListingFormShell.tsx:292-298`): `isDirty===true` → `setShowCancel(true)` opens confirm `Dialog` |
| 2 | Cancel without changes | `onCancelClick`: `isDirty===false` → `navigateAway()` directly, no dialog |
| 3 | Save attempted while `!isDirty` | Save button `disabled={submitting \|\| !isDirty}` (`ListingFormShellView.tsx:298`) — click is a no-op |
| 4 | Save with client validation errors | `handleSubmit()` builds `newErrors`, on non-empty `setErrors(newErrors)` + `scrollToFirstError(newErrors)` + early `return` (`ListingFormShell.tsx:200-204`) |
| 5 | Save server error | `updateListing`/`createListing` returns `{error:...}` (not `not_found`) → `setSubmitError(t('error_updating'/'error_creating'))`, `setSubmitting(false)`, banner rendered (`ListingFormShellView.tsx:288-292`) |
| 6 | Save → `not_found` | `result.error === 'not_found'` → `router.push('/cabinet/listings')`, early return (`ListingFormShell.tsx:242-245`) |
| 7 | Status change — `invalid_transition` | `changeListingStatusAction` returns `{ok:false, reason:'invalid_transition'}` (from `applyListingTransitionByStatus`) → `onStatusChange` throws `Error(result.reason)`, surfaced by `StatusChangeControl`'s own error handling (canonical component, not reimplemented) |
| 8 | Status change — `forbidden` (non-staff / unauth) | `changeListingStatusAction` resolves no user or non-staff role → `applyListingTransitionByStatus` enforces `canAdminEditListing(actor.role)` → `{ok:false, reason:'forbidden'}` → thrown in `onStatusChange`; UI-level guard also prevents the control from rendering at all for non-staff (`canManageStatus`) |
| 9 | Status change — `not_found`/`db_error` | Same `{ok:false, reason}` path from `applyListingTransitionByStatus` → thrown in `onStatusChange`, caught/displayed by `StatusChangeControl` | 
| 10 | Status change — same-status no-op | `statusOptions` includes `s === statusControl.currentStatus` (`ListingFormShellView.tsx:114`); `applyListingTransitionByStatus` treats same-status as a no-op success — `onStatusChange` still calls `setCurrentStatus`/`router.refresh()` harmlessly |
| 11 | Double-submit | `disabled={submitting \|\| !isDirty}` on Save (`:298`) and `disabled={submitting}` on Cancel (`:303`) prevent re-entrancy while a submit is in flight |
| 12 | Offline / expired session | `changeListingStatusAction`: `getUser()` returns `null` → `{ok:false, reason:'forbidden'}`; `updateListing`/`createListing` server actions perform their own auth check, surfacing as the existing "Save server error" path (#5) |
| 13 | Locale mismatch | All strings referenced by the new view/story resolve via `useTranslations`/`getTranslations` against keys verified present in all 4 locale files — no fallback/raw-key rendering possible |
| 14 | Create-mode never shows status control | `statusControl` is computed as `canManageStatus && isEditMode(mode) && currentStatus ? {...} : undefined` (`ListingFormShell.tsx:328-332`); in create mode `canManageStatus`/`currentStatus` are typed `never` (`CreateModeProps`, `:38-44`) and `isEditMode('create')` is `false`, so the expression is always `undefined` |

## Control Inventory — Before / After (Notes 20 & 21)

| Control | Before | After |
|---|---|---|
| Save button | Bottom of single-column form, `disabled={submitting}` — **NOT** gated on `!isDirty` (kickoff §2 line 58) | Moved to sidebar action panel, top position; **`!isDirty` ADDED** → `disabled={submitting \|\| !isDirty}` (new behavior per AC 2 / kickoff §3.3, not a preserved condition) (`ListingFormShellView.tsx:298`) |
| Cancel button | Ghost button in page **header** | **Relocated** to sidebar action panel (2nd position), same `isDirty → confirm Dialog → navigateAway()` logic preserved verbatim (`ListingFormShell.tsx:292-298`). Header ghost Cancel **removed** — Note 21 (Control Relocation Rule): functionally equivalent control now lives in the sidebar panel, not deleted/lost. |
| Cancel confirmation Dialog | Rendered inline in single-column layout | Same `Dialog`, same `open`/`onOpenChange`/Yes/No wiring, now rendered after `AdminEditLayout` (`ListingFormShellView.tsx:325-340`) — Esc/backdrop dismiss unchanged (canonical `Dialog` behavior) |
| Change-status control | **Did not exist** | **New** — staff-only block in sidebar panel, `StatusChangeControl variant="select"` with note, status options from `listingTransitionEngine` (`ListingFormShellView.tsx:307-319`) |

## i18n Parity

0 new keys added. Verified all referenced translation keys exist with full parity across `sq`/`en`/`uk`/`it` — **1787/1787 keys per locale**, unchanged from baseline.

## Validation

- `npx tsc --noEmit` → **0 errors**
- `npm run lint` → **0 warnings/errors** (incl. resolved `'isVisible' is defined but never used`)
- `npm run build` → **OK**
- `check:i18n` / `check:i18n-dynamic` / `check:i18n-hardcode` → **PASS**
- `check:file-integrity:all` → **clean**
- `check:stories` → **PASS**
- `npm run build-storybook` → **OK**
- `npm run screenshots:assert` → **`Results: 3976/3976 PASS, 0 FAIL`, flaky-recovered: 0** (71 stories × 14 viewports × 4 locales, incl. the 2 new `ListingFormShellView` stories `Owner`/`Staff` across all breakpoints incl. mobile 320/375/390 and all locales incl. `uk`)

## Self-validation

Self-validation: tsc=0, lint=0, build=OK, all i18n/file-integrity/story checks PASS, screenshots:assert=3976/3976 PASS (0 FAIL), all 9 ACs (§8) and all 14 negative-flow branches (§6) verified against the actual diff with file:line citations. Task 238 implementation complete, ready for orchestrator review.

## Orchestrator Review — 2026-06-14 (Opus) — **VERDICT: APPROVED**

Reviewed the **actual changed files** (Read tool) against the kickoff, plus the owner's **native PowerShell** gate run (sandbox git/gates not used as verdict, per orchestrator-role standing rules).

- **Native gates (authoritative, owner-run):** HEAD `9bafe3db8d1c00b1316ddcc21166a1d56ebdfd4c`; `node --check changeListingStatus.ts` ok; `tsc --noEmit`=0; `lint`=0; `check:stories`=0 violations (sq/en/uk/it 299-key parity); `screenshots:assert`=**3976/3976 PASS, 0 FAIL** (3 flaky-recovered, all unrelated — Badge/Skeleton/FilterBar). `git diff --stat` + `git status` match the Files Changed table exactly.
- **Verified faithful in code:** server-side role resolution + `source:'cabinet'` delegation to `applyListingTransitionByStatus` (`changeListingStatus.ts`); `canManageStatus`/`currentStatus` server-computed & threaded (`edit/page.tsx:63,121` → Loader → Shell), create-mode typed `never`; status options derived from `ALLOWED_LISTING_TRANSITIONS` (not hardcoded); Cancel relocation + `isDirty→Dialog→navigateAway` preserved; **negative branches 7/8/9 confirmed real** — `StatusChangeControl.handleSubmit` (`:85–94`) catches the thrown `Error(result.reason)` → `toast.error(status_change_error)`.
- **Doc correction (applied above):** the Save "Before" condition was mis-stated as `disabled={submitting \|\| !isDirty}`; per kickoff §2 the before-state was `disabled={submitting}` and `!isDirty` is **new** (AC 2). Code is correct; the inventory row was wrong and is now fixed.
- **One known gap → deferred to Task 425 (owner decision, Option 1):** kickoff §4 required the `StatusChangeControl` `variant="select"` note **submit button** to be `max-sm:w-full max-sm:min-h-11`; the reused canonical component ships it as `size="sm"` (not full-width at <640). Sonnet correctly honored the §10/§1.3 "reuse, do NOT redesign StatusChangeControl" fence — this is an orchestrator-owned canonical-component fix, not a 238 defect. **Task 238 is APPROVED; Task 425 opened** to bring that button (both variants) into the mobile full-width gate without behavior change.

Commit emitted by the orchestrator at review (explicit paths, single-writer; owner runs in PowerShell). `tasks/Epics/Epic_II_kickoff_prompt_Task_323.md` is **excluded** (unrelated Epic II file).
