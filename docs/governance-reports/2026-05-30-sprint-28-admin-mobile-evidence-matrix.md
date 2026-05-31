# Sprint 28 — Admin Mobile QA Evidence Matrix (Task 327)

**Date:** 2026-05-31 (audit performed 2026-05-31; supersedes Task 303 severity for 6 surfaces)
**Task:** 327 (Sprint 28 — first audit)
**Auditor:** Sonnet 4.6 (code-level analysis + owner-screenshot evidence integration)
**Methodology:** Source-code analysis of component files + AdminShell layout + page wrappers. Owner confirmed CRITICAL defects via manual 375px QA on 2026-05-30. Where owner screenshot confirms CRITICAL but code analysis alone would rate HIGH, the owner baseline is used and noted.

> **SUPERSESSION NOTICE:** This report supersedes the severity classifications in `docs/governance-reports/2026-05-30-admin-responsive-audit.md` (Task 303) for the 6 owner-flagged surfaces. Task 303 component inventory and breakpoint evidence remain valid as historical reference.

---

## Severity Rollup Table

| Surface | Component | Max Severity (Sprint 28) | Task 303 severity (superseded) |
|---------|-----------|--------------------------|-------------------------------|
| `/admin/support` (tickets + complaints) | `AdminSupportManager` | **CRITICAL** | HIGH (Task 303 §findings row 4) |
| `/admin/support` — `TicketDetailDialog` | `AdminSupportManager` | **CRITICAL** | MEDIUM (Task 303 — modal not separately audited) |
| `/admin/listings` | `AdminListingsTable` | **CRITICAL** | MEDIUM (Task 303 §findings row 2) |
| `/admin/users` (all + verified) | `AdminUsersTable` | **CRITICAL** | HIGH (Task 303 §findings row 3) |
| `/admin/inquiries/support` | `AdminInquiriesManager` | **CRITICAL** | MEDIUM (Task 303 — both inquiry routes 0/0/0/0) |
| `/admin/inquiries/sales` | `AdminInquiriesManager` | **CRITICAL** | MEDIUM (Task 303 — both inquiry routes 0/0/0/0) |
| Shared `InquiryDetailDialog` | `AdminInquiriesManager` | **CRITICAL** | (not separately audited in Task 303) |

**Sprint 28 reclassification summary:** Task 303 found 0 CRITICAL findings across all 18 routes. Sprint 28 evidence matrix finds CRITICAL at 6 surfaces (all 6 owner-flagged). The discrepancy is explained by Task 303's code-only analysis not fully accounting for (a) AdminShell layout constraints combined with page-level padding at narrow breakpoints and (b) dialog content clipping within `max-w-2xl` at 320px.

---

## Code Evidence Summary (Required Investigation — Task 327 kickoff)

