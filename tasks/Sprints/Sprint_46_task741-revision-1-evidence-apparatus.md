# Task 741 — REVISION 1 (narrow): evidence apparatus only

**Verdict on review 1 (Opus, 2026-08-14): `NEEDS REVISION`.**

**Scope of this revision: the evidence apparatus ONLY.** The migration itself is correct and was
independently re-derived by the reviewer — see §0. Do **not** re-do it. Do **not** touch
`.storybook/preview.tsx`. Do **not** build a general Storybook-channel detector (that is a separate
future task, §6).

Executor: same session/role as the implementation round (`.claude/skills/execute-task/SKILL.md`).

---

## 0. Already independently verified by the reviewer — do NOT re-litigate

These were re-derived from the tree, not read off the implementation report. Spend no budget on them.

| Claim | How it was confirmed |
|---|---|
| Module CSS reproduces the retired utilities' compiled shape verbatim | Live sibling rules `.bg-status-info\/10` / `.border-status-info\/20` in `.next/static/css/1321d82f6c973f30.css` have exactly the two-tier shape the module reproduces |
| `var(--status-info)` (not `var(--color-status-info)`) is correct | Tailwind itself inlines the `globals.css:80` alias; the compiled bundle emits the raw token |
| Source census = 0 | Independent `grep -P` over `src/**`; surviving `/10 /15 /20 /30` hits are the documented out-of-scope consumers |
| Compiled census = 0 | `status-*\/80` absent from all 8 bundles in `.next/static/css/` |
| CSS Modules + `@layer` + `@supports` compile correctly | `b309f7c20a50f5b3.css` carries both tiers with hashed class names |
| No cascade contention | `.overlayLabel` (unlayered) sets neither `background-color` nor `border-color` |
| Rendered colours match | `oklab(0.577 -0.087 -0.150688 / 0.8)` identical in both phases; `_overlayLabel_opn5p_348` is the same element |
| Gates green, build 619 kB, backlog 80 lines, `card_overlay_sold` present in 4 locales, `cn()` intact | Transcripts + direct tree checks |
| The smoke-test plant is real and correct | `cn(styles.overlayLabel)` source plant, genuine failing transcript |

---

## 0a. Finding-id map — this brief vs. the ledger

Finding ids here are the ids in
`docs/reviews/2026-08-14-task741-closedoverlaystyle-module-exit.review-ledger.json`. Use those ids in
the revision session log so the two documents never drift.

| Id | Ledger requirement | Section here |
|---|---|---|
| F1 | `AC2 / R2` | §2.3 — comparator plant is synthetic |
| F2 | `AC6 / R6` | §1 — `play()` not gate-observable |
| F3 | `AC7 / R7` | §4 — rendered geometry of the extended story unmeasured |
| F4 | `AC9 / R9` | §4 — "96-cell" overstates the assertion count |
| F5 | `AC9 / R9` | §2.2 — BEFORE witness absent from its declared path |
| F6 | `AC2 / R2` | §2.4 — `@supports`-off arm never rendered |
| F7 | `AC2 / R2` | §2.1 — BEFORE and AFTER are different stories |
| F8 | *(no ledger row)* | §3 — comparator server serves 200 for missing assets |

**F8 carries no ledger finding on purpose.** It is a latent hazard in the evidence apparatus rather
than an uncovered scope tuple of any acceptance criterion, so it has no requirement row to attach to.
It is still required work: §3 is an exit criterion, not a suggestion.

> **⚠️ HISTORICAL — Review 1 state, superseded 2026-08-15. Do not quote as current.**
> Canonical statement while this brief was live:
> **`review.coverage`: 12 total, 8 `VERIFIED`, 4 `UNVERIFIED`, 7 open P2 findings (F1–F7). F8 is a
> required evidence-apparatus hardening outside a ledger row.** `handoff.commitPush: PROHIBITED`.
> Recorded in `docs/reviews/2026-08-14-task741-closedoverlaystyle-module-exit.review-ledger.SUPERSEDED.json`,
> which validated `valid fail-closed review ledger`, exit 0 (Windows run, 2026-08-14).

**Review 2 evidence-only result (historical) —
`docs/reviews/2026-08-15-task741-revision1-evidence-apparatus.review-ledger.json`:**
**`review.coverage`: 12 total, 12 `VERIFIED`, 0 `UNVERIFIED`, 0 open P0/P1/P2. F1–F7 `RESOLVED`;
3 P3 notes open (`N1`–`N3`), none blocking. `decision: APPROVED WITH NOTES`,
`handoff.commitPush: ALLOWED`.** It supersedes Review 1 for the **Revision 1 evidence apparatus only**.

