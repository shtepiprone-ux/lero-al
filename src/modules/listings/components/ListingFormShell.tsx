'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { CheckCircle2 } from 'lucide-react'
import { createListing } from '@/modules/listings/actions/createListing'
import { updateListing } from '@/modules/listings/actions/updateListing'
import { changeListingStatusAction } from '@/modules/listings/actions/changeListingStatus'
import { ListingFormShellView } from '@/modules/listings/components/ListingFormShellView'
import type { LocationOption } from '@/components/shared/LocationCombobox'
import { getSchema } from '@/modules/listings/domain/propertyTypeSchema'
import { isEditMode } from '@/modules/listings/domain/listingFormMode'
import { isListingVisible, getPostSaveRedirect } from '@/modules/listings/domain/listingSemanticHelpers'
import type { ListingFormMode } from '@/modules/listings/domain/listingFormMode'
import type { ListingStatus } from '@/types/database'
import type { ListingField } from '@/modules/listings/domain/listingFields'
import type { FormValues } from '@/modules/listings/types/form'
import type { PropertyType } from '@/types/database'

const INITIAL: FormValues = {
  listing_type: 'sale',
  property_type: '',
  title: '',
  currency: 'ALL',
  multi_storey_building: false,
  images: [],
}

interface BaseProps {
  locale: string
  uploadPreset: string
  uploadFolder: string
  locations: LocationOption[]
  mode: ListingFormMode
}

interface CreateModeProps extends BaseProps {
  mode: 'create'
  listingId?: never
  initialValues?: never
  canManageStatus?: never
  currentStatus?: never
}

interface EditModeProps extends BaseProps {
  mode: 'edit'
  listingId: string
  initialValues: Partial<FormValues>
  /** Server-computed (canAdminEditListing) — only staff (admin/moderator) get the status control. */
  canManageStatus: boolean
  currentStatus: ListingStatus
}

type Props = CreateModeProps | EditModeProps

