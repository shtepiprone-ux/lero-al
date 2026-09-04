# Task 784 — zero raw design dimensions in the current Mantine scope

**Sprint:** 69 · **Priority:** P1 · **QA profile:** **Q3** · **Filed:** 2026-09-04 · **State:** KICKOFF FILED

---

## 1. Mode and task type

`TASK DESIGN` → implementation kickoff. Type: **current Mantine design-system remediation** with a
scope-preserving detector addition, canonical Storybook proof, and rendered UI verification.

Executor: fresh Sonnet using `.claude/skills/execute-task/SKILL.md`. Strongest permitted result is
`IMPLEMENTED — AWAITING ORCHESTRATOR REVIEW`; no self-approval and no mutating Git. Sprint 69's frontend
exception applies: no review ledger. Required evidence is the session log, detector transcripts, tests,
Storybook/build output, and rendered QA.

---

## 2. Objective

Close every `check:design-tokens` finding in the **current Mantine scope only**, using existing canonical
Mantine tokens, theme contracts, component defaults, responsive values, or Mantine-backed CSS variables.
Canonical Mantine stories must contain no named Tailwind dimension utility.

The final scoped command reports **zero** raw findings, **zero** stale markers, and **zero** missing-reason
errors. Legacy sources are explicitly out of scope and may continue to make the existing global strict command
fail. The task must not migrate, restyle, suppress, or otherwise touch them incidentally.

**No hardcode:** a Mantine consumer, CSS module, story, inline style, media-condition string, generated metadata
object, helper, or local alias may receive a raw design value. Do not hide a literal in another form. A missing
existing canonical contract is a stop-for-owner-decision, never permission to invent a value or bypass the gate.

---

## 3. Verified context and exact scope

### 3.1 The problem with the global detector

The expanded `npm run check:design-tokens` is deliberately global: it reports current Mantine code and legacy
code together. Its present non-zero result therefore cannot be Task 784's completion metric. Treating every
global finding as a Mantine migration would incorrectly pull legacy surfaces into this task.

The default command, its strict behavior, categories, marker checks, production scan, and canonical-story scan
remain authoritative and unchanged. This task adds an **additive** `--scope=mantine` mode; it does not weaken
the default command or make the global result quieter.

### 3.2 Exact membership

`--scope=mantine` must select exactly this union:

1. every path read from `scripts/mantine-migration-scope.json`;
2. every production source file under `src/design-system/mantine/**`; and
3. every canonical Mantine story under `src/stories/mantine/**` and
   `src/stories/patterns/mantine/**`.

The membership is path-derived, not hand-maintained in the detector. A manifest entry remains in scope even
when it carries a small legacy residue; that does **not** authorize its broader legacy migration. In particular,
Header/Footer's detector findings are in scope only because their source paths are already in the manifest.
Their `container-wide` utility and any header/footer container rewrite are not detector findings and are
explicitly outside Task 784.

No transitive imports, non-Mantine story, test, global stylesheet, or source outside this exact union may be
silently included. Do not add a component to the manifest to expand this task.

### 3.3 Required detector proof

Before a Mantine consumer is edited, add red/green tests proving that `--scope=mantine`:

- includes a manifest entry;
- includes a design-system source;
- includes a canonical primitive story;
- includes a canonical pattern story;
- excludes a representative legacy source; and
- leaves the default global scan behavior unchanged.

The scoped mode applies every existing detection category and every stale/missing-marker check to its selected
files. It is a membership filter over the current detector, never a parallel or reduced rule set.

### 3.4 Canonical sources — use, do not clone

| Need | Canonical source |
|---|---|
| Layout rhythm | Named Mantine `spacing` props and existing responsive breakpoints |
| Typography and radius | Mantine `fontSizes`, `lineHeights`, `radius`, and component defaults |
| Icon/control floor | typed `theme.other.iconSize` and `theme.other.touchTarget` |
| Fixed semantic box | typed `theme.other.boxSize`, only when its role actually matches |
| CSS-only style | emitted Mantine CSS variables and component contracts |
| Accessible hidden content | Mantine visually-hidden primitive, not off-screen geometry |

`src/design-system/mantine/theme.ts` is the existing, typed source of these contracts. Consumer code may use a
name from it; it may never reproduce the underlying design value. Adding a new scale rung, local token, or
fresh theme value is out of scope.

### 3.5 Binding decisions

- **D69-6:** hardcoded design values migrate to canonical Mantine tokens.
- **D775-A/B/C:** current Mantine surfaces use the existing responsive/TailAdmin contract, never a legacy
  literal or legacy spacing reference.
- **D68-2:** rendered acceptance is differential; baseline B precedes the consumer edits and every new failure
  blocks completion.
- **D69-15:** Task 784 is restricted to the exact §3.2 union. Legacy findings are not migrated or suppressed.

---

