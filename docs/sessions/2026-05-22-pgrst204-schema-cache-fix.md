# PGRST204 — suspended_until schema cache miss (post-deploy investigation)

**Date:** 2026-05-22  
**Sprint:** Sprint 5 (post-deploy bugfixes)  
**Status:** ✅ RESOLVED

## Symptom

After clicking Save on any admin user profile, the toast "Помилка збереження профілю. Спробуйте ще раз." appeared and changes were not persisted.

Server log:
```
updateUserProfileFull failed {
  error: {
    code: 'PGRST204',
    details: null,
    hint: null,
    message: "Could not find the 'suspended_until' column of 'users' in the schema cache"
  },
  userId: '...'
}
```

## Root cause

PostgREST had a **stale schema cache**. The `suspended_until` column exists in the live `users` table (confirmed via `information_schema.columns` — all 25 columns present), but PostgREST had not reloaded its schema after a prior DDL change. No code bug, no missing migration.

PostgREST only reports the **first** unresolvable column — so diagnostics must check all UPDATE columns at once.

## Fix

```sql
notify pgrst, 'reload schema';
```

No ALTER TABLE was needed. Full column diagnostic confirmed all 25 columns exist in `public.users`.

## Diagnostic query used

```sql
select v.col, v.expected_type, (ic.column_name is not null) as exists_in_db
from (values
  ('name','text'),('last_name','text'),('phone','text'),('whatsapp','text'),
  ('avatar_url','text'),('role','text'),('user_type','text'),('status','text'),
  ('block_reason','text'),('suspended_until','timestamptz'),('company_name','text'),
  ('company_logo_url','text'),('company_id','uuid'),('website','text'),
  ('is_verified','boolean'),('social_provider','text'),('location_id','integer'),
  ('position','text'),('year_started','integer'),('deleted_at','timestamptz'),
  ('location_request','jsonb'),('preferred_currency','text'),('pending_email','text'),
  ('last_seen_at','timestamptz'),('preferred_locale','text')
) as v(col, expected_type)
left join information_schema.columns ic
  on ic.table_schema='public' and ic.table_name='users' and ic.column_name=v.col
order by exists_in_db asc, v.col;
```

## Rule for future

PGRST204 on a column that exists in `types/database.ts` → first action is always `notify pgrst, 'reload schema'`. Only run ALTER TABLE if the diagnostic shows `exists_in_db: false`.
