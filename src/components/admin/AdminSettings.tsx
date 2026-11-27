'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Badge, Box, Button, Code, Divider, Group, NumberInput, Paper, ScrollArea, Stack, Tabs, Text, TextInput, Textarea, useMantineTheme } from '@mantine/core'
import { Check, CheckCircle2, Save, AlertCircle } from 'lucide-react'
import { MantineFormSection } from '@/design-system/mantine/patterns/MantineFormSectionStack'
import { MantineSelect } from '@/design-system/mantine/patterns/MantineSelect'
import { saveSettings } from '@/modules/admin/actions'
import { META_DESC_KEYS, META_TITLE_KEYS, SITE_LOCALES } from '@/modules/admin/lib/settingKeys'

// Task 989: the Footer tab left (its fields are on the admin "Footer" page, O989-3); the SEO tab holds the title and description of each language.
type Tab = 'general' | 'brand' | 'seo' | 'i18n'

const TAB_KEYS: Record<Tab, readonly string[]> = {
  general: ['site_name'],
  brand:   ['logo_url', 'favicon_url'],
  seo:     [...META_TITLE_KEYS, ...META_DESC_KEYS, 'og_image', 'archived_noindex_days'],
  i18n:    ['default_locale'],
}

/** the values of the settings form, one per key of `SETTINGS_FORM_KEYS` (`@/modules/admin/lib/settingKeys`) */
export type AllSettings = Record<string, string>

interface Props {
  initialSettings: AllSettings
}

