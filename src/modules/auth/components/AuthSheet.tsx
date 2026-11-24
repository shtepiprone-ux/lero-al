'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useRef } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { signIn } from '@/lib/auth/browser'
import { sanitizeReturnTo } from '@/modules/auth/lib/sanitizeReturnTo'
import { mapAuthError } from '@/modules/auth/lib/mapAuthError'
import { completeGoogleSignIn, openStoredDestination } from '@/modules/auth/lib/googleSignIn'
import type { RememberedGoogleAccount } from '@/lib/auth/rememberedGoogleAccount'
import { logPasswordRecoveryRequest } from '@/modules/auth/actions/recovery'
import { signUpWithCaptcha, requestPasswordResetWithCaptcha } from '@/modules/auth/actions/captcha'
import { CaptchaWidget, type CaptchaWidgetHandle } from '@/components/auth/CaptchaWidget'
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'
import { GoogleWelcomeBack } from '@/components/auth/GoogleWelcomeBack'
import { Alert, Anchor, Box, Button, Divider, Group, InputLabel, PasswordInput, Stack, Text, TextInput, useMantineTheme } from '@mantine/core'
import { MantineCombobox, MantineDrawer, PasswordRequirementsHint } from '@/design-system/mantine/patterns'
import { allPasswordRulesMet } from '@/lib/passwordRules'
import { useLocations } from '@/modules/locations/hooks/useLocations'
import { LocationCombobox } from '@/components/shared/LocationCombobox'
import { useCompanies } from '@/modules/companies/hooks/useCompanies'
import { PhoneField } from '@/components/shared/PhoneField'
import type { PhoneFieldValue } from '@/components/shared/PhoneField'
import { validateNationalPhone } from '@/lib/phone'
import { SITE_URL } from '@/lib/siteUrl'
import { useSessionLostNotice } from '@/modules/auth/lib/useSessionLostNotice'

export type AuthView = 'login' | 'register' | 'register-agent' | 'forgot-password' | 'welcome-back'

interface AuthSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialView?: AuthView
  /** The Google account this device remembers: a sheet opened on `login` then opens on Welcome back (Task 927 Amendment 5). */
  googleAccount?: RememberedGoogleAccount | null
  /** "Forget this account": the owner of the record erases it. */
  onForgetGoogleAccount?: () => void
}

// ── Login view ────────────────────────────────────────────────────────────────

function LoginView({
  onRegister,
  onForgotPassword,
  onClose,
}: {
  onRegister: () => void
  onForgotPassword: () => void
  onClose: () => void
}) {
  const t = useTranslations('auth')
  const tc = useTranslations('common')
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [errorKey, setErrorKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const sessionLost = useSessionLostNotice()
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const widgetRef = useRef<CaptchaWidgetHandle>(null)


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorKey(null)
    if (!email.trim() || !EMAIL_RE.test(email)) { setErrorKey('error_email_invalid'); return }
    if (!password) { setErrorKey('error_weak_password'); return }
    if (!captchaToken) return
    setLoading(true)
    const { error } = await signIn(email, password, captchaToken)
    setLoading(false)
    if (error) {
      // a token is valid once (Task 923 R151): the next attempt needs a new check
      widgetRef.current?.reset()
      setCaptchaToken(null)
      setErrorKey(mapAuthError(error.message))
      return
    }
    onClose()
    // Redirect to the originally-requested route (set by AuthRedirect when gated routes redirect here).
    // sanitizeReturnTo ensures the path is a safe same-origin relative path.
    const next = sanitizeReturnTo(sessionStorage.getItem('auth_redirect_next'))
    if (next) {
      sessionStorage.removeItem('auth_redirect_next')
      router.push(next)
    } else {
      router.refresh()
    }
  }

  // Task 927: Google's window returns the ID token through `/auth/google/callback` to this page (Task 927 D25); it goes to Supabase with this attempt's raw nonce.
  async function handleGoogle(result: { credential: string; nonce: string }) {
    setErrorKey(null)
    const key = await completeGoogleSignIn(result)
    if (key) { setErrorKey(key); return }
    onClose()
    openStoredDestination(router)
  }

  return (
    <Stack component="form" onSubmit={handleSubmit} gap="md" pb="xl">
      {sessionLost && (
        <Alert color="blueLight">{t('session_recovery_message')}</Alert>
      )}
      {errorKey && (
        <Alert color="red">{t(errorKey as Parameters<typeof t>[0])}</Alert>
      )}

      <TextInput
        id="login-email"
        label={t('email')}
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        autoComplete="email"
      />

      <Stack gap="compact">
        <Group justify="space-between" wrap="nowrap">
          <InputLabel htmlFor="login-password">{t('password')}</InputLabel>
          <Anchor component="button" type="button" size="sm" c="brand" onClick={onForgotPassword}>
            {t('forgot_password')}
          </Anchor>
        </Group>
        <PasswordInput
          id="login-password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          visible={passwordVisible}
          onVisibilityChange={setPasswordVisible}
          visibilityToggleButtonProps={{ 'aria-label': passwordVisible ? tc('hide_password') : tc('show_password') }}
        />
      </Stack>

      <CaptchaWidget
        ref={widgetRef}
        onSuccess={token => { setCaptchaToken(token); if (errorKey === 'captcha_error_failed') setErrorKey(null) }}
        onError={() => { setCaptchaToken(null); setErrorKey('captcha_error_failed') }}
        onExpire={() => setCaptchaToken(null)}
      />

      <Button type="submit" fullWidth loading={loading} disabled={loading || !captchaToken}>
        {t('login')}
      </Button>

      <Divider label={<Text span size="sm" c="gray.4" tt="uppercase">{t('or')}</Text>} labelPosition="center" />

      <GoogleSignInButton clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID} onCredential={handleGoogle} />

      <Text ta="center" size="sm" c="dimmed">
        {t('no_account')}{' '}
        <Anchor component="button" type="button" size="sm" c="brand" onClick={onRegister}>
          {t('register')}
        </Anchor>
      </Text>
    </Stack>
  )
}

