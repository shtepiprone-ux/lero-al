# Task 873 — the password-form family moves onto canonical Mantine: the requirements hint leaves `components/ui`, and both password-change forms are migrated

Sprint 81 · **P2** · QA profile **Q4** (Q3 visual matrix + the "Recovery link → reset" critical flow) · **depends on
872** (both regenerate the same two governance baselines, so run them one after the other) · owner action **O81-3** ·
**Status: ✅ APPROVED WITH NOTES 2026-09-24 (review 5): archived. The owner accepted every O81-3 Storybook tuple. The
live password reset and cabinet change after deploy remain owner action O81-3 in the sprint plan.**

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
| **R5** | *(Amended by §16.2 and §16.3: both reveal toggles get localized labels, and the hint becomes the new-password input's Mantine `description`, replacing the hand-written `aria-describedby`.)* `src/modules/cabinet/components/CabinetPasswordSectionView.tsx` (new, presentational), the same way. It renders the section title, the error alert, the same-password alert (`isSamePassword && !errorKey`), both `PasswordInput`s (refs forwarded from the container; `aria-describedby="cabinet-password-hint"` kept on the new-password input), the hint and a submit `Button fullWidth loading disabled={submitDisabled}`. `CabinetPasswordSection.tsx` keeps its state, `submitDisabled`, `handleSubmit` and error mapping byte-for-byte. | P0 | AC5, AC6 |
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

- **AC1 [R1]** *(Expected result amended by §16.4.)* No file imports `components/ui/PasswordRequirementsHint`: `git grep` with `--untracked` returns 0 hits.
  The new pattern is in the manifest. `check:pattern-enrolment` exits 0.
- **AC2 [R2]** `Mantine/Primitives/PasswordInput` imports `PasswordRequirementsHint` by name and contains no inline
  rule-row markup. The legacy hint story file is gone. `check:story-coverage` exits 0.
- **AC3 [R3]** `MantineAuthFormPattern` renders `MantineAuthCard`. The `AuthCard` story export imports it by name.
  `Patterns/Mantine/AuthFormPattern → Default` renders as before (owner matrix).
- **AC4 [R4]** Neither `ResetPasswordClient.tsx` nor `ResetPasswordView.tsx` imports `@/components/ui/`. The View
  imports no router, auth, Supabase or action module. The container's hook, effect and handler bodies are unchanged
  in the diff.
- **AC5 [R5]** The same holds for the cabinet pair. `aria-describedby` and both refs are preserved. *(Replaced by §16.3
  AC5′ for `aria-describedby`; the refs clause stands.)*
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

## 16. Review 1 — `NEEDS REVISION` (2026-09-24): the re-entry route

Reviewed diff: the working tree on top of `b5074e624`. The final hashes in the session log match the files on disk. Both
smoke tests were re-run by the reviewer natively (`win32`, 8/8 pass). **Re-entry mode: remediation.** Start at §16.6.

**Stays as delivered.** This covers R1–R3, R4 except §16.1, R6's Story set, R7, R8's existing tests and plants, and
R9's doc edits and both baselines. Do not rewrite anything outside §16.1–§16.4.

**Forbidden re-runs:**
- `--update-baseline` on either baseline. Both baselines are final. A changed hash of `scripts/surface-census-baseline.json`
  (`d4973d0c…`) or `scripts/rendered-scope-baseline.json` (`499f3c1e…`) is `SCOPE GUARD FAILED`.
- `npm run catalog:components`. It overwrites three hand-maintained docs (§16.5).
- Any edit to `messages/*.json`, `src/modules/cabinet/actions/**`, or `AuthSheet.tsx`.

### 16.0 Owner decision D81-5 (2026-09-24), verbatim

Asked: keep or drop the link between the cabinet new-password field and its requirements hint, now that Mantine
`PasswordInput` overwrites the hand-written `aria-describedby`. Answer, verbatim:

> *"Обираю 1 — зберегти зв’язок.Це accessibility-регресія P0 у 873: вимоги пароля є інструкціями до поля, тому мають
> лишатися доступними при фокусі. aria-describedby прямо призначений для такого зв’язку. W3C ARIA APG, WCAG 3.3.2У 873
> треба замінити R5/AC5 так:- Для cabinet PasswordInput передати description={<PasswordRequirementsHint
> value={newPassword} />}.- Задати inputWrapperOrder={['label', 'input', 'description', 'error']}, щоб підказка
> залишилася під полем.- Видалити ручні aria-describedby="cabinet-password-hint" і <div id="cabinet-password-hint">.- Не
> додавати фіксований id: Mantine керує ним і зв’язком сам. PasswordInput підтримує можливості Input.Wrapper, включно з
> description та inputWrapperOrder. Mantine PasswordInput, Mantine InputAC5 має перевіряти не конкретний Mantine id, а
> результат у DOM: поле, знайдене за label, має непорожній aria-describedby, що посилається на наявний description-вузол
> з усіма п’ятьма вимогами. Рефи й поведінка submit лишаються без змін.Це застосовується лише до cabinet, бо саме там
> був попередній контракт зв’язку. Невеликий зсув відступів має пройти через існуючу матрицю O81‑3. Клієнтська
> підказка не є security boundary: серверна перевірка password policy у changeCabinetPassword має залишатися
> обов’язковою."*

### 16.1 F1 (P2): raw `gap={6}` in both new Views [R4, R5, AC6, GR-0]

**Observed:**
- `ResetPasswordView.tsx:106` and `CabinetPasswordSectionView.tsx:66` both use `<Stack gap={6}>`.
- The three hint-state Stacks added to `src/stories/mantine/primitives/PasswordInput.stories.tsx` use `<Stack gap={4}>`.
- The session's GR-0 receipt says "new hardcoded visual values: NONE", which these lines contradict.

**The tokens exist.** `src/design-system/mantine/theme.ts`, in `spacing`, defines `compact: '0.375rem' // 6px` and
`tight: '0.25rem' // 4px`. Task 822 replaced exactly this literal with `gap="compact"`.

**Out of scope.** `AuthSheet.tsx` has four pre-existing `gap={6}` sites. This task may change only its import lines
there.

**Correction:**
- In both Views, replace `gap={6}` with `gap="compact"`.
- In the primitives story, replace `gap={4}` with `gap="tight"` in the three hint-state Stacks this task added.
- Change nothing else.

**Verification:** artifact `31-gap-literals.txt` (§16.7) returns no match.

### 16.2 F2 (P2): the cabinet reveal toggles lost their accessible name [R5, §9 "Password reveal", agent-contract 3]

**Observed:**
- `CabinetPasswordSectionView.tsx:56-76` renders both `PasswordInput`s without `visibilityToggleButtonProps`.
- Without that prop, Mantine renders the toggle with `aria-hidden="true"`
  (`node_modules/@mantine/core/esm/components/PasswordInput/PasswordInput.mjs:127`). The reviewer confirmed this with
  an SSR render.
- The legacy toggle (`git show HEAD:src/components/ui/PasswordInput.tsx`, lines 33–37) had
  `aria-label={visible ? t('hide_password') : t('show_password')}` and `aria-pressed`.
- §9 requires the Mantine toggle to carry the same localized labels. `ResetPasswordView.tsx:115-117` already does
  this, using the F4 form.

**Correction:**
1. **View.**
   - Add four props: `currentPasswordVisible: boolean`, `newPasswordVisible: boolean`,
     `onCurrentVisibilityChange: (visible: boolean) => void` and `onNewVisibilityChange: (visible: boolean) => void`.
   - Add `const tc = useTranslations('common')`.
   - Give each `PasswordInput` its `visible`, its `onVisibilityChange` and
     `visibilityToggleButtonProps={{ 'aria-label': <its visible> ? tc('hide_password') : tc('show_password') }}`. This is
     the exact `ResetPasswordView.tsx:115-117` form.
2. **Container (`CabinetPasswordSection.tsx`).**
   - Add exactly two state lines, `const [currentPasswordVisible, setCurrentPasswordVisible] = useState(false)` and the
     matching `newPasswordVisible` line, and pass the four props.
   - Against the current file (`6e21d038…`), the diff must be additions only.
3. **Story.** In `CabinetPasswordSectionView.stories.tsx`, `Demo` holds both visibility states in `useState` and passes
   the four props. Do not add a Story export.

### 16.3 F3 (P0, owner D81-5): the new-password field is no longer linked to its hint [R5, AC5]

**Observed:**
- `CabinetPasswordSectionView.tsx:75` passes `aria-describedby="cabinet-password-hint"`.
- Mantine's `PasswordInput` spreads `...rest` and then sets `"aria-describedby": describedBy`
  (`PasswordInput.mjs:215-216`). That value is `undefined` unless an error or description is present.
- In the rendered DOM, the input therefore has **no** `aria-describedby` (the reviewer's SSR probe). The session log's
  claim that `aria-describedby` was preserved is wrong.

**Correction, per D81-5 (cabinet only; `ResetPasswordView` and `AuthSheet` are unchanged):**
1. Give the new-password `PasswordInput` the following props:
   - `description={<PasswordRequirementsHint value={newPassword} />}`;
   - `inputWrapperOrder={['label', 'input', 'description', 'error']}`;
   - `descriptionProps={hintDescriptionProps}`, where `hintDescriptionProps` is a **module-level constant**,
     `const hintDescriptionProps = { component: 'div' }`.
2. Delete `aria-describedby="cabinet-password-hint"`, the `<div id="cabinet-password-hint">` wrapper and the now-empty
   `<Stack gap=…>` that held the input and hint. Do not set any id; Mantine owns it.
3. **Why the constant is required (reviewer-measured, not optional):**
   - Mantine's `InputDescription` renders `component: "p"` and then spreads `...others`
     (`node_modules/@mantine/core/esm/components/Input/InputDescription/InputDescription.mjs:59-67`).
   - The hint's root is a `Stack` `<div>`, and it contains a `<p>` and a `<ul>`. Left as `<p>`, the result is invalid
     nesting and a React hydration error.
   - SSR probe: without `descriptionProps`, the description root is `p`; with `{ component: 'div' }`, it is `div`, and
     the input gets `aria-describedby="<id>-description"` either way.
   - Typecheck probe: an inline object literal `descriptionProps={{ component: 'div' }}` fails with **TS2769**
     (`'component' does not exist in type 'InputDescriptionProps & DataAttributes'`). The same object as a non-literal
     constant passes `tsc`.
   - **No cast, `any` or `@ts-expect-error`.** If `npm run typecheck` rejects the constant form, STOP and report
     `BLOCKED — §16.3 description root`. Make no other attempt.
4. **The current-password input is unchanged** apart from §16.2. The refs, `submitDisabled`, `handleSubmit` and the
   error mapping stay byte-identical.
5. **Server policy.** `changeCabinetPassword` (`src/modules/cabinet/actions/index.ts:456`) keeps its server-side
   password-policy check. The client hint is not a security boundary. Its diff must stay empty (`35-actions-diff.txt`).

**AC5′ replaces AC5's `aria-describedby` clause.** It is judged by the rendered DOM, never by a Mantine id:
- The input found by its label (`password_new_label` with the test's key-echo `next-intl` mock) has a non-empty
  `aria-describedby`.
- `document.getElementById(<that value>)` exists, is a `DIV`, and contains all five `password_rule_*` keys.
- Both refs still reach their `<input>` (existing behaviour).

### 16.4 F4 (P2): AC1's evidence artifact is missing, and its stated result is false [R1, AC1, R9]

**Observed:**
- The session log cites `03-hint-importers.txt` with "0 hits". No such file exists in
  `docs/sessions/evidence/task873/`.
- The kickoff's exact command, re-run by the reviewer, returns **1 hit**:
  `scripts/surface-census-baseline.json:151`, key
  `src/app/[locale]/layout.tsx :: src/components/ui/PasswordRequirementsHint.tsx :: tier2-legacy-primitive`.
- This is a **carried** key. The mapper excludes a deleted path (`16-census-changed.txt` lists
  `PasswordRequirementsHint.tsx [deleted]`), and `computeReCensusSurfaces` (`scripts/check-surface-census-changed.mjs:152-165`)
  re-censuses a parent only for a *changed candidate*.
- As a result, `[locale]/layout.tsx` was never censused. The row is neither stale nor new, and it retires when that
  surface is next censused. This is the same mechanism as 872's 8 carried keys.
- It may not be removed by hand (§10.4).

**Correction:**
- **AC1's expected result is now:** exactly one hit, and it is that baseline key. Any hit in `src/` or `.storybook/`
  fails AC1.
- Produce `03-hint-importers.txt` with the §13 command.
- Also produce `03b-census-layout.txt`:
  `node.exe scripts\check-surface-census.mjs --surface "src/app/[locale]/layout.tsx"`. It must list **no** node whose
  path contains `components/ui/PasswordRequirementsHint`. Its exit code is recorded, not asserted, because
  `layout.tsx`'s other debt is out of scope.
- Correct the session log's AC1 row to cite both artifacts.

### 16.5 The executor's two questions, and evidence hygiene

1. **`RelativeTime` key drop: accepted.** `src/app/[locale]/cabinet/page.tsx :: src/components/shared/RelativeTime.tsx ::
   tier1-unenrolled-or-unstoried` is paid-off debt. The updater measured it stale on a surface this diff censuses. It
   is an allowed removal under R9's own mechanism. No follow-up is needed.
2. **`npm run catalog:components` overwrites `docs/component-catalog.md`, `component-coverage-matrix.md` and
   `component-risk-register.md`.** The restore was correct. The JSON it also writes is gitignored, so it has no
   committed effect. This is a note, not an 873 defect, and the command is forbidden on re-entry.
3. **Session-log corrections:**
   - `24-status-after.txt` shows `messages/*.json` as modified during the session. `git status` no longer shows them,
     and they have no content diff. Replace the log's "messages/*.json untouched" with that fact.
   - The I0 status/hash snapshot required by §10.1 was not retained (`01-head-before.txt` holds only the SHA). Record
     the gap as-is and do not reconstruct it.
   - Both other dirty paths are unrelated and must not be touched:
     - `docs/sessions/evidence/task861/storybook-dev.log`;
     - `scripts/schema-drift-check.sql` (generated 2026-09-23, before this task).

### 16.6 Re-entry order

1. Record `win32`. Capture `git hash-object` of the 25 files listed in `25-final-hashes.txt` as `30-reentry-start-hashes.txt`.
   Any mismatch with `25-final-hashes.txt` is `PREMISE DRIFT`: stop.
2. §16.1, then §16.2 and §16.3 together in the View, the container and the Story.
3. Tests, in `CabinetPasswordSection.smoke.test.tsx`:
   - Add one `it` for AC5′.
   - Add one `it` for §16.2. For both inputs, the toggle (`.mantine-PasswordInput-visibilityToggle` inside that
     input's `.mantine-PasswordInput-root`) has no `aria-hidden="true"` and `aria-label === 'show_password'`. After
     `fireEvent.click` on the new-password toggle, its label is `'hide_password'` and the input `type` is `text`.
4. **Plants.** Use the Node or Edit tool only, with a `git hash-object` witness before and after each plant:
   - **P3:** remove `description` from the new-password input. The AC5′ test must fail.
   - **P4:** remove `visibilityToggleButtonProps` from the new-password input. The §16.2 test must fail.
   - Restore after each. The hash must match the pre-plant hash.
5. §16.4 artifacts, then §16.7, then the session-log corrections (§16.4, §16.5.3) and the 873 backlog row.

### 16.7 Verification plan (re-entry)

```powershell
$ev = "docs\sessions\evidence\task873"
node.exe -p "process.platform + ' ' + process.version" *>&1 | Tee-Object "$ev\02b-platform-reentry.txt"
git --no-optional-locks grep -n --untracked "components/ui/PasswordRequirementsHint" -- src scripts .storybook *>&1 | Tee-Object "$ev\03-hint-importers.txt"
node.exe scripts\check-surface-census.mjs --surface "src/app/[locale]/layout.tsx" *>&1 | Tee-Object "$ev\03b-census-layout.txt"
git --no-optional-locks grep -n -E "gap=\{[0-9]" -- src/modules/auth/components/ResetPasswordView.tsx src/modules/cabinet/components/CabinetPasswordSectionView.tsx src/stories/mantine/primitives/PasswordInput.stories.tsx *>&1 | Tee-Object "$ev\31-gap-literals.txt"
npm.cmd run test:auth *>&1 | Tee-Object "$ev\32-test-auth.txt"
npx.cmd vitest run src/modules/cabinet/components/__tests__/CabinetPasswordSection.smoke.test.tsx *>&1 | Tee-Object "$ev\33-cabinet-test.txt"
npm.cmd run typecheck *>&1 | Tee-Object "$ev\34-typecheck.txt"
git --no-optional-locks diff --stat -- src/modules/cabinet/actions *>&1 | Tee-Object "$ev\35-actions-diff.txt"
npm.cmd run lint *>&1 | Tee-Object "$ev\36-lint.txt"
npm.cmd run check:story-coverage *>&1 | Tee-Object "$ev\37-story-coverage.txt"
node.exe scripts\check-surface-census.mjs --surface src/modules/cabinet/components/CabinetPasswordSection.tsx *>&1 | Tee-Object "$ev\38-census-cabinet.txt"
npm.cmd run check:surface-census:changed *>&1 | Tee-Object "$ev\39-census-changed.txt"
npm.cmd run check:rendered-scope *>&1 | Tee-Object "$ev\40-rendered-scope.txt"
npm.cmd run check:enrolled-tailwind *>&1 | Tee-Object "$ev\41-enrolled-tailwind.txt"
npm.cmd run build-storybook *>&1 | Tee-Object "$ev\42-build-storybook.txt"
npm.cmd run check:file-integrity *>&1 | Tee-Object "$ev\43-file-integrity.txt"
npm.cmd run check:mojibake *>&1 | Tee-Object "$ev\44-mojibake.txt"
npm.cmd run build *>&1 | Tee-Object "$ev\45-build.txt"
git --no-optional-locks status --porcelain *>&1 | Tee-Object "$ev\46-status-final.txt"
```

**Expected results:**

| Artifact(s) | Expected result |
|---|---|
| `03` | exactly the one §16.4 baseline hit |
| `03b` | no `components/ui/PasswordRequirementsHint` node |
| `31` | no match |
| `32`–`34` | exit 0; `33` has 5 tests |
| `35` | empty |
| `36`, `37` | exit 0 |
| `38` | exit 1, with the single container FAIL (unchanged from AC9) |
| `39`–`45` | exit 0 |
| `39` | "Blocks new: 0" |
| both baseline hashes | unchanged |

Add the final `git hash-object` of every changed file to the session log in the same pass. The Storybook build
does **not** prove the visual result. **O81-3** remains the owner's, and `CabinetPasswordSectionView` must be reviewed
after this revision because §16.2 and §16.3 change its markup.

### 16.8 Completion report (re-entry)

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`.

Report:
- §16.1–§16.4, one line each, with its artifact;
- the P3/P4 plant records with their hashes;
- the start-hash comparison;
- every command's exit code.

Update the 873 backlog row. Append a "Revision 1" section to the existing session log; do not write a new log.

## 17. Review 3 — `NEEDS REVISION` (2026-09-24): the O81-3 result, and a Story-only re-entry

**Reviewed state.** Revision 1 (§16) and revision 2 are both verified:
- Revision 2 found the AC5′ field by its label, re-ran the P3 plant (`plant-p3b-*`, hash `209de828…` restored) and
  corrected the session log.
- The files carry these production hashes: `CabinetPasswordSectionView.tsx` `209de828…`,
  `CabinetPasswordSection.tsx` `e979b4b4…` and `ResetPasswordView.tsx` `310c3b4e…`.
- Leave those three files unchanged.

### 17.1 The owner's O81-3 result (2026-09-24), verbatim

> *"Візуально все ок, переклади вірні. Одна лише сторі зламана"*

The screenshot showed `Patterns/Mantine/CabinetPasswordSectionView → Empty` at 320px in `uk`. Every other O81-3 tuple
is **accepted**: `ResetPasswordView` (8 states), `Mantine/Primitives/PasswordInput` (hint states) and
`AuthFormPattern` (`Default`, `AuthCard`), in all four locales at 320 and 1440.

### 17.2 F5 (P2): the `CabinetPasswordSectionView` Story renders the bare section edge-to-edge [R6, AC7, O81-3]

**Observed, in the screenshot and in the source:**
- The title, both labels, both inputs, the hint and the submit button start at x = 0 of the 320px canvas, with no
  gutter and no page surface.
- The Story sets `skipCanvas: true`. That turns off the legacy `.container-wide` wrapper (`.storybook/preview.tsx`,
  `withCanvas`).
- It then renders `<CabinetPasswordSectionView>` bare. There is no `MantineStoryShell` and no other canonical
  harness, so nothing supplies a gutter.
- In production, the gutter comes from the parent: the section renders inside `ProfileTab.tsx:431`. The View
  correctly has no outer padding of its own.
- `ResetPasswordView` does not have this problem, because its own `Center p="md"` is part of the page View.

**Correction (Story only):**
- In `src/stories/patterns/mantine/CabinetPasswordSectionView.stories.tsx`, wrap the View rendered by `Demo` in the
  shared Storybook harness `MantineStoryShell` (`src/stories/mantine/_MantineStoryShell.tsx`). Import it from
  `'../../mantine/_MantineStoryShell'`, the same way `Patterns/Mantine/SaveSearchButton` does
  (`SaveSearchButton.stories.tsx:62-72`).
- All seven exports render through `Demo`, so this one change covers every state.
- Keep `skipCanvas: true` and `layout: 'fullscreen'`.
- **Forbidden:**
  - any change to `CabinetPasswordSectionView.tsx` or the container;
  - a local `Box`/`p`/`px`/`style` wrapper;
  - `layout: 'padded'`, which the lint gate forbids;
  - a new Story export.

**Verification:**

```powershell
$ev = "docs\sessions\evidence\task873"
git --no-optional-locks hash-object src/modules/cabinet/components/CabinetPasswordSectionView.tsx src/modules/cabinet/components/CabinetPasswordSection.tsx *>&1 | Tee-Object "$ev\50-view-hashes.txt"
npm.cmd run typecheck *>&1 | Tee-Object "$ev\51-typecheck.txt"
npm.cmd run lint *>&1 | Tee-Object "$ev\52-lint.txt"
npm.cmd run check:story-coverage *>&1 | Tee-Object "$ev\53-story-coverage.txt"
npm.cmd run build-storybook *>&1 | Tee-Object "$ev\54-build-storybook.txt"
npm.cmd run check:file-integrity *>&1 | Tee-Object "$ev\55-file-integrity.txt"
npm.cmd run build *>&1 | Tee-Object "$ev\56-build.txt"
```

**Expected results:**
- `50` prints `209de828db6ed98eb2ab6c7a8858d82914419640` and `e979b4b49571567fa474103e26beae6c6f87fc03`, unchanged.
- `51` to `56` exit 0.
- The final `git hash-object` of the Story file goes in the session log.

**Owner re-check (O81-3, narrowed):** `Patterns/Mantine/CabinetPasswordSectionView`, all 7 states × `sq`/`en`/`uk`/`it`
× 320 and 1440. Nothing else is re-reviewed. After deploy, the owner still does one real password reset and one
cabinet password change. That becomes a separate owner action once 873 is approved.

### 17.3 Completion report (re-entry)

Report:
- the Story diff;
- `50`–`56`, with their exit codes;
- the Story's final hash.

Append a "Revision 3" section to the existing session log and update the 873 backlog row. Status:
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.
