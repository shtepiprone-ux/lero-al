# Task 766 — Homepage: remove the last production Tailwind utility strings

**Sprint:** 65 — Homepage finishes the Tailwind exit (`tasks/Sprints/Sprint_65_Homepage_Finishes_The_Tailwind_Exit.md`)
**Priority:** P1 · **Status:** FILED — ready for executor · **Baseline:** `main` / `origin/main` @ `7b9a13c37`
**Depends on:** 763, 764, 765 — all approved and in `main`. **Does not depend on:** 667, global Tailwind removal.

---

## 1. Mode and task type

**Mode:** implementation (executor: Sonnet, via `.claude/skills/execute-task/SKILL.md`).
**Task type:** UI / Layout / Component — **current Mantine path**, mixed with **Legacy Tailwind Styling Governance**
for the utility strings being removed. The boundary: the three production files are Mantine surfaces that still carry
legacy Tailwind literals; the literals are legacy, everything replacing them is Mantine or CSS Module.
**Also:** a new governance detector (`check:homepage-literal-utilities`) is in scope, so the Docs/Governance rules for
detector controls apply to §6.

**QA profile:** `Q3 Full Visual Matrix` — see §13 for why.

## 2. Objective

Remove every Tailwind utility string that actually executes in the `/[locale]` production render graph, with **no
change in visual behavior**, and leave behind a control that makes their silent return impossible.

After this task the six live occurrences in three files are zero, no `design-tokens-allow:` marker remains in those
files, and a narrow AST-based gate fails if a static class literal reappears in any of them.

This is **not** a task about every Tailwind class in the repository. Other routes still have legitimate consumers. A
repository-wide grep as an acceptance criterion would be a false claim, and is forbidden here.

## 3. Verified context

All facts below were measured read-only on `7b9a13c37`, 2026-08-24, from the project root. Line numbers are
`FACT` at that commit and must be re-confirmed by the I0 step in §10.0 before any edit.

### 3.1 The six live occurrences

| # | File:line | Literal | Branch |
|---|---|---|---|
| 1 | `src/design-system/mantine/patterns/MantineListingCardPattern.tsx:186` | `'overflow-hidden'` | `layout === 'list'` Card |
| 2 | `src/design-system/mantine/patterns/MantineListingCardPattern.tsx:187` | `isArchived && 'grayscale opacity-60'` | `layout === 'list'` Card |
| 3 | `src/design-system/mantine/patterns/MantineListingCardPattern.tsx:314` | `'flex flex-col'` | grid Card (default return) |
| 4 | `src/design-system/mantine/patterns/MantineListingCardPattern.tsx:315` | `isArchived && 'grayscale opacity-60'` | grid Card (default return) |
| 5 | `src/components/shared/LocaleSwitcher.tsx:55` | `<Loader2 size={12} className="animate-spin" />` | Button `rightSection`, `isPending === true` |
| 6 | `src/app/[locale]/layout.tsx:50` | `className="min-h-[calc(100vh-4rem)]"` + trailing `design-tokens-allow:` marker | `<Box component="main">` route shell |

Occurrences 1 and 3 each carry an inline Task 691 comment stating the utility **loses** to Mantine `Card`'s own
unlayered rule. That is a documented claim, not a measurement — §5.1 requires it to be measured before removal.

### 3.2 Visual source map

