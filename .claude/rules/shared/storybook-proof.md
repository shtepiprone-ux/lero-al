# Stories (checklist U6)

A direct canonical Story proves the production component and every changed state; a composition Story proves that a
parent consumes it; a route is integration evidence only and replaces neither (GR-3). Each line is checked from the
Story's code by its author and its reviewer; the rendered result is checked by the CI Storybook jobs on GitHub and by
the owner by hand.

- [ ] Search first: an existing Story of the component is extended; a new Story only when none exists (GR-3a).
- [ ] The title is under `Mantine/Primitives/*` or `Patterns/Mantine/*`; one page per component, states as exports
      (`Empty`, `Loading`); no `LocaleStress`, width- or locale-named exports, no re-titled legacy `System/*` Story.
- [ ] Fixture data and documented props only; no width, gutter, chrome or behaviour repaired locally.
- [ ] A `skipCanvas` Story whose content has no page gutter of its own wraps every export in `StoryPageGutter` (GR-3d).
- [ ] No fixed width: no `w`/`maw` value, `style`, decorator width or `globals.viewport` pin; the production width
      contract is reproduced or the container is fluid (GR-3b).
- [ ] Every production state of the component, and of each changed child it renders, is shown.
- [ ] Fixtures are consistent: an error only where real validation would give it for the values shown; a photo looks
      like a photo.
- [ ] An interactive component is interactive, through its own handlers in a stateful harness.
- [ ] Locale and breakpoint come from the Storybook toolbar; visible text is locale-backed.
- [ ] A Story that opens an overlay has a row per opening state in `scripts/rendered-interaction-states.json`.