**Current lifecycle state (2026-08-16): `APPROVED WITH NOTES`.** PR #8 is integrated into `main` as
`95215314e`; PR #6 is closed, and PR #7's head was already contained in PR #8. The Review 2 ledger remains
historical evidence-apparatus approval; the post-merge review is the final task verdict. C3 in
`check:css-vars -- --verify-gate` is corrected to the real 256 after Task 749, with its self-check 8/8;
the fresh-build css-var gate is clean, typecheck passes and full Vitest is 80 files / 1355 tests. Do not merge
or cherry-pick the superseded PRs.

## 1. F2 — make `play()` genuinely gate-observable (story-local)

### 1.1 Why the shipped claim is false

`storybook/test` ships a **project-level** preview annotation that sets the parameter off:

```
node_modules/storybook/dist/preview/runtime.js:30945-30949
  preview_default3 = () => ({
    parameters: { throwPlayFunctionExceptions: !1 },
    runStep: step
  });
```

So at `runtime.js:34061` the guard `this.story.parameters.throwPlayFunctionExceptions !== !1`
evaluates **false**, the `throw error` branch is skipped, and the catch falls through to
`console.error(error)`. A bare `AssertionError: expected null not to be null` matches **none** of the
four patterns the collector filters on (`check-stories-rendered.mjs:875-882`:
`invariant expected app router` / `The above error occurred in the` / `Error rendering story` /
`Uncaught [Error:`). No `pageerror` fires either, because the error was caught. The gate is blind.

The implementation report's empirical observation ("surfaces as a `console.error`, not a raw
`pageerror`") was **correct**. Only the conclusion drawn from it — that the collector "treats any
console error as a render failure" — was wrong.

### 1.2 Fix

Add to the `Default` export of `src/stories/patterns/mantine/ListingCardPattern.stories.tsx`:

```ts
parameters: { throwPlayFunctionExceptions: true },
```

**Verified precedence:** `prepareStory` merges
`combineParameters(projectAnnotations.parameters, componentAnnotations.parameters, storyAnnotations?.parameters)`
— story annotations are last and win for scalar values. A story-local `true` therefore overrides the
addon's project-level `false` without changing any other story's behaviour. This is why the fix is
story-local and `.storybook/preview.tsx` must not be touched.

Consequence chain, end to end: play throws -> `runtime.js:34061` rethrows -> uncaught by the app
layer -> `showException` -> `renderException` -> `logger.error("Error rendering story '<id>':")` ->
matches `/Error rendering story/i` at `check-stories-rendered.mjs:879` -> `consoleErrors` non-empty
-> `renderFailed` true at `:991` -> non-zero exit.

**Adjacent hazard to state accurately, not paper over:** `waitForStoryReady:574` returns
`{ ready: true }` when `document.body.classList.contains('sb-show-errordisplay')`, so the DOM-readiness
layer alone treats an errored story as ready. The console-error collector is what actually catches it.
Say exactly this in the comment; do not claim the DOM layer catches it.

### 1.3 Required proof — through the real gate, not a probe

1. Plant at source: `MantineListingCardPattern.tsx:320`,
   `cn(styles.overlayLabel, overlay.className)` -> `cn(styles.overlayLabel)`.
2. `npm run build-storybook`
3. `npm run screenshots:assert`
   **Expected:** non-zero exit; the `patterns-mantine-listingcardpattern--default` cell reported with
   `failReason: 'console-error'` and `failDetail` containing
   `Error rendering story 'patterns-mantine-listingcardpattern--default'`.
4. Revert the plant, `npm run build-storybook`, `npm run screenshots:assert` -> exit 0.
5. Retain both transcripts under `docs/reviews/artifacts/2026-08-14-task741/`.

An ad-hoc Playwright probe does **not** satisfy this step. The whole defect is that the gate was never
the thing measured.

### 1.4 Comment rewrite

Replace the gate-observability paragraph in the `play()` body. It must say, in substance: this story
sets `throwPlayFunctionExceptions: true` locally, which makes a failed `expect()` rethrow; Storybook's
`renderException` then logs `Error rendering story '<id>':`, which is one of the four patterns
`check-stories-rendered.mjs`'s `consoleErrors` collector matches, so the gate fails. Do not write "any
console error". Do not write "the play-function runner console.errors it" — that is the branch this
story deliberately turns off.

---

## 2. F1 + F5 + F6 + F7 — rebuild the comparator

### 2.1 One story for both phases (closes F7)

Both phases use `mantine-primitives-listingcard--default`. BEFORE gets the sold/rented cards from the
now-permanent `ListingCard.stories.tsx` extension, with the pre-migration `ListingCard.tsx` /
`ListingCard.module.css`.

