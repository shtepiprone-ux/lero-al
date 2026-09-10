# Task 808 — the detail route logs a React `key` warning on every render, and nobody knows which array it is

Sprint 71 · `tasks/Sprints/Sprint_71_The_Listing_Detail_Route_Leaves_Tailwind.md` · P2 · QA **Q2**

## 1. Mode and task type

`BUG ANALYSIS` → `IMPLEMENTATION`. Two phases in one task: **identify the real array site by measurement**, then fix
it and leave a regression guard behind. Strongest permitted result is `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.
No self-approval, no mutating Git.

**This task does not accept a guessed cause.** §3.4 lists two hypotheses that were already tested and refuted at
source; a third guess of the same kind is not progress. R1 is a measurement requirement, and its evidence is what
authorises the fix in R2.

## 2. Objective

`/[locale]/listings/[slug]` logs `Each child in a list should have a unique "key" prop` on every dev render. Find
the array that actually causes it, fix it at that site, and add a test that fails if it comes back.

## 3. Verified context — measured 2026-09-10, do not re-derive from a document

### 3.1 The observed error, verbatim from the owner's dev overlay

```
Console Error
Each child in a list should have a unique "key" prop.

Check the render method of `@mantine/core/Box`. It was passed a child from ListingDetailViewBody.
See https://react.dev/link/warning-keys for more information.

    at ListingDetailViewBody (src\modules\listings\components\ListingDetailView.tsx:243:5)
    at ListingDetailView (src\modules\listings\components\ListingDetailView.tsx:496:5)
    at ListingPage (src\app\[locale]\listings\[slug]\page.tsx:247:5)

Next.js version: 15.5.18 (Turbopack)
```

`FACT` — React's wording splits into two different components: *"Check the render method of `X`"* names the
component whose render produced the **array**; *"It was passed a child from `Y`"* names the **owner** of the element
that lacks a key — the component in which that element was created. So: an element created in
`ListingDetailViewBody` is rendered inside an array by a `@mantine/core/Box`.

`INFERENCE` — the frame `ListingDetailView.tsx:243:5` is the overlay's pointer at the owner component, and 243 is
simply the first JSX expression in `ListingDetailViewBody`'s body (`favoriteSlot`'s `<FavoriteButton>`). Treat it as
*"somewhere in `ListingDetailViewBody`"*, **not** as a confirmed culprit. Every element created in that function is
a candidate.

### 3.1a Second reproduction — owner, 2026-09-10, AFTER Task 807 landed. This one carries a code frame.

`FACT` — verbatim from the owner's dev overlay, supplied during Task 810's review:

```
Console Error
Each child in a list should have a unique "key" prop.

Check the render method of `@mantine/core/Box`. It was passed a child from ListingDetailViewBody.
See https://react.dev/link/warning-keys for more information.

    at ListingDetailViewBody (src\modules\listings\components\ListingDetailView.tsx:256:21)
    at ListingDetailView (src\modules\listings\components\ListingDetailView.tsx:501:5)
    at ListingPage (src\app\[locale]\listings\[slug]\page.tsx:247:5)

Code Frame
  254 |   ) : undefined
  255 |
