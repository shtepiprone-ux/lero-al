'use client'

import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Button, TextInput, Textarea } from '@mantine/core'
import { MantineModal } from '@/design-system/mantine/patterns'
import { MantineDialogFooter } from '@/design-system/mantine/patterns/MantineDialogFooter'
import { MantineDialogSection, MantineDialogSections } from '@/design-system/mantine/patterns/MantineDialogSections'

export interface ListingInquiryDialogViewProps {
  opened: boolean
  name: string
  email: string
  message: string
  onNameChange: (value: string) => void
  onEmailChange: (value: string) => void
  onMessageChange: (value: string) => void
  /** The container's rule: a name, a plain e-mail and a message of 20 or more characters. */
  canSubmit: boolean
  /** The request is running: Send shows its loader and Cancel is disabled. */
  pending: boolean
  /** Task 923 R113 — the human check (app: the interaction-only `CaptchaWidget`), a positioned node rendered as the last child of the one dialog section, after
   * the message field, so it keeps the section's `sm` rhythm. It owns its own visibility: the app's widget takes no space until Cloudflare asks for interaction. */
  humanCheck?: ReactNode
  onSubmit: () => void
  onClose: () => void
}

/**
 * Presentational View of the listing contact card's message dialog (Task 923 R41, owner decision D19): a structured `MantineModal`
 * (a bottom sheet below 640px) with one dialog section of three fields and the optional human check (the section owns the `sm` rhythm between them) and a
 * `MantineDialogFooter` pair, Cancel on the left and Send on the right. No state, no validation, no server action: `ListingInquiryDialog`
 * owns them.
 */
export function ListingInquiryDialogView({
  opened,
  name,
  email,
  message,
  onNameChange,
  onEmailChange,
  onMessageChange,
  canSubmit,
  pending,
  humanCheck,
  onSubmit,
  onClose,
}: ListingInquiryDialogViewProps) {
  const t = useTranslations('listing')
  const tc = useTranslations('common')

  const footer = (
    <MantineDialogFooter
      secondary={
        <Button type="button" variant="default" disabled={pending} onClick={onClose}>
          {tc('cancel')}
        </Button>
      }
      primary={
        <Button type="button" loading={pending} disabled={!canSubmit} onClick={onSubmit}>
          {t('inquiry_submit')}
        </Button>
      }
    />
  )

  return (
    <MantineModal opened={opened} onClose={onClose} structured size="md" title={t('inquiry_dialog_title')} footer={footer}>
      <MantineDialogSections>
        <MantineDialogSection>
          <TextInput
            label={t('inquiry_name_label')}
            placeholder={t('inquiry_name_placeholder')}
            value={name}
            maxLength={200}
            onChange={e => onNameChange(e.currentTarget.value)}
          />
          <TextInput
            label={t('inquiry_email_label')}
            placeholder={t('inquiry_email_placeholder')}
            type="email"
            inputMode="email"
            value={email}
            maxLength={200}
            onChange={e => onEmailChange(e.currentTarget.value)}
          />
          <Textarea
            label={t('inquiry_message_label')}
            placeholder={t('inquiry_message_placeholder')}
            autosize
            minRows={5}
            value={message}
            maxLength={5000}
            onChange={e => onMessageChange(e.currentTarget.value)}
          />
          {humanCheck}
        </MantineDialogSection>
      </MantineDialogSections>
    </MantineModal>
  )
}
