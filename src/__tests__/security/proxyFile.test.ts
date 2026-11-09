// @vitest-environment node
/**
 * Task 952 (AC2, threat T1): after the Next 16 upgrade the request gate is `src/proxy.ts`, and it is the live file.
 * Next 16 renamed `middleware` to `proxy`. A stale `src/middleware.ts` left beside it, or an old copy of `src/proxy.ts` that lacks the CSP nonce, would leave the
 * session refresh or the report-only script policy unrun. The file is read as text and as a syntax tree, so the check does not depend on what the bundler resolves.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

const SRC = join(process.cwd(), 'src')
const PROXY = join(SRC, 'proxy.ts')

function exportedNames(file: string): { names: Set<string>; hasDefault: boolean } {
  const sf = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const names = new Set<string>()
  let hasDefault = false
  for (const st of sf.statements) {
    if (ts.isExportAssignment(st)) { hasDefault = true; continue }
    const mods = ts.canHaveModifiers(st) ? ts.getModifiers(st) ?? [] : []
    if (!mods.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) continue
    if (mods.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword)) hasDefault = true
    if (ts.isFunctionDeclaration(st) && st.name) names.add(st.name.text)
    if (ts.isVariableStatement(st)) for (const d of st.declarationList.declarations) if (ts.isIdentifier(d.name)) names.add(d.name.text)
  }
  return { names, hasDefault }
}

/** The first string of `config.matcher` in src/proxy.ts, read from the syntax tree (importing the module would load next-intl and Supabase). */
function firstMatcher(file: string): string | undefined {
  const sf = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  let found: string | undefined
  const visit = (node: ts.Node): void => {
    if (ts.isPropertyAssignment(node) && ts.isIdentifier(node.name) && node.name.text === 'matcher' && ts.isArrayLiteralExpression(node.initializer)) {
      const first = node.initializer.elements[0]
      if (first && ts.isStringLiteralLike(first)) found = first.text
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)
  return found
}

describe('the request gate is src/proxy.ts (Next 16)', () => {
  it('[SEC-T1-SRV-ONE-GATE] src/middleware.ts does not exist, so no second copy of the gate can run or be mistaken for it', () => {
    expect(existsSync(join(SRC, 'middleware.ts'))).toBe(false)
    expect(existsSync(join(process.cwd(), 'middleware.ts'))).toBe(false)
    expect(existsSync(join(process.cwd(), 'proxy.ts'))).toBe(false)
  })

  it('[SEC-T1-SRV-EXPORTS] src/proxy.ts exports `proxy` and `config` by name, and no default export that Next would pick up instead', () => {
    expect(existsSync(PROXY)).toBe(true)
    const { names, hasDefault } = exportedNames(PROXY)
    expect(names.has('proxy')).toBe(true)
    expect(names.has('config')).toBe(true)
    expect(names.has('middleware')).toBe(false)
    expect(hasDefault).toBe(false)
  })

  it('[SEC-T1-SRV-NONCE] src/proxy.ts is the live file: it sets the report-only script policy with a fresh nonce and refreshes the session', () => {
    const text = readFileSync(PROXY, 'utf8')
    expect(text).toContain('newScriptNonce')
    expect(text).toContain('scriptReportOnlyPolicy')
    expect(text).toContain('carriesScriptReportOnly')
    expect(text).toContain('refreshSession')
  })

  it('[SEC-T1-SRV-BUILT-PROXY] the build runs the proxy: functions-config-manifest has /_middleware on nodejs with the matcher of src/proxy.ts', () => {
    const manifestPath = join(process.cwd(), '.next', 'server', 'functions-config-manifest.json')
    if (!existsSync(manifestPath)) {
      throw new Error(`${manifestPath} not found — run "npm run build" first (this check reads the built manifest, not the source).`)
    }
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
      functions?: Record<string, { runtime?: string; matchers?: { originalSource?: string }[] }>
    }
    const fn = manifest.functions?.['/_middleware']
    expect(fn, 'the built manifest has no /_middleware entry: Next did not pick up src/proxy.ts').toBeDefined()
    expect(fn?.runtime).toBe('nodejs')
    expect(fn?.matchers?.[0]?.originalSource).toBe(firstMatcher(PROXY))
  })
})
