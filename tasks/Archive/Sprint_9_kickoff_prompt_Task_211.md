# Kickoff prompt — Task 211 (Sprint 9 follow-up — ListingContact action row: overflow + button composition)

> Found during orchestrator review of the live listing page (2026-05-22). On the desktop contact card
> (`ListingContact.tsx` sticky sidebar) the secondary-action row spills past the card's `p-5` border, and
> the favorite heart does not match its sibling pills. Two root causes, both UI-system violations:
> 1. **Overflow:** the row is `<div className="flex gap-2">` with three `flex-1` buttons and NO `min-w-0`
>    / no `flex-wrap`. Flex children default to `min-width:auto`, so the long uk label «Зберегти в колекцію»
>    (Save-to-collection) refuses to shrink and pushes the row wider than the card. This is the
>    localization anti-pattern our rules warn about (uk = longest strings; toolbars must wrap/shrink).
> 2. **Composition:** `FavoriteButton` bakes `rounded-full w-8 h-8 p-0` into its base, fighting the
>    `flex-1 h-9 rounded-xl border` the row passes → the heart won't render as a pill like its siblings.
>    See docs/ui-rules.md §0 "Composition (no conflicting baked-in styles)".

```
You are Claude Code Sonnet 4.6 working in `lero-al`.

Hard contract:
- Do NOT change scope: fix the contact-card action-row layout + the FavoriteButton composition so the
  row stays inside the card and all three buttons are visually consistent. No behavioural change to
  favorite/save/share actions; no auth-state logic (that's Task 182).
- Do NOT invent architecture. Use the canonical UI system: `Button` size/variant props, design tokens,
  and the responsive rules in docs/ui-rules.md (§0 composition, §7 responsive, §8 touch targets).
- FavoriteButton is a SHARED component (used in ListingCard, ListingContact, FavoritesShell, etc.).
  Global Change Verification Rule: if you change its API (add a size/variant prop instead of baked
  structural classes), AUDIT and update EVERY consumer and verify no regression on cards/grid/detail.
  If a safe in-place fix isn't possible without risking consumers, STOP and ask the orchestrator.
- Update docs/backlog.md + add docs/sessions/2026-05-23-task-211-contact-card-action-row.md.
- 0 new lint/typecheck errors; governance PASS; locale parity sq/en/uk/it; ALL 7 breakpoints
  (320/375/390/768/1280/1440/2560) verified — uk especially (longest labels).
- Commit + push: SINGLE `git add -A`, then `git log -1` (paste real output). Owner runs git/SQL.

Pre-read:
- src/modules/listings/components/ListingContact.tsx (desktop sidebar action row ~198-224; mobile bar
  ~236-290 — check it too)
- src/modules/listings/components/FavoriteButton.tsx (base `rounded-full w-8 h-8 p-0` vs passed className)
- src/modules/listings/components/SaveToCollectionButton.tsx, src/components/ui/button.tsx (canonical sizes)
- consumers of FavoriteButton: src/modules/listings/components/ListingCard.tsx, FavoritesShell.tsx,
  ListingsShell.tsx (regression surface)
- docs/ui-rules.md §0 (composition) + §3 (Button) + §7 (responsive) + §8 (touch targets);
  docs/ai-behavior.md (Localization Governance: flex-wrap on toolbars, uk longest strings; Shared
  Component Rules)

Required investigation:
1. Reproduce the overflow at narrow card widths and in uk; confirm it's the `flex-1` + `min-width:auto`
   (no `min-w-0`/wrap) cause, not something else.
2. Decide the canonical layout: e.g. add `min-w-0` to flex children + truncation for long labels, and/or
   `flex-wrap` so the row wraps gracefully instead of overflowing; keep ≥44px touch targets.
3. Make FavoriteButton compose: express its shape/size via a prop/variant (so the row can render it as a
   pill matching Save/Share) instead of a fixed base that overrides the caller. Update all consumers.

Acceptance criteria:
- The contact-card action row stays fully inside the card (no overflow past `p-5`/border) at ALL 7
  breakpoints AND in uk (verify the longest labels) — desktop sidebar AND mobile bar.
- The favorite button is visually consistent with its sibling buttons in the row (composes via the UI
  system, not baked classes); touch targets ≥44px on mobile.
- FavoriteButton change (if any) audited across ALL consumers with no card/grid/detail regression.
- 0 new lint/typecheck errors; npm run build passes; all four locales; all 7 breakpoints.

Out of scope:
- The price/m² currency value (Task 176); the account-deleted/guest card state logic (Task 182); header
  icon buttons (Task 192 / note 6).
```
