'use client'

import { useState, useTransition, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Mail, Plus, Pencil, Trash2, Loader2, Eye, EyeOff, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { normalizeSearch } from '@/lib/utils'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  upsertEmailTemplateAction,
  deleteEmailTemplateGroupAction,
} from '@/modules/notifications/actions/emailTemplates'
import type { EmailTemplate } from '@/types/database'

const LOCALES = ['sq', 'en', 'uk', 'it'] as const
type Locale = (typeof LOCALES)[number]

// Group templates by key
function groupByKey(templates: EmailTemplate[]): Map<string, Map<Locale, EmailTemplate>> {
  const map = new Map<string, Map<Locale, EmailTemplate>>()
  for (const t of templates) {
    if (!map.has(t.key)) map.set(t.key, new Map())
    map.get(t.key)!.set(t.locale as Locale, t)
  }
  return map
}

const EMPTY_LOCALE_DATA = { subject: '', html_body: '', variables: '', is_active: true }

interface LocaleData {
  subject: string
  html_body: string
  variables: string   // comma-separated
  is_active: boolean
}

// ── HTML Preview ──────────────────────────────────────────────────────────────

function HtmlPreview({ html, title }: { html: string; title: string }) {
  const [open, setOpen] = useState(false)
  const t = useTranslations('admin.email_templates')
  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-1.5 sm:shrink-0">
        <Eye className="h-3.5 w-3.5 shrink-0" />
        {t('preview_btn')}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('preview_title')} — {title}</DialogTitle>
          </DialogHeader>
          {/* sandbox="" prevents script execution, same-origin access, and form submission */}
          <iframe
            sandbox=""
            srcDoc={html}
            className="w-full h-96 border rounded-xl bg-muted"
            title={t('preview_title')}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}

// ── Template editor dialog (create / edit) ────────────────────────────────────

