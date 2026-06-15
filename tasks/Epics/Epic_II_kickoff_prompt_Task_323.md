# Task 323 kickoff — Wire `check:i18n-dynamic` into CI as a BLOCKING gate (Epic II Phase 3, final)

> **You are Claude Code Sonnet 4.6 in `lero-al`. Read `docs/agent-contract.md` (clauses 1–14) FIRST.** Conforms to the
> current P0 contract. This is a **CI / governance-wiring task** (no product code, no UI). **The orchestrator (Opus)
> emits all `git add`/`git commit` commands at review; you NEVER run git.**
> **Origin:** Epic II Phase 3 — the final slice. Phase 1 (316 audit / 317 scanner / 318 audit / 396+399 static gate) and
> Phase 2 (319 notif-locale fix / 320 dynamic-key remediation / 424 mobile popup) are done. The dynamic-key scanner
> `scripts/check-i18n-dynamic.mjs` (Task 317, hardened Task 423) exists and runs locally, but is **NOT yet a CI gate**
> (`docs/i18n-rules.md` §7). This task makes it a permanent **blocking** CI guard so new dynamic-key i18n leaks cannot
> merge.

```
Type:        chore (CI governance wiring — make an existing local gate blocking in CI)
Priority:    medium (locks in Epic II; no runtime behavior change)
Area:        .github/workflows/governance-pr.yml   (add ONE blocking step to the `governance` job)
             docs/i18n-rules.md · docs/i18n-governance.md · docs/governance-enforcement.md  (status flips)
             tasks/Epics/Epic_II_Global_i18n_Hardening.md · docs/backlog.md  (Phase 3 → DONE)
Output:      `npm run check:i18n-dynamic` runs as a BLOCKING step in the `governance` job of governance-pr.yml
             (no continue-on-error), proven to exit 0 on the clean tree and to FAIL (exit 1) on a planted miss.
             Parity gate (`check:i18n`) verified still green/blocking — NOT modified. Docs reflect "wired".
```

---

## Goal (concrete)

Add exactly **one** step to the existing `governance` job in `.github/workflows/governance-pr.yml`:

```yaml
      - name: Dynamic i18n key gate (resolved-key coverage, fail-on-new)
        run: npm run check:i18n-dynamic
```

placed **immediately after** the step **named** `Static i18n hardcode gate (fail-on-new, baseline-diff)` and
**before** the step **named** `File integrity gate (NUL bytes, BOM, parse errors, truncation)` — i.e. grouped with the
other i18n gates and before the `if: always()` `Full governance report` summary. **Anchor on the step NAMES, not line
numbers** (line numbers shift; the step names are stable). **No `continue-on-error`** (blocking). Every other line of the
workflow stays byte-unchanged. Then flip the documentation status from "not yet wired" to "wired, blocking, Task 323".

## Owner / orchestrator decisions (LOCKED — do NOT re-open; STOP & ASK if anything else is ambiguous)

1. **BLOCKING immediately — no advisory phase, no `continue-on-error`.** Rationale (owner, 2026-06-14): the dynamic
   baseline is **empty after Task 320** (`scripts/i18n-dynamic-baseline.json` → clean tree exits 0), the scanner was
   **hardened in Task 423** (fail-fast on invalid manifest/baseline), and this matches every sibling gate already in the
   `governance` job (`check:i18n-hardcode`, `check:file-integrity:all`, `check:design-tokens:strict` — all blocking, no
   `continue-on-error`). An advisory-first step would only create a needless future flip-task and give zero real
   protection against new dynamic i18n leaks.
2. **Parity gate (`check:i18n` / `governance:localization`) = VERIFY-ONLY.** Do **NOT** modify its logic, its command,
   or its placement. This task only **confirms it stays green** and **documents where it is enforced in CI** (regression
   check, not remediation scope). If you discover the parity check is somehow *not* enforced in CI at all, **STOP & ASK**
   — do not silently add or rewire it here (separate scope).
3. **No data edits.** Do **NOT** touch `scripts/check-i18n-dynamic.mjs` logic (hardened in 423),
   `scripts/i18n-dynamic-manifest.json`, or `scripts/i18n-dynamic-baseline.json`. Those belong to the scanner/remediation
   tasks (317/423/320). This task is wiring + docs only.
