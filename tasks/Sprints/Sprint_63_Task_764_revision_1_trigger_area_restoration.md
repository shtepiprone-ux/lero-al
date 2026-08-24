# Task 764 Revision 1 — restore the trigger area the fold shrank, and close F1/F2/F4 with measurements

**Sprint:** 63 — Homepage exits Tailwind · **Phase:** 2a (revision) · **Priority:** P1
**Filed:** 2026-08-24 against the Task 764 worktree on top of `1d9fa77cf8b18a75560b661a3281351d45bc46c1`
**Predecessor review:** `NEEDS REVISION`, ledger `docs/reviews/2026-08-24-task764-listing-hover-fold.review-ledger.json`
(F1, F2 `P1 OPEN`; F3, F4 `P2 OPEN`).
**Status:** **AMENDED 2026-08-24 (owner decisions D63-H through D63-K)** after the first Revision 1 implementation
was reviewed and the reviewer's `APPROVED WITH NOTES` was **retracted by the owner**. The two P0 criteria that were
not executable as first written are amended below; F13, F14 and the falsifiability proof AC25 remain open.
**Most of Revision 1 already landed and is verified — read §3.10 before doing anything. Start at §10.0, then go
directly to §10.6.**

---

## 1. Mode, task type, and the decisions that fix the route

`IMPLEMENTATION` · **UI / design-system, behaviour-bearing, production-component change.**
Revision 1 edits `MantineListingCardPattern.tsx`, `ListingCard.tsx` and `FavoritesShell.tsx` — three components named
in `docs/critical-flow-registry.md`. That escalates the QA profile; see §13.

**Owner decision, 2026-08-24, quoted:** *"Revision 1 має один активний маршрут: відновити незмінність trigger
area, а не просити owner прийняти третю поведінкову дельту. Kickoff вже вимагає незмінний trigger area;
acceptance owner покриває лише coarse-pointer і форму анімації."*

That is this revision's single active route. Recording F3 as a third accepted behaviour change is **rejected** and
must not be implemented. The two accepted deltas remain exactly the two from the original kickoff §1: the
coarse-pointer zoom loss and the animation shape.

**Owner decision, 2026-08-24, the mechanism, quoted:** *"`FavoritesShell` має перестати тримати
`SaveToCollectionButton` sibling-overlay поза hover-chain картки. Передай action у `ListingCard`, далі в
`MantineListingCardPattern`, і рендери його як явний overlay-slot всередині `Card.Section`."*

**Owner decision, 2026-08-24, the forbidden shortcuts, quoted:** *"не повертати `group-hover:scale-105`, `'group'`
на Card або generic ancestor-hover selector; не застосовувати `:has()` чи cross-module selector як обхід
компонентної межі."*

**Owner decision, 2026-08-24, the before-baseline, quoted:** *"Якщо для before-виміру немає готового артефакта,
створи контрольований, тимчасовий pre-fold baseline, зафіксуй його, повністю відкоть і зафіксуй final capture. Не
підмінюй вимір CSS-міркуванням."*

**Owner decision D63-H, 2026-08-24 — the P3 arm is replaced, quoted:** *"P3 змінюємо на мутацію, що відтворює
реальну регресію: `SaveToCollectionButton` знову рендериться у `FavoritesShell` як sibling до `<ListingCard>` під
зовнішнім wrapper'ом. Очікування: підсилений containment assertion для `.imageSection` падає, а Favorites probe на
Save action показує `effectiveScale: 1.0000`."*

This supersedes the first filing's P3 row. **Why it had to change, recorded rather than buried:** the original
mutation — rendering `imageActions` as a sibling of `Card.Section` — leaves the element inside the node carrying
`.cardGrid`, so the hover chain stays intact. It therefore could not produce either promised observation: the probe
measured `1.1025` under the plant (`rev1-favorites-composition.plant-p3.json`, identical to the clean capture) and a
`.cardGrid`-scoped assertion passed. That was an orchestrator fact defect, the **twelfth** recorded in this sprint and
the fourth authored by the orchestrator. The executor found it, strengthened the assertion to `.imageSection`
containment and disclosed the substitution — correct conduct — but an acceptance criterion may be amended only by an
owner decision, which is what D63-H now is. The strengthened assertion is **retained**; only the mutation and the
required observations change.

**Owner decision D63-I, 2026-08-24 — AC23 becomes a differential criterion, quoted:** *"AC23 змінюємо на differential
baseline-criterion: `check:stories` має exit 0; `screenshots:assert -- --mantine-only` має дати 0 added і 0 removed
non-pass cells відносно `.screenshots/rendered-assert/2026-08-21T15-06/manifest.json` (80 FAIL, 27 AMBIGUOUS, 1316
cells); усі клітинки змінених ListingCard artifacts мають пройти."*

The first filing required the gate command itself to pass. It exits 1 on a standing repository condition — 80 `FAIL`
and 27 `AMBIGUOUS` cells in `AuthSheet`, `PopularLocationsView`, `Combobox`, `Tabs` and `AdminUsersTable`, none of
which consumes `ListingCard` — that this task neither caused nor is scoped to fix. Proving no regression is a
different proposition from making the command pass, and only the owner may substitute one for the other. D63-I does
exactly that. D63-K below retains the selected baseline in the repository so the allowed set cannot drift.

**Owner execution clarification D63-J, 2026-08-24 — P3 must mutate the evidence path, quoted:** *"P3 must restore
the legacy wrapper/sibling composition in every path that supplies its evidence: `FavoritesShell.tsx` for the real
production regression, `FavoritesComposition` for the Playwright probe, and the containment-test fixture for the
RTL assertion. The same temporary composition must be used in all three. A `FavoritesShell`-only mutation is not a
P3 proof while the test and Story render `ListingCard` directly."*

This does not alter D63-H's production mutation or its required results. It makes the test and probe execute the
same DOM relationship: a save action outside `.cardGrid` and outside `.imageSection`. Without this clarification,
changing `FavoritesShell.tsx` alone cannot affect the direct `ListingCard` fixture in
`ListingCard.smoke.test.tsx` or the direct `ListingCard` fixture in `FavoritesComposition`.

