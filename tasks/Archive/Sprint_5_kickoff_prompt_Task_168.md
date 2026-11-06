# Kickoff prompt — Task 168 (Sprint 5 — admin user profile: Save stays disabled after role change)

> Found in post-deploy verification. In the admin user profile, editing the **"Тип акаунту"**
> (account type / profile type → maps to DB `role` via `profileTypeToDb`) does not enable the
> **Save** button. The Save button is `disabled={saving || (!isCreate && !isDirty)}`, but the
> account-type Combobox's `onChange` calls `setValue('profileType', v)` **without**
> `{ shouldDirty: true }` — so changing only the role never flips react-hook-form's `isDirty`, and
> Save stays disabled. The phone fields already use `{ shouldDirty: true }` correctly; this is the
> same one-argument fix.

```
You are Claude Code Sonnet 4.6 working in `lero-al`.
Hard contract:
- Do NOT change scope; introduce NO new architecture. If anything is ambiguous or missing,
  STOP and ask — do not invent scope.
- Execute the acceptance criteria LITERALLY.
- Update docs/backlog.md + add docs/sessions/2026-05-22-task-168-role-save-shoulddirty.md.
- 0 new lint errors / 0 new warnings; typecheck has no new errors; governance gates PASS.
- Commit + push. Stage with a SINGLE `git add -A` (no `^`/backtick line continuations — they
  silently no-op in PowerShell). After committing, run `git log -1` and paste the real output.

Pre-read:
- src/components/admin/AdminUserProfile.tsx — specifically:
    * the form: `const { register, handleSubmit, watch, setValue, formState: { errors, isDirty } }`
    * the Save button: `disabled={saving || (!isCreate && !isDirty)}`
    * the profile-type Combobox onChange (currently: `onChange={v => { if (v) setValue('profileType', v as ProfileType) }}`)
    * the phone field for the correct pattern: `setValue('phone', v.e164, { shouldDirty: true })`

Scope:
In the profile-type (account type) Combobox `onChange`, pass `{ shouldDirty: true }` to `setValue`,
matching the phone fields. i.e.:
  onChange={v => { if (v) setValue('profileType', v as ProfileType, { shouldDirty: true }) }}
This is the ONLY change. Do not alter the Save button's disabled logic, the schema, or any other
setValue call.

Acceptance criteria:
- In edit mode, changing ONLY the account type enables the Save button.
- Saving persists the new role (verify profileType → role mapping via profileTypeToDb still works,
  e.g. setting "Moderator" results in DB role = 'moderator').
- No regression: other fields still mark the form dirty and save as before; nothing else changes.
- 0 new lint/typecheck errors; governance PASS; backlog + session log updated.

Out of scope:
- Redesigning the form or the FieldRow/edit-mode mechanism.
- Changing the Save-button disabled condition itself.
- Any i18n change (that is Task 167).
```
