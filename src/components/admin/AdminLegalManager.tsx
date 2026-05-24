'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Plus, Pencil, Trash2, Loader2, Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { RelativeTime } from '@/components/shared/RelativeTime'
import { createPage, updatePage, deletePage } from '@/modules/admin/actions'

function toSlug(str: string) {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/^-|-$/g, '')
}

interface Page { id: number; title: string; slug: string; is_published: boolean; content: Record<string, unknown>; updated_at: string }

function PageModal({ page, onClose, onDone }: {
  page?: Page; onClose: () => void; onDone: () => void
}) {
  const t = useTranslations('admin.legal')
  const [title, setTitle] = useState(page?.title ?? '')
  const [slug, setSlug] = useState(page?.slug ?? '')
  const [body, setBody] = useState(typeof page?.content?.body === 'string' ? page.content.body : '')
  const [published, setPublished] = useState(page?.is_published ?? false)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!title.trim()) return
    setSaving(true)
    const data = {
      title: title.trim(),
      slug: slug.trim() || toSlug(title),
      content: { body: body.trim() },
      is_published: published,
    }
    if (page) {
      await updatePage(page.id, data)
    } else {
      await createPage(data)
    }
    setSaving(false)
    onDone()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-overlay/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-2xl border shadow-2xl p-6 w-full max-w-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <h3 className="font-bold text-base">{page ? t('modal_title_edit') : t('modal_title_new')}</h3>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
            <Label className="text-xs">{t('field_title_label')}</Label>
            <Input value={title} onChange={e => { setTitle(e.target.value); if (!page) setSlug(toSlug(e.target.value)) }} className="h-10 rounded-xl" />
          </div>
          <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
            <Label className="text-xs">Slug</Label>
            <Input value={slug} onChange={e => setSlug(e.target.value)} className="h-10 rounded-xl font-mono text-xs" />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">{t('field_content_label')}</Label>
          <Textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={12}
            className="rounded-xl font-mono text-xs resize-none"
            placeholder="<h2>...</h2><p>...</p>"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPublished(p => !p)}
            className={`flex items-center gap-2 text-sm font-medium transition-colors ${
              published ? 'text-status-success' : 'text-muted-foreground'
            }`}
          >
            {published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            {published ? t('toggle_published') : t('toggle_draft')}
          </button>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1 h-10 rounded-xl">{t('btn_cancel')}</Button>
          <Button onClick={handleSave} disabled={saving || !title.trim()} className="flex-1 h-10 rounded-xl">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t('btn_save')}
          </Button>
        </div>
      </div>
    </div>
  )
}

interface Props { pages: Page[] }

export function AdminLegalManager({ pages: init }: Props) {
  const t = useTranslations('admin.legal')
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [modal, setModal] = useState<'create' | Page | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [items, setItems] = useState(init)

  function handleDone() { setModal(null); router.refresh() }

  async function handleDelete(id: number) {
    if (!confirm(t('delete_confirm'))) return
    setDeletingId(id)
    startTransition(async () => {
      await deletePage(id)
      setItems(prev => prev.filter(p => p.id !== id))
      setDeletingId(null)
    })
  }

  return (
    <>
      {modal && (
        <PageModal
          page={modal === 'create' ? undefined : modal as Page}
          onClose={() => setModal(null)}
          onDone={handleDone}
        />
      )}

      <div className="flex flex-col gap-4">
        <div className="flex justify-end">
          <Button onClick={() => setModal('create')} size="lg" className="gap-2 rounded-xl">
            <Plus className="h-4 w-4" />
            {t('btn_new_doc')}
          </Button>
        </div>

        <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
          {items.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-muted-foreground">{t('empty_text')}</p>
              <Button onClick={() => setModal('create')} variant="outline" className="mt-4 gap-2 rounded-xl">
                <Plus className="h-4 w-4" /> {t('btn_add_first')}
              </Button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">{t('col_title')}</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Slug</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">{t('col_status')}</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden lg:table-cell">{t('col_updated')}</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">{t('col_actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map(p => (
                  <tr key={p.id} className={`hover:bg-muted/20 transition-colors ${deletingId === p.id ? 'opacity-50' : ''}`}>
                    <td className="px-5 py-4 font-medium">{p.title}</td>
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
                        <div className="flex gap-1">
                          <button
                            onClick={() => setModal(p)}
                            className="h-7 w-7 rounded-lg border border-border flex items-center justify-center hover:border-primary/40 transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
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
          )}
        </div>
      </div>
    </>
  )
}
