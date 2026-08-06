# Task 626 — Move `Studio`/`Penthouse`/`Max` from global locale-leak allowlist into `PER_STORY_TOKENS`

- **Task path:** `tasks/kickoff_prompt_Task_626_LocaleLeak_PerStory_StudioPenthouseMax.md`
- **Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`

## Requirement and acceptance-criteria evidence

| ID | Evidence |
|---|---|
| R1 (AC1) | `scripts/check-locale-leak.mjs` line 106 → `/^(Premium\|Duplex)$/`. Diff below. |
| R2 (AC1) | `scripts/check-locale-leak.mjs` line 112 → `/^(Min)$/`. Diff below. |
| R3 (AC2) | New `PER_STORY_TOKENS` entries: `'mantine-primitives-filterspanelshell': ['Gas', 'Studio', 'Penthouse', 'Max']`, `'mantine-primitives-filtercontrols': ['Max']`, each with a justification comment. Full `--mantine-only` run (3 viewports) → 0 leaks/exit 0 (evidence #4 below). |
| R4 (AC3) | `messages/it.json`: `layout_studio: "Monolocale"` (line 230), `layout_penthouse: "Attico"` (line 233). `messages/sq.json`: `max: "Maks"` (line 413). Grep transcript below. |
| R5 (AC1) | `Premium`/`Duplex` unchanged in the global row; no other `LEAK_ALLOWLIST` row touched — confirmed by diff (only the two named rows + their comments changed). |
| R6 (AC4) | Planted raw `{'Penthouse'}` (expression-child) into `Badge.stories.tsx` (a canonical Mantine story NOT in the new per-story set) → detector named `Mantine/Primitives/Badge/Default` `[sq/uk/it] "Penthouse"`, exit 1. Restored byte-identical (`git diff --stat` empty), rebuilt, re-ran → 0 leaks/exit 0. Full transcript below. |
| R7 (AC5) | `git diff --stat -- .github/workflows/governance-pr.yml` → empty (untouched). `scripts/check-locale-leak.mjs`'s `process.exit` leak branch untouched (only allowlist data edited, confirmed by diff). Full `--mantine-only` reports 0 leaks/exit 0 on the final tree (evidence #7 below). |

## Current versus required behavior

**Current (before):** `Studio`, `Penthouse`, `Max` were globally allowlisted, so the comparison-based detector could not flag them anywhere — including a story that wrongly rendered raw "Penthouse" where it should show it "Attico". The gate was silent on this class of real mistranslation.

**Required after (now landed):** the three tokens are allowlisted only in the two specific stories that legitimately render them as fixture/loanword text (`mantine-primitives-filterspanelshell`, `mantine-primitives-filtercontrols`). Everywhere else — including `Badge.stories.tsx`, proven via the planted-violation round-trip — a raw occurrence is now caught. The current tree still passes 0 leaks/exit 0 because the two legitimate occurrences are covered.

**Negative flows (applicability table from kickoff):**

| Branch | Applicable? | Result |
|---|---:|---|
| Planted mistranslation of `Penthouse`/`Studio`/`Max` in a non-scoped story | Yes | Caught — see R6 evidence. |
| Token renders in a story with a real localized form that should use `storyT` | Yes (checked) | Not found. Every occurrence traced to a real `next-intl`/`storyT` call resolving through `messages/*.json` (`listing.layout_studio`/`layout_penthouse` via `FiltersPanel`'s `tl()`, `common.max`/`storybook.filtercontrols.price_max` via `t()`/`storyT()`) — no raw-fallback rendering, no story bug found. |
| Removing from global now leaks the token in a legitimate fixture story | Yes | `FiltersPanelShell` (Studio/Penthouse/Max) and `FilterControls` (Max) — added as exact per-story entries. |
| Empty canonical Mantine set / detector infra | No (untouched) | N/A |
| `governance-pr.yml` CI wiring | No (out of scope) | Unchanged — confirmed. |

## Files Changed

| Path | Reason |
|---|---|
| `scripts/check-locale-leak.mjs` | Narrowed the two global `LEAK_ALLOWLIST` rows (dropped `Studio`/`Penthouse`/`Max`); added two `PER_STORY_TOKENS` entries scoping those tokens to the exact stories that legitimately render them; updated the two rows' justification comments. |
| `docs/sessions/2026-07-19-task626-locale-leak-perstory-studio-penthouse-max.md` | This session log. |
| `docs/backlog.md` | Concise state update (Task 625's R5-deferred note resolved; Task 626 marked implemented). |

`src/stories/mantine/primitives/Badge.stories.tsx` was temporarily edited for the R6 planted-violation proof and restored byte-identical (`git diff --stat` confirms zero net change — it does not appear in `git status`).

## Validation evidence

**1. `git diff -- scripts/check-locale-leak.mjs`** (AC1/AC2/AC5) — shows exactly the two narrowed global rows (with updated comments) and the two new/extended `PER_STORY_TOKENS` entries; no other row touched:

```diff
 const LEAK_ALLOWLIST = [
   ...
   // ── Task 624 — Real-estate loanwords, verified against messages/*.json listing.layout_*/
