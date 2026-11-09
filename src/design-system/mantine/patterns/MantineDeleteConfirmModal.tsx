'use client'

import { useState, type ReactNode } from 'react'
import { useResetOnChange } from '@/hooks/useStateFromProp'
import { Box, Button, PasswordInput, Stack, Text, TextInput } from '@mantine/core'
import { MantineModal } from './MantineModal'
import { MantineDialogSection, MantineDialogSections } from './MantineDialogSections'
import { MantineDialogFooter } from './MantineDialogFooter'

/** The word a person types to confirm an account deletion: every locale already asks for it (Task 923 R46, owner decision D34). */
export const DELETE_CONFIRM_WORD = 'DELETE'

export interface MantineDeleteConfirmModalProps {
  opened: boolean
  /** Fired by the close button, Esc, the backdrop and Cancel. */
  onClose: () => void
  /** States the object being deleted ("Delete currency EUR?"). */
  title: ReactNode
  /** States the consequence ("The currency is removed from every price"). A string is set as 14px text. */
  message: ReactNode
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  /** The confirm action is running: the primary shows its loader and both buttons are disabled. */
  loading?: boolean
  /** The confirm action is unavailable until the dialog's own fields are valid (a required reason). */
  confirmDisabled?: boolean
  /** `data-testid` of the red primary and of the message section, for the consumers whose tests address them. */
  confirmTestId?: string
  bodyTestId?: string
  /**
   * A typed confirmation (Task 923 R46): one more dialog section, after every other section, holds a labelled field. The red primary stays disabled
   * until the typed text, trimmed and in upper case, equals `word`. The field is empty each time the dialog opens and takes the focus.
   */
  typedConfirm?: { word: string; label: string }
  /**
   * Re-authentication instead of a typed word (Task 923 R80, owner decision D54): one more dialog section, after every other section, holds a masked password field.
   * The red primary stays disabled while it is empty. The value belongs to the consumer (its action needs it, and it empties the value each time the dialog opens);
   * `error` is the field's own message (a wrong password). The field takes the focus when the dialog opens.
   */
  passwordConfirm?: { label: string; value: string; onChange: (value: string) => void; error?: ReactNode; showLabel: string; hideLabel: string }
  /**
   * An account with no password proves who the person is with a new Google sign-in (Task 923 R80, Task 927): one more dialog section, before the password or typed field, says why
   * and renders the consumer's `control` (Google's own button, `GoogleSignInButton`) full width under it. The red primary is not affected: the consumer shows this section when
   * the server asks for the sign-in.
   */
  googleConfirm?: { message: ReactNode; control: ReactNode }
  /** Further `MantineDialogSection`s after the message (a reason field, a list of consequences). */
  children?: ReactNode
}

/**
 * The one confirmation step of a destructive action (Task 859 Revision 2, R28, owner decision D78-18). It is a
 * structured `MantineModal` (bottom sheet below 640) with a section that states the consequence, and a
 * `MantineDialogFooter` pair: Cancel on the left (secondary) and the red destructive primary on the right, which
 * shows `loading` while the action runs. A dialog's resting destructive action is subtle red; pressing it opens this
 * modal, and only the primary here runs the action. With `typedConfirm` the primary also waits for the typed word; with `passwordConfirm` (Task 923 R80) it waits for
 * the password instead, and `googleConfirm` adds the way for an account with no password.
 */
export function MantineDeleteConfirmModal({
  opened,
  onClose,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  loading = false,
  confirmDisabled = false,
  confirmTestId,
  bodyTestId,
  typedConfirm,
  passwordConfirm,
  googleConfirm,
  children,
}: MantineDeleteConfirmModalProps) {
  const [typed, setTyped] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)
  // The field starts empty every time the dialog opens: a word typed before a cancel never carries over (Task 923 R46); a password is never left visible either.
  useResetOnChange(opened, () => {
    if (opened) {
      setTyped('')
      setPasswordVisible(false)
    }
  })
  const typedOk = !typedConfirm || typed.trim().toUpperCase() === typedConfirm.word.toUpperCase()
  const passwordOk = !passwordConfirm || passwordConfirm.value !== ''

  return (
    <MantineModal
      structured
      opened={opened}
      onClose={onClose}
      title={title}
      footer={
        <MantineDialogFooter
          secondary={<Button type="button" variant="default" disabled={loading} onClick={onClose}>{cancelLabel}</Button>}
          primary={
            <Button type="button" color="red" loading={loading} disabled={confirmDisabled || !typedOk || !passwordOk} onClick={onConfirm} data-testid={confirmTestId}>
              {confirmLabel}
            </Button>
          }
        />
      }
    >
      <MantineDialogSections>
        <MantineDialogSection>
          <Box data-testid={bodyTestId}>{typeof message === 'string' ? <Text fz="sm">{message}</Text> : message}</Box>
        </MantineDialogSection>
        {children}
        {googleConfirm && (
          <MantineDialogSection>
            <Stack gap="sm">
              <Text fz="sm">{googleConfirm.message}</Text>
              {googleConfirm.control}
            </Stack>
          </MantineDialogSection>
        )}
        {typedConfirm && (
          <MantineDialogSection>
            <TextInput
              label={typedConfirm.label}
              placeholder={typedConfirm.word}
              autoComplete="off"
              data-autofocus
              value={typed}
              disabled={loading}
              onChange={event => setTyped(event.currentTarget.value)}
            />
          </MantineDialogSection>
        )}
        {passwordConfirm && (
          <MantineDialogSection>
            <PasswordInput
              label={passwordConfirm.label}
              autoComplete="current-password"
              data-autofocus
              value={passwordConfirm.value}
              disabled={loading}
              error={passwordConfirm.error}
              visible={passwordVisible}
              onVisibilityChange={setPasswordVisible}
              visibilityToggleButtonProps={{ 'aria-label': passwordVisible ? passwordConfirm.hideLabel : passwordConfirm.showLabel }}
              onChange={event => passwordConfirm.onChange(event.currentTarget.value)}
            />
          </MantineDialogSection>
        )}
      </MantineDialogSections>
    </MantineModal>
  )
}