BEFORE build recipe, in this exact order:

**Do not redirect `git show HEAD:<path>` over a working file.** The Task 741 changes are
uncommitted, so that clobbers them irrecoverably, and under PowerShell `>` writes UTF-16LE with a
BOM, which would corrupt the file even on a clean tree and trip `check:file-integrity`. Use one of
the two non-destructive routes below.

**Route A (preferred) — a separate temporary worktree.** Nothing in the live tree is touched:

1. `git hash-object` the two files and record the values.
2. `git worktree add ../lero-al-741-before HEAD` — a clean checkout of the base revision.
3. Copy **only** the permanent `ListingCard.stories.tsx` extension into that worktree (it is the one
   change BEFORE must carry); leave `ListingCard.tsx` and `ListingCard.module.css` at `HEAD` there.
4. `npm ci && npm run build-storybook` inside the worktree.
5. Move the output to the witness path (§2.2), then `git worktree remove ../lero-al-741-before`.
6. Re-record `git hash-object` for the two live files; they must be unchanged, since the live tree
   was never written to.

**Route B — path-scoped stash, only if a second worktree is impractical.** Higher risk; every step
is mandatory:

1. Record `git hash-object` for `src/modules/listings/components/ListingCard.tsx` and
   `ListingCard.module.css`, and paste both into the session log **before** stashing.
2. `git stash push -- src/modules/listings/components/ListingCard.tsx src/modules/listings/components/ListingCard.module.css`
   (path-scoped; never bare `git stash`, which would also take the story and test changes).
3. `npm run build-storybook`; move the output to the witness path.
4. `git stash pop`, resolving nothing — a conflict here means stop and reconstruct from the stash
   entry rather than continuing.
5. Re-record `git hash-object` for both files and assert equality with step 1. Paste the post-restore
   hashes into the session log next to the pre-stash ones; an unproven restore is an unproven BEFORE.

### 2.2 Witness retention (closes F5) — read this before choosing a path

The plan's premise is correct: `docs/` **is** excluded from the Tailwind content scan
(`src/app/globals.css:11`, `@source not "../../docs"`), so a witness under `docs/` cannot resurrect
retired utilities the way `storybook-static-before/` at the repo root did.

But measure the cost before committing: the current `storybook-static/` is **14 MB across 371 files**.
Committing that whole tree adds 371 files to every `check:file-integrity` run (which walks
changed + untracked files running NUL/BOM/JSON/`node --check`) and 14 MB to git history, for one task's
evidence.

**Default: commit the full `storybook-static` build** to
`docs/reviews/artifacts/2026-08-14-task741/before-storybook-static/`. 14 MB across 371 files is an
acceptable price for a reproducible Q4 proof, and the earlier concern about `check:file-integrity`
was overstated: that gate walks **changed and untracked** files, so once the witness is committed it
is not re-walked on subsequent runs.

A minimal witness is permitted **only** if it is derived mechanically rather than by hand:
the comparator must record a manifest of every request the story actually issues (URL, status, byte
length, SHA-256), the minimal set must be produced from that manifest, and the comparator must verify
each asset's hash against it on every run. A hand-picked file list is not acceptable — silently
dropping an asset reproduces exactly the partial-render failure §3 exists to close.

Either way, the comparator must **fail closed on a missing or empty witness**: extend `requireBuild`
to also assert the referenced CSS bundle exists and is non-empty, with a message naming the exact path
and the rebuild recipe. The current script header calls the witness "retained here as the durable
witness" while defaulting to a path outside the repo that does not exist — that sentence must go.

### 2.3 Real plant A — `color-mix` tier (closes F1)

Delete the in-memory `--plant` mutation at `two-phase-comparator.mjs:176-179` entirely. It corrupts an
already-captured value and proves only that `b === a` and the exit code work.

Replacement: perturb the **source**, rebuild, re-run.

- Edit `.closedOverlaySold`'s `color-mix(in oklab, var(--status-info) 80%, transparent)` -> `60%`.
- `npm run build-storybook` (AFTER phase only).
- Run the comparator.
- **Expected: exactly 16 MOVED cells**, all `*|sold|backgroundColor` (4 viewports x 4 locales).
  `rented` is untouched and both `borderColor` sets are untouched, so `failCount` must be 16 — not 1,
  not 32. A different number means the comparator is measuring something other than what it claims.
- Revert, rebuild, clean re-run. Retain both JSONs and both console transcripts.

### 2.4 `--supports-off` mode + real plant B (closes F6)