// ── Welcome back view (Task 927 Amendment 5) ──────────────────────────────────

function WelcomeBackView({
  account,
  onForget,
  onMoreOptions,
  onClose,
}: {
  account: RememberedGoogleAccount
  onForget: () => void
  onMoreOptions: () => void
  onClose: () => void
}) {
  const t = useTranslations('auth')
  const router = useRouter()
  const [errorKey, setErrorKey] = useState<string | null>(null)
  const sessionLost = useSessionLostNotice()


  async function handleGoogle(result: { credential: string; nonce: string }) {
    setErrorKey(null)
    const key = await completeGoogleSignIn(result)
    if (key) { setErrorKey(key); return }
    onClose()
    openStoredDestination(router)
  }

  return (
    <GoogleWelcomeBack
      name={account.name}
      maskedEmail={account.maskedEmail}
      picture={account.picture}
      alerts={
        <>
          {sessionLost && <Alert color="blueLight">{t('session_recovery_message')}</Alert>}
          {errorKey && <Alert color="red">{t(errorKey as Parameters<typeof t>[0])}</Alert>}
        </>
      }
      googleControl={<GoogleSignInButton clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID} loginHint={account.sub} onCredential={handleGoogle} />}
      onForget={onForget}
      onMoreOptions={onMoreOptions}
    />
  )
}

// ── Forgot-password view ──────────────────────────────────────────────────────

