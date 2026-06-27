# Sprint 38 — MM Phase 1, Batch B — Form controls

> **Program:** `docs/mantine-tailadmin-migration-tracker.md` (Phase 1). **Reference (copy-source):**
> `docs/tailadmin-style-reference.md` §6 + §6d + `demo_tailadmin_com.zip` (repo root). **Theme:** `src/design-system/mantine/theme.ts`.
> **Executor:** Sonnet 4.6 (writes code). **Orchestrator:** Opus (these kickoffs; reviews rendered side-by-side with the reference).
> **Scope of this sprint:** the 9 form-control primitives — P1.01 Button, P1.02 TextInput(+input-group), P1.03 Select,
> P1.04 Textarea, P1.05 Checkbox, P1.06 Radio, P1.07 Switch, P1.30 PasswordInput(+RequirementsHint), P1.28 Label.
> **Tasks 493–501.** Next free after this sprint: 502.

## 🔴 DENSITY CORRECTION — read before any block (owner P0, Task 492, 2026-06-26)
The reference doc §6 rows say "size md". **That is superseded.** Owner rejected `md` (16px) as oversized and approved
**`size="sm"` (14px text) + `minHeight: '2.75rem'` (44px / TailAdmin `h-11`)** for Button/TextInput/Select/Textarea/Switch.
These defaults are ALREADY in `theme.ts` (Task 492). Every block below builds on the `sm` density — do NOT set `size="md"`
on a form control, and do NOT remove the 44px min-heights. Inputs render 14px text inside a 44px-tall control.

## Shared Definition of Done (applies to EVERY task — from the tracker §"Per-slice DoD")
1. TailAdmin values applied EXACTLY from the cited `tailadmin-style-reference.md` §; zero invented px/colors.
2. **🔴 ZERO HARDCODE:** no raw colors (theme tokens only — `c="gray.7"`, `var(--mantine-color-*)`, brand), no raw
   spacing/radius px (Mantine tokens; sole exemptions `mih/minHeight:"2.75rem"`, `minWidth:0`/`flexShrink:0`, justified
   micro-gaps — all raw rem in `src/design-system/mantine/**` is allowlisted theme-input), no hardcoded user-facing
   strings (`storyT()` ×4 locales in stories), no raw `<button>/<input>/<select>/<textarea>`.
3. **Rendered proof matrix:** 320/375/480 × en/uk + sq/it@320 (uk@320/375/390 mandatory), attached PNG/JSON. No
   clip/overflow, no h-scroll@320, controls full-width `<640` (`max-sm` / Mantine `fullWidth` where the control is interactive).
4. Gates green: `tsc=0`, `check:stories`, `check:i18n`, `check:design-tokens`. (Green ≠ visual proof.)
5. No control/behavior regression (Note 19/20); locale parity sq/en/uk/it.
6. Story = Mantine proof path (`parameters.skipCanvas:true` + `layout:'fullscreen'`, single `Default` export,
   toolbar-driven viewport+locale, `storybook.mantine.*` namespace via `storyT()`), rendered in a modest padded
   canvas (`Box px={{base:'md',sm:'xl'}} py="md"`). NO product-surface edits in Phase 1.
7. Files Changed table in the session log; **executor emits NO git** — orchestrator emits commits after diff review.
8. **Approval only after the orchestrator views the rendered story side-by-side with the reference.** tsc/green ≠ approval.

**Pre-read (every block):** `docs/agent-contract.md`, `docs/backlog.md`, `docs/critical-flow-registry.md` (scan),
`docs/mantine-responsive-design-system.md` (§7 mobile gate, §8 Storybook proof, §12 patterns), `docs/tailadmin-style-reference.md`
§6/§6d, `docs/storybook-governance.md`, `docs/component-rules.md`, `docs/qa-rules.md`. Each task edits `theme.ts`
`components.<X>` defaults (if refinement needed beyond Task 492) + creates `src/stories/mantine/primitives/<X>.stories.tsx`.

## Run order
493 Button → 501 Label → 494 TextInput → 496 Textarea → 500 PasswordInput → 495 Select → 497 Checkbox → 498 Radio → 499 Switch.
(Label before the text inputs because inputs reuse its 14px/fw500/gray-700 label treatment; choice controls last.)

---

