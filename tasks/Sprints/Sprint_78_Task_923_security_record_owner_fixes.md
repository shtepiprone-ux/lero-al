# Security task record — Task 923 Revision 8: the owner-directed fixes (D14) and the 640px work (D15, D24, R39)

> **Status: written by Opus, review 8 of Task 923 (2026-10-18); stage `planned`.** It is the second security record of Task 923
> Revision 8 (kickoff §17, R38 and R39, `tasks/Sprints/Sprint_78_kickoff_prompt_Task_923_Rendered_State_Census_Gate.md`) and is NOT a
> kickoff: no number is reserved. The invariants, scope and applicability below are Opus's; Sonnet changes only the stage and report
> metadata from here on. The first record (`Sprint_78_Task_923_security_record_D8_D9.md`) keeps the D6–D9 package.

## Owner decisions (verbatim)

- **D14 (2026-10-17).** *"це я давав вказівки Sonnet під час виконання задачі"* — the S1–S58 fixes and the coverage edits of
  `Header.tsx`, `Footer.tsx` and `ResetPasswordClient.tsx`.
- **D15 (2026-10-17).** *"це я їй сказав змінити, бо були коментарі що компоненти перемикаються на мобільний вигляд після 768px, що невірно"*.
- **D24 (2026-10-17).** *"Таблиці теж з 640px"* — tables become cards only below 640px (`docs/mantine-responsive-design-system.md` §7.3).

## What the evidence shows (design inputs)

- The findings log `docs/sessions/evidence/task923/r8-152-security-findings.md` marks S15–S18, S20–S22 `Closed`, 26 findings `FIXED`
  (S27–S30, S33–S39, S41–S46, S48–S50, S52–S54, S56, S58, S68) and S55 / S57 partly fixed; the eleven closure notes of S11…S1 stand in
  its line 1, without their IDs, in that order (each text names its own finding's subject). Owner-only or recommendation rows are not
  fixes and are not cases here: S12–S14, S19, S23–S26, S31, S32, S40, S47, S51, S59–S66 (S59–S62 are R37's).
- The product write scope is derived from evidence by `docs/sessions/evidence/task923/design-r8/owner-fixes-scope.mjs`
  (`owner-fixes-scope.json`): files a closed finding names and the tree changed, files the executor's mutation harness breaks in the
  security groups sec2–sec26 and the tree changed, the three coverage files of the session log, and the R39 sites. A path the executor
  changed for D14 or D15 that is not in this scope is reported by R38 step 1, and Opus amends the contract before any further step.
  Review 9 (2026-10-18, kickoff §18.2, R47 / D36) adds the five files R39 and R47 change besides the sites: `belowMobileGate.test.ts`,
  `MantineDataTableToCards.switch.test.tsx`, `AdminTable.adapter.test.tsx`, `Table.stories.tsx` and `AdminListingsView.stories.tsx`.
  Review 10 (2026-10-19, kickoff §19.2, R48) adds `MantineDrawer.tsx`, the new `MantineDrawer.presentation.test.tsx` and
  `filtersRangeDatePicker.smoke.test.tsx`: the filter panel's close icon and Apply button are mounted by `MantineDrawer`'s presentation
  instead of a feature media query, because a CSS-hidden control escapes Mantine's focus trap.
- R39 changes breakpoints and the Mantine switch mechanism only; it changes no data, permission or request. Its correctness is proved by
  the kickoff's UI evidence (table fit, census, owner matrix), not by a security case of its own.

## Security test contract

| Field | Content |
|---|---|
| Assets and boundaries | Server Actions and route handlers of the closed findings (notifications, recovery, uploads, auth callback / confirm, companies, admin actions, cabinet, contacts, listings, collections, captcha, cron, e-mail rendering and sending, Cloudinary clean-up, Sentry scrubbing); their consumers `FooterView`, `AdminUserProfileView`, `ResetPasswordClient`; Supabase Auth and the service-role client; the build's Server Action manifest. |
| Frontend security | Real `FooterView` (a stored link with an unsafe scheme is not rendered as a link) and real `ResetPasswordClient` (a password that breaks the rules does not spend the one-time recovery token). Cases SEC-S09-FE-*, SEC-RP-FE-ERR. Real `ListingsFilters` in real `MantineDrawer` (R48): in the compact sheet Apply only closes the panel and navigates nowhere; elsewhere no close or Apply control is in the DOM. Cases SEC-R48-FE-ALLOW / -DENY. R48 changes no request or server path, so it adds no server case. |
| Server security | The real actions, routes and helpers of each closed finding with explicit I/O doubles; one deny case per closed finding, allow and error cases where the fix has a legitimate path or a failure answer. Cases SEC-S<nn>-SRV-*. |
| Database/integrations | Real boundary for the four critical findings: the production build's Server Action manifest (S1, S28), and real Auth plus the approved development database with synthetic `zz_synth_` rows (S16, S44). No SQL is in this scope. |
| Cases | The table below; stable IDs; each test is a top-level `it` / `test` whose full name is exactly the `testName` of the contract. |
| Fixtures and environment | Unit suites: in-memory doubles, synthetic ids, no network, no credential. Integration suites: the D8/D9 record's environment (`SECURITY_TEST_TARGET=development`, `SECURITY_TEST_PROJECT_REF`, verified clean-up); the manifest suite reads `.next/server/server-reference-manifest.json` of a fresh `npm run build`, fails when it is absent, reads only its `node` and `edge` maps (`filename`, `exportedName`) and never prints or stores its `encryptionKey`. A build of 2026-10-16, before the S28 fix, still lists `exportedName: applyListingTransitionByStatus` there (`docs/sessions/evidence/task923/design-r8/next-action-manifest.txt`), so the check is real. |
| Sensitivity proof | For each critical case one named mutation in `docs/sessions/evidence/task923/security/owner-fixes-sensitivity.mjs` (new, same form as `sensitivity.mjs`): baseline pass, intended assertion failure, restored pass, artifact hashed into the report. |
| Execution | `node scripts/workflow-gates/cli.mjs plan --contract tasks/Sprints/Sprint_78_Task_923_security_record_owner_fixes.security.json`, then `verify`; QA profile Q4. |

### Cases

The machine list is the adjacent `…owner_fixes.security.json`; this record names the groups. Critical cases (real-boundary allow and
deny with the same invariant): SEC-S01, SEC-S16, SEC-S28, SEC-S44. Frontend: SEC-S09-FE-ALLOW / -DENY / -ERR (`FooterView`),
SEC-RP-FE-ERR (`ResetPasswordClient`), SEC-R48-FE-ALLOW / -DENY (`ListingsFilters` in `MantineDrawer`). Server deny, one per closed finding: S1–S11, S15–S18, S20–S22, S27–S30, S33–S39, S41–S46,
S48–S50, S52–S58. Server allow / error: SEC-S16-SRV-ALLOW, SEC-S20-SRV-ALLOW, SEC-S27-SRV-ALLOW, SEC-S17-SRV-ERR, SEC-S56-SRV-ERR.
