# Task 577 — `MobileLocaleSwitcher` presentational primitive (<640 combobox)

**Sprint:** 44 (Header → Mantine + presentational split — Epic MM Phase-2). **Executor:** Sonnet 4.6.
**Type:** UI / presentational-primitive extraction (NOT a redesign, NO behavior change).
**Depends on:** Task 576 landed. **Plan + shared gates/STOP-AND-ASK:** `tasks/Sprints/Sprint_44_Header_Mantine_Primitives.md`.
**Sprint ordering:** touches `Header.tsx` — execute in number order, rebase on the prior.

## Why

The `<640` mobile locale switcher (a compact `MantineCombobox`, `Header.tsx` ~178–192, wrapped `sm:hidden`) is
inline in the Header. Extract it into a small prop-driven primitive with its own Mantine story so it renders/tests
on fixtures.

## Files in scope

- `src/components/layout/MobileLocaleSwitcher.tsx` — **NEW** prop-driven primitive.
- `src/stories/mantine/primitives/MobileLocaleSwitcher.stories.tsx` — **NEW canonical Mantine story** (per the plan's
  🔴 Canonical Mantine story location gate): title `Mantine/Primitives/MobileLocaleSwitcher`, `MantineStoryShell`,
  single `Default`, `import { MobileLocaleSwitcher } from '@/components/layout/MobileLocaleSwitcher'`. **NOT** co-located.
- `src/components/layout/Header.tsx` — consume `<MobileLocaleSwitcher value={locale} onChange={switchLocale} />` in
  place of the inline `<div className="sm:hidden"><MantineCombobox …/></div>`.

**MUST NOT touch:** `MantineCombobox` (consume as-is), `LOCALES` shape, routing/`switchLocale`, any other file.

## Current behavior to PRESERVE

- Compact `variant="button"` trigger at ~`6rem` (was `w-24`), `sm:hidden` (visible 320–639 only — icon/compact
  exemption, clause 11, documented), options = the 4 `LOCALES` as `{ value: code, label: abbr, description:
  langLabel }`, `value=locale`, `onChange=switchLocale`. `uk` shows `UA` (post-574). Full-width bottom sheet at <640.

## Primitive API

`MobileLocaleSwitcher({ value, onChange }: { value: string; onChange: (code: string) => void })`. It builds the
options internally from `LOCALES` + `langLabels` (`useTranslations`/`useLocale` are Storybook-provided — allowed),
consumes `MantineCombobox` with the compact trigger, and keeps the `sm:hidden` visibility on a plain wrapper (NOT a
Tailwind display utility on a Mantine root).

## Story fixtures

Single `Default`: the compact trigger, plus the OPEN full-width bottom sheet at `@320` (via interaction).

## Gates + STOP-AND-ASK

Apply the plan's **Per-task gates** (incl. the 🔴 Canonical Mantine story location gate) + **Standing STOP-AND-ASK**.
Story location is RESOLVED (canonical `src/stories/mantine/primitives/`, `Mantine/Primitives/*`) — no longer an ask.

## Acceptance criteria

1. `MobileLocaleSwitcher.tsx` prop-driven; consumes `MantineCombobox`; compact `sm:hidden` trigger; options incl. `uk→UA`. *(diff)*
2. `Header.tsx` renders `<MobileLocaleSwitcher/>`; inline combobox JSX removed; behavior unchanged. *(diff)*
3. `src/stories/mantine/primitives/MobileLocaleSwitcher.stories.tsx` (title `Mantine/Primitives/MobileLocaleSwitcher`,
   `MantineStoryShell`, single `Default`) renders trigger + open sheet from fixtures, no hook mock, and appears in the
   standing `--mantine-only` auto-discovery sweep. *(diff + render)*
4. Rendered matrix (<640 full-width) + TailAdmin present; `tsc=0`/lint/`check:stories`/`screenshots:assert` green; file-integrity clean. *(transcripts)*
