import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { Stack, Text } from '@mantine/core'
import { storyT } from '../../_storyI18n'
import { PhoneField, type PhoneFieldValue } from '@/components/shared/PhoneField'
import { MantineStoryShell } from '../_MantineStoryShell'

/**
 * Title under `Mantine/Primitives/` (Task 556, following the Task 554 precedent): the
 * rendered-assert harness (`scripts/check-stories-rendered.mjs`) only gives PERMANENT, standing
 * enforcement under `--mantine-only` to stories whose title matches this exact prefix. `PhoneField`
 * is a composite (country `MantineCombobox` + national `TextInput`), not a primitive — this title
 * is a display-grouping choice for gate enforcement, not a taxonomy claim.
 */
const meta: Meta = {
  title: 'Mantine/Primitives/PhoneField',
  parameters: { skipCanvas: true, layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof meta>

function DefaultDemo({ label }: { label: string }) {
  const [value, setValue] = useState<PhoneFieldValue>({
    national: '691234567',
    dialCode: '+355',
    iso2: 'AL',
    e164: '+355691234567',
  })
  return <PhoneField value={value.e164} onChange={setValue} label={label} />
}

function ErrorDemo({ label, error }: { label: string; error: string }) {
  const [value, setValue] = useState<PhoneFieldValue>({
    national: '123',
    dialCode: '+355',
    iso2: 'AL',
    e164: '+355123',
  })
  return <PhoneField value={value.e164} onChange={setValue} label={label} error={error} />
}

export const Default: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const label = storyT(locale, 'storybook.input.phone')
    const error = storyT(locale, 'auth.error_phone_invalid')

    return (
      <MantineStoryShell>
        <Stack gap="xl">
          {/* 1 — default: country trigger (compact, ~7rem — the ONE full-width exemption, §15
              height-aligned with the national input) + national TextInput (flex-1, full-bleed) */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              default — country trigger (compact §15-aligned) + national input (flex-1, full-width
              row &lt;640)
            </Text>
            <DefaultDemo label={label} />
          </Stack>

          {/* 2 — error: §6e red border + message on the national TextInput only; country trigger
              unaffected (the error is about the number, not the country) */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              error — §6e red border + wrapped message on the national input; country trigger
              unaffected
            </Text>
            <ErrorDemo label={label} error={error} />
          </Stack>
        </Stack>
      </MantineStoryShell>
    )
  },
}
