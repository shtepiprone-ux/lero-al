# Task 168 — Admin user profile: Save stays disabled after role change

**Date:** 2026-05-22  
**Sprint:** Sprint 5 (post-deploy bugfixes)  
**Status:** ✅ DONE

## Problem

In the admin user profile edit mode, changing only the "Тип акаунту" (account type / role) did not enable the Save button. The button is `disabled={saving || (!isCreate && !isDirty)}`. The Combobox `onChange` called `setValue('profileType', v)` without `{ shouldDirty: true }`, so react-hook-form never flipped `isDirty`.

## Change

`src/components/admin/AdminUserProfile.tsx` line 697:

```diff
- onChange={v => { if (v) setValue('profileType', v as ProfileType) }}
+ onChange={v => { if (v) setValue('profileType', v as ProfileType, { shouldDirty: true }) }}
```

Single character addition — matches the existing pattern used by phone fields.

## Verification

- `profileTypeToDb` mapping unchanged; role persists correctly.
- Other fields still mark dirty and save as before.
