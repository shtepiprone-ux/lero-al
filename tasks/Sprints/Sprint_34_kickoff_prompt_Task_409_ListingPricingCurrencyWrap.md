# Sprint 34 — Task 409 — Fix listing-card pricing GLOBALLY: currency duplication, hardcoded currency, price/per-m² misalignment, and atomic price-per-m² wrapping — across EVERY listing-card consumer

> **Read `docs/agent-contract.md` (clauses 1–14) FIRST, in full, then STOP & ASK if anything is ambiguous.**
> You are the **Sonnet 4.6 executor**. This is a real defect in the listing pricing UI surfaced in Storybook
> (`System/ListingGrid` **and** `RecentlyViewedSection`) and present in the live `ListingCard`. It is **NOT a
> one-screenshot patch and NOT a ListingGrid-only patch** — it is a **GLOBAL fix** of the shared listing pricing
> display across **every live and Storybook surface that renders a listing card or listing-card pricing**: the
> canonical formatter path, the i18n unit label, the Storybook fixture/card(s), and every card variant (narrow
> vertical, wide vertical, horizontal, wide list row).
>
> **🔴 OWNER-MANDATED COVERAGE (2026-06-07):** before editing anything you MUST produce a **global listing-card
> consumer inventory** (§A below), a **repo-wide hardcoded-currency sweep with classification** (§ validation), and a
> **test-coverage inventory** (§B below). `RecentlyViewedSection` is **explicitly in scope** — not "if it consumes
> StoryListingCard". A fix that resolves `System/ListingGrid` while leaving `RecentlyViewedSection`,
> similar/featured/latest/favorites/recently-viewed grids, the detail-page related cards, or **any** duplicate
> story-only card renderer broken is a **TASK FAILURE**. A fix limited to one locale, one viewport, or one story is a
> **TASK FAILURE**.

```
Type:        UI/component defect fix (listing pricing display) + Storybook fixture/story alignment + i18n unit-label fix
Priority:    HIGH — visible pricing corruption on the primary marketplace surface
Area (allowed to edit — this is the EXPECTED set; the §A inventory may EXPAND it, never shrink it):
  Canonical pricing render + formatter + label:
  - src/modules/listings/components/ListingCard.tsx        (PriceBlock — the shared live price renderer)
  - src/lib/formatters.ts                                  (only if the canonical formatter contract must be hardened/asserted)
  - messages/sq.json · messages/en.json · messages/uk.json · messages/it.json
        (the `listing.per_sqm` unit label — make it currency-FREE; see "Root cause #1")
  Storybook card(s) + fixtures + stories (mirror the canonical contract; no hardcoded currency):
  - src/stories/StoryListingCard.tsx
  - src/stories/fixtures/listing.fixture.ts               (raw number + currency/displayCurrency fixture data only)
  - src/stories/ListingGrid.stories.tsx
  - src/stories/RecentlyViewedSection.stories.tsx         (EXPLICITLY IN SCOPE — see §A + §RVS)
  Live listing-card consumers (verify each via §A; edit ONLY if it has independent pricing markup or breaks):
  - src/modules/listings/components/RecentlyViewedGrid.tsx
  - src/modules/listings/components/SimilarListings.tsx
  - src/modules/listings/components/FeaturedListings.tsx
  - src/modules/listings/components/LatestListings.tsx
  - src/modules/listings/components/FavoritesShell.tsx
  - src/modules/listings/components/ListingsShell.tsx
  - src/app/[locale]/listings/[slug]/page.tsx            (detail page per-m² render — remove the `.split('/')` hack)
  - any further consumer surfaced by the §A inventory (e.g. cabinet/admin listing rows) — classify, fix or justify
  Tests (NON-optional where infra exists — see §B + "Required automated assertions"):
  - the appropriate existing test files for formatter / i18n / data-contract behavior (add/extend)
  Governance:
  - docs/backlog.md  (mark Task 409 COMPLETE/pending-commit — append only, respect the 80-line cap)
  - docs/sessions/<date>-task409-*.md  (new session log — MUST contain the 3 mandated tables: consumer inventory,
    hardcoded-currency classification, test-coverage inventory)
NON-goal (do NOT touch): see "Out of scope" — listing data model, filters/search/sort, favorite/photo/gallery,
  click/navigation, status badges (unless a direct layout collision forces a minimal, documented change), any
  visual redesign of the card beyond the pricing row, deletion/duplication of stories, Epic JJ token swaps
  (pre-existing `text-[10px]` in StoryListingCard belong to Epic JJ Task 406 — do NOT convert them here; just do
  not introduce NEW hardcoded style values).
```

