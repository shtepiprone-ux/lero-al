# Task 748 — Clear the last 24 `--color-overlay*` utilities so 695's exit condition becomes reachable

**Kickoff path:** `tasks/Sprints/Sprint_46_kickoff_prompt_Task_748_OverlayUtilityExit_DeTailwind.md`
**Sprint:** 46 — ListingCard de-Tailwind + overlay exit, order **46.11**
**Executor:** Sonnet, via `.claude/skills/execute-task/SKILL.md`
**Filed:** 2026-08-13, after the 695 preflight measured its exit condition as unreachable
**Blocks:** **695** (Sprint 46.5). 695 cannot delete the `--color-overlay*` namespace while any utility generated from
it survives — this task removes the last 24.

---

## 1. Mode and task type

Implementation task. Type: **UI / Component — MIXED surface**, and the boundary is load-bearing:

| Side | Files | Rule bundle |
|---|---|---|
| **Current Mantine** | `LightboxView.tsx` · `MantineListingGalleryPattern.tsx` | `docs/mantine-responsive-design-system.md` · `docs/tailadmin-style-reference.md` |
| **Legacy shadcn/Tailwind** | `PerfDevOverlay.tsx` · `ListingGallery.tsx` · `ImageUpload.tsx` · `AdminUserAvatar.tsx` | `docs/ui-rules.md` · `docs/design-system.md` · `docs/component-rules.md` |

**Do not apply Mantine implementation details to the legacy four, and do not migrate any of them to Mantine.** This
task changes exactly one thing per site: where the overlay colour comes from. Everything else on every element stays
byte-identical.

**QA profile: `Q4 — Release/Critical Flow`.** Not because the change is large, but because
`docs/critical-flow-registry.md:105` names `ListingGallery.tsx` → `LightboxView.tsx` as a governed flow and this task
edits both. Clause 15 therefore requires the registry row's own regression evidence.

D19 · D28 · D34 · D35 · D36 all bind.

---

## 2. Objective

Replace the **24 surviving Tailwind overlay utilities** across **6 files** with CSS-module rules that reproduce their
compiled output exactly, consuming `var(--overlay)` / `var(--overlay-foreground)` from `:root`.

**You are not deleting any token.** `--overlay`, `--overlay-foreground`, `--color-overlay`, `--color-overlay-foreground`
all stay exactly as they are in `src/app/globals.css`. Deleting the `@theme inline` copy is **695**, and it may only run
after this task lands and proves the utility count is 0.

**You are not de-Tailwinding these files.** Only the overlay utilities move. A `rounded-full` or `px-3` next to a
migrated `bg-overlay/60` stays a Tailwind class.

---

## 3. Verified context

Measured 2026-08-13 against `HEAD` = `cc1f52f1c`, clean worktree. **Re-derive every count at I0 (§10.1); if the tree
disagrees, the tree wins.**

### 3.1 The census — 24 live sites, 12 distinct utilities

Comment mentions are excluded (they are not compiled from a `className`, but Tailwind's scanner does see them — see
§3.5).

| Utility | × | Family | Sites |
|---|---:|---|---|
| `text-overlay-foreground/70` | 5 | **D35 opacity-modifier** | `PerfDevOverlay.tsx:31, :56, :59, :74, :79` |
| `text-overlay-foreground` | 5 | plain | `PerfDevOverlay.tsx:46` · `ListingGallery.tsx:107, :120` · `ImageUpload.tsx:164` · `MantineListingGalleryPattern.tsx:57` |
| `bg-overlay/60` | 4 | **D35** | `ListingGallery.tsx:120` · `ImageUpload.tsx:164` · `MantineListingGalleryPattern.tsx:57, :80` |
| `bg-overlay/50` | 2 | **D35** | `ListingGallery.tsx:107` · `ImageUpload.tsx:114` |
| `bg-overlay/85` | 1 | **D35** | `PerfDevOverlay.tsx:46` |
| `bg-overlay/70` | 1 | **D35** | `ListingGallery.tsx:120` |
| `bg-overlay/30` | 1 | **D35** | `AdminUserAvatar.tsx:169` |
| `text-overlay-foreground/80` | 1 | **D35** | `LightboxView.tsx:87` |
| `text-overlay-foreground/60` | 1 | **D35** | `PerfDevOverlay.tsx:86` |
| `text-overlay-foreground/50` | 1 | **D35** | `PerfDevOverlay.tsx:50` |
| `text-overlay-foreground/40` | 1 | **D35** | `PerfDevOverlay.tsx:81` |
| `border-overlay-foreground/20` | 1 | **D35** | `PerfDevOverlay.tsx:64` |
| **Total** | **24** | 10 of 12 are D35 | 6 files |

