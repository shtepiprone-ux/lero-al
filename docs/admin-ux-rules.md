# Admin UX Rules — Canonical Spec

> **Status:** DRAFT — awaiting owner sign-off before Phase 2 (Tasks 306/307) can start.
> **Source:** Epic HH Phase 1 Task 303 audit (2026-05-30). All decisions reference Epic HH `APPROVED owner decisions (2026-05-30)`.

---

## 1. Narrow-Breakpoint Model — Decision 1 (APPROVED)

**Approved model: Hybrid (C)**

> Admin surfaces below `md:` (768px) follow ONE of two canonical patterns, chosen per route based on data-density and workflow character.

| Pattern | Trigger | Behaviour |
|---------|---------|-----------|
| **Card-row fallback** | Workflow-heavy surface or light CRUD table (≤4 visible columns) | Table disappears below `md:`; each record renders as a stacked card row with label–value pairs and action buttons |
| **Controlled horizontal scroll** | Data-dense reference / admin table (5+ columns, or multi-column read-heavy) | Table stays horizontal below `md:`; first meaningful column sticky; sticky header; right-edge fade-shadow scroll affordance; no clipping |

The breakpoint boundary for applying the pattern is **`md:` (768px)**. Below 768 (320/375/390) the narrow pattern is active. Above 768 the desktop table layout is active.

---

## 2. Card-Row Fallback Pattern — Canonical Spec

### What it is
Each data row transforms into a self-contained card. The card renders:
- **Primary identifier** (title/name/subject) as the card headline (`text-sm font-medium`)
- **Secondary fields** as label–value pairs (`text-xs text-muted-foreground` label, `text-sm` value), max 3–4 visible pairs before truncation to keep cards scannable
- **Status/type badges** inline with the headline or as the first secondary field
- **Row actions** (edit, delete, status change) as icon buttons or a compact action row at the card bottom, min `h-11 w-11` tap target
- **Row click** to open detail modal preserved

### What it is NOT
- Not a full-detail expansion — secondary fields show only the most critical data (same judgment as hidden columns in the desktop table)
- Not a dialog/accordion — a single click opens the existing detail modal, same as desktop row click
- No duplication of the action modal inside the card

### Density and spacing
- Card padding: `p-3` or `p-4` (consistent with existing card style)
- Cards separated by `divide-y` or `gap-2` (per surface — NOT borderless merge)
- The record-separation rule applies: no two records may appear as a single visual block without a separator

### Tap targets
- Every action button on a card: minimum `44×44px` effective tap area (per `docs/ui-rules.md`)
- Touch-friendly select/toggle controls inside cards follow the same rule

---

## 3. Controlled Horizontal Scroll Pattern — Canonical Spec

### What it is
The `<table>` stays intact below `md:`. The scroll container provides:
1. **`overflow-x-auto`** on the immediate table wrapper
2. **Sticky first meaningful data column** (`position: sticky; left: 0`) — see per-route table below for which column
3. **Sticky header** (`position: sticky; top: 0`) — within the scroll container (not the viewport)
4. **Right-edge fade shadow** as the canonical scroll affordance — a CSS `::after` pseudo-element on the scroll container, using `pointer-events: none` and a gradient from `transparent` to `background` from right edge, visible only when content overflows

### What it is NOT
- NOT `overflow-hidden` (clips content — forbidden)
- NOT always-visible forced scrollbar (`overflow-x: scroll` as a permanent style — rejected)
- NOT a JavaScript-managed chevron button for scroll

### Scroll affordance implementation note
The right-edge fade shadow is a Phase 2 deliverable (canonical `AdminTable` primitive, Task 306). Task 303 specifies the rule; Task 306 implements it. Until Task 306 ships, existing `overflow-x-auto` wrappers are the minimum acceptable state.

### Column visibility at narrow breakpoints
Controlled-scroll tables may still use `hidden sm:table-cell` / `hidden md:table-cell` etc. to reduce the visible column count at intermediate breakpoints — reducing scroll distance before the sticky column pattern is needed. This is complementary, not a substitute.

---

## 4. Per-Route Policy Table

> **Source:** Task 303 code-level inventory + owner-approved STOP & ASK resolutions.
> Routes marked ⚠️ = CORRECTED from preliminary Epic HH classification.
> "Severity baseline (Sprint 28)" column = CRITICAL/HIGH/MEDIUM/LOW per `docs/governance-reports/2026-05-30-sprint-28-admin-mobile-evidence-matrix.md` (Task 327). Blank = not yet assessed by Sprint 28 evidence matrix (use Task 303 severity as historical reference only).

