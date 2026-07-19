# SB10 Lint Debt Inventory — Task 627

**Status:** Triage only. No source, story, test, or config file is changed by this document. Fixes are planned
follow-up work (Task 628).

**Relationship to `docs/eslint-debt-taxonomy.md`:** that document records a *different, closed* debt-burn-down
sprint (Tasks 65–71 + 295, closed 2026-05-30 at 0 errors/0 warnings, root-caused entirely by unignored
`storybook-static/**` build output). The debt inventoried here is a **new accumulation** since that closure, with
unrelated root causes (an SB10 Storybook-framework migration gap, a handful of governance/typing findings) — a
separate file avoids conflating two unrelated sprints under one "current status," which was judged the higher-risk
choice per the kickoff's "check first" instruction. Cross-referenced here, not merged.

## Regenerated authoritative baseline (R1/R6)

Command: `npm run lint` (→ `eslint`, per `package.json` line 9). Run 2026-07-19, in-sandbox, full output below —
**this transcript is the source of truth**, superseding any prior summary (including the Task 625 session log's
evidence #8, which was a prose recap, not a verbatim capture — see "Delta vs. the Task 625 log" below).

```
> lero-al@0.1.0 lint
> eslint


C:\Claude_Code_Projects\lero-al\src\components\admin\AdminReportsManager.tsx
  126:18  error  Direct .status comparison outside the semantic domain. Use helpers from '@/modules/listings/domain': isListingVisible(), isListingHidden(), isListingArchived(), isListingClosed(). Display maps ({ active: 'success', ... }) are unaffected by this rule  no-restricted-syntax

C:\Claude_Code_Projects\lero-al\src\components\admin\AdminUsersTable.tsx
  163:32  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  345:34  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

C:\Claude_Code_Projects\lero-al\src\components\admin\__tests__\AdminUsersTable.smoke.test.tsx
   93:38  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
   94:38  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
   95:37  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
   98:45  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  102:44  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  106:29  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  110:69  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  114:59  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  118:62  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  122:48  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  126:35  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  127:49  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  133:36  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  139:66  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  142:21  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  151:47  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  155:40  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  159:27  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  170:65  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  171:11  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  173:26  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  174:30  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  180:22  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

C:\Claude_Code_Projects\lero-al\src\components\shared\__tests__\filtersRangeDatePicker.smoke.test.tsx
  31:47  warning  'beforeEach' is defined but never used  @typescript-eslint/no-unused-vars

C:\Claude_Code_Projects\lero-al\src\design-system\mantine\patterns\MantinePagination.tsx
  238:5  warning  Unused eslint-disable directive (no problems were reported from 'react-hooks/exhaustive-deps')

C:\Claude_Code_Projects\lero-al\src\design-system\mantine\patterns\MantineSelect.tsx
  53:18  error  An interface declaring no members is equivalent to its supertype  @typescript-eslint/no-empty-object-type

C:\Claude_Code_Projects\lero-al\src\modules\listings\lib\__tests__\visibility.test.ts
    3:32  warning  'vi' is defined but never used                                                                                       @typescript-eslint/no-unused-vars
    4:13  warning  'visibilityModule' is defined but never used                                                                         @typescript-eslint/no-unused-vars
  136:1   error    Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free  @typescript-eslint/ban-ts-comment
  185:11  warning  'original' is assigned a value but never used                                                                        @typescript-eslint/no-unused-vars

C:\Claude_Code_Projects\lero-al\src\stories\mantine\primitives\Alert.stories.tsx
  1:1  error  Do not import renderer package "@storybook/react" directly. Use a framework package instead (e.g. @storybook/nextjs, @storybook/react-vite, @storybook/nextjs-vite, @storybook/react-webpack5, @storybook/react-native-web-vite)  storybook/no-renderer-packages

C:\Claude_Code_Projects\lero-al\src\stories\mantine\primitives\Avatar.stories.tsx
  1:1  error  Do not import renderer package "@storybook/react" directly. Use a framework package instead (e.g. @storybook/nextjs, @storybook/react-vite, @storybook/nextjs-vite, @storybook/react-webpack5, @storybook/react-native-web-vite)  storybook/no-renderer-packages

C:\Claude_Code_Projects\lero-al\src\stories\mantine\primitives\Badge.stories.tsx
  1:1  error  Do not import renderer package "@storybook/react" directly. Use a framework package instead (e.g. @storybook/nextjs, @storybook/react-vite, @storybook/nextjs-vite, @storybook/react-webpack5, @storybook/react-native-web-vite)  storybook/no-renderer-packages

C:\Claude_Code_Projects\lero-al\src\stories\mantine\primitives\Card.stories.tsx
  1:1  error  Do not import renderer package "@storybook/react" directly. Use a framework package instead (e.g. @storybook/nextjs, @storybook/react-vite, @storybook/nextjs-vite, @storybook/react-webpack5, @storybook/react-native-web-vite)  storybook/no-renderer-packages

C:\Claude_Code_Projects\lero-al\src\stories\mantine\primitives\Notification.stories.tsx
  1:1  error  Do not import renderer package "@storybook/react" directly. Use a framework package instead (e.g. @storybook/nextjs, @storybook/react-vite, @storybook/nextjs-vite, @storybook/react-webpack5, @storybook/react-native-web-vite)  storybook/no-renderer-packages

C:\Claude_Code_Projects\lero-al\src\stories\mantine\primitives\Pagination.stories.tsx
  1:1  error  Do not import renderer package "@storybook/react" directly. Use a framework package instead (e.g. @storybook/nextjs, @storybook/react-vite, @storybook/nextjs-vite, @storybook/react-webpack5, @storybook/react-native-web-vite)  storybook/no-renderer-packages

C:\Claude_Code_Projects\lero-al\src\stories\mantine\primitives\Progress.stories.tsx
  1:1  error  Do not import renderer package "@storybook/react" directly. Use a framework package instead (e.g. @storybook/nextjs, @storybook/react-vite, @storybook/nextjs-vite, @storybook/react-webpack5, @storybook/react-native-web-vite)  storybook/no-renderer-packages

C:\Claude_Code_Projects\lero-al\src\stories\mantine\primitives\RangeDatePicker.stories.tsx
  114:34  error  `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`  react/no-unescaped-entities

C:\Claude_Code_Projects\lero-al\src\stories\mantine\primitives\ScrollArea.stories.tsx
  1:1  error  Do not import renderer package "@storybook/react" directly. Use a framework package instead (e.g. @storybook/nextjs, @storybook/react-vite, @storybook/nextjs-vite, @storybook/react-webpack5, @storybook/react-native-web-vite)  storybook/no-renderer-packages

C:\Claude_Code_Projects\lero-al\src\stories\mantine\primitives\SegmentedControl.stories.tsx
  1:1  error  Do not import renderer package "@storybook/react" directly. Use a framework package instead (e.g. @storybook/nextjs, @storybook/react-vite, @storybook/nextjs-vite, @storybook/react-webpack5, @storybook/react-native-web-vite)  storybook/no-renderer-packages

C:\Claude_Code_Projects\lero-al\src\stories\mantine\primitives\Separator.stories.tsx
  1:1  error  Do not import renderer package "@storybook/react" directly. Use a framework package instead (e.g. @storybook/nextjs, @storybook/react-vite, @storybook/nextjs-vite, @storybook/react-webpack5, @storybook/react-native-web-vite)  storybook/no-renderer-packages

C:\Claude_Code_Projects\lero-al\src\stories\mantine\primitives\Skeleton.stories.tsx
  1:1  error  Do not import renderer package "@storybook/react" directly. Use a framework package instead (e.g. @storybook/nextjs, @storybook/react-vite, @storybook/nextjs-vite, @storybook/react-webpack5, @storybook/react-native-web-vite)  storybook/no-renderer-packages

C:\Claude_Code_Projects\lero-al\src\stories\mantine\primitives\Slider.stories.tsx
  1:1  error  Do not import renderer package "@storybook/react" directly. Use a framework package instead (e.g. @storybook/nextjs, @storybook/react-vite, @storybook/nextjs-vite, @storybook/react-webpack5, @storybook/react-native-web-vite)  storybook/no-renderer-packages

C:\Claude_Code_Projects\lero-al\src\stories\mantine\primitives\Tabs.stories.tsx
  1:1  error  Do not import renderer package "@storybook/react" directly. Use a framework package instead (e.g. @storybook/nextjs, @storybook/react-vite, @storybook/nextjs-vite, @storybook/react-webpack5, @storybook/react-native-web-vite)  storybook/no-renderer-packages

✖ 47 problems (17 errors, 30 warnings)
  0 errors and 1 warning potentially fixable with the `--fix` option.
```

**Total: 47 problems (17 errors, 30 warnings).** Confirmed by independent category-count reconciliation below
(sums to 47 exactly).

## Delta vs. the Task 625 session log (negative-flow branch — applicable, flagged per R1/R6)

The 625 log's evidence #8 was a prose summary, not a verbatim capture, and undercounted/omitted findings. Using
the regenerated transcript as authoritative surfaces two material differences:

1. **`RangeDatePicker.stories.tsx` is NOT in Category 1.** The 625 log listed it among the 14
   `storybook/no-renderer-packages` offenders; the fresh run shows only **13** files with that error, and
   `RangeDatePicker.stories.tsx` already imports `Meta`/`StoryObj` from `@storybook/nextjs-vite` (verified by
   reading line 2 of the file). It DOES still carry the unrelated `react/no-unescaped-entities` error (Category 4)
   at line 114. Someone fixed its renderer import in a later commit without touching the unescaped-entity issue.
2. **Two categories are new, not mentioned in the 625 summary at all:** the `no-restricted-syntax` status-domain
   error in `AdminReportsManager.tsx` (Category 5) and the 25 `@typescript-eslint/no-explicit-any` warnings across
   `AdminUsersTable.tsx`/`AdminUsersTable.smoke.test.tsx` (Category 6). The 625 log's summary only said
   "unused-var warnings in test files," which undercounted the actual warning composition.

No category from the 625 log's list turned out to be fabricated — the delta is entirely "the fresh run is more
complete/precise than the prose recap," consistent with R6's instruction to treat this transcript as authoritative.

## Category breakdown (R2) — every problem categorized, zero left out

Reconciliation: 13 (Cat 1) + 1 (Cat 2) + 1 (Cat 3) + 1 (Cat 4) + 1 (Cat 5) + 25 (Cat 6) + 4 (Cat 7) + 1 (Cat 8)
= **47**. ✓ Matches the transcript total exactly.

### Category 1 — `storybook/no-renderer-packages` (13 errors)

| File | Line |
|---|---|
| `Alert.stories.tsx` | 1:1 |
| `Avatar.stories.tsx` | 1:1 |
| `Badge.stories.tsx` | 1:1 |
| `Card.stories.tsx` | 1:1 |
| `Notification.stories.tsx` | 1:1 |
| `Pagination.stories.tsx` | 1:1 |
| `Progress.stories.tsx` | 1:1 |
| `ScrollArea.stories.tsx` | 1:1 |
| `SegmentedControl.stories.tsx` | 1:1 |
| `Separator.stories.tsx` | 1:1 |
| `Skeleton.stories.tsx` | 1:1 |
| `Slider.stories.tsx` | 1:1 |
| `Tabs.stories.tsx` | 1:1 |

All 13 under `src/stories/mantine/primitives/`.

**Root cause:** these 13 files still `import type { Meta, StoryObj } from '@storybook/react'` — the pre-SB10
renderer-package import path. `.storybook/main.ts` line 20 configures the framework as `@storybook/nextjs-vite`
(comment there: "Migrated from `@storybook/experimental-nextjs-vite` (SB8) as part of Task 394 SB10 upgrade"), and
**56 other story files already correctly import from `@storybook/nextjs-vite`** (grep-confirmed) — these 13 are a
straggler set, not a repo-wide pattern.

**Fix approach — two options, presented per the kickoff's open question, NOT decided here:**

- **Option A (strong precedent, recommended by evidence): change the import path directly** —
  `from '@storybook/react'` → `from '@storybook/nextjs-vite'` in each of the 13 files. This exactly matches what
  the other 56 story files already do; zero new abstraction; a 1-line diff per file. Trade-off: 13 near-identical
  small diffs (mechanical, low review overhead) vs. no shared indirection if the framework package name changes
  again later.
- **Option B: introduce a shared story-helper re-export** (e.g. `export type { Meta, StoryObj } from
  '@storybook/nextjs-vite'` in a new `src/stories/_storybookTypes.ts`, then all 13 — and optionally the other 56 —
  import from there). Trade-off: a single future framework-migration point, but a wider diff (touches import lines
  repo-wide if applied consistently) and a new file/convention with no current precedent in this codebase.

Given 56/69 total story files already use the direct-import pattern with zero shared re-export anywhere in the
tree, Option A has materially stronger in-repo precedent; Option B would be a new convention introduced solely for
this cleanup. Recorded as options for Task 628 / owner choice, per kickoff instruction — not implemented here.

**Codemod-or-manual:** codemod-eligible (identical 1-line pattern in all 13 files) for Option A; not applicable to
Option B (requires a new file plus per-file edits).
**Risk:** LOW — type-only import change, no runtime behavior; `storybook/no-renderer-packages` is a static-analysis
rule about the import specifier, not a runtime check. Verify with `npm run build-storybook` after the batch.

### Category 2 — Empty interface (1 error)

| File | Line | Rule |
|---|---|---|
| `src/design-system/mantine/patterns/MantineSelect.tsx` | 53:18 | `@typescript-eslint/no-empty-object-type` |

**Root cause:** `export interface MantineSelectProps extends SelectProps {}` — an interface with no additional
members is equivalent to `SelectProps` itself; ESLint flags the vacuous extension.

**Fix approach:** convert to a type alias: `export type MantineSelectProps = SelectProps`. If the intent was to
leave room for future additional props, an empty interface is still flagged regardless — the rule requires either
adding a member or aliasing.
**Codemod-or-manual:** manual (single declaration, single file).
**Risk:** LOW — type-only change; `MantineSelectProps` is exported, so verify no consumer does
`interface Foo extends MantineSelectProps` in a way that depends on it being an `interface` rather than a `type`
(TypeScript allows both, but a repo-wide grep for `extends MantineSelectProps` should be run as part of Task 628's
verification, not assumed safe).

### Category 3 — `@ts-ignore` → `@ts-expect-error` (1 error)

| File | Line | Rule |
|---|---|---|
| `src/modules/listings/lib/__tests__/visibility.test.ts` | 136:1 | `@typescript-eslint/ban-ts-comment` |

**Root cause:** `// @ts-ignore — .mjs has no type declarations; runtime import is sufficient for drift assertion`
suppresses a TS error on the following import line unconditionally; `@ts-expect-error` is required instead because
it fails loudly if the suppressed line stops erroring (catches drift), whereas `@ts-ignore` silently does nothing
in that case.

**Fix approach:** swap the pragma to `@ts-expect-error` (same comment text otherwise). **Verification note for
Task 628:** after the swap, run `npx tsc --noEmit` — if the import line does NOT actually produce a TS error under
the project's `tsconfig.json` (e.g. `.mjs` extension resolution may already be permissively typed), `@ts-expect-error`
will itself trigger a "no unused expect-error directive" report from the same rule, requiring either fixing the
underlying type gap or reverting to a documented alternative. Do not assume the swap is a no-op without that check.
**Codemod-or-manual:** manual (1 line, but contingent on the tsc verification above).
**Risk:** LOW-MEDIUM — contingent risk described above, not a behavior change either way (test-only file).

### Category 4 — Unescaped entity in story prose (1 error)

| File | Line | Rule |
|---|---|---|
| `src/stories/mantine/primitives/RangeDatePicker.stories.tsx` | 114:34 | `react/no-unescaped-entities` |

**Root cause:** a raw apostrophe in developer-facing `<Text>` annotation prose ("...see the session log's Rendered
evidence...") — JSX text content with a literal `'` character.

**Fix approach:** escape to `&apos;` (or rephrase to avoid the apostrophe, e.g. "the session log's" →
"the session log Rendered evidence"). This is dev-only annotation prose inside a Storybook demo, not a
user-facing/localized string — no i18n key needed, and it is exempt from the storybook-governance §14.2 raw-title
rule (that rule targets `title:`-keyed fixture properties, not arbitrary `<Text>` children).
**Codemod-or-manual:** manual (1 character-level fix).
**Risk:** LOW — visual-text-only change in a non-canonical annotation line; re-render the story to confirm no
layout shift from the rephrase if that option is chosen over the entity escape.

### Category 5 — Status-domain false-positive on `ReportStatus` (1 error) — NEW, not in the 625 log

| File | Line | Rule |
|---|---|---|
| `src/components/admin/AdminReportsManager.tsx` | 126:18 | `no-restricted-syntax` (listing-status mutation governance, block B1) |

**Root cause:** `const isOpen = report.status === 'pending' || report.status === 'reviewed'` — `report.status` is
typed `ReportStatus` (verified: `status: ReportStatus` at line 38, imported from the reports domain), a
**different status domain from `ListingStatus`**. The `no-restricted-syntax` B1 selector in `eslint.config.mjs`
matches on the **literal string value** `'pending'` regardless of which domain's status the comparison belongs to,
so it fires here even though this is not a listing-status mutation. `eslint.config.mjs`'s `LISTING_STATUS_IGNORES`
array (lines 51–71) already carries this exact exemption pattern for other non-listing domains — `AuthStatus`,
`TicketStatus` (`src/app/admin/support/**`), `UserStatus` (cron/presence), `ContactStatus`
(`src/modules/contacts/**`) — but the reports domain (`src/components/admin/AdminReportsManager.tsx` and/or a
`ReportStatus`-scoped path) was not added when those exemptions were built.

**Fix approach:** add the report-status file(s)/path to `LISTING_STATUS_IGNORES` in `eslint.config.mjs` — this is
an **ESLint config change**, explicitly out of this task's scope (kickoff "Out of scope" §2) and out of Task 628's
default scope too unless the owner confirms it as an intended `LISTING_STATUS_IGNORES` extension. Alternative:
introduce `isReportOpen()`/`isReportTerminal()` domain helpers analogous to `isListingVisible()` etc., which would
satisfy the rule's intent (comparisons routed through named domain helpers) without touching the ignore list —
higher effort, better long-term parity with the listing-status pattern.
**Codemod-or-manual:** manual — this is a scope/config decision, not a mechanical fix.
**Risk:** MEDIUM — this is a governance-rule scope gap, not a bug in `AdminReportsManager.tsx`'s logic; the code is
correct, only mis-flagged. Recommend the owner explicitly confirm the `LISTING_STATUS_IGNORES` extension (or
choose the domain-helper alternative) before Task 628 touches this file, since it is a config/governance-boundary
decision, not a pure lint cleanup.

### Category 6 — `@typescript-eslint/no-explicit-any` (25 warnings) — NEW composition, not itemized in the 625 log

| File | Lines | Count |
|---|---|---|
| `src/components/admin/AdminUsersTable.tsx` | 163:32, 345:34 | 2 |
| `src/components/admin/__tests__/AdminUsersTable.smoke.test.tsx` | 93,94,95,98,102,106,110,114,118,122,126,127,133,139,142,151,155,159,170,171,173,174,180 (all `:col`) | 23 |

**Root cause (production, 2 instances):** both are `component={Link as any}` — a Mantine polymorphic-`component`
prop / Next.js `Link` typing friction (a known category of friction with Mantine's `component` prop generics).
**Root cause (test, 23 instances):** all are `vi.mock('@mantine/core', ...)` shim factories typed
`({ children, ...p }: any) =>` — loose prop typing on hand-written Mantine component mocks in a smoke test.

**Fix approach (production):** a properly-typed polymorphic cast (e.g. `component={Link as React.ElementType}` or
a small typed wrapper) — 2 call sites, same pattern, same file.
**Fix approach (test):** a shared typed helper (e.g. `type MockProps = React.PropsWithChildren<Record<string, unknown>>`)
reused across the 23 mock factories — mechanical, one shared type declaration.
**Note:** `@typescript-eslint/no-explicit-any` is deliberately downgraded from ESLint's default `error` to `warn`
repo-wide (`eslint.config.mjs` lines 87–95, comment: "The codebase predates strict typing enforcement... warnings
surface the debt without halting deployment") — this is **accepted, non-blocking debt by design**, not an
oversight. Recommend Task 628 treat this category as **lowest priority / optional**, distinct from the error-level
categories above.
**Codemod-or-manual:** production = manual (2 sites); test = semi-mechanical (1 shared type + 23 substitutions).
**Risk:** LOW for both — type-only changes; the test file's mocks have no runtime behavior dependency on `any`.

### Category 7 — Unused variables (4 warnings)

| File | Line | Identifier | Rule |
|---|---|---|---|
| `src/components/shared/__tests__/filtersRangeDatePicker.smoke.test.tsx` | 31:47 | `beforeEach` | `@typescript-eslint/no-unused-vars` |
| `src/modules/listings/lib/__tests__/visibility.test.ts` | 3:32 | `vi` | `@typescript-eslint/no-unused-vars` |
| `src/modules/listings/lib/__tests__/visibility.test.ts` | 4:13 | `visibilityModule` | `@typescript-eslint/no-unused-vars` |
| `src/modules/listings/lib/__tests__/visibility.test.ts` | 185:11 | `original` | `@typescript-eslint/no-unused-vars` |

**Root cause:** all four confirmed genuinely dead by direct read + grep (`vi`/`visibilityModule`/`original` never
referenced again in `visibility.test.ts`; the test at line 185 restores state via a separately-declared `saved`
variable instead of the unused `original`). `beforeEach` is imported from `vitest` but the file has no
`beforeEach(...)` call.
**Fix approach:** delete each unused identifier/import. For `original` (line 185), confirm the restore logic
correctly uses `saved` (already appears to, per the surrounding code) before deleting.
**Codemod-or-manual:** manual (4 small deletions across 2 files) — trivial enough to batch safely.
**Risk:** LOW — no other reference found for any of the four.

### Category 8 — Unused `eslint-disable` directive (1 warning)

| File | Line | Rule |
|---|---|---|
| `src/design-system/mantine/patterns/MantinePagination.tsx` | 238:5 | `--report-unused-disable-directives` (built-in) |

**Root cause:** `// eslint-disable-next-line react-hooks/exhaustive-deps` above the `useEffect` dependency array
`[mounted, total, activePage]` — the array now appears to satisfy `exhaustive-deps` (no violation reported without
the directive), so the suppression comment is stale.
**Fix approach:** remove the directive comment. **Verification note for Task 628:** re-run lint after removal to
confirm `exhaustive-deps` genuinely stays silent (it should, since the directive is reported as *unused*, meaning
ESLint already checked and found no violation) — do not additionally re-derive the effect's dependency correctness
by hand beyond that; a real regression would resurface as a fresh `exhaustive-deps` warning immediately.
**Codemod-or-manual:** manual (1-line deletion).
**Risk:** LOW — mechanical; the "unused directive" diagnostic itself is the proof that no suppression is needed.

## Autofixability (recorded, not applied — kickoff §"Out of scope")

`npx eslint --fix-dry-run --format json .` was run read-only (no `--fix`, dry-run only; output inspected, no file
written). Result: **0 errors and 0 warnings carry a rule-level auto-fixer** across the full JSON per-file
`fixableErrorCount`/`fixableWarningCount` fields — none of these 47 problems have a mechanical ESLint `--fix`
transform available. This is consistent with the plain-text summary line `0 errors and 1 warning potentially
fixable with the --fix option` — that single "potentially fixable" warning is the Category 8 unused-directive
removal, which is a built-in disable-directive cleanup (not a rule-based autofix reflected in the JSON
`fixable*Count` fields) and still requires an explicit `--fix` invocation Task 628 must run deliberately, not a
blanket repo-wide `--fix` pass (forbidden by this task's scope regardless).

## Recommended fix ordering (R4)

1. **Category 7 (unused vars, 4) + Category 8 (unused directive, 1)** — zero ambiguity, zero design decision,
   fully mechanical. Do first as a warm-up batch.
2. **Category 4 (unescaped entity, 1) + Category 2 (empty interface, 1)** — single-file, single-line, no design
   decision beyond the fix itself.
3. **Category 3 (`@ts-ignore`→`@ts-expect-error`, 1)** — mechanical but gated on the tsc re-verification described
   above; do after 1–2 so the batch isn't blocked by it.
4. **Category 1 (`storybook/no-renderer-packages`, 13)** — mechanical once Option A/B is decided (owner/Task 628
   choice); the single largest batch, but each file-level diff is trivial once the direction is picked.
5. **Category 5 (`ReportStatus` false-positive, 1)** — requires an explicit owner/Task 628 decision
   (`LISTING_STATUS_IGNORES` extension vs. domain-helper) before any edit; do not batch with Category 1's
   type-only-import changes since this one touches actual governance config or introduces new domain helpers.
6. **Category 6 (`no-explicit-any`, 25)** — lowest priority; explicitly accepted debt (`warn` severity, by design).
   Optional for Task 628; may be deferred to its own task without blocking closure of Categories 1–5.

## Proposed Task 628 scope split

**In scope for Task 628:** Categories 1 (with Option A/B decided first), 2, 3 (with the tsc verification step), 4,
7, 8 — all mechanical, low-risk, no product-behavior change. Recommended validation per the reusable checklist in
`docs/eslint-debt-taxonomy.md` ("Validation Checklist" section): `npm run typecheck`, `npm run build`,
`npm run lint` (record the new count), plus `npm run build-storybook` specifically for Category 1 (renders unaffected
by a type-only import change, but confirms no accidental breakage).

**Should NOT be in Task 628 by default — needs an explicit owner call first:** Category 5 (config/domain-boundary
decision, not a pure lint fix) and, at the owner's discretion, Category 6 (accepted low-priority typing debt — may
be split into its own task or skipped entirely without blocking 628's closure).

**Expected result if Task 628 takes the full recommended scope (Categories 1–4, 7, 8):** 47 → 26 problems
(17 → 1 errors [Category 5 remains open pending the config decision], 30 → 25 warnings [Category 6 remains,
deliberately deferred]). If Category 5 is separately resolved and Category 6 is fully addressed too: 47 → 0.

## Files Changed (this task)

| Path | Reason |
|---|---|
| `docs/sb10-lint-debt-inventory.md` | New — this inventory. |
| `docs/sessions/2026-07-19-task627-sb10-lint-debt-triage.md` | Session log. |
| `docs/backlog.md` | Concise state registration. |

No source, story, test, or config file was modified. `git diff --stat` on any non-doc path is empty (verified in
the session log).
