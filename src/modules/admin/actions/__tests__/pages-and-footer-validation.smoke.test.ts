/**
 * pages-and-footer-validation.smoke.test.ts — Task 867 (Sprint 79), R4/R5/R7.
 *
 * Covers:
 *   - upsertFooterContent (R4): a published CMS slug saves, and the upsert carries no social
 *     links (Task 989: the shared list is saved by saveFooterShared); an unpublished/unknown slug rejects the whole locale payload; a disabled bad link does
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

// User-scoped client — no action under test uses it any more: since Task 923 R44 / R71 (k) the footer's role check (`checkStaff` → `requireViewer`) reads the caller's own
// row with the service-role client (`mockRoleSingle` below, behind `makeAdminFrom('users')`).
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
vi.mock('@/modules/notifications/lib/createNotification', () => ({
  createNotification: vi.fn().mockResolvedValue({}),
}))
vi.mock('@/modules/listings/actions/applyListingTransition', () => ({
  applyListingTransitionByStatus: vi.fn().mockResolvedValue({ ok: true }),
}))

// ── Admin (service-role) client — a chainable builder that dispatches by `select(cols)` ──

const mockSlugCheckSingle = vi.fn()     // pages: select('id')...maybeSingle() — slug uniqueness
const mockContentReadSingle = vi.fn()   // pages: select('content')...maybeSingle() — R5 stored-content read
const mockStoredPageSingle = vi.fn()    // pages: select('id, slug').eq('id', …).maybeSingle() — Task 990: the stored address a footer link may name
const mockFooterSelect = vi.fn()        // site_footer: select('locale, nav_links, info_links, social_links') — Task 990: the footer links of the four rows
const mockCmsBatchSelect = vi.fn()      // pages: select('slug').in(...).eq('is_published', true) — R4 resolver
const mockCmsBatchIn = vi.fn()          // records the .in('slug', [...]) call args on that same chain
const mockCmsBatchEq = vi.fn()          // records the .eq('is_published', true) call args on that same chain
const mockPageInsert = vi.fn()          // pages: insert(...)
const mockPageUpdateEq = vi.fn()        // pages: update(...).eq(...)
const mockPageDeleteEq = vi.fn()        // pages: delete().eq(...)
const mockFooterUpsert = vi.fn()        // site_footer: upsert(...)
const mockFooterUpdate = vi.fn()        // site_footer: update(...).in(...) — saveFooterShared's social list (Task 989)
const mockSettingsUpsert = vi.fn()      // site_settings: upsert(...) — saveFooterShared's contacts and switches (Task 989)
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
      else if (cols === 'id, slug') { resolver = mockStoredPageSingle; onCmsBatchChain = false }
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
  if (table === 'site_footer') return {
    select: (cols: string) => mockFooterSelect(cols),
    upsert: (payload: unknown, opts: unknown) => mockFooterUpsert(payload, opts),
    update: (patch: unknown) => ({ in: (...args: unknown[]) => mockFooterUpdate(patch, ...args) }),
  }
  if (table === 'site_settings') return { upsert: (payload: unknown, opts: unknown) => mockSettingsUpsert(payload, opts) }
  if (table === 'users') return { select: () => ({ eq: () => ({ maybeSingle: mockRoleSingle }) }) }
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

const EMPTY_FOOTER_PAYLOAD: Omit<SiteFooter, 'locale' | 'updated_at' | 'updated_by' | 'social_links'> = {
  brand_title: 'Lero.al',
  tagline: 'Tagline',
  nav_section_title: 'Navigation',
  nav_links: [],
  info_section_title: 'Info',
  info_links: [],
  social_section_title: 'Social',
  copyright_template: '© {year}',
}

beforeEach(() => {
  vi.clearAllMocks()

  mockGetUser.mockResolvedValue({ id: ADMIN_ID })
  mockRoleSingle.mockResolvedValue({ data: { role: 'admin', status: 'active', suspended_until: null, deleted_at: null }, error: null })
  mockCreateClient.mockResolvedValue({})

  mockCreateAdminClient.mockImplementation(() => ({
    from: (table: string) => makeAdminFrom(table),
  }))

  mockSlugCheckSingle.mockResolvedValue({ data: null })
  mockContentReadSingle.mockResolvedValue({ data: null })
  mockStoredPageSingle.mockResolvedValue({ data: { id: 1, slug: 'about' }, error: null })
  mockFooterSelect.mockResolvedValue({ data: [], error: null })
  mockCmsBatchSelect.mockResolvedValue({ data: [], error: null })
  mockPageInsert.mockResolvedValue({ error: null })
  mockPageUpdateEq.mockResolvedValue({ error: null })
  mockPageDeleteEq.mockResolvedValue({ error: null })
  mockFooterUpsert.mockResolvedValue({ error: null })
  mockFooterUpdate.mockResolvedValue({ error: null })
  mockSettingsUpsert.mockResolvedValue({ error: null })
})

// ══════════════════════════════════════════════════════════════════════════════
// R4 — upsertFooterContent CMS slug resolution
// ══════════════════════════════════════════════════════════════════════════════

describe('upsertFooterContent — CMS slug existence (R4)', () => {
  it('positive — a published CMS slug saves, and the upsert carries no social_links (Task 989: saveFooterShared saves them)', async () => {
    mockCmsBatchSelect.mockResolvedValue({ data: [{ slug: 'privacy-policy' }], error: null })
    const { upsertFooterContent } = await import('../footer')

    const result = await upsertFooterContent('en', {
      ...EMPTY_FOOTER_PAYLOAD,
      info_links: [link({ id: 'i1', url: '/privacy-policy' })],
    })

    expect(result).toEqual({})
    expect(mockCmsBatchSelect).toHaveBeenCalled()
    expect(mockFooterUpsert).toHaveBeenCalledWith(expect.any(Object), { onConflict: 'locale' })
    expect(mockFooterUpsert.mock.calls[0][0]).not.toHaveProperty('social_links')
  })

  it('negative — an unpublished slug rejects the whole payload, no upsert', async () => {
    mockCmsBatchSelect.mockResolvedValue({ data: [], error: null }) // slug exists but is_published=false is filtered out
    const { upsertFooterContent } = await import('../footer')

    const result = await upsertFooterContent('en', {
      ...EMPTY_FOOTER_PAYLOAD,
      info_links: [link({ id: 'i1', url: '/draft-page' })],
    })

    expect(result).toEqual({ error: 'invalid_internal_link', links: ['/draft-page'] }) // Task 990: the refused address is named
    expect(mockFooterUpsert).not.toHaveBeenCalled()
  })

  it('negative — a nonexistent slug rejects the whole payload, no upsert', async () => {
    mockCmsBatchSelect.mockResolvedValue({ data: [], error: null })
    const { upsertFooterContent } = await import('../footer')

    const result = await upsertFooterContent('en', {
      ...EMPTY_FOOTER_PAYLOAD,
      info_links: [link({ id: 'i1', url: '/does-not-exist' })],
    })

    expect(result).toEqual({ error: 'invalid_internal_link', links: ['/does-not-exist'] }) // Task 990
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
    // The user-scoped client (createClient) is used for nothing: the role check is a service-role read of the caller's own row (Task 923 R44), and so is the write.
    expect(mockCreateClient).not.toHaveBeenCalled()
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
    mockRoleSingle.mockResolvedValue({ data: { role: 'user', status: 'active', suspended_until: null, deleted_at: null }, error: null })
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

    expect(result).toEqual({ error: 'invalid_internal_link', links: ['/some/deep/path'] }) // Task 990
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

  it('Task 868 (R18) — publish with an empty rich-text body <p></p> → sq_body_required, no insert', async () => {
    const { createPage } = await import('../index')
    const result = await createPage({
      title: 'Privacy', slug: 'privacy-policy',
      content: { ...CONTENT_EMPTY_BODY, sq: { title: 'Title', body: '<p></p>' } },
      is_published: true,
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

  it('Task 868 (R18) — publish with an empty rich-text body <p></p> → sq_body_required, no update', async () => {
    const { updatePage } = await import('../index')
    const result = await updatePage(1, {
      content: { ...CONTENT_EMPTY_BODY, sq: { title: 'Title', body: '<p></p>' } },
      is_published: true,
    })

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

// ═══════════════════════════════════════════════════════
// Task 923 Revision 7, finding S9 — a footer link is an allow-list, not a deny-list
// ═══════════════════════════════════════════════════════

describe('upsertFooterContent — link schemes (S9)', () => {
  const SCRIPT_URLS = ['javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'java\tscript:alert(1)', 'java\nscript:alert(1)', ' javascript:alert(1)', 'data:text/html,<script>alert(1)</script>', 'vbscript:msgbox(1)', 'file:///etc/passwd']

  // Task 989: the social list is shared by the four languages and saved by saveFooterShared, as an administrator
  it.each(SCRIPT_URLS)('saveFooterShared rejects %j in a social link and writes nothing', async (url) => {
    const { saveFooterShared } = await import('../footer')
    const result = await saveFooterShared({ settings: {}, social_links: [link({ id: 's1', url })] })
    expect(result).toEqual({ error: 'invalid_url' })
    expect(mockFooterUpdate).not.toHaveBeenCalled()
    expect(mockSettingsUpsert).not.toHaveBeenCalled()
    expect(mockFooterUpsert).not.toHaveBeenCalled()
  })

  it.each(SCRIPT_URLS)('rejects %j in a navigation link and writes nothing', async (url) => {
    const { upsertFooterContent } = await import('../footer')
    const result = await upsertFooterContent('en', { ...EMPTY_FOOTER_PAYLOAD, nav_links: [link({ id: 'n1', url })] })
    expect(result).toEqual({ error: 'invalid_url' })
    expect(mockFooterUpsert).not.toHaveBeenCalled()
  })

  it('saveFooterShared accepts https, mailto and tel social links', async () => {
    const { saveFooterShared } = await import('../footer')
    const social = [link({ id: 's1', url: 'https://instagram.com/lero' }), link({ id: 's2', url: 'mailto:info@lero.al' }), link({ id: 's3', url: 'tel:+355691234567' })]
    const result = await saveFooterShared({ settings: {}, social_links: social })
    expect(result).toEqual({})
    expect(mockFooterUpdate).toHaveBeenCalledWith(expect.objectContaining({ social_links: social }), 'locale', ['sq', 'en', 'uk', 'it'])
  })
})

// ═══════════════════════════════════════════════════════
// Task 990 AC3 — a page a footer link names cannot vanish; a refused footer link is named
// ═══════════════════════════════════════════════════════

/** one stored footer row with only the link lists the page actions read */
function footerRow(locale: string, lists: { nav?: FooterLink[]; info?: FooterLink[]; social?: FooterLink[] } = {}) {
  return { locale, nav_links: lists.nav ?? [], info_links: lists.info ?? [], social_links: lists.social ?? [] }
}

