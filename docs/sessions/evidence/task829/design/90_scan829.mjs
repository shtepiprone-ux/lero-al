// Task 829 design-time measurement (orchestrator scratch, not a deliverable).
// For every manifest entry: collect static class tokens from className attributes, cn()/clsx()/cva-like
// string args, and module-level const strings/objects/arrays referenced from a className expression;
// ask the project's own Tailwind v4 design system (globals.css) which tokens compile to CSS.
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
const ROOT = process.argv[2]
const require = createRequire(path.join(ROOT, 'package.json'))
const ts = require('typescript')
const { __unstable__loadDesignSystem } = require('@tailwindcss/node')

const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/mantine-migration-scope.json'), 'utf8'))
const css = fs.readFileSync(path.join(ROOT, 'src/app/globals.css'), 'utf8')
const ds = await __unstable__loadDesignSystem(css, { base: path.join(ROOT, 'src/app') })

function collectStrings(node, out, consts, seen = new Set()) {
  if (!node) return
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) { out.push(node.text); return }
  if (ts.isTemplateExpression(node)) {
    out.push(node.head.text); for (const s of node.templateSpans) { collectStrings(s.expression, out, consts, seen); out.push(s.literal.text) }
    return
  }
  if (ts.isIdentifier(node)) {
    const d = consts.get(node.text); if (d && !seen.has(node.text)) { seen.add(node.text); collectStrings(d, out, consts, seen) }
    return
  }
  if (ts.isPropertyAccessExpression(node)) {
    // styles.foo (CSS module) is not a literal; OBJ.key where OBJ is a local const object -> take whole object
    if (ts.isIdentifier(node.expression)) collectStrings(node.expression, out, consts, seen)
    return
  }
  if (ts.isElementAccessExpression(node)) { collectStrings(node.expression, out, consts, seen); return }
  ts.forEachChild(node, (c) => collectStrings(c, out, consts, seen))
}

const rows = []
for (const rel of manifest) {
  const abs = path.join(ROOT, rel)
  if (!fs.existsSync(abs)) { rows.push({ rel, error: 'missing' }); continue }
  const src = ts.createSourceFile(abs, fs.readFileSync(abs, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const consts = new Map()
  src.statements.forEach((st) => {
    if (ts.isVariableStatement(st)) for (const d of st.declarationList.declarations) if (ts.isIdentifier(d.name) && d.initializer) consts.set(d.name.text, d.initializer)
  })
  const strings = []
  const visit = (n) => {
    if (ts.isJsxAttribute(n) && n.name.getText(src) === 'className' && n.initializer) {
      const init = ts.isJsxExpression(n.initializer) ? n.initializer.expression : n.initializer
      collectStrings(init, strings, consts)
    }
    ts.forEachChild(n, visit)
  }
  visit(src)
  const tokens = [...new Set(strings.flatMap((s) => s.split(/\s+/)).filter(Boolean))]
  const cssOut = tokens.length ? ds.candidatesToCss(tokens) : []
  const tw = tokens.filter((t, i) => cssOut[i])
  rows.push({ rel, tokens: tokens.length, tailwind: tw })
}
const hit = rows.filter((r) => r.tailwind && r.tailwind.length)
console.log(`manifest entries ${manifest.length}; files with Tailwind-compiling className tokens ${hit.length}`)
for (const r of hit) console.log(`${r.tailwind.length}\t${r.rel}\t${r.tailwind.join(' ')}`)
for (const r of rows.filter((r) => r.error)) console.log(`ERROR ${r.rel} ${r.error}`)
