# Task 957 — Review 5

Kickoff: [Sprint_93_kickoff_prompt_Task_957_Signed_Listing_Uploads.md](../../tasks/Archive/Sprint_93_kickoff_prompt_Task_957_Signed_Listing_Uploads.md) · OWASP record: [Task_957.json](../security/owasp/reviews/Task_957.json)

Review 5 of Revision 4, working tree on 4d495f9cc (uncommitted, branch `task/957-revision-4`) — NEEDS REVISION
Scope: the Revision 4 diff (R4-1, R4-2, R4-4, R4-6), 20 files that differ from `9de067faf`: `listingTransitionEngine.ts`, `listingStatusOptions.ts`,
`applyListingTransition.ts` (comments), `ListingFormShellView.tsx`, `updateListing.ts`, the four `messages/*.json`, `scripts/ui-contract-registry.json`,
five Stories (`Card`, `AdminEditLayout`, `DeleteIconButton`, `FormSectionStack`, `ListingFormFields`) and five test files. R4-3 and R4-5 left this task
with the split of 2026-11-22 (Tasks 1001 and 1015); not reviewed here.
Tools (local, 2026-11-23): `owasp.mjs sync` → exit 0, 0 changed; `owasp.mjs check` → exit 0; `check-ruleset.mjs` → exit 0, the live ruleset matches;
`gh run list --branch main --limit 3` → the three latest `main` runs `success` (CI 45124810384); Start set: `git diff --name-only --diff-filter=AM
213103f0a 9de067faf` without `tasks/` minus `git diff --name-only 213103f0a 9fb43c965`, plus the four `messages/*.json` → 137 files; the two
`scripts/quality/cloudinary-config*` are in `4d495f9cc`; the other 135 and the 8 deletions are in the tree, and every one of the 135 equals `9de067faf`
byte for byte except the 20 Revision 4 files and `scripts/ui-contract-registry.json` (new to the set, R4-4); `npm test --` the four Revision 4 test files
→ exit 0, 29 passed; failing-first (the nine product and message files put back to `9de067faf`, restored with `cmp` equal) → exit 1, 8 failed, 21 passed,
as the executor reported; deliberate break 1 (`pending` back in `STAFF_ONLY_TARGET_STATUSES`) → exit 1, 5 failed; break 2 (the `active` → `pending`
refusal removed from `canOwnerSetStatus`) → exit 1, 6 failed, `[SEC-O957-10-SRV-DENY]` among them; both restored (`cmp` equal); `npm test --
src/modules/listings/actions/applyListingTransition.test.ts` → exit 1, 1 failed of 57 (F34); `npm test --` the six neighbouring status and form test
files (`listingTransitionEngine.test.ts`, `ListingFormShell.moderation.security.test.tsx`, `ListingFormLoader.test.tsx`,
`ListingFormShell.cloudinaryConfig.test.tsx`, `ListingFormShellView.controls.test.tsx`, `listingStatusChange.smoke.test.ts`) → exit 0, 169 passed;
`check-i18n-parity.mjs` → exit 0, 2694 keys; `check-ui-contract.mjs --verify-gate` → exit 0; `check-ui-contract.mjs --base origin/main` → exit 0 but
reads the committed `HEAD` (0 Stories, 0 components inspected), so AC39 is UNKNOWN until the commit; the working-tree registry read against the
working-tree manifest: 19 newly enrolled paths, every one with an entry, every token owner present; `owasp.mjs review <kickoff> --base main` → exit 0,
60 sheets, every one in the record. Not run (A5: CI only on GitHub): `tsc`, lint, the unit job, `[INT-EDIT-EMPTIED]` (needs `task957-parking.sql`
applied), every rendered Story check (owner order 2026-11-21).
Findings: Critical 0, High 0, Medium 1 (F34), Low 2 (F35, F36 after the owner's decision O957-16)
Overall risk: no new hole; the owner's way back to moderation and the emptied fields work as decided and are proven, but one unit test still pins the
withdrawn O957-10 rule, so `CI Required` cannot pass.

## Secure code review (`secure-code-review.md` §2, §3)

1. Existing controls: the gateway keeps the owner and staff checks; the owner's `pending` is decided on the server (`listingTransitionEngine.ts:218-223`), the
   UI list only mirrors it. 2. New vectors: none (no entry point, parameter or sink added). 3. Trust boundaries: unchanged; a session still cannot write
   `listings.status` (`guard_listings_protected_columns`, `supabase/catalog.json` triggers), only the gateway's service write does. 4. Integrations: none.
   5. Regression: three security tests changed with the decision O957-11 (each case rewritten to the new rule, none deleted; `notify` still observed on the
   refusal); one test pinning the old rule left unchanged (F34). 6. Patterns:
- Authorization — touched: owner `pending` from every status but `active` (`listingTransitionEngine.ts:221-223`), `active` staff-only; the same matrix as
  `main` (`git show main:src/modules/listings/domain/listingTransitionEngine.ts`, line 211) minus `active` → `pending` (O957-10).
- Input and output — touched: `updateListing.ts:134-135` writes 21 named columns from the parsed payload (an allow-list constant, `:34-37`), no new
  bindable field; every one is a nullable column of `listings` (`supabase/catalog.json` columns; the two parking columns are in `task957-parking.sql`).
- Business logic — touched: the parking floor check can no longer be broken by an edit (smoke test); `[INT-EDIT-EMPTIED]` UNKNOWN until the SQL apply.
- Authentication, requests and redirects, Next.js entry points, JavaScript and TypeScript, data exposure, files, dependencies and configuration — not
  touched: none of the 20 files is a route, auth module, proxy, config, upload handler or lockfile.
- Agent and tool output — touched: the executor ran a script of its own (`scratchpad\scan-worktree.mjs`, outside the repository, A6) and first wrote
  three test hunks through shell strings (A12); both stated in its report, the hunks re-read here; no repository file comes from them.
- Tests — touched: F34.

## Findings

F34 — a unit test still pins the withdrawn O957-10 rule, so `CI Required` fails
Severity: Medium      Category: Tests (Authorization regression)      CWE: none
Location: src/modules/listings/actions/applyListingTransition.test.ts:383-387
Description: the case "owner of own listing: archived → pending is refused (O957-10: only staff send a listing to review)" expects `forbidden`; after
O957-11 the gateway answers `{ ok: true, nextStatus: 'pending' }`. The file is not in the Revision 4 file list, so the executor stopped and reported it (I6).
Impact: the unit job fails; the pull request cannot merge.
Reproduction: `npm test -- src/modules/listings/actions/applyListingTransition.test.ts` → exit 1, 1 failed, 56 passed.
Recommendation: rewrite the case to O957-11: the owner's `archived` → `pending` is `{ ok: true, nextStatus: 'pending', listingId: 'l1' }`, and an owner's
`active` → `pending` is `{ ok: false, reason: 'forbidden' }`; the test changes with the behaviour it pins (`quality-gates.md` §8), nothing else.
References: Authorization_Regression_Testing; `quality-gates.md` §8.
Status: Revision 5 R5-1.

F35 — three comments contradict the code
Severity: Low      Category: Process (facts)      CWE: none
Location: src/modules/listings/components/ListingFormShell.tsx:58; src/stories/patterns/mantine/ListingFormShellView.stories.tsx:113; src/modules/listings/actions/updateListing.ts:32
Description: `ListingFormShell.tsx:58` says only staff may set `pending` (O957-10); the `OwnerStatusControl` comment says only staff send a listing to
review. Both were true before O957-11; R4-1 corrected the same sentence in four other files. `updateListing.ts:32` says `multi_storey_building` is
"not null"; `supabase/catalog.json` lists it `nullable: true`; what holds is that the form always sends a boolean (`types/form.ts:29`, the edit page
loads `?? false`, `edit/page.tsx:135`).
Impact: the next reader is told a rule that no longer holds.
Recommendation: the three comments state O957-11 and the nullable column with the boolean the form sends.
Status: Revision 5 R5-2.

F36 — the owner's status dropdown lists the current status, "On moderation" among them
Severity: Low      Category: UI contract (approved behaviour, owner decision)      CWE: none
Location: src/modules/listings/components/listingStatusOptions.ts:25-33; src/modules/listings/components/ListingFormShellView.tsx:94-101, :271-278
Description: `buildListingStatusOptions` puts the current status first for every viewer (`:29`), and R4-1 labels a current `pending` "On moderation"
for the owner (`:27`, key `listing.status_pending_owner`); `StatusChangeSelect` shows it as the value and as a list item (`value={currentStatus}`).
Owner decision O957-16 (2026-11-23, translated): "Why show this status in the dropdown/combobox to an ordinary agent or user at all? It only confuses
him. If the listing is in moderation, it must be only a badge, and the combobox must hold only the operations available to him!"
Impact: the owner reads a status among the operations as if it could be chosen.
Recommendation: for the owner (`canPublish` false) the list holds only the targets (`getOwnerTargetStatuses`), `pending` as "Publish"; the current status
is the canonical listing status badge (`MantineBadge variant="status" entity="listing"`, `badgeTones.ts:41-49`, the cabinet's look); "On moderation" in the
dropdown and its key leave; staff keep the current status in their list and the label "Under review".
Status: Revision 5 R5-3.

## For the owner

- Stories changed by R4-4 (V9; read from the code, not rendered): `Mantine/Primitives/Card` `Default` section 4 (the caption and body now render as
  plain `Text`, unlike sections 1-3); `Patterns/Mantine/AdminEditLayout` `Default` (the two inner stacks: `sm` → the default `md`);
  `Patterns/Mantine/FormSectionStack` `Untitled` (`sm` → `md`); `Patterns/Mantine/ListingFormFields` `FieldKinds` and `NumberInput` (`xl` → `md`;
  `Apartment`, `House`, `GarageMultiStorey`, `Land`, `WithValuesAndErrors` hold one child, no visible change); `Patterns/Mantine/DeleteIconButton`
  `States` (no change: `md` is the default) and `OnPhoto` (the button is no longer placed top right over the photo; `AppImage` renders it after the image,
  `AppImage.tsx:172`).

Owner's answers, 2026-11-23 (translated), to the three questions this review first asked; each was answerable from the code, and the code holds:
- Spacing: "we accepted canonical gutters in all Stories, so that they do not stick to the screen edges and the gutters from the edges are the same in
  all Stories; it can be a wrapper in Storybook itself". The edge gutter is unchanged: the four pattern Stories still wrap every export in the one
  profile `StoryPageGutter` (`src/stories/_StoryPageGutter.tsx`, GR-3d) and `Card` in `MantineStoryShell`; R4-4 removed only the local gap between
  demo items, which now is the theme's one default, the same in every Story. No change.
- Status labels: "in the cabinet, in 'My listings', the owner may see the badge 'On moderation', because this status shows that the listing is not
  published yet. While editing, in the status dropdown, the owner (unless admin/moderator) must not see the status 'On moderation' to select it".
  The cabinet holds: its badge is `cabinet.status_pending` (`ListingsTab.tsx:299`; uk "На модерації"), unchanged. The dropdown does not: see F36 and
  the owner's decision O957-16 below.
- Story: "why multiply Stories? We already have a Story with cards with different badges": `Mantine/Primitives/ListingCard` renders the `pending`
  badge (`src/stories/mantine/primitives/ListingCard.stories.tsx:85`); "Publish" is proven by `listingStatusOptions.security.test.tsx`. No new Story.

Owner's decisions, 2026-11-23 (translated), after F36; new requirements, not defects of Revision 4. They change only files of this branch's form
(one import graph, kickoff Scope "Dependencies"), so they go into Revision 5 as O957-14 kept the form's work here; `design.md` says a revision does not
grow the Scope, and this exception is reported to the owner:
- O957-17: "an agent and users (except an admin and a moderator) must have, while creating/editing a listing, this set of options in the combobox:
  Publish, Archive, Deactivate, Sold, Rented". Today the owner is also offered `expired` (`canOwnerSetStatus`, `listingTransitionEngine.ts:221-223`;
  the gateway accepts it) and `inactive` reads "Неактивне" (`listing.status_inactive`). On create there is no status control
  (`src/app/[locale]/listings/create/page.tsx` passes none) and a new listing is always `pending` (the database guard on INSERT,
  `supabase/sql_migrations/task923/db-catalog/proposed-hardening.sql:307-314`), so the set is the edit form's.
- O957-18: "I do not see the button 'Delete listing' at all. It must be a separate section under the section of actions with the listing (where
  the buttons 'Save changes', 'Cancel', 'Change status' are)". `main` never had it in the form (`git log -S deleteListing main` over the two form files:
  nothing); the owner deletes in the cabinet (`ListingsTab.tsx:139-149`, `deleteListingAction`, which checks owner or `listings.delete`,
  `deleteListing.ts:33-34`).
- O957-19: "the user opened 'My listings', pressed 'Edit', then 'Cancel changes', and is sent to the page of this listing; he must be sent back to the
  page where he was before". `main` does the same (`ListingFormShell.tsx` `navigateAway`: `router.push` to the listing page whenever the URL has a slug,
  so that a form opened in a new tab without history still leaves); the branch keeps it (`:81-88`).

## Revision 5 (Sonnet; only these items)

- R5-1 (F34) `applyListingTransition.test.ts:383-387` to O957-11 (AC36).
- R5-2 (F35) the three comments.
- R5-3 (F36, O957-16) the owner's dropdown holds only the operations; the current status is a badge (AC36).
- R5-4 (O957-17) the owner's five operations; `expired` staff-only on the server too (AC36).
- R5-5 (O957-18) the owner's delete section in the edit form (AC42).
- R5-6 (O957-19) Cancel returns to the previous page (AC43).

Open parts, in order: Revision 5 (Sonnet) → Review 6 → the commit (H) → `gh pr checks` (AC39 on the committed branch, the unit and integration jobs after
the owner's apply of `task957-parking.sql`) → Opus: AC9 (the SQL round trips, the catalog).
