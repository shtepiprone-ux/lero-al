# Task 702 — `ListingCard.tsx` de-Tailwind (Sprint 46.2)

**Kickoff path:** `tasks/Sprints/Sprint_46_kickoff_prompt_Task_702_ListingCard_DeTailwind.md`
**Sprint:** 46 — ListingCard de-Tailwind + overlay exit, order **46.2**
**Executor:** Sonnet, via `.claude/skills/execute-task/SKILL.md`
**Filed:** 2026-08-10, after 694 landed as the sprint's first task

---

## 1. Mode and task type

Implementation task. Type: **UI / Component — current Mantine path**, D28 de-hybrid migration.

**D28 binds this task: mechanism-only, zero visual delta.** It authorizes no restyle, no token change, no spacing
or typography change. **D34 binds it too:** the new module reproduces the utilities' cascade *layer*, so it is
wrapped in `@layer utilities`.

---

## 2. Objective

Move the **8** `className=` sites in `src/modules/listings/components/ListingCard.tsx` into a colocated
`ListingCard.module.css`, reproducing each utility's own compiled output, so the last Tailwind in the homepage
grids' container layer is gone and the file renders byte-identically.

Three of those strings are **cross-file contracts** and two carry the repo's **load-bearing marker classes**. The
markers survive verbatim; the utilities beside them do not.

---

## 3. Verified context

Re-derived from the repository on **2026-08-10** at `5dbd73be2` + the 694 working set. Every number below was
measured; none is restated from `docs/backlog.md`.

### 3.1 The 8 sites — measured, with what each one actually is

`wc -l` → **325**. `grep -c "className=" ` → **8**. In file order:

| # | Line | String | Lands on | Note |
|---:|---:|---|---|---|
| 1 | `:153` | `h-6 w-6 text-muted-foreground` | `<Maximize2>` (lucide svg), horizontal no-image fallback | |
| 2 | `:166` | `shrink-0 -mt-0.5 -mr-1` | `<FavoriteButton className>` | **cross-file contract 2/3** |
| 3 | `:173` | `h-3.5 w-3.5` | `<ListingFeatureIcon className>` → svg | |
| 4 | `:201` | `listing-card listing-card--horizontal block` | `<Link>` | **markers + `block`** |
| 5 | `:244` | `h-8 w-8 text-muted-foreground` | `<Maximize2>`, vertical no-image fallback | |
| 6 | `:259` | `shadow-sm` | `<FavoriteButton className>` (overlay variant) | hardest to reproduce, §3.5 |
| 7 | `:271` | `h-3.5 w-3.5` | `<ListingFeatureIcon className>` → svg | |
| 8 | `:297` | `listing-card listing-card--vertical block h-full` | `<Link>` | **markers + `block h-full`** |

### 3.2 A ninth Tailwind site the `className=` grep cannot see — and why it is NOT in scope

```
:56  const CLOSED_OVERLAY_STYLE: Partial<Record<ListingStatus, string>> = {
:57    sold:   'bg-status-info/80 border-status-info',
:58    rented: 'bg-status-rented/80 border-status-rented',
:59  }
```

Consumed at `:266` as `className:` — a **colon, not an equals sign** — so `grep "className="` returns 8 while the
file carries 10 Tailwind-bearing strings. The count in `docs/backlog.md` is right by luck; the reason was never
recorded. It is recorded here.

**It is deliberately excluded, and this is the task's one real scope decision.** Task 691 §3.4 lists it as the
third cross-file contract and states, `:79` verbatim: *"Changing any of them belongs to Task 702."* Taking it
would nevertheless drag in work that is not 702's:

