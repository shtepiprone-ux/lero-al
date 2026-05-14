'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Loader2, ChevronLeft, UserPlus, Mail, CheckCircle2, Circle, MapPin,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { createAdminUser, addLocation, type ProfileType } from '@/modules/admin/actions'

// ── Types ────────────────────────────────────────────────────────────────────

interface CityOption { id: number; name_al: string; region_id: number | null }
interface RegionOption { id: number; name_al: string }

interface Props {
  cities: CityOption[]
  regions: RegionOption[]
}

// ── Schema ───────────────────────────────────────────────────────────────────

const PHONE_RE = /^\+[1-9]\d{5,14}$/
const PROFILE_TYPES = ['admin', 'moderator', 'private', 'agent', 'developer'] as const

const schema = z.object({
  firstName:    z.string().min(1, "Ім'я обов'язкове"),
  lastName:     z.string().optional(),
  email:        z.string().email("Некоректний email"),
  profileType:  z.enum(PROFILE_TYPES),
  phone:        z.string().regex(PHONE_RE, 'Формат: +35569123456'),
  useMainPhone: z.boolean(),
  whatsapp:     z.string().optional(),
  locationId:   z.number().min(1, "Місто обов'язкове"),
})
.refine(d => {
  if (d.useMainPhone) return true
  if (!d.whatsapp) return true
  return PHONE_RE.test(d.whatsapp)
}, { message: 'Формат: +35569123456', path: ['whatsapp'] })

type FormValues = z.infer<typeof schema>

// ── Helpers ───────────────────────────────────────────────────────────────────

const PROFILE_TYPE_LABELS: Record<ProfileType, string> = {
  admin: 'Адміністратор', moderator: 'Модератор',
  private: 'Приватна особа', agent: 'Агент', developer: 'Забудовник',
}

const COUNTRY_CODES = [
  { code: '+355', flag: '🇦🇱' }, { code: '+380', flag: '🇺🇦' },
  { code: '+39', flag: '🇮🇹' }, { code: '+44', flag: '🇬🇧' },
  { code: '+1', flag: '🇺🇸' }, { code: '+49', flag: '🇩🇪' },
  { code: '+33', flag: '🇫🇷' }, { code: '+90', flag: '🇹🇷' },
  { code: '+383', flag: '🇽🇰' }, { code: '+382', flag: '🇲🇪' },
  { code: '+387', flag: '🇧🇦' }, { code: '+381', flag: '🇷🇸' },
  { code: '+389', flag: '🇲🇰' },
]

