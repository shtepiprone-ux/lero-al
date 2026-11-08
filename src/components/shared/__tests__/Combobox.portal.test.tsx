/**
 * Task 953, Revision 1 (R1): a portal Combobox places its dropdown from the field's rectangle each time the person opens it. Focus and click place it in their own
 * handlers; typing that reopens the dropdown (after Escape, with the field moved while the dropdown was closed and no scroll listener running) must do the same,
 * or the dropdown is drawn at the place it had when it was last open.
 */
import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '../../../../messages/en.json'
import { Combobox } from '../Combobox'

const OPTIONS = [{ value: 'tirana', label: 'Tirana' }, { value: 'durres', label: 'Durres' }]

let rect = { top: 100, bottom: 140, left: 50, right: 250, width: 200, height: 40, x: 50, y: 100 }
const moveFieldTo = (top: number, left: number) => {
  rect = { top, bottom: top + 40, left, right: left + 200, width: 200, height: 40, x: left, y: top }
}

function Controlled() {
  const [value, setValue] = React.useState('')
  return <Combobox options={OPTIONS} value={value} onChange={setValue} placeholder="City" portal />
}

const mount = () => render(<NextIntlClientProvider locale="en" messages={messages}><Controlled /></NextIntlClientProvider>)
const panel = () => screen.getByRole('listbox').parentElement as HTMLElement

beforeEach(() => {
  rect = { top: 100, bottom: 140, left: 50, right: 250, width: 200, height: 40, x: 50, y: 100 }
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({ ...rect, toJSON: () => rect }) as DOMRect)
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024 })
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 768 })
})
afterEach(() => { cleanup(); vi.restoreAllMocks() })

describe('Combobox with portal: the dropdown follows the field', () => {
  it('places the dropdown under the field on focus', () => {
    mount()
    fireEvent.focus(screen.getByRole('combobox'))
    expect(panel().style.position).toBe('fixed')
    expect(panel().style.top).toBe('144px')
    expect(panel().style.left).toBe('50px')
  })

  it('places it at the field\'s new rectangle when a typed key reopens it after Escape and the field has moved', () => {
    mount()
    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    expect(panel().style.top).toBe('144px')

    fireEvent.keyDown(input, { key: 'Escape' })
    expect(screen.queryByRole('listbox')).toBeNull()

    moveFieldTo(300, 120)
    fireEvent.change(input, { target: { value: 'tir' } })

    expect(panel().style.top).toBe('344px')
    expect(panel().style.left).toBe('120px')
  })

  it('also places it when the first thing the person does is type', () => {
    moveFieldTo(200, 80)
    mount()
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'd' } })
    expect(panel().style.top).toBe('244px')
    expect(panel().style.left).toBe('80px')
  })
})
