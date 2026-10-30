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
 *
 * Task 868 (R16) adds exactly three things for the admin rich-text editor, and nothing else:
 *  - `div` carrying only `data-type` ∈ {columns, column} and `data-cols` ∈ {2, 3} (the layout-columns block);
 *  - `img` carrying only `src`, `alt`, `width`, `height`, and only when `src` is an `https://res.cloudinary.com/`
 *    URL — every other `img` (relative, `data:`, protocol-relative, another host) is dropped whole;
 *  - `style` on `p`, `h2`–`h4` and `li`, restricted to `text-align: left|center|right|justify`.
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

const CLOUDINARY_HOST = 'res.cloudinary.com'

/** `true` only for an `https://res.cloudinary.com/…` URL (the host the upload route writes to). */
function isCloudinaryImageSrc(src: string | undefined): boolean {
  if (!src) return false
  try {
    const url = new URL(src)
    return url.protocol === 'https:' && url.hostname === CLOUDINARY_HOST && !url.username && !url.password
  } catch {
    return false
  }
}

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
    'div',
    'img',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    th: ['colspan', 'rowspan'],
    td: ['colspan', 'rowspan'],
    div: [
      { name: 'data-type', multiple: false, values: ['columns', 'column'] },
      { name: 'data-cols', multiple: false, values: ['2', '3'] },
    ],
    img: ['src', 'alt', 'width', 'height'],
    p: ['style'],
    h2: ['style'],
    h3: ['style'],
    h4: ['style'],
    li: ['style'],
  },
  allowedStyles: {
    '*': { 'text-align': [/^(left|center|right|justify)$/] },
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesAppliedToAttributes: ['href'],
  allowProtocolRelative: false,
  disallowedTagsMode: 'discard',
  exclusiveFilter: (frame) =>
    CONTENT_DISCARD_TAGS.has(frame.tag) || (frame.tag === 'img' && !isCloudinaryImageSrc(frame.attribs.src)),
  transformTags: {
    // Drop an out-of-set value together with its attribute (the `values` lists below stay as a second wall).
    div: (tagName, attribs) => {
      const out = { ...attribs }
      if (!(out['data-type'] === 'columns' || out['data-type'] === 'column')) delete out['data-type']
      if (!(out['data-cols'] === '2' || out['data-cols'] === '3')) delete out['data-cols']
      return { tagName, attribs: out }
    },
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
