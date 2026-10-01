'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { toast } from '@/lib/toast'
import { AdminPagesView } from '@/components/admin/AdminPagesView'
import { PageEditorDialogView, type PageLocaleFields } from '@/components/admin/PageEditorDialogView'
import { getLocaleContent, isMigrationPending, toSlug, type PageLocale } from '@/components/admin/adminPagesContent'
import { createPage, updatePage, deletePage } from '@/modules/admin/actions'
import { validateSlug } from '@/lib/slug-validator'
import type { Page, PageContent } from '@/types/database'

// ── Page editor dialog (container) ────────────────────────────────────────────
// Kept in this file, like `ProviderFormDialog` in Task 874: a second tier-1 file would be a new
// census baseline key, which Task 868's R9 forbids.

interface PageEditorDialogProps {
  page?: Page
  locale: PageLocale
  onClose: () => void
  onDone: () => void
}

/**
 * Container of the `/admin/pages` create/edit dialog (Task 868). Holds the editor state and the save
 * action; renders only `PageEditorDialogView`. A publish the server refuses with `sq_body_required`
 * (Task 867's guard) switches to the Albanian tab and marks its body field instead of raising the
 * generic save-error toast.
 */
export function PageEditorDialog({ page, locale: adminLocale, onClose, onDone }: PageEditorDialogProps) {
  const t = useTranslations('admin.pages')
  const tLegal = useTranslations('admin.legal')

  const [activeTab, setActiveTab] = useState<PageLocale>(adminLocale)
  const [localeData, setLocaleData] = useState<PageLocaleFields>({
    sq: getLocaleContent(page, 'sq'),
    en: getLocaleContent(page, 'en'),
    uk: getLocaleContent(page, 'uk'),
    it: getLocaleContent(page, 'it'),
  })
  const [slug, setSlug] = useState(page?.slug ?? '')
  const [slugManual, setSlugManual] = useState(!!page)
  const [slugError, setSlugError] = useState<string | null>(null)
  const [sqBodyError, setSqBodyError] = useState(false)
  const [published, setPublished] = useState(page?.is_published ?? false)
  const [saving, setSaving] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)

  function setField(locale: PageLocale, field: 'title' | 'body', value: string) {
    setLocaleData(prev => ({ ...prev, [locale]: { ...prev[locale], [field]: value } }))
    if (locale === 'sq' && field === 'body') setSqBodyError(false)
    if (locale === 'sq' && field === 'title' && !slugManual) {
      setSlug(toSlug(value))
      setSlugError(null)
    }
  }

  function handleSlugChange(raw: string) {
    const lower = raw.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    setSlug(lower)
    setSlugManual(true)
    const result = validateSlug(lower)
    setSlugError(result.ok ? null : t(result.reason as 'slug_reserved' | 'slug_invalid_format'))
  }

  // Uploads one editor image (`POST /api/upload-cms-image`); a failure toasts and rejects, so the editor
  // keeps its document and its image dialog.
  async function uploadImage(file: File): Promise<string> {
    setImageUploading(true)
    try {
      const form = new FormData()
      form.append('image', file)
      const res = await fetch('/api/upload-cms-image', { method: 'POST', body: form })
      const data = (await res.json().catch(() => null)) as { url?: string } | null
      if (!res.ok || !data?.url) throw new Error('upload_failed')
      return data.url
    } catch (e) {
      toast.error(t('editor.image_upload_error'))
      throw e
    } finally {
      setImageUploading(false)
    }
  }

  async function handleSave() {
    if (!localeData.sq.title.trim()) return
    const currentSlug = slug || toSlug(localeData.sq.title)
    const slugResult = validateSlug(currentSlug)
    if (!slugResult.ok) {
      setSlugError(t(slugResult.reason as 'slug_reserved' | 'slug_invalid_format'))
      return
    }
    setSaving(true)
    const content: PageContent = {
      sq: { title: localeData.sq.title.trim(), body: localeData.sq.body.trim() },
      en: { title: localeData.en.title.trim(), body: localeData.en.body.trim() },
      uk: { title: localeData.uk.title.trim(), body: localeData.uk.body.trim() },
      it: { title: localeData.it.title.trim(), body: localeData.it.body.trim() },
    }
    const result = page
      ? await updatePage(page.id, { title: content.sq.title, slug: currentSlug, content, is_published: published })
      : await createPage({ title: content.sq.title, slug: currentSlug, content, is_published: published })
    setSaving(false)
    if (result.error) {
      if (result.error === 'slug_already_used' || result.error === 'slug_reserved' || result.error === 'slug_invalid_format') {
        setSlugError(t(result.error as 'slug_already_used' | 'slug_reserved' | 'slug_invalid_format'))
      } else if (result.error === 'sq_body_required') {
        setActiveTab('sq')
        setSqBodyError(true)
      } else {
        toast.error(tLegal('save_error'))
      }
      return
    }
    toast.success(tLegal('save_success'))
    onDone()
  }

  return (
    <PageEditorDialogView
      opened
      isEdit={!!page}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      localeData={localeData}
      onFieldChange={setField}
      slug={slug}
      slugError={slugError}
      onSlugChange={handleSlugChange}
      sqBodyError={sqBodyError}
      published={published}
      onPublishedChange={setPublished}
      onUploadImage={uploadImage}
      imageUploading={imageUploading}
      saving={saving}
      onSubmit={handleSave}
      onClose={onClose}
    />
  )
}

// ── Main manager ──────────────────────────────────────────────────────────────

interface Props { pages: Page[]; adminLocale: PageLocale }

/**
 * Container of `/admin/pages` (Task 868). Holds the list, the editor target, the delete target and the
 * server actions; renders only `AdminPagesView`.
 */
export function AdminPagesManager({ pages: init, adminLocale }: Props) {
  const tLegal = useTranslations('admin.legal')
  const router = useRouter()
  const locale = useLocale() as PageLocale
  const activeLocale = adminLocale || locale
  const [, startTransition] = useTransition()
  const [modal, setModal] = useState<'create' | Page | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Page | null>(null)
  const [items, setItems] = useState(init)
  useEffect(() => { setItems(init) }, [init])

  const migrationPending = isMigrationPending(items)

  function handleDone() { setModal(null); router.refresh() }

  function handleConfirmDelete() {
    if (!deleteTarget) return
    const id = deleteTarget.id
    setDeleteTarget(null)
    setDeletingId(id)
    startTransition(async () => {
      const result = await deletePage(id)
      if (result.error) {
        toast.error(tLegal('delete_error'))
      } else {
        setItems(prev => prev.filter(p => p.id !== id))
        toast.success(tLegal('delete_success'))
      }
      setDeletingId(null)
    })
  }

  return (
    <AdminPagesView
      pages={items}
      activeLocale={activeLocale}
      migrationPending={migrationPending}
      deletingId={deletingId}
      deleteTarget={deleteTarget}
      onNew={() => setModal('create')}
      onEdit={setModal}
      onRequestDelete={setDeleteTarget}
      onCancelDelete={() => setDeleteTarget(null)}
      onConfirmDelete={handleConfirmDelete}
      editorSlot={modal ? (
        <PageEditorDialog
          page={modal === 'create' ? undefined : modal}
          locale={activeLocale}
          onClose={() => setModal(null)}
          onDone={handleDone}
        />
      ) : null}
    />
  )
}
