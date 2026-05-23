# Epic P — kickoff prompts (non-Sprint-9 tasks)

> P.1 (181), P.2 (182), P.4 (183) ship in Sprint 9 — see their individual kickoff files. This file holds
> the remaining task. Shared hard contract: no scope change; no invented architecture (stop & ask if
> ambiguous); literal AC; update docs/backlog.md + docs/sessions/; 0 new lint/typecheck errors;
> governance PASS; locale parity sq/en/uk/it; responsive 320/375/390/768/1280/1440/2560 where UI; Global
> Change Verification Rule; commit + single `git add -A` then `git log -1` (owner runs git/SQL).

## Task 185 — P.3 — Clear stale profile name in header after self-delete (Note 19)

```
You are Claude Code Sonnet 4.6 working in `lero-al`.

Hard contract: (see top of this file). Additionally: fix via the centralized auth layer — NO forced
reload to clear the header (Auth Lifecycle + No Fake Fixes rules). If Tasks 181/182 already hardened the
AuthContext lifecycle, REUSE that — do not re-patch locally.

Pre-read:
- src/components/layout/Header.tsx (where the profile name renders from auth state)
- src/modules/auth/context/AuthContext.tsx (auth/session state after sign-out/delete)
- the self-delete action in src/modules/cabinet/actions/index.ts (+ its redirect)
- docs/ai-behavior.md (Auth Lifecycle Rules), docs/state-authority.md

Problem: after a user deletes their own account they are redirected to the homepage, but the header still
shows their old profile name (stale auth/session state).

Scope: ensure account deletion clears the client auth state so the header immediately shows the
signed-out state on redirect. Fix deterministically at the auth layer.

Acceptance criteria:
- After self-delete + redirect, the header shows the signed-out state (no stale name), no manual refresh.
- No forced-reload hack; fixed via the centralized auth layer.
- 0 new lint/typecheck errors; npm run build passes; all four locales; all 7 breakpoints.

Out of scope: favorite flow (181), contact card (182), canonical URL (183).
```

## Task 212 — P.5 — Inline "Create collection" flow from "Add to collection" (found 2026-05-23)

> New owner note (2026-05-23): on the listing detail page, after clicking "Add to collection"
> (`SaveToCollectionButton`), the user should be able to CREATE a new collection inline (better UX),
> not only pick from existing ones. Collections infra exists from Task 136 (F.2): `SaveToCollectionButton`,
> `CollectionsSection`, the `collections`/`collection_items` tables + actions.

```
You are Claude Code Sonnet 4.6 working in `lero-al`.
Hard contract: (see top of this file). Reuse the existing collections actions/queries (Task 136) and the
canonical Dialog/Combobox/Input primitives (docs/ui-rules.md §0) — do NOT add a parallel collections
implementation or a new modal pattern. If the create+assign should be one atomic action vs two calls is
ambiguous, STOP and ask.

Pre-read: src/modules/listings/components/SaveToCollectionButton.tsx; the collections server actions +
queries and `CollectionsSection` from Task 136 (see sessions/2026-05-22-task-136-f2-favorites-collections.md);
docs/ui-rules.md §0; docs/component-rules.md; docs/rls-rules.md (collection ownership).

Scope: in the "Add to collection" picker opened from the listing detail page, add an inline "Create
collection" affordance (name input → create → the listing is added to the new collection in one flow).
Keep the existing pick-from-existing behavior. Localize all new strings × 4.

Acceptance criteria:
- From the detail-page "Add to collection" button a user can create a new collection inline and the
  listing is added to it, without leaving the flow; existing-collection selection still works.
- Reuses Task 136 actions/queries + canonical primitives; no parallel collections code; RLS respected.
- 0 new lint/typecheck errors; npm run build passes; all four locales; all 7 breakpoints.

Out of scope: redesigning the collections data model; the favorites page collections UI (unchanged).
```
