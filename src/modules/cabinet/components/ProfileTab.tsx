'use client'

import { useRef, useState, useMemo, useTransition, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { CheckCircle2, AlertCircle, Camera, UserCircle2, Loader2, MapPin, Trash2, AlertTriangle } from 'lucide-react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AppImage } from '@/components/ui/AppImage'
import { cn } from '@/lib/utils'
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard'
import {
  updateCabinetProfile,
  deleteOwnAccount,
  uploadCabinetAvatar,
  initiateEmailChange,
  resendEmailVerification,
} from '@/modules/cabinet/actions'
import type { User, PreferredCurrency } from '@/types/database'
import { useRouter } from 'next/navigation'

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_SOURCE_BYTES = 10 * 1024 * 1024  // 10 MB — source file before crop
const MIN_AVATAR_DIM = 256                  // minimum source dimension
const VALID_AVATAR_MIME = ['image/jpeg', 'image/png', 'image/webp']

// ── Lazy crop modal (loads only when user picks a file) ───────────────────────

const AvatarCropModal = dynamic(
  () => import('@/components/shared/AvatarCropModal').then(m => m.AvatarCropModal),
  { ssr: false },
)

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
        <Select value={code} onValueChange={c => { if (c) update(c, local) }}>
          <SelectTrigger variant="outline" size="sm" className="w-24 h-11 shrink-0 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COUNTRY_CODES.map(c => (
              <SelectItem key={c.code} value={c.code}>{c.flag} {c.code}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  const [mounted, setMounted] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Track client mount for portal
  useEffect(() => { setMounted(true) }, [])

  // Recompute dropdown position whenever it opens
  useEffect(() => {
    if (!open || !inputRef.current) return
    const rect = inputRef.current.getBoundingClientRect()
    setDropdownStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    })
  }, [open])

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
      className="bg-popover border rounded-xl shadow-lg max-h-48 overflow-y-auto"
    >
      {filtered.length === 0
        ? <p className="px-3 py-2 text-sm text-muted-foreground">Nuk ka rezultate</p>
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
          placeholder="Kërko qytetin..."
          className="w-full h-11 pl-9 pr-3 text-sm bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      {region && <p className="text-xs text-muted-foreground">{region.name_al}</p>}
      {dropdown}
    </div>
  )
}

// ── Currency combobox sub-component ──────────────────────────────────────────

