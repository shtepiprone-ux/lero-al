// Author-side feasibility probe for Task 863 (read-only). Mirrors check-listing-visibility.mjs's
// extractor + patterns, adds a called-factory rule, and lists hits the shipped detector misses.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, extname } from 'node:path'
// The gate module runs its scan and calls process.exit at import time, so its shipped extractor
// (scripts/check-listing-visibility.mjs:98-136) is mirrored verbatim here instead of imported.
function shippedLines(lines) {
  const hit = new Set()
  const fromRe = /from\(\s*['"]listings['"]\s*\)/
  const assignRe = /(?:const|let)\s+(\w+)\s*=.*from\(\s*['"]listings['"]\s*\)/
  for (let i = 0; i < lines.length; i++) {
    if (!fromRe.test(lines[i])) continue
    hit.add(i)
    let j = i + 1
    while (j < lines.length && /^\s*\./.test(lines[j])) { hit.add(j); j++ }
    const m = lines[i].match(assignRe)
    if (m) {
      const v = m[1]
      const re = new RegExp(`(?:^|\\b)${v}\\s*(?:=\\s*(?:await\\s+)?${v}\\s*\\.|\\.)`)
      for (let k = j; k < lines.length; k++) if (re.test(lines[k])) hit.add(k)
    }
  }
  return hit
}

const ROOT = 'C:/Claude_Code_Projects/lero-al'
const PAT = [
  /\.eq\(\s*['"]status['"]\s*,\s*['"]active['"]\s*\)/,
  /\.in\(\s*['"]status['"]\s*,\s*\[.*['"]active['"].*\]\s*\)/,
  /\.match\(\s*\{[^}]*status\s*:\s*['"]active['"][^}]*\}\s*\)/,
  /\.filter\(\s*['"]status['"]\s*,\s*['"]eq['"]\s*,\s*['"]active['"]\s*\)/,
  /status\.eq\.active/,
  /\.gte\(\s*['"]expires_at['"]/,
  /\.lt\(\s*['"]expires_at['"]/,
  /\.is\(\s*['"]expires_at['"]\s*,\s*null\s*\)/,
  /expires_at\.(gte|lt|is)\./,
]

function ext(lines) {
  const out = []
  const fromRe = /from\(\s*['"]listings['"]\s*\)/
  const assignRe = /(?:const|let)\s+(\w+)\s*=.*from\(\s*['"]listings['"]\s*\)/
  for (let i = 0; i < lines.length; i++) {
    if (!fromRe.test(lines[i])) continue
    const m = lines[i].match(assignRe)
    if (!m) continue
    const v = m[1]
    const callRe = new RegExp('\\b' + v + '\\s*\\([^)]*\\)')
    for (let k = 0; k < lines.length; k++) {
      if (k === i) continue
      if (callRe.test(lines[k])) {
        out.push({ idx: k, text: lines[k] })
        let j = k + 1
        while (j < lines.length && /^\s*\./.test(lines[j])) { out.push({ idx: j, text: lines[j] }); j++ }
        const dv = lines[k].match(new RegExp('(?:const|let)\\s+(\\w+)[^=]*=.*\\b' + v + '\\s*\\('))
        if (dv) {
          const d = dv[1]
          const useRe = new RegExp(`(?:^|\\b)${d}\\s*(?:=\\s*(?:await\\s+)?${d}\\s*\\.|\\.)`)
          for (let m2 = 0; m2 < lines.length; m2++) if (useRe.test(lines[m2])) out.push({ idx: m2, text: lines[m2] })
          console.log(`DERIVED ${d} <- ${v}() at line ${k + 1}`)
        }
      }
    }
  }
  return out
}

function walk(d) {
  let r = []
  for (const e of readdirSync(d)) {
    const f = join(d, e)
    if (statSync(f).isDirectory()) r = r.concat(walk(f))
    else if (['.ts', '.tsx'].includes(extname(f))) r.push(f)
  }
  return r
}

for (const f of walk(ROOT + '/src')) {
  const rel = relative(ROOT, f).split('\\').join('/')
  if (/\/__tests__\/|\.test\.|\.stories\.|\/stories\//.test(rel)) continue
  const src = readFileSync(f, 'utf8')
  const lines = src.split('\n')
  const old = shippedLines(lines)
  for (const { idx, text } of ext(lines)) {
    const t = text.trim()
    if (t.startsWith('//') || t.startsWith('*')) continue
    if (PAT.some((p) => p.test(t)) && !old.has(idx)) console.log(`NEW ${rel}:${idx + 1}  ${t}`)
  }
}
console.log('probe done')