## Pre-read (load ONLY these — `docs/rule-index.md`)

**Always required:** `docs/agent-contract.md`, `docs/backlog.md`.
**UI / layout / component bundle:** `docs/design-system.md` (read first), `docs/ui-rules.md`, `docs/component-rules.md`, `docs/qa-rules.md`.
**Storybook / visual snapshot bundle:** `docs/storybook-governance.md`, `docs/storybook-visual-snapshots.md`.
**i18n:** `docs/i18n-governance.md` (this task edits `messages/*.json`).
**Only if relevant:** `docs/responsive-screenshot-governance.md`, `docs/responsive-screenshot-matrix.md`.

---

## Reproduction (examples only — NOT the full scope)

In Storybook → `System/ListingGrid` (Desktop / HugeDesktop / Mobile / LocaleStress), and on live listing cards, the
pricing area is broken:

1. **Duplicated currency / malformed price text** — the price-per-m² renders **two** currency markers, e.g.
   `571 USD €/m²` (a `USD` code **and** a `€` symbol), and on narrow cards the grouped main price can break mid-number
   into fragments like `42 85 2 USD`.
2. **Hardcoded currency** — the Storybook card renders a literal `€` regardless of the selected currency.
3. **Misalignment** — main price and price-per-m² look like two unrelated elements with inconsistent baseline / gap.
4. **Internal wrapping** — the price-per-m² cluster splits across lines (`€667` / `/m²`, or `m` / `²`).
5. Appears across **all** card variants: narrow vertical, wider vertical, horizontal, very wide list row.
6. Appears in **`RecentlyViewedSection`** Storybook stories and any other surface that renders a listing card.

**Known screenshots and the named stories are reproduction examples only. They are NOT the full scope.**

---

## Global scope rule (MANDATORY — read before anything else)

This task is **not limited to `System/ListingGrid`**. The fix MUST cover **every** surface that renders listing-card
pricing, including but not limited to:

- `System/ListingGrid` stories;
- **`RecentlyViewedSection` stories** (explicitly — see §RVS);
- live listing grids (the `/[locale]/listings` results grid);
- favorites / saved listings, if present;
- featured listings, if present;
- latest listings, if present;
- similar listings, if present;
- recently-viewed listings (live), if present;
- listing **detail-page** related-card sections, if present;
- **any story/demo card renderer** that visually represents a listing card;
- **any duplicated or near-duplicated listing-card pricing markup** found by repository search.

**You must NOT self-narrow to ListingGrid only.** If the §A inventory finds a surface not listed in "Area (allowed to
edit)", that surface is still in scope: add it to the inventory, fix it (or prove it needs no change), and document it.

---

## §A — Global listing-card consumer inventory (MANDATORY — produce BEFORE editing any code)

Before changing a single line, inventory **every** listing-card consumer and every listing-card-like renderer (live and
Storybook). Run at minimum these searches and reconcile every hit:

```
rg -n "ListingCard|StoryListingCard|ListingGrid|RecentlyViewedSection|recently viewed|Featured|Latest|Similar|Favorites|favorite listings|listing card|pricePerSqm|price_per|per_sqm|formatPrice\(|toLocaleString\(|€/m²|€/м²|€\{|USD|EUR|ALL" src app components modules stories messages tests
rg -n "from .*ListingCard|<ListingCard|from .*StoryListingCard|<StoryListingCard|RecentlyViewedSection|ListingGrid" src app components modules stories tests
```

Produce this table in the session log (one row per surface; no surface omitted):

| Surface | File | Uses live ListingCard? | Uses StoryListingCard? | Has independent price markup? | Has hardcoded currency? | Must be changed? | Reason |
|---|---|---|---|---|---|---|---|

**The task is INCOMPLETE if this inventory table is missing or omits any surface returned by the searches above.**

---

## §RVS — RecentlyViewedSection is EXPLICITLY in scope (not conditional)

`RecentlyViewedSection` is **explicitly in scope**. You MUST:

