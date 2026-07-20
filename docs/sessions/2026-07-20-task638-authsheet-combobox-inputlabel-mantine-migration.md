# Session Archive: Task 638 — AuthSheet Slice 2e (final): legacy `Combobox` → `MantineCombobox`, four remaining `Label`s → Mantine `InputLabel` — 2026-07-20

## Task path and status

`tasks/kickoff_prompt_Task_638_AuthSheet_Slice2e_Combobox_InputLabel_MantineMigration.md`

**Status: IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW**

## Summary

Replaced the legacy `Combobox` (company-select, `CompanyField`) in `src/modules/auth/components/AuthSheet.tsx` with
the canonical `MantineCombobox` (`@/design-system/mantine/patterns`), and replaced three of the four remaining
shadcn `Label` usages with `@mantine/core` `InputLabel` (L1 login-password, L2 `AgentCityField`, L3 `CompanyField`).
The fourth (L4, the compact logo-upload label) uses `<Text component="label" size="xs" c="dimmed">` instead of
`InputLabel` — confirmed via `node_modules/@mantine/core/esm/core/styles-api/use-styles/use-styles.mjs` that
`theme.ts`'s `InputWrapper.styles.label` (14px/600/gray-7) resolves to an inline `style` attribute on the label
element, which would silently override the legacy `text-xs text-muted-foreground` compact intent regardless of any
`className` passed to `InputLabel` — this is the task's own documented fallback, applied on verified technical
grounds rather than a guess. `@/components/ui/label` and `@/components/shared/Combobox` are now removed from
`AuthSheet.tsx`; the only remaining `@/components/ui/*` import is `PasswordRequirementsHint` (a domain component,
explicitly out of scope). This is **Slice 2e, the final AuthSheet slice** — AuthSheet's base-primitive migration is
now complete (Slices 1/2a/2b/2c/2d — shell, Button, Input/Label→TextInput, PasswordInput, Alert — all previously
landed).

## Canonical UI decision record

| Visible artifact | Search queries and inspected paths | Canonical story/source | Disposition | Consumed shared style/token path |
|---|---|---|---|---|
| Company-select control (`CompanyField`) | Opened `src/design-system/mantine/patterns/MantineCombobox.tsx` (canonical, `MantineComboboxOption` = `{value,label,dropdownLabel?,description?,searchText?}`, `variant="input"`\|`"button"`, always portals via `Combobox.Dropdown`/`ResponsiveBottomSheet`). Grepped precedent consumers: `PropertyTypeCombobox.tsx`, `YearCombobox.tsx`, `PhoneField.tsx` (Task 556), `LocationCombobox.tsx` — all consume `MantineCombobox` directly, none copy its class chain. Read legacy `src/components/shared/Combobox.tsx` being replaced (`portal` prop, hand-rolled dropdown/mobile-sheet via `createPortal`+`mobile-bottom-sheet`) | `@/design-system/mantine/patterns/MantineCombobox.tsx`, theme-owned via `.mantine-Combobox-option`/§6l item chrome + existing `input-chrome.css` `.mantine-TextInput-input` rules | **reuse** — `<MantineCombobox options value onChange placeholder variant="input" noResultsLabel/>`, `portal` dropped (canonical always portals), no local styling added | Theme-owned trigger chrome (`.mantine-TextInput-input`, §6d/§6e) + §6l item/no-results chrome inside `MantineCombobox.tsx` itself — zero new CSS |
| L1 login-password label, L2 `AgentCityField` label, L3 `CompanyField` label | Opened `theme.ts` `InputWrapper` block (~L393): `styles.label` = 14px (`--mantine-font-size-sm`), `fontWeight:600`, `color: gray-7`, `marginBottom: 0.375rem` — shared by `InputLabel`/`InputDescription`/`InputWrapper` (single CSS-module slot, per the in-file comment). Precedent: `PhoneField.tsx` (Task 556) already imports and uses `@mantine/core` `InputLabel` with `htmlFor`/children | `@mantine/core` `InputLabel`, chrome owned by `theme.ts` `InputWrapper.styles.label` | **reuse** — `<InputLabel htmlFor?>{label}</InputLabel>`, no local style | Theme-owned §6 label chrome (14px/600/gray-7/6px label→field gap) |
| L4 logo-upload label (`text-xs text-muted-foreground` compact intent) | Read `node_modules/@mantine/core/esm/core/styles-api/use-styles/use-styles.mjs` `useStyles()`: `getStyle()` returns a `style` object merged onto the target element's `style` attribute — theme `styles` config is NOT a CSS class, it is an inline style, which always wins over a Tailwind utility class regardless of source order/specificity (except `!important`). `InputWrapper.styles.label` therefore forces 14px/600/gray-7 on any `InputLabel`, silently defeating a `className="text-xs text-muted-foreground"` override. Task's own Assumptions section names this exact fallback | `@mantine/core` `Text` (`component="label"`), already imported in `AuthSheet.tsx` | **reuse (fallback path, task-authorized)** — `<Text component="label" size="xs" c="dimmed">{t('company_logo')}</Text>` — no `InputLabel`, no local CSS, both options remove the `Label` import per the kickoff | Mantine `Text` size/color scale (`size="xs"`=12px, `c="dimmed"`=gray-5-equivalent) — matches the legacy compact look, confirmed by rendered screenshot (below) showing it visibly smaller/lighter than the 14px/600 `InputLabel`s above it |

