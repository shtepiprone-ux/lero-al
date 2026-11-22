# Task 992 — An admin switch lists sold and rented listings in the sitemap

Sprint 94. Priority P2. Owner decisions: owner list item 15 (2026-11-19, translated): "In the admin site settings add a
switch that lets the admin make listings with status 'Rented' or 'Sold' public. Now these listings are available only to
the admin/moderator and the owner; this is bad for SEO, because robots will not find them, which leads to fewer
visitors."; O992-1 (2026-11-19, translated): "I agree with the recommendation. Sold and rented are seen only in a
separate tab." Plan file: `tasks/Sprints/Sprint_94_Owner_List_Of_2026-11-19.md`. Implementer: Sonnet. Reviewer: Opus.
Human owner of the change: the owner.

## Goal

Sold and rented listings already open for every visitor by their address and are listed in the "Sold and rented" tab,
but no search engine is told about them. After the task: a switch in the SEO tab of the admin settings adds sold and
rented listings to the sitemap while they are still indexable (inside `archived_noindex_days`), so the sitemap never
lists an address that answers `noindex`; the main search results stay without them (D73-1).

## Cause

Read at `dc5e3af66`
- The sitemap reads listings through `applyPublicVisibility` only (`src/app/sitemap.ts:61`), the rule for what is listed in search results: an active, unexpired listing (`src/modules/listings/lib/visibility.ts:137-145`); its page count uses the same rule (`src/app/sitemap.ts:15-22`).
- Sold and rented listings open by address (`visibility.ts:38-42`) and carry `noindex` once `archived_noindex_days` have passed since their last update (`src/app/[locale]/listings/[slug]/page.tsx:93-98`); measured anonymously on production 2026-11-19: a sold and a rented listing open (200, no `noindex`) and are on `/uk/listings?tab=closed`.
- The settings offer no such switch: the allowed keys (`src/modules/admin/actions/index.ts:286-289`) and the SEO tab (`src/components/admin/AdminSettings.tsx:20`).

Fix: a boolean setting read by the sitemap; when on, the sitemap's predicate adds sold and rented listings updated within `archived_noindex_days`.

## Scope

- Dependency: Task 989 (it moves the key list to `src/modules/admin/lib/settingKeys.ts` and adds the test that every key has a reader).
- Setting `sitemap_closed_listings`, values `'true'` or `'false'`, absent = `'false'`; `validSettingValue` accepts only those two; saving it calls `revalidateTag(PUBLIC_LISTINGS_CACHE_TAG)` so the sitemap and its count follow.
- `src/modules/listings/lib/visibility.ts`: `applySitemapVisibility(query, { closedSince })`: without `closedSince` exactly `applyPublicVisibility`; with it, also `status in ('sold','rented')` and `updated_at >= closedSince`, built from `OPEN_BY_ADDRESS` so it cannot drift from the address rule.
- `src/app/sitemap.ts`: reads the setting and `getArchivedNoindexDays()`; `publicListingCount` and the page query both use `applySitemapVisibility`; a failed settings read keeps the switch off.
- `AdminSettings.tsx` SEO tab: a Mantine `Switch` (the canonical `Mantine/Primitives/Switch`) with a description that names the effect and the `archived_noindex_days` limit.
- Messages in four locales (`admin.settings.sitemap_closed_*`). Out of scope: search results and the listings tabs (O992-1, D73-1); the noindex rule itself.

## Attack surface

Changed: a staff setting changes what the public sitemap lists.
1. **What are we working on?** `sitemap_closed_listings`, written by staff with `settings.manage` through
   `saveSettings`; read by the public sitemap with the service role.
2. **What can go wrong?**
   - T1 I: the sitemap lists a listing a visitor may not open (pending, archived, inactive, deleted) → mitigate: the
     predicate is built from `OPEN_BY_ADDRESS` and tested against every status → AC1, `SEC-992-SITEMAP-DENY`.
   - T2 T: a stored value other than the two turns the switch on → mitigate: the save refuses it and the reader treats
     anything but `'true'` as off → AC2.
3. Each mitigation is an acceptance criterion with a test that fails when the control is removed.
4. Authorization matrix: row `SEC-992-SITEMAP-DENY` (statuses other than active, sold and rented never in the sitemap,
   switch on or off).

## OWASP

Required by `node scripts/quality/owasp.mjs plan` (2026-11-19).

