'use client'

import { SimpleGrid, TextInput, Textarea, Select, Button, Flex, Stack, Title } from '@mantine/core'
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

        {/* Task 785 (sites 6-8): the inert `styles={{root:{'@media...'}}}` blocks never emitted CSS
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
            explicit: unchanged (`flex-start`) below `sm`, `flex-end` at `sm`+. Included alongside
            `FormSectionStack` because this row is identical and would otherwise diverge for no
            reason. R8 (the `px="md"` inset) does not apply here — this pattern has no `Paper`
            wrapper to inset against (verified: zero `Paper` elements in this file). */}
        <Flex
          gap="sm"
          align="center"
          wrap="wrap"
          direction={{ base: 'column', sm: 'row' }}
          justify={{ base: 'flex-start', sm: 'flex-end' }}
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
      </Stack>
    </form>
  )
}
