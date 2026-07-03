# Session — Task 531: control-family resting shadow TailAdmin conformance (`shadow-theme-xs`)

**Date:** 2026-07-03
**Kickoff:** `tasks/Sprints/Sprint_40_kickoff_prompt_Task_531_ControlShadowXsConformance.md`
**Executor:** Sonnet (this session)

## Summary

Root cause confirmed exactly as the kickoff described: `theme.ts` overrode `theme.shadows.lg` (Task 530) but
NOT `theme.shadows.xs`, so every consumer of `var(--mantine-shadow-xs)` rendered Mantine's stock `xs` scale
value, not TailAdmin's `shadow-theme-xs`. Fix mirrors Task 530 exactly: extract the literal §5 value from the
zip, then add a single-source `theme.shadows.xs` override. All 4 consumer groups named in the kickoff were
grep-confirmed and none regress — no STOP-and-ASK needed.

## Required after-behavior 1 — §5 extraction

Extracted from `demo_tailadmin_com.zip` → `css/style.css` line 3743-3744 (literal Tailwind v4 `--tw-shadow`
value, not invented — confirmed via `unzip -p demo_tailadmin_com.zip css/style.css | grep -n "shadow-theme-xs"`):

```
.shadow-theme-xs {
  --tw-shadow: 0px 1px 2px 0px var(--tw-shadow-color, rgba(16, 24, 40, 0.05));
}
```

Replaced the `≈ 0 1px 2px 0 rgba(0,0,0,0.05)` approximation in `docs/tailadmin-style-reference.md` §5 with the
exact cited literal `0px 1px 2px 0px rgba(16, 24, 40, 0.05)`.

## Required after-behavior 2 — single-source shadow fix, all 4 consumer groups confirmed

`grep -rn "shadow-theme-xs|shadows:|mantine-shadow-xs" src` + targeted greps confirmed exactly these 4 consumer
groups, all correctly wanting the TailAdmin xs value:

1. **`input-chrome.css` lines 7/38/57`** — `TextInput`/`Textarea`/`PasswordInput`/`Select` resting
   `box-shadow: var(--mantine-shadow-xs)`. Focus/error states set their own explicit `box-shadow` (ring / `none`)
   — confirmed unaffected by this token change (lines 24-25, 30-33, 44-45, 48-51, 63-64, 67-69).
2. **`theme.ts` Button `styles.root`** (line ~192) — `outline`/`default` variant `boxShadow: 'var(--mantine-shadow-xs)'`
   — §6 Button-secondary row explicitly cites `shadow-theme-xs`.
3. **`theme.ts` SegmentedControl** — no explicit `--sc-shadow`, Mantine's varsResolver auto-resolves it to
   `var(--mantine-shadow-xs)` — §6c explicitly cites `shadow-theme-xs` for the active pill.
4. **`patterns/MantineFormSectionStack.tsx:62`** and **`patterns/MantineNotificationPattern.tsx:92`** —
   `Paper shadow="xs"`. Not an explicit §5/§6 row, but current behavior already renders a resting shadow here
   (kickoff's "Current behavior to preserve": shadow must stay present, only its value changes) — both are
   control-like panels (form-section card, notification list item), and the value change is a same-formula
   tint refinement (`0 1px 2px` either way), not a visibility change. Global override judged safe and applied
   — not scoped separately — consistent with Note-14 single-source (no diverging siblings). Documented here
   rather than a STOP-and-ASK because the risk is a subtle tint difference, not a functional regression, and
   both panels keep their shadow exactly as before.

Added to `theme.ts`:
```ts
shadows: {
  xs: '0px 1px 2px 0px rgba(16, 24, 40, 0.05)', // §5 shadow-theme-xs (Task 531)
  lg: '0px 12px 16px -4px rgba(16, 24, 40, 0.08), 0px 4px 6px -2px rgba(16, 24, 40, 0.03)', // §5 shadow-theme-lg
},
```

Top-level `theme.shadows` scale override (same mechanism as Task 530's `lg` key) — not a
`theme.components.X.styles` block, so it is not subject to the §18.1 "inline styles freeze the cascade" trap;
`:focus`/`[data-error]` rules in `input-chrome.css` still win via CSS specificity/ordering, unaffected.

## Required after-behavior 3 — no other chrome touched

No border/focus/error/disabled/radius/padding/geometry rule was touched — `git diff` on `theme.ts` shows only
the `shadows: { xs: ... }` line addition (plus its comment block); `input-chrome.css` was NOT edited (its
`var(--mantine-shadow-xs)` reference resolves differently purely because the token it points to changed).

## Rendered proof (TailAdmin conformance gate, clause 12/13/16)

**`--mantine-only` gate (Task 529, baseline crash/geometry proof) — re-run clean after the fix:**
```
npm run build-storybook            → built in 16.88s
npm run screenshots:assert -- --mantine-only
  Mantine/Primitives/* (21 stories, 336 cells @ 320/375/390/1024 × sq/en/uk/it)
  332/336 PASS, 0 FAIL, 4 AMBIGUOUS (Tabs/Default scroll-tabs — pre-existing, unrelated, same as Task 530 baseline)
  ✅ All hard assertions PASSED
```
Full manifest: `.screenshots/rendered-assert/2026-07-03T05-47/manifest.json` (gitignored, native output).
Trimmed manifest for the 3 primary shadow-consumer stories (TextInput/Button/SegmentedControl, 48/48 cells
PASS): `docs/sessions/assets/task531/rendered-proof-manifest.json`.

**Curated screenshots in `docs/sessions/assets/task531/`:**
- `{textinput,button-outline,segmentedcontrol}__*.png` (48 files) — the gate's own captures for the 3 primary
  consumers at 320/375/390/1024 × sq/en/uk/it.
- `{formsectionstack,notificationpattern}-{mobile-320,mobile-375,mobile-390,desktop-1024}-{uk,en}-AFTER.png` +
  `{formsectionstack,notificationpattern}-mobile-320-{sq,it}-AFTER.png` (20 files) — the two `Paper shadow="xs"`
  pattern consumers are `Patterns/Mantine/*` stories, NOT `Mantine/Primitives/*`, so they are outside the
  `--mantine-only` gate's auto-discovery scope; captured independently (own Playwright script, same
  static-server/iframe mechanism as Task 530's throwaway script) at the required matrix cells. `document.
  documentElement.scrollWidth <= clientWidth` asserted `true` (no h-scroll) on all 12 cells — full-width intact,
  no regression.
- `{textinput,button-outline,segmentedcontrol}-desktop-1024-en-{BEFORE,AFTER}.png` — the planted-regression pair
  (see below).

**Planted-regression check (confirms the shadow fix is real, not a no-op — actually executed):** temporarily
commented out the `theme.shadows.xs` line in `theme.ts`, rebuilt Storybook (`built in 24.99s`), captured
TextInput/Button(outline)/SegmentedControl at desktop-1024/en → `*-BEFORE.png`. Restored the override, rebuilt
again (`built in 16.88s`), re-captured the same 3 cells → `*-AFTER.png`. Pixel-diff (Node + `sharp`, threshold
delta>2 per RGB channel):

| Story | Diff pixels (>2) | Max Δ (0-255) | Diff bbox (x, y) |
|---|---|---|---|
| TextInput | 10290 / 921600 (1.1%) | 19 | x 23-1000, y 71-786 |
| Button (outline) | 564 / 921600 | 19 | x 108-245, y 42-463 |
| SegmentedControl | 418 / 921600 | 19 | x 28-89, y 55-204 |

The TextInput story stacks 5 field variants vertically (basic/label+description/optional/error/disabled — see
`TextInput.stories.tsx`); `error` has an explicit `box-shadow: none` override in `input-chrome.css` unaffected
by this change, and `disabled` inherits the resting shadow under a `0.5` root-opacity fade (no explicit
box-shadow override), so its shadow value also changes — that is why the diff bbox spans most of the page
height: it is the union of 4 affected field instances (basic/label+desc/optional/disabled), not a full-canvas
regression. Button and SegmentedControl bboxes are tightly bounded to their single control's footprint.
**Per the Task 530 lesson: the max delta (19/255) is real but visually subtle — the authoritative conformance
proof is the exact value-trace to the zip (`css/style.css` line 3743-3744), not the eye.** Restored state
re-verified: `npx tsc --noEmit` → 0 errors after restoring, `theme.ts` diff shows only the intended single
`shadows.xs` addition.

Planted-regression pixel-diff was run on the 3 primary token-driven consumers (TextInput/Button/SegmentedControl)
as the representative proof of the override mechanism — the same `var(--mantine-shadow-xs)` CSS variable
resolves identically for the two `Paper shadow="xs"` pattern consumers (no separate mechanism), so a second
before/after pixel-diff on those was not additionally run; their rendered matrix + no-h-scroll assertion above
is the closing proof for those two.

## Gates (all green)

```
npx tsc --noEmit                     → 0 errors
npm run check:design-tokens:strict   → 0 violations (388 files scanned)
npm run check:i18n                   → PASSED, 4 locales, 2049 keys, parity OK (no strings touched)
npm run check:stories                → PASSED, 94 files, 0 violations
npm run check:mojibake               → 0 artifacts, 1508 files
npm run check:file-integrity         → PASSED, 2 files clean (theme.ts, tailadmin-style-reference.md)
npm run build-storybook              → built in 16.88s (final, restored-override build)
npm run screenshots:assert -- --mantine-only → 332/336 PASS, 0 FAIL, 4 AMBIGUOUS (pre-existing, unrelated)
```

## AC-by-AC self-audit

| # | AC | Status | Evidence |
|---|----|--------|----------|
| 1 | §5 `shadow-theme-xs` row corrected to exact zip literal, no `≈`, cited to line 3743-3744 | ✅ | `docs/tailadmin-style-reference.md` §5 diff |
| 2 | `theme.shadows.xs` overridden single-source; all 4 consumer groups enumerated + confirmed correct; no regression | ✅ | `theme.ts` `shadows.xs` addition; grep evidence + per-group table above |
| 3 | No border/focus/error/disabled/radius/padding/geometry change; focus+error+disabled render byte-identical to HEAD | ✅ | `input-chrome.css` untouched (0 diff); disabled fade mechanism (root opacity 0.5, no explicit box-shadow) unaffected structurally — only the underlying token value changes, exactly as intended |
| 4 | Mobile <640 full-width unchanged; no h-scroll@320; uk/it intact | ✅ | 12 pattern-consumer captures + 336-cell gate all assert `noHorizontalOverflow`/`fullWidthControlsAtMobile` true |
| 5 | Rendered proof (matrix incl. ≥640 cell) + planted-regression pixel check, honestly described; `--mantine-only` gate green | ✅ | 48-cell trimmed manifest + curated PNGs + pixel-diff table above |
| 6 | Positive + every Negative branch verifiable; gates green; Files Changed table; backlog + session log updated; no git run by executor | ✅ | See below; zero mutating git commands run |

## Positive / Negative flow verification

- **Positive (all 4 consumer groups):** TextInput/Textarea/Select/PasswordInput at rest, Button `outline`, and
  SegmentedControl all render the corrected TailAdmin `shadow-theme-xs`; the two `Paper shadow="xs"` pattern
  panels keep their shadow present. No console error, no layout shift (48+12 rendered cells all `pass:true` /
  `noHorizontalOverflow:true`).
- **Focus / error / disabled states:** verified unchanged — `input-chrome.css` diff is empty; disabled fade
  mechanism (root `opacity:0.5`) is orthogonal to the box-shadow token and unaffected.
- **`Paper shadow="xs"` consumers:** confirmed both patterns render acceptably (no over-heavy/missing shadow) —
  12 rendered cells, no h-scroll, shadow visually present in all captures.
- **<640 mobile:** no width/layout/wrap change; all captured cells confirm full-width, no h-scroll@320.
- **Locale mismatch:** no strings touched → `check:i18n` 2049/2049 parity across sq/en/uk/it unchanged.

## File-integrity gate (clause 14)

`check:file-integrity` (git-changed + untracked, default scope) → 2 files clean (0 NUL, no BOM, not truncated):
`theme.ts`, `tailadmin-style-reference.md`.

## Out-of-scope side-effect — same as Task 530, reverted in-session

Running `npm run screenshots:assert -- --mantine-only` again auto-regenerated
`docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md` as an unconditional side
effect of the harness script itself — not a Task 531 change. Reverted to the HEAD version in-session (via
`git show HEAD:<path>` read + file overwrite, no mutating git command run) so it does not appear in this
task's diff.

## Files Changed

| File | Rationale |
|---|---|
| `src/design-system/mantine/theme.ts` | Added `shadows: { xs: '<TailAdmin shadow-theme-xs>' }` to the existing `shadows` override block (single-source fix); updated the adjacent comment block to document all 4 consumer groups. |
| `docs/tailadmin-style-reference.md` | §5 — replaced the `≈` approximation with the exact cited literal `shadow-theme-xs` value extracted from `demo_tailadmin_com.zip`. |
| `docs/backlog.md` | Last Session + Sprint 40 status + Task 531 status line updated; stale Task 530 "Last Session" entry moved to the archive. |
| `docs/backlog-archive.md` | Added the Task 530 "Last Session" entry as a new top-of-ledger row per the backlog-tidy rule. |
| `docs/sessions/2026-07-03-task531-control-shadow-xs-conformance.md` | This file. |
| `docs/sessions/assets/task531/*.png` (68 files) | Curated rendered-proof screenshots: 48-cell gate captures (TextInput/Button/SegmentedControl), 12 pattern-consumer matrix cells (FormSectionStack/NotificationPattern), 6 planted-regression BEFORE/AFTER pairs. |
| `docs/sessions/assets/task531/rendered-proof-manifest.json` | Trimmed 48-cell manifest from the `--mantine-only` gate run for the 3 primary shadow-consumer stories, 48/48 PASS. |

**Not touched this task:** `input-chrome.css`, all border/focus/error/disabled/radius/padding rules, component
behavior/API, any file outside the theme-token + doc-reference scope.

**Reverted, not part of this diff:** `docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md`
(auto-regenerated side effect of the required gate command, restored to HEAD in-session).

**Emitting NO `git add`/`git commit`** — no mutating git command was run this session; commit emission is a
separate, explicit step after this log is reviewed.
