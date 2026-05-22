# Task 170 — Sprint 7 — Missing phone-validation i18n keys in admin.user_profile

**Date:** 2026-05-22  
**Status:** ✅ Complete

## Problem
Saving an admin user profile with an invalid phone showed the raw key
`admin.user_profile.validation.error_phone_invalid`. Both `AdminUserProfile` and
`AdminUserCreate` call `t('validation.${errorKey}')` with namespace `admin.user_profile`,
but `admin.user_profile.validation` only contained `phone_format` / `phone_no_country_code` —
the `error_phone_*` keys from `PhoneErrorKey` were absent.

## Changes
**messages/en.json, uk.json, sq.json, it.json** — added to `admin.user_profile.validation`:
- `error_phone_invalid`
- `error_phone_no_country_code`

Values copied verbatim from the existing entries at the auth namespace (lines ~327–329 in each catalog).

## Verification
- Both consuming namespaces (`AdminUserProfile`, `AdminUserCreate`) use `admin.user_profile`.
- One namespace → one fix; no other component references `validation.error_phone_*` in a different namespace.
- Locale parity: all 4 catalogs updated.
- No code changes; no lint/typecheck impact.
