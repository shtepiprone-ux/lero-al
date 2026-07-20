# Session Archive: Task 631 — `System/FeaturedListings` story ViewAllLink proof-path fix — 2026-07-19

## Task path and status

`tasks/kickoff_prompt_Task_631_FeaturedListingsStory_ViewAll_ProofPath_Fix.md`

**Status: IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW**

## Summary

Two changes landed this session, both owner-directed in real time:

1. **Task 631 as kicked off:** `src/stories/FeaturedListings.stories.tsx` `Header()` now renders the real
   component's header shape (`flex items-center justify-between` row + `ViewAllLink`), per the kickoff's Option A.
2. **Owner-authorized scope widening beyond the kickoff (see "Mid-session detour" below):** `src/components/shared/ViewAllLink.tsx`
   gained a `styles={{ root: {...} }}` fix for a real, live vertical-centering bug the owner found on the actual
   homepage. This file is named in the kickoff's own "Out of scope" list; it was touched only after the owner
   explicitly authorized it in chat, with root-cause evidence gathered first.

## Mid-session detour (owner-directed, documented per agent-contract clause 2)

The owner interrupted implementation twice with real product concerns:

1. **Pause/resume:** After the story fix (item 1) was implemented and non-rendered checks passed, the owner
   questioned whether `ViewAllLink`'s always-visible-on-mobile behavior was still the intended design, and raised an
   unrelated, unscoped "Show more pagination on /listings" idea. Per clause 2 (no invented architecture) and clause 6
   (chat-only handoffs are not a valid kickoff), neither idea was implemented; the task was paused with a `BLOCKED`
   session log, then explicitly resumed by the owner ("продовжуй Task 631").
2. **Real defect found and root-caused, then fixed with explicit authorization:** The owner then posted a screenshot
   of the live app showing "Переглянути всі" ("View all") visually sitting above, not beside, the "Останні" ("Latest")
   heading on mobile — a real rendered defect on the homepage (`page.tsx`'s Latest section, sharing the same
   `ViewAllLink` island as `FeaturedListings.tsx`). Investigated against the running `next dev` server (not assumed):
   - The outer flex row (`div.flex.items-center.justify-between`) **was** correctly centering the button's root box
     (`h2` center y = button-root center y = 1266.25px at 390px width, uk locale) — so the row-level flex was fine.
   - The actual defect: the button ROOT's own computed style was `display: block; align-items: normal` (not
     `inline-flex`/`center`), so the button's inner label `span.mantine-Button-label` (which itself has
     `display:flex;align-items:center`) was not vertically centered *within the button's own 44px box* — it sat
     flush at the top (label center y = 1252.25, 14px above the button/h2 common center).
   - Cross-checked against the canonical `Mantine/Primitives/Button` story (`src/stories/mantine/primitives/Button.stories.tsx`
     lines 129-152, §6a-link section): it **never tests `component={Link}`** — only a plain `<Button variant="transparent">`
     with no polymorphic `component` prop. `ViewAllLink.tsx` uses `component={Link}` (next/link), an untested
     combination against the canonical story.
   - Found the exact precedent: `src/components/shared/AgentCtaButton.tsx` (Task 621) already carries the identical
     fix for the identical bug (`component={Link}` + Mantine `Button` losing internal flex-centering), documented in
     the Task 621 session/backlog note as a "theme-wide `height:'auto'`-breaks-`inner`-centering bug... flagged as a
     possible sitewide Button follow-up" that was never centralized into `theme.ts`.
   - Reported this root cause and the exact fix to the owner, named that `ViewAllLink.tsx` is explicitly
     "Out of scope" per the Task 631 kickoff, and asked explicitly whether to apply it now or file a separate task.
     Owner chose: **apply now** ("Застосувати зараз (owner authorization)").
   - Applied the identical `styles.root` shape already proven in `AgentCtaButton.tsx` (centering-relevant subset only —
     `AgentCtaButton`'s extra `paddingInlineStart: 'var(--button-padding-x)'` is icon-specific, not applicable to
     `ViewAllLink`, which has no `leftSection`).
   - Re-verified against the live `next dev` server after the fix: label center y now = 1266.25, exactly matching
     both the button-root center and the `h2` center, for both the Latest section (`page.tsx`) and the Featured
     section (`FeaturedListings.tsx`, this task's actual target) — confirmed with fresh DOM measurements and
     screenshots for both.

## Canonical UI decision record

| Changed visible artifact | Search evidence | Canonical Storybook source | Disposition | Shared style/token path consumed |
|---|---|---|---|---|
| `ViewAllLink.tsx` Button-root internal vertical centering | Opened `Mantine/Primitives/Button` story (`src/stories/mantine/primitives/Button.stories.tsx` L129-152, §6a-link) — its `variant="transparent"` examples never use `component={Link}`; no canonical coverage of the polymorphic-Link + Button combination. Searched for an existing fix: found `AgentCtaButton.tsx` (Task 621) already applies the identical `styles.root` shape for the identical `component={Link}` + Mantine Button centering bug (flagged in that task's session note as a "possible sitewide Button follow-up," never centralized). | `src/components/shared/AgentCtaButton.tsx` (existing local-patch precedent for the same bug; not a Storybook story itself) | **Reuse** of the existing local-patch pattern (owner explicitly authorized reproducing `AgentCtaButton.tsx`'s fix, not a sitewide `theme.ts` change) | `styles={{ root: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center' } }}` — copied verbatim from `AgentCtaButton.tsx`'s centering-relevant subset (its `paddingInlineStart` is icon-specific, not carried over since `ViewAllLink` has no `leftSection`) |
| `FeaturedListings.stories.tsx` header row + `ViewAllLink` placement | Opened `FeaturedListings.tsx` L41-48 (the real header this story must mirror) and `ViewAllLink.tsx` (the control itself, already canonical/CI-gated via the Button story's §6a-link section) | `src/modules/listings/components/FeaturedListings.tsx` (real component, the task's named mirror target) | **Reuse** — consumes `ViewAllLink` exactly as the real component does, no local style copy | No new style; imports `ViewAllLink` directly |

**Follow-up recommendation (not implemented, out of authorized scope):** two components (`AgentCtaButton.tsx`,
`ViewAllLink.tsx`) now independently carry the same `styles.root` patch for the same theme-level Mantine
`component={Link}` centering bug. Consolidating this into `theme.ts`'s Button component override (so any future
`component={Link}` consumer gets it for free) was flagged in Task 621 and remains unresolved — worth a dedicated
future task, not done here since the owner authorized only the local `ViewAllLink.tsx` fix mirroring the existing
precedent, not a sitewide theme change.

