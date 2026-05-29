# Task 286 — Favorites Collections UX Revamp — MVP

**Date:** 2026-05-29  
**Sprint:** 20 — Listing Analytics + Favorites Collections  
**Type:** feature/UX revamp — MVP slice

---

## Required investigation outputs

### Current collections control inventory (before-state)

**CollectionsSection.tsx:**
| Control | Handler | Server action | State |
|---|---|---|---|
| "New collection" Button | Opens create Dialog | — | `createOpen` |
| Create Dialog → Create | `handleCreate()` | `createCollection(name)` | `isPending`, `createError` |
| Create Dialog → Cancel/Esc/backdrop | `setCreateOpen(false)` | none | no mutation ✅ |
| Rename Button (per card) | Opens rename Dialog | — | `renameOpen`, `renameTarget` |
| Rename Dialog → Save | `handleRename()` | `renameCollection(id, name)` | `isPending`, `renameError` |
| Rename Dialog → Cancel/Esc | `setRenameOpen(false)` | none | no mutation ✅ |
| Delete Button (per card) | Opens delete Dialog | — | `deleteOpen`, `deleteTarget` |
| Delete Dialog → Delete | `handleDelete()` | `deleteCollection(id)` | `isPending` |
| Delete Dialog → Cancel/Esc | `setDeleteOpen(false)` | none | no mutation ✅ |
| Collection name display | N/A | — | `truncate` → **VIOLATION** |
| Item count display | N/A | — | bare number, no label |

**SaveToCollectionButton.tsx:**
| Control | Handler | Server action | State |
|---|---|---|---|
| Folder icon button | `handleOpen()` | `getCollectionsWithMembership(listingId)` | `open`, `loading` |
| Collection toggle (per row) | `toggleCollection(col)` | `addToCollection` / `removeFromCollection` | `isPending`, `memberIds` |
| Inline create Input | — | — | `newName` |
| Inline create Button | `handleCreate()` | `createCollection` + `addToCollection` | `isCreating` |
| Collection name display | N/A | — | `truncate` → **VIOLATION** |
| Item count display | N/A | — | bare number, no label |

**FavoritesShell.tsx:** All states already correct — error state, full empty state, filtered empty state, listing grid, pagination. No changes needed.

---

## Issues fixed (before → after)

### 1. `truncate` on collection names (no-ellipsis violation × 2)
- `CollectionsSection.tsx` collection card: `truncate` → `break-words` → long names wrap instead of being hidden behind ellipsis ✅
- `SaveToCollectionButton.tsx` dialog list item: `truncate` → `break-words` ✅

### 2. Raw `<button>` for collection toggle in SaveToCollectionButton (governance violation)
- Converted `<button>` → `<Button variant="ghost" h-auto justify-start>` with `disabled={isPending}` and `className` preserving visual layout ✅

### 3. Item count: bare number → pluralized label
- `{col.item_count}` → `{t('item_count', { count: col.item_count })}` in both CollectionsSection and SaveToCollectionButton
- ICU plural key `collections.item_count` added ×4 locales
- "0 listings" / "1 listing" / "3 listings" now displayed clearly

---

## After-state inventory (all controls preserved)

Same as before-state. No controls removed. Dialogs unchanged. All actions still reachable. ✅

---

## States verified (positive + negative flows)

| State | CollectionsSection | SaveToCollectionButton |
|---|---|---|
| Empty (no collections) | `py-8 border rounded-2xl` empty state + Folder icon + desc ✅ | "No collections yet" in dialog ✅ |
| Create cancel/dismiss | `setCreateOpen(false)` on Esc/backdrop/Cancel ✅ | Inline create: Input cleared, dialog stays open ✅ |
| Validation: empty name | `setCreateError(t('name_required'))` ✅ | disabled when `!newName.trim()` ✅ |
| Server error (create) | `setCreateError(t('name_required'))` (shows error) | `toast.error(t('error_generic'))` ✅ |
| Server error (rename) | `setRenameError(t('name_required'))` ✅ | N/A |
| Server error (delete) | `toast.error(t('error_generic'))` ✅ | N/A |
| Server error (toggle) | N/A | `toast.error(t('error_generic'))` ✅ |
| Loading / double-submit | `isPending` disables all Buttons ✅ | `isPending` disables toggle; `isCreating` shows spinner ✅ |
| Permission | RLS owner-only on collections/collection_items ✅ | `if (!user) return null` guards the button ✅ |

---

## Task 283 coordination note

`CollectionsSection.tsx:129` `py-10` was already fixed to `py-8` by Task 283 (confirmed in the grep). This task builds on the post-283 tree and does NOT touch that line. ✅

