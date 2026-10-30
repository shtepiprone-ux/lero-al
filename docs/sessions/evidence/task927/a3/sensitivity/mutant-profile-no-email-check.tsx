// MUTANT (scratch copy of ProfileTab.tsx, never imported by the product): the e-mail comparison of the credential is skipped.
'use client'

import { useState, useMemo, useTransition, useCallback, useEffect, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from '@/lib/toast'
import { CheckCircle2, AlertCircle, Loader2, Trash2, AlertTriangle } from 'lucide-react'
import { Alert, PasswordInput, Stack } from '@mantine/core'
import { MantineDeleteConfirmModal } from '@/design-system/mantine/patterns/MantineDeleteConfirmModal'
import { MantineDialogSection } from '@/design-system/mantine/patterns/MantineDialogSections'
import { signInWithGoogleIdToken } from '@/lib/auth/browser'
import { emailFromCredential } from '@/lib/auth/googleIdentity'
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PhoneField } from '@/components/shared/PhoneField'
import type { PhoneFieldValue } from '@/components/shared/PhoneField'
import { validateNationalPhone, parsePhoneValue } from '@/lib/phone'
import { LocationCombobox } from '@/components/shared/LocationCombobox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AdminUserAvatar } from '@/components/admin/AdminUserAvatar'
import { cn } from '@/lib/utils'
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard'
import {
  updateCabinetProfile,
  deleteOwnAccount,
  getReauthMethod,
  initiateEmailChange,
  resendEmailVerification,
} from '@/modules/cabinet/actions'
import type { User } from '@/types/database'
import { useCurrencies } from '@/modules/currency/hooks/useCurrencies'
import { Combobox } from '@/components/shared/Combobox'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/modules/auth/context/AuthContext'
import { CabinetPasswordSection } from '@/modules/cabinet/components/CabinetPasswordSection'

interface CityOption { id: number; name_al: string; region_id: number | null }
interface RegionOption { id: number; name_al: string }

interface Props {
  profile: User | null
  locale: string
  cities: CityOption[]
  regions: RegionOption[]
  email?: string | null
  onAvatarChange?: (url: string | null) => void
  recentlyViewed?: ReactNode
}

// ── Currency selector — canonical Combobox fed by DB catalog ─────────────────

function CurrencySelector({ value, onChange, labels, fieldLabel }: {
  value: string
  onChange: (v: string) => void
  labels: Record<string, string>
  fieldLabel: string
}) {
  const { currencies } = useCurrencies()
  const options = useMemo(
    () => currencies.filter(c => c.is_active).map(c => ({ value: c.code, label: c.code, description: c.symbol })),
    [currencies],
  )
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm">{fieldLabel}</Label>
      <Combobox
        options={options}
        value={value}
        onChange={onChange}
        variant="button"
        size="sm"
      />
      <p className="text-xs text-muted-foreground">{labels[value] ?? ''}</p>
    </div>
  )
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

// ── Main component ────────────────────────────────────────────────────────────

