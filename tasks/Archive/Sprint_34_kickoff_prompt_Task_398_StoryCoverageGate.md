# Sprint 34 — Task 398 — Story-coverage gate + scaffold template (tiered, documented exemption allowlist)

> **PARKED / NOT in the active focus.** Active chain is **395 → 396 → 397**. This file exists so the idea is not lost
> (owner directive 2026-06-05). Do NOT start 398 until 395/396/397 are approved. **Read `docs/agent-contract.md`
> (1–13) FIRST.** STOP & ASK if ambiguous.

```
Type:        tooling (coverage gate + scaffold) + governance
Priority:    MEDIUM — quality/coverage hardening; does NOT block the 395→396→397 chain
Depends on:  396 (reuse its gate-wiring + 'fail-on-new' baseline convention) and ideally 397 (clean baseline)
Area:        scripts/check-story-coverage.mjs (NEW), scripts/scaffold-story.mjs or a plop template (NEW),
             package.json scripts + CI wiring, docs/storybook-governance.md (new §) , a committed exemption allowlist
NON-goal:    Auto-GENERATING story content. Scaffolding a human-filled template is fine; auto-filler stories are banned.
```

## Why this task exists (and why NOT "make 109 stories")
The render gates (`check:locale-leak`, `screenshots:assert`) only see components that have a story; 138 components,
29 stories today. The **hardcode** blind spot is already closed by the Task 396 static scanner (source-level, no story
needed) — so this task is **not** about hardcode coverage. It is about ensuring components with real runtime-i18n /
interactive / responsive behavior get **render + screenshot + locale** coverage, while NOT forcing low-value stories on
trivial presentational primitives. Blanket "story for everything, auto-generated" is explicitly rejected: empty/
auto-filler stories with English fixtures are exactly what caused the Sprint 32 rejection and the 394/395 churn.

## Design (tiered, opt-out-with-justification)
- **Gate `check:story-coverage`:** every component under `src/components/**` (and any other agreed dirs) must EITHER
  have a colocated `*.stories.tsx` OR be listed in a committed exemption allowlist (e.g. `scripts/story-coverage-exempt.json`)
  with a one-line justification. A component that is neither = gate FAILS.
- **Tiering:** the exemption allowlist is for genuinely trivial presentational primitives with no user-facing strings /
  no interactive or responsive behavior (candidates: `separator`, `skeleton`, `scroll-area`, `sonner`, `progress` — to
  be confirmed during the task, not assumed). Each exemption must say WHY.
- **'Fail-on-new' rollout:** seed the exemption allowlist with today's storyless components so existing state does not
  block; from then on a NEW component must come with a story or an explicit (reviewed) exemption entry. Optionally flip
  to strict later once the backlog of "should-have-a-story" components is covered.
- **Scaffold (convenience, not coverage):** a generator (`npm run new:story <ComponentPath>` via a small script or plop
  template) that emits a story skeleton wired to the canonical `withCanvas`/`storyT`/`LocaleStress` patterns and the
  `layout:'fullscreen'` rule — with TODO placeholders the developer fills with REAL localized fixtures. The scaffold
  must produce a file that PASSES `check:stories` (no hardcode, no `layout:'centered'`, no `Ukrainian*` export) out of
  the box, i.e. it uses `storyT()` not raw strings.

## Pre-read (mandatory)
- `docs/agent-contract.md` (1–13) · `docs/backlog.md`
- `docs/storybook-governance.md` §13/§14 (gate-wiring, `check:stories` rules the scaffold must satisfy)
- `scripts/check-stories.mjs` + `scripts/check-hardcoded-i18n.mjs` (Task 396) — reuse their gate/baseline conventions
- `docs/component-rules.md`, `docs/rule-index.md` ("Storybook / visual snapshot" + "Component catalog/coverage" bundles),
  `docs/component-coverage-matrix.md` if present.

## Positive flow
- Build `check:story-coverage` → enumerate components, match colocated stories, diff against the exemption allowlist,
  report missing-coverage components; exit 1 only on a non-exempt component with no story (fail-on-new vs baseline).
- Seed the exemption allowlist from current storyless components, each with a justification stub for owner review.
- Build the scaffold generator + a story template that passes `check:stories` immediately.
- Wire `check:story-coverage` into `package.json` + CI alongside the other gates; document the new gate in
  `docs/storybook-governance.md`.

## Negative flow (must be proven)
- **Plant a new component** (`src/components/ui/__probe.tsx`) with no story and no exemption → gate FAILS naming it;
  add an exemption entry → passes; add a real story instead → passes; revert the probe. Paste transcripts.
- **Scaffold output is clean:** generate a story for a sample component → `check:stories` passes on it with ZERO manual
  edits (proves the template carries no hardcode / correct layout / `storyT`). Then show that leaving a raw English
  TODO string in it makes `check:stories` FAIL (proves the scaffold doesn't smuggle hardcode past the gate).
- **Exemption misuse guard:** an exemption entry pointing at a non-existent file → gate flags the stale entry.

## Acceptance criteria (machine-proven)
- `check:story-coverage` exists, wired into CI ('fail-on-new'); negative-flow plant proves it bites; existing storyless
  components are in a committed, justified exemption allowlist.
- Scaffold generator + template exist; generated story passes `check:stories` unmodified; negative proof that a raw
  string in it fails the gate.
- `node --check` passes on every new script and the file ends are verified complete (Task 395 lesson); `tsc=0`, `lint=0`;
  Files Changed table matches the real diff; session log with AC-by-AC self-audit.
- **No `git add`/`commit` from the executor** — orchestrator emits commits on review.

## Out of scope
- Actually writing the ~real stories for storyless components (separate, per-component or per-area tasks if the owner
  wants render coverage for specific components). Hardcode scanning (396) and remediation (397). Auto-generating story
  CONTENT (banned).
