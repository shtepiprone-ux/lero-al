# Task 763 — retained evidence preflight, rule-compliance ledger and execution contract

Companion artifact to `Sprint_63_kickoff_prompt_Task_763_AppImage_De_Tailwind.md`.
Author: Opus, task design. Measured 2026-08-21 against `main` @ `201683f9d`, worktree clean.

---

# Part A — Evidence-first preflight

## A.1 Scope and execution state

| Field | Value |
|---|---|
| Task / review | Task 763 — `AppImage` de-Tailwind |
| Mode | `TASK DESIGN` |
| Execution state | `from-scratch` |
| Exact start step | §10.0 I0 freshness re-measure |
| Reused artifacts | `scripts/check-tailwind-runtime-tokens.mjs` (Task 762, gate + baseline) · `src/components/shared/HeroSearchView.module.css` (D34 header shape and N1 convention) · existing stories listed in kickoff §3.5 |
| Artifacts that must not be overwritten | `scripts/tailwind-runtime-token-baseline.json` · `src/app/globals.css` · every `*.stories.tsx` · `src/app/[locale]/layout.tsx` |
| Owner decision required? | no — the 2026-08-21 decision quoted in kickoff §1 resolves the only open route |

## A.2 Requirement-to-evidence map

| Requirement / AC | Observable claim | Source inspected | Producing command and real output | Scope | Status |
|---|---|---|---|---|---|
| R1 / AC1 | 21 Tailwind strings live in `appImageConfig.ts` at 9 named variants | `src/components/ui/appImageConfig.ts:62-184` read in full | `cat -n` — lines 64,65,66,78,79,90,91,102,103,114,115,127,128,129,146,147,148,160,161,172,173 | whole file | `VERIFIED` |
| R2 / AC2 | 4 Tailwind strings live in `AppImage.tsx` | `src/components/ui/AppImage.tsx:119-157` read in full | `cat -n` — lines 122 (`cn(containerClass, className)`), 144, 148, 149 | whole file | `VERIFIED` |
| R3 / AC3 | `AppImageProps` has 8 fields; `ImageVariant` has 9 members; `VARIANTS` has 9 keys | `AppImage.tsx:18-51`, `appImageConfig.ts:11-20,62-184` | `cat -n` | whole declarations | `VERIFIED` |
| R4 / AC4 | LQIP/preload/predictive/tier logic occupies lines 63-141 and is untouched by the class change | `AppImage.tsx:63-141`, `useAdaptiveImageConfig.ts:1-120` | `cat -n` both files | complete hook body incl. the hook-order comment at 101-104 | `VERIFIED` |
| R5 / AC5 | The compiled declarations of the 19 utilities are recoverable from built CSS | precedent: `HeroSearchView.module.css:1-52` header documents an I1 extraction from `storybook-static/assets/iframe-DnJgGJJb.css` | not re-run by the author | Storybook + Next built CSS | `ASSUMED` — deliberately deferred to executor I1; the kickoff labels A1/A2 and requires measurement |
| R6 / AC6 | Cascade layering changes which rule wins against Mantine's unlayered `:where()` rules | `HeroSearchView.module.css:30-51` — the Task 709-R corrected mechanism, incl. the retracted specificity claim | file read in full | the D34 rule and its stated inverse (6 tasks that must stay unlayered) | `VERIFIED` |
| R7 / AC7 | `'group'` at `MantineListingCardPattern.tsx:304` exists solely to serve `AppImage`'s `hoverClass` | `MantineListingCardPattern.tsx:298-310` read; the in-file comment names 691R finding F-A | `sed -n '300,330p'` | the `cn()` argument list | `VERIFIED` |
| R8 / AC8 | `--color-muted` is `@theme inline`; `--muted` is `:root` | `globals.css:35` (`@theme inline` open), `:316` (close), `:327` (`:root` open), `:371` (`--muted`), `:462` (close) | brace-matched extraction + `grep -n` | both blocks | `VERIFIED` |
| R8 / AC8 | The 762 gate classifies `--color-muted` as `project` and will not flag it | `check-tailwind-runtime-tokens.mjs:248-256` `classifyName`, and `loadTailwindOwnedNames()` returning 412 names not incl. `--color-muted` | `node` harness calling the module's exports | ownership buckets 1-3 | `VERIFIED` |
| R8 / AC8 | Expected post-change gate reading is 24 files / 14 refs / 0 / 0 | `collectModuleCssFiles` (line 302) counts `src/**/*.module.css`; current run reports 23 | `node scripts/check-tailwind-runtime-tokens.mjs` → *"scanned 23 … found: 14 | baseline entries: 14 … ✅ 0 new debt, 0 stale"*, exit 0 | whole repo | `VERIFIED` — 24 is 23 + the one file this task creates |
| R10 / AC10 | Stories rendering `AppImage` are exactly two direct + four indirect | `grep -rln "AppImage" src/stories/` → `PopularLocationsView.stories.tsx`, `ListingCardPattern.stories.tsx`; `ls src/stories/{mantine/primitives,patterns/mantine}` for the indirect set | grep + ls | `src/stories/**` | `VERIFIED` |
| R10 | `preview` / `upload` / `avatar` have no story | per-variant `grep -rl 'variant="<v>"' src/` returns only production files: `StepPreview.tsx`, `ImageUpload.tsx`, `AdminCompaniesManager.tsx` | grep, all 9 variants | `src/**` | `VERIFIED` — see A.2b |
| R11 / AC11 | Restoration evidence must be `git hash-object` + porcelain absence | `.claude/skills/create-task/SKILL.md` → "Permanent Storybook story creation gate" | file read | the gate's own wording | `VERIFIED` |
| R12 / AC12 | `npm run build` is a mandatory non-Q0 gate | `docs/backlog.md` standing-governance block; `create-task/SKILL.md` §"Define the implementation contract" item 9 | files read | project-wide | `VERIFIED` |
| Consumer count | `AppImage` has 14 production consumers | `grep -rln "AppImage" src/` → 24 paths, minus 4 self/config/lib files, minus 3 test files, minus 2 story files, minus 1 `.module.css` reference | grep | `src/**` | `VERIFIED` |

