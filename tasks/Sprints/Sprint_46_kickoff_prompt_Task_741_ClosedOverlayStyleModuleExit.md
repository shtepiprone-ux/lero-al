# Task 741 — Retire `CLOSED_OVERLAY_STYLE`'s Tailwind strings into `ListingCard.module.css`

> **Status: `NEEDS REVISION` — Revision 3, 2026-10-04 (executor I0 block upheld). The ONLY executable route is §17 at
> the end of this file.** §16 (Revision 2) is kept for its owner quote (§16.1) and findings (§16.2) only; §17.1 lists
> which of its requirements are withdrawn, superseded or carried. §1–§15 are the closed 2026-08-15 migration, kept as
> history.

**Sprint 46.6. Q4 — Release/Critical Flow** (it edits `ListingCard.tsx`, named in
`docs/critical-flow-registry.md:57`).

**This kickoff supersedes the reserved rows in `docs/backlog.md` and the Sprint 46 plan.** Both are
close but not exact: they cite `ListingCard.tsx:56-59 → :266` (the tree says **`:58-61` → `:268`**)
and "9 other consumers" of the status tokens (measured: **8** files). §3 below is the re-derived
inventory. Where this kickoff and the tree disagree, the tree wins — and say so.

---

## 1. Mode and task type

Mixed surface, one dependency chain, D28 mechanism-only:

| Surface | Kind |
|---|---|
| `ListingCard.tsx:58-61` (the constant) → the rendered sold/rented overlay | **rendered** — needs before/after proof |
| `.next/static/css` — 4 Tailwind utilities that stop being generated | **build-output** — needs compiled-CSS proof |
| `ListingCardPattern.stories.tsx`, `MantineListingCardPattern.smoke.test.tsx` | **contract** — the pass-through must keep being proven, by a different witness |

## 2. Objective

Move the two `CLOSED_OVERLAY_STYLE` values into `ListingCard.module.css` as `@layer utilities`
classes that reproduce their **own compiled output** exactly, and remove every remaining source of
the four utility strings from the tree.

`MantineListingCardOverlay.className?: string` **stays** an arbitrary public pass-through. Owner
decision, 2026-08-14, quoted: *"MantineListingCardOverlay зберігає `className?: string` як довільний
public pass-through. Не замінювати його tone-пропом і не вирішувати це всередині 741. … Контракт
довільного `overlay.className` зберегти та явно протестувати; мігруються лише внутрішні продакшн-
значення для sold/rented."* Only the app's own values migrate. The prop's shape does not change.

Nothing about the rendered result may change, **including the fallback in browsers without
`color-mix`**. This is D28.

## 3. Verified context

Measured 2026-08-14 against `HEAD` = `6ecfcf21365f1c791ba8b877b177c00ab0ae001e`, clean worktree.
**Re-derive every count at I0 (§10.1). If the tree disagrees, the tree wins.**

### 3.1 The producer

```
src/modules/listings/components/ListingCard.tsx
:58  const CLOSED_OVERLAY_STYLE: Partial<Record<ListingStatus, string>> = {
:59    sold:   'bg-status-info/80 border-status-info',
:60    rented: 'bg-status-rented/80 border-status-rented',
:61  }
…
:268   ? { label: t(`status_${listing.status}` …).toUpperCase(), className: CLOSED_OVERLAY_STYLE[listing.status] }
```

Consumed one component away, at `MantineListingCardPattern.tsx:316`:

```tsx
<Box component="span" className={cn(styles.overlayLabel, overlay.className)}>
```

`cn` is `twMerge(clsx(...))` (`src/lib/utils.ts:4-6`). That matters — see §3.5.

### 3.2 Four sources of the same strings, and Tailwind scans all four

`globals.css` `@source not` excludes only `../../docs`, `../../tasks`, `../../scripts` (`:11`, `:12`,
`:25`). Stories and `__tests__` are **in** the scan.

| Site | Content | Disposition in this task |
|---|---|---|
| `ListingCard.tsx:59-60` | the 4 real utilities | migrate to module classes |
| `MantineListingCardPattern.tsx:39` | JSDoc *example* `bg-status-info/80 border-status-info` | rewrite so the scanner sees no utility-shaped string — the `PerfDevOverlay` hazard from 695, in a second file, knowable this time |
| `ListingCardPattern.stories.tsx:120` | `className: 'bg-status-info/80 border-status-info'` | replace with the neutral hook class (§3.7) |
| `MantineListingCardPattern.smoke.test.tsx:105` | `className: 'bg-status-info/80'` | replace with the neutral hook class (§3.7) |

Migrating only the producer leaves the story and the test proving raw Tailwind while production
renders a module class — a proof path that no longer proves production. Owner decision, 2026-08-14:
*"741 прибирає всі джерела саме цих overlay Tailwind-утиліт … Після задачі рядків
`bg-status-info/80`, `border-status-info`, `bg-status-rented/80`, `border-status-rented` у дереві не
лишається."*

### 3.3 The compiled output is the DEGRADED D35 tier — reproduce it, do not "fix" it

Verbatim from `.next/static/css/9da9f59077fdb31e.css`:

```
.bg-status-info\/80{background-color:var(--status-info)}
@supports (color:color-mix(in lab,red,red)){.bg-status-info\/80{background-color:color-mix(in oklab,var(--status-info) 80%,transparent)}}
.border-status-info,.border-status-info\/20{border-color:var(--status-info)}
```

(`--status-rented` is identical in shape.)

The static fallback is a **bare `var(--status-info)`** — fully opaque, no 80% alpha — because
`globals.css:80-81` declares `--color-status-info: var(--status-info)`, a runtime `var()` alias that
Tailwind cannot statically composite. That is exactly D35's measured signature. **It is already the
shipped behaviour**, and D28 says reproduce it.

Contrast the precedent you will be tempted to copy: `MantineListingCardPattern.module.css:340`
writes `background-color: #0000004d` because `--overlay: oklch(0 0 0)` is a **literal**, so Tailwind
*could* composite it. Do not carry that hex idiom across. Owner decision, 2026-08-14: *"Не
розгортати токени в hex і не використовувати композитний hex fallback."*

The required module shape is therefore:

```css
@layer utilities {
  .closedOverlaySold {
    background-color: var(--status-info);   /* bg-status-info/80 static fallback (D35-degraded, reproduced) */
    border-color:     var(--status-info);   /* border-status-info */
  }
}
@supports (color: color-mix(in lab, red, red)) {
  @layer utilities {
    .closedOverlaySold { background-color: color-mix(in oklab, var(--status-info) 80%, transparent); }
  }
}
```

Class names are yours; the two-tier structure and the exact values are not. Confirm the `@supports`
condition string against the bundle at I0 rather than copying it from here.

### 3.4 D34 decides which module the classes go in, and it is not the pattern's

| Module | Layer | Why |
|---|---|---|
| `ListingCard.module.css` (702) | **`@layer utilities`** | D28 migration — reproduces a utility's own losing standing against Mantine's unlayered CSS |
| `MantineListingCardPattern.module.css` (602/691) | **unlayered, deliberately** | cascade-trap *fix* — must win against Mantine |

`bg-status-info/80` and `border-status-info` are utilities that currently take effect, so their
replacement is a D28 migration and belongs in the **layered** `ListingCard.module.css`. Owner
decision, 2026-08-14: *"741 переносить лише поточні стилі `CLOSED_OVERLAY_STYLE` у
`ListingCard.module.css`, який лишається `@layer utilities` за D34."* Putting them in the pattern's
unlayered module would change their cascade standing. Do not.

The file already carries this reasoning in its own header comment (`:9-22`); read it before adding
a rule.

### 3.5 Two things that look like hazards — measure them, do not assume either way

1. **tailwind-merge.** `cn(styles.overlayLabel, overlay.className)` runs both through `twMerge`.
   Today `overlay.className` is the only Tailwind-recognisable argument, so nothing is deleted;
   after the migration both arguments are hashed module classes and `twMerge` recognises neither.
   That *should* be inert. 748's RR1 was exactly this reasoning going wrong in the other direction
   (a module class stopped participating in conflict resolution and silently kept a colour that
   Tailwind had been deleting). Prove it: capture the resolved class list on the real element in
   both phases.
2. **Property contention with `.overlayLabel`.** `MantineListingCardPattern.module.css:348-359`
   sets `color`, `font-weight`, `font-size`, `line-height`, padding, radius, `rotate`,
   `border-style`, `border-width` — and **not** `background-color` or `border-color`. So the
   unlayered `.overlayLabel` and the new layered class set disjoint properties. Re-measure this at
   I0; if `.overlayLabel` has gained either property, stop and report — an unlayered rule would
   beat the migrated layered one and that is a real regression, not a styling preference.

### 3.6 What must survive

`--status-info` / `--status-rented` (`globals.css:414-415`) and their `@theme inline` aliases
(`:80-81`) stay. **8** other files still use the `bg|border|text-status-(info|rented)` family:

`app/admin/page.tsx` · `AdminDashboardRecentListings.tsx` · `AdminListingsTable.tsx` ·
`components/ui/badge.tsx` · `ListingDetailView.tsx` · `ListingStatusBanner.tsx` ·
`listingSemanticHelpers.ts` · `listingSemanticLayer.ts`

(The backlog says "9 other consumers"; re-derived it is 8 files. Report whichever the tree gives at
I0.) So no `@theme` entry loses its last consumer and **no `@theme` deletion is in scope** — this is
not 695. Also measured: `var(--color-status-*)` has **zero** references anywhere in `src/`, and
`var(--status-info)`/`var(--status-rented)` currently appear only in `globals.css`. Your new module
classes will be their first `.module.css` consumers, so expect `check:css-vars`' Arm B owned-name
reference count to rise by exactly 2 — that is the change landing, not a violation.

### 3.7 The pass-through contract keeps a witness — a neutral hook class

Owner decision, 2026-08-14: *"Story і smoke-тест мають перевіряти його через нейтральний hook-клас,
який не є Tailwind-утилітою (наприклад, `consumer-overlay-hook`), та підтвердити, що він доходить до
overlay-елемента."*

So the story and the smoke test stop asserting a colour and start asserting the **contract**: an
arbitrary consumer-supplied class reaches the overlay element. Pick a class name that Tailwind
cannot resolve to a utility (`consumer-overlay-hook` is a fine default) and assert its presence on
the rendered element, not merely that the prop was passed.

### 3.8 Rendered proof of the migrated colours — story disposition

`ListingCardPattern.stories.tsx` renders a sold card today, but it *fabricates* the className; after
this task it proves the pass-through, not production's colours. `ListingCard.stories.tsx` renders
the real `ListingCard`, but only with `status: 'active'` (`:80`, `:89`) — nothing there renders a
closed card.

Owner decision, 2026-08-14: *"Візуальний стиль sold/rented живе лише в layered
`ListingCard.module.css`; story має показувати його через звичайний продакшн-шлях."* That
authorises a **permanent extend** of `ListingCard.stories.tsx` with closed listings rendered through
the real `ListingCard` — the named in-scope production consumer is `ListingCard.tsx`'s `isClosed`
branch (`:267-269`), which would otherwise lose story-backed rendered coverage of its colours the
moment the utility strings go. Record the inspected candidates and this authorisation in the
canonical UI decision record; the extension is minimal (sold + rented cards in the existing grid
section of the single `Default` export — governance §8 allows no second export). Reuse existing
production i18n (`status_sold`/`status_rented`); do **not** add `storybook.*` keys unless
`check:stories` Check 6 forces it, and say so if it does.

### 3.9 Critical flow

`docs/critical-flow-registry.md:57` — *Listing card rendering — Mantine pattern is the COMPLETE
single source of truth*, Tasks 602/605, suite
`src/modules/listings/components/__tests__/ListingCard.smoke.test.tsx`, whose stated coverage
includes *"sold-listing overlay+disabled-favorite"*. Clause 15 binds: run it, record its real
result, **do not modify it**. It is a different file from the pattern smoke test you *do* edit —
do not confuse them.

### 3.10 Start state

`HEAD` = `6ecfcf21365f1c791ba8b877b177c00ab0ae001e`, `git status --porcelain` **empty**. If it is
dirty at I0, complete `docs/orchestrator-dirty-worktree-manifest-template.md` before the first write.

## 4. Requirements

