# Task 937 — Governance Check green, product half: NUL file, mojibake, the gallery utility and three design-token findings

Sprint 92. P1. QA profile **Q1** (four UI files change in source with no rendered change, three evidence files and two gate data
files change; `docs/qa-profiles.md`). Kickoff by Opus, 2026-11-01. Published on PR #12 (D7) as the product task for the red
Governance Check job (D8). The fifth failed gate of that job, the listing-visibility allowlist, is a policy file and belongs to the
governance Task 942.

## 1. Mode, task type and rule bundle

Product task. **Implementer: Sonnet, fresh session (`execute-task`). Reviewer: Opus.** Types (`docs/rule-index.md`): file hygiene,
design tokens, enrolled Tailwind debt, frontend and server security tests. Bundle: `.claude/rules/shared/security-testing.md`,
`security-test-quality.md`, `security-test-environment.md`, `workflow-gates.md` with its companions,
`claim-evidence-contract.md`, `task-readiness.md`, `canonical-component-reuse.md`, `mobile-adaptation-contract.md`,
`ui-token-contract.md`, `enforcement-model.md`. The UI edits keep every rendered value, so the mobile record is `Scope: none`;
the write hook still needs the UI receipts of §6.

## 2. Objective

On PR #12 the Governance Check job passes 46 of 51 static gates (C32). Four of the five failures are product or evidence files:

- file integrity: a tracked pathspec file with NUL separators (C1, C2), written by a Task 923 manifest script for `git add` (C3);
- mojibake: 395 findings in two evidence files (C4, C5, C6) — a verbatim transcript of an earlier mojibake run (C8), which the gate's
  own remediation sends to the allowlist (C7), and a Task 927 test listing whose only non-ASCII text is CP1252 mojibake of two
  characters, repairable exactly (C9, C10);
- enrolled Tailwind: the gallery's mobile frame gained the utility `overflow-clip` in Task 923 R33 (C11, C13, C14) and the
  `overflow-hidden` count it replaced is now stale (C12); the baseline is remove-only (C15);
- design tokens: two inline markers use " - " instead of the em dash the parser splits on (C16, C17, C18, C19), and one icon size is
  a raw number where the theme has the same role (C20, C21, C22).

Every fix keeps the rendered result. The design probes show each design-token finding cleared by the planned text (C23–C26).

## 3. Verified context

The gallery comment explains why the frame must clip rather than hide (C14), so the style object keeps `overflow: clip`. The
e-mail section view is presentational (C33); a sibling already sizes the same info icon with `theme.other.iconSize.roomy` from a
static theme import (C22). The resend action behind that view refuses an anonymous caller and retires only the session user's
earlier links (C30, C31). Four of the changed product files are in the reviewed Task 923 D8/D9 scope (C27); the gate data files and
the evidence files are not (C28), so the reviewer rebases that contract (D9). That write changes the 923 D8/D9 contract file, which the
reviewed Task 931 revision 3 and Task 935 contracts scope (C34); an approving contract must scope every file it lists, so this sidecar
scopes the 923 contract file and its reviewer also rebases those two contracts. No other contract binds a file of this change set
except through `src/modules/cabinet/actions/index.ts`, which is edited only for a planted break and restored (C35). Task 931
revision 3 lands first: it removes the load-dependent test failures of the full suite and adds a guard against hand-written query
doubles that this task's new server test must pass (C36), and the release check of Task 943 R11 finds any reviewed contract left
stale (C37). The UI receipts of §6 were run through the real write hook (C29).

## Claim ledger

