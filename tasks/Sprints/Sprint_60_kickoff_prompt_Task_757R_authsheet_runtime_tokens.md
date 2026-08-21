# Task 757R — `AuthSheet`: remove the Tailwind runtime-token dependencies and restore the `h3` baseline

**Sprint:** 60 · **Type:** UI mechanism correction (D28) · **QA profile:** `Q4 Release/Critical Flow` · **Status:** KICKOFF FILED 2026-08-21

## Objective

Task 757 landed as `50d18411f` with two defects of the same class: it reproduced Tailwind's *tabled* values and its
*runtime internals* instead of the values the old screen actually rendered, expressed by Mantine's own means.
Correct both. **Zero behaviour delta. The visual target is the pre-757 render, not the post-757 render.**

Owner framing, binding for this task: *Tailwind is the baseline only — it shows what the old screen really rendered.
The goal is to reproduce that result with Mantine, not to carry Tailwind internals across.*

## Verified context — read 2026-08-21, all of it grepped, none of it inferred

### 1. The `h3` baseline is 22.5px, not 28px

From the production build (`.next/static/css/*.css`), verbatim:

```
h1,h2,h3,h4,h5,h6{--tw-leading:var(--leading-tight);line-height:var(--leading-tight);--tw-font-weight:600;--tw-tracking:-.025em;letter-spacing:-.025em;font-weight:600}
.text-lg{font-size:1.125rem;line-height:var(--tw-leading,1.75rem)}
--leading-tight:1.25;
```

The base `h1..h6` rule writes `--tw-leading: 1.25` onto the element itself, so `.text-lg`'s
`line-height: var(--tw-leading, 1.75rem)` resolved to **1.25**, never to its `1.75rem` fallback.
Pre-migration computed line-height: **18px x 1.25 = 22.5px**. Task 757 shipped `1.75rem` = 28px.

The original value is **unitless**. A unitless line-height inherits as a ratio; `1.75rem` does not. Reproducing it
as a length is a second, separate deviation from the baseline even where the computed px happens to match.

### 2. Mantine's `lh` prop passes a number through unchanged

`node_modules/@mantine/core/cjs/core/Box/style-props/resolvers/line-height-resolver/line-height-resolver.cjs`:

```js
function lineHeightResolver(value, theme) {
  if (typeof value === "string" && value in theme.lineHeights) return `var(--mantine-line-height-${value})`;
  if (typeof value === "string" && headings.includes(value)) return `var(--mantine-${value}-line-height)`;
  return value;
}
```

A number is returned as-is. `theme.ts:224` sets `fontSizes.lg = 1.125rem` = 18px, so
`<Text component="h3" fw={600} size="lg" lh={1.25}>` computes **22.5px**, unitless, through Mantine's own style-prop
system rather than a hand-written `style={{ }}` object.

### 3. `var(--ease-standard)` and `var(--duration-*)` must NOT be used — they do not exist at runtime

`src/app/globals.css:273` defines `--ease-standard: cubic-bezier(0.4, 0, 0.2, 1)`, which is exactly Tailwind's
`--default-transition-timing-function`. **It is nevertheless unusable here.** The declaration sits inside the
`@theme inline { ... }` block opened at `globals.css:35`. `@theme inline` inlines values into generated utilities
and does not emit them as `:root` custom properties, and the build confirms it:

```
grep -c "ease-standard" .next/static/css/*.css   -> no stylesheet matches
grep -c "duration-base" .next/static/css/*.css   -> no stylesheet matches
grep -rn "ease-standard" src/                    -> only its own definition line
```

A CSS Module writing `var(--ease-standard)` would resolve to nothing and `transition-timing-function` would fall
back to its initial value `ease`. **This is the `--z-sticky` failure mode** documented in
`docs/orchestrator-procedures.md` ("A documented token is not an implemented token") and `docs/design-system.md`
§22.3 — a declaration that is invalid at computed-value time and silently takes the property's initial value, which
no repository gate detects.

Duration tokens that do exist: `--duration-fast: 100ms`, `--duration-base: 200ms`, `--duration-slow: 300ms`
(`globals.css:267-269`). **None equals the 150ms baseline.**

**Therefore both values must be literals.** This is the owner's own fallback branch, reached by evidence, not by
convenience.

### 4. What the Tailwind internals currently resolve to

```
--default-transition-duration:.15s;
--default-transition-timing-function:cubic-bezier(.4,0,.2,1);
```

