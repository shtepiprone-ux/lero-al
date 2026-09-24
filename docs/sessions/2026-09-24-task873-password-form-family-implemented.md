# Task 873 — the password-form family moves onto canonical Mantine — IMPLEMENTED

**Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`** (superseded by Revision 1 below — see that section for the current state)

Kickoff: [`Sprint_81_kickoff_prompt_Task_873_Password_Form_Family_On_Mantine.md`](../../tasks/Sprints/Sprint_81_kickoff_prompt_Task_873_Password_Form_Family_On_Mantine.md).
Platform: `win32` (`node v22.22.3`). Evidence directory: `docs/sessions/evidence/task873/`.
I0 base commit (pre-implementation `HEAD`): `b5074e624d727a2212a1245898af980effc2e9c2`.

## CANONICAL REUSE PREFLIGHT LOADED — docs/golden-rules.md GR-0; docs/agent-contract.md 16b–16c.

## Preflight receipts (as required by kickoff §10.2)

`GR-0 CANONICAL REUSE PREFLIGHT — request: PasswordRequirementsHint pattern; semantic queries: "password requirements hint", "password rules feedback"; inspected candidates: src/components/ui/PasswordRequirementsHint.tsx (legacy, being relocated), src/stories/mantine/primitives/PasswordInput.stories.tsx (Mantine/Primitives/PasswordInput — inline rule rows, no real hint); decision: EXTEND (Mantine/Primitives/PasswordInput now imports and renders the real hint by name); selected canonical owner: src/design-system/mantine/patterns/PasswordRequirementsHint.tsx; Mantine/TailAdmin token path: theme.other.lineHeight.{passwordHintRow,authNoteParagraph}, theme.other.iconSize.compact; new hardcoded visual values: NONE; rationale: kickoff R1/R2 name this disposition explicitly; the hint's own render is byte-identical to its pre-move form.`

`GR-0 CANONICAL REUSE PREFLIGHT — request: auth card chrome; semantic queries: "auth card", "auth form paper wrapper"; inspected candidates: src/design-system/mantine/patterns/MantineAuthFormPattern.tsx (Paper wrapper, not previously exported standalone); decision: EXTEND (Paper extracted into an exported MantineAuthCard in the same file, MantineAuthFormPattern now renders it); selected canonical owner: src/design-system/mantine/patterns/MantineAuthFormPattern.tsx; Mantine/TailAdmin token path: theme.other.layout.authFormMaxWidth; new hardcoded visual values: NONE; rationale: kickoff R3 names this disposition explicitly; MantineAuthFormPattern's rendered output is unchanged (same Paper props, same token).`

`GR-0 CANONICAL REUSE PREFLIGHT — request: ResetPasswordView / CabinetPasswordSectionView; semantic queries: "password reset view", "cabinet password section view", "auth form view"; inspected candidates: none render either surface's exact state set — MantineAuthFormPattern (login/register only), MantineEmptyLoadingErrorState (generic empty/loading/error, not this page's four named states); decision: CREATE (zero candidates satisfy the requirement); selected canonical owner: new files, built only from MantineAuthCard + native Mantine primitives per F4's already-established AuthSheet composition; Mantine/TailAdmin token path: theme.other.iconSize.{feature,hero}, VARIANT_COLORS.{success,error} (design-system/mantine/notificationVariants.ts); new hardcoded visual values: NONE; rationale: kickoff §10.2 names this disposition explicitly.`

`GR-3a STORY PREFLIGHT — Mantine/Primitives/PasswordInput × three hint states (empty/partial/all-met); canonical candidates: Mantine/Primitives/PasswordInput (src/stories/mantine/primitives/PasswordInput.stories.tsx, already imports real PasswordInput, previously rendered inline rule rows instead of the real hint); direct-import evidence: src/stories/mantine/primitives/PasswordInput.stories.tsx (existing file, extended); toolbar coverage: locale=Storybook global toolbar, viewport=Storybook global toolbar; decision: EXTEND; target: Mantine/Primitives/PasswordInput; rationale: kickoff R2.`

`GR-3a STORY PREFLIGHT — ResetPasswordView × 8 states; canonical candidates: NONE (no existing story imports this new component — it did not exist before this task); direct-import evidence: NONE; toolbar coverage: locale=Storybook global toolbar, viewport=Storybook global toolbar; decision: CREATE; target: src/stories/patterns/mantine/ResetPasswordView.stories.tsx (new); rationale: kickoff R6, zero canonical candidates.`

`GR-3a STORY PREFLIGHT — CabinetPasswordSectionView × 7 states; canonical candidates: NONE; direct-import evidence: NONE; toolbar coverage: locale=Storybook global toolbar, viewport=Storybook global toolbar; decision: CREATE; target: src/stories/patterns/mantine/CabinetPasswordSectionView.stories.tsx (new); rationale: kickoff R6, zero canonical candidates.`

`GR-3a STORY PREFLIGHT — Patterns/Mantine/AuthFormPattern × AuthCard state; canonical candidates: Patterns/Mantine/AuthFormPattern (src/stories/patterns/mantine/AuthFormPattern.stories.tsx, direct import of MantineAuthFormPattern from the same file MantineAuthCard now lives in); direct-import evidence: src/stories/patterns/mantine/AuthFormPattern.stories.tsx (existing file, extended with a new export); toolbar coverage: locale=Storybook global toolbar, viewport=Storybook global toolbar; decision: EXTEND; target: Patterns/Mantine/AuthFormPattern (new `AuthCard` export); rationale: kickoff R3.`

## I0 — premise-drift check (before any edit)

Re-ran F1's importer grep and F8's three censuses against the working tree at the base commit. Results matched the kickoff's F1/F8 measurements exactly — no drift:
- `git grep --untracked "components/ui/PasswordRequirementsHint"` → exactly the 4 code importers named in F1 (`AuthSheet.tsx:17`, `ResetPasswordClient.tsx:12`, `CabinetPasswordSection.tsx:10`, the test mock at `:101`), plus the two relative-import story files and the baseline JSONs.
- `check-surface-census.mjs --surface AuthSheet.tsx` → FAILs only on the hint (tier2). `CaptchaWidget`/`PhoneField` already enrolled by 872 — confirmed R7.
- `check-surface-census.mjs --surface ResetPasswordClient.tsx` → 6 nodes, FAILs on itself (tier1) + `alert`/`button`/`label`/`PasswordInput`/hint (tier2) — matches F8 exactly.
- `check-surface-census.mjs --surface CabinetPasswordSection.tsx` → same shape, matches F8 exactly.

