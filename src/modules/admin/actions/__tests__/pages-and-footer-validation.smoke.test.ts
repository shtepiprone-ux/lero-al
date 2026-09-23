/**
 * pages-and-footer-validation.smoke.test.ts — Task 867 (Sprint 79), R4/R5/R7.
 *
 * Covers:
 *   - upsertFooterContent (R4): a published CMS slug saves with its locale's social links;
 *     an unpublished/unknown slug rejects the whole locale payload; a disabled bad link does
 *     not block the save; a `pages` lookup error returns `transient` with no upsert.
 *   - createPage / updatePage (R5): `sq_body_required` on a publish with an empty Albanian
 *     body, in both the content-supplied and content-omitted forms; drafts and non-empty
 *     publishes are unaffected.
 *   - R7 write-path actor assertion: createPage, updatePage, deletePage and
 *     upsertFooterContent all write through createAdminClient() (service role), never
 *     through the user-scoped client.
 *
 * Command: npx vitest run src/modules/admin/actions/__tests__/pages-and-footer-validation.smoke.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { FooterLink, SiteFooter } from '@/types/database'

// ── Module mocks (hoisted before any imports) ─────────────────────────────────

const mockGetUser = vi.fn()
vi.mock('@/lib/auth/server', () => ({
  getUser: (...args: unknown[]) => mockGetUser(...args),
}))

// User-scoped client — used only by footer's assertAdminUser role check.
const mockRoleSingle = vi.fn()
const mockCreateClient = vi.fn()
vi.mock('@/lib/supabase/server', () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}))

vi.mock('@/lib/auth/permissions', () => ({
  assertPermission: vi.fn().mockResolvedValue(undefined),
  hasPermission: vi.fn().mockResolvedValue(true),
  roleHasPermission: vi.fn().mockReturnValue(true),
}))

// Side-effect prevention — imported by index.ts but not under test here.
vi.mock('@/modules/notifications/lib/mutations', () => ({
  createNotification: vi.fn().mockResolvedValue({}),
}))
vi.mock('@/modules/listings/actions/applyListingTransition', () => ({
  applyListingTransitionByStatus: vi.fn().mockResolvedValue({ ok: true }),
}))

// ── Admin (service-role) client — a chainable builder that dispatches by `select(cols)` ──

const mockSlugCheckSingle = vi.fn()     // pages: select('id')...maybeSingle() — slug uniqueness
const mockContentReadSingle = vi.fn()   // pages: select('content')...maybeSingle() — R5 stored-content read
const mockCmsBatchSelect = vi.fn()      // pages: select('slug').in(...).eq('is_published', true) — R4 resolver
const mockCmsBatchIn = vi.fn()          // records the .in('slug', [...]) call args on that same chain
const mockCmsBatchEq = vi.fn()          // records the .eq('is_published', true) call args on that same chain
const mockPageInsert = vi.fn()          // pages: insert(...)
const mockPageUpdateEq = vi.fn()        // pages: update(...).eq(...)
const mockPageDeleteEq = vi.fn()        // pages: delete().eq(...)
const mockFooterUpsert = vi.fn()        // site_footer: upsert(...)
const mockCreateAdminClient = vi.fn()

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: (...args: unknown[]) => mockCreateAdminClient(...args),
}))

// review 1 (F2): the previous builder's `eq()`/`in()` dropped their arguments, so removing
// R4's `.eq('is_published', true)` or `.in('slug', …)` filter from footer.ts would still pass
// every test. `eq`/`in` now record their args ONLY on the select('slug') (CMS-batch) chain —
// the same two methods are also used by the slug-uniqueness and content-read chains, which
// must stay untracked so those call counts don't leak into the R4 assertions.
function makePagesBuilder() {
  let resolver = mockSlugCheckSingle
  let onCmsBatchChain = false
  const builder = {
    select(cols: string) {
      if (cols === 'content') { resolver = mockContentReadSingle; onCmsBatchChain = false }
      else if (cols === 'slug') { resolver = mockCmsBatchSelect; onCmsBatchChain = true }
      else { resolver = mockSlugCheckSingle; onCmsBatchChain = false }
      return builder
    },
    eq(...args: unknown[]) {
      if (onCmsBatchChain) mockCmsBatchEq(...args)
      return builder
    },
    neq() { return builder },
    in(...args: unknown[]) {
      if (onCmsBatchChain) mockCmsBatchIn(...args)
      return builder
    },
    maybeSingle() { return resolver() },
    then(onFulfilled: (v: unknown) => unknown, onRejected?: (e: unknown) => unknown) {
      return Promise.resolve(resolver()).then(onFulfilled, onRejected)
    },
    insert: (payload: unknown) => mockPageInsert(payload),
    update: (patch: unknown) => ({ eq: (...args: unknown[]) => mockPageUpdateEq(patch, ...args) }),
    delete: () => ({ eq: (...args: unknown[]) => mockPageDeleteEq(...args) }),
  }
  return builder
}

function makeAdminFrom(table: string) {
  if (table === 'pages') return makePagesBuilder()
  if (table === 'site_footer') return { upsert: (payload: unknown, opts: unknown) => mockFooterUpsert(payload, opts) }
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null }),
  }
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const ADMIN_ID = 'admin-user-1'

function link(overrides: Partial<FooterLink>): FooterLink {
  return { id: 'l1', label: 'Link', url: '/', enabled: true, order: 0, ...overrides }
}

const EMPTY_FOOTER_PAYLOAD: Omit<SiteFooter, 'locale' | 'updated_at' | 'updated_by'> = {
  brand_title: 'Lero.al',
  tagline: 'Tagline',
  nav_section_title: 'Navigation',
  nav_links: [],
  info_section_title: 'Info',
  info_links: [],
  social_section_title: 'Social',
  social_links: [],
  copyright_template: '© {year}',
}

beforeEach(() => {
  vi.clearAllMocks()

  mockGetUser.mockResolvedValue({ id: ADMIN_ID })
  mockRoleSingle.mockResolvedValue({ data: { role: 'admin' } })
  mockCreateClient.mockResolvedValue({
    from: () => ({ select: () => ({ eq: () => ({ single: mockRoleSingle }) }) }),
  })

  mockCreateAdminClient.mockImplementation(() => ({
    from: (table: string) => makeAdminFrom(table),
  }))

  mockSlugCheckSingle.mockResolvedValue({ data: null })
  mockContentReadSingle.mockResolvedValue({ data: null })
  mockCmsBatchSelect.mockResolvedValue({ data: [], error: null })
  mockPageInsert.mockResolvedValue({ error: null })
  mockPageUpdateEq.mockResolvedValue({ error: null })
  mockPageDeleteEq.mockResolvedValue({ error: null })
  mockFooterUpsert.mockResolvedValue({ error: null })
})

// ══════════════════════════════════════════════════════════════════════════════
// R4 — upsertFooterContent CMS slug resolution
// ══════════════════════════════════════════════════════════════════════════════

describe('upsertFooterContent — CMS slug existence (R4)', () => {
  it('positive — a published CMS slug saves and its social_links reach the upsert', async () => {
    mockCmsBatchSelect.mockResolvedValue({ data: [{ slug: 'privacy-policy' }], error: null })
    const { upsertFooterContent } = await import('../footer')

    const social = [link({ id: 's1', url: 'https://facebook.com/lero' })]
    const result = await upsertFooterContent('en', {
      ...EMPTY_FOOTER_PAYLOAD,
      info_links: [link({ id: 'i1', url: '/privacy-policy' })],
      social_links: social,
    })

    expect(result).toEqual({})
    expect(mockCmsBatchSelect).toHaveBeenCalled()
    expect(mockFooterUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ social_links: social }),
      { onConflict: 'locale' },
    )
  })

  it('negative — an unpublished slug rejects the whole payload, no upsert', async () => {
    mockCmsBatchSelect.mockResolvedValue({ data: [], error: null }) // slug exists but is_published=false is filtered out
    const { upsertFooterContent } = await import('../footer')

    const result = await upsertFooterContent('en', {
      ...EMPTY_FOOTER_PAYLOAD,
      info_links: [link({ id: 'i1', url: '/draft-page' })],
      social_links: [link({ id: 's1', url: 'https://facebook.com/lero' })],
    })

    expect(result).toEqual({ error: 'invalid_internal_link' })
    expect(mockFooterUpsert).not.toHaveBeenCalled()
  })

  it('negative — a nonexistent slug rejects the whole payload, no upsert', async () => {
    mockCmsBatchSelect.mockResolvedValue({ data: [], error: null })
    const { upsertFooterContent } = await import('../footer')

    const result = await upsertFooterContent('en', {
      ...EMPTY_FOOTER_PAYLOAD,
      info_links: [link({ id: 'i1', url: '/does-not-exist' })],
    })

    expect(result).toEqual({ error: 'invalid_internal_link' })
    expect(mockFooterUpsert).not.toHaveBeenCalled()
  })

  it('a disabled link with a bad URL does not block the save', async () => {
    const { upsertFooterContent } = await import('../footer')

    const result = await upsertFooterContent('en', {
      ...EMPTY_FOOTER_PAYLOAD,
      info_links: [link({ id: 'i1', url: '/some/deep/bad/path', enabled: false })],
    })

    expect(result).toEqual({})
    expect(mockCmsBatchSelect).not.toHaveBeenCalled() // disabled link never becomes a candidate
    expect(mockFooterUpsert).toHaveBeenCalled()
  })

  it('a pages lookup error returns transient, no upsert', async () => {
    mockCmsBatchSelect.mockResolvedValue({ data: null, error: { code: '500', message: 'boom' } })
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { upsertFooterContent } = await import('../footer')

    const result = await upsertFooterContent('en', {
      ...EMPTY_FOOTER_PAYLOAD,
      info_links: [link({ id: 'i1', url: '/privacy-policy' })],
    })

    expect(result).toEqual({ error: 'transient' })
    expect(mockFooterUpsert).not.toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it('R7 — the upsert is issued through the service-role client, not the user client', async () => {
    mockCmsBatchSelect.mockResolvedValue({ data: [{ slug: 'privacy-policy' }], error: null })
    const { upsertFooterContent } = await import('../footer')

    await upsertFooterContent('en', {
      ...EMPTY_FOOTER_PAYLOAD,
      info_links: [link({ id: 'i1', url: '/privacy-policy' })],
    })

    expect(mockFooterUpsert).toHaveBeenCalled()
    // The user-scoped client (createClient) is used only for the role check, never for the write.
    expect(mockCreateClient).toHaveBeenCalledTimes(1)
  })

  it('review-1 F2 — one batched lookup with the distinct candidate slug set, excluding a duplicate and a static path', async () => {
    mockCmsBatchSelect.mockResolvedValue({
      data: [{ slug: 'privacy-policy' }, { slug: 'about' }],
      error: null,
    })
    const { upsertFooterContent } = await import('../footer')

    const result = await upsertFooterContent('en', {
      ...EMPTY_FOOTER_PAYLOAD,
      nav_links: [link({ id: 'n1', url: '/privacy-policy' })],       // duplicate candidate slug
      info_links: [
        link({ id: 'i1', url: '/privacy-policy' }),
        link({ id: 'i2', url: '/about' }),
        link({ id: 'i3', url: '/contact' }),                        // static — never a candidate
      ],
    })

    expect(result).toEqual({})
    expect(mockCmsBatchIn).toHaveBeenCalledTimes(1)
    const [col, slugs] = mockCmsBatchIn.mock.calls[0] as [string, string[]]
    expect(col).toBe('slug')
    expect([...slugs].sort()).toEqual(['about', 'privacy-policy'])
    expect(mockCmsBatchEq).toHaveBeenCalledWith('is_published', true)
  })

  it('review-1 F1 — an unauthenticated caller gets forbidden before any pages lookup or upsert', async () => {
    mockGetUser.mockResolvedValue(null)
    const { upsertFooterContent } = await import('../footer')

    const result = await upsertFooterContent('en', {
      ...EMPTY_FOOTER_PAYLOAD,
      info_links: [link({ id: 'i1', url: '/privacy-policy' })],
    })

    expect(result).toEqual({ error: 'forbidden' })
    expect(mockCmsBatchSelect).not.toHaveBeenCalled()
    expect(mockFooterUpsert).not.toHaveBeenCalled()
  })

  it('review-1 F1 — a non-admin caller gets forbidden before any pages lookup or upsert', async () => {
    mockRoleSingle.mockResolvedValue({ data: { role: 'user' } })
    const { upsertFooterContent } = await import('../footer')

    const result = await upsertFooterContent('en', {
      ...EMPTY_FOOTER_PAYLOAD,
      info_links: [link({ id: 'i1', url: '/privacy-policy' })],
    })

    expect(result).toEqual({ error: 'forbidden' })
    expect(mockCmsBatchSelect).not.toHaveBeenCalled()
    expect(mockFooterUpsert).not.toHaveBeenCalled()
  })

  it('review-1 R4 shape arm — a shape-invalid deep path is rejected without a DB call', async () => {
    const { upsertFooterContent } = await import('../footer')

    const result = await upsertFooterContent('en', {
      ...EMPTY_FOOTER_PAYLOAD,
      info_links: [link({ id: 'i1', url: '/some/deep/path' })],
    })

    expect(result).toEqual({ error: 'invalid_internal_link' })
    expect(mockCmsBatchSelect).not.toHaveBeenCalled()
    expect(mockFooterUpsert).not.toHaveBeenCalled()
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// R5 — createPage / updatePage sq_body_required guard
// ══════════════════════════════════════════════════════════════════════════════

const CONTENT_EMPTY_BODY = {
  sq: { title: 'Title', body: '   ' },
  en: { title: 'Title', body: 'Body' },
  uk: { title: 'Title', body: 'Body' },
  it: { title: 'Title', body: 'Body' },
}
const CONTENT_NON_EMPTY_BODY = {
  sq: { title: 'Title', body: 'Perembajtja shqip' },
  en: { title: 'Title', body: 'Body' },
  uk: { title: 'Title', body: 'Body' },
  it: { title: 'Title', body: 'Body' },
}

describe('createPage — sq_body_required (R5)', () => {
  it('publish with an empty sq body → sq_body_required, no insert', async () => {
    const { createPage } = await import('../index')
    const result = await createPage({
      title: 'Privacy', slug: 'privacy-policy', content: CONTENT_EMPTY_BODY, is_published: true,
    })

    expect(result).toEqual({ error: 'sq_body_required' })
    expect(mockPageInsert).not.toHaveBeenCalled()
  })

  it('publish with a non-empty sq body → succeeds', async () => {
    const { createPage } = await import('../index')
    const result = await createPage({
      title: 'Privacy', slug: 'privacy-policy', content: CONTENT_NON_EMPTY_BODY, is_published: true,
    })

    expect(result).toEqual({})
    expect(mockPageInsert).toHaveBeenCalled()
  })

  it('draft save with an empty sq body → succeeds, unchanged', async () => {
    const { createPage } = await import('../index')
    const result = await createPage({
      title: 'Privacy', slug: 'privacy-policy', content: CONTENT_EMPTY_BODY, is_published: false,
    })

    expect(result).toEqual({})
    expect(mockPageInsert).toHaveBeenCalled()
  })

  it('R7 — insert is issued through the service-role admin client', async () => {
    const { createPage } = await import('../index')
    await createPage({
      title: 'Privacy', slug: 'privacy-policy', content: CONTENT_NON_EMPTY_BODY, is_published: true,
    })

    expect(mockCreateAdminClient).toHaveBeenCalled()
    expect(mockPageInsert).toHaveBeenCalled()
    expect(mockCreateClient).not.toHaveBeenCalled()
  })
})

describe('updatePage — sq_body_required (R5)', () => {
  it('publish with content supplied and an empty sq body → sq_body_required, no update', async () => {
    const { updatePage } = await import('../index')
    const result = await updatePage(1, { content: CONTENT_EMPTY_BODY, is_published: true })

    expect(result).toEqual({ error: 'sq_body_required' })
    expect(mockPageUpdateEq).not.toHaveBeenCalled()
  })

  it('publish with content NOT supplied → reads stored content first; empty stored body → sq_body_required', async () => {
    mockContentReadSingle.mockResolvedValue({ data: { content: CONTENT_EMPTY_BODY } })
    const { updatePage } = await import('../index')
    const result = await updatePage(1, { is_published: true })

    expect(result).toEqual({ error: 'sq_body_required' })
    expect(mockContentReadSingle).toHaveBeenCalled()
    expect(mockPageUpdateEq).not.toHaveBeenCalled()
  })

  it('publish with content NOT supplied and a non-empty stored body → succeeds', async () => {
    mockContentReadSingle.mockResolvedValue({ data: { content: CONTENT_NON_EMPTY_BODY } })
    const { updatePage } = await import('../index')
    const result = await updatePage(1, { is_published: true })

    expect(result).toEqual({})
    expect(mockPageUpdateEq).toHaveBeenCalled()
  })

  it('draft save with an empty sq body → succeeds, unchanged', async () => {
    const { updatePage } = await import('../index')
    const result = await updatePage(1, { content: CONTENT_EMPTY_BODY, is_published: false })

    expect(result).toEqual({})
    expect(mockPageUpdateEq).toHaveBeenCalled()
  })

  it('publish with a non-empty sq body, content supplied → succeeds', async () => {
    const { updatePage } = await import('../index')
    const result = await updatePage(1, { content: CONTENT_NON_EMPTY_BODY, is_published: true })

    expect(result).toEqual({})
    expect(mockPageUpdateEq).toHaveBeenCalled()
  })

  it('R7 — update is issued through the service-role admin client', async () => {
    const { updatePage } = await import('../index')
    await updatePage(1, { content: CONTENT_NON_EMPTY_BODY, is_published: true })

    expect(mockCreateAdminClient).toHaveBeenCalled()
    expect(mockPageUpdateEq).toHaveBeenCalled()
    expect(mockCreateClient).not.toHaveBeenCalled()
  })
})

describe('deletePage — R7 write-path actor assertion', () => {
  it('delete is issued through the service-role admin client', async () => {
    const { deletePage } = await import('../index')
    const result = await deletePage(1)

    expect(result).toEqual({})
    expect(mockCreateAdminClient).toHaveBeenCalled()
    expect(mockPageDeleteEq).toHaveBeenCalled()
    expect(mockCreateClient).not.toHaveBeenCalled()
  })
})
