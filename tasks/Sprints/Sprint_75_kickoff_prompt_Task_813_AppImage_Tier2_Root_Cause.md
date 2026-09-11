# Task 813 — `AppImage` leaves `src/components/ui/`: clear the tier-2 root cause that blocks Task 820

Sprint 75 · **P0** (raised from tier-3 filing by owner decision §17.6, 2026-09-11) · QA profile **Q4**

**Status: `APPROVED WITH NOTES` — Opus review Revision 5, 2026-09-11, after the owner reviewed and ACCEPTED all six
AC11 tuples.** Owner verdict, verbatim: `accepted` (2026-09-11), for `Mantine/Primitives/AppImage → Default` at 390
and 1440 and `Patterns/Mantine/ListingGalleryPattern → Default` with the lightbox closed and open at 390 and 1440,
all `en`. R1–R17 are verified. The reviewer independently recomputed the three `git hash-object` values from the
shipped bytes (`09c82a4f…`, `b4bed054…`, `3a2bb240…`), re-ran AC23's widened search against the saved Story (empty),
read both arms of the AC24 probe (negative: 66/83.5/106/329.5px, cross-width delta 263.5px, exit 1; positive: 44×44px
at 320/390/480/1440, delta 0, exit 0) and set-compared `check:design-tokens:strict` / `check:tailwind-runtime-tokens`
against `R16_03`/`R16_04` — 56 = 56, 1 = 1, zero set difference, so both remain inherited (Tasks 822/823).
**Two notes, neither blocking:** (1) the Story's `listing`/`gallery-main`/`avatar` demos now size from `SimpleGrid`
column counts and therefore scale with the viewport — reviewed and accepted by the owner at 390 and 1440;
(2) `theme.d69-18.test.tsx` carries one pre-existing failure asserting a substring in
`src/components/layout/FooterView.tsx` (Task 784's `34faa47a9` hotfix wrote `theme.other!.layout!.footerGridGap`), a
file outside this task's diff — it stays active backlog work, not a Task 813 defect. **Task 820's R11/AC15 is
unblocked by this approval.** Archived to `docs/backlog-archive.md` on 2026-09-11; the implementation awaits the
owner's commit + push.

*Executor's superseded header, kept for the record:* `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` — Revision 4 (R17),
2026-09-11: `theme.ts` gained the one `boxSize.galleryThumb` role, the probe was corrected and proved to fail on the
unmodified Revision 3 Story before passing on the rewritten one, and the Story was rebuilt with zero raw dimensions
and no `data-testid`.

*Superseded header, kept for the record:* `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` — Revision 3 (R17) filed 2026-09-11 by the executor. Every
`style={{...}}` pixel wrapper in `src/stories/mantine/primitives/AppImage.stories.tsx` (5 occurrences) is replaced
with Mantine `Box`/`AspectRatio` sizing props; the `gallery-strip` cells and the negative-flow thumbnail now render as
`AspectRatio ratio={1}` squares with the `maxWidth: 360` cap removed. AC23's zero-raw-dimension-literal search and
AC24's rendered measurement (320/390/480/1440, `en`) both pass — see the session log's R17 section and
`docs/sessions/evidence/task813/R17_*`. Sonnet does not self-approve; AC11's re-review and Opus's review remain
open.**

*Superseded header, kept for the record:* `NEEDS REVISION` — Revision 2 filed 2026-09-11 after the owner RETURNED
AC11's visual review. R14, R15 and R16 were closed and re-verified; R17 was the only work left: this task's own new
`src/stories/mantine/primitives/AppImage.stories.tsx` drew stretched, hardcoded thumbnails and overflowed at 320/480.
The gallery pattern's identical-looking defect was not this task's — it is Task 824. See §5.4.

*Further-superseded header, kept for the record:* `NEEDS REVISION` — Revision 1 filed 2026-09-11 after the executor's first implementation. Read §5.3 first;
it carries the owner decision that widened this scope and the three things still owed. Revision 0's implementation is
**retained** — R1-R9, R12 and R13 are verified, the move is byte-identical, and nothing is to be rolled back.
R14, R15 and R16 are the only work left.**

## 1. Mode and task type

`IMPLEMENTATION` — design-system / governance migration. Remove the `src/components/ui/` path classification from the
project's image primitive so that no enrolled surface reaches a `tier2-legacy-primitive` node through it. No
user-visible change is intended, and any is a defect.

## 2. Objective

Owner decision §17.6 on Task 820 (2026-09-11, quoted verbatim in
`tasks/Sprints/Sprint_75_kickoff_prompt_Task_820_One_Rule_For_The_Pattern_Directory.md` §17.7):

> **Decision §17.6 — select (A2), 2026-09-11.** Task 813's AppImage migration is a blocking dependency of Task 820.
> Migrate `LightboxView.tsx` off `src/components/ui/AppImage.tsx` through Task 813; do not enrol `LightboxView`
> merely to hide the tier-2 hop, defer either pattern, add an exclusion, or baseline the tier-2 finding. After Task
> 813 is approved, re-run Task 820 §17.2 option (A) from the same base
> `02d975f945159df38c23a0caab43e1c7a96faa58` to the then-current fixed HEAD, with diff/surface limits re-measured
> and recorded. The reconciliation must remove the 20 now-false entries, list every baseline delta, and pass the
> gate plus its self-test. Any new tier-2 refusal remains a stop for a new owner decision.

And owner decision 1 (2026-09-11, `tasks/Sprints/Sprint_75_The_Gates_That_Report_Green_On_What_They_Cannot_See.md`,
quoted verbatim there):

> This does not authorize allowlisting any non-pattern tier-1 target or any tier-2 `src/components/ui/*` path.
> AppImage and PasswordRequirementsHint remain tier 2.

Together those close every route except changing what `AppImage` *is* to the gates. There is no allowlist route, no
baseline route, and no "enrol the intermediate node" route.

## 3. Verified context — measured 2026-09-11 by the Task 820 review, re-measure at execution

### 3.1 The tier-2 classification is a path prefix, and nothing else

`FACT`, read this session — both gates classify tier 2 by one literal string constant:

```
scripts/check-rendered-scope.mjs:211   const TIER2_PREFIX = 'src/components/ui/';
scripts/check-surface-census.mjs:56    const TIER2_PREFIX = 'src/components/ui/';
```

`check-rendered-scope.mjs:18-19` states the intent: "`tier2-legacy-primitive` — resolves under `src/components/ui/*`;
the fix is 'stop importing it', not 'enrol the file' (16d tier 2)." Nothing inspects the file's contents, its
imports, its authorship or whether it is shadcn. **A file is tier 2 because of where it sits.**

`INFERENCE` from that, and it is the whole design of this task: moving `AppImage.tsx` out of `src/components/ui/`
removes the classification at its source for **every** consumer at once, without changing a line of its rendering
behaviour. Nothing else available to this task has that property.

### 3.2 `AppImage` is not a legacy shadcn primitive — it is the project's canonical `<img>` render site

`FACT`, `src/components/ui/AppImage.tsx` read in full this session. It imports only `react`, `react-dom`'s `preload`,
`@/lib/utils`'s `cn`, its own `./AppImage.module.css`, `./appImageConfig`, `./useAdaptiveImageConfig`,
`@/lib/imageDelivery`, `@/lib/performance/predictive` and `@/lib/performance/imageGuard`. **Zero shadcn imports, zero
Radix, zero Mantine.** Its own header comment, lines 3-6:

> `next/image` is NOT used here. All images are delivered via Cloudinary CDN with native `<img>` + manual srcset.
> Do not re-introduce next/image anywhere.

and at the render site, lines 132-133:

> AppImage is the canonical `<img>` render site; next/image is project-wide banned
> (`eslint.config.mjs` `IMAGE_RENDER_EXCEPTIONS`). This disable is intentional and approved.

It owns Cloudinary `srcset`/`sizes`, LQIP blur-up with a `loaded` fade, React 19 render-phase `preload`, LCP
`fetchPriority`, `imageGuard` priority-preload accounting with a documented hook-ordering guarantee (lines 97-115),
budget-capped predictive preloading, and a `layoutContext` contract tied to `MantineListingCardTrack`'s real grid
geometry (Task 807/809). `FACT` — Mantine ships no equivalent; `@mantine/core`'s `Image` has none of this.

`INFERENCE` — "migrate it to Mantine" in the sense the other Sprint 74/75 migrations used is not available here
without deleting documented, performance-critical behaviour and breaking the project's own `next/image` ban. That is
why §5.1 is an owner decision and not an executor's judgement.

### 3.3 What the tier-2 edge actually is, and how large it is

`FACT` — `scripts/rendered-scope-baseline.json` (version 1, 30 edges) holds exactly **two** `AppImage` frontier
edges, both recorded debt:

```
src/modules/listings/components/ListingCard.tsx            -> src/components/ui/AppImage.tsx
src/modules/locations/components/PopularLocationsView.tsx  -> src/components/ui/AppImage.tsx
```

`FACT` — `scripts/surface-census-baseline.json` (version 1, 690 blocks) holds **25** blocks of the form
`<surface> :: src/components/ui/AppImage.tsx :: tier2-legacy-primitive`, across 25 distinct surfaces — 12 of them
route surfaces:

```
src/app/[locale]/page.tsx                         src/modules/listings/components/FavoritesShell.tsx
src/app/[locale]/listings/page.tsx                src/modules/listings/components/FeaturedListingsView.tsx
src/app/[locale]/listings/[slug]/page.tsx         src/modules/listings/components/LatestListingsView.tsx
src/app/[locale]/favorites/page.tsx               src/modules/listings/components/ListingCard.tsx
src/app/[locale]/cabinet/page.tsx                 src/modules/listings/components/ListingDetailView.tsx
src/app/[locale]/ci/click-shield-modal/page.tsx   src/modules/listings/components/ListingFormShell.tsx
src/app/admin/companies/page.tsx                  src/modules/listings/components/ListingGallery.tsx
src/app/admin/listings/[id]/preview/page.tsx      src/modules/listings/components/ListingsShellView.tsx
src/app/admin/locations/page.tsx                  src/modules/listings/components/RecentlyViewedGridView.tsx
src/app/admin/popular-locations/page.tsx          src/modules/listings/components/SimilarListingsView.tsx
src/app/admin/users/[id]/page.tsx                 src/modules/listings/components/steps/StepPhotos.tsx
src/app/admin/users/new/page.tsx                  src/modules/listings/components/steps/StepPreview.tsx
                                                  src/modules/locations/components/PopularLocationsView.tsx
```

`FACT` — Task 820's Revision 3 added two more, refused by `--update-baseline`
(`docs/sessions/evidence/task820/Rev3_05_tier2-refusal-and-restore.txt`):

```
src/design-system/mantine/patterns/MantineListingDetailPattern.tsx  :: src/components/ui/AppImage.tsx
src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx :: src/components/ui/AppImage.tsx
```

`FACT` — neither pattern imports `AppImage` directly. Read this session:

```
MantineListingGalleryPattern.tsx:6   import { LightboxView, … } from '@/modules/listings/components/LightboxView'
LightboxView.tsx:6                   import { AppImage } from '@/components/ui/AppImage'   (rendered :133, :165)
MantineListingDetailPattern.tsx:6    import { MantineListingGalleryPattern, … } from './MantineListingGalleryPattern'
```

`MantineListingDetailPattern.tsx:116` states "Zero `@/components/ui/*` imports", and that is true of the file itself.
The per-surface census is transitive, so both surfaces reach `AppImage` through **one shared node,
`LightboxView.tsx`**. `INFERENCE` — this task has one blocking hop to clear for Task 820, not two, and the 25
pre-existing blocks ride on the same fix.

### 3.4 The contract says this is exactly one task, and this is it

`FACT` — `docs/agent-contract.md` 16d, tier 2 (lines 210-212):

> **Legacy primitives they import** (`@/components/ui/*`). The surface must **stop importing them** — that is in
> scope and asserted by a zero-hit grep. Migrating the primitive *files* is not, because they are consumed
> repo-wide; name the separate task.

`FACT` — `scripts/check-surface-census.mjs:534` prints the same to the executor at failure time: "Migrating the
primitive file itself is a separate, repo-wide task." Task 813 is that named task. §3.3's 25 surfaces are the
"consumed repo-wide" the clause refers to, now measured rather than asserted.

### 3.5 What is NOT established

`UNKNOWN` — the complete list of files that import `AppImage` by any path (the baselines above record *rendered
frontier edges* and *transitive census blocks*, which is not the same set as "every importer"). The 25-surface and
2-edge figures are the governance-visible surface, not the import census. **R1 re-derives the real importer list at
execution; no count in §3.3 may be copied into the implementation.**

`UNKNOWN` — whether `AppImage` has a canonical Mantine Story today. `docs/backlog.md`'s Task 813 row (filed
2026-09-10 by Task 809's clause-16d census) states `AppImage` had "zero Story imports"; that is a dated claim by
another task and was not re-verified for this kickoff. R1 measures it.

`UNKNOWN` — the co-located sibling set that must move with it. `AppImage.tsx` imports `./AppImage.module.css`,
`./appImageConfig` and `./useAdaptiveImageConfig` as relative paths, and re-exports `ImageVariant` from
`./appImageConfig` (line 17). R1 enumerates every sibling and every external importer of each sibling separately —
`useAdaptiveImageConfig` and `appImageConfig` may have importers of their own that `AppImage.tsx` does not reveal.

## 4. Requirement ledger

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | §3.5 | Re-derive at execution, before any edit: every file importing `AppImage`, every file importing each co-located sibling, whether a canonical Mantine Story imports `AppImage`'s own path today, and the live counts for §3.3's 25 census blocks and 2 frontier edges. Report each against §3.3/§3.5 and explain every difference. §3's figures are a dated measurement to reconcile against, never to copy. | **P0** | AC1 | Confirmed |
| **R2** | §5.1 decision (C) | `AppImage.tsx` and every co-located file R1 proves must move with it no longer resolve under `src/components/ui/`. The destination is exactly `src/design-system/media/`. The decision forbids `src/design-system/mantine/patterns/` — the project's canonical non-Mantine image primitive is not a Mantine pattern. No other destination is available to the executor. | **P0** | AC2 | Confirmed — destination fixed by decision §5.1 (C) |
| **R3** | §3.2 | **Zero behaviour change.** The moved file's content is byte-identical apart from import specifiers that must change because a path moved. No prop, no CSS class, no hook order, no `preload` call, no `fetchPriority`, no `imageGuard` notification, no `layoutContext` semantic is altered. `git diff` on the moved file shows import-line changes and nothing else. | **P0** | AC3 | Confirmed |
| **R4** | §3.3 | Every importer R1 found is updated to the new path in the same change. No re-export shim, no barrel alias, and no `tsconfig` path mapping is added to avoid touching callers — a shim would leave the old specifier working and the rule unenforced. | **P0** | AC4 | Confirmed |
| **R5** | Decision §17.6 | After the move, `LightboxView.tsx` contains **zero** `@/components/ui/` matches, and `npm run check:surface-census -- --surface src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx` and the same for `MantineListingDetailPattern.tsx` report **zero** `tier2-legacy-primitive` blocks. This is the exact condition Task 820 is blocked on. | **P0** | AC5 | Confirmed |
| **R6** | §5.1 decision | The moved component is governed, not merely relocated: enrolled in `scripts/mantine-migration-scope.json` **and** covered by a canonical Story that statically imports its new path (`src/design-system/media/AppImage.tsx`), so `check:story-coverage` counts it. Enrolment is additionally enforced from this task onward by R12. | **P0** | AC6, AC7 | Confirmed |
| **R7** | §3.3 | Both blocking baselines are brought to a true state in this change, each through its own `--update-baseline`, never by hand. `scripts/rendered-scope-baseline.json`: the 2 `AppImage` tier-2 edges are gone or re-keyed to the new path. `scripts/surface-census-baseline.json`: the 25 tier-2 blocks are gone. Report the before/after entry counts and list every entry added and removed. | **P0** | AC8 | Confirmed |
| **R8** | §3.2 | No `next/image` is introduced anywhere, and `eslint.config.mjs`'s `IMAGE_RENDER_EXCEPTIONS` is updated to the new path so the single approved `no-img-element` disable still resolves. `npm run lint` exits 0 with no new exception added for any other file. | **P0** | AC9 | Confirmed |
| **R9** | Q4 | The 12 route surfaces in §3.3 render identically. LCP behaviour on `/[locale]`, `/[locale]/listings` and `/[locale]/listings/[slug]` is unchanged — `priority`, `fetchPriority`, the `preload` hint and the `imageGuard` budget all still fire for the same images. | **P0** | AC10, AC11 | Confirmed |
| **R14** | Owner decision 2026-09-11, §5.3 | The three retarget edits the move forces are **in scope and required**, not deviations: `scripts/check-homepage-theme-runtime-deps.mjs` (its `EXPECTED_ZERO_INPUT_REL` constant, `:105`), `scripts/design-tokens-allowlist.json` (its path-keyed entry), and `docs/sessions/evidence/task763/appimage-config-class-assertions.test.ts` (a real test importing the moved path). Each must be listed in the session log's `Files Changed` with the reason. **`npm run check:homepage-theme-runtime-deps` and `npm run check:homepage-theme-runtime-deps:verify-gate` must both be run and must both exit 0** — Revision 0 changed that gate's input constant and produced no transcript for either. | **P0** | AC18, AC19 | **Open — executor** |
| **R15** | Review Revision 1 | The session log and completion report must state the measured census result, not "green". `npm run check:surface-census -- --surface` on **both** affected patterns exits **1** on the pre-existing `src/modules/listings/components/LightboxView.tsx [tier1-unenrolled-or-unstoried]` block; what this task removed is the `src/components/ui/AppImage.tsx [tier2-legacy-primitive]` block, and only that. Correct every sentence claiming both censuses are green. | **P0** | AC20 | **Open — executor** |
| **R16** | Owner decision 2026-09-11, §5.3 | `check:design-tokens:strict` and `check:tailwind-runtime-tokens` may **not** be called pre-existing without a before/after proof, because this diff edits `scripts/design-tokens-allowlist.json` — an input the first gate reads. Produce the comparison from an **isolated snapshot of `HEAD`** (`git worktree add` a detached checkout, or a `git archive` export to a scratch directory) — **never `git stash`**, which mutates the live worktree this task's evidence depends on. Run both gates there and in the working tree, and diff the two outputs. Identical output → file two separate numbered tasks, one per gate. Different output → it is a Task 813 regression and is fixed **in this task**; it is not carried out as debt. | **P0** | AC21, AC22 | **Open — executor** |
| **R17** | Owner AC11 rejection, 2026-09-11, §5.4 | This task's own new `src/stories/mantine/primitives/AppImage.stories.tsx` must draw its `gallery-strip / thumbnail row` as **canonical Mantine squares with no hardcoded dimension**, and must not overflow at any reviewed width. `FACT`, read this turn — `:72-77` currently reads `<SimpleGrid cols={4} spacing="xs" style={{ maxWidth: 360 }}>` wrapping `<div style={{ width: 80, height: 56 }}>`: three raw inline dimensions and a 10:7 box, which is both the hardcode the owner forbids and the stretch he rejected. The `negative flow` block's `style={{ width: 160, height: 120 }}` (`:85`) is the same defect and is fixed with it. Use the same canonical Mantine square Task 824 adopts (`AspectRatio ratio={1}`); if 824 has not landed, this task establishes it and 824 consumes it. No px literal, no inline style number, no Tailwind arbitrary dimension anywhere in the file. **Revision 4 (review 2026-09-11):** "no hardcoded dimension" includes a literal in **any** CSS unit passed through a Mantine sizing prop (`w`/`h`/`maw`/`mah`/`miw`/`mih`) — re-expressing a px value in rem is the same hardcode. The thumbnail square is **44 × 44 px from the new registered token `theme.other.boxSize.galleryThumb`** (owner decision §5.5); every other demo size either disappears (column-count layout) or comes from an existing `theme.other` role that documents that variant as its owner. | **P0** | AC23, AC24 | **VERIFIED** — Revision 4 implemented §13.5; review Revision 5 closed AC23 (search empty) and AC24 (44×44px, delta 0, two-armed probe); owner ACCEPTED AC11 |
| **R10** | 812 R9 precedent | `scripts/check-rendered-scope.mjs`, `scripts/check-surface-census.mjs`, `scripts/check-surface-census-changed.mjs`, `scripts/map-changed-surfaces.mjs`, `scripts/audit-design-system-patterns.mjs` and `scripts/check-pattern-enrolment.mjs` are **not modified** — decision §5.1 states "Do not weaken or alter the existing pattern-directory check", and the 2026-09-11 owner decision in §5.3 confirms R10 "remains in force for the six explicitly named governance scripts". `scripts/check-homepage-theme-runtime-deps.mjs` is **not** one of the six and its path-constant retarget is authorised by R14. `TIER2_PREFIX` is not changed, widened, or made configurable — moving the file is the fix; editing the classifier is not. R12's check is a **new** script, never an arm added to an existing one. | **P0** | AC12 | Confirmed |
| **R11** | §5.1 decision | `docs/golden-rules.md`, `docs/design-system-pattern-ownership.md` and `docs/storybook-governance.md` record where the project's image primitive now lives and which gate governs it. No GR-n rule body, `Command` block or receipt string changes. | P1 | AC13 | Confirmed |
| **R12** | §5.1 decision (C) | A **blocking, CI-safe, self-tested media-directory parity check** lands in this same task: every `.tsx` directly under `src/design-system/media/` must be a `scripts/mantine-migration-scope.json` entry, and a manifest entry under that directory whose file no longer exists fails as a ghost entry. It derives the directory listing **at runtime** — never a hard-coded name list — prints its scope boundary and its cannot-see sentence on every run, takes its exit decision from one pure function the real run and the self-test both call, and carries a planted-failure proof. Wired into the `governance` job with no `continue-on-error`, no `\|\| true`, no `exit 0` and no wrapper, in the same shape as the four existing `*:verify` steps. Story coverage stays enforced by the existing `check:story-coverage`; this check does not duplicate it. | **P0** | AC14, AC15, AC16 | Confirmed |
| **R13** | §5.1 decision (B1) | This task is scoped to `AppImage` and its R1-proven co-located siblings only. `ListingFeatureIcon` and `FavoriteButton` are **out of scope** and are filed as **Task 821**; their two `scripts/rendered-scope-allowlist.json` entries stay in place and stay governed, and the `owner` field transfer from `"813"` to `"821"` belongs to Task 821, not here. This task must not touch `scripts/rendered-scope-allowlist.json`. The residual `owner: "813"` values in that file are a documented transitional snapshot under the owner amendment of 2026-09-11 (§5.1) — leaving them is required, not an oversight. | **P0** | AC17 | Confirmed |

## 5. Assumptions and open questions

### 5.1 `OWNER DECISION — RECORDED VERBATIM, 2026-09-11`

> **Decision §5.1 — select (C) and (B1), 2026-09-11.** Move `AppImage.tsx` and only the co-located siblings proven by
> R1 to `src/design-system/media/`; do not place the project's canonical non-Mantine image primitive under
> `src/design-system/mantine/patterns/`. In the same Task 813, add a blocking, CI-safe, self-tested media-directory
> parity check: every `src/design-system/media/*.tsx` file must be enrolled in the manifest, while existing story
> coverage continues to require its canonical Story. The check must derive the directory at runtime, print its scope
> boundary, and prove a planted missing-enrolment failure. Do not weaken or alter the existing pattern-directory
> check.
>
> Task 813 is scoped to `AppImage` and its proven co-located siblings only. File `ListingFeatureIcon` and
> `FavoriteButton` as the next numbered task, transfer their allowlist ownership from `813` to that task in the same
> state update, and keep them governed by their explicit entries. Task 820 may resume immediately after the AppImage
> half is approved; it does not wait for the two unrelated components.

**What this settles, and what it creates.**

1. **Destination is `src/design-system/media/`** — R2. The Mantine-pattern directory is refused by name: the file is a
   bespoke `<img>` renderer (§3.2) and decision 5's "every current and future `.tsx`" must not come to cover a file
   that is not a Mantine pattern.
2. **The new directory does not ship ungoverned** — R12. This is the one thing option (B) would have left open, and
   the decision closes it inside the same task rather than as a follow-up: the media directory gets its own parity
   check, built to the same shape `check-pattern-enrolment.mjs` already proved, and blocking in CI from day one.
3. **Story coverage is not duplicated.** `check:story-coverage` already fails for any enrolled component with no
   canonical Story importing its own path; R12's check asserts enrolment only, and its own output must say so.
4. **The existing pattern-directory check is untouched** — R10, restated by the decision itself.
5. **Scope narrows to the critical path** — R13. `ListingFeatureIcon` and `FavoriteButton` become **Task 821**, and
   the owner amendment below settles exactly how and when their allowlist ownership follows.

> **Owner amendment, 2026-09-11 (quoted verbatim; also recorded in the sprint file).** Ownership of
> `ListingFeatureIcon` and `FavoriteButton` transfers to Task 821 in the sprint/backlog/task-design state now. Their
> `owner` fields in `scripts/rendered-scope-allowlist.json` remain `"813"` as a documented transitional snapshot
> until Task 820's final approved commit preserves AC6. Task 821 must make the field-level `813 → 821` transfer as
> its first tracked-file change after verifying that commit, then retain its own before/after hash and gate
> evidence. No further implementation work for those two components remains authorized under Task 813.

**What the amendment binds here.** The two `owner: "813"` values still present in
`scripts/rendered-scope-allowlist.json` are a **documented transitional snapshot**, not a live ownership claim and
not a defect: ownership already sits with Task 821 in this file, the sprint file and `docs/backlog.md`. A reviewer
who sees `"813"` in that JSON must read it against this amendment rather than filing a state mismatch. R13/AC17
stands unchanged and is now doubly binding — this task touches neither component and never opens that file — and no
further implementation work for `ListingFeatureIcon` or `FavoriteButton` is authorized under Task 813 at all.
6. **Task 820 resumes on this task's approval alone**, not on Task 821's.

### 5.2 Other assumptions

- **`ASSUMPTION` (reversible, stated)** — the move is a relocation, not a rewrite: R3 forbids any behavioural edit.
  Reason: §3.2's measured contract. If the owner picks a rewrite instead, this kickoff does not describe that work
  and must be replaced, not stretched.
- **Out of scope:** any visual or behavioural change to `AppImage` · migrating any other `src/components/ui/*` file ·
  `PasswordRequirementsHint` (the other tier-2 edge, owner decision 1) · Task 820's own baseline reconciliation,
  which re-runs after this task is approved · editing any gate's **logic** (a path-constant retarget is not logic —
  see R14).