| Route | Component | Pattern | Sticky column | Scroll affordance | Rationale | Severity baseline (Sprint 28) |
|-------|-----------|---------|---------------|-------------------|-----------|-------------------------------|
| `/admin` | `AdminDashboard` (inline) | N/A — card grid | — | — | Not a table; KPI card grid + content panels are independently responsive | |
| `/admin/listings` | `AdminListingsTable` | **Controlled scroll** | "Listing" (title + image) | Right-edge fade | Data-dense: 7 columns (ID/Listing/Type/Price/Status/Agent/Date); high-frequency admin workflow | **CRITICAL** |
| `/admin/users` (all) | `AdminUsersTable` | **Controlled scroll** | "User" (display name) | Right-edge fade | Data table: User/Role/Status/Phone/Date; agent onboarding + user management | **CRITICAL** |
| `/admin/users` (verified) | `AdminUsersTable` | **Controlled scroll** | "Agent" (display name) | Right-edge fade | Verified agents sub-table; same density | **CRITICAL** |
| `/admin/support` | `AdminSupportManager` | **Card-row fallback** | — | — | Workflow: triage tickets, open detail modal, update status; card affordance matches the support inbox UX | **CRITICAL** |
| `/admin/inquiries/support` | `AdminInquiriesManager` | **Card-row fallback** | — | — | Already a card list (no `<table>`); inbox metaphor | **CRITICAL** |
| `/admin/inquiries/sales` | `AdminInquiriesManager` | **Card-row fallback** | — | — | Same component; same inbox metaphor | **CRITICAL** |
| `/admin/reports` | `AdminReportsManager` | **Card-row fallback** | — | — | Workflow-heavy: review + act on reports; 5 columns (Reason/Listing/Reporter/Status/Date) collapse well to cards | |
| `/admin/locations` | `AdminLocationsManager` | **Controlled scroll** | "Name AL" | Right-edge fade | Reference table: 5 cols (ID/Name-AL/Name-EN/Type/Featured); admin manages location taxonomy | |
| `/admin/popular-locations` | `AdminPopularLocationsManager` | **Card-row fallback** ⚠️ | — | — | CORRECTED: 3-col light CRUD (Name/Order/Photo); fits 320 without scroll; photo thumbnail adapts as card media | |
| `/admin/companies` | `AdminCompaniesManager` | **Controlled scroll** | "Name" | Right-edge fade | Reference table: Logo/Name/Agents/Created; company directory | |
| `/admin/property-types` | `AdminPropertyTypesManager` | **Controlled scroll** | Human-readable Name/Label | Right-edge fade | Data-dense: 7 cols (ID/Slug/SQ/EN-UK-IT/Sort/Active/Created); multilingual taxonomy | |
| `/admin/currency` (currencies) | `AdminCurrenciesManager` | **Controlled scroll** | "Code" | Right-edge fade | Reference table: Code/Symbol/Name-EN/Active/Updated | |
| `/admin/currency` (providers) | `AdminExchangeProvidersManager` | **Controlled scroll** | "Name" | Right-edge fade | Reference table: Name/Endpoint/Priority/Mode/Enabled/Notes; tech config | |
| `/admin/email-templates` | `AdminEmailTemplatesManager` | **Card-row fallback** | — | — | Already a card list layout; template key + locale badges + status as card fields | |
| `/admin/legal` | `AdminLegalManager` | **Card-row fallback** ⚠️ | — | — | CORRECTED: 3-col light CRUD (Title/Status/Actions); fits 320 without scroll | |
| `/admin/footer` | `AdminFooterManager` | **Card-row fallback** | — | — | Form-driven locale tabs; link rows need responsive re-layout at narrow (HIGH severity gap — Task 303) | |
| `/admin/settings` | `AdminSettings` | **Card-row fallback** | — | — | Form-driven tabs; naturally responsive at `max-w-3xl` | |
| `/admin/permissions` | `AdminPermissionsManager` | **Card-row fallback** ⚠️ | — | — | CORRECTED: 2-column permissions matrix (key + toggle), not a data-dense table; each permission becomes a labeled card row | |
| `/admin/pages-admin` | stub | N/A | — | — | "Coming soon" stub; out of scope until CMS is implemented | |
| `/admin/users/[id]` | user profile | N/A — form/detail | — | — | User detail page; profile-card layout; not a list | |
| `/admin/users/new` | user creation | N/A — form | — | — | Create user form | |

---

## 4.1 Severity Baseline Source-of-Truth (Sprint 28)

Severity for the **6 owner-flagged surfaces** (listed above with `CRITICAL`) comes from `docs/governance-reports/2026-05-30-sprint-28-admin-mobile-evidence-matrix.md` (Task 327, Sprint 28 evidence audit). **Task 303 severity classification is historical inventory only and MUST NOT be used to plan Sprint 28+ implementation work.**

For the 12 non-flagged routes, severity baseline is not yet established for Sprint 28. A future audit will cover them (Epic HH Phase 4, Task 310).

---

## 5. STOP & ASK Resolutions (Task 303)

| Question | Resolution |
|----------|-----------|
| `/admin/permissions` pattern | Changed from `controlled-scroll` to `card-row fallback` — compact 2-column permissions matrix (key + toggle), not a data table |
| Sticky-column mapping | First meaningful data column approved; Actions column is NOT sticky; Reports and Permissions excluded (card-row routes) |
| Scroll affordance | Right-edge fade shadow approved as canonical; always-visible scrollbar and chevron buttons rejected |
| `/admin/legal` and `/admin/popular-locations` pattern | Both changed from `controlled-scroll` to `card-row fallback` — 3-col light CRUD tables fit at 320 without horizontal scroll |

---

## 6. Owner Approval Gate

> ⛔ **Phase 2 (Tasks 306 / 307) is BLOCKED until this document receives owner sign-off.**

