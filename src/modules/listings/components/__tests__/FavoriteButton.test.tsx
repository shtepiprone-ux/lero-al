import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { FavoriteButton } from '../FavoriteButton'

// ── Stubs ─────────────────────────────────────────────────────────────────────

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

const mockAddFavorite = vi.fn()
const mockRemoveFavorite = vi.fn()
vi.mock('@/modules/listings/actions/favoriteActions', () => ({
  addFavorite: (...args: unknown[]) => mockAddFavorite(...args),
  removeFavorite: (...args: unknown[]) => mockRemoveFavorite(...args),
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
    mockAddFavorite.mockResolvedValue({ isFavorited: true })
    mockRemoveFavorite.mockResolvedValue({ isFavorited: false })
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
    let resolveAdd!: (val: { isFavorited: boolean }) => void
    mockAddFavorite.mockReturnValue(new Promise(r => { resolveAdd = r }))

    renderButton({ isFavorited: false })
    fireEvent.click(getButton())

    // Optimistic: flips immediately before server responds
    expect(getButton()).toHaveAttribute('aria-pressed', 'true')

    await act(async () => { resolveAdd({ isFavorited: true }) })
    expect(getButton()).toHaveAttribute('aria-pressed', 'true')
  })

  it('rolls back to previous state on server error', async () => {
    mockAddFavorite.mockResolvedValue({ error: 'network error' })

    renderButton({ isFavorited: false })
    await act(async () => { fireEvent.click(getButton()) })

    expect(getButton()).toHaveAttribute('aria-pressed', 'false')
  })

  it('calls onToggled with server-confirmed state', async () => {
    const onToggled = vi.fn()

    renderButton({ isFavorited: false, onToggled })
    await act(async () => { fireEvent.click(getButton()) })

    expect(onToggled).toHaveBeenCalledWith(true)
  })

  it('external prop update during pending transition does NOT override optimistic state (isPendingRef guard)', async () => {
    // Sequence: click (optimistic=true) → external prop update (false) while pending
    // Expected: button stays optimistically true until server settles
    let resolveAdd!: (val: { isFavorited: boolean }) => void
    mockAddFavorite.mockReturnValue(new Promise(r => { resolveAdd = r }))

    const { rerender } = renderButton({ isFavorited: false })

    // Start transition (optimistic: true, isPending: true)
    fireEvent.click(getButton())
    expect(getButton()).toHaveAttribute('aria-pressed', 'true')

    // External prop update arrives while pending — isPendingRef guard should block sync
    await act(async () => {
      rerender(<FavoriteButton listingId="test-id" isFavorited={false} />)
    })

    // Optimistic state must survive: button still shows true
    expect(getButton()).toHaveAttribute('aria-pressed', 'true')

    // Settle transition
    await act(async () => { resolveAdd({ isFavorited: true }) })
    expect(getButton()).toHaveAttribute('aria-pressed', 'true')
  })

  it('converges to server truth after transition settles', async () => {
    let resolveAdd!: (val: { isFavorited: boolean }) => void
    mockAddFavorite.mockReturnValue(new Promise(r => { resolveAdd = r }))

    const onToggled = vi.fn()
    const { rerender } = renderButton({ isFavorited: false, onToggled })

    fireEvent.click(getButton())
    expect(getButton()).toHaveAttribute('aria-pressed', 'true')

    await act(async () => { resolveAdd({ isFavorited: true }) })
    // Simulate parent acknowledging onToggled → prop updates to true
    await act(async () => {
      rerender(<FavoriteButton listingId="test-id" isFavorited={true} onToggled={onToggled} />)
    })

    expect(getButton()).toHaveAttribute('aria-pressed', 'true')
    expect(onToggled).toHaveBeenCalledWith(true)
  })
})
