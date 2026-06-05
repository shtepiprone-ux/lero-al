### Task 393 — Task 392 rendered proof (run the detector + screenshot matrix) + wire the detector into CI

> # 🔴 WHY THIS EXISTS. Task 392's CODE is correct and every cheap gate is green (diff matches report, 4-locale
> parity 1749 keys, `check:stories` 11/0, `check:i18n` parity, gate tests 53 pass with real BAD+GOOD fixtures,
> `tsc=0`). But Task 392's DEFINING acceptance criteria are **rendered** proofs — AC1 (before/after JSON leak
> report from `check-locale-leak.mjs`) and AC2/AC3 (the `screenshots:assert` PNG/JSON matrix across sq·en·uk·it,
> uk@320/375/390). **Those were never produced.** The session log itself says the detector + `screenshots:assert`
> "require build-storybook first" — i.e. they were not run, and no `report.json` / PNG matrix is attached.
> Per `agent-contract.md` clause 12/13 + `orchestrator-role.md` "Rendered-evidence approval gate", a Storybook/UI
> task is NOT approvable on `tsc`/`diff` alone. The orchestrator could not reproduce in Cowork (storybook build
> EPERM on the mounted Windows drive; chromium not installed; 186 stories × 4 locales exceeds the sandbox budget),
> so the proof must be produced on the owner's Windows side. **No code rewrite is expected — this task PRODUCES
> the missing machine evidence and wires the detector so the guarantee is automatic.**

Type: corrective — rendered evidence run + CI wiring (no product-code rewrite expected)
Priority: CRITICAL (blocks Task 392 approval/commit)
Pre-read: `docs/agent-contract.md` (12,13) · `docs/orchestrator-role.md` → "Rendered-evidence approval gate" ·
`docs/storybook-governance.md` §14 · `scripts/check-locale-leak.mjs` · `scripts/check-stories-rendered.mjs`

> ## 🟡 SLIMMED SCOPE (owner directive 2026-06-05) — do the minimum that unblocks the commit
> This task was de-scoped by the orchestrator after relevance review. **Do NOT re-run the full conformance sweep.**
> Priority order, stop when the commit is unblocked:
> 1. **Part A (REQUIRED, gating):** run `check:locale-leak` on the owner's Windows side → `leakCount: 0`. Fix only
>    leaks that actually appear (de-hardcode via `storyT`/messages, 4-locale parity), then re-run. This is the one
>    proof that was never produced.
> 2. **Part C (REQUIRED, durable value):** wire `check:locale-leak` into `prebuild-storybook` + `governance-pr.yml`
>    (STOP&ASK on the CI-vs-doc fork first — see Part C). This makes the guarantee automatic so the class can't regress.
> 3. **Part B (RE-ACCEPT, do not re-run from scratch):** `screenshots:assert` was already green in Task 383 (348/348)
>    and Task 390 (812/812) against the same final fixtures. Re-confirm it still passes; only produce the named
>    AC3 PNGs if a cell is in doubt. Treat AC2/AC3 as re-acceptance, not a fresh full matrix.
> Everything below is the original full kickoff — read it, but apply it through the priority order above.

## Required after behavior

### Part A — Run the rendered locale-leak detector across all 4 locales (AC1 evidence)
1. `npm run build-storybook` (fresh — current `storybook-static` predates the 392 fixes).
2. `npx playwright install chromium` if not already installed.
3. `npm run check:locale-leak` (full mode — all viewports). Capture the emitted
   `.screenshots/locale-leak/<ts>/report.json`.
4. AFTER run MUST show **`leakCount: 0`** across sq/uk/it. If any leak appears, fix it (de-hardcode via
   `storyT`/messages with 4-locale parity) and re-run until 0.
5. Paste the full console output + the `report.json` `leakCount`/`leaks` into the session log.

### Part B — Run the rendered adaptation/screenshot matrix (AC2/AC3 evidence)
6. `npm run screenshots:assert` (full). Capture the pass/fail count and the JSON matrix.
7. AFTER MUST be **all green**, with explicit cells for: StatusChangeControl Select, Command (Inline), Skeleton,
   AdminLayout AdminToolbar — each full-width at <640 (AdminToolbar full-width <768) — and **uk@320/375/390**.
8. Attach the per-locale PNGs the kickoff for 392 required: RecentlyViewedSection clear-button on the title row
   (sq/en/uk/it @ 320/375/desktop) and a uk ListingCard row showing equal heights with a long-title neighbour.

### Part C — Wire the detector so the "guarantee" is automatic (Task 392 Part D gap)
9. `check:locale-leak` is currently a manual script only — it is NOT in `prebuild-storybook`, `build`, or
   `.github/workflows/governance-pr.yml` (which runs only `check:stories`). Either (a) add a CI job that builds
   Storybook and runs `check:locale-leak` + `screenshots:assert`, OR (b) if that is too heavy for CI by design,
   document the decision explicitly in `docs/storybook-governance.md` §14 and add the manual run to the release
   checklist. STOP&ASK the orchestrator which of (a)/(b) before editing the workflow.
10. Reconcile the `npm test` count discrepancy (backlog says `502/502`, session log says `505/505`) — paste the
    real `npx vitest run` total into the log.

## Acceptance (machine-evidenced)
- AC1 `check:locale-leak` run in all 4 locales; `report.json` attached; `leakCount: 0`.
- AC2 `screenshots:assert` all green; StatusChangeControl/Command/Skeleton/AdminToolbar full-width PNGs at <640
  (<768 toolbar); uk@320/375/390 present.
- AC3 RecentlyViewedSection clear-button-on-title-row PNGs (4 locales) + equal-height uk ListingCard-row PNG.
- AC4 Detector wiring decision implemented (CI job) or documented (STOP&ASK first); real `vitest` total recorded.
- AC5 No product-code regressions introduced; `tsc=0`, `check:stories=0`, `check:i18n` parity green.

## Files allowed to edit
Only if a leak/violation is found: the flagged `*.stories.tsx` + `messages/{sq,en,uk,it}.json` (parity).
Plus: `.github/workflows/governance-pr.yml` (only after STOP&ASK), `docs/storybook-governance.md` §14,
`docs/backlog.md`, session log. NO other product code without STOP&ASK.

## Evidence format (Sprint 33 standard)
The `report.json` (leakCount 0) + the `screenshots:assert` PNG/JSON matrix (uk@320/375/390) + the named PNGs are
the ONLY proof. NO `git add`/`commit` — the orchestrator commits Task 392 **and** 393 together only after
personally seeing `leakCount: 0` and the green matrix.
