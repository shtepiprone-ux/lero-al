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

- 🔴 **`shadow-theme-xs`** (corrected 2026-07-03, Task 531, `demo_tailadmin_com.zip` `css/style.css` line 3743-3744,
  literal Tailwind v4 `--tw-shadow` value — authoritative, not approximated): **`0px 1px 2px 0px rgba(16, 24, 40,
  0.05)`** — subtle, gray-900-tinted (NOT pure black), used on inputs/controls. Applied via `theme.shadows.xs`
  override in `theme.ts` (grep-verified 2026-07-03: input family via `input-chrome.css` resting box-shadow,
  Button secondary/outline `boxShadow`, `SegmentedControl` auto-resolved `--sc-shadow`, and the two
  `Paper shadow="xs"` pattern consumers — `MantineFormSectionStack`/`MantineNotificationPattern` — all consume
  `var(--mantine-shadow-xs)`; none regress, no diverging siblings).
- 🔴 **`shadow-theme-lg`** (extracted 2026-07-02, Task 530, `demo_tailadmin_com.zip` `css/style.css` line 3728-3731,
  literal Tailwind v4 `--tw-shadow` value — authoritative, not invented): **`0px 12px 16px -4px rgba(16, 24, 40,
  0.08), 0px 4px 6px -2px rgba(16, 24, 40, 0.03)`**. Applied via `theme.shadows.lg` override in `theme.ts` (grep-
  verified 2026-07-02: only `Popover`/`Menu` `defaultProps.shadow:'lg'` consume the `lg` key in `src/` — safe to
  override globally, no sibling regression). Scoped to the desktop (`≥640`) anchored `Popover`/`DropdownMenu`/
  `NavigationMenu` panels only — Modal/Drawer default to `shadow='xl'` (Mantine `ModalBase` default), unaffected.
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
| **Button (link/tertiary)** — *see §6a-link note* | transparent bg (no fill even on hover) · **no border** · `text-theme-sm font-medium` (14/500) · text `gray-700` (`#344054`) · icon-left, gap 12px · radius `lg` (8) · ≥44px touch | `Button variant="transparent"`; `color` per use (gray-7 default · **red** for destructive/logout · brand for primary-link); left-aligned with **no left padding** when siblings are flush-left nav text |
| **Input / Select / Textarea** | `h-11 rounded-lg border border-gray-200 bg-transparent py-2.5 px-4 text-sm text-gray-800 placeholder:text-gray-400 shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 focus:ring-3` | `TextInput`/`Select`/`Textarea` size md (h 44), radius 8, border gray-200, focus ring brand |
| **Label** | `text-theme-sm font-medium text-gray-700` | form label 14 fw500 gray-700 |

> **🔴 DENSITY CORRECTION (owner P0, Task 492, 2026-06-26):** the "size md" notes in the Button and Input/Select/Textarea
> rows above are **superseded**. Owner rejected `md` (16px) as oversized. The applied default is **`size="sm"` (14px text) +
> `minHeight:'2.75rem'` (44px / `h-11`)** for Button/TextInput/Select/Textarea/Switch (already in `theme.ts`). Read "sm/14px/44px"
> wherever these rows say "size md". TailAdmin's own controls use `text-sm`/`text-theme-sm` (14px) — this matches the reference.
| **Avatar (sm)** | `h-11 w-11 rounded-full` | `Avatar` ~44, radius full |

