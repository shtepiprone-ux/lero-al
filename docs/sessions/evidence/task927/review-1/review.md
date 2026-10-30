# Task 927 — Opus review 1 (2026-10-20): NEEDS REVISION

Platform: native Windows 11, Node v22.22.3, cwd `C:\Claude_Code_Projects\lero-al`. Built Storybook `storybook-static/` of
16:49 local (after the last source edit, 16:40). Kickoff revised in the same turn: §13 Amendment 3.

## Re-run by the reviewer

- Targeted Vitest, 12 files (AuthSheet.google.security, googleIdentity, browserAuth.security, browser.smoke, /api/auth/me
  route.security, reauthIdToken.security, reauth.security, ProfileTab.googleReauth.security, ProfileTab.deletePassword.security,
  AuthSheet.test, AuthSheet.banned.security, MantineDeleteConfirmModal.smoke): 160 passed, exit 0.
- All 23 contract cases map to one top-level test each. Base and final unit failure lists are identical (260); none is in a
  file of this task.
- AC1 grep: `signInWithOAuth` in `src/` and `.storybook/` only in `browserAuth.security.test.ts` (the not-exported assertion).
- AC11 source half: `src/` reads no Google variable other than `NEXT_PUBLIC_GOOGLE_CLIENT_ID`; the `.next/static` half is unproven.
- `check:ui-contract --verify-gate` self-test passes; the diff gate needs commits and was not run.
- `cli.mjs verify`: BLOCKED, contract still `planned` (`cli-verify.txt`).

## Findings

| # | Sev | Req | Location | Observed | Expected | Evidence |
|---|---|---|---|---|---|---|
| F1 | P2 | R4, AC10 (GR-3h) | `src/components/auth/GoogleSignInSlot.tsx:25` | The slot root is `Stack gap="md"`; the hidden host still takes the gap, so in `loading`/`unavailable` the slot is 16 px taller than its loader/alert: 32 px under the alert in the sheet, 16 px extra under the dialog's alert | Slot box = its one visible child | `slot-trailing-gap.txt` (all 8 rows `trailingInsideSlot` 16). The execution probe dropped zero-height children (`gr3-probe.mjs:57`) and could not see it |
| F2 | P2 | R13 | `src/modules/cabinet/components/ProfileTab.tsx:499`, `:579` | Two `GoogleSignInButton`s can be mounted (e-mail section + dialog). GIS keeps only the last `initialize` (saved GIS reference `gis-js-reference.txt:89-90`). After the dialog closes, the e-mail section's button hands its credential to the unmounted dialog instance, which ignores it: a silent no-op | One button mounted at a time | Source + GIS reference; no test covers two instances |
| F3 | P2 | R9, AC10 (kickoff defect) | `scripts/ui-contract-registry.json` | `GoogleSignInButton.tsx` is newly enrolled (`mantine-migration-scope.json:107`) with no registry row; `check-ui-contract.mjs:274` fails any such path on the first commit diff | A row for the Button | Gate source; kickoff R9 asked for one row only |
| F4 | P2 | R15 (new), GR-3i | `src/design-system/mantine/theme.ts:1771-1777` (Alert `message`) | The wrong-account text puts the profile's e-mail in the dialog's red alert; a long hyphen-free address runs past the alert at 320 (message right edge 530 px vs alert 304 px) and is cut | Wraps inside the alert | `alert-long-email.txt`: without fix lines 10-12, with `overflow-wrap: anywhere` lines 14-16 (287 px) |
| F5 | P2 | AC13 | `...Task_927...security.json:3` | Stage `planned`, no `security/report.json`; `cli.mjs verify` refuses | Handoff at `implemented` with report and verify | `cli-verify.txt` |
| F6 | P3 | AC14 | sensitivity D | Mutant D fails on a missing text (`findByText`), not on the `signInWithGoogleIdToken not called` assertion | Acceptable: the guard's observable output is the asserted text; noted only | executor `security/sensitivity/` |

Ruling on the executor's question (144 alerts with computed `text-overflow: ellipsis`): Mantine's Alert message
(`node_modules/@mantine/core/styles/Alert.css:56-59`) sets ellipsis with hidden overflow; with normal wrapping it only acts
on one token wider than the line. On prose it is latent and not a defect. F4's canonical fix removes the one case where it
can act.

## Not this task's, blocking its proof (Task 923's uncommitted work)

- Every AuthSheet Story fails on the built Storybook with `__dirname is not defined` (`login-render-errors.txt`): Task 923's
  `src/modules/auth/actions/recovery.ts:22` imports `after` from `next/server`; AuthSheet imports that module; Storybook
  aliases only `next/headers` and `crypto` (`.storybook/main.ts:40`). This task's diff adds no such import.
- `npm run build` fails on Task 923's `src/modules/listings/actions/updateListing.ts:78` (validation `build.txt:242`).
- `MantineDeleteConfirmModal.tsx` (923's new file) is also newly enrolled without a UI-contract row.

## Gate state

`BLOCKED — RENDERED STATE CENSUS (923)` also applies (Task 923 is `NEEDS REVISION`); approval of 927 waits for it in any case.
GR-7: no reference conclusion is made or relied on in this review; the kickoff's placement decision is unchanged and the
executor's GR-7 check stays UNVERIFIED beyond the four sign-in pages.

## Follow-up (same day, after Task 923's interim fix report)

- Verified: `recovery.ts:144`, `cabinet/actions/index.ts:723` and `applyListingTransition.ts:151` load `next/server` lazily;
  the Storybook rebuilt at 19:32 renders the AuthSheet Login, Register and ForgotPassword forms again
  (`login-render-errors-after-923-fix.txt`); `updateListing.ts:78` now uses `isListingVisible`; registry row
  `mantine-delete-confirm-modal` exists. The build exit 0 is 923's evidence (`task923/r17-21-build.txt`), not re-run here.
- New finding F7 (P2, R2, i18n/a11y) from the now-rendering Login entry: the button gets `hl=<locale>`, yet GIS's text on
  the page, its iframe title and accessible name are Albanian under every toolbar locale (`login-google-shot.txt`, PNGs).
  Google's reference sets the language with `?hl=` on the library URL as well (`gis-js-reference.txt:893-895`); R2's URL
  has none (`googleIdentity.ts:8`). Kickoff §13 item (6), R2 and AC5 amended; FE-UNIT-LOADER widened.
- Still unregistered in `scripts/ui-contract-registry.json` while newly enrolled: `GoogleSignInButton` (927's, Amendment 3
  R9) and `AdminSupportView`, `TicketDetailDialogView`, `CreateTicketDialogView`, `UserPickerFieldView` (not 927's).

## Verified as correct

AuthSheet diff limited to the Google path (password, forgot-password and registration views byte-identical to the design
read); nonce pair (32 bytes, hex SHA-256 to Google, raw to Supabase); a new pair per attempt; pending guard; no `prompt()`;
`auto_select: false`; sanitized destination; ban → wrong-credentials text; no credential in storage/URL/console (tested);
e-mail comparison before Supabase; id check with sign-out; server `oauth` window tests; integration DB-ALLOW and PRV-DENY
transcripts with clean-up.
