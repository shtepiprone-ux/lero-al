# Task 171 — Sprint 7 — Hide email-template Delete button from non-admins

**Date:** 2026-05-22  
**Status:** ✅ Complete

## Problem
A moderator on `/admin/email-templates` saw the Delete (Trash2) button on every template.
The server boundary (`assertAdmin()` in `deleteEmailTemplateGroupAction`) was correct, but
the button was rendered unconditionally — moderators hit a toast error on click.

## Changes

### `src/app/admin/email-templates/page.tsx`
- Imported `createClient` + `getUser`.
- Resolved viewer role: `getUser()` → `users.role` → `isAdmin: boolean` (same pattern as `/admin/users/[id]/page.tsx`).
- Passed `isAdmin` to `<AdminEmailTemplatesManager>`.

### `src/components/admin/AdminEmailTemplatesManager.tsx`
- Added `isAdmin: boolean` to component props.
- Wrapped Delete (Trash2) button in `{isAdmin && (…)}`.
- Edit (Pencil) button remains visible for both admin and moderator.
- Server actions (`assertAdmin()`) left unchanged — defense-in-depth preserved.

## Acceptance criteria
- Admin: sees Edit + Delete. Moderator: sees Edit only, no Delete trigger.
- Server still blocks any non-admin delete.
- No governance anti-patterns; canonical `Button` used throughout.
