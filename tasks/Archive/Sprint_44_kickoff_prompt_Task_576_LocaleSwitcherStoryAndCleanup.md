# Task 576 — `LocaleSwitcher` Mantine story + inert-prop cleanup + restore Admin QA evidence

**Sprint:** 44 (Header → Mantine + presentational split — Epic MM Phase-2). **Executor:** Sonnet 4.6.
**Type:** UI / story + cleanup (NOT a redesign, NO product-behavior change).
**Depends on:** Task 575 landed. **Plan + shared gates/STOP-AND-ASK:** `tasks/Sprints/Sprint_44_Header_Mantine_Primitives.md`.

## Why

Post-574, `LocaleSwitcher` is already a prop-driven component but (a) has **no Storybook story** of its own, and (b)
still carries three now-**inert** props (`align`, `side`, `defaultOpen`) kept only so the out-of-scope
`AdminLocaleSwitcher.tsx` compiled. This task gives `LocaleSwitcher` its own Mantine story on fixtures, removes the
dead props, and restores the admin open-state QA evidence WITHOUT `defaultOpen`.

## Files in scope

- `src/components/shared/LocaleSwitcher.tsx` — remove inert `align` / `side` / `defaultOpen` from the interface.
- `src/stories/mantine/primitives/LocaleSwitcher.stories.tsx` — **NEW canonical Mantine story** (per the plan's 🔴
  Canonical Mantine story location gate): title `Mantine/Primitives/LocaleSwitcher`, wrapped in `MantineStoryShell`,
  single `Default` with the default / `showLabel` / `isPending` (spinner-disabled) fixtures stacked; per-locale via
  toolbar. `import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher'`. **NOT** co-located in
  `src/components/shared/`. (`AdminLocaleSwitcher.stories.tsx` below stays in `Admin/*` — it already has a durable
  `ASSERT_STORIES` entry, so it does not move.)
- `src/components/admin/AdminLocaleSwitcher.tsx` — stop passing `align`/`side`/`defaultOpen`; drop the now-unused
  `defaultOpen` prop (keep `className`/`showLabel`/`onSwitch`/`isPending`). Admin sidebar behavior preserved
  (menu still opens upward via Mantine auto-flip; `setAdminLocale` → `router.refresh()`).
- `src/components/admin/AdminLocaleSwitcher.stories.tsx` — restore the `MobileBottomSheet` open-state evidence via a
  Storybook **play/interaction** that taps the trigger at `@320` (NOT `defaultOpen`, NOT controlled mode).

**MUST NOT touch:** `MantineDropdownMenu.tsx` (do NOT add open-state control — intentionally uncontrolled),
`Header.tsx` overlay wiring, any other file.

## Current behavior to PRESERVE

- Header + Admin usages of `LocaleSwitcher` render identically (no product change) — `align`/`side` loss is a
  practical no-op (Mantine default `bottom-start` + auto-flip); `defaultOpen` was QA-only.
- `AdminLocaleSwitcher` keeps its 3 stories; `MobileBottomSheet` again demonstrates the OPEN full-width bottom sheet.

## Gates + STOP-AND-ASK

Apply the plan's **Per-task gates** + **Standing STOP-AND-ASK**. Task-specific:
- **#A** — if a Storybook play/interaction can't reliably open the sheet under `screenshots:assert` (the rendered gate
  may not run interactions), STOP and ASK — do NOT re-add `defaultOpen`/controlled mode to force it.

## Acceptance criteria

1. `LocaleSwitcher.tsx` no longer declares `align`/`side`/`defaultOpen`. *(diff)*
2. `AdminLocaleSwitcher.tsx` no longer passes them; sidebar switch behavior preserved. *(diff)*
3. `src/stories/mantine/primitives/LocaleSwitcher.stories.tsx` (title `Mantine/Primitives/LocaleSwitcher`,
   `MantineStoryShell`, single `Default`) renders default/showLabel/isPending fixtures, no hook mock, and appears in
   the standing `--mantine-only` auto-discovery sweep. *(diff + render)*
4. `AdminLocaleSwitcher` `MobileBottomSheet` shows the OPEN sheet via interaction (no `defaultOpen`). *(diff + render)*
5. `tsc=0`/lint/`check:stories`/`screenshots:assert` green; file-integrity clean. *(transcripts)*
