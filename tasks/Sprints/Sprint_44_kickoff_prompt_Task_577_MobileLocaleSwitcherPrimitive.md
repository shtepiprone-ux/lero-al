# Task 577 — Header: use the ONE canonical adaptive `LocaleSwitcher` at all breakpoints (delete the redundant mobile combobox)

**Sprint:** 44 (Header → Mantine + presentational split — Epic MM Phase-2). **Executor:** Sonnet 4.6.
**Type:** UI / dedup — remove a redundant parallel implementation. **NO new UI, NO redesign.**
**Depends on:** Task 576 landed + **Task 581 landed** (globe removed from `LocaleSwitcher`). Rebase on 581 so the
rendered proof is on the no-globe switcher. **Plan + shared gates/STOP-AND-ASK:** `tasks/Sprints/Sprint_44_Header_Mantine_Primitives.md`.

## Why (owner decision, 2026-07-11)

The header currently ships **two** locale switchers: the canonical `LocaleSwitcher` (`MantineDropdownMenu`) shown
only `≥640` (`hidden sm:flex`), and a **separate** inline `MantineCombobox` shown only `320–639` (`sm:hidden`). The
canonical `LocaleSwitcher` is ALREADY adaptive — on `<640` its `MantineDropdownMenu` renders as a full-width bottom
sheet — so the second implementation is redundant. **Use the one canonical adaptive `LocaleSwitcher` everywhere and
delete the mobile combobox.** This supersedes the earlier "extract a `MobileLocaleSwitcher` primitive" plan for 577
(there is no second component to extract — there will be one switcher).

## Files in scope

- `src/components/layout/Header.tsx` — the ONLY file:
  1. Remove `className="hidden sm:flex"` from the `<LocaleSwitcher onSwitch={switchLocale} … />` at line ~151 so it
     renders at **all** breakpoints. (Pass no `className`, or whatever the desktop default already is — do not add new
     styling.)
  2. **Delete** the entire `{/* Mobile locale switcher … */}` block (the `<div className="sm:hidden"><MantineCombobox
     …/></div>`, ~lines 153–167) including its comment.
  3. Delete the now-unused `localeOptions` array (~lines 77–81) and remove `MantineCombobox` /
     `MantineComboboxOption` from the `@/design-system/mantine/patterns` import **only if** nothing else in the file
     still uses them (grep first — if another usage exists, keep the import and STOP-AND-ASK, do not touch that usage).
  4. Remove any variable left unused by the deletion (e.g. `noResultsLabel`/`tc('no_results')` if `tc` becomes unused
     — verify `tc` isn't used elsewhere before removing the `useTranslations('common')` line).

**MUST NOT touch:** `LocaleSwitcher.tsx` (consume as-is, post-581), `MantineCombobox.tsx`, `MantineDropdownMenu.tsx`,
`AdminLocaleSwitcher.tsx`, routing/`switchLocale`, `LOCALES`, any locale JSON, any other file.

## Current behavior to PRESERVE / required after-behavior

- **≥640:** identical to today — the `LocaleSwitcher` dropdown (no globe, per 581; chevron + spinner kept).
- **<640 (NEW):** the SAME `LocaleSwitcher` now renders here too. Its compact `EN ⌄` trigger sits inline next to the
  hamburger/other compact header controls (documented icon/compact-trigger exemption, clause 11 — unchanged from how
  the old combobox trigger was exempted). On open it is a **full-width bottom sheet** (drag handle, ≤90dvh scroll,
  closes on backdrop tap + Esc, focus returns to trigger) — the `MantineDropdownMenu` mobile behavior already proven
  in the `Mantine/Primitives/LocaleSwitcher` story.
- Locale switch still calls `switchLocale` → `setAdminLocale` + `router.push` — unchanged. `uk` still shows `UA`.

## Positive / Negative flow

- **Positive:** at 320 and at 1280, click the (single) switcher → list SQ/EN/UA/IT → select another → route swaps,
  UI re-renders in the new locale, sheet/menu closes, focus returns.
- **Negative:** Esc / backdrop tap / re-click closes with no change; pending disables + shows spinner; selecting the
  current locale is a no-op; no horizontal scroll at 320 in any of sq/en/uk/it; no duplicate switcher visible at any
  breakpoint (exactly ONE language control per breakpoint — the Task-574 human-eye cell).

## Gates

Apply the plan's **Per-task gates**. Specifically:
- **Rendered matrix (clause 12):** 320·375·390·768·1280·1440·2560 × sq/en/uk/it, uk@320/375/390 mandatory. Prove: at
  `<640` the ONE switcher opens as a full-width bottom sheet; at `≥640` the dropdown is unchanged; **exactly one**
  language switcher visible at every breakpoint (no leftover combobox). Machine `screenshots:assert -- --mantine-only`
  green + the Task-574 one-switcher-per-breakpoint human-eye cell.
- **Mobile <640 full-width (clause 11):** the popup is full-width bottom sheet; the compact trigger exemption is
  documented (same as the removed combobox had).
- **TailAdmin (clause 16):** unchanged — no style drift, no invented values.
- **Locale parity:** N/A (no string keys added/changed). If the `no_results`/`language` combobox keys become fully
  unused after deletion, DO NOT delete them from the JSON in this task (out of scope) — just note it for a later sweep.
- **File-integrity (clause 14)** clean; `tsc=0`/lint/`check:stories`/`check:i18n` green.

## Acceptance criteria

1. `Header.tsx` renders a single `<LocaleSwitcher>` with no `hidden sm:flex`; the `sm:hidden` `MantineCombobox` block
   + `localeOptions` are deleted; no unused import/var remains. *(diff)*
2. At every breakpoint exactly ONE language switcher renders; `<640` it is a full-width bottom sheet, `≥640` the
   unchanged dropdown. *(render matrix + human-eye cell)*
3. Locale switching + `uk→UA` + pending/disabled behavior unchanged. *(render)*
4. `tsc=0`/lint/`check:stories`/`check:i18n`/`screenshots:assert` green; file-integrity clean; Files-Changed table +
   AC self-audit in the session log; NO `git add`/`git commit` emitted by Sonnet. *(transcripts)*
