# Kickoff — Task 662: Tokenized homepage section-band component (de-Tailwind the 4 homepage section wrappers)

> Saved implementation kickoff. A fresh Sonnet session must be able to execute this without any chat context.
> Execute via `.claude/skills/execute-task/SKILL.md`. Strongest valid completion status is
> `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` — never self-approve.

## 1. Mode and task type

- **Mode:** implementation.
- **Task type:** UI (current Mantine path) + TailAdmin/styling governance + canonical-Story creation. Mixed-mechanism
  refactor that PRESERVES existing rendered output while replacing residual Tailwind utility classes on the homepage
  section wrappers with a canonical, token-backed Mantine component.
- **Owner directive driving this task (2026-07-23):** "the application's system must be built on tokenized styles."
  Owner chose (a) a **canonical Mantine section component + Storybook story** as the mechanism, and (b) **homepage
  scope only, but built to be reusable** by other pages later. Both decisions are binding inputs, not open questions.

## 2. Objective

Replace the residual Tailwind utility classes on the homepage's four content-band `<section>` wrappers
(`py-12 md:py-16 2xl:py-20`, `bg-muted/30`, `bg-gradient-to-br from-primary/10 to-primary/5`, and the
`content-visibility`/`contain-intrinsic-size` perf hints) with a new canonical, token-backed Mantine component
(`MantineHomeSection`), so the homepage route shell carries **no ad-hoc Tailwind utilities** for spacing or
background. Rendering must be **byte-identical** to the current homepage at every canonical viewport and locale — this
is a re-tokenization refactor, not a visual redesign.

## 3. Verified context

All facts below were inspected in the repo on 2026-07-23. Do not re-derive; re-verify only where a step says so.

### 3.1 The file in scope

`src/app/[locale]/page.tsx` (the App-Router homepage, `HomePage`). Current post-Task-659 state — the shell is already
Mantine primitives (`Stack`/`Box`/`Group`/`Title`/`Text`); the ONLY residual Tailwind lives on the four content bands:

| Section | Current wrapper markup (verbatim) | Inner |
|---|---|---|
| Featured | `<Box component="section" className="py-12 md:py-16 2xl:py-20 bg-muted/30 [content-visibility:auto] [contain-intrinsic-size:auto_600px]">` | `<Box className="container-wide"><FeaturedListings favoriteIds={favoriteIds} /></Box>` |
| Latest | `<Box component="section" className="py-12 md:py-16 2xl:py-20 [content-visibility:auto] [contain-intrinsic-size:auto_500px]">` | `<Box className="container-wide">` → `Group mb="xl"` heading (`Title` + `ViewAllLink`) + `<LatestListings favoriteIds={favoriteIds} />` |
| How it works | `<Box component="section" className="py-12 md:py-16 2xl:py-20 [content-visibility:auto] [contain-intrinsic-size:auto_340px]">` | `<Box className="container-wide"><HowItWorksSteps .../></Box>` |
| Agent CTA | `<Box component="section" className="py-12 md:py-16 2xl:py-20 bg-gradient-to-br from-primary/10 to-primary/5 [content-visibility:auto] [contain-intrinsic-size:auto_280px]">` | `<Box className="container-wide">` → centered `Box maw={672}` (icon + `Title` + `Text` + `AgentCtaButton`) |

Not in scope on this page (leave byte-for-byte unchanged): the outer `Stack gap={0}`; the **Hero** `<Box component="section" bg="var(--primary)" ...>` (already token-driven since Task 659 — its only Tailwind is `.container-wide`, which is preserved, see §8); and `<PopularLocations />` (renders its own `<section>` wrapper internally — a different component, out of scope).

### 3.2 Verified token / value provenance for every retained utility

