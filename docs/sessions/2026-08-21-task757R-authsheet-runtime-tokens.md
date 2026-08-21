# Task 757R — `AuthSheet`: remove Tailwind runtime-token dependencies, restore `h3` baseline

**Kickoff:** `tasks/Sprints/Sprint_60_kickoff_prompt_Task_757R_authsheet_runtime_tokens.md` · **Sprint:** 60 ·
**QA profile:** `Q4 Release/Critical Flow` · **Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`

## Requirement and acceptance-criteria evidence

| Req/AC | Evidence |
|---|---|
| R1 (AC1) | `AuthSheet.tsx:225,654` — `style={{ lineHeight: '1.75rem' }}` replaced with `lh={1.25}`. No inline `style` object for line-height on either site. Runtime-module proof: `node_modules/@mantine/core/cjs/.../line-height-resolver.cjs` — `lineHeightResolver(1.25, {})` returns `1.25` (number passthrough, unitless), confirmed by direct `require()` + call in this session. `theme.ts:224` `fontSizes.lg = '1.125rem'` = 18px. 18 × 1.25 = **22.5px**, unitless. Live DOM capture of the two success states is **owner-native** (see below) — this project's Turnstile site key is a real production key, unreachable headlessly (standing constraint, D757-3). |
| R2 (AC2, AC3, AC6) | All 8 `var(--default-transition-timing-function)` / `var(--default-transition-duration)` declarations in `AuthSheet.module.css` (`.linkMutedXs`, `.linkMutedSm`, `.agentBackLink`, `.linkPrimarySm` × 2 each) replaced with literals `cubic-bezier(0.4, 0, 0.2, 1)` / `150ms`. The 4 `transition-duration` declarations carry a `design-tokens-allow: transition-duration: 150ms — …` marker (the only one of the two properties the scanner's `css-duration` pattern actually detects — see "Deviation on marker placement" below). Live `getComputedStyle` probe on all four classes, before (`var()` form) and after (literal form): both report `transitionDuration: "0.15s"`, `transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)"`, `transitionProperty` unchanged — byte-identical. `transition-property` untouched (7 entries, per D757-7). |
| R3 | Module header comment (`AuthSheet.module.css:14-21`) rewritten to describe the literal-value technique instead of the runtime-token technique it replaces. |
| AC3 | `grep -n -- "--tw-\|--default-transition" src/modules/auth/components/AuthSheet.tsx src/modules/auth/components/AuthSheet.module.css` — **empty result**, confirmed twice (immediately after the edit and again against the final restored state after the before/after rebuild cycle described below). |
| AC4 | See "Negative-flow applicability" below — the task's own citation (`globals.css:727-735` as "`prefers-reduced-motion`") does not match the code; corrected finding recorded there. |
| AC5 | 78-cell rendered geometry matrix, same capture script run twice (once against the byte-reverted pre-757R code, once against the corrected code) — **0 diffs across all 78 cells**. See "78-cell matrix" below. |
| AC6 | All listed gates run; results in "Validation evidence". |
| AC7 | `node scripts/check-locale-leak.mjs` executed: **`EXIT_CODE=1`, 328 leaks / 46 story titles, full repo.** The **`AuthSheet` share is unchanged** — 6 leaks, 2 story titles (`Patterns/Mantine/AuthSheet/Login`, `Patterns/Mantine/AuthSheet/Login Validation Error`), each `[sq]`/`[uk]`/`[it]` "Google" — identical to Task 757's own D757-4a baseline (pre-existing, unrelated to this diff; the Google OAuth button is unimplemented, per D757-6). **The repo-wide total moved 327 → 328 — this is a real, recorded delta, not "unchanged."** This diff touches only `AuthSheet.tsx`/`AuthSheet.module.css` and cannot itself produce a new finding in one of the other 44 story titles; Task 757's own per-story attribution table is category-level, not granular enough to name which non-`AuthSheet` story gained the +1. **No locale leak newly introduced by *this* diff's own attributable share** (still 6/2, byte-identical); the +1 is unattributed drift elsewhere in the repo since Task 757. Full transcript retained. |
| AC8 | `git status --porcelain` on all five named sibling modules — **no output** (untouched). |

