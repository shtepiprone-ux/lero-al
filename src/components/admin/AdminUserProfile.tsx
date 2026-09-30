'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import type { UseFormSetValue } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from '@/lib/toast'
import type { PhoneFieldValue } from '@/components/shared/PhoneField'
import { validateNationalPhone, parsePhoneValue } from '@/lib/phone'
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard'
import {
  updateUserProfileFull, deactivateUser, reactivateUser, hardDeleteUser, addLocation,
  approveLocationRequest, rejectLocationRequest, createAdminUser,
} from '@/modules/admin/actions'
import { clearHistoryRow, clearHistoryForEntity } from '@/modules/admin/actions/clearHistory'
import type { UserChangeLog, UserStatusHistory, HistoryClearSource } from '@/types/database'
import {
  AdminUserProfileView,
  PROFILE_TYPES,
  STATUS_VALUES,
  profileTypeFromUser,
  type AdminUserProfileErrors,
  type AdminUserProfileFormValues,
  type CityOption,
  type RegionOption,
  type UserWithLocation,
} from '@/components/admin/AdminUserProfileView'
import { AdminUserProfileDialogsView, type AdminUserProfileDialog } from '@/components/admin/AdminUserProfileDialogsView'
import { AdminUserAvatarField } from '@/components/admin/AdminUserAvatarField'

// ── Types ────────────────────────────────────────────────────────────────────

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
  // Pre-formatted on the server to prevent SSR/CSR Intl locale-data divergence (sq ICU mismatch).
  // When provided, these strings are rendered verbatim — no client-side Intl call.
  changeLogDates?: Record<string, string>
  statusHistoryDates?: Record<string, string>
  suspendedUntilFormatted?: string | null
}

type FormValues = AdminUserProfileFormValues

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

// The options each control passed to `setValue` before the View split (typed inputs: register semantics;
// `profileType`/`phone`/`whatsapp`/`suspendedUntil`: dirty; `locationId`: validate; `useMainPhone`: none; `status`: dirty since Task 893 R17).
const FIELD_OPTIONS: { [K in keyof FormValues]?: Parameters<UseFormSetValue<FormValues>>[2] } = {
  profileType: { shouldDirty: true },
  status: { shouldDirty: true },
  useMainPhone: {},
  phone: { shouldDirty: true },
  whatsapp: { shouldDirty: true },
  locationId: { shouldValidate: true },
  suspendedUntil: { shouldDirty: true },
}

// ── Main Component ────────────────────────────────────────────────────────────

