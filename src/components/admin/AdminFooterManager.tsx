'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { ActionIcon, Alert, Button, Grid, Group, Input, Paper, ScrollArea, SimpleGrid, Stack, Switch, Tabs, Text, TextInput, useMantineTheme } from '@mantine/core'
import { Plus, GripVertical, ChevronUp, ChevronDown } from 'lucide-react'
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent, type Modifier } from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { toast } from '@/lib/toast'
import { MantineFormSection } from '@/design-system/mantine/patterns/MantineFormSectionStack'
import { MantineDeleteIconButton } from '@/design-system/mantine/patterns/MantineDeleteIconButton'
import { saveFooterShared, upsertFooterContent, type FooterLocalePayload } from '@/modules/admin/actions/footer'
import { isSwitchOn } from '@/modules/admin/lib/settingKeys'
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

/** a dragged link moves up and down only, inside its list (the `@dnd-kit/modifiers` package does the same; one line does not need a package) */
const restrictToVertical: Modifier = ({ transform }) => ({ ...transform, x: 0 })

// ── Link group editor ────────────────────────────────────────────────────────

/** the list with the link `activeId` moved to the place of `overId`; the same list when either is unknown or they are the same (owner, 2026-11-27: drag to reorder) */
export function reorderLinks(links: FooterLink[], activeId: string, overId: string | null | undefined): FooterLink[] {
  const from = links.findIndex(l => l.id === activeId)
  const to = overId ? links.findIndex(l => l.id === overId) : -1
  if (from === -1 || to === -1 || from === to) return links
  return arrayMove(links, from, to)
}

interface SortableLinkRowProps {
  link: FooterLink
  idx: number
  count: number
  wide: boolean
  disabled?: boolean
  onUpdate: (id: string, field: keyof FooterLink, value: string | boolean) => void
  onRemove: (id: string) => void
  onMove: (from: number, to: number) => void
}

/** one link: its handle drags it (mouse, finger; Space and the arrow keys), its up and down buttons move it by one */
function SortableLinkRow({ link, idx, count, wide, disabled, onUpdate, onRemove, onMove }: SortableLinkRowProps) {
  const t = useTranslations('admin.footer')
  const theme = useMantineTheme()
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: link.id,
    disabled,
    attributes: { roleDescription: t('drag_role') },
  })
  const urlInvalid = !!link.url && !isValidFooterUrl(link.url)
  // dnd-kit moves the row with a runtime transform; it is a position, not a design value. The handle takes `touch-action: none`, or a finger on a phone scrolls
  // the page instead of dragging (dnd-kit, PointerSensor). These two are the only inline styles here, and neither is a visual value.
  const dragStyle = { transform: CSS.Translate.toString(transform), transition }
  const handleStyle = { touchAction: 'none' as const }
  // Revision 1, F3: below 640px each icon control is the touch target; from 640px 32px, as main's row controls (`h-8 w-8`). The delete takes the touch target at
  // every width (owner, 2026-11-27): the canonical MantineDeleteIconButton has no 32px size.
  const controlSize = { base: theme.other.touchTarget, sm: theme.other.iconSize.prominent }
  return (
    <Paper ref={setNodeRef} style={dragStyle} withBorder radius="md" p="sm" shadow={isDragging ? 'md' : undefined} pos="relative" data-testid="footer-link-row">
      <Stack gap="xs">
        <Group justify="space-between" wrap="nowrap" gap="xs">
          <Group gap="xs" wrap="nowrap">
            <ActionIcon ref={setActivatorNodeRef} type="button" variant="subtle" color="gray" size="sm" mih={controlSize} miw={controlSize} aria-label={t('drag_link')} title={t('drag_link')}
              disabled={disabled} data-testid="footer-link-handle" style={handleStyle} {...attributes} {...listeners}>
              <GripVertical size={theme.other.iconSize.compact} />
            </ActionIcon>
            <Text fz="xs" c="dimmed">{idx + 1}</Text>
          </Group>
          <Group gap="xs" wrap="nowrap">
            <ActionIcon type="button" variant="subtle" color="gray" size="sm" mih={controlSize} miw={controlSize} aria-label={t('move_up', { n: idx + 1 })} title={t('move_up', { n: idx + 1 })}
              disabled={disabled || idx === 0} onClick={() => onMove(idx, idx - 1)}>
              <ChevronUp size={theme.other.iconSize.compact} />
            </ActionIcon>
            <ActionIcon type="button" variant="subtle" color="gray" size="sm" mih={controlSize} miw={controlSize} aria-label={t('move_down', { n: idx + 1 })} title={t('move_down', { n: idx + 1 })}
              disabled={disabled || idx === count - 1} onClick={() => onMove(idx, idx + 1)}>
              <ChevronDown size={theme.other.iconSize.compact} />
            </ActionIcon>
            <Switch
              checked={link.enabled}
              onChange={e => onUpdate(link.id, 'enabled', e.currentTarget.checked)}
              disabled={disabled}
              aria-label={t('show_link', { n: idx + 1 })}
            />
            <MantineDeleteIconButton label={t('remove_link', { n: idx + 1 })} onClick={() => onRemove(link.id)} disabled={disabled} touch />
          </Group>
        </Group>
        <SimpleGrid cols={{ base: 1, sm: wide ? 2 : 1 }} spacing="xs">
          <TextInput
            value={link.label}
            onChange={e => onUpdate(link.id, 'label', e.target.value)}
            placeholder={t('field_label')}
            aria-label={t('field_label')}
            disabled={disabled}
          />
          <TextInput
            value={link.url}
            onChange={e => onUpdate(link.id, 'url', e.target.value)}
            placeholder={t('url_placeholder')}
            aria-label={t('field_url')}
            disabled={disabled}
            error={urlInvalid ? t('link_url_invalid_internal') : undefined}
            description={urlInvalid ? t('link_url_internal_help') : undefined}
            inputWrapperOrder={['input', 'error', 'description']}
          />
        </SimpleGrid>
      </Stack>
    </Paper>
  )
}