## Requirement and acceptance-criteria evidence

| ID | Requirement | Evidence |
|---|---|---|
| R1/AC1 | Story header renders `ViewAllLink` beside `<h2>` in a `flex items-center justify-between` row | Diff (`FeaturedListings.stories.tsx`); rendered proof below confirms the row renders correctly, both structurally and (after the `ViewAllLink` fix) visually centered |
| R2/AC1 | `t('view_all')` (namespace `listing`), `href=/${locale}/listings?premium=true`, `locale` from `context.globals.locale` | Diff; `context.globals.locale` read only in the outermost `render`, passed as a `locale` prop to `Header` |
| R3/AC2 | Only the target story file changed; 2 exports; no product/theme/other-story file; no new i18n key **— superseded by owner-authorized widening to also touch `ViewAllLink.tsx`, documented above** | `git status --short` → `FeaturedListings.stories.tsx` + `ViewAllLink.tsx` (owner-authorized) + session log + backlog; still exactly 2 exports (`Default`, `LocaleStress`); no i18n key added |
| R4/AC3 | `check:stories` stays green | `node scripts/check-stories.mjs` → `✅ check:stories PASSED — 120 files checked, 0 violations.` (re-run after the `ViewAllLink` fix) |
| R5/AC4 | Rendered proof (`screenshots:assert`) for `system-featuredlistings-*`, uk@320 mandatory | Full (non-`--fast`) `node scripts/check-stories-rendered.mjs` run — see Validation evidence #6. 24/24 cells `verdict: 'pass'` (2 stories × {320,375,390} × {sq,en,uk,it}), including `uk@320` for both `Default` and `LocaleStress` |
| R6/AC5 | Doc-description note on the unconditional-presence semantics | `meta.parameters.docs.description.component` diff line: states the control is shown unconditionally as the analogue of the real `!loading && listings.length > 0` present branch |

## Current versus required behavior

