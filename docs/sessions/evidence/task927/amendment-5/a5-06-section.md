## 16. Amendment 5 (Opus, 2026-10-25): the returning Google user — Google's standard button, Welcome back, One Tap for guests

**The owner's request** (`docs/sessions/evidence/task927/amendment-5/a5-00-owner.txt`, translated faithfully):
- Google's personalized "Continue as Andrii" button shows in the open sign-in sheet (C108, D12). It is Google's own large button (C110, C111), drawn by the working tree's container: the pushed sheet still redirects through `signInWithOAuth` (C109).
- A person who has signed in with Google before sees a Welcome back screen. It offers another sign-in method, which leads to the start screen with e-mail and password and Google's standard "Sign in with Google" button (D13).
- The owner's answers: Google's medium button without the name (D14); the account is remembered on this device (D15); Google's account chooser (One Tap) shows on every page for a guest (D16).

**What Google allows.**
- Only a medium or small button is never personalized (C112). `signin_with` reads "Sign in with Google" (C113). D14 accepts that the medium button is lower than the fields.
- `prompt()` shows One Tap (C118) and is normally called on page load (C119). `initialize` configures one client (C120): the last configuration wins (C79).
- `login_hint` accepts the token's `sub` (C121). `itp_support` enables One Tap on ITP browsers (C122). `use_fedcm_for_prompt` is ignored (C123). FedCM removed the display-moment listener methods (C125). A person who closes One Tap is not asked again for growing periods (C124).
- The FedCM iframe permission matters only inside a cross-origin iframe (C126); the site cannot be framed (C127). So no header changes (R7 stands).
- The ID token's payload carries `sub`, `email`, `name` and `picture` (C128–C131). `sub` is the account's stable identifier (C132).

**Where it fits.**
- The header owns the sheet's open state and opens every sheet (C133, C135, C136). It renders on every public page (C137). It reads the user through `useUser` (C134), whose context also exposes the auth status (C139); a guest's status is `unauthenticated` (C138).
- The sheet resets its view on each opening (C147) and titles it from a map (C146). The login view reads the session-lost flag (C142) and has its own Google handler (C143, C145). The error mapping is private to the sheet (C141).
- The cabinet's e-mail section also renders the Google button (C149). A successful self-deletion raises its toast before the sign-out (C148).

**Current state.** Today the container never prompts (C114, C115), and SEC-927-FE-DENY-NOAUTO asserts that (C116). The options test expects the large size (C117). The census excuses Google's button by D84, citing a 40 px height (C153). The contract is at `implemented` (C158). The focused baseline passes: 8 files, 119 tests (C166).

**References (GR-7), scoped to the new decision.**
- Lahomes' lock screen greets the person by name, then offers "Not you?" and a way back to the full sign-in (C161).
- TailAdmin labels its button "Sign in with Google" (C162).
- Omah's lock screen shows no identity (C163). Kamr has no returning-person screen (C164).
- medium.com refused the automated check (C165), so the owner's screenshot (Image #18, described in `a5-00`) is the reference for the composition. That composition is: avatar; name; masked e-mail; Google's button; "Forget this account"; "Not your account? More sign in options".
- Everything else is inherited canonical design (owner decision 2026-10-20): the sheet, its alerts, the slot, the avatar look (C156) and the theme's text wrap (C155).

**Scope change.** §4 listed "One Tap and automatic sign-in" as out of scope. D16 brings One Tap in. Automatic sign-in stays out: `auto_select` stays `false`, so Google signs nobody in without a click. R3's rule that the container never calls `prompt()` stands (C114). Only the new hook of R21 prompts. R18 replaces R3 (b)'s `size: 'large'` and `text: 'continue_with'`; the rest of R3 (b) stands. D2 stands for Google's own button at its new size.

**Disclosure the owner accepted (D15).** After a sign-out, this device keeps showing the last Google account's name, avatar and masked e-mail to whoever opens the sheet. The full e-mail, the credential, the nonce and every other claim are never stored.

### 16.1 Requirements