Baseline to reproduce: `transition-duration: 150ms`, `transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1)`.

`transition-property` is **not** in scope for change. Task 757 already shortened it from Tailwind's ten entries to
seven by dropping `--tw-gradient-from/via/to`; no element in this tree carries a gradient, the owner authorised that
in D757-7, and it introduces no runtime-token dependency. Leave it exactly as it is.

### 5. Why this matters beyond style purity

`--default-transition-duration` and `--default-transition-timing-function` are Tailwind's own theme defaults. When
Tailwind is removed from the project — the purpose of the entire de-Tailwind programme — both become undefined,
`transition-duration` falls back to `0s`, and every hover transition on these links stops working. `check:design-tokens`
cannot see it: its own arm exempts anything *shaped* like `var(--token)` without resolving it.

### 6. Out-of-scope siblings, named so they are not silently forgotten

Five other modules carry the identical dependency and are **not** part of this task:
`src/components/layout/MobileBottomNavView.module.css`, `src/components/layout/MobileNavDrawer.module.css`,
`src/design-system/mantine/patterns/MantineCopyIdButton.module.css`,
`src/design-system/mantine/patterns/MantineListingCardPattern.module.css`,
`src/modules/notifications/components/NotificationItem.module.css`.
`AuthSheet.module.css` copied the pattern from `MantineCopyIdButton` (Task 656) and says so in its own header.
A separate corrective task must cover them; do not touch them here.

## Canonical UI decision record

| Visible artifact | Search queries and inspected paths | Canonical story/source | Disposition | Required implementation and registration |
|---|---|---|---|---|
| Success-title `h3` (x2) | `theme.ts` `fontSizes`/`headings`; Mantine `line-height-resolver`; `Patterns/Mantine/AuthSheet` Story | Mantine `Text` style prop `lh` — the framework's own line-height mechanism | `reuse` | `lh={1.25}` on both sites; no new shared source; existing canonical Story already renders both components |
| Hover-link transition (4 module classes) | `globals.css` `@theme inline` tokens; `.next/static/css/*.css` emission check; `grep -rn ease-standard src/` | **Verified absent at runtime** — no qualifying project or Mantine token | `create local literal` | Literal `150ms` / `cubic-bezier(0.4, 0, 0.2, 1)` in `AuthSheet.module.css` with `design-tokens-allow:` markers stating the provenance and why no token qualifies |

The second row is a verified absence, recorded per contract clause 16a: the value has provenance (the compiled
Tailwind default, quoted above), and the absence of a usable token is proven by build emission, not assumed.

## Scope

- `src/modules/auth/components/AuthSheet.tsx` — the two success-title `h3` sites only (`:225`, `:654`).
- `src/modules/auth/components/AuthSheet.module.css` — the four classes carrying `var(--default-transition-*)`
  (`.linkMutedXs`, `.linkMutedSm`, `.agentBackLink`, `.linkPrimarySm`), plus the module header comment that
  currently states the Tailwind-internal-token rationale.
- `docs/sessions/` new session log; `docs/backlog.md`.

## Out of scope

The five sibling modules in §6 · `MantineAddItemPanel` · every other `AuthSheet` line · any auth logic, validation
rule, Supabase call, or string · `transition-property` · the `line-height` literals on the `<p>`-derived `Text`
sites, which correctly reproduce the real `p{leading-relaxed}` render and are not affected by this correction.

## Current behavior to preserve

Everything Task 757 got right: all four auth flows and view switching, `AUTH_SHEET_EVENT` /
`AUTH_SHEET_CLOSED_EVENT`, captcha and `PhoneField`, every `t()` key, `aria-*`, `data-testid`, the "or" separator,
`MantineAddItemPanel` consumption, the canonical Story and its scope registration, and every geometry value proven
identical by the 78-cell matrix.

## Required after behavior

- Both success-title `h3` compute `line-height: 22.5px`, unitless, with `letter-spacing: -0.025em` and
  `font-weight: 600` unchanged.
- The four link classes animate with `150ms` and `cubic-bezier(0.4, 0, 0.2, 1)`, resolved without reference to any
  Tailwind runtime token.
- No `--tw-*`, no `--default-transition-*`, and no other Tailwind runtime-token dependency remains in either file.

## Functional requirements

