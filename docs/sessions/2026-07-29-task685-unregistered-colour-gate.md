# Task 685 — Unregistered Mantine colour gate (Check 15) + the two `color="blue"` sites

**Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`

**Kickoff:** `tasks/kickoff_prompt_Task_685_Unregistered_Mantine_Colour_Gate_And_Blue_Fix.md`

## 1. Task path and status

Executed from the saved kickoff under `.claude/skills/execute-task/SKILL.md`. Status:
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. One finding (§7 PNG-md5 outside-scope delta) is flagged for the
orchestrator, not self-waived — see §9.

## 2. Start/end worktree snapshot

**Start (I0):** `git status --porcelain` → empty. `git log -1 --oneline` →
`afb6876b1 docs(Task685): unregistered Mantine colour gate kickoff, 686 reserved for the orange audit`, which sits
directly on top of `081c03e7f fix(Task684): offset Mantine notifications to clear the sticky site header` (confirmed
via `git log --oneline -5`) — the docs-only commit that filed this kickoff, consistent with A5's clean-start
requirement (git status was empty, not the commit subject).

**End (true final, taken after the session log + backlog edit exist):**

```
 M docs/backlog.md
 M scripts/__tests__/check-stories.test.ts
 M scripts/check-stories.mjs
 M src/design-system/mantine/patterns/MantineNotificationPattern.tsx
 M src/stories/patterns/mantine/AdminSurfacePattern.stories.tsx
?? docs/sessions/2026-07-29-task685-unregistered-colour-gate.md
```

## 3. Requirement and acceptance-criteria evidence

| Req | AC | Evidence |
|---|---|---|
| R1 | AC1 | `runGate` returns `checksRan: 15` (`scripts/check-stories.mjs`, return statement). `npm run check:stories` prints 15 check headers (`── Check 1 ──` … `── Check 15 ──`) and `✅ check:stories PASSED — 127 files checked, 0 violations.`, exit 0. `storyFilesCount` unchanged at 127 (§6 transcript). |
| R2 | AC2 | Check 15's `COLOR_SCOPE_FILES` is exactly `collectFiles(src/stories/mantine)` + `collectFiles(src/stories/patterns/mantine)` + `collectFiles(src/design-system/mantine/patterns)` — `src/stories/patterns/mantine/` is present (code quoted in §4). |
| R3 | AC3 | `loadRegisteredColorNames()` reads `src/design-system/mantine/theme.ts` at runtime, regex-extracts the `colors: { … }` object's identifier keys (`brand, gray, green, yellow, red, blueLight, purple, sale`) — no literal array. If a 9th colour were added to `theme.ts:139` tomorrow, the next `check:stories` run picks it up with zero script edit (mechanism: same regex, no code path keyed to a fixed count). |
| R4 | AC4 | Post-fix run: 0 violations across the 3 scope dirs. Manual survey (`grep -rhoE '\b(color\|c\|bg)="[^"]+"' <3 dirs>`) found 365 raw occurrences (4 inside comments, correctly skipped by the `isComment` guard — see §5) across all four §3.7 legal classes; all pass. |
| R5 | AC5 | **First and only observed count was exactly 2**, at the two documented sites, on the first run — no adjustment was needed (A1). Transcript in §6. |
| R6 | AC6 | Synthetic `color="cyan"` plant on `MantineNotificationPattern.tsx:67` (the success Button) → exit 1 naming line 67; reverted → exit 0. `git diff` on the file after revert shows only the intended `blue`→`blueLight` change at line 81 (§6, §8). |
| R7 | AC7 | Both sites now read `color="blueLight"`. `grep -rn 'color="blue"' src/` → 0 hits (verified, see §6). No other prop/attribute changed on either line (diffs in §4 are single-token). |
| R8 | AC8 | `--mantine-only`: 0 FAIL, 22 AMBIGUOUS (unchanged from baseline), **0 verdict changes** across all 1184 cells. PNG-md5: 28/32 target cells changed, 4 unchanged-with-reason (AdminSurfacePattern desktop-1024 × 4 locales — Badge/meta rows only render in the <640 card layout, confirmed in source). **84 cells changed outside the two target stories** — flagged, not self-waived; see §9. Full table in §7. |
| R9 | AC9 | `npm run build` exit 0, 40/40 static pages, route table quoted in §6. |
| R10 | AC10 | `check:i18n` 0, 2215×4, 0 new keys. `check:design-tokens` 44/0-stale, 0 in any of the 5 touched files (grep-verified). `check:file-integrity`/`check:mojibake` run after I7 (session log + backlog present in the scanned set) — both 0 (§6). |
| R11 | AC11 | `git status --porcelain` (§2) does not list `AdminUsersTable.tsx`. `grep -rn 'orange' src/components/admin/AdminUsersTable.tsx` still returns the same 3 §3.2 hits, unchanged (§6). |

## 4. Current versus required behavior

**Current (pre-task):** `check:stories` ran 14 checks over 127 files, 0 violations; no check inspected Mantine
colour-prop *names*, so `color="blue"` at `MantineNotificationPattern.tsx:81` (info-trigger Button, `filled`
variant) and `AdminSurfacePattern.stories.tsx:79` (role Badge, `variant="light"`) passed silently and rendered
Mantine's stock `blue[7]` = `#1c7ed6` (§3.3 of the kickoff, confirmed by reading the installed
`merge-mantine-theme.mjs`/`default-colors.mjs`).

