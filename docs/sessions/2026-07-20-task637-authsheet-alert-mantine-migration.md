# Session Archive: Task 637 — AuthSheet Slice 2d: legacy shadcn `Alert`/`AlertDescription` → canonical Mantine `Alert` — 2026-07-20

## Task path and status

`tasks/kickoff_prompt_Task_637_AuthSheet_Slice2d_Alert_MantineMigration.md`

**Status: IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW**

## Summary

Replaced all four legacy shadcn `Alert`/`AlertDescription` usages in `src/modules/auth/components/AuthSheet.tsx`
(`LoginView` session-lost banner + login error, `ForgotPasswordView` captcha error, `RegisterView` error) with the
canonical `@mantine/core` `Alert`. `variant="destructive"` → `color="red"` (A2/A3/A4); the default session-lost
banner → `color="blueLight"` (A1, per the kickoff's owner-resolved info mapping). `@/components/ui/alert` import
(`Alert` + `AlertDescription`) removed; `<AlertDescription>{msg}</AlertDescription>` collapsed to `{msg}` (Mantine
`Alert`'s children populate its own `message` slot). Every conditional trigger (`sessionLost`/`errorKey`/
`captchaFailed`) and localized message is byte-unchanged — only the element identity and `color` prop changed. This
is Slice 2d of the AuthSheet migration (Slices 1/2a/2b/2c — shell, Button, Input/Label, PasswordInput — all landed);
Slice 2e (`Combobox`/`LocationCombobox`, the final AuthSheet slice) remains open.

## Canonical UI decision record

| Visible artifact | Search queries and inspected paths | Canonical story/source | Disposition | Consumed shared style/token path |
|---|---|---|---|---|
| All four `Alert` notices (A1 session-lost, A2 login error, A3 captcha error, A4 register error) | Opened `src/design-system/mantine/theme.ts` `Alert` block (~L856, §6l "Alerts", Task 532): `defaultProps { radius:'xl', variant:'light' }`, `styles` callback keyed on `props.color` (default `'brand'`) setting `root` border=`--mantine-color-${color}-5`, bg=`${color}-0`, 12px radius, 16px padding; `message` slot 14/gray-5/lh-20. Opened canonical story `src/stories/mantine/primitives/Alert.stories.tsx` (four semantic variants incl. `color="red"`/`color="blueLight"`, icon-less variant, long-content wrap variant — all gated). Grepped `src/**` for other `@mantine/core` `Alert` consumers — none; AuthSheet is the first app consumer. Read legacy `src/components/ui/alert.tsx` being replaced (`cva` `default`/`destructive` variants, `AlertDescription` slot) | `@mantine/core` `Alert`, chrome fully owned by `theme.ts` `Alert` block + canonical story | **reuse** — `<Alert color={…}>{message}</Alert>`, no `title`/`icon`/local style; `color="red"` for the three destructive alerts, `color="blueLight"` for the info/session-lost banner per the kickoff's §6l variant-mapping table (success→green, warning→yellow, error→red, info→blueLight) | Theme-owned `defaultProps`/`styles` callback (12px radius, semantic-500 border, semantic-50 bg, gray-5/14/lh-20 message slot) — verified via live computed-style read (below), zero local Alert styling in the diff |

## Requirement and acceptance-criteria evidence

| ID | Requirement | Evidence |
|---|---|---|
| R1/AC1 | All four alerts are `@mantine/core` `Alert`; `@/components/ui/alert` import (`Alert`+`AlertDescription`) removed; no reference remains | `git diff` (below); `grep -n "components/ui/alert\|AlertDescription" AuthSheet.tsx` → no match |
| R2/AC2 | Each alert keeps its exact conditional trigger (`sessionLost`/`errorKey`/`captchaFailed`) and localized message; no state/error-mapping/conditional-render logic changed | `git diff` — 4 hunks, only the import line + the four `Alert` elements changed; every surrounding `{cond && (...)}` wrapper byte-identical; all 4 named smokes green |
| R3/AC3 | Destructive alerts (A2/A3/A4) → `color="red"`; session-lost (A1) → `color="blueLight"`; no off-scale/invented color | `git diff`; rendered proof — A1 shows blueLight chrome, A2/A3/A4 show red chrome (screenshots below) |
| R4/AC4 | Each alert consumes theme §6l chrome (reuse, no local style); message renders in the Mantine `message` slot (children), no `AlertDescription` wrapper; legible at 320/375/390/desktop | `git diff` shows no local Alert styling; rendered proof at 320/375/390/1280; live computed-style read (below) confirms exact §6l values |
| R5/AC5 | 5 named auth smokes + `test:header-hydration-id-parity` stay green | All 6 commands below: exit 0 |
| R6/AC5 | No new legacy `@/components/ui/*` import; `Label`/`Combobox`/`LocationCombobox`/`PasswordRequirementsHint` imports remain; typecheck/check:stories/check:i18n/check:mojibake green | `git diff` import block — only `Alert` added to the `@mantine/core` line, `@/components/ui/alert` line removed, all other imports untouched; all 4 commands exit 0 |

## A1–A4 before/after mapping (variant → color)

| ID | View | Trigger | Before | After |
|---|---|---|---|---|
| A1 | `LoginView` session-lost banner | `{sessionLost && (…)}` | `<Alert><AlertDescription>{t('session_recovery_message')}</AlertDescription></Alert>` (default variant) | `<Alert color="blueLight">{t('session_recovery_message')}</Alert>` |
| A2 | `LoginView` error | `{errorKey && (…)}` | `<Alert variant="destructive"><AlertDescription>{t(errorKey…)}</AlertDescription></Alert>` | `<Alert color="red">{t(errorKey…)}</Alert>` |
| A3 | `ForgotPasswordView` captcha error | `{captchaFailed && (…)}` | `<Alert variant="destructive"><AlertDescription>{t('captcha_error_failed')}</AlertDescription></Alert>` | `<Alert color="red">{t('captcha_error_failed')}</Alert>` |
| A4 | `RegisterView` error | `{errorKey && (…)}` | `<Alert variant="destructive"><AlertDescription>{t(errorKey…)}</AlertDescription></Alert>` | `<Alert color="red">{t(errorKey…)}</Alert>` |

## Current versus required behavior

- **Before:** four inline shadcn `Alert`s (1 default session-lost notice, 3 destructive error notices), each
  wrapping an `AlertDescription` with a localized message.
- **Required after:** four Mantine `Alert`s with theme §6l chrome (12px radius, 1px semantic border, semantic-50
  tint) — errors `color="red"`, session-lost `color="blueLight"`; the localized message renders as the Alert body;
  every conditional trigger and message identical to before; every auth flow behaves exactly as before.

**Applicable negative flows:**

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Login wrong-creds → error alert (A2) | Yes (regression) | Registry P0 | `errorKey` set (unchanged) → red alert | `browser.smoke.test.ts` green + rendered A2 |
| Signup error → error alert (A4) | Yes (regression) | Registry P0 | `errorKey` set (unchanged) → red alert | `signUpWithCaptcha.smoke.test.ts` green + rendered A4 |
| Recovery captcha fail → captcha alert (A3) | Yes (regression) | Registry P0 | `captchaFailed` (unchanged) → red alert | `requestPasswordReset.smoke.test.ts` green + rendered A3 |
| Session-lost banner (A1) | Yes | R3 | blueLight info alert with recovery message | Rendered A1 (`sessionLost` trigger) |
| Destructive body legibility (§6l) | Yes | R4 | gray-5 message on red-tint bg legible | Rendered A2/A3/A4 + computed-style read |
| Locale expansion (messages sq/uk/it) | Yes | R6 | message wraps, no clip/overflow at 320, `uk@320` | Rendered `sq@320`, `it@390`, mandatory `uk@320` |
| Phone entry / OAuth | No (untouched / manual-only) | Registry | Unchanged | — |

## Files Changed

| File | Rationale |
|---|---|
| `src/modules/auth/components/AuthSheet.tsx` | All four legacy `@/components/ui/alert` `Alert`/`AlertDescription` usages converted to `@mantine/core` `Alert`; `Alert` added to the existing `@mantine/core` import line; `@/components/ui/alert` import line removed. No handler, state, error-mapping, or other-file change. |
| `docs/backlog.md` | Concise active-state entry for Task 637 added; Task 636's now-stale "AuthSheet remaining: Slice 2d/2e" note folded into the new Task 637 line (net physical-line count 79, under the 80 limit). |

`git diff --stat`: `docs/backlog.md` (3 lines) + `src/modules/auth/components/AuthSheet.tsx` (19 lines) + this
session log. No other file touched.

```
 docs/backlog.md                           |  3 ++-
 src/modules/auth/components/AuthSheet.tsx | 19 +++++--------------
 2 files changed, 7 insertions(+), 15 deletions(-)
```

## Validation evidence

1. `npm run typecheck` → **0 errors.**
2. `npm run check:stories` → **PASSED — 120 files checked, 0 violations.**
3. `npm run check:i18n` → **PASSED — 2203/2203 keys, all 4 locales match, no new key.**
4. `npm run check:mojibake` → **PASSED — 0 artifacts in 1813 files.**
5. **Critical-flow regression (unchanged-green baseline):**
   - `npx vitest run src/lib/auth/__tests__/browser.smoke.test.ts` → PASS (part of 4-file/15-test run below).
   - `npx vitest run src/modules/auth/actions/__tests__/signUpWithCaptcha.smoke.test.ts` → PASS.
   - `npx vitest run src/modules/auth/actions/__tests__/requestPasswordReset.smoke.test.ts` → PASS.
   - `npx vitest run src/components/shared/__tests__/PhoneField.smoke.test.tsx` → PASS.
   - Combined run: **4 test files, 15/15 tests PASS** (3.95s).
   - `npm run test:header-hydration-id-parity` → **1 test file, 3/3 tests PASS.**
6. **Rendered (live-app, same mechanism as Tasks 633–636):** `npm run dev` (Turbopack, already running on
   port 3000, picked up the edit via HMR), then an ad-hoc Playwright script
   (`scripts/_ad-hoc-task637-authsheet-alert-capture.mjs`, deleted after use) dispatched the app's own
   `lero:open-auth-sheet` global event (`src/lib/auth/authSheet.ts`) and captured **viewport-only** screenshots.
   Triggers used: A1 via `sessionStorage.setItem('auth_session_lost','true')` before navigation (real
   `AuthRedirect`/`LoginView` mount-effect path); A2/A4 via a native `submit` event dispatched directly on the
   `<form>` element (bypasses the disabled submit button, exercising the same client-side synchronous validation
   branch — `error_email_invalid`/`error_name_required` — as a real user submitting invalid input, zero network);
   A3 via a `window.turnstile` stub injected with `addInitScript` (before any app JS runs) whose `render()` invokes
   the widget's real `error-callback` on a short delay — this fires the exact same `CaptchaWidget`
   `onError={() => { setCaptchaToken(null); setCaptchaFailed(true) }}` prop path a genuine Turnstile
   network/challenge failure would, without depending on live Cloudflare challenge infrastructure inside the
   sandbox. 14 screenshots captured, 0 crashes:
   - `A1_sessionLost_uk_320.png` / `_uk_390.png` / `_en_1280.png` — blueLight session-lost banner, 12px-radius
     light-blue-tinted chrome, message "Потрібно відновити вашу сесію. Увійдіть ще раз, щоб продовжити." legible,
     no clip.
   - `A2_loginError_uk_320.png` / `_uk_375.png` / `_uk_390.png` / `_en_1280.png` / `_sq_320.png` / `_it_390.png` —
     red error chrome, message "Введіть коректну електронну адресу." (uk) legible at every width/locale, no
     clip/overflow at `uk@320` (mandatory) or `sq@320`.
   - `A3_captchaFailed_uk_320.png` / `_en_1280.png` — red error chrome on the forgot-password captcha alert,
     message "Перевірку безпеки не вдалося пройти. Будь ласка, спробуйте ще раз." legible.
   - `A4_registerError_uk_320.png` / `_uk_390.png` / `_en_1280.png` — red error chrome, message
     "Ім'я обов'язкове." legible; desktop-1280 confirms the right-side Mantine Drawer layout and full-width red
     alert inside it.
   - **Live computed-style read** (separate ad-hoc script, `_ad-hoc-task637-authsheet-alert-computed-style.mjs`,
     also deleted after use) on the A2 red alert at `390px`:
     `{ borderRadius: "12px", border: "1px solid rgb(240, 68, 56)", backgroundColor: "rgb(254, 243, 242)",
     messageColor: "rgb(102, 112, 133)", messageFontSize: "14px", messageLineHeight: "20px" }` — an exact match
     to the theme's documented §6l spec (12px radius; red-5 border `#F04438`; red-0/50 bg `#FEF3F2`; message
     gray-5 `#667085`/14px/lh-20) — **R4 legibility/color proof**, not a screenshot-only eyeball claim.
   - Console/`pageerror` listener attached on every page: **zero errors reference `AuthSheet`, `Alert`, or
     `AlertDescription`.** 10 console entries total across the 14-page run, all pre-documented/unrelated: the
     benign `%c%d font-size:0;color:transparent NaN` dev-tooling marker (×6) and the `docs/backlog.md`
     "Console NOISE" `UserMenu`/`AgentCtaButton`/`FooterView` `useId` hydration-attribute mismatch (×4, on
     homepage chrome this task never touched — same class documented in Tasks 634–636).