function LinkGroupEditor({
  links,
  onChange,
  disabled,
  wide = false,
}: {
  links: FooterLink[]
  onChange: (links: FooterLink[]) => void
  disabled?: boolean
  /** the editor has a wide column (the shared social list): label and address side by side from 640px; in a narrow column they stay one under the other */
  wide?: boolean
}) {
  const t = useTranslations('admin.footer')
  const theme = useMantineTheme()

  function addLink() {
    onChange([...links, newLink()])
  }

  function updateLink(id: string, field: keyof FooterLink, value: string | boolean) {
    onChange(links.map(l => l.id === id ? { ...l, [field]: value } : l))
  }

  function removeLink(id: string) {
    onChange(links.filter(l => l.id !== id))
  }

  // Owner, 2026-11-27: the order the footer shows can be changed. The handle drags a link with a mouse or a finger (`PointerSensor`, after 4px so a tap is
  // not a drag) and with the keyboard (`KeyboardSensor`: Space, the arrow keys, Space); the up and down buttons are the single-tap way (WCAG 2.2, 2.5.7).
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const position = (id: string | number | undefined) => links.findIndex(l => l.id === id) + 1

  function moveLink(from: number, to: number) {
    if (to < 0 || to >= links.length || from === to) return
    onChange(arrayMove(links, from, to))
  }

  function handleDragEnd(event: DragEndEvent) {
    const next = reorderLinks(links, String(event.active.id), event.over ? String(event.over.id) : null)
    if (next !== links) onChange(next)
  }

  return (
    <Stack gap="xs">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVertical]}
        onDragEnd={handleDragEnd}
        accessibility={{
          screenReaderInstructions: { draggable: t('drag_instructions') },
          announcements: {
            onDragStart: ({ active }) => t('drag_picked', { n: position(active.id) }),
            onDragOver: ({ active, over }) => over ? t('drag_over', { n: position(active.id), to: position(over.id) }) : undefined,
            onDragEnd: ({ active, over }) => over ? t('drag_dropped', { n: position(active.id), to: position(over.id) }) : undefined,
            onDragCancel: ({ active }) => t('drag_cancelled', { n: position(active.id) }),
          },
        }}
      >
        <SortableContext items={links.map(l => l.id)} strategy={verticalListSortingStrategy}>
          {links.map((link, idx) => (
            <SortableLinkRow
              key={link.id}
              link={link}
              idx={idx}
              count={links.length}
              wide={wide}
              disabled={disabled}
              onUpdate={updateLink}
              onRemove={removeLink}
              onMove={moveLink}
            />
          ))}
        </SortableContext>
      </DndContext>
      <Group>
        <Button type="button" variant="default" size="sm" leftSection={<Plus size={theme.other.iconSize.compact} />} onClick={addLink} disabled={disabled}>
          {t('add_link')}
        </Button>
      </Group>
      {links.length > 0 && (
        <Text fz="xs" c="dimmed">{t('url_hint')}</Text>
      )}
    </Stack>
  )
}

