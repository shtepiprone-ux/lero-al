'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Plus, Trash2, Loader2, GripVertical, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { upsertFooterContent } from '@/modules/admin/actions/footer'
import type { SiteFooter, FooterLink } from '@/types/database'
import { isValidFooterUrl } from '@/lib/footer-route-allowlist'

type Locale = 'sq' | 'en' | 'uk' | 'it'
const LOCALES: Locale[] = ['sq', 'en', 'uk', 'it']

function newLink(): FooterLink {
  return { id: crypto.randomUUID(), label: '', url: '', enabled: true, order: 0 }
}

function normalizeLinks(links: FooterLink[]): FooterLink[] {
  return links.map((l, i) => ({ ...l, order: i }))
}

// ── Link group editor ────────────────────────────────────────────────────────

function LinkGroupEditor({
  links,
  onChange,
  disabled,
}: {
  links: FooterLink[]
  onChange: (links: FooterLink[]) => void
  disabled?: boolean
}) {
  const t = useTranslations('admin.footer')

  function addLink() {
    onChange([...links, newLink()])
  }

  function updateLink(id: string, field: keyof FooterLink, value: string | boolean) {
    onChange(links.map(l => l.id === id ? { ...l, [field]: value } : l))
  }

  function removeLink(id: string) {
    onChange(links.filter(l => l.id !== id))
  }

  return (
    <div className="flex flex-col gap-2">
      {links.map((link, idx) => {
        const urlInvalid = !!link.url && !isValidFooterUrl(link.url)
        return (
          <div key={link.id} className="flex flex-col gap-1">
            <div className={`flex items-center gap-2 p-2 rounded-lg border bg-muted/20${urlInvalid ? ' border-destructive/50' : ''}`}>
              <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
              <span className="text-xs text-muted-foreground w-4 shrink-0 text-center">{idx + 1}</span>
              <Input
                value={link.label}
                onChange={e => updateLink(link.id, 'label', e.target.value)}
                placeholder={t('field_label')}
                disabled={disabled}
                className="h-8 text-sm flex-1"
              />
              <Input
                value={link.url}
                onChange={e => updateLink(link.id, 'url', e.target.value)}
                placeholder={t('url_placeholder')}
                disabled={disabled}
                className={`h-8 text-sm flex-1 font-mono text-xs${urlInvalid ? ' border-destructive focus-visible:ring-destructive/30' : ''}`}
              />
              <button
                type="button"
                onClick={() => updateLink(link.id, 'enabled', !link.enabled)}
                disabled={disabled}
                className="shrink-0 h-8 w-8 flex items-center justify-center rounded-md border border-border hover:bg-muted/60 transition-colors disabled:opacity-50"
                title={link.enabled ? t('disable_link') : t('enable_link')}
              >
                {link.enabled
                  ? <Eye className="h-3.5 w-3.5 text-status-success" />
                  : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
              </button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeLink(link.id)}
                disabled={disabled}
                className="shrink-0 h-8 w-8 hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            {urlInvalid && (
              <div className="flex flex-col gap-0.5 ml-2">
                <p className="text-xs text-destructive">{t('link_url_invalid_internal')}</p>
                <p className="text-xs text-muted-foreground">{t('link_url_internal_help')}</p>
              </div>
            )}
          </div>
        )
      })}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addLink}
        disabled={disabled}
        className="gap-1.5 w-fit mt-1"
      >
        <Plus className="h-3.5 w-3.5" />
        {t('add_link')}
      </Button>
      {links.length > 0 && (
        <p className="text-xs text-muted-foreground">{t('url_hint')}</p>
      )}
    </div>
  )
}

// ── Per-locale form tab ───────────────────────────────────────────────────────

type FormState = Omit<SiteFooter, 'locale' | 'updated_at' | 'updated_by'>

function buildInitialForm(row: SiteFooter | null): FormState {
  return {
    brand_title:          row?.brand_title          ?? '',
    tagline:              row?.tagline              ?? '',
    nav_section_title:    row?.nav_section_title    ?? '',
    nav_links:            row?.nav_links            ?? [],
    info_section_title:   row?.info_section_title   ?? '',
    info_links:           row?.info_links           ?? [],
    social_section_title: row?.social_section_title ?? '',
    social_links:         row?.social_links         ?? [],
    copyright_template:   row?.copyright_template   ?? '',
  }
}

function FormField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