- Attack_Surface_Analysis: "developers should understand and monitor the Attack Surface as they design and build and change a system" — "## Attack surface" names the setting and the public sitemap that reads it — AC1.
- Authorization: "Permission should be validated correctly on every request, regardless of whether the request was initiated by an AJAX script, server-side, or any other source." — `saveSettings` keeps its `settings.manage` check; the sitemap exposes only addresses anyone may open — AC1, AC2.
- Authorization_Decisions_And_Output_Handling: "Fail closed. Deny protected operations on PDP errors, timeouts, or unusable output." — a failed or unknown setting value keeps the switch off — AC2.
- Authorization_Patterns: not applicable — the permission model is unchanged; the predicate reuses the address rule.
- Authorization_Regression_Testing: "Automated tests should specifically target the ways authorization usually degrades over time." — `SEC-992-SITEMAP-DENY` fails if a non-public status enters the predicate — AC1.
- Authorization_Testing_Automation: "Integration test cases validate the correct implementation of the authorization matrix." — the matrix row runs over every listing status — AC1.
- Cross_Site_Scripting_Prevention: not applicable — the switch renders message keys; listing slugs stay URI-encoded in the sitemap as today.
- DOM_based_XSS_Prevention: not applicable — no value from the address or storage reaches a sink.
- Identity_Propagation_Patterns: not applicable — the sitemap is public and acts for no user; its service read filters by the public rule.
- JavaScript_and_TypeScript_Security: not applicable — a two-value setting; no merge, path setter or regular expression.
- Nextjs_Security: "Treat each reachable action as a client-callable POST entry point." — `saveSettings` is tested by direct call with a forged value — AC2.
- Secure_Code_Review: "Diff-Based Reviews focus on code changes only." — reviewed with the review-task skill on this task's diff — AC5.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — no dependency added; the reviewer reruns every claim of the report — AC5.
- Secure_Product_Design: "Threat Modeling - which results in security related stories being added during" — the threat model's mitigations are AC1 and AC2.
- Threat_Modeling: "the threat modeling process should answer the following four questions" — answered in "## Attack surface" — AC1, AC2.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — the reviewer reruns the implementer's results — AC5.
- Web_Cache_Security: not applicable — the sitemap is a public document for every visitor; revalidating its tag adds no per-user content.
- Web_Frontend_Security: "The fundamental security rule is to never use innerHTML with untrusted data." — no HTML sink is added — AC3.

## UI

GR-0 queries: "settings switch". Inspected: `Mantine/Primitives/Switch` Story, `AdminSettings` SEO tab. Decision: REUSE
Mantine `Switch` with label and description; no new component. Reference research (GR-7): inherited canonical design —
owner decision 2026-10-20 (`Mantine/Primitives/Switch`).

## Mobile adaptation record
- Scope: visible
- Surfaces: src/components/admin/AdminSettings.tsx — the switch in the SEO tab
- Component families: form-picker-and-choice
- Pattern IDs: form-stack
- Standards: w3c-labels-instructions, w3c-reflow, apple-hig-layout, android-content-structure
- Mantine mechanism: responsive-props
- Mantine owner: src/design-system/mantine/patterns/MantineFormSectionStack.tsx
- Mobile range and switches: <640px (theme.other.mobileGate / sm): the switch row full width, its description below; 640px transition unchanged
- Mobile order: label → switch → description
- Required-content treatment: label and description wrap at full width; no truncation
- Story and verification: the Switch Story with a long label and description at 320px, 639px and 640px × sq, en, uk, it

## Acceptance criteria

- AC1 The sitemap follows the switch and never lists a closed address — test: `src/app/__tests__/sitemap.security.test.ts` (extended): off → only active unexpired, as today; on → also sold and rented updated within `archived_noindex_days`, not older ones; `SEC-992-SITEMAP-DENY`: pending, archived, inactive and an expired active listing never appear; the count and the page query use the same predicate; and `src/modules/listings/lib/visibility.test.ts` (extended): the predicate's statuses are those of `OPEN_BY_ADDRESS`.
- AC2 The setting holds only its two values — test: `src/__tests__/security/staffActions.test.ts` (extended): `saveSettings` accepts `'true'` and `'false'`, refuses any other value, and revalidates the public listings tag; a stored `'yes'` is read as off.
- AC3 The switch saves — test: `src/components/admin/__tests__/AdminSettings.sitemapSwitch.test.tsx` (new): the SEO tab shows the switch with its description; toggling and saving sends `sitemap_closed_listings` with `'true'` or `'false'`.
- AC4 Texts and widths hold — test: `node scripts/check-mobile-adaptation-contract.mjs`, `node scripts/check-i18n-parity.mjs`, `node scripts/quality/locale-safety.mjs`.
- AC5 The CI jobs pass — test: `gh pr checks <n>` on GitHub after every check has concluded (checklist A5).

## Route

1. Starts after Task 989 is merged. Branch from `main`. Read `sitemap.ts`, `visibility.ts`, `settings.ts`, `saveSettings`, `AdminSettings.tsx`, the two existing tests.
2. Tests first (AC1-AC3); save each failing output.
3. The predicate, the sitemap, the setting and its validation, the switch, the messages. One pass over every changed file (checklist I7).
4. Run: the task tests · CI on GitHub only (`gh pr checks <n>`, checklist A5); deliberate break: the predicate without its status list → `SEC-992-SITEMAP-DENY` fails, restored.
5. Report: each command, exit code, relevant output. After the merge Opus turns nothing on; the owner turns the switch on, and Opus reads `/sitemap/0.xml` for the two listings.

## Review
