'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ListingFormShellView, type ListingFormShellViewProps } from '@/modules/listings/components/ListingFormShellView'
import { getSchema } from '@/modules/listings/domain/propertyTypeSchema'
import { validateListingForm, type ListingFormErrors } from '@/modules/listings/lib/validateListingForm'
import type { FormValues } from '@/modules/listings/types/form'
import type { PropertyType } from '@/types/database'

/** What the harness owns; every other prop of the view passes through (mode, locations, listing id, Cloudinary config, `submitting`, `submitError`, the staff status control). */
type OwnedByHarness = 'data' | 'errors' | 'schema' | 'patch' | 'onPropertyTypeChange' | 'isDirty' | 'onSubmit' | 'onCancelClick' | 'showCancelDialog' | 'onCancelDialogChange' | 'onConfirmCancel'

export interface ListingFormHarnessProps extends Omit<ListingFormShellViewProps, OwnedByHarness> {
  /** The form values the Story starts with. */
  initial: FormValues
  /** The Story starts as a form that has been changed, so Save is enabled (a form nobody touched has Save disabled, as in the product). */
  initialDirty?: boolean
  /** The Story starts after a Save: `validateListingForm` ran over `initial` and its errors show, as they would after the person pressed Save. */
  saveOnMount?: boolean
  /** The Story starts with the cancel confirmation open. */
  initialCancelOpen?: boolean
}

/** The values a Save checked and the fields patched since, whose errors are gone (the container clears the error of a patched field). */
interface SavedCheck {
  values: FormValues
  cleared: ReadonlySet<string>
}

/**
 * Fixture harness of the composition Stories of the listing form (Task 957 Revision 3, R3-3; Review 3 F18, F19). The view is props-only, so a Story that passes `patch: () => {}` shows a form
 * nothing can change. This harness holds the form values the way `ListingFormShell` does: `patch` changes them and clears the errors of the patched fields, a Save runs the same
 * `validateListingForm` the container runs over the current values and shows its errors (so a Story shows only errors the form would produce for those values; the messages are read at each
 * render, so they follow the locale of the toolbar), the cancel confirmation keeps its open state. It saves nothing and navigates nowhere: the Server Actions and the router belong to the
 * container, whose own Story is `Patterns/Mantine/ListingFormShellContainer`. Choosing a property type sets it and switches the multi-storey box off, as the container does first; the container's
 * clearing of the fields the new type hides is not repeated here (the form shows only the fields of the new type).
 */
export function ListingFormHarness({ initial, initialDirty = false, saveOnMount = false, initialCancelOpen = false, ...view }: ListingFormHarnessProps) {
  const t = useTranslations('listing')
  const [data, setData] = useState<FormValues>(initial)
  const [saved, setSaved] = useState<SavedCheck | null>(() => (saveOnMount ? { values: initial, cleared: new Set() } : null))
  const [isDirty, setIsDirty] = useState(initialDirty)
  const [showCancel, setShowCancel] = useState(initialCancelOpen)

  const errors: ListingFormErrors = {}
  if (saved) {
    for (const [key, message] of Object.entries(validateListingForm(saved.values, getSchema(saved.values.property_type), t))) {
      if (!saved.cleared.has(key)) errors[key as keyof FormValues] = message
    }
  }

  function clear(keys: string[]) {
    setSaved(prev => (prev ? { values: prev.values, cleared: new Set([...prev.cleared, ...keys]) } : prev))
  }

  function patch(partial: Partial<FormValues>) {
    setIsDirty(true)
    setData(prev => ({ ...prev, ...partial }))
    clear(Object.keys(partial))
  }

  function onPropertyTypeChange(type: PropertyType) {
    setIsDirty(true)
    setData(prev => ({ ...prev, property_type: type, multi_storey_building: false }))
    clear(['property_type'])
  }

  return (
    <ListingFormShellView
      {...view}
      data={data}
      errors={errors}
      schema={getSchema(data.property_type)}
      patch={patch}
      onPropertyTypeChange={onPropertyTypeChange}
      isDirty={isDirty}
      onSubmit={() => setSaved({ values: data, cleared: new Set() })}
      onCancelClick={() => { if (isDirty) setShowCancel(true) }}
      showCancelDialog={showCancel}
      onCancelDialogChange={setShowCancel}
      onConfirmCancel={() => setShowCancel(false)}
    />
  )
}
