# Task Q0R — Restrict all rendered CI gates to canonical Mantine stories; legacy is never blocking

## Mode and task type

- Mode: implementation kickoff for a fresh Sonnet session (execute via `.claude/skills/execute-task/SKILL.md`).
- Task type: **CI / governance infrastructure.** Changes what blocks every PR. High blast radius, low product-code
  surface. Profile `Q0 Docs/Governance` **plus** the gate-behavior proof rules (planted-violation) that normally
  belong to `Q4` — a gate claim requires observable-failure proof even when the change is "only" a script.
- Deliverable is script + workflow behavior, not UI. No product component changes.

## Owner directive being implemented

> The only mandatory CI scope is canonical Mantine stories. Legacy stories are not rendered, do not run locale-leak
> or rendered-proof, and cannot block a PR — they are deprecated code awaiting migration or replacement. Do not shard
> all stories or raise the timeout to accommodate legacy. First scope correctly; only then measure the real Mantine
> set's runtime.

Five requirements, verbatim intent:

1. Discovery finds **only** canonical Mantine stories, by an explicit canonical criterion.
2. `Rendered Proof` and `Locale Leak Detection` run over **only** that set.
3. Before running, each prints the exact composition: `Mantine stories: N; legacy excluded: M`.
4. An **empty** Mantine set is a hard error (non-zero exit) — never a false green.
5. The coverage gate requires a story only for components already in Mantine migration scope.

## The single canonical criterion (requirement 1)

Already defined and in use — **do not invent a second one.** `scripts/check-stories-rendered.mjs:269`:

```js
const MANTINE_STORY_TITLE_PREFIXES = ['Mantine/Primitives/', 'Patterns/Mantine/'];
```

A story is **canonical Mantine** iff its Storybook `title` starts with one of these prefixes. This is the sole
definition. Every gate in this task must use it, and it must live in **one** place both rendered scripts import,
not be re-typed per file. Create `scripts/lib/mantine-story-scope.mjs` exporting:

- `MANTINE_STORY_TITLE_PREFIXES`
- `isCanonicalMantineTitle(title): boolean`

Then `check-stories-rendered.mjs` and `check-locale-leak.mjs` both import it. `check-story-coverage.mjs` runs
pre-build (no index.json — see its section) and reuses only the prefix constant, applied to parsed source `title`.

## Current state (verified 2026-07-18)

| Concern | `check-stories-rendered.mjs` | `check-locale-leak.mjs` | `check-story-coverage.mjs` |
|---|---|---|---|
| Restricts to canonical Mantine | **Yes** — `--mantine-only` (line 81) skips ASSERT + geometry phases | **No** — scans all `allStories` (line 337) | **No** — requires a colocated story for all 103 components |
| Empty-set hard error | **Yes** (line 1334) | **No** | N/A yet |
| Prints composition | **No** — banner is misleading (see below) | **No** | Prints counts, wrong denominator |
| Wired in CI | rendered-proof job passes `--mantine-only` | locale-leak job passes **no flag** | blocking gate, line 92 |

### The misleading banner (requirement 3, rendered script)

`check-stories-rendered.mjs:1261-1263` prints unconditionally, before the `--mantine-only` branch:

```
📸  Starting rendered assertion (full mode)
    Assert stories: 85 | Viewports: 14 | Locales: 4
    Geometry-only stories: 154 (1848 cells...)
```

Under `--mantine-only`, none of those 85 assert stories or 154 geometry stories run (lines 1410, Phase-2 skip). The
banner announces work it does not do. This is the same class of defect as the split you already fixed: a gate
reporting a scope it does not enforce.

## Requirements