- the string is **duplicated in three more places** — `MantineListingCardPattern.tsx:39` (the prop's JSDoc example),
  `src/stories/patterns/mantine/ListingCardPattern.stories.tsx:120`, and
  `MantineListingCardPattern.smoke.test.tsx:105`. Migrating the producer without them leaves the story and the test
  rendering *raw Tailwind* while production renders a module class — a proof path that no longer proves production;
- the pattern consumes it at `:313-316` through its own `cn()`, so closing it properly means deciding whether the
  pattern keeps accepting arbitrary class strings. **That is an API decision inside 691's blast radius, and 691 is
  ⛔ owner-blocked** on the `/[locale]` First Load JS question;
- both strings use **opacity-modifier utilities** (`/80`), the family D35 was written about.

**Filed as Task 741, Sprint 46.6, blocked on 691.** Do not touch `CLOSED_OVERLAY_STYLE`, `:266`, or the pattern.

### 3.3 The marker classes are load-bearing — measured consumers

`.listing-card`, `.listing-card--horizontal`, `.listing-card--vertical` are read by:

| Consumer | Where |
|---|---|
| Rendered-story gate, 4 anchor rows | `scripts/check-stories-rendered.mjs:173,174,175,181` — `FeaturedListings`, `LatestListings`, `SimilarListings`, `HomepageListingGrids`, each `{ type: 'selector', value: '.listing-card' }` |
| Homepage grid locator | `scripts/check-homepage-grid.mjs:204` — `getComputedStyle(el).display === 'grid' && el.querySelector('.listing-card')` |
| Unit test | `src/modules/listings/components/__tests__/ListingCard.smoke.test.tsx:212` — `expect(link).toHaveClass('listing-card--horizontal')` |
| Unwired probes | `task420-qa-grid-step.mjs:147`, `task605-qa-listingcard-complete.mjs` (`a.listing-card--vertical`, 7 sites), `task608-qa-listingcard-list-site.mjs` (`a.listing-card--horizontal`) |

**None of them may change.** `block` / `h-full` sit on the same attribute value as the markers, so the *string*
changes at `:201` and `:297` while the three marker tokens stay byte-identical.

### 3.4 Compiled output the module must reproduce — read out of `.next/static/css`, not from memory

```
.h-6{height:var(--space-6)}                     .w-6{width:var(--space-6)}
.h-8{height:var(--space-8)}                     .w-8{width:var(--space-8)}
.h-3\.5{height:calc(var(--spacing) * 3.5)}      .w-3\.5{width:calc(var(--spacing) * 3.5)}
.shrink-0{flex-shrink:0}
.-mt-0\.5{margin-top:calc(var(--spacing) * -.5)}
.-mr-1{margin-right:calc(var(--space-1) * -1)}
.block{display:block}                           .h-full{height:100%}
.text-muted-foreground,.text-muted-foreground\/40{color:var(--muted-foreground)}
```

Note the asymmetry: integer steps resolve to named `--space-N` tokens, fractional steps to
`calc(var(--spacing) * N)`. **Reproduce each form as compiled** — substituting one for the other is a token change,
which D28 forbids. Re-read these from the current build before writing; do not trust this block if it disagrees.

### 3.5 `shadow-sm` is the hard one

```
.shadow-sm,.shadow-theme-lg{box-shadow:var(--tw-inset-shadow),var(--tw-inset-ring-shadow),var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow)}
.shadow-sm{--tw-shadow:0 1px 3px 0 var(--tw-shadow-color,#0000001a),0 1px 2px -1px var(--tw-shadow-color,#0000001a)}
```

Two rules, and the five-layer `box-shadow` depends on `--tw-inset-shadow` / `--tw-inset-ring-shadow` /
`--tw-ring-offset-shadow` / `--tw-ring-shadow` being initialised by Tailwind's own `@property` block.
`PopularLocationsView.module.css` (Task 688) already reproduces this composition — **read its `box-shadow` rule and
follow it.** Do not flatten to a two-layer `box-shadow` without proving the serialized `getComputedStyle` value is
identical; a flattened form is a different computed string even when it looks the same.

`.shadow-sm` shares its first rule with `.shadow-theme-lg`, which survives this task, so the `@property` block and
the `--tw-*` initialisers are not at risk of disappearing. **Verify that rather than assume it** — it is the
Task 700 hazard class.

### 3.6 No `@theme` variable loses its last Tailwind consumer

Measured because this is exactly what Task 700 exists to catch and 700 has not landed:

| Var | Other Tailwind consumers after this task | Verdict |
|---|---|---|
| `--color-muted-foreground` | **558** `text-muted-foreground` occurrences in `src/` | safe |
| `--space-1` · `--space-6` · `--space-8` · `--spacing` | repo-wide spacing scale | safe |
| `--tw-shadow` chain | `.shadow-theme-lg` and every other shadow utility | safe |
| `--color-status-info` · `--color-status-rented` | 9 files incl. `badge.tsx:24-25`, `AdminListingsTable.tsx:78-79`, `ListingStatusBanner.tsx:11-12` | safe, and out of scope anyway (§3.2) |

### 3.7 How the two child components consume `className` — this decides the layering

**`ListingFeatureIcon.tsx`** forwards it raw to a lucide svg, with **no defaults and no merge**:

```
:19  export function ListingFeatureIcon({ name, className }: Props) {
:20    const Icon = ICON_MAP[name]
:21    return <Icon className={className} />
:22  }
```

An incoming class is the **only** class on the `<svg>`. Dropping `h-3.5 w-3.5` without a substitute leaves the icon
unsized. A third call site — `ListingDetailView.tsx:303` — passes the same string and is **out of scope**; it keeps
its Tailwind until its own task.

**`FavoriteButton.tsx`** merges at `:155` — `className: cn(styles.control, className)` — and spreads the result onto
a Mantine `ActionIcon` or `Button`. Its `FavoriteButton.module.css` is **unlayered on purpose** (Task 653, one of the
seven D34 explicitly excludes) and its rules are attribute chains at specificity (0,2,0)+.

**The collision question, measured:** `FavoriteButton.module.css` sets `background-color`, `color`, `opacity` and
`cursor` — and **no `box-shadow`, no `flex-shrink`, no `margin`, no `display`, no `height`.** The two classes 702
hands it (`shrink-0 -mt-0.5 -mr-1` and `shadow-sm`) therefore do not contend with it on any property, and a
**layered** module class is safe here. This is the check Task 709 skipped; do not accept it on my word — re-run it.

### 3.8 D34 — layer it, and say why the neighbours are not layered

**D34 (2026-08-05):** a D28 de-Tailwind module reproduces the utility's cascade **layer** → wrap in
`@layer utilities`. Landed precedents to copy: `src/components/shared/HeroSearchView.module.css:54` (709-R, the
origin) and `src/components/layout/MobileBottomNavView.module.css:48` (713).

The trap: **the two modules sitting closest to this one are unlayered by design** —
`FavoriteButton.module.css` (653) and `MantineListingCardPattern.module.css` (602). D34's own text distinguishes
them by intent: *a migration reproduces, a cascade-trap fix overrides.* 702 is a migration. **State this in the new
module's header comment** so the next reader does not "fix" the inconsistency.

### 3.9 Proof surface

- **One story only:** `src/stories/mantine/primitives/ListingCard.stories.tsx` — title
  `Mantine/Primitives/ListingCard`, `parameters: { skipCanvas: true, layout: 'fullscreen' }`, single
  `export const Default`. Story id `mantine-primitives-listingcard--default`. It renders **both** variants
  internally (vertical in a `SimpleGrid`, then horizontal), so one story covers both branches.
- **Cell count = 16, not 28.** `MANTINE_VIEWPORTS` is `320/375/390/1024` (`check-stories-rendered.mjs:392-397`) and
  `MANTINE_STORY_EXTRA_VIEWPORTS` (`:417`) keys by **componentName** and contains only `HeroSearch`,
  `ListingDetailPattern`, `HomeSection` and `PopularLocationsView`. `ListingCard` is absent → `?? []` → 4 viewports
  × 4 locales. *(Read the config's key, not its appearance — the 721 corollary. 688's 7-viewport figure came from
  `PopularLocationsView`'s own extra entry and does not transfer.)*
- `ListingCard.tsx` **is** enrolled in `scripts/mantine-migration-scope.json` (line 8), so `check:story-coverage`
  covers it.
- `scripts/check-locale-leak.mjs:196-197` carries a `PER_STORY_TOKENS` entry for
  `mantine-primitives-listingcard` (`['Tirana, Albania']`) — must stay green.
- `ListingCard.tsx` is **not** in `scripts/design-tokens-allowlist.json` and carries **0** inline
  `design-tokens-allow` markers. Every utility it uses today is a *named* utility the scanner does not flag, so the
  file is at **0 violations now and must be at 0 after** — no marker carry-across is needed (unlike 713).

### 3.10 Preservation hazards that are NOT this task's to fix

`ListingCard.smoke.test.tsx:169` and `:253` assert `link.querySelector('.grayscale.opacity-60')`. Those classes are
emitted by **`MantineListingCardPattern.tsx:167`/`:294`** (`isArchived && 'grayscale opacity-60'`), not by
`ListingCard.tsx`. They must still pass after this task, untouched. They become **691's** re-anchoring problem
(D33), and 691's kickoff should be told so.

**Correction owed to 691.** Its §3.4 table records contract 1's consumer as *"pattern `className` prop → `cn(...)`
at `:162`/`:290`"*. Measured: `ListingCard.tsx` **passes no `className` prop to `MantineListingCardPattern`** at
either `:206-226` or `:302-322`; the string sits on the wrapping `<Link>` and its real consumers are the DOM and the
gates in §3.3. Flag this in the completion report so 691 is corrected before it runs.

---

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | D28, Sprint 46 ⓑ | All **8** `className=` sites carry no Tailwind utility; each references `styles.*` (or `cn('<markers>', styles.*)`) | P0 | `grep -n className` + AC1 | Confirmed |
| R2 | §3.3 | `listing-card`, `listing-card--horizontal`, `listing-card--vertical` survive byte-identical in the DOM | P0 | AC2, gates in §3.3 | Confirmed |
| R3 | D28 | Zero visual delta — every migrated declaration reproduces its utility's compiled output | P0 | AC3 rendered matrix | Confirmed |
| R4 | D34 | The new module is wrapped in `@layer utilities`, and its header states why the adjacent modules are not | P0 | AC4 | Confirmed |
| R5 | §3.2 | `CLOSED_OVERLAY_STYLE`, `:266`, and every pattern/story/test file are **unchanged** | P0 | md5 witnesses, AC5 | Confirmed |
| R6 | §3.7 | `ListingFeatureIcon`'s svg is still sized; `FavoriteButton`'s own module still wins its own properties | P0 | AC3 + computed-style capture | Confirmed |
| R7 | §3.9 | `check:story-coverage`, `check:locale-leak`, `check:design-tokens` (0), `check:homepage-grid`, `check:stories` unchanged | P0 | AC6 | Confirmed |
| R8 | §3.10 | `ListingCard.smoke.test.tsx` passes unmodified, including the two `.grayscale.opacity-60` assertions | P0 | AC7 | Confirmed |
| R9 | Standing | `npm run build` exit 0 | P0 | AC8 | Confirmed |
| R10 | Backlog rules | Concise `docs/backlog.md` update + session log | P1 | AC9 | Confirmed |

---

## 5. Assumptions and open questions

- **A1.** `ListingDetailView.tsx:303` passes the same `h-3.5 w-3.5` to `ListingFeatureIcon` and stays Tailwind. That
  is intended: 702 owns `ListingCard.tsx`, not every caller. Say so in the report rather than "fixing" it.
- **A2.** The module is colocated at `src/modules/listings/components/ListingCard.module.css`, following
  `FavoriteButton.module.css` (653) for placement and Task 688 / `MantineHomeSection.module.css` (662) for the
  reproduce-the-compiled-output convention.
- **OQ1 — none open.** The only scope decision, `CLOSED_OVERLAY_STYLE`, is settled in §3.2 and filed as 741.

---

## 6. Pre-read rule bundle

Always Required: `docs/agent-contract.md` · `docs/rule-index.md` · `docs/qa-profiles.md` · `docs/backlog.md` ·
`docs/critical-flow-registry.md` (scan only — **no** row is affected; confirm explicitly).

UI / Current Mantine path: `docs/mantine-responsive-design-system.md` · `docs/tailadmin-style-reference.md` ·
`docs/component-rules.md` · `docs/ui-rules.md` (routing/boundary only) · `docs/qa-rules.md`.
Optional-if-relevant, and here it is relevant: `docs/storybook-governance.md` §14.11 (D26 comparator).

Task-specific, required:

- `tasks/kickoff_prompt_Task_688_PopularLocationsView_DeTailwind_CssModule.md` §3.4 — the two binding module
  conventions — and the landed `src/modules/locations/components/PopularLocationsView.module.css` header.
- `src/components/shared/HeroSearchView.module.css:40-60` — D34's rationale and the `@layer utilities` wrapper.
- `tasks/kickoff_prompt_Task_691_MantineListingCardPattern_DeTailwind.md` §3.4 only — the contract table.
- `src/modules/listings/components/FavoriteButton.tsx:155` + `FavoriteButton.module.css` header.
- `src/modules/listings/components/ListingFeatureIcon.tsx` (22 lines, read all).

Do **not** read the legacy `docs/design-system.md` bundle or `docs/admin-ux-rules.md`.

---

## 7. Scope

| Path | Action |
|---|---|
| `src/modules/listings/components/ListingCard.module.css` | **create** — 7 classes, `@layer utilities`-wrapped |
| `src/modules/listings/components/ListingCard.tsx` | **modify** — the 8 sites, plus the `styles` import |
| `docs/backlog.md` | **modify** — concise state |
| `docs/sessions/2026-08-10-task702-listingcard-detailwind.md` | **create** — session log |

Suggested class set — semantic names, not utility echoes: `.card` (`display:block`), `.cardVertical`
(`height:100%`), `.placeholderIcon` (`:153`), `.placeholderIconLarge` (`:244`), `.featureIcon` (`:173`/`:271`),
`.inlineFavorite` (`:166`), `.overlayFavorite` (`:259`). Deviate if you have a better split — but say so and keep
one class per distinct declaration set.

---

## 8. Out of scope

- **`CLOSED_OVERLAY_STYLE` / `:266`** — §3.2, Task 741.
- **Every file under `src/design-system/mantine/patterns/`** — 691's, and it is owner-blocked.
- `ListingDetailView.tsx:303` (A1) · `ListingContact.tsx:275` (the third `FavoriteButton` caller).
- The `.grayscale.opacity-60` smoke assertions and the pattern code that emits them (§3.10).
- The three unwired probes in §3.3 — owner cleanup step 3 owns their deletion.
- Any change to `.listing-card*` marker tokens, to `cn()`, or to `mantine-migration-scope.json`.
- Adding a story, a viewport, or a `MANTINE_STORY_EXTRA_VIEWPORTS` entry. **A missing cell is not authorization to
  add one** — if 16 cells cannot prove something, say so and stop.

---

## 9. Current and required behavior

**Current.** `ListingCard.tsx` mixes Mantine props, three cross-file `className` contracts and 10 raw Tailwind
strings. It is the last Tailwind-bearing container in the homepage grid path (`ListingCard.tsx:7` renders the
pattern, which the grids render).

**Required.** The 8 `className=` sites reference a colocated, `@layer utilities`-wrapped module that reproduces
each utility's compiled declarations exactly. The three marker tokens are unchanged in the DOM. Every rendered
cell, every gate and the smoke test are unchanged. `CLOSED_OVERLAY_STYLE` still holds its two Tailwind strings and
is untouched.

---

## 10. Implementation requirements

1. **Measure before writing.** Re-read every declaration in §3.4/§3.5 from the *current* `.next/static/css` after a
   build. If any disagrees with this document, **the build wins** — record the discrepancy in the report.
2. **Capture a live computed-style baseline first.** For each of the 8 sites, record `getComputedStyle` for the
   properties the utility sets, on `mantine-primitives-listingcard--default`, **before** any edit. This is the
   comparator; a screenshot alone cannot show that `flex-shrink` survived.
3. **Write the module** with `@layer utilities { … }` around all rules (R4), and a header comment naming Task 702,
   D28, D34, the 688/662 reproduce-the-compiled-output convention, and — explicitly — why `FavoriteButton.module.css`
   and `MantineListingCardPattern.module.css` next door are correctly unlayered.
4. **Edit the 8 sites.** At `:201`/`:297` use `cn('listing-card listing-card--horizontal', styles.card)` /
   `cn('listing-card listing-card--vertical', styles.card, styles.cardVertical)` — markers first, byte-identical.
5. **Re-capture and diff** the computed styles from step 2. Any property that moved is a D28 violation; fix it or
   stop and report.
6. Do not add `!important`, do not raise specificity to win, do not touch `cn()`.

---

## 11. Positive and negative flows

**Positive.** A listing renders vertically in the homepage grid and horizontally in the list view; both look and
compute identically to the pre-task capture; the markers still anchor all four gate rows.

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Validation | **No** | No form, action or schema touched | N/A | — |
| Authorization/RLS | **No** | No route or table touched | N/A | — |
| Offline/network | **No** | Presentation only | N/A | — |
| Concurrent writer | **No** | No data model | N/A | — |
| **No cover image** | **Yes** | `:151`/`:242` fallback branch | `Maximize2` keeps its size and muted colour in both variants | Story renders it; computed-style capture |
| **Closed listing (sold/rented)** | **Yes** | `:265` overlay branch | Overlay renders **exactly as today** — R5 says it is untouched | Rendered cell + md5 |
| **Archived listing** | **Yes** | pattern `:167`/`:294` | `.grayscale.opacity-60` still present | `ListingCard.smoke.test.tsx:169,253` unmodified |
| **Cascade collision** | **Yes** | §3.7, D34, the 709 lesson | Layered module does not contend with `FavoriteButton`'s unlayered rules | Property-set comparison + computed style |

---

## 12. Acceptance criteria

- **AC1 [R1]** — *Given* the final file, *when* `grep -n "className" src/modules/listings/components/ListingCard.tsx`
  runs, *then* no Tailwind utility appears in any `className=` value; only `styles.*`, `cn(...)` and the three marker
  tokens do. `CLOSED_OVERLAY_STYLE` at `:56-59` still appears, unchanged (R5).
- **AC2 [R2]** — *Given* the rendered story, *then* `.listing-card`, `.listing-card--horizontal` and
  `.listing-card--vertical` are present in the DOM exactly as before, and `check:homepage-grid` and
  `check:stories-rendered`'s four `.listing-card` anchor rows are green.
- **AC3 [R3, R6]** — *Given* the step-2 baseline and the step-5 re-capture, *then* every captured property is
  identical, and the rendered matrix over the **16** cells shows no verdict change (D26 / §14.11 governs any
  md5-changed cell; **do not invent a per-task pixel tolerance**).
- **AC4 [R4]** — *Given* `ListingCard.module.css`, *then* every rule is inside `@layer utilities` and the header
  states the D34 rationale plus the unlayered-neighbour exception.
- **AC5 [R5]** — *Given* the final `git status --porcelain` and md5 witnesses, *then*
  `MantineListingCardPattern.tsx`, `MantineListingCardPattern.module.css`, `ListingCardPattern.stories.tsx`,
  `MantineListingCardPattern.smoke.test.tsx`, `ListingDetailView.tsx` and `ListingContact.tsx` are unchanged.
- **AC6 [R7]** — *Given* the gate set, *then* `check:design-tokens` is **0 violations**, `check:story-coverage`,
  `check:locale-leak` (incl. the `mantine-primitives-listingcard` PER_STORY_TOKENS row), `check:stories`,
  `check:homepage-grid` and `check:mojibake` all match their pre-task results.
- **AC7 [R8]** — *Given* `ListingCard.smoke.test.tsx` **unmodified**, *then* all its tests pass, including `:169`
  and `:253`.
- **AC8 [R9]** — `npm run build` exits 0; quote the transcript tail.
- **AC9 [R10]** — `docs/backlog.md` updated concisely; session log at the §7 path holds every transcript.

---

## 13. QA profile and verification plan

### 13.1 Profile

**`Q3 — Full Visual Matrix`**, per `docs/qa-profiles.md`. Same selection and reasoning as Task 688: a
manifest-enrolled Mantine surface whose visual chrome is the entire subject of the change.

Not `Q4` — no gate is authored and no `docs/critical-flow-registry.md` row is touched, so no planted-violation
proof is required. Not `Q2` — styling-only on a manifest-enrolled primitive is precisely the Q3 trigger.

### 13.2 Commands — record the actual result of each

1. `git --no-optional-locks status --porcelain` at I0; backlog baseline from
   `git show HEAD:docs/backlog.md | wc -l` **before** any edit.
2. md5 witnesses at I0 and at the end for the six AC5 paths plus `ListingCard.tsx` and `ListingCard.smoke.test.tsx`.
3. `npm run build` — **before** the edit, to read §3.4/§3.5 out of the current bundle; and after, exit 0.
4. The computed-style capture, before and after (§10 steps 2 and 5), persisted under `.screenshots/`.
5. `npm run screenshots:assert --mantine-only` — the 16 `ListingCard/Default` cells plus the rest of the run;
   report the full pass/fail/ambiguous triple and the comparator you used.
6. `npm run check:homepage-grid` · `check:story-coverage` · `check:locale-leak` · `check:design-tokens` ·
   `check:stories` · `check:mojibake` · `check:file-integrity` — each before and after.
7. `npx vitest run src/modules/listings/components/__tests__/ListingCard.smoke.test.tsx`, then the full
   `npx vitest run`. **Known, not a regression:** the full-run-only 5000 ms timeout trio
   `date-format-ssr-parity` / `RangeDatePicker` / `saveSavedSearch.dedup` (Task 692 log §4.1). If one appears,
   re-run that file in isolation and report both results. Report the run you observed, not the last one that passed.
8. `npm run typecheck` — exit 0.

Any of these that cannot run in your environment is a **`PARTIALLY IMPLEMENTED`**, not a pass.

---

## 14. Completion report contract

Report as `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`. Never self-approve.

1. Changed files and why, reconciled against the **actual final** `git status --porcelain` — quote the final one,
   not an intermediate snapshot.
2. Requirement IDs completed; any not completed, with why.
3. I0 vs final md5 table for all eight §13.2 paths.
4. Every §13.2 command with its **actual** result.
5. The before/after computed-style table for all 8 sites, property by property.
6. The full `git diff` of `ListingCard.tsx`, and the complete new module file.
7. Confirmation that `CLOSED_OVERLAY_STYLE` and the pattern files are untouched.
8. **The §3.10 correction owed to 691** — state whether you confirmed that `ListingCard.tsx` passes no `className`
   prop to `MantineListingCardPattern`.
9. Assumptions, deviations, limitations. **This kickoff's own measured facts are not exempt** — §3.4, §3.5, §3.6,
   §3.7 and the 16-cell derivation in §3.9 were all measured on 2026-08-10 and every one of them is yours to
   re-check. Six consecutive kickoffs have shipped a factual defect; the last was mine, in 694.
10. Confirmation that no `docs/critical-flow-registry.md` entry is affected.

---

## 15. Task quality gate

| Check | Result |
|---|---|
| Executable by a fresh Sonnet with no chat context | **Yes** — every line, string, compiled declaration and consumer is in §3 |
| Every primary requirement has a binary AC and a verification method | **Yes** — R1–R10 → AC1–AC9 |
| Scope names what must not change | **Yes** — §8, the marker tokens, the six AC5 md5 witnesses |
| Comparator shown able to fail | **Yes** — the computed-style capture is per-property, and §10 step 5 defines the failure action; the rendered matrix carries D26's own comparator |
| Pre-plant census / no further lifeline | **N/A** — no gate is authored; the equivalent is §3.6's last-consumer census, measured |
| No claimed command, file, value or behavior went uninspected | **Yes** — every §3 fact re-derived 2026-08-10 |
| Owner-only exceptions traceable | **Yes** — D28, D34 and the 691 blocking decision are all pre-existing owner decisions, cited with dates |
| Sprint assignment | **Yes** — Sprint 46, order 46.2, filed inside `tasks/Sprints/` |
| Permanent Storybook creation gate | **N/A** — no story added, extended or probed; §8 forbids it explicitly |
| No number duplicated | **Yes** — the deferred overlay work takes **741**, the next free number; 691/695/700 keep their scopes |
| Dirty-worktree manifest | **Conditional** — 694's set may still be uncommitted at execution time. If `git status` is not clean at I0, complete `docs/orchestrator-dirty-worktree-manifest-template.md` for every entry before editing |

---

## Handoff

Execute from this saved path using `.claude/skills/execute-task/SKILL.md`. Read §6's bundle, take the §13.2 step-1
and step-2 baselines **before** touching anything, and treat §3.2 as a fence, not a to-do list.