## 4. Requirements

| ID | Requirement | Priority | Verified by |
|---|---|---|---|
| R1 | Implement an additive `--scope=mantine` detector mode with exactly the §3.2 membership and test it from both positive and negative directions. | P0 | AC1 |
| R2 | Every fresh scoped finding is resolved with an existing canonical Mantine contract; the final scoped strict run is zero. | P0 | AC2 |
| R3 | No consumer hardcode, local numeric alias, raw fallback, new theme value, new scale rung, allowlist entry, or inline suppression is added. | P0 | AC3 |
| R4 | The default global detector retains its current scan, categories, strict behavior, and tests; global legacy findings are neither hidden nor remediated. | P0 | AC4 |
| R5 | Canonical Mantine stories consume Mantine primitives/theme values and contain no named Tailwind dimension utility. | P0 | AC5 |
| R6 | Scoped responsive/media/metadata cases consume existing named Mantine contracts and preserve their emitted/runtime behavior. | P0 | AC6 |
| R7 | No URL, query, data, auth, server-action, localization, metadata, or accessibility contract changes. Intentional canonical visual deltas are recorded and rendered-verified. | P0 | AC7 |
| R8 | No changed production source falls outside §3.2, apart from the detector/test/docs files required to add and prove scope mode. | P1 | AC8 |

---

## 5. Mandatory pre-read and start condition

Read before editing:

1. `docs/agent-contract.md`, `docs/design-system.md`, `docs/mantine-responsive-design-system.md`,
   `docs/tailadmin-style-reference.md`, `docs/qa-rules.md`, and `docs/storybook-governance.md`.
2. `tasks/Sprints/Sprint_69_Listings_Finishes_The_Mantine_Migration.md` and this kickoff.
3. `scripts/check-design-tokens.mjs`, its unit tests, and `scripts/mantine-migration-scope.json`.
4. `src/design-system/mantine/theme.ts` and the source/story for every fresh scoped finding.

**First action:** confirm that the detector extension and prerequisite Sprint 69 diffs are committed, isolate the
worktree, run the default global detector, and retain its output as the out-of-scope witness. Do not use a dirty
or unrelated checkout as baseline B.

---

## 6. Scope

### Included

- The complete fresh output of `--scope=mantine` for the exact §3.2 union.
- The detector CLI/filter and unit tests necessary to make that scoped result reproducible.
- Direct canonical stories and focused tests needed to prove an in-scope component change.
- Session evidence and Sprint 69 task-state reporting required by the execution contract.

### Explicitly excluded

- Any legacy production source outside §3.2, regardless of the global detector's finding count.
- Header/Footer `container-wide` removal, container/gutter redesign, or a broader header/footer migration.
- Adding paths to `mantine-migration-scope.json`, creating components/primitives, or changing unrelated stories.
- Weakening detector categories, default scan paths, marker validation, strict behavior, thresholds, or output.
- `design-tokens-allow` markers, allowlist changes, raw literals, local token clones, and value-carrying helpers.
- Product behavior, routes, URL state, queries, server actions, translations, and unrelated cleanup.

---

## 7. Canonical implementation rules

1. **Classify every scoped finding first.** Record source/line, visual role, current primitive, existing
   canonical candidate, selected disposition, proof surface, and expected visual delta.
2. **Prefer a Mantine default or named prop.** Remove a redundant local override before selecting a theme role.
   A semantic role wins over a same-looking value.
3. **Use existing theme roles by meaning only.** `iconSize`, `touchTarget`, and `boxSize` are not generic
   escape hatches. If no existing role fits, stop for an owner decision.
4. **No raw inline style migration.** Use a Mantine prop/default, a value derived only from the existing theme,
   or a CSS module consuming emitted Mantine variables. A CSS module is not permission to encode a literal.
5. **Stories reflect production.** They import the real component or consume the same named theme contract;
   they never recreate a layout with Tailwind dimension classes.
6. **Non-visual protocols remain semantic.** If a scoped media or metadata field needs a design dimension, derive
   it from the existing named contract and verify the emitted framework/HTML result. Do not move it into an
   unscanned object or substitute a raw field.
7. **Do not cross the boundary.** An import relationship does not expand §3.2. Do not alter a legacy dependency
   while repairing an in-scope caller; report the blocker instead.

---

## 8. Execution plan

### I0 — Freeze the global witness

- Confirm prerequisites and capture `git status --porcelain`.
- Run the current global command. It may fail; archive its per-file output as the untouched legacy witness.
- Record detector unit baseline, relevant focused test baseline, Storybook/build state, and rendered baseline B.

### I1 — Add the scope mechanism before consumer migration

- Write the six §3.3 detector tests first and prove each has a failing arm.
- Implement `--scope=mantine` by reading the manifest and matching the two canonical source roots.
- Preserve the default mode byte-for-byte in behavior. The scoped mode retains all current finding categories and
  marker errors.
