'use client'

import type { ReactNode } from 'react'
import { Fragment } from 'react'
import { Menu, Box, Stack, Group, Text, UnstyledButton, Divider, useMantineTheme } from '@mantine/core'
import { useResponsiveDropdown, ResponsiveBottomSheet } from './responsiveBottomSheet'

export interface DropdownMenuItemDef {
  label: ReactNode
  onClick?: () => void
  /** Leading icon — optional */
  icon?: ReactNode
  /** Mantine color key (e.g. 'red' for destructive). Applied to icon and label text. */
  color?: string
  disabled?: boolean
  /** Render a Divider/separator BEFORE this item */
  separator?: boolean
}

export interface MantineDropdownMenuProps {
  /** Trigger element — activates the menu on click */
  trigger: ReactNode
  /** Menu items — rendered as Menu.Items (≥640) or tappable ≥44px rows (<640) */
  items: DropdownMenuItemDef[]
  /** Disable the trigger entirely — no menu/sheet on either path */
  disabled?: boolean
  /** Optional sheet title shown in the bottom-sheet header (mobile only) */
  title?: ReactNode
  /**
   * Icon-only trigger exemption (clause 11). Set true for ⋮ kebab / icon-only triggers
   * to keep them compact at <640. Default false = text trigger = full-width at <640.
   */
  iconOnlyTrigger?: boolean
}

/**
 * Canonical P0-compliant responsive DropdownMenu.
 *
 * ONE component — no "plain Menu vs bottom-sheet Menu" choice.
 * Anchored Mantine Menu at ≥640px; full-width bottom sheet at <640px.
 * Consumes the Task 514 single-source foundation (useResponsiveDropdown +
 * ResponsiveBottomSheet from ./responsiveBottomSheet) — same source as
 * MantineSelect and MantinePopover; no DragHandle copy, no Drawer block copy.
 *
 * Desktop (≥640px): uncontrolled Mantine Menu anchored to trigger. Menu.Items
 * with optional icon, color (destructive via 'red'), disabled, separator.
 *
 * Mobile (<640px): the trigger is wrapped in an inline-block span that captures
 * the click (bubbled from the trigger button) → openDrawer(). Items rendered as
 * ≥44px UnstyledButton rows inside ResponsiveBottomSheet. Tapping an item fires
 * its onClick and closes the sheet. Backdrop tap + Esc close without action.
 *
 * Same span-onClick mechanism as MantinePopover (avoids Mantine v8 controlled-mode
 * onChange quirk). Desktop uses uncontrolled Menu (no opened prop).
 *
 * API: items array (label + onClick + icon? + color? + disabled? + separator?).
 * Both paths render from the same items source — no duplication.
 *
 * SSR/hydration: isMobile=false on first render (Mantine v8 getInitialValueInEffect=true).
 * Desktop Menu path on SSR + initial client render; mobile path mounts after hydration.
 * No flash — same documented caveat as MantineDialogDrawerPattern and MantineSelect.
 */
export function MantineDropdownMenu({
  trigger,
  items,
  disabled = false,
  title,
  iconOnlyTrigger = false,
}: MantineDropdownMenuProps) {
  const theme = useMantineTheme()
  const { isMobile, drawerOpened, openDrawer, closeDrawer } = useResponsiveDropdown()

  return (
    <>
      {isMobile ? (
        /* Mobile: click is captured on the wrapper and delegates to openDrawer().
           Text trigger (default): flex column container so the trigger fills full width
           via align-items:stretch without needing to clone/patch the ReactNode.
           Icon-only exemption (iconOnlyTrigger=true): inline-block keeps it compact. */
        <Box
          component={iconOnlyTrigger ? 'span' : 'div'}
          style={iconOnlyTrigger
            ? { display: 'inline-block' }
            : { display: 'flex', flexDirection: 'column' }
          }
          onClick={() => { if (!disabled) openDrawer() }}
        >
          {trigger}
        </Box>
      ) : (
        /* Desktop: alignSelf:flex-start prevents a Stack align="stretch" parent from
           over-stretching the trigger — trigger renders at natural content width. */
        <Box style={{ alignSelf: 'flex-start' }}>
          <Menu disabled={disabled}>
            <Menu.Target>{trigger}</Menu.Target>
            <Menu.Dropdown>
              {items.map((item, i) => (
                <Fragment key={i}>
                  {item.separator && <Menu.Divider />}
                  <Menu.Item
                    leftSection={item.icon}
                    color={item.color}
                    disabled={item.disabled}
                    onClick={item.onClick}
                  >
                    {item.label}
                  </Menu.Item>
                </Fragment>
              ))}
            </Menu.Dropdown>
          </Menu>
        </Box>
      )}

      {/* P0 bottom sheet — rendered via shared foundation (Task 514) */}
      {isMobile && (
        <ResponsiveBottomSheet
          opened={drawerOpened}
          onClose={closeDrawer}
          title={title}
        >
          <Stack gap={0}>
            {items.length === 0 ? (
              <Box py="md" px="md">
                <Text size="sm" c="gray.5" ta="center">—</Text>
              </Box>
            ) : (
              items.map((item, i) => (
                <Fragment key={i}>
                  {item.separator && <Divider />}
                  <UnstyledButton
                    onClick={() => {
                      if (!item.disabled) {
                        item.onClick?.()
                        closeDrawer()
                      }
                    }}
                    disabled={item.disabled}
                    w="100%"
                    mih={theme.other.touchTarget}
                    py="sm"
                    px="md"
                    style={{ opacity: item.disabled ? 0.5 : 1 }}
                  >
                    <Group gap="sm" align="center" wrap="nowrap">
                      {item.icon && (
                        <Box
                          style={{
                            flexShrink: 0,
                            color: item.color
                              ? `var(--mantine-color-${item.color}-6)`
                              : undefined,
                          }}
                        >
                          {item.icon}
                        </Box>
                      )}
                      <Text
                        size="sm"
                        c={item.color ? `${item.color}.6` : 'gray.8'}
                        style={{ wordBreak: 'break-word', whiteSpace: 'normal', minWidth: 0 }}
                      >
                        {item.label}
                      </Text>
                    </Group>
                  </UnstyledButton>
                </Fragment>
              ))
            )}
          </Stack>
        </ResponsiveBottomSheet>
      )}
    </>
  )
}