| ID | Status | Claim | Evidence |
|---|---|---|---|
| C1 | FACT | CI file integrity fails on a tracked Task 923 pathspec file. | source: `docs/sessions/evidence/task937/design/l00-ci-excerpts.txt:5-5`; observed: `docs/sessions/evidence/task923/review-67/rv67-46-squash-paths.nul` |
| C2 | FACT | The file holds NUL bytes. | source: `docs/sessions/evidence/task937/design/l00-ci-excerpts.txt:6-6`; observed: `NUL bytes present (2835 bytes)` |
| C3 | FACT | The file is a NUL-separated pathspec written next to a text twin by the manifest script. | source: `docs/sessions/evidence/task923/review-67/rv67-46-squash-manifest.mjs:10-10`; observed: `Writes rv67-46-squash-paths.txt and .nul` |
| C4 | FACT | CI mojibake fails with 395 findings. | source: `docs/sessions/evidence/task937/design/l00-ci-excerpts.txt:8-8`; observed: `check:mojibake FAILED — 395 artifact(s), 0 invalid-UTF-8 file(s):` |
| C5 | FACT | One of the two files is the Task 923 mojibake transcript. | source: `docs/sessions/evidence/task937/design/l00-ci-excerpts.txt:9-9`; observed: `docs/sessions/evidence/task923/r33-13a-mojibake.txt` |
| C6 | FACT | The other file is a Task 927 test listing. | source: `docs/sessions/evidence/task937/design/l00-ci-excerpts.txt:10-10`; observed: `docs/sessions/evidence/task927/base/unit-base-failures.txt` |
| C7 | FACT | The mojibake gate sends intentional documentation to its allowlist. | source: `scripts/check-mojibake.mjs:263-263`; observed: `intentional documentation, add the path to scripts/mojibake-allowlist.json.` |
| C8 | FACT | The Task 923 file is the transcript of a hygiene run of the mojibake gate. | source: `docs/sessions/2026-10-10-task923-rendered-state-census.md:2565-2565`; observed: `r33-13a-mojibake.txt` |
| C9 | FACT | Replacing the two CP1252 sequences leaves only the em dash, the arrow and the BOM (executed probe). | source: `docs/sessions/evidence/task937/design/p03-mojibake-repair-probe.txt:3-3`; observed: `non-ASCII census after:  {"U+FEFF":1,"U+2014":79,"U+2192":47}` |
| C10 | FACT | The repair leaves the ASCII text unchanged. | source: `docs/sessions/evidence/task937/design/p03-mojibake-repair-probe.txt:8-8`; observed: `ASCII text unchanged: yes` |
| C11 | FACT | CI reports the gallery's overflow-clip utility as new debt. | source: `docs/sessions/evidence/task937/design/l00-ci-excerpts.txt:13-13`; observed: `MantineListingGalleryPattern.tsx :: overflow-clip  count=1` |
| C12 | FACT | CI reports the gallery's overflow-hidden baseline as stale. | source: `docs/sessions/evidence/task937/design/l00-ci-excerpts.txt:17-17`; observed: `overflow-hidden  current=1 baseline=2` |
| C13 | FACT | The mobile frame carries the overflow-clip utility. | source: `docs/sessions/evidence/task937/design/sources/src__design-system__mantine__patterns__MantineListingGalleryPattern.tsx.txt:98-98`; observed: `className="h-full w-full overflow-clip"` |
| C14 | FACT | The frame must clip, not hide (a hidden-overflow box is a scroll container). | source: `docs/sessions/evidence/task937/design/sources/src__design-system__mantine__patterns__MantineListingGalleryPattern.tsx.txt:86-86`; observed: `The mobile frame is` |
| C15 | FACT | The baseline update may only lower a count or drop a key. | source: `scripts/check-enrolled-tailwind.mjs:49-49`; observed: `may only lower a count or drop a` |
| C16 | FACT | CI design tokens fails with two raw values and two stale markers. | source: `docs/sessions/evidence/task937/design/l00-ci-excerpts.txt:19-19`; observed: `2 raw style-value violation(s) + 2 stale-marker(s) found.` |
| C17 | FACT | The map marker separates its reason with a hyphen. | source: `docs/sessions/evidence/task937/design/sources/src__components__shared__Map.module.css.txt:37-37`; observed: `line-height: 30px - restores Leaflet's stylesheet value from 640px up` |
| C18 | FACT | The input-chrome marker names a value the gate does not detect. | source: `docs/sessions/evidence/task937/design/sources/src__design-system__mantine__input-chrome.css.txt:476-476`; observed: `inset-block: -1px - the 1px border of the field` |
| C19 | FACT | The marker parser splits on the em dash. | source: `scripts/check-design-tokens.mjs:1053-1053`; observed: `const dashIdx = afterPrefix.indexOf('—');` |
| C20 | FACT | The e-mail section's info icon has a raw size. | source: `docs/sessions/evidence/task937/design/sources/src__modules__cabinet__components__CabinetEmailChangeSectionView.tsx.txt:70-70`; observed: `icon={<Info size={20} />}` |
| C21 | FACT | The theme's roomy icon size is 20. | source: `src/design-system/mantine/theme.ts:765-765`; observed: `roomy: 20,` |
| C22 | FACT | A sibling info alert sizes its icon from the theme. | source: `src/modules/listings/components/ListingStatusBanner.tsx:28-28`; observed: `icon={<Info size={theme.other!.iconSize!.roomy} />}` |
| C23 | FACT | The map edit clears both map findings (executed probe). | source: `docs/sessions/evidence/task937/design/p02-design-token-fix-probe.txt:1-1`; observed: `PASS src/components/shared/Map.module.css: 2 finding(s) before, 0 after` |
| C24 | FACT | Removing the stale marker clears the input-chrome finding. | source: `docs/sessions/evidence/task937/design/p02-design-token-fix-probe.txt:7-7`; observed: `PASS src/design-system/mantine/input-chrome.css: 1 finding(s) before, 0 after` |
| C25 | FACT | The theme icon size clears the e-mail view finding. | source: `docs/sessions/evidence/task937/design/p02-design-token-fix-probe.txt:12-12`; observed: `PASS src/modules/cabinet/components/CabinetEmailChangeSectionView.tsx: 1 finding(s) before, 0 after` |
| C26 | FACT | The gallery style object adds no design-token finding. | source: `docs/sessions/evidence/task937/design/p02-design-token-fix-probe.txt:17-17`; observed: `PASS src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx: 0 finding(s) before, 0 after` |
| C27 | FACT | The four UI files are in the reviewed Task 923 D8/D9 scope (executed probe). | source: `docs/sessions/evidence/task937/design/p01-reviewed-scope-membership.txt:6-10`; observed: `IN SCOPE  src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx` |
| C28 | FACT | The gate data and evidence files are outside that scope. | source: `docs/sessions/evidence/task937/design/p01-reviewed-scope-membership.txt:2-7`; observed: `outside   scripts/mojibake-allowlist.json` |
| C29 | FACT | The three UI receipts of §6 let the real write hook allow the four UI edits and are refused without them. | source: `docs/sessions/evidence/task937/design/p05-receipt-blackbox.txt:13-13`; observed: `RECEIPT BLACK-BOX PASSED` |
| C30 | FACT | The resend action refuses an anonymous caller. | source: `src/modules/cabinet/actions/index.ts:563-563`; observed: `if (!userId) return { error: 'Unauthorized' }` |
| C31 | FACT | The resend action retires only the session user's earlier links. | source: `src/modules/cabinet/actions/index.ts:592-592`; observed: `.eq('user_id', userId)` |
| C32 | FACT | The Governance Check job ran 51 static gates with 5 failures. | source: `docs/sessions/evidence/task937/design/l00-ci-excerpts.txt:32-32`; observed: `static: 46/51 gates passed; 5 failed.` |
| C33 | FACT | The e-mail section view is presentational. | source: `docs/sessions/evidence/task937/design/sources/src__modules__cabinet__components__CabinetEmailChangeSectionView.tsx.txt:35-35`; observed: `No hooks besides` |
| C34 | FACT | The reviewed Task 931 revision 3 and Task 935 contracts scope the 923 D8/D9 contract file that R12 writes (executed probe). | source: `docs/sessions/evidence/task937/design/p10-change-set-bindings.txt:6-21`; observed: `scopes written contract tasks/Sprints/Sprint_78_Task_923_security_record_D8_D9.security.json` |
| C35 | FACT | Apart from the 923 D8/D9 scope, the change set is bound only through the planted-break file (executed probe). | source: `docs/sessions/evidence/task937/design/p10-change-set-bindings.txt:8-19`; observed: `binds scope src/modules/cabinet/actions/index.ts` |
| C36 | FACT | Task 931 revision 3 adds a guard test against hand-written query doubles in every unit test file. | source: `tasks/Sprints/Sprint_92_kickoff_prompt_Task_931_Full_Unit_Suite_Green_Again.md:163-163`; observed: `queryDoubles.guard.test.ts` |
| C37 | FACT | Task 943 R11 adds a release check for reviewed contracts outside the diff. | source: `tasks/Sprints/Sprint_92_kickoff_prompt_Task_943_File_Mutating_Commands_Are_Writes.md:308-308`; observed: `reviewedFreshnessErrors(root, selected, { files, readBase })` |
| D7 | OWNER DECISION | Every CI fix is committed on task/935-governance-approval-route and published in PR #12. | owner: 2026-11-01; decision: `Everything in PR #12 (Recommended)` |
| D8 | OWNER DECISION | Each red CI check gets its own task. | owner: 2026-11-01; decision: `A separate task for each check (Recommended)` |
| D9 | OWNER DECISION | A later independently reviewed contract may rebase a pinned reviewed contract for its non-test scope files (Task 940). | owner: 2026-11-01; decision: `Governance task: audited rebase (Recommended)` |

