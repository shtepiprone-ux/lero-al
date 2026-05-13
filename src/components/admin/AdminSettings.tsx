'use client'

import { useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CheckCircle2, Save, Loader2 } from 'lucide-react'
import { saveSetting } from '@/modules/admin/actions'

const TABS = [
  { key: 'general',  label: 'Загальне' },
  { key: 'brand',    label: 'Бренд' },
  { key: 'footer',   label: 'Футер' },
  { key: 'seo',      label: 'SEO' },
  { key: 'i18n',     label: 'Локалізація' },
] as const

type Tab = typeof TABS[number]['key']

interface InitialSettings {
  archived_noindex_days: number
}

interface Props {
  initialSettings: InitialSettings
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
  const [tab, setTab] = useState<Tab>('general')
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [noindexDays, setNoindexDays] = useState(String(initialSettings.archived_noindex_days))

  async function handleSave() {
    if (tab === 'seo') {
      startTransition(async () => {
        await saveSetting('archived_noindex_days', noindexDays)
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      })
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Tab bar */}
      <div className="flex gap-1 bg-muted rounded-xl p-1 flex-wrap">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setSaved(false) }}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              tab === t.key ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-card rounded-2xl border shadow-sm p-6 flex flex-col gap-6">

        {tab === 'general' && (
          <>
            <Section title="Основна інформація">
              <Field label="Назва сайту" id="site-name">
                <Input id="site-name" defaultValue="Lero.al" className="h-10 rounded-xl" />
              </Field>
              <Field label="Слоган" id="tagline">
                <Input id="tagline" defaultValue="Tregu kryesor i pasurive të paluajtshme në Shqipëri." className="h-10 rounded-xl" />
              </Field>
              <Field label="Контактний email" id="contact-email">
                <Input id="contact-email" type="email" placeholder="info@lero.al" className="h-10 rounded-xl" />
              </Field>
              <Field label="Контактний телефон" id="contact-phone">
                <Input id="contact-phone" placeholder="+355 XX XXX XXXX" className="h-10 rounded-xl" />
              </Field>
            </Section>
          </>
        )}

        {tab === 'brand' && (
          <>
            <Section title="Брендинг">
              <Field label="URL логотипу (SVG/PNG)" id="logo-url">
                <Input id="logo-url" placeholder="https://res.cloudinary.com/..." className="h-10 rounded-xl" />
              </Field>
              <Field label="URL логотипу для темного фону" id="logo-dark-url">
                <Input id="logo-dark-url" placeholder="https://res.cloudinary.com/..." className="h-10 rounded-xl" />
              </Field>
              <Field label="Favicon URL" id="favicon">
                <Input id="favicon" placeholder="https://..." className="h-10 rounded-xl" />
              </Field>
            </Section>
            <Section title="Кольори (CSS змінні)">
              <p className="text-xs text-muted-foreground">
                Кольори бренду визначаються у <code className="bg-muted px-1 py-0.5 rounded text-xs">src/app/globals.css</code> через дизайн-систему oklch.
              </p>
            </Section>
          </>
        )}

        {tab === 'footer' && (
          <>
            <Section title="Соціальні мережі">
              <Field label="Facebook" id="facebook">
                <Input id="facebook" placeholder="https://facebook.com/lero.al" className="h-10 rounded-xl" />
              </Field>
              <Field label="Instagram" id="instagram">
                <Input id="instagram" placeholder="https://instagram.com/lero.al" className="h-10 rounded-xl" />
              </Field>
              <Field label="LinkedIn" id="linkedin">
                <Input id="linkedin" placeholder="https://linkedin.com/company/lero-al" className="h-10 rounded-xl" />
              </Field>
            </Section>
            <Section title="Футер — текст">
              <Field label="Текст про компанію (AL)" id="about-al">
                <Textarea id="about-al" rows={3} placeholder="Tregu kryesor i pasurive..." className="rounded-xl resize-none" />
              </Field>
              <Field label="Текст про компанію (UK)" id="about-uk">
                <Textarea id="about-uk" rows={3} placeholder="Головний ринок нерухомості..." className="rounded-xl resize-none" />
              </Field>
            </Section>
          </>
        )}

        {tab === 'seo' && (
          <>
            <Section title="SEO за замовчуванням">
              <Field label="Meta title" id="meta-title">
                <Input id="meta-title" defaultValue="Lero.al — Imobiliare në Shqipëri" className="h-10 rounded-xl" />
              </Field>
              <Field label="Meta description" id="meta-desc">
                <Textarea id="meta-desc" rows={3} defaultValue="Gjeni shtëpinë tuaj të ëndrrave në Shqipëri." className="rounded-xl resize-none" />
              </Field>
              <Field label="OG Image URL" id="og-image">
                <Input id="og-image" placeholder="https://lero.al/og-image.jpg" className="h-10 rounded-xl" />
              </Field>
            </Section>
            <Section title="Архівні оголошення">
              <Field
                label="Noindex після N днів в архіві"
                id="archived-noindex-days"
                hint="Після цього терміну (рахується від дати оновлення оголошення) сторінка отримує noindex. Мінімум: 1 день."
              >
                <Input
                  id="archived-noindex-days"
                  type="number"
                  min={1}
                  max={365}
                  value={noindexDays}
                  onChange={e => setNoindexDays(e.target.value)}
                  className="h-10 rounded-xl w-32"
                />
              </Field>
            </Section>
          </>
        )}

        {tab === 'i18n' && (
          <>
            <Section title="Локалізація">
              <div className="flex flex-col gap-2">
                {[
                  { code: 'sq', label: '🇦🇱 Shqip', active: true, default: true },
                  { code: 'en', label: '🇬🇧 English', active: true, default: false },
                  { code: 'uk', label: '🇺🇦 Українська', active: true, default: false },
                  { code: 'it', label: '🇮🇹 Italiano', active: true, default: false },
                ].map(lang => (
                  <div key={lang.code} className="flex items-center justify-between px-4 py-3 rounded-xl border">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">{lang.label}</span>
                      {lang.default && (
                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-semibold">DEFAULT</span>
                      )}
                    </div>
                    <span className={`text-xs font-medium ${lang.active ? 'text-status-success' : 'text-muted-foreground'}`}>
                      {lang.active ? 'Активна' : 'Вимкнена'}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Зміна локалей потребує оновлення конфігурації у <code className="bg-muted px-1 py-0.5 rounded text-xs">src/i18n/routing.ts</code>.
              </p>
            </Section>
          </>
        )}

        <div className="flex justify-end pt-2 border-t">
          <Button
            type="button"
            className="gap-2 rounded-xl h-10"
            disabled={saved || isPending}
            onClick={handleSave}
          >
            {isPending
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Збереження...</>
              : saved
              ? <><CheckCircle2 className="h-4 w-4" /> Збережено</>
              : <><Save className="h-4 w-4" /> Зберегти зміни</>}
          </Button>
        </div>
      </div>
    </div>
  )
}