4. **Sequencing precondition.** This task assumes Tasks 319 / 320 / 424 are committed on `main` (the empty dynamic
   baseline depends on Task 320). **Before adding the blocking step, run `npm run check:i18n-dynamic` on the current tree
   and confirm it exits 0.** If it does NOT exit 0 on a clean tree, **STOP & ASK** — do **not** run
   `:update-baseline` to force-green (that would mask a real miss and defeat the gate).
5. **No production code.** No `src/**`, no `app/**`, no components, no migrations, no locale-file edits. Only the
   workflow YAML + the governance docs + backlog/session log.

## Pre-read (mandatory — do NOT "read all docs")

1. **Always:** `docs/agent-contract.md` (clauses 1–14) · `docs/backlog.md`.
2. **`.github/workflows/governance-pr.yml`** — the `governance` job step list (match the exact step style; note the
   `if: always()` summary step at the end and the separate `locale-leak` job, which you do NOT touch).
3. **`docs/i18n-rules.md`** — §3 (scanner modes / exit codes), §5 (baseline), **§7 (CI WIRING STATUS — the text you flip)**,
   §8 (Epic II cross-ref table).
4. **`docs/i18n-governance.md`** — §4 (CI wiring pattern for the sibling hardcode gate — mirror its doc style), §6 (Epic II table).
5. **`docs/governance-enforcement.md`** — the gate-inventory table (~line 444) where the new gate row is added.
6. `tasks/Epics/Epic_II_Global_i18n_Hardening.md` — Phase 3 / Task 323 description + status table.
7. **NOT in scope to read:** UI/design-system/storybook/responsive docs — this task touches no UI surface (see "N/A clauses").

## Current behavior to preserve (clause 3 / Note 20 — this task removes NO step)

- **Every existing step of the `governance` job stays, in order, byte-unchanged:** Checkout, Setup Node, Install,
  `tsc --noEmit`, `lint`, `npm test`, `check:stories`, `governance:primitives`, `governance:ssr`,
  `governance:responsive`, `governance:tailwind`, `governance:localization`, `check:i18n-hardcode`,
  `check:file-integrity:all`, `check:story-coverage`, `check:design-tokens:strict`, and the `if: always()`
  `Full governance report`. You ADD one step; you change/remove none.
- **The `locale-leak` job is untouched.**
- **The `on:` triggers are untouched** (already fire on `messages/**`, `scripts/**`, `src/**`, `package.json`,
  `eslint.config.mjs` — which already covers any change that could alter dynamic-key resolution).
- **The parity gate's logic/command/placement is untouched.**

## Positive flow (happy path)

- **Actor:** a PR to `main` touching `messages/**` or `src/**` (e.g. a normal feature PR).
1. The `governance` job runs; reaches the new **Dynamic i18n key gate** step.
2. `npm run check:i18n-dynamic` resolves every `namespace.key` in `scripts/i18n-dynamic-manifest.json` against all 4
   locale files; on a tree where they all resolve (baseline empty), the script prints its summary
   (`X keys checked · 4 locales · 0 baselined-warns · 0 errors`) and **exits 0**.
3. The step passes; the job proceeds to the remaining gates and the `Full governance report` summary; PR is mergeable
   (subject to the other gates).

## Negative flow (every off-happy-path branch — PROVE each)

- **New dynamic key value with no manifest/locale coverage:** a PR adds an enum value (or a manifest `keys[]` entry)
  whose `namespace.key` is missing from ≥1 locale → `check:i18n-dynamic` prints an `ERROR` line naming the exact
  `namespace.key` + locale(s) and **exits 1** → the CI step FAILS → PR is blocked. **PROVE with a planted-violation
  transcript:** temporarily inject one bogus miss (e.g. add a throwaway `keys` value that doesn't exist in the locales,
  OR temporarily remove one locale key), run `npm run check:i18n-dynamic`, capture the **non-zero exit + ERROR line**,
  then **revert** so the plant is NOT part of the diff. This proves the gate is real, not a no-op.
