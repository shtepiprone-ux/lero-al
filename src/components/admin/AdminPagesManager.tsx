'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Plus, Pencil, Trash2, Loader2, Eye, EyeOff, ExternalLink, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { AdminInput } from '@/components/admin/AdminInput'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { RelativeTime } from '@/components/shared/RelativeTime'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { createPage, updatePage, deletePage } from '@/modules/admin/actions'
import { validateSlug } from '@/lib/slug-validator'
import type { Page, PageContent, PageLocaleContent } from '@/types/database'

type Locale = 'sq' | 'en' | 'uk' | 'it'
const LOCALES: Locale[] = ['sq', 'en', 'uk', 'it']

function toSlug(str: string) {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/^-|-$/g, '')
}

function isLegacyContent(content: unknown): boolean {
  if (!content || typeof content !== 'object') return false
  return !('sq' in (content as object))
}

function getLocaleContent(page: Page | undefined, locale: Locale): PageLocaleContent {
  if (!page) return { title: '', body: '' }
  const c = page.content as PageContent | { body?: string }
  if (isLegacyContent(c)) {
    return locale === 'sq'
      ? { title: page.title ?? '', body: (c as { body?: string }).body ?? '' }
      : { title: '', body: '' }
  }
  const pc = c as PageContent
  return { title: pc[locale]?.title ?? '', body: pc[locale]?.body ?? '' }
}

function isMigrationPending(pages: Page[]): boolean {
  return pages.some(p => isLegacyContent(p.content))
}

function getDisplayTitle(page: Page): string {
  const c = page.content as PageContent | { body?: string }
  if (!isLegacyContent(c)) {
    const pc = c as PageContent
    return pc.sq?.title || page.title || page.slug
  }
  return page.title || page.slug
}

// ── Page Editor Modal ─────────────────────────────────────────────────────────