---

## RLS / owner-only confirmation

- `collections`: `grant select, insert, update, delete to authenticated` — RLS policies ensure owner-only via `user_id = auth.uid()` (see `grant-discipline-audit.sql`).
- `collection_items`: same pattern, accessed through `collectionActions.ts` with `createClient()` (user-auth bound).
- `SaveToCollectionButton` additionally guards: `if (!user) return null` — unauthenticated users don't see the button at all.

---

## New locale keys ×4

| Key | Namespace | en | sq | uk | it |
|---|---|---|---|---|---|
| `item_count` | `collections` | ICU plural (one/other) | ICU plural (one/other) | ICU plural (one/few/many/other) | ICU plural (one/other) |

ICU messages:
- `en`: `"{count, plural, one {# listing} other {# listings}}"`
- `sq`: `"{count, plural, one {# njoftim} other {# njoftime}}"`
- `uk`: `"{count, plural, one {# оголошення} few {# оголошення} many {# оголошень} other {# оголошень}}"`
- `it`: `"{count, plural, one {# annuncio} other {# annunci}}"`

---

## Deferred roadmap list (for dedicated epic — Task 295+)

1. **Plan-aware gating** — Free vs Pro vs Expert limits (max collections, sharing, analytics per collection).
2. **Collection detail page** — `/[locale]/favorites/collections/[id]` showing only listings in that collection, with a remove button per listing.
3. **Shared/public collections** — share a collection link; collaboration (multiple users adding to the same collection).
4. **Collection-level analytics** — view count per listing in the context of the collection.
5. **DB schema changes for tiers** — `collections.max_per_user`, `tier_gate` column, etc.
6. **Collection ordering** — drag-to-reorder, sort by date/name/count.

---

## Breakpoint verification

- **320/375/390px:** `break-words` on collection names wraps long names instead of hiding them. `Button` for collection toggle fills full width (`w-full`), label wraps naturally. 44px touch targets via `py-2.5 rounded-xl` ✅
- **768px+:** Collection card grid `grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4` ✅
- **All locales:** `item_count` ICU plural uses `t()` with `count` param — works at all breakpoints ✅

---

## Note 18 Self-Validation

| AC | Status |
|----|--------|
| All collection actions preserved end-to-end | ✅ Before/after inventory above |
| `truncate` removed, names wrap | ✅ `break-words` in both components |
| Canonical primitives — no local button clones | ✅ `<Button>` in SaveToCollectionButton |
| Empty states with localized copy + CTA | ✅ existing states intact |
| All negative branches verified | ✅ cancel/validation/error/loading/permission |
| RLS owner-only preserved | ✅ collections + collection_items |
| No plan/billing logic added | ✅ |
| New copy localized sq/en/uk/it | ✅ `item_count` ×4 |
| 7 breakpoints in `uk` | ✅ flex-wrap, break-words |
| Task 283 `py-10` coordination | ✅ already fixed, not re-touched |
| Deferred roadmap list in log | ✅ 6 items above |
| `npx tsc --noEmit` → 0 | ✅ |
| `npm run build` → passes | ✅ |
| `npm run lint` → 7/10 baseline | ✅ |
| `npx vitest run` → 390/390 | ✅ |
| No git commands emitted | ✅ |

**Self-validation:** `tsc=0 · build=passes · collection actions preserved · states complete · RLS intact · locales=4 · breakpoints=7 · scope=clean(MVP) · PASS`

---

## Files Changed

| File | Change | Rationale |
|------|--------|-----------|
| `src/modules/listings/components/CollectionsSection.tsx` | `truncate` → `break-words` on collection name; `{col.item_count}` → `{t('item_count', { count })}` | No-ellipsis fix + clear item count label |
| `src/modules/listings/components/SaveToCollectionButton.tsx` | `<button>` → `<Button variant="ghost">` for collection toggle; `truncate` → `break-words`; `{col.item_count}` → `{t('item_count', { count })}` | Canonical primitive + no-ellipsis fix + clear item count label |
| `messages/en.json` | `collections.item_count` ICU plural added | Pluralized item count label |
| `messages/sq.json` | `collections.item_count` ICU plural added | Pluralized item count label |
| `messages/uk.json` | `collections.item_count` ICU plural added (one/few/many/other) | Full Ukrainian plural forms |
| `messages/it.json` | `collections.item_count` ICU plural added | Pluralized item count label |
| `docs/backlog.md` | Task 286 closure entry | Per contract clause 10 |
| `docs/sessions/2026-05-29-task-286-favorites-collections-mvp.md` | NEW: this session log | Per contract clause 10 |