## Requirement and acceptance-criteria evidence

| ID | Requirement | Evidence |
|---|---|---|
| R1/AC1 | Company-select renders `MantineCombobox` (no `portal`); `@/components/shared/Combobox` import removed; `options`/`value={companyId}`/`onChange={onCompanyId}`/`placeholder` unchanged; `📷` preserved via `description` | `git diff` (below) — `Combobox` import line removed, `MantineCombobox` added to the `@/design-system/mantine/patterns` import; `options` array (line producing `description: c.logo_url ? '📷' : undefined`) is untouched, outside every diff hunk; `grep -n "shared/Combobox"` → no match; rendered open/filter proof below |
| R2/AC2 | All four labels → `InputLabel` (L1–L3) or the documented `Text` fallback (L4); `@/components/ui/label` import removed; `htmlFor`/`className` intent preserved; login-password row intact | `git diff` — `Label` import line removed, 3× `<InputLabel>`, 1× `<Text component="label">`; `grep -n "components/ui/label\|<Label\b"` → no match; rendered `login_*_password_row.png` shows the label+forgot-button row intact |
| R3/AC3 | No change to `companyId`/`onCompanyId`, company-create sub-flow, location selection, password/forgot logic, field state/validation | `git diff` — only the label/Combobox element identities + the `@mantine/core`/patterns import lines changed; every handler (`handleCreate`, `handleCancel`, `handleLogoSelect`, `setCompanyId`/`onCompanyId`) is outside every hunk, byte-identical; all 4 named smokes green |
| R4/AC4 | `MantineCombobox`/`InputLabel` canonical chrome; company select opens (desktop dropdown + mobile sheet), typing filters, InputLabels render above controls | Rendered: `register_agent_*_company_open.png` (uk@320 mobile sheet, uk@390 mobile sheet, en@1280 desktop dropdown), `register_agent_en_desktop_company_filtered.png` (typing "a" filters the trigger value + empty-state persists correctly); full-page `register_agent_uk_320.png` shows every `InputLabel` above its control |
| R5/AC5 | After this slice, `AuthSheet.tsx` has no `@/components/ui/{button,input,label,alert,PasswordInput}` or `@/components/shared/Combobox` import; only `PasswordRequirementsHint` remains | `grep -n "@/components/ui/\|shared/Combobox" src/modules/auth/components/AuthSheet.tsx` → exactly one match, `@/components/ui/PasswordRequirementsHint` (line 16) — **primitive-clearance proof** |
| R6/AC6 | 5 named auth smokes + `test:header-hydration-id-parity` stay green | All 6 commands below: exit 0, 15/15 + 3/3 tests pass |
| R7/AC6 | `typecheck`/`check:stories`/`check:i18n`/`check:mojibake` green; no new i18n key | All 4 commands below: exit 0; i18n key count unchanged (2203/2203, all 4 locales) |