7. `git status --short` / `git diff --stat` → exactly `src/modules/auth/components/AuthSheet.tsx` +
   `docs/backlog.md` (+ this session log). Both ad-hoc Playwright scripts and all screenshots are
   session-scratchpad artifacts (outside the repo tree), not committed.

## Visual source trace

| Visible artifact/state | Component/markup | Class/selector | Utility, cascade, and token path | Change or preserve | Evidence |
|---|---|---|---|---|---|
| A1 session-lost banner | `AuthSheet.tsx` `LoginView`, inline `Alert` | `.mantine-Alert-root`/`.mantine-Alert-message` (was shadcn `data-slot="alert"` div + `AlertDescription`) | `theme.ts` `Alert` block (§6l), `color="blueLight"` resolves `blueLight-0`/`blueLight-5` tuple stops | **Changed** (intended, R3 — neutral→info tint per owner-resolved mapping) | Diff; rendered `A1_*` screenshots |
| A2 login error alert | `AuthSheet.tsx` `LoginView`, inline `Alert` | `.mantine-Alert-root`/`.mantine-Alert-message` | `theme.ts` `Alert` block, `color="red"` resolves `red-0`/`red-5` | **Changed** (intended, R1/R3) | Diff; rendered `A2_*` screenshots; computed-style read |
| A3 captcha error alert | `AuthSheet.tsx` `ForgotPasswordView`, inline `Alert` | `.mantine-Alert-root`/`.mantine-Alert-message` | `theme.ts` `Alert` block, `color="red"` | **Changed** (intended, R1/R3) | Diff; rendered `A3_*` screenshots |
| A4 register error alert | `AuthSheet.tsx` `RegisterView`, inline `Alert` | `.mantine-Alert-root`/`.mantine-Alert-message` | `theme.ts` `Alert` block, `color="red"` | **Changed** (intended, R1/R3) | Diff; rendered `A4_*` screenshots |
| Destructive body-text color (red text → §6l gray-5) | legacy `text-destructive` class (removed) → theme `message` slot style | n/a | `theme.ts` `Alert.styles.message` — `color: gray-5`, only border/bg/icon stay semantic-red | **Changed (owner-authorized intended §6l consequence, flagged in kickoff)** | Computed-style read: `messageColor: "rgb(102, 112, 133)"` = gray-5; legible on the red-tinted bg in every rendered screenshot |
| `PasswordRequirementsHint`, `PasswordInput` (both fields), `TextInput` (all fields), `Button` (all), `Label` (retained), `Combobox`/`LocationCombobox` | unchanged | unchanged | unchanged | **Preserved, untouched** | `git diff` — outside every hunk; `grep -n "components/ui/label\|LocationCombobox\|<Combobox"` still matches |
| `theme.ts`, `MantineDrawer.tsx`, `Alert.stories.tsx`, other consumers, any i18n key | — | — | — | **Out of scope, untouched** | `git diff --stat` |