## Mobile adaptation record
- Scope: none

## 4. Scope and out of scope

The final diff changes exactly: deletes `docs/sessions/evidence/task923/review-67/rv67-46-squash-paths.nul`; adds one path to
`scripts/mojibake-allowlist.json`; repairs `docs/sessions/evidence/task927/base/unit-base-failures.txt`; edits
`src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx`, `scripts/enrolled-tailwind-baseline.json` (through the
update command only), `src/components/shared/Map.module.css`, `src/design-system/mantine/input-chrome.css`,
`src/modules/cabinet/components/CabinetEmailChangeSectionView.tsx`; adds
`src/modules/cabinet/components/__tests__/CabinetEmailChangeSectionView.security.test.tsx` and
`src/modules/cabinet/actions/__tests__/resendEmailVerification.security.test.ts`; the stage/report fields of this task's sidecar;
evidence under `docs/sessions/evidence/task937/impl/` and `docs/sessions/evidence/task937/security/`. Edited only temporarily for
the planted breaks of R10 and restored byte-for-byte: `src/modules/cabinet/actions/index.ts` and the e-mail section view. Written
by the reviewer only (R12): `review.rebases` entries of `tasks/Sprints/Sprint_78_Task_923_security_record_D8_D9.security.json`,
`tasks/Sprints/Sprint_92_kickoff_prompt_Task_931_Full_Unit_Suite_Green_Again.security.json` and
`tasks/Archive/Sprint_92_kickoff_prompt_Task_935_Governance_Changes_Get_An_Independent_Approval.security.json`, with their evidence.
The sidecar scope lists the 923 contract file only so that this contract can approve the 931 and 935 entries; the executor never
writes it.

