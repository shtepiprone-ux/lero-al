'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { AdminInput } from '@/components/admin/AdminInput'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Combobox } from '@/components/shared/Combobox'
import { cn } from '@/lib/utils'
import { CheckCircle2, Save, Loader2, AlertCircle } from 'lucide-react'
import { saveSettings } from '@/modules/admin/actions'

type Tab = 'general' | 'brand' | 'footer' | 'seo' | 'i18n'

const TAB_KEYS: Record<Tab, string[]> = {
  general: ['site_name', 'tagline', 'contact_email', 'contact_phone'],
  brand:   ['logo_url', 'logo_dark_url', 'favicon_url'],
  footer:  ['social_facebook', 'social_instagram', 'social_linkedin', 'about_al', 'about_uk'],
  seo:     ['meta_title', 'meta_desc', 'og_image', 'archived_noindex_days'],
  i18n:    ['default_locale'],
}

// Language labels built inside component using translations (see AdminSettings function)

export interface AllSettings {
  site_name: string
  tagline: string
  contact_email: string
  contact_phone: string
  logo_url: string
  logo_dark_url: string
  favicon_url: string
  social_facebook: string
  social_instagram: string
  social_linkedin: string
  about_al: string
  about_uk: string
  meta_title: string
  meta_desc: string
  og_image: string
  archived_noindex_days: string
  default_locale: string
}

interface Props {
  initialSettings: AllSettings
}

function Field({ label, id, hint, children }: { label: string; id?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-2">{title}</p>
      {children}
    </div>
  )
}

