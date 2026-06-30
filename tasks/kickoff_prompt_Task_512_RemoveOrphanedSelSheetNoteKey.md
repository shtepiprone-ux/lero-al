# Task 512 — Remove orphaned `sel_sheet_note` i18n key (4 locales)

> **Executor:** Sonnet 4.6. **Type:** Storybook / i18n cleanup (docs/i18n).
> **Origin:** Owner directive (2026-06-30), follow-up to Task 511. Task 509 added
> `storybook.mantine.sel_sheet_note` for the old pre-510 Select "bottom-sheet note" section.
> Task 510 rewrote the story and Task 511 trimmed it to 3 sections — that note section no longer
> exists, so the key is orphaned (referenced by NO source/story code).
>
> **Grep proof (run again to confirm before editing):** `sel_sheet_note` appears ONLY in
> `messages/{sq,en,uk,it}.json` (line ~2160 each) + `docs/sessions/2026-06-28-task509-…md`
> (historical record). No `src/`/`*.stories.tsx` reference exists.

## 🔴 Precondition (sequencing — MANDATORY)

**Start only AFTER the Task 511 commit has landed** (`Select.stories.tsx` + the
`sel_option_long_stress` removal committed). The `messages/*.json` files are otherwise still
working-tree-modified from Task 511; editing them before 511 commits would entangle this cleanup
into the 511 commit. Confirm a clean `git status` for `messages/*.json` (owner-native) before editing.

## Scope (exact)

Remove the single key `storybook.mantine.sel_sheet_note` from each of the four locale files. Nothing
else. No story, no primitive, no other key.

Files in scope: `messages/sq.json`, `messages/en.json`, `messages/uk.json`, `messages/it.json`.

## Current behavior → required after-behavior

- **Current:** each of the 4 locale files contains `"sel_sheet_note": "…"` under `storybook.mantine`
  (parity 2007 keys ×4 after Task 511). The key renders nowhere (orphaned).
- **After:** the key is absent from all 4 files; parity 2006 keys ×4; identical key sets across
  locales. No visible Storybook/UI change (the key was never rendered post-510).

## Positive flow

1. Confirm 511 committed → `messages/*.json` clean.
2. Delete the `sel_sheet_note` line from sq/en/uk/it (mind trailing commas — the file must stay valid JSON).
3. `check:i18n` → parity green, 2006 keys ×4. `check:stories` → still 0 violations (key was never used). `tsc` unaffected.

## Negative flow

- **Partial removal** (deleted from some locales, not all) → `check:i18n` parity FAILS. Required: remove from ALL four.
- **JSON broken by a dangling/again-missing comma** → `JSON.parse` / `check:i18n` FAILS. Required: valid JSON after edit (file-integrity check).
- **Wrong key removed** (e.g. a still-used `sel_*` key) → broken render / parity break. Required: remove ONLY `sel_sheet_note`; grep-confirm zero matches after.
- **Scope creep** (any story/primitive/other-key edit) → REJECT.

## Acceptance criteria

1. `grep -r sel_sheet_note messages/ src/` returns **zero** matches after the edit. *(diff + grep)*
2. All four `messages/*.json` parse as valid JSON; identical key sets; `check:i18n` parity green at 2006 ×4. *(Negative flow → partial/JSON; gate)*
3. `check:stories` 0 violations; `tsc --noEmit` 0 errors (no code path touched). *(gate)*
4. File-integrity transcript for all 4 files (0 NUL bytes, JSON parses, no truncation). *(clause 14)*
5. Session log `docs/sessions/2026-06-30-task512-remove-orphaned-sel-sheet-note.md` with a **Files Changed** table (4 rows + 1-line rationale each). Do NOT emit `git add`/`commit` — the orchestrator emits at review.
6. `docs/backlog.md` "Last Session" updated (2–4 lines). **Numbering note:** the orchestrator bumps the "Last task number" line to 512 / next free 513 in the 512 review-commit (deferred here to avoid entangling the still-uncommitted 511 backlog edit — deliberate sequencing, not an omission).

## Hard contract

No scope change; no invented architecture; no silent removal beyond the one named key; all 4 locales
stay at an identical key set; executor never runs git (orchestrator emits the commit at review);
update `docs/backlog.md` + add the session log.

## Definition of done

Key gone from all 4 locales; gates green; session log + Files Changed table present; awaiting
orchestrator diff review + commit emission.
