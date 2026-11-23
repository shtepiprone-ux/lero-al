/**
 * Task 957 Revision 2 (R2-8, AC24; Review 2 F13): the delete control of a collection card is the canonical delete icon action (`MantineDeleteIconButton`): a button named by the
 * `delete` message that opens the delete confirmation and, as the canonical action, never deletes by itself.
 */
import React from 'react'
import { MantineProvider } from '@mantine/core'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { theme } from '@/design-system/mantine/theme'
import { setViewport } from '@/design-system/mantine/patterns/__tests__/viewportKit'
import type { CollectionWithCount } from '@/types/database'

vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }))
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
const actions = vi.hoisted(() => ({ createCollection: vi.fn(), renameCollection: vi.fn(), deleteCollection: vi.fn() }))
vi.mock('@/modules/listings/actions/collectionActions', () => actions)

import { CollectionsSection } from '../CollectionsSection'

const COLLECTIONS = [
  { id: 'c1', name: 'First', item_count: 2 },
  { id: 'c2', name: 'Second', item_count: 0 },
] as unknown as CollectionWithCount[]

beforeEach(() => { setViewport(1024); vi.clearAllMocks() })
afterEach(cleanup)

describe('CollectionsSection delete control', () => {
  it('[AC24] each card has one canonical delete icon action named "delete" (subtle, with the trash glyph and a title)', () => {
    render(<MantineProvider theme={theme} env="test"><CollectionsSection initialCollections={COLLECTIONS} /></MantineProvider>)
    const buttons = screen.getAllByRole('button', { name: 'delete' })
    expect(buttons).toHaveLength(2)
    for (const b of buttons) {
      expect(b.getAttribute('data-variant')).toBe('subtle')
      expect(b.getAttribute('title')).toBe('delete')
      expect(b.querySelector('svg')).not.toBeNull()
    }
  })

  it('[AC24] a click opens the delete confirmation and deletes nothing', () => {
    render(<MantineProvider theme={theme} env="test"><CollectionsSection initialCollections={COLLECTIONS} /></MantineProvider>)
    fireEvent.click(screen.getAllByRole('button', { name: 'delete' })[0])
    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(actions.deleteCollection).not.toHaveBeenCalled()
  })
})