| Visible artifact/state | Component/markup | Class/selector | Utility, cascade and token path | Disposition | Evidence |
|---|---|---|---|---|---|
| List card clipping | `Card` (`MantineListingCardPattern.tsx:180-190`) | `'overflow-hidden'` inside `cn()` | Tailwind `@layer utilities` → `overflow:hidden`; Mantine `Card` sets `overflow:hidden` **unlayered**, which wins per the cascade-layers spec | changed (removed) | computed `overflow` before/after, both branches |
| Grid card flex box | `Card` (`:305-317`) | `'flex flex-col'` inside `cn()` | Tailwind `@layer utilities` → `display:flex` + `flex-direction:column`; Mantine `Card` sets both unlayered | changed (removed) | computed `display`, `flexDirection` before/after |
| Archived card dimming, both layouts | `Card`, `:187` and `:315` | `'grayscale opacity-60'` | Tailwind → `filter: grayscale(100%)`, `opacity: .6` | changed (replaced by CSS Module) | computed `filter`, `opacity`, archived + normal, both branches |
| Pending locale spinner | `Loader2` in `Button` `rightSection` (`LocaleSwitcher.tsx:55`) | `"animate-spin"` | Tailwind `animate-spin` → `animation: spin 1s linear infinite`, keyframes owned by the Tailwind compiler | changed (replaced by CSS Module + `:root` token) | computed `animationName`/`-Duration`/`-TimingFunction`/`-IterationCount`, SVG box, both states |
| Route shell min height | `<Box component="main">` (`layout.tsx:50`) | `"min-h-[calc(100vh-4rem)]"` | Tailwind arbitrary value → `min-height: calc(100vh - 4rem)` | changed (replaced by Mantine style prop) | computed `min-height` on `main`, via the §13.1 route probe — **not** reachable from any Storybook command |
| Route shell mobile padding | same `Box` | `pb={{ base: 'var(--space-14)', md: 0 }}` | Mantine responsive style prop reading a `:root` token | **preserved — out of scope** | It is a Class-3 consumer owned by the future level-3 task; unchanged input ⇒ unchanged output, measured by the same §13.1 probe |
| Card hover / image zoom / trigger area | `.cardGrid:hover .imageSection img`, `imageActions` | Task 764 CSS | already de-Tailwinded and approved | **out of scope, byte-unmodified** | AC8 `git diff --stat` |
| `AppImage` radius/motion | `AppImage.module.css` | Task 763/765 | `var(--motion-*)`, `var(--radius-pill)` from `:root` | **out of scope, byte-unmodified** | AC8 |
| `PerfDevOverlay` | `layout.tsx:56` | — | returns `null` outside development | **out of scope** — Sprint 65 D65-A is an open owner decision | not touched |

### 3.3 Canonical UI decision record

| Visible artifact | Search queries and inspected paths | Canonical story/source | Disposition | Required implementation and registration |
|---|---|---|---|---|
| Listing card, grid + list, normal + archived | `find src -name '*.stories.tsx' \| grep -i listing`; opened `src/stories/patterns/mantine/ListingCardPattern.stories.tsx` and read its `Default` render body | `Mantine/Patterns/ListingCardPattern` → `Default` (`src/stories/patterns/mantine/ListingCardPattern.stories.tsx:214-260`) | **reuse** | The story already renders **both** branches and **both** archived cells: grid `id="6" archived` (`:233`) and list `id="12" layout="list" archived` (`:252`). No story edit, no probe, no new story. The archived styling moves into `MantineListingCardPattern.module.css`, which the story consumes through the real pattern. |
| Locale switcher, pending state | `find src -name '*.stories.tsx' \| grep -i locale`; opened `src/stories/mantine/primitives/LocaleSwitcher.stories.tsx` in full | `Mantine/Primitives/LocaleSwitcher` → `Default` | **reuse** | The story's third cell already renders `<LocaleSwitcher onSwitch={() => {}} isPending />`, i.e. the real pending spinner, not a stand-in. No story edit, no probe, no new story. |
| Route shell `<main>` min-height | `src/app/[locale]/layout.tsx` read in full; searched the harness for a route path — see §3.4 | none — a route layout has no Storybook story, by design | **reuse** (nothing to create) | Proven **only** by the §13.1 task-owned route probe against `next start`. A story must **not** be invented for it, and no Storybook command may be offered as its proof. |

**Permanent-story creation gate: satisfied with zero additions.** Every state this task must prove is already rendered
by an existing canonical story with the real production component. No permanent story is added or extended, and no
probe is needed. If the executor finds a state it cannot reach through these stories, that is a §14 stop condition —
not a licence to add markup.

### 3.4 Detector-aware facts

- **`--motion-duration-spinner` does not exist yet.** `grep -rn "motion-duration-spinner" src/ scripts/` → **zero
  matches** (`FACT`). It must be created by this task, in plain `:root`, per §5.2. The token this task tells the
  executor to consume is therefore one this task also defines — the "grep the definition, never the table" gate is
  satisfied by construction, and the executor must re-grep after adding it.
- **`:root` in `globals.css` opens at line 327**; Task 765's runtime block occupies `:333-339`
  (`--radius-pill`, `--motion-duration-{fast,base,slow}`, `--motion-ease-{standard,in,out}`). The new token is
  **added** to that block. None of those seven lines may change.
- **A left-behind marker is already a failing condition.** `scripts/check-design-tokens.mjs` classifies a
  `design-tokens-allow:` marker whose raw value is no longer detected on its line as `stale-marker` (`:636`,
  `:849-858`), and `--strict` exits non-zero when `staleMarkerFindings.length > 0` (`:1029-1030`). The npm script
  `check:design-tokens` runs `--strict`. So deleting the class at `layout.tsx:50` while leaving its marker behind is
  caught by an **existing** gate — AC5 is machine-enforced, not inspection-only.