// ── Shared block (Task 989) ──────────────────────────────────────────────────

/** a contact of the shared block: its label and show switch on one row, the input below (mobile adaptation record) */
function SwitchedField({
  id,
  label,
  switchLabel,
  type,
  value,
  shown,
  onValueChange,
  onShownChange,
  disabled,
}: {
  id: string
  label: string
  switchLabel: string
  type: 'tel' | 'email'
  value: string
  shown: boolean
  onValueChange: (value: string) => void
  onShownChange: (shown: boolean) => void
  disabled: boolean
}) {
  return (
    <Stack gap="xs">
      <Group justify="space-between" wrap="nowrap" gap="sm">
        <Input.Label htmlFor={id}>{label}</Input.Label>
        <Switch checked={shown} onChange={e => onShownChange(e.currentTarget.checked)} aria-label={switchLabel} disabled={disabled} />
      </Group>
      <TextInput id={id} type={type} value={value} onChange={e => onValueChange(e.target.value)} disabled={disabled} />
    </Stack>
  )
}

const SHARED_SWITCH_KEYS = ['footer_show_phone', 'footer_show_email_support', 'footer_show_email_sales', 'footer_show_text'] as const
type SharedText = Record<'contact_phone' | 'contact_email' | 'contact_email_sales', string>
type SharedSwitches = Record<typeof SHARED_SWITCH_KEYS[number], boolean>

// ── Per-locale form tab ───────────────────────────────────────────────────────

type FormState = FooterLocalePayload

function buildInitialForm(row: SiteFooter | null): FormState {
  return {
    brand_title:          row?.brand_title          ?? '',
    tagline:              row?.tagline              ?? '',
    nav_section_title:    row?.nav_section_title    ?? '',
    nav_links:            row?.nav_links            ?? [],
    info_section_title:   row?.info_section_title   ?? '',
    info_links:           row?.info_links           ?? [],
    social_section_title: row?.social_section_title ?? '',
    copyright_template:   row?.copyright_template   ?? '',
  }
}

