# Database & Row Level Security (Supabase)

## User Roles
- `admin` — full access, can create/delete any user including moderators.
- `moderator` — manage listings, users (agent/user only), support tickets, conversations. CANNOT create/delete admins. CANNOT delete users. CANNOT change user role.
- `agent` — real estate agent, can be private person or with company.
- `user` — private person, standard access.

## Admin Profile Mutation Matrix (Task 17)

| Action | Admin | Moderator |
|---|---|---|
| View user profile | ✅ | ✅ |
| Edit user profile (name, phone, etc.) | ✅ | ✅ |
| Change user role | ✅ | ❌ (read-only field) |
| Change user status | ✅ | ✅ |
| Delete user (soft-delete) | ✅ | ❌ (button hidden + Server Action rejects) |
| Upload/change avatar | ✅ | ✅ |

## Cabinet Self-Mutation Rules

- Users can only mutate their own row (`users.id = auth.uid()`).
- `deleteOwnAccount`: requires authenticated session; soft-deletes own row + archives own listings. Cannot delete another user's account.
- `updateCabinetProfile`: user-scoped Supabase client enforces RLS.
- `uploadCabinetAvatar`: same user-scoped client.

## user_status_history Access Policy

- SELECT: admin and moderator only.
- INSERT: service-role only (via admin client in Server Actions). No direct user INSERT.

## Email-Change Token Policy

- `email_change_tokens` table: no direct user RLS access.
- All operations via service-role in Server Actions (`initiateEmailChange`, `consumeEmailChangeToken`).
- Token is valid for 24h, single-use (consumed_at set atomically with email mutation).
- Verification landing page (`/[locale]/auth/confirm-email`) uses service-role to validate and consume the token — it is an unauthenticated public route (the token IS the auth credential for the action).

## Security Rules

### Security
- Never expose Supabase service role key in client code.
- Always use RLS policies — never bypass with service role in client.
- Sanitize inputs to prevent XSS.
- Rate limit auth endpoints (Supabase handles this, verify it's enabled).
- Never store sensitive data in localStorage.
- If cookie-based auth, server actions, or custom mutation endpoints are used, ensure CSRF protections are in place; do not assume auth tokens alone are sufficient.
- Content Security Policy headers via Cloudflare.

## Auth & RLS Safety

### Auth & Session Rules
- Always check session expiry before critical actions.
- Handle `AuthSessionMissingError` globally.
- Redirect to login if session expired during user action.
- Show friendly localized message, not raw Supabase auth errors.

### Supabase RLS Checklist
After every new table or policy — verify:
- [ ] Can anonymous users read what they should NOT read?
- [ ] Can user A read/edit user B's private data?
- [ ] Can regular user access admin-only data?
- [ ] Are all insert, update, and delete policies checking `auth.uid()` and role constraints correctly?