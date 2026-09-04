'use client'

import { Stack, TextInput, PasswordInput, Button, Text, Anchor, Paper, Title, Divider, useMantineTheme } from '@mantine/core'
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
  const theme = useMantineTheme()
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
    // Task 784 Revision 5 (D69-20): the prior `styles={{root:{'@media...':{...}}}}` block emitted
    // no CSS (Mantine resolves `styles` keys as properties/selectors, never as `@media` at-rules —
    // see docs/sessions/evidence/task784/d69-19-browser/styles-prop-media-query-defect-proof.md),
    // a pre-existing defect (confirmed present at `HEAD`, predating Task 784). Fixed via Mantine's
    // native responsive Box style props (`w`/`maw`), which do emit real `@media` rules. `sm` is
    // byte-identical to theme.other.mobileGate ('40em'); the cap value is sourced only from
    // theme.other.layout.authFormMaxWidth.
    <Paper
      shadow="sm"
      p="xl"
      radius="md"
      withBorder
      w="100%"
      maw={{ base: '100%', sm: theme.other.layout.authFormMaxWidth }}
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
