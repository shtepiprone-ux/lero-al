# Task 873 — the password-form family moves onto canonical Mantine: the requirements hint leaves `components/ui`, and both password-change forms are migrated

Sprint 81 · **P2** · QA profile **Q4** (Q3 visual matrix + the "Recovery link → reset" critical flow) · **depends on
872** (both regenerate the same two governance baselines, so run them one after the other) · owner action **O81-3** ·
**Status: 📝 KICKOFF FILED 2026-09-24 — READY FOR SONNET after 872 is approved**

Sprint plan: [`Sprint_81_Signing_Out_Keeps_You_Where_You_Were.md`](Sprint_81_Signing_Out_Keeps_You_Where_You_Were.md).
Owner decision **D81-3** (2026-09-24), in response to *"Який обсяг у задачі 873?"*, verbatim: *"Вся форма пароля
(Recommended)"*. The option read: *"873 переносить підказку, замінює старий PasswordInput на Mantine і мігрує обидві
форми зміни пароля (ResetPasswordClient і CabinetPasswordSection) з власними stories. PhoneField просто додається в
manifest."*

## 1. Mode and task type

`IMPLEMENTATION` / Mantine migration of two visible surfaces, one primitive relocation, one pattern extension and one
manifest enrolment. Bundles: **UI migration** (`docs/mantine-responsive-design-system.md`,
`docs/tailadmin-style-reference.md`, `docs/component-rules.md`, `docs/storybook-governance.md`), **Auth** (the
recovery flow), and **Regression / Critical Flow Coverage**.

## 2. Objective

1. `PasswordRequirementsHint` moves from `src/components/ui/` to
   `src/design-system/mantine/patterns/PasswordRequirementsHint.tsx`. It is enrolled, and its canonical Story renders
   the real component. The duplicated rule rows in `Mantine/Primitives/PasswordInput` go away.
2. `ResetPasswordClient` and `CabinetPasswordSection` are split into a container and a presentational View
   (`docs/component-rules.md` → Container/Presentational). The Views are built only from canonical Mantine sources:
   native `PasswordInput`/`Alert`/`Button`/`InputLabel`, the moved hint and the auth card chrome. Neither form still
   imports `@/components/ui/*`.
3. The auth card chrome (`Paper` + `authFormMaxWidth`) is shared: extracted once from `MantineAuthFormPattern`, never
   copied.
4. ~~`PhoneField` is enrolled in the manifest.~~ **Moved to 872** (its amendment 1 enrols `PhoneField` and
   `LocaleSwitcher`). 873 runs after 872, so `PhoneField` is already enrolled when 873 starts.
5. Every behaviour of both forms is preserved (§9), including the recovery flow's prefetch-safe verify-on-submit.

## 3. Verified context — measured 2026-09-24 (re-measure at I0)

- **F1. Hint.** `src/components/ui/PasswordRequirementsHint.tsx`
  - Mantine-native (`Group`/`Stack`/`Text`, theme tokens `passwordHintRow`/`authNoteParagraph`); 0 `className`.
  - Re-exports `checkPasswordRules`/`allPasswordRulesMet` from `@/lib/passwordRules`.
  - **Importers:** `AuthSheet.tsx:17`, `ResetPasswordClient.tsx:12`, `CabinetPasswordSection.tsx:10`,
    `src/components/ui/PasswordInput.stories.tsx:7`, `src/components/ui/PasswordRequirementsHint.stories.tsx:2`.
  - Test mock: `ResetPasswordClient.smoke.test.ts:101`.
  - Path comments: `src/design-system/mantine/theme.ts:139,141`.
  - Governance artifacts: `scripts/governance/reports/component-catalog.latest.json`;
    `scripts/surface-census-baseline.json` (4 tier-2 keys); `scripts/rendered-scope-baseline.json` (1 edge).
  - Docs: `docs/component-catalog.md:41`, `docs/component-coverage-matrix.md:26`,
    `docs/responsive-storybook-inventory.md:28`, `docs/component-risk-register.md:148`,
    `docs/storybook-governance.md:445` and `:2506`, `docs/tailwind-governance.md:387`,
    `docs/mantine-tailadmin-migration-tracker.md:87` (historical per its banner).
  - Its Story `src/components/ui/PasswordRequirementsHint.stories.tsx` has the legacy title
    `Primitives/PasswordRequirementsHint`.
