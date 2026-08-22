# Task 763 — Revision 1: semantic class names, and nothing else

**Filed:** 2026-08-21 by the orchestrator, after reviewing the `PARTIALLY IMPLEMENTED` submission.
**Review verdict on that submission: `NEEDS REVISION`.**

An earlier version of this review, issued in chat, carried four findings (F-2, F-3, F-4, F-6/F-7) that the owner
challenged with exact line citations. Every challenge was re-measured against the repository and **every one of
them was upheld**; those findings are withdrawn below with the evidence that killed them. The reviewer's own
`NEEDS VERIFICATION` labels were the direct consequence of reviewing while the file bridge was down, and are not
a standard a resubmission has to satisfy. One finding survives.

No review ledger accompanies this verdict. `docs/reviews/*.review-ledger.json` is the approval instrument
(`docs/agent-contract.md` §9a) and every existing ledger is `APPROVED` / `APPROVED WITH NOTES`; a rejection is
recorded here and in `docs/backlog.md`, the same way Task 762 Revision 1 was.

This brief supersedes exactly §10.3.2 of
`tasks/Sprints/Sprint_63_kickoff_prompt_Task_763_AppImage_De_Tailwind.md` and changes nothing else.

**Mode and task type:** `IMPLEMENTATION` — UI / design-system migration (D28), naming only. **Sprint:** 63.
**QA profile:** `Q3` (unchanged). **Base:** worktree on top of `e2dc52f16`.

---

## 1. Accepted as implemented — do not re-work, do not re-touch, do not re-verify

Verified by the reviewer against the real diff and the built CSS, not from the completion report:

- **`AppImage.tsx`'s 4 inline strings.** Replaced; the two `cn()` calls keep `imageClass` and `hoverClass` in
  their original argument positions; lines 63-141 (LQIP, `preload`, `notifyPriorityPreload`,
  `usePredictivePreload`, `fetchPriority`, `srcset`/`sizes`) are untouched and hook call order is unchanged.
- **All 9 variants' `containerClass` / `imageClass`, and `gallery-main` / `gallery-side` `hoverClass`.**
- **Every one of the 16 `styles.*` keys the two source files read is defined in the module.** Checked by name.
  No silently-dropped class.
- **`@layer utilities` wrapper and the D34 disposition**, stated in the file header in the
  `HeroSearchView.module.css` shape.
- **The A1 resolution.** `bg-muted` compiles to `background-color:var(--muted)`; `--muted` is `:root`-declared
  (`globals.css:371`). The module writes `var(--muted)`, not the `@theme inline` twin `--color-muted`. This was
  the single most likely silent failure in the whole task and it was avoided.
- **The A3 flattening.** The three `--tw-gradient-from/via/to` names are dropped from the `transition-property`
  list and the remaining 20 properties are preserved in order — including `transform`/`translate`/`scale`/
  `rotate`/`filter`, which a narrowing to `opacity` would have broken for a non-priority image carrying both
  `.fade` and a hover class. Reasoned, measured, documented. Accepted as delivered.
- **The `hoverBrightness` mechanism for the two gallery variants.** Independently re-verified:
  `ListingGallery.tsx:94` and `:105` both wrap a single `<AppImage>` with no sibling content, so narrowing the
  trigger from the external `.group` div to AppImage's own container changes no observable hover area.
- **The `listing` `BLOCKED` route.** See §3. Correct, and correctly stopped.

**Re-running verification for any of the above is not required.** Re-run only what §5 names.

## 2. Four findings withdrawn — the evidence that killed each

Recorded in full because the reviewer's error mode matters more than the errors: all four came from treating an
absent measurement as a doubt, while a retained artifact already carried the measurement.

