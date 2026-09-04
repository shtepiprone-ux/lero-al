# Task 784 — zero raw design dimensions in the current Mantine scope

**Sprint:** 69 · **Priority:** P1 · **QA profile:** **Q3** · **Filed:** 2026-09-04 · **State:** `APPROVED WITH NOTES` (2026-09-04) — all gates green post-D69-27; only the P3 D69-26 record pass and the owner commit remain.
(Revision 6 / D69-21's R13/R15 remain met, unchanged; R14 (`cta-row-label-single-line-uk-1024`, a mid-word break
in `uk` at exactly 1024px) remains unresolved as last recorded — see session log §19. Separately, in the same
session, 5 further changes were implemented from direct live owner instruction with **no corresponding
Requirement/Acceptance-Criterion authored in this kickoff**: the Grid stack boundary moved from `sm` to `md`
(panel stays stacked through 767px); a new named breakpoint `theme.breakpoints.xs2` (480px) was added (owner
chose this over reusing `sm`); the Call/WhatsApp row and a new Send-message/Share row are both gated with a
piecewise `{base:'column',xs2:'row',md:'column',xl:'row'}` direction scheme — required because a naive
480px-only gate reintroduced R14's defect class inside the newly-created 768-1023px narrow-sidebar zone, found
and fixed before shipping, not discovered after; the favorite button moved out of the contact card entirely
(superseding an earlier viewport-split placement from the same session, and removing that placement's
documented state-sync obligation along with it) — now a single instance, always in the badges row, verified
right-aligned to the content column's own edge (measured against the gallery image, not eyeballed — matters
once the sidebar exists at `md`+). `task784-d69-19-browser-evidence.mjs` was reworked (not left as throwaway
probes) to **35/35 checks, exit 0**; full QA-profile re-run, all exit 0 including `npm run build`. Full record:
session log §20-§21. **This work has no formal requirement to be "MET" against — Opus must decide whether to
backfill R##/AC## into this kickoff matching what shipped, or scope it as a separate follow-up task**, per this
project's task-design gate. Revision 5 / D69-20's R9-R12 remain fully met, unchanged — see session log §18.)

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

Close every `check:design-tokens` finding in the **current Mantine scope only** and repair every visual or
semantic regression introduced by Revision 2's D69-16 substitutions. Use an existing canonical Mantine
contract, a component default, responsive values, Mantine-backed CSS variables, or an exact D69-18 typed
theme contract whose source is recorded in §13. Canonical Mantine stories must contain no named Tailwind
dimension utility.

The final scoped command reports **zero** raw findings, **zero** stale markers, and **zero** missing-reason
errors. Legacy sources are explicitly out of scope and may continue to make the existing global strict command
fail. The task must not migrate, restyle, suppress, or otherwise touch them incidentally.

**No hardcode:** a Mantine consumer, CSS module, story, inline style, media-condition string, generated metadata
object, helper, or local alias may receive a raw design value. Do not hide a literal in another form. The only
permitted value-definition location is the typed canonical Mantine theme, and only for a D69-18 role listed in
§13. Each theme definition is an exact, one-time migration of the cited design source; it is not inferred from
a nearby token or invented from a fresh detector result. A numerical near-match is never a semantic contract.

---

## 3. Verified context and exact scope

### 3.1 The problem with the global detector

The expanded `npm run check:design-tokens` is deliberately global: it reports current Mantine code and legacy
code together. Its present non-zero result therefore cannot be Task 784's completion metric. Treating every
global finding as a Mantine migration would incorrectly pull legacy surfaces into this task.

The default command, its strict behavior, categories, marker checks, production scan, and canonical-story scan
remain authoritative and unchanged. The existing `--scope=mantine` mode is a membership filter; Revision 3
does not add a new detector category or make the global result quieter.

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
- preserves the default global scan membership and all pre-existing detection behavior.

Do **not** introduce a generic ratio or percentage-width detector in this task. The scoped union contains
legitimate responsive full-width contracts (for example, Mantine mobile-gate controls), so such a rule would
conflate product behavior with raw design dimensions. A new category requires a separately enumerated false-
positive census, an approved grammar, and its own task; neither exists here.

The scoped mode applies every existing detection category and every stale/missing-marker check to its selected
files. It is a membership filter over the current detector, never a parallel or reduced rule set.

### 3.4 Canonical sources — use, do not clone

| Need | Canonical source |
|---|---|
| Layout rhythm | Named Mantine `spacing` props and existing responsive breakpoints |
| Typography and radius | Mantine `fontSizes`, `lineHeights`, `radius`, and component defaults |
| Icon/control floor | typed `theme.other.iconSize` and `theme.other.touchTarget` |
| Fixed semantic box | typed `theme.other.boxSize`, only when its role actually matches |
| Approved missing role | typed D69-18 theme contract with one documented semantic owner and binding source; never a nearest-value reuse |
| CSS-only style | emitted Mantine CSS variables and component contracts |
| Accessible hidden content | Mantine visually-hidden primitive, not off-screen geometry |

`src/design-system/mantine/theme.ts` is the existing, typed source of these contracts. Consumer code may use a
name from it; it may never reproduce the underlying design value. D69-18 permits only the named contracts in
§13; every other new scale rung, local token, or fresh theme value remains out of scope.

### 3.5 Binding decisions

- **D69-6:** hardcoded design values migrate to canonical Mantine tokens.
- **D775-A/B/C:** current Mantine surfaces use the existing responsive/TailAdmin contract, never a legacy
  literal or legacy spacing reference.
- **D68-2:** rendered acceptance is differential where a valid baseline exists. For D69-19, historical B is
  unavailable; the final rendered source-to-token verification in §14 is the required non-fabricated evidence.
- **D69-15:** Task 784 is restricted to the exact §3.2 union. Legacy findings are not migrated or suppressed.
- **D69-16:** superseded; its nearest-value substitutions and removal-only dispositions are not acceptance
  evidence.
- **D69-17:** superseded; it proposed detector categories and theme-role structure before the full provenance
  audit.
- **D69-18:** Revision 3 repairs only the provenance-backed dispositions in §13. The exact source is binding;
  a theme role is canonical design-system data, not a consumer hardcode. No consumer may use a raw value, no
  role may be selected for numerical proximity alone, and no role outside §13 may be introduced.
- **D69-19:** Revision 4 closes only the failed evidence, no-hardcode-test, and state-synchronization
  requirements recorded in §14. It adds no theme role, detector category, design value, or product behavior.

---

## 4. Requirements

| ID | Requirement | Priority | Verified by |
|---|---|---|---|
| R1 | Implement an additive `--scope=mantine` detector mode with exactly the §3.2 membership and test it from both positive and negative directions. | P0 | AC1 |
| R2 | Every fresh scoped finding and every D69-16 semantic/visual regression in §13 is resolved with an existing canonical Mantine contract or its exact D69-18 typed semantic contract; the final scoped strict run is zero. | P0 | AC2 |
| R3 | No consumer hardcode, local numeric alias, raw fallback, nearest-value token misuse, allowlist entry, or inline suppression is added. A D69-18 typed theme definition is the sole permitted value source and cites its binding provenance. | P0 | AC3 |
| R4 | The default global detector retains its scan paths, strict behavior, categories, and tests. Global legacy findings are neither hidden nor remediated. | P0 | AC4 |
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

**First action for D69-19:** perform the §14 input-integrity gate. Then run the default global detector in its
actual strict mode and retain its output as the out-of-scope witness. Historical B and the historical D69-16
patch witness are unavailable facts; use the direct provenance sources in §13 and final-state browser evidence
instead of attempting to reconstruct either artifact.

---

## 6. Scope

### Included

- The complete fresh output of `--scope=mantine` for the exact §3.2 union.
- The detector CLI/filter and unit tests necessary to make that scoped result reproducible.
- Direct canonical stories and focused tests needed to prove an in-scope component change.
- The exact `src/design-system/mantine/theme.ts` type and value additions listed in §13.
- Session evidence and Sprint 69 task-state reporting required by the execution contract.

### Explicitly excluded

- Any legacy production source outside §3.2, regardless of the global detector's finding count.
- Header/Footer `container-wide` removal, container/gutter redesign, or a broader header/footer migration.
- Adding paths to `mantine-migration-scope.json`, creating components/primitives, or changing unrelated stories.
- Weakening detector categories, default scan paths, marker validation, strict behavior, thresholds, or output.
- `design-tokens-allow` markers, allowlist changes, raw literals outside `theme.ts`, local token clones, and
  value-carrying helpers.