- **No existing command renders `/[locale]`, so AC5 needs its own probe.** `scripts/responsive-screenshots.mjs`
  states in its own header that `--storybook-only` is "same as default" and that it captures "from built Storybook
  stories"; `scripts/check-stories-rendered.mjs` opens only the story iframe; the `playwright/` directory is empty and
  `package.json` has no route-capture or e2e script. Every command in §13 therefore proves things about Storybook, and
  **none of them can observe `<main>` on the real route.** This was a defect in the first draft of this kickoff, which
  asked for route-level computed styles and offered only Storybook commands as the evidence — corrected here by
  §13.1, not by weakening AC5. The repository's own precedent for this is `scripts/check-click-shield.mjs`
  (`BASE_URL=http://localhost:3000 npm run check:click-shield -- --route=/en`, `:44-58`), which drives real app routes
  with Playwright, and `scripts/task764-pointer-probe.mjs`, a task-owned probe whose per-label output is retained under
  `docs/sessions/evidence/task764/`.
- **`next start`, not `next dev`, is the correct server for AC5.** `check-click-shield.mjs:1031-1037` records that
  under `next dev` a full-viewport `<nextjs-portal>` DevTools overlay is present. AC5 measures the **production**
  render graph, and `npm run build` already runs in §13, so `npm.cmd run start` serves it with no extra build.
- **The new gate is satisfiable with zero false positives.** Every other `className` in the three files is either a
  CSS Module identifier (`styles.x`), an external prop (`className={className}`), or a member expression
  (`overlay.className`) — verified by reading all 27 `className=`/`cn(` sites in `MantineListingCardPattern.tsx` and
  the full text of the other two files. After the four literals are removed, **no** static class string literal
  remains in any of the three files.

### 3.5 Worktree state

`git --no-optional-locks status --short --branch` at task-design time reported `## main...origin/main` and a single
untracked path, `Codex-tasks/`, which is unrelated to this task and must not be staged, edited or removed. The
worktree is otherwise clean, so §10.0's status snapshot is a straightforward before/after comparison.

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | Sprint 65 §2 level 1 | The six occurrences in §3.1 are zero live occurrences in the three named files | P0 | Census re-run (§10.0, §10.6) | Confirmed |
| R2 | D28, agent-contract 12 | List and grid Card keep baseline `display`, `flexDirection`, `overflow` | P0 | Computed-style capture, both branches | Confirmed |
| R3 | D28 | Archived cards keep baseline `filter` and `opacity`, in **both** branches | P0 | Computed-style capture, archived + normal, both branches | Confirmed |
| R4 | §3.1 #2/#4 | Both archived literals are replaced by **one** role-named CSS Module contract used by both branches | P0 | Source inspection + R3 | Confirmed |
| R5 | §3.1 #5 | Pending spinner keeps Lucide `Loader2` at 12px, rotates continuously, driven by a local keyframe and `var(--motion-duration-spinner)` | P0 | Computed-style capture, pending + normal | Confirmed |
| R6 | Sprint 65 rule 4 | `--motion-duration-spinner: 1s` is declared exactly once, in plain `:root` | P0 | `grep`, `check:css-vars` | Confirmed |
| R7 | §3.1 #6 | Route shell keeps computed `min-height: calc(100vh - 4rem)` and its existing `pb`, via a Mantine API, with the marker deleted | P0 | Computed-style capture + `check:design-tokens` | Confirmed |
| R8 | Sprint 65 rule 1 | A new AST-based `check:homepage-literal-utilities` guards exactly those three files, and two executed plants proved it can fail | P0 | Plant transcripts + clean re-run | Confirmed |
| R9 | Sprint 65 rule 2 | No new `@apply`, `@theme inline` consumer, `design-tokens-allow:` marker, allowlist row or baseline row | P0 | Diff inspection + gate runs | Confirmed |
| R10 | Sprint 65 §4 | Task 763/764/765 files stay byte-unmodified | P1 | `git diff --stat` | Confirmed |

## 5. Implementation requirements

### 5.1 ListingCard — `MantineListingCardPattern.tsx` + its `.module.css`

1. **Measure first.** Before any edit, capture computed styles for list and grid, at `isArchived` false **and** true,
   from `Mantine/Patterns/ListingCardPattern` → `Default`. Minimum properties: `display`, `flexDirection`, `overflow`,
   `filter`, `opacity`, and the card and image box dimensions.
2. Remove `'overflow-hidden'` (`:186`) and `'flex flex-col'` (`:314`) **only after** the baseline shows the values
   Mantine already produces. Do **not** add replacement CSS for a property `Card` already sets — that would be a new
   declaration, not a migration. [R1, R2]