| Finding | Why it was raised | Why it is withdrawn |
|---|---|---|
| **F-2** — `@media (hover:hover)` provenance `UNVERIFIED` | A flat `grep -o` over minified CSS returned the rule body with no visible media context | Re-run as a brace-depth walk backwards from the selector: `.group-hover\:scale-105` is enclosed by `["@media (hover:hover)","@layer utilities"]` in `.next/static/css/6fa64bb43d7d13c4.css` and `["@media(hover:hover)","@layer utilities"]` in `storybook-static/assets/iframe-ByNNtsru.css`. **I1 §2 was right and the module's guard is correct.** A `grep -o` on a single-line minified file cannot show an enclosing at-rule — the reviewer knew that and raised the finding anyway |
| **F-3** — `check:design-tokens` red, treated as a possible regression the executor caused | The baseline at `201683f9d` had not been read | `node scripts/check-design-tokens.mjs --strict` over 453 files reports **exactly 2 findings, both in `AppImage.module.css`** (`:116` `border-radius: 3.40282e38px`, `:150` `transition-duration: 300ms`) and zero elsewhere. The file did not exist at `201683f9d` and no scanner or allowlist changed, so the baseline was green. Both literals are the ones kickoff A2 and I1 §6 anticipated, and the kickoff **instructs** reporting a `CONFLICT` rather than adding a marker. **The executor followed the contract exactly.** Reclassified as an open owner decision, D63-F — not a finding |
| **F-4** — the class-assertion test could pass vacuously with `styles = {}` | The test had not been opened | `appimage-config-class-assertions.test.ts:73-78` asserts, for each of the 16 keys, `expect(val).toBeTruthy()` **and** `expect(val).not.toBe(key)`. A stubbed `{}` makes `val` `undefined` and fails the first assertion. Transcript: 9 passed, exit 0. **The test cannot go vacuously green** — it carries exactly the guard the finding demanded |
| **F-6 / F-7** — `var(--space-0)` as new Class-3 debt; `300ms` vs the extracted `.3s` | Both read as deviations from the artifacts | `var(--space-0)` **is** in the module header's R8 Class-3 inventory, which is precisely what rule 4 requires; recording it again as a finding punishes compliance. I1 §6 sets `300ms` as the **normative disposition** with `--duration-slow: 300ms === .3s` shown; row 15's `.3s` is the extraction, not a preservation requirement. Neither is a deviation |

## 3. The `listing` hover route is correctly `BLOCKED` — this revision does not touch it

Confirmed independently:

- `MantineListingCardPattern.module.css:67-68` carries its own unlayered
  `.card:hover .imageSection img { transform: scale(1.05) }` inside `@media (hover: hover) and (pointer: fine)`.
- The compiled `group-hover:scale-105` sets `scale: var(--tw-scale-x) var(--tw-scale-y)` = `105% 105%` — the
  **standalone `scale` property**, not `transform`. Individual transform properties apply before `transform`, so
  the two compose: **1.05 × 1.05 = 1.1025**, fired from anywhere on the card.
- Rooting the trigger on AppImage's own container would narrow that to the image area and drop it to 1.05× — the
  exact condition kickoff §10.3.5 says to stop on.

The executor stopped where the kickoff told it to stop, named the consumer, and measured rather than assumed.
**That is the correct handling and it is not a defect.**

**The defect is the kickoff's, not the executor's.** §7's write set never included
`MantineListingCardPattern.module.css`, so no legal path to the correct fix existed inside Task 763. Resolving it
requires a scope the task does not have — filed as **D63-E**, to be executed in Sprint 63 Phase 2, not here.

## 4. The one surviving finding

### F-1 · `P1 HIGH` · [§10.3.2] · `src/components/ui/AppImage.module.css:70-137`

Kickoff §10.3.2, verbatim: *"Class names are semantic, not utility-shaped: `.container`, `.image`,
`.containerListing`, `.containerAvatar`, `.fitCover`, `.fitContain`, `.hoverScale`, `.hoverBrightness`, `.fade`,
`.visible`, `.hidden` or equivalent. **A class named `.relative` or `.objectCover` re-creates the problem in a new
file and is a rejection.**"*

Delivered: `.relative`, `.widthFull`, `.fillParent`, `.overflowHidden`, `.bgMuted`, `.aspect4x3`, `.aspect16x9`,
`.aspectSquare`, `.roundedFull`, `.absoluteFill`. `.relative` is the exact name the clause quotes.

Why this is P1 and not a style preference:

