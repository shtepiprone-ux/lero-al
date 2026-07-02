# Sprint 40 — TailAdmin conformance: AUDIT + CORRECT every Storybook Mantine primitive (OWNER P0, 2026-07-02)

> **Why this sprint exists.** The owner has repeatedly (≥10×) rejected UI work that does not visually match the TailAdmin
> reference, and is not confident the earlier per-primitive styling (Batch A/B/C, Tasks 486–523) actually renders like
> TailAdmin. Individual primitives were themed, but **the rendered Storybook primitives were never verified side-by-side
> against `demo_tailadmin_com.zip`.** This sprint closes that hole: first a rigorous rendered AUDIT of ALL primitives vs
> the zip, then a correction slice for every primitive that fails. Governed by **agent-contract clause 16** (TailAdmin style
> mandatory) + `docs/orchestrator-role.md` → "TailAdmin conformance gate".

## Source of truth (single, non-negotiable)
- **`demo_tailadmin_com.zip`** (repo root, gitignored): `css/style.css` (tokens) + component class markup in `index.html`
  / `html/*.html`.
- **`docs/tailadmin-style-reference.md`** (§1–§6x) — the extraction. Any value not yet there is extracted from the zip into
  a new §6x row BEFORE it is used. Zero invented values.
- **Brand = `#EC5447`** (project override of TailAdmin `#465fff`). Everything else is TailAdmin (grays, Outfit, type scale,
  radius, `shadow-theme-*`, semantic colors, control chrome).

## Verified token baseline (extracted 2026-07-02 from `css/style.css`)
- **Gray ramp:** 50 `#f9fafb` · 100 `#f2f4f7` · 200 `#e4e7ec` · 300 `#d0d5dd` · 400 `#98a2b3` · 500 `#667085` · 600
  `#475467` · 700 `#344054` · 800 `#1d2939` · 900 `#101828` · 950 `#0c111d`.
- **Semantic:** success 500 `#12b76a` (50 `#ecfdf3`, 600 `#039855`, 700 `#027a48`) · error 500 `#f04438` (50 `#fef3f2`,
  600 `#d92d20`, 700 `#b42318`) · warning 500 `#f79009` (50 `#fffaeb`, 600 `#dc6803`).
- **Type:** Outfit; `text-theme-sm` 14/20 · `text-theme-xs` 12/18 · title scale (`text-title-sm` 30/38 … `text-title-2xl`
  72/90); weights 400/500/600/700.
- **Radius:** `sm` .25rem · `md` .375rem · `lg` .5rem · `xl` .75rem · `2xl` 1rem · `3xl` 1.5rem.
- **Shadow:** `shadow-theme-xs` ≈ `0 1px 2px 0 rgba(0,0,0,.05)` (inputs/controls); cards = flat (border only); `shadow-theme-lg`
  only on dropdowns/popovers/menus.
- **Control chrome (input/select/textarea):** `h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5
  text-sm text-gray-800 placeholder:text-gray-400 shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 focus:ring-3
  focus:outline-hidden` (density = `sm`/14px text + 44px min-height per Task 492).
- **Button primary:** `bg-brand-500 hover:bg-brand-600 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-theme-xs`
  (h-11). **Secondary/outline:** `border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 shadow-theme-xs rounded-lg`.

## Per-slice Definition of Done (agent-contract clause 16 — applies to EVERY correction slice)
1. Every value cited to a `tailadmin-style-reference.md` §-row (extract into a new §6x row from the zip if missing FIRST).
2. **Rendered proof SIDE-BY-SIDE with the zip reference** — the actual TailAdmin component (screenshot/markup from the zip)
   next to the rendered Mantine primitive — at 320/375/480 × en/uk + sq/it@320 (uk@320/375/390 mandatory), plus one ≥640 cell.
   Border color, radius, focus ring, shadow, Outfit font, and density must match. **`tsc=0`/gates are BASELINE, never style proof.**
3. Zero invented color/px/radius/shadow (`check:design-tokens` green + orchestrator greps the diff for raw hex/px).
4. No control/behavior regression (Notes 19/20). Locale parity sq/en/uk/it.
5. Gates green: `tsc=0`, `check:stories`, `check:i18n`, `check:design-tokens`, `check:mojibake`; file-integrity clean.
6. Orchestrator reviews the rendered primitive SIDE-BY-SIDE with the zip before approve.

## Slice 0 — CONFORMANCE AUDIT (Task 525) — do FIRST, no primitive code changes
A rigorous rendered audit of ALL 20 Storybook → Mantine → Primitives against the zip, producing a per-primitive
PASS / DELTA table (each delta = a concrete token/class mismatch with the fix). This is the "повне рев'ю" the owner asked
for; its output drives which correction slices below actually run. Kickoff:
`tasks/Sprints/Sprint_40_kickoff_prompt_Task_525_TailAdminConformanceAudit.md`.

## Primitives in scope (20) — correction slices opened per AUDIT findings (Task 525)
Form controls: **Button · TextInput · Textarea · Select · PasswordInput · Checkbox · Radio · Switch · Label**.
Display/layout: **Badge · Card · Table · Tabs · SegmentedControl · Avatar**.
Overlays: **Popover · DropdownMenu · NavigationMenu · Modal · Drawer** (+ Tooltip once Task 524 lands).

> **Ordering:** run the audit (525) → then correction slices in this order (most-used / foundation first): Button →
> TextInput/Textarea/Select/PasswordInput → Checkbox/Radio/Switch → Label → Badge/Card/Table → Tabs/SegmentedControl →
> Avatar → overlays. Only primitives the audit marks DELTA get a correction slice; PASS primitives are recorded and skipped.
> Each correction slice = one task with the DoD above; ~5–8 slices per working batch to stay balanced.

## Out of scope
Product surfaces (Phases 3–5 of the migration tracker) — this sprint is primitives-only. Dark mode (the zip has dark
classes; the project renders "Light (Tailwind legacy)" — confirm with owner before touching dark). Behavior/API changes
(this is styling conformance, not refactor).
