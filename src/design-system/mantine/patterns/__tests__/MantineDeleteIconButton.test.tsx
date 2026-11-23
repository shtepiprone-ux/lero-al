/**
 * Task 957 Revision 2 (R2-8, AC24; Review 2 F13): the one canonical delete icon action. It owns the look (`subtle`, red, the theme's compact icon and touch target; `filled` over an image,
 * Revision 3 AC31); a consumer passes the accessible name, the click handler, the state and `onMedia`, never a variant, colour or size.
 */
import React from 'react'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { MantineProvider } from '@mantine/core'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { theme } from '@/design-system/mantine/theme'
import { setViewport } from '@/design-system/mantine/patterns/__tests__/viewportKit'
import { MantineDeleteIconButton } from '../MantineDeleteIconButton'

function mount(props: Partial<React.ComponentProps<typeof MantineDeleteIconButton>> = {}) {
  const onClick = vi.fn()
  render(<MantineProvider theme={theme} env="test"><MantineDeleteIconButton label="Delete the item" onClick={onClick} {...props} /></MantineProvider>)
  return onClick
}

beforeEach(() => { setViewport(1024) })
afterEach(cleanup)

describe('MantineDeleteIconButton', () => {
  it('[AC24] is a button named by its label, with the same text as its title, and calls onClick', () => {
    const onClick = mount()
    const button = screen.getByRole('button', { name: 'Delete the item' }) as HTMLButtonElement
    expect(button.type).toBe('button')
    expect(button.getAttribute('title')).toBe('Delete the item')
    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  // Task 957 Revision 9 (R9-2, AC49; Review 9 F47): the title said "at the theme touch target"; since R9-2 a row control is the row size and takes the touch target only with `touch` (the assertions below are unchanged)
  it('[AC24] its look is the shared one: a subtle red action icon with the trash glyph, at the row size', () => {
    mount()
    const button = screen.getByRole('button', { name: 'Delete the item' })
    expect(button.getAttribute('data-variant')).toBe('subtle')
    expect(button.querySelector('svg')).not.toBeNull()
    const css = [...document.querySelectorAll('style')].map((s) => s.textContent ?? '').join('\n')
    expect(`${button.getAttribute('style') ?? ''}\n${css}`).toMatch(/--ai-color:[^;]*red|--ai-color:[^;]*var\(--mantine-color-red/)
    expect(button.getAttribute('style') ?? '').toMatch(/(min-)?(height|width|size)|--ai-size/)
  })

  it('[AC24] disabled and loading are respected', () => {
    const onClick = mount({ disabled: true })
    const button = screen.getByRole('button', { name: 'Delete the item' }) as HTMLButtonElement
    expect(button.disabled).toBe(true)
    fireEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
    cleanup()
    mount({ loading: true })
    expect(screen.getByRole('button', { name: 'Delete the item' }).hasAttribute('data-loading')).toBe(true)
  })

  // Task 957 Revision 3 (R3-6, AC31; Review 3 F21, owner decision O957-7: "it needs a fill, otherwise it merges with the photo"): a delete control over an image is filled red with a white glyph, as on `main`
  it('[AC31] onMedia gives the filled red look of a control over an image; without it the look is subtle', () => {
    mount({ onMedia: true })
    const over = screen.getByRole('button', { name: 'Delete the item' })
    expect(over.getAttribute('data-variant')).toBe('filled')
    expect(over.getAttribute('style') ?? '').toMatch(/--ai-bg:[^;]*red/)
    expect(over.querySelector('svg')).not.toBeNull()
    cleanup()
    mount({ onMedia: false })
    expect(screen.getByRole('button', { name: 'Delete the item' }).getAttribute('data-variant')).toBe('subtle')
    cleanup()
    mount()
    expect(screen.getByRole('button', { name: 'Delete the item' }).getAttribute('data-variant')).toBe('subtle')
  })

  it('[AC31] onMedia keeps the label, the title, the touch target and the disabled state', () => {
    const onClick = mount({ onMedia: true, disabled: true })
    const button = screen.getByRole('button', { name: 'Delete the item' }) as HTMLButtonElement
    expect(button.getAttribute('title')).toBe('Delete the item')
    expect(button.getAttribute('style') ?? '').toMatch(/min-width|min-height/)
    expect(button.disabled).toBe(true)
    fireEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  // Task 957 Revision 9 (R9-2, AC49; Review 9 F47): on `main` the three icons of a row were `size="sm"` and took the touch target together, only in the touch layout; a row delete beside two 22px icons was 44px
  it('[AC49] without onMedia and touch it is the row size (data-size sm) and carries no touch-target minimum', () => {
    mount()
    const button = screen.getByRole('button', { name: 'Delete the item' })
    expect(button.getAttribute('data-size')).toBe('sm')
    expect(button.getAttribute('style') ?? '').not.toMatch(/min-(height|width)/)
  })

  it('[AC49] with touch it carries the theme touch target (min-height and min-width) and stays subtle', () => {
    mount({ touch: true })
    const button = screen.getByRole('button', { name: 'Delete the item' })
    expect(button.getAttribute('data-variant')).toBe('subtle')
    const style = button.getAttribute('style') ?? ''
    expect(style).toMatch(/min-height/)
    expect(style).toMatch(/min-width/)
  })

  it('[AC49] with onMedia it is still filled and lg, with the touch target', () => {
    mount({ onMedia: true })
    const button = screen.getByRole('button', { name: 'Delete the item' })
    expect(button.getAttribute('data-variant')).toBe('filled')
    expect(button.getAttribute('data-size')).toBe('lg')
    expect(button.getAttribute('style') ?? '').toMatch(/min-height/)
  })

  it('[AC24] offers no prop that picks a look (variant, color, size, radius)', () => {
    const source = readFileSync(path.join(process.cwd(), 'src/design-system/mantine/patterns/MantineDeleteIconButton.tsx'), 'utf8')
    const props = /export interface MantineDeleteIconButtonProps \{([\s\S]*?)\n\}/.exec(source)?.[1] ?? ''
    expect(props).not.toMatch(/\b(variant|color|size|radius)\??:/)
    expect(props).toMatch(/\blabel: string/)
  })
})