| ID | Requirement |
|---|---|
| R1 | Replace `style={{ lineHeight: '1.75rem' }}` with `lh={1.25}` on both `Text component="h3" fw={600} size="lg"` sites. No inline `style` object for line-height on either. |
| R2 | Replace all eight `var(--default-transition-timing-function)` / `var(--default-transition-duration)` declarations with the literal baseline values, each carrying a `design-tokens-allow:` marker that states the compiled Tailwind default it reproduces and records that `--ease-standard` is `@theme inline` and therefore not runtime-available. |
| R3 | Update the module header comment, which currently justifies carrying Tailwind-internal timing tokens, so it no longer documents a practice the file has stopped using. |

## Technical constraints

- **Do not** use `var(--ease-standard)`, `var(--duration-fast|base|slow)`, or any `@theme inline` variable in a
  CSS Module. Verified unavailable at runtime; see §3.
- **Do not** express the `h3` line-height as a length (`1.25rem`, `22.5px`). The baseline is unitless.
- **Do not** move the `h3` line-height into a CSS Module class — the owner declined that option explicitly.
- **Do not** touch `transition-property`.

## Positive flow

Open `AuthSheet` -> complete registration or password recovery -> the success state renders with its title at the
pre-757 metrics -> hover any of the four links -> the colour transition runs at the baseline duration and easing.

## Negative-flow applicability

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Validation | No | No validation path touched | Unchanged | `npm run test:auth` |
| Authorization/RLS | No | No action or route touched | Unchanged | `npm run test:auth` |
| Offline/network | No | No network layer touched | Unchanged | N/A |
| Concurrent writer | No | No data model touched | Unchanged | N/A |
| ~~`prefers-reduced-motion`~~ **CORRECTED, see Revision 1** | **No** | No `@media (prefers-reduced-motion: reduce)` rule targets this surface anywhere in the repository | N/A | Task-design defect: the original citation was wrong |
| `[data-perf-tier="low"]` degraded tier | **Yes** | `globals.css:734-736`, attribute set at runtime by `src/lib/performance/store.ts:148,165` | These four links must compute `transition-duration: 0s` while the attribute is present, exactly as they did before Task 757 | Computed-style probe with the attribute set on `documentElement`, recorded per class |

## Acceptance criteria

- **AC1 / R1** — both `h3` sites use `lh={1.25}`; a live computed-style probe records `line-height: 22.5px` on each,
  with `letter-spacing: -0.025em` and `font-weight: 600` unchanged. The success states are reachable only with a real
  captcha, so this is an **owner-native** measurement: provide the exact `getComputedStyle` snippet and the expected
  values in the completion report.
- **AC2 / R2** — a live computed-style probe on one instance of each of the four link classes records
  `transition-duration: 0.15s` and `transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1)`, and
  `transition-property` unchanged from the current build. Capture before and after.
- **AC3 / R1,R2,R3** — `grep -n -- "--tw-\|--default-transition" src/modules/auth/components/AuthSheet.tsx src/modules/auth/components/AuthSheet.module.css` returns **zero** matches. Quote the empty result.
- **AC4** — the `prefers-reduced-motion` branch still zeroes the duration; recorded per the applicability table.
- **AC5** — rendered evidence for every state the 78-cell matrix already covers, before (`50d18411f`) and after, using
  the same capture schema and cell definitions as `ac3-full-matrix-*.json`. Expected result: **zero delta in all 78
  cells** — this correction touches only the two success states, which the matrix does not reach, and a timing value,
  which static capture cannot observe. A non-zero cell means something unintended changed.
- **AC6** — `npx tsc --noEmit`, `npm run check:design-tokens -- --strict`, `npm run check:i18n`,
  `npm run check:story-coverage`, `npm run check:stories`, `npm run build-storybook`, `npm run build`, and
  `npm run test:auth` all exit 0. `check:locale-leak` is executed and attributed under the D757-4a wording; its
  literal exit code is reported, not summarised.
- **AC7** — no string content changed; `check:i18n` key parity unchanged.
- **AC8** — the five sibling modules in §6 are untouched; `git status` proves it.

## QA profile

`Q4 Release/Critical Flow` — same as Task 757. `AuthSheet` is named in `docs/critical-flow-registry.md` for Login and
Signup; produce that entry's required automated regression evidence again.

## Verification plan