| ID | Observable requirement | Priority | AC |
|---|---|---|---|
| R1 | `CLOSED_OVERLAY_STYLE` maps to `ListingCard.module.css` classes; zero Tailwind utility strings remain in it | P0 | AC1 |
| R2 | The rendered sold **and** rented overlay is identical before and after — background, border, and the `@supports`-off fallback — measured | P0 | AC2 |
| R3 | Zero `bg-status-info/80`, `border-status-info`, `bg-status-rented/80`, `border-status-rented` occurrences remain anywhere in `src/**`, comments included | P0 | AC3 |
| R4 | The new rules are inside `@layer utilities` and reproduce the two-tier compiled output with `var(--status-*)` — no hex, no composited fallback | P0 | AC4 |
| R5 | `MantineListingCardOverlay.className?: string` is unchanged in type and behaviour; an arbitrary consumer class still reaches the overlay element | P0 | AC5 |
| R6 | The pattern smoke test and the pattern story assert the pass-through via a non-Tailwind hook class, and each new assertion is shown to fail | P0 | AC6 |
| R7 | `ListingCard.stories.tsx` renders sold and rented through the real `ListingCard`; the UI decision record names candidates and the quoted owner authorisation | P1 | AC7 |
| R8 | `ListingCard.smoke.test.tsx` runs, its real result is recorded, and the file is unmodified | P0 | AC8 |
| R9 | Standing gates green; evidence under `docs/reviews/artifacts/<date>-task741/` | P1 | AC9 |

## 5. Assumptions and open questions

- **A1.** The migration is value-identical by construction because the module reproduces the
  compiled rules verbatim. That is the *hypothesis*; R2 is the measurement. If any computed value
  moves, stop and report.
- **A2.** `twMerge` deletes nothing today and will delete nothing after (§3.5.1). Verify on the real
  element, both phases.
- **A3.** `.overlayLabel` sets neither `background-color` nor `border-color` (§3.5.2). Re-measure at
  I0; a change here is a stop condition, not a style question.
- **OQ1 — yours to decide and report.** Whether `MantineListingCardPattern.tsx:39`'s JSDoc keeps a
  scanner-invisible form of the example or drops it for prose. Either is acceptable; the test is
  AC3's census, not the wording. 695 resolved the same question as prose and recorded why.
- **OQ2 — yours to decide and report.** One class per status (`.closedOverlaySold` /
  `.closedOverlayRented`) versus a shared base plus two colour classes. Either is acceptable if the
  compiled two-tier output is reproduced per status and AC2 passes for both.
- **OQ3 — owner-only, do not act on it.** Whether `overlay.className` should eventually become a
  `tone` prop. Explicitly deferred by the owner on 2026-08-14. Out of scope.

## 6. Pre-read rule bundle

Always: `docs/agent-contract.md` · `docs/rule-index.md` · `docs/qa-profiles.md` · `docs/backlog.md` ·
`docs/critical-flow-registry.md` **row `:57` in full**.

Current Mantine path: `docs/component-rules.md` · `docs/ui-rules.md` · `docs/qa-rules.md` ·
`docs/mantine-responsive-design-system.md`.

Storybook / visual proof: `docs/storybook-governance.md` (§8 single-export rule, §14) ·
`docs/storybook-visual-snapshots.md`.

Regression / critical flow: `tasks/Epics/Epic_RS_Regression_Shield.md`.

Task-specific:

- `src/modules/listings/components/ListingCard.module.css` **`:1-30`** — 702's header, and the D34
  layered-vs-unlayered reasoning you must not undo.
- `src/design-system/mantine/patterns/MantineListingCardPattern.module.css` `:339-359` — the
  `.overlayCenter`/`.overlayLabel` rules and the `#0000004d` idiom that does **not** apply here.
- `docs/sessions/2026-08-10-task702-listingcard-detailwind.md` — the module this task extends.
- `docs/sessions/2026-08-13-task748-overlay-utility-exit.md` **RR1** — a module class silently
  keeping a colour tailwind-merge had been deleting. The failure mode §3.5.1 asks you to exclude.
- `docs/sessions/2026-08-13-task695-overlay-namespace-exit.md` §6.1 — the scanned-comment hazard,
  and the comparator shape to reuse.
- `docs/reviews/artifacts/2026-08-13-task695/real-before-after-comparator.mjs` — two-phase
  comparator, 4 canonical Mantine widths × 4 locales, plant on the after side. Reuse its shape.
- D28, D34, D35, D36 in `docs/backlog.md`'s decisions block.

## 7. Scope

| Path | Action |
|---|---|
| `src/modules/listings/components/ListingCard.tsx` | **modify** — `CLOSED_OVERLAY_STYLE` values only |
| `src/modules/listings/components/ListingCard.module.css` | **modify** — add the layered two-tier rules |
| `src/design-system/mantine/patterns/MantineListingCardPattern.tsx` | **modify** — the `:39` JSDoc example only. **Do not touch the interface, the `cn()` call, or any render branch.** |
| `src/design-system/mantine/patterns/__tests__/MantineListingCardPattern.smoke.test.tsx` | **modify** — hook-class assertion |
| `src/stories/patterns/mantine/ListingCardPattern.stories.tsx` | **modify** — hook class instead of the literal |
| `src/stories/mantine/primitives/ListingCard.stories.tsx` | **extend** — sold + rented through the real `ListingCard` |
| `docs/reviews/artifacts/<date>-task741/` | **create** — comparator, transcripts, results |
| `docs/sessions/<date>-task741-*.md` | **create** |
| `docs/backlog.md` | **modify** — concise state, ≤80 lines |

## 8. Out of scope

- **`MantineListingCardOverlay`'s shape.** The `className?: string` prop stays. OQ3 is owner-only.
- **The pattern's unlayered module.** No overlay colour rule goes in it.
- **`--status-info` / `--status-rented` and their `@theme` aliases**, and the 8 other consumer files
  in §3.6. This is not a token task and not a second 695.
- **`ListingCard.smoke.test.tsx`** — run it, never edit it (§3.9).
- Any other `className=` site in `ListingCard.tsx` — 702 closed those and they are approved.

## 9. Current and required behavior

**Current.** A closed listing renders a rotated centered label whose background is
`color-mix(in oklab, var(--status-info) 80%, transparent)` (or bare `var(--status-info)` where
`color-mix` is unsupported) and whose border colour is `var(--status-info)`, supplied by two Tailwind
utilities passed as a string from `ListingCard.tsx` through the pattern's `cn()`. `rented` is the
same with `--status-rented`.

**Required after.** Byte-identical rendering, from `@layer utilities` rules in
`ListingCard.module.css`. The four utility strings exist nowhere in `src/**`. The pattern still
accepts, and is still proven to accept, an arbitrary `overlay.className`.

## 10. Implementation requirements — the ordering is mandatory

1. **I0 first.** `git status --porcelain`; re-derive §3.1's line numbers, §3.2's four sites, §3.3's
   compiled rules (quote them verbatim from the bundle), §3.5.2's `.overlayLabel` property list, and
   §3.6's consumer count. `npm run build`; retain the transcript with `/[locale]` First Load JS.
   Record the source census for the four strings (**expect `TOTAL 9` across 4 files**) and the
   compiled-rule census (**expect `TOTAL 6`**). If either returns a different number, that is a
   §3 correction to report, not a command to quietly retune.
2. **Build the two-phase comparator BEFORE editing** — I0 export via `git archive`, both phases on
   real elements, fail-closed on moved/missing/errored/short, plant on the **after** side. Cover the
   overlay label's `backgroundColor` and `borderColor` for **sold and rented**, at 4 canonical
   Mantine widths × 4 locales. Capture the element's **resolved class list** in both phases too
   (§3.5.1). Assert the BEFORE export is actually pre-migration — 695's F2 exists because that check
   was missing.
3. **Add the module rules and re-point `CLOSED_OVERLAY_STYLE`.** Rebuild.
4. **Rewrite the JSDoc example, the story and the smoke test.** Rebuild. Confirm the source census
   for the four strings is **0** and the compiled-rule census for those four selectors is **0**.
   Do not proceed until both are.
5. **Extend `ListingCard.stories.tsx`** with sold + rented, and run the comparator's after phase
   against it.
6. **Show each new/changed assertion failing** on a planted violation — the hook-class assertions in
   both the story-backed proof and the smoke test.
7. **Run the critical-flow suite** and record the real result.
8. **Stop conditions — report, never route around:** any moved computed value; any of the four
   strings still present after step 4; `.overlayLabel` setting `background-color` or `border-color`;
   `twMerge` resolving a different class list in either phase; any First Load JS increase; any need
   to change `MantineListingCardOverlay`; a `check:` gate you cannot restore without weakening it.

## 11. Positive and negative flows

**Positive.** A `sold` listing on `/[locale]` and `/[locale]/listings` (Grid) renders the rotated
overlay with the same background, border and text as before, in all 4 locales and at 320/375/390/1024.

| Negative branch | Applicable? | Reason / evidence required |
|---|---|---|
| Validation | No | no form, input or user-supplied value is touched |
| Authorization / RLS | No | no data-access or write path is touched |
| Offline / network | No | pure CSS + class-string change |
| Concurrent writer | No | no write path |
| **Browser without `color-mix`** | **Yes** | the `@supports`-off tier must still render bare `var(--status-*)`. Capture it — a probe with the `@supports` block disabled, or an equivalent measurement you can defend |
| **List layout** | **Yes** | the pattern renders no overlay in `layout='list'` (`MantineListingCardPattern.smoke.test.tsx:104-105`). That must stay true |
| **Critical-flow regression** | **Yes** | `ListingCard.tsx` is named in `docs/critical-flow-registry.md:57`; `ListingCard.smoke.test.tsx` unmodified (§3.9) |

## 12. Acceptance criteria

- **AC1 [R1]** — Given `ListingCard.tsx:58-61`, when the file is read, then `CLOSED_OVERLAY_STYLE`'s
  values are `styles.*` references and contain no Tailwind utility string; quoted in the report.
- **AC2 [R2]** — Given the two-phase comparator, when it runs over sold and rented at 4 widths × 4
  locales × 2 phases, then every captured property is identical, diff count **0**, and the same
  comparator exits non-zero with a plant on the after side. The `@supports`-off tier is measured
  separately and is also identical.
- **AC3 [R3]** — Given the §13 source census, when run across `src/**` with comments **not** stripped,
  then it returns **`TOTAL 9` at I0 and `TOTAL 0` after step 4**; and the compiled-rule census returns
  **`TOTAL 6` at I0 and `TOTAL 0` after step 4**. All four numbers quoted, with the regexes that
  produced them.
- **AC4 [R4]** — Given `ListingCard.module.css`, when the new rules are read, then they are inside
  `@layer utilities`, use `var(--status-info)` / `var(--status-rented)` with no hex literal, and
  carry both tiers with the bundle's own `@supports` condition, quoted from the I0 bundle.
- **AC5 [R5]** — Given `MantineListingCardOverlay`, when its declaration is diffed, then
  `className?: string` is unchanged; and a rendered element carrying an arbitrary consumer class is
  captured in the evidence.
- **AC6 [R6]** — Given the rewritten pattern smoke test and story assertion, when each is run against
  a planted violation (the class not forwarded to the overlay element), then each **exits non-zero**;
  shown for each.
- **AC7 [R7]** — Given `ListingCard.stories.tsx`, when the story is built, then sold and rented cards
  render through the real `ListingCard`; the canonical UI decision record names every inspected
  candidate, why reuse was insufficient, and quotes the 2026-08-14 owner authorisation; `check:stories`
  passes with no new violation.
- **AC8 [R8]** — `ListingCard.smoke.test.tsx` passes, transcript retained, and the file is absent
  from `git status --porcelain`.
- **AC9 [R9]** — `build` exit 0 with `/[locale]` First Load JS not increased; `typecheck`,
  `check:design-tokens`, `check:css-vars` (+ `--verify-gate`), `check:stories`, `check:mojibake`,
  `check:file-integrity`, `check:review-ledger` each with a **transcript from this task's own run**;
  full `vitest`; `docs/backlog.md` ≤80 lines with the baseline taken from
  `git show HEAD:docs/backlog.md | wc -l`.

## 13. QA profile and verification plan

**`Q4 — Release/Critical Flow`.** Q3's visual matrix applies to the rendered surface: **4 canonical
Mantine widths (320/375/390/1024) × 4 locales**, per `scripts/check-stories-rendered.mjs`
`MANTINE_VIEWPORTS`. 695's F8 was a single-width capture against exactly this requirement — do not
repeat it.

Source census — the four strings, **comments included** (the JSDoc is a real source). Both commands
below were run against `6ecfcf213` while writing this kickoff; their I0 outputs are stated so you can
tell a working census from a broken one:

```powershell
node -e "const re=/(?:bg-status-(?:info|rented)\/80|border-status-(?:info|rented))(?![\w\/-])/g;const fs=require('fs'),p=require('path');let n=0;(function w(d){for(const f of fs.readdirSync(d,{withFileTypes:true})){const q=p.join(d,f.name);if(f.isDirectory())w(q);else if(/\.(tsx|ts|css)$/.test(f.name)){const m=fs.readFileSync(q,'utf8').match(re);if(m){n+=m.length;console.log(m.length,q,JSON.stringify([...new Set(m)]))}}}})('src');console.log('TOTAL',n)"
```

