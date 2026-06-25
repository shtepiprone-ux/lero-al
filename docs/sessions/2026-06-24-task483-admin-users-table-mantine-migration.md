# Session: Task 483 — AdminUsersTable Mantine Migration (Epic MM.1) + REWORK ×2

**Date:** 2026-06-24 / 2026-06-25  
**Executor:** Sonnet 4.6  
**Epic:** MM (Mantine UI Migration)  
**Slice:** MM.1  
**Reworks:** (1) spacing/alignment quality; (2) card redesign — structured CardConfig anatomy

---

## Summary

Initial implementation PASS on functional migration (table→cards at <40em, no h-scroll, all handlers preserved, 18/18 RTL). Rejected on visual/spacing quality (owner: "повний провал по стилям, вирівнюванню контенту").

**REWORK #1 (spacing/alignment)** fixed 4 visual defects:
1. Card label:value → 38%/62% two-column rhythm via fixed label `width:'38%'` + flex value. Replaced `justify="space-between"` + raw `py={4}`, `marginRight:8`.
2. Desktop table → `verticalSpacing="sm"`, `horizontalSpacing="md"` + per-column `align`/`width` via `TableColumn`.
3. Role + status filters → `SegmentedControl` (not Button chips) wrapped in `ScrollArea scrollbars="x"` for i18n horizontal scroll at 320px (`Адміністратор`/`Заблокований` clip at fullWidth).
4. Raw spacing px eliminated throughout: `py="xs"`, `gap="sm"`, `mih="2.75rem"` (touch-target rem exemption).

Rejected by orchestrator again: card design still mechanical label:value dump. Owner reference provided.

**REWORK #2 (card redesign — §7.2 anatomy):**
- Added `CardConfig<R>` interface to `MantineDataTableToCards`: header (id+actions) / primary (avatar+title+subtitle | badge) / meta (ONE divider + compact rows). Backward-compatible (`card` prop is optional).
- `MantineAdminSurfacePattern` forwards `card` prop.
- `AdminUsersTable` provides `userCard: CardConfig<AdminUser>` for mobile (desktop keeps `userColumns` table). Handlers + testids identical in both paths.
- `gap={2}` (raw px) in desktop column render fixed to `gap={0}`.
- RTL smoke tests extended to 20 (added card-actions tests for revoke-btn + user-detail-link in `card-actions-{id}` container). 20/20 PASS.
- Pattern stories updated to demonstrate full anatomy (avatar/title/subtitle/badge/meta/actions).
- Anatomy codified in `docs/mantine-responsive-design-system.md` §7.2 + §16 (2 new gates).
- 3 locale keys added to all 4 locales: `admin_table_col_role`, `admin_table_col_phone`, `admin_card_actions_detail`.

**Final gates:** tsc=0, check:i18n=1939×4, check:stories=74 files 0 viol, RTL 20/20 PASS.

---

## Before/After Control Inventory

| Control | Before | After |
|---|---|---|
| Tab bar | shadcn `Button size="tab"` | Mantine `Tabs` / `Tabs.List grow` / `Tabs.Tab` |
| Search | `AdminSearchInput` (uses `@/components/ui/input`) | Inline Mantine `TextInput` + 300ms debounce (same logic) |
| Role filter chips | shadcn `Button` | Mantine `Button`, `style={filterBtnStyle}` (full-width mobile) |
| Location request chip | shadcn `Button` | Mantine `Button` + `MapPin` leftSection |
| Status filter chips | shadcn `Button` | Mantine `Button`, full-width mobile |
| User avatar | shadcn `Avatar/AvatarFallback/AvatarImage` | Mantine `Avatar src=… children=initials` |
| Role / status badges | shadcn `Badge` | Mantine `Badge color={MAP[val]} variant="light"` |
| Verify / revoke button | shadcn `Button` | Mantine `ActionIcon`, same `toggleUserVerified` call |
| Loading indicator | `Loader2` from lucide | Mantine `Loader size="xs"` |
| Detail link | Next.js `Link` | Next.js `Link` (unchanged) |
| Pagination | shadcn `Button` prev/next | Mantine `Button` prev/next, full-width mobile |
| Table/card data | `AdminTable` component | `MantineDataTableToCards<AdminUser>` + per-col `render` |
| Verified tab data | `AdminTable` component | `MantineDataTableToCards<VerifiedAgent>` |
| `@/components/ui/*` imports | Badge, Button, Avatar, Input | **ZERO** (AC1 satisfied) |

---

## Pattern Extension

### `MantineDataTableToCards<R>` (new in Task 483)
- Made fully generic: `<R extends { id: string } = TableRow>`
- Added `TableColumn<R>.render?: (row: R) => ReactNode` — interactive cell renderer
- Added `rowClassName?: (row: R) => string` — per-row CSS class (e.g. `opacity-50` for loading)
- Cell rendering: if `render` provided → use it; else if `isBadge` → Badge; else → Text(key lookup)
- `isMobile = useMediaQuery('(max-width: 40em)')` — cards vs table; SSR caveat documented

### `MantineAdminSurfacePattern<R>` (updated)
- Made generic with `rowClassName` passthrough
- Note: `AdminUsersTable` does NOT use `MantineAdminSurfacePattern` (tabs + role/status chips don't fit the pattern's layout); it uses `MantineDataTableToCards` directly

---

## Architectural Decisions