No `PREMISE DRIFT`. Proceeded with implementation per kickoff §10.

**Gap, recorded per Review 1 §16.5.3 (not reconstructed):** kickoff §10.1 called for "a status snapshot with hashes" at I0. Only `01-head-before.txt` (the base commit SHA) was actually captured; no per-file `git hash-object` snapshot of the pre-implementation tree was retained. This gap is recorded as-is; it is not reconstructed after the fact, and it does not by itself invalidate the I0 grep/census evidence above, which was captured independently.

## Requirement / Acceptance-criteria evidence

| ID | Requirement | Evidence |
|---|---|---|
| R1/AC1 | Hint moved to `src/design-system/mantine/patterns/PasswordRequirementsHint.tsx`, byte-identical render minus the dropped helper re-export; old file + its legacy story deleted; importers updated; manifest + barrel + theme.ts comments updated | New pattern file (hash `5441605...`); `AuthSheet.tsx`, `ResetPasswordClient.tsx` (via View), `CabinetPasswordSection.tsx` (via View), `src/components/ui/PasswordInput.stories.tsx` all updated; `git grep --untracked "components/ui/PasswordRequirementsHint"` on `src scripts .storybook` → **corrected by Review 1 §16.4: the real result is exactly 1 hit**, a carried, not-yet-re-censused baseline key (`scripts/surface-census-baseline.json` × `src/app/[locale]/layout.tsx`), not the "0 hits" this row originally (and wrongly) claimed with no artifact to back it — see `03-hint-importers.txt` (the 1 hit) and `03b-census-layout.txt` (confirms no live `components/ui/PasswordRequirementsHint` node under `[locale]/layout.tsx`); `check:pattern-enrolment` PASS (`10-pattern-enrolment.txt`) |
| R2/AC2 | `Mantine/Primitives/PasswordInput` imports the real hint by name, three new states (empty/partial/all-met), no inline rule-row markup; legacy hint story deleted; `src/components/ui/PasswordInput.stories.tsx` hint import path updated | `src/stories/mantine/primitives/PasswordInput.stories.tsx` rewritten (no `Check`/`X`/`checkPasswordRules` import); `check:story-coverage` PASS, 101/101 covered (`09-story-coverage.txt`) |
| R3/AC3 | `MantineAuthCard` extracted from `MantineAuthFormPattern.tsx`'s own `Paper`, same file, identical props/token; `MantineAuthFormPattern` renders it unchanged; `AuthCard` story export added | `MantineAuthFormPattern.tsx` diff shows only the extraction — no prop/token change; `AuthFormPattern.stories.tsx` `AuthCard` export imports `MantineAuthCard` by name; `build-storybook` PASS (`19-build-storybook.txt`) |
| R4/AC4, AC6 | `ResetPasswordView` (presentational, no router/auth/network); `ResetPasswordClient` keeps every hook/effect/handler byte-for-byte, renders the View only | `ResetPasswordView.tsx` (new) imports only `@mantine/core`, lucide icons, `next-intl`, the pattern barrel; `ResetPasswordClient.tsx` diff — `handleSubmit`/`useEffect` bodies unchanged, JSX replaced by `<ResetPasswordView …/>`; `className` count = 0 in both files (visual inspection + census `className:0` on both nodes, `12-census-reset.txt`) |
| R5/AC5, AC6 | `CabinetPasswordSectionView` (presentational); `CabinetPasswordSection` keeps state/`submitDisabled`/`handleSubmit`/error-mapping byte-for-byte, `aria-describedby`/refs preserved | `CabinetPasswordSectionView.tsx` (new); `CabinetPasswordSection.tsx` diff — `handleSubmit`/error-mapping `switch` unchanged; `aria-describedby="cabinet-password-hint"` and both refs forwarded to Mantine `PasswordInput` (`ref: HTMLInputElement` per Mantine's factory type — confirmed in `node_modules/@mantine/core/lib/components/PasswordInput/PasswordInput.d.ts`); `className:0` on both nodes (`13-census-cabinet.txt`) |
| R6/AC7 | Two new canonical Stories, 8 + 7 states, fixture props only, manifest entries for both Views | `ResetPasswordView.stories.tsx` (Loading/Expired/Success/FormEmpty/FormPartial/FormAllMet/FormError/FormSubmitting); `CabinetPasswordSectionView.stories.tsx` (Empty/NewPartial/ReadyToSubmit/SamePassword/ErrorInvalidCurrent/RateLimited/Submitting); both Views added to `scripts/mantine-migration-scope.json`; `check:story-coverage` PASS |
| R7/AC7 | Confirm `PhoneField`/`LocaleSwitcher`/`CaptchaWidget` already enrolled (872 landed) | `node -e` grep of `scripts/mantine-migration-scope.json` at I0 confirmed all three present before any edit |
| R8/AC8 | Both smoke tests pass; planted-failure proof on each; `npm run test:auth` exits 0 | `ResetPasswordClient.smoke.test.ts` rewritten (Mantine test wrapper, stale ui mocks removed); new `CabinetPasswordSection.smoke.test.tsx`; both plant/restore cycles below; `test:auth` 7 files / 53 tests PASS (`04-test-auth.txt`); `05-cabinet-test.txt` 3/3 PASS |
| R9/AC9 | Doc audit + `component-catalog.latest.json` regenerated by its own command; both governance baselines regenerated by their own `--update-baseline`; diff restricted to the named removal set | See "Doc audit" and "Baseline diff" sections below |

`GR-1 CENSUS COMPLETE — AuthSheet 9 nodes; tier1 9 migrated+enrolled+story; tier2 0 imports removed; tier3 0 listed and filed as none.` (`11-census-authsheet.txt`, exit 0)

`GR-1 CENSUS COMPLETE (ResetPasswordClient) — 4 nodes; tier1 3 migrated+enrolled+story + 1 container-exempt (ResetPasswordClient: 0 className, 0 ui-imports, renders only its enrolled+storied View); tier2 0; tier3 0.` (`12-census-reset.txt`, exit 1 — the one expected container FAIL, per AC9)

`GR-1 CENSUS COMPLETE (CabinetPasswordSection) — 3 nodes; tier1 2 migrated+enrolled+story + 1 container-exempt (CabinetPasswordSection: 0 className, 0 ui-imports, renders only its enrolled+storied View); tier2 0; tier3 0.` (`13-census-cabinet.txt`, exit 1 — the one expected container FAIL, per AC9)

## Container-exemption proof (GR-1 D81-2/D81-4-style condition, applied per this task's own container/View split)

Both containers meet all three conditions the census cannot itself recognise:
1. **0 `className`** — confirmed by the census output (`className:0` on both `ResetPasswordClient.tsx` and `CabinetPasswordSection.tsx`) and by visual inspection of the final files.
2. **0 `@/components/ui/*` imports** — confirmed by the census output (`ui-imports:0`) and by the import lists in both final files (only hooks/actions/next modules).
3. **Renders only its enrolled, storied View** — `ResetPasswordClient` returns exactly `<ResetPasswordView …/>`; `CabinetPasswordSection` returns exactly `<CabinetPasswordSectionView …/>`. Both Views are in `scripts/mantine-migration-scope.json` and pass `check:story-coverage`.

## Current vs. required behavior (kickoff §9)

All rows preserved as specified: recovery token-hash and session paths, the four `ResetPasswordView` page states, submit-disabled logic (reset and cabinet), the six cabinet error mappings with focus-move/cooldown/delayed-signout, password reveal (now the Mantine toggle with the same localized `aria-label`s), and mobile full-width behavior (Mantine `PasswordInput`/`Button` are full-width by their own layout inside `MantineAuthCard`, no changed breakpoint logic). The one deliberate visible change, per F4/D2: **the red/green ring on the new-password field is removed** — the hint alone carries validity feedback. This is unchanged from the kickoff's own decision, not something this session introduced.

## Files changed

| Path | Reason | Final `git hash-object` |
|---|---|---|
| `src/design-system/mantine/patterns/PasswordRequirementsHint.tsx` (new) | R1 — hint relocated here | `5441605951763c90c57c4117aebe9076f8231428` |
| `src/components/ui/PasswordRequirementsHint.tsx` (deleted) | R1 | — |
| `src/components/ui/PasswordRequirementsHint.stories.tsx` (deleted) | R1/R2 | — |
| `src/design-system/mantine/patterns/index.ts` | R1 — barrel export added, `MantineAuthCard` export added | `5b2d95f1b43dcdc153c51e0c5b8cb8b8ed320e04` |
| `src/design-system/mantine/theme.ts` | R1 — two path comments updated | `23890651a4f9081928f7ffc11e9319abfcdf85f9` |
| `src/modules/auth/components/AuthSheet.tsx` | R1 — import lines only | `283d0c06bf4f2664ad5e9c13cf04624c5a554ca6` |
| `src/stories/mantine/primitives/PasswordInput.stories.tsx` | R2 — real hint, 3 states | `27e1f9798b5ac413891540b5d835cd6bdb30ce9b` |
| `src/components/ui/PasswordInput.stories.tsx` | R2 — hint import path only | `d5ba83833a08a3356ad30e5035d78460c333cfd4` |
| `src/design-system/mantine/patterns/MantineAuthFormPattern.tsx` | R3 — `MantineAuthCard` extracted | `9e65abebef14a78c7eabb271d7dfe40fe206ba8a` |
| `src/stories/patterns/mantine/AuthFormPattern.stories.tsx` | R3 — `AuthCard` story export | `b91d354f0b134270722ed7d67f17adff1c36e16c` |
| `src/modules/auth/components/ResetPasswordView.tsx` (new) | R4 | `79be1a520f29e8e2ebdf03922fb0a7222bd8cda4` |
| `src/modules/auth/components/ResetPasswordClient.tsx` | R4 — container split | `7a2563a44912146acfbac4f366a5076bd4552b14` |
| `src/modules/cabinet/components/CabinetPasswordSectionView.tsx` (new) | R5 | `4467a8b787c8e6d4186c826a4de00cf0e771f01f` |
| `src/modules/cabinet/components/CabinetPasswordSection.tsx` | R5 — container split | `6e21d038315f41cdb949627b9a3069a4a063c5e2` |
| `src/stories/patterns/mantine/ResetPasswordView.stories.tsx` (new) | R6 | `cae86b5a71acfdc943c30ed43d27ead61482f888` |
| `src/stories/patterns/mantine/CabinetPasswordSectionView.stories.tsx` (new) | R6 | `34d08853f76969f53cc0a91ec7bb106e10ecc66a` |
| `scripts/mantine-migration-scope.json` | R1/R6 — 3 new entries | `efe8a1ecc008e1c3e33f2553a1caeba2d7f8b1a7` |
| `src/modules/auth/components/__tests__/ResetPasswordClient.smoke.test.ts` | R8 | `bb7a95971fbabb85bc3e43b31f12106ad75d109e` |
| `src/modules/cabinet/components/__tests__/CabinetPasswordSection.smoke.test.tsx` (new) | R8 | `26922b130456a903152728efc95a072f8a5e8c90` |
| `scripts/rendered-scope-baseline.json` | R9 — regenerated by `--update-baseline` | `499f3c1e919cc7304951f541411996fbe435a27b` |
| `scripts/surface-census-baseline.json` | R9 — regenerated by `--update-baseline` | `d4973d0c7fccee2e77ad695d8b869adf51b16b3d` |
| `docs/component-catalog.md` | R9 — F1 doc line | `0ecbe4b2e064af31e0796ed321a516c858c97b9f` |
| `docs/component-coverage-matrix.md` | R9 — F1 doc line | `b04dcaf07f146c3cfc958b55a5665c4c3dc60343` |
| `docs/component-risk-register.md` | R9 — F1 doc line | `8edc038ada564ba7b2fd9364a18610575d6fbcd3` |
| `docs/responsive-storybook-inventory.md` | R9 — F1 doc line | `634e9279535cc2bbab675251a0837148fe9ae0e4` |
| `docs/storybook-governance.md` | R9 — F1 doc lines (×2) | `d7c710483c518408a30072321033c2315dd03397` |
| `docs/tailwind-governance.md` | R9 — F1 doc line | `e0964e8098ac10df647550b5f64b3271af81281e` |
| `scripts/governance/reports/component-catalog.latest.json` | R9 — regenerated by `npm run catalog:components`; gitignored, not tracked | n/a (not a git object) |

## Deviation from §7 scope, caught and reverted in-session — read before trusting the doc diffs above

`npm run catalog:components` (the command R9 names for regenerating `component-catalog.latest.json`) does **not** write only the JSON file — it also overwrites `docs/component-catalog.md`, `docs/component-coverage-matrix.md` and `docs/component-risk-register.md` with a full fresh scan (253 components found vs. the hand-maintained 240; every by-type/by-status count changed). Running it clobbered my targeted F1 hand-edits with a full regeneration far outside §7's scope (§7 lists only "the F1 doc lines" for the `.md` files; the *command* is scoped to the JSON only per R9's own wording, "do not hand-edit" the JSON, not "regenerate the docs"). **Caught before commit**: restored all three `.md` files from `git show HEAD:<path>` (read-only, permitted) and re-applied only the intended F1 line edits by hand. Confirmed via `git diff` that all three files now show only the minimal intended change (one row removed + one header note each). The JSON file's full regeneration stands, since R9 explicitly names it and it is gitignored (no diff to review). **Flagging for Opus**: `npm run catalog:components` is a destructive command for hand-maintained docs; a future task naming it for "regenerate the JSON" should say so explicitly, or the script should stop writing the `.md` files by default.