1. Inspect both the `RecentlyViewedSection` **stories** (`src/stories/RecentlyViewedSection.stories.tsx`) and the live
   implementation (`src/modules/listings/components/RecentlyViewedGrid.tsx` and any `RecentlyViewedSection` component),
   and **prove** whether each consumes `StoryListingCard`, the live `ListingCard`, or an **independent renderer**.
2. If it consumes the shared/canonical card renderer → provide **rendered evidence** that `RecentlyViewedSection` is
   fixed (it must appear in the rendered validation matrix, not be assumed-fixed).
3. If it has **independent price markup** → either route it to the **canonical shared pricing renderer/contract**, or
   update it to the **same canonical pricing contract** (currency-free label + single `formatPrice` path + atomic
   non-breaking clusters). Document which choice you made and why.

**The task is INCOMPLETE if `RecentlyViewedSection` is not present in BOTH the §A consumer inventory table AND the
rendered validation matrix.**

---

## §Shared-renderer rule — no duplicate pricing markup (MANDATORY)

The **preferred** fix is a **single canonical listing-pricing renderer/contract** used by all listing-card variants.

- Do **not** maintain separate, duplicated pricing markup across live `ListingCard`, `StoryListingCard`,
  `RecentlyViewedSection`, or any other card-like surface.
- If `StoryListingCard` cannot import the exact live component for Storybook/governance reasons, it MUST still use the
  **same canonical formatter + data contract** and an **intentionally mirrored** pricing substructure (same class
  structure, same atomic-cluster wrapping, same label).
- **Any remaining duplicate pricing renderer must be explicitly justified** in the session log (why it cannot be
  consolidated, and how it is kept in lock-step with the canonical contract).

---

## §B — Automated test-coverage inventory (MANDATORY — produce BEFORE editing product/story/test code)

Inspect the existing test stack and determine whether listing-card pricing is already covered. Run at minimum:

```
rg -n "ListingCard|StoryListingCard|ListingGrid|RecentlyViewedSection|formatPrice|per_sqm|pricePerSqm|currency|preferred_currency|displayCurrency" tests src app components modules stories
```

**Do not edit implementation, stories, fixtures, messages, or tests before this table is produced in the session log.**

Produce this table in the session log:

| Area | Existing test file? | Existing assertion? | Gap | Action in this task |
|---|---|---|---|---|

Areas that MUST appear as rows:
- `formatPrice` single-currency output;
- `per_sqm` label currency-free in sq/en/uk/it;
- `ListingCard` main price one currency marker;
- `ListingCard` price-per-m² one currency marker;
- old price uses the same currency path;
- `StoryListingCard` does not hardcode `€`;
- `StoryListingCard` uses raw number + `displayCurrency` fixture;
- `RecentlyViewedSection` rendered cards do not duplicate currency;
- selected/mocked display currency changes main price AND price-per-m² together;
- no-area / zero-area omits price-per-m² without a dangling unit;
- uk long/grouped number does not split visually at 320/375/390.

**The task is INCOMPLETE if this test-coverage inventory table is missing.**

---

## Root cause (already investigated by the orchestrator — verify, then fix at the source; do NOT apply a blind CSS-only patch)

