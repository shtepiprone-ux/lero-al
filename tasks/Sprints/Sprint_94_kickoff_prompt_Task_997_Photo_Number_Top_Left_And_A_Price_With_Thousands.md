# Task 997 — The photo number top-left, and a price field that shows thousands and says what it wants

Sprint 94. Priority P2. Owner decisions (owner list 2026-11-19, translated): item 2 "Move the image numbering to the top
left corner of the photo frame when creating or editing a listing."; item 3 "Replace the error text when setting or
editing the price of a listing. Now, if a user enters a price with a space, the system gives an error; forbid the space
(remove it automatically while typing) and allow only a dot or a comma."; O997-1 (2026-11-19): "I agree with the
recommendation. A comma would be superfluous." The price is a whole number, a dot is the thousands separator, a space or
a comma is removed as it is typed. Plan file: `tasks/Sprints/Sprint_94_Owner_List_Of_2026-11-19.md`. Implementer:
Sonnet. Reviewer: Opus. Human owner of the change: the owner.

## Goal

After the task: the photo number sits in the top-left corner of each photo, before the "Cover" mark; the price field
shows the number with a dot between thousands as it is typed, removes a space or a comma at once, explains the rule
under the field, and its error names what is wrong (no price, or above the ceiling with the ceiling).

## Cause

Read at `dc5e3af66`
- Photo number: a bottom-left wrapper (`src/modules/listings/components/ImageUpload.tsx:170-173`, `absolute bottom-2 left-2`); the top-left holds only the cover mark (`:112-118`), and the hover overlay's top row only the star at the right (`:123`).
- Price: `parsePriceDigits` drops every non-digit (`src/modules/listings/domain/priceDigits.ts:16`) and the field shows the bare number (`src/modules/listings/components/ListingFormShellView.tsx:221-228`). Measured on production 2026-11-19 with `HYDRATION_AGENT1` on `/uk/listings/create`, every POST aborted, `node price-repro.mjs` → `typed "150 000" -> shown "150000"`, `typed "1500,50" -> shown "150050"`, `typed "20 000 000 000" -> shown "20000000000"`. A space no longer gives an error on the current build; the field shows no separators, so a decimal comma turns into a hundred times the price unseen.
- Message: one text, `listing.error_price` "Please enter a valid price" (`messages/en.json:273`), for both a missing price and one above the ceiling (`src/modules/listings/components/ListingFormShell.tsx:181-183`; ceilings `src/modules/listings/validations/index.ts:10`: EUR 10 000 000 000, ALL 1 000 000 000 000).

Fix: the photo marks get one top-left place at the image owner; the price field becomes a canonical whole-number input with dot thousands, and the error is chosen by a pure rule that names the case.

## Scope

- Dependency: Task 957 (it changes `ImageUpload.tsx` and its test, and moves `ImageUpload.tsx`, `ListingFormShell.tsx` and `ListingFormShellView.tsx` to canonical Mantine under the owner rule of 2026-11-19, `.claude/rules/shared/canonical-component-reuse.md`); this task starts after 957 is merged, changes those files only through canonical owners and adds no legacy part.
- `src/design-system/media/AppImage.tsx`: a documented prop `marks?: ReactNode` for the `upload` variant, rendered in a top-start Mantine `Group` overlay (theme spacing); its Story `src/stories/mantine/primitives/AppImage.stories.tsx` shows the variant with a number, and with a number and the cover mark. `ImageUpload.tsx` passes the number badge, then the cover mark, through `marks` and drops its two wrappers.
- `src/design-system/mantine/patterns/MantinePriceInput.tsx` (CREATE; no price field exists among the canonical inputs) with its Story `src/stories/patterns/mantine/PriceInput.stories.tsx`: Mantine `NumberInput` with `thousandSeparator="."`, `decimalSeparator=","`, `allowDecimal={false}`, `allowNegative={false}`, `hideControls`, at most 15 digits (`isAllowed`), `inputMode="numeric"`; the value it reports is `parsePriceDigits(String(value))`; props `label`, `description`, `error`, `value`, `onChange`. `ListingFormShellView.tsx` uses it in place of the raw `Input` (`:221-228`) and passes `error`.
- `src/modules/listings/validations/priceError.ts` (new): `priceError(price, currency)` → `null`, `'error_price_required'` or `{ key: 'error_price_above_max', max }`; `ListingFormShell.tsx:181-183` uses it; the server rule (`listingSchema`) is unchanged.
- Messages in four locales: `listing.price_hint` ("Whole number; dots between thousands are added for you"), `listing.error_price_required`, `listing.error_price_above_max` ("The price can be at most {max}"); `listing.error_price` stays for the server answer.
- `MantinePriceInput` and `AppImage` are registered in `scripts/mobile-adaptation-patterns.json` (`form-picker-and-choice`, `media-gallery-and-listing-contact`) and replace the two owners on this kickoff's "Mantine owner" line in the same change.

## Attack surface

Attack surface: unchanged. The field still sends a number that the server holds to `listingSchema` (ceiling per
currency, `src/modules/listings/validations/index.ts:22`, `:55-58`); the client message changes, the rule does not.

## OWASP

Required by `node scripts/quality/owasp.mjs plan` (2026-11-19).