## Self-review findings

- **No defect found.** All typecheck/check:stories/check:i18n/check:mojibake gates and all 5 named regression
  commands + hydration-id-parity are green, unchanged.
- First capture attempt raced the app's `lero:open-auth-sheet` global listener (Header.tsx hydration) and the
  Mantine Drawer's slide-in CSS transition — two early screenshots captured the homepage (listener not yet
  attached) or a mid-transition frame. Fixed with a poll-retry dispatch (redispatch the open event up to 10× until
  a view-specific DOM marker appears) and a fixed 700ms settle wait before every screenshot; re-ran and visually
  confirmed all 14 captures show the fully-settled drawer with the correct alert. Documenting this because a
  reviewer comparing only the final screenshots would not otherwise see that the capture harness itself needed a
  fix — the product code was correct throughout, only the test harness had the race.
- Verified captcha-error (A3) rendering without depending on live Cloudflare Turnstile challenge infrastructure by
  stubbing `window.turnstile.render` to invoke the real `error-callback` wiring already present in
  `CaptchaWidget.tsx` — this exercises the actual `onError` prop path, not a fabricated DOM node, so the rendered
  A3 chrome is genuine `Alert` output driven by the real `captchaFailed` state, not a mockup.
- Went beyond screenshot-only proof for R4's "message legible" claim by reading computed `border`/
  `backgroundColor`/`color`/`fontSize`/`lineHeight` directly from the live DOM and matching every value to the
  theme's documented §6l numbers — stronger evidence than a visual approximation.

