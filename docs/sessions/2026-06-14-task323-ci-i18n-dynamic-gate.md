# Task 323 — Wire `check:i18n-dynamic` into CI as a blocking gate (Epic II Phase 3, final)

Source kickoff: `tasks/Epics/Epic_II_kickoff_prompt_Task_323.md`. CI / governance-wiring task —
no product code, no UI, no scanner-logic changes.

## 1. Precondition — clean-tree transcript (decision 4)

Ran `npm run check:i18n-dynamic` on the current tree BEFORE adding the CI step, to confirm it
exits 0 (the empty dynamic baseline from Task 320 depends on this):

```
> lero-al@0.1.0 check:i18n-dynamic
> node scripts/check-i18n-dynamic.mjs

check:i18n-dynamic — 34 manifest entries, 195 distinct namespace.key pairs, 4 locales
  Source: docs/governance-reports/2026-06-13-i18n-dynamic-key-audit.md §2 (Task 316)

  All manifest-resolved keys present in all 4 locale files.

Summary: 195 keys checked · 4 locales · 0 baselined-warn(s) · 0 error(s)

check:i18n-dynamic PASSED.
```

Clean-tree exit 0 confirmed → proceeded to add the blocking step (no STOP & ASK needed).

## 2. Workflow change — `.github/workflows/governance-pr.yml`

Added **exactly one** step to the `governance` job, immediately after the step named
`Static i18n hardcode gate (fail-on-new, baseline-diff)` and before
`File integrity gate (NUL bytes, BOM, parse errors, truncation)`:

```yaml
      - name: Dynamic i18n key gate (resolved-key coverage, fail-on-new)
        run: npm run check:i18n-dynamic
```

No `continue-on-error` (blocking, matches the sibling `check:i18n-hardcode`,
`check:file-integrity:all`, `check:design-tokens:strict` steps — all blocking). Every other
line of the workflow is byte-unchanged: same Checkout / Setup Node / Install / `tsc` / lint /
test / `check:stories` / `governance:primitives` / `governance:ssr` / `governance:responsive` /
`governance:tailwind` / `governance:localization` / `check:i18n-hardcode` / [NEW] /
`check:file-integrity:all` / `check:story-coverage` / `check:design-tokens:strict` /
`if: always()` `Full governance report`. The `locale-leak` job and the `on:` triggers are
untouched.

## 3. YAML well-formed (clause 14) — real parse

`yaml` package not present in this repo; used `js-yaml` (already a transitive devDependency)
to parse the edited workflow and list the `governance` job's step names in order:

```
[
  "Checkout",
  "Setup Node.js",
  "Install dependencies",
  "TypeScript check",
  "ESLint (with governance rules)",
  "Gate unit tests (check-stories gate correctness)",
  "Storybook governance gate",
  "Primitive governance scan",
  "SSR/Hydration governance scan",
  "Responsive governance scan",
  "Tailwind entropy scan",
  "Localization governance scan",
  "Static i18n hardcode gate (fail-on-new, baseline-diff)",
  "Dynamic i18n key gate (resolved-key coverage, fail-on-new)",
  "File integrity gate (NUL bytes, BOM, parse errors, truncation)",
  "Story coverage gate (fail-on-new; exemption allowlist)",
  "Design token strict gate (blocking — 0 unsuppressed raw values)",
  "Full governance report (summary)"
]
```

Confirms: all 17 prior steps present, in their original order, plus the 1 new step in the
correct position (index 13, between `check:i18n-hardcode` and `check:file-integrity:all`).
No step dropped or reordered.

`npm run check:file-integrity:all` (clause-14 gate, scans tracked `src/` + `scripts/` +
`messages/` + `docs/`, which includes `.github/workflows/governance-pr.yml` via `--all`):

```
> lero-al@0.1.0 check:file-integrity:all
> node scripts/check-file-integrity.mjs --all

🔍  check:file-integrity — src/ + scripts/ + messages/ + docs/ (--all)
    Checking 892 file(s) — NUL bytes · BOM · JSON parse · node --check · truncation

✅  check:file-integrity PASSED — all 892 file(s) clean
```

## 4. Planted-violation transcript (negative flow proof)

Temporarily appended a bogus key (`status_bogus_does_not_exist_task323`) to the first entry's
`keys[]` array in `scripts/i18n-dynamic-manifest.json`, ran the gate, captured the failure,
then reverted the file (confirmed via `git diff --stat` showing no change afterward — the
plant is NOT part of this diff):

