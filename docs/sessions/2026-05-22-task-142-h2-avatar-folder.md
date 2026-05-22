# Session Archive: Task 142 — H.2 Avatar Folder Structure — 2026-05-22

## Task

**Task 142 — Epic H.2 — Avatar folder structure `<user_id>/avatars/`**
Type: Refactor | Priority: Medium | Depends on: H.1 (Task 141)

## Change

Single-line change in `/api/upload-avatar/route.ts`:

```diff
- const result = await uploadToCloudinary(bytes, file.type, 'avatars')
+ const result = await uploadToCloudinary(bytes, file.type, `${uploadForUserId}/avatars`)
```

`uploadForUserId` was already computed (`targetUserId ?? user.id`) prior to the upload call, so no additional logic is needed.

## Why DB reference stays valid

`upload-avatar` already writes `users.avatar_url = result.url`. Cloudinary returns the new path URL; the DB is updated atomically in the same request. Profile picture display (`AppImage variant="avatar"`) applies transforms after `/upload/` in the URL — the new path is still a valid Cloudinary URL and `imageDelivery.ts` handles it correctly (marker = `/upload/`).

## Other avatar-write paths audited

All avatar uploads route through `/api/upload-avatar`:
- Cabinet (`AdminUserProfile.tsx`) → POST `/api/upload-avatar`
- Admin user panel (`AdminUserAvatar.tsx`) → POST `/api/upload-avatar`
- No direct `users.avatar_url` writes outside this route.

## Files changed

| File | Change |
|---|---|
| `src/app/api/upload-avatar/route.ts` | Folder: `'avatars'` → `` `${uploadForUserId}/avatars` `` |
| `docs/integrations.md` | Avatar implementation status updated to ✅ H.2 |

## Acceptance criteria

- [x] New avatar upload lands in `<user_id>/avatars/` in Cloudinary.
- [x] DB `users.avatar_url` updated to new URL atomically in same request.
- [x] `AppImage variant="avatar"` renders correctly (URL format compatible).
- [x] Admin avatar upload (with targetUserId) uses `targetUserId/avatars/` — correct.
- [x] `npm run typecheck` → 0 new errors.
- [x] `npm run lint` → 0 new warnings.
- [ ] Manual verification: upload avatar → confirm Cloudinary console shows `<user_id>/avatars/` path.

## Out of scope

Avatar replacement cleanup (H.3 — needs H.6 first).
