// @vitest-environment node
/**
 * Task 951 AC8 (CodeQL js/path-injection in scripts): a path that comes from argv, or from a request URL in a detector's static server, is resolved to real paths and
 * must stay inside its root (the repository, or the directory the server serves). `withinRoot` throws for a path that leaves it; `requestPathWithin` first decodes a
 * request path (a percent-encoded "../" is a "../") and then does the same.
 */
import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { requestPathWithin, withinRoot } from '../within-repository.mjs'

const REPOSITORY = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
let sandbox: string
let served: string
let outside: string

beforeAll(() => {
  sandbox = mkdtempSync(path.join(tmpdir(), 'within-repository-'))
  served = path.join(sandbox, 'served')
  outside = path.join(sandbox, 'outside')
  mkdirSync(path.join(served, 'assets'), { recursive: true })
  mkdirSync(outside, { recursive: true })
  writeFileSync(path.join(served, 'index.html'), '<p>x</p>')
  writeFileSync(path.join(served, 'assets', 'a.js'), '1')
  writeFileSync(path.join(outside, 'secret.txt'), 'secret')
  // a directory link (a junction on Windows, a symlink elsewhere) that leaves the served directory
  symlinkSync(outside, path.join(served, 'escape'), 'junction')
})
afterAll(() => rmSync(sandbox, { recursive: true, force: true }))

const rootOf = (label: string): string => (label === 'the repository' ? REPOSITORY : served)

describe.each([['the repository'], ['a served directory']])('withinRoot for %s', (label) => {
  const root = () => rootOf(label)
  const inside = () => (label === 'the repository' ? 'package.json' : 'index.html')

  it('returns the real path of a file inside the root', () => {
    expect(withinRoot(root(), inside())).toBe(path.join(realpathSync(root()), inside()))
  })

  it('accepts a file that does not exist yet, inside the root', () => {
    expect(withinRoot(root(), path.join('new-dir', 'new-file.txt'))).toBe(path.join(realpathSync(root()), 'new-dir', 'new-file.txt'))
  })

  it('accepts the root itself', () => {
    expect(withinRoot(root(), '.')).toBe(realpathSync(root()))
  })

  it.each([['../x'], ['..'], ['assets/../../x'], ['a/b/../../../x']])('refuses %s', (candidate) => {
    expect(() => withinRoot(root(), candidate)).toThrow(/outside/)
  })

  it('refuses an absolute path outside the root', () => {
    expect(() => withinRoot(root(), path.join(outside, 'secret.txt'))).toThrow(/outside/)
    expect(() => withinRoot(root(), path.parse(outside).root)).toThrow(/outside/)
  })

  it('accepts an absolute path inside the root', () => {
    const file = path.join(realpathSync(root()), inside())
    expect(withinRoot(root(), file)).toBe(file)
  })
})

describe('a path through a symlink out of the root', () => {
  it('is refused for the served directory', () => {
    expect(() => withinRoot(served, path.join('escape', 'secret.txt'))).toThrow(/outside/)
    expect(() => withinRoot(served, 'escape')).toThrow(/outside/)
  })

  it('is refused for the repository when the link sits inside it', () => {
    // the served directory is not under the repository, so a link from there to `outside` is outside the repository as well
    expect(() => withinRoot(REPOSITORY, path.join(served, 'escape', 'secret.txt'))).toThrow(/outside/)
  })

  it('a link that stays inside the root is accepted', () => {
    mkdirSync(path.join(served, 'real-dir'), { recursive: true })
    writeFileSync(path.join(served, 'real-dir', 'f.txt'), 'f')
    symlinkSync(path.join(served, 'real-dir'), path.join(served, 'inner-link'), 'junction')
    expect(withinRoot(served, path.join('inner-link', 'f.txt'))).toBe(path.join(realpathSync(served), 'real-dir', 'f.txt'))
  })
})

describe.each([['the repository'], ['a served directory']])('requestPathWithin for %s', (label) => {
  const root = () => rootOf(label)
  it.each([['/index.html'], ['/assets/a.js'], ['/assets/%61.js'], ['/']])('accepts %s', (request) => {
    expect(() => requestPathWithin(root(), request)).not.toThrow()
  })

  it.each([
    ['/../x'],
    ['/%2e%2e/x'],
    ['%2e%2e/x'],
    ['/%2E%2E/x'],
    ['/assets/%2e%2e/%2e%2e/x'],
    ['/..%2fx'],
    ['/%2e%2e%5cx'],
    ['/..\\x'],
    ['/%00'],
    ['/%E0%A4%A'],
  ])('refuses %s', (request) => {
    expect(() => requestPathWithin(root(), request)).toThrow()
  })

  it('refuses a request path that goes through a link out of the root', () => {
    expect(() => requestPathWithin(served, '/escape/secret.txt')).toThrow(/outside/)
  })
})