## Task 493 — Button primitive → TailAdmin (P1.01)
**Ref:** §6 Button (primary + secondary/outline rows).
**Required values (theme — verify/refine, mostly already set by Task 492):** `radius="lg"` (8), default `size="sm"` (14px),
`minHeight:'2.75rem'` (44px), `fw=500`. Variant mapping to showcase (Mantine variant → TailAdmin): **primary** = `variant="filled"`
`color="brand"` (`bg-brand-500` / hover `bg-brand-600`, white text); **secondary/outline** = `variant="default"` (white bg,
`gray-3` border, `gray-7` text, hover `gray-0`, `shadow-xs`); **ghost** = `variant="subtle"` (`gray-7`, hover `gray-0`);
**destructive** = `variant="light" color="red"`; **link** = `variant="transparent"`/`Anchor`. Disabled = Mantine default
(`opacity` + no pointer). NO `size="md"`.
**Current to preserve:** existing Mantine `Button` consumers (12 call sites) keep their explicit `variant`/`color`/`size`
props; only the theme default density/chrome is refined. No product-surface edits.
**Positive flow:** render each variant (filled brand / default / subtle / light-red / transparent) at the default sm size —
14px medium text, 44px tall, radius 8, brand fill correct; with leading icon; `fullWidth` example fills the frame `<640`.
**Negative flow:** disabled state (dimmed, no pointer); long uk label (`Зберегти зміни`) wraps `whitespace-normal` and the
button stays ≥44px, no clip at 320; `loading` prop shows the Mantine loader without changing height.
**Story:** one `Default`; sections = variants row, sizes (xs/sm only — NOT md), with-icon, full-width `<640`, disabled, loading;
labels via `storyT('storybook.mantine.button_*')` ×4 locales.
**AC:** theme Button = §6 + Task 492 density (sm/14px/44px) verified in render; every variant on-palette (no raw color);
full-width `<640`; matrix green incl. uk@320/375/390; zero hardcode.

## Task 494 — TextInput (+ input-group) primitive → TailAdmin (P1.02)
**Ref:** §6 Input row + §6c (input-group / leading-trailing affordances).
**Required values:** `radius="lg"` (8), `size="sm"` (14px), `minHeight:'2.75rem'` (44px — already set), border `gray-2`
(`#e4e7ec`), `placeholder` `gray-4`, text `gray-8`, focus = brand ring (`focus:border-brand-300` + `focus:ring-brand-500/10`
ring-3 → Mantine focus styles via `--mantine-color-brand-*`; if not achievable with tokens alone, STOP and ASK before adding
CSS). `shadow-xs`. Label via the §6 Label treatment (Task 501). `leftSection`/`rightSection` for input-group icons.
**Current to preserve:** existing `TextInput` consumers (4) keep props; only theme chrome refined.
**Positive flow:** input renders 44px tall, 14px text, gray-2 border, brand focus ring; with `leftSection` icon; with label +
description; `error` state shows red border + message.
**Negative flow:** `error` (red border/text, `aria-invalid`); `disabled` (dimmed, no focus ring); required-empty; long uk
label/placeholder wraps, no clip/h-scroll at 320; full-width `<640`.
**Story:** label+input, with-icon (input-group), error, disabled, full-width `<640`; strings via `storyT()` ×4.
**AC:** §6 values in render; brand focus ring; 44px/14px; error+disabled present; full-width `<640`; zero hardcode; matrix green.

## Task 495 — Select primitive → TailAdmin (P1.03)
**Ref:** §6d Select (native, custom chevron).
**Required values:** `radius="lg"`, `size="sm"` (14px), `minHeight:'2.75rem'` (already set), border `gray-3`, chevron right
(Mantine `rightSection`), option text `gray-7`, focus brand ring. **Dropdown at `<640` = full-width bottom sheet** per the P0
overlay rule (Mantine Select dropdown → bottom-sheet treatment; if the canonical bottom-sheet wiring for Select is not already
in the theme/a wrapper, STOP and ASK — do not invent).
**Current to preserve:** `Select` consumer behavior (single-select, search if used).
**Positive flow:** select renders input chrome identical to TextInput + chevron; open shows options (gray-7); selection updates;
desktop anchored dropdown, `<640` full-width bottom sheet.
**Negative flow:** empty/placeholder; disabled; long uk option (`Адміністратор`) no clip; keyboard/aria; no h-scroll@320.
**Story:** label+select with 3–4 options, open state, disabled; `storyT()` ×4.
**AC:** §6d values; chevron; brand focus; `<640` bottom-sheet (or STOP-and-ASK noted); zero hardcode; matrix green.

