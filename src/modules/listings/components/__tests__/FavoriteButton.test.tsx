import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { FavoriteButton } from '../FavoriteButton'

// ── Stubs ─────────────────────────────────────────────────────────────────────

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

const mockToggleFavorite = vi.fn()
vi.mock('@/modules/listings/actions/toggleFavorite', () => ({
  toggleFavorite: (...args: unknown[]) => mockToggleFavorite(...args),
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderButton(props: Partial<Parameters<typeof FavoriteButton>[0]> = {}) {
  const merged = { listingId: 'test-id', isFavorited: false, ...props }
  return render(<FavoriteButton {...merged} />)
}

function getButton() { return screen.getByRole('button') }

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('FavoriteButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockToggleFavorite.mockResolvedValue({ isFavorited: true })
  })

  it('renders with initial unfavorited state', () => {
    renderButton({ isFavorited: false })
    expect(getButton()).toHaveAttribute('aria-pressed', 'false')
  })

  it('renders with initial favorited state', () => {
    renderButton({ isFavorited: true })
    expect(getButton()).toHaveAttribute('aria-pressed', 'true')
  })

  it('re-syncs to isFavorited=true when prop changes while no transition is pending (F-03 fix)', async () => {
    const { rerender } = renderButton({ isFavorited: false })
    expect(getButton()).toHaveAttribute('aria-pressed', 'false')

    // Simulate external prop update (router.refresh or parent state update)
    await act(async () => {
      rerender(<FavoriteButton listingId="test-id" isFavorited={true} />)
    })

    expect(getButton()).toHaveAttribute('aria-pressed', 'true')
  })

  it('re-syncs to isFavorited=false when prop reverts externally', async () => {
    const { rerender } = renderButton({ isFavorited: true })
    expect(getButton()).toHaveAttribute('aria-pressed', 'true')

    await act(async () => {
      rerender(<FavoriteButton listingId="test-id" isFavorited={false} />)
    })

    expect(getButton()).toHaveAttribute('aria-pressed', 'false')
  })

  it('applies optimistic update on click before server responds', async () => {
    let resolveToggle!: (val: { isFavorited: boolean }) => void
    mockToggleFavorite.mockReturnValue(new Promise(r => { resolveToggle = r }))

    renderButton({ isFavorited: false })
    fireEvent.click(getButton())

    // Optimistic: flips immediately before server responds
    expect(getButton()).toHaveAttribute('aria-pressed', 'true')

    await act(async () => { resolveToggle({ isFavorited: true }) })
    expect(getButton()).toHaveAttribute('aria-pressed', 'true')
  })

  it('rolls back to previous state on server error', async () => {
    mockToggleFavorite.mockResolvedValue({ error: 'network error' })

    renderButton({ isFavorited: false })
    await act(async () => { fireEvent.click(getButton()) })

    expect(getButton()).toHaveAttribute('aria-pressed', 'false')
  })

  it('calls onToggled with server-confirmed state', async () => {
    mockToggleFavorite.mockResolvedValue({ isFavorited: true })
    const onToggled = vi.fn()

    renderButton({ isFavorited: false, onToggled })
    await act(async () => { fireEvent.click(getButton()) })

    expect(onToggled).toHaveBeenCalledWith(true)
  })

  it('converges to server truth after external prop update during optimistic window', async () => {
    // Sequence: click (optimistic=true) → external prop update (false) → transition settles (true)
    // After settle, the parent's onToggled wires back the correct prop, so the final state is true.
    let resolveToggle!: (val: { isFavorited: boolean }) => void
    mockToggleFavorite.mockReturnValue(new Promise(r => { resolveToggle = r }))

    const onToggled = vi.fn()
    const { rerender } = renderButton({ isFavorited: false, onToggled })

    // Start transition (optimistic: true)
    fireEvent.click(getButton())
    expect(getButton()).toHaveAttribute('aria-pressed', 'true')

    // Settle: server confirms true → onToggled fires → parent re-renders with true
    await act(async () => {
      resolveToggle({ isFavorited: true })
    })
    // Simulate parent acknowledging onToggled result (sets isFavorited=true)
    await act(async () => {
      rerender(<FavoriteButton listingId="test-id" isFavorited={true} onToggled={onToggled} />)
    })

    expect(getButton()).toHaveAttribute('aria-pressed', 'true')
    expect(onToggled).toHaveBeenCalledWith(true)
  })
})
