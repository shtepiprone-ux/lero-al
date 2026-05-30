# Task 301 — Admin narrow-breakpoint label clipping fix (AdminListingsTable + AdminUsersTable)

**Date:** 2026-05-30  
**Executor:** Claude Code Sonnet 4.6  
**Task type:** bugfix (responsive, admin-only)

---

## Investigation

**Task 296 baseline confirmed:**
```
AdminListingsTable.tsx:467:  size="tab"
AdminUsersTable.tsx:100:     size="tab"
AdminSettings.tsx:129:       size="tab"
```
`Button size="tab"` untouched. ✅

**Current container classNames:**

| Surface | Container className | 320 result |
|---------|---------------------|-----------|
| AdminListingsTable | `flex gap-1 bg-muted rounded-xl p-1 w-fit` | ❌ clips "Premium listings" / "⭐ Njoftime Premium" etc. |
| AdminUsersTable | `flex gap-1 bg-muted rounded-xl p-1 w-fit` | ❌ clips "Verified agents" / "✓ Agjentë të verifikuar" etc. |
| AdminSettings | `flex gap-1 bg-muted rounded-xl p-1 flex-wrap` | ✅ PASS (5 tabs, existing flex-wrap) |

**Root cause:** `w-fit` constrains the container to its max-content width. Both tabs have `whitespace-nowrap` (from Button base), so their min-content = full label width. At 320px, the combined width (tab1 + gap + tab2) exceeds the viewport → container clipped.

**Strategy chosen: A1 (approved by orchestrator 2026-05-30)**
`flex flex-wrap md:flex-nowrap gap-1 bg-muted rounded-xl p-1 w-full md:w-fit`
- <768px: `w-full` + `flex-wrap` → full-width control, tabs wrap to second line
- 768+: `md:flex-nowrap` + `md:w-fit` → single-row tight pill (identical to Task 296 APPROVED state)

**Header/action area clipping:** The tab container clipping is the primary visible issue. The header/action area buttons at 320px clip independently due to the broader admin mobile layout (no `overflow-x-auto` on the page shell). This is unrelated to the tab pattern — the tab container is a `flex flex-col` child, not an ancestor. **Deferred to Epic HH / Admin UX System as documented in Task 299 evaluation.**

---

## Note 22 inventory (BEFORE edit)

**AdminListingsTable:**
- Segmented tabs: `all listings` / `⭐ Premium listings` — click navigates `?tab=` URL param ✅
- Filter row: AdminSearchInput + Combobox status filter ✅
- Table: ID / Listing / Type / Price / Status / Agent / Date columns ✅
- Row actions: Edit (link), Trash (delete), Star (premium toggle), Copy ID ✅
- Pagination ✅
- Empty/loading states ✅

**AdminUsersTable:**
- Segmented tabs: `all users` / `✓ Verified agents` — click navigates `?tab=` URL param ✅
- Filter rows: role chips + status chips + AdminSearchInput ✅
- Verified agents sub-table (separate layout when `activeTab === 'verified'`) ✅
- Table: User / Role / Status / Phone / Date columns ✅
- Row actions: inline verify toggle ✅
- Pagination ✅
- Empty/loading states ✅

**AFTER edit:** Only the tab container `className` changed. All controls, row actions, filters, columns — byte-identical. ✅

---

## Changes

**AdminListingsTable.tsx** BEFORE → AFTER:
```diff
- <div className="flex gap-1 bg-muted rounded-xl p-1 w-fit">
+ <div className="flex flex-wrap md:flex-nowrap gap-1 bg-muted rounded-xl p-1 w-full md:w-fit">
```

**AdminUsersTable.tsx** BEFORE → AFTER:
```diff
- <div className="flex gap-1 bg-muted rounded-xl p-1 w-fit">
+ <div className="flex flex-wrap md:flex-nowrap gap-1 bg-muted rounded-xl p-1 w-full md:w-fit">
```

---

## Locale label inventory (for 320px verification)

**AdminListingsTable (tab_all / tab_premium):**

| Locale | Tab 1 | Tab 2 (longest) |
|--------|-------|-----------------|
| sq | Të gjitha njoftimet | ⭐ Njoftime Premium |
| en | All listings | ⭐ Premium listings |
| uk | Всі оголошення | ⭐ Преміум оголошення |
| it | Tutti gli annunci | ⭐ Annunci Premium |

**AdminUsersTable (tab_all / tab_verified):**

| Locale | Tab 1 | Tab 2 (longest) |
|--------|-------|-----------------|
| sq | Të gjithë përdoruesit | ✓ Agjentë të verifikuar |
| en | All users | ✓ Verified agents |
| uk | Всі користувачі | ✓ Верифіковані агенти |
| it | Tutti gli utenti | ✓ Agenti verificati |