## Task 496 — Textarea primitive → TailAdmin (P1.04)
**Ref:** §6 Input row (multiline).
**Required values:** `radius="lg"`, `size="sm"` (14px), border `gray-2`, focus brand ring, `shadow-xs`. NO fixed 44px height
(multiline) — `autosize` optional with `minRows`. Padding matches input (`py-2.5 px-4` → Mantine sm).
**Current to preserve:** `Textarea` consumers (2) keep props.
**Positive flow:** textarea renders 14px text, gray-2 border, brand focus; multi-line grows (autosize) if set; label+description.
**Negative flow:** error (red), disabled, required-empty; long uk content wraps, no h-scroll@320; full-width `<640`.
**Story:** label+textarea, error, disabled, full-width `<640`; `storyT()` ×4.
**AC:** §6 values; 14px; error+disabled; full-width `<640`; zero hardcode; matrix green.

## Task 497 — Checkbox primitive → TailAdmin (P1.05)
**Ref:** §6d Checkbox.
**Required values:** `radius="sm"` (4 — already set), brand checked fill (`color="brand"`), unchecked border `gray-3`, 14px
label `gray-7`, ≥44px touch target on the label/row (rem exemption). Indeterminate state styled like checked.
**Current to preserve:** `Checkbox` consumers keep props.
**Positive flow:** unchecked (gray-3 border) → checked (brand fill + white check) → indeterminate; label 14px gray-7.
**Negative flow:** disabled (dimmed); long uk label wraps beside the box, no clip at 320; keyboard toggle/aria.
**Story:** single, checked, indeterminate, disabled, group with long uk labels; `storyT()` ×4.
**AC:** §6d values; brand fill; ≥44px touch; label wrap; zero hardcode; matrix green.

## Task 498 — Radio / RadioGroup primitive → TailAdmin (P1.06)
**Ref:** §6d (radio — same family as checkbox).
**Required values:** brand checked dot (`color="brand"`), unchecked border `gray-3`, 14px label `gray-7`, ≥44px touch target,
`Radio.Group` vertical `gap="sm"`. radius = circular (default).
**Current to preserve:** `Radio`/`Radio.Group` consumers keep props.
**Positive flow:** group renders options; selecting one deselects others; brand dot; 14px gray-7 labels.
**Negative flow:** disabled option; long uk label wraps; keyboard arrow navigation/aria; no clip at 320.
**Story:** Radio.Group 3 options + long-uk option + disabled; `storyT()` ×4.
**AC:** §6d values; brand dot; ≥44px touch; label wrap; zero hardcode; matrix green.

## Task 499 — Switch primitive → TailAdmin (P1.07)
**Ref:** §6d Switch / toggle.
**Required values:** `size="sm"` (already set), track `gray-2` → brand when checked (`color="brand"`), white knob, `radius="pill"`
track, ≥44px touch target on the wrapping row. Optional on/off label 14px gray-7.
**Current to preserve:** `Switch` consumers (1) keep props.
**Positive flow:** off (gray-2 track) → on (brand track, knob slides); with label; 14px.
**Negative flow:** disabled (dimmed, no toggle); long uk label wraps; keyboard toggle/aria.
**Story:** off, on, with-label, disabled; `storyT()` ×4.
**AC:** §6d values; brand track; ≥44px touch; zero hardcode; matrix green.

## Task 500 — PasswordInput (+ RequirementsHint) primitive → TailAdmin (P1.30)
**Ref:** §6 Input row (PasswordInput shares input chrome; the reveal toggle is `rightSection`).
**Required values:** identical input chrome to TextInput (radius lg, sm/14px, 44px, gray-2 border, brand focus, shadow-xs);
reveal/hide toggle = `rightSection` `ActionIcon variant="subtle"` (≥44px touch, `aria-label` via `t()`). RequirementsHint:
14px, met = `green`, unmet = `gray-5`; tokens only.
**Current to preserve:** `PasswordInput` + `PasswordRequirementsHint` behavior (strength/criteria logic) — visual only.
**Positive flow:** password input renders input chrome + reveal toggle; toggling shows/hides; RequirementsHint updates met/unmet.
**Negative flow:** error (red); disabled; empty; long uk hint lines wrap, no h-scroll@320; full-width `<640`.
**Story:** password field + reveal toggle + RequirementsHint (some met/unmet), error, disabled; `storyT()` ×4.
**AC:** input chrome = §6 incl. 44px/14px; reveal toggle ≥44px + localized aria; hint tokens; full-width `<640`; zero hardcode; matrix green.