**Owner decision D63-K, 2026-08-24 — retain the AC23 baseline, quoted:** *"The ignored `.screenshots` capture is
the source snapshot, not the pinned repository artifact. Copy its manifest byte-for-byte into
`docs/sessions/evidence/task764/rev1b-assert-baseline-2026-08-21T15-06.manifest.json`, attest equal SHA-256 and the
1316 / 80 FAIL / 27 AMBIGUOUS population, and make that versioned copy the only AC23 comparator baseline."*

The source capture under `.screenshots/` is ignored by Git. D63-K turns the set selected by D63-I into retained task
evidence; it does not expand or otherwise change the allowed failures.

## 2. Objective

Retain the delivered repair that makes the card's hover trigger area on `/[locale]/favorites` what it was before the
Task 764 fold — hovering the save action is hovering the card — without reintroducing any Tailwind ancestor-hover
mechanism. Close the two remaining P0 review gaps: F13 by a valid P3 regression plant and F14 by the retained,
falsifiable AC23 differential (including AC25).

The already-retained Revision 1 artifacts establish the delivered implementation, the 1.1025 fine-pointer result,
the 1.0000 reduced-motion result, the original plants and the successful build. This narrow run adds only the valid
P3/P4/P5 proof, the retained AC23 baseline/differential, the revert-integrity proof and the re-validation set.

## 3. Verified context

Every fact below was read on the current worktree on 2026-08-24 at the line numbers given. **I0 re-measures them
before any write** (§10.0). Facts marked `MEASURED-LINUX` are source reads only — no evidence-producing command was
run outside Windows; see §3.8.

### 3.1 The defect, exactly

`src/modules/listings/components/FavoritesShell.tsx:204-218`:

```tsx
<div key={listing.id} className="relative group">
  <ListingCard listing={listing} isFavorited={true} ... layoutContext="3-col-xl" ... />
  <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
    <SaveToCollectionButton listingId={listing.id} className="bg-card/80 hover:bg-card shadow-sm rounded-lg" />
  </div>
</div>
```

The overlay `div` is a **sibling** of `<ListingCard>`, not a descendant of the `Card`. Before Task 764 the removed
half B matched `.group-hover\:scale-105:is(:where(.group):hover *)`, so the **outer** `.group` at `:204` was a second
trigger ancestor: pointer over the save button → outer `.group` hovered → image scaled 1.05x. After the fold the only
trigger is `.cardGrid:hover`, and the `Card` is not in the hover chain when the pointer is over a sibling overlay, so
the zoom is lost there.

`FavoritesShell` is the **only** one of six `<ListingCard>` consumers with an outer `.group`. Verified:
`grep -rn "<ListingCard" src/ --include=*.tsx` returns `FavoritesShell:205`, `FeaturedListingsView:85`,
`LatestListingsView:59`, `ListingsShell:231`, `RecentlyViewedGridView:61`, `SimilarListingsView:25`, plus the smoke
test and the story; `grep -n "\bgroup\b"` over the other five returns nothing.

### 3.2 The pattern already has this exact slot contract — do not invent a new mechanism

`MantineListingCardPattern.tsx` already declares `favorite?: ReactNode` (`:83`) and renders it as the **last child**
of the grid image section (`:335`), inside
`<Card.Section className={styles.imageSection} style={{ position: 'relative', overflow: 'hidden' }}>` (`:307`).

`ListingCard.tsx:254-265` supplies it, with the contract stated in its own comment: *"Real favorite control —
self-positions via className (contract with the pattern)."*

Revision 1 adds a **second** slot beside it. It does not repurpose `favorite`, and it does not reuse the name
`overlay` — `overlay?: MantineListingCardOverlay` (`:88`) is already the SOLD/RENTED label. The prescribed name is
**`imageActions`** (§10.2).

### 3.3 The current reveal semantics, and the guard trap in reproducing them

The overlay's visibility today comes from three Tailwind utilities on the wrapper div:

| Utility | Compiled guard | Effect |
|---|---|---|
| `opacity-0` | none | hidden at rest |
| `group-hover:opacity-100` | `@media (hover:hover)` — **no `pointer: fine`** | revealed on ancestor hover |
| `focus-within:opacity-100` | **none** | revealed on keyboard focus, on every device |
| `transition-opacity` | none | `transition-property: opacity`, Tailwind's `.15s` / `cubic-bezier(0.4,0,0.2,1)` |

The `(hover:hover)`-only guard on `group-hover:` is the same measured fact Task 763's I1 extraction §2 established
for `group-hover:scale-105` and that Task 764's header correction now states in
`MantineListingCardPattern.module.css:22-33`.

**The trap:** the zoom rule the fold added sits under `@media (hover: hover) and (pointer: fine)`. Copying that guard
onto the reveal rule would narrow the reveal on coarse-pointer devices, which is a behaviour change nobody
authorized. The reveal's hover arm carries `(hover: hover)` **only**, and the `focus-within` arm carries **no**
media guard at all. AC17 pins this.

`opacity: 0` does not remove pointer events, so the control is invisible-but-tappable on touch today. That is
pre-existing and is **preserved, not fixed** — changing it is a separate task.

### 3.4 The badge collision is pre-existing and must be reproduced, not corrected

`MantineListingCardPattern.module.css:194-202` places `.badgesGrid` at `position: absolute; top: var(--space-2);
left: var(--space-2)` — the same coordinates as the save overlay's `absolute top-2 left-2`. They already overlap
today; the save button paints on top because its wrapper carries `z-10` on an element outside the card.

Revision 1 must land the action at the same offsets and keep it painted **above** the badges. Do not move it to a
free corner, do not reposition the badges. Grid occupancy for reference: top-left `.badgesGrid`; top-right the
`FavoriteButton` overlay (inline-styled, see §3.5); bottom-right `.photoCountGrid` (`:227-240`).

AC16 measures this with `document.elementFromPoint`, not by eye.

### 3.5 Task 656's cascade trap applies to any position you put on the button itself

`FavoriteButton.tsx:25-42` documents a measured regression: Mantine `ActionIcon`'s own **unlayered**
`.mantine-ActionIcon-root { position: relative }` unconditionally beats a Tailwind `absolute top-2 right-2`
className, because Tailwind utilities live in `@layer utilities`. The fix was an inline `style` for
`position`/`top`/`right`.

Therefore: **position the action via its own wrapper element, never via a class on the button's root.** The wrapper
is a plain `Box` the pattern renders, styled by a new class in the pattern's own unlayered module. This sidesteps the
trap entirely and needs no inline style.

