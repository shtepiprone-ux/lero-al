# Task 939 — design and readiness record (Opus, 2026-11-01)

Platform: native Windows 11, Node v22.22.3, cwd `C:\Claude_Code_Projects\lero-al`, branch `task/935-governance-approval-route`
at `ad6e1b08e` (PR #12 head on GitHub: `c2f918a59`).

| Step | Source / command / artifact | Observation | Result |
|---|---|---|---|
| C1 assignment | `docs/backlog-reserved.md` 939 row; owner D7, D8 (2026-11-01) | the four red Locale Leak Detection jobs of PR #12 | PASS |
| C2 reproduction | CI run 41300859846 logs and `report.json` artifacts → `l00-ci-excerpts.txt`, `l00-report-errors.txt`, `artifacts/shard1-4/` | shards 1–4 incomplete; 14 failed tuples, 12 FavoritesShell (every viewport) and 2 CustomRangeTooLong (mobile-320, mobile-375); shards 5–6 pass | PASS (EXECUTED) |
| C2 cause, detector | `scripts/check-locale-leak.mjs:383-388`; `p00-detector-history.txt` | page errors and Storybook render errors count since d8a07a3c7 (Task 923); the detector is correct | PASS (EXECUTED) |
| C2 cause, FavoritesShell | `p01-render-probe.mjs` on the CI Storybook artifact → `p01-render-probe.txt:2` | `@supabase/ssr` refuses an empty URL/key; `useFavoritesRealtime.ts:54` creates the client in an effect; governance §9 forbids it | PASS (EXECUTED) |
| C2 cause, CustomRangeTooLong | `p01-render-probe.txt:67`; `RangeDatePicker.tsx:445`, `:818`, `:945` | the play waits for the desktop Next arrow; below the gate the mobile body has Confirm | PASS (EXECUTED) |
| C3 design | kickoff R1–R10 | inert stub plus exact alias; mobile play branch on the picker's own gate; no product file change | PASS |
| C3 feasibility, stub | `p03` stub in a scratch Storybook config (exact alias before `@`), build with every `NEXT_PUBLIC_*` emptied → `p03-render-probe-with-stub.txt` | no Supabase error; CustomRangeTooLong still fails (separate cause) | PASS (EXECUTED) |
| C3 regression, stub | `p02-client-reach.mjs` (32 of 192 Story files) and `p04-stub-regression-probe.mjs` CI artifact vs stub build | 130 Stories: 126 identical, 4 FavoritesShell from failed to clean | PASS (EXECUTED) |
| C3 counterexample | first stub build kept local `NEXT_PUBLIC_*` → AuthSheet differences (`p05-authsheet-diff.txt`, stub counter 0) | the differences came from baked keys, not the stub; the route requires emptied variables and forbids PowerShell `$env:X = ''` | PASS after correction |
| C3 feasibility, mobile play | `p06-mobile-route-probe.mjs` on the stub build, CustomOpen Story (CustomRangeTooLong's failing play leaves the error overlay over the canvas) | 12/12 PASS at 320/375/639 × sq/en/uk/it with the localized alert; 640 and 1280 show the desktop body | PASS (EXECUTED) |
| C4 proof | sidecar 7 SEC-939 cases; R7 planted breaks P1–P3 | frontend and server allow/deny/error on the real hook, real stub, real client and real actions; each break reaches a named case | PASS (ANALYTICAL) |
| C5 mobile record | `node scripts/check-mobile-adaptation-contract.mjs --files <kickoff>` | PASS | PASS (EXECUTED) |
| C6 authority | canonical `isPolicyPath`/`isProductPath` on every scope path | no policy path; `.storybook/**` is neither policy nor product; Story files need the UI receipts | PASS (EXECUTED) |
| C6 receipts | `p07-receipt-blackbox.ps1` against the real `phase-write-gate.ps1` (event on stdin from a file) | all four receipts allow both Story edits; missing receipts, missing Storybook proof and missing mobile receipt are denied with the right reason | PASS (EXECUTED) |
| C6 reviewed scope | `docs/sessions/evidence/task937/design/p01-reviewed-scope-membership.txt:12-15` | no 939 file is in the Task 923 D8/D9 or Task 935 scope; no rebase | PASS (EXECUTED) |
| C6 evidence gate | `node scripts/check-kickoff-evidence.mjs --files <kickoff>` | PASS after adding the R7 citation | PASS (EXECUTED) |
| C7 publication | `node scripts/workflow-gates/cli.mjs plan --contract <sidecar>`; `publication.mjs --base HEAD` | plan exit 0; publication 0 dependency errors; kickoff digest 7f7f1736f6184c89323c7bd5000cda9cbf06d7852ccf4881d5351cdfd595bad7 (after renumbering the listing-visibility task 941 → 942; 941 was filed by a parallel session at owner decision D10) | PASS (EXECUTED) |
| C7 diff gate | `cli.mjs diff --phase plan --base <merge-base> --head HEAD` and `--working-tree` | BLOCKED on two paths that are not this task's: the archived Task 935 sidecar and `scripts/workflow-gates/scope-rebase.selftest.mjs` (Task 940 commit `ad6e1b08e`, under its own review) | RECORDED, NOT THIS TASK |
