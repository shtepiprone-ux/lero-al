> # 🔴 REVIEW VERDICT 2026-06-05: REJECTED — RE-DO REQUIRED (read this block first)
> The first 395 attempt is **not approvable**. The diff contradicts the session log on the core deliverable.
> Fix every item below, then re-submit. No commits were emitted.
>
> **🔴 BLOCKER 1 — `scripts/check-locale-leak.mjs` is TRUNCATED & SYNTACTICALLY BROKEN.** The committed file ends
> mid-line at line 427 (`` `    Report: .screenshots/locale-leak/${time `` — unterminated template literal).
> `node --check scripts/check-locale-leak.mjs` → **`SyntaxError: Missing } in template expression`**. The entire tail
> was deleted: the `uniqueLeaks.length !== 0` reporting branch, **`process.exit(1)`**, the `finally { browser.close() }`,
> and the **`run().catch(...)` invocation**. Result: the script cannot parse, never calls `run()`, and can never exit 1
> on a leak. **Therefore every transcript in the session log (`check:locale-leak:fast` 0 leaks, full-scan 0 leaks,
> negative-flow "exit code 1") is impossible against the committed file — the diff wins.** Restore the full script
> tail; the re-scope logic above the truncation (`DEMO_STORY_SKIP`, `PER_STORY_TOKENS`, slimmed global allowlist) is
> correctly designed — KEEP it — but the file must parse and run. Re-run all three gates and paste transcripts that
> match the committed file.
>
> **🔴 BLOCKER 2 — `messages/en.json` was NOT restored.** Session log + Files Changed table claim "trailing `\n`
> restored", but `git diff messages/en.json` is still non-empty (`-}` / `+}` `\ No newline at end of file`) and the
> file still ends without a newline. Actually restore it so the diff is empty.
>
> **🔴 BLOCKER 3 — `.gitignore` corrupted.** The `.claude/` ignore was deleted and the `# Local Settings` comment
> mangled to `# Loc` (file now ends `# Loc` with no newline). Consequence: `.claude/` (incl. 23 KB
> `settings.local.json`) is no longer ignored and shows as untracked — it could be committed by accident. Re-add the
> `# Local Settings` + `.claude/` lines AND keep the new `debug-storybook.log` entry; restore the trailing newline.
>
> **🟠 FINDING 4 — Files Changed table mismatch (Task 264).** The table lists `src/app/[locale]/(admin)/layout.stories.tsx`
> (does not exist) instead of the real modified `src/stories/AdminLayout.stories.tsx`. Fix the table to match the diff.
>
> **🟠 FINDING 5 — real production hardcode found, do NOT just allowlist it.** `src/components/ui/dialog.tsx:81`
> `<span className="sr-only">Close</span>` is a genuine English hardcode the corrected gate exposes. Parking it in
> `PER_STORY_TOKENS['primitives-dialog']` permanently blinds the gate to it. Acceptable as a *temporary* boundary only
> if a follow-up remediation task is filed to replace it with `t(...)` and then remove the allowlist entry. File that
> task (or fix it here if the owner authorises a one-line `src/` touch) — STOP & ASK if unsure.
>
> **✅ What was correct:** BOM stripped from all story files (0 remaining, verified); the gate re-scope DESIGN
> (demo-story exclusion + per-story scoping + language-neutral global allowlist) is the right approach; sibling gate
> scripts (`check-stories.mjs`, `check-stories-rendered.mjs`) parse fine (damage is isolated to the one file).
>
> **Re-submission bar:** `node --check` passes on the script; all three gates run and are GREEN against the COMMITTED
> file with pasted transcripts; the negative-flow plant genuinely exits 1; `git diff messages/en.json` empty; `.gitignore`
> intact (`.claude/` ignored again); Files Changed table matches the real diff exactly.

---

# Sprint 34 — Task 395 — Fix Task 394 review rejections: re-scope the locale-leak gate + clean encoding churn

> **Follow-up to Task 394 (Storybook 10 upgrade).** The SB10 upgrade itself is sound and the
> `screenshots:assert` gate is genuinely green (812/812 verified from the committed manifest). Task 394
> was **NOT approved** — it is blocked on the items below. This task fixes them. The SB10 package/config
> migration from 394 STAYS; do not revert it. **Read `docs/agent-contract.md` (1–13) FIRST.** STOP & ASK if ambiguous.