Before Task 306 (AdminPageShell / AdminHeader / AdminFilterBar primitives) and Task 307 (AdminTable / AdminCardList responsive primitive) can start, the owner must explicitly approve:

1. The per-route policy table in §4 — especially the CORRECTED routes.
2. The card-row fallback pattern spec (§2) — field display rules and action placement.
3. The controlled scroll pattern spec (§3) — sticky column, sticky header, fade-shadow affordance.
4. The sticky-column mapping per route.

Owner approval is recorded here:

**[ ] Owner approved — date: _________**

Until this is checked, no Phase 2 production code is written.

---

## 7. Filter Taxonomy — Decision 2 (APPROVED)

> **Source:** Task 304 (Epic HH Phase 1, Sprint 23). STOP & ASK resolutions are locked — do NOT re-litigate.

**Decision 2 (APPROVED):** Admin list filters follow this canonical rule:

- **≥4 options** → `<Combobox>` (canonical primitive from `docs/ui-rules.md §0`)
- **≤3 mutually exclusive options** → segmented tabs using `<Button size="tab">` in `flex-wrap md:flex-nowrap bg-muted rounded-xl p-1` container
- **Free-text search** → always `<AdminSearchInput>` (never plain `<Input>`)
- **Active filter count** → total active VALUES (multi-select 2 selected = 2; search non-empty = 1; "all"/default = 0). Phase 2 helper: `countActiveAdminFilters` (must match `filterEngine.countActiveFilterValues()` semantics)
- **Single global reset** → one "Reset"/"Clear all" control when any filter is non-default; icon button or text link near the filter bar

**Exception (owner-approved):** `AdminInquiriesManager` status filter (4 options + per-option count badges) → keep segmented tabs + count badges. Reason: 3 real workflow stages + All; count badges are triage-critical for inbox routing. This exception must NOT be removed without explicit owner approval.

### 7.1 Per-Route Filter Assignment (14 filter sites)

| Route | Filter | Options | Current component | Canonical assignment | Phase |
|-------|--------|---------|-------------------|---------------------|-------|
| `/admin/listings` | All/Premium tab | 2 | `Button size="tab"` | ✅ Segmented tabs (canonical) | Done |
| `/admin/listings` | Status | 6 | `Combobox variant="button"` | ✅ Combobox (canonical) | Done |
| `/admin/listings` | Search | free text | `AdminSearchInput` | ✅ AdminSearchInput (canonical) | Done |
| `/admin/users` | All/Verified tab | 2 | `Button size="tab"` | ✅ Segmented tabs (canonical) | Done |
| `/admin/users` | Role filter | 4 | Raw ghost `Button` pills | → **Combobox** (≥4, no count badges) | Phase 3 |
| `/admin/users` | Status filter | 3 | Raw ghost `Button` pills | → Segmented tabs (≤3 mutually exclusive) | Phase 3 |
| `/admin/users` | Search | free text | `AdminSearchInput` | ✅ AdminSearchInput (canonical) | Done |
| `/admin/support` | Ticket type | 3 | Ghost `Button` pills (local state) | → Segmented tabs + URL params | Phase 3 |
| `/admin/support` | Status | 5 | Ghost `Button` pills (local state) | → **Combobox** + URL params (≥4) | Phase 3 |
| `/admin/inquiries/*` | Status | 4 + count badges | `Button` group (local state) | ✅ **EXCEPTION:** Keep segmented tabs + count badges + URL params | Phase 3 (state only) |
| `/admin/inquiries/*` | Mailbox | 3 | `Button` group (local state) | → Segmented tabs + URL params | Phase 3 |
| `/admin/reports` | Status | 5 + count badges | Underline tabs (local state) | → **Combobox** with counts in labels ("Pending (N)") + URL params | Phase 3 |
| `/admin/locations` | Type | 5 | Ghost `Button` pills (local state) | → **Combobox** (≥4) + URL params | Phase 3 |
| `/admin/companies` | Search | free text | Plain `<Input>` | → `AdminSearchInput` | Phase 4 |

> Routes with no list filter: `/admin/legal` (now `/admin/pages`), `/admin/popular-locations`, `/admin/footer`, `/admin/settings`, `/admin/permissions` — no filter needed.

### 7.2 Active Filter Count Spec

`countActiveAdminFilters(filters: Record<string, unknown>): number`

- Returns the total number of active VALUES (not filter slots).
- Multi-select with 2 values selected = 2.
- Search field non-empty = 1.
- "all"/empty/default value = 0 for that filter.
- Phase 2 helper: MAY reuse `filterEngine.countActiveFilterValues()` if admin filter shapes are compatible.

### 7.3 Global Reset Rule

When `countActiveAdminFilters > 0`, show a single "Clear all" / "Reset" control near the filter bar. Clicking it resets all filters to their default values and removes them from URL params.

---

## 8. Sort Canonical Rules — Decision 3 (APPROVED)

> **Source:** Task 304 (Epic HH Phase 1, Sprint 23).

**Decision 3 (APPROVED):** User-controllable sort is always stored in URL params. Canonical shape:

```
?sort=<column_name>&dir=asc|desc
```

Column names = DB column names (no aliases). Default (no sort params) = server-side default. Phase 3 (Tasks 308/309) implements column-header click affordance + URL-param binding for the owner-flagged surfaces.

### 8.1 Sortable-Column Matrix