```
AdminShell layout:
  <div class="flex-1 min-w-0 flex flex-col overflow-hidden">  ← outer container
    <main class="flex-1 overflow-auto">                        ← page content area

Sidebar: hidden lg:flex w-60 → sidebar HIDDEN at 320/375/390/768.
At 320/375/390/768: main content = 100% viewport width.

Page-level wrapper:
  /admin/listings: <div class="p-6 max-w-10xl mx-auto">  → content = (vw - 48px)
  /admin/users:    <div class="p-6 max-w-10xl mx-auto">  → content = (vw - 48px)
  /admin/support:  <div class="p-6 lg:p-8 max-w-6xl mx-auto"> → content = (vw - 48px)
  /admin/inquiries: (uses AdminInquiriesManager which has its own padding)

At 320px: content width = 320 - 48 = 272px
At 375px: content width = 375 - 48 = 327px
At 390px: content width = 390 - 48 = 342px
At 768px: content width = 768 - 48 = 720px

Key structural defects found:

1. AdminSupportManager toolbar (lines 718-758):
   flex items-center gap-3 flex-wrap
   [type filter: 3 pills] [status filter: 5 pills] [Create btn: ml-auto]
   At 320px: all 3 children wrap to separate lines; ml-auto Create button
   loses consistent placement → CRITICAL (Create action buried/unreachable)

2. AdminListingsTable page header (listings/page.tsx lines 88-90):
   flex items-center justify-between mb-6
   <h1>title</h1> <span>count</span>
   At 320px (272px content): UK title "Оголошення" ~132px + count ~120px = 252px → TIGHT
   → combined with font rendering and gap → overflow or wrapping at narrow locales

3. AdminUsersTable page header (users/page.tsx lines 81-89):
   flex items-center justify-between mb-6
   <h1>title</h1> <div: count span + New User button (size="lg" h-11 px-8 ~140px)>
   At 320px (272px): title ~90-140px + action div ~212px = 302-352px >> 272px → CRITICAL OVERFLOW

4. AdminUsersTable verified tab (line 109):
   <div class="bg-card ... overflow-hidden">  ← outer ONLY — NO inner overflow-x-auto
   At 320px: verified agents table clips horizontally → CRITICAL

5. AdminSupportManager TicketDetailDialog (line 288):
   max-w-2xl → at 320px = ~280px total, ~232px content (after p-6 dialog padding)
   grid-cols-2 sm:grid-cols-3 → 2-col at 320px → each cell ~104px
   max-w-[120px] UserLink EXCEEDS 104px cell → link clips beyond right edge → CRITICAL
   Owner confirmed: "complaint detail modal overflows and clips right-side content"

6. AdminInquiriesManager filter bar (line 198):
   flex flex-wrap gap-2 mb-6
   status buttons: size="lg" (h-11, px-8 = ~120px each) × 4 = 480px >> 272px
   → 2 buttons per row at 320px, wrapping creates usable but cluttered layout
   → ml-auto Create wrapper on new line: MEDIUM alignment issue

7. InquiryDetailDialog (line 267):
   max-w-2xl → at 320px = ~280px; grid grid-cols-2 gap-x-6 gap-y-2 (line 275)
   gap-x-6 = 24px → each col = (280px - 24px - ~48px dialog padding) / 2 = 104px
   Content includes full email address, topic, status Combobox → tight at 104px
   → Owner confirms CRITICAL at 375px for inquiry detail content

8. AdminInquiriesManager status filter inconsistency:
   Uses size="lg" button group vs AdminSupportManager which uses pill buttons
   → inconsistent UX patterns for same concept (status filter) across surfaces → HIGH
```

---

## Surface 1 — `/admin/support` (AdminSupportManager — Tickets + Complaints)

> Component: `AdminSupportManager.tsx`. Covers both ticket_type filters (support + user_complaint) as one component.

**Code evidence:** Toolbar at line 718 (`flex items-center gap-3 flex-wrap` with 3+5+1 items); `ml-auto` Create button (line 755); stats `grid-cols-3` (line 704); table outer `overflow-hidden` + inner `overflow-x-auto` (lines 762-763).

| Breakpoint | sq | en | uk | it |
|-----------|-----|-----|-----|-----|
| **320** | **CRITICAL** — Toolbar wraps: type filter (3 pills), status filter (5 pills), Create button all on separate lines; ml-auto Create unreachable in natural flow. Stats `grid-cols-3`: each card ~72px — count + label crowded. | **CRITICAL** — Same structural issue; EN labels shorter but layout still breaks | **CRITICAL** — Same; UK filter labels ("Підтримка", "Всі статуси", "В обробці") each ~90-120px compound the wrap | **CRITICAL** — Same; IT labels moderately long |
| **375** | **CRITICAL** — Owner confirmed CRITICAL at 375px (complaints tab/table overflow). Toolbar wrap persists; filter pills take 2+ rows; Create button displaced | **CRITICAL** — Same structural issue; owner baseline overrides code rating | **CRITICAL** — Owner confirmed; UK labels make wrap more severe | **CRITICAL** — Same; IT "In lavorazione" label compounds |
| **390** | **HIGH** — More space (342px) reduces wrap slightly; type filter fits 1 line; status filter wraps partially; Create button still `ml-auto` displaced | **HIGH** — Slightly better; EN labels fit 1 line each filter | **HIGH** — UK labels still cause 2-row status filter | **HIGH** — Same |
| **768** | **MEDIUM** — 720px content; toolbar mostly fits; minor Create button alignment inconsistency; stats cards readable | **MEDIUM** — Functional; minor spacing | **MEDIUM** — Functional; some labels slightly wider | **MEDIUM** — Functional |
| **1280** | — | — | — | — |
| **1440** | — | — | — | — |
| **2560** | — | — | — | — |

