// @vitest-environment node
/**
 * Task 1007 AC1 — every admin page names its access.
 *  - each `src/app/[locale]/admin/**\/page.tsx` (and each `generateMetadata` in it) calls `requireStaffPage` with a key of `ADMIN_PAGES` that belongs to its own route,
 *    or `{ adminOnly: true }` on Footer and Permissions (owner decision O1007-1), and `{ landing: true }` only on `/admin` (`src/app/[locale]/admin/page.tsx`);
 *  - every path of every key is a page that exists;
 *  - the keys are the sidebar items that are not administrator-only, in the sidebar's order, with the sidebar's label keys.
 * The files are read as text: nothing runs.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ADMIN_PAGES, ADMIN_PAGE_KEYS, adminRouteOf } from '../adminPages'

const ROOT = process.cwd()
const ADMIN_ROOT = join(ROOT, 'src', 'app', '[locale]', 'admin')
/** owner decision O1007-1 (2026-11-24, "administrator only"): the pages a moderator never opens, whatever the switches say */
const ADMIN_ONLY_ROUTES = ['/admin/footer', '/admin/permissions']

function pageFiles(dir = ADMIN_ROOT, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) pageFiles(full, out)
    else if (entry.name === 'page.tsx') out.push(full)
  }
  return out.sort()
}

const slash = (p: string) => p.split('\\').join('/')
const routeOf = (file: string) => slash(file.slice(ROOT.length + 1)).replace(/^src\/app\/\[locale\]/, '').replace(/\/page\.tsx$/, '') || '/'
const messagesOf = (locale: string) => JSON.parse(readFileSync(join(ROOT, 'messages', `${locale}.json`), 'utf8')) as { admin: { sidebar: Record<string, string> } }

/** every `requireStaffPage(...)` call of a page: its argument text, trimmed */
function guardCalls(text: string): string[] {
  return [...text.matchAll(/requireStaffPage\(([^)]*)\)/g)].map((m) => m[1].replace(/\s+/g, ' ').trim())
}

describe('adminPages', () => {
  it('lists fifteen unique page keys, each with a sidebar label and at least one path', () => {
    expect(ADMIN_PAGES).toHaveLength(15)
    expect(ADMIN_PAGE_KEYS).toEqual(ADMIN_PAGES.map((p) => p.key))
    expect(new Set(ADMIN_PAGE_KEYS).size).toBe(ADMIN_PAGE_KEYS.length)
    for (const page of ADMIN_PAGES) {
      expect(page.key, 'a page key has its own prefix').toMatch(/^page\.[a-z_]+$/)
      expect(page.paths.length, `${page.key} has a path`).toBeGreaterThan(0)
      for (const locale of ['sq', 'en', 'uk', 'it']) expect(messagesOf(locale).admin.sidebar[page.labelKey], `${locale}: label ${page.labelKey} of ${page.key}`).toBeTruthy()
    }
  })

  it('[SEC-1007-PAGE-CENSUS] every admin page calls requireStaffPage with the access of its own route', () => {
    const files = pageFiles()
    expect(files.length, 'the scanner found the admin pages').toBeGreaterThanOrEqual(20)
    const offenders: string[] = []
    const seenAdminOnly: string[] = []
    for (const file of files) {
      const route = routeOf(file)
      const calls = guardCalls(readFileSync(file, 'utf8'))
      if (calls.length === 0) { offenders.push(`${route}: no requireStaffPage call`); continue }
      for (const arg of calls) {
        const page = /^\{ page: '(page\.[a-z_]+)' \}$/.exec(arg)
        if (page) {
          const def = ADMIN_PAGES.find((p) => p.key === page[1])
          if (!def) offenders.push(`${route}: the key ${page[1]} is not in ADMIN_PAGES`)
          else if (!(def.paths as readonly string[]).includes(route)) offenders.push(`${route}: passes ${def.key}, whose paths are ${def.paths.join(', ')}`)
        } else if (arg === '{ adminOnly: true }') {
          seenAdminOnly.push(route)
          if (!ADMIN_ONLY_ROUTES.includes(route)) offenders.push(`${route}: adminOnly is for ${ADMIN_ONLY_ROUTES.join(' and ')} only`)
        } else if (arg === '{ landing: true }') {
          if (route !== '/admin') offenders.push(`${route}: landing is for /admin only`)
        } else offenders.push(`${route}: requireStaffPage(${arg}) names no page key, adminOnly or landing`)
      }
    }
    for (const route of ADMIN_ONLY_ROUTES) if (!seenAdminOnly.includes(route)) offenders.push(`${route}: must pass adminOnly`)
    // `/admin` is the one landing: it carries no page key at its guard
    expect(guardCalls(readFileSync(join(ADMIN_ROOT, 'page.tsx'), 'utf8'))).toEqual(['{ landing: true }'])
    expect(offenders, offenders.join('\n')).toEqual([])
  })

  it('every path of every key is a page that exists', () => {
    for (const page of ADMIN_PAGES) {
      for (const path of page.paths) {
        const file = path === '/admin' ? join(ADMIN_ROOT, 'page.tsx') : join(ROOT, 'src', 'app', '[locale]', ...path.split('/').filter(Boolean), 'page.tsx')
        expect(existsSync(file), `${page.key}: ${path} -> ${slash(file.slice(ROOT.length + 1))}`).toBe(true)
      }
    }
  })

  it('the keys are the sidebar items that are not administrator-only, in the sidebar order, with its label keys', () => {
    const sidebar = readFileSync(join(ROOT, 'src', 'components', 'admin', 'AdminSidebar.tsx'), 'utf8')
    const items = [...sidebar.matchAll(/href:\s*'(\/admin[^']*)',\s*label:\s*t\('([^']+)'\)/g)].map((m) => ({ href: m[1], label: m[2] }))
    const keyed = items.filter((i) => !ADMIN_ONLY_ROUTES.includes(i.href))
    expect(items.map((i) => i.href).filter((h) => ADMIN_ONLY_ROUTES.includes(h)).sort(), 'the sidebar still has both administrator-only items').toEqual([...ADMIN_ONLY_ROUTES].sort())
    expect(keyed.map((i) => i.href), 'the sidebar items equal the first path of each key, in order').toEqual(ADMIN_PAGES.map((p) => p.paths[0]))
    expect(keyed.map((i) => i.label)).toEqual(ADMIN_PAGES.map((p) => p.labelKey))
  })

  it('Task 988 R4-1: every admin address a Story mocks carries the language slug, so the sidebar and the header resolve its route', () => {
    const storyFiles = (dir: string, out: string[] = []): string[] => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name)
        if (entry.isDirectory()) storyFiles(full, out)
        else if (entry.name.endsWith('.stories.tsx')) out.push(full)
      }
      return out.sort()
    }
    const found: string[] = []
    const offenders: string[] = []
    for (const file of storyFiles(join(ROOT, 'src', 'stories'))) {
      for (const m of readFileSync(file, 'utf8').matchAll(/pathname: '([^']*)'/g)) {
        if (!m[1].includes('/admin')) continue
        found.push(m[1])
        if (typeof adminRouteOf(m[1]) !== 'string') offenders.push(`${slash(file.slice(ROOT.length + 1))}: pathname '${m[1]}'`)
      }
    }
    expect(found.length, 'the scanner found the admin Story addresses').toBeGreaterThanOrEqual(22)
    expect(offenders, offenders.join('\n')).toEqual([])
  })
})
