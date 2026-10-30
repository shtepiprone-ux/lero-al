'use client'

import type { ReactNode } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { ClockCircleIcon, UserIcon } from '@solar-icons/react/broken'
import { Box, Button, Group, Stack, Text, Textarea, useMantineTheme } from '@mantine/core'
import { MantineModal } from '@/design-system/mantine/patterns/MantineModal'
import { MantineDialogSections, MantineDialogSection } from '@/design-system/mantine/patterns/MantineDialogSections'
import { MantineDetailList } from '@/design-system/mantine/patterns/MantineDetailList'
import { MantineNavRowList, type MantineNavRow } from '@/design-system/mantine/patterns/MantineNavRowList'
import { MantineDialogFooter } from '@/design-system/mantine/patterns/MantineDialogFooter'
import { MantineRadioCardGroup, MantineRadioCardOption } from '@/design-system/mantine/patterns/MantineRadioCardOption'
import { formatDate } from '@/lib/formatters'
import { SUPPORT_TICKET_STATUSES } from '@/components/admin/supportFilters'
import type { SupportTicketRow, SupportTicketEventRow } from '@/components/admin/AdminSupportManager'
import type { TicketStatus } from '@/types/database'
import { MantineBadge } from '@/design-system/mantine/patterns/MantineBadge'

export interface TicketDetailDialogViewProps {
  ticket: SupportTicketRow
  /** Events of this ticket only (the container filters). */
  events: SupportTicketEventRow[]
  newStatus: TicketStatus
  onNewStatusChange: (status: TicketStatus) => void
  note: string
  onNoteChange: (note: string) => void
  updating: boolean
  onUpdate: () => void
  onClose: () => void
}

/**
 * Presentational View of the support ticket detail dialog (Task 859, Container/Presentational split of
 * `TicketDetailDialog`), built only from the canonical dialog anatomy (`docs/mantine-responsive-design-system.md`
 * §23.7): a structured `MantineModal` (bottom sheet below 640px) with the subject as its title and the ticket type as
 * its description, and sections — the facts as `MantineDetailList`, the reason, the status choice as `Radio.Card`s
 * with the note, the timeline and the linked users as `MantineNavRowList` — plus a `MantineDialogFooter` pair:
 * Cancel (secondary) and Update status (the one primary, disabled until another status is chosen).
 * `useTranslations` / `useLocale` / `useMantineTheme` only: no state, no server action, no toast. The timeline
 * prints the localized status labels, never the raw enum.
 */
