'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'
import { Menu, Box, Stack, Group, Text, UnstyledButton, Button } from '@mantine/core'
import { useResponsiveDropdown, ResponsiveBottomSheet } from './responsiveBottomSheet'

export interface NavMenuLink {
  label: ReactNode
  /** Navigation target (renders as an anchor); optional when onClick is used */
  href?: string
  onClick?: () => void
  icon?: ReactNode
  disabled?: boolean
}

export interface NavMenuSection {
  /** Top-level trigger label (text trigger) */
  label: ReactNode
  /** Links revealed in the section's panel (≥640) / bottom sheet (<640) */
  links: NavMenuLink[]
  /** Disable this section's trigger — no panel/sheet on either path */
  disabled?: boolean
}

export interface MantineNavigationMenuProps {
  sections: NavMenuSection[]
  /** Accessible label for the <nav> landmark (via aria-label) */
  ariaLabel: string
}

/**
 * Canonical P0-compliant responsive NavigationMenu.
 *
 * ONE component — horizontal anchored nav at ≥640px; full-width stacked section
 * triggers + a shared full-width bottom sheet (per section) at <640px. Consumes the
 * Task 514 single-source foundation (useResponsiveDropdown + ResponsiveBottomSheet
 * from ./responsiveBottomSheet) — same source as MantineSelect/MantinePopover/
 * MantineDropdownMenu; no DragHandle copy, no Drawer block copy.
 *
 * Desktop (≥640px): each section is an uncontrolled Mantine Menu anchored to its own
 * trigger Button, rendered in a Group. The Group is wrapped in an alignSelf:'flex-start'
 * Box (Task 516 mechanism) so a parent Stack align="stretch" cannot stretch the nav bar's
 * trigger row to full width — triggers stay natural/content width.
 *
 * Mobile (<640px): section triggers are stacked in a Mantine Stack. Stack's default
 * align="stretch" (Task 516 flex-column mechanism) stretches each Button child to 100%
 * width without needing to clone/patch a consumer-supplied trigger — this component owns
 * trigger rendering, unlike MantinePopover/MantineDropdownMenu which accept an arbitrary
 * trigger ReactNode. Tapping a section trigger sets activeSectionIndex and opens the ONE
 * shared ResponsiveBottomSheet, which lists that section's links. No second DragHandle/
 * Drawer is instantiated.
 *
 * Disabled section: trigger disabled on both paths, no panel/sheet opens. Disabled link:
 * dimmed (opacity 0.5), tap is a no-op (both Menu.Item and mobile UnstyledButton guard
 * onClick and preventDefault navigation for anchor links). Empty `links: []`: panel/sheet
 * shows a neutral "—" placeholder (mirrors MantineDropdownMenu's empty-items branch).
 *
 * SSR/hydration: isMobile=false on first render (Mantine v8 getInitialValueInEffect=true).
 * Desktop nav path renders on SSR + initial client render; mobile path mounts after
 * hydration. No flash — same documented caveat as MantineDialogDrawerPattern/MantineSelect/
 * MantinePopover/MantineDropdownMenu.
 */
export function MantineNavigationMenu({ sections, ariaLabel }: MantineNavigationMenuProps) {
  const { isMobile, drawerOpened, openDrawer, closeDrawer } = useResponsiveDropdown()
  const [activeSectionIndex, setActiveSectionIndex] = useState(0)
  const activeSection = sections[activeSectionIndex]

  const openSection = (index: number) => {
    setActiveSectionIndex(index)
    openDrawer()
  }

  return (
    <Box component="nav" aria-label={ariaLabel}>
      {isMobile ? (
        <Stack gap="xs">
          {sections.map((section, i) => (
            <Button
              key={i}
              variant="default"
              disabled={section.disabled}
              mih="2.75rem"
              onClick={() => { if (!section.disabled) openSection(i) }}
            >
              {section.label}
            </Button>
          ))}
        </Stack>
      ) : (
        <Box style={{ alignSelf: 'flex-start' }}>
          <Group gap="sm">
            {sections.map((section, i) => (
              <Menu key={i} disabled={section.disabled}>
                <Menu.Target>
                  <Button variant="default" disabled={section.disabled}>
                    {section.label}
                  </Button>
                </Menu.Target>
                <Menu.Dropdown>
                  {section.links.length === 0 ? (
                    <Box py="md" px="md">
                      <Text size="sm" c="gray.5" ta="center">—</Text>
                    </Box>
                  ) : (
                    section.links.map((link, j) => (
                      <Menu.Item
                        key={j}
                        component={link.href ? 'a' : 'button'}
                        href={link.href}
                        leftSection={link.icon}
                        disabled={link.disabled}
                        onClick={(event: React.MouseEvent) => {
                          if (link.disabled) {
                            event.preventDefault()
                            return
                          }
                          link.onClick?.()
                        }}
                      >
                        {link.label}
                      </Menu.Item>
                    ))
                  )}
                </Menu.Dropdown>
              </Menu>
            ))}
          </Group>
        </Box>
      )}

      {/* P0 bottom sheet — ONE shared instance for all sections (Task 514 source) */}
      {isMobile && (
        <ResponsiveBottomSheet
          opened={drawerOpened}
          onClose={closeDrawer}
          title={activeSection?.label}
        >
          <Stack gap={0}>
            {!activeSection || activeSection.links.length === 0 ? (
              <Box py="md" px="md">
                <Text size="sm" c="gray.5" ta="center">—</Text>
              </Box>
            ) : (
              activeSection.links.map((link, j) => (
                <UnstyledButton
                  key={j}
                  component={link.href ? 'a' : 'button'}
                  href={link.href}
                  disabled={!link.href ? link.disabled : undefined}
                  aria-disabled={link.disabled || undefined}
                  onClick={(event: React.MouseEvent) => {
                    if (link.disabled) {
                      event.preventDefault()
                      return
                    }
                    link.onClick?.()
                    closeDrawer()
                  }}
                  w="100%"
                  mih="2.75rem"
                  py="sm"
                  px="md"
                  style={{ opacity: link.disabled ? 0.5 : 1 }}
                >
                  <Group gap="sm" align="center" wrap="nowrap">
                    {link.icon && <Box style={{ flexShrink: 0 }}>{link.icon}</Box>}
                    <Text
                      size="sm"
                      c="gray.8"
                      style={{ wordBreak: 'break-word', whiteSpace: 'normal', minWidth: 0 }}
                    >
                      {link.label}
                    </Text>
                  </Group>
                </UnstyledButton>
              ))
            )}
          </Stack>
        </ResponsiveBottomSheet>
      )}
    </Box>
  )
}
