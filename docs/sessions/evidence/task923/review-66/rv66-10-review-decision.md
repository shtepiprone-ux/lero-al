# rv66-10: Opus's independent review decision for the D8_D9 security contract of Task 923 (Review 66, 2026-10-29)

This file is the `review.evidence` of the contract below. Its sha256 is bound in the contract's `review` object, so it does not change after the binding.

## Contract
- `tasks/Sprints/Sprint_78_Task_923_security_record_D8_D9.security.json`: 231 cases, 67 critical, 598 paths.
- The owner-fixes and Task 927 contracts keep the `reviewed` binding of `review-65/rv65-10-review-decision.md`. No path in their scopes changed, and both reports are current (`rv66-02-reports.txt`).

## Decision: APPROVED WITH NOTES
Revision 58 (R175, R176, AC158; kickoff §85) was reviewed independently, on top of Review 65's decision for the rest of the contract.
- **Candidate.** The working tree on `e84ad9616`. The 13 paths of `revision-58/r58-00b-hashes-after.txt` equal the current files (`rv66-02-reports.txt`).
- **Source.**
  - `src/modules/admin/lib/userLocation.ts` follows R175 (a).
  - `src/app/admin/users/[id]/page.tsx` changes only the import (line 11) and the `user` prop (line 98), and makes no new query.
  - The profile's save path sends explicit fields (`updateUserProfileFull(user.id, { … locationId … })`), so the added `location` object is never written. After a save, `router.refresh()` reruns the page, so the city shown follows the stored one.
- **Assertions.**
  - `[SEC-X-SRV-ADMIN-USER-PRESENT]` asserts that the profile receives the row together with `location { id: 151, … parent: null }`. The page of `HEAD`, which passes `user={user}`, has no `location` and fails this `toEqual`.
  - `userLocation.test.ts` covers the city with a region, the city without one, a region missing from the list, and null, undefined or an unknown id.
  - T11 covers the view.
- **Opus's own runs on the candidate:**
  - R175 (f): 3 files, 21 tests passed (`rv66-01-focused.txt`).
  - Full unit: 5920 tests. Exactly the 17 IDs of `review-62/rv62-11-unit-compare.txt` fail, with no extra and none missing, and the 9 R175 tests pass (`rv66-03-unit-meta.txt`, `rv66-05-unit-compare.txt`).
  - Integration: 96 of 96 (`rv66-06-integration.txt`).
  - typecheck and eslint `--quiet` exit 0 (`rv66-04-typecheck-eslint.txt`).
  - `verify` exits 0 on all three contracts (`rv66-07-verify.txt`).
  - The build is Sonnet's (`revision-58/r58-03-final-candidate.txt`, exit 0). `.next/BUILD_ID` (19:08:04) is newer than every file of the revision, and no file under `src/` is newer than it.
- **Report.** `d8-d9-report.json` passed and is current: 231 of 231 cases, sensitivity proved for 67 of 67 critical cases, cleanup verified, scope hash equal, no `validateReport` issues (`rv66-02-reports.txt`).
- **Release blockers.** S59–S62 still PASS (`rv66-02-reports.txt`).

## Notes
1. Sonnet's deviation 1: owner-fixes' first `verify` failed on a development compile in `.next`. The cause is the environment; after the build it passed, and it passed again in Opus's run.
2. Sonnet's deviation 5: the total 5920 is Review 64's 5915 (`review-64/rv64-11-unit-compare.txt`) plus the 5 new tests of R175. The 2 tests Sonnet could not place are R172's, counted from Review 64 on.
3. Sonnet's deviation 2: no GR-7 audit. Accepted: the change passes data to the existing view, and the view, its Story and the look do not change (§85.3).
4. The owner's checks are still to run before the push: §85.2's city on the profile and §80.2's CMS images. If one fails, the affected contract is reopened.
5. The 17 known unit failures are the unchanged files of `fr-29`, outside this task's changes.
