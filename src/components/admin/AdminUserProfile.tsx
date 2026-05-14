'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Pencil, Trash2, Save, X, ChevronLeft, Loader2,
  ShieldCheck, MapPin, History, AlertTriangle, UserPlus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AdminUserAvatar } from '@/components/admin/AdminUserAvatar'
import {
  updateUserProfileFull, softDeleteUser, addLocation,
  approveLocationRequest, rejectLocationRequest, createAdminUser,
  uploadUserAvatar,
  type ProfileType,
} from '@/modules/admin/actions'
import type { User, UserChangeLog, UserStatusHistory } from '@/types/database'

// ── Types ────────────────────────────────────────────────────────────────────

interface CityOption { id: number; name_al: string; region_id: number | null }
interface RegionOption { id: number; name_al: string }

type UserWithLocation = User & {
  location?: { id: number; name_al: string; region_id: number | null; parent?: { id: number; name_al: string } | null } | null
}

interface Props {
  user: UserWithLocation | null   // null → create mode
  email: string                   // from auth; empty in create mode
  cities: CityOption[]
  regions: RegionOption[]
  changeLog: UserChangeLog[]
  statusHistory: UserStatusHistory[]
  isAdmin: boolean
}

// ── Schema ───────────────────────────────────────────────────────────────────

const PHONE_RE = /^\+[1-9]\d{5,14}$/
const PROFILE_TYPES = ['admin', 'moderator', 'private', 'agent', 'developer'] as const
const STATUS_VALUES = ['active', 'blocked', 'inactive'] as const

const profileSchema = z.object({
  firstName:      z.string().min(1, "Ім'я обов'язкове"),
  lastName:       z.string().optional(),
  profileType:    z.enum(PROFILE_TYPES),
  phone:          z.string().regex(PHONE_RE, 'Формат: +35569123456'),
  useMainPhone:   z.boolean(),
  whatsapp:       z.string().optional(),
  locationId:     z.number().int().min(1, "Місто обов'язкове"),
  companyName:    z.string().optional(),
  companyLogoUrl: z.string().optional(),
  website:        z.string().optional(),
  position:       z.string().optional(),
  yearStarted:    z.number().int().min(1900).max(new Date().getFullYear()).nullable().optional(),
  status:         z.enum(STATUS_VALUES),
  blockReason:    z.string().optional(),
})
.refine(d => d.status !== 'blocked' || !!d.blockReason?.trim(),
  { message: "Причина блокування обов'язкова", path: ['blockReason'] })
.refine(d => !['agent', 'developer'].includes(d.profileType) || !!d.companyName?.trim(),
  { message: "Назва компанії обов'язкова", path: ['companyName'] })
.refine(d => !['agent', 'developer'].includes(d.profileType) || !!d.website?.trim(),
  { message: "Сайт компанії обов'язковий", path: ['website'] })
.refine(d => {
  if (d.useMainPhone) return true
  if (!d.whatsapp) return true
  return PHONE_RE.test(d.whatsapp)
}, { message: 'Формат: +35569123456', path: ['whatsapp'] })

type FormValues = z.infer<typeof profileSchema>

// ── Helpers ───────────────────────────────────────────────────────────────────

const PROFILE_TYPE_LABELS: Record<ProfileType, string> = {
  admin: 'Адміністратор', moderator: 'Модератор',
  private: 'Приватна особа', agent: 'Агент', developer: 'Забудовник',
}
const STATUS_LABELS  = { active: 'Активний', blocked: 'Заблокований', inactive: 'Неактивний' }
const STATUS_VARIANT = { active: 'success', blocked: 'destructive', inactive: 'warning' } as const

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