- Any `theme.ts` role not enumerated in §13, including a generic nearest-value or catch-all bucket.
- Product behavior, routes, URL state, queries, server actions, translations, and unrelated cleanup.

---

## 7. Canonical implementation rules

1. **Classify every scoped finding first.** Record source/line, visual role, current primitive, existing
   canonical candidate, selected disposition, proof surface, and expected visual delta.
2. **Prefer a Mantine default or named prop.** Remove a redundant local override before selecting a theme role.
   A semantic role wins over a same-looking value. Where no existing role fits, use exactly one D69-18 role
   with the binding source stated in §13.
3. **Use theme roles by meaning only.** `iconSize`, `touchTarget`, and `boxSize` are not generic escape hatches.
   A role whose documented owner differs from the consumer is invalid even if the resolved values are equal.
4. **No raw inline style migration.** Use a Mantine prop/default, a named existing or D69-18 theme contract, or
   a CSS module consuming emitted Mantine variables. A CSS module is not permission to encode a literal.
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

- Perform the §14 input-integrity gate and record its complete candidate/quarantine inventory.
- Do not attempt to archive or reconstruct a historical D69-16 source patch. The direct provenance sources in
  §13 are the permitted evidence for pre-D69-16 geometry.
- Run the current strict global command. It may fail; archive its per-file output as the untouched legacy witness.
- Record current detector/test/build state. Obtain final-state browser source-to-render evidence under §14; do
  not label any artifact as historical B or P.

### I1 — Validate the existing scope mechanism before consumer remediation

- Preserve and rerun the six §3.3 scope tests. Do not alter the detector grammar in this revision.
- Capture fresh global and scoped strict results from the identified candidate. Reconcile the scoped zero with
  the D69-18 source map; the detector result alone does not prove visual or semantic correctness.

### I2 — Classify and repair the scoped inventory

- Build the required classification table from the fresh scoped output; a changed detector result requires an
  explained reconciliation before continuing.
- Repair canonical stories and `src/design-system/mantine/**` patterns before their consumers.
- Repair manifest-listed production components only when the finding is in the exact scoped output.
- Apply the binding remediation map in §13. Preserve the established visual role through an existing contract or
  its exact D69-18 semantic theme owner; no nearest-value substitution or removal-only disposition is permitted
  where the source requires the geometry.
- Delete the partial-diff `design-tokens-allow` additions in the two drawer-pattern files. Restore the required
  handle through the shared D69-18 drag-handle contract, not duplicated local geometry.
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
  preserved scan membership. The mode reads manifest membership rather than a copied path list; Revision 3 adds
  no unapproved detector grammar.
- **AC2 [R2] — Scoped zero.** `node scripts/check-design-tokens.mjs --strict --scope=mantine` exits successfully
  with zero raw findings, zero stale markers, and zero missing-reason errors. An exact legacy value is never an
  exception to this criterion.
- **AC3 [R3] — No hardcode or bypass.** Final diff contains no local alias, suppression, allowlist entry, or
  nearest-value role misuse; the partial-diff suppression additions are absent. Each theme definition is typed,
  appears in §13, is the sole source of its value, and cites an exact binding source.
