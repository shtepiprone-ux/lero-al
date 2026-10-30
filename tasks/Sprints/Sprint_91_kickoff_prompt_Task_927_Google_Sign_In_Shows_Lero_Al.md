# Task 927 — Google sign-in through Google Identity Services: the visitor signs in to Lero.al, not to a Supabase subdomain

Sprint 91. P1. QA profile **Q4** (auth / account lifecycle, `docs/qa-profiles.md`). Kickoff by Opus, 2026-10-20, from the owner's
written specification of 2026-10-20 (D1, D3–D8) and the owner's answer on the button (D2), each with its own ledger row.

## 1. Mode, task type and rule bundle

Task design for a fresh Sonnet session. Types (`docs/rule-index.md`): Auth / Email / Account Lifecycle, UI (current Mantine path) for
the login view of the sign-in sheet, Storybook / Visual Proof for one new direct Story. Bundle:
`.claude/rules/shared/workflow-gates.md`, `security-testing.md` with `security-test-quality.md`, `security-test-environment.md`,
`security-test-boundaries.md`; `mobile-adaptation-contract.md`, `ui-token-contract.md`, `enforcement-model.md`, `storybook-proof.md`,
`rendered-state-census.md`; `docs/env.md`, `docs/domain-rules.md`, `docs/qa-rules.md`, `docs/integrations.md`,
`docs/app-lifecycle-contract.md`, `docs/mantine-responsive-design-system.md`.

## 2. Objective

The Google button of the sign-in sheet stops redirecting the browser to `<project>.supabase.co`. Google Identity Services (GIS) renders
Google's own button in the sheet; the visitor picks an account in Google's popup, which names Lero.al; the returned ID token and a
per-attempt nonce go to `supabase.auth.signInWithIdToken`; the sheet closes and the visitor lands where the password sign-in would take
them. The cabinet profile tab's Google re-confirmation (before an e-mail change or an account deletion) uses the same button and the
same call, and `signInWithOAuth` leaves the code (Amendment 2, §12). Nothing about the e-mail/password sign-in, the Supabase client
secret or the server changes.

## 3. Verified context

Today the Google button calls `signInWithOAuth` (C1, C2), which leaves the site through Supabase's own domain (C28). The password path
reads the stored destination through `sanitizeReturnTo` and pushes or refreshes (C3, C4, C5) and answers a ban with the wrong-credentials
text (C6, C52). The Google control is a Mantine button in the login form, whose blocks are 16 px apart (C7, C8, C36, C37). A new
`auth.users` row creates its `public.users` row in a database trigger, in the same insert (C12, C13, C14, C15); the controller signs a
browser out when the server reports no user (C16, C17, C18, C19), so that trigger is what keeps a first Google sign-in signed in. The
security headers set no script, frame or connect policy (C20) and the referrer policy Google recommends (C21, C22). Supabase Auth does
not ask for a CAPTCHA on the `id_token` grant (C33). GIS returns an ID token in `credential` (C29), the button is at most 400 px wide
(C30) and takes a locale (C31). Supabase wants the SHA-256 hex of the nonce at Google and the raw nonce at `signInWithIdToken` (C23,
C24), its nonce check on (C25), the web client ID in its client-ID list (C26); Google wants every origin registered (C27, C32). The
auth files are uncommitted Task 923 work (C44, C45, C53, C54) and Task 926 also edits `AuthSheet.tsx` (C46). Four existing tests assert
`signInWithOAuth` (C47, C48, C49, C50).

## Claim ledger