| Utility today | Resolves to (verified) | Source |
|---|---|---|
| `py-12 md:py-16 2xl:py-20` | vertical padding **48px** base · **64px** ≥768px (`md`) · **80px** ≥1536px (`2xl`) | Tailwind spacing scale; these are the pre-existing app values (preserve byte-identical) |
| `bg-muted/30` | `--muted` → `--neutral-100` = **#F5F5F5**, at **30%** alpha (renders `oklab(… / 0.3)`) | `globals.css` L343 `--muted: var(--neutral-100)` |
| `bg-gradient-to-br from-primary/10 to-primary/5` | `linear-gradient(to bottom right, var(--primary)@10%, var(--primary)@5%)`; `--primary` → `--brand-700` | `globals.css` L347 `--primary: var(--brand-700)` |
| `[content-visibility:auto] [contain-intrinsic-size:auto_Npx]` | perf hints; `N` = **600 / 500 / 340 / 280** for Featured / Latest / HowItWorks / AgentCTA | inline arbitrary utilities |
| `.container-wide` | `width:100%; max-width:88rem (1408px)` + responsive padding 1rem→1.5rem(≥640)→2rem(≥1024)→3rem(≥1536) | `globals.css` L588–598; consumes `--width-page-max` |

### 3.3 The mechanism constraint (why a CSS module, not Mantine style props)

**Verified in `src/design-system/mantine/theme.ts` L144–151:** the Mantine theme breakpoints are
`xs=20em / sm=40em / md=48em / lg=64em / xl=80em / xxl=90em(1440px)` — **there is no 1536px (`2xl`) breakpoint.**
A Mantine `py={{ base, md, '2xl' }}` responsive style-prop therefore **cannot** reproduce the `2xl:py-20` (80px @1536px)
step and would silently freeze padding at 64px past 1440px — a real regression at the 1920/2560 matrix cells. This is
the exact trap Task 659 documented (see its session log §6.2) and is why it deliberately retained these as classNames.
**Consequence:** the new component's responsive vertical rhythm MUST live in a **CSS module with a real
`@media (min-width: 1536px)` query**, consuming design tokens — not in `theme.ts` inline `styles` (frozen cascade,
Task 658/505 doctrine) and not in Mantine style props.

### 3.4 Canonical conventions (verified)

- Canonical Mantine components live in `src/design-system/mantine/patterns/` and are re-exported from the barrel
  `src/design-system/mantine/patterns/index.ts`.
- Their stories live under `src/stories/patterns/mantine/<Name>.stories.tsx` with `meta.title = 'Patterns/Mantine/<Name>'`,
  `parameters: { skipCanvas: true, layout: 'fullscreen' }` (model: `ListingCardPattern.stories.tsx`).
- **Story-coverage gate** (`scripts/check-story-coverage.mjs`, `npm run check:story-coverage`): every new production
  component migrated to Mantine must be (1) added to `scripts/mantine-migration-scope.json` **and** (2) statically
  imported by ≥1 canonical `Patterns/Mantine/*` story, **in this same task**. Docs: `docs/storybook-governance.md` §15.
- **Rendered proof** is `scripts/check-stories-rendered.mjs` (`npm run screenshots:assert`) — the only accepted
  Storybook rendered proof (`docs/storybook-governance.md` §14.4).
- CSS custom properties (design tokens) are declared in `src/app/globals.css` (`@theme` block for `--color-*`/spacing,
  `:root`/`.dark` for semantic aliases; utilities in the `@layer utilities` region, e.g. `.container-wide`).

### 3.5 Critical-flow scan

`docs/critical-flow-registry.md` scanned: the homepage marketing/listing-preview render is **not** a registered
critical flow (registry covers auth, RLS/write-path, moderation, reporting, payment). No automated regression-coverage
obligation is triggered. Profile is Q3, not Q4.

