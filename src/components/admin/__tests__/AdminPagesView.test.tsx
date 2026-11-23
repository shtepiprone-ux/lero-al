/**
 * Task 957 Revision 9 (R9-2, AC49; Review 9 F47): the three row icons of `/admin/pages` (open, edit, delete) are one size in the table (the desktop layout: the row size of `main`, `size="sm"`),
 * and all three carry the theme's touch target together in the cards (the touch layout), as `main`'s `touchProps` gave them. `MantineDataTableToCards` renders the table and the cards together and
 * shows one by CSS (`visibleFrom` / `hiddenFrom`), so each layout is read from its own box.
 */
import React from 'react'
import { cleanup, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Page } from '@/types/database'
import { renderApp, setViewport } from '@/design-system/mantine/patterns/__tests__/viewportKit'
import { AdminPagesView } from '../AdminPagesView'

const PAGE = {
  id: 1,
  title: 'Terms',
  slug: 'terms-of-use',
  content: { sq: { title: 'Terms', body: '<p>x</p>' }, en: { title: 'Terms', body: '<p>x</p>' }, uk: { title: 'Terms', body: '<p>x</p>' }, it: { title: 'Terms', body: '<p>x</p>' } },
  is_published: true,
  updated_by: null,
  updated_at: '2026-09-27T14:30:00.000Z',
} as unknown as Page

/** The open, edit and delete icons of the one row, in the table box (`desktop`) or the card box (`touch`). */
function rowIcons(layout: 'desktop' | 'touch') {
  setViewport(layout === 'desktop' ? 1440 : 400)
  const { container } = renderApp(
    <AdminPagesView
      pages={[PAGE]}
      activeLocale="en"
      migrationPending={false}
      deletingId={null}
      deleteTarget={null}
      onNew={vi.fn()}
      onEdit={vi.fn()}
      onRequestDelete={vi.fn()}
      onCancelDelete={vi.fn()}
      onConfirmDelete={vi.fn()}
      now="2026-09-28T09:00:00.000Z"
    />,
  )
  const box = container.querySelector(layout === 'desktop' ? '[class*="mantine-visible-from"]' : '[class*="mantine-hidden-from"]') as HTMLElement | null
  expect(box, `the ${layout} box`).not.toBeNull()
  const scope = within(box as HTMLElement)
  return [scope.getByRole('link', { name: 'Open preview' }), scope.getByRole('button', { name: 'Edit' }), scope.getByRole('button', { name: 'Delete' })]
}

afterEach(cleanup)

describe('AdminPagesView row icons (Review 9 F47)', () => {
  it('[AC49] in the desktop layout the open, edit and delete icons of a row have the same data-size and none carries the touch target', () => {
    const icons = rowIcons('desktop')
    expect(icons.map((icon) => icon.getAttribute('data-size'))).toEqual(['sm', 'sm', 'sm'])
    for (const icon of icons) expect(icon.getAttribute('style') ?? '', icon.getAttribute('aria-label') ?? '').not.toMatch(/min-(height|width)/)
  })

  it('[AC49] in the touch layout all three icons carry the same touch target', () => {
    const icons = rowIcons('touch')
    expect(icons.map((icon) => icon.getAttribute('data-size'))).toEqual(['sm', 'sm', 'sm'])
    for (const icon of icons) {
      const style = icon.getAttribute('style') ?? ''
      expect(style, icon.getAttribute('aria-label') ?? '').toMatch(/min-height/)
      expect(style, icon.getAttribute('aria-label') ?? '').toMatch(/min-width/)
    }
    const targets = icons.map((icon) => /min-height:\s*([^;]+)/.exec(icon.getAttribute('style') ?? '')?.[1])
    expect(new Set(targets).size, 'the same touch target on all three').toBe(1)
  })
})