| ID | Requirement | Priority | Verification |
|---|---|---|---|
| Q1 | A single shared module defines the canonical criterion; both rendered scripts import it, no duplicated prefix list | P0 | Source inspection; grep shows the literal `'Mantine/Primitives/'` defined once |
| Q2 | `check-locale-leak.mjs` gains `--mantine-only`: filters scanned stories to canonical Mantine only | P0 | Run with/without flag; scanned-story list differs; legacy IDs absent under the flag |
| Q3 | Under `--mantine-only`, **both** scripts print exactly `Mantine selected: N; non-Mantine excluded: M` before the run, with correct N and M | P0 | Captured stdout of both runs |
| Q4 | The rendered banner no longer claims full-mode / assert / geometry counts when `--mantine-only` is set | P0 | Captured stdout |
| Q5 | Empty canonical-Mantine set → hard error, non-zero exit, in **both** scripts under `--mantine-only` | P0 | Planted-empty proof (below) for each |
| Q6 | `governance-pr.yml` locale-leak job runs `check:locale-leak -- --mantine-only` (add the npm script) | P0 | Workflow diff |
| Q7 | Coverage gate requires a canonical Mantine story only for components in migration scope; legacy components are not required and not exempted-by-hand | P0 | Gate run + planted proofs (below) |
| Q8 | A component is "covered" iff a canonical Mantine story **statically imports** it — not by filename, not by directory, not by exemption entry (owner ruling from Task 623R, reaffirmed) | P0 | Planted import-removal proof |
| Q9 | No matrix reduction anywhere: no `--fast`, no dropped stories/locales/viewports within the Mantine set; timeouts unchanged | P0 | Workflow + script diff |
| Q10 | After correct scoping, measure and record the real wall-clock time of each Mantine-only job | P1 | CI run durations recorded in the session log |

## Requirement 5 — coverage scope — OWNER DECIDED: explicit manifest (A)

The owner chose the explicit migration-scope manifest. Implement exactly this; do not fall back to the tautological
"scope = has a story" design.

**`scripts/mantine-migration-scope.json` — the source of truth.**

- Its entries are **real production components** — their source path / id (e.g. `src/components/layout/FooterView.tsx`).
  **Not** story files. A canonical Mantine story must statically import that exact component.
- **Seed it manually** with the six already-migrated Mantine components:
  `FooterView`, `HeaderView`, `HeaderActions`, `MobileNavDrawer`, `UserMenu`, `HeroSearchView` (use their real
  source paths, verified in the repo).
- **Do NOT generate the manifest from existing stories.** Deriving enrolment from the current story set reintroduces
  the tautology the manifest exists to avoid. It is a hand-maintained enrolment list.

**Coverage logic:**

- component in manifest **and** statically imported by ≥1 canonical Mantine story → **covered**;
- component in manifest **and** no canonical Mantine story imports it → **FAIL** (enrolled but unproven);
- component **not** in manifest → out of scope, **never checked, never blocking** (this is what removes the entire
  legacy surface from the gate).

**Governance obligation to record:** every future component migration to Mantine adds that component to the manifest
**in the same PR** as the migration. The manifest is how a migration announces itself to CI.

The six seeded components already have canonical Mantine stories importing them, so they pass without any
`story-coverage-exempt.json` entry — do not add exempt entries for them.

## Coverage gate runs PRE-BUILD — hard constraint

`check-story-coverage.mjs` runs at `governance-pr.yml:92`, **before** `build-storybook` (line 138). It has **no**
`storybook-static/index.json`. It must derive both the canonical-story set and the import edges from **source**:

- Parse each `src/stories/**/*.stories.tsx`: read its exported `meta.title` string literal → apply
  `isCanonicalMantineTitle`.
- For canonical story files, parse `import` statements → resolve which `src/components/**` module(s) they import.
- Do **not** attempt to read a built index; do **not** require a Storybook build for this gate.

Use a real parser path (the repo already parses story source in `check-stories.mjs` — reuse that approach) rather
than a brittle regex where a proper AST/token walk is available.

## Mandatory proofs (owner-specified — agent-contract clause 13)

A gate that cannot be shown to fail is not proven. These five are the owner's required evidence set. Capture the
failing output and the restored pass for each behavioral one:

1. **Leak inside the Mantine set is caught.** Plant an English-leak token into a canonical Mantine story, run
   `check:locale-leak --mantine-only`, confirm it FAILS and names that story, restore, confirm pass. (Proves the
   detector still works within the restricted scope — scoping did not neuter it.)
2. **Same leak in a legacy story is excluded.** Plant the identical leak into a **legacy** (non-canonical) story,
   run `--mantine-only`, confirm that story is **not scanned** and the run is unaffected by it. (Proves the filter
   actually excludes legacy, not just reorders output.)
