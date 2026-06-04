'use client'

import { useState, useMemo, useTransition, useCallback, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { CheckCircle2, AlertCircle, Loader2, Trash2, AlertTriangle } from 'lucide-react'
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

  // Save status
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  // Delete account dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
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
    const result = await initiateEmailChange({ newEmail: newEmail.trim(), locale })
    if (result.error) {
      setEmailChangeStatus('error')
      setEmailError(result.error)
    } else {
      setPendingEmail(result.pendingEmail ?? newEmail.trim())
      setEmailChangeStatus('pending')
      setNewEmail('')
    }
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

  async function handleDeleteAccount() {
    setDeleting(true)
    setDeleteError(null)
    const result = await deleteOwnAccount()
    setDeleting(false)
    if (result.error) {
      setDeleteError(t('error_deleting'))
      return
    }
    setShowDeleteDialog(false)
    toast.success(t('delete_account_success'))
    // Clear the client auth state before navigating so the header shows the
    // signed-out state immediately on redirect (server-side signOut alone does
    // not trigger a SIGNED_OUT event in the Supabase SDK synchronously).
    signOut(() => router.push(`/${locale}`))
  }

  const deleteConfirmOk = deleteConfirm.trim().toUpperCase() === 'DELETE'

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
        ) : (
          <div className="flex gap-2">
            <Input
              type="email"
              value={newEmail}
              onChange={e => { setNewEmail(e.target.value); setEmailError(null) }}
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
        )}
        {emailError && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3 shrink-0" />{emailError}
          </p>
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
            {t('error_saving')}
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
          onClick={() => setShowDeleteDialog(true)}
        >
          <Trash2 className="h-4 w-4" />
          {t('delete_account')}
        </Button>
      </div>

      {/* ── Delete confirm dialog ───────────────────────────────────────────── */}
      {showDeleteDialog && (
        <Dialog open onOpenChange={open => { if (!open) setShowDeleteDialog(false) }}>
          <DialogContent showCloseButton={false} className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" /> {t('delete_account_title')}
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">{t('delete_account_body')}</p>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">{t('delete_account_type_confirm')}</Label>
                <Input
                  value={deleteConfirm}
                  onChange={e => setDeleteConfirm(e.target.value)}
                  placeholder="DELETE"
                  className="h-10 rounded-xl font-mono"
                  autoComplete="off"
                />
              </div>
              {deleteError && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 shrink-0" />{deleteError}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={deleting}>
                {tc('cancel')}
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={!deleteConfirmOk || deleting}
              >
                {deleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {t('delete_account_confirm')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

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
