'use client'

import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Alert, Button, Flex, Group, Stack, Text, Textarea, useMantineTheme } from '@mantine/core'
import { AlertTriangle, RotateCcw, Trash2 } from 'lucide-react'
import { MantineModal } from '@/design-system/mantine/patterns'

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

interface ConfirmFooterProps {
  cancelLabel: string
  confirmLabel: string
  confirmColor: 'red' | 'yellow' | 'green'
  loading: boolean
  confirmDisabled?: boolean
  onCancel: () => void
  onConfirm: () => void
}

/** The footer every dialog shares: cancel + confirm, stacked below `sm` (confirm on top), inline from `sm`. */
function ConfirmFooter({ cancelLabel, confirmLabel, confirmColor, loading, confirmDisabled, onCancel, onConfirm }: ConfirmFooterProps) {
  return (
    <Flex direction={{ base: 'column-reverse', sm: 'row' }} gap="sm" justify={{ base: 'stretch', sm: 'flex-end' }}>
      <Button variant="outline" color="gray" w={{ base: '100%', sm: 'auto' }} disabled={loading} onClick={onCancel}>
        {cancelLabel}
      </Button>
      <Button
        color={confirmColor}
        w={{ base: '100%', sm: 'auto' }}
        loading={loading}
        disabled={confirmDisabled}
        onClick={onConfirm}
      >
        {confirmLabel}
      </Button>
    </Flex>
  )
}

function DialogTitle({ icon, color, children }: { icon: ReactNode; color: 'yellow.7' | 'red.7' | 'green.7'; children: ReactNode }) {
  return (
    <Group gap="xs" wrap="nowrap" c={color}>
      {icon}
      <Text component="span" inherit>
        {children}
      </Text>
    </Group>
  )
}