## Second deviation — one stale baseline key outside R9's named list

`check:surface-census-changed --update-baseline` dropped 13 stale keys, not the ~12 R9 anticipated. Twelve match R9's list exactly (5 `alert`/`button`/`label`/`PasswordInput`/hint keys under `reset-password/page.tsx`, 3 under `cabinet/page.tsx`, plus `AuthSheet.tsx` × `CaptchaWidget`/`PhoneField`/hint). The 13th, **`cabinet/page.tsx :: src/components/shared/RelativeTime.tsx :: tier1-unenrolled-or-unstoried`**, is not one of 872's F9 "8 carried keys" and not a hint/PasswordInput/alert/button/label key. Investigated before dropping it: a direct `check-surface-census.mjs --surface .../cabinet/page.tsx --report` at `HEAD` (post-implementation) shows `RelativeTime.tsx` as `manifest:yes story:yes` today — it was migrated and enrolled by an earlier, unrelated task, and no diff since then had happened to map to `cabinet/page.tsx` until this one (`CabinetPasswordSectionView.tsx` is a changed file that maps there). This is the same mechanism R9 describes for the 8 named keys — "any of those 8 whose surface this diff censuses goes stale" — just discovered on a component R9's author did not know was already fixed. Verified independently (not merely inferred from the tool's own removal): `RelativeTime.tsx` genuinely passes today. Dropped it along with the other 12; `git diff` on both baselines shows **only removals**, no additions — `SCOPE GUARD` intact. **Flagging for Opus**: this key's staleness pre-dates this task and is unrelated to its scope; the removal is correct but the exact key was not named in the kickoff.

