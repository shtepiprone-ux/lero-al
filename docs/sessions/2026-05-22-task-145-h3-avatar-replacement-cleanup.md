# Session Archive: Task 145 — H.3 Avatar Replacement Cleanup — 2026-05-22

## Task

**Task 145 — Epic H.3 — Avatar replacement cleanup**
Type: Feature | Depends on: H.2 (Task 142), H.6 (Task 144)

## Change

`src/app/api/upload-avatar/route.ts` — added old-avatar cleanup after a successful DB update.

**Operation order (DB-first is mandatory):**
1. Upload new avatar to Cloudinary → capture `newPublicId`
2. Read `priorProfile.avatar_url` from DB (admin client, before overwrite)
3. Update `users.avatar_url = cloudUrl` in DB ← DB commit
4. Derive `oldPublicId = publicIdFromUrl(oldAvatarUrl)`
5. If `oldPublicId` exists AND `oldPublicId !== newPublicId` → `deleteAsset(oldPublicId, { reason: 'avatar_replaced' })`

**Skips when:**
- No prior avatar (`oldAvatarUrl` is null)
- Same asset re-uploaded (`oldPublicId === newPublicId`) — idempotent guard

**Non-fatal:** `deleteAsset` errors are caught and logged; they do not affect the HTTP response. The DB update has already committed at that point.

## Safety

`deleteAsset` runs the H.6 reference check before any actual delete. By default (`CLOUDINARY_DELETE_MODE` absent or `dry-run`) it only logs — no real Cloudinary deletion occurs until the env flag is set to `enabled`.

## Files changed

| File | Change |
|---|---|
| `src/app/api/upload-avatar/route.ts` | Import `publicIdFromUrl` + `deleteAsset`; capture old URL; cleanup after DB update |

## Acceptance criteria

- [x] DB updated before any Cloudinary delete — order enforced in code.
- [x] Old public_id derived via `publicIdFromUrl` (no new DB column needed).
- [x] Skips when old URL is null or same as new (idempotent re-upload guard).
- [x] Delete is non-fatal — errors logged, response unaffected.
- [x] H.6 reference check still runs (regression: if asset is elsewhere, skip fires).
- [x] `npm run typecheck` → 0 new errors.
- [x] `npm run lint` → 0 new warnings.
- [ ] Manual: replace avatar → Cloudinary console shows old asset log in dry-run; or actual delete in enabled mode.

## Out of scope
Listing image cleanup (H.5). Other photos (H.7).