function LocaleTab({
  data,
  onChange,
  onSave,
  isPending,
}: {
  data: FormState
  onChange: (field: keyof FormState, value: string | FooterLink[]) => void
  onSave: () => void
  isPending: boolean
}) {
  const t = useTranslations('admin.footer')

  return (
    <Stack gap="lg">
      {/* Owner, 2026-11-27: the three sections side by side from 1280px (two from 768px, where the admin keeps room for its sidebar from 1024px), one under the
          other on a phone, so the page needs less scrolling. The social links title joins the brand card: the social list itself is in the shared block. */}
      <SimpleGrid cols={{ base: 1, md: 2, xl: 3 }} spacing="lg" verticalSpacing="lg">
        <MantineFormSection title={t('section_brand')}>
          <Stack gap="md">
            <TextInput label={t('field_brand_title')} value={data.brand_title} onChange={e => onChange('brand_title', e.target.value)} disabled={isPending} />
            <TextInput label={t('field_tagline')} value={data.tagline} onChange={e => onChange('tagline', e.target.value)} disabled={isPending} />
            <TextInput
              label={t('field_copyright_template')}
              description={t('copyright_hint', { year: '{year}' })}
              inputWrapperOrder={['label', 'input', 'description', 'error']}
              value={data.copyright_template}
              onChange={e => onChange('copyright_template', e.target.value)}
              disabled={isPending}
              placeholder="© {year} Lero.al"
            />
            <TextInput label={t('field_social_section_title')} value={data.social_section_title} onChange={e => onChange('social_section_title', e.target.value)} disabled={isPending} />
          </Stack>
        </MantineFormSection>

        <MantineFormSection title={t('field_nav_links')}>
          <Stack gap="md">
            <TextInput label={t('field_section_title')} value={data.nav_section_title} onChange={e => onChange('nav_section_title', e.target.value)} disabled={isPending} />
            <LinkGroupEditor links={data.nav_links} onChange={links => onChange('nav_links', normalizeLinks(links))} disabled={isPending} />
          </Stack>
        </MantineFormSection>

        <MantineFormSection title={t('field_info_links')}>
          <Stack gap="md">
            <TextInput label={t('field_section_title')} value={data.info_section_title} onChange={e => onChange('info_section_title', e.target.value)} disabled={isPending} />
            <LinkGroupEditor links={data.info_links} onChange={links => onChange('info_links', normalizeLinks(links))} disabled={isPending} />
          </Stack>
        </MantineFormSection>
      </SimpleGrid>

      <Group justify="flex-end">
        <Button type="button" onClick={onSave} loading={isPending}>
          {t('save')}
        </Button>
      </Group>
    </Stack>
  )
}

// ── Main manager ──────────────────────────────────────────────────────────────

interface Props {
  initialData: Record<string, SiteFooter | null>
  /** Task 989: the contacts and the show switches of the shared block (`site_settings`) */
  initialShared?: Record<string, string>
  initialized: boolean
  serverError?: string
}

