# Session Log — 2026-06-13 — Task 423

**Task:** `tasks/Epics/Epic_II_kickoff_prompt_Task_423.md`
**Scope:** Harden `scripts/check-i18n-dynamic.mjs` manifest/baseline structural validation
(script + docs only). Non-blocking follow-up to Task 317.

**STATUS: DONE.** Two new fail-fast structural checks added to
`scripts/check-i18n-dynamic.mjs` (manifest `id`/`site`/unique-`id`; baseline `owner`/no
`UPDATE ME` placeholder), `--update-baseline` now prints a placeholder notice, and
`docs/i18n-rules.md` documents both new mandatory-field rules. **Zero data edits** —
`scripts/i18n-dynamic-manifest.json` and `scripts/i18n-dynamic-baseline.json` are
byte-identical to the Task 317 commit (diffed below). `git diff --stat src` empty.

---

## 1. Changes to `scripts/check-i18n-dynamic.mjs`

- New constants: `PLACEHOLDER_OWNER = 'UPDATE ME — owning task'` and
  `PLACEHOLDER_OWNER_RE = /UPDATE ME/i` — single source of truth shared by the new baseline
  validator and the `--update-baseline` writer (decision 4).
- Manifest per-entry validation loop (existing `namespace`/`keys` checks) extended, BEFORE
  those checks, with: non-empty `id` (tracked in a `seenManifestIds` Set for uniqueness — a
  duplicate `id` fails immediately) and non-empty `site`.
- New structural-validation block immediately after the baseline is parsed (before the
  `missingByKey` coverage scan, per decision 2): every baseline entry must have a non-empty
  string `owner` that does not match `PLACEHOLDER_OWNER_RE`.
- `--update-baseline` unchanged in shape (still writes `PLACEHOLDER_OWNER` for brand-new
  misses, preserves existing real owners) but now counts how many new entries got the
  placeholder and, if `> 0`, prints: `"N new entry(ies) written with placeholder owner —
  assign an owning task before the gate will pass."` (decision 5). No `--owner=` flag added
  (explicitly rejected).
- WARN/ERROR per-locale classification and stale-baseline INFO logic: **untouched**.

## 2. Positive flow — no regression

```
$ node scripts/check-i18n-dynamic.mjs
check:i18n-dynamic — 33 manifest entries, 183 distinct namespace.key pairs, 4 locales
  Source: docs/governance-reports/2026-06-13-i18n-dynamic-key-audit.md §2 (Task 316)
  ... (12 WARN lines, admin.support.user_status_* x 4 locales, Task 320 owner) ...

Summary: 183 keys checked · 4 locales · 12 baselined-warn(s) · 0 error(s)

check:i18n-dynamic PASSED.
$ echo "EXIT=$?"
EXIT=0
```

Identical to Task 317's success state — 12 baselined WARNs, 0 errors, exit 0.

## 3. Negative flow — all branches

### (1) Manifest entry missing `id`

```
$ node -e "... delete m.entries[0].id ... write back ..."
$ node scripts/check-i18n-dynamic.mjs
❌ check:i18n-dynamic — malformed manifest entry {"site":"src/lib/i18n/listingStatusLabel.ts:39","namespace":"listing", ...}: "id" must be a non-empty string.
$ echo "EXIT=$?"
EXIT=1
```
Restored from backup → `node scripts/check-i18n-dynamic.mjs` exits 0.

### (2) Manifest entry missing `site`

```
$ node -e "... delete m.entries[0].site ..."
$ node scripts/check-i18n-dynamic.mjs
❌ check:i18n-dynamic — malformed manifest entry "listing-status": "site" must be a non-empty string.
$ echo "EXIT=$?"
EXIT=1
```
Restored from backup; `diff` against pre-edit copy → `IDENTICAL`; exit 0 re-confirmed.

### (3) Duplicate `id`

```
$ node -e "... m.entries[1].id = m.entries[0].id ..."
$ node scripts/check-i18n-dynamic.mjs
❌ check:i18n-dynamic — duplicate manifest entry id "listing-status".
$ echo "EXIT=$?"
EXIT=1
```
Restored from backup; `diff` → `IDENTICAL`; exit 0 re-confirmed.

### (4) Baseline entry missing `owner`

```
$ node -e "... delete b['admin.support.user_status_active'].owner ..."
$ node scripts/check-i18n-dynamic.mjs
❌ check:i18n-dynamic — baseline entry "admin.support.user_status_active" must have a non-empty "owner".
$ echo "EXIT=$?"
EXIT=1
```
Restored from backup; exit 0 re-confirmed.

### (5) Baseline entry with `UPDATE ME` placeholder owner