- **F2. Duplicate.** `src/stories/mantine/primitives/PasswordInput.stories.tsx` (`Mantine/Primitives/PasswordInput`)
  re-implements the five rule rows inline from `checkPasswordRules` instead of rendering the hint.
- **F3. Legacy `src/components/ui/PasswordInput.tsx`.** It wraps shadcn `Input`, has 5 `className`, and uses
  `inputState` for a red/green ring. Its importers are `ResetPasswordClient.tsx:11`, `CabinetPasswordSection.tsx:9`,
  `AdminExchangeProvidersManager.tsx:11` (**stays**, see §8) and its own legacy story.
- **F4. Canonical composition.** `AuthSheet.tsx` register view (`:726-740`) renders native Mantine `PasswordInput`
  (`label`, `visible`/`onVisibilityChange`, and `visibilityToggleButtonProps` with `common.hide_password` /
  `show_password`) followed by `<PasswordRequirementsHint>`. It shows **no** success/error ring while typing.
  - Errors use `<Alert color="red">` (`:105`, `:669`) and submit uses `<Button fullWidth loading>`.
  - `input-chrome.css:35-49` gives `PasswordInput` a `data-error` red border; **no success state exists** anywhere in
    the chrome.
- **F5. `ResetPasswordClient.tsx`** (199 lines): a container (router, `getSession`/`verifyOtp`/`updatePassword`/
  `signOut`, effects) that also holds all the JSX.
  - 24 `className`; ui imports `button`, `label`, `alert`, `PasswordInput`, hint; `lucide` `Loader2`/`CheckCircle2`/
    `XCircle`.
  - Four page states: `loading`, `expired`, `success`, `form`.
  - Critical flow "Recovery link → reset" (`docs/critical-flow-registry.md:32`). Its smoke test
    `src/modules/auth/components/__tests__/ResetPasswordClient.smoke.test.ts` mocks the five ui modules by path
    (`:75-102`).
- **F6. `CabinetPasswordSection.tsx`** (143 lines): a container (`changeCabinetPassword`, `signOut`, `toast`, refs)
  that also holds all the JSX.
  - 9 `className`; the same ui imports.
  - Error mapping `invalid_current`/`weak_password`/`same_password`/`rate_limited`/`session_expired`/`server_error`,
    the same-password inline alert, and a 30 s rate-limit cooldown.
  - No critical-flow row and no test today.
- **F7. Auth card.** `MantineAuthFormPattern.tsx` wraps its form in
  `<Paper shadow="sm" p="xl" radius="md" withBorder w="100%" maw={{ base: '100%', sm: theme.other.layout.authFormMaxWidth }}>`
  and owns a login/register `useForm`, so it is not reusable as a whole. Its Story is
  `Patterns/Mantine/AuthFormPattern`.
- **F8. Census 2026-09-24:**
  - `AuthSheet` fails `CaptchaWidget` and `PhoneField` (both enrolled by 872, amendment 1) and the hint (tier-2).
    Census transcripts are read **in full**, never truncated (872 amendment 1).
  - `ResetPasswordClient` and `CabinetPasswordSection` each fail themselves (tier-1) plus the ui `alert`, `button`,
    `label`, `PasswordInput` and hint (tier-2).
- **F9.** The census classifies tier-2 purely by path prefix (`scripts/check-surface-census.mjs:56`
  `TIER2_PREFIX = 'src/components/ui/'`). Moving a file out of the prefix changes its classification, which is the
  Task 813 precedent (`Sprint_75_kickoff_prompt_Task_813_AppImage_Tier2_Root_Cause.md`).

