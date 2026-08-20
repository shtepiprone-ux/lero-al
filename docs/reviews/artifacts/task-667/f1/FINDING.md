# Task 751 (F1) — DOM -> owning-component mapping feasibility finding

**Task:** `tasks/Sprints/Sprint_59_kickoff_prompt_Task_751_F1_DOM_Component_Mapping_Feasibility.md`
**Owner decisions in force:** D-C (route-level real dev-server DOM is the proof), D-H (compact
text/JSON/HTML artifacts only), D-J (F1 is its own task; Task 667 stays `BLOCKED/reserved`).

## Result

**FAIL.** No candidate mechanism (M-a...M-d) satisfies all four pass criteria in the kickoff's §8.

Per the kickoff's own required framing (§8 "What a failure means, exactly"), verbatim:

> "In this build, no reliable automatic DOM->component mapping was demonstrated."

This does **not** mean an inventory is impossible, that Sprint 59 closes, or that Task 667 is
unachievable. It is a bounded measurement of the mechanisms actually tested in this build. **This
finding proposes no closure or re-scope of Sprint 59 or Task 667** — that is a separate owner
decision (§9 out-of-scope, D-J).

## Measurement conditions (kickoff §5, actually used)

| Parameter | Actual value |
|---|---|
| Route | `/sq` |
| Locale | `sq` |
| Viewport | 1440 x 900 |
| Hydration gate | `[data-testid="hero-search-card"]` present (count 1) AND `[data-testid="hero-search-fallback"]` absent (count 0), polled up to 20x/250ms before every run; all 3 runs hydrated on the first poll |
| Auth | Anonymous (no login performed) |
| React (resolved) | **19.2.4** — read from `node_modules/react/package.json` and `node_modules/react-dom/package.json` post-install, i.e. the exact version actually served by the dev server. **Limitation:** no in-page runtime read of the version was available — see M-a's `rendererCount: 0` below; this is disclosed as a gap, not asserted as an in-page read. |
| Dev server | `npm run dev` (Turbopack), raised locally, `http://localhost:3000`, stopped after the 3 runs completed |
| `<FIXTURE_SLUG>` | `11-mr7ucly4` (id `ece6db96-e145-41b3-9af9-3386e3e66b03`) — see "Fixture provisioning" below |

## Fixture provisioning (owner-approved deviation from a plain "seed the DB" step)

The only `is_premium=true` listing in the database (`11-mr7ucly4`) had already expired
(`expires_at: 2026-08-15T06:13:31.122Z`, run performed 2026-08-16), so nothing rendered in the
Featured section at task start — read-only confirmed via the same anon-key filter the app's
`getFeaturedListings()` uses (`docs/reviews/artifacts/task-667/f1/` probe predates this doc; the
read-only check is recorded in this finding, not as a separate artifact file, per D-H "compact"
guidance).

Because this Supabase project backs the live `lero.al` site (confirmed by in-repo comments, e.g.
the click-shield postmortem — "P0, live on lero.al" — referencing the same database), inserting or
mutating real listing rows was flagged to the owner rather than done unilaterally. Owner decision:
extend the existing expired listing's `expires_at` forward via the service-role key, run the probe,
then revert it to its exact original value. Sequence actually executed:

1. Read (anon key, read-only): confirmed `11-mr7ucly4` was the sole `is_premium` row and had
   expired.
2. Write (service-role key): `expires_at` -> `2026-08-23T17:56:24.304Z` (now + 7d). Verified via a
   second anon-key read using the app's exact filter chain (`status=active`,
   `expires_at >= now()`, `is_premium=true`) that the listing now qualifies.
3. Ran the dev server and all 3 probe runs (below).
4. Write (service-role key): `expires_at` reverted to the original `2026-08-15T06:13:31.122Z`.
   Verified by reading the row back — confirmed identical to the pre-task value.

No other row was created, deleted, or modified. This is disclosed here in full because it is a
real external-system (Supabase) mutation, even though it falls outside the git-tracked write set
in §9 — `docs/agent-contract.md` P0 invariant 2 ("no invented facts") and the general risky-action
guidance both call for full disclosure of a mutating action taken on shared state, even a
reverted one.

## Control locators actually used (§6/§7 — declared uniqueness required `querySelectorAll(...).length === 1`)

Two of the five declared bare locators were **not** unique on first measurement — both are
recorded as fixture-defect-class findings (§11 "a control locator is not unique" -> fix the
selector, not a mechanism failure) and were re-scoped, never treated as a mechanism result:

| # | Declared bare locator | Bare match count | Fixture defect | Scoped locator used | Scoped match count |
|---|---|---:|---|---|---:|
| C1 | `.site-footer` | 1 | none | `.site-footer` | 1 |
| C2 | `[data-listing-slug="11-mr7ucly4"]` | **2** | The fixture listing (the only `is_premium` row) renders in **both** the Featured grid (`is_premium=true` filter) and the Latest grid (`is_premium` sorted first, `limit 8`) simultaneously — a real structural consequence of using the only-available premium listing as the fixture, not a probe bug. | `[class*="muted"] [data-listing-slug="11-mr7ucly4"]` (Featured section is the only `MantineHomeSection variant="muted"` on this route, `src/app/[locale]/page.tsx:43`) | 1 |
| C3 | `<div>` at `AppImage.tsx:119`, within C2's subtree | 1 (once C2 unique) | none | `(first <img> inside C2).parentElement` — structural, not class-name-based (AppImage.tsx:120-127: the container `<div>` is the `<img>`'s direct DOM parent) | 1 |
| C4 | `.mantine-Notifications-root` | **6** | Mantine's `<Notifications>` unconditionally renders all 6 position containers (top-left/center/right, bottom-left/center/right — `MantineRootProvider.tsx:31-38` comment), regardless of which one is configured. | `.mantine-Notifications-root[data-position="top-right"]` (the actually-configured position, `MantineRootProvider.tsx:39`) | 1 |
| C5 | `[data-testid="hero-search-card"]` | 1 | none | (unchanged) | 1 |

All five scoped locators are recorded as **fixture defects**, not mechanism failures, per §11's
explicit instruction. Probe source: `docs/reviews/artifacts/task-667/f1/probe.mjs`.

## Reproducibility across 3 reloads (AC3)

Compared `run-1.json` (frozen baseline) against `run-2.json` and `run-3.json` — every control's
`domPath`, `domOwner`, `projectPlacerViaDebugSource` and `projectPlacerViaNameAllowlist` was
**byte-identical across all 3 independent reloads** (fresh browser launch + navigation each run).
`mechanismA` and `mechanismD` results were also identical across all 3 runs.

## AC1 — uniqueness assertion (recorded counts)

C1=1, C2(bare)=2 -> C2(scoped)=1, C3=1, C4(bare)=6 -> C4(scoped)=1, C5=1. Full per-run JSON:
`run-1.json`, `run-2.json`, `run-3.json` (each includes `matchCount`, `*_unscoped_matchCount`, and
the full fiber chain per control).

## AC2 — DOM owner vs project placer, per control (run 1; identical in runs 2-3)

"DOM owner" below is the **strict, literal** definition (nearest ancestor fiber, excluding the
host node itself, that is a component fiber — function/class/forwardRef/memo — regardless of
first- or third-party origin). "Project placer" is via the name-allowlist sub-mechanism of M-b
(the only one that produced any result at all — see M-b below).

| # | Locator matched | DOM owner (literal) | Project placer (name-allowlist) | Declared placer (kickoff §7) | Match? |
|---|---|---|---|---|---|
| C1 | `.site-footer` | `@mantine/core/Box` | **`MantineRootProvider`** | `FooterView` | **NO — wrong, not just missing (see M-b below)** |
| C2 | scoped `[data-listing-slug]` | `(anonymous forwardRef — next/link's Link)` | `ListingCard` | `ListingCard` | Yes |
| C3 | `(img).parentElement` in C2 | `AppImage` | `AppImage` | `AppImage` | Yes |
| C4 | scoped `.mantine-Notifications-root` | `@mantine/core/Box` | **`MantineRootProvider`** | owner: Mantine `Notifications`; placer: `MantineRootProvider` | Placer yes; owner differs from Mantine's own exported `Notifications` (see below) |
| C5 | `[data-testid="hero-search-card"]` | `@mantine/core/Box` | `HeroSearchView` | `HeroSearchView` | Yes |

