'use client'

import { Modal, Drawer, Button, Text, Stack, Group, Box, useMantineTheme } from '@mantine/core'
import { useDisclosure, useMediaQuery } from '@mantine/hooks'

export interface MantineDialogDrawerPatternProps {
  triggerLabel: string
  title: string
  body: string
  confirmLabel: string
  cancelLabel: string
  onConfirm?: () => void
}

/**
 * Canonical dialog/drawer responsive pattern.
 *
 * Mobile (<sm / 40em / 640px): renders as a P0-compliant bottom Drawer:
 *   - position="bottom", edge-to-edge (inner padding 0)
 *   - top-only rounded corners (radius lg on top, 0 on bottom)
 *   - visible drag handle at top
 *   - internal scroll region (overflowY: auto on body)
 *   - max-height ≤90dvh enforced via styles.content
 *   - no horizontal overflow
 *   - actions stacked full-width (canonical default size — 14px text, 44px min-height, P0 compliant)
 *   - closes on backdrop tap (closeOnClickOutside default) + Esc key
 *
 * Desktop (sm+ / 640px+): renders as a centered Modal dialog.
 *   - actions in a row (Group justify="flex-end")
 *
 * Trigger button: full-width on mobile (w={{ base:'100%', sm:'auto' }}),
 *   auto-width on tablet/desktop.
 *
 * SSR/hydration caveat: useMediaQuery returns `false` on first render
 * (getInitialValueInEffect defaults to true in Mantine v8 — query is only
 * evaluated inside useEffect, after hydration). The overlay is always closed
 * on SSR so no visible flash occurs, but the trigger renders auto-width server-side
 * and becomes full-width after hydration on mobile. This is acceptable for
 * an interactive trigger that only appears when JS is active.
 */
export function MantineDialogDrawerPattern({
  triggerLabel,
  title,
  body,
  confirmLabel,
  cancelLabel,
  onConfirm,
}: MantineDialogDrawerPatternProps) {
  const theme = useMantineTheme()
  const [opened, { open, close }] = useDisclosure(false)
  // SSR caveat: false until hydrated (see component comment above)
  const isMobile = useMediaQuery(`(max-width: ${theme.other.mobileGate})`)

  const handleConfirm = () => {
    onConfirm?.()
    close()
  }

  return (
    <>
      {/* Trigger: full-width on mobile, auto-width on sm+ */}
      <Button
        onClick={open}
        color="brand"
        w={{ base: '100%', sm: 'auto' }}
      >
        {triggerLabel}
      </Button>

      {isMobile ? (
        // P0 bottom-sheet: edge-to-edge, top-only corners, ≤90dvh, internal scroll
        <Drawer
          opened={opened}
          onClose={close}
          position="bottom"
          withCloseButton={false}
          size="auto"
          title={
            <Box>
              {/* Task 784 Revision 3 (D69-18): the decorative pill bar is restored via the typed,
                  provenance-cited theme.other.overlay.dragHandle contract (Revision 2's outright
                  removal is superseded — D69-16 is superseded). Matches the canonical DragHandle
                  definition in responsiveBottomSheet.tsx — same theme contract, same rendered
                  geometry, kept as a separate render path per this component's own existing
                  structure (no de-duplication refactor in this task's scope). */}
              <Box
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  paddingBottom: 'var(--mantine-spacing-xs)',
                }}
              >
                <Box
                  style={{
                    width: theme.other.overlay.dragHandle.width,
                    height: theme.other.overlay.dragHandle.height,
                    borderRadius: 'var(--mantine-radius-pill)',
                    backgroundColor: 'var(--mantine-color-gray-3)',
                  }}
                />
              </Box>
              <Text fw={600} size="lg">{title}</Text>
            </Box>
          }
          styles={{
            content: {
              borderRadius: 'var(--mantine-radius-lg) var(--mantine-radius-lg) 0 0',
              maxHeight: '90dvh',
              display: 'flex',
              flexDirection: 'column',
            },
            header: { paddingBottom: 0 },
            body: { flex: 1, overflowY: 'auto' },
            inner: { padding: 0 },
          }}
        >
          <Stack gap="md">
            <Text size="sm">{body}</Text>
            {/* Actions: stacked full-width on mobile (canonical default size, 44px min-height, P0 compliant) */}
            <Stack gap="sm">
              <Button
                variant="filled"
                color="brand"
                fullWidth
                onClick={handleConfirm}
              >
                {confirmLabel}
              </Button>
              <Button
                variant="outline"
                color="gray"
                fullWidth
                onClick={close}
              >
                {cancelLabel}
              </Button>
            </Stack>
          </Stack>
        </Drawer>
      ) : (
        // Desktop: centered Modal with row actions
        <Modal
          opened={opened}
          onClose={close}
          title={title}
          centered
          radius="md"
        >
          <Text size="sm" mb="md">{body}</Text>
          {/* Actions: row on desktop (auto-width, right-aligned) */}
          <Group gap="sm" justify="flex-end">
            <Button variant="outline" color="gray" onClick={close}>
              {cancelLabel}
            </Button>
            <Button color="brand" onClick={handleConfirm}>
              {confirmLabel}
            </Button>
          </Group>
        </Modal>
      )}
    </>
  )
}