```
npx tsc --noEmit
npm run check:design-tokens -- --strict
npm run check:i18n
npm run check:story-coverage
npm run check:stories
npm run build-storybook
npm run build
npm run test:auth
node scripts/check-locale-leak.mjs            # execute + attribute, per D757-4a
grep -n -- "--tw-\|--default-transition" src/modules/auth/components/AuthSheet.tsx src/modules/auth/components/AuthSheet.module.css
# AC5: re-capture the 78-cell matrix against 50d18411f and against the corrected build, same schema
# AC1/AC2/AC4: owner-native computed-style probes, snippets supplied in the completion report
```

Retain every artifact under `docs/sessions/evidence/task757R/`.

## Pre-read (from `docs/rule-index.md`, current Mantine path)

`docs/agent-contract.md` · `docs/qa-profiles.md` · `docs/mantine-responsive-design-system.md` ·
`docs/critical-flow-registry.md` · `docs/design-system.md` §22.3 (the token-definition banner) ·
`tasks/Sprints/Sprint_60_owner_decisions_Task_757.md` · `docs/sessions/2026-08-20-task757-authsheet-detailwind.md` ·
`docs/reviews/2026-08-21-task757-authsheet-detailwind.review-ledger.json`. Do not read anything else.

## Report contract

Files changed · requirement IDs completed · every command with its actual output and exit code · the empty grep
result for AC3 · the before/after computed-style values for AC1, AC2 and AC4 · the 78-cell comparison result stated
as a diff outcome, not as a file count · evidence locations · assumptions · deviations · known limitations ·
anything not finished.

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` / `PARTIALLY IMPLEMENTED` / `BLOCKED`. Never self-approve.

## Review consequences, for the orchestrator

Task 757's approval is withdrawn. On 757R's approval, `docs/reviews/2026-08-21-task757-authsheet-detailwind.review-ledger.json`
is renamed to `.review-ledger.SUPERSEDED.json` **atomically with** the creation of a valid successor ledger that names it
in `review.supersedes` — never before, or the all-ledger gate fails on an orphan. Owner decisions D757-2 and D757-8 are
withdrawn by D757-2b; D757-1, D757-3a, D757-4a, D757-5, D757-6 and the `transition-property` half of D757-7 stand.

---

# Revision 1 — 2026-08-21, after the orchestrator review

**Re-entry mode: `remediation`.** The implementation is accepted except for the items below. Do not restart, do not
re-derive what is already proven, and do not re-capture any preserved baseline.

## Accepted and closed — do not redo

R1, R2, R3, AC2, AC3, AC5, AC8 were reproduced independently by the reviewer: the `lh={1.25}` sites, the empty
`--tw-|--default-transition` grep, the eight literal declarations, the identical `ac2-ac4-*-computed.json` values,
the 78/78 zero-delta matrix with no null cells, and the five untouched sibling modules. `check:design-tokens
--strict` was re-run by the reviewer: 0 violations, 0 stale markers, 0 missing-reason errors, exit 0.

**Preserved artifacts — overwriting any of these is a task failure:**

- `docs/sessions/evidence/task757R/ac3-full-matrix-before.json`
- `docs/sessions/evidence/task757R/ac2-ac4-before-computed.json`

They are the only valid pre-757R baselines and cannot be regenerated once the guard below is in place.
`ac3-full-matrix-after.json` and `ac2-ac4-after-computed.json` **are** expected to be re-captured against the
corrected build.

## Task-design defect, corrected

The negative-flow table cited `globals.css:727-735` as a `prefers-reduced-motion` override. That was wrong, and the
executor was right to say so: no `@media (prefers-reduced-motion: reduce)` rule touches this surface. The row is
corrected in place above. The reviewer then checked the branch that *is* there, and found a real regression — R4.

## R4 (P2, blocking) — restore the degraded-tier behaviour

`src/app/globals.css:734-736`:

```css
[data-perf-tier="low"] .transition,
[data-perf-tier="low"] [class*="transition-"] { transition-duration: 0ms !important; }
```

The attribute is live: `src/lib/performance/store.ts:148` and `:165` set it on `document.documentElement`, wired by
`src/components/shared/PerformanceStoreInit.tsx`.

Before Task 757 all four links carried `className="… transition-colors"`, so `[class*="transition-"]` matched them
and their transitions were instant on a low tier. They now carry hashed CSS Module names —
`AuthSheet_linkMutedXs__16cmi`, `AuthSheet_linkMutedSm__as6gS`, `AuthSheet_agentBackLink__xBeZM`,
`AuthSheet_linkPrimarySm__SSzA5` (read out of `.next/static/css/*.css`) — none of which contains the substring
`transition-`. The rule no longer matches, so a low-tier device now animates where it used to be instant. That is
the opposite of the optimisation's intent, and it is a behaviour delta against the pre-757 baseline this task's
objective names as its target.

**Required:** inside `AuthSheet.module.css`, restore the degraded-tier behaviour for exactly those four classes.

- Scope the guard to the four classes. Do not add a blanket rule, and do not edit `globals.css` — it is a shared
  file and out of scope.
- **Verify, do not assume, how CSS Modules emits the ancestor attribute selector.** Read the emitted rule out of
  `.next/static/css/*.css` and quote it in the report. If the plain form is rewritten, use `:global(...)`; if it is
  not, say so with the quoted evidence rather than adding `:global` defensively.
- Only `transition-duration` was zeroed by the original rule. Do not touch `transition-property` or
  `transition-timing-function` in the guard.
- Prove the guard is inert at the default tier: with no `data-perf-tier` attribute present, the four classes must
  still compute `0.15s`.

## R5 (P3) — correct the locale-leak attribution

The report states the result is "unchanged from Task 757's own baseline". The AuthSheet share is unchanged — 6
leaks, 2 story titles, `"Google"` × sq/uk/it, and 46 unique titles overall — but the **total moved 327 → 328**.
Record the delta as a fact: the additional finding is in a non-AuthSheet story, this diff touches only
`AuthSheet.tsx` and `AuthSheet.module.css` and therefore cannot produce it, and Task 757's per-story attribution is
category-level and not granular enough to identify which story gained it. Do not describe the total as unchanged.

## R6 (P3) — fix the remaining elided compiled rules in the module header

`AuthSheet.module.css` lines 24-25 still quote `.text-xs{font-size:.75rem;line-height:1rem}` and
`.text-sm{font-size:.875rem;line-height:1.25rem}`. The real compiled rules are
`.text-xs{font-size:.75rem;line-height:var(--tw-leading,1rem)}` and
`.text-sm{font-size:.875rem;line-height:var(--tw-leading,1.25rem)}`. The code is correct; the comment is not, and
this exact elision — quoting the fallback as if it were the value — is what produced the `h3` defect in Task 757
round 2. Correct both quotations and state why the literal is nonetheless right here (`--tw-leading` is
`@property … inherits:false` and is set on no element in this tree).

## Revised acceptance criteria

- **AC4 (replaces the withdrawn `prefers-reduced-motion` row) / R4** — with `data-perf-tier="low"` set on
  `document.documentElement`, a computed-style probe records `transition-duration: 0s` on one live instance of each
  of the four classes. With the attribute absent, the same probe records `0.15s`. Both states captured in one
  artifact, per class.
- **AC9 / R4** — the emitted guard selector is quoted verbatim from `.next/static/css/*.css`.
- **AC10 / R5** — the session log states the 327 → 328 delta and its attribution in the terms above.
- **AC11 / R6** — the two corrected rule quotations appear in the module header.
- **AC5 (re-stated)** — re-capture `ac3-full-matrix-after.json` only and compare against the **preserved**
  `ac3-full-matrix-before.json`. Expected: 78/78 zero delta, since the guard is inert at the default tier the
  matrix captures. A non-zero cell means the guard leaked.

## Verification plan delta

Re-run, because CSS changed: `npx tsc --noEmit` · `npm run check:design-tokens -- --strict` ·
`npm run build` · `npm run build-storybook` · `npm run check:stories` · `npm run test:auth` · the AC5 after-capture ·
the AC2/AC4 after-capture · the new AC4 degraded-tier probe.

Do not re-run: any before-phase capture. `check:i18n`, `check:story-coverage` and `check:locale-leak` may be
re-stated from this task's own prior run if no story or string changed; say which applies.

Read-only Git only. Never run `git checkout`, `git stash` or any other mutating command to produce a prior build —
if a prior-content build is needed, restore file content by copy and prove the restoration with a `git hash-object`
witness, as Task 756 did.

## Report contract delta

Add: the quoted emitted guard selector · the per-class degraded-tier probe, both attribute states · the corrected
locale-leak sentence · confirmation that both preserved baseline artifacts are byte-identical to their pre-revision
state, with their hashes.