## Task 501 — Label primitive → TailAdmin (P1.28)
**Ref:** §6 Label row.
**Required values:** 14px (`text-theme-sm` / Mantine `fz="sm"`), `fw=500`, `c="gray.7"`. Required-asterisk = brand or red (cite
which from the reference; if absent, STOP and ASK). Associates with its control via `htmlFor`/Mantine `Input.Label`.
**Current to preserve:** `label.tsx` consumers; Mantine input labels inherit this via `theme.components.InputWrapper`/`InputLabel`
defaults (add them if labels don't already render 14px/fw500/gray-7).
**Positive flow:** label renders 14px medium gray-7; required shows asterisk; clicking focuses its input.
**Negative flow:** long uk label wraps, no clip at 320; disabled-control label dimmed consistently.
**Story:** label + input pairs (normal, required, long-uk); `storyT()` ×4.
**AC:** §6 Label values; 14px/fw500/gray-7; required marker; htmlFor association; zero hardcode; matrix green.

## Task 502 — PhoneField composite primitive → Mantine (P1.31) — NEW (owner directive, 2026-06-27)
**Why:** During the Task 494 review the owner clarified that a phone number is NOT a single `TextInput` — in this product
it is the canonical **two-field composite** `PhoneField` (`src/components/shared/PhoneField.tsx`, Task 158/375): a
**dial-code Combobox** (`+355`, country search, multi-country) + a **national-number Input**, mobile-stacked full-width
`<640`, desktop Combobox fixed-width + Input fills. The TextInput story must NOT fake phone with an icon; phone gets its
own Mantine primitive here.
**Ref:** existing `PhoneField.tsx` behavior contract (DOES NOT validate internally; consumers call `validateNationalPhone`);
§6/§6d input chrome for both sub-controls; §6d Select for the dial-code dropdown (P0 `<640` bottom-sheet).
**Required values:** national Input = TextInput chrome (radius lg, sm/14px, 44px, gray-2 border, brand focus, shadow-xs);
dial-code = Select/Combobox chrome (gray-3 border, chevron, `<640` full-width bottom sheet per the P0 overlay rule).
**🔴 STOP-and-ASK:** (a) whether to build a NEW Mantine-native composite vs wrap the existing canonical `PhoneField`;
(b) the dial-code `<640` bottom-sheet wiring if not already canonical in the Mantine theme. Do NOT invent — ask the
orchestrator. This is a kickoff PLACEHOLDER reserving the number; a full kickoff is written when 502 is scheduled
(after the 9 Batch-B controls land).
**Story:** one `Default`; sections = default (empty), filled (`+355 69…`), error, disabled, full-width `<640` stack;
`storyT()` ×4.
**AC:** two-field composite renders dial-code + national; mobile full-width stack `<640`; dial-code dropdown `<640`
bottom-sheet (or STOP-and-ASK noted); chrome matches §6/§6d; zero hardcode; matrix green incl. uk@320/375/390.

---

## Sequencing & numbering
- Run order above (493 → 501 → 494 → 496 → 500 → 495 → 497 → 498 → 499); independent — reviewable one at a time.
- **494 was owner-rejected 2026-06-27 → re-execute via `Sprint_38_kickoff_prompt_Task_494R_TextInput_Rework.md`** (story +
  locale files only; `theme.ts` chrome accepted). **502 (PhoneField composite) added** — schedule after the 9 controls.
- After all 9 ✅: Batch C = overlays (Modal/Drawer/Popover/DropdownMenu/NavigationMenu/Tooltip — P0 bottom-sheet) and
  Batch D = feedback/misc (Alert/Pagination/Progress/Skeleton/Separator/ScrollArea/Slider/Toast/Command).
- **Task numbering — last used: 502 (493–501 Batch B + 502 PhoneField composite). Next free: 503.**
- **STOP-and-ASK triggers in this sprint:** (a) brand focus-ring not achievable with tokens alone (494/495/500);
  (b) Select/any dropdown `<640` bottom-sheet wiring not already canonical (495); (c) required-asterisk color absent
  from the reference (501). Do NOT invent — ask the orchestrator.