/**
 * Presentational View of the confirmation dialogs of `/admin/users/[id]` (Task 893, R6; Container/Presentational
 * split of `AdminUserProfile`). Every dialog is a controlled canonical `MantineModal` (centred from 640px, bottom
 * sheet below). No server call and no state beyond `useTranslations`: the container owns which dialog is open, the
 * reason text, the loading flag and every outcome.
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
  const theme = useMantineTheme()
  const iconSize = theme.other.iconSize.standard

  return (
    <>
      <MantineModal
        opened={dialog === 'unsaved'}
        onClose={onClose}
        title={
          <DialogTitle icon={<AlertTriangle size={iconSize} />} color="yellow.7">
            {t('dialogs.unsaved_title')}
          </DialogTitle>
        }
        footer={
          <ConfirmFooter
            cancelLabel={t('dialogs.unsaved_stay')}
            confirmLabel={t('dialogs.unsaved_leave')}
            confirmColor="red"
            loading={false}
            onCancel={onClose}
            onConfirm={onConfirm}
          />
        }
      >
        <Text size="sm" c="dimmed">
          {t('dialogs.unsaved_body')}
        </Text>
      </MantineModal>

      <MantineModal
        opened={dialog === 'cancel'}
        onClose={onClose}
        title={
          <DialogTitle icon={<AlertTriangle size={iconSize} />} color="yellow.7">
            {t('dialogs.cancel_title')}
          </DialogTitle>
        }
        footer={
          <ConfirmFooter
            cancelLabel={t('dialogs.cancel_return')}
            confirmLabel={t('dialogs.cancel_confirm')}
            confirmColor="red"
            loading={false}
            onCancel={onClose}
            onConfirm={onConfirm}
          />
        }
      >
        <Text size="sm" c="dimmed">
          {t('dialogs.cancel_body')}
        </Text>
      </MantineModal>

      <MantineModal
        opened={dialog === 'deactivate'}
        onClose={onClose}
        title={
          <DialogTitle icon={<Trash2 size={iconSize} />} color="yellow.7">
            {t('dialogs.deactivate_title')}
          </DialogTitle>
        }
        footer={
          <ConfirmFooter
            cancelLabel={t('dialogs.deactivate_cancel')}
            confirmLabel={t('dialogs.deactivate_confirm')}
            confirmColor="yellow"
            loading={loading}
            confirmDisabled={!reason.trim()}
            onCancel={onClose}
            onConfirm={onConfirm}
          />
        }
      >
        <Stack gap="sm">
          <Text size="sm" c="dimmed">
            {t('dialogs.deactivate_about')}
          </Text>
          <Text size="sm" fw={600}>
            {userName}
          </Text>
          <Textarea
            autosize
            minRows={3}
            label={t('dialogs.deactivate_reason_label')}
            placeholder={t('dialogs.deactivate_reason_placeholder')}
            value={reason}
            onChange={e => onReasonChange(e.target.value)}
          />
        </Stack>
      </MantineModal>

      <MantineModal
        opened={dialog === 'reactivate'}
        onClose={onClose}
        title={
          <DialogTitle icon={<RotateCcw size={iconSize} />} color="green.7">
            {t('dialogs.reactivate_title')}
          </DialogTitle>
        }
        footer={
          <ConfirmFooter
            cancelLabel={t('dialogs.reactivate_cancel')}
            confirmLabel={t('dialogs.reactivate_confirm')}
            confirmColor="green"
            loading={loading}
            confirmDisabled={!reason.trim()}
            onCancel={onClose}
            onConfirm={onConfirm}
          />
        }
      >
        <Stack gap="sm">
          <Text size="sm" c="dimmed">
            {t('dialogs.reactivate_about')}
          </Text>
          <Text size="sm" fw={600}>
            {userName}
          </Text>
          <Textarea
            autosize
            minRows={3}
            label={t('dialogs.reactivate_reason_label')}
            placeholder={t('dialogs.reactivate_reason_placeholder')}
            value={reason}
            onChange={e => onReasonChange(e.target.value)}
          />
        </Stack>
      </MantineModal>

      <MantineModal
        opened={dialog === 'delete'}
        onClose={onClose}
        title={
          <DialogTitle icon={<Trash2 size={iconSize} />} color="red.7">
            {t('dialogs.delete_hard_title')}
          </DialogTitle>
        }
        footer={
          <ConfirmFooter
            cancelLabel={t('dialogs.delete_cancel')}
            confirmLabel={t('dialogs.delete_hard_confirm')}
            confirmColor="red"
            loading={loading}
            onCancel={onClose}
            onConfirm={onConfirm}
          />
        }
      >
        <Stack gap="xs">
          <Text size="sm" c="dimmed">
            {t('dialogs.delete_hard_about')}
          </Text>
          <Text size="sm" fw={600}>
            {userName}
          </Text>
          <Text size="xs" c="dimmed">
            {email}
          </Text>
          <Alert color="red" variant="light" title={t('dialogs.delete_hard_warning')}>
            <Stack gap="xs">
              <Text size="xs">{t('dialogs.delete_hard_point1')}</Text>
              <Text size="xs">{t('dialogs.delete_shared_point2')}</Text>
              <Text size="xs">{t('dialogs.delete_hard_point3')}</Text>
            </Stack>
          </Alert>
        </Stack>
      </MantineModal>

      {(['clear-row', 'clear-entity'] as const).map(scope => (
        <MantineModal
          key={scope}
          opened={dialog === scope}
          onClose={onClose}
          title={
            <DialogTitle icon={<Trash2 size={iconSize} />} color="red.7">
              {scope === 'clear-entity' ? t('dialogs.clear_entity_title') : t('dialogs.clear_row_title')}
            </DialogTitle>
          }
          footer={
            <ConfirmFooter
              cancelLabel={t('dialogs.clear_cancel')}
              confirmLabel={t('dialogs.clear_confirm')}
              confirmColor="red"
              loading={loading}
              onCancel={onClose}
              onConfirm={onConfirm}
            />
          }
        >
          <Text size="sm" c="dimmed">
            {scope === 'clear-entity' ? t('dialogs.clear_entity_body') : t('dialogs.clear_row_body')}
          </Text>
        </MantineModal>
      ))}
    </>
  )
}
