'use client'

import { Children, type ReactNode } from 'react'
import { Box, Flex, Grid, SimpleGrid, useMantineTheme } from '@mantine/core'

const TOP_ROW_MAX_COLUMNS = 4

export interface MantineDashboardGridProps {
  children?: ReactNode
}

export interface MantineDashboardGridTopRowProps {
  /** The top-row cards. Pass an unrendered card as `{cond && <Card />}` — `null`/`false` children
   * are not counted, so the row closes over the missing slot instead of leaving it empty. A
   * `Fragment` counts as ONE child, so pass the cards directly. */
  children?: ReactNode
}

export interface MantineDashboardGridSplitProps {
  /** The 8-of-12 column (full width below `lg`). */
  main: ReactNode
  /** The 4-of-12 column (full width below `lg`). */
  side: ReactNode
}

export interface MantineDashboardGridFullProps {
  children?: ReactNode
}

/**
 * Canonical dashboard layout (spec v3.3 §17.1; TailAdmin `gap-4 md:gap-6` / `p-4 md:p-6`).
 *
 * Root: content capped at `theme.other.boxSize.dashboardContentMaxWidth` (spec: 1440), centred, with
 * theme gutters `{ base: 'md', md: 'xl' }` (16 → 24) and the same gap between rows.
 *
 * The three row pieces are separate named exports rather than static properties of this
 * component: 853/854 are Server Components, and a static property of a client component is not
 * reachable from a server module.
 *
 * Breakpoints map spec §17.1 onto the theme's own: `xl` (1280) and `lg` (1024) both keep the
 * 12-column layout, `md` (768) shows 2-column cards, below `md` 1 column.
 *
 * `'use client'`: `useMantineTheme` supplies the width cap (`theme.other.boxSize`).
 *
 * Production consumers: 853, 854.
 */
export function MantineDashboardGrid({ children }: MantineDashboardGridProps) {
  const theme = useMantineTheme()
  return (
    <Box w="100%" maw={theme.other.boxSize.dashboardContentMaxWidth} mx="auto" px={{ base: 'md', md: 'xl' }}>
      <Flex direction="column" gap={{ base: 'md', md: 'xl' }}>
        {children}
      </Flex>
    </Box>
  )
}

/**
 * The first row: up to 4 cards. Columns follow the number of rendered children — `lg` and up show
 * `min(n, 4)` columns so 3 cards fill the row and a missing 4th leaves no empty slot (spec §16.3,
 * §17.3 AGT-07); `md` shows at most 2 columns; below `md` 1 column.
 */
export function MantineDashboardGridTopRow({ children }: MantineDashboardGridTopRowProps) {
  const count = Children.toArray(children).length
  if (count === 0) return null
  return (
    <SimpleGrid
      cols={{ base: 1, md: Math.min(count, 2), lg: Math.min(count, TOP_ROW_MAX_COLUMNS) }}
      spacing={{ base: 'md', md: 'xl' }}
    >
      {children}
    </SimpleGrid>
  )
}

/** The 8 + 4 row of the 12-column grid; stacks to one column below `lg`. */
export function MantineDashboardGridSplit({ main, side }: MantineDashboardGridSplitProps) {
  return (
    <Grid gutter={{ base: 'md', md: 'xl' }}>
      <Grid.Col span={{ base: 12, lg: 8 }}>{main}</Grid.Col>
      <Grid.Col span={{ base: 12, lg: 4 }}>{side}</Grid.Col>
    </Grid>
  )
}

/** A full-width row. */
export function MantineDashboardGridFull({ children }: MantineDashboardGridFullProps) {
  return <Box w="100%">{children}</Box>
}
