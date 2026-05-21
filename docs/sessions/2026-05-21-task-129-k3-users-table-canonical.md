# Session Archive: Epic K.3 — Migrate AdminUsersTable to Canonical Pattern — 2026-05-21

## Task 129 — Migrate Users admin table (remove actions duplication)

**Status:** COMPLETE

---

## Changes

### `AdminUsersTable.tsx`

**Before:**
- `col_actions` column in main table: ExternalLink icon (duplicate of name link) + verify toggle button
- `col_actions` column in verified agents tab: "Revoke verification" button

**After (K.1 canonical pattern):**

Main users table:
- `col_actions` column removed (was 6 columns → 5)
- ExternalLink icon removed (name was already a Link to /admin/users/[id])
- Verify toggle (ShieldCheck/ShieldOff) moved inline to the name cell as an icon-only button with `title` tooltip
  - Verified: green ShieldCheck → hover turns red (revoke)
  - Unverified: dim ShieldOff → hover turns green (verify)
- colSpan updated 6 → 5

Verified agents tab:
- `col_actions` column removed (was 4 columns → 3)
- "Revoke verification" ShieldOff button moved inline in name cell (compact icon button)
- colSpan updated 4 → 3

Removed import: `ExternalLink` (no longer used)

---

## Validation

- lint: 0 errors / 0 warnings
- typecheck: 0 new errors
