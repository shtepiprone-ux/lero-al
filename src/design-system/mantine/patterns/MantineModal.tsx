'use client'

import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { X } from 'lucide-react'
import { ActionIcon, Divider, Group, Modal, Stack, Box, Text, ThemeIcon, useMantineTheme } from '@mantine/core'
import { useResponsiveDropdown, ResponsiveBottomSheet, SheetContent } from './responsiveBottomSheet'
import { DIALOG_BLEED } from './MantineDialogSections'

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
   * and a muted description, a round close button (desktop), full-bleed dividers under the header and above the
   * footer, and no extra gap between body and footer (the body's sections own their spacing). Task 915 moves every
   * other consumer onto it, then makes it the default and deletes this prop.
   */
  structured?: boolean
  /** Muted line under the title (structured only). */
  description?: ReactNode
  /** Icon shown in a light tile before the title (structured only). */
  icon?: ReactNode
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
    <Text component="span" fz="lg" fw={600} lineClamp={2}>
      {title}
    </Text>
  )
  return (
    <Group wrap="nowrap" align="flex-start" gap="md" flex={1} miw={0}>
      {icon && <ThemeIcon variant="light" size="xl" radius="md">{icon}</ThemeIcon>}
      <Stack gap="tight" flex={1} miw={0}>
        {asModalTitle ? <Modal.Title>{titleText}</Modal.Title> : titleText}
        {description && <Text fz="sm" c="dimmed" lineClamp={2}>{description}</Text>}
      </Stack>
    </Group>
  )
}

interface StructuredBodyProps {
  children: ReactNode
  footer?: ReactNode
}

/**
 * Body of a structured dialog (desktop): the content, then the footer. The footer is pinned to the bottom edge of the
 * scrolling modal (sticky, like the header), with a full-bleed divider above it, so its actions are always visible.
 */
function StructuredBody({ children, footer }: StructuredBodyProps) {
  return (
    <>
      <Box>{children}</Box>
      {footer && (
        <Box pos="sticky" bottom={0} bg="var(--mantine-color-body)" mx={DIALOG_BLEED} px="var(--mb-padding, var(--mantine-spacing-md))">
          <Divider mx={DIALOG_BLEED} />
          <Box py="md">{footer}</Box>
        </Box>
      )}
    </>
  )
}

function StructuredModal({ opened, onClose, title, description, icon, children, footer, size, isMobile }: MantineModalProps & { isMobile: boolean }) {
  const tc = useTranslations('common')
  const theme = useMantineTheme()

  if (isMobile) {
    return (
      <ResponsiveBottomSheet
        opened={opened}
        onClose={onClose}
        header={<DialogHeading icon={icon} title={title} description={description} />}
        footer={footer}
      >
        <SheetContent>{children}</SheetContent>
      </ResponsiveBottomSheet>
    )
  }

  return (
    <Modal.Root opened={opened} onClose={onClose} centered size={size}>
      <Modal.Overlay />
      <Modal.Content>
        {/* The header is sticky (Mantine's own); its divider lives inside it so it stays pinned too. */}
        <Modal.Header p={0}>
          <Stack gap={0} w="100%">
            <Group justify="space-between" align="flex-start" wrap="nowrap" gap="md" p="var(--mb-padding, var(--mantine-spacing-md))">
              <DialogHeading icon={icon} title={title} description={description} asModalTitle />
              <ActionIcon variant="light" color="gray" radius="pill" size="input-sm" aria-label={tc('close')} onClick={onClose}>
                <X size={theme.other.iconSize.standard} />
              </ActionIcon>
            </Group>
            <Divider />
          </Stack>
        </Modal.Header>
        <Modal.Body pb={footer ? 0 : undefined}>
          <StructuredBody footer={footer}>{children}</StructuredBody>
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  )
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
 * radius from theme.components.Modal default — 8px, §6l — Task 527 fix #11;
 * do NOT pass a hardcoded `radius` prop here, it would shadow the theme default)
 * with `title`, then a `<Stack gap="md">` (Task 521 —
 * matches the `MantineDialogDrawerPattern` body/actions rhythm) containing
 * exactly two slots: `<Box>{children}</Box>` and `footer`. `children` is
 * wrapped in a `Box` so a multi-element `children` (e.g. an array of several
 * `Text` paragraphs) collapses into ONE Stack item — Stack's `gap` is a CSS
 * row-gap applied BETWEEN its direct children, so without this wrapper a
 * multi-paragraph `children` would get the 16px gap inserted between every
 * paragraph too, not just once between body and footer. `footer=undefined`
 * renders no second Stack item, so no phantom gap. Standard X/backdrop/Esc
 * close; focus returns to the opener (Mantine default `returnFocus`).
 *
 * Mobile (<640px): the shared `ResponsiveBottomSheet` — edge-to-edge,
 * top-only radius, centered DragHandle, ≤90dvh internal scroll. Inside
 * `SheetContent` (Task 520 — the sheet's `body` is `padding:0` by design so
 * row-based consumers can render edge-to-edge tap rows; an arbitrary-content
 * consumer like this one must supply its own 16px gutter), the same
 * `<Stack gap="md">` + `<Box>{children}</Box>` + `footer` composition (Task
 * 521) as the desktop path — one 16px vertical gap between body and footer,
 * never between individual body paragraphs. The primitive does not impose a
 * stacked/row footer INTERNAL layout (that is caller composition, e.g. the
 * story's `Flex direction={{ base: 'column-reverse', sm: 'row' }}` footer).
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
}: MantineModalProps) {
  const { isMobile } = useResponsiveDropdown()

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
        isMobile={isMobile}
      >
        {children}
      </StructuredModal>
    )
  }

  if (isMobile) {
    return (
      <ResponsiveBottomSheet opened={opened} onClose={onClose} title={title}>
        <SheetContent>
          <Stack gap="md">
            <Box>{children}</Box>
            {footer}
          </Stack>
        </SheetContent>
      </ResponsiveBottomSheet>
    )
  }

  return (
    <Modal opened={opened} onClose={onClose} title={title} centered size={size}>
      <Stack gap="md">
        <Box>{children}</Box>
        {footer}
      </Stack>
    </Modal>
  )
}