**Story (R1-R6):** Before — `System/FeaturedListings` rendered a plain `<h2 mb-6>` with no "view all" control at
all. After — the header is a `flex justify-between` row with `{t('featured')}` and the canonical transparent
`ViewAllLink`, localized from the toolbar locale, matching the real component's markup shape.

**`ViewAllLink.tsx` (owner-authorized fix, not in the original kickoff):** Before — `Button component={Link}
variant="transparent" size="sm"` with no `styles` override; the button root computed `display:block;
align-items:normal`, so the internal label text sat flush at the button's top instead of vertically centered,
visually appearing above the adjacent `<h2>` on both the Latest (`page.tsx`) and Featured (`FeaturedListings.tsx`)
homepage sections. After — `styles={{ root: { display:'inline-flex', alignItems:'center', justifyContent:'center' } }}`
added (mirroring `AgentCtaButton.tsx`'s existing fix for the identical bug); button root now computes
`display:flex; align-items:center`; label text center now matches both the button-root center and the sibling
`<h2>` center exactly, confirmed on both consumers.

**Applicable negative flows:**

| Branch | Applicable? | Evidence |
|---|---:|---|
| Locale expansion (uk/it long "view all") | Yes | 24/24 rendered cells PASS incl. `uk@320`/`it@320`; visually confirmed no clip/overflow in `system-featuredlistings--default__it__mobile-320.png` and `--locale-stress__sq__mobile-320.png` |
| Small viewport / touch target | Yes | `fullWidthControlsAtMobile: true` at all 24 cells; button auto-width inline beside heading, confirmed visually |
| Governance gates (taxonomy/locale/raw-literal) | Yes | `check:stories` 0 violations (re-run after both diffs) |
| Conditional-presence semantics | Yes | Doc-note diff; story shows control unconditionally by design (documented) |
| Real component's mobile visibility of `ViewAllLink` | Yes (owner-raised) | Confirmed unconditional (no responsive hide) in source before the fix; the fix only affects internal centering, not visibility — this was not changed |
| Real data-fetch / auth / RLS / hydration | No | Story is fixture-only, no hooks/API — unaffected by the `ViewAllLink` fix since the fix has no data dependency |

## Files Changed

| File | Rationale |
|---|---|
| `src/stories/FeaturedListings.stories.tsx` | Task 631 as kicked off: `Header()` now takes a `locale` prop and renders the real header shape (`flex justify-between` row + `ViewAllLink`); added `ViewAllLink` import; added R6 doc-description note. |
| `src/components/shared/ViewAllLink.tsx` | Owner-authorized mid-session fix (out of the original kickoff's scope): added `styles={{ root: {...} }}` to fix a real internal vertical-centering bug affecting both consumers (Latest on `page.tsx`, Featured on `FeaturedListings.tsx`), mirroring the existing `AgentCtaButton.tsx` precedent for the same underlying Mantine `component={Link}` bug. |

`git status --short` confirms exactly these two paths (plus this session log and the backlog update), **plus one
unrelated harness side-effect flagged below.**

**EXCLUDED AS UNRELATED (harness side-effect, not a Task 631 change):**
`docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md` was auto-regenerated by
`check-stories-rendered.mjs` itself (documented behavior — "the harness auto-generates a per-cell inventory from the
manifest on each run", storybook-governance.md §14.4.2) when the required full rendered-assert run was executed for
R5/AC4 evidence. The diff (298→299 stories, 952→7576 total cells tracked) reflects the **entire repo's current
Storybook state**, not anything Task 631 touched — the extra scope is pre-existing stories/gates that simply weren't
covered by whatever older/narrower run last wrote this file. Sonnet cannot revert it (`git checkout` is a mutating
command reserved for the owner per `docs/agent-contract.md` clause 10); flagging for the orchestrator to decide
whether to keep the refreshed report (consistent with its documented auto-generation behavior) or request a revert
before commit — either way, it is **not part of this task's Files Changed** and contains zero
`featuredlistings`/`ViewAllLink` rows of its own significance beyond what's already itemized above.

## Validation evidence

1. `npx tsc --noEmit` → **0 errors** (no output), run after both diffs.
2. `node scripts/check-stories.mjs` → **PASSED**, `120 files checked, 0 violations` (all 14 checks green), run after
   both diffs.
3. `node scripts/check-i18n-parity.mjs` → **PASSED**, 2203/2203 keys, all 4 locales, no delta (no new string
   introduced by either change).
4. `node scripts/check-mojibake.mjs` → **PASSED**, `0 artifacts in 1802 files`, run after both diffs.
5. `grep -rn "ViewAllLink" src` (excluding stories) → exactly 2 real consumers (`page.tsx` Latest, `FeaturedListings.tsx`
   Featured) + the definition itself — both re-verified live (see below), no other regression surface.
6. **Rendered proof — full (non-`--fast`) run:** `npx storybook build --quiet` (exit 0, confirmed to include both
   diffs) then `node scripts/check-stories-rendered.mjs` (full mode, no `--fast`/`--mantine-only` — required because
   `System/FeaturedListings` is a legacy `System/*` story matching neither `ASSERT_STORIES` nor the
   `Mantine/Primitives/*`/`Patterns/Mantine/*` gate; it is covered only by the "geometry-only" global-enumeration
   phase, which `--fast` unconditionally skips). Manifest: `.screenshots/rendered-assert/2026-07-19T21-02/manifest.json`
   (session-scratchpad, gitignored). Filtered to `storyId` containing `featuredlistings`: **24/24 cells
   `verdict: 'pass'`** — `system-featuredlistings--default` and `system-featuredlistings--locale-stress`, each at
   {mobile-320, mobile-375, mobile-390} × {sq, en, uk, it}. `uk@320` present and PASS for both stories (mandatory
   per R5). Visually spot-checked 4 screenshots: `--default__uk__mobile-320`, `--locale-stress__uk__mobile-320`
   (both mandatory), `--default__it__mobile-320` (long Italian), `--locale-stress__sq__mobile-320` (Albanian
   diacritics) — all show `{t('featured')}` + transparent `ViewAllLink` correctly localized, aligned, no clipping.
   **Scope limitation (honest, not a gap in effort):** this harness structurally covers only 320/375/390 for a
   non-`ASSERT_STORIES`/non-Mantine story like this one — there is no CLI mode of `check-stories-rendered.mjs` that
   produces 768/1024/desktop cells for it (confirmed by reading the script: `FAST_MODE` skips geometry-only entirely;
   full mode still only assigns `VIEWPORTS_MOBILE` to geometry-only stories). The task's own verification plan names
   this exact command as the acceptance proof; its result is reported as-is, not supplemented with an unrequested
   additional tool. The overall run's global summary (`total:7576, passed:6418, failed:955, ...`) reflects the
   **entire repo's pre-existing baseline** (documented history in Task 467/Q0R) and is unrelated to this task's 24
   cells, all of which pass.
7. **Live-app cross-check (informational, not a story-proof substitute):** against the running `next dev` server
   (`localhost:3000/uk`, 390×844), before the `ViewAllLink` fix: button-root center y = h2 center y = 1266.25 (row
   centering correct) but label center y = 1252.25 (14px high — the bug). After the fix: label center y = 1266.25,
   matching both, on **both** the Latest section (`page.tsx`) and the Featured section (`FeaturedListings.tsx`).
   Screenshots captured and visually confirmed for both sections, before and after. These ad-hoc diagnostic scripts
   (`scripts/_ad-hoc-check-*.mjs`) were deleted after use — not part of the diff, not committed.

## Visual source trace

| Visible artifact/state | Component/markup | Class/selector | Utility, cascade, and token path | Change or preserve | Evidence |
|---|---|---|---|---|---|
| Story header row | `Header({ locale })` in `FeaturedListings.stories.tsx` | `div.flex.items-center.justify-between.mb-6` | Tailwind flex/gap utilities, matches real component | **Changed** — added row wrapper + `ViewAllLink`, moved `mb-6` off `<h2>` | Diff |
| `{t('featured')}` heading (story) | `<h2 className="text-xl sm:text-2xl 2xl:text-3xl font-bold">` | classes identical minus relocated `mb-6` | unchanged text scale tokens | **Preserved** | Diff |
| "view all" control — internal text centering | `ViewAllLink` → Mantine `Button variant="transparent" size="sm" component={Link}` → `span.mantine-Button-label` | button root: was `display:block;align-items:normal`, now `display:flex;align-items:center` via `styles.root` | Mantine Button root CSS vs. `component={Link}` polymorphic override; no canonical-story coverage of this combination (see Canonical UI decision record) | **Changed (bug fix, owner-authorized)** | Live-app DOM measurements before/after; screenshots for both `page.tsx` and `FeaturedListings.tsx` consumers |
| Real component's mobile visibility of `ViewAllLink` | `FeaturedListings.tsx` L41-48 | `flex items-center justify-between` (no responsive hide) | grep-confirmed: no `hidden`/`hiddenFrom`/`visibleFrom`/media-query anywhere touching this control | **Preserved (unconditional across viewports, unchanged by this session)** | grep evidence; not part of the centering fix |
| Card grid / fixtures / `StoryListingCard` | unchanged | unchanged | unchanged | **Out of scope, untouched** | `git status --short` |
| `theme.ts`, `globals.css`, `Mantine/Primitives/Button` story, `AgentCtaButton.tsx`, `page.tsx` structure | — | — | — | **Out of scope, untouched** (only `ViewAllLink.tsx`'s own `styles` prop changed; its 2 consumer call sites were not edited) | `git status --short` |

## Self-review findings

- No defect remains in either changed file; both are evidenced by rendered proof (story) and live-app DOM
  measurement (ViewAllLink fix, on both real consumers).
- **Scope note, not a defect:** `ViewAllLink.tsx` is named in the Task 631 kickoff's "Out of scope" list. It was
  touched only after explicit, in-chat owner authorization, with root-cause evidence gathered first and a documented
  precedent (`AgentCtaButton.tsx`) reused rather than a new one-off style invented. This is flagged prominently for
  the orchestrator's review, since it is a real deviation from the saved kickoff's boundaries.
- **Consolidation debt surfaced, not fixed:** the same `styles.root` centering patch now exists in two files
  (`AgentCtaButton.tsx`, `ViewAllLink.tsx`). Recommend a follow-up task to centralize it in `theme.ts`'s Button
  override — not done here (would be a much wider, unauthorized blast radius).

## Assumptions, deviations, and limitations

- Implementation followed the kickoff's recommended Option A exactly for the story (fixture-based, no mocked hooks).
- **Deviation (owner-authorized, documented above):** `ViewAllLink.tsx` was edited, contradicting the kickoff's
  explicit "Out of scope" list. This was not a unilateral decision — the owner posted visual evidence of a real bug,
  I root-caused it against the live app and the canonical Button story before proposing a fix, and the owner
  explicitly chose "apply now" over "file separately" when asked directly.
- **Limitation:** the rendered-proof harness cannot produce 768/1024/desktop cells for this specific story (see
  Validation evidence #6) — this is a structural property of `check-stories-rendered.mjs`, not a shortcut taken in
  this session. The task's own named acceptance command was run in full and its actual output reported.
- `.screenshots/rendered-assert/2026-07-19T21-02/` and `.screenshots/task631-featuredlistings-cells.json` are
  session-scratchpad artifacts in the gitignored `.screenshots/` area — re-derivable on demand.

## Opus handoff

Evidence locations (session-scratchpad, gitignored, not committed):
- `.screenshots/rendered-assert/2026-07-19T21-02/manifest.json` (full manifest) and
  `.screenshots/task631-featuredlistings-cells.json` (the 24 filtered rows for this task).
- PNGs: `.screenshots/rendered-assert/2026-07-19T21-02/system-featuredlistings--{default,locale-stress}__{sq,en,uk,it}__mobile-{320,375,390}.png`.

Diff: `src/stories/FeaturedListings.stories.tsx`, `src/components/shared/ViewAllLink.tsx`.

Questions/risks for the reviewer to inspect:
1. **Confirm the owner-authorized scope widening onto `ViewAllLink.tsx` is acceptable for this task's approval**,
   or whether it should be split into a separate task/commit despite being implemented together in this session
   (both files are small, low-risk, and evidenced, but the kickoff explicitly named `ViewAllLink.tsx` out of scope).
2. Confirm whether the flagged `theme.ts` consolidation follow-up (two files now carrying the same local patch)
   should become a new backlog item.
3. Confirm the rendered-proof scope limitation (320/375/390 only, no desktop cells possible for this story via the
   named tool) is acceptable as final Q2 evidence, or whether a supplementary manual/app-route desktop capture is
   required before approval.
4. Note for the record: this session was paused and resumed once mid-implementation at the owner's explicit
   direction (see git-free chat history) — no work was done during the pause; nothing was silently carried forward
   without being re-confirmed after resume.

## Backlog update

See `docs/backlog.md` — concise active-state entry added; full detail lives here per session-log rules.