export function AdminSettings({ initialSettings }: Props) {
  const t = useTranslations('admin.settings')
  const tNav = useTranslations('nav')
  const LOCALE_OPTIONS = [
    { value: 'sq', label: `🇦🇱 ${tNav('lang_sq')}` },
    { value: 'en', label: `🇬🇧 ${tNav('lang_en')}` },
    { value: 'uk', label: `🇺🇦 ${tNav('lang_uk')}` },
    { value: 'it', label: `🇮🇹 ${tNav('lang_it')}` },
  ]
  const [tab, setTab] = useState<Tab>('general')
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle')
  const [isPending, startTransition] = useTransition()
  const [settings, setSettings] = useState<AllSettings>(initialSettings)

  const TABS: { key: Tab; label: string }[] = [
    { key: 'general', label: t('tab_general') },
    { key: 'brand',   label: t('tab_brand') },
    { key: 'footer',  label: t('tab_footer') },
    { key: 'seo',     label: t('tab_seo') },
    { key: 'i18n',    label: t('tab_i18n') },
  ]

  function set(key: keyof AllSettings) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setSettings(prev => ({ ...prev, [key]: e.target.value }))
      if (saveState !== 'idle') setSaveState('idle')
    }
  }

  function handleSave() {
    const keys = TAB_KEYS[tab]
    if (keys.length === 0) {
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 3000)
      return
    }
    const entries: Record<string, string> = {}
    keys.forEach(k => { entries[k] = settings[k as keyof AllSettings] })

    startTransition(async () => {
      const result = await saveSettings(entries)
      if (result.error) {
        setSaveState('error')
      } else {
        setSaveState('saved')
        setTimeout(() => setSaveState('idle'), 3000)
      }
    })
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Tab bar */}
      <div className="flex gap-1 bg-muted rounded-xl p-1 flex-wrap">
        {TABS.map(tb => (
          <Button
            key={tb.key}
            type="button"
            variant="ghost"
            onClick={() => { setTab(tb.key); setSaveState('idle') }}
            size="tab"
            className={cn(tab === tb.key ? 'bg-card shadow-sm text-foreground hover:bg-card' : 'text-muted-foreground hover:text-foreground')}
          >
            {tb.label}
          </Button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-card rounded-2xl border shadow-sm p-6 flex flex-col gap-6">

        {tab === 'general' && (
          <>
            <Section title={t('section_general_info')}>
              <Field label={t('field_site_name')} id="site-name" hint={t('field_site_name_hint')}>
                <AdminInput id="site-name" value={settings.site_name} onChange={set('site_name')} />
              </Field>
              <Field label={t('field_tagline')} id="tagline">
                <AdminInput id="tagline" value={settings.tagline} onChange={set('tagline')} />
              </Field>
              <Field label={t('field_contact_email')} id="contact-email">
                <AdminInput id="contact-email" type="email" value={settings.contact_email} onChange={set('contact_email')} placeholder="info@lero.al" />
              </Field>
              <Field label={t('field_contact_phone')} id="contact-phone">
                <AdminInput id="contact-phone" value={settings.contact_phone} onChange={set('contact_phone')} placeholder="+355 XX XXX XXXX" />
              </Field>
            </Section>
          </>
        )}

        {tab === 'brand' && (
          <>
            <Section title={t('section_branding')}>
              <Field label={t('field_logo_url')} id="logo-url">
                <AdminInput id="logo-url" value={settings.logo_url} onChange={set('logo_url')} placeholder="https://res.cloudinary.com/..." />
              </Field>
              <Field label={t('field_logo_dark_url')} id="logo-dark-url">
                <AdminInput id="logo-dark-url" value={settings.logo_dark_url} onChange={set('logo_dark_url')} placeholder="https://res.cloudinary.com/..." />
              </Field>
              <Field label={t('field_favicon_url')} id="favicon">
                <AdminInput id="favicon" value={settings.favicon_url} onChange={set('favicon_url')} placeholder="https://..." />
              </Field>
            </Section>
            <Section title={t('section_brand_colors')}>
              <p className="text-xs text-muted-foreground">
                {t('section_brand_colors_desc').split('src/app/globals.css')[0]}
                <code className="bg-muted px-1 py-0.5 rounded text-xs">src/app/globals.css</code>
                {t('section_brand_colors_desc').split('src/app/globals.css')[1]}
              </p>
            </Section>
          </>
        )}

        {tab === 'footer' && (
          <>
            <Section title={t('section_social')}>
              <Field label="Facebook" id="facebook">
                <AdminInput id="facebook" value={settings.social_facebook} onChange={set('social_facebook')} placeholder="https://facebook.com/lero.al" />
              </Field>
              <Field label="Instagram" id="instagram">
                <AdminInput id="instagram" value={settings.social_instagram} onChange={set('social_instagram')} placeholder="https://instagram.com/lero.al" />
              </Field>
              <Field label="LinkedIn" id="linkedin">
                <AdminInput id="linkedin" value={settings.social_linkedin} onChange={set('social_linkedin')} placeholder="https://linkedin.com/company/lero-al" />
              </Field>
            </Section>
            <Section title={t('section_footer_text')}>
              <Field label={t('field_about_al')} id="about-al">
                <Textarea id="about-al" rows={3} value={settings.about_al} onChange={set('about_al')} placeholder="Tregu kryesor i pasurive të paluajtshme..." className="rounded-xl resize-none" />
              </Field>
              <Field label={t('field_about_uk')} id="about-uk">
                <Textarea id="about-uk" rows={3} value={settings.about_uk} onChange={set('about_uk')} placeholder="Головний ринок нерухомості..." className="rounded-xl resize-none" />
              </Field>
            </Section>
          </>
        )}

        {tab === 'seo' && (
          <>
            <Section title={t('section_seo')}>
              <Field label={t('field_meta_title')} id="meta-title">
                <AdminInput id="meta-title" value={settings.meta_title} onChange={set('meta_title')} />
              </Field>
              <Field label={t('field_meta_desc')} id="meta-desc">
                <Textarea id="meta-desc" rows={3} value={settings.meta_desc} onChange={set('meta_desc')} className="rounded-xl resize-none" />
              </Field>
              <Field label={t('field_og_image')} id="og-image">
                <AdminInput id="og-image" value={settings.og_image} onChange={set('og_image')} placeholder="https://lero.al/og-image.jpg" />
              </Field>
            </Section>
            <Section title={t('section_archived')}>
              <Field
                label={t('field_noindex_days')}
                id="archived-noindex-days"
                hint={t('field_noindex_days_hint')}
              >
                <AdminInput
                  id="archived-noindex-days"
                  type="number"
                  min={1}
                  max={365}
                  value={settings.archived_noindex_days}
                  onChange={set('archived_noindex_days')}
                  className="w-32"
                />
              </Field>
            </Section>
          </>
        )}

        {tab === 'i18n' && (
          <>
            <Section title={t('section_i18n')}>
              <Field
                label={t('field_default_locale')}
                id="default-locale"
                hint={t('field_default_locale_hint')}
              >
                <Combobox
                  options={LOCALE_OPTIONS}
                  value={settings.default_locale || 'sq'}
                  onChange={v => setSettings(prev => ({ ...prev, default_locale: v || 'sq' }))}
                  variant="button"
                  size="sm"
                  triggerClassName="h-10 w-60"
                  className="w-60"
                />
              </Field>
              <div className="flex flex-col gap-2">
                {LOCALE_OPTIONS.map(lang => (
                  <div key={lang.value} className="flex items-center justify-between px-4 py-3 rounded-xl border">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">{lang.label}</span>
                      {(settings.default_locale || 'sq') === lang.value && (
                        <span className="text-2xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-semibold">DEFAULT</span>
                      )}
                    </div>
                    <span className="text-xs font-medium text-status-success">{t('locale_active')}</span>
                  </div>
                ))}
              </div>
            </Section>
          </>
        )}

        <div className="flex items-center justify-between pt-2 border-t max-sm:flex-col max-sm:items-stretch [&>*]:max-sm:w-full">
          {saveState === 'error' && (
            <span className="flex items-center gap-1.5 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {t('save_error')}
            </span>
          )}
          <div className="ml-auto max-sm:ml-0 max-sm:w-full">
            <Button
              type="button"
              className="gap-2 rounded-xl h-10"
              disabled={isPending}
              onClick={handleSave}
            >
              {isPending
                ? <><Loader2 className="h-4 w-4 animate-spin" /> {t('saving_btn')}</>
                : saveState === 'saved'
                ? <><CheckCircle2 className="h-4 w-4" /> {t('saved_btn')}</>
                : <><Save className="h-4 w-4" /> {t('save_btn')}</>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
