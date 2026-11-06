# Epic II — Task 320 ADDENDUM — QA-script hardening (exact localized-label assertions) — BEFORE 320 commit

> **You are Claude Code Sonnet 4.6 in `lero-al`. Read `docs/agent-contract.md` (clauses 1–14) FIRST.**
> This is a **tiny, surgical hardening of Task 320's own QA proof script** — NOT a product change, NOT a re-open of
> the Task 320 fix. The Task 320 product fix (UserCard `tu('admin.users')` namespace swap + `NumInputField`
> `floors_total` label) is **APPROVED and unchanged**. The ONLY problem this addendum fixes: the rendered-proof
> script `scripts/task320-qa-i18n-fixes.mjs` asserts "not a raw key" but does **not** assert the badge/label actually
> contains the **expected localized string** — so the gate could pass even if a badge silently rendered wrong text.
> Clause 12/13 require machine-produced proof of the *result*, not just the absence of the raw key. **Owner decisions
> below are LOCKED. If anything else is ambiguous, STOP & ASK. You NEVER run git — the orchestrator emits commits.**

```
Type:        chore (QA-proof hardening) — Epic II Phase 2, Task 320 addendum
Priority:    medium (gates the Task 320 commit — strengthens proof, no product change)
Area:        scripts/task320-qa-i18n-fixes.mjs  (ONLY this file)
Output:      The QA matrix asserts the EXACT expected localized status-badge labels and floors_total label per locale;
             re-run prints 32/32 PASS; a planted wrong-string makes a cell FAIL (gate-is-real).
```

---

## Owner decision (LOCKED)

Approve the Task 320 product fix as-is; before emitting the Task 320 commit, **harden only the QA assertions** so the
script proves the rendered text equals the expected translation per locale (not merely "≠ raw key").

## Scope — change EXACTLY ONE file: `scripts/task320-qa-i18n-fixes.mjs`

1. **UserCard status badges (`admin-adminsupportmanager--user-card-status-badges`).** The story renders three fixture
   users with `status: active / blocked / inactive` in that order. Strengthen `validate` so that, in addition to the
   existing `rows.length === 3`, `!hasRawLeak`, `!hasOverflow` checks, **each of the three rendered cards' text contains
   the expected localized status label for the active locale**, matched in row order (active, blocked, inactive):

   | locale | active | blocked | inactive |
   |---|---|---|---|
   | sq | Aktiv | Bllokuar | Joaktiv |
   | en | Active | Blocked | Inactive |
   | uk | Активний | Заблокований | Неактивний |
   | it | Attivo | Bloccato | Non attivo |

   Pass the active `locale` into the per-story `validate` (the harness loops `LOCALES`, so thread it through — e.g.
   `validate(rows, locale)`), and assert `rows[i].full.includes(EXPECTED[locale][i])`. These values are the source of
   truth; confirm them against `messages/{sq,en,uk,it}.json` → `admin.users.user_status_*` before hardcoding (do NOT
   invent wording).

2. **NumInputField floors_total label (`listings-form-numinputfield--floors-total`).** Strengthen `validate` to assert
   the `<label>` text **exactly equals** the expected `listing.floors_total` translation for the active locale (in
   addition to the existing non-empty / `!== 'floors_total'` / `!hasOverflow` checks):

   | locale | label |
   |---|---|
   | sq | Katshmëria |
   | en | Total floors |
   | uk | Поверховість |
   | it | Piani totali |

   Confirm against `messages/{sq,en,uk,it}.json` → `listing.floors_total` before hardcoding.

3. Keep everything else identical: viewports (320/375/390/1280), screenshot capture (uk@320/375/390), static-server
   wiring, exit codes. Do NOT add stories, touch product code, locale files, the manifest, or the baseline.

## Positive flow

- `node scripts/task320-qa-i18n-fixes.mjs` against the existing `storybook-static/` → **32/32 PASS**; each UserCard cell
  now additionally confirms the three localized labels in order; each NumInputField cell confirms the exact label.

## Negative flow (gate-is-real — MANDATORY, paste both transcripts)

- Temporarily change one expected constant to a wrong string (e.g. `en` active → `"WRONG"`) OR plant a wrong fixture →
  the affected cell(s) **FAIL** and the script **exits non-zero**. Restore → back to 32/32 PASS. This proves the new
  assertion actually bites (the whole point of the addendum — the old script could not have caught a wrong label).

## Acceptance criteria

- `validate` for the UserCard story asserts the three expected localized labels **in row order**, per the active locale,
  for all of sq/en/uk/it; the NumInputField story asserts the **exact** expected label per locale.
- The expected-string tables match `messages/*.json` (`admin.users.user_status_*` and `listing.floors_total`) — verified,
  not invented.
- Re-run: **32/32 PASS** transcript pasted into the Task 320 session log (append an "Addendum — QA hardening" section);
  uk@320/375/390 screenshots re-captured.
- Gate-is-real: planted-wrong-string transcript shows a FAIL + non-zero exit, then restore → green.
- **Clause 14:** `node --check scripts/task320-qa-i18n-fixes.mjs` exits 0; `tr -cd '\000' < file | wc -c` = 0; no BOM;
  file not truncated (ends with `main().catch(...)`). Paste the green integrity line.
- **Clause 10:** append to the existing Task 320 session log (Files Changed: the one script path, 1-line rationale);
  executor emits **NO** git.

## Out of scope

- The Task 320 product fix (UserCard, NumInputField, locale keys, manifest, baseline) — APPROVED, do **not** touch.
- New stories, new viewports, new screenshots beyond the existing matrix.
- Any other QA script, any `t()` site, any `git add`/`git commit`.
