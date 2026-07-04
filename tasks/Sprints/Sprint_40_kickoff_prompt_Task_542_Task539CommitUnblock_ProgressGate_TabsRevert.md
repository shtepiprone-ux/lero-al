# Task 542 — Task 539 commit-unblock: resolve Progress rendered-gate FAILs + revert premature Tabs block

> **Sprint 40 (TailAdmin Conformance — All Primitives). Owner P0, 2026-07-04.**
> **Executor:** Sonnet 4.6. **Type:** UI / rendered-gate resolution + a small revert (`theme.ts` / `input-chrome.css`
> / the Progress story / gate-tooling allowlist) — NOT product code.
> **Status:** OPEN. This finishes Task 539 so it can commit. Task 541 (Tabs segmented redesign) runs AFTER 539 commits.
> **Origin:** Orchestrator review of the real Task 539 diff + the owner's native gate run (2026-07-04):

```
npm run screenshots:assert -- --mantine-only
Results: 381/400 PASS, 16 FAIL, 3 AMBIGUOUS
  16 FAIL = 100% Mantine/Primitives/Progress/Default (sq/en/uk/it × 320/375/390/1024)
    ✗ render failure [loader-only]: spinner/loader still present at readiness timeout
    ✗ horizontal overflow detected
  3 AMBIGUOUS = Mantine/Primitives/Tabs/Default × {sq,uk,it} × mobile-320 (tab reachable by h-scroll)
```

The Progress primitive is in the pending Task 539 `theme.ts` diff (Scope A) — so those 16 are Task 539's **own**
deliverable failing its **own** enforced gate (clause 13). "Pre-existing/untouched" is NOT a valid closure for a
primitive this task ships. Because Progress and SegmentedControl share `theme.ts`, this blocks the whole 539 commit.

## Scope (exactly two items — no scope creep)

### 1. 🔴 Document the CONFIRMED Progress/Default gate false-positive + allowlist it — do NOT change the primitive

**Root cause is CONFIRMED (owner manual-QA, 2026-07-04) — the Progress primitive is visually correct; the 16 FAILs
are a gate false-positive.** The owner personally rendered `Mantine/Primitives/Progress/Default` in Storybook across
**all 4 locales @ 320 (en/uk/sq/it) + 375 (en/uk) + 480 (uk) + 1280 (uk)** and confirmed *"Progress bar виглядає
нормально"*: §6 chrome present (gray-200 pill track, brand fill), sizes sm/md/lg/xl = 8/12/16/20px, all determinate
values (0/20/45/72/80/100/clamped-150/-30) render correctly, and the long `sq/uk/it` label **wraps in the label row,
never clips, no horizontal scroll at 320**. So `theme.ts`'s `Progress` block is CORRECT — **do NOT modify the Progress
primitive, its story, or `MantineProgress.tsx`.**

The 16 `[loader-only]` FAILs are the readiness detector in `scripts/check-stories-rendered.mjs` classifying the
determinate Mantine `Progress` bar (`role="progressbar"`) as a perpetual loading spinner — the one primitive whose
entire visual purpose is to look like a loader — so the cell never reaches "ready", times out `[loader-only]`, and the
`horizontal overflow` is then measured on the never-ready page (it also fires on `desktop-1024`, which a genuine mobile
overflow never would). This is a Task 529/538-class gate blind spot, not a defect.

**Do this (gate-tooling + docs only):**
- Add a **narrow, documented exemption** following the Task 529 §14.9 / Task 538 precedent: the readiness check must
  not treat a `Mantine/Primitives/Progress` determinate `progressbar` as a perpetual loader. **Scope the fix to the
  Progress story family only** (e.g. skip the loader-heuristic when the readied root's only "spinner-like" element is a
  `role="progressbar"`, or an explicit per-story allowlist) — do NOT weaken loader/spinner detection globally, or you
  reopen the blind spot for real loaders.
- Record the limitation + this exemption in `docs/storybook-governance.md` (the §14.9-style gate-limitations section)
  with an explicit **owner-acknowledged manual-QA note** citing the 2026-07-04 render set above (en/uk/sq/it@320 +
  en/uk@375 + uk@480 + uk@1280). If the owner supplies the PNGs, store them under
  `docs/sessions/assets/task539/progress-owner-manualqa/`; otherwise reference the acknowledgement in the session log.

