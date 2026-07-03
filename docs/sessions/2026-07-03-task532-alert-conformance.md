# Session — Task 532: Alert primitive → TailAdmin conformance (Sprint 40 · Batch D · P1.15)

**Date:** 2026-07-03
**Kickoff:** `tasks/Sprints/Sprint_40_kickoff_prompt_Task_532_AlertConformance.md`
**Executor:** Sonnet (this session)

## ⚠️ Commit-hygiene finding — flag for the owner/orchestrator

While preparing the Files Changed table, `git status`/`git log` showed `src/design-system/mantine/theme.ts`
**already committed** — as part of commit `389bf2ae7` (message: `fix(Task531): control-family resting shadow ->
exact TailAdmin shadow-theme-xs`). Diffing that commit against its predecessor (`c4a766672`, the first,
clean Task 531 commit) shows it contains **both** Task 531's `shadows.xs` work **and** this task's `blueLight`
tuple + `Alert` theme block (56 insertions vs. 3 in the first commit). This happened because the owner's
Task 531 commit ran natively **after** this session had already made its Task 532 edits to the same file —
an `git add <path>`/`git commit` on an explicit path stages whatever is currently on disk for that path,
regardless of which task's session is "in progress." **File content is correct and intact** (verified below);
the only issue is the commit **message** under-describes its own diff (says "Task531", actually contains
Task532 theme changes too). No action taken here (executor does not run git) — flagging for the orchestrator/
owner to decide: leave as-is (content is correct, only the message is incomplete) or note the discrepancy in
the ledger. **Practical consequence for this task: `theme.ts` needs NO further commit — it is already on HEAD.**

## Summary

Mantine `Alert` primitive restyled to TailAdmin `/alerts` chrome (§6l) at the theme level: 12px radius (`xl`,
was `lg`/8px), 1px border semantic-500, bg semantic-50, 16px padding, title (the `label` slot) 14/600/gray-800
with a 4px gap to body, body 14/gray-500/20px line-height, icon colored semantic-500. New `blueLight`
5-authoritative-stop color scale added for the `info` variant (§4). New `Mantine/Primitives/Alert` Storybook
story on the Mantine proof path, single `Default` export, 4 variants + close button + icon-less + long-content
cells, fully localized. The 5 legacy `@/components/ui/alert` consumers (`AdminEmailTemplatesManager`,
`AuthSheet` ×4, `ResetPasswordClient`, `CabinetPasswordSection` ×2 + its test) are untouched — confirmed by
grep, they import from `@/components/ui/alert`, not `@mantine/core`.

## Consumer inventory (Current-behavior-to-preserve check)

`grep` for `<Alert` / `@mantine/core` Alert imports across `src` found exactly **one** existing Mantine
`<Alert>` consumer: `src/design-system/mantine/patterns/MantineEmptyLoadingErrorState.tsx:53` —
`<Alert color="red" title={title} variant="light">…</Alert>` (the `error` state of the empty/loading/error
pattern). `color="red"` and `variant="light"` are both still valid props after this change (the theme block
keys off `props.color`, defaulting the `variant` prop itself unchanged); this consumer automatically picks up
the new §6l chrome with zero code changes — verified type-check clean and the pattern's own behavior
(icon/title/children/no `withCloseButton`) is unaffected, only its visual chrome improves.

## Required after-behavior 1 — `blueLight` color scale

Added the EXACT 10-tuple the kickoff specified (no interpolation) — 5 authoritative §4 stops (0/3/4/5/6) +
5 explicitly-commented UNUSED placeholder slots (nearest authoritative stop, not presented as TailAdmin
values) to satisfy Mantine's fixed-length `MantineColorsTuple` type. Registered in `colors: { …, blueLight }`.
`theme.ts` lines 73-94.

## Required after-behavior 2 — Alert theme block

**DOM structure verification (§18 discipline, before writing any style):** read the compiled
`node_modules/@mantine/core/esm/components/Alert/Alert.mjs` source directly (not guessed) — confirmed the
Styles API slots and, critically, that **`title` is the ROW `<div>`** (wraps the label + carries
`data-with-close-button`) while **`label` is the `<span>` that actually holds the title text**. Per the
kickoff's explicit instruction, font/color/margin for the title text were targeted at the `label` slot.

