'use client'

import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useRef } from 'react'
import { CheckCircle2, ImagePlus } from 'lucide-react'
import { signIn, signInWithOAuth } from '@/lib/auth/browser'
import { sanitizeReturnTo } from '@/modules/auth/lib/sanitizeReturnTo'
import { AUTH_SESSION_LOST_KEY } from '@/modules/auth/components/AuthRedirect'
import { logPasswordRecoveryRequest } from '@/modules/auth/actions/recovery'
import { signUpWithCaptcha, requestPasswordResetWithCaptcha } from '@/modules/auth/actions/captcha'
import { CaptchaWidget, type CaptchaWidgetHandle } from '@/components/auth/CaptchaWidget'
import { Button, PasswordInput, Text, TextInput } from '@mantine/core'
import { MantineDrawer } from '@/design-system/mantine/patterns'
import { Label } from '@/components/ui/label'
import { PasswordRequirementsHint, allPasswordRulesMet } from '@/components/ui/PasswordRequirementsHint'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useLocations } from '@/modules/locations/hooks/useLocations'
import { LocationCombobox } from '@/components/shared/LocationCombobox'
import { useCompanies } from '@/modules/companies/hooks/useCompanies'
import { createCompanyAction } from '@/modules/companies/actions'
import { Combobox } from '@/components/shared/Combobox'
import { PhoneField } from '@/components/shared/PhoneField'
import type { PhoneFieldValue } from '@/components/shared/PhoneField'
import { validateNationalPhone } from '@/lib/phone'
import { SITE_URL } from '@/lib/siteUrl'

export type AuthView = 'login' | 'register' | 'register-agent' | 'forgot-password'

interface AuthSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialView?: AuthView
}

// Map Supabase error messages → stable i18n keys (Epic A error-code contract)
function mapAuthError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials') || m.includes('invalid credentials')) return 'error_invalid_credentials'
  if (m.includes('user already registered') || m.includes('already registered') || m.includes('already exists')) return 'error_email_exists'
  if (m.includes('password should be at least') || m.includes('weak password')) return 'error_weak_password'
  if (m.includes('email not confirmed') || m.includes('not confirmed')) return 'error_email_not_confirmed'
  if (m.includes('rate limit') || m.includes('too many')) return 'error_rate_limit'
  return 'error_generic'
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
  const [sessionLost, setSessionLost] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem(AUTH_SESSION_LOST_KEY) === 'true') {
      setSessionLost(true)
      sessionStorage.removeItem(AUTH_SESSION_LOST_KEY)
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorKey(null)
    if (!email.trim() || !EMAIL_RE.test(email)) { setErrorKey('error_email_invalid'); return }
    if (!password) { setErrorKey('error_weak_password'); return }
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) { setErrorKey(mapAuthError(error.message)); return }
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

  async function handleGoogle() {
    await signInWithOAuth('google', `${SITE_URL}/auth/callback`)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 pb-6">
      {sessionLost && (
        <Alert>
          <AlertDescription>{t('session_recovery_message')}</AlertDescription>
        </Alert>
      )}
      {errorKey && (
        <Alert variant="destructive">
          <AlertDescription>{t(errorKey as Parameters<typeof t>[0])}</AlertDescription>
        </Alert>
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

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="login-password">{t('password')}</Label>
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            {t('forgot_password')}
          </button>
        </div>
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
      </div>

      <Button type="submit" fullWidth loading={loading} disabled={loading}>
        {t('login')}
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-popover px-2 text-muted-foreground">{t('or')}</span>
        </div>
      </div>

      <Button
        type="button"
        variant="default"
        fullWidth
        onClick={handleGoogle}
        leftSection={
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        }
      >
        Google
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t('no_account')}{' '}
        <button
          type="button"
          onClick={onRegister}
          className="text-primary underline font-medium hover:text-primary/80 transition-colors"
        >
          {t('register')}
        </button>
      </p>
    </form>
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
      <div className="flex flex-col items-center gap-4 pb-6 pt-2 text-center">
        <CheckCircle2 className="h-12 w-12 text-status-success shrink-0" aria-hidden="true" />
        <h3 className="font-semibold text-lg">{t('forgot_password_success_title')}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{t('forgot_password_success_body')}</p>
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-primary underline font-medium hover:text-primary/80 transition-colors"
        >
          {t('forgot_password_back')}
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 pb-6">
      <p className="text-sm text-muted-foreground">{t('forgot_password_body')}</p>

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
        <Alert variant="destructive">
          <AlertDescription>{t('captcha_error_failed')}</AlertDescription>
        </Alert>
      )}

      <div className="my-3">
        <CaptchaWidget
          ref={widgetRef}
          onSuccess={token => { setCaptchaToken(token); setCaptchaFailed(false) }}
          onError={() => { setCaptchaToken(null); setCaptchaFailed(true) }}
          onExpire={() => setCaptchaToken(null)}
        />
      </div>

      <Button type="submit" fullWidth loading={loading} disabled={loading || !captchaToken}>
        {t('forgot_password_submit')}
      </Button>

      <button
        type="button"
        onClick={onBack}
        className="text-sm text-muted-foreground hover:text-primary transition-colors text-center"
      >
        ← {t('forgot_password_back')}
      </button>
    </form>
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
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <LocationCombobox
        locations={locations}
        value={value}
        onChange={v => onChange(v ?? '')}
        placeholder={placeholder}
        portal
      />
    </div>
  )
}