3. Replace **both** `isArchived && 'grayscale opacity-60'` literals with a single role-named CSS Module class (e.g.
   `styles.archived`), applied in the list branch and the grid branch. Its declared values must equal the captured
   baseline computed values exactly. Archived state is not re-interpreted here. [R1, R3, R4]
4. The new declaration must **not** be a Tailwind-shaped class name, a literal Tailwind utility, or `@apply`. Decide
   its cascade position from the baseline: if the removed utility was the thing that had to beat a Mantine rule, the
   replacement must be unlayered. Record the cascade reasoning in a comment next to the rule. [R4, R9]

### 5.2 Pending spinner — `LocaleSwitcher.tsx` + a new `LocaleSwitcher.module.css`

1. Keep Lucide `Loader2` exactly as the icon, so the SVG geometry does not change. `Loader2` receives **only**
   `className={styles.pendingIcon}` in place of `"animate-spin"`. [R5]
2. Create `src/components/shared/LocaleSwitcher.module.css` with a role-named `.pendingIcon` and a **local**
   `@keyframes` rotating the icon to `1turn`. `.pendingIcon` must declare
   `animation: <local-keyframe> var(--motion-duration-spinner) linear infinite`. [R5]
3. Add exactly one line to the plain `:root` block in `src/app/globals.css` (the Task 765 block at `:333-339`):
   `--motion-duration-spinner: 1s;`. This is the single source for the 1-second contract. **Do not touch
   `@theme inline`** — no legacy utility needs to alias this specialized token. [R6]
4. Forbidden: a Mantine `Loader` substitution, an inline raw duration, any Tailwind `animate-*`, any dependency on
   Tailwind-generated keyframes, a `design-tokens-allow:` marker, and any change to a Task 765 motion token. [R6, R9]

### 5.3 Route shell — `src/app/[locale]/layout.tsx`

1. Replace `className="min-h-[calc(100vh-4rem)]"` with the Mantine style prop `mih="calc(100vh - 4rem)"`, or another
   Mantine API that computes to the identical `min-height`. [R1, R7]
2. Keep `pb={{ base: 'var(--space-14)', md: 0 }}` exactly as it is. It is a Class-3 consumer owned by the future
   level-3 task and is out of scope here. [R7]
3. Delete the trailing `design-tokens-allow:` comment together with the class. It may **not** be moved into another
   comment, into an allowlist, or onto the replacement. Per §3.4, leaving it turns `check:design-tokens --strict`
   red as a `stale-marker`. [R7, R9]

## 6. The control that must ship before or with the fix

Create `check:homepage-literal-utilities` — a narrow guard over exactly the three files this task fixes. [R8]

**Contract**

- Uses a **TypeScript AST**, not a whole-file regex, so comments, historical names and doc text are never false
  positives.
- Inspects JSX `className` string literals and string literals passed to `cn()` **in those three files only**.
- Rejects any static class literal at those sites. Only CSS Module identifiers, Mantine props and an external
  `className` prop are permitted there.
- On a violation, prints file, line and the exact literal, and exits `1`. It has **no** comment marker and **no**
  author-reachable exemption path.
- Its header documents its own boundary in writing: *this guards three fixed production files; it is not a
  route-graph inventory, and Task 667 remains the only route-certification work.*
- Registered as an npm script in `package.json`, following the existing `check:*` convention.

**Two executed, reversible plants — required before the final edit**

| Plant | Temporary mutation | Required result |
|---|---|---|
| P1 | Add `className="animate-spin"` to the `LocaleSwitcher` trigger `Button` | new gate exits `1`, naming file, line and literal |
| P2 | Add `isArchived && 'grayscale opacity-60'` back into the grid `cn()` | new gate exits `1`, naming file, line and literal |

Revert each mutation before planting the next. Retain both full transcripts. After the reverts, `git diff` must contain
only the real implementation — no test-only runtime markup, no leftover import. A plant that was reasoned about but
not run does not count; report the actual exit code.

## 7. Scope

Only these may change:

- `src/design-system/mantine/patterns/MantineListingCardPattern.tsx` and `MantineListingCardPattern.module.css`
- `src/components/shared/LocaleSwitcher.tsx` and a new `src/components/shared/LocaleSwitcher.module.css`
- `src/app/[locale]/layout.tsx`
- one new narrow source-control script under `scripts/`, its `package.json` script entry, and its fixtures/test if §6
  needs them