## 4. Requirements (requirement ledger)

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | Owner directive | A new canonical component `MantineHomeSection` exists in `src/design-system/mantine/patterns/`, exported from the barrel, that renders `<section>` + (optional) inner `.container-wide` and owns vertical rhythm + background variant via **design tokens in a CSS module**. | P0 | Inspect file + barrel export; story renders it | Confirmed |
| R2 | Owner directive | Vertical padding is driven by new named tokens (e.g. `--home-section-py-base/-md/-lg`) reproducing **48 / 64 (≥768) / 80 (≥1536)** px via a CSS-module `@media` chain (incl. `min-width:1536px`). No `2xl` Tailwind utility remains. | P0 | Computed `padding-top/bottom` at 375/768/1536/1920 == 48/64/80/80 | Confirmed |
| R3 | Verified context | Background variants are token-driven: `variant="muted"` → `--muted`@30%; `variant="brandFade"` → the `to-bottom-right` primary 10%→5% gradient; default (no variant) → transparent. No `bg-muted/30` or `bg-gradient-*` Tailwind utility remains on the page. | P0 | Computed `background-color`/`background-image` byte-identical to current per section | Confirmed |
| R4 | Verified context | Perf hints preserved per section: `content-visibility:auto` + `contain-intrinsic-size: auto <N>px` where `<N>` is passed per instance (600/500/340/280). | P0 | Computed style present per section | Confirmed |
| R5 | Verified context | `.container-wide` inner wrapper preserved (reused, not reimplemented) — either rendered by the component (default) or opted out per instance so each section keeps exactly one `.container-wide` at 1408px. | P0 | Computed `max-width:1408px` on inner wrapper; DOM has no duplicate/missing container | Confirmed |
| R6 | agent-contract P0.3/P0.5 | All four sections, their headings, children (`FeaturedListings`/`LatestListings`/`HowItWorksSteps`/Agent-CTA block/`ViewAllLink`), DOM order, `favoriteIds` passthrough, and `component="section"` semantics are preserved. | P0 | DOM section count/order + screenshot parity | Confirmed |
| R7 | agent-contract P0.7 | No user-facing string added/changed (pure structural/style refactor). | P0 | `git diff` shows zero `t()/tl()` key changes | Confirmed |
| R8 | clause 16c | A canonical `Patterns/Mantine/HomeSection` story is created that renders the REAL `MantineHomeSection` in all variants (default/muted/brandFade), and the component is registered in `scripts/mantine-migration-scope.json`; `check:story-coverage` passes. | P0 | `npm run check:story-coverage` exit 0 | Confirmed |
| R9 | agent-contract P0.9 | `npx tsc --noEmit` clean and `npm run build` exit 0. | P0 | transcripts | Confirmed |
| R10 | qa-profiles Q3 | Full Q3 rendered proof: `screenshots:assert` for the new story across the matrix × 4 locales, plus app-route byte-identical parity vs the pre-change homepage. | P0 | manifest + parity table | Confirmed |

Every acceptance criterion in §12 maps to these IDs.

## 5. Assumptions and open questions

- **A1 (assumption):** The `bg-muted/30` and `bg-primary` alpha renders may be reproduced with `color-mix(in srgb, …)`
  or `rgb(from …)` in the CSS module; the binding requirement is byte-identical **computed** `background-color`/
  `background-image`, not the CSS technique. If a chosen technique's computed value diverges even slightly from the
  current Tailwind output at any locale, keep the exact current output (you may retain the token-referencing
  declaration that reproduces it) and note it — do not ship a visible color shift.
- **A2 (assumption):** Hero and `PopularLocations` are out of scope (see §8). If execution reveals the hero's
  `.container-wide` or any hero style blocks byte-identical parity of the four bands, STOP and ask — do not expand scope.
- **OQ1 (non-blocking):** Whether other pages (`/listings`, `/favorites`, `/contact` — they also use `.container-wide`
  and section padding) adopt `MantineHomeSection` is explicitly a **follow-up task**, not this one. Build the component
  reusable, but change only the homepage here.
- No blocking open questions. The `#EC5447`-vs-`#D25656` `--primary` render discrepancy flagged in Task 659 §7 is
  **out of scope** here (this task consumes `--primary` as-is and preserves the current render); do not "fix" it.

## 6. Pre-read rule bundle (exact — do not read all docs)

1. `docs/agent-contract.md` (P0 invariants).
2. `docs/mantine-responsive-design-system.md` (current UI/responsive source of truth; section/spacing rhythm).
3. `docs/tailadmin-style-reference.md` §1 (spacing grid), §6m (page content column / `.container-wide` provenance).
4. `docs/component-rules.md` (container/presentational split, no-duplicate, i18n).
5. `docs/qa-rules.md` (validation, encoding, mojibake).
6. `docs/storybook-governance.md` §14–§15 (rendered proof + coverage manifest).
7. `docs/qa-profiles.md` (Q3 evidence).
8. This kickoff. Re-verify §3.3 breakpoint fact against `theme.ts` before coding.

## 7. Scope

- Create `src/design-system/mantine/patterns/MantineHomeSection.tsx` + its CSS module
  (`MantineHomeSection.module.css`) + barrel export in `patterns/index.ts`.
- Add the design tokens the module consumes to `src/app/globals.css` (section vertical-rhythm tokens; reuse existing
  `--muted`/`--primary` for backgrounds).