| ID | Requirement | Priority | AC |
|---|---|---|---|
| R18 [C110; C111; C112; C113; C117; C149; C153; D12; D14] | **Google's standard button.**<br>(a) In `src/lib/auth/googleIdentity.ts`, `GoogleButtonConfig` has `size: 'medium'` and `text: 'signin_with'`.<br>(b) `GoogleSignInButton.tsx` draws with `size: 'medium'` and `text: 'signin_with'`. Its width rule, centring (R16) and every other option stay.<br>(c) Every consumer gets this one look: the sheet's two views, the profile tab, the e-mail section (C149) and the deletion dialog. No consumer passes a size or text.<br>(d) In `scripts/rendered-interaction-states.json`, the three rows of C153 replace `is 40px high, Google's largest size,` with `is drawn at Google's medium size (Task 927 D14, 2026-10-25: \"Medium, without the name\", lower than the fields),`. No other row text or field changes. | P1 | AC20 |
| R19 [C128; C129; C130; C131; C132; C160; D13; D15] | **The remembered account.**<br>(a) `googleIdentity.ts` gains `credentialClaims(credential: string): Record<string, unknown> \| null`. It decodes exactly as `emailFromCredential` does today: three base64url parts, a JSON object payload, else `null`. `emailFromCredential` then reads its claim through it, with identical results.<br>(b) New browser module `src/lib/auth/rememberedGoogleAccount.ts`:<br>- `REMEMBERED_GOOGLE_ACCOUNT_KEY = 'lero:google-account'`.<br>- `interface RememberedGoogleAccount { sub: string; name: string; maskedEmail: string; picture: string \| null }`.<br>- `maskEmail(email)`: trims and lower-cases. It needs exactly one `@` with both parts non-empty, else `null`. It returns the local part's first two characters (one when the local part is one or two characters long), then five `•` (U+2022), then `@` and the domain.<br>- `rememberedAccountFromCredential(credential)`: reads the claims. `sub` must be a string matching `/^[0-9A-Za-z_-]{1,255}$/`; the e-mail must pass `maskEmail`; else `null`. `name` is the trimmed `name` claim when it is a non-empty string of at most 200 characters, else the masked e-mail. `picture` is the `picture` claim only when it parses as a URL with protocol `https:` and a hostname that is `googleusercontent.com` or ends with `.googleusercontent.com` (C131), else `null`. It returns only these four fields.<br>- `saveRememberedGoogleAccount(account)` writes exactly those four keys as JSON under the key.<br>- `readRememberedGoogleAccount()` returns a record only when the stored JSON is an object with exactly those four keys, each passing the same rules: `name` a non-empty string of at most 200 characters; `maskedEmail` a string containing `•••••@`. Anything else removes the key and returns `null`.<br>- `forgetRememberedGoogleAccount()` removes the key.<br>- A storage exception (a private window, blocked storage) is caught: reading gives `null`, writing and removing do nothing.<br>- Nothing else is ever stored: not the credential, the nonce, the full e-mail or any other claim. | P1 | AC21, AC24 |
| R20 [C141; C143; C145; D3; D13; D15] | **One completion for every Google sign-in.**<br>(a) `mapAuthError` moves unchanged, with its comment, into `src/modules/auth/lib/mapAuthError.ts` as an export. `AuthSheet.tsx` imports it; its uses there do not change.<br>(b) New `src/modules/auth/lib/googleSignIn.ts`:<br>- `completeGoogleSignIn({ credential, nonce }): Promise<string \| null>` awaits `signInWithGoogleIdToken(credential, nonce)`. A thrown rejection returns `'error_generic'`; `result.error` returns `mapAuthError(result.error.message)`. On success it saves `rememberedAccountFromCredential(credential)` when that is not `null`, then returns `null`.<br>- `openStoredDestination(router)` takes `sanitizeReturnTo(sessionStorage.getItem('auth_redirect_next'))`. A value is removed from the storage and pushed; otherwise `router.refresh()` (the rule of R5).<br>(c) The login view's `handleGoogle` (C143) clears the error, awaits `completeGoogleSignIn`, and on a key sets it and stops. On `null` it calls `onClose()`, then `openStoredDestination(router)`. The password submit is byte-identical. | P1 | AC22 |
| R21 [C114; C115; C118; C119; C120; C122; C123; C124; C125; C126; C127; C159; D12; D16] | **One Tap for a guest.**<br>(a) In `googleIdentity.ts`, `GoogleAccountsId` gains `prompt: () => void`. Its comment says that only the One Tap hook calls it. `GoogleIdInitializeConfig` gains the optional `itp_support?: true`. No `use_fedcm_for_prompt` (C123) and no prompt listener (C125).<br>(b) New hook `src/lib/auth/useGoogleOneTap.ts` (`'use client'`): `useGoogleOneTap({ clientId, guest, sheetOpen, onCredential })`, with `usePathname()` and `useLocale()`.<br>- It prompts at most once per pathname, while `clientId` is set, `guest` is true and `sheetOpen` is false. A pathname is handled once it was prompted, or once the sheet was open on it. Closing the sheet therefore never raises One Tap on the same page; the next page may.<br>- To prompt: `loadGoogleIdentity(locale)`, a new `createNoncePair()`, then `initialize({ client_id, callback, nonce: hashedNonce, auto_select: false, context: 'signin', ux_mode: 'popup', itp_support: true })`, then `prompt()` with no argument.<br>- The callback ignores an empty credential, a credential while one is pending, and any credential after the effect's cleanup. It calls `onCredential({ credential, nonce })` with that prompt's raw nonce. A pair serves one prompt only.<br>- The cleanup runs when `guest` turns false, `sheetOpen` turns true, the pathname changes or the header unmounts. It calls `cancel()` when it had initialized, and later callbacks are ignored. A pending `onCredential` is not interrupted.<br>- A load failure or a missing API shows nothing and is not retried on that pathname. The sheet's button keeps its own unavailable state.<br>- The credential and the raw nonce live only in memory (R3 (e)).<br>(c) `GoogleSignInButton` still never calls `prompt()` (C114). | P1 | AC23 |
| R22 [C133; C134; C135; C136; C138; C139; C157; D3; D15; D16] | **The header.**<br>(a) `Header.tsx` also reads `status` from `useUser()`. It calls `useGoogleOneTap({ clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID, guest: status === 'unauthenticated', sheetOpen: authOpen, onCredential: handleOneTap })`.<br>(b) `handleOneTap` awaits `completeGoogleSignIn`. A key gives `toast.error(t(key))`, with `useTranslations('auth')` (C157), and nothing else. `null` gives `openStoredDestination(router)`.<br>(c) A `googleAccount` state: `openAuthSheet(view)` first sets it to `readRememberedGoogleAccount()`. The sheet gets `googleAccount={googleAccount}` and `onForgetGoogleAccount`, which calls `forgetRememberedGoogleAccount()` and sets the state to `null`.<br>(d) `handleLogout` is unchanged: a sign-out keeps the record (D15).<br>(e) `src/components/layout/__tests__/headerFooterContainers.test.tsx` mocks `next-intl` with `useLocale` only (C150), and its header view renders nothing (C151). If its run fails on `useTranslations`, its mock gains `useTranslations: () => (key: string) => key`. No assertion changes. | P1 | AC23, AC24 |
| R23 [C144; C154; C155; C156; C161; C162; C165; D13; D14] | **View `src/components/auth/GoogleWelcomeBack.tsx` (CREATE, see 16.3).**<br>(a) Stateless (`'use client'`, `useTranslations('auth')`, `useMantineTheme()`). Props: `name`, `maskedEmail`, `picture: string \| null`, `googleControl: ReactNode`, `alerts?: ReactNode`, `onForget`, `onMoreOptions`.<br>(b) The root is `Stack gap="md" pb="xl"`, the login form's rhythm token (C144). Its children, in order:<br>1. `alerts`.<br>2. An identity `Stack gap="xs" align="center"`: `Avatar src={picture ?? undefined} name={name} color="brand" size={theme.other.iconSize.colossal} aria-hidden` (C154, C156); `Text fw={600} size="lg" ta="center"` with the name; `Text size="sm" c="dimmed" ta="center"` with the masked e-mail.<br>3. `googleControl`.<br>4. A `Center` with `Anchor component="button" type="button" size="sm" c="brand" onClick={onForget}` and `auth.welcome_back_forget`.<br>5. `Text ta="center" size="sm" c="dimmed"` with `auth.welcome_back_not_you`, a space, and `Anchor component="button" type="button" size="sm" c="brand" onClick={onMoreOptions}` with `auth.welcome_back_more_options`.<br>(c) No `style`, `styles`, `className` or raw visual value. The name and the e-mail wrap through the theme's `Text` (C155); nothing clamps them.<br>(d) Direct Story `src/stories/patterns/mantine/GoogleWelcomeBack.stories.tsx`, title `Patterns/Mantine/GoogleWelcomeBack`, exports `Initials`, `Picture`, `LongName`, `WithAlerts`. The locale comes from the toolbar (`context.globals.locale`). Fixture texts come through `storyT` from three new `storybook.mantine` keys of R27. The fixture `sub` is `000000000000000000001`.<br>- `Initials`: picture `null`.<br>- `Picture`: picture `/og-default.png`, as the Avatar Story does.<br>- `LongName`: the long-name key, picture `null`.<br>- `WithAlerts`: `alerts` is `<Alert color="blueLight">` with `auth.session_recovery_message`, then `<Alert color="red">` with `auth.error_invalid_credentials` (the sheet's two looks).<br>- In every export, `googleControl` is `<GoogleSignInButton clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID} loginHint="000000000000000000001" onCredential={async () => {}} />`. Google then draws its real button, as in the deletion Story's ready section (R17 (b)). `onForget` and `onMoreOptions` are no-ops.<br>- No decorator, wrapper, width or style. The Story opens no portal, so it has no row in `scripts/rendered-interaction-states.json`.<br>(e) `scripts/mantine-migration-scope.json` enrols `src/components/auth/GoogleWelcomeBack.tsx`. `scripts/ui-contract-registry.json` gets a row: id `google-welcome-back`; component that file; story the new file; token owner `src/design-system/mantine/theme.ts`; parity element `the returning person's identity block of the sign-in sheet`; story exports `Initials`, `Picture`, `LongName`, `WithAlerts`. | P1 | AC26 |
| R24 [C140; C142; C146; C147; D13; D15] | **The sheet's Welcome back view.**<br>(a) `AuthView` (C140) gains `'welcome-back'`. `AuthSheetProps` gains `googleAccount?: RememberedGoogleAccount \| null` and `onForgetGoogleAccount?: () => void`.<br>(b) On opening (C147), the view is `'welcome-back'` when `initialView === 'login'` and `googleAccount` is set; otherwise it is `initialView`. The effect also depends on `googleAccount`.<br>(c) The title map (C146) gains `'welcome-back': t('welcome_back_title')`.<br>(d) A new inner `WelcomeBackView` in `AuthSheet.tsx` holds its own `errorKey`. It reads the session-lost flag exactly as the login view does (C142). Its `handleGoogle` is the login view's of R20 (c). It renders `GoogleWelcomeBack` with:<br>- the account's `name`, `maskedEmail` and `picture`;<br>- `alerts`: the blue session-lost alert, then the red error alert, each only when set, as in the login view;<br>- `googleControl`: `<GoogleSignInButton clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID} loginHint={account.sub} onCredential={handleGoogle} />` (C121).<br>(e) "More sign-in options" sets the view to `'login'` and keeps the record. "Forget this account" calls `onForgetGoogleAccount?.()`, then sets the view to `'login'`.<br>(f) The login, registration and forgot-password views are otherwise unchanged. `src/lib/auth/authSheet.ts` and its event are unchanged: only the sheet chooses `'welcome-back'`. | P1 | AC24, AC26 |
| R25 [C152; C153; D13] | **The sheet's Story and census row.**<br>(a) `AuthSheet.stories.tsx` gains `WelcomeBack`, rendered after `Login` (C152). Its `render` takes the toolbar locale and renders `<AuthSheet key={`welcome-back-${locale}`} open onOpenChange={() => {}} initialView="login" googleAccount={...} onForgetGoogleAccount={() => {}} />`. The account is `sub` `000000000000000000001`, the demo name and e-mail keys of R27 through `storyT`, and picture `null`.<br>(b) `scripts/rendered-interaction-states.json` gains `patterns-mantine-authsheet--welcome-back`, a copy of the `Login` row with R18 (d)'s text. | P1 | AC26 |
| R26 [C148; D15] | **A deleted account is forgotten.** In `ProfileTab.tsx`, the success branch of `handleDeleteAccount` calls `forgetRememberedGoogleAccount()` immediately before `toast.success(t('delete_account_success'))` (C148). A refused or failed deletion keeps the record. Nothing else changes. | P1 | AC25 |
| R27 [D13] | **Locale keys.**<br>- `auth.welcome_back_title`: en `Welcome back`; sq `Mirë se u kthyet`; uk `З поверненням`; it `Ti diamo il bentornato`.<br>- `auth.welcome_back_forget`: en `Forget this account`; sq `Harroje këtë llogari`; uk `Забути цей обліковий запис`; it `Dimentica questo account`.<br>- `auth.welcome_back_not_you`: en `Not your account?`; sq `Nuk është llogaria juaj?`; uk `Не ваш обліковий запис?`; it `Non è il tuo account?`.<br>- `auth.welcome_back_more_options`: en `More sign-in options`; sq `Mënyra të tjera hyrjeje`; uk `Інші способи входу`; it `Altri modi per accedere`.<br>- `storybook.mantine.google_welcome_demo_name`: `Arta Krasniqi` in all four locales.<br>- `storybook.mantine.google_welcome_demo_long_name`: `Aleksandra-Konstantina Papadhopulli-Dhimitrakopoulou` in all four locales.<br>- `storybook.mantine.google_welcome_demo_email`: `ar•••••@example.com` in all four locales. | P1 | AC26 |
| R28 [C116; C117; C150; C151; C166; D6] | **Tests** (cases in the contract; each new security test is a top-level `it(...)` whose full name is its `testName`).<br>(a) `AuthSheet.google.security.test.tsx`: the options test expects `size: 'medium', text: 'signin_with'`. SEC-927-FE-DENY-NOAUTO is unchanged: the sheet never prompts.<br>(b) New `src/lib/auth/__tests__/rememberedGoogleAccount.test.ts`: SEC-927-FE-UNIT-REMEMBER.<br>(c) New `src/components/layout/__tests__/Header.google.security.test.tsx`. It renders the real `Header`, `HeaderView`, `AuthSheet`, `GoogleWelcomeBack`, `GoogleSignInButton`, `GoogleSignInSlot`, `useGoogleOneTap`, `googleIdentity`, `rememberedGoogleAccount`, `googleSignIn`, `mapAuthError` and `sanitizeReturnTo`.<br>- The doubles are: `@/modules/auth/hooks/useUser` (a mutable `{ user, status, signOut, isSigningOut }`); `@/lib/auth/browser`; `next/navigation` (`useRouter`, and `usePathname` with a mutable path); `@/lib/toast`; `NotificationBell`; `@/modules/admin/actions/locale`; the captcha, companies and locations modules as in `AuthSheet.google.security.test.tsx`; and `useElementSize`.<br>- The GIS double is installed when the test fires the script's `load`, as in that file, with `prompt` added.<br>- The synthetic credential is a three-part token whose payload holds `sub` `000000000000000000001`, `name` `Arta Krasniqi`, `email` `arta.synthetic@example.com` and `picture` `https://lh3.googleusercontent.com/a/zz-synthetic`.<br>- Cases: SEC-927-FE-ONETAP-ALLOW, -DENY-NOTGUEST, -DENY-SHEET, -DENY-REDIRECT and -ERR; SEC-927-FE-REMEMBER-ALLOW, -DENY-HOSTILE and -FORGET; SEC-927-FE-WELCOME-DENY-BANNED.<br>(d) `Header.signOut.test.tsx`: SEC-927-FE-REMEMBER-KEEP, through the file's own sign-out operation.<br>(e) `ProfileTab.deletePassword.security.test.tsx`: SEC-927-FE-REMEMBER-DELETE.<br>(f) Every existing assertion of the files above, and of the other files in the contract scope, is kept. | P1 | AC21–AC25, AC27 |

### 16.2 Acceptance criteria

All evidence goes in `docs/sessions/evidence/task927/a5/`. Each file records platform, Node, cwd, command, output and exit code.
- **Hashes.** The first file, `a5-00`, holds the sha256 of every scope path before its first edit; `a5-99` holds them after the last.
- **Baseline.** Before the first write, `a5-01-base` holds the full `npx vitest run --reporter=json`. It is compared with `docs/sessions/evidence/task923/r32-03d-failing-ids.txt` through `docs/sessions/evidence/task923/r34-03c-compare.mjs`.

- **AC20 [R18].** The button options test passes for slot widths 288, 358 and 420, with `size: 'medium'` and `text: 'signin_with'`. A grep of `src/` finds `continue_with` nowhere and `size: 'large'` in neither Google file. A grep of `scripts/rendered-interaction-states.json` finds `40px high` nowhere and `Task 927 D14` in four rows (with R25 (b)'s).
- **AC21 [R19].** SEC-927-FE-UNIT-REMEMBER passes. It covers:
  - masking: `arta.synthetic@example.com` gives `ar•••••@example.com`; `a@example.com` gives `a•••••@example.com`; a value with no `@` or two gives `null`;
  - a credential that is not three parts, a payload without `sub`, and a `sub` with a space each give `null`;
  - a 201-character name falls back to the masked e-mail;
  - each disallowed picture gives `null` picture: `http://lh3.googleusercontent.com/a`, `https://evil.example/p.png`, `https://googleusercontent.com.evil.example/p.png` and `javascript:alert(1)`;
  - `saveRememberedGoogleAccount` writes exactly the four keys;
  - with a `localStorage` that throws, reading gives `null` and writing and removing do not throw.

  `src/lib/auth/__tests__/googleIdentity.test.ts` passes unchanged.
- **AC22 [R20].** `AuthSheet.google.security.test.tsx` (its assertions unchanged except AC20's), `AuthSheet.test.tsx` and `AuthSheet.banned.security.test.tsx` pass. A grep of `src/` finds `function mapAuthError` only in `src/modules/auth/lib/mapAuthError.ts`.
- **AC23 [R21; R22].** These cases pass:
  - **SEC-927-FE-ONETAP-ALLOW.** A guest on `/en/listings`: `prompt` once, and `initialize` got exactly `client_id`, a callback, the SHA-256 hex of the raw nonce, `auto_select: false`, `context: 'signin'`, `ux_mode: 'popup'` and `itp_support: true`. Picking the account calls `signInWithGoogleIdToken` once, with the credential and that raw nonce. The stored `/en/favorites?tab=2` is pushed and its key cleared. The record is saved.
  - **SEC-927-FE-ONETAP-DENY-NOTGUEST.** For `initializing`, `authenticated`, `refreshing`, `signing_out` and `error`: no GIS script element, no `initialize` and no `prompt`.
  - **SEC-927-FE-ONETAP-DENY-SHEET.**
    - The sheet opened after One Tap: `cancel` is called. A credential then given to One Tap's callback calls nothing. Closing the sheet prompts nothing on the same path. A new path prompts once, with a new nonce.
    - The sheet opened on a path before any prompt: closing it prompts nothing on that path.
  - **SEC-927-FE-ONETAP-DENY-REDIRECT.** For `https://evil.example/steal`, `//evil.example`, `/\evil.example` and `javascript:alert(1)`: refresh, no push.
  - **SEC-927-FE-ONETAP-ERR.**
    - A banned account gets `toast.error` with `auth.error_invalid_credentials`, in sq, en, uk and it. A thrown rejection gets `auth.error_generic`. Neither pushes, refreshes or saves a record.
    - A script `error` shows nothing, calls no `prompt` and raises no toast.
  - **Sensitivity**, each restored to a pass:
    - Removing the `guest` condition fails ONETAP-DENY-NOTGUEST.
    - Removing the marking of a path the sheet was open on fails ONETAP-DENY-SHEET.
- **AC24 [R19; R22; R24].** These cases pass:
  - **SEC-927-FE-REMEMBER-ALLOW.** After a Google sign-in in the sheet:
    - `localStorage` holds exactly `{ sub, name, maskedEmail, picture }` under the key.
    - Neither storage, the console, the URL nor the cookie contains the credential, the raw nonce or `arta.synthetic@example.com`.
    - Reopening the sheet shows `auth.welcome_back_title`, `Arta Krasniqi` and `ar•••••@example.com`.
    - Its `initialize` got `login_hint` `000000000000000000001`, and `renderButton` got `size: 'medium', text: 'signin_with'`.
  - **SEC-927-FE-REMEMBER-DENY-HOSTILE.**
    - A stored name `<img src=x onerror=alert(1)>` renders as text: there is no `img` with `src` `x`.
    - Each of these opens the login view and removes the key: picture `javascript:alert(1)`; picture `https://evil.example/p.png`; an `http:` Google picture; an extra `credential` field; malformed JSON; a missing `sub`.
    - No `img` element points to `evil.example`.
  - **SEC-927-FE-REMEMBER-FORGET.** "Forget this account" removes the key and shows the login view; the next opening shows the login view. "More sign-in options" shows the login view and keeps the key; the next opening shows Welcome back.
  - **SEC-927-FE-WELCOME-DENY-BANNED.** A banned account through Welcome back's button shows the wrong-credentials alert in that view. The sheet stays open, and the record is unchanged.
  - **Sensitivity**, each restored to a pass:
    - Saving the credential as a fifth field fails REMEMBER-ALLOW.
    - Dropping the picture's host check fails REMEMBER-DENY-HOSTILE.
- **AC25 [R22; R26].** These cases pass:
  - **SEC-927-FE-REMEMBER-DELETE.** A successful deletion removes the key. A deletion refused with `invalid_password` keeps it.
  - **SEC-927-FE-REMEMBER-KEEP.** A record saved before the sign-out is byte-identical after it.
  - **Sensitivity**, restored to a pass: removing R26's call fails REMEMBER-DELETE.
- **AC26 [R18; R23; R24; R25; R27].** On a fresh `npm run build-storybook`:
  - `a5-10`: `npm run check:i18n`, `npm run check:ui-contract:verify` (it lists `GoogleWelcomeBack.tsx` among the newly enrolled, without a failure) and `npm run check:rendered-state-census:verify` exit 0.
  - `a5-11`: `node scripts/check-rendered-state-census.mjs --stories` exits 0 for these Stories: `patterns-mantine-authsheet--login`, `patterns-mantine-authsheet--login-validation-error`, `patterns-mantine-authsheet--welcome-back`, `patterns-mantine-googlewelcomeback--initials`, `patterns-mantine-googlewelcomeback--picture`, `patterns-mantine-googlewelcomeback--long-name`, `patterns-mantine-googlewelcomeback--with-alerts` and `mantine-primitives-modal--delete-confirm-password`.
  - `a5-12`: a probe by the executor, `a5-12-rhythm.mjs`, over 320, 375, 390, 480, 560, 639, 640, 680, 768, 810, 960, 1024, 1200, 1440, 1920 and 2560 × sq, en, uk, it, on the four `GoogleWelcomeBack` exports and AuthSheet `WelcomeBack`. It checks:
    - every gap between consecutive children of each Stack of the view equals that Stack's computed `row-gap` (GR-3h);
    - the name and the e-mail have `scrollWidth <= clientWidth`, no ellipsis and no line clamp, and `LongName`'s name wraps at 320 (GR-3i);
    - no horizontal overflow at the page or the view (GR-3j).

    It also records the height of Google's button (`.nsm7Bb-HzV7m-LgbsSe`) in `WelcomeBack`, `Login` and the deletion Story's ready section. The three are equal (one look, D2).
  - `a5-13`: DPR-1 crops of the avatar in `Initials` and `Picture`, en, at 320 and 1440.
  - `node scripts/check-mobile-adaptation-contract.mjs --files` exits 0, given this kickoff and every changed `.tsx`.
- **AC27 [R18–R28; D6].**
  - `a5-20`: the full `npx vitest run --reporter=json` shows no new failing ID against the base.
  - `a5-21`: `npm run typecheck`, `npx eslint . --quiet` and `npm run build` exit 0.
  - `a5-22`: the contract's report through `docs/sessions/evidence/task927/security/make-report.mjs`, with the approved target set as before. All cases pass, the DB and provider cases included.
  - Then the stage goes to `implemented`, and `cli.mjs verify` exits 0.
  - **Report.** The report goes in the session record `docs/sessions/2026-10-10-task923-rendered-state-census.md`, as "Task 927 Amendment 5 executor report". It lists every path with its sha256 before and after, every deviation and each evidence file. It ends with `PARTIALLY IMPLEMENTED`, because the owner's checks remain.

**OWNER VISUAL QA REQUIRED (after Opus's review).**
- **Storybook.** `GoogleWelcomeBack` × {`Initials`, `Picture`, `LongName`, `WithAlerts`} and AuthSheet × {`WelcomeBack`, `Login`} × {sq, en, uk, it} × {320, 390, 639, 640, 1440}.
- **On `http://localhost:3000`, never lero.al**, in Chrome as a guest signed in to Google:
  - One Tap appears on the home page.
  - Closing it hides it.
  - Signing in through it lands signed in, on the same page.
  - After a sign-out, the sheet opens on Welcome back.
  - "More sign-in options" shows the e-mail form and Google's "Sign in with Google" button.
  - "Forget this account" returns to the e-mail form for good.
  - Deleting a throw-away Google account leaves no Welcome back.

### 16.3 Canonical decision, references and proof

**GR-0.**
- Semantic queries: "returning user", "welcome back", "account identity block", "avatar with name", "sign-in alternatives link".
- Candidates inspected:
  - `MantineAuthFormPattern` (`src/design-system/mantine/patterns/MantineAuthFormPattern.tsx`): an e-mail/password form with no identity block;
  - the sheet's login view (C144, C145);
  - the header's mobile drawer and user menu, avatar plus name (C156): a navigation row, not a sign-in screen;
  - the Mantine `Avatar` Story (`Mantine/Primitives/Avatar` `Default`);
  - `GoogleSignInSlot` (R4).
- Decision: **CREATE** `GoogleWelcomeBack`. No candidate shows a remembered person with a provider control and the two exits. It is composed of Mantine `Stack`, `Avatar`, `Text`, `Center` and `Anchor`, with the slot through `googleControl`.
- **REUSE**: the avatar look (C156); the sheet's alerts; the anchor and text looks of the login view; the form rhythm `gap="md"` (C144).
- Token owner: `src/design-system/mantine/theme.ts`. New hardcoded visual values: none.
- `useGoogleOneTap` renders nothing; Google draws its prompt in the browser. It needs no Story, and it is not enrolled.

**GR-12.**
- `GR-12 ELEMENT PARITY — Google sign-in control (Amendment 5): Stories compared 3 (AuthSheet Login, AuthSheet WelcomeBack, Modal DeleteConfirmPassword ready section; census a5-12); meanings 1; meanings with more than one look: NONE — Google's medium button everywhere (owner decisions: D2, D14); hardcode in changed files and their Stories: NONE.`
- `GR-12 ELEMENT PARITY — returning person's identity block: Stories compared 5 (GoogleWelcomeBack ×4, AuthSheet WelcomeBack; census a5-12); meanings 1; meanings with more than one look: NONE (owner decisions: none); hardcode in changed files and their Stories: NONE.`

**GR-7.**
`GR-7 REFERENCE RESEARCH — moment: task design; role: Opus; task: 927 Amendment 5; subject: the returning-person sign-in; references: Lahomes, Kamr, Omah, TailAdmin, medium.com (owner); library: docs/research/references/2026-10-04; live-checked pages: Lahomes auth-lock-screen.html and auth-signin.html, Omah pages/lock-screen.html and pages/login.html, TailAdmin /signin, Kamr /login, at 390 and 1440 (docs/sessions/evidence/task927/amendment-5/gr7/); medium.com answered 403 to the automated check, UNVERIFIED live, the owner's screenshot used instead; workflow states operated: none submitted; options across references: a named identity with "Not you?" back to the full sign-in (Lahomes, Medium), no identity (Omah), none (Kamr, TailAdmin); chosen 2026 best practice: Medium's composition inside the sheet — avatar, name, masked e-mail, Google's standard button, Forget this account, Not your account? More sign-in options.`

**Rhythm tokens.** The view's root is `Stack gap="md"` (R23 (b), the value of C144). Its identity block is `Stack gap="xs"`. The probe of AC26 measures both.

**Rendered proof.** The direct Story `GoogleWelcomeBack`. Composition: AuthSheet `WelcomeBack`, plus its census row (R25 (b)). The header's One Tap has no rendered proof of ours, because Google's browser UI draws it. Its proof is SEC-927-FE-ONETAP-* and the owner's native check.

### 16.4 Execution preconditions

- **Root and contract.** Root `C:\Claude_Code_Projects\lero-al`. This contract only, while it is `ready`.
- **Reads before the first write.** In that session, read:
  - §1, §4, §7, §13, §15 and this section;
  - rows C108–C166 and D12–D16;
  - `GoogleSignInButton.tsx`, `GoogleSignInSlot.tsx`, `googleIdentity.ts`, `AuthSheet.tsx`, `Header.tsx`, `ProfileTab.tsx`, `AuthSheet.stories.tsx` and `Modal.stories.tsx`;
  - the three test files of R28 (a), (d) and (e);
  - `Header.signOut.test.tsx`.

  Then run `cli.mjs receipt` for this contract.
- **UI receipts.** Register each through the PowerShell tool; the helper call is the command's only statement.
  - CanonicalReuse: `GR-0 CANONICAL REUSE PREFLIGHT - request: the returning person view of the sign-in sheet, Google medium button and One Tap; semantic queries: returning user, welcome back, account identity block, avatar with name, sign-in alternatives link; inspected candidates: src/design-system/mantine/patterns/MantineAuthFormPattern.tsx, src/modules/auth/components/AuthSheet.tsx, src/components/layout/MobileNavDrawer.tsx, src/stories/mantine/primitives/Avatar.stories.tsx, src/components/auth/GoogleSignInSlot.tsx; decision: CREATE; selected canonical owner: src/components/auth/GoogleWelcomeBack.tsx; Mantine/TailAdmin token path: src/design-system/mantine/theme.ts; new hardcoded visual values: NONE; rationale: no candidate shows a remembered person with a provider control and both exits, so a stateless Mantine composition is created with its direct Story.`
  - UiContract: `UI CONTRACT PREFLIGHT COMPLETE - scope: src/components/auth/GoogleWelcomeBack.tsx, src/components/auth/GoogleSignInButton.tsx, src/modules/auth/components/AuthSheet.tsx, src/components/layout/Header.tsx, src/modules/cabinet/components/ProfileTab.tsx; canonical owner: src/components/auth/GoogleWelcomeBack.tsx; token owner: src/design-system/mantine/theme.ts; direct Story: src/stories/patterns/mantine/GoogleWelcomeBack.stories.tsx.`
  - MobileAdaptation: `MOBILE ADAPTATION PREFLIGHT COMPLETE - surfaces: src/components/auth/GoogleWelcomeBack.tsx identity block, Google slot and exits, src/modules/auth/components/AuthSheet.tsx Welcome back view; component families: overlay-and-disclosure, form-picker-and-choice; pattern IDs: overlay-adaptive, form-stack; standards: w3c-focus-order, w3c-hover-focus, apple-hig-sheets, android-common-layouts, android-adapt-layouts, w3c-labels-instructions, w3c-reflow, apple-hig-layout, android-content-structure; mantine mechanism: responsive-props; mantine owner: src/design-system/mantine/patterns/MantineDrawer.tsx; mobile range: <640px (theme.other.mobileGate / sm); mobile order: alerts; avatar; name; masked e-mail; Google button; Forget this account; Not your account? More sign-in options; required content: no semantic loss; verification: src/stories/patterns/mantine/GoogleWelcomeBack.stories.tsx and the AuthSheet WelcomeBack Story across the <640px widths 320, 375, 390, 480, 560, 639 and the 640px transition x sq, en, uk, it.`
  - StorybookProof, once per Story file before its write:
    - `STORYBOOK PROOF PREFLIGHT COMPLETE - direct Story: src/stories/patterns/mantine/GoogleWelcomeBack.stories.tsx; production component: GoogleWelcomeBack, GoogleSignInButton; allowed public states: name, maskedEmail, picture, googleControl, alerts, onForget, onMoreOptions; local presentation: NONE.`
    - `STORYBOOK PROOF PREFLIGHT COMPLETE - direct Story: src/stories/patterns/mantine/AuthSheet.stories.tsx; production component: AuthSheet; allowed public states: open, onOpenChange, initialView, googleAccount, onForgetGoogleAccount; local presentation: NONE.`
- **Shared files.** The messages, both registries, `ProfileTab.tsx`, `Header.tsx` and the Story files carry other tasks' uncommitted lines. Change only the lines this section names.
- **Before** `npm run build-storybook` and `npm run build`, run the two read-only commands of `docs/sessions/evidence/task923/review-50/rv50-06-dev-server.txt`. If both counts are 0, continue. Otherwise ask the owner to stop `npm run dev` and wait.
- **Integration.** `a5-22` needs `SECURITY_TEST_TARGET=development`, `SECURITY_TEST_PROJECT_REF` and the Supabase URL from `.env.local`, as in `a4-08`. Never print them.
- **No commit, no SQL and no database change.**

**Order of work (replaces §15.3's).**
1. The owner commits this amendment.
2. Sonnet executes R18–R28.
3. Opus reviews them.
4. The owner's visual QA and native checks of 16.2.
5. The local part of AC12 again.

Task 923's order then continues: its final review, the one push, and AC12 on production.