## 4. Requirements

| ID | Observable requirement | P | AC |
|---|---|---|---|
| **R1** | Create `src/design-system/mantine/patterns/PasswordRequirementsHint.tsx`, **byte-identical in render** to the old file, with one exception: it **drops the helper re-export** (single source is `@/lib/passwordRules`). Delete `src/components/ui/PasswordRequirementsHint.tsx`. Update every importer from F1 (helpers from `@/lib/passwordRules`, the component from the pattern path). Update the patterns barrel if the other patterns are exported there. Add a manifest entry. Update the two path comments in `theme.ts`. | P0 | AC1 |
| **R2** | Extend `Mantine/Primitives/PasswordInput` (`src/stories/mantine/primitives/PasswordInput.stories.tsx`) so it imports `PasswordRequirementsHint` by name and renders the **real** hint in place of the inline rows (F2). Add one state each: empty, partial (`'Abc'`), all-met (`'Sample123!'`). Delete `src/components/ui/PasswordRequirementsHint.stories.tsx` (legacy title, no parallel page). In `src/components/ui/PasswordInput.stories.tsx`, change only the hint import to the new path. | P0 | AC2 |
| **R3** | Auth card. Extract the `Paper` from F7 into an exported `MantineAuthCard({ children })`, **in the same file** `MantineAuthFormPattern.tsx`, with identical props and token path. `MantineAuthFormPattern` renders it; its rendered output must not change. Add an `AuthCard` export to `Patterns/Mantine/AuthFormPattern` that imports `MantineAuthCard` by name. | P0 | AC3 |
| **R4** | `src/modules/auth/components/ResetPasswordView.tsx` (new, presentational: props only, no router, auth or network). Props: `pageState`, `password`, `errorKey`, `submitting`, `allMet`, `passwordVisible`, `onPasswordChange`, `onVisibilityChange`, `onSubmit`, `onRequestNew`, `onGoLogin`. Built from `MantineAuthCard` and native Mantine `Stack`/`Title`/`Text`/`Alert color="red"`/`PasswordInput`/`Button fullWidth loading`/`Loader`/`ThemeIcon` or lucide icons sized from `theme.other.iconSize`. The pattern is F4's: `label`, `visible`/`onVisibilityChange`, `visibilityToggleButtonProps` with the existing `common.hide_password`/`show_password` keys, then `<PasswordRequirementsHint>`. **No success/error ring** (F4: no canonical success state; the hint carries validity). `ResetPasswordClient.tsx` keeps **every** hook, effect and handler byte-for-byte and renders `<ResetPasswordView …/>` only. | P0 | AC4, AC6 |
| **R5** | `src/modules/cabinet/components/CabinetPasswordSectionView.tsx` (new, presentational), the same way. It renders the section title, the error alert, the same-password alert (`isSamePassword && !errorKey`), both `PasswordInput`s (refs forwarded from the container; `aria-describedby="cabinet-password-hint"` kept on the new-password input), the hint and a submit `Button fullWidth loading disabled={submitDisabled}`. `CabinetPasswordSection.tsx` keeps its state, `submitDisabled`, `handleSubmit` and error mapping byte-for-byte. | P0 | AC5, AC6 |
| **R6** | New canonical Stories (GR-3a: CREATE, zero candidates import either View). `src/stories/patterns/mantine/ResetPasswordView.stories.tsx` (`Patterns/Mantine/ResetPasswordView`): `Loading`, `Expired`, `Success`, `FormEmpty`, `FormPartial`, `FormAllMet`, `FormError`, `FormSubmitting`. `src/stories/patterns/mantine/CabinetPasswordSectionView.stories.tsx` (`Patterns/Mantine/CabinetPasswordSectionView`): `Empty`, `NewPartial`, `ReadyToSubmit`, `SamePassword`, `ErrorInvalidCurrent`, `RateLimited`, `Submitting`. Fixture props only; locale and viewport come from the toolbar. Manifest entries for both Views. | P0 | AC7 |
| **R7** | *(Withdrawn: `PhoneField` enrolment moved to 872, amendment 1.)* At I0, confirm that `PhoneField`, `LocaleSwitcher` and `CaptchaWidget` are already in the manifest. If they are not, 872 has not landed: stop. | P1 | AC7 |
| **R8** | `ResetPasswordClient.smoke.test.ts`: remove the stale ui mocks, render inside the project's Mantine test wrapper (use the one existing tests already use; search for it first), and keep every existing assertion meaningful. **Add** a planted-failure proof: comment out the verify-on-submit call and the test must fail. Also add `src/modules/cabinet/components/__tests__/CabinetPasswordSection.smoke.test.tsx`, which asserts submit is disabled for the same password, mapping `invalid_current` shows the alert, and success calls `signOut('global')`. | P0 | AC8 |
| **R9** | The rename audit (agent-contract 9). Update each F1 doc line and regenerate `component-catalog.latest.json` with the command that produced it (find it; do not hand-edit). `docs/mantine-tailadmin-migration-tracker.md` is historical: leave it. Regenerate both baselines with their own `--update-baseline` (as in 872 R6). The diff may only **remove** these keys: the hint keys (all surfaces); and the `PasswordInput`/`alert`/`button`/`label` keys under the two form surfaces. 872 does **not** clear every `PhoneField`/`CaptchaWidget`/`LocaleSwitcher` key: its diff-scoped updater leaves 8 carried (872 kickoff §17.1 F9). Any of those 8 whose surface this diff censuses goes stale, and dropping it is an **allowed removal**. `AuthSheet.tsx` × `CaptchaWidget` and `PhoneField` are expected; `[locale]/cabinet/page.tsx` × `PhoneField` is possible. Name each one dropped in the session log. The `ResetPasswordClient`/`CabinetPasswordSection` tier-1 keys **stay**: after the split they are container-exempt debt under GR-1, and the census cannot recognise the split. Any added key → `SCOPE GUARD FAILED`. | P0 | AC9 |

