# Task 944 design readiness record (C1–C7)

Designer: Opus session 3d40df28, 2026-11-03, native Windows 11, node v22.22.3, cwd `C:\Claude_Code_Projects\lero-al`, branch
`task/935-governance-approval-route`, HEAD `93612ccea` with the Task 943 implementation uncommitted (another session was working on
it during this design; this session wrote none of its files).

| Step | Source / command / artifact | Observation | Result |
|---|---|---|---|
| C1 assignment | owner request 2026-11-03 (D15); AskUserQuestion (D16, D17) | governance task, scope runner + record check + syntax guard, Sprint 92 after 943, before 942 | PASS |
| C1 state | `docs/backlog.md` registry | Last used 943, NEXT FREE 944; no other 944 in `tasks/` or the backlog | PASS |
| C2 reproduction | `p00-incident.md` | live `//` break on line 197 of `contract.mjs`; every guarded tool and the Stop hooks refused (EXECUTED, this session's own tool output) | PASS |
| C2 cause | `task943/sensitivity/GOV-943-TESTS-REBASE-DENY.txt:3` | the 943 implementer applied and restored breaks with the Edit tool | PASS |
| C2 rule | `sources/.claude__rules__shared__security-test-quality.md.txt:78-79` | the in-memory method is already required; nothing provides or checks it | PASS |
| C3 approach | `p01-loader-run.txt` | Node `load` hook: mutant fails with the assertion, identity passes, the incident's form is a file-level failure, live digests unchanged, `NODE_OPTIONS` reaches children (EXECUTED) | PASS |
| C3 guard | `p02-closure-run.txt` | closure of 11 hook-loaded modules; stdin `node --check` refuses the incident's Edit result in about 36 ms and accepts a block-comment break (EXECUTED) | PASS |
| C3 ripple | `p04-rebase-targets.txt`, `p05-rule-owner-candidates.txt` | shared rule edits would stale 7 reviewed contracts, so the rule text goes to `task-readiness.md` and `review/02-adversarial-ui.md`, in no reviewed digest; code files need scope rebases of 935, 940, 941, 943 (R7) | PASS |
| C4 baseline | `p03-selftests-base.txt` | 190/191 pass; the failure is GOV-941-HOOK-MALFORMED-ERROR under the uncommitted 943 tree, which 943 must fix before 944 starts (route step 2) | PASS (dependency explicit) |
| C4 runner inputs | `p07-name-pattern-run.txt` | anchored escaped full test name selects exactly one test; mutant TAP has `ERR_ASSERTION` (EXECUTED) | PASS |
| C4 942 break | `p06-942-break-text.txt` | `norm === e.path && ` occurs once, line 68 (EXECUTED) | PASS |
| C5 authority | `sources/scripts__workflow-gates__contract.mjs.txt:78`; sidecar | every executor path is policy or evidence; Opus implementer (D1); no Sonnet route | PASS |
| C5 draft | in-memory `validateContract({...c, executionStatus:'ready'})` | `[]` for the 944 draft | PASS |
| C6 counterexamples | R1 (b)/(c)/(d), R3 (a)/(b) | file-level failure, passing mutant, live change, missing settings, cycles and absent `old_string` are named cases (AC2, AC3, AC7) | PASS |
| C6 cross-task (D14) | 942 kickoff revision 1 and sidecar | AC2 break via `cli.mjs sensitivity`; spec in scope; starts after 944 | PASS |
| C7 checks | `p08-publication-checks.txt` | `plan` exit 0 for the 944, 942 and Sprint 92 sidecars; `check:kickoff-evidence` PASS for both kickoffs; `check:backlog-active` PASSED | PASS |
| C7 publication | `node scripts/workflow-gates/publication.mjs --base HEAD` | `0 dependency errors` | PASS |

## Self-audit at the owner's request (same session, 2026-11-03, before the commit)

| Finding | Evidence | Correction |
|---|---|---|
| F1 (confirmed, task design): R3 (b) computed an Edit result by a literal match; `session-role.mjs`, a hook-loaded module, is CRLF in the working tree, so a multi-line LF `old_string` was not found and the guard would have added nothing (bypass) | `p09-crlf-run.txt:14`, `:19` (EXECUTED) | R3 (b) normalizes CRLF to LF on both sides; a still-absent `old_string` refuses (fail closed); AC5 adds the CRLF variant, AC7 the absent `old_string` refusal; C50, C51 |
| F2 (confirmed, task design): no requirement stopped a guard exception from leaving `evaluateHook`, which would turn into `SECURITY GATE BLOCKED` for every tool, the same trap; a missing `.claude/hooks` folder was not covered | source reading of R3 (a) as first written; the hook's catch block, `sources/scripts__workflow-gates__security-hook.mjs.txt` main block | R3 (a) every unreadable closure input contributes nothing; R3 (c) any guard exception becomes a per-write refusal; R3 (d) exported `hookModuleSyntaxErrors` with an injectable reader; AC7 forces a throwing reader |
| F3 (design weakness): R2 matched legacy contracts by kickoff file name, so a copy of a legacy kickoff elsewhere would escape the record check | R2 text as first written | R2 lists the exact task paths, including 943 before and after its closure move |
| F4 (hardening): the guard's `node --check` child inherited `NODE_OPTIONS` | R3 (b) as first written | the child runs without `NODE_OPTIONS` |
| F5 (precision): the runner named no timeout and compared the loader URL as a string | R1 (c), (e) as first written | 5-minute timeout of `governanceReport`; `fileURLToPath` + resolved path comparison |
| Checked, no defect: existing self-tests call `evaluateHook` only on fixture roots without `settings.json`, so the stricter R3 changes none of their results | Grep of `scripts/workflow-gates/*.selftest.mjs` for `evaluateHook(process.cwd()`/real-root calls and for Edit/Write of closure files: no matches; `diff-hook.selftest.mjs:12-37` fixture has no settings | none |
| Checked, no defect: the incident's single-line form is caught without normalization; only multi-line `old_string` needed F1 | `p02-closure-run.txt:6` | none |
| My earlier CRLF count with `grep -c $'\r'` was wrong (the Bash tool drops the backslash, so it counted the letter r); recounted with Node | `p09-crlf-run.txt:8-18` | none (evidence corrected before use) |

## Self-audit 2 at the owner's second request (same session, 2026-11-03, before the commit)

| Finding | Evidence | Correction |
|---|---|---|
| F6 (confirmed, task design): R3 checked only syntax with `node --check`; a write that imports a file not written yet, or removes an export another hook-loaded module imports, passes `node --check` yet stops the hook from loading, the same trap as the incident | `p11-link-run.txt:3-4` (EXECUTED) | R3 (b) is a load check: new `hook-load-check.mjs` links the closure graph with `vm.SourceTextModule` in a child (`--experimental-vm-modules`), never evaluating a module; C52–C56 |
| F7 (hardening, same class): a bare package import in a hook module would crash every hook when `node_modules` is missing or broken | `p12-bare-specifiers.txt:3` (no such import today) | the load check refuses bare specifiers in hook-loaded modules; C57 |
| Scope update | kickoff section 4, R5, sidecar `scope` | `hook-load-check.mjs` added (five `publication.json` entries); AC5 adds the three load variants, AC6 the write-then-import order and a no-evaluation marker check, AC8 the two real-repository load variants |
| Checked, no defect: CI runs Node 22.22.3, the version of every probe | `.github/workflows/governance-pr.yml` `node-version` lines | none |
| Checked, no defect: the live hook graph links without evaluation, so the guard does not refuse today's modules | `p11-link-run.txt:5` | none |

## Final digests

| File | task digest | planDigest |
|---|---|---|
| `tasks/Sprints/Sprint_92_kickoff_prompt_Task_944_Sensitivity_Breaks_Only_In_Memory.md` (after self-audit 2; checks rerun in `p13-publication-checks-after-audit-2.txt`) | `fc31c710b69019f8220ef6bc800299a250086e6b6048a5ea69ffdfa0a6c0ab5c` | `75a6fb7de3f91026494e4cfce640b953069ea45d2d70dfe338ccf96231192898` |
| `tasks/Sprints/Sprint_92_kickoff_prompt_Task_942_Listing_Visibility_Allowlist_Current.md` | `881a18930e02a27b9628870429634df2948d87508a176a99091ffd30167ee366` | `55a88ab2e1eb222929b40eb4dd32d99f917184557229804ce93dcf3b66b9ca19` |
| `tasks/Sprints/Sprint_92_Governance_Changes_Get_An_Independent_Approval.md` | `c77af5deb11a21bb0830d804a465cad99a05856613a34aab56a0b8b5bc76e797` | `f3fe1ed2c48622e97afb17f4cacd413ad4533ab7cc20257e90c4b09841328655` |

## Open dependencies (not defects of the route)

- Task 943 must be reviewed and committed first (D17); its working tree currently fails GOV-941-HOOK-MALFORMED-ERROR (C27).
- A transcript excerpt of the 943 implementer session was not copied into the repository (the extraction was refused by the
  permission classifier); the incident evidence is this session's own tool output (`p00-incident.md`) and the 943 artifacts.
