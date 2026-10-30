'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { X } from 'lucide-react'
import { ActionIcon, Divider, Group, Modal, Stack, Box, Text, ThemeIcon, useMantineTheme } from '@mantine/core'
import { useResponsiveDropdown, ResponsiveBottomSheet, SheetContent } from './responsiveBottomSheet'

export interface MantineModalProps {
  /** Controlled open state */
  opened: boolean
  /** Close handler — fired by backdrop tap, Esc, and the close affordance */
  onClose: () => void
  /** Heading (below the drag handle on mobile; Modal title on desktop) */
  title?: ReactNode
  /** Body content (arbitrary) */
  children: ReactNode
  /** Optional actions region rendered below the body (caller composes buttons) */
  footer?: ReactNode
  /** Desktop centered-Modal size (Mantine size token); default 'md'. Ignored <640. */
  size?: string
  /**
   * Opts into the canonical dialog anatomy (Task 857 R44, docs §23.7): a header with an optional icon tile, the title
   * and a muted description, a round 44px close button (desktop, ActionIcon size `xl` — TailAdmin /modals, D78-22), full-bleed dividers under the header and above the
   * footer, and no extra gap between body and footer (the body's sections own their spacing). Task 915 moves every
   * other consumer onto it, then makes it the default and deletes this prop.
   */
  structured?: boolean
  /** Muted line under the title (structured only). */
  description?: ReactNode
  /** Icon shown in a light tile before the title (structured only). */
  icon?: ReactNode
  /**
   * Another dialog (a delete confirmation) is open above this one (Task 859 Revision 3, R36): this dialog is hidden
   * from assistive technology and inert while it is covered, as WAI-ARIA requires of what lies under a modal.
   * Structured only.
   */
  covered?: boolean
}

interface DialogHeadingProps {
  icon?: ReactNode
  title?: ReactNode
  description?: ReactNode
  /** Desktop wraps the title in `Modal.Title` (it labels the dialog); the sheet's own title element does that below 640. */
  asModalTitle?: boolean
}

/** Icon tile + title + description of a structured dialog (§23.7 "Header"), shared by the modal and the sheet. */
function DialogHeading({ icon, title, description, asModalTitle }: DialogHeadingProps) {
  const titleText = (
    <Text component="span" fz="lg" fw={600}>
      {title}
    </Text>
  )
  return (
    <Group wrap="nowrap" align="flex-start" gap="md" flex={1} miw={0}>
      {icon && <ThemeIcon variant="light" size="xl" radius="md">{icon}</ThemeIcon>}
      <Stack gap="tight" flex={1} miw={0}>
        {asModalTitle ? <Modal.Title>{titleText}</Modal.Title> : titleText}
        {description && <Text fz="sm" c="dimmed">{description}</Text>}
      </Stack>
    </Group>
  )
}

/**
 * Footer of a structured dialog (desktop): a full-width divider, then the actions. It is a direct child of the modal
 * content, a sibling of the header and the body and outside the scroll region (the theme `Modal` entry makes the
 * content a clipping flex column and the body the only scroller, R51), so a scrollbar never reaches it or the 24px
 * corners and its actions are always visible.
 */
function StructuredFooter({ children }: { children: ReactNode }) {
  return (
    <Box flex="none">
      <Divider />
      <Box px="var(--mb-padding, var(--mantine-spacing-md))" py="md">{children}</Box>
    </Box>
  )
}

function StructuredModal({ opened, onClose, title, description, icon, children, footer, size, covered, isMobile }: MantineModalProps & { isMobile: boolean }) {
  const tc = useTranslations('common')
  const theme = useMantineTheme()

  if (isMobile) {
    return (
      <ResponsiveBottomSheet
        opened={opened}
        onClose={onClose}
        header={<DialogHeading icon={icon} title={title} description={description} />}
        footer={footer}
        covered={covered}
      >
        <SheetContent>{children}</SheetContent>
      </ResponsiveBottomSheet>
    )
  }

  return (
    <Modal.Root opened={opened} onClose={onClose} centered size={size} {...(covered && { 'aria-hidden': true, inert: true })}>
      <Modal.Overlay />
      <Modal.Content>
        {/* The header, the body (the only scroll region) and the footer are siblings: only the body scrolls (R51). */}
        <Modal.Header p={0}>
          <Stack gap={0} w="100%">
            <Group justify="space-between" align="flex-start" wrap="nowrap" gap="md" p="var(--mb-padding, var(--mantine-spacing-md))">
              <DialogHeading icon={icon} title={title} description={description} asModalTitle />
              <ActionIcon variant="light" color="gray" radius="pill" size="xl" aria-label={tc('close')} onClick={onClose}>
                <X size={theme.other.iconSize.standard} />
              </ActionIcon>
            </Group>
            <Divider />
          </Stack>
        </Modal.Header>
        <Modal.Body pb={footer ? 0 : undefined}>
          <Box>{children}</Box>
        </Modal.Body>
        {footer && <StructuredFooter>{footer}</StructuredFooter>}
      </Modal.Content>
    </Modal.Root>
  )
}

/**
 * Focus goes back to what had it when the dialog opened, also when the dialog is UNMOUNTED instead of closed (a consumer that renders
 * `{target && <XDialog opened />}`): Mantine returns the focus only on the `opened` true -> false transition, so an unmounted dialog left
 * it on `body` (WCAG 2.4.3; the census `dismiss-*` focus-return rule, Task 923 R33). Focus the person has moved elsewhere is left alone.
 */