| Route | Sortable columns | Non-sortable (intentional) | Server default sort | Phase |
|-------|-----------------|---------------------------|--------------------|-|
| `/admin/listings` | `created_at`, `price`, `status` | `id`, `listing_type`, `agent`, `title` | `created_at DESC` | Phase 3 |
| `/admin/users` | `created_at`, `name` | `role`, `status`, `phone` | DB default | Phase 3 |
| `/admin/support` | `created_at`, `updated_at` | `status`, `subject` | `updated_at DESC` | Phase 4+ |
| `/admin/inquiries/*` | `created_at` | `status` (triage-critical, sort would disrupt) | `created_at DESC` | Phase 4+ |
| `/admin/reports` | `created_at` | `status`, `reason` | `created_at DESC` | Phase 4+ |
| All other routes | — | Intentionally non-sortable in Phase 2-3 | See Task 304 audit §3.1 | Phase 4+ |

---

## 9. Row-Action / Inline-Control Canonical Rules

> **Source:** Task 304 (Epic HH Phase 1, Sprint 23).

### 9.1 Row-Click Pattern

- **Primary affordance**: entire table row is clickable → opens detail modal. `hover:bg-muted/20 cursor-pointer` on `<tr>` + `onClick` handler.
- **Exception**: tables where clicking a "Name"/"Title" cell navigates to a detail **page** (e.g., `/admin/users/[id]`). In this case the name link is the primary affordance; the row itself must NOT also have `cursor-pointer` (confusing double affordance).

### 9.2 Inline Action Rules

- **Allowed inline**: (a) status toggle (non-destructive: `is_active` switch, `is_featured` star), (b) verify/revoke icon button.
- **Touch target**: every inline action must have ≥44×44px effective tap area. `h-6 w-6 = 24px` is a violation (HIGH severity — requires fix in Phase 3).
- **NOT allowed**: delete/destructive icon inline with no confirm dialog.

### 9.3 Destructive Action Canonical Pattern

- **ALWAYS require a confirm step.** Inline immediate delete without confirmation is a BUG.
- Confirm primitive: use `<AlertDialog>` (see §11.3). NOT a custom div or plain `<Dialog>`.
- **Violations found (Phase 3 fix required):**
  1. `/admin/legal` — `handleDelete(id)` direct call, no confirm Dialog → **BUG**
  2. `/admin/companies` — `deletingId` inline pattern → verify if a real Dialog exists; if not → **Phase 3 fix required**

### 9.4 Status-Switcher Rules

- Status changes affecting only the object itself (listing visibility, template active toggle) → inline per-row is acceptable.
- Status changes triggering moderation outcomes or requiring note/justification → must use a workflow block inside the detail modal (see §13 `StatusChangeControl`).

### 9.5 Per-Route Row-Action Assignment

| Route | Primary row action | Secondary inline | Destructive | Violations |
|-------|------------------|-----------------|-------------|-----------|
| `/admin/listings` | Row click → `ListingPreviewDialog` | Premium star toggle ✅ | Delete inside dialog ✅ | None |
| `/admin/users` | Name link → `/admin/users/[id]` | Verify toggle (`h-6 w-6` ⚠️ tap target) | None per-row | Tap target below 44px — Phase 3 fix |
| `/admin/support` | Row click → `TicketDetailDialog` | None | None per-row | None |
| `/admin/inquiries/*` | Row click → `InquiryDetailDialog` | None | None | None |
| `/admin/reports` | Row click → `ReportDetailDialog` | None | None | None |
| `/admin/locations` | Name click → `LocationModal` | Featured star (city only) ✅ | Delete inside modal ✅ | None |
| `/admin/popular-locations` | Row click → `LocationDialog` | None | Delete inside dialog ✅ | None |
| `/admin/companies` | Name click → `CompanyFormDialog` | Delete icon (`deletingId`) ⚠️ | `deletingId` state | Needs Dialog verification — Phase 3 |
| `/admin/property-types` | Row click → `PropertyTypeFormDialog` | `is_active` badge toggle ✅ | Delete via `DeleteDialog` ✅ | None |
| `/admin/currency` | Row click → detail modal | None | Delete via confirm Dialog ✅ | None |
| `/admin/email-templates` | Edit icon → `TemplateEditorDialog` | Delete via `DeleteConfirmDialog` ✅ | ✅ | None |
| `/admin/legal` (`/admin/pages` per Sprint 27) | Edit → `PageEditorDialog` | None | `handleDelete(id)` direct call ⚠️ **BUG** | Immediate delete, no confirm — Phase 3 fix |
| `/admin/footer` | Per-link edit | Remove (Trash2, client state only) | Remove link (no DB record — low risk) | None |
| `/admin/permissions` | Switch toggle per row ✅ | — | None | None |

---

## 10. Owner Approval Gate for Task 304 Additions (Filters / Sort / Row-Actions)

> ⛔ **Phase 3 (Tasks 308 / 309 / 310 migrations) is BLOCKED until owner signs off on §7, §8, §9.**

**[ ] Owner approved §7-§9 — date: _________**

---

## 11. Modal / Dialog / Sheet / Popover Canonical Rules — Decisions 4+5 (APPROVED)

