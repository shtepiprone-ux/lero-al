# Task 995 — Listing page: a 24px title, the contact card before the extra blocks on a phone, a tooltip on the verified mark, a message-length hint

Sprint 94. Priority P2. Owner decisions (owner list 2026-11-19, translated): item 10 "On the listing page the listing title
must be 24px at all breakpoints."; item 12 "On mobile screens the contact card must be shown before the 'Recently viewed'
and 'Similar listings' blocks on the listing page."; item 24 "on the listing page or in the profile, where the verified
user mark is, there is no tooltip that shows it is a verified user; there is only an icon, which can confuse other
users."; item 25 "Show a message about the number of characters when the 'send message' button is pressed on the listing
page, because now it is unclear why the button is disabled even when there is at least one character."; O995-1
(2026-11-19, translated): "'Description', then 'Features', then 'Contact card', then 'Similar listings', then 'Recently
viewed'. On desktop also check the sequence of sections I wrote; the contact card on desktop stands separately on the
right, do not count it." — "By the way, the 'Recently viewed' and 'Similar' sections are displayed correctly now, they
only need to swap places as I described." — "No, the width must be as it is now. Why would I need a width across two
columns, then the listing owner's contact card would be overlapped." — "Right now 'Similar' and 'Viewed' work great, they
need no change, only the display order, and that is all!" Plan file:
`tasks/Sprints/Sprint_94_Owner_List_Of_2026-11-19.md`. Implementer: Sonnet. Reviewer: Opus. Human owner of the change:
the owner.

## Goal

After the task: the listing title is 24px at every width; below the column switch the order is description → features
→ map → contact card → similar listings → recently viewed; from the switch the page stays as it is today (the blocks in
the main column, the card in the right column, sticky as now), except that similar listings come before recently
viewed; the icon-only
verified mark explains itself on hover, focus and touch; the inquiry's Send button is always pressable and a short
message gets a field error that names the minimum and the current count.

## Cause

Read at `dc5e3af66`
- Title: `<Title order={1} size="h2" fz={TITLE_FZ.h2}>` (`src/design-system/mantine/patterns/MantineListingDetailPattern.tsx:202`), and `TITLE_FZ.h2` is `{ base: 'h5', sm: 'h4', md: 'h3', lg: 'h2' }` (`src/design-system/mantine/typography.ts:39`): 20, 24, 30, 36px. `scripts/check-type-responsive.mjs:224` refuses a static `<Title>` size.
- Order: "Recently viewed" comes before "Similar listings" (`src/modules/listings/components/ListingDetailView.tsx:395-398`); both close the left column's `contentFooter` after the map and the report button (`:374`, `:376`, `:388`), rendered at `src/design-system/mantine/patterns/MantineListingDetailPattern.tsx:306`; the contact card is the right column (`:310-311`), and below the column switch both columns span 12 (`:152`, `:155`), so on a phone the card comes after the two blocks. The card is sticky from `lg` inside its column (`src/design-system/mantine/patterns/MantineListingContactPattern.tsx:146-147`). Both families of the pattern allow Mantine's visibility props (`scripts/mobile-adaptation-patterns.json:74`, `:150`).
- Verified mark: `CheckIconBadge` is an icon with a label and no tooltip (`src/design-system/mantine/patterns/MantineListingContactPattern.tsx:159-161`, `:299`). The cabinet shows the mark with its text (`src/modules/cabinet/components/CabinetShell.tsx:92-94`), so it needs no change.
- Message: `canSubmit` needs 20 characters (`src/modules/listings/components/ListingInquiryDialog.tsx:45-47`) and the button is disabled with no text saying why; the server refuses the same rule (`src/modules/listings/actions/submitListingInquiry.ts:77`).

Fix: a named 24px title size at the typography owner; similar listings before recently viewed; below the column switch the card is shown in the left column before them and the right column only from the switch (Mantine visibility props), so the desktop page does not change; the badge gets a canonical tooltip; the length rule becomes a field error on Send.

## Scope