export function ListingFormShell(props: Props) {
  const { uploadPreset, uploadFolder, locations, mode } = props
  const listingId  = isEditMode(mode) ? (props as EditModeProps).listingId  : undefined
  const initialValues = isEditMode(mode) ? (props as EditModeProps).initialValues : undefined
  const canManageStatus = isEditMode(mode) ? (props as EditModeProps).canManageStatus : false

  const t = useTranslations('listing')
  const router = useRouter()
  const params = useParams()
  const activeLocale = useLocale()

  // In edit mode the URL contains [slug]; navigate there on cancel so the form works
  // correctly even when opened in a new tab (e.g. from the admin panel) where router.back()
  // has no history to return to.
  function navigateAway() {
    const slug = params?.slug as string | undefined
    if (slug) {
      router.push(`/${activeLocale}/listings/${slug}`)
    } else {
      router.back()
    }
  }

  const [data, setData] = useState<FormValues>(
    isEditMode(mode) ? { ...INITIAL, ...initialValues } as FormValues : INITIAL
  )
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({})
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [savedStatus, setSavedStatus] = useState<ListingStatus | null>(null)
  const [showCancel, setShowCancel] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [currentStatus, setCurrentStatus] = useState<ListingStatus | null>(
    isEditMode(mode) ? (props as EditModeProps).currentStatus : null
  )

  // Browser refresh / tab-close protection when form has unsaved changes
  useEffect(() => {
    if (!isDirty) return
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault() }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  function patch(partial: Partial<FormValues>) {
    setIsDirty(true)
    setData(prev => ({ ...prev, ...partial }))
    const cleared = Object.fromEntries(Object.keys(partial).map(k => [k, undefined]))
    setErrors(prev => ({ ...prev, ...cleared }))
  }

  const pt = data.property_type ?? ''
  const schema = getSchema(pt)

  // Single schema-driven visibility gate — replaces shows() + hiddenFields.
  // When no property type is selected every field is shown (same as before).
  function isVisible(key: ListingField): boolean {
    if (!pt) return true
    return schema.ui.fields.find(f => f.key === key)?.visible ?? false
  }

  function handlePropertyTypeChange(newType: PropertyType) {
    const newSchema = getSchema(newType)
    const floorIsNowInvalid = data.floor !== undefined && data.floor < 0 && !newSchema.floor.allowNegative

    // Schema-driven field clearing — visibility derived exclusively from ui.fields.
    const newIsVis = (k: ListingField) => newSchema.ui.fields.find(f => f.key === k)?.visible ?? false

    setIsDirty(true)
    setData(prev => ({
      ...prev,
      property_type:         newType,
      multi_storey_building: false,
      rooms:                 !newIsVis('rooms')                      ? undefined : prev.rooms,
      bedrooms:              !newIsVis('bedrooms')                   ? undefined : prev.bedrooms,
      bathrooms:             !newIsVis('bathrooms')                  ? undefined : prev.bathrooms,
      toilets:               !newIsVis('toilets')                    ? undefined : prev.toilets,
      land_legal_status:          !newIsVis('land_legal_status')          ? undefined : prev.land_legal_status,
      land_zoning:                !newIsVis('land_zoning')                ? undefined : prev.land_zoning,
      land_development_potential: !newIsVis('land_development_potential') ? undefined : prev.land_development_potential,
      offer_type:                 !newIsVis('offer_type')                 ? undefined : prev.offer_type,
      purchase_conditions:        !newIsVis('purchase_conditions')        ? undefined : prev.purchase_conditions,
      // Preserve total_floors if the new type uses it in any form context.
      total_floors: (newIsVis('floors_total') || newIsVis('building_floors')) ? prev.total_floors : undefined,
    }))
    setErrors(prev => ({
      ...prev,
      property_type: undefined,
      floor: floorIsNowInvalid ? t('error_floor_negative') : undefined,
    }))
  }

  function scrollToFirstError(errs: Partial<Record<keyof FormValues, string>>) {
    const order: Array<[keyof FormValues, string]> = [
      ['title',         'title'],
      ['property_type', 'field-property_type'],
      ['price',         'field-price'],
      ['images',        'field-images'],
      ['floor',         'field-details'],
    ]
    for (const [key, id] of order) {
      if (errs[key]) {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        return
      }
    }
    document.getElementById('field-details')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function handleSubmit() {
    const newErrors: Partial<Record<keyof FormValues, string>> = {}

    if (!data.title || data.title.trim().length < 5) {
      newErrors.title = t('error_title')
    }
    if (!data.property_type) {
      newErrors.property_type = t('error_property_type')
    }
    if (!data.price || data.price <= 0) {
      newErrors.price = t('error_price')
    }
    if (data.images.length === 0) {
      newErrors.images = t('error_images')
    }

    if (data.floor !== undefined && data.property_type) {
      const allowsNeg = schema.floor.allowNegative && data.multi_storey_building === true
      if (data.floor < 0 && !allowsNeg) {
        newErrors.floor = t('error_floor_negative')
      } else if (data.total_floors !== undefined && data.floor > data.total_floors) {
        newErrors.floor = t('error_floor_exceeds_building')
      }
    }

    // Schema-declared required fields — derived from ui.fields.
    const dataRecord = data as unknown as Record<string, unknown>
    for (const fieldDef of schema.ui.fields.filter(f => f.required)) {
      if (!dataRecord[fieldDef.key]) {
        newErrors[fieldDef.key as keyof FormValues] = t('error_required')
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      scrollToFirstError(newErrors)
      return
    }

    setSubmitting(true)
    setSubmitError('')

    const submitPayload = {
      listing_type:     data.listing_type,
      property_type:    data.property_type as PropertyType,
      title:            data.title,
      description:      data.description,
      price:            data.price!,
      currency:         data.currency,
      condition:        data.condition,
      wall_type:        data.wall_type,
      heating:          data.heating,
      rooms:            data.rooms,
      bedrooms:         !isVisible('bedrooms')  ? undefined : data.bedrooms,
      bathrooms:        !isVisible('bathrooms') ? undefined : data.bathrooms,
      toilets:          !isVisible('toilets')   ? undefined : data.toilets,
      area_gross:       data.area_gross,
      area_net:         data.area_net,
      floor:            (schema.floor.requiresCheckbox ? data.multi_storey_building === true : isVisible('floor')) ? data.floor : undefined,
      total_floors:     data.total_floors,
      multi_storey_building: data.multi_storey_building,
      land_legal_status:          data.land_legal_status,
      land_zoning:                data.land_zoning,
      land_development_potential: data.land_development_potential,
      offer_type:          !isVisible('offer_type')          ? undefined : data.offer_type as 'owner' | 'agency' | 'developer' | undefined,
      purchase_conditions: !isVisible('purchase_conditions') ? undefined : data.purchase_conditions as ('installment' | 'mortgage' | 'assignment' | 'negotiable' | 'no_commission')[] | undefined,
      year_built:       data.year_built,
      location_id:      data.location_id,
      address:          data.address,
      images:           data.images,
    }

    if (isEditMode(mode)) {
      const result = await updateListing(listingId!, submitPayload)
      if ('error' in result) {
        if (result.error === 'not_found') {
          router.push(`/${activeLocale}/cabinet/listings`)
          return
        }
        setSubmitError(t('error_updating'))
        setSubmitting(false)
        return
      }
      setSavedStatus(result.status)
      setIsDirty(false)
      setDone(true)
      setTimeout(() => { router.push(getPostSaveRedirect(result.status, result.slug, activeLocale)) }, 3000)
    } else {
      const result = await createListing(submitPayload)
      if ('error' in result) {
        setSubmitError(t('error_creating'))
        setSubmitting(false)
        return
      }
      setIsDirty(false)
      setDone(true)
      setTimeout(() => { router.push(`/${activeLocale}/`) }, 4000)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-5 text-center max-w-md">
          <CheckCircle2 className="h-14 w-14 text-status-success shrink-0" />
          <div className="flex flex-col gap-2">
            {isEditMode(mode) ? (
              <>
                <p className="font-bold text-xl">{t('edit_success_title')}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {savedStatus && !isListingVisible(savedStatus) ? t('saved_pending_moderation') : t('edit_success_body')}
                </p>
              </>
            ) : (
              <>
                <p className="font-bold text-xl">{t('moderation_title')}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{t('moderation_body')}</p>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  function onCancelClick() {
    if (isDirty) {
      setShowCancel(true)
    } else {
      navigateAway()
    }
  }

  async function onStatusChange({ toStatus }: { toStatus: ListingStatus; note: string | null }) {
    const result = await changeListingStatusAction(listingId!, toStatus)
    if (!result.ok) {
      throw new Error(result.reason)
    }
    setCurrentStatus(result.nextStatus)
    router.refresh()
  }

  return (
    <ListingFormShellView
      mode={mode}
      data={data}
      errors={errors}
      schema={schema}
      locations={locations}
      patch={patch}
      onPropertyTypeChange={handlePropertyTypeChange}
      uploadPreset={uploadPreset}
      uploadFolder={uploadFolder}
      submitting={submitting}
      submitError={submitError}
      isDirty={isDirty}
      onSubmit={handleSubmit}
      onCancelClick={onCancelClick}
      showCancelDialog={showCancel}
      onCancelDialogChange={setShowCancel}
      onConfirmCancel={navigateAway}
      statusControl={
        canManageStatus && isEditMode(mode) && currentStatus
          ? { currentStatus, listingId: listingId!, onStatusChange }
          : undefined
      }
    />
  )
}