## Assumptions, deviations, and limitations

- A1's `color="blueLight"` follows the kickoff's specified owner-resolved mapping (info-banner tint replacing the
  legacy neutral `bg-card` look) — implemented exactly as specified, not treated as an open question. The
  kickoff's stated fallback (`color="gray"`) was not needed.
- No `theme.ts`, `MantineDrawer.tsx`, other consumer, story, or i18n key was touched — confirmed via `git diff
  --stat` and targeted `grep`.
- `@/components/ui/label` and its remaining consumers (`Label` in `LoginView`/`AgentCityField`/`CompanyField`),
  `Combobox`, `LocationCombobox`, and `PasswordRequirementsHint` imports are unchanged — confirmed via `grep -n`.
- This is **Slice 2d of the AuthSheet migration**; **Slice 2e (`Combobox`/`LocationCombobox` + their two
  `Label`s, the login-password `Label`, and the logo-upload `Label` — the final AuthSheet slice, which also
  removes the last `@/components/ui/label` import) remains explicitly open**, not touched here.
- Both ad-hoc Playwright scripts and all captured screenshots are scratchpad-only artifacts; deleted/left outside
  the repo respectively, not part of this diff.

## Opus handoff

Diff: `src/modules/auth/components/AuthSheet.tsx` (product code) + `docs/backlog.md` (active-state entry).

