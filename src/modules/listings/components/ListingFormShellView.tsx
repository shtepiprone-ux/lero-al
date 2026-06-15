'use client'

import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { ImageUpload } from '@/modules/listings/components/ImageUpload'
import { LocationCombobox, type LocationOption } from '@/components/shared/LocationCombobox'
import { PropertyTypeCombobox } from '@/components/shared/PropertyTypeCombobox'
import { AdminEditLayout } from '@/components/admin/AdminEditLayout'
import { StatusChangeControl, type StatusOption } from '@/components/admin/StatusChangeControl'
import { DynamicFieldSection } from './form/DynamicFieldSection'
import { isEditMode } from '@/modules/listings/domain/listingFormMode'
import {
  ALLOWED_LISTING_TRANSITIONS,
  getAllowedTargetStatuses,
} from '@/modules/listings/domain/listingTransitionEngine'
import type { ListingFormMode } from '@/modules/listings/domain/listingFormMode'
import type { FormValues } from '@/modules/listings/types/form'
import type { getSchema } from '@/modules/listings/domain/propertyTypeSchema'
import type { ListingType, PropertyType, ListingStatus } from '@/types/database'

// Badge variants for the listing-status Combobox options. Restricted to the
// subset StatusOption['badgeVariant'] accepts ('rented' has no own badge
// variant in StatusOption — mapped to 'info', matching its 'closed market'
// meaning alongside 'sold').
const STATUS_BADGE_VARIANT: Record<ListingStatus, StatusOption<ListingStatus>['badgeVariant']> = {
  pending:  'warning',
  active:   'success',
  inactive: 'neutral',
  sold:     'info',
  rented:   'info',
  archived: 'neutral',
}

const ALL_LISTING_STATUSES = Object.keys(ALLOWED_LISTING_TRANSITIONS) as ListingStatus[]

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

export interface ListingFormStatusControlProps {
  currentStatus: ListingStatus
  listingId: string
  onStatusChange: (next: { toStatus: ListingStatus; note: string | null }) => Promise<void>
}

export interface ListingFormShellViewProps {
  mode: ListingFormMode
  data: FormValues
  errors: Partial<Record<keyof FormValues, string>>
  schema: ReturnType<typeof getSchema>
  locations: LocationOption[]
  patch: (partial: Partial<FormValues>) => void
  onPropertyTypeChange: (type: PropertyType) => void
  uploadPreset: string
  uploadFolder: string
  submitting: boolean
  submitError: string
  isDirty: boolean
  onSubmit: () => void
  onCancelClick: () => void
  showCancelDialog: boolean
  onCancelDialogChange: (open: boolean) => void
  onConfirmCancel: () => void
  /** Present only when the viewer is staff (admin/moderator) — server-gated (Note: agent-contract clause 6). */
  statusControl?: ListingFormStatusControlProps
}

export function ListingFormShellView({
  mode,
  data,
  errors,
  schema,
  locations,
  patch,
  onPropertyTypeChange,
  uploadPreset,
  uploadFolder,
  submitting,
  submitError,
  isDirty,
  onSubmit,
  onCancelClick,
  showCancelDialog,
  onCancelDialogChange,
  onConfirmCancel,
  statusControl,
}: ListingFormShellViewProps) {
  const t = useTranslations('listing')
  const tc = useTranslations('common')
  const tStatus = useTranslations('admin.common.status_control')

  // Owner-or-staff (the only viewers for whom `statusControl` is set, per
  // edit/page.tsx) gets the full privileged any-status set (Task 427).
  const allowedTargetStatuses = statusControl
    ? getAllowedTargetStatuses(statusControl.currentStatus, { privileged: true })
    : []

  const statusOptions: StatusOption<ListingStatus>[] = statusControl
    ? ALL_LISTING_STATUSES
        .filter(s => s === statusControl.currentStatus || allowedTargetStatuses.includes(s))
        .map(s => ({
          code: s,
          label: t(`status_${s}` as 'status_active'),
          labelKey: 'status_change_label',
          badgeVariant: STATUS_BADGE_VARIANT[s],
        }))
    : []

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{isEditMode(mode) ? t('edit_listing') : t('create_listing')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('create_listing_subtitle')}</p>
      </div>

      <AdminEditLayout
        main={
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
                    onChange={v => { if (v) onPropertyTypeChange(v as PropertyType) }}
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
                    className="rounded-xl resize-y min-h-40 max-h-128"
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

          </div>
        }
        sidebar={
          <SectionCard className="flex flex-col gap-3">
            <Button type="button" size="xl" onClick={onSubmit} disabled={submitting || !isDirty} className="w-full rounded-xl">
              {submitting
                ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />{isEditMode(mode) ? t('form_saving') : t('form_publishing')}</>
                : (isEditMode(mode) ? t('form_save') : t('form_publish'))}
            </Button>
            <Button type="button" variant="outline" size="xl" onClick={onCancelClick} disabled={submitting} className="w-full rounded-xl">
              {tc('cancel')}
            </Button>

            {statusControl && (
              <div className="flex flex-col gap-2 pt-3 border-t">
                <Label className="text-sm font-medium">{tStatus('status_change_label')}</Label>
                <StatusChangeControl
                  variant="select"
                  currentStatus={statusControl.currentStatus}
                  statuses={statusOptions}
                  onSubmit={statusControl.onStatusChange}
                  enableNote
                  aria-label={tStatus('status_change_label')}
                />
              </div>
            )}
          </SectionCard>
        }
      />

      {/* Cancel confirmation dialog — shown only when form has unsaved changes */}
      <Dialog open={showCancelDialog} onOpenChange={onCancelDialogChange}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{t('cancel_confirm_title')}</DialogTitle>
            <DialogDescription>{t('cancel_confirm_message')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onCancelDialogChange(false)}>
              {t('cancel_confirm_no')}
            </Button>
            <Button type="button" variant="destructive" onClick={onConfirmCancel}>
              {t('cancel_confirm_yes')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