- Migrate the four homepage bands in `src/app/[locale]/page.tsx` to `MantineHomeSection`.
- Create `src/stories/patterns/mantine/HomeSection.stories.tsx` (`Patterns/Mantine/HomeSection`).
- Register the component in `scripts/mantine-migration-scope.json`.
- Update `docs/backlog.md` (concise current state, respect the 80-line cap) and add the session log under
  `docs/sessions/`.

## 8. Out of scope

- The **Hero** section (already token-driven via `bg="var(--primary)"` since Task 659; its `.container-wide` is a
  canonical DS utility, preserved — not "Tailwind to remove").
- `<PopularLocations />` and its internal `<section>` wrapper.
- `.container-wide` itself — it is a canonical, token-backed DS utility (`--width-page-max`); **reuse** it, do not
  reimplement its 1408px/responsive-padding logic inside the new component.
- Other routes' section wrappers (`/listings`, `/favorites`, `/contact`) — follow-up task (OQ1).
- The `--primary` hex/oklch drift (Task 659 §7) and any `theme.ts` inline-style approach.
- Any visual redesign, spacing change, or copy change.

## 9. Current and required behavior

**Current:** The four homepage content bands are Mantine `<Box component="section">` carrying Tailwind utilities for
vertical padding (`py-12 md:py-16 2xl:py-20`), background (`bg-muted/30` on Featured; `bg-gradient-to-br from-primary/10
to-primary/5` on Agent-CTA), and perf hints, each wrapping a `.container-wide` inner box.

**Required (after):** The same four bands render via `<MantineHomeSection variant=… containIntrinsicSize=…>` whose
padding, background, and (optional) container come from **design tokens / a token-consuming CSS module**, with
**no ad-hoc Tailwind spacing/background utility on the page for these bands**. Pixel output, DOM structure, section
order, semantics, children, and all four locales are unchanged.

## 10. Implementation requirements

1. **Component API (illustrative — final prop names at executor discretion, but must express all of these):**
   ```
   type MantineHomeSectionProps = {
     variant?: 'default' | 'muted' | 'brandFade'   // background token; default = transparent
     containIntrinsicSize?: string                  // e.g. 'auto 600px' → contain-intrinsic-size perf hint
     withContainer?: boolean                        // default true → renders inner .container-wide
     children: React.ReactNode
     className?: string                             // pass-through, optional
   }
   ```
   Renders `<Box component="section" className={cx(styles.band, styles[variant], className)} style={{ containIntrinsicSize }}>`
   with `content-visibility:auto` set in the module `.band` rule, and, when `withContainer`, an inner
   `<Box className="container-wide">{children}</Box>`. Keep the component **presentational** (no data fetching).
2. **CSS module (`MantineHomeSection.module.css`) — the mechanism home (see §3.3):**
   - `.band { content-visibility: auto; padding-block: var(--home-section-py-base); }`
   - `@media (min-width: 768px)  { .band { padding-block: var(--home-section-py-md); } }`
   - `@media (min-width: 1536px) { .band { padding-block: var(--home-section-py-lg); } }`
   - `.muted { background-color: <token expression for --muted @30%>; }`
   - `.brandFade { background-image: <token expression for the to-bottom-right --primary 10%→5% gradient>; }`
   - No raw hex/px for colors; padding px values come only from the tokens below. `contain-intrinsic-size` is applied
     per-instance via `style` (a runtime value), which is acceptable (it is a perf hint, not a visual token).
3. **Tokens (add to `globals.css`):** declare `--home-section-py-base: 3rem; --home-section-py-md: 4rem;
   --home-section-py-lg: 5rem;` (48/64/80px) in the appropriate tokens region, with a comment citing this task and the
   preserved-values provenance. Reuse existing `--muted` and `--primary` for the background variants.
4. **Page migration (`page.tsx`):** replace each of the four band wrappers with `MantineHomeSection`, passing
   `variant` (`muted` for Featured, `brandFade` for Agent-CTA, default for Latest/HowItWorks) and
   `containIntrinsicSize` (`'auto 600px'`/`'auto 500px'`/`'auto 340px'`/`'auto 280px'`). Keep the exact inner content
   (Latest's `Group mb="xl"` heading, Agent-CTA's centered block, etc.) as `children`. Do not alter the Hero,
   `PopularLocations`, or the outer `Stack`.
