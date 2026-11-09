# Task 968 — The homepage theme runtime gate measures today's files and runs with the product checks

Sprint 93 (governance reset). Priority P2. Owner decision D2 (2026-11-06): "Quality must cover all files in the project,
without exceptions"; golden rule (2026-11-07): a gap found is closed, not reported. Found by the Task 951 executor
(2026-11-09) and confirmed in the Task 951 review 1.
Implementer: Sonnet (the gate script); Opus (the `scripts/quality/product-gates.mjs` line). Reviewer: Opus. Human owner
of the change: the owner.

## Goal

`npm run check:homepage-theme-runtime-deps` exits 1 on `39d0fecc7` and on the Task 951 tree alike: "migration signature
mismatch — 8 approved-target defect(s)", every one a token the manifest expects and the file no longer uses
(`MantineListingCardPattern.module.css` `--homepage-runtime-space-0/1/2/20/3`, `ListingCard.module.css`
`--homepage-runtime-space-1/6/8`; expected signature `f3093b7d…`, observed `090d6f74…`). BLOCKING is 0 pairs / 0 uses,
so no theme-inline-only or unknown token is in use: the approved table in `scripts/check-homepage-theme-runtime-deps.mjs`
(`MIGRATION_TARGETS`, `:126`) predates the card's move to Mantine (Task 886 `4197ae7d8`, Task 741 `7b4b81f8c`). No CI
job and no product check runs the gate (`grep -n homepage-theme scripts/quality/product-gates.mjs .github/workflows`
prints nothing), so it went red unseen. Its self-test is red too (Opus, 2026-11-09):
`check:homepage-theme-runtime-deps:verify-gate` case 5 (unmodified copy) expects FULL_CENSUS 65/123 and finds 59/84, a
drop of 39 uses where the 8 rows account for far fewer, so the census moved in other categories as well. After the task the gate passes on today's tree, still fails a swapped token
(its `--verify-gate` case 6), and runs with the product checks, so it cannot go stale silently again.

## Scope

- `scripts/check-homepage-theme-runtime-deps.mjs`: for each of the 8 rows, read the file at the commit that removed the
  token (`git log -S"<token>" -- <file>`) and record it in the header comment, as Task 879 did for `HeaderView`: the row
  is removed only when that commit moved the value to a Mantine theme token or prop; a token that was replaced by a raw
  value or a different custom property is a finding: the executor stops before changing any constant and reports the
  row, its commit and the replacing value to Opus. Then `MIGRATION_TARGET_PAIRS`, `MIGRATION_TARGET_USES`,
  `FULL_CENSUS_PAIRS`, `FULL_CENSUS_USES` and `MIGRATION_SIGNATURE` are re-measured with the gate's own `--report`
  (never written by hand), and the header comment states the census change per `--report` category and file
  (65/123 → the measured total), each moved file with its commit, as for the 8 rows.
