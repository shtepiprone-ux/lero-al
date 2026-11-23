// Task 957 Revision 2 (R2-5) — the Storybook stub of `next-cloudinary` is inert: it renders the widget's children with an `open` that does nothing, loads no script and makes no request,
// and Storybook resolves `next-cloudinary` to it.
import path from 'node:path'
import React from 'react'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import config from '../main'
import { CldUploadWidget } from '../stubs/next-cloudinary'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('Storybook next-cloudinary stub', () => {
  it('renders the children with an open that does nothing, makes no request and adds no script', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const scriptsBefore = document.querySelectorAll('script').length
    render(<CldUploadWidget options={{ multiple: true }}>{({ open }) => <button type="button" onClick={open}>pick</button>}</CldUploadWidget>)
    fireEvent.click(screen.getByText('pick'))
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(document.querySelectorAll('script').length).toBe(scriptsBefore)
    expect(document.querySelector('iframe')).toBeNull()
  })

  it('renders nothing without children', () => {
    const { container } = render(<CldUploadWidget />)
    expect(container.innerHTML).toBe('')
  })

  it('is what Storybook resolves next-cloudinary to', async () => {
    const resolved = await config.viteFinal?.({ resolve: { alias: {} } } as never, { configType: 'PRODUCTION' } as never)
    const alias = (resolved as { resolve: { alias: Record<string, string> } }).resolve.alias
    expect(path.normalize(alias['next-cloudinary'])).toBe(path.normalize(path.resolve(__dirname, '../stubs/next-cloudinary.ts')))
  })
})
