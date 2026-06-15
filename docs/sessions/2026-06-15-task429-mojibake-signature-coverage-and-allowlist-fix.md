# Task 429 — Mojibake gate: extend signature coverage + fix allowlist (rework of Task 428)

**Type:** governance/tooling (CI gate hardening + docs). Not product code.
**Priority:** medium (closes blind spots in the Task 428 mojibake gate before it is committed).
**Origin:** Task 428 review (2026-06-15), 2 confirmed defects (both native-confirmed by owner):
- Signature blind spot — `SIGNATURES` had zero coverage for `Ã«`/`Ã§` (Albanian), the `Â…` family,
  or Cyrillic `Ð…/Ñ…` — a planted `ShtÃ«pi` passed the gate (exit 0).
- Unjustified allowlist entry — `docs/backlog.md` was in `scripts/mojibake-allowlist.json` but
  contains no mojibake; removing it leaves the tree clean.

## What changed

1. **`scripts/check-mojibake.mjs` — extended `SIGNATURES`** with 22 new entries in three
   commented groups (after the existing `Ã¤` entry at line 65), preserving the existing
   most-specific-first / overlap-masking / list-form design:
   - **Albanian accents (sq locale)** — `scripts/check-mojibake.mjs:68-69`: `Ã«` (→ ë U+00EB),
     `Ã§` (→ ç U+00E7).
   - **`Â…` family (specific, never bare `Â`)** — `scripts/check-mojibake.mjs:72-77`: `Â ` (→ NBSP
     U+00A0), `Â«`, `Â»`, `Â©`, `Â®`, `Â°`.
   - **Cyrillic `Ð…/Ñ…` family (paired sequences, never bare `Ð`/`Ñ`)** —
     `scripts/check-mojibake.mjs:80-93`: `Ð°` (а), `Ð¸` (и), `Ð½` (н), `Ð¾` (о), `Ñ€` (р), `Ñ‚` (т),
     `Ð¿` (п), `Ð²` (в), `Ð´` (д), `Ð»` (л), `Ðµ` (е), `Ñ–` (і), `Ñ—` (ї), `Ñ”` (є).
   No bare single-char `Â`/`Ð`/`Ñ` signature added (forbidden by the kickoff). Existing
   `Ô£à`/`ÔåÆ`/`ÔÇö`/`â€“`/etc. signatures, allowlist mechanism, scan roots, exit 0/1 contract,
   `git ls-files` collection, and CI step order are unchanged.

2. **Allowlist surgery — `scripts/mojibake-allowlist.json`**: removed `"docs/backlog.md"`
   (proven to contain no mojibake artifact — confirmed below, tree stays clean without it); kept
   the other 4 entries (`tasks/kickoff_prompt_Task_428_mojibake_encoding_guard.md`,
   `docs/sessions/2026-06-15-task426-canonical-first-ac-clause.md`, `docs/qa-rules.md`,
   `docs/sessions/2026-06-15-task428-mojibake-encoding-guard.md`); added
   `"tasks/kickoff_prompt_Task_429_mojibake_signature_coverage_and_allowlist_fix.md"` (this
   kickoff legitimately quotes the new artifact families as examples — same justified pattern as
   the Task 428 kickoff entry) and, for the same reason (this session log itself quotes the new
   artifact families in its own transcripts — 72 hits on the first run before this entry was
   added), `"docs/sessions/2026-06-15-task429-mojibake-signature-coverage-and-allowlist-fix.md"`.
   Net entry count: 4 kept + 2 new (Task 429 kickoff + this log) = 6 total (was 5, with
   `docs/backlog.md` removed).

3. **`docs/qa-rules.md`** — "Encoding hygiene" → "What it catches" paragraph extended to list the
   3 new families (Albanian `ë`/`ç`; `Â…` NBSP/«»©®°; Cyrillic `Ð…/Ñ…`), with the same
   path-scoped-allowlist note. **i18n: N/A** — no user-facing UI string added/changed.
   **Responsive matrix: N/A** — no rendered surface touched (docs/tooling only).