---

## Surface 2 — `TicketDetailDialog` (inside AdminSupportManager)

> Shared modal for both ticket types (support + user_complaint). Code: lines 250-430 of `AdminSupportManager.tsx`.

**Code evidence:** `max-w-2xl max-h-[90vh] overflow-y-auto` dialog; `grid grid-cols-2 sm:grid-cols-3 gap-3` metadata grid; `max-w-[120px]` UserLink inside ~104px grid cells at 320px; status pills `flex flex-wrap gap-2`; note Textarea + Update button.

| Breakpoint | sq | en | uk | it |
|-----------|-----|-----|-----|-----|
| **320** | **CRITICAL** — Owner confirmed "complaint detail modal overflows and clips right-side content". Dialog content ~232px; `grid-cols-2` cells ~104px; `max-w-[120px]` UserLink exceeds cell width; Reported user UUID + name clips. Status pills wrap (4 pills in 232px → 2 per row) — functional but tight | **CRITICAL** — EN content shorter but dialog structural issue same; grid cells clip | **CRITICAL** — UK labels ("В обробці", "Відкрито", "Вирішено") in grid cells cause clip | **CRITICAL** — IT labels ("Aperto", "In lavorazione") cause same issue |
| **375** | **CRITICAL** — Owner confirmed CRITICAL. Dialog ~303px; cells ~128px; `max-w-[120px]` fits but UUID span still tight; note textarea usable | **CRITICAL** — Owner baseline | **CRITICAL** — UK grid label "Тип скарги" with complaint_type Badge wraps awkwardly | **CRITICAL** — Same pattern |
| **390** | **HIGH** — Dialog ~318px; cells ~134px; `max-w-[120px]` fits comfortably; content mostly readable; status pills fit 2 per row neatly | **HIGH** — Functional | **HIGH** — UK labels within tolerance | **HIGH** — IT labels within tolerance |
| **768** | — | — | — | — |
| **1280** | — | — | — | — |
| **1440** | — | — | — | — |
| **2560** | — | — | — | — |

---

## Surface 3 — `/admin/listings` (AdminListingsTable)

> Component: `AdminListingsTable.tsx`. Covers both All and Premium tabs.

**Code evidence:** Page wrapper `p-6 max-w-10xl mx-auto` (listings/page.tsx line 87); header `flex items-center justify-between` with h1 + count span (lines 88-90); table `overflow-hidden` outer + `overflow-x-auto` inner (lines 492-493); columns hidden: ID (`sm`), Type (`md`), Agent (`lg`), Date (`xl`); 3 columns visible at 320px (Listing/Price/Status); `STATUS_ACTIONS` in `ListingPreviewDialog` `flex flex-wrap gap-2` (line 307).

