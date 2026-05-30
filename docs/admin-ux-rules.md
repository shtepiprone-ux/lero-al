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
The right-edge fade shadow is a Phase 2 deliverable (canonical `AdminTable` primitive, Task 307). Task 303 specifies the rule; Task 307 implements it. Until Task 307 ships, existing `overflow-x-auto` wrappers are the minimum acceptable state.

### Column visibility at narrow breakpoints
Controlled-scroll tables may still use `hidden sm:table-cell` / `hidden md:table-cell` etc. to reduce the visible column count at intermediate breakpoints — reducing scroll distance before the sticky column pattern is needed. This is complementary, not a substitute.

---

## 4. Per-Route Policy Table

> **Source:** Task 303 code-level inventory + owner-approved STOP & ASK resolutions.
> Routes marked ⚠️ = CORRECTED from preliminary Epic HH classification.

| Route | Component | Pattern | Sticky column | Scroll affordance | Rationale |
|-------|-----------|---------|---------------|-------------------|-----------|
| `/admin` | `AdminDashboard` (inline) | N/A — card grid | — | — | Not a table; KPI card grid + content panels are independently responsive |
| `/admin/listings` | `AdminListingsTable` | **Controlled scroll** | "Listing" (title + image) | Right-edge fade | Data-dense: 7 columns (ID/Listing/Type/Price/Status/Agent/Date); high-frequency admin workflow |
| `/admin/users` (all) | `AdminUsersTable` | **Controlled scroll** | "User" (display name) | Right-edge fade | Data table: User/Role/Status/Phone/Date; agent onboarding + user management |
| `/admin/users` (verified) | `AdminUsersTable` | **Controlled scroll** | "Agent" (display name) | Right-edge fade | Verified agents sub-table; same density |
| `/admin/support` | `AdminSupportManager` | **Card-row fallback** | — | — | Workflow: triage tickets, open detail modal, update status; card affordance matches the support inbox UX |
| `/admin/inquiries/support` | `AdminInquiriesManager` | **Card-row fallback** | — | — | Already a card list (no `<table>`); inbox metaphor |
| `/admin/inquiries/sales` | `AdminInquiriesManager` | **Card-row fallback** | — | — | Same component; same inbox metaphor |
| `/admin/reports` | `AdminReportsManager` | **Card-row fallback** | — | — | Workflow-heavy: review + act on reports; 5 columns (Reason/Listing/Reporter/Status/Date) collapse well to cards |
| `/admin/locations` | `AdminLocationsManager` | **Controlled scroll** | "Name AL" | Right-edge fade | Reference table: 5 cols (ID/Name-AL/Name-EN/Type/Featured); admin manages location taxonomy |
| `/admin/popular-locations` | `AdminPopularLocationsManager` | **Card-row fallback** ⚠️ | — | — | CORRECTED: 3-col light CRUD (Name/Order/Photo); fits 320 without scroll; photo thumbnail adapts as card media |
| `/admin/companies` | `AdminCompaniesManager` | **Controlled scroll** | "Name" | Right-edge fade | Reference table: Logo/Name/Agents/Created; company directory |
| `/admin/property-types` | `AdminPropertyTypesManager` | **Controlled scroll** | Human-readable Name/Label | Right-edge fade | Data-dense: 7 cols (ID/Slug/SQ/EN-UK-IT/Sort/Active/Created); multilingual taxonomy |
| `/admin/currency` (currencies) | `AdminCurrenciesManager` | **Controlled scroll** | "Code" | Right-edge fade | Reference table: Code/Symbol/Name-EN/Active/Updated |
| `/admin/currency` (providers) | `AdminExchangeProvidersManager` | **Controlled scroll** | "Name" | Right-edge fade | Reference table: Name/Endpoint/Priority/Mode/Enabled/Notes; tech config |
| `/admin/email-templates` | `AdminEmailTemplatesManager` | **Card-row fallback** | — | — | Already a card list layout; template key + locale badges + status as card fields |
| `/admin/legal` | `AdminLegalManager` | **Card-row fallback** ⚠️ | — | — | CORRECTED: 3-col light CRUD (Title/Status/Actions); fits 320 without scroll |
| `/admin/footer` | `AdminFooterManager` | **Card-row fallback** | — | — | Form-driven locale tabs; link rows need responsive re-layout at narrow (HIGH severity gap — Task 303) |
| `/admin/settings` | `AdminSettings` | **Card-row fallback** | — | — | Form-driven tabs; naturally responsive at `max-w-3xl` |
| `/admin/permissions` | `AdminPermissionsManager` | **Card-row fallback** ⚠️ | — | — | CORRECTED: 2-column permissions matrix (key + toggle), not a data-dense table; each permission becomes a labeled card row |
| `/admin/pages-admin` | stub | N/A | — | — | "Coming soon" stub; out of scope until CMS is implemented |
| `/admin/users/[id]` | user profile | N/A — form/detail | — | — | User detail page; profile-card layout; not a list |
| `/admin/users/new` | user creation | N/A — form | — | — | Create user form |

---

## 5. STOP & ASK Resolutions (Task 303)

| Question | Resolution |
|----------|-----------|
| `/admin/permissions` pattern | Changed from `controlled-scroll` to `card-row fallback` — compact 2-column permissions matrix, not a data table |
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
