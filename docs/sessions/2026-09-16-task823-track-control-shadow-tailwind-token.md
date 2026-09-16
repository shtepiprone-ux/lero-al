# Task 823 — track control `box-shadow` leaves Tailwind's `--shadow-sm` — session log

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`

Kickoff: `tasks/Sprints/Sprint_75_kickoff_prompt_Task_823_Track_Control_Shadow_Tailwind_Token.md`
Evidence: `docs/sessions/evidence/task823/`

## Summary

`MantineListingCardTrack.module.css`'s `.control` rule read `var(--shadow-sm)`, a Tailwind-compiler-
emitted custom property (`docs/design-system.md` §23.7) — `check:tailwind-runtime-tokens` flagged it
as new debt (1 Tailwind-owned reference, line 209). Replaced the read with the literal value the
production build ships today, copying `ListingCard.module.css:84`'s exact form (same value, same five
`design-tokens-allow` markers and reasons) — the accepted in-repo precedent for reproducing this exact
flattened shadow. No baseline row added (R2 forbids it — the debt is fixed, not recorded).

## Files Changed

| Path | Reason |
|---|---|
| `src/design-system/mantine/patterns/MantineListingCardTrack.module.css` | `.control`'s `box-shadow` declaration only — one line changed (R1). |
| `docs/backlog.md` | Task 823's state line. |

## Sequencing check (§10.1)

`13_log-file.txt`: the last commit touching the target file is `701d5a315` (Task 815's approved
commit); `12_status-before.txt`: working tree clean before this session's edit. Confirmed unblocked —
no mixed hunks.

## Requirement / AC evidence

| Req | Evidence |
|---|---|
| R1 | `git diff` (`32_diff-stat.txt`, full diff below) — one line changed inside `.control`, the literal and all five markers copied verbatim from `ListingCard.module.css:84`. |
| R2 | `25_check-tailwind-runtime-tokens.txt` — exit 0, `Tailwind-owned references found: 0`; `33_diff-stat-baseline.txt` — empty (baseline file untouched). |
| R3 | `21_before-box-shadow.txt` / `23_after-box-shadow.txt` — both rail controls' `getComputedStyle(...).boxShadow`, byte-equal before and after. |
| R4 | `27_check-design-tokens-strict.txt` — exit 1 (Task 822's inherited 50, unrelated), zero lines naming `MantineListingCardTrack.module.css`. `26_`, `29_`, `28_`, `30_`, `31_` all exit 0. |

### AC1 — `git diff` (one changed declaration line, no other hunk)

```diff
@@ -206,7 +206,7 @@
   top: 50%;
   transform: translateY(-50%);
   z-index: var(--z-dropdown);
-  box-shadow: var(--shadow-sm);
+  box-shadow: rgba(0, 0, 0, 0.1) 0 1px 3px 0, rgba(0, 0, 0, 0.1) 0 1px 2px -1px; /* design-tokens-allow: rgba( — shadow-sm, flattened from the Tailwind --tw-shadow/--tw-ring-* composition; captured live via getComputedStyle (Task 762 Revision 1), not hand-derived — the three registered-invisible (fully transparent) layers are dropped, confirmed absent from this capture */ /* design-tokens-allow: box-shadow: 1px — same flattened shadow-sm layer */ /* design-tokens-allow: box-shadow: 3px — same flattened shadow-sm layer */ /* design-tokens-allow: box-shadow: 2px — same flattened shadow-sm layer */ /* design-tokens-allow: box-shadow: -1px — same flattened shadow-sm layer */
 }
