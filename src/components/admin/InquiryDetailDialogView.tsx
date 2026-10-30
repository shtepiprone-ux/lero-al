'use client'

import { Fragment, type ReactNode } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { SendSquareIcon } from '@solar-icons/react/broken'
import { Alert, Button, Group, Paper, Stack, Text, Textarea, useMantineTheme } from '@mantine/core'
import { MantineModal } from '@/design-system/mantine/patterns/MantineModal'
import { MantineDialogSections, MantineDialogSection } from '@/design-system/mantine/patterns/MantineDialogSections'
import { MantineDetailList } from '@/design-system/mantine/patterns/MantineDetailList'
import { MantineDialogFooter } from '@/design-system/mantine/patterns/MantineDialogFooter'
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
 * `AdminInquiriesManager`; Task 859 Revision 2, R29: the canonical dialog anatomy, §23.7). A structured
 * `MantineModal` (bottom sheet below 640px) with the topic as its description and sections: the facts as
 * `MantineDetailList`, the status as `StatusChangeSelect`, the message, the replies and the reply composer, then a
 * `MantineDialogFooter` pair — Close (secondary) and Send reply (the one primary). `useTranslations` /
 * `useLocale` / `useMantineTheme` only: no state, no server action, no toast (the status toasts belong to
 * `StatusChangeSelect`).
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
  const tc = useTranslations('common')
  const locale = useLocale()
  const theme = useMantineTheme()

  return (
    <MantineModal
      opened
      onClose={onClose}
      structured
      size="lg"
      title={t('detail_title')}
      description={subject}
      footer={
        <MantineDialogFooter
          secondary={<Button type="button" variant="default" onClick={onClose}>{tc('close')}</Button>}
          primary={
            <Button
              type="button"
              leftSection={isPending ? undefined : <SendSquareIcon size={theme.other.iconSize.compact} aria-hidden="true" />}
              onClick={onSendReply}
              disabled={isPending || replyBody.trim().length < 5}
            >
              {isPending ? t('sending_reply') : t('send_reply')}
            </Button>
          }
        />
      }
    >
      <MantineDialogSections>
        <MantineDialogSection>
          <MantineDetailList
            items={[
              { label: t('from_label'), value: `${inquiry.name} · ${inquiry.email}` },
              { label: t('topic_label'), value: `${subject} · ${inquiry.target_mailbox}` },
              { label: t('received_label'), value: formatDate(inquiry.created_at, locale) },
            ]}
          />
        </MantineDialogSection>

        <MantineDialogSection title={t('change_status')}>
          <StatusChangeSelect<ContactStatus>
            currentStatus={inquiry.status}
            statuses={statusOptions}
            onSubmit={onStatusSubmit}
            disabled={isPending}
            aria-label={t('change_status')}
          />
        </MantineDialogSection>

        <MantineDialogSection title={t('detail_message')}>
          <Text size="sm">{renderLines(inquiry.message)}</Text>
        </MantineDialogSection>

        {replies.length === 0 && inquiry.reply_count > 0 ? (
          <MantineDialogSection title={t('detail_replies')}>
            <Alert color="yellow" variant="light">{t('reply_history_load_failed')}</Alert>
          </MantineDialogSection>
        ) : replies.length > 0 ? (
          <MantineDialogSection title={t('detail_replies')}>
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
          </MantineDialogSection>
        ) : null}

        <MantineDialogSection title={t('reply_label')}>
          <Textarea
            aria-label={t('reply_label')}
            placeholder={t('reply_placeholder')}
            value={replyBody}
            onChange={e => onReplyBodyChange(e.currentTarget.value)}
            disabled={isPending}
            autosize
            minRows={4}
          />
        </MantineDialogSection>
      </MantineDialogSections>
    </MantineModal>
  )
}
