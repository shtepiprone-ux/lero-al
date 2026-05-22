# Session Archive: Task 150 — I.3 Helper API Evolution Trigger — 2026-05-22

## Task

**Task 150 — Epic I.3 — Helper API evolution trigger (documentation only)**
Type: Documentation | No code changes.

## What was done

### `docs/domain-rules.md` — "Future ListingStateMachine evolution trigger" (added in I.2)

The trigger conditions under which the helper API must migrate from
`(status: ListingStatus) => boolean` to `(listing: ListingSnapshot) => boolean`:

1. Publishing workflows arrive (scheduled publish, draft → review → published).
2. Moderation automation (auto-hide, auto-flag based on listing fields).
3. Lifecycle transitions needing listing context beyond `status` (`expires_at`, `featured_until`).
4. Listing automation (auto-expire, auto-renew, dynamic price rules).

Until then: keep the current `status`-only signatures.

### `docs/backlog.md §Follow-ups`

Placeholder added: "I.3 deferred — Listing status helper API migration. Trigger: see domain-rules.md."

## Acceptance criteria

- [x] Trigger conditions written explicitly in `docs/domain-rules.md`.
- [x] Placeholder backlog entry added to §Follow-ups.
- [x] 0 code changes; 0 new lint warnings. **Epic I — CLOSED.**