function CurrencySelector({ value, onChange, labelAll, labelEur, fieldLabel }: {
  value: PreferredCurrency
  onChange: (v: PreferredCurrency) => void
  labelAll: string
  labelEur: string
  fieldLabel: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm">{fieldLabel}</Label>
      <div className="flex gap-2">
        {(['ALL', 'EUR'] as PreferredCurrency[]).map(cur => (
          <button
            key={cur}
            type="button"
            onClick={() => onChange(cur)}
            className={cn(
              'flex-1 h-11 rounded-xl border text-sm font-medium transition-all duration-150',
              value === cur
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-foreground border-border hover:border-primary/50',
            )}
          >
            {cur === 'ALL' ? labelAll : labelEur}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Avatar upload sub-component ───────────────────────────────────────────────

async function validateSourceImage(file: File): Promise<{ w: number; h: number; error?: 'unreadable' }> {
  return new Promise(resolve => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ w: img.naturalWidth, h: img.naturalHeight })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve({ w: 0, h: 0, error: 'unreadable' })
    }
    img.src = url
  })
}

function AvatarUpload({ currentUrl, onUpload }: {
  currentUrl: string | null
  onUpload: (url: string | null) => void
}) {
  const t = useTranslations('cabinet')
  const tc = useTranslations('common')
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [url, setUrl] = useState(currentUrl)
  const [cropSrc, setCropSrc] = useState<string | null>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setError(null)

    console.log('[AvatarFlow] file_selected', {
      route: window.location.pathname,
      mode: 'cabinet',
      mime: file.type,
      size: file.size,
    })

    if (!VALID_AVATAR_MIME.includes(file.type)) { setError(t('avatar_error_type')); return }
    if (file.size > MAX_SOURCE_BYTES) { setError(t('avatar_error_size')); return }

    const { w, h, error: imgError } = await validateSourceImage(file)
    if (imgError === 'unreadable') { setError(t('avatar_error_unreadable')); return }
    if (w < MIN_AVATAR_DIM || h < MIN_AVATAR_DIM) { setError(t('avatar_error_too_small')); return }

    console.log('[AvatarFlow] file_selected', {
      route: window.location.pathname,
      mode: 'cabinet',
      mime: file.type,
      size: file.size,
      dimensions: `${w}×${h}`,
    })

    setCropSrc(URL.createObjectURL(file))
    console.log('[AvatarFlow] crop_modal_open', { mode: 'cabinet' })
  }

  // Restored original FormData/File upload contract (Task 11 stable baseline).
  async function handleCropConfirm(blob: Blob): Promise<void> {
    console.log('[AvatarFlow] crop_save_clicked', { mode: 'cabinet' })
    console.log('[AvatarFlow] crop_blob_created', { mime: blob.type, size: blob.size })
    setUploading(true)
    console.log('[AvatarFlow] upload_started', { mode: 'cabinet', endpoint: 'uploadCabinetAvatar' })
    try {
      const fd = new FormData()
      fd.append('avatar', new File([blob], 'avatar.jpg', { type: 'image/jpeg' }))
      console.log('[AvatarFlow] upload_request_sent', { mode: 'cabinet' })
      const result = await uploadCabinetAvatar(fd)
      console.log('[AvatarFlow] upload_response_received', { success: !result.error, payload: result })
      if (result.error) {
        // ERROR: toast above modal — modal stays open for retry
        toast.error(result.error)
        return
      }
      // SUCCESS ONLY: close modal and update preview
      const src = cropSrc
      setCropSrc(null)
      setUrl(result.url ?? null)
      onUpload(result.url ?? null)
      if (src) URL.revokeObjectURL(src)
      console.log('[AvatarFlow] avatar_state_updated', { avatarUrl: result.url, mode: 'cabinet' })
    } catch (err) {
      console.log('[AvatarFlow] upload_exception', { error: String(err), mode: 'cabinet' })
      toast.error(t('avatar_upload_error'))
      // ERROR: modal stays open (cropSrc unchanged)
    } finally {
      setUploading(false)
    }
  }

  function handleCropCancel() {
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
    setError(null)
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <div
          className="h-20 w-20 rounded-full overflow-hidden border-2 border-border bg-muted flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => inputRef.current?.click()}
        >
          {url
            ? <AppImage src={url} variant="avatar" alt="Avatar" priority={false} />
            : <UserCircle2 className="h-10 w-10 text-muted-foreground" />
          }
        </div>
        {uploading
          ? <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center"><Loader2 className="h-5 w-5 text-white animate-spin" /></div>
          : <button type="button" onClick={() => inputRef.current?.click()} className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md"><Camera className="h-3 w-3" /></button>
        }
      </div>
      <div className="flex gap-2 text-xs">
        <button type="button" onClick={() => inputRef.current?.click()} className="text-primary hover:underline">
          {url ? t('avatar_replace') : t('avatar_upload')}
        </button>
      </div>
      <p className="text-[10px] text-muted-foreground text-center max-w-[120px]">{t('avatar_hint')}</p>
      {error && <p className="text-xs text-destructive text-center max-w-[140px]">{error}</p>}
      <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handleFile} />
      {cropSrc && (
        <AvatarCropModal
          imageSrc={cropSrc}
          title={t('avatar_crop_title')}
          hint={t('avatar_crop_hint')}
          zoomLabel={t('avatar_zoom_label')}
          cancelLabel={tc('cancel')}
          saveLabel={tc('save')}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function ProfileTab({ profile, locale, cities, regions }: Props) {
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
        <AvatarUpload currentUrl={avatarUrl} onUpload={setAvatarUrl} />
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
          labelAll={t('currency_ALL')}
          labelEur={t('currency_EUR')}
          fieldLabel={t('preferred_currency_label')}
        />
      </div>

      {/* ── Email change ───────────────────────────────────────────────────── */}
      <div className="bg-card rounded-2xl border shadow-sm p-6 flex flex-col gap-3">
        <Label className="text-sm font-semibold">{t('email_label')}</Label>
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
