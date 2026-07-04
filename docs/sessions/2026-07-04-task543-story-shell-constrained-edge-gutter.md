# Task 543 — MantineStoryShell: constrained-mode ≥640 edge gutter fix

**Executor:** Opus orchestrator (owner explicitly authorized the direct one-line change, 2026-07-04:
*"зроби сам задачу 543, якщо це однорядкова зміна"*). **Type:** UI / story-harness layout, ONE file.
**Status:** IMPLEMENTED, HELD pending owner native gate + orchestrator commit emission.
Kickoff: `tasks/Sprints/Sprint_40_kickoff_prompt_Task_543_StoryShellConstrainedEdgeGutter.md`.

## Problem

Owner found (2026-07-04) that the `Mantine/Primitives/Tabs` and `Table` stories render with **0px horizontal
padding from the screen edges** at `≥640` (e.g. 773px), while every `width="full"` story (TextInput, etc.) has the
correct edge gutter. Sonnet restarted Task 541 three times without fixing it — the cause is not in the Tabs code.

## Root cause

`src/stories/mantine/_MantineStoryShell.tsx`, middle `Box`: the §6m outer horizontal gutter was applied only for
`width="full"` (`px={isConstrained ? undefined : {...}}`). For `width="constrained"` (Table + Tabs only) `px` was
`undefined`; the `maw:1536`+`mx:'auto'` cap only centers above 1536px, so below the cap the white card spanned
edge-to-edge at 0px.

## Fix (one change + comment)

`px` now applies `{ base: 0, sm: 'md', md: 'xl' }` in BOTH modes; `maw`/`mx` stay constrained-only (cap + centering).
`<640` is byte-identical (`base:0` full-bleed preserved — mobile gate intact); `full` stories are pixel-identical
(their `px` value is unchanged). JSDoc + inline comment updated to record the Task 543 gutter.

## Files Changed

| Path | Rationale |
|---|---|
| `src/stories/mantine/_MantineStoryShell.tsx` | Middle `Box` `px` moved out of the `isConstrained` ternary so the §6m 16/24px edge gutter applies in both modes; JSDoc/inline comment updated. No other change. |

## Verification — HELD for native run

Orchestrator cannot run the rendered gate in the Cowork sandbox (sandbox = screen, native = verdict). Owner to run
natively and confirm before commit:

- `npx tsc --noEmit` → 0 errors.
- `npm run screenshots:assert -- --mantine-only` → Tabs + Table cards inset 16/24px at ≥640 × sq/en/uk/it (matching
  the `full` stories), `<640` still full-bleed, `full` stories unchanged, **no new FAIL**. Watch finding (b): the
  Table is `constrained` because it is wide — confirm the narrower column does not newly clip/overflow (it scrolls
  within its own `ScrollArea` as before). If it does, STOP — do not remove the gutter; route back.
- `check:stories` / `check:i18n` / `check:mojibake` / `check:design-tokens --strict` / `check:file-integrity` green.

## AC self-audit

| # | AC | Status |
|---|---|---|
| 1 | `px` applies to both modes; `maw`/`mx` constrained-only; comment updated; no other file touched | ✅ (diff = 1 file) |
| 2 | Tabs + Table inset at ≥640, `<640` full-bleed, `full` unchanged | ⏳ pending owner native `--assert` |
| 3 | Table does not newly clip/overflow | ⏳ pending owner native `--assert` (finding b) |
| 4 | Light gates green + planted-violation | ⏳ pending owner native run |
| 5 | Session log + Files-Changed + self-validation | ✅ this file |

**Self-validation: code change complete (1 file, scope-clean); tsc/rendered gate = owner native run pending.**
No git run — HELD for orchestrator commit emission after the native gate is green.
