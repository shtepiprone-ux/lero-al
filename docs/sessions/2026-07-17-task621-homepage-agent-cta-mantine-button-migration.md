# Session Archive: Task 621 — Homepage Agent-CTA → Mantine Button migration — 2026-07-17

## Task path and status

`tasks/kickoff_prompt_Task_621_HomepageAgentCtaMantineButtonMigration.md`

**Status: IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW**

## Summary

Replaced the Homepage Agent-CTA (`src/app/[locale]/page.tsx:98-105`), previously a `next/link` styled with legacy
shadcn `buttonVariants({ size: 'lg' })`, with a minimal `'use client'` presentational island
(`src/components/shared/AgentCtaButton.tsx`) rendering the canonical Mantine `Button`. Navigation target, analytics
attribute, icon, localized label, and responsive full-width/touch-target behavior are preserved; `page.tsx` remains
an async Server Component.

Three real defects were found and fixed during implementation via direct user visual QA + DOM measurement (not
present in the kickoff's suggested code sample, A1) — see "Self-review findings" below.

## Requirement and acceptance-criteria evidence

| ID | Requirement | Evidence |
|---|---|---|
| R1/AC1 | Agent-CTA renders as canonical Mantine `Button`, not `buttonVariants` | `page.tsx` no longer imports `buttonVariants` for this control (still imports it for the untouched `page.tsx:53` ghost/sm link); server-rendered HTML confirms `class="mantine-Button-root ..."`, `data-variant="filled"` |
| R2/AC2 | `href` = `/${locale}/auth/register?type=agent` exactly | Playwright capture across sq/en/uk/it all returned exact matching `href` (see Validation evidence) |
| R3/AC3 | `data-track="register"` present | Confirmed present in server HTML and in every captured DOM cell |
| R4/AC4 | `Building2` icon + `home.agent_cta_button` label, all 4 locales | Rendered screenshots captured for sq/en/uk/it; `check:i18n` 2203/2203 keys parity, no delta |
| R5/AC5 | <640: full-width, ≥44px, wraps; ≥640: natural width, centered | Measured: 320px→288px wide (container-inset full-width), 390px→358px, 768/1024/1440/1920px→~214px (content-width); height = 44px at every width (theme `minHeight:2.75rem`, unconditional) |
| R6/AC6 | Same solid brand-primary CTA, no regression | `data-variant="filled"` (brand `#EC5447` fill, same token path as every other Mantine primary CTA in the app); rendered screenshots visually match TailAdmin primary Button token row (§6/§6l); canonical-source proof: `theme.ts:252-318` `Button` component defaults (radius `lg`, `size:'sm'` density, `minHeight:2.75rem`) — same source every other Mantine Button in the app already uses (`HeaderActions.tsx`, `HeroSearchView.tsx`) |
| R7/AC7 | Only Agent-CTA changes; `page.tsx:53` (now shifted, same content) `buttonVariants` usage, section wrapper, header icon, copy untouched | Diff shows only the import addition + the CTA block; `page.tsx:53`'s ghost/sm link, gradient wrapper, header `Building2`, `h2`/`p` are byte-unchanged (confirmed via diff) |
| R8/AC8 | Minimal client island; `page.tsx` stays Server Component; no new hydration error | `page.tsx` still `export default async function HomePage()`, still calls `await getTranslations`/`await createClient()`; `check:hydration` 4/4 PASS on public routes (en/sq/uk homepage + listings) |

## Current versus required behavior

**Before:** `<Link>` styled via legacy `buttonVariants({ size: 'lg' })` (shadcn/Base UI `cva`), solid primary fill,
full-width + ≥44px + wrapping label <640px, natural width ≥640px, centered by the section's `text-center` wrapper.

**After:** Same navigation/analytics/icon/label/responsive-outcome, now rendered by Mantine `Button`
(`variant="filled"`, `size="sm"`, `component={Link}`, `leftSection`) inside `AgentCtaButton.tsx`. Responsive width via
Mantine's own responsive prop system (`w={{ base: '100%', sm: 'auto' }}`, the same pattern already documented for
`MantineSelect`'s trigger in `docs/tailadmin-style-reference.md` §6i).

**Applicable negative flow:** Long-label/narrow-viewport overflow (P0 clause 11; `uk` is the longest label) — verified
no horizontal overflow at 320px in `uk`, label renders on one line at 320/390 in this case (short enough), full-width
button with ≥44px height in all captured cells. All other negative-flow branches are N/A per the kickoff's
applicability table (pure navigation control, no form/RLS/offline/concurrency surface).

## Files Changed

| File | Rationale |
|---|---|
| `src/components/shared/AgentCtaButton.tsx` | New minimal `'use client'` island rendering the canonical Mantine `Button` for the Agent-CTA (A1 mechanism) |
| `src/app/[locale]/page.tsx` | Replaced the `buttonVariants` `<Link>` Agent-CTA block (lines 98-105) with `<AgentCtaButton>`; added the new import. `buttonVariants`/`cn`/`Link`/`Building2` imports retained (still used by the untouched `page.tsx:53` link and the section header icon) |
| `scripts/story-coverage-exempt.json` | Added an exemption entry for `AgentCtaButton.tsx` — `check:story-coverage` flagged the new component as uncovered; a new Storybook story is explicitly out of scope at Q2 per the kickoff, so the gate's own exemption mechanism (option b) was used rather than weakening the gate |

## Validation evidence

1. `npm run typecheck` → **0 errors** (ran 3 times, after each fix iteration).
2. `npx eslint src/app/[locale]/page.tsx src/components/shared/AgentCtaButton.tsx` → **clean, no output** (ran after each fix iteration).
3. `npm run check:i18n` → **PASSED**, 2203/2203 keys parity across sq/en/uk/it, no delta (label already existed pre-task).
4. `npm run check:i18n-hardcode` → **PASSED**, 0 new findings (1 pre-existing baseline finding in an unrelated file).
5. `npm run check:file-integrity` (default git-changed scope) → **PASSED**, all 3 touched files clean (0 NUL, 0 BOM, valid JSON).
6. `npm run check:mojibake` → **0 artifacts in 1781 files**.
7. `npm run check:design-tokens` → **9 pre-existing violations, 0 in touched files** (`HeaderView.tsx`, `NotificationCenter.tsx` — unrelated `min-[390px]` arbitrary breakpoints, out of this task's scope; confirmed via `git status` that neither file is touched by this diff).
8. `npm run screenshots:responsive` → **not applicable / missing evidence for this surface.** Inspected the script (`scripts/responsive-screenshots.mjs`): it captures a fixed list of pre-defined Storybook story IDs (`STORY_TARGETS`) built from a static Storybook build; it has no route for the Homepage app page and cannot be pointed at one. This contradicts the kickoff's assumption that this command is "the correct path for a non-story homepage surface." Recorded as a kickoff-defect finding (see Self-review) rather than silently substituting a false pass. **Actual rendered evidence produced instead** (ad-hoc Playwright capture against the running `next dev` server — same precedented pattern as the critical-flow-registry Task 572 entry, "one-off Playwright capture script, not persisted"): captured `agent-cta_<locale>_<width>.png` for uk/sq/en/it @ 320px, uk @ 390/768/1024/1440px, and sq/en/uk/it @ 1440px. Every cell confirmed via DOM inspection: `isMantineButton: true`, `data-variant: "filled"`, exact `href`, `boxHeight: 44` at every width, `boxWidth` = container-inset full-width <640 and content-width ≥768. Screenshots inspected visually (see below).
9. `npm run check:hydration` (against `BASE_URL=http://localhost:3000`, real `next dev` server) → **4/4 PASS** on Homepage en/sq/uk + Listings list en; 3 SKIP (NOT-REAL-COVERAGE — listing-detail/authenticated routes require env vars not available in this session, pre-existing gate behavior, unrelated to this task). Ran twice (after the size/padding fix and again after the vertical-centering + width fix) — clean both times.
10. `npm run check:story-coverage` → initially **FAILED** (new `AgentCtaButton.tsx` uncovered); fixed via exemption entry (see Files Changed); re-ran → the new file no longer appears in the failure list (5 pre-existing unrelated failures remain: `HeaderActions.tsx`, `HeaderView.tsx`, `MobileNavDrawer.tsx`, `UserMenu.tsx`, `HeroSearchView.tsx` — not touched by this task).
11. `npm run governance:components` → infrastructure check passed, no new flags.

### Owner/user visual QA

The owner performed live visual QA in the running browser and reported three real defects across the iteration,
all reproduced via direct DOM measurement (not assumption) and fixed — see "Self-review findings." Owner's final
message: **"Візуально підтверджую нормальну поведінку кнопки на всіх breakpoints та локалях"** (visually confirms
normal button behavior at all breakpoints and locales) — this is the QA evidence of record for R5/R6/AC5/AC6 at
Q2 depth, supplementing the automated DOM-measurement evidence above.

## Visual source trace

| Visible artifact/state | Component/markup | Class/selector | Utility, cascade, and token path | Change or preserve | Evidence |
|---|---|---|---|---|---|
| Solid primary fill | `<Link className=cn(buttonVariants({size:'lg'}))>` → Mantine `<Button variant="filled">` | `bg-primary text-primary-foreground` → `data-variant="filled"`, `--button-bg:var(--mantine-color-brand-filled)` | cva default variant → Mantine `theme.ts` brand color (shade 7, `#EC5447`) | **Changed, verified matching** | `page.tsx:98` (before), `AgentCtaButton.tsx:17`, `theme.ts:5-16` brand tuple |
| Size / height | `h-9 px-2.5` + `max-sm:min-h-11 max-sm:w-full` | Mantine `size="sm"` + `w={{base:'100%',sm:'auto'}}` + theme `minHeight:2.75rem` | shadcn `lg` size + mobile full-width → Mantine `sm` density (TailAdmin correction) + responsive `w` prop + global 44px touch-target floor | **Changed** — ≥44px preserved (confirmed 44px at every measured width), full-width <640/auto ≥640 preserved | `button.tsx:27` (before), `theme.ts:192,306` (44px floor), `AgentCtaButton.tsx:21` (width) |
| Leading icon | `<Building2 className="h-5 w-5"/>` | lucide svg, 20px | — | **Preserved**, resized to 16px (`h-4 w-4`) to match the only real Mantine `Button leftSection` precedent in the repo (`HeroSearchView.tsx:115,125`, Task 568) — visually confirmed proportionate, not a regression | `page.tsx:103` (before), `AgentCtaButton.tsx:19` |
| Icon/label gap + centering | `'gap-2'` on the link | Mantine `leftSection` built-in gap + `Button-inner` flex | Mantine `.mantine-Button-inner` (`display:flex;align-items:center;justify-content:center;height:100%`) | **Changed/subsumed**, required a local fix (see Self-review finding #3) | `AgentCtaButton.tsx:22-29` |
| Analytics hook | `data-track="register"` | attribute | — | **Preserved verbatim** | `page.tsx:101` (before), `AgentCtaButton.tsx:20`; confirmed present in rendered DOM at every cell |
| Navigation target | `href="/${locale}/auth/register?type=agent"` | — | — | **Preserved verbatim** | `page.tsx:99` (before), `page.tsx:100` (after); confirmed exact match across sq/en/uk/it |
| Section gradient bg, header icon, `h2`/`p` copy | siblings | Tailwind gradient/text utils | — | **Out of scope, byte-unchanged** | `page.tsx:92-97` diff-confirmed unchanged |

## Self-review findings

Three real defects were found through the owner's direct visual QA and fixed (none were caught by the Note-18
automated checklist alone — this is a case where rendered/human QA caught what typecheck/lint/gates could not):

1. **`size="lg"` was an off-menu, unvetted Mantine Button size.** The kickoff's own suggested code sample (A1) used
   `size="lg"`, copied from the legacy `buttonVariants({ size: 'lg' })` size name without verifying it against the
   actual Mantine Button convention in this repo. Grep of the entire `src/` tree confirmed **every other
   `size="lg"` in the codebase is the legacy shadcn Button** — there is no other Mantine `<Button size="lg">`
   anywhere. `theme.ts`'s density correction (`§6` "🔴 DENSITY CORRECTION") and `Button.stories.tsx`'s own comment
   ("sizes — xs and sm only (NOT md per density rule)") make `sm` the only vetted size. Fixed: `size="lg"` →
   `size="sm"`, icon `size-5` (20px) → `h-4 w-4` (16px), matching `HeroSearchView.tsx`'s real Mantine
   `Button leftSection` usage exactly. 44px touch target unaffected (theme's `minHeight:2.75rem` applies
   unconditionally, independent of `size`).
2. **Asymmetric horizontal padding.** Mantine's compiled CSS (`node_modules/@mantine/core/styles/Button.css:55-57`)
   reduces padding on whichever side has a `leftSection`/`rightSection` (`padding-inline-start: calc(var(--button-padding-x) / 1.5)`), which is by design for most icon buttons but made this control's icon+label group visibly off-center relative to the pill (12px left / 18px right at `sm`), a regression from the original symmetric `px-2.5` legacy padding. Fixed with a local `styles.root.paddingInlineStart: 'var(--button-padding-x)'` override, restoring symmetric padding. Confirmed via `getComputedStyle` → `padding: 0px 18px` (equal both sides).
3. **Vertical-centering bug — root cause identified precisely.** Mantine's real CSS makes `.mantine-Button-inner`
   `height: 100%`, intended to fill the root's explicit `height` and be centered by the root's own flex layout.
   The project's **shared** `theme.ts` Button `styles.root` override sets `height: 'auto'` (to let long labels
   grow past `minHeight`, needed for Task 502's wrap fix) — but a child's `height: 100%` cannot resolve against an
   `auto`-height parent (CSS spec), so `inner` collapsed to its own content height (~16-20px) and rendered
   top-aligned inside the 44px root instead of centered — measured as a **13px vertical offset** before the fix
   (`rootCenter` 613.48 vs `sectionCenter`/`labelCenter` 600.48 at a 1920px viewport). This is a **theme-wide
   defect** — it likely affects every Mantine `Button` with a `leftSection`/`rightSection` site-wide (any button
   whose natural content height is less than the enforced 44px minimum), not just this control, but fixing
   `theme.ts` itself is out of this task's scope (shared-primitive change, full blast-radius regression check, its
   own dedicated task per "Shared Component Rules"). Fixed **locally** on this one control via
   `styles.root: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }`. Verified:
   `rootCenter === sectionCenter === labelCenter` to the fraction of a pixel at every measured viewport
   (320/390/768/1024/1440/1920).
   **Follow-up flagged for the orchestrator:** this theme-level `height:'auto'` / `inner height:100%` conflict
   should be triaged as a possible sitewide Button visual-QA gap and may warrant its own task.
4. **Self-inflicted regression during fix #3, caught and corrected in the same pass:** the first attempt at the
   centering fix used `display: 'flex'` (block-level flex), which made the button expand to fill its parent's full
   width at ≥640px (measured `rootWidth: 672` at a 1920px viewport, i.e. "huge" — exactly what the owner reported).
   Corrected to `display: 'inline-flex'`, which preserves shrink-to-fit sizing identical to Mantine's original
   `inline-block` while still enabling flex centering. Re-verified width behavior at 320/390/768/1024/1440/1920 —
   full-width <640, ~214px content-width ≥768, at every step.

All four findings were verified via direct `getComputedStyle`/`getBoundingClientRect` DOM measurement (not visual
guesswork) before and after each fix, plus rendered screenshots, plus the owner's own live-browser visual
confirmation.

## Assumptions, deviations, and limitations

- **A1 deviation:** the kickoff's suggested island code (`size="lg"`, icon `className="h-5 w-5"`, no explicit
  centering styles) was NOT used as-is — see Self-review findings #1-3. The chosen mechanism is a
  `'use client'` island at `src/components/shared/AgentCtaButton.tsx` with props `{ href: string; label: string }`,
  matching the kickoff's recommended shape but with corrected size/icon/centering.
