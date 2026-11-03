# Task 941 — independent governance review 3 (Opus approver, D2, 2026-11-03)

Decision: **APPROVED WITH NOTES** (P3 notes only; no P0–P2 finding in Task 941).

## Independence

This session is a fresh Opus session. It designed none of the kickoff, revision 1 or revision 2 (review 1 and review 2
sessions), implemented none of 941 and took no part in Task 940. It read every scope file only with the Read and Grep tools
and read-only shell commands; it wrote no scope file except the rule-mandated `cli.mjs governance-report` regeneration of
`docs/sessions/evidence/task941/impl/governance-report.json` (`.claude/rules/review/03-decision-closure.md`, governance
approval path), whose output was byte-identical on the active path and changed only in `task` and `contractSha256` after the
archive move.

## Candidate and environment

- Candidate: commit `b7c3fc9f64cb14f5ab261303e1ad39c3a83730bc` (revision 2) on `task/935-governance-approval-route`, on top of
  the revision 2 kickoff commit `766bdb018`. `git show --stat b7c3fc9f6`: exactly the 9 files of the implementer's list, each a
  sidecar scope file or the sidecar itself; no product code, no CI workflow, no existing self-test file.
- Since the pre-941 base `758508105^`, `scripts/` changed only in `security-hook.mjs`, `shell-write.selftest.mjs` and
  `publication.json`; the only changed `*.selftest.mjs` is `shell-write.selftest.mjs` (AC4).
- Hook sha256 `436dc436e9da681dd9f6fdc324b4c704afa7c42cf60fe5c31f55d7fac7d8acd8`, test file sha256
  `e36fcdaf7bb3d244b62dcf88b1647ff69584fc3a4d2b5c8e8aca0a47c2ff26fe`.
- Platform: native Windows 11, Windows PowerShell 5.1.26100.9818, Node v22.22.3, Git Bash 5.2.37 (MSYS), cwd
  `C:\Claude_Code_Projects\lero-al`.

## Requirement disposition (source read in this session)

| R / AC | Disposition | Evidence |
|---|---|---|
| R1 (a) / AC3 | Met. `shellCommands` refuses `\r(?!\n)` in the whole string together with the earlier forms; a CR before LF stays a separator. | GOV-941-HOOK-MALFORMED-ERROR; probe H4 (CR CR LF, trailing CR, CR in single quotes; VT, FF, NEL, U+2028 outside quotes all `readOnly=false`, targets equal to pre-941) |
| R1 (b) / AC3 | Met. `changesFolder` matches `cd`/`Set-Location` case-insensitively, as written and with unquoted backslashes dropped; any `>`/`>>` target of R2 in any simple command makes the command not read-only. A leading redirection, quoted, concatenated, piped, `&`-, LF- and CRLF-separated folder changes were probed; each is not read-only with targets equal to pre-941. `cd..`, `chdir`, `sl`, `pushd` are not on the program list and fail closed. | probe H2, H3; GOV-941-HOOK-MALFORMED-ERROR (inclusion assertion for both AC3 forms plus `CD`, a trailing `set-location`, a redirected `cd`) |
| R1 (c)–(d), R2 | Unchanged since revision 1 apart from the two R1 additions; review 1 probe rerun: 29 form lines, all `readOnly=false`. | `r1-bypass-probe.mjs 758508105` run in this session |
| R3 / AC4 | Met. Both consumers unchanged; executor Bash CR form refused with `POLICY-EDIT AUTHORITY REQUIRED`. | GOV-941-HOOK-PRETOOL-DENY; review 2 probe G1/G2 lines |
| R4 / AC5 | Met. Five cases in `shell-write.selftest.mjs`; no other self-test changed. | runs below |
| AC1 | Met. Both revision 2 read-only forms give true and `[]`; `G1-crlf-control` and `G2-cd-read-control` `readOnly=true`, `after=[]`. p01 run note bound to hook `436dc436…`. | GOV-941-HOOK-READONLY-ALLOW; `r2-probe.mjs` |
| AC2 | Met. Both breaks fail with an assertion and restore; reproduced here on temporary copies (S1, S2). | `r3-mutations.txt` |
| R5 / AC6 | Written by this approver after this review block: `scope` entries by the archived 941 contract on the 935 and 940 contracts, evidence `scope-rebase-935.md` and `scope-rebase-940.md`; nothing else recomputed. | `closure.mjs`, `ac6-output.txt` |

