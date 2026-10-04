# Task 741 — Retire `CLOSED_OVERLAY_STYLE`'s Tailwind strings into `ListingCard.module.css`

> **Status: `NEEDS REVISION` — Revision 3c, 2026-10-04 (review 1 of Revision 3b, §18.11). The ONLY executable route
> is §18.11 at the end of this file**, on top of the implemented §18 (Revision 3b) and §17 (Revision 3/3a). §16
> (Revision 2) is kept for its owner quote (§16.1) and findings (§16.2) only. §1–§15 are the closed 2026-08-15
> migration, kept as history.

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

Sprint 46 · P1 · QA profile **Q4**. **Route history:** this section was the executable route for Revision 3b; the current one is §18.14. §17's R30–R35 are implemented and
reviewed (§17.11, §17.12). Do not touch them except where this section names a file. Re-entry mode: **remediation**,
which starts at §18.7 I0. Evidence goes to `docs/sessions/evidence/task741r3/rev3b/`.

### 18.1 Owner return and decisions, verbatim

O46-1 (§17.9), returned 2026-10-04:
- Row 1, `Mantine/Primitives/ListingCard`: **returned.** *"твоє рев'ю неприйнятне. Де картки зі всіма статцсами? Це ж
  примітив, база!"*
- Row 2, `Patterns/Mantine/ListingCardPattern`: **returned.** *"List Layout ми не використовуємо на екранах меньше
  640px. Навіщо ми його взагалі тримаємо?"*
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
- **Partly retracted in §18.11:** the "New" sentence above is wrong for Storybook. The states claim stands.

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
| "New" badge in the primitive Story | ~~stale wall-clock comparison~~ **withdrawn (§18.11):** `.storybook/preview-head.html:15-46` already freezes `Date.now` to 2026-07-30 for every Story | no Story-level pin | none |

`GR-0 CANONICAL REUSE PREFLIGHT — request: inactive/pending card badges, list→grid reset below 640, every card state in the two card Stories; semantic queries: "getBadges", "LISTING_STATUS_COLOR", "status_inactive", "visibleFrom=\"sm\"", "useMatches", "view === 'list'"; inspected candidates: ListingCard.tsx:80-112, listingStatusTone.ts:21-29, ListingsSortBar.tsx:159-186, ListingsShellView.tsx:127-160, LightboxView.tsx:53, ListingCard.stories.tsx, ListingCardPattern.stories.tsx:139-251, ListingsShellView.stories.tsx:51-67; decision: REUSE; selected canonical owner: ListingCard getBadges + LISTING_STATUS_COLOR, ListingsShellView, Mantine useMatches/visibleFrom; Mantine/TailAdmin token path: theme colours gray/yellow via the existing filled card badge, theme breakpoint sm; new hardcoded visual values: NONE; rationale: both production changes are owner decisions D46-3/D46-4 expressed with existing sources.`

`GR-1 CENSUS COMPLETE — surface ListingCard.tsx 7 nodes; tier1 7 migrated+enrolled+story; tier2 0; tier3 0. Surface ListingsShellView.tsx (via ListingsShell.tsx census): tier1 ListingsActionRow enrolled in this task (R38); ListingsShell.tsx unchanged, baselined container debt with a loading skeleton, not exempt; tier2 0; tier3 0 listed and filed as none.`

`GR-3a STORY PREFLIGHT — ListingCard / MantineListingCardPattern / ListingsShellView × every status, list-below-640, view reset; canonical candidates: mantine-primitives-listingcard--default, patterns-mantine-listingcardpattern--default, patterns-mantine-listingsshellview--default; direct-import evidence: ListingCard.stories.tsx:4, ListingCardPattern.stories.tsx:9, ListingsShellView.stories.tsx:4; toolbar coverage: locale=context.globals.locale, viewport=toolbar; decision: EXTEND (the existing Default exports; no new Story, no new export); target: the three Default exports; rationale: each Story already imports the real component; the missing states are added there.`

**GR-7.** ~~No reference audit is run.~~ Retracted in §18.12 (F32): GR-7 has no exemption. The reference research
for this revision is §18.12.2.

### 18.4 Requirements

| ID | Observable requirement | P |
|---|---|---|
| **R36** | `getBadges`: `inactive` → `{ label: 'status_inactive', color: LISTING_STATUS_COLOR.inactive }`, `pending` → `{ label: 'status_pending', color: LISTING_STATUS_COLOR.pending }`. Each returns early, like the other non-active statuses, so neither gets `new` / `price_reduced`. Neither gets the overlay or `isArchived`. The comment above `getBadges` names D46-4. | P0 |
| **R37** | `ListingsShellView`: below `sm`, with `view === 'list'`, it calls `onViewChange('grid')` once and renders the grid track (never the horizontal stack). At `sm` or more it renders what `view` says. The View never calls `onViewChange('list')`. Nothing else in the View changes. | P0 |
| **R38** | `src/modules/listings/components/ListingsActionRow.tsx` is added to `scripts/mantine-migration-scope.json`. The entries it makes stale are removed: `surface-census-baseline.json` keys `…listings/page.tsx :: …ListingsActionRow.tsx :: tier1-unenrolled-or-unstoried` and `…ListingsShellView.tsx :: …ListingsActionRow.tsx :: tier1-unenrolled-or-unstoried`, plus `rendered-scope-baseline.json` key `…ListingsShellView.tsx -> …ListingsActionRow.tsx`. Remove only what the gates report as stale, and edit through Node, not a hand-typed `Get-Content`. | P0 |
| **R39** | `Mantine/Primitives/ListingCard` → `Default` renders the real `ListingCard` in every state below, in this order, first in the grid section and then in the list section. Each state gets its own fixture through `makeFixtureListing` options, and every visible string comes from `storyT`. The states: (1) active + New; (2) active, no badge (`created_at` 2026-07-01); (3) active + New + price reduced (`price_old` 92000); (4) premium; (5) inactive; (6) pending; (7) sold; (8) rented; (9) archived; (10) expired; (11) no image. The list section, with its title, has `visibleFrom="sm"`. No `Date.now` pin (withdrawn, §18.11). `FavoritesComposition` is unchanged. No `style` object, fixed width or viewport pin is added. | P0 |
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

### 18.11 Review 1 of Revision 3b, 2026-10-04 — `NEEDS REVISION` → Revision 3c (one Story label fix, one test fix)

**Superseded as the route by §18.12.** R42 and R43 below are implemented and verified there. Original text: R36–R41 are implemented. Re-entry mode: **remediation**, on the
current working tree. Evidence goes to `docs/sessions/evidence/task741r3/rev3c/`. The `rev3b/` files are kept and are
not re-run, except where §18.11.4 says so.

**Inspected:** `ListingCard.tsx`, `ListingsShellView.tsx`, both card Stories, both test files (diff and source);
`scripts/mantine-migration-scope.json`, `surface-census-baseline.json` and `rendered-scope-baseline.json` (R38 hunks);
every `rev3b/final/*.txt`; `probe-viewreset.json`; `probe-states.json`; `verify-states.mjs`;
`.storybook/preview-head.html`; Mantine `use-media-query.mjs`; the session log's `## Revision 3b`. The reviewer re-ran,
natively (`win32`): the two R41 test files (27 passed, exit 0) and the `ListingsShell.tsx` census (only
`ListingsShell.tsx` FAILs, as baselined debt; `ListingsActionRow.tsx` is `manifest:yes story:yes`).

**Verified, kept as is:** R36, R37, R38, R39. The executor's deviations 2 to 5 (session log) are accepted. AC35's
`governance:tailwind` clause holds: the HIGH lines equal `rev3a/13_governance-tailwind.txt`.

#### 18.11.1 Findings

| # | Severity | Finding | Disposition |
|---|---|---|---|
| F29 | **P2** (R40, AC39) | **CONTRADICTION.** The report says both card Stories render the eleven states. In `uk`, the pattern Story's badges differ from production's for the same state, and its own probe recorded it (`rev3b/probe-states.json`, `A_real_clock`, `uk@1440`): primitive (production `getBadges` → `t(b.label)`) `Нове` · `Нове`+`Ціну знижено` · `Архів`; pattern `Нова` · `Нова`+`Ціна знижена` · `Архівовано`. `it` differs as well (`Nuovo` / `Nuova`). The cause is that `DemoCard` labels New, Price reduced and Archived from `storybook.mantine.card_badge_new` / `_reduced` / `_archived`, not from the `listing.*` keys production uses. For archived, that breaks R40 ("labels from `listing.status_*`"). `verify-states.mjs` compared badge text only for `en`, so it reported `AC39 OK`. | **R42**, **AC41** |
| F30 | **P3** (R41) | R41's third assertion is "after the switch, a re-render **at sm or more** with `view="grid"` never calls `onViewChange('list')`". Test 4 of `ListingsShellView.viewReset.test.tsx` re-renders while still **below** sm, so the viewport change is never exercised. The Playwright probe AC37 covers the real resize, so production behaviour is verified. The unit test does not test the stated case. | **R43** |
| F31 | NOTE, orchestrator kickoff defect | **RETRACTION (orchestrator).** **Invalid prior claim:** §18.1 said "The 'New' badge has not rendered since 2026-08-04, because … `getBadges` compares it with the real `Date.now()`", and §18.3 / R39 ordered a Story `Date.now` pin. **Why invalid:** `.storybook/preview-head.html:15-46` (Task 698) freezes `Date.now` and zero-argument `new Date()` to `2026-07-30T00:00:00.000Z` for every Story, so "New" rendered on the fixture all along. **Evidence:** `preview-head.html:38` (`if (prop === 'now')`); the executor's plant `rev3b/probe-states-plant.json` (pin removed, clock moved, "New" still rendered). **Corrected status:** `FACT`. The pin is withdrawn (§18.3, R39 amended). The rest of the §18.1 retraction stands: before 3b, no Story rendered archived, expired, inactive, pending, price-reduced or no-image through the real `ListingCard`. | Kickoff corrected; no executor action |

#### 18.11.2 Requirements

| ID | Observable requirement | P |
|---|---|---|
| **R42** | In `src/stories/patterns/mantine/ListingCardPattern.stories.tsx` `DemoCard`, every badge label uses the key production uses: New `storyT(l, 'listing.new')`, Price reduced `storyT(l, 'listing.price_reduced')`, Archived `storyT(l, 'listing.status_archived')`. The other badges are unchanged. No other line in the file changes. Do **not** edit `messages/*.json`, because they carry Task 859's uncommitted hunks. The `storybook.mantine.card_badge_*` keys stay; `ListingDetailPattern.stories.tsx` still uses two of them. If any gate fails because `card_badge_archived` is now unused, stop and report it. | P1 |
| **R43** | In `ListingsShellView.viewReset.test.tsx`, the `matchMedia` stub records each `change` listener that `addEventListener('change', cb)` receives. Test 4 then does the following: <ol><li>renders below sm with `view="list"` and asserts one call `onViewChange('grid')`;</li><li>sets the viewport to sm or more and fires every recorded listener with `{ matches: query.includes('min-width') }` inside `act()`;</li><li>re-renders with `view="grid"`;</li><li>asserts `onViewChange` was called exactly once in total, never with `'list'`, and that no `.listing-card--horizontal` renders.</li></ol> Mantine's `useMediaQuery` subscribes through `addEventListener('change', …)` and reads `event.matches` (`node_modules/@mantine/hooks/esm/use-media-query/use-media-query.mjs`). The other three tests are unchanged. | P2 |

#### 18.11.3 Acceptance criteria

`GR-4 AC AUDIT — 2 criteria; each states an observable property; absolutes: none.`

- **AC41 [R42].** `verify-states.mjs` is copied to `rev3c/verify-states.mjs` and extended. For every pass and every
  cell, the pattern Story's grid badge texts and list badge texts equal the primitive Story's for the same locale and
  width, card by card. The existing `en` checks stay. `rev3c/probe-states.mjs` (a copy of the 3b probe) adds `sq` and
  `it` at 1440. Expected: `rev3c/probe-states-verify.txt` ends `EXIT_CODE=0` with no failure lines. The red arm also
  runs: the extended verifier on the **old** `rev3b/probe-states.json` must exit 1 and name the `uk` cells
  (`rev3c/verify-red.txt`).