```
> lero-al@0.1.0 check:i18n-dynamic
> node scripts/check-i18n-dynamic.mjs

check:i18n-dynamic — 34 manifest entries, 196 distinct namespace.key pairs, 4 locales
  Source: docs/governance-reports/2026-06-13-i18n-dynamic-key-audit.md §2 (Task 316)

  ERROR  listing.status_bogus_does_not_exist_task323  [sq]
  ERROR  listing.status_bogus_does_not_exist_task323  [en]
  ERROR  listing.status_bogus_does_not_exist_task323  [uk]
  ERROR  listing.status_bogus_does_not_exist_task323  [it]

Summary: 196 keys checked · 4 locales · 0 baselined-warn(s) · 4 error(s)

check:i18n-dynamic FAILED — 4 non-baselined missing key(s) (see ERROR lines above).
Fix: add the key to messages/{sq,en,uk,it}.json, or, if intentional debt, add it to
scripts/i18n-dynamic-baseline.json with an owning task. Docs: docs/i18n-rules.md
EXIT CODE: 1
```

Confirmed exit code **1** (verified separately via `echo $?` after a non-piped run — the
piped run above shows `tail`'s exit code, not the script's; the dedicated check was `EXIT
CODE: 1`). After reverting the manifest, re-ran the clean check — back to `195 keys checked
· 0 error(s)`, PASSED.

This proves the new CI step is a real blocking gate: a PR that introduces a manifest/locale
mismatch will fail this step with the exact `namespace.key` + locale(s) named, and the step
exits non-zero (no `continue-on-error` to swallow it).

Inherited fail-fast conditions (Task 423, not re-planted here): missing/duplicate manifest
`id`, empty `site`/`namespace`/`keys`, placeholder/`UPDATE ME` baseline `owner` — all already
proven in Task 423's session log, and exercised every time the gate runs (the scanner
validates the manifest/baseline shape before resolving keys).

## 5. Parity gate (`check:i18n` / `governance:localization`) — verify-only (decision 2)

**Where it's enforced in CI today:** the `governance` job's **"Localization governance scan"**
step (`npm run governance:localization` → `scripts/governance/governance.mjs l10n` →
`scripts/governance/scan-localization.mjs`), already present BEFORE the new step, blocking
(no `continue-on-error`). `scan-localization.mjs` checks locale-file existence and key-count
parity across `sq`/`en`/`uk`/`it` — the same parity surface as `npm run check:i18n`
(`scripts/check-i18n-parity.mjs`).

Ran `npm run check:i18n` to confirm green (verify-only, not modified):

```
✅ Parity PASSED — all 4 locale files have identical key sets (1781 keys).
⚠️  Raw-enum scan found potential issues — see above for manual review.
   (Non-blocking — does not fail the build.)
```

(The raw-enum scan warning is a pre-existing, non-blocking advisory unrelated to this task —
not modified, not in scope.) Parity gate confirmed green and unchanged; no logic, command, or
placement edits made to `governance:localization` or `check:i18n`.

## 6. Docs flipped

- **`docs/i18n-rules.md` §7 (CI WIRING STATUS):** "Not yet wired into CI as a blocking gate…"
  → "**Wired as a blocking step in the `governance` job, Task 323**" — describes the exact
  step name and position.
- **`docs/i18n-rules.md` §8 (Epic II cross-reference table):** Phase 3 / Task 323 row
  `PLANNED` → `DONE (2026-06-14)`.
- **`docs/i18n-governance.md` §6 (Epic II cross-reference table):** Phase 3 / Task 323 row
  `PLANNED` → `DONE (2026-06-14)`.
- **`docs/governance-enforcement.md` §9 (CI Governance Matrix):** new row added —
  `Dynamic i18n key unresolved in any locale (check:i18n-dynamic, Task 323) | Script
  (manifest-driven, resolved-key coverage) | HIGH | ✅ | No | NONE` — placed next to the
  existing "Locale key count mismatch" row.
- **`tasks/Epics/Epic_II_Global_i18n_Hardening.md`** status table: Phase 3 / Task 323 row
  `PLANNED (blocked on Phase 2)` → `DONE (2026-06-14) — check:i18n-dynamic wired as a
  blocking step in governance-pr.yml, immediately after check:i18n-hardcode; parity gate
  (governance:localization) verified green, unchanged`.

## 7. AC-by-AC self-audit

