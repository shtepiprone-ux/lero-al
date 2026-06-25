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

## 1b. 🔴 REAL TailAdmin tokens — extracted from the owner's uploaded files (these are AUTHORITATIVE; supersede the §1 estimates wherever they differ)

Source: TailAdmin compiled `css/style.css` (Tailwind v4 `@theme`) + HTML markup. Implement THESE exact values.

**Font:** `Outfit, sans-serif` — **ADOPT Outfit globally for Mantine UI (owner decision 2026-06-25).** Load it
the same way the project loads its current font (Next font loader or the Storybook preview-head font injection);
set `theme.fontFamily` + heading font to Outfit. Keep the existing font available only for any not-yet-migrated
legacy surfaces. The size/line-height scale below applies regardless.

**Spacing base:** 4px grid (`--spacing: 0.25rem`). Mantine `theme.spacing`: `xs`=8 / `sm`=12 / `md`=16 / `lg`=20 / `xl`=24 (px). (TailAdmin cards use p-5=20/p-6=24; table cells px-5=20/py-4=16; block gaps gap-5/gap-6.)

**Type scale (px / line-height):** `xs` 12/18 · `sm` 14/20 · `base` 16/24 · `lg` 18 · `xl` 20/30 · titles: `title-xs` 24/32 · `title-sm` 30/38 · `title-md` 36/44 · `title-lg` 48/60. Map Mantine `fontSizes` xs12/sm14/md16/lg18/xl20; headings to the title scale.

**Radius (real):** xs 2 · sm 4 · md 6 · **lg 8 (controls: Button/Input/Select)** · xl 12 · **2xl 16 (Card/Paper)** · 3xl 24 (px). Badge = pill (full).

**Color palette (adopt gray + semantic; KEEP brand `#EC5447`, do NOT use TailAdmin brand `#465fff`):**
| Scale | 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 |
|---|---|---|---|---|---|---|---|---|---|---|
| gray | #f9fafb | #f2f4f7 | #e4e7ec | #d0d5dd | #98a2b3 | #667085 | #475467 | #344054 | #1d2939 | #101828 |
| success | #ecfdf3 | #d1fadf | — | #6ce9a6 | — | #12b76a | #039855 | #027a48 | #05603a | — |
| warning | #fffaeb | — | — | — | #fdb022 | #f79009 | #dc6803 | #b54708 | — | — |
| error | #fef3f2 | #fee4e2 | — | #fda29b | #f97066 | #f04438 | #d92d20 | #b42318 | #912018 | — |

**Card (TailAdmin content card):** `rounded-2xl` (radius 16) + `border` `gray-100` (#f2f4f7) + `bg white` + **NO shadow** (flat; shadow only on dropdowns/popovers) + padding `20` (mobile) / `24` (≥sm). Map to Mantine `Card`/`Paper` defaults: `radius` 16, `withBorder`, `shadow={undefined}`, border color gray-1≈#f2f4f7, `padding` md(16)/lg(20)→responsive.

**Table:** header `Th` + body `Td` padding = **horizontal 20 (px-5) / vertical 16 (py-4)** → Mantine `Table horizontalSpacing` ≈ `lg`(20), `verticalSpacing` `md`(16). Header text: 12px (`xs`), `font-medium` (fw 500), `text-gray-500` (#667085), `text-left`. Row divider: `border-gray-100` (#f2f4f7). `highlightOnHover`.

**Status badge:** pill, `text-xs` (12), `font-medium`, semantic light tint — e.g. Active→success (bg #ecfdf3 / text #039855), Pending→warning (#fffaeb / #b54708), Blocked/Inactive→error (#fef3f2 / #d92d20). Mantine `Badge variant="light"` with the mapped color + `radius` pill.

**Secondary text:** gray-500 (#667085); primary text gray-700/800.

> Where §1b differs from §1, §1b wins (e.g. table cells are 16×20, NOT 12×16; card border is gray-100, NOT gray-200). Keep a short "TailAdmin token map" table in the design-system doc §6 citing these as the source.

**🔴 FULL extraction reference: `docs/tailadmin-style-reference.md`** (extracted from the owner's uploaded
files). It is the authoritative source — §1–§5 tokens (font/spacing/type/radius/color/shadow) AND §6 component
conventions. Task 484 MUST also encode the §6 **component defaults** into `theme.ts`, not just the raw tokens:
- **Button:** filled brand (#EC5447) radius 8 / ~44px / fw500; secondary = gray-300 border + `shadow-theme-xs`.
- **TextInput/Select/Textarea:** h≈44, radius 8, border gray-200, `shadow-theme-xs`, focus border brand-300 +
  ring brand/10 (`0 1px 2px 0 rgba(0,0,0,.05)` = the xs shadow value).
- **Card/Paper:** radius 16, border gray-100, NO shadow, padding 20/24.
- **Table:** horizontalSpacing≈20, verticalSpacing 16, header `xs`/fw500/gray-500, row divider gray-100.
- **Badge:** pill, `xs`/fw500, light semantic tint (success/warning/error per §6).
Cite `docs/tailadmin-style-reference.md` from `mantine-responsive-design-system.md` §6.

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
