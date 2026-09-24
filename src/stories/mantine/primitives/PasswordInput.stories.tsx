import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { PasswordInput, Stack, Text } from '@mantine/core'
import { PasswordRequirementsHint } from '@/design-system/mantine/patterns/PasswordRequirementsHint'
import { storyT } from '../../_storyI18n'
import { MantineStoryShell } from '../_MantineStoryShell'

const meta: Meta = {
  title: 'Mantine/Primitives/PasswordInput',
  parameters: { skipCanvas: true, layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const t = (key: string) => storyT(locale, `storybook.mantine.${key}`)

    return (
      <MantineStoryShell>
        <Stack gap="xl">
          {/* 1 — basic: gray-2 border / shadow-xs / brand :focus-within / reveal toggle */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              basic — gray-2 border / shadow-xs / brand focus-within / 44px outer box / reveal toggle (icon-only → ≥44px exempt per CLAUDE.md)
            </Text>
            <PasswordInput
              label={t('pw_label')}
              placeholder={t('pw_placeholder')}
              description={t('ta_hint')}
              visibilityToggleButtonProps={{ 'aria-label': t('pw_toggle_show') }}
            />
          </Stack>

          {/* 2 — requirements hint (Task 873): real PasswordRequirementsHint, three states */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              requirements-hint — empty (all unmet, muted); partial (mix of ✓/✗); all-met (all ✓); uk wraps at 320
            </Text>
            <Stack gap="md" pl="xs">
              <Stack gap="tight">
                <Text size="xs" c="gray.6">empty</Text>
                <PasswordInput
                  label={t('pw_label')}
                  visibilityToggleButtonProps={{ 'aria-label': t('pw_toggle_show') }}
                />
                <PasswordRequirementsHint value="" />
              </Stack>
              <Stack gap="tight">
                <Text size="xs" c="gray.6">partial</Text>
                <PasswordInput
                  label={t('pw_label')}
                  defaultValue="Abc"
                  visibilityToggleButtonProps={{ 'aria-label': t('pw_toggle_show') }}
                />
                <PasswordRequirementsHint value="Abc" />
              </Stack>
              <Stack gap="tight">
                <Text size="xs" c="gray.6">all-met</Text>
                <PasswordInput
                  label={t('pw_label')}
                  defaultValue="Sample123!"
                  visibilityToggleButtonProps={{ 'aria-label': t('pw_toggle_show') }}
                />
                <PasswordRequirementsHint value="Sample123!" />
              </Stack>
            </Stack>
          </Stack>

          {/* 3 — error: data-error on .mantine-PasswordInput-input → red-6 border / no shadow */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              error — data-error on outer .mantine-PasswordInput-input → red-6 border / no shadow; toggle still operable; label unchanged
            </Text>
            <PasswordInput
              label={t('pw_label')}
              placeholder={t('pw_placeholder')}
              error={t('pw_error')}
              visibilityToggleButtonProps={{ 'aria-label': t('pw_toggle_show') }}
            />
          </Stack>

          {/* 4 — disabled: whole control faded — label + outer box + reveal toggle all at opacity 0.5 (§6e) */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              disabled — whole control faded (label + outer box + reveal toggle → opacity 0.5); transparent bg; not-allowed; no red
            </Text>
            <PasswordInput
              label={t('pw_label')}
              placeholder={t('pw_placeholder')}
              disabled
              visibilityToggleButtonProps={{ 'aria-label': t('pw_toggle_show') }}
            />
          </Stack>
        </Stack>
      </MantineStoryShell>
    )
  },
}
