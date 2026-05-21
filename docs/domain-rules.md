## Inactive Account Lifecycle (Epic D.5 / Task 124 — decided 2026-05-20)

Inactivity is measured by `COALESCE(last_seen_at, created_at)` (users who never signed in after registration use `created_at` as the activity timestamp). The daily cron (`/api/cron/inactivity`, via `vercel.json`) runs at 08:00 UTC.

| Threshold | Action |
|-----------|--------|
| 3 months (~91 days) | Send `InactivityWarningEmail` once (tracked by `inactivity_warning_sent_at`). Warning resets when user becomes active again. |
| 12 months (~365 days) | **SOFT DELETE**: set `deleted_at = now()`, `status = 'inactive'`, archive all active listings, write to `user_status_history` (reason: `inactivity_12_months_auto_deactivation`), send `InactivityFinalEmail`. |

**Grace period:** 90 days after soft-delete. If the user signs in within 90 days, the presence route (`/api/presence`) automatically restores the account: clears `deleted_at`, sets `status = 'active'`, resets `inactivity_warning_sent_at`, writes `user_status_history` (reason: `reactivated_within_grace_period`). Archived listings are NOT automatically restored (require manual admin action).

**After grace period:** Account remains soft-deleted. Data is retained indefinitely until a future cleanup task (not yet implemented) hard-deletes it. Hard-delete is explicitly out of scope for this task.

**GDPR note:** Retained data after soft-delete includes email and profile fields. A future cleanup or explicit user-initiated deletion flow (Task TBD) should hard-delete this data to comply with right-to-erasure requests. Platform legal counsel should review the 90-day retention window against applicable law.

**Tracking column:** `users.inactivity_warning_sent_at TIMESTAMPTZ` — set when warning email is sent; reset to NULL on presence update (user active again) and on account restore. Prevents duplicate warning emails within a single inactivity cycle.

## User Profile Data Model

Core fields (all users): `id`, `name`, `last_name`, `phone`, `whatsapp`, `avatar_url`, `role`, `user_type`, `status`, `block_reason`, `location_id`, `deleted_at`, `preferred_currency`, `pending_email`, `created_at`, `inactivity_warning_sent_at`.

Agent/developer additional fields: `company_name`, `company_logo_url`, `website`, `position`, `year_started`.

Immutable after creation: `id`, `email` (email changes go through the cabinet email-change flow — stored in `pending_email` until verified).

Currency preference: `preferred_currency IN ('ALL', 'EUR')` — defaults to `'ALL'`. Drives the price display across the product.

## User Status Enum & Transitions

Status values: `active`, `blocked`, `inactive`, `self_deleted` (written to `user_status_history`).

Listing archiving: when a user self-deletes, all their non-sold/non-rented listings are set to `archived` in one update.

`user_status_history` logs every status transition: `old_status`, `new_status`, `reason` (required when `new_status = 'blocked'`), `changed_by`, `changed_at`.

## Owner-Deleted Listing Rule

A user with `deleted_at IS NOT NULL` is considered deleted. Their archived listings remain accessible by direct URL but:
- Do NOT appear in public index, search, or similar listings queries.
- The `ListingContact` block on the detail page renders a "Owner deleted their account" placeholder instead of phone/WhatsApp/message buttons.

## Email Change Lifecycle

1. User submits new email in cabinet profile → stored as `users.pending_email`; verification token created in `email_change_tokens` (expires 24h, single-use).
2. Verification email sent to new address; security notification sent to old address (via Resend when Task 34 lands).
3. User clicks link → `/[locale]/auth/confirm-email?token=...` → token consumed, `users.email` updated, old sessions invalidated.
4. Before confirmation: old email is valid for login; new email is not.
5. After confirmation: only new email is valid; `pending_email` cleared.

## Role Mutation Surface

- **Sole entry point for role changes**: the user profile edit page (`/admin/users/[id]`), via `updateUserProfileFull` → `profileTypeToDb`.
- **Admin-only gate**: `updateUserProfileFull` checks `myProfile.role === 'admin'` before writing `role`/`user_type`; moderators see the field as read-only.
- **Moderator restrictions**: Moderator CANNOT delete users AND CANNOT change user role. Both enforced at UI layer (delete button hidden, role field read-only) and Server Action layer.
- **Admin users table (`/admin/users`)**: the "Role" column is a read-only `<Badge>` — no inline editor, no Select, no Combobox, no click-to-cycle. Any future code that re-introduces an editable control in that cell is a violation.
- **Audit log**: role changes via profile edit are written to `user_change_log` (field `profile_type`). Status changes written to `user_status_history`.

