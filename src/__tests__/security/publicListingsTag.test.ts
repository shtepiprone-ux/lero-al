// @vitest-environment node
/**
 * Task 964 AC7 (Revision 1, R1-2): the sitemap files and robots.txt are cached under `PUBLIC_LISTINGS_CACHE_TAG`, so a new listing reaches search engines at once and not
 * at the next deployment. The tag is expired by every Server Action that changes which listings are public, or a field a sitemap shows (`slug`, `updated_at`). The
 * per-action tests assert the observed calls; this file guards the rule over the whole product code, so a new action that expires the homepage counter, or deletes an
 * account (whose cascade removes the listings), cannot forget the tag. The tag is one constant, never a second literal.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

const ROOT = process.cwd()
const rel = (p: string) => relative(ROOT, p).split('\\').join('/')
function walk(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) { if (name === 'node_modules' || name === '__tests__') continue; walk(p, acc) } else acc.push(p)
  }
  return acc
}
const product = walk(join(ROOT, 'src')).filter((f) => /\.tsx?$/.test(f) && !/\.(test|spec|stories)\.tsx?$/.test(f) && !rel(f).startsWith('src/tests/'))

const SITE_STATS = "'site-stats'"
const TAG = 'PUBLIC_LISTINGS_CACHE_TAG'

interface UpdateTagCall { arg: string; position: number }
interface Fn { name: string; updateTags: UpdateTagCall[]; deletesAccountAt: number[] }
interface FileFacts { file: string; text: string; updateTags: UpdateTagCall[]; fns: Fn[] }

/** the `updateTag(...)` calls of a file with the source text of their argument, and per function the calls it makes */
function facts(file: string): FileFacts {
  const text = readFileSync(file, 'utf8')
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
  const updateTags: UpdateTagCall[] = []
  const fns: Fn[] = []
  const visit = (n: ts.Node, current: Fn | null) => {
    let here = current
    if (ts.isFunctionDeclaration(n) && n.name) {
      here = { name: n.name.text, updateTags: [], deletesAccountAt: [] }
      fns.push(here)
    }
    if (ts.isCallExpression(n) && ts.isIdentifier(n.expression)) {
      if (n.expression.text === 'updateTag' && n.arguments.length === 1) {
        const call = { arg: n.arguments[0].getText(sf), position: n.getStart() }
        updateTags.push(call)
        here?.updateTags.push(call)
      }
      if (n.expression.text === 'deleteAccount') here?.deletesAccountAt.push(n.getStart())
    }
    ts.forEachChild(n, (child) => visit(child, here))
  }
  visit(sf, null)
  return { file: rel(file), text, updateTags, fns }
}

const all = product.filter((f) => /updateTag/.test(readFileSync(f, 'utf8'))).map(facts)
const byFile = (file: string) => {
  const found = all.find((f) => f.file === file)
  if (!found) throw new Error(`${file} calls no updateTag`)
  return found
}
const callsTag = (f: FileFacts) => f.updateTags.some((c) => c.arg === TAG)

describe('the public-listings tag is expired by every change of the public listings (Task 964, R1-2)', () => {
  it('[AC7] the tag is one exported constant of src/modules/listings/lib/cacheTags.ts, imported by the sitemap and by every action that expires it', () => {
    const constant = readFileSync(join(ROOT, 'src/modules/listings/lib/cacheTags.ts'), 'utf8')
    expect(constant).toMatch(/export const PUBLIC_LISTINGS_CACHE_TAG = '[a-z-]+'/)
    const importers = [...all.filter(callsTag).map((f) => f.file), 'src/app/sitemap.ts']
    for (const file of importers) {
      expect(readFileSync(join(ROOT, file), 'utf8'), `${file} imports the constant`).toMatch(/import \{[^}]*\bPUBLIC_LISTINGS_CACHE_TAG\b[^}]*\} from '@\/modules\/listings\/lib\/cacheTags'/)
    }
  })

  it("[AC7] every product file that calls updateTag('site-stats') also calls updateTag(PUBLIC_LISTINGS_CACHE_TAG)", () => {
    const statsFiles = all.filter((f) => f.updateTags.some((c) => c.arg === SITE_STATS))
    // the three files that expire the homepage counter today: the status gateway, the owner deletion and the admin actions
    expect(statsFiles.map((f) => f.file).sort()).toEqual([
      'src/modules/admin/actions/index.ts',
      'src/modules/listings/actions/applyListingTransition.ts',
      'src/modules/listings/actions/deleteListing.ts',
    ])
    expect(statsFiles.filter((f) => !callsTag(f)).map((f) => f.file)).toEqual([])
  })

  it('[AC7] updateListing.ts and both account-deleting action files call updateTag(PUBLIC_LISTINGS_CACHE_TAG)', () => {
    for (const file of ['src/modules/listings/actions/updateListing.ts', 'src/modules/admin/actions/index.ts', 'src/modules/cabinet/actions/index.ts']) {
      expect(callsTag(byFile(file)), `${file} expires the public-listings tag`).toBe(true)
    }
  })

  it("[AC7] inside a file, each function that expires 'site-stats' or deletes an account also expires the tag, and only after that deletion", () => {
    const missing: string[] = []
    let checked = 0
    for (const f of all) {
      for (const fn of f.fns) {
        const expiresStats = fn.updateTags.some((c) => c.arg === SITE_STATS)
        if (!expiresStats && fn.deletesAccountAt.length === 0) continue
        checked += 1
        const tagCalls = fn.updateTags.filter((c) => c.arg === TAG)
        if (tagCalls.length !== 1) { missing.push(`${f.file}:${fn.name}`); continue }
        // a refused deletion returns before the call: the tag is expired after the deletion that succeeded, never ahead of it
        if (fn.deletesAccountAt.some((at) => tagCalls[0].position < at)) missing.push(`${f.file}:${fn.name} (before the deletion)`)
      }
    }
    expect(missing).toEqual([])
    // writeListingStatus, deleteListingAction, the admin deleteListing, hardDeleteUser, deleteOwnAccount
    expect(checked).toBeGreaterThanOrEqual(5)
  })

  it('[AC7] deleteOwnAccount and hardDeleteUser expire the tag after deleteAccount, and the admin deleteListing and updateListing are named functions that expire it', () => {
    const named = (file: string, name: string) => byFile(file).fns.find((fn) => fn.name === name)
    for (const [file, name] of [
      ['src/modules/cabinet/actions/index.ts', 'deleteOwnAccount'],
      ['src/modules/admin/actions/index.ts', 'hardDeleteUser'],
      ['src/modules/admin/actions/index.ts', 'deleteListing'],
      ['src/modules/listings/actions/updateListing.ts', 'updateListing'],
      ['src/modules/listings/actions/deleteListing.ts', 'deleteListingAction'],
      ['src/modules/listings/actions/applyListingTransition.ts', 'writeListingStatus'],
    ]) {
      const fn = named(file, name)
      expect(fn, `${file} ${name}`).toBeDefined()
      expect(fn?.updateTags.filter((c) => c.arg === TAG), `${file} ${name} expires the tag once`).toHaveLength(1)
    }
  })
})