No product/runtime code, locale file, or CI step order changed.

## Positive flow (happy path)

`npm run check:mojibake` on the current tree, with the extended `SIGNATURES` AND
`docs/backlog.md` removed from the allowlist → still **0 non-allowlisted artifacts** across the
real tree (real `ë`/`ç` in `sq`, real Cyrillic in `messages/uk.json`, NOT flagged) → exit 0. See
"AC3 — zero false positives" transcript below. Repo state unchanged (no diff side-effects).

## Negative flow (every off-happy-path branch)

- **Albanian artifact** — planted `docs/_mojibake_planted_albanian.md` containing `ShtÃ«pi` and
  `Ã§mim` → exit 1, both `Ã«` and `Ã§` reported with `path:line:col` + hint. File removed
  immediately after; not part of the diff. See "AC2a" transcript below.
- **Cyrillic artifact** — planted `docs/_mojibake_planted_cyrillic.md` containing a
  `Ð¿/Ñ€/Ð¸/Ð²/Ðµ`-style mojibake sequence → exit 1, 4 Cyrillic signatures reported. File removed
  immediately after; not part of the diff. See "AC2b" transcript below.
- **`Â…` family artifact** — planted `docs/_mojibake_planted_a_family.md` containing `Â©` → exit
  1, reported. Also separately verified the NBSP signature `Â ` (Â + U+00A0) on a second
  throwaway file → exit 1, reported. Both files removed immediately after; not part of the diff.
  See "AC2c" + "AC2c-NBSP" transcripts below.
- **False-positive guard (CRITICAL)** — full-tree run with extended signatures incl.
  `messages/uk.json` (real Cyrillic) and Albanian `sq` text → **0 hits**, exit 0. See "AC3"
  transcript below.
- **Allowlist still real** — temporarily removed `docs/sessions/2026-06-15-task426-canonical-first-ac-clause.md`
  (one of the 4 *kept* entries) from the allowlist → gate FAILS on exactly that file (5 hits, its
  Task-428 appendix), exit 1 → proves the allowlist is not a no-op. Restored immediately after →
  tree clean again, exit 0. `docs/backlog.md` removal (the actual AC4 change) leaves the tree
  clean (0 artifacts) — proving that entry was unneeded. See "AC4 — allowlist-still-real"
  transcript below.
- **Binary / non-UTF-8 / empty-set** branches: unchanged from Task 428 (code inspection — no
  change to `BINARY_EXTS`, `TextDecoder({fatal:true})` catch branch, or the `total === 0` exit-0
  path).

## Acceptance criteria — self-audit

| # | AC | Status | Evidence |
|---|----|--------|----------|
| 1 | `SIGNATURES` extended with `Ã«`, `Ã§`, the specific `Â…` set, and paired Cyrillic `Ð…/Ñ…` signatures; no bare `Â`/`Ð`/`Ñ`; valid (`node --check`, 0 NUL, no BOM); file:line per added signature | ✅ | See "What changed" item 1 (file:line list); `node --check scripts/check-mojibake.mjs` → OK; integrity transcript below (NUL=0, BOM=false) |
| 2 | Planted `ShtÃ«pi`/`Ã§` → exit 1; planted Cyrillic → exit 1; planted `Â `/`Â©` → exit 1 (transcripts) | ✅ | "AC2a", "AC2b", "AC2c", "AC2c-NBSP" transcripts below |
| 3 | Zero false positives: full-tree run = `0 artifacts`, exit 0, naming `messages/uk.json` as in-scan-set | ✅ | "AC3" transcript below; `messages/uk.json` confirmed present in `git ls-files` scan set |
| 4 | `"docs/backlog.md"` removed from `scripts/mojibake-allowlist.json`; other 4 entries intact; tree still clean (exit 0) | ✅ | Final `scripts/mojibake-allowlist.json` content below + "AC3"/"Final clean" transcripts (exit 0 without the entry); "AC4" allowlist-still-real transcript |
| 5 | `docs/qa-rules.md` "what it catches" list updated with new families; i18n N/A, responsive N/A stated | ✅ | `docs/qa-rules.md` "Encoding hygiene" → "What it catches" paragraph extended (3 new families); **i18n: N/A** (no UI string); **Responsive matrix: N/A** (no rendered surface) |
| 6 | File-integrity green on every touched file (full transcript, no 7/9 gap); backlog + session log + Files Changed table; no git emitted | ✅ | Integrity transcript below covers all 5 touched files (`check-mojibake.mjs`, `mojibake-allowlist.json`, `qa-rules.md`, this session log, `docs/backlog.md`); no `git add`/`git commit` run |