function PageEditorModal({ page, locale: adminLocale, onClose, onDone }: {
  page?: Page
  locale: Locale
  onClose: () => void
  onDone: () => void
}) {
  const t = useTranslations('admin.pages')
  const tLegal = useTranslations('admin.legal')

  const localeLabels: Record<Locale, string> = {
    sq: t('editor_locale_sq'),
    en: t('editor_locale_en'),
    uk: t('editor_locale_uk'),
    it: t('editor_locale_it'),
  }

  const [activeTab, setActiveTab] = useState<Locale>(adminLocale)
  const [localeData, setLocaleData] = useState<Record<Locale, { title: string; body: string }>>({
    sq: getLocaleContent(page, 'sq'),
    en: getLocaleContent(page, 'en'),
    uk: getLocaleContent(page, 'uk'),
    it: getLocaleContent(page, 'it'),
  })
  const [slug, setSlug] = useState(page?.slug ?? '')
  const [slugManual, setSlugManual] = useState(!!page)
  const [slugError, setSlugError] = useState<string | null>(null)
  const [published, setPublished] = useState(page?.is_published ?? false)
  const [saving, setSaving] = useState(false)

  function setField(locale: Locale, field: 'title' | 'body', value: string) {
    setLocaleData(prev => ({ ...prev, [locale]: { ...prev[locale], [field]: value } }))
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
      } else {
        toast.error(tLegal('save_error'))
      }
      return
    }
    toast.success(tLegal('save_success'))
    onDone()
  }

  const sqMissing = !localeData.sq.title.trim()

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-2xl p-6 bg-card max-h-[90vh] overflow-y-auto" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{page ? tLegal('modal_title_edit') : tLegal('modal_title_new')}</DialogTitle>
        </DialogHeader>

        {/* Locale tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Locale)}>
          <TabsList className="w-full">
            {LOCALES.map(loc => (
              <TabsTrigger key={loc} value={loc} className="flex-1">
                {localeLabels[loc]}
                {localeData[loc].title.trim() && (
                  <span className="ml-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {LOCALES.map(loc => {
            const d = localeData[loc]
            const isEmpty = loc !== 'sq' && !d.title.trim() && !d.body.trim()
            return (
              <TabsContent key={loc} value={loc} className="flex flex-col gap-3 mt-3">
                {isEmpty && (
                  <p className="text-xs text-status-warning bg-status-warning/5 border border-status-warning/40 rounded-lg px-3 py-2">
                    {t('empty_locale_warning')}
                  </p>
                )}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">{t('field_title_label')}{loc === 'sq' && <span className="text-destructive ml-0.5">*</span>}</Label>
                  <AdminInput
                    value={d.title}
                    onChange={e => setField(loc, 'title', e.target.value)}
                    placeholder={localeLabels[loc]}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">{t('field_body_label')}</Label>
                  <Textarea
                    value={d.body}
                    onChange={e => setField(loc, 'body', e.target.value)}
                    rows={10}
                    className="rounded-xl font-mono text-xs resize-none"
                    placeholder="<h2>...</h2><p>...</p>"
                  />
                </div>
              </TabsContent>
            )
          })}
        </Tabs>

        {/* Shared fields */}
        <div className="flex flex-col gap-1.5 mt-1">
          <Label className="text-xs">{t('field_slug_label')}</Label>
          <AdminInput
            value={slug}
            onChange={e => handleSlugChange(e.target.value)}
            className="font-mono text-xs"
            placeholder="about-us"
          />
          {slugError && <p className="text-xs text-destructive">{slugError}</p>}
          {page && <p className="text-xs text-status-warning">{t('slug_url_warning')}</p>}
        </div>

        <div className="flex items-center gap-3 mt-1">
          <button
            type="button"
            onClick={() => setPublished(p => !p)}
            className={`flex items-center gap-2 text-sm font-medium transition-colors ${
              published ? 'text-status-success' : 'text-muted-foreground'
            }`}
          >
            {published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            {published ? tLegal('toggle_published') : tLegal('toggle_draft')}
          </button>
        </div>

        <DialogFooter className="gap-2 mt-2">
          <Button variant="outline" onClick={onClose} className="flex-1 h-10 rounded-xl">{tLegal('btn_cancel')}</Button>
          <Button onClick={handleSave} disabled={saving || sqMissing || !!slugError} className="flex-1 h-10 rounded-xl">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : tLegal('btn_save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Main manager ──────────────────────────────────────────────────────────────

interface Props { pages: Page[]; adminLocale: Locale }

export function AdminPagesManager({ pages: init, adminLocale }: Props) {
  const t = useTranslations('admin.pages')
  const tLegal = useTranslations('admin.legal')
  const router = useRouter()
  const locale = useLocale() as Locale
  const activeLocale = adminLocale || locale
  const [, startTransition] = useTransition()
  const [modal, setModal] = useState<'create' | Page | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [items, setItems] = useState(init)
  useEffect(() => { setItems(init) }, [init])

  const migrationPending = isMigrationPending(items)

  function handleDone() { setModal(null); router.refresh() }

  async function handleDelete(id: number) {
    if (!confirm(t('delete_confirm'))) return
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
    <>
      {modal && (
        <PageEditorModal
          page={modal === 'create' ? undefined : (modal as Page)}
          locale={activeLocale}
          onClose={() => setModal(null)}
          onDone={handleDone}
        />
      )}

      <div className="flex flex-col gap-4">
        {migrationPending && (
          <div className="flex items-start gap-3 rounded-xl border border-status-warning/40 bg-status-warning/5 px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-status-warning shrink-0 mt-0.5" />
            <p className="text-sm text-status-warning">{t('migration_pending_banner')}</p>
          </div>
        )}

        <div className="flex justify-end">
          <Button
            onClick={() => setModal('create')}
            size="lg"
            className="gap-2 rounded-xl"
            disabled={migrationPending}
          >
            <Plus className="h-4 w-4" />
            {t('btn_new')}
          </Button>
        </div>

        <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
          {items.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-muted-foreground">{tLegal('empty_text')}</p>
              {!migrationPending && (
                <Button onClick={() => setModal('create')} variant="outline" className="mt-4 gap-2 rounded-xl">
                  <Plus className="h-4 w-4" /> {tLegal('btn_add_first')}
                </Button>
              )}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">{t('col_title')}</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">{t('col_slug')}</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">{t('col_status')}</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden lg:table-cell">{t('col_updated')}</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">{tLegal('col_actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map(p => (
                  <tr key={p.id} className={`hover:bg-muted/20 transition-colors ${deletingId === p.id ? 'opacity-50' : ''}`}>
                    <td className="px-5 py-4 font-medium">{getDisplayTitle(p)}</td>
                    <td className="px-5 py-4 hidden md:table-cell font-mono text-xs text-muted-foreground">{p.slug}</td>
                    <td className="px-5 py-4">
                      <Badge variant={p.is_published ? 'success' : 'neutral'} className="text-xs">
                        {p.is_published ? t('status_published') : t('status_draft')}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell text-xs text-muted-foreground">
                      <RelativeTime date={p.updated_at} />
                    </td>
                    <td className="px-5 py-4">
                      {deletingId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                        <div className="flex gap-1 items-center">
                          {p.is_published && (
                            <a
                              href={`/${activeLocale}/${p.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={t('preview_open')}
                              className="h-7 w-7 rounded-lg border border-border flex items-center justify-center hover:border-primary/40 transition-colors"
                            >
                              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                            </a>
                          )}
                          <button
                            onClick={() => !migrationPending && setModal(p)}
                            disabled={migrationPending}
                            className="h-7 w-7 rounded-lg border border-border flex items-center justify-center hover:border-primary/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => !migrationPending && handleDelete(p.id)}
                            disabled={migrationPending}
                            className="h-7 w-7 rounded-lg border border-border flex items-center justify-center hover:border-destructive/40 hover:text-destructive transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
          )}
        </div>
      </div>
    </>
  )
}