function profileTypeFromUser(user: Pick<User, 'role' | 'user_type'>): ProfileType {
  if (user.role === 'admin') return 'admin'
  if (user.role === 'moderator') return 'moderator'
  if (user.role === 'agent') return 'agent'
  if (user.user_type === 'developer') return 'developer'
  return 'private'
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
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

function PhoneInputField({ value, onChange, error }: { value: string; onChange: (v: string) => void; error?: string }) {
  const [code, setCode] = useState(() => parsePhone(value).code)
  const [local, setLocal] = useState(() => parsePhone(value).local)

  useEffect(() => {
    const p = parsePhone(value)
    setCode(p.code); setLocal(p.local)
  }, [value])

  function update(c: string, l: string) {
    setCode(c); setLocal(l)
    onChange(`${c}${l.replace(/\s/g, '')}`)
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

function CitySelectField({ cities, regions, value, onChange, mode, error, isAdmin }: {
  cities: CityOption[]; regions: RegionOption[]
  value: number | null | undefined; onChange: (id: number | undefined) => void
  mode: 'view' | 'edit' | 'create'; error?: string; isAdmin: boolean
}) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [addName, setAddName] = useState('')
  const [addRegionId, setAddRegionId] = useState<number | null>(null)
  const [adding, setAdding] = useState(false)

  const selected = cities.find(c => c.id === value)
  const region = regions.find(r => r.id === selected?.region_id)

  const filtered = useMemo(() => {
    if (!search.trim()) return cities.slice(0, 20)
    const q = search.toLowerCase()
    return cities.filter(c => c.name_al.toLowerCase().includes(q)).slice(0, 20)
  }, [cities, search])

  if (mode === 'view') {
    return (
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium">{selected?.name_al ?? '—'}</span>
        {region && <span className="text-xs text-muted-foreground">{region.name_al}</span>}
      </div>
    )
  }

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
          onChange={e => { setSearch(e.target.value); if (selected) onChange(undefined); setOpen(true) }}
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
                  <button key={c.id} type="button"
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
      {region && <p className="text-xs text-muted-foreground pl-1">Регіон: <strong>{region.name_al}</strong> (авто)</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
      {isAdmin && (
        <button type="button" className="text-xs text-primary hover:underline w-fit" onClick={() => setShowAdd(v => !v)}>
          + Додати населений пункт
        </button>
      )}
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

// ── Dialogs ───────────────────────────────────────────────────────────────────

// Shown when navigating away (sidebar, back button) with unsaved changes.
function UnsavedChangesDialog({ onLeave, onStay }: { onLeave: () => void; onStay: () => void }) {
  return (
    <Dialog open onOpenChange={open => { if (!open) onStay() }}>
      <DialogContent showCloseButton={false} className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-status-warning" />
            Незбережені зміни
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Є незбережені зміни. Якщо залишити сторінку — всі зміни буде втрачено.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={onStay}>Залишитися</Button>
          <Button variant="destructive" onClick={onLeave}>Залишити без збереження</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CancelConfirmDialog({ onConfirm, onReturn }: { onConfirm: () => void; onReturn: () => void }) {
  return (
    <Dialog open onOpenChange={open => { if (!open) onReturn() }}>
      <DialogContent showCloseButton={false} className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-status-warning" />
            Скасувати зміни?
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">Усі незбережені зміни буде втрачено. Цю дію неможливо відмінити.</p>
        <DialogFooter>
          <Button variant="outline" onClick={onReturn}>Повернутися до редагування</Button>
          <Button variant="destructive" onClick={onConfirm}>Підтвердити скасування</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DeleteConfirmDialog({ userName, email, onConfirm, onReturn, deleting }: {
  userName: string; email: string; onConfirm: () => void; onReturn: () => void; deleting: boolean
}) {
  return (
    <Dialog open onOpenChange={open => { if (!open) onReturn() }}>
      <DialogContent showCloseButton={false} className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" /> Видалити профіль?
          </DialogTitle>
        </DialogHeader>
        <div className="text-sm space-y-1">
          <p className="text-muted-foreground">Ви збираєтесь видалити профіль:</p>
          <p className="font-semibold">{userName}</p>
          <p className="text-muted-foreground text-xs">{email}</p>
          <p className="text-destructive font-medium mt-2">⚠️ Цю дію неможливо відмінити.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onReturn} disabled={deleting}>Скасувати</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={deleting}>
            {deleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Видалити
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── City combobox for location-request approval ───────────────────────────────

function ApprovalCityCombobox({ cities, onApprove, disabled }: {
  cities: CityOption[]; onApprove: (id: number) => void; disabled: boolean
}) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const filtered = useMemo(() => {
    if (!search.trim()) return cities.slice(0, 15)
    const q = search.toLowerCase()
    return cities.filter(c => c.name_al.toLowerCase().includes(q)).slice(0, 15)
  }, [cities, search])

  return (
    <div className="relative flex-1 min-w-0">
      <input
        type="text"
        value={search}
        onChange={e => { setSearch(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 180)}
        placeholder="Знайти та призначити місто..."
        disabled={disabled}
        className="w-full h-8 px-2 text-xs bg-muted border-0 rounded-lg focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
      />
      {open && filtered.length > 0 && (
        <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-popover border rounded-xl shadow-lg max-h-40 overflow-y-auto">
          {filtered.map(c => (
            <button key={c.id} type="button"
              className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors"
              onMouseDown={() => { onApprove(c.id); setSearch(''); setOpen(false) }}
            >
              {c.name_al}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Password requirements (create mode) ──────────────────────────────────────

function PasswordInfo() {
  return (
    <div className="bg-muted/50 rounded-xl p-4 border flex flex-col gap-2">
      <p className="text-sm font-medium">Встановлення паролю</p>
      <p className="text-xs text-muted-foreground">
        Після створення профілю користувач отримає email з посиланням для встановлення паролю.
      </p>
      <ul className="space-y-1 mt-1">
        {['Мінімум 8 символів', 'Великі та малі літери', 'Цифри (0–9)', 'Спецсимволи (!, @, #, $, %)'].map(r => (
          <li key={r} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-status-success shrink-0" />{r}
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export function AdminUserProfile({ user, email: authEmail, cities, regions, changeLog, statusHistory, isAdmin }: Props) {
  const router = useRouter()

  // Mode derivation — create if no user, otherwise view/edit toggle
  const isCreate = user === null
  const [editActive, setEditActive] = useState(false)
  const currentMode: 'view' | 'edit' | 'create' = isCreate ? 'create' : editActive ? 'edit' : 'view'

  // Dialogs
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  // Navigation guard — shown when user navigates away with unsaved form changes
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)
  const [pendingNavHref, setPendingNavHref] = useState<string | null>(null)

  // Async state
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url ?? null)
  // Create mode: pending avatar blob uploaded after user creation
  const [pendingAvatarBlob, setPendingAvatarBlob] = useState<Blob | null>(null)

  // Email state — editable in create mode only
  const [createEmail, setCreateEmail] = useState('')
  const [createEmailError, setCreateEmailError] = useState<string | null>(null)

  // Location request
  const [reqLoading, setReqLoading] = useState(false)

  // Form
  const form = useForm<FormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: isCreate
      ? { firstName: '', lastName: '', profileType: 'private', phone: '', useMainPhone: false, whatsapp: '', locationId: undefined as any, companyName: '', website: '', position: '', yearStarted: undefined, status: 'active', blockReason: '' }
      : {
          firstName: user.name ?? '',
          lastName: user.last_name ?? '',
          profileType: profileTypeFromUser(user),
          phone: user.phone ?? '',
          useMainPhone: !!(user.phone && user.phone === user.whatsapp),
          whatsapp: user.whatsapp ?? '',
          locationId: user.location_id ?? undefined as any,
          companyName: user.company_name ?? '',
          companyLogoUrl: user.company_logo_url ?? '',
          website: user.website ?? '',
          position: user.position ?? '',
          yearStarted: user.year_started ?? undefined,
          status: (user.status as any) ?? 'active',
          blockReason: user.block_reason ?? '',
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
    ?? (user as any)?.location?.parent?.name_al

  // Navigation guard — true when form is dirty and we are in an editable mode.
  // Avatar changes in edit mode are persisted immediately and don't contribute
  // to this flag. In create mode, the entire form starts clean.
  const needsGuard = isDirty && currentMode !== 'view'

  // Side effects
  useEffect(() => { if (useMainPhone) setValue('whatsapp', phoneValue) }, [useMainPhone, phoneValue, setValue])
  useEffect(() => { if (statusValue !== 'blocked') setValue('blockReason', '') }, [statusValue, setValue])
  useEffect(() => {
    if (!isBusiness) { setValue('companyName', ''); setValue('website', ''); setValue('position', ''); setValue('yearStarted', undefined) }
  }, [profileType, isBusiness, setValue])

  // ── Navigation guard effects ──────────────────────────────────────────────

  // Browser refresh / tab-close / external navigation
  useEffect(() => {
    if (!needsGuard) return
    const handle = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', handle)
    return () => window.removeEventListener('beforeunload', handle)
  }, [needsGuard])

  // Sidebar <Link> clicks and any other <a> tag navigation within the admin
  useEffect(() => {
    if (!needsGuard) return
    function intercept(e: MouseEvent) {
      const anchor = (e.target as Element).closest('a[href]') as HTMLAnchorElement | null
      if (!anchor) return
      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return
      try {
        const url = new URL(href, window.location.origin)
        if (url.origin !== window.location.origin) return  // external — let browser handle
        if (url.pathname === window.location.pathname) return  // same page
      } catch { return }
      e.preventDefault()
      e.stopImmediatePropagation()
      setPendingNavHref(href)
      setShowUnsavedDialog(true)
    }
    document.addEventListener('click', intercept, true)
    return () => document.removeEventListener('click', intercept, true)
  }, [needsGuard])

  // ── Email validation (create mode) ──

  function validateCreateEmail(): boolean {
    const v = createEmail.trim()
    if (!v) { setCreateEmailError("Email обов'язковий"); return false }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { setCreateEmailError('Некоректний email'); return false }
    setCreateEmailError(null)
    return true
  }

  // ── Handlers ─────────────────────────────────────────────────────────────

  async function handleCreate(data: FormValues) {
    if (!validateCreateEmail()) return
    setSaving(true); setSaveError(null)
    const result = await createAdminUser({
      firstName: data.firstName,
      lastName: data.lastName,
      email: createEmail.trim(),
      profileType: data.profileType,
      phone: data.phone,
      whatsapp: data.useMainPhone ? data.phone : (data.whatsapp || undefined),
      locationId: data.locationId,
      ...(isBusiness && {
        companyName: data.companyName,
        website: data.website,
        position: data.position,
        yearStarted: data.yearStarted ?? null,
      }),
    })
    if (result.error) { setSaveError(result.error); setSaving(false); return }

    // Upload pending avatar if the admin selected one during creation.
    // Failure is non-fatal — avatar can always be added in edit mode.
    if (pendingAvatarBlob && result.userId) {
      try {
        const fd = new FormData()
        fd.append('avatar', new File([pendingAvatarBlob], 'avatar.jpg', { type: 'image/jpeg' }))
        await uploadUserAvatar(result.userId, fd)
      } catch {
        // silently ignore — user profile is created; admin can add avatar later
      }
    }

    setSaving(false)
    if (result.userId) router.push(`/admin/users/${result.userId}`)
  }

  async function handleSave(data: FormValues) {
    if (!user) return
    setSaving(true); setSaveError(null)
    const result = await updateUserProfileFull(user.id, {
      firstName: data.firstName, lastName: data.lastName,
      profileType: data.profileType,
      phone: data.phone,
      whatsapp: data.useMainPhone ? data.phone : (data.whatsapp || undefined),
      locationId: data.locationId,
      companyName: data.companyName, companyLogoUrl: data.companyLogoUrl,
      website: data.website, position: data.position, yearStarted: data.yearStarted ?? null,
      status: data.status, blockReason: data.blockReason,
    })
    setSaving(false)
    if (result.error) { setSaveError(result.error); return }
    // Reset isDirty so the navigation guard deactivates immediately after save.
    form.reset(data)
    setEditActive(false); router.refresh()
  }

  async function handleDelete() {
    if (!user) return
    setDeleting(true)
    const result = await softDeleteUser(user.id)
    setDeleting(false)
    if (result.error) { setSaveError(result.error); setShowDeleteDialog(false); return }
    router.push('/admin/users')
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

  // Called by the navigation guard confirm ("Leave without saving")
  function handleConfirmLeave() {
    const href = pendingNavHref
    setShowUnsavedDialog(false)
    setPendingNavHref(null)
    if (href) router.push(href)
  }

  // Called by AdminUserAvatar in create mode when user selects/clears an avatar
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

  return (
    <div className="flex flex-col gap-6">

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => {
          if (needsGuard) { setPendingNavHref('/admin/users'); setShowUnsavedDialog(true) }
          else router.push('/admin/users')
        }}>
          <ChevronLeft className="h-4 w-4" /> Користувачі
        </Button>
        <div className="ml-auto flex gap-2">
          {currentMode === 'view' && (
            <>
              <Button variant="outline" size="sm" className="gap-1.5 rounded-xl" onClick={() => setEditActive(true)}>
                <Pencil className="h-4 w-4" /> Редагувати профіль
              </Button>
              {isAdmin && (
                <Button variant="destructive" size="sm" className="gap-1.5 rounded-xl" onClick={() => setShowDeleteDialog(true)}>
                  <Trash2 className="h-4 w-4" /> Видалити
                </Button>
              )}
            </>
          )}
          {(currentMode === 'edit' || currentMode === 'create') && (
            <>
              <Button variant="outline" size="sm" className="gap-1.5 rounded-xl" onClick={handleCancelClick}>
                <X className="h-4 w-4" /> Скасувати
              </Button>
              <Button size="sm" className="gap-1.5 rounded-xl" onClick={handleSubmit(onSubmit)} disabled={saving}>
                {saving
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : isCreate ? <UserPlus className="h-4 w-4" /> : <Save className="h-4 w-4" />
                }
                {isCreate ? 'Створити користувача' : 'Зберегти'}
              </Button>
            </>
          )}
        </div>
      </div>

      {saveError && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 text-sm text-destructive">
          {saveError}
        </div>
      )}

      {/* ── Header card ─────────────────────────────────────────────────────── */}
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
              <h1 className="text-xl font-bold">Новий користувач</h1>
              <p className="text-sm text-muted-foreground">Заповніть поля нижче для створення профілю</p>
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
                    <ShieldCheck className="h-3 w-3" /> Верифікований
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{authEmail}</p>
            </>
          )}
        </div>
      </div>

      {/* ── Location request card ─────────────────────────────────────────── */}
      {user?.location_request && (
        <div className="bg-status-warning/10 border border-status-warning/30 rounded-2xl p-4 flex flex-col gap-3">
          <p className="text-sm font-semibold text-status-warning flex items-center gap-2">
            <MapPin className="h-4 w-4" /> Запит на додавання населеного пункту
          </p>
          <p className="text-sm">
            <strong>{user.location_request.city}</strong>
            {user.location_request.region ? `, ${user.location_request.region}` : ''}
          </p>
          <div className="flex gap-2 items-center flex-wrap">
            <ApprovalCityCombobox
              cities={cities}
              onApprove={handleApproveRequest}
              disabled={reqLoading}
            />
            <Button variant="ghost" size="sm" className="h-8 text-xs text-destructive hover:bg-destructive/5 shrink-0"
              onClick={handleRejectRequest} disabled={reqLoading}>
              {reqLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Відхилити'}
            </Button>
          </div>
        </div>
      )}

      {/* ── Basic info ──────────────────────────────────────────────────────── */}
      <SectionCard title="Основна інформація">
        {/* Email — editable in create, read-only in view/edit */}
        {isCreate ? (
          <div className="flex flex-col gap-1.5 sm:grid sm:grid-cols-[140px_1fr] sm:gap-3 sm:items-start">
            <Label className="text-sm text-muted-foreground sm:pt-2 leading-none">Email *</Label>
            <div className="min-w-0">
              <Input
                type="email"
                value={createEmail}
                onChange={e => { setCreateEmail(e.target.value); setCreateEmailError(null) }}
                placeholder="user@example.com"
                className="h-10 rounded-xl"
              />
              {createEmailError && <p className="text-xs text-destructive mt-1">{createEmailError}</p>}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 sm:grid sm:grid-cols-[140px_1fr] sm:gap-3 sm:items-start">
            <span className="text-sm text-muted-foreground sm:pt-2 leading-none">Email</span>
            <div className="min-w-0">
              <span className="text-sm font-medium break-all">{authEmail}</span>
              <p className="text-xs text-muted-foreground mt-0.5">
                Email is immutable. The user can change their email from their profile.
              </p>
            </div>
          </div>
        )}

        <FieldRow label="Ім'я *" mode={currentMode}
          viewValue={user?.name}
          editContent={<Input {...register('firstName')} className="h-10 rounded-xl" placeholder="Ім'я" />}
          error={errors.firstName?.message}
        />
        <FieldRow label="Прізвище" mode={currentMode}
          viewValue={user?.last_name}
          editContent={<Input {...register('lastName')} className="h-10 rounded-xl" placeholder="Прізвище" />}
        />
        <FieldRow
          label="Тип акаунту *"
          mode={isAdmin ? currentMode : 'view'}
          viewValue={PROFILE_TYPE_LABELS[profileTypeFromUser(user ?? { role: 'user', user_type: 'private' })]}
          editContent={
            <Select value={profileType} onValueChange={v => setValue('profileType', v as ProfileType)}>
              <SelectTrigger variant="outline" className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PROFILE_TYPES.map(t => <SelectItem key={t} value={t}>{PROFILE_TYPE_LABELS[t]}</SelectItem>)}
              </SelectContent>
            </Select>
          }
          error={errors.profileType?.message}
        />
      </SectionCard>

      {/* ── Contact ─────────────────────────────────────────────────────────── */}
      <SectionCard title="Контактні дані">
        <FieldRow label="Телефон *" mode={currentMode}
          viewValue={user?.phone}
          editContent={
            <PhoneInputField
              value={watch('phone')}
              onChange={v => setValue('phone', v, { shouldValidate: true })}
              error={errors.phone?.message}
            />
          }
          error={undefined}
        />
        <FieldRow label="WhatsApp" mode={currentMode}
          viewValue={user?.whatsapp}
          editContent={
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={useMainPhone} onCheckedChange={v => setValue('useMainPhone', v === true)} />
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
          }
        />
      </SectionCard>

      {/* ── Location ────────────────────────────────────────────────────────── */}
      <SectionCard title={`Локація${isBusiness ? ' (місто роботи)' : ' (місто реєстрації)'}`}>
        <FieldRow label="Місто *" mode={currentMode}
          editContent={
            <CitySelectField cities={cities} regions={regions}
              value={locationIdValue} onChange={id => setValue('locationId', id as any, { shouldValidate: true })}
              mode={currentMode} error={errors.locationId?.message} isAdmin={isAdmin}
            />
          }
          viewValue={
            <div className="flex flex-col gap-0.5">
              <span>{(user as any)?.location?.name_al ?? '—'}</span>
              {(user as any)?.location?.parent?.name_al && (
                <span className="text-xs text-muted-foreground">{(user as any).location.parent.name_al}</span>
              )}
            </div>
          }
          error={undefined}
        />
        {currentMode !== 'view' && regionName && (
          <FieldRow label="Регіон" mode="view"
            viewValue={<span className="text-muted-foreground text-sm">{regionName} (авто)</span>}
          />
        )}
      </SectionCard>

      {/* ── Business (Agent / Developer) ────────────────────────────────────── */}
      {(isBusiness || (currentMode === 'view' && user && ['agent', 'developer'].includes(profileTypeFromUser(user)))) && (
        <SectionCard title="Дані компанії">
          <FieldRow label="Назва компанії *" mode={currentMode} viewValue={user?.company_name}
            editContent={<Input {...register('companyName')} className="h-10 rounded-xl" placeholder="Назва компанії" />}
            error={errors.companyName?.message}
          />
          <FieldRow label="Сайт *" mode={currentMode}
            viewValue={user?.website ? <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{user.website}</a> : undefined}
            editContent={<Input {...register('website')} className="h-10 rounded-xl" placeholder="https://company.al" />}
            error={errors.website?.message}
          />
          <FieldRow label="Посада" mode={currentMode} viewValue={user?.position}
            editContent={<Input {...register('position')} className="h-10 rounded-xl" placeholder="Директор, Менеджер..." />}
          />
          <FieldRow label="Рік початку" mode={currentMode} viewValue={user?.year_started?.toString()}
            editContent={
              <Input {...register('yearStarted', { valueAsNumber: true })} type="number"
                min={1900} max={new Date().getFullYear()} className="h-10 rounded-xl w-32" placeholder="2015" />
            }
            error={errors.yearStarted?.message}
          />
        </SectionCard>
      )}

      {/* ── Account Status (not shown in create mode) ───────────────────────── */}
      {!isCreate && (
        <SectionCard title="Статус акаунту">
          <FieldRow label="Статус *" mode={currentMode}
            viewValue={
              <Badge variant={STATUS_VARIANT[(user!.status ?? 'active') as keyof typeof STATUS_VARIANT]} className="text-xs">
                {STATUS_LABELS[(user!.status ?? 'active') as keyof typeof STATUS_LABELS]}
              </Badge>
            }
            editContent={
              <Select value={statusValue} onValueChange={v => setValue('status', v as any)}>
                <SelectTrigger variant="outline" className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Активний</SelectItem>
                  <SelectItem value="blocked">Заблокований</SelectItem>
                  <SelectItem value="inactive">Неактивний</SelectItem>
                </SelectContent>
              </Select>
            }
            error={errors.status?.message}
          />
          {(statusValue === 'blocked' || user?.block_reason) && (
            <FieldRow label="Причина блокування" mode={statusValue === 'blocked' ? currentMode : 'view'}
              viewValue={user?.block_reason}
              editContent={
                <Input {...register('blockReason')} className="h-10 rounded-xl" placeholder="Вкажіть причину блокування..." />
              }
              error={errors.blockReason?.message}
            />
          )}
        </SectionCard>
      )}

      {/* ── Password info (create mode only) ────────────────────────────────── */}
      {isCreate && <PasswordInfo />}

      {/* ── Change history (not shown in create mode) ───────────────────────── */}
      {!isCreate && changeLog.length > 0 && (
        <SectionCard title="Історія змін типу акаунту">
          <div className="flex flex-col gap-2">
            {changeLog.map(entry => (
              <div key={entry.id} className="flex items-start gap-3 text-xs">
                <History className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <span className="text-muted-foreground">
                    {new Date(entry.changed_at).toLocaleDateString('uk-UA', {
                      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                  {' · '}
                  <span className="font-medium capitalize">{entry.old_value}</span>{' → '}
                  <span className="font-medium capitalize">{entry.new_value}</span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* ── Status history (not shown in create mode) ───────────────────────── */}
      {!isCreate && statusHistory.length > 0 && (
        <SectionCard title="Історія змін статусу">
          <div className="flex flex-col gap-2">
            {statusHistory.slice(0, 10).map(entry => (
              <div key={entry.id} className="flex items-start gap-3 text-xs">
                <History className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0 flex flex-col gap-0.5">
                  <div>
                    <span className="text-muted-foreground">
                      {new Date(entry.changed_at).toLocaleDateString('uk-UA', {
                        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                    {' · '}
                    <span className="font-medium capitalize">{entry.old_status ?? '—'}</span>{' → '}
                    <span className="font-medium capitalize">{entry.new_status}</span>
                  </div>
                  {entry.reason && (
                    <span className="text-muted-foreground">Причина: {entry.reason}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* ── Dialogs ─────────────────────────────────────────────────────────── */}
      {showCancelDialog && (
        <CancelConfirmDialog onConfirm={handleConfirmCancel} onReturn={() => setShowCancelDialog(false)} />
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
    </div>
  )
}
