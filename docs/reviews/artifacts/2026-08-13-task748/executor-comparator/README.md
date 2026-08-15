# Executor evidence, retained by the reviewer

Copied verbatim from `.screenshots/task748-overlay/` (gitignored, `.gitignore:55`) so that this
ledger cites only paths a fresh clone can resolve. Retaining it here does **not** close finding
**F-F** — the executor must retain its own evidence in a tracked location at re-submission; this
copy exists so the reviewer's own citations are portable, which is a separate obligation.

- `capture-and-compare.mjs` — the 168-cell comparator as submitted.
- `capture-and-compare-result.json` — real run: 168/168 `OK`, `failCount: 0`.
- `capture-and-compare-PLANTED.json` — `--plant` run: 1 failing cell, `photoCountBadge|en|320`.

Finding **F-C** is about what this harness measures, not whether it ran. Line 156 builds the
"expected" side from `decl` — the *intended* declaration text — and injects it into a probe on the
same page. There is no pre-migration capture anywhere in the run, so the harness answers "does my
new rule produce the colour I meant?" and cannot answer "does this element render what it rendered
before?". `--plant` (line 155) corrupts `plantedDecl`, i.e. the expected side, never the subject.