Out of scope: `scripts/check-listing-visibility.mjs` and every other gate script (Task 942; policy paths); any rendered change;
other gallery debt (Task 794); the untracked `.nul` and `.DS_Store` files of other sessions' local evidence (never staged); the
other red jobs (Tasks 931, 938, 939).

## 5. Current and required behaviour

Preserved: every rendered value (the frame clips, the icon is 20px, the map control line height and the link-editor section offset
are unchanged); the text of both evidence files apart from the two repaired sequences; the history the `.txt` twin of the deleted
pathspec keeps. Required: `check:file-integrity:all`, `check:mojibake`, `check:enrolled-tailwind` and `check:design-tokens:strict`
report nothing for tracked files.

## Requirements

| ID | Observable requirement | P | AC |
|---|---|---|---|
| R1 [C1; C2; C3] | **NUL pathspec.** Delete the tracked `rv67-46-squash-paths.nul`; its `.txt` twin stays as the record of the same list. | P1 | AC1 |
| R2 [C4; C5; C7; C8] | **Mojibake transcript.** Add `docs/sessions/evidence/task923/r33-13a-mojibake.txt` to `scripts/mojibake-allowlist.json` (one exact path, no glob). | P1 | AC1 |
| R3 [C6; C9; C10] | **Task 927 listing.** Replace every `U+00E2 U+20AC U+201D` with `—` and every `U+00E2 U+2020 U+2019` with `→`, nothing else (BOM and ASCII unchanged); the before/after hashes and census equal those of `p03-mojibake-repair-probe.txt`. | P1 | AC1 |
| R4 [C11; C12; C13; C14; C15; C26] | **Gallery frame.** Line 98 becomes `className="h-full w-full" style={{ overflow: 'clip' }}` and the R33 comment above it names the style object instead of the utility; then `npm run check:enrolled-tailwind:update-baseline` lowers `overflow-hidden` to 1 and records nothing else. | P1 | AC1, AC5 |
| R5 [C16; C17; C19; C23] | **Map marker.** The marker separator of `Map.module.css:37` becomes the em dash. | P1 | AC1 |
| R6 [C18; C24] | **Input-chrome marker.** The stale marker of `input-chrome.css:476` is removed; the comment keeps its reason ("the 1px border of the field") without the marker. | P1 | AC1 |
| R7 [C20; C21; C22; C25; C33] | **E-mail section icon.** `size={20}` becomes `size={theme.other!.iconSize!.roomy}` with `import { theme } from '@/design-system/mantine/theme'` (no hook, as in C22). | P1 | AC1, AC5 |
| R8 [C20; C33] | **Frontend security tests** in `CabinetEmailChangeSectionView.security.test.tsx` on the real view inside `MantineProvider` with the project theme and real messages. | P1 | AC2 |
| R9 [C30; C31] | **Server security tests** in `resendEmailVerification.security.test.ts` on the real `resendEmailVerification`; `createAdminClient` returns the client of `createFakeDb` (`src/tests/fakeSupabase.ts`) seeded with an active link of the session user and one of another user, whose link stays unchanged; explicit doubles only at `resolveAuthUser`, the hourly request counter and the mail sender; no hand-written query double, so the Task 931 revision 3 guard passes for this file (C36). | P1 | AC2 |
| R10 [C30; C31; C33] | **Planted breaks**, one at a time, then restored: P1 the view's resend action ignores `sending` → SEC-937-FE-RESEND-DENY fails; P2 the resend retire step drops `.eq('user_id', userId)` → SEC-937-SRV-RESEND-ALLOW fails; P3 the resend action drops its `if (!userId)` guard → SEC-937-SRV-RESEND-DENY fails. Each with the failed assertion and `git diff --exit-code -- <file>` exit 0 after restore. | P1 | AC3 |
| R11 [C14; C21] | **Rendered no-change proof.** On `npm run build-storybook`: in `Patterns/Mantine/ListingGalleryPattern` Default at 320, 375 and 639 the mobile frame's computed `overflow-x` and `overflow-y` are `clip` and its class list has no `overflow-clip`; in the CabinetEmailChangeSectionView Story with a pending address, the alert icon's SVG is 20×20 at 320 and 1280. | P1 | AC4 |
| R12 [C27; C34; C35; C37; D9] | **Rebases (reviewer), in order, after approving 937.** (a) A `scope` entry by this contract appended to the 923 D8/D9 `review.rebases`, evidence `docs/sessions/evidence/task937/review/scope-rebase-923.md` listing the four UI files; (b) a `scope` entry by this contract appended to the `review.rebases` of `tasks/Sprints/Sprint_92_kickoff_prompt_Task_931_Full_Unit_Suite_Green_Again.security.json`, evidence `docs/sessions/evidence/task937/review/scope-rebase-931.md`, and (c) the same on the 935 contract, evidence `docs/sessions/evidence/task937/review/scope-rebase-935.md`, each listing `tasks/Sprints/Sprint_78_Task_923_security_record_D8_D9.security.json`; every new entry continues the last entry of its chain present at that moment (the Task 931 revision 3 and Task 943 entries among them), with `rebasedScopeSha256` the digest after (a); (d) the planted-break file `src/modules/cabinet/actions/index.ts` has no diff; (e) rerun this task's report harness, since its scope digest covers the 923 contract file; (f) only then the review block; (g) the scoped `validateDiff` harness of Task 940 AC7 (phase `release`, base `origin/main`, working tree) reports no error for the 923 D8/D9, 931, 935 and 937 contracts and `reviewedFreshnessErrors` (C37) returns `[]`. | P1 | AC6 |

