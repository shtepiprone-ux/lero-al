'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Alert, Box, Button, Container, Divider, Input, Stack, TextInput, Textarea } from '@mantine/core'
import { MantineBadge, MantineFormSection, MantinePageHeaderWithActions } from '@/design-system/mantine/patterns'
import { FilterChoiceGroup } from '@/components/shared/FilterChoiceGroup'
import { MantineDeleteConfirmModal } from '@/design-system/mantine/patterns/MantineDeleteConfirmModal'
import { ImageUpload } from '@/modules/listings/components/ImageUpload'
import { LocationCombobox, type LocationOption } from '@/components/shared/LocationCombobox'
import { PropertyTypeCombobox } from '@/components/shared/PropertyTypeCombobox'
import { AdminEditLayout } from '@/components/admin/AdminEditLayout'
import { StatusChangeSelect } from '@/components/admin/StatusChangeSelect'
import { DynamicFieldSection } from './form/DynamicFieldSection'
import { buildListingStatusOptions } from './listingStatusOptions'
import { isEditMode } from '@/modules/listings/domain/listingFormMode'
import { parsePriceDigits } from '@/modules/listings/domain/priceDigits'
import type { ListingFormMode } from '@/modules/listings/domain/listingFormMode'
import type { FormValues } from '@/modules/listings/types/form'
import type { CloudinaryWidgetConfig } from '@/modules/listings/lib/cloudinaryWidgetConfig'
import type { getSchema } from '@/modules/listings/domain/propertyTypeSchema'
import type { ListingType, PropertyType, ListingStatus } from '@/types/database'

// the two single choices of the basics section, rendered by the same canonical choice group as the property fields, so a selected choice has one look in the whole form (Review 2 F13)
const LISTING_TYPE_CHOICES = [{ value: 'sale', labelKey: 'sale' }, { value: 'rent', labelKey: 'rent' }] as const
const CURRENCY_CHOICES = [{ value: 'ALL', labelKey: 'ALL' }, { value: 'EUR', labelKey: 'EUR' }] as const

export interface ListingFormStatusControlProps {
  currentStatus: ListingStatus
  listingId: string
  /** Server-computed (`canAdminEditListing`): true only for staff. An owner is never offered `active` or `expired` (D6, D22, O957-17) as a target, and `pending` ("Publish", O957-11) only from a status other than `active` (O957-10); the owner's current status is a badge, not a list item (O957-16). */
  canPublish: boolean
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
  /** The listing being edited (edit mode): its photos are signed into the listing owner's folder (Task 957); absent in create mode. */
  listingId?: string
  /** The API key and the cloud name the page read on the server (`getCloudinaryWidgetConfig`); the photo widget needs both when it is created (`ImageUpload`). */
  cloudinary: CloudinaryWidgetConfig
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
  /** Edit mode, the listing's owner only (the edit page: `listing.user_id` is the viewer): the form shows a section with "Delete listing" under the actions (O957-18). */
  canDelete?: boolean
  /** Runs the deletion once the owner confirms it; the container deletes the listing and leaves the form, or shows the error and keeps it. */
  onDelete?: () => Promise<void> | void
}

