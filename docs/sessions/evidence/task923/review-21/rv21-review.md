# Task 923 — review 21 (Opus), 2026-10-20: Revision 16, Part 5

Verdict: `NEEDS REVISION` → kickoff §32 (Revision 17, R81, AC81, Q10). Contract: `rv21-merge-contract.mjs` (175 cases, `plan` exit 0).

## Commands run by Opus (native Windows 11, Node v22.22.3, cwd `C:\Claude_Code_Projects\lero-al`)

| Command | Result |
|---|---|
| `node node_modules/vitest/vitest.mjs run` on the 14 suites of Part 5 (`rv21-01-part5-suites.txt`) | exit 1: 190 tests, 179 passed, 11 failed — `cabinetFailures.security.test.ts` 7, `deleteOwnAccount.smoke.test.ts` 4 (the executor's item 1) |
| `node node_modules/typescript/bin/tsc --noEmit` | exit 0 |
| `node scripts/check-i18n-parity.mjs` | exit 0, 2648 keys (4 more than the executor's 2644: Task 927's keys) |
| `node scripts/workflow-gates/cli.mjs verify --contract …D8_D9.security.json` | exit 1, `BLOCKED: Missing file` for the parts not yet built (expected for `PARTIALLY IMPLEMENTED`) |
| `node scripts/workflow-gates/cli.mjs plan --contract …D8_D9.security.json` after the merge | exit 0 |

Not re-run by Opus: build, build-storybook, the census (the executor's `r17-31-census-modal-password-final.txt`, EXIT_CODE=0, 259 rows, was read),
the real-project suites, the production CSP check (`r17-22-csp-runtime.txt`).

## Code read

- `src/modules/cabinet/actions/index.ts`: the diff of the whole file. `@supabase/ssr` 0.10.3 server storage (`node_modules/@supabase/ssr/dist/main/cookies.js:268`) returns the
  session set in the same client first, so `signOut({ scope: 'local' })` in `verifyPassword` ends the check's own session, not the person's.
- `ProfileTab.tsx`: the e-mail form (C696, C698) and the deletion modal; the Google branch is now Task 927's (C702).
- `MantineDeleteConfirmModal.tsx`, `Modal.stories.tsx` (`DeleteConfirmPassword`), `scripts/ui-contract-registry.json` row `mantine-delete-confirm-modal`.
- `CabinetPasswordSection.tsx:41-75` (C691).
- `getExchangeRateServer.ts` (C694), `r17-01-currencyrates-capture.txt` (C695).
- `src/lib/security/headers.ts:36-38` (C701), the middleware wiring.
- The `admin_search_users_by_email` definition (`db-catalog/catalog.json`): `ILIKE '%' || q || '%'`, `LIMIT 100`, service role only; the exact compare in
  `emailUsedByAnother` holds, and Auth's own unique address backs it.

## Findings

F1–F8 as in kickoff §32.1. The verdict is held by F1 (P1) and F2–F5 (P2).

## GR-7

No reference conclusion supports this verdict. The visual part of Q10 (1) needs Opus's four-reference audit before it is handed over (§32.4).