**Root override mechanism verified empirically (Playwright `getComputedStyle`, not asserted):** Mantine's own
`variantColorResolver` computes `--alert-bg`/`--alert-bd` for `variant="light"`; our `styles.root` sets
`backgroundColor`/`borderColor`/`borderWidth`/`borderRadius`/`padding` as literal inline CSS, which **won** over
the CSS-module `:where()` rule with zero fight — measured `rootBg`/`rootBorder` on all four rendered variants
match the exact §6l hex values (see table below). **No scoped `alert-chrome.css` file was needed** — the same
inline-style-wins mechanism already used for Button/Badge/Card in this file worked unmodified for Alert.

| Variant | Measured `rootBg` (computed) | Expected (§6l/§4) | Measured `rootBorder` | Expected |
|---|---|---|---|---|
| success (`green`) | `rgb(236, 253, 243)` | `#ecfdf3` ✅ | `rgb(18, 183, 106)` | `#12b76a` ✅ |
| warning (`yellow`) | `rgb(255, 250, 235)` | `#fffaeb` ✅ | `rgb(247, 144, 9)` | `#f79009` ✅ |
| error (`red`) | `rgb(254, 243, 242)` | `#fef3f2` ✅ | `rgb(240, 68, 56)` | `#f04438` ✅ |
| info (`blueLight`) | `rgb(240, 249, 255)` | `#f0f9ff` ✅ | `rgb(11, 165, 236)` | `#0ba5ec` ✅ |

`rootBorderWidth` = `1px` ✅, `rootRadius` = `12px` ✅, `rootPadding` = `16px` ✅ (all four variants, all
byte-exact to §6l). `label` computed: `display:block` (Mantine's own CSS, not ours), `fontSize:14px`,
`fontWeight:600`, `color:rgb(29, 41, 57)` (`#1d2939` = gray-800 ✅), `marginBottom:4px`. The 4px `label` margin
is **not a no-op**: measured gap from the title row's bottom edge to the message top = 8px (title row
partially, not fully, absorbs the child's margin in its flex layout), and label-to-message = 12px — either
measurement confirms real, non-zero spacing was added by the change, consistent with the kickoff's literal
instruction (marginBottom on `label`, not `title`). No STOP-and-ASK was needed for either trigger condition
(light-variant bg override won cleanly; label vs. title slot semantics were fully resolved via source + DevTools).

`theme.ts` lines 486-521 (`Alert:` block).

## Required after-behavior 3 — story

`src/stories/mantine/primitives/Alert.stories.tsx` — Mantine proof path (`title: 'Mantine/Primitives/Alert'`,
`skipCanvas`, `layout: 'fullscreen'`), single `Default` export, toolbar-driven locale/viewport, no
`globals.locale` pin. Renders: 4 semantic variants (success/warning/error/info) each with icon+title+body, one
`withCloseButton` instance, one icon-less instance, one long-content instance. Every title/body/close-label
string routes through `storyT()` against the new `storybook.mantine.alert_*` keys — caption `<Text>` lines
(technical annotations like "12px radius, 1px border semantic-500…") follow the same established convention
as `Badge.stories.tsx`/`TextInput.stories.tsx` (raw dev-facing technical captions with punctuation are not
"visible user strings" under `check-stories.mjs` Check 10's pure-alpha-words pattern — confirmed the gate
still passes with 0 violations).

## Required after-behavior 4 — i18n

13 new flat keys (`alert_success_title/msg`, `alert_warning_title/msg`, `alert_error_title/msg`,
`alert_info_title/msg`, `alert_close_aria`, `alert_iconless_title/msg`, `alert_long_title/msg`) added to all
four `messages/{sq,en,uk,it}.json` under `storybook.mantine.*`, same key set (`check:i18n` 2062/2062 parity).
Runtime locale switch verified rendered (uk@320/375/390 screenshots below show the Ukrainian strings actually
rendering, not just key-counted).

## Required after-behavior 5 — scope

Only `theme.ts` (`blueLight` + `Alert` block), the new story, the new i18n keys, `docs/backlog.md` +
this session log + its assets were touched. No scoped CSS file was required (root override won via inline
style — see above). No consumer migration, no `alert.tsx` edit — confirmed by `git status` scope below.

## Positive flow verification

1. Success/warning/error/info Alerts render the exact §6l geometry (table above) — confirmed via
   `getComputedStyle` + the rendered screenshot side-by-side with the live TailAdmin `/alerts` reference
   (`docs/sessions/assets/task532/tailadmin-live-alerts.png`, fetched live from `demo.tailadmin.com/alerts`,
   internet access confirmed available this session).
2. All four variants visually match the zip/live reference: rounded border, colored 1px border + tinted bg,
   bold title, lighter body — confirmed at `mantine-primitives-alert--default__en__desktop-1024.png`.
3. `withCloseButton` renders the `×` control top-right; `onClose` wired (no-op handler in the story, matching
   Mantine's own default behavior — clicking it does not crash, the alert simply doesn't auto-dismiss since
   that's the consumer's responsibility, unchanged from stock Mantine).
4. Icon-less Alert renders body flush-left with correct padding, no reserved icon gutter — confirmed in the
   captured cells (`icon-less` section).

## Negative flow verification

- **Empty/absent message:** not separately exercised as a distinct cell (no story instance omits `children`);
  Mantine's own conditional render (`children && <div className={message}>`) means an absent message renders
  no `message` div and no layout collapse — this is Mantine's existing, unmodified behavior, not something
  this task's styling change could regress (verified by reading `Alert.mjs`: the `message` div is conditionally
  rendered independent of our styles callback).
