# Admin Responsive Audit — Task 303

**Date:** 2026-05-30  
**Task:** 303 (Epic HH Phase 1)  
**Auditor:** Sonnet 4.6  
**Scope:** All admin routes × 7 breakpoints × 4 locales — code-level analysis

> **Note on methodology:** This audit is based on source-code analysis (Tailwind class inventory, component structure, layout containers) since no browser rendering was available. Severity classifications are anchored to code evidence, not screenshot captures. Owner runtime verification is required before any CRITICAL finding is closed.

---

## 1. Route → Component → Layout-Type Mapping

| Route | Component | Layout type | Table overflow | Max-width |
|-------|-----------|------------|----------------|-----------|
| `/admin` | AdminDashboard (inline) | Card grid + panels | N/A | `max-w-6xl` |
| `/admin/listings` | AdminListingsTable | `<table>` | `overflow-x-auto` ✅ | `max-w-10xl` |
| `/admin/users` | AdminUsersTable | `<table>` ×2 | verified: `overflow-x-auto` ✅; all-users: `overflow-hidden` ⚠️ | `max-w-10xl` |
| `/admin/support` | AdminSupportManager | `<table>` | `overflow-hidden` ⚠️ | `max-w-6xl` |
| `/admin/inquiries/support` | AdminInquiriesManager | Card list (no table) | N/A | `max-w-5xl` |
| `/admin/inquiries/sales` | AdminInquiriesManager | Card list (no table) | N/A | `max-w-5xl` |
| `/admin/reports` | AdminReportsManager | `<table>` | `overflow-hidden` ⚠️ | `max-w-5xl` |
| `/admin/locations` | AdminLocationsManager | `<table>` | `overflow-hidden` ⚠️ | `max-w-5xl` |
| `/admin/popular-locations` | AdminPopularLocationsManager | `<table>` | `overflow-hidden` ⚠️ | `max-w-5xl` |
| `/admin/companies` | AdminCompaniesManager | `<table>` | `overflow-hidden` ⚠️ | `max-w-5xl` |
| `/admin/property-types` | AdminPropertyTypesManager | `<table>` | `overflow-x-auto` ✅ | `max-w-5xl` |
| `/admin/currency` (currencies) | AdminCurrenciesManager | `<table>` | `overflow-hidden` ⚠️ (inferred) | `max-w-5xl` |
| `/admin/currency` (providers) | AdminExchangeProvidersManager | `<table>` | `overflow-hidden` ⚠️ | `max-w-5xl` |
| `/admin/email-templates` | AdminEmailTemplatesManager | Card list (no table) | N/A | `max-w-5xl` |
| `/admin/legal` | AdminLegalManager | `<table>` | `overflow-hidden` ⚠️ | `max-w-4xl` |
| `/admin/footer` | AdminFooterManager | Form + link rows | N/A | `max-w-4xl` |
| `/admin/settings` | AdminSettings | Form + tabs | N/A | `max-w-3xl` |
| `/admin/permissions` | AdminPermissionsManager | Grid matrix | `overflow-hidden` | — |

---

## 2. Admin Shell Layout

| Feature | Code evidence | Impact at narrow |
|---------|--------------|------------------|
| Sidebar | `hidden lg:flex w-60 shrink-0` | Below 1024px: sidebar hidden; hamburger menu via Sheet |
| Mobile header | `admin-mobile-header lg:hidden sticky top-0 min-h-14` | At 320–1023: header occupies 56px viewport height |
| Main content | `flex-1 min-w-0 overflow-hidden` | Content area full-width below lg |
| Page padding | `p-6` (320–1023) / `lg:p-8` | At 320: 24px each side = 48px total horizontal padding |
| Available content width at 320 | 320 - 48 = **272px** | All tables/forms must fit in 272px |

---

## 3. Per-Route Inventory (Note 22 — Admin Table Preservation)

### 3.1 `/admin` — Dashboard

**Layout structure:**
- KPI stats: `grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6` → 2 cols at 320–639, 3 cols at 640–1279, 6 cols at 1280+
- Main grid: `grid grid-cols-1 lg:grid-cols-2` → single column 320–1023, 2 cols 1024+
- Pending reports panel: card list with `divide-y`
- Location requests: conditional card (shown only when > 0)
- Status bar: `w-28 shrink-0` label + flex-1 bar + fixed count/pct

**Controls inventory:** 6 stat cards (4 link to detail pages), recent listings (link), reports panel (links), location requests (links), listing status bar. No create/edit actions.

### 3.2 `/admin/listings`

