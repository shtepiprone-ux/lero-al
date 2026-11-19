# Task 996 — The card footer at the bottom of every card, and "View all" at the right edge on a phone

Sprint 94. Priority P2. Owner decisions (owner list 2026-11-19, translated): item 11 "The listing cards on the platform
again have a jumping position of the number, the date and the price per m². These must always be at the bottom of the
card. It looks like Sonnet or Opus edited the card during one of the tasks, which brought the jumping back. Fix it.";
item 13 "On the home page, and anywhere there is a text button 'View all', on mobile screens this button must always be
at the right edge of the screen, not almost in the centre as now. Reference: booking.com." Plan file:
`tasks/Sprints/Sprint_94_Owner_List_Of_2026-11-19.md`. Implementer: Sonnet. Reviewer: Opus. Human owner of the change:
the owner.

## Goal

After the task: in every row or rail of listing cards the footer (price, price per m², ID, date) ends at the same
distance from the card's bottom edge, and a browser gate fails if that ever changes again; every section heading with
"View all" is one canonical header whose link sits at the right edge of the row at every width.

## Cause

Read at `dc5e3af66`
- Card: the card body is a `Stack` that does not grow (`src/design-system/mantine/patterns/MantineListingCardPattern.tsx:301-305`) and the footer part follows the content directly (`:212-239`), so a one-line title or a missing chips row lifts the footer. No test measures it, so Task 741 (`7b4b81f8c`) rewrote the card without noticing. Measured on production 2026-11-19, guest, `node card-footers.mjs` → `/uk/listings 1440 row at 354 | footer tops 722,649,722,722 | gap under footer 13,108,13,13` and `row at 819 | footer tops 1186,1186,1166,1166`.
- "View all": `src/components/shared/ViewAllLink.tsx:18` sets `w={{ base: '100%', sm: 'auto' }}` and `:23` centres the label; three header rows place it three ways (`src/app/[locale]/page.tsx:58-61`, `src/modules/listings/components/FeaturedListingsView.tsx:55-66` with `FeaturedListingsView.module.css:22-31` stacking below 640px, `src/modules/listings/components/SimilarListingsView.tsx:54`). Measured at 390, `node view-all.mjs` → labels at 139-251 and 186-298 of a 390px viewport whose content ends at 374.

Fix: the card body grows and the footer takes the remaining space above it; a browser invariant pins it; one section header pattern owns the heading row with the link at its end.

## Scope

- `MantineListingCardPattern.tsx`: the body `Stack` of each layout grows to the card (`flex={1}`) and `footerPart` takes `mt="auto"`; the grid card's `onContact` section stays the last element.
- `scripts/check-homepage-grid.mjs`: new invariant I-H on `Patterns/Mantine/HomepageListingGrids` and `Patterns/Mantine/ListingCardPattern` at 320, 390, 639, 640 and 1440: within one rail or grid row, every `[data-card-part="footer"]` has the same distance to its card's bottom edge (±1px); the fixtures include a one-line and a two-line title and a card without chips; the script's self-test arm proves the invariant fails on a card whose footer does not take `mt="auto"`.
- `src/design-system/mantine/patterns/MantineSectionHeader.tsx` (CREATE, no owner holds a section heading with a trailing link: `MantinePageHeaderWithActions` stacks full-width actions below 640px, `MantineHomeSection` is a band) with its Story `src/stories/patterns/mantine/SectionHeader.stories.tsx`: props `title`, `scale` (`section` → `SECTION_HEADING_FZ`, `subsection` → `TITLE_FZ.h4`), optional `viewAll: { href, label }`; one row at every width, the title wraps at the start, the link keeps its natural width at the end (transparent `Button` as today); registered in `scripts/mobile-adaptation-patterns.json` under `structural-layout-and-feedback` and added to this kickoff's "Mantine owner" line in the same change.
- The three header rows use it; `ViewAllLink.tsx` and the `.headerRow` rules of `FeaturedListingsView.module.css` are deleted; the comments of `MantineDashboardWorkList.tsx:69-76` and `SimilarListings.tsx:105` name the new owner.

## Attack surface

Attack surface: unchanged. Layout only; the links keep their internal addresses.

## OWASP

Required by `node scripts/quality/owasp.mjs plan` (2026-11-19).

- Abuse_Case: not applicable — the price is displayed as today; no rule about prices changes.
- Business_Logic_Security: not applicable — layout only; no workflow, limit or price rule changes.
- Cross_Site_Scripting_Prevention: "Since no single technique will solve XSS, using the right combination of defensive techniques will be necessary to prevent XSS." — the header renders the title and label as React text; card values are unchanged — AC3.
- DOM_based_XSS_Prevention: not applicable — no value from the address or storage reaches a sink.
- Injection_Prevention: not applicable — the gate drives a browser over a static Storybook build and builds no command from input.
- JavaScript_and_TypeScript_Security: not applicable — no merge, path setter or regular expression over input.
- OS_Command_Injection_Defense: not applicable — the gate's browser launch is unchanged and takes no input.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — no dependency added; the reviewer reruns every claim of the report — AC6.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — the reviewer reruns the implementer's results, the deliberate break included — AC6.
- Web_Frontend_Security: "The fundamental security rule is to never use innerHTML with untrusted data." — no HTML sink is added — AC3.

