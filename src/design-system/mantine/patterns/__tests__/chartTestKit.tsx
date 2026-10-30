/**
 * Shared harness of the chart pattern tests (Task 923 Revision 7). `next/dynamic` is replaced by a stub that records the props the pattern
 * hands to ApexCharts, and `useApexFluidBox` by a box of a chosen width: a jsdom test cannot lay out a canvas, so these tests read the
 * options and the size the pattern computes; the rendered result is proved on the built Storybook by the rendered state census.
 */
import React from 'react'
import { vi } from 'vitest'
import { render } from '@testing-library/react'
import { MantineProvider, type MantineTheme } from '@mantine/core'
import type { ApexOptions } from 'apexcharts'
import { theme } from '@/design-system/mantine/theme'

export interface ApexProps { options: ApexOptions; series: unknown; type?: string; width?: unknown; height?: unknown }

export const chartState: { width: number; last: null | ApexProps } = { width: 0, last: null }

export function stubMatchMedia() {
  vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({
    matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  })))
}

export function renderChart(node: React.ReactElement): ApexProps {
  chartState.last = null
  render(<MantineProvider theme={theme} env="test">{node}</MantineProvider>)
  if (!chartState.last) throw new Error('the chart was not rendered')
  return chartState.last
}

/** The project tokens of `theme.other`, typed as the components read them (the raw `theme` object types every member as optional). */
export const tokens = (theme as unknown as MantineTheme).other
