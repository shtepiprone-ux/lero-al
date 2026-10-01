/**
 * richTextRoundTrip.test.ts — Task 868 (R19, T10). Existing bodies survive the editor.
 *
 * Every body is parsed through the editor's own extension set (`@tiptap/html` `generateJSON`) and written
 * back (`generateHTML`). The text must be unchanged, and every tag the editor does not keep is listed in
 * `LOST_TAGS` — a lost tag is reported here, never silently accepted: a new loss fails this test until it
 * is looked at.
 */
import { describe, it, expect } from 'vitest'
import { generateHTML, generateJSON } from '@tiptap/html'
import { RICH_TEXT_EXTENSIONS } from '../MantineRichTextEditor'
import { RICH_LAYOUT_BODIES } from '@/stories/fixtures/richContent.fixtures'
import { sanitizeCmsHtml } from '@/modules/cms/lib/sanitizeCmsHtml'

function tagsOf(html: string): Set<string> {
  return new Set([...html.matchAll(/<([a-z][a-z0-9]*)\b/gi)].map(m => m[1].toLowerCase()))
}
function textOf(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
}
function roundTrip(html: string): string {
  return generateHTML(generateJSON(html, RICH_TEXT_EXTENSIONS), RICH_TEXT_EXTENSIONS)
}
function lostTags(before: string, after: string): string[] {
  const kept = tagsOf(after)
  return [...tagsOf(before)].filter(tag => !kept.has(tag)).sort()
}

// The bodies of the 884 / 869 fixtures (`sanitizeCmsHtml.test.ts` T1b, `CmsPageView.stories.tsx`): headings,
// links, lists, a long unbroken token, and a table with a spanning cell.
const CMS_FIXTURE_BODIES = [
  '<h2>1. Introduction</h2><p>These terms govern your use of Lero.al.</p><ul><li>You must be at least 18 years old.</li><li>Listings must be accurate.</li></ul><p>See our <a href="/en/privacy-policy">Privacy Policy</a> for how we handle your data.</p>',
  '<h2>Section heading</h2><p>A paragraph with <a href="#">a link</a> inside it.</p><ul><li>First item</li><li>Second item</li></ul><p>A long unbroken token: https://example.com/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa</p>',
  '<p>Plain <strong>bold</strong> and <em>italic</em> text.</p><ol><li>One</li><li>Two</li></ol><blockquote><p>A quote.</p></blockquote>',
  '<table><tbody><tr><th>Name</th><th colspan="2">Details</th></tr><tr><td>A</td><td>B</td><td>C</td></tr></tbody></table>',
]

// Markup an old body can hold that the toolbar does not offer. Known losses are listed, not accepted silently.
const LEGACY_BODY =
  '<h1>One</h1><h5>Five</h5><h6>Six</h6><p>Text <b>b</b> <i>i</i> <u>u</u> <s>s</s> <code>c</code><br>line</p><hr><pre><code>block</code></pre><table><thead><tr><th>H</th></tr></thead><tbody><tr><td>x</td></tr></tbody></table>'

describe('editor round trip (T10)', () => {
  it.each(Object.entries(RICH_LAYOUT_BODIES))('the %s layout fixture keeps its text and every tag', (_locale, body) => {
    const out = roundTrip(body)
    expect(textOf(out)).toBe(textOf(body))
    expect(lostTags(body, out)).toEqual([])
    // What the editor writes is what the public renderer keeps.
    expect(textOf(sanitizeCmsHtml(out))).toBe(textOf(body))
  })

  it.each(CMS_FIXTURE_BODIES.map((body, i) => [i, body] as const))('CMS fixture %i keeps its text and every tag', (_i, body) => {
    const out = roundTrip(body)
    expect(textOf(out)).toBe(textOf(body))
    expect(lostTags(body, out)).toEqual([])
  })

  it('a legacy body keeps its text; the tags the editor renames or drops are exactly the listed ones', () => {
    const out = roundTrip(LEGACY_BODY)
    expect(textOf(out)).toBe(textOf(LEGACY_BODY))
    // `b`/`i` are written as `strong`/`em`, and the table's `thead` becomes a header row inside `tbody`.
    expect(lostTags(LEGACY_BODY, out)).toEqual(['b', 'i', 'thead'])
  })
})