### 5.4 `OWNER REJECTION — AC11 RETURNED, 2026-09-11`

The owner opened AC11's tuples and returned them, verbatim:

> я не приймаю таку галерею … Вилазить за рамки екрану. Прев'ю картинок розтягнуті на всю ширину … в оригіналі
> прев'ю сука були майже квадратні, тобто такі як треба.
>
> Необхідно зробити згідно Mantine канонічних квадратів! Ніякого хардкоду, він заборонений!

**Two defects look identical on screen and are not the same defect.** The review separated them against
`git status --short`:

1. **This task's** — `src/stories/mantine/primitives/AppImage.stories.tsx`, an **untracked new file created by Task
   813** (`??` in the owner's status output). `:72-77` hardcodes `maxWidth: 360`, `width: 80`, `height: 56` inside a
   `SimpleGrid cols={4}`, so the cells stretch, the boxes are 10:7 rather than square, and the 360px cap overflows a
   320px viewport. That is R17/AC23/AC24 above, and it is this task's to fix.
2. **Not this task's** — `MantineListingGalleryPattern.tsx`'s `SimpleGrid cols={{ base: 4 }}` at `:79`. `FACT`: that
   file appears in **neither** Task 813's nor Task 820's diff. The defect predates both and was merely surfaced by
   AC11. It is filed as **Task 824**, with `rozetka.com.ua` as the owner's reference.

AC11 stays `RETURNED` until R17 lands and the owner re-reviews AC24's four widths. Task 820's R11 remains blocked on
this task's approval.

### 5.3 `OWNER DECISION — RECORDED VERBATIM, 2026-09-11 (Revision 1 of the review)`

> **Owner decision, 2026-09-11.** Retarget `check-homepage-theme-runtime-deps.mjs`, `scripts/design-tokens-allowlist.json`
> and the related Task 763 assertion is a direct consequence of moving `AppImage`; they are in scope for Task 813.
> The kickoff must list them and require a successful run of `check:homepage-theme-runtime-deps` and its self-test.
> R10 remains in force for the six explicitly named governance scripts.
>
> Also:
> - "Both censuses green" must be corrected: both exit 1 on the pre-existing `LightboxView` tier-1; only the tier-2
>   `AppImage` block disappeared.
> - Do not call `check:design-tokens:strict` and `check:tailwind-runtime-tokens` pre-existing until there is
>   before/after proof. I choose an isolated comparison against a snapshot of `HEAD` / a temporary worktree rather
>   than `git stash`.
> - If the outputs are identical, file two separate tasks for those two blocking gates; if they differ, it is a Task
>   813 regression and must be fixed in it, without carrying the debt out.

**What this settles.** The three retarget edits are not deviations to be forgiven — they are requirements (R14), and
the §7/§8 wording that excluded them was a kickoff defect, now corrected. Rollback is explicitly refused. What is
owed is the measurement Revision 0 skipped: the `check:homepage-theme-runtime-deps` gate whose input constant this
task moved (R14), the corrected census wording (R15), and the isolated before/after that decides whether the two red
blocking gates are inherited or caused (R16).

**Measured going in, so the executor is not re-deriving it blind** — `FACT`, read from Revision 0's own transcripts
this turn: `I10_design-tokens-strict.txt` reports **56** violations with **0 stale markers** and **zero** findings in
`src/design-system/media/` or any `AppImage*` file; `I11_tailwind-runtime-tokens.txt` reports **1** finding,
`src/design-system/mantine/patterns/MantineListingCardTrack.module.css:209 --shadow-sm`, in a file neither Task 820
nor Task 813 touched, with `baseline entries: 0`. Both gates are **blocking** in `.github/workflows/governance-pr.yml`
(`:149`, `:152`). That evidence points towards "inherited", which is exactly why it must be proven rather than
asserted: R16 decides it.

### 5.5 `OWNER DECISION — RECORDED VERBATIM, 2026-09-11 (Revision 4 of the review, R17)`

The review put AC24's measured table to the owner (66 / 83.5 / 106 / 329.5 px at 320 / 390 / 480 / 1440) with three
options: a new registered size token, reuse of `theme.other.boxSize.thumbnail`, or accepting container-relative
squares. The owner answered, verbatim:

> візуально аідтверджую, що тепер Image не виходить за рамки екранів

> розмір квадратів має бути 44х44px

> цей розмір треба записати токеном!

**What this settles.**

1. **No-overflow is owner-accepted** for the Revision 3 Story. AC24 still re-measures it on the Revision 4 Story,
   because the Story changes.
2. **The thumbnail square is 44 × 44 px, and it is a token, not a literal.** Add exactly one new role to the existing
   dimension scale in `src/design-system/mantine/theme.ts`: the `MantineThemeOther` augmentation's `boxSize` key
   union gains `'galleryThumb'`, and `other.boxSize` gains `galleryThumb: '2.75rem', // 44px`, with a provenance
   comment citing this decision (Task 813 R17 Revision 4, owner decision 2026-09-11) and naming its owners: the
   `AppImage` Story's `gallery-strip` row and no-src square, and Task 824's gallery thumbnail row.
3. **Do not reuse a 44-valued role that already exists.** `theme.other.touchTarget` (`2.75rem`) and
   `theme.other.iconSize.touch` (`44`) have the same value and a different documented owner; the theme's own rule
   ("same value, different documented owner, is still invalid") forbids consuming either for a thumbnail.
4. **Canonical square stays `AspectRatio ratio={1}`**, now sized by the token (for example
   `<AspectRatio ratio={1} w={theme.other.boxSize.galleryThumb}>`, with `theme` from `useMantineTheme()` inside a
   component). The row is a **non-stretching** Mantine row (e.g. `Group gap="xs"`) — never a `SimpleGrid` whose
   columns divide the container, which is what produced 329.5 px at 1440.
5. **Other demo sizes get no new token.** `listing`, `gallery-main` and `avatar` either size from a column-count
   layout (`SimpleGrid cols={{ … }}` — counts, not dimensions) or from an existing `theme.other` role whose documented
   owner is that variant. If a section cannot be sized either way, stop with `CANONICAL STYLE DECISION REQUIRED` naming
   it — do not invent a value.
6. **Task 824 consumes the same token** instead of leaving its §3.3 dimension source `UNKNOWN`; the decision is
   recorded in the sprint file and in 824's kickoff. This does not change 824's scope and does not make 813 wait for
   824.

## 6. Pre-read rule bundle

`docs/golden-rules.md` in full, GR-1 · GR-3 · the `Enforcement status` table · `docs/agent-contract.md` clauses
**9, 13, 16a-16d** — 16d's three-tier block (`:205-217`) in full · `docs/qa-profiles.md` (Q4) ·
`docs/orchestrator-ui-task-design.md` · `src/components/ui/AppImage.tsx` in full, with
`./appImageConfig.ts`, `./useAdaptiveImageConfig.ts`, `./AppImage.module.css`, `@/lib/imageDelivery`,
`@/lib/performance/predictive` and `@/lib/performance/imageGuard` · `src/modules/listings/components/LightboxView.tsx`
in full · `scripts/check-rendered-scope.mjs` — `TIER2_PREFIX`, the root walk, the baseline writer and its tier-2
refusal · `scripts/check-surface-census.mjs` — `TIER2_PREFIX`, `countUiImports` (`:191-209`) and the block reason at
`:544` · `scripts/check-story-coverage.mjs` — the admission test the moved file must satisfy ·
`scripts/mantine-migration-scope.json` · `eslint.config.mjs`'s `IMAGE_RENDER_EXCEPTIONS` ·
`tasks/Sprints/Sprint_75_kickoff_prompt_Task_820_One_Rule_For_The_Pattern_Directory.md` §17.1, §17.6 and §17.7 ·
this kickoff.

## 7. Scope

- **Moved:** `src/components/ui/AppImage.tsx` and every co-located file R1 proves must move with it, to the §5.1
  destination.
- **Edited:** every importer R1 found · `eslint.config.mjs` (`IMAGE_RENDER_EXCEPTIONS` path only) · `package.json` ·
  `.github/workflows/governance-pr.yml` · **the three retarget files R14 names** — `scripts/check-homepage-theme-runtime-deps.mjs`
  (`EXPECTED_ZERO_INPUT_REL` only), `scripts/design-tokens-allowlist.json` (the path key only) and
  `docs/sessions/evidence/task763/appimage-config-class-assertions.test.ts` (its import path only) ·
  `scripts/mantine-migration-scope.json` (+1) · `scripts/rendered-scope-baseline.json` and
  `scripts/surface-census-baseline.json` (each via its own `--update-baseline`) · `docs/golden-rules.md`,
  `docs/design-system-pattern-ownership.md`, `docs/storybook-governance.md`.
- **New:** the canonical Story for the moved component, if R1 proves none exists · `scripts/check-media-enrolment.mjs`
  and its two `package.json` entries (R12) · two blocking steps in `.github/workflows/governance-pr.yml` (R12).
- **Written:** `docs/sessions/evidence/task813/*` · `docs/sessions/2026-MM-DD-task813-*.md` · the concise
  `docs/backlog.md` state line.
- **Revision 4 (R17), added by the review:** `src/design-system/mantine/theme.ts` — exactly the one `boxSize.galleryThumb`
  role and its type-union key (§5.5), nothing else in that file · `src/stories/mantine/primitives/AppImage.stories.tsx` ·
  `scripts/task813-appimage-thumb-probe.mjs` — authorised as retained, task-numbered evidence tooling (no
  `package.json` entry, not a gate).

## 8. Out of scope

Everything in §5.2. In particular: **no change to `AppImage`'s rendered output**, and **no edit to any existing gate
script's logic** — R12 adds a new one, and it never extends `check-pattern-enrolment.mjs` or any of R10's six.
*Corrected in Revision 1:* the original wording said "no edit to any existing gate script", which wrongly excluded
`check-homepage-theme-runtime-deps.mjs`'s path-constant retarget. Retargeting a constant that names a file this task
moved is required (R14); changing a gate's logic remains forbidden. Also out of scope
by decision §5.1 (B1): `ListingFeatureIcon`, `FavoriteButton`, and `scripts/rendered-scope-allowlist.json` in any
form — those are **Task 821**. If clearing the tier-2 edge appears to require any of these, that is a
`BLOCKED — OWNER DECISION REQUIRED`, not a small fix.

## 9. Current and required behavior

**Before.** The project's image primitive sits at `src/components/ui/AppImage.tsx`. Two gates classify anything under
that prefix as `tier2-legacy-primitive`. 25 census blocks and 2 frontier edges record it as debt; two newly enrolled
design-system patterns reach it transitively through `LightboxView.tsx`, and `--update-baseline` refuses to record
those, which is what blocks Task 820.

**After.** The same component, byte-identical in behaviour, lives outside `src/components/ui/`, is enrolled and has a
canonical Story of its own, every importer points at the new path, both baselines are true, and
`check:surface-census --surface` on both patterns reports zero tier-2 blocks.

## 10. Implementation requirements

1. **Order is load-bearing.** R1's census → the move → importer rewrite → `eslint.config.mjs` → Story → enrolment →
   the R12 parity check and its CI wiring → both baselines → docs. Enrolling before the Story exists makes
   `check:story-coverage` red; updating a baseline before the importers are rewritten records a half-migrated state;
   adding the parity check before the move means it has an empty directory to assert against.
1a. **The parity check reads the directory, not a list** — decision §5.1's own words. A hard-coded set of names
   would pass while the rule it enforces silently stops applying to the next file added there. Build it to the shape
   `scripts/check-pattern-enrolment.mjs` already proved — a pure `evaluate…` classifier, a pure
   `evaluateGateExitCode`, a printed scope boundary, and a `--verify-gate` self-test whose arms include a
   ghost-entry arm and an exit-code-wiring arm — **without importing from or modifying that file**.
2. **Never hand-edit a baseline.** Both are written by their own `--update-baseline`, which is also what keeps the
   tier-2 refusals intact. If either writer refuses something, stop and report — do not narrow the window.
3. **No shim.** R4 forbids a re-export at the old path, a barrel alias and a `tsconfig` path mapping. The old
   specifier must stop resolving, or the rule is not enforced and the next importer re-introduces the edge.
4. **Read and write through Node for every plant-and-restore probe**, never PowerShell `Get-Content -Raw` without
   `-Encoding utf8` — it has corrupted a script and a data file in this sprint already (818/816).
5. **Transcripts record platform, Node version, working directory, exact command and actual exit code in the same
   file**, and the final gate block records the `git hash-object` of every changed file.
6. **Transcripts BOM-free** — `[IO.File]::WriteAllText($path, $text, (New-Object Text.UTF8Encoding $false))` or
   PowerShell 7's `-Encoding utf8NoBOM`. Task 820's Revision 2 lost a validation pass to exactly this.

## 11. Positive and negative flows

**Positive.** A developer opens `/[locale]/listings/[slug]`, clicks the main photo, and the lightbox opens with the
same images, the same blur-up, the same srcset and the same LCP timing as before — while
`check:surface-census --surface` on the two patterns now reports zero tier-2 blocks.

| Negative flow | Applicable | Expected behavior |
|---|---:|---|
| An importer is missed | Yes | `npm run typecheck` fails on the unresolved specifier — R4/AC4 |
| A shim is added at the old path | Yes | AC4 fails: a `src/components/ui/AppImage*` file still exists |
| The moved component has no Story of its own | Yes | `check:story-coverage` fails once it is enrolled — R6, and why the Story comes first |
| A co-located sibling is left behind and still imported across the boundary | Yes | R1's sibling census catches it; a rendered sibling left under the prefix keeps the tier-2 edge alive |
| `--update-baseline` refuses a new tier-2 edge | Yes | `BLOCKED — OWNER DECISION REQUIRED`; never narrow the window or hand-edit |
| A route's LCP image stops being preloaded | Yes | R9/AC11 — the `preload` hint and `fetchPriority` must be unchanged for the same images |
| A new `.tsx` is added under `src/design-system/media/` without enrolment | Yes | R12's check fails naming it — the reason the directory is not left ungoverned |
| A manifest entry points at a `src/design-system/media/` path that no longer exists | Yes | R12's check fails naming it as a ghost entry |
| Authorization / RLS / network / concurrent writer | **No** | a file move, import rewrites, one manifest entry, one Story, one new check, two baselines and three docs |

## 12. Acceptance criteria

- **AC1 [R1]** — Given the census re-derived at execution, then every importer of `AppImage` and of each co-located
  sibling is listed, the own-Story status is stated, and the live tier-2 counts are reconciled against §3.3's 25
  blocks / 2 edges with every difference explained. Quote the totals and the commands that produced them.
- **AC2 [R2]** — Given the final tree, then no file named `AppImage*` resolves under `src/components/ui/`, and the
  moved files sit at the §5.1 destination. Quote `git status --short` for both paths.
- **AC3 [R3]** — Given `git diff -M` on the moved file, then it is detected as a rename and the only content changes
  are import specifiers. Quote the diff in full; any other changed line is a defect.
- **AC4 [R4]** — Given the final tree, then a repo-wide search for `components/ui/AppImage` returns **zero** hits in
  `src/`, and no re-export, barrel alias or `tsconfig` path mapping was added. Quote the zero-hit search.
- **AC5 [R5]** — Given the final tree, then `LightboxView.tsx` has zero `@/components/ui/` matches, and
  `check:surface-census --surface` reports **zero** `tier2-legacy-primitive` blocks for both
  `MantineListingGalleryPattern.tsx` and `MantineListingDetailPattern.tsx`. Quote both censuses.
- **AC6 [R6]** — Given `scripts/mantine-migration-scope.json`, then it holds the moved component's new path and no
  other entry changed. Quote the before/after counts and the added path.
- **AC7 [R6]** — Given `npm run check:story-coverage`, then it exits 0 with the moved component counted as covered,
  and the Story's `meta.title` satisfies `isCanonicalMantineTitle`. Quote the title, the static import line and the
  coverage totals.
- **AC8 [R7]** — Given both baselines after their own `--update-baseline`, then `check:rendered-scope` and
  `check:surface-census:changed` both exit 0 with 0 new and 0 stale, the `AppImage` tier-2 entries are gone, and
  every entry added and removed is listed. Quote both scope blocks and both before/after counts.
- **AC9 [R8]** — Given `npm run lint`, then it exits 0, `IMAGE_RENDER_EXCEPTIONS` names only the moved file's new
  path, and no `next/image` import exists anywhere in `src/`. Quote the exception hunk and the zero-hit search.
- **AC10 [R9]** — Given `npm run build`, then it exits 0, and the route table's First Load JS for
  `/[locale]`, `/[locale]/listings` and `/[locale]/listings/[slug]` is compared against the pre-change build with any
  difference explained. Quote both route tables.
- **AC11 [R9]** — `OWNER VISUAL QA REQUIRED`. Given the moved component's Story and the affected routes, then the
  owner reviews and records accepted/returned for each tuple: the new Story's `Default` at `390` and `1440` in `en`;
  `Patterns/Mantine/ListingGalleryPattern → Default` lightbox **closed** and **open** at `390` and `1440` in `en`.
  Name the six tuples in the completion report; no automated screenshot verdict substitutes for this review.
- **AC12 [R10]** — Given the final tree, then `git diff --stat` is **empty** for the six scripts named in R10, and
  `TIER2_PREFIX` is byte-identical in both gates. Quote both.
- **AC13 [R11]** — Given the three documents, then each records the new location and its governing gate, and GR-1's
  `Command` block, its receipt string and every GR-n rule body are byte-identical. Quote the changed rows and the
  byte-identity check.

- **AC14 [R12]** — Given `npm run check:media-enrolment` on the final tree, then it exits **0**, prints what it
  scanned, what it does **not** scan, and its cannot-see sentence, and states the live `src/design-system/media/`
  file count and the manifest entry count. Its output must also state that canonical-Story coverage is
  `check:story-coverage`'s job, not this check's. Quote the output.
- **AC15 [R12]** — Given a planted unenrolled file under `src/design-system/media/` — add a scratch `.tsx`, or
  temporarily remove the moved component's path from the manifest; name which — then the check exits non-zero naming
  it, and `npm run check:media-enrolment:verify` passes every arm including an exit-code-wiring arm and a
  ghost-entry arm. Restore, and retain **one** witness transcript carrying the `git hash-object` before, the same
  value after, and the explicit `git --no-optional-locks status --porcelain -- <path>` output.
- **AC16 [R12]** — Given `.github/workflows/governance-pr.yml` after the change, then the check and its self-test
  are two steps in the `governance` job with no `continue-on-error`, no `|| true`, no `exit 0` and no wrapper. Quote
  the hunk with the job name and the neighbouring steps.
- **AC17 [R13]** — Given the final tree, then `git diff --stat scripts/rendered-scope-allowlist.json` is **empty**,
  both `owner: "813"` entries are byte-identical to their pre-task content, and no work on `ListingFeatureIcon` or
  `FavoriteButton` appears in this diff. Quote the empty diff.

- **AC18 [R14]** — Given the final tree, then the session log's `Files Changed` lists all three retarget files with
  the reason "path constant / path key / import path follows the moved file", and each shows only that change. Quote
  the three `git diff` hunks; any other changed line in those files is a defect.
- **AC19 [R14]** — Given `npm run check:homepage-theme-runtime-deps` and
  `npm run check:homepage-theme-runtime-deps:verify-gate` on the final tree, then **both exit 0**, and the gate's
  output names `src/design-system/media/AppImage.module.css` as its expected-zero input. Quote both transcripts with
  platform, Node version, cwd, exact command and actual exit code. A non-zero exit here is a defect of this task, not
  a pre-existing condition.
- **AC20 [R15]** — Given the corrected session log and completion report, then every sentence about the per-surface
  census states that **both** runs exit 1 on the pre-existing `LightboxView [tier1-unenrolled-or-unstoried]` block and
  that only the `AppImage [tier2-legacy-primitive]` block was removed. Quote the corrected sentences against
  `R1_08_baseline_census-gallery.txt` (2 blocks, before) and `AC5_01_census-gallery-final.txt` (1 block, after).
- **AC21 [R16]** — Given an isolated snapshot of `HEAD` created with `git worktree add --detach` or `git archive`
  into a scratch directory outside this repository's working tree, then `npm run check:design-tokens:strict` and
  `npm run check:tailwind-runtime-tokens` are run **there** and in the live working tree, and the four outputs are
  retained. `git stash` is forbidden: it mutates the worktree this task's other evidence depends on. Quote the four
  transcripts and the exact isolation command.
- **AC22 [R16]** — Given AC21's four outputs, then the verdict is stated explicitly. Identical violation sets in both
  environments → both gates are inherited, and this task files **two separate numbered tasks**, one per gate, naming
  the exact violation set each owns. Any difference → it is this task's regression and is fixed **inside Task 813**;
  it may not be carried out as debt, baselined, or handed to a follow-up. Quote the set comparison, not just the
  totals.

- **AC23 [R17]** — *Amended in Revision 4.* Given `src/stories/mantine/primitives/AppImage.stories.tsx` after the
  fix, then §13.5's `Select-String` search returns **no output**. It covers what Revision 3's search could not see: a
  Mantine sizing prop or style key carrying a literal in any unit (`maw="20rem"` is a hit), any CSS length literal
  (`px`, `rem`, `em`, `vw`, `vh`, `vmin`, `vmax`, `%`), any `style={{` object, and any Tailwind arbitrary value in a
  `className`. Comments count: a historical value quoted in a comment is removed, not exempted. Every remaining size
  is either a column-count layout (`SimpleGrid cols`) or a `theme.other.*` value whose definition line is quoted from
  `src/design-system/mantine/theme.ts`. Quote the empty search, the token definition lines and the changed hunk.
- **AC24 [R17]** — *Amended in Revision 4.* Given `Mantine/Primitives/AppImage → Default` rendered at **320, 390, 480
  and 1440** in `en`, then each of the four `gallery-strip` thumbnails and the no-src square measures **44 × 44 px**
  (`getBoundingClientRect()` width and height each within 1 px of 44), the value is **the same at all four widths**
  (max − min of every thumbnail width across all four widths ≤ 1 px), and `document.documentElement.scrollWidth` does
  not exceed `clientWidth` at any width. The probe's pass condition is exactly this sentence; a field named for a
  weaker property (per-row uniformity) does not satisfy it, and the retained JSON carries the derived cross-width
  max − min. The corrected probe must first **fail** on the Revision 3 Story (§13.5 step 2). Quote the raw
  measurements per width — a screenshot is not a measurement. These four widths then go back to the owner as AC11's
  re-review.

**GR-4 AC AUDIT — 24 criteria; each states an observable property; absolutes: AC4's and AC9's "zero hits",
AC23's empty search and AC12's / AC17's "empty diff" are this task's defined outcome, scoped to named paths this task
deliberately does not otherwise change; AC24's 1 px is a measurement tolerance, not a pixel-perfect claim.**

## 13. QA profile and verification plan

**`Q4 Release/Critical Flow`** — `docs/qa-profiles.md` selects Q4 for release-affecting work and for any task
claiming a gate result. This task moves the image primitive behind **12 route surfaces** including `/[locale]`,
`/[locale]/listings` and `/[locale]/listings/[slug]`, all LCP-sensitive, and it moves two blocking gates' baselines.
The claim is zero behavioural change, which under Q4 requires a regression baseline rather than an assertion.

### 13.1 Baseline — capture before any edit

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$evidence = "docs\sessions\evidence\task813"
New-Item -ItemType Directory -Force -Path $evidence
node.exe -p process.platform
node.exe --version
Get-Location
git --no-optional-locks status --short
node.exe -e "const{execSync}=require('child_process');console.log(execSync('git grep -l AppImage -- src',{encoding:'utf8'}))"
npm.cmd run check:rendered-scope
npm.cmd run check:surface-census -- --surface src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx
npm.cmd run check:surface-census -- --surface src/design-system/mantine/patterns/MantineListingDetailPattern.tsx
npm.cmd run check:story-coverage
npm.cmd run build
```

Expected: `win32`; the Node version; the project root; the worktree state; the full importer list (R1/AC1); the
rendered-scope gate at exit 0; both per-surface censuses each naming one `tier2-legacy-primitive` block on
`AppImage`; `check:story-coverage` exit 0; and a zero-exit build whose route table is retained as AC10's before-half.
**Return all of it before changing any tracked file.**

### 13.2 Gates on the final tree

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p process.platform
node.exe --version
Get-Location
npm.cmd run typecheck
npm.cmd run lint
node.exe -e "const{execSync}=require('child_process');try{console.log(execSync('git grep -n components/ui/AppImage -- src',{encoding:'utf8'}))}catch(e){console.log('zero hits — expected')}"
npm.cmd run check:surface-census -- --surface src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx
npm.cmd run check:surface-census -- --surface src/design-system/mantine/patterns/MantineListingDetailPattern.tsx
npm.cmd run check:rendered-scope
npm.cmd run check:rendered-scope:verify
npm.cmd run check:surface-census:changed
npm.cmd run check:surface-census:changed:verify
npm.cmd run check:pattern-enrolment
npm.cmd run check:pattern-enrolment:verify
npm.cmd run check:media-enrolment
npm.cmd run check:media-enrolment:verify
npm.cmd run check:homepage-theme-runtime-deps
npm.cmd run check:homepage-theme-runtime-deps:verify-gate
npm.cmd run check:story-coverage
npm.cmd run check:stories
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
```

Expected: typecheck 0 · lint 0 · the `components/ui/AppImage` search at **zero hits** · both per-surface censuses at
**zero** tier-2 blocks · `check:rendered-scope` exit 0 with 0 new / 0 stale · all four self-tests passing every arm ·
`check:story-coverage` exit 0 with the moved component covered · `check:stories` 0 violations · `build` **exit 0**,
mandatory under `agent-contract` clause 9 · both hygiene gates clean. **Record every exit code inside its own
transcript and the `git hash-object` of every changed file in this block.**

### 13.2a The isolated before/after for the two red blocking gates (R16/AC21)

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$evidence = "docs\sessions\evidence\task813"
$snapshot = "$env:TEMP\task813-head-snapshot"
git --no-optional-locks worktree add --detach $snapshot HEAD
Push-Location $snapshot
npm.cmd ci
npm.cmd run check:design-tokens:strict *>&1 | Out-File -Encoding utf8NoBOM "$snapshot\before-design-tokens.txt"
npm.cmd run check:tailwind-runtime-tokens *>&1 | Out-File -Encoding utf8NoBOM "$snapshot\before-tailwind-tokens.txt"
Pop-Location
Copy-Item "$snapshot\before-design-tokens.txt" "$evidence\R16_01_design-tokens_BEFORE.txt"
Copy-Item "$snapshot\before-tailwind-tokens.txt" "$evidence\R16_02_tailwind-tokens_BEFORE.txt"
npm.cmd run check:design-tokens:strict *>&1 | Out-File -Encoding utf8NoBOM "$evidence\R16_03_design-tokens_AFTER.txt"
npm.cmd run check:tailwind-runtime-tokens *>&1 | Out-File -Encoding utf8NoBOM "$evidence\R16_04_tailwind-tokens_AFTER.txt"
git --no-optional-locks worktree remove $snapshot --force
git --no-optional-locks worktree list
git --no-optional-locks status --short
```

`git worktree add` and `git worktree remove` write only under `$env:TEMP` and `.git/worktrees`; they never touch this
repository's working tree, which is why the owner chose this form over `git stash`. If `git worktree` is unavailable,
use `git archive HEAD | tar -x -C $snapshot` instead and say so. Expected: both `BEFORE` runs complete against an
unmodified `HEAD`; the final `worktree list` shows only the main worktree; `git status --short` is unchanged from
before the block. Compare the **violation sets**, not the totals, and record the AC22 verdict.

### 13.3 Owner visual review

AC11's six tuples, opened in Storybook and in the running app by the owner. `screenshots:assert` and every alias are
retired (owner decision 2026-09-03) and must not be run or cited.

### 13.3a The planted arm

AC15's probe, run and restored under §10.5's one-transcript witness rule, touching a scratch path under
`src/design-system/media/` or the manifest only — never the moved component's source.

### 13.4 Owner-native rule

Native Windows PowerShell throughout. A result from WSL, a Linux VM or a mounted Linux view is an environment screen,
not evidence; record it as `MISSING EVIDENCE` with the exact native command.

### 13.5 Revision 4 — R17 re-entry (execute this and nothing else)

**Execution state: `remediation`.** Start at step 1 below. Reusable and not to be re-run: every R1–R16 artifact,
§13.1's baseline, §13.2a's worktree comparison, both `--update-baseline` writes, AC15's plant. `R17_04_ac24-thumb-measurements.json`
and `R17_04_probe-run.txt` are **preserved** as the Revision 3 evidence and marked superseded in the session log —
the probe must stop hard-coding that output path, so no rerun can overwrite them.

1. **Correct the probe first, before touching the Story.** In `scripts/task813-appimage-thumb-probe.mjs`: take the
   output path from a required `--out <file>` argument (refuse to run without it, refuse an existing file); make the
   pass condition exactly AC24's sentence — per thumbnail `|w − 44| ≤ 1` and `|h − 44| ≤ 1`, cross-width
   `max − min ≤ 1` over every thumbnail width at all four widths, the no-src square measured the same way, and
   `scrollWidth ≤ clientWidth`; write the derived cross-width `max`, `min` and `delta` into the JSON. Select the thumbnails
   **structurally** (the `AspectRatio` roots inside the section whose label reads `gallery-strip / thumbnail row`, and the
   one inside the no-src section) and remove every `data-testid` from the Story — story markup that exists only to
   serve a measurement is a probe, not a permanent artifact (`orchestrator-procedures.md`, corollary 726; the
   `appimage-gallery-strip-grid` hook is not even read by the probe).
2. **Negative arm.** Build Storybook and run the corrected probe against the **unchanged Revision 3 Story**. It must
   exit **1**, naming the 44 px and cross-width failures (the Revision 3 cells are 66…329.5 px). A probe that passes
   here cannot prove AC24 and is itself a defect.
3. Add `boxSize.galleryThumb` to `theme.ts` (§5.5 item 2) and quote both definition lines.
4. Rewrite the Story per §5.5 items 4–5: no literal in any unit, no `style={{`, no `data-testid`; the `gallery-strip`
   row and the no-src square consume the token; the other sections size from a column-count layout or an existing
   owning role.
5. Run the two blocks below and retain every output as `R17R4_*` under `docs/sessions/evidence/task813/`, each
   transcript carrying platform, Node version, cwd, exact command and exit code **in the same file** (§10.5).

**Block A — after step 1, before steps 3–4 (the negative arm):**

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ev = "docs\sessions\evidence\task813"
node.exe -p process.platform
node.exe --version
Get-Location
git --no-optional-locks status --short
npm.cmd run build-storybook
node.exe scripts\task813-appimage-thumb-probe.mjs --out "$ev\R17R4_02_probe-negative-arm.json"
```

Expected: `win32`; the probe **exits 1**, naming the 44 px and cross-width failures for the Revision 3 cells.

**Block B — after step 4 (the final gate block):**

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$story = "src\stories\mantine\primitives\AppImage.stories.tsx"
$theme = "src\design-system\mantine\theme.ts"
$ev = "docs\sessions\evidence\task813"
node.exe -p process.platform
node.exe --version
Get-Location
Select-String -Path $theme -Pattern 'galleryThumb'
Select-String -Path $story -Pattern '\b(w|h|maw|mah|miw|mih|width|height|maxWidth|maxHeight|minWidth|minHeight)\s*[=:]\s*\{?\s*["''`]?\s*-?\d', '\d+(\.\d+)?\s*(px|rem|em|vw|vh|vmin|vmax)\b', '\d%', 'style=\{\{', 'className=.*\[', 'data-testid'
Select-String -Path "src\design-system\mantine\__tests__\*" -Pattern 'boxSize'
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build-storybook
node.exe scripts\task813-appimage-thumb-probe.mjs --out "$ev\R17R4_06_ac24-thumb-measurements.json"
npm.cmd run check:stories
npm.cmd run check:story-coverage
npm.cmd run check:design-tokens:strict
npm.cmd run check:tailwind-runtime-tokens
npm.cmd run check:homepage-theme-runtime-deps
npm.cmd run check:homepage-theme-runtime-deps:verify-gate
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
npm.cmd run build
git hash-object $story $theme scripts\task813-appimage-thumb-probe.mjs
git --no-optional-locks status --short
```

Expected: `galleryThumb` matched on exactly two lines of `theme.ts` (union key, `'2.75rem'` value); the Story search
prints **nothing**; the `__tests__` search either prints nothing or names a test that is then run with the
repository's existing test script and reported; typecheck 0; lint 0; the probe **exit 0** with every thumbnail
44 ± 1 px at 320/390/480/1440, cross-width delta ≤ 1 px and no page overflow; `check:stories` 0 violations;
`check:story-coverage` exit 0 at 67/67; `check:design-tokens:strict` with the **same 56-violation set** as `R16_03`
and `check:tailwind-runtime-tokens` with the same single row as `R16_04` (a new finding is this task's regression);
both homepage-theme gates exit 0; both hygiene gates clean; `build` **exit 0**; one `git hash-object` line per
changed file, captured in this same pass. Return every transcript path.

**Completion report for Revision 4:** the probe diff and the negative-arm transcript · the two `theme.ts` definition
lines · the empty Story search · the new Story hunk · the per-width measurement table with the cross-width delta ·
every exit code above · the hash-object lines · the session log's R17 section rewritten to Revision 4, with
`R17_04_*` marked superseded and the §5.5 decision quoted · the `Files Changed` table updated for `theme.ts`.
Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` or `BLOCKED — CANONICAL STYLE DECISION REQUIRED`. The owner then
re-reviews AC11 against the Revision 4 Story at AC24's four widths.

## 14. Completion report contract

Files changed · requirement IDs completed · §13.1's baseline including the full importer census and the before-half
route table · AC1's reconciliation against §3.3's 25 / 2 · AC2's `git status` for both paths · AC3's full rename diff ·
AC4's and AC9's zero-hit searches · AC5's two per-surface censuses · AC6's manifest counts · AC7's title, import and
coverage totals · AC8's two scope blocks with every baseline entry added and removed · AC10's two route tables ·
AC11's six `OWNER VISUAL QA REQUIRED` tuples · AC12's empty diffs and the `TIER2_PREFIX` byte-identity check ·
AC13's quoted rows · AC14's output · AC15's probe and its single witness · AC16's workflow hunk · AC17's empty
allowlist diff · AC18's three retarget hunks · AC19's two zero-exit transcripts · AC20's corrected census sentences ·
AC21's four isolated transcripts and the isolation command · AC22's set comparison and explicit verdict · every command with its real exit code and transcript path · the `git hash-object` of every
changed file · assumptions · deviations · limitations · unresolved issues.

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED — OWNER DECISION REQUIRED`.
Do not self-approve; Sonnet runs, emits and suggests no mutating git command.

## 15. Task quality gate

| Question | Required answer |
|---|---|
| Is the tier-2 finding fixed or hidden? | **Fixed at the path.** `TIER2_PREFIX` is a literal prefix in both gates (§3.1); moving the file out clears all 27 blocks/edges at once. R10 forbids touching the classifier; R4 forbids a shim. |
| Is `AppImage` being rewritten? | **No.** §3.2 measured why: it is the project's canonical `<img>` render site with a documented `next/image` ban, Cloudinary srcset, LQIP, React 19 `preload`, `imageGuard` and LCP handling, and Mantine has no equivalent. R3 makes any behavioural edit a defect. |
| How much does Task 820 depend on? | **Only the `AppImage` half** — §5.1 half B is exactly that question, and the answer changes when 820 unblocks. |
| Is the blocking hop one or two? | **One.** Both patterns reach `AppImage` through `LightboxView.tsx` (§3.3), which is also the single tier-1 edge Task 820 baselined. |
| Are the figures in §3 safe to copy? | **No** — R1/AC1 re-derives them, and §3.5 states what was never measured at all. |
| Is the destination an executor choice? | **No** — decision §5.1 (C) fixes it at `src/design-system/media/` and refuses the Mantine-pattern directory by name. |
| Does the new directory ship ungoverned? | **No** — R12 lands its parity check in this same task, blocking in CI with a planted-failure proof, reading the directory at runtime. That was the one cost of choosing a new namespace, and the decision closed it here rather than deferring it. |
| Is the `check-homepage-theme-runtime-deps.mjs` edit a R10 violation? | **No** — it is not one of R10's six, and the 2026-09-11 owner decision (§5.3) puts the retarget in scope. What was missing was proof: R14/AC19 requires the gate and its self-test to exit 0. |
| Are the two red gates pre-existing? | **Unproven, and that is the point.** This diff edits `scripts/design-tokens-allowlist.json`, an input the first gate reads. R16/AC21 decides it from an isolated `HEAD` snapshot, never `git stash`; AC22 binds both outcomes in advance so the answer cannot be chosen after seeing it. |
| Is the stretched gallery this task's fault? | **Only half of it.** Its own new `AppImage.stories.tsx` is (R17) — hardcoded 80×56 boxes in a 4-column grid with a 360px cap. `MantineListingGalleryPattern.tsx` is not: it appears in neither 813's nor 820's diff, and is Task **824**. |
| Why did Revision 3's R17 not close? | **Its own evidence failed AC24** (66→329.5 px across widths; the probe checked per-row uniformity) and the rem props were the old px values in another unit — the Revision 3 AC23 search could not see them. Revision 4 widens the search, fixes the size by owner decision §5.5 (44 × 44 px token), and requires the probe to fail on the old Story before it may pass on the new one. |
| Does this task touch the allowlist? | **No** — R13/AC17, and the 2026-09-11 owner amendment in §5.1 makes the residual `owner: "813"` values a documented transitional snapshot. The field transfer is Task 821's first tracked-file change, after it verifies Task 820's commit. No further work on those two components is authorized under this task. |