**C4 satisfies the "owner != placer" requirement**: placer (`MantineRootProvider`) is reported and
is distinct from the literal DOM owner (`@mantine/core/Box`). The literal owner is `Box`, not
`Notifications` itself, because Mantine's `Notifications` component's own render call first
produces a `Box`, which then produces the host `div` — `Box` is the fiber that *directly* emits
the host element, one hop closer than the human-legible name `Notifications`. The same
Box-interposition pattern recurs at C1 and C5 (see "DOM owner is frequently a Mantine primitive,
not the intuitive component" below) — this is a real, reproducible property of the fiber tree, not
a probe defect.

## AC4 — mechanism verdicts (all four, with reasons)

### M-a — `__REACT_DEVTOOLS_GLOBAL_HOOK__`

**REJECTED.** `typeof window.__REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined'` was **true** in all 3
runs (`hookExists: true`) — the hook object itself is present in this Turbopack Next 15.5.18 dev
build even with no DevTools browser extension loaded, contradicting the kickoff's stated
possibility that it "may simply be absent." However, `hook.renderers.size` was **0** in every run
(`rendererCount: 0`) — no renderer ever registered into it. React-dom never completed the
handshake this hook exists to support (`hook.inject(rendererConfig)`), so there is no `rendererID`
to call `hook.getFiberRoots(rendererID)` / walk anything through the DevTools backend protocol.
**The hook object existing is necessary but not sufficient**; it is unusable here without an
actual DevTools agent attached to complete registration. Confirmed private/unstable regardless
(matches the kickoff's own framing): even a functional hook is not a public API.

### M-b — React internal fiber expando keys (`__reactFiber$*` / `__reactProps$*`)

**PARTIAL PASS**, and the mechanism this finding spent the most evidence on.

- **Key pattern observed:** `__reactFiber$<7-char base36 suffix>` / `__reactProps$<same suffix>`
  (sample: `__reactFiber$7m5eq7l9z1b`), present on every measured host node in all 3 runs. The
  expando itself is a reliable, always-present anchor into the fiber tree in React 19.2.4 — this
  part of M-b works unconditionally.
- **Sub-mechanism 1 — `_debugSource` (JSX call-site file per fiber):** **REJECTED.**
  `fiber._debugSource` was `null` on **every fiber in every ancestor chain, for all 5 controls, in
  all 3 runs** (see `fiberChain[].debugSource` in the run JSON — never non-null). This Next
  15.5.18 + Turbopack + React 19.2.4 dev build does not populate JSX call-site debug info on
  fibers. A mechanism relying on `_debugSource` to resolve "which src/ file authored this JSX
  call" is not usable in this build at all, independent of any exactness concern.
- **Sub-mechanism 2 — known-first-party-name allowlist walk** (nearest ancestor fiber whose
  `type.displayName`/`type.name` matches a pre-built manifest of first-party component names):
  correctly resolved 4 of 5 declared project placers (`ListingCard`, `AppImage`,
  `MantineRootProvider` for C4, `HeroSearchView`) but returned an **incorrect** value for C1 —
  `MantineRootProvider` instead of the declared `FooterView`.

  **Root cause (the decisive finding):** `FooterView` (`src/components/layout/FooterView.tsx`)
  carries no `'use client'` directive — it is a React Server Component. Server Components never
  materialize as fibers in the client-side tree; their JSX output is spliced directly into the
  nearest Client Component ancestor's rendered tree, with no trace of the Server Component's own
  identity surviving into the fiber graph. Walking the actual C1 ancestor chain
  (`run-1.json` -> `controls.C1.fiberChain`) confirms `FooterView` is **absent** entirely: index 0
  is the host `footer`, index 1 is `@mantine/core/Box` (Client Component, so it does have a
  fiber), and the chain then passes through `AuthProvider`, `IntlProvider`,
  `NextIntlClientProvider`, several Next.js internal boundaries, `ModalsProvider`,
  `MantineThemeProvider`, `MantineProvider`, and finally lands on `MantineRootProvider` at index
  31 — the allowlist walker matches there simply because it is the first name in its manifest it
  encounters, with no way to know it skipped past the true placer.

  This is not a "missing answer" the mechanism can flag as unknown — it is a **silently wrong,
  plausible-looking answer**, which disqualifies this sub-mechanism under pass criterion 2
  ("exact... no human disambiguation") for any first-party component that is Server-rendered. This
  project's own stated convention is to keep hook-free, prop-driven presentational components as
  Server Components where possible (`FooterView`'s own docstring: "Presentational... Prop-driven
  and hook-free"), so this is not an edge case specific to the footer — it applies to an unknown
  but non-trivial fraction of first-party UI.
- **DOM owner is frequently a Mantine primitive, not the intuitive component.** In 3 of 5 controls
  (C1, C4, C5), the literal nearest-ancestor-fiber "DOM owner" resolves to `@mantine/core/Box`
  (Mantine's polymorphic style-prop wrapper), one hop closer to the host element than the
  human-legible component (`FooterView`, `Notifications`, `HeroSearchView`). `Box` is a real
  function/forwardRef component with its own fiber — it is not an implementation detail invisible
  to the fiber tree. A mechanism that wants to report the "intuitive" owner needs a curated
  skip-list of known Mantine/framework primitives (`Box`, `Anchor`, `Text`, `next/link`'s `Link`,
  etc.) to look past — which is itself manual curation, not something the mechanism derives
  automatically, and the C1 failure above shows that skip-listing by name is exactly the class of
  heuristic that goes silently wrong for Server Components.

### M-c — build-time transform emitting a source-identifying attribute

**Evaluated on paper only, not implemented** (kickoff §8 explicit instruction; would write to
`src/`/build config, out of this task's write set per §9). This is the strongest candidate for
667 precisely because it would be evaluated at build/compile time, before the Server/Client
Component split collapses first-party identity out of the client tree — a build-time transform
(Babel/SWC/Turbopack plugin) that stamps each JSX-authored host element with a
`data-source-component`/`data-source-file` attribute would not depend on `_debugSource` (rejected
above), would survive Server Component flattening, and would depend on no private React runtime
internals. It requires its own owner decision (a new build-time transform touching `src/`/build
config) and is explicitly named here as the leading alternative for Task 667's Phase 3, not ruled
out by this finding.

### M-d — existing `data-testid` coverage

**Measured, disqualified as sole mechanism** (per the kickoff's own rule: any uncovered fraction
disqualifies it as the sole mechanism). Measured uncovered fraction: **0.9976** (847 of 849
elements under `<body>` on the hydrated `/sq` route lack a `data-testid`; only 2 carry one).
Methodology: denominator = `document.querySelectorAll("body *").length`; numerator = elements
carrying their own `data-testid` attribute (not inherited). Identical across all 3 runs. May serve
as a corroborating second signal for the small number of nodes that do carry a stable test id
(as used directly for C5 itself) — not as a mechanism for a complete inventory.

## AC5 — data-testid uncovered fraction

**0.9976442873969376** (847/849), identical in all 3 runs. See M-d above for methodology.

## AC6 — stability boundary

- **M-a:** Even if a DevTools agent were attached to make `rendererCount > 0`, `__REACT_DEVTOOLS_GLOBAL_HOOK__`'s shape is React DevTools' own private protocol, versioned independently of React itself; it has broken across DevTools major versions before and carries zero stability guarantee from React. Binds to whatever DevTools-backend protocol version is attached, not to a React version per se.
- **M-b (expando keys):** The `__reactFiber$*` / `__reactProps$*` prefix pattern is internal to `react-dom`'s `ReactDOMComponentTree` module and has changed prefix across major React versions historically (e.g. React 16/17 used `__reactInternalInstance$*`/`__reactEventHandlers$*` before the current `__reactFiber$*`/`__reactProps$*` naming introduced with the new reconciler surface). It is confirmed working for **react-dom 19.2.4** in this build; an upgrade past React 19 (or any react-dom internals refactor) can rename or remove these keys with no deprecation warning, since they are explicitly undocumented internals.
- **`_debugSource` sub-mechanism:** N/A — not populated in this build at all (React 19.2.4 + Next 15.5.18 + Turbopack dev), so it has no working baseline to bound.
- **Server-Component fiber invisibility:** Architectural (React's Server/Client Component split), not tied to a specific React patch version — this will remain true for any React version that keeps the current RSC architecture, and would only change with a fundamentally different Server Components implementation.
- **M-d:** No version dependency — `data-testid` is plain markup; the "boundary" is coverage, not framework version.

## AC7 — measurement conditions and fixture

Recorded in full above ("Measurement conditions" and "Fixture provisioning").

## AC9 — bounded meaning (verbatim, restated)

> "In this build, no reliable automatic DOM->component mapping was demonstrated."

No mechanism satisfied all four §8 pass criteria. This finding proposes **no** closure or
re-scope of Sprint 59 or Task 667; that remains a separate owner decision. M-c (build-time
transform) is named as the most promising untested alternative and needs its own owner decision
before any implementation.

## AC10 — no video/screen-recording artifacts

`docs/reviews/artifacts/task-667/f1/` contains only `probe.mjs` (script), `run-1.json`,
`run-2.json`, `run-3.json`, and this `FINDING.md`. No video or screen recording of any kind.

## Assumptions, deviations, and limitations

- **Deviation (owner-approved):** §6's "seed the database" was executed as "extend then revert an
  existing expired listing's `expires_at`" rather than inserting new rows, per explicit owner
  choice (see "Fixture provisioning"). Verified reverted to its exact original value.
- **Limitation:** React version (AC7/§5) was confirmed via `node_modules/react(-dom)/package.json`
  (the exact installed/resolved version the dev server serves), not via an in-page runtime read —
  no working in-page introspection surface was found (M-a's hook has zero registered renderers;
  no other page-side version signal was located). Disclosed, not asserted as a page-side read.
- **Limitation:** `domOwner`'s `typeName` resolution is imprecise for anonymous
  `forwardRef`/Context-provider fibers (rendered as `(object type: [object Object])` in raw
  output for a few chain entries, e.g. `next/link`'s internal `Link` at C2 index 1) — cosmetic,
  does not affect any AC or the pass/fail verdict, since project-placer resolution (the criterion
  that matters) does not depend on those entries.
- **Out of scope, not touched:** no `src/` path, no story, no inventory row, no
  `mantine-migration-scope.json`, no Task 667 registry row — confirmed by the final
  `git status --porcelain` recorded in the session log.
