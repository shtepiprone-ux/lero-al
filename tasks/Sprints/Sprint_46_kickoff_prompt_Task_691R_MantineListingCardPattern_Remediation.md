# Task 691R — Remediate `MantineListingCardPattern` de-Tailwind (Sprint 46.4, re-entry)

**Kickoff path:** `tasks/Sprints/Sprint_46_kickoff_prompt_Task_691R_MantineListingCardPattern_Remediation.md`
**Sprint:** 46 — ListingCard de-Tailwind + overlay exit, order **46.4** (re-entry)
**Executor:** Sonnet, via `.claude/skills/execute-task/SKILL.md`
**Parent:** Task **691**. `691R` is a re-entry suffix, not a new registry number — it closes with 691, same
convention as `709-R`. Do not consume 748.
**Re-entry mode:** `remediation`. The 691 change set stays in the worktree; this task corrects it in place.
**Filed:** 2026-08-12, after review `NEEDS REVISION`
**Review of record:** `docs/reviews/2026-08-12-task691-mantinelistingcardpattern-detailwind.review-ledger.json`
(v4, gate `PASSED`/0, handoff `PROHIBITED`) — **7 open findings: F-A, F-B, F-C, F-E (P0) · F-J, F-K (P1) · F-L (P2)**

---

## 1. Mode and task type

Implementation task, **remediation re-entry**. Type: **UI / Component — current Mantine path**, D28 de-hybrid
migration. **Q3 — Full Visual Matrix**, unchanged from 691.

D28 · D34 · D35 · D36 · D37 all still bind. **D36's no-increase perf condition is still a stop condition**, not a
metric.

---

## 2. Objective

Close the seven open findings on 691 so its de-Tailwind lands with zero visual delta and complete evidence.

Two are behavioural regressions in the code (**F-A**, **F-B**). Four are missing or too-narrow evidence
(**F-C**, **F-E**, **F-J**, **F-L**). One is a missing comparison (**F-K**). The code fix is two small edits; the
cost of this task is almost entirely evidence.

**You are not re-doing 691.** The 24 migrated sites, the module's new classes, and the three D34-losing literals
are all accepted. Do not revisit them except where a finding names them.

---

## 3. Verified context

Measured 2026-08-12 against the worktree at base `2ad067bc1f845a4328f4850e02e25164d15cf0cd` plus the uncommitted
691 change set. **Re-derive every figure at I0 (§10.1); if the tree disagrees, the tree wins.**

### 3.1 F-A — the removed `group` marker has a live cross-file consumer

`MantineListingCardPattern.tsx` removed `group` from both Card roots (`:163`, `:290`).

| Fact | Where | Measured |
|---|---|---|
| Consumer declaration | `src/components/ui/appImageConfig.ts:66` | `VARIANTS.listing.hoverClass = 'group-hover:scale-105'` |
| Applied unconditionally | `src/components/ui/AppImage.tsx:151` | inside the `cn()` on the inner `<img>` |
| Gated only by device tier | `src/components/ui/useAdaptiveImageConfig.ts:141` | `hoverClass: isLow ? undefined : config.hoverClass` |
| Fed into the pattern | `ListingCard.tsx:243` | `<AppImage variant="listing" …>` → the `image` slot |
| No surviving ancestor | `ListingCard.tsx:201-206`, `:296-302` | neither `<Link>` carries `group` |
| Still emitted, matches nothing | `.next/static/css/3b5759d2e996cb5d.css` | `.group-hover\:scale-105:is(:where(.group):hover *){…scale:var(--tw-scale-x) var(--tw-scale-y)}` |

**Only the vertical card is affected** — `listing-thumb` (the list layout) declares no `hoverClass`.
**Every other `group-hover:` consumer keeps its own ancestor** and is out of scope: `ImageUpload.tsx:117` (own
`group` at `:103`), `ListingGallery.tsx` gallery-main/side (`:93`, `:103`), `FavoritesShell.tsx:213` (`:203`),
`ListingsFilters.tsx:36` (`:34`).

