'use client'

import { Fragment, type ReactNode } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Send } from 'lucide-react'
import {
  Alert, Button, Group, Paper, SimpleGrid, Stack, Text, Textarea, useMantineTheme,
} from '@mantine/core'
import { MantineModal } from '@/design-system/mantine/patterns'
import { StatusChangeSelect, type StatusSelectOption } from '@/components/admin/StatusChangeSelect'
import { formatDate } from '@/lib/formatters'
import type { InquiryRow, ReplyRow } from '@/components/admin/AdminInquiriesManager'
import type { ContactStatus } from '@/types/database'

export interface InquiryDetailDialogViewProps {
  inquiry: InquiryRow
  /** Replies of this inquiry that were loaded (may be empty while `reply_count > 0`). */
  replies: ReplyRow[]
  /** Subject line of the inquiry (topic label, custom subject, or the raw unknown topic). */
  subject: string
  statusOptions: StatusSelectOption<ContactStatus>[]
  replyBody: string
  onReplyBodyChange: (value: string) => void
  /** A reply is being sent: the status select and composer disable, the send label switches. */
  isPending: boolean
  onStatusSubmit: (next: { toStatus: ContactStatus; note: string | null }) => Promise<void> | void
  onSendReply: () => void
  onClose: () => void
}

/** Keeps line breaks of user text without a style: fragments joined by `<br />`. */
function renderLines(text: string): ReactNode {
  return text.split('\n').map((line, index) => (
    <Fragment key={index}>
      {index > 0 && <br />}
      {line}
    </Fragment>
  ))
}

/**
 * Presentational View of the inquiry detail dialog (Task 894, Container/Presentational split of
 * `AdminInquiriesManager`). `useTranslations` / `useLocale` / `useMantineTheme` only: no state, no server
 * action, no toast (the status toasts belong to `StatusChangeSelect`). The dialog is the canonical
 * `MantineModal` (bottom sheet below 640px).
 */
export function InquiryDetailDialogView({
  inquiry,
  replies,
  subject,
  statusOptions,
  replyBody,
  onReplyBodyChange,
  isPending,
  onStatusSubmit,
  onSendReply,
  onClose,
}: InquiryDetailDialogViewProps) {
  const t = useTranslations('admin.inquiries')
  const locale = useLocale()
  const theme = useMantineTheme()

  const caption = (text: string) => <Text size="xs" c="dimmed">{text}</Text>
  const sectionLabel = (text: string) => (
    <Text size="xs" fw={600} c="dimmed" tt="uppercase">{text}</Text>
  )

  return (
    <MantineModal opened onClose={onClose} title={t('detail_title')} size="lg">
      <Stack gap="lg">
        <Paper bg="gray.0" p="md" radius="md">
          <SimpleGrid cols={{ base: 1, xs2: 2 }} spacing="md" verticalSpacing="md">
            <Stack gap="tight">
              {caption(t('from_label'))}
              <Text size="sm" fw={500}>{inquiry.name}</Text>
              {caption(inquiry.email)}
            </Stack>
            <Stack gap="tight">
              {caption(t('topic_label'))}
              <Text size="sm" fw={500}>{subject}</Text>
              <Text size="xs" c="dimmed" ff="monospace">{inquiry.target_mailbox}</Text>
            </Stack>
            <Stack gap="tight">
              {caption(t('received_label'))}
              <Text size="sm">{formatDate(inquiry.created_at, locale)}</Text>
            </Stack>
            <Stack gap="tight">
              {caption(t('change_status'))}
              <StatusChangeSelect<ContactStatus>
                currentStatus={inquiry.status}
                statuses={statusOptions}
                onSubmit={onStatusSubmit}
                disabled={isPending}
                aria-label={t('change_status')}
              />
            </Stack>
          </SimpleGrid>
        </Paper>

        <Stack gap="xs">
          {sectionLabel(t('detail_message'))}
          <Paper withBorder p="md" radius="md">
            <Text size="sm">{renderLines(inquiry.message)}</Text>
          </Paper>
        </Stack>

        {replies.length === 0 && inquiry.reply_count > 0 ? (
          <Alert color="yellow" variant="light">{t('reply_history_load_failed')}</Alert>
        ) : replies.length > 0 ? (
          <Stack gap="xs">
            {sectionLabel(t('detail_replies'))}
            <Stack gap="sm">
              {replies.map(r => (
                <Paper key={r.id} withBorder p="md" radius="md">
                  <Stack gap="xs">
                    <Group justify="space-between" gap="xs">
                      <Text size="xs" fw={500}>{r.replier?.name ?? t('from_label')}</Text>
                      <Text size="xs" c="dimmed">{formatDate(r.created_at, locale)}</Text>
                    </Group>
                    <Text size="sm">{renderLines(r.body)}</Text>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Stack>
        ) : null}

        <Stack gap="xs">
          {sectionLabel(t('reply_label'))}
          <Textarea
            aria-label={t('reply_label')}
            placeholder={t('reply_placeholder')}
            value={replyBody}
            onChange={e => onReplyBodyChange(e.currentTarget.value)}
            disabled={isPending}
            autosize
            minRows={4}
          />
          <Button
            w={{ base: '100%', sm: 'auto' }}
            leftSection={<Send size={theme.other.iconSize.compact} />}
            onClick={onSendReply}
            disabled={isPending || replyBody.trim().length < 5}
          >
            {isPending ? t('sending_reply') : t('send_reply')}
          </Button>
        </Stack>
      </Stack>
    </MantineModal>
  )
}