At 320px with `w-full md:w-fit flex-wrap md:flex-nowrap`: the container is full viewport width; each tab has `whitespace-nowrap` so it renders full-width on its own row. No clipping for any label in any locale. ✅ (Code-level analysis — owner browser verification required.)

---

## Files Changed table (Task 264)

| Path | Change | Rationale |
|------|--------|-----------|
| `src/components/admin/AdminListingsTable.tsx` | `w-fit` → `w-full md:w-fit`; added `flex-wrap md:flex-nowrap` | Fix narrow-breakpoint tab label clipping (Strategy A1) |
| `src/components/admin/AdminUsersTable.tsx` | Same | Same |
| `docs/tailwind-canonical-fragments.md` | §14 responsive-wrap rule added (one paragraph) | Document canonical 2-tab responsive container rule |
| `docs/sessions/2026-05-30-task-301-admin-tab-narrow-breakpoint.md` | This file | Session log |
| `docs/backlog.md` | Updated | Clause 10 |

**NOT touched:** `button.tsx` (size="tab" intact) · `AdminSettings.tsx` (already PASS) · `tailwind-entropy.allowlist.json` · any locale file · any row action/filter/column · `AdminInquiriesManager` / `AdminReportsManager` / `AdminSupportManager`

---

## AC self-audit table

| AC | Status | Evidence |
|----|--------|---------|
| Tab bar container className changed (Strategy A1) | ✅ | `w-fit` → `w-full md:w-fit`; `flex-wrap md:flex-nowrap` added to both files |
| 768/1280/1440/2560 single-row pill preserved | ✅ | `md:flex-nowrap md:w-fit` — no regression at wide viewports |
| AdminSettings unchanged | ✅ | Not touched |
| `Button size="tab"` unchanged | ✅ | Not touched |
| No new locale keys | ✅ | Strategy A1, no copy change |
| No row action / filter / column change | ✅ | Only container className changed |
| `npx tsc --noEmit` → 0 | ✅ | Empty output |
| `npm run build` → passes | ✅ | Build completed |
| `npm run lint` → 0/0 | ✅ | Empty output |
| `governance:tailwind` → C0/H0/M0 | ✅ | No regression |
| §14 canonical-fragments updated | ✅ | Responsive-wrap rule documented |
| Owner broader mobile QA | ❌ | FAIL — see "Owner QA result" section below |

---

## Owner QA result — broader admin mobile UX FAIL (2026-05-30)

Owner browser QA after the tab-container patch confirmed the narrow-patch was applied but found the broader admin mobile UX is unacceptable across many surfaces:

1. **Header/action buttons** — clipped at 320px (confirmed by owner screenshots; unrelated to tab container)
2. **Admin Dashboard cards** — visually broken at narrow widths: narrow columns, broken labels, poor grid, unreadable layout
3. **Tables not adapted to mobile** — several surfaces still show squeezed tables or uncontrolled horizontal clipping; records do not read as separate items; divider/spacing/card separation insufficient
4. **Support / Internal Tickets rows** — need clearer visual separation (divider, spacing, or separate card blocks)
5. **Inconsistent mobile patterns** — some cards, some clipped tables, some squeezed controls across admin pages
6. **Email Templates** — mixed/incorrect localization visible at narrow widths (current parity checks did not catch semantic locale errors)

**Scope clarification:** Task 301's narrow tab-container patch (`w-full md:w-fit flex-wrap md:flex-nowrap`) is correctly implemented and addresses the specific symptom filed in the Task 296 browser-verify FAIL. It does not and should not address the broader admin mobile system. The broader issues listed above are Epic HH Phase 1–3 work (Tasks 303–309), not Task 301 scope.

**Task 301 verdict: HOLD / APPROVE-with-major-follow-up.** The narrow patch is correct and narrow-scoped. Owner may either:
- (a) Commit the Task 301 patch as a partial improvement and let Epic HH Phase 1 handle the rest, OR
- (b) Hold Task 301 uncommitted until Epic HH Phase 1 produces a canonical model to avoid repeated partial fixes.

Owner screenshots from 2026-05-30 are the primary evidence input for Epic HH Task 303 (per-route mobile failure matrix). See Epic HH note added 2026-05-30.

## Self-validation verdict

`Self-validation: tsc=0 · build=passes · lint=0/0 · governance:tailwind=C0/H0/M0 · Strategy A1 applied · tab patch = technically correct · owner broader mobile QA = FAIL · Epic HH Phase 1–3 must address admin mobile system · HOLD pending owner commit decision`
