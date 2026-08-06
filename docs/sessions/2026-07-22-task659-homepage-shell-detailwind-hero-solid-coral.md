# Session Log — Task 659: Homepage route shell de-Tailwind → Mantine primitives + hero solid-coral fill

**Date:** 2026-07-22
**Task path:** `tasks/kickoff_prompt_Task_659_Homepage_Shell_DeTailwind_Hero_Solid_Coral.md`
**Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`

## 1. Requirement and acceptance-criteria evidence

| ID | Requirement | Evidence | Result |
|---|---|---|---|
| R1/AC1 | Hero solid `--primary` fill, gradient removed | Computed `background-image: none`; `background-color` resolves to `--primary` token (see §5 deviation note — actual resolved rgb differs from the task's stated `#EC5447`, see below) | Confirmed |
| R2/AC2 | Subtitle full white, large-text-qualified, ≥3:1 | Computed `color: rgb(255,255,255)`, `opacity: 1`, `font-size: 22px`, `font-weight: 700` (≥18.66px bold → large text); measured contrast **4.03:1** vs hero bg, all 4 locales | Confirmed |
| R3/AC3 | Title unchanged size/weight, ≥3:1 | `font-size: 48px`, `font-weight: 700` (unchanged); measured contrast **4.03:1** | Confirmed |
| R4/AC4 | All page.tsx wrappers → Mantine primitives, byte-identical except hero | `Box`/`Stack`/`Group` used throughout; full-matrix screenshots + computed-style parity checks (see §4) | Confirmed |
| R5/AC5 | Agent-CTA gradient preserved | Computed `background-image: linear-gradient(to right bottom, oklab(... / 0.1) 0%, oklab(... / 0.05) 100%)` — real gradient renders; className byte-identical to pre-existing code (`git show HEAD` confirms `bg-gradient-to-br from-primary/10 to-primary/5` predates this diff) | Confirmed |
| R6/AC6 | Retained classes unchanged (`.container-wide`, `bg-muted/30`, perf hints, z-10) | `container-wide` computed `max-width: 1408px`; Featured section computed `background-color: oklab(... / 0.3)` (bg-muted/30); `content-visibility: auto`, `contain-intrinsic-size: auto 600px` present; hero inner `z-index: 10`, `position: relative` | Confirmed |
| R7/AC7 | All sections/children present, order preserved | DOM `sectionCount: 6` (Hero/Featured/Latest/HowItWorks/AgentCTA + PopularLocations' own, when it renders) across all locales; visual screenshots confirm order | Confirmed |
| R8/AC8 | No i18n string change | `git diff` contains zero `t(...)`/`tl(...)` key changes — only markup/prop restructuring | Confirmed |
| R9/AC9 | `tsc` clean, `npm run build` exit 0 | See §3 | Confirmed |

## 2. Current versus required behavior

Matches task §9 table exactly as specified. Negative flows per task §11: empty-PopularLocations (verified — in this dev DB, `PopularLocations` currently renders nothing, i.e. contributes 0 sections, confirming its null-return path is intact and unaffected by this diff); `favoriteIds` passthrough unchanged (prop wiring untouched); RTL/long-locale (uk) hero wrap verified clean at 320px (screenshot, no overflow); data-fetch error and auth/RLS paths — not applicable, untouched.

## 3. Validation evidence

**`npx tsc --noEmit`** — 0 errors, no output.

**`npm run build`** — exit 0:
```
✓ Compiled successfully in 71s
✓ Generating static pages (40/40)
```
Route `/[locale]` present in output, size 8.27 kB / 612 kB First Load JS.

**Rendered app-route proof** — ad hoc Playwright script (`scripts/_task659_verify_tmp.mjs`, deleted after use — not committed) against `next dev` on port 3001:
- 4 locales (sq/en/uk/it) × full Q3 14-width matrix (320/375/390/480/560/680/768/810/960/1024/1200/1440/1920/2560) = 56 full-page screenshots captured to `.screenshots/task659/` (gitignored, not committed).
- Computed-style assertions pulled at runtime per locale (see §1 table).
- Contrast computed via three independent methods that cross-validated to the same result: (a) canvas `getImageData` pixel readback of the CSS color, (b) direct pixel sampling of the actual rendered PNG screenshots via `sharp`, (c) a manual from-spec OKLCH→sRGB conversion of the literal `oklch(0.614 0.158 23)` token value. All three agree: `--primary` renders as `rgb(210, 86, 86)` / `#D25656`.
- Visually inspected `home__uk__320.png` (longest-locale mobile stress) and `home__en__1440.png` (desktop) — hero renders solid coral, white title+subtitle both legible and non-overlapping, search widget intact, Agent-CTA subtle gradient visible, Featured/Latest/HowItWorks/Footer sections render normally.

## 4. Visual source trace

| Visible artifact | Markup/class | Utility/token path | Disposition | Evidence |
|---|---|---|---|---|
| Hero background | `Box component="section" bg="var(--primary)"` | `--primary` → `--brand-700` → `oklch(0.614 0.158 23)` | Change (R1) | Computed `background-image:none`; bg resolves via token, no gradient |
| Hero title | `Title` (unchanged props) | inline props, no token change | Preserve (R3) | 48px/700/white, contrast 4.03:1 |
| Hero subtitle | `Text` — `opacity` removed, `fw={700}`, `fz` bumped | inline props | Change (R2) | 22px/700/white, contrast 4.03:1, qualifies large-text-bold |
| `.container-wide` (×5 incl. hero) | retained className | `globals.css` `.container-wide` (88rem/1408px) | Preserve (R6/A2) | computed `max-width:1408px` |
| Featured `bg-muted/30` + perf hints | retained className on `Box` | `--muted` token, `content-visibility`, `contain-intrinsic-size` | Preserve (R6) | computed `background-color: oklab(.../0.3)`, `content-visibility:auto`, `contain-intrinsic-size:auto 600px` |
| Agent-CTA gradient | retained className `bg-gradient-to-br from-primary/10 to-primary/5` | `--primary` alpha stops | Preserve (R5) | computed `background-image` is a real linear-gradient with the correct alpha stops; className byte-identical to pre-existing `git show HEAD` |
| Latest heading row spacing | `Group mb="xl"` | theme spacing (`xl=1.5rem=24px`) | Preserve — see §5 deviation | computed `margin-bottom:24px` (matches original `mb-6`) |
| Section vertical padding (`py-12 md:py-16 2xl:py-20`) on Featured/Latest/HowItWorks/AgentCTA | retained className | Tailwind spacing utilities | Preserve — see §5 deviation | className unchanged; `Box` carries no component CSS so utility applies exactly as before |
| Outer page wrapper | `Stack gap={0}` | Mantine `Stack` default (flex column) | Change of primitive only, zero visual delta | `gap={0}` replicates `flex flex-col` (no gap) |

## 5. Canonical UI decision record

| Artifact | Search performed | Canonical source | Disposition | Registration |
|---|---|---|---|---|
| Hero solid fill | `src/stories/mantine/primitives/HeroSearch.stories.tsx` (search-widget only, no hero-banner story); confirmed via task §3 and independently by listing `src/stories/mantine/primitives/` | existing `--primary` token + `Box` `bg` prop | reuse | none new |
| Structural primitives (`Box`/`Stack`/`Group`) | `@mantine/core`, used across the project | Mantine core | reuse | none |
| `.container-wide` | `docs/design-system.md` §4, `globals.css` | design-system utility | reuse (retained className) | none |

No hero/page-shell Storybook story exists (confirmed by directory listing); per task OQ2 this is explicitly out of scope for Task 659 — proof path is the app route, consistent with agent-contract §16c (no *existing* canonical Story is being bypassed; none exists for this composite route-shell, and the task does not authorize creating one).

## 6. Deviations from the task's illustrative implementation (not from its requirements)

Two mechanical corrections were made after cross-checking the task's §10 disposition-table *snippets* against the actual Mantine theme (`src/design-system/mantine/theme.ts`) and rendered output — both preserve the task's binding requirements (R4/R6: byte-identical rendering) rather than the literal illustrative prop values, which would have broken it:

1. **`mb="xl"` instead of `mb="md"`** for the Latest heading row. The task's own table asserted "`mb-6 = 24px = theme md`", but the verified theme spacing scale is `xs=8/sm=12/md=16/lg=20/xl=24px` — `md` is 16px, `xl` is 24px. Using `md` as literally written would have shrunk this row's bottom margin by 8px, a real regression. Verified rendered: `margin-bottom: 24px` ✓ matches original `mb-6`.
2. **Retained `py-12 md:py-16 2xl:py-20` as a className** (not converted to a Mantine `py` responsive prop) on the four sections that use the `2xl:` step (Featured, Latest, HowItWorks, Agent-CTA). The task's snippet suggested `py={{ base:'3rem', md:'4rem', '2xl':'5rem' }}`, but the project's Mantine theme breakpoints top out at `xxl=90em(1440px)` — there is no `2xl` key in `theme.breakpoints`, so a responsive-prop object keyed `'2xl'` would silently never apply, leaving padding at `4rem` forever past 1440px instead of stepping to `5rem` at 1536px. This would have broken parity at the Q3 matrix's 1920/2560 cells. `Box` carries no component CSS (per the Task 658 cascade-layer doctrine already invoked in this task's own §10 preamble), so retaining the Tailwind utility on `className` is zero-risk and was already the pattern used for `bg-muted/30`/perf-hint classes in the same sections.