function TemplateEditorDialog({
  templateKey: initialKey,
  existingLocales,
  onClose,
  onSaved,
}: {
  templateKey?: string
  existingLocales: Map<Locale, EmailTemplate>
  onClose: () => void
  onSaved: (key: string, localeMap: Map<Locale, EmailTemplate>) => void
}) {
  const t = useTranslations('admin.email_templates')
  const [isPending, startTransition] = useTransition()
  const isEdit = !!initialKey
  const [key, setKey] = useState(initialKey ?? '')
  const [activeTab, setActiveTab] = useState<Locale>('sq')

  const [localeData, setLocaleData] = useState<Record<Locale, LocaleData>>(() => {
    const init = {} as Record<Locale, LocaleData>
    for (const loc of LOCALES) {
      const existing = existingLocales.get(loc)
      init[loc] = existing
        ? {
            subject: existing.subject,
            html_body: existing.html_body,
            variables: existing.variables.join(', '),
            is_active: existing.is_active,
          }
        : { ...EMPTY_LOCALE_DATA }
    }
    return init
  })

  function setField<K extends keyof LocaleData>(locale: Locale, field: K, value: LocaleData[K]) {
    setLocaleData(prev => ({ ...prev, [locale]: { ...prev[locale], [field]: value } }))
  }

  function handleSave() {
    const normalizedKey = key.trim().toLowerCase().replace(/\s+/g, '_')
    if (!normalizedKey) { toast.error(t('error_key_required')); return }

    // Require at least sq locale to be filled
    if (!localeData.sq.subject.trim() || !localeData.sq.html_body.trim()) {
      toast.error(t('error_sq_required'))
      return
    }

    startTransition(async () => {
      const resultMap = new Map<Locale, EmailTemplate>(existingLocales)

      for (const loc of LOCALES) {
        const d = localeData[loc]
        if (!d.subject.trim() && !d.html_body.trim()) continue // skip empty locales

        const vars = d.variables
          .split(',')
          .map(v => v.trim())
          .filter(Boolean)

        const { template, error } = await upsertEmailTemplateAction({
          key: normalizedKey,
          locale: loc,
          subject: d.subject.trim(),
          html_body: d.html_body,
          variables: vars,
          is_active: d.is_active,
        })

        if (error || !template) {
          toast.error(t('error_save'))
          return
        }
        resultMap.set(loc, template)
      }

      toast.success(t('save_success'))
      onSaved(normalizedKey, resultMap)
    })
  }

  const tabLabels: Record<Locale, string> = {
    sq: t('tab_sq'), en: t('tab_en'), uk: t('tab_uk'), it: t('tab_it'),
  }

  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('edit_title') : t('create_title')}</DialogTitle>
          <DialogDescription>{t('variables_hint', { variableSyntax: '{{variableName}}' })}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Key */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tpl-key">{t('field_key')}</Label>
            <Input
              id="tpl-key"
              value={key}
              onChange={e => setKey(e.target.value)}
              placeholder={t('key_placeholder')}
              disabled={isEdit}
              className={isEdit ? 'opacity-60' : ''}
            />
            {!isEdit && (
              <p className="text-xs text-muted-foreground">{t('field_key_hint')}</p>
            )}
          </div>

          {/* Locale tabs — only sq visible per Albanian-only policy (Task 251, 2026-05-25).
              To restore multi-locale editing: remove the .filter() below. Form state and
              DB rows for en/uk/it are preserved in localeData; the save action still upserts
              non-empty locales. */}
          <Tabs value={activeTab} onValueChange={v => setActiveTab(v as Locale)}>
            <TabsList className="w-full">
              {LOCALES.filter(loc => loc === 'sq').map(loc => (
                <TabsTrigger key={loc} value={loc} className="flex-1">
                  {tabLabels[loc]}
                  {localeData[loc].subject.trim() && (
                    <span className="ml-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            {LOCALES.map(loc => {
              const d = localeData[loc]
              return (
                <TabsContent key={loc} value={loc} className="flex flex-col gap-3 mt-3">
                  {/* Subject */}
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`subj-${loc}`}>{t('field_subject')}</Label>
                    <Input
                      id={`subj-${loc}`}
                      value={d.subject}
                      onChange={e => setField(loc, 'subject', e.target.value)}
                      placeholder={t('field_subject')}
                    />
                  </div>

                  {/* HTML body */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <Label htmlFor={`body-${loc}`}>{t('field_html_body')}</Label>
                      {d.html_body.trim() && (
                        <HtmlPreview html={d.html_body} title={`${key || '—'} / ${loc}`} />
                      )}
                    </div>
                    <textarea
                      id={`body-${loc}`}
                      value={d.html_body}
                      onChange={e => setField(loc, 'html_body', e.target.value)}
                      rows={10}
                      placeholder="<p>Hello {{userName}},</p>"
                      className="flex min-h-30 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                    />
                  </div>

                  {/* Variables */}
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`vars-${loc}`}>{t('field_variables')}</Label>
                    <Input
                      id={`vars-${loc}`}
                      value={d.variables}
                      onChange={e => setField(loc, 'variables', e.target.value)}
                      placeholder="userName, listingTitle, price"
                    />
                    <p className="text-xs text-muted-foreground">{t('variables_hint', { variableSyntax: '{{variableName}}' })}</p>
                  </div>

                  {/* Active toggle */}
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={d.is_active}
                      onChange={e => setField(loc, 'is_active', e.target.checked)}
                      className="h-4 w-4 rounded border-border accent-primary"
                    />
                    <span className="text-sm">{t('field_active')}</span>
                  </label>
                </TabsContent>
              )
            })}
          </Tabs>
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            {t('cancel')}
          </Button>
          <Button type="button" onClick={handleSave} disabled={isPending} className="gap-1.5">
            {isPending && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
            {t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Delete confirmation dialog ────────────────────────────────────────────────

function DeleteConfirmDialog({
  templateKey,
  onClose,
  onDeleted,
}: {
  templateKey: string
  onClose: () => void
  onDeleted: (key: string) => void
}) {
  const t = useTranslations('admin.email_templates')
  const tc = useTranslations('common')
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      const { error } = await deleteEmailTemplateGroupAction(templateKey)
      if (error) { toast.error(t('error_delete')); return }
      toast.success(t('delete_success'))
      onDeleted(templateKey)
    })
  }

  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('delete_title')}</DialogTitle>
          <DialogDescription>
            {t('delete_body', { key: templateKey })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            {tc('cancel')}
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isPending} className="gap-1.5">
            {isPending && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
            {tc('delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Main manager ──────────────────────────────────────────────────────────────

export function AdminEmailTemplatesManager({ templates: initial, isAdmin }: { templates: EmailTemplate[]; isAdmin: boolean }) {
  const t = useTranslations('admin.email_templates')
  const [templates, setTemplates] = useState(initial)
  const [search, setSearch] = useState('')
  const [editorKey, setEditorKey] = useState<string | null>(null)   // null = closed, '' = create new
  const [deleteKey, setDeleteKey] = useState<string | null>(null)

  const grouped = useMemo(() => groupByKey(templates), [templates])

  const filteredKeys = useMemo(() => {
    const q = normalizeSearch(search)
    return Array.from(grouped.keys()).filter(k =>
      !q || normalizeSearch(k).includes(q),
    )
  }, [grouped, search])

  function handleSaved(key: string, localeMap: Map<Locale, EmailTemplate>) {
    setTemplates(prev => {
      const next = prev.filter(t => t.key !== key)
      return [...next, ...Array.from(localeMap.values())]
    })
    setEditorKey(null)
  }

  function handleDeleted(key: string) {
    setTemplates(prev => prev.filter(t => t.key !== key))
    setDeleteKey(null)
  }

  const activeEditorLocales = editorKey !== null
    ? (grouped.get(editorKey) ?? new Map<Locale, EmailTemplate>())
    : new Map<Locale, EmailTemplate>()

  return (
    <div data-testid="admin-email-templates-manager" className="flex flex-col gap-4">
      {/* Albanian-only policy notice */}
      <Alert>
        <AlertDescription>{t('albanian_only_notice')}</AlertDescription>
      </Alert>

      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap sm:gap-3 [&>*]:max-sm:w-full">
        <div className="relative flex-1 min-w-45">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('search_placeholder')}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setEditorKey('')} className="gap-1.5 sm:shrink-0">
          <Plus className="h-4 w-4 shrink-0" />
          {t('create_btn')}
        </Button>
      </div>

      {/* Template list */}
      {filteredKeys.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Mail className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">{search ? t('no_results') : t('empty')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filteredKeys.map(key => {
            const localeMap = grouped.get(key)!
            const configuredLocales = LOCALES.filter(l => localeMap.has(l))
            const allActive = configuredLocales.every(l => localeMap.get(l)?.is_active)
            const latestUpdated = configuredLocales.reduce((max, l) => {
              const d = localeMap.get(l)?.updated_at ?? ''
              return d > max ? d : max
            }, '')

            return (
              <div
                key={key}
                className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors"
              >
                {/* Icon */}
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Mail className="h-4 w-4 text-primary" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate font-mono">{key}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {/* Locale badges */}
                    <div className="flex gap-1">
                      {LOCALES.map(loc => (
                        <span
                          key={loc}
                          className={`text-2xs font-semibold uppercase px-1.5 py-0.5 rounded ${
                            localeMap.has(loc)
                              ? 'bg-primary/10 text-primary'
                              : 'bg-muted text-muted-foreground/50'
                          }`}
                        >
                          {loc}
                        </span>
                      ))}
                    </div>
                    {/* Active/inactive */}
                    <span className={`flex items-center gap-1 text-xs ${allActive ? 'text-status-success' : 'text-muted-foreground'}`}>
                      {allActive ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      {allActive ? t('status_active') : t('status_inactive')}
                    </span>
                    {latestUpdated && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(latestUpdated).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditorKey(key)}
                    aria-label={t('edit_label')}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {isAdmin && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteKey(key)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label={t('delete_label')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Editor dialog */}
      {editorKey !== null && (
        <TemplateEditorDialog
          templateKey={editorKey || undefined}
          existingLocales={activeEditorLocales}
          onClose={() => setEditorKey(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Delete dialog */}
      {deleteKey !== null && (
        <DeleteConfirmDialog
          templateKey={deleteKey}
          onClose={() => setDeleteKey(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  )
}
