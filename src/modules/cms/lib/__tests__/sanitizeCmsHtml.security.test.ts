/**
 * Security (Task 923 R160, R70 (g), owner D93, case SEC-X-SRV-CMS-OWN-CLOUD): the CMS body keeps an image only when it is on THIS project's Cloudinary account. An image of any
 * other Cloudinary account is removed whole, as the listing images and the database prefix check already require. The cloud name is set with `vi.stubEnv` and restored after each case
 * (a unit run sets none, which is why the older sanitizer tests with the cloud `demo` still pass). The sanitizer is the REAL one; every address is synthetic.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { sanitizeCmsHtml } from '../sanitizeCmsHtml'

const PROJECT = 'lero-cloud'
const OWN = `https://res.cloudinary.com/${PROJECT}/image/upload/v1/cms/pages/own.jpg`
const OTHER = 'https://res.cloudinary.com/other-cloud/image/upload/v1/cms/pages/other.jpg'

beforeEach(() => { vi.stubEnv('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME', PROJECT) })
afterEach(() => { vi.unstubAllEnvs() })

describe('sanitizeCmsHtml', () => {
  it('[SEC-X-SRV-CMS-OWN-CLOUD] another Cloudinary account is refused', () => {
    // allow: an image of the project's own cloud is kept byte-identical
    const own = `<p>x</p><img src="${OWN}" alt="Fasada" />`
    expect(sanitizeCmsHtml(own)).toBe(own)

    // deny: an image of another Cloudinary account is removed whole, with its address
    const other = sanitizeCmsHtml(`<p>t</p><img src="${OTHER}" alt="x">`)
    expect(other).toBe('<p>t</p>')
    expect(other).not.toContain('other-cloud')

    // deny: a cloud whose name only starts with the project's, and the project's name later in the path
    expect(sanitizeCmsHtml(`<img src="https://res.cloudinary.com/${PROJECT}-evil/image/upload/v1/a.jpg">`)).toBe('')
    expect(sanitizeCmsHtml(`<img src="https://res.cloudinary.com/other-cloud/${PROJECT}/image/upload/v1/a.jpg">`)).toBe('')

    // both in one document: only the project's image survives, and the result is stable
    const mixed = sanitizeCmsHtml(`<p>a</p><img src="${OTHER}" alt="x"><img src="${OWN}" alt="y"><p>b</p>`)
    expect(mixed).toBe(`<p>a</p><img src="${OWN}" alt="y" /><p>b</p>`)
    expect(mixed).not.toContain('other-cloud')
    expect(sanitizeCmsHtml(mixed)).toBe(mixed)
  })

  // Whole-project audit 2026-11-07: the vectors of the OWASP XSS Filter Evasion Cheat Sheet that reach an HTML sanitiser (scheme obfuscation by case, entities,
  // whitespace and control characters; event handlers on allowed and removed tags; tags that change parsing: svg, math, noscript, template, base, meta, form
  // attributes). None may leave a script, an event handler, a dangerous scheme or a parsing-changing tag in the output.
  const EVASIONS = [
    '<a href="javascript:alert(1)">x</a>',
    '<a href="JaVaScRiPt:alert(1)">x</a>',
    '<a href="  javascript:alert(1)">x</a>',
    '<a href="java&#x09;script:alert(1)">x</a>',
    '<a href="java\tscript:alert(1)">x</a>',
    '<a href="java\nscript:alert(1)">x</a>',
    '<a href="&#106;&#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;&#58;alert(1)">x</a>',
    '<a href="&#x6A;avascript:alert(1)">x</a>',
    '<a href="vbscript:msgbox(1)">x</a>',
    '<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">x</a>',
    '<a href="//evil.example/x">x</a>',
    '<p onclick="alert(1)">x</p>',
    '<img src=x onerror=alert(1)>',
    '<IMG SRC="javascript:alert(1)">',
    '<svg onload=alert(1)><circle/></svg>',
    '<math><mtext><table><mglyph><style><img src=x onerror=alert(1)>',
    '<noscript><p title="</noscript><img src=x onerror=alert(1)>">',
    '<template><script>alert(1)</script></template>',
    '<base href="https://evil.example/">',
    '<meta http-equiv="refresh" content="0;url=javascript:alert(1)">',
    '<button formaction="javascript:alert(1)">x</button>',
    '<p style="background:url(javascript:alert(1))">x</p>',
    '<p style="text-align:center;background-image:url(x)">x</p>',
    '<scr<script>ipt>alert(1)</scr</script>ipt>',
    '<a href="https://ok.example" onmouseover="alert(1)">x</a>',
  ]

  /** Every way the vector could still run: the rule each output must pass. An unsanitised vector fails at least one (checked below). */
  function executableParts(html: string): string[] {
    const bad: string[] = []
    if (/<\s*(script|svg|math|template|base|meta|button|style|noscript|iframe|object|embed|form)/i.test(html)) bad.push('tag')
    if (/\son[a-z]+\s*=/i.test(html)) bad.push('handler')
    if (/background|url\(/i.test(html)) bad.push('style url')
    for (const m of html.matchAll(/\s(href|src|formaction|action)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi)) {
      const v = m[2].replace(/^["']|["']$/g, '')
      // allowed: https / http / mailto / tel, a site path that is not protocol-relative, or a fragment; anything else (an entity, a control character, another scheme) is refused
      if (!/^(https?:\/\/[^\s]|mailto:|tel:|\/(?!\/)|#)/i.test(v)) bad.push(`${m[1]}=${v.slice(0, 20)}`)
    }
    return bad
  }

  it('[SEC-AUDIT-CMS-EVASION] the rule is not empty: every vector, unsanitised, is refused by it', () => {
    for (const vector of EVASIONS) expect(executableParts(vector), vector).not.toEqual([])
  })

  it.each(EVASIONS)('[SEC-AUDIT-CMS-EVASION] %s leaves nothing executable', (vector) => {
    const out = sanitizeCmsHtml(vector)
    expect(executableParts(out)).toEqual([])
    expect(sanitizeCmsHtml(out)).toBe(out)
  })
})