- **AC42 [R43].** Run once without the listener firing in step 2 (a temporary edit, then reverted), test 4 fails
  (`rev3c/r43-red.txt`, exit not 0). With the change, all four tests pass. The final file's `git hash-object` is
  recorded.

#### 18.11.4 Verification plan

**I0, before any write.** `git --no-optional-locks status --porcelain`, plus `git hash-object` of the two §18.11.2
files → `rev3c/00_i0.txt`. They must equal `rev3b/final/18_hashes.txt` (`4dc5a740…`, `7063470c…`). If either differs,
stop and report it.

**Gate block, after the writes.** One unpiped transcript per command under `rev3c/`, each ending `EXIT_CODE=`, written
through Node or `Out-File -Encoding utf8`, never into a path with an unexpanded `$`. Strip any BOM from the `rev3c/`
transcripts before `check:file-integrity`, as in 3b deviation 5.

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p process.platform
node.exe --version
npx.cmd vitest run src/modules/listings/components/__tests__/ListingCard.smoke.test.tsx src/modules/listings/components/__tests__/ListingsShellView.viewReset.test.tsx src/design-system/mantine/patterns/__tests__/MantineListingCardPattern.smoke.test.tsx src/modules/listings/lib/__tests__/listingStatusTone.test.ts
npm.cmd run check:stories
npm.cmd run check:story-coverage
npm.cmd run check:design-tokens:strict
npm.cmd run check:i18n
npm.cmd run build-storybook
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
git --no-optional-locks hash-object src/stories/patterns/mantine/ListingCardPattern.stories.tsx src/modules/listings/components/__tests__/ListingsShellView.viewReset.test.tsx src/stories/mantine/primitives/ListingCard.stories.tsx src/modules/listings/components/ListingCard.tsx src/modules/listings/components/ListingsShellView.tsx
git --no-optional-locks status --porcelain
```

Expected: exit 0 for every command. The last three hashes equal `rev3b/final/18_hashes.txt`. Then run the AC41 probe
and verifier on that `build-storybook` output.

**Story receipts**, for `patterns-mantine-listingcardpattern--default` only, because it is the one changed Story:
- GR-3b at 320/390/1024/1440;
- GR-3c at 320/390/768/1440;
- GR-3d at 320/390/1024/1440, all four sides (`StoryPageGutter all`);
- GR-3e: n/a, no popup;
- GR-3f: n/a;
- GR-3g as in §18.7.

Measure in `uk` at 320 as well: *Ціну знижено* next to *Нове* must stay inside the photo.

**GR-7.** ~~No reference audit is run.~~ Retracted in §18.12 (F32). The reference research is §18.12.2.

#### 18.11.5 Files in scope

- `src/stories/patterns/mantine/ListingCardPattern.stories.tsx` (R42: three label keys)
- `src/modules/listings/components/__tests__/ListingsShellView.viewReset.test.tsx` (R43: stub and test 4)
- `docs/sessions/evidence/task741r3/rev3c/` (new)
- `docs/sessions/2026-10-04-task741r3-closed-status-hardcode-exit.md` (append `## Revision 3c`)
- `docs/backlog.md` (the 741 state only)

Do not edit anything else. If a gate needs another file, stop and report it.

#### 18.11.6 Owner visual review — O46-2 (§18.9), unchanged

The matrix in §18.9 goes to the owner only after the next review measures every row's Story (GR-3b–3g). Production
`/uk/listings` and `/uk/favorites` need a deploy.

#### 18.11.7 Completion

Append `## Revision 3c` to the session log, with:
- the I0 status and hashes;
- the R43 red run and the AC41 red run;
- the gate block;
- `rev3c/probe-states.json` and `rev3c/probe-states-verify.txt`;
- the receipts;
- a `Files Changed` table.

Set the 741 state in `docs/backlog.md`: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or
`BLOCKED`. No self-approval, no git.

### 18.12 Review of Revision 3c, 2026-10-04 — `NEEDS REVISION` → Revision 3d (GR-7 receipt only; no source write)

**Superseded as the route by §18.14** (R44 implemented; its record is corrected there). Original text: re-entry mode: **remediation**, on the current working tree.
Evidence goes to `docs/sessions/evidence/task741r3/rev3d/`. Revision 3d writes **no** source, Story, test, script or
`messages/*.json` file.

**Inspected:** the R42 diff of `ListingCardPattern.stories.tsx`; `ListingsShellView.viewReset.test.tsx` in full;
`rev3c/00_i0.txt`, `r43-red.txt`, `r43-green.txt`, `verify-red.txt`, `probe-states-verify.txt`, `final/02`, `06`, `07`,
`10`, `13`; `research-exec/gr7-live.json`; the session log's `## Revision 3c`. **Re-run by the reviewer, natively
(`win32`, Node v22.22.3):** the four vitest files (39 passed, exit 0); both `check-surface-census.mjs` censuses;
`git hash-object` of the five 3c files (equal to `rev3c/final/13`); the matrix probe
(`rev3c/review/review-probe-s2.json`); GR-3g crops (`rev3c/review/gr3g-label-crop.json`, `gr3g-*-10x.png`); the GR-7
live check (`rev3c/review/gr7-live-check.json`, `live-00…11.png`). `storybook-static` (15:42) postdates the last
source write (15:41).

