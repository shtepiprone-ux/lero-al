# Session Archive: Task 645 — Homepage swap to canonical HowItWorksSteps — 2026-07-20

## Task path and status

`tasks/kickoff_prompt_Task_645_Homepage_Swap_HowItWorksSteps.md`

**Status: IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW**

## Summary

Replaced the inline legacy "How it works" `<h2>` + step-grid markup in `src/app/[locale]/page.tsx` with
`<HowItWorksSteps heading={t('how_it_works')} steps={[…3…]} />` (Task 644's canonical Mantine component), inside
the unchanged `<section>`/`container-wide` wrappers. Removed the now-dead `Search`/`Home`/`Phone` lucide imports
(kept `Building2`, still used by the Agent-CTA section). This closes the "How it works" Mantine migration
(644 built + proved the component; 645 wires it into the live homepage).

## Requirement and acceptance-criteria evidence

| ID | Requirement | Evidence |
|---|---|---|
| R1/AC1 | Inline markup replaced by `<HowItWorksSteps>` inside preserved `<section>`/`container-wide` | `page.tsx` diff (below); rendered `/{locale}` captures show identical section chrome/padding |
| R2/AC2 | `HowItWorksSteps` imported; `Search`/`Home`/`Phone` removed; `Building2` kept; typecheck clean | Import diff (below); `npm run typecheck` → 0 errors |
| R3/AC3 | Rendered homepage section visually identical to before, incl. `uk@320` × 4 locales | 24 section screenshots (4 locales × 6 widths) + 4 full-page captures — see Validation evidence |
| R4/AC4 | No other section, i18n key, or `HowItWorksSteps.tsx` touched | `git diff --stat` — only `page.tsx` (+ pre-existing unrelated harness file, see below) |
| R5/AC5 | typecheck/check:stories/check:i18n/check:mojibake all exit 0, no i18n key change | All 4 commands exit 0 (below); `check:i18n` 2206/2206 keys, no delta |

## Current versus required behavior

**Before:** "How it works" was inline legacy Tailwind markup (`<h2>` + hand-rolled icon-box/badge `<div>`s),
importing `Search`/`Home`/`Phone` from `lucide-react` for icons owned by the inline `.map()`.

**After:** the section renders `<HowItWorksSteps heading={...} steps={[...]} />` (Task 644's Mantine component,
unmodified); `page.tsx` no longer imports `Search`/`Home`/`Phone` (grep-confirmed no other use); `Building2` import
kept (Agent-CTA section, line ~89, untouched).

**Applicable negative flows:**

| Branch | Applicable? | Evidence |
|---|---:|---|
| Desktop render (real route) | Yes | `after-en-1024.png`: 3 cards in a row, identical to the legacy `en@1024` capture from Task 644's session |
| Mobile uk@320 (real route) | Yes | `after-uk-320.png`: 1-col stack, no clip/overflow, matches legacy |
| Locale expansion (sq/en/uk/it) | Yes | `after-sq-390.png`, `after-it-768.png` inspected — correct localized copy, no overflow |
| Dead-import removal compiles | Yes | `npm run typecheck` → 0 errors |
| Other sections unchanged | Yes | `after-fullpage-en-1024.png` (full-page capture): Hero/Featured/Latest/How-it-works/Agent-CTA/Footer all render correctly and unchanged |
| content-visibility hint preserved | Yes | `git diff` — `[content-visibility:auto] [contain-intrinsic-size:auto_340px]` on the `<section>` byte-unchanged |
| i18n key change | No — reused `home.*` keys | `check:i18n` unchanged (2206/2206) |

## Files Changed

| File | Rationale |
|---|---|
| `src/app/[locale]/page.tsx` | Swapped inline "How it works" markup for `<HowItWorksSteps>`; import hygiene (`Search`/`Home`/`Phone` removed, `HowItWorksSteps` added, `Building2` kept) |
| `docs/backlog.md` | Concise active-state update (this task → awaiting review; closes the 644/645 pair) |

**EXCLUDED AS UNRELATED:** `docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md` shows
as modified in `git status`, but this diff is a pre-existing, uncommitted harness side-effect from Task 644's
`screenshots:assert --mantine-only` run (298→300 stories / 952→984 cells, reflecting the `HowItWorksSteps` story
addition) — it predates this session, was not touched by any command run in this task, and this task's own kickoff
names this exact class of file as excludable.

**Confirmed NOT touched:** `src/components/shared/HowItWorksSteps.tsx` (Task 644 — untouched this session),
`messages/*.json`, any other homepage section component (`HeroSearchClient`, `FeaturedListings`, `LatestListings`,
`PopularLocations`, `AgentCtaButton`, `ViewAllLink`).

## `page.tsx` before/after (the two changed regions)

**Import line — before:**
```ts
import { Search, Home, Phone, Building2 } from 'lucide-react'
```
**Import line — after:**
```ts
import { Building2 } from 'lucide-react'
...
import { HowItWorksSteps } from '@/components/shared/HowItWorksSteps'
```

**Section body — before:** inline `<h2>` + `.map()` over `{Icon, title, desc, num}` rendering hand-rolled
icon-box/badge `<div>`s (verbatim in the kickoff).

**Section body — after:**
```tsx
<div className="container-wide">
  <HowItWorksSteps
    heading={t('how_it_works')}
    steps={[
      { title: t('step1_title'), desc: t('step1_desc') },
      { title: t('step2_title'), desc: t('step2_desc') },
      { title: t('step3_title'), desc: t('step3_desc') },
    ]}
  />
</div>
```
The `<section className="py-12 md:py-16 2xl:py-20 [content-visibility:auto] [contain-intrinsic-size:auto_340px]">`
wrapper is byte-unchanged.

## Validation evidence

1. `npm run typecheck` → **0 errors** (confirms the 3-tuple `steps` prop shape and no unused/undefined lucide symbols).
2. `npm run check:stories` → **PASSED — 121 files checked, 0 violations**.
3. `npm run check:i18n` → **PASSED** — 2206/2206 keys, all 4 locales, no delta.
4. `npm run check:mojibake` → **0 artifacts in 1831 files**.
5. **Rendered proof** (ad-hoc Playwright capture against the running `next dev` server at `localhost:3000`,
   precedented pattern per Tasks 572/621/630/644): captured the live "How it works" section at
   320/375/390/768/1024/1440px × sq/en/uk/it (24 screenshots), plus one full-page capture per locale at 1024px
   (4 screenshots) to confirm every other section (Hero, Featured, Latest, How-it-works, Agent-CTA, Footer)
   renders unaffected. Visually inspected: `after-uk-320.png` (mandatory cell — 1-col stack, badge/icon-box
   correct, no overflow with the longest uk strings), `after-en-1024.png` (3-col row, pixel-equivalent to Task
   644's legacy-vs-new comparison), `after-sq-390.png`, `after-it-768.png` (correct localized copy), and
   `after-fullpage-en-1024.png` (full homepage renders correctly end-to-end, no regression to any other section).
   Screenshots are session-scratchpad only (not committed); re-capturable via the same ad-hoc pattern.
6. `git status --short` / `git diff --stat` → only `src/app/[locale]/page.tsx` changed by this task (plus the
   pre-existing unrelated harness file noted above). `HowItWorksSteps.tsx`, `messages/*.json`, and every other
   homepage section component are absent from the diff.

## Self-review findings

No defects found. The swap is a direct, precedented mechanical replacement (client-island-in-server-page pattern
already used by `HeroSearchClient`/`AgentCtaButton`/`ViewAllLink`); no deviation from the kickoff's suggested code
was needed.

## Assumptions, deviations, and limitations

- None. The kickoff's suggested code shape (import change + tuple `steps` prop) was used as-is; `typecheck`
  confirmed the tuple literal satisfies `readonly [Step, Step, Step]` without an explicit `as const`.
- `check:hydration` was not run — not listed in this task's QA profile/gate list (Q3 visual, not Q4), and the
  client-island-in-server-page pattern is already precedented (Task 621/630) without a hydration regression.

## Opus handoff

Evidence locations:
- Diff: `src/app/[locale]/page.tsx`.
- Rendered screenshots: session-scratchpad
  (`…/scratchpad/after-{locale}-{width}.png`, `after-fullpage-{locale}-1024.png`) — not committed, gitignored area;
  re-capture via the Playwright pattern in Validation evidence item 5 if persistent evidence is required.

Questions/risks for the reviewer to inspect:
1. Confirm the pre-existing `docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md`
   diff is correctly classified as `EXCLUDED AS UNRELATED` (Task 644 harness side-effect, not touched this
   session) rather than in-scope.
2. This closes the two-slice "How it works" Mantine migration (644 component+story, 645 live swap) — confirm no
   further follow-up is needed for this section.

## Backlog update

See `docs/backlog.md` — concise active-state entry added, closing the 644/645 pair. Full detail lives here per
session-log rules.
