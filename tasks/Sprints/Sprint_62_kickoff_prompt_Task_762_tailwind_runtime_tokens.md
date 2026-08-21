# Task 762 — Tailwind runtime tokens in CSS Modules: the detector first, then the five modules

**Sprint:** 62 (**PROPOSED** — see "Sprint assignment") · **Type:** Governance gate + UI mechanism (D28)
**QA profile:** `Q4 Release/Critical Flow` · **Status:** KICKOFF FILED 2026-08-21

## Objective

Five CSS Modules reference `var(--default-transition-*)` — Tailwind's own theme defaults. When Tailwind is removed
from the project, which is the purpose of the entire de-Tailwind programme, those variables become undefined and
`transition-duration` silently falls back to `0s`: hover transitions stop, with nothing failing.

**The fix is trivial and is not the point of this task.** Task 757R already proved the fix on `AuthSheet`. What 757R
also proved is that **no gate in this repository can see this class of defect**, which is precisely the failure mode
`docs/backlog.md` records four times over: *the fix was right, the control could not detect its own effect*.

So this task builds the control first and the fix second.

## Sprint assignment — RECORDED, not pending

Task **762** belongs to **Sprint 62 - "Tailwind runtime tokens outlive Tailwind"**
(`tasks/Sprints/Sprint_62_Tailwind_Runtime_Tokens_Outlive_Tailwind.md`), opened 2026-08-21 by the orchestrator
together with this kickoff. Opening the sprint is an orchestrator action under the owner rule of 2026-08-01; the
first draft of this kickoff wrongly deferred it to the owner and thereby blocked its own executor. Corrected.

Goal-fit test against every open sprint, run 2026-08-21 - none fits, which is what justifies opening a new one:

| Sprint | Goal | Fit |
|---|---|---|
| 46 | ListingCard de-Tailwind + overlay exit | Partial - covers 1 of the 5 files, excludes the other 4 and the gate |
| 55 | ARIA semantics no gate sees | No |
| 56 | Raw enum leaks and the detector that cannot see them | Closest *in kind* - a detector blind spot - but its subject is enum leaks |
| 57 | Delete what no longer earns its place | No |
| 59 | Route-level inventory before any migration claim | No - inventory, not remediation |
| 60 | Homepage: Mantine completion and Tailwind residue | Closed 2026-08-21; its scope was the homepage file set |
| 61 | The projection layer no gate reads | No |

The owner may reassign this task to another sprint at any point; that is a routing change, not a gate on starting
work. **Nothing in this section blocks the executor.**

