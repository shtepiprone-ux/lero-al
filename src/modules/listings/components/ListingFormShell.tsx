'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { createListing } from '@/modules/listings/actions/createListing'
import { updateListing } from '@/modules/listings/actions/updateListing'
import { ImageUpload } from '@/modules/listings/components/ImageUpload'
import { LocationCombobox, type LocationOption } from '@/components/shared/LocationCombobox'
import { PropertyTypeCombobox } from '@/components/shared/PropertyTypeCombobox'
import { getSchema } from '@/modules/listings/domain/propertyTypeSchema'
import { isEditMode } from '@/modules/listings/domain/listingFormMode'
import type { ListingFormMode } from '@/modules/listings/domain/listingFormMode'
import type { ListingField } from '@/modules/listings/domain/listingFields'
import type { FormValues } from '@/modules/listings/types/form'
import type { ListingType, PropertyType } from '@/types/database'
import { DynamicFieldSection } from './form/DynamicFieldSection'

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
}

interface EditModeProps extends BaseProps {
  mode: 'edit'
  listingId: string
  initialValues: Partial<FormValues>
}

type Props = CreateModeProps | EditModeProps

function SectionCard({ children, className, id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={cn('bg-card rounded-2xl border shadow-sm p-6', className)}>
      {children}
    </section>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-base font-semibold text-foreground pb-3 mb-5 border-b">
      {children}
    </h2>
  )
}