## 5. Assumptions and open questions

1. **DECIDED (D81-3):** full form scope.
2. **DECIDED by the canonical composition (F4), not invented:** the red/green ring on the new-password field is
   removed. This is a **visible change**, reviewed in O81-3.
3. **ASSUMED, re-measured at I0:** 872 has landed. The census and baselines are measured after it.
4. **Legacy stays:** `src/components/ui/PasswordInput.tsx` stays for its admin consumer. **874** is filed for it.
   `alert`/`button`/`label` stay because they are consumed repo-wide. This task's surfaces stop importing all of
   them (GR-1 tier-2).

## 6. Pre-read rule bundle

- `docs/golden-rules.md`: all of it (GR-0 to GR-6, including the container exemption in GR-1).
- `docs/agent-contract.md`: clauses 3–7, 9, 11–16d.
- `docs/component-rules.md`: Container/Presentational, Storybook-First, Canonical UI Discovery.
- `docs/mantine-responsive-design-system.md`: forms, inputs, `AuthFormPattern` row.
- `docs/tailadmin-style-reference.md`: §6 Input, card.
- `docs/storybook-governance.md`: story creation and manifest enrolment.
- `docs/critical-flow-registry.md`: "Recovery link → reset".
- `docs/qa-profiles.md`: Q3, Q4.
- Task 813's kickoff §3 (the relocation precedent).

## 7. Scope

Files the executor may create, change or delete:
- the new hint pattern, and deletion of the old hint and its legacy story;
- `MantineAuthFormPattern.tsx` (R3 only), and the patterns barrel if applicable;
- `ResetPasswordClient.tsx`, `ResetPasswordView.tsx` *(new)*, `CabinetPasswordSection.tsx`,
  `CabinetPasswordSectionView.tsx` *(new)*;