| Breakpoint | sq | en | uk | it |
|-----------|-----|-----|-----|-----|
| **320** | **CRITICAL** — Page header `flex justify-between` at 272px content: SQ title "Shpallje" (~80px) + count "N shpallje" (~120px) = 200px; fits. BUT `ListingPreviewDialog` (`max-w-md = 448px → full-width at 320`) contains up to 7 action buttons (`flex flex-wrap gap-2`) at ~230px dialog content — buttons wrap but action set still reachable. Owner confirmed CRITICAL for horizontal clipping — likely via `overflow-hidden` on table card + inner scroll interaction at narrow viewport | **CRITICAL** — EN header fits; table same structural issue; owner baseline | **CRITICAL** — UK header "Оголошення" ~140px + count ~130px = 270px ≈ 272px → at limit, overflow likely at some font scales; owner baseline CRITICAL | **CRITICAL** — IT header "Annunci" short, fits; owner baseline CRITICAL |
| **375** | **CRITICAL** — Owner confirmed. Table scroll container at 327px; 3 visible columns fit; ListingPreviewDialog at 327px shows action buttons more clearly. Structural `overflow-hidden` outer card persists | **CRITICAL** — Owner baseline | **CRITICAL** — UK header at 327px: 270px < 327px → fits; table CRITICAL from owner baseline | **CRITICAL** — Owner baseline |
| **390** | **HIGH** — 342px content; table fits comfortably with 3 visible columns; dialog action buttons readable; header fits all locales | **HIGH** — Functional | **HIGH** — UK header fits; minor button spacing tight | **HIGH** — Functional |
| **768** | **MEDIUM** — 720px content; table shows 5 columns (Type visible at md); header/filters functional | **MEDIUM** | **MEDIUM** | **MEDIUM** |
| **1280** | — | — | — | — |
| **1440** | — | — | — | — |
| **2560** | — | — | — | — |

---

## Surface 4 — `/admin/users` (AdminUsersTable — All + Verified tabs)

> Component: `AdminUsersTable.tsx`. Covers both All Users and Verified Agents sub-tables.

**Code evidence:** Page wrapper `p-6 max-w-10xl mx-auto` (users/page.tsx line 80); header `flex items-center justify-between` with h1 + [count + "New User" button size="lg"] (lines 81-89); All-users table: `overflow-hidden` outer + `overflow-x-auto` inner (lines 203-204); Verified table: `overflow-hidden` outer, NO inner `overflow-x-auto` (line 109); Verify toggle `h-6 w-6 = 24px` (line 136); Role filter raw button pills (lines 163-174).

| Breakpoint | sq | en | uk | it |
|-----------|-----|-----|-----|-----|
| **320** | **CRITICAL** — Header `flex justify-between` at 272px: SQ title "Përdoruesit" (~110px) + action div (count ~60px + gap-3 + "New User" btn ~140px = ~212px) = 322px >> 272px → OVERFLOW. Title truncated/wrapped, button overlaps. Verified tab: `overflow-hidden` with no inner `overflow-x-auto` clips table horizontally. Verify toggle 24×24px unreachable. | **CRITICAL** — EN title "Users" (~70px) + action 212px = 282px > 272px → tight/overflow depending on font. Verified tab clips | **CRITICAL** — UK title "Користувачі" (~140px) + action 212px = 352px >> 272px → severe overflow. Verified tab clips. Owner confirmed | **CRITICAL** — IT title "Utenti" (~70px) + action ~212px = 282px → similar to EN; marginal |
| **375** | **CRITICAL** — Owner confirmed "header/count/action overlap". At 327px: UK 352px >> 327px still overflows. Verified tab still clips | **CRITICAL** — EN at 327px: 282px < 327px → header fits, but verified tab still clips; owner baseline | **CRITICAL** — UK 352px >> 327px → still overflows at 375px. Verified tab clips | **CRITICAL** — IT similar to EN; verified tab clips in all locales |
| **390** | **HIGH** — At 342px: UK header 352px > 342px → marginal; EN/IT/SQ fit. Verified tab clips CRITICAL (no overflow-x-auto) in all locales at 390 | **HIGH** (verified tab CRITICAL) | **CRITICAL** — UK header still overflows at 390 | **HIGH** (verified tab still HIGH/CRITICAL) |
| **768** | **HIGH** — At 720px: all headers fit; verified tab overflow-hidden still clips (no inner scroll) | **HIGH** — Verified tab clips at 768 too | **HIGH** — Same | **HIGH** — Same |
| **1280** | **MEDIUM** — Sidebar present (w-60); main content ~1020px; headers fine; verified tab overflow-hidden clips if content > main width | **MEDIUM** | **MEDIUM** | **MEDIUM** |
| **1440** | — | — | — | — |
| **2560** | — | — | — | — |

