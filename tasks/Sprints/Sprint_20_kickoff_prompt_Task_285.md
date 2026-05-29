# Sprint 20 — Task 285 kickoff (Listing analytics — MVP read/display slice)

> **Mandatory rules:** `docs/agent-contract.md` clause 6a (Positive + Negative flow) + clause 10 (Task 264 commit hand-off — Sonnet writes a "Files Changed" table, NEVER emits/runs git; orchestrator emits explicit-path commits; owner runs them).

> **Shared hard contract:** You are Claude Code Sonnet 4.6 in `lero-al`. Read `docs/agent-contract.md` FIRST. This is a **mixed DB-read + UI** task — pre-read: `data-access-rules.md`, `rls-rules.md`, `domain-rules.md`, `qa-rules.md` (DB bundle) + `ui-rules.md`, `component-rules.md` (UI bundle) + `analytics-rules.md`. No scope change; STOP & ASK if ambiguous; literal AC; self-validate.

> **⚠️ BOUNDED MVP. The full analytics dashboard is OUT OF SCOPE for this task.** Ship the MVP
> slice below, then STOP & ASK the orchestrator to file follow-ups (Task 295+) for the rest.

---

```
Type:        feature (analytics read/display) — MVP slice
Priority:    MEDIUM
Area:        listing owner analytics — read layer on the existing events foundation
```

## Why this task exists
The write-side analytics foundation already exists: `listing_contact_events` + `trackListingContactEvent`
(`src/modules/listings/actions/contactEvents.ts`), `record_listing_view` RPC, and the view route
`src/app/api/listings/[slug]/view/route.ts`. Nothing surfaces these numbers to the listing OWNER.
This task ships the first read/display slice: per-listing view count + contact-event count, visible
to the listing owner in their cabinet.

## MVP scope (the ONLY thing this task ships)
1. **A read query/RPC** that returns, for a given owner, per-listing aggregate counts: total views
   and total contact events (grouped by `event_type` if cheap). Reuse existing tables; do NOT add
   new write paths. If an aggregate RPC is needed, propose it via SQL emitted to `scripts/` for the
   owner to apply (do NOT run SQL) — follow `data-access-rules.md` + `rls-rules.md` (owner sees ONLY
   their own listings' stats; enforce via RLS / `auth.uid()` ownership, never client-trust).
2. **A minimal display** in the owner's cabinet listing view: a small "views / contacts" stat on
   each of the owner's listing cards or a per-listing stats line. Canonical primitives only; no new
   chart library (a number + label is enough for the MVP — charts are a follow-up).

## Explicitly DEFERRED to follow-ups (do NOT build; list them in the log for the orchestrator)
- A full analytics dashboard page with time-series charts.
- Admin-side metric controls / global metrics.
- Date-range filtering, funnels, conversion rates, export.
- Any new chart dependency (would need `dependencies.md` approval).

## Current behavior to preserve
- The existing view-recording + contact-event tracking writes are untouched.
- Listing cards / cabinet listing list keep all current controls and behavior (Note 20).
- No anonymous exposure of owner analytics (RLS: owner-only).

## Positive flow (happy path)
Owner opens their cabinet listings → each listing shows its view count + contact count (their own
listings only) → numbers reflect the aggregated `listing_contact_events` + view data.

## Negative flow (implement + verify each)
- **Not the owner / not authenticated** → no stats returned (RLS denies); never another owner's data.
- **Listing with zero events** → shows `0` cleanly (not blank/broken).
- **Query error** → graceful fallback (stat hidden or "—"), no crash, logged.
- **Mobile 320px `uk`** → stat line fits, no overflow.

## Required investigation (PASTE in the session log)
```
cat src/modules/listings/actions/contactEvents.ts
sed -n '1,80p' src/app/api/listings/[slug]/view/route.ts
grep -rn "listing_contact_events\|record_listing_view\|views\b" src --include="*.ts" --include="*.tsx" | head -40
# existing cabinet listing list component(s):
grep -rln "cabinet" src/modules/listings src/modules/cabinet --include="*.tsx" | head
# RLS on listing_contact_events (from prior tasks 277/289):
grep -rn "listing_contact_events" scripts/*.sql 2>/dev/null
```
Document the existing RLS posture on `listing_contact_events` (Task 289 revoked anon access) and
design the owner-only read accordingly.

## Scope (files Sonnet may touch)
- A read query/RPC consumer in `src/modules/listings/...` (lib/queries or a new server action).
- `scripts/task-285-listing-analytics-read.sql` (NEW — ONLY if an aggregate RPC/view + RLS is needed; emitted for the owner to apply, NOT run).
- The owner's cabinet listing display component (add the stat line).
- `messages/{sq,en,uk,it}.json` for new labels (all four).
- `docs/backlog.md` (closure) + `docs/sessions/2026-05-29-task-285-listing-analytics-mvp.md` (NEW).

## Out of scope (do NOT touch)
- The full dashboard, admin metrics, charts, date ranges (follow-ups).
- The write-side event tracking.
- Any new chart/analytics dependency.
- Anonymous/public exposure of owner stats.

## Acceptance criteria (literal)
- Listing owner sees per-listing view + contact counts for THEIR listings only (RLS-enforced; verified a non-owner gets nothing).
- Zero-event listings show `0`; query errors degrade gracefully.
- Any SQL is emitted to `scripts/` (not run); RLS owner-only; `rls-rules.md` + `data-access-rules.md` honored.
- New labels localized sq/en/uk/it; 7 breakpoints in `uk`.
- `npx tsc --noEmit` → 0. `npm run build` → passes. `npm run lint` → 0 new vs baseline.
- Deferred-scope list for the orchestrator is in the session log (so follow-ups can be filed).
- Note 18 self-validation + AC self-audit + "Files Changed" table (Task 264).
- Self-validation verdict: `Self-validation: tsc=0 · build=passes · owner-only RLS · MVP stats shown · locales=4 · breakpoints=7 · scope=clean(MVP) · PASS`.

## Final report required
1. Files Changed table. 2. The read query/RPC + RLS design. 3. Where stats display (file:line). 4. Owner-only enforcement evidence. 5. Deferred follow-up list. 6. Locale + breakpoint verification. 7. SQL emitted (path) if any.

Do NOT emit git commands. Do NOT run git or SQL. Do NOT build the full dashboard. STOP & ASK the orchestrator to file follow-ups for deferred scope.
