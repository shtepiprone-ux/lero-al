# Session: Task 425 — StatusChangeControl mobile <640 full-width submit buttons (2026-06-14)

Kickoff: `tasks/Epics/Epic_Y_kickoff_prompt_Task_425_statuschangecontrol_mobile_note_submit.md` (read in full).

## Finding — premise already satisfied, ZERO diff to `StatusChangeControl.tsx`

The kickoff (§3.1/§3.2) asked for `max-sm:w-full max-sm:min-h-11` on:
1. the select-variant note submit button (`StatusChangeControl.tsx:130-140`), and
2. the workflow-variant submit button (`StatusChangeControl.tsx:207-214`).

Both buttons render via the canonical `<Button size="sm">` (no width/height-overriding `className`). Task 421
(commit `44227e995`, already on `main`) added `max-sm:w-full max-sm:h-auto max-sm:min-h-11 max-sm:whitespace-normal
max-sm:break-words` to **every non-icon `size` variant** of the canonical `Button`, including `sm`
(`src/components/ui/button.tsx:26`). Since neither submit button overrides width/height/whitespace, they
**already inherit full-width / ≥44px / wrapping behavior at <640** — confirmed by rendered evidence below.

I attempted the className addition first, then reverted it on inspection of `button.tsx` (the classes would have
been pure duplicates, and the extra unconditional `whitespace-normal break-words h-auto` I initially added would
have **broken** the `≥640` "size=sm look" requirement in §3.1 by removing the fixed `h-7` at desktop widths — so
reverting was the correct call, not just "no-op is fine").

**Net result: `StatusChangeControl.tsx` is unchanged.** The only diff is rendered-evidence registration
(`scripts/check-stories-rendered.mjs`).

## Files Changed

| File | Change |
|---|---|
| `src/components/admin/StatusChangeControl.tsx` | **No change** — verified already compliant via canonical `Button size="sm"` (Task 421, `button.tsx:26`). |
| `scripts/check-stories-rendered.mjs` | Registered 2 new `ASSERT_STORIES` entries: `admin-statuschangecontrol--select-with-note` (select-variant note submit button visible) and `admin-statuschangecontrol--workflow-required-note` (workflow-variant submit button + required-note hint visible), inserted after the existing `admin-statuschangecontrol--select` entry. |
| `docs/backlog.md` | Session summary updated; Task 238 entry archived. |
| `docs/sessions/2026-06-14-task425-statuschangecontrol-mobile-note-submit.md` | This file. |

## AC-by-AC Self-Audit (kickoff §8)

| # | AC | Evidence | Status |
|---|---|---|---|
| 1 | Select-variant note submit button: `max-sm:w-full max-sm:min-h-11` | Already inherited from `<Button size="sm">` → `src/components/ui/button.tsx:26` (`max-sm:w-full max-sm:h-auto max-sm:min-h-11 max-sm:whitespace-normal max-sm:break-words`); button at `StatusChangeControl.tsx:130-140` has no conflicting `className`. Rendered proof: `admin-statuschangecontrol--select-with-note` @ mobile-320/375/390, `fullWidthButtonsAtMobile: true`, `noHorizontalOverflow: true` (all 4 locales) | ✅ (pre-existing) |
| 2 | Workflow-variant submit button: same | Same `<Button size="sm">` base, `StatusChangeControl.tsx:207-214`. Rendered proof: `admin-statuschangecontrol--workflow-required-note` @ mobile-320/375/390, `fullWidthButtonsAtMobile: true`, `noHorizontalOverflow: true` (all 4 locales) | ✅ (pre-existing) |
| 3 | No behavioral/label/transition/i18n change — pure responsive-class delta | `StatusChangeControl.tsx` has a 0-line diff; only `scripts/check-stories-rendered.mjs` (registry) changed | ✅ |
| 4 | Combobox trigger verified full-width <640 (screenshot), unchanged | `admin-statuschangecontrol--select` @ uk/mobile-320 — `fullWidthControlsAtMobile: true`; visually the "Новий" Combobox trigger spans full width edge-to-edge | ✅ |
| 5 | Chips documented as cluster exemption | See "Control Inventory" below | ✅ |
| 6 | Rendered matrix with uk@320/375/390 proving both buttons full-width at <640 | Scoped 3-story run (existing `select` + 2 new): **168/168 PASS, 0 FAIL**, `fullWidthButtonsAtMobile: true` for both new stories at mobile-320/375/390/480 × all 4 locales; full canonical 73-story matrix re-run below | ✅ |
| 7 | `tsc`=0; `lint` 0 new; `check:stories` + `screenshots:assert` green; `check:file-integrity:all` green | tsc: 0 errors. lint: clean. `check:stories`: 55 files, 0 violations. `check:file-integrity:all`: 901 files clean. `screenshots:assert`: see below | ✅ |

## Positive Flow

Staff opens any `StatusChangeControl` surface at <640 (e.g. the listing edit side-panel from Task 238, or
`/admin/inquiries`, `/admin/support`): the select-variant note submit button and the workflow-variant submit
button both render edge-to-edge full-width, ≥44px tall (`min-h-11`), with labels wrapping
(`whitespace-normal break-words`) rather than clipping — this was already true before this session (canonical
`Button size="sm"`, Task 421) and remains true; tapping behaves exactly as before (no logic touched).

## Negative Flow Verification (kickoff §6)