- `src/design-system/mantine/typography.ts`: `TITLE_FZ.listing = { base: 'h4' }` (24px, owner item 10, cited in its comment); `scripts/check-type-responsive.mjs` accepts `TITLE_FZ.listing` by name, with a self-test arm that still refuses any other static size; the pattern's title uses it.
- `MantineListingDetailPattern.tsx` (EXTEND): a new `relatedContent` slot rendered in the left column after `contentFooter`; between them the same contact node (`contactSlot` or `contact`) inside a `Box` with `hiddenFrom={sidebarFrom}`, and the right `Grid.Col` gets `visibleFrom={sidebarFrom}`. Below the switch: main → map → report → contact card → the two blocks. From the switch nothing moves: the blocks stay in the main column at its width and the card stays in the right column, sticky as today (O995-1). The hidden copy is `display: none`, so it is outside the accessibility tree; tests select the visible card. `ListingDetailView.tsx` passes similar listings, then recently viewed, to `relatedContent`; the map and the report stay in `contentFooter`; the similar-listings stream, its `#similar-listings` anchor and the staff-preview rule of recently viewed are unchanged. The Story `src/stories/patterns/mantine/ListingDetailPattern.stories.tsx` passes the slot.
- `MantineListingContactPattern.tsx` `CheckIconBadge`: REUSE Mantine `Tooltip` (label `listing.verified_tooltip`, "Verified agent: confirmed by the Lero.al team"), `events` hover, focus and touch; the icon becomes focusable with its accessible name.
- `ListingInquiryDialog.tsx`: Send is disabled only while sending; a press with a short message shows `listing.inquiry_message_min` ("At least 20 characters, now {count}") on the message field and sends nothing; the other field rules keep their errors.
- Legacy in the changed files (owner rule 2026-11-19, `.claude/rules/shared/canonical-component-reuse.md`): the one Tailwind class left in `ListingDetailView.tsx`, the `hidden` gallery shell (`:342`), is the island swap that `ListingGallery.tsx:51` reveals with `classList.remove('hidden')`; Task 794 replaces that swap with the canonical gallery and owns its baseline entry (`npm run check:enrolled-tailwind` → `ListingDetailView.tsx: hidden(1)`, owner `794` in `scripts/enrolled-tailwind-baseline.json`), so changing it here would be done twice; this task leaves it to 794 and adds no legacy part. The other changed files carry no legacy part.
- Messages in four locales. Out of scope: the cabinet badge (has text already).

## Attack surface

Attack surface: unchanged. The changes are presentation and a client-side form check; the inquiry action keeps its own
server-side length check (`submitListingInquiry`), unchanged.

## OWASP

Required by `node scripts/quality/owasp.mjs plan` (2026-11-19).

- AI_Agent_Security: not applicable — the task cites a project rule file; no agent, tool or agent permission changes.
- Authorization: not applicable — the staff-preview rule of recently viewed moves with the block unchanged; no access decision changes.
- Authorization_Decisions_And_Output_Handling: not applicable — the staff-preview rule of recently viewed moves with the block unchanged; no access decision changes.
- Authorization_Patterns: not applicable — the staff-preview rule of recently viewed moves with the block unchanged; no access decision changes.
- Authorization_Regression_Testing: not applicable — the staff-preview rule of recently viewed moves with the block unchanged; no access decision changes.
- Authorization_Testing_Automation: not applicable — the staff-preview rule of recently viewed moves with the block unchanged; no access decision changes.
- Content_Security_Policy: not applicable — a CSS module is bundled as a same-origin stylesheet; the policy is unchanged.
- Cross_Site_Scripting_Prevention: "Since no single technique will solve XSS, using the right combination of defensive techniques will be necessary to prevent XSS." — the tooltip and the field error render message keys and a number as React text — AC3, AC4.
- DOM_based_XSS_Prevention: not applicable — no value from the address or storage reaches a sink.
- Injection_Prevention: not applicable — the type gate reads source files as text and builds no command.
- JavaScript_and_TypeScript_Security: not applicable — a constant size object; no merge, path setter or new regular expression.
- LLM_Prompt_Injection_Prevention: not applicable — no language model reads or writes any data of this task.
- MCP_Security: not applicable — no MCP server, tool or agent permission is added or changed here.
- OS_Command_Injection_Defense: not applicable — the type gate starts no operating system process.
- React_Security: "Where possible, render untrusted content as text using JSX expressions." — the tooltip and the field error render message keys and a number as React text — AC3, AC4.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — no dependency added; the reviewer reruns every claim of the report — AC6.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — the reviewer reruns the implementer's results — AC6.
- Web_Frontend_Security: "The fundamental security rule is to never use innerHTML with untrusted data." — no HTML sink is added — AC3, AC4.

## UI