- **A2 confirmed:** responsive full-width mechanism is Mantine's own responsive prop (`w={{ base: '100%', sm: 'auto' }}`), not a Tailwind `className` — consistent with the `MantineSelect` trigger precedent in
  `docs/tailadmin-style-reference.md` §6i and with the Mantine-first source-of-truth split. ≥44px touch target
  comes from the theme's unconditional `minHeight: 2.75rem`, not a locally-added exemption.
- **OQ1:** proceeded at Q2 (not elevated to Q3) — single existing canonical primitive reused on one surface, no
  new primitive/story required, matching the kickoff's own selection. Owner did not request elevation.
- **Limitation — `screenshots:responsive` command:** as documented in Validation evidence item 8, this command
  cannot capture the Homepage (it is Storybook-story-scoped only). This is a **kickoff specification defect**
  (the kickoff assumed this command was app-route-capable) that the orchestrator should correct in future
  UI-migration kickoffs for non-story app surfaces — either name the exact ad-hoc Playwright pattern explicitly
  (as Task 572 did) or point at a different command.
- **Limitation:** `check:design-tokens` and `check:story-coverage` both surfaced pre-existing, unrelated failures
  (5-9 items in files never touched by this diff). Not remediated — out of this task's scope; noted for
  transparency per agent-contract clause 9.
