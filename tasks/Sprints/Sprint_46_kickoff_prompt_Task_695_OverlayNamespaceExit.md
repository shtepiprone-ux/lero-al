# Task 695 — Retire the `--color-overlay*` namespace and the `@theme inline` overlay copy

**Sprint 46.5. Q4 — Release/Critical Flow** (it edits `LightboxView.tsx`, named in
`docs/critical-flow-registry.md:105`).

**This kickoff replaces the reserved rows in `docs/backlog.md` and the Sprint 46 plan.** Both of
those describe the trigger as *"once the last of the 33 overlay utilities across 7 files is gone"*
with a per-file split that was never accurate. Measured trajectory: 30 live → 691 cleared its 6 →
24 → **748 cleared the rest, and the census is 0 as of `39f02ba9f`**. The trigger has fired. What
remains is not what those rows describe, and §3 below is the real inventory.

---

## 1. Mode and task type

Mixed surface, three kinds of edit in one dependency chain:

| Surface | Kind |
|---|---|
| `LightboxView.tsx` (6 sites + 1 comment block), `MantineListingGalleryPattern.tsx` (1 site) | **rendered** — needs before/after proof |
| `src/app/globals.css` `@theme inline` overlay block + both comment records | **build-output** — needs compiled-CSS proof |
| `scripts/__tests__/overlay-dual-declaration.test.ts`, `scripts/check-css-var-resolvability.mjs` | **gate** — needs a proven-can-fail rewrite |

## 2. Objective

Delete the `--color-overlay*` namespace and the `@theme inline` overlay copy, leaving the `:root`
pair as the single source. Close **D19**, whose recorded expiry is *"695 alone"*.

Nothing about the rendered result may change. This is D28: mechanism only.

## 3. Verified context

Measured 2026-08-13 against `HEAD` = `39f02ba9fa31d63d470906f41f1bf0560b44f689`, clean worktree.
**Re-derive every count at I0 (§10.1). If the tree disagrees, the tree wins.**

### 3.1 The census is already 0

```
node -e "<the §13 one-liner>"   →  TOTAL 0
```

Task 748 landed all 24 remaining utilities as CSS modules (`APPROVED WITH NOTES`, ledger
`docs/reviews/2026-08-13-task748-rework2-evidence-apparatus.review-ledger.json`). **You are not
migrating utilities. Do not re-open that work.**

### 3.2 Seven live `var(--color-overlay*)` references — the real remaining consumers

`--color-overlay*` is declared **only** in the `@theme inline` block this task deletes
(`globals.css:84-85`); `:root:470-471` carries `--overlay`/`--overlay-foreground` alone. So
deleting the block orphans all seven:

| Site | Reference |
|---|---|
| `LightboxView.tsx:46` | `--ai-bg` → `color-mix(… var(--color-overlay-foreground) 10% …)` |
| `LightboxView.tsx:47` | `--ai-hover` → `color-mix(… var(--color-overlay-foreground) 20% …)` |
| `LightboxView.tsx:48` | `--ai-color` → `var(--color-overlay-foreground)` |
| `LightboxView.tsx:49` | `--ai-hover-color` → `var(--color-overlay-foreground)` |
| `LightboxView.tsx:87` | `Modal.Content` scrim → `color-mix(… var(--color-overlay) 95% …)` |
| `LightboxView.tsx:160` | active thumbnail `borderColor` → `var(--color-overlay-foreground)` |
| `MantineListingGalleryPattern.tsx:93` | `<Text c="var(--color-overlay-foreground)">` |

**They migrate to the `:root` pair, and the value delta is provably zero** — `globals.css:84-85`
defines `--color-overlay: var(--overlay)` and `--color-overlay-foreground: var(--overlay-foreground)`,
so the two names are value-identical by construction. It is a rename, not a re-colour. Prove it
anyway (R2): four of these seven are Mantine `--ai-*` custom properties feeding Mantine's own
`:hover` rule, one is a full-screen modal backdrop, and none of that is obvious from a diff.

### 3.3 Ordering is forced by D35 — the comment rewrite is a prerequisite, not cleanup

The `@theme` copy exists **solely** so Tailwind can statically resolve the value and composite the
alpha-blended static fallback for opacity-modifier utilities. Removing it re-breaks that tier
exactly as Task 690 did — that is what both `globals.css` comment records say, and D35 restates it.

