# Session Archive: Task 144 — H.6 Cloudinary Safety Audit / Dry-run Framework — 2026-05-22

## Task

**Task 144 — Epic H.6 — deleteAsset safety wrapper (blocks H.3 + H.5)**
Type: Tooling / Safety | Priority: High

## What was built

### `src/lib/cloudinaryDelete.ts`

Single exported function `deleteAsset(publicId, { reason, dryRun? })`.
Return type: `DeleteAssetResult { skipped, skipReason?, dryRun, deleted }`.

**Safety sequence (always in this order):**
1. Reference check — 4 Supabase queries (see table below); any hit → skip
2. If dry-run → log DRY_RUN, return (no Cloudinary call)
3. If enabled → log + call `/image/destroy` API

### Reference check tables

| Table | Column | Query type |
|---|---|---|
| `listing_images` | `public_id` | `.eq()` exact match |
| `listing_images` | `url` | `.ilike('%publicId%')` |
| `users` | `avatar_url` | `.ilike('%publicId%')` |
| `companies` | `logo_url` | `.ilike('%publicId%')` |
| `popular_locations` | `photo` | TODO — added when Epic J table lands |

### Structured log format

Every call produces `console.info('[deleteAsset]', entry)` where `entry` has:
```
{ publicId, reason, dryRun, outcome: 'SKIP_REFERENCED'|'DRY_RUN'|'DELETED'|'ERROR',
  referencedIn?: string[], error?: string }
```

### Env flag

`CLOUDINARY_DELETE_MODE`:
- absent / any value other than `'enabled'` → **dry-run** (default)
- `'enabled'` → real delete after reference check

Can be overridden per-call via `options.dryRun`.

### Deletion rule

`deleteAsset` is the ONLY allowed way to delete Cloudinary assets. Enforced by convention:
```bash
git grep "image/destroy" src/  # must return only cloudinaryDelete.ts
```

## Test results

```
src/lib/__tests__/cloudinaryDelete.test.ts   5/5 passed
  ✓ skips when public_id directly referenced in listing_images
  ✓ skips when URL is referenced in any table
  ✓ dry-run: returns dryRun=true, no Cloudinary call
  ✓ dry-run: logs structured DRY_RUN entry
  ✓ enabled mode: calls Cloudinary destroy when unreferenced
```

## Files created / modified

| File | Change |
|---|---|
| `src/lib/cloudinaryDelete.ts` | **NEW** — deleteAsset wrapper |
| `src/lib/__tests__/cloudinaryDelete.test.ts` | **NEW** — 5 tests (vi.mock Supabase + fetch) |
| `docs/env.md` | Added `CLOUDINARY_DELETE_MODE` |
| `docs/integrations.md` | Added §Cloudinary Deletion Rules with table matrix |

## Acceptance criteria

- [x] `deleteAsset` wrapper is the only Cloudinary delete path (documented + grep rule).
- [x] Dry-run is default; real delete requires `CLOUDINARY_DELETE_MODE=enabled`.
- [x] Reference check covers all current DB tables; `popular_locations` noted as TODO for Epic J.
- [x] Integration tests pass: referenced asset skipped; unreferenced dry-run logged; enabled mode calls API.
- [x] Structured log format documented.
- [x] `npm run typecheck` → 0 new errors.
- [x] `npm run lint` → 0 warnings.

## Out of scope

Avatar cleanup (H.3), listing image cleanup (H.5). Both depend on this task and can now proceed.