## Acceptance criteria

- **AC1 [R1–R7].** `npm run check:file-integrity:all` lists no tracked file; `npm run check:mojibake` lists neither file of C5/C6 and no other tracked file; `npm run check:enrolled-tailwind` and `npm run check:enrolled-tailwind:verify` exit 0; `npm run check:design-tokens:strict` exits 0. Each output is saved under `docs/sessions/evidence/task937/impl/`, with untracked offenders of other sessions named as such.
- **AC2 [R8; R9].** SEC-937-FE-PENDING-ALLOW, SEC-937-FE-RESEND-DENY, SEC-937-FE-ERROR, SEC-937-SRV-RESEND-ALLOW, SEC-937-SRV-RESEND-DENY and SEC-937-SRV-RESEND-ERROR pass; `npx vitest run` on the two new files reports 0 failed and 0 skipped.
- **AC3 [R10].** Three planted-break transcripts under `docs/sessions/evidence/task937/impl/sensitivity/`, each failing with an assertion and passing after restore.
- **AC4 [R11].** The R11 probe transcript shows `clip`/`clip`, no `overflow-clip` class, and a 20×20 icon at the named widths.
- **AC5 [R4; R7].** `git diff` of the gallery shows only line 98 and its comment; of the e-mail view only the import and the icon size; the baseline diff only lowers `overflow-hidden` to 1.
- **AC6 [R1–R12].** Full suite `npm test -- --allowOnly=false --passWithNoTests=false --retry=0 --reporter=default --reporter=json --outputFile=test-results/unit.json` then `node scripts/workflow-gates/cli.mjs unit-report` exit 0 with 0 failed (Task 931 revision 3 is reviewed before this task starts, so no known failure remains; any failing test is reported `BLOCKED`, never named and passed over); `npm run typecheck` exits 0; `npx eslint` on the changed TS/TSX files exits 0; `npm run check:ui-contract` exits 0; `npm run build` exits 0; the report harness writes `docs/sessions/evidence/task937/security/report.json` and `node scripts/workflow-gates/cli.mjs verify --contract <this sidecar>` exits 0 at stage implemented; the guard test `src/tests/__tests__/queryDoubles.guard.test.ts` of Task 931 revision 3 passes. Reviewer, after R12: every check of R12 (g) passes and `cli.mjs verify` of this sidecar exits 0; after Task 942 and the owner's push, `node scripts/workflow-gates/ci-status.mjs --pr 12` shows the Governance Check job green on the pushed SHA (until then the decision is `PARTIALLY VERIFIED`).