- **Limitation:** the theme-wide vertical-centering root cause (Self-review finding #3) was not fixed at its
  source (`theme.ts`) — flagged as a follow-up, not silently left undocumented.

## Opus handoff

Evidence locations:
- Screenshots: `C:\Users\Nox\AppData\Local\Temp\claude\C--Claude-Code-Projects-lero-al\545a5cf6-531e-4a78-a696-45ced6cd1f6a\scratchpad\task621-screens\` (session-scratchpad, not committed — gitignored area; re-capture on demand via the same ad-hoc Playwright pattern documented in Validation evidence item 8 if persistent evidence is required for release).
- Diff: `src/app/[locale]/page.tsx`, `src/components/shared/AgentCtaButton.tsx`, `scripts/story-coverage-exempt.json`.

Questions/risks for the reviewer to inspect:
1. Is the local `styles.root` override on `AgentCtaButton.tsx` (padding + inline-flex centering) an acceptable
   scoped fix, or should the underlying `theme.ts` `height:'auto'` conflict be fixed at the shared-primitive level
   in a follow-up task? (Self-review finding #3.)
2. Confirm the `screenshots:responsive` kickoff-defect finding (item 8) — should future non-story-surface kickoffs
   name the ad-hoc-Playwright-capture pattern explicitly instead of this command?
3. `check:design-tokens` (`HeaderView.tsx`, `NotificationCenter.tsx`) and `check:story-coverage` (5 other
   components) pre-existing failures — confirm these are correctly out of scope and not silently accepted as new
   debt from this task.

## Backlog update

See `docs/backlog.md` — concise active-state entry added; full detail lives here per session-log rules.
