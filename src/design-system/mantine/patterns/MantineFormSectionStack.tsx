'use client'

import { Stack, Paper, Title, TextInput, Textarea, Button, Flex, Text } from '@mantine/core'
import { useForm } from '@mantine/form'

export interface FormField {
  name: string
  label: string
  type?: 'text' | 'email' | 'tel' | 'textarea'
  placeholder?: string
  required?: boolean
}

export interface FormSection {
  title: string
  fields: FormField[]
}

export interface MantineFormSectionStackProps {
  sections: FormSection[]
  submitLabel: string
  cancelLabel?: string
  onSubmit?: (values: Record<string, string>) => void
  onCancel?: () => void
}

/**
 * Canonical form with sections pattern.
 *
 * Mobile (<sm): each field is full-width, labels wrap; action buttons are full-width.
 * Desktop: same layout (forms are inherently single-column here).
 *
 * Responsive API: Stack is always single-column.
 * Button row uses full-width on mobile via flex.
 * Uses @mantine/form for validation and state management.
 */
export function MantineFormSectionStack({
  sections,
  submitLabel,
  cancelLabel,
  onSubmit,
  onCancel,
}: MantineFormSectionStackProps) {
  const initialValues = sections.flatMap(s => s.fields).reduce(
    (acc, f) => ({ ...acc, [f.name]: '' }),
    {} as Record<string, string>
  )

  const form = useForm<Record<string, string>>({
    initialValues,
    validate: Object.fromEntries(
      sections.flatMap(s => s.fields)
        .filter(f => f.required)
        .map(f => [f.name, (v: string) => (!v ? `${f.label} is required` : null)])
    ),
  })

  return (
    <form onSubmit={form.onSubmit((values) => onSubmit?.(values))}>
      <Stack gap="lg">
        {sections.map((section) => (
          <Paper key={section.title} shadow="xs" p="md" radius="md">
            <Title order={3} size="h5" mb="md">
              {section.title}
            </Title>
            <Stack gap="sm">
              {section.fields.map((field) =>
                field.type === 'textarea' ? (
                  <Textarea
                    key={field.name}
                    label={field.label}
                    placeholder={field.placeholder}
                    required={field.required}
                    autosize
                    minRows={3}
                    {...form.getInputProps(field.name)}
                  />
                ) : (
                  <TextInput
                    key={field.name}
                    label={field.label}
                    type={field.type ?? 'text'}
                    placeholder={field.placeholder}
                    required={field.required}
                    {...form.getInputProps(field.name)}
                  />
                )
              )}
            </Stack>
          </Paper>
        ))}

        {/* Task 785 (sites 3-5): the inert `styles={{root:{'@media...'}}}` blocks never emitted CSS
            (docs/sessions/evidence/task784/d69-19-browser/styles-prop-media-query-defect-proof.md)
            — replaced with Flex's native `direction`/`align` responsive props and Button's native
            `w` responsive prop, gated at `sm` (theme.breakpoints.sm === theme.other.mobileGate,
            byte-identical). `align="center"` is explicit at every width because Group's own
            default align is `center` — Flex has no such default, so this preserves the pre-existing
            centered row alignment rather than only adding it at `sm` as the dead code attempted.
            `wrap="wrap"` preserves Group's own default wrap behavior.
            R7 (owner return, 2026-09-04): the dead rule this replaced declared `flexDirection` +
            `alignItems` but never `justify` — restoring it faithfully left the row at the Flex
            default (`flex-start`), which reads as "stuck on the left" at desktop. `justify` is now
            explicit: unchanged (`flex-start`) below `sm`, `flex-end` at `sm`+.
            R8 (owner return, 2026-09-04): `px="md"` insets this row to the same horizontal edge as
            the sections' own `<Paper p="md">` content — same spacing token already in use, no new
            value, no wrapper. */}
        <Flex
          gap="sm"
          align="center"
          wrap="wrap"
          direction={{ base: 'column', sm: 'row' }}
          justify={{ base: 'flex-start', sm: 'flex-end' }}
          px="md"
        >
          {cancelLabel && (
            <Button
              variant="outline"
              color="gray"
              onClick={onCancel}
              w={{ base: '100%', sm: 'auto' }}
            >
              {cancelLabel}
            </Button>
          )}
          <Button
            type="submit"
            color="brand"
            w={{ base: '100%', sm: 'auto' }}
          >
            {submitLabel}
          </Button>
        </Flex>
        {Object.keys(form.errors).length > 0 && (
          <Text size="sm" c="red">
            {Object.values(form.errors)[0] as string}
          </Text>
        )}
      </Stack>
    </form>
  )
}
