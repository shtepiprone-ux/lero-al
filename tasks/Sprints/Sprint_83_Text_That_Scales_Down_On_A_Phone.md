# Sprint 83 — text that scales down on a phone

**Opened:** 2026-09-26 · **Status:** 🟠 **OPEN** · **Landed tasks:** 0 · **Kickoffs filed:** 1 (886)

> **These counts drift.** Re-derive them from the Tasks table below, never from this line.

> **Opened by owner instruction, 2026-09-26, verbatim:** *"так, заводь задачу на аудит адаптивних шрифтів по всьому
> сайту"*. The instruction came after the owner returned Task 869 at O79-5 (*"Шрифти не адаптивні, на мобільних
> екранах вони просто величезні. Це тупо хардкод!"*), and after rule **GR-3c** was written
> (`docs/golden-rules.md`).

## The defect

The Mantine theme's heading scale has one value at every width: h1 48px, h2 36px, h3 30px, h4 24px
(`src/design-system/mantine/theme.ts:581-584`). Every `Title` that takes its size from that scale without a
breakpoint-keyed `fz` renders its desktop size on a 320px phone.

The owner saw it on one component, 869's `CmsPageView`. A census on 2026-09-26 found the same shape in
**16 `Title` sites across 11 production files** (Task 886 §3.1). Legacy Tailwind UI had a rule against this:
`docs/ui-rules.md` → "Responsive Typography Rules". The Mantine migration did not carry it over, and until GR-3c no
kickoff, executor or review asked the question.

## Goal

No text of 24px or more reaches a phone without a breakpoint step. That covers every production Mantine surface, not
only the one the owner happened to open. A blocking static gate keeps the next `Title` from reintroducing it.

## Goal-fit — why no open sprint takes this

| Open sprint | Goal | Fits? |
|---|---|---|
| 46 | ListingCard de-Tailwind + overlay exit | No — card-scoped |
| 55 / 56 / 57 | ARIA semantics · raw enum leaks · deletions | No |
| 61 / 62 | projection-layer detector · Tailwind runtime tokens | No |
| 69 | `/listings` finishes the migration | No — one route |
| 70 | site chrome leaves Tailwind | No — chrome only; the defect is in patterns and views |
| 71 | listing-detail route leaves Tailwind | No — one route; the defect is not Tailwind |
| 72 / 73 | similar-listings search · sold-listing visibility | No |
| 74 | one card width | No — width, not type |
| 77 | full test suite | No |
| 78 | admin/agent dashboards | No — two of the sixteen sites only |
| 79 | CMS pages | No — 869 fixed its own component; the site-wide scale is out of that goal |

## Tasks

The Tasks table is the **single state source**. The execution-order note below is order and gating only.

| # | Outcome | State |
|---|---|---|
| **886** | Every Mantine `Title` of 24px or more steps down on a phone through one canonical responsive scale (`TITLE_FZ` in `src/design-system/mantine/typography.ts`). The duplicate recently-viewed skeleton is removed. A blocking `check:type-responsive` gate with a CI self-test keeps it that way, and it baselines the 8 legacy Tailwind sites as debt that cannot grow. | `KICKOFF FILED` 2026-09-26 → [`…Task_886…`](Sprint_83_kickoff_prompt_Task_886_Responsive_Heading_Scale_Site_Wide.md) |

## Execution order and gating

1. **886 runs after 869 is approved.** 886 switches `CmsPageView`'s title to the shared constant, and 869 owns that
   file until its review closes.
2. If **884** is in flight at the same time, 886 edits only the `Title` line of `CmsPageView.tsx`. 884 owns the body
   expression.

## Owner actions

| # | Action |
|---|---|
| **O83-1** | Task 886's `OWNER VISUAL QA REQUIRED` matrix (its §13.3). |
| **O83-2** | **Decision, open:** the six legacy Tailwind `text-2xl` sites with no owning migration task (886 §3.2). Choose one: file migration tasks for them now, or leave them as baselined debt until their surfaces are migrated. |

## Exit criteria

1. `check:type-responsive` is in the PR governance job and blocking, and its `--verify-gate` self-test proves it can
   fail.
2. At 320px, no production Mantine heading measures above 20px, except a hero the kickoff names (886 AC).
3. The owner has accepted O83-1.
4. O83-2 is decided and recorded here.

## Explicitly not in this sprint

- Changing `theme.headings.sizes` itself. A global remap would flatten every heading level to one size on a phone,
  and it would contradict GR-3c's per-role table. It was considered and rejected in 886 §5.
- `SECTION_HEADING_FZ`'s raw rem literals. That is reserved **734**.
