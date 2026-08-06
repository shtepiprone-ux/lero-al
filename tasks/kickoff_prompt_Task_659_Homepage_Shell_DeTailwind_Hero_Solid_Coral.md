# Task 659 — Homepage route shell de-Tailwind → Mantine primitives + hero solid-coral fill (remove gradient)

## 1. Mode and task type

- **Mode:** Implementation kickoff for a fresh Sonnet session. Execute via `.claude/skills/execute-task/SKILL.md`.
- **Task type:** UI — current Mantine path. **Route-level page shell** for the public homepage (`/{locale}`). High blast radius (every visitor's first screen).
- **QA profile:** `Q3 Full Visual Matrix` (justified in §13). Page shell + an intentional visible hero change on a canonical public route.

## 2. Objective

Two coupled changes to **`src/app/[locale]/page.tsx` only**:

1. **De-Tailwind the page's own authored shell.** Convert the raw `<div>`/`<section>` structural markup that `page.tsx` itself authors into Mantine primitives (`Box`, `Stack`, `Group`), rendering **byte-identical** to today **except** for the two intentional deltas below. This closes the last raw-HTML scaffolding on the homepage route tree, consistent with the Task 658 card-chrome migration.
2. **Intentional visual delta — hero background.** Remove the hero `<section>`'s dark gradient (`bg-gradient-to-br from-brand-950 via-primary/80 to-brand-950`) and replace it with a **solid primary-coral fill** (`--primary` = `--brand-700` = `#EC5447`).
3. **Intentional visual delta — hero subtitle contrast.** Because the background lightens from mostly-dark to solid `#EC5447`, the white subtitle's contrast drops. Adjust the subtitle so white text meets the design system's accessible bar on the new coral (see the hard constraint in §5/§9 and open question OQ1).

**Everything else on the page is a parity-preserving primitive swap, not a redesign.** Only the hero background and hero subtitle change visually.

## 3. Verified context

All facts below were inspected in this session.

**Affected file (only):** `src/app/[locale]/page.tsx` — the `HomePage` server component.

**Current homepage structure (as authored in `page.tsx`):**

- Outer wrapper: `<div className="flex flex-col">`.
- **Hero** `<section className="relative bg-gradient-to-br from-brand-950 via-primary/80 to-brand-950 text-primary-foreground py-16 md:py-24">` → `<div className="container-wide relative z-10">` → `<div className="max-w-3xl mx-auto text-center mb-10">` containing a Mantine `Title` (kept) and Mantine `Text` subtitle `c="white" opacity={0.8} fz={{ base:'1rem', sm:'1.125rem' }} maw={576} mx="auto"`; then `<HeroSearchClient />`.
- **Featured** `<section className="py-12 md:py-16 2xl:py-20 bg-muted/30 [content-visibility:auto] [contain-intrinsic-size:auto_600px]">` → `<div className="container-wide">` → `<FeaturedListings favoriteIds={…} />`.
- **Latest** `<section className="py-12 md:py-16 2xl:py-20 [content-visibility:auto] [contain-intrinsic-size:auto_500px]">` → `<div className="container-wide">` → `<div className="flex items-center justify-between mb-6">` (Mantine `Title` + `<ViewAllLink />`) → `<LatestListings favoriteIds={…} />`.
- **Popular locations:** bare `<PopularLocations />` (renders its own `<section>` wrapper internally; returns `null` when empty).
- **How it works** `<section className="py-12 md:py-16 2xl:py-20 [content-visibility:auto] [contain-intrinsic-size:auto_340px]">` → `<div className="container-wide">` → `<HowItWorksSteps … />`.
- **Agent CTA** `<section className="py-12 md:py-16 2xl:py-20 bg-gradient-to-br from-primary/10 to-primary/5 [content-visibility:auto] [contain-intrinsic-size:auto_280px]">` → `<div className="container-wide">` → `<div className="max-w-2xl mx-auto text-center">` (Mantine `Box`/`Title`/`Text` + `<AgentCtaButton />`).

**Verified tokens (`src/app/globals.css`):**

- `--primary` → `var(--brand-700)` → `oklch(0.614 0.158 23)` = **`#EC5447`** (the "primary" coral). Line 340, 309.
- `--primary-foreground` → `var(--neutral-0)` = white; the file's own comment: `/* White — 3.55:1, AA large text ✓ */` (line 341). **White on `#EC5447` = 3.55:1 — passes AA for large text (≥3:1), fails AA for normal text (needs 4.5:1).**
- `--primary-hover` → `var(--brand-800)` = `#BD4339`, "4.9:1 ✓ WCAG AA" (line 342) — **not** selected for this task (owner chose `--primary`).
- `.container-wide` is a **design-system utility** (globals.css §, lines 570–587): `max-width: var(--width-page-max)` = `88rem` (1408px) + responsive horizontal padding (1rem / 1.5rem@640 / 2rem@1024 / 3rem@1536), `margin-inline:auto`. Source of truth per `docs/design-system.md §4`. **No Mantine prop equivalent.**

**Tailwind spacing → concrete values (for prop mapping):** `py-12`=3rem/48px, `py-16`=4rem/64px, `py-20`=5rem/80px, `py-24`=6rem/96px, `mb-6`=1.5rem/24px, `mb-10`=2.5rem/40px, `max-w-2xl`=42rem/672px, `max-w-3xl`=48rem/768px, `gap`/`z-10`=zIndex 10.

**Owner decision (this session):** hero fill = solid `--primary` (`#EC5447`); keep white text; **fix the subtitle** to reach the accessible bar (remove `opacity={0.8}`; see OQ1 for the hard physics constraint).

**Storybook / proof-path reality:**

- The homepage hero **section is inline route markup with no Storybook story.** `src/stories/mantine/primitives/HeroSearch.stories.tsx` covers only the search widget (`HeroSearchClient`), not the hero banner background/heading. `HowItWorksSteps.stories.tsx` exists for that child.
- `scripts/check-stories-rendered.mjs` (`npm run screenshots:assert`) is **Storybook-iframe based** — it does **not** render the app route `/{locale}`. Therefore the hero visual change **cannot** be proven by `screenshots:assert`; it must be proven by rendering the **app route** in `next dev` (see §13).
- The homepage is **not** in `docs/critical-flow-registry.md` (only header/NotificationBell hydration is). No automated critical-flow regression is mandated for this change.

## 4. Requirements (ledger)

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | Owner | Hero `<section>` background renders a **solid `--primary` (#EC5447)** fill; the `bg-gradient-to-br from-brand-950 via-primary/80 to-brand-950` gradient is removed. | P0 | Rendered app-route + computed `background`/`background-image` | Confirmed |
| R2 | Owner | Hero **subtitle** white text meets the design-system accessible bar on the new coral: `opacity:0.8` removed (full white) **and** it qualifies as large text so the 3.55:1 pairing satisfies AA-large (≥3:1). | P0 | Computed contrast + computed font-size/weight (see OQ1) | Confirmed (with OQ1 constraint) |
| R3 | Owner | Hero **title** remains white and unchanged in size/weight; still passes AA-large on the new coral. | P0 | Computed contrast/size | Confirmed |
| R4 | Owner | Every raw `<div>`/`<section>` **authored in `page.tsx`** becomes a Mantine primitive (`Box`/`Stack`/`Group`), rendering **identically** to today at every viewport/locale (except R1–R3). | P0 | Visual parity matrix + inspection | Confirmed |
| R5 | Rule (P0 §1 scope) | **Agent-CTA section's own gradient** (`from-primary/10 to-primary/5`) is **preserved** exactly. Only the hero gradient is removed. | P0 | Computed `background-image` on the CTA section | Confirmed |
| R6 | Rule (Task 658 doctrine) | Token-less / alpha / perf carve-out classes are **retained on `Box` className** with no value drift: `.container-wide`, `bg-muted/30`, `[content-visibility:auto]`, `[contain-intrinsic-size:*]`, `z-10`. | P0 | Inspection + computed style | Confirmed |
| R7 | Rule (agent-contract §3/§5) | All existing sections, their order, child components, and links (Featured, Latest+ViewAll, PopularLocations, HowItWorks, AgentCTA) remain present and reachable. | P0 | Rendered route inspection | Confirmed |
| R8 | Rule (agent-contract §7) | **No user-facing string added or changed** → no i18n work required. | P1 | Diff inspection (no `t(...)` key changes) | Confirmed |
| R9 | Rule (agent-contract §9) | `tsc` clean and `npm run build` exit 0. | P0 | Actual transcripts | Confirmed |

Every acceptance criterion in §12 maps to these IDs.

## 5. Assumptions and open questions

- **OQ1 (CONFLICTING — read before implementing).** White text on `#EC5447` **caps at 3.55:1** — this is the ceiling for white-on-primary regardless of opacity or weight. Therefore **strict AA 4.5:1 for normal-size subtitle text is physically unachievable with white on this exact coral.** The owner chose "solid `--primary` + fix subtitle". The achievable, design-system-consistent resolution encoded in R2/AC2 is: **remove `opacity:0.8`** (full 3.55:1 white) **and ensure the subtitle qualifies as "large text"** (≥24px regular, or ≥18.66px/≈1.17rem bold) so 3.55:1 satisfies **AA-large (≥3:1)** — matching globals.css's own "AA large text ✓" note for this pairing. **If the owner instead requires strict AA 4.5:1 at the current small subtitle size, that is impossible with white on `#EC5447`** and requires either a darker fill (`--primary-hover`/`#BD4339`, previously offered) or a non-white subtitle — a re-decision that changes R1. Executor must **not** silently ship a sub-3:1 subtitle; if the large-text sizing looks wrong to the executor, stop and return `BLOCKED - CANONICAL STYLE DECISION REQUIRED`.
- **OQ2 (scope).** The homepage hero has **no Storybook story**; proof is via the app route (§13). Extracting the hero into a canonical `HeroSection` component + story is **out of scope** for this task unless the owner explicitly requests it (that would be a `create canonical` follow-up).
- **Assumption A1.** "De-Tailwind the page" means **only `page.tsx`'s own authored markup**. The child components it renders (`HeroSearchClient`, `FeaturedListings`, `LatestListings`, `PopularLocations`, `HowItWorksSteps`, `AgentCtaButton`, `ViewAllLink`) are **separate surfaces** and are **out of scope** (§8), matching the Task 658 file-scoped precedent.
- **Assumption A2.** `.container-wide` stays a retained className (design-system source of truth), not re-implemented as a Mantine `Container`, to avoid padding/max-width drift.

## 6. Pre-read rule bundle (for the executor)

Read only these before implementing:

1. `docs/agent-contract.md` (P0 invariants, esp. §1 scope, §3/§5 capability/flow preservation, §7 i18n, §9 build gate).
2. `.claude/skills/execute-task/SKILL.md` (executor evidence protocol).
3. `docs/mantine-responsive-design-system.md` (primitive/prop + responsive-object usage).
4. `docs/tailadmin-style-reference.md` (visual chrome/spacing/typography conformance).
5. `docs/qa-profiles.md` → `Q3` evidence + viewport policy.
6. `docs/design-system.md` §4 (`.container-wide` / `--width-page-max`).
7. This task's §3 token table (do not re-derive; use the verified values).

Do **not** read the whole `docs/` tree.

## 7. Scope

- Edit **`src/app/[locale]/page.tsx`** only.
- Replace `page.tsx`'s own raw `<div>`/`<section>` structural elements with Mantine `Box`/`Stack`/`Group`, explicit props, byte-identical output except R1–R3.
- Remove the hero gradient; apply solid `--primary` fill (R1).
- Fix the hero subtitle per R2/OQ1.

## 8. Out of scope

- **Do not** modify any child component: `HeroSearchClient`, `FeaturedListings`, `LatestListings`, `PopularLocations`, `HowItWorksSteps`, `AgentCtaButton`, `ViewAllLink`, `AppImage`, or the listing card.
- **Do not** remove or alter the **Agent-CTA section's own gradient** `from-primary/10 to-primary/5` (R5).
- **Do not** re-implement `.container-wide` as a Mantine `Container` or change its padding/max-width (R6/A2).
- **Do not** change any section's order, spacing values, `content-visibility` perf hints, `bg-muted/30`, or any translation string.
- **Do not** extract new components or add Storybook stories (OQ2).

## 9. Current and required behavior

| Aspect | Current | Required after |
|---|---|---|
| Hero background | Dark diagonal gradient `brand-950 → primary/80 → brand-950` (mostly dark). | **Solid `#EC5447`** (`--primary`), no gradient. |
| Hero title | White, large, bold; high contrast on dark gradient. | White, **same size/weight**; passes AA-large (3.55:1) on coral. |
| Hero subtitle | White `opacity:0.8`, `fz base 1rem / sm 1.125rem` (small). | White, **`opacity` removed**, sized to qualify as **large text** so 3.55:1 = AA-large ✓ (OQ1). |
| Hero/section markup | Raw `<div>`/`<section>` + Tailwind. | Mantine `Box`/`Stack`/`Group` primitives; identical layout. |
| Agent-CTA gradient | Subtle `from-primary/10 to-primary/5`. | **Unchanged** (preserved). |
| Other sections | Featured / Latest+ViewAll / PopularLocations / HowItWorks. | **Unchanged** rendering; only wrapper markup migrated. |
| i18n | 4 locales via `t(...)`. | **Unchanged.** |

## 10. Implementation requirements — visual source map & dispositions

Apply the **Task 658 cascade-layer doctrine**: `Box` carries no component CSS, so a retained `className` on `Box` behaves exactly as on the raw element; `Group`/`Stack` must receive **explicit** `gap`/`justify`/`align`/`wrap` props (their own unlayered CSS would defeat a kept Tailwind flex/gap class).

| Visible artifact / element | Current markup + classes | Utility → CSS/token semantics | Disposition |
|---|---|---|---|
| Page outer wrapper | `<div className="flex flex-col">` | vertical block flow, no gap | → `<Stack gap={0}>` (or `Box`); children keep own `py` |
| Hero section | `<section className="relative bg-gradient-to-br from-brand-950 via-primary/80 to-brand-950 text-primary-foreground py-16 md:py-24">` | dark gradient bg; white text; py 64/96px | → `<Box component="section" bg="var(--primary)" pos="relative" py={{ base:'4rem', md:'6rem' }}>` — **gradient removed (R1)**; text color set by children |
| Hero inner container | `<div className="container-wide relative z-10">` | design-system width + zIndex 10 | → `<Box className="container-wide" pos="relative" style={{ zIndex: 10 }}>` — `.container-wide` **retained** (R6) |
| Hero copy block | `<div className="max-w-3xl mx-auto text-center mb-10">` | 768px max, centered, mb 40px | → `<Box maw={768} mx="auto" ta="center" mb={40}>` |
| Hero title | Mantine `Title order={1} c="white" …` | white, large, bold | **keep as-is** (R3) — verify AA-large on coral |
| Hero subtitle | Mantine `Text c="white" opacity={0.8} fz={{ base:'1rem', sm:'1.125rem' }} maw={576} mx="auto">` | white 80% small | → **remove `opacity`**, set large-text size/weight per OQ1 (R2); keep `c="white" maw` |
| Hero search | `<HeroSearchClient />` | — | **out of scope** |
| Featured section | `<section className="py-12 md:py-16 2xl:py-20 bg-muted/30 [content-visibility:auto] [contain-intrinsic-size:auto_600px]">` | py 48/64/80; muted 30% bg; perf hints | → `<Box component="section" py={{ base:'3rem', md:'4rem', '2xl':'5rem' }} className="bg-muted/30 [content-visibility:auto] [contain-intrinsic-size:auto_600px]">` — classes **retained** (R6) |
| `.container-wide` wrappers (×4) | `<div className="container-wide">` | design-system width | → `<Box className="container-wide">` (R6) |
| Latest heading row | `<div className="flex items-center justify-between mb-6">` | flex row, center, space-between, mb 24 | → `<Group justify="space-between" align="center" wrap="nowrap" mb="md">` (mb-6 = 24px = theme `md`) |
| Latest/Featured/HowItWorks section wrappers | as above (py + perf hints) | → same `Box component="section"` + retained perf-hint className pattern |
| Agent-CTA section | `<section className="… bg-gradient-to-br from-primary/10 to-primary/5 …">` | subtle coral gradient + perf hints | → `<Box component="section" py={…} className="bg-gradient-to-br from-primary/10 to-primary/5 [content-visibility:auto] [contain-intrinsic-size:auto_280px]">` — **gradient PRESERVED** (R5) |
| Agent-CTA copy block | `<div className="max-w-2xl mx-auto text-center">` | 672px max, centered | → `<Box maw={672} mx="auto" ta="center">` |

**Canonical UI decision record:**

| Visible artifact | Search / inspected | Canonical source | Disposition | Token / registration |
|---|---|---|---|---|
| Hero solid fill | globals.css `--primary`/`--brand-700`; `bg` prop | Mantine `Box` `bg` + existing `--primary` token | **reuse** | `bg="var(--primary)"` — no new token/story |
| Subtitle contrast | globals.css `--primary-foreground` note (3.55:1 AA-large) | existing white token + large-text sizing | **reuse** | no new token; local prop change only |
| Structural primitives | `Box`/`Stack`/`Group` in `@mantine/core` (used across project) | Mantine core | **reuse** | none |
| `.container-wide` | design-system.md §4; globals.css | design-system utility | **reuse (retained className)** | no local re-implementation |

No `extend`/`create canonical` needed — nothing new is authored.

## 11. Positive and negative flows

**Positive flow:** Visitor loads `/{locale}` → hero renders a solid coral (`#EC5447`) banner with white title + white large-text subtitle at readable contrast → search widget, Featured, Latest (+View all), Popular locations, How-it-works, and Agent-CTA render exactly as before → responsive layout identical at every width.

**Negative-flow applicability:**

| Branch | Applicable? | Handling / reason |
|---|---|---|
| Empty popular locations | Yes (existing) | `PopularLocations` returns `null`; section hides — **preserve**, do not touch. |
| Logged-out vs logged-in `favoriteIds` | Yes (existing) | Passed through unchanged to Featured/Latest — **preserve**. |
| RTL / long-locale text overflow in hero | Yes | Verify hero title/subtitle wrap cleanly at 320px in all 4 locales (sq/en/uk/it). |
| Data-fetch error (supabase) | No | Not in scope; page.tsx error handling unchanged. |
| Auth / RLS / write paths | No | Read-only public page; no write path touched. |

## 12. Acceptance criteria

- **AC1 [R1]** Given `/{locale}`, when the hero renders, then its computed `background-image` is `none` and computed `background-color` resolves to `#EC5447` (`--primary`); the old `brand-950/primary/80` gradient is absent.
- **AC2 [R2]** Given the hero subtitle, when rendered on the coral fill, then its computed color is full white (no 0.8 opacity) **and** it qualifies as large text (computed ≥24px regular or ≥18.66px bold), so measured contrast ≥ 3:1 (AA-large). It must never render below 3:1.
- **AC3 [R3]** Given the hero title, when rendered, then size/weight are unchanged from today and contrast ≥ 3:1 on the coral.
- **AC4 [R4]** Given the full Q3 viewport matrix × 4 locales, when the homepage renders, then every section except the hero is visually identical to the pre-change baseline (spacing, alignment, wrapping, backgrounds).
- **AC5 [R5]** Given the Agent-CTA section, when rendered, then its computed `background-image` still contains the `from-primary/10 to-primary/5` linear gradient (preserved).
- **AC6 [R6]** Given the migrated wrappers, when inspected, then `.container-wide`, `bg-muted/30`, `content-visibility`, `contain-intrinsic-size`, and `z-10` behaviors are unchanged (computed max-width 1408px, muted-30 bg, zIndex 10 present).
- **AC7 [R7]** Given the page, when rendered, then all sections, their order, child components, and the "View all" link are present and reachable.
- **AC8 [R8]** Given the diff, when reviewed, then no `t(...)` key or locale string was added or changed.
- **AC9 [R9]** Given the repo, when validated, then `tsc` is clean and `npm run build` exits 0.

## 13. QA profile and verification plan

**Profile: `Q3 Full Visual Matrix`** — page shell + an intentional visible change on a canonical public route (qa-profiles.md Q3 row: "page shell … or any task the owner marks visual-critical").

**Proof path is the APP ROUTE, not Storybook** (§3: no hero story; `screenshots:assert` is Storybook-only).

Verification steps (executor runs and pastes actual output):

1. `npx tsc --noEmit` → 0 errors.
2. Start `next dev`; render `/{locale}` for **sq, en, uk, it** across the Q3 viewport matrix `320 / 375 / 390 / 480 / 560 / 680 / 768 / 810 / 960 / 1024 / 1200 / 1440 / 1920 / 2560`. Capture the **hero** (AC1–AC3, AC4 stress at 320) and full-page parity for the other sections (AC4).
3. **Computed-style assertions** on the rendered route: hero `background-image:none` + `background-color:#EC5447` (AC1); hero subtitle computed `color` = full white, computed `font-size`/`font-weight` meeting the large-text threshold, measured contrast ≥3:1 (AC2); hero title contrast ≥3:1 (AC3); Agent-CTA section `background-image` still the gradient (AC5); a `.container-wide` element computed `max-width:1408px` and `z-10` element `z-index:10` (AC6).
4. Diff review confirming only `page.tsx` changed and no `t(...)` string changed (AC8).
5. TailAdmin conformance glance on migrated spacing/typography (Q3 requirement) — hero py, section py, heading sizes unchanged.
6. **Hard gate:** `npm run build` → **exit 0**, paste the transcript (agent-contract §9). A failed/unrun build permits only `PARTIALLY IMPLEMENTED` or `BLOCKED`.

If step 2/3 shows the subtitle cannot both look right and meet ≥3:1 at a sane large-text size, **stop** and return `BLOCKED - CANONICAL STYLE DECISION REQUIRED` referencing OQ1 (owner may switch to `#BD4339`).

## 14. Completion report contract (for Sonnet)

Report must include: changed files (only `page.tsx` expected, + `docs/backlog.md` concise update + a `docs/sessions/2026-…-task659-…md` log with a "Files Changed" table matching the real diff); completed requirement IDs (R1–R9) with per-AC self-audit; every command run with **actual** output (tsc, route-render matrix, computed-style assertions, build exit code); evidence locations (screenshot dir / assertion log); assumptions taken; any deviation; limitations (e.g., route-render harness details); unresolved issues. **Status must be `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED` — never self-approval.** Backlog stays ≤80 lines (flag `BACKLOG LIMIT BREACH` otherwise). No mutating git.

## 15. Task quality gate (author self-check — all pass)

- A fresh Sonnet session can execute from this file alone: **yes** (verified markup, tokens, dispositions, and proof path are all inline).
- Every primary requirement has ≥1 binary AC + verification method: **yes** (R1–R9 → AC1–AC9).
- Scope protects existing behavior and names what must not change: **yes** (§8; CTA gradient, container-wide, perf hints, i18n, child components explicitly preserved).
- Current/legacy UI boundary, QA profile, locale needs, Storybook obligation explicit: **yes** (current Mantine; Q3; 4 locales; no story — app-route proof).
- Each changed visual artifact + each preserved sibling traced to inspected markup/classes/tokens: **yes** (§10 source map; hero gradient vs CTA gradient distinguished precisely by class + token, not the word "gradient").
- Canonical UI decision record present, all `reuse`, no uncited "no story exists": **yes** (§10).
- Trace classifications agree with owner's stated outcome and the contrast constraint is not papered over: **yes** (OQ1 surfaces the white-on-#EC5447 3.55:1 ceiling as a real constraint/conflict).
- Negative flows selected by applicability: **yes** (§11).
- No uninspected command/file/token/behavior claimed: **yes**.
- Gates prove the changed behavior (route render + computed contrast + build), not merely procedural: **yes**.
- Assumptions/unresolved decisions visible: **yes** (OQ1, OQ2, A1, A2).

---

**Task path:** `tasks/kickoff_prompt_Task_659_Homepage_Shell_DeTailwind_Hero_Solid_Coral.md`
**QA profile:** `Q3 Full Visual Matrix` (app-route proof path)
**Remaining ambiguity/owner decision:** **OQ1** — white on `#EC5447` caps at 3.55:1, so the subtitle can reach only **AA-large (≥3:1)** via opacity-removal + large-text sizing, not strict AA-4.5 normal-size. Proceed on that basis unless the owner requires 4.5:1, which would force a darker fill (`#BD4339`) and re-open R1.
