## Reference & Inspiration
- Primary reference: https://dom.ria.com/ — study its listing cards, search filters, listing detail page, user cabinet, photo gallery.
- Follow modern real estate marketplace UX patterns.
- Albanian market context: users expect simple, fast, mobile-friendly experience.


## UI Rules (Gate)

### Must
- No hardcoded user-visible text in UI. Use i18n keys (messages/*.json) or DB-driven content.
- No hardcoded colors. Use semantic tokens only (globals.css via semantic utility classes).
- If a UI pattern is missing, create a reusable component first, then use it.
- If blocked, apply the smallest safe local fix, then immediately extract/refactor into a reusable component.
- Dropdowns must use the project Combobox pattern (input + popover list). Do not use Select components for UI dropdowns.

### Prefer
- Fix styling in shared/module components or src/components/ui/*, not via one-off patches in pages.
- Keep controls consistent (size, spacing, focus) by reusing existing components.