**Definition of done for item 1:** the native `screenshots:assert -- --mantine-only` run shows **Progress/Default no
longer red** (passes, or is excluded via the documented owner-acknowledged exemption), the enforced gate exits clean,
and the Progress primitive itself is UNCHANGED (grep-prove no diff to `theme.ts` Progress block / `MantineProgress.tsx`
/ `Progress.stories.tsx`). Zero unexplained red Progress cells.

### 2. Revert the premature Task 539 Tabs text-color block

Delete the `.mantine-Tabs-tab` + `.mantine-Tabs-tab[data-active]` block (the "Tabs — §6c-analog … Task 539 Scope C
finding" comment + its two rules) from `src/design-system/mantine/input-chrome.css`. It styled the **underline**
Tabs (active = `brand-7`), which the owner's 2026-07-04 decision supersedes — Task 541 rebuilds Tabs as the §6c/§6l
**segmented/pill** look (white active pill + `gray-9`, not brand text). Removing it now keeps the 539
`input-chrome.css` diff to SegmentedControl-only and prevents a stale/contradictory rule. Grep-prove the block is
gone in the session log. The 3 AMBIGUOUS Tabs-swipe cells are the current underline Tabs at 320 — leave them; Task
541 resolves the Tabs mobile behavior.

## Out of scope (do NOT touch)

The SegmentedControl `theme.ts`/`input-chrome.css` rules (Scope B — already orchestrator-verified against §6c),
any other primitive, any Tabs redesign (that is Task 541), any product code under `src/app`/`components`.

## Pre-read (rule-index → UI / layout / component + Storybook)

- `docs/agent-contract.md` (clauses 1–16) + `docs/backlog.md` + `docs/critical-flow-registry.md` (scan — no flow
  touched; confirm).
- `docs/mantine-responsive-design-system.md` §7 (mobile gate), §8 (Mantine proof path), §16, §18.
- `docs/storybook-governance.md` §14 + its §14.9-style gate-limitation/exemption section (for item 1 if it is a
  documented false-positive).
- `docs/tailadmin-style-reference.md` §6 Progress row (the values Progress must match).
- `docs/ui-rules.md`, `docs/component-rules.md`, `docs/qa-rules.md`.

## Gates to close (HELD until green)

- `npm run screenshots:assert -- --mantine-only` — Progress/Default resolved per item-1 DoD; SegmentedControl still
  PASS; only the 3 Tabs-swipe ambiguous cells remain (they move to Task 541). Attach the manifest.
- Direct computed-style + screenshot proof for Progress §6 conformance + no-320-overflow (item 1).
- `npx tsc --noEmit`, `check:stories`, `check:i18n`, `check:mojibake`, `check:design-tokens -- --strict`,
  `check:file-integrity` — all green.
- Regression (clause 15): no registry flow touched — confirm & state.

## Acceptance criteria

1. Progress/Default 16-cell gate result resolved: all PASS, or a narrow documented owner-acknowledged exemption with
   attached direct proof of §6 chrome + no-320 h-overflow. No unexplained red Progress cell. (clause 13)
2. The Task 539 `.mantine-Tabs-tab` underline block is removed from `input-chrome.css` (grep-proven). (clause 1)
3. SegmentedControl (Scope B) unchanged and still PASS; no other primitive regressed (Note 14).
4. All light gates green; native rendered manifest attached.
5. Session log: Files-Changed table, AC-by-AC self-audit, `Self-validation: …` line. **Do NOT run git** — HELD for
   orchestrator diff review + commit emission.

## Commit hand-off (HELD)

Do NOT emit `git add`/`git commit`. After this task's diff + native gate are verified, the orchestrator emits the
**Task 539 commit** (Progress Scope-A files + SegmentedControl `theme.ts`/`input-chrome.css` + tracker + session
logs + assets, as one task commit — `theme.ts` couples Progress+SegmentedControl so they land together), plus this
Task 542 commit (the revert + any gate-tooling/allowlist edit), plus the backlog numbering bump (540→542) and the
539/541/542 status lines — all explicit-path, owner-run in PowerShell after the native gate. Task 541 (Tabs
segmented) then builds from that committed base.
