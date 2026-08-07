'use client'

import { Stack, Paper, Title, TextInput, Textarea, Button, Group, Text } from '@mantine/core'
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

        <Group
          gap="sm"
          style={{ flexDirection: 'column' }}
          styles={{ root: { '@media (min-width: 40em)': { flexDirection: 'row', alignItems: 'center' } } }}
        >
          {cancelLabel && (
            <Button
              variant="outline"
              color="gray"
              onClick={onCancel}
              fullWidth
              styles={{ root: { '@media (min-width: 40em)': { width: 'auto' } } }}
            >
              {cancelLabel}
            </Button>
          )}
          <Button
            type="submit"
            color="brand"
            fullWidth
            styles={{ root: { '@media (min-width: 40em)': { width: 'auto' } } }}
          >
            {submitLabel}
          </Button>
        </Group>
        {Object.keys(form.errors).length > 0 && (
          <Text size="sm" c="red">
            {Object.values(form.errors)[0] as string}
          </Text>
        )}
      </Stack>
    </form>
  )
}
