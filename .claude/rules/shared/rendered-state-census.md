# Overlays: the rendered state census (checklist U8)

A Mantine `Modal`, `Drawer`, bottom sheet, `Popover`, `Menu`, `Combobox`/`Select` dropdown and `Tooltip` render through
`Portal`, outside `#storybook-root`, so a check of the app root alone misses a broken overlay (Task 859 Review 16).

## What a task does

- [ ] Opus (design): the kickoff names, for each changed overlay surface, its rows in
      `scripts/rendered-interaction-states.json`.
- [ ] Sonnet: adds or updates the rows of the Stories it changes, in the same change: `{ id, story, open, portals }`,
      where `open` is `mount`, `click` (a selector in the app root) or `keys`, and `portals` is the number of portal
      roots the state shows.
- [ ] Opus (review): lists the changed overlay Stories and their states, read from code, for the owner.
- [ ] Nobody builds Storybook or runs the census locally (checklist A5); the owner checks the changed overlays by hand.

## The gate (`scripts/check-rendered-state-census.mjs`; owner decision 2026-10-10)

It runs only as a CI step on the built Storybook, and only from the day that step exists in
`.github/workflows/ci.yml`; a change of the gate script is its own task. It opens every registered state through its
action, then measures the app root and each `[data-portal="true"]` root separately: clipped or overflowing text, a word
split across lines, viewport and component overflow, every action visible and at least the touch token below the card
switch, focus inside the overlay (trapped in a modal), and Escape and the close control returning focus to the trigger
(Mantine's own behaviour, measured, never altered). Matrix: 320, 390, 639, 640, 1440 and every component threshold, in
sq, en, uk and it. It must fail on a planted overflow or clip only inside a portal root, the same in the app root only,
a portal in an unregistered state, and a registered state that opens nothing (`--verify-gate`). No baseline, allowlist
or inline suppression; a state that must differ names a dated owner decision in its registry row.
