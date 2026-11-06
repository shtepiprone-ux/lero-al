# Epic G — follow-up kickoff: Task 165 (responsive-screenshot evidence for recently-viewed)

> **Why this exists:** Epic G closed (Task 164) with one carried-forward item. The required
> 7-breakpoint responsive screenshot evidence could not be produced because `RecentlyViewedSection`
> is an async Server Component that calls `getUser()` + Supabase, so the Storybook-based
> `screenshots:responsive` tooling cannot render it directly (no auth/DB in Storybook). This task
> produces the evidence via a fixture-backed presentational story. **Not a feature gap — a
> verification/governance debt.**

```
You are Claude Code Sonnet 4.6 working in the `lero-al` project.

Context: Epic G residual — Task 165. Produce the 7-breakpoint responsive screenshot evidence for
the recently-viewed grid that Task 164 deferred.

Hard contract (do NOT violate): do not change the scope below; do not add new architectural
decisions on your own; execute the acceptance criteria literally; if something is ambiguous,
STOP and ask. Update docs/backlog.md + add docs/sessions/. Commit + push.

Required pre-read:
1. tasks/Epics/Epic_G_Recently_Viewed_Listings.md (G.2 responsive coverage; 7 breakpoints).
2. docs/storybook-governance.md + docs/responsive-screenshot-governance.md
   (and confirm the exact governance section that bars snapshotting auth/DB Server Components —
   cite it accurately in the session log; Task 164 referenced "§12").
3. docs/component-coverage-matrix.md (Storybook coverage tracking).
4. src/modules/listings/components/RecentlyViewedSection.tsx (current Server Component).
5. The existing fixture pattern (e.g. .storybook fixtures / listing.fixture.ts) and an existing
   ListingCard story — REUSE; do not invent a new fixture system.

Scope:
1. Split the presentational layout out of `RecentlyViewedSection` into a small client-renderable
   presentational component (e.g. `RecentlyViewedGrid`) that takes already-fetched listings as a
   prop and contains the responsive markup (mobile horizontal scroll → sm/md/lg grid 2/3/4,
   no-scrollbar, optional header + optional clear slot). The Server Component keeps fetching
   (auth/DB) and renders the presentational component. NO behavior change to the live feature.
2. Add a Storybook story for the presentational component using FIXTURE listings (no auth, no DB):
   states = populated grid (with header + clear slot) and empty state; cover all 4 locales via the
   existing Storybook locale toolbar.
3. Run `npm run screenshots:responsive` (or the storybook variant) to capture all 7 breakpoints:
   320, 375, 390, 768, 1280, 1440, 2560.

Acceptance criteria (verify literally; reference the artifacts in the session log):
- Presentational split introduces ZERO behavior/markup change to the live recently-viewed section
  (diff the rendered output reasoning in the log); current listing still excluded on detail;
  clear button still profile-only.
- Storybook story renders populated + empty states in sq/en/uk/it with fixture data.
- Screenshot evidence captured for all 7 breakpoints; no overflow/clipping; mobile scroll →
  grid 2/3/4 confirmed. Reference the screenshot output paths in the session log.
- npm run typecheck → 0 new errors; npm run lint → 0 new warnings;
  npm run governance → PASS (components + responsive + ssr + localization);
  governance:screenshots / storybook gates PASS.

Commit hygiene (mandatory):
- `git add -A` (every NEW file — new component, story, fixtures, screenshot baselines — must be staged).
- `git status` shows NO untracked (??) source/story/fixture files before committing.
- Commit + `git push`; confirm `git log` shows the new commit.

Update docs/backlog.md + docs/sessions/2026-05-22-task-165-recently-viewed-screenshots.md and mark
this carried-forward item resolved.

Out of scope: any change to storage/query/clear behavior; new features. Follow docs/ai-behavior.md
and docs/orchestrator-role.md.
```
