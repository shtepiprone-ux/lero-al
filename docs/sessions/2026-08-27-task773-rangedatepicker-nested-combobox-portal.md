# Task 773 — RangeDatePicker nested month/year selector dismissed the calendar

**Date:** 2026-08-27 · **Sprint:** 67 · **QA profile:** Q4 · **Files touched:** 3 source + 4 governance
**Author:** Opus, implementing under the explicit owner authorization recorded in the Sprint 67 plan.

## What the owner reported

Homepage → Advanced filters drawer → date filter → open the month dropdown → the whole calendar closes. Broke during
an earlier task; validation stayed silent.

## The handed-over diagnosis was right, but its proposed test was not

The handover already named the cause (nested portal → outside click) and the fix. Both hold. What did **not** hold is
the implied third step, "add a regression test that opens the calendar, picks a month, and asserts it stays open."

That test was written first and run against the **unfixed** tree. **It passed.** Chasing that produced the finding
below, which matters more than the three-line fix.

## Finding — the RTL layer cannot see this class of defect, in either configuration

| Configuration | What happens | Consequence |
|---|---|---|
| `MantineProvider env="test"` — what **every** suite in this repo uses | `OptionalPortal` short-circuits on `env === "test" \|\| !withinPortal` and renders children inline | `withinPortal` is a **no-op**. The nested list is already a descendant. The defect **cannot be represented**. |
| No `env="test"` | Portals are real; the option is verifiably outside the calendar dropdown | but every jsdom rect is `0×0` → the popover's `hideDetached` marks the reference hidden → click-outside stops firing at all. Verified: `mousedown` on `document.body` no longer closes the calendar. |

So the symptom is unobservable from both sides. This is **not** specific to the date picker: it applies to every
Mantine overlay-inside-overlay composition in the codebase. The 20 green date-picker/filter tests were not negligent
— they were blind, and would have stayed blind had they clicked the month dropdown.

Same family as the Task 553/554 lesson already recorded in `docs/mantine-responsive-design-system.md`
(*"a green matrix is NOT proof the component's internals are correct"*), one layer down.

## What landed instead

A **containment** regression test: the month option list must be a DOM descendant of the calendar popover's dropdown
— the exact predicate `useClickOutside` evaluates via `composedPath().includes(dropdownNode)`. It renders with real
portals (a local provider without `env="test"`, documented in place) and it discriminates:

```
unfixed sources → FAIL   AssertionError: expected false to be true   (containment assertion)
fixed sources   → PASS   7 files / 64 tests
```

That order is the Q4 planted-violation transcript; the violation is the absent `withinPortal={false}`.

## Fix

- `MantineCombobox.tsx` — optional `withinPortal?: boolean` → Mantine `<Combobox>`. Absent ⇒ Mantine's `true` ⇒
  byte-identical for every existing consumer (same precedent as `triggerWidth`/`inputMode`/`dropdownMinWidth`). The
  stale "portal mode is DEFERRED" doc paragraph corrected in the same edit.
- `RangeDatePicker.tsx` — `withinPortal={false}` on the two **desktop** selectors only. The mobile header's
  selectors were left alone: below 640px `MantineCombobox` renders the bottom sheet and never mounts
  `Combobox.Dropdown`, so the portal path does not exist there.
- No sweep of other nested-combobox sites — scope stayed on the reported surface (Sprint 67 exit criterion 4).

## Gates

`tsc --noEmit` **0** · 7 suites / **64 tests** green (RangeDatePicker smoke + localization, MantineCombobox smoke,
MantinePopover smoke, filtersRangeDatePicker, filtersPanelShell, heroSearch).

**Environment limitation, recorded not skipped.** The repo's `node_modules` is a Windows install; its native
`rollup`/`esbuild` binaries cannot execute in the mounted Linux shell, so gates ran in a container against a faithful
copy of `src/` + `messages/` on a freshly resolved dependency tree, where `npm install` was used.

> **CORRECTION (owner check, 2026-08-27).** This paragraph originally reported that `npm ci` failed on
> **"pre-existing lockfile drift"** (`Missing: webpack@5.110.0 from lock file`) and flagged it for the owner. **That
> conclusion was wrong and is withdrawn.** The failure was real but was observed in the *container*: Linux, npm
> **10.9.7**, against a **reconstructed partial tree** (only `src/`, `messages/`, `package.json`,
> `package-lock.json` — no `scripts/`, `public/`, or config siblings). On the owner's real repository,
> `npm ci --dry-run --ignore-scripts` with npm **10.9.8** completes successfully, with no `webpack@5.110.0` error
> and a clean working tree. **No lockfile defect is established for this repo and no task was filed.** Generalising
> one failure in a reconstructed environment into a claim about the real repository was the error — an environment
> difference, not a repo fact. If a real `npm ci` ever reproduces it, what is needed is the full log plus the npm
> version, not this note. A production build on that tree would not be authoritative: **`npm run build` is outstanding
and must be owner-native**, per agent-contract clause 9. Under that clause this task is
`IMPLEMENTED — AWAITING ORCHESTRATOR/OWNER REVIEW`, not complete.

## Outstanding

1. Owner-native `npm run build` (exit 0) + `check:i18n` + `check:mojibake` + lint.
2. **Real-browser AC1/AC2/AC3** — the only proof of the user-visible behavior that exists; see the kickoff.
3. Sprint 67 exit criteria 2–4: record the blind spot in `docs/mantine-responsive-design-system.md`, name the
   detector (a `check-click-shield.mjs`-shaped interaction probe is the candidate), and audit the other nested
   overlay sites.