- Run the scoped command and preserve its fresh output as the only remediation baseline.

### I2 — Classify and repair the scoped inventory

- Build the required classification table from the fresh scoped output; a changed detector result requires an
  explained reconciliation before continuing.
- Repair canonical stories and `src/design-system/mantine/**` patterns before their consumers.
- Repair manifest-listed production components only when the finding is in the exact scoped output.
- After each source family, rerun the scoped detector, focused tests, and the direct story/route proof. Record
  the per-file delta and each intentional visual change.

### I3 — Final proof

- `--scope=mantine` must return zero findings and successful strict status.
- Re-run the unscoped global command. It may still fail, but all of its remaining findings must be outside §3.2;
  it must show no new legacy finding or altered detector contract.
- Audit the final diff for scope escapes, suppression/allowlist changes, raw values, local aliases, and named
  Tailwind dimension utilities.
- Run the required tests/gates and differential rendered evidence. Any new rendered failure blocks completion.

---

## 9. Acceptance criteria

- **AC1 [R1] — Exact scope.** Detector tests prove all four in-scope source kinds, legacy exclusion, and
  unchanged global behavior. The mode reads manifest membership rather than a copied path list.
- **AC2 [R2] — Scoped zero.** `node scripts/check-design-tokens.mjs --strict --scope=mantine` exits successfully
  with zero raw findings, zero stale markers, and zero missing-reason errors.
- **AC3 [R3] — No hardcode or bypass.** Final diff contains no new raw design consumer value, scale, local alias,
  suppression, or allowlist entry. Every selected disposition names an existing canonical source.
- **AC4 [R4] — Global detector preserved.** Default global scan/categories/strict behavior remain intact. Its
  remaining findings reconcile entirely to out-of-scope legacy sources.
- **AC5 [R5] — Canonical story integrity.** All selected stories have zero named Tailwind dimension utility and
  render the real component or shared canonical contract.
- **AC6 [R6] — Runtime correctness.** Changed responsive, media, metadata, and safe-area behavior is verified at
  the emitted/runtime boundary as well as by unit/component tests.
- **AC7 [R7] — Behavior and visual proof.** Relevant tests preserve public contracts; differential rendered
  evidence has no new failure and records each intentional canonical delta.
- **AC8 [R8] — Boundary respected.** No production legacy source outside §3.2 is changed. Header/Footer
  container migration is absent from the diff.

---

## 10. Required verification

Record actual command, exit status, and relevant output for:

```powershell
npx vitest run scripts/__tests__/check-design-tokens.test.ts
node scripts/check-design-tokens.mjs --strict --scope=mantine
npm run check:design-tokens
npm run typecheck
npm run lint
npm run check:stories
npm run build-storybook
```

Run every focused test affected by the fresh scoped output, plus new detector tests and any media/metadata test
needed for AC6. Do not report the global command as green if legacy findings remain; report its actual status
and the scope reconciliation instead.

Rendered QA follows Sprint 69 differential acceptance: capture B before consumer edits, capture P after, compare
normalized cell identities, and treat every new failure as blocking. Review each changed localized component in
its canonical story at the project-required viewports/locales, including the longest-locale mobile path.

---

## 11. Completion report contract

The final Sonnet report must include:

1. The §3.2 membership witness and both global/scoped before-after detector transcripts.
2. The complete scoped classification table with canonical source, proof path, and recorded visual delta.
3. Evidence for every scope-mode test, including exclusions and unchanged global behavior.
4. Diff evidence that no legacy production source, suppression, allowlist, local literal, or new scale was added.
5. Targeted test, Storybook, build, global/scoped detector, and rendered-QA results, with known legacy output
   clearly separated from scoped acceptance.
6. Files changed, files intentionally untouched, any owner decision needed, and final task status.

---

## 12. Task quality gate

| Question | Required answer |
|---|---|
| Is scope deterministic? | Yes — manifest plus the two named roots, tested positively and negatively. |
| Is scoped zero real? | Yes — the existing strict categories and marker checks run unchanged on selected files. |
| Did the default detector become quieter? | No — default behavior is covered by a regression test and transcript. |
| Did legacy code enter the diff? | No — final production diff is restricted to the declared scope. |
| Did a literal move rather than disappear? | No — every consumer uses an existing Mantine/theme contract. |
| Are changed stories faithful? | Yes — real component or shared canonical theme value; no Tailwind-sized imitation. |
| Is rendering proven? | Yes — focused tests plus differential/owner visual evidence. |

---

**Start condition:** prerequisite Sprint 69 and detector-extension diffs are committed; global witness and clean
baseline are captured.

**Completion condition:** AC1–AC8 hold. Any in-scope finding, raw fallback, scope escape, detector weakening,
or unproved new rendered failure leaves the task unapproved.
