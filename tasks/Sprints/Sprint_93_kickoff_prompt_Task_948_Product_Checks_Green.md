# Task 948 — The product checks of CI pass: four token findings and one Tailwind utility

Sprint 93 (governance reset). Priority P1. Owner decision D1 (2026-11-06): "rewrite the rules of the flow and the
gates" — a gate that is red on `main` checks nothing. Absorbs the legitimate part of the withdrawn Task 937 (the
product debt; its detector rewrite is dropped). Implementer: Sonnet. Reviewer: Opus.

## Goal

`node scripts/quality/product-gates.mjs` (the `quality` job of `.github/workflows/ci.yml`) fails on two gates,
measured 2026-11-06 on `task/935-governance-approval-route`:

1. `npm run check:design-tokens:strict` — 2 violations, 2 stale markers:
   - `src/components/shared/Map.module.css:37` `line-height: 30px` (css-length) **and** its marker is reported stale:
     the line carries two comments (`/* Leaflet's own */ /* design-tokens-allow: … */`), and the marker is not matched;
   - `src/modules/cabinet/components/CabinetEmailChangeSectionView.tsx:70` `<Info size={20} />` (raw-dimension-prop) —
     the same alert icon elsewhere uses the theme: `ListingDetailView.tsx:443` `theme.other!.iconSize!.standard`,
     `ListingStatusBanner.tsx:28` `theme.other!.iconSize!.roomy`;
   - `src/design-system/mantine/input-chrome.css:476` `inset-block: -1px` marker reported stale.
2. `npm run check:enrolled-tailwind` — `src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx:98`
   `overflow-clip` is a new Tailwind utility in an enrolled Mantine file (the baseline is remove-only), and the
   `overflow-hidden` entry is stale (count 1, baseline 2).
