# Task 483 — REWORK (mobile card redesign + spacing/alignment) — AdminUsersTable + canonical table pattern

> **Executor:** Sonnet 4.6. **Orchestrator:** Opus (review-on-diff).
> **Verdict:** functional migration + responsive adaptation PASS; **mobile card design + spacing/alignment FAIL**
> (owner, 2026-06-24, with a reference design). Same Task 483 — do NOT renumber, do NOT reduce scope.
> **UI-only.** Preserve every handler/action/href/filter/pagination + every `data-testid` anchor
> (`admin-users-table` root; `verify-btn`/`revoke-btn`/`user-detail-link`/filter/page testids) — or update the
> RTL test in lockstep.

## 0. Why rejected (owner reference)

The mobile card is a **mechanical "every column → label:value row" dump** (User/Role/Status/Phone/Date, each a
dividered full-width row) — tall, monotonous, no hierarchy. The owner's reference card has a **designed
hierarchy**: an ID/actions header, a primary row (avatar + bold title + muted subtitle | status badge top-right),
then a few compact meta rows. Plus Mantine spacing tokens aren't used consistently and filters are heavy
full-width bars. Fix all three; the card redesign is the main item.

## 1. Card redesign — structured config on the canonical pattern (owner decision)

Add an OPTIONAL structured card config to `MantineDataTableToCards` (mobile only; desktop stays the `columns`
table). When `card` is provided, mobile renders the DESIGNED card; when omitted, it falls back to the existing
generic label:value layout (backward-compatible for simple consumers).

```ts
interface CardConfig<R> {
  id?:       (row: R) => ReactNode   // header left, muted xs (e.g. "#101")
  actions?:  (row: R) => ReactNode   // header right (menu / verify-revoke / detail) — ≥44px targets
  avatar?:   (row: R) => ReactNode   // primary row, left
  title:     (row: R) => ReactNode   // primary, bold
  subtitle?: (row: R) => ReactNode   // under title, dimmed (company/email)
  badge?:    (row: R) => ReactNode   // primary row, right (status badge), top-aligned
  meta?:     { label: string; value: (row: R) => ReactNode }[]  // compact secondary rows
}
// MantineDataTableToCards props gain: card?: CardConfig<R>
```

**Card layout (Mantine, tokens only):**
- Header: `Group justify="space-between"` → `id` (Text size="xs" c="dimmed") | `actions`.
- Primary: `Group justify="space-between" align="flex-start"` → `Group(avatar + Stack(title fw=600, subtitle
  size="sm" c="dimmed"))` | `badge`.
- Meta: ONE subtle divider above, then `Stack gap="xs"` of compact label:value lines (label size="xs"
  c="dimmed", value size="sm"); **not** a heavy divider per field, **not** `space-between` with giant gaps —
  use an aligned 2-col rhythm (fixed label width or `SimpleGrid cols={2}`).
- Card `padding`/`radius` from theme; vertical rhythm via `Stack gap` tokens.

`MantineAdminSurfacePattern` forwards `card`. Update the `DataTableToCards` + `AdminSurfacePattern` stories to
prove the designed card (with avatar/title/subtitle/badge/meta/actions), not the generic dump.

## 2. AdminUsersTable consumes the card config

Map: `id` → `#{numericId}`; `actions` → verify/revoke + go-to-detail (keep testids); `avatar` → user avatar;
`title` → name (bold); `subtitle` → company/email; `badge` → status badge; `meta` → Role, Phone, Date/Online.
Desktop keeps the `columns` table (with §3 alignment fixes). No inline card layout in AdminUsersTable.

## 3. Desktop table alignment + spacing tokens (still required)

| Defect | Evidence | Fix |
|---|---|---|
| Sparse/unaligned columns, badges floating | `MantineDataTableToCards.tsx:107–131` | per-column `align?`/`width?` on `TableColumn`, applied to `Th`/`Td`; Mantine `Table` `verticalSpacing`/`horizontalSpacing` from theme tokens. |
| Mobile filters = stacked full-width gray bars | `AdminUsersTable.tsx:285,325–369` | **Mantine `SegmentedControl`** for role + status (fullWidth <40em, auto ≥40em); same `navigate(...)` + testids; **if ~5 role options clip at 320 → STOP & ASK**. |
| Raw spacing px | `MantineDataTableToCards.tsx:89,91,93`; `AdminUsersTable.tsx:392` | theme tokens (`py="xs"`, Group `gap`, drop ad-hoc `lineHeight`); touch-target `rem` minimum is the only px exemption. |

## 4. Codify (so MM.2+ inherit it)

In `docs/mantine-responsive-design-system.md` §7 add **"Admin data card anatomy"** (the CardConfig: id+actions
header, avatar+title+subtitle | badge primary, compact meta) + **"Spacing rhythm"** (theme tokens only; no raw
spacing px in `src/design-system/mantine/**` or migrated surfaces). Add both to the §16 future-task gate. The
generic label:value dump is explicitly NOT the canonical admin card.

## 5. Tests

Update `AdminUsersTable.smoke.test.tsx` for the SegmentedControl + card-actions DOM: selecting a role/status
segment fires `navigate(...)` with the same params; verify/revoke in the card actions still calls
`toggleUserVerified(id, …)`; detail href intact; keep the planted-violation; pagination/loading/empty stay green.

## 6. Rendered proof (mandatory)

Show the redesigned mobile card matches the reference anatomy (header id+actions, avatar+title+subtitle+badge,
compact meta — no per-field dividers/dump) at 320/375/390, desktop table aligned at 768/1440, SegmentedControl
filters with no clip/h-scroll at 320, × en/uk (sq/it@320). Owner visual or `screenshots:assert -- --fast`.
A green tsc/check is NOT proof — open Storybook and look.

## 7. Scope / contract

- Scope = `MantineDataTableToCards.tsx` (+ `MantineAdminSurfacePattern.tsx` forward), the two pattern stories,
  `AdminUsersTable.tsx`, the RTL test, `docs/mantine-responsive-design-system.md` §7/§16. No other surface; no
  DB/RLS/permission/action change; handlers + testids preserved.
- `card` config is additive/backward-compatible (omitting it = current generic behavior).
- theme tokens only; no raw spacing px; no Tailwind breakpoint classes / `.container-wide`.
- Files Changed table; no `git add`/`git commit`. File-integrity clean. Ambiguity → STOP & ASK.

## 8. Acceptance

1. `MantineDataTableToCards` accepts a structured `card` config; mobile renders the designed card (header
   id+actions / avatar+title+subtitle+badge / compact aligned meta), NOT the label:value dump.
2. AdminUsersTable consumes it; desktop table aligned with theme-token cell spacing.
3. Role + status filters = `SegmentedControl` (fullWidth <40em), same navigate + testids; no clip/h-scroll@320.
4. Zero raw spacing px in touched Mantine files + AdminUsersTable (touch-target rem exempt).
5. Card anatomy + spacing rhythm codified in the Mantine doc §7 + §16.
6. RTL smoke green + planted-violation FAIL; preserved behavior covered.
7. Rendered proof matches the reference anatomy at 320/768/1440 × locales.
8. tsc=0 · lint=0-new · check:i18n green · check:stories green · file-integrity clean.
