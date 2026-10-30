# rv67-10: Opus's independent review decision for the D8_D9 security contract of Task 923 (Review 67, 2026-10-29)

This file is the `review.evidence` of the contract below. Its sha256 is bound in the contract's `review` object, so it does not change after the binding.

## Contract
- `tasks/Sprints/Sprint_78_Task_923_security_record_D8_D9.security.json`: 231 cases, 67 critical, 598 paths.
- The owner-fixes and Task 927 contracts keep the `reviewed` binding of `review-65/rv65-10-review-decision.md`. No path in their scopes changed, and both reports are current (`rv67-05-reports.txt`).

## Decision: APPROVED WITH NOTES
Revision 59 (R177, R178, AC159; kickoff §86) was reviewed independently, on top of Reviews 65 and 66 for the rest of the contract.
- **Candidate.** The working tree on `29acfb269`. The 11 paths of `revision-59/r59-00b-hashes-after.txt` equal the current files (`rv67-05-reports.txt`).
- **Diff.** With R177 (a)–(c) undone, the container and the smoke test equal `r59-00`'s before hashes. Revision 59 changed exactly R177's lines (`rv67-01-diff-is-r177.txt`).
- **Source.** `FIELD_OPTIONS.locationId` is `{ shouldDirty: true, shouldValidate: true }`, so a city-only change makes the form dirty and enables Save. Choosing the stored city again makes it clean, as React Hook Form compares with the default values.
- **Assertions.**
  - T12 asserts that Save is enabled after a city-only change, and that `updateUserProfileFull` receives `locationId: 3` with the unchanged names.
  - T12b asserts that Save is disabled again after the stored city is chosen.
  - P7 (`revision-59/r59-02-planted-break-p7.txt`): with the old line, both tests fail at `expect(save()).not.toBeDisabled()` and 13 pass. After the restore the sha256 equals the post-(a) one and all 15 pass.
- **Opus's own runs on the candidate:**
  - R177 (d): 15 of 15 (`rv67-02-focused.txt`).
  - Full unit: 5922 tests. Exactly the 17 IDs of `review-62/rv62-11-unit-compare.txt` fail, and T11, T12, T12b and the R175 tests pass (`rv67-04-unit-meta.txt`, `rv67-08-unit-compare.txt`).
  - Integration: 96 of 96 (`rv67-07-integration.txt`).
  - typecheck and eslint `--quiet` exit 0 (`rv67-06-typecheck-eslint.txt`).
  - `verify` exits 0 on all three contracts, with the dev server off (`rv67-03-verify.txt`).
  - The build is Sonnet's (`revision-59/r59-03-report-and-verify.txt`, exit 0). `.next/BUILD_ID` (21:11:15) is newer than every file under `src/`.
- **Report.** `d8-d9-report.json` passed and is current: 231 of 231 cases, sensitivity proved for 67 of 67 critical cases, cleanup verified, scope hash equal, no `validateReport` issues (`rv67-05-reports.txt`).
- **Release blockers.** S59–S62 PASS (`rv67-05-reports.txt`).

## Notes
1. Sonnet's deviation: no GR-7 audit. Accepted: form state only, and the view, its Story and the look do not change (§86.3).
2. Sonnet took the dev-server counts once, before the build. Opus's counts before its own runs were 0 and 0.
3. The "use main phone" box has F35's pattern (`useMainPhone: {}`). It is out of scope unless the owner asks.
4. The owner's checks are still to run before the push: §86.2's city checks and §80.2's CMS images. If one fails, the affected contract is reopened.
5. The 17 known unit failures are the unchanged files of `fr-29`, outside this task's changes.