## Security test contract

| Field | Content |
|---|---|
| Assets and boundaries | The cabinet e-mail change section view (`CabinetEmailChangeSectionView`, its pending alert, resend action and error alert) and the server action behind its resend (`resendEmailVerification`, `src/modules/cabinet/actions/index.ts`) with its session, admin-client, hourly-limit and mail boundaries. |
| Frontend security | Real view: a pending address appears only in the info alert, with the theme icon, and resend calls the handler once (SEC-937-FE-PENDING-ALLOW); while sending the resend action is disabled and a click calls nothing (SEC-937-FE-RESEND-DENY); a refusal renders as `role="alert"` with exactly the container's text (SEC-937-FE-ERROR). |
| Server security | Real action: a signed-in user with an active link retires only their own links and gets one new token (SEC-937-SRV-RESEND-ALLOW); an anonymous caller is refused before any database client (SEC-937-SRV-RESEND-DENY); a failed retire step stores no token and sends no mail (SEC-937-SRV-RESEND-ERROR). |
| Database/integrations | No runtime, SQL or provider change; the real e-mail change boundaries stay mapped by the reviewed Task 923 D8/D9 contract, whose cases CI reruns. This task adds no critical case. |
| Cases | The six SEC-937 cases of the sidecar; full names are `<describe> <it>` with the `[ID]` at the start of the `it` title. |
| Fixtures and environment | In-memory doubles, synthetic ids (`user-937`, `pending-937@example.test`), no network, no credentials, unit project only; no database rows. |
| Sensitivity proof | The three planted breaks of R10 with restoration proof (AC3). |
| Execution | Report harness `docs/sessions/evidence/task937/security/report.mjs` modelled on `docs/sessions/evidence/task923/security/owner-fixes-report.mjs`, then `node scripts/workflow-gates/cli.mjs verify --contract tasks/Sprints/Sprint_92_kickoff_prompt_Task_937_Governance_Check_Product_Findings.security.json`; native Windows, Node 22.22.3; QA Q1. |

## 6. Ordered route

1. **Owner** (separate PowerShell window, `C:\Claude_Code_Projects\lero-al`): commit this kickoff set on
   `task/935-governance-approval-route` with the command Opus gives (D7).
2. **Sonnet, fresh session**, only after Task 931 revision 3 and Task 943 are reviewed and committed:
   `node scripts/workflow-gates/cli.mjs receipt --contract <this sidecar>`; save the before runs of the four
   gates of AC1 to `docs/sessions/evidence/task937/impl/before/`.