**Verified, kept as is:** R42 (New, Price reduced and Archived read `listing.new`, `listing.price_reduced`,
`listing.status_archived`; badge parity with the primitive holds in `en`/`uk` at 320/390/768/1440 and in `sq`/`it`
at 1440, and the red arm on the 3b JSON exits 1 naming `uk`) and R43 (red arm exit 1, green 4/4). The executor's
deviation 1 (one extra re-render step, without which AC42's red arm could not fail) and deviation 3 are accepted.

#### 18.12.1 Findings

| # | Severity | Finding | Disposition |
|---|---|---|---|
| F32 | **P2**, orchestrator kickoff defect | **RETRACTION (orchestrator).** **Invalid prior claim:** §18.3 and §18.11.4 said "No reference audit is run". **Why invalid:** GR-7 (owner, 2026-10-04) runs at every task creation, revision, execution and review with no exemption, and only the owner can narrow it. The kickoff therefore carried no task-creation receipt and no "Reference research (GR-7)" section. **Evidence:** `docs/golden-rules.md` GR-7 "When it runs" and "Sanctions"; the two retracted paragraphs. **Corrected status:** `FACT`. Both paragraphs now point here, and §18.12.2 is the section. | Kickoff corrected; §18.12.2 |
| F33 | **P2** (GR-7, execution) | Sonnet's Revision 3c GR-7 record (session log, `## Revision 3c`) opened six reference pages live and read library rows, which is the 2026-10-04 library procedure. It is not in the receipt format: there is no route inventory, no `unchanged` / `difference` per live page, no options with their pages, no chosen practice, and no lero.al data map. It also says "only these pages were opened". GR-7 makes a missing receipt `NEEDS REVISION`. | **R44**, **AC43** |
| F34 | NOTE | In `patterns-mantine-listingsshellview--default` at `uk@320`, the third status tab (*Продані та здані*) ends at 331px inside the status-tab `ScrollArea` (viewport right edge 304, `overflow-x: scroll`). The document does not overflow, and the partly visible tab is the scroll affordance. This is not a GR-3b or GR-3d defect, and Task 741 does not change the component. | No action |

#### 18.12.2 Reference research (GR-7)

The record is `docs/sessions/evidence/task741r3/rev3c/research-review/gr7-review.md`, made at review on 2026-10-04 by
Opus. It stands for this revision's task-creation receipt, which §18.3 and §18.11.4 omitted (F32).

| Reference | Enumerated / inspected / blocked (library) | Library rows for the subject | Live, 1440 + 390 | Live vs library |
|---|---|---|---|---|
| Lahomes | 106 / 106 / 0 | 008, 009, 049, 052 | `/property-grid.html`, `/property-list.html` | unchanged |
| Kamr | 62 / 62 / 0 | 005, 026, 031 | `/room` (signed in, `demo@example.com`) | difference: the live login works, but the library crawl recorded a failed login |
| Omah | 339 / 339 / 0 | 013, 019 | `/property-list.html` | unchanged |
| TailAdmin | 88 / 88 / 0 | 064, 068 | `/cards`, `/badge` | unchanged |

| Choice | Options ← pages | Shipped in 741 | Verdict |
|---|---|---|---|
| Status badge | a filled pill at the photo's top corner ← Lahomes 008 (13px/600, radius 4px), Omah 013 (11px/400, radius 4px) (corrected §18.14, F36); a tinted pill ← Kamr 005, TailAdmin 064/068 | a filled photo badge, one `LISTING_STATUS_COLOR` per status, labelled | matches both real-estate references; the label carries the state as well as the colour (WCAG 1.4.1) |
| Closed listing | strike-through price only ← Lahomes 008 | overlay label + badge | owner O83-1 (2026-09-30), D46-2 |
| Grid/list on a phone | an icon toggle beside the sort ← Omah 013; separate routes ← Lahomes 008/009 | a toggle beside the sort, hidden below 640, list→grid reset | owner D46-3 |
| Inactive / pending badge | no reference shows it | gray / yellow from the map | owner D46-4 |

lero.al data map:
- `ListingCard`: `listings.status` (7 values), `created_at`, `price` / `price_old`, `is_premium`, `images`. Favourites
  exclude only `archived`.
- `ListingsShellView`: client `view` state.

Owner decisions: D46-1…D46-4, O83-1.

`GR-7 REFERENCE RESEARCH — moment: review; role: Opus; task: 741 (Revision 3c); subject: listing-card status badges, sold/rented overlay label, grid/list toggle below 640; references: Lahomes, Kamr, Omah, TailAdmin + none; library: docs/research/references/2026-10-04; live-checked pages: Lahomes /property-grid.html → unchanged, /property-list.html → unchanged, Omah /property-list.html → unchanged, Kamr /room → difference (live login works), TailAdmin /cards → unchanged, /badge → unchanged; route inventory: Lahomes 106/106/0, Kamr 62/62/0, Omah 339/339/0, TailAdmin 88/88/0; inspected in depth: the six live pages at 1440 and 390 (gr7-review.md rows); workflow states operated: page load, Kamr sign-in, 1440→390; options across references: filled photo-corner pill ← Lahomes 008, Omah 013; tinted pill ← Kamr 005, TailAdmin 064/068; toggle beside sort ← Omah 013; separate routes ← Lahomes 008/009; chosen 2026 best practice: labelled filled photo-corner pill per status + owner D46-3 toggle, as shipped; absent or unverified: inactive/pending card badges, orientation reset (owner D46-4, D46-3); lero.al data map: ListingCard × listings.status/price/created_at, ListingsShellView × view; owner decisions: D46-1…D46-4, O83-1; evidence: docs/sessions/evidence/task741r3/rev3c/research-review/gr7-review.md.`

#### 18.12.3 Reviewer receipts for the O46-2 matrix Stories (`review-probe-s2.json`, DPR 1)

- `GR-0 CANONICAL REUSE PREFLIGHT — request: three pattern-Story badge labels; semantic queries: listing.new, listing.price_reduced, listing.status_archived, card_badge_*; inspected candidates: ListingCard.tsx getBadges, ListingCardPattern.stories.tsx DemoCard, ListingDetailPattern.stories.tsx; decision: REUSE; selected canonical owner: production listing.* keys; Mantine/TailAdmin token path: NONE (no visual value); new hardcoded visual values: NONE; rationale: the Story label equals production's label.`
- `GR-1 CENSUS COMPLETE — ListingCard.tsx 7 nodes; tier1 7 migrated+enrolled+story; tier2 0 imports removed; tier3 0 listed and filed as none. ListingsShell.tsx 23 nodes: FAIL only ListingsShell.tsx (baselined container debt); ListingsActionRow.tsx manifest:yes story:yes.`
- `GR-3b STORY RESPONSIVE CHECK — mantine-primitives-listingcard--default: 320 288/320 · 390 358/390 · 1024 926/1024 · 1440 1342/1440; patterns-mantine-listingcardpattern--default: 320 288/320 · 390 358/390 · 1024 960/1024 · 1440 1376/1440; patterns-mantine-listingsshellview--default: 320 288/320 · 390 358/390 · 1024 960/1024 · 1440 1376/1440; overflow: none; fixed-width containers: NONE; style objects: NONE; viewport pins: NONE; side-by-side sections below 640: NONE.`
- `GR-3c TYPE RESPONSIVE CHECK — listingcard and listingcardpattern: section Title 320 18px · 390 18px · 768 24px · 1440 24px, card h3 14px, overlay label 14px; listingsshellview: largest text 18px at every width, no Title; ≥24px text without a responsive step: NONE; heading above 20px below 640 (non-hero): NONE; child heading larger than page title: NONE.`
- `GR-3d STORY GUTTER CHECK — mantine-primitives-listingcard--default: n/a: MantineStoryShell primitive; 320 16/16/16/16 · 390 16/16/16/16 · 1024 49/49/49/49 · 1440 49/49/49/49. patterns-mantine-listingcardpattern--default: StoryPageGutter all; 320 24/16/24/16 · 390 24/16/24/16 · 1024 24/32/24/32 · 1440 24/32/24/32. patterns-mantine-listingsshellview--default: StoryPageGutter all; 320 45/16/24/16 · 390 45/16/24/16 · 1024 36/32/24/32 · 1440 36/32/24/32 (uk@320 right −11 is F34, inside the tab ScrollArea). Side at 0: NONE; doubled gutter: NONE; gutter written in the Story: NONE.`
- `GR-3e TEXT BUTTONS STACKED — all three: n/a, no popup.` `GR-3f CIRCLE CHECK — n/a: no circular element changed.`
- `GR-3g CORNER CHECK — sold/rented overlay label, both card Stories, uk@320 (widest, 105px and 133px): clipping ancestor = card root (radius 6px, border 1px, overflow hidden); corners meeting it: none (the label is at least 77px from every card corner); its radius 16px; DPR-1 corner crops docs/sessions/evidence/task741r3/rev3c/review/gr3g-*-uk320-10x.png; line cut at a corner: NONE.`
- `GR-8 TABLE ANATOMY — no table in scope.`

#### 18.12.4 Requirements

| ID | Observable requirement | P |
|---|---|---|
| **R44** | Sonnet performs the GR-7 execution audit for Revision 3c's subject and records it in the receipt format. Steps: <ol><li>Read the library rows that §18.12.2 names, in `docs/research/references/2026-10-04/summary.md` and the matching `audit-<ref>.json`.</li><li>In its own session, open live at 1440 and at 390 every page in §18.12.2's "Live" column, plus any library page its record relies on. Take a full-page screenshot, record the badge `getComputedStyle` values (font size and weight, radius, background), and list the view-toggle controls.</li><li>Record `unchanged` or the difference against the library row for each page.</li><li>Write `rev3d/research-exec/gr7-exec.md`, with one evidence row per page, the options with their pages, the chosen practice, and the lero.al data map.</li><li>Emit the full `GR-7 REFERENCE RESEARCH` receipt (moment: execution, role: Sonnet) in the session log.</li></ol> If the audit contradicts §18.12.2's chosen practice, stop with `BLOCKED — GR-7 KICKOFF CONFLICT` and name the pages. No other file is written. | P2 |

#### 18.12.5 Acceptance criteria

`GR-4 AC AUDIT — 1 criterion; it states an observable property; absolutes: none.`

- **AC43 [R44].** All of the following hold:
  - `rev3d/research-exec/gr7-exec.md` exists, with one row per live page at 1440 and at 390, and a screenshot path for each row;
  - the session log's `## Revision 3d` carries the receipt with every GR-7 field filled;
  - `git hash-object` of the five files in `rev3c/final/13_hashes.txt` equals that file, both at I0 and after the audit (`rev3d/00_i0.txt`, `rev3d/01_final_hashes.txt`). This also keeps the Revision 3c build, test and probe evidence current.

#### 18.12.6 Verification plan

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p process.platform
node.exe --version
git --no-optional-locks hash-object src/stories/patterns/mantine/ListingCardPattern.stories.tsx src/modules/listings/components/__tests__/ListingsShellView.viewReset.test.tsx src/stories/mantine/primitives/ListingCard.stories.tsx src/modules/listings/components/ListingCard.tsx src/modules/listings/components/ListingsShellView.tsx
git --no-optional-locks status --porcelain
```

Run this block at I0 (to `rev3d/00_i0.txt`) and again after the audit (to `rev3d/01_final_hashes.txt`). Each file ends
with `EXIT_CODE=`, written through Node or `Out-File -Encoding utf8`. Expected: `win32`, and the five hashes equal
`rev3c/final/13_hashes.txt` both times. If any hash differs, stop and report it. The audit script may be modelled on
`rev3c/review/gr7-live-check.mjs`. Save it under `rev3d/research-exec/`.

#### 18.12.7 Files in scope

- `docs/sessions/evidence/task741r3/rev3d/` (new)
- `docs/sessions/2026-10-04-task741r3-closed-status-hardcode-exit.md` (append `## Revision 3d`)
- `docs/backlog.md` (the 741 state only)

#### 18.12.8 Owner visual review — O46-2 (§18.9)

**Rows 1–2 were returned on 2026-10-04 and moved to Task 918 by D46-5 (§18.13); row 3 still awaits the owner.** Original text: this review measured every O46-2 Story (§18.12.3), and Revision 3d writes no Story. Rows 1–3 therefore go to the
owner now, in parallel with Revision 3d. Row 4 (production `/uk/listings` and `/uk/favorites`) needs a deploy.

#### 18.12.9 Completion

Append `## Revision 3d` to the session log, with:
- the I0 and final hashes;
- the receipt;
- the path of `gr7-exec.md`;
- a `Files Changed` table.

Set the 741 state in `docs/backlog.md`: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or
`BLOCKED`. No self-approval, no git.

### 18.13 Owner return of O46-2 rows 1–2, 2026-10-04 → owner D46-5: the grid/list card unification moves into Task 918

**§18.12 (Revision 3d, R44) was the executable route when this was written; it is now §18.14 (Revision 3d-1).** This subsection changes what 741 closes on;
it adds no executor step.

**Owner return, verbatim:**
- row 1, `Mantine/Primitives/ListingCard`: *"не приймаю, стилі карток не збігаються між видом картки та списку. Це хардкодне рішення! Мають бути канонічні і однакові стилі."*
- row 2, `Patterns/Mantine/ListingCardPattern`: *"аналогічна проблема як і в першому пункті."*
- row 3 (`ListingsShellView`) and row 4 (production) are not answered yet.

**Verified (Opus, `win32`, the final 3c `storybook-static`):** `MantineListingCardPattern.tsx` builds `layout="grid"` and
`layout="list"` as two separate markups. `docs/sessions/evidence/task741r3/rev3e/design/variant-diff.json` (1440, the
same listing in both layouts) shows:
- the type label and the location in two different greys, `rgb(71,84,103)` and `oklch(0.556 0 0)`;
- the location line height at 18px and 16px;
- per-m² at 10px/12px (70%) and 12px/18px;
- a different block order, badge stacking and photo-count corner;
- the overlay in grid only.

The pattern's CSS module also carries literal values: `#0009`, `.625rem`, `.75rem`, `8rem`, `11rem`, `3.40282e+38px`
and Task 734's 12 reserved hits. The owner's return is a `FACT`.

**Decision D46-5** (= Task 918's **D89-10**), 2026-10-04. The owner chose, verbatim, *"У 918, жорсткіше (Recommended)"*:
- Task 741 closes on what it delivered: R30–R44, the status badges, the overlay tokens and the list→grid reset.
- O46-2 rows 1–2 move into Task 918 as O89-1 and O89-3.
- 918 is amended with one source per part for both layouts, no literal visual value in either CSS module, one secondary
  colour, and a unit and rendered parity proof (918 kickoff §16).
- 741 is approvable after the review of Revision 3d and the owner's answer on O46-2 row 3. Row 4 needs a deploy and
  moves to O89-9.

**RETRACTION (orchestrator), 1 of 2.**
- **Invalid prior claim:** §18.12.3 and §18.12.8 handed O46-2 rows 1–3 to the owner as measured and ready.
- **Why invalid:** the GR-3b–3g receipts measure overflow, type scale, gutters and corners. None compares the grid card
  with the list card for the same state, and the two are separately hand-built, so the defect the owner saw went
  unmeasured.
- **Evidence:** `variant-diff.json`.
- **Corrected status:** `CONTRADICTION`. Rows 1–2 were not review-ready, and they move to 918 under D46-5.

**RETRACTION (orchestrator), 2 of 2.**
- **Invalid prior claim:** the AskUserQuestion text said *"Omah підтверджує ваше правило"*, so it rested the choice on one reference.
- **Why invalid:** GR-7 requires all four references, and the owner asked *"а ти тільки один референс перевіряв?"*.
- **Evidence:** the full audit is now `docs/sessions/evidence/task741r3/rev3e/design/gr7-design.md`. It covers 17 live pages across Lahomes, Kamr, Omah and TailAdmin, plus Rozetka (home and catalogue, both tile views, opened in headed Chrome after headless got HTTP 403).
- **Corrected status:** `FACT`. Omah's property list and Kamr's shop keep identical part styles. Omah's shop changes the price size. Lahomes switches to an admin table. TailAdmin has no pair. Rozetka keeps every part identical across its two tile views. The chosen practice (one card, one source per part) stands on three references and the owner's rule, not on one.

### 18.14 Review of Revision 3d, 2026-10-04 — `NEEDS REVISION` → Revision 3d-1 (correct the audit record; no source write)

**Folded into §18.15 (Revision 3e), which is the route; R45 below is executed there.** Re-entry mode: **remediation**. Evidence goes to
`docs/sessions/evidence/task741r3/rev3d/`, in new files only. No source, Story, test, script or `messages/*.json` file
is written.

**Inspected:**
- `rev3d/00_i0.txt` and `01_final_hashes.txt`: the five hashes equal `rev3c/final/13_hashes.txt` (`win32`);
- `rev3d/research-exec/gr7-exec.md`, `card-badges.json`, `card-badges2.json` and `exec-00-lahomes-1440.png`;
- the session log's `## Revision 3d`.

**Verified, kept:**
- AC43's hash clause.
- Rows 3–12 of `gr7-exec.md`.
- The Omah correction: Omah 013's on-photo pill is 11px/400, radius 4px, and **not** 13px/600. That error is the
  orchestrator's (§18.12.2) and is corrected there.

#### 18.14.1 Findings

| # | Severity | Finding | Disposition |
|---|---|---|---|
| F35 | **P2** (R44, AC43, GR-7 integrity) | **CONTRADICTION.** `gr7-exec.md` rows 1–2 and the session log's "Difference reported" say Lahomes `/property-grid.html` (008) "shows no status pill on its cards" and that "For Rent/For Sale are filter labels". The executor's own evidence disproves it. `card-badges2.json` → `lahomes-grid@1440` records `SPAN.badge bg-success text-white fs-13` "For Rent" and `SPAN.badge bg-danger text-white fs-13` "Sold", both `onPhoto: true`, 13px/600, radius 4px, padding 3px 6px, white on `rgb(92,193,132)` / `rgb(233,103,103)`. `exec-00-lahomes-1440.png` shows a filled *For Rent* / *Sold* / *For Sale* pill at the top-right of every card photo. The reviewer's live measurement agrees (`rev3c/review/gr7-live-check.json`: *For Rent* 13px/600, radius 4px, `rgb(92,193,132)`). The record then moves Lahomes out of "filled pill on the photo" in its options table and receipt. A GR-7 record must not state what its own evidence contradicts. | **R45**, **AC44** |
| F36 | NOTE, orchestrator | **RETRACTION (orchestrator).** **Invalid prior claim:** §18.12.2 gave "a filled pill at the photo's top corner (13px/600, radius 4px) ← Lahomes 008, Omah 013". **Why invalid:** the 13px/600 value is Lahomes 008's only. Omah 013's pill is 11px/400, radius 4px (`rev3d/research-exec/omah-badge.json`; `rev3c/review/gr7-live-check.json` Omah row: 11px/400, radius 4px, `rgb(59,76,184)`). **Corrected status:** `FACT`. §18.12.2's row now reads per page. The chosen practice is unchanged. | Kickoff corrected |

#### 18.14.2 Requirements

| ID | Observable requirement | P |
|---|---|---|
| **R45** | Correct the GR-7 execution record. Only these change: <ol><li>`gr7-exec.md` rows 1–2 (Lahomes 008 at 1440 and at 390) state the on-photo filled status pills with the values in `card-badges2.json`. Re-measure 390 and cite it. They also keep the strike-through and route-link facts.</li><li>The options table lists "filled pill on the photo ← Lahomes 008 (13px/600, r4), Omah 013 (11px/400, r4)" and "tinted labelled pill ← Lahomes 009, Kamr 005, TailAdmin 064/068".</li><li>The "Difference from the kickoff's attribution" section keeps only the Omah size correction and deletes the "Lahomes 008 shows no status pill" claim.</li><li>The session log gets `## Revision 3d-1`. It holds a `RETRACTION` (invalid claim, why invalid, evidence, corrected status) and a re-emitted, corrected `GR-7 REFERENCE RESEARCH` receipt (execution, Sonnet), whose options field matches item 2. The `## Revision 3d` text stays as written; 3d-1 supersedes it.</li></ol> Do not edit any other file under `rev3d/`. | P2 |

#### 18.14.3 Acceptance criteria

`GR-4 AC AUDIT — 1 criterion; it states an observable property; absolutes: none.`

- **AC44 [R45]** All of the following hold:
  - every Lahomes 008 row in `gr7-exec.md` names the on-photo badge with its measured values and the source file;
  - the session log's `## Revision 3d-1` carries the RETRACTION and the corrected receipt;
  - `git hash-object` of the five files in `rev3c/final/13_hashes.txt` equals that file, both at I0 and at the end (`rev3d/04_i0.txt`, `rev3d/05_final_hashes.txt`, each ending `EXIT_CODE=`);
  - `check:file-integrity` and `check:backlog-active` exit 0.

#### 18.14.4 Verification plan

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p process.platform
git --no-optional-locks hash-object src/stories/patterns/mantine/ListingCardPattern.stories.tsx src/modules/listings/components/__tests__/ListingsShellView.viewReset.test.tsx src/stories/mantine/primitives/ListingCard.stories.tsx src/modules/listings/components/ListingCard.tsx src/modules/listings/components/ListingsShellView.tsx
npm.cmd run check:file-integrity
npm.cmd run check:backlog-active
```

Run the block at I0 and at the end. Write the outputs through Node or `Out-File -Encoding utf8`. Expected: `win32`, the five
hashes equal `rev3c/final/13_hashes.txt`, and both checks exit 0.

#### 18.14.5 Files in scope

- `docs/sessions/evidence/task741r3/rev3d/research-exec/gr7-exec.md`
- `docs/sessions/evidence/task741r3/rev3d/04_i0.txt`, `05_final_hashes.txt` (new); a 390 re-measure script and JSON under `rev3d/research-exec/` (new)
- `docs/sessions/2026-10-04-task741r3-closed-status-hardcode-exit.md` (append `## Revision 3d-1`)
- `docs/backlog.md` (the 741 state only)

#### 18.14.6 Completion

Status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`. No self-approval, no git. 741
is approvable after the review of 3d-1 and the owner's answer on O46-2 row 3 (§18.13).

### 18.15 Owner return of O46-2 row 3, 2026-10-04 → Revision 3e (canonical "Show more", canonical empty state, production states in the page Story; includes 3d-1)

**Implemented and reviewed in §18.16; the route is now §18.16 (Revision 3f).** Original text: it **includes §18.14's R45** (Revision 3d-1), so one session does
both. Re-entry mode: **remediation**. Evidence goes to `docs/sessions/evidence/task741r3/rev3e/exec/`. `rev3e/design/`
belongs to Task 918's design and is not written.

#### 18.15.1 Owner return and decisions, verbatim

O46-2 row 3, `Patterns/Mantine/ListingsShellView`, returned 2026-10-04: *"Я не приймаю цю Story. Не всі статуси
відображені. "Show more" кнопка взагалі якась хардкодна, не така як ми використовуємо. Коли на екрані обраний вид -
список, а потім я переключаюсь на мобільний екран - все стає картками, а потім я повертаюсь на десктопне розширення і
бачу вид картками, все ок."* So the D46-3 list→grid behaviour is **accepted**, and is not re-checked.

Owner decisions, 2026-10-04, options chosen verbatim:
- **D46-6** *"Як у продакшені (Recommended)"*. The page Story shows exactly what `/listings` can render:
  - the active tab with every active variant (new, plain, reduced, premium, no photo, favourite), filter chips and pagination;
  - a closed-tab export with `sold` and `rented`;
  - the empty state of both tabs;
  - the "loading more" state.
  - Inactive, pending, archived and expired never reach `/listings` (`page.tsx:46-49`, `applyPublicVisibility`). They stay in the card Stories.
- **D46-7** *"Primary brand, як Rozetka (Recommended)"*. "Show more" is the canonical theme `Button`:
  - `variant="filled" color="brand"`, theme default size, `loading={isLoadingMore}`;
  - centred above the paginator, full width below 640.

**RETRACTION (orchestrator).**
- **Invalid prior claim:** §18.12.3 / §18.12.8 handed row 3 to the owner as measured.
- **Why invalid:** the review measured geometry only. It never compared the Story's states with production's data
  path, and never traced "Show more" to the canonical Button.
- **Evidence:** `rev3f/review/shell-census.json`.
- **Corrected status:** `CONTRADICTION`. The owner rule **GR-9** (`docs/golden-rules.md`, 2026-10-04) now makes those
  checks mandatory.

#### 18.15.2 Verified context — GR-9 census of the Story (Opus, `win32`, final 3c `storybook-static`, `rev3f/review/shell-census.json`)

| # | Element (rendered) | Canonical owner | Finding |
|---|---|---|---|
| F37 | "Show more" `Button` (`ListingsShellView.tsx:171-183`) | theme `Button` + `Mantine/Primitives/Button` (sizes `xs`/`sm`; loading via `loading`) | `size="lg"`, so the text is 18px while every other button on the page is `sm` (14px); `variant="outline"`; a hand-made `Loader` in `leftSection` plus `disabled` instead of `loading`. → **R46** |
| F38 | Empty state (`ListingsShellView.tsx:117-131`) | `MantineEmptyLoadingErrorState` (`Patterns/Mantine/EmptyLoadingErrorState`) | a local `ThemeIcon size="colossal"` with a 🏠 emoji `Text` and its own title/description markup. → **R47** |
| F39 | `ListingsSortBar` root (`ListingsSortBar.tsx:65`) | Mantine `Divider` (precedent `ListingsFilterBar.tsx:92,167`) | `style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}`, a style object with a literal value. → **R48** |
| F40 | "Save search" modal confirm `Button` (`SaveSearchButton.tsx:93-100`), a popup of this surface | theme `Button` `loading` | a hand-made `Loader` in `leftSection` plus `disabled`. → **R49** |
| F41 | Story states (`ListingsShellView.stories.tsx`) | production data path | All 8 fixtures are `status: 'active'`. There is no reduced, no-photo or favourite card. The closed tab, the closed-empty state and "loading more" are never shown. → **R50** |
| F42 | Story data consistency | `ListingsShell.tsx:167`, `ListingsPagination.tsx:21`, `ActiveFilterChips` (URL) | "Show more" is shown while `total === listings.length`, a state production never renders. Pagination is never shown, because `total` 8 < `perPage` 20. `activeFiltersCount={2}` badges "Filters 2" while 0 chips render, because the Story's URL query is empty. → **R50** |
| — | tabs, filter bar, `ActiveFilterChips`, `ListingsActionRow`, view toggle, `MantinePagination`, `MantineDrawer`, `ListingCard` | each `manifest:yes story:yes` (GR-1 census) | no non-canonical prop found. The `ListingCard` grid/list parity is Task 918 §16 (D46-5). The `ListingsShell.tsx` loading skeleton is container debt (baselined). |

`GR-9 REVIEW DEPTH — patterns-mantine-listingsshellview--default/--empty: elements 14 (each → canonical owner, table above); non-canonical props/values: F37, F38, F39, F40; production states active-tab variants, closed tab, both empty states, loading-more, pagination, chips → rendered active (new, plain, premium), active-empty; missing reduced, no-photo, favourite, closed tab, closed-empty, loading-more, pagination, chips; unreachable shown: "Show more" with everything loaded, filter count 2 with 0 chips; variant parity grid/list → Task 918 §16; executor claims checked: n/a (owner return); evidence docs/sessions/evidence/task741r3/rev3f/review/shell-census.json.`

#### 18.15.3 Reference research (GR-7)

The record is `docs/sessions/evidence/task741r3/rev3f/review/gr7-row3.md`. It covers:
- **Rozetka:** the catalogue's "Показати ще" is the site's standard primary button (filled brand, 16px/500, radius 8px, 40px high), centred above the paginator, the same at 390.
- **Lahomes and Kamr:** pagination only.
- **Omah and TailAdmin:** neither control on these pages.

`GR-7 REFERENCE RESEARCH — moment: task creation (741 §18.15); role: Opus; task: 741; subject: end-of-list "show more", paginator, page states; references: Lahomes, Kamr, Omah, TailAdmin + Rozetka (owner); library: docs/research/references/2026-10-04; live-checked pages: Rozetka catalogue, Lahomes /property-grid + /ui-pagination, Kamr /ui-pagination + /ecom-product-grid, Omah /property-list, TailAdmin /products-list + /buttons → unchanged (Kamr live login works); route inventory: Lahomes 106/106/0, Kamr 62/62/0, Omah 339/339/0, TailAdmin 88/88/0, Rozetka 1/1/0; inspected in depth: 8 pages at 1440 and 390; workflow states operated: Kamr sign-in, scroll to list end; options across references: primary load-more ← Rozetka; pagination only ← Lahomes, Kamr; chosen 2026 best practice: canonical primary Button with loading state above the paginator; Story states equal to production; absent or unverified: none; lero.al data map: page.tsx:46-49, ListingsShell.tsx:167, ListingsPagination.tsx:21, URL-driven chips and tabs; owner decisions: D46-6, D46-7; evidence: docs/sessions/evidence/task741r3/rev3f/review/gr7-row3.md.`

**Execution.** Before the first write, Sonnet runs its own GR-7 audit of the same pages into
`rev3e/exec/research-exec/`. Rozetka needs headed Chrome; the precedent is `rev3f/review/gr7-rozetka-more.mjs`. Sonnet
emits the full receipt. If the audit contradicts the choice above, it stops with `BLOCKED — GR-7 KICKOFF CONFLICT`.

#### 18.15.4 Canonical decision record (GR-0)

| Artifact | Disposition | Owner / token path |
|---|---|---|
| "Show more" | **REUSE** | theme `Button` (`theme.ts:949`, default `size: 'sm'`, radius `lg`), `variant="filled" color="brand"`, `loading` |
| Empty state | **REUSE** | `MantineEmptyLoadingErrorState state="empty"`. Icon: lucide `Home` at `theme.other.iconSize.decorative` (Opus choice that replaces the emoji; returnable in O46-3) |
| Sort-bar bottom line | **REUSE** | Mantine `Divider color="gray.2"` (the same colour as today), as in `ListingsFilterBar` |
| Save-search confirm loading | **REUSE** | theme `Button` `loading={isPending}` |
| Story state fixtures | **EXTEND** the shared fixture | move `makeFixtureListing` from `ListingCard.stories.tsx:90` into `src/stories/fixtures/cardListingData.fixture.ts` as an exported `makeStateListing`, and consume it from both Stories (no copy) |

`GR-0 CANONICAL REUSE PREFLIGHT — request: listings page "Show more", empty state, sort-bar line, save-search loading, page-Story state fixtures; semantic queries: show_more, load more, Loader leftSection, empty state, no_results, borderBottom, makeFixtureListing; inspected candidates: theme Button entry + Mantine/Primitives/Button, MantineEmptyLoadingErrorState + Patterns/Mantine/EmptyLoadingErrorState, ListingsFilterBar Divider, SaveSearchButton, cardListingData.fixture.ts, ListingCard.stories.tsx makeFixtureListing; decision: REUSE (+ EXTEND the shared fixture); selected canonical owner: theme Button, MantineEmptyLoadingErrorState, Mantine Divider, cardListingData.fixture.ts; Mantine/TailAdmin token path: theme Button defaults, brand colour, gray.2, iconSize.decorative; new hardcoded visual values: NONE; rationale: every artifact has an existing canonical owner.`

`GR-3a STORY PREFLIGHT — ListingsShellView × closed tab, closed-empty, loading-more, active variants; canonical candidates: patterns-mantine-listingsshellview--default, --empty; direct-import evidence: ListingsShellView.stories.tsx:4; toolbar coverage: locale=context.globals.locale, viewport=toolbar; decision: EXTEND (exports ClosedTab, ClosedEmpty, LoadingMore added to the same file; Default extended); target: Patterns/Mantine/ListingsShellView; rationale: the states are missing variants of the existing canonical Story.`

#### 18.15.5 Requirements

| ID | Observable requirement | P |
|---|---|---|
| **R45** | As §18.14.2 (correct the Revision 3d GR-7 record). Unchanged. | P2 |
| **R46** | `ListingsShellView` "Show more": `<Button variant="filled" color="brand" loading={isLoadingMore} onClick={onShowMore} w={{ base: '100%', sm: 'auto' }}>`, with no `size`, no `leftSection` and no `disabled` (Mantine's `loading` disables it). It stays centred in its `Group` above `ListingsPagination`. `Loader` and `useMantineTheme` are removed from the file's imports if nothing else uses them. | P0 |
| **R47** | `ListingsShellView`'s empty branch renders `MantineEmptyLoadingErrorState`: `state="empty"`, `icon={<Home size={theme.other.iconSize.decorative} />}`, and `title` = `t('no_results_closed')` on the closed tab, otherwise `t('no_results_title')`. `description` = `t('no_results_desc')` on the active tab only. The local `Center`/`ThemeIcon`/emoji markup is deleted. | P0 |
| **R48** | `ListingsSortBar`: the root `Group`'s `style` object is removed. A `<Divider color="gray.2" />` directly after the row draws the line, and the visible line, its colour and its 1px weight are unchanged. If the sort bar's single-root contract needs a wrapper, wrap both in `<Stack gap={0}>` with the `listings-sort-bar` class kept on the `Group`. | P1 |
| **R49** | `SaveSearchButton` modal confirm: `loading={isPending}`; `leftSection` stays `<Bookmark …/>`; the hand-made `Loader` branch and `disabled={isPending}` on that button are removed (cancel keeps `disabled`). | P1 |
| **R50** | `ListingsShellView.stories.tsx` (D46-6). Every state comes from the shared `makeStateListing`, and every visible string comes from the existing keys. <ul><li>**`Default`** (active tab): six cards: new, plain (`created_at` 2026-07-01), reduced (`price_old`), premium, no photo, and one more plain card with its id in `favoriteIds`. `perPage={6}` `total={18}` `showLoadMore`, so pagination renders three pages. `parameters.nextjs.navigation.query = { type: 'sale', rooms: '2' }` with `activeFiltersCount={2}`, so two chips render.</li><li>**`ClosedTab`**: `tab="closed"`, query `{ tab: 'closed' }`, a sold card and a rented card, `total={2}`, no "Show more", no pagination.</li><li>**`ClosedEmpty`**: `tab="closed"`, query `{ tab: 'closed' }`, no listings.</li><li>**`Empty`**: unchanged, active tab.</li><li>**`LoadingMore`**: `Default`'s data with `isLoadingMore`.</li></ul> `makeFixtureListing` moves from `ListingCard.stories.tsx` to `cardListingData.fixture.ts` as `makeStateListing` (same signature and output). `ListingCard.stories.tsx` imports it, and its rendered states must not change. No `style` object, fixed width or viewport pin; `StoryPageGutter` stays. | P0 |
| **R51** | Tests, red first: the `ListingsShellView` smoke/viewReset suite gains (a) "Show more" renders a Mantine `Button` with `data-variant="filled"` and, with `isLoadingMore`, `data-loading`; (b) an empty closed tab renders the `no_results_closed` text through the pattern, and no 🏠. | P1 |

#### 18.15.6 Type scale (GR-3c)

| Element | Role | base / sm / md / lg | Key | Provenance |
|---|---|---|---|---|
| "Show more" label | button label | 14 at all widths (today 18) | theme Button `sm` | `theme.ts:950` |
| Empty title | section message | 18 at all widths | pattern `Text size="lg" fw={600}` | `MantineEmptyLoadingErrorState` |
| Empty description | body | 14 at all widths | pattern `size="sm"` dimmed | same |

Nothing reaches 24px, and no heading is above 20px below 640.

#### 18.15.7 Acceptance criteria

`GR-4 AC AUDIT — 5 criteria; each states an observable property; absolutes: none.`

- **AC44** — as §18.14.3.
- **AC45 [R46, R49, R51]** Given the final Story at 390 and 1440, the "Show more" button computes the same font size
  (14px), height and radius as "Save search", with the brand background. Given `LoadingMore`, the button carries
  `data-loading`. The R51 tests are red on the pre-change tree and green after.
- **AC46 [R47, R51]** Given `Empty` and `ClosedEmpty`, the pattern's root renders the right title. Given `ClosedEmpty`,
  the description is absent. A text search of the rendered root finds no 🏠.
- **AC47 [R48]** Given `ListingsSortBar` and `ListingsShellView` at 1440, a line 1px high in `gray.2` renders under the
  sort row, at the same y offset as before (±1px). A search of `ListingsSortBar.tsx` for `style={{` returns no hit.
- **AC48 [R50]** Given the final build, a probe records for each export the selected tab, card statuses and badges,
  chip count, pagination presence, "Show more" presence and loading state. Expected:
  - `Default`: 6 cards with the badges New / – / New+Price reduced / – (premium) / – (placeholder) / – (favourite), 2 chips, pagination 3 pages, "Show more";
  - `ClosedTab`: Sold+overlay, Rented+overlay, no "Show more", no pagination;
  - `ClosedEmpty`: the closed message;
  - `LoadingMore`: `data-loading`.

  The `Mantine/Primitives/ListingCard` probe output equals `rev3c/probe-states.json` for every cell (the fixture move changed nothing).

#### 18.15.8 Verification plan

**I0, before any write.**
- `git --no-optional-locks status --porcelain`, plus `git hash-object` of every §18.15.9 file → `rev3e/exec/00_i0.txt`.
- The two R51 tests' red run → `01_red.txt`.

**Gate block, after the writes.** Write one transcript per command to `rev3e/exec/final/`, each ending `EXIT_CODE=`.

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p process.platform
node.exe --version
node.exe scripts\check-surface-census.mjs --surface src\modules\listings\components\ListingsShell.tsx
npx.cmd vitest run src/modules/listings/components/__tests__/ListingsShellView.viewReset.test.tsx src/modules/listings/components/__tests__/ListingCard.smoke.test.tsx
npm.cmd run check:stories
npm.cmd run check:story-coverage
npm.cmd run check:design-tokens:strict
npm.cmd run check:i18n
npm.cmd run build-storybook
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
npm.cmd run check:backlog-active
git --no-optional-locks hash-object src/modules/listings/components/ListingsShellView.tsx src/modules/listings/components/ListingsSortBar.tsx src/modules/listings/components/SaveSearchButton.tsx src/stories/patterns/mantine/ListingsShellView.stories.tsx src/stories/mantine/primitives/ListingCard.stories.tsx src/stories/fixtures/cardListingData.fixture.ts
git --no-optional-locks status --porcelain
```

Expected:
- `win32`;
- the census lists only `ListingsShell.tsx` as FAIL (baselined debt);
- every other command exits 0.

Then run the AC48 probe on that build. The model is `rev3f/review/shell-census.mjs`, re-run against the final
build, plus the primitive-card comparison with `rev3c/probe-states.json`.

**Story receipts, GR-9 first** (`docs/golden-rules.md` GR-9): one `GR-9 REVIEW DEPTH` per changed Story
(`ListingsShellView` exports, `ListingsSortBar`, `ListingsActionRow`, `Mantine/Primitives/ListingCard`). Then:
- GR-3b at 320/390/1024/1440;
- GR-3c at 320/390/768/1440;
- GR-3d, all four sides (`ListingsShellView`: `StoryPageGutter all`, unchanged; `ListingsSortBar` and `ListingsActionRow`: as each file states);
- GR-3e for the "Save search" modal, opened in `ListingsActionRow` at 390 and 1440 (cancel is a lone text button beside a filled one, allowed);
- GR-3f n/a;
- GR-3g for the overlay label in `ClosedTab`.

#### 18.15.9 Files in scope

- `src/modules/listings/components/ListingsShellView.tsx` (R46, R47)
- `src/modules/listings/components/ListingsSortBar.tsx` (R48)
- `src/modules/listings/components/SaveSearchButton.tsx` (R49)
- `src/stories/patterns/mantine/ListingsShellView.stories.tsx` (R50)
- `src/stories/mantine/primitives/ListingCard.stories.tsx` (R50: import of the moved fixture only)
- `src/stories/fixtures/cardListingData.fixture.ts` (R50)
- `src/modules/listings/components/__tests__/ListingsShellView.viewReset.test.tsx` (R51; or a new `ListingsShellView.smoke.test.tsx` beside it)
- §18.14.5's files (R45)
- `docs/sessions/2026-10-04-task741r3-closed-status-hardcode-exit.md` (append `## Revision 3e`, with `## Revision 3d-1` content inside it)
- `docs/backlog.md` (the 741 state only)

Do not edit `messages/*.json`. Every string uses existing keys. If one is missing, stop with `BLOCKED — I18N`.

#### 18.15.10 Owner visual review — `OWNER VISUAL QA REQUIRED` (O46-3)

| Story → export | Viewports | Locales | Owner checks |
|---|---|---|---|
| `Patterns/Mantine/ListingsShellView` → `Default`, `LoadingMore` | 390, 1440 | en, uk | active-tab variants; 2 chips match "Filters 2"; "Show more" is the brand primary button, 14px like the other buttons, with a spinner in `LoadingMore`; pagination below it |
| `… → ClosedTab`, `ClosedEmpty`, `Empty` | 390, 1440 | en, uk | sold/rented cards with the overlay; the canonical empty state (house icon, title, description on the active tab only) |
| `Patterns/Mantine/ListingsSortBar` → its exports | 390, 1440 | en | the line under the row is unchanged |

#### 18.15.11 Completion

Append `## Revision 3e` to the session log, with:
- the R45 correction and its receipt (3d-1);
- I0, the red and green runs, and the gate block;
- the AC48 probe;
- the GR-9 and GR-3b–3g receipts;
- a `Files Changed` table.

Set the 741 state in `docs/backlog.md`. Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`
or `BLOCKED`. No self-approval, no git. 741 is approvable after the review of 3e and the owner's O46-3.

### 18.16 Review of Revision 3e, 2026-10-04 — `NEEDS REVISION` → Revision 3f (the canonical paginator shows only the current page)

**Implemented and reviewed in §18.17; the route is now §18.17 (Revision 3g).** Original text: **this subsection is the only executable route.** Re-entry mode: **remediation**, on the current working tree. Evidence
goes to `docs/sessions/evidence/task741r3/rev3f/exec/`. `rev3f/review/` belongs to Opus and is not written.

**Inspected:**
- the diffs of `ListingsShellView.tsx`, `ListingsSortBar.tsx`, `SaveSearchButton.tsx`, `ListingsShellView.stories.tsx`,
  `ListingCard.stories.tsx` and `cardListingData.fixture.ts`;
- `ListingsShellView.smoke.test.tsx`;
- `rev3e/exec/` (`00_i0`, `01_red` 4/4 red, `final/*`, `probe-states-compare.txt`) and `rev3d/research-exec/gr7-exec.md`;
- the session log's `## Revision 3d-1` / `## Revision 3e`.

**Re-measured by Opus** (`win32`, the executor's final `storybook-static`, built 17:58 after the last write at 17:55):
- `rev3e/review/review-probe.json`: 5 exports × en/uk × 320/390/768/1024/1440;
- `pagination-probe.json` and `pagination-parent.json`.

**Verified, kept:**
- R45, R46, R47, R48, R49 and R51;
- R50's states, chips and the primitive-card parity (0 diffs / 140 cells);
- AC45, AC46 and AC47. AC47 holds by construction and by measurement: line gap 0, 1px, `gray.2`, full row width, no `style` attribute.

#### 18.16.1 Findings

| # | Severity | Finding | Disposition |
|---|---|---|---|
| F43 | **P1** (clause 16d, GR-9, AC48; production) | **The canonical `MantinePagination` never grows past its floor level wherever the consumer wraps it in a flex `Group`, which every production consumer does.** It measures `row.parentElement`, which is `Pagination.Root` (`MantinePagination.tsx:211`). Inside a `Group` that root hugs its content, so it is 112px wide (`pagination-parent.json`). The ladder (`:221-230`) therefore always picks level 3, and level 3 renders only the current page. Measured: `ListingsShellView` `Default` (3 pages) shows "‹ 1 ›" at 390 and at 1440 (`pagination-1440.png`). Every `Patterns/Mantine/ListingsPagination` export shows a single number ("1", "3", "5", "10"). The primitive Story works only because its consumer is a `Stack`, where the root is full-width. Production consumers: `ListingsPagination.tsx:33` (`/listings`), `AdminListingsView.tsx:302`, `AgentStatisticsView.tsx:718`, plus `MantineAdminSurfacePattern.tsx:120` (Story only). Users can only step with ‹ ›; no other page number is ever offered. | **R52–R54**, **AC49–AC51** |
| F44 | **P2** (GR-9 step 5, AC48) | **CONTRADICTION.** The session log's `## Revision 3e` (line 404) says *"pagination controls 1 and 3 plus Previous/Next (the canonical MantinePagination collapses page 2 for 3 pages; not changed)"*, and AC48 is reported met. The "3" is the hidden measuring probe (`position: fixed; visibility: hidden`, `MantinePagination.tsx:289-296`); only "1" is visible (`pagination-probe.json`). The GR-9 receipt traced `MantinePagination` to its canonical owner without checking what it rendered. | **R55** |
| F45 | P3 | `ListingsSortBar.tsx`: the comment kept at the root still says "Root stays a single Group with exactly two direct-child elements". After R48 the root is a `Stack` (Group + Divider). The `.listings-sort-bar > div:nth-of-type(n)` probe selectors still resolve, because the class stayed on the `Group`. | **R56** |
| F46 | NOTE, orchestrator | AC44's hash clause (§18.14.3) cannot hold once §18.15 edits `ListingsShellView.tsx` and `ListingCard.stories.tsx`. The executor recorded this correctly; the clause is withdrawn for 3e/3f, and the I0 equality stands. The gates ran from Git Bash with `node`/`npm`. The `win32` platform transcript makes them admissible, but 3f runs them from PowerShell with `node.exe`/`npm.cmd`. | Kickoff corrected |

`GR-9 REVIEW DEPTH — patterns-mantine-listingsshellview--default/--closed-tab/--closed-empty/--empty/--loading-more (+ ListingsSortBar, ListingsActionRow, Mantine/Primitives/ListingCard): elements 15 (each → canonical owner); non-canonical props/values: MantinePagination row and probe style objects (MantinePagination.tsx:258-265, :293); production states active variants, chips, pagination, closed tab, both empties, loading-more → rendered all, but pagination renders the floor ("‹ 1 ›") for 3 pages (F43); unreachable shown: NONE; variant parity: primitive card states vs rev3c 0/140 diffs; grid/list → Task 918 §16; executor claims checked against their evidence 9/10, contradictions: F44; evidence docs/sessions/evidence/task741r3/rev3e/review/.`

#### 18.16.2 Reference research (GR-7)

The live record for this session is `docs/sessions/evidence/task741r3/rev3f/review/gr7-row3.md`, with
`gr7-loadmore/gr7-loadmore.json` and `gr7-rozetka-more.json`. Every reference with a paginator shows the neighbouring
page numbers, not only the current one:
- **Rozetka:** "‹ 1 2 3 4 … 100 ›", 42px bordered squares at 1440 and 32×34 at 390.
- **Lahomes `/property-grid.html` and `/ui-pagination.html`:** "Previous 1 2 3 Next".
- **Kamr `/ui-pagination`:** "‹ 1 2 3 4 ›", 38px.

The canonical shed ladder (Task 535: full → no siblings → no trailing boundary → floor, only when space runs out) is the
right design. Its width budget is what is broken. No owner decision is needed.

`GR-7 REFERENCE RESEARCH — moment: review (741 Revision 3e); role: Opus; task: 741; subject: end-of-list pagination and "show more"; references: Lahomes, Kamr, Omah, TailAdmin + Rozetka (owner); library: docs/research/references/2026-10-04; live-checked pages (this session): Rozetka catalogue paginator, Lahomes /property-grid + /ui-pagination, Kamr /ui-pagination + /ecom-product-grid, Omah /property-list, TailAdmin /products-list + /buttons → unchanged; route inventory: Lahomes 106/106/0, Kamr 62/62/0, Omah 339/339/0, TailAdmin 88/88/0, Rozetka 1/1/0; inspected in depth: 8 pages at 1440 and 390; workflow states operated: Kamr sign-in, scroll to list end; options across references: neighbour page numbers ← Rozetka, Lahomes, Kamr; current page only ← none; chosen 2026 best practice: the canonical shed ladder with a correct width budget; absent or unverified: none; lero.al data map: ListingsPagination (/listings), AdminListingsView (/admin/listings), AgentStatisticsView (cabinet statistics); owner decisions: D46-6, D46-7; evidence: docs/sessions/evidence/task741r3/rev3f/review/gr7-row3.md, docs/sessions/evidence/task741r3/rev3e/review/pagination-parent.json.`

**Execution.** Before the first write, Sonnet runs its own GR-7 check of the three paginator pages above into
`rev3f/exec/research-exec/`, and emits the full receipt.

#### 18.16.3 Canonical decision record (GR-0)

| Artifact | Disposition | Owner / path |
|---|---|---|
| Paginator width budget | **EXTEND** the canonical owner, `src/design-system/mantine/patterns/MantinePagination.tsx`. Never a consumer. | Measure and observe the **consumer wrapper**, `Pagination.Root`'s parent (`row.parentElement?.parentElement`), with a fallback to the root when absent. Consumers stay unchanged. |
| Paginator row and probe chrome | **EXTEND** the same file | The row is a Mantine `Group gap="xs" wrap="nowrap" align="center" maw="100%"` plus a keyword-only module class for `overflow: hidden`. The probe is `pos="fixed"` plus a keyword-only module class for `visibility: hidden; pointer-events: none`. No `style` object and no literal value. |
| Consumer-contract proof | **EXTEND** `src/stories/mantine/primitives/Pagination.stories.tsx` | One new export, `InCenteredGroup`: the real consumer contract (`<Group justify="center">` around `MantinePagination`) with 3, 10 and 50 pages, toolbar-driven. Production consumers render it this way (`ListingsPagination.tsx:33`, `AdminListingsView.tsx:302`). It is canonical coverage of a production contract, not a gate probe. |

`GR-0 CANONICAL REUSE PREFLIGHT — request: paginator width budget and chrome; semantic queries: MantinePagination, Pagination.Root, parentElement, ResizeObserver, shed level; inspected candidates: MantinePagination.tsx + Mantine/Primitives/Pagination, ListingsPagination.tsx + Patterns/Mantine/ListingsPagination, AdminListingsView.tsx:302, AgentStatisticsView.tsx:718, MantineAdminSurfacePattern.tsx:120; decision: EXTEND; selected canonical owner: src/design-system/mantine/patterns/MantinePagination.tsx; Mantine/TailAdmin token path: theme spacing xs, existing pagination chrome; new hardcoded visual values: NONE; rationale: the defect is in the shared owner and all consumers inherit the fix.`

`GR-3a STORY PREFLIGHT — MantinePagination × centred in a Group (the production consumer contract); canonical candidates: mantine-primitives-pagination--* (Stack consumer only); direct-import evidence: src/stories/mantine/primitives/Pagination.stories.tsx; toolbar coverage: locale=Storybook toolbar, viewport=Storybook toolbar; decision: EXTEND (one export); target: Mantine/Primitives/Pagination; rationale: the existing exports never render the contract every production consumer uses, which is why the defect stayed invisible.`

#### 18.16.4 Requirements

| ID | Observable requirement | P |
|---|---|---|
| **R52** | `MantinePagination` takes its width budget from `Pagination.Root`'s parent element (the consumer wrapper), and observes it with `ResizeObserver`. It falls back to the root only when the root has no parent. Nothing else in the ladder (`SHED_LEVELS`, `computeShedRange`, the floor-first SSR rule, the probe-based item width) changes. Consumers are not edited. | P0 |
| **R53** | `MantinePagination.tsx` has no `style={{…}}` object: the row and the probe use the §18.16.3 Mantine props plus keyword-only classes in a new `MantinePagination.module.css`. The rendered row keeps `display: flex; flex-wrap: nowrap; gap: var(--mantine-spacing-xs); overflow: hidden; max-width: 100%`, and the probe stays fixed, hidden and non-interactive. | P1 |
| **R54** | `Pagination.stories.tsx` gains the export `InCenteredGroup` (§18.16.3), with three rows (3, 10 and 50 pages, page 1, then a mid page for 50). It uses no fixed width, `style` object or viewport pin, and the gutter stays as the file's other exports have it. `MantinePagination.smoke.test.tsx` gains a two-armed test. In jsdom, stub `clientWidth` so the consumer wrapper reports 1000 and the root reports 100, and give the probe a width of 32. Then render `total={3}` inside a wrapper, and assert that page buttons 1, 2 and 3 render. The test is red on the pre-change file (only "1") and green after. | P0 |
| **R55** | The session log gets `## Revision 3f` with a `RETRACTION` of the line-404 claim (F44): the invalid claim, why it is invalid, the evidence (`rev3e/review/pagination-probe.json`) and the corrected status. AC48 is re-run on the 3f build. | P2 |
| **R56** | `ListingsSortBar.tsx`: the root comment describes the real structure (`Stack` of the `.listings-sort-bar` `Group`, with its two children, plus the `Divider`). Comment only. | P3 |

#### 18.16.5 Acceptance criteria

`GR-4 AC AUDIT — 3 criteria; each states an observable property; absolutes: none.`

- **AC49 [R52, R54]** Given the final build, a probe like `rev3e/review/pagination-parent.mjs` records the visible page
  numbers. A control counts as visible when it is not the probe: it is not `position: fixed` and it is inside the
  row's box. Expected:
  - `ListingsShellView` `Default` shows "1 2 3" at 390 and 1440;
  - every `ListingsPagination` export shows more than the current page wherever its wrapper has the room;
  - `Pagination` `InCenteredGroup` shows "1 2 3", "1 2 3 4 5 … 10" and the mid-page ladder for 50 at 1440, and a shed level at 320 with no overflow;
  - the primitive's existing exports are unchanged from `rev3e/review/pagination-parent.json`.

  The red arm is the 3e build's `pagination-parent.json` (floor only).
- **AC50 [R53]** A search of `MantinePagination.tsx` for `style={{` returns no hit, and `check:design-tokens:strict` exits 0. The computed row styles equal the values R53 names.
- **AC51 [R55, R56]** The RETRACTION is present in the session log, the re-run AC48 probe records "1 2 3", and the `ListingsSortBar` comment matches its JSX.

#### 18.16.6 Verification plan

**I0.**
- `git --no-optional-locks status --porcelain`, plus `git hash-object` of the §18.16.7 files → `rev3f/exec/00_i0.txt`.
- The R54 red run → `01_red.txt`.

**Gate block** (PowerShell, `node.exe`/`npm.cmd`, one transcript per command in `rev3f/exec/final/`, each ending `EXIT_CODE=`):

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p process.platform
node.exe --version
node.exe scripts\check-surface-census.mjs --surface src\modules\listings\components\ListingsShell.tsx
npx.cmd vitest run src/design-system/mantine/patterns/__tests__/MantinePagination.smoke.test.tsx src/modules/listings/components/__tests__/ListingsShellView.smoke.test.tsx src/modules/listings/components/__tests__/ListingsShellView.viewReset.test.tsx src/modules/listings/components/__tests__/ListingCard.smoke.test.tsx
npm.cmd run check:stories
npm.cmd run check:story-coverage
npm.cmd run check:design-tokens:strict
npm.cmd run build-storybook
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
npm.cmd run check:backlog-active
git --no-optional-locks hash-object src/design-system/mantine/patterns/MantinePagination.tsx src/design-system/mantine/patterns/MantinePagination.module.css src/stories/mantine/primitives/Pagination.stories.tsx src/design-system/mantine/patterns/__tests__/MantinePagination.smoke.test.tsx src/modules/listings/components/ListingsSortBar.tsx
git --no-optional-locks status --porcelain
```

Expected:
- `win32`;
- the census lists only `ListingsShell.tsx` as FAIL;
- every other command exits 0.

Then run AC49 and the AC48 re-run on that build.

**Receipts, GR-9 first.** Emit one `GR-9 REVIEW DEPTH` per changed or blast-radius Story:
- `Mantine/Primitives/Pagination` (all exports);
- `Patterns/Mantine/ListingsPagination`;
- `Patterns/Mantine/ListingsShellView` `Default` / `LoadingMore`;
- `Patterns/Mantine/AdminListingsView`;
- `Patterns/Mantine/AgentStatisticsView`;
- `Patterns/Mantine/AdminSurfacePattern`.

For each, record the visible page numbers at 390 and 1440. Then:
- GR-3b at 320/390/1024/1440, with no overflow anywhere;
- GR-3c (no text change);
- GR-3d, all four sides, as each file states;
- GR-3e n/a;
- GR-3f n/a, because pagination controls are rounded squares;
- GR-3g for the paginator controls (no clipping ancestor; confirm).

#### 18.16.7 Files in scope

- `src/design-system/mantine/patterns/MantinePagination.tsx` (R52, R53)
- `src/design-system/mantine/patterns/MantinePagination.module.css` (new, R53)
- `src/stories/mantine/primitives/Pagination.stories.tsx` (R54)
- `src/design-system/mantine/patterns/__tests__/MantinePagination.smoke.test.tsx` (R54)
- `src/modules/listings/components/ListingsSortBar.tsx` (R56, comment only)
- `docs/sessions/evidence/task741r3/rev3f/exec/` (new)
- `docs/sessions/2026-10-04-task741r3-closed-status-hardcode-exit.md` (append `## Revision 3f`)
- `docs/backlog.md` (the 741 state only)

No consumer file and no Revision 3e file is edited, apart from `ListingsSortBar.tsx`'s comment.

#### 18.16.8 Owner visual review — `OWNER VISUAL QA REQUIRED` (O46-3, extended)

The §18.15.10 rows, plus these:

| Story → export | Viewports | Locales | Owner checks |
|---|---|---|---|
| `Patterns/Mantine/ListingsShellView` → `Default` | 390, 1440 | en, uk | the paginator shows "‹ 1 2 3 ›" |
| `Mantine/Primitives/Pagination` → `InCenteredGroup` and the existing exports | 320, 390, 1440 | en | page numbers shed only when space runs out; no overflow |
| `Patterns/Mantine/ListingsPagination`, `AdminListingsView`, `AgentStatisticsView` | 390, 1440 | uk | the paginator now shows page numbers, not only the current page |

#### 18.16.9 Completion

Append `## Revision 3f` to the session log, with:
- the R55 retraction;
- I0, the red and green runs, and the gate block;
- AC49 and the AC48 re-run;
- the GR-9 and GR-3 receipts;
- a `Files Changed` table.

Status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`. No self-approval, no git.

### 18.17 Review of Revision 3f, 2026-10-04 — `NEEDS REVISION` → Revision 3g (fill-to-width ladder, uncut focus ring)

**This subsection is the only executable route.** Re-entry mode: **remediation**, on the current working tree. Evidence
goes to `docs/sessions/evidence/task741r3/rev3g/exec/`. `rev3f/review-3f/` belongs to Opus and is not written.

**Inspected:**
- the diffs of `MantinePagination.tsx`, `MantinePagination.module.css` (new), `Pagination.stories.tsx`,
  `MantinePagination.smoke.test.tsx` and `ListingsSortBar.tsx`;
- the four consumers (`ListingsPagination.tsx:33`, `AdminListingsView.tsx:302`, `AgentStatisticsView.tsx:718`,
  `MantineAdminSurfacePattern.tsx:120`), each a lone `MantinePagination` inside a `Group`;
- `rev3f/exec/` (`00_i0*`, `01_red`, `02_green`, `final/*`, `probe-ac49/ac48/receipts`, `research-exec/`) and the session
  log's `## Revision 3f`.

**Re-measured by Opus** (`win32`, Node v22.22.3, the executor's final `storybook-static` built 19:00:16 after the last
source write at 18:59:17; `next build` 19:02):
- `rev3f/review-3f/review-probe.json` / `.txt`: every paginator Story × en 320/390/1024/1440 + uk 390/1440, with every
  paginator control Tab-focused at 390 and 1440 in `InCenteredGroup`, `ListingsPagination` `Default` and
  `ListingsShellView` `Default`, plus DPR-1 crops in `crops/`. The `default-*` crops are `ListingsShellView`'s, because
  the `ListingsPagination` crops were overwritten by name.
- `rev3f/review-3f/research-review/`: GR-7.

**Verified, kept:**
- R52: the budget is the consumer wrapper. The red/green pair is an A/B on the budget line alone (1 failed of 26, then
  26 of 26), and the final file hash `6679e4d1…` equals the gate hash.
- R53: no `style={{` in the file. Computed row styles are `flex`, `nowrap`, gap 8px, `max-width: 100%`. The probe is
  `fixed`, `hidden` and `none` in every cell.
- R54, R55 and R56.
- AC49's page numbers, which equal `rev3f/exec/probe-ac49.txt` in every cell Opus re-measured, with no horizontal
  overflow in any cell. AC50 and AC51.
- Every gate exits 0, and the census lists only `ListingsShell.tsx`.
- The two changed jsdom assertions are accepted: each declaration is asserted at its source, and both roles measured
  the computed values in a real browser.

#### 18.17.1 Findings

| # | Severity | Finding | Disposition |
|---|---|---|---|
| F47 | **P1** (GR-3g "a clip never cuts it", WCAG 2.2 2.4.7; production) | **The keyboard focus ring of every paginator control is cut.** The row has `overflow: hidden` (R53, `MantinePagination.module.css` `.row`), and its height equals the control height. Mantine's focus ring is a 2px outline at a 2px offset (`@mantine/core/styles/global.css:16-18`). Measured in `review-probe.txt`, every Tab-focused control in every probed Story at 390 and 1440 loses 4px at the top and 4px at the bottom of its ring, and "Previous page" / "Next page" also lose 4px on their outer side. `crops/in-centered-group-{390,1440}-first-10x.png` show only the left and right arcs. Every reference that draws a ring draws it whole (Kamr, Omah, Rozetka, TailAdmin; `research-review/gr7-review-3f.md`). §18.16.6's "no clipping ancestor; confirm" was an orchestrator error. The executor reported that it had not measured the ring. | **R57** |
| F48 | **P1** (owner **D46-8**, GR-7) | **The ladder drops every neighbour in one step.** At 390, with 10 pages on page 1, the paginator shows "‹ 1 … 10 ›" (5 controls, 252px) in a 358px wrapper, although "‹ 1 2 3 … 10 ›" (7 × 44 + 6 × 8 = 356px) fits. The cause is `SHED_LEVELS[1]`, which removes both siblings at once. It shows in `InCenteredGroup` and `Default` at 390 (`review-probe.txt`). Rozetka, Kamr and Lahomes show neighbouring numbers on a phone. | **R58** |
| F49 | **P2** (GR-9 step 5) | **CONTRADICTION.** `rev3f/exec/00_i0.txt` says "ListingsSortBar.tsx = rev3e hash" and records `174d8209…`. The 3e final hash of that file is `ebb6709f…` (`rev3e/exec/final/15_hashes.txt`, line 2), and `174d8209…` is the hash after the R56 edit (`final/14_hashes.txt`). So the I0 was written after a 3f write, not before it. The pre-3f state of the other four files is still witnessed by `HEAD` and by `00_i0_status_from_3e_final.txt`, which does not list them. | **R59** |
| F50 | P3 | In the R54 block of `MantinePagination.smoke.test.tsx`, jsdom defines `clientWidth` on `Element.prototype`, not on `HTMLElement.prototype` (checked: `HTMLElement own: false, Element own: true`). `getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth')` is therefore `undefined`, and `afterAll` leaves the stub installed. | **R60** |
| F51 | NOTE | The gates ran from Git Bash with `node`/`npm` again, after §18.16.6 asked for PowerShell with `node.exe`/`npm.cmd`. The `win32` transcript makes 3f's results admissible. 3g runs the gate block in PowerShell. | §18.17.7 |

`GR-9 REVIEW DEPTH — mantine-primitives-pagination--in-centered-group / --default, patterns-mantine-listingspagination--default, patterns-mantine-listingsshellview--default / --loading-more, patterns-mantine-adminlistingsview--paginated, patterns-mantine-agentstatisticsview--* (8 exports), patterns-mantine-adminsurfacepattern--default: elements per paginator 3–9 controls (each → MantinePagination, manifest yes, Story yes; chrome pagination-chrome.css) + the InCenteredGroup row labels (dev annotations, same convention as Default); non-canonical props/values: NONE in source; rendered defect F47 (the focus ring is cut by the row clip); production states: 1 page (nothing), 2–3 pages, many pages at the first, middle and last page, phone and desktop → rendered: all, across InCenteredGroup + Default + ListingsPagination + AgentStatisticsView (2 and 3 pages) + AdminListingsView (8 pages, page 2); missing: NONE; unreachable shown: NONE; variant parity: Stack consumer vs Group consumer at 1440 → identical items ("1 2 3 4 5 … 10"), phone vs desktop → F48 (390 drops neighbours that fit); executor claims checked against their evidence 11/12, contradictions: F49; evidence docs/sessions/evidence/task741r3/rev3f/review-3f/review-probe.json.`

Geometry, from `review-probe.txt`:
- **GR-3b.** No document overflow in any of 90 cells (15 Stories × 6). Every row is at most the width of its consumer (for example 356/358
  at 390 and 252/288 at 320).
- **GR-3d.** `MantineStoryShell` primitives are 16 at 320/390 and 49 at 1024/1440 (the known exception).
  `ListingsShellView` is l/r 16 at 320/390 and 32 at 1024/1440. `ListingsPagination` is 16 / 24. The
  `AgentStatisticsView` and `AdminSurfacePattern` gutters are their own. `AdminListingsView` `Paginated` reads l 12–20
  and b −152: those leaves are the `AdminShell` navbar chrome (named shell list) and table cells inside the shell's
  scroll area, not a page gutter. Unchanged by 3f, and no side is at 0.
- **GR-3e** n/a.
- **GR-3f** n/a (rounded squares).
- **GR-3g**: F47.

#### 18.17.2 Owner decision, verbatim

**D46-8**, 2026-10-04. Option chosen: *"Заповнювати до ширини (Recommended)"*. The question asked whether the phone
paginator should:
- show as many neighbouring pages as fit (Rozetka);
- keep the Task 535 ladder;
- or switch to TailAdmin's "Page X of Y" below `sm`.

#### 18.17.3 Reference research (GR-7)

The record is `docs/sessions/evidence/task741r3/rev3f/review-3f/research-review/gr7-review-3f.md`. What each reference
shows:
- **TailAdmin `/pagination`:** "Previous 1 2 3 … 8 9 10 Next" at 40×40 on desktop, and "Page 1 of 10" at 390.
- **Lahomes:** "Previous 1 2 3 Next", with no visible focus ring.
- **Kamr:** "‹ 1 2 3 4 ›", with a 3px ring that is not cut.
- **Omah order list:** "‹ 1 2 ›", with a 3px ring that is not cut.
- **Rozetka:** "1 2 3 4 … 100" at 390, with a 2px shadow ring that is not cut.

`GR-7 REFERENCE RESEARCH — moment: review (741 Revision 3f) and task creation (741 Revision 3g); role: Opus; task: 741; subject: paginator page numbers per width, keyboard focus ring; references: Lahomes, Kamr, Omah, TailAdmin + Rozetka (owner); library: docs/research/references/2026-10-04; live-checked pages: TailAdmin /pagination (076), /products-list (016); Lahomes /ui-pagination (060), /property-grid (008); Kamr /ui-pagination (038); Omah /property-list (013), /order-list (006); Rozetka catalogue → unchanged; route inventory: Lahomes 106/106/0, Kamr 62/62/0, Omah 339/339/0, TailAdmin 88/88/0 (library), Rozetka 1/1/0; inspected in depth: the 8 pages above at 1440 and 390, paginator items, control size, a Tab-focused page control; workflow states operated: Kamr sign-in, Rozetka scroll to list end, Tab focus on a page control; options across references: neighbours that fit ← Rozetka, Kamr, Lahomes; Page X of Y ← TailAdmin 390; uncut focus ring ← Kamr, Omah, Rozetka, TailAdmin; chosen 2026 best practice: fill-to-width ladder (D46-8) and an uncut focus ring; absent or unverified: none; lero.al data map: MantinePagination consumers ListingsPagination (/listings, /favorites), AdminListingsView (/admin/listings), AgentStatisticsView (cabinet statistics), MantineAdminSurfacePattern (Story only); owner decisions: D46-6, D46-7, D46-8; evidence: docs/sessions/evidence/task741r3/rev3f/review-3f/research-review/.`

**Execution.** Before the first write, Sonnet re-checks Rozetka at 390, Kamr `/ui-pagination` and TailAdmin
`/pagination` (at 1440 and 390, focus state included) into `rev3g/exec/research-exec/`, and emits the full receipt.

#### 18.17.4 Canonical decision record (GR-0)

| Artifact | Disposition | Owner / path |
|---|---|---|
| Focus-ring room | **EXTEND** `MantinePagination` (`src/design-system/mantine/patterns/MantinePagination.tsx` + `.module.css`) | Remove the row's `overflow: hidden`: delete `.row` from the module and its `className` from the `Group`; `.probe` stays. This is safe by construction. The estimate gives every control the probe's width (`String(total)`, the widest label), and the edge controls and dots are never wider, so `estimate ≥ rendered`. The floor (3 controls, 148px at 44px) fits the narrowest wrapper measured (246). The Rule 1 doc comment changes to say this. |
| Fill levels | **EXTEND** the same file | Three fill levels between level 0 and today's level 1 (R58). Unchanged: level 0, the three existing shed levels, `computeFullRange`, `computeAsymmetricRange`, floor-first SSR and the probe. |
| Proof | **EXTEND** `MantinePagination.smoke.test.tsx` | No Story change: `InCenteredGroup` and `Default` already render the rows that change. |

`GR-0 CANONICAL REUSE PREFLIGHT — request: paginator focus-ring room and fill-to-width ladder; semantic queries: MantinePagination, SHED_LEVELS, computeShedRange, overflow hidden, focus-visible, outline-offset; inspected candidates: MantinePagination.tsx + .module.css + Mantine/Primitives/Pagination, pagination-chrome.css, @mantine/core global.css focus ring, the four consumers; decision: EXTEND; selected canonical owner: src/design-system/mantine/patterns/MantinePagination.tsx; Mantine/TailAdmin token path: Mantine default focus ring, theme spacing xs, pagination-chrome.css (unchanged); new hardcoded visual values: NONE; rationale: both defects live in the shared owner and every consumer inherits the fix.`

`GR-3a STORY PREFLIGHT — MantinePagination × keyboard focus and phone widths; canonical candidates: mantine-primitives-pagination--default, --in-centered-group; direct-import evidence: src/stories/mantine/primitives/Pagination.stories.tsx:5; toolbar coverage: locale=Storybook toolbar, viewport=Storybook toolbar; decision: REUSE (no new export); target: Mantine/Primitives/Pagination; rationale: both exports already render the 10-page and 50-page rows the fix changes.`

#### 18.17.5 Requirements

| ID | Observable requirement | P |
|---|---|---|
| **R57** | The paginator row does not clip. `MantinePagination.module.css` keeps only `.probe`. The `Group` drops `className={styles.row}` and keeps `gap="xs" wrap="nowrap" align="center" maw="100%"`. Rule 1's comment states the by-construction bound (§18.17.4). The jsdom "never-wraps" test keeps its `--group-wrap`, `--group-gap` and `max-width` assertions and drops the `_row_` class assertion. In the browser, in every probe cell: `row.scrollWidth <= row.clientWidth`, the document has no horizontal overflow, and a Tab-focused control shows its whole ring on all four sides. | P0 |
| **R58** | **D46-8, fill to width.** `SHED_LEVELS` becomes, in order: level 0 full (unchanged); `fill: 3`; `fill: 2`; `fill: 1`; today's "drop siblings"; "drop trailing"; floor (unchanged). A fill level's pages are `{1, total, active}` plus up to `fill` neighbours of `active`. Neighbours are tried in the order `active+1, active−1, active+2, active−2, …`. A page below 1, above `total` or already present is skipped and does not count. The pages are sorted. A gap that hides exactly one page shows that page instead of `dots` (same item count); a larger gap shows `dots`. The measurement loop is unchanged: it picks the first level whose estimate fits. Expected, with 44px controls and an 8px gap below 640: <ul><li>390 (wrapper 358): 10 pages, page 1 → "‹ 1 2 3 … 10 ›"; 10 pages, page 10 → "‹ 1 … 8 9 10 ›"; 10 pages, page 5 → "‹ 1 … 5 … 10 ›" (unchanged); 50 pages, page 25 → "‹ 1 … 25 … 50 ›" (unchanged); 3 pages → "‹ 1 2 3 ›".</li><li>320 (wrapper 288): 10 pages, page 1 → "‹ 1 … 10 ›" (unchanged, because 6 controls take 304px).</li><li>1024 and 1440: every cell equals `rev3f/review-3f/review-probe.txt` (level 0).</li></ul> | P0 |
| **R59** | The session log's `## Revision 3g` carries a `RETRACTION` of the F49 I0 label. It gives the invalid claim, why it is invalid (`ebb6709f…` against `174d8209…`), the evidence and the corrected status. 3g's own I0 is captured **before** the first 3g write. Its transcript records a timestamp that is earlier than every 3g source mtime. | P2 |
| **R60** | In the R54 test block, `afterAll` restores `clientWidth`. When `HTMLElement.prototype` had no own descriptor, it deletes the own property; otherwise it re-defines the saved descriptor. The R54 test still fails on the 3e budget line and passes after. | P3 |
| **R61** | Tests, red first, on the 3f file. (a) `computeShedRange`, or the fill function it calls, returns: `[1,2,3,'dots',10]` for (10, 1, fill 2); `[1,'dots',8,9,10]` for (10, 10, fill 2); `[1,2,3,4,5]` for (5, 1, fill 2); `[1,'dots',25,26,'dots',50]` for (50, 25, fill 1). (b) A component test in the R54 stub style uses probe 32, jsdom gap 0 and a consumer wrapper of 230 (7 × 32 = 224 fits, 8 × 32 = 256 does not). For `total={10} value={1}` it renders the visible pages `1 2 3 10`. The 3f file renders `1 10`. The ladder-order test asserts the seven levels in order. | P1 |

#### 18.17.6 Acceptance criteria

`GR-4 AC AUDIT — 3 criteria; each states an observable property; absolutes: none.`

- **AC52 [R57]** On the final build, the probe records, for every paginator Story × en 320/390/1024/1440 + uk 390/1440:
  - `overflow: false`, and `row.scrollWidth <= row.clientWidth` on every row;
  - in `InCenteredGroup`, `ListingsShellView` `Default`, `ListingsPagination` `Default`, `AdminListingsView`
    `Paginated` and `AgentStatisticsView` `Default` at 390 and 1440, every control Tab-focused in turn. For each: the
    ring's extent (outline width + offset) against its nearest ancestor whose `overflow` is not `visible`, with that
    ancestor's room ≥ 4px on every side or no such ancestor;
  - a DPR-1 crop scaled 10× of the first, a middle and the last control, where the ring is whole on all four sides.

  The probe's model is `rev3f/review-3f/review-probe.mjs`. Fix its crop names so that no two Stories share a file.
- **AC53 [R58, R61]** The same probe records the visible items of every row. They equal R58's expected values at 320,
  390, 1024 and 1440. For every other cell, the chosen level is the first in `SHED_LEVELS` whose estimate fits the
  budget the probe records. The R61 tests are red on the 3f file and green after.
- **AC54 [R59, R60]** The retraction is in the session log, and `00_i0.txt`'s timestamp is earlier than every 3g
  source mtime. After the R54 block, `Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth')` is
  `undefined` again; the same file asserts this.

#### 18.17.7 Verification plan

**I0, before any write.**
- `git --no-optional-locks status --porcelain`, plus `git hash-object` of the §18.17.8 files and a `Get-Date -Format o`
  line → `rev3g/exec/00_i0.txt`.
- The R61 red run on the 3f file → `01_red.txt`.

**Gate block.** Run it in PowerShell with `node.exe`/`npm.cmd`, not Git Bash. Write one transcript per command to
`rev3g/exec/final/`, each ending `EXIT_CODE=`.

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p process.platform
node.exe --version
node.exe scripts\check-surface-census.mjs --surface src\modules\listings\components\ListingsShell.tsx
npx.cmd vitest run src/design-system/mantine/patterns/__tests__/MantinePagination.smoke.test.tsx src/modules/listings/components/__tests__/ListingsShellView.smoke.test.tsx src/modules/listings/components/__tests__/ListingsShellView.viewReset.test.tsx src/modules/listings/components/__tests__/ListingCard.smoke.test.tsx
npm.cmd run check:stories
npm.cmd run check:story-coverage
npm.cmd run check:design-tokens:strict
npm.cmd run build-storybook
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
npm.cmd run check:backlog-active
git --no-optional-locks hash-object src/design-system/mantine/patterns/MantinePagination.tsx src/design-system/mantine/patterns/MantinePagination.module.css src/design-system/mantine/patterns/__tests__/MantinePagination.smoke.test.tsx
git --no-optional-locks status --porcelain
```

Expected:
- `win32`;
- the census lists only `ListingsShell.tsx` as FAIL;
- every other command exits 0.

Then run the AC52/AC53 probe on that build.

**Receipts, GR-9 first.** Emit one `GR-9 REVIEW DEPTH` per Story in §18.17.9, with its visible items at 320, 390 and
1440. Then:
- GR-3b at 320/390/1024/1440;
- GR-3c (no text change);
- GR-3d, all four sides, as each file states;
- GR-3e n/a;
- GR-3f n/a, because the controls are rounded squares;
- **GR-3g for the focus ring**, per AC52, with the crops as evidence.

#### 18.17.8 Files in scope

- `src/design-system/mantine/patterns/MantinePagination.tsx` (R57, R58)
- `src/design-system/mantine/patterns/MantinePagination.module.css` (R57)
- `src/design-system/mantine/patterns/__tests__/MantinePagination.smoke.test.tsx` (R57, R60, R61)
- `docs/sessions/evidence/task741r3/rev3g/exec/` (new)
- `docs/sessions/2026-10-04-task741r3-closed-status-hardcode-exit.md` (append `## Revision 3g`)
- `docs/backlog.md` (the 741 state only)

No consumer, Story file or other 3e/3f file is edited.

#### 18.17.9 Owner visual review — `OWNER VISUAL QA REQUIRED` (O46-3, extended)

The §18.15.10 rows stay. These rows replace §18.16.8's:

| Story → export | Viewports | Locales | Owner checks |
|---|---|---|---|
| `Patterns/Mantine/ListingsShellView` → `Default` | 390, 1440 | en, uk | the paginator shows "‹ 1 2 3 ›"; Tab onto it shows the whole ring |
| `Mantine/Primitives/Pagination` → `InCenteredGroup`, `Default` | 320, 390, 1440 | en | at 390, 10 pages read "‹ 1 2 3 … 10 ›"; numbers shed only when space runs out; no overflow; the focus ring is whole |
| `Patterns/Mantine/ListingsPagination`, `AdminListingsView` → `Paginated`, `AgentStatisticsView` | 390, 1440 | uk | page numbers fill the width; the focus ring is whole |

#### 18.17.10 Completion

Append `## Revision 3g` to the session log, with:
- the R59 retraction;
- I0, the red and green runs, and the gate block;
- AC52 and AC53;
- the GR-9 and GR-3 receipts;
- a `Files Changed` table.

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`. No self-approval, no git.
741 can be approved after the review of 3g and the owner's O46-3.
