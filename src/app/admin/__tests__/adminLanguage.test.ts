// @vitest-environment node
/**
 * Task 988 AC3: every admin page reads the admin language before it translates.
 *  1. A scan of every `page.tsx` and `layout.tsx` under `src/app/admin`: in the page function and in `generateMetadata`, a call of `getTranslations`, `getLocale` or
 *     `getMessages` comes after `await getAdminLocale()`, and `requireStaffPage()` stays the first await of each page and `generateMetadata` (Task 923 R68 (a)); no
 *     `page.tsx` keeps a static `export const metadata` with a literal `title`.
 *  2. Each page's `generateMetadata` really runs with the `admin-locale` cookie set to each of the four languages and returns the key its heading renders, in that
 *     language, with " — Admin"; the profile title falls back to `admin.user_profile.header.title_fallback`.
 * The real `getAdminLocale` runs; the cookie jar, next-intl's server lookups (which fall back to `sq`, as `src/i18n/request.ts` does, when no locale was set), the
 * staff guard and the database are doubles. Every id is synthetic.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'

type Locale = 'sq' | 'en' | 'uk' | 'it'
const LOCALES: Locale[] = ['sq', 'en', 'uk', 'it']

const state = vi.hoisted(() => ({ adminCookie: 'uk' as string | undefined, requestLocale: undefined as string | undefined, order: [] as string[] }))

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: (name: string) => (name === 'admin-locale' && state.adminCookie ? { name, value: state.adminCookie } : undefined), getAll: () => [], set: () => undefined }),
  headers: async () => ({ get: () => null }),
}))
vi.mock('next-intl/server', async () => {
  const { readFileSync: read } = await import('node:fs')
  const { join: joinPath } = await import('node:path')
  const lookup = (locale: string, key: string) =>
    key.split('.').reduce<unknown>((node, part) => (node && typeof node === 'object' ? (node as Record<string, unknown>)[part] : undefined),
      JSON.parse(read(joinPath(process.cwd(), 'messages', `${locale}.json`), 'utf8')))
  return {
    setRequestLocale: (locale: string) => { state.requestLocale = locale },
    getLocale: async () => { state.order.push('getLocale'); return state.requestLocale ?? 'sq' },
    getTranslations: async (namespace?: string) => {
      state.order.push('getTranslations')
      const locale = state.requestLocale ?? 'sq'
      return (key: string) => {
        const value = lookup(locale, namespace ? `${namespace}.${key}` : key)
        return typeof value === 'string' ? value : `${namespace}.${key}`
      }
    },
  }
})
vi.mock('@/lib/auth/staff', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  requireStaffPage: async () => { state.order.push('requireStaffPage'); return { userId: 'u-admin', role: 'admin' } },
}))
vi.mock('@/lib/supabase/admin', () => {
  const empty = { data: null, error: null, count: 0 }
  const chain: Record<string, unknown> = {}
  for (const m of ['select', 'eq', 'in', 'order', 'limit', 'not', 'is', 'ilike', 'or', 'range']) chain[m] = () => chain
  chain.single = async () => empty
  chain.maybeSingle = async () => empty
  return { createAdminClient: () => ({ from: () => chain }) }
})
vi.mock('next/cache', () => ({ revalidatePath: () => undefined, revalidateTag: () => undefined, updateTag: () => undefined, unstable_cache: (fn: unknown) => fn }))

const ADMIN_ROOT = join(process.cwd(), 'src', 'app', 'admin')
const relative = (file: string) => file.slice(process.cwd().length + 1).split('\\').join('/')

function routeFiles(dir = ADMIN_ROOT, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) { if (entry.name !== '__tests__') routeFiles(full, out) }
    else if (entry.name === 'page.tsx' || entry.name === 'layout.tsx') out.push(full)
  }
  return out.sort()
}

/** the text of a top-level function, from its signature to its closing brace at the start of a line */
function functionText(text: string, signature: RegExp): string | null {
  const match = signature.exec(text)
  if (!match) return null
  const end = text.slice(match.index).search(/\n\}(?:\r?\n|$)/)
  return text.slice(match.index, end < 0 ? text.length : match.index + end)
}