## Permissions

- **Create listing**: any authenticated user (private person or agent).
- **Edit listing**: owner only (user_id match) or admin/moderator.
- **Delete listing**: owner only or admin/moderator.
- **Publish/activate**: owner sets status to active on submit; admin/moderator can override.

## Listing Features
- Badges: New (`created_at > now() - interval '7 days'`), Premium (`is_premium = true`), Price reduced (`price_old IS NOT NULL AND price < price_old`), Archived (`status IN ('sold', 'rented', 'archived')`).
- Price: always show the current price; if `price_old IS NOT NULL` and `price < price_old`, also show the old price as struck through; display prices in ALL and EUR.
- Currency: ALL (default) and EUR; exchange rate is fetched from iliria98.com daily.
- Full text search via Postgres tsvector (GIN index).
- Unique views tracking via ip_hash (privacy-safe).
- Amenities system via listing_amenities junction table.
- Listing expires after 60 days (extendable by moderator/admin).
- Slug-based URLs for SEO.

## Trust, Safety & Moderation (Epic C — decided 2026-05-20 Task 116)

### Chosen protection stack

**Layer 1 — Listing reports (Tasks C.2/C.3):**
- Any authenticated user can report a listing from its detail page.
- Categories: `spam | fraud | duplicate | wrong_category | offensive | other` (from `ReportReason` enum).
- Optional free-text comment, max 500 chars.
- One report per user per listing (enforce at DB level with unique constraint or server-side guard).
- Status lifecycle: `pending → reviewed → resolved | dismissed`.
- Each status transition logged in `report_actions` with `actor_id`, `actor_role`, `old/new_status`, `notes`.

**Layer 2 — Account blocking (Task C.5):**
- `User.status = 'blocked'` + `block_reason` already in schema.
- `block_reason` is required when status is set to `blocked`.
- Blocked users: cannot create/edit listings; cannot initiate messages.
- All transitions written to `user_status_history` (service-role only INSERT).
- UI: admin user profile page — block/unblock button with reason field (C.5).

**Deferred (not in Epic C):**
- User-to-user blocking — no messaging system yet; implement after messaging ships.
- Automated text/content filtering — deferred until message volume justifies cost.
- Anonymous reports — rejected; auth required to prevent spam reporting.
- LLM moderation — out of scope for current scale.

### RLS boundary summary

| Actor | listing_reports | report_actions | user.status (block) |
|---|---|---|---|
| Anonymous | ❌ | ❌ | ❌ |
| Authenticated user | INSERT own + SELECT own | ❌ | ❌ |
| Moderator | SELECT all + UPDATE status | SELECT + INSERT | UPDATE status |
| Admin | Full | Full | Full |

---

## Underground Floor Rules (canonical)

The single source of truth is `UNDERGROUND_FLOOR_TYPES` in `src/modules/listings/constants/index.ts`.

**Types that support underground floors (floor < 0):**
- `garage`, `parking`, `warehouse`, `other`

**Conditions:**
- Underground floors are only valid when `multi_storey_building = true` AND the property type is in `UNDERGROUND_FLOOR_TYPES`.
- Minimum underground floor: **-10**.
- All other property types: floor minimum **0** (ground level or above).

**Enforcement layers (all must be consistent — never patch one layer alone):**
1. **Zod schema** (`validations/index.ts`): `superRefine` rejects `floor < 0` unless type is in `UNDERGROUND_FLOOR_TYPES` AND `multi_storey_building = true`.
2. **Form UI** (`ListingFormShell.tsx`): multi_storey_building checkbox gated to `UNDERGROUND_FLOOR_TYPES`; floor field hidden unless checkbox is ON.
3. **Filter UI** (`ListingsFilters.tsx`, `FiltersPanel.tsx`): `getFloorFilterMin()` returns -10 for underground types, 0 for all others; `min` attribute and rejection guard both derived from this helper.
4. **SSR query** (`listings/page.tsx`) and **API query** (`api/listings/route.ts`):
   - Negative `floor_min`/`floor_max` rejected for non-underground types.
   - Negative floor filter with no `property_type` selected → auto-constrains `property_type IN (UNDERGROUND_FLOOR_TYPES)` to prevent legacy-data leaks.

**Never hardcode the type list in components.** All consumers must import from constants.