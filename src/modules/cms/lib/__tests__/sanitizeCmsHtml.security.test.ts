/**
 * Security (Task 923 R160, R70 (g), owner D93, case SEC-X-SRV-CMS-OWN-CLOUD): the CMS body keeps an image only when it is on THIS project's Cloudinary account. An image of any
 * other Cloudinary account is removed whole, as the listing images and the database prefix check already require. The cloud name is set with `vi.stubEnv` and restored after each case
 * (a unit run sets none, which is why the older sanitizer tests with the cloud `demo` still pass). The sanitizer is the REAL one; every address is synthetic.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { sanitizeCmsHtml } from '../sanitizeCmsHtml'
import { TEXT_COLORS } from '@/design-system/mantine/richtext/textColors'

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

  // Task 972 (AC2): one case per sanitize-html advisory (GitHub lists all three as fixed in 2.18.0, but the CDATA payload of GHSA-x3q4 is removed only from 2.18.2), each payload taken from its GitHub advisory and fed to this allowlist. The noscript
  // payloads carry an image of the project's own cloud, so only the advisory's flaw, not the image rule, could let that image through.
  it('[SEC-972-GHSA-x3q4-9hxx-gx8m] an implied close inside noscript does not end its discarded content', () => {
    const payloads = [
      `<div><noscript></div><img src="${OWN}"></noscript>`,
      `<p>Hi</p><![CDATA[ x > <noscript>]]><a href="https://evil.example/reset">Reset your password</a><img src="${OWN}"></noscript>`,
    ]
    for (const payload of payloads) {
      const out = sanitizeCmsHtml(payload)
      expect(out, payload).not.toContain('<img')
      expect(out, payload).not.toContain(OWN)
      expect(out, payload).not.toContain('evil.example')
      expect(out, payload).not.toContain('Reset your password')
      expect(executableParts(out), payload).toEqual([])
    }
  })

  it('[SEC-972-GHSA-cv27-6wvh-8x7j] a meta refresh to a javascript: or data: URL is removed', () => {
    const payloads = [
      '<meta http-equiv="refresh" content="0;url=javascript:alert(1)">',
      '<meta http-equiv="refresh" content="0;url=data:text/html,aaa">',
      '<p>x</p><META HTTP-EQUIV="Refresh" CONTENT="0; URL=javascript:alert(1)">',
    ]
    for (const payload of payloads) {
      const out = sanitizeCmsHtml(payload)
      expect(out, payload).not.toMatch(/<\s*meta/i)
      expect(out, payload).not.toMatch(/javascript:|data:/i)
      expect(executableParts(out), payload).toEqual([])
    }
  })

  it.each(['animate', 'set', 'animateMotion', 'svg:animate', 'svg:set', 'xlink:animate', 'SVG:ANIMATE'])(
    '[SEC-972-GHSA-374f-7chj-9948] the SVG animation element %s cannot retarget a link to javascript:',
    (tag) => {
      const payloads = [
        `<svg><a href="#safe"><${tag} attributeName="href" values="#safe;javascript:alert(1)" dur=".01s" fill="freeze"/><text>Click</text></a></svg>`,
        `<a href="#safe"><${tag} attributeName="href" values="#safe;javascript:alert(1)" dur=".01s" fill="freeze"/>Click</a>`,
      ]
      for (const payload of payloads) {
        const out = sanitizeCmsHtml(payload)
        expect(out, payload).not.toMatch(/<\s*([a-z]+:)?(animate\w*|set)\b/i)
        expect(out, payload).not.toMatch(/javascript:|attributeName|values=/i)
        expect(executableParts(out), payload).toEqual([])
      }
    },
  )

  // Task 972 (AC2): the allowlist's comment says these tags are removed with their content. The library discards the content of a disallowed tag only when the tag is in
  // `nonTextTags` (`node_modules/sanitize-html/index.js:370`, 2.18.2), and `exclusiveFilter` is not reached for a discarded tag (`:811-815`), so one case per tag proves the list.
  const CONTENT_TAGS = ['noscript', 'iframe', 'object', 'svg', 'math', 'form'] as const

  it.each(CONTENT_TAGS)('[SEC-972-CMS-NONTEXT-TAGS] the text and the child elements of <%s> are not in the output', (tag) => {
    const payloads = [
      `<p>before</p><${tag}>HIDDEN<b>CHILD</b><a href="https://evil.example/x">LINK</a><img src="${OWN}"></${tag}><p>after</p>`,
      `<p>before</p><${tag.toUpperCase()} class="x">HIDDEN<p>CHILD</p></${tag.toUpperCase()}><p>after</p>`,
    ]
    for (const payload of payloads) {
      const out = sanitizeCmsHtml(payload)
      expect(out, payload).toBe('<p>before</p><p>after</p>')
      for (const leaked of ['HIDDEN', 'CHILD', 'LINK', 'evil.example', OWN, '<img', `<${tag}`]) expect(out, payload).not.toContain(leaked)
      expect(sanitizeCmsHtml(out)).toBe(out)
    }
  })

  // `embed` is a void element for the parser (`<embed>HIDDEN</embed>` leaves HIDDEN as ordinary text after it, even with `embed` in `nonTextTags`), so the library has no
  // content of it to discard: the case proves that the element and its attributes are gone and that a following sibling is untouched.
  it('[SEC-972-CMS-NONTEXT-TAGS] <embed> and its address are removed and the next element stays', () => {
    const out = sanitizeCmsHtml('<p>before</p><embed src="https://evil.example/x" type="text/html"><p>after</p>')
    expect(out).toBe('<p>before</p><p>after</p>')
    expect(out).not.toContain('evil.example')
    expect(out).not.toContain('embed')
  })
})

// Task 990 AC5: the markup the O990-1 toolbar and the "Text" mode add reaches the site; a colour is kept only when it equals a value of the theme palette
// (`textColors.ts`), every other style, value and attribute of a span is removed (T3).
describe('sanitizeCmsHtml — the markup of the Task 990 editor', () => {
  it('keeps del, ins, hr, pre, an aligned h5 and h6 and every palette colour', () => {
    const kept = '<p><del>old</del> <ins>new</ins></p><hr /><pre><code>block</code></pre><h5 style="text-align:center">five</h5><h6 style="text-align:right">six</h6>'
    expect(sanitizeCmsHtml(kept)).toBe(kept)
    expect(TEXT_COLORS.length).toBe(6)
    for (const { value, rgb } of TEXT_COLORS) {
      const html = `<p>a <span style="color:${value}">colour</span> b</p>`
      expect(sanitizeCmsHtml(html), value).toBe(html)
      expect(sanitizeCmsHtml(sanitizeCmsHtml(html))).toBe(sanitizeCmsHtml(html))
      // the editor writes the colour through the CSSOM: "color: rgb(r, g, b);" — the same theme value, kept
      expect(sanitizeCmsHtml(`<p><span style="color: ${rgb};">c</span></p>`), rgb).toBe(`<p><span style="color:${rgb}">c</span></p>`)
    }
  })

  it('[SEC-990-CMS-COLOR] the rgb spelling is matched exactly: a neighbouring value or another spelling is removed', () => {
    const { rgb } = TEXT_COLORS[0]
    const parts = rgb.slice(4, -1).split(', ').map(Number)
    const near = `rgb(${parts[0]}, ${parts[1]}, ${(parts[2] + 1) % 256})`
    for (const color of [near, `rgba(${parts.join(', ')}, 0.5)`, rgb.replace(/, /g, ',  '), rgb.toUpperCase()]) {
      expect(sanitizeCmsHtml(`<span style="color: ${color}">x</span>`), color).toBe('<span>x</span>')
    }
  })

  const OUTSIDE = [
    ['a colour outside the palette', '<span style="color:#ff0000">x</span>'],
    ['a named colour', '<span style="color:red">x</span>'],
    ['a palette value with a suffix', `<span style="color:${TEXT_COLORS[0].value}00">x</span>`],
    ['a background', '<span style="background:#b42318">x</span>'],
    ['a background colour', '<span style="background-color:#b42318">x</span>'],
    ['url()', '<span style="color:url(https://evil.example/x)">x</span>'],
    ['expression()', '<span style="color:expression(alert(1))">x</span>'],
    ['text-align on a span', '<span style="text-align:center">x</span>'],
  ] as const

  it.each(OUTSIDE)('[SEC-990-CMS-COLOR] %s is removed from a span', (_name, html) => {
    expect(sanitizeCmsHtml(html)).toBe('<span>x</span>')
  })

  it('[SEC-990-CMS-COLOR] a second style property and every other span attribute are removed, the palette colour stays', () => {
    const value = TEXT_COLORS[0].value
    const out = sanitizeCmsHtml(`<span style="color:${value};background-image:url(x);position:fixed" class="c" id="i" title="t" data-x="1" onclick="alert(1)">x</span>`)
    expect(out).toBe(`<span style="color:${value}">x</span>`)
    expect(sanitizeCmsHtml('<del cite="https://evil.example" datetime="2026" onclick="alert(1)">x</del><ins class="c">y</ins>')).toBe('<del>x</del><ins>y</ins>')
  })

  it('[SEC-990-CMS-COLOR] a colour is never kept on another element', () => {
    const value = TEXT_COLORS[0].value
    expect(sanitizeCmsHtml(`<p style="color:${value}">x</p>`)).toBe('<p>x</p>')
    expect(sanitizeCmsHtml(`<del style="color:${value}">x</del>`)).toBe('<del>x</del>')
  })
})