- `AuthSheet.tsx` (import lines only);
- the three stories named in R2/R3, and the two new stories;
- `src/components/ui/PasswordInput.stories.tsx` (import line only);
- `theme.ts` (the two comments only);
- `scripts/mantine-migration-scope.json`, the two baselines, and `component-catalog.latest.json` (regenerated);
- the two smoke tests;
- the F1 doc lines;
- `docs/critical-flow-registry.md` ("Recovery link → reset" row: new test file/command if they change);
- the session log, `docs/sessions/evidence/task873/**`, and the 873 backlog row.

## 8. Out of scope

- `src/components/ui/PasswordInput.tsx` and `AdminExchangeProvidersManager.tsx` (874).
- `src/components/ui/{alert,button,label,input}.tsx`.
- Any locale key: reuse the existing `auth.*`, `cabinet.*` and `common.*` keys. If one is missing, **stop**.
- Any server action, auth call or route file.
- `CaptchaWidget` (872).

## 9. Current behavior to preserve / required after

| | Preserve | After |
|---|---|---|
| Recovery: token-hash path | verifyOtp only on submit (N1); expired on a verify error (N2); generic error on an update error (N4); double-submit guard (N5); `signOut()` after success | identical |
| Recovery: session path | `getSession` → form or expired | identical |
| Reset states | loading / expired (Request new → `/<l>`) / success (Go to login → `/<l>/auth/login`) / form | same four states in `MantineAuthCard` |
| Reset submit | disabled until all rules are met or while submitting | identical (Button `loading` replaces the spinner) |
| Cabinet submit | disabled per `submitDisabled` | identical |
| Cabinet errors | six mapped keys; focus moves to the relevant input; 30 s cooldown; `signOut('local')` after 2 s on `session_expired` | identical |
| New-password ring | red / green ring | **removed** (hint only), per F4 |
| Password reveal | a custom toggle with `aria-pressed` | the Mantine toggle with the same localized `aria-label`s |
| Mobile < 640 | full-width fields and button | full-width (clause 11), ≥44px inputs (theme) |

## 10. Implementation order

1. I0: record `win32`; save a status snapshot with hashes; re-run the three F8 censuses and the F1 importer grep. A
   different importer set means `PREMISE DRIFT`: stop.
2. Emit the GR-0 and GR-3a receipts:
   - hint → EXTEND `Mantine/Primitives/PasswordInput`;
   - card → EXTEND `MantineAuthFormPattern`;
   - Views → CREATE (zero candidates).
3. R1 → R2 → R3 (Story first), then R4/R5 Views, then R6 Stories, then rewire the containers, then R7, then R8
   tests, then R9 audit and baselines, then §13 gates.
4. Read and write every file through Node/`fs` or the Edit tool (UTF-8). **No hand edits to baseline JSON.**

## 11. Positive and negative flows

**Positive.** A recovery link opens the form. The user types a password; the hint turns green rule by rule; submit
enables; the password is saved; the success state appears.

| Branch | Applicable | Expected | Evidence |
|---|---:|---|---|
| Expired / used recovery token | Yes | expired state | smoke test + `Expired` story |
| Update error after a valid verify | Yes | generic alert | smoke test + `FormError` story |
| Double submit | Yes | ignored | smoke test |
| Cabinet same password | Yes | inline alert, submit disabled | new test + `SamePassword` story |
| Cabinet rate limited | Yes | alert + 30 s disabled | `RateLimited` story + code diff (handler unchanged) |
| Mobile 320 | Yes | no overflow, full width | O81-3 matrix |

## 12. Acceptance criteria

- **AC1 [R1]** No file imports `components/ui/PasswordRequirementsHint`: `git grep` with `--untracked` returns 0 hits.
  The new pattern is in the manifest. `check:pattern-enrolment` exits 0.
- **AC2 [R2]** `Mantine/Primitives/PasswordInput` imports `PasswordRequirementsHint` by name and contains no inline
  rule-row markup. The legacy hint story file is gone. `check:story-coverage` exits 0.
- **AC3 [R3]** `MantineAuthFormPattern` renders `MantineAuthCard`. The `AuthCard` story export imports it by name.
  `Patterns/Mantine/AuthFormPattern → Default` renders as before (owner matrix).