- Abuse_Case: not applicable — no new action; the price rule the server enforces is unchanged.
- AI_Agent_Security: not applicable — the task cites a project rule file; no agent, tool or agent permission changes.
- Business_Logic_Security: "Always re-derive security-relevant values (prices, permissions, ownership) on the server. Client state is input, not truth." — the client only formats and explains; `listingSchema` still bounds the price on the server — AC2.
- Cross_Site_Scripting_Prevention: "Since no single technique will solve XSS, using the right combination of defensive techniques will be necessary to prevent XSS." — the marks, hint and errors render as React text and badges — AC1, AC3.
- DOM_based_XSS_Prevention: not applicable — no value from the address or storage reaches a sink.
- Denial_of_Service: "Using validation that is cheap in resources first" — the input refuses a 16th digit before any parse; no expression with backtracking is added — AC1.
- File_Upload: not applicable — the upload path is Task 957's; this task moves two badges only.
- Injection_Prevention: not applicable — the registry edit is data read by a check script; no interpreter input is built.
- Input_Validation: "Validate on the server even when the browser checks the same fields." — the browser rule mirrors the server's ceilings, which stay the authority — AC2.
- JavaScript_and_TypeScript_Security: not applicable — no merge, path setter or regular expression over input is added.
- LLM_Prompt_Injection_Prevention: not applicable — no language model reads or writes any data of this task.
- Mass_Assignment: not applicable — the rule returns a message key; the submitted fields are unchanged.
- MCP_Security: not applicable — no MCP server, tool or agent permission is added or changed here.
- OS_Command_Injection_Defense: not applicable — no operating system process is started.
- Prototype_Pollution_Prevention: not applicable — no object is built from client keys.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — no dependency added; the reviewer reruns every claim of the report — AC5.
- User_Privacy_Protection: not applicable — no personal data or address is added to the photo tiles.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — the reviewer reruns the implementer's results — AC5.
- Web_Frontend_Security: "The fundamental security rule is to never use innerHTML with untrusted data." — no HTML sink is added — AC1, AC3.

## UI

GR-0 queries: "price input", "number with thousands", "photo order badge". Inspected: `MantineFormSectionStack`,
`MantineTwoColumnForm`, `AppImage` (`upload` variant and its Story), `MantineBadge` `count`, `ImageUpload`. Decision: CREATE
`MantinePriceInput` (Mantine `NumberInput` formatting); EXTEND `AppImage` (`marks`); REUSE `MantineBadge`. Reference
research (GR-7): inherited canonical design — owner decision 2026-10-20 (`MantineBadge` `count`, `AppImage`); the
separator rule is O997-1 and Mantine's own `NumberInput` thousands formatting.

## Mobile adaptation record
- Scope: visible
- Surfaces: src/modules/listings/components/ListingFormShellView.tsx — the price field with its hint and error; src/modules/listings/components/ImageUpload.tsx — the number and cover marks on each photo
- Component families: form-picker-and-choice, media-gallery-and-listing-contact
- Pattern IDs: form-stack, grid-media-reflow
- Standards: w3c-labels-instructions, w3c-reflow, apple-hig-layout, android-content-structure, android-common-layouts, android-adapt-layouts
- Mantine mechanism: responsive-props
- Mantine owner: src/design-system/mantine/patterns/MantineFormSectionStack.tsx, src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx
- Mobile range and switches: <640px (theme.other.mobileGate / sm): the price field full width with its hint and error below; the photo grid keeps two columns with the marks top-left; 640px transition unchanged
- Mobile order: currency → price → hint → error; photo — number → cover mark → image
- Required-content treatment: hint and error wrap at full width; the marks keep their size and the cover label wraps under the number when the tile is narrow
- Story and verification: PriceInput and AppImage Stories at 320px, 639px and 640px × sq, en, uk, it

## Acceptance criteria

- AC1 The price is typed as the owner decided — test: `src/design-system/mantine/patterns/__tests__/MantinePriceInput.test.tsx` (new): typing `150 000` shows `150.000` and reports 150000; `1500,50` shows `150.050`; a typed dot adds nothing; pasting `1 500 000` shows `1.500.000`; a 16th digit is refused; `description` and `error` render; and `src/modules/listings/domain/__tests__/priceDigits.test.ts` stays green.
- AC2 The error names the case — test: `src/modules/listings/validations/__tests__/priceError.test.ts` (new): no price → `error_price_required`; EUR 10 000 000 001 and ALL 1 000 000 000 001 → `error_price_above_max` with the ceiling; both ceilings themselves → `null`.
- AC3 The marks sit top-left — test: `src/design-system/media/__tests__/AppImage.marks.test.tsx` (new): `marks` render in the top-start overlay in their order, nothing without `marks`; `src/modules/listings/components/__tests__/ImageUpload.test.tsx` (extended): each photo passes its number, then the cover mark on the cover photo.
- AC4 Stories, texts and widths hold — test: `node scripts/check-mobile-adaptation-contract.mjs`, `node scripts/check-i18n-parity.mjs`, `node scripts/quality/locale-safety.mjs` and the census of `.claude/rules/shared/rendered-state-census.md` for the new and changed Stories.
- AC5 The CI jobs pass — test: every no-secret job of `.github/workflows/ci.yml` as written (CI-parity rule of `flow.md`, `npx --yes npm@10.9.8 ci`), then `gh pr checks <n>`.

## Route

1. Starts after Task 957 is merged. Branch from `main`. Read `ImageUpload.tsx` as 957 left it, `AppImage.tsx` and its Story, `ListingFormShellView.tsx`, `ListingFormShell.tsx`, `priceDigits.ts`, `validations/index.ts`, Mantine `NumberInput` in the installed `@mantine/core`.
2. Tests first (AC1-AC3); save each failing output.
3. The input and its Story, the rule, the marks, the messages. Three passes over every changed file (`flow.md` §2).
4. Run: the task tests · the CI job commands of the CI-parity rule (`flow.md`), read from `ci.yml`, with `npx --yes npm@10.9.8 ci`.
5. Report: each command, exit code, relevant output. After the merge Opus reruns `price-repro.mjs` (expects `150.000`) and looks at the photo grid at 390.

## Review
