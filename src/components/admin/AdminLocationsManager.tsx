'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { createLocation, updateLocation, deleteLocation } from '@/modules/admin/actions'

const TYPES = ['region', 'city', 'village', 'district'] as const
const TYPE_LABEL: Record<string, string> = {
  region: 'Область', city: 'Місто', village: 'Село', district: 'Район',
}

function toSlug(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

interface Location { id: number; name_al: string; name_en?: string | null; type: string; slug: string; parent_id?: number | null }

// ── TypeCombobox ──────────────────────────────────────────────────────────────
// Combobox for the four settlement type values (region / city / village / district).
// Value is always one of TYPES; display label comes from TYPE_LABEL (never the raw enum literal).
function TypeCombobox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)

  const filtered = useMemo(() => {
    if (!search) return [...TYPES]
    const q = search.toLowerCase()
    return TYPES.filter(t => TYPE_LABEL[t].toLowerCase().includes(q))
  }, [search])

  const INPUT_CLS = 'w-full h-10 px-3 text-sm text-foreground border border-input bg-transparent rounded-xl outline-none focus:border-ring focus:ring-2 focus:ring-ring placeholder:text-muted-foreground'
  const LIST_CLS  = 'absolute top-full mt-1 left-0 right-0 z-50 bg-popover text-popover-foreground border rounded-xl shadow-lg overflow-hidden'

  return (
    <div className="relative">
      <input
        type="text"
        value={open ? search : (TYPE_LABEL[value] ?? value)}
        onChange={e => { setSearch(e.target.value); setOpen(true) }}
        onFocus={() => { setSearch(''); setOpen(true) }}
        onBlur={() => setTimeout(() => { setOpen(false); setSearch('') }, 150)}
        placeholder="Оберіть тип"
        className={INPUT_CLS}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-haspopup="listbox"
      />
      {open && (
        <div role="listbox" className={LIST_CLS}>
          {filtered.map(t => (
            <Button
              key={t}
              variant="ghost"
              className={cn('w-full px-3 py-2 h-auto text-sm justify-start rounded-none', value === t && 'bg-primary/10 text-primary')}
              onMouseDown={() => { onChange(t); setSearch(''); setOpen(false) }}
              role="option"
              aria-selected={value === t}
            >
              {TYPE_LABEL[t]}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── ParentCombobox ────────────────────────────────────────────────────────────
// Combobox for the parent region/city selection. Supports typeahead over the full
// parent candidates list. Empty value → no parent (sentinel '' / null in the DB).
function ParentCombobox({ value, onChange, parents, excludeId }: {
  value: string; onChange: (v: string) => void; parents: Location[]; excludeId?: number
}) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)

  const candidates = useMemo(
    () => parents.filter(p => p.id !== excludeId),
    [parents, excludeId],
  )

  const filtered = useMemo(() => {
    if (!search) return candidates.slice(0, 20)
    const q = search.toLowerCase()
    return candidates.filter(p => p.name_al.toLowerCase().includes(q)).slice(0, 20)
  }, [candidates, search])

  const selected = candidates.find(p => String(p.id) === value) ?? null
  const displayLabel = selected ? `${selected.name_al} (${TYPE_LABEL[selected.type] ?? selected.type})` : ''

  const INPUT_CLS = 'w-full h-10 px-3 text-sm text-foreground border border-input bg-transparent rounded-xl outline-none focus:border-ring focus:ring-2 focus:ring-ring placeholder:text-muted-foreground'
  const LIST_CLS  = 'absolute top-full mt-1 left-0 right-0 z-50 bg-popover text-popover-foreground border rounded-xl shadow-lg max-h-56 overflow-y-auto'

  return (
    <div className="relative">
      <input
        type="text"
        value={open ? search : displayLabel}
        onChange={e => { setSearch(e.target.value); setOpen(true) }}
        onFocus={() => { setSearch(''); setOpen(true) }}
        onBlur={() => setTimeout(() => { setOpen(false); setSearch('') }, 150)}
        placeholder="— Немає —"
        className={INPUT_CLS}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-haspopup="listbox"
      />
      {open && (
        <div role="listbox" className={LIST_CLS}>
          <Button
            variant="ghost"
            className={cn('w-full px-3 py-2 h-auto text-sm justify-start rounded-none', !value && 'bg-primary/10 text-primary')}
            onMouseDown={() => { onChange(''); setSearch(''); setOpen(false) }}
            role="option"
            aria-selected={!value}
          >
            — Немає —
          </Button>
          {filtered.map(p => (
            <Button
              key={p.id}
              variant="ghost"
              className={cn('w-full px-3 py-2 h-auto text-sm justify-between rounded-none', value === String(p.id) && 'bg-primary/10 text-primary')}
              onMouseDown={() => { onChange(String(p.id)); setSearch(''); setOpen(false) }}
              role="option"
              aria-selected={value === String(p.id)}
            >
              <span>{p.name_al}</span>
              <span className="text-xs text-muted-foreground ml-2">{TYPE_LABEL[p.type] ?? p.type}</span>
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}

function LocationModal({
  location, parents, onClose, onDone,
}: {
  location?: Location; parents: Location[]; onClose: () => void; onDone: () => void
}) {
  const [nameAl, setNameAl] = useState(location?.name_al ?? '')
  const [nameEn, setNameEn] = useState(location?.name_en ?? '')
  const [type, setType] = useState(location?.type ?? 'city')
  const [slug, setSlug] = useState(location?.slug ?? '')
  const [parentId, setParentId] = useState<string>(location?.parent_id ? String(location.parent_id) : '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!nameAl.trim()) return
    setSaving(true)
    const data = {
      name_al: nameAl.trim(),
      name_en: nameEn.trim() || undefined,
      type,
      slug: slug.trim() || toSlug(nameAl),
      parent_id: parentId ? Number(parentId) : null,
    }
    if (location) {
      await updateLocation(location.id, data)
    } else {
      await createLocation(data)
    }
    setSaving(false)
    onDone()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-2xl border shadow-2xl p-6 w-full max-w-md flex flex-col gap-4">
        <h3 className="font-bold text-base">{location ? 'Редагувати' : 'Додати'} населений пункт</h3>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Назва (AL) *</Label>
            <Input value={nameAl} onChange={e => { setNameAl(e.target.value); if (!location) setSlug(toSlug(e.target.value)) }} className="h-10 rounded-xl" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Назва (EN)</Label>
            <Input value={nameEn} onChange={e => setNameEn(e.target.value)} className="h-10 rounded-xl" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Тип</Label>
            <TypeCombobox value={type} onChange={setType} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Slug</Label>
            <Input value={slug} onChange={e => setSlug(e.target.value)} className="h-10 rounded-xl font-mono text-xs" />
          </div>
          <div className="flex flex-col gap-1.5 col-span-2">
            <Label className="text-xs">Батьківський регіон/місто</Label>
            <ParentCombobox value={parentId} onChange={setParentId} parents={parents} excludeId={location?.id} />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1 h-10 rounded-xl">Скасувати</Button>
          <Button onClick={handleSave} disabled={saving || !nameAl.trim()} className="flex-1 h-10 rounded-xl">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Зберегти'}
          </Button>
        </div>
      </div>
    </div>
  )
}

interface Props { locations: any[]; parents: any[]; activeType: string }

export function AdminLocationsManager({ locations: init, parents, activeType }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [modal, setModal] = useState<'create' | Location | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [items, setItems] = useState(init)

  function openCreate() { setModal('create') }
  function openEdit(loc: any) { setModal(loc) }

  function handleDone() {
    setModal(null)
    router.refresh()
  }

  async function handleDelete(id: number) {
    if (!confirm('Видалити населений пункт?')) return
    setDeletingId(id)
    startTransition(async () => {
      await deleteLocation(id)
      setItems(prev => prev.filter(l => l.id !== id))
      setDeletingId(null)
    })
  }

  return (
    <>
      {modal && (
        <LocationModal
          location={modal === 'create' ? undefined : modal as Location}
          parents={parents}
          onClose={() => setModal(null)}
          onDone={handleDone}
        />
      )}

      <div className="flex flex-col gap-4">
        {/* Type filter + add button */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex gap-2 flex-wrap">
            {[['', 'Всі'], ...Object.entries(TYPE_LABEL)].map(([key, label]) => (
              <a
                key={key}
                href={`/admin/locations${key ? `?type=${key}` : ''}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  activeType === key
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </a>
            ))}
          </div>
          <Button onClick={openCreate} className="gap-2 rounded-xl h-9">
            <Plus className="h-4 w-4" />
            Додати
          </Button>
        </div>

        <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">ID</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Назва (AL)</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Назва (EN)</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Тип</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">Нічого не знайдено</td></tr>
              ) : items.map((l: any) => (
                <tr key={l.id} className={`hover:bg-muted/20 transition-colors ${deletingId === l.id ? 'opacity-50' : ''}`}>
                  <td className="px-5 py-3 text-muted-foreground text-xs">{l.id}</td>
                  <td className="px-5 py-3 font-medium">{l.name_al}</td>
                  <td className="px-5 py-3 text-muted-foreground hidden md:table-cell">{l.name_en ?? '—'}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                      {TYPE_LABEL[l.type] ?? l.type}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {deletingId === l.id ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEdit(l)}
                          className="h-7 w-7 rounded-lg border border-border flex items-center justify-center hover:border-primary/40 transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => handleDelete(l.id)}
                          className="h-7 w-7 rounded-lg border border-border flex items-center justify-center hover:border-destructive/40 hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