**I0 = `TOTAL 9` across exactly 4 files** — `ListingCard.tsx` 4 · `MantineListingCardPattern.tsx` 2
(JSDoc) · `ListingCardPattern.stories.tsx` 2 · `MantineListingCardPattern.smoke.test.tsx` 1.
The trailing `(?![\w\/-])` is load-bearing: without it, `border-status-info` also matches
`border-status-info/20` and `/30` in `badge.tsx`, `AdminListingsTable.tsx`, `ListingDetailView.tsx`
and `ListingStatusBanner.tsx`, and the census reports 18 across 8 files — none of which this task
touches. A census that returns 18 is the broken one.

Compiled-rule census — run at I0, after step 4, and at the end:

```powershell
node -e "const fs=require('fs');const re=new RegExp('\\\\.(?:bg|border)-status-(?:info|rented)\\\\\\\\/80\\\\{[^}]*\\\\}|\\\\.border-status-(?:info|rented)(?=[,{])[^{]*\\\\{[^}]*\\\\}','g');let n=0;for(const f of fs.readdirSync('.next/static/css')){if(!f.endsWith('.css'))continue;const m=fs.readFileSync('.next/static/css/'+f,'utf8').match(re);if(m){n+=m.length;m.forEach(r=>console.log(f,'::',r))}}console.log('TOTAL',n)"
```

**I0 = `TOTAL 6`** — the two `/80` two-tier pairs (4 rules) plus the two grouped bare-border rules
`.border-status-info,.border-status-info\/20{…}` and its `rented` twin. Note the grouping: the bare
`.border-status-*` selector shares a rule with the `/20` variant that four other files still use, so
after this task that rule survives as `.border-status-info\/20{…}` alone and the lookahead stops
matching it. **Expected final: 0.** Built as a `RegExp` from a string on purpose — the escaped `\/`
in the compiled selector cannot be written inline in a `/…/` literal inside a shell-quoted `-e`
without breaking the regex; that is how the first draft of this command failed.

Quote the regex you actually ran and the rules it matched, at all three points. A census you tuned
until it returned 0 is not evidence; both commands are required to return their stated non-zero I0
value first.

Critical-flow suite:

```powershell
npx vitest run src/modules/listings/components/__tests__/ListingCard.smoke.test.tsx
```

Anything that cannot run in your environment is `PARTIALLY IMPLEMENTED`, never a pass.

## 14. Completion report contract

Report `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`.
**Never self-approve, and do not mark Sprint 46 closed** — that is the owner's call.

Beyond the standing contract: the three source-census and three compiled-census counts (I0 /
post-step-4 / final); the I0 compiled rules quoted verbatim next to the module rules that replace
them; the before/after table for sold and rented including the `@supports`-off tier; the resolved
class list on the overlay element in both phases (§3.5.1); each new assertion's failing plant; the
canonical UI decision record for the story extension; and **this kickoff's own facts are not
exempt** — §3 was measured 2026-08-14 against `6ecfcf213`, its two corrections to the backlog are in
the header, and if the tree disagrees with anything here the tree wins and the deviation is reported.

## 15. Task quality gate

| Check | Result |
|---|---|
| Executable by a fresh Sonnet with no chat context | **Yes** — every site, line, compiled rule, command and ordering constraint is in §3, §10 and §13 |
| Every primary requirement has a binary AC | **Yes** — R1–R9 → AC1–AC9 |
| Scope protects existing behavior and names what must not change | **Yes** — §8, §3.6, and eight stop conditions in §10 |
| Comparator shown able to fail | **Required of the executor** — AC2, plant on the after side, plus the BEFORE-identity assertion 695's F2 was missing |
| Changed gates rewritten rather than deleted, and shown able to fail | **Yes** — AC6, one plant per changed assertion |
| Ordering hazard stated as a hard constraint | **Yes** — §3.2 and §10's numbered sequence: the scanned sources go before the census can reach 0 |
| Permanent story extension passes the creation gate | **Yes** — §3.8 names the inspected candidates, why neither suffices after the migration, the in-scope production consumer (`ListingCard.tsx:267-269`) and the quoted owner authorisation of 2026-08-14 |
| Owner-only exceptions traceable | **Yes** — three owner decisions of 2026-08-14 quoted verbatim in §2, §3.2, §3.3, §3.4, §3.7, §3.8; OQ3 deferred to the owner |
| No claimed command, file, value or behavior went uninspected | **Yes** — §3.1–§3.9 re-measured 2026-08-14 against `6ecfcf213`, including the compiled rules, the `cn()` definition, the `.overlayLabel` property list, the `@source` exclusions and the 8-file consumer count. The two backlog figures that did **not** reproduce are corrected in the header rather than repeated |

---

## Handoff

Execute from this saved path using `.claude/skills/execute-task/SKILL.md`.

**One thing to internalise.** Three of the four sources of these strings are not production code —
a JSDoc example, a story and a test. The census cannot reach 0 until all three are gone, and until
it does, the compiled rules survive and every "the utility is retired" claim is false while looking
true. 695 hit this exact shape in a file its own kickoff had not inspected and had to widen scope
mid-task; here all four sites are named up front, so there is no excuse for a partial census. Ask of
each artifact you produce: *what would have to be broken for this to redden?* If the answer is
"nothing", that artifact is the defect.

---

## 16. Revision 2 — one canonical "Sold"/"Rented" style on every listing card, no hardcode (owner reopened 2026-09-17)

Sprint 46 · P1 · QA profile **Q4** (edits `ListingCard.tsx`, which is in the critical-flow registry at
`docs/critical-flow-registry.md:63`). Every executor action comes from this section alone. New evidence goes to
`docs/sessions/evidence/task741r2/`.

### 16.1 Owner decision — 2026-09-17, quoted verbatim

> Але я бачу проблемні місця всередині карток. Наприклад, на проді і в Storybook я бачу різні типи карток з різними
> стилями елементів "Продано" і "Орендовано". Необхідно вияснити все ж таки, які стилі є канонічними і привести вусе до
> одного стилю, а hardcode видалити.

> Необхідно зробити ревізію на задачу, яка відповідає за картки

This is still in force (2026-08-14, quoted in §2): *"MantineListingCardOverlay зберігає `className?: string` як довільний
public pass-through. Не замінювати його tone-пропом"*. §16 therefore **adds** a colour field next to `className`, and does
not replace `className`.

### 16.2 Verified findings (orchestrator, 2026-09-17, working tree)

- **F1 — three status styles on one card.** On a closed grid card, "Sold" is drawn twice, in two different styles:
  - The top-left badge is a Mantine `Badge variant="filled"` with `color="blueLight"` (rented: `purple`). Source:
    `ListingCard.tsx:78-98` `getBadges`, rendered at `MantineListingCardPattern.tsx:320-326`.
  - The centred rotated overlay is a plain `<span>`. Its colour comes from `ListingCard.module.css:102-120`
    `.closedOverlaySold`/`.closedOverlayRented`: `var(--status-info)`/`var(--status-rented)`, an 80% `color-mix` tier
    and a border. Its typography, padding, radius and 2px border are hand-copied Tailwind output in
    `MantineListingCardPattern.module.css:449-460` `.overlayLabel`, with 5 `design-tokens-allow` suppressions. The
    scrim is `.overlayCenter` (`:440-447`, `#0000004d` plus a `color-mix` tier).
- **F2 — Storybook differs from production.** `Patterns/Mantine/ListingCardPattern` renders its sold overlay with
  `className: 'consumer-overlay-hook'` (`ListingCardPattern.stories.tsx:178-180`), which carries no colour. Its "Sold"
  overlay therefore renders uncoloured, while production's is blue. The story has no rented card at all.
  `Mantine/Primitives/ListingCard` (`ListingCard.stories.tsx:107-125`) renders the real `ListingCard` sold and rented,
  so it shows the production look. The two Storybook pages disagree.
- **F3 — the canonical tone already exists and the overlay bypasses it.** `sold → blueLight`, `rented → purple` is
  defined in three places:
  - the theme: `theme.ts:286` `blueLight`, `:327` `purple`;
  - the canonical Badge story: `Mantine/Primitives/Badge`, Task 617, `Badge.stories.tsx:36-37`;
  - the two consumers `ListingCard.tsx:91,96` and `ListingStatusBanner.tsx:27-34`, story
    `Mantine/Primitives/ListingStatusBanner`.

  Only the overlay uses raw `--status-*` CSS variables with its own opacity.
- **F4 — the tone map is duplicated.** `ListingCard.tsx` `getBadges` and `ListingStatusBanner.tsx` `COLORS` each carry
  their own copy of the same mapping.
- **F5 — the card story itself uses Tailwind.** `ListingCardPattern.stories.tsx` has `className` at `:82`
  (`h-[180px] flex items-center justify-center bg-muted`), `:83` (`text-muted-foreground`), `:119` (`whitespace-nowrap`),
  `:131` (`text-xs text-muted-foreground`) and `:198` (`shrink-0 -mt-0.5 -mr-1` / `shadow-sm`).

### 16.3 Canonical decision (Opus, binding for this revision; the owner visual matrix can return it)

| Visible artifact | Canonical source (inspected) | Disposition |
|---|---|---|
| Closed-status colour, everywhere on a card | Mantine theme colours `blueLight` (sold) / `purple` (rented), proven by `Mantine/Primitives/Badge` and already used by the card badge and `ListingStatusBanner` | **reuse**: one exported map, `LISTING_STATUS_COLOR`, in a new `src/modules/listings/components/listingStatusColors.ts`, consumed by `getBadges`, the overlay and `ListingStatusBanner` |
| Centred rotated overlay label | Mantine `Badge variant="filled"` with the same `color`, at the size of the pattern's existing status badges (`MantineListingCardPattern.tsx:323`) | **extend** `MantineListingCardPattern`: `MantineListingCardOverlay` gains `color?: string`. With `color`, the label renders as that `Badge`; `className` is still merged onto it. The only local declaration kept is the `-8deg` rotation, in `.overlayLabel`. Remove every hand-copied typography, padding, radius and border declaration and their `design-tokens-allow` markers |
| Overlay scrim | Mantine `Overlay` (native) with `color="var(--overlay)"` (`globals.css:527`) and `backgroundOpacity={0.3}` | **extend**: replaces `.overlayCenter`'s literal and `color-mix` rules |
| `.closedOverlaySold` / `.closedOverlayRented` / `CLOSED_OVERLAY_STYLE` | none — hardcode | **delete** |

`GR-3a STORY PREFLIGHT — MantineListingCardPattern × sold/rented overlay; canonical candidates: patterns-mantine-listingcardpattern--default, mantine-primitives-listingcard--default; direct-import evidence: src/stories/patterns/mantine/ListingCardPattern.stories.tsx (MantineListingCardPattern), src/stories/mantine/primitives/ListingCard.stories.tsx:123-124 (ListingCard); toolbar coverage: locale=context.globals.locale, viewport=toolbar (no pin in either file); decision: EXTEND; target: patterns-mantine-listingcardpattern--default (add a rented DemoCard in the existing grid and list sections, no new export) and mantine-primitives-listingcard--default (unchanged, it is already the production proof); rationale: both pages exist and import the real sources; the defect is the missing colour and the missing rented card, not a missing page.`

`GR-1 CENSUS COMPLETE — card surface ListingCard → MantineListingCardPattern plus its slot children; tier1 2 (ListingCard, MantineListingCardPattern — in manifest, own stories, changed here); tier2 0; tier3 re-listed at I0 from the census command, none changed here.` Re-run
`node.exe scripts\check-surface-census.mjs --surface src\modules\listings\components\ListingCard.tsx` at I0 and paste its
node list into the session log. Stop on any blocking (unmigrated) node.

**Out of scope, by owner decision:** admin status maps (`AdminListingsTable.tsx:79`, `AdminDashboardRecentListings.tsx:35`).
The owner deferred them to the admin Mantine migration (2026-09-17, same session). **Out of scope, reserved:** the cabinet
`ListingsTab.stories.tsx` status variants belong to **789**. The legacy `src/components/ui/badge.tsx` `rented` variant is
a tier-2 primitive consumed outside cards. Re-verify at I0 that the card surface does not import it:
`git grep -n "components/ui/badge" -- src/modules/listings src/design-system/mantine/patterns`.

### 16.4 Requirements

