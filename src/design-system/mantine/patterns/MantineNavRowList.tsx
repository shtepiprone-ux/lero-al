'use client'

import { Fragment, type ReactNode } from 'react'
import Link from 'next/link'
import { ArrowUpRight, ChevronRight } from 'lucide-react'
import { Box, Center, Divider, Group, Paper, Stack, Text, ThemeIcon, UnstyledButton, useMantineTheme } from '@mantine/core'
import classes from './MantineNavRowList.module.css'

export interface MantineNavRow {
  key: string
  icon: ReactNode
  label: string
  description?: string
  /** A link row. Without it the row is a button and `onClick` runs. */
  href?: string
  /** Opens in a new tab (`rel="noopener noreferrer"`) and shows the external-link arrow. */
  external?: boolean
  onClick?: () => void
}

export interface MantineNavRowListProps {
  items: MantineNavRow[]
}

function NavRowBody({ row }: { row: MantineNavRow }) {
  const theme = useMantineTheme()
  const arrowSize = theme.other.iconSize.standard
  return (
    <Group wrap="nowrap" gap="md">
      <ThemeIcon variant="light" color="gray" size="lg" radius="md">{row.icon}</ThemeIcon>
      <Box flex={1} miw={0}>
        <Text component="span" display="block" fz="sm" fw={500}>{row.label}</Text>
        {row.description && <Text component="span" display="block" fz="xs" c="dimmed">{row.description}</Text>}
      </Box>
      <Center c="dimmed">
        {row.external ? <ArrowUpRight size={arrowSize} aria-hidden /> : <ChevronRight size={arrowSize} aria-hidden />}
      </Center>
    </Group>
  )
}

/**
 * Navigation rows of a dialog (Task 857 R47, §23.7 "Navigation"): full-width rows in one bordered list, each with
 * an icon tile, a label, an optional description and a trailing chevron (or the external-link arrow). Every row has
 * its own line, so two navigation actions can never share a row (GR-3e). A row is at least 56px tall: the 34px
 * icon tile plus `py="sm"` above and below.
 */
export function MantineNavRowList({ items }: MantineNavRowListProps) {
  return (
    <Paper withBorder radius="md" className={classes.list}>
      <Stack gap={0}>
        {items.map((row, index) => (
          <Fragment key={row.key}>
            {index > 0 && <Divider />}
            {row.href ? (
              <UnstyledButton
                component={Link}
                href={row.href}
                {...(row.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                onClick={row.onClick}
                className={classes.row}
                data-nav-row
                w="100%"
                px="md"
                py="sm"
              >
                <NavRowBody row={row} />
              </UnstyledButton>
            ) : (
              <UnstyledButton
                type="button"
                onClick={row.onClick}
                className={classes.row}
                data-nav-row
                w="100%"
                px="md"
                py="sm"
              >
                <NavRowBody row={row} />
              </UnstyledButton>
            )}
          </Fragment>
        ))}
      </Stack>
    </Paper>
  )
}