## Combobox → MantineCombobox mapping

| Prop | Legacy `Combobox` (before) | `MantineCombobox` (after) | Note |
|---|---|---|---|
| `options` | `companies.map(c => ({ value: c.id, label: c.name, description: c.logo_url ? '📷' : undefined }))` | unchanged (same expression, untouched by this diff) | `MantineComboboxOption` shape (`value`/`label`/`description`) maps 1:1 |
| `value` | `companyId` | `companyId` | unchanged |
| `onChange` | `onCompanyId` | `onCompanyId` | unchanged |
| `placeholder` | `selectPlaceholder` | `selectPlaceholder` | unchanged |
| `variant` | `"input"` | `"input"` | searchable trigger, typing filters — unchanged behavior |
| `portal` | `true` | **dropped** | `MantineCombobox` always portals its dropdown/sheet (`Combobox.Dropdown`'s `withinPortal` defaults `true`; mobile path is a portaled bottom sheet) — the prop has no equivalent and is not needed |
| `noResultsLabel` | n/a (legacy hardcodes `t('common.no_results')` internally) | `tc('no_results')` | **required** prop on `MantineComboboxOption` (no default) — `CompanyField` already has `const tc = useTranslations('common')` in scope; same `common.no_results` key the legacy component used internally, confirmed present in all 4 locale files |

## L1–L4 label mapping

| # | Location | Before | After |
|---|---|---|---|
| L1 | `LoginView`, login-password row | `<Label htmlFor="login-password">{t('password')}</Label>` | `<InputLabel htmlFor="login-password">{t('password')}</InputLabel>` — surrounding `flex items-center justify-between` row with the forgot-password button untouched |
| L2 | `AgentCityField` | `<Label>{label}</Label>` | `<InputLabel>{label}</InputLabel>` |
| L3 | `CompanyField` | `<Label>{label}</Label>` | `<InputLabel>{label}</InputLabel>` |
| L4 | `CompanyField` logo-upload row | `<Label className="text-xs text-muted-foreground">{t('company_logo')}</Label>` | `<Text component="label" size="xs" c="dimmed">{t('company_logo')}</Text>` — fallback path (see canonical decision record) |

## Current versus required behavior

- **Before:** company-select was the legacy `Combobox` (hand-rolled portal/mobile-bottom-sheet dropdown); four field
  labels were shadcn `Label`.
- **Required after:** company-select is `MantineCombobox` (searchable trigger, canonical desktop dropdown + mobile
  bottom sheet, `📷`-in-`description` unchanged); L1–L3 are Mantine `InputLabel`; L4 is `Text component="label"`
  (documented fallback); `companyId` selection, company-create sub-flow, location selection, and the login-password
  label+forgot-button row all behave exactly as before; `AuthSheet.tsx` no longer imports any base
  `@/components/ui/*` primitive (only `PasswordRequirementsHint`).

**Applicable negative flows:**

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Signup submit (agent, company selected) | Yes (regression) | Registry P0 | `companyId` unchanged → signup behaves as before | `signUpWithCaptcha.smoke.test.ts` green |
| Company select: open/filter (desktop + mobile) | Yes | R1/R4 | dropdown/sheet opens, typing filters, no-results state shows correctly | Rendered desktop dropdown + mobile sheet (uk@320, uk@390, en@1280) |
| Company "+ add new" sub-flow | Yes | R3 | create-row still opens (logo label visible, compact) | Rendered `register_agent_en_desktop_company_add_new_open.png` |
| Location select (`LocationCombobox`, unchanged) | Yes | R3 | still renders/selects; only its label (L2) swapped | Rendered full-page captures — "City (optional)"/"Місто" `InputLabel` above the (untouched) `LocationCombobox` |
| login-password label + forgot-button row | Yes | R2 | `InputLabel` + forgot button on one row, label `htmlFor` targets the password input | Rendered `login_uk_320_password_row.png`, `login_en_desktop_password_row.png` |
| Other auth flows (login/recovery/phone) | Yes (regression) | Registry P0 | unchanged | `browser.smoke.test.ts`/`requestPasswordReset.smoke.test.ts`/`PhoneField.smoke.test.tsx` green |
| Locale expansion (labels + company placeholder, uk@320) | Yes | R7 | labels/placeholder wrap, no clip/overflow at 320 | Rendered `register_agent_uk_320.png`, `login_uk_320_password_row.png` |
| Company-select-sets-value (`onChange` fires, field commits) | Yes | R1/R3 | selecting an option calls `onCompanyId` | **Not directly rendered this session** — dev DB currently has 0 companies (verified: every open dropdown/sheet shows "No results found"/"Результатів не знайдено"). Code-path evidence: `MantineCombobox`'s single `handleSelect` callback (`onChange(val); …; combobox.closeDropdown(); closeDrawer()`) is the exact same mechanism already exercised by `LocationCombobox`, `PhoneField`'s country selector, and `YearCombobox` — not new/first-use logic. Flagged for the reviewer; not substituted with a confidence claim |
| `📷` company-logo `description` indicator | Yes | R1 | shown as right-aligned row text for a logo'd company | **Not directly rendered this session** (same 0-company-data cause) — `options` mapping expression is byte-unchanged from before this diff (outside every hunk), and `MantineComboboxOption.description` is rendered verbatim by `MantineCombobox.tsx`'s `renderDesktopOption`/mobile row (`{opt.description && <Text size="xs" c="gray.5">{opt.description}</Text>}`), same mechanism `LocationCombobox` already uses for its own `description` (type/alt-name) in production |
| OAuth actual sign-in | No (manual-only) | Registry | unchanged | — |

## Files Changed

| File | Rationale |
|---|---|
| `src/modules/auth/components/AuthSheet.tsx` | Company-select `Combobox` → `MantineCombobox` (`portal` dropped, `noResultsLabel` added); L1–L3 `Label` → `InputLabel`; L4 `Label` → `Text component="label"` (fallback); `@/components/ui/label` and `@/components/shared/Combobox` imports removed; `InputLabel` added to the `@mantine/core` import, `MantineCombobox` added to the `@/design-system/mantine/patterns` import. No handler, state, or other-file change. |
| `docs/backlog.md` | Concise active-state entry for Task 638 added (net physical-line count exactly 80 — at, not over, the hard limit; flagged below). |

`git diff --stat`:

```
 docs/backlog.md                           |  2 +-
 src/modules/auth/components/AuthSheet.tsx | 18 ++++++++----------
 2 files changed, 9 insertions(+), 10 deletions(-)
```

## Validation evidence

1. `npm run typecheck` → **0 errors.**
2. `npm run check:stories` → **PASSED — 120 files checked, 0 violations.**
3. `npm run check:i18n` → **PASSED — 2203/2203 keys, all 4 locales match, no new key.**
4. `npm run check:mojibake` → **PASSED — 0 artifacts in 1815 files.**
5. **Critical-flow regression (unchanged-green baseline):**
   - `npx vitest run src/lib/auth/__tests__/browser.smoke.test.ts` → part of the combined run below.
   - `npx vitest run src/modules/auth/actions/__tests__/signUpWithCaptcha.smoke.test.ts` → part of the combined run below.
   - `npx vitest run src/modules/auth/actions/__tests__/requestPasswordReset.smoke.test.ts` → part of the combined run below.
   - `npx vitest run src/components/shared/__tests__/PhoneField.smoke.test.tsx` → part of the combined run below.
   - Combined run: **4 test files, 15/15 tests PASS** (4.43s).
   - `npm run test:header-hydration-id-parity` → **1 test file, 3/3 tests PASS.**
6. **Rendered (live-app, same mechanism as Tasks 633–637):** `npm run dev` (Turbopack, already running on port
   3000), then an ad-hoc Playwright script (`scripts/_ad-hoc-task638-authsheet-combobox-inputlabel-capture.mjs`,
   deleted after use) dispatched the app's own `lero:open-auth-sheet` global event
   (`src/lib/auth/authSheet.ts`) with the same poll-retry-dispatch mechanism as Task 637, and captured
   viewport-only screenshots. 12 screenshots captured across 5 cases (`register-agent`×{uk@320, uk@390, en@1280},
   `login`×{uk@320, en@1280}):
   - `register_agent_uk_320.png` / `register_agent_uk_320_company_open.png` — full form at uk@320 (all `InputLabel`s
     rendered above their controls, no clip/overflow) + the company mobile bottom sheet open ("Оберіть компанію"
     search field, drag handle, "Результатів не знайдено" no-results row — the dev DB currently has 0 companies).
   - `register_agent_uk_390_company_open.png` — same mobile sheet at 390.
   - `register_agent_en_desktop.png` / `_company_open.png` / `_company_filtered.png` /
     `_company_add_new_open.png` — desktop (1280): "Company name (optional)" `InputLabel` above the
     `MantineCombobox` trigger; opened desktop dropdown showing "No results found"; typing "a" updates the trigger
     value and the empty-state persists correctly (filter mechanism proven, even with 0 fixture companies); the
     "+ add new" sub-flow opened (not submitted, to avoid writing test data to the dev database) shows "Logo
     (optional)" rendered visibly smaller/lighter than the 14px/600 `InputLabel`s above it — **L4's compact-Text
     fallback confirmed rendered, not just theorized.**
   - `login_uk_320_password_row.png` / `login_en_desktop_password_row.png` — "Пароль"/"Password" `InputLabel` +
     "Забули пароль?"/"Forgot password?" button on one row, intact at both locale/widths, no clip at uk@320.
   - Console/`pageerror` listener attached on every page: the only entries were the pre-documented benign
     `%c%d font-size:0;color:transparent NaN` dev-tooling marker and, once, the `docs/backlog.md`-documented stale
     Turbopack HMR `useId` hydration-id mismatch (unrelated Header/Footer chrome, does not reproduce against a
     fresh server per the standing note) — **zero errors reference `AuthSheet`, `Combobox`, `MantineCombobox`, or
     `InputLabel`.**
   - **Known evidence gap (documented, not hidden):** the dev database currently has 0 companies, so a literal
     "select a company → `companyId` set" and a real `📷`-logo `description` row could not be captured this
     session. See the negative-flow table above for the code-path equivalence argument. The city select
     (`LocationCombobox`, out of scope, unchanged) has real fixture data but its own select-interaction capture hit
     a scratchpad-harness click-timing issue and was not retried further, since `LocationCombobox` itself is
     untouched by this diff — only its label (L2) is in scope, and that is confirmed rendered.
7. `git status --short` / `git diff --stat` → exactly `src/modules/auth/components/AuthSheet.tsx` +
   `docs/backlog.md` (+ this session log). The ad-hoc Playwright script and all screenshots were written under
   `scripts/`/repo-root as session-scratchpad artifacts and deleted/moved outside the repo tree after use — not
   part of this diff.

## Visual source trace

| Visible artifact/state | Component/markup | Class/selector | Utility, cascade, and token path | Change or preserve | Evidence |
|---|---|---|---|---|---|
| Company-select trigger + dropdown/sheet | `AuthSheet.tsx` `CompanyField`, was `Combobox` (`@/components/shared/Combobox`) → now `MantineCombobox` | `.mantine-TextInput-input` (trigger), `.mantine-Combobox-option`/`Combobox.Dropdown`/`ResponsiveBottomSheet` (was `data-testid="combobox"` hand-rolled markup) | `theme.ts` §6d/§6e input chrome (trigger) + `MantineCombobox.tsx`'s own §6l item/no-results chrome | **Changed** (intended, R1) | Diff; rendered `*_company_open.png`/`_company_filtered.png` |
| L1 login-password label | `AuthSheet.tsx` `LoginView`, was `Label` → now `InputLabel` | `.mantine-InputWrapper-label` (was shadcn `Label` class) | `theme.ts` `InputWrapper.styles.label` (14px/600/gray-7) | **Changed** (intended, R2) | Diff; rendered `login_*_password_row.png` |
| L2 `AgentCityField` label | `AuthSheet.tsx`, was `Label` → now `InputLabel` | `.mantine-InputWrapper-label` | `theme.ts` `InputWrapper.styles.label` | **Changed** (intended, R2) | Diff; rendered full-page captures |
| L3 `CompanyField` label | `AuthSheet.tsx`, was `Label` → now `InputLabel` | `.mantine-InputWrapper-label` | `theme.ts` `InputWrapper.styles.label` | **Changed** (intended, R2) | Diff; rendered full-page captures |
| L4 logo-upload label | `AuthSheet.tsx`, was `Label className="text-xs text-muted-foreground"` → now `Text component="label" size="xs" c="dimmed"` | `.mantine-Text-root` (was shadcn `Label` class) | Mantine `Text` size/color scale (`xs`=12px, `dimmed`=gray-5-equivalent) — NOT `InputWrapper.styles.label` (would force 14px/600/gray-7 via inline style, defeating the compact intent — confirmed via `use-styles.mjs`) | **Changed** (intended, R2, documented fallback) | Diff; rendered `register_agent_en_desktop_company_add_new_open.png` shows it visibly smaller/lighter than the InputLabels above |
| `LocationCombobox`, `PasswordRequirementsHint`, `PasswordInput` (both fields), `TextInput` (all fields), `Button` (all), `Alert` (all four), company `options`/`companyId`/`onCompanyId`, `handleCreate`/`handleCancel`/`handleLogoSelect` | unchanged | unchanged | unchanged | **Preserved, untouched** | `git diff` — outside every hunk; `grep -n "LocationCombobox\|PasswordRequirementsHint"` still matches |
| `theme.ts`, `MantineDrawer.tsx`, `MantineCombobox.tsx`, other consumers, any i18n key | — | — | — | **Out of scope, untouched** | `git diff --stat` |

## Self-review findings

- **No defect found** in the implementation. All typecheck/check:stories/check:i18n/check:mojibake gates and all 5
  named regression commands + hydration-id-parity are green, unchanged.
- Verified the L4 fallback decision on technical grounds rather than guessing or eyeballing: read
  `use-styles.mjs`'s `getStyle()` implementation to confirm `theme.components.InputWrapper.styles` resolves to an
  inline `style` attribute (which always wins over a Tailwind class), then confirmed the compact look in the
  rendered `_company_add_new_open.png` capture — both the code-level mechanism and the rendered outcome agree.
- The dev database has 0 companies, which blocks two negative-flow proofs (select-sets-value, `📷` description
  rendering) that would otherwise be straightforward. Documented explicitly as missing evidence with a code-path
  equivalence argument (identical `handleSelect`/`description`-rendering mechanism already used by `LocationCombobox`
  and other precedent `MantineCombobox` consumers) rather than substituting a confidence claim, per the agent
  contract's clause 9.
- `docs/backlog.md` is now exactly 80 physical lines — **at, not over, the 80-line hard limit.** Not flagging a
  `BACKLOG LIMIT BREACH` (the rule is "at or below 80 lines"), but flagging for the orchestrator that the next
  backlog addition will need a consolidation/archive pass first.

## Assumptions, deviations, and limitations

- `noResultsLabel` is a required prop on `MantineComboboxOption`/`MantineComboboxProps` with no default — the
  kickoff's Combobox→MantineCombobox mapping table did not name it explicitly (it named `options`/`value`/`onChange`/
  `placeholder`/`variant`/dropped `portal`). Supplied `tc('no_results')` (the same `common.no_results` key the
  legacy `Combobox.tsx` used internally via its own `useTranslations('common')`), using the `tc` translator already
  in scope in `CompanyField`. This is a mechanical requirement of the canonical primitive's public API, not a
  behavior change.
