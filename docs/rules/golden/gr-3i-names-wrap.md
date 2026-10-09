## GR-3i — A person's name wraps onto the next line; it is never cut

**Owner rule, 2026-10-09 (Task 859, review 13).** The owner's words, verbatim: *"також імена користувачів на мобільних
екранах у таблиці треба переносити на новий рядок, а не обрізати їх. Це також обов'язково необхідно внести у
правила!"*

**The trigger.** `AdminSupportView` renders the reporter and the reported user as links with `lineClamp={1}`
(`AdminSupportView.tsx:97-111`). At 320 (uk) "Arben Krasniqi" showed as "Arben…". In the table form (768 and up) the
same clamp cut 20 names in every width up to 1920 across four locales ("Oksana…", "Gentiana…"). The same pattern was in
`AdminUsersTableView` (`truncate="end"` on the name), `AdminInquiriesView` and `AdminReportsView` (`lineClamp={1}`) and
in the subtitle of the canonical card (`MantineDataTableToCards`, `truncate="end"`). Evidence:
`docs/sessions/evidence/task859/review-13/`. None of the four standing references cuts a name in a records table: 0
ellipsis cells on 16 live page/width runs (`research-review/r13-ref-spacing.json`).

**A name** here is the name of a person or of the account or company that stands for one (user, agent, reporter,
reported user, inquiry sender, owner, contact), wherever a records table, its card form, a list row or a detail field
shows it. The rule holds at every width, not only on a phone, because the table form cut the same names.

**Required.**
- The name shows in full. When it does not fit, it continues on the next line, and on as many lines as it needs.
  A long unbroken token breaks inside the word (`overflow-wrap: anywhere`) rather than overflowing.
- The row, cell or card grows in height for it. A neighbour (badge, action, chevron) keeps its GR-3h gap and does not
  overlap the name.
- A label beside the name (for example "Reporter:") wraps on its own. It never takes the space the name needs.
- The canonical owner of the slot sets this behaviour once (for example the card's title and subtitle in
  `MantineDataTableToCards`), with its direct Story showing a long name at 320. A consumer never adds a truncation to a
  name.

**Forbidden** for a name: `truncate`, `lineClamp`, `text-overflow: ellipsis`, `white-space: nowrap` with hidden
overflow, a fixed or max width that cuts it, or a tooltip/`title` attribute as the only way to read it.

**Not covered:** text that only stands in for a missing name (for example the short id `usr-006…` that the support
table shows when a user has no name) is existing behaviour. It still must not be cut further by CSS. Text that is not
a name (a subject, a reason, an e-mail, a URL, a slug) follows its own owner's rule.

**Check, before handoff and at review.** On the built Storybook, at every width of the canonical matrix and on both
sides of every layout switch, in all four locales, with a fixture that has a long real-shaped name (two given
names and a hyphenated compound surname, for example `Arben Gjergj Krasniqi-Marashi`; never a made-up concatenated
token, which Task 624 retired as malformed): every element that shows a name has
`scrollWidth <= clientWidth`, `scrollHeight <= clientHeight` and a computed `text-overflow` other than `ellipsis` and no
`-webkit-line-clamp`.

**Receipt — execution and review alike, one per changed component or matrix Story:**

`GR-3i NAMES WRAP — <component/Story>: widths <list> × locales <list>; name elements <n>; cut (clipped, clamped or ellipsis): <n | NONE>; longest fixture name <text> → lines <n> at 320; owner of the name slot <path:line>; evidence <path>.`

With no receipt, or with any cut name, the executor returns `BLOCKED — GR-3i` and the reviewer returns
`NEEDS REVISION`. No automated gate measures this yet (GR-2).
