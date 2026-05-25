# Task 226 (T221c) — Admin Input h-10 Canonicalization

**Date:** 2026-05-25
**Sprint:** Sprint 11 — UI Debt Follow-ups
**Status:** ✅ DONE

## Scope

Replace all `<Input className="h-10 rounded-xl ...">` ad-hoc overrides in admin files with a canonical `AdminInput` wrapper that bakes in `h-10 rounded-xl` (40px — admin canonical form height).

## Decision gate

Counted 31+ `h-10` Input occurrences across 6 files (≥8 across ≥4 files) → deliberate design decision → create `AdminInput` wrapper (not simply remove overrides).

## New file

### `src/components/admin/AdminInput.tsx`
```tsx
import type { ComponentProps } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export function AdminInput({ className, ...props }: ComponentProps<typeof Input>) {
  return <Input className={cn('h-10 rounded-xl', className)} {...props} />
}
```

## Files updated

| File | Inputs converted | Notes |
|---|---|---|
| `AdminSettings.tsx` | 13 | All h-10; one multi-line element caught separately |
| `AdminLocationsManager.tsx` | 5 | `font-mono text-xs` extras preserved |
| `AdminLegalManager.tsx` | 2 | `font-mono text-xs` on slug preserved |
| `AdminListingsTable.tsx` | 1 | date picker, `flex-1` class preserved |
| `AdminUserCreate.tsx` | 3 | firstName, lastName, email |
| `AdminUserProfile.tsx` | 7 | h-10 inputs only; `blockReason` (h-9 rounded-xl text-sm) kept as `<Input>` |

## Documentation

`docs/ui-rules.md §4` — added "Admin-Input Canonical Pattern" section:

| Context | Component | Height |
|---|---|---|
| Public forms | `Input` | `h-9` (36px, default) |
| Admin forms | `AdminInput` | `h-10` (40px, canonical) |

Rules: always use `AdminInput` in admin files; never use `<Input className="h-10..."` in admin.

## Verification

`tsc --noEmit` → 0 errors. `grep '<Input className="h-10' src/components/admin/` → 0 matches.
