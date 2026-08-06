# Task 686 — Registered `orange` ramp + widened Check 15 (forms A/B/C) + `ROLE_COLOR.agent`→`blueLight`

**Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`

**Kickoff:** `tasks/kickoff_prompt_Task_686_Registered_Orange_Ramp_And_Widened_Colour_Gate.md`

## 1. Task path and status

Executed from the saved kickoff under `.claude/skills/execute-task/SKILL.md`. Status:
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. One item flagged for the reviewer, not self-waived: a single
PNG-md5-changed cell (`Mantine/Primitives/LightboxView/Default`) falls outside the kickoff's pre-enumerated
capture-noise set — investigated in §8, both captures independently verdict `pass`.

## 2. Start/end worktree snapshot

**Start (I0):** `git status --porcelain` → empty. `git log -1 --oneline` →
`6806bda1f docs(Task686): registered orange ramp + ROLE_COLOR.agent blueLight + Check 15 widened to all src (forms
A/B/C), 687 reserved for AdminUsersTable manifest enrolment` — this is the docs-only commit that filed this
kickoff (`docs/backlog.md` + the kickoff file, `git show --stat` confirmed only those 2 files), sitting directly on
`ef05a92e5` (Task 685's code commit), consistent with A5's clean-start requirement (no source files touched yet).

**End (true final, taken after the session log + backlog edit exist):**

```
 M docs/backlog.md
 M scripts/__tests__/check-stories.test.ts
 M scripts/check-stories.mjs
 M src/components/admin/AdminUsersTable.tsx
 M src/components/admin/__tests__/AdminUsersTable.smoke.test.tsx
 M src/design-system/mantine/theme.ts