5. **Byte-identical gate:** before/after computed-style parity for each band at 375 / 768 / 1440 / 1536 / 1920:
   `padding-top/bottom`, `background-color`, `background-image`, inner `max-width`. Any diff = defect.
6. **Story + coverage:** create the `Patterns/Mantine/HomeSection` story rendering all three variants with realistic
   child content and a visible `.container-wide` inner; add the component path to `scripts/mantine-migration-scope.json`;
   `npm run check:story-coverage` must pass.
7. **i18n / encoding:** no string changes; touched files stay UTF-8 no-BOM, no mojibake.

### Canonical UI decision record

| Visible artifact | Search performed | Canonical source | Disposition | Shared token/registration |
|---|---|---|---|---|
| Section vertical rhythm (48/64/80) | `src/design-system/mantine/patterns/` listing (no section-band primitive exists); `docs/mantine-responsive-design-system.md`; TailAdmin §1/§6m has no section-band vertical-rhythm reference | none exists | **create canonical** | new `MantineHomeSection` + `--home-section-py-*` tokens; register in migration-scope + new story |
| Muted band background | existing `--muted` token (`globals.css`) | `--muted` | **reuse** (via module class) | none new |
| Brand-fade gradient | existing `--primary` token | `--primary` | **reuse** (via module class) | none new |
| `.container-wide` container | `globals.css` utility, `docs/tailadmin-style-reference.md` §6m | DS utility | **reuse** (retained className, rendered by component) | none new |

Values 48/64/80 have **preserve-existing** provenance (byte-identical to the current homepage render), not invention —
this satisfies clause 16a (no guessed visual values) because nothing visual changes.

## 11. Positive and negative flows

**Positive flow:** Load `/[locale]` at any width/locale → four content bands render with identical padding,
backgrounds, container width, children, and order as before; homepage is visually unchanged; page source carries no
`py-12`/`bg-muted/30`/`bg-gradient-*` Tailwind utilities on these bands.

**Negative-flow applicability:**

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Validation | No | No form/input touched | N/A | — |
| Authorization/RLS | No | Public marketing route, no write path | N/A | — |
| Offline/network | No | No new fetch; `favoriteIds` wiring untouched | Existing global behavior | — |
| Concurrent writer | No | No data mutation | N/A | — |
| Empty `PopularLocations` | Yes (preserve) | `PopularLocations` returns null when no featured locations | Section absent, no layout break; unaffected by this diff | DOM/screenshot |
| Long-locale (uk) mobile wrap @320 | Yes | i18n | No horizontal overflow; band padding identical | `screenshots:assert` + app-route parity |
| ≥1536px padding step | Yes | §3.3 breakpoint trap | Padding steps to 80px at 1536 (the whole reason for the CSS-module `@media`) | computed `padding` @1536/1920 |

## 12. Acceptance criteria

- **AC1 [R1,R8]** Given the repo, when built, then `MantineHomeSection` exists in `patterns/`, is barrel-exported, is
  imported by the `Patterns/Mantine/HomeSection` story, and is listed in `scripts/mantine-migration-scope.json`;
  `npm run check:story-coverage` exits 0.
- **AC2 [R2]** Given the homepage at 375/768/1536/1920, when computed styles are read, then band `padding-top` and
  `padding-bottom` are 48/64/80/80 px respectively, and no element on the page carries `py-12 md:py-16 2xl:py-20`.
- **AC3 [R3]** Given the Featured and Agent-CTA bands, when computed styles are read, then `background-color`
  (Featured) and `background-image` (Agent-CTA) are byte-identical to the pre-change homepage, and no `bg-muted/30` or
  `bg-gradient-to-br from-primary/10 to-primary/5` utility remains on the page.
- **AC4 [R4]** Given each band, when computed styles are read, then `content-visibility: auto` and the correct
  per-section `contain-intrinsic-size` (`auto 600px`/`500px`/`340px`/`280px`) are present.
- **AC5 [R5]** Given each band, when the inner wrapper is read, then it is a single `.container-wide` computing
  `max-width: 1408px` — no missing or duplicated container.
- **AC6 [R6]** Given all four locales at the full matrix, when compared to the pre-change homepage, then section
  count/order, headings, children, and `favoriteIds` passthrough are unchanged (screenshot + DOM parity).