Two overlay utilities are **still generated**, from `LightboxView.tsx`'s comment block (`:74-84`),
which Tailwind's scanner reads:

```
.bg-overlay{background-color:var(--overlay)}
.bg-overlay\/95{background-color:#000000f2}
.bg-overlay\/95{background-color:color-mix(in oklab,var(--overlay) 95%,transparent)}
```

Delete the `@theme` copy while those are still scanned and you reproduce the 690 regression
signature in the shipped bundle, on a rule nothing renders. **Rewrite the comment first** so the
scanner stops seeing utility-shaped strings; then the count of generated overlay utilities is 0 and
the `@theme` copy has no remaining purpose. Only then is its deletion inert.

Do not delete the comment. It records a real cascade-layer trap (Mantine's `Paper` sets its own
unlayered `background-color`, which is why the scrim is an inline `style`). Rewrite it so it says
the same thing without emitting scannable candidates.

### 3.4 What must survive, and has more consumers than you might expect

The `:root` pair stays. Current `var(--overlay*)` consumers, all of which must keep resolving:

`AdminUserAvatar.module.css` · `PerfDevOverlay.module.css` · `ImageUpload.module.css` ·
`LightboxView.module.css` · `ListingGallery.module.css` · `MantineListingGalleryPattern.module.css`
(the six from 748) · `MantineListingCardPattern.module.css` (691) ·
`PopularLocationsView.module.css`.

Scope the deletion to the four names inside `@theme inline` — `--overlay`,
`--overlay-foreground`, `--color-overlay`, `--color-overlay-foreground` — and to nothing in `:root`.

### 3.5 Four gate surfaces, two of which break deterministically

