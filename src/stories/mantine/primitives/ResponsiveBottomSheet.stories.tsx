import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { Stack, Text, Button } from '@mantine/core'
import { storyT } from '../../_storyI18n'
import { ResponsiveBottomSheet, SheetContent } from '@/design-system/mantine/patterns/responsiveBottomSheet'
import { MantineStoryShell } from '../_MantineStoryShell'

const meta: Meta = {
  title: 'Mantine/Primitives/ResponsiveBottomSheet',
  parameters: { skipCanvas: true, layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof meta>

function SheetBody({ locale }: { locale: string }) {
  const t = (key: string) => storyT(locale, `storybook.mantine.${key}`)
  return (
    <SheetContent>
      <Text size="sm" c="gray.7" style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
        {t('sheet_body')}
      </Text>
    </SheetContent>
  )
}

function ClosedSection({ locale }: { locale: string }) {
  const [opened, setOpened] = useState(false)
  const t = (key: string) => storyT(locale, `storybook.mantine.${key}`)

  return (
    <Stack gap="xs">
      <Text size="xs" c="gray.5" fw={500}>
        resting (closed) — the canonical foundation Batch C overlays (Select/Popover/DropdownMenu/NavigationMenu/Combobox/Tooltip/Modal/Drawer) render at &lt;640px; click to open
      </Text>
      <Button variant="default" onClick={() => setOpened(true)}>{t('sheet_trigger_open')}</Button>
      <ResponsiveBottomSheet opened={opened} onClose={() => setOpened(false)} title={t('sheet_title')}>
        <SheetBody locale={locale} />
      </ResponsiveBottomSheet>
    </Stack>
  )
}

function OpenedSection({ locale }: { locale: string }) {
  const t = (key: string) => storyT(locale, `storybook.mantine.${key}`)

  return (
    <Stack gap="xs">
      <Text size="xs" c="gray.5" fw={500}>
        opened — the real production composition: DragHandle (centered, top of header) + title + SheetContent-gutter body
      </Text>
      <ResponsiveBottomSheet opened onClose={() => {}} title={t('sheet_title')}>
        <SheetBody locale={locale} />
      </ResponsiveBottomSheet>
    </Stack>
  )
}

export const Default: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'

    return (
      <MantineStoryShell>
        <Stack gap="xl">
          <ClosedSection locale={locale} />
          <OpenedSection locale={locale} />
        </Stack>
      </MantineStoryShell>
    )
  },
}
