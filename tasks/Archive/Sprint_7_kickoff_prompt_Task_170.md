# Kickoff prompt — Task 170 (Sprint 7 — missing phone-validation i18n keys in admin.user_profile)

> Saving an admin user profile with an invalid phone shows the **raw key**
> `admin.user_profile.validation.error_phone_invalid`. Cause: `validateNationalPhone`
> (`src/lib/phone/index.ts`) returns `errorKey` ∈ {`error_phone_invalid`,
> `error_phone_no_country_code`}, and `AdminUserProfile.tsx` renders `t('validation.${errorKey}')`
> with `t = useTranslations('admin.user_profile')`. But `admin.user_profile.validation` only has
> `phone_format` — the two `error_phone_*` keys are absent there (they exist in another namespace,
> ~line 327 of each catalog). **i18n data fix, not code.**

```
You are Claude Code Sonnet 4.6 working in `lero-al`.
Hard contract:
- Do NOT change scope; no new architecture; if ambiguous, STOP and ask.
- Execute AC literally. Update docs/backlog.md + add docs/sessions/2026-05-22-task-170-phone-validation-i18n.md.
- 0 new lint/typecheck errors; governance PASS.
- Commit + push. SINGLE `git add -A` (no `^`/backtick continuations). Then `git log -1`, paste real output.
- Concurrency: ensure no other Claude/editor session is writing messages/*.json while you edit
  (avoid clobbering — see docs/orchestrator-role.md "Environment & git safety").

Pre-read:
- src/lib/phone/index.ts (PhoneErrorKey union)
- src/components/admin/AdminUserProfile.tsx (t('validation.error_phone_invalid') etc.)
- src/components/admin/AdminUserCreate.tsx (same t('validation.${errorKey}') pattern — check ITS namespace)
- messages/{sq,en,uk,it}.json — the `admin.user_profile.validation` block (has phone_format) and the
  existing `error_phone_invalid` / `error_phone_no_country_code` values to copy verbatim.

Scope:
1. Add `error_phone_invalid` and `error_phone_no_country_code` to `admin.user_profile.validation` in
   ALL FOUR catalogs, using the EXACT existing values:
     en: "Please enter a valid phone number for the selected country." / "Enter the phone number without the country code."
     uk: "Введіть коректний номер телефону для вибраної країни." / "Введіть номер телефону без коду країни."
     sq: "Ju lutemi vendosni një numër telefoni të vlefshëm për shtetin e zgjedhur." / "Vendosni numrin e telefonit pa kodin e shtetit."
     it: "Inserisci un numero di telefono valido per il paese selezionato." / "Inserisci il numero di telefono senza il prefisso internazionale."
2. Verify AdminUserCreate's validation namespace: grep every component that calls
   `t('validation.error_phone_invalid')` or `t('validation.error_phone_no_country_code')` and confirm
   EACH consuming namespace contains both keys in all 4 locales. If AdminUserCreate uses a different
   namespace that is also missing them, add them there too (same values). Do NOT remove the existing
   copies elsewhere.

Acceptance criteria:
- No component references a `validation.error_phone_*` key that is absent from its own namespace.
- All four catalogs contain the two keys in every affected namespace (locale parity).
- Triggering an invalid phone on profile save shows a translated message, not a raw key.
- 0 new lint/typecheck errors; backlog + session log updated; commit pushed.

Out of scope:
- Changing phone validation rules or the phone input.
- Investigating WHY a phone is judged invalid (separate; only if a valid phone still fails).
```