GR-0 queries: "title size", "tooltip", "field error on submit". Inspected: `MantineListingDetailPattern` and
`MantineListingContactPattern` (their Stories), Mantine `Tooltip` as used by `MantineCombobox`, the inquiry dialog's field
errors. Decision: EXTEND the detail pattern (slot) and the typography owner (named size); REUSE `Tooltip` and the field
error. Reference research (GR-7): inherited canonical design — owner decision 2026-10-20 (`ListingDetailPattern`,
`ListingContactPattern`); the size and the order are the owner's items 10 and 12.

## Mobile adaptation record
- Scope: visible
- Surfaces: src/design-system/mantine/patterns/MantineListingDetailPattern.tsx — the title and the order of main content, contact card and extra blocks; src/design-system/mantine/patterns/MantineListingContactPattern.tsx — the verified mark's tooltip
- Component families: record-list-and-data, media-gallery-and-listing-contact
- Pattern IDs: linear-flow, inline-control
- Standards: w3c-reflow, w3c-meaningful-sequence, apple-hig-layout, android-adapt-layouts, android-layout-basics, w3c-target-size, apple-hig-menus, android-layout-navigation
- Mantine mechanism: responsive-props, visibility-props
- Mantine owner: src/design-system/mantine/patterns/MantineListingDetailPattern.tsx, src/design-system/mantine/patterns/MantineListingContactPattern.tsx
- Mobile range and switches: <640px (theme.other.mobileGate / sm) and up to the pattern's column switch (`lg` in production): one column in the order below; 640px transition unchanged; from the column switch the two columns exactly as today, similar listings before recently viewed
- Mobile order: gallery → title → price → details → description → features → map → report → contact card → similar listings → recently viewed
- Required-content treatment: the 24px title wraps with `break-word`; the tooltip text wraps at its width; no truncation
- Story and verification: ListingDetailPattern and ListingContactPattern Stories at 320px, 639px, 640px and the column switch × sq, en, uk, it

## Acceptance criteria

- AC1 The title is 24px at every width — test: `src/design-system/mantine/patterns/__tests__/MantineListingDetailPattern.title.test.tsx` (new): the title's `fz` is `TITLE_FZ.listing`; `node scripts/check-type-responsive.mjs` passes and its self-test refuses a static size other than `TITLE_FZ.listing`.
- AC2 The card comes first on a phone and the desktop page keeps its layout — test: `src/design-system/mantine/patterns/__tests__/MantineListingDetailPattern.order.test.tsx` (new): in the left column the order is main → `contentFooter` → the card in a box hidden from `sidebarFrom` → `relatedContent`; the right column is visible from `sidebarFrom` and holds the card; `ListingDetailView` passes similar listings before recently viewed; and in the census of the `ListingDetailPattern` Story exactly one contact card is visible at 390px (after the report button, before similar listings) and at 1440px (in the right column, sticky), where the two blocks keep the main column's left edge and width.
- AC3 The verified mark explains itself — test: `src/design-system/mantine/patterns/__tests__/MantineListingContactPattern.verified.test.tsx` (new): focusing the icon shows the tooltip text; the icon has its accessible name; no tooltip when `isVerified` is false.
- AC4 Send explains a short message — test: `src/modules/listings/components/__tests__/ListingInquiryDialog.length.test.tsx` (new): Send is enabled with 5 characters; pressing it shows the minimum with the count 5 and does not call the action; with 20 characters it sends.
- AC5 Stories, texts and widths hold — test: `node scripts/check-mobile-adaptation-contract.mjs`, `node scripts/check-i18n-parity.mjs`, `node scripts/quality/locale-safety.mjs` and the census of `.claude/rules/shared/rendered-state-census.md` for the changed Stories.
- AC6 The CI jobs pass — test: `gh pr checks <n>` on GitHub after every check has concluded (checklist A5).

## Route

1. Branch from `main`. Read the two patterns, `ListingDetailView.tsx`, `ListingInquiryDialog.tsx`, `typography.ts`, `check-type-responsive.mjs` and the two Stories.
2. Tests first (AC1-AC4); save each failing output.
3. The size and the gate arm, the slot, the tooltip, the field error, the Stories. One pass over every changed file (checklist I7).
4. Run: the task tests · CI on GitHub only (`gh pr checks <n>`, checklist A5).
5. Report: each command, exit code, relevant output. After the merge Opus opens a listing at 390 and 1440 in Ukrainian and checks the four items, the phone order description → features → map → contact card → similar listings → recently viewed, and the desktop page as before with similar listings first.

## Review
