'use client'

import type { FieldDefinition } from '@/modules/listings/domain/listingFields'
import type { PropertyTypeSchema } from '@/modules/listings/domain/propertyTypeSchema'
import { SimpleGrid } from '@mantine/core'
import type { FormValues } from '@/modules/listings/types/form'
import { FIELD_COMPONENT_REGISTRY, type FieldRendererProps } from './fieldRegistry'

interface Props {
  schema:     PropertyTypeSchema
  formValues: FormValues
  errors:     Partial<Record<keyof FormValues, string>>
  onChange:   (patch: Partial<FormValues>) => void
  /** The form is being saved (Task 957 Revision 2, R2-7): every field is disabled. */
  disabled?:  boolean
}

// ── Render group types ────────────────────────────────────────────────────────

type SingleItem = { kind: 'single'; field: FieldDefinition }
type GridItem   = { kind: 'grid';   fields: FieldDefinition[]; groupKey: string }
type RenderItem = SingleItem | GridItem

// ── Layout builder ────────────────────────────────────────────────────────────

/**
 * Converts the flat FieldDefinition[] into render items:
 * - Filters out invisible, filter-only, and ownedBy fields.
 * - Groups consecutive fields with the same `group` key into a grid.
 */
function buildRenderItems(fields: FieldDefinition[]): RenderItem[] {
  const visible = fields.filter(
    f => f.visible && f.componentType !== 'filter-only' && !f.ownedBy,
  )

  const items: RenderItem[] = []
  const groupMap = new Map<string, GridItem>()

  for (const field of visible) {
    if (field.group) {
      const existing = groupMap.get(field.group)
      if (existing) {
        existing.fields.push(field)
      } else {
        const item: GridItem = { kind: 'grid', fields: [field], groupKey: field.group }
        groupMap.set(field.group, item)
        items.push(item)
      }
    } else {
      items.push({ kind: 'single', field })
    }
  }

  return items
}

// ── Renderer ──────────────────────────────────────────────────────────────────

export function DynamicFieldSection({ schema, formValues, errors, onChange, disabled }: Props) {
  const renderItems = buildRenderItems(schema.ui.fields)

  const sharedProps: Omit<FieldRendererProps, 'fieldDef'> = {
    schema, formValues, errors, onChange, disabled,
  }

  return (
    <>
      {renderItems.map(item => {
        if (item.kind === 'grid') {
          return (
            // one row per field below 640px (the `form-stack` pattern), the Task 905 three columns from 640px (Task 957 Review 2 F15)
            <SimpleGrid key={item.groupKey} cols={{ base: 1, sm: 3 }} spacing="md">
              {item.fields.map(field => {
                const FieldComponent = FIELD_COMPONENT_REGISTRY[field.componentType]
                return <FieldComponent key={field.key} fieldDef={field} {...sharedProps} />
              })}
            </SimpleGrid>
          )
        }

        const FieldComponent = FIELD_COMPONENT_REGISTRY[item.field.componentType]
        return <FieldComponent key={item.field.key} fieldDef={item.field} {...sharedProps} />
      })}
    </>
  )
}
