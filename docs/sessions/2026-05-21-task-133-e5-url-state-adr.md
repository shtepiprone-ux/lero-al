# Task 133 — Epic E.5 — URL-state vs Server-state ADR

**Date:** 2026-05-21
**Epic:** E — Search, Filters & Saved Search UX
**Type:** Documentation only — no feature code

## Summary

Wrote ADR-001 in `docs/state-authority.md` settling the long-term architecture for listings filter state.

## Decision

**Stay with model (a): URL-state → Server → UI.**

Do not adopt React Query / SWR for the listings filter path.

## Files changed

| File | Change |
|---|---|
| `docs/state-authority.md` | Added ADR-001 section (trade-offs, recommendation, migration implications) |
| `docs/backlog.md` | Task 133 marked complete; Epic E marked CLOSED; Next = Task 134 |

## Key trade-offs recorded

- Model (a) gives deep-links, back-button, RSC streaming, and zero state duplication for free.
- Model (b) would remove the listings grid from RSC, require URL-mirror sync, and add cache invalidation complexity.
- `/api/listings` already covers the valid client-fetch use case (progressive page 2+ loading).

## Trigger to revisit

Only if BOTH: P75 filter-transition latency >400ms on production AND the listings grid is extracted to a standalone RSC segment.

## Acceptance criteria

- [x] ADR committed to `docs/state-authority.md` with clear recommendation.
- [x] Session log written.
- [x] `docs/backlog.md` updated (Task 133 ✅, Epic E CLOSED, Next = Task 134).
