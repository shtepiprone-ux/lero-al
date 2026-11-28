import sanitizeHtmlLib, { type IOptions } from 'sanitize-html'
import { isTrustedImageUrl } from '@/lib/uploads/imageUrl'
import { TEXT_COLORS } from '@/design-system/mantine/richtext/textColors'

/**
 * Task 884 (R2) — the CMS body's stored-XSS defence. `CmsPageView.tsx` is the one place a
 * `legal.manage` holder's authored HTML reaches every visitor's browser (§3.1); this allowlist is
 * that trust boundary's whole configuration, not a hand-rolled regex.
 *
 * The tags in `nonTextTags` are removed with their text and child elements: the library default
 * (`script`, `style`, `textarea`, `option`, `xmp`) plus `noscript`, `iframe`, `object`, `embed`, `svg`,
 * `math` and `form` (a void element such as `embed` has no content to remove). Every other non-allowlisted
 * tag is discarded but its text is kept (`disallowedTagsMode: 'discard'`, the library default).
 * `exclusiveFilter` only drops an `img` whose `src` is not a trusted image. `transformTags.a` enforces
 * `target` limited to `_blank` and stamps `rel="noopener noreferrer"` on it before the attribute
 * allowlist runs, so a caller-supplied `rel`/stray `target` can never survive unfiltered.
 *
 * Task 868 (R16) adds exactly three things for the admin rich-text editor, and nothing else:
 *  - `div` carrying only `data-type` ∈ {columns, column} and `data-cols` ∈ {2, 3} (the layout-columns block);
 *  - `img` carrying only `src`, `alt`, `width`, `height`, and only when `src` is an `https://res.cloudinary.com/`
 *    URL — every other `img` (relative, `data:`, protocol-relative, another host) is dropped whole;
 *  - `style` on `p`, `h2`–`h4` and `li`, restricted to `text-align: left|center|right|justify`.
 *
 * Task 990 (O990-1, the WordPress classic toolbar and its "Text" mode) adds exactly these, and nothing else:
 *  - `del` and `ins` with no attribute;
 *  - `span` carrying only `style="color: <value>"`, where the value equals one of the theme palette (`textColors.ts`) exactly, in either of its two
 *    spellings (the theme's hex, or the `rgb(r, g, b)` the editor writes);
 *  - the same `text-align` style on `h5` and `h6`.
 */
const TEXT_ALIGN = { 'text-align': [/^(left|center|right|justify)$/] }
const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const PALETTE_COLOR_STYLE = { color: TEXT_COLORS.flatMap(({ value, rgb }) => [value, rgb]).map(color => new RegExp(`^${escapeRegExp(color)}$`)) }

// The library default list (`node_modules/sanitize-html/index.js:221-227`, 2.18.2) followed by the tags added here.
const NON_TEXT_TAGS = [
  'script',
  'style',
  'textarea',
  'option',
  'xmp',
  'noscript',
  'iframe',
  'object',
  'embed',
  'svg',
  'math',
  'form',
]

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
    'del',
    'ins',
    'span',
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
    h5: ['style'],
    h6: ['style'],
    li: ['style'],
    span: ['style'],
  },
  // per tag, not '*': a span keeps only its palette colour, never an alignment (sanitize-html merges '*' into every tag's own list)
  allowedStyles: {
    p: TEXT_ALIGN,
    h2: TEXT_ALIGN,
    h3: TEXT_ALIGN,
    h4: TEXT_ALIGN,
    h5: TEXT_ALIGN,
    h6: TEXT_ALIGN,
    li: TEXT_ALIGN,
    span: PALETTE_COLOR_STYLE,
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesAppliedToAttributes: ['href'],
  allowProtocolRelative: false,
  disallowedTagsMode: 'discard',
  nonTextTags: NON_TEXT_TAGS,
  // Task 923 R160 (R70 (g), owner D93): only an image of the project's own Cloudinary account is kept, the same check as listing images and the database prefix.
  exclusiveFilter: (frame) => frame.tag === 'img' && !isTrustedImageUrl(frame.attribs.src),
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
