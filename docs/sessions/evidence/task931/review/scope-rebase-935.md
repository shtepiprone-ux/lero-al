# Task 935 contract — scope rebase by Task 931 (Task 931 R10 (c), owner decision D9, 2026-11-01)

Written by the Task 931 reviewer (Opus), after the Task 923 entry of R10 (b), never by an implementer. Task 931 is a
product task; this entry approves no governance change: the only listed file is the Task 923 contract, written by this
reviewer in R10 (b) as `docs/sessions/evidence/task931/review/scope-rebase-923.md` records.

- Rebased contract: `tasks/Archive/Sprint_92_kickoff_prompt_Task_935_Governance_Changes_Get_An_Independent_Approval.security.json`
  (kind `governance`, stage `reviewed`, review `APPROVED WITH NOTES`, evidence
  `docs/sessions/evidence/task935/review/review-935.md`); the last entry of its chain at this moment is the Task 940
  entry, rebased digest `a3fb3748747e9ae60e4bce1f9365c9bcdf818c052214fceeb77cee41f1637349` (no Task 941 entry exists yet).
- Approving contract (`by`): `tasks/Archive/Sprint_92_kickoff_prompt_Task_931_Full_Unit_Suite_Green_Again.security.json`
  (kind `product`, stage `reviewed`, review `APPROVED WITH NOTES`); its scope lists the file below (kickoff C28).
- Anchor: `HEAD` = `8ec8096f312fd2153d797da3f5c2654d74c09ba1`.
- Why: the 935 scope lists the 923 contract file, which is no 935 case test and no runtime file (kickoff C26, C27).

## Changed scope files
- `tasks/Sprints/Sprint_78_Task_923_security_record_D8_D9.security.json`

## Verification (native Windows, Node v22.22.3, read-only)

- Before any R10 write (`r10-00-before.txt`): the 935 scope digest equals the last recorded digest
  `a3fb3748747e9ae60e4bce1f9365c9bcdf818c052214fceeb77cee41f1637349`; the 923 contract file was unchanged since `HEAD`.
- After R10 (b): the 923 chain validates (`rebaseChainErrors` `[]`); the 935 scope digest is
  `9cc079cb216857dfe6a1d535f88f2c88ace4c5653557385a7f6400347c9eb34a`; the only 935 digest input changed since `HEAD` is the
  file listed above (`r10-01-after.txt`).
- The 935 contract is absent at `origin/main`, so the CI diff check skips the base anchor for this entry (Task 940 R4 (e));
  the anchor check above is the approver's substitute.