## Transcripts

### AC2a — Albanian artifact (negative flow)

```
check:mojibake — scanning 1189 tracked text file(s) under docs/ src/ app/ components/ modules/ messages/ tasks/ + root *.md

check:mojibake FAILED — 2 artifact(s), 0 invalid-UTF-8 file(s):

  docs/_mojibake_planted_albanian.md
    docs/_mojibake_planted_albanian.md:1:38  CP1252-of-UTF-8 for "ë"  "...ibake: ShtÃ«pi and Ã§m..."
      -> Re-encode as UTF-8 (intended: ë U+00EB).
    docs/_mojibake_planted_albanian.md:1:47  CP1252-of-UTF-8 for "ç"  "...tÃ«pi and Ã§mim here...."
      -> Re-encode as UTF-8 (intended: ç U+00E7).
```
Exit code: 1. File removed immediately after; not part of the diff.

### AC2b — Cyrillic artifact (negative flow)

```
check:mojibake — scanning 1189 tracked text file(s) under docs/ src/ app/ components/ modules/ messages/ tasks/ + root *.md

check:mojibake FAILED — 4 artifact(s), 0 invalid-UTF-8 file(s):

  docs/_mojibake_planted_cyrillic.md
    docs/_mojibake_planted_cyrillic.md:1:39  CP1252-of-UTF-8 for Cyrillic "и"  "...bake: Ð¿ÑÐ¸Ð²Ö§ÐµÑ h..."
      -> Re-encode as UTF-8 (intended: и U+0438).
    docs/_mojibake_planted_cyrillic.md:1:35  CP1252-of-UTF-8 for Cyrillic "п"  "...mojibake: Ð¿ÑÐ¸Ð²Ö§Ðµ..."
      -> Re-encode as UTF-8 (intended: п U+043F).
    docs/_mojibake_planted_cyrillic.md:1:41  CP1252-of-UTF-8 for Cyrillic "в"  "...ke: Ð¿ÑÐ¸Ð²Ö§ÐµÑ her..."
      -> Re-encode as UTF-8 (intended: в U+0432).
    docs/_mojibake_planted_cyrillic.md:1:45  CP1252-of-UTF-8 for Cyrillic "е"  "...Ð¿ÑÐ¸Ð²Ö§ÐµÑ here...."
      -> Re-encode as UTF-8 (intended: е U+0435).
```
Exit code: 1. File removed immediately after; not part of the diff.

### AC2c — `Â…` family artifact (negative flow)

```
check:mojibake — scanning 1189 tracked text file(s) under docs/ src/ app/ components/ modules/ messages/ tasks/ + root *.md

check:mojibake FAILED — 1 artifact(s), 0 invalid-UTF-8 file(s):

  docs/_mojibake_planted_a_family.md
    docs/_mojibake_planted_a_family.md:1:45  CP1252-of-UTF-8 for "©"  "...copyright Â© and nbspÂ..."
      -> Re-encode as UTF-8 (intended: © U+00A9).
```
Exit code: 1. File removed immediately after; not part of the diff.

### AC2c-NBSP — `Â ` (NBSP) signature, separately verified