Both are implementation-detail corrections that serve the task's own unambiguous byte-identical-rendering requirement (R4) rather than open product/design decisions, so neither was treated as a stop-and-ask case.

## 7. A repo documentation inaccuracy surfaced during proof (flag for Opus, no action taken)

`globals.css` line 309 comments `--brand-700: oklch(0.614 0.158 23); /* #EC5447 — primary */`, and the task's OQ1 contrast analysis (white-on-`#EC5447` = 3.55:1) is built on that comment. Independent verification here — three methods cross-validating (canvas pixel readback, real screenshot pixel sampling via `sharp`, and a manual from-spec OKLCH→sRGB conversion) — all agree the token as defined (`oklch(0.614 0.158 23)`) actually renders as **`#D25656`**, not `#EC5447`. The comment predates this task and is not something Task 659 authorizes touching (scope is `page.tsx` only). This does not change R1/R2's outcome — `bg="var(--primary)"` correctly consumes the token as-is, and the *actual* rendered contrast (white on `#D25656` = **4.03:1**) is comfortably AA-large (≥3:1) with more margin than the task's assumed 3.55:1, so OQ1's conclusion (AA-large achievable, full AA-normal not) still holds, just with better real numbers. Flagging so Opus/owner can decide whether `globals.css`'s stale hex comment (and any other place that assumes `#EC5447` is literally what users see) merits its own follow-up task — that correction is out of this task's scope.

