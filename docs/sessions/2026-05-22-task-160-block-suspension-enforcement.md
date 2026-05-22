# Session Archive: Task 160 — Block/Suspension Enforcement — 2026-05-22

## Task

**Task 160 — C.5 follow-up — Real block/suspension enforcement server-side**
Type: Security hardening | No UI changes.

## What was done

### Canonical helper: `src/lib/auth/blockCheck.ts`

`getBlockedError(userId): Promise<BlockedError | null>`

Logic:
1. Fetch `status` + `suspended_until` via user-scoped Supabase client.
2. If `status !== 'blocked'` → `null` (not blocked).
3. If `status === 'blocked'` AND `suspended_until` is set AND now ≥ until → **auto-lift** (update via admin client → `{ status:'active', suspended_until:null, block_reason:null }`), return `null`.
4. If `status === 'blocked'` AND `suspended_until` > now → return `'account_suspended'`.
5. If `status === 'blocked'` AND no `suspended_until` → return `'account_blocked'`.

**Auto-lift** uses `createAdminClient()` to bypass RLS (users cannot update their own `status`).

### Actions updated (7 files)

| Action file | Check added |
|---|---|
| `createListing.ts` | Replaced inline `status === 'blocked'` check with `getBlockedError` |
| `updateListing.ts` | New check |
| `deleteListing.ts` | New check |
| `favoriteActions.ts` | New check on `addFavorite` + `removeFavorite` |
| `collectionActions.ts` | New check on all 5 mutation functions (create/rename/delete/add/remove) |
| `reportListing.ts` | New check |
| `cabinet/actions/index.ts` | New check on `updateCabinetProfile` |

**Not added to:** `recentlyViewedActions` (passive tracking), `applyListingTransition` (admin-context), `deleteOwnAccount` (blocked users retain self-deletion rights).

### i18n (2 keys × 4 locales)

- `listing.error_account_blocked` — updated to generic "cannot perform this action" (was listing-specific)
- `listing.error_account_suspended` — NEW: "temporarily suspended, try later"

## Session behavior (scope item 3)

**Decision: no forced sign-out.** Blocked/suspended users can still browse the site (read-only). Their session remains valid — they see their blocked status, understand why, and (if suspended) know when it lifts. Writes are rejected with a localized error code.

This is consistent with the existing `createListing` pattern (returns `{ error: 'account_blocked' }` → client shows toast).

## Acceptance criteria

- [x] Canonical `getBlockedError` helper — single source of truth.
- [x] All 7 user-facing write actions use it.
- [x] `suspended_until` enforced + auto-lifted when expired.
- [x] `listing.error_account_suspended` added (sq/en/uk/it).
- [x] `npm run typecheck` → 0 new errors; `npm run lint` → 0 warnings.
- [x] `governance:localization` PASS.
