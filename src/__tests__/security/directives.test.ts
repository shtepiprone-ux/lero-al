// @vitest-environment node
/**
 * The directive detector the security scanners rely on (Task 923 Revision 7, finding S28): a Server Action file whose `'use server'` comes after a long header comment
 * must still be recognised, or its public endpoints go unchecked.
 */
import { describe, expect, it } from 'vitest'
import { hasDirective } from './directives'

const LONG = `/**\n${' * documentation line\n'.repeat(200)} */\n`

describe('hasDirective', () => {
  it('finds a directive on the first line', () => {
    expect(hasDirective("'use server'\nexport const a = 1", 'use server')).toBe(true)
    expect(hasDirective('"use client"\nexport const a = 1', 'use client')).toBe(true)
  })

  it('finds it after a very long block comment (the case that hid a critical hole)', () => {
    expect(LONG.length).toBeGreaterThan(3000)
    expect(hasDirective(`${LONG}'use server'\nexport async function f() {}`, 'use server')).toBe(true)
  })

  it('finds it after line comments and blank lines', () => {
    expect(hasDirective("// header\n\n// more\n'use server'\nexport const a = 1", 'use server')).toBe(true)
  })

  it('finds it among several directives', () => {
    expect(hasDirective("'use strict'\n'use server'\nexport const a = 1", 'use server')).toBe(true)
  })

  it('does not take one directive for the other', () => {
    expect(hasDirective("'use client'\nexport const a = 1", 'use server')).toBe(false)
    expect(hasDirective("'use server'\nexport const a = 1", 'use client')).toBe(false)
  })

  it('does not find a directive that is not at the top (inside a function or after code)', () => {
    expect(hasDirective("import x from 'x'\n'use server'\nexport const a = 1", 'use server')).toBe(false)
    expect(hasDirective("export function f() {\n  'use server'\n}", 'use server')).toBe(false)
  })

  it('does not find one in a module with none, or in a comment', () => {
    expect(hasDirective('export const a = 1', 'use server')).toBe(false)
    expect(hasDirective("// 'use server'\nexport const a = 1", 'use server')).toBe(false)
    expect(hasDirective("/* 'use server' */\nexport const a = 1", 'use server')).toBe(false)
  })
})

// Task 923 R38 (case SEC-S28-SRV-DENY)
it('[SEC-S28-SRV-DENY] applyListingTransitionByStatus is not reachable as a public Server Action and no public action accepts an actor', async () => {
  const { readdirSync, readFileSync } = await import('node:fs')
  const { join } = await import('node:path')
  const gateway = readFileSync('src/modules/listings/actions/applyListingTransition.ts', 'utf8')
  expect(hasDirective(gateway, 'use server')).toBe(false)
  expect(gateway).toMatch(/import ['"]server-only['"]/)
  // no use server module exports an async function that takes an actor
  const offenders: string[] = []
  const walk = (dir: string) => {
    // the entry kind comes with the directory listing (no separate stat of the path before the read, Task 951 CodeQL js/file-system-race)
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const name = entry.name
      const path = join(dir, name)
      if (entry.isDirectory()) { if (name !== 'node_modules' && name !== '__tests__') walk(path); continue }
      if (!/\.tsx?$/.test(name) || /\.(test|stories)\./.test(name)) continue
      const text = readFileSync(path, 'utf8')
      if (!hasDirective(text, 'use server')) continue
      for (const m of text.matchAll(/export\s+async\s+function\s+(\w+)\s*\(([^)]*)\)/g)) if (/\bactor\b/i.test(m[2])) offenders.push(`${path}: ${m[1]}`)
    }
  }
  walk('src')
  expect(offenders, offenders.join('\n')).toEqual([])
})
