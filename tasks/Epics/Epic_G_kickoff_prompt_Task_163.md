# Epic G — follow-up kickoff: Task 163 (P0 — recover corrupted working tree + restore buildability)

> **Why this exists:** Orchestrator review of Epic G (2026-05-22) rejected the delivery.
> The working tree is corrupted (≈18 tracked files truncated mid-content, incl. `package.json`),
> AND the committed HEAD does not build (G.2 storage/query file never committed; `CabinetShell`
> receives a prop it doesn't declare). This task restores a clean, building baseline.
> **Blocks Task 164** (proper Epic G closure).

```
You are Claude Code Sonnet 4.6 working in the `lero-al` project.

Context: Epic G recovery — Task 163. The repo is in a broken state and must be made to build again.

Hard contract (do NOT violate): do not change the scope below; do not add new architectural
decisions on your own; execute the acceptance criteria literally; if something is ambiguous or
a file might contain intentional uncommitted work, STOP and ask — do not invent scope or silently
discard work. Update docs/backlog.md + add docs/sessions/ log. Commit + push.

=== PROBLEM 1: working-tree corruption (truncated files) ===
The following tracked files are truncated mid-content in the working tree (no EOF newline,
unbalanced braces; several cut mid-token, e.g. package.json ends `"vite": `, cabinet/page.tsx
ends `regions={regio`, ListingContact.tsx ends `openAuthSheet(`). Their HEAD versions are intact.

  package.json, package-lock.json, vercel.json, src/app/globals.css, src/types/database.ts,
  src/app/[locale]/cabinet/page.tsx, src/app/[locale]/favorites/page.tsx,
  src/app/[locale]/listings/[slug]/page.tsx,
  src/modules/cabinet/components/CabinetShell.tsx,
  src/modules/cabinet/components/ProfileTab.tsx,
  src/modules/listings/components/FavoriteButton.tsx,
  src/modules/listings/components/FavoritesShell.tsx,
  src/modules/listings/components/FavoritesTypeFilter.tsx,
  src/modules/listings/components/ListingContact.tsx,
  src/modules/listings/components/RecentlyViewedSection.tsx,
  src/modules/listings/components/__tests__/FavoriteButton.test.tsx,
  src/modules/listings/lib/favoritesQueries.ts,
  src/modules/notifications/components/NotificationItem.tsx

Steps:
1. Do NOT build on or hand-edit the truncated files. First triage: for every path in
   `git diff --name-only HEAD`, check whether the working copy ends with a newline and parses.
   Confirm the truncation set above; report any file that is NOT actually truncated.
2. DO NOT touch / DO NOT restore these (orchestrator-authored, intentional): `CLAUDE.md`,
   `docs/orchestrator-role.md`, `tasks/Epics/Epic_G_kickoff_prompt_Task_163.md`,
   `tasks/Epics/Epic_G_kickoff_prompt_Task_164.md`,
   `tasks/Epics/Epic_G_Recently_Viewed_Listings.md` (its header is intentionally set to REOPENED).
   Leave all of these as-is.
3. For each truncated file above: it is corruption with no salvage value EXCEPT for the
   re-applied edits in PROBLEM 2. BEFORE restoring the non-Epic-G ones
   (`favorites/page.tsx`, `FavoriteButton.tsx`, `FavoritesShell.tsx`, `FavoritesTypeFilter.tsx`,
   `FavoriteButton.test.tsx`, `favoritesQueries.ts`, `ListingContact.tsx`, `NotificationItem.tsx`,
   `database.ts`, `globals.css`, `vercel.json`, `package.json`, `package-lock.json`),
   verify via `git stash list`, `git reflog`, and branch tips that none hold intentional
   uncommitted work. If any does — STOP and ask the user. Otherwise restore from HEAD:
   `git restore --source=HEAD --worktree -- <file>`.
4. Also verify `docs/backlog.md` and `docs/analytics-rules.md` integrity — BOTH are truncated in
   the working tree (backlog HEAD=206 lines vs WT=201, cut mid-URL). Restore both from HEAD.
   Then, in your final backlog update, flip the stale "Epic G — CLOSED" lines to
   "Epic G — REOPENED (see Task 163/164)" so backlog matches the epic's REOPENED status.

=== PROBLEM 2: HEAD does not build (Epic G G.2 was never committed cleanly) ===
At HEAD: (a) `src/modules/listings/components/RecentlyViewedSection.tsx` imports
`../lib/recentlyViewedQueries`, but that file is UNTRACKED (never committed) → module not found;
(b) `cabinet/page.tsx` passes `profileRecentlyViewed=...` to `<CabinetShell>`, but `CabinetShell`
does not declare/forward that prop → TS error AND the profile section never renders.

The untracked file `src/modules/listings/lib/recentlyViewedQueries.ts` is intact and correct —
KEEP it and `git add` it (do not rewrite it).

Re-apply the G.2 wiring that was lost (these are the only intended edits on top of HEAD):

  A) src/modules/cabinet/components/CabinetShell.tsx
     - import: `import { useState, type ReactNode } from 'react'`
     - Props interface: add `profileRecentlyViewed?: ReactNode`
     - destructure it in the component signature
     - in the profile-tab render, forward it:
       `<ProfileTab ... onAvatarChange={setAvatarUrl} recentlyViewed={profileRecentlyViewed} />`

  B) src/modules/cabinet/components/ProfileTab.tsx
     - import: add `type ReactNode`
     - Props interface: add `recentlyViewed?: ReactNode`
     - destructure it; render it immediately BEFORE the danger-zone block:
         {recentlyViewed && (
           <div className="flex flex-col gap-4">
             {recentlyViewed}
           </div>
         )}

  C) src/app/[locale]/listings/[slug]/page.tsx
     - import: `import { RecentlyViewedSection, RecentlyViewedSkeleton } from '@/modules/listings/components/RecentlyViewedSection'`
       (`Suspense` is already imported at HEAD)
     - render directly above the `#similar-listings` block:
         {/* Recently viewed — streamed below the fold, excludes the current listing */}
         <Suspense fallback={<RecentlyViewedSkeleton />}>
           <RecentlyViewedSection currentListingId={listing.id} />
         </Suspense>

Do NOT add anything else (clear-button scope, DB migration, screenshots → Task 164).

Acceptance criteria (verify literally; do not just claim):
- `git diff --name-only HEAD` shows ONLY: the recovered files restored to HEAD, the 3 edits
  A/B/C above, the newly tracked `recentlyViewedQueries.ts`, and docs (backlog/session).
- No file in the repo is truncated (every source/config file ends with a newline and parses).
- `npm install` succeeds (lockfile restored); `npm run typecheck` → 0 errors
  (the 2 pre-existing Task-126 test-fixture errors may remain ONLY if they exist at HEAD —
  confirm by comparing to a clean HEAD checkout; introduce no new ones).
- `npm run build` succeeds.
- `npm run governance` PASS (at minimum governance:localization + governance:components + governance:ssr).
- Paste the actual command output (typecheck/build/governance) into the session log.
- Commit + push. Update docs/backlog.md + docs/sessions/2026-05-22-task-163-epic-g-recovery.md.

Out of scope: clear-button placement fix, DB migration, breakpoint screenshots, Epic G re-closure
→ Task 164. Follow docs/ai-behavior.md and docs/orchestrator-role.md.
```