| ID | Observable requirement | P |
|---|---|---|
| **R20** | `listingStatusColors.ts` exports `LISTING_STATUS_COLOR` covering sold, rented, archived, expired, pending and inactive, with today's values. `ListingCard.tsx` `getBadges` and `ListingStatusBanner.tsx` read it, and neither keeps a local colour literal for these statuses. | P0 |
| **R21** | `MantineListingCardOverlay` gains `color?: string`. With `color` set, the overlay label is a Mantine `Badge variant="filled" color={color}` at the pattern's status-badge size, rotated by `.overlayLabel`. `overlay.className` is still merged onto the label: the existing smoke test (`MantineListingCardPattern.smoke.test.tsx:112-117`) and the story play test stay green. | P0 |
| **R22** | The scrim is Mantine `Overlay` with `color="var(--overlay)"` and `backgroundOpacity={0.3}`. `.overlayCenter` is deleted. `.overlayLabel` keeps only the rotation. | P0 |
| **R23** | `ListingCard.tsx` passes `overlay = { label, color: LISTING_STATUS_COLOR[status] }`. `CLOSED_OVERLAY_STYLE`, its comment block and `.closedOverlaySold`/`.closedOverlayRented` (including their `@supports` block) are deleted. | P0 |
| **R24** | In Storybook `Patterns/Mantine/ListingCardPattern` → `Default`, the grid and list sections each show a sold and a rented card. Their badge and overlay use `color` from `LISTING_STATUS_COLOR`, and the `consumer-overlay-hook` play test is kept. The file's F5 Tailwind `className` sites are replaced with Mantine style props (`h`, `c`, `fz`, `bg`, `Center`/`Group`). If a replacement needs a value with no Mantine/theme source, stop and report it. | P0 |
| **R25** | For every closed grid card with an overlay, in both Storybook pages, the overlay label's computed `background-color` equals the top-left status badge's computed `background-color` on the same card. | P0 |
| **R26** | Smoke tests: `ListingCard.smoke.test.tsx` asserts that a sold card and a rented card pass the same colour to badge and overlay. `MantineListingCardPattern.smoke.test.tsx` asserts that `overlay.color` renders a Mantine Badge while `className` still merges. Both are red against the pre-change tree first. | P0 |

### 16.5 Flows

**Positive.** A sold listing card, in Storybook and on `/listings`, reads "SOLD" twice in the same blue filled badge style:
top-left and rotated in the centre, over a black 30% scrim. A rented card does the same in purple.

| Negative flow | Applicable | Expected |
|---|---|---|
| Active / new / price-reduced card | Yes | no overlay; badges unchanged (`green`, `sale`) |
| Archived / expired card | Yes | badge only (`gray` / `yellow`), no overlay, as today |
| List layout | Yes | badge only, same colour as grid (the pattern never renders an overlay in list) |
| Consumer passes `overlay.className` without `color` | Yes | className still merged (owner decision 2026-08-14); the label has no Badge colour |
| Long uk / sq label at 320px | Yes | badge does not overflow the image; owner matrix |
| Detail page `ListingStatusBanner` | Yes | same colours as today, now from the shared map |

### 16.6 Acceptance criteria

- **AC20 [R20]** — `git grep -n "'blueLight'" -- src/modules/listings/components` and the same for `'purple'` list only
  `listingStatusColors.ts`.
- **AC21 [R21–R23]** — `git grep -n -E "closedOverlay|CLOSED_OVERLAY_STYLE|overlayCenter" -- src` prints nothing. The
  `.overlayLabel` rule contains only the rotation and no `design-tokens-allow` marker.
- **AC22 [R26]** — the new smoke assertions are red on the pre-change tree (`01_red.txt`, non-zero) and green after
  (exit 0).
- **AC23 [R25]** — a probe on the built Storybook, `en`, 1440px, covers `mantine-primitives-listingcard--default` (sold
  and rented grid cards) and `patterns-mantine-listingcardpattern--default` (sold and rented grid cards). It records
  overlay and badge computed `background-color` per card, and they are equal for every card. Retain the JSON. The probe
  script lives in the evidence folder and is not a gate.
- **AC24 [R24]** — `git grep -n "className=" -- src/stories/patterns/mantine/ListingCardPattern.stories.tsx` prints no
  Tailwind utility; only the `consumer-overlay-hook` contract may remain. `check:stories`, `check:story-coverage`,
  `check:design-tokens:strict` and `governance:tailwind` exit 0. The `check:locale-leak:mantine-only` `report.json` has no
  leak for the two card story IDs.

`GR-4 AC AUDIT — 5 criteria; each states an observable property; absolutes: the empty greps are the defined end state of deleting named hardcode.`

### 16.7 Verification plan

I0: `git --no-optional-locks status --porcelain`, `git hash-object` of every file you will edit, the §16.3 census and
`components/ui/badge` grep, and `git grep -n "^\s*--overlay\s*:" -- src/app/globals.css`. Then write the R26 assertions,
run the two smoke files and retain the red transcript before touching production code.

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p process.platform
npx.cmd vitest run src/modules/listings/components/__tests__/ListingCard.smoke.test.tsx src/design-system/mantine/patterns/__tests__/MantineListingCardPattern.smoke.test.tsx
npm.cmd run check:stories
npm.cmd run check:story-coverage
npm.cmd run check:design-tokens:strict
npm.cmd run governance:tailwind
npm.cmd run build-storybook
npm.cmd run check:locale-leak:mantine-only
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
git --no-optional-locks grep -n -E "closedOverlay|CLOSED_OVERLAY_STYLE|overlayCenter" -- src
git --no-optional-locks status --porcelain
```

Expected: exit 0 for every command, except:
- the `git grep` line exits 1 with no output;
- `check:locale-leak:mantine-only` is judged by AC24's property (it is non-blocking in CI and red on unrelated stories).

Each command gets its own unpiped transcript with `EXIT_CODE=`.

### 16.8 Owner visual review — `OWNER VISUAL QA REQUIRED`

| Story | Toolbar viewports | Toolbar locales | Owner checks |
|---|---|---|---|
| `Mantine/Primitives/ListingCard` → `Default` | 320, 768, 1440 | en, uk | sold/rented grid cards: badge and centred overlay share one style and colour; scrim; list card badge |
| `Patterns/Mantine/ListingCardPattern` → `Default` | 320, 768, 1440 | en, uk | the same look as the page above, for sold and rented in grid and list; no-image placeholder and footer still render |
| `Mantine/Primitives/ListingStatusBanner` | 1440 | en | sold/rented colours unchanged |
| production `/uk/listings` after deploy | desktop + mobile | uk | a sold/rented card looks like Storybook |

### 16.9 Completion

Write `docs/sessions/<date>-task741r2-closed-status-canonical-style.md` with the owner quotes, R20–R26, the red and green
transcripts, the probe JSON, the gate block and a `Files Changed` table. Update the 741 state in `docs/backlog.md`. Status
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. No self-approval, no git.

---

## 17. Revision 3 — the owner-accepted overlay look stays; the hardcode, the duplicate colour map and the Story Tailwind go (review of the executor's I0 block, 2026-10-04)

Sprint 46 · P1 · QA profile **Q4** (`ListingCard.tsx`, `docs/critical-flow-registry.md`). **This section is the only
executable route.** It replaces §16.3–§16.9. Evidence goes to `docs/sessions/evidence/task741r3/`. Re-entry mode:
**from-scratch** — no Revision 2 write was made (the executor stopped at I0), so no Revision 2 artifact is reused.

### 17.1 Why §16 stopped, and what happens to each of its requirements

The executor's I0 (2026-10-04) stopped before any write. The orchestrator re-measured every point on the tree:

- **FACT.** Task 886 R40 (2026-09-30) already deleted `CLOSED_OVERLAY_STYLE` and `.closedOverlaySold`/`.closedOverlayRented`.
  It added `overlay.tone: 'sold' | 'rented'` (`MantineListingCardPattern.tsx:44`, applied at `:325`). The colour now
  lives in the pattern module as `.overlaySold`/`.overlayRented`: `--status-info` / `--status-rented`, with an 80%
  `color-mix` background (`MantineListingCardPattern.module.css:412-436`).
- **FACT.** The owner accepted that look on 2026-09-30. 886 §21.1 row 5 returned the cards, verbatim: *"Бейджи продано та
  орендовано чомусь різні у примітиві і у інших сторісах. Необхідно привести до одного виду - кольорового!"*. After R40
  the owner accepted §21.8 row 4 ("coloured sold/rented"), verbatim: *"приймаю."* (886 §22.1). The accepted render: sold
  badge `rgb(0,134,201)`, sold overlay `oklab(0.577 -0.087 -0.151 / 0.8)` (886 §21.10, AC31).
- **INFERENCE → decision.** §16.1 (the owner, 2026-09-17) asks for one style on every surface and no hardcode. It does
  not say that the overlay must equal the badge. That equation (§16.3 rows 1–2, R21, R25) was an Opus design marked
  "the owner visual matrix can return it". The later, explicit owner acceptance wins. **The overlay keeps the accepted
  look.** What §16.1 still requires, and what 886 did not do, is remove the hardcode and the duplicate colour map.
- **FACT.** `src/modules/listings/lib/listingStatusTone.ts` (Task 844) already exports `LISTING_STATUS_COLOR`. Its own
  comment (`:15-19`) and the Sprint 46 backlog row say that 741 must switch `ListingCard` to it. §16 R20 instead
  created a second file.
- **FACT, missed by §16 and by the I0 report.** The shared map and `ListingStatusBanner` disagree on `inactive`:
  `listingStatusTone.ts:23` `gray`, `ListingStatusBanner.tsx:33` `yellow`. R20's "with today's values" could not hold
  for both. Owner decision **D46-1** below.
- **FACT.** §16.2 F5's Story line numbers are stale. 886 R29 removed `DemoImage`. The Tailwind sites are now
  `ListingCardPattern.stories.tsx:104`, `:116` and `:191`, and a rented grid card already exists (`:226`).
- **FACT, a latent defect in §16 R22.** Mantine `Overlay` defaults to `zIndex: getDefaultZIndex('modal')` = 200
  (`@mantine/core` 8.3.18 `Overlay.mjs:24`). Used as written, the scrim would rise above the badges and the favourite.
  Today's `Center` scrim has `z-index: auto`.

| §16 item | Revision 3 disposition |
|---|---|
| R20 / AC20 | **Carried, retargeted** → R30 (`listingStatusTone.ts`, no new file) |
| R21 (overlay label = `Badge`), R25 / AC23 (overlay bg = badge bg) | **Withdrawn** (owner acceptance, above) → R31 keeps the look and removes the hardcode |
| R22 | **Carried, corrected** → R32 (`zIndex="auto"`) |
| R23, AC21 | **Superseded — already done by 886 R40.** AC21's grep is replaced by AC31 |
| R24 / AC24 | **Carried, re-measured** → R33 |
| R26 / AC22 | **Rewritten** → R34 |
| §16.3 GR-1 / GR-3a receipts | Re-issued in §17.3 |

### 17.2 Owner decisions — 2026-10-04, chosen verbatim from bounded options

- **D46-1** (the `inactive` colour): *"Gray, from the map (Recommended)"*. `ListingStatusBanner` reads
  `LISTING_STATUS_COLOR` and keeps no local copy. The inactive banner on the listing page turns from yellow to gray. No
  other colour changes.
- **D46-2** (the overlay label radius; the hand-copied `calc(var(--radius) * 1.5)` is 18px and has no theme key):
  *"Use theme 2xl, 16px (Recommended)"*. The label's corners become 16px. No new radius token.

### 17.3 Canonical decision record (GR-0) and receipts

| Visible artifact | Today (source) | Target (token path) | Disposition |
|---|---|---|---|
| Status colour map | `ListingCard.tsx:82,87,91,95` literals; `ListingStatusBanner.tsx:27-34` `COLORS` | `LISTING_STATUS_COLOR` (`src/modules/listings/lib/listingStatusTone.ts:21`) | **REUSE** |
| Overlay label typography | `.overlayLabel` `font-size: .875rem`, `line-height: 1.25rem`, `font-weight: 700` | Mantine style props `fz="sm"` (14px, `theme.ts:702`), `lh="sm"` (1.43 → 20.02px, `theme.ts:690`), `fw={700}` | **REUSE** |
| Overlay label padding | `padding-inline: var(--homepage-runtime-space-3)` (12px), `padding-block: .375rem` | `px="sm"` (12px, `theme.ts:658`), `py="compact"` (6px, `theme.ts:672`) | **REUSE** |
| Overlay label radius | `calc(var(--radius) * 1.5)` = 18px | `bdrs="2xl"` (16px, `theme.ts:682`) — **D46-2** | **REUSE** |
| Overlay label border | `border-style: solid; border-width: 2px` + tone class `border-color` | `bd={`${theme.other.borderWidth.statusOverlay} solid ${OVERLAY_TONE_BORDER[tone]}`}`. The new role `statusOverlay: '0.125rem'` is in `theme.ts` `other.borderWidth` and its type (`:79`). It has the same value as `galleryThumbActive` but a different role, which is rule 3 in the comment at `:74-78`. `OVERLAY_TONE_BORDER = { sold: 'var(--status-info)', rented: 'var(--status-rented)' }` lives in the pattern. Precedent: `GalleryThumbnailButton.tsx:35` | **EXTEND** `theme.other.borderWidth` |
| Overlay label text colour | `.overlayLabel` `color: var(--overlay-foreground)` | `c="var(--overlay-foreground)"` (`globals.css:532`) | **REUSE** |
| Overlay label rotation | `.overlayLabel` `rotate: -8deg` | stays the only declaration in `.overlayLabel` | keep |
| Overlay background | `.overlaySold` / `.overlayRented`, two tiers | unchanged, except that their two `border-color` lines are deleted (the border colour moves into `bd`) | keep |
| Overlay scrim | `Center` + `.overlayCenter` (`#0000004d` fallback + `color-mix(in oklab, var(--overlay) 30%, transparent)`) | Mantine `Overlay color="var(--overlay)" backgroundOpacity={0.3} zIndex="auto" center`. Mantine's `rgba()` emits `color-mix(in srgb, var(--overlay), transparent 70%)` (`rgba.mjs`). `--overlay` is `oklch(0 0 0)` (`globals.css:531`), so the scrim stays black at 30%. `.overlayCenter` is deleted | **REUSE** native Mantine |
| Card footer date | Story `:104` `className="whitespace-nowrap"`; production `ListingCard.tsx:188,278` `style={{ whiteSpace: 'nowrap' }}` | `Text component="span" size="xs" c="var(--muted-foreground)" miw="max-content"` in all three places. The span is a flex item of a `Group` in both layouts (pattern `:280-289`, `ListingCard.tsx:271`), so `min-width: max-content` keeps it on one line exactly as `nowrap` does | **REUSE** Mantine style prop |
| Story grid footer | Story `:116` `className="text-xs text-muted-foreground"` | `fz="xs" c="var(--muted-foreground)"`, as production `ListingCard.tsx:271` | **REUSE** |
| Story favourite chrome | Story `:191` Tailwind `'shrink-0 -mt-0.5 -mr-1'` / `'shadow-sm'` | `className={layout === 'list' ? styles.inlineFavorite : styles.overlayFavorite}` with `styles` imported from `@/modules/listings/components/ListingCard.module.css`. The Story then uses production's exact classes and writes no value of its own | **REUSE** production classes |

