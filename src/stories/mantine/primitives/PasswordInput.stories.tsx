import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Group, PasswordInput, Stack, Text } from '@mantine/core'
import { Check, X } from 'lucide-react'
import { checkPasswordRules } from '@/lib/passwordRules'
import { storyT } from '../../_storyI18n'
import { MantineStoryShell } from '../_MantineStoryShell'

const meta: Meta = {
  title: 'Mantine/Primitives/PasswordInput',
  parameters: { skipCanvas: true, layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof meta>

// "Secret1" → length ✅ uppercase ✅ lowercase ✅ digit ✅ special ✗ (4 met, 1 unmet)
const DEMO_VALUE = 'Secret1'

export const Default: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const t = (key: string) => storyT(locale, `storybook.mantine.${key}`)
    const ta = (key: string) => storyT(locale, `auth.${key}`)

    const rules = checkPasswordRules(DEMO_VALUE)
    const ruleRows: Array<{ key: keyof typeof rules; label: string }> = [
      { key: 'length',    label: ta('password_rule_length') },
      { key: 'uppercase', label: ta('password_rule_uppercase') },
      { key: 'lowercase', label: ta('password_rule_lowercase') },
      { key: 'digit',     label: ta('password_rule_digit') },
      { key: 'special',   label: ta('password_rule_special') },
    ]

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

          {/* 2 — requirements hint: checkPasswordRules drives met/unmet rows; rule strings from auth.* */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              requirements-hint — &quot;{DEMO_VALUE}&quot;: 4 met / 1 unmet (special); rule strings reuse auth.password_rule_*; uk wraps at 320
            </Text>
            <PasswordInput
              label={t('pw_label')}
              defaultValue={DEMO_VALUE}
              visibilityToggleButtonProps={{ 'aria-label': t('pw_toggle_show') }}
            />
            <Stack gap={4} pl="xs">
              {ruleRows.map(({ key, label }) =>
                rules[key] ? (
                  <Group key={key} gap="xs">
                    <Check size={14} aria-hidden color="var(--mantine-color-green-6)" />
                    <Text size="sm" c="green.6">{label}</Text>
                  </Group>
                ) : (
                  <Group key={key} gap="xs">
                    <X size={14} aria-hidden color="var(--mantine-color-gray-5)" />
                    <Text size="sm" c="gray.5">{label}</Text>
                  </Group>
                )
              )}
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