- one new task-owned route probe, `scripts/task766-route-shell-probe.mjs`, and its retained output under
  `docs/sessions/evidence/task766/` (§13.1). It is evidence tooling, not a gate: it gets **no** `package.json` entry
  and nothing in CI depends on it, exactly like `scripts/task764-pointer-probe.mjs`.
- `src/app/globals.css` — **exactly one** new `:root` line, `--motion-duration-spinner: 1s`
- `docs/backlog.md` (concise state) and a new `docs/sessions/` log, per agent-contract clause 10

## 8. Out of scope

`AppImage.tsx`, `appImageConfig.ts`, `AppImage.module.css`, `SaveToCollectionButton`, the Task 764 hover CSS / scale /
`imageActions` slot, `AuthSheet`, `PerfDevOverlay`, global Tailwind configuration, removal of any `@import`,
`@theme inline`, translations, data, API, and any new or extended permanent Storybook story.

`'group'`, `group-hover`, the AppImage classes, the `listing` hover curve and the image trigger area were closed by
Tasks 763-765 and must not be touched.

## 9. Current and required behavior

**Current.** Six Tailwind utility strings execute in the route's render graph. Two of them (`overflow-hidden`,
`flex flex-col`) are documented as inert, losing to Mantine's unlayered `Card` rules. Two produce the archived card's
grayscale/dimmed look. One drives the pending locale spinner. One sets the route shell's min height and carries a
`design-tokens-allow:` marker.

**Required after.** Zero utility strings and zero markers in those files. Every rendered value listed in §3.2 is
unchanged, proven by computed styles rather than by a passing build. The archived look is owned by one CSS Module
contract used by both layouts; the spinner is owned by a local keyframe plus one `:root` token; the shell min height
is owned by a Mantine style prop. A new gate fails if any of it silently returns.

## 10. Positive flow and negative-flow applicability

**Positive flow.** On `/[locale]`: the route shell renders at `min-height: calc(100vh - 4rem)` with its mobile bottom
padding; the header's `LocaleSwitcher` shows `ChevronDown` at rest and a continuously rotating 12px `Loader2` while
`isPending`, with the Button disabled; listing cards render identically in grid and list, and archived cards render
grayscaled and dimmed in both.

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Validation | No | No form, schema or user input is touched | N/A | — |
| Authorization / RLS | No | No data access, action or route guard is touched | N/A | — |
| Offline / network | No | Existing network layer unchanged | Existing global behavior | — |
| Concurrent writer | No | No data model is touched | N/A | — |
| Reduced motion | **Yes** | Task 764's `prefers-reduced-motion` guard + the new spinner keyframe | The card zoom stays suppressed exactly as Task 764 left it. State the measured behavior of the new `.pendingIcon` under reduced motion; **do not add a new guard** — if the removed `animate-spin` had none, adding one is a behavior change and a §14 stop | Computed style under emulated `prefers-reduced-motion: reduce` |
| Archived listing | **Yes** | `isArchived` prop, both branches | `filter` and `opacity` equal to baseline | AC2/AC3 capture |
| No-image / sold / premium cards | **Yes** (regression only) | Existing story cells | Unchanged from baseline | Rendered comparison |
| Locale switch in flight | **Yes** | `isPending` prop | Button stays `disabled`; spinner rotates | AC4 |

### 10.0 Mandatory first action (I0 — freshness re-measure)

Before any edit, on a clean `main`, in **native Windows PowerShell**, from the project root:

```powershell
node.exe -p process.platform
git --no-optional-locks status --short --branch
git --no-optional-locks log -1 --oneline
rg -n --glob '*.tsx' 'overflow-hidden|grayscale opacity-60|flex flex-col|animate-spin|min-h-\[calc\(100vh-4rem\)\]' `
  src/design-system/mantine/patterns/MantineListingCardPattern.tsx `
  src/components/shared/LocaleSwitcher.tsx `
  'src/app/[locale]/layout.tsx'