`GR-0 CANONICAL REUSE PREFLIGHT — request: closed-listing overlay label + scrim, status colour map, card Story footer/favourite chrome; semantic queries: "status colour map", "LISTING_STATUS_COLOR", "overlay scrim", "borderWidth", "whiteSpace nowrap", "overlayFavorite"; inspected candidates: src/modules/listings/lib/listingStatusTone.ts, src/design-system/mantine/theme.ts (spacing/radius/fontSizes/lineHeights/other.borderWidth), @mantine/core 8.3.18 Overlay + rgba(), src/design-system/mantine/patterns/GalleryThumbnailButton.tsx:35, src/modules/listings/components/ListingCard.tsx:188,271,278, ListingCard.module.css .inlineFavorite/.overlayFavorite, Mantine/Primitives/Badge, Mantine/Primitives/ListingStatusBanner; decision: REUSE (EXTEND theme.other.borderWidth by one role); selected canonical owner: listingStatusTone.ts + theme.ts + MantineListingCardPattern; Mantine/TailAdmin token path: theme.ts spacing.sm/compact, radius.2xl, fontSizes.sm, lineHeights.sm, other.borderWidth.statusOverlay; new hardcoded visual values: NONE; rationale: every value the label hand-copied has a theme key except the 18px radius (owner D46-2 → 2xl) and the 2px border (one new role, same pattern as D824-4).`

`GR-1 CENSUS COMPLETE — 7 nodes; tier1 7 migrated+enrolled+story; tier2 0 imports removed; tier3 0 listed and filed as none.`
That is surface `ListingCard.tsx`, re-run by the orchestrator on 2026-10-04 (`win32`, exit 0). Surface
`ListingStatusBanner.tsx`: 1 node, tier1 1 migrated+enrolled+story. Re-run both at I0 and paste the node lists.

`GR-3a STORY PREFLIGHT — MantineListingCardPattern / ListingCard / ListingStatusBanner × sold, rented, inactive; canonical candidates: patterns-mantine-listingcardpattern--default, mantine-primitives-listingcard--default, mantine-primitives-listingstatusbanner--*; direct-import evidence: ListingCardPattern.stories.tsx:9, src/stories/mantine/primitives/ListingCard.stories.tsx (ListingCard), ListingStatusBanner.stories.tsx:4; toolbar coverage: locale=context.globals.locale, viewport=toolbar; decision: REUSE (no new Story, no new export); target: the three existing Stories; rationale: every state already renders there (sold and rented grid cards exist, the banner Story maps all six non-active statuses at :23).`

**GR-7.** No reference audit is run for this revision, and no reference-based claim is made. The revision does not
choose a UI pattern. It keeps the overlay look the owner accepted on 2026-09-30, and its two visible changes are the
owner's direct choices D46-1 and D46-2. If the owner requires the audit anyway, this revision is not executable until
it is done.

**Out of scope, recorded:**
- `ListingCard.module.css` `.inlineFavorite` / `.overlayFavorite` keep their pre-existing `design-tokens-allow`
  literals. They are favourite-button chrome, not the sold/rented elements §16.1 names, and `FavoriteButton` takes
  only `className`, so a canonical replacement needs an API change. The Story reuses them unchanged.
- The admin status maps stay with the admin migration (owner, 2026-09-17, §16.3).
- `ListingDetailView.tsx:438` `'blueLight'` is the staff preview banner, not a listing status.

### 17.4 Requirements

| ID | Observable requirement | P |
|---|---|---|
| **R30** | `ListingCard.tsx` `getBadges` takes the sold, rented, archived and expired colours from `LISTING_STATUS_COLOR`. `ListingStatusBanner.tsx` deletes `COLORS` and passes `color={LISTING_STATUS_COLOR[status]}`. `inactive` is therefore `gray` (D46-1). The comments that describe the old copies (`ListingStatusBanner.tsx:21-26`, `listingStatusTone.ts:15-19`, `ListingCard.tsx:57-69` where it names the mapping) are updated to say there is one source. | P0 |
| **R31** | The overlay label keeps today's computed look except the radius. It is the same `Box component="span"` with the §17.3 style props and `bd`, and `cn(styles.overlayLabel, tone class, overlay.className)` is still merged on it. `.overlayLabel` contains only `rotate: -8deg`. `.overlaySold`/`.overlayRented` keep only their background tiers. `theme.ts` gains `other.borderWidth.statusOverlay` (value + type + a comment naming Task 741 Revision 3). `overlay` without `tone` keeps today's render: the border colour is `currentColor`, so `bd` falls back to it (`OVERLAY_TONE_BORDER[tone] ?? 'currentColor'`), and the label has no background. | P0 |
| **R32** | The scrim is Mantine `Overlay` with `color="var(--overlay)" backgroundOpacity={0.3} zIndex="auto" center`, replacing `Center` + `.overlayCenter`. `.overlayCenter` and its `@supports` block are deleted. The badges, favourite and photo count paint in the same order as before. | P0 |
| **R33** | `ListingCardPattern.stories.tsx`: the three Tailwind sites are replaced as in §17.3. The Story's `blueLight`/`purple`/`gray` status literals in `DemoCard` (`:152,156,159`) read `LISTING_STATUS_COLOR`. The `consumer-overlay-hook` play test is unchanged and green. No `style` object, no fixed width and no viewport pin are added (GR-3b). | P0 |
| **R34** | Smoke tests, red on the pre-change tree first. `MantineListingCardPattern.smoke.test.tsx`: (a) with `tone: 'sold'`, the label's inline `border` contains `0.125rem solid var(--status-info)`; (b) the scrim element carries Mantine's Overlay root class and `--overlay-z-index: auto`; (c) the `className` pass-through test (`:110-117`) stays green. `ListingCard.smoke.test.tsx:217-229` stays green unchanged. | P0 |
| **R35** | `ListingCard.tsx:188` and `:278` lose `style={{ whiteSpace: 'nowrap' }}` and use `miw="max-content"`. | P1 |

### 17.5 Flows

**Positive.** A sold card, in both Storybook pages and on `/listings`, looks as the owner accepted it on 2026-09-30: a
blue filled top-left badge and a blue rotated centred label at 80% over a black 30% scrim. The only change is that the
label's corners are 16px instead of 18px. A rented card does the same in purple. The listing-page banner keeps its
colour for five statuses, and `inactive` turns gray.

| Negative flow | Applicable | Expected |
|---|---|---|
| Active / new / price-reduced card | Yes | no overlay; badges unchanged |
| Archived / expired card | Yes | badge only (`gray` / `yellow`), no overlay |
| List layout | Yes | badge only; no overlay (pattern `:165`); date stays on one line |
| `overlay.className` without `tone` | Yes | the class is still merged; the label has no tone background and a `currentColor` border, as today |
| Long `uk` / `sq` label at 320px | Yes | the label stays inside the photo; owner matrix |
| Footer date in a narrow card (320) | Yes | the date does not wrap, as today |
| Stacking | Yes | scrim `z-index: auto`; favourite and badges paint as before (probe + owner matrix) |
| Detail banner, five unchanged statuses | Yes | computed background unchanged |

### 17.6 Acceptance criteria

`GR-4 AC AUDIT — 6 criteria; each states an observable property; absolutes: the empty greps are the defined end state of deleting named hardcode and copies.`

- **AC30 [R30].** `git grep -n -E "'(blueLight|purple)'" -- src/modules/listings/components/ListingCard.tsx src/modules/listings/components/ListingStatusBanner.tsx src/stories/patterns/mantine/ListingCardPattern.stories.tsx`
  prints nothing, and `git grep -n "COLORS" -- src/modules/listings/components/ListingStatusBanner.tsx` prints nothing.
- **AC31 [R31, R32].** `git grep -n -E "overlayCenter|design-tokens-allow" -- src/design-system/mantine/patterns/MantineListingCardPattern.module.css`
  shows no `overlayCenter` line and no marker between `.overlayLabel {` and the end of the file. `.overlayLabel` holds only
  `rotate`. `check:design-tokens:strict` exits 0.
- **AC32 [R31, R32] — preservation probe.** The probe (in the evidence folder, not a gate) runs on two Storybook builds:
  BEFORE, built at I0 before any write, and AFTER. It covers `en`, at 1440 and 320, the sold and rented grid cards of
  `mantine-primitives-listingcard--default` and `patterns-mantine-listingcardpattern--default`. For each label it
  records `background-color`, `border-*-width/style/color`, `color`, `font-size`, `font-weight`, `line-height`,
  `padding-*`, `rotate` and `border-*-radius`. For each scrim it records `background-color` and `z-index`, plus the
  `document.elementFromPoint` hit at the centre of the favourite button. Expected: every value is equal before and
  after, except `border-*-radius` (18px → 16px, D46-2). `line-height` goes from 20px to `lh="sm"`'s computed value (14 × 1.43 = 20.02px); record both. The
  scrim colour may change only in its `color-mix` spelling and must resolve to the same rgba. Retain both JSON files
  and a diff.
- **AC33 [R30].** On `mantine-primitives-listingstatusbanner--*`, the `Alert` computed background for `sold`,
  `rented`, `archived`, `expired` and `pending` is equal before and after. `inactive` changes from the yellow tone to
  the gray tone. Record the values in the AC32 JSON.
- **AC34 [R33].** `git grep -n "className=" -- src/stories/patterns/mantine/ListingCardPattern.stories.tsx` shows only
  `consumer-overlay-hook` and the two `ListingCard.module.css` classes, and no Tailwind utility. `check:stories`,
  `check:story-coverage` and `governance:tailwind` exit 0.
- **AC35 [R34, R35].** The R34 assertions are red on the pre-change tree (`01_red.txt`, non-zero exit) and green after.
  Every command in the §17.7 gate block ends `EXIT_CODE=0`, except `governance:tailwind`. That gate is red at HEAD
  and is retired by Task 897. It is judged by the clause as corrected in §17.12 F27: no finding sits on a line this
  diff adds or changes, and its HIGH set equals HEAD's, with line numbers shifted only by the diff.

### 17.7 Verification plan

**I0, before any write.**
1. `git --no-optional-locks status --porcelain`, plus `git hash-object` of every file in §17.8.
2. Both §17.3 censuses.
3. `npm.cmd run build-storybook`. Copy `storybook-static` to `$env:TEMP\task741r3-before-sb`, which is outside the
   repo, because only `storybook-static` is git-ignored. Run the AC32 probe against that copy. Retain only the probe
   JSON, `docs/sessions/evidence/task741r3/probe-before.json`, never the build.