> A CSS-only patch is FORBIDDEN here because the primary defects (#1, #2) are **data/format composition** bugs, not
> layout bugs. You must fix the formatter/label/data path first, then fix layout (#3, #4) on top.

**Root cause #1 — the i18n unit label carries a baked-in currency symbol.**
`messages/*.json → listing.per_sqm` is currently `"€/m²"` (uk: `"€/м²"`). The live `ListingCard` and the story card
**append this whole label after an already-currency-formatted number**:
- `ListingCard.tsx` `PriceBlock` (≈ line 84-88): `{formatPrice(pricePerSqm, activeCurrency, locale)} {perSqmLabel}`
  → `571 USD` + ` ` + `€/m²` = **`571 USD €/m²`** (two currency markers).
- `formatPrice(price, currency, locale)` (`src/lib/formatters.ts`) already returns `"<number> <CODE>"` (e.g. `571 USD`).
- Proof this label is a known footgun: the **detail page already works around it** at
  `src/app/[locale]/listings/[slug]/page.tsx:408` with `…/{t('per_sqm').split('/')[1] ?? 'm²'}` — i.e. it strips the
  `€/` prefix off the message. That hack must be removed once the label is currency-free (see required fix).

**Required fix for #1:** make `listing.per_sqm` a **currency-free unit label** in all four locales:
- `en` / `sq` / `it`: `"/m²"`  ·  `uk`: `"/м²"`  (keep the `²` superscript char exactly; do NOT degrade to `m2`).
- Then the canonical render is `formatPrice(pricePerSqm, currency, locale) + " " + t('per_sqm')` →
  `571 USD /m²` (one currency marker, from `formatPrice`).
- Update the detail page (`page.tsx:408`) to use the clean label directly and **delete the `.split('/')` hack**.
- Grep the whole repo for any other unit label that bakes in a currency symbol (e.g. a stray key whose value is
  `€/m²`); if you find another consumer that genuinely relies on the old `€/m²` literal, **STOP and ASK** — do not
  guess.

**Root cause #2 — the Storybook card hardcodes `€` and diverges from the live formatter path.**
`src/stories/StoryListingCard.tsx` (≈ lines 167-185) renders:
- `€{data.price.toLocaleString()}`, `€{data.price_old.toLocaleString()}`, and `€{pricePerSqm} {t('per_sqm')}`.
This (a) hardcodes the `€` symbol, (b) bypasses the canonical `formatPrice`, (c) uses bare `.toLocaleString()` (no
explicit locale → SSR/CSR drift + locale-dependent grouping spaces that wrap), and (d) double-prints currency via the
`€/m²` label. The story card MUST be brought onto the **same canonical path** as the live card.

**Required fix for #2:** the story card must render price via `formatPrice(value, currency, locale)` (same import the
live card uses) using a **mocked selected currency that comes from the fixture**, not a hardcoded `€`. The mock must be
explicit and must not re-format an already-formatted string. (See "Storybook" + "Currency rule".)

**Root cause #3 — main price ↔ per-m² misalignment / inconsistent vertical rhythm.**
`PriceBlock` uses `flex items-start justify-between` with the per-m² as a separately-aligned right element, so the
per-m² baseline does not line up with the price baseline, and the gap differs between the vertical and horizontal
variants (and from the story card, which has its own copy of the markup). Fix the alignment in the **single shared
`PriceBlock`** so both values share an intentional baseline/gap, and make the story card reuse the identical structure.

**Root cause #4 — the price-per-m² cluster (and the grouped main price) can split internally.**
The per-m² is a single `<span>` containing `formatPrice(...) + " " + label` with a normal space, so it can break
between the number, the currency, the slash, and `m²`. The main price uses `Intl.NumberFormat(locale)` whose `uk`
grouping separator is a (narrow) no-break/space character that can also wrap → `42 85 2 USD`. Fix by making each
price token an **atomic, non-breaking cluster** and letting the **whole** per-m² cluster wrap as one unit.

**Root cause #5 — variant divergence.** Vertical, horizontal, and the story card render pricing through three
near-duplicate code paths. Consolidate so all variants render the pricing row through the **single** `PriceBlock`
contract (Note 14 — global change, no diverging call sites, no one-off clone).

---

## Required after-behavior (exact, per defect)

### Currency rule (MANDATORY)
- **Exactly one** currency marker for the **main price**.
- **Exactly one** currency marker for the **price-per-m²** value.
- Both the main price and the price-per-m² derive their currency from the **same canonical selected-currency source**
  already used by the product: the resolved `displayCurrency`/`activeCurrency` on `ListingCard` (which flows from
  `user.preferred_currency` / `?currency=` / fixture), passed into `formatPrice(value, currency, locale)`. The
  per-m² MUST use the **same** `activeCurrency` as the main price (it already receives it — keep them bound to one source).
- **Do NOT hardcode** `USD`, `EUR`, `€`, `ALL`, or any currency symbol/code in `ListingCard` / `StoryListingCard`
  pricing UI. The ONLY allowed currency literal is **controlled fixture data** for a deliberate story/test scenario.
- In Storybook, the mocked account/display currency MUST be **explicit fixture data** and MUST NOT cause
  double-formatting (no `€` prefix on top of `formatPrice`).
- Switching the mocked/selected currency fixture MUST change **both** the main price and the per-m² value
  **consistently** (same code/symbol on both).

### Formatting rule (MANDATORY — single canonical path)
- There must be **one** canonical formatting path for listing price display: a **raw numeric value** goes into
  `formatPrice(value, currency, locale)`; the formatter returns the display text; the display component does **not**
  append another currency (the unit label is currency-free per Root cause #1).
- This class of bug MUST be impossible after the fix:
  - raw numeric price + already-formatted currency string + another currency suffix;
  - a formatted price passed back into another formatter;
  - currency printed by **both** the data/formatter **and** the UI label;
  - a story fixture that contains currency text which is then formatted again.
- Normalize the data contract where needed so fixtures carry **raw numbers + a currency code**, never pre-formatted
  price strings.

### Layout rule (MANDATORY)
- Main price and price-per-m² belong to **one pricing row/group**.
- On cards wide enough, they align cleanly on one row with an **intentional, consistent baseline** and gap.
- Vertical rhythm between **title → price row → divider → meta/features row → location row** must be consistent
  **across all variants** (vertical, horizontal, wide list).
- If the row cannot fit, the **whole** price-per-m² cluster moves to the next line (allow the row to wrap, e.g.
  `flex-wrap`), and the per-m² cluster is **internally non-breaking** (`whitespace-nowrap` on the cluster).
- The main price token must also be internally non-breaking so locale grouping spaces (uk) cannot split the number
  (`42 852 USD` stays whole; never `42 85 2 USD`).
- These broken fragments must be impossible: `€667` on one line + `/m²` on another; `667 €` split from `/m²`; the
  currency symbol/code separated from the amount; `m` separated from `²`.

---

## Positive flow (happy path)

**Actor:** anonymous or logged-in visitor viewing a listing grid (`/[locale]/listings`, favorites, featured, latest,
similar, recently-viewed) and the `System/ListingGrid` Storybook stories.
**Preconditions:** listings have `price` (raw number) + `currency` (`ALL`/`EUR`), optional `price_old`, `area_gross`/
`area_sqm` > 0. A selected display currency exists (`user.preferred_currency` / `?currency=` / story fixture).

1. Visitor opens a grid → each `ListingCard` resolves `activeCurrency` from the selected-currency source.
2. Main price renders once via `formatPrice(displayPrice, activeCurrency, locale)` → e.g. `42 852 USD` (one marker),
   as a single non-breaking token.
3. If `price_old` exists and is higher, the strike-through old price renders via the **same** formatter/currency.
4. Price-per-m² renders once as an atomic cluster `formatPrice(pricePerSqm, activeCurrency, locale) + " " + t('per_sqm')`
   → e.g. `571 USD /m²` (one marker), non-breaking internally.
5. Price row lays out with consistent baseline/gap; on a wide card both values sit on one row.
6. **Success state:** no duplicated currency anywhere; main + per-m² share the selected currency; clusters never split
   internally; per-m² wraps as a whole unit when space is tight; rhythm is consistent across all variants.
7. **Post-conditions:** identical correct behavior in `sq/en/uk/it`; switching the currency fixture updates both values
   together; the Storybook stories render the same canonical output as the live card.

## Negative flow (every off-happy-path branch — implement ALL applicable)

- **No `area_gross`/`area_sqm` (or = 0):** price-per-m² is omitted entirely (no empty cluster, no stray `/m²`, no
  dangling separator). Main price still renders correctly.
- **No `price_old` / not reduced:** no strike-through element; no layout gap left behind; no "price reduced" artifact.
- **Currency conversion unavailable (no `rates`, or `displayCurrency === listing.currency`):** fall back to
  `listing.currency`; still exactly one marker; no `originalPriceStr` duplication producing a second currency line that
  reads as a "duplicate".
- **Very large price / very small price (e.g. `600` rent vs `155000` sale):** both render as one non-breaking token,
  one marker, correct grouping per locale; no split.
- **Long title (line-clamp-2) pushing the price row:** price row keeps its rhythm; per-m² wraps as a whole if needed.
- **Narrowest card at 320 (uk):** grouped number does not split; per-m² cluster wraps whole, never internally; no
  horizontal scroll.
- **Locale = uk** (Cyrillic `м²`) and **sq/en/it** (`m²`): unit label localized + currency-free; `²` intact.
- **Story with a `sold`/`rented` overlay or `archived` grayscale:** pricing still renders correctly underneath; no
  regression to overlay/badges.
- Each branch above must have a verifiable line in the diff (guard / conditional render / class), not just the happy path.

---

## 🔴 Mobile <640 full-width gate (OWNER P0 — MANDATORY)

The pricing row lives **inside** the `ListingCard` content column, which is already full-width within the card; the card
itself is full-width in the single-column mobile grid. Requirements for this task:
- The pricing row container MUST span the **full width** of the card content column at `max-sm` (no fixed width, no
  `w-auto` shrink that detaches the per-m² to a cramped corner). Use `w-full` on the row and let the per-m² wrap
  full-line beneath the price when space is tight.
- Touch targets unrelated to price (favorite, copy-id) keep ≥44px — **do not shrink them**.
- Labels (`/m²`, currency) must **wrap as whole clusters**, never clip, never cause horizontal scroll at 320 in any of
  sq/en/uk/it.
- **Exemptions:** none new. (The card is not a popup; no bottom-sheet behavior is in scope here. If you believe a
  popup/positioner is involved, STOP and ASK.)

---

## Responsive coverage (MANDATORY — all canonical breakpoints)

Validate at **320, 375, 390, 480, 560, 680, 768, 810, 960, 1024, 1200, 1440, 1920, 2560**.
Coverage MUST include: narrow vertical cards; normal vertical grid cards; horizontal cards; very wide row/list layout;
long titles; short titles; large prices; small prices; price-per-m² with a currency **code** (and a **symbol** if the
app renders symbols anywhere — note that today `formatPrice` emits 3-letter codes; if you introduce symbol rendering,
STOP and ASK). **uk @ 320 / 375 / 390 are mandatory stress cells** (Cyrillic + grouping spaces) — they are a subset,
not the whole scope.

## Localization coverage (MANDATORY)

All four locales: **sq, en, uk, it**.
- No hardcoded English/Albanian/Ukrainian/Italian strings in `ListingCard`/`StoryListingCard` pricing UI.
- The `per_sqm` label stays **localized + currency-free** in all four files, same key set, no missing locale.
- No locale-specific formatting regression (grouping, currency position).
- `m²` / `м²` stays typographically correct; never degrades to `m2` or mojibake.

## Storybook coverage (MANDATORY)

- Update `StoryListingCard` + fixture so they reflect the **canonical data contract** (raw number + currency code +
  mocked display currency) and render via `formatPrice` — identical output shape to the live card.
- Cover **all** relevant `System/ListingGrid` stories/variants (Desktop, HugeDesktop, Mobile, LocaleStress) **and ALL
  relevant `RecentlyViewedSection` stories/variants** (explicitly — `RecentlyViewedSection` is in scope per §RVS, NOT
  conditional), **and every other listing-card surface found by the §A inventory**.
- Add (or extend) a story scenario that **switches the mocked display currency** so the "both values use one selected
  currency" behavior is visible/assertable.
- **Do NOT** hide the bug by deleting stories, duplicating stories, removing problematic states, or pinning a single
  locale. No `parameters.layout: 'centered'|'padded'`, no `/Ukrainian/`-named export, no `globals:{locale:'uk'}` pin
  (storybook-governance §14 / agent-contract clause 13). Strings come from `storyT`/`t()` with full sq/en/uk/it parity.

---

## Validation requirements (run ALL before claiming complete — paste transcripts into the session log)

1. **🔴 Repo-wide hardcoded-currency + formatter-composition sweep (MANDATORY — checking only ListingCard.tsx and
   StoryListingCard.tsx is NOT enough and is a TASK FAILURE).** Run:
   ```
   rg -n "€|\\$|USD|EUR|ALL|€/m²|€/м²|€\{|\$\{|toLocaleString\(|formatPrice\(" src app components modules stories messages tests
   ```
   Classify **every** hit in the session log as exactly one of:
   - allowed controlled **fixture/test data** (raw code only, never concatenated into a display string);
   - allowed **documentation/comment**;
   - **canonical formatter call** (`formatPrice(...)`);
   - **defect fixed in this task**;
   - **unrelated surface**, with a stated reason;
   - **STOP-and-ASK ambiguity** (escalate; do not guess).

   Rules: **hardcoded currency is FORBIDDEN in listing-card pricing render UI.** Allowed fixture currency codes must be
   **raw controlled data only** and must **not** be concatenated into a display string (e.g. no `` `€${n}` ``, no
   `'€' + n`, no `€{n}` JSX). Also confirm: `per_sqm` label is currency-free in all 4 locales; no `€/m²`/`€/м²` literal
   remains anywhere; no `.split('/')` per-m² hack remains in `page.tsx`.
2. **🔴 Automated tests are NON-optional where infra exists (MANDATORY).** You MUST add or extend the most appropriate
   existing automated tests for the affected layers (formatter / i18n / data-contract). See "Required automated
   assertions" below for the exact assertions. If the repo has **no** suitable test infrastructure for a specific layer,
   you must document the **exact** blocker (what infra is missing, with repo proof) AND provide rendered/screenshot
   proof for that layer — but this does **not** remove the obligation to test everything that **can** be tested. A vague
   "no tests appropriate" with no repository proof is **NOT accepted**. The final report must state: tests found; tests
   added/extended (with commands + transcripts); test gaps remaining; why each remaining gap cannot be closed in Task 409.
3. **Type / lint / build:** `npx tsc --noEmit` → 0 errors; `npm run lint` → 0 new; `npm run build` (non-trivial change).
4. **Governance gates:** `npm run check:stories`, `npm run check:i18n` (and the i18n-hardcode scanner) → exit 0; show a
   **negative-flow** transcript (planted violation → gate FAILS) for at least `check:stories` to prove it bites.
5. **File-integrity (clause 14):** for EVERY touched file — `tr -cd '\000' < f | wc -c` = 0, no BOM, `.json` passes
   `JSON.parse` (`node -e`), `.ts/.tsx` compile, file not truncated. Paste the GREEN transcript.
6. **Rendered evidence (clause 12/13 — the ONLY accepted UI proof):** `npm run screenshots:assert` (or the project's
   `responsive-screenshots --assert`) producing the PNG/JSON matrix for **every in-scope `System/ListingGrid` story,
   every relevant `RecentlyViewedSection` story, and every other listing-card consumer found by the §A inventory**
   across the canonical breakpoints × sq/en/uk/it, **uk@320/375/390 mandatory**. Any inventory surface that is NOT
   rendered must be proven to use the already-rendered shared component (cite the import). tsc=0/build=✅ is NOT proof
   and never closes this task. A cell marked "no browser access / not checked" is an auto-fail.
7. **Self-validation block:** AC-by-AC audit table (every AC below → file:line OR rendered cell → ✅), the
   `Self-validation: tsc=0 · build=pass · AC table=all green · runtime locale=uk PASS · scope=clean` line, a UX-flow
   trace, and a before/after control inventory of the card (prove nothing was removed).
8. **Files Changed table** in the session log — one row per touched path + 1-line rationale. **Do NOT run git / do NOT
   emit `git add`/`git commit`** — the orchestrator emits commit commands at review (single-writer rule, clause 10).

### Required automated assertions (add these where technically possible; document any that genuinely cannot be expressed)

**Formatter / i18n assertions:**
- `formatPrice(number, currency, locale)` returns **exactly one** currency marker.
- `listing.per_sqm` in **sq / en / it** is `"/m²"`.
- `listing.per_sqm` in **uk** is `"/м²"`.
- **No** locale value for `listing.per_sqm` contains `€`, `$`, `USD`, `EUR`, or `ALL`.
- The detail page no longer uses `split('/')` on `per_sqm`.

**Data-contract / story assertions:**
- Story fixtures carry **raw numeric** price values and **currency/displayCurrency** values, not preformatted display strings.
- `StoryListingCard` does not render literal `€{`-style (or `${`/`$(`-style) hardcoded currency prefixes.
- Switching the mocked `displayCurrency` changes **both** the main price and the price-per-m².

**Rendered / screenshot assertions:**
- `System/ListingGrid` passes all required stories/variants.
- `RecentlyViewedSection` passes all relevant stories/variants.
- Every other listing-card consumer found by the §A inventory either has rendered proof, or is proven to use the
  already-rendered shared component.
- **uk @ 320 / 375 / 390** are included as stress cells.
- **sq / en / uk / it** and ALL canonical breakpoints are covered:
  **320, 375, 390, 480, 560, 680, 768, 810, 960, 1024, 1200, 1440, 1920, 2560**.

Zero new lint/build/governance issues is required.

---

## Out of scope (FORBIDDEN — do not do any of these)

- Redesigning the listing card beyond the pricing row.
- Changing the listing business data model beyond what is strictly required for correct currency formatting.
- Changing unrelated listing filters / search / sorting.
- Changing favorite / photo / gallery behavior.
- Changing card click / navigation behavior.
- Changing listing availability/status badges — unless a direct layout collision with the pricing row forces a
  **minimal, documented** change (if so, document it explicitly).
- Deleting or duplicating stories to hide the defect.
- Limiting the fix to only `uk`, only one viewport, or only the exact screenshot state.
- Epic JJ token swaps (e.g. converting pre-existing `text-[10px]` → `text-2xs` in `StoryListingCard`) — that is Task
  406. Do not regress, but do not do JJ's work here; just avoid introducing NEW hardcoded style values.

---

## Acceptance criteria (every item must be verifiable in the diff AND in the rendered matrix)

1. No `ListingGrid`/`ListingCard` price shows a duplicated currency (no `571 USD €/m²`-style double marker).
2. The main price uses **exactly one** selected-currency marker.
3. The price-per-m² uses **exactly one** selected-currency marker.
4. Main price and price-per-m² use the **same** selected-currency source.
5. Switching the mocked/selected currency fixture changes **both** values consistently.
6. The price-per-m² is one **unbroken atomic cluster** (currency, number, slash, `m²` never split).
7. When the pricing row lacks horizontal space, the **whole** price-per-m² cluster wraps to the next line.
8. No internal split occurs inside the price-per-m² cluster (and the main grouped number never splits — no `42 85 2`).
9. Main price ↔ price-per-m² alignment is visually consistent across vertical / horizontal / wide list variants.
10. Vertical rhythm/gaps (title → price → divider → meta → location) are consistent and intentional across variants.
11. All four locales (sq/en/uk/it) pass; `per_sqm` is localized + currency-free; `m²`/`м²` intact.
12. All canonical breakpoints pass (320·375·390·480·560·680·768·810·960·1024·1200·1440·1920·2560), uk@320/375/390 proven.
13. No existing `ListingCard` behavior (favorite, copy-id, badges, overlays, features, location, date) is silently removed.
14. No stories are deleted or duplicated to hide the issue; no `layout:centered/padded`, no `/Ukrainian/` export, no locale pin.
15. The detail-page `.split('/')` per-m² hack is removed and renders the clean label.
16. All validation commands pass with **zero new** lint/build/governance/integrity issues; rendered matrix attached.

### Global-coverage acceptance criteria (owner-mandated, 2026-06-07)

17. **Every** listing-card pricing consumer is **inventoried** (§A table) before any change.
18. **`RecentlyViewedSection` is explicitly checked and fixed/proven** — never conditionally ignored — and appears in
    both the §A inventory and the rendered validation matrix.
19. **No duplicated or independent** listing-card pricing renderer remains unless **explicitly justified** in the log.
20. **Every** listing-card-like Storybook surface uses the canonical **raw-number + currency/displayCurrency** contract.
21. The **repo-wide hardcoded-currency sweep** is completed and **every hit is classified** (six categories).
22. **No hardcoded currency render** remains in any listing-card pricing UI.
23. **Existing automated test coverage is inventoried** (§B table).
24. **Automated tests are added/extended** wherever the project has suitable infrastructure.
25. **Formatter/i18n tests prove** one-marker output and currency-free `per_sqm` labels (all 4 locales).
26. **Rendered proof covers** `System/ListingGrid`, `RecentlyViewedSection`, and **every** other listing-card surface
    found by the §A inventory.
27. The session log contains all **three** mandated tables: **consumer inventory**, **hardcoded-currency
    classification**, and **test-coverage inventory**.

---

## Final report (Sonnet MUST return all of the following)

1. **Listing-card consumer inventory table** (§A).
2. **`RecentlyViewedSection` status:** uses shared `ListingCard` / `StoryListingCard` / independent renderer; files
   changed or proof no change was needed; which rendered cells were checked.
3. **Hardcoded-currency sweep table** (every hit classified).
4. **Automated test-coverage inventory** (§B table).
5. **Tests added/extended** — with the exact commands and pasted transcripts.
6. **Remaining test gaps** (if any) — with the exact, repo-proven reason each cannot be closed inside Task 409.
7. **Confirmation that the fix is GLOBAL** across all listing-card pricing consumers, not only `System/ListingGrid`.

---

## Hard contract (verified against the diff on return)

Do not change scope · do not invent architecture (STOP & ASK on ambiguity) · execute ACs literally · implement BOTH the
positive and EVERY negative flow above · preserve existing controls + UX flow · sq/en/uk/it parity · all 14 breakpoints ·
rendered evidence is the only UI proof · read-after-write + file-integrity green · update `docs/backlog.md` +
`docs/sessions/` with a "Files Changed" table · **never run git yourself**.
