/**
 * MantineDrawer — `useMantineDrawerPresentation` (Task 923 R48).
 * A child of the drawer reads the presentation its owner chose: `'sheet'` while the 640px gate matches (the bottom sheet), `'side'` otherwise (the side
 * drawer), and `null` outside any `MantineDrawer`. The value is the owner's own `isMobile`; the test stands in each viewport through `matchMedia`, as the
 * browser does, because jsdom has no layout.
 */
import React from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'
import { MantineDrawer, useMantineDrawerPresentation } from '../MantineDrawer'

function stubViewport(matches: boolean) {
  vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({
    matches, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  })))
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
}

function Probe() {
  return <span data-testid="presentation">{String(useMantineDrawerPresentation())}</span>
}

function renderInProvider(node: React.ReactElement) {
  return render(<MantineProvider theme={theme} env="test">{node}</MantineProvider>)
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('MantineDrawer — useMantineDrawerPresentation', () => {
  it('a child of the drawer reads "sheet" while the 640px gate matches', () => {
    stubViewport(true)
    renderInProvider(<MantineDrawer opened onClose={() => {}}><Probe /></MantineDrawer>)
    expect(screen.getByTestId('presentation').textContent).toBe('sheet')
    expect(document.querySelector('.mantine-Drawer-content')).not.toBeNull()
  })

  it('a child of the drawer reads "side" when the 640px gate does not match', () => {
    stubViewport(false)
    renderInProvider(<MantineDrawer opened onClose={() => {}}><Probe /></MantineDrawer>)
    expect(screen.getByTestId('presentation').textContent).toBe('side')
    expect(document.querySelector('.mantine-Drawer-content')).not.toBeNull()
  })

  it('a component outside any MantineDrawer reads null', () => {
    stubViewport(true)
    renderInProvider(<Probe />)
    expect(screen.getByTestId('presentation').textContent).toBe('null')
  })

  it('the footer of the drawer reads the same presentation as its body', () => {
    stubViewport(true)
    renderInProvider(
      <MantineDrawer opened onClose={() => {}} footer={<span data-testid="footer-presentation"><Probe /></span>}>
        <Probe />
      </MantineDrawer>,
    )
    const reads = screen.getAllByTestId('presentation').map((el) => el.textContent)
    expect(reads).toEqual(['sheet', 'sheet'])
  })
})