4. Write the R34 assertions and retain the red run.

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p process.platform
node.exe --version
npx.cmd vitest run src/modules/listings/components/__tests__/ListingCard.smoke.test.tsx src/design-system/mantine/patterns/__tests__/MantineListingCardPattern.smoke.test.tsx src/modules/listings/lib/__tests__/listingStatusTone.test.ts
npm.cmd run check:stories
npm.cmd run check:story-coverage
npm.cmd run check:design-tokens:strict
npm.cmd run governance:tailwind
npm.cmd run build-storybook
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
git --no-optional-locks grep -n -E "'(blueLight|purple)'" -- src/modules/listings/components/ListingCard.tsx src/modules/listings/components/ListingStatusBanner.tsx src/stories/patterns/mantine/ListingCardPattern.stories.tsx
git --no-optional-locks grep -n "overlayCenter" -- src
git --no-optional-locks hash-object src/design-system/mantine/theme.ts src/design-system/mantine/patterns/MantineListingCardPattern.tsx src/design-system/mantine/patterns/MantineListingCardPattern.module.css src/modules/listings/components/ListingCard.tsx src/modules/listings/components/ListingStatusBanner.tsx src/modules/listings/lib/listingStatusTone.ts src/stories/patterns/mantine/ListingCardPattern.stories.tsx src/design-system/mantine/patterns/__tests__/MantineListingCardPattern.smoke.test.tsx
git --no-optional-locks status --porcelain
```

Expected: exit 0 for every command, except that the two `git grep` lines exit 1 with no output. Give each command its
own unpiped transcript ending `EXIT_CODE=`. Read every file through Node or with `-Encoding utf8`, and include the
`hash-object` line in the same pass (procedures, corollaries 818/819).

**Story receipts.** Give one receipt per matrix Story:
- **GR-3b, GR-3c, GR-3d** at 320/390/1024/1440 (GR-3c also at 768);
- **GR-3e** n/a: no popup;
- **GR-3f** n/a: no circle changes;
- **GR-3g**: the label is centred and touches no clipping corner. Record the probe, and add a 10× crop if it does touch
  one.

GR-3d lines:
- `Patterns/Mantine/ListingCardPattern`: profile `StoryPageGutter` (`ListingCardPattern.stories.tsx:212`), all four
  sides, unchanged;
- `Mantine/Primitives/ListingCard` and `Mantine/Primitives/ListingStatusBanner`: `n/a: MantineStoryShell primitive`.

Type scale (GR-3c): the overlay label is 14px at base/sm/md/lg (`fz="sm"`). The date is 12px (`size="xs"`). The
section titles of both card Stories are `TITLE_FZ.h4`: 18px at base, 20px at sm and 24px from md. Corrected by
review 1 (§17.11 F25); the earlier text said "no text reaches 24px".

### 17.8 Files in scope

- `src/design-system/mantine/theme.ts`
- `src/design-system/mantine/patterns/MantineListingCardPattern.tsx`
- `src/design-system/mantine/patterns/MantineListingCardPattern.module.css`
- `src/design-system/mantine/patterns/__tests__/MantineListingCardPattern.smoke.test.tsx`
- `src/modules/listings/components/ListingCard.tsx`
- `src/modules/listings/components/ListingStatusBanner.tsx`
- `src/modules/listings/lib/listingStatusTone.ts` (comment only)
- `src/stories/patterns/mantine/ListingCardPattern.stories.tsx`
- `src/stories/mantine/primitives/ListingCard.stories.tsx` (added by review 1, §17.11 F25: the two `Title`s only)
- `docs/sessions/<date>-task741r3-closed-status-hardcode-exit.md`
- `docs/backlog.md` (the 741 state only)

Do not edit anything else. If a gate needs another file, stop and report it.

### 17.9 Owner visual review — `OWNER VISUAL QA REQUIRED` (O46-1)

| Story | Toolbar viewports | Locales | Owner checks |
|---|---|---|---|
| `Mantine/Primitives/ListingCard` → `Default` | 320, 768, 1440 | en, uk | sold/rented: same look as accepted on 2026-09-30, label corners 16px |
| `Patterns/Mantine/ListingCardPattern` → `Default` | 320, 768, 1440 | en, uk | the same as the page above; footer date on one line; favourite chrome unchanged |
| `Mantine/Primitives/ListingStatusBanner` | 1440 | en | five colours unchanged; `inactive` gray (D46-1) |
| production `/uk/listings` after deploy | desktop + mobile | uk | a sold/rented card matches Storybook |

### 17.10 Completion

Write `docs/sessions/<date>-task741r3-closed-status-hardcode-exit.md`. It contains:
- the §17.1 facts as re-measured at I0;
- R30–R35 with their evidence paths;
- the red and green transcripts;
- the BEFORE/AFTER probe JSON and its diff;
- the gate block;
- the GR receipts;
- a `Files Changed` table.

Set the 741 state in `docs/backlog.md`. Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`
or `BLOCKED`. No self-approval, no git.

### 17.11 Review 1 of Revision 3, 2026-10-04 — `NEEDS REVISION` (one Story fix; one AC corrected)

**Inspected:**
- the real diff of the 8 §17.8 source files;
- the session log `docs/sessions/2026-10-04-task741r3-closed-status-hardcode-exit.md`;
- `probe-diff.txt` (only the D46-1 / D46-2 / `lh="sm"` / scrim-spelling deltas);
- freshness: the last source write was 07:00:38. `storybook-static` was built at 07:03:29, the probe ran at 07:05 and
  `.next` was built at 07:09.

**The reviewer re-ran** `vitest` on the three files (`win32`, Node v22.22.3): 33/33, exit 0. R30–R35 match §17.3 in
source.

| # | Severity | Finding | Correction (binding) |
|---|---|---|---|
| F25 | **P2**, GR-3c | `Mantine/Primitives/ListingCard` is in the O46-1 matrix (§17.9). Its section titles `src/stories/mantine/primitives/ListingCard.stories.tsx:119` and `:128` are `Title order={4}` with no `fz`, so they render 24px at every width, 320 included. The executor measured this (session log §5) but did not fix it. §17.7's "No text reaches 24px" was an orchestrator error: it did not check this Story. 886 recorded the same two lines as out of scope (886 §16.2) because they were not in its matrix. Here they are. | Add `fz={TITLE_FZ.h4}` to both `Title`s, importing `TITLE_FZ` from `@/design-system/mantine/typography`, as `ListingCardPattern.stories.tsx:218/240` already do. This file is added to §17.8. |
| F26 | **P2**, orchestrator kickoff defect (GR-4) | §17.7/AC35 required `governance:tailwind` to exit 0. The gate is red at HEAD: H15 vs baseline H10. The reviewer counted the T6 palette lines in `theme.ts` / `MantineDashboardStatCard.tsx` / `MantineDataTableToCards.tsx`: 10 / 4 / 1 at HEAD and the same in the tree. This diff adds no palette class. Retiring the gate, `governance-pr.yml:101` included, is **Task 897**'s scope (897 F7, F11, R-list). The absolute exit-0 clause was unsatisfiable when written. | AC35's gate clause is replaced: **`governance:tailwind` lists no file this task changes, and its HIGH set is unchanged from HEAD.** Its exit code belongs to 897. `GR-2 SCOPE STATED — governance:tailwind inspects className palette strings repo-wide; it cannot attribute a pre-existing HEAD finding to this diff; the criterion is closed by the per-file HEAD/tree T6 counts and the absence of any §17.8 path in its output.` |

**Note, not a finding.** R34 does not prove the "no `tone` → `currentColor`" border in a browser, because no Story or
production consumer renders an overlay without `tone`. The jsdom assertion is accepted, and that branch's behaviour
is the CSS default.

**Re-entry: remediation.** Do not touch the eight §17.8 source files or the BEFORE/AFTER probe artifacts. Do this:
1. Make the F25 edit.
2. `npm.cmd run build-storybook`.
3. Measure `mantine-primitives-listingcard--default` at 320/390/768/1440 with `getComputedStyle` on both `Title`s.
   Expected: 18 / 18 / 24 / 24px, which is `TITLE_FZ.h4` (h6 / h5 at sm / h4 at md).
4. Emit its GR-3b, GR-3c and GR-3d receipts. For GR-3d it is `n/a: MantineStoryShell primitive`.
5. Run this block, with one transcript per command under `docs/sessions/evidence/task741r3/rev3a/`:

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p process.platform
npm.cmd run check:stories
npm.cmd run check:story-coverage
npm.cmd run check:design-tokens:strict
npm.cmd run governance:tailwind
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
git --no-optional-locks hash-object src/stories/mantine/primitives/ListingCard.stories.tsx src/design-system/mantine/theme.ts src/design-system/mantine/patterns/MantineListingCardPattern.tsx src/design-system/mantine/patterns/MantineListingCardPattern.module.css src/modules/listings/components/ListingCard.tsx src/modules/listings/components/ListingStatusBanner.tsx src/modules/listings/lib/listingStatusTone.ts src/stories/patterns/mantine/ListingCardPattern.stories.tsx src/design-system/mantine/patterns/__tests__/MantineListingCardPattern.smoke.test.tsx
```

Expected:
- `governance:tailwind` is judged by F26's corrected clause. Its output lists no §17.8 path, and HIGH stays at 15.
- Every other command exits 0.
- The eight earlier hashes equal the ones in `19_greps_hashes.txt`.

Append `## Revision 3a` to the session log. It contains the Files Changed row, the receipts and the transcripts.
Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. The owner matrix O46-1 (§17.9) is handed over only after the
review of 3a.

### 17.12 Review 2 (Revision 3a), 2026-10-04 — `PARTIALLY VERIFIED` (executor work complete; owner matrix O46-1 open)

**Inspected:**
- the F25 diff (`ListingCard.stories.tsx`, hash `b1fc2c65…`);
- every transcript in `docs/sessions/evidence/task741r3/rev3a/`;
- the session log's `## Revision 3a`;
- the theme.ts diff against `governance:tailwind`'s finding lines.

The eight earlier hashes still equal `19_greps_hashes.txt`. Freshness holds: the source was written at 07:13:58, `storybook-static` at 07:14 and `.next` at 07:16. R30–R35 stand as reviewed in §17.11. All executor-side criteria are verified. The only open criterion is the owner visual matrix O46-1 (§17.9), which is `NOT VERIFIABLE` until the owner returns it.

| # | Severity | Finding | Disposition |
|---|---|---|---|
| F27 | **P2**, orchestrator kickoff defect (GR-4) | F26's clause, "lists no file this task changes", could not be satisfied. `theme.ts` is a §17.8 file, and 9 of the gate's HIGH lines are pre-existing **comment** lines in it (tree `:974, :998, :1145, :1395, :1420, :1421, :1616, :1631, :1632` = HEAD `:971 … :1629`). They moved by +3 because the diff adds lines `:79-81` and `:770`, which carry no palette class. F26 also miscounted `theme.ts` as 10; the real count is 9. The HIGH set is 15: `theme.ts` 9, `MantineDashboardStatCard.tsx` 5, `MantineDataTableToCards.tsx` 1. | **Corrected.** AC35's gate clause now reads: *no `governance:tailwind` finding sits on a line this diff adds or changes, and its HIGH set equals HEAD's, with line numbers shifted only by the diff.* That is **VERIFIED** (diff hunks against `rev3a/13_governance-tailwind.txt`). The gate's exit code belongs to **897**. |
| F28 | **P3**, evidence hygiene | `rev3a/17_file-integrity.txt` and `18_mojibake.txt` held only `EXIT_CODE=0`. The mojibake output was written to a stray `docs/sessions/evidence/task741r3/rev3a$n.txt` (the PowerShell `$n` was expanded in the path), and the file-integrity output was lost. The executor's GR-3b/GR-3c lines also leave out the receipt's per-width values and 1024. | The reviewer re-ran both checks natively (`win32`, v22.22.3): `rev3a/review2-17_file-integrity.txt` (110 files, exit 0) and `rev3a/review2-18_mojibake.txt` (exit 0). The stray file is deleted. The reviewer receipts below replace the executor's abbreviated ones. |

**Reviewer measurement**: `rev3a/review2-probe.mjs` → `rev3a/review2-probe.json`, on the 07:14 `storybook-static`, `en`, DPR 1.

