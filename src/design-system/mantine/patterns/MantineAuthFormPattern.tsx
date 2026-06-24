'use client'

import { Stack, TextInput, PasswordInput, Button, Text, Anchor, Paper, Title, Divider } from '@mantine/core'
import { useForm } from '@mantine/form'

export type AuthMode = 'login' | 'register'

export interface MantineAuthFormPatternProps {
  mode: AuthMode
  title: string
  emailLabel: string
  passwordLabel: string
  submitLabel: string
  switchLabel: string
  switchLinkLabel: string
  onSubmit?: (values: { email: string; password: string; name?: string }) => void
  onSwitchMode?: () => void
  nameLabel?: string
}

/**
 * Canonical auth form pattern (login + register).
 *
 * Mobile (<sm / 640px): form is full-width, centered in a Paper card.
 *   Submit button is full-width (P0 mobile gate).
 * Desktop: form centered with max-width constraint.
 *
 * Responsive API:
 *   - Paper maw={{ base: '100%', sm: 400 }} for contained width on desktop.
 *   - Button: fullWidth at all sizes (standard for auth forms).
 *   - Stack spacing adapts to viewport.
 *
 * Uses @mantine/form for validation (email format, password min length).
 * Migration target: auth/login, auth/register pages (Phase 4).
 */
export function MantineAuthFormPattern({
  mode,
  title,
  emailLabel,
  passwordLabel,
  submitLabel,
  switchLabel,
  switchLinkLabel,
  onSubmit,
  onSwitchMode,
  nameLabel,
}: MantineAuthFormPatternProps) {
  const form = useForm({
    initialValues: {
      name: '',
      email: '',
      password: '',
    },
    validate: {
      email: (v) => (/^\S+@\S+$/.test(v) ? null : 'Invalid email'),
      password: (v) => (v.length >= 8 ? null : 'Password must be at least 8 characters'),
      name: mode === 'register'
        ? (v: string) => (v.trim().length > 0 ? null : `${nameLabel ?? 'Name'} is required`)
        : undefined,
    },
  })

  return (
    <Paper
      shadow="sm"
      p="xl"
      radius="md"
      withBorder
      style={{ width: '100%', maxWidth: '100%' }}
      styles={{
        root: {
          '@media (min-width: 40em)': {
            maxWidth: 400,
          },
        },
      }}
    >
      <Stack gap="md">
        <Title order={2} size="h3" ta="center">
          {title}
        </Title>
        <Divider />

        <form onSubmit={form.onSubmit((values) => onSubmit?.({ email: values.email, password: values.password, name: values.name }))}>
          <Stack gap="sm">
            {mode === 'register' && nameLabel && (
              <TextInput
                label={nameLabel}
                type="text"
                required
                {...form.getInputProps('name')}
              />
            )}
            <TextInput
              label={emailLabel}
              type="email"
              required
              {...form.getInputProps('email')}
            />
            <PasswordInput
              label={passwordLabel}
              required
              {...form.getInputProps('password')}
            />
            <Button type="submit" color="brand" fullWidth size="md" mt="sm">
              {submitLabel}
            </Button>
          </Stack>
        </form>

        <Text size="sm" ta="center" c="dimmed">
          {switchLabel}{' '}
          <Anchor
            size="sm"
            component="button"
            type="button"
            onClick={onSwitchMode}
            c="brand"
          >
            {switchLinkLabel}
          </Anchor>
        </Text>
      </Stack>
    </Paper>
  )
}
