'use client'

import { useState, useMemo, useRef, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, Trash2, Loader2, Building2, ImagePlus, Search, ChevronRight } from 'lucide-react'
import { toast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RelativeTime } from '@/components/shared/RelativeTime'
import { AppImage } from '@/components/ui/AppImage'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AdminTable, type AdminTableColumn } from '@/components/admin/AdminTable'
import { createCompanyAction, updateCompanyAction, deleteCompanyAction } from '@/modules/companies/actions'
import { normalizeSearch } from '@/lib/utils'
import type { Company } from '@/types/database'

interface CompanyRow extends Company {
  agentCount: number
}

// ── Company form (create / edit) ──────────────────────────────────────────────

function CompanyFormDialog({
  company,
  onClose,
  onDone,
}: {
  company?: CompanyRow
  onClose: () => void
  onDone: (updated: CompanyRow) => void
}) {
  const t = useTranslations('admin.companies')
  const tc = useTranslations('common')
  const [isPending, startTransition] = useTransition()
  const logoInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(company?.name ?? '')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(company?.logo_url ?? null)
  const [logoError, setLogoError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const ta = useTranslations('auth')

  function handleLogoSelect(file: File) {
    setLogoError(null)
    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) { setLogoError(ta('company_logo_invalid_type')); return }
    if (file.size > 2 * 1024 * 1024) { setLogoError(ta('company_logo_too_large')); return }

    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      if (img.naturalWidth > 256 || img.naturalHeight > 256) {
        setLogoError(ta('company_logo_too_big'))
        URL.revokeObjectURL(url)
        return
      }
      if (logoPreview) URL.revokeObjectURL(logoPreview)
      setLogoFile(file)
      setLogoPreview(url)
    }
    img.onerror = () => { setLogoError(ta('company_logo_invalid_type')); URL.revokeObjectURL(url) }
    img.src = url
  }

  async function uploadLogo(companyId: string): Promise<string | null> {
    if (!logoFile) return null
    try {
      const fd = new FormData()
      fd.append('logo', logoFile)
      fd.append('companyId', companyId)
      const res = await fetch('/api/upload-company-logo', { method: 'POST', body: fd })
      const data = await res.json() as { url?: string; error?: string }
      return data.url ?? null
    } catch {
      return null
    }
  }

  function handleSubmit() {
    if (!name.trim()) { toast.error(t('error_name_required')); return }

    startTransition(async () => {
      let companyId = company?.id

      if (company) {
        // Edit
        const result = await updateCompanyAction(company.id, name)
        if (result.error) { toast.error(t('error_save_failed')); return }
      } else {
        // Create
        const result = await createCompanyAction(name)
        if (result.duplicate) { toast.error(t('error_duplicate')); return }
        if (!result.id) { toast.error(t('error_save_failed')); return }
        companyId = result.id
      }

      let newLogoUrl = currentLogoUrl
      if (logoFile && companyId) {
        setUploading(true)
        const uploaded = await uploadLogo(companyId)
        setUploading(false)
        if (uploaded) newLogoUrl = uploaded
      }

      toast.success(company ? t('success_updated') : t('success_created'))
      if (logoPreview) URL.revokeObjectURL(logoPreview)

      onDone({
        id: companyId!,
        name: name.trim(),
        logo_url: newLogoUrl,
        created_at: company?.created_at ?? new Date().toISOString(),
        agentCount: company?.agentCount ?? 0,
      })
    })
  }

  const logoSrc = logoPreview ?? currentLogoUrl

  return (
    <Dialog open onOpenChange={open => { if (!open) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{company ? t('edit_title') : t('add_title')}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="comp-name">{t('name_label')} *</Label>
            <Input
              id="comp-name"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={120}
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSubmit() } }}
            />
          </div>

          {/* Logo upload */}
          <div className="flex flex-col gap-1.5">
            <Label>{t('logo_label')}</Label>
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-xl border bg-muted flex items-center justify-center overflow-hidden shrink-0">
                {logoSrc
                  // Blob preview — AppImage requires Cloudinary URLs; blob:// must use raw img
                  // eslint-disable-next-line no-restricted-syntax, @next/next/no-img-element
                  ? <img src={logoSrc} alt="logo" className="h-full w-full object-contain" />
                  : <Building2 className="h-6 w-6 text-muted-foreground" />
                }
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 rounded-lg"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={isPending || uploading}
                  >
                    <ImagePlus className="h-3.5 w-3.5 shrink-0" />
                    {logoSrc ? tc('replace') : tc('choose_file')}
                  </Button>
                  {logoSrc && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs h-8 rounded-lg text-muted-foreground"
                      onClick={() => {
                        setLogoFile(null)
                        if (logoPreview) { URL.revokeObjectURL(logoPreview); setLogoPreview(null) }
                        setCurrentLogoUrl(null)
                        setLogoError(null)
                      }}
                    >
                      ×
                    </Button>
                  )}
                </div>
                {logoError ? (
                  <p className="text-xs text-destructive">{logoError}</p>
                ) : (
                  <p className="text-2xs text-muted-foreground">{ta('company_logo_hint')}</p>
                )}
              </div>
            </div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoSelect(f); e.target.value = '' }}
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isPending || uploading}>
              {tc('cancel')}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSubmit}
              disabled={isPending || uploading || !name.trim()}
              className="gap-1.5"
            >
              {(isPending || uploading) && <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />}
              {tc('save')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Main manager ──────────────────────────────────────────────────────────────

interface Props {
  companies: CompanyRow[]
}

export function AdminCompaniesManager({ companies: initial }: Props) {
  const t = useTranslations('admin.companies')
  const tc = useTranslations('common')

  const [items, setItems] = useState<CompanyRow[]>(initial)
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<CompanyRow | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const filtered = useMemo(() => {
    if (!search) return items
    const q = normalizeSearch(search)
    return items.filter(c => normalizeSearch(c.name).includes(q))
  }, [items, search])

  function handleCreated(company: CompanyRow) {
    setItems(prev => [...prev, company].sort((a, b) => a.name.localeCompare(b.name)))
    setCreating(false)
  }

  function handleUpdated(company: CompanyRow) {
    setItems(prev => prev.map(c => c.id === company.id ? company : c).sort((a, b) => a.name.localeCompare(b.name)))
    setEditing(null)
  }

  async function handleDelete() {
    if (!deletingId) return
    setDeleting(true)
    const result = await deleteCompanyAction(deletingId)
    setDeleting(false)
    if (result.error) {
      toast.error(t('error_delete_failed'))
      return
    }
    toast.success(t('success_deleted'))
    setItems(prev => prev.filter(c => c.id !== deletingId))
    setDeletingId(null)
  }

  const columns: AdminTableColumn<CompanyRow>[] = [
    {
      key: 'logo',
      header: t('table_logo'),
      className: 'w-14',
      cell: company => (
        <div className="h-9 w-9 rounded-lg border bg-muted flex items-center justify-center overflow-hidden">
          {company.logo_url ? (
            <AppImage variant="avatar" src={company.logo_url} alt={company.name} />
          ) : (
            <Building2 className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      ),
    },
    {
      key: 'name',
      header: t('table_name'),
      cell: company => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={e => { e.stopPropagation(); setEditing(company) }}
            className="font-medium hover:text-primary transition-colors text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
          >
            {company.name}
          </button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/5 shrink-0"
            onClick={e => { e.stopPropagation(); setDeletingId(company.id) }}
            aria-label={tc('delete')}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
    {
      key: 'agents',
      header: t('table_agents'),
      visibility: 'sm',
      cell: company => (
        <span className="text-muted-foreground">
          {company.agentCount > 0 ? (
            company.agentCount === 1
              ? t('agents_count_one')
              : t('agents_count_other', { count: company.agentCount })
          ) : '—'}
        </span>
      ),
    },
    {
      key: 'created',
      header: t('table_created'),
      visibility: 'md',
      cell: company => (
        <span className="text-muted-foreground">
          <RelativeTime date={company.created_at} />
        </span>
      ),
    },
  ]

  return (
    <div data-testid="admin-companies-manager" className="flex flex-col gap-4">
      {/* Toolbar — flex-col at <sm (both controls full-width), flex-row at sm+ */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('search_placeholder')}
            className="h-9 pl-9 rounded-xl w-full"
          />
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4 shrink-0" />
          {t('new_btn')}
        </Button>
      </div>

      {/* Table (lg+) / Card (<lg) — tableAtLg pattern */}
      <AdminTable
        rows={filtered}
        columns={columns}
        rowKey={company => company.id}
        onRowClick={company => setEditing(company)}
        emptyState={t('empty')}
        cardRow={company => ({
          title: <span className="font-medium">{company.name}</span>,
          subtitle: (
            <span className="text-sm text-muted-foreground">
              {company.agentCount > 0 ? (
                company.agentCount === 1
                  ? t('agents_count_one')
                  : t('agents_count_other', { count: company.agentCount })
              ) : '—'}
            </span>
          ),
          trailing: (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/5 shrink-0"
                onClick={e => { e.stopPropagation(); setDeletingId(company.id) }}
                aria-label={tc('delete')}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
              <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" aria-hidden="true" />
            </div>
          ),
        })}
      />

      {/* Create modal */}
      {creating && (
        <CompanyFormDialog
          onClose={() => setCreating(false)}
          onDone={handleCreated}
        />
      )}

      {/* Edit modal */}
      {editing && (
        <CompanyFormDialog
          company={editing}
          onClose={() => setEditing(null)}
          onDone={handleUpdated}
        />
      )}

      {/* Delete confirmation */}
      {deletingId && (
        <Dialog open onOpenChange={open => { if (!open) setDeletingId(null) }}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>{t('confirm_delete')}</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">{t('confirm_delete_body')}</p>
            <div className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setDeletingId(null)} disabled={deleting}>
                {tc('cancel')}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
                className="gap-1.5"
              >
                {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />}
                {tc('delete')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