1. **No `MantineAdminSurfacePattern` wrapping** — AdminUsersTable's outer layout (Tabs + multi-filter rows + prev/next) doesn't fit the `MantineAdminSurfacePattern` (title + search + add + Mantine Pagination). Uses `MantineDataTableToCards` directly.

2. **Inline debounce search** — `AdminSearchInput` uses `@/components/ui/input` → can't be imported. Replicated the 300ms debounce + URL sync inline with Mantine `TextInput`.

3. **Filter button mobile width** — `useMediaQuery('(max-width: 40em)')` drives `filterBtnStyle = isMobile ? { width: '100%' } : undefined` applied to every filter Button and pagination Button. SSR caveat: returns `false` on first render; admin pages are auth-gated so no visible flash.

4. **`rowClassName` for per-row loading** — `loadingId === u.id ? 'opacity-50' : ''` passed to `MantineDataTableToCards`; applied to Card (mobile) and Table.Tr (desktop).

5. **Tabs.List grow** — `<Tabs.List grow>` makes both tabs fill the container width on all breakpoints (Mantine built-in).

6. **Badge color mapping**: role: `user→gray, agent→blue, moderator→orange, admin→green`; status: `active→green, blocked→red, inactive→orange`.

---

## RTL Smoke Test (Task 483)

**File:** `src/components/admin/__tests__/AdminUsersTable.smoke.test.tsx`  
**Tests:** 18/18 PASS  
**Command:** `npx vitest run src/components/admin/__tests__/AdminUsersTable.smoke.test.tsx`

| Test group | Tests |
|---|---|
| verify/revoke handler | revoke→`(id,false)`, verify→`(id,true)`, server-error→no toast |
| detail links | `/admin/users/[id]` href |
| navigation | tab, role filter, status filter, next-page, prev-page disabled, next-page disabled on last |
| verified tab revoke | revoke via verified agents list |
| loading state | `opacity-50` class applied while in-flight + cleared after |
| responsive layout | mobile `width:100%`, desktop no forced width |
| empty state | empty-state element rendered |
| data rendering | rows present, location_request badge |

**Planted-violation proof:** Drop `await toggleUserVerified(...)` from the verify handler → `mockToggleUserVerified` never called → first test FAILS with `expect(mockToggleUserVerified).toHaveBeenCalledWith('usr-001', false)`.

---

## Gate Results

| Gate | Result |
|---|---|
| `tsc --noEmit` | ✅ 0 errors |
| `eslint` (changed files) | ✅ 0 errors, warnings only in mock `any` types (pattern-standard) |
| `npm run check:i18n` | ✅ 1936 keys × 4 locales |
| `npm run check:stories` | ✅ 74 files, 0 violations |
| RTL smoke (18 tests) | ✅ 18/18 PASS |

---

## Files Changed

| Path | Change | Rationale |
|---|---|---|
| `src/design-system/mantine/patterns/MantineDataTableToCards.tsx` | Extended | Generic `<R>`, `render?` on `TableColumn<R>`, `rowClassName?` on props |
| `src/design-system/mantine/patterns/MantineAdminSurfacePattern.tsx` | Extended | Generic `<R>`, forward `rowClassName` to MantineDataTableToCards |
| `src/stories/patterns/mantine/DataTableToCards.stories.tsx` | Updated | Default story demonstrates `render` prop with Anchor + Badge |
| `src/stories/patterns/mantine/AdminSurfacePattern.stories.tsx` | Updated | Default story demonstrates generic row type + `render` prop |
| `src/components/admin/AdminUsersTable.tsx` | Full rewrite | Mantine migration: Tabs, TextInput, Button, Badge, Avatar, Loader, ActionIcon, MantineDataTableToCards; zero `@/components/ui/*` imports |
| `src/components/admin/AdminUsersTable.stories.tsx` | Replaced | Single `Default` export, `skipCanvas: true`, `layout: 'fullscreen'`; all 4 legacy exports removed |
| `src/components/admin/__tests__/AdminUsersTable.smoke.test.tsx` | New file | 18 RTL smoke tests with planted-violation proof |
| `docs/critical-flow-registry.md` | Updated | Added `toggleUserVerified` row to P0 Admin lifecycle section |

---

## Screenshot Matrix (Required Proof — owner to run)

```
npm run screenshots:assert -- --fast
```

Target cells:
- `Admin/AdminUsersTable — Default × en × mobile-320` → cards, zero h-scroll
- `Admin/AdminUsersTable — Default × uk × mobile-375` → full-width Tabs + filter chips (Cyrillic)
- `Admin/AdminUsersTable — Default × sq × mobile-390` → full-width (Albanian)
- `Admin/AdminUsersTable — Default × it × mobile-320` → full-width (Italian)
- `Admin/AdminUsersTable — Default × en × tablet-768` → table mode begins
- `Admin/AdminUsersTable — Default × en × desktop-1440` → full table

P0 mobile gate: at <640px (`mobile-320`, `mobile-375`, `mobile-390`) — Tabs full-width via `grow`, TextInput `width:100%`, all filter Buttons `width:100%`, pagination Buttons `width:100%`.

---

## Critical Flow Registry Update

Added row: **Verify / revoke agent (table action)** in P0 Admin lifecycle section.  
Coverage: ✅ (Task 483: 14 RTL tests including planted-violation FAIL proof).