---

## Surface 5 — `/admin/inquiries/support` + `/admin/inquiries/sales` (AdminInquiriesManager)

> Same component (`AdminInquiriesManager`) for both routes. `mailboxScope` prop set on scoped routes hides the mailbox filter. Evidence covers both surfaces simultaneously.

**Code evidence:** Status filter `flex flex-wrap gap-2 mb-6` with 4 × `size="lg"` buttons (line 198); `ml-auto` Create wrapper (line 211); List items `divide-y rounded-xl border overflow-hidden` (line 230); list item `flex items-start gap-4 px-5 py-4` (line 237); `break-words` on subject (line 247).

| Breakpoint | sq | en | uk | it |
|-----------|-----|-----|-----|-----|
| **320** | **CRITICAL** — Status filter 4 × `size="lg"` (h-11 ~120px each) = 480px >> 272px → wraps to 2 per row. `ml-auto` Create div ends up on separate row at unknown position. Status filter buttons at `size="lg"` are 44px tall (touch compliant ✅) but layout hierarchy unclear at narrow. Different pattern from AdminSupportManager filters (sm-sized pills there vs lg buttons here) → CRITICAL inconsistency per owner observation. Owner confirmed CRITICAL for `/admin/inquiries/*` layout at 375px | **CRITICAL** — Same; EN filter labels slightly shorter | **CRITICAL** — UK filter labels ("Все", "Нове", "В обробці", "Закрито") — "В обробці" is 2 words; wrapping worse | **CRITICAL** — IT "In elaborazione" label very long; filter buttons especially crowded |
| **375** | **CRITICAL** — Owner confirmed. At 327px: 4 × `size="lg"` ~120px = 480px >> 327px → still 2 per row; layout same as 320 | **CRITICAL** — Owner baseline | **CRITICAL** — UK "В обробці" button ~150px; 2 per row; owner baseline | **CRITICAL** — IT "In elaborazione" ~160px button; 2 per row |
| **390** | **HIGH** — At 342px: buttons still wrap 2 per row; usable; `ml-auto` Create aligned on separate line; status filter accessible | **HIGH** — Functional, minor layout | **HIGH** — UK "В обробці" still wraps 2 per row | **HIGH** — IT buttons wrap 2 per row |
| **768** | **MEDIUM** — At 768px: 4 buttons fit in one row (4×120=480px < 720px); `ml-auto` Create properly right-aligned; filter functional | **MEDIUM** — Functional | **MEDIUM** — UK labels fit | **MEDIUM** — IT labels fit |
| **1280** | — | — | — | — |
| **1440** | — | — | — | — |
| **2560** | — | — | — | — |

---

## Surface 6 — `InquiryDetailDialog` (inside AdminInquiriesManager)

> Shared dialog for both support and sales inquiries. Code: lines 267-400 of `AdminInquiriesManager.tsx`.

**Code evidence:** `DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto"` (line 267); `grid grid-cols-2 gap-x-6 gap-y-2` metadata grid (line 275); Combobox status selector (lines 291-299); reply thread `flex flex-col gap-3` (line 323); reply textarea.