## Doc audit (R9)

| Doc line | Change |
|---|---|
| `docs/component-catalog.md:41` | Removed the `PasswordRequirementsHint` row from "Canonical UI Primitives"; header hand-correction note added; Total cataloged components 240→239; section count (33)→(32) |
| `docs/component-coverage-matrix.md:26` | Removed the row; header hand-correction note added |
| `docs/responsive-storybook-inventory.md:28` | Removed the row (legacy story file deleted) |
| `docs/component-risk-register.md:148` | Removed the row; header hand-correction note added |
| `docs/storybook-governance.md:445` | Removed `PasswordRequirementsHint` from the Primitives list, noted the relocation |
| `docs/storybook-governance.md:2506` | Added a parenthetical noting the `AuthSheet → PasswordRequirementsHint` tier-2 edge is paid off |
| `docs/tailwind-governance.md:387` | Updated the `@apply`-comment path/line citation to the new file location |
| `docs/mantine-tailadmin-migration-tracker.md:87` | **Left untouched** — historical per its own banner, as the kickoff specifies |
| `docs/critical-flow-registry.md` ("Recovery link → reset") | **Left untouched** — the test file path and command are unchanged by the container/View split, so no update is required per the kickoff's conditional wording |

## Baseline diff summary (R9/AC9)

`scripts/rendered-scope-baseline.json`: **1 edge removed** — `AuthSheet.tsx -> PasswordRequirementsHint.tsx` (paid off, hint relocated out of the tier-2 prefix). No additions.

`scripts/surface-census-baseline.json`: **13 keys removed**, 0 added (481 → 468 entries):
- `reset-password/page.tsx` × `PasswordInput`/`PasswordRequirementsHint`/`alert`/`button`/`label` (5) — the hint/PasswordInput keys per R9; alert/button/label paid off because `ResetPasswordView` uses native Mantine, not the legacy primitives.
- `cabinet/page.tsx` × `PasswordInput`/`PasswordRequirementsHint`/`alert` (3) — same mechanism. (`button`/`label` were not present as keys under this surface before this diff — nothing to drop there.)
- `cabinet/page.tsx` × `PhoneField` (1) — carried key from 872, retired here per kickoff R9 ("`[locale]/cabinet/page.tsx` × `PhoneField` is possible").
- `cabinet/page.tsx` × `RelativeTime` (1) — **not named in R9**, see "Second deviation" above.
- `AuthSheet.tsx` × `CaptchaWidget`/`PhoneField` (2) — carried keys from 872, retired here as R9 predicted.
- `AuthSheet.tsx` × `PasswordRequirementsHint` (1) — this task's own hint move.

`18-baseline-diff.txt` has the full `git diff` transcript; every line is a removal, none an addition.

## Plant/restore proof (AC8)