## Runs (native Windows PowerShell 5.1, candidate `b7c3fc9f6`)

- `node scripts/workflow-gates/selftests.mjs`: exit 0, `# tests 178`, `# pass 178`, `# fail 0`, `# skipped 0` (≥ 173 + 5).
- `cli.mjs verify --contract <941 sidecar>` exit 0 (stage implemented); `publication.mjs --base HEAD`: 83 explicit files, 0
  dependency errors; `check-workflow.mjs` exit 0; eslint on `scripts/workflow-gates` exit 0; `npm run check:kickoff-evidence`
  PASS.
- `cli.mjs governance-report`: 5/5 PASS before and after the archive move.
- Review 2 probe: `G1-cr-sed-in-place`, `G1-cr-git-output`, `G2-cd-redirect`, `G2-set-location-redirect` each `readOnly=false`,
  `POLICY-EDIT AUTHORITY REQUIRED` for the executor and `after` equal to `before941`; both controls `readOnly=true`.
- Mutations on temporary copies (`r3-mutations.mjs`, output `r3-mutations.txt`): baseline 5 pass; S1 first simple command only,
  S2 `#` allowed, M1 lone CR allowed, M2 no `cd` rule, M4 case-sensitive `cd`, M7 `cd` rule only on the redirected command
  itself, M8 `Set-Location` missing: each exit 1 with at least one GOV-941 case failing.
- Adversarial probe (`r3-probe.mjs`, output `r3-probe.txt`): every H2–H5 line as stated above.

## Notes (P3, non-blocking for 941)

- **N1 — `>|` is a pre-941 limit of the redirection detection, now handed to Task 943.** Bash `>|` (write despite
  `noclobber`) writes the next word: `grep -c a Y >|cat` creates `cat`, `cd s; … >|cat` creates `s/cat`, and inside `.git`
  `>|head` overwrites `.git/HEAD` on the case-insensitive file system (`r3-probe.txt` lines 2–6). The classifier splits at
  `|`, so the word becomes a read-only program and the command is read-only with `[]`; for every guard result the candidate
  equals the pre-941 function (`cd .git; grep -c a README.md >|head`, `grep -c a README.md >| src/profile.ts` and
  `echo x >| src/profile.ts`: `[]` before and after, lines 7–9), because the pre-change redirection pattern never matches
  `>|`. 941 R1 (b) names only `&` as part of a redirection and R2 only `>`/`>>`, and R2 requires the pre-change result for
  every other command, so 941 cannot close it; the fix is a target rule. Under the owner's instruction to close every found
  hole inside the current tasks (C49) and to do dependent kickoff work in the same session (943 D14), this session wrote it
  into Task 943 as revision 3, R12 (g) (claims C108–C120, prototype `docs/sessions/evidence/task943/design/p14-noclobber-run.txt`,
  readiness `docs/sessions/evidence/task943/design/readiness.md` "Revision 3"); 943 is not yet implemented, and this session
  neither implements nor approves it.
- **N2 — folder changes the hook cannot resolve.** As the implementer reported, a `cd` form now falls back to the pre-change
  detection, which reports only the root-level name (`G2-cd-redirect`: `after` equals `before941`); a folder set by an earlier
  tool call is likewise unknown. Both are owned by Task 943 R12 (c) and R12 (d).

## Self-audit (same session, owner: "check the quality of your work", 2026-11-03)

