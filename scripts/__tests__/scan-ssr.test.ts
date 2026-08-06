// @vitest-environment node

import { describe, expect, it } from 'vitest'
import {
  getPostRenderHookBodyLineNumbers,
  isViewportReadInRenderPath,
} from '../governance/scan-ssr.mjs'

describe('SSR viewport governance scope', () => {
  it('flags a viewport read performed directly during component render', () => {
    const lines = [
      'export function Header() {',
      '  const compact = window.innerWidth < 640',
      '  return <div data-compact={compact} />',
      '}',
    ]

    const postRenderLines = getPostRenderHookBodyLineNumbers(lines)
    expect(isViewportReadInRenderPath(lines[1], postRenderLines, 2)).toBe(true)
  })

  it('does not flag a client-only portal-position callback', () => {
    const lines = [
      'const updatePosition = useCallback(() => {',
      '  const width = window.innerWidth',
      '  setStyle({ width })',
      '}, [])',
    ]

    const postRenderLines = getPostRenderHookBodyLineNumbers(lines)
    expect(postRenderLines).toEqual(new Set([1, 2, 3, 4]))
    expect(isViewportReadInRenderPath(lines[1], postRenderLines, 2)).toBe(false)
  })

  it('does not flag a multiline useEffect callback', () => {
    const lines = [
      'useEffect(',
      '  () => {',
      '    reportViewport(window.innerWidth)',
      '  },',
      '  []',
      ')',
    ]

    const postRenderLines = getPostRenderHookBodyLineNumbers(lines)
    expect(isViewportReadInRenderPath(lines[2], postRenderLines, 3)).toBe(false)
  })
})