describe('deletePage / updatePage — a page an enabled footer link names (Task 990 AC3)', () => {
  it('deletePage of a page the sq and uk footers link → page_in_footer with those languages, nothing written', async () => {
    mockFooterSelect.mockResolvedValue({ data: [
      footerRow('sq', { nav: [link({ id: 'n1', url: '/about' })] }),
      footerRow('en', { nav: [link({ id: 'n2', url: '/privacy-policy' })] }),
      footerRow('uk', { info: [link({ id: 'i1', url: ' /about/ ' })] }),
      footerRow('it'),
    ], error: null })
    const { deletePage } = await import('../index')
    const result = await deletePage(1)

    expect(result).toEqual({ error: 'page_in_footer', locales: ['sq', 'uk'] })
    expect(mockFooterSelect).toHaveBeenCalledWith('locale, nav_links, info_links, social_links')
    expect(mockPageDeleteEq).not.toHaveBeenCalled()
  })

  it('a social link (shared by the four rows) names every language', async () => {
    const social = [link({ id: 's1', url: '/about' })]
    mockFooterSelect.mockResolvedValue({ data: ['sq', 'en', 'uk', 'it'].map(l => footerRow(l, { social })), error: null })
    const { deletePage } = await import('../index')

    expect(await deletePage(1)).toEqual({ error: 'page_in_footer', locales: ['sq', 'en', 'uk', 'it'] })
    expect(mockPageDeleteEq).not.toHaveBeenCalled()
  })

  it('a disabled link, or a link to another address, does not hold the page', async () => {
    mockFooterSelect.mockResolvedValue({ data: [
      footerRow('sq', { nav: [link({ id: 'n1', url: '/about', enabled: false })] }),
      footerRow('en', { nav: [link({ id: 'n2', url: '/about-us' }), link({ id: 'n3', url: 'https://example.com/about' })] }),
    ], error: null })
    const { deletePage, updatePage } = await import('../index')

    expect(await deletePage(1)).toEqual({})
    expect(mockPageDeleteEq).toHaveBeenCalledWith('id', 1)
    expect(await updatePage(1, { is_published: false })).toEqual({})
    expect(await updatePage(1, { slug: 'about-the-site' })).toEqual({})
    expect(mockPageUpdateEq).toHaveBeenCalledTimes(2)
  })

  it('a failed footer read refuses with transient and writes nothing', async () => {
    mockFooterSelect.mockResolvedValue({ data: null, error: { code: '500', message: 'boom' } })
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { deletePage, updatePage } = await import('../index')

    expect(await deletePage(1)).toEqual({ error: 'transient' })
    expect(await updatePage(1, { is_published: false })).toEqual({ error: 'transient' })
    expect(await updatePage(1, { slug: 'about-the-site' })).toEqual({ error: 'transient' })
    expect(mockPageDeleteEq).not.toHaveBeenCalled()
    expect(mockPageUpdateEq).not.toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it('a failed read of the stored page refuses with transient and writes nothing', async () => {
    mockStoredPageSingle.mockResolvedValue({ data: null, error: { code: '500', message: 'boom' } })
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { deletePage, updatePage } = await import('../index')

    expect(await deletePage(1)).toEqual({ error: 'transient' })
    expect(await updatePage(1, { is_published: false })).toEqual({ error: 'transient' })
    expect(mockPageDeleteEq).not.toHaveBeenCalled()
    expect(mockPageUpdateEq).not.toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it('updatePage that unpublishes, or renames, a linked page → page_in_footer, no update', async () => {
    mockFooterSelect.mockResolvedValue({ data: [footerRow('en', { info: [link({ id: 'i1', url: '/about' })] })], error: null })
    const { updatePage } = await import('../index')

    expect(await updatePage(1, { is_published: false })).toEqual({ error: 'page_in_footer', locales: ['en'] })
    expect(await updatePage(1, { slug: 'about-the-site', content: CONTENT_NON_EMPTY_BODY, is_published: true })).toEqual({ error: 'page_in_footer', locales: ['en'] })
    expect(mockPageUpdateEq).not.toHaveBeenCalled()
  })

  it('updatePage that keeps the address published, or changes only the content, does not read the footer', async () => {
    mockFooterSelect.mockResolvedValue({ data: [footerRow('en', { info: [link({ id: 'i1', url: '/about' })] })], error: null })
    const { updatePage } = await import('../index')

    expect(await updatePage(1, { slug: 'about', content: CONTENT_NON_EMPTY_BODY, is_published: true })).toEqual({})
    expect(await updatePage(1, { content: CONTENT_NON_EMPTY_BODY })).toEqual({})
    expect(mockFooterSelect).not.toHaveBeenCalled()
    expect(mockPageUpdateEq).toHaveBeenCalledTimes(2)
  })

  it('[SEC-990-PAGE-FOOTER-DENY] a caller without legal.manage is refused before any read of site_footer or pages', async () => {
    const { assertPermission } = await import('@/lib/auth/permissions')
    vi.mocked(assertPermission).mockRejectedValue(new Error('forbidden'))
    try {
      const { deletePage, updatePage } = await import('../index')

      await expect(deletePage(1)).rejects.toThrow('forbidden')
      await expect(updatePage(1, { is_published: false })).rejects.toThrow('forbidden')
      await expect(updatePage(1, { slug: 'about-the-site' })).rejects.toThrow('forbidden')
      expect(assertPermission).toHaveBeenCalledWith('legal.manage')
      expect(mockFooterSelect).not.toHaveBeenCalled()
      expect(mockStoredPageSingle).not.toHaveBeenCalled()
      expect(mockCreateAdminClient).not.toHaveBeenCalled()
      expect(mockPageDeleteEq).not.toHaveBeenCalled()
      expect(mockPageUpdateEq).not.toHaveBeenCalled()
    } finally {
      vi.mocked(assertPermission).mockResolvedValue(undefined)
    }
  })

  it('[SEC-990-PAGE-FOOTER-DENY] for an allowed caller the permission check runs before the footer read', async () => {
    const { assertPermission } = await import('@/lib/auth/permissions')
    const { deletePage } = await import('../index')
    await deletePage(1)
    expect(mockFooterSelect).toHaveBeenCalled()
    expect(vi.mocked(assertPermission).mock.invocationCallOrder[0]).toBeLessThan(mockFooterSelect.mock.invocationCallOrder[0])
  })
})

describe('the footer actions name the refused internal links (Task 990 AC3)', () => {
  it('upsertFooterContent with /test (no published page) → invalid_internal_link with links ["/test"], nothing written', async () => {
    mockCmsBatchSelect.mockResolvedValue({ data: [{ slug: 'about' }], error: null })
    const { upsertFooterContent } = await import('../footer')
    const result = await upsertFooterContent('uk', {
      ...EMPTY_FOOTER_PAYLOAD,
      nav_links: [link({ id: 'n1', label: 'Тестова', url: '/test' }), link({ id: 'n2', url: '/about' })],
    })
    expect(result).toEqual({ error: 'invalid_internal_link', links: ['/test'] })
    expect(mockFooterUpsert).not.toHaveBeenCalled()
  })

  it('upsertFooterContent names each refused shape once, and only the enabled ones', async () => {
    const { upsertFooterContent } = await import('../footer')
    const result = await upsertFooterContent('en', {
      ...EMPTY_FOOTER_PAYLOAD,
      nav_links: [link({ id: 'n1', url: '/en/about' }), link({ id: 'n2', url: '/a/b' }), link({ id: 'n3', url: '/a/b' }), link({ id: 'n4', url: '/x/y', enabled: false })],
    })
    expect(result).toEqual({ error: 'invalid_internal_link', links: ['/en/about', '/a/b'] })
    expect(mockCmsBatchSelect).not.toHaveBeenCalled()
  })

  it('saveFooterShared names the refused social links (shape and existence), nothing written', async () => {
    const { saveFooterShared } = await import('../footer')
    expect(await saveFooterShared({ settings: {}, social_links: [link({ id: 's1', url: '/a/b' })] })).toEqual({ error: 'invalid_internal_link', links: ['/a/b'] })

    mockCmsBatchSelect.mockResolvedValue({ data: [], error: null })
    expect(await saveFooterShared({ settings: {}, social_links: [link({ id: 's1', url: '/test' }), link({ id: 's2', url: 'https://x.example' })] })).toEqual({ error: 'invalid_internal_link', links: ['/test'] })
    expect(mockFooterUpdate).not.toHaveBeenCalled()
    expect(mockSettingsUpsert).not.toHaveBeenCalled()
  })
})
