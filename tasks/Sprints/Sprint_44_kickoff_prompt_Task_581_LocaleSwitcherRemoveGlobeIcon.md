# Task 581 — `LocaleSwitcher` — remove the leading Globe icon (owner request)

**Sprint:** 44 (Header → Mantine + presentational split — Epic MM Phase-2). **Executor:** Sonnet 4.6.
**Type:** UI / small chrome change (NO behavior change beyond the icon removal).
**Depends on:** Task 576 landed. **Plan + shared gates/STOP-AND-ASK:** `tasks/Sprints/Sprint_44_Header_Mantine_Primitives.md`.

## Why

The owner asked for the locale switcher **without the leading globe icon**. The `Globe` `leftSection`
(`src/components/shared/LocaleSwitcher.tsx:55`) is pre-existing (it predates Task 576, which was a
no-behavior-change story/cleanup task and correctly preserved it). This task removes ONLY the leading globe.

**Owner decision (2026-07-11):** remove the **globe only**. KEEP the right-side chevron (dropdown affordance)
and KEEP the pending spinner. Do NOT remove the chevron or the spinner.

## Pre-read (UI task, per `docs/rule-index.md`)

- **Always:** `docs/agent-contract.md`, `docs/backlog.md`, `docs/critical-flow-registry.md` (scan — locale switching may be a registered flow; if so, baseline + cover per clause 15).
- **Required:** `docs/mantine-responsive-design-system.md` (§7 mobile gate, §18 theming pitfalls), `docs/tailadmin-style-reference.md` (trigger chrome §6a/§6d), `docs/ui-rules.md`, `docs/component-rules.md`, `docs/qa-rules.md`.

## Files in scope

- `src/components/shared/LocaleSwitcher.tsx` — remove `leftSection={<Globe size={16} />}` from the trigger
  `Button` and remove the now-unused `Globe` import from the `lucide-react` line (keep `ChevronDown`, `Loader2`).
  Nothing else in this file changes: `rightSection` (chevron/spinner), `disabled`, `showLabel`, `className`,
  the items list, and the public props all stay exactly as they are.

**MUST NOT touch:** `AdminLocaleSwitcher.tsx` (it consumes `LocaleSwitcher` — the icon disappears there for free;
verify by render, do not edit), `Header.tsx`, `MantineDropdownMenu.tsx`, any locale JSON (no new/changed strings —
this is icon-only), any other file. If the removal appears to require touching the admin `justify-start gap-1.5`
spacing to avoid a visual defect, **STOP and ASK** — do not silently restyle the admin sidebar.

## Current behavior to PRESERVE (everything except the globe)

- The trigger still shows `{abbr}` (+ ` {langLabel}` when `showLabel`) followed by the right-side **chevron**.
- `isPending` still disables the trigger and swaps the chevron for the **spinner** (`Loader2` spin).
- Dropdown still opens on click, lists all four locales (bold = current), switches on select, closes on
  select / backdrop / Esc, returns focus to the trigger.
- `<640` mobile behavior of the dropdown (full-width bottom sheet + drag handle) unchanged.
- Header + Admin-sidebar usages render identically except for the missing globe.

## Positive flow (happy path)

Actor: any visitor / admin. 1) Trigger renders `EN ⌄` (no globe). 2) Click → dropdown/bottom-sheet opens with
SQ/EN/UA/IT. 3) Select a different locale → `onSwitch(code)` fires (header route swap / admin `setAdminLocale` +
`router.refresh()`), dropdown closes, focus returns to trigger. Post-condition: UI re-renders in the new locale,
trigger shows the new abbr, still no globe.

## Negative flow (every off-happy-path branch)

- **Pending** (`isPending`): trigger disabled, spinner (NOT globe, NOT chevron) shown; clicks no-op; re-entry guarded.
- **Dismiss** (Esc / backdrop tap / re-click): dropdown closes, no locale change, focus returns to trigger.
- **Same-locale select** (admin): `handleSwitch` early-returns (`locale === currentLocale`), no `router.refresh()`.
- **showLabel variant** (admin sidebar, `w-full justify-start`): text still left-aligned and readable with the
  globe gone; no orphan gap, no clip, no overflow at 320 in any locale.

## Gates (apply the plan's per-task gates)

- **Mobile <640 full-width gate:** unchanged by this task — provide rendered proof it did NOT regress (dropdown
  still full-width bottom sheet with drag handle at <640; admin trigger still `w-full`). No new width class needed.
- **TailAdmin conformance (clause 16):** the trigger stays a `variant="default"` Mantine `Button` — border/radius/
  focus-ring/font/density must remain the §6a/§6d chrome; removing the icon must not shift padding off-token.
  Prove rendered side-by-side vs the reference (before/after the same button, only the leading icon gone).
- **Locale parity:** N/A — no string keys added or changed (icon-only). Confirm `check:i18n` still green.
- **File-integrity (clause 14):** read-back the edited file; 0 NUL, parses, `tsc=0`.

## Acceptance criteria

1. `LocaleSwitcher.tsx` no longer renders `leftSection`/`<Globe/>`, and `Globe` is no longer imported. *(diff)*
2. Chevron + spinner (`rightSection`) behavior unchanged; `isPending` still disables + shows spinner. *(diff + render)*
3. Admin sidebar + header render the switcher with NO globe and no spacing/clip defect at 320/375/390 × sq/en/uk/it. *(render)*
4. Rendered verification matrix (breakpoints × sq/en/uk/it, uk@320/375/390 mandatory) in the session log;
   `screenshots:assert -- --mantine-only` green (the `mantine-primitives-localeswitcher--default` story reflects the change). *(transcripts + PNGs)*
5. `tsc=0` / lint / `check:stories` / `check:i18n` / file-integrity all green. *(transcripts)*
6. Session log carries the "Files Changed" table (1 row) + AC-by-AC self-audit. Do NOT emit `git add`/`git commit`.

## Note for Task 577 (`MobileLocaleSwitcher`)

The owner's "no globe" decision applies going forward — the upcoming `MobileLocaleSwitcher` primitive (Task 577)
must also omit the leading globe. Carry this into the 577 kickoff; not in scope for 581.