- **Long localized title + body (uk longest):** confirmed wraps, no clip, no h-scroll@320 —
  `mantine-primitives-alert--default__uk__mobile-320.png` and `__mobile-390.png` show full-width wrapped text.
- **`withCloseButton` on mobile:** confirmed present and not overlapping wrapped title in the uk@320/390
  captures (close `×` renders top-right, title wraps below it without collision).
- **Unknown `color`:** not separately exercised as a story cell (would require passing an invalid literal,
  which TypeScript's `MantineColor` prop type already rejects at compile time for any non-registered scale
  name) — the one runtime path where an unregistered color STRING could reach the component (e.g. from
  untyped external data) is not exercised by any current consumer (the sole Mantine Alert consumer hardcodes
  `color="red"`), so this branch is out of reach in the current codebase; documented rather than fabricated.
- **Locale mismatch:** `check:i18n` 2062/2062 parity; runtime switch visually confirmed (uk screenshots show
  actual Ukrainian text, not fallback English).

## Mobile <640 full-width gate (clause 11)

Confirmed at 320/375/390 × sq/en/uk/it (16 gate cells, all `pass:true`, `noHorizontalOverflow:true`) +
independently captured 480px/uk (`scrollWidth === clientWidth === 480`, no h-scroll). Alert container is
full-width edge-to-edge at every mobile width — not a centered/max-width card. Close button renders top-right,
does not clip.

## TailAdmin conformance gate (clause 16)

Every value cited to §6l/§4 (no invented color/px/radius — see `theme.ts` comments). `check:design-tokens:strict`
0 violations (theme.ts's color-tuple literals are the same allowlisted pattern already used for
green/yellow/red). Rendered proof: 16 gate cells (320/375/390/1024 × sq/en/uk/it) + 480px/uk + the live
TailAdmin `/alerts` side-by-side reference — all in `docs/sessions/assets/task532/`.

## Regression coverage (clause 15)

Scanned `docs/critical-flow-registry.md` — this slice changes only the Mantine `Alert` theme chrome + a new
story + story-only i18n keys. Does not touch any registered auth/listing/admin/RLS flow; the auth
reset-password/cabinet-password surfaces keep using the legacy `alert.tsx` (confirmed untouched by `git status`
— `alert.tsx` does not appear in the diff). No new registry row required. The enforced rendered gate (Task 529)
auto-discovers `Mantine/Primitives/Alert` (confirmed: story count went 21→22, cell count 336→352) and asserts
it every CI run — this is the regression coverage for this primitive going forward.

## Planted-violation FAIL transcript (proves the gate is real, not a no-op)

Temporarily set the long-content Alert to `w={900} miw={900} style={{ whiteSpace: 'nowrap' }}` (forces a fixed
900px box + no-wrap, guaranteed horizontal overflow at 320/375/390), rebuilt Storybook, re-ran the gate:

```
npm run screenshots:assert -- --mantine-only
  Results: 336/352 PASS, 12 FAIL, 4 AMBIGUOUS
  ❌ Failed cells (all 4 locales × 320/375/390 = 12):
    Mantine/Primitives/Alert/Default × {sq,en,uk,it} × {mobile-320,mobile-375,mobile-390}
      ✗ horizontal overflow detected
```
Full FAIL manifest: `docs/sessions/assets/task532/planted-violation/fail-transcript-manifest.json`.
Representative FAIL screenshot (uk@320, mandatory stress cell):
`docs/sessions/assets/task532/planted-violation/mantine-primitives-alert--default__uk__mobile-320.png`.

