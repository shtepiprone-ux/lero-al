/**
 * The chart label measuring that needs a real canvas and the font loader (Task 923 Revision 7). In the browser the width of a label comes from a canvas context;
 * where there is none (the server, jsdom) an average glyph width is used. The hook re-renders the chart once the fonts of its texts have loaded, so a label is
 * never measured with a fallback font for good, and it must stop doing so when the chart is gone.
 */
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MantineTheme } from '@mantine/core'
import { theme } from '../../theme'

const mantine = theme as unknown as MantineTheme

async function load() {
  vi.resetModules()
  return import('../dashboardChartLabels')
}

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

describe('textWidth', () => {
  it('uses the canvas to measure with the given font', async () => {
    const measureText = vi.fn((text: string) => ({ width: text.length * 7 }))
    const ctx = { font: '', measureText }
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as never)
    const { textWidth } = await load()
    expect(textWidth('hello', '12px Inter')).toBe(35)
    expect(ctx.font).toBe('12px Inter')
    expect(textWidth('hi', '14px Inter')).toBe(14)
    expect(ctx.font).toBe('14px Inter')
  })

  it('creates the canvas once and reuses it', async () => {
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ font: '', measureText: () => ({ width: 1 }) } as never)
    const { textWidth } = await load()
    textWidth('a', '12px x'); textWidth('b', '12px x'); textWidth('c', '12px x')
    expect(getContext).toHaveBeenCalledTimes(1)
  })

  it('without a canvas context it estimates from the font size and the length of the text', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    const { textWidth } = await load()
    expect(textWidth('abcd', '10px Inter')).toBeCloseTo(4 * 10 * 0.55)
    expect(textWidth('abcd', 'big Inter')).toBeCloseTo(4 * 12 * 0.55)
    expect(textWidth('', '10px Inter')).toBe(0)
  })
})

describe('chartLabelFont and chartLabelSize', () => {
  it('use the theme\'s extra-small size and the body font of the page', async () => {
    const { chartLabelFont, chartLabelSize } = await load()
    document.body.style.fontFamily = 'Inter'
    const size = chartLabelSize(mantine)
    expect(size).toBeGreaterThan(8)
    expect(size).toBeLessThan(20)
    expect(chartLabelFont(mantine)).toBe(`${size}px ${getComputedStyle(document.body).fontFamily}`)
    document.body.style.fontFamily = ''
  })

  it('fall back to the theme\'s font family when the page has none', async () => {
    const { chartLabelFont, chartLabelSize } = await load()
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({ fontFamily: '' } as never)
    expect(chartLabelFont(mantine)).toBe(`${chartLabelSize(mantine)}px ${mantine.fontFamily}`)
  })
})

describe('useChartLabelFont', () => {
  let loadFont: ReturnType<typeof vi.fn>
  beforeEach(() => {
    loadFont = vi.fn(() => Promise.resolve([]))
    Object.defineProperty(document, 'fonts', { configurable: true, value: { load: loadFont } })
  })
  afterEach(() => { Object.defineProperty(document, 'fonts', { configurable: true, value: undefined }) })

  it('asks the browser to load the glyphs of every text in the font, and renders again when they are there', async () => {
    const { useChartLabelFont } = await load()
    let renders = 0
    const { result } = renderHook(() => { renders++; return useChartLabelFont(mantine, ['Tiranë', 'Київ']) })
    expect(typeof result.current).toBe('string')
    expect(loadFont).toHaveBeenCalledTimes(2)
    expect(loadFont).toHaveBeenCalledWith(result.current, 'Tiranë')
    expect(loadFont).toHaveBeenCalledWith(result.current, 'Київ')
    await act(async () => { await Promise.resolve(); await Promise.resolve() })
    expect(renders).toBeGreaterThan(1)
  })

  it('does not ask again for the same texts, and asks again for new ones', async () => {
    const { useChartLabelFont } = await load()
    const { rerender } = renderHook(({ texts }) => useChartLabelFont(mantine, texts), { initialProps: { texts: ['a', 'b'] } })
    await act(async () => { await Promise.resolve() })
    loadFont.mockClear()
    rerender({ texts: ['a', 'b'] })
    expect(loadFont).not.toHaveBeenCalled()
    rerender({ texts: ['a', 'c'] })
    expect(loadFont).toHaveBeenCalledTimes(2)
  })

  it('a chart that is gone is not rendered again when the fonts arrive', async () => {
    let resolve!: () => void
    loadFont.mockImplementation(() => new Promise<unknown[]>((r) => { resolve = () => r([]) }))
    const { useChartLabelFont } = await load()
    let renders = 0
    const { unmount } = renderHook(() => { renders++; return useChartLabelFont(mantine, ['x']) })
    const before = renders
    unmount()
    await act(async () => { resolve(); await Promise.resolve() })
    expect(renders).toBe(before)
  })

  it('a font that fails to load is ignored', async () => {
    loadFont.mockImplementation(() => Promise.reject(new Error('blocked')))
    const { useChartLabelFont } = await load()
    const { result } = renderHook(() => useChartLabelFont(mantine, ['x']))
    await act(async () => { await Promise.resolve(); await Promise.resolve() })
    expect(typeof result.current).toBe('string')
  })

  it('where the browser has no font loader nothing is asked', async () => {
    Object.defineProperty(document, 'fonts', { configurable: true, value: undefined })
    const { useChartLabelFont } = await load()
    expect(() => renderHook(() => useChartLabelFont(mantine, ['x']))).not.toThrow()
  })
})