```

`process.platform` must print `win32`. Expected: `7b9a13c37`, and **exactly six** live source occurrences — four in
the ListingCard pattern, one in `LocaleSwitcher`, one in the locale layout.

If the count, the files or the render path differ, **STOP and return `BLOCKED`**: record the new census, explain the
difference, and get this kickoff updated before touching code. An unexpected extra hit is a re-scope, never silent
extra work.

## 11. Acceptance criteria

- **AC1 [R1]** — Given the §10.0 census, when it is re-run after implementation, then the three named files show
  **6 → 0** live occurrences. Comments do not count as production occurrences, and the final run must be pasted.
- **AC2 [R2]** — Given the pre-change computed capture, when list and grid Cards are re-measured after the change,
  then `display`, `flexDirection` and `overflow` are identical to baseline in both branches.
- **AC3 [R3, R4]** — Given archived and normal cards, when measured in **both** the list and grid branches, then
  `filter` and `opacity` are identical to baseline, and both branches read the same single CSS Module class.
- **AC4 [R5]** — Given `isPending`, when the `LocaleSwitcher` trigger is measured, then the icon is Lucide `Loader2`
  at 12px, `.pendingIcon` resolves to the local keyframe with computed duration `1s`, `linear`, `infinite`; the
  non-pending state has no animation; and the Button remains `disabled` while pending.
- **AC5 [R6, R7]** — Given the §13.1 route probe run against `next start` at `320×812` and `1440×900` on `/en`,
  when `route-shell.pre-edit.json` and `route-shell.post-edit.json` are compared cell by cell, then for `main` the
  computed `minHeight` and `paddingBottom` strings are **identical** at each viewport (`minHeight` resolving to
  `748px` at height 812 and `836px` at height 900 if `calc(100vh - 4rem)` is preserved — assert equality against the
  captured baseline, not against these illustrative numbers), the probe's own `resolvedFrom` field shows the value no
  longer originates from a Tailwind utility class, and the `design-tokens-allow:` marker is absent from the source,
  from the diff and from every allowlist. Both JSON files are retained. A Storybook command may **not** be offered as
  evidence for any part of this criterion.
- **AC6 [R8]** — Given the new gate, when P1 and P2 are actually run, then each produces exit `1` naming file, line
  and literal; and after both reverts a clean run exits `0`. All three transcripts are retained.
- **AC7 [R9]** — Given the final diff, then it introduces no `@apply`, no new `@theme inline` consumer, no
  `design-tokens-allow:` marker, and no allowlist or baseline row anywhere.
- **AC8 [R10]** — Given `git diff --stat` against `7b9a13c37`, then `AppImage.tsx`, `appImageConfig.ts`,
  `AppImage.module.css`, the Task 764 hover/trigger code and all Task 765 files are absent from it, and
  `src/app/globals.css` shows exactly one added line.

## 12. Pre-read rule bundle

Read exactly these — not "all docs":

- `docs/agent-contract.md`
- `docs/rule-index.md`
- `docs/qa-profiles.md`
- `docs/backlog.md`
- `tasks/Sprints/Sprint_65_Homepage_Finishes_The_Tailwind_Exit.md` — its binding rules bind this task
- `docs/mantine-responsive-design-system.md` — §18 cascade/CSS-module guidance for §5.1's unlayered decision
- `docs/tailadmin-style-reference.md` — visual provenance for any value that is written down
- `docs/component-rules.md`
- `docs/ui-rules.md` — routing and the legacy boundary only
- `docs/qa-rules.md`
- `docs/storybook-governance.md` — §14.9.17 per-story viewport mechanism, before claiming a breakpoint tier
- `docs/critical-flow-registry.md` — scan only, to confirm no listed flow is touched
- `tasks/Sprints/Sprint_63_kickoff_prompt_Task_764_Listing_Hover_Fold.md` and
  `Sprint_64_kickoff_prompt_Task_765_Runtime_Motion_Radius_Tokens.md` — to know precisely what must stay untouched
- `scripts/task764-pointer-probe.mjs` (header + context setup) and `scripts/check-click-shield.mjs` (`:40-60`,
  `:1020-1060`) — the two precedents the §13.1 route probe is modelled on. Read them before writing it.

## 13. QA profile and verification plan

**Profile: `Q3 Full Visual Matrix`.** It applies because the changed surfaces include a migrated Mantine pattern's
card chrome, a header navigation control, and the page shell — three of the categories `docs/qa-profiles.md` names for
Q3 — and because the whole claim of this task is "nothing rendered differently", which only full rendered evidence can
support. Read the per-story viewport set out of the manifest for each story before claiming a tier is covered; do not
infer coverage from the union of the run.

Run everything in **native Windows PowerShell**. Record platform, Node version, working directory, the exact command
and the real exit code for each.

```powershell
npm.cmd run check:homepage-literal-utilities
npm.cmd run check:tailwind-runtime-tokens
npm.cmd run check:design-tokens
npm.cmd run check:css-vars
npm.cmd run typecheck
npm.cmd run build
npm.cmd run build-storybook
npm.cmd run check:stories
npm.cmd run screenshots:responsive:storybook
npm.cmd run screenshots:assert
```

`npm.cmd run build` exiting `0` on the final diff is a hard gate; a failed, unrun or stale build permits only
`PARTIALLY IMPLEMENTED` or `BLOCKED`.

**Every command above proves something about Storybook.** None of them renders `/[locale]` (§3.4). The route shell is
covered by §13.1 and by nothing else.

### 13.1 Route-shell capture — the only proof path for AC5

Write `scripts/task766-route-shell-probe.mjs`, modelled on `scripts/task764-pointer-probe.mjs`: a task-owned Playwright
probe, `node scripts/task766-route-shell-probe.mjs <label>`, writing per-label (never overwriting) to
`docs/sessions/evidence/task766/route-shell.<label>.json`.

**Contract**

- Reads `BASE_URL` from the environment, defaulting to `http://127.0.0.1:3000`, matching
  `check-click-shield.mjs:58`.