## A.2b — Absence claims

| Claim | Property identity and enclosing declaration | Runtime reads | Constructors / forwarding | Search + contrary probe | Conclusion |
|---|---|---|---|---|---|
| `'group'` at `MantineListingCardPattern.tsx:304` is dead **once `hoverClass` stops being a Tailwind utility** — and only then | It is not a prop: it is a positional string argument to `cn()` inside the `Card`'s `className`, `MantineListingCardPattern.tsx:298-307` | `.group:hover .group-hover\:scale-105` and `.group-hover\:brightness-95` in the built CSS — the only readers of the marker | Supplied at exactly one site; `AppImage`'s `hoverClass` (`appImageConfig.ts:66,129,148`) is the only consumer of the descendant half | `grep -rn "'group'\|\"group\"\| group " src/` for other marker sites; contrary probe: the in-file 691R comment asserts the coupling and the F-A finding records what happened when it was absent | `VERIFIED conditional` — dead **after** R7's replacement selector lands, not before. The kickoff sequences the two into one commit for exactly this reason. |
| `--container-3xl` has no project declaration | Tailwind theme token, `node_modules/tailwindcss/theme.css` → `--container-3xl: 48rem` | `HeroSearchView.tsx:50` (`maw=`), `HeroSearchView.module.css:16` (comment only) | none | `grep -rn -- "--container-3xl\s*:" src/` → empty; `loadTailwindOwnedNames()` → `true` | `VERIFIED absent from the project` — **Phase 3 scope, not this task** |
| `--radius` is **not** Tailwind-owned despite appearing in `theme.css` | `theme.css:508` sits inside `@theme default inline reference` ("Deprecated"); `globals.css:445` declares `--radius: 0.75rem` in plain `:root` | 3 `.module.css` files + `input-group.tsx` | — | Contrary probe: called `loadTailwindOwnedNames()` and asserted membership — `--radius → false`, `--radius-lg → true`. This overturned the author's own first-pass regex census, which had reported `--radius` as Tailwind-owned | `VERIFIED project-owned` — recorded so the next session does not re-open it |
| No Tailwind class remains in the `/[locale]` graph beyond the six files named in the sprint plan | 110-file barrel-resolved render graph | string-literal sweep with comments stripped | — | Every surviving hit opened by hand; false positives (Mantine prop values, `HeaderView.tsx:170`'s comment, `CITY_GRADIENTS`) enumerated in the sprint plan | `VERIFIED within the sweep's stated limit` — the limit (a Tailwind string assigned far from its use site) is written into the sprint plan's provenance section |

## A.3 Command and artifact contract

| Command | Real output at design time | Used for |
|---|---|---|
| `git rev-parse HEAD` | `201683f9d` | every "measured against" claim |
| `git status --porcelain` | empty | clean-worktree assertion; kickoff §10.0 comparator |
| `git rev-parse --abbrev-ref HEAD` / `@{u}` | `main` / `origin/main` | Git handoff values |
| `node scripts/check-tailwind-runtime-tokens.mjs` | 23 scanned · 14 found · 14 baseline · 0 new · 0 stale · exit 0 | AC8's expected numbers |
| `node` harness → `loadTailwindOwnedNames()` | 412 names, `tailwindcss@4.3.0`, `--radius:false`, `--radius-lg:true`, `--container-3xl:true`, `--text-sm:true`, `--font-mono:true`, `--spacing:true` | ownership classification |
| barrel-resolved import walk from `layout.tsx` + `page.tsx` | 110 `.ts`/`.tsx`, 16 `.module.css` | render-graph scope |
| naive import walk (same roots) | 143 files | recorded as the contrast that motivates Sprint 59 |
| comment-stripped string-literal sweep over the 110 files | 6 files carry real Tailwind classes | sprint plan Class-1 table |
| `@theme inline` / `:root` brace-matched extraction + `var()` census | Class-2: 5 module files (14 refs) + 2 `.tsx` (6 refs); Class-3: 43 refs | sprint plan Class-2/Class-3 tables |

**Not run at design time, deliberately:** `npm run build`, `npm run build-storybook`, any rendered capture. The I1
extraction they feed is the executor's first phase by owner decision. No kickoff fact depends on them; A1 and A2
are labelled `INFERENCE` precisely because they do.

## A.4 Contradictions and rejected premises

1. **Rejected:** "Homepage is Mantine-first and only `AppImage` remains." `MantineListingCardPattern.tsx:304-306`
   ships three Tailwind strings in production. Recorded in the sprint plan; `docs/backlog.md`'s
   "ⓑ De-Tailwind (D28): ✅ COMPLETE for the homepage card pair" is measurably false and is raised as owner
   decision **D63-B** rather than silently corrected.
2. **Rejected:** "The runtime debt is the 14 baseline pairs." The baseline covers one ownership bucket over 23
   files. 43 further references in the same route belong to a class the gate's own header names as unclosed.
3. **Corrected in flight:** the author's first-pass census reported `--radius`, `--spacing`, `--leading-tight` and
   `--container-3xl` as un-baselined Tailwind-owned references in `.module.css` files — which would have been a
   third gate bypass. Re-running with the gate's own comment-stripping and calling its own exported classifier
   showed all four were either comment text or project-owned. **The regex agreed with the hypothesis; the gate's
   own code did not.** Recorded because it is the same failure shape `docs/backlog.md`'s standing note describes.
4. **Reordered:** the owner's proposed order put the route shell second and the runtime tokens third. Measurement
   moved the gate extension ahead of both: four `.tsx` Class-3 references and six Class-2 references sit in files
   `check:tailwind-runtime-tokens` does not read, so fixing them first would be unmeasured. Sprint plan §"Execution
   order" states this.

---

# Part B — Unwaivable rule-compliance ledger

| Rule source and exact clause | Applicability evidence | Exact mandatory outcome | Evidence artifact / command | Result |
|---|---|---|---|---|
| `CLAUDE.md` → "Task and review rules": every task belongs to a sprint; kickoff at `tasks/Sprints/Sprint_NN_kickoff_prompt_Task_NNN_<Slug>.md` | New implementation task, number 763 > 706 | Save under `tasks/Sprints/`, never `tasks/` root; add its row to the sprint's Tasks table | Sprint 63 opened with goal, task table, execution order, exit criteria; kickoff filed at the required path; row present | `COMPLIANT` |
| `create-task/SKILL.md` → "Sprint assignment — blocking": if nothing fits, open the next sprint first | Goal-fit test run against 46/55/56/57/59/61/62 | Open a numbered sprint with its own plan file before writing the kickoff | Goal-fit table in the sprint plan, incl. Sprint 62's own written out-of-scope boundary | `COMPLIANT` |
| `docs/backlog.md` → registry: "Last used **762**, NEXT FREE **763**" | A number must be issued | Take the next free number; update the registry line | 763 issued; registry line moved to **NEXT FREE 764** in the same edit | `COMPLIANT` |
| `create-task/SKILL.md` → required task document structure (15 headings) | Every kickoff | Use the 15 headings verbatim | Kickoff §1-§15 | `COMPLIANT` |
| `create-task/SKILL.md` → "Permanent Storybook story creation gate — blocking" | 3 of 9 variants have no story | Reuse, or reversible probe with pre-probe `git hash-object` and porcelain absence as the retained evidence; `create canonical` requires a named consumer or quoted owner authorization | Kickoff §10.5 + AC11; no `create canonical` disposition taken | `COMPLIANT` |
| `create-task/SKILL.md` → item 9: every non-Q0 plan includes the final `npm run build` hard gate with its zero-exit transcript | Q3 task | Require the transcript; a failed/unrun build permits only `PARTIALLY IMPLEMENTED` or `BLOCKED` | AC12 + §13 command table + §14 report contract | `COMPLIANT` |
| `docs/qa-profiles.md` → profile selection | Migrated shared primitive, LCP path, 14 consumers | Name one profile and the exact evidence | `Q3`, with the reason Q2 is insufficient stated | `COMPLIANT` |
| `docs/qa-profiles.md` → "Per-story viewport sets are not uniform" | Rendered matrix claimed | Read the tier's widths out of the manifest before claiming coverage | §13 states this requirement to the executor | `COMPLIANT` |
| Sprint 62 binding rule, inherited as Sprint 63 rule 1: the control ships before or with the fix | New styling mechanism | Two-armed plant that demonstrably fails + pre-plant census | §10.6 P1/P2 + AC9 | `COMPLIANT` |
| Sprint 63 rule 2 (from 724 ②): exemptions are conditions a gate evaluates, never comments an author writes | `check:design-tokens` may reject a raw literal from A2 | No `design-tokens-allow:` marker may be added to pass | §5 A2 and §13 both require reporting a `CONFLICT` instead | `COMPLIANT` |
| D34 (Sprint 49 §3), as stated in `HeroSearchView.module.css:30-51` | New `.module.css` replacing utilities | A D28 migration reproduces the utility's losing standing (`@layer utilities`); state which case the file is | R6 + §10.3.1 require the header to state it | `COMPLIANT` |
| N1 (Task 707 P3): reproduce the token reference, never the resolved value | Module writes token-bearing declarations | `padding: var(--space-3)`, never `0.75rem` | Sprint rule 3 + §10.3.1 | `COMPLIANT` |
| `docs/performance.md` — LCP rules | `AppImage` is the LCP render site | Priority-image first-paint behaviour must be preserved and proven | §9 preservation table + N4 + AC4 | `COMPLIANT` |
| `eslint.config.mjs` `IMAGE_RENDER_EXCEPTIONS` / `next/image` ban | `<img>` is touched | Keep the native `<img>` and its approved eslint-disable | §8 out-of-scope; owner decision §1 | `COMPLIANT` |
| `docs/critical-flow-registry.md` | Must be scanned | Scan for affected flows; escalate to Q4 if one is named | §13 requires the scan at I0 and states the escalation | `COMPLIANT` |
| `create-task/SKILL.md` → "A documented token is not an implemented token — grep the definition, never the table" | Token targets named | Grep each token's definition | §3.6 carries each token's `globals.css` line and declaring block, grepped | `COMPLIANT` |
| `docs/component-rules.md` — container/presentational split, no-duplicate | Shared primitive changed | No duplicate component; no behaviour moved across the split | §8 forbids structural change; §9 preservation table | `COMPLIANT` |
| `CLAUDE.md` → Git policy: mutating git is owner-only, native PowerShell | Artifacts created | Emit an explicit-path owner-run handoff; never execute | Handoff emitted in the session response with verified remote/branch | `COMPLIANT` |
| `docs/rule-index.md` — minimal bundle, never "read all docs" | Executor pre-read | Name the exact bundle | §6 | `COMPLIANT` |
| `docs/ai-behavior.md` → Backlog & Session Log Rules | Executor will write records | Concise backlog state; detail in the session log | §14 item 9 | `COMPLIANT` |

No row is `BLOCKED`. No row was satisfied by an alternative mechanism.

---

# Part C — Executable task contract

## C.1 One active execution route

| Field | Value |
|---|---|
| Task | 763 — `AppImage` de-Tailwind |
| Active route | Native `<img>` wrapper retained; Tailwind strings replaced by semantic classes in a new `src/components/ui/AppImage.module.css`; `group`/`group-hover` pair closed in the same commit |
| Decision source, date, scope | Owner, 2026-08-21, quoted verbatim in kickoff §1. Scope: `AppImage` only — explicitly rejects Mantine style props and a separate preflight task |
| Starting worktree mode | clean isolated (`git status --porcelain` empty at `201683f9d`); §10.0 re-verifies and requires the dirty-worktree manifest otherwise |
| Exact allowed final write set | the 7 paths in kickoff §7 |
| Blocked rule or decision | none |

## C.2 Checkpoint matrix

| # | Preconditions and preserved inputs | Writes allowed | Observable result | Producer and persisted artifact | Comparator and failure behaviour |
|---|---|---|---|---|---|
| 0 | none | none | I0 facts reproduce §3, or drift is enumerated | `git status --porcelain`, `git rev-parse HEAD`, `node scripts/check-tailwind-runtime-tokens.mjs`, `cat -n` on the two source files | String equality against §3's table. Non-empty porcelain → dirty-worktree manifest required before any write. Any drift → reported before acting, never absorbed |
| 1 | checkpoint 0 clean | none (build output only) | Every one of the 19 utilities has its compiled rule recorded, or is `UNKNOWN` | `npm run build` + `npm run build-storybook`; `docs/sessions/evidence/task763/i1-utility-extraction.md` | A utility with no row is `UNKNOWN` and blocks its dependent module rule. "Emits nothing" is only acceptable with the searched file named and its content quoted |
| 2 | checkpoint 1 complete | none | Pre-edit computed styles for container + `<img>` at every §3.5 story, rest and hover, priority and not | `npm run screenshots:responsive -- --mantine-only`; `docs/sessions/evidence/task763/i2/` | Baseline is empty ⇒ **fail closed**: a zero-cell capture is a producer failure, not a valid empty baseline. Every custom property is recorded with both its declaration and its resolved value |
| 3 | checkpoints 1-2 complete | kickoff §7 paths 1-4 | Zero Tailwind strings in the two source files; `'group'` removed; module created and layered | editor; `git diff` | `git diff --stat` write set ⊆ §7. Any extra path → stop |
| 4 | checkpoint 3 complete | none | Post-edit matrix identical to checkpoint 2 per §10.4's pass rule | same producer as checkpoint 2; `docs/sessions/evidence/task763/i4/` + a machine-readable cell diff | Cell-by-cell string equality on the named property set. **An unresolved custom property on either side is FAIL, not match.** Non-zero delta → enumerate cause, fix or escalate; the executor may not self-accept a delta |
| 5 | checkpoint 4 green | plant mutations, reverted | P1 and P2 each observed red, then clean after revert | the checkpoint-4 comparator and AC7's hover capture; both transcripts retained | A plant that passes ⇒ the apparatus is broken ⇒ `BLOCKED`. Pre-plant census must name zero other gates catching each arm, or name the ones that do |
| 6 | checkpoint 5 complete | §7 paths 5-7 | Every §13 command run with actual output; `npm run build` exit 0 | the §13 command table; transcripts in the session log | Non-zero exit on any gate ⇒ `PARTIALLY IMPLEMENTED` or `BLOCKED`, never `IMPLEMENTED` |
| 7 | checkpoint 6 complete | none | `git status --porcelain` shows exactly §7's paths and no `*.stories.tsx` | `git status --porcelain`; probe `git hash-object` values | Any story path present, or a hash mismatch ⇒ AC11 fails |

**Dynamic-count formulas.** Gate file count = `23 (I0 measured) + 1 (this task's module) = 24`; the task-created
file is placed in the formula, not discovered by the scan. Class-3 inventory count = the number of `@theme inline`
names the new module references — **zero is a valid, expected result and must not be rejected as a missing
artifact**; the report writes `None`.

## C.3 Required counterexample trace

| Contract claim | Counterexample | Evidence | Required outcome | Result |
|---|---|---|---|---|
| Single active route | Executor prefers Mantine `Box` props for the container | Owner decision §1 forbids it and states the reason (CSS-priority divergence across 14 consumers) | Route is blocked; a change needs a new owner decision and a new contract | `ANALYTICAL` |
| Stateful baseline | Checkpoint 2 produces zero cells | §10.4 + C.2 row 2 | Fail closed — distinct from a legitimately empty result, of which there is none here | `ANALYTICAL` |
| Status/diff assertion | An unrelated pre-existing modified path appears | §10.0 pre-write porcelain snapshot as the comparator | Comparator rejects it; manifest required | `ANALYTICAL` |
| New mechanism (module + layer) | P1 geometry mutation; P2 hover-rule deletion | §10.6 | Observed failure, then clean recovery | **`ANALYTICAL` at design time — the executor must record it `EXECUTED` with commands and output.** No gate is certified as tested by this document |
| Task-created artifact enters a baseline | `AppImage.module.css` counted as pre-existing debt | AC8 expects 24 files, formula stated in C.2 | Count difference detected rather than absorbed | `ANALYTICAL` |
| Absence claim | `'group'` removed while a second consumer still needs it | A.2b row 1: single supply site, single descendant consumer, contrary probe run | Removal is conditional on R7's replacement landing in the same commit | `EXECUTED` (grep census run and recorded) |

## C.4 Publication gate

Rebuilt from the final kickoff text after the last revision: the active route, the §7 write set, and the C.2
checkpoint matrix reconstruct without reference to any revision summary. Every checkpoint names a producer, a
persisted artifact, a comparator and a failure behaviour. The two `ANALYTICAL` plant rows are marked as such and
are **not** presented as evidence that the apparatus works — that is the executor's checkpoint 5 deliverable, and
the kickoff makes an unfailing plant a `BLOCKED` outcome rather than a pass.

The author does not approve this task. Status at publication: **KICKOFF FILED — awaiting execution**, then
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` at best from the executor.
