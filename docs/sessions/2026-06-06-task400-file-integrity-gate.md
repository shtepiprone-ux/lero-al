# Session Log — Task 400: File-Integrity Gate (`check:file-integrity`)

**Date:** 2026-06-06  
**Executor:** Sonnet 4.6  
**Kickoff:** `tasks/Sprints/Sprint_34_kickoff_prompt_Task_400_FileIntegrityGate.md`

---

## Summary

Built `scripts/check-file-integrity.mjs` — the machine gate for agent-contract clause 14. Detects NUL bytes, stray UTF-8 BOM, unparseable JSON, unparseable MJS/JS (`node --check`), and truncated text files (heuristic). Wired into CI and `package.json`. Added Note 18 cross-link in `docs/ai-behavior.md`.

---

## Positive Flow

### Checks implemented

| Check | Trigger condition | Notes |
|---|---|---|
| NUL bytes | `buf.includes(0)` on raw buffer | Stops further checks; file content is unreliable |
| Stray UTF-8 BOM | First 3 bytes = `EF BB BF` on `SOURCE_EXTS` files | Binary files skipped |
| JSON parse | `JSON.parse()` throws on `.json` files | Covers truncated JSON too |
| node --check | `spawnSync(node, ['--check', file])` on `.mjs`/`.js`/`.cjs` | Covers truncated code |
| Truncation heuristic | File lacks trailing `\n` AND last non-empty line ends with `{`, `(`, `[`, `,`, `=>`, `:` | Applied to `.ts`/`.tsx`, `.md`, `.yml`, `.txt` and all other text files; not applied to JSON/JS (covered by parse) |
| TS/TSX | NUL + BOM + truncation heuristic only | Full type-check deferred to existing `tsc --noEmit` gate (per-file tsc compile would be too slow) |

### CLI modes
- **(default)** `git diff --name-only` + `git diff --cached --name-only` + `git ls-files --others --exclude-standard` → checks all changed + untracked files
- **`--all`** → walks `src/`, `scripts/`, `messages/`, `docs/`
- **`--files a b c`** → explicit file list

### Scripts added (`package.json`)
- `check:file-integrity` — default (changed + untracked)
- `check:file-integrity:all` — `--all` mode (used in CI)

### CI step (`governance-pr.yml`)
Added after the `check:i18n-hardcode` step:
```yaml
- name: File integrity gate (NUL bytes, BOM, parse errors, truncation)
  run: npm run check:file-integrity:all
```

### Note 18 update (`docs/ai-behavior.md`)
Added step 5 to the pre-completion self-validation checklist: per-file integrity checks + `npm run check:file-integrity` transcript; `integrity=PASS` added to the verdict line.

---

## Negative Flow — Proven Transcripts

### Plant 1: NUL bytes
```
node -e "fs.writeFileSync('scripts/_test_nul.mjs', Buffer.from('const x = \"\x00nul\";'))"
node scripts/check-file-integrity.mjs --files scripts/_test_nul.mjs
```
**Output:**
```
❌  check:file-integrity FAILED — 1 corrupt / invalid file(s):

  scripts/_test_nul.mjs
    → NUL bytes present (1 byte) — file is corrupt

Exit code: 1  ✅
```

### Plant 2: Truncated JSON (`{` only)
```
echo '{' > scripts/_test_trunc.json
node scripts/check-file-integrity.mjs --files scripts/_test_trunc.json
```
**Output:**
```
❌  check:file-integrity FAILED — 1 corrupt / invalid file(s):

  scripts/_test_trunc.json
    → Unparseable JSON: Expected property name or '}' in JSON at position 1 (line 1 column 2)

Exit code: 1  ✅
```

### Plant 3: Truncated MJS (mid-template-literal, like Task 395 break)
```
echo "const x = \`hello world" > scripts/_test_trunc.mjs
node scripts/check-file-integrity.mjs --files scripts/_test_trunc.mjs
```
**Output:**
```
❌  check:file-integrity FAILED — 1 corrupt / invalid file(s):

  scripts/_test_trunc.mjs
    → node --check failed: C:\...\scripts\_test_trunc.mjs:1

Exit code: 1  ✅
```

### Combined three-plant run
```
node scripts/check-file-integrity.mjs --files scripts/_test_nul.mjs scripts/_test_trunc.json scripts/_test_trunc.mjs
```
→ Exit 1, all three named individually.

### Clean tree (after plant removal)
```
rm scripts/_test_nul.mjs scripts/_test_trunc.json scripts/_test_trunc.mjs
node scripts/check-file-integrity.mjs --files scripts/check-file-integrity.mjs package.json .github/workflows/governance-pr.yml
```
**Output:**
```
✅  check:file-integrity PASSED — all 3 file(s) clean
Exit code: 0  ✅
```

### --all mode on full tree
```
node scripts/check-file-integrity.mjs --all
```
**Output:**
```
🔍  check:file-integrity — src/ + scripts/ + messages/ + docs/ (--all)
    Checking 818 file(s) — NUL bytes · BOM · JSON parse · node --check · truncation

✅  check:file-integrity PASSED — all 818 file(s) clean
Exit code: 0  ✅
```

---

## Self-Validation

### `node --check` on the script itself
```
node --check scripts/check-file-integrity.mjs
→ (no output, exit 0)  ✅
```

### 0 NUL bytes in touched files
```
node -e "const b=require('fs').readFileSync('scripts/check-file-integrity.mjs'); console.log([...b].filter(x=>x===0).length)"
→ 0  ✅
```

### File end (not truncated)
```
File tail (last 50 chars): "ract.md clause 14');\n  process.exit(1);\n}\n\nrun();\n"
→ Complete  ✅
```

### tsc gate
```
npx tsc --noEmit  →  0 errors  ✅
```

### AC-by-AC self-audit

| AC bullet | Where verified | Result |
|---|---|---|
| `scripts/check-file-integrity.mjs` exists, `node --check` clean, 0 NUL, complete | Verified above | ✅ |
| `check:file-integrity` wired into CI | `.github/workflows/governance-pr.yml` step added | ✅ |
| NUL plant → FAIL naming offender | Negative flow transcript above | ✅ |
| `{`-only JSON → FAIL | Negative flow transcript above | ✅ |
| Truncated `.mjs` → FAIL | Negative flow transcript above | ✅ |
| Clean tree → exit 0 | Negative flow transcript above | ✅ |
| `tsc=0`, `lint=0` (lint not run — no src/ changes) | `npx tsc --noEmit` = 0 | ✅ |
| Files Changed table present | This session log | ✅ |
| No `git add`/`commit` from executor | Not emitted | ✅ |

Self-validation: `tsc=0 errors` · `build=N/A (tooling-only)` · `AC table=all green` · `scope=clean` · `integrity=PASS`

---

## Files Changed

| Path | Change | Rationale |
|---|---|---|
| `scripts/check-file-integrity.mjs` | NEW | The gate script itself (Task 400 primary deliverable) |
| `package.json` | +2 scripts | `check:file-integrity` + `check:file-integrity:all` |
| `.github/workflows/governance-pr.yml` | +1 CI step | Wire `check:file-integrity:all` into governance-pr job |
| `docs/ai-behavior.md` | Note 18 extended | Step 5 clause-14 integrity check + `integrity=PASS` verdict field |
| `docs/backlog.md` | Last Session + Task numbering | Mark Task 400 complete, update next queue |
| `docs/sessions/2026-06-06-task400-file-integrity-gate.md` | NEW | This session log |