function useRestoreFocusOnClose(opened: boolean) {
  useEffect(() => {
    if (!opened || typeof document === 'undefined') return
    const opener = document.activeElement
    return () => {
      if (!(opener instanceof HTMLElement) || opener === document.body || !opener.isConnected) return
      const active = document.activeElement
      if (!active || active === document.body || active.closest('[data-portal]')) opener.focus()
    }
  }, [opened])
}

/**
 * The dialog body, with the one rule that an open dialog holds the focus. Mantine's focus trap moves it to the first control; when every control
 * is disabled (an upload in progress) there is none, the focus stays on what opened the dialog and Tab leaves the dialog. Shortly after opening,
 * the dialog element itself (focusable: `tabindex="-1"`) takes the focus if it is not inside, unless the dialog is inert (covered by another one).
 * WAI-ARIA dialog pattern; Task 923 R33, Story 244.
 */
function DialogBody({ opened, children }: { opened: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!opened) return
    const timer = window.setTimeout(() => {
      const dialog = ref.current?.closest<HTMLElement>('[role="dialog"]')
      if (dialog && !dialog.closest('[inert]') && !dialog.contains(document.activeElement)) dialog.focus({ preventScroll: true })
    }, 250)
    return () => window.clearTimeout(timer)
  }, [opened])
  return <div ref={ref}>{children}</div>
}

/**
 * Canonical P0-compliant responsive Modal.
 *
 * ONE component — no "plain Modal vs bottom-sheet Modal" choice.
 * Centered Mantine Modal at ≥640px; full-width bottom sheet at <640px.
 * Consumes the Task 514 single-source foundation (useResponsiveDropdown +
 * ResponsiveBottomSheet from ./responsiveBottomSheet) — same source as
 * MantineSelect/MantinePopover/MantineDropdownMenu/MantineNavigationMenu;
 * no copy-pasted DragHandle or Drawer block.
 *
 * Unlike MantinePopover/MantineDropdownMenu (uncontrolled trigger-wrapping
 * overlays), MantineModal is fully controlled — the caller owns `opened`/
 * `onClose` and supplies its own trigger; this component only renders the
 * overlay content.
 *
 * Desktop (≥640px): centered Mantine `Modal` (`centered`, configurable `size`,
 * radius from theme.components.Modal default; do NOT pass a hardcoded `radius`
 * prop here, it would shadow the theme default) with `title`, the body
 * (`<Box>{children}</Box>`) and, when given, the `footer`. Task 859 R51: the
 * header, the body and the footer are siblings inside the modal content; the
 * theme `Modal` entry makes the content a clipping flex column and the body the
 * ONLY scroll region, so a scrollbar never touches the header, the footer or a
 * rounded corner (the same split the bottom sheet uses). Standard
 * X/backdrop/Esc close; focus returns to the opener (Mantine default `returnFocus`).
 *
 * Mobile (<640px): the shared `ResponsiveBottomSheet` — edge-to-edge,
 * top-only radius, centered DragHandle, ≤90dvh internal scroll. Inside
 * `SheetContent` (Task 520 — the sheet's `body` is `padding:0` by design so
 * row-based consumers can render edge-to-edge tap rows; an arbitrary-content
 * consumer like this one must supply its own 16px gutter), the same
 * `<Box>{children}</Box>` body as the desktop path. Task 859 R60: the `footer`
 * is the sheet's pinned `footer` slot (a non-scrolling flex sibling under a
 * divider), never inside the scrolled body, as in the structured path. The
 * primitive does not impose a stacked/row footer INTERNAL layout (that is
 * caller composition, e.g. the story's
 * `Flex direction={{ base: 'column-reverse', sm: 'row' }}` footer).
 * Backdrop tap + Esc close (foundation default), focus returns to the opener.
 *
 * SSR/hydration: isMobile=false on first render (Mantine v8
 * getInitialValueInEffect=true). On SSR and initial client render the
 * desktop Modal path is used. After hydration, useMediaQuery resolves and
 * the mobile path mounts. The overlay is controlled and closed by the
 * caller on first paint, so no flash occurs. Same documented caveat as
 * MantinePopover/MantineDropdownMenu/MantineNavigationMenu.
 */
export function MantineModal({
  opened,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  structured = false,
  description,
  icon,
  covered,
}: MantineModalProps) {
  const { isMobile } = useResponsiveDropdown()
  useRestoreFocusOnClose(opened)
  const body = <DialogBody opened={opened}>{children}</DialogBody>

  if (structured) {
    return (
      <StructuredModal
        opened={opened}
        onClose={onClose}
        title={title}
        description={description}
        icon={icon}
        footer={footer}
        size={size}
        covered={covered}
        isMobile={isMobile}
      >
        {body}
      </StructuredModal>
    )
  }

  if (isMobile) {
    // Task 859 Revision 8 (R60, owner "all dialogs"): the footer goes to the sheet's pinned `footer` slot, as the
    // structured path does, so it never scrolls away with a long body.
    return (
      <ResponsiveBottomSheet opened={opened} onClose={onClose} title={title} footer={footer}>
        <SheetContent>
          <Box>{body}</Box>
        </SheetContent>
      </ResponsiveBottomSheet>
    )
  }

  return (
    <Modal.Root opened={opened} onClose={onClose} centered size={size}>
      <Modal.Overlay />
      <Modal.Content>
        <Modal.Header>
          {title && <Modal.Title>{title}</Modal.Title>}
          <Modal.CloseButton />
        </Modal.Header>
        <Modal.Body>
          <Box>{body}</Box>
        </Modal.Body>
        {/* The footer is outside the scroll region (R51): it never scrolls behind the body. */}
        {footer && (
          <Box flex="none" px="var(--mb-padding, var(--mantine-spacing-md))" pb="md">
            {footer}
          </Box>
        )}
      </Modal.Content>
    </Modal.Root>
  )
}