function ForgotPasswordView({
  onBack,
}: {
  onBack: () => void
}) {
  const t = useTranslations('auth')
  const locale = useLocale()
  const theme = useMantineTheme()
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [captchaFailed, setCaptchaFailed] = useState(false)
  const widgetRef = useRef<CaptchaWidgetHandle>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!captchaToken) return
    setCaptchaFailed(false)
    setLoading(true)
    const redirectTo = `${SITE_URL}/auth/callback?next=/${locale}/auth/reset-password`
    const result = await requestPasswordResetWithCaptcha({ email, captchaToken, redirectTo })
    void logPasswordRecoveryRequest(email)
    setLoading(false)

    if (!result.ok && result.reason === 'captcha_failed') {
      widgetRef.current?.reset()
      setCaptchaToken(null)
      setCaptchaFailed(true)
      return
    }
    // Always show neutral success — never reveal whether email is registered
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <Stack align="center" gap="md" pb="xl" pt="xs" ta="center">
        <CheckCircle2 size={theme.other.iconSize.hero} color="var(--mantine-color-green-6)" style={{ flexShrink: 0 }} aria-hidden="true" />
        <Text component="h3" fw={600} size="lg">{t('forgot_password_success_title')}</Text>
        <Text size="sm" c="dimmed">{t('forgot_password_success_body')}</Text>
        <Anchor component="button" type="button" size="sm" c="brand" onClick={onBack}>
          {t('forgot_password_back')}
        </Anchor>
      </Stack>
    )
  }

  return (
    <Stack component="form" onSubmit={handleSubmit} gap="md" pb="xl">
      <Text size="sm" c="dimmed">{t('forgot_password_body')}</Text>

      <TextInput
        id="forgot-email"
        label={t('email')}
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        autoComplete="email"
        autoFocus
      />

      {captchaFailed && (
        <Alert color="red">{t('captcha_error_failed')}</Alert>
      )}

      <CaptchaWidget
        ref={widgetRef}
        onSuccess={token => { setCaptchaToken(token); setCaptchaFailed(false) }}
        onError={() => { setCaptchaToken(null); setCaptchaFailed(true) }}
        onExpire={() => setCaptchaToken(null)}
      />

      <Button type="submit" fullWidth loading={loading} disabled={loading || !captchaToken}>
        {t('forgot_password_submit')}
      </Button>

      <Anchor component="button" type="button" size="sm" c="dimmed" ta="center" onClick={onBack}>
        ← {t('forgot_password_back')}
      </Anchor>
    </Stack>
  )
}

// ── Agent city field — isolated so useLocations only mounts when isAgent=true ──

function AgentCityField({
  value,
  onChange,
  label,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  label: string
  placeholder: string
}) {
  const { locations } = useLocations()
  return (
    <Stack gap="compact">
      <InputLabel>{label}</InputLabel>
      <LocationCombobox
        locations={locations}
        value={value}
        onChange={v => onChange(v ?? '')}
        placeholder={placeholder}
        portal
      />
    </Stack>
  )
}

// ── Agent company field — isolated so useCompanies only mounts when isAgent=true ─
// The sign-up only PICKS an existing company (Task 926, owner D1: no company is created during sign-up); the D2 note under the input tells the agent where to create one.

function CompanyField({
  companyId,
  onCompanyId,
  label,
  selectPlaceholder,
  note,
}: {
  companyId: string
  onCompanyId: (id: string) => void
  label: string
  selectPlaceholder: string
  note: string
}) {
  const tc = useTranslations('common')
  const { companies } = useCompanies()

  const options = companies.map(c => ({
    value: c.id,
    label: c.name,
  }))

  return (
    <Stack gap="compact">
      <InputLabel>{label}</InputLabel>
      <MantineCombobox
        options={options}
        value={companyId}
        onChange={onCompanyId}
        placeholder={selectPlaceholder}
        variant="input"
        noResultsLabel={tc('no_results')}
        triggerAriaLabel={label}
        description={note}
      />
    </Stack>
  )
}

// Email validation regex (client-side guard before signUp())
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const DEFAULT_PHONE_VALUE: PhoneFieldValue = { national: '', dialCode: '+355', iso2: 'AL', e164: '' }

interface SharedRegFields {
  name: string
  email: string
  password: string
  phone: PhoneFieldValue
}

// ── Register view ─────────────────────────────────────────────────────────────