> **Source:** Task 305 (Epic HH Phase 1, Sprint 23). STOP & ASK resolutions locked.

### 11.1 Width Tiers

**Decision 4 (APPROVED):** Four canonical width tiers for all admin modal surfaces:

| Tier | Class | px | Use cases |
|------|-------|----|-----------|
| **sm** | `max-w-[400px]` | 400px | Simple confirmations, single-field forms |
| **md** | `max-w-[560px]` | 560px | Standard forms, detail views with moderate content |
| **lg** | `max-w-[720px]` | 720px | Content editors, multi-locale forms, action-heavy detail views |
| **xl** | `max-w-[960px]` | 960px | Complex multi-panel workflows (reserved, not yet in use) |

Current Tailwind-class-to-canonical mapping (apply in Phase 5):

| Current class | px width | → Canonical tier |
|--------------|---------|-----------------|
| `max-w-sm` | 384px | **sm** (400px) |
| `max-w-md` | 448px | **md** (560px) |
| `max-w-lg` | 512px | **md** (560px) |
| `max-w-2xl` / `sm:max-w-2xl` | 672px | **lg** (720px) |

### 11.2 Mobile Fallback Rules

**Decision 5 (APPROVED):** Action-heavy or form-heavy modals → `<Sheet side="bottom">` at `<md` (768px). Read-only and simple confirm modals → `<Dialog>` at all breakpoints.

| Modal type | Mobile (`<md`) behavior |
|-----------|------------------------|
| Workflow modal (multiple actions + inline form) | → `<Sheet side="bottom">` |
| Form modal (Comboboxes, multi-field inputs) | → `<Sheet side="bottom">` |
| Multi-locale editor (tabs + content areas) | → `<Sheet side="bottom" full-height>` |
| Read-only preview | Dialog stays |
| Simple confirm (yes/no, single action) | Dialog / AlertDialog stays |

Phase 5 (Task 311) implements Sheet on all "Sheet" fallback modals. Tasks 308/309 (Sprint 28) implement Sheet for the 6 owner-flagged surfaces only.

### 11.3 Destructive Pattern → AlertDialog

- ALL destructive confirm dialogs (delete, block user, deactivate user) MUST use `<AlertDialog>`, NOT `<Dialog>`.
- `<AlertDialog>` provides stronger accessibility semantics (`role="alertdialog"`), clearer urgency.
- Non-destructive confirmations (set premium, activate, role change) keep `<Dialog>`.
- **Current violation**: ALL admin delete confirms use `<Dialog>` → Phase 5 migration required for ~11 modals (see §11.11).

### 11.4 Title + Description Rule

- `<DialogTitle>` / `<AlertDialogTitle>` — **required** for ALL modals (screen reader heading).
- `<DialogDescription>` — **optional** for regular Dialog (flag LOW if missing). **Required** for:
  - `<AlertDialog>` — accessibility requirement for destructive actions
  - Complex/irreversible workflows — required so user can read before proceeding

### 11.5 Status Badge → Body Metadata Grid

- Status color MUST be in a `<Badge>` inside the body metadata grid.
- Colored `DialogTitle` text is **non-canonical** (creates confusing accessibility labels).
- **Violation**: `AdminReportsManager` `ReportDetailDialog` uses `text-destructive` / `text-status-warning` / `text-status-success` on `DialogTitle` → Phase 5 migrate status color to body Badge.

### 11.6 Action Footer Canonical Pattern

- Use `<DialogFooter className="gap-2">` for button spacing.
- Primary action: **rightmost** in footer.
- Secondary (Cancel): **leftmost**.
- Multiple status-action buttons in body: `<div className="flex flex-wrap gap-2">` (inside body, not footer).
- **Non-canonical**: `sm:justify-between` in footer (`AdminPopularLocationsManager`) → Phase 5 fix.

### 11.7 Non-Canonical Custom Div Modals

Two admin components use custom `div` overlays instead of the canonical `<Dialog>` primitive:

| Component | Modal | Issues |
|-----------|-------|--------|
| `AdminCurrenciesManager` | `CurrencyFormModal` | Custom `div`, no focus trap, no `aria-modal`, no Escape handler, no `DialogHeader`/`DialogFooter` |
| `AdminExchangeProvidersManager` | `ProviderFormModal` | Same issues |

**Phase 5 (Task 311) MUST migrate both to canonical `<Dialog md>` + Sheet on mobile.**

### 11.8 Close Pattern

- Default: `<DialogContent>` shows X close button.
- Esc key → close (Radix primitive automatic).
- Backdrop click → close (default; use `onInteractOutside={(e)=>e.preventDefault()}` only for confirmed close-protect on complex forms with unsaved changes).
- If `showCloseButton={false}` → a Cancel button **MUST** exist in the footer.
- `showCloseButton={false}` instances requiring Phase 5 verification: `AdminLegalManager` `PageEditorDialog`, `AdminLocationsManager` `LocationModal`, `AdminPropertyTypesManager` `PropertyTypeFormDialog` (×2), `AdminUserProfile` confirmation dialogs (×5).

### 11.9 Scroll Pattern for Tall Content