3. R1, R2, R3 (with the before/after hash and census check).
4. Before the first UI edit, register these three receipts exactly, each through the PowerShell tool as the only statement of its
   command (validated against the real hook, C29):
   - `& .\.claude\hooks\emit-phase-receipt.ps1 -Kind CanonicalReuse -Receipt 'GR-0 CANONICAL REUSE PREFLIGHT - request: Task 937 governance findings on four UI files with no rendered change; semantic queries: theme iconSize roomy, overflow clip frame, design-tokens-allow marker, Leaflet control line height; inspected candidates: src/design-system/mantine/theme.ts, src/modules/listings/components/ListingStatusBanner.tsx, src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx; decision: REUSE; selected canonical owner: src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx; Mantine/TailAdmin token path: src/design-system/mantine/theme.ts other.iconSize.roomy; new hardcoded visual values: NONE; rationale: each edit keeps the rendered value and moves it onto the existing token, style object or marker form the gates require.'`
   - `& .\.claude\hooks\emit-phase-receipt.ps1 -Kind UiContract -Receipt 'UI CONTRACT PREFLIGHT COMPLETE - scope: src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx, src/components/shared/Map.module.css, src/design-system/mantine/input-chrome.css, src/modules/cabinet/components/CabinetEmailChangeSectionView.tsx (no rendered change); canonical owner: src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx; token owner: src/design-system/mantine/theme.ts; direct Story: src/stories/patterns/mantine/ListingGalleryPattern.stories.tsx.'`
   - `& .\.claude\hooks\emit-phase-receipt.ps1 -Kind MobileAdaptation -Receipt 'MOBILE ADAPTATION PREFLIGHT COMPLETE - surfaces: src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx mobile photo frame; component families: media-gallery-and-listing-contact; pattern IDs: grid-media-reflow, inline-control; standards: w3c-reflow, apple-hig-layout, android-common-layouts, android-adapt-layouts, w3c-target-size, apple-hig-menus, android-layout-navigation; mantine mechanism: responsive-props; mantine owner: src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx; mobile range: <640px (theme.other.mobileGate / sm); mobile order: unchanged, one photo per swipe in a clipped frame, then the thumbnails; required content: no semantic loss; verification: src/stories/patterns/mantine/ListingGalleryPattern.stories.tsx Default across actual <640px thresholds 320, 375, 639 and the 640px transition x sq,en,uk,it.'`
5. R4 (edit, then the update command), R5, R6, R7; then R8 and R9.
6. R10: three planted breaks with transcripts and restoration proof.
7. R11 on a fresh Storybook build.
8. The report harness and `cli.mjs verify`; every AC command; set stage `implemented`; write
   `docs/sessions/evidence/task937/impl/completion-report.md`; end with `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. No Git command
   (the owner's commit stages the deletion of R1 by its explicit path).
9. **Opus reviewer:** review; on approval, stage `reviewed`, then R12 (a)-(g) in that order (the review block is written at (f));
   the explicit-path commit command and the branch push.

## 7. Completion report

Per requirement: changed files, evidence, status; each SEC-937 case with its result; the three planted-break transcripts; the four
gate outputs before and after; the R3 hashes; the R11 transcript; one of `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`,
`PARTIALLY IMPLEMENTED` or `BLOCKED`.

## 8. Rule compliance

| Rule | How this kickoff complies |
|---|---|
| `claim-evidence-contract.md` | Every R cites ledger rows from retained snapshots, CI excerpts and executed probes under `docs/sessions/evidence/task937/design/`. |
| `security-testing.md` | Frontend and server allow/deny/error on the changed view and its server action; planted breaks. |
| `canonical-component-reuse.md`, `ui-token-contract.md` | REUSE: the existing theme role, the existing style-object form, the marker form the parser reads; no new value. |
| `mobile-adaptation-contract.md` | No rendered change: `Scope: none`, proven by R11. |
| `role-boundaries.md` | Sonnet implements product and data files; the policy gate change is Task 942 (Opus); Opus reviews and writes the 923 rebase. |
| `git-publication.md` | Commit on PR #12's branch (D7); push only after approval; merge only after green checks. |

KICKOFF EVIDENCE PREFLIGHT COMPLETE — claims: C1, C2, C3, C4, C5, C6, C7, C8, C9, C10, C11, C12, C13, C14, C15, C16, C17, C18, C19, C20, C21, C22, C23, C24, C25, C26, C27, C28, C29, C30, C31, C32, C33, C34, C35, C36, C37; owner decisions: D7, D8, D9; blocked claims: NONE.