function RegisterView({
  isAgent,
  onLogin,
  onAgentRegister,
  onBack,
  onClose,
  initialShared,
  onSharedChange,
}: {
  isAgent: boolean
  onLogin: () => void
  onAgentRegister?: () => void
  onBack?: () => void
  onClose: () => void
  initialShared?: SharedRegFields
  onSharedChange?: (v: SharedRegFields) => void
}) {
  const t = useTranslations('auth')
  const tc = useTranslations('common')
  const locale = useLocale()
  const theme = useMantineTheme()
  const [name, setName] = useState(initialShared?.name ?? '')
  const [email, setEmail] = useState(initialShared?.email ?? '')
  const [phone, setPhone] = useState<PhoneFieldValue>(initialShared?.phone ?? DEFAULT_PHONE_VALUE)
  const [locationId, setLocationId] = useState<string>('')
  const [companyId, setCompanyId] = useState<string>('')
  const [password, setPassword] = useState(initialShared?.password ?? '')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [errorKey, setErrorKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const allPasswordMet = allPasswordRulesMet(password)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const widgetRef = useRef<CaptchaWidgetHandle>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorKey(null)

    if (!name.trim()) { setErrorKey('error_name_required'); return }
    if (!email.trim() || !EMAIL_RE.test(email)) { setErrorKey('error_email_invalid'); return }
    if (!allPasswordRulesMet(password)) { setErrorKey('error_weak_password'); return }
    if (!captchaToken) return

    // Country-aware phone validation (only if a national number was entered)
    let phoneE164: string | undefined
    if (phone.national) {
      const result = validateNationalPhone({ iso2: phone.iso2, dialCode: phone.dialCode, rawNational: phone.national })
      if (!result.ok) { setErrorKey(result.errorKey); return }
      phoneE164 = result.e164
    }

    setLoading(true)
    const result = await signUpWithCaptcha({
      email,
      password,
      captchaToken,
      emailRedirectTo: `${SITE_URL}/auth/callback?next=/${locale}/auth/verified`,
      data: {
        name,
        phone: phoneE164,
        user_type: isAgent ? 'agent' : 'private',
        location_id: isAgent && locationId ? parseInt(locationId, 10) : undefined,
        company_id: isAgent && companyId ? companyId : undefined,
        preferred_locale: locale,
      },
    })
    setLoading(false)
    if (!result.ok) {
      if (result.reason === 'captcha_failed') {
        widgetRef.current?.reset()
        setCaptchaToken(null)
        setErrorKey('captcha_error_failed')
      } else {
        setErrorKey(result.errorKey ?? 'error_generic')
        widgetRef.current?.reset()
        setCaptchaToken(null)
      }
      return
    }
    setSuccess(true)
  }

  if (success) {
    return (
      <Stack align="center" gap="md" pb="xl" pt="xs" ta="center">
        <CheckCircle2 size={theme.other.iconSize.hero} color="var(--mantine-color-green-6)" style={{ flexShrink: 0 }} aria-hidden="true" />
        <Text component="h3" fw={600} size="lg">{t('register_success_title')}</Text>
        <Text size="sm" c="dimmed">{t('register_success_body')}</Text>
        <Button fullWidth mt="xs" onClick={onClose}>
          {t('register_success_go_home')}
        </Button>
      </Stack>
    )
  }

  return (
    <Stack component="form" onSubmit={handleSubmit} gap="md" pb="xl">
      {errorKey && (
        <Alert color="red">{t(errorKey as Parameters<typeof t>[0])}</Alert>
      )}

      {isAgent && onBack && (
        <Anchor component="button" type="button" size="sm" c="dimmed" onClick={onBack}>
          ← {t('register_back_to_standard')}
        </Anchor>
      )}

      <TextInput
        id="reg-name"
        label={t('name')}
        value={name}
        onChange={e => { const v = e.target.value; setName(v); onSharedChange?.({ name: v, email, password, phone }) }}
        required
        autoComplete="name"
      />

      <TextInput
        id="reg-email"
        label={t('email')}
        type="email"
        value={email}
        onChange={e => { const v = e.target.value; setEmail(v); onSharedChange?.({ name, email: v, password, phone }) }}
        required
        autoComplete="email"
      />

      <PhoneField
        value={phone.e164}
        onChange={v => { setPhone(v); onSharedChange?.({ name, email, password, phone: v }) }}
        label={t('phone')}
      />

      {isAgent && (
        <AgentCityField
          value={locationId}
          onChange={setLocationId}
          label={t('city')}
          placeholder={t('city_placeholder')}
        />
      )}

      {isAgent && (
        <CompanyField
          companyId={companyId}
          onCompanyId={setCompanyId}
          label={t('company')}
          selectPlaceholder={t('company_select_placeholder')}
          note={t('company_not_found_hint')}
        />
      )}

      <Stack gap="compact">
        <PasswordInput
          id="reg-password"
          label={t('password')}
          value={password}
          onChange={e => { const v = e.target.value; setPassword(v); onSharedChange?.({ name, email, password: v, phone }) }}
          required
          autoComplete="new-password"
          visible={passwordVisible}
          onVisibilityChange={setPasswordVisible}
          visibilityToggleButtonProps={{ 'aria-label': passwordVisible ? tc('hide_password') : tc('show_password') }}
        />
        <PasswordRequirementsHint value={password} />
      </Stack>

      <CaptchaWidget
        ref={widgetRef}
        onSuccess={token => { setCaptchaToken(token); if (errorKey === 'captcha_error_failed') setErrorKey(null) }}
        onError={() => { setCaptchaToken(null); setErrorKey('captcha_error_failed') }}
        onExpire={() => setCaptchaToken(null)}
      />

      <Button type="submit" fullWidth loading={loading} disabled={loading || !allPasswordMet || !captchaToken}>
        {t('register')}
      </Button>

      <Text ta="center" size="sm" c="dimmed">
        {t('have_account')}{' '}
        <Anchor component="button" type="button" size="sm" c="brand" onClick={onLogin}>
          {t('login')}
        </Anchor>
      </Text>

      {!isAgent && onAgentRegister && (
        <Box>
          <Divider />
          <Box pt="md">
            <Button type="button" variant="default" fullWidth onClick={onAgentRegister}>
              {t('register_agent')}
            </Button>
          </Box>
        </Box>
      )}
    </Stack>
  )
}