- Navigates to `${BASE_URL}/en` in two contexts with **pinned** viewports — `320×812` and `1440×900`. The heights are
  pinned because `min-height: calc(100vh - 4rem)` resolves against viewport height; a drifting height makes the
  pre/post comparison meaningless.
- For each cell, resolves `document.querySelector('main')` — `<Box component="main">` renders exactly one — and records
  `minHeight`, `paddingBottom`, `display`, plus `getBoundingClientRect()`, from `getComputedStyle`.
- Also records `main.className` and a `resolvedFrom` field naming which stylesheet rule or inline style supplies
  `min-height`, so the post-edit run positively shows a Mantine-owned source rather than a Tailwind utility.
- **Fails closed:** if `main` is absent, the response status is not OK, or a `<nextjs-portal>` element is present
  (meaning a `next dev` server was used by mistake), it writes what it measured and exits non-zero.

**Sequence — both runs are required, and the pre-edit run must happen before any source edit**

```powershell
node.exe -p process.platform          # must print win32
npm.cmd run build                     # pre-edit production build, on clean main
Start-Process npm.cmd -ArgumentList 'run','start'   # next start on :3000, leave running
node.exe scripts/task766-route-shell-probe.mjs pre-edit
# stop the server, apply the §5 implementation, then:
npm.cmd run build
Start-Process npm.cmd -ArgumentList 'run','start'
node.exe scripts/task766-route-shell-probe.mjs post-edit
```

Stop the server after each capture. If a port other than 3000 is used, pass it through `BASE_URL` and record the exact
value in the report.

**Rendered evidence must cover:** from Storybook — the canonical listing story's list **and** grid sections in normal
and archived cells, and the `LocaleSwitcher` story's pending cell, across all four locales at 320 and at the selected
desktop width; from §13.1 — the route shell at 320 and 1440. Every Storybook state is reachable from an existing story
(§3.3); if one turns out not to be, use a reversible probe and prove its restoration with the story's pre-probe
`git hash-object` value plus the path's absence from `git status --porcelain`. Do **not** add a permanent story, and
do **not** invent a Storybook story for the route layout.

**Comparator.** When the claim is "nothing rendered differently", the tolerance for md5-changed cells is governed by
`docs/storybook-governance.md` §14.11 (D26). Do not invent a per-task pixel tolerance.

## 14. Stop conditions

Return `BLOCKED` — do not improvise — if any of these hold:

1. The §10.0 baseline does not match §3.1 (count, file, or render path).
2. `process.platform` is not `win32`, or a required command cannot run natively.
3. A Card's computed style turns out to depend on an unexpected external utility.
4. Parity for the spinner cannot be reached without widening the global-token decision beyond the single
   `--motion-duration-spinner` line.
5. A required state cannot be rendered from the existing canonical stories. (§3.3 measured that all of them can be —
   so this firing is itself evidence that the baseline drifted.)
6. Preserving current behavior would require adding a `prefers-reduced-motion` guard the removed utility did not have.
7. The §13.1 probe cannot reach `/en` — `npm.cmd run start` will not serve, `main` is absent, or the response is not
   OK. Do **not** substitute a Storybook capture, a story built for the layout, or a reasoned argument; AC5 has no
   other proof path, so this is `BLOCKED`.
8. The pre-edit probe run was missed and source has already been edited. The baseline is unrecoverable without a
   `git stash`, which is owner-only — stop and hand back rather than reconstructing a baseline from the post-edit tree.

## 15. Completion report contract

Report status as `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`. **Never
self-approve.** Include:

1. Files changed (table matching the real diff) and requirement IDs completed.
2. The 6 → 0 census: the §10.0 run and the final run, both pasted.
3. Baseline vs post computed-style table for every property in §3.2, per branch and per state.
4. Proof of `.pendingIcon` and `--motion-duration-spinner`: the grepped `:root` definition line, and the computed
   `animationName` / `-Duration` / `-TimingFunction` / `-IterationCount`.
