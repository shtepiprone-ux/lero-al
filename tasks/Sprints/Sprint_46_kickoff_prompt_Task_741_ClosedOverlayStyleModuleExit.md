# Task 741 — Retire `CLOSED_OVERLAY_STYLE`'s Tailwind strings into `ListingCard.module.css`

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