Reverted the planted violation (`git diff` confirms `Alert.stories.tsx` is back to its intended content — no
`w`/`miw`/`style` props on the long-content Alert), rebuilt Storybook clean, re-ran the gate: **348/352 PASS,
0 FAIL, 4 pre-existing AMBIGUOUS** (Tabs scroll-tabs, unrelated) — confirming the working tree is restored to
exactly the intended state.

## Gates (all green, final clean run)

```
npx tsc --noEmit                     → 0 errors
npm run check:stories                → PASSED, 95 files, 0 violations, storybook.* 497/497 parity
npm run check:i18n                   → PASSED, 4 locales, 2062 keys, parity OK
npm run check:mojibake               → 0 artifacts, 1514 files
npm run check:design-tokens:strict   → 0 violations, 388 files scanned
npm run check:file-integrity         → PASSED, 27 files clean
npm run build-storybook              → built in 16.79s (final clean build)
npm run screenshots:assert -- --mantine-only → 348/352 PASS, 0 FAIL, 4 AMBIGUOUS (pre-existing Tabs, unrelated)
```

## AC-by-AC self-audit

| # | AC | Status | Evidence |
|---|----|--------|----------|
| 1 | `blueLight` tuple added from §4, registered in `colors` | ✅ | `theme.ts` L73-94 |
| 2 | `Alert` theme block = §6l chrome via `props.color` styles callback | ✅ | `theme.ts` L486-521; computed-style table above (byte-exact bg/border/radius/padding) |
| 3 | `Alert.stories.tsx` on Mantine proof path, single `Default`, all variants + close + icon-less + long-content, all strings via `storyT()` | ✅ | `src/stories/mantine/primitives/Alert.stories.tsx`; `check:stories` 0 violations |
| 4 | i18n `storybook.mantine.alert_*` in sq/en/uk/it, same key set, runtime-switch verified | ✅ | 4 locale files; `check:i18n` 2062/2062; uk screenshots show rendered Ukrainian text |
| 5 | Mobile <640 full-width + no h-scroll@320 (uk) + wrap | ✅ | 16 gate cells `pass:true`; uk@320/375/390 captures |
| 6 | Rendered side-by-side vs zip `/alerts` for all four variants | ✅ | `tailadmin-live-alerts.png` vs `mantine-primitives-alert--default__en__desktop-1024.png` |
| 7 | Gates green incl. `--mantine-only` PASS + planted-violation FAIL transcript | ✅ | Gates block above; FAIL transcript above |

## File-integrity gate (clause 14)

`check:file-integrity` (git-changed + untracked, default scope) → 27 files clean (0 NUL, no BOM, JSON/`node
--check` clean, not truncated): `messages/{sq,en,uk,it}.json`, `Alert.stories.tsx`, session log + assets.
`theme.ts` was integrity-checked earlier in this session (before it landed on HEAD via the commit described
in the flag above) and was clean at that time too.

## Files Changed

| File | Rationale |
|---|---|
| `src/design-system/mantine/theme.ts` | **Already on HEAD** (commit `389bf2ae7`, mislabeled — see flag above). `blueLight` tuple + `Alert` block. No further commit action needed for this file. |
| `src/stories/mantine/primitives/Alert.stories.tsx` | NEW — Mantine proof-path story, 4 variants + close + icon-less + long-content. |
| `messages/sq.json` · `messages/en.json` · `messages/uk.json` · `messages/it.json` | `storybook.mantine.alert_*` keys (13 keys × 4 locales), same key set. |
| `docs/backlog.md` | Last Session + Sprint 40 status + Task 532 status line updated. |
| `docs/sessions/2026-07-03-task532-alert-conformance.md` | This file. |
| `docs/sessions/assets/task532/*.png` (18 files) + `rendered-proof-manifest.json` | 16 gate cells + 480px cell + live TailAdmin reference. |
| `docs/sessions/assets/task532/planted-violation/*` | FAIL transcript manifest + representative FAIL screenshot. |

**Not touched this task:** `alert.tsx` (legacy shadcn primitive), the 5 legacy consumers, `input-chrome.css`,
any other primitive/theme block, `tailadmin-style-reference.md` (§6l/§4 were already authoritative, no
correction needed this time).

**Reverted, not part of this diff:** `docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md`
(auto-regenerated side effect of the required gate command, restored to HEAD in-session, same as Tasks 530/531).

**Emitting NO `git add`/`git commit`** — no mutating git command was run this session.
