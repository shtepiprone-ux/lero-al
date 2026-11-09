// @vitest-environment node
/**
 * Client-side sinks (Task 923 Revision 7, findings S9 / S11): where a page can run a person's or an editor's data as markup, script or a link target.
 *  - a link that opens a new tab has `rel="noopener"` (the opened page cannot reach back through `window.opener`);
 *  - `window.open` passes `noopener`, except the one call of `OPENER_ALLOWED` (Task 927 D27);
 *  - `dangerouslySetInnerHTML` is used only with a sanitiser or with JSON the code itself made, from the allowlist below;
 *  - no `eval`, `new Function` or string `setTimeout` anywhere;
 *  - a public environment variable (shipped to every browser) never carries a secret.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'
import { hasDirective } from './directives'

const ROOT = process.cwd()
function walk(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) { if (name === 'node_modules' || name === '__tests__') continue; walk(p, acc) } else acc.push(p)
  }
  return acc
}
const files = walk(join(ROOT, 'src')).filter((f) => /\.tsx?$/.test(f) && !/\.(test|stories)\./.test(f) && !relative(ROOT, f).split('\\').join('/').startsWith('src/stories/')).map((f) => ({ file: relative(ROOT, f).split('\\').join('/'), text: readFileSync(f, 'utf8') }))

/**
 * The one `window.open` that keeps its opener, by file and exact call text. Task 927 D27: Google's sign-in window must reach this site's callback page through `window.opener`;
 * it only ever loads Google's authorization endpoint and then this origin.
 */
const OPENER_ALLOWED: Record<string, string> = {
  'src/lib/auth/googlePopup.ts': 'window.open(attempt.url, POPUP_NAME, POPUP_FEATURES)',
}

/** Every `window.open(...)` without `noopener`, except a call whose file and exact text are in `OPENER_ALLOWED`. */
function windowOpenViolations(sources: { file: string; text: string }[]): string[] {
  const bad: string[] = []
  for (const f of sources) for (const m of f.text.matchAll(/window\.open\([^)]*\)/g)) {
    if (!/noopener/.test(m[0]) && OPENER_ALLOWED[f.file] !== m[0]) bad.push(`${f.file}: ${m[0].slice(0, 100)}`)
  }
  return bad
}

