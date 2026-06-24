# Task 484 — Epic MM.0 — Mantine visual standard (TailAdmin-derived spacing matrix + typography + density)

> **Executor:** Sonnet 4.6. **Orchestrator:** Opus (review-on-diff).
> **Owner decision 2026-06-24:** https://demo.tailadmin.com is the **source of truth for UI styling** — the
> horizontal/vertical spacing matrix, typography, content positioning, and component density. Stop per-surface
> hand-tuning; codify ONE standard in the Mantine theme + design-system doc, and have every surface inherit it.
> **Keep the project brand `#EC5447`** (do NOT adopt TailAdmin's blue). TailAdmin = structure/spacing/rhythm
> reference, not color.
> This task BLOCKS further MM slices and supersedes the open Task 483 card tweak — 483 closes by consuming this
> standard.

## 0. Goal

Encode a concrete, balanced spacing/typography/density standard into `src/design-system/mantine/theme.ts` and
document it as the single source of truth in `docs/mantine-responsive-design-system.md`, then restyle the
canonical admin card/table patterns + AdminUsersTable to consume it. After this, surfaces look consistent and
balanced without per-surface px tweaking.

## 1. Concrete token matrix (TailAdmin-derived → Mantine theme)

Apply these in `theme.ts`. Values are a 4px grid (TailAdmin's rhythm). If the owner-confirmed reference differs,
STOP & ASK — do not silently substitute.

### 1.1 Spacing scale (`theme.spacing`) — vertical & horizontal rhythm
| Token | rem | px | Typical use |
|---|---|---|---|
| `xs` | 0.5rem | 8 | meta-row gap, badge padding, tight inline gaps |
| `sm` | 0.75rem | 12 | control gaps, table vertical cell padding |
| `md` | 1rem | 16 | card inner gap, table horizontal cell padding, intra-section gap |
| `lg` | 1.5rem | 24 | card padding, gap between major blocks (filters↔table) |
| `xl` | 2rem | 32 | page section separation |

### 1.2 Radius (`theme.radius`)
| Token | rem | px | Use |
|---|---|---|---|
| `sm` | 0.5rem | 8 | Button, Input, Select, Badge-as-chip |
| `md` | 0.75rem | 12 | inner panels |
| `lg` | 1rem | 16 | Card / Paper (TailAdmin `rounded-2xl`) |
| pill | 9999 | — | status Badge (`rounded-full`) |

### 1.3 Typography (`theme.fontSizes` / `lineHeights` / headings)
| Token | rem | px | Use |
|---|---|---|---|
| `xs` | 0.75rem | 12 | labels, meta, table headers (uppercase, dimmed) |
| `sm` | 0.875rem | 14 | body, table cells, inputs |
| `md` | 1rem | 16 | emphasized body |
| `lg` | 1.125rem | 18 | card/section title |
| `xl` | 1.25rem | 20 | page heading |
Body line-height 1.5; headings ~1.3. Secondary text = `c="dimmed"` (gray-500/600). Keep the existing font.

### 1.4 Component density (`theme.components[*].defaultProps`/`styles`)
- **Card/Paper:** `radius="lg"`, `withBorder`, **no shadow** (flat border style, `shadow={undefined}`), border
  `--mantine-color-gray-2`, `padding="lg"` (desktop) / `md` (mobile via responsive prop where needed).
- **Table:** `verticalSpacing="sm"` (12), `horizontalSpacing="md"` (16), `highlightOnHover`, header `Th` →
  `Text size="xs" tt="uppercase" fw={500} c="dimmed"`, row border `--mantine-color-gray-1`.
- **Badge:** `radius` pill, `variant="light"`, `size="sm"`, `fw={500}`, padding from tokens.
- **Button / TextInput / Select / Textarea:** `size="md"` → **min-height 2.75rem (44px)**, `radius="sm"`.
- **SegmentedControl:** `radius="sm"`, `size="sm"`, full-width on mobile.

### 1.5 Horizontal/vertical matrix (document this explicitly)
- **Vertical:** between major blocks `lg` (24); card internal rhythm `md`→`sm`→`xs` (title block → divider →
  meta rows); table row vertical padding `sm` (12).
- **Horizontal:** page/card gutter `lg`; table cell horizontal `md`; inline control gaps `sm`; label↔value
  inside meta rows = aligned 2-col (label fixed ~`38%`, value flush-left in its column — NOT space-between).

## 2. Restyle the canonical patterns to the standard

- `MantineDataTableToCards` (card + table) and `MantineAdminSurfacePattern`: consume ONLY theme tokens (no raw
  spacing px). Card anatomy keeps the §7.2 structure (id+actions header / avatar+title+subtitle | badge /
  compact meta) but with the standard's rhythm: header→primary `sm`, divider, primary→meta `sm`, meta rows
  `xs`, label column aligned, value `text-sm`, label `text-xs` dimmed. Table uses the standard cell spacing +
  header style. Status badge = pill light.
- `MantineCard`, `MantineAdminSurfacePattern`, listing/detail patterns: verify they pick up the new Card/Table/
  Badge defaults (no local overrides that diverge from theme — canonical-first, Task 426).

## 3. Document as source of truth

In `docs/mantine-responsive-design-system.md`: rewrite §6 (theme) + §7 (responsive rules) to state TailAdmin is
the visual reference (structure/spacing only; brand stays `#EC5447`), include the §1 token matrix tables here,
and add the explicit H/V spacing matrix (§1.5). Update the §16 future-task gate: every new surface uses theme
tokens (zero raw spacing px) and the documented density; a surface that hand-rolls spacing FAILS review.

## 4. Proof surface (this task)

Restyle and render: `Patterns/Mantine/AdminSurfacePattern`, `Patterns/Mantine/DataTableToCards`, and
`AdminUsersTable` through the new standard. Provide rendered evidence (320/375/390 cards + 768/1440 table ×
en/uk, sq/it@320) showing the balanced, TailAdmin-grade rhythm — aligned meta, consistent gaps, flat-border
cards, pill badges, comfortable table rows. Owner visual confirm. Green compile gates ≠ proof.

## 5. Scope / contract

- Scope = `theme.ts`, the canonical card/table/admin-surface patterns + their stories,
  `AdminUsersTable.tsx` (token consumption only — no behavior change, preserve handlers/testids),
  `docs/mantine-responsive-design-system.md`. Touch other patterns ONLY to remove local spacing overrides that
  now come from the theme (canonical-first); if a pattern needs real layout change → note it, do not expand
  scope silently.
- No DB/RLS/permission/action/i18n-logic change. No Tailwind breakpoint classes / `.container-wide`. No raw
  spacing px anywhere in `src/design-system/mantine/**` after this (touch-target `rem` min is the only exemption).
- Keep brand `#EC5447`. Do NOT introduce TailAdmin blue or copy TailAdmin proprietary assets/code — derive
  tokens/conventions only.
- Self-validate (clause 9): tsc=0, AC table, rendered matrix, final line. Files Changed table. No git.
- Ambiguity (any token where the reference is unclear) → STOP & ASK.

## 6. Acceptance

1. `theme.ts` defines the §1 spacing/radius/typography scale + Card/Table/Badge/Button/Input/SegmentedControl
   density (flat-border card radius lg, table verticalSpacing sm/horizontalSpacing md, pill badges, 44px controls).
2. Canonical card/table patterns + AdminUsersTable consume ONLY theme tokens — zero raw spacing px.
3. Card anatomy renders balanced (aligned meta, consistent rhythm), table rows comfortable + aligned, badges pill.
4. Doc §6/§7 rewritten with the token matrix + explicit H/V spacing matrix; §16 gate updated (token-only, no raw px).
5. Brand stays `#EC5447`; no TailAdmin color/asset copied.
6. Rendered proof at 320/375/390/768/1440 × en/uk (sq/it@320) shows TailAdmin-grade balance; owner visual confirm.
7. No behavior/handler/testid change in AdminUsersTable; RTL smoke still green.
8. tsc=0 · lint=0-new · check:i18n green · check:stories green · file-integrity clean.
