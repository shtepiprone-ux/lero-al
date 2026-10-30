// @vitest-environment node
/**
 * Component rules of the project theme that are FUNCTIONS (Task 923 Revision 7): the badge tint, the progress bar height, the radio dot, the slider track, the
 * notification and alert colours. Each is called directly with a merged Mantine theme, so a colour that does not exist in the theme, a size nobody listed or a
 * missing prop gives the documented fallback instead of an `undefined` variable in the page's style.
 */
import { DEFAULT_THEME, mergeMantineTheme, type MantineTheme } from '@mantine/core'
import { describe, expect, it } from 'vitest'
import { theme } from '../theme'

const mantine = mergeMantineTheme(DEFAULT_THEME, theme as never) as MantineTheme
type Fn = (t: MantineTheme, props: Record<string, unknown>) => Record<string, Record<string, unknown>>
const component = (name: string) => (theme.components as unknown as Record<string, { vars?: Fn; styles?: Fn | Record<string, unknown>; defaultProps?: Record<string, unknown> }>)[name]
const vars = (name: string, props: Record<string, unknown> = {}) => component(name).vars!(mantine, props)
const styles = (name: string, props: Record<string, unknown> = {}) => (component(name).styles as Fn)(mantine, props)

describe('Badge', () => {
  it('is a filled pill unless told otherwise', () => {
    expect(component('Badge').defaultProps).toMatchObject({ radius: 'pill', variant: 'filled', size: 'sm' })
  })

  it('only the "light" variant gets the neutral tint from its colour; any other variant keeps Mantine\'s own look', () => {
    expect(vars('Badge', { variant: 'filled', color: 'red' })).toEqual({ root: {} })
    expect(vars('Badge', {})).toEqual({ root: {} })
    expect(vars('Badge', { variant: 'light', color: 'red' })).toEqual({ root: { '--badge-bg': 'var(--mantine-color-red-2)', '--badge-color': 'var(--mantine-color-red-7)' } })
  })

  it('a light badge with no colour uses the theme\'s primary colour', () => {
    const out = vars('Badge', { variant: 'light' })
    expect(out.root['--badge-bg']).toBe(`var(--mantine-color-${mantine.primaryColor}-2)`)
  })

  it('a colour that is not in the theme (a literal) is not turned into a variable that does not exist', () => {
    expect(vars('Badge', { variant: 'light', color: '#ff0000' })).toEqual({ root: {} })
    expect(vars('Badge', { variant: 'light', color: 'rgb(1,2,3)' })).toEqual({ root: {} })
  })
})

describe('Progress', () => {
  it.each([['sm', '0.5rem'], ['md', '0.75rem'], ['lg', '1rem'], ['xl', '1.25rem']])('the size %s is %s tall', (size, height) => {
    expect(vars('Progress', { size }).root['--progress-size']).toBe(height)
  })

  it.each([[undefined], [12], ['huge'], [null]])('the size %j falls back to the medium height', (size) => {
    expect(vars('Progress', { size }).root['--progress-size']).toBe('0.75rem')
  })

  it('is a full pill', () => {
    expect(component('Progress').defaultProps).toEqual({ radius: 'pill' })
  })
})

describe('Radio and its card indicator', () => {
  it('a 20px circle (size sm) with a 10px dot, set once for every consumer', () => {
    expect(component('Radio').defaultProps).toEqual({ size: 'sm' })
    expect(vars('Radio').root['--radio-icon-size']).toBe('0.625rem')
    expect(component('RadioIndicator').defaultProps).toEqual({ size: 'sm' })
    expect(vars('RadioIndicator').indicator['--radio-icon-size']).toBe('0.625rem')
  })

  it('the label stays a touch target of at least 44px', () => {
    expect((component('Radio').styles as Record<string, Record<string, unknown>>).body.minHeight).toBe('2.75rem')
  })
})

describe('Slider and RangeSlider', () => {
  it('share one light track colour', () => {
    expect(vars('Slider').root['--slider-track-bg']).toBe('var(--mantine-color-gray-1)')
    expect(vars('RangeSlider').root['--slider-track-bg']).toBe('var(--mantine-color-gray-1)')
  })

  it('are thin sliders with a 12px thumb', () => {
    expect(component('Slider').defaultProps).toMatchObject({ size: 'xs', thumbSize: 12 })
    expect(component('RangeSlider').defaultProps).toMatchObject({ size: 'xs', thumbSize: 12 })
  })
})

describe('Notification and Alert take their accent from the colour given', () => {
  it('a notification without a colour is grey; with one it uses that colour for the accent, the tint and the glyph', () => {
    expect(styles('Notification').root.borderBottom).toBe('4px solid var(--mantine-color-gray-5)')
    const red = styles('Notification', { color: 'red' })
    expect(red.root.borderBottom).toBe('4px solid var(--mantine-color-red-5)')
    expect(red.icon.backgroundColor).toBe('var(--mantine-color-red-0)')
    expect(red.icon.color).toBe('var(--mantine-color-red-6)')
  })

  it('a notification title is 16px and bold enough to read', () => {
    expect(styles('Notification').title).toMatchObject({ fontSize: '1rem', fontWeight: 600 })
  })

  it('an alert without a colour uses the brand colour; with one it uses that colour for border, background and icon', () => {
    const brand = styles('Alert')
    expect(brand.root.borderColor).toBe('var(--mantine-color-brand-5)')
    expect(brand.root.backgroundColor).toBe('var(--mantine-color-brand-0)')
    const green = styles('Alert', { color: 'green' })
    expect(green.root.borderColor).toBe('var(--mantine-color-green-5)')
    expect(green.icon.color).toBe('var(--mantine-color-green-5)')
  })

  it('an alert keeps a readable body: 14px text with a 20px line', () => {
    expect(styles('Alert').message).toMatchObject({ fontSize: 'var(--mantine-font-size-sm)', lineHeight: '1.25rem' })
  })
})