export function TicketDetailDialogView({
  ticket,
  events,
  newStatus,
  onNewStatusChange,
  note,
  onNoteChange,
  updating,
  onUpdate,
  onClose,
}: TicketDetailDialogViewProps) {
  const t = useTranslations('admin.support')
  const locale = useLocale()
  const theme = useMantineTheme()
  const iconSize = theme.other.iconSize.standard
  const isComplaint = ticket.ticket_type === 'user_complaint'

  const statusLabel = (status: string) =>
    (SUPPORT_TICKET_STATUSES as string[]).includes(status)
      ? t(`support_status_${status}` as 'support_status_open')
      : status

  const userName = (user: SupportTicketRow['reporter']) => (user ? (user.name ?? t('user_no_name')) : '—')

  // GR-3j: the fact panel stacks label over value, so a badge value starts at the panel's start edge like any value.
  const badgeCell = (badge: ReactNode) => <Group gap={0} justify="flex-start">{badge}</Group>

  const facts = [
    { label: isComplaint ? t('col_reporter') : t('col_requester'), value: userName(ticket.reporter) },
    ...(isComplaint ? [{ label: t('col_reported'), value: userName(ticket.reported) }] : []),
    { label: t('col_created_by'), value: userName(ticket.created_by_admin) },
    {
      label: t('col_type'),
      value: badgeCell(
        <MantineBadge variant="status" entity="ticketType" value={isComplaint ? 'user_complaint' : 'support'}>
          {isComplaint ? t('type_user_complaint') : t('type_support')}
        </MantineBadge>,
      ),
    },
    ...(isComplaint && ticket.complaint_type
      ? [{
          label: t('complaint_type_label'),
          value: badgeCell(
            <MantineBadge variant="tone" tone="neutral">
              {t(`complaint_type_${ticket.complaint_type}` as 'complaint_type_other')}
            </MantineBadge>,
          ),
        }]
      : []),
    {
      label: t('col_status'),
      value: badgeCell(
        <MantineBadge variant="status" entity="ticket" value={ticket.status}>
          {statusLabel(ticket.status)}
        </MantineBadge>,
      ),
    },
    { label: t('col_created'), value: formatDate(ticket.created_at, locale) },
  ]

  const navRow = (key: string, user: SupportTicketRow['reporter'], label: string): MantineNavRow[] =>
    user
      ? [{
          key,
          icon: <UserIcon size={iconSize} aria-hidden="true" />,
          label,
          description: userName(user),
          href: `/admin/users/${user.id}`,
        }]
      : []
  const navRows: MantineNavRow[] = [
    ...navRow('reporter', ticket.reporter, isComplaint ? t('nav_open_reporter') : t('nav_open_requester')),
    ...(isComplaint ? navRow('reported', ticket.reported, t('nav_open_reported')) : []),
    ...navRow('created_by', ticket.created_by_admin, t('nav_open_created_by')),
  ]

  const footer = (
    <MantineDialogFooter
      secondary={
        <Button type="button" variant="default" onClick={onClose}>
          {t('cancel_btn')}
        </Button>
      }
      primary={
        <Button type="button" loading={updating} disabled={updating || newStatus === ticket.status} onClick={onUpdate}>
          {t('update_status_btn')}
        </Button>
      }
    />
  )

  return (
    <MantineModal
      opened
      onClose={onClose}
      structured
      size="lg"
      title={ticket.subject}
      description={isComplaint ? t('type_user_complaint') : t('type_support')}
      footer={footer}
    >
      <MantineDialogSections>
        <MantineDialogSection title={t('details_section')}>
          <MantineDetailList items={facts} />
        </MantineDialogSection>

        {ticket.reason && (
          <MantineDialogSection title={t('reason_section')}>
            <Text size="sm">{ticket.reason}</Text>
          </MantineDialogSection>
        )}

        <MantineDialogSection title={t('status_change_label')}>
          <MantineRadioCardGroup value={newStatus} onChange={value => onNewStatusChange(value as TicketStatus)}>
            {SUPPORT_TICKET_STATUSES.map(s => (
              <MantineRadioCardOption key={s} value={s} label={statusLabel(s)} disabled={updating} />
            ))}
          </MantineRadioCardGroup>
          <Textarea
            value={note}
            onChange={e => onNoteChange(e.currentTarget.value)}
            placeholder={t('note_placeholder')}
            aria-label={t('note_placeholder')}
            autosize
            minRows={2}
          />
        </MantineDialogSection>

        {events.length > 0 && (
          <MantineDialogSection title={t('timeline_title')}>
            <Stack gap="sm">
              {events.map(ev => (
                <Group key={ev.id} align="flex-start" wrap="nowrap" gap="sm">
                  <Box c="dimmed" pt="tight">
                    <ClockCircleIcon size={theme.other.iconSize.compact} aria-hidden="true" />
                  </Box>
                  <Stack gap="tight" miw={0} flex={1}>
                    <Group gap="xs" wrap="wrap">
                      <Text size="xs" fw={500}>{ev.actor?.name ?? ev.actor_role ?? '—'}</Text>
                      {ev.event_type === 'status_changed' && ev.old_status && ev.new_status && (
                        <Text size="xs" c="dimmed">
                          {statusLabel(ev.old_status)} → {statusLabel(ev.new_status)}
                        </Text>
                      )}
                      {ev.event_type === 'created' && <Text size="xs" c="dimmed">{t('event_created')}</Text>}
                      <Text size="xs" c="dimmed">{formatDate(ev.created_at, locale)}</Text>
                    </Group>
                    {ev.note && <Text size="xs" c="dimmed">{ev.note}</Text>}
                  </Stack>
                </Group>
              ))}
            </Stack>
          </MantineDialogSection>
        )}

        {navRows.length > 0 && (
          <MantineDialogSection>
            <MantineNavRowList items={navRows} />
          </MantineDialogSection>
        )}
      </MantineDialogSections>
    </MantineModal>
  )
}