function parsePhone(val: string) {
  const match = COUNTRY_CODES.find(c => val.startsWith(c.code))
  return match ? { code: match.code, local: val.slice(match.code.length) } : { code: '+355', local: val.replace(/^\+/, '') }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PhoneInputField({ value, onChange, error }: { value: string; onChange: (v: string) => void; error?: string }) {
  const [code, setCode] = useState(() => parsePhone(value).code)
  const [local, setLocal] = useState(() => parsePhone(value).local)

  function update(newCode: string, newLocal: string) {
    setCode(newCode); setLocal(newLocal)
    onChange(`${newCode}${newLocal.replace(/\s/g, '')}`)
  }

  return (
    <div>
      <div className="flex gap-2">
        <Select value={code} onValueChange={c => update(c ?? code, local)}>
          <SelectTrigger variant="outline" size="sm" className="w-20 h-10 shrink-0 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COUNTRY_CODES.map(c => <SelectItem key={c.code} value={c.code}>{c.flag} {c.code}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input value={local} onChange={e => update(code, e.target.value)} placeholder="69 123 456" className="h-10 rounded-xl" />
      </div>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  )
}

function CitySelectField({
  cities, regions, value, onChange, error,
}: {
  cities: CityOption[]; regions: RegionOption[]
  value: number | undefined; onChange: (id: number) => void; error?: string
}) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [addName, setAddName] = useState('')
  const [addRegionId, setAddRegionId] = useState<number | null>(null)
  const [adding, setAdding] = useState(false)

  const selected = cities.find(c => c.id === value)
  const filtered = useMemo(() => {
    if (!search.trim()) return cities.slice(0, 20)
    const q = search.toLowerCase()
    return cities.filter(c => c.name_al.toLowerCase().includes(q)).slice(0, 20)
  }, [cities, search])

  async function handleAdd() {
    if (!addName.trim() || !addRegionId) return
    setAdding(true)
    const result = await addLocation({ name_al: addName.trim(), region_id: addRegionId })
    setAdding(false)
    if (result.id) { onChange(result.id); setShowAdd(false); setAddName(''); setAddRegionId(null) }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
        <input
          type="text"
          value={selected ? selected.name_al : search}
          onChange={e => { setSearch(e.target.value); if (selected) onChange(0 as any); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 180)}
          placeholder="Введіть назву міста..."
          className="w-full h-10 pl-9 pr-3 text-sm bg-muted border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {open && (
          <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-popover border rounded-xl shadow-lg max-h-48 overflow-y-auto">
            {filtered.length === 0
              ? <p className="px-3 py-2 text-sm text-muted-foreground">Нічого не знайдено</p>
              : filtered.map(c => (
                  <button
                    key={c.id} type="button"
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors ${value === c.id ? 'bg-primary/10 text-primary font-medium' : ''}`}
                    onMouseDown={() => { onChange(c.id); setSearch(''); setOpen(false) }}
                  >
                    {c.name_al}
                    {regions.find(r => r.id === c.region_id) && (
                      <span className="ml-2 text-xs text-muted-foreground">{regions.find(r => r.id === c.region_id)?.name_al}</span>
                    )}
                  </button>
                ))}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <button type="button" className="text-xs text-primary hover:underline w-fit" onClick={() => setShowAdd(v => !v)}>
        + Додати населений пункт
      </button>
      {showAdd && (
        <div className="border rounded-xl p-3 flex flex-col gap-2 bg-muted/30">
          <p className="text-xs font-semibold">Новий населений пункт</p>
          <Input value={addName} onChange={e => setAddName(e.target.value)} placeholder="Назва (алб.)" className="h-9 rounded-xl text-sm" />
          <Select value={addRegionId?.toString() ?? ''} onValueChange={v => setAddRegionId(Number(v))}>
            <SelectTrigger variant="outline" size="sm" className="h-9 rounded-xl">
              <SelectValue placeholder="Оберіть регіон" />
            </SelectTrigger>
            <SelectContent>
              {regions.map(r => <SelectItem key={r.id} value={r.id.toString()}>{r.name_al}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button type="button" size="sm" className="h-8 rounded-xl" onClick={handleAdd} disabled={adding}>
              {adding ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Додати'}
            </Button>
            <Button type="button" variant="ghost" size="sm" className="h-8 rounded-xl" onClick={() => setShowAdd(false)}>Скасувати</Button>
          </div>
        </div>
      )}
    </div>
  )
}

function PasswordRequirements() {
  const requirements = [
    'Мінімум 8 символів',
    'Великі та малі літери',
    'Цифри (0–9)',
    'Спецсимволи (!, @, #, $, %)',
  ]
  return (
    <div className="bg-muted/50 rounded-xl p-4 border">
      <div className="flex items-center gap-2 mb-2">
        <Mail className="h-4 w-4 text-primary" />
        <p className="text-sm font-medium">Встановлення паролю</p>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Після створення профілю користувач отримає email з посиланням для встановлення пароля.
      </p>
      <p className="text-xs font-semibold mb-1.5">Вимоги до паролю:</p>
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
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    if (useMainPhone) setValue('whatsapp', phoneValue)
  }, [useMainPhone, phoneValue, setValue])

  async function onSubmit(data: FormValues) {
    setSubmitting(true)
    setError(null)
    const result = await createAdminUser({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      profileType: data.profileType,
      phone: data.phone,
      whatsapp: data.useMainPhone ? data.phone : (data.whatsapp || undefined),
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
          <ChevronLeft className="h-4 w-4" /> Користувачі
        </Button>
      </div>

      <AdminPageHeader
        title="Новий користувач"
        subtitle="Заповніть основні поля для створення профілю"
      />

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">

        {/* Basic */}
        <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
          <p className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b bg-muted/40">
            Основна інформація
          </p>
          <div className="p-5 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="firstName" className="text-sm">Ім&apos;я <span className="text-destructive">*</span></Label>
                <Input id="firstName" {...register('firstName')} className="h-10 rounded-xl" placeholder="Ім'я" />
                {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="lastName" className="text-sm">Прізвище</Label>
                <Input id="lastName" {...register('lastName')} className="h-10 rounded-xl" placeholder="Прізвище" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="text-sm">Email <span className="text-destructive">*</span></Label>
              <Input id="email" type="email" {...register('email')} className="h-10 rounded-xl" placeholder="user@example.com" />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Тип акаунту <span className="text-destructive">*</span></Label>
              <Select value={watch('profileType')} onValueChange={v => setValue('profileType', v as ProfileType)}>
                <SelectTrigger variant="outline" className="h-10 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROFILE_TYPES.map(t => (
                    <SelectItem key={t} value={t}>{PROFILE_TYPE_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.profileType && <p className="text-xs text-destructive">{errors.profileType.message}</p>}
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
          <p className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b bg-muted/40">
            Контактні дані
          </p>
          <div className="p-5 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Телефон <span className="text-destructive">*</span></Label>
              <PhoneInputField
                value={watch('phone')}
                onChange={v => setValue('phone', v, { shouldValidate: true })}
                error={errors.phone?.message}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-sm">WhatsApp</Label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={useMainPhone}
                  onCheckedChange={v => setValue('useMainPhone', v === true)}
                />
                Використовувати основний номер
              </label>
              {!useMainPhone && (
                <PhoneInputField
                  value={watch('whatsapp') ?? ''}
                  onChange={v => setValue('whatsapp', v, { shouldValidate: true })}
                  error={errors.whatsapp?.message}
                />
              )}
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
          <p className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b bg-muted/40">
            Локація
          </p>
          <div className="p-5 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Місто <span className="text-destructive">*</span></Label>
              <CitySelectField
                cities={cities}
                regions={regions}
                value={locationIdValue}
                onChange={id => setValue('locationId', id, { shouldValidate: true })}
                error={errors.locationId?.message}
              />
            </div>
            {locationIdValue && (() => {
              const city = cities.find(c => c.id === locationIdValue)
              const region = regions.find(r => r.id === city?.region_id)
              return region ? (
                <p className="text-xs text-muted-foreground pl-1">Регіон: <strong>{region.name_al}</strong> (авто)</p>
              ) : null
            })()}
          </div>
        </div>

        {/* Password info */}
        <PasswordRequirements />

        {/* Submit */}
        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" className="rounded-xl" onClick={() => router.push('/admin/users')}>
            Скасувати
          </Button>
          <Button type="submit" className="gap-2 rounded-xl" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Створити користувача
          </Button>
        </div>
      </form>
    </div>
  )
}