**The property is `scale`, not `transform`.** The module's surviving `.card:hover .imageSection img { transform:
scale(1.05) }` is a *different property* and composes with it. Losing `scale: 105%` therefore changes the composite
hover zoom rather than removing it. **The magnitude has never been measured** — measuring it is AC2 here.

### 3.2 F-B — the dropped `@media (hover: hover)` guard

`.card:hover .cardTitle` (`MantineListingCardPattern.module.css:228`) carries no media condition. The compiled
baseline does. **Compiler-confirmed**, not inferred: the v4 ledger validator recompiled
`group-hover:[--text-color:var(--primary)]` from `git show 2ad067bc1…:src/app/globals.css` with tailwindcss 4.3.0
and accepted the retained rule in `docs/reviews/artifacts/2026-08-12-task691-hover-envelope-before.css`:

```css
.group-hover\:\[--text-color\:var\(--primary\)\] {
  &:is(:where(.group):hover *) {
    @media (hover: hover) { --text-color: var(--primary); }
  }
}
```

**The guard is one descriptor: `(hover: hover)`.** The module header (`:22-25`) describes the file's *other*
`:hover` rules as scoped to `(hover: hover) and (pointer: fine)`. **Do not copy that.** Adding `and (pointer:
fine)` would be a *new* delta against the compiled baseline and needs its own owner decision — see OQ2.

The comment at `:221-226` asserts the compiled utility carries no guard. **That is false and must be deleted**, not
softened.

### 3.3 The `--text-color` mechanism — measured, because it decides the layer question

- Mantine's `Text` reads it unconditionally with no fallback: `node_modules/@mantine/core/styles/Text.css:9` —
  `color: var(--text-color);`
- Mantine's stylesheet **never writes** `--text-color`; it is set inline from the `c` prop.
- Both card titles (`:205`/`:338` pre-691) pass **no `c` prop**, so no inline value exists on them.
  (`:343`'s location `Text` does use `c="dimmed"` — that element is not `.cardTitle` and is out of scope.)

**Therefore nothing contests `--text-color` on `.cardTitle`**, and a layered rule would win exactly as an unlayered
one does. That makes D34's "a migration reproduces the utility's cascade standing" achievable here — see OQ1.

### 3.4 Which envelope deltas are already authorized, and which are not

A D28 migration can never keep the utility's selector. That is authorized: **D28 (2026-08-01, owner)** is recorded
in `docs/backlog.md` → "Standing notes" → "Binding decisions", and authorizes a *mechanism* change with zero visual
delta.

| Envelope field | Disposition |
|---|---|
| `selector`, `sourceOrder` | **Authorized by D28.** The re-review cites `docs/backlog.md` as the `ownerDecisionArtifact`. |
| `layer`, `specificity` | Decided by OQ1's measurement. If the rule is layered, both move toward the baseline. |
| `media` | **NOT authorized by anything.** D28 authorizes mechanism, not behaviour. This is why F-B is a P0 fix, not a citation. |
| `supports`, `declarations`, `customProperties` | Already identical. Do not touch. |

### 3.5 F-C — the comparator covers 4 of 160 required tuples

`.screenshots/task691-delta/capture-computed-styles.mjs` pins viewport `1024x4000` (`:92`) and `globals=locale:en`
with a single story (`:96`). AC10 requires **both** enrolled stories; Q3 requires four locales and the viewport set.

**The omitted story is the one that would have caught F-A.**
`src/stories/mantine/primitives/ListingCard.stories.tsx` statically imports the **real** production `ListingCard`
(header `:10-13`, "imports zero demo stand-ins"), hence the real `AppImage`. The captured story uses `DemoImage`, a
plain Mantine `Image` documented as a stand-in at `ListingCardPattern.stories.tsx:22-24`.

Required scope, exactly as the ledger declares it: **2 stories × 4 locales (sq/en/uk/it) × 5 viewports
(320/375/390/768/1024) × 2 states (rest/hover) × 2 phases (before/after) = 160 tuples.**

### 3.6 F-E, F-J, F-K, F-L — what is missing

| Finding | Missing artifact |
|---|---|
| **F-E** `P0` | Any retained `npm run build` transcript. 691 §11 left them in `/tmp`. Blocks AC9 (D36 stop condition) and AC11. |
| **F-J** `P1` | The compiled before-side for the 7 opacity-modifier candidates (6 named D35 + the `text-muted-foreground/70` sibling). |
| **F-K** `P1` | An explicit `--mantine-only` fail-set **set diff** against Task 733's standing comparator. |
| **F-L** `P2` | Transcripts for `check:css-vars`, `check:design-tokens`, `check:stories`, and both smoke suites. Only `check:homepage-grid` retained its three runs, correctly classified under D37 — **leave those alone.** |

### 3.7 Start state

Worktree is dirty. `git status --porcelain` at time of filing shows the 691 change set plus review artifacts plus
two long-standing unrelated files. **Complete `docs/orchestrator-dirty-worktree-manifest-template.md` for every
entry at I0, before the first write.** The two unrelated paths — `.claude/skills/create-task/SKILL.md` and
`docs/orchestrator-evidence-preflight-template.md` — are `EXCLUDED AS UNRELATED` and were carried unchanged through
691 with SHA-256 witnesses; carry them the same way.

---

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | F-A | `group-hover:scale-105` applies again on the vertical card; the fix is proven by measurement, not by restoring a class | P0 | AC1, AC2 | Confirmed |
| R2 | F-A, D28 | The composite hover zoom (`scale` **and** `transform`) is identical to the base revision | P0 | AC2 | Confirmed |
| R3 | F-B | `.card:hover .cardTitle` reproduces the compiled baseline's `@media (hover: hover)` — one descriptor | P0 | AC3 | Confirmed |
| R4 | F-B | The false compiler claim at `:221-226` is removed | P0 | AC3 | Confirmed |
| R5 | F-B, D34, §3.3 | The rule's layer disposition is decided **by measurement** (OQ1) and reported | P0 | AC4 | Confirmed |
| R6 | F-C | Computed-style capture spans all **160** required tuples, before and after | P0 | AC5 | Confirmed |
| R7 | F-C | The capture's property set includes the image's `scale` **and** `transform` | P0 | AC5 | Confirmed |
| R8 | F-E, D36 | A retained zero-exit `npm run build` transcript, with `/[locale]` First Load JS at I0 and final | P0 | AC6 | Confirmed |
| R9 | F-J | The 7 opacity-modifier candidates have retained compiled before-side output | P1 | AC7 | Confirmed |
| R10 | F-K | An explicit `--mantine-only` fail-set set diff, `0 added / 0 removed` | P1 | AC8 | Confirmed |
| R11 | F-L | Retained transcripts for the four remaining gates and both smoke suites | P2 | AC9 | Confirmed |
| R12 | Standing | `typecheck` exit 0; concise backlog update; session log | P1 | AC10 | Confirmed |

---

## 5. Assumptions and open questions

- **A1.** 691's 24 migrated sites and 3 D34-losing literals are accepted and out of scope.
- **A2.** D37 governs any single-cell rendered drift, exactly as in 691.
- **OQ1 — the layer disposition, resolved by measurement, not by preference.** §3.3 measured that nothing contests
  `--text-color` on `.cardTitle`. **Re-verify at I0**, including inline styles on the rendered element. If nothing
  contests it, wrap the rule in `@layer utilities` per D34 and report that both the layered and unlayered forms
  compute identically. If something *does* contest it, keep it unlayered and report the contesting declaration.
  Either way this is a report, not a silent choice.
- **OQ2 — owner decision, NOT yours.** Whether the rule should additionally carry `and (pointer: fine)` to match the
  file's other `:hover` rules is an owner call, because it departs from the compiled baseline. **Implement
  `(hover: hover)` alone.** Record the question in the session log; do not implement the two-condition form.

---

## 6. Pre-read rule bundle

Always required: `docs/agent-contract.md` · `docs/rule-index.md` · `docs/qa-profiles.md` · `docs/backlog.md` ·
`docs/critical-flow-registry.md` — **row "Listing card rendering — Mantine pattern is the COMPLETE single source of
truth" names this file and names both regressions as governed behaviour** ("image `scale(1.05)`"; "scoped to
`(hover:hover) and (pointer:fine)` so touch taps never get stuck-hovered"). Clause 15 requires automated regression
evidence.

UI / current Mantine path: `docs/mantine-responsive-design-system.md` · `docs/tailadmin-style-reference.md` ·
`docs/component-rules.md` · `docs/qa-rules.md` · `docs/storybook-governance.md` §14.9.2 and §14.11 (D26).

Task-specific:

- `docs/reviews/2026-08-12-task691-mantinelistingcardpattern-detailwind.review-ledger.json` — **read the seven open
  findings first; they are the specification.**
- `docs/reviews/artifacts/2026-08-12-task691-hover-envelope-before.css` — the compiler-confirmed baseline.
- `src/design-system/mantine/patterns/MantineListingCardPattern.tsx` and `.module.css` — current state, all lines.
- `src/components/ui/appImageConfig.ts:62-76` · `AppImage.tsx:140-157` · `useAdaptiveImageConfig.ts:135-145`.
- `src/stories/mantine/primitives/ListingCard.stories.tsx` `:1-30` · `src/stories/patterns/mantine/ListingCardPattern.stories.tsx` `:20-30`.
- `docs/sessions/2026-08-11-task691-mantinelistingcardpattern-detailwind.md` — the parent session log.

---

## 7. Scope

| Path | Action |
|---|---|
| `src/design-system/mantine/patterns/MantineListingCardPattern.tsx` | **modify** — restore `group` on both Card roots |
| `src/design-system/mantine/patterns/MantineListingCardPattern.module.css` | **modify** — media guard, OQ1 layer, delete the false comment |
| `.screenshots/task691-delta/capture-computed-styles.mjs` | **modify** — parameterise story/locale/viewport; add `scale`/`transform` |
| `.screenshots/task691-delta/` | **create** — 160-tuple captures, diff, gate transcripts, set diff, compiled before-side |
| `docs/sessions/2026-08-12-task691R-remediation.md` | **create** — session log |
| `docs/backlog.md` | **modify** — concise state, ≤80 lines |

---

## 8. Out of scope

- **The 24 accepted migrated sites and the 3 D34-losing literals.**
- **`ListingCard.tsx`, `appImageConfig.ts`, `AppImage.tsx`** — the fix is to restore the marker in the pattern, not
  to re-anchor the consumer. md5 all three at I0 and final.
- `overlay.className` / `CLOSED_OVERLAY_STYLE` — **741**. The `@theme inline` overlay copy — **695**.
- **Tasks 746 and 747** — the detector gaps this review filed. Neither blocks this task; do not start either.
- The review protocol, the v4 ledger, and `docs/reviews/**` — **do not edit any of them.**
- The three retained `check:homepage-grid` transcripts and their D37 classification.

---

## 9. Current and required behavior

**Current.** On the vertical listing card, `group-hover:scale-105` no longer applies (no `group` ancestor), so the
composite hover zoom is smaller than at base. `.card:hover .cardTitle` applies on any pointer, including a tap on a
touch device, where the original never could.

**Required.** Both behaviours identical to the base revision at every required tuple: the composite hover zoom
restored, and the title-colour rule unreachable without hover capability. No other computed property moves.

---

## 10. Implementation requirements

1. **I0 first.** Dirty-worktree manifest (§3.7); md5 of the three out-of-scope files; `npm run build` **and retain
   its transcript** with `/[locale]` First Load JS; re-derive §3.1–§3.4 and OQ1.
2. **Capture BEFORE across all 160 tuples.** The before side is the **base revision**, and the change set is
   uncommitted, so an in-place capture is impossible. **This needs an owner-run git step — request it, do not
   attempt it.** Ask the owner for a clean worktree at base:
   `git worktree add ../lero-al-base 2ad067bc1f845a4328f4850e02e25164d15cf0cd`, build Storybook there, capture, then
   ask the owner to remove it. **Never run mutating git yourself, including `stash`.** If the owner declines,
   report `BLOCKED` — do not substitute the existing 4-tuple `computed-before.json`.
3. **Fix F-A:** restore `group` in both `cn()` calls (`:163`, `:290`). One token each.
4. **Fix F-B:** wrap the rule in `@media (hover: hover)` — one descriptor — apply OQ1's layer decision, and delete
   the false claim at `:221-226`. Replace it with what you measured.
5. **Capture AFTER across the same 160 tuples and diff per property.** Any moved property is a D28 violation: fix
   or report. The property set **must** include the image's `scale` and `transform` (R7).
6. **Retain everything** (F-E/F-J/F-K/F-L): build transcript, four gate transcripts, both smoke runs, the
   `--mantine-only` set diff computed as a set, and the compiled before-side of the 7 D35 candidates.
7. **Stop conditions — report, never route around:** any First Load JS increase (D36); a moved computed property you
   cannot explain; a contested `--text-color` declaration (OQ1); the owner declining the base worktree; any need to
   touch an out-of-scope path.

---

## 11. Positive and negative flows

**Positive.** A vertical listing card on the homepage grid zooms its image and reddens its title under a real mouse
hover, identically to the base revision; a tap on a touch device does neither.

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Validation · Authorization/RLS · Offline · Concurrent writer | **No** | Presentation-only | N/A | — |
| **Coarse pointer / touch** | **Yes** | F-B, `@media (hover: hover)` | Neither hover effect fires | Coarse-pointer probe, both phases |
| **Real mouse, vertical card** | **Yes** | F-A, `appImageConfig.ts:66` | Composite `scale`+`transform` identical to base | 160-tuple capture |
| **List layout** | **Yes** | `listing-thumb`, no `hoverClass` | Unchanged; `group` restoration is inert here | Capture, list story |
| **`prefers-reduced-motion`** | **Yes** | module `:74-84` | Still suppressed; the block resets `transform`, **not** `scale` — report what you measure | Capture |
| **Premium / archived / closed-overlay / no-image** | **Yes** | 691's accepted branches | Unchanged | Capture + rendered matrix |

---

## 12. Acceptance criteria

- **AC1 [R1]** — *Given* the final `.tsx`, *then* both Card roots carry `group`, and `ListingCard.tsx`,
  `appImageConfig.ts`, `AppImage.tsx` are md5-identical to I0.
- **AC2 [R2]** — *Given* the before/after captures on the **real** `ListingCard` composition, *then* the vertical
  card's hover `scale` and `transform` are both identical to base, quoted as values, not as a diff count.
- **AC3 [R3, R4]** — *Given* the final module, *then* the rule is wrapped in `@media (hover: hover)` with exactly
  that one descriptor, and no comment claims the compiled utility carries no guard.
- **AC4 [R5]** — *Given* OQ1's measurement, *then* the layer decision is stated with the evidence behind it, and any
  contesting declaration is named.
- **AC5 [R6, R7]** — *Given* the capture, *then* **all 160 tuples** are covered, `scale` and `transform` are in the
  property set, and the diff count is **0**. A tuple that cannot be captured is reported, never silently dropped.
- **AC6 [R8]** — *Given* the retained transcripts, *then* `npm run build` exits 0 at I0 and final, and `/[locale]`
  First Load JS **has not increased**. Any increase ends the task as `PARTIALLY IMPLEMENTED`.
- **AC7 [R9]** — *Given* the 7 opacity-modifier candidates, *then* each has retained compiled before-side output
  compared against the module's reproduction.
- **AC8 [R10]** — *Given* one `--mantine-only` run, *then* the fail set is compared **as a set** against Task 733's
  standing comparator, `0 added / 0 removed`, with the comparison persisted. D37 governs any drift.
- **AC9 [R11]** — *Given* the four gates and both smoke suites, *then* each has a retained transcript with its
  actual exit status.
- **AC10 [R12]** — `typecheck` exit 0; `docs/backlog.md` ≤80 lines; session log at the §7 path.

---

## 13. QA profile and verification plan

**`Q3 — Full Visual Matrix`**, unchanged from 691. The critical-flow row applies and its governed behaviours are
exactly the two regressions, so clause 15's automated regression evidence is the 160-tuple capture plus the
coarse-pointer probe.

Commands — record the actual result of each: I0 `git status --porcelain` · `npm run build` (I0, retain) ·
md5 ×3 · base-worktree Storybook build + BEFORE capture · edits · `npm run build-storybook` + AFTER capture + diff ·
`npm run screenshots:assert -- --mantine-only` (**one** run, ~2.5 h) + set diff · `check:homepage-grid` ·
`check:css-vars` · `check:design-tokens` · `check:stories` · `check:mojibake` · `check:file-integrity` ·
`npx vitest run` both smoke suites then full · `npm run typecheck` · `npm run build` (final, retain).

Anything that cannot run in your environment is `PARTIALLY IMPLEMENTED`, never a pass.

---

## 14. Completion report contract

Report `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`. **Never self-approve.**

1. Changed files reconciled against the actual final `git status --porcelain`, plus the dirty-worktree manifest.
2. Requirement IDs completed; any not completed, with why.
3. Every §13 command with its **actual** result and the path of its retained transcript.
4. The 160-tuple coverage statement: tuples captured, tuples missing, and why for each missing one.
5. AC2's quoted `scale`/`transform` values, base vs final.
6. OQ1's measurement and layer decision; OQ2 recorded as an open owner question, **not implemented**.
7. `/[locale]` First Load JS at I0 and final, delta stated explicitly.
8. The `--mantine-only` set comparison with its method.
9. Confirmation that the three out-of-scope files, the 746/747 scopes, and `docs/reviews/**` were untouched.
10. Assumptions, deviations, limitations. **This kickoff's own facts are not exempt** — §3.3's `--text-color`
    measurement was corrected once during drafting when a whitespace-blind grep reported zero reads and the file
    showed otherwise. Re-derive it.

---

## 15. Task quality gate

| Check | Result |
|---|---|
| Executable by a fresh Sonnet with no chat context | **Yes** — every finding, file, line and tuple count is in §3 and the cited ledger |
| Every primary requirement has a binary AC and a verification method | **Yes** — R1–R12 → AC1–AC10 |
| Scope protects existing behavior and names what must not change | **Yes** — §8, plus five stop conditions in §10.7 |
| Comparator shown able to fail | **Yes** — the 160-tuple property diff exits non-zero on any moved property, and unlike 691's it includes the real `AppImage` composition and the `scale` property, which is exactly what F-A escaped through |
| Pre-plant census / no further lifeline | **N/A** — no gate is authored here; the detector work is 746, deliberately excluded |
| No claimed command, file, value or behavior went uninspected | **Partial, stated.** §3.1–§3.4 were measured 2026-08-12; §3.3 was corrected mid-draft. The 160-tuple requirement is copied from the ledger's own declared scope, which the validator accepted. `.next` figures are from the post-change build and are marked for I0 re-derivation |
| Owner-only exceptions traceable | **Yes** — D28 is quoted from `docs/backlog.md` as the authorization for the selector/sourceOrder deltas; D36/D37 cited with dates. **OQ2 is left as an owner question rather than assumed** |
| Sprint assignment | **Yes** — Sprint 46, order 46.4 re-entry, saved inside `tasks/Sprints/` |
| Permanent Storybook creation gate | **N/A** — no story added or extended; both required stories already exist |
| No number duplicated | **Yes** — `691R` is a re-entry suffix closing with 691; 746/747 stay reserved and untouched |
| Dirty-worktree manifest | **Required** — §3.7; the tree starts dirty and the manifest must be recaptured at I0 |

---

## Handoff

Execute from this saved path using `.claude/skills/execute-task/SKILL.md`. Read the seven open findings in the v4
ledger before anything else — they are the specification, and this document only sequences them.

**Two things need the owner before you can finish:** the base-revision worktree for the BEFORE capture (§10.2), and
OQ2's decision on `(pointer: fine)`. Request both; implement neither on your own authority.