**Columns (all):** ID, Listing (title/image/status), Type, Price, Status, Agent, Date  
**Visible at 320 (hidden classes):** Listing, Price, Status (ID hidden sm, Type hidden md, Agent hidden lg, Date hidden xl)  
**Toolbar:** All/Premium tabs (`size="tab"`, `flex-wrap md:flex-nowrap`), Search input (`flex flex-col sm:flex-row`), Status Combobox  
**Row click:** Opens `ListingPreviewDialog`  
**Row actions:** Copy ID, Premium toggle, status actions inside dialog  
**Inline controls:** Status badge (visual only), Premium star icon  
**Overflow:** `overflow-x-auto` ✅

### 3.3 `/admin/users` — All Users tab

**Columns:** User (name+role+uuid), Role (badges), Status (badge), Phone, Date  
**Visible at 320:** User column only (Status hidden sm, Phone hidden md, Date hidden lg)  
**Toolbar:** All/Verified tabs (`flex flex-wrap md:flex-nowrap`), Role filter pills (`flex gap-2 flex-wrap`), Status filter pills (`flex gap-2 flex-wrap`), Location request badge (conditional)  
**Row click:** Links to `/admin/users/[id]`  
**Row actions:** Verify toggle inline (ShieldCheck icon, h-6 w-6)  
**Overflow:** `overflow-hidden` ⚠️ — no `overflow-x-auto`

### 3.4 `/admin/users` — Verified Agents tab

**Columns:** Agent, Company, Date  
**Visible at 320:** Agent + Company (hidden sm), Date (hidden md) → Agent column only  
**Row actions:** Revoke button  
**Overflow:** `overflow-x-auto` ✅

### 3.5 `/admin/support`

**Columns:** Subject (with reason below + complaint_type badge), Type, Reporter, Reported, Status, Updated  
**Visible at 320:** Subject + Status + chevron (Type hidden sm, Reporter/Reported hidden md, Updated hidden lg)  
**Toolbar:** Type filter buttons + Status filter buttons + Create button (`flex items-center gap-3 flex-wrap`, Create has `ml-auto`)  
**Row click:** Opens `TicketDetailDialog`  
**Row actions:** None (full row clickable)  
**Stats row:** 3 KPI cards `grid grid-cols-3`  
**Overflow:** `overflow-hidden` ⚠️

### 3.6 `/admin/inquiries/support` and `/admin/inquiries/sales`

**Layout:** Card list (no `<table>`); `divide-y rounded-xl border overflow-hidden`  
**Each card shows:** Status badge + icon, Subject, Sender, Date, Reply count  
**Toolbar:** Status filter buttons (`flex gap-1.5 flex-wrap`), mailbox filter  
**Row click:** Opens Dialog with full inquiry thread  
**Overflow:** N/A (card list, inherently responsive)

### 3.7 `/admin/reports`

**Columns:** Reason, Listing (hidden md), Reporter (hidden lg), Status, Date (hidden sm)  
**Visible at 320:** Reason + Status + chevron  
**Toolbar:** Status filter tabs with count badges (`flex gap-1.5 flex-wrap`)  
**Row click:** Opens `ReportDetailDialog`  
**Overflow:** `overflow-hidden` ⚠️

### 3.8 `/admin/locations`

**Columns:** ID, Name AL, Name EN (hidden md), Type, Featured (hidden sm)  
**Visible at 320:** ID + Name AL + Type + actions  
**Toolbar:** Type filter pills (`flex gap-1.5 flex-wrap`), Add button  
**Row click:** Opens `LocationModal`  
**Row actions:** Featured toggle (Star icon, city-only conditional)  
**Overflow:** `overflow-hidden` ⚠️

### 3.9 `/admin/popular-locations`

