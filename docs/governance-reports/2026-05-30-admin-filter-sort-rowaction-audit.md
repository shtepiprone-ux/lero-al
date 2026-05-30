# Admin Filter / Sort / Row-Action Audit — Task 304

**Date:** 2026-05-30  
**Task:** 304 (Epic HH Phase 1 — task #2)  
**Auditor:** Sonnet 4.6  
**Scope:** All admin routes — filter inventory, sort inventory, row-action inventory

> **Methodology:** Code-level analysis of admin component files. No browser rendering.

---

## 1. Seed — Task 299 Filter Triage Evaluation

Task 299 audited 8 filters across 4 admin routes with verdicts CONVERT/KEEP/DEFER:

| # | Surface | Filter | Verdict |
|---|---------|--------|---------|
| 1 | AdminInquiriesManager | statusFilter (4 options) | CONVERT → multi-select |
| 2 | AdminInquiriesManager | mailboxFilter (3 options) | KEEP |
| 3 | AdminReportsManager | filter (5 options + badges) | CONVERT |
| 4 | AdminSupportManager | typeFilter (3 options) | KEEP |
| 5 | AdminSupportManager | statusFilter (5 options) | DEFER |
| 6 | AdminListingsTable | activeStatus (Combobox) | DEFER |
| 7 | AdminUsersTable | activeRole (4 options) | DEFER |
| 8 | AdminUsersTable | activeStatus (3 options) | DEFER |

Task 304 extends this to ALL admin routes and resolves all DEFERred decisions.

---

## 2. Complete Filter Inventory

### 2.1 AdminListingsTable — `/admin/listings`

| Filter | Type | Options | State layer | Current component |
|--------|------|---------|------------|-------------------|
| All / Premium tab | Segmented tab | 2 | URL param `tab` | `Button size="tab"` in `flex-wrap md:flex-nowrap bg-muted rounded-xl p-1` |
| Status | Combobox | 6+ (pending/active/inactive/sold/rented/archived) | URL param `status` | `Combobox variant="button" size="sm" w-40` |
| Search | Text | free text | URL param `q` (searchQuery) | `AdminSearchInput` |
| Pagination | `page` | numeric | URL param `page` | Prev/Next buttons |

**Canonical assignment:** All 3 filter types already canonical. ✅

### 2.2 AdminUsersTable — `/admin/users`

| Filter | Type | Options | State layer | Current component |
|--------|------|---------|------------|-------------------|
| All / Verified tab | Segmented tab | 2 | URL param `tab` | `Button size="tab"` in `flex-wrap md:flex-nowrap bg-muted rounded-xl p-1` |
| Role filter | Button chips | 4 (user/agent/moderator/admin) | URL param `role` | Raw ghost `Button` pills (`flex gap-2 flex-wrap`) |
| Status filter | Button chips | 3 (active/inactive/blocked) | URL param `status` | Raw ghost `Button` pills |
| Location request | Badge chip | binary (conditional) | URL param `location_request` | Badge chip with count |
| Search | Text | free text | URL param `q` | `AdminSearchInput` |
| Pagination | `page` | numeric | URL param `page` | Prev/Next buttons |

**Canonical assignment:**
- Role → Combobox (4 = threshold, no count badges)
- Status → Segmented tabs (3 ≤3, mutually exclusive)
- Location request badge → keep as-is
- Search → keep `AdminSearchInput`

### 2.3 AdminSupportManager — `/admin/support`

| Filter | Type | Options | State layer | Current component |
|--------|------|---------|------------|-------------------|
| Ticket type | Button pills | 3 (all/support/user_complaint) | local `useState` | Ghost `Button` pills (`flex gap-1.5 flex-wrap`) |
| Status | Button pills | 5 (all/open/in_progress/resolved/closed) | local `useState` | Ghost `Button` pills (same) |

**Issues:**
- Both filters use local `useState` — violates Decision 3 URL-state requirement. Phase 3 must migrate to URL params.
- Status has 5 options → Combobox
- Create button `ml-auto` in `flex-wrap` toolbar loses alignment at narrow (Task 303 MEDIUM finding)

**Canonical assignment:**
- Ticket type → segmented tabs (3 ≤3)
- Status → Combobox (5 ≥4)
- Both state layers → URL params in Phase 3

### 2.4 AdminInquiriesManager — `/admin/inquiries/*`

| Filter | Type | Options | State layer | Current component |
|--------|------|---------|------------|-------------------|
| Status (non-scoped) | Button group | 4 (all/new/in_progress/closed) + count badges per option | local `useState` | Raw `Button variant/outline` pills |
| Mailbox (non-scoped only) | Button group | 3 (all/support/sales) | local `useState` | Raw `Button variant="secondary/outline"` |
| Status Combobox (in reply modal) | Combobox | `ContactStatus` values | modal state | `Combobox` |

**Canonical assignment:**
- Status → **Exception: keep segmented tabs + count badges** (owner-approved: 3 real workflow stages + All; count badges triage-critical)
- Mailbox → segmented tabs (3 ≤3, mutually exclusive)
- State layers → URL params in Phase 3

### 2.5 AdminReportsManager — `/admin/reports`

| Filter | Type | Options | State layer | Current component |
|--------|------|---------|------------|-------------------|
| Status | Underline tabs | 5 (all/pending/reviewed/resolved/dismissed) + count badges | local `useState` | Custom underline-tab buttons with count badge spans |

**Canonical assignment:**
- Status → Combobox with counts in option labels ("Pending (5)", "Reviewed (2)")
- State layer → URL params in Phase 3

### 2.6 AdminLocationsManager — `/admin/locations`

| Filter | Type | Options | State layer | Current component |
|--------|------|---------|------------|-------------------|
| Type filter | Button pills | 5 (all/region/city/village/district) | local `useState` | Ghost `Button` pills (`flex gap-1.5 flex-wrap`) |
| Combobox — parent filter (in modal) | Combobox | locations list | modal state | `Combobox` — form control, not list filter |
| Combobox — region filter (in modal) | Combobox | regions list | modal state | `Combobox` — form control |

**Canonical assignment:**
- Type filter → Combobox (5 ≥4 threshold)
- Modal form controls → keep as-is

### 2.7 AdminCompaniesManager — `/admin/companies`

| Filter | Type | Options | State layer | Current component |
|--------|------|---------|------------|-------------------|
| Search | Text | free text | local `useState` (useMemo filter) | Plain `<Input>` with Search icon |

**Canonical assignment:** → `AdminSearchInput` for consistency.

### 2.8 AdminPropertyTypesManager — `/admin/property-types`

| Filter | Type | Options | State layer | Current component |
|--------|------|---------|------------|-------------------|
| Search | Text | free text | URL param `q` | `AdminSearchInput` ✅ |

### 2.9 AdminCurrencyTabs — `/admin/currency`

| Filter | Type | Options | State layer | Current component |
|--------|------|---------|------------|-------------------|
| Tab currencies / providers | Tabs | 2 | React state (defaultValue) | `Tabs` + `TabsTrigger` |
| Search (currencies) | Text | free text | local `useState` | `Input` (inferred from `useMemo` filter) |

**Canonical assignment:** Tabs ✅. Currency search → `AdminSearchInput`.

### 2.10 AdminEmailTemplatesManager — `/admin/email-templates`

| Filter | Type | Options | State layer | Current component |
|--------|------|---------|------------|-------------------|
| Search | Text | free text | local `useState` | Plain `<Input>` |

**Canonical assignment:** → `AdminSearchInput` for consistency.

### 2.11 Routes with no filter

`/admin/legal`, `/admin/popular-locations`, `/admin/footer`, `/admin/settings`, `/admin/permissions` — no list filter needed or applicable.

---

## 3. Sort Inventory

### 3.1 Current server-side default sorts (hardcoded — not user-controllable)

| Route | Server-side sort | User-controllable today? |
|-------|-----------------|------------------------|
| `/admin/listings` | `created_at DESC` | ❌ |
| `/admin/users` | default DB order | ❌ |
| `/admin/support` | `updated_at DESC` | ❌ |
| `/admin/inquiries/*` | `created_at DESC` | ❌ |
| `/admin/reports` | `created_at DESC` | ❌ |
| `/admin/locations` | `type ASC, name_al ASC` | ❌ |
| `/admin/companies` | `name ASC` | ❌ |
| `/admin/property-types` | `sort_order ASC` | ❌ (but `sort_order` is a DB field admins can set) |
| `/admin/legal` | `updated_at DESC` | ❌ |
| `/admin/email-templates` | `key ASC, locale ASC` | ❌ |
| `/admin/popular-locations` | `display_order ASC` | ❌ |
| `/admin/currency` (currencies) | default DB order | ❌ |
| `/admin/currency` (providers) | default DB order | ❌ |

**Decision 3 status:** ALL sorts are hardcoded server-side. Decision 3 (`?sort=<col>&dir=asc|desc`) is entirely new functionality. Phase 3 implements column-header sort clicks + URL state. Only the canonical `parseAdminSort` helper is needed at Phase 2 (Task 307 AdminTable primitive).

### 3.2 Sort URL canonical shape

```
?sort=<column_name>&dir=asc|desc
```

Examples:
- `/admin/listings?sort=created_at&dir=desc`
- `/admin/listings?sort=price&dir=asc`
- `/admin/users?sort=name&dir=asc`

The shape is stable across all admin tables. Column names are the DB column names (no aliases).

### 3.3 Sortable-column decisions

See `docs/admin-ux-rules.md §8.1` for the full sortable-column matrix.

---

## 4. Row-Action Inventory

### 4.1 Per-route row-action inventory

| Route | Primary row action | Secondary inline actions | Destructive action | Confirm Dialog? |
|-------|------------------|--------------------------|-------------------|----------------|
| `/admin/listings` | Row click → `ListingPreviewDialog` | None inline | Delete inside dialog | Dialog ✅ |
| `/admin/users` | Name click → `/admin/users/[id]` | Verify toggle (ShieldCheck, `h-6 w-6` ⚠️) | Revoke (in verified tab, inside confirm?) | Unclear — verify |
| `/admin/support` | Row click → `TicketDetailDialog` | None inline | None | N/A |
| `/admin/inquiries/*` | Row click → inquiry Dialog | None inline | None | N/A |
| `/admin/reports` | Row click → `ReportDetailDialog` | None inline | None | N/A |
| `/admin/locations` | Name click → `LocationModal` (edit) | Featured Star toggle inline (city-only) | Delete inside `LocationModal` | Modal context ✅ |
| `/admin/popular-locations` | Row click → `LocationDialog` (edit) | None inline | Delete inside dialog | Dialog (inferred) |
| `/admin/companies` | Name click → `CompanyFormDialog` | Trash2 inline (`deletingId` state) | Delete via `deletingId` pattern | Inline confirm state — verify if Dialog |
| `/admin/property-types` | Row click → `PropertyTypeFormDialog` | is_active toggle (clickable Badge) | Delete via `DeleteDialog` | Dialog ✅ |
| `/admin/currency` | Row click → detail modal | None inline | Delete via confirm Dialog | Dialog ✅ |
| `/admin/email-templates` | Edit icon → `TemplateEditorDialog` | Delete icon (`size="icon"`) | Delete via `DeleteConfirmDialog` | Dialog ✅ |
| `/admin/legal` | (Pencil icon) → edit Dialog | Trash2 icon inline | `handleDelete(p.id)` direct call ⚠️ | ❌ BUG — no confirm Dialog visible |
| `/admin/footer` | — | Per-link Remove (Trash2, `size="icon"`) | Remove link (non-DB, client state only) | No Dialog (low-risk content) |
| `/admin/permissions` | — | Switch toggle per row | None | N/A |

### 4.2 Violations requiring Phase 3 fix

1. **`/admin/users` verify toggle** — `h-6 w-6` = 24×24px, below minimum 44px touch target. Must be corrected to ≥44px effective tap area.
2. **`/admin/legal` delete** — `handleDelete(p.id)` appears to execute immediately without a confirm Dialog. Must be wrapped in a confirm Dialog before Phase 3 migration.
3. **`/admin/companies` delete** — uses `deletingId` state for an inline confirm UI. Needs verification whether this is a full Dialog or an inline row state. If inline state only → convert to Dialog.

---

## 5. Task 304 STOP & ASK Resolutions

| Question | Owner resolution |
|----------|-----------------|
| AdminInquiriesManager statusFilter (4 options + count badges): Combobox or segmented tabs? | **Keep segmented tabs + badges.** Owner-approved exception: 3 real workflow stages + All; count badges are triage-critical. Exception documented in `admin-ux-rules.md §7.1`. |
| AdminUsersTable role filter (4 options): Combobox or segmented tabs? | **→ Combobox.** 4 = threshold; no count badges; saves toolbar space at narrow. |
| AdminReportsManager status filter (5 options + count badges): how to preserve counts in Combobox? | **Combobox with counts in option labels:** "Pending (5)", "Reviewed (2)". Counts preserved; Decision 2 rule applies. |
| Sortable columns on listings + users | **Listings:** created_at + price + status. **Users:** created_at + name. Full matrix in `admin-ux-rules.md §8.1`. |
| Destructive row-action canonical pattern | **Always require confirm Dialog.** Inline immediate-delete is forbidden. Violations: `/admin/legal` (BUG) + `/admin/companies` (verify). |

---

## 6. Task 305 Pre-Input (Dialog patterns observed)

| Route | Dialog type | Size class | Scroll |
|-------|------------|-----------|--------|
| `/admin/listings` | `ListingPreviewDialog` | `sm:max-w-2xl` | `overflow-y-auto` |
| `/admin/support` | `TicketDetailDialog` | `max-w-2xl max-h-[90vh]` | `overflow-y-auto` ✅ |
| `/admin/support` | `CreateTicketDialog` | `max-w-lg` | — |
| `/admin/locations` | `LocationModal` | `max-w-2xl` (inferred) | — |
| `/admin/companies` | `CompanyFormDialog` | `max-w-lg` | — |
| `/admin/property-types` | `PropertyTypeFormDialog` | `max-w-2xl` (inferred) | — |
| `/admin/currency` | custom div modal | `max-w-lg max-h-[90vh]` | `overflow-y-auto` ✅ |
| `/admin/email-templates` | `TemplateEditorDialog` | `sm:max-w-2xl` | — |

**Observations for Task 305:**
- Inconsistent dialog sizes: `max-w-lg` vs `sm:max-w-2xl` vs `max-w-2xl` — no canonical width tiers defined
- Inconsistent scroll handling: some dialogs have `overflow-y-auto`, others don't
- `/admin/currency` uses a custom `div` modal instead of canonical `Dialog` primitive
- Task 305 should define canonical dialog width tiers (narrow / medium / wide) + scroll policy