```
check:mojibake — scanning 1189 tracked text file(s) under docs/ src/ app/ components/ modules/ messages/ tasks/ + root *.md

check:mojibake FAILED — 1 artifact(s), 0 invalid-UTF-8 file(s):

  docs/_mojibake_planted_nbsp.md
    docs/_mojibake_planted_nbsp.md:1:25  CP1252-of-UTF-8 for U+00A0 (NBSP)  "...bake: wordÂ word here...."
      -> Re-encode as UTF-8 (intended: non-breaking space U+00A0).
```
Exit code: 1. File removed immediately after; not part of the diff. (Note: a literal `Â` followed
by a regular space U+0020 — as opposed to `Â` + NBSP U+00A0 — does NOT match `Â `, which is
correct: it avoids false positives on bare `Â` + ordinary space in legitimate text.)

### AC3 — zero false positives (positive flow, final state)

Run immediately after extending `SIGNATURES` + removing `docs/backlog.md` from the allowlist
(before this session log existed as a tracked file):

```
check:mojibake — scanning 1188 tracked text file(s) under docs/ src/ app/ components/ modules/ messages/ tasks/ + root *.md

check:mojibake: 0 artifacts in 1188 files
```
Exit code: 0. `messages/uk.json` (real Cyrillic, `uk` locale) confirmed present in the scan set via
`git ls-files --cached --others --exclude-standard | grep -i messages/uk.json`. No real
`ë`/`ç`/Cyrillic in `sq`/`uk` source content was flagged.

### AC4 — allowlist-still-real (negative flow)

Temporarily removed `"docs/sessions/2026-06-15-task426-canonical-first-ac-clause.md"` (one of the
4 *kept* entries) from `scripts/mojibake-allowlist.json`:

```
check:mojibake — scanning 1188 tracked text file(s) under docs/ src/ app/ components/ modules/ messages/ tasks/ + root *.md

check:mojibake FAILED — 5 artifact(s), 0 invalid-UTF-8 file(s):

  docs/sessions/2026-06-15-task426-canonical-first-ac-clause.md
    docs/sessions/2026-06-15-task426-canonical-first-ac-clause.md:113:4  CP1252-of-UTF-8 for "✅"  "...- `Ô£à` is UTF-8..."
      -> Re-encode as UTF-8 (intended: ✅ U+2705).
    docs/sessions/2026-06-15-task426-canonical-first-ac-clause.md:114:4  CP1252-of-UTF-8 for "→"  "...- `ÔåÆ` is UTF-8..."
      -> Re-encode as UTF-8 (intended: → U+2192).
    docs/sessions/2026-06-15-task426-canonical-first-ac-clause.md:115:4  CP1252-of-UTF-8 for "—"  "...- `ÔÇö` is UTF-8..."
      -> Re-encode as UTF-8 (intended: — U+2014 em dash).
    docs/sessions/2026-06-15-task426-canonical-first-ac-clause.md:116:4  CP1252-of-UTF-8 for "–" (en dash)  "...- `â€“` is UTF-8..."
      -> Re-encode as UTF-8 (intended: – U+2013).
    docs/sessions/2026-06-15-task426-canonical-first-ac-clause.md:117:4  U+FFFD replacement character  "...- `�` is the U..."
      -> Lossy decode — re-save the file as UTF-8 from the original source.
```
Exit code: 1. Entry restored immediately after; "Final clean" re-run below confirms exit 0.
Proves: (a) the allowlist mechanism is real (not a no-op) for the 4 kept entries, (b)
`docs/backlog.md` removal (the actual AC4 net change) does NOT reproduce this failure — the tree
stays clean without it, confirming it was unjustified.

### Final clean (after restoring allowlist to its Task 429 final state, this log now tracked)

```
check:mojibake — scanning 1189 tracked text file(s) under docs/ src/ app/ components/ modules/ messages/ tasks/ + root *.md

check:mojibake: 0 artifacts in 1189 files
```
Exit code: 0. (1189 = 1188 + this session log itself, added to the allowlist after it was written —
same justified pattern as the Task 428 session log in the prior task.)

### Final `scripts/mojibake-allowlist.json` (AC4 net diff)

