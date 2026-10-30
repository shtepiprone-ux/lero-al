# Task 927 — Opus review 2 (2026-10-23): Amendment 3 accepted; AC10's census clause waits for Task 923 R136 (owner D84)

Candidate: working tree on HEAD `4527bc648`. Platform native Windows 11 (win32 x64), Node v22.22.3, cwd `C:\Claude_Code_Projects\lero-al`.
Built Storybook `storybook-static/` of 18:42 local, after the last source edit at 18:37.
The executor's index is `docs/sessions/evidence/task927/a3/handoff-summary.md`. This review's runs are in this folder (`rv2-00-run.cjs`).

## Re-run by the reviewer

- **Targeted Vitest** (the twelve files of review 1): 163 passed, exit 0 (`rv2-01-targeted.txt`). This includes
  `[SEC-927-FE-REAUTH-ONE-CONFIG]`.
- **`npm run typecheck`**: exit 0 (`rv2-02-typecheck.txt`).
- **`cli.mjs plan`** on the contract: exit 0 (`rv2-04-cli-plan.txt`).
- **Rendered-state census** of the five Stories of AC10: exit 1 (`rv2-03-census.txt`). One Story x state x root has a violation:
  `patterns-mantine-authsheet--login` `portal:0`, `text-ellipsis` and `target-small` (32 cells). Every finding is inside Google's own
  drawn button:
  - `div.nsm7Bb-HzV7m-LgbsSe` is 40 px high, the largest size GIS offers;
  - its label `span.nsm7Bb-HzV7m-LgbsSe-BPrWId` has Google's `nowrap` and `ellipsis` CSS, and it is not cut at any width.

  The other four Stories pass, the dialog's Google state included.
- **The other AuthSheet Stories**: `rv2-05-census-other-authsheet.txt`.

## Code read against §13

| Item | Code | Verdict |
|---|---|---|
| (1) R4 | `GoogleSignInSlot.tsx`: the root is `Box`, with no gap. In each state only one child has height. | Met |
| (2) R13 (f) | `ProfileTab.tsx`: `{emailNeedsGoogle && !showDeleteDialog && (`. The dialog's button mounts only while the dialog is open and `deleteNeedsGoogle`. | Met |
| (3) R9 | `ui-contract-registry.json` row `google-sign-in-button`: component, Modal Story, theme token owner, parity entry. | Met |
| (4) R15 | `theme.ts` Alert `message`: `overflowWrap: 'anywhere'`. The default Alert is unchanged (`a3/alert-default-unchanged.txt`), and the long e-mail stays inside at 320, 390 and 640. | Met |
| (5) AC13 | Contract `implemented`, `report` for 24 cases, `cli.mjs verify` exit 0 (executor). | Met |
| (6) R2 | `googleIdentityScriptUrl(locale)` gives `?hl=`. A load for another locale removes the old element and `window.google` and rejects a pending load. The button's effect depends on `locale`, and `apiVersion` redraws the button. | Met |

**Sensitivity** (`a3/sensitivity/run-sensitivity-summary.txt`): the baseline passes 16 of 16. Each of mutants A–F fails its named case
on an assertion. Mutant F (the e-mail button while the dialog is open) fails ONE-CONFIG. The restored run passes 16 of 16.

**Unit totals:** the base and final failure sets are identical (243 of 5849, then 243 of 5850). None of the failures is in a file of this task.

## Findings

| ID | Sev | Finding | Attribution | Resolution |
|---|---|---|---|---|
| F7 | P2 | AC10 asks the census to pass on `Login`. Google's own button (D2) cannot pass two of its rules: 44 px targets and no latent ellipsis. The census has no exemption for text, and `Login` rendered for the first time after review 1 (C99). | Task design | Owner decision 2026-10-23 (recorded as Task 923 D84): accept Google's button as it is. The census excuses that one button from `target-small` and `text-ellipsis`, and counts every excused element in the report. The census belongs to Task 923, so the change is Task 923 R136 (Revision 40). After it, Opus reruns AC10's census here. |
| N1 | — | `a3/slot-trailing-gap-a3.mjs` replaces review 1's probe, which looked for a `Stack`. Its proof (8 rows, `trailingInsideSlot` 0) is accepted for AC10's first clause. | — | — |
| N2 | — | Ledger rows C76 (`Stack gap="md"`) and C93 (`"stage": "planned"`) describe the state before Amendment 3. They are re-pointed when this kickoff is next revised. A kickoff edit now would make the executor's report stale, because the report is bound to the plan digest. | — | At Task 927's closure revision |

## Verdict

**Amendment 3: accepted.** Task 927 is not approved. It waits for:
- Task 923 R136 and Opus's AC10 census rerun;
- the owner's visual QA (§7 matrix);
- AC12 (the owner's native sign-in);
- Task 923's census gate (C43).

No executor route on this task remains. The next executor route is Task 923 Revision 40 (R136, then R83).