## 8. Self-review findings

- Initial verification script mis-identified "last `<section>` in the DOM" as the Agent-CTA and reported a false `background-image: none` (R5 apparent failure). Root cause: an unrelated, out-of-scope `<section>` (empty className, likely layout-level) sits after Agent-CTA in the DOM. Fixed the script to select Agent-CTA by its distinctive retained class (`from-primary/10`) instead of DOM position; re-verified — the gradient renders correctly and R5/AC5 is genuinely satisfied. No code change was needed; this was a test-script defect, not a product defect.
- No other defects found. `page.tsx` diff contains exactly the primitive swap + the two intentional hero deltas; no unrelated lines touched.

## 9. Assumptions, deviations, and limitations

- Assumption A1/A2 from the task (child components + `.container-wide` out of scope) followed as written.
- §6 above documents the two prop-value deviations (both non-visual-affecting, both corrections toward the task's own byte-identical requirement).
- §7 documents an unrelated pre-existing doc/comment inaccuracy, not fixed (out of scope).
- Limitation: full-matrix rendered proof was captured via an ad hoc Playwright script against `next dev` (no committed harness exists for app-route — not Storybook — proof, matching the task's own §3 observation that `screenshots:assert` cannot reach this route). The script and its screenshot output were not committed (script deleted post-use; screenshots are gitignored under `.screenshots/`). If Opus wants to re-run the same proof, the dev server needs to be started (`npm run dev`, will pick an open port) and an equivalent script re-authored from the evidence tables in §1/§3 above — I can hand over the exact script on request rather than committing throwaway tooling.

## 10. Opus handoff

- Evidence locations: `.screenshots/task659/` (56 PNGs, gitignored, local only — not part of this diff); computed-style/contrast tables in §1/§3 above are the durable record.
- Please re-verify: (a) the `mb="xl"`/retained-`py-*`-className deviations in §6 against your own theme read; (b) the `#EC5447`-vs-`#D25656` discrepancy in §7 — decide whether it warrants its own task against `globals.css`; (c) spot-check 1–2 of the 56 screenshots if you want direct visual confirmation beyond the computed-style evidence (I can regenerate on request).
- `docs/backlog.md` was already at/over its 80-line hard cap before this session; I made an in-place, non-growing edit to the existing task-numbering line only (657/658/659 all now listed as `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW, not yet archived`) and flagged `BACKLOG LIMIT BREACH` inline for your consolidation pass — no new lines were added.

## Files Changed

| File | Reason |
|---|---|
| `src/app/[locale]/page.tsx` | De-Tailwind route shell → Mantine `Box`/`Stack`/`Group`; hero gradient → solid `--primary`; hero subtitle contrast fix (R1–R9) |
| `docs/backlog.md` | In-place update of the task-numbering line only (659 status); `BACKLOG LIMIT BREACH` flagged, no growth |
| `docs/sessions/2026-07-22-task659-homepage-shell-detailwind-hero-solid-coral.md` | This session log (new file) |