/** Every `target="_blank"` with no `noopener` near it, and every spread object that adds `target: '_blank'` without it. */
function blankTargetViolations(sources: { file: string; text: string }[]): string[] {
  const bad: string[] = []
  for (const f of sources) {
      // JSX attributes can hold `<Icon />` elements, so a tag cannot be cut out with a simple pattern: each `target="_blank"` needs a `noopener` within the few lines around it
      const lines = f.text.split('\n')
      lines.forEach((line, i) => {
        if (!/target=["']_blank["']/.test(line)) return
        const around = lines.slice(Math.max(0, i - 6), i + 7).join('\n')
        if (!/noopener/.test(around)) bad.push(`${f.file}:${i + 1}: ${line.trim().slice(0, 100)}`)
      })
      // a spread that adds the attributes: `{...(ext ? { target: '_blank', rel: 'noopener noreferrer' } : {})}`
      for (const m of f.text.matchAll(/target:\s*['"]_blank['"][^}]*\}/g)) {
        if (!/noopener/.test(m[0])) bad.push(`${f.file}: ${m[0].slice(0, 100)}`)
      }
  }
  return bad
}

/** Every eval, Function constructor, innerHTML write (`=` and `+=`), document.write / writeln and string timer, outside comments. */
function codeEvalViolations(sources: { file: string; text: string }[]): string[] {
  const bad: string[] = []
  for (const f of sources) {
    const code = f.text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
    if (/\beval\s*\(/.test(code)) bad.push(`${f.file}: eval`)
    if (/(^|[^\w$.])Function\s*\(/.test(code)) bad.push(`${f.file}: Function constructor`)
    if (/\.innerHTML\s*\+?=(?!=)/.test(code)) bad.push(`${f.file}: innerHTML write`)
    if (/document\.write(ln)?\s*\(/.test(code)) bad.push(`${f.file}: document.write`)
    if (/set(Timeout|Interval)\(\s*['"`]/.test(code)) bad.push(`${f.file}: string timer`)
  }
  return bad
}

describe('new-tab links', () => {
  it('every target="_blank" has rel with noopener, on the same element', () => {
    const bad = blankTargetViolations(files)
    expect(bad, bad.join('\n')).toEqual([])
  })

  it('every window.open passes noopener', () => {
    const bad = windowOpenViolations(files)
    expect(bad, bad.join('\n')).toEqual([])
  })

  it('the checker sees an unsafe link (planted, through the same function the rule uses)', () => {
    expect(blankTargetViolations([{ file: 'src/x.tsx', text: '<a href="https://x.example" target="_blank">x</a>' }])).toHaveLength(1)
    expect(blankTargetViolations([{ file: 'src/x.tsx', text: "{...(ext ? { target: '_blank' } : {})}" }])).toHaveLength(1)
    expect(blankTargetViolations([{ file: 'src/x.tsx', text: '<a href="https://x.example" target="_blank" rel="noopener noreferrer">x</a>' }])).toEqual([])
  })
})

describe('raw HTML and code evaluation', () => {
  /** each use of dangerouslySetInnerHTML, with why it is safe */
  const RAW_HTML_ALLOWED: Record<string, string> = {
    'src/modules/cms/components/CmsPageView.tsx': 'the body passes through sanitizeCmsHtml (allow-listed tags and attributes) before it is output',
    'src/modules/listings/components/SimilarListings.tsx': 'a speculation-rules script whose JSON is made by JSON.stringify from internal listing URLs (no user markup)',
  }

  it('dangerouslySetInnerHTML appears only in the allowlisted files', () => {
    const used = files.filter((f) => /dangerouslySetInnerHTML/.test(f.text)).map((f) => f.file)
    expect(used.filter((f) => !(f in RAW_HTML_ALLOWED)), 'a new raw-HTML sink needs a sanitiser and an entry with its reason').toEqual([])
  })

  it('the CMS body is sanitised in the same expression it is output', () => {
    const cms = files.find((f) => f.file === 'src/modules/cms/components/CmsPageView.tsx')!.text
    expect(cms).toMatch(/dangerouslySetInnerHTML=\{\{\s*__html:\s*sanitizeCmsHtml\(/)
  })

  it('no eval, Function constructor, innerHTML write, document.write or string timers', () => {
    const bad = codeEvalViolations(files)
    expect(bad, bad.join('\n')).toEqual([])
  })

  it('each code-evaluation rule sees its planted sink, and a comment is not code', () => {
    for (const text of ['eval(x)', 'new Function(x)', 'const f = Function(x)', 'el.innerHTML = x', 'el.innerHTML += x', 'document.write(x)', 'document.writeln(x)', "setTimeout('go()', 1)"]) {
      expect(codeEvalViolations([{ file: 'src/x.ts', text }]), text).toHaveLength(1)
    }
    expect(codeEvalViolations([{ file: 'src/x.ts', text: '// eval(x)\n/* el.innerHTML = x */\nel.textContent = x' }])).toEqual([])
  })

  it('an allow-listed file uses raw HTML exactly once (a second use needs its own review)', () => {
    for (const file of Object.keys(RAW_HTML_ALLOWED)) {
      const text = files.find((f) => f.file === file)?.text ?? ''
      expect(text.match(/dangerouslySetInnerHTML/g)?.length ?? 0, file).toBe(1)
    }
  })
})

describe('secrets in the browser bundle', () => {
  it('no NEXT_PUBLIC variable is named like a secret', () => {
    const bad: string[] = []
    for (const f of files) for (const m of f.text.matchAll(/NEXT_PUBLIC_[A-Z0-9_]+/g)) {
      if (/SECRET|SERVICE|PRIVATE|PASSWORD|API_SECRET/.test(m[0])) bad.push(`${f.file}: ${m[0]}`)
    }
    expect(bad, bad.join('\n')).toEqual([])
  })

  it('the service-role key and the Cloudinary secret are read only in server-only code', () => {
    const SERVER_ONLY = (t: string) => /import ['"]server-only['"]/.test(t) || hasDirective(t, 'use server')
    const offenders: string[] = []
    for (const f of files) {
      if (!/SUPABASE_SERVICE_ROLE_KEY|CLOUDINARY_API_SECRET|CRON_SECRET|UPLOAD_GRANT_SECRET/.test(f.text)) continue
      const isClient = hasDirective(f.text, 'use client')
      if (isClient) offenders.push(`${f.file}: a "use client" file reads a server secret`)
      else if (!SERVER_ONLY(f.text) && !/\/route\.tsx?$|^src\/(middleware|proxy|instrumentation)\.ts$|\/lib\/(cron|supabase|uploads|cloudinary)/.test(f.file) && !/^src\/lib\/(cloudinary\w*)\.ts$/.test(f.file)) {
        offenders.push(`${f.file}: reads a server secret but is not marked server-only, a route or a server library`)
      }
    }
    expect(offenders, offenders.join('\n')).toEqual([])
  })
})

// Task 923 R38 (case SEC-S11-SRV-DENY)
it('[SEC-S11-SRV-DENY] No component opens a new tab without rel noopener', () => {
  const bad: string[] = []
  for (const f of files) {
    const lines = f.text.split('\n')
    lines.forEach((line, i) => {
      if (/target=["']_blank["']/.test(line) && !/noopener/.test(lines.slice(Math.max(0, i - 6), i + 7).join('\n'))) bad.push(`${f.file}:${i + 1}`)
    })
  }
  bad.push(...windowOpenViolations(files))
  expect(bad, bad.join('\n')).toEqual([])
  // the control: the same rule flags a planted unsafe link, so an empty list is not an empty scan
  expect(files.length).toBeGreaterThan(100)
  const planted = '<a href="https://x.example" target="_blank">x</a>'
  expect(/target=["']_blank["']/.test(planted) && !/noopener/.test(planted)).toBe(true)
})

// Task 927 R55 (case SEC-927-FE-SINKS-EXCEPTION)
it('[SEC-927-FE-SINKS-EXCEPTION] the noopener rule excuses only Google\'s sign-in window in googlePopup.ts', () => {
  const popupFile = 'src/lib/auth/googlePopup.ts'
  const allowed = OPENER_ALLOWED[popupFile]
  // the real files: the exception names a call that exists, and with it no window.open is left without noopener
  expect(files.find((f) => f.file === popupFile)?.text, 'the allowed call is in googlePopup.ts').toContain(allowed)
  expect(windowOpenViolations(files)).toEqual([])
  // planted, through the same helper the two rules use: the allowed text in another file is reported, and so is another call in googlePopup.ts
  expect(windowOpenViolations([{ file: 'src/components/Other.tsx', text: `const w = ${allowed}` }])).toEqual([`src/components/Other.tsx: ${allowed}`])
  expect(windowOpenViolations([{ file: popupFile, text: "const w = window.open(x, 'y')" }])).toEqual([`${popupFile}: window.open(x, 'y')`])
  // the allowed call beside another one in the same file: only the other is reported
  expect(windowOpenViolations([{ file: popupFile, text: `${allowed}\nwindow.open(x, 'y')` }])).toEqual([`${popupFile}: window.open(x, 'y')`])
})