**Required after (implemented):** `check:stories` runs 15 checks over the same 127 files. Check 15 fails on any
`color`/`c`/`bg` prop naming a colour absent from `theme.ts`'s registered set, scoped to
`src/stories/mantine/` + `src/stories/patterns/mantine/` + `src/design-system/mantine/patterns/`, with 0 false
positives across the four legal value classes (registered bare, registered `.0`–`.9` shaded, Mantine keyword,
`var()`/`#`/`rgb`/`hsl` passthrough). Both sites now read `blueLight`, rendering `#0086c9`. The three `orange` sites
in `AdminUsersTable.tsx` are untouched and outside the gate's scope (reserved for Task 686, D7).

**Applicable negative flows (from the kickoff's §11 table), verified:**
- Registered dot-shaded colour (`c="gray.5"` ×177 etc.) — passes (§4 code, §6 post-fix 0-violation run).
- Mantine keyword (`c="dimmed"`, `c="white"`) — passes; confirmed against Mantine's own
  `parse-theme-color.mjs` source, which resolves exactly `bright`/`dimmed`/`white`/`black` outside `theme.colors`
  (read directly from `node_modules/@mantine/core/esm/core/MantineProvider/color-functions/parse-theme-color/parse-theme-color.mjs`).
- CSS-var passthrough (`c="var(--muted-foreground)"`) — passes (`^(var\(|#|rgb|hsl)` prefix check).
- Multi-line opening tag (site 1, `<Button` spanning 5 lines with `color="blue"` on its own line) — found
  correctly at line 81; Check 15 scans every non-comment line directly rather than gating on tag-name membership
  (see §5 for why this is equivalent to Check 14's block-collection technique here).
- Colour prop in a comment — 4 real instances found in the scope dirs (`MantineCombobox.tsx:161`,
  `MantineCountButton.tsx:44`, `MantineFilterSection.tsx:27`, `MantineListingDetailPattern.tsx:56`), all skipped by
  the `isComment` guard (verified none reported as violations).
- Out-of-scope file with a real violation (`AdminUsersTable.tsx` `orange` ×3) — confirmed NOT reported by Check 15
  (scope excludes `src/components/`); R11 holds.
- Colour added/removed from `theme.ts` — R3 evidence above.
- Zero-violation post-fix tree — exit 0, `checksRan: 15`, 127 files, header printed (confirms no silent no-op).
- Small viewport for the visual delta — the 32 target cells span 320/375/390/1024 × sq/en/uk/it (§7).
- Validation/RLS, offline/network, locale expansion, RTL — not applicable (build-time script + 2 prop values, no
  data path, no new string, no RTL locale in the project).

## 5. Check 15 implementation rationale

- **Registered-set derivation (R3/A2):** `loadRegisteredColorNames()` reads `theme.ts`, matches
  `/colors:\s*\{([^}]*)\}/s` (confirmed via `grep -n "colors:" theme.ts` that this key appears exactly once in the
  file, so the regex cannot latch onto the wrong object), then splits on `,` and takes the identifier before any
  `:` — handling both the actual shorthand form (`{ brand, gray, … }`) and an explicit-key form, should the file
  ever be rewritten that way. No literal colour-name array exists anywhere in the check.
- **Four legal value classes (R4/§3.7):** `isRegisteredColorValue(value)` checks, in order: Mantine keyword set
  (`dimmed`/`bright`/`white`/`black`, sourced from Mantine's own `parse-theme-color.mjs`, not guessed); a
  `var(`/`#`/`rgb`/`hsl` prefix; then splits on `.` and requires the base name to be in the registered set (shade
  suffix, if present, must be a single digit `0`–`9`).
- **Multi-line tags (I2.3):** unlike Check 14 (which must scope to `<Button` specifically and therefore needs to
  collect the tag's full text block to find a prop that might be several lines below the tag's own start), Check 15
  intentionally applies to *any* Mantine element carrying `color`/`c`/`bg`. Since every real occurrence in the
  codebase is a self-contained `attr="value"` token that never itself spans multiple lines (confirmed by the
  survey — the wrapped-tag case at site 1 still has `color="blue"` complete on its own single line), a direct
  line-by-line scan with the same `isComment` guard as Check 14 finds every occurrence, including the wrapped
  `<Button>` at site 1, without needing tag-block correlation. This was verified empirically: Check 15 found line 81
  correctly on the very first run.

## 6. Validation evidence — commands, actual outcomes

**I1 — before Check 15 exists (baseline):**
```
✅ check:stories PASSED — 127 files checked, 0 violations.
```
(14 checks ran; confirmed by the printed `── Check 1 ──` … `── Check 14 ──` headers.)

**I2 — Check 15 added, run BEFORE the source fix (natural planted-violation proof, AC5):**
```
❌ check:stories FAILED — 2 violation(s):

  src/stories/patterns/mantine/AdminSurfacePattern.stories.tsx:79  [unregistered-mantine-colour]
    color="blue" names a colour absent from theme.ts's registered set (brand, gray, green, yellow, red, blueLight, purple, sale). ...
  src/design-system/mantine/patterns/MantineNotificationPattern.tsx:81  [unregistered-mantine-colour]
    color="blue" names a colour absent from theme.ts's registered set (brand, gray, green, yellow, red, blueLight, purple, sale). ...
```
Exit 1. **First observed count: 2 — matched the expected count exactly; no adjustment to the check was made (A1).**

**I3 — after fixing both sites:**
```
✅ check:stories PASSED — 127 files checked, 0 violations.
```
(15 checks ran.) Exit 0.

**I4 — synthetic plant (`color="cyan"` on the success Button, `MantineNotificationPattern.tsx:67`):**
```
❌ check:stories FAILED — 1 violation(s):

  src/design-system/mantine/patterns/MantineNotificationPattern.tsx:67  [unregistered-mantine-colour]
    color="cyan" names a colour absent from theme.ts's registered set ...
```
Exit 1. After revert:
```
✅ check:stories PASSED — 127 files checked, 0 violations.
```
Exit 0. `git diff` on the file post-revert shows only the intended `blue`→`blueLight` change at line 81 (§8).

**Other gates:**
| Command | Result |
|---|---|
| `npm run typecheck` | exit 0 |
| `npx vitest run src/lib/__tests__/toast.smoke.test.ts` | 4/4 passed |
| `npm run check:story-coverage` | 0 — 15/15 covered, 0 unproven |
| `npx vitest run` (full suite) | 1161/1163 passed, 2 failed: `date-format-ssr-parity` and `RangeDatePicker` — both on the documented full-run-only timeout list (§13.3 of the kickoff). Isolated re-runs: `date-format-ssr-parity.smoke.test.ts` 25/25 passed; `RangeDatePicker.smoke.test.tsx` 14/14 passed. The `checksRan===14` assertion in `scripts/__tests__/check-stories.test.ts` was updated to 15 in this task (a required downstream consumer of R1, not scope creep — its own comment instructs "bump this deliberately whenever a new Check N is added"); `saveSavedSearch.dedup` (the third documented flake) did not fail this run. |
| `npm run build-storybook` | exit 0 |
| `npm run screenshots:assert -- --mantine-only` | 0 FAIL, 1162/1184 PASS, 22 AMBIGUOUS (unchanged from baseline), 0 flaky-recovered. Manifest at `.screenshots/rendered-assert/2026-07-29T16-29/`. |
| `npm run check:design-tokens` | 44 raw-value violations / 0 stale-marker (unchanged baseline count); grep-confirmed 0 hits in any of the 5 touched files |
| `npm run check:i18n` | 0 — 2215×4, 0 new keys |
| `npm run check:file-integrity` | run after I7 (session log + backlog present) — exit 0 |
| `npm run check:mojibake` | run after I7 — exit 0 |
| `npm run build` | exit 0 — see route table below |
| `grep -rn 'color="blue"' src/` | 0 hits (post-fix) |
| `grep -rn 'orange' src/components/admin/AdminUsersTable.tsx` | 6 hits — the literal AC11 command matches the substring `orange` anywhere (a `STATUS_COLOR` map value at `:29` and two `style={{ color: 'var(--mantine-color-orange-6)' }}` CSS-var uses at `:223`/`:263`, neither a colour-prop violation), plus the three actual §3.2 sites. The precise §3.2 sweep pattern (`grep -rnE '(color\|c\|bg)="(…\|orange)([.][0-9])?"' src/`) — re-run verbatim post-fix — returns exactly the same **3** hits as the kickoff's original sweep, byte-identical (`:224`, `:264`, `:475`), confirming R11/AC11's substantive claim: the orange sites are untouched. |

**`npm run build` transcript tail (route table):**
```
 ✓ Compiled successfully in 55s
   Skipping linting
   Checking validity of types ...
   Collecting page data ...
   Generating static pages (0/40) ...
   Generating static pages (10/40)
   Generating static pages (20/40)
   Generating static pages (30/40)
 ✓ Generating static pages (40/40)
   Finalizing page optimization ...
   Collecting build traces ...

Route (app)                                 Size  First Load JS  Revalidate  Expire
┌ ƒ /                                      379 B         185 kB
├ ƒ /_not-found                          1.16 kB         185 kB
├ ƒ /[locale]                            6.94 kB         618 kB
├ ƒ /[locale]/[slug]                       377 B         185 kB
├ ƒ /[locale]/auth/confirm-email         2.18 kB         192 kB
├ ƒ /[locale]/auth/login                 1.42 kB         265 kB
├ ƒ /[locale]/auth/register              1.41 kB         265 kB
├ ƒ /[locale]/auth/reset-password        6.43 kB         284 kB
├ ƒ /[locale]/auth/verified              2.27 kB         258 kB
├ ƒ /[locale]/cabinet                     149 kB         763 kB
├ ƒ /[locale]/contact                    5.43 kB         230 kB
├ ƒ /[locale]/favorites                  5.24 kB         577 kB
├ ƒ /[locale]/listings                   12.8 kB         585 kB
├ ƒ /[locale]/listings/[slug]              379 B         581 kB
├ ƒ /[locale]/listings/[slug]/edit       2.36 kB         251 kB
├ ƒ /[locale]/listings/create            2.36 kB         251 kB
├ ƒ /admin                               5.02 kB         371 kB
├ ƒ /admin/companies                     6.84 kB         304 kB
├ ƒ /admin/currency                      8.65 kB         300 kB
├ ƒ /admin/email-templates               9.99 kB         253 kB
├ ƒ /admin/footer                        6.27 kB         232 kB
├ ƒ /admin/inquiries                       379 B         185 kB
├ ƒ /admin/inquiries/sales                 336 B         368 kB
├ ƒ /admin/inquiries/support               335 B         368 kB
├ ƒ /admin/legal                           379 B         185 kB
├ ƒ /admin/listings                        10 kB         422 kB
├ ƒ /admin/listings/[id]/preview           379 B         581 kB
├ ƒ /admin/locations                     9.91 kB         261 kB
├ ƒ /admin/pages                         10.4 kB         264 kB
├ ƒ /admin/permissions                   8.94 kB         219 kB
├ ƒ /admin/popular-locations             9.23 kB         260 kB
├ ƒ /admin/property-types                7.35 kB         292 kB
├ ƒ /admin/reports                       21.3 kB         287 kB
├ ƒ /admin/settings                      7.55 kB         221 kB
├ ƒ /admin/support                       8.51 kB         408 kB
├ ƒ /admin/users                         5.02 kB         483 kB
├ ƒ /admin/users/[id]                      381 B         599 kB
├ ƒ /admin/users/new                       381 B         599 kB
├ ƒ /api/auth-email-hook                   378 B         185 kB
├ ƒ /api/auth/me                           378 B         185 kB
├ ƒ /api/cron/inactivity                   377 B         185 kB
├ ƒ /api/cron/listings-expiry              378 B         185 kB
├ ƒ /api/cron/price-alerts                 379 B         185 kB
├ ƒ /api/cron/saved-searches               377 B         185 kB
├ ○ /api/exchange-rate                     379 B         185 kB          1h      1y
├ ƒ /api/listings                          377 B         185 kB
├ ƒ /api/listings/[slug]/view              379 B         185 kB
├ ƒ /api/presence                          379 B         185 kB
├ ƒ /api/property-types                    379 B         185 kB
├ ƒ /api/upload-avatar                     378 B         185 kB
├ ƒ /api/upload-company-logo               378 B         185 kB
├ ƒ /api/upload-popular-location-photo     378 B         185 kB
├ ƒ /auth/callback                         378 B         185 kB
└ ƒ /auth/confirm                          378 B         185 kB
+ First Load JS shared by all             184 kB
  ├ chunks/3434-439a2cbe562a6d2d.js       126 kB
  ├ chunks/4bd1b696-ad216e4073dcea52.js  54.4 kB
  └ other shared chunks (total)          4.19 kB


ƒ Middleware                              165 kB

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```
Exit code 0. 40/40 static pages generated, full route table unchanged in shape from the pre-task baseline — no
route regressions, no new/removed routes from this diff, which touches only a Storybook governance script, two
colour props, and docs/session records.

## 7. PNG-md5 delta table (§3.8 target: ≤32 cells across the two affected stories)

Compared `.screenshots/rendered-assert/2026-07-29T16-29/` (this task's `--mantine-only` run) against the declared
baseline `.screenshots/rendered-assert/2026-07-29T14-20/` (Task 684's approved post-change run). Comparison script
and raw output persisted at `.screenshots/task685-delta/` (`verdict-changes.json` — empty array, confirming 0
verdict changes across all 1184 cells; `target-story-cells.json` — the 32-row table below; `outside-scope-changes.json`
— the 84-row table referenced in §9).

| storyId | locale | viewport | Status |
|---|---|---|---|
| patterns-mantine-notificationpattern--default | sq/en/uk/it | mobile-320 | CHANGED (all 4) |
| patterns-mantine-notificationpattern--default | sq/en/uk/it | mobile-375 | CHANGED (all 4) |
| patterns-mantine-notificationpattern--default | sq/en/uk/it | mobile-390 | CHANGED (all 4) |
| patterns-mantine-notificationpattern--default | sq/en/uk/it | desktop-1024 | CHANGED (all 4) |
| patterns-mantine-adminsurfacepattern--default | sq/en/uk/it | mobile-320 | CHANGED (all 4) |
| patterns-mantine-adminsurfacepattern--default | sq/en/uk/it | mobile-375 | CHANGED (all 4) |
| patterns-mantine-adminsurfacepattern--default | sq/en/uk/it | mobile-390 | CHANGED (all 4) |
| patterns-mantine-adminsurfacepattern--default | sq/en/uk/it | desktop-1024 | **unchanged** (all 4) — reason below |

**28/32 changed, 4/32 unchanged.** All 16 NotificationPattern cells changed — the info-trigger Button is always
rendered regardless of viewport, so the `blue`→`blueLight` fill-colour swap is visible everywhere. AdminSurfacePattern
changed at all 12 mobile-card cells (320/375/390 × 4 locales) but **not** at any of the 4 desktop-1024 cells.
Reason, confirmed in source: `MantineAdminSurfacePattern.tsx:67` sets `isMobile = useMediaQuery('(max-width: 40em)')`
(640px); at `isMobile === false` (i.e. desktop-1024), `MantineDataTableToCards` renders the `columns`-driven Table,
not the `card`/`meta` layout — the `meta` array (which holds the "Agent" Badge, `AdminSurfacePattern.stories.tsx:79`)
is only consumed by the card renderer, confirmed at `MantineDataTableToCards.tsx:326` (`cfg.meta && cfg.meta.length > 0`
guarding the meta-rows block inside the `if (isMobile)` branch). The Badge is therefore not present in the desktop-1024
DOM at all — a genuine "not rendered at that viewport" case, not a missed diff.

**Confirmation:** every one of the 32 candidate cells is accounted for above (28 changed, 4 unchanged-with-reason);
0 verdict changes anywhere in the 1184-cell manifest (§6, `--mantine-only` transcript).

## 8. Synthetic-plant revert proof

```diff
--- a/src/design-system/mantine/patterns/MantineNotificationPattern.tsx
+++ b/src/design-system/mantine/patterns/MantineNotificationPattern.tsx
@@ -78,7 +78,7 @@ export function MantineNotificationPattern({
          {triggerErrorLabel}
        </Button>
        <Button
-          color="blue"
+          color="blueLight"
          onClick={() => showNotification(infoConfig)}
          w={{ base: '100%', sm: 'auto' }}
        >
```
This `git diff` was taken immediately after reverting the synthetic `cyan` plant — it shows only the intended
`blue`→`blueLight` fix, proving the plant left no residue.

## 9. Self-review findings

**Finding — 84 PNG-md5-changed cells outside the two target stories (flagged for orchestrator, not self-waived).**
The full 1184-cell PNG-md5 comparison against the `2026-07-29T14-20` baseline found 112 changed cells total: 28
inside the authorized 32-cell scope (§7, all attributable to the colour fix) and **84 outside it**, spread across
`Button`, `CopyIdButton`, `FilterPanelShell`, `HeroSearch` (default + fallback), `LocaleSwitcher`,
`MobileBottomNavView` (guest + authenticated), `RangeDatePicker`, `Skeleton`, `EmptyLoadingErrorState`, and
`HomepageListingGrids` (loading story) — none of which import `notificationVariants`, `VARIANT_COLORS`, or any code
touched by this diff. Per the kickoff's own failure-path clause ("a cell outside the two stories changes → stop and
report, do not accept"), this is reported rather than silently absorbed.

**Investigation performed:** ran the same PNG-md5 comparison between two runs that share the identical pre-Task-685
code state — `.screenshots/rendered-assert/2026-07-29T13-45/` and `.screenshots/rendered-assert/2026-07-29T14-20/`
(both post-Task-684, both before any Task 685 edit). That zero-code-diff control comparison found **75 changed
cells across an overlapping set of the same stories** (`Button`, `FilterPanelShell`, `HeroSearch`, `LocaleSwitcher`,
`MobileBottomNavView`×2, `RangeDatePicker`, `Skeleton`, `EmptyLoadingErrorState`, `HomepageListingGrids--loading`).
Since these exact stories differ by a similar magnitude between two runs with **zero source diff between them**,
the evidence points to pre-existing capture non-determinism (shimmer/loading animations, a "copied" transient
state, dropdown/carousel frame timing, async geolocation content) in this harness for animated/dynamic-content
stories — not a regression introduced by this task's colour-prop change. This is a plausible, evidence-backed
explanation, not a certainty; the raw comparison data is persisted at `.screenshots/task685-delta/` for
independent re-derivation. **AC8's "0 verdict changes" is met exactly** (all 1184 verdicts identical); the
byte-level PNG-md5 noise is a separate, narrower claim this session cannot resolve to certainty and is handed to
the orchestrator rather than declared clean.

No other defects found. All R1–R11 requirements have direct evidence (§3). The `orange` sites were read but not
touched (R11, confirmed via `git status` and the unchanged 3-hit grep).

## 10. Assumptions, deviations, and limitations

- **Deviation:** `scripts/__tests__/check-stories.test.ts` was modified, though it is not listed in the kickoff's
  §7 scope table. Reason: R1 mandates `checksRan` become 15; this test file has a `checksRan === 14` assertion whose
  own comment explicitly instructs "Bump this deliberately whenever a new Check N is added to the gate" — a known,
  intentional downstream consumer of the exact value this task changes. Leaving it unfixed would break
  `npx vitest run`, a required gate (§13.3). Treated as in-scope per `docs/agent-contract.md` clause 9 ("Update
  every active consumer... a known active broken reference is part of the same task"), not as unrelated cleanup —
  only the one assertion (number + description string) was touched, nothing else in the 800+-line file.
- **Limitation (declared per §13.1 of the kickoff):** the proof path used `MANTINE_VIEWPORTS`
  (320/375/390/1024) × sq/en/uk/it, the same 4-width boundary declared by Tasks 675 and 684. The remaining canonical
  widths (`docs/qa-profiles.md`'s 14-width matrix) are Task 678's reserved scope and are not claimed here as
  satisfied full-matrix coverage.
- **Limitation:** Check 15's scope deliberately excludes `src/components/`, so the three `orange` sites in
  `AdminUsersTable.tsx` stay green/undetected until Task 686 widens the scope (D7). This is by design, not an
  oversight — confirmed the gate does NOT report them (§6 grep, R11).
- **Limitation:** no `docs/critical-flow-registry.md` row is touched. Row `:43`/`:61` run through `src/lib/toast.ts`
  (untouched this task); row `:45` is `AdminUsersTable.tsx` (out of scope, D7). Site 1 is story-only (no production
  consumer — confirmed by the kickoff's §3.9 `grep` finding zero `MantineNotificationPattern` importers outside
  stories/barrel/comment) and site 2 is a story fixture. No critical-flow coverage is claimed.
- **Limitation:** `.screenshots/` evidence (`task685-delta/`, `rendered-assert/2026-07-29T16-29/`) is local-only per
  `.gitignore:55` and owner decision D6 (Task 684 review) — not present in `git status`, referenced by path only.
- No other deviations from the kickoff.

## 11. Files Changed

| Path | Reason |
|---|---|
| `scripts/check-stories.mjs` | R1–R4 — added Check 15 (unregistered Mantine colour prop), bumped `checksRan` to 15, updated the file's own header doc-comment list. |
| `scripts/__tests__/check-stories.test.ts` | Required downstream fix — bumped the `checksRan === 14` completeness assertion to 15 (its own comment mandates this on every new check; see §10 deviation). |
| `src/design-system/mantine/patterns/MantineNotificationPattern.tsx` | R7 — site 1, `color="blue"` → `color="blueLight"` on the info-trigger Button (line 81). No other change. |
| `src/stories/patterns/mantine/AdminSurfacePattern.stories.tsx` | R7 — site 2, `color="blue"` → `color="blueLight"` on the role Badge (line 79). No other change. |
| `docs/backlog.md` | I7 — replaced the "685 KICKOFF FILED" note with the completion summary; numbering line already correct (`last used: 685. NEXT FREE: 687`) and untouched. Physical line count unchanged at 80. |
| `docs/sessions/2026-07-29-task685-unregistered-colour-gate.md` | I7 — this session log (new file). |

## 12. Opus handoff

- **Primary item requiring a decision:** §9's 84-cell outside-scope PNG-md5 finding. Evidence for "pre-existing
  noise, not a regression" is in §9 and persisted at `.screenshots/task685-delta/outside-scope-changes.json` plus
  the zero-code-diff control comparison; recommend the orchestrator independently re-derive at least a sample (e.g.
  re-run `--mantine-only` twice in a row with no code change and diff those two runs) before ruling.
- Verify the Check 15 implementation against the four legal value classes independently, e.g. by reading
  `scripts/check-stories.mjs`'s new block directly and cross-checking a few of the 365 raw survey occurrences.
- Re-run at minimum: `npm run check:stories` (expect 15/127/0), `npm run build` (expect 0/40 pages),
  `npx vitest run scripts/__tests__/check-stories.test.ts` (expect 91/91).
- `grep -rn 'color="blue"' src/` and `grep -rn 'orange' src/components/admin/AdminUsersTable.tsx` are both quoted
  in §6 and cheap to re-verify directly.
