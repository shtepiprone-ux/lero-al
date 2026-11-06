# Sprint 20 — Task 286 kickoff (Favorites collections UX revamp — MVP)

> **Mandatory rules:** `docs/agent-contract.md` clause 6a (Positive + Negative flow) + clause 10 (Task 264 commit hand-off — Sonnet writes a "Files Changed" table, NEVER emits/runs git; orchestrator emits explicit-path commits; owner runs them).

> **Shared hard contract:** You are Claude Code Sonnet 4.6 in `lero-al`. Read `docs/agent-contract.md` FIRST. This is a **mixed UI + state + DB** task — pre-read: UI bundle (`ui-rules.md`, `component-rules.md`, `qa-rules.md`) + `data-access-rules.md` + `rls-rules.md` + `state-authority.md` + `ai-behavior.md` Note 19/20. No scope change; STOP & ASK if ambiguous; literal AC; self-validate.

> **⚠️ BOUNDED MVP. The plan-aware Free/Pro/Expert roadmap is OUT OF SCOPE for this task** — it
> needs a dedicated Opus planning pass + an epic. Ship the MVP UX slice below, then STOP & ASK the
> orchestrator to file the roadmap epic + follow-ups.

---

```
Type:        feature / UX revamp — MVP slice
Priority:    MEDIUM
Area:        favorites collections — CollectionsSection / SaveToCollectionButton / FavoritesShell
```

## Why this task exists
Favorites collections already exist (`CollectionsSection.tsx`, `SaveToCollectionButton.tsx`,
`FavoritesShell.tsx`, `FavoritesTypeFilter.tsx`) but the UX is rough (it was flagged in the no-ellipsis
audit — `CollectionsSection.tsx:129` also carries a `py-10` debt that Task 283 fixes). The owner wants
a cleaner collections UX. This task ships a bounded MVP polish of the EXISTING collections feature;
the monetized Free/Pro/Expert tier roadmap is deferred to a dedicated epic.

## MVP scope (the ONLY thing this task ships)
A focused UX pass on the existing collections feature, on canonical primitives + the Task-294 filter
model where collections use filters:
1. Clean, consistent collection cards/list (canonical `Card`/`Button`, no local clones, no ellipsis
   truncation of localized names — wrap instead).
2. Create / rename / delete a collection + add/remove a listing to/from a collection — verify each
   path works end-to-end with success/error/empty/loading states (these likely exist; preserve +
   polish, do NOT remove — Note 20).
3. Empty states (no collections yet; collection with no listings) with localized copy + a clear CTA.
4. Mobile 320–390 `uk` usability for all collection actions.

## Explicitly DEFERRED to a follow-up epic (do NOT build; list for the orchestrator)
- Plan-aware gating (Free vs Pro vs Expert limits — e.g. max collections, sharing).
- Shared/public collections, collaboration, collection-level analytics.
- Any pricing/plan/entitlement logic or new billing surface.
- DB schema changes for tiers/limits.

## Current behavior to preserve (Note 19/20 — inventory in the log)
- Every existing collection action (create, rename, delete, add listing, remove listing, filter by
  type via `FavoritesTypeFilter`) MUST remain — inventory before/after.
- The favorite-heart sync (Task 279) and `FavoriteButton` behavior stay intact.
- RLS: a user sees/edits only their own collections (no weakening).
- Coordinate with Task 283: it removes the `py-10` in `CollectionsSection.tsx:129`. If 283 already
  landed, build on it; if not, do NOT fight over that line — use canonical spacing and note it.

## Positive flow (happy path)
User opens `/[locale]/favorites` → sees their collections (or a clean empty state with a "create"
CTA) → creates a collection → adds a listing via `SaveToCollectionButton` → opens the collection →
sees the listing → can rename/remove/delete → all with localized success toasts and correct empty
states.

## Negative flow (implement + verify each)
- **Empty:** no collections → empty state + CTA; collection with no listings → its own empty state.
- **Cancel/dismiss:** create/rename dialog Esc/backdrop/Cancel → no mutation.
- **Validation:** empty/duplicate collection name → inline error, localized, no write.
- **Server error:** error toast (localized), state unchanged, retry possible.
- **Permission:** not-owner / unauthenticated → guarded (RLS); no other user's collections.
- **Loading/double-submit:** pending state, no duplicate collection created.
- **Mobile 320/375/390 `uk`:** all actions reachable, names wrap (no ellipsis), 44px targets.

## Required investigation (PASTE in the session log)
```
sed -n '1,160p' src/modules/listings/components/CollectionsSection.tsx
cat src/modules/listings/components/SaveToCollectionButton.tsx
sed -n '1,120p' src/modules/listings/components/FavoritesShell.tsx
grep -rn "collection" src/modules/listings --include="*.ts" --include="*.tsx" | grep -iE "action|insert|update|delete|from(" | head
grep -rn "collections" scripts/*.sql 2>/dev/null
# RLS posture on the collections table(s):
```
Inventory every collection control + its server action + the table/RLS. This is the before-state.

## Scope (files Sonnet may touch)
- `CollectionsSection.tsx`, `SaveToCollectionButton.tsx`, `FavoritesShell.tsx`, `FavoritesTypeFilter.tsx` (UX polish, canonical primitives, states).
- Related collection server actions ONLY for bugfixes uncovered (not new features); STOP & ASK before changing behavior.
- `messages/{sq,en,uk,it}.json` for new/changed labels (all four).
- `docs/backlog.md` (closure) + `docs/sessions/2026-05-29-task-286-favorites-collections-mvp.md` (NEW).

## Out of scope (do NOT touch)
- Plan tiers / entitlements / pricing / billing (deferred epic).
- Collection sharing / collaboration / public collections.
- DB schema changes for tiers.
- `FavoriteButton` heart-sync logic (Task 279 — keep intact).
- Task 283's `py-10` line (coordinate, don't fight).

## Acceptance criteria (literal)
- All existing collection actions (create/rename/delete/add/remove/filter) preserved + working end-to-end (Note 20 before/after inventory).
- Clean collection + empty states; canonical primitives; no local clones; no ellipsis truncation of localized names.
- All negative branches (cancel, validation, server error, permission, loading, double-submit) implemented + verified.
- RLS owner-only preserved; no plan/billing logic added.
- New/changed copy localized sq/en/uk/it; 7 breakpoints verified in `uk`.
- `npx tsc --noEmit` → 0. `npm run build` → passes. `npm run lint` → 0 new vs baseline. Governance scans: no NEW violations.
- Deferred roadmap list for the orchestrator is in the session log.
- Note 18 self-validation + AC self-audit + "Files Changed" table (Task 264).
- Self-validation verdict: `Self-validation: tsc=0 · build=passes · collection actions preserved · states complete · RLS intact · locales=4 · breakpoints=7 · scope=clean(MVP) · PASS`.

## Final report required
1. Files Changed table. 2. Before/after collection-control inventory. 3. States implemented (empty/loading/error/success/cancel). 4. RLS owner-only confirmation. 5. Deferred roadmap list (for the epic). 6. Locale + breakpoint verification. 7. Coordination note with Task 283 (`py-10`).

Do NOT emit git commands. Do NOT run git. Do NOT build plan tiers / sharing / billing. STOP & ASK the orchestrator to file the roadmap epic + follow-ups.