- **AC4 [R4] — Global detector preserved.** Default global paths, strict behavior, categories, and tests remain
  intact. Remaining global findings are outside §3.2 and no legacy finding is hidden or remediated.
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
npm run check:story-coverage
npm run build-storybook
npm run build
```

Run every focused test affected by the fresh scoped output, the existing scope-detector tests, and any
media/metadata test needed for AC6. Do not report the global command as green if legacy findings remain; report
its actual status and the scope reconciliation instead.

Rendered QA follows Sprint 69 differential acceptance: capture B before consumer edits, capture P after, compare
normalized cell identities, and treat every new failure as blocking. Review each changed localized component in
its canonical story at the project-required viewports/locales, including the longest-locale mobile path. A missing
browser or rendered evidence permits only `IMPLEMENTED — AWAITING ORCHESTRATOR REVIEW`, never completion.

---

## 11. Completion report contract

The final Sonnet report must include:

1. The §3.2 membership witness and both global/scoped before-after detector transcripts.
2. The complete scoped classification table with canonical source, proof path, and recorded visual delta.
3. Evidence for every scope-mode test, including exclusions and preserved global membership.
4. Diff evidence that no legacy production source, suppression, allowlist, local literal, or unauthorized theme
   role was added; explicitly prove that the partial-diff suppression additions are absent.
5. Targeted test, Storybook, build, global/scoped detector, and rendered-QA results, with known legacy output
   clearly separated from scoped acceptance.
6. Files changed, files intentionally untouched, any owner decision needed, and final task status.

---

## 12. Task quality gate

| Question | Required answer |
|---|---|
| Is scope deterministic? | Yes — manifest plus the two named roots, tested positively and negatively. |
| Is scoped zero real? | Yes — the existing strict categories and marker checks run unchanged on selected files. |
| Did detector coverage weaken or hide legacy code? | No — membership and existing categories are preserved; Revision 3 changes no detector grammar. |
| Did legacy code enter the diff? | No — final production diff is restricted to the declared scope. |
| Did a literal move rather than disappear? | No — every consumer uses an existing Mantine/theme contract. |
| Are changed stories faithful? | Yes — real component or shared canonical theme value; no Tailwind-sized imitation. |
| Is rendering proven? | Yes — focused tests plus differential/owner visual evidence. |

---

## 13. Binding remediation map — D69-18 fact-anchored correction

This is an exhaustive correction map for the known Revision 2 defects. Each row has a recorded source that fixes
both the value and the visual role. A finding not represented here is **not** authority to create another role:
record it, preserve the scoped zero, and stop for a separately approved task. Do not derive a theme value from a
fresh detector result, an approximate prose requirement, a default, or a nearby existing token.

| Proven source | D69-16 defect to remove | Exact D69-18 canonical disposition | Required proof |
|---|---|---|---|
| `docs/sessions/2026-09-04-task784-zero-raw-design-dimensions-scope-mode.md` §4 compact-findings inventory, plus the pre-D69-16 source captured in its §14.3 table | Compact gaps, margins, separators, and mixed-axis card gaps were widened by mapping unlike compact values to `xs`. | Add three typed sub-`xs` scale keys — `micro`, `tight`, and `compact` — to `theme.spacing` and its Mantine type override. Each value is migrated exactly once from its cited source. Map every affected site to its matching named rung; retain existing `xs` where the source already uses it. Express mixed axes through Mantine-supported named row/column values or a CSS module containing only emitted theme variables. | Final browser verification of the listed canonical stories compares computed compact relationships with their named theme contracts at runtime. |
| Task 784 session §4 typography inventory and the pre-D69-16 source recorded in §14.3 | The notification micro glyph, listing-description leading, and filter-heading tracking were replaced with larger/default/untracked typography. | Add fully typed `fontSizes.micro`, `lineHeights.listingDescription`, and `theme.other.letterSpacing.filterHeading`. Use them only for the cited notification, detail, and shared filter-heading roles. | Notification, detail, `MantineFilterSection`, and `ListingsFilters` stories at required locales; computed typography values match B. |
| `docs/mantine-responsive-design-system.md` §25, which gives the canonical desktop Tooltip chrome and its documented wrapping exception | Tooltip padding was removed and its documented wrap width was assigned to `boxSize.compactTrigger`, whose declared owner is RangeDatePicker. | Add typed tooltip-owned contracts for the documented desktop inline padding and multiline content width. Restore those exact §25 values in `MantineTooltip`; remove its `compactTrigger` use. `compactTrigger` remains RangeDatePicker-only. | Open long-label Tooltip through real hover/focus at desktop, including the longest locale and narrow desktop width. |
| Task 784 session §4 listing-skeleton inventory; the pre-D69-16 `FeaturedListingsView` and `LatestListingsView` source preserved in the current partial diff; Task 707 loading-story provenance | Fixed text-line dimensions were removed, while raw media ratio and proportional width remained outside the detector's grammar. | Add typed `theme.other.listingSkeleton` contracts for the two listing skeleton variants: media ratio, line heights, fixed line widths, and the one proportional line width. Use Mantine `AspectRatio` for the media placeholder and named contracts for all dimensions; no consumer literal remains. | Final browser verification of `HomepageListingGrids/Loading` confirms non-zero intrinsic media height and each line's named runtime contract at every required viewport. |
| `docs/mantine-responsive-design-system.md` responsive-contract table for AuthForm/EmptyLoadingErrorState, together with Task 784 session §4 pre-D69-16 inventory | Desktop auth containment and centered loading/empty-state minimum block geometry were deleted rather than tokenized. | Add typed `theme.other.layout.authFormMaxWidth` and `theme.other.layout.emptyStateMinBlockSize`, each populated exactly from its cited pre-D69-16 source. Restore the responsive auth cap and both centered-state minimum blocks through named contracts. | Final browser verification at mobile and desktop confirms the named layout contracts and observed mobile full-width behavior. |
| Legacy `src/modules/listings/components/ListingContact.tsx` desktop contact source and `docs/mantine-responsive-design-system.md` listing-detail responsive contract | The contact panel's required desktop sticky behavior was removed. | Add typed `theme.other.layout.listingContactStickyOffset`, using the legacy contact source as the exact provenance. Restore sticky positioning only at the established desktop layout; no local top value. | Listing-contact canonical story: desktop scroll proof shows the panel remains pinned, while mobile stays in normal document flow. |
| `docs/sessions/2026-08-01-task673-footerview-de-hybrid.md` §5.2, which records the measured pre-migration grid gap and its original Tailwind source | Footer `SimpleGrid` was assigned a smaller nearby spacing rung instead of its measured grid relationship. | Add typed `theme.other.layout.footerGridGap` from the cited FooterView evidence. `FooterView` consumes that role; no generic spacing rung or container change is allowed. | Final browser verification of the canonical Footer proof surface confirms grid axes resolve to `theme.other.layout.footerGridGap` at every supported width. |
| Task 784 session §5 marker forensics and the pre-D69-16 Drawer/bottom-sheet source | The required shared decorative handle was deleted to avoid its dimensions; malformed marker corrections are not acceptable. | Add typed `theme.other.overlay.dragHandle` geometry and consume it in both existing handle render paths. Remove every Task 784 marker addition/correction; do not create a local clone or change Drawer behavior. | Open Drawer and bottom-sheet interaction stories: handle visible with B-equivalent geometry; close, Escape, backdrop, focus-return, title, and footer behavior unchanged. |
| Task 784 session §4 pagination inventory and its focused range/resize tests | The off-screen measurement implementation was changed only to evade a raw-value finding. | Keep the current no-distance implementation **only if** focused tests and final browser proof establish that the hidden probe stays measurable, non-announced, non-interactive, and never visible. If that proof fails, stop and report; do not invent a layout token or restore an off-screen distance. | Pagination range/resize tests and narrow-width story. |
| `ListingsFilters.tsx`'s three real vertical `FilterChoiceGroup` callers and Task 784 session §14.3 | None: the existing `orientation="vertical"` story correction is source-faithful. | Retain the existing prop-based story/production alignment; do not edit its legacy dependency. | Canonical FilterControls story and focused filter test. |
| `CountButton.stories.tsx` and `ListingsFilterBar.tsx` current production icon contract | None: the Revision 2 comment correction is source-faithful. | Retain the corrected provenance; do not change icon size or introduce a new token. | Source review and production story. |

### Required theme-contract discipline

1. Extend the existing Mantine module augmentation so every D69-18 key is fully typed; no `any`, index signature,
   optional fallback, or untyped nested object is permitted.
2. Add a focused theme-contract test that imports the actual theme and verifies every D69-18 key, its declared
   type, the unique source reference, and the complete consumer list in this map.
3. The theme is the only value source. Consumers may reference a named key or an emitted Mantine variable only.
4. A D69-18 role is exclusive to its named owner family. Reuse outside that family, including a numerically equal
   value, requires a separate task with its own provenance.
5. `compactTrigger` may not appear in `MantineTooltip`; the Drawer handle, sticky contact layout, desktop auth
   cap, centered-state block, footer grid gap, and listing skeleton geometry may not be removed to obtain a green
   detector result.

### Rework-specific completion evidence

The final session report must additionally show:

1. the §14 read-only candidate identity, quarantine inventory, and fresh strict global/scoped witnesses, with no detector grammar change;
2. one table row for every D69-18 owner, naming the cited source, typed theme key, exact value migration, every
   consumer, and proof;
3. a detector transcript proving zero scoped findings under the unchanged grammar;
4. proof that no `design-tokens-allow` text or allowlist entry was added and the partial-diff additions were removed;
5. final-state browser source-to-render evidence for every visual or interaction contract in this table; and
6. synchronized implementation state across this kickoff, Sprint 69, the session log, and backlog.

---

## 14. D69-19 — evidence-closure rework (binding)

### Why this revision exists

Revision 3 corrected the source-to-token remediation map, but the implementation record still has three
demonstrable defects:

1. The claimed historical B/P proof is invalid. The session record says that work began in a dirty worktree and
   that no isolated pre-change rendered baseline was captured. It also records that no rendered UI capability was
   available. A table that infers B-equivalence from source is not rendered evidence.
2. `src/design-system/mantine/__tests__/theme.d69-18.test.ts` duplicates raw visual values and forces the theme
   through an unsafe `as MantineTheme` cast. That is a local hardcoded value catalogue, not a contract test.
3. The kickoff, Sprint 69 register, backlog, and session record do not currently describe the same task state.

D69-19 closes only those documented defects. It introduces no design role, value, detector category, product
behavior, legacy-component change, suppression, allowlist entry, or approximation. All D69-18 source and owner
decisions remain binding. Where a section above asks for a historical B/P capture, D69-19 supersedes that wording:
the missing history must be recorded as unavailable, never reconstructed or represented as having happened.
It also supersedes the clean-worktree/commit prerequisite in §§5, 8, and 13 for D69-19 execution only; the
read-only input-integrity procedure below is the sole start gate for this rework.

### Non-negotiable input-integrity gate

D69-19 does **not** require a commit, a new worktree, or an empty worktree. The executor has no authority to
perform those Git mutations, and making them a start condition would make this task impossible to execute.

Before any D69-19 edit, record a read-only identity of the current candidate in the session evidence:

1. `HEAD` revision and the complete `git status --porcelain` output;
2. an ordered content-hash inventory for every changed or untracked file that is inside §3.2, plus the allowed
   detector/test files; and
3. a separately listed set of dirty files outside that input set, explicitly marked quarantined and untouched.

Derive the input set mechanically from §3.2 and the allowed detector/test paths; do not hand-pick files by task
name or copy a patch into source. The inventory is a reproducible identity of the candidate actually reviewed. It
is not, and must not be described as, a historical baseline, clean state, D69-16 patch witness, or proof that an
unrelated dirty file belongs to Task 784.

The executor may proceed from that read-only identity only when the candidate input contains every necessary
D69-18 file and no planned production edit is outside §3.2. Any missing required candidate file or planned scope
escape is a precise blocker. Existing dirty files outside the input set are not a blocker, but no D69-19 action
may edit, stage, restore, commit, stash, or otherwise mutate them. The only reporting exception is the named
Task 784 session log, this kickoff, the Sprint 69 register, and `docs/backlog.md`, and only at the I0/I4 points
that explicitly require factual evidence or status synchronization.

### I0 — correct the record before testing

Append a D69-19 section to the existing session log that:

1. cites the existing statements that establish the missing historical baseline and missing rendered proof;
2. states plainly that historical B, historical P, and a source-patch witness for the pre-D69-16 state are
   unavailable;
3. removes or corrects every unqualified claim that the current geometry is B-equivalent, pixel-identical, or
   proven by a B/P comparison; and
4. distinguishes historical provenance (the direct sources in §13) from final-state rendered verification
   performed by this rework.

Do not create a retrospective B artifact, label a final-state screenshot as B, or treat a source-reading table as
visual proof.

### I1 — replace the hardcoded theme test with a real contract test

Replace `src/design-system/mantine/__tests__/theme.d69-18.test.ts`; do not amend it with more assertions.

The replacement must:

1. remove the unsafe `as MantineTheme` cast and all raw visual design values from executable code, descriptions,
   comments, fixtures, and snapshots in that test;
2. type-check the actual theme against the declared Mantine augmentation without a cast, `any`, index signature,
   optional fallback, or parallel shape;
3. assert the existence and expected primitive kind of each D69-18 named contract and its documented owner
   relationship, using contract names rather than duplicated values; and
4. verify consumer source mechanically: every mapped consumer resolves the named theme contract or its emitted
   CSS variable, while no mapped consumer retains a raw design dimension or an unapproved local alias.

Exact visual fidelity must be checked only from an actual rendered component: the browser test imports the actual
theme and compares the computed property with the value obtained from that named theme contract at runtime. It
must not encode the expected visual value in the test. This keeps `theme.ts` as the sole value authority.

### I2 — obtain final-state source-to-render evidence

Use the project-supported Storybook/browser runner against the identified current candidate. Extend existing canonical
stories or their existing interaction tests; do not make a visual clone, static markup substitute, artificial
geometry harness, legacy wrapper, or a new product component.

For each proof, store a reproducible browser artifact in the Task 784 evidence directory: executed command,
route/story identifier, locale, viewport derived from the actual theme breakpoint contract, screenshot or trace,
and the captured computed-style/interaction output. Expected dimensions must be obtained at runtime from the
named theme contract, never copied into test code.

The final evidence matrix must include all of the following real render checks:

| Owner family | Required browser proof |
|---|---|
| Listing contact | In the canonical listing-detail composition, scrolling proves normal document flow below the desktop breakpoint and sticky behavior at the desktop breakpoint. The reported offset is compared with `theme.other.layout.listingContactStickyOffset` at runtime. |
| Tooltip | Hover and focus the actual long localized Tooltip content at desktop. Computed padding and wrapping constraint match the tooltip-owned theme contracts at runtime; `compactTrigger` is absent from the consumer. |
| Listing skeletons | Render both canonical loading variants. The media placeholder has non-zero rendered height and its ratio, each line height, fixed width, and proportional width resolve from `theme.other.listingSkeleton` at runtime. |
| Auth and centered states | Render the canonical Auth and empty/loading/error states at mobile and desktop. Computed containment and minimum-block contracts equal their named theme values, and the mobile full-width behavior is observed. |
| Footer | Render the canonical Footer story at its supported widths. Both grid axes resolve to `theme.other.layout.footerGridGap`; column behavior remains produced by the real Footer composition. |
| Drawer and bottom sheet | Open both existing overlay paths. The shared handle is rendered from `theme.other.overlay.dragHandle`, and close control, Escape, backdrop, focus return, title, and footer behavior still pass through real interaction. |
| Pagination probe | Exercise the existing range/resize path in a browser. The probe has a non-zero browser rectangle, is not announced or interactive, and is never visible; no coordinate-based hiding is introduced. |
| Filters and count button | Run the canonical FilterControls and CountButton stories/tests to confirm the existing source-faithful prop/provenance corrections remain unchanged. |

The listing-contact proof may not use the current `skipCanvas` narrow static stack as evidence because it cannot
exercise scrolling or desktop stickiness. Make the existing canonical story or its existing interaction test
render the real composition with naturally occurring overflow from that composition, then remove `skipCanvas`
only if the repository's canonical-story rules permit it. Do not add a fixed-height, positional, or spacer hack to
manufacture scrolling.

### I3 — preserve the detector and complete the evidence gates

Run the unchanged strict global detector and the strict Mantine scope detector from the identified current candidate.
Record both complete outputs and reconcile scope membership exactly as specified in §3.2. The scoped result must
be zero. The global result may retain legacy-only findings, but every such finding must be outside §3.2. No
detector grammar, category, allow marker, allowlist, ignore list, scope-root exception, or suppression may be
changed for D69-19.

Run the focused detector tests, replacement theme-contract test, affected component tests, typecheck, lint,
story checks, Storybook build, application build, and the browser evidence suite. A missing runner, failed build,
or incomplete artifact leaves the task awaiting review; it is not permission to claim visual equivalence.

### I4 — synchronize status only from completed facts

After and only after I0–I3 succeed, update this kickoff, the Sprint 69 task register, `docs/backlog.md`, and the
Task 784 session log to the same factual state: `IMPLEMENTED — AWAITING ORCHESTRATOR REVIEW`. Do not use
`COMPLETE`, `APPROVED`, or an equivalent term. If any gate is incomplete, preserve an awaiting-review state and
name the missing evidence precisely in every record.

### D69-19 acceptance criteria

1. The read-only candidate identity and quarantined-file inventory exist; the unavailable historical baseline is
   disclosed rather than fabricated.
2. The theme test has no raw visual values or unsafe cast, and validates contracts/consumers by names and types.
3. Every §13 owner has a final-state browser source-to-render artifact using actual theme-derived expectations.
4. The contact, overlay, Tooltip, skeleton, responsive layout, Footer, and pagination interaction contracts are
   exercised in real rendered UI, not inferred from source or JSDOM structure alone.
5. Strict Mantine scope has zero findings under the unchanged detector; global findings are reconciled as
   legacy-only and out of scope.
6. No hardcoded consumer value, local alias, legacy component, detector weakening, marker, allowlist, or
   suppression is added.
7. The kickoff, Sprint register, backlog, and session log carry one matching factual awaiting-review state.

---

**D69-19 start condition:** the read-only candidate identity required above is recorded, and its mechanically
derived input set contains all required files without a planned scope escape.

**D69-19 completion condition:** every D69-19 acceptance criterion has recorded evidence. Missing historical
B/P evidence remains disclosed, not invented; any missing final-state browser proof, failed gate, in-scope
finding, raw fallback, scope escape, detector weakening, or state mismatch leaves the task unapproved.

---

## 15. D69-20 — inert-restoration rework (binding)

**Filed:** 2026-09-04 by the Task 784 implementation review (`NEEDS REVISION`). Revision 5.
**Supersedes:** nothing in §13 — every D69-18 source, value and owner decision remains binding. D69-20 changes only
the *mechanism* by which two already-approved §13 contracts reach the DOM, and corrects the record that
misattributed one of them.

### Why this revision exists

D69-19 closed its evidence defects honestly and its disclosure work stands. But it closed the task with two §13
owner families whose contracts are **defined, typed, referenced by name — and inert at runtime**. §13's own
discipline rule 5 forbids exactly that outcome: *"the … sticky contact layout, desktop auth cap … may not be
removed to obtain a green detector result."* A scoped zero obtained while the behaviour is gone is the defect that
rule exists to prevent.

One of the two is worse than disclosed. §17.3 states *"This is **not a new defect Task 784 introduced**"* and
*"the pre-D69-16 code … already had this exact broken `styles` block."* Review-verified against `git diff`:

| Consumer | `HEAD` mechanism | Candidate mechanism | Attribution |
|---|---|---|---|
| `MantineAuthFormPattern.tsx` | `styles={{root:{'@media (min-width: 40em)':{maxWidth:400}}}}` — already inert | same block, retokenized `40em`→`theme.other.mobileGate`, `400`→`theme.other.layout.authFormMaxWidth` | **FACT — pre-existing.** §17.3 is correct here. |
| `MantineListingContactPattern.tsx` | `style={{ position:'sticky', top:80 }}` — **a plain `style` prop, which works** | `styles={{root:{'@media …lg':{position:'sticky',top:…}}}}` — inert | **CONTRADICTION — introduced by this task.** The panel was sticky at every viewport at `HEAD`; it is sticky at no viewport now. |

Review swept every `@media (min-width` line in the diff and compared `HEAD` vs worktree occurrence counts for all
five other named consumers (`MantineAdminSurfacePattern` 2→2, `MantineFormSectionStack` 3→3, `MantineTwoColumnForm`
3→3, `MantinePageHeaderWithActions` 1→1, `MantineEmptyLoadingErrorState` 2→2): every one is a value-identical
retokenization of a block that was already inert. **`MantineListingContactPattern.tsx` is the only site in the
entire diff that converted a working mechanism into a broken one.**

### The mechanism — verified at source, not proposed

Do **not** reach for a CSS module here. `postcss.config.mjs` loads `@tailwindcss/postcss` only — there is **no**
`postcss-preset-mantine`, so `$mantine-breakpoint-*` is unavailable and a module would need a raw literal media
condition. `src/design-system/mantine/**` `.css` files are inside the §3.2 scanned union, so that literal becomes a
scoped finding and breaks AC2. `FooterView.module.css` carries a raw `@media (min-width: 48rem)` for exactly this
reason and pays for it with a `design-tokens-allow` marker, which §6 forbids this task from adding.

Use Mantine's **native responsive style props**. Verified in this repository's installed `@mantine/core`:

- `node_modules/@mantine/core/esm/core/Box/style-props/style-props-data.mjs` — `pos: {type:"identity", property:"position"}` (:45), `top: {type:"size", property:"top"}` (:46), `maw: {type:"spacing", property:"maxWidth"}` (:37).
- `.../parse-style-props/parse-style-props.mjs` — a responsive object generates real rules under
  `` `(min-width: ${theme.breakpoints[breakpoint]})` ``, read from the theme, emitted through the Box style-props
  mechanism (not the `styles` prop object that produces no CSS).
- `.../resolvers/size-resolver/size-resolver.mjs` + `utils/units-converters/rem.mjs` — a numeric value becomes
  `calc(<n/16>rem * var(--mantine-scale))`, i.e. `80` → `calc(5rem * …)` → **80px** computed. Equivalent to `HEAD`'s
  inline `top: 80`.
- `src/design-system/mantine/theme.ts:315–322` — `breakpoints.sm = '40em'`, **byte-identical** to
  `theme.other.mobileGate = '40em'` (:419); `breakpoints.lg = '64em'` (1024px), the desktop gate §13 requires.

`FACT`: the named breakpoint keys reproduce both required conditions exactly. No new value, no new theme role, no
raw literal, no marker, no detector change.

### Required after behaviour

| Consumer | Required change | Resulting condition |
|---|---|---|
| `MantineListingContactPattern.tsx` | Replace the inert `styles={{root:{…}}}` block with responsive style props on the same `Paper`: position `static` below the gate, `sticky` at `lg`, and the offset supplied **only** from `theme.other.layout.listingContactStickyOffset`. | `@media (min-width: 64em)` — desktop sticky, normal flow below, per §13's legacy `lg:block sticky top-20` provenance |
| `MantineAuthFormPattern.tsx` | Replace the inert `styles={{root:{…}}}` block with a responsive `maw` on the same `Paper`, full width at base and capped from `theme.other.layout.authFormMaxWidth` at the named breakpoint whose value is `40em`. | `@media (min-width: 40em)` — byte-identical to the pre-D69-16 condition |

The `lg` gate for the contact panel is **binding, not a judgment call** (the open question §15.8 left for review is
hereby closed): §13 cites the legacy `ListingContact.tsx` `lg:block sticky top-20` source and the documented
Desktop-only sticky contract. `HEAD`'s unconditional sticky was itself the deviation. Restore the gated behaviour and
make it actually fire.

### Out of scope for D69-20 — unchanged

- The five other consumers with pre-existing inert `styles` media blocks. They are **not** §13 owners, this task
  never touched their mechanism, and fixing them is new product-behaviour work. They go to a separate task; §17.3's
  evidence file is already scoped for it. Do not touch them here.
- Any new theme role, value, detector category, allowlist entry, marker, suppression, legacy source, or product
  behaviour. D69-18's remediation map and D69-19's evidence discipline both remain fully binding.
- Header/Footer container migration, and every legacy path outside §3.2.

### Requirements

| ID | Requirement | Priority | Verified by |
|---|---|---|---|
| R9 | `MantineListingContactPattern.tsx` renders `position: sticky` with the theme-supplied offset at `theme.breakpoints.lg` and above, and normal document flow below it, through a mechanism that demonstrably emits CSS. | P0 | AC9 |
| R10 | `MantineAuthFormPattern.tsx` applies `theme.other.layout.authFormMaxWidth` at and above the `40em` named breakpoint, and full width below it, through a mechanism that demonstrably emits CSS. | P1 | AC10 |
| R11 | The §17.3 attribution defect, the §17.5 AC3 overstatement, and the consumer-count inconsistency are corrected in the session log and `docs/backlog.md`. | P1 | AC11 |
| R12 | No new theme role/value, raw literal, local alias, marker, allowlist entry, CSS module, detector change, or out-of-scope consumer edit is introduced; the scoped detector stays at zero and the global result stays byte-identical. | P0 | AC12 |

### Acceptance criteria

- **AC9 [R9]** — *Given* the canonical `Patterns/Mantine/ListingDetailPattern/Default` story at 1280×800, *when*
  the page is scrolled, *then* the contact panel reports `position: sticky` with computed `top` equal to
  `theme.other.layout.listingContactStickyOffset` read from the theme at runtime; *and given* the same story at
  768px, *then* it reports `position: static`. Both arms come from `task784-d69-19-browser-evidence.mjs`, which
  must now exit **0**.
- **AC10 [R10]** — *Given* the canonical Auth story at desktop, *then* the rendered width equals
  `theme.other.layout.authFormMaxWidth`; *given* the same story at mobile, *then* it remains full width.
  `auth-desktop-max-width` and `auth-mobile-full-width` both pass.
- **AC11 [R11]** — §17.3 attributes the two consumers separately and states plainly that the contact-panel
  regression was introduced by this task; §17.5's AC3 row is restated as partially met, naming the §13 owner
  families (typography, compact spacing) that have no browser check among the 15; the consumer count is one number
  in both the session log and `docs/backlog.md`. `docs/backlog.md` stays at **≤80 lines**.
- **AC12 [R12]** — `node scripts/check-design-tokens.mjs --strict --scope=mantine` → 0 findings, exit 0; global
  output byte-identical to the D69-19 transcript by `diff`; final diff contains no new `theme.ts` key, no
  `design-tokens-allow` text, no new `.module.css`, and no edit to the five out-of-scope consumers.

### Negative-flow applicability

| Branch | Applicable | Reason |
|---|---|---|
| Below-gate viewport | **Yes** | AC9/AC10 mobile arms — the gate must not leak downward |
| Long-locale content (uk) | **Yes** | contact panel and auth card both hold localized text; tooltip proof already covers uk |
| SSR / hydration mismatch | **Yes** | style props emit real CSS rather than a JS media match — confirm no `useMediaQuery` was introduced instead |
| Zero/empty state | Yes | contact panel `ownerDeleted`/`guestCta`/`ownerUnavailable` states must be unaffected |
| RLS / auth / data | No | no data, query, server-action or permission surface is touched |
| Locale expansion beyond existing | No | no new strings |

### QA profile and verification plan

**Q3**, unchanged. Windows-native PowerShell only; record platform, exit code and working directory.

```powershell
node.exe -p process.platform
node scripts/check-design-tokens.mjs --strict --scope=mantine
npm.cmd run check:design-tokens
npx.cmd vitest run src/design-system/mantine/__tests__/theme.d69-18.test.tsx
npx.cmd vitest run scripts/__tests__/check-design-tokens.test.ts
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run check:stories
npm.cmd run check:story-coverage
npm.cmd run build-storybook
node scripts/task784-d69-19-browser-evidence.mjs
npm.cmd run build
```

`task784-d69-19-browser-evidence.mjs` must exit **0** with **15/15** (its true total; the "17" used through Revision 4 was a miscount). Do not edit the script's expectations to make
it pass — its expected values are read from `theme.ts` at runtime and must stay that way. `npm run build` exit 0 is
the non-Q0 hard gate.

**`OWNER VISUAL QA REQUIRED`** — carried forward from Revision 3 and still unrecorded; the owner alone marks each
tuple accepted or returned. This remains open regardless of R9–R12 and must not be replaced by any automated result:

| Story | State | Locale | Viewport |
|---|---|---|---|
| `Patterns/Mantine/ListingDetailPattern` | `Default` (scrolled) | en | 768, 1280 |
| `Mantine/Primitives/CountButton` | `Default` | en | 375 |
| `Mantine/Primitives/HeaderActions` · `HeaderView` | `Default` | en, uk | 320, 1024 |
| `Patterns/Mantine/HomepageListingGrids` | `Default`, `Loading` | en | 320, 768, 1440 |
| `Patterns/Mantine/ListingCardPattern` | grid + list, no-image fallback | en, uk | 320, 768, 1440 |
| `Mantine/Primitives/FilterControls` | vertical branch | en | 320 |

### Completion report contract

1. The two consumer diffs, with the emitted media condition named for each.
2. `results.json` showing 15/15 and the runtime-read expected values.
3. Scoped-zero transcript and the byte-identical global `diff` result.
4. Proof of what was **not** added: no new `theme.ts` key, no marker, no allowlist entry, no `.module.css`, no edit
   to the five out-of-scope consumers.
5. The corrected §17.3/§17.5 text and the backlog line count.
6. Files changed, files intentionally untouched, assumptions, deviations, limitations.

Strongest permitted status remains `IMPLEMENTED — AWAITING ORCHESTRATOR REVIEW`. No self-approval, no mutating Git.

### Task quality gate

| Question | Required answer |
|---|---|
| Is the mechanism proven to work before being required? | Yes — style-props data, responsive parser, size resolver and both breakpoint values were read at source, not assumed. |
| Does the fix add a design value? | No — both values already exist in `theme.ts`; only the delivery mechanism changes. |
| Could the scoped detector go green while the behaviour stays broken? | No — AC9/AC10 are runtime rendered assertions the browser script already fails on today. |
| Is the failing arm real? | Yes — the script exits 1 on exactly these two checks now, and must exit 0 after. |
| Is the record corrected, not just the code? | Yes — R11/AC11. |

---

## 16. Owner visual QA result + D69-21 CTA-stacking rework (binding)

**Recorded:** 2026-09-04, owner visual pass over the §15 matrix. **5 of 6 tuples accepted, 1 returned.**

| Story | Owner result |
|---|---|
| `Mantine/Primitives/CountButton` | ✅ **ACCEPTED** |
| `Mantine/Primitives/HeaderActions` · `HeaderView` | ✅ **ACCEPTED** |
| `Patterns/Mantine/HomepageListingGrids` | ✅ **ACCEPTED** |
| `Patterns/Mantine/ListingCardPattern` | ✅ **ACCEPTED** |
| `Mantine/Primitives/FilterControls` | ✅ **ACCEPTED** |
| `Patterns/Mantine/ListingDetailPattern` | ❌ **RETURNED** — at ≤768px the Call/WhatsApp CTA buttons are squashed: localized labels break mid-word (`Chia`/`ma`, `What`/`sApp` at it@768). Owner requirement: stack the buttons vertically on every screen **≤768px**. Scrolling and the restored sticky behaviour were explicitly confirmed working. |

### Attribution — this is NOT a Task 784 regression

Verified before scoping, so the record does not repeat the D69-18 misattribution:

- `FACT` — `MantineListingContactPattern.tsx:151` reads `<Flex direction={{ base: 'column', sm: 'row' }} gap="sm">`. `git show HEAD` returns the **byte-identical** line at `HEAD:152`, and `git diff` for this file matches `direction=` **zero** times. Task 784 never touched it.
- `FACT` — the file's own header attributes it to the **Task 615** CTA fix: *"`Flex direction={{base:'column',sm:'row'}}` + per-button `flex:1 minWidth:0` + wrapping `<span>` so long uk/it labels wrap instead of overflowing"*. The mid-word break is that wrapping strategy reaching its limit, not a broken one.
- `FACT` — root cause is a **breakpoint collision** between two different tasks. `MantineListingDetailPattern.tsx:218` places the panel at `<Grid.Col span={{ base: 12, sm: 4 }}>` (Task 609), so the sidebar narrows to 4/12 at **`sm` = 640px** — the *same* breakpoint at which the CTA row flips to `row`. The buttons go side-by-side at the exact moment their container becomes a third of the viewport: ≈256px of raw column at 768px, versus ≈427px at 1280px where the owner confirmed they render correctly.

The defect is real and owner-directed, but it predates this task and has no row in §13. It is fixed here rather than deferred **only** because the owner directed the fix while reviewing this task's own story, matching the precedent set when Task 783's F6 was reopened for an in-task fix (backlog, 2026-09-04). D69-21 adds no theme value and no detector change.

### Why `lg`, not `md`

`FACT` — Mantine responsive style props key only on **named** theme breakpoints (`parse-style-props.mjs` reads `theme.breakpoints[breakpoint]`); an arbitrary 769px gate is not expressible. Against `theme.ts:315–322` (`sm` 40em/640 · `md` 48em/768 · `lg` 64em/1024): `md` makes **768px itself a row**, which violates the owner's "≤768px" requirement literally. `lg` is the only named breakpoint that keeps 768px stacked, and it aligns the CTA row with the same `lg` gate D69-20 established for the sticky panel. Screens 769–1023 also stack — intended, since the sidebar is ≈256–341px wide across that whole band.

### Requirements

| ID | Requirement | Priority | Verified by |
|---|---|---|---|
| R13 | The Call/WhatsApp CTA row stacks vertically at every width below `theme.breakpoints.lg` and renders as a row at `lg` and above, via the same native responsive style-prop mechanism. No raw literal, no new theme value. | P1 | AC13 |
| R14 | At the row widths, both localized labels render on one line with no mid-word break, in the longest supported locale. | P1 | AC14 |
| R15 | The Task 615 contract is preserved: per-button `flex:1`/`minWidth:0` and the wrapping `<span>` remain; no button loses its icon, colour, handler, or accessible name; the `guestCta`/`closedListing`/`ownerDeleted`/`ownerUnavailable` states are unchanged. | P1 | AC15 |

### Acceptance criteria

- **AC13 [R13]** — *Given* `Patterns/Mantine/ListingDetailPattern/Default` at 375, 768 and 1023px, *then* the CTA container computes `flex-direction: column`; *given* 1024 and 1280px, *then* it computes `row`. Asserted in `scripts/task784-d69-19-browser-evidence.mjs` as new named checks, with the gate read from `theme.breakpoints.lg` at runtime — never hardcoded.
- **AC14 [R14]** — at 1024 and 1280px in the **longest** locale (`it` for these two labels; also check `uk`), each button's label occupies a single line: its rendered text height equals one line-height, and no label box is narrower than its text's intrinsic width. Capture a screenshot of each.
- **AC15 [R15]** — final diff shows the `direction` value as the only change to that `Flex`; `flex:1`, `minWidth:0` and the `<span>` wrapper are byte-identical; `theme.d69-18.test.tsx` still 55/55; the four non-`normal` states are untouched.

### Out of scope

Legacy `src/modules/listings/components/ListingContact.tsx`; the `Grid.Col span={{base:12, sm:4}}` sidebar breakpoint itself (changing Task 609's column ratio is a separate decision, not required to satisfy the owner's instruction); every §13 owner family already accepted above; the five pre-existing inert `styles`-prop consumers; any new theme role, detector change, marker, or allowlist entry.

### Verification plan

The full §15 Q3 command set re-run Windows-native, plus the extended browser evidence. `task784-d69-19-browser-evidence.mjs` must exit **0** with its new total, all checks passing. Then **one** owner re-review — this single tuple only, since the other five are accepted and must not be re-run:

| Story | State | Locale | Viewport |
|---|---|---|---|
| `Patterns/Mantine/ListingDetailPattern` | `Default` | it, uk | 375, 768, 1024, 1280 |

### Completion report contract

The one-line diff; the new browser checks with their runtime-derived gate; screenshots at 768 (stacked) and 1024/1280 (row, single-line labels) in `it` and `uk`; confirmation that the Task 615 contract survived; the full gate re-run; and the untouched-by-design list. Strongest permitted status remains `IMPLEMENTED — AWAITING ORCHESTRATOR REVIEW`.

---

## 17. D69-22 … D69-25 — retroactive scope record (binding)

**Filed:** 2026-09-04 by the Revision 6 review, answering the executor's own question in the header: *"Opus must
decide whether to backfill R##/AC## into this kickoff matching what shipped, or scope it as a separate follow-up."*

**Backfilled, not deferred.** The five changes were owner-directed live, are confined to §3.2, are already covered
by fresh rendered evidence, and are interdependent with D69-21's CTA gate — splitting them into a follow-up would
leave R13 measured against a layout that no longer exists. The executor was correct to refuse to mark them "MET"
against nothing, and correct to flag the governance gap instead of quietly inventing authority.

**Decision-code hygiene.** `D69-22`…`D69-25` were coined by the executor and written into `theme.ts`, both
patterns, the evidence script and the session log. Sprint-level `D69-*` codes are owner/orchestrator artifacts.
The codes are ratified here as written, so no source comment needs editing, but the rule stands for future work:
**an executor records an owner instruction as a requirement, never as a new binding-decision code.**

### What shipped

| Code | Change | Owner instruction |
|---|---|---|
| D69-22 | `theme.breakpoints.xs2` = `30em` (480px), new named rung between `xs` and `sm` | CTA row goes two-per-row from 480px |
| D69-22 | CTA `Flex` gate `{base:'column', xs2:'row', md:'column', xl:'row'}` | as above, without reopening the squash defect |
| D69-23 | `MantineListingDetailPattern` `Grid.Col` stack boundary `sm`→`md` (8/4 ratio unchanged) | "align the contact card on mobile" |
| D69-24 | Send-message/Share `Flex` adopts the same piecewise gate | consistency with the CTA row |
| D69-25 | `favorite` prop moved `MantineListingContactPattern` → `MantineListingDetailPattern`, rendered in the badges row | "move Add-to-favorites into the badge row so it is always in one place" |

### Why the piecewise gate is coherent (verified, not accepted on assertion)

D69-23 is what makes D69-22 safe, and neither is sound alone. With the stack boundary at `md`, the panel is
**full width below 768px** — so a two-per-row CTA at 480–767px has the whole viewport, not a 4/12 sidebar. The
sidebar now appears only at 768px, exactly where the gate returns to `column`; it widens enough for a row again at
`xl`. A naive 480px-only gate would have reopened the original squash defect inside the new 768–1023px sidebar
zone, which the executor found and fixed **before** shipping. Confirmed at nine widths, both `Flex` rows:
375 col · 479 col · 480 row · 720 row · 767 row · 768 col · 1023 col · 1024 col · 1280 row.

### Requirements

| ID | Requirement | Priority | Verified by |
|---|---|---|---|
| R16 | `theme.breakpoints.xs2` = 480px exists as a named rung, is consumed only by the two CTA `Flex` gates, and changes no existing breakpoint value. | P2 | AC16 |
| R17 | Both CTA rows follow `{base:'column', xs2:'row', md:'column', xl:'row'}`, with every gate value read from the theme at runtime. | P1 | AC17 |
| R18 | The detail-pattern stack boundary is `md`; the 8/4 span ratio is unchanged. | P1 | AC18 |
| R19 | `favorite` renders once, in the badges row of `MantineListingDetailPattern`, right-aligned to the content column's own edge at every supported width; it no longer renders inside the contact card. | P1 | AC19 |
| R20 | No production consumer, legacy source, or out-of-§3.2 path is changed; scoped detector stays zero; global finding set unchanged. | P0 | AC20 |

### Acceptance criteria

- **AC16** — `theme.ts` shows `xs2: '30em'` with `xs`/`sm`/`md`/`lg`/`xl`/`xxl` byte-identical; `grep` shows no consumer outside the two CTA gates; nothing in `src/`, `scripts/` or `.storybook/` iterates `theme.breakpoints`.
- **AC17** — the nine-width sweep above passes for **both** `Flex` rows, gate values derived from `theme.ts` at runtime.
- **AC18** — `Grid.Col span={{base:12, md:8}}` / `{base:12, md:4}`; rendered proof at 767 (stacked) and 768 (sidebar).
- **AC19** — favorite's right edge equals the content column's right edge (±2px) at 375/767/768/1024/1280; exactly one instance in the DOM; `MantineListingContactPattern` renders none.
- **AC20** — `git status` lists no production consumer or legacy path; scoped detector 0/exit 0; global finding set identical to the D69-19 transcript.

### Blocking evidence gap — the only outstanding work

R16–R20 and R13–R15 all have fresh **rendered** proof (`results.json`, 35/35, exit 0, captured 11:50 against a
Storybook built 11:48:53, i.e. after the final source edit at 11:47:40). What is missing is the **gate** evidence:
every retained transcript under `docs/sessions/evidence/task784/` predates 11:00, while this revision's source
changed at 11:13 (`theme.ts`) and 11:46–11:47 (both patterns, both stories). The session log §21 gate table
reports a **28-check** run; the final artifact records **35**, so that table describes a superseded, pre-D69-25
candidate.

Re-run the full set Windows-native against the **current** worktree and retain each transcript with its `EXIT=`
line, per this project's own capture discipline:

```powershell
node.exe -p process.platform
node scripts/check-design-tokens.mjs --strict --scope=mantine
npm.cmd run check:design-tokens
npx.cmd vitest run src/design-system/mantine/__tests__/theme.d69-18.test.tsx
npx.cmd vitest run scripts/__tests__/check-design-tokens.test.ts
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run check:stories
npm.cmd run check:story-coverage
npm.cmd run build-storybook
node scripts/task784-d69-19-browser-evidence.mjs
npm.cmd run build
```

`npm run build` exit 0 against the reviewed diff is mandatory for a non-Q0 task; it cannot be inherited from an
earlier candidate. Also correct §20/§21's `28/28` to `35/35`, and the header's stale claim that R14 is unresolved
— `cta-row-label-single-line-uk-1024` **passes** (`Зателефонувати`, height 14 = line-height 14).

### Notes, non-blocking

`MantineListingContactLabels.favoriteAriaAdd` is now a required label with no consumer in that pattern. Leave it
for a follow-up rather than widening this diff.

### Owner authorization and partial gate closure (2026-09-04, recorded by review)

**D69-22 confirmed by the owner in writing:** *"гейт на 480px — це моя вказівка"*. The 480px two-per-row gate is an
authorized owner decision, not an executor deviation. R17 supersedes R13's original `lg` gate; R13 is met in the form
recorded in §16 only for the ≥768 band, and the 480–767 row is intended behaviour. §17 is therefore fully authorized,
not merely ratified.

**Owner-native gate evidence supplied directly (PowerShell, `C:\Claude_Code_Projects\lero-al`):**

| Command | Result | Status |
|---|---|---|
| `npm run build` | `✓ Compiled successfully`, `✓ Checking validity of types`, 40/40 static pages, exit 0 | ✅ **mandatory non-Q0 gate SATISFIED** |
| `npm run build-storybook` | `Storybook build completed successfully`, exit 0 | ✅ satisfied |
| `npm run check:stories` (via `prebuild-storybook`) | PASSED — 140 files, 0 violations, 4 locales × 655 keys | ✅ satisfied |

Note `next build` prints `Skipping linting` and typechecks only the app graph, so `lint` and `tsc --noEmit` are **not**
covered by it — the stories and tests changed in this revision sit outside that graph.

**Still outstanding (the only remaining work in this task):**

```powershell
node scripts/check-design-tokens.mjs --strict --scope=mantine   # AC2/R2 — must be 0 findings, exit 0
npm.cmd run check:design-tokens                                  # global — finding set must be unchanged
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run check:story-coverage
npx.cmd vitest run src/design-system/mantine/__tests__/theme.d69-18.test.tsx
npx.cmd vitest run scripts/__tests__/check-design-tokens.test.ts
```

The browser suite does **not** need re-running: source has been unchanged since 11:47, and the retained 35/35 was
captured against a build of that exact source. `build-storybook` has since rebuilt `storybook-static` from the same
sources, which does not invalidate the capture.

Reviewer pre-checks against these seven, recorded so a failure is informative rather than surprising: the theme
contract test's consumer assertions still hold statically (`MantineListingContactPattern` resolves
`gap="micro"`×2 / `gap="compact"` / `listingContactStickyOffset`×2; `MantineListingDetailPattern` resolves
`gap="micro"`×2 / `gap="tight"`×4 / `line-height-listingDescription`), and neither changed story carries a dead
import. `theme.breakpoints.xs2`'s `'30em'` is a value inside `theme.ts`, the sole permitted value-definition
location under §2, so it should not register as a scoped finding — but that is exactly what the scoped run must
confirm rather than assume.

---

## 18. Gate closure (2026-09-04) + D69-26 record-correction pass

### All 12 QA-profile gates CLOSED — owner-native PowerShell, final diff

| Gate | Result | Verdict |
|---|---|---|
| `check-design-tokens --strict --scope=mantine` | 73/458 files, **0** violations / 0 stale / 0 missing-reason, exit 0 | ✅ **AC2/R2 — the task's core criterion, proven with `xs2` present in `theme.ts`** |
| `npm run check:design-tokens` (global) | 64 findings, exit 1 | ✅ finding set **identical to the D69-19 baseline** — same 21 files, same per-file counts, same 41 `raw-dimension-prop` / 23 `raw-inline-dimension` split; every file outside §3.2 |
| `npm run typecheck` | `tsc --noEmit`, no output, exit 0 | ✅ covers the stories/tests `next build` cannot see |
| `npm run lint` | 72 problems, **0 errors**, 72 warnings — count unchanged; **neither changed pattern nor either changed story appears** | ✅ |
| `npm run check:stories` | PASSED — 140 files, 0 violations | ✅ |
| `npm run check:story-coverage` | 27/27 manifest entries covered | ✅ |
| `npm run build-storybook` | exit 0 | ✅ |
| `npm run build` | compiled, types valid, 40/40 pages, exit 0 | ✅ mandatory non-Q0 gate |
| `vitest theme.d69-18.test.tsx` | **55/55** — incl. both changed patterns still resolving their named contracts | ✅ |
| `vitest check-design-tokens.test.ts` | **120/120** | ✅ |
| `task784-d69-19-browser-evidence.mjs` | **35/35**, exit 0 (retained; source unchanged since 11:47) | ✅ |

**R1–R20 are all `VERIFIED`.** No code work remains in this task.

### D69-26 — record-correction pass (the only outstanding executor work)

Documentation only. Change no source, no test, no script, no theme value. Re-run nothing.

| ID | Requirement | Priority |
|---|---|---|
| R21 | Session log §20 and §21 report `28/28` browser checks; the retained artifact records **35**. Correct both to `35/35` and note that §21's gate table described a pre-D69-25 candidate, superseded by the closure table in §18 above. | P3 |
| R22 | The session-log/header claim that R14 (`cta-row-label-single-line-uk-1024`) "remains unresolved" is false — it **passes** (`Зателефонувати`, height 14 = line-height 14, single line), fixed as a side effect of D69-22's piecewise gate placing 1024 in the `column` band. Correct it to `MET`, with that mechanism named. | P3 |
| R23 | Append a §22 recording: D69-22's 480px gate is an **owner-confirmed instruction** (quoted verbatim in §17); the D69-22…25 codes are ratified in kickoff §17; and R16–R20 are the backfilled requirements those changes are measured against. | P3 |

**AC21–AC23:** each corrected statement matches the retained artifact; `docs/backlog.md` stays ≤80 lines; `git status`
shows only `docs/` paths changed by this pass.

**Note, deliberately not fixed here:** `MantineListingContactLabels.favoriteAriaAdd` is now a required label with no
consumer in that pattern (the favorite moved out under D69-25). Removing it is an API change to a design-system
pattern and belongs in the same follow-up as the five inert `styles`-prop consumers — not in a documentation pass.

### Remaining gate on approval — owner only

`Patterns/Mantine/ListingDetailPattern` was **returned** in the §16 matrix and has since been rebuilt by D69-21…25.
Its geometry is now measured (favorite right-edge flush to the content column at 5 widths; CTA direction correct at
9 widths; labels single-line in `it`/`uk`), but a measurement is not an aesthetic acceptance, and this is the one
tuple that was returned once already. **One line from the owner — accepted or returned — converts this task to
`APPROVED`.** The other five tuples stay accepted and must not be re-reviewed.

---

## 19. D69-27 — badge/favorite centre-line fix (authored by the reviewer)

**Owner visual result, 2026-09-04:** `Patterns/Mantine/ListingDetailPattern` **ACCEPTED** at 320 / 768 / 1280 in `uk`,
with one exception: *"підправив центрування по вертикалі badge і кнопку «Додати в обране» … кнопка виглядає трохи
нижче, аніж badge рядок"*. Owner authorized the reviewer to make the change directly if it was small.

**Cause.** The row was `<Group justify="space-between" wrap="nowrap" align="flex-start">`. The favorite
`ActionIcon` is `size="lg"` (42px); a `Badge` is ~22px. Top-aligning two items of unequal height puts the badge
row's optical centre ~10px above the icon's, which reads as the heart sitting low. Not a spacing bug — an
alignment one.

**Change.** One token: `align="flex-start"` → `align="center"`, plus the explanatory comment. No spacing value, no
theme value, no new token, no structural change. At 320px, where the badges wrap to two rows, the icon now centres
against the whole badge block.

**Proved, not asserted.** `favorite-placement-{375,767,768,1024,1280}` in `task784-d69-19-browser-evidence.mjs` now
additionally measures the badge **group's** centre against the favorite's centre and fails outside ±2px. The
existing right-edge assertion is unchanged, so both properties must hold. Measuring the group rather than a single
Badge is what makes the 320px two-row case real coverage.

| ID | Requirement | Priority | Verified by |
|---|---|---|---|
| R24 | The badge row and the favorite control share a common centre line (±2px) at every supported width, including the wrapped two-row case; the favorite's right-edge alignment is unchanged. | P2 | AC24 |

**AC24** — `favorite-placement-*` passes at all five widths with both `heartRight ≈ contentRight` and
`heartCentreY ≈ badgeCentreY` within ±2px; browser suite exits 0.

### ⚠️ Authorship disclosure

The reviewer authored both this source change and its assertion, at the owner's explicit invitation. **It has
therefore had no independent review.** Two consequences, stated rather than glossed:

1. The measurement is objective and the owner sees the rendered result, but no second party has inspected the diff.
2. This is the one change in Task 784 that its reviewer did not receive from an executor.

If the re-run shows any `favorite-placement-*` failure, treat it as the reviewer's defect and hand it to the
executor with D69-26 rather than to the reviewer again.

### Defect record — the reviewer broke the story and the owner caught it

The first D69-27 attempt **broke `Patterns/Mantine/ListingDetailPattern`**. The reviewer placed the explanatory
JSX comment *inside* the expression container:

```jsx
{(badges.length > 0 || favorite) && (
  {/* comment */}          // ← invalid: `{` parses as an object literal, and the
  <Group …>                //   expression now has two children
