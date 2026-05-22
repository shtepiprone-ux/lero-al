# Session Archive: Task 136 — F.2 Favorites Folders/Collections — 2026-05-22

## Summary

Added named collections for organizing favorites: create, rename, delete collections; add/remove listings from collections via a picker Dialog. Surfaced on the favorites page (CollectionsSection + per-card hover button) and the listing detail page (SaveToCollectionButton in ListingContact).

## DB Migration SQL (run in Supabase dashboard before using collections)

```sql
-- Collections table
CREATE TABLE IF NOT EXISTS collections (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS collections_user_id_idx ON collections(user_id);

-- Items within each collection
CREATE TABLE IF NOT EXISTS collection_items (
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  listing_id    UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (collection_id, listing_id)
);

-- RLS
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "collections_owner_all" ON collections
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "collection_items_owner_all" ON collection_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM collections c WHERE c.id = collection_id AND c.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM collections c WHERE c.id = collection_id AND c.user_id = auth.uid())
  );
```

## Files Changed

| File | Change |
|---|---|
| `src/types/database.ts` | Added `Collection`, `CollectionWithCount` interfaces |
| `src/modules/listings/actions/collectionActions.ts` | New — 6 server actions |
| `src/modules/listings/lib/favoritesQueries.ts` | Added `getUserCollections()` |
| `src/modules/listings/components/CollectionsSection.tsx` | New — create/rename/delete UI |
| `src/modules/listings/components/SaveToCollectionButton.tsx` | New — add/remove picker Dialog |
| `src/app/[locale]/favorites/page.tsx` | Pre-fetch collections; pass to shell |
| `src/modules/listings/components/FavoritesShell.tsx` | CollectionsSection + per-card SaveToCollectionButton overlay |
| `src/modules/listings/components/ListingContact.tsx` | SaveToCollectionButton next to FavoriteButton |
| `messages/sq.json` | `collections` namespace (20 keys) |
| `messages/en.json` | Same |
| `messages/uk.json` | Same |
| `messages/it.json` | Same |

## Architecture

**Server actions** (`collectionActions.ts`):
- `getCollectionsWithMembership(listingId)` — callable from client; returns collections + which contain the listing (3 DB queries)
- `createCollection(name)` — INSERT with 23505 duplicate guard
- `renameCollection(id, newName)` — UPDATE with user_id guard
- `deleteCollection(id)` — DELETE with user_id guard; cascades to collection_items
- `addToCollection(id, listingId)` — INSERT idempotent (23505 = success)
- `removeFromCollection(id, listingId)` — DELETE (0-row = success)

**CollectionsSection** — pure client component with local state; optimistic updates after server actions.

**SaveToCollectionButton** — lazy fetch on Dialog open (`getCollectionsWithMembership`); toggles checkboxes immediately (optimistic), then confirms via server action.

**Per-card overlay** — uses `group-hover` + `opacity-0 group-hover:opacity-100 focus-within:opacity-100` pattern to show the folder button only on hover/focus, keeping the card grid clean.

## i18n Keys Added (collections namespace)

20 keys: `title`, `new`, `name_placeholder`, `create`, `save_to`, `no_collections`, `no_collections_desc`, `rename`, `delete`, `delete_confirm`, `new_name_placeholder`, `created`, `renamed`, `deleted`, `added`, `removed`, `name_required`, `error_generic` — all 4 locales (sq/en/uk/it).

## Acceptance Criteria

- [x] DB schema documented (SQL in this log)
- [x] `collections` + `collection_items` tables defined with RLS (owner-only)
- [x] Create collection — Dialog with Input, validated, toast on success
- [x] Rename collection — Dialog with pre-filled Input
- [x] Delete collection — confirm Dialog, cascade deletes items
- [x] Add to collection — SaveToCollectionButton picker with checkbox UI
- [x] Remove from collection — same picker, toggle off
- [x] Canonical primitives only: `Dialog`, `Button`, `Input`
- [x] All 4 locales: sq, en, uk, it
- [x] All 7 breakpoints: collection grid uses `grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4`
- [x] 0 new lint/warnings; 0 new TS errors in production code