export function ListingFormShell(props: Props) {
  const { uploadPreset, uploadFolder, locations, mode } = props
  const listingId  = isEditMode(mode) ? (props as EditModeProps).listingId  : undefined
  const initialValues = isEditMode(mode) ? (props as EditModeProps).initialValues : undefined

  const t = useTranslations('listing')
  const tc = useTranslations('common')
  const router = useRouter()
  const activeLocale = useLocale()

  const [data, setData] = useState<FormValues>(
    isEditMode(mode) ? { ...INITIAL, ...initialValues } as FormValues : INITIAL
  )
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({})
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [showCancel, setShowCancel] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

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
        setSubmitError(t('error_updating'))
        setSubmitting(false)
        return
      }
      setIsDirty(false)
      setDone(true)
      setTimeout(() => { router.push(`/${activeLocale}/listings/${result.slug}`) }, 3000)
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
                <p className="text-sm text-muted-foreground leading-relaxed">{t('edit_success_body')}</p>
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">

      {/* Page header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">{isEditMode(mode) ? t('edit_listing') : t('create_listing')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('create_listing_subtitle')}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => isDirty ? setShowCancel(true) : router.back()}
          className="text-muted-foreground mt-1"
        >
          {tc('cancel')}
        </Button>
      </div>

      <div className="flex flex-col gap-6">

        {/* ── Section 1: Listing Basics ── */}
        <SectionCard>
          <SectionTitle>{t('section_basics')}</SectionTitle>
          <div className="flex flex-col gap-5">

            {/* Listing type */}
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium">{tc('listing_type')}</Label>
              <div className="flex gap-3">
                {(['sale', 'rent'] as ListingType[]).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => patch({ listing_type: type })}
                    className={cn(
                      'flex-1 h-11 rounded-xl border text-sm font-medium transition-all',
                      data.listing_type === type
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background border-border hover:border-primary/40',
                    )}
                  >
                    {t(type)}
                  </button>
                ))}
              </div>
            </div>

            {/* Property type */}
            <div id="field-property_type" className="flex flex-col gap-2">
              <Label className="text-sm font-medium">
                {tc('property_type')}<span className="text-destructive ml-1">*</span>
              </Label>
              <PropertyTypeCombobox
                value={data.property_type || ''}
                onChange={v => { if (v) handlePropertyTypeChange(v as PropertyType) }}
                placeholder={t('property_type_placeholder')}
                showAllOption={false}
                className="w-full"
              />
              {errors.property_type && <p className="text-xs text-destructive">{errors.property_type}</p>}
            </div>

            {/* Title */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="title" className="text-sm font-medium">
                {t('field_title')}<span className="text-destructive ml-1">*</span>
              </Label>
              <Input
                id="title"
                value={data.title}
                onChange={e => patch({ title: e.target.value })}
                placeholder={t('field_title_hint')}
                maxLength={150}
                className={cn('h-11 rounded-xl', errors.title && 'border-destructive')}
              />
              <div className="flex justify-between">
                {errors.title
                  ? <p className="text-xs text-destructive">{errors.title}</p>
                  : <p className="text-xs text-muted-foreground">{t('field_title_hint')}</p>}
                <p className="text-xs text-muted-foreground">{data.title.length}/150</p>
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="description" className="text-sm font-medium">{t('field_description')}</Label>
              <Textarea
                id="description"
                value={data.description ?? ''}
                onChange={e => patch({ description: e.target.value || undefined })}
                placeholder={t('field_description_placeholder')}
                rows={4}
                maxLength={5000}
                className="rounded-xl resize-y min-h-40 max-h-[32rem]"
              />
              <p className="text-xs text-muted-foreground text-right">{(data.description ?? '').length}/5000</p>
            </div>

            {/* Price + currency */}
            <div id="field-price" className="flex flex-col gap-2">
              <Label className="text-sm font-medium">
                {t('field_price')}<span className="text-destructive ml-1">*</span>
              </Label>
              <div className="flex gap-3">
                <div className="flex rounded-xl border overflow-hidden shrink-0">
                  {(['ALL', 'EUR'] as const).map(cur => (
                    <button
                      key={cur}
                      type="button"
                      onClick={() => patch({ currency: cur })}
                      className={cn(
                        'px-4 h-11 text-sm font-semibold transition-colors',
                        data.currency === cur
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background text-foreground hover:bg-muted',
                      )}
                    >
                      {cur}
                    </button>
                  ))}
                </div>
                <Input
                  type="number"
                  value={data.price ?? ''}
                  onChange={e => patch({ price: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="0"
                  min={0}
                  className={cn('h-11 rounded-xl flex-1', errors.price && 'border-destructive')}
                />
              </div>
              {errors.price && <p className="text-xs text-destructive">{errors.price}</p>}
            </div>

          </div>
        </SectionCard>

        {/* ── Section 2: Property Details — rendered by DynamicFieldSection ── */}
        <SectionCard id="field-details">
          <SectionTitle>{t('section_details')}</SectionTitle>
          <div className="flex flex-col gap-6">
            <DynamicFieldSection
              schema={schema}
              formValues={data}
              errors={errors}
              onChange={patch}
            />
          </div>
        </SectionCard>

        {/* ── Section 3: Photos ── */}
        <SectionCard id="field-images">
          <SectionTitle>{t('section_photos')}</SectionTitle>
          <ImageUpload images={data.images} onChange={imgs => patch({ images: imgs })} uploadPreset={uploadPreset} uploadFolder={uploadFolder} />
          {errors.images && <p className="mt-3 text-sm text-destructive text-center">{errors.images}</p>}
        </SectionCard>

        {/* ── Section 4: Location ── */}
        <SectionCard>
          <SectionTitle>{t('section_location')}</SectionTitle>
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium">{tc('location')}</Label>
              <LocationCombobox locations={locations} value={data.location_id ? String(data.location_id) : ''} onChange={id => patch({ location_id: id ? Number(id) : undefined })} placeholder={tc('location')} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="address" className="text-sm font-medium">{t('field_address')}</Label>
              <Input id="address" value={data.address ?? ''} onChange={e => patch({ address: e.target.value || undefined })} placeholder={t('field_address_placeholder')} maxLength={300} className="h-11 rounded-xl" />
            </div>
          </div>
        </SectionCard>

        {/* Submit error */}
        {submitError && (
          <div className="text-sm text-destructive text-center rounded-xl bg-destructive/5 border border-destructive/20 p-4">
            {submitError}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between gap-3 pb-8">
          <Button
            type="button"
            variant="outline"
            size="xl"
            onClick={() => isDirty ? setShowCancel(true) : router.back()}
            disabled={submitting}
            className="px-6 rounded-xl"
          >
            {tc('cancel')}
          </Button>
          <Button type="button" size="xl" onClick={handleSubmit} disabled={submitting} className="px-8 rounded-xl">
            {submitting
              ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />{isEditMode(mode) ? t('form_saving') : t('form_publishing')}</>
              : (isEditMode(mode) ? t('form_save') : t('form_publish'))}
          </Button>
        </div>

      </div>

      {/* Cancel confirmation dialog — shown only when form has unsaved changes */}
      <Dialog open={showCancel} onOpenChange={setShowCancel}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{t('cancel_confirm_title')}</DialogTitle>
            <DialogDescription>{t('cancel_confirm_message')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowCancel(false)}>
              {t('cancel_confirm_no')}
            </Button>
            <Button type="button" variant="destructive" onClick={() => router.back()}>
              {t('cancel_confirm_yes')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