-  //    listing.premium: sq keeps Premium/Studio/Duplex/Penthouse identical to en; it keeps
-  //    Premium/Duplex identical to en (it translates Studio→"Monolocale" and Penthouse→"Attico"
-  //    elsewhere, so those it values never render this token — allowlisting is safe). ───────────
-  /^(Premium|Studio|Duplex|Penthouse)$/,
-  // ── Task 624 — universal Min/Max abbreviation, verified against messages/*.json common.min/
-  //    common.max and storybook.filtercontrols.price_min/price_max: sq/it keep "Min" identical to
-  //    en (Albanian "Minimumi" and Italian "minimo" abbreviate the same way); it also keeps "Max"
-  //    identical (Italian "massimo" abbreviates the same way); sq's distinct "Maks" spelling is
-  //    used where it already exists and is unaffected by this allowlist. ─────────────────────────
-  /^(Min|Max)$/,
+  //    listing.premium: sq/it keep Premium/Duplex identical to en (genuine cognates in both
+  //    locales). Studio/Penthouse do NOT stay here — Task 626 moved them to PER_STORY_TOKENS
+  //    because it translates Studio→"Monolocale" and Penthouse→"Attico" (a global allowlist
+  //    entry would have masked a real mistranslation anywhere else these render). ─────────────
+  /^(Premium|Duplex)$/,
+  // ── Task 624 — universal Min abbreviation, verified against messages/*.json common.min/
+  //    storybook.filtercontrols.price_min: sq/it keep "Min" identical to en (Albanian "Minimumi"
+  //    and Italian "minimo" abbreviate the same way). "Max" does NOT stay here — Task 626 moved
+  //    it to PER_STORY_TOKENS because sq translates Max→"Maks" (a global allowlist entry would
+  //    have masked a real sq mistranslation anywhere else this renders). ───────────────────────
+  /^(Min)$/,
   ...
-  // FiltersPanelShell: heating_gas loanword — it:"Gas" is the correct Italian cognate for the
-  // fixture's pre-selected heating-type option (verified against messages/it.json).
-  'mantine-primitives-filterspanelshell': ['Gas'],
+  // FiltersPanelShell: heating_gas loanword (it:"Gas") + layout_features loanwords (sq:"Studio"/
+  // "Penthouse" — sq keeps these identical to en) + common.max loanword (it:"Max" — it keeps this
+  // identical to en); all verified against messages/it.json + messages/sq.json (Task 626).
+  'mantine-primitives-filterspanelshell': ['Gas', 'Studio', 'Penthouse', 'Max'],
+  // FilterControls: storybook.filtercontrols.price_max renders via common.max — it keeps "Max"
+  // identical to en (genuine Italian cognate), verified against messages/it.json (Task 626).
+  'mantine-primitives-filtercontrols': ['Max'],
 };
```

**2. `grep -nE '"(layout_studio|layout_penthouse)"' messages/it.json; grep -n '"max"' messages/sq.json`** (AC3):

```
messages/it.json:230:    "layout_studio": "Monolocale",
messages/it.json:233:    "layout_penthouse": "Attico",
messages/sq.json:413:    "max": "Maks",
```

**3. `npm run build-storybook`** → `Storybook build completed successfully` (exit 0). Rebuilt 4 times total across the session (baseline, post-narrow, planted, restored) — each rebuild's output is embedded in the corresponding scan below.

**4. Baseline honesty check — the pre-existing `storybook-static` was STALE.** Before any edit, a fast scan against the un-rebuilt static dir surfaced a leftover `Mantine/Primitives/Badge/Planted Leak Task 625` story with token `PlantedLeakViolationTask625` — a remnant of Task 625's own planted-violation testing that was never rebuilt away. `grep` confirmed the source `Badge.stories.tsx` had no such story and `git status` was clean, proving it was a stale build artifact, not real drift. Rebuilt Storybook before trusting any further result. Fresh-build baseline (fast mode, unmodified allowlist):

```
✅  Locale leak detector: ZERO leaks across 60 stories × sq/uk/it.
```

**5. Empirical discovery (fast mode, immediately after narrowing R1/R2, before adding per-story entries):**

```
❌  Locale leak detector: 4 leak(s) found:

  Story: Mantine/Primitives/FilterControls/Default
    [it] "Max"

  Story: Mantine/Primitives/FiltersPanelShell/Default
    [sq] "Studio"
    [sq] "Penthouse"
    [it] "Max"