- **AC4 [R4]** Neither `ResetPasswordClient.tsx` nor `ResetPasswordView.tsx` imports `@/components/ui/`. The View
  imports no router, auth, Supabase or action module. The container's hook, effect and handler bodies are unchanged
  in the diff.
- **AC5 [R5]** The same holds for the cabinet pair. `aria-describedby` and both refs are preserved.
- **AC6 [R4, R5]** `className` count in both Views and both containers = 0. No raw hex/px/rem values. Icon sizes come
  from theme tokens.
- **AC7 [R6, R7]** Both new Stories render every listed state. Each imports its View by name. The manifest has both
  Views. `PhoneField` was already enrolled by 872 (confirmed at I0).
- **AC8 [R8]** Both smoke tests pass. The planted verify-on-submit removal fails the recovery test and the restore
  hash matches the pre-plant hash. `npm.cmd run test:auth` exits 0.
- **AC9 [R9]**
  - Each baseline diff contains only removals from R9's list.
  - Census results:
    - `AuthSheet.tsx`: no FAIL (872 has landed, so `CaptchaWidget` is enrolled).
    - `ResetPasswordClient.tsx` and `CabinetPasswordSection.tsx`: exactly one FAIL each, on the container node itself.
      Each container must meet all three GR-1 container-exemption conditions (0 `className`, 0 ui imports, renders
      only its enrolled, storied View), and the session log proves each condition.
    - No `tier2-legacy-primitive` line on any of the three.
  - `check:rendered-scope`, its `:verify`, `check:surface-census:changed` and its `:verify` exit 0.
- **AC10 [all]** `typecheck`, `lint`, `check:i18n`, `build-storybook`, `check:file-integrity`, `check:mojibake` and
  `npm run build` all exit 0. No path outside §7 changes beyond the I0 snapshot.

`GR-4 AC AUDIT — 10 criteria; each states an observable property; absolutes: none. AC6's "0 className" is the migration target of a file the task rewrites, AC1's "0 hits" is measured with --untracked so it cannot be vacuous (864).`

`GR-1 CENSUS COMPLETE (design-time) — AuthSheet 9 nodes / ResetPasswordClient 6 / CabinetPasswordSection 6; tier1 2 migrated+enrolled+story here (ResetPasswordView, CabinetPasswordSectionView) + 2 container-exempt after the split (ResetPasswordClient, CabinetPasswordSection); CaptchaWidget, PhoneField → 872; tier2 5 imports removed from these surfaces (alert, button, label, PasswordInput, hint — the hint file itself relocated out of the prefix; the PasswordInput file stays for its admin consumer → 874; alert/button/label files are consumed repo-wide); tier3 0.`

## 13. QA profile and verification plan

**Q4.** Critical flow, plus Q3 for the new and migrated visible artifacts.