const TRANSLATES = /\b(?:getTranslations|getLocale|getMessages)\(/

/** the key each page heading renders (`AdminPageHeader` title, or the heading of the client view it renders) */
const HEADINGS: Record<string, string> = {
  'src/app/admin/companies/page.tsx': 'admin.pages.companies_title',
  'src/app/admin/currency/page.tsx': 'admin.currency.title',
  'src/app/admin/email-templates/page.tsx': 'admin.pages.email_templates_title',
  'src/app/admin/footer/page.tsx': 'admin.pages.footer_title',
  'src/app/admin/inquiries/sales/page.tsx': 'admin.pages.inquiries_sales_title',
  'src/app/admin/inquiries/support/page.tsx': 'admin.pages.inquiries_support_title',
  'src/app/admin/listings/page.tsx': 'admin.pages.listings_title',
  'src/app/admin/locations/page.tsx': 'admin.pages.locations_title',
  'src/app/admin/pages/page.tsx': 'admin.pages.title',
  'src/app/admin/permissions/page.tsx': 'admin.permissions.title',
  'src/app/admin/popular-locations/page.tsx': 'admin.pages.popular_locations_title',
  'src/app/admin/property-types/page.tsx': 'admin.property_types.title',
  'src/app/admin/reports/page.tsx': 'admin.pages.reports_title',
  'src/app/admin/settings/page.tsx': 'admin.pages.settings_title',
  'src/app/admin/support/page.tsx': 'admin.pages.support_title',
  'src/app/admin/users/new/page.tsx': 'admin.user_profile.header.new_user_title',
  'src/app/admin/users/page.tsx': 'admin.pages.users_title',
  'src/app/admin/users/[id]/page.tsx': 'admin.user_profile.header.title_fallback',
}

const messages = Object.fromEntries(LOCALES.map((l) => [l, JSON.parse(readFileSync(join(process.cwd(), 'messages', `${l}.json`), 'utf8'))])) as Record<Locale, unknown>
const message = (locale: Locale, key: string) => key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], messages[locale])

beforeEach(() => {
  state.adminCookie = 'uk'
  state.requestLocale = undefined
  state.order = []
})

describe('adminLanguage', () => {
  it('[AC3] every admin page and generateMetadata awaits getAdminLocale() before it translates, after requireStaffPage()', () => {
    const files = routeFiles()
    expect(files.length, 'the scanner found the admin pages').toBeGreaterThanOrEqual(20)
    const offenders: string[] = []
    for (const file of files) {
      const text = readFileSync(file, 'utf8')
      const isPage = file.endsWith('page.tsx')
      if (isPage && /export const metadata\s*(?::[^=]+)?=\s*\{[^}]*\btitle\s*:\s*['"`]/.test(text)) offenders.push(`${relative(file)}: a static metadata title`)
      for (const [name, signature] of [['page', /export default (?:async )?function \w+\s*\(/], ['generateMetadata', /export (?:async )?function generateMetadata\s*\(/]] as const) {
        const body = functionText(text, signature)
        if (!body) continue
        const translates = body.search(TRANSLATES)
        if (translates >= 0) {
          const locale = body.indexOf('await getAdminLocale()')
          if (locale < 0 || locale > translates) offenders.push(`${relative(file)} ${name}: translates before await getAdminLocale()`)
        }
        if (isPage) {
          const first = body.indexOf('await ')
          if (!body.slice(first).startsWith('await requireStaffPage(')) offenders.push(`${relative(file)} ${name}: the first await is not requireStaffPage()`)
        }
      }
    }
    expect(offenders, offenders.join('\n')).toEqual([])
  })

  it.each(LOCALES)('[AC3] each generateMetadata returns its heading in the admin language (%s), after the staff check', async (locale) => {
    const failures: string[] = []
    const props = { params: Promise.resolve({ id: '00000000-0000-4000-8000-0000000000aa' }), searchParams: Promise.resolve({}) }
    for (const [file, key] of Object.entries(HEADINGS)) {
      state.adminCookie = locale
      state.requestLocale = undefined
      state.order = []
      const mod = (await import(/* @vite-ignore */ join(process.cwd(), file))) as { generateMetadata?: (p: unknown) => Promise<{ title?: unknown }> }
      if (!mod.generateMetadata) { failures.push(`${file}: no generateMetadata`); continue }
      const expected = message(locale, key)
      if (typeof expected !== 'string') { failures.push(`${file}: ${key} is missing in ${locale}`); continue }
      const { title } = await mod.generateMetadata(props)
      if (title !== `${expected} — Admin`) failures.push(`${file}: title ${JSON.stringify(title)}, expected ${JSON.stringify(`${expected} — Admin`)}`)
      if (state.order[0] !== 'requireStaffPage') failures.push(`${file}: ${state.order[0]} ran before requireStaffPage`)
    }
    expect(failures, failures.join('\n')).toEqual([])
  }, 120_000)
})