EXIT=1
```

This is the empirical derivation required by the kickoff (§"Assumptions" step 3) — the exact two story-ID prefixes and exact tokens, discovered by removing the global masking and reading the detector's own named leaks, not guessed.

**6. Fast-mode re-verification after adding the two `PER_STORY_TOKENS` entries:**

```
✅  Locale leak detector: ZERO leaks across 60 stories × sq/uk/it.
```

**7. `npm run check:locale-leak:mantine-only` (full mode, 3 viewports) — R7/AC2, run twice (pre-plant and post-restore, both against the final code state):**

```
🔍  Locale leak detector — full mode (mantine-only)
Mantine selected: 60; non-Mantine excluded: 236
    Stories: 60 scanned (0 multi-locale demo stories excluded) | Locales: sq/uk/it | Viewports: 3
✅  Locale leak detector: ZERO leaks across 60 stories × sq/uk/it.
EXIT=0
```

Verbatim, both runs (first run: `.screenshots/locale-leak/2026-07-19T13-47/report.json`; final confirmation run after the R6 restore: `.screenshots/locale-leak/2026-07-19T14-08/report.json`).

**8. Planted-violation round-trip (R6/AC4).** Planted `{'Penthouse'}` as a JSX expression-child `<Text>` (survives the static `check:stories` hardcode lint — same technique Task 625 used) into `src/stories/mantine/primitives/Badge.stories.tsx` (title `Mantine/Primitives/Badge`, NOT one of the two newly-scoped stories). Rebuilt Storybook (exit 0). Ran `node scripts/check-locale-leak.mjs --mantine-only --fast`:

```
❌  Locale leak detector: 3 leak(s) found:

  Story: Mantine/Primitives/Badge/Default
    [sq] "Penthouse"
    [uk] "Penthouse"
    [it] "Penthouse"

    Report: .screenshots/locale-leak/2026-07-19T14-02/report.json
EXIT=1
```

The script's own `process.exit(1)` fires — the detector's real exit-code behavior, independent of the warn-only CI wiring (untouched by this task). Restored `Badge.stories.tsx` (`git diff --stat -- src/stories/mantine/primitives/Badge.stories.tsx` → empty, byte-identical to HEAD). Rebuilt Storybook (exit 0) and re-ran full mode — see evidence #7's second run (ZERO leaks, exit 0).

**9. `npx tsc --noEmit`** → exit 0 (no output; sanity check, no TS surface touched).

**10. `git status --short` reconciliation:**

```
 M scripts/check-locale-leak.mjs
```

Only the intended file plus (untracked, added by this session) the session log and the backlog edit — matches the Files Changed table.

## Self-review findings

- No defects found. The empirical discovery step (evidence #5) matched the static source trace performed before editing (`LAYOUT_FEATURES`/`HEATING_TYPES` constants → `messages/*.json` lookups → `FiltersPanel.tsx`/`FilterControls.stories.tsx` render sites) exactly — both methods independently converged on the same two stories and tokens, cross-validating the result.
- Open question from the kickoff ("token renders where a real localized form exists but the story doesn't use `storyT`") was checked and found **not applicable**: every rendering site traced to a genuine `next-intl`/`storyT` call resolving through `messages/*.json`, not a raw string or an untranslated fallback. No story-bug follow-up to log.
- The legacy-prefixed `primitives-checkbox`/`layout-filterbar` `Studio` rows (out of scope per the kickoff) were left untouched; they are excluded from `--mantine-only` scope entirely (non-Mantine story-ID prefixes) and were not proven dead by this task's empirical run (that run only scans the Mantine-only set), so per the kickoff's explicit instruction they were left as-is with no dead-code claim made.

## Assumptions, deviations, and limitations

- No deviations from the kickoff's scope. The two-story, four-token empirical result matches what the kickoff's own verified-context section anticipated (`Gas` precedent pattern), just with the exact prefixes derived empirically rather than assumed.
- The stale `storybook-static` finding (evidence #4) is reported for transparency — it was a pre-existing build artifact from a prior session's testing, not something this task's diff caused, and does not affect the final evidence (all decision-relevant runs used freshly rebuilt output).

## Opus handoff

- Evidence lives in this file (verbatim command output) and `.screenshots/locale-leak/2026-07-19T{13-47,14-08}/report.json` for the two full-mode 0-leak runs.
- Please re-verify: (a) the diff touches only the two named `LEAK_ALLOWLIST` rows and the `PER_STORY_TOKENS` additions — no other allowlist row; (b) `Badge.stories.tsx` shows zero diff in the final `git status`; (c) `governance-pr.yml` and the script's `process.exit` branch are untouched.
- No risks or open questions beyond the standard review — this was a narrow, empirically-verified allowlist reclassification with no product-code surface.

## Backlog update

`docs/backlog.md` updated: Task 625's line no longer claims R5 as merely deferred (now notes it landed via Task 626); Task 626's line changed from "📝 KICKOFF READY" to "✅ IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW" with a one-line result summary and this session's path. File is 72 physical lines (within the ≤80 hard limit) — no `BACKLOG LIMIT BREACH`.