export function AdminUserProfile({ user, email: authEmail, emailConfirmedAt, cities, regions, changeLog, statusHistory, isAdmin, canClearHistory, changeLogDates, statusHistoryDates, suspendedUntilFormatted }: Props) {
  const router = useRouter()
  const t = useTranslations('admin.user_profile')

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

  const { handleSubmit, watch, setValue, formState: { errors, isDirty, isSubmitted } } = form
  const profileType = watch('profileType')
  const statusValue = watch('status')
  const useMainPhone = watch('useMainPhone')
  const phoneValue = watch('phone')
  const values = watch()

  const isBusiness = ['agent', 'developer'].includes(profileType)
  const displayName = user ? [user.name, user.last_name].filter(Boolean).join(' ') || '—' : ''

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
    if (result.cleared === 0) {
      toast.info(t('feedback.clear_history_noop'))
      setClearRowTarget(null)
      router.refresh()
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
    if (result.cleared === 0) {
      toast.info(t('feedback.clear_history_noop'))
      setClearEntitySource(null)
      router.refresh()
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

  function handleFieldChange<K extends keyof FormValues>(field: K, value: FormValues[K]) {
    const options = FIELD_OPTIONS[field] ?? { shouldDirty: true, shouldTouch: true, shouldValidate: isSubmitted }
    // `value` is `FormValues[K]` by the View's own signature; RHF's path-value type cannot resolve a generic `K`.
    setValue(field, value as never, options)
  }

  const viewErrors: AdminUserProfileErrors = {
    firstName: errors.firstName?.message,
    lastName: errors.lastName?.message,
    profileType: errors.profileType?.message,
    phone: errors.phone?.message,
    whatsapp: errors.whatsapp?.message,
    locationId: errors.locationId?.message,
    companyName: errors.companyName?.message,
    website: errors.website?.message,
    yearStarted: errors.yearStarted?.message,
    status: errors.status?.message,
    blockReason: errors.blockReason?.message,
  }

  function handleInvalidSubmit(errs: typeof errors) {
    if (!errs.firstName && !errs.lastName) {
      if (errs.locationId) document.getElementById('section-location')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      else if (errs.companyName || errs.website) document.getElementById('section-business')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const dialog: AdminUserProfileDialog | null =
    showUnsavedDialog ? 'unsaved'
    : clearRowTarget ? 'clear-row'
    : clearEntitySource ? 'clear-entity'
    : showDeleteDialog && user ? 'delete'
    : showDeactivateDialog && user ? 'deactivate'
    : showReactivateDialog && user ? 'reactivate'
    : showCancelDialog ? 'cancel'
    : null

  function handleDialogConfirm() {
    switch (dialog) {
      case 'unsaved': handleConfirmLeave(); break
      case 'cancel': handleConfirmCancel(); break
      case 'deactivate': void handleDeactivate(); break
      case 'reactivate': void handleReactivate(); break
      case 'delete': void handleDelete(); break
      case 'clear-row': void handleClearHistoryRow(); break
      case 'clear-entity': void handleClearHistoryForEntity(); break
    }
  }

  function handleDialogClose() {
    switch (dialog) {
      case 'unsaved': setShowUnsavedDialog(false); setPendingNavHref(null); break
      case 'cancel': setShowCancelDialog(false); break
      case 'deactivate': setShowDeactivateDialog(false); setDeactivateReason(''); break
      case 'reactivate': setShowReactivateDialog(false); setReactivateReason(''); break
      case 'delete': setShowDeleteDialog(false); break
      case 'clear-row': setClearRowTarget(null); break
      case 'clear-entity': setClearEntitySource(null); break
    }
  }

  const dialogLoading =
    dialog === 'delete' ? deleting
    : dialog === 'deactivate' || dialog === 'reactivate' ? deactivating
    : dialog === 'clear-row' || dialog === 'clear-entity' ? clearingHistory
    : false

  return (
    <>
      <AdminUserProfileView
        mode={currentMode}
        user={user}
        email={authEmail}
        emailConfirmedAt={emailConfirmedAt}
        cities={cities}
        regions={regions}
        changeLog={changeLog}
        statusHistory={statusHistory}
        isAdmin={isAdmin}
        canClearHistory={canClearHistory}
        changeLogDates={changeLogDates}
        statusHistoryDates={statusHistoryDates}
        suspendedUntilFormatted={suspendedUntilFormatted}
        values={values}
        errors={viewErrors}
        onFieldChange={handleFieldChange}
        phoneE164={phoneState.e164}
        whatsappE164={whatsappState.e164}
        onPhoneChange={v => { setPhoneState(v); setValue('phone', v.e164, { shouldDirty: true }) }}
        onWhatsappChange={v => { setWhatsappState(v); setValue('whatsapp', v.e164, { shouldDirty: true }) }}
        createEmail={createEmail}
        createEmailError={createEmailError}
        onCreateEmailChange={v => { setCreateEmail(v); setCreateEmailError(null) }}
        saving={saving}
        saveError={saveError}
        isDirty={isDirty}
        avatar={
          <AdminUserAvatarField
            userId={user?.id ?? null}
            avatarUrl={avatarUrl}
            mode={currentMode}
            onAvatarChange={setAvatarUrl}
            onBlobReady={isCreate ? handleBlobReady : undefined}
          />
        }
        locationRequestLoading={reqLoading}
        onApproveLocationRequest={handleApproveRequest}
        onRejectLocationRequest={handleRejectRequest}
        onAddLocation={isAdmin ? addLocation : undefined}
        onBack={() => {
          if (!interceptHref('/admin/users')) return
          router.push('/admin/users')
        }}
        onEdit={() => setEditActive(true)}
        onSave={handleSubmit(onSubmit, handleInvalidSubmit)}
        onCancel={handleCancelClick}
        onDeactivate={() => setShowDeactivateDialog(true)}
        onReactivate={() => setShowReactivateDialog(true)}
        onDelete={() => setShowDeleteDialog(true)}
        onClearHistory={(source: HistoryClearSource) => setClearEntitySource(source)}
        onClearHistoryRow={(source: HistoryClearSource, rowId: string) => setClearRowTarget({ source, rowId })}
      />
      <AdminUserProfileDialogsView
        dialog={dialog}
        userName={displayName}
        email={authEmail}
        reason={dialog === 'reactivate' ? reactivateReason : deactivateReason}
        onReasonChange={dialog === 'reactivate' ? setReactivateReason : setDeactivateReason}
        loading={dialogLoading}
        onConfirm={handleDialogConfirm}
        onClose={handleDialogClose}
      />
    </>
  )
}
