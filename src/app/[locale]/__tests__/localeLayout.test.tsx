// @vitest-environment node
/**
 * Task 988 R6-3 (F13): the locale layout is the language of every page under the slug, the site's and the admin's: it gives the slug's locale and the messages
 * to the provider around the children, and an unknown slug is not found. The layout's element tree is read, nothing is rendered.
 */
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextIntlClientProvider } from 'next-intl'

const intl = vi.hoisted(() => ({ messages: { hello: 'world' }, setRequestLocale: (() => {}) as (locale: string) => void }))
vi.mock('next-intl/server', () => ({
  getMessages: async () => intl.messages,
  setRequestLocale: (locale: string) => intl.setRequestLocale(locale),
}))
vi.mock('next/navigation', () => ({ notFound: () => { throw new Error('NEXT_NOT_FOUND') } }))

import LocaleLayout from '../layout'

beforeEach(() => {
  intl.setRequestLocale = vi.fn()
})

describe('LocaleLayout — the language of the slug (Task 988)', () => {
  it('gives the slug\'s locale, the messages and the children to the provider', async () => {
    const child = <p>child</p>
    const tree = await LocaleLayout({ children: child, params: Promise.resolve({ locale: 'en' }) })
    expect(tree.type).toBe(NextIntlClientProvider)
    expect(tree.props.locale).toBe('en')
    expect(tree.props.messages).toBe(intl.messages)
    expect(tree.props.children).toBe(child)
    expect(intl.setRequestLocale).toHaveBeenCalledWith('en')
  })

  it('an unknown slug is not found, before any locale is set', async () => {
    await expect(LocaleLayout({ children: <p>child</p>, params: Promise.resolve({ locale: 'xx' }) })).rejects.toThrow('NEXT_NOT_FOUND')
    expect(intl.setRequestLocale).not.toHaveBeenCalled()
  })
})