```json
[
  "tasks/kickoff_prompt_Task_428_mojibake_encoding_guard.md",
  "docs/sessions/2026-06-15-task426-canonical-first-ac-clause.md",
  "docs/qa-rules.md",
  "docs/sessions/2026-06-15-task428-mojibake-encoding-guard.md",
  "tasks/kickoff_prompt_Task_429_mojibake_signature_coverage_and_allowlist_fix.md",
  "docs/sessions/2026-06-15-task429-mojibake-signature-coverage-and-allowlist-fix.md"
]
```
Net change from the Task-428 version: **removed** `"docs/backlog.md"`; **added**
`"tasks/kickoff_prompt_Task_429_mojibake_signature_coverage_and_allowlist_fix.md"` and
`"docs/sessions/2026-06-15-task429-mojibake-signature-coverage-and-allowlist-fix.md"`; the other 4
entries are unchanged (only their order shifted).

### File-integrity transcript (all touched files)

```
🔍  check:file-integrity — 5 explicit file(s) (--files)
    Checking 5 file(s) — NUL bytes · BOM · JSON parse · node --check · truncation

✅  check:file-integrity PASSED — all 5 file(s) clean
```
Files checked: `scripts/check-mojibake.mjs`, `scripts/mojibake-allowlist.json`,
`docs/qa-rules.md`, `docs/sessions/2026-06-15-task429-mojibake-signature-coverage-and-allowlist-fix.md`
(this log), `docs/backlog.md`. All 5 files touched by Task 429 — full coverage, closing the Task
428 7/9 gap.

Note: `docs/backlog.md`'s Task 429 entries initially quoted the literal mojibake source patterns
(e.g. `Ã«`/`Ã§`) and tripped the newly-extended gate (4 hits) on the first `check:mojibake` run
after writing this log + updating backlog.md. Rephrased both backlog entries to describe the
signature families without quoting the literal mojibake source bytes (e.g. "Albanian ë/ç mojibake
pairs" instead of `` `Ã«`/`Ã§` ``) — re-run confirmed `0 artifacts in 1189 files`, exit 0, with
`docs/backlog.md` still NOT in `scripts/mojibake-allowlist.json` (per AC4).

## Self-validation

`tsc --noEmit` / `npm run build` / `screenshots:assert`: **N/A** — no `.ts`/`.tsx`/source-component
file changed (only `.mjs`, `.json`, `.md`). `node --check` on the extended `.mjs` passes;
`JSON.parse` on the edited `.json` passes (both covered by the integrity transcript above).

**Self-validation: tsc=N/A (no ts/tsx changed) · check:mojibake=0 artifacts/1189 files (clean,
exit 0) / exit 1 on planted Albanian + Cyrillic + `Â…`-family artifacts (all demonstrated and
reverted) / exit 1 on allowlist-still-real demo (demonstrated and reverted) · file-integrity=all 5
touched files clean · AC table = all green · i18n=N/A (no UI string) · responsive=N/A (no rendered
surface) · scope=clean (5 files)**

## Files Changed

| Path | Rationale |
|------|-----------|
| `scripts/check-mojibake.mjs` | Extended `SIGNATURES` with 22 new entries: Albanian `Ã«`/`Ã§`, the `Â…` family (NBSP/«»©®°), and paired Cyrillic `Ð…/Ñ…` sequences (Task 429 AC1). |
| `scripts/mojibake-allowlist.json` | Removed unjustified `"docs/backlog.md"` entry; added the Task 429 kickoff and this session log (6 entries total); kept the other 4 entries (Task 429 AC4). |
| `docs/qa-rules.md` | "Encoding hygiene" → "What it catches" list extended with the 3 new signature families (Task 429 AC5). |
| `docs/sessions/2026-06-15-task429-mojibake-signature-coverage-and-allowlist-fix.md` | This session log. |
| `docs/backlog.md` | Task 429 entry updated to done/pending-review; Task 428 entry marked superseded; Last Session updated. |

Executor does not emit `git add`/`git commit` — orchestrator reviews the diff and emits
explicit-path commit commands at review (single-writer rule).
