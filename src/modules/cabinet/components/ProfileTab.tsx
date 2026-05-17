'use client'

import { useRef, useState, useMemo, useTransition, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { CheckCircle2, AlertCircle, Loader2, MapPin, Trash2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Combobox } from '@/components/shared/Combobox'
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
import type { User, PreferredCurrency } from '@/types/database'
import { useRouter } from 'next/navigation'

const COUNTRY_CODES = [
  { code: '+355', flag: '🇦🇱' }, { code: '+380', flag: '🇺🇦' },
  { code: '+39', flag: '🇮🇹' }, { code: '+44', flag: '🇬🇧' },
  { code: '+1', flag: '🇺🇸' }, { code: '+49', flag: '🇩🇪' },
  { code: '+33', flag: '🇫🇷' }, { code: '+90', flag: '🇹🇷' },
  { code: '+383', flag: '🇽🇰' }, { code: '+382', flag: '🇲🇪' },
  { code: '+387', flag: '🇧🇦' }, { code: '+381', flag: '🇷🇸' },
  { code: '+389', flag: '🇲🇰' },
]

interface CityOption { id: number; name_al: string; region_id: number | null }
interface RegionOption { id: number; name_al: string }

interface Props {
  profile: User | null
  locale: string
  cities: CityOption[]
  regions: RegionOption[]
  email?: string | null
  onAvatarChange?: (url: string | null) => void
}

// ── Phone input sub-component ─────────────────────────────────────────────────

function parsePhone(val: string) {
  const match = COUNTRY_CODES.find(c => val.startsWith(c.code))
  return match
    ? { code: match.code, local: val.slice(match.code.length) }
    : { code: '+355', local: val.replace(/^\+/, '') }
}

function PhoneField({ label, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void
}) {
  const [code, setCode] = useState(() => parsePhone(value).code)
  const [local, setLocal] = useState(() => parsePhone(value).local)

  function update(c: string, l: string) {
    setCode(c); setLocal(l)
    onChange(`${c}${l.replace(/\s/g, '')}`)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm">{label}</Label>
      <div className="flex gap-2">
        <Combobox
          options={COUNTRY_CODES.map(c => ({ value: c.code, label: `${c.flag} ${c.code}` }))}
          value={code}
          onChange={c => { if (c) update(c, local) }}
          variant="button"
          size="default"
          className="w-24 shrink-0"
          triggerClassName="w-24 shrink-0"
        />
        <Input
          value={local}
          onChange={e => update(code, e.target.value)}
          placeholder="69 123 456"
          className="h-11 rounded-xl"
        />
      </div>
    </div>
  )
}

// ── Settlement combobox sub-component ────────────────────────────────────────

function SettlementCombobox({ cities, regions, value, onChange, label }: {
  cities: CityOption[]
  regions: RegionOption[]
  value: number | null
  onChange: (id: number | null) => void
  label: string
}) {
  const tc = useTranslations('common')
  const t = useTranslations('cabinet')
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  const [mounted, setMounted] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Track client mount for portal
  useEffect(() => { setMounted(true) }, [])

  const MAX_H = 192 // 12rem — matches Tailwind max-h-48

  // Viewport-aware position: opens downward or upward, clamps maxHeight to available space.
  const updatePosition = useCallback(() => {
    if (!inputRef.current) return
    const rect = inputRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top

    if (spaceBelow >= Math.min(MAX_H, 120) || spaceBelow >= spaceAbove) {
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        maxHeight: Math.min(MAX_H, spaceBelow - 8),
        zIndex: 9999,
        overflowY: 'auto',
      })
    } else {
      setDropdownStyle({
        position: 'fixed',
        bottom: window.innerHeight - rect.top + 4,
        left: rect.left,
        width: rect.width,
        maxHeight: Math.min(MAX_H, spaceAbove - 8),
        zIndex: 9999,
        overflowY: 'auto',
      })
    }
  }, [])

  useEffect(() => {
    if (!open) return
    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [open, updatePosition])

  const selected = cities.find(c => c.id === value)
  const region = regions.find(r => r.id === selected?.region_id)

  const filtered = useMemo(() => {
    if (!search.trim()) return cities.slice(0, 20)
    const q = search.toLowerCase()
    return cities.filter(c => c.name_al.toLowerCase().includes(q)).slice(0, 20)
  }, [cities, search])

  const dropdown = open && mounted ? createPortal(
    <div
      style={dropdownStyle}
      className="bg-popover border rounded-xl shadow-lg"
    >
      {filtered.length === 0
        ? <p className="px-3 py-2 text-sm text-muted-foreground">{tc('no_results')}</p>
        : filtered.map(c => (
            <button
              key={c.id}
              type="button"
              className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors ${value === c.id ? 'bg-primary/10 text-primary font-medium' : ''}`}
              onMouseDown={() => { onChange(c.id); setSearch(''); setOpen(false) }}
            >
              {c.name_al}
              {regions.find(r => r.id === c.region_id) && (
                <span className="ml-2 text-xs text-muted-foreground">{regions.find(r => r.id === c.region_id)?.name_al}</span>
              )}
            </button>
          ))}
    </div>,
    document.body,
  ) : null

  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm">{label}</Label>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
        <input
          ref={inputRef}
          type="text"
          value={selected ? selected.name_al : search}
          onChange={e => { setSearch(e.target.value); if (selected) onChange(null); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 180)}
          placeholder={t('city_search_placeholder')}
          className="w-full h-11 pl-9 pr-3 text-sm bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      {region && <p className="text-xs text-muted-foreground">{region.name_al}</p>}
      {dropdown}
    </div>
  )
}

// ── Currency combobox sub-component ──────────────────────────────────────────

const CURRENCY_OPTIONS: { value: PreferredCurrency; symbol: string }[] = [
  { value: 'ALL', symbol: 'L' },
  { value: 'EUR', symbol: '€' },
  { value: 'USD', symbol: '$' },
  { value: 'GBP', symbol: '£' },
]

function CurrencySelector({ value, onChange, labels, fieldLabel }: {
  value: PreferredCurrency
  onChange: (v: PreferredCurrency) => void
  labels: Record<PreferredCurrency, string>
  fieldLabel: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm">{fieldLabel}</Label>
      <div className="grid grid-cols-4 gap-2">
        {CURRENCY_OPTIONS.map(({ value: cur, symbol }) => (
          <button
            key={cur}
            type="button"
            onClick={() => onChange(cur)}
            className={cn(
              'h-11 rounded-xl border text-sm font-medium transition-all duration-150 flex flex-col items-center justify-center gap-0',
              value === cur
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-foreground border-border hover:border-primary/50',
            )}
          >
            <span className="text-base leading-none">{symbol}</span>
            <span className="text-[10px] leading-tight opacity-70">{cur}</span>
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{labels[value]}</p>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function ProfileTab({ profile, locale, cities, regions, email, onAvatarChange }: Props) {
  const t = useTranslations('cabinet')
  const tc = useTranslations('common')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Form state
  const [name, setName] = useState(profile?.name ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [whatsapp, setWhatsapp] = useState(profile?.whatsapp ?? '')
  const [companyName, setCompanyName] = useState(profile?.company_name ?? '')
  const [userType, setUserType] = useState<'private' | 'agent'>(
    profile?.user_type === 'agent' ? 'agent' : 'private',
  )
  const [locationId, setLocationId] = useState<number | null>(profile?.location_id ?? null)
  const [currency, setCurrency] = useState<PreferredCurrency>(profile?.preferred_currency ?? 'ALL')
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
      phone !== (profile.phone ?? '') ||
      whatsapp !== (profile.whatsapp ?? '') ||
      companyName !== (profile.company_name ?? '') ||
      userType !== (profile.user_type === 'agent' ? 'agent' : 'private') ||
      locationId !== (profile.location_id ?? null) ||
      currency !== (profile.preferred_currency ?? 'ALL')
    )
  }, [name, phone, whatsapp, companyName, userType, locationId, currency, profile])

  const handleShowGuardDialog = useCallback((href: string | null) => {
    setPendingGuardHref(href)
    setShowGuardDialog(true)
  }, [])
  const { interceptHref, confirmLeave } = useUnsavedChangesGuard(isDirty, handleShowGuardDialog)

  async function handleSave() {
    setSaveStatus('saving')
    const result = await updateCabinetProfile({
      name,
      phone,
      whatsapp,
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
      startTransition(() => router.refresh())
    }
  }

  async function handleEmailChange() {
    if (!newEmail.trim()) return
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
      setDeleteError(result.error)
      return
    }
    setShowDeleteDialog(false)
    toast.success(t('delete_account_success'))
    router.push(`/${locale}`)
  }

  const deleteConfirmOk = deleteConfirm.trim().toUpperCase() === 'DELETE'

  return (
    <div className="flex flex-col gap-6">

      {/* ── Identity card ─────────────────────────────────────────────────── */}
      <div className="bg-card rounded-2xl border shadow-sm p-6 flex flex-col sm:flex-row gap-6 items-start">
        <AdminUserAvatar
          userId={profile?.id ?? null}
          avatarUrl={avatarUrl}
          mode="edit"
          showRemove={false}
          onAvatarChange={url => { setAvatarUrl(url); onAvatarChange?.(url) }}
        />
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          value={phone}
          onChange={setPhone}
        />
        <PhoneField
          label={t('whatsapp')}
          value={whatsapp}
          onChange={setWhatsapp}
        />
        <div className="sm:col-span-2">
          <SettlementCombobox
            cities={cities}
            regions={regions}
            value={locationId}
            onChange={setLocationId}
            label={t('city_label')}
          />
        </div>
      </div>

      {/* ── Currency preference ────────────────────────────────────────────── */}
      <div className="bg-card rounded-2xl border shadow-sm p-6">
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
              className="h-11 rounded-xl shrink-0"
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
            onClick={handleSave}
            disabled={saveStatus === 'saving' || isPending}
            className="h-11 px-8 rounded-xl"
          >
            {saveStatus === 'saving' ? t('saving') : t('save_changes')}
          </Button>
        </div>
      </div>

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