> 256 |   const shareSlot = <ListingShareButton listingTitle={listing.title} listingUrl={listingUrl} />
      |                     ^
  257 |
  258 |   const badges: ListingDetailBadge[] = [

Next.js version: 15.5.18 (Turbopack)
```

Three things this adds over §3.1, and one thing it does not:

1. `FACT` — **the warning is still live at `HEAD` after Task 807.** §3.1 was captured before 807's commit
   (`03ff9d280`), which edited `ListingDetailView.tsx`. The defect survived that diff.

2. `FACT` — **§3.3's line numbers are stale and must be re-measured before use.** 807 shifted the file:
   `favoriteSlot` is now at **:247** (was :243), `shareSlot` at **:256** (was :251), `badges` at **:258**, and
   `ListingDetailView` at **:501** (was :496). Read the current file; do not cite §3.3's column 1 as-is. The
   *candidate set* is unchanged — only the coordinates moved.

3. `FACT` — **this overlay has a code frame and §3.1's did not.** The caret sits on `shareSlot`'s
   `<ListingShareButton …>`, at column 21 — the element-creation expression, not the statement.

4. `UNKNOWN` — **whether `shareSlot` is the culprit.** React's code frame for a key warning points at the creation
   site of the element it believes lacks a key, which is a materially stronger signal than §3.1's bare
   `:243` frame (that one was the overlay pointing at the owner component, and §3.1 already says to read it as
   "somewhere in `ListingDetailViewBody`"). But R1 still decides this, not this note: **reproduce it, print it, and
   name the array.** Two live facts keep this open — `shareSlot` and `favoriteSlot` are passed as *separate named
   props* (`share=`, `favorite=`) and land in the same `<Group>` in `MantineListingDetailPattern`, and §3.4 already
   refuted `Group` as an unkeyed-array producer at source. Something between those two facts is wrong, and finding
   which is the task. Do **not** open with a speculative `key` on `shareSlot`; a fix that silences the warning
   without naming the array is exactly the outcome R3's guard exists to prevent.

### 3.1b This is not Task 810 either — measured 2026-09-10, at the end of 810's Revision 1

`FACT` — the owner re-reported the identical overlay (same `:256:21` / `:501:5` / `:247:5` frames, same code frame on
`shareSlot`) while Task **810** Revision 1 sat uncommitted in the worktree, and read it as "Sonnet broke something".
It is not. Three measurements refute that reading:

1. `git --no-optional-locks status --short -- src/modules/listings/components/ListingDetailView.tsx
   src/design-system/mantine/patterns/MantineListingDetailPattern.tsx` returns **empty**. Neither file is in Task
   810's diff, in either revision.
2. `git --no-optional-locks log --oneline -2 -- src/modules/listings/components/ListingDetailView.tsx` names
   **`03ff9d280` (Task 807)** and **`3d6999ef9` (Task 803)**. Nothing since.
3. §3.1's capture predates Task 810 entirely — it was taken before 810's kickoff was written, with the pre-807 line
   numbers. The same warning, at the same component, before and after 810's diff.

`INFERENCE` — Task 810 *is* visible on this route (its track renders the similar-listings rail, and Revision 1 made
the module `'use client'`), which is why the coincidence is tempting. But the warning's owner component is
`ListingDetailViewBody`, its array renderer is a `@mantine/core/Box`, and 810 changed neither the elements
`ListingDetailViewBody` creates nor how the detail pattern renders them. **Do not spend a single step of R1 on the
card track.** If the reproduction nevertheless implicates it, that is a finding worth reporting loudly — but start
from §3.3's candidate set.

### 3.2 This is not Task 803

`FACT` — `git --no-optional-locks diff -U0 src/modules/listings/components/ListingDetailView.tsx` at the time of
803's approval showed hunks at lines **29**, **82-88**, **93-106**, **506**, **508-517** only. Line 243, line 471
(`favorite={favoriteSlot}`) and `MantineListingDetailPattern.tsx` are untouched by 803. The warning predates it and
belongs to this sprint's own composition work (784/793 moved `favorite` + `share` into the badges row).

### 3.3 The candidate set — every element created in `ListingDetailViewBody`

`FACT` — read from the file. These are the elements the warning could be about, with where each one lands:

| Created at | Passed as | Rendered by |
|---|---|---|
| `:243` `favoriteSlot` (`<FavoriteButton>`) | `favorite=` (`:471`) | `MantineListingDetailPattern:184`, inside `<Group gap="xs" wrap="nowrap">` |
| `:251` `shareSlot` (`<ListingShareButton>`) | `share=` (`:472`) | same `Group`, `:185` |
| `:262-266` `mappedFeatures[].icon` (`<ListingFeatureIcon>`) | `features=` | `:247` `features.map((f,i) => <Stack key={i}>… <span>{f.icon}</span> …)` |
| `gallerySlot` | `gallerySlot=` | `:150`, single child |
| `contactSlot` | `contactSlot=` | pattern's sidebar |
| `:359-386` `contentFooter` (a Fragment) | `contentFooter=` (`:470`) | `:300`, single child of a `Stack` |
| `:407-412` `intermediate` | `ListingsPageFrame` | plain `{label, href}` objects, **not elements** — cannot be this |

### 3.4 Two hypotheses already tested and REFUTED — do not spend time on them again

1. **"Mantine `Group` turns static JSX children into an unkeyed array."** ~~`FACT` — refuted at source~~ —
   **THIS REFUTATION WAS WRONG. Corrected by Task 808's own R1 reproduction and re-verified by the reviewer at
   source, 2026-09-10.** `Children.toArray` assigns a positional key *and*, in the same pass, stamps a
   "still needs a real key" sentinel on any child that had `key == null` and had never been validated:
   `node_modules/react/cjs/react.development.js:388-391` — `null == invokeCallback.key && invokeCallback._store &&
   !invokeCallback._store.validated && (escapedPrefix._store.validated = 2)`. The reconciler then warns on exactly
   that sentinel: `node_modules/react-dom/cjs/react-dom-client.development.js:26042-26049` —
   `warnForMissingKey` fires when `2 === child._store.validated`. So a `Group` **can** produce this warning from
   static children whose elements were created as standalone consts. The paragraph below read
   `filter-falsy-children.mjs` and stopped there; it never read `mapIntoArray`. **The original text is kept
   struck-through, not deleted, because a kickoff fact that survived into an executor's pre-read is exactly the
   failure this project keeps recording.** The refutation as written was:
   `node_modules/@mantine/core/esm/components/Group/Group.mjs:62` calls `filterFalsyChildren(children)`, and
   `node_modules/@mantine/core/esm/components/Group/filter-falsy-children/filter-falsy-children.mjs` is
   `Children.toArray(children).filter(Boolean)`. `Children.toArray` **assigns keys**. A `Group` cannot produce this
   warning from static children.
2. **"`features.map` is missing a key."** `FACT` — refuted at source:
   `MantineListingDetailPattern.tsx:248` is `<Stack key={i} gap="micro">`. The same holds for `amenities.map` at
   `:285`.

Record any further hypothesis the same way — refuted **at source**, with the file and line — before moving on.

### 3.5 What exists to reproduce with

`FACT` — `vitest.config.ts` and `src/tests/setup.ts` contain no `console` handling at all (grepped): a React key
warning does **not** currently fail any test. The regression guard R3 asks for must therefore install its own spy;
it cannot rely on an existing global.

`FACT` — the canonical story for the pattern is `src/stories/patterns/mantine/ListingDetailPattern.stories.tsx`,
and `ListingDetailView.stories.tsx` exists beside it. Read both before writing a reproduction.

`FACT` — `ListingDetailView` is an `async` Server Component (`:496`); `ListingDetailViewBody` is the synchronous
inner component. A vitest render targets `ListingDetailViewBody` or `MantineListingDetailPattern`, never the async
outer one.

## 4. Requirements

| ID | Requirement | Priority | Verified by |
|---|---|---|---|
| **R1** | The array site that produces the warning is **identified by a reproduction**, not by reading: a failing artifact that prints the warning, plus the file and line of the array and of the element that lacks a key. | P0 | AC1 |
| **R2** | The warning is fixed at that site, with keys derived from stable identity (not array index) where an identity exists. Zero visual change. | P0 | AC2, AC4 |
| **R3** | A test fails on the warning before the fix and passes after — the same test, unmodified between the two runs. | P0 | AC3 |
| **R4** | No other console error or warning is introduced on the route, and none that already existed is silenced rather than fixed. | P1 | AC5 |
| **R5** | The rendered detail route is visually unchanged at the Q2 widths. | P1 | AC4 |

## 5. Assumptions and open questions

- **`UNKNOWN` — the culprit.** That is the task. §3.3 is the candidate set and §3.4 is what has already been ruled
  out; neither is a prediction of the answer.
- **`ASSUMPTION (reversible, stated)`** — the warning reproduces in a vitest render of
  `MantineListingDetailPattern` with the slot shape `ListingDetailViewBody` actually passes (React elements in
  `favorite`/`share`/`contentFooter`/`features[].icon`). **If it does not reproduce there, that is a result, not a
  failure**: it means the array lives above the pattern, in `ListingDetailViewBody`'s own tree
  (`ListingsPageFrame`, the outer `Stack`/`Box`), and the next probe moves up one level. Record which level
  reproduced it.
- **`UNKNOWN`** — whether the same warning fires on other routes. Out of scope: fix the one the owner reported,
  and report in the completion note whether the same shape exists elsewhere without changing it.

## 6. Pre-read rule bundle

`CLAUDE.md` · `docs/agent-contract.md` (clause 15) · `docs/ai-behavior.md` Notes 18-23 · `docs/rule-index.md` →
**Current Mantine path**: `docs/mantine-responsive-design-system.md`, `docs/component-rules.md` ·
`docs/qa-rules.md` · `docs/qa-profiles.md` · `docs/backlog.md` · this sprint's plan file.
Do not read all docs.

## 7. Scope

The one file that owns the array the reproduction identifies — expected to be one of
`src/modules/listings/components/ListingDetailView.tsx` or
`src/design-system/mantine/patterns/MantineListingDetailPattern.tsx`, but the reproduction decides, not this
sentence · one new or extended test under `src/design-system/mantine/patterns/__tests__/` or
`src/modules/listings/components/__tests__/` · `docs/backlog.md` state and the session log.

## 8. Out of scope

- **Every other file.** If the reproduction points at a third file, stop and report `BLOCKED — SCOPE`, naming it;
  do not widen the diff on your own.
- **`MantineListingDetailPattern.tsx:250`'s `className="shrink-0 text-muted-foreground"`** — raw Tailwind utilities
  still sitting inside a canonical Mantine pattern. Real, and exactly this sprint's goal, but it is a de-Tailwind
  slice with its own visual risk. Report it in the completion note; **do not touch it here.**
- Task 803's uncommitted diff, Task 806's track work, `ListingCard`, the gallery/lightbox (794), the dialogs (795).
- Suppressing the warning — an `eslint-disable`, a `key={Math.random()}`, a `console.error` filter, or wrapping the
  array in a Fragment purely to silence React — is a task failure, not a fix.

## 9. Current and required behavior

**Before:** every dev render of `/uk/listings/<slug>` logs the §3.1 warning. Production is unaffected in output but
the underlying array is genuinely unkeyed, so React reconciles those children by position — a real
reorder/state-loss hazard, not only noise.

**After:** the route renders with no key warning; the array has stable keys; the rendered output is identical.

## 10. Implementation requirements

### 10.1 Phase 1 — reproduce (R1)

Work outward, cheapest first, and record each level's result:

1. A vitest render of `MantineListingDetailPattern` with the real slot shape from §3.3 (React elements, not
   strings). Spy on `console.error` and assert the message. If it fires — that is the level; read the pattern's
   render for the array whose items lack keys.
2. If it does not fire, render `ListingDetailViewBody` directly (it is synchronous) with the props
   `ListingDetailView` builds, and repeat.
3. If it still does not fire, capture it from the running app instead: `npm run dev`, open the route, and record
   the full React component stack from the browser console — not a screenshot of the overlay, the stack text.

Whichever level fires, the deliverable is the same: **the file and line of the array**, and **the file and line of
the element that lacks a key**, quoted.

### 10.2 Phase 2 — fix (R2)

Add keys at the array site. Use stable identity where one exists (an id, a slug, a param name); `key={i}` is
acceptable only when the list is fixed-length and never reordered, and the reason must be stated in a comment. If
the array is an accident — slots collected into an array that should have been separate JSX children — fixing the
shape is preferred over adding keys to a structure that should not exist. State which of the two you did and why.

### 10.3 Phase 3 — the guard (R3)

The test from Phase 1 becomes the regression guard. It must:

- install its own `console.error` spy (§3.5: nothing global does this);
- assert on the specific message, not on "no console output at all" — an unrelated future warning must not make it
  red for the wrong reason;
- have been observed **failing** before the fix and **passing** after, with the file byte-identical between the two
  runs. Quote both outputs. A guard whose failing arm was never fired is not evidence that it measures anything.

## 11. Positive and negative flows

**Positive:** open `/uk/listings/<slug>` in dev → no key warning in the console; the page renders exactly as before.

| Negative flow | Applicable | Why |
|---|---|---|
| Listing without coordinates (`contentFooter`'s map branch absent) | **Yes** | Changes the Fragment's child count — a shape-dependent bug would move. |
| Listing with no features / no amenities | **Yes** | Empty arrays are the classic off-by-one for a keying fix. |
| Staff preview (`isStaffPreview`) | **Yes** | Suppresses `recentlyViewedSlot`, again changing the child set. |
| Unauthenticated visitor (`effectiveCanReport` false, `favoriteSlot` present) | **Yes** | Removes one slot from the badges row. |
| `effectiveListingId` absent → `favoriteSlot` is `undefined` | **Yes** | The one branch that makes a slot falsy. |
| Locale switch | No | The warning is structural, not text-dependent. |
| RLS / authorization | No | No query changes. |

## 12. Acceptance criteria

- **AC1 [R1]** — Given the Phase 1 artifact, then it prints the §3.1 message and the session log names the array's
  file and line **and** the unkeyed element's file and line, each quoted from source. A cause stated without a
  reproduction that printed the warning does not satisfy this.
- **AC2 [R2]** — Given the fixed file, then the array carries keys from stable identity (or `key={i}` with a stated
  reason), and the diff touches exactly one production file.
- **AC3 [R3]** — Given the guard test run **before** the fix, then it fails on the key message; given the same test
  file, byte-identical (`git hash-object` quoted for both runs), run **after** the fix, then it passes. Quote both
  transcripts.
- **AC4 [R2, R5]** — Given `/uk/listings/<slug>` on a production build, then the browser console contains no
  `Each child in a list` message, and the rendered route is unchanged at 320 / 390 / 768 / 1024 / 1440 (`uk@320`
  mandatory), confirmed by the owner's visual matrix.
- **AC5 [R4]** — Given the dev console for one full route load before and after, then the after-set is the
  before-set minus the key warning: no new message, and nothing else silenced.

## 13. QA profile and verification plan

**Profile: `Q2 Standard UI`.** `docs/qa-profiles.md`: a UI change touching an existing surface that creates or
migrates no primitive. It is not Q3 — no new primitive, no responsive contract change — and not Q4 — no file in
`docs/critical-flow-registry.md` is touched.

```powershell
$slug = "shitet-gazonjere-ne-pogradec-mtu8u1lg"
$ev = "$PWD\docs\sessions\evidence\task808"
$utf8 = New-Object System.Text.UTF8Encoding($false)
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
New-Item -ItemType Directory -Force -Path $ev | Out-Null
node.exe -p process.platform
npm.cmd run typecheck
npm.cmd run lint
npx.cmd vitest run src/design-system src/modules/listings
npm.cmd run test
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
```

Expected: `win32` · typecheck 0 errors · lint 0 errors and the current warning count with no new file named · the
targeted suites green including the new guard · `npm run test` at the Task 790 baseline — name each failing file and
prove it pre-existing · `build` exit 0 with `ƒ /[locale]/listings/[slug]` present · both hygiene gates 0. Return each
exit code read from **inside** its retained transcript.

**Transcript rule.** No `Tee-Object`. Capture with `& cmd.exe /c "<command> 2>&1"`, write with
`[System.IO.File]::WriteAllLines(path, lines, $utf8)`, append `EXIT_CODE=$LASTEXITCODE` **inside** the file, and set
`[Console]::OutputEncoding` before the first capture (Task 803 F9 — otherwise the eslint `✖` lands as `Ô£û`).
Retain everything under `docs/sessions/evidence/task808/`.

**Live-route console evidence (AC4/AC5).** A green build is not evidence for a `ƒ` route (D71-1), and this defect is
console-only — a screenshot cannot show it. Capture the console of one full load before and after the fix and retain
both. Numbered steps, because these are not commands:

1. `npm run dev`, open `http://localhost:3000/uk/listings/$slug`, and copy the **complete** console output to
   `$ev\console-before.txt`.
2. Apply the fix, reload, and copy the complete console output to `$ev\console-after.txt`.
3. State the set difference in the session log: the after-set must be the before-set minus the key warning.

**`OWNER VISUAL QA REQUIRED`** — on the live route, not the Storybook toolbar (Task 799):

| Surface | State | Locale | Viewport |
|---|---|---|---|
| Listing detail route | normal listing, badges row + favorite + share | uk, sq | 320, 390, 768, 1024, 1440 |
| Listing detail route | badges row, long `uk` title | uk | **320 (mandatory)** |
| Listing detail route | listing without coordinates (no map card) | uk | 390 |

## 14. Completion report contract

Files changed · requirement IDs completed · **the Phase 1 reproduction artifact with the warning printed** · the
array's file and line and the unkeyed element's file and line, quoted from source · which of §10.2's two fixes was
applied and why · the guard's failing-then-passing pair with the test file's `git hash-object` identical across both
runs · `console-before.txt` / `console-after.txt` and their set difference · every further hypothesis you refuted,
with the file and line that refuted it · commands run with real exit codes and transcript paths · whether the same
unkeyed shape exists on other routes (report only) · the `:250` Tailwind residue observation (report only) ·
assumptions · deviations · limitations. Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`,
`PARTIALLY IMPLEMENTED` or `BLOCKED`.

## 15. Task quality gate

| Question | Required answer |
|---|---|
| Does this task name the culprit? | **No, deliberately.** §3.3 is the candidate set, §3.4 is what is already ruled out, and R1 makes the reproduction the thing that decides. A cause without a printed warning fails AC1. |
| Can the executor satisfy it by suppressing the warning? | No — §8 names every suppression shape as a task failure, and AC5 requires the after-set to differ from the before-set by exactly that one message. |
| Is the guard falsifiable? | AC3 requires the failing arm fired first, with `git hash-object` proving the test file did not change between the arms (Task 803 F8, the same failure this project has already paid for once). |
| Is the diff bounded? | One production file. A third file means `BLOCKED — SCOPE`, not a wider diff. |
| Does it fit Sprint 71? | Yes — the array is in the composition 784/793 built on this route, and the sprint's goal is that route's canonical-pattern consumer. It is not a feature, so the 801/802 goal-fit precedent does not push it out. |
| Is anything invented? | No. §3.1 is the owner's verbatim overlay text, §3.3 was read from the two files, §3.4's refutations quote `node_modules` and the pattern's own lines, and §3.5's "no global console handling" was grepped. |