Task number **762** is taken from `docs/backlog.md`'s own registry line, which read `Last used **761**, NEXT FREE
**762**` before this kickoff. The first draft misread that line as "762 is already used" and claimed 763 - the
registry line names the next *free* number, not a taken one. The registry is advanced to `Last used **762**,
NEXT FREE **763**` in the same edit that files this task.

## Exact current state — measured 2026-08-21, with the method and its limits stated

**Method:** a Python regex sweep over every `src/**/*.module.css`, counting `var(--…)` occurrences. **That method
over-counts**: a `design-tokens-allow:` marker comment repeats the token name on the same line, so an occurrence
count is not a declaration count. Both numbers are given below. The executor must re-measure and state which it
reports; do not carry either number forward unverified.

### Category A — `var(--default-transition-*)`, this task's scope

**9 declarations across 5 files** (12 raw occurrences, the difference being marker-comment text). The five are
**not** identical — there are three distinct forms, and the risk differs per file:

| File | Line(s) | Form | If Tailwind is removed |
|---|---|---|---|
| `src/components/layout/MobileBottomNavView.module.css` | 92 | `transition-timing-function: var(--tw-ease, var(--default-transition-timing-function))` — **timing-function only, no duration declaration at all** | timing falls back to `ease`; duration unaffected because this file never sets it |
| `src/components/layout/MobileNavDrawer.module.css` | 9-10 | plain `var(--default-transition-*)`, both properties, marker on the duration line | **duration → `0s`, transitions stop** |
| `src/design-system/mantine/patterns/MantineCopyIdButton.module.css` | 28-29 | same plain form + marker | **duration → `0s`, transitions stop** |
| `src/design-system/mantine/patterns/MantineListingCardPattern.module.css` | 220, 226 | both guarded, and the duration carries a **hard literal fallback**: `var(--tw-duration, var(--default-transition-duration, .15s))` | degrades gracefully to `.15s` — this file is already safe |
| `src/modules/notifications/components/NotificationItem.module.css` | 5-6 | plain form + marker | **duration → `0s`, transitions stop** |

Three files break outright, one degrades gracefully, one is timing-only. **State this per file in the report; do not
describe the five as a uniform set.**

### Categories B, C, D — out of scope, named so they are not lost

The same sweep found 58 further references of three other kinds, in 8 files total:

| Category | Refs | Example | Files |
|---|---:|---|---|
| B — Tailwind `@theme` typography | 20 | `var(--text-sm)`, `var(--text-sm--line-height)` | FooterView, HeaderView, MobileNavDrawer, MantineCopyIdButton, MantineListingCardPattern |
| C — Tailwind utility internals | 37 | `var(--tw-shadow)`, `var(--tw-border-style)`, `var(--tw-ring-color)`, `var(--tw-scale-y)` | MobileBottomNavView, MantineListingCardPattern, ListingCard |
| D — `--leading-`/`--ease-`/`--duration-` | 1 | | MantineListingCardPattern |

**All of them are emitted in today's build** — verified by grepping each variable's *definition* out of
`.next/static/css/*.css`, not its usage. Nothing is broken now; every one of them is latent in exactly the same way
as category A.

They are excluded from this task's *fix* but **not** from this task's *gate*: see R1's baseline rule.

### Why no existing gate catches any of it

`check:design-tokens` exempts anything *shaped* like `var(--token)` without resolving it — its own documented arm.
Its coverage of category A is partial and asymmetric: the `transition-duration:` lines carry live
`design-tokens-allow:` markers (`--strict` reports 0 stale markers, so the scanner does flag them), while the
`transition-timing-function:` lines are not flagged at all — Task 757R proved empirically that a marker on a
`cubic-bezier(...)` line is itself a stale-marker violation. `tsc` and `next build` never read CSS values. A
rendered md5 comparator cannot see a value that is identical today and undefined only after a future deletion.

**And the existing exemption is author-applied**, which `docs/backlog.md`'s corollary (724 ②) names as an attack
surface: a marker comment is an exemption the author writes, not a condition the gate evaluates.

## Scope

- **New gate** + its registration in `package.json` and CI, and its baseline artifact.
- The 9 category-A declarations in the 5 files listed above.
- `docs/design-system.md` — one section documenting the rule the gate enforces.
- New session log; `docs/backlog.md`; the sprint's Tasks table.

## Out of scope — each already has its evidence, file each as its own task

1. **Categories B, C, D** (58 refs, 8 files). Same latent class, materially larger, and category C couples to
   Tailwind's `@property` registrations rather than to theme values — a different remediation.
2. **The degraded-perf-tier escape.** `globals.css:734-736` zeroes `transition-duration` under
   `[data-perf-tier="low"]` via `[class*="transition-"]`. **No CSS Module class name can ever match that selector**
   — verified: the only classes in the built CSS containing `transition-` are Tailwind's own utilities. Task 757R
   restored it for `AuthSheet` with a module-scoped guard; every other migrated surface has silently lost it. This
   needs per-file historical evidence (did the pre-migration markup actually carry a `transition-*` class?) which is
   a different evidence contract from this task's, so it is not folded in here.
3. `docs/backlog.md`'s three open P3 notes from the 757/757R review.

Do not touch `src/app/globals.css`, and do not fix any file outside the five.

## Requirements

### R1 (the control, build it first) — a gate that detects a Tailwind runtime-token reference in a CSS Module

Create `scripts/check-tailwind-runtime-tokens.mjs`, registered as `npm run check:tailwind-runtime-tokens`, and add
it to the same CI path the other `check:*` gates run in.

**What it must detect:** any `var(--…)` in `src/**/*.module.css` whose custom property is owned by Tailwind rather
than by this project. Derive ownership from a source the gate reads, not from a hardcoded list you author: the
Tailwind-owned names are the ones **not** defined in `src/app/globals.css`'s own `@theme`/`:root` blocks. State in
the report exactly how the gate decides ownership, and what it does with a name it cannot classify — it must fail
closed, never skip.

**Baseline, and why it is a file and not a comment.** Categories B/C/D must not block this task, and per
`docs/backlog.md`'s corollary (724 ①) the scoped condition is stated rather than the aggregate silenced: the gate
exits 0 when *no reference exists outside the recorded baseline*, and the baseline is owned by the follow-up task.
Record it as `scripts/tailwind-runtime-token-baseline.json` — exact `file` + `property` pairs, no globs, no
wildcards. The gate must fail in **both** directions:

- a reference that is not in the baseline → fail (new debt);
- a baseline entry whose reference no longer exists → fail (stale baseline, so removing debt forces the record to
  shrink).

No inline suppression comment may exempt anything. The exemption must be a condition the gate evaluates.

**Two-armed plant, both arms demonstrably failing (mandatory — `docs/backlog.md`'s standing rule).** Before
planting, run a **pre-plant census** proving no other gate would have caught either arm: run `tsc`,
`check:design-tokens --strict`, `check:stories` and `npm run build` against each planted state and record that all
four stay green. Then:

| Arm | Plant | Must fail | Assertion that consumes it |
|---|---|---|---|
| A | Re-introduce `transition-duration: var(--default-transition-duration)` into one of the five fixed files | `check:tailwind-runtime-tokens` exit ≠ 0 | the not-in-baseline rule |
| B | Delete one entry from `tailwind-runtime-token-baseline.json` while its reference still exists in the file | `check:tailwind-runtime-tokens` exit ≠ 0 | the stale-baseline rule |

Write each plant against the **observable defect**, not against the mechanism you assume produces it. Revert both,
re-run, record green. Quote the actual failing output for each arm.

### R2 — replace the 9 category-A declarations

Reproduce the values the tokens resolve to today, verified against the built CSS rather than assumed:
`--default-transition-duration: .15s` → `150ms`, `--default-transition-timing-function: cubic-bezier(.4,0,.2,1)` →
`cubic-bezier(0.4, 0, 0.2, 1)`.

- **Do not** substitute `var(--ease-standard)` or any `var(--duration-*)`. They are declared inside
  `@theme inline` (`globals.css:35`) and Tailwind emits a theme variable only when something in the compiled output
  references it — these are referenced by nothing, so they appear in **no** built stylesheet and would resolve to
  nothing. Verify this yourself before writing the first line: `grep -c "ease-standard" .next/static/css/*.css`.
  This is the `--z-sticky` failure mode (`docs/orchestrator-procedures.md`, `docs/design-system.md` §22.3).
- Keep each file's existing structure. `MantineListingCardPattern` keeps its `.15s` fallback semantics — reproduce
  the *resolved* behaviour, do not simply delete the guard and inherit a different one.
- `MobileBottomNavView` has no duration declaration. Do not add one.
- Every literal that `check:design-tokens` flags needs a `design-tokens-allow:` marker with its provenance. Every
  literal it does **not** flag must not carry one — a marker on an undetected line is a stale-marker violation.
  Determine which is which empirically, per line, as Task 757R did.

### R3 — document the rule

One section in `docs/design-system.md`: Tailwind-owned custom properties are not consumable from a CSS Module,
why (they disappear with Tailwind; `@theme inline` names are never emitted at all), what to write instead, and the
gate that enforces it. Cross-reference §22.3's existing banner rather than duplicating it.

## Current behavior to preserve

Every transition in the five files renders identically today: `transition-duration: 0.15s`,
`transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1)`, `transition-property` untouched.
`MantineListingCardPattern`'s hover and its `prefers-reduced-motion` suppression are named in
`docs/critical-flow-registry.md` with computed-style proof — both must still behave exactly as that row asserts.

## Negative-flow applicability

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Validation | No | No validation path touched | Unchanged | N/A |
| Authorization/RLS | No | No action or route touched | Unchanged | N/A |
| Offline/network | No | No network layer touched | Unchanged | N/A |
| Concurrent writer | No | No data model touched | Unchanged | N/A |
| `prefers-reduced-motion` | **Yes** | `MantineListingCardPattern.module.css` — a real media query here, unlike `AuthSheet` | Hover suppression still fires; the registry row's assertion still holds | Computed-style probe under the emulated media feature, before and after |
| Gate false-negative | **Yes** | R1 | The gate fails on a planted reference and on a stale baseline entry | The two-armed plant, both arms quoted |

## Acceptance criteria

- **AC1 / R1** — `npm run check:tailwind-runtime-tokens` exists, is CI-wired, and exits 0 on the corrected tree.
- **AC2 / R1** — both plant arms produce a non-zero exit with the output quoted, the pre-plant census shows `tsc`,
  `check:design-tokens --strict`, `check:stories` and `build` all green under each planted state, and both arms are
  reverted and re-verified green.
- **AC3 / R1** — the baseline file contains exactly the category-B/C/D references that exist, enumerated as
  file+property pairs; the report states the count and how it was derived.
- **AC4 / R2** — zero `var(--default-transition-*)` remains in `src/**/*.module.css`. Quote the empty grep.
- **AC5 / R2** — a live computed-style probe on one element per changed file records `transition-duration: 0.15s`
  and `transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1)`, before and after, per file. `MobileBottomNavView`
  reports timing-function only.
- **AC6 / R2** — the `MantineListingCardPattern` hover and `prefers-reduced-motion` assertions from
  `docs/critical-flow-registry.md` are re-run and pass; name the row and the command.
- **AC7** — `npx tsc --noEmit`, `check:design-tokens --strict`, `check:i18n`, `check:story-coverage`,
  `check:stories`, `build-storybook`, `npm run build` and the new gate all exit 0. `check:locale-leak` is executed
  and attributed per the D757-4a wording; report its literal exit code.
- **AC8 / R3** — the `docs/design-system.md` section exists and cross-references §22.3.
- **AC9** — no file outside the declared scope is modified; prove it from `git status`.
- **AC10** — rendered evidence: for each of the five files, one story or route that exercises the changed class,
  before and after, at the widths the relevant proof path requires. Expected result: **zero delta** — this task
  changes no value that renders differently today. A non-zero cell means something unintended changed.

## Verification plan

```
npm run check:tailwind-runtime-tokens          # new
npx tsc --noEmit
npm run check:design-tokens -- --strict
npm run check:i18n
npm run check:story-coverage
npm run check:stories
npm run build-storybook
npm run build
node scripts/check-locale-leak.mjs             # execute + attribute per D757-4a
grep -rn -- "var(--default-transition" src/    # AC4: must be empty
# AC5/AC6: computed-style probes, per file, before and after
# AC2: the two-armed plant with its pre-plant census
```

Retain every artifact under `docs/sessions/evidence/task762/`.

## Pre-read (from `docs/rule-index.md`, current Mantine path)

`docs/agent-contract.md` · `docs/qa-profiles.md` · `docs/mantine-responsive-design-system.md` ·
`docs/critical-flow-registry.md` (the ListingCard and NotificationItem rows) · `docs/design-system.md` §22.3 and
§23.6.b · `scripts/check-design-tokens.mjs` (read the detector before relying on it) ·
`tasks/Sprints/Sprint_60_kickoff_prompt_Task_757R_authsheet_runtime_tokens.md` and its Revision 1 ·
`docs/sessions/2026-08-21-task757R-authsheet-runtime-tokens.md`. Do not read anything else.

## Report contract

Files changed · requirement IDs · every command with its actual output and exit code · the per-file table from
"Exact current state", re-measured, with the declaration/occurrence distinction stated · the two-armed plant with
both failing outputs and the pre-plant census · the baseline count and its derivation · the before/after
computed-style values per file · the AC10 comparison stated as a diff outcome, not a file count · evidence
locations · assumptions · deviations · known limitations · anything not finished.

**Take the `docs/backlog.md` line-count baseline from `git show HEAD:docs/backlog.md | wc -l` before editing it**,
not after — three consecutive executors got this wrong.

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` / `PARTIALLY IMPLEMENTED` / `BLOCKED`. Never self-approve.