3. **Empty Mantine set fails — both scripts.** Force the canonical set empty (filter to a prefix matching nothing),
   confirm non-zero exit with the hard-error message in `check-stories-rendered.mjs` **and** `check-locale-leak.mjs`,
   restore.
4. **Manifest-enrolled component without a Mantine story fails.** Temporarily add a real component that has no
   canonical Mantine story to `mantine-migration-scope.json`, confirm coverage FAILS naming it, remove, confirm pass.
   Also run the Q8 mechanism proof: remove the component import from an existing canonical story, confirm its
   manifest entry now fails, restore.
5. **CI prints the truthful count.** Both `--mantine-only` runs print `Mantine selected: N; non-Mantine excluded: M`
   with correct N and M, and the rendered banner no longer claims full-mode/assert/geometry scope. Capture verbatim.

## Out of scope

- Any change to legacy stories themselves, or to `ASSERT_STORIES` / geometry-only membership (they simply stop being
  CI-blocking; the mechanism stays for local `full` runs).
- Sharding, parallel-locale splitting, or timeout changes — explicitly forbidden until Q10 shows the real Mantine-set
  runtime justifies it.
- The `--mantine-only` banner wording beyond requirements 3/4 (the deeper "full mode" string cleanup is a P3
  governance follow-up already logged; fix only what Q3/Q4 require here).
- Product components, `theme.ts`, `footer-chrome.css` (those belong to Task 623R).

## Verification plan

Record **actual** output for each:

1. `node scripts/check-stories-rendered.mjs --mantine-only` → prints `Mantine selected: N; non-Mantine excluded: M`,
   no full-mode/assert/geometry banner; `972 cells, 0 FAIL` once Task 623R's `band-680` lands, or the current count
   before it. Record the composition line verbatim.
2. `node scripts/check-locale-leak.mjs --mantine-only` (build Storybook first) → prints the same
   `Mantine selected: N; non-Mantine excluded: M` line, scans only canonical Mantine IDs, explicit PASS/FAIL.
3. Both empty-set planted proofs (Q5).
4. `npm run check:story-coverage` → per OQ1 decision; plus the planted import-removal proof (Q8) and, if A, the
   manifest proof.
5. `git diff` of `governance-pr.yml`: locale-leak job now passes `--mantine-only`; nothing else weakened; timeouts
   unchanged; no `--fast`.
6. Confirm the shared module (`scripts/lib/mantine-story-scope.mjs`) is the only definition of the prefix list —
   `git grep "Mantine/Primitives/"` shows the literal once (plus story titles themselves).
7. Q10: after opening/refreshing the CI PR, record each Mantine-only job's real wall-clock duration.

## Completion report contract

Session log `docs/sessions/<date>-taskQ0R-*.md` + concise backlog update, containing: a Files Changed table matching
the diff; Q1–Q10 with evidence location each; both composition lines verbatim; all four planted-violation proofs
(fail output + restored pass); the manifest seeded with exactly the six components (their real
source paths) and confirmation none required an exempt entry; the measured job durations (Q10); assumptions,
deviations, limitations stated as such. Final status one of `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` /
`PARTIALLY IMPLEMENTED` / `BLOCKED` — never self-approval. The scope-source decision is settled (manifest, A); do
not reopen it or substitute the tautological design.

Handoff: execute via `.claude/skills/execute-task/SKILL.md` against this file path. Do not run or emit mutating git
commands.

## Task quality gate

- [x] The one canonical criterion is named from existing code, not reinvented; centralized into a shared module.
- [x] Each of the five owner requirements maps to ≥1 binary requirement ID with a verification method.
- [x] The one genuinely under-specified decision (migration-scope source of truth) is surfaced as an owner OQ with a
      recursion-trap explanation and a recommendation, not invented.
- [x] Every gate claim carries a mandatory planted-violation proof.
- [x] The pre-build constraint on the coverage gate is stated so the executor does not reach for a built index.
- [x] Matrix-reduction, sharding, and timeout changes are explicitly forbidden; runtime is measured only after
      correct scoping.
- [x] Scope names what stops blocking (legacy) versus what is deleted (nothing) — legacy mechanism stays for local
      full runs.
