// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { DEFAULT_THEME, mergeMantineTheme, type MantineTheme } from '@mantine/core'
import { theme } from '../../theme'
import { resolveThemeColor } from '../dashboardChartTheme'

// the project theme only holds what it changes; the colours come from Mantine's own theme it is merged into at run time
const mantine = mergeMantineTheme(DEFAULT_THEME, theme as never) as MantineTheme

describe('resolveThemeColor', () => {
  it('resolves "<colour>.<shade>" to the theme\'s colour at that shade', () => {
    expect(resolveThemeColor(mantine, 'blue.3')).toBe(mantine.colors.blue[3])
    expect(resolveThemeColor(mantine, 'red.9')).toBe(mantine.colors.red[9])
  })

  it('a colour without a shade uses the dashboard chart default shade', () => {
    expect(resolveThemeColor(mantine, 'teal')).toBe(mantine.colors.teal[mantine.other.dashboardChart.defaultShade])
  })

  it('an unknown colour is returned as written, so a literal such as "#fff" still works', () => {
    expect(resolveThemeColor(mantine, '#ffffff')).toBe('#ffffff')
    expect(resolveThemeColor(mantine, 'notacolour.5')).toBe('notacolour.5')
  })

  it('a shade the colour does not have falls back to the written value', () => {
    expect(resolveThemeColor(mantine, 'blue.42')).toBe('blue.42')
  })
})
