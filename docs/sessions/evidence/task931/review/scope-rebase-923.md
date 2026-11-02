# Task 923 D8/D9 contract — scope rebase by Task 931 (Task 931 R10 (b), owner decision D9, 2026-11-01)

Written by the Task 931 reviewer (Opus), after the Task 931 approval and stage `reviewed`, never by the Task 931
implementer (Sonnet). This session wrote none of the files listed below.

- Rebased contract: `tasks/Sprints/Sprint_78_Task_923_security_record_D8_D9.security.json` (kind `product`, stage
  `reviewed`, review `APPROVED WITH NOTES`, evidence `docs/sessions/evidence/task923/review-67/rv67-10-review-decision.md`;
  its chain holds the legacy `rulesRebase` by Task 935, rebased digest
  `a46e25d54ad70b4daedae8ddde0c4c31daf638b73a1a012092e9e5e1faf61302`).
- Approving contract (`by`): `tasks/Archive/Sprint_92_kickoff_prompt_Task_931_Full_Unit_Suite_Green_Again.security.json`
  (kind `product`, stage `reviewed`, review `APPROVED WITH NOTES`, archived at closure); its scope lists every file below.
- Anchor: `HEAD` = `8ec8096f312fd2153d797da3f5c2654d74c09ba1`; the three files are uncommitted Task 931 edits.
- Why: Task 931 moved these tests onto the code Task 923 shipped (kickoff C25, R4, R5, R7). None is a test file of a 923
  case and none is a runtime file.

## Changed scope files
- `src/lib/auth/__tests__/permissions.test.ts`
- `src/modules/admin/actions/__tests__/getModeratorPermissions.smoke.test.ts`
- `src/modules/cabinet/statistics/__tests__/access.test.ts`

## Verification (native Windows, Node v22.22.3, read-only)

- `node docs/sessions/evidence/task931/review/r10-harness.mjs HEAD <origin/main> <931 contract>` before any R10 write
  (`r10-00-before.txt`): the 923 scope digest with the `HEAD` contents of the three files equals the last recorded digest
  `a46e25d54ad70b4daedae8ddde0c4c31daf638b73a1a012092e9e5e1faf61302` (EQUALS LAST RECORDED); all three changed since
  `HEAD`; current digest `05f4c95126b3e67d05ecc8bbecac0121e71cdd98bd4a4a0cd39c8fba6f0f3b47`.
- `docs/sessions/evidence/task931/review/r1-scope-owners.mjs`: none of the three is a 923 case test file.
- The 923 case tests were not changed by Task 931. The full unit suite passes on the candidate (5931 of 5931, exit 0).
