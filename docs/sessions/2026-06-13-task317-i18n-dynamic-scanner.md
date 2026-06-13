# Session Log — 2026-06-13 — Task 317

**Task:** `tasks/Epics/Epic_II_kickoff_prompt_Task_317.md`
**Scope:** Dynamic-key missing-key scanner + `check:i18n-dynamic` wiring (script + docs only).
**Depends on:** Task 316 audit, `docs/governance-reports/2026-06-13-i18n-dynamic-key-audit.md`
(COMMITTED `65a97a8cc`).

**STATUS: DONE.** New manifest-driven scanner `scripts/check-i18n-dynamic.mjs`, seeded manifest
`scripts/i18n-dynamic-manifest.json`, seeded baseline `scripts/i18n-dynamic-baseline.json`, 3 new
`package.json` scripts, new `docs/i18n-rules.md`, one-line pointer added to
`docs/ai-behavior.md`. **`git diff --stat src` empty** (confirmed below).

---

## 1. Manifest — coverage vs audit §2

`scripts/i18n-dynamic-manifest.json` has **33 entries** covering **183 distinct
`namespace.key` pairs**, derived directly from the audit's §2 enumeration table (28 grouped
rows / 83 sites). The count differs from "28" because:

- Some §2 rows that share a namespace+enum were split or merged into single entries for
  manifest clarity (e.g. `listing-status` and `cabinet-status` are separate entries — same
  enum, different namespace).
