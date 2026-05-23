import type { ComponentType } from 'react'
import type { FieldDefinition, FieldComponentType } from '@/modules/listings/domain/listingFields'
import type { PropertyTypeSchema } from '@/modules/listings/domain/propertyTypeSchema'
import type { FormValues } from '@/modules/listings/types/form'

// ── Renderer contract ─────────────────────────────────────────────────────────

export interface FieldRendererProps {
  fieldDef:  FieldDefinition
  schema:    PropertyTypeSchema
  formValues: FormValues
  errors:    Partial<Record<keyof FormValues, string>>
  onChange:  (patch: Partial<FormValues>) => void
}

export type FieldRenderer = ComponentType<FieldRendererProps>

// ── Registry ──────────────────────────────────────────────────────────────────
// Lazy imports prevent circular-dependency issues with client components.
// The registry is populated here; component implementations live in their own files.

import { RoomsSelectorField }  from './RoomsSelectorField'
import { NumInputField }       from './NumInputField'
import { AreaPairField }       from './AreaPairField'
import { FloorGroupField }     from './FloorGroupField'
import { BuildingFloorsField } from './BuildingFloorsField'
import { YearComboboxField }   from './YearComboboxField'
import { EnumSelectorField }   from './EnumSelectorField'
import { ButtonGroupField }    from './ButtonGroupField'
import { MultiToggleField }    from './MultiToggleField'

const NullField: FieldRenderer = () => null

export const FIELD_COMPONENT_REGISTRY: Record<FieldComponentType, FieldRenderer> = {
  'rooms-selector':  RoomsSelectorField,
  'num-input':       NumInputField,
  'area-pair':       AreaPairField,
  'floor-group':     FloorGroupField,
  'building-floors': BuildingFloorsField,
  'year-combobox':   YearComboboxField,
  'enum-selector':   EnumSelectorField,
  'button-group':    ButtonGroupField,
  'multi-toggle':    MultiToggleField,
  'filter-only':     NullField,
}