**ResetPasswordClient** — pre-plant hash `7a2563a44912146acfbac4f366a5076bd4552b14`. Commented out the `verifyOtp(...)` call inside `handleSubmit`'s `token_hash` branch (replaced with an inert stub). Re-ran `ResetPasswordClient.smoke.test.ts`: **3 of 5 tests FAILED** (`plant-reset-planted-run.txt`) — exactly the submit-path and success/expired assertions that depend on `verifyOtp` being called. Restored the original code; post-restore hash `7a2563a44912146acfbac4f366a5076bd4552b14` — **matches**. Re-ran: 5/5 PASS.

**CabinetPasswordSection** — pre-plant hash `6e21d038315f41cdb949627b9a3069a4a063c5e2`. Removed the `currentPassword.length === 0 || isSamePassword` disjuncts from `submitDisabled`. Re-ran `CabinetPasswordSection.smoke.test.tsx`: **1 of 3 tests FAILED** (`plant-cabinet-planted-run.txt`) — the same-password guard test, exactly as intended. Restored; post-restore hash `6e21d038315f41cdb949627b9a3069a4a063c5e2` — **matches**. Re-ran: 3/3 PASS.

## Validation evidence — exact commands and results

All transcripts in `docs/sessions/evidence/task873/`:

| # | Command | Result |
|---|---|---|
| 06 | `npm run typecheck` | PASS, exit 0 |
| 07 | `npm run lint` | PASS, exit 0 (81 pre-existing warnings, 0 errors, none in touched files) |
| 08 | `npm run check:i18n` | PASS, exit 0 — 2370 keys, all 4 locales identical. **Correction (Review 1 §16.5.3): not "untouched."** `messages/en.json`, `sq.json`, `uk.json` and `it.json` were each edited during the session (two `storybook.mantine.*` keys added for the `AuthCard` story) and then edited again to remove them, once the "reuse existing keys" fix below was made. `24-status-after.txt`'s "M messages/*.json" reflects those in-session writes, correctly. By the time of the final capture, `git status` shows no diff for any of the four files and `check:i18n`'s key count (2370) matches the pre-session baseline — the round-trip left no content difference, which is a distinct fact from the files never having been written to |
| 09 | `npm run check:story-coverage` | PASS, exit 0 — 101/101 manifest entries covered |
| 10 | `npm run check:pattern-enrolment` | PASS, exit 0 — 52 pattern files, all enrolled |
| 11 | `check-surface-census.mjs --surface AuthSheet.tsx` | PASS, exit 0 — no FAIL |
| 12 | `check-surface-census.mjs --surface ResetPasswordClient.tsx` | exit 1 — exactly one FAIL (the container), per AC9 |
| 13 | `check-surface-census.mjs --surface CabinetPasswordSection.tsx` | exit 1 — exactly one FAIL (the container), per AC9 |
| 14 | `npm run check:rendered-scope` | PASS, exit 0 (after `--update-baseline`) |
| 15 | `npm run check:rendered-scope:verify` | PASS, exit 0 — 5/5 arms |
| 16 | `check-surface-census-changed.mjs --base b5074e6…` | PASS, exit 0 (after `--update-baseline`) |
| 17 | `npm run check:surface-census:changed:verify` | PASS, exit 0 — 12/12 arms |
| 23 | `npm run check:enrolled-tailwind` | PASS, exit 0 — no new findings |
| 04 | `npm run test:auth` | PASS, exit 0 — 7 files / 53 tests |
| 05 | `vitest run CabinetPasswordSection.smoke.test.tsx` | PASS, exit 0 — 3/3 |
| 19 | `npm run build-storybook` | PASS, exit 0 |
| 20 | `npm run check:file-integrity` | PASS, exit 0 — 62 files clean |
| 21 | `npm run check:mojibake` | PASS, exit 0 — 0 artifacts in 6502 files |
| 22 | `npm run build` | PASS, exit 0 — all 58 routes generated |

**On the first `test:auth` run via the Bash tool, 4/5 `ResetPasswordClient.smoke.test.ts` tests failed** — a 5000ms timeout on the first test and DOM-element lookup failures on the rest, with an anomalous 139s "environment" setup phase. Re-running the identical command (via PowerShell, then again via Bash) passed cleanly in ~5-6s with a normal ~10s environment phase both times. Isolating the single failing test in its own run also passed in under 5s. Treated as an environment blip (likely first-touch cold-start on newly created files, not a code defect) rather than a real failure — the final captured `04-test-auth.txt` evidence is the clean run, reproduced twice.

## Assumptions, deviations, and limitations

1. Two deviations from the kickoff's exact §7/R9 wording were caught and corrected in-session — see the two "Deviation" sections above. Both are disclosed for Opus's independent judgment, not asserted as pre-approved.
2. The `AuthCard` story fixture reuses two existing `storybook.mantine.*` keys (`auth_login_title`, `ta_hint`) rather than inventing new ones — kept in scope per kickoff §8 ("Any locale key: reuse the existing ... keys. If one is missing, stop") even though that clause is written for production `auth.*`/`cabinet.*`/`common.*` namespaces; applied the same discipline to the story-fixture namespace to avoid an unlisted `messages/*.json` edit.
3. `docs/critical-flow-registry.md`'s "Recovery link → reset" row was not edited — the test file path and command are byte-identical after the container/View split, and the kickoff's own wording makes editing it conditional on a change that did not occur.
4. No behavior change beyond the one the kickoff explicitly authorizes (the red/green ring removal, F4/O81-3).

## Opus handoff — evidence locations and specific questions

- All governance transcripts: `docs/sessions/evidence/task873/*.txt`.
- **Question 1**: is the `RelativeTime.tsx` baseline-key drop (Second deviation, above) acceptable as an allowed removal, or does it need a separate numbered follow-up / owner note before archival?
- **Question 2**: should `npm run catalog:components`'s doc-clobbering behavior (First deviation, above) be filed as its own P2/P3 task, given it makes "regenerate component-catalog.latest.json" a landmine for any future task that runs the literal named command?
- **OWNER VISUAL QA REQUIRED (O81-3)** — not run by this session; needs the owner's Storybook pass at sq/en/uk/it × 320/1440 for:
  - `Patterns/Mantine/ResetPasswordView` (8 states)
  - `Patterns/Mantine/CabinetPasswordSectionView` (7 states)
  - `Mantine/Primitives/PasswordInput` (3 hint states, extended)
  - `Patterns/Mantine/AuthFormPattern` (`Default` and the new `AuthCard`)
  - Plus, after deploy: one real password reset and one cabinet password change.