```
$ node -e "... b['admin.support.user_status_active'].owner = 'UPDATE ME — owning task' ..."
$ node scripts/check-i18n-dynamic.mjs
❌ check:i18n-dynamic — baseline entry "admin.support.user_status_active" still has the placeholder owner — assign an owning task.
$ echo "EXIT=$?"
EXIT=1
```
Restored from backup; `diff` → `IDENTICAL`; exit 0 re-confirmed.

### (6) `--update-baseline` self-enforcing loop

Planted a non-baselined miss (deleted `"property_type_garage": "Garage"` from
`messages/en.json`), then ran `--update-baseline`:

```
$ node scripts/check-i18n-dynamic.mjs --update-baseline
... 12 existing WARN lines ...
  ERROR  listing.property_type_garage  [en]

Summary: 183 keys checked · 4 locales · 12 baselined-warn(s) · 1 error(s)

Baseline written -> scripts/i18n-dynamic-baseline.json (4 entries).
1 new entry(ies) written with placeholder owner — assign an owning task before the gate will pass.
$ echo "EXIT=$?"
EXIT=0
```

Normal run immediately after — FAILS on the placeholder:

```
$ node scripts/check-i18n-dynamic.mjs
❌ check:i18n-dynamic — baseline entry "listing.property_type_garage" still has the placeholder owner — assign an owning task.
$ echo "EXIT=$?"
EXIT=1
```

Set a real owner on the new entry — passes (13 baselined-warns now):

```
$ node -e "... b['listing.property_type_garage'].owner = 'Task 423 — self-enforcing-loop test, will be reverted' ..."
$ node scripts/check-i18n-dynamic.mjs
...
  WARN  (baselined — Task 423 — self-enforcing-loop test, will be reverted)  listing.property_type_garage  [en]

Summary: 183 keys checked · 4 locales · 13 baselined-warn(s) · 0 error(s)

check:i18n-dynamic PASSED.
$ echo "EXIT=$?"
EXIT=0
```

Restored both `messages/en.json` (re-added `property_type_garage`) and
`scripts/i18n-dynamic-baseline.json` (copied back from the pre-test backup):

```
$ diff /tmp/baseline-bak423.json scripts/i18n-dynamic-baseline.json && echo "baseline IDENTICAL"
baseline IDENTICAL
$ diff /tmp/en-bak423.json messages/en.json && echo "IDENTICAL"
IDENTICAL
$ node scripts/check-i18n-dynamic.mjs
... 12 WARN lines ...
Summary: 183 keys checked · 4 locales · 12 baselined-warn(s) · 0 error(s)
check:i18n-dynamic PASSED.
$ echo "EXIT=$?"
EXIT=0
```

### Regression proofs (Task 317 branches still hold)

**(a) Planted non-baselined miss → FAIL → restore → PASS**

```
$ node -e "... delete en.listing.property_type_garage ..."
$ node scripts/check-i18n-dynamic.mjs
...
  ERROR  listing.property_type_garage  [en]
check:i18n-dynamic FAILED — 1 non-baselined missing key(s) (see ERROR lines above).
$ echo "EXIT=$?"
EXIT=1
$ <restore messages/en.json from backup>
$ node scripts/check-i18n-dynamic.mjs
...
check:i18n-dynamic PASSED.
$ echo "EXIT=$?"
EXIT=0
$ diff /tmp/en-bak423.json messages/en.json && echo "IDENTICAL"
IDENTICAL
```

**(b) Malformed `namespace` / missing manifest → exit 1**

```
$ node -e "... m.entries[0].namespace = '' ..."
$ node scripts/check-i18n-dynamic.mjs
❌ check:i18n-dynamic — malformed manifest entry "listing-status": "namespace" must be a non-empty string.
$ echo "EXIT=$?"
EXIT=1
$ <restore manifest from backup, diff IDENTICAL>

$ mv scripts/i18n-dynamic-manifest.json /tmp/manifest-tmp423.json
$ node scripts/check-i18n-dynamic.mjs
❌ check:i18n-dynamic — scripts/i18n-dynamic-manifest.json not found / unreadable.
$ echo "EXIT=$?"
EXIT=1
$ mv /tmp/manifest-tmp423.json scripts/i18n-dynamic-manifest.json
$ node scripts/check-i18n-dynamic.mjs
... check:i18n-dynamic PASSED. EXIT=0
```

## 4. No data change — manifest/baseline byte-diff vs Task 317 commit

```
$ diff /tmp/manifest-bak423.json scripts/i18n-dynamic-manifest.json && echo "manifest IDENTICAL"
manifest IDENTICAL
$ diff /tmp/baseline-bak423.json scripts/i18n-dynamic-baseline.json && echo "baseline IDENTICAL"
baseline IDENTICAL
```

