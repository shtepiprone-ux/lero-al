import sanitizeHtmlLib, { type IOptions } from 'sanitize-html'

/**
 * Task 884 (R2) — the CMS body's stored-XSS defence. `CmsPageView.tsx` is the one place a
 * `legal.manage` holder's authored HTML reaches every visitor's browser (§3.1); this allowlist is
 * that trust boundary's whole configuration, not a hand-rolled regex.
 *
 * `script`/`style`/`textarea`/`noscript`/`iframe`/`object`/`embed`/`svg`/`math`/`form` are removed
 * with their content via `exclusiveFilter`; every other non-allowlisted tag is discarded but its
 * text is kept (`disallowedTagsMode: 'discard'`, the library default). `transformTags.a` enforces
 * `target` limited to `_blank` and stamps `rel="noopener noreferrer"` on it before the attribute
 * allowlist runs, so a caller-supplied `rel`/stray `target` can never survive unfiltered.
 */
const CONTENT_DISCARD_TAGS = new Set([
  'script',
  'style',
  'textarea',
  'noscript',
  'iframe',
  'object',
  'embed',
  'svg',
  'math',
  'form',
])

const cmsHtmlAllowlist: IOptions = {
  allowedTags: [
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'p',
    'br',
    'hr',
    'strong',
    'b',
    'em',
    'i',
    'u',
    's',
    'blockquote',
    'ul',
    'ol',
    'li',
    'a',
    'code',
    'pre',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    th: ['colspan', 'rowspan'],
    td: ['colspan', 'rowspan'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesAppliedToAttributes: ['href'],
  allowProtocolRelative: false,
  disallowedTagsMode: 'discard',
  exclusiveFilter: (frame) => CONTENT_DISCARD_TAGS.has(frame.tag),
  transformTags: {
    a: (tagName, attribs) => {
      const out = { ...attribs }
      if (out.target === '_blank') {
        out.rel = 'noopener noreferrer'
      } else {
        delete out.target
        delete out.rel
      }
      return { tagName, attribs: out }
    },
  },
}

export const CMS_HTML_ALLOWLIST: Readonly<IOptions> = Object.freeze(cmsHtmlAllowlist)

/** Pure and idempotent: `sanitizeCmsHtml(sanitizeCmsHtml(x)) === sanitizeCmsHtml(x)`. */
export function sanitizeCmsHtml(html: string | null | undefined): string {
  if (!html) return ''
  return sanitizeHtmlLib(html, CMS_HTML_ALLOWLIST)
}
