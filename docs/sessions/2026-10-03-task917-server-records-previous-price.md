# Task 917 — The server records the previous price (session log, 2026-10-03)

Status: **PARTIALLY IMPLEMENTED** — all code and tests done; `npm run build` exits 1 on a file outside this task's scope.

Preflight: `CANONICAL REUSE PREFLIGHT LOADED — docs/golden-rules.md GR-0; docs/agent-contract.md 16b–16c.`
`GR-0` not applicable (data-only, kickoff §1). `GR-1`/`GR-3*` not applicable (no visible change).
`GR-2 SCOPE STATED — check:listing-visibility inspects listing visibility predicates; it cannot see price_old semantics; the criteria are closed by priceOld.test.ts and the two smoke suites.`

## Files Changed

| Path | Change |
|---|---|
| `src/modules/listings/domain/priceOld.ts` | new — `computeNextPriceOld` (§10.1) |
| `src/modules/listings/domain/priceOld.test.ts` | new — 11 rows of §10.2 as `it.each` |
| `src/modules/listings/actions/updateListing.ts` | pre-read widened to `price, price_old, currency`; `.update()` writes `price_old: computeNextPriceOld(...)` |
| `src/modules/listings/actions/createListing.ts` | insert carries `price_old: null` after the spread |
| `src/modules/listings/actions/__tests__/updateListing.smoke.test.ts` | cases (a)(b)(c) added; existing assertions untouched |
| `src/modules/listings/actions/__tests__/createListing.smoke.test.ts` | create case added; existing assertions untouched |
| `docs/domain-rules.md` | server-owned `price_old` line under the price line (R7) |
| `docs/backlog.md` | state line only |

## Gate results

| Command | Exit |
|---|---|
| `node -p process.platform` / `node --version` | 0 — `win32`, `v22.22.3` |
| vitest (priceOld + both smoke suites) | 0 — 3 files, 24 tests passed (`02-green.txt`) |
| `npm run typecheck` | 0 |
| `npm run lint` | 0 |
| `npm run check:listing-visibility` | 0 — PASSED, 0 violations |
| `npm run build` | **1** — see below (`07-build.txt`) |

Two-armed proof (AC6): `01-red.txt` — against the unchanged actions 4 new cases fail, 9 existing pass. `02-green.txt` — after the change, all pass.

## Build failure (not in scope)

`src/components/admin/ListingPreviewDialogView.tsx:82:25` — `Type error: Property 'images' does not exist on type 'AdminListing'.`
The file belongs to Task 857's uncommitted admin work (§25 Revision 8). `Compiled successfully` preceded the type check; none of the 917 files appears in the error. `npm run typecheck` exited 0 while `next build` type-checking fails, so the two differ on this tree; not investigated further.

## Hashes (`08-hashes.txt`, order of §13.1)

priceOld.ts `65067fd5…` · priceOld.test.ts `f81741cf…` · updateListing.ts `2a4cbe66…` · createListing.ts `29ae7da8…` · updateListing.smoke `1ae1b2d6…` · createListing.smoke `231c5a83…` · domain-rules.md `fe210292…`

## Notes

- A1 (currency change clears `price_old`) implemented as written.
- The existing happy-path smoke fixture has no `price`/`currency` on the stored row; the rule returns null there, the assertions are unchanged and pass.
- Limitation recorded in §5: a direct REST write can still set `price_old` (no migrations tracked).
- No git commands run.

## Review (Opus, 2026-10-03) — APPROVED

- **Build superseded.** `07-build.txt` (exit 1) is superseded by `20-review-gates.txt` (build exit 0). The exit 1 was a
  concurrent Task 857 edit: `src/components/admin/ListingPreviewDialogView.tsx` was written at 00:15:07, inside this
  run's build window (00:13:49 → 00:15:16). The reviewer's run on the final tree compiles and type-checks.
- The reviewer's blob hashes in `20-review-gates.txt` equal `08-hashes.txt`, so the green run covers the exact files
  reviewed.
- Ledger: `docs/reviews/2026-10-03-task917-server-records-previous-price.review-ledger.json` (`check:review-ledger` exit 0).
- The owner's own check on listing #22 shows 900 ALL with 1 000 ALL struck and the "Ціну знижено" badge on the detail
  page. That is the §13.2 reduction arm, observed live on localhost.
- The owner's remarks in the same message concern **918** and **912** (old price beside rather than above; no old price
  in the contact card). Neither is 917 scope. Both kickoffs are amended under owner decision **D89-9**.