(`/tmp/manifest-bak423.json` and `/tmp/baseline-bak423.json` were copied from
`scripts/i18n-dynamic-manifest.json` / `scripts/i18n-dynamic-baseline.json` at the start of
this session, before any negative-flow plants.)

## 5. Clauses 11/12/13 — N/A

No UI rendered, no component/story touched, no breakpoint or responsive surface affected.
This task edited one governance script's validation logic and one docs file. The mobile <640
full-width gate and the breakpoint × locale render matrix do not apply.

## 6. Clause 14 — file-integrity transcript

```
=== scripts/check-i18n-dynamic.mjs ===
$ tr -cd '\000' < scripts/check-i18n-dynamic.mjs | wc -c
0
$ head -c 3 scripts/check-i18n-dynamic.mjs | xxd
00000000: 2321 2f                                  #!/
$ node --check scripts/check-i18n-dynamic.mjs && echo "node --check OK"
node --check OK
$ wc -l scripts/check-i18n-dynamic.mjs
259 scripts/check-i18n-dynamic.mjs
$ node scripts/check-i18n-dynamic.mjs > /tmp/t423-final2.txt; echo "EXIT=$?"
EXIT=0
$ tail -3 /tmp/t423-final2.txt
Summary: 183 keys checked · 4 locales · 12 baselined-warn(s) · 0 error(s)

check:i18n-dynamic PASSED.

=== docs/i18n-rules.md ===
$ tr -cd '\000' < docs/i18n-rules.md | wc -c
0
$ head -c 3 docs/i18n-rules.md | xxd
00000000: 2320 69                                  # i
$ wc -l docs/i18n-rules.md
195 docs/i18n-rules.md
$ tail -c 80 docs/i18n-rules.md
udit and `tasks/Epics/Epic_II_Global_i18n_Hardening.md` for the
full epic plan.
```

Both files: 0 NUL bytes, no BOM, valid syntax, complete final content.
`npx eslint scripts/check-i18n-dynamic.mjs` was **ignored** — the file matches ESLint's ignore
pattern (same as `check-i18n-parity.mjs`), so it was **NOT linted**; this is *not* "lint clean".
Syntax is instead validated by `node --check` (OK, above). `tsc` N/A for `.mjs`.

## 7. `git diff --stat src` — confirmed EMPTY

```
$ git diff --stat src
(empty)
```

`messages/en.json` and `scripts/i18n-dynamic-baseline.json` were temporarily edited during
negative-flow tests (3) and (6) and restored byte-identical (confirmed via `diff` against
pre-test backups above).

---

## Files Changed

| File | Change | Rationale |
|---|---|---|
| `scripts/check-i18n-dynamic.mjs` | Added `PLACEHOLDER_OWNER`/`PLACEHOLDER_OWNER_RE` constants; manifest validation now requires unique non-empty `id` + non-empty `site` (in addition to existing `namespace`/`keys` checks); new baseline structural-validation block requires non-empty, non-placeholder `owner` per entry; `--update-baseline` prints a placeholder-owner notice | Task 423 — closes the two validation gaps flagged at Task 317 review |
| `docs/i18n-rules.md` | §3 fail-fast conditions updated for `id`/`site`/`owner`/placeholder; §4 manifest-maintenance section documents mandatory unique `id` + `site`; §5 baseline section documents mandatory non-placeholder `owner` + the self-enforcing `--update-baseline` loop | Task 423 docs deliverable |
| `docs/backlog.md` | "Last Session" Task 423 entry + Epic II queue note | Mandatory backlog update (agent-contract clause 10) |
| `docs/backlog-archive.md` | Older session row archived | Backlog-tidy rule (owner P0 2026-06-12) |
| `docs/sessions/2026-06-13-task423-i18n-dynamic-scanner-hardening.md` | This session log (new file) | Required session log (agent-contract clause 10) |

No manifest/baseline data changed (`scripts/i18n-dynamic-manifest.json`,
`scripts/i18n-dynamic-baseline.json` byte-identical to the Task 317 commit — diffed in §4
above). No `src/`, `messages/`, or `package.json` changes.

---

## Self-validation

**Self-validation: src/messages diff=empty (messages/en.json restored byte-identical) ·
manifest/baseline data byte-identical to Task 317 (no namespace/keys/key/locales/owner
changes) · positive flow exit 0 (12 baselined WARNs, 0 errors, no regression) · all 6
negative-flow branches (missing id, missing site, duplicate id, missing owner, placeholder
owner, --update-baseline self-enforcing loop) demonstrated + reverted · regression proofs (a)
planted miss → fail/restore and (b) malformed namespace + missing manifest → exit 1 re-pasted
· docs/i18n-rules.md updated, no new doc file, no duplicate ai-behavior.md pointer · clauses
11/12/13 N/A documented · clause 14 green for both touched files · PASS**
