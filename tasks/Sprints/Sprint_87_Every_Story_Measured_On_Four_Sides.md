# Sprint 87 — every Story sits at its real distance from the screen edge, measured on four sides

**Opened:** 2026-10-01 · **Status:** 🟠 **OPEN** · **Landed tasks:** 0 · **Kickoffs filed:** 1 (909)

> **These counts drift.** Re-derive them from the Tasks table below, never from this line.

> **Opened by owner instruction, 2026-10-01, verbatim:** *"Але твоє правило не працює тому, що тест зелений, а
> насправді не всюди є відступи."* and *"треба щоб тест вимірював всі 4 сторони, і якщо немає відступу - додавати"*.
> The trigger was `Patterns/Mantine/DashboardGrid` → `Default` at 1234px: the cards touched the top edge, while every
> GR-3d receipt and probe had passed, because they measured only left and right.

## The defect

GR-3d (`docs/golden-rules.md`) has had **no automated gate** since it was written on 2026-09-29. It is enforced by
receipts, which the executor writes and the reviewer checks against measurements that both of them choose. Every
measurement so far read only the left and right edges. A Story whose content touches the top or the bottom edge
passed all of them.

## Goal

One blocking CI gate measures **all four sides** of every canonical Mantine Story in the built Storybook, and fails
when any side has no gutter. Every Story it finds failing on day one is fixed in the same sprint, in the place the
rule names: the component where the real page lacks the side too, and the Story (`StoryPageGutter`, optionally
per-axis) where only the Story does.

## Decisions

| ID | Question | Owner answer (verbatim) | Binding consequence |
|---|---|---|---|
| **D87-1** | (2026-10-01, AskUserQuestion) The four-side audit also fails shell chrome — `AdminHeader`, `AdminSidebar`, `AdminLocaleSwitcher`, `AdminShell` — which the real page places at the screen edge. How does the gate treat them? | *"Іменний список-виняток (Recommended)"* (option: *"Story хрому оболонки (хедер, навбар, сайдбар, drawer) стоять у явному списку в скрипті з причиною для кожної. Гейт друкує цей список на кожному запуску. Додати Story до списку можна лише з вашим рішенням. Усі інші Story мають мати відступ з усіх 4 сторін."*) | 909 R4: a named shell-chrome list in `check-story-gutters.mjs`, starting with those four titles; any addition needs a quoted owner decision. |

## Tasks

The Tasks table is the single state source.

| # | Title | P | QA | Depends on | State |
|---|---|---|---|---|---|
| **909** | `check:story-gutters` — four-side edge gate over every canonical Mantine Story, `StoryPageGutter sides`, and every Story it fails fixed | P1 | Q3 (+ planted-violation proof) | **890** revision 3 landed (the dashboard grid's own vertical gutter) | `KICKOFF FILED` → [`…_Task_909_…`](Sprint_87_kickoff_prompt_Task_909_Story_Gutters_Four_Sides_Gate.md) |

## Execution order

| Step | Task | Gate |
|---|---|---|
| 1 | ~~**890** revision 3 (Sprint 78)~~ ✅ landed 2026-10-01 | `MantineDashboardGrid` carries all four sides; without it, 909 would wrap the grid Stories in the Story instead of fixing the real page. |
| 2 | **909** | — |

## Preconditions

- GR-3d as amended on 2026-10-01 ("Four sides") is the rule the gate enforces.
- `check:card-track-monotonicity` (Task 815) is the precedent for a blocking Playwright gate over `storybook-static` in
  `governance-pr.yml`.

## Exit criteria

- `npm run check:story-gutters` and its `:verify` self-test run in CI after `build-storybook` and block.
- Zero canonical Mantine Stories with a side under the minimum gutter, with no baseline, apart from the D87-1
  shell-chrome list.
- `docs/golden-rules.md` → Enforcement status lists the gate for GR-3d.