1. **`scripts/__tests__/overlay-dual-declaration.test.ts` (692's gate) — rewrite, do not delete.**
   Both its assertions become vacuous: the first compares `@theme inline` against `:root` (no
   `@theme` block will exist), the second checks that `--color-overlay*` stay `@theme`-only (no such
   names will exist). A gate whose assertions can no longer fail is not a gate — that is the exact
   defect Task 748 spent three review rounds on. New invariants must be stated and each shown to
   fail: `--overlay*` declared exactly once and only in `:root`; `--color-overlay*` declared
   nowhere; zero `bg|text|border-overlay*` rules in the built bundle.

2. **`scripts/check-css-var-resolvability.mjs:758-775` (700's gate) — WILL BREAK.** `runPlantP3`
   plants on `--color-overlay-foreground` and asserts a hard precondition of exactly **1**
   declaration site and **0** shipped `var()` references. Verified live today: 1 and 0. Delete the
   declaration and the plant records `pre-plant census failed`, so `npm run check:css-vars --
   --verify-gate` (700's 8/8 self-test) goes red. Re-point P3 at another token that satisfies the
   same precondition, and say in the report which one and why it is equivalent. Read the comment
   block above `runPlantP3` first — it explains why `--overlay-foreground` is specifically **not**
   a valid substitute.

3. **`scripts/__tests__/css-var-resolvability.test.ts:82-93`** uses both names as string fixtures
   for the comment-stripping tests. They look inert — the fixtures test the stripper, not the
   token's existence — but verify rather than assume, and say which you found.

4. **Task 743's blind spot does not apply here, by design.** 743 reproduced that deleting a token
   un-owns it together with its orphaned consumers, so `check:css-vars` returns `0 violations,
   exit 0`. Owner decision (2026-08-13): **695 removes the consumers first (§3.2), so no orphans
   exist and the blind spot is never exercised.** 743 stays a separate hygiene task and does **not**
   block this one. Do not treat a green `check:css-vars` as evidence that the deletion was safe —
   after 743's finding, that gate cannot be that evidence. Your evidence is R2's rendered proof.

### 3.6 Story and rendered-proof coverage

Both rendered surfaces are story-backed — corrected inventory, per 748 §9:

| File | Canonical story |
|---|---|
| `LightboxView.tsx` | `src/stories/mantine/primitives/LightboxView.stories.tsx` |
| `MantineListingGalleryPattern.tsx` | `src/stories/patterns/mantine/ListingGalleryPattern.stories.tsx` |

No new story. `docs/reviews/artifacts/2026-08-13-task748-rework/real-before-after-comparator.mjs`
is the worked precedent for a two-phase capture: I0 export via `git archive`, both phases resolving
real elements, fail-closed, plant on the after side. Reuse its shape.

### 3.7 Critical flow

`docs/critical-flow-registry.md:105` — *Listing-detail gallery lightbox stacking (portal +
z-index)*, Task 612, with suite `ListingGallery.portal.smoke.test.tsx`. This task does not touch
stacking or portalling, but it edits `LightboxView.tsx`, so clause 15 binds: run that suite, record
its real result, do not modify it.

### 3.8 Start state

`HEAD` = `39f02ba9fa31d63d470906f41f1bf0560b44f689` ("feat(task-748): exit overlay Tailwind
utilities"), `git status --porcelain` **empty**. If it is dirty at I0, complete
`docs/orchestrator-dirty-worktree-manifest-template.md` before the first write.

---

## 4. Requirements

| ID | Observable requirement | Priority | AC |
|---|---|---|---|
| R1 | Zero `var(--color-overlay*)` references remain anywhere in `src/**` | P0 | AC1 |
| R2 | Every migrated site's computed value is identical before and after, measured | P0 | AC2 |
| R3 | Zero `bg\|text\|border-overlay*` rules are generated in the built bundle | P0 | AC3 |
| R4 | The `@theme inline` overlay block is gone; the `:root` pair is untouched and every consumer in §3.4 still resolves | P0 | AC4 |
| R5 | 692's gate is rewritten to invariants that hold now, and each is shown to fail | P0 | AC5 |
| R6 | `check:css-vars --verify-gate` is green again, with P3 re-pointed and justified | P0 | AC6 |
| R7 | `LightboxView.tsx`'s comment keeps its cascade-trap record and emits no scannable candidate | P1 | AC7 |
| R8 | The critical-flow suite runs and its real result is recorded; the test file is unmodified | P0 | AC8 |
| R9 | D19 closed; both `globals.css` comment records rewritten to describe the single-source state | P1 | AC9 |
| R10 | Standing gates green; evidence committed under `docs/reviews/artifacts/<date>-task695/` | P1 | AC10 |

## 5. Assumptions and open questions

- **A1.** `--color-overlay: var(--overlay)` makes the rename value-identical by construction. That
  is the *hypothesis*; R2 is the measurement. If any computed value moves, stop and report.
- **A2.** The four `--ai-*` properties feed Mantine's own `:hover` rule. Renaming what they read
  does not change which rule consumes them — verify the hover state explicitly all the same.
- **OQ1 — yours to decide and report, not to route around.** Whether `LightboxView.tsx`'s rewritten
  comment keeps the literal strings in a scanner-invisible form (e.g. broken across a boundary
  Tailwind's extractor does not join) or drops them for prose. Either is acceptable; the test is
  the generated-utility count in AC3, not the wording.
- **OQ2 — owner-only, do not act on it.** Whether `PopularLocationsView.module.css` and the other
  `:root`-pair consumers should eventually move to a named semantic token. Out of scope.

## 6. Pre-read

Always: `docs/agent-contract.md` · `docs/rule-index.md` · `docs/qa-profiles.md` · `docs/backlog.md` ·
`docs/critical-flow-registry.md` **row `:105` in full**.

Task-specific:

- `src/app/globals.css` `:68-90` and `:455-475` — both "Keep both copies" records, and D18/D19's history.
- `docs/sessions/2026-07-30-task690-overlay-root-relocation.md` — what happens when the `@theme` copy goes early. **This is the failure you are sequencing around.**
- `docs/sessions/2026-08-13-task748-overlay-utility-exit.md` §R6 — the seven references, as handed over.
- `scripts/__tests__/overlay-dual-declaration.test.ts` — the gate you rewrite.
- `scripts/check-css-var-resolvability.mjs` `runPlantP3` and the comment above it.
- `docs/reviews/artifacts/2026-08-13-task748-rework/real-before-after-comparator.mjs` — the comparator shape to reuse.
- D19, D28, D34, D35 in `docs/backlog.md`'s decisions block.

## 7. Scope

| Path | Action |
|---|---|
| `src/modules/listings/components/LightboxView.tsx` | **modify** — 6 refs + the comment block |
| `src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx` | **modify** — 1 ref |
| `src/app/globals.css` | **modify** — delete the `@theme inline` overlay block; rewrite both comment records |
| `scripts/__tests__/overlay-dual-declaration.test.ts` | **rewrite** |
| `scripts/check-css-var-resolvability.mjs` | **modify** — re-point P3 only |
| `docs/reviews/artifacts/<date>-task695/` | **create** — comparator, transcripts, results |
| `docs/sessions/<date>-task695-overlay-namespace-exit.md` | **create** |
| `docs/backlog.md` | **modify** — concise state, ≤80 lines |

## 8. Out of scope

- **The `:root` pair and any of its consumers in §3.4.** Renaming or "tidying" them is a different task.
- **Task 743's scoping rule.** Owner decision: not this task.
- **Re-migrating anything 748 landed.** The six CSS modules are approved and closed.
- **`CLOSED_OVERLAY_STYLE`** — 741.
- Creating any Storybook story.

## 9. Implementation requirements — the ordering is mandatory

1. **I0 first.** `git status --porcelain`; re-derive §3.1's census and §3.2's seven references with
   the §13 commands; grep and quote both `globals.css` blocks; `npm run build` and retain the
   transcript with `/[locale]` First Load JS; record the generated-overlay-utility count in the
   bundle (expect the three lines in §3.3); run `check:css-vars -- --verify-gate` and retain its
   pre-change 8/8.
2. **Build the two-phase comparator BEFORE editing** — I0 export via `git archive`, both phases on
   real elements, fail-closed on moved/missing/errored/short, plant on the **after** side. Cover
   the modal scrim, the four `--ai-*`-driven ActionIcon states **including hover**, the active
   thumbnail border, and the Mantine `Text` colour.
3. **Rewrite `LightboxView.tsx`'s comment.** Rebuild. Confirm the generated overlay-utility count
   is **0**. Do not proceed until it is.
4. **Migrate the seven references** to `var(--overlay)` / `var(--overlay-foreground)`.
5. **Only now delete the `@theme inline` overlay block** and rewrite both comment records.
6. **Rewrite 692's gate**; show each new invariant failing on a planted violation.
7. **Re-point P3** in `check-css-var-resolvability.mjs`; `--verify-gate` back to 8/8.
8. **Run the critical-flow suite** and record the real result.
9. **Stop conditions — report, never route around:** any moved computed value; any overlay utility
   still generated after step 3; any First Load JS increase; any need to touch the `:root` pair;
   a `--verify-gate` arm you cannot restore without weakening it.

## 10. Acceptance criteria

- **AC1 [R1]** — the §13 reference command returns **0** across `src/**`, quoted in the report.
- **AC2 [R2]** — every captured property is identical before and after, diff count **0**, from a
  comparator shown to fail with a plant on the after side. Hover states included.
- **AC3 [R3]** — grep of `.next/static/css/*.css` returns **zero** `bg|text|border-overlay*` rules,
  before and after the `@theme` deletion, quoted both times.
- **AC4 [R4]** — `globals.css` has no `@theme inline` overlay block; `:root:470-471` is byte-unchanged;
  every consumer in §3.4 resolves in the built bundle.
- **AC5 [R5]** — the rewritten 692 gate passes on the real tree and **exits non-zero** on a planted
  violation of each invariant it asserts, each shown.
- **AC6 [R6]** — `npm run check:css-vars -- --verify-gate` is **8/8**, with the new P3 target named
  and its precondition (1 declaration site, 0 shipped refs) measured and quoted.
- **AC7 [R7]** — the comment still records the Mantine `Paper` cascade-layer trap, and AC3 holds.
- **AC8 [R8]** — `ListingGallery.portal.smoke.test.tsx` passes, transcript retained, file unmodified.
- **AC9 [R9]** — both `globals.css` comment records describe the single-source state, D19 is closed
  in the decisions block, and no text still says "Keep both copies".
- **AC10 [R10]** — `build` exit 0 with `/[locale]` First Load JS not increased; `typecheck`,
  `check:design-tokens`, `check:css-vars`, `check:stories`, `check:mojibake`, `check:file-integrity`,
  `check:review-ledger` each with a **transcript from this task's own run**; full `vitest`;
  `docs/backlog.md` ≤80 lines; every cited path committed, `git ls-files` count quoted per path.

## 11. QA profile and verification plan

**`Q4 — Release/Critical Flow`.** Q3's visual matrix applies to both rendered surfaces; both are
story-backed, so there is no compiled-equivalence-only asymmetry to declare this time.

Utility census (unchanged from 748 §13, comments stripped):

```powershell
node -e "const re=/\b(?:bg|text|border)-overlay(?:-foreground)?(?:\/\d+)?\b/g;const fs=require('fs'),p=require('path');let n=0;(function w(d){for(const f of fs.readdirSync(d,{withFileTypes:true})){const q=p.join(d,f.name);if(f.isDirectory())w(q);else if(/\.(tsx|ts|css)$/.test(f.name)){let s=fs.readFileSync(q,'utf8').replace(/\/\*[\s\S]*?\*\//g,'').replace(/^\s*\/\/.*$/gm,'');const m=s.match(re);if(m){n+=m.length;console.log(m.length,q)}}}})('src');console.log('TOTAL',n)"
```

Reference census — non-comment `var(--color-overlay*)` under `src/`:

```powershell
node -e "const fs=require('fs'),p=require('path');let n=0;(function w(d){for(const f of fs.readdirSync(d,{withFileTypes:true})){const q=p.join(d,f.name);if(f.isDirectory())w(q);else if(/\.(tsx|ts|css)$/.test(f.name)){fs.readFileSync(q,'utf8').split(/\r?\n/).forEach((l,i)=>{if(/var\(--color-overlay/.test(l)&&!/^\s*(\*|\/\/|\/\*|\{\/\*)/.test(l)){n++;console.log(q+':'+(i+1))}})}}})('src');console.log('TOTAL',n)"
```

Generated-utility count in the bundle — run at I0, after step 3, and at the end:

```powershell
node -e "const fs=require('fs');let n=0;for(const f of fs.readdirSync('.next/static/css')){if(!f.endsWith('.css'))continue;const s=fs.readFileSync('.next/static/css/'+f,'utf8');const m=s.match(/\.(?:bg|text|border)-overlay[^{]*\{[^}]*\}/g);if(m){n+=m.length;m.forEach(r=>console.log(f,'::',r))}}console.log('TOTAL',n)"
```

Anything that cannot run in your environment is `PARTIALLY IMPLEMENTED`, never a pass.

## 12. Completion report contract

Report `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`.
**Never self-approve, and do not mark Sprint 46 closed** — that is the owner's call.

Beyond the standing contract: the three generated-utility counts (I0 / post-comment / final); the
before/after table for all seven references; the new 692 invariants with each one's failing plant;
the new P3 target with its measured precondition; and **this kickoff's own facts are not exempt** —
§3 was measured 2026-08-13 against `39f02ba9f`; if the tree disagrees, the tree wins and the
deviation is reported.

## 13. Task quality gate

| Check | Result |
|---|---|
| Executable by a fresh Sonnet with no chat context | **Yes** — every site, count, command and ordering constraint is in §3 and §11 |
| Every primary requirement has a binary AC | **Yes** — R1–R10 → AC1–AC10 |
| Scope protects existing behavior and names what must not change | **Yes** — §8, §3.4, and nine stop conditions in §9 |
| Comparator shown able to fail | **Required of the executor** — AC2, plant on the after side |
| Gate rewritten rather than deleted, and shown able to fail | **Yes** — AC5, after 748's lesson |
| Ordering hazard stated as a hard constraint | **Yes** — §3.3 and §9's numbered sequence |
| Owner-only exceptions traceable | **Yes** — 743 deferral and the one-task shape decided by the owner 2026-08-13 |
| No claimed command, file, value or behavior went uninspected | **Yes** — §3.1–§3.5 re-measured 2026-08-13 against `39f02ba9f`, including the live P3 precondition (1 declaration, 0 refs) |

---

## Handoff

Execute from this saved path using `.claude/skills/execute-task/SKILL.md`.

**One thing to internalise.** Two of the four gates this task touches will pass whether or not you
get it right: `check:css-vars` because 743's blind spot makes a deleted token un-own its own
orphans, and 692's rewritten test because you are the one choosing its invariants. Task 748 failed
three reviews on exactly this — checks that could not have come out wrong. Ask of each artifact you
produce: *what would have to be broken for this to redden?* If the answer is "nothing", that
artifact is the defect, and the ordering in §9 exists because the build output is the only witness
that cannot be talked into agreeing with you.
