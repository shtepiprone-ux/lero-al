'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Pencil, Trash2, Save, X, ChevronLeft, Loader2,
  ShieldCheck, MapPin, History, AlertTriangle, UserPlus, RotateCcw,
} from 'lucide-react'
import { AdminEditLayout } from '@/components/admin/AdminEditLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AdminInput } from '@/components/admin/AdminInput'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Combobox } from '@/components/shared/Combobox'
import { PhoneField } from '@/components/shared/PhoneField'
import type { PhoneFieldValue } from '@/components/shared/PhoneField'
import { validateNationalPhone, parsePhoneValue } from '@/lib/phone'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AdminUserAvatar } from '@/components/admin/AdminUserAvatar'
import { LocationCombobox } from '@/components/shared/LocationCombobox'
import { DatePicker } from '@/components/shared/DatePicker'
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard'
import {
  updateUserProfileFull, deactivateUser, reactivateUser, hardDeleteUser, addLocation,
  approveLocationRequest, rejectLocationRequest, createAdminUser,
  type ProfileType,
} from '@/modules/admin/actions'
import { clearHistoryRow, clearHistoryForEntity } from '@/modules/admin/actions/clearHistory'
import { Textarea } from '@/components/ui/textarea'
import type { User, UserChangeLog, UserStatusHistory, HistoryClearSource } from '@/types/database'

// ── Types ────────────────────────────────────────────────────────────────────

interface CityOption { id: number; name_al: string; region_id: number | null }
interface RegionOption { id: number; name_al: string }

type UserWithLocation = User & {
  location?: { id: number; name_al: string; region_id: number | null; parent?: { id: number; name_al: string } | null } | null
}

interface Props {
  user: UserWithLocation | null   // null → create mode
  email: string                   // from auth; empty in create mode
  emailConfirmedAt?: string | null
  cities: CityOption[]
  regions: RegionOption[]
  changeLog: UserChangeLog[]
  statusHistory: UserStatusHistory[]
  isAdmin: boolean
  canClearHistory: boolean
}

// ── Constants ────────────────────────────────────────────────────────────────

const PROFILE_TYPES = ['admin', 'moderator', 'private', 'agent', 'developer'] as const
const STATUS_VALUES = ['active', 'blocked', 'inactive'] as const
const STATUS_VARIANT = { active: 'success', blocked: 'destructive', inactive: 'warning' } as const

function initPhoneState(e164: string | null | undefined): PhoneFieldValue {
  const v = e164 ?? ''
  const { dialCode, iso2, national } = parsePhoneValue(v)
  return { e164: v, dialCode, iso2, national }
}

// ── Schema builder ────────────────────────────────────────────────────────────

function buildProfileSchema(t: ReturnType<typeof useTranslations<'admin.user_profile'>>) {
  return z.object({
    firstName:      z.string().min(1, t('validation.firstName_required')),
    lastName:       z.string().min(1, t('validation.lastName_required')),
    profileType:    z.enum(PROFILE_TYPES),
    phone:          z.string(),
    useMainPhone:   z.boolean(),
    whatsapp:       z.string().optional(),
    locationId:     z.number().int().min(1, t('validation.location_required')),
    companyName:    z.string().optional(),
    companyLogoUrl: z.string().optional(),
    website:        z.string().optional(),
    position:       z.string().optional(),
    yearStarted:    z.number().int().min(1900).max(new Date().getFullYear()).nullable().optional(),
    status:         z.enum(STATUS_VALUES),
    blockReason:    z.string().optional(),
    suspendedUntil: z.string().nullish(),
  })
  .refine(d => d.status !== 'blocked' || !!d.blockReason?.trim(),
    { message: t('validation.block_reason_required'), path: ['blockReason'] })
  .refine(d => !['agent', 'developer'].includes(d.profileType) || !!d.companyName?.trim(),
    { message: t('validation.company_name_required'), path: ['companyName'] })
  .refine(d => !['agent', 'developer'].includes(d.profileType) || !!d.website?.trim(),
    { message: t('validation.website_required'), path: ['website'] })
  // Phone/whatsapp validated country-aware in handleCreate/handleSave via validateNationalPhone()
}

