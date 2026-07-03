import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { Stack, Text, Button, Flex } from '@mantine/core'
import { storyT } from '../../_storyI18n'
import { MantineDrawer } from '@/design-system/mantine/patterns'
import { MantineStoryShell } from '../_MantineStoryShell'

const meta: Meta = {
  title: 'Mantine/Primitives/Drawer',
  parameters: { skipCanvas: true, layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof meta>

function DrawerStandardSection({ locale }: { locale: string }) {
  const [opened, setOpened] = useState(false)
  const t = (key: string) => storyT(locale, `storybook.mantine.${key}`)

  return (
    <Stack gap="xs">
      <Text size="xs" c="gray.5" fw={500}>
        standard drawer, right (closed/resting) — click trigger to open; ≥640: side Mantine Drawer (right); &lt;640: full-width bottom sheet (drag handle · title · body · full-width footer)
      </Text>
      <Button variant="default" onClick={() => setOpened(true)}>{t('drawer_trigger_open')}</Button>
      <MantineDrawer
        opened={opened}
        onClose={() => setOpened(false)}
        title={t('drawer_title')}
        footer={
          <Flex
            direction={{ base: 'column-reverse', sm: 'row' }}
            gap="sm"
            justify={{ base: 'stretch', sm: 'flex-end' }}
          >
            <Button
              variant="outline"
              color="gray"
              w={{ base: '100%', sm: 'auto' }}
              onClick={() => setOpened(false)}
            >
              {t('drawer_cancel')}
            </Button>
            <Button
              color="brand"
              w={{ base: '100%', sm: 'auto' }}
              onClick={() => setOpened(false)}
            >
              {t('drawer_confirm')}
            </Button>
          </Flex>
        }
      >
        <Text size="sm" c="gray.7" style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
          {t('drawer_body')}
        </Text>
      </MantineDrawer>
    </Stack>
  )
}

function DrawerLeftSection({ locale }: { locale: string }) {
  const [opened, setOpened] = useState(false)
  const t = (key: string) => storyT(locale, `storybook.mantine.${key}`)

  return (
    <Stack gap="xs">
      <Text size="xs" c="gray.5" fw={500}>
        left-side drawer (closed/resting) — click trigger to open; ≥640: side Mantine Drawer anchored LEFT; &lt;640: STILL the SAME full-width bottom sheet (side has no effect)
      </Text>
      <Button variant="default" onClick={() => setOpened(true)}>{t('drawer_left_trigger')}</Button>
      <MantineDrawer
        opened={opened}
        onClose={() => setOpened(false)}
        title={t('drawer_title')}
        side="left"
      >
        <Text size="sm" c="gray.7" style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
          {t('drawer_body')}
        </Text>
      </MantineDrawer>
    </Stack>
  )
}

function DrawerLongSection({ locale }: { locale: string }) {
  const [opened, setOpened] = useState(false)
  const t = (key: string) => storyT(locale, `storybook.mantine.${key}`)

  return (
    <Stack gap="xs">
      <Text size="xs" c="gray.5" fw={500}>
        long-content drawer (closed/resting) — click trigger to open; proves internal scroll ≤90dvh at &lt;640 (title + drag handle stay pinned); no footer provided renders cleanly
      </Text>
      <Button variant="default" onClick={() => setOpened(true)}>{t('drawer_long_trigger')}</Button>
      <MantineDrawer
        opened={opened}
        onClose={() => setOpened(false)}
        title={t('drawer_title')}
      >
        {t('drawer_long_body').split('\n\n').map((paragraph) => (
          <Text
            key={paragraph.slice(0, 24)}
            size="sm"
            c="gray.7"
            mb="sm"
            style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}
          >
            {paragraph}
          </Text>
        ))}
      </MantineDrawer>
    </Stack>
  )
}

export const Default: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'

    return (
      <MantineStoryShell>
        <Stack gap="xl">
          <DrawerStandardSection locale={locale} />
          <DrawerLeftSection locale={locale} />
          <DrawerLongSection locale={locale} />
        </Stack>
      </MantineStoryShell>
    )
  },
}