```
Type:        chore (gate correction + encoding cleanup) — follow-up to Task 394
Priority:    CRITICAL (still the Sprint 34 prerequisite — blocks 308/309/237/238/…)
Area:        scripts/check-locale-leak.mjs, all 29 src/**/*.stories.tsx + .storybook/preview.tsx (BOM),
             messages/en.json, repo root (debug-storybook.log), eslint.config.mjs (note only)
```

## Why this task exists (review findings against the real Task 394 diff)

1. **🔴 BLOCKER — the locale-leak gate was WEAKENED, not just fixed.** Task 394 correctly fixed a real
   IIFE bug (`page.evaluate(string)` never called the collector → the gate was a permanent no-op since
   Task 393). Good. But to get back to "0 leaks" it added a **global** `LEAK_ALLOWLIST` containing core
   **translatable** UI vocabulary: `Close`, `Home`, `Menu`, `Link`, `Suggestions`, `Premium`, `Studio`,
   `Villa`, `User`, `Admin`, `New`, `Resolved`, `In Progress`, `Sale`, `Rent`, `Commercial`, `Reset all`.
   Because the allowlist is global, the gate can **no longer detect a genuine untranslated leak of any of
   these exact words in any real component** — precisely the regression class the gate exists to catch
   (e.g. an Albanian render showing English "Close"/"Sale"/"Rent"). The kickoff for 394 explicitly said
   *"do NOT weaken/disable the gate."* The real source of those false-positives is the **18 dedicated
   multi-locale demo stories** (`LocaleStress` / `AllLocales` / `LocaleVariants`) that intentionally render
   all four locales at once — so foreign tokens legitimately appear next to the `en` baseline.

2. **🟠 BLOCKER — undisclosed diffs (violate the Task 264 Files-Changed-table contract).**
   - **BOM (U+FEFF) was injected into all 29 `*.stories.tsx` files** (visible in the diff as `'use client'`
     gaining a `﻿` prefix). The Files Changed table described only "import migration", not a byte-level
     encoding change. A BOM before the `'use client'` directive is unwanted (the directive must be the
     first bytes of the module).
   - **`messages/en.json` is modified** (trailing newline stripped) and is **not in the Files Changed
     table** — leftover residue from Negative-Flow-2's planted-then-reverted `storybook._negative_test_key`.

3. **🟡 `debug-storybook.log`** is left untracked in the repo root — a transient upgrade log.

> **Disclosure carried into this task (owner-level, not a code fix here):** because the gate was a no-op
> from Task 393 until 394's IIFE fix, every prior "leak-free" claim that relied on `check:locale-leak`
> (Tasks 392/393 + the Sprint 32/33 rendered-evidence approvals) was a **false-green**. After this task
> makes the gate correct, the now-working gate must be run against the committed baseline; any real leaks
> it surfaces become their own remediation task(s). Flag the count in the session log.

## Pre-read (mandatory)
- `docs/agent-contract.md` (1–13) · `docs/backlog.md`
- `docs/rule-index.md` → "Storybook / visual snapshot task" bundle (`storybook-governance.md`,
  `storybook-visual-snapshots.md`, `component-rules.md`, `qa-rules.md`) + `docs/responsive-screenshot-governance.md`.
- `scripts/check-locale-leak.mjs` (current allowlist + how it loads story IDs from the built index).
- The 18 stories matched by `LocaleStress|AllLocales|LocaleVariants` (the legitimate multi-locale renders).

## Positive flow (happy path)
- **Actor:** Sonnet 4.6 executor, then the gate on the owner's Windows build.
- **Step 1 — Re-scope the false-positives to their real source.** Exclude the dedicated multi-locale
  demo stories (`LocaleStress`/`AllLocales`/`LocaleVariants` story IDs) from the leak scan — either by
  skipping those story IDs in `check-locale-leak.mjs`, or by a per-story allowlist keyed to those IDs.
  Choose the approach already idiomatic to the script; if neither is clearly idiomatic, **STOP & ASK**.