`GR-3b STORY RESPONSIVE CHECK — mantine-primitives-listingcard--default: 320 fluid in MantineStoryShell · 390 · 1024 · 1440 fluid; overflow: none; fixed-width containers: NONE; style objects: NONE; viewport pins: NONE; side-by-side sections below 640: NONE.`
`GR-3b STORY RESPONSIVE CHECK — patterns-mantine-listingcardpattern--default: 320/390/1024/1440 fluid in StoryPageGutter; overflow: none; fixed-width containers: NONE; style objects: NONE; viewport pins: NONE; side-by-side sections below 640: NONE.`
`GR-3b STORY RESPONSIVE CHECK — mantine-primitives-listingstatusbanner--default: 320/390/1024/1440 fluid; overflow: none; fixed-width containers: NONE; style objects: NONE; viewport pins: NONE; side-by-side sections below 640: NONE.`
`GR-3c TYPE RESPONSIVE CHECK — mantine-primitives-listingcard--default: section Title 320 18px · 390 18px · 768 24px · 1440 24px; card h3 14px at all four; overlay label 14px at all four; ≥24px text without a responsive step: NONE; heading above 20px below 640 (non-hero): NONE; child heading larger than page title: NONE.`
`GR-3c TYPE RESPONSIVE CHECK — patterns-mantine-listingcardpattern--default: section Title 320 18px · 390 18px · 768 24px · 1440 24px; card h3 14px; overlay label 14px; ≥24px text without a responsive step: NONE; heading above 20px below 640 (non-hero): NONE; child heading larger than page title: NONE.`
`GR-3c TYPE RESPONSIVE CHECK — mantine-primitives-listingstatusbanner--default: body 14px, link 12px at all four; max 16px; ≥24px text without a responsive step: NONE; heading above 20px below 640 (non-hero): NONE; child heading larger than page title: NONE.`
`GR-3d STORY GUTTER CHECK — mantine-primitives-listingcard--default: gutter n/a: MantineStoryShell primitive; top/right/bottom/left 320 16/16/16/16 · 390 16/16/16/16 · 1024 49/49/172/49 · 1440 49/49/68/49 (the shell frame, known exception; Task 909 D87-2 owns it); side at 0: NONE; doubled gutter: NONE; gutter written in the Story: NONE.`
`GR-3d STORY GUTTER CHECK — patterns-mantine-listingcardpattern--default: gutter StoryPageGutter all; top/right/bottom/left 320 24/16/24/16 · 390 24/16/24/16 · 1024 24/32/24/32 · 1440 24/32/24/32 (expected 24 / 16·16·32·32); side at 0: NONE; doubled gutter: NONE; gutter written in the Story: NONE.`
`GR-3d STORY GUTTER CHECK — mantine-primitives-listingstatusbanner--default: gutter n/a: MantineStoryShell primitive; top/right/bottom/left 320 16/16/40/16 · 390 16/16/44/16 · 1024 49/49/131/49 · 1440 49/49/131/49; side at 0: NONE; doubled gutter: NONE; gutter written in the Story: NONE.`
`GR-3e TEXT BUTTONS STACKED — all three: n/a, no popup.` `GR-3f CIRCLE CHECK — n/a: no circular element changed.`
`GR-3g CORNER CHECK — overlay label (sold, rented): clipping ancestor = card photo frame; corners meeting it: none (the label is centred, for example 125–195px inside a 288px photo at 320); line cut at a corner: NONE.`

The label renders 14px, 16px radius (D46-2), `2px solid` `--status-info` / `--status-rented`, and the 80% tone background at every width. That matches the AC32 probe.

**Next step: the owner returns matrix O46-1 (§17.9).** If every row is accepted, the next review approves and archives 741. A returned row reopens this section as Revision 3b. No executor action is open.

## 18. Revision 3b — every card status in the card Stories; no list layout below 640 (owner matrix O46-1 returned, 2026-10-04)

Sprint 46 · P1 · QA profile **Q4**. **This section is the only executable route.** §17's R30–R35 are implemented and
reviewed (§17.11, §17.12). Do not touch them except where this section names a file. Re-entry mode: **remediation**,
which starts at §18.7 I0. Evidence goes to `docs/sessions/evidence/task741r3/rev3b/`.

### 18.1 Owner return and decisions, verbatim

O46-1 (§17.9), returned 2026-10-04:
- Row 1, `Mantine/Primitives/ListingCard`: **returned.** *"твоє рев'ю повне лайно. Де картки зі всіма статцсами? Це ж
  примітив, база блядь!"*
- Row 2, `Patterns/Mantine/ListingCardPattern`: **returned.** *"List Layout ми не використовуємо на екранах меньше
  640px. Нахуй ми його взагалі тримаємо?"*
- Row 3, `Mantine/Primitives/ListingStatusBanner`: **accepted.** *"єдине в цій задачі, що я приймаю."* D46-1 is closed,
  and this row is not re-checked.

Owner decisions, 2026-10-04:
- **D46-3** (list layout below 640), verbatim: *"якщо користувач переверне телефон у горизонтальне положення, обере List і
  потім переверне телефон у портретне положення - треба ховати перемикач List Layout(як у нас є), а також автоматично
  перемикати відображення оголошень у картковий режим, і якщо окристувач знову переверне телефон у горизонтальне
  положення, то фільтр має бути активний на картковому типі відображення."* Below 640 the toggle stays hidden and the
  view state switches to `grid`. Back at 640 or more, `grid` stays selected; the earlier List choice is **not** restored.
- **D46-4** (cards with status `inactive` / `pending`), option chosen verbatim: *"Add badges, from the map
  (Recommended)"*. `getBadges` labels them from `LISTING_STATUS_COLOR`: `inactive` gray, `pending` yellow.

**RETRACTION (orchestrator).**
- **Invalid prior claim:** §17.3's GR-3a receipt said *"every state already renders there"*, and §17.12 handed the
  matrix to the owner on that basis.
- **Why it was invalid:** R30 changed the archived and expired badge colours, and neither card Story rendered an
  archived or expired `ListingCard`. The primitive renders only active, sold and rented. No Story renders `inactive`,
  `pending`, price-reduced or no-image through the real `ListingCard`. The "New" badge has not rendered since
  2026-08-04, because `FIXTURE_CREATED_AT` is 2026-07-28 and `getBadges` compares it with the real `Date.now()`
  (`ListingCard.tsx:103-104`).
- **Evidence:** `src/stories/mantine/primitives/ListingCard.stories.tsx` `Default` (three grid cards and one list card);
  `ListingCard.tsx:80-112`.
- **Corrected status:** `FACT`. Both reviews passed a primitive Story that does not prove the component's states.

### 18.2 Verified context (orchestrator, 2026-10-04, working tree)

- **FACT.** `ListingStatus` = `active | inactive | sold | rented | archived | pending | expired`
  (`src/types/database.ts:43`). `getBadges` (`ListingCard.tsx:80-112`) handles each status as follows:
  - sold, rented, archived and expired each get a status badge and return early;
  - inactive and pending fall through to the active branch, so they show no status badge;
  - active can get `new` (green, created less than 7 days ago) and `price_reduced` (`sale`, when `price_old > price`).
  - Elsewhere in `ListingCard`:
    - `isPremium` (`:223`, `:313`) gives the premium styling;
    - `isArchived` (only `archived`, `listingSemanticLayer.ts:98`) gives the dimmed card;
    - sold and rented get the overlay;
    - `images: []` gives the `MediaPlaceholder`.
- **FACT.** `LISTING_STATUS_COLOR` has `inactive: 'gray'` and `pending: 'yellow'` (`listingStatusTone.ts:21-29`). The
  labels `listing.status_inactive` and `listing.status_pending` exist in all four locales: sq *Joaktiv* / *Nën shqyrtim*,
  en *Inactive* / *Under review*, uk *Неактивне* / *На модерації*, it *Non attivo* / *In revisione*.
- **FACT.** Favourites exclude only `archived` (`favoritesQueries.ts:58,79,124,161`), so inactive, pending and expired
  cards can reach `ListingCard`.
- **FACT.** The view state is `useState<'grid' | 'list'>('grid')` in `ListingsShell.tsx:81`. It is passed to
  `ListingsShellView` (`view`, `onViewChange`), and `ListingsShellView.tsx:127-160` renders the grid track or the
  `variant="horizontal"` stack. The toggle is `visibleFrom="sm"` (`ListingsSortBar.tsx:159-186`).
  - **Gap:** nothing resets `view` when the width drops below 640. A List choice made at 640 or more therefore still
    renders list cards in portrait.
- **FACT.** The repo already uses `useMatches({ base: true, sm: false })` in a View (`LightboxView.tsx:53`). `sm` is
  `40em` = 640px (`theme.ts:633`).
- **FACT.** The `Patterns/Mantine/ListingsShellView` Story keeps its own `useState('grid')` and passes `view` /
  `onViewChange` (`ListingsShellView.stories.tsx:51,67`). A reset placed **in the View** therefore runs in production
  and in that Story alike. `ListingsShell.tsx` is not changed.
- **FACT, GR-1 census** (`win32`, 2026-10-04), `check-surface-census.mjs --surface`:
  - `ListingCard.tsx`: 7 nodes, all tier1 migrated+enrolled+story, exit 0.
  - `ListingsShell.tsx`: 23 nodes, exit 1. Two nodes fail as `tier1-unenrolled-or-unstoried`:
    - `ListingsShell.tsx` (className 0). It is not changed here. It is baselined debt (`surface-census-baseline.json:229`), and its `next/dynamic` loading skeleton keeps it out of the container exemption.
    - `ListingsActionRow.tsx` (className 0, `story:yes` via `Patterns/Mantine/ListingsActionRow`, `manifest:no`). It is rendered by `ListingsShellView`, which this revision changes, so clause 16d puts it **in scope**: R38.

### 18.3 Canonical decision record (GR-0) and receipts

| Visible artifact | Today | Target | Disposition |
|---|---|---|---|
| `inactive` / `pending` card badge | none | the existing card badge (`MantineListingCardPattern` `badges`, `variant="filled"`), colour `LISTING_STATUS_COLOR[status]`, label `t('status_inactive')` / `t('status_pending')` | **REUSE** |
| View reset below 640 | none | `ListingsShellView`: `useMatches({ base: true, sm: false })` (precedent `LightboxView.tsx:53`) + `useEffect` calling `onViewChange('grid')` when below sm and `view === 'list'`. The render branch uses grid whenever below sm, so no list frame paints | **REUSE** Mantine hook |
| List section of both card Stories | rendered at every width | the section's `Stack` (title and cards) gets `visibleFrom="sm"`, mirroring `ListingsSortBar.tsx:162`, with a comment citing that line and D46-3 | **REUSE** Mantine prop |
| "New" badge in the primitive Story | stale wall-clock comparison | a Story-level `beforeEach` on the `Mantine/Primitives/ListingCard` meta pins `Date.now` to `FIXTURE_NOW_MS` (`Date.parse('2026-07-30T00:00:00.000Z')`) and restores the original in its returned cleanup. Production is unchanged | fixture only |

`GR-0 CANONICAL REUSE PREFLIGHT — request: inactive/pending card badges, list→grid reset below 640, every card state in the two card Stories; semantic queries: "getBadges", "LISTING_STATUS_COLOR", "status_inactive", "visibleFrom=\"sm\"", "useMatches", "view === 'list'"; inspected candidates: ListingCard.tsx:80-112, listingStatusTone.ts:21-29, ListingsSortBar.tsx:159-186, ListingsShellView.tsx:127-160, LightboxView.tsx:53, ListingCard.stories.tsx, ListingCardPattern.stories.tsx:139-251, ListingsShellView.stories.tsx:51-67; decision: REUSE; selected canonical owner: ListingCard getBadges + LISTING_STATUS_COLOR, ListingsShellView, Mantine useMatches/visibleFrom; Mantine/TailAdmin token path: theme colours gray/yellow via the existing filled card badge, theme breakpoint sm; new hardcoded visual values: NONE; rationale: both production changes are owner decisions D46-3/D46-4 expressed with existing sources.`

`GR-1 CENSUS COMPLETE — surface ListingCard.tsx 7 nodes; tier1 7 migrated+enrolled+story; tier2 0; tier3 0. Surface ListingsShellView.tsx (via ListingsShell.tsx census): tier1 ListingsActionRow enrolled in this task (R38); ListingsShell.tsx unchanged, baselined container debt with a loading skeleton, not exempt; tier2 0; tier3 0 listed and filed as none.`

`GR-3a STORY PREFLIGHT — ListingCard / MantineListingCardPattern / ListingsShellView × every status, list-below-640, view reset; canonical candidates: mantine-primitives-listingcard--default, patterns-mantine-listingcardpattern--default, patterns-mantine-listingsshellview--default; direct-import evidence: ListingCard.stories.tsx:4, ListingCardPattern.stories.tsx:9, ListingsShellView.stories.tsx:4; toolbar coverage: locale=context.globals.locale, viewport=toolbar; decision: EXTEND (the existing Default exports; no new Story, no new export); target: the three Default exports; rationale: each Story already imports the real component; the missing states are added there.`

**GR-7.** No reference audit is run, and no reference-based claim is made. Both production changes are the owner's
direct decisions, D46-3 and D46-4. The badge reuses the existing card badge chrome, and no layout, control or visual
value is chosen. If the owner requires the audit anyway, this revision is not executable until it is done.

