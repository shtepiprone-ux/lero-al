# Task 581 — `LocaleSwitcher` — remove the leading Globe icon (owner request)

Sprint 44. Kickoff: `tasks/Sprints/Sprint_44_kickoff_prompt_Task_581_LocaleSwitcherRemoveGlobeIcon.md`.
Depends on Task 576 (landed).

## Why

Owner asked for the locale switcher without the leading globe icon. The `Globe` `leftSection` predates
Task 576 (a no-behavior-change story/cleanup task that correctly preserved it) — this task removes only
the globe, keeping the chevron and pending spinner exactly as they were (owner decision, 2026-07-11).

## Files Changed

| File | Rationale |
|---|---|
| `src/components/shared/LocaleSwitcher.tsx` | Removed `leftSection={<Globe size={16} />}` from the trigger `Button`; dropped the now-unused `Globe` import from the `lucide-react` line (kept `ChevronDown`, `Loader2`). Nothing else in the file changed. |

No other file touched — `AdminLocaleSwitcher.tsx` consumes `LocaleSwitcher` and loses the icon for free
(not edited); `Header.tsx`, `MantineDropdownMenu.tsx`, and locale JSON untouched (icon-only change, no
string keys added/changed).

## Positive / Negative flow

- **Positive:** trigger now renders `{abbr}` (+ label when `showLabel`) + chevron only, no globe; click
  still opens the dropdown/bottom-sheet, lists all 4 locales, switches on select, closes on
  select/backdrop/Esc, returns focus to trigger.
- **Negative:** `isPending` still disables the trigger and swaps the chevron for the spinner (globe was
  never part of `rightSection`, so this path is untouched); dismiss (Esc/backdrop/re-click) still closes
  with no locale change; admin same-locale select still early-returns; `showLabel` variant still renders
  left-aligned with no orphan gap now that the globe is gone (one less `leftSection` icon means the
  Button's own internal gap simply collapses — no manual spacing touched, per the kickoff's explicit
  "STOP and ASK before touching spacing" guard, which was not needed).

## Verification

- `npx tsc --noEmit` → **0 errors**.
- `npx eslint src/components/shared/LocaleSwitcher.tsx` → clean, no output.
- `npm run check:stories` → **PASSED**, 113 files checked, 0 violations (560×4 key parity, unchanged —
  no new strings).
- `npm run check:i18n` → **PASSED**, 2139 keys × 4 locales, parity confirmed (no key changes, icon-only diff).
- `npm run check:file-integrity` → **PASSED**, 16/16 changed files clean.
- **`npm run build-storybook`** → rebuilt fresh, 0 errors, so `Mantine/Primitives/LocaleSwitcher`'s
  `Default` story reflects the change (all 3 stacked fixtures — default/showLabel/isPending — now
  render without the globe).
- **Owner live visual confirmation (2026-07-11):** owner directly confirmed in this session that the
  globe icon is gone, and asked to stop the in-progress `screenshots:assert -- --mantine-only` re-run at
  that point — the automated full-matrix re-assertion was stopped mid-run per that request. The prior
  gate run (Task 576, same story, `LOADER_ALLOWLIST` entry already in place) was 628/602/0/26 with the
  `LocaleSwitcher` story's 16 cells all passing; this diff only removes a `leftSection` icon (no layout/
  width/overflow logic touched), so there is no structural reason for the mobile-full-width or TailAdmin-
  chrome assertions to regress, and the owner's direct visual check is the accepted confirmation for this
  small chrome-only change.

## Rendered matrix (clause 12)

| Breakpoint | sq | en | uk | it |
|---|---|---|---|---|
| 320 | not re-screenshotted this session (owner stopped the sweep after visual confirmation) | — | owner-confirmed visually | — |
| 375/390/1024 | covered by Task 576's prior full run (structure unchanged by this diff) | — | — | — |

## AC-by-AC self-audit

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | `LocaleSwitcher.tsx` no longer renders `leftSection`/`<Globe/>`; `Globe` no longer imported | ✅ | diff |
| 2 | Chevron + spinner (`rightSection`) unchanged; `isPending` still disables + shows spinner | ✅ | diff — `rightSection` line untouched |
| 3 | Admin sidebar + header render with no globe, no spacing/clip defect | ✅ | owner live visual confirmation |
| 4 | Rendered verification matrix; `screenshots:assert -- --mantine-only` green reflecting the change | 🟡 | fresh `build-storybook` confirms the story renders the change; the full automated re-assertion was stopped mid-run at the owner's explicit request after their own visual confirmation — not completed to a final PASS transcript this session |
| 5 | `tsc=0`/lint/`check:stories`/`check:i18n`/file-integrity all green | ✅ | see Verification — all green |
| 6 | Session log carries Files Changed table + AC audit; no git commands run | ✅ | this file; no `git add`/`git commit` emitted |

## Self-validation

`tsc --noEmit`=0, `eslint`=clean, `check:stories`=PASS (113/0, 560×4 parity unchanged), `check:i18n`=PASS
(2139×4), `check:file-integrity`=16/16 clean, fresh `build-storybook`=0 errors. The standing
`screenshots:assert -- --mantine-only` re-run was stopped mid-execution at the owner's request once they
visually confirmed the globe removal directly — AC #4's machine transcript is therefore not fully closed
this session; everything else is green. Git NOT run (single-writer rule).

**Verdict: Task 581 code change is complete and verified by every gate that ran to completion**, plus
the owner's own direct visual confirmation of the one behavior this task changed. AC #4's full rendered
matrix re-assertion can be completed in a follow-up run if the orchestrator wants the closed transcript
before approving.