> **🔴 §6a-link note — link/tertiary button (owner P0, 2026-07-13, Task 587; clause-16a honest-negative + live capture).**
> The TailAdmin `/buttons` gallery ships ONLY primary (filled) + secondary (white/border) — it has **no** text/link/ghost
> button. The authoritative icon-left, borderless, transparent control in TailAdmin is the **sidebar `menu-item`**, live-captured
> by the orchestrator (provenance: `demo.tailadmin.com/buttons`, `getComputedStyle`, 2026-07-13):
> **resting** `color:#344054 (gray-700) · background:transparent · border:none · font 14px/500 · padding 8px 12px · gap 12px ·
> border-radius 8px`; **active** `color:brand · background:brand-50` (demo `#465fff`/`#ECF3FF` → project brand `#EC5447` / brand-50
> `#FDEEED`). **Owner override (2026-07-13): pure Link behavior — NO hover/press background fill** (the menu-item's gray-100 hover
> is intentionally NOT adopted); hover = text-darken only, which is exactly Mantine's built-in `variant="transparent"`. Destructive
> logout uses `color="red"` (red-600/700 text). This row is the single source of truth for the new themed `transparent` Button variant.

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
| **resting** | border **`gray-3` (#d0d5dd)** · bg transparent · `shadow-theme-xs` · text `gray-8` · placeholder `gray-4` | `text-theme-sm fw600 gray-7` (owner override of fw500) | `gray-5` region (chevron / reveal) | `border-input bg-transparent shadow … placeholder:text-muted-foreground` |

> **🔴 RESTING BORDER = `gray-3` (#d0d5dd) — OWNER DECISION 2026-07-02 (supersedes the 2026-06-27 `gray-2` decision).**
> Aligned to the live TailAdmin `/form-elements` render (measured `rgb(208,213,221)` = gray-300). The input correction
> slice MUST change `input-chrome.css` resting `border-color` from `--mantine-color-gray-2` → `--mantine-color-gray-3` for
> **`.mantine-TextInput-input`, `.mantine-Textarea-input`, `.mantine-Select-input`, `.mantine-PasswordInput-input`**. Focus
> (`brand-3`) and error (`red-6`) borders are unchanged.
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

## 6h. Switch — FULL state matrix (authoritative; owner P0, 2026-06-28)

> Extracted from the source-of-truth components — do not infer:
> - `src/components/ui/switch.tsx` (track + thumb classes)
> - `src/components/ui/label.tsx` (label disabled treatment — shared with §6e/§6f/§6g)
>
> Same disabled discipline as §6e/§6f/§6g: when disabled, the **whole control dims (track + thumb + label) uniformly to
> opacity 0.5**. Source carries `data-disabled:opacity-50` on the track root AND the label dims via root compositing.
> Verifying only the track is a review failure (the §6e/§6f/§6g/§6h failing pattern).

**Track geometry (default density, Mantine `size='sm'`):** source default = `h-[18.4px] w-8` (≈18×32px) + 16px thumb.
Mantine sizes: `xs`=16px×32px (thumb 12px), `sm`=20px×38px (thumb 14px), `md`=24px×46px (thumb 18px). Neither `xs` nor
`sm` is an exact match; `sm` is the closest height match and is the approved density (`theme.ts` Task 499 — see density
correction note §6 header). **Owner to verify the rendered track height in DevTools; if the exact 18.4px source density is
required, a CSS pin would be added.**

| State | Track | Thumb | Label | Source class |
|---|---|---|---|---|
| **unchecked (resting)** | bg `var(--color-input)` = neutral-300 (#DEDEDE) · no base border · `rounded-full` | white, at rest-left | `text-sm` `gray-7` (#344054), wraps, ≥44px tap row | `data-unchecked:bg-input` |
| **checked** | bg `brand-7` (#EC5447) | white, slid right | unchanged | `data-checked:bg-primary` |
| **focus** | keyboard-visible brand ring (3px box-shadow) · not on mouse | — | unchanged | `focus-visible:border-ring focus-visible:ring-3` |
| **error** | inset `red-6` (#d92d20) border-sim + 3px outer ring; **checked+error keeps brand fill** | — | unchanged | `aria-invalid:border-destructive` → Mantine `[data-error]` on track |
| **disabled** | **opacity 0.5** · `cursor: not-allowed` · no focus ring | dims with track (root compositing) | **opacity 0.5** (dims with track) | `data-disabled:opacity-50`; label dims too |

**Mantine selector reality (confirmed via Switch.mjs source):** track = `.mantine-Switch-track`, thumb =
`.mantine-Switch-thumb`, input (visually hidden, a11y only) = `.mantine-Switch-input`, label = `.mantine-Switch-label`,
root = `.mantine-Switch-root`. The input is `opacity:0 position:absolute` — it drives events but is never seen.
**`data-error` lands on `.mantine-Switch-track`** (`Switch.mjs ~L153 mod:{error,...}`) — NOT on root or input.
`data-checked` lands on `.mantine-Switch-root` and `.mantine-Switch-input`. Focus ring: `input:focus-visible +
.mantine-Switch-track` (adjacent sibling — input precedes track in DOM). **Disabled: do NOT reset input opacity to 1**
(the input's `opacity:0` is for visual hiding, not for disabled; resetting would un-hide it). Root `:has(:disabled)`
opacity 0.5 composites track, thumb, and label uniformly — no Part 2 element reset needed for Switch.

**Token discipline:** `var(--color-input)` for unchecked track (exact `--input` token = neutral-300 = #DEDEDE; §6d
documents "gray-200" but the actual token maps to #DEDEDE — between gray-2/#e4e7ec and gray-3/#d0d5dd; Mantine's own
default is gray-3; owner to confirm preference in DevTools). Brand `var(--mantine-color-brand-7)`, red
`var(--mantine-color-red-6)`; `opacity:0.5` + `cursor:not-allowed` are source literals.

> **🔴 Always-verify-styles gate (owner P0, 2026-06-28):** every state above is verified against the rendered Switch at
> the canonical breakpoints × sq/en/uk/it before approval. `tsc=0`/build-green is never style proof.

## 6i. Canonical responsive Select + dropdown bottom-sheet mechanism (Tasks 509 + 510)

> **Canonical component:** `MantineSelect` — `src/design-system/mantine/patterns/MantineSelect.tsx`.
> ONE responsive Select: anchored dropdown at ≥640, full-width bottom sheet at <640. No dual-path imports.
> Reusable foundation: `useResponsiveDropdown()` hook + `bottomSheetDrawerStyles` const (both exported from
> `MantineSelect.tsx`). Batch C overlays (Menu / Popover / Combobox / NavigationMenu) consume these —
> no per-overlay copy-paste. Full specification: `docs/mantine-responsive-design-system.md` §19.

| Aspect | Value |
|---|---|
| Breakpoint | `<40em` (640px) = bottom sheet; `≥40em` = anchored dropdown |
| Sheet chrome | `borderRadius: var(--mantine-radius-lg) ... 0 0` · `maxHeight: 90dvh` · `inner.padding: 0` |
| Drag handle | `width: 2.5rem` · `height: 0.25rem` · `borderRadius: 9999px` · `bg: var(--mantine-color-gray-3)` |
| Option rows | `mih: 2.75rem` (≥44px) · `py: sm (12px)` · `px: md (16px)` · `whitespace: normal` · `wordBreak: break-word` |
| Trigger width | `w={{ base: '100%', sm: 'auto' }}` — P0 full-width at mobile |
| Story | `src/stories/mantine/primitives/Select.stories.tsx` Default sections 5–7 |

## 6j. Canonical responsive Popover (Task 513, Batch C P1.18)

> **Canonical component:** `MantinePopover` — `src/design-system/mantine/patterns/MantinePopover.tsx`.
> ONE responsive Popover: anchored Mantine Popover at ≥640, full-width bottom sheet at <640. Consumes the
> Task 509 foundation (`useResponsiveDropdown` + `bottomSheetDrawerStyles` from `MantineSelect.tsx`) — no
> per-component copy-paste. Full specification: `docs/mantine-responsive-design-system.md` §20.

| Aspect | Value |
|---|---|
| Breakpoint | `<40em` (640px) = bottom sheet; `≥40em` = anchored Mantine Popover |
| API | `trigger: ReactNode` · `children: ReactNode` · `defaultOpened?` · `disabled?` · `title?` · `position?` · `width?` · `withArrow?` · `offset?` |
| Sheet chrome | Same `bottomSheetDrawerStyles` as `MantineSelect` (top-only radius, ≤90dvh, inner padding 0) |
| Drag handle | Replicated from `MantineSelect` private `DragHandle` (2.5rem × 0.25rem, gray-3, radius 9999px) |
| Story | `src/stories/mantine/primitives/Popover.stories.tsx` Default (4 sections) |

## 6k. Tooltip — chrome (extracted 2026-07-02 from the LIVE demo; NOT in the supplied zip)

> **Source of truth:** `https://demo.tailadmin.com/tooltips.html` — read from the rendered DOM (class list + computed
> styles) via the browser, 2026-07-02. The supplied `demo_tailadmin_com.zip` contains **no generic UI tooltip** (only
> 3rd-party `.jvm-tooltip` / `.apexcharts-tooltip` / `.leaflet-tooltip`), so the live component is the reference. Two
> variants (Dark = default, White), each offered with and without an arrow. Values below are the extracted truth — consume
> them; do NOT invent or re-derive.

**Common bubble (both variants):**
`hidden absolute z-99999 whitespace-nowrap rounded-lg border px-3.5 py-2 text-xs font-medium shadow-md`
- **radius:** `rounded-lg` = **8px** (computed `border-radius: 8px`).
- **padding:** `px-3.5 py-2` = **8px 14px** (computed `padding: 8px 14px`).
- **type:** `text-xs` = **12px**, `font-medium` = **500**, Outfit.
- **shadow:** `shadow-md` = `0 4px 6px -1px rgba(0,0,0,.1), 0 2px 4px -2px rgba(0,0,0,.1)`.
- single-line on desktop (`whitespace-nowrap`); our mobile bottom-sheet body overrides to wrap.

**Dark (DEFAULT variant):** `bg-gray-800 text-white` — bg **`#1d2939`** (gray-800, computed `rgb(29,41,57)`), text **white**;
**no border**.

**White variant:** `bg-white text-gray-700 border border-gray-200` — bg **white**, text **`#344054`** (gray-700, computed
`rgb(52,64,84)`), **1px border `#e4e7ec`** (gray-200).

**Arrow:** TailAdmin ships with-arrow and without-arrow variants; the arrow is a **same-color square** matching the bubble
bg (no separate border color). Mantine `Tooltip` `withArrow` reproduces this (arrow inherits the bubble background).

**Mantine mapping (`MantineTooltip`, Task 524):** Mantine `Tooltip` — **default = Dark**: background gray-800 `#1d2939`,
white text, `size` → 12px label, radius = TailAdmin `lg` (8px) token, padding 8px 14px, `shadow-md`, `withArrow` (arrow =
bubble bg). White variant = bg-white / text gray-700 / 1px gray-200 border / `shadow-md`. `<640` the content is surfaced via
the shared `ResponsiveBottomSheet` (P0), so this chrome applies to the **≥640 anchored tooltip**; the mobile sheet keeps the
canonical bottom-sheet chrome.

> **🔴 Intentional divergence — wrap, not nowrap (Task 526, owner rejection 2026-07-02):** the `whitespace-nowrap` line
> above is correct for TailAdmin's own SHORT demo labels, but our tooltips carry long, localized labels (sq/en/uk/it).
> Owner rendered review caught the long label running off-screen (clipped) at `it@680` under `nowrap`. `MantineTooltip`
> therefore overrides this ONE property: `multiline` + `maw="16.25rem"` (260px, chosen within a 240–320px range) so long
> content WRAPS onto multiple lines within a sane bubble width instead of clipping/overflowing the viewport; short labels
> still render compactly (no forced width). Every other §6k value (bg, text, radius, padding, shadow, arrow) is
> unchanged.

## 6l. Composition & spacing rhythm — THE MISSING LAYER (browser-measured live, 2026-07-02)

> **Why this section exists (owner P0, 2026-07-02).** §1–§6k captured tokens + per-control chrome but NOT the
> **composition/spacing rhythm** — the gaps between heading→text→buttons, button-group spacing, section rhythm, and exact
> per-component padding. That omission is why the rendered Storybook primitives sit in the wrong spacing even when their
> chrome is right. These values are **measured directly from the live TailAdmin demo via `getComputedStyle` (orchestrator,
> not self-report)** and are the source of truth. **This is an in-progress systematic re-extraction** — component pages
> measured so far are listed; the rest are being measured page by page.

**Buttons (`demo.tailadmin.com/buttons`, measured):**
- Primary: bg brand, radius **8px**, padding **12px 16px** (py-3 px-4), **14px / 500**, icon-gap 8px.
- Secondary: bg white, text **gray-700 `#344054`**, border **gray-200 `#e4e7ec`**, radius 8px, padding 12×16, 14px/500.
- **Button-group gap: 20px** (gap-5) between sibling buttons.
- Section heading above a button block: **16px / 500 / gray-800 `#1d2939`**.

**Popover / content-card rhythm (`demo.tailadmin.com/popovers`, measured):**
- Container: white, **1px border gray-200 `#e4e7ec`**, radius **12px** (`rounded-xl`), drop shadow.
- **Title → body text: 8px** (title `margin-bottom: 8px`); title **16px / 600 / gray-900 `#101828`**.
- **Body text → action buttons: 16px** (paragraph `margin-bottom: 16px`); body **14px / gray-500 `#667085` / line-height 20px**.
- Promo/content card variant: radius **16px** (`rounded-2xl`), padding **20px 16px**, bg gray-50.

**Tooltip:** padding 8px 14px, radius 8px (see §6k for full chrome).

**Alerts (`/alerts`, measured):** container `rounded-xl` = **12px**, **1px border semantic-500**, bg **semantic-50**,
padding **16px** (p-4). Title **14px / 600 / gray-800 `#1d2939`**, `margin-bottom 4px`. Body **14px / gray-500 `#667085`
/ line-height 20px`. Variants: success (border `#12b76a` / bg `#ecfdf3`) · warning (`#f79009` / `#fffaeb`) · error
(`#f04438` / `#fef3f2`) · info (blue-light).

**Cards (`/cards`, measured):** shell `rounded-2xl` = **16px**, **1px border gray-200 `#e4e7ec`**, bg white, **no shadow**.
Title **16px / 500 / gray-800 `#1d2939`**; body text 14px / gray-500. Body padding p-5/p-6 (20/24px); image cards are
full-bleed (padding 0 on shell, inner section padded). 🔴 **Correction flag:** our theme sets Card border = `gray-1`
(gray-100 `#f2f4f7`) — TailAdmin's live `/cards` is **gray-200 `#e4e7ec`**. Fix Card border token to gray-2.

**Dropdowns / menus (`/dropdowns`, measured):** container `rounded-2xl` (16px), **1px border gray-200 `#e4e7ec`**,
padding **12px**, **`shadow-theme-lg`**, width ~260px. Items: **14px / gray-700 `#344054`**, padding **8–10px × 12px**,
radius **8px** (`rounded-lg`). 🔴 Confirms audit: our `MantinePopover`/`DropdownMenu`/`NavigationMenu` desktop panels are
missing `shadow-theme-lg` + this exact padding/item chrome.

**Modals (`/modals`, measured — preview cards; full dialog needs trigger to confirm radius/padding):** content rhythm
matches the popover/card rhythm — **title→body 8px**, **body→action-buttons 16px**; title 16px/600/gray-900 (promo) or
16px/500/gray-800 (section). Modal shell border gray-200, radius 2xl+ (confirm rounded-3xl=24px on a triggered dialog).

**Badge (`/badge`, measured):** `rounded-full` pill; default variant **14px / 500**, padding **2px 10px**, bg semantic-50
/ text semantic (brand-50 bg `#ecf3ff` + brand text, success/warning/error analogues). 🔴 A smaller **12px** variant also
exists (§6/§6b text-theme-xs) — capture both sizes; our theme Badge `size='sm'` must map to the correct one per usage.

**Avatars (`/avatars`, measured):** `rounded-full`; sizes consumer-set (24 / 32 / 40 / 44 / 64px seen); online/offline
status **dot 8px** (`h-2 w-2`) positioned top-right, semantic bg. Matches our theme (`radius='pill'`, size by consumer).

**Tabs (`/tabs`, measured):** the canonical tab bar is the **segmented style** (confirms §6c) — track `bg-gray-100`,
padding **4px** (`p-1`), radius **8px** (`rounded-lg`), `overflow-x-auto`; items **14px**, active = **white pill + shadow**,
inactive gray. (NOT underline `border-b-2` tabs.) Our `SegmentedControl`/`Tabs` theme must render the gray-100 track +
white active pill.

**Pagination (`/pagination`, measured):** item **gap 8px**; Prev/Next: white bg, text gray-700, **1px border gray-300
`#d0d5dd`**, radius **8px**, height 42px, 14px; active page number **40×40**, bg **brand**, white text, radius 8px;
inactive numbers transparent/gray-700, hover gray-50.

**Progress (`/progress-bar`, measured):** track bg **gray-200 `#e4e7ec`**, fill **brand**, `rounded-full` (pill), track
heights **8 / 12 / 16 / 20px** (sm/md/lg/xl); fill height = track height.

**Breadcrumb (`/breadcrumb`, measured):** item **gap 6px** (`gap-1.5`); links **gray-500 `#667085` / 14px**, current page
**gray-800 `#1d2939` / 14px**; chevron/slash separator gray-400.

**Form Elements (`/form-elements`, measured — the input-family composition):**
- **Label: 14px / 500 / gray-700 `#344054`, `display:block`, `margin-bottom: 6px`** → the label→field gap is **6px**.
- **Input/Select/Textarea field: height 44px, 1px border gray-300 `#d0d5dd`, radius 8px, padding 10px 16px (py-2.5 px-4),
  14px, text gray-800 `#1d2939`.**
- 🔴 **Correction flags:** (a) resting border → **gray-300 `#d0d5dd`** — **OWNER DECIDED 2026-07-02** (align to live
  TailAdmin; `input-chrome.css` gray-2→gray-3 for TextInput/Textarea/Select/PasswordInput; supersedes 2026-06-27 gray-2).
  (b) our input theme sets no explicit **padding** → Mantine `size='sm'` padding ≠ TailAdmin 10×16; must set.
  (c) label→field 6px gap must be enforced (our InputWrapper relies on Mantine default).

**Notifications / Toast (`/notifications`, measured):** notification card `rounded-xl` (12px), 1px border gray-200,
bg white, padding **20px** (p-5), body 14px/gray-500. Compact toast: white bg, **`rounded-md` (6px), padding 12px (p-3)**,
`gap-3`, **semantic left accent** (success `#12b76a` / info `#0ba5ec` / warning `#f79009` / error), max-width ~340px.

**Spinners (`/spinners`, measured):** SVG, track **gray-200 `#e4e7ec`**, stroke **brand-500**, sizes **20 / 28 / 36 / 40px**.

**Links (`/links`, measured):** **14px, no underline** (default); color variants — default gray-500 `#667085` · brand
`#465fff` · success `#12b76a` · error `#f04438`.

**List (`/list`, measured):** `list-style:none`, flex column, **gap-based spacing (4–6px)**; items 14–16px. (Ordered/marker
variants use standard markers.)

**Ribbons (`/ribbons`, measured):** brand bg, white **14px / 500**, padding **6px 16px**; shapes `rounded-r-full` /
rotated -45° corner. (Decorative — not a core Storybook primitive.)

**Carousel (`/carousel`, measured):** nav dots **8px** `rounded-full`; nav arrows ~38px, bg gray-50, radius 8px; slide
images rounded per usage.

**Images (`/images`, measured):** `rounded-xl` (12px), optional 1px border gray-200.

**Videos (`/videos`, measured):** aspect-ratio wrappers (16/9 · 4/3 · 1/1), **`rounded-lg` (8px), `overflow-hidden`**; the
outer "video card" is `rounded-2xl` (16px) + 1px gray-200 border.

### UI Elements sweep — full-section checklist (owner P0: complete pass, not point-fixes — ALL 22 PAGES)
✅ Buttons · ✅ Buttons Group (gap 20px) · ✅ Popovers · ✅ Tooltips · ✅ Alerts · ✅ Cards · ✅ Dropdowns ·
🟡 Modals (preview measured; trigger dialog to confirm shell) · ✅ Badge · ✅ Avatars · ✅ Tabs · ✅ Pagination ·
✅ Notifications (→Toast) · ✅ Progress Bars · ✅ Spinners · ✅ Breadcrumb · ✅ List · ✅ Links · ✅ Ribbons ·
✅ Carousel · ✅ Images · ✅ Videos → **UI Elements = 22/22 ✅.**

**Tables + Forms (also in scope, owner 2026-07-02):**
- **Basic Tables (`/basic-tables`, measured):** wrapper `rounded-xl` (12px) + **1px border gray-200 `#e4e7ec`** +
  `overflow-hidden`, bg white. thead transparent bg, **border-b 1px gray-100 `#f2f4f7`**; th padding **12px 24px**; td
  padding **16px 24px**; row dividers gray-100. Header/cell TEXT sits on an inner element (~12px gray-500 header / 14px
  gray-700 cell — confirm the inner node). (§6b CRM variant = 24×12 both; Basic = 12×24 th / 16×24 td — two densities.)
- **Data Tables (`/data-tables`):** = Basic table body + a toolbar (search input + "entries" Select) above and pagination
  below — reuses the input/select/pagination chrome already measured. (Measure toolbar precisely during the table slice.)
- **Form Layout (`/form-layout`, measured):** form CARD `rounded-2xl` (16px) + **1px border gray-200**, bg white; card
  **header** title **16px / 500 / gray-800 `#1d2939`** with a **bottom divider**; header + body each padded (p-5/p-6);
  field-to-field vertical gap via container `space-y` (≈20px — confirm precisely during the form slice).
- ✅ Forms→Form Elements (input family — label mb 6px, field 44 / border-gray-300 / padding 10×16 / 14px / text gray-800).

**Sweep status: COMPLETE — UI Elements 22/22 + Basic Tables + Form Elements + Form Layout all measured (orchestrator,
in-browser).** Every one of the 20 Storybook primitives has a measured composition/chrome row above. Only precise
sub-measurements deferred to their own correction slice: Data-Tables toolbar, exact form field-group gap, and the Modal
shell radius/padding (needs a triggered dialog). This §6l is the source of truth for the re-audit + correction slices.

**🔵 Addendum — Overlay footer button-group + Popover radius (measured live 2026-07-02, orchestrator `getComputedStyle`, for Task 528 D3):**
- **Overlay footer button-group gap = 12px (`gap-3`)** — measured on BOTH `demo.tailadmin.com/popovers` ("Popover with Button" footer: `mt-5 flex items-center gap-3`) AND `demo.tailadmin.com/modals` (every dialog footer: `flex items-center justify-end w-full gap-3 mt-6|8`). Footer is **right-aligned (`justify-end`)** on desktop, top margin `mt-6/mt-8`. 🔴 **Correction flag (D3):** our Modal/Drawer/Popover story footers use **20px (`gap="lg"`)** — that 20px is the STANDALONE `/buttons` group value (line 381), NOT the overlay-footer value. Overlay footers must use **12px**.
- **Popover container radius = 12px (`rounded-xl`)**, 1px border gray-200 `#e4e7ec`, container padding 0 (inner sections padded), title 16px. 🔴 **Correction flag (D3):** our `theme.ts` sets Popover `radius:'2xl'` (**16px**) — wrong; Popover = **12px (`xl`)**. (Dropdowns/menus stay 16px `rounded-2xl` per the Dropdowns row — the two are intentionally different.)
- **Badge per-usage mapping (D2 clarification):** the app's STATUS badges (Active/Pending/Blocked/Archived) are the **12px `text-theme-xs`** variant (§6/§6b), NOT the 14px large variant (line 411). Our theme Badge `size='sm'` (the status default) must map to **12px / 500 / padding 2×8–10 / line-height 18px**, not 14px.

**Each correction slice is BLOCKED until its row here is measured + cited. No primitive is fixed before its composition
row exists.**

## 6m. Page content column — the showcase-page shell (Task 536, measured live + zip-cited, 2026-07-03)

> **Why this exists.** Every Mantine primitive story rendered `skipCanvas`+`fullscreen` + a bare `<Box p="xl">` —
> padding but no width cap, so at ≥640 the primitive stretches edge-to-edge. TailAdmin's own pages (e.g.
> `/buttons`, `/alerts`) do NOT do this: the page content sits in a **centered, width-capped column** on a
> gray page background. This row is the extracted, cited source of truth for that shell.

**Extraction method:** the zip has no dedicated "UI Elements showcase" page (only full dashboard routes), so
the column was measured on the LIVE site (`demo.tailadmin.com/buttons`, `/alerts`) at 1920px and 2560px
viewports via `getComputedStyle`/`getBoundingClientRect`, then cross-checked against the zip's own
`css/style.css` custom-property definitions (not invented — every number below traces to one of the two).

- **Content-column wrapper (inside `<main>`):** class `mx-auto max-w-(--breakpoint-2xl) p-4 pb-20 md:p-6 md:pb-6`.
  - **Max-width = `var(--breakpoint-2xl)` = `1536px`** — confirmed in the zip (`css/style.css`:
    `--breakpoint-2xl: 1536px;`) AND measured live (wrapper `getBoundingClientRect().width` = exactly 1536 at
    both 1920px and 2560px viewports — i.e. the wrapper stops growing past 1536, centered via `mx-auto` with
    gray page background showing on both sides above that width).
  - **Padding:** `16px` (`p-4`) below `md` (768px), `24px` (`md:p-6`) at ≥768px; bottom padding `80px`
    (`pb-20`) below `md`, `24px` (`md:pb-6`) at ≥768px (dashboard-specific bottom pad, NOT required for the
    Storybook shell — cited for completeness).
  - **Below 1536px** (i.e. at every viewport this project's canonical breakpoints actually test, 320→1440) the
    wrapper is NOT capped — it fills 100% of its parent (`mx-auto` + `max-width` only constrain ABOVE the cap).
- **Page background:** `rgb(249, 250, 251)` = **gray-50 `#f9fafb`** (matches `--color-gray-50` in the zip, §4).
- **Card chrome inside the column** (reconciles with, does not diverge from, the existing §6 Card row): bg
  **white**, **1px border gray-200 `#e4e7ec`**, radius **16px (`rounded-2xl`)**, **no shadow** — byte-identical
  to §6's existing `Card`/`Paper` row and §5's "Content cards: NO shadow" line. No new chrome value invented;
  this row only adds the OUTER page/column layer that was previously undocumented.

**Application to the Storybook shell (`_MantineStoryShell`):** the shell reproduces the wrapper class
(`mx-auto`, capped `1536px` at ≥640, responsive padding) and the gray page background at the STORY level —
the `<640` full-bleed requirement (P0 mobile gate) is layered on top per Task 536's Rule: `<640` = full-bleed
edge-to-edge (canonical gutter `px={{base:'md',sm:'xl'}}`, per §8.1); `≥640` = capped to 1536px, centered, on
gray-50 background, with the primitive demo rendered inside white card chrome as measured above.

**🔴 Task 540 owner override (2026-07-03) — full-width above 640 for all primitive stories EXCEPT Table &
Tabs.** The owner reviewed the rendered `Mantine/Primitives/*` stories against the Task 536 `1536px`-capped
column above and rejected it on two points (owner, verbatim: *"всі Mantine Primitive Stories, окрім таблиць і
табів"* — full-width for all primitive stories except tables and tabs):

1. **The `1536px` cap is dropped at `≥640` for 21 of the 23 primitive stories** (`Table` and `Tabs` are the
   ONLY exemption — they keep the `1536px` centered column exactly as measured above). The story canvas must
   stress responsive behavior across the **whole viewport width**, not TailAdmin's capped showcase column.
2. **A symmetric edge gutter replaces the (previously absent) space between the viewport edge and the card**
   — **16px `<768`, 24px `≥768`**, reusing the SAME `p-4 md:p-6` value already cited above (content-column
   wrapper padding) rather than inventing a new number.

**This is an explicit, dated OWNER OVERRIDE of the row above — for the STORY-HARNESS layer ONLY.** It does
**NOT** change any product surface; TailAdmin's own `/buttons`/`/alerts` pages and every product page in this
app still follow the `1536px`-capped `mx-auto max-w-(--breakpoint-2xl)` column exactly as measured. The
override is analogous to the brand-color (`#EC5447`) override of TailAdmin's `#465fff` — a deliberate,
documented divergence, not an undetected deviation. The TailAdmin conformance gate (clause 16) must read this
row as "full-width story harness = owner-approved override," not "deviation → reject." See `MantineStoryShell`
(`src/stories/mantine/_MantineStoryShell.tsx`, `width` prop, Task 540) and §8.1 below for the implementation.
Card chrome (`gray.2` border, `2xl` radius, no shadow) and the `gray.0` page background are UNCHANGED —
only the max-width cap and the edge gutter changed.

## 6n. Skeleton / loading-placeholder — NO dedicated component exists (Task 544, checked 2026-07-04)

> **Task 550 correction (2026-07-05, clause 16a): the "no dedicated component" conclusion below was
> WRONG.** The orchestrator found the real TailAdmin skeleton on the **Layouts** dashboards (e.g.
> `demo.tailadmin.com/layout-one`) — static placeholder cards with no `animate-pulse`, which is why the
> original zip+live probe (documented below) missed them (it searched for pulse/shimmer *animation*
> classes, not static placeholder markup). Live-captured element:
> `class="h-40 rounded-xl border border-gray-200 bg-gray-50"` → **fill `gray-50` (`#F9FAFB`)**, **1px
> `gray-200` (`#E4E7EC`) border**, **`rounded-xl` (12px) radius**, **no shadow**, **no animation**
> (static). Fixed in `theme.ts`/`skeleton-chrome.css`: fill corrected from the wrong Progress-track
> reuse (gray-200) to the real gray-50; a border ADDED (none existed before); radius corrected from 8px
> (global default) to 12px (`defaultProps.radius:'xl'`). **Animation — OWNER RULED: KEEP Mantine's own
> shimmer** over these corrected tokens (TailAdmin's own is static; the owner chose to retain Mantine's
> shimmer as a deliberate UX enhancement, not an oversight). The prose below is retained for history
> only — do not re-implement its gray-200/8px/no-border conclusions.

> **Step 0 extraction result: negative.** TailAdmin has no skeleton/shimmer/loading-placeholder component
> anywhere this project can reach it. Exhaustively checked, both sources:
> - **Offline zip (`demo_tailadmin_com.zip`):** `css/style.css` has no `skeleton`/`shimmer` class and no
>   opacity-pulse `@keyframes` (the only "pulse" hit is an unrelated Dropzone-widget `scale` pulse, a
>   third-party file-upload plugin animation, not a design-system token). Zero `animate-pulse` usage
>   across all 19 bundled HTML pages (`grep -io animate-pulse` on every `html/*.html` = no matches).
>   `js/bundle.js` contains the literal string "skeleton" exactly once, inside a third-party FullCalendar
>   library comment ("date range with a rendered skeleton") — unrelated to loading UI.
> - **Live site (`demo.tailadmin.com`, same domain as every other "measured" row above):** `/skeleton`,
>   `/loaders`, `/loader`, `/loading`, `/placeholder`, `/placeholders`, `/empty-state` all **404**.
>   `/spinners` (linked from the nav) returns 200 but contains a fundamentally different pattern — rotating
>   spinner icons, zero skeleton/shimmer/pulse markup — not a "closest loading placeholder" in the sense
>   Step 0 means (a spinner is a distinct UI idiom from a gray-block content placeholder).
>
> **Decision (clause 16 fallback — reuse already-cited tokens for the closest semantic analog, invent
> nothing new):**
> - **Base color = gray-200 `#e4e7ec`** — the SAME already-measured, already-cited token as the Progress
>   track (line 439 above), since a Progress track and a Skeleton placeholder are the same semantic
>   surface: a neutral, static "not-yet-content" gray fill. Reused, not invented.
> - **Radius = 8px (`rounded-lg`)** for line/block skeletons — the SAME generic component radius already
>   cited for Input/Select/Textarea/Pagination/Tabs (§6/§6l), i.e. TailAdmin's default control radius, NOT
>   the Progress pill radius (that pill is specific to the progress-fill idiom, not a generic rectangle).
>   **Circle skeletons = full round** — a geometric certainty (100% border-radius on an equal-side box),
>   not a design choice, so not "inventing" a value.
> - **Animation = Mantine's own default, UNCHANGED (zero-override)** — 1500ms linear infinite opacity
>   pulse (`@keyframes` in `@mantine/core/styles.css`, confirmed in the shipped stylesheet, not assumed).
>   TailAdmin has zero cited animation timing for any loading state to conform to (see above), so keeping
>   Mantine's conventional, industry-standard skeleton-pulse timing is the correct "nothing to override"
>   outcome — same category of decision as Progress's zero-override for track/fill color mechanics.

**Implementation:** `theme.ts` needs no radius override (global `defaultRadius:'lg'` already resolves
Mantine's `--mantine-radius-default` to 8px, so a non-circle `<Skeleton>` is already correct with zero
config). The base-color divergence (Mantine's own default pulse color is `gray-3`/`#d0d5dd`, one shade off
the target `gray-2`/`#e4e7ec`) is NOT overridable via `theme.components.Skeleton` — Mantine hardcodes the
pulse color to `--mantine-color-gray-3` inside its own stylesheet's `::before`/`::after` pseudo-elements,
which no `vars` resolver or `styles` prop can target (pseudo-elements aren't reachable via React inline
styles). Fixed via a scoped stylesheet rule (`skeleton-chrome.css`, same mechanism as
`input-chrome.css`/`pagination-chrome.css`): `.mantine-Skeleton-root::after { background-color:
var(--mantine-color-gray-2); }`.

## 6o. Divider / Separator — zip-cited, `<hr>` markup found (Task 545, extracted 2026-07-04)

> **Step 0 extraction result: positive — real `<hr>` markup found in the zip**, resolving the kickoff's
> gray-100-vs-gray-200 ambiguity in favor of **gray-200**.
>
> **Horizontal (`<hr>`, `html/image-generator.html` + `text-generator.html`/`video-generator.html`/
> `code-generator.html`, 10–13 occurrences each — a dropdown menu's between-item divider):**
> `<hr class="my-1 border-gray-200 dark:border-white/10"/>`
> - **Color = gray-200 `#e4e7ec`** — `.border-gray-200 { border-color: var(--color-gray-200); }` +
>   `--color-gray-200: #e4e7ec;` (both confirmed, `css/style.css`). NOT gray-100 (the table/card row-divider
>   token is a different, lower-contrast use case — confirmed these are genuinely two different tokens
>   for two different surfaces, not one value cited two ways).
> - **Thickness = 1px** — Tailwind's preflight `hr` reset: `hr { height:0; color:inherit;
>   border-top-width:1px; }` (`css/style.css`, no explicit border-width utility on the element itself).
> - **Style = solid** — Tailwind's universal preflight `*, ::before, ::after, ::backdrop { border: 0 solid;
>   ... }` (`css/style.css`) sets `border-style:solid` globally; no `border-dashed`/`border-dotted` utility
>   is present on the `<hr>` class list. No dashed/dotted default, confirmed.
> - **Spacing = `my-1`** (4px vertical margin, Tailwind's `0.25rem` spacing unit) — cited for completeness,
>   not required by the primitive itself (the story controls its own spacing via `Stack`/`Group` gap).
>
> **Vertical (`w-px bg-gray-200`, `html/index.html`/`html/saas.html`/`html/invoices.html` toolbar/sidebar
> dividers):** `class="h-7 w-px bg-gray-200 dark:bg-gray-800"` — same **gray-200** token, applied as a filled
> 1px bar (`background-color`) rather than a bordered line, since a vertical divider has no natural "border
> side" the way a horizontal `<hr>` does. Functionally identical: a 1px gray-200 line. Confirms both
> orientations share ONE color token — nothing invented per-orientation.
>
> **Labeled divider — NOT found.** All 10 `<hr>` occurrences checked (their surrounding markup) are plain
> `<li>`-to-`<li>` dropdown-menu separators with no adjacent label/text (no "OR"-style auth-form divider
> pattern anywhere in the 19 bundled pages). The Separator story therefore ships horizontal + vertical
> states only — no labeled variant (honest negative, same pattern as §6n's "not found" sections).

**Implementation (verified against `@mantine/core`'s compiled source, not assumed):** Mantine's own
`--divider-color` CSS custom property defaults to `var(--mantine-color-gray-3)` (`@mantine/core/styles.css`)
— one shade off the §6o target `gray-2`/`#e4e7ec` (the same one-shade gap as Skeleton's §6n divergence), but
UNLIKE Skeleton this is a normal element style (`border-top`/`border-inline-start` on the component's own
root), not a pseudo-element — `Divider.mjs`'s own `varsResolver` already sets `--divider-color` from the
`color` PROP (`getThemeColor(color, theme)`) when one is passed. So `theme.components.Divider.defaultProps
= { color: 'gray.2' }` alone is sufficient — no `vars` override, no `-chrome.css` file needed. Thickness
(`--divider-size-xs` = `0.0625rem` = 1px, the default `size`) and style (`border-top: ... solid ...`, the
default `variant` fallback when unset) already match §6o exactly — zero-override for both.

## 6p. ScrollArea / scrollbar chrome — zip-cited `.custom-scrollbar` utility (Task 546, extracted 2026-07-05)

> **Step 0 extraction result: positive — the `.custom-scrollbar` utility class found in `css/style.css`**,
> applied across 58 occurrences in the bundled HTML (dropdown lists, table `overflow-x-auto` wrappers, the
> image-generator chat/message pane), styling the **native** `::-webkit-scrollbar` pseudo-elements:
> ```css
> .custom-scrollbar {
>   &::-webkit-scrollbar { width: calc(var(--spacing) * 1.5); height: calc(var(--spacing) * 1.5); }
>   &::-webkit-scrollbar-track { border-radius: calc(infinity * 1px); }
>   &::-webkit-scrollbar-thumb { border-radius: calc(infinity * 1px); background-color: var(--color-gray-200); }
> }
> .dark .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #344054; }
> ```
> - **Thickness = 6px** — `--spacing: 0.25rem` (confirmed, `css/style.css` `:root`), so
>   `calc(var(--spacing) * 1.5)` = `0.375rem` = **6px** for both width (vertical) and height (horizontal).
> - **Thumb color = gray-200 `#e4e7ec`** — `var(--color-gray-200)`, same token already cited for §6o
>   Divider/Separator (`--color-gray-200: #e4e7ec`, confirmed). Dark-mode thumb = `#344054` (= gray-700,
>   `--color-gray-700: #344054`, confirmed) — **N/A for this project**: `MantineRootProvider.tsx` is
>   light-only (`defaultColorScheme="light"`, owner requirement, no theme toggle), so the dark rule never
>   applies; only the light gray-200 value is implemented.
> - **Track = transparent** — the `::-webkit-scrollbar-track` rule sets ONLY `border-radius`, no
>   `background-color` — confirmed transparent (no track fill token to cite).
> - **Radius = fully rounded** (`border-radius: calc(infinity * 1px)`, Tailwind's "infinity" radius utility
>   = a value large enough to always resolve to a full pill/circle regardless of element size) for both
>   track and thumb.
>
> **🔴 Mechanism reconciliation (native vs. overlay, resolved per the kickoff's explicit instruction):**
> TailAdmin's `.custom-scrollbar` styles the **native** browser `::-webkit-scrollbar` pseudo-elements — a
> mechanism Mantine's `ScrollArea` does NOT use at all (its viewport sets `scrollbar-width: none` +
> `::-webkit-scrollbar { display: none }`, hiding the native scrollbar entirely and rendering its OWN
> overlay scrollbar DOM instead — `ScrollArea.module.css`, confirmed). This task maps the SAME thickness/
> color/radius values onto Mantine's overlay scrollbar/thumb (`.mantine-ScrollArea-scrollbar` /
> `.mantine-ScrollArea-thumb`), verified per-part against the compiled source (not assumed, per the §6o
> Divider lesson — check each component individually):
> - **Thickness** — reachable via the real `scrollbarSize` prop: `ScrollArea.mjs`'s own `varsResolver` sets
>   `--scrollarea-scrollbar-size: rem(scrollbarSize)` (default Mantine value: `12px`). `defaultProps:
>   { scrollbarSize: 6 }` in `theme.ts` resolves this to the §6p 6px value — no `vars`/CSS override needed.
> - **Radius — ZERO-OVERRIDE.** `ScrollArea.module.css`'s own thumb rule reads
>   `border-radius: var(--scrollarea-scrollbar-size)` — i.e. it ALREADY uses the exact same value as the
>   thickness. At `scrollbarSize: 6`, a 6px radius on a 6px-thin bar exceeds half the bar's own thickness
>   (3px), so the browser clamps it to a full pill automatically — a geometric certainty once thickness is
>   set, not a separate value to invent (same category as §6n Skeleton's circle-radius zero-override).
> - **Track — ZERO-OVERRIDE.** `ScrollArea.module.css`'s own scrollbar-track rule (`.m_c44ba933`) already
>   sets `background-color: transparent` at rest, matching §6p exactly (Mantine adds a light `gray-0`/
>   `dark-8` tint ONLY on hover, a UX affordance TailAdmin's static zip markup has no equivalent state for —
>   kept, not a divergence to fix, since §6p cites no hover-track token to override it with).
> - **Thumb color — NOT reachable via `vars`/`defaultProps`.** Unlike Divider (§6o), the thumb color is
>   hardcoded as a plain CSS rule on the compiled module class (`:where([data-mantine-color-scheme='light'])
>   .m_d8b5e363 { background-color: rgba(0,0,0,.4); }`, `ScrollArea.module.css`) — not a CSS custom property
>   any `vars` resolver can reach, the same "hardcoded on the component's own stylesheet" category as §6n
>   Skeleton's pulse color. Fixed via a scoped `scrollarea-chrome.css` (same mechanism as
>   `skeleton-chrome.css`), targeting the static `.mantine-ScrollArea-thumb` class Mantine always emits
>   (`getStaticClassNames`, confirmed default-on, same mechanism already relied on by `input-chrome.css`/
>   `skeleton-chrome.css`) — this file loads after `@mantine/core/styles.css` in both `layout.tsx` and
>   `.storybook/preview.tsx`, so equal-specificity source order resolves in its favor (same proven pattern as
>   the `input-chrome.css` Switch-track / SegmentedControl-label overrides). Project is light-only, so no
>   dark-mode branch is needed.

## 6q. Slider / RangeSlider — NO dedicated component exists (Task 548, extracted 2026-07-05)

> **Task 550 confirmation (2026-07-05, clause 16a):** the orchestrator re-checked the FULL TailAdmin
> component menu (UI Elements + Forms) on `demo.tailadmin.com` live — **no value/range slider exists
> anywhere** (Carousel is an image slider; Form Elements has no range widget: `input[type=range]`=0,
> `[role=slider]`=0). **Ruling — OWNER ACCEPTED: token-consistency only.** Unlike Toast/Skeleton (which
> DO exist live and needed re-grounding), there is no live capture to re-ground Slider on — the §6q
> honest-negative below stands, judged only on whether it uses real TailAdmin tokens (not on
> component-shape parity, which is impossible with no reference component). Re-verified via rendered
> `getComputedStyle` against the built story: `--slider-track-bg: #f2f4f7` (gray-100 ✓), `--slider-radius:
> 9999px`/`1000px` (pill ✓), fill/thumb border `rgb(236,84,71)` = `#EC5447` (brand ✓), thumb `12px` ✓ — all
> four tokens unchanged from Task 548, zero pixel change required.

> **Step 0 extraction result: negative (honest fallback, expected per kickoff).** `demo_tailadmin_com.zip`
> has NO slider/range-input component anywhere this project can reach it:
> - `css/style.css` (11,286 lines, fully extracted): zero hits for `slider`, `range-slider`, `noUiSlider`,
>   `irs-`, or any `type="range"` styling block. `grep -iE "slider|range|noui"` across the WHOLE zip archive
>   (every path, not just the stylesheet) returns **zero matches**.
> - No bundled HTML page (19 pages) contains a `<input type="range">` or a range/slider widget of any kind.
>
> **Decision (clause 16 fallback — reuse already-cited tokens for the closest semantic analog, invent
> nothing new, exactly as §6n Skeleton / §6o Divider did for their honest-negatives):**
> - **Filled track / thumb accent = brand.** The legacy `src/components/ui/slider.tsx` uses `bg-primary`
>   (indicator) + `border-ring` (thumb) — both already resolve to this project's brand token (`--ring:
>   var(--brand-700)` = `#EC5447`, `globals.css`). No new value to cite.
> - **Empty (unfilled) track = gray-100 `#f2f4f7`** — the gray token nearest the legacy `bg-muted`
>   (`--muted: var(--neutral-100)` = `#F5F5F5`) by RGB distance among the three candidates already anchored
>   in this doc: gray-100 `#f2f4f7` (Δ≈3.7) vs. gray-200 `#e4e7ec` (Δ≈23.8) vs. gray-300 `#d0d5dd` (Δ≈54.5) —
>   gray-100 is the closest by a wide margin, per the kickoff's explicit "nearest to legacy `bg-muted`"
>   instruction (a different rule than Progress's/§6p's gray-200, because THAT token traces to a real
>   zip-cited value — this one has no zip value to trace to, so it falls back to the legacy CSS variable
>   instead).
> - **Track thickness = 4px, thumb = 12px.** Legacy `data-horizontal:h-1` (4px) track + `size-3` (12px) thumb
>   map EXACTLY onto Mantine's own built-in `size="xs"` preset (`--slider-size-xs: 4px`, compiled
>   `Slider.css`) + an explicit `thumbSize: 12` prop — both cited existing values, nothing invented.
> - **Radius = pill (`rounded-full`)** — legacy's `rounded-full` on both track and thumb.
> - **Thumb focus ring = the §6e brand-colored control-chrome convention** (a brand-colored focus indicator
>   on the interactive control) — satisfied by Mantine's own global focus mechanism (see Mechanism below),
>   not a new value.
> - **Disabled = the §6e whole-control dim** (track AND thumb together, ONE uniform opacity, never two
>   stacked opacities) — the legacy contract's `disabled:opacity-50`.
>
> **🔴 Mechanism (resolved against Mantine's compiled `Slider.mjs`/`RangeSlider.mjs`/`Slider.css` — not
> assumed, per the §6o Divider "check each component individually" lesson):**
> - **Filled track / thumb accent (brand) — ZERO-OVERRIDE.** `Slider.mjs`'s own `varsResolver` sets
>   `--slider-color: color ? getThemeColor(color, theme) : undefined`; when no `color` prop is passed, the
>   compiled stylesheet's own fallback (`--slider-color: var(--mantine-primary-color-filled)`, `Slider.css`)
>   already resolves to `theme.primaryColor` (`'brand'`, `primaryShade: 7` = `#EC5447`) — this is both the
>   thumb's border/text color AND the filled-bar background color out of the box. No override needed.
> - **Track thickness / thumb size — reachable via real props.** `size: 'xs'` sets `--slider-size` to the
>   compiled `--slider-size-xs: 4px` (both Slider and RangeSlider share the identical `varsResolver`
>   shape); `thumbSize: 12` sets `--slider-thumb-size` directly (`rem(thumbSize)`) instead of the
>   size-derived default (`calc(var(--slider-size) * 2)`).
> - **Radius — Slider needs an explicit override; RangeSlider does NOT.** `Slider`'s OWN component
>   `defaultProps` set `radius: "xl"` (not `undefined`), so its `varsResolver` always computes
>   `--slider-radius: getRadius("xl")` = `var(--mantine-radius-xl)` — which THIS project's `theme.radius.xl`
>   overrides to `0.75rem`/12px (§5), i.e. a non-pill corner, not a pill. `RangeSlider`'s OWN `defaultProps`
>   do **not** set `radius` at all, so its `varsResolver` leaves `--slider-radius` unset and the compiled
>   stylesheet's base rule (`--slider-radius: 1000px`) applies untouched — already a full pill, ZERO-OVERRIDE.
>   Fix: `theme.components.Slider.defaultProps.radius = 'pill'` (only `Slider`, not `RangeSlider`) — the SAME
>   `--slider-radius` variable also drives the thumb's `border-radius`, so one lever fixes both parts.
> - **Empty track color — NOT part of Slider's/RangeSlider's own `varsResolver`.** The compiled stylesheet
>   sets `--slider-track-bg` via a plain color-scheme-scoped rule (`[data-mantine-color-scheme='light']
>   .mantine-Slider-root { --slider-track-bg: var(--mantine-color-gray-2); }`), a CSS custom property NOT
>   exposed through `size`/`color`/`radius`/`thumbSize`. Still theme-reachable: `theme.components.Slider.vars`
>   (and `.RangeSlider.vars`) MERGE with the component's own internal `varsResolver` (confirmed via
>   `resolve-vars.mjs`: `mergeVars([internalVarsResolver(...), theme.components[name]?.vars(...), instance
>   vars prop])` — additive, not a replacement), so adding `root: { '--slider-track-bg':
>   'var(--mantine-color-gray-1)' }` there renders as part of the SAME inline `style` attribute Mantine
>   already puts on root, which wins over the external stylesheet rule regardless of selector specificity
>   (same mechanism Progress already relies on for `--progress-size`). No `slider-chrome.css` needed for
>   this value.
> - **Focus ring — ZERO-OVERRIDE.** The thumb is rendered via `getStyles("thumb", { focusable: true })`,
>   which (per `get-global-class-names.mjs`) appends Mantine's shared `mantine-focus-auto` class whenever
>   `theme.focusRing` is `'auto'` (the default, unset in this theme). That class's own rule
>   (`.mantine-focus-auto:focus-visible { outline: 2px solid var(--mantine-primary-color-filled); ... }`,
>   `@mantine/core/styles.css`) already renders a brand-colored ring on focus — satisfies the "brand focus
>   indicator" intent with zero override (the exact technique — a CSS `outline` vs. the input primitives'
>   box-shadow `ring` — differs, but no other primitive in `theme.ts` overrides Mantine's own focus mechanism
>   either, so this is consistent with existing practice, not a new exception).
> - **🔴 Disabled — genuine divergence, fixed via `slider-chrome.css` (state-dependent, unreachable via
>   `vars`/`defaultProps`, same category as §6n Skeleton's pseudo-element color).** Verified against compiled
>   `Slider.css`: (1) Mantine tags `trackContainer`/`track`/`bar`/`thumb` with `data-disabled` INDEPENDENTLY
>   (no single ancestor toggle exists — the root element itself never receives a `disabled`/`data-disabled`
>   attribute, confirmed in `SliderRoot.mjs`, which destructures and discards the `disabled` prop entirely);
>   (2) the compiled rule `.mantine-Slider-thumb:where([data-disabled]) { display: none; }` makes the disabled
>   thumb **vanish completely** rather than dim — both diverge from §6e's "dim the WHOLE control to ONE
>   uniform opacity, track AND thumb together" rule (a vanished thumb can't be verified as "dimmed", and
>   independently-tagged parts risk the "stacking two opacities" failure §6e/§6f/§6g/§6h warn against). Fixed
>   by applying `opacity: 0.5` to ONLY the outermost disabled-tagged part (`trackContainer` — `track`/`bar`/
>   `thumb` are all its DOM descendants, so the dim cascades ONCE, never stacked) and restoring the thumb's
>   `display` so it stays visible-but-dimmed instead of disappearing. Targets the static
>   `.mantine-Slider-trackContainer` / `.mantine-Slider-thumb` / `.mantine-RangeSlider-trackContainer` /
>   `.mantine-RangeSlider-thumb` classes Mantine always emits (`getStaticClassNames`, confirmed default-on,
>   same mechanism as `scrollarea-chrome.css`/`skeleton-chrome.css`).
>
> **Marks — not implemented.** No §6q mark chrome exists to cite (the zip has no slider/range component at
> all, let alone one with tick marks) — per the kickoff's own conditional ("optional, only if §6q defines
> mark chrome"), the story ships single + range + disabled states only, no marks variant.
>
> **Horizontal-only confirmed acceptable.** `grep -rl "@/components/ui/slider" src` → **zero consumers** of
> the legacy component (verified at kickoff time and re-confirmed here) — no consumer needs the legacy's
> vertical mode, so Mantine's horizontal-only `Slider`/`RangeSlider` is a strict-enough superset. No
> STOP-AND-ASK trigger.

> ## 🔴 Honest-negative rows require live-capture provenance (owner P0, 2026-07-05, Variant A — agent-contract clause 16a)
> **This §6r row (and the other zip-honest-negative rows §6n Skeleton, §6q Slider) is NOT yet approvable as written.**
> The owner rejected closing zip-absent primitives on "formalize prior prose + Mantine zero-override defaults." When the
> zip has zero reference markup, the row MUST instead carry a **live capture from `demo.tailadmin.com`** — a rendered
> screenshot + `getComputedStyle` of the real element at the canonical breakpoints — recorded WITH provenance (exact URL,
> capture date, method, measured selector). Every value below, **including every "zero-override" decision**, must then be
> positively verified against that live capture and proven rendered side-by-side. Until this row is re-grounded on a live
> capture (Task 550), the values below are treated as UNVERIFIED and the primitive is HELD, not approved. The
> crash-and-geometry rendered gate (Task 529) does not check this. Full rule: `docs/agent-contract.md` clause 16a.

## Verified orchestrator capture results (2026-07-05) — the three zip-absent primitives

Method: read the full TailAdmin component menu on `demo.tailadmin.com` (UI Elements = Alerts, Avatars, Badge, Breadcrumb,
Buttons, Buttons Group, Cards, Carousel, Dropdowns, Images, Links, Modals, **Notifications**, Pagination, Popovers,
Progress Bars, Ribbons, Spinners, Tabs, Tooltips, Videos; Forms = Form Elements, Form Layout) + inspected each relevant
page's DOM.

- **Toast → EXISTS.** UI Elements → Notifications → "Toast Notification". Live-captured — see **§6r-LIVE** below. This is
  the real fix for Task 549.
- **Slider → VERIFIED ABSENT.** No Slider in UI Elements (Carousel is an *image* slider, not a value/range control); Form
  Elements has no range widget (`input[type=range]`=0, `[role=slider]`=0, sections = inputs/select/textarea/input-states/
  input-group/file/checkbox/radio/toggle/dropzone). No TailAdmin range-slider artifact exists in the zip OR live.
  **Conformance ruling — OWNER ACCEPTED (2026-07-05), clause 16a token-consistency carve-out: judge the Slider primitive on TailAdmin TOKEN scale only**
  — brand-500 `#EC5447` filled track + thumb, gray track from the §1b gray ramp (`gray-100 #F2F4F7`), pill radius. No
  invented pixel values; the current §6q impl (brand fill/thumb, gray-100 track, `size='xs'`, `thumbSize=12`, pill) is
  already token-consistent — Task 550 confirms it with rendered proof, no component-match is possible or required.
- **Skeleton → EXISTS** (found on the **Layouts** dashboards, e.g. `demo.tailadmin.com/layout-one`, per owner pointer —
  an earlier "verified absent" note was WRONG). The placeholder cards are **static** (no `animate-pulse`, which is why a
  first probe missed them). Live-captured element:
  `class="h-40 rounded-xl border border-gray-200 bg-gray-50"` →
  - **background `rgb(249,250,251)` = `#F9FAFB` (gray-50)** · **border `1px solid rgb(228,231,236)` = `#E4E7EC` (gray-200)**
  - **border-radius `12px` (`rounded-xl`)** · **box-shadow none** · **animation none** (static placeholder — NOT a shimmer).
  So the TailAdmin skeleton is a **static gray-50 box with a 1px gray-200 border, 12px radius, no animation.** Task 550
  fix: the §6n Skeleton primitive renders these tokens (gray-50 fill, gray-200 border, 12px radius). **Animation — OWNER
  RULED (2026-07-05): KEEP Mantine's shimmer** over the TA token chrome (TailAdmin's own is static; owner chose to retain
  the shimmer).

## 6r-LIVE. Orchestrator live capture (2026-07-05) — AUTHORITATIVE, supersedes the prose values below

> **Provenance:** captured by the orchestrator in Chrome via `getComputedStyle` on **`demo.tailadmin.com/notifications`**
> (UI Elements → Notifications → "Toast Notification" / "Success Notification"), Success variant, 2026-07-05. Screenshot
> on file. **Correction:** an earlier orchestrator note claimed "TailAdmin ships no toast" — that was WRONG; the Toast
> Notification section exists under UI Elements. This block is the corrected, real capture.
>
> **The TailAdmin compact toast — measured element** (Success variant):
> `class="flex items-center justify-between gap-3 w-full sm:max-w-[340px] rounded-md border-b-4 border-success-500 bg-white p-3 shadow-theme-sm"`
> - **background** white · **radius `6px` (`rounded-md`)** · **padding `12px` (`p-3`)** · **gap `12px` (`gap-3`)**
> - **🔴 accent = a 4px BOTTOM border** `border-b-4 border-success-500` (`#12B76A`) — **NOT a left bar, NOT a circular
>   badge.** (The old prose §6r said "left accent" — WRONG.)
> - **shadow = `shadow-theme-sm`** = `0 1px 3px rgba(16,24,40,.1), 0 1px 2px rgba(16,24,40,.06)` — **NOT `shadow-lg`.**
>   (The old prose/theme said `shadow-lg` — WRONG.)
> - **width `w-full` below `sm`, capped `sm:max-w-[340px]`** (measured 340px) — exactly the mobile-full-width / desktop-cap
>   pattern clause 11 wants; the border is at 40em=640px `sm`.
> - **icon badge = `h-10 w-10` (40×40) `rounded-lg` (8px) tinted `bg-success-50` (`#ECFDF3`) with a 24px `text-success-600`
>   (`#039855`) glyph** — a 40px rounded-square tinted badge. **NOT Mantine's 28px circular solid-fill badge.**
> - **title** `16px` / `400` / `#1D2939` (demo shows a single-line title, no separate body row).
> - **close button** `24×24`, color `#98A2B3` (gray-400).
> - font-family **Outfit**.
>
> **🔴 Owner override (2026-07-05, post-Task-550 review): title weight = 600, NOT the captured 400.** The
> owner requested stronger title emphasis than the live capture shows — implemented in `theme.ts` as an
> explicit, documented deviation from this citation (same category as Skeleton's "keep the shimmer" ruling
> above — an owner preference overriding the literal capture, not an error in the capture itself).
>
> **Real divergences of the current Mantine Notification vs this capture (each must be fixed in Task 550):**
> 1. accent — Mantine renders a left `::before` bar / circular badge → must become a **4px bottom border** in semantic-500.
> 2. shadow — remove the `shadow-lg` reliance → **`shadow-theme-sm`** (this project's `shadows.sm`).
> 3. icon — Mantine's 28px circular solid badge → **40×40 `rounded-lg` `bg-{semantic}-50` tinted badge, 24px `{semantic}-600` glyph**.
> 4. radius 6px ✅ already (`radius:'md'`); max-width 340px + `w-full` ✅ already (`notification-chrome.css`).
>
> **The prose section below is retained only for history — do NOT implement from it; implement from this §6r-LIVE block.**

## 6r. Notification / Toast — formalized from §6l live-measured prose (Task 549, 2026-07-05) — SUPERSEDED, see §6r-LIVE above

> **Task 550 confirms:** every value below is now inert history — `theme.components.Notification` implements
> exclusively against §6r-LIVE (the 4px bottom-border accent, `shadow-theme-sm`, the 40×40 `rounded-lg`
> semantic-tint icon badge, 16px/400 title, 24px close button). The "zero-override" claims below (left-bar
> accent, `shadow-lg`, 28px circular badge, 14px/500 title) were the exact rendering-as-stock-Mantine defects
> clause 16a rejected — do not resurrect them.

> **Step 0 re-check result: honest-negative on the offline zip (expected — this row was ALREADY live-measured,
> not zip-cited).** The §6l "UI Elements sweep" line (originally recorded 2026-07-02) reads: **"Notifications /
> Toast (`/notifications`, measured): notification card `rounded-xl` (12px), 1px border gray-200, bg white,
> padding 20px (p-5), body 14px/gray-500. Compact toast: white bg, `rounded-md` (6px), padding 12px (p-3),
> `gap-3`, semantic left accent (success `#12b76a` / info `#0ba5ec` / warning `#f79009` / error), max-width
> ~340px."** That value was measured live on `demo.tailadmin.com/notifications` (same methodology as §6k
> Tooltip and the rest of §6l), NOT extracted from `demo_tailadmin_com.zip`. Re-confirming against the zip per
> this task's Step 0 instruction: a full-archive case-insensitive search (`html/*.html` + `css/style.css` +
> `js/bundle.js`, all 23 files) for `notification`/`toast` returns **exactly one hit** — `.swiper-notification`
> (an unrelated Swiper carousel accessibility live-region class, `css/style.css:9849`) — confirming the zip
> genuinely has zero notification/toast markup of its own, exactly like §6n Skeleton / §6q Slider. The
> already-live-measured §6l values remain the authoritative source (no new value invented; this section
> **formalizes** them into a numbered row, per the kickoff instruction).

**Card chrome (compact toast — the transient variant this primitive targets):**
- **Background = white**, **radius = 6px (`rounded-md`)**, **padding = 12px (`p-3`)**, **`gap-3`** (12px item
  gap), **max-width ≈ 340px** — all cited from the §6l measured line above.
- **Shadow = §5 `shadow-theme-lg`.** The tracker's "ref §5 shadow" resolves to `lg`, not `xs`, by the same
  floating-elevated-surface categorization already used for Popover/Menu/Combobox (§6l Addendum, Task
  528/530): a toast is a floating overlay above page content, the same category as a dropdown panel, not a
  resting form control (which is where `shadow-theme-xs` applies). **ZERO-OVERRIDE** — Mantine's own compiled
  `Notification.css` already hardcodes `box-shadow: var(--mantine-shadow-lg)`, and this project's
  `theme.shadows.lg` was already corrected to the real `shadow-theme-lg` value project-wide (Task 530) — no
  new override needed here, the fix already exists upstream.
- **Border** — the compact toast has no border cited in the §6l line (only the full `/notifications` card row
  cites a 1px gray-200 border); the compact/transient variant is borderless. Matches Mantine's own default
  (`withBorder` defaults to `false`/unset) — **zero-override**.

**Semantic left accent** — the 4px-wide colored bar/badge per variant, mapped to the already-cited §1b
semantic tokens via the **same `props.color` mechanism the approved Alert primitive uses (§6l Addendum, Task
532)**: success → green (`#12b76a`), warning → yellow (`#f79009`), error → red (`#f04438`), info → blueLight
(`#0ba5ec`, index 5). **Do NOT use raw `green`/`red`/`blue`/`yellow` Mantine palette names** — the existing
`MantineNotificationPattern.tsx` demo does this (`VARIANT_COLORS: {success:'green', error:'red', info:'blue',
warning:'yellow'}`), which is a **pre-existing conformance gap, noted here, NOT fixed in this slice** (it's a
`Patterns/` layer surface, explicitly out of scope — see kickoff). The new `Mantine/Primitives/Notification`
story uses the correct §1b-cited color keys directly (`'green'`/`'blueLight'`/`'yellow'`/`'red'`, i.e. this
project's own theme color array names, which — unlike the demo pattern's literal stock-Mantine names — already
resolve to the exact §1b hex values because `theme.colors` remaps those keys to the TailAdmin tuples).

**🔴 Icon + accent-bar mechanism (resolved against Mantine's compiled `Notification.mjs`/`Notification.css` —
not assumed):** Mantine's `Notification` renders the left-accent bar via a `::before` pseudo-element
(`background-color: var(--notification-color)`, 6px wide) **only when no `icon` prop is passed** — its own
compiled rule explicitly hides it when an icon is present:
`.mantine-Notification-root:where([data-with-icon])::before { display: none; }`. When an icon IS passed, it
renders instead as a 28×28 circular badge (`getStyles("icon")` → class `icon`) filled with the SAME
`--notification-color` variable and a white glyph — i.e. Mantine's own icon badge is ALREADY semantically
colored via the identical color mechanism as the bar, satisfying the kickoff's "icon color = semantic-500"
intent with **zero extra styling** (the badge's fill IS the semantic-500 token, by construction). The kickoff
asks for BOTH the left accent AND an icon shown together on each story state (parity with the legacy
`sonner.tsx` icon set — `CircleCheck`/`Info`/`TriangleAlert`/`OctagonX`), which conflicts with Mantine's own
mutual-exclusivity rule above. Resolved via a scoped `notification-chrome.css` override that restores the
`::before` bar's visibility even when `data-with-icon` is set — this does NOT invent any new color/size (the
bar's color/width/radius are already the exact §6r-cited values, driven by the same `--notification-color`
variable the icon badge already uses), it only un-suppresses an already-correct rule Mantine hides for its own
aesthetic default. Same category of fix as §6q Slider's disabled-thumb `display:none` override — a proven,
compiled-source-verified divergence, not an invented value.

**Text** — title: 14px / 500 weight / gray-900 (Mantine's own default, matches the general dark-heading
convention used elsewhere in this doc) — **zero-override**. Message: 14px / gray-500-equivalent when a title
is present (Mantine's own `data-with-title` rule sets the description to a dimmed tone) — **zero-override**,
matches the §6l "body 14px/gray-500" citation for the full card row, reused here for the compact toast (same
semantic role: secondary/supporting text).

**Close button** — `withCloseButton` defaults to `true`; Mantine renders it via `CloseButton` with no explicit
`size` prop, defaulting to `size='md'` → 28px (`--cb-size-md`), below the 44px touch-target minimum. **Compact-
control mobile exemption (clause 11)**, documented explicitly: an icon-only dismiss "×" on a transient,
auto-dismissing toast is the same exemption class as the Slider thumb (§6q) — not upsized to 44px in this
slice (no zip/live citation for a larger close-button size; upsizing would be an invented value). Color =
`gray` (Mantine's own default for `CloseButton` in this context) — matches the §6e icon-convention gray tone,
zero-override.

**🔴 Responsive max-width mechanism (resolve in Step 0, `storybook-governance.md §14.9.17`):** the `≥640` cap
(≈340px) and the `<640` full-width requirement (clause 11) is a real **CSS media-query breakpoint**, which
`theme.components.Notification.styles` (a plain JS style object/callback) cannot express — Mantine's
`styles`/`vars` API produces inline styles or static CSS-var declarations, neither of which support
`@media` queries. This is NOT reachable via `theme` alone; a scoped `notification-chrome.css` rule is the
correct (not a workaround) mechanism, exactly as `mantine-responsive-design-system.md` §18 describes for any
value that is genuinely a breakpoint-conditional rule:
```css
.mantine-Notification-root { max-width: 100%; }
@media (min-width: 40em) { .mantine-Notification-root { max-width: 340px; } }
```
(`40em` = 640px, matching this project's `sm` breakpoint token, §5/theme.ts.)

**Mechanism summary:** `theme.components.Notification.defaultProps.radius = 'md'` (6px) is the only
`defaultProps` override needed (radius default is `getRadius(radius)`, and Mantine's global fallback resolves
to `--mantine-radius-default` = this project's `lg`/8px, one step off §6r's 6px). Shadow, body/title text,
border, and icon-badge coloring are all **zero-override**. The accent+icon conflict and the responsive
max-width both require `notification-chrome.css` (state-dependent/media-query CSS, unreachable via
`vars`/`styles`) — wired into both `layout.tsx` and `.storybook/preview.tsx` after `slider-chrome.css`.

## 6s. Text-link toggle (compact, brand-colored action link) — extracted from the zip (Task 553, 2026-07-05)

> **Step 0 result: no exact "+ add nested item" pattern exists in `demo_tailadmin_com.zip`** — a full-archive
> search (`html/*.html`) for "add option"/"add variant"/"add another"/"add field"/"add row" returns zero hits;
> TailAdmin's own demo pages have no inline-create-nested-item UI to cite. This row extracts the closest real
> primitive instead: a compact, brand-colored, underline-on-hover text link used as an inline action affordance
> (not navigation) — composed from TWO already-cited zip sources, not invented:

- **Structure/size/hover (cited: `html/invoices.html:1647`)** —
  `<p class="text-theme-xs font-medium text-gray-700 group-hover:underline …">` — the invoice-number cell link.
  Gives: **12px (`text-theme-xs`)**, **font-weight 500 (`font-medium`)**, **underline on hover only** (not
  resting). This is the correct SIZE citation — `text-sm`/14px is NOT cited anywhere for this affordance; the
  legacy `LocationCombobox` toggle this row replaces was also `text-xs` (12px), consistent with this citation.
- **Brand color (cited: `html/ai-settings.html:2519,2523` + `html/crm.html:3081`)** — `text-brand-500` is the
  zip's own "selected/active" state color convention (ai-settings.html's selected nav-item text/icon; crm.html's
  accent badge text). Mapped to this project's Mantine scale: **`brand.7`** — the SAME shade the sibling
  `MantineCombobox` primitive already uses for its active-option text and `CheckIcon` (§6l), keeping this toggle
  visually consistent with the primitive it sits next to (Tailwind `brand-500` → this project's Mantine
  `brand.7`, per the existing brand-scale mapping used throughout `theme.ts`).
- **Touch target (clause 11, existing exemption)** — `mih="2.75rem"` (44px), the SAME sole exemption pattern
  already used for compact rows elsewhere in this doc (Combobox mobile-sheet option rows, §6l) — the link's
  visible text/icon stays compact/inline-sized, but its clickable area meets the ≥44px mobile gate via padding,
  not by inflating the text itself.
- **Component** — Mantine `Anchor` with `component="button"` (this is an in-page ACTION — toggling a panel open/
  closed — not page navigation, so `component="button"` is required for correct keyboard/role semantics; a bare
  `<a href="#">` would be wrong here). `Anchor` has no themed `defaultProps` override in `theme.ts` — this row's
  values are applied inline at the call site (`fz`, `fw`, `c`, `mih`), matching the "compact, one-off control"
  precedent (not a component-level default, since no other consumer of `Anchor` exists yet in this codebase).

**Result:** `<Anchor component="button" fz="var(--mantine-font-size-xs)" fw={500} c="brand.7" mih="2.75rem" …>` —
zero invented pixel/color values, both citations traceable to the zip line numbers above.

## 6t. Date-picker calendar body (flatpickr) — ZIP-CITED, markup + CSS present (Task 557, extracted 2026-07-06)

> **Step 0 result — NOT an honest-negative. The zip HAS the calendar.** The earlier Task-557 draft asserted
> `demo_tailadmin_com.zip` contained "zero date-input/calendar-picker markup (only `images/calendar.svg`)". That
> was WRONG. The dashboard (`index.html`, and also `html/index.html`, `html/sales.html`) renders the full
> **flatpickr** date-picker — the SAME flatpickr component TailAdmin uses on its Forms/Form-Elements page — with a
> statically-rendered `.flatpickr-calendar` (month nav + weekday header + 6×7 day grid incl. `selected`,
> `prevMonthDay`, `nextMonthDay` states), and `css/style.css` carries the complete flatpickr stylesheet
> (base `flatpickr.min.css` + TailAdmin overrides). **No live capture is needed — this row is extracted from the
> zip.** (The owner correctly pointed to the Dashboard/Forms date picker.)

**Markup source:** `index.html` → `.flatpickr-calendar.rangeMode.animate.static.flatpickr-right`.
**CSS source:** `css/style.css` → the flatpickr block (base) + the TailAdmin override rules at the tail of that block.

**Note on brand color:** TailAdmin's own flatpickr build left flatpickr's DEFAULT blue `#569ff7` for the
selected day and only re-themed the range-connector shadow to its brand `#465fff`. Because lero's brand is
`#EC5447` (the project's standing override of TailAdmin `#465fff` — see §1 + clause 16), and lero's `DatePicker`
is **single-select** (no range), the selected day maps to **brand `#EC5447`**, consistent with the existing
hand-rolled DatePicker's `bg-primary` selected fill. Every other value below is the zip's literal flatpickr value,
mapped to the nearest project token where flatpickr shipped a raw hex (the same one-shade-token-mapping discipline
used in §6n/§6o).

**Calendar container** (`.flatpickr-calendar`, cited): `background:#fff`; `border-radius:5px`; `font-size:14px;
line-height:24px`; multi-edge hairline + drop shadow `1px 0 0 #e6e6e6,-1px 0 0 #e6e6e6,0 1px 0 #e6e6e6,
0 -1px 0 #e6e6e6,0 3px 13px rgba(0,0,0,.08)`; width ≈`307.875px` desktop. TailAdmin override **removes the popover
arrow** (`.arrowTop:before/after {display:none}`). In lero the container chrome is supplied by `MantinePopover`
(§6j) / the `<640` bottom sheet (§6i mechanism); this row governs the calendar BODY inside it.

**Month nav** (`.flatpickr-months`, cited):
- Prev/Next: `cursor:pointer`; TailAdmin override `padding:0`; positioned `left/right: calc(var(--spacing)*7)` = **28px**;
  chevron **SVG**, hover `stroke: var(--color-brand-500)` (→ lero brand `#EC5447`); base svg 14×14. Nav row height `34px`.
- Current-month label (`.flatpickr-current-month` / `span.cur-month`): `font-weight:700`, `font-size:135%`, centered.
  lero keeps its `Intl.DateTimeFormat(locale,{month:'long',year:'numeric'})` `capitalize font-semibold` label.

**Weekday header** (`span.flatpickr-weekday` + `.flatpickr-weekdays` override, cited): color `rgba(0,0,0,.54)`
(→ `gray-500 #667085`), `font-weight:bolder`, `font-size:90%` (≈12px → `text-theme-xs`); TailAdmin override
`margin-top: calc(var(--spacing)*6)` = **24px**, `margin-bottom: calc(var(--spacing)*4)` = **16px**, `height:auto`.
(lero stays **Monday-first**, `weekStartsOn:1` — a locale/product rule, not a TailAdmin change.)

**Day cell** (`.flatpickr-day`, cited) — state matrix:

| State | Zip flatpickr value (cited) | lero mapping |
|---|---|---|
| **resting** | `border:1px solid transparent`; `border-radius:150px` (full pill); `color:#393939`; `font-weight:400`; `max-width:39px; height:39px; line-height:39px`; `width:14.2857%` (1/7) | pill radius (`rounded-full`); text `gray-700`; **39px on ALL breakpoints incl. the `<640` bottom sheet** — see the owner override note below |
| **hover / focus** | `background:#e6e6e6; border-color:#e6e6e6` | bg `gray-200 #e4e7ec` (one shade off the raw `#e6e6e6`, per §6n/§6o mapping) |
| **selected** | base `background:#569ff7; color:#fff; border-color:#569ff7` (flatpickr default; range shadow overridden to brand `#465fff`) | **brand `#EC5447`** fill + white text + brand border (single-select; brand-mapped per note above) |
| **today** (not selected) | `border-color:#959ea9` (→ `gray-400 #98a2b3`); `today:hover` → `background:#959ea9; color:#fff` | TailAdmin marks today with a **gray-400 border**, NOT a brand ring. ⚠️ The existing DatePicker uses `ring-primary/40` (brand). **Decision for the kickoff:** adopt the §6t gray-400 today border for conformance, unless the owner elects to keep the brand ring — STOP-AND-ASK, do not silently pick. |
| **out-of-month** (`prevMonthDay`/`nextMonthDay`) | TailAdmin override `color: var(--color-gray-400) !important` (`#98a2b3`) | `gray-400`. (lero's current grid hides/dim-disables out-of-month via `!inMonth` → keep its behavior; if shown, use gray-400.) |
| **disabled** (future / `maxDate`) | `color: rgba(57,57,57,.1)`; `background:transparent`; `cursor:not-allowed` | very-light gray, non-interactive — preserves lero's `opacity-20 pointer-events-none` intent |

**Trigger input** (`input.datepicker.flatpickr-input`, cited from `index.html`): the real TailAdmin date-picker
input is `text-theme-sm shadow-theme-xs rounded-lg border border-gray-200 bg-white py-2.5 font-medium
text-gray-700` with a left calendar icon (`pl-[34px]`) and `placeholder="Select dates"`, `focus:ring-0
focus:outline-hidden`. (The dashboard instance is a compact collapsing header variant — `h-10 max-w-11
xl:max-w-fit` — so its `h-10`/`max-w-11` are the header gimmick, NOT the form-field size.) **lero's DatePicker
trigger = the §6d/§6e form-field chrome** (`h-11`, full-width, `rounded-lg`, `shadow-theme-xs`, brand focus ring,
`text-theme-sm` value/placeholder, `font-medium`, `text-gray-700`), with the calendar icon as `leftSection` and
the clear-X as `rightSection`. This is the same chrome every other migrated field (PhoneField etc.) already uses —
i.e. "take the TailAdmin styles" resolves to §6d/§6e here, not to the compact header instance's `h-10`.

> **🔴 Owner overrides (2026-07-06, Task 557 STOP-AND-ASK):**
> 1. **Trigger:** adopt the §6d/§6e bordered TailAdmin input chrome (above) — NOT the legacy filled `bg-muted
>    rounded-xl`. ("У тебе є стиль Date Picker з TailAdmin. Візьми всі необхідні стилі звідти.")
> 2. **Day-cell size = 39px on the mobile bottom sheet TOO** (not enlarged to ≥44px). This is an EXPLICIT owner
>    override of the clause-11 ≥44px touch minimum for the calendar day cells specifically — the calendar renders
>    as a full-width bottom sheet `<640`, but each day cell stays the §6t **39px** TailAdmin size. ("на мобільних
>    екранах Date Picker має бути bottom sheet з ячейками дат розміром 39px".) **Reviewers: do NOT reject the day
>    cells for being <44px on mobile — this is the authorized, documented exemption.** The nav arrows + Today
>    shortcut are NOT covered by this exemption and still meet ≥44px on mobile.
> 3. **Today marker = the §6t gray-400 border** (not the legacy brand ring).
>
> **🔴 Consumers/overrides — `RangeDatePicker` mobile navigation (2026-07-08, Task 561 owner rejection of the
> Task 558 render):** the range picker's `<640` mobile sheet does **NOT** follow Booking.com's pure forward-scroll
> (no chrome) model that Task 558 shipped. The owner rejected that render and locked a **fixed (non-scrolling)
> header carrying a month dropdown + a year dropdown** (§6c dropdown/select chrome — the SAME chrome the desktop
> two-month header already uses) above the scrolling month list. This is an explicit owner override of the plain
> Booking scrolling-sheet layout: it is the mechanism for (a) reaching months in EITHER direction (past or future,
> not forward-only) and (b) jumping directly to a year without a long scroll. Each scrolling section still shows
> `Month YYYY` title → Monday-first weekday row → 39px day grid (§6t day-cell chrome unchanged); the summary +
> Confirm bar stays a fixed, non-scrolling sibling below the list. Day-cell 39px/touch-target/color values above
> are unaffected — only the mobile NAVIGATION chrome (fixed header + dropdowns) is new, and it traces to the same
> §6c row the desktop nav already uses, not an invented value.

**What lero does NOT take from flatpickr:** range mode (`startRange`/`endRange`/`inRange` connector shadows), the
time picker (`.flatpickr-time`), the week numbers (`.flatpickr-weekwrapper`), and the year `numInput` spinner —
lero's DatePicker is single-date, no time, Monday-first. Those flatpickr sub-parts are out of scope (do not port).

## 6u. Metric / stat card (dashboard KPI tile) — ZIP-CITED, extracted from `index.html` "Metric Item" (Task 597, 2026-07-14)

> **Step 0 result — NOT an honest-negative. The zip HAS the metric card.** `index.html` (dashboard) renders the
> "Metric Group One" block with two `<!-- Metric Item -->` tiles (Customers 3,782 / Orders 5,359). Extracted
> directly from that markup + `css/style.css` tokens — no live capture needed (clause 16a N/A). Used for the
> homepage stats block migration (Task 597): three KPI tiles (Active listings / Cities / Agents).

**Markup source:** `index.html` → `.grid.grid-cols-1.gap-4.sm:grid-cols-2` → each `<!-- Metric Item -->`.
**CSS source:** `css/style.css` → `--text-title-sm: 30px / 38px`, `--text-theme-sm: 14px / 20px`, gray/semantic ramps (§1).

**Card wrapper (cited literal):** `rounded-2xl border border-gray-200 bg-white p-5 md:p-6`
- radius `2xl` (16px) · border `gray-200` (#e4e7ec) · bg white · **no shadow** (flat, per §6 content-card rule) · padding 20→24 (`p-5 md:p-6`).

**Icon badge (cited literal):** `flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100`
- 48×48 · radius `xl` (12px) · bg `gray-100` (#f2f4f7) · icon 24px, `fill-gray-800`/`text-gray-800` (#1d2939).

**Value + label row (cited literal):** `mt-5 flex items-end justify-between` wrapping:
- **Label:** `<span class="text-sm text-gray-500">` → 14/20, `gray-500` (#667085). (lero: source from `t()`.)
- **Number:** `<h4 class="mt-2 text-title-sm font-bold text-gray-800">` → **30px/38px, bold, `gray-800`** (#1d2939), `mt-2` (8px) below label.

**Trend badge (cited literal, OPTIONAL — omit when there is no trend datum):**
`flex items-center gap-1 rounded-full py-0.5 pl-2 pr-2.5 text-sm font-medium` +
- positive: `bg-success-50 text-success-600` (#ecfdf3 / #039855) with an up-arrow 12px svg;
- negative: `bg-error-50 text-error-600` (#fef3f2 / #d92d20) with a down-arrow 12px svg.
- **lero Task 597 omits the trend badge** — the homepage stats have no period-over-period delta. Documented here for completeness / future dashboard reuse.

**Group container (cited literal):** `grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6` (TailAdmin's 2-up).
- **lero override for 3 tiles:** `grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-6` — **1 column full-width `<640` (clause 11 mobile full-width gate: each card spans the row edge-to-edge when stacked), 3-across at ≥640.** The `sm:grid-cols-3` (not `sm:grid-cols-2`) is the only deviation from the zip's group, justified by the 3-tile count; every per-tile token above stays zip-literal.

**Brand note:** the metric card uses NO brand color — it is a neutral white/gray tile. This is a deliberate visual change from lero's legacy brand-red stats strip (owner decision 2026-07-14: adopt TailAdmin white metric cards). The icon color stays `gray-800`, not brand.

## 7. Application plan

1. **Task 484 (MM.0):** encode §1–§5 tokens + §6 core component defaults (Card, Table, Badge, Button, Input,
   Select, Textarea, focus ring) into `theme.ts`; cite this doc from `mantine-responsive-design-system.md` §6.
2. **MM slices:** each surface/primitive migration applies the §6 conventions for the components it uses,
   consuming theme tokens (zero raw spacing px).
3. **Gate:** any migrated surface that hand-rolls spacing/color instead of theme tokens FAILS review.