- **Step 2 — Shrink the GLOBAL allowlist back to language-neutral tokens only:** keep `EUR/URL/SMS/
  HTTP(S)/API/ID/QA/SEO`, pure numbers/currency/units, CSS/code tokens, arrows, Storybook chrome
  (`Docs/Canvas/Controls/Actions/Required/Column options:` etc.), and genuine proper-noun fixtures
  (city/person names). **Remove from the global list:** `Close, Home, Menu, Link, Suggestions, Premium,
  Studio, Villa, User, Admin, New, Resolved, In Progress, Sale, Rent, Commercial, Reset all, Filtra,
  Filtri, Aktiv, Attivo, Vendita, Affitto, …` — these must remain leak-detectable in real component
  stories. (If any of these legitimately appears ONLY inside the excluded multi-locale demo stories, Step 1
  already covers it; do not re-add it globally.)
- **Step 3 — Strip the BOM** from all 29 `*.stories.tsx` files (and `.storybook/preview.tsx` if present);
  re-save UTF-8 **without** BOM. Confirm `'use client'` is the first bytes again.
- **Step 4 — Restore `messages/en.json`** to its committed state (re-add the trailing newline; no content
  change). `git diff messages/en.json` must be empty.
- **Step 5 — Remove `debug-storybook.log`** and add it (or `*.log`) to `.gitignore` if not already covered.
- **Success state:** `check:stories=0`, `check:locale-leak=0` **with the slimmed allowlist + excluded demo
  stories**, `screenshots:assert` still 812/812, `tsc=0`, `lint=0`. Files Changed table lists EVERY touched
  path including the BOM-stripped stories and en.json.

## Negative flow (must be proven, not just claimed)
- **Planted real leak survives the slim allowlist:** in a NORMAL (non-demo) story, render an untranslated
  English `Sale` / `Close` into a non-`en` locale → `check:locale-leak` MUST now FAIL (it would have been
  masked by the old global allowlist). Paste the failing transcript, then revert.
- **Excluded-story scoping is correct:** confirm a `LocaleStress` story still passes (its intentional
  multi-locale tokens are excluded, not globally allowlisted) — show it is excluded by ID, and that the
  same tokens appearing in a *non-demo* story still trip the gate.
- **Plant residue check:** after all reverts, `git status` shows only the intended files; `messages/*.json`
  diffs are empty; no BOM remains (`head -c3 | od` shows no `ef bb bf`); no `.log` tracked.

## Acceptance criteria (machine-proven)
- Slimmed global allowlist (language-neutral only) + demo-story scoping; the removed translatable tokens
  are individually justified as either "covered by demo-story exclusion" or "removed". 
- `npm run check:locale-leak` = 0 leaks on the slim config **AND** the negative-flow plant of a real
  translatable leak FAILS the gate (transcript pasted) → proves the gate bites again.
- `npm run check:stories` = 0; `npm run screenshots:assert` = 812/812 (uk@320/375/390 present); `tsc=0`; `lint=0`.
- All 29 stories + preview.tsx BOM-free; `messages/en.json` diff empty; `debug-storybook.log` gone/ignored.
- Report the leak count from a full `check:locale-leak` run on the *current committed baseline* (pre-slim,
  post-IIFE) so the owner knows what the no-op gate was hiding. (Remediation of any real findings = separate task.)
- Session log with Files Changed table; **no `git add`/`commit` from the executor** (orchestrator emits).

## Out of scope
- Reverting any correct SB10 migration from Task 394 (packages, `main.ts`, `preview.tsx` API, governance §14a).
- Fixing real leaks the corrected gate surfaces (open a separate remediation task with the owner).
- Any product-code change beyond the planted-then-reverted negative-flow test token.

## Note (non-blocking, verify don't fix unless trivial)
- `eslint.config.mjs` appends `...storybook.configs["flat/recommended"]` AFTER the story-governance
  no-restricted-syntax block whose comment says it "MUST come LAST". `lint=0` today (distinct custom rule
  IDs), but confirm the storybook plugin does not relax any story-file rule; if it does, move the spread
  before the governance block. Document the finding either way.
