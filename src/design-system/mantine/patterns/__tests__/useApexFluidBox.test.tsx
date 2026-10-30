/**
 * useApexFluidBox — the width a chart canvas gets (Task 923 Revision 7, the Story 059 finding): the wrapper's own measurement is the single
 * source of the canvas width, it never exceeds the box (a fractional width is floored), and until the first measurement the chart keeps "100%".
 */
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import React from 'react'
import { renderHook } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'
import { stubMatchMedia } from './chartTestKit'

const measured = { width: 0 }
vi.mock('@mantine/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@mantine/hooks')>()),
  useElementSize: () => ({ ref: vi.fn(), width: measured.width, height: 0 }),
}))

import { useApexFluidBox } from '../useApexFluidBox'

beforeAll(stubMatchMedia)
beforeEach(() => { measured.width = 0 })

const wrapper = ({ children }: { children: React.ReactNode }) => <MantineProvider theme={theme} env="test">{children}</MantineProvider>
const hook = () => renderHook(() => useApexFluidBox(), { wrapper })

describe('useApexFluidBox', () => {
  it('keeps the fluid 100% until the wrapper has been measured', () => {
    const { result } = hook()
    expect(result.current.boxWidth).toBe(0)
    expect(result.current.chartWidth).toBe('100%')
  })

  it('hands the measured width to the chart', () => {
    measured.width = 320
    const { result } = hook()
    expect(result.current.chartWidth).toBe(320)
    expect(result.current.boxWidth).toBe(320)
  })

  it('floors a fractional width, so the canvas is never wider than its box', () => {
    measured.width = 461.9
    const { result } = hook()
    expect(result.current.chartWidth).toBe(461)
    expect(result.current.chartWidth as number).toBeLessThanOrEqual(measured.width)
  })

  it('follows the box when it changes', () => {
    measured.width = 400
    const { result, rerender } = hook()
    expect(result.current.chartWidth).toBe(400)
    measured.width = 250
    rerender()
    expect(result.current.chartWidth).toBe(250)
  })

  it('returns one callback ref for the wrapper', () => {
    const { result } = hook()
    expect(typeof result.current.ref).toBe('function')
  })
})