export function ProfileTab({ profile, locale, cities, regions, email, onAvatarChange, recentlyViewed }: Props) {
  const t = useTranslations('cabinet')
  const tc = useTranslations('common')
  const router = useRouter()
  const { signOut, refreshUser } = useAuth()
  const [isPending, startTransition] = useTransition()

  // Form state
  const [name, setName] = useState(profile?.name ?? '')
  const [phone, setPhone] = useState<PhoneFieldValue>(() => {
    const p = parsePhoneValue(profile?.phone ?? '')
    return { e164: profile?.phone ?? '', dialCode: p.dialCode, iso2: p.iso2, national: p.national }
  })
  const [whatsapp, setWhatsapp] = useState<PhoneFieldValue>(() => {
    const p = parsePhoneValue(profile?.whatsapp ?? '')
    return { e164: profile?.whatsapp ?? '', dialCode: p.dialCode, iso2: p.iso2, national: p.national }
  })
  const [companyName, setCompanyName] = useState(profile?.company_name ?? '')
  const [userType, setUserType] = useState<'private' | 'agent'>(
    profile?.user_type === 'agent' ? 'agent' : 'private',
  )
  const [locationId, setLocationId] = useState<number | null>(profile?.location_id ?? null)
  const [currency, setCurrency] = useState<string>(profile?.preferred_currency ?? 'ALL')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url ?? null)

  // Email change state
  const [newEmail, setNewEmail] = useState('')
  const [pendingEmail, setPendingEmail] = useState<string | null>(profile?.pending_email ?? null)
  const [emailChangeStatus, setEmailChangeStatus] = useState<'idle' | 'pending' | 'sending' | 'error'>('idle')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [emailPassword, setEmailPassword] = useState('')
  const [emailPasswordVisible, setEmailPasswordVisible] = useState(false)
  const [emailNeedsGoogle, setEmailNeedsGoogle] = useState(false)

  // How the person proves who they are before the e-mail change and the deletion (Task 923 R80, D54): the current password, or a new Google sign-in for an account with
  // none. Unknown until the server answers (or when it cannot say): the password field shows, and the server refuses anyone it cannot verify.
  const [reauthMethod, setReauthMethod] = useState<'password' | 'google' | null>(null)
  useEffect(() => {
    let alive = true
    getReauthMethod().then(method => { if (alive) setReauthMethod(method) }).catch(() => undefined)
    return () => { alive = false }
  }, [])

  // Save status
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  // which message the save-error slot shows (Task 923 R100: an over-long name has its own text)
  const [saveErrorKey, setSaveErrorKey] = useState<'error_saving' | 'error_name_too_long'>('error_saving')

  // Delete account dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteFieldError, setDeleteFieldError] = useState<string | null>(null)
  const [deleteNeedsGoogle, setDeleteNeedsGoogle] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Unsaved-changes guard state
  const [showGuardDialog, setShowGuardDialog] = useState(false)
  const [pendingGuardHref, setPendingGuardHref] = useState<string | null>(null)

  // Dirty state: true if any form field differs from the saved profile values
  const isDirty = useMemo(() => {
    if (!profile) return false
    return (
      name !== (profile.name ?? '') ||
      phone.e164 !== (profile.phone ?? '') ||
      whatsapp.e164 !== (profile.whatsapp ?? '') ||
      companyName !== (profile.company_name ?? '') ||
      userType !== (profile.user_type === 'agent' ? 'agent' : 'private') ||
      locationId !== (profile.location_id ?? null) ||
      currency !== (profile.preferred_currency ?? 'ALL')
    )
  }, [name, phone.e164, whatsapp.e164, companyName, userType, locationId, currency, profile])

  const handleShowGuardDialog = useCallback((href: string | null) => {
    setPendingGuardHref(href)
    setShowGuardDialog(true)
  }, [])
  const { confirmLeave } = useUnsavedChangesGuard(isDirty, handleShowGuardDialog)

  async function handleSave() {
    // Country-aware phone validation before any DB write
    let phoneE164: string | null = phone.e164 || null
    if (phone.national) {
      const r = validateNationalPhone({ iso2: phone.iso2, dialCode: phone.dialCode, rawNational: phone.national })
      if (!r.ok) {
        toast.error(t(r.errorKey as Parameters<typeof t>[0]))
        return
      }
      phoneE164 = r.e164
    }
    let whatsappE164: string | null = whatsapp.e164 || null
    if (whatsapp.national) {
      const r = validateNationalPhone({ iso2: whatsapp.iso2, dialCode: whatsapp.dialCode, rawNational: whatsapp.national })
      if (!r.ok) {
        toast.error(t(r.errorKey as Parameters<typeof t>[0]))
        return
      }
      whatsappE164 = r.e164
    }

    setSaveStatus('saving')
    const result = await updateCabinetProfile({
      name,
      phone: phoneE164 ?? undefined,
      whatsapp: whatsappE164 ?? undefined,
      companyName: userType === 'agent' ? companyName : null,
      userType,
      locationId,
      preferredCurrency: currency,
    })
    if (result.error) {
      setSaveErrorKey(result.error === 'name_too_long' ? 'error_name_too_long' : 'error_saving')
      setSaveStatus('error')
    } else {
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 3000)
      // Re-sync auth context so the header chip shows the new name immediately
      // without a full page reload (Task 248 / FF.1 fix).
      refreshUser()
      startTransition(() => router.refresh())
    }
  }

  async function handleEmailChange() {
    if (!newEmail.trim()) return
    if (!EMAIL_RE.test(newEmail.trim())) { setEmailError(t('error_email_invalid')); return }
    setEmailChangeStatus('sending')
    setEmailError(null)
    setEmailNeedsGoogle(false)
    const result = await initiateEmailChange({
      newEmail: newEmail.trim(),
      locale,
      ...(reauthMethod === 'google' ? {} : { currentPassword: emailPassword }),
    })
    if (result.error) {
      setEmailChangeStatus('error')
      setEmailError(result.error)
      // an account with no password (or a Google sign-in older than 10 minutes) proves itself with a new Google sign-in (Task 923 R80)
      if (result.reason === 'reauth_required') setEmailNeedsGoogle(true)
    } else {
      setPendingEmail(result.pendingEmail ?? newEmail.trim())
      setEmailChangeStatus('pending')
      setNewEmail('')
      setEmailPassword('')
    }
  }

  /**
   * The Google confirmation (Task 923 R80, Task 927): Google's own button in a popup, no redirect. The credential is accepted only for this profile's own e-mail (a guard
   * against confirming with another account; the server acts only on the session's own account), the new session must belong to this profile, and then the action the person
   * already asked for is repeated once: the server now lets it through, because the session lists `oauth` within the last 10 minutes.
   */
  async function handleGoogleCredential(
    { credential, nonce }: { credential: string; nonce: string },
    repeat: () => Promise<void>,
    showError: (text: string) => void,
  ) {
    if (emailChangeStatus === 'sending' || deleting) return
    const claimed = emailFromCredential(credential)
    void claimed
    let result: Awaited<ReturnType<typeof signInWithGoogleIdToken>>
    try {
      result = await signInWithGoogleIdToken(credential, nonce)
    } catch {
      showError(t('reauth_google_failed'))
      return
    }
    const signedInId = result.data?.user?.id
    if (result.error || !signedInId) { showError(t('reauth_google_failed')); return }
    // the browser now holds another account's session: nothing is repeated for it
    if (signedInId !== profile?.id) { signOut(() => router.push(`/${locale}`)); return }
    await repeat()
  }

  async function repeatDeleteAfterGoogle() {
    setDeleteNeedsGoogle(false)
    await handleDeleteAccount()
  }

  async function handleResendVerification() {
    setEmailChangeStatus('sending')
    const result = await resendEmailVerification({ locale })
    if (result.error) {
      setEmailChangeStatus('error')
      setEmailError(result.error)
    } else {
      setEmailChangeStatus('pending')
    }
  }

  function openDeleteDialog() {
    setDeletePassword('')
    setDeleteFieldError(null)
    setDeleteError(null)
    setDeleteNeedsGoogle(false)
    setShowDeleteDialog(true)
  }

  async function handleDeleteAccount() {
    setDeleting(true)
    setDeleteError(null)
    setDeleteFieldError(null)
    // Task 923 R80, D54: the account is deleted after the current password (or, for an account with none, a recent Google sign-in) — not after a typed word
    const result = await deleteOwnAccount(reauthMethod === 'google' ? {} : { password: deletePassword })
    setDeleting(false)
    if (result.error) {
      // the proof was refused: the field says so (a wrong password, Auth's own limit) or the Google confirmation appears; nothing was deleted
      if (result.error === 'invalid_password') { setDeleteFieldError(t('password_error_invalid_current')); return }
      if (result.error === 'rate_limited') { setDeleteFieldError(t('password_error_rate_limited')); return }
      if (result.error === 'reauth_required') { setDeleteNeedsGoogle(true); return }
      // N10: profile_deleted_auth_failed means profile is gone but email not freed — never show success.
      const key = result.error === 'profile_deleted_auth_failed'
        ? 'delete_account_auth_failed'
        : 'error_deleting'
      setDeleteError(t(key as Parameters<typeof t>[0]))
      return
    }
    setShowDeleteDialog(false)
    toast.success(t('delete_account_success'))
    // Clear the client auth state before navigating so the header shows the
    // signed-out state immediately on redirect (server-side signOut alone does
    // not trigger a SIGNED_OUT event in the Supabase SDK synchronously).
    signOut(() => router.push(`/${locale}`))
  }

  return (
    <div className="flex flex-col gap-6">

      {/* ── Identity card ─────────────────────────────────────────────────── */}
      <div className="bg-card rounded-2xl border shadow-sm p-6 flex flex-col sm:flex-row gap-6 items-start">
        <div className="flex flex-col items-center gap-1">
          <AdminUserAvatar
            userId={profile?.id ?? null}
            avatarUrl={avatarUrl}
            mode="edit"
            showRemove={false}
            onAvatarChange={url => { setAvatarUrl(url); onAvatarChange?.(url) }}
          />
          {profile?.public_id != null && (
            <span className="text-xs text-muted-foreground/50 font-mono">#{profile.public_id}</span>
          )}
        </div>
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Read-only email identity line — editable email-change control stays below */}
          {email && (
            <p className="sm:col-span-2 text-sm text-muted-foreground break-all">{email}</p>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name" className="text-sm">{t('name')}</Label>
            <Input
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="h-11 rounded-xl"
              placeholder={t('name')}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">{t('user_type_label')}</Label>
            <div className="flex gap-2">
              {(['private', 'agent'] as ('private' | 'agent')[]).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setUserType(type)}
                  className={cn(
                    'flex-1 h-11 rounded-xl border text-sm font-medium transition-all duration-150',
                    userType === type
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-foreground border-border hover:border-primary/50',
                  )}
                >
                  {type === 'private' ? t('user_type_private') : t('user_type_agent')}
                </button>
              ))}
            </div>
          </div>
          {userType === 'agent' && (
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="company" className="text-sm">{t('company_name')}</Label>
              <Input
                id="company"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                className="h-11 rounded-xl"
                placeholder={t('company_name')}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Contact & Location ─────────────────────────────────────────────── */}
      <div className="bg-card rounded-2xl border shadow-sm p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <PhoneField
          label={t('phone')}
          value={phone.e164}
          onChange={setPhone}
        />
        <PhoneField
          label={t('whatsapp')}
          value={whatsapp.e164}
          onChange={setWhatsapp}
        />
        <div className="sm:col-span-2 flex flex-col gap-1.5">
          <Label className="text-sm">{t('city_label')}</Label>
          <LocationCombobox
            locations={cities.map(c => ({
              ...c,
              type: regions.find(r => r.id === c.region_id)?.name_al,
            }))}
            value={locationId ? String(locationId) : ''}
            onChange={id => setLocationId(id ? Number(id) : null)}
            portal
          />
          {(() => {
            const city = cities.find(c => c.id === locationId)
            const region = regions.find(r => r.id === city?.region_id)
            return region ? <p className="text-xs text-muted-foreground">{region.name_al}</p> : null
          })()}
        </div>
      </div>

      {/* ── Currency preference ────────────────────────────────────────────── */}
      <div className="bg-card rounded-2xl border shadow-sm p-6 flex flex-col gap-3">
        <CurrencySelector
          value={currency}
          onChange={setCurrency}
          labels={{
            ALL: t('currency_ALL'),
            EUR: t('currency_EUR'),
            USD: t('currency_USD'),
            GBP: t('currency_GBP'),
          }}
          fieldLabel={t('preferred_currency_label')}
        />
        <p className="text-xs text-muted-foreground">{t('currency_rate_disclaimer')}</p>
      </div>

      {/* ── Email change ───────────────────────────────────────────────────── */}
      <div className="bg-card rounded-2xl border shadow-sm p-6 flex flex-col gap-3">
        <Label className="text-sm font-semibold">{t('email_label')}</Label>
        {email && (
          <p className="text-sm text-muted-foreground">
            {t('email_current_label')}: <span className="font-medium text-foreground">{email}</span>
          </p>
        )}
        {pendingEmail ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              {t('email_change_pending').replace('{email}', pendingEmail)}
            </p>
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={emailChangeStatus === 'sending'}
              className="text-sm text-primary hover:underline disabled:opacity-50 w-fit"
            >
              {emailChangeStatus === 'sending' ? tc('loading') : t('email_change_resend')}
            </button>
          </div>
        ) : reauthMethod === 'google' ? (
          <div className="flex gap-2">
            <Input
              type="email"
              value={newEmail}
              onChange={e => { setNewEmail(e.target.value); setEmailError(null); setEmailNeedsGoogle(false) }}
              placeholder={t('email_change_hint')}
              className="h-11 rounded-xl flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="xl"
              className="rounded-xl shrink-0 max-sm:w-auto"
              onClick={handleEmailChange}
              disabled={!newEmail.trim() || emailChangeStatus === 'sending'}
            >
              {emailChangeStatus === 'sending' ? <Loader2 className="h-4 w-4 animate-spin" /> : tc('save')}
            </Button>
          </div>
        ) : (
          // An account with a password asks for it before the address changes (Task 923 R70 (a), R80): one column — address, current password, the action.
          <Stack gap="sm">
            <Input
              type="email"
              value={newEmail}
              onChange={e => { setNewEmail(e.target.value); setEmailError(null) }}
              placeholder={t('email_change_hint')}
              className="h-11 rounded-xl"
            />
            <PasswordInput
              id="cabinet-email-change-password"
              label={t('password_current_label')}
              value={emailPassword}
              onChange={e => { setEmailPassword(e.currentTarget.value); setEmailError(null) }}
              autoComplete="current-password"
              visible={emailPasswordVisible}
              onVisibilityChange={setEmailPasswordVisible}
              visibilityToggleButtonProps={{ 'aria-label': emailPasswordVisible ? tc('hide_password') : tc('show_password') }}
            />
            <Button
              type="button"
              variant="outline"
              size="xl"
              className="rounded-xl max-sm:w-full sm:self-start"
              onClick={handleEmailChange}
              disabled={!newEmail.trim() || emailPassword === '' || emailChangeStatus === 'sending'}
            >
              {emailChangeStatus === 'sending' ? <Loader2 className="h-4 w-4 animate-spin" /> : tc('save')}
            </Button>
          </Stack>
        )}
        {emailError && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3 shrink-0" />{emailError}
          </p>
        )}
        {/* GIS keeps only the last `initialize` of the page: while the deletion dialog shows its own Google button, this one is not mounted, and it initializes again when the dialog closes. */}
        {emailNeedsGoogle && !showDeleteDialog && (
          <GoogleSignInButton
            clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}
            purpose="reauth"
            loginHint={email ?? undefined}
            onCredential={result => handleGoogleCredential(result, handleEmailChange, setEmailError)}
          />
        )}
      </div>

      {/* ── Save button ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-1">
        {saveStatus === 'saved' && (
          <span className="flex items-center gap-1.5 text-sm text-status-success">
            <CheckCircle2 className="h-4 w-4" />
            {t('profile_updated')}
          </span>
        )}
        {saveStatus === 'error' && (
          <span className="flex items-center gap-1.5 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {t(saveErrorKey)}
          </span>
        )}
        <div className="ml-auto">
          <Button
            size="xl"
            onClick={handleSave}
            disabled={saveStatus === 'saving' || isPending}
            className="px-8 rounded-xl"
          >
            {saveStatus === 'saving' ? t('saving') : t('save_changes')}
          </Button>
        </div>
      </div>

      {/* ── Recently viewed ────────────────────────────────────────────────── */}
      {recentlyViewed && (
        <div className="flex flex-col gap-4">
          {recentlyViewed}
        </div>
      )}

      {/* ── Change password ────────────────────────────────────────────────── */}
      <CabinetPasswordSection />

      {/* ── Danger zone ────────────────────────────────────────────────────── */}
      <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-6 flex flex-col gap-3">
        <p className="text-sm font-semibold text-destructive">{t('delete_account')}</p>
        <p className="text-xs text-muted-foreground">{t('delete_account_body')}</p>
        <Button
          variant="destructive"
          size="sm"
          className="w-fit rounded-xl gap-1.5"
          onClick={openDeleteDialog}
        >
          <Trash2 className="h-4 w-4" />
          {t('delete_account')}
        </Button>
      </div>

      {/* ── Delete confirm dialog ───────────────────────────────────────────── */}
      {/* The canonical destructive confirmation (Task 923 R80, owner decision D54): the current password replaces the typed word; an account with none confirms with Google. */}
      <MantineDeleteConfirmModal
        opened={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        title={t('delete_account_title')}
        message={t('delete_account_body')}
        confirmLabel={t('delete_account_confirm')}
        cancelLabel={tc('cancel')}
        onConfirm={handleDeleteAccount}
        loading={deleting}
        passwordConfirm={reauthMethod === 'google' ? undefined : {
          label: t('delete_account_password_confirm'),
          value: deletePassword,
          onChange: value => { setDeletePassword(value); setDeleteFieldError(null) },
          error: deleteFieldError ?? undefined,
          showLabel: tc('show_password'),
          hideLabel: tc('hide_password'),
        }}
        googleConfirm={deleteNeedsGoogle ? {
          message: t('delete_account_google_required'),
          control: (
            <GoogleSignInButton
              clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}
              purpose="reauth"
              loginHint={email ?? undefined}
              onCredential={result => handleGoogleCredential(result, repeatDeleteAfterGoogle, setDeleteError)}
            />
          ),
        } : undefined}
      >
        {deleteError && (
          <MantineDialogSection>
            <Alert color="red" role="alert">{deleteError}</Alert>
          </MantineDialogSection>
        )}
      </MantineDeleteConfirmModal>

      {/* ── Unsaved-changes confirmation dialog ────────────────────────────── */}
      {showGuardDialog && (
        <Dialog open onOpenChange={open => { if (!open) setShowGuardDialog(false) }}>
          <DialogContent showCloseButton={false} className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-status-warning" />
                {t('unsaved_title')}
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">{t('unsaved_body')}</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowGuardDialog(false)}>
                {t('unsaved_stay')}
              </Button>
              <Button variant="destructive" onClick={() => {
                setShowGuardDialog(false)
                confirmLeave(pendingGuardHref)
              }}>
                {t('unsaved_leave')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