?? docs/sessions/2026-07-29-task686-registered-orange-widened-colour-gate.md
```

## 3. Requirement and acceptance-criteria evidence

| Req | AC | Evidence |
|---|---|---|
| R1 | AC1 | `theme.ts` gains `const orange: MantineColorsTuple` (indices 0/4/5 = `#fff6ed`/`#fd853a`/`#fb6514`, TailAdmin §4 line 46 authoritative; indices 6+7 = `#fb6514`; every other index annotated placeholder, `blueLight`-style). `colors: {…}` at the theme object gains `orange`. Side-by-side in §7. No other line of `theme.ts` changed (`git diff` shows only the new tuple + the one `colors:` line). |
| R2 | AC2 | Check 15's scope is `collectFiles(join(root, 'src'), ['.ts', '.tsx'])` (code quoted in §4). `runGate` still returns `checksRan: 15` (unedited line). `npm run check:stories` prints all 15 check headers, `127 files checked, 0 violations`, exit 0 (§6). |
| R3 | AC3 | Form B (`COLOR_VAR_RE`) implemented; planted `var(--mantine-color-teal-6)` → exit 1 naming the line; reverted → exit 0 (§6, §10). |
| R4 | AC4 | Form C (`COLOR_MAP_DECL_RE` + brace-balanced block scan) implemented; planted `const DEMO_COLOR = { x: 'grape' }` → exit 1; reverted → exit 0. The three live maps (`STATUS_COLOR`, `ROLE_COLOR` post-fix, and `notificationVariants.ts`'s `VARIANT_COLORS`) produce 0 violations on the clean tree (§6). |
| R5 | AC5 | **First observed counts, before any adjustment: 7 → 1 → 0** (A1), at exactly the §3.2 sites. All three transcripts in §6. |
| R6 | AC6 | `ROLE_COLOR.agent: 'blue'` → `'blueLight'`. `moderator: 'orange'` unchanged. `grep -rn "'blue'" src/components/admin/AdminUsersTable.tsx` → 0 hits (verified). |
| R7 | AC7 | Passthrough rewritten to: `#`-prefix, any CSS function call (`/^[a-z-]+\(/`), CSS-wide keywords, Mantine keywords, or a registered name (bare/`.0`-`.9`). Each of `bg="transparent"`, `color="currentColor"`, `c="oklch(0.6 0.2 20)"`, `bg="linear-gradient(90deg, #fff, #000)"`, `c="gray.5"`, `c="dimmed"`, `var(--mantine-color-brand-7)` individually planted and demonstrated exit 0 (§10). Full repo scan: 0 violations across 611+ `src/` files on the clean tree. |
| R8 | AC8 | `makeRoot()` gains a `theme.ts` stub (9 registered names). Pre-existing 91 tests still pass with the stub alone (verified before adding new tests). New `Check 15` describe blocks (Form A/B/C BAD+GOOD, F3 passthrough `it.each`, underivable-set) add 15 tests. `checksRan === 15` assertion untouched. Total: **106/106**. |
| R9 | AC9 | `AdminUsersTable.smoke.test.tsx`: before-edit count **20** (not 14 — the registry row's documented count is stale; reporting the actual observed number per A1's spirit, not the kickoff's stale expectation). After adding the 1 new test (2 assertions): **21/21**. New test asserts `data-color="blueLight"` for an agent row and `data-color="orange"` for a moderator row. Registry row `:45` (verify/revoke agent) behaviour is unchanged — no handler, toast, or navigation logic touched, only a colour map value. |
| R10 | AC10 | `--mantine-only`: **0 FAIL**, 22 AMBIGUOUS (identical set to baseline), **0 verdict changes** across all 1184 cells (script-verified, §8). PNG-md5: 64 cells changed; 63 fall inside the documented capture-noise set; 1 (`LightboxView/Default`) investigated and explained (§8) — both old and new captures independently verdict `pass`. |
| R11 | AC11 | `npm run build` exit 0, 40/40 static pages, route table quoted in §9. |
| R12 | AC12 | `check:i18n` 0, 2215×4, 0 new keys. `check:design-tokens` 44/0-stale, 0 in any of the 6 touched files (grep-verified, §9). `check:file-integrity`/`check:mojibake` run after this session log + backlog exist (§9), both 0. |

## 4. Current versus required behavior

**Current (pre-task):** `check:stories` ran 15 checks over 127 files, Check 15 scoped to 3 Mantine story/pattern
directories, seeing only literal `(color|c|bg)="value"` props with a `var(`/`#`/`rgb`/`hsl` prefix passthrough.
`src/components/` was unscanned; `var()` values were unconditionally passed through; colour maps were invisible.
Seven unregistered-colour sites survived in `AdminUsersTable.tsx`: `orange` resolved to Mantine's stock ramp
(`#fd7e14` index 6, `#f76707` index 7) on the role Badge (`moderator`), the location-request icon/label, and the
location-request filter Button; `ROLE_COLOR.agent` read `'blue'` (stock `#1c7ed6`), diverging from the canonical
pattern story's already-`blueLight` fixture.

**Required after (implemented):** `theme.ts` registers `orange` from TailAdmin §4 (indices 6/7 = `#fb6514`). Check 15
scans all of `src/`, still the 15th check over the same 127-file report count, and fails on all three forms — literal
prop, `var(--mantine-color-*)`, and `*COLOR*`-map value — while passing every legal CSS value class (§3.10). Both
remaining unregistered names are gone: `orange` because it is now registered, `blue` because `ROLE_COLOR.agent` reads
`blueLight`, restoring story↔production parity. The gate exits 0 on the fixed tree and 1 on any planted violation of
any form. `/admin/users` shifts by the two hexes documented in §7 — authorised (D11/D12), declared as having no
pixel-level rendered gate (§3.11 of the kickoff; enrolment is Task 687).

**Negative flows (from the kickoff's applicability table, §11):** all 14 rows applicable and verified — registered
bare/shaded colours pass, Mantine keywords pass, CSS-wide keywords pass, CSS functions pass, `var()` of an
unregistered stock name fails (the one case that must fail), framework/registered CSS vars pass, colour maps with
registered values pass (0 false positives on `STATUS_COLOR`/`VARIANT_COLORS`), `ROLE_COLOR`'s unregistered value
fails, the `CaptchaWidget.tsx` theme union passes (not a `*COLOR*` map, not a colour prop — confirmed absent from
this run's violation list), comment lines are skipped, an underivable registered/stock set fails loudly (§6 unit
test), a test root without `theme.ts` gets the stub and the 91 existing tests stay green, the post-fix tree hits
exactly 0 with the header still printed, the critical-flow regression stays green, and the visual delta's <640
card-layout rendering + no-pixel-gate boundary is stated (not fabricated) in §11.

## 5. Files Changed

| File | Reason |
|---|---|
| `src/design-system/mantine/theme.ts` | R1 — new `orange` tuple (TailAdmin §4 provenance) + registered at `colors:{…}`. |
| `scripts/check-stories.mjs` | R2–R4, R7 — Check 15 scope widened to all `src/`; Form B (`var()`) + Form C (`*COLOR*` map) added; stock-palette set derived at runtime from `default-colors.mjs`; F3 passthrough rewritten; underivable-set loud-fail paths added. |
| `scripts/__tests__/check-stories.test.ts` | R8 — `makeRoot()` gains a `theme.ts` stub; new `Check 15` describe blocks (Form A/B/C, F3, underivable-set). |
| `src/components/admin/AdminUsersTable.tsx` | R6 — `ROLE_COLOR.agent: 'blue'` → `'blueLight'`. One line. |
| `src/components/admin/__tests__/AdminUsersTable.smoke.test.tsx` | R9 — one new test asserting `data-color` for agent/moderator role Badges. |
| `docs/backlog.md` | Task state update (this session). |
| `docs/sessions/2026-07-29-task686-registered-orange-widened-colour-gate.md` | This session log. |

## 6. `check:stories` — the ladder + everything else, verbatim

### I1 — baseline (untouched tree, before widening)

```
✅ check:stories PASSED — 127 files checked, 0 violations.
```
15 checks ran (Check 15 header printed, no violations under the old 3-dir scope).

### I2 rung 1 — widened scope, BEFORE any source/theme fix (first observed: exactly 7)

```
❌ check:stories FAILED — 7 violation(s):

  src/components/admin/AdminUsersTable.tsx:224  [unregistered-mantine-colour]
    c="orange.6" ...
  src/components/admin/AdminUsersTable.tsx:264  [unregistered-mantine-colour]
    c="orange.6" ...
  src/components/admin/AdminUsersTable.tsx:475  [unregistered-mantine-colour]
    color="orange" ...
  src/components/admin/AdminUsersTable.tsx:223  [unregistered-mantine-colour-var]
    var(--mantine-color-orange-6) ...
  src/components/admin/AdminUsersTable.tsx:263  [unregistered-mantine-colour-var]
    var(--mantine-color-orange-6) ...
  src/components/admin/AdminUsersTable.tsx:29  [unregistered-mantine-colour-map]
    ROLE_COLOR[…] = 'blue' ...
  src/components/admin/AdminUsersTable.tsx:29  [unregistered-mantine-colour-map]
    ROLE_COLOR[…] = 'orange' ...
```
Exactly the 7 §3.2 sites, no more, no fewer. No adjustment needed — matches on first observation.

### I3 rung 2 — after registering `orange` (first observed: exactly 1)

```
❌ check:stories FAILED — 1 violation(s):

  src/components/admin/AdminUsersTable.tsx:29  [unregistered-mantine-colour-map]
    ROLE_COLOR[…] = 'blue' names a colour absent from theme.ts's registered set
    (brand, gray, green, yellow, red, blueLight, purple, sale, orange). ...
```
Five of seven violations disappeared with **zero script edits** — proves the registered set is genuinely
runtime-derived, not hard-coded.

### I4 rung 3 — after fixing `ROLE_COLOR.agent` (first observed: exactly 0)

```
✅ check:stories PASSED — 127 files checked, 0 violations.
```
15 checks ran, Check 15 header printed, `127 files checked` unchanged.

### I5 — synthetic plants (one per form), each planted in a disposable `src/stories/_task686_plant_*` scratch
file, never a tracked production file — reverted by deletion, proven clean via `git diff --stat` (unchanged: only
the 6 intended files listed in §5)

**Form A** — `<Text color="cyan">` → `❌ FAILED — 1 violation(s)` (`unregistered-mantine-colour`, `color="cyan"`).
Reverted (file deleted) → `git diff --stat` shows only the 6 intended files.

**Form B** — `style={{ color: 'var(--mantine-color-teal-6)' }}` → `❌ FAILED — 1 violation(s)`
(`unregistered-mantine-colour-var`, `var(--mantine-color-teal-6)`). Reverted → same clean diff.

**Form C** — `const DEMO_COLOR = { x: 'grape' }` → `❌ FAILED — 1 violation(s)` (`unregistered-mantine-colour-map`,
`DEMO_COLOR[…] = 'grape'`). Reverted → same clean diff.

### I5.4 — negative controls, each planted and tested individually, each `✅ check:stories PASSED`

| Value | Result |
|---|---|
| `bg="transparent"` | exit 0 |
| `color="currentColor"` | exit 0 |
| `c="oklch(0.6 0.2 20)"` | exit 0 |
| `bg="linear-gradient(90deg, #fff, #000)"` | exit 0 |
| `c="gray.5"` | exit 0 |
| `c="dimmed"` | exit 0 |
| `var(--mantine-color-brand-7)` | exit 0 |

All scratch files removed; `git status --porcelain` after cleanup shows only the 6 intended tracked files modified.

### Final confirmation (all plants reverted)

```
✅ check:stories PASSED — 127 files checked, 0 violations.
```

### Unit tests — `npx vitest run scripts/__tests__/check-stories.test.ts`

Before adding the new describe blocks (theme.ts stub added to `makeRoot()` only): **91/91 PASS** (confirms the stub
doesn't disturb any pre-existing check). After adding the `Check 15` blocks: **106/106 PASS** (91 + 15 new).
`checksRan === 15` assertion unchanged.

### Critical-flow regression — `npx vitest run src/components/admin/__tests__/AdminUsersTable.smoke.test.tsx`

Before edit: **20/20 PASS** (the registry's documented "14" is stale — reporting the actual observed count, per the
same discipline as the ladder's first-observed-number rule). After adding the `data-color` test: **21/21 PASS**.
Registry row `:45` (verify/revoke agent) behaviour unchanged — no handler/toast/navigation code touched.

### Full suite — `npx vitest run`

`Test Files 2 failed | 70 passed (72)` / `Tests 2 failed | 1177 passed (1179)`. Both failures are the documented
full-run-only timeout class (`date-format-ssr-parity`, `RangeDatePicker`), unrelated to this diff. Isolated re-run:

```
npx vitest run src/lib/__tests__/date-format-ssr-parity.smoke.test.ts src/design-system/mantine/patterns/__tests__/RangeDatePicker.smoke.test.tsx
Test Files  2 passed (2)
     Tests  39 passed (39)
```

### Other gates

- `npm run typecheck` → exit 0, no output.
- `npm run check:design-tokens` → `44 raw style-value violation(s) + 0 stale-marker(s)`. `grep`-verified: none of
  the 6 touched files appear in the violation list (`theme.ts` is path-allowlisted per `scripts/design-tokens-allowlist.json:2`).
- `npm run check:i18n` → `✅ Parity PASSED — all 4 locale files have identical key sets (2215 keys)`.
- `npm run check:story-coverage` → `✅ PASSED` — 15/15 covered, 0 enrolled-but-unproven, total unchanged.
- `npm run build-storybook` → `✓ built in 20.78s`, `Storybook build completed successfully`.

## 7. TailAdmin §4 side-by-side — the `orange` tuple

`docs/tailadmin-style-reference.md:46`: `| orange | #fff6ed | — | — | — | #fd853a | #fb6514 | — | — | — | — | — |`
(header row `Scale | 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950`).

| Index | Nominal scale | Value | Status |
|---:|---|---|---|
| 0 | 50 | `#fff6ed` | **AUTHORITATIVE** |
| 1 | 100 | `#fff6ed` | placeholder (nearest §4 stop, not consumed) |
| 2 | 200 | `#fff6ed` | placeholder — equidistant between 50/400, resolved **downward** per convention, not consumed |
| 3 | 300 | `#fd853a` | placeholder (nearest §4 stop, not consumed) |
| 4 | 400 | `#fd853a` | **AUTHORITATIVE** |
| 5 | 500 | `#fb6514` | **AUTHORITATIVE** |
| 6 | 600 | `#fb6514` | placeholder (nearest §4 stop) — **consumed**: `c="orange.6"` ×2, `var(--mantine-color-orange-6)` ×2 |
| 7 | 700 | `#fb6514` | placeholder (nearest §4 stop) — **consumed**: Badge/Button `variant="light"` (primaryShade:7, Task 620) |
| 8 | 800 | `#fb6514` | placeholder (nearest §4 stop, not consumed) |
| 9 | 900 | `#fb6514` | placeholder (nearest §4 stop, not consumed) |

Rendered delta on `/admin/users` (both indices consumed): index 6 `#fd7e14`→`#fb6514`; index 7 `#f76707`→`#fb6514`.
No enrolled Storybook story uses `orange` in any form — registering it changes 0 enrolled cells beyond capture noise
(§8).

## 8. Rendered proof — `--mantine-only` vs `2026-07-29T16-29` baseline

Fresh run persisted at `.screenshots/rendered-assert/2026-07-29T17-50/`. Result: **1162/1184 PASS, 0 FAIL, 22
AMBIGUOUS** — identical counts and identical 22 ambiguous cells (same story/locale/viewport set: `Combobox`
overlay-backdrop ×4, `PopularLocationsView` long-city-name ellipsis ×16, `Tabs` scroll-reachable ×2) to the baseline.

**Verdict diff (script-computed over all 1184 cells, keyed by storyId|locale|viewport):** `verdict changes: 0`.
Binding comparator (per D10, inherited from the Task 685 review) is met exactly.

**PNG-md5 attribution** (`.screenshots/task686-delta/md5-changed.json` + `by-story-summary.json`):

| Story | Changed cells | In documented capture-noise set? |
|---|---:|---|
| `Mantine/Primitives/LocaleSwitcher/Default` | 13 | Yes |
| `Patterns/Mantine/EmptyLoadingErrorState/Default` | 11 | Yes |
| `Mantine/Primitives/Skeleton/Default` | 10 | Yes |
| `Mantine/Primitives/Button/Default` | 9 | Yes |
| `Mantine/Primitives/HeroSearch/Fallback` | 8 | Yes |
| `Patterns/Mantine/HomepageListingGrids/Loading` | 8 | Yes |
| `Mantine/Primitives/CopyIdButton/Default` | 1 | Yes |
| `Mantine/Primitives/FiltersPanelShell/Default` | 1 | Yes |
| `Mantine/Primitives/MobileBottomNavView/Guest` | 1 | Yes |
| `Mantine/Primitives/MobileBottomNavView/Authenticated` | 1 | Yes |
| `Mantine/Primitives/LightboxView/Default` (en, mobile-390) | 1 | **No — investigated below** |

**LightboxView/Default outlier, investigated (not silently accepted, per D10):** `LightboxView.tsx` renders through
Mantine's `Modal.Root`/`Modal.Content`, which carries Mantine's own entrance transition (opacity/scale animation on
open). This is the same animation/async-timing capture-flake class documented in the Task 685 review's zero-code-diff
control pairs (75/91/98-cell deltas with no source change at all) — it simply wasn't in this kickoff's
pre-enumerated list because Task 685's own diff never happened to touch a Modal-based story. Confirmed via the
manifest: **both** the baseline and this run's capture of this exact cell independently report `verdict: "pass"`
— the byte-level difference is capture-timing noise, not a rendered defect, and the binding 0-verdict-changes
comparator already accounts for it. No `orange`/`blueLight`/`ROLE_COLOR` value appears anywhere in `LightboxView.tsx`
or its story — confirmed by inspection — so there is no plausible causal path from this diff to this cell either way.

**Statement required by §11 of the kickoff:** no enrolled story uses `orange` in any form; registering the ramp
changes 0 enrolled cells beyond the documented capture-noise class above.

## 9. Gate transcripts (exact commands + real exit codes)

| Command | Result |
|---|---|
| `npm run check:stories` (5 stages: pre-widening, 7-viol, 1-viol, clean, final-clean) | 0 / 1 / 1 / 0 / 0 — see §6 |
| `npm run typecheck` | 0 |
| `npx vitest run scripts/__tests__/check-stories.test.ts` | 0 — 106/106 |
| `npx vitest run src/components/admin/__tests__/AdminUsersTable.smoke.test.tsx` | 0 — 21/21 |
| `npx vitest run` (full) | 2 failed (documented full-run-only timeouts) / 1177 passed; isolated re-run 0 — 39/39 |
| `npm run check:story-coverage` | 0 — 15/15, total unchanged |
| `npm run build-storybook` | 0 |
| `npm run screenshots:assert -- --mantine-only` | 0 — 0 FAIL, 0 verdict changes, md5 attribution in §8 |
| `npm run check:design-tokens` | 44/0-stale, 0 in touched files |
| `npm run check:i18n` | 0 — 2215×4 |
| `npm run build` | **0** — 40/40 static pages |
| `npm run check:file-integrity` | run after this session log + backlog exist — see below |
| `npm run check:mojibake` | run after this session log + backlog exist — see below |

`npm run build` route-table tail (verbatim):

```
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
├ ƒ /admin/users                         5.03 kB         483 kB
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
  ├ chunks/3434-690fedef92ca2278.js       126 kB
  ├ chunks/4bd1b696-ad216e4073dcea52.js  54.4 kB
  └ other shared chunks (total)          4.19 kB

ƒ Middleware                              165 kB
```
40 routes listed (40/40 static pages generated per the build log).

## 10. Proof of every synthetic plant reverted

Each of the 3 synthetic plants + 7 individually-tested negative controls used a disposable scratch file under
`src/stories/_task686_plant_*` / `src/stories/_task686_negctrl*` — never a tracked file. Each was deleted (not
edited back) after its assertion. `git diff --stat` and `git status --porcelain`, re-run after every deletion,
showed only the 6 intended tracked files (§5) at every step — no scratch residue at any point.

## 11. Deviations

1. **AdminUsersTable.smoke.test.tsx's pre-edit count is 20, not the kickoff's stated 14.** The
   `docs/critical-flow-registry.md:45` row's "14 tests" note is stale (the file has grown since Task 483). Reporting
   the actually-observed number rather than reconciling to the stated expectation, per the same first-observed-number
   discipline the kickoff applies to the violation ladder (A1).
2. **The docstring comment block for Check 15 (top of `check-stories.mjs`) was updated** to describe the widened
   scope/forms, beyond the literal line range the kickoff named (`:849-910`) — this is documentation of the exact
   code being changed in the same edit, not a scope expansion.
3. **`loadStockPaletteNames` resolves against the module-level `ROOT` constant, not the `root` parameter passed to
   `runGate`.** The kickoff's §I2.3 says "derive... from default-colors.mjs at runtime" without specifying which root;
   `node_modules` is a fixed dependency of the script itself, not of whatever directory is being scanned. A vitest
   temp-fixture root has no `node_modules` of its own — using the scan `root` would make every unit test hit the
   underivable-stock-set path. Verified: without this fix, `loadStockPaletteNames(root)` returns an empty Set inside
   every test, defeating Forms B/C entirely in the test suite.

## 12. Limitations

- **`/admin/users` has no pixel-level rendered gate.** `Admin/AdminUsersTable` is titled outside the
  `Patterns/Mantine/*`/`Mantine/Primitives/*` prefixes `--mantine-only` enrols by (§3.11 of the kickoff). The two-hex
  colour shift on that surface (§7) is authorised (D11/D12) but not covered by any automated visual assertion in this
  task. Enrolment is reserved as **Task 687**.
- **Free-form expression-valued colour props remain outside the gate** (`color={cond ? 'teal' : 'gray'}`,
  `color={props.color}`). Form C closes the map shape, which is where every real instance of the F2 defect class
  lives in this repository today — this is a declared boundary, not a claim of totality.
- **The declared visual proof path is the 4-width `--mantine-only` toolbar-driven matrix** (320/375/390/1024 ×
  sq/en/uk/it via Storybook globals), not the full 14-width canonical matrix — enrolling the remaining canonical
  widths is Task 678's reserved scope, unchanged by this task.
- **D12 (`ROLE_COLOR.agent` → `blueLight`) is derived from standing D4/D8, not a new owner ruling** — flagged per A8
  for the reviewer to confirm or override.
- **`.screenshots/` evidence (including `.screenshots/task686-delta/`) is local-only**, per `.gitignore:55` and
  standing owner decision D6 — persisted at the paths named above, will not appear in `git status`.

## Backlog update

See `docs/backlog.md` — concise active-state entry added under "Last Session (2026-07-29)", Task 686 marked
`IMPLEMENTED, AWAITING ORCHESTRATOR REVIEW`. Backlog remains at its hard line limit; no history added.
