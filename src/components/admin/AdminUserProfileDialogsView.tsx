'use client'

import { useTranslations } from 'next-intl'
import { Button, Stack, Text, Textarea } from '@mantine/core'
import { DELETE_CONFIRM_WORD, MantineDeleteConfirmModal } from '@/design-system/mantine/patterns/MantineDeleteConfirmModal'
import { MantineDialogFooter } from '@/design-system/mantine/patterns/MantineDialogFooter'
import { MantineDialogSection, MantineDialogSections } from '@/design-system/mantine/patterns/MantineDialogSections'
import { MantineModal } from '@/design-system/mantine/patterns/MantineModal'

export type AdminUserProfileDialog =
  | 'unsaved'
  | 'cancel'
  | 'deactivate'
  | 'reactivate'
  | 'delete'
  | 'clear-row'
  | 'clear-entity'

export interface AdminUserProfileDialogsViewProps {
  /** Which dialog is open; `null` closes them all. */
  dialog: AdminUserProfileDialog | null
  userName: string
  email: string
  /** The reason typed in the deactivate / reactivate dialog. */
  reason: string
  onReasonChange: (value: string) => void
  /** A server call is in flight: the confirm button shows a spinner and cancel is disabled. */
  loading: boolean
  onConfirm: () => void
  /** The "return" side of every dialog (backdrop, Esc, the cancel button). */
  onClose: () => void
}

/**
 * Presentational View of the confirmation dialogs of `/admin/users/[id]` (Task 893, R6; Container/Presentational
 * split of `AdminUserProfile`; Task 859 Revision 2, R29). Six dialogs are the canonical `MantineDeleteConfirmModal`
 * (a red filled primary, Cancel on the left): leaving with unsaved changes, cancelling the creation, deactivating
 * (with its required reason), the hard delete (with its consequences and the typed word DELETE, Task 923 R144) and the two history clears. Reactivating is the
 * one non-destructive confirmation: a structured `MantineModal` whose primary is the theme's. No server call and no
 * state beyond `useTranslations`: the container owns which dialog is open, the reason text, the loading flag and
 * every outcome.
 */
export function AdminUserProfileDialogsView({
  dialog,
  userName,
  email,
  reason,
  onReasonChange,
  loading,
  onConfirm,
  onClose,
}: AdminUserProfileDialogsViewProps) {
  const t = useTranslations('admin.user_profile')

  const subject = (about: string) => (
    <Stack gap="xs">
      <Text fz="sm">{about}</Text>
      <Text fz="sm" fw={600}>{userName}</Text>
    </Stack>
  )

  const reasonField = (label: string, placeholder: string) => (
    <Textarea
      autosize
      minRows={3}
      label={label}
      placeholder={placeholder}
      value={reason}
      onChange={e => onReasonChange(e.target.value)}
    />
  )

  return (
    <>
      <MantineDeleteConfirmModal
        opened={dialog === 'unsaved'}
        onClose={onClose}
        title={t('dialogs.unsaved_title')}
        message={t('dialogs.unsaved_body')}
        confirmLabel={t('dialogs.unsaved_leave')}
        cancelLabel={t('dialogs.unsaved_stay')}
        onConfirm={onConfirm}
      />

      <MantineDeleteConfirmModal
        opened={dialog === 'cancel'}
        onClose={onClose}
        title={t('dialogs.cancel_title')}
        message={t('dialogs.cancel_body')}
        confirmLabel={t('dialogs.cancel_confirm')}
        cancelLabel={t('dialogs.cancel_return')}
        onConfirm={onConfirm}
      />

      <MantineDeleteConfirmModal
        opened={dialog === 'deactivate'}
        onClose={onClose}
        title={t('dialogs.deactivate_title')}
        message={subject(t('dialogs.deactivate_about'))}
        confirmLabel={t('dialogs.deactivate_confirm')}
        cancelLabel={t('dialogs.deactivate_cancel')}
        loading={loading}
        confirmDisabled={!reason.trim()}
        onConfirm={onConfirm}
      >
        <MantineDialogSection>
          {reasonField(t('dialogs.deactivate_reason_label'), t('dialogs.deactivate_reason_placeholder'))}
        </MantineDialogSection>
      </MantineDeleteConfirmModal>

      <MantineModal
        structured
        opened={dialog === 'reactivate'}
        onClose={onClose}
        title={t('dialogs.reactivate_title')}
        footer={
          <MantineDialogFooter
            secondary={<Button type="button" variant="default" disabled={loading} onClick={onClose}>{t('dialogs.reactivate_cancel')}</Button>}
            primary={
              <Button type="button" loading={loading} disabled={!reason.trim()} onClick={onConfirm}>
                {t('dialogs.reactivate_confirm')}
              </Button>
            }
          />
        }
      >
        <MantineDialogSections>
          <MantineDialogSection>{subject(t('dialogs.reactivate_about'))}</MantineDialogSection>
          <MantineDialogSection>
            {reasonField(t('dialogs.reactivate_reason_label'), t('dialogs.reactivate_reason_placeholder'))}
          </MantineDialogSection>
        </MantineDialogSections>
      </MantineModal>

      <MantineDeleteConfirmModal
        opened={dialog === 'delete'}
        onClose={onClose}
        title={t('dialogs.delete_hard_title')}
        message={
          <Stack gap="xs">
            <Text fz="sm">{t('dialogs.delete_hard_about')}</Text>
            <Text fz="sm" fw={600}>{userName}</Text>
            <Text fz="xs" c="dimmed">{email}</Text>
          </Stack>
        }
        confirmLabel={t('dialogs.delete_hard_confirm')}
        cancelLabel={t('dialogs.delete_cancel')}
        loading={loading}
        onConfirm={onConfirm}
        typedConfirm={{ word: DELETE_CONFIRM_WORD, label: t('dialogs.delete_type_confirm') }}
      >
        <MantineDialogSection title={t('dialogs.delete_hard_warning')}>
          <Stack gap="xs">
            <Text fz="sm">{t('dialogs.delete_hard_point1')}</Text>
            <Text fz="sm">{t('dialogs.delete_hard_point3')}</Text>
          </Stack>
        </MantineDialogSection>
      </MantineDeleteConfirmModal>

      {(['clear-row', 'clear-entity'] as const).map(scope => (
        <MantineDeleteConfirmModal
          key={scope}
          opened={dialog === scope}
          onClose={onClose}
          title={scope === 'clear-entity' ? t('dialogs.clear_entity_title') : t('dialogs.clear_row_title')}
          message={scope === 'clear-entity' ? t('dialogs.clear_entity_body') : t('dialogs.clear_row_body')}
          confirmLabel={t('dialogs.clear_confirm')}
          cancelLabel={t('dialogs.clear_cancel')}
          loading={loading}
          onConfirm={onConfirm}
        />
      ))}
    </>
  )
}