**Columns:** Name, Order (#), Photo  
**Visible at 320:** All 3 columns + chevron  
**Toolbar:** Add button (top-right)  
**Row click:** Opens `LocationDialog`  
**Overflow:** `overflow-hidden` (3 cols fit without scroll)

### 3.10 `/admin/companies`

**Columns:** Logo (w-14), Name, Agents, Created  
**Visible at 320:** All 4 columns (no hidden-breakpoint classes)  
**Toolbar:** Search input, New button  
**Row click:** Opens `CompanyFormDialog`  
**Row actions:** Delete button (Trash2 inline in row)  
**Overflow:** `overflow-hidden` ⚠️

### 3.11 `/admin/property-types`

**Columns:** ID, Slug, SQ, EN/UK/IT (grouped), Sort Order, is_active, Created  
**Visible at 320:** All columns scroll (overflow-x-auto ✅)  
**Toolbar:** Search input, New button  
**Row click:** Opens `PropertyTypeFormDialog`  
**Row actions:** is_active toggle (clickable Badge)  
**Overflow:** `overflow-x-auto` ✅

### 3.12 `/admin/currency` (Currencies tab)

**Columns:** Code, Symbol, Name EN, is_active, Last Updated  
**Toolbar:** Search input, New provider button  
**Row click:** Opens currency detail modal  
**Overflow:** inferred `overflow-hidden` ⚠️ (table inside `border rounded-xl overflow-hidden`)

### 3.13 `/admin/currency` (Exchange Providers tab)

**Columns:** Name, Endpoint (hidden md), Priority, Mode, is_enabled, Notes (hidden lg), Actions  
**Visible at 320:** Name + Priority + Mode + is_enabled + Actions  
**Toolbar:** New provider button  
**Row actions:** Edit (Pencil), Delete (Trash2)  
**Overflow:** `overflow-hidden` ⚠️

### 3.14 `/admin/email-templates`

**Layout:** Card list; each card: Key/Subject, locale badges, active/inactive icon, Updated  
**Toolbar:** Search input, Create button, Albanian-only policy notice  
**Row actions:** Edit (Pencil), Delete (Trash2)  
**Overflow:** N/A (card list)

### 3.15 `/admin/legal`

**Columns:** Title, Slug (hidden md), Status badge, Updated (hidden lg), Actions (Edit + Delete)  
**Visible at 320:** Title + Status + Actions  
**Toolbar:** New Doc button (top-right)  
**Row actions:** Edit, Delete  
**Overflow:** `overflow-hidden` (3 visible cols fit fine)

### 3.16 `/admin/footer`

**Layout:** Form with 4 locale tabs; each tab has brand fields + 3 link group editors  
**Link row structure:** `flex items-center gap-2` with 6 controls: GripVertical, index, Label Input (`flex-1`), URL Input (`flex-1`), enable/disable toggle, Remove button  
**Toolbar per tab:** Save button  
**Overflow:** No explicit overflow on link rows

### 3.17 `/admin/settings`

**Layout:** Tab-based form (`Tabs` + sections): general/brand/footer/seo/i18n  
**Controls:** AdminInput, Textarea, Combobox, checkboxes, Save button  
**No table; max-w-3xl** — naturally constrained and responsive

### 3.18 `/admin/permissions`

**Layout:** `grid-cols-[1fr_auto]` matrix — each row: permission key/description + Switch toggle  
**Controls:** Switch toggle per permission, ShieldCheck/ShieldX icon, Last updated metadata  
**Overflow:** `rounded-xl border divide-y overflow-hidden`

---

## 4. Per-Route × Per-Breakpoint × Per-Locale Evidence Matrix

> Legend: ✅ No issue | ⚠️ MEDIUM | 🔴 HIGH | 🚨 CRITICAL | N/A Not applicable

### 4.1 `/admin` — Dashboard

| Breakpoint | sq | en | uk | it | Severity |
|-----------|----|----|----|----|----------|
| 320 | KPI 2-col grid: 136px cards cramped; stat labels may wrap mid-word (sq is terse) | Same | Ukrainian labels wrap at `break-words`; status bar label `w-28` may clip "Неактивний" | Italian OK | ⚠️ MEDIUM |
| 375 | 2-col grid, slightly more breathing room | OK | OK | OK | ⚠️ MEDIUM |
| 390 | As 375 | OK | OK | OK | ⚠️ MEDIUM |
| 768 | `sm:grid-cols-3` (3 cols) but NO `md:grid-cols-4`; 3 cols at 768 has wide cards | OK | OK | OK | ⚠️ MEDIUM (sparse at 768) |
| 1280 | `xl:grid-cols-6` → 6 KPI cards in one row. Main `lg:grid-cols-2` → 2-col layout | OK | OK | OK | ✅ |
| 1440 | As 1280 | OK | OK | OK | ✅ |
| 2560 | `max-w-6xl` constrains; whitespace on sides | OK | OK | OK | ✅ |

**Sub-audit — Dashboard KPI cards:**
- At 320: 2×2 grid of 3 upper KPI cards, 1 wraps to next row = 2 rows of 2 then 1 + 1. Cards have `p-5 flex items-center gap-4`. Icon 44px + text. Content fits but density is low.
- At 768: jumps to 3-col (`sm:`=640px threshold). Cards have more room. Fine.
- StatusBar at 320: label `w-28` (112px) + bar (flex-1, ~68px) + count `w-14` + pct `w-9`. Total 272 - 112 - 56 - 36 = 68px for bar. Tight but functional.
- Missing: no `md:grid-cols-4` between sm-3 and xl-6 → at 768–1279 only 3 KPI cards per row.

### 4.2 `/admin/listings`

| Breakpoint | sq | en | uk | it | Severity |
|-----------|----|----|----|----|----------|
| 320 | Tab bar wraps (Task 301 ✅). Search stacks vertically. 3 cols visible. `overflow-x-auto` scrolls OK. | OK | Ukrainian col_listing title may be longer but truncated in cell | OK | ⚠️ MEDIUM |
| 375 | As 320 | OK | OK | OK | ⚠️ MEDIUM |
| 390 | As 320 | OK | OK | OK | ⚠️ MEDIUM |
| 768 | Search + combobox in one row (`sm:flex-row`). ID column appears. Table fits in most cases | OK | OK | OK | ✅ |
| 1280 | All columns visible. Desktop layout optimal | OK | OK | OK | ✅ |
| 1440 | As 1280 | OK | OK | OK | ✅ |
| 2560 | `max-w-10xl` — very wide; table stretches; columns sparsely spaced | OK | OK | OK | ⚠️ MEDIUM (sparse) |

**Issues:**
- No sticky column: scrolling left loses the listing identity (no visual anchor). MEDIUM.
- No sticky header: at 2560, long table requires scrolling down; header lost. MEDIUM.
- `truncate max-w-[200px]` on listing title in cell: complies with Task 290 note (table cells where truncation retains semantic meaning via click-to-detail). Acceptable.

### 4.3 `/admin/users`

| Breakpoint | sq | en | uk | it | Severity |
|-----------|----|----|----|----|----------|
| 320 | All-users tab: `overflow-hidden` — no x-scroll. Only User column visible (others hidden). Verify icon (h-6 w-6) is inside 24×24 — below 44px touch target 🔴 | OK | Long Ukrainian names may wrap inside cell | OK | 🔴 HIGH (touch target + overflow) |
| 375 | As 320 | OK | OK | OK | 🔴 HIGH |
| 390 | As 320 | OK | OK | OK | 🔴 HIGH |
| 768 | Status badge appears (sm:), phone appears (md:). `overflow-hidden` — if Status or phone is very long, clips | OK | OK | OK | ⚠️ MEDIUM |
| 1280 | Full table. OK | OK | OK | OK | ✅ |
| 1440 | As 1280 | OK | OK | OK | ✅ |
| 2560 | `max-w-10xl` very wide; sparse | OK | OK | OK | ⚠️ MEDIUM |

**Issues:**
- All-users tab: `overflow-hidden` wrapping table — should be `overflow-x-auto`. HIGH.
- Verify toggle `h-6 w-6` = 24×24px — below 44px touch target requirement. HIGH.
- Verified agents tab: `overflow-x-auto` ✅. OK.

### 4.4 `/admin/support`

| Breakpoint | sq | en | uk | it | Severity |
|-----------|----|----|----|----|----------|
| 320 | Create button `ml-auto` in `flex-wrap` toolbar — wraps to full-width line, `ml-auto` loses effect. OK functionally but misaligned | OK | Status filter labels (Відкритий/В роботі) wrap in buttons at narrow | OK | ⚠️ MEDIUM |
| 375 | As 320 | OK | OK | OK | ⚠️ MEDIUM |
| 390 | As 320 | OK | OK | OK | ⚠️ MEDIUM |
| 768 | Single-column filter row. All 5 status filters + create button. May still wrap | OK | OK | OK | ⚠️ MEDIUM |
| 1280 | Full table. All filter pills in one row | OK | OK | OK | ✅ |
| 1440 | As 1280 | OK | OK | OK | ✅ |
| 2560 | max-w-6xl constrains. OK | OK | OK | OK | ✅ |

**Issues:**
- `ml-auto` on Create button inside `flex-wrap` — at 320, button wraps to its own line and `ml-auto` has no effect (no remaining space on line). Should use `justify-end` + `w-full` or restructure toolbar into two rows. MEDIUM.
- `overflow-hidden` on table wrapper — no x-scroll. However, at 320 only Subject+Status visible, so no actual clipping. LOW-MEDIUM.
- Stats `grid grid-cols-3` — at 320, 3 columns of 82px each. Labels "Відкриті/В роботі/Вирішені" may overflow cell. MEDIUM.

### 4.5 `/admin/inquiries/support` and `/admin/inquiries/sales`

| Breakpoint | sq | en | uk | it | Severity |
|-----------|----|----|----|----|----------|
| 320 | Card list rows stretch to width. Status badges + text wrap naturally. OK | OK | Ukrainian subject text wraps (`min-w-0`). OK | OK | ✅ |
| 375–2560 | No overflow issues expected | OK | OK | OK | ✅ |

### 4.6 `/admin/reports`

| Breakpoint | sq | en | uk | it | Severity |
|-----------|----|----|----|----|----------|
| 320 | `overflow-hidden` container — at 320 Reason+Status visible (2 cols). Reason text truncates (contains `truncate max-w-xs`). OK. Filter tabs wrap. | OK | OK | OK | ⚠️ MEDIUM |
| 375 | As 320 | OK | OK | OK | ⚠️ MEDIUM |
| 390 | As 320 | OK | OK | OK | ⚠️ MEDIUM |
| 768+ | More columns. OK | OK | OK | OK | ✅ |

### 4.7 `/admin/locations`

| Breakpoint | sq | en | uk | it | Severity |
|-----------|----|----|----|----|----------|
| 320 | `overflow-hidden`. At 320: ID + Name AL + Type + actions visible. Type badge short. OK but `overflow-hidden` clips if Name AL is very long | OK | Ukrainian location names long — may overflow Name AL cell | OK | ⚠️ MEDIUM |
| 375–768 | Name EN appears (md). Filter pills wrap | OK | OK | OK | ⚠️ MEDIUM |
| 1280+ | Full table. OK | OK | OK | OK | ✅ |

### 4.8 `/admin/popular-locations`

| Breakpoint | sq | en | uk | it | Severity |
|-----------|----|----|----|----|----------|
| 320 | 3 cols: Name + Order + Photo. Fits in 272px. `overflow-hidden` but no overflow expected | OK | OK | OK | ✅ |
| 375–2560 | OK | OK | OK | OK | ✅ |

### 4.9 `/admin/companies`

| Breakpoint | sq | en | uk | it | Severity |
|-----------|----|----|----|----|----------|
| 320 | `overflow-hidden`. 4 cols: Logo(56px) + Name + Agents + Created. At 272px: 56 + remaining split. Long company names may be truncated. Delete button inline. OK but cramped | OK | OK | OK | ⚠️ MEDIUM |
| 375–768 | As 320 but wider | OK | OK | OK | ⚠️ MEDIUM |
| 1280+ | OK | OK | OK | OK | ✅ |

**Issues:** No hidden-breakpoint classes → all 4 cols visible even at 320. Without `overflow-x-auto`, any overflow clips. MEDIUM.

### 4.10 `/admin/property-types`

| Breakpoint | sq | en | uk | it | Severity |
|-----------|----|----|----|----|----------|
| 320 | `overflow-x-auto` ✅. 7 cols — scrolls. No sticky column → lose context while scrolling. | OK | Multi-locale name cells long | OK | ⚠️ MEDIUM |
| 768+ | As 320 but wider content | OK | OK | OK | ⚠️ MEDIUM (no sticky) |
| 1280+ | All visible. No sticky still — long tables lose header context | OK | OK | OK | ⚠️ MEDIUM |

### 4.11 `/admin/currency`

| Breakpoint | sq | en | uk | it | Severity |
|-----------|----|----|----|----|----------|
| 320 | Currencies: `overflow-hidden` ⚠️. 5 cols (Code/Symbol/Name/Active/Updated). Without x-scroll, clips at 272px | OK | Ukrainian currency names may be long | OK | 🔴 HIGH |
| 320 | Exchange providers: `overflow-hidden` ⚠️. 7 cols. Endpoint hidden md, Notes hidden lg — at 320: Name+Priority+Mode+Enabled+Actions (5 cols) — clips without scroll | OK | OK | OK | 🔴 HIGH |
| 768+ | Both tabs: more space but still no sticky. Hidden cols appear | OK | OK | OK | ⚠️ MEDIUM |
| 1280+ | All cols visible. OK | OK | OK | OK | ✅ |

### 4.12 `/admin/email-templates`

| Breakpoint | sq | en | uk | it | Severity |
|-----------|----|----|----|----|----------|
| 320 | Card list. At 320: template key + locale badges wrap. Albanian-only notice wraps. Functional but dense | OK | Long Ukrainian subject in template key may wrap | OK | ⚠️ MEDIUM |
| 375–1280+ | Progressive improvement. OK | OK | OK | OK | ✅ |

### 4.13 `/admin/legal`

| Breakpoint | sq | en | uk | it | Severity |
|-----------|----|----|----|----|----------|
| 320 | 3 visible cols: Title + Status + Actions. At 272px: fits. Slug hidden (md), Updated hidden (lg). OK | OK | Ukrainian legal page titles wrap (break-words needed?) | OK | ⚠️ LOW |
| 375–1280+ | Progressively better. OK | OK | OK | OK | ✅ |

### 4.14 `/admin/footer`

| Breakpoint | sq | en | uk | it | Severity |
|-----------|----|----|----|----|----------|
| 320 | Link row `flex items-center gap-2` × 6 items at 272px: inputs ~68px each (cramped) | OK | Long Ukrainian labels ("Використовуйте внутрішні шляхи без префіксу локалі…") in validation warning wraps correctly (`flex flex-col`) | OK | 🔴 HIGH |
| 375 | As 320, slightly more room (~89px per input) | OK | OK | OK | 🔴 HIGH |
| 390 | As 375 (~94px per input) | OK | OK | OK | 🔴 HIGH |
| 768 | Link rows: ~680px available. Inputs >200px each. Functional | OK | OK | OK | ✅ |
| 1280+ | OK | OK | OK | OK | ✅ |

**Issues:** Link rows have 6 flex items in a non-wrapping row. At 320, the label input and URL input each get ~68px — data entry is severely impaired. HIGH severity.

### 4.15 `/admin/settings`

| Breakpoint | Observation | Severity |
|-----------|-------------|----------|
| All | `max-w-3xl` + form tabs + inputs. All locales render fine. | ✅ |

### 4.16 `/admin/permissions`

| Breakpoint | sq | en | uk | it | Severity |
|-----------|----|----|----|----|----------|
| 320 | `grid-cols-[1fr_auto]`: key takes flex-1, toggle is auto. Works at 272px. Groups have section headers. Labels wrap naturally. | OK | Ukrainian permission labels long but wrap | OK | ✅ LOW |
| 375–2560 | OK | OK | OK | OK | ✅ |

---

## 5. Dashboard Sub-Audit

**KPI card grid:**
- `grid-cols-2 sm:grid-cols-3 xl:grid-cols-6`
- Gap: 320–639 = 2 cols; 640–1279 = 3 cols; 1280+ = 6 cols
- **Missing:** No `md:grid-cols-4` between 640 and 1280 → at 768 (tablet), admin sees only 3 large KPI cards per row with generous whitespace. Not broken but inefficient. MEDIUM.
- StatCard has icon `h-11 w-11` + number `text-2xl font-bold` + label `break-words min-w-0`. At 320 with 2 cols (~136px per card), icon + number + label must share ~80px height. Functional but tight.

**Recent listings panel:**
- `grid grid-cols-1 lg:grid-cols-2` — single column 320–1023. 
- `AdminDashboardRecentListings` renders a list of recent listing rows. `overflow-hidden` on the panel container. Rows have `truncate` on title. At 320, listing title truncates after ~20 chars — acceptable (tap to view detail).

**Location requests panel:**
- Conditional — only shown when > 0. `flex items-center gap-3` rows. At 320: MapPin (14px) + gap + text `flex-1 min-w-0 truncate`. Fine.

**Listing status breakdown:**
- `StatusBar` with `w-28 shrink-0` label. At 320: 272 - 112 - 56 - 36 = 68px for progress bar. Narrow but functional.

**Overall dashboard severity at narrow:** MEDIUM — functional but KPI grid only 2 columns, some label wrapping.

---

## 6. Header / Action-Row Sub-Audit

| Route | Header component | Action button | 320 behavior | Severity |
|-------|-----------------|---------------|-------------|----------|
| All | `AdminPageHeader` — `flex items-start justify-between gap-4 mb-6` | If `action` prop passed | Title `text-2xl font-bold` may wrap; action button pushed right | ⚠️ MEDIUM |
| `/admin/listings` | AdminPageHeader (`max-w-10xl` via page wrapper) | Subtitle only | Subtitle `text-sm` wraps cleanly | ✅ |
| `/admin/locations` | AdminPageHeader | "Add location" Button | At 320, title "Vendndodhje / Населені пункти" + action button in same flex row — wraps if combined text too long | ⚠️ MEDIUM |
| `/admin/companies` | AdminPageHeader | "New company" Button | Long locales: long title + button in one row — potential overlap at 320 | ⚠️ MEDIUM |
| Filter bars | Route-specific toolbars | Create/Add buttons | `ml-auto` in `flex-wrap` context loses effect when toolbar wraps to multiple rows | ⚠️ MEDIUM |

**Owner-confirmed issue:** Header/action buttons clip in production. Code analysis confirms `flex items-start justify-between` — at 320, if the title is long (Ukrainian/Albanian) and the action button is wide, both compete for the same row. `items-start` does not allow wrapping — they will squeeze. This is a MEDIUM–HIGH finding depending on specific locale + route combination.

---

## 7. Filter / Tab / Button Consistency Sub-Audit

This sub-audit identifies input inconsistencies for Task 304 spec.

| Pattern | Routes using it | Notes |
|---------|----------------|-------|
| `size="tab"` Button bar in `bg-muted rounded-xl p-1` | `/admin/listings` (All/Premium), `/admin/users` (All/Verified) | Canonical tab pattern from Task 296 — used on some routes |
| Raw `Button` ghost pills in `flex gap-1.5 flex-wrap` | `/admin/support`, `/admin/reports`, `/admin/inquiries/*` | Different visual style from `size="tab"` pattern |
| `Combobox variant="button"` filter | `/admin/listings` (status), `/admin/support` (ticket/complaint type) | Combobox-style dropdowns |
| Raw `Button` ghost for status filter | `/admin/support` (status), `/admin/reports` (status) | Button pills, not Combobox |
| Search input with AdminSearchInput | `/admin/listings`, `/admin/companies`, `/admin/property-types` | Shared component |
| Search input with plain Input | `/admin/email-templates` | Different component |
| Type filter buttons before status filter | `/admin/support` | Two filter rows stacked |
| Status filter only | `/admin/reports`, `/admin/inquiries/*` | Single filter row |

**Inconsistency summary for Task 304:**
1. Tab bar style: some routes use canonical `size="tab"` in `bg-muted` container; others use ghost pills directly.
2. Status filter: some routes use ghost Button pills; others would benefit from Combobox.
3. Search component: `AdminSearchInput` vs plain `Input` — inconsistent.
4. Create button placement: `ml-auto` in flex-wrap context behaves differently than intended at narrow widths.

---

## 8. Record-Separation / Card-Divider Sub-Audit

| Route | Separator method | Narrow behavior | Issue |
|-------|-----------------|----------------|-------|
| `/admin/listings` | `tbody.divide-y` (divider between rows) | ✅ rows are separated | OK |
| `/admin/users` | `divide-y` | ✅ | OK |
| `/admin/support` | `tbody.divide-y` | ✅ | OK |
| `/admin/inquiries/*` | `divide-y` card list | ✅ | OK |
| `/admin/reports` | `divide-y` | ✅ | OK |
| `/admin/email-templates` | `flex flex-col gap-2` card list | Cards separated by gap | OK |
| `/admin/footer` | Link rows: `rounded-lg border bg-muted/20` per row | ✅ each link row has border | OK |
| `/admin/permissions` | `divide-y` matrix | ✅ | OK |

**No critical record-merge issues found.** Owner's confirmed QA note about "records merge without separators" — existing code shows `divide-y` or `gap-2` used consistently. The visual problem may be in card-row fallback rendering at narrow (where no card-row fallback exists yet — the tables clip instead of converting). Once Phase 2 card-row primitives are built, records will be separated by card borders.

---

## 9. Localization Visual QA Notes

| Route | UK observation | SQ observation | Notable |
|-------|---------------|---------------|---------|
| `/admin` | `break-words min-w-0` on StatCard labels — Ukrainian wraps correctly | SQ shorter, wraps less | StatusBar `w-28` label: "Неактивний" (11 chars) fits |
| `/admin/listings` | `truncate max-w-[200px]` on listing title — Ukrainian truncates after ~20 chars. Clicking opens detail. Acceptable | OK | |
| `/admin/users` | Long Ukrainian display names wrap in User cell | SQ names shorter | |
| `/admin/support` | Status filter buttons: "Відкритий / В роботі / Вирішений / Закритий" — all fit as button labels | Albanian: "I hapur / Në progres" — fit | UK longest at 320 |
| `/admin/footer` | Warning text "Виберіть тип тікету, щоб розпочати" wraps in `flex-col gap-0.5` | OK | Link row inputs most impacted by length |
| `/admin/locations` | Ukrainian location names may exceed truncation width | SQ names similar length | `overflow-hidden` risk |
| AdminPageHeader | Ukrainian h1 `text-2xl font-bold` — "Внутрішні тікети" (16 chars) fits. "Налаштування сайту" — longer | SQ "Tiketa të brendshme" — fits | Critical concern: long title + action button in same row |

---

## 10. Severity Summary

| Route | CRITICAL | HIGH | MEDIUM | LOW |
|-------|---------|------|--------|-----|
| `/admin` (Dashboard) | 0 | 0 | 3 | 0 |
| `/admin/listings` | 0 | 0 | 3 | 1 |
| `/admin/users` | 0 | 2 | 2 | 0 |
| `/admin/support` | 0 | 0 | 4 | 1 |
| `/admin/inquiries/*` | 0 | 0 | 0 | 0 |
| `/admin/reports` | 0 | 0 | 2 | 0 |
| `/admin/locations` | 0 | 0 | 2 | 0 |
| `/admin/popular-locations` | 0 | 0 | 0 | 1 |
| `/admin/companies` | 0 | 0 | 2 | 0 |
| `/admin/property-types` | 0 | 0 | 2 | 0 |
| `/admin/currency` | 0 | 2 | 1 | 0 |
| `/admin/email-templates` | 0 | 0 | 1 | 1 |
| `/admin/legal` | 0 | 0 | 0 | 1 |
| `/admin/footer` | 0 | 3 | 0 | 0 |
| `/admin/settings` | 0 | 0 | 0 | 0 |
| `/admin/permissions` | 0 | 0 | 0 | 1 |
| **TOTAL** | **0** | **7** | **22** | **6** |

### Top HIGH severity findings

1. `/admin/users` All Users tab — `overflow-hidden` instead of `overflow-x-auto` (risk of clipping at narrow when columns visible)
2. `/admin/users` verify toggle — `h-6 w-6` = 24×24px, below 44px touch target requirement
3. `/admin/currency` (both tabs) — `overflow-hidden` on tables with 5–7 columns; clips at narrow
4. `/admin/footer` link rows × 3 — `flex items-center gap-2` with 6 items; inputs ~68px each at 320; data entry impaired
5. `/admin/footer` link row URL validation warning — already fixed (Task 324 added `flex flex-col gap-1` wrapper)
6. Header/action-row conflict — long localized page titles + action button compete in `flex items-start justify-between` at 320 (affects `/admin/locations`, `/admin/companies`, and any route with action button)
7. `ml-auto` Create button in `flex-wrap` toolbar — loses alignment when toolbar wraps (affects `/admin/support`, `/admin/reports`)

---

## 11. Task 304 Input (Filter/Sort/Row-Action Patterns)

Confirmed inconsistencies for Task 304 to resolve:

1. **Tab bar:** canonical `size="tab"` in `bg-muted rounded-xl p-1 w-full md:w-fit` used on `/admin/listings` and `/admin/users`; NOT used on `/admin/support`, `/admin/reports`, `/admin/inquiries/*` which use raw ghost Button pills.
2. **Status filter:** Button pills on `/admin/support` and `/admin/reports`; Combobox on `/admin/listings`. No canonical rule.
3. **Search:** `AdminSearchInput` (dedicated component) on some routes; plain `Input` on others. No canonical rule.
4. **Create/Add button:** sometimes as `action` prop on `AdminPageHeader`; sometimes inline in toolbar with `ml-auto`. Inconsistent placement and wrapping behavior.
5. **Row actions:** some routes inline delete in row cell; others use dialog actions. No canonical row-action placement rule.

---

## 12. Task 305 Input (Modal/Dialog Patterns)

Confirmed modal usage per route:

| Route | Modal type | Size | Mobile usability |
|-------|-----------|------|-----------------|
| `/admin/listings` | Dialog (`ListingPreviewDialog`) | `sm:max-w-2xl` | `max-h-[90vh] overflow-y-auto` ✅ |
| `/admin/users` | Navigation to `/admin/users/[id]` (not modal) | N/A | ✅ |
| `/admin/support` | Dialog (`TicketDetailDialog`, `CreateTicketDialog`) | `max-w-2xl` / `max-w-lg` | `overflow-y-auto` ✅ |
| `/admin/inquiries/*` | Dialog (full thread view) | varies | ✅ |
| `/admin/reports` | Dialog (`ReportDetailDialog`) | varies | check |
| `/admin/locations` | Dialog / Sheet (`LocationModal`) | `max-w-2xl` | ✅ |
| `/admin/companies` | Dialog (`CompanyFormDialog`) | `max-w-lg` | ✅ |
| `/admin/property-types` | Dialog (`PropertyTypeFormDialog`) | `max-w-2xl` | ✅ |
| `/admin/currency` | Custom modal div | `max-w-lg max-h-[90vh] overflow-y-auto` | ✅ |
| `/admin/email-templates` | Dialog (`TemplateEditorDialog`) | `sm:max-w-2xl` | ✅ |
| `/admin/legal` | Dialog (edit/confirm delete) | varies | ✅ |
| `/admin/footer` | No modal | N/A | N/A |

---

## Appendix A: Files Read

- `src/app/admin/page.tsx`
- `src/app/admin/layout.tsx`
- `src/components/admin/AdminShell.tsx`
- `src/components/admin/AdminSidebar.tsx`
- `src/components/admin/AdminMobileHeader.tsx`
- `src/components/admin/AdminPageHeader.tsx`
- `src/components/admin/AdminListingsTable.tsx`
- `src/components/admin/AdminUsersTable.tsx`
- `src/components/admin/AdminSupportManager.tsx`
- `src/components/admin/AdminInquiriesManager.tsx`
- `src/components/admin/AdminReportsManager.tsx`
- `src/components/admin/AdminLocationsManager.tsx`
- `src/components/admin/AdminPopularLocationsManager.tsx`
- `src/components/admin/AdminCompaniesManager.tsx`
- `src/components/admin/AdminPropertyTypesManager.tsx`
- `src/components/admin/AdminCurrencyTabs.tsx`
- `src/components/admin/AdminCurrenciesManager.tsx`
- `src/components/admin/AdminExchangeProvidersManager.tsx`
- `src/components/admin/AdminEmailTemplatesManager.tsx`
- `src/components/admin/AdminLegalManager.tsx`
- `src/components/admin/AdminFooterManager.tsx`
- `src/components/admin/AdminSettings.tsx`
- `src/components/admin/AdminPermissionsManager.tsx`
- All 18 admin `page.tsx` files
