'use client'

import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Button, Stack, Text, TextInput, Textarea } from '@mantine/core'
import { MantineModal, MantineSelect } from '@/design-system/mantine/patterns'
import { MantineDialogSections, MantineDialogSection } from '@/design-system/mantine/patterns/MantineDialogSections'
import { MantineDialogFooter } from '@/design-system/mantine/patterns/MantineDialogFooter'
import type { ComplaintType } from '@/types/database'

export type CreateTicketType = 'support' | 'user_complaint' | ''

export const COMPLAINT_TYPES: ComplaintType[] = [
  'fraud_or_scam', 'fake_listing_or_profile', 'harassment_or_abuse',
  'inappropriate_content', 'spam', 'payment_or_deposit_issue',
  'duplicate_or_impersonation', 'other',
]

export interface CreateTicketDialogViewProps {
  ticketType: CreateTicketType
  onTicketTypeChange: (type: 'support' | 'user_complaint') => void
  /** User picker slot, built by the container (`UserPickerField`). */
  requesterField: ReactNode
  /** Complaint only. */
  reportedField: ReactNode
  complaintType: ComplaintType | ''
  onComplaintTypeChange: (type: ComplaintType) => void
  subject: string
  onSubjectChange: (value: string) => void
  reason: string
  onReasonChange: (value: string) => void
  errors: Record<string, string>
  creating: boolean
  /** Complaint reporter and reported are the same user: shows the warning and disables Create. */
  sameUser: boolean
  onCreate: () => void
  onClose: () => void
}

/**
 * Presentational View of the create-ticket dialog (Task 859, Container/Presentational split of
 * `CreateTicketDialog`): a support ticket or a user complaint as a structured `MantineModal` (§23.7: sections, `MantineDialogFooter` pair). No state,
 * validation or server action; the pickers arrive as slots.
 */
export function CreateTicketDialogView({
  ticketType,
  onTicketTypeChange,
  requesterField,
  reportedField,
  complaintType,
  onComplaintTypeChange,
  subject,
  onSubjectChange,
  reason,
  onReasonChange,
  errors,
  creating,
  sameUser,
  onCreate,
  onClose,
}: CreateTicketDialogViewProps) {
  const t = useTranslations('admin.support')
  const isComplaint = ticketType === 'user_complaint'

  const ticketTypeOptions = [
    { value: 'support', label: t('type_support') },
    { value: 'user_complaint', label: t('type_user_complaint') },
  ]
  const complaintTypeOptions = COMPLAINT_TYPES.map(ct => ({
    value: ct,
    label: t(`complaint_type_${ct}` as 'complaint_type_other'),
  }))

  const footer = (
    <MantineDialogFooter
      secondary={
        <Button type="button" variant="default" disabled={creating} onClick={onClose}>
          {t('cancel_btn')}
        </Button>
      }
      primary={
        <Button type="button" loading={creating} disabled={creating || sameUser} onClick={onCreate}>
          {t('create_btn')}
        </Button>
      }
    />
  )

  return (
    <MantineModal opened onClose={onClose} structured size="md" title={t('dialog_create_title')} footer={footer}>
      <MantineDialogSections>
        <MantineDialogSection>
          <MantineSelect
            label={t('ticket_type_label')}
            data={ticketTypeOptions}
            value={ticketType || null}
            allowDeselect={false}
            placeholder={t('ticket_type_placeholder')}
            description={!ticketType && !errors.ticketType ? t('ticket_type_helper_empty') : undefined}
            error={errors.ticketType || undefined}
            disabled={creating}
            onChange={v => { if (v) onTicketTypeChange(v as 'support' | 'user_complaint') }}
          />
        </MantineDialogSection>

        {ticketType === 'support' && (
          <MantineDialogSection>
            <Stack gap="md">
              {requesterField}
              <TextInput
                label={t('subject_label')}
                value={subject}
                onChange={e => onSubjectChange(e.currentTarget.value)}
                placeholder={t('support_subject_placeholder')}
                error={errors.subject || undefined}
              />
              <Textarea
                label={t('support_details_label')}
                value={reason}
                onChange={e => onReasonChange(e.currentTarget.value)}
                placeholder={t('support_details_placeholder')}
                autosize
                minRows={3}
                error={errors.reason || undefined}
              />
            </Stack>
          </MantineDialogSection>
        )}

        {isComplaint && (
          <MantineDialogSection>
            <Stack gap="md">
              {requesterField}
              {reportedField}
              {sameUser && <Text size="xs" c="red">{t('same_user_warning')}</Text>}
            </Stack>
          </MantineDialogSection>
        )}

        {isComplaint && (
          <MantineDialogSection>
            <Stack gap="md">
              <MantineSelect
                label={t('complaint_type_label')}
                data={complaintTypeOptions}
                value={complaintType || null}
                allowDeselect={false}
                placeholder={t('complaint_type_placeholder')}
                error={errors.complaintType || undefined}
                disabled={creating}
                onChange={v => { if (v) onComplaintTypeChange(v as ComplaintType) }}
              />
              <TextInput
                label={t('subject_label')}
                value={subject}
                onChange={e => onSubjectChange(e.currentTarget.value)}
                placeholder={t('subject_placeholder')}
                error={errors.subject || undefined}
              />
              <Textarea
                label={t('reason_label')}
                value={reason}
                onChange={e => onReasonChange(e.currentTarget.value)}
                placeholder={t('reason_placeholder')}
                autosize
                minRows={3}
                error={errors.reason || undefined}
              />
            </Stack>
          </MantineDialogSection>
        )}
      </MantineDialogSections>
    </MantineModal>
  )
}
