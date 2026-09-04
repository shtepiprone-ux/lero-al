'use client'

import type { ReactNode } from 'react'
import { Box, Group, Text, useMantineTheme } from '@mantine/core'

export interface MantineFilterSectionProps {
  /** Section label. Rendered as the uppercase micro-heading. */
  label: ReactNode
  /** Optional trailing slot in the header row (e.g. a per-section clear action).
   *  Preserves the affordance of FiltersPanel's dead `SectionHeader.right` prop (§3.2);
   *  no consumer today. */
  action?: ReactNode
  /** Draws the 1px top separator. False for the first section (§3.4 D3). */
  withDivider?: boolean
  children: ReactNode
}

/**
 * Canonical labelled-section wrapper (Task 671) — reproduces `FiltersPanel`'s repeated
 * `px-5 py-5` + uppercase micro-heading + `divide-y` separator shape as a shared Mantine
 * primitive rather than 17 near-identical local compositions.
 *
 * Divider color is `gray-3` (D2), matching `MantineDrawer`'s own header/footer border tokens
 * rather than the legacy shadcn `--border` this section previously inherited via `divide-border`.
 *
 * Label color is `gray.5` = `#667085` (D4, owner decision 2026-07-28, Task 675). Pinned
 * explicitly rather than `c="dimmed"`: `dimmed` is unpinned and resolves to `gray.6`
 * (`#475467`, what Task 671 shipped) — the wrong stop for this artifact. Clause 16a applies:
 * `docs/tailadmin-style-reference.md` has no row for a 12px uppercase micro-heading (only a
 * 14px form-label row and the general "secondary text gray-500" statement), and
 * `grep -rn 'tt="uppercase"' src/` returns exactly one hit — this file — so no precedent
 * existed. The owner therefore established `gray.5` as this artifact's canonical color by
 * decision; do not re-litigate it or revert to `dimmed`.
 */
export function MantineFilterSection({ label, action, withDivider, children }: MantineFilterSectionProps) {
  const theme = useMantineTheme()
  return (
    <Box
      p="lg"
      style={withDivider ? { borderTop: '1px solid var(--mantine-color-gray-3)' } : undefined}
    >
      <Group justify="space-between" mb="sm">
        <Text size="xs" fw={600} tt="uppercase" c="gray.5" style={{ letterSpacing: theme.other.letterSpacing.filterHeading }}>
          {label}
        </Text>
        {action}
      </Group>
      {children}
    </Box>
  )
}