Per file: `PerfDevOverlay` 11 · `ListingGallery` 5 · `MantineListingGalleryPattern` 3 · `ImageUpload` 3 ·
`LightboxView` 1 · `AdminUserAvatar` 1.

**Correction to the standing inventory.** `docs/backlog.md` and the Sprint 46 plan carry "33 across 7 files", of which
`LightboxView` is listed as 4. Measured: `LightboxView` has **1** live utility (`:87`); its `:74`, `:80` and `:83`
matches are inside a comment that explains why that component deliberately uses an inline `style` scrim instead of
`bg-overlay/95`. The real live total was **30**, Task 691 cleared its own **6**, leaving these **24**. Correct the
inventory when you update the backlog (§14.4) — do not restate 33.

### 3.2 Why this task exists at all

`695` deletes the `@theme inline` `--color-overlay*` namespace. In Tailwind v4 that namespace is what **generates**
`bg-overlay*` / `text-overlay-foreground*` / `border-overlay-foreground*`. Delete it while any of the 24 survive and
those elements silently lose their scrim or their text colour.

This is not a hypothesis. `src/app/globals.css:72-78` and `:461-470` carry the record of **Task 690**, where removing
the `@theme` copy degraded every opacity-modifier's static fallback to a bare, fully opaque `var(--overlay)`. Both
comment blocks end with **"Keep both copies"**. This task is what earns the right to change that.

### 3.3 Where the colour must come from afterwards

`src/app/globals.css:82-85` (`@theme inline`) and `:470-471` (`:root`) declare the pair twice, by design (D19).
**Your module rules must read the `:root` names — `var(--overlay)`, `var(--overlay-foreground)` — never
`var(--color-overlay*)`**, because the `--color-*` copy is exactly what 695 removes. Grep both definitions at I0 and
quote the matched lines; a documented token is not an implemented token.

### 3.4 D34 — the per-site cascade question, unresolved by design

For each of the 24 sites you must measure, not assume, whether the utility is currently the cascade **winner** for the
property it sets on that element:

- If it wins, reproducing it in an unlayered module rule changes nothing (D34's own wording).
- If it loses to unlayered CSS on the same element and property, moving it into an unlayered rule would **promote** it
  and change the rendered result — that is a D28 violation. Leave that site untouched, report it, and say which
  declaration beats it.

Highest risk sites: `LightboxView.tsx:87` and `MantineListingGalleryPattern.tsx:57, :80` sit inside Mantine components
whose own CSS is unlayered. The legacy four are plain `div`/`span` markup with no component CSS, so the utility is
expected to win — expected, not verified. Verify all 24.

### 3.5 D35 — ten of the twelve are opacity modifiers

Each compiles to **two** declarations: a static fallback plus an `@supports (color: color-mix(in lab, red, red))`
override. Reproduce **both, in that order**, never hand-flattened. Task 691's module is the worked precedent —
`src/design-system/mantine/patterns/MantineListingCardPattern.module.css:150-170` and its `@supports` siblings.

Compile the before-side yourself; do not transcribe. `.screenshots/task691-delta/compile-opacity-candidates.mjs` is a
working harness for exactly this and runs natively on this machine.

**A comment containing a utility string still feeds Tailwind's scanner.** After your change, `LightboxView.tsx`'s
comment still contains `bg-overlay/95`; that utility will keep being generated. Report it — 695 must decide whether to
rewrite those three comment lines or accept a generated-but-unused rule.

### 3.6 Story and rendered-proof coverage — asymmetric

| File | Canonical story | Rendered proof available |
|---|---|---|
| `ListingGallery.tsx` | `src/stories/patterns/mantine/ListingGalleryPattern.stories.tsx` | Yes |
| `LightboxView.tsx` | `src/stories/mantine/primitives/LightboxView.stories.tsx` | Yes |
| `MantineListingGalleryPattern.tsx` | **none** | compiled-CSS equivalence only |
| `ImageUpload.tsx` | **none** | compiled-CSS equivalence only |
| `AdminUserAvatar.tsx` | **none** | compiled-CSS equivalence only |
| `PerfDevOverlay.tsx` | **none**, and `docs/mantine-tailadmin-migration-tracker.md:84` classifies it `➖ non-visual` | compiled-CSS equivalence only |

**Do not create a story to manufacture evidence.** The create-task story gate is explicit: markup that exists only to
exercise a measurement is a probe, not a permanent artifact. For the four story-less files the proof is compiled
before/after equivalence plus the build gate, and the completion report must say so plainly rather than implying
rendered coverage it does not have.

### 3.7 Critical flow

`docs/critical-flow-registry.md:105` — *Listing-detail gallery lightbox stacking (portal + z-index)*, Task 612,
`ListingGallery.tsx` → `LightboxView.tsx`, with its own regression suite
`ListingGallery.portal.smoke.test.tsx`. This task does not touch stacking, portalling or z-index, but it edits both
components, so clause 15 binds: run that suite, record its actual result, and do not modify it.

### 3.8 Start state

`HEAD` = `cc1f52f1c`, `git status --porcelain` **empty** at filing. If it is dirty at I0, complete
`docs/orchestrator-dirty-worktree-manifest-template.md` for every entry before the first write.

---

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | 695 exit condition | Zero live `bg-overlay*` / `text-overlay-foreground*` / `border-overlay-foreground*` utilities remain in `src/**` `className` positions | P0 | AC1 | Confirmed |
| R2 | D28 | Every migrated site's computed colour is identical before and after | P0 | AC2 | Confirmed |
| R3 | D35 | Each of the 10 opacity-modifier utilities is reproduced as static fallback **plus** `@supports` override, same order, matching compiled output | P0 | AC3 | Confirmed |
| R4 | D34 | Every one of the 24 sites has a recorded winner/loser measurement; any loser is left untouched and reported | P0 | AC4 | Confirmed |
| R5 | §3.3 | Module rules read `var(--overlay)` / `var(--overlay-foreground)`, never `var(--color-overlay*)` | P0 | AC5 | Confirmed |
| R6 | §2 | No token is deleted, renamed or moved in `globals.css` | P0 | AC6 | Confirmed |
| R7 | §2 | No non-overlay utility, prop, structure or behaviour changes on any touched element | P0 | AC7 | Confirmed |
| R8 | Clause 15 | The registry's regression suite runs and its actual result is recorded | P0 | AC8 | Confirmed |
| R9 | §3.6 | Rendered evidence for the two story-backed surfaces; compiled-equivalence only for the other four, stated as such | P1 | AC9 | Confirmed |
| R10 | D36 | Retained zero-exit `npm run build`, `/[locale]` First Load JS at I0 and final, no increase | P1 | AC10 | Confirmed |
| R11 | §3.5 | The surviving `bg-overlay/95` comment mention in `LightboxView.tsx` is reported to 695 | P2 | AC11 | Confirmed |
| R12 | Standing | `typecheck` exit 0, gate transcripts retained, backlog ≤80 lines, session log | P1 | AC12 | Confirmed |

---

## 5. Assumptions and open questions

- **A1.** The four legacy files stay legacy. Giving a legacy file a CSS module is not a Mantine migration and does not
  make it Mantine-migrated; `docs/ui-rules.md` still governs them afterwards. Precedent:
  `src/modules/listings/components/ListingCard.module.css`, `FavoriteButton.module.css`.
- **A2.** 691's module is the reproduction precedent for the two-rule D35 form.
- **OQ1 — owner, not yours.** `PerfDevOverlay.tsx` holds 11 of the 24 and the migration tracker calls it non-visual and
  dev-only. If the owner would rather grant it a documented exception than migrate it, **695 cannot delete the
  namespace** and D19's expiry must be rewritten instead. **The owner chose to migrate it (2026-08-13). Implement it.**
  Record the question in the session log so the decision stays traceable.
- **OQ2.** Whether 695 rewrites the three `bg-overlay/95` comment lines in `LightboxView.tsx` or accepts a
  generated-but-unmatched rule. **Not yours** — report per R11.

---

## 6. Pre-read rule bundle

Always required: `docs/agent-contract.md` · `docs/rule-index.md` · `docs/qa-profiles.md` · `docs/backlog.md` ·
`docs/critical-flow-registry.md` — **read row `:105` in full; it governs two of your six files.**

Mixed UI, both sides: `docs/mantine-responsive-design-system.md` · `docs/tailadmin-style-reference.md` ·
`docs/ui-rules.md` · `docs/design-system.md` · `docs/component-rules.md` · `docs/qa-rules.md`.

Task-specific:

- `src/app/globals.css` `:70-90` and `:455-475` — the dual declaration and both "keep both copies" records.
- `src/design-system/mantine/patterns/MantineListingCardPattern.module.css` — the D35 two-rule precedent, and 691's
  module header for how a per-site D34 decision is written down.
- `docs/sessions/2026-08-12-task691R-remediation.md` §8 — the compiled before-side method.
- `docs/sessions/2026-07-30-task690-overlay-root-relocation.md` — what happens when the `@theme` copy goes early.
- `scripts/__tests__/overlay-dual-declaration.test.ts` — 692's gate. **Read it, do not edit it.** 695 updates it.
- The six files, all lines.

---

## 7. Scope

| Path | Action |
|---|---|
| `src/components/shared/PerfDevOverlay.tsx` | **modify** — 11 sites |
| `src/modules/listings/components/ListingGallery.tsx` | **modify** — 5 sites |
| `src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx` | **modify** — 3 sites |
| `src/modules/listings/components/ImageUpload.tsx` | **modify** — 3 sites |
| `src/modules/listings/components/LightboxView.tsx` | **modify** — 1 site |
| `src/components/admin/AdminUserAvatar.tsx` | **modify** — 1 site |
| `*.module.css` beside each of the six | **create** — one module per file, overlay rules only |
| `.screenshots/task748-overlay/` | **create** — compiled before-side, computed-style capture, transcripts |
| `docs/sessions/2026-08-13-task748-overlay-utility-exit.md` | **create** — session log |
| `docs/backlog.md` | **modify** — concise state, ≤80 lines |

---

## 8. Out of scope

- **Deleting, renaming or moving any token in `globals.css`** — that is 695, and doing it here breaks the build's
  colour output with no way to review the two changes apart.
- **`scripts/__tests__/overlay-dual-declaration.test.ts`** — 692's gate. 695 updates it; you read it.
- **Every non-overlay utility on every touched element.** `rounded-full`, `px-3`, `absolute`, `z-10`, `group-hover:*`
  and the rest stay exactly where they are.
- **Migrating any of the six components to Mantine.**
- **`CLOSED_OVERLAY_STYLE`** — 741. **The `@theme inline` deletion** — 695.
- Creating any Storybook story (§3.6).

---

## 9. Current and required behavior

**Current.** 24 elements take their scrim or overlay-text colour from Tailwind utilities generated by the
`@theme inline --color-overlay*` namespace. The namespace therefore cannot be removed, and 695 — the sprint's exit
condition — cannot run.

**Required.** The same 24 elements render byte-identical colours, sourced from module rules that read the `:root`
pair. `grep` for overlay utilities in `className` positions returns **0**. No other computed property, on any element,
in any of the six files, moves.

---

## 10. Implementation requirements

1. **I0 first.** `git status --porcelain`; re-derive §3.1's census with the exact command in §13 and record the real
   number; grep and quote both `globals.css` definitions per §3.3; `npm run build` and **retain the transcript** with
   `/[locale]` First Load JS.
2. **Compile the before-side for all 12 distinct utilities** from `globals.css` at `HEAD`, retained as a file. This is
   the reference every module rule is checked against, and the only rendered-independent proof the four story-less
   files will have.
3. **Measure D34 per site** before writing any rule (§3.4). Record winner/loser and the contesting declaration for
   every loser. A loser is left as a literal Tailwind class and reported — never migrated.
4. **Write one module per file**, containing only overlay rules. Reproduce the compiled form exactly, including the
   two-rule `@supports` shape for all 10 modifier utilities, and read the `:root` names.
5. **Capture computed styles before and after** for the two story-backed surfaces across the Q4 matrix, and diff per
   property. The comparator must **exit non-zero** on any moved property, errored or missing cell — a script that only
   writes JSON is a report, not an assertion.
6. **Run the critical-flow suite** (§3.7) and record its actual result.
7. **Stop conditions — report, never route around:** a D34-losing site; any moved computed property you cannot
   explain; any First Load JS increase; any need to touch `globals.css` or a non-overlay utility; a site whose colour
   cannot be reproduced without changing its value.

---

## 11. Positive and negative flows

**Positive.** A listing-detail gallery, its lightbox, an admin avatar's hover scrim, an upload thumbnail's hover scrim
and the dev perf overlay all render the same colours as before, while `--color-overlay*` has no remaining consumer.

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Validation · Authorization/RLS · Offline · Concurrent writer | **No** | Presentation-only; no action, route or data path changes | N/A | — |
| **`@supports` unsupported (static-fallback tier)** | **Yes** | D35, `globals.css:72-78` | The static fallback renders the same opaque-mixed colour the utility produced | Compiled before/after pair per utility |
| **Lightbox open — portal + stacking** | **Yes** | Registry `:105`, Task 612 | Unchanged; dialog still not a descendant of a positioned ancestor | `ListingGallery.portal.smoke.test.tsx` |
| **Hover scrims** (`ImageUpload:114`, `AdminUserAvatar:169`) | **Yes** | `group-hover:opacity-*` on the same elements | Unchanged — the opacity utility is not in scope and must keep working with the migrated background | Computed-style capture where a story exists; compiled equivalence otherwise |
| **Dev-only render** (`PerfDevOverlay`) | **Yes** | Tracker `:84` `➖ non-visual` | Renders only under its existing dev condition; that condition is untouched | Read the guard, quote it, do not change it |

---

## 12. Acceptance criteria

- **AC1 [R1]** — *Given* the final tree, *when* §13's census command runs, *then* it returns **0** live overlay
  utilities in `className` positions across `src/**`, and the count is quoted in the report.
- **AC2 [R2]** — *Given* the before/after computed-style capture, *then* every captured property is identical, diff
  count **0**, and the comparator exited non-zero-capable (prove it can fail).
- **AC3 [R3]** — *Given* the compiled before-side, *then* each of the 10 modifier utilities has its static fallback and
  `@supports` override reproduced in the same order, compared value by value against the compiled original.
- **AC4 [R4]** — *Given* the D34 pass, *then* all 24 sites have a recorded measurement; every migrated site was a
  winner; every loser is listed, untouched, with its contesting declaration named.
- **AC5 [R5]** — *Given* the six new modules, *then* `grep -c "var(--color-overlay"` across them is **0** and each
  overlay rule reads `var(--overlay)` or `var(--overlay-foreground)`.
- **AC6 [R6]** — *Given* `git diff src/app/globals.css`, *then* it is **empty**.
- **AC7 [R7]** — *Given* the diff of the six components, *then* every removed token is an overlay utility and every
  other class, prop and structural line is unchanged.
- **AC8 [R8]** — *Given* `npx vitest run src/modules/listings/components/__tests__/ListingGallery.portal.smoke.test.tsx`,
  *then* it passes and the transcript is retained; the test file itself is unmodified.
- **AC9 [R9]** — *Given* the Q4 evidence, *then* the two story-backed surfaces have rendered proof across the required
  matrix, and the report states explicitly that the other four have compiled-equivalence proof only.
- **AC10 [R10]** — *Given* the retained transcripts, *then* `npm run build` exits 0 at I0 and final and `/[locale]`
  First Load JS has not increased.
- **AC11 [R11]** — *Given* `LightboxView.tsx`'s surviving comment, *then* the report names `bg-overlay/95` as still
  scanner-visible and hands the decision to 695.
- **AC12 [R12]** — `typecheck` exit 0; `check:design-tokens`, `check:css-vars`, `check:stories`, `check:mojibake`,
  `check:file-integrity` each with a retained transcript and its real exit status; `docs/backlog.md` ≤80 lines;
  session log at the §7 path.

---

## 13. QA profile and verification plan

**`Q4 — Release/Critical Flow`**, because the task edits two components named in `docs/critical-flow-registry.md:105`.
Q3's visual matrix applies to the two story-backed surfaces; the four story-less files are covered by compiled
equivalence, and that asymmetry is declared, not disguised.

Census command — use exactly this, it excludes comments:

```powershell
node -e "const re=/\b(?:bg|text|border)-overlay(?:-foreground)?(?:\/\d+)?\b/g;const fs=require('fs'),p=require('path');let n=0;(function w(d){for(const f of fs.readdirSync(d,{withFileTypes:true})){const q=p.join(d,f.name);if(f.isDirectory())w(q);else if(/\.(tsx|ts|css)$/.test(f.name)){let s=fs.readFileSync(q,'utf8').replace(/\/\*[\s\S]*?\*\//g,'').replace(/^\s*\/\/.*$/gm,'');const m=s.match(re);if(m){n+=m.length;console.log(m.length,q)}}}})('src');console.log('TOTAL',n)"
```

Commands — record the actual result of each: I0 `git status --porcelain` · census · `npm run build` (I0, retain) ·
compile before-side ×12 · D34 measurement pass · edits · `npm run build-storybook` + before/after computed-style
capture + diff · `npx vitest run` the portal suite · `npx vitest run` full · `npm run check:design-tokens` ·
`check:css-vars` · `check:stories` · `check:mojibake` · `check:file-integrity` · `npm run typecheck` ·
`npm run build` (final, retain) · census again.

Anything that cannot run in your environment is `PARTIALLY IMPLEMENTED`, never a pass.

---

## 14. Completion report contract

Report `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`. **Never self-approve.**

1. Changed files reconciled against the real final `git status --porcelain`.
2. Requirement IDs completed; any not completed, with why.
3. Every §13 command with its **actual** result and its retained transcript path.
4. The census: I0 count, final count, and the corrected inventory figure for the backlog — **24 live, not 33**.
5. The per-site D34 table: all 24 sites, winner or loser, contesting declaration for every loser.
6. The compiled-vs-module comparison for all 12 distinct utilities.
7. `/[locale]` First Load JS at I0 and final, delta stated explicitly.
8. Which surfaces have rendered proof and which have compiled equivalence only — stated plainly.
9. `bg-overlay/95` comment status for 695 (R11), and OQ1 recorded.
10. Assumptions, deviations, limitations. **This kickoff's own facts are not exempt** — §3.1 was measured on
    2026-08-13; if a site moved, the tree wins and the deviation is reported.

---

## 15. Task quality gate

| Check | Result |
|---|---|
| Executable by a fresh Sonnet with no chat context | **Yes** — every site, count and command is in §3 and §13 |
| Every primary requirement has a binary AC and a verification method | **Yes** — R1–R12 → AC1–AC12 |
| Scope protects existing behavior and names what must not change | **Yes** — §8 plus five stop conditions in §10.7 |
| Comparator shown able to fail | **Required of the executor** — AC2 makes non-zero-exit capability part of the criterion, after 691's comparator shipped able only to report |
| Current/legacy boundary explicit | **Yes** — §1's table; the legacy four stay legacy (A1) |
| Canonical UI decision record | **`reuse` for all 24 sites** — the shared source is the existing `:root` overlay pair, consumed directly; no new token, primitive or story is created, and §3.6 records why no story is added |
| Permanent Storybook creation gate | **N/A** — no story added or extended; the two existing ones are used as-is |
| Owner-only exceptions traceable | **Yes** — D19/D28/D34/D35/D36 cited with dates; OQ1's route chosen by the owner 2026-08-13 |
| Sprint assignment | **Yes** — Sprint 46, order 46.11, saved inside `tasks/Sprints/` |
| No number duplicated | **Yes** — 748 was `NEXT FREE`; registry moves to 749 |
| No claimed command, file, value or behavior went uninspected | **Partial, stated.** §3.1/§3.3/§3.6/§3.7 were measured 2026-08-13 against `cc1f52f1c`. §3.4's per-site D34 result is **deliberately unmeasured by the author** and assigned to the executor — the kickoff states the expectation and requires the measurement, it does not assert the outcome |

---

## Handoff

Execute from this saved path using `.claude/skills/execute-task/SKILL.md`.

**One thing to internalise before you start:** the reason this task exists is that Task 691's review found a regression
no comparator in that task could structurally see. Your comparator is the one that has to see this one. If a colour
moves and your capture cannot show it, the capture is the defect — say so rather than reporting a zero.