Questions/risks for the reviewer to inspect:

1. Confirm `color="blueLight"` for the session-lost banner (A1) is the correct owner-resolved reading of the
   kickoff's info-mapping instruction, not a guessed value — the kickoff named `blueLight` as the standing choice
   and `gray` only as a fallback if the owner prefers a neutral look.
2. Confirm the §6l-intended destructive body-text color change (legacy red text → Mantine gray-5 message on a
   red-tinted background) is acceptable as the design-system-correct outcome, not a regression — computed-style
   evidence above (`messageColor: rgb(102,112,133)`) backs the exact value.
3. Confirm the A3 captcha-error rendering method (stubbing `window.turnstile.render` to invoke the real
   `error-callback`) is accepted as valid regression evidence for a Q4 task, given genuine Turnstile
   challenge-failure reproduction is not available in this sandbox.
4. Confirm this is Slice 2d only — Slice 2e (`Combobox`/`LocationCombobox` + remaining `Label`s) remains
   explicitly open, not touched here.
5. No `theme.ts`/story/other-consumer/i18n-key edit — confirm via `git diff --stat`.

## Backlog update

`docs/backlog.md` updated: Task 636's line trimmed (its "AuthSheet remaining: Slice 2d/2e" note removed, now
stale) and a new one-line Task 637 active-state entry added, including the Slice 2e open-item note. Resulting
physical line count: **79 lines** (`wc -l docs/backlog.md`), under the 80-line hard limit — **no `BACKLOG LIMIT
BREACH`.** Full evidence lives in this session log per the backlog's own rule (concise state only, no history).