type FormValues = {
  firstName: string
  lastName: string
  profileType: typeof PROFILE_TYPES[number]
  phone: string
  useMainPhone: boolean
  whatsapp?: string
  locationId: number
  companyName?: string
  companyLogoUrl?: string
  website?: string
  position?: string
  yearStarted?: number | null
  status: typeof STATUS_VALUES[number]
  blockReason?: string
  suspendedUntil?: string | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function profileTypeFromUser(user: Pick<User, 'role' | 'user_type'>): ProfileType {
  if (user.role === 'admin') return 'admin'
  if (user.role === 'moderator') return 'moderator'
  if (user.role === 'agent') return 'agent'
  if (user.user_type === 'developer') return 'developer'
  return 'private'
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionCard({ title, children, allowOverflow, id }: { title: string; children: React.ReactNode; allowOverflow?: boolean; id?: string }) {
  return (
    <div id={id} className={cn("bg-card rounded-2xl border shadow-sm", allowOverflow ? "overflow-visible" : "overflow-hidden")}>
      <p className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b bg-muted/40">
        {title}
      </p>
      <div className="p-5 flex flex-col gap-4">{children}</div>
    </div>
  )
}

function FieldRow({ label, viewValue, editContent, mode, error }: {
  label: string
  viewValue?: React.ReactNode
  editContent?: React.ReactNode
  mode: 'view' | 'edit' | 'create'
  error?: string
}) {
  const isReadOnly = mode === 'view'
  return (
    <div className="flex flex-col gap-1.5 sm:grid sm:grid-cols-[140px_1fr] sm:gap-3 sm:items-start">
      <span className="text-sm text-muted-foreground sm:pt-2 leading-none">{label}</span>
      <div className="min-w-0">
        {isReadOnly
          ? <span className="text-sm font-medium break-all">{viewValue ?? <span className="text-muted-foreground">—</span>}</span>
          : <div>{editContent}{error && <p className="text-xs text-destructive mt-1">{error}</p>}</div>
        }
      </div>
    </div>
  )
}

// ── Dialogs ───────────────────────────────────────────────────────────────────

function UnsavedChangesDialog({ onLeave, onStay }: { onLeave: () => void; onStay: () => void }) {
  const t = useTranslations('admin.user_profile')
  return (
    <Dialog open onOpenChange={open => { if (!open) onStay() }}>
      <DialogContent showCloseButton={false} className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-status-warning" />
            {t('dialogs.unsaved_title')}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{t('dialogs.unsaved_body')}</p>
        <DialogFooter>
          <Button variant="outline" onClick={onStay}>{t('dialogs.unsaved_stay')}</Button>
          <Button variant="destructive" onClick={onLeave}>{t('dialogs.unsaved_leave')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CancelConfirmDialog({ onConfirm, onReturn }: { onConfirm: () => void; onReturn: () => void }) {
  const t = useTranslations('admin.user_profile')
  return (
    <Dialog open onOpenChange={open => { if (!open) onReturn() }}>
      <DialogContent showCloseButton={false} className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-status-warning" />
            {t('dialogs.cancel_title')}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{t('dialogs.cancel_body')}</p>
        <DialogFooter>
          <Button variant="outline" onClick={onReturn}>{t('dialogs.cancel_return')}</Button>
          <Button variant="destructive" onClick={onConfirm}>{t('dialogs.cancel_confirm')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DeactivateReasonDialog({ userName, reason, onReasonChange, onConfirm, onReturn, loading }: {
  userName: string; reason: string
  onReasonChange: (v: string) => void
  onConfirm: () => void; onReturn: () => void; loading: boolean
}) {
  const t = useTranslations('admin.user_profile')
  return (
    <Dialog open onOpenChange={open => { if (!open) onReturn() }}>
      <DialogContent showCloseButton={false} className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-status-warning">
            <Trash2 className="h-5 w-5" />
            {t('dialogs.deactivate_title')}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 text-sm">
          <p className="text-muted-foreground">{t('dialogs.deactivate_about')}</p>
          <p className="font-semibold">{userName}</p>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium">{t('dialogs.deactivate_reason_label')}</Label>
            <Textarea
              value={reason}
              onChange={e => onReasonChange(e.target.value)}
              placeholder={t('dialogs.deactivate_reason_placeholder')}
              className="resize-none h-20 text-sm"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onReturn} disabled={loading}>{t('dialogs.deactivate_cancel')}</Button>
          <Button
            variant="default"
            className="bg-status-warning text-white hover:bg-status-warning/90"
            onClick={onConfirm}
            disabled={loading || !reason.trim()}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {t('dialogs.deactivate_confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ReactivateReasonDialog({ userName, reason, onReasonChange, onConfirm, onReturn, loading }: {
  userName: string; reason: string
  onReasonChange: (v: string) => void
  onConfirm: () => void; onReturn: () => void; loading: boolean
}) {
  const t = useTranslations('admin.user_profile')
  return (
    <Dialog open onOpenChange={open => { if (!open) onReturn() }}>
      <DialogContent showCloseButton={false} className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-status-success">
            <RotateCcw className="h-5 w-5" />
            {t('dialogs.reactivate_title')}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 text-sm">
          <p className="text-muted-foreground">{t('dialogs.reactivate_about')}</p>
          <p className="font-semibold">{userName}</p>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium">{t('dialogs.reactivate_reason_label')}</Label>
            <Textarea
              value={reason}
              onChange={e => onReasonChange(e.target.value)}
              placeholder={t('dialogs.reactivate_reason_placeholder')}
              className="resize-none h-20 text-sm"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onReturn} disabled={loading}>{t('dialogs.reactivate_cancel')}</Button>
          <Button
            variant="default"
            onClick={onConfirm}
            disabled={loading || !reason.trim()}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {t('dialogs.reactivate_confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DeleteConfirmDialog({ userName, email, onConfirm, onReturn, deleting }: {
  userName: string; email: string
  onConfirm: () => void; onReturn: () => void; deleting: boolean
}) {
  const t = useTranslations('admin.user_profile')
  return (
    <Dialog open onOpenChange={open => { if (!open) onReturn() }}>
      <DialogContent showCloseButton={false} className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            {t('dialogs.delete_hard_title')}
          </DialogTitle>
        </DialogHeader>
        <div className="text-sm space-y-2">
          <p className="text-muted-foreground">{t('dialogs.delete_hard_about')}</p>
          <p className="font-semibold">{userName}</p>
          <p className="text-muted-foreground text-xs">{email}</p>
          <div className="rounded-lg p-3 mt-1 text-xs space-y-1 bg-destructive/10 border border-destructive/20">
            <p className="font-semibold text-destructive">{t('dialogs.delete_hard_warning')}</p>
            <p className="text-muted-foreground">{t('dialogs.delete_hard_point1')}</p>
            <p className="text-muted-foreground">{t('dialogs.delete_shared_point2')}</p>
            <p className="text-muted-foreground">{t('dialogs.delete_hard_point3')}</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onReturn} disabled={deleting}>{t('dialogs.delete_cancel')}</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={deleting}>
            {deleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {t('dialogs.delete_hard_confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ClearHistoryDialog({ scope, onConfirm, onReturn, loading }: {
  scope: 'row' | 'entity'
  onConfirm: () => void; onReturn: () => void; loading: boolean
}) {
  const t = useTranslations('admin.user_profile')
  const isEntity = scope === 'entity'
  return (
    <Dialog open onOpenChange={open => { if (!open) onReturn() }}>
      <DialogContent showCloseButton={false} className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            {isEntity ? t('dialogs.clear_entity_title') : t('dialogs.clear_row_title')}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {isEntity ? t('dialogs.clear_entity_body') : t('dialogs.clear_row_body')}
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={onReturn} disabled={loading}>{t('dialogs.clear_cancel')}</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {t('dialogs.clear_confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Password requirements (create mode) ──────────────────────────────────────

function PasswordInfo() {
  const t = useTranslations('admin.user_profile')
  const rules = [
    t('password_info.rule_length'),
    t('password_info.rule_case'),
    t('password_info.rule_digits'),
    t('password_info.rule_special'),
  ]
  return (
    <div className="bg-muted/50 rounded-xl p-4 border flex flex-col gap-2">
      <p className="text-sm font-medium">{t('password_info.title')}</p>
      <p className="text-xs text-muted-foreground">{t('password_info.body')}</p>
      <ul className="space-y-1 mt-1">
        {rules.map(r => (
          <li key={r} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-status-success shrink-0" />{r}
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export function AdminUserProfile({ user, email: authEmail, emailConfirmedAt, cities, regions, changeLog, statusHistory, isAdmin, canClearHistory }: Props) {
  const router = useRouter()
  const t = useTranslations('admin.user_profile')
  const locale = useLocale()

  // Label maps derived from translations
  const PROFILE_TYPE_LABELS: Record<ProfileType, string> = {
    admin: t('profile_types.admin'),
    moderator: t('profile_types.moderator'),
    private: t('profile_types.private'),
    agent: t('profile_types.agent'),
    developer: t('profile_types.developer'),
  }
  const STATUS_LABELS = {
    active: t('statuses.active'),
    blocked: t('statuses.blocked'),
    inactive: t('statuses.inactive'),
  }

  // Mode derivation — create if no user, otherwise view/edit toggle
  const isCreate = user === null
  const [editActive, setEditActive] = useState(false)
  const currentMode: 'view' | 'edit' | 'create' = isCreate ? 'create' : editActive ? 'edit' : 'view'

  // Dialogs
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false)
  const [showReactivateDialog, setShowReactivateDialog] = useState(false)
  const [deactivateReason, setDeactivateReason] = useState('')
  const [reactivateReason, setReactivateReason] = useState('')
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)
  const [pendingNavHref, setPendingNavHref] = useState<string | null>(null)
  const [clearRowTarget, setClearRowTarget] = useState<{ source: HistoryClearSource; rowId: string } | null>(null)
  const [clearEntitySource, setClearEntitySource] = useState<HistoryClearSource | null>(null)
  const [clearingHistory, setClearingHistory] = useState(false)

  // Async state
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deactivating, setDeactivating] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url ?? null)
  const [pendingAvatarBlob, setPendingAvatarBlob] = useState<Blob | null>(null)

  // Phone state — tracks iso2/dialCode/national for country-aware validation
  const [phoneState, setPhoneState] = useState<PhoneFieldValue>(() => initPhoneState(user?.phone))
  const [whatsappState, setWhatsappState] = useState<PhoneFieldValue>(() => initPhoneState(user?.whatsapp))

  // Email state — editable in create mode only
  const [createEmail, setCreateEmail] = useState('')
  const [createEmailError, setCreateEmailError] = useState<string | null>(null)

  // Location request
  const [reqLoading, setReqLoading] = useState(false)

  // Schema built with runtime translations
  const profileSchema = useMemo(() => buildProfileSchema(t), [t])

  // Form
  const form = useForm<FormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: isCreate
      ? { firstName: '', lastName: '', profileType: 'private', phone: '', useMainPhone: false, whatsapp: '', locationId: undefined as unknown as number, companyName: '', website: '', position: '', yearStarted: undefined, status: 'active' as const, blockReason: '', suspendedUntil: null }
      : {
          firstName: user.name ?? '',
          lastName: user.last_name ?? '',
          profileType: profileTypeFromUser(user),
          phone: user.phone ?? '',
          useMainPhone: !!(user.phone && user.phone === user.whatsapp),
          whatsapp: user.whatsapp ?? '',
          locationId: user.location_id ?? (undefined as unknown as number),
          companyName: user.company_name ?? '',
          companyLogoUrl: user.company_logo_url ?? '',
          website: user.website ?? '',
          position: user.position ?? '',
          yearStarted: user.year_started ?? undefined,
          status: user.status ?? 'active',
          blockReason: user.block_reason ?? '',
          suspendedUntil: user.suspended_until ?? null,
        },
  })

  const { register, handleSubmit, watch, setValue, formState: { errors, isDirty } } = form
  const profileType = watch('profileType')
  const statusValue = watch('status')
  const useMainPhone = watch('useMainPhone')
  const phoneValue = watch('phone')
  const locationIdValue = watch('locationId')

  const isBusiness = ['agent', 'developer'].includes(profileType)
  const displayName = user ? [user.name, user.last_name].filter(Boolean).join(' ') || '—' : ''
  const regionName = regions.find(r => r.id === cities.find(c => c.id === locationIdValue)?.region_id)?.name_al
    ?? user?.location?.parent?.name_al

  const needsGuard = isDirty && currentMode !== 'view'

  const handleShowGuardDialog = useCallback((href: string | null) => {
    setPendingNavHref(href)
    setShowUnsavedDialog(true)
  }, [])
  const { interceptHref, confirmLeave } = useUnsavedChangesGuard(needsGuard, handleShowGuardDialog)

  useEffect(() => {
    if (useMainPhone) { setValue('whatsapp', phoneValue); setWhatsappState(phoneState) }
  }, [useMainPhone, phoneValue, phoneState, setValue])
  useEffect(() => { if (statusValue !== 'blocked') setValue('blockReason', '') }, [statusValue, setValue])
  useEffect(() => {
    if (!isBusiness) { setValue('companyName', ''); setValue('website', ''); setValue('position', ''); setValue('yearStarted', undefined) }
  }, [profileType, isBusiness, setValue])

  // ── Email validation (create mode) ──

  function validateCreateEmail(): boolean {
    const v = createEmail.trim()
    if (!v) { setCreateEmailError(t('validation.email_required')); return false }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { setCreateEmailError(t('validation.email_invalid')); return false }
    setCreateEmailError(null)
    return true
  }

  // ── Handlers ─────────────────────────────────────────────────────────────

  async function handleCreate(data: FormValues) {
    if (!validateCreateEmail()) return
    // Country-aware phone validation before DB write
    if (!phoneState.national) { setSaveError(t('validation.phone_format')); return }
    const pr = validateNationalPhone({ iso2: phoneState.iso2, dialCode: phoneState.dialCode, rawNational: phoneState.national })
    if (!pr.ok) { setSaveError(t(`validation.${pr.errorKey}` as Parameters<typeof t>[0])); return }
    const phoneE164 = pr.e164
    let whatsappE164: string | undefined
    if (!data.useMainPhone && whatsappState.national) {
      const wr = validateNationalPhone({ iso2: whatsappState.iso2, dialCode: whatsappState.dialCode, rawNational: whatsappState.national })
      if (!wr.ok) { setSaveError(t(`validation.${wr.errorKey}` as Parameters<typeof t>[0])); return }
      whatsappE164 = wr.e164
    }
    setSaving(true); setSaveError(null)
    const result = await createAdminUser({
      firstName: data.firstName,
      lastName: data.lastName,
      email: createEmail.trim(),
      profileType: data.profileType,
      phone: phoneE164,
      whatsapp: data.useMainPhone ? phoneE164 : (whatsappE164 || undefined),
      locationId: data.locationId,
      ...(isBusiness && {
        companyName: data.companyName,
        website: data.website,
        position: data.position,
        yearStarted: data.yearStarted ?? null,
      }),
    })
    if (result.error) { setSaveError(result.error); setSaving(false); return }

    if (pendingAvatarBlob && result.userId) {
      console.log('[AvatarFlow] upload_started', { mode: 'create', hasUserId: true })
      try {
        const fd = new FormData()
        fd.append('avatar', new File([pendingAvatarBlob], 'avatar.jpg', { type: 'image/jpeg' }))
        fd.append('userId', result.userId)
        console.log('[AvatarFlow] upload_request_sent', { userId: result.userId })
        const res = await fetch('/api/upload-avatar', { method: 'POST', body: fd })
        const uploadResult = await res.json() as { url?: string; error?: string }
        console.log('[AvatarFlow] upload_response_received', { success: !uploadResult.error, payload: uploadResult })
        if (uploadResult.error) {
          toast.error(t('feedback.avatar_upload_exception'))
        }
      } catch (err) {
        console.log('[AvatarFlow] upload_exception', { error: String(err), mode: 'create', userId: result.userId })
        toast.error(t('feedback.avatar_upload_exception'))
      }
    }

    setSaving(false)
    if (result.userId) router.push(`/admin/users/${result.userId}`)
  }

  async function handleSave(data: FormValues) {
    if (!user) return
    // Country-aware phone validation before DB write
    if (!phoneState.national) { setSaveError(t('validation.phone_format')); return }
    const pr = validateNationalPhone({ iso2: phoneState.iso2, dialCode: phoneState.dialCode, rawNational: phoneState.national })
    if (!pr.ok) { setSaveError(t(`validation.${pr.errorKey}` as Parameters<typeof t>[0])); return }
    const phoneE164 = pr.e164
    let whatsappE164: string | undefined
    if (!data.useMainPhone && whatsappState.national) {
      const wr = validateNationalPhone({ iso2: whatsappState.iso2, dialCode: whatsappState.dialCode, rawNational: whatsappState.national })
      if (!wr.ok) { setSaveError(t(`validation.${wr.errorKey}` as Parameters<typeof t>[0])); return }
      whatsappE164 = wr.e164
    }
    setSaving(true); setSaveError(null)
    const result = await updateUserProfileFull(user.id, {
      firstName: data.firstName, lastName: data.lastName,
      profileType: data.profileType,
      phone: phoneE164,
      whatsapp: data.useMainPhone ? phoneE164 : (whatsappE164 || undefined),
      locationId: data.locationId,
      companyName: data.companyName, companyLogoUrl: data.companyLogoUrl,
      website: data.website, position: data.position, yearStarted: data.yearStarted ?? null,
      status: data.status, blockReason: data.blockReason,
      suspendedUntil: data.suspendedUntil ?? null,
    })
    setSaving(false)
    if (result.error) { setSaveError(result.error); toast.error(t('feedback.save_error')); return }
    toast.success(t('feedback.save_success'))
    form.reset(data)
    setEditActive(false); router.refresh()
  }

  async function handleDelete() {
    if (!user) return
    setDeleting(true)
    const result = await hardDeleteUser(user.id)
    setDeleting(false)
    if (result.error) { setSaveError(t('feedback.save_error')); setShowDeleteDialog(false); return }
    router.push('/admin/users')
  }

  async function handleDeactivate() {
    if (!user) return
    setDeactivating(true)
    const result = await deactivateUser(user.id, deactivateReason)
    setDeactivating(false)
    if (result.error) { toast.error(result.error === 'reason_required' ? t('feedback.reason_required') : t('feedback.save_error')); return }
    toast.success(t('feedback.deactivate_success'))
    setShowDeactivateDialog(false)
    setDeactivateReason('')
    router.refresh()
  }

  async function handleReactivate() {
    if (!user) return
    setDeactivating(true)
    const result = await reactivateUser(user.id, reactivateReason)
    setDeactivating(false)
    if (result.error) { toast.error(result.error === 'reason_required' ? t('feedback.reason_required') : t('feedback.save_error')); return }
    toast.success(t('feedback.reactivate_success'))
    setShowReactivateDialog(false)
    setReactivateReason('')
    router.refresh()
  }

  async function handleClearHistoryRow() {
    if (!clearRowTarget || !user) return
    setClearingHistory(true)
    const result = await clearHistoryRow(clearRowTarget.source, user.id, clearRowTarget.rowId)
    setClearingHistory(false)
    if (result.error) {
      toast.error(result.error === 'forbidden' ? t('feedback.clear_history_forbidden') : t('feedback.clear_history_error'))
      return
    }
    toast.success(t('feedback.clear_history_success'))
    setClearRowTarget(null)
    router.refresh()
  }

  async function handleClearHistoryForEntity() {
    if (!clearEntitySource || !user) return
    setClearingHistory(true)
    const result = await clearHistoryForEntity(clearEntitySource, user.id)
    setClearingHistory(false)
    if (result.error) {
      toast.error(result.error === 'forbidden' ? t('feedback.clear_history_forbidden') : t('feedback.clear_history_error'))
      return
    }
    toast.success(t('feedback.clear_history_success'))
    setClearEntitySource(null)
    router.refresh()
  }

  function handleCancelClick() { setShowCancelDialog(true) }

  function handleConfirmCancel() {
    setShowCancelDialog(false)
    if (isCreate) {
      router.push('/admin/users')
    } else {
      form.reset(); setEditActive(false)
    }
  }

  function handleConfirmLeave() {
    const href = pendingNavHref
    setShowUnsavedDialog(false)
    setPendingNavHref(null)
    confirmLeave(href)
  }

  function handleBlobReady(blob: Blob | null) {
    setPendingAvatarBlob(blob)
  }

  async function handleApproveRequest(locationId: number) {
    if (!user) return
    setReqLoading(true)
    await approveLocationRequest(user.id, locationId)
    setReqLoading(false); router.refresh()
  }

  async function handleRejectRequest() {
    if (!user) return
    setReqLoading(true)
    await rejectLocationRequest(user.id)
    setReqLoading(false); router.refresh()
  }

  const onSubmit = isCreate ? handleCreate : handleSave

  // ── Render ────────────────────────────────────────────────────────────────

  // Sidebar — view mode: actions + quick status overview
  const sidebarView = !isCreate ? (
    <>
      <SectionCard title={t('sections.actions')}>
        <div className="flex flex-col gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 rounded-xl w-full justify-start"
            onClick={() => setEditActive(true)}>
            <Pencil className="h-4 w-4" /> {t('actions.edit_profile')}
          </Button>
          {isAdmin && user?.status !== 'inactive' && (
            <Button variant="outline" size="sm"
              className="gap-1.5 rounded-xl w-full justify-start border-status-warning/40 text-status-warning hover:bg-status-warning/10"
              onClick={() => setShowDeactivateDialog(true)}>
              <Trash2 className="h-4 w-4" /> {t('actions.deactivate_profile')}
            </Button>
          )}
          {isAdmin && user?.status === 'inactive' && (
            <Button variant="outline" size="sm"
              className="gap-1.5 rounded-xl w-full justify-start border-status-success/40 text-status-success hover:bg-status-success/10"
              onClick={() => setShowReactivateDialog(true)}>
              <RotateCcw className="h-4 w-4" /> {t('actions.reactivate_profile')}
            </Button>
          )}
          {isAdmin && (
            <Button variant="outline" size="sm"
              className="gap-1.5 rounded-xl w-full justify-start border-destructive/40 text-destructive hover:bg-destructive/10"
              onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="h-4 w-4" /> {t('actions.delete_permanently')}
            </Button>
          )}
        </div>
      </SectionCard>
      <SectionCard title={t('sections.account_status')}>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">{t('fields.profile_type').replace(' *', '')}</span>
            <Badge variant="neutral" className="text-xs capitalize">
              {PROFILE_TYPE_LABELS[profileTypeFromUser(user!)]}
            </Badge>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">{t('fields.status')}</span>
            <Badge variant={STATUS_VARIANT[(user!.status ?? 'active') as keyof typeof STATUS_VARIANT]} className="text-xs">
              {STATUS_LABELS[(user!.status ?? 'active') as keyof typeof STATUS_LABELS]}
            </Badge>
          </div>
          {user!.status === 'blocked' && user!.suspended_until && (
            <p className="text-xs text-muted-foreground border-t pt-2">
              {t('fields.suspended_until').toLowerCase()}{' '}
              {new Date(user!.suspended_until).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </p>
          )}
          {user!.block_reason && (
            <p className="text-xs text-muted-foreground italic">{user!.block_reason}</p>
          )}
        </div>
      </SectionCard>
    </>
  ) : null

  // Sidebar — edit / create mode: save actions + role & status controls
  const sidebarEdit = (
    <>
      <SectionCard title={t('sections.actions')}>
        <div className="flex flex-col gap-2">
          <Button size="sm" className="gap-1.5 rounded-xl w-full"
            onClick={handleSubmit(onSubmit, errs => {
              if (!errs.firstName && !errs.lastName) {
                if (errs.locationId) document.getElementById('section-location')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                else if (errs.companyName || errs.website) document.getElementById('section-business')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }
            })} disabled={saving || (!isCreate && !isDirty)}>
            {saving
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : isCreate ? <UserPlus className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {isCreate ? t('actions.create_user') : t('actions.save')}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 rounded-xl w-full"
            onClick={handleCancelClick}>
            <X className="h-4 w-4" /> {t('actions.cancel')}
          </Button>
        </div>
      </SectionCard>
      <SectionCard title={t('sections.role_status')} allowOverflow>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">{t('fields.profile_type').replace(' *', '')}</Label>
            <Combobox
              options={PROFILE_TYPES.map(pt => ({ value: pt, label: PROFILE_TYPE_LABELS[pt] }))}
              value={profileType}
              onChange={v => { if (v) setValue('profileType', v as ProfileType, { shouldDirty: true }) }}
              variant="button"
              size="sm"
              disabled={!isAdmin}
            />
            {errors.profileType?.message && <p className="text-xs text-destructive">{errors.profileType.message}</p>}
          </div>
          {!isCreate && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">{t('sections.account_status')}</Label>
              <Combobox
                options={[
                  { value: 'active', label: t('statuses.active') },
                  { value: 'blocked', label: t('statuses.blocked') },
                  { value: 'inactive', label: t('statuses.inactive') },
                ]}
                value={statusValue ?? ''}
                onChange={v => { if (v) setValue('status', v as 'active' | 'blocked' | 'inactive') }}
                variant="button"
                size="sm"
              />
              {errors.status?.message && <p className="text-xs text-destructive">{errors.status.message}</p>}
            </div>
          )}
          {!isCreate && (statusValue === 'blocked' || user?.block_reason) && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">{t('fields.block_reason')}</Label>
              <Input
                {...register('blockReason')}
                className="h-9 rounded-xl text-sm"
                placeholder={t('placeholders.block_reason')}
              />
              {errors.blockReason?.message && <p className="text-xs text-destructive">{errors.blockReason.message}</p>}
            </div>
          )}
          {!isCreate && statusValue === 'blocked' && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">{t('fields.suspended_until')}</Label>
              <DatePicker
                value={watch('suspendedUntil') ?? undefined}
                onChange={v => setValue('suspendedUntil', v ?? null, { shouldDirty: true })}
                placeholder={t('fields.block_permanent')}
              />
            </div>
          )}
        </div>
      </SectionCard>
    </>
  )

  return (
    <div className="flex flex-col gap-4">

      {/* ── Back button — full width above layout ───────────────────────────── */}
      <div className="flex items-center">
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => {
          if (!interceptHref('/admin/users')) return
          router.push('/admin/users')
        }}>
          <ChevronLeft className="h-4 w-4" /> {t('actions.back_to_users')}
        </Button>
      </div>

      {saveError && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 text-sm text-destructive">
          {saveError}
        </div>
      )}

      <AdminEditLayout
        main={
          <div className="flex flex-col gap-6">

            {/* ── Header card ───────────────────────────────────────────────── */}
            <div className="bg-card rounded-2xl border shadow-sm p-5 flex items-start gap-5">
              <AdminUserAvatar
                userId={user?.id ?? null}
                avatarUrl={avatarUrl}
                mode={currentMode}
                onAvatarChange={setAvatarUrl}
                onBlobReady={isCreate ? handleBlobReady : undefined}
              />
              <div className="flex flex-col gap-2 min-w-0 pt-1">
                {isCreate ? (
                  <>
                    <h1 className="text-xl font-bold">{t('header.new_user_title')}</h1>
                    <p className="text-sm text-muted-foreground">{t('header.new_user_subtitle')}</p>
                  </>
                ) : (
                  <>
                    <h1 className="text-xl font-bold leading-tight">{displayName}</h1>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="neutral" className="text-xs capitalize">
                        {PROFILE_TYPE_LABELS[profileTypeFromUser(user!)]}
                      </Badge>
                      <Badge variant={STATUS_VARIANT[(user!.status ?? 'active') as keyof typeof STATUS_VARIANT]} className="text-xs">
                        {STATUS_LABELS[(user!.status ?? 'active') as keyof typeof STATUS_LABELS]}
                      </Badge>
                      {user!.is_verified && (
                        <Badge variant="success" className="text-xs gap-1">
                          <ShieldCheck className="h-3 w-3" /> {t('header.verified_badge')}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{authEmail}</p>
                    {user!.public_id != null && (
                      <p className="text-xs text-muted-foreground/50 font-mono">#{user!.public_id}</p>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* ── Location request card ──────────────────────────────────────── */}
            {user?.location_request && (
              <div className="bg-status-warning/10 border border-status-warning/30 rounded-2xl p-4 flex flex-col gap-3">
                <p className="text-sm font-semibold text-status-warning flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> {t('location_request.title')}
                </p>
                <p className="text-sm">
                  <strong>{user.location_request.city}</strong>
                  {user.location_request.region ? `, ${user.location_request.region}` : ''}
                </p>
                <div className="flex gap-2 items-center flex-wrap">
                  <div className={cn('flex-1 min-w-0', reqLoading && 'pointer-events-none opacity-50')}>
                    <LocationCombobox
                      locations={cities}
                      value=""
                      onChange={id => { if (id) handleApproveRequest(Number(id)) }}
                      placeholder={t('placeholders.city_assign')}
                    />
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs text-destructive hover:bg-destructive/5 shrink-0"
                    onClick={handleRejectRequest} disabled={reqLoading}>
                    {reqLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : t('actions.reject_request')}
                  </Button>
                </div>
              </div>
            )}

            {/* ── Basic info ────────────────────────────────────────────────── */}
            <SectionCard id="section-identity" title={t('sections.basic_info')} allowOverflow>
              {isCreate ? (
                <div className="flex flex-col gap-1.5 sm:grid sm:grid-cols-[140px_1fr] sm:gap-3 sm:items-start">
                  <Label className="text-sm text-muted-foreground sm:pt-2 leading-none">{t('fields.email_create')}</Label>
                  <div className="min-w-0">
                    <AdminInput
                      type="email"
                      value={createEmail}
                      onChange={e => { setCreateEmail(e.target.value); setCreateEmailError(null) }}
                      placeholder="user@example.com"
                    />
                    {createEmailError && <p className="text-xs text-destructive mt-1">{createEmailError}</p>}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5 sm:grid sm:grid-cols-[140px_1fr] sm:gap-3 sm:items-start">
                  <span className="text-sm text-muted-foreground sm:pt-2 leading-none">{t('fields.email')}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium break-all">{authEmail}</span>
                      {emailConfirmedAt !== undefined && (
                        <Badge variant={emailConfirmedAt ? 'success' : 'warning'} className="text-2xs shrink-0">
                          {emailConfirmedAt ? t('fields.email_confirmed') : t('fields.email_not_confirmed')}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('fields.email_immutable')}</p>
                  </div>
                </div>
              )}
              <FieldRow label={t('fields.first_name')} mode={currentMode}
                viewValue={user?.name}
                editContent={<AdminInput {...register('firstName')} placeholder={t('placeholders.first_name')} />}
                error={errors.firstName?.message}
              />
              <FieldRow label={t('fields.last_name')} mode={currentMode}
                viewValue={user?.last_name}
                editContent={<AdminInput {...register('lastName')} placeholder={t('placeholders.last_name')} />}
                error={errors.lastName?.message}
              />
              {/* Profile type shown as read-only; editable in the sidebar Role & Status card */}
              <FieldRow
                label={t('fields.profile_type').replace(' *', '')}
                mode="view"
                viewValue={PROFILE_TYPE_LABELS[profileType]}
              />
            </SectionCard>

            {/* ── Contact ───────────────────────────────────────────────────── */}
            <SectionCard title={t('sections.contact')}>
              <FieldRow label={t('fields.phone')} mode={currentMode}
                viewValue={user?.phone}
                editContent={
                  <PhoneField
                    value={phoneState.e164}
                    onChange={v => { setPhoneState(v); setValue('phone', v.e164, { shouldDirty: true }) }}
                    error={errors.phone?.message}
                    size="sm"
                  />
                }
                error={undefined}
              />
              <FieldRow label={t('fields.whatsapp')} mode={currentMode}
                viewValue={user?.whatsapp}
                editContent={
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox checked={useMainPhone} onCheckedChange={v => setValue('useMainPhone', v === true)} />
                      {t('fields.use_main_phone')}
                    </label>
                    {!useMainPhone && (
                      <PhoneField
                        value={whatsappState.e164}
                        onChange={v => { setWhatsappState(v); setValue('whatsapp', v.e164, { shouldDirty: true }) }}
                        error={errors.whatsapp?.message}
                        size="sm"
                      />
                    )}
                  </div>
                }
              />
            </SectionCard>

            {/* ── Location ──────────────────────────────────────────────────── */}
            <SectionCard id="section-location" title={isBusiness ? t('sections.location_work') : t('sections.location_home')} allowOverflow>
              <FieldRow label={t('fields.city')} mode={currentMode}
                editContent={
                  <LocationCombobox
                    locations={cities}
                    value={locationIdValue ? String(locationIdValue) : ''}
                    onChange={id => setValue('locationId', (id ? Number(id) : undefined) as unknown as number, { shouldValidate: true })}
                    error={errors.locationId?.message}
                    placeholder={t('placeholders.city_search')}
                    regions={isAdmin ? regions : undefined}
                    onAddLocation={isAdmin ? addLocation : undefined}
                  />
                }
                viewValue={
                  <div className="flex flex-col gap-0.5">
                    <span>{user?.location?.name_al ?? '—'}</span>
                    {user?.location?.parent?.name_al && (
                      <span className="text-xs text-muted-foreground">{user.location.parent.name_al}</span>
                    )}
                  </div>
                }
                error={undefined}
              />
              {currentMode !== 'view' && regionName && (
                <FieldRow label={t('fields.region')} mode="view"
                  viewValue={<span className="text-muted-foreground text-sm">{regionName} {t('actions.region_auto')}</span>}
                />
              )}
            </SectionCard>

            {/* ── Business (Agent / Developer) ──────────────────────────────── */}
            {(isBusiness || (currentMode === 'view' && user && ['agent', 'developer'].includes(profileTypeFromUser(user)))) && (
              <SectionCard id="section-business" title={t('sections.company')}>
                <FieldRow label={t('fields.company_name')} mode={currentMode} viewValue={user?.company_name}
                  editContent={<AdminInput {...register('companyName')} placeholder={t('placeholders.company_name')} />}
                  error={errors.companyName?.message}
                />
                <FieldRow label={t('fields.website')} mode={currentMode}
                  viewValue={user?.website ? <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{user.website}</a> : undefined}
                  editContent={<AdminInput {...register('website')} placeholder={t('placeholders.website')} />}
                  error={errors.website?.message}
                />
                <FieldRow label={t('fields.position')} mode={currentMode} viewValue={user?.position}
                  editContent={<AdminInput {...register('position')} placeholder={t('placeholders.position')} />}
                />
                <FieldRow label={t('fields.year_started')} mode={currentMode} viewValue={user?.year_started?.toString()}
                  editContent={
                    <AdminInput {...register('yearStarted', { valueAsNumber: true })} type="number"
                      min={1900} max={new Date().getFullYear()} className="w-32" placeholder="2015" />
                  }
                  error={errors.yearStarted?.message}
                />
              </SectionCard>
            )}

            {/* ── Password info (create mode only) ──────────────────────────── */}
            {isCreate && <PasswordInfo />}

            {/* ── Change history (not shown in create mode) ─────────────────── */}
            {!isCreate && changeLog.length > 0 && (
              <SectionCard title={t('sections.change_log')}>
                {canClearHistory && (
                  <Button
                    type="button" variant="outline"
                    onClick={() => setClearEntitySource('user_change_log')}
                    className="self-start"
                  >
                    <Trash2 className="h-4 w-4" />
                    {t('actions.clear_history')}
                  </Button>
                )}
                <div className="flex flex-col gap-2">
                  {changeLog.map(entry => (
                    <div key={entry.id} className="flex items-start gap-3 text-xs">
                      <History className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="text-muted-foreground">
                          {new Date(entry.changed_at).toLocaleDateString(locale, {
                            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                        {' · '}
                        <span className="font-medium">{PROFILE_TYPE_LABELS[entry.old_value as ProfileType] ?? entry.old_value}</span>{' → '}
                        <span className="font-medium">{PROFILE_TYPE_LABELS[entry.new_value as ProfileType] ?? entry.new_value}</span>
                      </div>
                      {canClearHistory && (
                        <Button
                          type="button" variant="ghost" size="icon-xl"
                          className="text-muted-foreground hover:text-destructive shrink-0"
                          aria-label={t('actions.clear_history_row_aria')}
                          onClick={() => setClearRowTarget({ source: 'user_change_log', rowId: entry.id })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* ── Status history (not shown in create mode) ─────────────────── */}
            {!isCreate && statusHistory.length > 0 && (
              <SectionCard title={t('sections.status_history')}>
                {canClearHistory && (
                  <Button
                    type="button" variant="outline"
                    onClick={() => setClearEntitySource('user_status_history')}
                    className="self-start"
                  >
                    <Trash2 className="h-4 w-4" />
                    {t('actions.clear_history')}
                  </Button>
                )}
                <div className="flex flex-col gap-2">
                  {statusHistory.slice(0, 10).map(entry => (
                    <div key={entry.id} className="flex items-start gap-3 text-xs">
                      <History className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                        <div>
                          <span className="text-muted-foreground">
                            {new Date(entry.changed_at).toLocaleDateString(locale, {
                              day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
                            })}
                          </span>
                          {' · '}
                          <span className="font-medium">{entry.old_status ? t(`statuses.${entry.old_status}` as Parameters<typeof t>[0]) : '—'}</span>{' → '}
                          <span className="font-medium">{t(`statuses.${entry.new_status}` as Parameters<typeof t>[0])}</span>
                        </div>
                        {entry.reason && (
                          <span className="text-muted-foreground">{t('feedback.reason_prefix', { reason: entry.reason })}</span>
                        )}
                      </div>
                      {canClearHistory && (
                        <Button
                          type="button" variant="ghost" size="icon-xl"
                          className="text-muted-foreground hover:text-destructive shrink-0"
                          aria-label={t('actions.clear_history_row_aria')}
                          onClick={() => setClearRowTarget({ source: 'user_status_history', rowId: entry.id })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}
          </div>
        }
        sidebar={currentMode === 'view' ? sidebarView : sidebarEdit}
      />

      {/* ── Dialogs ─────────────────────────────────────────────────────────── */}
      {showCancelDialog && (
        <CancelConfirmDialog onConfirm={handleConfirmCancel} onReturn={() => setShowCancelDialog(false)} />
      )}
      {showDeactivateDialog && user && (
        <DeactivateReasonDialog
          userName={displayName}
          reason={deactivateReason}
          onReasonChange={setDeactivateReason}
          onConfirm={handleDeactivate}
          onReturn={() => { setShowDeactivateDialog(false); setDeactivateReason('') }}
          loading={deactivating}
        />
      )}
      {showReactivateDialog && user && (
        <ReactivateReasonDialog
          userName={displayName}
          reason={reactivateReason}
          onReasonChange={setReactivateReason}
          onConfirm={handleReactivate}
          onReturn={() => { setShowReactivateDialog(false); setReactivateReason('') }}
          loading={deactivating}
        />
      )}
      {showDeleteDialog && user && (
        <DeleteConfirmDialog
          userName={displayName} email={authEmail}
          onConfirm={handleDelete} onReturn={() => setShowDeleteDialog(false)} deleting={deleting}
        />
      )}
      {showUnsavedDialog && (
        <UnsavedChangesDialog
          onLeave={handleConfirmLeave}
          onStay={() => { setShowUnsavedDialog(false); setPendingNavHref(null) }}
        />
      )}
      {clearRowTarget && (
        <ClearHistoryDialog
          scope="row"
          onConfirm={handleClearHistoryRow}
          onReturn={() => setClearRowTarget(null)}
          loading={clearingHistory}
        />
      )}
      {clearEntitySource && (
        <ClearHistoryDialog
          scope="entity"
          onConfirm={handleClearHistoryForEntity}
          onReturn={() => setClearEntitySource(null)}
          loading={clearingHistory}
        />
      )}
    </div>
  )
}
