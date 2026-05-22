# Session Archive: Task 149 — I.2 Centralize Status Helpers — 2026-05-22

## Task

**Task 149 — Epic I.2 — Centralize listing status helpers**
Type: Refactor / Documentation | No new code — domain already complete.

## Grep verification

Searched for all `status === 'X'` listing status comparisons outside the domain module.

**Results:**

| Location | Check | Verdict |
|---|---|---|
| `ListingCard.tsx:66-71` | `status === 'sold'` / `status === 'rented'` | PERMITTED EXCEPTION — eslint-disable + comment (badge colors differ; `isListingClosed()` merges both) |
| `AdminListingsTable.tsx` | `STATUS_BADGE[listing.status]` | PERMITTED — display map (explicitly allowed per usage policy) |
| `AdminReportsManager.tsx` | `report.status === 'pending'` | OUT OF SCOPE — `ReportStatus`, not `ListingStatus` |
| `admin/support/page.tsx` | `tk.status === 'open'` | OUT OF SCOPE — `TicketStatus` |
| `applyListingTransition.ts` | `current.status === toStatus` | IN DOMAIN — transition engine internal, not scattered |
| All other locations | — | Use `isListingVisible`, `isListingArchived`, `isListingClosed`, etc. ✅ |

**Conclusion:** Domain is already fully centralized. `listingSemanticHelpers.ts` + `listingTransitionEngine.ts` exported through `domain/index.ts` cover all real business-logic consumers. No new code or migration required.

## Canonical API (confirmed)

```typescript
import {
  isListingVisible,      // status === 'active'
  isListingHidden,       // status === 'pending' || 'inactive'
  isListingArchived,     // status === 'archived'
  isListingClosed,       // status === 'sold' || 'rented'
  isListingEditableStatus,
  isListingReadonlyStatus,
  isTerminalListingStatus,
  isMarketClosedStatus,
  isModeratableStatus,
} from '@/modules/listings/domain'
```

## Deliverables

`docs/domain-rules.md` — new section "Listing Status Helpers — Canonical API":
- Full helpers table with what each replaces
- Permitted exceptions (display maps, DB query filters, individual badge colors)
- ListingStateMachine evolution trigger conditions

## Files changed

| File | Change |
|---|---|
| `docs/domain-rules.md` | New "Listing Status Helpers" section + evolution trigger |

## Acceptance criteria

- [x] Grep verification: no unguarded `status === 'X'` listing comparisons outside domain (documented above).
- [x] Single canonical import path confirmed: `@/modules/listings/domain`.
- [x] `docs/domain-rules.md` updated with helpers + evolution path.
- [x] `npm run typecheck` → 0 new errors (no code changes).
- [x] 0 new lint warnings.