export function AdminFooterManager({ initialData, initialShared = {}, initialized, serverError }: Props) {
  const t = useTranslations('admin.footer')
  const [activeLocale, setActiveLocale] = useState<Locale>('sq')
  const [isPending, startTransition] = useTransition()

  const [forms, setForms] = useState<Record<Locale, FormState>>(() => ({
    sq: buildInitialForm(initialData.sq ?? null),
    en: buildInitialForm(initialData.en ?? null),
    uk: buildInitialForm(initialData.uk ?? null),
    it: buildInitialForm(initialData.it ?? null),
  }))

  // Task 989: one social list for all languages, first shown from the sq row
  const [socialLinks, setSocialLinks] = useState<FooterLink[]>(() => initialData.sq?.social_links ?? [])
  const [sharedText, setSharedText] = useState<SharedText>(() => ({
    contact_phone:       initialShared.contact_phone       ?? '',
    contact_email:       initialShared.contact_email       ?? '',
    contact_email_sales: initialShared.contact_email_sales ?? '',
  }))
  const [sharedSwitches, setSharedSwitches] = useState<SharedSwitches>(() => ({
    footer_show_phone:         isSwitchOn(initialShared.footer_show_phone),
    footer_show_email_support: isSwitchOn(initialShared.footer_show_email_support),
    footer_show_email_sales:   isSwitchOn(initialShared.footer_show_email_sales),
    footer_show_text:          isSwitchOn(initialShared.footer_show_text),
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

  function showResult(result: { error?: string }) {
    if (result.error === 'forbidden') { toast.error(t('error_forbidden')); return }
    if (result.error === 'invalid_url') { toast.error(t('error_invalid_url')); return }
    if (result.error === 'invalid_internal_link') { toast.error(t('error_invalid_internal_link')); return }
    if (result.error === 'validation') { toast.error(t('error_invalid_contact')); return }
    if (result.error) { toast.error(t('error_save')); return }
    toast.success(t('save_success'))
  }

  function handleSave(locale: Locale) {
    const form = forms[locale]
    const allLinks = [...form.nav_links, ...form.info_links]
    if (allLinks.some(l => l.enabled && !isValidFooterUrl(l.url))) {
      toast.error(t('error_invalid_internal_link'))
      return
    }
    startTransition(async () => {
      showResult(await upsertFooterContent(locale, form))
    })
  }

  function handleSaveShared() {
    if (socialLinks.some(l => l.enabled && !isValidFooterUrl(l.url))) {
      toast.error(t('error_invalid_internal_link'))
      return
    }
    const settings: Record<string, string> = { ...sharedText }
    for (const key of SHARED_SWITCH_KEYS) settings[key] = sharedSwitches[key] ? 'true' : 'false'
    startTransition(async () => {
      showResult(await saveFooterShared({ settings, social_links: socialLinks }))
    })
  }

  if (!initialized) {
    return (
      <Alert color="yellow" variant="light">
        {serverError === 'forbidden' ? t('error_forbidden') : t('not_initialized')}
      </Alert>
    )
  }

  const text = (key: keyof SharedText) => (value: string) => setSharedText(prev => ({ ...prev, [key]: value }))
  const shown = (key: keyof SharedSwitches) => (value: boolean) => setSharedSwitches(prev => ({ ...prev, [key]: value }))

  return (
    <Stack gap="xl">
      {/* Task 989: what every language shares — contacts, social links and the show switches */}
      <MantineFormSection title={t('section_shared')}>
        <Stack gap="lg">
          {/* Owner, 2026-11-27: the contacts beside the social list from 768px (a third and two thirds from 1280px), one under the other on a phone */}
          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, md: 5, xl: 4 }}>
              <Stack gap="lg">
                <SwitchedField id="footer-phone" label={t('field_phone')} switchLabel={t('show_phone')} type="tel"
                  value={sharedText.contact_phone} shown={sharedSwitches.footer_show_phone}
                  onValueChange={text('contact_phone')} onShownChange={shown('footer_show_phone')} disabled={isPending} />
                <SwitchedField id="footer-email-support" label={t('field_email_support')} switchLabel={t('show_email_support')} type="email"
                  value={sharedText.contact_email} shown={sharedSwitches.footer_show_email_support}
                  onValueChange={text('contact_email')} onShownChange={shown('footer_show_email_support')} disabled={isPending} />
                <SwitchedField id="footer-email-sales" label={t('field_email_sales')} switchLabel={t('show_email_sales')} type="email"
                  value={sharedText.contact_email_sales} shown={sharedSwitches.footer_show_email_sales}
                  onValueChange={text('contact_email_sales')} onShownChange={shown('footer_show_email_sales')} disabled={isPending} />
                <Switch label={t('show_text')} checked={sharedSwitches.footer_show_text} onChange={e => shown('footer_show_text')(e.currentTarget.checked)} disabled={isPending} />
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 7, xl: 8 }}>
              <Stack gap="xs">
                <Input.Label component="p">{t('field_social_links')}</Input.Label>
                <LinkGroupEditor links={socialLinks} onChange={links => setSocialLinks(normalizeLinks(links))} disabled={isPending} wide />
              </Stack>
            </Grid.Col>
          </Grid>
          <Group justify="flex-end">
            <Button type="button" onClick={handleSaveShared} loading={isPending}>
              {t('save_shared')}
            </Button>
          </Group>
        </Stack>
      </MantineFormSection>

      <Tabs value={activeLocale} onChange={v => { if (v) setActiveLocale(v as Locale) }} keepMounted={false}>
        <ScrollArea type="auto" scrollbars="x" scrollbarSize={0}>
          <Tabs.List>
            {LOCALES.map(loc => (
              <Tabs.Tab key={loc} value={loc}>
                {tabLabel[loc]}
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </ScrollArea>

        {LOCALES.map(loc => (
          <Tabs.Panel key={loc} value={loc} pt="md">
            <LocaleTab
              data={forms[loc]}
              onChange={(field, value) => updateField(loc, field, value)}
              onSave={() => handleSave(loc)}
              isPending={isPending}
            />
          </Tabs.Panel>
        ))}
      </Tabs>
    </Stack>
  )
}
