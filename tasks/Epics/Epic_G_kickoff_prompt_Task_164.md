# Epic G — follow-up kickoff: Task 164 (P1 — Epic G correctness + proper closure)

> **Why this exists:** Orchestrator review found Epic G was marked CLOSED while broken and
> incomplete. After Task 163 makes the repo build, this task fixes the remaining correctness
> gaps and only then re-closes the epic. **Depends on Task 163.**

```
You are Claude Code Sonnet 4.6 working in the `lero-al` project.

Context: Epic G correctness + closure — Task 164. DEPENDENCY: Task 163 must be done
(repo builds; G.2 profile section actually renders).

Hard contract (do NOT violate): do not change the scope below; do not add new architectural
decisions on your own; execute the acceptance criteria literally; if something is ambiguous,
STOP and ask. Update docs/backlog.md + docs/sessions/. Commit + push.

Required pre-read:
1. tasks/Epics/Epic_G_Recently_Viewed_Listings.md (G.2 + G.3 scope).
2. docs/sessions/2026-05-22-task-138/139/140-*.md (what was claimed).
3. docs/ui-rules.md, docs/component-rules.md, docs/responsive-screenshot-governance.md.
4. src/modules/listings/components/RecentlyViewedSection.tsx, ClearRecentlyViewedButton.tsx.

Scope (exactly these fixes):

1. SCOPE FIX — clear-history button must be PROFILE-ONLY.
   Currently `RecentlyViewedSection` renders `<ClearRecentlyViewedButton />` in its header
   whenever items exist, so it ALSO appears on the listing-detail page. Per Epic G.3, "Clear
   history" belongs only to the profile section.
   - Add a boolean prop to `RecentlyViewedSection` (e.g. `showClear?: boolean`, default false).
   - Render `<ClearRecentlyViewedButton />` only when `showClear` is true.
   - Cabinet usage (`src/app/[locale]/cabinet/page.tsx`) passes `showClear` (+ keeps
     `showEmptyState`); listing-detail usage does NOT.

2. DB MIGRATION — apply / confirm applied.
   Task 138 documented the `recently_viewed` table + RLS + `record_recently_viewed` RPC as
   "pending Supabase run". The auth path is non-functional until applied.
   - Confirm whether the SQL (in docs/sessions/2026-05-22-task-138-g1-recently-viewed-tracking.md)
     is applied in Supabase. If not, apply it (per the Task 119 dashboard-SQL pattern) and record
     confirmation in the session log. If you cannot apply it, STOP and ask the user — do NOT
     re-close the epic with an unapplied migration.

3. RESPONSIVE VALIDATION — produce evidence for the 7 required breakpoints
   (320, 375, 390, 768, 1280, 1440, 2560) for the recently-viewed section on BOTH listing detail
   and profile, per docs/responsive-screenshot-governance.md (use the project's
   `screenshots:responsive` tooling). Confirm: mobile horizontal scroll → grid 2/3/4 at sm/md/lg;
   no overflow/clipping; current listing excluded on detail.

4. LOCALE PARITY — confirm `messages/{sq,en,uk,it}.json` all contain the 8 recently_viewed_* keys
   with real translations (already present at HEAD — just verify the gate passes; do not duplicate).

Acceptance criteria (verify literally):
- Clear button appears on profile only, never on listing detail.
- `recently_viewed` table + RLS + RPC confirmed live in Supabase (or task stopped + user asked).
- Screenshot evidence for all 7 breakpoints attached/referenced in the session log; no clipping.
- `npm run typecheck` 0 new errors; `npm run lint` 0 new warnings;
  `npm run governance` PASS (localization + components + responsive + ssr).
- ONLY after all the above pass: mark Epic G CLOSED in tasks/Epics/Epic_G_Recently_Viewed_Listings.md
  and docs/backlog.md, with an accurate session log
  (docs/sessions/2026-05-22-task-164-epic-g-closure.md). Commit + push.

Out of scope: per-item delete; any new feature. Follow docs/ai-behavior.md and docs/orchestrator-role.md.
```
