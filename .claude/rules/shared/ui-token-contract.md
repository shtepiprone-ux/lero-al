# UI token and cross-Story parity contract

This contract is mandatory for every new or changed visible artifact, its canonical component, and every Story that
renders it. It operationalizes GR-0, GR-3a, GR-9, and GR-12 in a form that every role must apply.

Read `shared/enforcement-model.md` immediately after this file. It gives the required receipts and explains the
phase hook, CI gate, registry, and built-Storybook proof as one mandatory sequence.

## Stop-before-style decision tree

1. Search the component catalog, canonical stories, patterns/primitives, and relevant source by semantic purpose and
   behavior. Open every plausible candidate's source **and** direct Story.
2. Reuse the existing canonical owner when it covers the need. Do not copy its class chain, computed value, or markup.
3. If behavior or a supported state is missing, extend the canonical owner and its direct Story once; update affected
   consumers to use it.
4. If no suitable owner or value exists, create the smallest semantic token or canonical native Mantine pattern first,
   register its direct Story, then consume it. A missing token is never permission for a local value.
5. If ownership, semantic meaning, or a matching Story is ambiguous, stop: `CANONICAL STYLE DECISION REQUIRED`.

## Token ownership

- A primitive token represents a reusable scale value. A semantic token represents an intent such as status, text,
  border, surface, control size, or spacing. A component token is allowed only for an invariant of that canonical
  component. Prefer the narrowest existing semantic owner; do not create Story-only, route-only, or one-use tokens.
- Put a new token in the project's actual token/theme registry. Use it from the canonical component and every same-
  meaning consumer in the same change. Record the token's definition and consuming path, not merely documentation.
- A colour, radius, spacing, typography, shadow, visual size, z-index, animation value, or breakpoint behavior cannot
  be chosen in a consumer or Story. Technical non-visual literals are allowed only when no design decision is encoded
  and their purpose is stated in evidence.

## Forbidden local visual decisions

For new or migrated UI, do not introduce a local visual decision through `style`, `styles`, `className`, arbitrary
utility values, CSS/SCSS, a raw colour/size/radius/spacing/shadow literal, a Mantine palette literal selected for a
meaning, or a scanner allowlist. Legacy UI may preserve existing styling only when the task explicitly keeps that
surface legacy; it does not authorize a new local style.

Stories provide data and documented public props only. They must not patch component appearance with a wrapper,
decorator, `className`, `style`, selector, arbitrary utility, or a duplicate visual component. A Story variation that
needs a different appearance must be an explicit typed state/variant/size owned centrally by the real component.
Visible Story text is locale-backed. Fixture data is labelled and never becomes production behavior.

## One meaning, one look

At task design, before Sonnet's first visual write, and before Opus's verdict, run a built-Storybook census for every
changed element type and semantic meaning. Find **all** Stories rendering it and measure at the same locale/width:
fill, text colour, border, radius, height, typography, padding, icon, and the gap to the blocks around it (GR-3h: every
gap between blocks of one container equals that container's rhythm token, dividers included). Spacing is part of the
look; a token used by the element itself does not prove the gap its container leaves around it. A different look is permitted only by a
dated owner decision naming both contexts. Do not rely on source grep or a parent screenshot.

Required receipt, one per element type:

`GR-12 ELEMENT PARITY — <element>: Stories compared <n> (census <path>); meanings <n>; meanings with more than one look: <list | NONE> (owner decisions: <ids | none>); hardcode in changed files and their Stories (style/styles/className/colour literal/raw string): <list | NONE>.`

Missing token/owner/Story or parity mismatch: Sonnet returns `BLOCKED — GR-12`; Opus does not publish a kickoff or
returns `NEEDS REVISION`. The detailed definitions and additional receipts stay in `docs/golden-rules.md`.