## Current versus required behavior

- **Before:** success-title `h3` computed `line-height: 28px` (Task 757's authorized-then-withdrawn `1.75rem`); the four hover-link classes' `transition-timing-function`/`transition-duration` referenced `var(--default-transition-timing-function)` / `var(--default-transition-duration)` — Tailwind-internal theme variables that resolve to nothing once Tailwind is removed from the project.
- **After:** success-title `h3` computes `line-height: 22.5px`, unitless, via Mantine's own `lh` style prop (`fontSizes.lg` × `1.25`) — the true pre-757 (pre-migration) render. The four hover-link classes use literal `150ms` / `cubic-bezier(0.4, 0, 0.2, 1)`, matching Tailwind's compiled defaults exactly, with no dependency on any Tailwind or `@theme inline` runtime token.
- **Negative flow — `prefers-reduced-motion`:** the kickoff's applicability table cites `globals.css:727-735` as the `prefers-reduced-motion` override. **Correction, verified this session:** that block is gated by `[data-perf-tier="low"] [class*="transition-"]` — a JS-driven performance-tier attribute (`src/lib/performance/store.ts`), not an `@media (prefers-reduced-motion: reduce)` rule. `grep -rn "prefers-reduced-motion" src` finds real `@media (prefers-reduced-motion: reduce)` blocks only in `MantineListingCardPattern.module.css` and `skeleton-chrome.css` — none touches `AuthSheet.module.css` or `globals.css`. Live probes (both `reducedMotion: 'reduce'` browser-context emulation and `document.documentElement.setAttribute('data-perf-tier','low')`) confirm **neither mechanism currently overrides these four classes' transitions**, in the before state or the after state — the `[class*="transition-"]` selector does not match CSS-Modules hashed class names (e.g. `AuthSheet_linkMutedXs__16cmi`), a condition that predates this task (introduced when Task 757 first moved these buttons off literal Tailwind utility classNames). **This is unchanged by 757R** — same non-match, same computed values, before and after — so AC4's "remains overridable exactly as before" holds trivially (no regression), but the override does not actually function for these elements today. Out of scope for 757R (no code named in R1/R2/R3 touches selectors or class names); flagged here as a factual correction to the kickoff's citation, not fixed.

## Files Changed

| File | Reason |
|---|---|
| `src/modules/auth/components/AuthSheet.tsx` | R1 — two success-title `h3` sites: `style={{ lineHeight: '1.75rem' }}` → `lh={1.25}`. |
| `src/modules/auth/components/AuthSheet.module.css` | R2/R3 — 8 `var(--default-transition-*)` declarations → literals with markers; header comment rewritten. |
| `docs/sessions/evidence/task757R/*` (new) | AC5 78-cell matrix (before/after) + AC2/AC4 computed-style probes (before/after). |
| `docs/sessions/2026-08-21-task757R-authsheet-runtime-tokens.md` (new) | This session log. |
| `docs/backlog.md` | Concise state update. |

## Validation evidence

| Command | Result |
|---|---|
| `npx tsc --noEmit` | exit 0 |
| `npm run check:design-tokens -- --strict` | 0 violations, 0 stale-marker(s), 0 missing-reason error(s), exit 0 (re-run against the final restored state) |
| `npm run check:i18n` | 2218 keys × 4 locales, parity PASSED, exit 0 |
| `npm run check:story-coverage` | 18/18 covered, exit 0 |
| `npm run check:stories` | 129 files, 0 violations, exit 0 |
| `npm run build-storybook` | built, exit 0 |
| `npm run build` (final/corrected code) | 40/40 pages, exit 0 |
| `npm run test:auth` | 28/28 passed, exit 0 (re-run against the final restored state) |
| `grep -n -- "--tw-\|--default-transition" AuthSheet.tsx AuthSheet.module.css` | empty result (confirmed twice) |
| `node scripts/check-locale-leak.mjs` | `EXIT_CODE=1`, 328 leaks / 46 story titles repo-wide (Task 757's own baseline: 327/46). **`AuthSheet`'s own share (6 leaks / 2 story titles, "Google" × sq/uk/it) is unchanged; the total's 327→328 delta is unattributed drift in a non-`AuthSheet` story, recorded as a fact, not described as unchanged.** Log: `docs/sessions/evidence/task757R/check-locale-leak-full-2026-08-21.log` |

### 78-cell matrix (AC5)

Task 757's own `50d18411f` diff against this session's starting `HEAD` for `AuthSheet.tsx`/`AuthSheet.module.css` is
**empty** (`git diff 50d18411f HEAD -- <both files>` → no output) — so the pre-757R working tree is byte-identical to
commit `50d18411f`, and reusing Task 757's own after-capture as a before-baseline would only be valid if captured by
the *same* script (Task 757's original capture script was deleted per its own session-log convention, and reusing its
JSON output directly against a differently-written script produced one cross-script selector artifact on
`addcompany-panel`'s `panelBox`, analogous to the documented `orLabelStyle:null` artifact from Task 757 itself — not
trustworthy as a same-script comparison).

**Rigorous approach taken instead:** one capture script (`scripts/_tmp-task757R-matrix.mjs`, one-off tooling, deleted
before handoff per the same convention Task 757 used), run twice against the *same* running app, same selectors, same
schema (login/login-error/forgot-password/register/register-agent/addcompany-panel × 4 locales@{320,1440} +
en@{375,390,480,768,1024} = 78 cells):

1. Temporarily reverted `AuthSheet.tsx`/`AuthSheet.module.css` to their exact pre-757R content (`git diff` against
   `HEAD` empty — confirmed byte-identical to `50d18411f`), rebuilt (`npm run build`, exit 0), restarted `next start`,
   captured 78 cells → `ac3-full-matrix-before.json`.
2. Restored the corrected content, rebuilt (`npm run build`, exit 0), restarted `next start`, captured the identical
   78 cells → `ac3-full-matrix-after.json`.
3. Programmatic diff: **0 differences across all 78 cells.**

This is the expected, structurally guaranteed result: `transition-timing-function`/`transition-duration` are
paint/animation-timing properties with no effect on box geometry, and the two `h3` sites are in states this matrix
does not visit (`forgot_password_success`/`register_success` are excluded from the 78-cell set, same as Task 757's
own matrix). Evidence: `docs/sessions/evidence/task757R/ac3-full-matrix-before.json`,
`ac3-full-matrix-after.json`.

### AC1/AC2/AC4 computed-style evidence

- **AC1 (h3 line-height, owner-native):** the two success states are reachable only through a real, non-bypassable
  Turnstile captcha (D757-3, standing constraint — confirmed still true this session, no test-mode key present).
  Owner-native probe to run after reaching either success state:
  ```js
  const h3 = document.querySelector('h3')
  const cs = getComputedStyle(h3)
  console.log({ lineHeight: cs.lineHeight, letterSpacing: cs.letterSpacing, fontWeight: cs.fontWeight })
  // Expected: { lineHeight: "22.5px", letterSpacing: "-0.45px" /* -0.025em × 18px */, fontWeight: "600" }
  ```
  Supporting non-live evidence: `lineHeightResolver(1.25, {})` (the actual installed Mantine resolver, invoked
  directly in this session) returns the number `1.25` unchanged; `theme.ts:224` sets `fontSizes.lg = 1.125rem` (18px).
  18 × 1.25 = 22.5px, unitless — matches the required after-behavior exactly.
- **AC2 (link transitions):** `docs/sessions/evidence/task757R/ac2-ac4-before-computed.json` /
  `ac2-ac4-after-computed.json` — all four classes (`linkMutedXs`, `linkPrimarySm`, `agentBackLink`, `linkMutedSm`),
  before and after: `transitionDuration: "0.15s"`, `transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)"`,
  `transitionProperty` unchanged. Byte-identical before/after.
- **AC4 (`prefers-reduced-motion`):** see "Negative-flow applicability" correction above. Both the real emulated
  media feature and the actual `[data-perf-tier="low"]` mechanism were probed live, before and after — identical,
  unchanged result in both states (neither overrides these four classes' transitions today; pre-existing, out of
  757R's scope).

## Visual source trace

| Visible artifact/state | Component/markup | Class/selector | Utility, cascade, and token path | Change or preserve | Evidence |
|---|---|---|---|---|---|
| Success-title `h3` (×2) | `Text component="h3"` | inline style prop → `lh` style prop | Mantine `line-height-resolver.cjs` × `theme.ts` `fontSizes.lg` | **change** (28px → 22.5px, D757-2b) | Runtime-module call + `theme.ts:224`, this session |
| 4 hover-link classes' transition timing | `AuthSheet.module.css` | `.linkMutedXs` / `.linkMutedSm` / `.agentBackLink` / `.linkPrimarySm` | `var(--default-transition-*)` → literal | **change** (mechanism only, same computed value) | `ac2-ac4-*-computed.json`, this session |
| `transition-property` (7 entries) | same 4 classes | same | unchanged | **preserve** | `git diff` shows no change to this line |
| All other `AuthSheet` geometry (login/login-error/forgot-password/register/register-agent/addcompany-panel) | — | — | — | **preserve** | `ac3-full-matrix-{before,after}.json`, 0 diff |
| 5 sibling modules (§6 of kickoff) | — | — | — | **out of scope, untouched** | `git status --porcelain`, no output |

## Canonical UI decision record

| Visible artifact | Search queries and inspected paths | Canonical story/source | Disposition | Required implementation |
|---|---|---|---|---|
| Success-title `h3` (×2) | `theme.ts` `fontSizes`/`headings`; Mantine `line-height-resolver.cjs` (invoked directly this session); `Patterns/Mantine/AuthSheet` Story (unchanged — no hardcoded line-height value in the story file) | Mantine `Text` style prop `lh` | `reuse` | `lh={1.25}` on both sites; no new shared source |
| Hover-link transition timing (4 classes) | `globals.css` `@theme inline` block; `.next/static/css/*.css` grep (no `ease-standard`/`duration-base` match); `grep -rn ease-standard src/` | Verified absent at runtime (per task's own decision record, row 2) | `create local literal` | Literal `150ms` / `cubic-bezier(0.4, 0, 0.2, 1)`, `design-tokens-allow` marker on the one property the scanner actually detects |

## Implementation validation notes

- **Deviation on `design-tokens-allow` marker placement (R2 wording vs. verified scanner behavior).** R2 asks for a
  marker on each of the 8 declarations. `scripts/check-design-tokens.mjs`'s `css-duration` pattern only matches a
  bare `property: <N>ms|s` token — it does not match `cubic-bezier(...)` (unitless function arguments, no px/rem/em/
  ms/s suffix). Adding a `design-tokens-allow:` marker to a value the scanner does not detect is itself a violation
  (`stale-marker`, blocking in `--strict`) per the scanner's own documented contract (`scripts/check-design-tokens.mjs:44-56`).
  Verified empirically: a marker on the `transition-timing-function` line produced a real `stale-marker` finding;
  removing it and keeping a plain (non-`design-tokens-allow`) descriptive comment instead produced `0 violations, 0
  stale-marker(s)`, exit 0. **Applied:** the 4 `transition-duration: 150ms` declarations carry a real
  `design-tokens-allow` marker (the scanner detects them); the 4 `transition-timing-function: cubic-bezier(...)`
  declarations carry a plain provenance comment instead (same content/reasoning, no `design-tokens-allow:` string).
  R2's intent — documented provenance for both values — is met; the literal marker mechanism could not be applied to
  the timing-function value without breaking AC6's `check:design-tokens -- --strict` gate.
- **AC3's literal-string requirement caught a second issue:** the header-comment rewrite initially still contained the
  literal substrings `--default-transition-timing-function` / `--default-transition-duration` / `--default-transition-*`
  in prose explaining what NOT to use. `grep -n -- "--tw-\|--default-transition"` matches comment text exactly like
  code, so AC3 required rephrasing the prose to avoid the literal token names entirely (describing them by function
  instead — "a Tailwind runtime theme variable" — rather than by name). Fixed; verified with a second empty-result
  grep.
- **Negative-flow applicability correction (AC4):** see above — the kickoff's citation of `globals.css:727-735` as a
  `prefers-reduced-motion` mechanism does not match the code (`[data-perf-tier="low"]`, not `@media
  (prefers-reduced-motion: reduce)`). Recorded as a factual correction; not fixed (out of scope — no code named by
  R1/R2/R3 touches this).

## Assumptions, deviations, and limitations

- AC1's live DOM capture of the two success states remains **owner-native** — same standing blocker as Task 757
  (D757-3): the project's Turnstile site key is a real production key, unreachable by a headless browser. Non-live
  (runtime-module + theme-value) proof is provided instead, per the task's own instruction to supply "the exact
  `getComputedStyle` snippet and the expected values" for this criterion.
- `check:locale-leak`'s full-mode run took roughly 45 minutes (281 stories × 3 locales × 3 viewports); it was run to
  completion this session (not skipped, not inferred from Task 757's prior run) — `EXIT_CODE=1`, 328/46, 6
  AuthSheet-attributable, per D757-4a's "executed and its raw exit code recorded" wording.
- One-off evidence-capture tooling (`scripts/_tmp-task757R-matrix.mjs`, `scripts/_tmp-task757R-ac4.mjs`) deleted
  before this handoff, same convention as Task 757's own `scripts/_tmp-task757-*.mjs`.

## Opus handoff

Evidence: `docs/sessions/evidence/task757R/` (4 JSON files: 78-cell before/after matrix, AC2/AC4 computed-style
before/after). Ledger supersession per the kickoff's "Review consequences" section is Opus's action, not
self-performed here. No mutating git run; no commit/push suggested.

## Backlog update

See `docs/backlog.md` "Last Session" and the 757R registry row, updated to reflect this implementation.

Status: **`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`**

---

# Revision 1 — remediation, 2026-08-21

Re-entry mode `remediation`, per the orchestrator review. R1, R2, R3, AC2, AC3, AC5, AC8 were reproduced
independently by the reviewer and are not redone. Only R4/R5/R6 and their acceptance criteria below are new work.

## Preserved-artifact integrity (required proof)

Both baseline artifacts named as preserved were hashed before any Revision 1 edit and re-hashed after all Revision 1
work completed:

| Artifact | Hash before Revision 1 | Hash after Revision 1 |
|---|---|---|
| `docs/sessions/evidence/task757R/ac3-full-matrix-before.json` | `fb50ba49fe7dd8278f6821240c9c6be32a522952` | `fb50ba49fe7dd8278f6821240c9c6be32a522952` |
| `docs/sessions/evidence/task757R/ac2-ac4-before-computed.json` | `969f579fa49744d19973e604e86d89120c0b3fb1` | `969f579fa49744d19973e604e86d89120c0b3fb1` |

Byte-identical. Neither was regenerated. No mutating Git (`checkout`/`stash`/etc.) was used anywhere in this
revision — only read-only `git diff`/`git status`/`git hash-object`.

## R4 (P2) — degraded-perf-tier guard restored

`AuthSheet.module.css` (end of the `@layer utilities` block, after `.logoPlaceholder`):

```css
[data-perf-tier="low"] .linkMutedXs,
[data-perf-tier="low"] .linkMutedSm,
[data-perf-tier="low"] .agentBackLink,
[data-perf-tier="low"] .linkPrimarySm {
  transition-duration: 0ms;
}
```

Scoped to exactly the four named classes. `transition-property`/`transition-timing-function` untouched.
`globals.css` untouched (shared file, out of scope, per the revision's own instruction).

**AC9 — emitted selector, quoted verbatim from `.next/static/css/*.css`** (`142715b411e4301f.css`, `grep -o
'data-perf-tier=low[^{]*{[^}]*}'`):

```
[data-perf-tier=low] .AuthSheet_agentBackLink__xBeZM,[data-perf-tier=low] .AuthSheet_linkMutedSm__as6gS,[data-perf-tier=low] .AuthSheet_linkMutedXs__16cmi,[data-perf-tier=low] .AuthSheet_linkPrimarySm__SSzA5{transition-duration:0s}
```

CSS Modules emitted the plain (non-`:global`) compound selector unmodified — the four local class tokens were
hashed exactly as in every other rule in this file, combined with the literal `[data-perf-tier=low]` ancestor
selector as written. No `:global(...)` wrapper was needed; confirmed by direct inspection of the built output, not
assumed.

**AC4 (revised) — live computed-style probe, both attribute states, all four classes**
(`docs/sessions/evidence/task757R/ac2-ac4-r1-after-computed.json`):

| Class | Normal (`transitionDuration`) | `data-perf-tier="low"` (`transitionDuration`) | `transitionTimingFunction` (both states) |
|---|---|---|---|
| `linkMutedXs` | `0.15s` | `0s` | `cubic-bezier(0.4, 0, 0.2, 1)` (unchanged) |
| `linkPrimarySm` | `0.15s` | `0s` | `cubic-bezier(0.4, 0, 0.2, 1)` (unchanged) |
| `agentBackLink` | `0.15s` | `0s` | `cubic-bezier(0.4, 0, 0.2, 1)` (unchanged) |
| `linkMutedSm` | `0.15s` | `0s` | `cubic-bezier(0.4, 0, 0.2, 1)` (unchanged) |

Only `transition-duration` changes between states, on all four classes — `transition-timing-function` and
`transition-property` (verified in the same capture) are untouched by the guard, exactly as required.

**AC5 (re-stated) — re-captured `ac3-full-matrix-after.json` only, diffed against the preserved
`ac3-full-matrix-before.json`:** **0 differences across all 78 cells.** The guard is inert at the default tier (no
`data-perf-tier` attribute is set during this matrix's capture), so its addition changes no geometry — matching the
revision's own expected result exactly. Diff computed programmatically (`JSON.stringify` per-cell comparison), not
by file size or count.

## R5 (P3) — locale-leak attribution corrected

The original report's "unchanged from Task 757's own baseline" sentence has been rewritten in both places it
appeared (the AC7 evidence row and the Validation-evidence table row, above) to state the real fact: the
`AuthSheet`-attributable share (6 leaks / 2 story titles) is unchanged, but the repo-wide total moved **327 → 328**.
This diff touches only `AuthSheet.tsx`/`AuthSheet.module.css` and cannot itself have produced the new finding;
Task 757's per-story attribution table is category-level and does not name which of the other 44 story titles
gained it. `check:locale-leak` was **not** re-run this revision — no story or string changed since the prior run
(R4/R5/R6 are CSS/comment-only) — the existing transcript (`check-locale-leak-full-2026-08-21.log`, `EXIT_CODE=1`,
328/46) is re-stated, not re-executed, per the revision's own "may be re-stated ... if no story or string changed"
allowance.

## R6 (P3) — module header quotations corrected

`AuthSheet.module.css`'s header comment (previously eliding the compiled `.text-xs`/`.text-sm` rules to bare
`1rem`/`1.25rem`, the same style of elision that produced the Task 757 round-2 `h3` defect) now describes the real
compiled shape — a fallback read of a Tailwind-internal, non-inheriting custom property that gates the `h1..h6`
rule discussed in the kickoff §1 — and states why the literal fallback value is nonetheless correct on these bare
`<button>` elements (the property is never set anywhere in this tree, confirmed via the built CSS's own `@property
… inherits:false` declaration).

**Deviation, recorded explicitly:** R6's literal instruction ("Correct both quotations") would, if followed by
literally reproducing `var(--tw-leading, …)` in the comment, reintroduce the substring `--tw-` into the file —
directly breaking AC3 (`grep -n -- "--tw-\|--default-transition"` must return zero matches), which this same
revision's "Accepted and closed — do not redo" section explicitly reconfirms as already independently reproduced by
the reviewer. Resolved by describing the same fact (real compiled shape, non-inheriting custom property, unset in
this tree, so the literal fallback is correct) without literally spelling out the token name — verified AC3 still
returns an empty grep result after this edit (re-run, confirmed empty a second time this revision).

## Re-run validation (CSS changed)

| Command | Result |
|---|---|
| `npx tsc --noEmit` | exit 0 |
| `npm run check:design-tokens -- --strict` | 0 violations, 0 stale-marker(s), 0 missing-reason error(s), exit 0 |
| `npm run build` | 40/40 pages, exit 0 |
| `npm run build-storybook` | built, exit 0 |
| `npm run check:stories` | 129 files, 0 violations, exit 0 |
| `npm run test:auth` | 28/28 passed, exit 0 |
| `grep -n -- "--tw-\|--default-transition" AuthSheet.tsx AuthSheet.module.css` | empty result (re-confirmed after the R6 edit) |
| AC5 after-capture vs. preserved before-baseline | 0/78 diffs |
| AC2/AC4 after-capture (normal + degraded-tier, all 4 classes) | `docs/sessions/evidence/task757R/ac2-ac4-r1-after-computed.json` |

**Not re-run, per the revision's own allowance (no story or string changed):** `check:i18n` (prior result: 2218 keys
× 4 locales, parity PASSED, exit 0 — unaffected, no string touched), `check:story-coverage` (prior result: 18/18,
exit 0 — unaffected, no story touched), `check:locale-leak` (prior transcript re-stated with the corrected 327→328
wording above, not re-executed).

## Files changed (Revision 1 delta)

| File | Reason |
|---|---|
| `src/modules/auth/components/AuthSheet.module.css` | R4 — degraded-perf-tier guard added; R6 — header comment quotations corrected. |
| `docs/sessions/evidence/task757R/ac3-full-matrix-after.json` | AC5 re-capture (overwritten, as expected/authorized). |
| `docs/sessions/evidence/task757R/ac2-ac4-r1-after-computed.json` (new) | AC4/AC9 degraded-tier + normal-state probe, both attribute states, all 4 classes. |
| `docs/sessions/2026-08-21-task757R-authsheet-runtime-tokens.md` | R5 — locale-leak wording corrected in the original report; this Revision 1 section added. |

`ac3-full-matrix-before.json` and `ac2-ac4-before-computed.json` were **not** modified — see the hash table above.

## Assumptions, deviations, and limitations (Revision 1)

- The R6/AC3 conflict above is the one substantive judgment call this revision made; resolved in AC3's favor since
  the revision itself reconfirms AC3 as closed, and the underlying fact R6 asks for is fully conveyed without the
  literal token string.
- One-off probe tooling (`scripts/_tmp-task757R-matrix.mjs`, `scripts/_tmp-task757R-r1-probe.mjs`) deleted before
  this handoff, same convention as before.

Status: **`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`**