## UI

GR-0 queries: "section header", "view all", "card footer". Inspected: `MantinePageHeaderWithActions`, `MantineHomeSection`,
`MantineListingCardPattern`, `ViewAllLink` and the three consumers, their Stories. Decision: CREATE `MantineSectionHeader`;
EXTEND `MantineListingCardPattern`; DELETE `ViewAllLink`. Reference research (GR-7), live 2026-11-19 (`node ref-cards.mjs`):
Lahomes `/property-grid.html` at 1440 shows the same defect (footers at 528, 525 and 507px in one row), so it is not
followed; TailAdmin `/` at 390 keeps each card heading's action at the right edge of the heading row; the owner's
reference booking.com does the same with "See all".

## Mobile adaptation record
- Scope: visible
- Surfaces: src/design-system/mantine/patterns/MantineListingCardPattern.tsx — the card footer; src/app/[locale]/page.tsx, src/modules/listings/components/FeaturedListingsView.tsx, src/modules/listings/components/SimilarListingsView.tsx — the section heading rows with "View all"
- Component families: structural-layout-and-feedback, record-list-and-data
- Pattern IDs: toolbar-priority, record-card
- Standards: w3c-focus-order, apple-hig-toolbars, android-layout-navigation, w3c-meaningful-sequence, apple-hig-lists-tables, android-common-layouts
- Mantine mechanism: responsive-props
- Mantine owner: src/design-system/mantine/patterns/MantineHomeSection.tsx, src/design-system/mantine/patterns/MantineListingCardPattern.tsx
- Mobile range and switches: <640px (theme.other.mobileGate / sm): the heading row keeps the title and the link on one row, link at the end; 640px transition unchanged; cards keep their rail or grid
- Mobile order: heading row — title → View all; card — photo → type and title → chips → footer (price → price per m² → ID and date)
- Required-content treatment: the title wraps at the start of the row; the link label keeps its natural width with no truncation; footer values wrap as today
- Story and verification: SectionHeader, ListingCardPattern and HomepageListingGrids Stories at 320px, 390px, 639px, 640px and 1440px × sq, en, uk, it

## Acceptance criteria

- AC1 Footers end at one height — test: `node scripts/check-homepage-grid.mjs` invariant I-H (CI job `homepage-grid`) passes on the Stories and its self-test arm fails on a card without `mt="auto"`.
- AC2 The card keeps its parts — test: `src/design-system/mantine/patterns/__tests__/MantineListingCardPattern.footer.test.tsx` (new): the footer is the body's last part in both layouts and holds price, price per m² and the footer actions.
- AC3 One header, link at the end — test: `src/design-system/mantine/patterns/__tests__/MantineSectionHeader.test.tsx` (new): the title, then the link with its `href`; the row does not wrap and the link has no width rule; no link without `viewAll`; and the census of `.claude/rules/shared/rendered-state-census.md` on the Story at 320: the link's right edge equals the content edge (±1px).
- AC4 The consumers use it — test: `src/components/__tests__/sectionHeaderConsumers.test.ts` (new): `ViewAllLink` exists nowhere in `src/`; the home page, `FeaturedListingsView` and `SimilarListingsView` render `MantineSectionHeader`.
- AC5 Stories, texts and widths hold — test: `node scripts/check-mobile-adaptation-contract.mjs`, `npm run check:type-responsive`, `npm run check:card-track-monotonicity` and the census for the changed Stories.
- AC6 The CI jobs pass — test: every no-secret job of `.github/workflows/ci.yml` as written (CI-parity rule of `flow.md`, `npx --yes npm@10.9.8 ci`), then `gh pr checks <n>`.

## Route

1. Branch from `main`. Read the card pattern and its CSS module, `check-homepage-grid.mjs`, the three consumers, `ViewAllLink.tsx`, the Stories named above.
2. Tests first (AC1-AC4); save each failing output (I-H fails on today's card).
3. The card, the invariant, the header and its Story, the consumers, the deletions. Three passes over every changed file (`flow.md` §2).
4. Run: the task tests · the CI job commands of the CI-parity rule (`flow.md`), read from `ci.yml`, with `npx --yes npm@10.9.8 ci`; one deliberate break: `mt="auto"` removed → I-H fails, restored.
5. Report: each command, exit code, relevant output. After the merge Opus reruns `card-footers.mjs` and `view-all.mjs` on production.

## Review
