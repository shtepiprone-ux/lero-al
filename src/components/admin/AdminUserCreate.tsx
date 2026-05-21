'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import {
  Loader2, ChevronLeft, UserPlus, Mail, CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Combobox } from '@/components/shared/Combobox'
import { PhoneField } from '@/components/shared/PhoneField'
import type { PhoneFieldValue } from '@/components/shared/PhoneField'
import { validateNationalPhone } from '@/lib/phone'
import { Checkbox } from '@/components/ui/checkbox'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { LocationCombobox } from '@/components/shared/LocationCombobox'
import { createAdminUser, addLocation, type ProfileType } from '@/modules/admin/actions'

// ── Types ────────────────────────────────────────────────────────────────────

interface CityOption { id: number; name_al: string; region_id: number | null }
interface RegionOption { id: number; name_al: string }

interface Props {
  cities: CityOption[]
  regions: RegionOption[]
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PROFILE_TYPES = ['admin', 'moderator', 'private', 'agent', 'developer'] as const

const DEFAULT_PHONE: PhoneFieldValue = { national: '', dialCode: '+355', iso2: 'AL', e164: '' }

// ── Schema builder ─────────────────────────────────────────────────────────────

function buildCreateSchema(t: ReturnType<typeof useTranslations<'admin.user_profile'>>) {
  return z.object({
    firstName:    z.string().min(1, t('validation.firstName_required')),
    lastName:     z.string().optional(),
    email:        z.string().email(t('validation.email_invalid')),
    profileType:  z.enum(PROFILE_TYPES),
    phone:        z.string(),
    useMainPhone: z.boolean(),
    whatsapp:     z.string().optional(),
    locationId:   z.number().min(1, t('validation.location_required')),
  })
  // Phone and whatsapp are validated country-aware in onSubmit via validateNationalPhone()
}

type FormValues = {
  firstName: string
  lastName?: string
  email: string
  profileType: typeof PROFILE_TYPES[number]
  phone: string
  useMainPhone: boolean
  whatsapp?: string
  locationId: number
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PasswordRequirements({ t }: { t: ReturnType<typeof useTranslations<'admin.user_profile'>> }) {
  const requirements = [
    t('password_info.rule_length'),
    t('password_info.rule_case'),
    t('password_info.rule_digits'),
    t('password_info.rule_special'),
  ]
  return (
    <div className="bg-muted/50 rounded-xl p-4 border">
      <div className="flex items-center gap-2 mb-2">
        <Mail className="h-4 w-4 text-primary" />
        <p className="text-sm font-medium">{t('password_info.title')}</p>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        {t('password_info.body')}
      </p>
      <p className="text-xs font-semibold mb-1.5">{t('password_info.requirements_title')}</p>
      <ul className="space-y-1">
        {requirements.map(r => (
          <li key={r} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 text-status-success shrink-0" />
            {r}
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export function AdminUserCreate({ cities, regions }: Props) {
  const router = useRouter()
  const t = useTranslations('admin.user_profile')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [phoneState, setPhoneState] = useState<PhoneFieldValue>(DEFAULT_PHONE)
  const [whatsappState, setWhatsappState] = useState<PhoneFieldValue>(DEFAULT_PHONE)

  const schema = useMemo(() => buildCreateSchema(t), [t])

  const profileTypeOptions = useMemo(
    () => PROFILE_TYPES.map(pt => ({ value: pt, label: t(`profile_types.${pt}` as `profile_types.${typeof PROFILE_TYPES[number]}`) })),
    [t],
  )

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      profileType: 'private',
      phone: '',
      useMainPhone: false,
      whatsapp: '',
      locationId: undefined,
    },
  })

  const useMainPhone = watch('useMainPhone')
  const phoneValue = watch('phone')
  const locationIdValue = watch('locationId')

  useEffect(() => {
    if (useMainPhone) {
      setValue('whatsapp', phoneValue)
      setWhatsappState(phoneState)
    }
  }, [useMainPhone, phoneValue, phoneState, setValue])

  async function onSubmit(data: FormValues) {
    setError(null)

    // Country-aware phone validation before DB write
    if (!phoneState.national) { setError(t('validation.phone_format')); return }
    const phoneResult = validateNationalPhone({ iso2: phoneState.iso2, dialCode: phoneState.dialCode, rawNational: phoneState.national })
    if (!phoneResult.ok) { setError(t(`validation.${phoneResult.errorKey}` as Parameters<typeof t>[0])); return }
    const phoneE164 = phoneResult.e164

    let whatsappE164: string | undefined
    if (!data.useMainPhone && whatsappState.national) {
      const waResult = validateNationalPhone({ iso2: whatsappState.iso2, dialCode: whatsappState.dialCode, rawNational: whatsappState.national })
      if (!waResult.ok) { setError(t(`validation.${waResult.errorKey}` as Parameters<typeof t>[0])); return }
      whatsappE164 = waResult.e164
    }

    setSubmitting(true)
    const result = await createAdminUser({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      profileType: data.profileType,
      phone: phoneE164,
      whatsapp: data.useMainPhone ? phoneE164 : (whatsappE164 || undefined),
      locationId: data.locationId,
    })
    setSubmitting(false)
    if (result.error) { setError(result.error); return }
    if (result.userId) router.push(`/admin/users/${result.userId}`)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => router.push('/admin/users')}>
          <ChevronLeft className="h-4 w-4" /> {t('actions.back_to_users')}
        </Button>
      </div>

      <AdminPageHeader
        title={t('header.new_user_title')}
        subtitle={t('header.new_user_subtitle')}
      />

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">

        {/* Basic */}
        <div className="bg-card rounded-2xl border shadow-sm overflow-visible">
          <p className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b bg-muted/40">
            {t('sections.basic_info')}
          </p>
          <div className="p-5 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="firstName" className="text-sm">{t('fields.first_name')}</Label>
                <Input id="firstName" {...register('firstName')} className="h-10 rounded-xl" placeholder={t('placeholders.first_name')} />
                {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="lastName" className="text-sm">{t('fields.last_name_optional')}</Label>
                <Input id="lastName" {...register('lastName')} className="h-10 rounded-xl" placeholder={t('placeholders.last_name')} />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="text-sm">{t('fields.email_create')}</Label>
              <Input id="email" type="email" {...register('email')} className="h-10 rounded-xl" placeholder="user@example.com" />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">{t('fields.profile_type')}</Label>
              <Combobox
                options={profileTypeOptions}
                value={watch('profileType')}
                onChange={v => { if (v) setValue('profileType', v as ProfileType) }}
                variant="button"
                size="sm"
                triggerClassName="h-10"
              />
              {errors.profileType && <p className="text-xs text-destructive">{errors.profileType.message}</p>}
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
          <p className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b bg-muted/40">
            {t('sections.contact')}
          </p>
          <div className="p-5 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">{t('fields.phone')}</Label>
              <PhoneField
                value={phoneState.e164}
                onChange={v => { setPhoneState(v); setValue('phone', v.e164, { shouldDirty: true }) }}
                error={errors.phone?.message}
                size="sm"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-sm">{t('fields.whatsapp')}</Label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={useMainPhone}
                  onCheckedChange={v => setValue('useMainPhone', v === true)}
                />
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
          </div>
        </div>

        {/* Location */}
        <div className="bg-card rounded-2xl border shadow-sm overflow-visible">
          <p className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b bg-muted/40">
            {t('sections.location_work')}
          </p>
          <div className="p-5 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">{t('fields.city')}</Label>
              <LocationCombobox
                locations={cities}
                value={locationIdValue ? String(locationIdValue) : ''}
                onChange={id => setValue('locationId', id ? Number(id) : (undefined as unknown as number), { shouldValidate: true })}
                error={errors.locationId?.message}
                placeholder={t('placeholders.city_search')}
                regions={regions}
                onAddLocation={addLocation}
              />
            </div>
            {locationIdValue && (() => {
              const city = cities.find(c => c.id === locationIdValue)
              const region = regions.find(r => r.id === city?.region_id)
              return region ? (
                <p className="text-xs text-muted-foreground pl-1">
                  {t('fields.region')}: <strong>{region.name_al}</strong> {t('actions.region_auto')}
                </p>
              ) : null
            })()}
          </div>
        </div>

        {/* Password info */}
        <PasswordRequirements t={t} />

        {/* Submit */}
        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" className="rounded-xl" onClick={() => router.push('/admin/users')}>
            {t('actions.cancel')}
          </Button>
          <Button type="submit" className="gap-2 rounded-xl" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            {t('actions.create_user')}
          </Button>
        </div>
      </form>
    </div>
  )
}