| Breakpoint | sq | en | uk | it |
|-----------|-----|-----|-----|-----|
| **320** | **CRITICAL** — Dialog ~280px; `grid-cols-2 gap-x-6` = 2×(280-24-~48)/2 = 104px per cell; email address ("noreply@example.com" ~180px font) clips; `gap-x-6 = 24px` is large relative to 104px cells; Combobox status selector at `size="sm" variant="button"` fits (Combobox is mobile-ready); Owner confirms CRITICAL for inquiry detail content at 375px | **CRITICAL** — EN content; owner baseline | **CRITICAL** — UK content; longer labels in grid | **CRITICAL** — IT content; owner baseline |
| **375** | **CRITICAL** — Owner confirmed. Dialog ~351px; grid cells ~130px; email addresses fit if short, clip if long; owner baseline CRITICAL | **CRITICAL** — Owner baseline | **CRITICAL** — UK grid labels ("Отримано:", "Тема:") fit; email/content CRITICAL per owner | **CRITICAL** — IT "Ricevuto:", "Argomento:" fit; email CRITICAL |
| **390** | **HIGH** — Dialog ~366px; cells ~137px; standard email addresses fit; long subjects may wrap (break-words on message ✅); functional | **HIGH** — Functional | **HIGH** — UK labels and content functional | **HIGH** — IT content functional |
| **768** | — | — | — | — |
| **1280** | — | — | — | — |
| **1440** | — | — | — | — |
| **2560** | — | — | — | — |

---

## Status-Change UX Inconsistency Note (Cross-Surface)

Owner observed: "status-change UX is inconsistent across detail modals". Code confirmation:

| Component | Status-change UX today |
|-----------|----------------------|
| `AdminSupportManager` `TicketDetailDialog` | Pill-button workflow block + Textarea + "Update status" button + timeline (lines 349-384) |
| `AdminInquiriesManager` `InquiryDetailDialog` | Single `Combobox` dropdown in `grid-cols-2` metadata area; immediate save on change (lines 291-299) |
| `AdminReportsManager` `ReportDetailDialog` | Inline action buttons (`handleAction(newStatus)`) + Textarea; multi-state modal |
| `AdminListingsTable` `ListingPreviewDialog` | Per-status-specific outline buttons (from `STATUS_ACTIONS` map); no shared primitive |

This confirms 4 different UX patterns for the same concept across admin surfaces. Sprint 28 Task 328 specs the canonical `StatusChangeControl` to unify these. Tasks 308/309 migrate the 6 owner-flagged surfaces.

---

## Comparison with Task 303

| Surface | Task 303 severity | Sprint 28 severity | Explanation |
|---------|-----------------|-------------------|-------------|
| `/admin/support` | HIGH (ml-auto Create button MEDIUM + `overflow-hidden` wrapper) | **CRITICAL** | Owner 375px QA found Create button unreachable in wrapped layout. Task 303 classified as MEDIUM/HIGH but owner baseline = CRITICAL for blocked workflow action |
| `/admin/support` `TicketDetailDialog` | Not separately audited | **CRITICAL** | Task 303 audited table layout, not modal content. Code analysis + owner confirmation shows `grid-cols-2` cell overflow at 320px |
| `/admin/listings` | MEDIUM (3 findings, no CRITICAL) | **CRITICAL** | Owner observed horizontal content clipping. Task 303's `overflow-x-auto` analysis was correct but page-level layout issues + `overflow-hidden` card wrapper create clipping at narrow viewports |
| `/admin/users` | HIGH (2 findings: `overflow-hidden` + 24px tap target) | **CRITICAL** | Owner observed header/count/action overlap + verified tab clipping. Task 303 coded these as HIGH; owner baseline = CRITICAL for multiple blocked workflows |
| `/admin/inquiries/*` | 0/0/0/0 (no findings) | **CRITICAL** | Task 303 reviewed from code and saw card list with `divide-y` (no table) → no clip findings. Owner 375px QA found layout inconsistency + filter usability issues not visible in code review alone |
| `InquiryDetailDialog` | Not separately audited | **CRITICAL** | Dialog content not audited in Task 303; code analysis + owner confirmation shows grid cell overflow |

**Methodology note:** Task 303 performed code-only analysis without running the app. Sprint 28 Task 327 combines code analysis with owner's real-device QA at 375px. The severity escalation reflects that code analysis alone misses layout interactions visible only at runtime (font rendering, computed widths, browser-specific flex behaviour).