// ── Agent company field — isolated so useCompanies only mounts when isAgent=true ─

function CompanyField({
  companyId,
  onCompanyId,
  label,
  selectPlaceholder,
  addNewLabel,
}: {
  companyId: string
  onCompanyId: (id: string) => void
  label: string
  selectPlaceholder: string
  addNewLabel: string
}) {
  const t = useTranslations('auth')
  const tc = useTranslations('common')
  const { companies } = useCompanies()
  const logoInputRef = useRef<HTMLInputElement>(null)

  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoError, setLogoError] = useState<string | null>(null)

  const options = companies.map(c => ({
    value: c.id,
    label: c.name,
    description: c.logo_url ? '📷' : undefined,
  }))

  function handleLogoSelect(file: File) {
    setLogoError(null)
    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setLogoError(t('company_logo_invalid_type'))
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setLogoError(t('company_logo_too_large'))
      return
    }
    // Check dimensions via Image
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      if (img.naturalWidth > 256 || img.naturalHeight > 256) {
        setLogoError(t('company_logo_too_big'))
        URL.revokeObjectURL(url)
        return
      }
      setLogoFile(file)
      setLogoPreview(url)
    }
    img.onerror = () => {
      setLogoError(t('company_logo_invalid_type'))
      URL.revokeObjectURL(url)
    }
    img.src = url
  }

  async function handleCreate() {
    if (!newName.trim() || creating) return
    setCreating(true)
    const result = await createCompanyAction(newName.trim())
    if (!result.id) {
      setCreating(false)
      return
    }
    // Upload logo if selected
    if (logoFile) {
      try {
        const fd = new FormData()
        fd.append('logo', logoFile)
        fd.append('companyId', result.id)
        await fetch('/api/upload-company-logo', { method: 'POST', body: fd })
      } catch {
        // Logo upload failure is non-fatal — company is created successfully
      }
    }
    setCreating(false)
    onCompanyId(result.id)
    setShowAdd(false)
    setNewName('')
    setLogoFile(null)
    if (logoPreview) { URL.revokeObjectURL(logoPreview); setLogoPreview(null) }
    setLogoError(null)
  }

  function handleCancel() {
    setShowAdd(false)
    setNewName('')
    setLogoFile(null)
    if (logoPreview) { URL.revokeObjectURL(logoPreview); setLogoPreview(null) }
    setLogoError(null)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <Combobox
        options={options}
        value={companyId}
        onChange={onCompanyId}
        placeholder={selectPlaceholder}
        variant="input"
        portal
      />
      {!showAdd ? (
        <Button
          type="button"
          variant="transparent"
          onClick={() => setShowAdd(true)}
          styles={{ inner: { justifyContent: 'flex-start' } }}
        >
          + {addNewLabel}
        </Button>
      ) : (
        <div className="border rounded-xl p-3 flex flex-col gap-2 bg-muted/30">
          <TextInput
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder={label}
            maxLength={120}
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCreate() } }}
          />

          {/* Logo upload */}
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">{t('company_logo')}</Label>
            <div className="flex items-center gap-2">
              {logoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoPreview}
                  alt="logo preview"
                  className="h-9 w-9 rounded-lg object-contain border bg-card shrink-0"
                />
              ) : (
                <div className="h-9 w-9 rounded-lg border bg-card flex items-center justify-center shrink-0">
                  <ImagePlus className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              <Button
                type="button"
                variant="default"
                size="xs"
                onClick={() => logoInputRef.current?.click()}
              >
                {logoFile ? tc('replace') : tc('choose_file')}
              </Button>
              {logoFile && (
                <Button
                  type="button"
                  variant="subtle"
                  size="xs"
                  onClick={() => {
                    setLogoFile(null)
                    if (logoPreview) { URL.revokeObjectURL(logoPreview); setLogoPreview(null) }
                    setLogoError(null)
                  }}
                >
                  ×
                </Button>
              )}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0]
                  if (f) handleLogoSelect(f)
                  e.target.value = ''
                }}
              />
            </div>
            {logoError ? (
              <p className="text-xs text-destructive">{logoError}</p>
            ) : (
              <p className="text-[10px] text-muted-foreground">{t('company_logo_hint')}</p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <Button
              type="button"
              size="sm"
              onClick={handleCreate}
              disabled={!newName.trim() || creating}
              loading={creating}
            >
              {tc('add')}
            </Button>
            <Button
              type="button"
              variant="subtle"
              size="sm"
              onClick={handleCancel}
            >
              {tc('cancel')}
            </Button>
          </div>
        </div>
      )}
    </div>
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
        setErrorKey(result.supabaseErrorMessage ? mapAuthError(result.supabaseErrorMessage) : 'error_generic')
        widgetRef.current?.reset()
        setCaptchaToken(null)
      }
      return
    }
    setSuccess(true)
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 pb-6 pt-2 text-center">
        <CheckCircle2 className="h-12 w-12 text-status-success shrink-0" aria-hidden="true" />
        <h3 className="font-semibold text-lg">{t('register_success_title')}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{t('register_success_body')}</p>
        <Button fullWidth className="mt-2" onClick={onClose}>
          {t('register_success_go_home')}
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 pb-6">
      {errorKey && (
        <Alert variant="destructive">
          <AlertDescription>{t(errorKey as Parameters<typeof t>[0])}</AlertDescription>
        </Alert>
      )}

      {isAgent && onBack && (
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-muted-foreground hover:text-primary transition-colors -mt-1 text-left"
        >
          ← {t('register_back_to_standard')}
        </button>
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
          addNewLabel={t('company_add_new')}
        />
      )}

      <div className="flex flex-col gap-1.5">
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
      </div>

      <div className="my-3">
        <CaptchaWidget
          ref={widgetRef}
          onSuccess={token => { setCaptchaToken(token); if (errorKey === 'captcha_error_failed') setErrorKey(null) }}
          onError={() => { setCaptchaToken(null); setErrorKey('captcha_error_failed') }}
          onExpire={() => setCaptchaToken(null)}
        />
      </div>

      <Button type="submit" fullWidth loading={loading} disabled={loading || !allPasswordMet || !captchaToken}>
        {t('register')}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t('have_account')}{' '}
        <button
          type="button"
          onClick={onLogin}
          className="text-primary underline font-medium hover:text-primary/80 transition-colors"
        >
          {t('login')}
        </button>
      </p>

      {!isAgent && onAgentRegister && (
        <div className="border-t pt-4">
          <Button type="button" variant="default" fullWidth onClick={onAgentRegister}>
            {t('register_agent')}
          </Button>
        </div>
      )}
    </form>
  )
}

// ── AuthSheet ─────────────────────────────────────────────────────────────────

export function AuthSheet({ open, onOpenChange, initialView = 'login' }: AuthSheetProps) {
  const t = useTranslations('auth')
  const [view, setView] = useState<AuthView>(initialView)
  const [regShared, setRegShared] = useState<SharedRegFields>({ name: '', email: '', password: '', phone: DEFAULT_PHONE_VALUE })

  useEffect(() => {
    if (open) {
      setView(initialView)
      setRegShared({ name: '', email: '', password: '', phone: DEFAULT_PHONE_VALUE })
    }
  }, [open, initialView])

  const titles: Record<AuthView, string> = {
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
        <Text component="span" c="dimmed" size="xs" style={{ display: 'block' }}>
          {t('register_as')} {t('agent')}
        </Text>
      )}
    </>
  )

  return (
    <MantineDrawer opened={open} onClose={() => onOpenChange(false)} title={drawerTitle} side="right" size="sm">
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