- **Invalid manifest / baseline (Task 423 fail-fast):** missing/duplicate `id`, empty `site`/`namespace`/`keys`, or a
  placeholder/`UPDATE ME` baseline `owner` → exit 1. You may reference these as inherited fail-fast conditions (already
  proven in Task 423) — no need to re-plant all of them, but note them in the log as part of why blocking is safe.
- **Clean tree:** `npm run check:i18n-dynamic` exits 0 (the positive baseline proof — paste this transcript too).

## Acceptance criteria (each maps to a flow / decision)

- **One** new step in the `governance` job: `run: npm run check:i18n-dynamic`, **no `continue-on-error`**, positioned
  right after the `Static i18n hardcode gate` step and before `File integrity gate` (decision 1) — verifiable in the diff;
  all other workflow lines unchanged.
- **YAML well-formed (clause 14) — REAL parse, not a structural eyeball:** validate the edited `governance-pr.yml` with
  an actual YAML parser (e.g. `node -e "require('yaml').parse(require('fs').readFileSync('.github/workflows/governance-pr.yml','utf8'))"`
  — or `js-yaml` if `yaml` is unavailable) AND run `npm run check:file-integrity:all` (the clause-14 gate that scans
  tracked files including the workflow). Paste BOTH transcripts; after the parse, confirm the `governance` job still lists
  every prior step + the one new step (no step dropped/reordered).
- **Clean-tree transcript:** `npm run check:i18n-dynamic` exits 0 with `0 errors` summary (decision 4) — pasted in the log.
- **Planted-violation transcript:** the gate exits **1** on an injected miss, then reverted (negative flow proof) — pasted.
- **Parity gate verified green and its CI enforcement documented; NOT modified** (decision 2) — note in the log which
  step/command enforces parity today and that it remains green.
- **Docs flipped:** `docs/i18n-rules.md` §7 ("Not yet wired…" → "Wired as a blocking step in the `governance` job,
  Task 323") + §8 table (323 → DONE); `docs/i18n-governance.md` §6 table (323 → DONE); `docs/governance-enforcement.md`
  gate-inventory gains a row for the dynamic gate; `tasks/Epics/Epic_II_Global_i18n_Hardening.md` Phase 3 status → DONE.
- **Clause 9/14:** `npx tsc --noEmit` → 0 (unchanged — no TS touched, but run it); file-integrity (0 NUL, no BOM,
  `.yml` parses, `.md` intact) for every touched file; AC-by-AC self-audit table + final "Self-validation:" line.
- **Clause 10:** `docs/backlog.md` updated; session log under `docs/sessions/` with a **"Files Changed" table**; executor
  emits **NO** git.
- **Locale parity (clause 7):** N/A — no new user-facing strings (docs + YAML only).

## N/A clauses (state explicitly — do NOT fabricate evidence for these)

This task touches **no UI surface**, so the following are **Not Applicable** and the reviewer will NOT expect their
artifacts:

- **Clause 11 (mobile <640 full-width gate)** — N/A (no component/overlay/control changed).
- **Clause 12 (rendered breakpoint × locale matrix)** — N/A (nothing renders).
- **Clause 13 (Storybook story gate / `screenshots:assert`)** — N/A (no story touched).

Do not invent a screenshot matrix or story for this task. The "rendered evidence" here is the **CI-gate transcripts**
(clean-tree exit 0 + planted-violation exit 1), which are the correct proof for a governance-wiring task.

## Out of scope

- **`scripts/check-i18n-dynamic.mjs` logic / `i18n-dynamic-manifest.json` / `i18n-dynamic-baseline.json` data** — do not
  edit (317/423/320 own them). If a clean-tree run is NOT green, STOP & ASK — do not `:update-baseline` to force it.
- **Parity gate (`check:i18n` / `governance:localization`) rework** — verify-only; do not change its logic.
- **Any other workflow job** (`locale-leak`, `governance-scheduled.yml`) — untouched.
- **`src/**` / `app/**` product code, locale files, migrations** — untouched.
- **New languages / translation editorial** — out of Epic II scope entirely.
- **Any `git add`/`git commit`** — the orchestrator emits commits at review (clause 10).
