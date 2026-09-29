# Sprint 85 — Stories sit on the page like production

**Opened:** 2026-09-29 · **Status:** 🟠 **OPEN** · **Landed tasks:** 0 · **Kickoffs filed:** 0 · **Reserved:** 1 (898)

> **These counts drift.** Re-derive them from the Tasks table below, never from this line.

> **Opened by the orchestrator on 2026-09-29**, while recording the owner's O78-6 return for Task 877. The owner
> wrote: *"необхідно занести в правило, що під час створення Story необхідно дотримуватись канонічних відступів від
> країв екрану! Це постійна проблема."* The rule is `docs/golden-rules.md` GR-3d. This sprint moves the Stories that
> already exist onto it, and adds the gate.

## Owner decisions

| ID | Date | Decision (verbatim) | Consequence |
|---|---|---|---|
| **D85-1** | 2026-09-29 | Asked which edge gutter is canonical for a Story. Chosen option: *"Як у продакшні (Recommended)"*. The option read: the Story repeats the gutter of the page where the component lives in production, through one shared harness, with admin at 24px and 32px from 1024px, public at `.container-wide`, and overlays exempt. | GR-3d. One harness, `StoryPageGutter` (`src/stories/_StoryPageGutter.tsx`). Task 877 creates it with the `admin` surface. |
| **D85-2** | 2026-09-29 | Asked about the other Stories with the same defect (~57 in `Patterns/Mantine`). Chosen option: *"Окрема задача + гейт (Recommended)"*. The option read: 877 fixes only its own Stories, and a separate task moves all Stories onto the shared harness and adds a detector that fails CI on a Story without it. | Task **898**. |

## The defect

A `skipCanvas` Story drops the `.container-wide py-6` canvas (`.storybook/preview.tsx` `withCanvas`) and then picks
its own padding.

Measured 2026-09-29, with a grep of the Story files, not a render:
- 64 `src/stories/patterns/mantine/*.stories.tsx` files set `skipCanvas: true`;
- 57 of them use neither `MantineStoryShell` nor the §8.1 form `px={{ base: 'md', sm: 'xl' }}`.

The values seen include no gutter at all (`AdminCurrenciesView`) and a fixed `p="md"` at every width.
`docs/mantine-responsive-design-system.md` §8.1 named three different "canonical" gutters until GR-3d superseded it.

## Goal

Every Story's page content sits at the edge gutter of its production page, through `StoryPageGutter`. A blocking
gate fails on a page-content Story that bypasses the harness or writes its own gutter.

## Goal-fit — why no open sprint takes this

| Open sprint | Goal | Fits? |
|---|---|---|
| 46 | ListingCard de-Tailwind + overlay exit | No |
| 55 / 56 / 57 | ARIA semantics · raw enum leaks · deletions | No |
| 61 / 62 | projection-layer detector · Tailwind runtime tokens | No |
| 69 / 70 / 71 | `/listings` · site chrome · listing detail | No — routes, not the Story harness |
| 72 / 73 / 74 | similar listings · sold visibility · card width | No |
| 77 | full test suite | No |
| 78 | admin and agent dashboards | No — it covers admin surfaces only, and this change covers every Story |
| 79 | CMS pages | No |
| 83 | responsive text size | No — type scale, not layout gutter |
| 84 | 24-hour clock | No |

## Tasks

The Tasks table is the **single state source**.

| # | Outcome | State |
|---|---|---|
| **898** | Every page-content Story moves onto `StoryPageGutter`. The task adds and measures the public surface branch(es) from the real production page frames. It also adds a blocking gate, with a self-test and two-armed plants, that fails on a `skipCanvas` page-content Story without the harness or with a gutter written in the Story. | reserved 2026-09-29, **P2**, after **877** (which creates the harness). Full text → `docs/backlog-reserved.md` |

## Execution order

1. **877** (Sprint 78) creates `StoryPageGutter` with the `admin` surface, and moves its own four page-content
   Stories onto it.
2. **898**: census, then the kickoff, then the sweep and the gate.