### 3.6 `SaveToCollectionButton` renders nothing without an authenticated user — this constrains the probe

`SaveToCollectionButton.tsx:43-54`: the component takes `{ listingId, variant = 'icon', className, size }` and its
fourth statement is `if (!user) return null`, with `user` from `useAuth()`. It also calls the
`getCollectionsWithMembership` server action on open and reads `useTranslations('collections')`.

Consequence, stated so the executor does not discover it mid-probe: a Playwright probe of a static Storybook build
cannot render the real button without an auth stand-in. §10.4 therefore splits the proof:

- the **Playwright probe** measures the hover geometry on the real DOM relationship, on a story that renders the real
  `ListingCard` with a node in the new `imageActions` slot;
- the **RTL test** mounts the real `SaveToCollectionButton` under a mocked authenticated `useAuth` and asserts DOM
  containment inside the Card subtree — the invariant F3 is actually about.

Neither substitutes for the other. Both are required.

### 3.7 This revision touches a registered critical flow

`docs/critical-flow-registry.md:57` registers *"Listing card rendering — Mantine pattern is the COMPLETE single
source of truth"* over exactly `ListingCard.tsx` → `MantineListingCardPattern`, with
`ListingCard.smoke.test.tsx` and `MantineListingCardPattern.smoke.test.tsx` as its automated coverage and
`ListingCardPattern.stories.tsx` / `ListingCard.stories.tsx` as its canonical Stories.

Original Task 764 was CSS-and-class-removal only and its §13 said *"Not Q4 unless the I0 scan of
`docs/critical-flow-registry.md` names an affected flow — if it does, escalate."* Revision 1 changes those component
files, so **the escalation condition is met**: profile is `Q4`, agent-contract 15 applies (baseline + preserved or
added automated coverage + recorded command), and agent-contract 16c applies to both canonical Stories.

Note for §10.5: `npm run test:listings` does **not** include either card suite. Run them by explicit path.

### 3.8 The Windows-native validation rule binds every command in this revision

`docs/orchestrator-role.md:93-108`, verbatim:

> **P0 — applies to every evidence-producing project command.** On this Windows checkout, Opus must run every
> `node`, `npm`, `npx`, Playwright, Next, Tailwind, Vite, Storybook, or native-addon command in native Windows
> PowerShell — never in WSL, a Linux VM, or a Linux-mounted view of the repository. Use `node.exe` for direct Node
> commands and `npm.cmd` / `npx.cmd` for package commands unless the project defines another native invocation.
>
> At the start of each evidence-producing terminal session, Opus records `node.exe -p process.platform`; only
> `win32` is an admissible platform result. Every retained command transcript records the platform, Node version,
> working directory, exact command, and actual exit code.
>
> A result from another platform, including a missing native module such as `*.linux-x64-gnu.node`, is an
> **environment screen, not repository evidence**. Do not create a finding, assess a gate, claim a project state, or
> propose follow-up work from it.

The same rule is in `docs/orchestrator-procedures.md:363-374` and `.claude/skills/review-task/SKILL.md:46-58`, and it
binds the executor identically. **Every** transcript this revision retains begins with a header block:

```
EXECUTION_PLATFORM=win32
NODE_VERSION=<node.exe -v>
CWD=<absolute repository path>
COMMAND=<exact command as typed>
```

and ends with `EXIT_CODE=<actual exit code>`. A transcript missing any of the five lines is not evidence, and the
task is not complete.

### 3.9 What the predecessor already established and must not be redone

Verified in the 2026-08-24 review and **not** reopened here: R1, R2, R3, R12, R4, R5, R6, R8, R10 are `VERIFIED`.
Do not re-derive them, do not re-extract Task 763's I1, do not touch `:76-78`'s `scale(1.05)`, and do not change
`compare-phase-c.mjs`.

### 3.10 What Revision 1 already delivered — do not rebuild it

The first Revision 1 implementation landed and the review verified it. Present in the worktree and **not** to be
redone: the `imageActions` slot on the pattern (`:84-92`, `:332-336`) and on `ListingCard`; the `.imageActions` rules
in the module (`:203-238`) with the correct two-arm guards; `FavoritesShell` restructured; both card suites extended,
including the `.imageSection` containment assertion; both canonical Stories updated, with a new
`mantine-primitives-listingcard--favorites-composition` export enrolled in the rendered matrix; the `reducedMotion`
probe context; and the whole Revision 1 evidence set under `docs/sessions/evidence/task764/rev1-*`.

Verified by the review and closed: **AC14, AC15, AC16, AC17, AC18, AC19, AC20, AC21, AC24**. Measured values worth
carrying forward rather than re-deriving: post hover-on-action `effectiveScale` **1.1025** on width and height, equal
to image and title; pre-fold hover-on-action **1.0500**; reduced-motion **1.0000** with `transform: none`. Do not
rebuild these items; the only permitted temporary changes to the listed source, Story and test files are the P3/P4
plants specified in §10.6, and each must be reverted under that section's integrity proof.