3. `npm run check:ui-contract` (split from Task 953 after its two revisions, owner's flow rule; PR #19 run 42499113506
   on `263cbf642`): Task 953 R4 enrolled `src/components/admin/AdminUsersTable.tsx`, `src/lib/navigation/ClientLink.tsx`
   and `src/modules/cabinet/components/CabinetEmailChangeSection.tsx` in `scripts/mantine-migration-scope.json`, and
   `scripts/ui-contract-registry.json` has no contract for them ("newly enrolled component lacks an explicit UI
   contract"). The local review did not see it: the gate reads committed `base..head` only (Task 963 AC11).

Re-measured 2026-11-09 on `14c8eb283` (PR #19 run 42581191928 and a local `product-gates.mjs`): the same three gates,
the same findings and lines. After the task the three commands exit 0 and no behaviour changes.

## Scope

- `Map.module.css:37`: one comment on the line, in the marker format the detector documents
  (`design-tokens-allow: <value> — <reason>`), keeping Leaflet's 30px from 640px up (the value restores Leaflet's own
  stylesheet; it is not a project design value). Read `scripts/check-design-tokens.mjs` for the exact marker grammar
  before writing it.
- `CabinetEmailChangeSectionView.tsx:70`: `theme.other!.iconSize!.roomy` (20, `src/design-system/mantine/theme.ts:765`),
  as `ListingStatusBanner.tsx:28` does for the same alert icon; if the View has no theme access, use
  `useMantineTheme()`. Rendered size stays 20px.
- `input-chrome.css:476`: a marker the detector matches (or remove it if the value is no longer a finding — state
  which, with the detector line that decides).
- `MantineListingGalleryPattern.tsx:98`: the clip moves out of the Tailwind class into the pattern's own styling
  owner (its CSS module, or `style`/Mantine `Box` styles as the file already does for the track), keeping
  `overflow: clip` (the reason is in the comment at lines 86–87: a hidden-overflow box is a scroll container and
  scrolls the wrong slide into view). Then `npm run check:enrolled-tailwind:update-baseline` to record the paid-down
  `overflow-hidden` entry — the update may only remove or lower entries; show the baseline diff.
- `scripts/ui-contract-registry.json`: one entry per component of Goal 3, in the shape of the existing
  `admin-users-table-view` and `cabinet-email-change-section-view` entries. Each container adds no markup of its own,
  so its contract points at its direct Story (`AdminUsersTableContainer.stories.tsx`, `ClientLink.stories.tsx`,
  `CabinetEmailChangeSectionContainer.stories.tsx`), `tokenOwners` `src/design-system/mantine/theme.ts`, and a
  `parity` element naming the View (or the Mantine component, for `ClientLink`) it renders, with that Story's exports.
  No Story or component changes.
- Out of scope: the detectors themselves, any other finding, any visual change.
- Dependencies: none.

## Attack surface

Unchanged (styling and comments only).


## OWASP

Required by `node scripts/quality/owasp.mjs plan` (757270a26306, mapping of 2026-11-07).

- CI_CD_Security: "Require pull requests to be reviewed before merging and ensure this review step cannot be bypassed." — the product checks this task turns green are part of CI Required — AC5.
- Content_Security_Policy: not applicable — the style sheet changes are a comment and a marker; no url(), @import, font or image source is added, so no directive changes.
- Cross_Site_Scripting_Prevention: "Since no single technique will solve XSS, using the right combination of defensive techniques will be necessary to prevent XSS." — the token and Story fixes render text through React escaping only; lint (react/no-danger, no-script-url) runs on them — AC5.
- DOM_based_XSS_Prevention: "It is always a bad idea to use a user-controlled input in dangerous sources such as eval." — the token and Story fixes add no eval, Function, innerHTML or computed URL; lint (no-eval, no-implied-eval) and client-sinks check them — AC5.
- GitHub_Actions_Security: not applicable — the workflow file is read for the job list only; the task edits no workflow.
- Database_Security: not applicable — "registry" and "entry" name a JSON file of the UI gate; no database, grant or policy is touched.
- GraphQL: not applicable — no API of any kind is added or changed; the task edits styling, Stories and gate data.
- Mass_Assignment: not applicable — no request body is bound to a record; the registry entries are written by hand.
- Multi_Tenant_Security: not applicable — no data access or tenant boundary changes; the task edits styling and gate data.
- Query_Parameterization: not applicable — no query is built; the gate reads a committed JSON file.
- SQL_Injection_Prevention: not applicable — no SQL is written or run; `base..head` is a Git revision range.
- Injection_Prevention: not applicable — the design-token script gets baseline data changes only; no command or query is built.
- JavaScript_and_TypeScript_Security: "Keep patterns linear: avoid nested quantifiers and ambiguous alternation over the same characters." — lint and CodeQL security-extended (CI) run on every changed file — AC5.
- OS_Command_Injection_Defense: not applicable — no script that starts a process is changed; the baselines are data files.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — the executor's report is input: Opus reruns every acceptance command in review — AC5.
- Software_Supply_Chain_Security: not applicable — no dependency, lockfile or install step changes in this task.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — a claim of the report that does not reproduce in review is a finding — AC5.
- Web_Frontend_Security: "The fundamental security rule is to never use innerHTML with untrusted data." — the token and Story fixes use no innerHTML; lint (react/no-danger) fails on one — AC5.

## UI

No visible change. `MantineListingGalleryPattern` mobile frame keeps `overflow: clip`; the cabinet alert icon stays
20px. Canonical owners unchanged.

## Mobile adaptation record
- Scope: none

## Acceptance criteria

- AC1 `npm run check:design-tokens:strict` exits 0 with `Total: 0 raw … | 0 stale-marker(s)`.
- AC2 `npm run check:enrolled-tailwind` exits 0; the baseline diff only removes or lowers entries.
- AC3 The play function of `Default` in `src/stories/patterns/mantine/ListingGalleryPattern.stories.tsx` (there is no
  separate mobile Story), before its lightbox click: below the mobile gate (`window.matchMedia(belowMobileGateQuery(…))`,
  as `CustomRangeTooLong` does) it asserts the frame's computed `overflow` is `clip` and that ArrowRight followed at
  once by Tab (the next slide takes focus before the track has moved) leaves the frame's `scrollLeft` at 0 with the
  visible slide focused (the Task 923 R33 case; review 1, F1); from the gate up the play is
  unchanged — test (refined 2026-11-09: Task 939 added the flags): `node scripts/check-locale-leak.mjs --mantine-only
  --report-only-leaks --story=patterns-mantine-listinggallerypattern--default --widths=320,390,639,640,1280` exits 0
  with every tuple scanned (red at 320, 390 and 639 px with the frame's clip set to `hidden`, and red again from the
  `scrollLeft` line, `expected 576 to be +0` at 320 px, with the computed-style line also removed).
- AC4 `src/modules/cabinet/components/__tests__/CabinetEmailChangeSectionView.test.tsx` asserts the pending-state alert
  icon is rendered with `theme.other.iconSize.roomy` (20) and no raw number.
- AC6 Every newly enrolled component has its UI contract — test: `node scripts/check-ui-contract.mjs --base main`
  exits 0 with "Newly enrolled components requiring a contract: 3" listed and no FAIL line (red today on `263cbf642`),
  and `node scripts/check-ui-contract.mjs --verify-gate` exits 0 (the registry is valid and each Story imports its component).
- AC5 `node scripts/quality/product-gates.mjs` reports no failing gate, and `npm run lint`, `npm run typecheck`,
  `npm test`, `node scripts/quality/check-files.mjs --worktree` exit 0.

## Route

1. Read `scripts/check-design-tokens.mjs` (marker grammar) and `scripts/check-enrolled-tailwind*.mjs` (baseline rule).
2. Make the four edits above; run AC1 and AC2 after each file.
3. Write the AC3 play function and the AC4 test; build Storybook and run them.
4. Run AC5. Report each command, exit code and the relevant lines.

## Review

Review 1 of the working tree on 14c8eb283 — NEEDS REVISION (1 of 2)
Scope: every changed file read in full; OWASP record `docs/security/owasp/reviews/Task_948.json`.
Tools (2026-11-09, reviewer reruns): `owasp.mjs sync` found Multi_Tenant_Security changed (rate-limit text consolidated,
no new requirement for this project; mapping re-read), then `check` 0; `check-ruleset` 0; lint 0; typecheck 0; `npm test
-- --coverage` 0 (373 files, 6143 tests); changed-lines coverage 0; `check-files --worktree` 0; `ac-tests` PASS; AC1 0
(0 raw, 0 stale); AC2 0 (baseline only `overflow-hidden` 2 → 1); AC4 2/2, red with `size={20}` restored (`expected '20'
to be '23'`), restored (sha 08f8123f); AC6 `check-ui-contract --base main --head <scratch commit>` PASS (the gate reads
commits only, so the worktree was committed in a scratch clone; the project's Git untouched). CRLF in the worktree is
the checkout's (an untouched `Map.tsx` has it too); `.gitattributes` `eol=lf` normalises on commit. CI not run.
Findings: Critical 0, High 0, Medium 1, Low 0.

F1 — AC3's behaviour check passes with the defect it guards against
Severity: Medium      Category: Tests      CWE: —
Location: `src/stories/patterns/mantine/ListingGalleryPattern.stories.tsx` (the `Default` play, ArrowRight branch)
Description: the play focuses the frame, presses ArrowRight, waits for the track and asserts `scrollLeft` 0. Focus never
leaves the frame, so the browser has nothing to scroll into view: with `overflow: hidden` the frame stays at 0. The red
of the deliberate break came from the computed-style line alone, which mirrors the implementation. The R33 defect is a
slide that takes focus before the track has moved. The design caused part of it: the refinement of 2026-11-09 wrote
"moving to the second slide" where the first text said "tabbing".
Reproduction (reviewer probe on the built Storybook, 320 px, frame style set in the page): ArrowRight → `scrollLeft` 0
for `clip` and for `hidden`; ArrowRight then Tab at once → 0 for `clip`, **288** for `hidden` (the R33 number).
Recommendation: R1 — the play presses Tab right after ArrowRight (no wait between them), then waits for the track and
asserts `scrollLeft` 0 and that the focused element is the visible slide; the deliberate break is run twice: with
`overflow: 'hidden'`, and with `'hidden'` plus the computed-style line removed, and the second red must come from the
`scrollLeft` line (`expected 288 to be 0`).
Status: open

Not findings: `throwPlayFunctionExceptions: true` on `Default` is needed and right; it exposed a gate gap that every
Story without it shares (`storybook/test` sets the project default to `false`): filed as Task 967. The `input-chrome.css`
marker removal is right (the value is no finding). `mobileFrameStyle` keeps the clip in the pattern, its owner.
Revision 1 (Sonnet): R1, then AC3 both ways and AC5.

Review 2 of the working tree on 14c8eb283 (revision 1) — APPROVED
Tools (2026-11-09, reviewer reruns): `owasp.mjs sync` 0 changed, `check` 0; `check-ruleset` 0; lint 0; typecheck 0;
`check-files --worktree` 0; F1 fixed: the play presses ArrowRight and Tab in one call, then asserts `scrollLeft` 0 and
the visible slide focused. AC3 rerun by the reviewer: with `mobileFrameStyle` set to `hidden` and the computed-style
line removed, exit 1 (6/15; 320, 390, 639 px), the Story's console `AssertionError: expected 576 to be +0` at 320 and
`716` at 390 (the focused slide's offset; review 1's probe focused another slide, 288); restored (both sha equal), exit
0 (15/15). AC6 on a scratch commit of the whole tree: PASS (6 changed Stories, 3 contracts). Unchanged since review 1:
AC1, AC2, AC4, the unit suite. Findings: none open. Task 967 carries the play-exception gap found in review 1.