| Branch | Status |
|---|---|
| Disabled state (`disabled \|\| pending`, select-note `!note.trim()`) still visually disables the full-width button | Unchanged — `disabled` prop wiring at `StatusChangeControl.tsx:136` (select) / `:210` (workflow) untouched; `Button`'s `disabled:opacity-50` applies regardless of width |
| Same-status no-op guard intact (`:82`) | Untouched — `handleSubmit` line 82 (`if (toStatus === currentStatus) return`) unchanged |
| Error path: `catch → toast.error(status_change_error)` intact | Untouched — `StatusChangeControl.tsx:90-91` unchanged |
| Locale: long sq/en/uk/it submit labels wrap inside the full-width button, never clip at 320 | Rendered proof: `admin-statuschangecontrol--select-with-note` / `--workflow-required-note` @ mobile-320, all 4 locales, `noHorizontalOverflow: true` |
| Workflow note-required hint still shows when required and empty | Untouched — `StatusChangeControl.tsx:203-205` (`isNoteRequired && note.trim().length === 0 && selectedStatus`) unchanged; new story `WorkflowRequiredNote` exercises `requireNote` |

## Control Inventory (Note 20) — before / after

| Control | Before | After |
|---|---|---|
| Select-variant note submit button (`StatusChangeControl.tsx:130-140`) | `<Button size="sm" ...>` — already `max-sm:w-full max-sm:min-h-11 max-sm:whitespace-normal max-sm:break-words` via Task 421's `button.tsx:26` | **Unchanged** (no diff) |
| Workflow-variant submit button (`StatusChangeControl.tsx:207-214`) | Same `<Button size="sm" ...>` base | **Unchanged** (no diff) |
| Combobox trigger (`variant="select"`, `:107-119`) | Already full-width + bottom-sheet at <640 (Task 421 tokens) | **Unchanged** — verified via screenshot, not patched |
| Workflow transition chips (`:172-188`) | `flex-wrap` cluster, each chip `min-h-11`, intrinsic width, `whitespace-normal break-words h-auto` | **Unchanged — documented cluster exemption** (§3.5): each chip is one of several sibling transition actions in a wrap row, not a single page-level CTA, so it is NOT forced to `w-full`. At 320px a chip's intrinsic width may visually approach full-width for long uk labels, which is acceptable (wrap row collapsing to one-per-line), but the class itself remains intrinsic-width by design. |

## i18n

0 new keys — no strings touched (confirmed: zero diff to `StatusChangeControl.tsx`, zero diff to `messages/*.json`).

## Validation

- `npx tsc --noEmit` → **0 errors**
- `npm run lint` → **clean, 0 new**
- `npm run check:stories` → **PASSED — 55 files checked, 0 violations**
- `npm run check:file-integrity:all` → **PASSED — 901 files clean**
- `npm run screenshots:assert`:
  - Scoped 3-story verification run (`select`, `select-with-note`, `workflow-required-note`) → **168/168 PASS, 0 FAIL**, `fullWidthButtonsAtMobile: true` / `fullWidthControlsAtMobile: true` / `noHorizontalOverflow: true` confirmed at mobile-320/375/390/480 across sq/en/uk/it.
  - Full canonical 73-story matrix (after permanently registering the 2 new stories) →

```
Stories: 73 | Viewports: 14 | Locales: 4
Results: 4088/4088 PASS, 0 FAIL
flaky-recovered: 2
    Select/Default × en × canonical-1200 (retries: 1)
    StatusChangeControl/WorkflowRequiredNote × uk × canonical-1200 (retries: 1)
Manifest: .screenshots/rendered-assert/2026-06-14T20-54/manifest.json
✅ All rendered assertions PASSED.
```

Mandatory uk@320/375/390 cells for both new stories, all `pass: true`, `fullWidthButtonsAtMobile: true`,
`noHorizontalOverflow: true`:

| Story | Viewport | pass | fullWidthButtonsAtMobile | noHorizontalOverflow |
|---|---|---|---|---|
| `admin-statuschangecontrol--select-with-note` | mobile-320 | true | true | true |
| `admin-statuschangecontrol--select-with-note` | mobile-375 | true | true | true |
| `admin-statuschangecontrol--select-with-note` | mobile-390 | true | true | true |
| `admin-statuschangecontrol--workflow-required-note` | mobile-320 | true | true | true |
| `admin-statuschangecontrol--workflow-required-note` | mobile-375 | true | true | true |
| `admin-statuschangecontrol--workflow-required-note` | mobile-390 | true | true | true |

The 2 flaky-recovered cells (`Select/Default × en × canonical-1200`, `StatusChangeControl/WorkflowRequiredNote ×
uk × canonical-1200`) both passed on retry 1 — neither is one of the mandatory mobile cells and neither involves
this session's registry change beyond the new story itself; consistent with the transient blank-canvas retries
seen on prior full runs (e.g. Task 238's run had 0, Task 424's had some — both accepted).

## Self-validation

Self-validation: tsc=0, lint clean (0 new), `check:stories` 55 files / 0 violations, `check:file-integrity:all`
901/901 clean, `screenshots:assert` (full canonical 73-story matrix) = **4088/4088 PASS, 0 FAIL** (2
flaky-recovered, both non-mandatory cells, both passed on retry 1), uk@320/375/390 mandatory cells for both new
`StatusChangeControl` stories all PASS with `fullWidthButtonsAtMobile: true` / `noHorizontalOverflow: true`. All
7 ACs (§8) self-audited. **Net diff: `StatusChangeControl.tsx` unchanged (0 lines) — the kickoff's premise
(submit buttons not full-width at <640) was already resolved by Task 421's canonical `Button size="sm"` change
(`button.tsx:26`, already on `main`); only `scripts/check-stories-rendered.mjs` gained 2 ASSERT_STORIES entries
for rendered proof.** Task 425 complete, ready for orchestrator review.