```powershell
$ev = "docs\sessions\evidence\task873"
node.exe -p "process.platform + ' ' + process.version" *>&1 | Tee-Object "$ev\02-platform.txt"
git --no-optional-locks grep -n --untracked "components/ui/PasswordRequirementsHint" -- src scripts .storybook *>&1 | Tee-Object "$ev\03-hint-importers.txt"
npm.cmd run test:auth *>&1 | Tee-Object "$ev\04-test-auth.txt"
npx.cmd vitest run src/modules/cabinet/components/__tests__/CabinetPasswordSection.smoke.test.tsx *>&1 | Tee-Object "$ev\05-cabinet-test.txt"
npm.cmd run typecheck *>&1 | Tee-Object "$ev\06-typecheck.txt"
npm.cmd run lint *>&1 | Tee-Object "$ev\07-lint.txt"
npm.cmd run check:i18n *>&1 | Tee-Object "$ev\08-i18n.txt"
npm.cmd run check:story-coverage *>&1 | Tee-Object "$ev\09-story-coverage.txt"
npm.cmd run check:pattern-enrolment *>&1 | Tee-Object "$ev\10-pattern-enrolment.txt"
node.exe scripts\check-surface-census.mjs --surface src/modules/auth/components/AuthSheet.tsx *>&1 | Tee-Object "$ev\11-census-authsheet.txt"
node.exe scripts\check-surface-census.mjs --surface src/modules/auth/components/ResetPasswordClient.tsx *>&1 | Tee-Object "$ev\12-census-reset.txt"
node.exe scripts\check-surface-census.mjs --surface src/modules/cabinet/components/CabinetPasswordSection.tsx *>&1 | Tee-Object "$ev\13-census-cabinet.txt"
npm.cmd run check:rendered-scope *>&1 | Tee-Object "$ev\14-rendered-scope.txt"
npm.cmd run check:rendered-scope:verify *>&1 | Tee-Object "$ev\15-rendered-scope-verify.txt"
npm.cmd run check:surface-census:changed *>&1 | Tee-Object "$ev\16-census-changed.txt"
npm.cmd run check:surface-census:changed:verify *>&1 | Tee-Object "$ev\17-census-changed-verify.txt"
git --no-optional-locks diff -- scripts/rendered-scope-baseline.json scripts/surface-census-baseline.json *>&1 | Tee-Object "$ev\18-baseline-diff.txt"
npm.cmd run build-storybook *>&1 | Tee-Object "$ev\19-build-storybook.txt"
npm.cmd run check:file-integrity *>&1 | Tee-Object "$ev\20-file-integrity.txt"
npm.cmd run check:mojibake *>&1 | Tee-Object "$ev\21-mojibake.txt"
npm.cmd run build *>&1 | Tee-Object "$ev\22-build.txt"
git --no-optional-locks status --porcelain *>&1 | Tee-Object "$ev\23-status-after.txt"
```

Expected results:
- `03` has no match.
- `04`–`10` exit 0.
- `11` exits 0; `12` and `13` exit 1 with only the container FAIL (AC9).
- `14`–`17` exit 0.
- `18` shows only R9 removals.
- `19`–`22` exit 0.

Add `git hash-object` of every changed or new file to the session log in the same pass.

**O81-3. OWNER VISUAL QA REQUIRED.** Every tuple is × locales `sq`/`en`/`uk`/`it` × viewports 320 and 1440, recorded
as accepted or returned:
- `Patterns/Mantine/ResetPasswordView` (8 states);
- `Patterns/Mantine/CabinetPasswordSectionView` (7 states);
- `Mantine/Primitives/PasswordInput` (3 hint states);
- `Patterns/Mantine/AuthFormPattern` (`Default` and `AuthCard`).

Then, on the live site after deploy:
- request a password-reset e-mail and complete the reset;
- change the password in the cabinet (you are signed out afterwards, as today).

## 14. Completion report contract

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` / `PARTIALLY IMPLEMENTED` / `BLOCKED`. Report:
- files with hashes;
- R1–R9 / AC1–AC10;
- every command's exit code;
- I0 censuses before and after;
- the GR-0, GR-3a and GR-1 receipts;
- the plant record;
- the baseline diff summary;
- the doc audit list;
- deviations.

Update the 873 backlog row. Write the session log with a Files Changed table.

## 15. Task quality gate

| Check | Result |
|---|---|
| Executable without chat context | Yes — facts with file:line; D81-3 quoted |
| Canonical sources | native Mantine inputs per `AuthSheet` (F4); hint pattern; auth card extracted, not copied; no new visual value |
| Container split | both forms split; containers keep behaviour byte-for-byte and become container-exempt |
| Two-armed control | recovery verify-on-submit plant (AC8); baseline diff restricted to named removals |
| Detector blind spots | Census tier-2 is path-only (F9). The container exemption is a rule, not a census feature. The drift from the removed ring is visible and owner-reviewed. |
| Owner decisions quoted | D81-3 (scope); the ring removal follows the canonical composition, and the owner matrix reviews it |