## Backlog update

873's row in `docs/backlog.md` (Sprint 81 registry table) updated from `KICKOFF FILED` to `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, one line, same table cell. Backlog remains under the file's stated management; no history text added there — this session log carries the detail.

---

# Revision 1 — remediation of Review 1's four findings (2026-09-24)

**Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`**

Re-entered at kickoff §16 per the review's `NEEDS REVISION` verdict. Platform `win32` (`node v22.22.3`).

## Re-entry premise-drift check (§16.6 step 1)

Captured `git hash-object` of all 25 files in `25-final-hashes.txt` as `30-reentry-start-hashes.txt` before any edit. Every hash matched — no `PREMISE DRIFT`.

## Owner decision D81-5 (quoted in the kickoff §16.0)

Keep the accessibility link between the cabinet new-password field and its requirements hint: pass the hint as the Mantine `description`, with `inputWrapperOrder` keeping it below the field, replacing the hand-written `aria-describedby`/`<div id>` pair the review found inert. Applies to the cabinet View only; `ResetPasswordView` and `AuthSheet` are unchanged.

## Findings addressed

| § | Finding | Fix | Verification |
|---|---|---|---|
| 16.1 (F1, P2) | Raw `gap={6}`/`gap={4}` literals in both new Views and the primitives story, contradicting the session's own GR-0 receipt | `ResetPasswordView.tsx:106` and the (now-removed, see 16.3) wrapping `Stack` in `CabinetPasswordSectionView.tsx` → `gap="compact"`; the three hint-state `Stack`s in `PasswordInput.stories.tsx` → `gap="tight"` | `31-gap-literals.txt` — no match, exit 1 (grep convention) |
| 16.2 (F2, P2) | Cabinet reveal toggles had no `visibilityToggleButtonProps`, so Mantine renders them `aria-hidden="true"` — no accessible name, unlike `ResetPasswordView`'s toggle (F4) | Added `currentPasswordVisible`/`newPasswordVisible` state to the container (additions-only diff against `6e21d038…`, confirmed by inspection), four new props threaded through the View, `visibilityToggleButtonProps` added to both `PasswordInput`s using the same `tc('hide_password')`/`tc('show_password')` form as `ResetPasswordView.tsx:115-117`. Story `Demo` extended with the two visibility `useState`s; no new Story export | New test (below) + plant P4 |
| 16.3 (F3, P0, owner D81-5) | The new-password field's `aria-describedby="cabinet-password-hint"` was inert — Mantine's `PasswordInput` overwrites it with its own computed value (`undefined` absent an error/description), so the rendered DOM had **no** link between the field and its hint | New-password `PasswordInput` now takes `description={<PasswordRequirementsHint value={newPassword} />}`, `descriptionProps={hintDescriptionProps}` (module-level constant — an inline literal fails `tsc` with TS2769, confirmed), `inputWrapperOrder={['label','input','description','error']}`. Deleted the manual `aria-describedby`, the `<div id="cabinet-password-hint">` wrapper, and the now-empty wrapping `Stack`. `changeCabinetPassword`'s server-side policy check is untouched (`35-actions-diff.txt` empty) | New test (below) + plant P3; `34-typecheck.txt` exit 0 confirms the constant-form `descriptionProps` compiles |
| 16.4 (F4, P2) | AC1's cited evidence file (`03-hint-importers.txt`, "0 hits") did not exist, and the real result is **1 hit** — a carried, not-yet-re-censused baseline key at `[locale]/layout.tsx` | Corrected AC1's expected result to "exactly one hit, the carried baseline key"; produced both `03-hint-importers.txt` (1 hit, the baseline key) and `03b-census-layout.txt` (no node under `components/ui/PasswordRequirementsHint`, exit code recorded not asserted — `layout.tsx`'s other 7 FAILs are unrelated pre-existing debt, out of this task's scope) | `03-hint-importers.txt`, `03b-census-layout.txt` |

## New test coverage (§16.6 step 3)

Two `it` blocks added to `CabinetPasswordSection.smoke.test.tsx` (now 5 tests total):
1. **AC5′** — the new-password input's `aria-describedby` is non-empty, resolves via `document.getElementById` to a `DIV`, and that div's `textContent` contains all five `password_rule_*` keys.
2. **§16.2** — both toggles are found under `.mantine-PasswordInput-visibilityToggle` inside `.mantine-PasswordInput-root`, neither has `aria-hidden="true"`, both start with `aria-label="show_password"`; after triggering the new-password toggle the label flips to `"hide_password"` and the input's `type` becomes `"text"`.

**Correction during authoring:** Mantine's `PasswordInput` toggle wires `onMouseDown` (with `preventDefault`) and `onTouchEnd`, not `onClick` — an initial `fireEvent.click` never reached the handler and the test failed for the wrong reason (stale `aria-label`, not the toggle missing). Switched to `fireEvent.mouseDown`; the test then exercises the real interaction path.

## Plant/restore proofs (§16.6 step 4)

Pre-plant hash of `CabinetPasswordSectionView.tsx`: `209de828db6ed98eb2ab6c7a8858d82914419640`.

**P3 — remove `description` from the new-password input.** Ran the AC5′ test in isolation: **FAILED** (`expected null to be truthy` — empty `aria-describedby`), captured in `plant-p3-run.txt`. Restored; post-restore hash `209de828db…` — **matches**. Full suite re-run: 5/5 pass.

*(Process note: the first restore attempt only removed the plant's marker comment and did not re-add the `description` prop, so the file was still in the planted state — the re-run against that state is exactly `plant-p3-run.txt`'s captured FAIL. This was caught immediately by the hash check before proceeding, and the actual restore followed, hash-verified.)*

**P4 — remove `visibilityToggleButtonProps` from the new-password input.** Ran the §16.2 toggle test in isolation: **FAILED** (`expected 'true' not to be 'true'` — `aria-hidden="true"` present), captured in `plant-p4-run.txt`. Restored; post-restore hash `209de828db…` — **matches** the original pre-plant hash. Full suite re-run: 5/5 pass.

## Validation evidence — re-entry (§16.7)

| Artifact | Command | Result |
|---|---|---|
| `02b-platform-reentry.txt` | platform/version | `win32 v22.22.3` |
| `03-hint-importers.txt` | hint importer grep | exactly 1 hit — the carried baseline key, per §16.4's corrected AC1 |
| `03b-census-layout.txt` | census of `[locale]/layout.tsx` | no `components/ui/PasswordRequirementsHint` node; exit 1 from 7 unrelated pre-existing FAILs (Header/Footer/AuthContext/NotificationBell/PerfDevOverlay/PerformanceStoreInit/WebVitalsReporter) — out of scope, exit code recorded not asserted |
| `31-gap-literals.txt` | raw `gap={N}` grep | no match |
| `32-test-auth.txt` | `npm run test:auth` | PASS, exit 0 — 7 files / 53 tests (confirms `ResetPasswordClient.smoke.test.ts`, untouched by this revision, still passes) |
| `33-cabinet-test.txt` | `CabinetPasswordSection.smoke.test.tsx` | PASS, exit 0 — **5/5 tests** |
| `34-typecheck.txt` | `npm run typecheck` | PASS, exit 0 |
| `35-actions-diff.txt` | `git diff --stat -- src/modules/cabinet/actions` | empty, as required |
| `36-lint.txt` | `npm run lint` | PASS, exit 0 (81 pre-existing warnings, 0 errors) |
| `37-story-coverage.txt` | `npm run check:story-coverage` | PASS, exit 0 — 101/101 |
| `38-census-cabinet.txt` | census of `CabinetPasswordSection.tsx` | exit 1 — unchanged, single container FAIL |
| `39-census-changed.txt` | `check-surface-census-changed.mjs --base b5074e6…` (no `--update-baseline`) | PASS, exit 0 — **Blocks new: 0** |
| `40-rendered-scope.txt` | `npm run check:rendered-scope` (no `--update-baseline`) | PASS, exit 0 — 0 new, 0 stale |
| `41-enrolled-tailwind.txt` | `npm run check:enrolled-tailwind` | PASS, exit 0 |
| `42-build-storybook.txt` | `npm run build-storybook` | PASS, exit 0 |
| `43-file-integrity.txt` | `npm run check:file-integrity` | PASS, exit 0 (86 files) — first run failed on a stray UTF-8 BOM that PowerShell's `Tee-Object` had written into `plant-p4-run.txt`; stripped the BOM (evidence file only, not a scope file) and re-ran clean |
| `44-mojibake.txt` | `npm run check:mojibake` | PASS, exit 0 — 0 artifacts in 6526 files |
| `45-build.txt` | `npm run build` | PASS, exit 0 |
| `46-status-final.txt` | `git status --porcelain` | matches §7 scope exactly, plus the same two pre-existing unrelated dirty paths noted in the original session (`task861/storybook-dev.log`, `schema-drift-check.sql`) |

**Forbidden re-run check:** both baseline files' hashes confirmed unchanged after the full re-entry run — `scripts/surface-census-baseline.json` = `d4973d0c7fccee2e77ad695d8b869adf51b16b3d`, `scripts/rendered-scope-baseline.json` = `499f3c1e919cc7304951f541411996fbe435a27b` — both match the values Review 1 declared final. `npm run catalog:components` was not run.

## Files changed in this revision, with final hashes

| Path | Reason | Final `git hash-object` |
|---|---|---|
| `src/modules/auth/components/ResetPasswordView.tsx` | §16.1 — `gap="compact"` | `310c3b4e89c4bb81bdf1bc069a62a65f46f7b7dd` |
| `src/modules/cabinet/components/CabinetPasswordSectionView.tsx` | §16.1/§16.2/§16.3 — token gap, toggle labels, hint-as-description | `209de828db6ed98eb2ab6c7a8858d82914419640` |
| `src/modules/cabinet/components/CabinetPasswordSection.tsx` | §16.2 — two visibility state lines + four prop lines (additions only) | `e979b4b49571567fa474103e26beae6c6f87fc03` |
| `src/stories/mantine/primitives/PasswordInput.stories.tsx` | §16.1 — `gap="tight"` ×3 | `ef602e062f713dc52b05406cc6d7ce81182b482d` |
| `src/stories/patterns/mantine/CabinetPasswordSectionView.stories.tsx` | §16.2 — `Demo` visibility state + four props | `95cf2edff490a6b4bb3a166b11fd45dd671c21bf` |
| `src/modules/cabinet/components/__tests__/CabinetPasswordSection.smoke.test.tsx` | §16.6 — two new `it` blocks | `ff452ce6c912134fca3739c032115ee11949c0e8` |

No other file from the original 25 was touched; both baseline JSONs and the `mantine-migration-scope.json`/doc/theme.ts edits from the original session stand unchanged, per §16's "Stays as delivered" and "Forbidden re-runs."

## Deviations / notes

1. `fireEvent.click` does not reach Mantine's `PasswordInput` visibility toggle (wired to `onMouseDown`/`onTouchEnd`); used `fireEvent.mouseDown` instead — noted above, not a defect in the production code.
2. The first P3 restore attempt was incomplete (removed only a plant marker comment, not the actual reverted prop) and was caught by the hash check before proceeding — see the P3 note above. The final restore is hash-verified correct.
3. `Tee-Object` (PowerShell) writes a UTF-8 BOM by default; one evidence-only `.txt` file needed a BOM strip to pass `check:file-integrity`. No scope file was affected.
4. §16.5's three items (RelativeTime key acceptance, `catalog:components` note, session-log corrections) are the reviewer's own findings about the *original* session, not actions for this revision beyond what's already reflected in the original log; no further edit was needed for them.

## Opus handoff

- All re-entry evidence: `docs/sessions/evidence/task873/{02b,03,03b,30,31,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,plant-p3-*,plant-p4-*}*`.
- `CabinetPasswordSectionView` changed markup in this revision (toggle props, `description`/`inputWrapperOrder`/`descriptionProps`) — **O81-3's `Patterns/Mantine/CabinetPasswordSectionView` matrix (7 states × 4 locales × 2 viewports) needs a fresh owner pass**, as the kickoff's §16.7 notes explicitly.
- All other O81-3 tuples (`ResetPasswordView`, `Mantine/Primitives/PasswordInput`, `AuthFormPattern`) are unchanged by this revision.

## Backlog update

873's row in `docs/backlog.md` updated to reflect Revision 1's completion (`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, re-entry findings resolved).

