'use client'

import { SimpleGrid, TextInput, Textarea, Select, Button, Group, Stack, Title } from '@mantine/core'
import { useForm } from '@mantine/form'

export interface TwoColField {
  name: string
  label: string
  type?: 'text' | 'email' | 'tel' | 'textarea' | 'select'
  options?: { value: string; label: string }[]
  placeholder?: string
  required?: boolean
  fullWidth?: boolean
}

export interface MantineTwoColumnFormProps {
  title?: string
  fields: TwoColField[]
  submitLabel: string
  cancelLabel?: string
  onSubmit?: (values: Record<string, string>) => void
  onCancel?: () => void
}

/**
 * Canonical two-column form pattern.
 *
 * Mobile (<sm / 640px): single column (SimpleGrid cols=1).
 * Desktop (sm+): two columns (SimpleGrid cols=2).
 *
 * Responsive API: SimpleGrid `cols={{ base: 1, sm: 2 }}` — Mantine native.
 * Full-width fields (spanning both columns) use `style.gridColumn: 'span 2'`
 * on desktop but are naturally full-width on mobile.
 */
export function MantineTwoColumnForm({
  title,
  fields,
  submitLabel,
  cancelLabel,
  onSubmit,
  onCancel,
}: MantineTwoColumnFormProps) {
  const initialValues = fields.reduce(
    (acc, f) => ({ ...acc, [f.name]: '' }),
    {} as Record<string, string>
  )

  const form = useForm<Record<string, string>>({
    initialValues,
    validate: Object.fromEntries(
      fields
        .filter(f => f.required)
        .map(f => [f.name, (v: string) => (!v ? `${f.label} is required` : null)])
    ),
  })

  return (
    <form onSubmit={form.onSubmit((values) => onSubmit?.(values))}>
      <Stack gap="md">
        {title && (
          <Title order={2} size="h3">
            {title}
          </Title>
        )}
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          {fields.map((field) => {
            const commonProps = {
              label: field.label,
              placeholder: field.placeholder,
              required: field.required,
              style: field.fullWidth ? { gridColumn: 'span 2' } : undefined,
              ...form.getInputProps(field.name),
            }

            if (field.type === 'textarea') {
              return <Textarea key={field.name} {...commonProps} autosize minRows={2} />
            }
            if (field.type === 'select') {
              return (
                <Select
                  key={field.name}
                  {...commonProps}
                  data={field.options ?? []}
                  onChange={(v) => form.setFieldValue(field.name, v ?? '')}
                  value={form.values[field.name]}
                />
              )
            }
            return <TextInput key={field.name} {...commonProps} type={field.type ?? 'text'} />
          })}
        </SimpleGrid>

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
      </Stack>
    </form>
  )
}