### 18.4 Requirements

| ID | Observable requirement | P |
|---|---|---|
| **R36** | `getBadges`: `inactive` → `{ label: 'status_inactive', color: LISTING_STATUS_COLOR.inactive }`, `pending` → `{ label: 'status_pending', color: LISTING_STATUS_COLOR.pending }`. Each returns early, like the other non-active statuses, so neither gets `new` / `price_reduced`. Neither gets the overlay or `isArchived`. The comment above `getBadges` names D46-4. | P0 |
| **R37** | `ListingsShellView`: below `sm`, with `view === 'list'`, it calls `onViewChange('grid')` once and renders the grid track (never the horizontal stack). At `sm` or more it renders what `view` says. The View never calls `onViewChange('list')`. Nothing else in the View changes. | P0 |
| **R38** | `src/modules/listings/components/ListingsActionRow.tsx` is added to `scripts/mantine-migration-scope.json`. The entries it makes stale are removed: `surface-census-baseline.json` keys `…listings/page.tsx :: …ListingsActionRow.tsx :: tier1-unenrolled-or-unstoried` and `…ListingsShellView.tsx :: …ListingsActionRow.tsx :: tier1-unenrolled-or-unstoried`, plus `rendered-scope-baseline.json` key `…ListingsShellView.tsx -> …ListingsActionRow.tsx`. Remove only what the gates report as stale, and edit through Node, not a hand-typed `Get-Content`. | P0 |
| **R39** | `Mantine/Primitives/ListingCard` → `Default` renders the real `ListingCard` in every state below, in this order, first in the grid section and then in the list section. Each state gets its own fixture through `makeFixtureListing` options, and every visible string comes from `storyT`. The states: (1) active + New; (2) active, no badge (`created_at` 2026-07-01); (3) active + New + price reduced (`price_old` 92000); (4) premium; (5) inactive; (6) pending; (7) sold; (8) rented; (9) archived; (10) expired; (11) no image. The list section, with its title, has `visibleFrom="sm"`. The meta's `beforeEach` pins `Date.now` as in §18.3. `FavoritesComposition` is unchanged. No `style` object, fixed width or viewport pin is added. | P0 |
| **R40** | `Patterns/Mantine/ListingCardPattern` → `Default` renders the same eleven states in both sections. For new cards (New + reduced, inactive, pending, expired), `DemoCard` gains options. Badge labels come from `storyT(l, 'listing.status_*')` and colours from `LISTING_STATUS_COLOR`. The list section, with its title and its `Divider`, has `visibleFrom="sm"`. The existing play test (`consumer-overlay-hook`) stays green. | P0 |
| **R41** | Tests, red on the pre-change tree first: <ul><li>`ListingCard.smoke.test.tsx`: `inactive` renders one badge with text *Inactive* and the gray filled colour; `pending` renders *Under review* in yellow; neither renders *New*.</li><li>New file `src/modules/listings/components/__tests__/ListingsShellView.viewReset.test.tsx` (mock `matchMedia`). Below sm with `view="list"`, `onViewChange` is called with `'grid'` and no `.listing-card--horizontal` renders. At sm or more with `view="list"`, it is not called and the horizontal cards render. After the switch, a re-render at sm or more with `view="grid"` never calls `onViewChange('list')`.</li></ul> | P0 |

### 18.5 Flows

**Positive.** On a phone in landscape (≥640), the user picks List. Turning the phone to portrait hides the toggle and
shows the grid. Turning it back shows the toggle with Grid selected. An inactive favourite shows a gray *Inactive*
badge, and a pending one shows a yellow *Under review* badge.

| Negative flow | Applicable | Expected |
|---|---|---|
| Below 640 at mount, `view` = `grid` | Yes | no `onViewChange` call |
| `useMatches` initial render (returns `base` before its effect) on desktop | Yes | `view` is `grid` at mount, so no call. The test covers that a desktop `list` is not reset |
| ≥640, List chosen | Yes | list renders, as today |
| inactive / pending card with `price_old > price` or created < 7 days ago | Yes | status badge only |
| sold / rented / archived / expired | Yes | unchanged from Revision 3 |
| `ListingStatusBanner` | No | accepted O46-1 row 3; not touched |
| Long `uk` label (*На модерації*) at 320 | Yes | the badge stays inside the photo; owner matrix |

### 18.6 Acceptance criteria

`GR-4 AC AUDIT — 5 criteria; each states an observable property; absolutes: none.`

- **AC36 [R36, R41].** The R41 `ListingCard` assertions are red on the pre-change tree (`rev3b/01_red.txt`, exit not 0)
  and green after.
- **AC37 [R37, R41].** The R41 `ListingsShellView` assertions are red before (or the file fails because the behaviour
  is absent) and green after. In `patterns-mantine-listingsshellview--default`, a Playwright probe does: 1440 → click
  the `view_list` toggle → resize to 390 → read; then resize to 1440 → read. It records the following, in
  `rev3b/probe-viewreset.json`:
  - at 390: the count of `.listing-card--horizontal` = 0, and the toggle is not visible;
  - at 1440: the `view_grid` `ActionIcon` has the filled variant.
- **AC38 [R38].** `check:story-coverage`, `check:rendered-scope`, `check:rendered-scope:verify`,
  `check:surface-census:changed` and `check:surface-census:changed:verify` exit 0. `node.exe scripts\check-surface-census.mjs --surface src\modules\listings\components\ListingsShell.tsx`
  no longer lists `ListingsActionRow.tsx` as FAIL. `ListingsShell.tsx` itself stays as baselined debt.
- **AC39 [R39, R40].** On the rebuilt Storybook, a probe at 320, 390, 768 and 1440 (`en`, `uk`) records the
  following for each of the two card Stories, in `rev3b/probe-states.json`:
  - the badge texts per grid card, in order;
  - whether the list section is visible.

  Expected:
  - the grid shows eleven cards with the §18.4 badges: 1 *New*, 2 none, 3 *New* + *Price reduced*, 4 none (premium styling), 5 *Inactive*, 6 *Under review*, 7 *Sold* + overlay, 8 *Rented* + overlay, 9 *Archived* + dimmed card, 10 *Expired*, 11 none with the placeholder;
  - the list section is hidden at 320 and 390, and shows the same eleven at 768 and 1440 (no overlay);
  - the run is repeated on another calendar day, or with the system clock moved, and its badge texts are identical.
- **AC40 [all].** Every command in the §18.7 gate block ends `EXIT_CODE=0`, except `governance:tailwind`, which is
  judged by the AC35 clause (§17.12 F27).

### 18.7 Verification plan

**I0, before any write.**
1. `git --no-optional-locks status --porcelain`, plus `git hash-object` of every file in §18.8 → `rev3b/00_i0.txt`.
2. Re-run both §18.2 censuses and paste the node lists.
3. Write the R41 assertions and retain the red run (`rev3b/01_red.txt`).

**Gate block, after the writes.** One unpiped transcript per command under `rev3b/`, each ending `EXIT_CODE=`. Write
every transcript through Node or `Out-File -Encoding utf8`, never into a path that holds an unexpanded `$` (§17.12 F28).

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p process.platform
node.exe --version
npx.cmd vitest run src/modules/listings/components/__tests__/ListingCard.smoke.test.tsx src/modules/listings/components/__tests__/ListingsShellView.viewReset.test.tsx src/design-system/mantine/patterns/__tests__/MantineListingCardPattern.smoke.test.tsx src/modules/listings/lib/__tests__/listingStatusTone.test.ts
npm.cmd run check:stories
npm.cmd run check:story-coverage
npm.cmd run check:design-tokens:strict
npm.cmd run check:type-responsive
npm.cmd run check:rendered-scope
npm.cmd run check:rendered-scope:verify
npm.cmd run check:surface-census:changed
npm.cmd run check:surface-census:changed:verify
npm.cmd run governance:tailwind
npm.cmd run build-storybook
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
git --no-optional-locks hash-object src/modules/listings/components/ListingCard.tsx src/modules/listings/components/ListingsShellView.tsx src/stories/mantine/primitives/ListingCard.stories.tsx src/stories/patterns/mantine/ListingCardPattern.stories.tsx src/modules/listings/components/__tests__/ListingCard.smoke.test.tsx src/modules/listings/components/__tests__/ListingsShellView.viewReset.test.tsx scripts/mantine-migration-scope.json scripts/surface-census-baseline.json scripts/rendered-scope-baseline.json
git --no-optional-locks status --porcelain
```

Expected: exit 0 for every command except `governance:tailwind`, which is judged by AC35. The `build-storybook` must run
after the last source write, and the AC37 and AC39 probes run on that build.

**Story receipts**, one per matrix Story, before handoff:
- GR-3b at 320/390/1024/1440;
- GR-3c at 320/390/768/1440;
- GR-3d at 320/390/1024/1440, all four sides;
- GR-3e: n/a, no popup;
- GR-3f: n/a, no circle changes;
- GR-3g: the overlay label, as in §17.12.

GR-3d lines:
- `Mantine/Primitives/ListingCard`: `n/a: MantineStoryShell primitive`;
- `Patterns/Mantine/ListingCardPattern`: profile `StoryPageGutter` all (`ListingCardPattern.stories.tsx`), unchanged;
- `Patterns/Mantine/ListingsShellView`: profile `StoryPageGutter` all (`ListingsShellView.stories.tsx:55`), unchanged. Measure all four sides.

Type scale (GR-3c). No text size changes:

| Element | Role | base / sm / md / lg | Key | Provenance |
|---|---|---|---|---|
| Story section titles | section heading | 18 / 20 / 24 / 24 | `TITLE_FZ.h4` | `typography.ts:41` |
| Card title | card heading | 14 at all | pattern | unchanged |
| Card badge (incl. *Inactive*, *Under review*) | label | unchanged pattern badge size | pattern | `MantineListingCardPattern` |
| Overlay label | label | 14 at all | `fz="sm"` | §17.3 |

### 18.8 Files in scope

- `src/modules/listings/components/ListingCard.tsx` (R36: `getBadges` and its comment only)
- `src/modules/listings/components/ListingsShellView.tsx` (R37)
- `src/stories/mantine/primitives/ListingCard.stories.tsx` (R39)
- `src/stories/patterns/mantine/ListingCardPattern.stories.tsx` (R40)
- `src/modules/listings/components/__tests__/ListingCard.smoke.test.tsx` (R41)
- `src/modules/listings/components/__tests__/ListingsShellView.viewReset.test.tsx` (R41, new)
- `scripts/mantine-migration-scope.json`, `scripts/surface-census-baseline.json`, `scripts/rendered-scope-baseline.json` (R38)
- `docs/sessions/2026-10-04-task741r3-closed-status-hardcode-exit.md` (append `## Revision 3b`)
- `docs/backlog.md` (the 741 state only)

**Dirty worktree.** At design time, `scripts/mantine-migration-scope.json` and `scripts/surface-census-baseline.json`
already carry **Task 859** changes, which are uncommitted. Take their I0 hashes, and add only the R38 lines. In the
session log, list the R38 hunks by key so the review can separate them from 859's hunks. If either file has changed
between I0 and the write, stop and report it.

Do not edit anything else. If a gate needs another file, stop and report it.

### 18.9 Owner visual review — `OWNER VISUAL QA REQUIRED` (O46-2)

| Story | Toolbar viewports | Locales | Owner checks |
|---|---|---|---|
| `Mantine/Primitives/ListingCard` → `Default` | 320, 768, 1440 | en, uk | eleven cards, every status with its badge; sold/rented overlay as accepted on 2026-09-30, label corners 16px; list section absent at 320, present with the same eleven at 768/1440 |
| `Patterns/Mantine/ListingCardPattern` → `Default` | 320, 768, 1440 | en, uk | the same as the row above; footer date on one line; favourite chrome unchanged |
| `Patterns/Mantine/ListingsShellView` → `Default` | 1440 → 390 → 1440 | en | choose List at 1440; at 390 the grid shows and the toggle is hidden; back at 1440 Grid is selected (D46-3) |
| production `/uk/listings` and `/uk/favorites` after deploy | phone landscape → portrait → landscape; desktop | uk | the same as the row above; a sold/rented card matches Storybook |

### 18.10 Completion

Append `## Revision 3b` to the session log. It contains:
- the I0 status and hashes;
- the censuses;
- the red and green transcripts;
- the gate block;
- `probe-states.json` and `probe-viewreset.json`;
- the receipts;
- a `Files Changed` table.

Set the 741 state in `docs/backlog.md`. Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`
or `BLOCKED`. No self-approval, no git. The reviewer measures every matrix Story (GR-3b–3g) and audits each Story
against **every production state of the component** before the matrix reaches the owner.