- Tall content modals: `<DialogContent className="max-h-[85vh] overflow-y-auto">`.
- `overflow-y-auto` on the `DialogContent` root (or immediate inner scroll container) — NOT on a nested `div` that clips other content.
- Required for: `TicketDetailDialog`, `InquiryDetailDialog`, `TemplateEditorDialog`, `CurrencyFormModal` (custom div with `max-h-[90vh]`).

### 11.10 Accessibility Expectations

- Every modal: `<DialogTitle>` (required, screen reader heading)
- `<AlertDialog>`: `<AlertDialogTitle>` + `<AlertDialogDescription>` (both required)
- Focus trap: handled automatically by Radix Dialog/AlertDialog primitives
- `role="dialog"` / `role="alertdialog"`: set automatically by Radix — no custom implementation
- **Custom div modals** (`CurrencyFormModal`, `ProviderFormModal`) currently fail ALL accessibility requirements — Phase 5 priority migration

### 11.11 Per-Modal Canonical Assignment Table (26 rows)

| # | Component | Modal | Current width | Canonical tier | Mobile fallback | Destructive? | Phase 5 action |
|---|-----------|-------|--------------|----------------|----------------|-------------|----------------|
| 1 | `AdminListingsTable` | PremiumToggleDialog | `max-w-sm` | **sm** | Dialog OK | No | Keep Dialog sm |
| 2 | `AdminListingsTable` | ListingPreviewDialog | `max-w-md` | **md** | **Sheet** | Delete step inside | → md + Sheet mobile; delete → AlertDialog |
| 3 | `AdminLocationsManager` | LocationModal (create/edit) | `max-w-md` | **md** | **Sheet** | Delete inside | → md + Sheet mobile; delete → AlertDialog |
| 4 | `AdminLocationsManager` | DeleteConfirmDialog | `max-w-sm` | **sm** | AlertDialog OK | ✅ | → AlertDialog sm |
| 5 | `AdminCompaniesManager` | CompanyFormDialog | `max-w-sm` | **md** | **Sheet** | No | → md + Sheet mobile |
| 6 | `AdminCompaniesManager` | DeleteConfirm (`deletingId`) | `max-w-sm` | **sm** | AlertDialog OK | ✅ | → AlertDialog sm (verify if real Dialog exists) |
| 7 | `AdminPropertyTypesManager` | PropertyTypeFormDialog | `max-w-lg` | **md** | **Sheet** | Delete inside | → md + Sheet mobile; delete → AlertDialog |
| 8 | `AdminPropertyTypesManager` | DeleteDialog | `max-w-sm` | **sm** | AlertDialog OK | ✅ | → AlertDialog sm |
| 9 | `AdminCurrenciesManager` | CurrencyFormModal (custom div ⚠️) | `max-w-lg` | **md** | **Sheet** | No | → Dialog md + Sheet mobile; **migrate from custom div to Dialog primitive** |
| 10 | `AdminCurrenciesManager` | CurrencyDetailModal | `max-w-md` | **md** | **Sheet** | Delete step | → md + Sheet mobile; delete → AlertDialog |
| 11 | `AdminCurrenciesManager` | CurrencyDeleteConfirm | `max-w-sm` | **sm** | AlertDialog OK | ✅ | → AlertDialog sm |
| 12 | `AdminExchangeProvidersManager` | ProviderFormModal (custom div ⚠️) | `max-w-lg` | **md** | **Sheet** | No | → Dialog md + Sheet mobile; **migrate from custom div to Dialog primitive** |
| 13 | `AdminExchangeProvidersManager` | ProviderDeleteConfirm | `max-w-sm` | **sm** | AlertDialog OK | ✅ | → AlertDialog sm |
| 14 | `AdminEmailTemplatesManager` | PreviewDialog | `max-w-2xl` | **lg** | **Sheet** | No | → lg + Sheet mobile |
| 15 | `AdminEmailTemplatesManager` | TemplateEditorDialog | `sm:max-w-2xl` | **lg** | **Sheet (full-height)** | No | → lg + Sheet mobile |
| 16 | `AdminEmailTemplatesManager` | DeleteConfirmDialog | `max-w-sm` | **sm** | AlertDialog OK | ✅ | → AlertDialog sm |
| 17 | `AdminInquiriesManager` | InquiryDetailDialog | `max-w-2xl` | **lg** | **Sheet (full-height)** | No | → lg + Sheet mobile (Sprint 28 Task 309) |
| 18 | `AdminLegalManager` | PageEditorDialog | `max-w-2xl` | **lg** | **Sheet** | No | → lg + Sheet mobile; verify cancel button |
| 19 | `AdminPopularLocationsManager` | DeleteConfirm | `max-w-sm` | **sm** | AlertDialog OK | ✅ | → AlertDialog sm (add Description — required for AlertDialog) |
| 20 | `AdminPopularLocationsManager` | LocationDialog | `max-w-md` | **md** | **Sheet** | No | → md + Sheet mobile; fix footer alignment |
| 21 | `AdminReportsManager` | ReportDetailDialog | `max-w-md` | **md** | **Sheet** | No | → md + Sheet mobile; migrate status color from DialogTitle to body Badge |
| 22 | `AdminSupportManager` | TicketDetailDialog | `max-w-2xl` | **lg** | **Sheet (full-height)** | No | → lg + Sheet mobile (Sprint 28 Task 309) |
| 23 | `AdminSupportManager` | CreateTicketDialog | `max-w-lg` | **md** | **Sheet** | No | → md + Sheet mobile |
| 24 | `AdminUserProfile` | Block/Deactivate dialogs (×2 destructive) | `max-w-sm` | **sm** | AlertDialog OK | ✅ | → AlertDialog sm |
| 25 | `AdminDashboardRecentListings` | ListingDialog | `max-w-md` | **md** | Dialog OK (read-only) | No | Verify if write actions exist; if read-only → Dialog OK |
| 26 | `AdminSidebar` | Mobile Nav Sheet | `Sheet side="left"` | — | ✅ Already canonical | — | No change needed |

