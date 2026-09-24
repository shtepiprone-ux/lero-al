# Executable task contract — Task 717

## 1. One active execution route

| Field | Value |
|---|---|
| Task | 717 — replace the directory-wide `src/design-system/mantine` token exemption with scoped, reasoned ones (Sprint 52.2) |
| Active route / owner decision | Single route: measure → classify → scope → prove by plant. Remediation of any literal is explicitly a different task (R8) |
| Decision source, date, scope | Sprint 52 §10 fixes 52.2 after 52.1; Task 715 §3.6 deferred this with its own number |
| Starting worktree mode | **dirty with manifest** — pre-write `git status --porcelain` snapshot, per-entry classification, before/after content witnesses for pre-existing modified paths |
| Exact allowed final write set | `scripts/design-tokens-allowlist.json` · comment-only lines in `src/design-system/mantine/**` · **one** conditional line in `scripts/check-design-tokens.mjs` (R9 only) · `docs/backlog.md` · `docs/sessions/<date>-task717-*.md` |
| Blocked rule or decision, if any | None outstanding. Two stop conditions: the re-derived census disagreeing with 206/15 (§3.2), and any need to change a rendered value (R7) |

## 2. Checkpoint matrix

| Checkpoint | Preconditions and preserved inputs | Writes allowed through this checkpoint | Observable result | Producer and persisted artifact | Comparator and failure behavior |
|---|---|---|---|---|---|
| 0 | Clean read of `git status --porcelain`, `git log -1` | none | Dirty-worktree manifest | `J0-status.txt` | Any path outside the manifest classes → stop |
| 1 | Checkpoint 0 | none | Per-file, per-category census, empty allowlist | detector's own `scanContent` · `I1-census.json` | Total ≠ 206 or files ≠ 15 → report the discrepancy, do not proceed |
| 2 | Checkpoint 1 | none | Pre-edit `check:design-tokens:strict` exit 0 | `I2-preedit-strict.log` | Non-zero → the tree was already red; stop, that is not this task |
| 3 | Checkpoint 2 | none | All 206 classified into 3 classes, summing to the baseline | `I3-classification.md` | A literal in no class, or in two → incomplete, stop |
| 4 | Checkpoint 3 | allowlist JSON + comment-only source lines | Blanket key gone; scoped keys + markers in place | `git diff` · `K1-scope-diff.txt` | Any added key that is a directory → reject and re-scope |
| 5 | Checkpoint 4 | plant in one un-exempted file | `check:design-tokens:strict` **fails**, naming file and value | `K2-plant-fail.log` | Gate still green → the narrowing did nothing; do not proceed |
| 6 | Checkpoint 5 | plant removal only | Pre-plant hash restored, path absent from status | `K3-restore.txt` | Hash mismatch or path present → `BLOCKED`, never "restored" on assertion |
| 7 | Checkpoint 6 | conditional §7.4 line | Loose-matcher count re-measured; edit only if 0 | `K4-matcher.log` | Count > 0 → leave the code untouched and report |
| 8 | Checkpoint 7 | docs, backlog, session log | Filtered diff empty; all gates exit 0; counting passes reconcile | `K5-filtered-diff.txt`, `K6-*` | Non-empty filtered diff → R7 broken, the Q1 profile no longer applies, stop |

## 3. Required counterexample trace

| Contract claim | Counterexample | Executed or analytical evidence | Required outcome | Result |
|---|---|---|---|---|
| Active route and final write set | A literal "obviously" should just become a token | Checkpoint 8 filtered diff | separate contract — reserve under R8, do not edit the value | |
| Stateful baseline / manifest | Census returns 0 violations (empty result set) | Checkpoint 1 | fail-closed: an empty census means the scan is misconfigured, not that the directory is clean | |
| Stateful baseline / manifest | Census returns a number ≠ 206 | Checkpoint 1 | stop and reconcile before any edit (D32) | |
| Status or diff assertion | A pre-existing modified path changes content while "untouched" | witnesses at 0 and 8 | comparator rejects an equal-porcelain-only claim | |
| New gate | Plant added but the gate stays green | Checkpoint 5 | the narrowing is cosmetic — re-scope, do not report success | |
| New gate | Marker value does not match the detected text | Checkpoint 4 → 8 | gate reports `stale-marker`; fix before final | |
| Task-created artifact | Evidence files counted into the integrity denominator | Checkpoint 8, two passes | count difference detected and explained | |

## 4. Publication and review gate

`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` only when checkpoints 0–8 each have a persisted artifact, the filtered
diff is empty, and the plant transcript shows a real failure followed by a clean recovery. A green gate with no
plant transcript proves nothing — the whole task is the claim that the gate can now see something, and only the
plant demonstrates it.
