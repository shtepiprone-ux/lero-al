# Session Archive: Task 107 — Remove Dead-Code Avatar Server Actions — 2026-05-19

## Task 107 Summary

**Type:** Chore / dead-code elimination  
**Sprint:** 2 — Technical Debt Cleanup

---

## Pre-Task Mandatory Checklist

- [x] No duplicate components — deleting code only, no new components
- [x] No hardcode — no UI changes
- [x] Scope isolated — `src/modules/cabinet/actions/index.ts` + `src/modules/admin/actions/index.ts`

---

## Investigation

### Caller search (pre-deletion)

```
rg -n "uploadCabinetAvatar" src/
→ cabinet/actions/index.ts:293 (definition only)

rg -n "uploadUserAvatar" src/
→ admin/actions/index.ts:542 (definition only)
```

Zero callers confirmed. Both functions were superseded by `/api/upload-avatar` during Epic A.1 (Task 103).

### Shared helpers analysis

| File | Function | Used by | Decision |
|------|----------|---------|----------|
| `cabinet/actions/index.ts` | `uploadToCloudinary` (local) | Only `uploadCabinetAvatar` | Deleted with the action |
| `cabinet/actions/index.ts` | `createHash` import | Also used by email-change token functions (lines 414, 478, 510) | **Kept** |
| `admin/actions/index.ts` | `uploadToCloudinary` (local) | Only `uploadUserAvatar` | Deleted with the action |
| `admin/actions/index.ts` | `createHash` import | Only `uploadToCloudinary` | **Deleted** |

---

## Changes Made

### `src/modules/cabinet/actions/index.ts`

Removed:
- Comment block `// ── Cloudinary avatar upload for cabinet ──`
- `uploadToCloudinary()` helper function (36 lines)
- `uploadCabinetAvatar()` export function (38 lines)

Kept: `import { createHash, randomBytes } from 'crypto'` — `createHash` used by email-change token hashing.

### `src/modules/admin/actions/index.ts`

Removed:
- `import { createHash } from 'crypto'` — exclusively used by the deleted `uploadToCloudinary`
- Comment block `// ── Cloudinary signed upload helper ──`
- `uploadToCloudinary()` helper function (36 lines)
- Comment block `// Restored original FormData/File upload contract…`
- `uploadUserAvatar()` export function (38 lines)

---

## Verification

### Post-deletion grep

```
rg -n "uploadCabinetAvatar" src/   → (no output — zero hits) ✅
rg -n "uploadUserAvatar" src/      → (no output — zero hits) ✅
```

### Call sites confirmed unaffected

| Component | Upload path | Status |
|-----------|-------------|--------|
| `AdminUserAvatar.tsx` (edit mode) | `fetch('/api/upload-avatar', …)` | ✅ Unchanged |
| `AdminUserProfile.tsx` (create mode) | `fetch('/api/upload-avatar', …)` | ✅ Unchanged |
| `ProfileTab.tsx` (cabinet) | Uses `AdminUserAvatar` → `fetch('/api/upload-avatar', …)` | ✅ Unchanged |

### `/api/upload-avatar/route.ts` — untouched ✅

---

## Validation

| Check | Result |
|-------|--------|
| `rg "uploadCabinetAvatar" src/` | ✅ Zero hits |
| `rg "uploadUserAvatar" src/` | ✅ Zero hits |
| `/api/upload-avatar` untouched | ✅ |
| `npm run lint` | ✅ 0 errors / 5 pre-existing warnings |
| `npm run typecheck` | ✅ 4 pre-existing test-file errors (unchanged) |
| `npm run governance:localization` | ✅ PASS C0/H0/M18 — keys 862 per locale |
| Orphaned translation keys | None — deleted functions used only error-code strings (no i18n keys) |