// ── AuthSheet ─────────────────────────────────────────────────────────────────

export function AuthSheet({ open, onOpenChange, initialView = 'login', googleAccount = null, onForgetGoogleAccount }: AuthSheetProps) {
  const t = useTranslations('auth')
  // A sheet opened on `login` for a person this device remembers opens on Welcome back; every other opening keeps the view it was asked for.
  const openingView: AuthView = initialView === 'login' && googleAccount ? 'welcome-back' : initialView
  const [view, setView] = useState<AuthView>(openingView)
  const [regShared, setRegShared] = useState<SharedRegFields>({ name: '', email: '', password: '', phone: DEFAULT_PHONE_VALUE })

  // Opening the sheet (or asking for another opening view or account while it is open) starts from the asked view with empty registration values — decided in the
  // render that sees the change, so no frame shows the previous view.
  const [seen, setSeen] = useState({ open, openingView, googleAccount })
  if (seen.open !== open || seen.openingView !== openingView || seen.googleAccount !== googleAccount) {
    setSeen({ open, openingView, googleAccount })
    if (open) {
      setView(openingView)
      setRegShared({ name: '', email: '', password: '', phone: DEFAULT_PHONE_VALUE })
    }
  }

  const titles: Record<AuthView, string> = {
    'welcome-back': t('welcome_back_title'),
    login: t('login'),
    register: t('register'),
    'register-agent': t('register_agent'),
    'forgot-password': t('forgot_password_title'),
  }

  // component="span" (not the Text default of "p") — this node is composed into the shared
  // MantineDrawer's own title slot, which itself sits inside an <h2> (desktop) or an
  // additional <Text> "p" wrapper (mobile ResponsiveBottomSheet) — block-level content would
  // nest invalidly (<p> in <p>, block content in <h2>) and trip a hydration error.
  const drawerTitle = (
    <>
      <Text component="span" fw={600} size="lg">{titles[view]}</Text>
      {view === 'register-agent' && (
        <Text component="span" c="dimmed" size="xs" display="block">
          {t('register_as')} {t('agent')}
        </Text>
      )}
    </>
  )

  return (
    <MantineDrawer opened={open} onClose={() => onOpenChange(false)} title={drawerTitle} side="right" size="sm">
      {view === 'welcome-back' && googleAccount && (
        <WelcomeBackView
          account={googleAccount}
          onMoreOptions={() => setView('login')}
          onForget={() => {
            onForgetGoogleAccount?.()
            setView('login')
          }}
          onClose={() => onOpenChange(false)}
        />
      )}
      {view === 'login' && (
        <LoginView
          onRegister={() => setView('register')}
          onForgotPassword={() => setView('forgot-password')}
          onClose={() => onOpenChange(false)}
        />
      )}
      {view === 'forgot-password' && (
        <ForgotPasswordView
          onBack={() => setView('login')}
        />
      )}
      {view === 'register' && (
        <RegisterView
          isAgent={false}
          onLogin={() => setView('login')}
          onAgentRegister={() => setView('register-agent')}
          onClose={() => onOpenChange(false)}
          initialShared={regShared}
          onSharedChange={setRegShared}
        />
      )}
      {view === 'register-agent' && (
        <RegisterView
          isAgent
          onLogin={() => setView('login')}
          onBack={() => setView('register')}
          onClose={() => onOpenChange(false)}
          initialShared={regShared}
          onSharedChange={setRegShared}
        />
      )}
    </MantineDrawer>
  )
}