function LocaleTab({
  data,
  onChange,
  onSave,
  isPending,
}: {
  locale: Locale
  data: FormState
  onChange: (field: keyof FormState, value: string | FooterLink[]) => void
  onSave: () => void
  isPending: boolean
}) {
  const t = useTranslations('admin.footer')

  return (
    <div className="flex flex-col gap-5 pt-4">
      {/* Brand */}
      <div className="rounded-xl border bg-card p-4 flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t('section_brand')}</p>
        <FormField label={t('field_brand_title')}>
          <Input value={data.brand_title} onChange={e => onChange('brand_title', e.target.value)} disabled={isPending} className="h-10 rounded-xl" />
        </FormField>
        <FormField label={t('field_tagline')}>
          <Input value={data.tagline} onChange={e => onChange('tagline', e.target.value)} disabled={isPending} className="h-10 rounded-xl" />
        </FormField>
        <FormField label={t('field_copyright_template')} hint={t('copyright_hint', { year: '{year}' })}>
          <Input value={data.copyright_template} onChange={e => onChange('copyright_template', e.target.value)} disabled={isPending} className="h-10 rounded-xl font-mono text-sm" placeholder="© {year} Lero.al" />
        </FormField>
      </div>

      {/* Navigation links */}
      <div className="rounded-xl border bg-card p-4 flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t('field_nav_links')}</p>
        <FormField label={t('field_section_title')}>
          <Input value={data.nav_section_title} onChange={e => onChange('nav_section_title', e.target.value)} disabled={isPending} className="h-10 rounded-xl" />
        </FormField>
        <LinkGroupEditor
          links={data.nav_links}
          onChange={links => onChange('nav_links', normalizeLinks(links))}
          disabled={isPending}
        />
      </div>

      {/* Information links */}
      <div className="rounded-xl border bg-card p-4 flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t('field_info_links')}</p>
        <FormField label={t('field_section_title')}>
          <Input value={data.info_section_title} onChange={e => onChange('info_section_title', e.target.value)} disabled={isPending} className="h-10 rounded-xl" />
        </FormField>
        <LinkGroupEditor
          links={data.info_links}
          onChange={links => onChange('info_links', normalizeLinks(links))}
          disabled={isPending}
        />
      </div>

      {/* Social links */}
      <div className="rounded-xl border bg-card p-4 flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t('field_social_links')}</p>
        <FormField label={t('field_section_title')}>
          <Input value={data.social_section_title} onChange={e => onChange('social_section_title', e.target.value)} disabled={isPending} className="h-10 rounded-xl" />
        </FormField>
        <LinkGroupEditor
          links={data.social_links}
          onChange={links => onChange('social_links', normalizeLinks(links))}
          disabled={isPending}
        />
      </div>

      {/* Save */}
      <div className="flex justify-end pt-1">
        <Button onClick={onSave} disabled={isPending} size="xl" className="px-8 rounded-xl gap-2">
          {isPending && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
          {t('save')}
        </Button>
      </div>
    </div>
  )
}

// ── Main manager ──────────────────────────────────────────────────────────────

interface Props {
  initialData: Record<string, SiteFooter | null>
  initialized: boolean
  serverError?: string
}

export function AdminFooterManager({ initialData, initialized, serverError }: Props) {
  const t = useTranslations('admin.footer')
  const [activeLocale, setActiveLocale] = useState<Locale>('sq')
  const [isPending, startTransition] = useTransition()

  const [forms, setForms] = useState<Record<Locale, FormState>>(() => ({
    sq: buildInitialForm(initialData.sq ?? null),
    en: buildInitialForm(initialData.en ?? null),
    uk: buildInitialForm(initialData.uk ?? null),
    it: buildInitialForm(initialData.it ?? null),
  }))

  const tabLabel: Record<Locale, string> = {
    sq: t('tab_sq'), en: t('tab_en'), uk: t('tab_uk'), it: t('tab_it'),
  }

  function updateField(locale: Locale, field: keyof FormState, value: string | FooterLink[]) {
    setForms(prev => ({
      ...prev,
      [locale]: { ...prev[locale], [field]: value },
    }))
  }

  function handleSave(locale: Locale) {
    const form = forms[locale]
    const allLinks = [...form.nav_links, ...form.info_links, ...form.social_links]
    if (allLinks.some(l => l.enabled && !isValidFooterUrl(l.url))) {
      toast.error(t('error_invalid_internal_link'))
      return
    }
    startTransition(async () => {
      const result = await upsertFooterContent(locale, form)
      if (result.error === 'forbidden') { toast.error(t('error_forbidden')); return }
      if (result.error === 'invalid_url') { toast.error(t('error_invalid_url')); return }
      if (result.error === 'invalid_internal_link') { toast.error(t('error_invalid_internal_link')); return }
      if (result.error) { toast.error(t('error_save')); return }
      toast.success(t('save_success'))
    })
  }

  if (!initialized) {
    return (
      <div className="rounded-xl border border-status-warning/40 bg-status-warning/5 px-5 py-6 text-sm text-muted-foreground">
        {serverError === 'forbidden' ? t('error_forbidden') : t('not_initialized')}
      </div>
    )
  }

  return (
    <Tabs value={activeLocale} onValueChange={v => setActiveLocale(v as Locale)}>
      <TabsList className="w-full">
        {LOCALES.map(loc => (
          <TabsTrigger key={loc} value={loc} className="flex-1">
            {tabLabel[loc]}
          </TabsTrigger>
        ))}
      </TabsList>

      {LOCALES.map(loc => (
        <TabsContent key={loc} value={loc}>
          <LocaleTab
            locale={loc}
            data={forms[loc]}
            onChange={(field, value) => updateField(loc, field, value)}
            onSave={() => handleSave(loc)}
            isPending={isPending}
          />
        </TabsContent>
      ))}
    </Tabs>
  )
}
