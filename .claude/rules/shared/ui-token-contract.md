# Tokens and one look per meaning (checklist U3, U4)

Product requirements of GR-0, GR-3a, GR-9 and GR-12 (`docs/rules/golden/`), as checks.

## U3 — no local visual value

- [ ] A colour, radius, spacing, typography, shadow, visual size, z-index, animation value or breakpoint is chosen
      only in the theme or the canonical owner, never in a consumer or a Story.
- [ ] New or migrated UI has no `style`, `styles`, `className`, arbitrary utility value, CSS/SCSS, raw literal, Mantine
      palette literal picked for a meaning, or scanner allowlist entry that encodes a visual decision.
- [ ] A missing value is added first as the narrowest semantic token in the theme, used by the canonical owner and by
      every consumer of the same meaning in the same change; no Story-only, route-only or one-use token.
- [ ] A Story needing a different look gets a typed state, variant or size of the real component, never a wrapper,
      decorator, selector or `className`.
- [ ] Ownership or meaning unclear: stop with `CANONICAL STYLE DECISION REQUIRED`.

## U4 — one meaning, one look

- [ ] For each changed element type and meaning, find every Story and component that renders it (a code search) and
      compare the tokens and props that set fill, text colour, border, radius, height, typography, padding, icon, and
      the gap to the blocks around it (GR-3h: every gap of one container equals its rhythm token, dividers included).
- [ ] A different look needs a dated owner decision naming both contexts.
- [ ] The kickoff and the review list the compared Stories with `path:line`. Reusing an unchanged canonical element
      needs no new comparison.
- [ ] Missing token, owner or Story, or a mismatch: Sonnet returns `BLOCKED — GR-12`; Opus does not publish the kickoff,
      or returns `NEEDS REVISION`.