export function AdminSettings({ initialSettings }: Props) {
  const t = useTranslations('admin.settings')
  const tNav = useTranslations('nav')
  const theme = useMantineTheme()
  const LOCALE_OPTIONS = [
    { value: 'sq', label: `🇦🇱 ${tNav('lang_sq')}` },
    { value: 'en', label: `🇬🇧 ${tNav('lang_en')}` },
    { value: 'uk', label: `🇺🇦 ${tNav('lang_uk')}` },
    { value: 'it', label: `🇮🇹 ${tNav('lang_it')}` },
  ]
  const LANGUAGE: Record<string, string> = { sq: tNav('lang_sq'), en: tNav('lang_en'), uk: tNav('lang_uk'), it: tNav('lang_it') }
  const [tab, setTab] = useState<Tab>('general')
  const [seoLocale, setSeoLocale] = useState<string>('sq')
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle')
  const [isPending, startTransition] = useTransition()
  const [settings, setSettings] = useState<AllSettings>(initialSettings)

  const TABS: { key: Tab; label: string }[] = [
    { key: 'general', label: t('tab_general') },
    { key: 'brand',   label: t('tab_brand') },
    { key: 'seo',     label: t('tab_seo') },
    { key: 'i18n',    label: t('tab_i18n') },
  ]

  function setValue(key: string, value: string) {
    setSettings(prev => ({ ...prev, [key]: value }))
    if (saveState !== 'idle') setSaveState('idle')
  }

  function set(key: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValue(key, e.target.value)
  }

  function handleSave() {
    const entries: Record<string, string> = {}
    TAB_KEYS[tab].forEach(k => { entries[k] = settings[k] ?? '' })

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

  const icon = theme.other.iconSize.compact
  const defaultLocale = settings.default_locale || 'sq'

  return (
    <Stack data-testid="admin-settings" gap="lg">
      <Tabs value={tab} onChange={v => { if (v) { setTab(v as Tab); setSaveState('idle') } }} keepMounted={false}>
        <ScrollArea type="auto" scrollbars="x" scrollbarSize={0}>
          <Tabs.List>
            {TABS.map(tb => (
              <Tabs.Tab key={tb.key} value={tb.key}>{tb.label}</Tabs.Tab>
            ))}
          </Tabs.List>
        </ScrollArea>

        <Tabs.Panel value="general" pt="md">
          <MantineFormSection title={t('section_general_info')}>
            <TextInput id="site-name" label={t('field_site_name')} description={t('field_site_name_hint')} inputWrapperOrder={['label', 'input', 'description', 'error']}
              value={settings.site_name ?? ''} onChange={set('site_name')} />
          </MantineFormSection>
        </Tabs.Panel>

        <Tabs.Panel value="brand" pt="md">
          <Stack gap="lg">
            <MantineFormSection title={t('section_branding')}>
              <Stack gap="md">
                <TextInput id="logo-url" label={t('field_logo_url')} value={settings.logo_url ?? ''} onChange={set('logo_url')} placeholder="https://res.cloudinary.com/..." />
                <TextInput id="favicon" label={t('field_favicon_url')} value={settings.favicon_url ?? ''} onChange={set('favicon_url')} placeholder="https://res.cloudinary.com/..." />
              </Stack>
            </MantineFormSection>
            <MantineFormSection title={t('section_brand_colors')}>
              <Text fz="xs" c="dimmed">
                {t('section_brand_colors_desc').split('src/app/globals.css')[0]}
                <Code>src/app/globals.css</Code>
                {t('section_brand_colors_desc').split('src/app/globals.css')[1]}
              </Text>
            </MantineFormSection>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="seo" pt="md">
          <Stack gap="lg">
            <MantineFormSection title={t('section_seo')}>
              <Stack gap="lg">
                {/* Owner, 2026-11-27: one tab per language, the title and description of that language in it; a tab whose title is filled carries a check, as the
                    page editor's language tabs (`PageEditorDialogView`). Four tabs do not fit 320px: the strip swipes sideways. */}
                <Tabs value={seoLocale} onChange={v => { if (v) setSeoLocale(v) }} keepMounted={false}>
                  <ScrollArea type="auto" scrollbars="x" scrollbarSize={0}>
                    <Tabs.List>
                      {SITE_LOCALES.map(loc => (
                        <Tabs.Tab
                          key={loc}
                          value={loc}
                          rightSection={settings[`meta_title_${loc}`]?.trim() ? (
                            <Box component="span" c="brand" display="inline-flex" aria-hidden>
                              <Check size={icon} />
                            </Box>
                          ) : null}
                        >
                          {LANGUAGE[loc]}
                        </Tabs.Tab>
                      ))}
                    </Tabs.List>
                  </ScrollArea>
                  {SITE_LOCALES.map(loc => (
                    <Tabs.Panel key={loc} value={loc} pt="md">
                      <Stack gap="md">
                        <TextInput id={`meta-title-${loc}`} label={t('field_meta_title')}
                          value={settings[`meta_title_${loc}`] ?? ''} onChange={set(`meta_title_${loc}`)} />
                        <Textarea id={`meta-desc-${loc}`} label={t('field_meta_desc')} rows={3}
                          value={settings[`meta_desc_${loc}`] ?? ''} onChange={set(`meta_desc_${loc}`)} />
                      </Stack>
                    </Tabs.Panel>
                  ))}
                </Tabs>
                <Divider />
                <TextInput id="og-image" label={t('field_og_image')} value={settings.og_image ?? ''} onChange={set('og_image')} placeholder="https://lero.al/og-image.jpg" />
              </Stack>
            </MantineFormSection>
            <MantineFormSection title={t('section_archived')}>
              <NumberInput
                id="archived-noindex-days"
                label={t('field_noindex_days')}
                description={t('field_noindex_days_hint')}
                inputWrapperOrder={['label', 'input', 'description', 'error']}
                min={1}
                max={365}
                allowDecimal={false}
                allowNegative={false}
                value={settings.archived_noindex_days ?? ''}
                onChange={v => setValue('archived_noindex_days', String(v))}
              />
            </MantineFormSection>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="i18n" pt="md">
          <MantineFormSection title={t('section_i18n')}>
            <Stack gap="md">
              <MantineSelect
                id="default-locale"
                label={t('field_default_locale')}
                description={t('field_default_locale_hint')}
                inputWrapperOrder={['label', 'input', 'description', 'error']}
                data={LOCALE_OPTIONS}
                value={defaultLocale}
                allowDeselect={false}
                onChange={v => setValue('default_locale', v || 'sq')}
              />
              <Stack gap="xs">
                {LOCALE_OPTIONS.map(lang => (
                  <Paper key={lang.value} withBorder radius="xl" px="md" py="sm">
                    <Group justify="space-between" wrap="nowrap" gap="sm">
                      <Group gap="sm" wrap="nowrap">
                        <Text fz="sm" fw={500}>{lang.label}</Text>
                        {defaultLocale === lang.value && <Badge variant="light" size="xs">DEFAULT</Badge>}
                      </Group>
                      <Text fz="xs" fw={500} c="green">{t('locale_active')}</Text>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            </Stack>
          </MantineFormSection>
        </Tabs.Panel>
      </Tabs>

      <Group justify="space-between" wrap="wrap" gap="sm">
        {saveState === 'error' ? (
          <Group gap="xs" wrap="nowrap" c="red">
            <AlertCircle size={icon} />
            <Text fz="sm" c="red">{t('save_error')}</Text>
          </Group>
        ) : <span />}
        <Button
          type="button"
          w={{ base: '100%', sm: 'auto' }}
          loading={isPending}
          onClick={handleSave}
          leftSection={saveState === 'saved' ? <CheckCircle2 size={icon} /> : <Save size={icon} />}
        >
          {saveState === 'saved' ? t('saved_btn') : t('save_btn')}
        </Button>
      </Group>
    </Stack>
  )
}
