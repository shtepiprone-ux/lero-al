# Sprint 19 — Task 284 kickoff (Admin surfaces unification + Support/Inquiries ambiguity)

> **Mandatory rules:** `docs/agent-contract.md` clause 6a (Positive + Negative flow) + clause 10 (Task 264 commit hand-off — Sonnet writes a "Files Changed" table, NEVER emits/runs git; orchestrator emits explicit-path commits; owner runs them).

> **Shared hard contract:** You are Claude Code Sonnet 4.6 in `lero-al`. Read `docs/agent-contract.md` FIRST. This is an **admin table / admin control** task — pre-read that bundle from `docs/rule-index.md` (`ui-rules.md`, `component-rules.md`, `component-governance.md` §11 canonical `AdminTableRow`, `domain-rules.md`, `rls-rules.md`, `qa-rules.md`, `ai-behavior.md` Note 22). No scope change; STOP & ASK if ambiguous; literal AC; self-validate.

> **⚠️ This task has a DISCOVERY phase that may surface a product decision (what is "Support" vs
> "Inquiries"?). If the two surfaces represent genuinely different domains, STOP & ASK the owner
> before merging or deleting either — do NOT silently collapse one into the other.**

---

```
Type:        refactor (admin consistency) + product-ambiguity resolution
Priority:    HIGH
Area:        admin shell / admin tables / Support + Inquiries managers
```

## Why this task exists
The admin panel grew organically: 16 route groups, multiple `Admin*Manager` components with
divergent table patterns, and a specific ambiguity — both `AdminInquiriesManager.tsx` and
`AdminSupportManager.tsx` exist and it is unclear to the owner what each is for and whether they
overlap. Sprint 18 established canonical primitives (Task 282) and the canonical multi-select
filter + counter (Task 294); this task brings the admin tables onto those canonical patterns and
resolves the Support/Inquiries ambiguity.

## Goal
1. **Resolve Support vs Inquiries.** Determine, from code + DB tables + routes, what each surface
   manages (support tickets vs listing/contact inquiries vs sales inbox). Produce a clear
   decision: keep both with distinct, documented purposes (rename labels/nav for clarity) OR merge
   if they are the same domain. **Document the decision; STOP & ASK if it is a real product merge.**
2. **Unify admin tables onto the canonical `AdminTableRow` pattern** (`component-governance.md §11`)
   and the canonical multi-select filter + count model from Task 294 — WITHOUT removing any
   existing admin capability (Note 22).

## Required investigation (PASTE in the session log) — Note 22 inventory for EVERY admin table touched
```
ls src/app/admin
grep -rn "AdminInquiriesManager\|AdminSupportManager" src/app/admin
# What table/RPC does each read/write?
grep -rn "from('\|\.from(\"" src/components/admin/AdminInquiriesManager.tsx src/components/admin/AdminSupportManager.tsx
grep -rn "support_tickets\|inquiries\|contact_messages\|sales_inbox\|listing_contact_events" src --include="*.ts" --include="*.tsx" | head -40
cat src/components/admin/AdminSidebar.tsx        # nav entries + ordering
sed -n '1,60p' docs/component-governance.md      # canonical AdminTableRow pattern (§11)
```
For EACH admin table you touch, inventory in the log (Note 22): columns + order, row click
behavior, row actions, inline controls (status/role switchers), filters, search, pagination, sort,
empty state, loading state, mobile layout. This is the before-state; reproduce the after-state and
prove every action is still reachable.

## Current behavior to preserve (Note 20/22 — CRITICAL)
- Every admin row action, status/role switcher, filter, search box, sort, and pagination control
  that exists today MUST remain reachable after the change. "Cleaning up the row" = task failure.
- Every RLS / admin-role guard stays intact (no weakening — `rls-rules.md`).
- The sidebar must still link to every existing admin surface (rename labels only if the decision
  requires it; do not drop a destination).

## Positive flow (happy path)
Admin opens each refactored table → sees the same columns/actions, now on the canonical pattern →
filters use the Task-294 multi-select + correct count → row actions (edit/approve/reject/status/
delete) work exactly as before → Support and Inquiries each have a clear, documented purpose + label.

## Negative flow (implement + verify each)
- Permission-denied / non-admin → existing guard redirects (no admin data flash).
- Empty list / no results → existing empty state.
- Filter with no matches → empty state, count correct.
- Server error on a row action → existing error toast (localized), no silent failure.
- Pagination beyond last page, search with no hits, sort toggling → all preserved.
- Mobile 320px `uk` → tables/cards usable, actions reachable.

## Scope (files Sonnet may touch)
- `src/components/admin/AdminInquiriesManager.tsx`, `AdminSupportManager.tsx` (resolve ambiguity).
- Admin table components being unified onto the canonical pattern (list each in the log; do them in
  small, reviewable batches — you MAY split into follow-up tasks if the surface is large: STOP & ASK
  the orchestrator to file Task 295+ rather than ballooning one diff).
- `src/components/admin/AdminSidebar.tsx` (labels/nav only if the decision requires).
- `docs/backlog.md` (closure) + `docs/sessions/2026-05-29-task-284-admin-unification.md` (NEW).
- A `docs/` note documenting the Support-vs-Inquiries decision (in `architecture.md` or `domain-rules.md`).

## Out of scope (do NOT touch)
- Sprint 18 files mid-flight (coordinate: 284 runs after Sprint 18 lands).
- RLS policy changes, Supabase dashboard, email templates, service-role usage.
- Listing/favorites/auth product features.
- Any actual deletion of an admin capability without owner authorization (STOP & ASK).

## Acceptance criteria (literal)
- Support vs Inquiries: a documented decision exists; labels/nav are unambiguous; if merged, the owner approved it (STOP & ASK evidence in the log); if kept separate, each has a distinct documented purpose.
- Admin tables touched are on the canonical `AdminTableRow` pattern + Task-294 filter/count model; every pre-existing column/action/filter/search/sort/pagination is preserved (Note 22 before/after inventory in the log).
- No RLS/admin-guard weakening; no admin-data flash for non-admins.
- `npx tsc --noEmit` → 0. `npm run build` → passes. `npm run lint` → 0 new vs baseline. Governance scans show no NEW primitive/tailwind violations introduced.
- All four locales render; 7 breakpoints verified in `uk`.
- Note 18 self-validation + AC self-audit + "Files Changed" table (Task 264) in the session log.
- Self-validation verdict: `Self-validation: tsc=0 · build=passes · admin actions preserved · Support/Inquiries documented · RLS intact · locales=4 · breakpoints=7 · scope=clean · PASS`.

## Final report required
1. Files Changed table. 2. Support-vs-Inquiries decision + evidence. 3. Per-table before/after Note-22 inventory. 4. Canonical-pattern conversions list. 5. Filter/count unification (Task 294 reuse). 6. RLS/guard intact confirmation. 7. Locale + breakpoint verification. 8. Any follow-up tasks proposed (if the admin surface was too large for one diff).

Do NOT emit git commands. Do NOT run git. Do NOT remove an admin capability without owner sign-off. STOP & ASK before merging Support/Inquiries or splitting this into follow-ups.