- Opus decision (2026-11-09, after the executor's stop at Route step 2): a row follows its uses. A row whose uses all
  moved to Mantine theme tokens or props is removed (Pattern space-1, space-2, ListingCard space-1, space-6, space-8);
  a row with uses left keeps them with the measured count (Pattern space-0: 2, `:99`, `:123`; space-3: 1, `:34`), so
  the signature still pins them; a use that moved to another file with the same token follows it: the space-20 row
  names `src/design-system/mantine/patterns/MantineListingCardPattern.tsx` (1 use, `mih` at `:262`) and that file joins
  `MIGRATION_INPUTS_REL`. If the new input adds a blocking pair or an unknown token, stop again and report. The
  `imageActions` slot removed by `7b4b81f8c` is Task 741's approved product change, not this gate's concern.
- Opus: `scripts/quality/product-gates.mjs` gains `npm run check:homepage-theme-runtime-deps`.
- Out of scope: the CSS files the gate reads; the other gates; `scripts/quality/**` except the one line above.
- Dependencies: none.

## Attack surface

Unchanged: a design-token gate script that reads repository files; no product code, request path or data changes.

## OWASP

- Cross_Site_Scripting_Prevention: not applicable — `MantineListingCardPattern.tsx` is named only as a file the gate reads; no component, render path or output changes.
- Cryptographic_Storage: not applicable — the "signature" here is a sha256 of a token table, no secret or randomness.
- Database_Security: not applicable — "migration" means CSS token renames; no database, role or query is touched.
- DOM_based_XSS_Prevention: not applicable — the gate reads `MantineListingCardPattern.tsx` as text; no DOM sink or component code changes.
- GraphQL: not applicable — the word "migration" is about CSS tokens; the project has no GraphQL API.
- Injection_Prevention: not applicable — the gate's table rows and constants change; no command or argument handling changes.
- JavaScript_and_TypeScript_Security: not applicable — only literal table rows and constants change; no regex, merge or input handling.
- Key_Management: not applicable — the "signature" is a content hash of the table; no key exists or changes.
- Mass_Assignment: not applicable — a CSS token gate binds no request to a model or record.
- Multi_Tenant_Security: not applicable — "migration" is a CSS token migration; no tenant data or path is involved.
- OS_Command_Injection_Defense: not applicable — the gate's process calls are untouched; only its data table changes.
- Query_Parameterization: not applicable — no SQL is written or run; "migration" refers to CSS tokens only.
- SQL_Injection_Prevention: not applicable — no SQL is written or run; "migration" refers to CSS tokens only.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — the removed rows are justified by the commit that removed each token, read by the reviewer, not by the executor's report — AC1.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — Opus reruns the gate, its self-test and the product checks in review — AC1, AC2, AC3.
- Web_Frontend_Security: not applicable — no front-end file changes; the `.tsx` joins the gate's read-only inputs.

## UI

No visible change.

## Mobile adaptation record
- Scope: none

## Acceptance criteria

- AC1 The gate passes on today's tree — test: `npm run check:homepage-theme-runtime-deps` exits 0 (red today: exit 1,
  8 defects); each removed, re-counted or moved row names its commit in the header comment.
- AC2 The gate still catches a swapped token — test: `npm run check:homepage-theme-runtime-deps:verify-gate` exits 0
  with all six cases (red today: case 5, FULL_CENSUS 59/84 against 65/123; case 6 is the swap), and the default run is
  red when one remaining `MIGRATION_TARGETS` row's `expectedToken` is changed (restored, sha equal).
- AC3 The gate runs with the product checks — test: `node scripts/quality/product-gates.mjs` lists and passes
  `check:homepage-theme-runtime-deps`.

## Route

1. Run the gate, `--verify-gate` and `--report` on `HEAD`; save the output in your scratchpad. For the census before
   the drift, extract `1a851f8df` (Task 879, the commit that set today's signature) with `git archive 1a851f8df | tar
   -x -C <scratchpad>/base` and run that copy's `node scripts/check-homepage-theme-runtime-deps.mjs --report` there.
2. For each of the 8 rows, `git log -S` and `git show <commit> -- <file>`; record what replaced the token.
3. Remove the rows that moved to Mantine; re-measure the constants with `--report`; run AC1 and AC2 (with the break).
4. Run: npm run lint · `node scripts/quality/check-files.mjs --worktree` · AC1 · AC2.
5. Report each command, its exit code and output, and the commit found for each row. Opus adds AC3's line in review.

## Review

Review 1 of the working tree on `958c241ef` — APPROVED
Scope: `scripts/check-homepage-theme-runtime-deps.mjs` read whole (5 rows removed, 2 re-counted, 1 moved with its `.tsx`
input, header and case 5 comments); the census delta summed per file (pairs -2 -5 +5 +1, uses -29 -12 +5 +2: 65/123 ->
64/89). Opus, AC3: `scripts/quality/product-gates.mjs` runs the gate and its `--verify-gate`.
Tools (2026-11-09, reviewer reruns): AC1 exit 0; AC2 6/6; `product-gates` 36/36 (both new lines PASS); lint 0;
typecheck 0; `npm test -- --coverage` 0 (382 files, 6279 tests); changed-lines coverage 0; `check-files --worktree` 0;
`ac-tests` PASS; quality tests 149/149. Breaks (each exit 1, restored, sha equal): space-0 count 2 -> 1; the `.tsx`
row's token swapped; `mih` back to the theme-inline `--space-20` (1 blocking pair: the new input is what sees it).
Findings: none. The `d8a07a3c7` touch-target uses in `MantineCopyIdButton.module.css` are root-owned, recorded in
the header, not a row.
