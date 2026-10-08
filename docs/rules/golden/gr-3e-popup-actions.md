## GR-3e — Text buttons stack: each text button has its own row

**Owner rule, 2026-10-02 (Task 857 review 5, O78-12 return).** The owner's words, verbatim: *"я неодноразово вже казав,
що текстові кнопки мають бути у стовпчик ( кожна у своєму рядку). Наразі я бачу. що другорядні текстові кнопки стоять
… в одному рядку. … Зроби … золоте правило!"* The trigger: `ListingPreviewDialogView` put "View listing" and "Open
public page" side by side in a `Group`. The owner then confirmed the scope (option chosen verbatim): *"Yes, exactly that
(Recommended)"*. That means a group of text buttons is a column, and a lone destructive text button in a footer stays where
§23.6 puts it.

A **text button** is a `Button` with a visible label and `variant="subtle"` or `variant="transparent"` (usually with a
`leftSection` icon), or an `Anchor` styled as an action. An icon-only `ActionIcon` is not a text button.

**Popups only. Owner clarification, 2026-10-02 (Task 857 review 7), verbatim:** *"я тобі писав про кнопки у попапах"*.
The rule covers text buttons inside a popup: a modal, drawer, bottom sheet, popover or menu. It does not cover text
buttons on the page itself. The trigger for this clarification: Opus measured the chart-legend toggles of
`MantineDashboardChartLegend` sharing a row in `AgentStatisticsView`, and those are page content.

**Forbidden in new or migrated UI, at every width:**
- two or more text buttons in one row: a `Group`, a `Flex` with a row direction, or `wrap="wrap"`, which still shares a
  row wherever the buttons fit.

**Required:**
- a group of two or more text buttons is a column: `Stack gap="xs" align="flex-start"`, one button per row, in reading
  order;
- a lone text button may sit in a row with non-text buttons where `docs/mantine-responsive-design-system.md` §23.6
  places it, for example the resting destructive action at the left of a dialog footer.

**Scope:** every Story a task creates, changes or lists in its owner matrix, and every surface it changes. An existing
violation inside that scope is fixed in the same task. Existing dialogs outside it are **Task 915**.

**Check, before handoff and at review:** at 390 and 1440, list every visible text button in every open popup. For every pair, confirm that the
second one's top is at or below the first one's bottom.

**Receipt — execution and review alike, one per changed Story:**

`GR-3e TEXT BUTTONS STACKED — <story id>: text buttons <n>; groups of ≥2: <n>; pairs sharing a row at 390/1440: NONE.`

With no receipt, or with a pair sharing a row, the executor returns `BLOCKED — GR-3e` and the reviewer returns
`NEEDS REVISION`. No gate measures this yet (GR-2).

