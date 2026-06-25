import type { Meta, StoryObj } from '@storybook/react'
import { Box, ScrollArea, SegmentedControl, Stack, Text, useMatches } from '@mantine/core'
import { storyT } from '../../_storyI18n'

const meta: Meta = {
  title: 'Mantine/Primitives/SegmentedControl',
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const t = (key: string) => storyT(locale, key)

    // Mobile adaptive pattern (owner decision 2026-06-25):
    //   <640 → minWidth:'100%' — control stretches to full screen width when labels fit
    //          (Mantine control items have flex:1 and distribute the width equally).
    //          When labels overflow the viewport, ScrollArea provides swipe-scroll instead.
    //   ≥640 → minWidth:'auto' — content-width compact, NOT stretched (§6c desktop rule).
    // SSR caveat: useMatches returns base='100%' on first render (pre-hydration);
    //   on desktop this causes a brief full-width→auto reflow after hydration.
    //   Acceptable for stories; production consumers share the same SSR behaviour.
    const mobileMinWidth = useMatches({ base: '100%', sm: 'auto' })

    return (
      <Box p="xl">
        <Stack gap="xl">
          {/* Section 1: Role filter — long uk labels ("Адміністратор"/"Заблокований").
              At <640 with labels fitting: stretches to full width.
              At <640 with labels overflowing (e.g. uk@320): swipe-scroll via ScrollArea. */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              role filter / long-label stress
            </Text>
            <ScrollArea type="auto" scrollbars="x" scrollbarSize={0}>
              <SegmentedControl
                style={{ minWidth: mobileMinWidth }}
                defaultValue="all"
                data={[
                  { label: t('storybook.mantine.seg_demo_role_all'), value: 'all' },
                  { label: t('storybook.mantine.seg_demo_role_admin'), value: 'admin' },
                  { label: t('storybook.mantine.seg_demo_role_blocked'), value: 'blocked' },
                ]}
              />
            </ScrollArea>
          </Stack>

          {/* Section 2: Status filter — short labels.
              At <640: labels fit → control stretches to full screen width.
              At ≥640: content-width compact, NOT stretched. */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              status filter / short labels
            </Text>
            <ScrollArea type="auto" scrollbars="x" scrollbarSize={0}>
              <SegmentedControl
                style={{ minWidth: mobileMinWidth }}
                defaultValue="active"
                data={[
                  { label: t('storybook.mantine.seg_demo_status_active'), value: 'active' },
                  { label: t('storybook.mantine.seg_demo_status_pending'), value: 'pending' },
                  { label: t('storybook.mantine.seg_demo_status_sold'), value: 'sold' },
                ]}
              />
            </ScrollArea>
          </Stack>
        </Stack>
      </Box>
    )
  },
}
