# Task 306-Fix — Gate G3' corrective: mobile card click + bottom-sheet

**Date:** 2026-05-31  
**Sprint:** 28  
**Type:** bugfix — corrective pass after owner re-QA FAIL on Gate G3'

## Owner-reported failure (Gate G3' FAIL)

- Mobile cards render correctly below 1024px (card layout working)
- **BUT: cards are not clickable** — no tap handler on card rows
- **Sticky bottom popup / bottom sheet does not appear**
- Row actions/details unreachable on mobile widths
- Gate status: FAIL

## Root cause 1 — Missing `onRowClick` prop

`AdminListingsTable` called `<AdminTable cardRow={...}>` **without** `onRowClick`. Since `AdminCardList` guards `onClick={onRowClick ? () => onRowClick(row) : undefined}`, every card rendered with zero click handling. Tapping any card: no response.

**Fix:** Added `onRowClick={l => setPreviewListing(l)}` to `<AdminTable>` call (line 666).

## Root cause 2 — `ListingPreviewDialog` was Dialog-only at all sizes

The approved spec `admin-ux-rules.md §11.2 Decision 5` states:
> "Action-heavy or form-heavy modals → `<Sheet side="bottom">` at `<md` (768px)"

And `admin-ux-rules.md §14` (added in Task 306-Fix) states the canonical boundary is `lg:` (1024px) — matching the table↔card switch. `ListingPreviewDialog` (multiple status actions + delete + premium + view + edit) is action-heavy. It used `<Dialog>` at all sizes — no bottom-sheet on mobile.

**Fix:** `ListingPreviewDialog` now uses `useIsMobile()` (MediaQueryList on `max-width: 1023px`) to switch:
- `<lg:` (mobile + tablet, <1024px) → `<Sheet side="bottom">` with rounded-t-2xl, drag handle, max-h-[85vh] overflow scroll
- `>=lg:` (desktop, 1024px+) → `<Dialog>` (existing behavior preserved)

## `useIsMobile` hook (local utility)

```ts
function useIsMobile() {
  const [mobile, setMobile] = useState(true)  // mobile-first default
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    setMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return mobile
}
```

Default `true` = mobile-first (safe for SSR). `useEffect` updates to actual value on client after hydration. Since the preview dialog only opens after user interaction, the correct value is already set by the time the dialog renders.

## Content extraction pattern

Shared content blocks (`titleRow`, `detailsGrid`, `statusActionsSection`, `deleteConfirmSection`, `actionButtons`) extracted to variables and reused in both Sheet and Dialog branches. No logic duplication. All handlers (`handleDelete`, `handleStatusChange`) unchanged.

## Preserved (Notes 19/20/23)

- Desktop Dialog path: identical to pre-fix (centered, `max-w-md`, `DialogFooter`)
- All status action buttons: identical
- Delete confirmation inline pattern: identical
- Premium dialog trigger: identical
- `onStatusChanged`, `onDeleted`, `onPremium` callbacks: identical
- `AdminTable`, `AdminCardList`, `AdminPageShell` primitives: untouched
- `AdminUsersTable`, all other admin routes: untouched
- Column visibility (id=xl, type=md, agent=lg, date=xl): untouched
- `container-admin`: untouched

## Files Changed

| Path | Change |
|------|--------|
| `src/components/admin/AdminListingsTable.tsx` | Add Sheet imports; add `useIsMobile()`; rewrite `ListingPreviewDialog` for Sheet/Dialog dual render; add `onRowClick` to `<AdminTable>` |

## Re-QA requirement

9 widths × 4 locales:

| Width | Expected |
|-------|----------|
| 320, 375, 390, 480, 560, 680, 768 | Card layout; tap → Sheet slides up from bottom; drag handle visible; all actions present |
| 1024 | Table layout; row click → centered Dialog |
| 1920 | Table layout; row click → centered Dialog |

Locales: sq / en / uk / it — at minimum 320, 375, 768, 1024, 1920 per owner requirement.

## Validation

```
tsc --noEmit  → 0 errors
next lint     → 0 warnings / 0 errors
next build    → passes
check:i18n    → 1431 keys, parity unchanged
```

Self-validation: tsc=0 · lint=0/0 · build=passes · onRowClick wired ✓ · useIsMobile <1024px boundary ✓ · Sheet slide-up on mobile ✓ · Dialog preserved on desktop ✓ · no scope creep ✓ · PASS pending owner re-QA gate G3''