---

## 12. Owner Approval Gate for Phase 5 (Modal Migration — Task 311)

> ⛔ **Phase 5 (Task 311 — modal/dialog migration generalization) is BLOCKED until owner signs off on §11.**

**[ ] Owner approved §11 — date: _________**

---

## 13. Canonical `StatusChangeControl` — Decision 1 (APPROVED)

> **Source:** Task 328 (Sprint 28, 2026-05-31). Decision 1 is locked — do NOT re-litigate the 2-tier model.

**Owner directive Sprint 28 Decision 1:** Tiered canonical primitive — `variant="select"` for low-stakes admin status changes (Inquiries); `variant="workflow"` for moderation / destructive status changes (Support tickets, complaints, listing transitions). One shared component; per-surface variant declared at usage site.

### 13.1 Tier Definitions

**`variant="select"`**
- Single `Combobox`-styled dropdown (canonical Combobox primitive from `docs/ui-rules.md §0`)
- Immediate save on change (no submit button)
- Optional note field hidden by default (revealed only if `enableNote` prop is `true`)
- Timeline hidden by default (revealed if `historyEvents` prop is non-empty)
- Localized toast on save success / error

**`variant="workflow"`**
- Pill-button group of allowed transitions (from `transitions` prop)
- Optional note `<Textarea>` (mandatory if `requireNote` prop is set)
- "Update status" submit button (disabled when no transition selected OR when current status already selected)
- Submit button disabled + spinner while pending
- Required timeline below the workflow block fed by `historyEvents` prop

### 13.2 Canonical TypeScript API

```ts
type StatusOption<S extends string> = {
  code: S
  labelKey: I18nKey
  badgeVariant: 'neutral' | 'success' | 'warning' | 'destructive' | 'info'
  icon?: ReactNode
  destructive?: boolean
}

type Transition<S extends string> = {
  from: S
  to: S
  labelKey: I18nKey
  destructive?: boolean
  requireNote?: boolean
}

type HistoryEvent = {
  id: string
  fromStatus: string | null
  toStatus: string
  note: string | null
  actorName: string | null
  createdAt: string
}

type StatusChangeControlProps<S extends string> = {
  variant: 'select' | 'workflow'
  currentStatus: S
  statuses: StatusOption<S>[]                 // canonical badge / label / icon registry
  transitions?: Transition<S>[]               // required for variant="workflow"; ignored for "select"
  historyEvents?: HistoryEvent[]              // optional; renders <StatusChangeHistory /> when non-empty
  onSubmit: (next: { toStatus: S; note: string | null }) => Promise<void> | void
  enableNote?: boolean                        // select variant only — show optional note field
  requireNote?: boolean                       // workflow variant only — block submit until note present
  submitLabelKey?: I18nKey                    // default 'update_status_btn'
  disabled?: boolean
  'aria-label'?: string
}
```

Separate `<StatusChangeHistory events={HistoryEvent[]} />` subcomponent renders the canonical timeline. Task 307 ships both `StatusChangeControl` and `StatusChangeHistory`.

### 13.3 Mandatory Locale Keys

Task 307 MUST add these 11 keys to `messages/{sq,en,uk,it}.json` under the `admin.common.status_control` namespace:

| Key | Purpose |
|-----|---------|
| `update_status_btn` | Workflow variant submit button label |
| `status_change_label` | Section heading above the workflow block |
| `status_change_note_placeholder` | Textarea placeholder in both variants |
| `status_change_note_required` | Validation message when note is required |
| `status_change_note_optional` | Helper text indicating note is optional |
| `status_change_success` | Toast on successful status update |
| `status_change_error` | Toast on failed status update |
| `status_change_no_change` | No-op feedback when same status reselected |
| `status_change_history_title` | Timeline section heading |
| `status_change_history_empty` | Empty-state for timeline |
| `status_change_history_actor_unknown` | Fallback for missing actor name |

> Re-use existing `support_status_*`, `status_*`, `complaint_type_*`, and listing-status keys for the option labels — do NOT duplicate them under `admin.common.status_control`.

### 13.4 Per-Surface Assignment Table

