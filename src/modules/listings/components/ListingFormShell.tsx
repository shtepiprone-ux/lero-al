'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { Center, Stack, Text, ThemeIcon, Title, useMantineTheme } from '@mantine/core'
import { CheckCircle2 } from 'lucide-react'
import { VARIANT_COLORS } from '@/design-system/mantine/notificationVariants'
import { TITLE_FZ } from '@/design-system/mantine/typography'
import { createListing } from '@/modules/listings/actions/createListing'
import { updateListing } from '@/modules/listings/actions/updateListing'
import { changeListingStatusAction } from '@/modules/listings/actions/changeListingStatus'
import { deleteListingAction } from '@/modules/listings/actions/deleteListing'
import { toast } from '@/lib/toast'
import { ListingFormShellView } from '@/modules/listings/components/ListingFormShellView'
import type { LocationOption } from '@/components/shared/LocationCombobox'
import { getSchema } from '@/modules/listings/domain/propertyTypeSchema'
import { validateListingForm } from '@/modules/listings/lib/validateListingForm'
import { isEditMode } from '@/modules/listings/domain/listingFormMode'
import { isListingVisible, getPostSaveRedirect } from '@/modules/listings/domain/listingSemanticHelpers'
import type { ListingFormMode } from '@/modules/listings/domain/listingFormMode'
import type { ListingStatus } from '@/types/database'
import type { ListingField } from '@/modules/listings/domain/listingFields'
import type { FormValues } from '@/modules/listings/types/form'
import type { CloudinaryWidgetConfig } from '@/modules/listings/lib/cloudinaryWidgetConfig'
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
  locations: LocationOption[]
  mode: ListingFormMode
  /** The API key and the cloud name the page read on the server (`getCloudinaryWidgetConfig`); the photo widget needs both when it is created. */
  cloudinary: CloudinaryWidgetConfig
}

interface CreateModeProps extends BaseProps {
  mode: 'create'
  listingId?: never
  initialValues?: never
  canManageStatus?: never
  canPublish?: never
  canDelete?: never
  currentStatus?: never
}

interface EditModeProps extends BaseProps {
  mode: 'edit'
  listingId: string
  initialValues: Partial<FormValues>
  /** Server-computed (canAdminEditListing) — only staff (admin/moderator) get the status control. */
  canManageStatus: boolean
  /** Server-computed (canAdminEditListing) — only staff may set `active` (Task 923 R35, D6) or `expired` (O957-17); the owner sends a listing to moderation (`pending`, "Publish") from every status but `active` (O957-11). */
  canPublish: boolean
  /** Server-computed on the edit page (`listing.user_id` is the viewer): the owner's form shows a section with "Delete listing" (O957-18). */
  canDelete?: boolean
  currentStatus: ListingStatus
}

type Props = CreateModeProps | EditModeProps

export function ListingFormShell(props: Props) {
  const { locations, mode, cloudinary } = props
  const listingId  = isEditMode(mode) ? (props as EditModeProps).listingId  : undefined
  const initialValues = isEditMode(mode) ? (props as EditModeProps).initialValues : undefined
  const canManageStatus = isEditMode(mode) ? (props as EditModeProps).canManageStatus : false
  const canPublish = isEditMode(mode) ? (props as EditModeProps).canPublish : false
  const canDelete = isEditMode(mode) ? Boolean((props as EditModeProps).canDelete) : false

  const t = useTranslations('listing')
  const tCabinet = useTranslations('cabinet')
  const theme = useMantineTheme()
  const router = useRouter()
  const params = useParams()
  const activeLocale = useLocale()

  // Cancel returns to the page the person came from (owner decision O957-19: from "My listings" to the edit form and back to "My listings"). A tab opened straight on the form
  // (e.g. from the admin panel) has no earlier entry, so router.back() would leave the site: there, in edit mode, the URL contains [slug] and Cancel goes to the listing's page.
  function navigateAway() {
    if (window.history.length > 1) {
      router.back()
      return
    }
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
      parking_type:          !newIsVis('parking')                    ? undefined : prev.parking_type,
      parking_floor:         !newIsVis('parking')                    ? undefined : prev.parking_floor,
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
    // the checks live in `validateListingForm` (Task 957 Revision 3, R3-4), shared with the Story harness
    const newErrors = validateListingForm(data, schema, t)

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
      parking_type:     isVisible('parking') ? data.parking_type : undefined,
      parking_floor:    isVisible('parking') && data.parking_type === 'underground' ? data.parking_floor : undefined,
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
          router.push(`/${activeLocale}/cabinet?tab=listings`)
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
      <Center mih="100vh" px="md">
        <Stack align="center" gap="lg" ta="center" maw={theme.other.boxSize.prose}>
          {/* the success colour is the one the notifications use (`VARIANT_COLORS.success`), not a palette literal chosen here */}
          <ThemeIcon size="hero" color={VARIANT_COLORS.success} variant="light">
            <CheckCircle2 size={theme.other.iconSize.decorative} aria-hidden="true" />
          </ThemeIcon>
          {/* the heading size is the shared responsive scale (`TITLE_FZ`, `typography.ts`): `npm run check:type-responsive` refuses a Title with a static size */}
          <Stack gap="xs">
            {isEditMode(mode) ? (
              <>
                <Title order={2} size="h4" fz={TITLE_FZ.h4}>{t('edit_success_title')}</Title>
                <Text size="sm" c="dimmed">
                  {savedStatus && !isListingVisible(savedStatus) ? t('saved_pending_moderation') : t('edit_success_body')}
                </Text>
              </>
            ) : (
              <>
                <Title order={2} size="h4" fz={TITLE_FZ.h4}>{t('moderation_title')}</Title>
                <Text size="sm" c="dimmed">{t('moderation_body')}</Text>
              </>
            )}
          </Stack>
        </Stack>
      </Center>
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

  // The owner's delete from the edit form (owner decision O957-18): the existing action (it checks the owner or `listings.delete` itself); success leaves for the cabinet's listings, an error keeps the form
  async function onDelete() {
    try {
      const result = await deleteListingAction(listingId!)
      if (result.error) {
        toast.error(tCabinet('error_deleting'))
        return
      }
    } catch {
      toast.error(tCabinet('error_deleting'))
      return
    }
    router.push(`/${activeLocale}/cabinet?tab=listings`)
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
      listingId={listingId}
      cloudinary={cloudinary}
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
          ? { currentStatus, listingId: listingId!, canPublish, onStatusChange }
          : undefined
      }
      canDelete={canDelete}
      onDelete={canDelete ? onDelete : undefined}
    />
  )
}