5. P1 and P2 transcripts with real exit codes, plus the post-revert clean run.
5a. Both §13.1 probe artifacts — `docs/sessions/evidence/task766/route-shell.pre-edit.json` and
   `route-shell.post-edit.json` — plus the `BASE_URL` used, the pinned viewports, and a cell-by-cell diff of
   `minHeight` / `paddingBottom` / `resolvedFrom`.
6. Every command from §13 with platform, Node version, exact command and actual exit code.
7. Exact `git status --short` and `git diff --stat` at the end.
8. An explicit list of what was **not** touched (§8), including the AppImage and Task 764/765 byte-equality check.
9. Assumptions, deviations, known limitations, unresolved issues, and the evidence a reviewer will need.
10. A concise `docs/backlog.md` state update and a `docs/sessions/` log with a "Files Changed" table matching the
    real diff. Do not write history into the backlog.

**Do not run, emit, or suggest any mutating git command.** Committing and pushing is owner-only.

---

## Task quality gate — checked before publication

- A fresh Sonnet session can execute this without hidden chat context — yes; every fact, path and line number is in
  §3 and re-measured by §10.0.
- Every primary requirement has a binary AC and a verification method — R1→AC1, R2→AC2, R3/R4→AC3, R5→AC4,
  R6/R7→AC5, R8→AC6, R9→AC7, R10→AC8.
- Scope names what must not change — §8, AC8.
- UI publication checks — current/legacy boundary (§1), QA profile (§13), source map (§3.2), canonical decision
  record (§3.3), preservation classifications (§3.2) all explicit and evidenced.
- Permanent-story gate — zero additions; both canonical stories inspected in source, both already render the real
  production components in the required states (§3.3).
- Negative flows selected by applicability, not copied (§10).
- No uninspected command, file, story or behavior is claimed. `check:design-tokens`'s stale-marker semantics,
  the absence of `--motion-duration-spinner`, the `:root` line range and the story cells were each read directly.
- **Every acceptance criterion has a command that can actually observe it.** Corrected after review: the first draft
  required route-level computed styles for AC5 while offering only Storybook commands, which cannot render
  `/[locale]` — a task-design defect, retained here rather than softened. Fixed by adding §13.1, a concrete
  Windows-native route capture against `next start` selecting `main`, and by naming its two repository precedents.
  AC5 was **not** narrowed to fit the existing harness, because the harness cannot see the thing the task changes.
- The requested gate proves changed behavior — §6 requires two executed plants, not a procedural assertion.
- No owner-only exception is asserted; D65-A stays an open owner decision and is kept out of scope rather than
  resolved by this task.

### FACTS

Six live occurrences at the exact lines in §3.1; `HEAD` `7b9a13c37` with `Codex-tasks/` the only untracked path;
`--motion-duration-spinner` undefined anywhere; `:root` opens at `globals.css:327` with Task 765's block at `:333-339`;
`check-design-tokens.mjs` fails `--strict` on a stale marker; both canonical stories already render every required
state with the real components; no static class literal remains in the three files once the four are removed;
`responsive-screenshots.mjs` captures only built Storybook stories (`--storybook-only` is "same as default", its own
header), `check-stories-rendered.mjs` opens only the story iframe, `playwright/` is empty and `package.json` has no
route-capture script — so no existing command can observe `<main>` on `/[locale]`; `npm run start` = `next start`
exists; `check-click-shield.mjs` and `task764-pointer-probe.mjs` are the two in-repo precedents for a route/rendered
Playwright probe, the latter retaining per-label output under `docs/sessions/evidence/task764/`.

### INFERENCES

That `overflow-hidden` and `flex flex-col` are inert follows from the Task 691 comments plus the cascade-layers rule —
which is exactly why §5.1 requires it **measured** before removal rather than assumed.

### UNKNOWNS

The computed behavior of `.pendingIcon` under `prefers-reduced-motion: reduce`. The removed `animate-spin` had no
guard; §10's table requires the executor to measure and report, and §14.6 makes adding one a stop condition rather
than a judgment call.

### CONFLICTS

The draft kickoff header read "Sprint 63". Sprint 63's goal is closed and its two tasks are approved and pushed.
Resolved by owner decision **D65-B** (2026-08-24): this task is filed in Sprint 65.

**Owner decision still needed:** **D65-A** — whether `PerfDevOverlay.tsx` belongs to the Homepage production exit
criterion. It does not block Task 766; it blocks a clean level-4 claim in Task 769.