Chromium cannot be made to lack `color-mix`, so "actually disabling `@supports`" has to be
implemented, not assumed:

- Intercept the CSS responses with `page.route()` and strip every
  `@supports (color:color-mix(in lab,red,red)){ ... }` block (balanced-brace removal) from the served
  text, in **both** phases identically.
- **Assert the strip happened**: count removed blocks and fail closed if the count is 0. Without this
  assertion the mode silently degrades into a duplicate of the normal run and reports a meaningless
  pass — the same class of defect as the synthetic plant.
- Expected clean result: base-tier colours, fully opaque, identical BEFORE vs AFTER, `failCount` 0.

Plant B, to prove the mode can fail: base tier `.closedOverlaySold { background-color: var(--status-info) }`
-> `var(--status-rented)`, rebuild, run `--supports-off`. **Expected: 16 MOVED `sold|backgroundColor`.**
Revert, rebuild, clean re-run.

Only after this may R2's `@supports`-off arm be marked as rendered proof. Until then it is
"verified by source comparison".

---

## 3. F8 — comparator server must fail closed

`two-phase-comparator.mjs:113-118` currently serves `index.html` with HTTP 200 for **any**
unresolvable path. A missing CSS or JS asset therefore yields a partially-styled render that the
colour comparison would happily pass — the exact failure mode backlog row 745 describes.

- Return a real 404 for non-navigation requests; keep the `index.html` fallback only for navigations.
- Attach `page.on('requestfailed')` and `page.on('response')`; collect any failed request or non-2xx
  response from the witness origin and treat it as a hard cell error, not a warning.
- Prove it: temporarily remove one CSS asset from the AFTER witness and confirm the comparator exits 1
  with an asset error — **not** with a passing colour comparison. Restore, re-run clean.

---

## 4. F3 / F4 — bookkeeping, after §1-§3 land

- **F3.** Run `npm run screenshots:assert` clean and retain the transcript. `Mantine/Primitives/ListingCard`
  `Default` is enrolled by prefix (`scripts/lib/mantine-story-scope.mjs:16`), and the permanent
  extension tripled its grid card count, changing rendered geometry at all four MANTINE_VIEWPORTS.
  That geometry has never been measured. `check:stories` is a static lint and does not measure it.
  The §1.3 run satisfies this at the same time.
- **F4.** `comparator-result.json` contains 64 `OK` + 32 `INFO`. The `className` rows are recorded and
  never compared (`two-phase-comparator.mjs:205-210`). Replace "96-cell" / "96/96 cells" with
  **"64 property comparisons + 32 className observations (96 recorded rows)"** in all three places that
  currently disagree with each other:
  - session log §7 and the R2 row,
  - `two-phase-comparator.mjs`'s header, which says "128 comparison points across 32 rendered cells per
    phase" — a third, different number,
  - the Task 741 row in `docs/backlog.md`.
- Session log §6: replace the false collector claim per §1.4. §2 negative-flow table: upgrade the
  `@supports`-off row once §2.4 lands.
- `docs/backlog.md` stays at **80 lines**.

---

## 5. Exit criteria for this revision

1. `screenshots:assert` shown red under the §1.3 source plant and green clean, both transcripts retained.
2. Comparator plant A: 16 property failures, from a source edit, not an in-memory mutation.
3. `--supports-off` mode implemented with a strip-happened assertion, plus plant B at 16 failures.
4. Comparator fails closed on a missing asset, demonstrated.
5. BEFORE witness retained in-repo (untracked, lands with this task's commit) at `docs/reviews/artifacts/2026-08-14-task741/before-storybook-static/`
   (or a manifest-derived, hash-verified subset), with a fail-closed existence precondition in the script.
6. Every count and claim in the session log, the script header, and the backlog row agrees with the
   retained JSON.
7. Standing gates re-run green; backlog still 80 lines.

## 6. Explicitly out of scope

- The migration itself (`CLOSED_OVERLAY_STYLE`, the two module rules, the JSDoc rewrite, the smoke
  test). Verified correct; leave alone.
- `.storybook/preview.tsx` — no global parameter change.
- A general `PLAY_FUNCTION_THREW_EXCEPTION` / `STORY_RENDER_PHASE_CHANGED` channel detector in
  `check-stories-rendered.mjs`. Worth doing — the gate reads neither the Storybook channel nor the
  render phase — but file it as a new backlog number alongside 745 and 747 (same family: a check that
  admits an invalid state silently). Measured blast radius today: 7 stories carry `play()`, and Task
  741's is the **only** one carrying `expect()` assertions, so nothing currently shipped is silently
  passing. Not required to close 741.