```

### AC2 — gate green, no baseline row

`25_check-tailwind-runtime-tokens.txt`: `Tailwind-owned references found: 0 | baseline entries: 0` —
`✅ check:tailwind-runtime-tokens — 0 new debt, 0 stale baseline entries, 0 dynamic-name violations.`
`33_diff-stat-baseline.txt`: empty (`scripts/tailwind-runtime-token-baseline.json` untouched).

### AC3 — before/after computed `box-shadow`, both rail controls

Probe: `docs/sessions/evidence/task823/20_probe-box-shadow.mjs` (evidence-only; serves
`storybook-static/` on port 6038, extracts the `.control`/`.rail` hashed classes from the built CSS
asset at runtime, scrolls the rail to the midpoint so BOTH prev/next controls render — at `scrollLeft
0` only the "next" control exists — then reads `getComputedStyle(el).boxShadow` for each).

Before (`21_before-box-shadow.txt`, unmodified tree):
```
aria-label="Previous listings" boxShadow="rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(0, 0, 0, 0.1) 0px 1px 2px -1px"
aria-label="Next listings"     boxShadow="rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(0, 0, 0, 0.1) 0px 1px 2px -1px"
```
After (`23_after-box-shadow.txt`, edited tree, fresh `build-storybook`):
```
aria-label="Previous listings" boxShadow="rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(0, 0, 0, 0.1) 0px 1px 2px -1px"
aria-label="Next listings"     boxShadow="rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(0, 0, 0, 0.1) 0px 1px 2px -1px"
```
Byte-equal (confirmed by direct diff of the extracted lines). Probe exit code 0 both runs.

### AC4 — §13.2 block

| Command | Exit | Transcript |
|---|---|---|
| `node -p process.platform` | — | `10_platform.txt` / `24_platform-final.txt` |
| `node --version` | — | `11_node-version.txt` |
| `git status --porcelain` (baseline) | — | `12_status-before.txt` |
| `git log -1 --oneline -- <file>` | — | `13_log-file.txt` |
| `check:tailwind-runtime-tokens` (baseline, before edit) | 1 | `14_check-tailwind-runtime-tokens-before.txt` |
| `build-storybook` (baseline) | 0 | `15_build-storybook-before.txt` |
| box-shadow probe (before) | 0 | `21_before-box-shadow.txt` |
| `build-storybook` (after edit) | 0 | `22_build-storybook-after.txt` |
| box-shadow probe (after) | 0 | `23_after-box-shadow.txt` |
| `check:tailwind-runtime-tokens` (final) | 0 | `25_check-tailwind-runtime-tokens.txt` |
| `check:tailwind-runtime-tokens:verify-gate` | 0 | `26_check-tailwind-runtime-tokens-verify.txt` (10/10 assertions) |
| `check:design-tokens:strict` | 1 (expected — Task 822's inherited set; no line names this file) | `27_check-design-tokens-strict.txt` |
| `npm run build` | 0 | `28_build.txt` |
| `check:css-vars` | 0 | `29_check-css-vars.txt` |
| `check:file-integrity` | 0 (after BOM strip of own capture artifacts — see note) | `30_file-integrity.txt` |
| `check:mojibake` | 0 | `31_mojibake.txt` (0 artifacts, 5090 files) |
| `git diff --stat` (final) | 0 | `32_diff-stat.txt` (1 file, 1 insertion, 1 deletion) |
| `git diff --stat` baseline file | 0 | `33_diff-stat-baseline.txt` (empty) |
| `git hash-object` (final) | 0 | `34_hash-object.txt` |

## Implementation validation notes

- **`check:file-integrity` self-reference.** Redirecting a PowerShell command's own stdout into a
  file that command itself then scans (`git status --porcelain`-derived file list, which includes the
  transcript being written) makes the FIRST such run always flag that transcript for a "stray BOM" —
  an artifact of PowerShell `*>` redirection defaulting to UTF-8-with-BOM, not real corruption. Every
  occurrence this session (`29_`/`30_`) was resolved by a post-hoc byte-level BOM strip
  (`[System.IO.File]::WriteAllText(path, text, new UTF8Encoding($false))`), confirmed with a direct
  `ReadAllBytes` scan of every `git status --porcelain` path after — zero BOM/NUL across the whole
  tree. Same pattern documented in Task 815's Rev 1/Rev 2 sessions.

## Assumptions, deviations, and limitations

- None. The task executed exactly as scoped — one CSS declaration, value-preserving, no owner
  decision needed (kickoff §5: "No owner decision is needed").

## Opus handoff

- Please independently re-run `npm run check:tailwind-runtime-tokens` and re-inspect the diff; the
  markers and literal are a verbatim copy of `ListingCard.module.css:84`'s accepted form.
- `check:design-tokens:strict`'s 50 violations are Task 822's inherited set (unrelated to this task);
  confirm none names `MantineListingCardTrack.module.css` before closing AC4.
