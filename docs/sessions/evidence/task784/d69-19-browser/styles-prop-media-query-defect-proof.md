# Empirical proof: `styles={{root: {'@media...': {...}}}}` emits no CSS rule

Command run against the real Chromium-rendered `patterns-mantine-authformpattern--default` story
(`storybook-static`, same server/browser setup as `task784-d69-19-browser-evidence.mjs`):

```js
const found = await page.evaluate(() => {
  const results = [];
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        const text = rule.cssText || '';
        if (text.includes('max-width: 400') || text.includes('maxWidth: 400') || (text.includes('@media') && text.includes('400'))) {
          results.push(text.slice(0, 200));
        }
      }
    } catch (e) {}
  }
  return results;
});
```

**Result:** `[]` after filtering to the 3 unrelated hover-state rules that happened to also match
`400`-adjacent text (none of which reference `max-width` or the auth form). No stylesheet rule
anywhere in the document contains the media-query-gated `maxWidth: 400` declaration.

The rendered `Paper` element's own inline `style` attribute:

```html
<div class="m_1b7284a3 mantine-Paper-root" ... style="--mantine-color-default-border: var(--mantine-color-gray-1); --paper-radius: var(--mantine-radius-md); --paper-shadow: var(--mantine-shadow-sm); width: 100%; max-width: 100%; padding: var(--mantine-spacing-xl);">
```

Only the base `style={{ width: '100%', maxWidth: '100%' }}` prop (a plain, unconditional inline
style) appears. The `styles={{ root: { [\`@media (min-width: ${theme.other.mobileGate})\`]: { maxWidth: theme.other.layout.authFormMaxWidth } } }}` prop produced **zero** observable effect —
neither an inline style, nor a generated CSS class rule, nor any `@media` block anywhere in the
page's stylesheets.

## Root cause (established, not newly discovered by this task)

This is the same defect `FooterView.module.css`'s own header comment already documents (Task 707,
predating Task 784 entirely):

> "The former `styles={{ root: { '@media …' } }}` object was not emitted by Mantine, leaving the
> header stacked at every width. A CSS module is the real responsive mechanism."

Mantine's `styles` prop resolves object keys as CSS **properties** (or, for a nested object, as a
CSS selector under the `root`/named slot), not as `@media` at-rules — a key shaped like
`'@media (min-width: 40em)'` is treated as an invalid/unrecognized property name and silently
dropped, never as a responsive breakpoint. The `useMediaQuery()` **hook** (evaluated in JS via
`matchMedia`, driving conditional render logic or a `style`/`className` value) is unaffected by
this and works correctly — every consumer using that pattern (e.g.
`MantineDataTableToCards.tsx`'s `isMobile` branch) is not affected.

## Affected Task 784 consumers (styles-prop media-query pattern, confirmed non-functional)

- `MantineAuthFormPattern.tsx` — desktop `maxWidth` cap (confirmed broken by this evidence run)
- `MantineListingContactPattern.tsx` — desktop sticky positioning (confirmed broken by this
  evidence run)
- `MantineAdminSurfacePattern.tsx`, `MantineFormSectionStack.tsx`, `MantineTwoColumnForm.tsx`,
  `MantinePageHeaderWithActions.tsx`, `MantineEmptyLoadingErrorState.tsx` — each also has a
  `styles={{root: {[media-query-key]: {...}}}}` block for a secondary responsive concern
  (button/group row-vs-column layout at the `mobileGate` breakpoint). **Not independently
  re-verified in this browser evidence pass** (out of the 8-row §14 matrix) — flagged here as the
  same defect class, likely also non-functional, for the orchestrator to scope into a follow-up.

## Why this is not fixed in D69-19

D69-19's own scope is explicit: "It introduces no design role, value, detector category, product
behavior, legacy-component change, suppression, allowlist entry, or approximation." Switching
these six-plus consumers off the `styles`-prop media-query pattern onto a working mechanism (a
CSS module with a real `@media` rule, matching `FooterView.module.css`'s own precedent, or
Mantine's `visibleFrom`/`hiddenFrom` props, or a `useMediaQuery()`-driven inline style) is new
product-behavior work requiring its own scoped task and its own rendered proof — not an
evidence-closure correction. This file, plus §17 of the Task 784 session log, discloses the defect
precisely so that follow-up task can be scoped without re-discovering it from scratch.
