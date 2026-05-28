# Sprint 15 — Deferred Polish + Footer Admin (owner directive 2026-05-28)

Owner: shtepiprone@gmail.com
Filed: 2026-05-28 (after Sprint 14 + follow-ups 265/266 closed)
Tasks: **247, 267, 233, 232, 229, 230, 241, 249** (8 tasks)

> **All 8 tasks follow the established governance:**
> - `docs/agent-contract.md` clause 6a — Positive + Negative flow gate (Task 255)
> - `docs/agent-contract.md` clause 10 — Files Changed table in session log; orchestrator emits commit commands (Task 264)
> - Notes 18/19/20/21/22/23 in `docs/ai-behavior.md`

## Tasks

| # | Task | Epic | Size | Owner-action |
|---|---|---|---|---|
| 247 | EE.1 — Footer admin manager (CRUD via admin) | EE (Footer Admin) | M-L | **OWNER SQL** for new footer table(s) — Sonnet emits |
| 267 | Phone test coverage — 9-digit cases in `normalizeNational()` | CC (Combobox v2) | XS | None |
| 233 | W.6 — Double vertical gap between filter bar and status tabs | W (Filter Bar Polish) | XS | None |
| 232 | W.5 — Fix horizontal clipping of `.listings-filter-bar`; canonical adaptive form | W | S/M | None |
| 229 | W.2 — One global "Reset filters" on `/listings` (collapses 2 buttons → 1) | W | S | None |
| 230 | W.3 — Add `area_asc` sort option to canonical catalog (×4 locales) | W | S | None |
| 241 | AA.1 — Currency picker moves from filter panels → user profile | AA (Currency in Profile) | M | None (built on closed Epic M) |
| 249 | FF.2 — Toast audit v2: fill gaps T.1 (Task 205) missed | FF (UX Reactivity & Toasts v2) | M (refactor) | None |

## Run order (owner-action-first)

1. **247 (EE.1)** — emit footer table SQL for owner; owner runs in parallel with Sonnet's UI work
2. **267 (phone tests)** — small, independent
3. **233 (W.6)** — vertical gap (XS)
4. **232 (W.5)** — toolbar overflow (S)
5. **229 (W.2)** — single global reset (S)
6. **230 (W.3)** — sort option add (S)
7. **241 (AA.1)** — currency profile move (M)
8. **249 (FF.2)** — toast audit v2 (M)

W-epic tasks (233/232/229/230) are bundled by touching the same files (`ListingsFilterBar.tsx`, `ListingsFilters.tsx`, `FiltersPanel.tsx`, `filterEngine.ts`) — run sequentially to avoid merge conflicts in Sonnet's working tree.

## Exit criteria (Sprint 15)

- All 8 tasks closed with orchestrator-verified diff + Files Changed table + Positive/Negative flow parity.
- `docs/backlog.md` updated; one session log per task under `docs/sessions/`.
- Pending Action Items resolved (EE.1 SQL applied OR documented as deferred).
- No regression to Sprint 13/14 work.

## Out of scope for Sprint 15

- Large refactors (Z.1 modal canonical pattern, CC.2 multi-lang search, BB.2 message flow, Y.2-Y.3 listing form lifecycle, W.4 canonical Combobox migration, DD.1 admin audit hygiene) → Sprint 16.
- New product features (this is polish + governance debt).
- Performance work (Epic U closed).

## Sprint 16 preview (deferred to next)

W.4 (canonical Combobox migration), Z.1 (modal global refactor), CC.2 (multi-lang search), BB.2 (listing inquiries message flow), Y.2-Y.3 (listing form lifecycle UX), DD.1 (admin audit hygiene using Task 250 audit table).