**Open, and the entire reason this task is back:** **AC22** (P3 arm, rewritten by D63-H and made executable by
D63-J), **AC23** (rewritten by D63-I and retained by D63-K), and **AC25** (the new comparator's P5 proof). F13 and
F14 track the first two in
`docs/reviews/2026-08-24-task764-listing-hover-fold.review-ledger.json`. Everything else in §10 is already satisfied;
run §10.0, then §10.6 and §10.7.

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R13 | Owner decision (§1), F3 | `MantineListingCardPattern` accepts an `imageActions?: ReactNode` slot and renders it inside the grid `Card.Section`, after `{badges}` and beside `{favorite}` | P0 | AC14 | Confirmed |
| R14 | Owner decision (§1), F3 | `ListingCard` accepts and forwards the action node; `FavoritesShell` passes `SaveToCollectionButton` through it and no longer renders a sibling overlay, a `.group` wrapper, or any `group-hover:` utility | P0 | AC15 | Confirmed |
| R15 | Owner decision (§1), kickoff §9 | In the fine-pointer context, hovering the save action yields `effectiveScale = 1.1025` on the grid image — the same value the image and title hovers yield | P0 | AC16 | Confirmed |
| R16 | §3.4 | The action paints above `.badgesGrid` at the same `top`/`left` offsets it occupies today | P0 | AC16 | Confirmed |
| R17 | §3.3 | Reveal semantics reproduced exactly: hidden at rest; revealed on card hover under `(hover: hover)` only; revealed on `focus-within` with no media guard | P0 | AC17 | Confirmed |
| R18 | Owner decision (§1) | No `group-hover:scale-105`, no `'group'` on any Card, no generic ancestor-hover selector, no `:has()`, no cross-module selector | P0 | AC18 | Confirmed |
| R19 | F4 | `prefers-reduced-motion: reduce` is **measured**: grid card hover on image and on title both yield `effectiveScale = 1.0000` and computed `transform: none` | P0 | AC19 | Confirmed |
| R20 | F2 | Both existing plant checks re-run on the retained plant artifacts, each with a retained transcript carrying its actual non-zero exit code | P0 | AC20 | Confirmed |
| R21 | F1 | `npm.cmd run build` exit 0, transcript retained in the repository | P0 | AC21 | Confirmed |
| R22 | agent-contract 15, §3.7, **D63-H / D63-J** | Automated regression coverage for the new slot in both registered card suites, with a planted-violation proof whose P3 arm replants the real F3 regression on the actual test and probe paths | P0 | AC22 | **Open — F13** |
| R23 | agent-contract 16c, §3.7, **D63-I / D63-K** | Both canonical Stories render the new slot with the production composition, and the rendered gate shows zero added and zero removed non-pass cells against the retained pinned baseline manifest | P0 | AC23 | **Open — F14** |
| R25 | D63-I, D63-K, Sprint 63 rule 1 | The differential comparator AC23 now depends on is itself falsifiable — a planted extra non-pass cell makes it exit non-zero | P0 | AC25 | **Open — not started** |
| R24 | §3.8 | Every retained transcript carries the five-line native header and a real `EXIT_CODE` | P0 | AC24 | Confirmed |

## 5. Assumptions and open questions

- **A4 (`UNKNOWN`, resolved at Phase R-A):** whether the pre-fold Favorites composition actually measured 1.05x on
  the save action. §3.1 predicts it from the compiled selector, but the original task never probed that surface, so
  there is no artifact. Phase R-A builds a controlled, temporary pre-fold baseline, captures it, reverts completely,
  and captures the final state. If the baseline does **not** show 1.05x there, **stop and report `BLOCKED`** with both
  captures — do not proceed on the reasoning alone, and do not adjust the target to whatever was measured.
- **A5 (`UNKNOWN`):** whether the new slot changes any rest-state pixel. It must not. If the rendered matrix or the
  rest-state comparator shows a rest delta on any surface, report it rather than accepting it; only the trigger-area
  restoration is authorized.
- **A6 (`INFERENCE`, must be measured not reasoned):** that the reduced-motion reset still wins for `.cardGrid`.
  The review read the source and concluded it does (equal specificity, later source order). **That reasoning is not
  evidence and must not be cited as the AC19 result.** Measure it.
- **Q2 (open, does not block):** the list layout gets no `imageActions` slot. No consumer passes one, the list image
  box is a plain `Box` rather than a `Card.Section`, and adding an unconsumed slot is speculative architecture
  (agent-contract 1, 2). If a later task needs it, that task adds it.
- **Q3 (open, does not block):** the invisible-but-tappable overlay on touch (§3.3) is pre-existing and out of scope.

## 6. Pre-read rule bundle

**Always required:** `docs/agent-contract.md` (clauses 1-3, 9, 9a, 15, 16b, 16c especially) · `docs/rule-index.md` ·
`docs/qa-profiles.md` · `docs/backlog.md` · `docs/critical-flow-registry.md` (**read row 57 in full, not a scan**).

**Current Mantine path:** `docs/mantine-responsive-design-system.md` · `docs/tailadmin-style-reference.md` ·
`docs/component-rules.md` · `docs/qa-rules.md` · `docs/storybook-governance.md`.

**Task-specific:** `tasks/Sprints/Sprint_63_kickoff_prompt_Task_764_Listing_Hover_Fold.md` (the predecessor; §1's
owner quotes and §3.5's consumer table still bind) · `docs/sessions/2026-08-22-task764-phase-b-implemented.md` ·
`docs/reviews/2026-08-24-task764-listing-hover-fold.review-ledger.json` (**F13 and F14 are this run's work list**) ·
`MantineListingCardPattern.module.css` header lines 1-40 (D34: this file is **unlayered**) ·
`FavoriteButton.tsx:25-42` (the Task 656 cascade trap, §3.5).

**Session protocol:** the auto-loaded `.claude/skills/execute-task/SKILL.md`.

## 7. Scope

1. `src/design-system/mantine/patterns/MantineListingCardPattern.tsx` — the `imageActions` prop and its render site
   in the grid branch only.
2. `src/design-system/mantine/patterns/MantineListingCardPattern.module.css` — one new class for the action wrapper
   and its reveal rules. **Nothing else in the file; `:76-78` and `:94-96` stay byte-identical.**
3. `src/modules/listings/components/ListingCard.tsx` — the pass-through prop.
4. `src/modules/listings/components/FavoritesShell.tsx` — remove the wrapper `div`'s `group` class and the sibling
   overlay `div`; pass the button through the new prop.
5. `scripts/task764-pointer-probe.mjs` — the `reducedMotion` context and the Favorites-composition targets.
6. `src/design-system/mantine/patterns/__tests__/MantineListingCardPattern.smoke.test.tsx` and
   `src/modules/listings/components/__tests__/ListingCard.smoke.test.tsx` — new slot coverage.
7. `src/stories/patterns/mantine/ListingCardPattern.stories.tsx` and
   `src/stories/mantine/primitives/ListingCard.stories.tsx` — canonical Story updates (agent-contract 16c).
8. `docs/sessions/evidence/task764/` — the AC23 differential comparator (a new script, §10.7) plus the
   `rev1b-*` transcripts and artifacts this run produces.
9. `docs/sessions/2026-08-24-task764-revision-1-*.md` (a new session log for this run) and
   `docs/sessions/evidence/task764/**`.
10. `docs/backlog.md` — concise current state.

## 8. Out of scope

- Anything the predecessor review marked `VERIFIED` (§3.9).
- `compare-phase-c.mjs` — **do not parameterise it**; Task 764 never required that and the owner ruled it out.
- The list layout's `imageActions` (Q2); the touch invisibility (Q3).
- `SaveToCollectionButton`'s own `className` utilities (`bg-card/80 hover:bg-card shadow-sm rounded-lg`) — Phase 2b.
- `MantineListingCardPattern.tsx:174-175` / `:303-304` residual utilities — Phase 2b.
- Restoring the coarse-pointer zoom or the two-curve animation — still owner-accepted outcomes.

## 9. Current and required behaviour

| Behaviour | Today (post-fold, pre-revision) | Required after |
|---|---|---|
| Hover on the save action, `/favorites`, fine pointer | **no zoom** — the action is outside the Card's hover chain | **`effectiveScale` 1.1025** — identical to image and title hover |
| Hover on image or title, all surfaces | 1.1025 | **Unchanged** |
| List card hover | 1.0500 | **Unchanged** |
| Save action at rest | hidden (`opacity: 0`) | **Unchanged** |
| Save action on card hover | revealed under `(hover:hover)` via `group-hover:` | **Revealed under `(hover: hover)`, via the pattern's own module** |
| Save action on keyboard focus | revealed, unguarded | **Unchanged, still unguarded** |
| Save action paint order vs badges | above them | **Unchanged** |
| `prefers-reduced-motion`, grid card | reset to `transform: none` — **reasoned, never measured** | **Same result, measured** |
| Tailwind on the Favorites wrapper | `group`, `group-hover:opacity-100` | **None** |

## 10. Implementation requirements

### 10.0 — I0 freshness

`git status --porcelain` (expect the Task 764 working set; reconcile against
`docs/orchestrator-dirty-worktree-manifest-template.md`, since the start state is **dirty by design** — Task 764 is
unstaged and uncommitted); `git rev-parse HEAD` (expect `1d9fa77cf8b18a75560b661a3281351d45bc46c1`).

Open the evidence terminal and record, as the first retained transcript
`docs/sessions/evidence/task764/rev1b-platform-attestation.txt`:

```powershell
node.exe -p process.platform     # must print win32
node.exe -v
$PWD.Path
```

If `process.platform` is not `win32`, **stop and report `BLOCKED`**. Nothing else in this task may run.

Re-read at their current line numbers: §3.1's `FavoritesShell:204-218`, §3.2's `favorite` slot and its render site,
§3.3's four utilities, §3.4's `.badgesGrid`, §3.5's `FavoriteButton` comment. Report drift before acting.

### 10.1 — Phase R-A: the pre-fold Favorites baseline (owner-authorized temporary mutation)

There is no before-artifact for this surface (A4). Build one, in this exact order:

1. Add a story export that renders the **real** `ListingCard` inside a wrapper reproducing the Favorites composition,
   with a node in the position the save action will occupy. Register it so the probe can address it by story id.
2. **Temporarily** restore the pre-fold state: re-add `hoverClass: 'group-hover:scale-105'` to `appImageConfig.ts`'s
   `listing` entry and `'group'` to the grid Card, and put the composition's wrapper back to `relative group` with
   the sibling overlay. Rebuild Storybook.
3. Probe and persist `docs/sessions/evidence/task764/rev1-favorites-composition.pre-fold.json`: `matchMedia` triple,
   rest/hover rectangles and computed `transform`/`scale` for hover on **the save action**, on the image, and on the
   title.
4. **Revert completely.** Prove it: `git diff` on `appImageConfig.ts`,
   `MantineListingCardPattern.tsx` and `FavoritesShell.tsx` must equal their pre-baseline diffs byte for byte.
   Persist the proof as `rev1-baseline-revert-proof.txt`.
5. Only then implement Phase R-B.

The temporary mutation is authorized for **this baseline only**, exactly as the Phase D plants were. It never ships
and it is never an argument for any other change.

**Gate:** if the pre-fold capture does not show `effectiveScale ≈ 1.05` for hover on the save action, stop at
`BLOCKED` with the artifact (A4).

### 10.2 — Phase R-B: the slot

1. `MantineListingCardPattern.tsx` — add `imageActions?: ReactNode` to `MantineListingCardPatternProps`, documented
   the way `favorite` is. Render it in the **grid** branch inside the existing
   `<Card.Section className={styles.imageSection}>`, **after** `{badges}` so paint order puts it above them, wrapped
   in a `Box` carrying the new module class. Do not touch the list branch.
2. `MantineListingCardPattern.module.css` — add the wrapper class next to `.badgesGrid`, reproducing today's values:
   `position: absolute; top: var(--space-2); left: var(--space-2);` plus a `z-index` that keeps it above
   `.badgesGrid`, `opacity: 0`, and Tailwind's own compiled `transition-opacity` values. Reveal rules, **exactly**:
   - `@media (hover: hover) { .cardGrid:hover <class> { opacity: 1; } }` — `(hover: hover)` **only**, never
     `(pointer: fine)` (§3.3);
   - `.cardGrid:focus-within <class> { opacity: 1; }` — **no** media guard.
   Comment the rule with Task 764 Revision 1, the utility each declaration reproduces, and why the two arms carry
   different guards. If `check:design-tokens` flags the duration, add a same-line `design-tokens-allow` marker in the
   form this file already uses at `:255`; do not invent a token.
3. `ListingCard.tsx` — add the pass-through prop and forward it. Follow the `favorite` precedent: the container owns
   the node, the pattern owns the position.
4. `FavoritesShell.tsx` — drop `group` from the wrapper `div` (keep `relative` only if something else still needs
   it; if nothing does, drop the wrapper), delete the sibling overlay `div` with its four utilities, and pass
   `<SaveToCollectionButton listingId={listing.id} className="bg-card/80 hover:bg-card shadow-sm rounded-lg" />`
   through the new prop unchanged.

**Forbidden, per §1:** re-adding `group-hover:scale-105` or `'group'`, any ancestor-hover selector not rooted on
`.cardGrid`, `:has()`, and any selector in one module reaching into another module's class.

### 10.3 — Phase R-C: reduced motion (F4)

Add a `reducedMotion: 'reduce'` context to `task764-pointer-probe.mjs`'s matrix mode. Capture the grid card's rest
and hover states for both hover targets. Persist into the final matrix artifact. This closes F4 as a measurement;
the review's cascade reasoning is explicitly **not** the evidence (A6).

### 10.4 — Phase R-D: the targeted Favorites probe and the containment test

**Probe** (`rev1-favorites-composition.post.json`): same shape as R-A step 3, on the final implementation. It must
address the save action by its own selector — not the title, not the image — and record all three hover targets so
AC16's equality is comparable within one artifact.

**RTL containment test:** mount the real `FavoritesShell` composition (or the real `ListingCard` with a real
`SaveToCollectionButton` in the slot) under a mocked authenticated `useAuth` (§3.6) and assert that the button is a
**descendant** of the element carrying the card's `.cardGrid` class **and** of its `.imageSection` `Card.Section`.
The first is the production hover-chain invariant; the second is the stronger slot-placement invariant that P3 must
falsify. A test that only asserts the button renders somewhere does not close R14.

### 10.5 — Phase R-E: F1, F2, and the full Q4 gate set on the final diff

**F2** — re-run the two existing plant checks unchanged, on the retained plant artifacts, capturing stdout, stderr
and the real exit code into `rev1-plant-p1-transcript.txt` and `rev1-plant-p2-transcript.txt`. Each must show a
non-zero exit. **Do not edit `compare-phase-c.mjs` or the two plant scripts.**

**F1** — after every source change is final, `npm.cmd run build`, full output to
`docs/sessions/evidence/task764/build-transcript.txt`, `EXIT_CODE=0`.

**Everything re-run on the final diff** (old transcripts are not final evidence): `typecheck`; both card suites by
explicit path via `npx.cmd vitest run`; `test:listings`; `check:tailwind-runtime-tokens`;
`check:design-tokens -- --strict`; `check:homepage-grid`; `build-storybook`; `screenshots:assert -- --mantine-only`
and `screenshots:responsive -- --mantine-only`; `check:mojibake`; `check:file-integrity`;
`compare-phase-c.mjs` re-run unchanged to confirm the original invariants still hold; and the two new probes.

### 10.6 — Phase R-F: the Q4 planted-violation proof (R22)

**P3 is rewritten by owner decision D63-H and execution clarification D63-J (§1). The first filing's P3 is void —
do not run it.**

| Arm | Mutation | Required observation |
|---|---|---|
| **P3 (D63-H / D63-J)** | Reconstruct the pre-Revision-1 external sibling composition in all three evidence paths: (1) `FavoritesShell.tsx`, by putting `SaveToCollectionButton` back outside `<ListingCard>` under the outer wrapper; (2) `FavoritesComposition` Story, with the same wrapper and sibling action so the Playwright probe executes that DOM relationship; and (3) the containment-test fixture, by rendering that same wrapper/sibling composition rather than passing the action through `imageActions` | **Both**: the `.imageSection` containment assertion genuinely FAILs, **and** the Favorites Story probe's save-action `effectiveScale` reads **1.0000** |
| P4 | Change the reveal rule's hover arm guard to `(hover: hover) and (pointer: fine)` | A reveal assertion under a coarse-pointer context genuinely FAILs |
| **P5 (D63-I / D63-K)** | Copy the current manifest to `rev1b-assert-p5.manifest.json`, flip one known passing `listingcard` cell to a non-pass status, and pass that copy as the comparator's `--current` input | The comparator reports `added: 1` and exits **non-zero** |

The assertion P3 is measured against is the **`.imageSection` containment assertion** the previous implementation
already added — that assertion is retained, not reverted. P3 no longer targets it with a mutation that leaves the
element inside `.cardGrid`; it replants the actual F3 regression, which is why both halves of the observation now
fire. The production mutation is in `FavoritesShell.tsx`; the Story and test-fixture mutations are the matching,
temporary evidence harness required by D63-J. `imageActions` stays wired on the pattern and on `ListingCard`.

P3 retains separate `rev1b-plant-p3-rtl-transcript.txt` and `rev1b-plant-p3-probe-transcript.txt`, so each required
observation has its own command, header and real non-zero `EXIT_CODE`; retain
`rev1b-plant-p3-clean-transcript.txt` after reverting. All three arms are observed red with retained transcripts
carrying the §3.8 header and a real non-zero `EXIT_CODE`, then reverted and re-run clean. Record which existing gate
would have caught each arm; if none would have, say so.

**Revert integrity.** After the last arm is reverted, prove the worktree is byte-identical to its pre-plant state:
`git diff` on `FavoritesShell.tsx`, `ListingCard.smoke.test.tsx`, `ListingCard.stories.tsx` and
`MantineListingCardPattern.module.css` must equal their pre-plant diffs exactly. Persist that proof as
`rev1b-plant-revert-proof.txt`. This proof is what allows §10.7 to stand on the existing expensive-gate
transcripts; without it, every gate in §10.5 must be re-run.

### 10.7 — Phase R-G: the AC23 differential and the re-validation set

**Retain the baseline first (D63-K).** `.screenshots/` is ignored and is not an evidence location. Before writing or
running the comparator, copy `.screenshots/rendered-assert/2026-08-21T15-06/manifest.json` byte-for-byte to
`docs/sessions/evidence/task764/rev1b-assert-baseline-2026-08-21T15-06.manifest.json`. Retain
`rev1b-assert-baseline-attestation.txt` with the §3.8 header, source and destination paths, both SHA-256 values and
the verified population: 1316 cells, 80 `FAIL`, 27 `AMBIGUOUS`. The two hashes must be identical. The versioned
`docs/sessions` copy — never the ignored source capture — is the sole baseline for every AC23/P5 comparator run.

**The differential.** Write `docs/sessions/evidence/task764/compare-rev1b-rendered-assert.mjs` with explicit
`--baseline <path>` and `--current <path>` inputs. AC23 invokes it with the retained
`rev1b-assert-baseline-2026-08-21T15-06.manifest.json` as `--baseline` and the selected current manifest as
`--current`; P5 invokes the same script with the retained baseline and `rev1b-assert-p5.manifest.json` as
`--current`. It keys every cell by `storyId × locale × viewport`, and reports:

1. non-pass cells present now and absent from the baseline (`added`),
2. non-pass cells present in the baseline and absent now (`removed`),
3. the status of every cell whose `storyId` contains `listingcard`.

It exits non-zero if `added` or `removed` is non-empty, or if any `listingcard` cell is not `pass`. Persist its
AC23 output as `rev1b-assert-differential-transcript.txt` and its result as
`rev1b-assert-differential.json`; retain the P5 invocation and result separately as
`rev1b-plant-p5-transcript.txt` and `rev1b-plant-p5.json`.

**Which manifest is "current".** If the revert-integrity proof above holds, the existing run at
`.screenshots/rendered-assert/2026-08-24T10-16/` describes the final tree and is the current manifest — say so
explicitly in the report with its SHA-256. If it does not hold, re-run
`npm.cmd run screenshots:assert -- --mantine-only` and use that run instead. The current manifest may remain a
generated input; the baseline may not — only the versioned baseline copy is a pinned acceptance artifact.

**Re-validation set.** After the plants are reverted, re-run and retain: `npm.cmd run typecheck`, both card suites by
explicit path via `npx.cmd vitest run`, and `npm.cmd run check:stories`. The expensive gates — `build`,
`build-storybook`, `screenshots:assert`, `screenshots:responsive`, `check:homepage-grid`, `check:design-tokens`,
`check:tailwind-runtime-tokens`, `check:file-integrity`, `check:mojibake`, the Favorites and matrix probes and
`compare-phase-c.mjs` — stand on their existing Revision 1 transcripts **only** under the revert-integrity proof.
Name that dependency in the report; do not present a pre-plant transcript as a fresh run.

## 11. Positive and negative flows

**Positive.** A logged-in mouse user on `/[locale]/favorites` moves the pointer onto a card. The save action fades
in, the image eases to 1.1025x. Moving the pointer from the card body onto the save action keeps both. Nothing in
the DOM carries a Tailwind ancestor-hover class.

| # | Flow | Applicable | Required |
|---|---|---|---|
| N9 | Keyboard focus onto the save action, no pointer | **Yes** | Action visible via `focus-within`, on every device |
| N10 | Coarse pointer | **Yes** | No zoom (accepted); reveal behaves exactly as today |
| N11 | `prefers-reduced-motion` | **Yes** | No zoom, `transform: none` — **measured** (R19) |
| N12 | Logged-out viewer | **Yes** | `SaveToCollectionButton` returns null; the empty slot renders nothing and no layout shifts |
| N13 | Card with badges | **Yes** | Action paints above the badges at the same offsets (R16) |
| N14 | Card with no image | **Yes** | Slot still renders inside the section; no error |
| N15 | List layout | **Yes** | Byte-identical to today — no slot, no change (Q2) |
| N16 | The five non-Favorites `<ListingCard>` consumers | **Yes** | Pass no `imageActions`; render byte-identical to today |
| N17 | RLS / auth / i18n | No | No data, policy or copy in scope; the button's own auth guard is untouched |

## 12. Acceptance criteria

- **AC14 [R13]** — `imageActions?: ReactNode` exists on the pattern's props and renders inside the grid
  `Card.Section` after `{badges}`; the list branch diff is empty.
- **AC15 [R14]** — `FavoritesShell` contains no `group` class and no `group-hover:` utility; `SaveToCollectionButton`
  reaches the card through `ListingCard`'s new prop; the RTL containment test proves it is a descendant of
  `.cardGrid`.
- **AC16 [R15, R16]** — In `rev1-favorites-composition.post.json`, fine-pointer hover on the save action yields
  `effectiveScale` 1.1025 on width and height to 4 decimals, equal to the image-hover and title-hover values in the
  same artifact; and `document.elementFromPoint` at the action's centre returns the action, not a badge.
- **AC17 [R17]** — The reveal rule's hover arm is guarded by `(hover: hover)` with no pointer condition, and the
  `focus-within` arm carries no media guard. Proven by the source and by a coarse-pointer reveal capture.
- **AC18 [R18]** — `grep -rn "group-hover:\|'group'" src/` shows no new reader and no Card marker; the diff contains
  no `:has()` and no selector referencing another module's class.
- **AC19 [R19]** — The final matrix artifact contains a `reducedMotion: 'reduce'` context in which the grid card's
  image-hover and title-hover both give `effectiveScale` 1.0000 and computed `transform: none`.
- **AC20 [R20]** — `rev1-plant-p1-transcript.txt` and `rev1-plant-p2-transcript.txt` each carry the five-line native
  header, the observed failure, and a non-zero `EXIT_CODE`. `compare-phase-c.mjs` and both plant scripts are
  byte-identical to their pre-revision state.
- **AC21 [R21]** — `docs/sessions/evidence/task764/build-transcript.txt` exists, carries the header, and ends
  `EXIT_CODE=0`.
- **AC22 [R22, D63-H, D63-J]** — Both card suites cover the new slot and pass. P3 applies the same external-sibling
  mutation to `FavoritesShell`, the Favorites probe Story and the containment-test fixture, then is observed failing
  on **both** halves — the `.imageSection` containment assertion FAILs and the Favorites probe's save-action
  `effectiveScale` reads **1.0000** — with separate retained transcripts and real non-zero `EXIT_CODE`s; P4
  likewise; all clean after revert, with the revert-integrity proof retained.
- **AC23 [R23, D63-I, D63-K]** — Both canonical Stories render the new slot with the same canonical composition
  production uses; `npm.cmd run check:stories` exits 0; the versioned
  `rev1b-assert-baseline-2026-08-21T15-06.manifest.json` is byte-identical to the source capture with the attested
  1316 / 80 `FAIL` / 27 `AMBIGUOUS` population; and the §10.7 differential reports **0 added and 0 removed**
  non-pass cells against that versioned baseline with **every** `listingcard` cell passing. The raw exit code of
  `screenshots:assert -- --mantine-only` is recorded as a diagnostic and is **not** the pass input.
- **AC25 [R25, D63-I, D63-K]** — Plant P5 observed making the differential comparator report `added: 1` and exit
  non-zero, with a retained transcript and result, then clean after revert.
- **AC24 [R24]** — Every retained transcript from this revision carries `EXECUTION_PLATFORM=win32`, the Node version,
  the cwd, the exact command, and a real `EXIT_CODE`.

## 13. QA profile and verification plan

**Profile: `Q4`.** Escalated from the predecessor's Q3 by §3.7: this revision edits production components inside a
registered critical flow, so agent-contract 15 requires automated regression coverage and the Q4 gate claim requires
planted-violation failure proof (§10.6).

**Viewports:** 320 · 375 · 390 · 768 · 1024 · 1440. **Locales:** all four at 320 and 1440; `uk@320` mandatory. Read
each story's enrolled viewport set from the manifest before claiming a tier is covered; if
`mantine-primitives-listingcard--default` is still unenrolled, say so rather than implying coverage.

**The rendered gate is evaluated differentially (D63-I / D63-K).** `screenshots:assert -- --mantine-only` exits 1
on a standing repository condition; its raw exit code is a diagnostic. The pass input is §10.7's comparator against
the versioned `rev1b-assert-baseline-2026-08-21T15-06.manifest.json`, and P5 proves that comparator can fail.

Every command in §10.5, §10.6 and §10.7 runs in native Windows PowerShell with the §3.8 transcript header. A result
from any other platform is not evidence and must not be reported as one.

## 14. Completion report contract

`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`. Never self-approve.

Because §3.10 fences off everything already verified, this report is **narrow**. It covers:

1. Changed files vs §7 — expected to be `FavoritesShell.tsx`, `ListingCard.smoke.test.tsx`,
   `ListingCard.stories.tsx` and `MantineListingCardPattern.module.css` untouched-after-revert, plus the new
   versioned baseline and other evidence artifacts only.
2. **The F13 answer:** the P3 arm as rewritten by D63-H/D63-J — the matching mutation in the source, test fixture
   and probe Story; the containment assertion's observed failure; the probe's observed `effectiveScale` **1.0000**;
   both transcripts with real non-zero exit codes; and the clean re-run after revert.
3. **The F14 answer:** the D63-K baseline attestation and §10.7 differential — the source/destination hashes,
   `added`, `removed`, and the status of every `listingcard` cell, with the comparator's exit code, plus which
   manifest was treated as current and why.
4. **The AC25 answer:** P5 observed making the comparator report `added: 1` and exit non-zero, then clean.
5. The revert-integrity proof, and an explicit statement of which expensive gates stand on existing transcripts
   because of it.
6. The re-validation set's results (`typecheck`, both card suites, `check:stories`).
7. R22, R23, R25 completed or not; I0 drift; deviations and limitations.
8. `docs/backlog.md` updated concisely, narrative in a new session log. Report `IMPLEMENTED` only when every new
   artifact is retained in the repository.

**Do not re-report AC14-AC21 or AC24 as fresh work.** Cite §3.10 and move on.

## 15. Task quality gate

| Check | Result |
|---|---|
| Executable with no chat context | ✅ every rule, line number, guard, command and owner quote is in the file |
| Every requirement has a binary AC and a verification method | ✅ R13-R25 → AC14-AC25 |
| Scope names what must not change | ✅ §8; §9 gives a before/after per behaviour |
| Exactly one active route | ✅ restore the trigger area. A4 and the platform gate both fail to `BLOCKED`, never to a second route |
| Every shared rule's consumer set enumerated before it is edited | ✅ §3.1 enumerates all six `<ListingCard>` consumers and proves only one carries an outer `.group` — the check whose absence produced F3 |
| Comparator measures the invariant, not a proxy | ✅ AC16 measures hover on the save action itself, which is the thing F3 says regressed; the RTL test measures DOM containment, which is the thing that caused it |
| Gates prove changed behaviour, not procedure | ✅ P3/P4 require observed failure first; AC19 replaces an inference with a measurement |
| Negative flows by applicability | ✅ N9-N17, N17 marked `No` with its reason |
| No uninspected claim | ✅ §3.1-§3.8 each carry their file and line; A4/A5/A6 are labelled and routed to a phase |
| Known traps surfaced before the executor hits them | ✅ §3.3 the guard trap, §3.4 the badge collision, §3.5 Task 656's cascade trap, §3.6 the auth-null probe constraint, §3.7 the `test:listings` gap |
| Critical-flow escalation performed, not skipped | ✅ §3.7 quotes the registry row and escalates to Q4 with the coverage and Story obligations it triggers |
| Prior verified work fenced off | ✅ §3.9 and §8, plus §3.10 for Revision 1's own landed work |
| Every amended criterion carries its owner decision verbatim | ✅ D63-H through D63-K are quoted in §1, with the reason the originals were void and the evidence-path/baseline corrections |
| A criterion is never amended to match what was built | ✅ D63-H/D63-J strengthen the arm rather than relaxing it: the new mutation replants the real F3 regression on every evidence path, so both promised observations fire. D63-I/D63-K substitute a differential for an unmeetable absolute and retain its allowed set in versioned evidence |
| Every new comparator is falsifiable | ✅ P5 plants a cell into the AC23 differential and requires a non-zero exit |

---

## Handoff

Execute from `tasks/Sprints/Sprint_63_Task_764_revision_1_trigger_area_restoration.md` following
`.claude/skills/execute-task/SKILL.md`. Read the §6 bundle and nothing else. Start at §10.0, and stop immediately if
`node.exe -p process.platform` is not `win32`.

**FACTS:** §3.1-§3.10 — each with its file and line. §3.10 is what you must NOT rebuild.
**INFERENCES:** A6 — the reduced-motion cascade outcome. It is routed to a measurement and may not be reported as a
result.
**UNKNOWNS:** A4, A5, Q2, Q3.
**CONFLICTS:** None at filing. §10.2 step 2 may produce one at `check:design-tokens`; report it, do not silence it.

**QA profile:** `Q4`. **Ambiguous requirements:** none.
**Owner decisions still needed:** none. The route, the mechanism, the forbidden shortcuts, the baseline procedure and
the four amendments **D63-H** (P3), **D63-I** (AC23), **D63-J** (P3 evidence paths) and **D63-K** (baseline
retention) are all quoted verbatim in §1.

**Scope of this run:** §10.0, then §10.6 and §10.7, then the §10.7 re-validation set. Everything else in §10 is
already satisfied and fenced off by §3.10. The open acceptance criteria are `AC22`/`F13`, `AC23`/`F14` and `AC25` in
`docs/reviews/2026-08-24-task764-listing-hover-fold.review-ledger.json`; the review decision stays `NEEDS REVISION`
and `handoff.commitPush` stays `PROHIBITED` until a new Opus review closes F13, F14 and AC25.

**Worktree note:** a zero-byte `.git/index.lock` was present and is owner-removed; if it reappears, stop and report
`GIT WRITE BLOCKED` rather than working around it.
