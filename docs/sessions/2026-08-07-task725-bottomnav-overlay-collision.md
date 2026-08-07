# Task 725 — The fixed bottom nav overlays and intercepts homepage content

**Kickoff:** `tasks/Sprints/Sprint_54_kickoff_prompt_Task_725_BottomNav_Overlay_Collision.md`
**Status:** `BLOCKED` — root cause fully measured (R1); fix requires an owner scope decision (see the stop-and-report
in K2 and the Opus handoff below) before implementation can proceed.

---

## K1 — Baseline

**Dirty-worktree manifest.** `git status --porcelain` at task start:

```
?? tasks/Sprints/Sprint_54_MobileBottomNav_Overlay_Collision.md
?? tasks/Sprints/Sprint_54_kickoff_prompt_Task_725_BottomNav_Overlay_Collision.md
```

Both are this task's own sprint-plan and kickoff files — `git hash-object`: `5e439cc1ee7801abd610098d592b6e46ac49352a`
and `ba94fb81a9f04c1924939735a0bafb1cbd4c464f`. Read-only inputs, not edited. **The worktree is otherwise clean** —
Tasks 711, 723, and 724R (which were uncommitted dirty state during 724R's own session) are now all landed on
`git log`:

```
7c3fc0166 fix(Task723): scope notifications header offset to top-* containers and add click-shield hit-test gate
fdbaac46f fix(Task724R): replace role=group gate suppression with DOM-measured chip-set exemption
a926e0cd8 chore(Task711): retire both dead-assertion registry entries after the re-anchor
```

A5 (723 must land first, D32) is satisfied — `scripts/check-click-shield.mjs` is committed, not read-only input.

**Task 723's review outcome (§3.5 check).** `docs/backlog.md` row 723: `APPROVED WITH NOTES` (review 2026-08-07).
CI wiring was explicitly **not** part of that review's scope — it is its own reserved follow-up, **Task 727**
("Wire `check:click-shield` into `.github/workflows/governance-pr.yml`... needs OQ2+OQ3 first"). Confirmed live:

```
$ grep -rn "click-shield" .github/workflows/*.yml
(no output, exit 1)
```

**R6 answer:** `check:click-shield` runs in **no** CI workflow as of this task. The gap is Task 727, reserved and
blocked on two unanswered owner decisions (OQ2: CI scope local-build vs production URL; OQ3: blocking-on-modal-routes
policy). This task does not wire it (§8 out of scope, kickoff requirement 9/§5.1).

**Port 3000 check:** free (no listener on 3000 before starting). `npm run build` → `EXIT_CODE=0`
(`.screenshots/task725-evidence/K1-build.log`... superseded by K8's later transcript). `npm start` → `Ready in
1042ms`. `BASE_URL=http://localhost:3000 npm run check:click-shield`:

`.screenshots/task725-evidence/K1-click-shield-baseline.log`:

```
Cells: 16  Elements checked: 208  Interceptions: 4  Empty-candidate cells: 0
EXIT_CODE=1
```

**Identical to Task 724's recorded after-state** (`I3-click-shield-after.log`, kickoff §3.2 row 3) — 208
checked, 4 interceptions, all at `mobile-390`, one per locale, all blocked element "View all"/translated
equivalent, all interceptor `<path class="[object SVGAnimatedString]">`. Reproducible, not drifted.

**§3.3 arithmetic, verified myself (not inherited):** blocked element rect quoted by the gate:
`(16,782 358x44)` → y-range **782–826**, centre **804**. `mobile-390` viewport height = **844**
(`check-click-shield.mjs` viewport table). Nav occupies `bottom:0` to `height:56px` (module CSS `:64`, verified
below) → band **788–844** (headless; A2's safe-area caveat still applies — real devices reserve more). Overlap:
`826 − 788 = 38` of the CTA's 44px height is inside the band; **the centre (804) falls inside 788–844** — a
real click at the element's own centre lands on the nav, matching `elementFromPoint`'s behavior.

---

## K2 — R1: instrumented DOM measurement (root cause)

Diagnostic script (one-off, not part of the shipped diff, deleted after use): walks from each reported
interceptor to its nearest positioned ancestor, recording rect/`position`/`z-index` for both, plus the blocked
element's rect and the real viewport height. Run against the K1 baseline server, all 4 locales × all 4 viewports.
Raw JSON: `.screenshots/task725-evidence/K2-instrumented-measurement.json`.

**Result — identical shape across all 4 locales, only at `mobile-390`:**

```json
{
  "blocked": { "tag": "a", "text": "View all", "rect": { "top": 782, "bottom": 826 }, "position": "relative", "zIndex": "auto" },
  "rawInterceptor": { "tag": "path", "class": "", "rect": { "top": 797.5, "bottom": 811.5, "width": 0 } },
  "nearestPositionedAncestor": {
    "tag": "nav", "class": "mobile-bottom-nav MobileBottomNavView_navBar__O_rgE mantine-hidden-from-md",
    "rect": { "top": 788, "bottom": 844, "width": 390, "height": 56 },
    "position": "fixed", "zIndex": "30"
  },
  "clickPoint": { "x": 195, "y": 804 }
}
```

`documentScrollHeight` at the time: 4143–4193px (varies by locale). `scrollY: 0` — this happens at the page's
**natural initial resting scroll position**, not mid-scroll. `checked: 14` in every failing cell — not a vacuous/
empty-candidate run.

**Which element, structurally:** the interceptor's nearest positioned ancestor is confirmed as `MobileBottomNavView`'s
own `<nav>` (`position:fixed`, `z-index:30`) — the raw `<path>` is a real icon inside one of its 5 real nav
buttons (`x=195` = the exact horizontal centre of a 390px viewport = the FAB "+" button). **This is not decorative
padding or a hit-testing accident — the nav genuinely, correctly renders a real control at every pixel of its
56px band.** §5.1's "the nav really does cover a control" is directly confirmed, not assumed.

**Where the blocked element actually sits, structurally:** traced via `src/app/[locale]/page.tsx` →
`FeaturedListingsView.tsx`. The blocked link is `ViewAllLink` inside `FeaturedListingsView`'s header `Group`
(`justify="space-between"`, `flexDirection:'column'` at mobile — Task 724's own already-correct fix), immediately
below the `Title` reading "Featured"/`t('featured')`. This is the **very first section after the page's Hero** —
not the document's end, not anywhere near the Footer.

**Measured Hero + header-row geometry (`en`, all 3 mobile widths, second diagnostic pass):**

| Viewport | Hero rect (top–bottom) | Header-row top | `ViewAllLink` rect (top–bottom) | `innerHeight` | In first viewport? |
|---|---|---:|---|---:|---|
| mobile-320 | 97–755 | 755 | **844–888** | 812 | **No — already below the fold** |
| mobile-375 | 97–725 | 725 | **814–858** | 812 | **No — already below the fold** |
| mobile-390 | 65–693 | 693 | **782–826** | 844 | **Yes — 804 centre inside 788–844 nav band** |

**This is the actual finding, and it changes the read on §3.6's hypothesis: at `mobile-320`/`375`, the "View all"
link is not "reaching above the nav band" — it is entirely below `window.innerHeight` (812) and is never even a
`click-shield` candidate there** (the gate's own candidate filter excludes any element whose centre falls outside
`[0, innerHeight)` — confirmed by reading `check-click-shield.mjs:129-131`). Those two cells pass because the
element is untested, not because it is genuinely clear. Only at `mobile-390` — where `innerHeight` (844) is 32px
taller than at 320/375 (812) — does the same content stack bring the link just barely into the visible viewport,
landing it directly in the collision band.

**§3.6's hypothesis: REFUTED as stated, confirmed in spirit.** The hypothesis was: *"a footer reserves space at
the bottom of the document; a `position:fixed` nav overlays the bottom of the viewport at every scroll position;
content that lands in that band before the footer is reached has no clearance."* The mechanism named
(`<main>`'s `pb={{base:'var(--space-14)', md:0}}`, `layout.tsx:50`) is **provably irrelevant to this specific
collision** — that padding is rendered once, at the very end of `<main>`'s content, immediately before `<Footer>`.
The colliding element sits at document-position ≈782px inside a ≈4150px-tall document — roughly 19% down the
page, nowhere near `<main>`'s trailing edge. No amount of end-of-document padding can move a mid-document element's
on-screen position. **The general diagnosis in spirit is still correct** — there genuinely is no viewport-level
nav clearance contract anywhere in the app; only an end-of-document one exists — but the specific mechanism named
does not, and structurally cannot, reach this collision.

**Why no fix within this task's authorized scope (§7) can correctly close this, and why this is a stop, not a
fix:**

The measured cause is homepage-content-specific: the exact vertical distance from page-top through the Hero
section to the Featured-listings header row, at exactly `mobile-390`'s 844px viewport height, for the current
`en`/`sq`/`uk`/`it` string lengths. The only mechanisms that would *actually* move this element out of the
collision band are:

1. **Reduce the height of content above it** (Hero's own padding/height, in `src/app/[locale]/page.tsx`) so the
   header row shifts up and clears `y=788` from below. This is a real, targeted, non-arbitrary fix in the sense
   that it protects *whatever* renders there (not "if this is the View all button") — but `page.tsx` and
   `FeaturedListingsView.tsx` are **not in §7's authorized scope list**, which names only
   `layout.tsx`/`globals.css`/`MobileBottomNavView.*`/`FooterView.module.css`.
2. **Restructure the scroll model** (an "app-shell" pattern: reserve the nav's height as real, permanent layout
   space via `calc(100dvh − navHeight)` on the scrollable content area, so the nav can never visually overlap
   *any* page's content at *any* scroll position) — this is the only mechanism that would satisfy R2's literal
   "at any scroll position, on any page" framing in full generality. It is also unambiguously outside this task's
   scope and blast radius: it changes every mobile page below the nav breakpoint, touches how `<main>`/`<body>`
   scroll sitewide, and is exactly the kind of decision A4 requires a stop for ("the blast radius may exceed the
   homepage... if the right answer needs an owner call, stop and report rather than choosing for them").
3. **Move or resize the nav itself** — explicitly rejected by §5.1 as the default, and permitted only with
   evidence the nav itself is mis-positioned. K2's measurement shows the opposite: the nav is exactly where
   Task 713 placed it, rendering a real, correctly-functioning control at every pixel of its band. There is no
   mis-positioning evidence to license this route.

**Conclusion: stop and report (clause 9, A4).** R1 is complete and the root cause is measured, not assumed. R2
cannot be safely implemented within `docs/backlog.md`, session log, and the six file paths §7 authorizes, without
either quietly exceeding scope into homepage content (`page.tsx`/`FeaturedListingsView.tsx`, option 1) or
undertaking a sitewide scroll-model restructure this task was never scoped for (option 2). Both are real,
legitimate fixes; neither is mine to choose without the owner's authorization. Filed as **BLOCKED** pending that
call — see the handoff at the end of this log for the exact question.

---

## Requirement status (R2/R3/R5/R7 blocked on the owner call above; the rest completed)

- **R1 [AC1] — VERIFIED.** Full instrumented measurement above; raw JSON persisted; §3.6 hypothesis explicitly
  decided (refuted as stated, confirmed in spirit).
- **R2 [AC2] — BLOCKED.** No fix implemented — see the stop-and-report above. Not attempted inside unauthorized
  scope, and not forced into an authorized file that measurement shows would not work.
- **R3 [AC3] — NOT APPLICABLE (no fix landed).** Baseline is K1's transcript: `Interceptions: 4`,
  `Empty-candidate cells: 0`, 208 checked, 16 cells — quoted above, unpiped.
- **R4 [AC4] — VERIFIED: does not reproduce.** Baseline `checked=208` total (sum of all 16 cells' `checked=`
  values) — identical to Task 724's 208, not 723's original 221. All 4 present interceptions are the "View
  all"/translated-equivalent link; **zero** are `FavoriteButton`/heart-icon `ActionIcon` elements (confirmed both
  in the raw gate log and the instrumented JSON — every violation's `blocked.tag` is `"a"` with `text` matching
  "view all" in each locale). Task 723's original 4 `FavoriteButton` interceptions **do not reproduce**, exactly
  matching Task 724's own prior finding — not independently caused by anything in this session, since nothing was
  changed. The 221→208 delta itself remains unexplained (Task 724 also left it as an observation, not a claim);
  re-deriving it would require Task 723's original build artifact, out of this task's scope.
- **R5 [AC5] — DEFERRED, not decided against.** The two diagnostic defects in `check-click-shield.mjs` (§3.4) are
  real — confirmed directly in K2's measurement (`rawInterceptor.class: ""` for the SVG `<path>` before my
  diagnostic script's `getAttribute('class')` workaround; `rawInterceptor.rect.width: 0` for the same element).
  Deferred rather than fixed in this session because R5 is explicitly gated on 723 having landed (satisfied) but
  fixing the gate script itself, mid-way through an R2 that is itself blocked, risks conflating "gate diagnostic
  fix" evidence with "condition fix" evidence the orchestrator needs to evaluate separately. Recommend re-opening
  once R2's scope question is resolved, in the same task that lands the real fix (so R7's planted round trip
  exercises both together).
- **R6 [AC6] — VERIFIED.** `grep -rn "click-shield" .github/workflows/*.yml` → no output, exit 1 (K1 above).
  Task 727 (reserved, `docs/backlog.md`) is the named, filed gap; this task does not close it.
- **R7 [AC7] — NOT RUN.** No fix landed to prove a round trip against. `npm run check:click-shield:verify` was
  not executed this session — the gate's self-test (3 planted fixtures) is orthogonal to whether R2 has landed and
  could still be run as a pure mechanism check, but doing so here would not constitute R7's actual requirement
  ("passes **after the fix**"), so it is recorded as not run rather than reported as satisfying R7.
- **R8 [AC8] — VERIFIED, untouched.** `git hash-object src/components/layout/MobileBottomNavView.module.css
  src/components/layout/MobileBottomNavView.tsx` → `a06cf6b4108041be6e0ea703271e0951a8ac1a87` /
  `e8dfb1ba8fc0da16344b59def8ff5ae28161773c`. `git status --porcelain` confirms neither file is modified — no
  diff exists to compare against a "pre-task" hash; these are simply the current, unmodified blobs.
- **R9 [AC9] — Not applicable.** No user-facing string was added or changed this session.
- **R10 [AC10] — VERIFIED.** `npx tsc --noEmit` → `EXIT_CODE=0` (`.screenshots/task725-evidence/K7-tsc.log`).
  `npm run build` → `EXIT_CODE=0`, captured as part of K1's baseline (`.screenshots/task725-evidence/K1-build.log`)
  — the only build this session, since no source file changed after it.
- **R11 [AC11] — see the counting-gates section below.**

---

## Files changed

**None in `src/`, `scripts/`, or any code path.** No fix was implemented (R2 blocked). Only documentation/evidence
artifacts:

| File | Reason |
|---|---|
| `docs/sessions/2026-08-07-task725-bottomnav-overlay-collision.md` | This session log (new) |
| `docs/backlog.md` | Concise active-state update (below) |
| `.screenshots/task725-evidence/*` | K1 baseline build/click-shield transcripts, K2 instrumented measurement JSON, K7 tsc transcript (all local-only, D6) |

`docs/storybook-governance.md` was **not** edited — there is no landed fix to record there yet; recording only the
root cause without a fix would misrepresent the section's own convention (every prior §14.9.x entry documents a
closed mechanism). The root cause is fully recorded in this session log instead, ready to fold into governance
once R2 lands.

## Standing findings not acted on

721 · 722 · 678 · 717 · `HeroSearch` (Sprint 49) · 724/724R (Sprint 53, `APPROVED WITH NOTES`) · the CI wiring gap
(§3.5/R6, owned by Task 727, blocked on OQ2+OQ3) · R5's two diagnostic `check-click-shield.mjs` defects (deferred,
not decided against — see R5 above).

## Counting gates — two passes

**Pass 1** (before this session's writes were final): `check:file-integrity` — 3 files, PASSED, exit 0.
`check:mojibake` — 2097 files, 0 artifacts, exit 0.

**Pass 2 — genuinely last, after this section and the backlog update both exist:**

```
check:file-integrity → 4 files checked, PASSED, EXIT_CODE=0
check:mojibake       → 2097 files scanned, 0 artifacts, EXIT_CODE=0
```

**Composition reconciled to `git status --short`:** 1 `M` (`docs/backlog.md`) + 3 `??` (this session log, and this
task's own two pre-existing Sprint 54 files, unedited) = **4** — matches file-integrity's count exactly.

## Assumptions, deviations, limitations, unresolved issues

- **No code fix landed.** This is a `BLOCKED` handoff, not `IMPLEMENTED`. R2/R3/R5/R7 are the open items; R1/R4/
  R6/R8/R9/R10 are complete and hold regardless of when R2 lands.
- **A2's safe-area limitation applies as stated in the kickoff**: every measurement here is headless (safe-area
  inset 0); real iOS/Android devices reserve additional space below the nav, making the real-world collision at
  least as bad as measured, never better.
- **The exact fix is an owner decision, not a missing measurement.** Two concrete options are on the table
  (targeted homepage-content spacing fix vs. sitewide app-shell restructure); this log states the trade-off for
  each but does not recommend one over the other, since blast radius vs. correctness-in-general is a product
  call, not an engineering one.
- The 221→208 `check:click-shield` element-count delta (predates this task, also unexplained by Task 724) remains
  unexplained.
- No mutating git command was run, emitted, or suggested.