- 3 keys (`listing.status_sold/status_rented/status_archived`) are intentionally listed in
  **two** entries (`listing-status` and `listing-badges`, per audit §2 sites #42/47 vs #64/66) —
  the scanner dedupes via a `namespace.key` set, so 186 listed pairs → **183 distinct** pairs
  checked.

**Reachability exclusions honored (audit §1a/§1b/§7.2), NOT added to the manifest:**
- `admin.user_profile.validation.error_phone_country_mismatch` — dead union member, never
  reaches `t()` (§1a).
- `floors_total` — non-`t()` raw label, no key to add (§1b).
- `listing.sort_by` — suspected orphan (§7.2), fully translated but zero references in `src/`,
  so not part of any reachable dynamic key set.
- Static-literal "all" companion keys (`filter_all`, `filter_mailbox_all`, `filter_status_all`,
  `filter_all_status`, `cabinet.filter_PREMIUM`'s out-of-family use) — these are reached via
  separate static `t('filter_all')`-style calls, not the dynamic enum, per §2/§7.1.

## 2. Baseline — Task 320 known gap

`scripts/i18n-dynamic-baseline.json` seeds exactly the 3 keys from audit GAP #1:
`admin.support.user_status_{active,blocked,inactive}`, each with `"locales": ["sq","en","uk","it"]`
and `"owner": "Task 320 — remove this entry when filled"` → 12 baselined cells, all `WARN`,
exit 0.

## 3. Positive flow — `npm run check:i18n-dynamic` on current tree

```
$ node scripts/check-i18n-dynamic.mjs
check:i18n-dynamic — 33 manifest entries, 183 distinct namespace.key pairs, 4 locales
  Source: docs/governance-reports/2026-06-13-i18n-dynamic-key-audit.md §2 (Task 316)

  WARN  (baselined — Task 320 — remove this entry when filled)  admin.support.user_status_active  [sq]
  WARN  (baselined — Task 320 — remove this entry when filled)  admin.support.user_status_active  [en]
  WARN  (baselined — Task 320 — remove this entry when filled)  admin.support.user_status_active  [uk]
  WARN  (baselined — Task 320 — remove this entry when filled)  admin.support.user_status_active  [it]
  WARN  (baselined — Task 320 — remove this entry when filled)  admin.support.user_status_blocked  [sq]
  WARN  (baselined — Task 320 — remove this entry when filled)  admin.support.user_status_blocked  [en]
  WARN  (baselined — Task 320 — remove this entry when filled)  admin.support.user_status_blocked  [uk]
  WARN  (baselined — Task 320 — remove this entry when filled)  admin.support.user_status_blocked  [it]
  WARN  (baselined — Task 320 — remove this entry when filled)  admin.support.user_status_inactive  [sq]
  WARN  (baselined — Task 320 — remove this entry when filled)  admin.support.user_status_inactive  [en]
  WARN  (baselined — Task 320 — remove this entry when filled)  admin.support.user_status_inactive  [uk]
  WARN  (baselined — Task 320 — remove this entry when filled)  admin.support.user_status_inactive  [it]

Summary: 183 keys checked · 4 locales · 12 baselined-warn(s) · 0 error(s)

check:i18n-dynamic PASSED.
$ echo "exit code: $?"
exit code: 0
```

`npm run check:i18n-dynamic` and `npm run check:i18n-dynamic:report` both confirmed working
through the npm wrapper (same output, `--report` variant prints
"Report-only mode (--report): exiting 0 regardless of findings." and exits 0).

## 4. Negative flow — all branches

### (1) Planted non-baselined miss → FAIL → restore → PASS

Deleted `"property_type_garage": "Garage"` from `messages/en.json` (line 58):

```
$ node scripts/check-i18n-dynamic.mjs
...
  ERROR  listing.property_type_garage  [en]

Summary: 183 keys checked · 4 locales · 12 baselined-warn(s) · 1 error(s)

check:i18n-dynamic FAILED — 1 non-baselined missing key(s) (see ERROR lines above).
Fix: add the key to messages/{sq,en,uk,it}.json, or, if intentional debt, add it to
scripts/i18n-dynamic-baseline.json with an owning task. Docs: docs/i18n-rules.md
$ echo "EXIT=$?"
EXIT=1
```

Restored the line, re-ran:

```
$ node scripts/check-i18n-dynamic.mjs > /tmp/out.txt; echo "EXIT=$?"
EXIT=0
$ git diff --stat messages/en.json
(empty)
```

`messages/en.json` is byte-identical to its pre-test state (confirmed via `git diff --stat`
returning empty).

### (2) Baselined miss → WARN, exit 0

Already demonstrated in §3 — the 12 `admin.support.user_status_*` cells (absent in all 4
locales, per Task 316 GAP #1) print as `WARN (baselined — Task 320 — remove this entry when
filled)` and do not affect the exit code (0).

### (3) Malformed manifest entry → non-zero, clear message → restore

Removed the `"namespace"` field from the first manifest entry (`listing-status`):

```
$ node scripts/check-i18n-dynamic.mjs
❌ check:i18n-dynamic — malformed manifest entry "listing-status": "namespace" must be a non-empty string.
$ echo "EXIT=$?"
EXIT=1
```

Restored from backup, re-ran — `diff` against pre-edit copy returned `IDENTICAL`, and
`node scripts/check-i18n-dynamic.mjs` exited 0 again.

### (4) Missing manifest / missing baseline → non-zero, clear message

```
$ mv scripts/i18n-dynamic-manifest.json /tmp/manifest-temp.json
$ node scripts/check-i18n-dynamic.mjs
❌ check:i18n-dynamic — scripts/i18n-dynamic-manifest.json not found / unreadable.
$ echo "EXIT(no-manifest)=$?"
EXIT(no-manifest)=1
$ mv /tmp/manifest-temp.json scripts/i18n-dynamic-manifest.json

$ mv scripts/i18n-dynamic-baseline.json /tmp/baseline-temp.json
$ node scripts/check-i18n-dynamic.mjs
❌ check:i18n-dynamic — scripts/i18n-dynamic-baseline.json not found / unreadable.
$ echo "EXIT(no-baseline)=$?"
EXIT(no-baseline)=1
$ mv /tmp/baseline-temp.json scripts/i18n-dynamic-baseline.json
```

### (5) Stale baseline entry → advisory INFO, exit unaffected

Added a fake baseline entry `"listing.status_pending": { "locales": ["sq","en"], "owner":
"Task 999 — stale test, remove" }` (a key that IS present in all locales):

```
$ node scripts/check-i18n-dynamic.mjs
...
  INFO — stale baseline entries (key now present, remove from baseline):
    listing.status_pending  [sq, en]  (owner: Task 999 — stale test, remove)

Summary: 183 keys checked · 4 locales · 12 baselined-warn(s) · 0 error(s)

check:i18n-dynamic PASSED.
$ echo "EXIT=$?"
EXIT=0
```

Restored `scripts/i18n-dynamic-baseline.json` to the 3-entry seeded state (rewritten via the
Write tool back to the canonical 12-cell `admin.support.user_status_*` baseline).

### (6) `--update-baseline`

Ran `node scripts/check-i18n-dynamic.mjs --update-baseline` against the restored baseline —
regenerated the same 3 entries (12 cells), preserving the `"owner": "Task 320 — remove this
entry when filled"` tags, exit 0. Confirmed output content unchanged (only array formatting
differs cosmetically — both are valid JSON with identical semantic content).

## 5. CI-wiring proposal (Task 323, propose only — not wired here)

`check:i18n-dynamic` should be added to `.github/workflows/governance-pr.yml`'s `governance`
job as a new step ("Dynamic-key resolved-key coverage gate (manifest-driven, baseline-diff)"),
positioned alongside the existing `check:i18n-hardcode` step and gated on the same path
triggers (`src/**`, `scripts/**`, `package.json`, `messages/**`) plus
`scripts/i18n-dynamic-manifest.json` and `scripts/i18n-dynamic-baseline.json` explicitly, since
those are the files that change when the dynamic-key surface changes. As designed, the gate
ships green today (12 baselined WARNs, 0 errors), so wiring it now would not break CI — but
per the kickoff's architecture decision 5, making it blocking is deferred to Task 323 +
explicit owner sign-off, since this is the first time a *dynamic*-key gate would run in CI and
the owner may want a soak period to confirm no false positives across the full manifest before
it can fail a PR.

## 6. Clauses 11/12/13 — N/A

No UI rendered, no component/story touched, no breakpoint or responsive surface affected. This
task added a governance script, a JSON manifest/baseline, npm wiring, and docs only. The mobile
<640 full-width gate and the breakpoint × locale render matrix do not apply.

## 7. Clause 14 — file-integrity transcript

```
=== scripts/check-i18n-dynamic.mjs ===
$ tr -cd '\000' < scripts/check-i18n-dynamic.mjs | wc -c
0
$ head -c 3 scripts/check-i18n-dynamic.mjs | xxd
00000000: 2321 2f                                  #!/
$ node --check scripts/check-i18n-dynamic.mjs && echo "node --check OK"
node --check OK
$ wc -l scripts/check-i18n-dynamic.mjs
223 scripts/check-i18n-dynamic.mjs

=== scripts/i18n-dynamic-manifest.json ===
$ tr -cd '\000' < scripts/i18n-dynamic-manifest.json | wc -c
0
$ head -c 3 scripts/i18n-dynamic-manifest.json | xxd
00000000: 7b0a 20                                  {.
$ node -e "JSON.parse(require('fs').readFileSync('scripts/i18n-dynamic-manifest.json','utf8')); console.log('JSON OK')"
JSON OK
$ wc -l scripts/i18n-dynamic-manifest.json
238 scripts/i18n-dynamic-manifest.json

=== scripts/i18n-dynamic-baseline.json ===
$ tr -cd '\000' < scripts/i18n-dynamic-baseline.json | wc -c
0
$ head -c 3 scripts/i18n-dynamic-baseline.json | xxd
00000000: 7b0a 20                                  {.
$ node -e "JSON.parse(require('fs').readFileSync('scripts/i18n-dynamic-baseline.json','utf8')); console.log('JSON OK')"
JSON OK
$ wc -l scripts/i18n-dynamic-baseline.json
29 scripts/i18n-dynamic-baseline.json

=== docs/i18n-rules.md ===
$ tr -cd '\000' < docs/i18n-rules.md | wc -c
0
$ head -c 3 docs/i18n-rules.md | xxd
00000000: 2320 69                                  # i
$ wc -l docs/i18n-rules.md
175 docs/i18n-rules.md
$ tail -c 100 docs/i18n-rules.md
 the
full Task 316 audit and `tasks/Epics/Epic_II_Global_i18n_Hardening.md` for the
full epic plan.
```

All four new files: 0 NUL bytes, no BOM, valid syntax/JSON, complete final content.
`docs/ai-behavior.md` and `package.json` (edited in-place, small additions) — no truncation,
edits applied successfully per harness write/edit confirmations.

## 8. `git diff --stat src messages` — confirmed EMPTY

```
$ git diff --stat src messages
(empty)
```

`messages/en.json` was temporarily edited during negative-flow test (1) and restored to its
original byte content (confirmed via `git diff --stat messages/en.json` returning empty after
restoration). `lint` (`npx eslint scripts/check-i18n-dynamic.mjs`) reports the same
"file ignored by matching ignore pattern" warning as the reference script
`scripts/check-i18n-parity.mjs` — consistent, 0 errors. `tsc` is N/A for a `.mjs` script.

---

## Files Changed

| File | Change | Rationale |
|---|---|---|
| `scripts/check-i18n-dynamic.mjs` | NEW — manifest-driven dynamic-key coverage scanner; mirrors `collectKeys()` from `check-i18n-parity.mjs` and the `--report`/`--update-baseline` baseline-diff pattern from `check-hardcoded-i18n.mjs` | Task 317 core deliverable |
| `scripts/i18n-dynamic-manifest.json` | NEW — 33 entries / 183 distinct `namespace.key` pairs, seeded from audit §2, with reachability exclusions per §1a/§1b/§7.2 | Task 317 manifest seed |
| `scripts/i18n-dynamic-baseline.json` | NEW — 3 keys × 4 locales (12 cells), `admin.support.user_status_{active,blocked,inactive}`, owner `Task 320` | Task 317 baseline seed (audit GAP #1) |
| `package.json` | Added `check:i18n-dynamic`, `check:i18n-dynamic:report`, `check:i18n-dynamic:update-baseline` scripts (after the `check:i18n-hardcode*` trio) | npm wiring per kickoff |
| `docs/i18n-rules.md` | NEW — canonical dynamic-key rule doc (§1-§8): the rule, scanner behavior, manifest maintenance, baseline, gate relationships, CI-wiring status, Epic II cross-reference | Task 317 docs deliverable |
| `docs/ai-behavior.md` | Added one-line pointer from "Localization (i18n) Rules" to `docs/i18n-rules.md` | Cross-reference, no rule-body duplication |

`messages/en.json` was temporarily edited and restored during negative-flow testing — no net
change (confirmed via `git diff --stat`).

---

## Self-validation

**Self-validation: src/messages diff=empty (messages/en.json restored byte-identical) ·
manifest 33 entries/183 distinct namespace.key pairs vs audit §2 (28 rows, with documented
split/merge + 3 intentional dupes) · reachability exclusions honored
(error_phone_country_mismatch, floors_total, listing.sort_by, static "all" companions) ·
baseline seeded with audit GAP #1 (12 cells, Task 320 owner) · positive flow exit 0 (12
baselined WARNs, 0 errors) · negative flow (1)-(6) all demonstrated and reverted · `--report`
and `--update-baseline` both verified · npm wiring verified through `npm run` · docs/i18n-rules.md
+ ai-behavior.md pointer shipped · clauses 11/12/13 N/A documented · clause 14 green for all 4
new files · PASS**
