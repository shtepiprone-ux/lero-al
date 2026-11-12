/**
 * Task 965 Review 2: Testing Library's `findBy*` and `waitFor` waited 1 000 ms (its default) in every test file. On a loaded machine a component's first
 * render can take longer, so `ListingDetailView.contactSession.security.test.tsx` failed at random while a CI-shaped run used the same machine ("Unable to
 * find role=button and name Show number", 2 138 ms) and passed alone. `src/tests/setup.ts` sets one wait for the whole suite; a wait that ends in a pass returns
 * as soon as the element is there, so only a test that would fail waits longer.
 */
import React, { useEffect, useState } from 'react'
import { describe, expect, it } from 'vitest'
import { getConfig } from '@testing-library/dom'
import { render, screen } from '@testing-library/react'

function AppearsLater({ after }: { after: number }) {
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setShown(true), after)
    return () => clearTimeout(timer)
  }, [after])
  return shown ? <button type="button">Ready</button> : null
}

describe('the suite-wide wait of findBy and waitFor', () => {
  it('is 5 000 ms', () => {
    expect(getConfig().asyncUtilTimeout).toBe(5000)
  })

  it('a button that appears after 1 500 ms is found', async () => {
    render(<AppearsLater after={1500} />)
    expect(await screen.findByRole('button', { name: 'Ready' })).toBeInTheDocument()
  })
})
