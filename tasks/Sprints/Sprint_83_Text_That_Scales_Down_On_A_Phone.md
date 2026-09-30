# Sprint 83 — text that scales down on a phone

**Opened:** 2026-09-26 · **Status:** 🟠 **OPEN** · **Landed tasks:** 1 (886) · **Kickoffs filed:** 2 (886, 904)

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
| **886** | Every Mantine `Title` of 24px or more steps down on a phone through one canonical responsive scale (`TITLE_FZ` in `src/design-system/mantine/typography.ts`). The duplicate recently-viewed skeleton is removed. A blocking `check:type-responsive` gate with a CI self-test keeps it that way, and it baselines the 6 live legacy Tailwind sites (L3–L8) as debt that cannot grow. | ✅ `APPROVED WITH NOTES` 2026-09-30 (review 12, kickoff §22.9; owner accepted every O83-1 matrix) → [`…Task_886…`](../Archive/Sprint_83_kickoff_prompt_Task_886_Responsive_Heading_Scale_Site_Wide.md) |
| **904** | `/favorites` renders the canonical listings route chrome (`ListingsPageFrame` + `MantinePageHeaderWithActions`): the Mantine breadcrumb, the responsive page title (`TITLE_FZ.h2`), no legacy Tailwind; legacy site L4 leaves the type-responsive baseline. From owner decision O83-2. | `KICKOFF FILED` 2026-09-30 → [`…Task_904…`](Sprint_83_kickoff_prompt_Task_904_Favorites_Page_Header_On_Mantine.md) |

## Execution order and gating

1. **886 runs after 869 is approved.** 886 switches `CmsPageView`'s title to the shared constant, and 869 owns that
   file until its review closes.
1a. **886 runs after 853 is approved** (added 2026-09-26 by 853's review 1). 853 R12 makes the dashboard header and KPI value responsive itself, and removes legacy site L1 (886 §3.1a).
2. If **884** is in flight at the same time, 886 edits only the `Title` line of `CmsPageView.tsx`. 884 owns the body
   expression.

## Owner actions

| # | Action |
|---|---|
| **O83-1** | Task 886's `OWNER VISUAL QA REQUIRED` matrix (its §13.3, with the GR-3d lines of §16.4). **Returned 2026-09-30** (886 kickoff §18.1, owner verbatim): rows 2, 3, 5 and `PageHeaderWithActions` accepted; row 1 (collection button) and row 4 (`ListingDetailView`: photo placeholder, unreadable contact buttons) returned. The Revision 3 matrix is kickoff §18.9, handed over after revision 3 is reviewed. **CLOSED 2026-09-30:** the owner accepted every later matrix (§19.1, §20.1, §21.1, §22.1) and the last one verbatim, *"візуально підтверджую, тепер lightbox виглядає і працює корректно"* (886 kickoff §22.9). |
| **O83-3** | **DECIDED 2026-09-30 — owner verbatim: *"Моє рішення (b)"*.** GR-3d now carries a "Page-level View exemption" (`docs/golden-rules.md`); `ResetPasswordView`'s Story stays unwrapped (886 §16.4). *Original question (added 2026-09-30 by 886 review 1):* `Patterns/Mantine/ResetPasswordView` is a `skipCanvas` Story without `StoryPageGutter`, but the production View already carries the page gutter (`Center p="md"`, measured 16px at 320/390). Choose (a) wrap anyway (32px at 320), (b) record a GR-3d exemption for a View that carries its own page gutter (recommended), or (c) move the padding into the route in a separate task. Options and effects: 886 §16.4. |
| **O83-4** | **DECIDED 2026-09-30 — owner verbatim option chosen: *"Усе в 886, розширити O83-3 (Recommended)"*** (886 kickoff §18.1): the photo placeholder, the save button and the contact card all stay in 886; GR-3d page-level View exemption condition 2 accepts at least 24 at 1024/1440; `AgentStatisticsView`'s Story moves from reserved 902 into 886. **Applied by the owner:** `docs/golden-rules.md:274` reads "at least 24 at 1024 and 1440" (886 rev3 `o83-4-gate.log`, 1 match). |
| **O83-5** | **DECIDED 2026-09-30 — owner verbatim: *"Я обираю варіант (а)."*** Applied by the reviewer to `docs/golden-rules.md` GR-3d condition 1 (886 kickoff §20.1). *Original question* (added 2026-09-30 by 886 review 5, kickoff §19.4): `PopularLocationsView`'s gutter is `MantineHomeSection`'s `.container-wide` class (16/16/32/48), not Mantine spacing props, so GR-3d exemption condition 1 fails if read literally. Choose (a) condition 1 also accepts the canonical `.container-wide` page container (recommended; rule text only), (b) wrap (doubles the gutter, not viable), or (c) a separate task moves `MantineHomeSection` onto Mantine spacing props. |
| **O83-6** | **DECIDED 2026-09-30 — owner verbatim: *"Обираю варіант (а)."*** (886 kickoff §21, R38). *Original question* (added 2026-09-30 by 886 review 8, kickoff §20.11; owner asked *"чому в  ListingDetailView відсутня кнопка «Додани в обране»?"* (inner quotes rendered as «»)): a guest sees no favourite heart on the listing-detail page (`page.tsx:269` passes `listingId` only for a signed-in user), while cards show it to guests and `FavoriteButton` opens the login sheet. Choose (a) show the heart to guests on the detail page too, as on cards (recommended), or (b) keep production and add a signed-in Story export. |
| **O83-2** | **DECIDED 2026-09-30 — owner verbatim: *"що це за Legacy-сайти і чи використовуємо ми їх наразі у проекті? Якщо використовуємо, тоді треба мігрувати на Minetine."*** Reviewer's trace:<br>• L3 `/admin/users` → Task **896**;<br>• L5 `AdminPageShell` (only consumer `/admin/listings`) → Task **857**, which deletes it;<br>• L6 `AdminSupportManager` (`/admin/support`) → Task **859**;<br>each of the three kickoffs gained an addendum to delete its baseline row;<br>• L4 `/favorites` header → reserved **904** (this sprint);<br>• L7 the listing create/edit form → reserved **905**;<br>• L8 `StepPreview` is unused (no importer) and is deleted under **905**.<br>*Original question:* the six legacy Tailwind `text-2xl` sites with no owning migration task (886 §3.2). Choose one: file migration tasks for them now, or leave them as baselined debt until their surfaces are migrated. |
| **O83-7** | Task 904's `OWNER VISUAL QA REQUIRED` matrix (its §13.3). |

## Exit criteria

1. `check:type-responsive` is in the PR governance job and blocking, and its `--verify-gate` self-test proves it can
   fail.
2. At 320px, no production Mantine heading measures above 20px, except a hero the kickoff names (886 AC).
3. The owner has accepted O83-1.
4. O83-2 is decided and recorded here.
5. O83-3 is decided and recorded here — done 2026-09-30, (b).
6. O83-4 is decided (done 2026-09-30) and its GR-3d text is in `docs/golden-rules.md`.

## Explicitly not in this sprint

- Changing `theme.headings.sizes` itself. A global remap would flatten every heading level to one size on a phone,
  and it would contradict GR-3c's per-role table. It was considered and rejected in 886 §5.
- `SECTION_HEADING_FZ`'s raw rem literals. That is reserved **734**.
