/**
 * Task 957 Revision 2 (R2-1, AC19, Review 2 F8): `AdminEditLayout` is on Mantine and keeps the geometry of its legacy Tailwind classes
 * (`git show HEAD:src/components/admin/AdminEditLayout.tsx`): one column below `lg` (1024px), the sidebar 288px from `lg` and 320px from `xl` (1280px), sticky 80px from
 * the top from `lg`, gaps `xl` (24px, legacy `gap-6`) between the columns and `md` (16px, legacy `gap-4`) inside the sidebar. The three sizes are `theme.other.layout` keys.
 * The rendered widths are measured on the built Storybook (`Patterns/Mantine/ListingFormShellView` `Staff`); this test reads what Mantine emits for each breakpoint.
 */
import React from 'react'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { MantineProvider } from '@mantine/core'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { theme } from '@/design-system/mantine/theme'
import { setViewport } from '@/design-system/mantine/patterns/__tests__/viewportKit'
import { AdminEditLayout } from '../AdminEditLayout'

const SOURCE = readFileSync(path.join(process.cwd(), 'src/components/admin/AdminEditLayout.tsx'), 'utf8')

function mount() {
  return render(
    <MantineProvider theme={theme} env="test">
      <AdminEditLayout main={<p data-testid="main">main</p>} sidebar={<p data-testid="side">sidebar</p>} />
    </MantineProvider>,
  )
}

/** Every CSS text Mantine put into the document for the style props of the render (it writes responsive props as media-query rules in <style> elements). */
const emittedCss = () => [...document.querySelectorAll('style')].map((s) => s.textContent ?? '').join('\n')

beforeEach(() => { setViewport(1280) })
afterEach(cleanup)

describe('AdminEditLayout on Mantine', () => {
  it('[AC19] the main column comes before the sidebar in the document (the one-column order below 1024px)', () => {
    mount()
    const main = screen.getByTestId('main')
    const side = screen.getByTestId('side')
    expect(main.compareDocumentPosition(side) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('[AC19] the three theme.other.layout keys hold the legacy sizes: 288 (lg:w-72), 320 (xl:w-80) and 80 (lg:top-20)', () => {
    const layout = (theme.other as { layout: Record<string, number> }).layout
    expect(layout.editLayoutSidebarWidth).toBe(288)
    expect(layout.editLayoutSidebarWidthWide).toBe(320)
    expect(layout.editLayoutSidebarStickyTop).toBe(80)
  })

  it('[AC19] Mantine emits a 18rem sidebar from 64em, 20rem from 80em, full width below, and a sticky top of 5rem from 64em', () => {
    mount()
    const css = emittedCss()
    expect(css).toMatch(/\{width:100%;position:static;\}/)
    expect(css).toMatch(/@media\(min-width: 64em\)\{\.[^{]+\{[^}]*width:calc\(18rem \* var\(--mantine-scale\)\)[^}]*position:sticky[^}]*top:calc\(5rem \* var\(--mantine-scale\)\)/)
    expect(css).toMatch(/@media\(min-width: 80em\)\{\.[^{]+\{width:calc\(20rem \* var\(--mantine-scale\)\)/)
    expect(css).toMatch(/\{flex-direction:column;\}@media\(min-width: 64em\)\{\.[^{]+\{flex-direction:row;\}/)
  })

  it('[AC19] the file has no className, no cn and no Tailwind utility (Review 2 F8)', () => {
    expect(SOURCE).not.toMatch(/\bclassName\b/)
    expect(SOURCE).not.toMatch(/\bcn\(/)
    expect(SOURCE).not.toMatch(/from ['"]@\/lib\/utils['"]/)
    const code = SOURCE.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
    // a string that is a class list (only class characters between its quotes) naming a Tailwind utility
    expect(code).not.toMatch(/(['"])[\w:[\]\-\s/.%]*\b(lg:|xl:|flex-col|flex-1|gap-\d|shrink-0|min-w-0)[\w:[\]\-\s/.%]*\1/)
  })

  it('[AC19] the sizes come from the theme keys, never from a literal in the file', () => {
    expect(SOURCE).toMatch(/editLayoutSidebarWidth\b/)
    expect(SOURCE).toMatch(/editLayoutSidebarWidthWide\b/)
    expect(SOURCE).toMatch(/editLayoutSidebarStickyTop\b/)
    expect(SOURCE.replace(/\/\*[\s\S]*?\*\//g, '')).not.toMatch(/\b(288|320|80)\b/)
  })
})