1. **It reproduces Tailwind's model in a private file.** One declaration per class, named after the CSS property,
   assembled at the call site. The migration moved where the utilities live without changing what they are, so the
   next phase inherits the pattern and the config still reads as a utility chain.
2. **It produced a load-bearing selector keyed on a positioning class.** `.relative:hover .hoverBrightness`
   (`:166`) makes the hover effect conditional on a class whose stated meaning is `position: relative`. Any future
   element that takes `.relative` for positioning silently becomes a hover trigger. The correct selector is rooted
   in the container's *role*, and the role is what the class must be named for.
3. **It manufactures distinctions that only exist because Tailwind had them.** `.widthFull` vs `.fillParent`
   exists because Tailwind shipped `w-full` and `h-full` separately, not because AppImage has two concepts.

Six classes are already correct and stay: `.fitCover`, `.fitContain`, `.fade`, `.visible`, `.hidden`,
`.hoverBrightness`.

**Not in scope of this finding.** Composing several classes per field is explicitly permitted by kickoff §10.3.3
(*"Where a variant needs two classes, compose them in the config"*). The earlier review's demand for "exactly one
class per container" was the reviewer's design preference, not a contract term, and is withdrawn. **Rename; keep
whatever composition shape you already have if you prefer it.**

## 5. Required work — this is the whole revision

1. Rename the ten utility-shaped classes in `AppImage.module.css` to role names. Suggested, not mandated:
   `.frame` (was `.relative`), `.frameRatio4x3` / `.frameRatio16x9` / `.frameRatioSquare`, `.frameWidth` (was
   `.widthFull`), `.frameFill` (was `.fillParent`), `.frameClip` (was `.overflowHidden`), `.framePlaceholder`
   (was `.bgMuted`), `.frameCircle` (was `.roundedFull`), `.imageLayer` (was `.absoluteFill`). Any equally
   role-shaped set is acceptable.
2. Update the references in `appImageConfig.ts` and `AppImage.tsx`.
3. Re-root `:166`'s hover selector on the renamed container class.
4. Update the 16-key list in `appimage-config-class-assertions.test.ts` to the new names.
5. Update every in-file comment and header line that names an old class.

**No declaration may change.** No value, no property, no selector structure beyond the class token itself, no
media query, no layer.

## 6. Verification required for the resubmission — and only this

| Check | Expected | Why this and nothing more |
|---|---|---|
| `node scripts/evidence/task763/compare-i2-i4.mjs` (or the retained I4 comparator as invoked in the session log) against the **retained I2 baseline** | **Zero deltas across all compared cells.** A rename cannot move a pixel; any non-zero delta means a declaration moved with the name | This is the whole safety argument for a rename-only change |
| `npx vitest run docs/sessions/evidence/task763/appimage-config-class-assertions.test.ts` | 9 passed | Guards the renamed keys |
| `npm run typecheck` | exit 0 | |
| `npm run test:listings` | exit 0 | |
| `npm run check:tailwind-runtime-tokens` | 24 scanned / 14 / 14 / 0 new debt / 0 stale | The module's token set is unchanged by a rename; a delta here means something else moved |
| `npm run build` | **exit 0, transcript retained** | Standing non-Q0 gate |
| `npm run check:design-tokens -- --strict` | exit 1 with **exactly the same 2 findings**, at their new line numbers | Records that D63-F is still open and that this revision neither fixed nor worsened it. **Do not add a marker or an allowlist entry** |
| `git status --porcelain` | `AppImage.module.css`, `AppImage.tsx`, `appImageConfig.ts`, the test file, `docs/backlog.md`, the session log, evidence dir — nothing else | |

**Not required:** re-running I1, re-capturing I2, re-running the I5 plants, re-measuring the hover composition,
or re-verifying anything in §1. The plants proved the comparator can fail; a rename does not invalidate that
proof.

## 7. Status contract

`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` on completion of §5 with §6's evidence. The `listing` hover route
stays `BLOCKED` and moves to Phase 2 under D63-E — a resubmission is **not** expected to close R7 for `listing`,
and must not attempt to.