- **AC7 [R7]** Given `git diff`, then there are zero `t()`/`tl()` key changes.
- **AC8 [R9]** Given the repo, then `npx tsc --noEmit` is clean and `npm run build` exits 0 (transcript included).
- **AC9 [R10]** Given the new story, then `npm run screenshots:assert` produces a PASS manifest across the required
  Q3 matrix × sq/en/uk/it, and the app-route byte-identical parity table (AC2–AC5) is included.

## 13. QA profile and verification plan

**Profile: Q3 Full Visual Matrix.** Justification: creates a new canonical migrated Mantine component + Storybook
story + a page-shell chrome change (TailAdmin conformance slice). Not Q4 — no critical flow, auth, RLS, or data-loss
path is touched (§3.5).

Verification plan (only repo-known commands):
1. `npx tsc --noEmit` → 0 errors.
2. `npm run check:story-coverage` → exit 0 (component enrolled + story imports it).
3. `npm run build` → exit 0 (mandatory non-Q0 hard gate; include the `✓ Compiled` + static-pages transcript).
4. `npm run screenshots:assert` → PASS manifest for `Patterns/Mantine/HomeSection` across the canonical Q3 widths
   (`320/375/390/480/560/680/768/810/960/1024/1200/1440/1920/2560`) × sq/en/uk/it, `uk@320` mandatory.
5. **App-route byte-identical parity** (Task 659 precedent — no committed app-route harness exists): capture the
   homepage before and after at 375/768/1440/1536/1920 × sq/en/uk/it and diff computed `padding-top/bottom`,
   `background-color`, `background-image`, inner `max-width` per band. Record the table in the session log. Any
   non-zero diff blocks approval. (Throwaway script may be used and deleted; screenshots are gitignored — record the
   computed-style tables as the durable evidence, as Task 659 did.)
6. File-integrity/mojibake check on all touched text files.

If any required gate cannot run (sandbox/native mismatch), record it as missing evidence with the exact native command
and return `PARTIALLY IMPLEMENTED` or `BLOCKED` — never a confidence claim.

## 14. Completion report contract (Sonnet)

The session log (`docs/sessions/2026-07-23-task662-*.md`) and `docs/backlog.md` update must include: changed-files
table matching the real diff; completed requirement IDs (R1–R10) each with evidence; every command run with its actual
result/exit code (tsc, story-coverage, build, screenshots:assert); the byte-identical parity table; the coverage-manifest
diff; assumptions/deviations/limitations; and the acceptance-criteria self-audit (AC1–AC9). Set status to
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`. Do not self-approve. Do not run,
emit, or suggest any mutating git command.

## 15. Task quality gate (orchestrator self-check — all pass)

- A fresh Sonnet can execute without chat context — yes (file/token/breakpoint/story facts all inlined).
- Every primary requirement has ≥1 binary AC and ≥1 verification method — yes (R1–R10 → AC1–AC9 + §13).
- Scope protects existing behavior and names what must not change — yes (§8, Hero/PopularLocations/container-wide/copy).
- Current/legacy UI boundary, QA profile, locales, Storybook obligations explicit — yes (current Mantine path, Q3,
  4 locales, coverage + rendered proof).
- Each changed visual artifact traced to inspected markup/tokens; executor can tell muted-bg from gradient from padding
  — yes (§3.2, §10, decision record).
- Canonical UI decision record present with search evidence; `create canonical` names the shared owner, story, and
  migration-scope registration — yes.
- Trace's change/preserve classifications agree with owner intent (byte-identical, tokenized) — yes.
- Negative flows selected by applicability, not a generic checklist — yes (§11 table).
- No uninspected command/file/story/behavior claimed — yes (all paths inspected 2026-07-23).
- Gates prove changed behavior (computed-style parity + coverage + build), not mere procedure — yes.
- Assumptions/open questions visible — yes (§5).

---

**Task path:** `tasks/kickoff_prompt_Task_662_HomeSection_Tokenized_Band_Component.md`
**QA profile:** Q3 Full Visual Matrix.
**Ambiguous/conflicting requirements:** none blocking. Non-blocking follow-up: OQ1 (roll `MantineHomeSection` out to
other routes) is a separate future task.
**Owner decision still needed:** none — the two mechanism/scope decisions were made by the owner on 2026-07-23 and are
recorded in §1.
