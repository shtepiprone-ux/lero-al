import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { NumInputField } from './NumInputField'
import type { FieldRendererProps } from './fieldRegistry'
import type { FieldDefinition } from '@/modules/listings/domain/listingFields'
import type { FormValues } from '@/modules/listings/types/form'
import type { PropertyTypeSchema } from '@/modules/listings/domain/propertyTypeSchema'

// ── Task 320 QA: NumInputField floors_total label fix (Bucket 3) ───────────────
// Renders the floors_total field directly so its label resolves via
// LABEL_KEYS -> listing.floors_total (was previously a raw-key leak, no t() call).
const baseProps: Omit<FieldRendererProps, 'fieldDef'> = {
  schema: {} as PropertyTypeSchema,
  formValues: {} as FormValues,
  errors: {},
  onChange: () => {},
}

const floorsTotalFieldDef = { key: 'floors_total', componentType: 'num-input', visible: true, required: false } as FieldDefinition

const meta: Meta<typeof NumInputField> = {
  title: 'Listings/Form/NumInputField',
  component: NumInputField,
  tags: ['autodocs'],
  args: { ...baseProps, fieldDef: floorsTotalFieldDef },
}
export default meta
type Story = StoryObj<typeof NumInputField>

export const FloorsTotal: Story = {
  globals: { viewport: { value: 'desktop1280', isRotated: false } },
}