```

Owner reported "сторі тепер зломана". Corrected by moving the comment **above** the conditional, where it is a
sibling in the `Stack`'s children. Two-armed parse proof, run against the repository's own TypeScript:

| Arm | Result |
|---|---|
| comment inside the `&&` container (as shipped) | **9 syntax diagnostics**, first: `')' expected.` |
| comment above the conditional (current) | **0 diagnostics** |

`scripts/task784-d69-19-browser-evidence.mjs` also re-parsed clean (0 diagnostics).

**Root cause of the process failure, not just the syntax:** the reviewer authored a source edit and handed it back
without parsing it even once. The Windows-native gate governs *verdict evidence*; it never prevented a syntax
check, and a parse needs no module resolution, no build, and no Windows. The rule this adds: **any source edit
authored by the reviewer is parsed before it is handed back, and the two-armed parse result is recorded here.**
That the owner found it first is the reviewer's failure, not a successful review step.

### Re-run required — a source file changed, so the §18 closure no longer covers the diff

```powershell
node scripts/check-design-tokens.mjs --strict --scope=mantine
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build-storybook
node scripts/task784-d69-19-browser-evidence.mjs
npm.cmd run build
```

Expected: scoped **0** exit 0 · typecheck 0 · lint 0 errors / 72 warnings · `build-storybook` 0 ·
browser **35/35 exit 0** with the new centre assertion live · `build` 0. The global detector, `check:story-coverage`
and both Vitest suites are unaffected by an `align` prop and need no re-run — `check:stories` runs anyway inside
`prebuild-storybook`.


---

## 20. Verdict — `APPROVED WITH NOTES` (2026-09-04)

All R1-R24 `VERIFIED`. Owner visual pass accepted all six tuples; the single alignment note is fixed (D69-27) and
measured at **0px** centre delta at 375/767/768/1024/1280 — exact, not merely inside the ±2px tolerance.

Final gate run, owner-native, against the post-D69-27 diff: scoped detector **0** exit 0 · typecheck 0 ·
lint 0 errors / 72 unchanged warnings · `check:stories` 140 files 0 violations · `build-storybook` 0 ·
browser **35/35** exit 0 · `build` compiled, types valid, 40/40 pages, exit 0. The global detector,
`check:story-coverage` and both Vitest suites were not re-run and did not need to be: an `align` prop cannot
change a detector finding set, a story import graph, or a named-contract source scan, and the scoped run covers
the one changed file.

**Notes carried (P3, non-blocking):** D69-26 (§18 R21-R23) — session log §20/§21 report `28/28` where the artifact
records 35, and the stale "R14 unresolved" claim. Plus the now-consumerless
`MantineListingContactLabels.favoriteAriaAdd`, deferred to the follow-up that also owns the five inert
`styles`-prop consumers.

**Reviewer-authored change on the record:** D69-27 was written by the reviewer, shipped broken once, and corrected
(§19). It is the one change here that no second party reviewed.