| Surface | Component | variant | transitions | historyEvents | enableNote | requireNote | Migration target |
|---------|-----------|---------|-------------|---------------|-----------|-------------|-----------------|
| `/admin/inquiries/support` | `AdminInquiriesManager` (mailbox=support) | `select` | — | (none today) | false | false | Task 307 pilot + Task 309 finalize |
| `/admin/inquiries/sales` | `AdminInquiriesManager` (mailbox=sales) | `select` | — | (none today) | false | false | Task 309 |
| `/admin/support` (tickets) | `AdminSupportManager` | `workflow` | open↔in_progress↔resolved↔closed (full cross-product within `TicketStatus`) | `support_ticket_events` rows from existing fetch | false | false (notes optional) | Task 309 |
| `/admin/support` (complaints) | `AdminSupportManager` | `workflow` | same as tickets | same as tickets | false | false | Task 309 |
| `/admin/listings` (per-row + detail) | `AdminListingsTable` | `workflow` | derived from existing `STATUS_ACTIONS` map verbatim (preserve per-current-status transition whitelist) | — (no listing-event timeline — do NOT introduce in Sprint 28) | false | false | Task 308 |
| `/admin/reports` | `AdminReportsManager` | — | **NOT in Sprint 28 scope** | — | — | — | Epic HH Phase 3 follow-up |

### 13.5 Save / Loading / Error / Success Contract

- On `onSubmit` success → `toast.success(t('admin.common.status_control.status_change_success'))`. Caller's `onSubmit` may also trigger its own post-success refetch/mutate.
- On `onSubmit` error → `toast.error(t('admin.common.status_control.status_change_error'))`. Submit stays unlocked for retry.
- "No change" (workflow: user clicks current-status pill; select: same value already selected) → submit button stays disabled; Combobox change is a no-op. Silent — no toast.
- Pending state → submit button shows `<Loader2>` spinner + label unchanged (same `submitLabelKey` — no "Saving…" swap to keep behaviour predictable across locales).

### 13.6 Mobile (320/375/390) Behaviour Requirements

- **`variant="select"`** — uses canonical Combobox primitive (`docs/ui-rules.md §0`) which is already mobile-ready.
- **`variant="workflow"`** — pill row uses `flex-wrap gap-2`; pills `size="sm"` per `docs/ui-rules.md`; tap target ≥ 44×44 via `min-h-[44px]` wrapper if pill size is below threshold.
- Note `<Textarea>` — full-width at narrow breakpoints with `min-h-[88px]`.
- History timeline — collapses to vertical list at all widths; desktop card-style layout preserved at `≥md`.

---

## 14. Admin canonical responsive contract (Task 306-Fix, 2026-05-31)

> This contract applies to EVERY admin route. Task 310 migration sweep enforces it across the remaining ~12 admin pages.

### 14.1 Container

- All admin pages MUST wrap their content in `<AdminPageShell>`.
- `<AdminPageShell>` uses the `.container-admin` utility (full-width up to `2xl:`, capped at 1792px at `2xl:+`). DO NOT use `.container-wide` (that is for public site pages).
- AdminPageShell header pattern: title + optional countBadge + optional subtitle + actions (right-aligned at `md:+`, stacked at `<md`). Filter bar slot below header.

### 14.2 Data display

- **Tabular data:** use `<AdminTable>`. The primitive internally renders a card list at `<lg:` and a table at `lg:+`. Consumers MUST supply `columns` and SHOULD supply `cardRow` (a structured `title/subtitle/meta/trailing` renderer). If `cardRow` is omitted, the primitive synthesizes from `columns` (best-effort default — surfaces with non-trivial row visuals MUST pass an explicit `cardRow`).
- **Non-tabular row data:** use `<AdminCardList>` directly.
- DO NOT render raw `<table>` outside `<AdminTable>` in admin routes.
- DO NOT render ad-hoc `<div>` rows that visually imitate cards outside `<AdminCardList>`.

### 14.3 Switch breakpoint

- The canonical table↔card switch is at `lg:` (1024px). Matches the Dialog → bottom-sheet switch in Task 329 / Epic Z.2. Below `lg:` → cards (mobile + tablet). At `lg:+` → table (desktop). No per-surface override without orchestrator STOP & ASK.

### 14.4 Column visibility

Recommended defaults per breakpoint (surfaces tune per data shape):

| Visibility token | Visible at | Typical columns |
|-----------------|-----------|-----------------|
| `'always'` | All sizes | Sticky-first + 1–2 critical data points (price, status) |
| `'sm'` | 640px+ | Secondary columns |
| `'md'` | 768px+ | Tablet-only columns |
| `'lg'` | 1024px+ | Desktop columns (agent, owner) |
| `'xl'` | 1280px+ | Wide-desktop columns (IDs, timestamps) |

Sticky first column applies at `lg:+` only (cards have natural hierarchy via title/subtitle/meta).

### 14.5 Wide-screen behaviour (1440 / 1920 / 2560)

- AdminPageShell fills the full main area up to `2xl:`. At `2xl:+` (1536+) caps at 1792px (`max-w-10xl`).
- Table columns show their full set at `xl:` (1280+). Wider screens do not gain extra columns.
- DO NOT introduce `2xl:grid-cols-N` for admin tables — natural column widths use available space.

### 14.6 Verification gate

- Every admin task touching a route MUST verify at **9 widths × 4 locales** (sq/en/uk/it): 320, 375, 390, 768, **1024**, 1280, 1440, **1920**, 2560.
- Screenshots strongly preferred per width; per-width pass/fail notes mandatory in the session log.
- Failure at any width × locale = task is NOT complete (STOP & ASK rather than ship defect).
- `docs/ui-rules.md §17 item 6` and `docs/responsive-governance.md §1 "Verification widths"` both use the 9-width canon.