- L4 uses `<Text component="label" size="xs" c="dimmed">` instead of `InputLabel`, per the kickoff's own documented
  fallback — confirmed necessary via `use-styles.mjs` (not the kickoff's default `InputLabel` path), and confirmed
  rendered correctly.
- Company-select-sets-value and the `📷` `description` indicator were not directly rendered this session (dev DB has
  0 companies) — code-path equivalence documented above; flagged for the reviewer.
- No `theme.ts`, `MantineCombobox.tsx`, `LocationCombobox.tsx`, `PasswordRequirementsHint`, other consumer, story, or
  i18n key was touched — confirmed via `git diff --stat` and targeted `grep`.
- This is **Slice 2e, the final AuthSheet slice.** `AuthSheet.tsx` no longer imports any base `@/components/ui/*`
  primitive except `PasswordRequirementsHint` (explicitly out of scope, a domain display component) — confirmed via
  the primitive-clearance grep below.
- The ad-hoc Playwright script and all screenshots are scratchpad-only artifacts; deleted from `scripts/` and moved
  outside the repo tree after use, not part of this diff.

## Primitive-clearance proof (R5, final-slice completion criterion)

```
$ grep -n "@/components/ui/\|shared/Combobox" src/modules/auth/components/AuthSheet.tsx
16:import { PasswordRequirementsHint, allPasswordRulesMet } from '@/components/ui/PasswordRequirementsHint'
```

Exactly one match — `PasswordRequirementsHint`, explicitly out of scope. **AuthSheet's base-primitive Mantine
migration is complete.**

## Opus handoff

Diff: `src/modules/auth/components/AuthSheet.tsx` (product code) + `docs/backlog.md` (active-state entry).

Questions/risks for the reviewer to inspect:

1. Confirm the L4 `Text component="label"` fallback (instead of `InputLabel`) is the correct reading of the
   kickoff's own documented fallback condition — evidence is `use-styles.mjs`'s inline-style mechanism plus the
   rendered `_company_add_new_open.png` capture, not a guess.
2. **Confirm the missing rendered proof for company-select-sets-value and the `📷` description indicator (dev DB
   has 0 companies) is an acceptable gap for this review, given the code-path equivalence argument** — this is the
   one Q4 evidence item this session could not produce directly and needs explicit reviewer sign-off or a follow-up
   task (e.g., seed a test company in the dev DB) before final closure.
3. Confirm `noResultsLabel={tc('no_results')}` is the correct binding for `MantineCombobox`'s required prop — not
   named explicitly in the kickoff's mapping table, resolved from the legacy component's own internal use of the
   same `common.no_results` key.
4. Confirm this closes the AuthSheet migration epic (Slices 1–2e all landed) — primitive-clearance grep above.
5. `docs/backlog.md` is now exactly 80 lines (at the hard limit) — flag for a consolidation pass before the next
   task's entry is added.

## Backlog update

`docs/backlog.md` updated: one new Task 638 active-state entry appended after Task 637's line (Task 637's line left
unchanged — Task 636 had already absorbed the "Slice 2d/2e" forward-reference note; Task 637's own line named Slice
2e as remaining, now superseded by this entry). Resulting physical line count: **80 lines** (`wc -l docs/backlog.md`)
— exactly at, not over, the 80-line hard limit. **No `BACKLOG LIMIT BREACH`**, but flagged above for the
orchestrator: the next task's entry will require a consolidation/archive pass first. Full evidence lives in this
session log per the backlog's own rule (concise state only, no history).