---

# Revision 2 — two log corrections and one test fix (2026-09-24)

**Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`**

Two items, both against records already in this log:

1. **Session-log corrections** (three, all in the original session's sections above, now fixed in place rather than re-stated here):
   - The R1/AC1 evidence row wrongly cited "0 hits" for the hint-importer grep with no artifact; corrected to the actual measured result — 1 hit, the carried baseline key — citing both `03-hint-importers.txt` and `03b-census-layout.txt`.
   - The `check:i18n` validation row wrongly called `messages/*.json` "untouched"; corrected to state that all four files were edited in-session (two keys added, then removed) and show no content diff only as of the final capture — a different fact from never having been written.
   - Added the missing note (kickoff §16.5.3, third item) that the I0 status/hash snapshot §10.1 called for was never fully captured (`01-head-before.txt` holds only the base SHA) — recorded as a gap, not reconstructed.
2. **Test fix.** `CabinetPasswordSection.smoke.test.tsx`'s AC5′ test located the new-password field by `#cabinet-new-password` (its `id`, an implementation detail) instead of by its accessible label. Changed to `screen.getByLabelText(/password_new_label/)`. Re-ran the full file: **5/5 pass, exit 0** (`33-cabinet-test.txt`, hash `ab84047f7e9951245c778d895d1079f899d90424`).

**Plant re-verification.** Since the field-lookup mechanism changed, re-ran the P3 plant (remove `description` from the new-password `PasswordInput`) against the updated test to confirm it still catches the regression: **FAILED** as expected (`expected null to be truthy`, `plant-p3b-run.txt`). Restored; `git hash-object` of `CabinetPasswordSectionView.tsx` before planting (`209de828db…`) matches after restoring (`plant-p3b-post-hash.txt`) — verified byte-identical. Full suite re-run: 5/5 pass. P4 (the toggle-label plant) was not re-verified, since it does not touch the field-lookup code path this revision changed.

**Validation:** `npm run typecheck` — 0 errors. `npm run lint` — 0 errors, same 81 pre-existing warnings. `npm run check:file-integrity` — PASS, 93 files clean.

No production file changed in this revision — only the test file and this log. `CabinetPasswordSectionView.tsx`'s final hash is unchanged from Revision 1 (`209de828db6ed98eb2ab6c7a8858d82914419640`).

---

# Revision 3 — Story-only fix for the owner's returned O81-3 tuple (2026-09-24)

**Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`**

## Owner's O81-3 result (kickoff §17.1, verbatim)

> *"Візуально все ок, переклади вірні. Одна лише сторі зламана"*

Every O81-3 tuple accepted except `Patterns/Mantine/CabinetPasswordSectionView → Empty` at 320px `uk`, which rendered edge-to-edge with no gutter.

## Premise-drift check (before any edit)

Re-hashed the two files Review 3 said must stay unchanged:
- `CabinetPasswordSectionView.tsx` → `209de828db6ed98eb2ab6c7a8858d82914419640` — matches.
- `CabinetPasswordSection.tsx` → `e979b4b49571567fa474103e26beae6c6f87fc03` — matches.

No drift. Proceeded with the Story-only fix.

## F5 fix (§17.2)

**Root cause (as the kickoff already diagnosed):** the Story sets `skipCanvas: true` (correctly, since `CabinetPasswordSectionView` has no outer padding of its own — its gutter comes from `ProfileTab.tsx:431` in production) but renders `Demo`'s `<CabinetPasswordSectionView>` with no harness at all, unlike `ResetPasswordView`'s own `Center p="md"`.

**Fix, Story file only** (`src/stories/patterns/mantine/CabinetPasswordSectionView.stories.tsx`):
1. Added `import { MantineStoryShell } from '../../mantine/_MantineStoryShell';` (same relative path form as `SaveSearchButton.stories.tsx:4`).
2. Wrapped `Demo`'s returned `<CabinetPasswordSectionView {...props} />` in `<MantineStoryShell>`. All seven exports render through `Demo`, so this one change covers every state.

**Diff** (the only change to this file):
```diff
+import { MantineStoryShell } from '../../mantine/_MantineStoryShell';
...
-  return <CabinetPasswordSectionView {...props} />;
+  return (
+    <MantineStoryShell>
+      <CabinetPasswordSectionView {...props} />
+    </MantineStoryShell>
+  );
```
No change to `meta` (`skipCanvas: true` and `layout: 'fullscreen'` stand), no new Story export, no local `Box`/`p`/`px`/`style` wrapper, no `CabinetPasswordSectionView.tsx` or container edit — all four forbidden actions avoided.

Final hash: `git hash-object src/stories/patterns/mantine/CabinetPasswordSectionView.stories.tsx` → `0eea66797c58cd2fd6d442f54a4e042d51565519`.

## Validation evidence (§17.2's block)

| Artifact | Command | Result |
|---|---|---|
| `50-view-hashes.txt` | hash of `CabinetPasswordSectionView.tsx` + `CabinetPasswordSection.tsx` | both unchanged — `209de828db…`, `e979b4b4…` |
| `51-typecheck.txt` | `npm run typecheck` | PASS, exit 0 |
| `52-lint.txt` | `npm run lint` | PASS, exit 0 (81 pre-existing warnings, 0 errors) |
| `53-story-coverage.txt` | `npm run check:story-coverage` | PASS, exit 0 — 101/101 |
| `54-build-storybook.txt` | `npm run build-storybook` | PASS, exit 0 |
| `55-file-integrity.txt` | `npm run check:file-integrity` | PASS, exit 0 (102 files) |
| `56-build.txt` | `npm run build` | PASS, exit 0 |

## Owner re-check needed

**O81-3, narrowed (per §17.2):** `Patterns/Mantine/CabinetPasswordSectionView`, all 7 states × `sq`/`en`/`uk`/`it` × 320/1440. No other tuple needs re-review — all were already accepted in §17.1. After deploy: one real password reset and one cabinet password change (separate owner action once 873 is approved).

## Backlog update

873's row in `docs/backlog.md` updated to reflect the Story-only fix and its `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` status.
