/**
 * Task 989, owner decision 2026-11-27: the "Default SEO" section of the settings holds one tab per language, and each tab holds the title and the description of
 * that language only (the eight fields one under another made the section too long). Switching the tab shows that language's values; a tab whose title is filled
 * carries a check; saving the SEO tab still sends every language. The real form is rendered with the real `en` messages.
 */
import React from 'react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { MantineProvider } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'
import { setViewport } from '@/design-system/mantine/patterns/__tests__/viewportKit'
import messages from '../../../../messages/en.json'
import { FIXTURE_SETTINGS } from '@/stories/fixtures/admin.fixtures'
import { AdminSettings } from '../AdminSettings'

const mockSave = vi.fn()
vi.mock('@/modules/admin/actions', () => ({ saveSettings: (...args: unknown[]) => mockSave(...args) }))

const t = messages.admin.settings
const lang = messages.nav

function renderSeo() {
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <MantineProvider theme={theme} env="test">
        <AdminSettings initialSettings={FIXTURE_SETTINGS} />
      </MantineProvider>
    </NextIntlClientProvider>,
  )
  fireEvent.click(screen.getByRole('tab', { name: t.tab_seo }))
}
const seoTabs = () => within(screen.getAllByRole('tablist')[1]).getAllByRole('tab')

beforeAll(() => setViewport(1280))
beforeEach(() => mockSave.mockReset().mockResolvedValue({}))
afterEach(cleanup)

describe('Task 989 — the SEO section has a tab per language', () => {
  it('shows four language tabs and only the title and description of the chosen one', () => {
    renderSeo()
    expect(seoTabs().map((tab) => tab.textContent)).toEqual([lang.lang_sq, lang.lang_en, lang.lang_uk, lang.lang_it])
    expect(screen.getAllByLabelText(t.field_meta_title)).toHaveLength(1)
    expect((screen.getByLabelText(t.field_meta_title) as HTMLInputElement).value).toBe(FIXTURE_SETTINGS.meta_title_sq)
    expect((screen.getByLabelText(t.field_meta_desc) as HTMLTextAreaElement).value).toBe(FIXTURE_SETTINGS.meta_desc_sq)
    fireEvent.click(seoTabs()[1])
    expect((screen.getByLabelText(t.field_meta_title) as HTMLInputElement).value).toBe(FIXTURE_SETTINGS.meta_title_en)
    expect(screen.getByLabelText(t.field_og_image)).toBeInTheDocument()
  })

  it('a language whose title is filled carries a check on its tab', () => {
    renderSeo()
    const withCheck = seoTabs().map((tab) => tab.querySelector('svg') !== null)
    expect(withCheck).toEqual([true, true, false, false])
  })

  it('a value typed in one language stays when the tab changes, and saving sends every language', async () => {
    renderSeo()
    fireEvent.click(seoTabs()[2])
    fireEvent.change(screen.getByLabelText(t.field_meta_title), { target: { value: 'Нерухомість в Албанії' } })
    fireEvent.click(seoTabs()[0])
    fireEvent.click(seoTabs()[2])
    expect((screen.getByLabelText(t.field_meta_title) as HTMLInputElement).value).toBe('Нерухомість в Албанії')
    fireEvent.click(screen.getByRole('button', { name: t.save_btn }))
    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1))
    const [entries] = mockSave.mock.calls[0] as [Record<string, string>]
    expect(entries).toMatchObject({ meta_title_uk: 'Нерухомість в Албанії', meta_title_sq: FIXTURE_SETTINGS.meta_title_sq, meta_desc_it: '' })
    expect(Object.keys(entries).filter((key) => /^meta_(title|desc)_/.test(key)).sort()).toHaveLength(8)
  })
})
