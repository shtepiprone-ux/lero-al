# TailAdmin Style Reference — extracted source of truth (owner-supplied files, 2026-06-25)

> **Owner decision:** TailAdmin (https://demo.tailadmin.com) is the source of truth for lero-al UI styling —
> spacing matrix (H/V), typography, color, density, component conventions. Extracted directly from the owner's
> uploaded TailAdmin build (`css/style.css` Tailwind v4 `@theme` + HTML markup), NOT guessed.
>
> **Scope of "apply all styles":** adopt the FULL token system below into `src/design-system/mantine/theme.ts`,
> and apply the component conventions to the lero-al components/surfaces that actually exist (per the Epic MM
> migration map) — progressively, slice by slice. We do NOT clone all 500+ TailAdmin components; we match its
> visual system on our components. **Brand color stays `#EC5447`** (NOT TailAdmin's `#465fff`); everything else
> (gray, semantic, spacing, type, radius, density) is adopted.

## 1. Foundations

- **Font:** `Open Sans, sans-serif` (Outfit retired 2026-06-27 — no Cyrillic glyphs; Task 506).
- **Spacing grid:** 4px base (`--spacing: 0.25rem`). Common steps: 8 (gap), 12, 16 (card/table vertical), 20
  (card pad / table horizontal), 24 (block gap), 32.
- **Breakpoints:** sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536.

## 2. Type scale (px / line-height)

| Token | size | line-height | Use |
|---|---|---|---|
| theme-xs | 12 | 18 | labels, table headers, meta, badges |
| theme-sm | 14 | 20 | body, table cells, inputs, buttons |
| base | 16 | 24 | emphasized body |
| lg | 18 | — | card/section title |
| theme-xl | 20 | 30 | sub-heading |
| title-xs…2xl | 24 / 30 / 36 / 48 / 60 / 72 | 32 / 38 / 44 / 60 / 72 / 90 | page/hero headings |

## 3. Radius

xs 2 · sm 4 · md 6 · **lg 8 (controls)** · xl 12 · **2xl 16 (cards)** · 3xl 24 · full (pill badges).

## 4. Color palette

Adopt gray + semantic as-is; **keep brand `#EC5447`** (replace TailAdmin `brand-500 #465fff`).

| Scale | 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| gray | #f9fafb | #f2f4f7 | #e4e7ec | #d0d5dd | #98a2b3 | #667085 | #475467 | #344054 | #1d2939 | #101828 | #0c111d |
| success | #ecfdf3 | #d1fadf | — | #6ce9a6 | — | #12b76a | #039855 | #027a48 | #05603a | — | — |
| warning | #fffaeb | — | — | — | #fdb022 | #f79009 | #dc6803 | #b54708 | — | — | — |
| error | #fef3f2 | #fee4e2 | — | #fda29b | #f97066 | #f04438 | #d92d20 | #b42318 | #912018 | — | — |
| blue-light | #f0f9ff | — | — | #7cd4fd | #36bffa | #0ba5ec | #0086c9 | — | — | — | — |
| orange | #fff6ed | — | — | — | #fd853a | #fb6514 | — | — | — | — | — |

Accent: theme-pink #ee46bc · theme-purple #7a5af8. `gray-dark` #1a2231. Primary text gray-700/800; secondary text gray-500; borders gray-100/200.

## 5. Shadow

- `shadow-theme-xs` ≈ `0 1px 2px 0 rgba(0,0,0,0.05)` — subtle, used on inputs/controls.
- Content cards: **NO shadow** (flat border). Shadow (`shadow-theme-lg`) only on dropdowns/popovers/menus.

## 6. Component conventions (real classes)

| Component | TailAdmin class essence | Mantine mapping |
|---|---|---|
| **Card** (content) | `rounded-2xl border border-gray-100 bg-white p-5 sm:p-6` (no shadow) | `Card`/`Paper` radius 16, `withBorder` (gray-100), shadow none, padding 20/24 |
| **Table header** | `px-5 py-4 text-left text-xs font-medium text-gray-500` | `Table.Th` 20×16 pad, `Text size=xs fw=500 c=dimmed` |
| **Table cell** | `px-5 py-4` (text-sm gray-700/800) | `Table` `horizontalSpacing≈20`, `verticalSpacing=16`, `highlightOnHover`, row divider gray-100 |
| **Status badge** | `text-theme-xs rounded-full px-2 py-0.5 font-medium bg-{sem}-50 text-{sem}-700` | `Badge` pill, size sm, variant light, color = success/warning/error |
| **Button (primary)** | `bg-brand-500 hover:bg-brand-600 rounded-lg p-3 text-theme-sm font-medium text-white` | `Button` filled brand, radius 8, ~44px, size md, fw 500 |
| **Button (secondary/outline)** | `border border-gray-300 bg-white rounded-lg p-3 text-theme-sm font-medium text-gray-700 hover:bg-gray-50 shadow-theme-xs` | `Button` default/outline, radius 8, gray-300 border |
| **Input / Select / Textarea** | `h-11 rounded-lg border border-gray-200 bg-transparent py-2.5 px-4 text-sm text-gray-800 placeholder:text-gray-400 shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 focus:ring-3` | `TextInput`/`Select`/`Textarea` size md (h 44), radius 8, border gray-200, focus ring brand |
| **Label** | `text-theme-sm font-medium text-gray-700` | form label 14 fw500 gray-700 |

> **🔴 DENSITY CORRECTION (owner P0, Task 492, 2026-06-26):** the "size md" notes in the Button and Input/Select/Textarea
> rows above are **superseded**. Owner rejected `md` (16px) as oversized. The applied default is **`size="sm"` (14px text) +
> `minHeight:'2.75rem'` (44px / `h-11`)** for Button/TextInput/Select/Textarea/Switch (already in `theme.ts`). Read "sm/14px/44px"
> wherever these rows say "size md". TailAdmin's own controls use `text-sm`/`text-theme-sm` (14px) — this matches the reference.
| **Avatar (sm)** | `h-11 w-11 rounded-full` | `Avatar` ~44, radius full |

## 6b. Admin table BLOCK anatomy (CRM "Recent Orders" reference — exact)

The whole table is a **card**, not a bare table. Replicating this structure (not just tokens) is what makes it
look like the reference.

- **Card wrapper:** `rounded-2xl` (16) · `border border-gray-200` (#e4e7ec) · `bg-white` · `px-5 pt-5 pb-5
  sm:px-6 sm:pt-6` (20→24). Card header above table: title `text-lg font-semibold gray-800` + actions (Filter /
  See all / tabs).
- **Scroll:** `max-w-full overflow-x-auto`.
- **Thead tr:** `border-y border-gray-100` (#f2f4f7) + **`bg-gray-50`** (#f9fafb).
- **Th:** `px-6 py-3` (24×12) · `whitespace-nowrap` · `text-theme-xs` (12) · `font-medium` · `text-gray-500`
  · left · NOT uppercase.
- **Td:** `px-6 py-3` · `whitespace-nowrap` · 14px · `text-gray-700`. Row divider gray-100; hover `bg-gray-50`.
- **Composite user cell:** `flex items-center gap-3` → avatar `h-10 w-10 rounded-full` (tinted) + stack(name
  `text-theme-sm font-medium text-gray-700`, subtitle `text-theme-xs text-gray-500 mb-0.5`).
- **Status cell:** `rounded-full px-2 py-0.5 text-theme-xs font-medium bg-{sem}-50 text-{sem}-600`.
- **Action cell:** right-aligned icon buttons.

> The previous §6 "Table cell" row (20×16 from basic-tables) and this CRM block (24×12 card-wrapped) are two
> TailAdmin table densities. **Use THIS card-wrapped CRM block as the admin-table standard** — it is the owner's
> reference.

## 6c. Tabs, segmented filters, filter-dropdown (extracted 2026-06-25 — the gap that caused the unstyled tabs/filters)

TailAdmin's saved build uses **NO underline (`border-b-2`) tabs** and **NO stretched/full-width tab bars** on
desktop. Two-/multi-way switches are **segment toggles**; table filtering is a **"Filter" dropdown**, not a row
of chips. Replicate these, do not invent.

- **Segment toggle (this is what "All users / Verified agents" AND the role/status filters should look like):**
  - Container: `inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-100 p-1 dark:bg-white/3`
    — **content-width on desktop (NOT stretched)**; full-width only `<640`.
  - Item base: `rounded-md px-3 py-2 text-theme-sm font-medium text-gray-500 hover:text-gray-700`.
  - Item active: `bg-white text-gray-900 shadow-theme-xs` (selected pill).
  - Mantine mapping: `SegmentedControl` size `sm` (NOT `xs`), radius `lg` (8). It already renders the gray track +
    white active pill + `shadow-theme-xs`. Desktop: default width (content). Mobile `<640`: `fullWidth` /
    `ScrollArea scrollbars="x"` only if labels overflow at 320. **Never `grow`/stretch on desktop.**
- **Mantine `Tabs` (if used as the All/Verified switch):** `color="brand"`, `Tabs.List grow={isMobile}` —
  **compact, left-aligned on ≥640; full-width only `<640`.** `grow` (unconditional) is the stretched-tabs bug.
- **"Filter" dropdown (TailAdmin table filtering pattern):** secondary button `Filter` (`border border-gray-300
  bg-white rounded-lg px-4 py-2.5 text-theme-sm font-medium text-gray-700 hover:bg-gray-50 shadow-theme-xs` +
  icon) → opens popover `absolute right-0 z-10 mt-2 w-56 rounded-lg border border-gray-200 bg-white p-4
  shadow-lg` with labelled inputs + full-width brand **Apply** (`bg-brand-500 hover:bg-brand-600 h-10 w-full
  rounded-lg px-3 py-2 text-sm font-medium text-white`). Mantine: `Popover` + `Button` (default/filled).
  **Owner decision needed before adopting this over the current segmented chips.**
- **Table (products-list density, for reference):** `<table class="w-full table-auto">`, `thead tr border-b
  border-gray-200`, `th/td px-5 py-4` (20×16). The admin standard remains the §6b CRM card-wrapped 24×12 block.

## 6d. Form elements (extracted 2026-06-25): Select, Checkbox, Switch, Breadcrumb

- **Select (native, custom chevron):** `h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent
  bg-none px-4 py-2.5 pr-11 text-sm text-gray-800 placeholder:text-gray-400 shadow-theme-xs focus:border-brand-300
  focus:ring-brand-500/10 focus:ring-3`. Chevron icon absolutely positioned right. Mantine: `Select` size md (h 44),
  radius 8, border gray-300, focus ring brand. Option text gray-700.
- **Checkbox:** real input is `sr-only`; visual box drawn separately — Mantine `Checkbox` radius `sm` (4), brand
  checked fill, gray-300 unchecked border.
- **Switch / toggle:** `sr-only` checkbox + `peer` track; track gray-200 → brand when checked, white knob, rounded-full.
  Mantine: `Switch` size md, brand `onColor`, rounded-full track.
- **Breadcrumb:** `<nav><ol class="flex items-center gap-1.5">` → links `inline-flex items-center gap-1.5 text-sm
  text-gray-500` + chevron svg between; current page `text-sm text-gray-800`. Mantine: `Breadcrumbs` size sm,
  gray-500 links / gray-800 current.
- **Not in the static build (extract from the live site / on first use):** Modal/Dialog, DropdownMenu popover,
  Pagination, Tooltip, NavigationMenu. When a slice first needs one, extract its exact classes into a new §6e row
  before implementing — do NOT invent.

## 6e. Input / Select / Textarea / PasswordInput — FULL state matrix (authoritative; owner P0, 2026-06-28)

> **Why this section exists:** the disabled state was previously specified for the *field only* (Task 507), so the
> **label** and the **trailing icon** stayed at full strength when a field was disabled — a visible divergence from the
> source of truth that the owner rejected (Task 495). Every state below is now extracted from the source-of-truth
> components and is the **single thing rendered proof must be verified against**. A field's disabled render is correct
> ONLY when the **label, the field, the value/placeholder text, AND the trailing icon (Select chevron / PasswordInput
> reveal toggle) all dim together**. Verifying only the field is a review failure.

**Source-of-truth components (read these, do not infer):**
- `src/components/ui/input.tsx` (TextInput/Textarea trigger classes)
- `src/components/ui/select.tsx` (trigger + chevron rendered INSIDE the trigger → inherits the trigger's opacity)
- `src/components/ui/label.tsx` (label disabled treatment)

**State matrix — every input primitive (TextInput · Textarea · Select · PasswordInput):**

| State | Field (border / bg / shadow) | Label | Trailing icon | Source-of-truth class |
|---|---|---|---|---|
| **resting** | border `gray-2` (#e4e7ec) · bg transparent · `shadow-theme-xs` · text `gray-8` · placeholder `gray-4` | `text-theme-sm fw600 gray-7` (owner override of fw500) | `gray-5` region (chevron / reveal) | `border-input bg-transparent shadow … placeholder:text-muted-foreground` |
| **focus** | border `brand-3` (#F7BBB5) · ring `brand-5 @10%` 3px · no error | unchanged | unchanged | `focus-visible:border-ring focus-visible:ring-2` |
| **error** | border `red-6` (#d92d20) · **no shadow** · ring cleared (`[data-error]`, NOT `data-invalid`) | unchanged (label color does NOT turn red) | unchanged | `aria-invalid:border-destructive aria-invalid:ring-destructive/20` |
| **disabled** | bg **transparent** (NOT Mantine gray fill) · **opacity 0.5** · `cursor: not-allowed` · no focus ring · no red | **opacity 0.5 + `not-allowed`** (was MISSING) | **opacity 0.5** (was MISSING — chevron/reveal must fade with the field) | field: `disabled:cursor-not-allowed disabled:opacity-50` (TailAdmin demo: transparent bg, not `bg-input/50`); label: `peer-disabled:opacity-50 peer-disabled:cursor-not-allowed` / `group-data-[disabled=true]:opacity-50` |

**The disabled rule, restated (the part that was missed):** the source fades the WHOLE control to `opacity 0.5`. In the
shadcn/TailAdmin DOM this is automatic because (a) the chevron is a child of the trigger so it inherits the trigger's
`opacity-50`, and (b) the label carries `peer-disabled:opacity-50`. In **Mantine** the label (`.mantine-InputWrapper-label`)
and the trailing section (`.mantine-Select-section`, PasswordInput reveal button) are **siblings of the input**, so
`:disabled`/`[data-disabled]` on the input does NOT reach them. The fix must therefore dim label + section + field
**uniformly to a single 0.5** (e.g. apply opacity at the wrapper-root level when disabled, OR add explicit
`.mantine-InputWrapper-label` + section disabled rules — never stack two opacities and get 0.25). Implement in
`input-chrome.css` (never `theme.ts` inline `styles`, which freezes the cascade and drops state selectors). Final
selectors confirmed via DevTools per Task 505/506 lesson.

**Token discipline:** every value above is a Mantine theme token (`var(--mantine-color-gray-2)`, `…-brand-3`, `…-red-6`,
`var(--mantine-shadow-xs)`); no raw hex/px in CSS. Opacity `0.5` and `cursor: not-allowed` are the source-of-truth
literals (no token exists for them).

> **🔴 Always-verify-styles gate (owner P0, 2026-06-28):** any task touching an input/select primitive — and every
> review of one — MUST verify the rendered output of EACH state in this matrix (resting/focus/error/disabled, label +
> field + icon) against this section, with rendered evidence at the canonical breakpoints × sq/en/uk/it. "tsc=0 /
> build green" is never proof of a style. If a state is not yet documented here, extract it from the source-of-truth
> component into this matrix BEFORE implementing — do not invent or guess.

## 6f. Checkbox — FULL state matrix (authoritative; owner P0, 2026-06-28)

> Extracted from the source-of-truth components — do not infer:
> - `src/components/ui/checkbox.tsx` (box + indicator classes)
> - `src/components/ui/label.tsx` (label disabled treatment — shared with §6e)
> - §6d row ("Checkbox: real input `sr-only`; Mantine `Checkbox` radius `sm` (4), brand checked fill, gray-300 unchecked border")
>
> Same disabled discipline as §6e: when disabled, the **whole control dims (box + label) uniformly to opacity 0.5** —
> source carries `disabled:opacity-50` on the box AND `group-has-disabled/field:opacity-50` on the field wrapper.
> Verifying only the box is a review failure.

**Box geometry:** `size-4` = **16px box**, `rounded-[4px]` = **4px corner**, check icon `size-3.5` = **14px**. (Note: Mantine
`radius='sm'` = 4px ✅, but Mantine checkbox `size='sm'` ≈ 20px — confirm at runtime which Mantine `size` yields the **16px**
box, likely `size='xs'`; pin it in `theme.ts` `Checkbox.defaultProps` and document.)

| State | Box | Check mark | Label | Source-of-truth class |
|---|---|---|---|---|
| **unchecked (resting)** | border `gray-3` (#d0d5dd) · transparent bg · 16px · radius 4px | none | `text-sm` `gray-7` (#344054), wraps, ≥44px tap row | `border border-input` |
| **checked** | bg `brand-7` (#EC5447, `primary`) · border `brand-7` · white check | white `CheckIcon` 14px | unchanged | `data-checked:bg-primary data-checked:border-primary data-checked:text-primary-foreground` |
| **indeterminate** | same fill as checked (brand) · dash glyph | white dash | unchanged | (not in source box-component — Mantine `indeterminate` prop; STOP-and-ASK if a consumer needs it before styling) |
| **focus** | ring (brand region) + brand border, keyboard-visible only | — | unchanged | `focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring` |
| **error** | border `red-6` (#d92d20) + ring; **checked+error keeps brand border** | — | unchanged | `aria-invalid:border-destructive aria-invalid:ring-destructive/20` · `aria-invalid:aria-checked:border-primary` |
| **disabled** | **opacity 0.5** · `cursor: not-allowed` · no focus ring | dims with box | **opacity 0.5** (dims with box — was the §6e-class miss) | box `disabled:opacity-50`; field `group-has-disabled/field:opacity-50`; label `peer-disabled:opacity-50` |

**Mantine selector reality (confirm via DevTools, like §6e):** box = `.mantine-Checkbox-input`, label = `.mantine-Checkbox-label`,
icon = `.mantine-Checkbox-icon`. These are siblings inside `.mantine-Checkbox-root` → `:disabled` on the box does NOT reach
the label. Dim the whole control uniformly (root-level opacity, like §6e Part 1) — never stack two opacities (0.25). State
chrome that Mantine's `radius`/`color` props cannot express lives in `input-chrome.css`, NOT `theme.ts` inline `styles`.

**Token discipline:** brand `var(--mantine-color-brand-7)`, gray `…-gray-3`, red `…-red-6`; `opacity:0.5` + `cursor:not-allowed`
are source literals; `rounded-[4px]` maps to `radius='sm'` (4px), no raw px in CSS.

> **🔴 Always-verify-styles gate (owner P0, 2026-06-28):** every state above is verified against the rendered Checkbox at
> the canonical breakpoints × sq/en/uk/it before approval. `tsc=0`/build-green is never style proof.

## 6g. Radio — FULL state matrix (authoritative; owner P0, 2026-06-28)

> Extracted from the source-of-truth components — do not infer:
> - `src/components/ui/radio-group.tsx` (circle + indicator classes)
> - `src/components/ui/label.tsx` (label disabled treatment — shared with §6e/§6f)
>
> Same disabled discipline as §6e/§6f: when disabled, the **whole control dims (circle + label) uniformly to opacity 0.5** —
> source carries `disabled:opacity-50` on the circle AND `peer-disabled:opacity-50` on the label.
> Verifying only the circle is a review failure.

**Circle geometry:** `size-4` = **16px circle**, `rounded-full` = **full radius**, center dot `size-2` = **8px white**. Mantine
`size='sm'` ≈ 20px — confirm at runtime which Mantine `size` yields the **16px** circle (likely `size='xs'`, same as Checkbox);
pin it in `theme.ts` `Radio.defaultProps` and document.

| State | Circle | Dot | Label | Source-of-truth class |
|---|---|---|---|---|
| **unchecked (resting)** | border `gray-3` (#d0d5dd) · transparent bg · 16px · `rounded-full` | none | `text-sm` `gray-7` (#344054), wraps, ≥44px tap row | `border border-input` |
| **checked** | bg `brand-7` (#EC5447) · border `brand-7` · 8px white center dot | `bg-primary-foreground` white 8px | unchanged | `data-checked:bg-primary data-checked:border-primary data-checked:text-primary-foreground` |
| **focus** | keyboard-visible brand ring + brand border (not on mouse) | — | unchanged | `focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring` |
| **error** | border `red-6` (#d92d20) + ring; **checked+error keeps brand border** | — | unchanged | `aria-invalid:border-destructive aria-invalid:ring-destructive/20` · `aria-invalid:aria-checked:border-primary` |
| **disabled** | **opacity 0.5** · `cursor: not-allowed` · no focus ring | dims with circle | **opacity 0.5** (dims with circle) | `disabled:opacity-50`; label `peer-disabled:opacity-50` |

**Mantine selector reality (confirm via DevTools, like §6e/§6f):** circle = `.mantine-Radio-radio`, dot = `.mantine-Radio-icon`,
label = `.mantine-Radio-label`, root = `.mantine-Radio-root`. These are siblings inside the root → `:disabled` on the circle
does NOT reach the label. Dim the whole control uniformly (root-level opacity, like §6e/§6f Part 1) — never stack two
opacities (0.25). **Error attribute: Mantine emits `data-error` (not `aria-invalid`) via `mod:{error:!!error}` in `Radio.mjs`
~L137** — same as Checkbox. State chrome that Mantine's `size`/`color` props cannot express lives in `input-chrome.css`,
NOT `theme.ts` inline `styles`.

**Token discipline:** brand `var(--mantine-color-brand-7)`, gray `…-gray-3`, red `…-red-6`; `opacity:0.5` + `cursor:not-allowed`
are source literals; `rounded-full` = Mantine default Radio shape, no raw px in CSS.

> **🔴 Always-verify-styles gate (owner P0, 2026-06-28):** every state above is verified against the rendered Radio at
> the canonical breakpoints × sq/en/uk/it before approval. `tsc=0`/build-green is never style proof.

## 7. Application plan

1. **Task 484 (MM.0):** encode §1–§5 tokens + §6 core component defaults (Card, Table, Badge, Button, Input,
   Select, Textarea, focus ring) into `theme.ts`; cite this doc from `mantine-responsive-design-system.md` §6.
2. **MM slices:** each surface/primitive migration applies the §6 conventions for the components it uses,
   consuming theme tokens (zero raw spacing px).
3. **Gate:** any migrated surface that hand-rolls spacing/color instead of theme tokens FAILS review.