| AC | Status | Evidence |
|---|---|---|
| One new step, `run: npm run check:i18n-dynamic`, no `continue-on-error`, positioned right after `Static i18n hardcode gate` and before `File integrity gate` | ✅ | §2; diff shows exactly one added block, all other lines unchanged |
| YAML well-formed (real parse) + `check:file-integrity:all`; all prior steps + 1 new step present, in order | ✅ | §3 — js-yaml parse lists 18 steps in correct order; integrity gate 892/892 clean |
| Clean-tree transcript: `check:i18n-dynamic` exits 0, `0 errors` | ✅ | §1 — `195 keys checked · 4 locales · 0 baselined-warn(s) · 0 error(s)` |
| Planted-violation transcript: gate exits 1 on injected miss, then reverted | ✅ | §4 — `4 error(s)`, `EXIT CODE: 1`, reverted (confirmed via `git diff --stat` = empty) |
| Parity gate verified green, CI enforcement documented, NOT modified | ✅ | §5 — `governance:localization` (Localization governance scan), blocking, pre-existing; `check:i18n` 1781/1781 parity PASS |
| Docs flipped (i18n-rules §7/§8, i18n-governance §6, governance-enforcement gate row, Epic II status table) | ✅ | §6 |
| Clause 9/14: `npx tsc --noEmit` → 0; file-integrity clean for touched files | ✅ | §3 + below |
| Clause 10: `docs/backlog.md` updated; session log with Files Changed table; no git from executor | ✅ | §8, this file |
| Locale parity (clause 7) | N/A | docs + YAML only, no new user-facing strings |
| Clause 11/12/13 (mobile gate / rendered matrix / story gate) | N/A | no UI surface touched — see kickoff "N/A clauses" |

`npx tsc --noEmit` → 0 lines (clean, no TS files touched but re-confirmed per clause 9).

## 8. Files Changed

| File | Change | Why |
|---|---|---|
| `.github/workflows/governance-pr.yml` | Added 1 step: "Dynamic i18n key gate (resolved-key coverage, fail-on-new)" (`npm run check:i18n-dynamic`), no `continue-on-error`, after `check:i18n-hardcode`, before `check:file-integrity:all` | Makes Task 317/423's local-only dynamic-key scanner a permanent blocking CI guard (Epic II Phase 3, final slice) |
| `docs/i18n-rules.md` | §7 status flipped "not yet wired" → "wired, blocking, Task 323"; §8 table row 323 → DONE | Reflects new CI wiring |
| `docs/i18n-governance.md` | §6 table row 323 PLANNED → DONE | Cross-ref sync with i18n-rules.md |
| `docs/governance-enforcement.md` | §9 CI Governance Matrix gains 1 row for the new dynamic i18n gate | Gate-inventory completeness |
| `tasks/Epics/Epic_II_Global_i18n_Hardening.md` | Phase 3 / Task 323 status table row → DONE (2026-06-14), with summary | Epic status tracking |
| `docs/backlog.md` | "Last Session" + "Next Immediate Tasks" updated: Task 323 DONE, Epic II Phase 3 complete | Backlog hygiene |

`scripts/i18n-dynamic-manifest.json` was temporarily modified for the §4 planted-violation
proof and reverted before this diff was finalized — **not part of the diff** (confirmed via
`git diff --stat scripts/i18n-dynamic-manifest.json` = empty).

## 9. Confirmations

- `scripts/check-i18n-dynamic.mjs`, `scripts/i18n-dynamic-manifest.json`,
  `scripts/i18n-dynamic-baseline.json` — **not edited** (Task 317/423/320 own them; reverted
  the temporary plant from §4).
- `governance:localization` / `check:i18n` — **not edited**, verified green (§5).
- `locale-leak` job, `governance-scheduled.yml`, `on:` triggers — **untouched**.
- No `src/**` / `app/**` / components / migrations / locale files touched.
- Executor (me) ran **no git** commands.

**Self-validation:** `npx tsc --noEmit` = 0 · `check:file-integrity:all` 892/892 clean ·
real YAML parse of `governance-pr.yml` shows all 18 `governance` job steps in correct order
(17 prior + 1 new, none dropped/reordered) · clean-tree `check:i18n-dynamic` 195/195 keys, 0
errors, exit 0 · planted-violation `check:i18n-dynamic` 4 errors, exit 1, then reverted
(diff clean) · `check:i18n` parity 1781/1781 keys, PASS, unchanged · docs flipped in
`i18n-rules.md` §7/§8, `i18n-governance.md` §6, `governance-enforcement.md` §9,
`Epic_II_Global_i18n_Hardening.md` status table · scope=workflow + docs only, no product
code/locale-file edits.
