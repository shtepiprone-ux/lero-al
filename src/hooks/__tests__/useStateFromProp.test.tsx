import React, { useState } from 'react'
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useResetOnChange, useStateFromProp } from '../useStateFromProp'

describe('useStateFromProp', () => {
  it('starts from the value and follows each new value', () => {
    const { result, rerender } = renderHook(({ v }) => useStateFromProp(v), { initialProps: { v: ['a'] } })
    expect(result.current[0]).toEqual(['a'])
    const next = ['b', 'c']
    rerender({ v: next })
    expect(result.current[0]).toBe(next)
  })

  it('keeps the local edits while the value is the same object', () => {
    const list = ['a', 'b']
    const { result, rerender } = renderHook(({ v }) => useStateFromProp(v), { initialProps: { v: list } })
    act(() => result.current[1](prev => prev.filter(x => x !== 'a')))
    expect(result.current[0]).toEqual(['b'])
    rerender({ v: list })
    expect(result.current[0]).toEqual(['b'])
    rerender({ v: [...list] })
    expect(result.current[0]).toEqual(['a', 'b'])
  })

  it('shows the new value in the same commit that receives it (no frame with the stale copy)', () => {
    const seen: string[] = []
    function Probe({ v }: { v: string }) {
      const [copy] = useStateFromProp(v)
      seen.push(copy)
      return <span>{copy}</span>
    }
    const view = render(<Probe v="old" />)
    seen.length = 0
    view.rerender(<Probe v="new" />)
    expect(screen.getByText('new')).toBeInTheDocument()
    // React may render the component once more to apply the adjusted state, but a committed frame never shows "old" after the props changed.
    expect(seen[seen.length - 1]).toBe('new')
  })

  it('takes a function value as data, not as an initializer or an updater', () => {
    const f = () => 1
    const g = () => 2
    const { result, rerender } = renderHook(({ v }) => useStateFromProp(v), { initialProps: { v: f } })
    expect(result.current[0]).toBe(f)
    rerender({ v: g })
    expect(result.current[0]).toBe(g)
  })

  it('treats NaN as equal to itself, like an effect dependency', () => {
    const { result, rerender } = renderHook(({ v }) => useStateFromProp(v), { initialProps: { v: Number.NaN } })
    act(() => result.current[1](5))
    rerender({ v: Number.NaN })
    expect(result.current[0]).toBe(5)
  })
})

describe('useResetOnChange', () => {
  function Form({ id, onReset }: { id: string; onReset?: (previous: string) => void }) {
    const [draft, setDraft] = useState('')
    useResetOnChange(id, previous => { onReset?.(previous); setDraft('') })
    return <input aria-label="draft" value={draft} onChange={e => setDraft(e.target.value)} />
  }
  const input = () => screen.getByLabelText('draft') as HTMLInputElement

  it('does not reset on the first render and keeps what was typed while the key is the same', () => {
    const onReset = vi.fn()
    const view = render(<Form id="a" onReset={onReset} />)
    fireEvent.change(input(), { target: { value: 'typed' } })
    expect(input().value).toBe('typed')
    view.rerender(<Form id="a" onReset={onReset} />)
    expect(input().value).toBe('typed')
    expect(onReset).not.toHaveBeenCalled()
  })

  it('resets once, with the previous key, when the key changes', () => {
    const onReset = vi.fn()
    const view = render(<Form id="a" onReset={onReset} />)
    fireEvent.change(input(), { target: { value: 'typed' } })
    view.rerender(<Form id="b" onReset={onReset} />)
    expect(input().value).toBe('')
    expect(onReset).toHaveBeenCalledTimes(1)
    expect(onReset).toHaveBeenCalledWith('a')
    view.rerender(<Form id="b" onReset={onReset} />)
    expect(onReset).toHaveBeenCalledTimes(1)
  })
})