- Rules opened only in the self-audit: `shared/task-readiness.md`, `shared/orchestration-state.md`, the governance part of
  `shared/security-testing.md` and `docs/governance-enforcement.md` §2. No 941 disposition changed: the governance-scan
  regression gate is justified N/A, because `scripts/governance/` scanners classify `src/` paths only and 941 changes no
  `src/` file; the governance contract needs (hook and CI layers, allow/deny/error, sensitivity of the critical case) hold.
- Defect of this session, fixed: the Task 943 revision 3 insertions moved 943 lines cited by the active 931 kickoff (C28,
  C29) and the 937 kickoff (C37); `check-kickoff-evidence.mjs --files` failed on both. They are re-pointed to the moved lines
  and their sidecar task hashes updated. The archived 941 kickoff's C48 cites 943 line 271, which held the literal at this
  review's candidate; the checker skips archived kickoffs, and the reviewed record is kept unchanged as history (the literal
  is now on a later 943 line).
- Process deviation of this session: the 943, 931 and 937 sidecars stayed `ready` while their kickoffs were edited, instead
  of `draft` first (`shared/orchestration-state.md`); the final saved contracts pass `cli.mjs plan`.
- Added proof for 943 R12 (g): its composition with R12 (c) is executed on the revision 2 prototype
  (`docs/sessions/evidence/task943/design/p14-noclobber-run.txt` lines 28–31, 943 C121–C122).
- Corpus privacy: `p14-noclobber-run.txt` prints corpus entry indexes only, no command text (the corpus is gitignored).
- Independence rechecked after all writes: `independence-self-check.mjs` on this session's transcript, 0 errors.

Second self-audit (owner asked again, same day):
- Missing artifact of this review, now written: the non-frontend review ledger required by `docs/orchestrator-procedures.md`
  "Approval-closure gate", `docs/reviews/2026-11-03-task941-read-only-commands-are-not-writes.review-ledger.json`
  (`check:review-ledger --file` PASSED; the all-ledger run reports 17 invalid ledger files, all older ones dated
  2026-08-11 to 2026-09-16, none of this task).
- AC1 had rested on the implementer's p01 output only. Now run independently: `r3-p01-rerun.mjs` applies exactly the two AC1
  substitutions (each asserted once) and binds `import.meta.url` to the probe; `r3-p01-rerun.txt` equals lines 1–10 of
  `impl/p01-after.txt`, and its lines 6–8 equal the design run.
- The review 1 and review 2 probe runs of this review had been kept only outside the repository; retained now as
  `r3-r1-probe-rerun.txt` (29 of 29 `readOnly=false`) and `r3-r2-probe-rerun.txt`.
- Sensitivity failure kind checked: in `r3-mutations.txt` every failing test of S1, S2 and the five mutants carries
  `ERR_ASSERTION`, and no other error code occurs.
- `p14-noclobber-prototype.mjs` takes the revision 2 prototype's hook and sibling modules all from `db04c936f`, so the AC13
  rerun after the 943 implementation cannot break on changed gate modules; its output is unchanged.

Third self-audit (owner asked again, same day):
- A classifier acceptance had rested on reasoning only: a NEL (U+0085) or U+2028 inside single quotes is read-only for
  941. Executed now (`r3-unicode-quote-probe.txt`): neither character ends the quote or the command in Git Bash or
  PowerShell 5.1 (`-Command`), so no hidden write happens; both positive controls write.
- Ledger AC3 wording corrected: of the 25 H2–H4 forms, 24 are `readOnly=false`; `H4-nel-in-single` is the read-only control.
- Active backlog corrected: 941 had stayed in the "Kickoffs filed and ready" list and the order line of `docs/backlog.md`;
  it now has a closure sentence like 940, and the order starts at 943.

## Closure

The 941 kickoff and sidecar moved to `tasks/Archive/` (task path and hash updated, stage `reviewed`, report regenerated,
review block with the final digests); the 935 and 940 contracts carry the R5 `scope` entries by the archived path; the Sprint
92 records, `docs/backlog.md` and `docs/backlog-archive.md` record the approval.
