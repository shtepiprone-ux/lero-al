# Task 485 — Epic MM.1b — Admin table: TailAdmin-FAITHFUL composition (card wrapper + header + composite cells)

> **Executor:** Sonnet 4.6. **Orchestrator:** Opus (review-on-diff).
> **Why this exists:** Task 484 put the TailAdmin TOKENS into the theme, but the rendered admin table still
> looks amateur vs the reference because the **component composition/structure was not replicated**. Tokens ≠
> layout. This task makes the canonical admin table render **1:1 with TailAdmin's table block** (the owner's CRM
> "Recent Orders" reference). Applies to `MantineDataTableToCards` (desktop table) + `MantineAdminSurfacePattern`
> + `AdminUsersTable`; becomes the template for ALL admin tables (MM.2+).
> **UI-only.** Preserve every handler/href/filter/pagination + `data-testid` anchors. Brand `#EC5447`.
> Source of truth: `docs/tailadmin-style-reference.md` + the EXACT anatomy below (extracted from the owner's
> TailAdmin files, `html/crm.html`).

## 0. The exact TailAdmin table anatomy (replicate this structure)

```
CARD WRAPPER:  rounded-2xl (16) · border border-gray-200 (#e4e7ec) · bg white · padding px-20 pt-20 pb-20 (sm: px-24 pt-24)
  ├─ CARD HEADER ROW (above table): title (text-lg/18 font-semibold gray-800) + right-side actions (Filter / tabs)
  ├─ SCROLL: max-w-full overflow-x-auto
  └─ TABLE:
       THEAD TR:  border-y border-gray-100 (#f2f4f7) · bg-gray-50 (#f9fafb)
         TH:  px-24 py-12 · whitespace-nowrap · text 12px · font-medium · text-gray-500 (#667085) · text-left
       TBODY TR: row divider border-gray-100; hover bg-gray-50
         TD:  px-24 py-12 · whitespace-nowrap · text 14px · text-gray-700 (#344054)
         USER CELL (composite):  Group(gap 12) →
            Avatar h-40 w-40 rounded-full (tinted bg)
            Stack(gap 2): name = 14px font-medium gray-700 ; subtitle/email = 12px gray-500
         STATUS CELL: Badge pill · px-8 py-2 · 12px font-medium · bg-{sem}-50 / text-{sem}-600
                      (active→success #ecfdf3/#039855 · pending→warning · blocked/inactive→error #fef3f2/#d92d20)
         ACTION CELL: right-aligned icon buttons (≥44px hit area)
```
(px values: px-6=24, py-3=12, h-10=40, gap-3=12. Use theme tokens: 24≈`xl`/`lg`, 12≈`sm`, etc. — NO raw px
except where a token doesn't exist; never hardcode colors, use theme `gray`/`green`/`yellow`/`red`.)

## 1. Required changes

### 1.1 `MantineDataTableToCards` — desktop table must be card-wrapped + TailAdmin-styled
- Wrap the desktop `Table` in a Mantine `Paper`/`Card` (radius 16, border gray-2 #e4e7ec, no shadow, the
  card padding). Optional card header slot (title + actions) above the table.
- Style the Mantine `Table` via `styles`/props to match: `Table.Thead` row → `bg-gray-50` + `border-y gray-1`;
  `Table.Th` → 12px fw500 gray-5, padding 24×12, not-uppercase, left; `Table.Td` → 24×12, 14px gray-7,
  `whitespace-nowrap`; row hover `bg gray-0/50`. Use `verticalSpacing`/`horizontalSpacing` OR explicit cell
  padding to hit 24×12 — whichever actually renders 24×12 (verify in the screenshot).
- Add a `TableColumn` capability for a **composite cell** (already have `render`) — ensure the user/primary
  column renders avatar + name + subtitle via `render`.
- Keep the mobile `CardConfig` card (from 483) but align its rhythm to the same tokens.

### 1.2 `AdminUsersTable` — consume the card-wrapped table + composite user cell
- The whole users table block sits inside the card wrapper (tabs + search + filters can be in the card header
  area or above — match TailAdmin: filters above the table inside/around the card).
- USER column = composite (avatar + name + `#id`/company subtitle). STATUS = pill badge (semantic). ROLE = badge
  or text per TailAdmin. Right-align the actions (verify/revoke + detail chevron).
- Columns: give the user column the natural width and keep meta columns compact (`whitespace-nowrap`) so the
  layout does NOT sprawl — the card wrapper + nowrap + real cell padding fixes the "scattered columns" defect.

### 1.3 Reference doc
- Add the §0 table-block anatomy to `docs/tailadmin-style-reference.md` §6 (as "Admin table block — CRM
  reference") and cite it from `mantine-responsive-design-system.md`.

## 2. Acceptance (the bar = looks like the reference)

1. Desktop admin table renders inside a TailAdmin card (rounded-2xl, gray-200 border, no shadow, proper padding).
2. Header row = `bg-gray-50` + `border-y gray-100`, 12px medium gray-500 cells, padding 24×12.
3. Body cells 24×12, 14px gray-700, `whitespace-nowrap`; row divider gray-100; hover gray-50.
4. User cell = avatar + name(14/medium/gray-700) + subtitle(12/gray-500) composite; status = pill semantic badge;
   actions right-aligned.
5. Columns aligned and balanced — NOT sprawled (verify at 1440 + 1024).
6. Mobile (<40em) keeps the 483 card; rhythm uses the same tokens.
7. Zero raw spacing px / raw hex — theme tokens only. Brand `#EC5447`.
8. **Rendered side-by-side proof** vs the TailAdmin reference at 1440 + 768 + 320 × en/uk — owner-grade match.
   Green tsc/check ≠ proof.
9. Handlers/testids preserved; RTL smoke green; tsc=0 · lint=0-new · check:i18n green · check:stories green ·
   check:design-tokens green · file-integrity clean.

## 3. Contract

UI-only; scope = `MantineDataTableToCards` + `MantineAdminSurfacePattern` + `AdminUsersTable` + their stories +
reference/doc. No DB/RLS/permission/action change. No Tailwind breakpoint classes. Consume theme tokens only.
No `git`. Ambiguity (e.g. exact Mantine `Table` styling API to hit 24×12) → implement + verify in the
screenshot; if it can't match, STOP & ASK. The deliverable bar is **visual parity with the reference**, proven
by rendered screenshots — not compile gates.
