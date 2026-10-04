# Sprint 90 — every rounded corner renders round

**Opened:** 2026-10-04 · **Status:** 🟠 **OPEN** · **Landed tasks:** 0 · **Kickoffs filed:** 0 (920 reserved)

> **These counts drift.** Re-derive them from the Tasks table below, never from this line.

> **Opened by owner instruction, 2026-10-04 (Task 741, O46-3 rows 3–4), verbatim:** *"проблема зі скругленням кутів
> глобальна! Вона повторюється кожного разу! Необхідно написати один раз обов'язкове правило щодо скруглення кутів у
> об'єктів (кнопки, таблиці, елементи і так далі)."* and *"у TailWind і у всіх інших реіференсів кути супер чудово
> скруглені. Проблема лише в моєму проекті."*

## The defect

The owner sees corners that look cut or polygonal across the project. On 2026-10-04 Opus measured the cause on the
paginator (`docs/sessions/evidence/task741r3/rev3g/owner-return/`). The radius value is right (8px, as in TailAdmin), but
two painting choices break the curve:

1. **A border in the same colour as the fill.** The active page control draws a 1px border in its own fill colour. At
   DPR 1 its corner's diagonal coverage is 37/50/38. A fill alone, or a fill with a transparent border, gives 53/85/53,
   the same as TailAdmin; the ideal arc is 60/75/60.
2. **Disabled by `opacity`.** Mantine fades a disabled bordered control to `opacity: 0.4`. The light border's arc then
   drops to 13–15% coverage, and the corner almost vanishes.

Either pattern can sit in any canonical theme entry, chrome stylesheet or pattern. A task that does not touch that
source never fixes it.

## Goal

Every rounded object the project renders — buttons, page controls, inputs, selects, chips, badges, cards, papers, tables
and table wrappers, modals, drawers, popovers, menus, images, avatars — has a corner that reads as a smooth curve, like
its reference, in every state, at DPR 1 and 1.25. Each one is fixed in its canonical source, and the rule (GR-11) binds
every future task.

## Decisions

| ID | Question | Owner answer (verbatim) | Binding consequence |
|---|---|---|---|
| **D90-1** | (2026-10-04, AskUserQuestion) The corner rule goes into golden-rules for every task. What happens to the objects that already exist across the project? | *"Окрема задача-аудит (Recommended)"*. The option read: a new task photographs every canonical primitive and pattern at DPR 1 and 1.25, in every state, beside TailAdmin, and fixes every cut, faded or polygonal corner in its canonical source; the paginator is fixed in 741 already. | **920**: the audit and the fixes, below. GR-11 (`docs/golden-rules.md`) binds every task from 2026-10-04. |

## Tasks

The single state source for this sprint's tasks.

| # | State | Scope |
|---|---|---|
| **920** | reserved 2026-10-04, P1, Q4; kickoff not yet written | **Every rounded corner in the design system, measured and fixed.** (1) The inventory: every canonical primitive and pattern with a rounded corner (`src/design-system/mantine/theme.ts` component entries, `*-chrome.css`, `src/design-system/mantine/patterns/*`), each in every state it has. (2) The GR-11 check on each: DPR 1 and 1.25 crops at 10× beside the TailAdmin equivalent, and the diagonal coverage numbers. (3) Each failing corner fixed in its canonical source: no same-colour border on a fill, no `opacity` fade on a bordered or filled shape (disabled uses colour tokens), radius from a token. (4) A decision on whether a blocking gate can measure diagonal coverage in the built Storybook (a plant must fail it). The paginator is out of 920's scope, because Task 741 Revision 3h fixes it. The kickoff needs the full GR-7 audit first. |

## Exit criteria

1. Every inventory row carries a GR-11 receipt that passes, with its evidence.
2. The owner has accepted the 920 owner matrix.