export function ListingFormShellView({
  mode,
  data,
  errors,
  schema,
  locations,
  patch,
  onPropertyTypeChange,
  listingId,
  cloudinary,
  submitting,
  submitError,
  isDirty,
  onSubmit,
  onCancelClick,
  showCancelDialog,
  onCancelDialogChange,
  onConfirmCancel,
  statusControl,
  canDelete,
  onDelete,
}: ListingFormShellViewProps) {
  const t = useTranslations('listing')
  const tc = useTranslations('common')
  const tCabinet = useTranslations('cabinet')
  const tStatus = useTranslations('admin.common.status_control')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function confirmDelete() {
    setDeleting(true)
    try {
      await onDelete?.()
    } finally {
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  // a save error that appears (the container clears it when a save starts and sets it when the save fails) is brought to the person: scrolled to the middle of the screen and focused
  const submitErrorRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!submitError) return
    submitErrorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    submitErrorRef.current?.focus({ preventScroll: true })
  }, [submitError])

  // Owner-or-staff (the only viewers for whom `statusControl` is set, per edit/page.tsx) get the any-status set
  // (Task 427); `active` and `expired` are staff-only (Task 923 R35, D6, O957-17) and the owner reaches `pending` ("Publish") from every status but `active` (O957-10, O957-11): `canPublish` decides.
  // The owner's list holds only the operations; the owner's current status is the badge above it (O957-16).
  const statusOptions = statusControl
    ? buildListingStatusOptions(
        statusControl.currentStatus,
        { canPublish: statusControl.canPublish },
        s => t(`status_${s}` as 'status_active'),
        { publish: t('status_publish'), deactivate: t('status_deactivate') },
      )
    : []

  return (
    <Container size="lg" py="2xl" data-testid="listing-form-shell-view">

      {/* Page header: the canonical pattern owns the heading, its responsive size, the subtitle and the gap below */}
      <MantinePageHeaderWithActions
        title={isEditMode(mode) ? t('edit_listing') : t('create_listing')}
        subtitle={t('create_listing_subtitle')}
      />

      <AdminEditLayout
        main={
          <Stack gap="xl" w="100%">

            {/* Save error: the first element of the column (owner decision O957-9, 2026-11-21), because the Save button can be far below it; after a failed save it is scrolled into view and focused */}
            {submitError && (
              <Alert ref={submitErrorRef} tabIndex={-1} color="red" variant="light">
                {submitError}
              </Alert>
            )}

            {/* ── Section 1: Listing Basics ── */}
            <MantineFormSection title={t('section_basics')}>
              <Stack gap="lg">

                {/* Listing type */}
                <Input.Wrapper labelElement="div" label={tc('listing_type')}>
                  <FilterChoiceGroup
                    mode="single"
                    variant="filled"
                    ariaLabel={tc('listing_type')}
                    options={LISTING_TYPE_CHOICES}
                    getLabel={key => t(key as ListingType)}
                    selected={data.listing_type}
                    onChange={v => patch({ listing_type: v as ListingType })}
                    disabled={submitting}
                  />
                </Input.Wrapper>

                {/* Property type */}
                <Box id="field-property_type">
                  <Input.Wrapper labelElement="div" label={tc('property_type')} withAsterisk error={errors.property_type}>
                    <PropertyTypeCombobox
                      value={data.property_type || ''}
                      onChange={v => { if (v) onPropertyTypeChange(v as PropertyType) }}
                      placeholder={t('property_type_placeholder')}
                      showAllOption={false}
                      disabled={submitting}
                    />
                  </Input.Wrapper>
                </Box>

                {/* Title */}
                {/* the hint and the counter are the field's own description (Mantine's); the hint no longer repeats as the placeholder */}
                <TextInput
                  id="title"
                  label={t('field_title')}
                  withAsterisk
                  value={data.title}
                  onChange={e => patch({ title: e.target.value })}
                  description={`${t('field_title_hint')} (${data.title.length}/150)`}
                  maxLength={150}
                  error={errors.title}
                  disabled={submitting}
                />

                {/* Description */}
                <Textarea
                  id="description"
                  label={t('field_description')}
                  value={data.description ?? ''}
                  onChange={e => patch({ description: e.target.value || undefined })}
                  placeholder={t('field_description_placeholder')}
                  description={`${(data.description ?? '').length}/5000`}
                  resize="vertical"
                  rows={7}
                  maxLength={5000}
                  disabled={submitting}
                />

                {/* Price + currency */}
                <Box id="field-price">
                  <Input.Wrapper labelElement="div" label={t('field_price')} withAsterisk error={errors.price}>
                    <Stack gap="sm">
                      <FilterChoiceGroup
                        mode="single"
                        variant="filled"
                        ariaLabel={t('field_price')}
                        options={CURRENCY_CHOICES}
                        getLabel={key => key}
                        selected={data.currency}
                        onChange={v => patch({ currency: v as 'ALL' | 'EUR' })}
                        disabled={submitting}
                      />
                      <TextInput
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        value={data.price ?? ''}
                        onChange={e => patch({ price: parsePriceDigits(e.target.value) })}
                        placeholder="0"
                        error={Boolean(errors.price)}
                        aria-label={t('field_price')}
                        disabled={submitting}
                      />
                    </Stack>
                  </Input.Wrapper>
                </Box>

              </Stack>
            </MantineFormSection>

            {/* ── Section 2: Property Details — rendered by DynamicFieldSection ── */}
            <MantineFormSection id="field-details" title={t('section_details')}>
              <Stack gap="xl">
                <DynamicFieldSection
                  schema={schema}
                  formValues={data}
                  errors={errors}
                  onChange={patch}
                  disabled={submitting}
                />
              </Stack>
            </MantineFormSection>

            {/* ── Section 3: Photos ── */}
            <MantineFormSection id="field-images" title={t('section_photos')}>
              {/* the photo error is the field error of the photo section, as every other field's */}
              <Input.Wrapper error={errors.images}>
                <ImageUpload images={data.images} onChange={imgs => patch({ images: imgs })} listingId={listingId} cloudinary={cloudinary} disabled={submitting} />
              </Input.Wrapper>
            </MantineFormSection>

            {/* ── Section 4: Location ── */}
            <MantineFormSection title={t('section_location')}>
              <Stack gap="lg">
                <Input.Wrapper labelElement="div" label={tc('location')}>
                  <LocationCombobox locations={locations} value={data.location_id ? String(data.location_id) : ''} onChange={id => patch({ location_id: id ? Number(id) : undefined })} placeholder={tc('location')} disabled={submitting} />
                </Input.Wrapper>
                <TextInput
                  id="address"
                  label={t('field_address')}
                  value={data.address ?? ''}
                  onChange={e => patch({ address: e.target.value || undefined })}
                  placeholder={t('field_address_placeholder')}
                  maxLength={300}
                  disabled={submitting}
                />
              </Stack>
            </MantineFormSection>

          </Stack>
        }
        sidebar={
          <>
            <MantineFormSection>
              <Stack gap="sm">
                <Button type="button" fullWidth onClick={onSubmit} disabled={submitting || !isDirty} loading={submitting}>
                  {submitting
                    ? (isEditMode(mode) ? t('form_saving') : t('form_publishing'))
                    : (isEditMode(mode) ? t('form_save') : t('form_publish'))}
                </Button>
                <Button type="button" variant="default" fullWidth onClick={onCancelClick} disabled={submitting}>
                  {tc('cancel')}
                </Button>

                {statusControl && (
                  <Stack gap="xs" pt="sm">
                    <Divider />
                    {/* the owner's current status is a badge above the operations, not a list item (owner decision O957-16); staff keep it as the select's value */}
                    {!statusControl.canPublish && (
                      <Box>
                        <MantineBadge variant="status" entity="listing" value={statusControl.currentStatus} data-testid="listing-status-badge">
                          {t(`status_${statusControl.currentStatus}` as 'status_active')}
                        </MantineBadge>
                      </Box>
                    )}
                    <StatusChangeSelect
                      currentStatus={statusControl.currentStatus}
                      statuses={statusOptions}
                      onSubmit={statusControl.onStatusChange}
                      enableNote
                      label={tStatus('status_change_label')}
                      disabled={submitting}
                    />
                  </Stack>
                )}
              </Stack>
            </MantineFormSection>

            {/* the listing's owner deletes it here, in a section of its own under the actions (owner decision O957-18); staff and the create form have none */}
            {isEditMode(mode) && canDelete && onDelete && (
              <MantineFormSection>
                <Button type="button" variant="light" color="red" fullWidth onClick={() => setDeleteOpen(true)} disabled={submitting}>
                  {t('delete_listing')}
                </Button>
              </MantineFormSection>
            )}
          </>
        }
      />

      {/* Delete confirmation: the cabinet's own question and button texts; the action itself is the container's `onDelete` */}
      <MantineDeleteConfirmModal
        opened={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title={t('delete_listing')}
        message={tCabinet('delete_listing_confirm')}
        confirmLabel={tCabinet('delete')}
        cancelLabel={tc('cancel')}
        loading={deleting}
        onConfirm={() => void confirmDelete()}
      />

      {/* Cancel confirmation dialog — shown only when form has unsaved changes */}
      <MantineDeleteConfirmModal
        opened={showCancelDialog}
        onClose={() => onCancelDialogChange(false)}
        title={t('cancel_confirm_title')}
        message={t('cancel_confirm_message')}
        confirmLabel={t('cancel_confirm_yes')}
        cancelLabel={t('cancel_confirm_no')}
        onConfirm={onConfirmCancel}
      />

    </Container>
  )
}