| ID | Status | Claim | Evidence |
|---|---|---|---|
| C1 | FACT | Before this task (design read of `AuthSheet.tsx` line 102), the Google button of the login view calls `signInWithOAuth`. | source: `docs/sessions/evidence/task927/design/sources/design-read-AuthSheet.txt:141-141`; observed: `await signInWithOAuth('google', next ?` |
| C2 | FACT | Before this task (design read of `browser.ts` lines 26–30), `signInWithOAuth` is a thin wrapper of Supabase's redirect flow. | source: `docs/sessions/evidence/task927/design/sources/design-read-browser.txt:65-69`; observed: `return createClient().auth.signInWithOAuth({` |
| C3 | FACT | Before this task (lines 100–101), the Google path reads the stored destination through `sanitizeReturnTo`. | source: `docs/sessions/evidence/task927/design/sources/design-read-AuthSheet.txt:139-140`; observed: `const next = sanitizeReturnTo(sessionStorage.getItem('auth_redirect_next'))` |
| C4 | FACT | Before this task (lines 88–94), after a password sign-in the sheet pushes the stored destination. | source: `docs/sessions/evidence/task927/design/sources/design-read-AuthSheet.txt:127-133`; observed: `router.push(next)` |
| C5 | FACT | `sanitizeReturnTo` refuses a value with a URL scheme. | source: `src/modules/auth/lib/sanitizeReturnTo.ts:26-26`; observed: `if (/^[a-z][a-z0-9+.\-]*:/i.test(raw)) return null` |
| C6 | FACT | Before this task (line 37), a banned account is answered with the wrong-credentials text. | source: `docs/sessions/evidence/task927/design/sources/design-read-AuthSheet.txt:76-76`; observed: `A banned account gets the wrong-credentials text` |
| C7 | FACT | Before this task (lines 149–164), the Google control is a Mantine button with a click handler. | source: `docs/sessions/evidence/task927/design/sources/design-read-AuthSheet.txt:188-203`; observed: `onClick={handleGoogle}` |
| C8 | FACT | Before this task (line 106), the login form is a Mantine Stack with the `md` gap. | source: `docs/sessions/evidence/task927/design/sources/design-read-AuthSheet.txt:145-145`; observed: `<Stack component="form" onSubmit={handleSubmit} gap="md" pb="xl">` |
| C9 | FACT | Before this task (line 111), the login view shows its error in a red Mantine Alert. | source: `docs/sessions/evidence/task927/design/sources/design-read-AuthSheet.txt:150-150`; observed: `<Alert color="red">` |
| C10 | FACT | Before this task (line 198), the password reset returns through `/auth/callback`. | source: `docs/sessions/evidence/task927/design/sources/design-read-AuthSheet.txt:237-237`; observed: `/auth/callback?next=/${locale}/auth/reset-password` |
| C11 | FACT | The callback route creates the profile after a code exchange. | source: `src/app/auth/callback/route.ts:27-27`; observed: `await ensureUserProfile()` |
| C12 | FACT | On the development database a trigger runs after every insert into `auth.users`. | source: `docs/sessions/evidence/task923/db-catalog/fingerprint.json:19-19`; observed: `CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user()` |
| C13 | FACT | That trigger function inserts the `public.users` row. | source: `docs/sessions/evidence/task923/db-catalog/catalog.json:2157-2157`; observed: `INSERT INTO public.users (id, name, phone, avatar_url, role, user_type, is_verified, created_at)` |
| C14 | FACT | The trigger leaves an existing profile row alone. | source: `docs/sessions/evidence/task923/db-catalog/catalog.json:2157-2157`; observed: `ON CONFLICT (id) DO NOTHING` |
| C15 | FACT | The integration fixtures already rely on that trigger. | source: `src/tests/integration/fixtures.ts:61-61`; observed: `the sign-up trigger creates the profile row` |
| C16 | FACT | The auth controller signs the browser out when the server reports no user. | source: `src/lib/auth/controller.ts:175-175`; observed: `if (!user) coreSignOut('local')` |
| C17 | FACT | `/api/auth/me` answers a non-viewer with `user: null`. | source: `src/app/api/auth/me/route.ts:19-19`; observed: `if (!viewer.ok) return NextResponse.json({ user: null })` |
| C18 | FACT | `requireViewer` refuses a profile whose status gives no access. | source: `src/lib/auth/requireViewer.ts:47-47`; observed: `if (!accountHasAccess(data.status, data.suspended_until)) return { ok: false, reason: 'unauthenticated' }` |
| C19 | FACT | `requireViewer` answers a failed profile read as `lookup_failed`. | source: `src/lib/auth/requireViewer.ts:45-45`; observed: `if (error) return { ok: false, reason: 'lookup_failed' }` |
| C20 | FACT | The CSP sets no script, frame or connect source. | source: `src/lib/security/headers.ts:13-13`; observed: `export const CSP_BASELINE = ["frame-ancestors 'none'", "base-uri 'self'", "form-action 'self'", "object-src 'none'"]` |
| C21 | FACT | The site sends `strict-origin-when-cross-origin`. | source: `src/lib/security/headers.ts:18-18`; observed: `{ key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }` |
| C22 | FACT | Google recommends that referrer policy for loading `gsi/client`. | source: `docs/sessions/evidence/task927/design/sources/gis-get-client-id.txt:136-137`; observed: `strict-origin-when-cross-origin is recommended.` |
| C23 | FACT | Supabase expects the hashed nonce at Google and the raw one at `signInWithIdToken`. | source: `docs/sessions/evidence/task927/design/sources/supabase-google.txt:424-424`; observed: `you need to provide a hashed version to Google and a non-hashed version to signInWithIdToken` |
| C24 | FACT | Supabase's example nonce is 32 random bytes. | source: `docs/sessions/evidence/task927/design/sources/supabase-google.txt:430-430`; observed: `crypto.getRandomValues(new Uint8Array(32))` |
| C25 | FACT | Supabase's Google provider has a nonce check that can be skipped. | source: `docs/sessions/evidence/task927/design/sources/supabase-google.txt:207-207`; observed: `skip_nonce_check = false` |
| C26 | FACT | Supabase's Google provider takes a list of client IDs. | source: `docs/sessions/evidence/task927/design/sources/supabase-google.txt:208-208`; observed: `make sure the web's client ID is first in the list` |
| C27 | FACT | Google requires the site's origin in the OAuth client. | source: `docs/sessions/evidence/task927/design/sources/supabase-google.txt:184-184`; observed: `Under Authorized JavaScript origins add your application's URL` |
| C28 | FACT | Supabase's redirect flow shows the Supabase project domain. | source: `docs/sessions/evidence/task927/design/sources/supabase-google.txt:176-176`; observed: `users will see <project-id>.supabase.co` |
| C29 | FACT | GIS hands the ID token to the callback in `credential`. | source: `docs/sessions/evidence/task927/design/sources/gis-js-reference.txt:64-64`; observed: `it includes a base64-encoded JWT ID token in the credential field` |
| C30 | FACT | The GIS button is at most 400 px wide. | source: `docs/sessions/evidence/task927/design/sources/gis-js-reference.txt:883-883`; observed: `The maximum width is 400 pixels.` |
| C31 | FACT | The GIS button takes a display locale. | source: `docs/sessions/evidence/task927/design/sources/gis-js-reference.txt:892-892`; observed: `Display button text using the specified locale` |
| C32 | FACT | Local development needs localhost origins in the Google client. | source: `docs/sessions/evidence/task927/design/sources/gis-get-client-id.txt:123-123`; observed: `For local tests or development add both http://localhost and` |
| C33 | FACT | Supabase Auth skips the CAPTCHA check on the `id_token` grant. | source: `docs/sessions/evidence/task927/design/sources/supabase-auth-middleware.go:295-296`; observed: `case "id_token": return true` |
| C34 | FACT | The sheet's drawer is the canonical `MantineDrawer`, `md` wide on desktop. | source: `src/design-system/mantine/patterns/MantineDrawer.tsx:33-33`; observed: `Desktop drawer width (Mantine size token); default 'md'. Ignored <640.` |
| C35 | FACT | `MantineDrawer` belongs to the overlay family of the mobile registry. | source: `scripts/mobile-adaptation-patterns.json:139-139`; observed: `"src/design-system/mantine/patterns/MantineDrawer.tsx",` |
| C36 | FACT | On the built Storybook the login form's blocks are 16 px apart at 1440 and 390. | source: `docs/sessions/evidence/task927/design/gr12-auth-slot-summary.txt:3-6`; observed: `gaps between form blocks [16,16,16,16,16]` |
| C37 | FACT | Today's Google control is 348 by 44 px at 1440. | source: `docs/sessions/evidence/task927/design/gr12-auth-slot-summary.txt:5-5`; observed: `button Google; 348x44` |
| C38 | FACT | The sheet's red error alert has one look. | source: `docs/sessions/evidence/task927/design/gr12-auth-slot-summary.txt:12-12`; observed: `bg rgb(254, 243, 242); bd 1px rgb(240, 68, 56); r 12px` |
| C39 | FACT | The register view has a 28 px gap around the captcha (pre-existing, outside this task). | source: `docs/sessions/evidence/task927/design/gr12-auth-slot-summary.txt:17-17`; observed: `gaps between form blocks [16,16,16,16,28,28,16,16]` |
| C40 | FACT | The sheet's canonical Story is `Patterns/Mantine/AuthSheet`. | source: `src/stories/patterns/mantine/AuthSheet.stories.tsx:39-39`; observed: `title: 'Patterns/Mantine/AuthSheet',` |
| C41 | FACT | It has a `Login` export. | source: `src/stories/patterns/mantine/AuthSheet.stories.tsx:55-55`; observed: `export const Login: Story = {` |
| C42 | FACT | The `Login` Story has a rendered-state registry row. | source: `docs/sessions/evidence/task927/readiness-a3/ra3-02-lines.txt:3-3`; observed: `"id": "patterns-mantine-authsheet--login",` |
| C43 | FACT | An overlay task cannot be approved before Task 923. | source: `docs/sessions/evidence/task927/readiness-a3/ra3-02-lines.txt:5-5`; observed: `Until 923 is approved, a consuming visible task whose surface opens an overlay` |
| C44 | FACT | `AuthSheet.tsx` carries uncommitted changes. | source: `docs/sessions/evidence/task927/design/git-status-auth-2026-10-20.txt:12-12`; observed: `M src/modules/auth/components/AuthSheet.tsx` |
| C45 | FACT | `browser.ts` carries uncommitted changes. | source: `docs/sessions/evidence/task927/design/git-status-auth-2026-10-20.txt:5-5`; observed: `M src/lib/auth/browser.ts` |
| C46 | FACT | Task 926 also lists `AuthSheet.tsx` in its scope. | source: `docs/sessions/evidence/task923/final-review/fr-17-926-overlap.txt:7-7`; observed: `AuthSheet.tsx <- also in: 927, D8_D9` |
| C47 | FACT | `AuthSheet.test.tsx` mocks the browser wrapper module with a hoisted object; its Google member and Google tests are what R10 changes. | source: `src/modules/auth/components/__tests__/AuthSheet.test.tsx:21-21`; observed: `const browser = vi.hoisted(() => ({ signIn: vi.fn()` |
| C48 | FACT | `browserAuth.security.test.ts` (Task 923, untracked) stubs the Supabase client's `signInWithOAuth` and tests the real wrapper module. | source: `src/lib/auth/__tests__/browserAuth.security.test.ts:15-15`; observed: `for (const m of ['signInWithPassword', 'signInWithOAuth'` |
| C49 | FACT | `browser.smoke.test.ts` mocks the Supabase client's auth methods. | source: `src/lib/auth/__tests__/browser.smoke.test.ts:32-32`; observed: `signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),` |
| C50 | FACT | The banned-account test (Task 923, untracked) mocks the browser wrapper module with a hoisted object; its Google member is what R10 changes. | source: `src/modules/auth/components/AuthSheet.banned.security.test.tsx:17-17`; observed: `const browser = vi.hoisted(() => ({ signIn: vi.fn()` |
| C51 | FACT | Lahomes places Google sign-in under the primary button after a divider; Omah and Kamr have none. | source: `docs/sessions/evidence/task927/design/gr7/gr7-notes.md:10-10`; observed: `Google icon button below the Sign In button after an OR sign with divider` |
| C52 | FACT | The wrong-credentials text (en). | source: `docs/sessions/evidence/task927/readiness-a3/ra3-02-lines.txt:7-7`; observed: `"error_invalid_credentials": "Incorrect email or password.",` |
| C53 | FACT | The integration Vitest configuration is untracked. | source: `docs/sessions/evidence/task927/design/git-status-auth-2026-10-20.txt:50-50`; observed: `?? vitest.integration.config.ts` |
| C54 | FACT | The integration fixtures are untracked. | source: `docs/sessions/evidence/task927/design/git-status-auth-2026-10-20.txt:54-54`; observed: `?? src/tests/integration/` |
| C55 | FACT | Before this task (`ProfileTab.tsx` line 229), the cabinet's profile tab also calls `signInWithOAuth`, to re-confirm the person (Task 923 R80, uncommitted). | source: `docs/sessions/evidence/task927/design/sources/design-read-ProfileTab.txt:26-26`; observed: `return signInWithOAuth('google',` |
| C56 | FACT | Before this task (test line 155), a security test of the profile tab asserts that call. | source: `docs/sessions/evidence/task927/design/sources/design-read-ProfileTab-deletePassword-test.txt:156-156`; observed: `expect(mocks.signInWithOAuth).toHaveBeenCalledWith('google',` |
| C57 | FACT | Before this task (line 227), that re-confirmation relies on a server rule of a recent sign-in. | source: `docs/sessions/evidence/task927/design/sources/design-read-ProfileTab.txt:24-24`; observed: `which the server then lets through for 10 minutes` |
| C58 | FACT | The server's recent-sign-in rule accepts a session whose token lists the method `oauth` within the window; it does not look at how the Google token arrived. | source: `src/modules/cabinet/actions/index.ts:76-77`; observed: `entry?.method === 'oauth'` |
| C59 | FACT | Supabase Auth issues the session of an `id_token` sign-in with the method `models.OAuth`. | source: `docs/sessions/evidence/task927/design/sources/supabase-auth-token_oidc.go:346-346`; observed: `a.issueRefreshToken(r, w.Header(), tx, user, models.OAuth, grantParams)` |
| C60 | FACT | `models.OAuth` is written into the token as `oauth`. | source: `docs/sessions/evidence/task927/design/sources/supabase-auth-models-factor.go:77-78`; observed: `return "oauth"` |
| C61 | FACT | Before this task (line 472), the e-mail section shows a Mantine button that starts the redirect re-confirmation. | source: `docs/sessions/evidence/task927/design/sources/design-read-ProfileTab.txt:150-150`; observed: `onClick={confirmWithGoogle}` |
| C62 | FACT | Before this task (line 546), the deletion dialog gets the same redirect through `googleConfirm`. | source: `docs/sessions/evidence/task927/design/sources/design-read-ProfileTab.txt:224-224`; observed: `onConfirm: confirmWithGoogle` |
| C63 | FACT | The profile tab receives the account's e-mail and profile. | source: `docs/sessions/evidence/task927/design/sources/design-read-ProfileTab.txt:46-46`; observed: `export function ProfileTab({ profile, locale, cities, regions, email` |
| C64 | FACT | A Google-only account's deletion sends no password and the server asks for the Google confirmation. | source: `docs/sessions/evidence/task927/design/sources/design-read-ProfileTab.txt:117-123`; observed: `if (result.error === 'reauth_required') { setDeleteNeedsGoogle(true); return }` |
| C65 | FACT | Before this task, the canonical deletion dialog takes the Google confirmation as a label and a click handler. | source: `docs/sessions/evidence/task927/design/sources/design-read-MantineDeleteConfirmModal.txt:46-46`; observed: `googleConfirm?: { message: ReactNode; label: string; onConfirm: () => void }` |
| C66 | FACT | Before this task, it renders that as its own Mantine button, disabled while the action runs. | source: `docs/sessions/evidence/task927/design/sources/design-read-MantineDeleteConfirmModal.txt:114-114`; observed: `fullWidth disabled={loading} onClick={googleConfirm.onConfirm}` |
| C67 | FACT | Before this task, the Modal Story `DeleteConfirmPassword` passes `googleConfirm`. | source: `docs/sessions/evidence/task927/design/sources/design-read-Modal-stories.txt:66-66`; observed: `googleConfirm={{ message: storyT(locale, 'cabinet.delete_account_google_required')` |
| C68 | FACT | The deletion text no longer promises a return to the page (it did at design time; R8's rewrite is in place, re-anchored by review 1). | source: `docs/sessions/evidence/task927/readiness-a3/ra3-02-lines.txt:9-9`; observed: `Confirm with Google that it is you; the deletion then continues.` |
| C69 | FACT | Task 923's server tests already pin the 10-minute `oauth` window. | source: `src/modules/cabinet/actions/__tests__/reauth.security.test.ts:153-153`; observed: `state.amr = [{ method: 'oauth', timestamp: minutesAgo(9) }]` |
| C70 | FACT | Before this task (test line 191), the e-mail test asserts the redirect too. | source: `docs/sessions/evidence/task927/design/sources/design-read-ProfileTab-deletePassword-test.txt:192-192`; observed: `expect(mocks.signInWithOAuth).toHaveBeenCalledTimes(1)` |
| C71 | FACT | The slot's unavailable text sends the person to the password, which a Google-only account does not have. | source: `docs/sessions/evidence/task927/readiness-a3/ra3-02-lines.txt:11-11`; observed: `Sign in with your email and password or try again later.` |
| C72 | FACT | GIS `initialize` takes `login_hint` to preselect the account. | source: `docs/sessions/evidence/task927/design/sources/gis-js-reference.html:2177-2177`; observed: `login_hint: 'elisa.beckett@gmail.com'` |
| C73 | FACT | The ID token's payload carries the account's e-mail. | source: `docs/sessions/evidence/task927/design/sources/gis-js-reference.txt:608-608`; observed: `"email": "elisa.g.beckett@gmail.com", // The user's email address` |
| C74 | FACT | The dialog's Google state has its own rendered-state registry row. | source: `scripts/rendered-interaction-states.json:758-758`; observed: `"id": "mantine-primitives-modal--delete-confirm-password~delete-google",` |
| C75 | FACT | Review 1, built Storybook: in `loading` and `unavailable` the slot is 16 px taller than its alert or loader, because the hidden host still takes the slot's gap. | source: `docs/sessions/evidence/task927/review-1/slot-trailing-gap.txt:1-1`; observed: `"trailingInsideSlot":16,"slotRowGap":"16px"` |
| C76 | FACT | Amendment 3 removed the slot root's gap: the root is now a Box. | source: `docs/sessions/evidence/task927/amendment-4/a4-01-lines.txt:3-3`; observed: `<Box>` |
| C77 | FACT | In the deletion dialog's Google state the alert ends 16 px above the end of its section. | source: `docs/sessions/evidence/task927/review-1/slot-trailing-gap.txt:7-7`; observed: `"parentRowGap":"12px","gapToNextSibling":null,"alertToParentBottom":16` |
| C78 | FACT | The execution probe measured gaps only between children taller than 0, so it could not see that gap. | source: `docs/sessions/evidence/task927/validation/gr3-probe.mjs:57-57`; observed: `const kids = [...form.children].filter((k) => k.getBoundingClientRect().height > 0);` |
| C79 | FACT | GIS keeps only the last `initialize` configuration for the whole page. | source: `docs/sessions/evidence/task927/design/sources/gis-js-reference.txt:89-90`; observed: `only the configurations in the last call is remembered and used.` |
| C80 | FACT | The profile tab renders the e-mail section's Google button whenever the e-mail change needs Google. | source: `docs/sessions/evidence/task927/readiness-a3/ra3-02-lines.txt:13-13`; observed: `{emailNeedsGoogle && (` |
| C81 | FACT | It renders the deletion dialog's Google button whenever the deletion needs Google, independently of the e-mail section. | source: `docs/sessions/evidence/task927/readiness-a3/ra3-02-lines.txt:15-15`; observed: `googleConfirm={deleteNeedsGoogle ? {` |
| C82 | FACT | The migration manifest enrols `GoogleSignInButton.tsx`. | source: `scripts/mantine-migration-scope.json:107-107`; observed: `"src/components/auth/GoogleSignInButton.tsx",` |
| C83 | FACT | The UI-contract gate fails every newly enrolled component that has no registry row. | source: `scripts/check-ui-contract.mjs:274-274`; observed: `newly enrolled component lacks an explicit UI contract` |
| C84 | FACT | The Modal Story imports `GoogleSignInButton`. | source: `src/stories/mantine/primitives/Modal.stories.tsx:17-17`; observed: `import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'` |
| C85 | FACT | The canonical Alert's message styles (theme owner) set size, colour and line height; before Amendment 3 (R15) nothing about wrapping. (Review 9: re-anchored after Amendment 8's two `theme.ts` lines.) | source: `src/design-system/mantine/theme.ts:1776-1776`; observed: `lineHeight: '1.25rem',` |
| C86 | FACT | Review 1: a long address without a hyphen in the dialog's red alert runs past the alert at 320 (message right edge 530 px, alert right edge 304 px). | source: `docs/sessions/evidence/task927/review-1/alert-long-email.txt:11-11`; observed: `"msgRight":530` |
| C87 | FACT | With `overflow-wrap: anywhere` on the message the same text stays inside the alert (287 px). | source: `docs/sessions/evidence/task927/review-1/alert-long-email.txt:15-15`; observed: `"overflowWrap":"anywhere","sw":254,"cw":254,"clipped":false,"msgRight":287` |
| C88 | FACT | The wrong-account text carries the profile's e-mail. | source: `docs/sessions/evidence/task927/readiness-a3/ra3-02-lines.txt:17-17`; observed: `Confirm with the Google account of this profile ({email}).` |
| C89 | FACT | Review 1: every AuthSheet Story fails to render on the built Storybook. | source: `docs/sessions/evidence/task927/review-1/login-render-errors.txt:1-1`; observed: `__dirname is not defined` |
| C90 | FACT | Task 923's recovery action, which AuthSheet imports, imported `next/server` statically (review 1); 923 now loads it lazily when the work is scheduled (re-anchored by the review-1 follow-up). | source: `src/modules/auth/actions/recovery.ts:144-144`; observed: `try { (await import('next/server')).after(send) } catch { await send() }` |
| C91 | FACT | Storybook aliases `next/headers` to a stub. | source: `.storybook/main.ts:40-40`; observed: `'next/headers': path.resolve(__dirname, './stubs/next-headers.ts'),` |
| C92 | FACT | `npm run build` fails on a lint error in `updateListing.ts` (Task 923's uncommitted R67 hunk), outside this task. | source: `docs/sessions/evidence/task927/validation/build.txt:242-242`; observed: `Direct .status comparison outside the semantic domain` |
| C93 | FACT | The security contract reached stage `implemented` at Amendment 3's handoff. | source: `docs/sessions/evidence/task927/amendment-4/a4-01-lines.txt:21-21`; observed: `"stage": "implemented",` |
| C94 | FACT | `cli.mjs verify` refuses a planned contract. | source: `docs/sessions/evidence/task927/review-1/cli-verify.txt:3-3`; observed: `BLOCKED: Product verification requires an implemented or reviewed contract` |
| C95 | FACT | Mantine's Alert message sets an ellipsis with hidden overflow; with normal wrapping it acts only on a token wider than the line. | source: `node_modules/@mantine/core/styles/Alert.css:57-57`; observed: `text-overflow: ellipsis;` |
| C96 | FACT | Google's reference sets the button language with the `hl` parameter on the library URL as well as with `locale`. | source: `docs/sessions/evidence/task927/design/sources/gis-js-reference.txt:893-895`; observed: `gsi/client?hl=<iso-639-code>.` |
| C97 | FACT | The loader's library URL carries no `hl`. | source: `src/lib/auth/googleIdentity.ts:9-9`; observed: `export const GOOGLE_IDENTITY_SCRIPT_URL = 'https://accounts.google.com/gsi/client'` |
| C98 | FACT | Review-1 follow-up, built Storybook: with the toolbar on `en` the button gets `hl=en`, yet GIS's text on the page and its iframe title are Albanian (the same in sq, uk and it). | source: `docs/sessions/evidence/task927/review-1/login-google-shot.txt:2-2`; observed: `{"loc":"en","hl":"&hl=en","iframeTitle":"Butoni \"Identifikohu me Google\""` |
| C99 | FACT | After Task 923's lazy import the AuthSheet `Login` entry renders its form again. | source: `docs/sessions/evidence/task927/review-1/login-render-errors-after-923-fix.txt:1-1`; observed: `"form":true` |
| C100 | FACT | On the full-screen sheet just below 640 px, Google's button stops at 400 px while the sheet's submit button fills the 607 px form. | source: `docs/sessions/evidence/task927/owner-qa/oq-01-google-width-probe.txt:3-3`; observed: `fresh en 639: dialog 639px, host 607px, Google button 400px, submit 607px` |
| C101 | FACT | Where the form is wider than 400 px, Google's button sits at the form's left edge, not in its middle. | source: `docs/sessions/evidence/task927/amendment-4/a4-03-centre-probe-baseline.txt:5-5`; observed: `login en 480: Google 400px in a 448px form, gap left 0px, right 48px, NOT centred` |
| C102 | FACT | 400 px is Google's own limit for its rendered button. | source: `docs/sessions/evidence/task927/amendment-4/a4-01-lines.txt:7-7`; observed: `The maximum width is 400 pixels` |
| C103 | FACT | The container asks Google for the host's width, capped at that limit. | source: `docs/sessions/evidence/task927/amendment-4/a4-01-lines.txt:9-9`; observed: `Math.min(Math.round(widthRef.current), GOOGLE_BUTTON_MAX_WIDTH)` |
| C104 | FACT | The slot's host is a full-width box, so a capped button starts at its left edge. | source: `docs/sessions/evidence/task927/amendment-4/a4-01-lines.txt:5-5`; observed: `<Box ref={hostRef} w="100%" hidden={status !== 'ready'} />` |
| C105 | FACT | The sections of the Story `DeleteConfirmPassword` share one caption, so the Google section cannot be told from the others. | source: `docs/sessions/evidence/task927/amendment-4/a4-01-lines.txt:11-11`; observed: `<MantineStorySection label={t('modal_caption_delete')}>` |
| C106 | FACT | The deletion Story's Google section has no client ID, so it shows only Google's unavailable state, never Google's button. | source: `docs/sessions/evidence/task927/amendment-4/a4-01-lines.txt:17-17`; observed: `clientId={undefined} purpose="reauth"` |
| C107 | FACT | The census registry has one row per section of that Story, each opened by its section's position. | source: `docs/sessions/evidence/task927/amendment-4/a4-01-lines.txt:19-19`; observed: `"id": "mantine-primitives-modal--delete-confirm-password~delete-google",` |
| C108 | FACT | The owner sees Google's personalized "Continue as Andrii" button in the open sign-in sheet and says nobody uses that kind of sign-in. | source: `docs/sessions/evidence/task927/amendment-5/a5-00-owner.txt:5-5`; observed: `I see the button "Continue as Andrii". Nobody uses that kind of sign-in.` |
| C109 | FACT | The pushed sign-in sheet still calls `signInWithOAuth`; Google's rendered button exists only in the uncommitted working tree, so the owner saw it on the local app. | source: `docs/sessions/evidence/task927/amendment-5/a5-03-lines.txt:79-79`; observed: `signInWithOAuth('google',` |
| C110 | FACT | The sheet's Google button asks Google for its large size. | source: `docs/sessions/evidence/task927/amendment-5/a5-03-lines.txt:3-3`; observed: `size: 'large',` |
| C111 | FACT | The sheet's Google button asks for the text "Continue with Google". | source: `docs/sessions/evidence/task927/amendment-5/a5-03-lines.txt:5-5`; observed: `text: 'continue_with',` |
| C112 | FACT | Google shows no personalized button when the button's size is medium or small. | source: `docs/sessions/evidence/task927/amendment-5/gis/personalized-button.txt:125-125`; observed: `The data-size attribute is set to medium or small.` |
| C113 | FACT | Google's `signin_with` text is "Sign in with Google". | source: `docs/sessions/evidence/task927/amendment-5/gis/reference-js.txt:837-837`; observed: `The button text is "Sign in with Google".` |
| C114 | FACT | The container never calls `prompt()`, by design: no One Tap. | source: `docs/sessions/evidence/task927/amendment-5/a5-03-lines.txt:7-7`; observed: `is never called: no One Tap and no automatic sign-in.` |
| C115 | FACT | The GIS type of the app deliberately omits `prompt`. | source: `docs/sessions/evidence/task927/amendment-5/a5-03-lines.txt:11-11`; observed: `is deliberately absent (no One Tap, no automatic sign-in)` |
| C116 | FACT | The existing SEC-927-FE-DENY-NOAUTO asserts that `prompt` is never called. | source: `docs/sessions/evidence/task927/amendment-5/a5-03-lines.txt:51-51`; observed: `expect(api.prompt).not.toHaveBeenCalled()` |
| C117 | FACT | The existing button-options test expects the large size and the continue text. | source: `docs/sessions/evidence/task927/amendment-5/a5-03-lines.txt:53-53`; observed: `type: 'standard', theme: 'outline', size: 'large', text: 'continue_with'` |
| C118 | FACT | `google.accounts.id.prompt` shows the One Tap prompt after `initialize`. | source: `docs/sessions/evidence/task927/amendment-5/gis/reference-js.txt:64-64`; observed: `The google.accounts.id.prompt method displays the One Tap prompt or browser built-in credential manager after initialization` |
| C119 | FACT | `prompt()` is normally called on page load. | source: `docs/sessions/evidence/task927/amendment-5/gis/reference-js.txt:457-457`; observed: `Normally, the prompt() method is called on page load.` |
| C120 | FACT | `initialize` configures one GIS client and should generally be called only once. | source: `docs/sessions/evidence/task927/amendment-5/gis/reference-js.txt:63-63`; observed: `should generally be called only once` |
| C121 | FACT | `login_hint` accepts an e-mail or the ID token's `sub`. | source: `docs/sessions/evidence/task927/amendment-5/gis/reference-js.txt:394-394`; observed: `Accepted values are: an email address or an ID token sub field value.` |
| C122 | FACT | `itp_support` enables the upgraded One Tap on ITP browsers. | source: `docs/sessions/evidence/task927/amendment-5/gis/reference-js.txt:139-139`; observed: `Enables upgraded One Tap UX on ITP browsers.` |
| C123 | FACT | `use_fedcm_for_prompt` is deprecated and ignored. | source: `docs/sessions/evidence/task927/amendment-5/gis/reference-js.txt:418-418`; observed: `Deprecated: This attribute is deprecated and will be ignored` |
| C124 | FACT | A person who closes One Tap is not prompted again for increasingly longer periods. | source: `docs/sessions/evidence/task927/amendment-5/gis/onetap-ux.txt:92-92`; observed: `If a user manually closes the One Tap prompt, it will be suppressed for increasingly longer periods of time` |
| C125 | FACT | Under FedCM the display-moment methods of the prompt listener are removed. | source: `docs/sessions/evidence/task927/amendment-5/gis/fedcm-migration.txt:182-182`; observed: `Remove use of isDisplayMoment(), isDisplayed(), isNotDisplayed(), and getNotDisplayedReason() methods for One Tap in your code.` |
| C126 | FACT | The FedCM iframe permission is needed only when One Tap runs in a cross-origin iframe. | source: `docs/sessions/evidence/task927/amendment-5/gis/fedcm-migration.txt:95-95`; observed: `When using One Tap or Button in cross-origin iframes with FedCM` |
| C127 | FACT | The site may not be framed at all, so One Tap runs only at the top level. | source: `docs/sessions/evidence/task927/amendment-5/a5-03-lines.txt:73-73`; observed: `export const CSP_BASELINE = ["frame-ancestors 'none'"` |
| C128 | FACT | The ID token payload carries `sub`, the Google account's unique ID. | source: `docs/sessions/evidence/task927/amendment-5/gis/reference-js.txt:605-605`; observed: `"sub": "3141592653589793238", // The unique ID of the user's Google Account` |
| C129 | FACT | The payload carries the e-mail. | source: `docs/sessions/evidence/task927/amendment-5/gis/reference-js.txt:609-609`; observed: `"email": "elisa.g.beckett@gmail.com", // The user's email address` |
| C130 | FACT | The payload carries the name. | source: `docs/sessions/evidence/task927/amendment-5/gis/reference-js.txt:612-612`; observed: `"name": "Elisa Beckett",` |
| C131 | FACT | The payload's picture is a URL on `lh3.googleusercontent.com`. | source: `docs/sessions/evidence/task927/amendment-5/gis/reference-js.txt:614-614`; observed: `"picture": "https://lh3.googleusercontent.com/a-/e2718281828459045235360uler",` |
| C132 | FACT | `sub` identifies the account and is never reused. | source: `docs/sessions/evidence/task927/amendment-5/gis/reference-js.txt:622-622`; observed: `use sub field as identifier for the user as it is unique among all Google` |
| C133 | FACT | The header holds the sign-in sheet's open state. | source: `docs/sessions/evidence/task927/amendment-5/a5-03-lines.txt:35-35`; observed: `const [authOpen, setAuthOpen] = useState(false)` |
| C134 | FACT | The header reads the user from `useUser`. | source: `docs/sessions/evidence/task927/amendment-5/a5-03-lines.txt:33-33`; observed: `const { user, signOut, isSigningOut } = useUser()` |
| C135 | FACT | Every opening of the sheet goes through the header's `openAuthSheet`. | source: `docs/sessions/evidence/task927/amendment-5/a5-03-lines.txt:37-37`; observed: `function openAuthSheet(view: AuthView) {` |
| C136 | FACT | The header passes the sheet to its view as `authSheetSlot`. | source: `docs/sessions/evidence/task927/amendment-5/a5-03-lines.txt:39-39`; observed: `authSheetSlot={` |
| C137 | FACT | The locale layout renders the header on every public page. | source: `docs/sessions/evidence/task927/amendment-5/a5-03-lines.txt:41-41`; observed: `<Header />` |
| C138 | FACT | The auth controller has an `unauthenticated` status: a guest. | source: `docs/sessions/evidence/task927/amendment-5/a5-03-lines.txt:43-43`; observed: `'unauthenticated'` |
| C139 | FACT | The auth context exposes that status. | source: `docs/sessions/evidence/task927/amendment-5/a5-03-lines.txt:45-45`; observed: `status: authState.status,` |
| C140 | FACT | The sheet has four views today. | source: `docs/sessions/evidence/task927/amendment-5/a5-03-lines.txt:15-15`; observed: `export type AuthView = 'login'` |
| C141 | FACT | The error mapping is a private function of `AuthSheet.tsx`. | source: `docs/sessions/evidence/task927/amendment-5/a5-03-lines.txt:17-17`; observed: `function mapAuthError(message: string): string {` |
| C142 | FACT | The login view reads, and removes, the session-lost flag. | source: `docs/sessions/evidence/task927/amendment-5/a5-03-lines.txt:19-19`; observed: `if (sessionStorage.getItem(AUTH_SESSION_LOST_KEY) === 'true') {` |
| C143 | FACT | The login view has its own Google handler. | source: `docs/sessions/evidence/task927/amendment-5/a5-03-lines.txt:21-21`; observed: `async function handleGoogle({ credential, nonce }: { credential: string; nonce: string }) {` |
| C144 | FACT | The sheet's forms keep a 16 px rhythm with `gap="md"`. | source: `docs/sessions/evidence/task927/amendment-5/a5-03-lines.txt:23-23`; observed: `<Stack component="form" onSubmit={handleSubmit} gap="md" pb="xl">` |
| C145 | FACT | The login view renders the Google button with that handler. | source: `docs/sessions/evidence/task927/amendment-5/a5-03-lines.txt:27-27`; observed: `<GoogleSignInButton clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID} onCredential={handleGoogle} />` |
| C146 | FACT | The sheet's title comes from a map keyed by the view. | source: `docs/sessions/evidence/task927/amendment-5/a5-03-lines.txt:29-29`; observed: `login: t('login'),` |
| C147 | FACT | Each opening resets the sheet to the view it was opened with. | source: `docs/sessions/evidence/task927/amendment-5/a5-03-lines.txt:31-31`; observed: `setView(initialView)` |
| C148 | FACT | A successful self-deletion raises its toast before the sign-out. | source: `docs/sessions/evidence/task927/amendment-5/a5-03-lines.txt:47-47`; observed: `toast.success(t('delete_account_success'))` |
| C149 | FACT | The cabinet's e-mail section also renders the Google button. | source: `docs/sessions/evidence/task927/amendment-5/a5-03-lines.txt:48-49`; observed: `CabinetEmailChangeSection.tsx line(s) 93, working tree` |
| C150 | FACT | A header test mocks `next-intl` with `useLocale` only. | source: `docs/sessions/evidence/task927/amendment-5/a5-03-lines.txt:55-55`; observed: `vi.mock('next-intl', () => ({ useLocale: () => 'en' }))` |
| C151 | FACT | That test replaces the header view by a recorder that renders nothing. | source: `docs/sessions/evidence/task927/amendment-5/a5-03-lines.txt:57-57`; observed: `vi.mock('@/components/layout/HeaderView', () => ({ HeaderView: (p: ViewProps) => { view = p; return null } }))` |
| C152 | FACT | The sheet's Story file has a `Login` export. | source: `docs/sessions/evidence/task927/amendment-5/a5-03-lines.txt:59-59`; observed: `export const Login: Story = {` |
| C153 | FACT | Three census rows excuse Google's button, citing D84 and a 40 px height. | source: `docs/sessions/evidence/task927/amendment-5/a5-03-lines.txt:61-63`; observed: `Google's own sign-in button (Task 927 D2) is 40px high, Google's largest size` |
| C154 | FACT | The theme's largest icon size is 64 px. | source: `docs/sessions/evidence/task927/amendment-5/a5-03-lines.txt:65-65`; observed: `'colossal',    // 64px` |
| C155 | FACT | The theme makes every Mantine `Text` wrap a long word. | source: `docs/sessions/evidence/task927/amendment-5/a5-03-lines.txt:67-67`; observed: `styles: { root: { overflowWrap: 'break-word' } },` |
| C156 | FACT | A user's avatar is a Mantine `Avatar` in the brand colour with the name as its fallback. | source: `docs/sessions/evidence/task927/amendment-5/a5-03-lines.txt:69-69`; observed: `<Avatar src={user.avatar_url ?? undefined} name={user.name ?? undefined} color="brand"` |
| C157 | FACT | The canonical toast has an error variant. | source: `docs/sessions/evidence/task927/amendment-5/a5-03-lines.txt:71-71`; observed: `error: (message: string) => show('error', message),` |
| C158 | FACT | The security contract is at stage `implemented` (Amendment 4's handoff). | source: `docs/sessions/evidence/task927/amendment-5/a5-03-lines.txt:75-75`; observed: `"stage": "implemented",` |
| C159 | FACT | The container cancels GIS when it unmounts. | source: `docs/sessions/evidence/task927/amendment-5/a5-03-lines.txt:9-9`; observed: `apiRef.current?.cancel()` |
| C160 | FACT | A helper already decodes the ID token's payload for its e-mail. | source: `docs/sessions/evidence/task927/amendment-5/a5-03-lines.txt:13-13`; observed: `export function emailFromCredential(credential: string): string` |
| C161 | FACT | Lahomes' lock screen greets the person by name and offers "Not you?" with a way back to the full sign-in. | source: `docs/sessions/evidence/task927/amendment-5/gr7/a5-01-gr7-live.txt:2-2`; observed: `HI ! GASTON Enter your password to access the admin. Password Sign In Not you? return Sign In` |
| C162 | FACT | TailAdmin's sign-in labels its Google button "Sign in with Google". | source: `docs/sessions/evidence/task927/amendment-5/gr7/a5-01-gr7-live.txt:10-10`; observed: `Sign in with Google Sign in with X Or` |
| C163 | FACT | Omah's lock screen shows no identity of the person. | source: `docs/sessions/evidence/task927/amendment-5/gr7/a5-01-gr7-live.txt:6-6`; observed: `Account Locked Password Unlock` |
| C164 | FACT | Kamr's sign-in has no returning-person screen. | source: `docs/sessions/evidence/task927/amendment-5/gr7/a5-01-gr7-live.txt:12-12`; observed: `Sign in your account Email * Password * Remember my preference Sign Me In` |
| C165 | FACT | medium.com refuses the automated check (403), so its live page is UNVERIFIED and not relied on; the owner's screenshot is. | source: `docs/sessions/evidence/task927/amendment-5/gr7/a5-01-gr7-live.txt:15-15`; observed: `medium-signin 1440 status=403` |
| C166 | FACT | Today the Google, header and session tests pass: 8 files, 119 tests. | source: `docs/sessions/evidence/task927/amendment-5/a5-04-baseline.txt:8-8`; observed: `119 passed (119)` |
| C167 | FACT | The `uk` masked demo e-mail is written in Cyrillic, unlike the other three locales and R27. | source: `docs/sessions/evidence/task927/review-5/rv5-01-lines.txt:8-11`; observed: `messages/uk.json:2872: "google_welcome_demo_email": "ар•••••@example.com"` |
| C168 | FACT | R27 gives `ar•••••@example.com` in all four locales. | source: `docs/sessions/evidence/task927/review-5/rv5-01-lines.txt:15-15`; observed: `R27 [D13]` |
| C169 | FACT | Review 4 added an exception for a masked e-mail address to the Story gate. | source: `docs/sessions/evidence/task927/review-5/rv5-01-lines.txt:12-12`; observed: `A masked e-mail address as the app shows it` |
| C170 | FACT | With it, a masked address passes the `uk` Latin rule, and masked non-addresses still fail it. | source: `docs/sessions/evidence/task927/review-5/rv5-01-lines.txt:16-20`; observed: `"arta•••••@" uk-latin-only violations: 1` |
| C171 | FACT | The gate's test file has a block for that rule, with a passing Cyrillic case. | source: `docs/sessions/evidence/task927/review-5/rv5-01-lines.txt:13-14`; observed: `it('GOOD — Cyrillic uk storybook value passes'` |
| C172 | FACT | `uk.json` is in the contract's scope; the gate's test file is not; neither is a policy path. | source: `docs/sessions/evidence/task927/review-5/rv5-01-lines.txt:23-24`; observed: `scripts/__tests__/check-stories.test.ts: scope NO; policy no; exists yes` |
| C173 | FACT | The profile's deletion sends no password for an account with no password. | source: `docs/sessions/evidence/task927/review-7/rv7-04-lines.txt:3-3`; observed: `deleteOwnAccount(reauthMethod === 'google' ? {} : { password: deletePassword })` |
| C174 | FACT | The deletion dialog has a password field only for an account that has a password. | source: `docs/sessions/evidence/task927/review-7/rv7-04-lines.txt:6-6`; observed: `passwordConfirm={reauthMethod === 'google' ? undefined : {` |
| C175 | FACT | The Google section is turned on only when the server answers `reauth_required`. | source: `docs/sessions/evidence/task927/review-7/rv7-04-lines.txt:4-4`; observed: `if (result.error === 'reauth_required') { setDeleteNeedsGoogle(true); return }` |
| C176 | FACT | The dialog's Google section follows that state. | source: `docs/sessions/evidence/task927/review-7/rv7-04-lines.txt:7-7`; observed: `googleConfirm={deleteNeedsGoogle ? {` |
| C177 | FACT | The canonical dialog's typed confirmation is a labelled field that keeps the red primary disabled until the word is typed. | source: `docs/sessions/evidence/task927/review-7/rv7-04-lines.txt:9-10`; observed: `The red primary stays disabled` |
| C178 | FACT | The typed text is compared trimmed and in upper case. | source: `docs/sessions/evidence/task927/review-7/rv7-04-lines.txt:11-11`; observed: `typed.trim().toUpperCase() === typedConfirm.word.toUpperCase()` |
| C179 | FACT | The primary's disabled state includes the typed check. | source: `docs/sessions/evidence/task927/review-7/rv7-04-lines.txt:12-12`; observed: `!typedOk` |
| C180 | FACT | The typed section is drawn after the Google section. | source: `docs/sessions/evidence/task927/review-7/rv7-04-lines.txt:13-14`; observed: `{typedConfirm && (` |
| C181 | FACT | The dialog module exports the canonical word. | source: `docs/sessions/evidence/task927/review-7/rv7-04-lines.txt:8-8`; observed: `export const DELETE_CONFIRM_WORD = 'DELETE'` |
| C182 | FACT | The admin deletion dialog consumes `typedConfirm` with that word. | source: `docs/sessions/evidence/task927/review-7/rv7-04-lines.txt:20-20`; observed: `typedConfirm={{ word: DELETE_CONFIRM_WORD, label: t('dialogs.delete_type_confirm') }}` |
| C183 | FACT | All four locales have the cabinet's typed-confirmation label. | source: `docs/sessions/evidence/task927/review-7/rv7-04-lines.txt:16-19`; observed: `"delete_account_type_confirm": "Введіть DELETE для підтвердження"` |
| C184 | FACT | Today's test asserts that the primary of an account with no password is enabled before anything is typed. | source: `docs/sessions/evidence/task927/review-7/rv7-04-lines.txt:21-22`; observed: `expect(confirmButton().disabled).toBe(false)` |
| C185 | FACT | The Google re-confirmation test presses the primary directly, in its deletion helper and in ONE-CONFIG. | source: `docs/sessions/evidence/task927/review-7/rv7-04-lines.txt:24-26`; observed: `fireEvent.click(within(dialog).getByRole('button', { name: t.delete_account_confirm }))` |
| C186 | FACT | The Modal Story's Google sections show the dialog of an account with no password with its primary not tied to a field. | source: `docs/sessions/evidence/task927/review-7/rv7-04-lines.txt:29-29`; observed: `the primary is not tied to a field` |
| C187 | FACT | The Modal Story file imports the word and already passes `typedConfirm` in `DeleteConfirmTyped`. | source: `docs/sessions/evidence/task927/review-7/rv7-04-lines.txt:27-28`; observed: `typedConfirm={{ word: DELETE_CONFIRM_WORD, label: storyT(locale, 'cabinet.delete_account_type_confirm') }}` |
| C188 | FACT | Both Google sections of `DeleteConfirmPassword` have a rendered-state census row. | source: `docs/sessions/evidence/task927/review-7/rv7-04-lines.txt:36-37`; observed: `census row: mantine-primitives-modal--delete-confirm-password~delete-google-ready` |
| C189 | FACT | The dialog's vertical rhythm between sections is `py="lg"` in `MantineDialogSections`. | source: `docs/sessions/evidence/task927/review-7/rv7-04-lines.txt:34-34`; observed: `<Box py="lg">{section}</Box>` |
| C190 | FACT | Task 923's D54 replaced the typed word with the password in the profile deletion. | source: `docs/sessions/evidence/task927/review-7/rv7-04-lines.txt:35-35`; observed: `asks for the password instead of the word DELETE` |
| C191 | FACT | The four write paths are in the contract's scope and none is a policy path. | source: `docs/sessions/evidence/task927/review-7/rv7-04-lines.txt:38-41`; observed: `src/stories/mantine/primitives/Modal.stories.tsx: scope YES; policy no` |
| C192 | FACT | Before the change, the two ProfileTab deletion test files and the dialog's smoke test pass. | source: `docs/sessions/evidence/task927/review-7/rv7-05-baseline-tests.txt:37-38`; observed: `Tests  26 passed (26)` |
| C193 | FACT | Before the change, the server's re-confirmation cases pass. | source: `docs/sessions/evidence/task927/review-7/rv7-05b-baseline-server.txt:13-14`; observed: `Tests  2 passed (2)` |
| C194 | FACT | The Google button is drawn in Google's outline theme at its medium size. | source: `docs/sessions/evidence/task927/review-8/rv8-02-lines.txt:3-4`; observed: `size: 'medium',` |
| C195 | FACT | Its text, shape and logo alignment are `signin_with`, `rectangular` and `center`. | source: `docs/sessions/evidence/task927/review-8/rv8-02-lines.txt:5-7`; observed: `logo_alignment: 'center',` |
| C196 | FACT | The button's config type pins the theme and the size to those literals. | source: `docs/sessions/evidence/task927/review-8/rv8-02-lines.txt:11-12`; observed: `size: 'medium'` |
| C197 | FACT | The config type's comment says the medium size is chosen because it is never personalized (D14). | source: `docs/sessions/evidence/task927/review-8/rv8-02-lines.txt:10-10`; observed: `Google's medium size is never personalized` |
| C198 | FACT | Google's branding guidelines show the standard button 40 px high. | source: `docs/sessions/evidence/task927/review-8/g-branding-guidelines.html:3146-3146`; observed: `style="height: 40px; width: auto; vertical-align: middle;"` |
| C199 | FACT | The guidelines call that standard button the large one. | source: `docs/sessions/evidence/task927/review-8/g-branding-guidelines.html:3150-3150`; observed: `Standard large light themed rectangular Sign in with Google button` |
| C200 | FACT | Drawn by Google on `127.0.0.1`, the button's host is 32 px at `medium` and 40 px at `large`. | source: `docs/sessions/evidence/task927/review-8/rv8-01-gis-size-probe.txt:12-17`; observed: `"host": 40,` |
| C201 | FACT | The host has that height right after `renderButton` returns. | source: `docs/sessions/evidence/task927/review-8/rv8-01-gis-size-probe.txt:7-9`; observed: `"b": 40` |
| C202 | FACT | While Google loads, the slot shows a small Loader. | source: `docs/sessions/evidence/task927/review-8/rv8-02-lines.txt:14-14`; observed: `<Loader size="sm" />` |
| C203 | FACT | The host is hidden until the status is `ready`. | source: `docs/sessions/evidence/task927/review-8/rv8-02-lines.txt:15-15`; observed: `hidden={status !== 'ready'}` |
| C204 | FACT | The button is drawn in an effect that runs after the status turns `ready`. | source: `docs/sessions/evidence/task927/review-8/rv8-02-lines.txt:8-9`; observed: `if (status === 'ready') drawButton()` |
| C205 | FACT | In the open deletion dialog at 390, the Google section measures 116 px with the loader, 94 px empty and 126 px with the button. | source: `docs/sessions/evidence/task927/jump/jump-probe2-ready.txt:6-8`; observed: `sections=61/94/113 google=empty` |
| C206 | FACT | The slot's comment says each state has one child with height and the slot adds no spacing. | source: `docs/sessions/evidence/task927/review-8/rv8-02-lines.txt:13-13`; observed: `exactly one child has height` |
| C207 | FACT | `theme.other.boxSize` in `theme.ts` is the typed owner of container dimensions, in rem strings. | source: `docs/sessions/evidence/task927/review-8/rv8-02-lines.txt:20-21`; observed: `boxSize: Record<` |
| C208 | FACT | The sheet's options test expects the outline theme and the medium size. | source: `docs/sessions/evidence/task927/review-8/rv8-02-lines.txt:16-16`; observed: `theme: 'outline', size: 'medium', text: 'signin_with'` |
| C209 | FACT | The header's SEC-927-FE-REMEMBER-ALLOW case expects the medium size. | source: `docs/sessions/evidence/task927/review-8/rv8-02-lines.txt:17-18`; observed: `toMatchObject({ size: 'medium', text: 'signin_with' })` |
| C210 | FACT | Four census rows cite D14. | source: `docs/sessions/evidence/task927/review-8/rv8-02-lines.txt:27-30`; observed: `census row citing D14: patterns-mantine-authsheet--welcome-back` |
| C211 | FACT | Their owner-decision text says Google's button is drawn at the medium size under D14. | source: `docs/sessions/evidence/task927/review-8/rv8-02-lines.txt:19-19`; observed: `is drawn at Google's medium size (Task 927 D14` |
| C212 | FACT | The comment above the deletion call still says an account is not deleted after a typed word. | source: `docs/sessions/evidence/task927/review-8/rv8-02-lines.txt:22-22`; observed: `not after a typed word` |
| C213 | FACT | Google's button is offered with the account as the hint in Welcome back and in the profile. | source: `docs/sessions/evidence/task927/review-8/rv8-02-lines.txt:23-24`; observed: `loginHint={account.sub}` |
| C214 | FACT | The eight write paths are in the contract's scope and none is a policy path. | source: `docs/sessions/evidence/task927/review-8/rv8-02-lines.txt:31-38`; observed: `scripts/rendered-interaction-states.json: scope YES; policy no` |
| C215 | FACT | Before the change, the five affected test files pass. | source: `docs/sessions/evidence/task927/review-8/rv8-03-baseline-tests.txt:125-126`; observed: `Tests  114 passed (114)` |
| C216 | FACT | Before the change, `check:design-tokens` reports findings only in other files (`Map.module.css`, `CabinetEmailChangeSectionView.tsx`, `input-chrome.css`). | source: `docs/sessions/evidence/task927/review-8/rv8-03b-design-tokens.txt:32-32`; observed: `2 raw style-value violation(s)` |
| C217 | FACT | D12 refused the personalized button and D14 chose the medium size for it. | source: `docs/sessions/evidence/task927/review-8/rv8-02-lines.txt:25-26`; observed: `Google's personalized button is not used` |
| C218 | FACT | After Amendment 8 the button's config type pins Google's Dark theme. | source: `docs/sessions/evidence/task927/review-8/rv8-11-lines.txt:3-4`; observed: `theme: 'filled_black'` |
| C219 | FACT | The logo stays centred. | source: `docs/sessions/evidence/task927/review-8/rv8-11-lines.txt:5-5`; observed: `logo_alignment: 'center'` |
| C220 | FACT | The button's docstring still describes Google's medium button that is never personalized. | source: `docs/sessions/evidence/task927/review-8/rv8-11-lines.txt:6-6`; observed: `which Google never personalizes` |
| C221 | FACT | `renderButton` gets the Dark theme. | source: `docs/sessions/evidence/task927/review-8/rv8-11-lines.txt:7-8`; observed: `theme: 'filled_black',` |
| C222 | FACT | The slot's host holds the token height as a minimum. | source: `docs/sessions/evidence/task927/review-8/rv8-11-lines.txt:9-9`; observed: `mih={theme.other.boxSize.googleButton}` |
| C223 | FACT | The sheet's options test expects the Dark theme. | source: `docs/sessions/evidence/task927/review-8/rv8-11-lines.txt:10-10`; observed: `theme: 'filled_black', size: 'large'` |
| C224 | FACT | The four census rows name the Dark theme under D20. | source: `docs/sessions/evidence/task927/review-8/rv8-11-lines.txt:11-11`; observed: `in its Dark theme (Task 927 D19, D20` |
| C225 | FACT | On `localhost`, for one frame the host holds Google's in-page button and its iframe button (82 px), and the deletion dialog grows from 475 to 515 px. | source: `docs/sessions/evidence/task927/review-8/rv8-10-localhost-swap.txt:6-7`; observed: `h=515 loader=false btn=208+40x358 iframes=1 btns=1 hostKids=1/82` |
| C226 | FACT | With the host's height fixed at 2.5rem (simulated in the page), the same frame leaves the dialog at 475 px. | source: `docs/sessions/evidence/task927/review-8/rv8-10-localhost-swap.txt:12-12`; observed: `top=325 h=475 loader=false btn=208+40x358 iframes=1 btns=1 hostKids=1/82` |
| C227 | FACT | Google's iframe button sits in a 44 px wrapper, with the iframe's margins at -2 px and -10 px. | source: `docs/sessions/evidence/task927/review-8/rv8-09-iframe-button-390.txt:22-25`; observed: `"iframeMargin": "-2px -10px -2px -10px",` |
| C228 | FACT | Served on `127.0.0.1`, the same dialog keeps 475 px: Google does not swap there. | source: `docs/sessions/evidence/task927/review-8/rv8-07-modal-390-en.txt:24-24`; observed: `h=475 loader=false btn=208+40x358 iframes=1` |
| C229 | FACT | The route's probe, which serves the build on `localhost`, shows the jump before the change. | source: `docs/sessions/evidence/task927/review-8/rv8-12-probe-baseline.txt:26-26`; observed: `h=515` |
| C230 | FACT | Google Identity Services draws the button the container gives it a host for. | source: `docs/sessions/evidence/task927/review-11/rv11-09-lines.txt:4-4`; observed: `api.renderButton(host, {` |
| C231 | FACT | In the owner's Chrome, Google's in-page button and its iframe button are both present during the opening. | source: `docs/sessions/evidence/task927/review-10/rv10-05-owner-chrome.txt:33-33`; observed: `gsiIframe=1 inPageBtn=1` |
| C232 | FACT | Medium's "Sign in with Google" is Medium's own link. | source: `docs/sessions/evidence/task927/review-11/rv11-02-medium-chrome.txt:5-5`; observed: `"tag":"A","text":"Sign in with Google"` |
| C233 | FACT | Medium's sign-in page loads no Google Identity Services script. | source: `docs/sessions/evidence/task927/review-11/rv11-02-medium-chrome.txt:6-6`; observed: `gsiScript (script src matching accounts.google.com/gsi): []` |
| C234 | FACT | Medium's link opens Google's OpenID Connect page with an ID-token response and Medium's own callback. | source: `docs/sessions/evidence/task927/review-11/rv11-02-medium-chrome.txt:13-13`; observed: `response_type=id_token token` |
| C235 | FACT | Medium draws the four-colour "G" as a flat SVG, without a gradient. | source: `docs/sessions/evidence/task927/review-11/rv11-02-medium-chrome.txt:22-22`; observed: `"hasGradient":false` |
| C236 | FACT | Google's own standard button today draws the flat "G" at 18 × 18 px, a 48-unit SVG. | source: `docs/sessions/evidence/task927/review-11/rv11-08-gis-logo.txt:5-6`; observed: `svg box: 18x18` |
| C237 | FACT | Google labels its button in the four locales as "Identifikohu me Google", "Sign in with Google", "Вхід через Google" and "Accedi con Google". | source: `docs/sessions/evidence/task927/review-11/rv11-06-gis-labels.txt:5-8`; observed: `it: Accedi con Google` |
| C238 | FACT | Google accepts our client for an ID-token response with the callback on `localhost:3000`. | source: `docs/sessions/evidence/task927/review-11/rv11-07-authorize-probe.txt:4-6`; observed: `Location: https://accounts.google.com/v3/signin/identifier` |
| C239 | FACT | Google accepts our client for an ID-token response with the callback on lero.al. | source: `docs/sessions/evidence/task927/review-11/rv11-07-authorize-probe.txt:8-10`; observed: `Location: https://accounts.google.com/v3/signin/identifier` |
| C240 | FACT | An unregistered callback is refused, so the probe tells the two apart. | source: `docs/sessions/evidence/task927/review-11/rv11-07-authorize-probe.txt:12-14`; observed: `signin/oauth/error?authError=` |
| C241 | FACT | Google's sign-in pages report their opener policy without enforcing it. | source: `docs/sessions/evidence/task927/review-11/rv11-05-coop.txt:5-5`; observed: `Cross-Origin-Opener-Policy-Report-Only: same-origin` |
| C242 | FACT | The button hands every consumer the credential and the raw nonce through one callback. | source: `src/components/auth/GoogleSignInButton.tsx:11-11`; observed: `onCredential: (result: { credential: string; nonce: string }) => Promise<void>` |
| C243 | FACT | The sheet's login view uses the button. | source: `src/modules/auth/components/AuthSheet.tsx:161-161`; observed: `<GoogleSignInButton clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID} onCredential={handleGoogle} />` |
| C244 | FACT | Welcome back passes the remembered account as the hint. | source: `src/modules/auth/components/AuthSheet.tsx:217-217`; observed: `loginHint={account.sub}` |
| C245 | FACT | The deletion dialog uses the button and repeats the deletion after it. | source: `src/modules/cabinet/components/ProfileTab.tsx:461-466`; observed: `onCredential={result => handleGoogleCredential(result, repeatDeleteAfterGoogle, setDeleteError)}` |
| C246 | FACT | The e-mail change uses the button. | source: `src/modules/cabinet/components/CabinetEmailChangeSection.tsx:93-98`; observed: `onCredential={handleGoogleCredential}` |
| C247 | FACT | The middleware leaves every `/auth` path out, so a page there is outside the locale tree. | source: `src/middleware.ts:93-93`; observed: `api/auth-email-hook` |
| C248 | FACT | The theme's `default` Button is white with a gray-2 border. | source: `src/design-system/mantine/theme.ts:1012-1018`; observed: `'--button-bd': '1px solid var(--mantine-color-gray-2)'` |
| C249 | FACT | Every Button is at least 44 px high. | source: `src/design-system/mantine/theme.ts:1048-1048`; observed: `minHeight: '2.75rem'` |
| C250 | FACT | The theme's 18 px icon size is `comfortable`. | source: `src/design-system/mantine/theme.ts:764-764`; observed: `comfortable: 18` |
| C251 | FACT | The theme holds a height token for Google's drawn button. | source: `docs/sessions/evidence/task927/review-11/rv11-09-lines.txt:31-31`; observed: `googleButton: '2.5rem'` |
| C252 | FACT | The slot shows a loader while Google's script loads. | source: `docs/sessions/evidence/task927/review-11/rv11-09-lines.txt:58-58`; observed: `aria-label={t('google_loading')}` |
| C253 | FACT | Storybook serves `public/`. | source: `.storybook/main.ts:49-49`; observed: `staticDirs: ['../public']` |
| C254 | FACT | Census rows excuse the class of Google's drawn button. | source: `docs/sessions/evidence/task927/review-11/rv11-09-lines.txt:68-68`; observed: `"exemptTargets": ".nsm7Bb-HzV7m-LgbsSe"` |
| C255 | FACT | One Tap calls Google's prompt. | source: `src/lib/auth/useGoogleOneTap.ts:69-69`; observed: `api.prompt()` |
| C256 | FACT | A nonce pair helper exists. | source: `src/lib/auth/googleIdentity.ts:143-143`; observed: `export async function createNoncePair(): Promise<NoncePair>` |
| C257 | FACT | The sheet's security tests drive a GIS double with `renderButton`. | source: `docs/sessions/evidence/task927/review-11/rv11-09-lines.txt:71-71`; observed: `renderButton: ReturnType<typeof vi.fn>` |
| C258 | FACT | The project runs Next 15.5, which uses `middleware.ts`. | source: `package.json:171-171`; observed: `"next": "15.5.18"` |
| C259 | FACT | Google's sign-in asset bundle was downloaded with the owner's permission. | source: `docs/sessions/evidence/task927/review-11/rv11-03-signin-assets-sha256.txt:1-1`; observed: `ba884069e12093b06bcfd776915081254a7c95094b80d50be2c5dc6bac1c1da1` |
| C260 | FACT | On the current build every one of 18 runs shows two Google controls at once and a changed button box. | source: `docs/sessions/evidence/task927/review-11/rv11-10-baseline.txt:101-101`; observed: `runs 18; failing 18` |
| C261 | FACT | Review 12 found that the popup awaited the nonce hash before it opened the window (Amendment 11 moved that code). | source: `docs/sessions/2026-10-10-task923-rendered-state-census.md:6949-6949`; observed: `awaits the nonce hash before` |
| C262 | FACT | Before Amendment 11, a security test required `noopener` in every `window.open`. | source: `docs/sessions/evidence/task927/review-12/rv12-01-tests.txt:5-5`; observed: `every window.open passes noopener` |
| C263 | FACT | Before Amendment 11, case SEC-S11-SRV-DENY applied the same rule. | source: `docs/sessions/evidence/task927/a11/a11-01-baseline-vitest.txt:57-57`; observed: `matchAll(/window\.open` |
| C264 | FACT | The rule's invariant is that the opened page cannot reach back through the opener. | source: `src/__tests__/security/clientSinks.test.ts:4-4`; observed: `cannot reach back through` |
| C265 | FACT | Both rules fail on the popup's call after Amendment 10. | source: `docs/sessions/evidence/task927/review-12/rv12-01-tests.txt:9-10`; observed: `src/lib/auth/googlePopup.ts: window.open(url, POPUP_NAME, POPUP_FEATURES)` |
| C266 | FACT | Before Amendment 11, the root layout mounted Vercel's Analytics and Speed Insights on every page with no filter. | source: `docs/sessions/evidence/task927/review-13/rv13-12-before-lines.txt:5-6`; observed: `<Analytics />` |
| C267 | FACT | Analytics accepts a `beforeSend` that returns the event or nothing. | source: `node_modules/@vercel/analytics/dist/next/index.d.ts:11-11`; observed: `BeforeSendEvent) => BeforeSendEvent` |
| C268 | FACT | Speed Insights accepts a `beforeSend`. | source: `node_modules/@vercel/speed-insights/dist/next/index.d.ts:5-5`; observed: `beforeSend?: BeforeSend;` |
| C269 | FACT | Both event types carry the page's address. | source: `node_modules/@vercel/analytics/dist/next/index.d.ts:1-3`; observed: `url: string;` |
| C270 | FACT | Review 12 found that a closed window rejected at once (Amendment 11 changed that line). | source: `docs/sessions/2026-10-10-task923-rendered-state-census.md:6953-6953`; observed: `A closed window rejects at once.` |
| C271 | FACT | Review 12 found a test still mocking Google's loader with a stale comment (Amendment 11 removed it). | source: `docs/sessions/2026-10-10-task923-rendered-state-census.md:6956-6956`; observed: `with a loader comment` |
| C272 | FACT | After Amendment 10 the button holds still in all 18 runs. | source: `docs/sessions/evidence/task927/review-12/rv12-02-stability.txt:47-47`; observed: `runs 18; failing 0` |
| C273 | FACT | Before Amendment 12 the server read "has a password" from the `email` entry of the account's providers. | source: `docs/sessions/2026-10-10-task923-rendered-state-census.md:7124-7124`; observed: `entry of the account's providers` |
| C274 | FACT | That answer chooses the proof the profile asks for. | source: `src/modules/cabinet/actions/index.ts:145-145`; observed: `return hasPassword ? 'password' : 'google'` |
| C275 | FACT | The same answer decides the server's check: only an account without a password is let through by a recent Google sign-in. | source: `src/modules/cabinet/actions/index.ts:158-158`; observed: `if (!hasPassword) return (await hasRecentOAuthSignIn()) ? null : 'reauth_required'` |
| C276 | FACT | The confirmed e-mail change sets the Auth address through the admin API. | source: `src/modules/cabinet/actions/index.ts:759-759`; observed: `updateUserById(token.user_id, {` |
| C277 | FACT | After the owner's e-mail change, the account created through Google carries the `email` provider. | source: `docs/sessions/evidence/task927/review-13/rv13-06-providers.txt:9-9`; observed: `providers ["google","email"]` |
| C278 | FACT | That account has no password in `auth.users`, while the server's read says it has one. | source: `docs/sessions/evidence/task927/review-13/rv13-07-password-column.txt:8-8`; observed: `password_null true has_password false accountHasPassword_reads true` |
| C279 | FACT | The deletion dialog asks for the password unless the proof is Google. | source: `src/modules/cabinet/components/ProfileTab.tsx:449-449`; observed: `passwordConfirm={reauthMethod === 'google' ? undefined : {` |
| C280 | FACT | The project's service-role-only functions can be executed by `service_role` and by no session role. | source: `docs/sessions/evidence/task927/review-13/rv13-08-catalog-and-doubles.txt:7-7`; observed: `execute ["postgres","service_role"]` |
| C281 | FACT | On the development project that function runs as its definer with a fixed search path, executable by `postgres` and `service_role` only. | source: `docs/sessions/evidence/task927/review-13/rv13-08-catalog-and-doubles.txt:7-7`; observed: `security_definer true config ["search_path=public, pg_temp"] execute ["postgres","service_role"]` |
| C282 | FACT | `public.account_has_password(uuid)` does not exist on the development project. | source: `docs/sessions/evidence/task927/review-13/rv13-08-catalog-and-doubles.txt:8-8`; observed: `account_has_password absent true` |
| C283 | FACT | Nine server test files give the account's providers through their `getUserById` double. | source: `docs/sessions/evidence/task927/review-13/rv13-08-catalog-and-doubles.txt:12-20`; observed: `app_metadata: { providers` |
| C284 | FACT | The same nine files double the admin client's `rpc`. | source: `docs/sessions/evidence/task927/review-13/rv13-08-catalog-and-doubles.txt:24-32`; observed: `rpc: ` |
| C285 | FACT | The integration fixture gives the admin client, an anonymous client and synthetic users with a session. | source: `src/tests/integration/fixtures.ts:160-160`; observed: `return { RUN, env, admin, anonymousClient, signIn, makeUser` |
| C286 | FACT | A fixture user is created with a password. | source: `src/tests/integration/fixtures.ts:57-57`; observed: `createUser({ email, password, email_confirm: true` |
| C287 | FACT | A proof that cannot be read refuses the deletion. | source: `src/modules/cabinet/actions/index.ts:408-408`; observed: `failure === 'reauth_unavailable' ? 'delete_failed' : failure` |
| C288 | FACT | Before Amendment 12 the nine server files and the two ProfileTab files pass. | source: `docs/sessions/evidence/task927/review-13/rv13-09-baseline.txt:9-9`; observed: `Tests  160 passed (160)` |
| C289 | FACT | A user that the Auth admin API creates with an e-mail and no password gets a bcrypt hash in `auth.users`, so the function answers true for it. | source: `docs/sessions/evidence/task927/review-14/rv14-09-nopassword-probe.txt:3-3`; observed: `"scheme":"$2a$","providers":["email"],"fn":true` |
| C290 | FACT | SEC-927-DB-PASSWORD-ALLOW, as Amendment 12 wrote it, fails on that user after the owner's apply. | source: `docs/sessions/evidence/task927/review-14/rv14-08-integration.txt:15-15`; observed: `the account has no password although Auth lists the email provider: expected { data: true, error: null }` |
| C291 | FACT | A user that `generateLink` of type `invite` creates holds an empty password, lists the `email` provider, and the function answers false for it. | source: `docs/sessions/evidence/task927/review-14/rv14-10-nopassword-routes.txt:7-7`; observed: `"is_empty":true,"scheme":"","confirmed":false,"providers":["email"],"fn":false` |
| C292 | FACT | The function still answers false for that user after `updateUserById` changes its address. | source: `docs/sessions/evidence/task927/review-14/rv14-10-nopassword-routes.txt:9-9`; observed: `"is_empty":true,"scheme":"","confirmed":true,"providers":["email"],"fn":false` |
| C293 | FACT | On the development project the applied function agrees with `auth.users` for every account. | source: `docs/sessions/evidence/task927/review-14/rv14-07-catalog-after-apply.txt:6-6`; observed: `disagreements with auth.users (expect 0): [{"n":0}]` |
| C294 | FACT | Before Amendment 13, SEC-927-DB-PASSWORD-ALLOW made its no-password user with `createUser`. | source: `docs/sessions/2026-10-10-task923-rendered-state-census.md:7239-7239`; observed: `the user made with` |
| C295 | FACT | The fixture's clean-up finds every user whose address starts with the run's prefix, also one it did not create. | source: `src/tests/integration/fixtures.ts:108-108`; observed: `list.data.users.filter(u => (u.email ?? '').startsWith(RUN))` |
| C296 | FACT | SEC-927-DB-PASSWORD-DENY passes after the owner's apply. | source: `docs/sessions/evidence/task927/review-14/rv14-08-integration.txt:10-10`; observed: `✓ src/lib/auth/googleSignIn.integration.test.ts > [SEC-927-DB-PASSWORD-DENY]` |
| C297 | FACT | `generateLink` returns the link for the caller to send; it sends no e-mail itself. | source: `node_modules/@supabase/auth-js/dist/module/GoTrueAdminApi.d.ts:138-138`; observed: `Generates email links and OTPs to be sent via a custom email provider.` |
| D1 | OWNER DECISION | Google sign-in uses Google Identity Services and `signInWithIdToken` with a nonce. | owner: 2026-10-20; decision: `я обрав авторизацію через Google методом Google Identity Services` |
| D2 | OWNER DECISION | The sheet shows Google's own rendered button (the dated exception to the token look for that one element). | owner: 2026-10-20; decision: `Кнопка від Google (Recommended)` |
| D3 | OWNER DECISION | After success the sheet closes and goes to the stored destination or refreshes; no callback. | owner: 2026-10-20; decision: `Після успіху закрити Login drawer і перейти на збережений auth_redirect_next, або оновити поточну сторінку. У цьому потоці не потрібен /auth/callback.` |
| D4 | OWNER DECISION | The password sign-in and the client secret are not touched; no secret in client code. | owner: 2026-10-20; decision: `Не чіпати email/password login, Supabase Client Secret і не передавати секрет у клієнтський код.` |
| D5 | OWNER DECISION | A script failure shows a proper error, never a stuck loading state. | owner: 2026-10-20; decision: `помилка завантаження Google script показує нормальну помилку, а не залишає кнопку в стані loading.` |
| D6 | OWNER DECISION | Unit tests, a regression run and a security review of loopholes. | owner: 2026-10-20; decision: `Після внесення змін, кокрити код unit тестами, перевірит регрессію, перевірити на лазівки, дірки, які можуть використати злочинці.` |
| D7 | OWNER DECISION | The sign-in shows Lero.al, not a Supabase subdomain. | owner: 2026-10-20; decision: `вхід показує Lero.al / lero.al, а не випадковий Supabase subdomain` |
| D8 | OWNER DECISION | The owner has set the public client ID on Vercel and locally. | owner: 2026-10-20; decision: `У Vercel та у env.local я додав ключ NEXT_PUBLIC_GOOGLE_CLIENT_ID=.` |
| D9 | OWNER DECISION | `signInWithOAuth` is not kept: the whole system uses the new method. | owner: 2026-10-20; decision: `а нащо нам зберігати signInWithOAuth, якщо у системі тепер буде інший метод?` |
| D10 | OWNER DECISION | Amendment 2 approved: the profile tab moves to GIS in this task, Task 928 is withdrawn. | owner: 2026-10-20; decision: `так, оновлюй інструкцію і проганяй перевірки` |
| D11 | OWNER DECISION | Where Google's 400 px limit keeps its button narrower than the form, the button is centred in the form. | owner: 2026-10-23; decision: `If this is a limit of the Google button, then in that case it must be centred in the form.` |
| D12 | OWNER DECISION | Google's personalized button is not used; Google's account chooser appears instead. | owner: 2026-10-25; decision: `Nobody uses that kind of sign-in. Instead, an adaptive popup with a choice of Google accounts must appear.` |
| D13 | OWNER DECISION | A person who has signed in with Google before sees a Welcome back screen; another sign-in method leads to the start screen with e-mail, password and Google's standard Sign in with Google button. | owner: 2026-10-25; decision: `If the user has already signed in through Google, the system must show information like Welcome Back, and a button to choose another sign-in method, which takes the user to the start screen of sign-in, where one can enter login and password, and also sign in through the Google button, which must be standard, with the text Sign in with Google` |
| D14 | OWNER DECISION | Google's medium button with the text Sign in with Google, never personalized, accepted although it is lower than the fields. | owner: 2026-10-25; decision: `Medium, without the name (Recommended)` |
| D15 | OWNER DECISION | This device remembers the Google account's name, avatar, masked e-mail and Google id; the record stays after a sign-out; Forget this account and the account's deletion erase it. | owner: 2026-10-25; decision: `This device (Recommended)` |
| D16 | OWNER DECISION | Google's One Tap account chooser shows on every page for a guest. | owner: 2026-10-25; decision: `On every page for a guest` |
| D17 | OWNER DECISION | An account with no password (signed in through Google) types DELETE to delete itself in the profile. | owner: 2026-10-25; decision: `The deletion of an account that was signed in through Google happens with nothing at all, you do not even have to type DELETE; this is very bad UX. In such cases DELETE must be typed for confirmation.` |
| D18 | OWNER DECISION | F4's correction is made before the one push with Task 923. | owner: 2026-10-25; decision: `Before push` |
| D19 | OWNER DECISION | Google's button has the height Google's branding guidelines give (40 px, Google's large size); this replaces D14's medium size. | owner: 2026-10-25; decision: `The documentation clearly states what height the button must have` |
| D20 | OWNER DECISION | Google's button uses Google's Dark theme. | owner: 2026-10-25; decision: `I want to use the Dark theme of the button!` |
| D21 | OWNER DECISION | The button's text stays Sign in with Google and its shape stays Rectangular. | owner: 2026-10-25; decision: `Sign in with Google; Rectangular` |
| D22 | OWNER DECISION | Google may personalize its large button ("Continue as" with the person's name) in Welcome back, on the start view after More sign-in options, in the profile's e-mail re-confirmation and in the deletion dialog; D12 no longer applies to the button, while Welcome back and One Tap stay. | owner: 2026-10-25; decision: `(c) large + Dark, the name is allowed in the four places above. Then D12 must be cancelled for the button.` |
| D23 | OWNER DECISION | A Dark button of our own was chosen over Google's Dark button with its white square; withdrawn the same day by D24. | owner: 2026-10-25; decision: `Own Dark button` |
| D24 | OWNER DECISION | Google's own button stays: large, Light theme (`outline`), logo centred. This replaces D20 and D23. | owner: 2026-10-25; decision: `stop, let's use the native button, large; Light (outline); if the button is outline, light, the logo can stay centred, because nobody will see the white square under the logo` |
| D25 | OWNER DECISION | A Google button of our own, as on medium.com, which Google never draws; it replaces D2, D19, D22 and D24 for the button. One Tap stays Google's prompt (D16). | owner: 2026-10-26; decision: `I want this button to behave exactly as perfectly as on medium.com; As on Medium (Recommended)` |
| D26 | OWNER DECISION | The two callback addresses are registered for the OAuth client. | owner: 2026-10-26; decision: `I have already added these addresses to Authorized redirect URIs` |
| D27 | OWNER DECISION | Google's sign-in window is the one exception to the `noopener` rule of SEC-S11; every other window and link keeps it. | owner: 2026-10-26; decision: `An exception only for Google's window (Recommended)` |
| D28 | OWNER DECISION | Whether the e-mail change and the deletion ask for the password or for Google is decided by whether the account really has a password. | owner: 2026-10-28; decision: `By the real password (Recommended)` |

## Mobile adaptation record
- Scope: visible
- Surfaces: src/modules/auth/components/AuthSheet.tsx — the login view of the sign-in sheet, its Google slot after the `or` divider; src/components/auth/GoogleSignInSlot.tsx — the slot's loading, ready and unavailable states; src/modules/cabinet/components/ProfileTab.tsx — the e-mail section's Google re-confirmation under its error line; src/design-system/mantine/patterns/MantineDeleteConfirmModal.tsx — the deletion dialog's Google section; src/components/auth/GoogleWelcomeBack.tsx — the Welcome back view: identity block, Google slot and its two exits (Amendment 5); src/modules/auth/components/AuthSheet.tsx — the Welcome back view of the sign-in sheet (Amendment 5)
- Component families: overlay-and-disclosure, form-picker-and-choice
- Pattern IDs: overlay-adaptive, form-stack
- Standards: w3c-focus-order, w3c-hover-focus, apple-hig-sheets, android-common-layouts, android-adapt-layouts, w3c-labels-instructions, w3c-reflow, apple-hig-layout, android-content-structure
- Mantine mechanism: responsive-props
- Mantine owner: src/design-system/mantine/patterns/MantineDrawer.tsx, src/design-system/mantine/patterns/MantineDeleteConfirmModal.tsx
- Mobile range and switches: below 640px (theme.other.mobileGate / sm) `MantineDrawer` shows its bottom sheet (C34) and the slot is the full content width; Google's button fills it up to Google's 400 px limit (C30, C102) and, where the content is wider, is centred in it (D11, Amendment 4); the deletion dialog is the structured `MantineModal` bottom sheet below 640 and the slot fills its section; at the 640px transition the side drawer and the centred dialog; no other threshold
- Mobile order: sign-in sheet — e-mail; password with forgot-password link; Sign in; or divider; Google slot (Google's button, or its loader, or the unavailable alert); register line. Deletion dialog — consequence text; Google section (why, then the Google slot); error alert; Cancel and Delete. Profile e-mail section — new address; Save; error line; Google slot. Welcome back view (Amendment 5) — alerts; avatar; name; masked e-mail; Google slot; Forget this account; Not your account? More sign-in options
- Required-content treatment: wrap — the unavailable alert texts, the dialog's Google text and the register line wrap; the profile's e-mail inside the wrong-account alert wraps at any point (Amendment 3, R15); Google's button text is Google's own (D2); Welcome back's name and masked e-mail wrap and are never clamped (Amendment 5); no clipping, no semantic loss
- Story and verification: src/stories/patterns/mantine/GoogleSignInSlot.stories.tsx (Loading, Unavailable, UnavailableReauth), the AuthSheet `Login` Story and the Modal `DeleteConfirmPassword` Story; 320, 390, 639, 640, 1440; sq, en, uk, it. Amendment 5: src/stories/patterns/mantine/GoogleWelcomeBack.stories.tsx (Initials, Picture, LongName, WithAlerts) and the AuthSheet `WelcomeBack` Story, across 320, 375, 390, 480, 560, 639, the 640px transition and wider (AC26); sq, en, uk, it

## 4. Scope and out of scope

In scope: the browser wrapper (R1), the GIS loader and nonce helper (R2), the Google button container (R3) and its view (R4), the login
view's Google path (R5), the proof of the profile row (R6), the unchanged headers (R7), four locale keys (R8), the Story and registries
(R9), the existing tests and the new ones (R10), the `docs/env.md` row (R11), the profile tab's re-confirmation (R13) and the
deletion dialog's Google section with its Story and test (R14); Amendment 3: the canonical Alert's message wrap in
`src/design-system/mantine/theme.ts` (R15); Amendment 5: Google's standard button, the remembered account, the Welcome back view and One Tap for a guest (R18–R28, §16). Owner actions (R12) are listed in §10; the executor does none of them.

Out of scope and unchanged: the e-mail/password submit, forgot-password, both registration views (Task 926 edits the agent view, C46),
`src/app/auth/callback/route.ts` (still used by the reset link, C10), the server actions and their recent-sign-in rule
(`src/modules/cabinet/actions/index.ts`, C58: already satisfied by an `id_token` session, C59, C60), the rest of `ProfileTab.tsx`
(password re-confirmation, profile form, avatar, legacy styling), `src/lib/security/headers.ts`, `next.config.ts`, the captcha, the
Supabase client secret, automatic sign-in (Amendment 5 brings One Tap for a guest into scope, D16; `auto_select` stays `false`), account linking between a password account and a Google account (Supabase's own
identity linking, unchanged), the pre-existing 28 px captcha gap of the register view (C39, reported to the owner, not this task's
element), `handle_new_user`'s reading of `role` from metadata (Task 923 hardening DBR-1; Google's signed token carries no `role` claim
the visitor controls, so this flow is not that path).

**Working tree.** The auth files carry Task 923's uncommitted work (C44, C45, C53, C54). Write only this task's hunks; never revert,
reformat or stage another task's lines. If Task 926 lands first, rebase this task's hunks of `AuthSheet.tsx` onto it; its login view
is not touched by 926.

## 5. Current and required behaviour

Preserved: password sign-in, its errors and its redirect (C3, C4, C6); the ban answer (C6); forgot-password through the callback
(C10); the profile row's creation by the trigger (C12, C13); the headers (C20, C21). Changed: the Google control is Google's own
button rendered by GIS (D2); a click opens Google's popup, which names Lero.al (D7); the ID token goes to `signInWithIdToken` with this
attempt's raw nonce while Google got its SHA-256 hex (C23); success closes the sheet and pushes the sanitized stored destination or
refreshes (D3); failure to load GIS shows an alert instead of a spinner (D5). The profile tab's re-confirmation stops leaving the site:
Google's button in a popup, the account preselected, the action the person already asked for continues after a confirmation with the
same account (R13). `signInWithOAuth` disappears from `src/` (D9).

## Requirements

| ID | Observable requirement | P | AC |
|---|---|---|---|
| R1 [C1; C2; C29; C55; C58; C59; C60; D1; D9] | **Wrapper.** In `src/lib/auth/browser.ts` add `signInWithGoogleIdToken(token: string, nonce: string)`, returning `createClient().auth.signInWithIdToken({ provider: 'google', token, nonce })` unchanged, and remove `signInWithOAuth`: its two callers, the sign-in sheet (C1) and the profile tab (C55), both move to the new call, as the login-view and profile requirements below state. | P1 | AC1 |
| R2 [C23; C24; C29; C96; C97; C98; D1; D5] | **GIS loader and nonce.** New browser module `src/lib/auth/googleIdentity.ts`: the script URL constant `https://accounts.google.com/gsi/client`; `loadGoogleIdentity(timeoutMs = 10000)` appends at most one `<script async>` (id `google-identity-services`) per page, shares one pending promise between callers, resolves with `window.google.accounts.id` after `load`, and rejects on `error`, on the timeout, or when `load` fires without that API; after a rejection the failed element is removed so a later call retries. `createNoncePair()` returns `{ nonce, hashedNonce }`: `nonce` is the base64 of 32 bytes from `crypto.getRandomValues` (C24), `hashedNonce` the lowercase hex SHA-256 of the nonce's UTF-8 bytes from `crypto.subtle.digest` (C23). A narrow typed declaration of the GIS calls used (`initialize`, `renderButton`, `cancel`); no `any`. Amendment 3 (follow-up): Google sets the button's language from `hl` on the library URL as well as from `locale` (C96); without it GIS's own text, its iframe title and its accessible name follow Google's default, not the page (C97, C98). `loadGoogleIdentity(locale, timeoutMs = 10000)` loads `https://accounts.google.com/gsi/client?hl=<locale>` with the page's locale (sq, en, uk, it); when the element already on the page was loaded for another locale, the loader removes it and `window.google`, and loads the library for the new locale, so a language switch without a full reload also changes Google's text. The sharing of one pending promise and the retry after a failure apply per locale. | P1 | AC2, AC5 |
| R3 [C29; C30; C31; C72; D1; D2; D5] | **Container `src/components/auth/GoogleSignInButton.tsx`** (`'use client'`), props `clientId: string or undefined` and `onCredential({ credential, nonce }): Promise<void>`. (a) Without a client ID it injects no script and shows the unavailable state. (b) Otherwise it loads GIS through `loadGoogleIdentity`, creates a nonce pair, calls `initialize({ client_id, callback, nonce: hashedNonce, auto_select: false, context: 'signin', ux_mode: 'popup' })` and `renderButton(host, { type: 'standard', theme: 'outline', size: 'large', text: 'continue_with', shape: 'rectangular', logo_alignment: 'center', width: String(min(slot width, 400)), locale })`, with the slot width from Mantine's `useElementSize` and `locale` from `useLocale()` (C30, C31); a width change re-renders the button. It never calls `prompt()`: no One Tap, no automatic sign-in. (c) The callback ignores an empty credential and any credential that arrives while one is pending; it calls `onCredential` with the credential and this attempt's raw nonce; when that promise settles, a new nonce pair is created and `initialize` and `renderButton` run again, so no nonce serves twice. (d) Load failure, timeout or a missing API leaves the loading state for the unavailable state (D5). (e) The credential and the raw nonce are kept only in memory: never in storage, the URL, the console or analytics. (f) On unmount it calls `cancel()` and ignores late callbacks. (g) Two optional props (Amendment 2): `purpose` (`'signin'` default, or `'reauth'`), passed to the view; and `loginHint`, passed as `login_hint` to `initialize` only when given (C72). | P1 | AC2, AC5, AC6, AC14 |
| R4 [C8; C9; C36; C37; C38; C71; C75; C76; C77; D2; D5] | **View `src/components/auth/GoogleSignInSlot.tsx`**, stateless, props `status` (`loading`, `ready` or `unavailable`) and `hostRef`. It is one full-width child of the login form's Stack (C8), so it keeps the form's 16 px rhythm (C36). The host element that Google draws into is always mounted and centred with Mantine `Center`; `loading` adds a Mantine `Loader` of size `sm` inside a `role="status"` element named `auth.google_loading`; `unavailable` adds `Alert color="red"` with `auth.google_unavailable`, the sheet's one error-alert look (C9, C38); with `purpose="reauth"` the alert text is `auth.google_reauth_unavailable` instead, because a Google-only account has no password to fall back to (C71). No `style`, `styles`, `className` or raw visual value. Amendment 3: the slot's root adds no spacing of its own — a Mantine `Box`, not a `Stack` with a gap (C76) — and in every state exactly one child has height (the loader, the alert, or the host), so the slot's box equals that child's box; today the hidden host still takes a 16 px gap, which doubles the sheet's gap under the alert or loader and adds 16 px under the dialog's alert (C75, C77). | P1 | AC5, AC10, AC14 |
| R5 [C3; C4; C5; C6; C7; C10; C52; D3; D4] | **Login view.** In `AuthSheet.tsx` the Mantine Google button and `handleGoogle` (C7) are replaced, at the same place after the divider, by `<GoogleSignInButton clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID} onCredential={...} />`. Its handler clears the error, awaits `signInWithGoogleIdToken(credential, nonce)`; an error sets `mapAuthError(error.message)` (a ban gives the wrong-credentials text, C6, C52) and the sheet stays open; a thrown rejection sets `error_generic`; success calls `onClose()`, then takes `sanitizeReturnTo(sessionStorage.getItem('auth_redirect_next'))`: a value is removed from the storage and pushed, otherwise `router.refresh()` (C3, C4, C5). No `/auth/callback` and no `SITE_URL` in the Google path; `SITE_URL` stays for forgot-password (C10). The password submit, forgot-password and both registration views are byte-identical. | P1 | AC1, AC3, AC4 |
| R6 [C11; C12; C13; C14; C15; C16; C17] | **The profile row.** No new profile code: the trigger creates the row in the same insert as the Google account, before the session exists (C12, C13, C14), as the fixtures already rely on (C15). Because the controller signs out a browser whose server answer is `user: null` (C16, C17), SEC-927-DB-ALLOW is run first, before any UI write; if it fails the task stops as `BLOCKED — PROFILE TRIGGER ABSENT`. `/auth/callback` and its `ensureUserProfile` stay for their own flows (C11). | P1 | AC7, AC9 |
| R7 [C20; C21; C22; C33] | **Headers and CAPTCHA unchanged.** No script, frame or connect policy exists to extend (C20), the referrer policy is Google's (C21, C22), and the `id_token` grant is not CAPTCHA-gated (C33): `headers.ts`, `next.config.ts` and the captcha code are not edited. The owner's production check (AC12) confirms the script and popup load. | P1 | AC12 |
| R8 [C9; C52; C68; C71; D5; D9] | **Locale keys** under `auth` in all four `messages/*.json`: `google_unavailable` — sq `Hyrja me Google nuk është e disponueshme tani. Hyni me email dhe fjalëkalim ose provoni më vonë.`; en `Google sign-in is not available right now. Sign in with your email and password or try again later.`; uk `Вхід через Google зараз недоступний. Увійдіть за допомогою email і пароля або спробуйте пізніше.`; it `L'accesso con Google non è disponibile al momento. Accedi con email e password o riprova più tardi.` — and `google_loading` — sq `Po ngarkohet hyrja me Google`; en `Loading Google sign-in`; uk `Завантаження входу через Google`; it `Caricamento dell'accesso con Google`. Amendment 2: `auth.google_reauth_unavailable` — sq `Konfirmimi me Google nuk është i disponueshëm tani. Provoni më vonë.`; en `Google confirmation is not available right now. Try again later.`; uk `Підтвердження через Google зараз недоступне. Спробуйте пізніше.`; it `La conferma con Google non è disponibile al momento. Riprova più tardi.` `cabinet.reauth_google_wrong_account` — sq `Konfirmoni me llogarinë Google të këtij profili ({email}).`; en `Confirm with the Google account of this profile ({email}).`; uk `Підтвердьте через обліковий запис Google цього профілю ({email}).`; it `Conferma con l'account Google di questo profilo ({email}).` `cabinet.reauth_google_failed` — sq `Konfirmimi me Google dështoi. Provoni përsëri.`; en `Google confirmation failed. Try again.`; uk `Не вдалося підтвердити через Google. Спробуйте ще раз.`; it `Conferma con Google non riuscita. Riprova.` `cabinet.delete_account_google_required` is rewritten (C68) — sq `Llogaria juaj nuk ka fjalëkalim. Konfirmoni me Google se jeni ju; më pas fshirja vazhdon.`; en `Your account has no password. Confirm with Google that it is you; the deletion then continues.`; uk `У вашого облікового запису немає пароля. Підтвердьте через Google, що це ви; після цього видалення продовжиться.`; it `Il tuo account non ha una password. Conferma con Google che sei tu; poi l'eliminazione prosegue.` `cabinet.reauth_google_confirm` is removed from the four files once no file reads it (Google's button carries its own text, D2). | P1 | AC5, AC14 |
| R9 [C40; C41; C42; C43; C82; C83; C84; D2] | **Story and registries.** New direct Story `src/stories/patterns/mantine/GoogleSignInSlot.stories.tsx`, title `Patterns/Mantine/GoogleSignInSlot`, exports `Loading`, `Unavailable` and `UnavailableReauth` (`purpose="reauth"`; data and public props only; locale from the toolbar). `ready` has no export: Google draws it, and its proof is the AuthSheet `Login` Story (C41) on the built Storybook plus the owner's native check. `GoogleSignInSlot.tsx` and `GoogleSignInButton.tsx` are added to `scripts/mantine-migration-scope.json`; `scripts/ui-contract-registry.json` gets a row: component `src/components/auth/GoogleSignInSlot.tsx`, story the new file, token owner `src/design-system/mantine/theme.ts`, parity element `the sign-in sheet's error alert and loader`, story exports `Loading`, `Unavailable`, `UnavailableReauth`. The new Stories open no portal, so `scripts/rendered-interaction-states.json` gets no row; the `Login` row (C42) is unchanged. Amendment 3: the manifest also enrols `GoogleSignInButton.tsx` (C82) and the gate fails a newly enrolled component without a row (C83), so `scripts/ui-contract-registry.json` gets a second row: id `google-sign-in-button`, component `src/components/auth/GoogleSignInButton.tsx`, story `src/stories/mantine/primitives/Modal.stories.tsx` (it imports the component, C84), token owner `src/design-system/mantine/theme.ts`, parity element `the Google re-confirmation control of the deletion dialog`, story exports `DeleteConfirmPassword`. No new Story. | P1 | AC10 |
| R10 [C47; C48; C49; C50; C56; C70; D6; D9] | **Tests.** `AuthSheet.test.tsx` (C47) and the banned-account test (C50) mock `signInWithGoogleIdToken` instead of `signInWithOAuth`, without weakening any assertion; the two Google tests of `AuthSheet.test.tsx` become tests of the new flow. `browserAuth.security.test.ts` (C48) tests the new wrapper and asserts that `signInWithOAuth` is no longer exported; `browser.smoke.test.ts` (C49) stubs `signInWithIdToken` and removes no other assertion. In `ProfileTab.deletePassword.security.test.tsx` the two Google tests (C56, C70) mock `signInWithGoogleIdToken` and assert that the Google section appears where the redirect button was; every password assertion is unchanged. New tests per the security contract. Every new security test is a top-level `it(...)` so its collected full name equals its `testName`. | P1 | AC2–AC9, AC13, AC14 |
| R11 [D4; D8] | **`docs/env.md`** gets a `NEXT_PUBLIC_GOOGLE_CLIENT_ID` row: public, exposed to the browser for GIS, the OAuth web client ID; no secret variable is read by any client file. | P2 | AC11 |
| R12 [C25; C26; C27; C28; C32; D7; D8] | **Owner configuration** (§10) is a precondition of AC12 only; the executor does not change Google Cloud, Supabase or Vercel settings. | P1 | AC12 |
| R13 [C55; C57; C58; C59; C60; C61; C62; C63; C64; C72; C73; C79; C80; C81; D9; D10] | **Profile re-confirmation (Amendment 2).** In `ProfileTab.tsx` `confirmWithGoogle` and the `signInWithOAuth` import are removed; where the redirect button was (C61) and in the deletion dialog's Google section (C62), the tab renders `<GoogleSignInButton clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID} purpose="reauth" loginHint={email} onCredential={...} />`. The handler, shared by both places: (a) ignores a credential while the e-mail change is sending or the deletion runs; (b) reads the `email` claim of the credential's payload (base64url JSON, C73) and compares it, lower-cased, with the tab's `email` (C63); a different or unreadable e-mail shows `cabinet.reauth_google_wrong_account` with the tab's e-mail and calls nothing else — this is a guard against confirming with another account, not a security boundary: the server acts only on the session's own account; (c) awaits `signInWithGoogleIdToken(credential, nonce)`; an error, a thrown rejection or no user shows `cabinet.reauth_google_failed`; (d) a returned user whose id is not `profile.id` means the browser now holds another account's session: it calls the context's `signOut` with a push to `/${locale}`, and nothing is repeated; (e) on success with the same id it hides the Google section and repeats the action the person already asked for — the e-mail change with the same new address, or the deletion — which the server now lets through, because the new session lists `oauth` within 10 minutes (C58, C59, C60, C64). Errors go to the e-mail section's error line or the dialog's alert. No `/auth/callback`, no `SITE_URL` in these paths; the password re-confirmation is byte-identical. (f) Amendment 3: GIS keeps one configuration per page, the last `initialize` (C79), and the tab can mount two buttons at once (C80, C81): after the dialog's button unmounts, the e-mail section's button would hand its credential to the dead instance and do nothing. The tab therefore mounts at most one `GoogleSignInButton`: the e-mail section's button renders only while the deletion dialog is closed (`emailNeedsGoogle && !showDeleteDialog`), so the button the person sees is the one Google calls back; it initializes again when the dialog closes. `GoogleSignInButton` itself is unchanged. | P1 | AC1, AC14, AC15 |
| R15 [C85; C86; C87; C88; C95] | **Long tokens in the canonical alert (Amendment 3).** The wrong-account text puts the profile's e-mail into the dialog's red alert (C88); a long address without a hyphen runs past the alert at 320 and is cut (C86). In `src/design-system/mantine/theme.ts`, the `Alert` `message` styles (C85) add `overflowWrap: 'anywhere'`, which keeps that text inside (C87); no other Alert value changes and no consumer gets a style. Ruling on the executor's question: Mantine's computed `text-overflow: ellipsis` on the message (C95) acts only on a token wider than the line; on wrapped prose it is latent and not a defect, and after this change no token can trigger it. | P1 | AC16 |
| R14 [C65; C66; C67; C74; D2; D9] | **Deletion dialog.** `MantineDeleteConfirmModal`'s `googleConfirm` becomes `{ message: ReactNode; control: ReactNode }`: its section keeps the message text and renders `control` full width under it in the same `Stack gap="sm"`; the button of C66 and the `label`/`onConfirm` fields are removed, with its doc comment. Its smoke test (`MantineDeleteConfirmModal.smoke.test.tsx`) passes a control and asserts it renders under the message. The Modal Story `DeleteConfirmPassword` (C67) passes `control: <GoogleSignInButton clientId={undefined} purpose="reauth" onCredential={async () => {}} />`, which shows the deterministic unavailable state without a network request; its rendered-state row (C74) stays and is re-measured. | P1 | AC10, AC14 |

## Acceptance criteria

- **AC1 [R1; R5; R13; C1; C2; C10; C55; D1; D3; D9].** A grep of `src/` and `.storybook/` finds `signInWithOAuth` only in the assertion of `browserAuth.security.test.ts` that it is no longer exported; the Google paths of `AuthSheet.tsx` and `ProfileTab.tsx` name neither `/auth/callback` nor `SITE_URL` (grep transcripts); SEC-927-FE-WRAP passes.
- **AC2 [R2; R3; C23; C24; D1].** SEC-927-FE-ALLOW and SEC-927-FE-UNIT-NONCE pass: the nonce GIS got equals the SHA-256 hex of the raw nonce given to `signInWithIdToken`, computed in the test with `node:crypto`; the raw nonce decodes to 32 bytes; two pairs differ. SEC-927-FE-DENY-REPLAY passes. Sensitivity: giving GIS the raw nonce fails FE-ALLOW; reusing one pair for two attempts fails FE-DENY-REPLAY; each restored passes.
- **AC3 [R5; C3; C4; C5; D3].** SEC-927-FE-DENY-REDIRECT passes for `https://evil.example/steal`, `//evil.example`, `/\evil.example` and `javascript:alert(1)` (refresh, no push) and FE-ALLOW pushes `/en/favorites?tab=2` and clears the key. Sensitivity: pushing the raw stored value fails it; restored passes.
- **AC4 [R5; C6; C52; D4].** SEC-927-FE-DENY-BANNED passes in sq, en, uk and it; the existing password and banned-account tests pass with unchanged assertions.
- **AC5 [R2; R3; R4; R8; C96; C97; C98; D5].** Amendment 3 (follow-up): SEC-927-FE-UNIT-LOADER also asserts the library URL ends with `?hl=<locale>` for sq, en, uk and it, and that a call for another locale replaces the element; on a fresh `npm run build-storybook`, `node docs/sessions/evidence/task927/review-1/login-google-shot.mjs storybook-static <dir>` shows GIS's page-side text and iframe title in the toolbar's language for all four locales (no Albanian text under `en`, `uk` or `it`). SEC-927-FE-ERR-SCRIPT, -TIMEOUT (fake timers, 10 000 ms), -NOCLIENT and SEC-927-FE-UNIT-LOADER pass: the alert shows `google_unavailable`, no loader remains, nothing is sent to Supabase, and the e-mail form still signs in.
- **AC6 [R3; D2; D6].** SEC-927-FE-DENY-NOAUTO passes (`auto_select: false`, `prompt` never called, nothing sent before a credential); a unit test asserts the `renderButton` options and the width `min(slot, 400)` for slot widths 288, 358 and 420.
- **AC7 [R6; C12; C13; C15].** SEC-927-DB-ALLOW passes on the approved development project: an Auth user created with Google-shaped metadata has exactly one `public.users` row (role `user`, `user_type` `private`, `is_verified` false) within 10 s; clean-up verified.
- **AC8 [R6; R7; C33; D7].** SEC-927-PRV-DENY passes: a forged Google-shaped ID token signed by a key of the run is refused by Supabase Auth, no session is returned and no Auth user exists for its e-mail; the error is not a provider-disabled or captcha error; the literal error is retained.
- **AC9 [R6; C16; C17; C18; C19].** SEC-927-SRV-ALLOW, -DENY and -ERR pass on the real `/api/auth/me` handler and the real `requireViewer`.
- **AC10 [R4; R9; R14; C8; C35; C36; C38; C40; C41; C42; C43; C67; C74; C75; C77; C78; C82; C83; C89; C90; D2].** Amendment 3 first: `node docs/sessions/evidence/task927/review-1/slot-trailing-gap.mjs storybook-static` reports `"trailingInsideSlot":0` on every row (the slot's box equals its visible child; a probe that drops zero-height children, C78, is not this proof), and `npm run check:ui-contract` lists both `GoogleSignInSlot.tsx` and `GoogleSignInButton.tsx` among the newly enrolled components without a failure (C83). The AuthSheet `Login` entry failed in Storybook through Task 923's static `next/server` import (C89); 923 now loads it lazily (C90) and `Login` renders again (C99), so its proof is taken on the fresh build. On a fresh `npm run build-storybook`: the GR-12 census of `gr12-auth-slot-census.mjs` (extended with the two new Stories) shows the error alert with one look and the login form's gaps all 16 px; the GR-3h rhythm and GR-3i wrap probes over 320, 375, 390, 480, 560, 639, 640, 680, 768, 1024, 1440 and 1920 × sq, en, uk, it pass; `check-rendered-state-census.mjs --stories patterns-mantine-authsheet--login,patterns-mantine-googlesigninslot--loading,patterns-mantine-googlesigninslot--unavailable,patterns-mantine-googlesigninslot--unavailable-reauth,mantine-primitives-modal--delete-confirm-password` passes, the dialog's Google state (C74) included; the census shows one look for the Google control in the sheet, the profile tab and the dialog (Google's own, D2) and one look for the error alert; `npm run check:ui-contract` and `node scripts/check-mobile-adaptation-contract.mjs` exit 0; the owner matrix of §7 is filed. Approval waits for Task 923's census gate (C43).
- **AC11 [R11; D4].** After `npm run build`, `.next/static` contains no `GOCSPX-`, no `GOOGLE_CLIENT_SECRET` and no `SUPABASE_AUTH_EXTERNAL_GOOGLE` (transcript); `src/` reads no Google variable other than `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.
- **AC12 [R7; R12; R13; C25; C26; C27; C28; C32; D7; D8].** Owner, after §10, on `http://localhost:3000` and on production: the Google popup names Lero.al / lero.al and no `supabase.co`; one session; the cabinet opens; a new Google account has its `users` row; the e-mail sign-in works; with `accounts.google.com` blocked in DevTools the alert appears. With a throw-away Google-only account more than 10 minutes after its sign-in: the profile e-mail change asks for Google, the popup preselects that account and names Lero.al, and the change continues; the deletion does the same and the account is deleted. The owner records accepted or returned.
- **AC14 [R3; R4; R8; R10; R13; R14; C58; C61; C62; C63; C64; C73; C79; C80; C81; D9; D10].** Amendment 3: SEC-927-FE-REAUTH-ONE-CONFIG passes (the e-mail change needs Google, the person opens the dialog, the deletion needs Google, the dialog closes, a credential through the configuration GIS holds last repeats the e-mail change once); sensitivity: rendering the e-mail section's button while the dialog is open fails it, restored passes. SEC-927-FE-REAUTH-ALLOW, -DENY-ACCOUNT, -DENY-SWITCH and -ERR pass on the real `ProfileTab`, `MantineDeleteConfirmModal` and `GoogleSignInButton` with the GIS double: the e-mail change and the deletion are each repeated exactly once after a same-account confirmation, never after a refused, failed or switched one; `initialize` got `login_hint` equal to the tab's e-mail; the unavailable text is `auth.google_reauth_unavailable`. The rewritten `ProfileTab.deletePassword.security.test.tsx` and the modal smoke test pass. Sensitivity: skipping the e-mail comparison fails -DENY-ACCOUNT; repeating the action without the id check fails -DENY-SWITCH; each restored passes.
- **AC15 [R13; C58; C59; C60; C69].** SEC-927-SRV-REAUTH-ALLOW and -DENY pass on the real `initiateEmailChange` and `deleteOwnAccount` with the token claims an `id_token` session carries (C59, C60): a Google-only account is let through with `oauth` 1 minute old and refused with `oauth` 11 minutes old, with `password` only, and with no `amr`; Task 923's `reauth.security.test.ts` (C69) passes unchanged.
- **AC16 [R15; C86; C87; C88; C95].** `node docs/sessions/evidence/task927/review-1/alert-long-email.mjs storybook-static` (without `FIX`) on a fresh build reports `msgRight` at most `alertRight` at 320, 390 and 640; the GR-12 census of the red alert shows the same look as before in the sheet, the slot Stories and the dialog; `Mantine/Primitives/Alert` `Default` renders unchanged at 390 and 1440.
- **AC13 [R1; R2; R3; R4; R5; R8; R9; R10; R11; R13; R14; R15; C92; C93; C94; D6].** `npx tsc --noEmit`, `npm run lint`, `npm run check:i18n`, the targeted Vitest files, the full unit run compared with a base run taken before the first write (only failures already present at base, each listed), `cli.mjs verify` on the contract, and `npm run build` all exit as stated in the report. Amendment 3: the handoff sets the contract to stage `implemented` with `docs/sessions/evidence/task927/security/report.json` and runs `cli.mjs verify` (today `planned`, C93, so verify refuses it, C94). The build fails today on Task 923's `updateListing.ts` hunk (C92); the `.next/static` secret scan runs after 923 fixes it.

## 6. Flows

**Positive.** (1) A returning visitor opens the sheet, clicks Google's button, picks an account, the sheet closes and the page refreshes
signed in. (2) A gated route stored `/en/favorites?tab=2`; after Google sign-in the visitor lands there. (3) A first-time Google visitor
gets a profile row and a session at once.

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Validation | Yes | R3 callback, `sanitizeReturnTo` | empty credential ignored; foreign destination refused | SEC-927-FE-DENY-REDIRECT, -REPLAY |
| Authorization / session | Yes | Supabase Auth, `requireViewer` | banned → wrong-credentials text; forged token → no session; no-access profile → guest | SEC-927-FE-DENY-BANNED, SEC-927-PRV-DENY, SEC-927-SRV-DENY |
| Offline / network | Yes | R2 loader | script error or timeout → alert, e-mail sign-in still works | SEC-927-FE-ERR-* |
| Concurrent writer | Yes | R3 pending guard | a second credential during a pending one is ignored | SEC-927-FE-DENY-REPLAY |
| Re-confirmation (profile) | Yes | R13 handler, server rule C58 | same account → action repeated once; other account → refused before Supabase; switched session → signed out, nothing repeated; failure → error, nothing repeated | SEC-927-FE-REAUTH-*, SEC-927-SRV-REAUTH-* |

## 7. Canonical decision, references and proof

Semantic queries "Google sign-in", "third-party auth widget", "loading indicator in a form", "form error alert". Candidates: today's
Mantine `Button` (C7, replaced under D2), `CaptchaWidget` (a third-party iframe in the same sheet; its Story is the AuthSheet `Captcha`
export, accepted in the archive), the sheet's red `Alert` (C9). Decisions: **CREATE** `GoogleSignInSlot` (no candidate hosts a
third-party button with these three states), composed of Mantine `Center`, `Loader`, `Alert`; **REUSE** the error-alert look (C38);
the Google button's own look is Google's (D2, dated owner exception for that one element); new hardcoded visual values: none.

`GR-12 ELEMENT PARITY — sign-in error alert: Stories compared 3 (census docs/sessions/evidence/task927/design/gr12-auth-slot-summary.txt); meanings 1; meanings with more than one look: NONE (owner decisions: none); hardcode in changed files and their Stories: NONE.`
`GR-12 ELEMENT PARITY — Google sign-in control: Stories compared 2 (census docs/sessions/evidence/task927/design/gr12-auth-slot-summary.txt); meanings 1; meanings with more than one look: NONE — it is replaced by Google's rendered button (owner decisions: D2); hardcode in changed files and their Stories: NONE.`
`GR-7 REFERENCE RESEARCH — moment: task design; role: Opus; task: 927; subject: where a sign-in form puts Google sign-in; references: Lahomes, Kamr, Omah, TailAdmin; library: docs/research/references/2026-10-04; live-checked pages: Lahomes auth-signin.html, Kamr /login, Omah pages/login.html, TailAdmin /signin (HTML; its 390 capture stalled on the preloader, UNVERIFIED, not relied on); inspected in depth: each form at 390 and 1440; workflow states operated: none submitted; options across references: Google above the form (TailAdmin), under the primary button after a divider (Lahomes, C51), none (Omah, Kamr); chosen 2026 best practice: keep the current order — primary e-mail sign-in, divider, Google's own full-width button — evidence docs/sessions/evidence/task927/design/gr7/gr7-notes.md.`

`GR-12 ELEMENT PARITY — Google re-confirmation control (Amendment 2): Stories compared 1 (Modal DeleteConfirmPassword, C67); meanings 1; meanings with more than one look: NONE — the Mantine button of C66 and of the profile tab (C61) is replaced by the same Google slot as the sign-in sheet (owner decisions: D2, D9); hardcode in changed files and their Stories: NONE.`

Rhythm token: the login form Stack `gap="md"` (`src/modules/auth/components/AuthSheet.tsx:106`); the dialog's Google section keeps its
`Stack gap="sm"` (C66). Storybook proof: direct Story `GoogleSignInSlot` (`Loading`, `Unavailable`, `UnavailableReauth`); composition
proof AuthSheet `Login` and Modal `DeleteConfirmPassword`. The profile tab has no Story (legacy surface, unchanged around the slot);
its proof is SEC-927-FE-REAUTH-* and AC12. `OWNER VISUAL QA REQUIRED`: `GoogleSignInSlot` × {`Loading`, `Unavailable`,
`UnavailableReauth`}, AuthSheet `Login` and Modal `DeleteConfirmPassword` (Google section open) × {sq, en, uk, it} × {320, 390, 639,
640, 1440}.

## 8. QA profile and verification

Q4. Before the first write: the base unit run (AC13), SEC-927-DB-ALLOW (R6), `node scripts/workflow-gates/cli.mjs receipt --contract
tasks/Sprints/Sprint_91_kickoff_prompt_Task_927_Google_Sign_In_Shows_Lero_Al.security.json`, and the receipts of
`shared/enforcement-model.md` with this kickoff's values. Then the commands of AC1–AC13; integration cases with
`$env:SECURITY_TEST_TARGET='development'` and `$env:SECURITY_TEST_PROJECT_REF` set, through `vitest.integration.config.ts` (C53). Each
transcript under `docs/sessions/evidence/task927/`.

## 9. Completion report

Per requirement: changed files, evidence path, status; every contract case with its result; the sensitivity diffs and failed-assertion
output; the base and final unit totals; and one of `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`.

## 10. Owner actions (outside the code)

1. Google Auth Platform → Clients → the Web client of `NEXT_PUBLIC_GOOGLE_CLIENT_ID` → Authorized JavaScript origins:
   `https://lero.al`, `https://www.lero.al` if it is served, `http://localhost`, `http://localhost:3000` (C27, C32). Vercel preview
   URLs are not covered; each would need its own origin.
2. Google Auth Platform → Branding: app name `Lero.al`, logo, home page and authorized domain `lero.al` (D7).
3. Supabase Dashboard → Authentication → Providers → Google: enabled; the web client ID first in Client IDs (C26); the nonce check on
   (C25).
4. Vercel: redeploy after the variable was added (a `NEXT_PUBLIC_` value is built into the client bundle).

## 11. Amendment 1 (Opus, 2026-10-20)

Raised by the executor during implementation: Task 923 R80 added a second `signInWithOAuth` caller after this kickoff's design grep,
the profile tab's re-confirmation before an e-mail change or an account deletion (C55, C56, C57). Removing the wrapper breaks `tsc`
and the build. Changed: the wrapper stays (requirement R1 [C55; C56; C57]), the acceptance of the code search is limited to the
sign-in sheet (AC1 [R1; C55; C56]), and the wrapper's existing tests keep their assertions (requirement R10 [C55; C56]). The profile
re-confirmation through GIS, with its recent-sign-in rule, is reserved as Task 928 (Sprint 91). Work already in the tree that asserts
the wrapper is gone (for example in `browserAuth.security.test.ts`) is reverted to the assertions above. **Superseded by Amendment 2
(§12) on the same day; nothing of Amendment 1 is executed.**

## 12. Amendment 2 (Opus, 2026-10-20)

The owner asked why the wrapper should stay when the system uses another method (D9) and approved moving the profile tab in this task
(D10). The premise of Amendment 1 was wrong: the server's recent-sign-in rule reads the method `oauth` from the session token (C58),
and Supabase writes exactly that method for an `id_token` sign-in (C59, C60), so no server design is needed. Changed: R1 removes
`signInWithOAuth`; R3 adds `purpose` and `loginHint`; R4 the re-confirmation unavailable text; R8 four keys rewritten or added and one
removed; R9 the `UnavailableReauth` export; R10 the profile tab's tests; new R13 (profile tab) and R14 (deletion dialog); AC1, AC10,
AC12 and AC13 widened; new AC14 and AC15; six security cases added. Task 928 is withdrawn and its number retired unused. Work
already in the tree that removed the wrapper and its callers in the sign-in sheet stands; nothing is restored.

## 13. Amendment 3 (Opus review 1, 2026-10-20)

Review 1 returned `NEEDS REVISION` (record `docs/sessions/evidence/task927/review-1/review.md`). The implementation is kept;
the executor changes only what follows. (1) R4: the slot's root carries no gap, so the slot is exactly as tall as its
loader, alert or host (C75, C76, C77); the execution probe could not see this (C78). (2) R13 (f): the profile tab mounts at
most one Google button, because GIS keeps only the last configuration (C79, C80, C81); new case SEC-927-FE-REAUTH-ONE-CONFIG.
(3) R9: a registry row for `GoogleSignInButton.tsx`, which the manifest already enrols (C82, C83, C84). (4) New R15 / AC16:
the canonical Alert's message wraps any token (C85–C88, C95), which also answers the executor's ellipsis question. (5) AC13:
the handoff sets the contract to `implemented` with its report and runs `cli.mjs verify` (C93, C94). (6) Follow-up, same
day, from the now-rendering `Login` entry: R2 loads the library with `?hl=<locale>` (C96, C97, C98), so Google's own text and
accessible name follow the page's language; AC5 adds its proof.

Not this task's to fix, and blocking its proof at review 1: every AuthSheet Story failed in Storybook because Task 923's
`recovery.ts` imported `next/server` statically (C89; Storybook stubs only `next/headers`, C91), and `npm run build` failed
on Task 923's `updateListing.ts` hunk (C92). Task 923 has since loaded `next/server` lazily (C90, C99) and changed that
hunk; the executor re-runs the Login proof and `npm run build` (with the `.next/static` scan) on the current tree.
Approval also still waits for 923's census gate (C43).

## 14. Readiness re-check of Amendment 3 (Opus, Task 923 Review 43, 2026-10-23)

Task 923's next step, its R83, needs Amendment 3 in the working tree, so Opus re-checked this route on the current tree.
The record is `docs/sessions/evidence/task927/readiness-a3/`.
- **What changed in this kickoff.** Eight ledger rows were re-pointed, because Task 923's uncommitted code and the owner's
  rule rework moved their lines: C42, C43, C52, C68, C71, C80, C81 and C88 (`ra3-02-refresh.txt`).
  - Each now cites a copy of its current line in `ra3-02-lines.txt`. The claims are unchanged.
  - C43's literal takes the owner's new words (`a consuming visible task`). Its meaning is unchanged: approval still waits for
    923's census gate.
- **No requirement, AC or case changes.**
- **What is in the tree.** None of the six changes of §13 is in it yet:
  - the slot's root still has `gap="md"`;
  - both Google buttons of the profile tab can mount;
  - the registry has no `GoogleSignInButton` row;
  - the Alert message has no `overflowWrap: 'anywhere'`;
  - the library URL has no `hl`;
  - the contract is `planned`.

  This task's own files are unchanged since 2026-10-20.
- **What Task 923 left in shared files.** The scope files that Task 923's contract also holds carry its uncommitted lines.
  They are not this task's: the messages, `ProfileTab.tsx`, the registries, `AuthSheet.tsx`, `MantineDeleteConfirmModal.tsx`
  and `Modal.stories.tsx` (`ra3-01-scope.txt`).
  - The executor records the sha256 of each file before its first edit.
  - The executor changes only the lines §13 names.
- **The route.** Sonnet executes §13 (1)–(6) in one fresh session.
  - Root `C:\Claude_Code_Projects\lero-al`; only this contract, now `ready`.
  - The reads, UI receipts and `cli.mjs receipt` follow §1 and the Security test contract.
  - The handoff of AC13 ends the session.

## 15. Owner visual QA and Amendment 4 (Opus, Task 923 Review 46 follow-up, 2026-10-23)

**The owner's visual QA, 2026-10-23.** The owner checked the §7 matrix in Storybook:
- **`GoogleSignInSlot`.** The owner saw only the error alert and did not know what to check. By design, the Story has no `ready` export (R9: Google draws that state). Its three exports are a centred loader and two red alerts. Opus's QA list had not said so. After this amendment the owner re-checks them with the list in §15.3.
- **AuthSheet `Login`.** The owner accepted everything except Google's button, which "does not stretch".
  - Opus measured it. The button fills the form at every width except just below 640 px (C100). There the full-screen sheet's form is wider than Google's own 400 px limit (C102, C103).
  - At those widths the button also sits at the form's left edge (C101), because its host is full-width (C104).
  - The owner decided (D11): where Google's limit applies, the button is centred in the form.
- **Modal `DeleteConfirmPassword`.** The owner reported: "The Story has no Google section." It has one, but all its sections share one caption (C105). That section also shows only Google's unavailable state (C106).

**Ledger changes.** Two rows described the tree before Amendment 3 and now fail the evidence check (review 2, N2). They now cite the tree after it, as copied to `amendment-4/a4-01-lines.txt`:
- C76 cites the slot's `Box` root;
- C93 cites the `implemented` stage.

The mobile record's range line now states Google's limit and D11. This amendment sets the contract back to `planned` until its handoff, and adds the census registry to its scope.

### 15.1 Requirements

| ID | Requirement | Priority | AC |
|---|---|---|---|
| R16 [C100; C101; C102; C103; C104; D2; D11] | **Where Google's limit makes its button narrower than the form, the button is centred.**<br>(a) `GoogleSignInSlot.tsx` exports `GOOGLE_BUTTON_MAX_WIDTH = 400`, with the GIS reference comment of C102. The host `Box` keeps `w="100%"` and gains `maw={GOOGLE_BUTTON_MAX_WIDTH}`. It stays inside the existing `Center`. The host is then never wider than Google's button, and the `Center` centres it.<br>(b) `GoogleSignInButton.tsx` imports that constant instead of declaring its own. Its `Math.min` stays.<br>Nothing else in either file changes. The value is Google's documented limit, not a design value. D2 is the dated exception for this one element, and D11 decides where it is placed. | P2 | AC17, AC19 |
| R17 [C105; C106; C107; D2] | **The deletion Story names each of its states and includes Google's real button.**<br>(a) In `Modal.stories.tsx`, each section of `DeleteConfirmPassword` gets its own caption, through four new `storybook.mantine` keys in sq, en, uk and it (the texts below):<br>- `ModalDeleteConfirmPasswordSection`: `modal_caption_delete_password`;<br>- `ModalDeleteConfirmGoogleSection`: `modal_caption_delete_google_unavailable`;<br>- `ModalDeleteConfirmPasswordErrorSection`: `modal_caption_delete_password_error`;<br>- the new section of (b): `modal_caption_delete_google`.<br>The key `modal_caption_delete` stays, with its other uses in `Modal.stories.tsx`.<br>(b) A new section, `ModalDeleteConfirmGoogleReadySection`, is rendered fourth, after the three existing sections. It copies `ModalDeleteConfirmGoogleSection` with `clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}`, as `AuthSheet.tsx` does. Google then draws its own button in the dialog. The three existing sections keep their order and props.<br>(c) `scripts/rendered-interaction-states.json` gains the row `mantine-primitives-modal--delete-confirm-password~delete-google-ready`. It copies the `~delete-google` row (C107). Its `open.selector` and `trigger` both name the fourth section: `:scope > div:nth-child(3) > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div:nth-child(1) > div:nth-child(4) > div:nth-child(2) > button:nth-child(1)`. It adds the three fields of the two AuthSheet `Login` rows, unchanged:<br>- `"exemptTargets": ".nsm7Bb-HzV7m-LgbsSe"`;<br>- `"exemptText": ".nsm7Bb-HzV7m-LgbsSe"`;<br>- their `ownerDecision` text (owner D84 of Task 923).<br>No other row changes.<br>(d) The scope gains `scripts/rendered-interaction-states.json`. | P2 | AC18, AC19 |

**Texts of R17 (a).**

| Key | en | sq | uk | it |
|---|---|---|---|---|
| `modal_caption_delete_password` | Deletion confirmed with the current password — open it with the button. The red primary stays disabled while the field is empty. | Fshirje e konfirmuar me fjalëkalimin aktual — hapeni me butonin. Butoni kryesor i kuq mbetet joaktiv sa kohë fusha është bosh. | Видалення з підтвердженням поточним паролем — відкрийте кнопкою. Червона головна кнопка неактивна, поки поле порожнє. | Eliminazione confermata con la password attuale — aprila con il pulsante. Il pulsante principale rosso resta disattivato finché il campo è vuoto. |
| `modal_caption_delete_google` | Deletion confirmed with Google — open it with the button. Google draws its own button in the dialog. | Fshirje e konfirmuar me Google — hapeni me butonin. Google vizaton butonin e vet në dritare. | Видалення з підтвердженням через Google — відкрийте кнопкою. Google сам малює свою кнопку у вікні. | Eliminazione confermata con Google — aprila con il pulsante. Google disegna il proprio pulsante nella finestra. |
| `modal_caption_delete_google_unavailable` | Deletion confirmed with Google when Google cannot be reached — open it with the button. The dialog shows the red error alert. | Fshirje e konfirmuar me Google kur Google nuk arrihet — hapeni me butonin. Dritarja tregon njoftimin e kuq të gabimit. | Видалення з підтвердженням через Google, коли Google недоступний — відкрийте кнопкою. Вікно показує червоне повідомлення про помилку. | Eliminazione confermata con Google quando Google non è raggiungibile — aprila con il pulsante. La finestra mostra l'avviso rosso di errore. |
| `modal_caption_delete_password_error` | Deletion with a wrong password — open it with the button. The field shows its own error. | Fshirje me fjalëkalim të gabuar — hapeni me butonin. Fusha tregon gabimin e vet. | Видалення з неправильним паролем — відкрийте кнопкою. Поле показує власну помилку. | Eliminazione con una password errata — aprila con il pulsante. Il campo mostra il proprio errore. |

### 15.2 Acceptance criteria

All evidence goes in `docs/sessions/evidence/task927/a4/`. Each file records platform, Node, cwd, command, output and exit code. The first file, `a4-00`, holds the sha256 of every path before its first edit.

- **AC17 [R16; C100; C101; C102; C103; C104; D2; D11].** Google's button is centred.
  - `a4-03`: after a fresh `npm run build-storybook`, `node docs/sessions/evidence/task927/amendment-4/a4-02-centre-probe.mjs both` prints `Google button not centred: 0` over 64 cells and exits 0.
    - At 480, 560 and 639 px, the login button is 400 px wide, with equal gaps on both sides.
    - At 320 and 390 px, it fills the form.
  - `a4-05`: break and restore.
    - Remove `maw` from the host and rebuild. The probe of `a4-03` then reports `NOT centred` at 480 px.
    - Restore `maw`. The file's sha256 then equals its after-edit hash.
- **AC18 [R17; C105; C106; C107].** The deletion Story names its states and shows Google's real button.
  - `a4-02`: `npm run check:i18n` and `npm run check:rendered-state-census:verify` exit 0.
  - `a4-04`: on the build of `a4-03`, this command exits 0: `node scripts/check-rendered-state-census.mjs --stories patterns-mantine-authsheet--login,patterns-mantine-authsheet--login-validation-error,patterns-mantine-googlesigninslot--loading,patterns-mantine-googlesigninslot--unavailable,patterns-mantine-googlesigninslot--unavailable-reauth,mantine-primitives-modal--delete-confirm-password`. Its summary counts excused Google elements in three rows only: the two Login rows and the new `~delete-google-ready` row.
  - In every cell, the probe of `a4-03` finds Google's button in the dialog of the fourth section.
- **AC19 [R16; R17; D6].** Nothing regresses, and the handoff is complete.
  - `a4-01`: the twelve files of the `targeted` list in `docs/sessions/evidence/task927/review-2/rv2-00-run.cjs` pass. `AuthSheet.test.tsx` is among them.
  - `a4-06`: each of these exits 0:
    - `npm run typecheck`;
    - `npx eslint . --quiet`;
    - `npm run check:ui-contract:verify`;
    - `node scripts/check-mobile-adaptation-contract.mjs --files`, given this kickoff and the three changed `.tsx` files of R16 and R17.
  - `a4-07`: the full `npx vitest run --reporter=json` shows no new failing ID, compared with `docs/sessions/evidence/task923/r32-03d-failing-ids.txt` through `docs/sessions/evidence/task923/r34-03c-compare.mjs`. Then `npm run build` exits 0.
  - **Handoff (AC13).**
    - The contract goes to `implemented` with its report, and `cli.mjs verify` runs.
    - The report is headed "Task 927 Amendment 4 executor report". It goes in the session record `docs/sessions/2026-10-10-task923-rendered-state-census.md`.
    - It lists every changed path with its sha256 before and after, and every deviation.
    - It ends with `PARTIALLY IMPLEMENTED`, because the owner's QA and AC12 remain.

### 15.3 Execution preconditions

- **Root and contract.** Work in root `C:\Claude_Code_Projects\lero-al`, under this contract only, while it is `ready`.
- **Reads before the first write.** In that session, read:
  - §1, §7, §13 and this section;
  - rows C100–C107, D2 and D11;
  - the slot, its container and `Modal.stories.tsx`;
  - the registry row of C107;
  - the probe `amendment-4/a4-02-centre-probe.mjs`.
- **UI receipts.** Give them as §7 sets out:
  - canonical owner `GoogleSignInSlot.tsx`;
  - token owner `src/design-system/mantine/theme.ts`;
  - direct Story `GoogleSignInSlot.stories.tsx`;
  - composition AuthSheet `Login` and Modal `DeleteConfirmPassword`.

  Then run `cli.mjs receipt`.
- **Shared files.** The messages, the registry and `Modal.stories.tsx` carry Task 923's uncommitted lines. Change only the lines this section names.
- **Before `npm run build-storybook` and `npm run build`**, the owner stops `npm run dev` if it is running.
- **No commit, no SQL and no database change.**

**Order of work.**
1. The owner commits this amendment.
2. Sonnet executes R16 and R17.
3. Opus reviews them.
4. The owner re-checks:
   - `GoogleSignInSlot`: the loader is centred, both alerts are red, and their text wraps at 320;
   - AuthSheet `Login` at 480–639 px;
   - each of the four captioned sections of `DeleteConfirmPassword`.
5. The owner runs the local part of AC12.

Task 923's order then continues: the deletion design's apply, the final review, the one push, AC12 on production, and v8b.

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

## 17. Review 5 and Amendment 6 (Opus, 2026-10-25): the owner's checks pass; F2, the masked demo e-mail in `uk`

**Review 5.** The full record is the section "Task 927 Review 5" of `docs/sessions/2026-10-10-task923-rendered-state-census.md`.
- The owner's native checks of 16.2 on `http://localhost:3000` (translated): Google sign-in works; Welcome back shows; "Forget this account" returns to the start view of the sign-in sheet; "all OK".
- Still to confirm: One Tap on the home page and closing it; "More sign-in options"; and that deleting a throw-away Google account leaves no Welcome back.
- **F2 (P3; implementation, Amendment 5 deviation 2).** The `uk` masked demo e-mail is in Cyrillic (C167), against R27 (C168): an address is never translated.
  - Review 4 added the gate exception that makes R27's value pass (C169, C170).
  - The two Cyrillic demo names stay, as accepted in Review 4.

### 17.1 Requirements

| ID | Requirement | Priority | AC |
|---|---|---|---|
| R29 [C167; C168; C169; C170; C171; C172] | **The masked demo e-mail as R27 gives it (F2).**<br>(a) `messages/uk.json`: `storybook.mantine.google_welcome_demo_email` becomes `ar•••••@example.com`. Nothing else in the file changes.<br>(b) `scripts/__tests__/check-stories.test.ts`, inside `describe('Check 8: uk.json Latin-only storybook values'` (C171), after its last test, with that block's helpers:<br>- `it('GOOD — a masked e-mail address in uk passes (Task 927 R29)'`: the `uk` values `ar•••••@example.com` and `a•••••@example.com` give no `uk-latin-only` violation.<br>- `it('BAD — a masked value that is not an address still triggers uk-latin-only (Task 927 R29)'`: each of `Arta•••••` and `arta•••••@` gives a `uk-latin-only` violation.<br>(c) Nothing else changes. `scripts/check-stories.mjs` is Opus's and is not edited. | P3 | AC28 |

### 17.2 Acceptance criteria

- **AC28 [R29].** Evidence in `docs/sessions/evidence/task927/a6/`, each file with platform, Node, cwd, command, output and exit code:
  - `a6-00`: the sha256 of the 2 paths before the first edit, written first; `a6-00b` after the last.
  - `a6-01`: `npx vitest run --reporter=verbose scripts/__tests__/check-stories.test.ts` exits 0, with the two new tests listed.
  - `a6-02`: `npm run check:stories` and `npm run check:i18n` exit 0.
  - `a6-03`:
    - First the two read-only commands of `docs/sessions/evidence/task923/review-50/rv50-06-dev-server.txt`. Both counts 0: continue. Otherwise ask the owner and wait.
    - Then `npm run build-storybook`.
    - Then `node scripts/check-rendered-state-census.mjs --stories` for `patterns-mantine-googlewelcomeback--initials`, `patterns-mantine-googlewelcomeback--long-name` and `patterns-mantine-authsheet--welcome-back`. Each exits 0.
  - `a6-04`: `node scripts/workflow-gates/cli.mjs plan --contract tasks/Sprints/Sprint_91_kickoff_prompt_Task_927_Google_Sign_In_Shows_Lero_Al.security.json` exits 0.
  - **Report.** The section "Task 927 Amendment 6 executor report" in the session record, with each path's sha256 before and after, every deviation and each evidence file. It ends with `PARTIALLY IMPLEMENTED`.

### 17.3 Execution preconditions

- **Root and contract.** Root `C:\Claude_Code_Projects\lero-al`. This contract only, `ready`.
- **Reads before the first write.** Read this section, rows C167–C172, and the two paths. Then run `cli.mjs receipt` for this contract.
- **Shared file.** `messages/uk.json` carries other tasks' uncommitted lines. Change only the one value.
- **No commit, no SQL and no database change.**

**Order of work (replaces 16.4's):**
1. The owner commits.
2. Sonnet executes R29.
3. Opus reviews it.
4. The owner's remaining checks of 16.2 (above).
5. The local part of AC12, and Task 923's final review and push.

## 18. Review 7 and Amendment 7 (Opus, 2026-10-25): the owner's checks; F4, the typed DELETE for an account with no password

**Review 7.** The full record is the section "Task 927 Review 7" of `docs/sessions/2026-10-10-task923-rendered-state-census.md`.
- The owner's checks of 16.2 on `http://localhost:3000` (translated):
  - One Tap appears and closes;
  - "More sign-in options" is "all OK";
  - after a Google account's deletion, Welcome back does not appear.
- **F3** (vertical spacing lost after a sign-in, now and then, on `localhost`) was not reproduced in 21 probe sign-ins. The owner parked it until it is seen again, so it is not in this route.
- **F4 (owner D17).** The profile's deletion of an account with no password needs nothing typed:
  - no password is sent (C173), and the dialog has no password field (C174);
  - the Google section appears only after the server's `reauth_required` (C175, C176).

  So right after a Google sign-in, one press deletes the account. The canonical dialog already has the typed confirmation (C177–C182), and its label exists in all four locales (C183). Task 923's D54 (C190) still governs an account with a password. The correction comes before the one push (D18).

### 18.1 Requirements

| ID | Requirement | Priority | AC |
|---|---|---|---|
| R30 [C173; C174; C175; C176; C177; C178; C179; C180; C181; C182; C183; C190; D17; D18] | **The typed DELETE for an account with no password (F4).**<br>(a) `src/modules/cabinet/components/ProfileTab.tsx`: the deletion dialog's `MantineDeleteConfirmModal` gets `typedConfirm={reauthMethod === 'google' ? { word: DELETE_CONFIRM_WORD, label: t('delete_account_type_confirm') } : undefined}`. `DELETE_CONFIRM_WORD` is imported from `@/design-system/mantine/patterns/MantineDeleteConfirmModal`. The comment above the dialog says that an account with a password gives its password (Task 923 D54) and an account with no password types DELETE (Task 927 D17).<br>(b) Unchanged: the call `deleteOwnAccount({})` for an account with no password (C173), `passwordConfirm` (C174), `googleConfirm` and the `reauth_required` answer that shows it (C175, C176), the server actions and their recent-sign-in rule, `MantineDeleteConfirmModal.tsx`, and the messages.<br>(c) The result, from the canonical dialog (C177–C180):<br>- for an account with no password, the field is drawn after the Google section, whenever that section is shown;<br>- the red primary stays disabled until the field holds DELETE, trimmed, in any case;<br>- once it does, pressing the primary runs today's deletion;<br>- when the server asks for Google, the Google section appears above the field, and its confirmation repeats the deletion as today. | P2 | AC29 |
| R31 [C184; C185; C192; D17] | **Tests.**<br>(a) `ProfileTab.deletePassword.security.test.tsx`, the case `an account with no password sends none, …` (C184):<br>- before anything is typed, the dialog has a field labelled `t.delete_account_type_confirm` and the primary is disabled;<br>- after `delete` is typed into it, the primary is enabled;<br>- the rest of the case is unchanged.<br>This is the only expectation that changes (D17).<br>(b) A new case in the same file, `it('[SEC-927-FE-DELETE-TYPED] an account with no password deletes only after typing DELETE; an account with a password has no typed field'`:<br>- **Google account.** For each of the empty field, `DELET` and `REMOVE`: the primary is disabled; pressing it calls neither `deleteOwnAccount` nor `signOut` and shows no success toast. Then ` delete ` (with spaces) enables the primary, and pressing it calls `deleteOwnAccount` once, with `{}`.<br>- **Password account.** The dialog has no field labelled `t.delete_account_type_confirm`.<br>(c) `ProfileTab.googleReauth.security.test.tsx` (C185): the helper `askDeletion` and the case `SEC-927-FE-REAUTH-ONE-CONFIG` type `DELETE` into the dialog's field labelled `t.delete_account_type_confirm` before pressing the primary. No other line of that file changes. | P2 | AC29 |
| R32 [C186; C187; C188; C189; D17] | **Story.** `src/stories/mantine/primitives/Modal.stories.tsx`:<br>- `ModalDeleteConfirmGoogleSection` and `ModalDeleteConfirmGoogleReadySection` also pass `typedConfirm={{ word: DELETE_CONFIRM_WORD, label: storyT(locale, 'cabinet.delete_account_type_confirm') }}` (the import exists, C187);<br>- the `DeleteConfirmPassword` comment (C186) says the account with no password types DELETE (Task 927 D17).<br>No new export and no registry change: both census rows (C188) open from triggers outside the dialog. | P2 | AC30 |

### 18.2 Acceptance criteria

Evidence goes in `docs/sessions/evidence/task927/a7/`. Each file records platform, Node, cwd, command, output and exit code.
- **AC29 [R30; R31].**
  - `a7-00`: the sha256 of the four paths of C191, written before the first edit. `a7-99`: the same after the last.
  - `a7-01`: `npx vitest run --reporter=verbose src/modules/cabinet/components/__tests__/ProfileTab.deletePassword.security.test.tsx src/modules/cabinet/components/__tests__/ProfileTab.googleReauth.security.test.tsx src/design-system/mantine/patterns/__tests__/MantineDeleteConfirmModal.smoke.test.tsx` exits 0. It shows 3 files and 27 tests (C192's 26 plus `SEC-927-FE-DELETE-TYPED`).
  - `a7-02`: `npx vitest run --reporter=verbose src/modules/cabinet/actions/__tests__/reauthIdToken.security.test.ts` exits 0, with 2 tests passed (C193, unchanged).
  - `a7-03`, sensitivity:
    1. Remove the `typedConfirm` prop from `ProfileTab.tsx`. `SEC-927-FE-DELETE-TYPED` then fails on its disabled-primary assertion; record the diff and the failure.
    2. Restore the line. The case passes, and the file's sha256 equals its `a7-99` value.
- **AC30 [R32].**
  - `a7-04`: these exit 0:
    - `npm run check:stories`;
    - `npm run check:i18n`;
    - `npm run check:ui-contract:verify`;
    - `node scripts/check-mobile-adaptation-contract.mjs --files` with the four paths.
  - `a7-05`:
    1. First the two read-only commands of `docs/sessions/evidence/task923/review-50/rv50-06-dev-server.txt`. Both counts 0: continue. Otherwise ask the owner to stop `npm run dev` and wait.
    2. Then `npm run build-storybook`.
    3. Then `node scripts/check-rendered-state-census.mjs --stories mantine-primitives-modal--delete-confirm-password`: exit 0, 0 failing rows.
  - `a7-06`, a probe by the executor, `a7-06-rhythm.mjs`, on the built Storybook. It opens the two Google sections of `DeleteConfirmPassword` through their census rows' triggers, at 320, 375, 390, 480, 560, 639, 640, 680, 768, 810, 960, 1024, 1200, 1440, 1920 and 2560 × sq, en, uk, it. It checks:
    - every dialog section box has a computed `padding-top` and `padding-bottom` equal to `var(--mantine-spacing-lg)` (GR-3h, the rhythm token of C189);
    - the typed field's label has `scrollWidth <= clientWidth`, no ellipsis and no line clamp (GR-3i);
    - the field follows the Google section in DOM order.
- **AC31 [R30; R31; R32].**
  - `a7-07`: after the dev-server check of `a7-05`, these exit 0:
    - `npm run typecheck`;
    - `npx eslint --quiet` on the four paths;
    - `npm run build`.
  - `a7-08`: `node scripts/workflow-gates/cli.mjs plan --contract tasks/Sprints/Sprint_91_kickoff_prompt_Task_927_Google_Sign_In_Shows_Lero_Al.security.json` exits 0.
  - **Report.** The section "Task 927 Amendment 7 executor report" in the session record lists each path's sha256 before and after, every deviation and each evidence file. It ends with `PARTIALLY IMPLEMENTED`.

**OWNER VISUAL QA REQUIRED (after Opus's review).**
- **Storybook.** Modal `DeleteConfirmPassword`, its two Google sections opened × {sq, en, uk, it} × {320, 390, 639, 640, 1440}. Each shows the Google section, then the field "Type DELETE to confirm", with Delete disabled until DELETE is typed.
- **On `http://localhost:3000`**, with a throw-away Google-only account: Profile → Delete account. The field is there and Delete stays disabled; type `DELETE` and Delete works. With a password account the dialog asks for the password only, as before.

### 18.3 Canonical decision, mobile record and execution preconditions

- **GR-0: REUSE** `MantineDeleteConfirmModal`'s `typedConfirm` (C177–C182). The admin deletion dialog consumes it the same way (C182). No new component, token, Story export or visual value.
- **Reference research (GR-7):** inherited canonical design, under the owner's decision of 2026-10-20. Sources: `src/design-system/mantine/patterns/MantineDeleteConfirmModal.tsx` and the Modal Stories `DeleteConfirmTyped` and `DeleteConfirmPassword`.
- **Mobile.** Inherited from the deletion dialog's record above (the structured `MantineModal` bottom sheet below 640 px). The typed field is one more dialog section.
- **Rhythm.** `MantineDialogSections` `py="lg"` (C189).
- **Root and contract.** Root `C:\Claude_Code_Projects\lero-al`. Use this contract only, while it is `ready`.
- **Reads before the first write:**
  - this section and rows C173–C193;
  - the four paths, and `MantineDeleteConfirmModal.tsx` (read only).

  Then run `cli.mjs receipt` for this contract.
- **UI receipts.** Register each through the PowerShell tool; the helper call is the command's only statement.
  - CanonicalReuse: `GR-0 CANONICAL REUSE PREFLIGHT - request: the typed DELETE confirmation for an account with no password in the profile deletion dialog; semantic queries: typed confirmation, delete confirm word, destructive confirmation field; inspected candidates: src/design-system/mantine/patterns/MantineDeleteConfirmModal.tsx, src/components/admin/AdminUserProfileDialogsView.tsx, src/stories/mantine/primitives/Modal.stories.tsx; decision: REUSE; selected canonical owner: src/design-system/mantine/patterns/MantineDeleteConfirmModal.tsx; Mantine/TailAdmin token path: src/design-system/mantine/theme.ts; new hardcoded visual values: NONE; rationale: the modal typedConfirm prop already draws the labelled field and keeps the red primary disabled until the word is typed, and the admin deletion dialog consumes it the same way.`
  - UiContract: `UI CONTRACT PREFLIGHT COMPLETE - scope: src/modules/cabinet/components/ProfileTab.tsx deletion dialog, src/stories/mantine/primitives/Modal.stories.tsx Google sections of DeleteConfirmPassword; canonical owner: src/design-system/mantine/patterns/MantineDeleteConfirmModal.tsx; token owner: src/design-system/mantine/theme.ts; direct Story: src/stories/mantine/primitives/Modal.stories.tsx.`
  - MobileAdaptation: `MOBILE ADAPTATION PREFLIGHT COMPLETE - surfaces: src/modules/cabinet/components/ProfileTab.tsx deletion dialog of an account with no password, src/design-system/mantine/patterns/MantineDeleteConfirmModal.tsx typed field; component families: overlay-and-disclosure, form-picker-and-choice; pattern IDs: overlay-adaptive, form-stack; standards: w3c-focus-order, w3c-hover-focus, apple-hig-sheets, android-common-layouts, android-adapt-layouts, w3c-labels-instructions, w3c-reflow, apple-hig-layout, android-content-structure; mantine mechanism: responsive-props; mantine owner: src/design-system/mantine/patterns/MantineDeleteConfirmModal.tsx; mobile range: <640px (theme.other.mobileGate / sm); mobile order: consequence text; error alert; Google section when the server asks for it; typed DELETE field; Cancel and Delete; required content: no semantic loss; verification: src/stories/mantine/primitives/Modal.stories.tsx DeleteConfirmPassword across the <640px widths 320, 375, 390, 480, 560, 639 and the 640px transition x sq, en, uk, it.`
  - StorybookProof, before the Story write: `STORYBOOK PROOF PREFLIGHT COMPLETE - direct Story: src/stories/mantine/primitives/Modal.stories.tsx; production component: MantineDeleteConfirmModal, GoogleSignInButton; allowed public states: opened, onClose, title, message, confirmLabel, cancelLabel, onConfirm, googleConfirm, typedConfirm; local presentation: NONE.`
- **Shared files.** `ProfileTab.tsx`, `Modal.stories.tsx` and both test files carry other tasks' uncommitted lines. Change only the lines R30–R32 name.
- **No commit, no SQL and no database change.**

**Order of work (replaces 17.3's):**
1. The owner commits Reviews 6 and 7 and this amendment.
2. Sonnet executes R30–R32.
3. Opus reviews them.
4. The owner's visual QA and the native deletion check above.
5. Task 923's final review with O1, which also covers this task's code. Then the one push. When its deploy is live: the CAPTCHA protection on again, Task 923's §76.2 checks and AC12 on lero.al.

## 19. Review 8 and Amendment 8 (Opus, 2026-10-25): Google's button at the specified height in the Dark theme; the slot keeps its height

**Review 8.** The full record is the section "Task 927 Review 8" of `docs/sessions/2026-10-10-task923-rendered-state-census.md`. R30–R32 are accepted.

**F6 (P2): the open sheet jumps.** The Google slot reserves no height:
- it shows a Loader while Google loads (C202);
- the host is hidden until `ready` (C203), and the button is drawn one effect later (C204).

So the Google section goes 116, 94, 126 px in the open dialog (C205). Google sets the host's height as soon as `renderButton` returns (C201).

**F5 (P3).** A stale comment (C212).

**The button (owner D19–D22).**
- Today the button is outline, at the medium size (C194–C197).
- Google's guidelines give 40 px, the large size (C198, C199). Measured: medium 32 px, large 40 px (C200).
- The owner wants that height (D19) and the Dark theme (D20). The text and the shape stay (D21, C195).
- Google personalizes its large button for a returning person, unless the size is medium or small (C112). The owner accepts the name in the four places where the button meets a returning person (D22, C213). D12 no longer applies to the button (C217).

### 19.1 Requirements

| ID | Requirement | Priority | AC |
|---|---|---|---|
| R33 [C112; C194; C195; C196; C197; C198; C199; C200; C213; C217; D19; D20; D21; D22] | **Google's button: large, Dark.**<br>(a) `src/lib/auth/googleIdentity.ts`: in the button config type, `theme: 'filled_black'` and `size: 'large'` replace the two literals of C196. Its comment (C197) says:<br>- Google's large size is the 40 px height of Google's branding guidelines (Task 927 D19);<br>- `filled_black` is Google's Dark theme (D20);<br>- Google may personalize the large button for a returning person, which D22 allows;<br>- `signin_with` reads "Sign in with Google" (D21).<br>(b) `src/components/auth/GoogleSignInButton.tsx`: `renderButton` gets `theme: 'filled_black'` and `size: 'large'`.<br>(c) Unchanged: `type`, `text`, `shape`, `logo_alignment`, `width` and `locale` (C195); `prompt()` and One Tap. | P2 | AC32 |
| R34 [C200; C201; C202; C203; C204; C205; C206; C207; D19] | **The slot keeps the button's height (F6).**<br>(a) `src/design-system/mantine/theme.ts`: a new `theme.other.boxSize` key `googleButton`, value `'2.5rem'`, added to both the `boxSize` union and its values (C207). Its comment: "40px — Google's large Sign in with Google button (Task 927 D19; Google's branding guidelines; measured in review-8/rv8-01)".<br>(b) `src/components/auth/GoogleSignInSlot.tsx`, with `useMantineTheme()`:<br>- the loading `Center` gets `h={theme.other.boxSize.googleButton}`;<br>- the host `Box` gets `mih={theme.other.boxSize.googleButton}`.<br>(c) So loading, the not-yet-drawn `ready` frame and the drawn button all hold 40 px, and the open sheet does not move when Google answers. A personalized button taller than 40 px still fits (min-height). `unavailable` still shows its alert.<br>(d) The slot's comment (C206) says that loading and ready hold the button's height from `boxSize.googleButton`.<br>(e) No other change: `GoogleSignInButton`'s effects, `GOOGLE_BUTTON_MAX_WIDTH`, the alert, and the consumers. | P2 | AC33 |
| R35 [C208; C209; C215; D19; D20] | **Tests.**<br>(a) `AuthSheet.google.security.test.tsx`, the options test (C208): the expected `theme` is `'filled_black'` and `size` is `'large'`. The other keys are unchanged.<br>(b) `Header.google.security.test.tsx`, SEC-927-FE-REMEMBER-ALLOW (C209): the expected `size` is `'large'`.<br>No other assertion changes. | P2 | AC32 |
| R36 [C210; C211; D19; D20; D22] | **Census rows.** `scripts/rendered-interaction-states.json`, in each of the four rows of C210, the `ownerDecision` text:<br>- replace `is drawn at Google's medium size (Task 927 D14, 2026-10-25: \"Medium, without the name\", lower than the fields)` with `is drawn at Google's large size, 40 px as Google's branding guidelines give, in its Dark theme (Task 927 D19, D20, 2026-10-25), and Google may personalize it for a returning person (D22)`;<br>- the rest of each row is unchanged. | P3 | AC33 |
| R37 [C212; D17] | **Comment (F5).** `src/modules/cabinet/components/ProfileTab.tsx`, the comment of C212 now says: Task 923 R80 and D54 and Task 927 D17. An account with a password is deleted after its current password. An account with none types DELETE in the dialog and, when the server asks, confirms with a recent Google sign-in. Nothing else in the file changes. | P3 | AC34 |

### 19.2 Acceptance criteria

Evidence goes in `docs/sessions/evidence/task927/a8/`. Each file records platform, Node, cwd, command, output and exit code.
- **AC32 [R33; R35].**
  - `a8-00`: the sha256 of the eight paths of C214, written before the first edit. `a8-99`: the same after the last.
  - `a8-01`: `npx vitest run --reporter=verbose src/modules/auth/components/__tests__/AuthSheet.google.security.test.tsx src/components/layout/__tests__/Header.google.security.test.tsx src/modules/cabinet/components/__tests__/ProfileTab.googleReauth.security.test.tsx src/lib/auth/__tests__/googleIdentity.test.ts src/modules/auth/components/__tests__/AuthSheet.test.tsx` exits 0, with 114 passed (C215).
  - `a8-02`, greps of `src/`:
    - `size: 'medium'` and `theme: 'outline'` appear nowhere;
    - `filled_black` appears in `googleIdentity.ts` and `GoogleSignInButton.tsx`.
- **AC33 [R34; R36].**
  - `a8-03`: these exit 0:
    - `npm run check:stories`;
    - `npm run check:i18n`;
    - `npm run check:ui-contract:verify`;
    - `node scripts/check-mobile-adaptation-contract.mjs --files` with the eight paths.

    `npm run check:design-tokens` reports no finding in the eight paths; the findings of C216 stay as they are. A grep of `scripts/rendered-interaction-states.json` finds `Task 927 D14` nowhere and `Task 927 D19` in four rows.
  - `a8-04`:
    1. First the two read-only commands of `docs/sessions/evidence/task923/review-50/rv50-06-dev-server.txt`. Both counts 0: continue. Otherwise ask the owner to stop `npm run dev` and wait.
    2. Then `npm run build-storybook`.
    3. Then `node scripts/check-rendered-state-census.mjs --stories patterns-mantine-authsheet--login,patterns-mantine-authsheet--login-validation-error,patterns-mantine-authsheet--welcome-back,mantine-primitives-modal--delete-confirm-password,patterns-mantine-googlesigninslot--loading`: exit 0, 0 failing rows.
  - `a8-05`, on that build:
    - `node docs/sessions/evidence/task927/jump/jump-probe2.mjs <width> <locale> <delay>` for 320, 390 and 639 × en and uk × 0 and 1500. In every run, the Google section (the middle number of `sections=`) has one height in all its `google=loader`, `google=empty` and `google=button` frames.
    - Then the existing `docs/sessions/evidence/task927/a5/a5-12-rhythm.mjs` (GR-3h, GR-3i, and one height of Google's button in `WelcomeBack`, `Login` and the deletion dialog) and `docs/sessions/evidence/task927/a7/a7-06-rhythm.mjs` (the dialog's `py="lg"` rhythm, C189): 0 cells with a problem.
  - `a8-06`, sensitivity:
    1. Remove the host's `mih` from `GoogleSignInSlot.tsx` and rebuild Storybook. `jump-probe2.mjs 390 en 0` then shows a `google=empty` frame lower than the button frame; record the diff and the output.
    2. Restore the line and rebuild. The probe shows one height, and the file's sha256 equals its `a8-99` value.
- **AC34 [R33; R34; R35; R36; R37].**
  - `a8-07`: after the dev-server check of `a8-04`, these exit 0:
    - `npm run typecheck`;
    - `npx eslint --quiet` on the seven code paths;
    - `npm run build`.
  - `a8-08`: `node scripts/workflow-gates/cli.mjs plan --contract tasks/Sprints/Sprint_91_kickoff_prompt_Task_927_Google_Sign_In_Shows_Lero_Al.security.json` exits 0.
  - **Report.** The section "Task 927 Amendment 8 executor report" in the session record lists each path's sha256 before and after, every deviation and each evidence file. It ends with `PARTIALLY IMPLEMENTED`.

**OWNER VISUAL QA REQUIRED (after Opus's review).**
- **Storybook.** AuthSheet `Login` and `WelcomeBack`, Modal `DeleteConfirmPassword` (its Google ready section opened) and GoogleSignInSlot `Loading` × {sq, en, uk, it} × {320, 390, 639, 640, 1440}. Google's button is dark and 40 px high, and the sheet does not move when it appears.
- **On `http://localhost:3000`:** the sign-in sheet, Welcome back, the profile's e-mail re-confirmation and the deletion dialog. The button is dark and 40 px high. For a returning person Google may show "Continue as …" (D22).

### 19.3 Canonical decision, mobile record and execution preconditions

- **GR-0: EXTEND** `GoogleSignInSlot` with a reserved height from a new `theme.ts` token (C207). The button stays Google's own (D2), with its options per D19–D21.
- **Reference research (GR-7):** Google's branding guidelines. `docs/sessions/evidence/task927/review-8/g-spec-android-web.png` gives the 40 px height, the 20 px logo and the 12/10/12 padding. The measured sizes are in C200.
- **Mobile.** Inherited, unchanged. The slot keeps its place and full width; only its height is held.
- **Rhythm.**
  - The sheet's forms keep `gap="md"` (C144) and the dialog sections keep `py="lg"` (C189). The slot adds no spacing of its own.
  - GR-3h, GR-3i and the one-look check are proved by `a8-05`.
- **Root and contract.** Root `C:\Claude_Code_Projects\lero-al`. Use this contract only, while it is `ready`.
- **Reads before the first write:**
  - this section and rows C194–C217 and D19–D22;
  - the eight paths;
  - `docs/sessions/evidence/task927/jump/jump-probe2.mjs`.

  Then run `cli.mjs receipt` for this contract.
- **UI receipts.** Register each through the PowerShell tool; the helper call is the command's only statement. No Story file changes, so no StorybookProof receipt is needed.
  - CanonicalReuse: `GR-0 CANONICAL REUSE PREFLIGHT - request: Google button at the large size and Dark theme, and a Google slot that keeps its height while Google loads; semantic queries: google sign-in slot, provider button height, loading placeholder height, dimension token; inspected candidates: src/components/auth/GoogleSignInSlot.tsx, src/components/auth/GoogleSignInButton.tsx, src/design-system/mantine/theme.ts, src/stories/patterns/mantine/GoogleSignInSlot.stories.tsx; decision: EXTEND; selected canonical owner: src/components/auth/GoogleSignInSlot.tsx; Mantine/TailAdmin token path: src/design-system/mantine/theme.ts; new hardcoded visual values: NONE; rationale: the slot lacks a reserved height, so it gains one from a new theme.other.boxSize token that matches Google 40px button.`
  - UiContract: `UI CONTRACT PREFLIGHT COMPLETE - scope: src/components/auth/GoogleSignInSlot.tsx, src/components/auth/GoogleSignInButton.tsx, src/lib/auth/googleIdentity.ts, src/design-system/mantine/theme.ts; canonical owner: src/components/auth/GoogleSignInSlot.tsx; token owner: src/design-system/mantine/theme.ts; direct Story: src/stories/patterns/mantine/GoogleSignInSlot.stories.tsx.`
  - MobileAdaptation: `MOBILE ADAPTATION PREFLIGHT COMPLETE - surfaces: src/components/auth/GoogleSignInSlot.tsx loading and ready states, src/modules/auth/components/AuthSheet.tsx login and Welcome back views, src/design-system/mantine/patterns/MantineDeleteConfirmModal.tsx Google section; component families: overlay-and-disclosure, form-picker-and-choice; pattern IDs: overlay-adaptive, form-stack; standards: w3c-focus-order, w3c-hover-focus, apple-hig-sheets, android-common-layouts, android-adapt-layouts, w3c-labels-instructions, w3c-reflow, apple-hig-layout, android-content-structure; mantine mechanism: responsive-props; mantine owner: src/design-system/mantine/patterns/MantineDrawer.tsx; mobile range: <640px (theme.other.mobileGate / sm); mobile order: unchanged, the Google slot keeps its place and holds the button height from loading to ready; required content: no semantic loss; verification: src/stories/patterns/mantine/GoogleSignInSlot.stories.tsx, the AuthSheet Login and WelcomeBack Stories and the Modal DeleteConfirmPassword Story across the <640px widths 320, 375, 390, 480, 560, 639 and the 640px transition x sq, en, uk, it.`
- **Shared files.** `theme.ts`, `ProfileTab.tsx`, the census registry and both test files carry other tasks' uncommitted lines. Change only the lines R33–R37 name.
- **No commit, no SQL and no database change.**

**Order of work (replaces 18.3's):**
1. The owner commits Review 8 and this amendment.
2. Sonnet executes R33–R37.
3. Opus reviews them.
4. The owner's visual QA of 18.2 and 19.2, and the native checks.
5. Task 923's final review with O1, covering this task's code. Then the one push. When its deploy is live: the CAPTCHA protection on again, Task 923's §76.2 checks and AC12 on lero.al.

## 20. Review 9 and Amendment 9 (Opus, 2026-10-25): Google's Light button; the slot holds a fixed height through Google's swap

**Review 9.** The full record is the sections "Task 927 Review 9" and "Task 927 Review 9, continued" of `docs/sessions/2026-10-10-task923-rendered-state-census.md`. Amendment 8 was implemented as routed. The owner returned it:
- **The Dark button's white square** (F8). Google's SDK draws it for `filled_black`. The owner chose Google's own button in the Light theme, logo centred (D24, replacing D20 and D23). Today the button is Dark (C218, C221, C223, C224); the logo stays centred (C219).
- **The jump** (F10).
  - On `localhost`, Google swaps its in-page button for its iframe button. For one frame the host holds both, and the dialog grows from 475 to 515 px (C225).
  - The host's `mih` cannot stop that (C222).
  - With a fixed height, the frame leaves the dialog still (C226). Google's iframe button sits in a 44 px wrapper with negative margins (C227), so the host must not clip.
  - On `127.0.0.1` Google does not swap (C228). The route's probe therefore serves the build on `localhost`; it shows the jump before the change (C229).
- **F7.** A stale docstring (C220).

### 20.1 Requirements

| ID | Requirement | Priority | AC |
|---|---|---|---|
| R38 [C218; C219; C220; C221; D19; D21; D22; D24] | **Google's Light button.**<br>(a) `src/lib/auth/googleIdentity.ts`: the config type's theme literal becomes `'outline'`. Its comment says `outline` is Google's Light theme (Task 927 D24); the rest of the comment is unchanged.<br>(b) `src/components/auth/GoogleSignInButton.tsx`: `renderButton` gets `theme: 'outline'`. The docstring's last sentence (C220) becomes: "The button is Google's large "Sign in with Google" in its Light theme (Task 927 D19, D24); Google may personalize it for a returning person (D22)."<br>(c) Unchanged: `size: 'large'`, `logo_alignment: 'center'` (C219), `text`, `shape`, `type`, `width`, `locale`. | P2 | AC35 |
| R39 [C222; C225; C226; C227; C228; C229; D19] | **The host holds a fixed height (F10).**<br>(a) `src/components/auth/GoogleSignInSlot.tsx`: the host's `mih={theme.other.boxSize.googleButton}` (C222) becomes `h={theme.other.boxSize.googleButton}`.<br>(b) Overflow stays visible: Google's 44 px wrapper, its negative margins and its focus ring are not clipped (C227).<br>(c) The slot's comment says why: Google first draws its in-page button and then swaps in its iframe button, and for one frame both are there. A fixed height keeps the sheet still through that frame (Task 927 Review 9).<br>(d) No other change. | P2 | AC36 |
| R40 [C223; D24] | **Test.** `AuthSheet.google.security.test.tsx`, the options test (C223): the expected `theme` is `'outline'`. No other assertion changes. | P2 | AC35 |
| R41 [C224; D24] | **Census rows.** `scripts/rendered-interaction-states.json`, in each of the four rows of C210, replace `in its Dark theme (Task 927 D19, D20, 2026-10-25)` with `in its Light theme (Task 927 D19, D24, 2026-10-25)`. The rest of each row is unchanged. | P3 | AC36 |

### 20.2 Acceptance criteria

Evidence goes in `docs/sessions/evidence/task927/a9/`. Each file records platform, Node, cwd, command, output and exit code.
- **AC35 [R38; R40].**
  - `a9-00`: the sha256 of the five paths of `review-8/rv8-11-lines.txt` lines 12–16, written before the first edit. `a9-99`: the same after the last.
  - `a9-01`: AC32's `a8-01` command exits 0, with 114 passed.
  - `a9-02`, greps:
    - `filled_black` appears nowhere in `src/`;
    - `theme: 'outline'` appears in `googleIdentity.ts` and `GoogleSignInButton.tsx`;
    - `Task 927 D20` appears nowhere in `scripts/rendered-interaction-states.json`;
    - `in its Light theme (Task 927 D19, D24` appears in four rows.
- **AC36 [R39; R41].**
  - `a9-03`: AC33's `a8-03` gates on the five paths exit 0, and `check:design-tokens` reports no finding in them.
  - `a9-04`: AC33's `a8-04` (the dev-server check, `npm run build-storybook`, the census of the five Stories): exit 0, 0 failing rows.
  - `a9-05`, on that build, `node docs/sessions/evidence/task927/review-8/rv8-07-mobile-jump.mjs <state> <width> <locale>`:
    - for the states `mantine-primitives-modal--delete-confirm-password~delete-google-ready`, `patterns-mantine-authsheet--welcome-back` and `patterns-mantine-authsheet--login`, × 320, 390 and 639 × en and uk, in its default mobile emulation, with no `SB_URL` and no `FIX_HOST` set;
    - in every run, from the first frame whose `btn=` is not `-` to the last frame, `h` has one value. The only exception is Login's captcha alert (a later rise of 70 px, Review 9 F9), which must be reported with its frame;
    - every run ends with `iframes=1` and a `hostKids=1/44` frame, so Google's swap happened.
    - Then `a5-12-rhythm.mjs` and `a7-06-rhythm.mjs` as in `a8-05`: 0 cells with a problem.
  - `a9-06`, sensitivity:
    1. Put `mih` back in place of `h` and rebuild. `rv8-07-mobile-jump.mjs mantine-primitives-modal--delete-confirm-password~delete-google-ready 390 en` then shows `h` rising at the `hostKids=1/82` frame.
    2. Restore and rebuild. The run shows one `h`, and the file's sha256 equals its `a9-99` value.
- **AC37 [R38; R39; R40; R41].**
  - `a9-07`: after the dev-server check, these exit 0:
    - `npm run typecheck`;
    - `npx eslint --quiet` on the four code paths;
    - `npm run build`.
  - `a9-08`: `node scripts/workflow-gates/cli.mjs plan --contract tasks/Sprints/Sprint_91_kickoff_prompt_Task_927_Google_Sign_In_Shows_Lero_Al.security.json` exits 0.
  - **Report.** The section "Task 927 Amendment 9 executor report" in the session record lists each path's sha256 before and after, every deviation and each evidence file. It ends with `PARTIALLY IMPLEMENTED`.

**OWNER VISUAL QA REQUIRED (after Opus's review).**
- **Storybook** (the owner's `npm run storybook`). AuthSheet `Login` and `WelcomeBack`, and Modal `DeleteConfirmPassword` (its Google ready section opened), at mobile widths 320, 390 and 639 and at 1440, in sq, en, uk and it. Expected:
  - Google's button is light, outlined and 40 px high;
  - the sheet or dialog does not move when the button appears.
- **On `http://localhost:3000`.** The same, in the sign-in sheet, Welcome back, the profile's e-mail re-confirmation and the deletion dialog.

### 20.3 Canonical decision, mobile record and execution preconditions

- **GR-0: EXTEND** `GoogleSignInSlot`: its existing token height becomes the host's fixed height. No new token, Story export or visual value.
- **Mobile.** Inherited, unchanged. **Rhythm.** Unchanged (C144, C189); `a9-05` reruns the rhythm probes.
- **Root and contract.** Root `C:\Claude_Code_Projects\lero-al`. Use this contract only, while it is `ready`.
- **Reads before the first write:**
  - this section and rows C218–C229 and D23–D24;
  - the five paths;
  - `docs/sessions/evidence/task927/review-8/rv8-07-mobile-jump.mjs` (read only; it serves `storybook-static` on `localhost`).

  Then run `cli.mjs receipt` for this contract.
- **UI receipts.** Register each through the PowerShell tool; the helper call is the command's only statement.
  - CanonicalReuse: `GR-0 CANONICAL REUSE PREFLIGHT - request: Google button in its Light theme and a Google slot whose height holds while Google swaps its in-page button for its iframe button; semantic queries: google sign-in slot, provider button height, fixed height host, dimension token; inspected candidates: src/components/auth/GoogleSignInSlot.tsx, src/components/auth/GoogleSignInButton.tsx, src/design-system/mantine/theme.ts, src/stories/patterns/mantine/GoogleSignInSlot.stories.tsx; decision: EXTEND; selected canonical owner: src/components/auth/GoogleSignInSlot.tsx; Mantine/TailAdmin token path: src/design-system/mantine/theme.ts; new hardcoded visual values: NONE; rationale: the slot already reserves the button height with the theme.other.boxSize.googleButton token, and its host now holds that height as a fixed height instead of a minimum.`
  - UiContract: `UI CONTRACT PREFLIGHT COMPLETE - scope: src/components/auth/GoogleSignInSlot.tsx, src/components/auth/GoogleSignInButton.tsx, src/lib/auth/googleIdentity.ts; canonical owner: src/components/auth/GoogleSignInSlot.tsx; token owner: src/design-system/mantine/theme.ts; direct Story: src/stories/patterns/mantine/GoogleSignInSlot.stories.tsx.`
  - MobileAdaptation: the same receipt as 19.3.
- **Shared files.** The census registry and the test file carry other tasks' uncommitted lines. Change only the lines R38–R41 name.
- **The owner's Storybook.** The dev-server check also counts the owner's `npm run storybook`. If it runs, ask the owner to stop it before `npm run build-storybook` and `npm run build`.
- **No commit, no SQL and no database change.**

**Order of work (replaces 19.3's):**
1. The owner commits Review 9 and this amendment.
2. Sonnet executes R38–R41.
3. Opus reviews them, including its own run of `rv8-07-mobile-jump.mjs` on `localhost`.
4. The owner's visual QA.
5. Task 923's final review with O1, covering this task's code. Then the one push. When its deploy is live: the CAPTCHA protection on again, Task 923's §76.2 checks and AC12 on lero.al.

## 21. Reviews 10–11 and Amendment 10 (Opus, 2026-10-26): a Google button of our own, as on medium.com

**Reviews 10 and 11.** The full record is the sections "Task 927 Review 10" and "Task 927 Review 11" of `docs/sessions/2026-10-10-task923-rendered-state-census.md`. Amendment 9 kept the dialog's height, but the owner rejected it: the button itself changes in view.
- Google draws the button (C230) in two passes. For a moment its in-page button and its iframe button are both there (C231), and the button then takes another box. All 18 runs of the probe `rv11-10` show it on the current build (C260).
- medium.com, checked live in the owner's Chrome:
  - its "Sign in with Google" is its own link (C232), with no Google script on the page (C233);
  - the link opens Google's OpenID Connect page with an ID-token response and its own callback (C234);
  - its "G" is a flat four-colour SVG (C235).
- The owner chose a button of our own, as on Medium (D25), and has registered the two callback addresses (D26). Google accepts both for our client and refuses an unregistered one (C238–C240).

### 21.1 Design

- **The button.** The theme's `default` Button (C248, C249), full width, with Google's own flat "G" at the theme's 18 px icon size (C236, C250) and Google's own label in each locale (C237). It renders with the page, so it never changes in view. It looks like the sheet's other secondary buttons, as Medium's Google button looks like Medium's others (C232).
- **The flow.** A click opens Google's OpenID Connect page in a popup window:
  - `response_type=id_token`, the SHA-256 hex of a fresh nonce, a random `state`, `login_hint` where given (C244–C246);
  - the window returns to `/auth/google/callback`, which lies outside the locale middleware (C247, C258);
  - that page hands the ID token back to the opening window, which checks the origin and the `state` and gives the token and the raw nonce to the consumer's existing `onCredential` (C242, C256).
- **Why a popup.** Every consumer keeps its code (C243–C246). The deletion dialog and the e-mail section keep their open state for the repeat (C245); a full-page redirect, as Medium uses, would lose it.
- **Two channels.** The callback page posts to `window.opener` and on a `BroadcastChannel`. Google's sign-in pages only report an opener policy today (C241); if Google ever enforces it, the channel still reaches the opener.
- **Unchanged.** D1, D4 and D9 still hold: an ID token with a nonce goes to `signInWithIdToken`, no secret is used, and `signInWithOAuth` is not called. One Tap stays Google's prompt (C255, D16). The server is unchanged.
- **Removed.**
  - Google's script for the button and the slot's loader (C252).
  - The `googleButton` height token (C251).
  - The census exemptions for Google's class (C254).
  - The script cases of the contract.

### 21.2 Requirements

| ID | Requirement | Priority | AC |
|---|---|---|---|
| R42 [C236; C253; C259; D25] | **Google's "G".** New file `public/brand/google-g.svg`: the `<svg …>` element of `docs/sessions/evidence/task927/review-11/rv11-08-gis-logo.txt` line 6 with ` class="LgbsSe-Bz112c"` removed, followed by one LF and nothing else. Its sha256 is `bccb52db248f2f13a70fd897c07cd16780686f71901847fea99c5218dccffe65` (`rv11-11-logo-expected-sha.txt`). | P1 | AC38 |
| R43 [C234; C238; C256; D1; D25] | **Google's authorization URL.** `src/lib/auth/googleIdentity.ts`:<br>(a) export `GOOGLE_AUTHORIZATION_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth'` and `GOOGLE_CALLBACK_PATH = '/auth/google/callback'`;<br>(b) export `createState(): string`, 32 random bytes from `crypto.getRandomValues` in base64url without padding;<br>(c) export `googleAuthorizationUrl({ clientId, redirectUri, hashedNonce, state, locale, loginHint })`, whose query is exactly `client_id`, `redirect_uri`, `response_type=id_token`, `scope=openid email profile`, `nonce` (the hash), `state`, `prompt=select_account`, `hl` (the locale), and `login_hint` only when given;<br>(d) remove `GoogleButtonConfig` and `renderButton` from `GoogleAccountsId`. `initialize`, `prompt`, `cancel`, `loadGoogleIdentity` and the One Tap config stay (C255). | P1 | AC39 |
| R44 [C241; C242; C256; D25] | **The popup.** New `src/lib/auth/googlePopup.ts` exports `requestGoogleCredential({ clientId, locale, loginHint }): Promise<{ credential: string; nonce: string }>`:<br>(a) a new nonce pair and state per call; `window.open(url, 'lero-google-sign-in', 'popup=yes,width=500,height=640')`, where `url` is R43's with `redirectUri = window.location.origin + GOOGLE_CALLBACK_PATH`; a `null` window rejects `Error('popup_blocked')`;<br>(b) it accepts only `{ type: 'lero:google-sign-in', state, credential?, error? }` with this attempt's `state`, from a window `message` event whose `event.origin === window.location.origin`, or from `BroadcastChannel('lero-google-sign-in')` when `typeof BroadcastChannel !== 'undefined'`; everything else is ignored;<br>(c) a credential resolves with it and the raw nonce; `error === 'access_denied'` rejects `Error('cancelled')`; any other error rejects `Error('google_error')`;<br>(d) every 500 ms a closed window rejects `Error('cancelled')`; after 5 minutes it rejects `Error('timeout')` and closes the window;<br>(e) it settles once: on settling it removes the listener, closes the channel, clears both timers and closes the window (errors from `close` ignored);<br>(f) it writes the credential and the nonce to no storage, console or address. | P1 | AC39 |
| R45 [C234; C247; C258; D25] | **The callback page.**<br>(a) New `src/app/auth/google/callback/page.tsx`, a server component: `export const metadata = { robots: { index: false, follow: false } }`; it renders `<GoogleCallbackRelay />`.<br>(b) New `src/app/auth/google/callback/GoogleCallbackRelay.tsx` (`'use client'`). On mount it reads `id_token`, `state` and `error` from `window.location.hash`, then calls `history.replaceState(null, '', window.location.pathname)`.<br>(c) With a `state`, it builds `{ type: 'lero:google-sign-in', state, credential: id_token }` or `{ …, error }`. It posts that to `window.opener` with the target origin `window.location.origin` when an opener exists, and on `BroadcastChannel('lero-google-sign-in')` when `typeof BroadcastChannel !== 'undefined'`, then closes the channel.<br>(d) Without a `state` it posts nothing. In every case it then calls `window.close()`.<br>(e) It renders Mantine's `Center` with a `Loader`. | P1 | AC39 |
| R46 [C248; C249; C250; C252; C237; D25] | **The slot** `src/components/auth/GoogleSignInSlot.tsx`, stateless.<br>Props: `status`, one of `'ready'`, `'pending'` and `'unavailable'`; `notice`, one of `'popup_blocked'`, `'failed'` and `null`, optional; `purpose`; and `onClick: () => void`. `hostRef`, `GOOGLE_BUTTON_MAX_WIDTH` and the loader go.<br>(a) `unavailable`: the existing red Alert only.<br>(b) Otherwise, a `Stack gap="md"` with, when `notice` is set, a red `Alert` with `auth.google_popup_blocked` or `auth.google_failed`; then:<br>`<Button variant="default" fullWidth data-google-sign-in loading={status === 'pending'} onClick={onClick} leftSection={<Image src="/brand/google-g.svg" alt="" w={theme.other.iconSize.comfortable} h={theme.other.iconSize.comfortable} />}>{t('google_sign_in')}</Button>`.<br>(c) The comment says it is our own button (Task 927 D25), the theme's `default` Button with Google's own "G", and why: the button Google drew was replaced in view. | P1 | AC38, AC40 |
| R47 [C242; C243; C244; C245; C246; D25] | **The container** `src/components/auth/GoogleSignInButton.tsx`.<br>(a) Same props and the same `onCredential` contract. No Google script.<br>(b) Status starts `ready` with a client ID and `unavailable` without one.<br>(c) A click while `pending` does nothing. Otherwise it sets `pending` and clears the notice, awaits `requestGoogleCredential`, then awaits `onCredential` (its errors are the consumer's and are swallowed, as now).<br>(d) Outcomes: `popup_blocked` sets notice `popup_blocked`; `google_error` and `timeout` set `failed`; `cancelled` sets nothing. It returns to `ready` while mounted.<br>(e) The docstring describes our button, Google's window naming Lero.al, a new nonce and state per attempt, and no One Tap. | P1 | AC39 |
| R48 [C237; C252; D25] | **Texts**, in `messages/sq.json`, `en.json`, `uk.json` and `it.json` under `auth`:<br>- `google_sign_in`: "Identifikohu me Google", "Sign in with Google", "Вхід через Google", "Accedi con Google".<br>- `google_popup_blocked`: "Shfletuesi bllokoi dritaren e Google. Lejoni dritaret pop-up për këtë faqe dhe provoni përsëri." / "Your browser blocked Google's window. Allow pop-ups for this site and try again." / "Браузер заблокував вікно Google. Дозвольте спливні вікна для цього сайту й спробуйте ще раз." / "Il browser ha bloccato la finestra di Google. Consenti i pop-up per questo sito e riprova."<br>- `google_failed`: "Hyrja me Google nuk përfundoi. Provoni përsëri." / "Google sign-in did not finish. Try again." / "Вхід через Google не завершився. Спробуйте ще раз." / "L'accesso con Google non è stato completato. Riprova."<br>- Remove `google_loading` from all four. | P2 | AC38 |
| R49 [C251; D25] | **Token.** `src/design-system/mantine/theme.ts`: remove `googleButton` from the `boxSize` union and from the values, with their comments. | P2 | AC38 |
| R50 [C252; C254; D25] | **Story and registries.**<br>(a) `src/stories/patterns/mantine/GoogleSignInSlot.stories.tsx`: the exports `Ready`, `Pending`, `PopupBlocked`, `Failed`, `Unavailable` and `UnavailableReauth`, each passing `onClick={() => {}}`. `Loading` goes. The header comment and the docs description describe our button (D25).<br>(b) `scripts/ui-contract-registry.json`, row `google-sign-in-slot`: `storyExports` become those six; `element` becomes "the Google sign-in button, its notices and the unavailable alert".<br>(c) `scripts/rendered-interaction-states.json`: remove `exemptTargets`, `exemptText` and `ownerDecision` from the four rows that carry `.nsm7Bb-HzV7m-LgbsSe` (C254 and the three later ones). Nothing else changes. | P2 | AC40 |
| R51 [C243; C245; D25] | **Comments only.**<br>- `src/components/auth/GoogleWelcomeBack.tsx`: the `googleControl` comment says "the container's Google button (Task 927 D25)".<br>- `src/modules/auth/components/AuthSheet.tsx`: the comment above the login view's `handleGoogle` says that Google's window returns the ID token through `/auth/google/callback` (Task 927 D25).<br>- `src/modules/cabinet/components/ProfileTab.tsx`: the comment above `handleGoogleCredential` says that our Google button opens Google's window.<br>- `docs/env.md`: the Google section names the two authorized redirect URIs `http://localhost:3000/auth/google/callback` and `https://lero.al/auth/google/callback` (D26). | P3 | AC38 |
| R52 [C257; D25] | **Tests.** In the cases named by the contract (`SEC-927-FE-*`), the GIS double of the button is replaced by a popup double:<br>- `vi.spyOn(window, 'open')` returns `{ closed: false, close: vi.fn() }` (or `null`);<br>- a helper reads `state` and `nonce` from the URL given to `window.open`;<br>- another helper dispatches `new MessageEvent('message', { origin: window.location.origin, data: { type: 'lero:google-sign-in', state, credential } })` inside `act`.<br>jsdom has no `BroadcastChannel`, so the channel cases install a recording double with `vi.stubGlobal('BroadcastChannel', …)` and remove it after each test. The One Tap cases keep their GIS double without `renderButton`. Assertions on `google_loading` and `renderButton` go. New files: `src/lib/auth/__tests__/googlePopup.test.ts` and `src/app/auth/google/callback/__tests__/GoogleCallbackRelay.security.test.tsx`. Every test name is the contract's `testName`. | P1 | AC39 |

### 21.3 Acceptance criteria

Evidence goes in `docs/sessions/evidence/task927/a10/`. Each file records platform, Node, cwd, command, output and exit code.
- **AC38 [R42; R46; R48; R49; R51].**
  - `a10-00` and `a10-99`: the sha256 of every changed path before the first edit and after the last. `a10-99` gives `public/brand/google-g.svg` as `bccb52db…`.
  - `a10-01`, greps, each with the expected result:
    - `renderButton`, `google_loading`, `googleButton` and `GoogleSignInSlot status="loading"` appear nowhere in `src/`;
    - `nsm7Bb` appears nowhere in `scripts/rendered-interaction-states.json`;
    - `google_sign_in`, `google_popup_blocked` and `google_failed` appear in each of the four message files;
    - `data-google-sign-in` appears in `GoogleSignInSlot.tsx`.
- **AC39 [R43; R44; R45; R47; R52].**
  - `a10-02`: `npx vitest run` exits 0 with every `SEC-927-*` case of the contract collected, on these files:
    - `src/modules/auth/components/__tests__/AuthSheet.google.security.test.tsx` and `src/modules/auth/components/__tests__/AuthSheet.test.tsx`;
    - `src/modules/auth/components/AuthSheet.banned.security.test.tsx` and `src/modules/auth/components/__tests__/AuthSheet.passwordCaptcha.security.test.tsx`;
    - `src/components/layout/__tests__/Header.google.security.test.tsx`;
    - `src/modules/cabinet/components/__tests__/ProfileTab.googleReauth.security.test.tsx` and `src/modules/cabinet/components/__tests__/ProfileTab.deletePassword.security.test.tsx`;
    - `src/lib/auth/__tests__/googleIdentity.test.ts`, `src/lib/auth/__tests__/rememberedGoogleAccount.test.ts` and `src/lib/auth/__tests__/googlePopup.test.ts`;
    - `src/app/auth/google/callback/__tests__/GoogleCallbackRelay.security.test.tsx`;
    - `src/modules/cabinet/actions/__tests__/reauthIdToken.security.test.ts` and `src/app/api/auth/me/__tests__/route.security.test.ts`.
  - `a10-03`, sensitivity, each on a copy kept outside the project and restored to its `a10-99` hash:
    1. In `googlePopup.ts`, the origin check removed. `SEC-927-FE-POPUP-DENY-ORIGIN` fails; restored, it passes.
    2. In `GoogleCallbackRelay.tsx`, the target origin replaced with `'*'`. `SEC-927-FE-CALLBACK-RELAY` fails; restored, it passes.
- **AC40 [R46; R50].**
  - `a10-04`: the dev-server check of `rv50-06`, then `npm run build-storybook` exits 0. Then `node scripts/check-rendered-state-census.mjs --stories patterns-mantine-authsheet--login,patterns-mantine-authsheet--login-validation-error,patterns-mantine-authsheet--welcome-back,mantine-primitives-modal--delete-confirm-password,patterns-mantine-googlesigninslot--ready,patterns-mantine-googlesigninslot--pending,patterns-mantine-googlesigninslot--popup-blocked` exits 0 with 0 failing rows. The exemptions are gone, so our button is checked like every other element.
  - `a10-05`: `node docs/sessions/evidence/task927/review-11/rv11-10-google-button-stability.mjs` exits 0: 18 runs, 0 failing, each with one `ours` control and one box from its first frame. The baseline is 18 failing (C260).
  - `a10-06`: with `GOOGLE_SEL=[data-google-sign-in]`, `node docs/sessions/evidence/task927/a5/a5-12-rhythm.mjs` and `node docs/sessions/evidence/task927/a7/a7-06-rhythm.mjs` report 0 cells with a problem, and a5-12 gives one Google button height in WelcomeBack, Login and the dialog.
  - `a10-07`: `npm run check:stories`, `npm run check:i18n`, `npm run check:ui-contract:verify`, `node scripts/check-mobile-adaptation-contract.mjs --files <the changed paths>` exit 0. `npm run check:design-tokens` reports no finding in a changed path (its other findings are C216's).
- **AC41 [R42–R52].**
  - `a10-08`: after the dev-server check, `npm run typecheck`, `npx eslint --quiet` on the changed code paths and `npm run build` exit 0.
  - `a10-09`: `node scripts/workflow-gates/cli.mjs plan --contract tasks/Sprints/Sprint_91_kickoff_prompt_Task_927_Google_Sign_In_Shows_Lero_Al.security.json` exits 0.
  - **Report.** The section "Task 927 Amendment 10 executor report" in the session record lists each path's sha256 before and after, every deviation and each evidence file. It ends with `PARTIALLY IMPLEMENTED`.

**OWNER VISUAL QA REQUIRED (after Opus's review).**
- **Storybook.** AuthSheet `Login` and `WelcomeBack`, Modal `DeleteConfirmPassword` (its Google section opened) and every GoogleSignInSlot export. Widths 320, 390, 639 and 1440; locales sq, en, uk and it. Expected:
  - one Google button, which never changes size or look while the sheet or dialog opens;
  - it looks like the sheet's other secondary buttons, with Google's "G" on the left.
- **On `http://localhost:3000`.** A Google sign-in from the sheet and from Welcome back; the profile's e-mail re-confirmation; the deletion dialog. Google's window names Lero.al, closes itself, and the action continues.

### 21.4 Canonical decision, mobile record and execution preconditions

- **GR-0: EXTEND** `GoogleSignInSlot`: it now renders the theme's `default` Button with Google's "G" from `public/brand`. No new token and no consumer value; one token goes (R49).
- **Mobile.** Inherited, unchanged: the slot stays one full-width child of the form stack. **Rhythm.** The slot's `Stack gap="md"` is the form's rhythm (`theme.ts` spacing `md`). `a10-06` reruns the rhythm probes.
- **Root and contract.** Root `C:\Claude_Code_Projects\lero-al`. Use this contract only, while it is `ready`.
- **Reads before the first write:**
  - this section and rows C230–C260, D25 and D26;
  - the changed paths;
  - `rv11-08-gis-logo.txt` and `rv11-11-logo-expected-sha.txt`;
  - the probe `rv11-10-google-button-stability.mjs` (read only).

  Then run `cli.mjs receipt` for this contract.
- **UI receipts.** Register each through the PowerShell tool, the helper call being the command's only statement:
  - CanonicalReuse: `GR-0 CANONICAL REUSE PREFLIGHT - request: a Sign in with Google button of our own, made like medium.com and drawn with the page, replacing the button Google Identity Services draws and swaps; semantic queries: provider sign-in button, secondary full-width button, Google logo asset, google sign-in slot; inspected candidates: src/components/auth/GoogleSignInSlot.tsx, src/components/auth/GoogleSignInButton.tsx, src/design-system/mantine/theme.ts Button default variant, src/design-system/mantine/patterns, src/stories/patterns/mantine/GoogleSignInSlot.stories.tsx; decision: EXTEND; selected canonical owner: src/components/auth/GoogleSignInSlot.tsx; Mantine/TailAdmin token path: src/design-system/mantine/theme.ts (Button default variant chrome, iconSize.comfortable); new hardcoded visual values: NONE; rationale: the slot keeps its place and renders the theme Mantine Button default variant with Google own logo file from public/brand, so the Google button has the same look as the sheet other buttons.`
  - UiContract: `UI CONTRACT PREFLIGHT COMPLETE - scope: src/components/auth/GoogleSignInSlot.tsx, src/components/auth/GoogleSignInButton.tsx, src/lib/auth/googleIdentity.ts, src/lib/auth/googlePopup.ts, src/app/auth/google/callback/page.tsx; canonical owner: src/components/auth/GoogleSignInSlot.tsx; token owner: src/design-system/mantine/theme.ts; direct Story: src/stories/patterns/mantine/GoogleSignInSlot.stories.tsx.`
  - MobileAdaptation: `MOBILE ADAPTATION PREFLIGHT COMPLETE - surfaces: src/components/auth/GoogleSignInSlot.tsx ready, pending and unavailable states, src/modules/auth/components/AuthSheet.tsx login and Welcome back views, src/design-system/mantine/patterns/MantineDeleteConfirmModal.tsx Google section; component families: overlay-and-disclosure, form-picker-and-choice; pattern IDs: overlay-adaptive, form-stack; standards: w3c-focus-order, w3c-hover-focus, apple-hig-sheets, android-common-layouts, android-adapt-layouts, w3c-labels-instructions, w3c-reflow, apple-hig-layout, android-content-structure; mantine mechanism: responsive-props; mantine owner: src/design-system/mantine/patterns/MantineDrawer.tsx; mobile range: <640px (theme.other.mobileGate / sm); mobile order: unchanged, the Google slot keeps its place as one full-width button of the form stack; required content: no semantic loss; verification: src/stories/patterns/mantine/GoogleSignInSlot.stories.tsx, the AuthSheet Login and WelcomeBack Stories and the Modal DeleteConfirmPassword Story across the <640px widths 320, 375, 390, 480, 560, 639 and the 640px transition x sq, en, uk, it.`
  - StorybookProof, before the Story write: `STORYBOOK PROOF PREFLIGHT COMPLETE - direct Story: src/stories/patterns/mantine/GoogleSignInSlot.stories.tsx; production component: GoogleSignInSlot; allowed public states: status, notice, purpose, onClick; local presentation: NONE.`
- **Shared files.** The message files, the registries, `theme.ts` and the test files carry other tasks' uncommitted lines. Change only the lines R42–R52 name.
- **The owner's dev servers.** The dev-server check also counts the owner's `npm run storybook` and `npm run dev`. If either runs, ask the owner to stop it before `npm run build-storybook` and `npm run build`.
- **No commit, no SQL and no database change.**

**Order of work (replaces 20.3's):**
1. The owner commits Reviews 10–11 and this amendment.
2. Sonnet executes R42–R52.
3. Opus reviews them, including its own run of `rv11-10` and a check in the owner's Chrome.
4. The owner's visual QA and the native sign-in on `localhost:3000`.
5. Task 923's final review with O1, covering this task's code. Then the one push. When its deploy is live: the CAPTCHA protection on again, Task 923's §76.2 checks, and the Google sign-in on lero.al.

## 22. Review 12 and Amendment 11 (Opus, 2026-10-26): Google's window without a gap; one exception to `noopener`

**Review 12.** The full record is the section "Task 927 Review 12" of the session record.
- Amendment 10 is implemented as routed, and the button holds still in all 18 runs (C272).
- Four gaps in its design:
  - F13: a security test requires `noopener` in every `window.open` (C262, C263), whose invariant is no way back through the opener (C264). R44 needs the opener, so both rules fail on the popup's call (C265). The owner allowed one exception, for Google's window (D27).
  - F14: the window opens only after an `await` (C261).
  - F15: Vercel's Analytics and Speed Insights run on the callback page too (C266).
  - F16: a closed window rejects at once (C270), which a future opener policy at Google could trigger early.
- Notes: a stale loader mock (C271) and AC38's `renderButton` grep.

### 22.1 Requirements

| ID | Requirement | Priority | AC |
|---|---|---|---|
| R53 [C261; C270; C241; D25] | **The window opens in the click.** `src/lib/auth/googlePopup.ts`:<br>(a) Replace `requestGoogleCredential` with two exports:<br>- `prepareGoogleAttempt({ clientId, locale, loginHint }): Promise<GoogleAttempt>`, which makes the nonce pair, the state and the URL (as R43 and R44 (a) did) and resolves `{ nonce, state, url }`;<br>- `openGoogleAttempt(attempt): Promise<GooglePopupResult>`, a plain (not `async`) function whose first statement is `const popup = window.open(attempt.url, POPUP_NAME, POPUP_FEATURES)`. A `null` window returns `Promise.reject(new Error('popup_blocked'))`. The rest is R44 (b)–(f) unchanged, except (b).<br>(b) The 500 ms check rejects `cancelled` only when `popup.closed && document.hasFocus()`.<br>(c) The comments say why:<br>- the window must open in the click itself, so the attempt is prepared before it;<br>- a closed window counts only once this page has focus again, because a future opener policy at Google could make `closed` true while the person is still on Google's page (C241). | P1 | AC42 |
| R54 [C242; D25] | **The container prepares ahead.** `src/components/auth/GoogleSignInButton.tsx`:<br>(a) An effect on `clientId`, `locale` and `loginHint` prepares an attempt into a ref while mounted; the previous one is dropped.<br>(b) A click with no prepared attempt, or while `pending`, does nothing. Otherwise the click takes the attempt out of the ref, then calls `openGoogleAttempt` before any `await`. Then, as before: `pending`, the notice and `onCredential`.<br>(c) After every attempt it prepares the next while mounted.<br>(d) The slot's look is unchanged: the button stays `ready` while the attempt is prepared. | P1 | AC42 |
| R55 [C262; C263; C264; C265; D27] | **One exception to `noopener`.** `src/__tests__/security/clientSinks.test.ts`:<br>(a) A constant `OPENER_ALLOWED`, `{ 'src/lib/auth/googlePopup.ts': 'window.open(attempt.url, POPUP_NAME, POPUP_FEATURES)' }`. Its comment says: Task 927 D27, Google's sign-in window must reach this site's callback page through `window.opener`; it only ever loads Google's authorization endpoint and then this origin.<br>(b) A helper `windowOpenViolations(files)` returns every `window.open(...)` match without `noopener` except a match whose file and exact text are in `OPENER_ALLOWED`. Both the `every window.open passes noopener` test and SEC-S11-SRV-DENY use it. Their names and their `target="_blank"` checks are unchanged.<br>(c) New case SEC-927-FE-SINKS-EXCEPTION, with two planted files given to the helper:<br>- the allowed text in another file is reported;<br>- another `window.open(x, 'y')` in `src/lib/auth/googlePopup.ts` is reported.<br>The real files give no violation. | P1 | AC43 |
| R56 [C266; C267; C268; C269] | **No analytics on the callback.**<br>(a) New `src/lib/analytics/beforeSend.ts` exports `withoutAuthCallback`, generic over `T extends { url: string }`, which takes `event: T` and returns `T` or `null`:<br>- `null` when the address's path starts with `/auth/`;<br>- otherwise the event with any fragment removed from `url`;<br>- an address it cannot parse is returned unchanged.<br>(b) `src/app/layout.tsx`: `<Analytics beforeSend={withoutAuthCallback} />` and `<SpeedInsights beforeSend={withoutAuthCallback} />`. Nothing else changes.<br>(c) New `src/lib/analytics/__tests__/beforeSend.security.test.ts`, case SEC-927-FE-ANALYTICS-DROP. | P2 | AC43 |
| R57 [C271] | **Stale mock.** `src/modules/auth/components/AuthSheet.banned.security.test.tsx`: remove lines 19–20 (the loader comment and the `loadGoogleIdentity` mock). The file still passes. | P3 | AC42 |
| R58 [C257; D25] | **Tests.**<br>- `src/lib/auth/__tests__/googlePopup.test.ts` uses the two new exports.<br>- New case SEC-927-FE-POPUP-FOCUS in that file: a closed window while `document.hasFocus()` is `false` stays pending; once it is `true`, the attempt rejects `cancelled`.<br>- New case SEC-927-FE-POPUP-SYNC-OPEN in `AuthSheet.google.security.test.tsx`: after the preparation is flushed (`await act(async () => {})`), `fireEvent.click` on the Google button calls `window.open` once before the test awaits anything.<br>- Every test that clicks the Google button flushes the preparation first. | P1 | AC42 |

### 22.2 Acceptance criteria

Evidence goes in `docs/sessions/evidence/task927/a11/`. Each file records platform, Node, cwd, command, output and exit code.
- **AC42 [R53; R54; R57; R58].**
  - `a11-00` and `a11-99`: the sha256 of every changed path before the first edit and after the last.
  - `a11-01`, greps:
    - `requestGoogleCredential` appears nowhere in `src/`;
    - in `googlePopup.ts` the line after `export function openGoogleAttempt` contains `window.open(attempt.url, POPUP_NAME, POPUP_FEATURES)`;
    - `loadGoogleIdentity` appears nowhere in `AuthSheet.banned.security.test.tsx`.
  - `a11-02`: `npx vitest run` exits 0 on AC39's 13 files, plus `src/__tests__/security/clientSinks.test.ts` and `src/lib/analytics/__tests__/beforeSend.security.test.ts`. Every case of the contract that names those files is collected by name.
  - `a11-03`, sensitivity, each on a copy kept outside the project and restored to its `a11-99` hash:
    1. In `openGoogleAttempt`, `&& document.hasFocus()` removed: SEC-927-FE-POPUP-FOCUS fails.
    2. In `GoogleSignInButton.tsx`, an `await Promise.resolve()` put before `openGoogleAttempt`: SEC-927-FE-POPUP-SYNC-OPEN fails.
- **AC43 [R55; R56].**
  - `a11-04`, sensitivity:
    1. `OPENER_ALLOWED` emptied: both `noopener` tests fail on `googlePopup.ts`.
    2. `withoutAuthCallback` returning every event: SEC-927-FE-ANALYTICS-DROP fails.
    Both restored to their `a11-99` hashes.
  - `a11-05`: `npx vitest run --reporter=json --outputFile=docs/sessions/evidence/task927/a11/a11-05-full.json`, then `node docs/sessions/evidence/task923/r34-03c-compare.mjs docs/sessions/evidence/task927/a11/a11-05-full.json docs/sessions/evidence/task927/a11/a11-05-failing-ids.txt`. No failing ID absent from the baseline.
- **AC44 [R53; R54; R56].**
  - `a11-06`: the dev-server check, `npm run build-storybook` exits 0, then `node docs/sessions/evidence/task927/review-11/rv11-10-google-button-stability.mjs` exits 0 (18 runs, 0 failing).
  - `a11-07`: after the dev-server check, `npm run typecheck`, `npx eslint --quiet` on the changed code paths and `npm run build` exit 0.
  - `a11-08`: `node scripts/workflow-gates/cli.mjs plan --contract tasks/Sprints/Sprint_91_kickoff_prompt_Task_927_Google_Sign_In_Shows_Lero_Al.security.json` exits 0.
  - **Report.** The section "Task 927 Amendment 11 executor report" in the session record lists each path's sha256 before and after, every deviation and each evidence file. It ends with `PARTIALLY IMPLEMENTED`.

**OWNER VISUAL QA REQUIRED (after Opus's review).** As in §21.3, unchanged.

### 22.3 Execution preconditions

- **Visible scope.** No visible change: the slot, its Story and the tokens are untouched. `GoogleSignInButton.tsx` and `layout.tsx` are UI paths, so before the first write register §21.4's CanonicalReuse, UiContract and MobileAdaptation receipts, unchanged, each through the PowerShell tool as the command's only statement. No Story file changes, so no StorybookProof receipt is needed.
- **Root and contract.** Root `C:\Claude_Code_Projects\lero-al`. Use this contract only, while it is `ready`.
- **Reads before the first write.** This section, rows C261–C272 and D27, and the changed paths; then `cli.mjs receipt` for this contract.
- **Shared files.** `clientSinks.test.ts`, `layout.tsx` and the test files carry other tasks' lines. Change only the lines R53–R58 name.
- **The owner's dev servers.** As in §21.4.
- **No commit, no SQL and no database change.**

**Order of work (replaces 21.4's):**
1. The owner commits Review 12 and this amendment.
2. Sonnet executes R53–R58.
3. Opus reviews them, including `rv11-10` and a check of Google's window in the owner's Chrome on `localhost:3000`.
4. The owner's visual QA and the native sign-in.
5. Task 923's final review with O1, covering this task's code. Then the one push. When its deploy is live: the CAPTCHA protection on again, Task 923's §76.2 checks, and the Google sign-in on lero.al.

## 23. Review 13 and Amendment 12 (Opus, 2026-10-28): a Google account that changed its e-mail is asked for a password it does not have

**Review 13.** The full record is the sections "Task 927 Review 13" and "Task 927 Review 13, continued" of the session record.
- Amendment 11 is accepted with no finding.
- The owner's checks pass:
  - AuthSheet `Login` and `WelcomeBack`, Modal `DeleteConfirmPassword` and the six GoogleSignInSlot exports;
  - the native Google sign-in and Welcome back;
  - the e-mail change confirmed with Google.
- **F17 (P2, design of Task 923 R80, met here):** after that e-mail change, the deletion asked the owner for a password. The account was created through Google and has none.
  - The server reads "has a password" from the `email` entry of the account's providers (C273). That answer chooses the profile's proof (C274) and the server's check (C275).
  - The confirmed e-mail change sets the address through the admin API (C276). Afterwards the account carries the `email` provider (C277), but `auth.users` holds no password for it (C278).
  - So the dialog asks for a password (C279), and the server would check one the person never set. The account can neither delete itself nor change its e-mail again with Google. Nothing is let through: the check refuses.
- The owner's decision: the proof follows whether the account really has a password (D28).
- `auth.users` is not reachable through the Auth API. A function executable by `service_role` only reads it, as `end_user_sessions` does (C280, C281). It does not exist yet (C282).

### 23.1 Requirements

| ID | Requirement | Priority | AC |
|---|---|---|---|
| R59 [C280; C281; C282; D28] | **The function's SQL.** New files in `docs/sessions/evidence/task927/a12/`, each a byte-for-byte copy of the file Opus saved in `docs/sessions/evidence/task927/review-13/`, with the sha256 of `rv13-11-expected-sha.txt`:<br>- `a12-account-has-password.sql` from `rv13-11-account-has-password.sql` (`68870d9f…`);<br>- `a12-account-has-password.dryrun.sql` from `rv13-11-account-has-password.dryrun.sql` (`f33b7723…`);<br>- `a12-account-has-password-rollback.sql` from `rv13-11-account-has-password-rollback.sql` (`1b7882a0…`).<br>The function: `public.account_has_password(p_user uuid) returns boolean`, `language sql stable security definer set search_path = public, pg_temp`, `select coalesce(u.encrypted_password, '') <> '' from auth.users u where u.id = p_user`; execution revoked from `public`, `anon` and `authenticated` and granted to `service_role`; a preflight and four post-checks. Nobody runs these files in this step: the owner applies them after Opus's review. | P1 | AC45 |
| R60 [C273; C274; C275; C276; C277; C278; C287; D28] | **The server reads the function.** `src/modules/cabinet/actions/index.ts`, `accountHasPassword` only:<br>(a) Inside its `try`, the body becomes `const { data, error } = await createAdminClient().rpc('account_has_password', { p_user: userId })`, then `if (error \|\| typeof data !== 'boolean') return null`, then `return data`. The `catch` still returns `null`.<br>(b) Its comment says it asks `public.account_has_password` whether `auth.users` holds a password. It also says that Auth's providers cannot tell, because Supabase adds the `email` provider when an account's address changes (Task 927 D28), and that `null` (unreadable) is refused by every caller.<br>(c) The comment of `reauthenticate` says "an account WITH a password (`auth.users` holds one)" in place of "(Auth lists the `email` provider)".<br>Nothing else in the file changes. | P1 | AC46 |
| R61 [C283; C284; C288] | **The doubles answer the function.** In each of the nine files of C283, the double of the admin client's `rpc` answers the name `account_has_password` with `{ data: <that file's providers double includes 'email'>, error: null }`. Every other name is answered as now. The files:<br>`src/lib/account/deleteAccount.security.test.ts`, `src/modules/cabinet/actions/__tests__/cabinetActions.security.test.ts`, `cabinetFailures.security.test.ts`, `cabinetSessions.security.test.ts`, `deleteOwnAccount.smoke.test.ts`, `emailChange.security.test.ts`, `reauth.security.test.ts`, `reauthIdToken.security.test.ts` and `reauthLimit.security.test.ts`.<br>No assertion changes, except as R62 says for `reauthIdToken.security.test.ts`. | P1 | AC46 |
| R62 [C275; C277; C278; C287; D28] | **New server case SEC-927-SRV-REAUTH-NOPASSWORD** in `src/modules/cabinet/actions/__tests__/reauthIdToken.security.test.ts`, with the real actions:<br>(a) The file's state gains `hasPassword: false as boolean \| 'error'`, reset to `false` before each test. Its `rpc` double answers `account_has_password` with `{ data: state.hasPassword, error: null }`, or with `{ data: null, error: { message: 'zz-synthetic rpc failure' } }` when it is `'error'`.<br>(b) The case, with providers `['google', 'email']` (as after an address change, C277) and `hasPassword` false:<br>- `getReauthMethod()` resolves `'google'`;<br>- with an `oauth` sign-in 60 s old, `deleteOwnAccount()` resolves `{}`; `deleteAccount` is called once for `user-1`; no password sign-in is attempted;<br>- with no authentication method, `deleteOwnAccount({ password: 'zz-synthetic-guess' })` resolves `{ error: 'reauth_required' }`; no password sign-in is attempted; nothing is deleted.<br>(c) With `hasPassword` `'error'`: `getReauthMethod()` resolves `null`; `deleteOwnAccount()` resolves `{ error: 'delete_failed' }`; nothing is deleted.<br>(d) With providers `['google']` and `hasPassword` true: `getReauthMethod()` resolves `'password'`.<br>The test's name is the contract's `testName`. | P1 | AC46, AC47 |
| R63 [C282; C285; C286; D28] | **Real-boundary cases** in `src/lib/auth/googleSignIn.integration.test.ts`, with `createRun`'s synthetic users. They are written now and run by Opus after the owner's apply.<br>- **SEC-927-DB-PASSWORD-ALLOW.** `run.admin.rpc('account_has_password', { p_user })` gives:<br>  - `{ data: true, error: null }` for `run.makeUser('pw')`;<br>  - `{ data: false, error: null }` for a user made by ``run.admin.auth.admin.createUser({ email: `${run.RUN}_nopw@example.com`, email_confirm: true })``, whose `getUserById` providers include `'email'`;<br>  - `{ data: false, error: null }` for the same user after ``run.admin.auth.admin.updateUserById(id, { email: `${run.RUN}_nopw2@example.com`, email_confirm: true })``;<br>  - `data` `null` for `randomUUID()`.<br>- **SEC-927-DB-PASSWORD-DENY.** The same call from the `pw` user's own session client and from `run.anonymousClient()` each gives a non-null `error` and `data` `null`. The error codes are written to `docs/sessions/evidence/task927/security/sec-927-db-password-deny.txt`.<br>The file's header comment lists the two cases. | P1 | AC48 |

### 23.2 Acceptance criteria

Evidence goes in `docs/sessions/evidence/task927/a12/`. Each file records platform, Node, cwd, command, output and exit code.
- **AC45 [R59].** `a12-00` and `a12-99`: the sha256 of every changed path before the first edit and after the last. `a12-99` gives the three SQL files the hashes of `rv13-11-expected-sha.txt`, in the same order.
- **AC46 [R60; R61; R62].**
  - `a12-01`, greps:
    - `providers.includes('email')` appears nowhere in `src/modules/cabinet/actions/index.ts`;
    - `rpc('account_has_password', { p_user: userId })` appears once in that file;
    - `account_has_password` appears in each of the nine files of R61.
  - `a12-02`: `npx vitest run` exits 0 on the nine files of R61 and on `src/modules/cabinet/components/__tests__/ProfileTab.deletePassword.security.test.tsx`, `ProfileTab.googleReauth.security.test.tsx`, `src/lib/auth/__tests__/googlePopup.test.ts` and `src/modules/auth/components/__tests__/AuthSheet.google.security.test.tsx`. Every contract case that names one of those files is collected by name and passes.
- **AC47 [R62].** `a12-03`, sensitivity, each made with the Edit tool on the project file, then restored to its `a12-99` hash:
  1. In `accountHasPassword`, the body of R60 (a) replaced by the read before it (`getUserById`, then `providers.includes('email')`): SEC-927-SRV-REAUTH-NOPASSWORD fails.
  2. `if (error || typeof data !== 'boolean') return null` and `return data` replaced by `return data === true`: SEC-927-SRV-REAUTH-NOPASSWORD fails on its unreadable branch.
- **AC48 [R59–R63].**
  - `a12-04`: `npx vitest run --reporter=json --outputFile=docs/sessions/evidence/task927/a12/a12-04-full.json`, then `node docs/sessions/evidence/task923/r34-03c-compare.mjs docs/sessions/evidence/task927/a12/a12-04-full.json docs/sessions/evidence/task927/a12/a12-04-failing-ids.txt`. No failing ID absent from the baseline.
  - `a12-05`: after the dev-server check, `npm run typecheck`, `npx eslint --quiet` on the changed code and test paths (with `src/lib/auth/googleSignIn.integration.test.ts`) and `npm run build` exit 0.
  - `a12-06`: `node scripts/workflow-gates/cli.mjs plan --contract tasks/Sprints/Sprint_91_kickoff_prompt_Task_927_Google_Sign_In_Shows_Lero_Al.security.json` exits 0.
  - **Report.** The section "Task 927 Amendment 12 executor report" in the session record lists each path's sha256 before and after, every deviation and each evidence file. It ends with `PARTIALLY IMPLEMENTED`.

**After Opus's review (not Sonnet's).**
- Opus checks the SQL on the owner's path: the preflight, read-only, and the sha256 with LF and with CRLF. Then Opus gives the owner the dry run and the apply.
- After the owner's apply, Opus checks the function's catalog row and its grants read-only, then runs SEC-927-DB-PASSWORD-ALLOW and -DENY. The command is `SECURITY_TEST_TARGET=development SECURITY_TEST_PROJECT_REF=<ref> npx vitest run --config vitest.integration.config.ts src/lib/auth/googleSignIn.integration.test.ts`.
- **OWNER CHECK REQUIRED.** On `http://localhost:3000`, a Google account whose e-mail was changed:
  - the deletion dialog shows DELETE and, past 10 minutes, the Google step, with no password field;
  - a second e-mail change asks for Google, not for a password.

### 23.3 Execution preconditions

- **Visible scope.** None: no UI, Story or token path changes. `ProfileTab.tsx` is unchanged, and its tests are rerun.
- **Root and contract.** Root `C:\Claude_Code_Projects\lero-al`. Use this contract only, while it is `ready`.
- **Reads before the first write.** This section, rows C273–C288 and D28, the changed paths and the three `rv13-11` files; then `cli.mjs receipt` for this contract.
- **Shared files.** `index.ts` and the nine test files carry Task 923's uncommitted lines. Change only the lines R60–R62 name.
- **Do not run** the integration file: the function does not exist until the owner applies it. Do not run any SQL.
- **The owner's dev servers.** As in §21.4.
- **No commit, no SQL and no database change.**

**Order of work (replaces 22.3's):**
1. The owner commits Review 13 and this amendment.
2. Sonnet executes R59–R63.
3. Opus reviews them, checks the SQL, and gives the owner the dry run and the apply.
4. The owner applies the SQL; Opus checks the function and runs the two database cases.
5. The owner's check of §23.2.
6. Task 923's final review with O1, covering this task's code. Then the one push. When its deploy is live: the CAPTCHA protection on again, Task 923's §76.2 checks, and the Google sign-in on lero.al.

## 24. Review 14 and Amendment 13 (Opus, 2026-10-28): the no-password user of SEC-927-DB-PASSWORD-ALLOW

**Review 14.** The full record is the section "Task 927 Review 14" of the session record and `docs/sessions/evidence/task927/review-14/`.
- Amendment 12's code (R59–R62) is accepted with no finding. The owner applied the SQL.
- The function agrees with `auth.users` for every account (C293). SEC-927-DB-PASSWORD-DENY passes (C296).
- **F18 (P2, task design of R63):** SEC-927-DB-PASSWORD-ALLOW fails (C290).
  - Its no-password user is made with `createUser` and no password (C294). For such a user Supabase Auth stores a bcrypt hash of a password it makes itself (C289), so the function rightly answers true.
  - The function is right; the fixture does not model an account without a password.
  - A user made by `generateLink` of type `invite` holds no password and lists the `email` provider. The function answers false for it, also after its address changes (C291, C292). `generateLink` sends no e-mail (C297).
  - Its address carries the run's prefix, so the clean-up deletes it (C295).

### 24.1 Requirements

| ID | Requirement | Priority | AC |
|---|---|---|---|
| R64 [C289; C290; C291; C292; C294; C295; C297; D28] | **The no-password user of SEC-927-DB-PASSWORD-ALLOW.** In `src/lib/auth/googleSignIn.integration.test.ts`, that case only:<br>(a) The user is made by ``run.admin.auth.admin.generateLink({ type: 'invite', email: `${run.RUN}_nopw@example.com` })``. Its `error` is `null`, and its id is `data.user.id`. This replaces the `createUser` call of C294.<br>(b) A comment above it says: Supabase Auth stores a hash of a password it makes itself for a user that `createUser` makes without one (Review 14, `rv14-09`); an invited user holds none, as an account made through Google holds none; `generateLink` sends no e-mail.<br>(c) Everything else in the case stays as written: the `pw` user's `true`; this user's `getUserById` providers contain `'email'` and its answer is `{ data: false, error: null }`; the same after `updateUserById` with `${run.RUN}_nopw2@example.com`; `data` `null` for `randomUUID()`.<br>Nothing else in the file changes. No other file changes. | P1 | AC49 |

### 24.2 Acceptance criteria

Evidence goes in `docs/sessions/evidence/task927/a13/`. Each file records platform, Node, cwd, command, output and exit code.
- **AC49 [R64].**
  - `a13-00` and `a13-99`: the sha256 of `src/lib/auth/googleSignIn.integration.test.ts` before the edit and after it.
  - `a13-01`, greps: `generateLink({ type: 'invite'` appears once in the file, and `createUser({ email: noPasswordEmail` appears nowhere.
  - `a13-02`: `npm run typecheck` and `npx eslint --quiet src/lib/auth/googleSignIn.integration.test.ts` exit 0.
  - `a13-03`: `npx vitest run --config vitest.integration.config.ts src/lib/auth/googleSignIn.integration.test.ts` without `SECURITY_TEST_*` refuses to run (the target guard). The file is not run against the database.
  - `a13-04`: `node scripts/workflow-gates/cli.mjs plan --contract tasks/Sprints/Sprint_91_kickoff_prompt_Task_927_Google_Sign_In_Shows_Lero_Al.security.json` exits 0.
  - **Report.** The section "Task 927 Amendment 13 executor report" in the session record. It ends with `PARTIALLY IMPLEMENTED`.

**After Opus's review (not Sonnet's).**
- Opus runs the four cases of the integration file with the command of §23.2 and checks that the clean-up leaves no synthetic user.
- **OWNER CHECK REQUIRED:** §23.2's check on `http://localhost:3000`.

### 24.3 Execution preconditions

- **Visible scope.** None.
- **Root and contract.** Root `C:\Claude_Code_Projects\lero-al`. Use this contract only, while it is `ready`.
- **Reads before the first write.** This section, rows C289–C297, the case at `src/lib/auth/googleSignIn.integration.test.ts:104-128`; then `cli.mjs receipt` for this contract.
- **Do not run** the integration file against the database, and do not set `SECURITY_TEST_*`.
- **No commit, no SQL and no database change.**

**Order of work (replaces 23.3's):**
1. The owner commits Review 14 and this amendment.
2. Sonnet executes R64.
3. Opus reviews it and runs the integration file.
4. The owner's check of §23.2.
5. Task 923's final review with O1, covering this task's code. Then the one push. When its deploy is live: the CAPTCHA protection on again, Task 923's §76.2 checks, and the Google sign-in on lero.al.

## Security test contract

| Field | Content |
|---|---|
| Assets and boundaries | ID token and nonce in the browser (`src/lib/auth/googleIdentity.ts`, `src/components/auth/GoogleSignInButton.tsx`, `src/lib/auth/browser.ts`); consumer `AuthSheet` login view; the stored destination (`sanitizeReturnTo`); Supabase Auth's `id_token` grant (provider); the `handle_new_user` trigger (database); `/api/auth/me` with `requireViewer` (server); the profile tab's re-confirmation (`ProfileTab.tsx`, `MantineDeleteConfirmModal.tsx`) and the server's recent-sign-in rule in `initiateEmailChange` and `deleteOwnAccount` (server). Amendment 5: the remembered account in `localStorage` (`src/lib/auth/rememberedGoogleAccount.ts`); a guest's One Tap (`src/lib/auth/useGoogleOneTap.ts`, `src/components/layout/Header.tsx`); the shared completion (`src/modules/auth/lib/googleSignIn.ts`); the Welcome back view (`src/components/auth/GoogleWelcomeBack.tsx`, `AuthSheet.tsx`); the deletion's forget call (`ProfileTab.tsx`). |
| Frontend security | SEC-927-FE-*: the real `AuthSheet`, `GoogleSignInButton`, `GoogleSignInSlot` and `googleIdentity` with a GIS double installed on `window.google` when the test fires the script's `load`; only `@/lib/auth/browser` and the router are doubles. Allowed sign-in, hostile destinations, ban, replay, no automatic sign-in, failure states, no credential or nonce in console, storage or URL. SEC-927-FE-REAUTH-*: the real `ProfileTab`, `MantineDeleteConfirmModal` and `GoogleSignInButton` with the same GIS double; the cabinet actions, the identity context, the router and `@/lib/auth/browser` are doubles. Same-account confirmation, another account, a switched session, failure. SEC-927-FE-ONETAP-*, SEC-927-FE-REMEMBER-ALLOW, -DENY-HOSTILE, -FORGET and SEC-927-FE-WELCOME-DENY-BANNED (Amendment 5): the real `Header`, `AuthSheet`, `GoogleWelcomeBack`, `GoogleSignInButton`, `useGoogleOneTap`, `rememberedGoogleAccount` and `googleSignIn` with the same GIS double plus `prompt`; `useUser`, the router, the toast and `@/lib/auth/browser` are doubles. SEC-927-FE-REMEMBER-KEEP and -DELETE run in the existing sign-out and deletion files; SEC-927-FE-UNIT-REMEMBER tests the module alone. SEC-927-FE-DELETE-TYPED (Amendment 7, D17) runs in `ProfileTab.deletePassword.security.test.tsx`: the real `ProfileTab` and `MantineDeleteConfirmModal`, with the same doubles as that file's other cases; an account with no password deletes only after typing DELETE, and an account with a password has no typed field. Amendment 8 adds no case. SEC-927-FE-REMEMBER-ALLOW and the sheet's options test expect `size: 'large'` (with `theme: 'filled_black'` in the options test, D19, D20). Every other frontend assertion is rerun unchanged (AC32). Amendment 9: the options test expects `theme: 'outline'` (D24); every other assertion is rerun unchanged (AC35). Amendment 10 (D25): the button's cases use a popup double (`window.open` spy, a `message` from this origin with the attempt's state); SEC-927-FE-ERR-SCRIPT and -ERR-TIMEOUT are removed with the button's script; SEC-927-FE-ERR-POPUP, -ERR-POPUP-TIMEOUT, -POPUP-DENY-ORIGIN, -POPUP-DENY-STATE, -POPUP-CHANNEL, -POPUP-CANCEL and -POPUP-ONCE test `googlePopup` with the real module, and SEC-927-FE-CALLBACK-RELAY, -DENY-NOSTATE, -ERR and -NOLEAK test the real `GoogleCallbackRelay` with `window.opener`, `BroadcastChannel`, `history` and `window.close` as doubles; the One Tap cases keep their GIS double (AC39). |
| Server security | SEC-927-SRV-*: the real `GET` of `src/app/api/auth/me/route.ts` and the real `requireViewer`; `getUser`, the service-role client and `resolveSession` are explicit I/O doubles. SEC-927-SRV-REAUTH-*: the real `initiateEmailChange` and `deleteOwnAccount` of `src/modules/cabinet/actions/index.ts`; the session client's `getClaims`, the admin client and the mailer are explicit I/O doubles, as in Task 923's `reauth.security.test.ts`. Amendment 7 changes no server code: the typed word is a confirmation in the dialog, and the server's recent-sign-in rule still decides. SEC-927-SRV-REAUTH-ALLOW and -DENY are rerun unchanged (AC29, `a7-02`). Amendment 8 changes only the look of Google's button and the slot's height. The ID token, the nonce and the server's checks are unchanged, and the personalized button shows only inside Google's own frame; Task 923's final review reruns the server cases. Amendment 12 (D28): SEC-927-SRV-REAUTH-NOPASSWORD runs the real `getReauthMethod` and `deleteOwnAccount` with the admin client's `rpc` answering `account_has_password`. An account with the `email` provider but no password is asked for Google, never for a password. An account with a password is asked for it whatever its providers. An unreadable answer refuses. The nine server files of R61 answer the function from their providers double and keep their assertions (AC46). |
| Database/integrations | SEC-927-DB-ALLOW (trigger, development database) and SEC-927-PRV-DENY (Supabase Auth refuses a forged token) in `src/lib/auth/googleSignIn.integration.test.ts`, with `createRun` of `src/tests/integration/fixtures.ts` and its verified clean-up. Amendment 12: SEC-927-DB-PASSWORD-ALLOW (the function answers from `auth.users`, also after an address change) and SEC-927-DB-PASSWORD-DENY (a user session and the anonymous client cannot call it), in the same file, run by Opus after the owner's apply. |
| Cases | `tasks/Sprints/Sprint_91_kickoff_prompt_Task_927_Google_Sign_In_Shows_Lero_Al.security.json`. No case is marked critical: a real-boundary allow control would need a live Google account in an automated suite, which no fixture may hold. The owner's native sign-in (AC12) is that control, and the sensitivity proofs of AC2 and AC3 are required regardless. |
| Fixtures and environment | Synthetic credentials and nonces generated per test; integration users `zz_synth_<run>_*@example.com`; the approved development project; verified clean-up; no real Google account, no `.env.local` value printed. |
| Sensitivity proof | AC2 (nonce swap, nonce reuse), AC3 (unsanitized destination) and AC14 (no e-mail comparison, no id check; Amendment 3: the e-mail section's button rendered while the dialog is open): baseline pass, scratch-copy break fails the named assertion, restore passes, artifacts retained. Amendment 5: AC23 (no guest check, no marking of a path the sheet was open on), AC24 (the credential stored, no picture host check) and AC25 (no forget on deletion), the same way. Amendment 7: AC29's `a7-03` (no `typedConfirm` in `ProfileTab.tsx`) fails SEC-927-FE-DELETE-TYPED and is restored to its after-edit hash. Amendment 8: AC33's `a8-06` (no reserved height on the host) brings back the lower `google=empty` frame of the rendered probe and is restored. Amendment 9: AC36's `a9-06` (`mih` in place of `h`) brings back the dialog's rise at Google's swap on `localhost`, and is restored. Amendment 12: AC47's two mutations of `accountHasPassword` (the old providers read; an unreadable answer taken as "no password") each fail SEC-927-SRV-REAUTH-NOPASSWORD and are restored to their `a12-99` hashes. |
| Execution | `cli.mjs receipt`, the targeted files, `cli.mjs verify`; Q4. |

## Rule-compliance ledger

- Claim ledger and evidence: every requirement and AC cites ledger rows; `npm run check:kickoff-evidence` passes.
- Canonical and token: §7; one dated owner exception (D2) for Google's own button; no local visual value.
- Mobile: the record above; rendered proof through the census gate after Task 923.
- Security: the contract above, frontend, server, database and provider cases.
- Amendment 5 (§16): ledger C108–C166 and D12–D16; GR-0 CREATE of `GoogleWelcomeBack` with its direct Story; GR-7 and GR-12 in §16.3; new frontend cases in the contract; the server, database and provider cases are rerun unchanged.
- Amendment 7 (§18): ledger C173–C193 and D17–D18; GR-0 REUSE of `typedConfirm`; inherited mobile record and the GR-3h and GR-3i probe `a7-06`; the frontend case SEC-927-FE-DELETE-TYPED; the server cases are rerun unchanged.
- Amendment 8 (§19): ledger C194–C217 and D19–D22. GR-0 EXTEND of `GoogleSignInSlot`, with a new `theme.ts` token. The mobile record is inherited. Rendered proof: the census, the jump probe, `a5-12` and `a7-06`. The frontend expectations change per D19 and D20; the server is unchanged.
- Amendment 9 (§20): ledger C218–C229 and D23–D24. GR-0 EXTEND of `GoogleSignInSlot`, with the existing token. The rendered proof runs on `localhost`, where Google swaps its button. The frontend expectation follows D24; the server is unchanged.
- Amendment 10 (§21): ledger C230–C260 and D25–D26. GR-0 EXTEND of `GoogleSignInSlot` with the theme's `default` Button and Google's own "G"; one token removed. Rendered proof: the census without exemptions, `rv11-10` (18 failing before), `a5-12` and `a7-06`. New frontend cases for the popup and the callback page; the server is unchanged and rerun.
- Amendment 12 (§23): ledger C273–C288 and D28. No visible change. One service-role-only function (`rv13-11` files, owner apply after Opus's review); `accountHasPassword` reads it; the server case SEC-927-SRV-REAUTH-NOPASSWORD with AC47's sensitivity; the database cases SEC-927-DB-PASSWORD-ALLOW and -DENY after the apply; the frontend cases rerun unchanged.
- Amendment 13 (§24): ledger C289–C297. No visible change and no product code. SEC-927-DB-PASSWORD-ALLOW's no-password user is invited instead of created (F18); Opus runs the integration file after it.
- Git: owner-run only; the working tree's Task 923 lines are not this task's.

KICKOFF EVIDENCE PREFLIGHT COMPLETE — claims: C1, C2, C3, C4, C5, C6, C7, C8, C9, C10, C11, C12, C13, C14, C15, C16, C17, C18, C19, C20, C21, C22, C23, C24, C25, C26, C27, C28, C29, C30, C31, C32, C33, C34, C35, C36, C37, C38, C39, C40, C41, C42, C43, C44, C45, C46, C47, C48, C49, C50, C51, C52, C53, C54, C55, C56, C57, C58, C59, C60, C61, C62, C63, C64, C65, C66, C67, C68, C69, C70, C71, C72, C73, C74, C75, C76, C77, C78, C79, C80, C81, C82, C83, C84, C85, C86, C87, C88, C89, C90, C91, C92, C93, C94, C95, C96, C97, C98, C99, C100, C101, C102, C103, C104, C105, C106, C107, C108, C109, C110, C111, C112, C113, C114, C115, C116, C117, C118, C119, C120, C121, C122, C123, C124, C125, C126, C127, C128, C129, C130, C131, C132, C133, C134, C135, C136, C137, C138, C139, C140, C141, C142, C143, C144, C145, C146, C147, C148, C149, C150, C151, C152, C153, C154, C155, C156, C157, C158, C159, C160, C161, C162, C163, C164, C165, C166; owner decisions: D1, D2, D3, D4, D5, D6, D7, D8, D9, D10, D11, D12, D13, D14, D15, D16; blocked claims: NONE.
