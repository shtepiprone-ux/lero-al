/**
 * sanitizeCmsHtml.test.ts — Task 884 (R2, R4/T1, T1b).
 *
 * A payload table of the known XSS classes a CMS-authored body can carry (§3.1, §3.4): script
 * injection, event-handler attributes, dangerous URL schemes, embedded frames/forms/style, and
 * protocol-relative links. Each "removed" row must be neutralised; each "kept" row must survive
 * unchanged. T1b additionally round-trips every real fixture body from
 * `src/stories/patterns/mantine/CmsPageView.stories.tsx` (869) byte-identical, so the sanitiser
 * never visibly changes the legitimate rich text it is meant to protect.
 */
import { describe, it, expect } from 'vitest'
import { sanitizeCmsHtml } from '../sanitizeCmsHtml'

describe('sanitizeCmsHtml — removed payloads (R4/T1)', () => {
  it('strips a <script> tag and its text content', () => {
    const out = sanitizeCmsHtml('<p>hello</p><script>alert(1)</script>')
    expect(out).not.toContain('<script')
    expect(out).not.toContain('alert(1)')
    expect(out).toContain('hello')
  })

  it('strips an onerror handler on an <img>', () => {
    const out = sanitizeCmsHtml('<p>text</p><img src=x onerror=alert(1)>')
    expect(out).not.toContain('onerror')
    expect(out).not.toContain('alert(1)')
    expect(out).toContain('text')
  })

  it('strips an onload handler on an <svg>, and the svg itself', () => {
    const out = sanitizeCmsHtml('<p>text</p><svg onload=alert(1)></svg>')
    expect(out).not.toContain('onload')
    expect(out).not.toContain('<svg')
    expect(out).toContain('text')
  })

  it('strips an <iframe> entirely', () => {
    const out = sanitizeCmsHtml('<p>text</p><iframe src="https://x"></iframe>')
    expect(out).not.toContain('<iframe')
    expect(out).not.toContain('https://x')
    expect(out).toContain('text')
  })

  it('removes a javascript: href', () => {
    const out = sanitizeCmsHtml('<a href="javascript:alert(1)">click</a>')
    expect(out).not.toContain('javascript:')
    expect(out).toContain('click')
  })

  it('removes a JaVaScRiPt: href (case-insensitive scheme)', () => {
    const out = sanitizeCmsHtml('<a href="JaVaScRiPt:alert(1)">click</a>')
    expect(out.toLowerCase()).not.toContain('javascript:')
    expect(out).toContain('click')
  })

  it('removes an entity-encoded javascript: href', () => {
    const out = sanitizeCmsHtml('<a href="&#106;avascript:alert(1)">click</a>')
    expect(out.toLowerCase()).not.toContain('javascript:')
    expect(out).toContain('click')
  })

  it('removes a data: href', () => {
    const out = sanitizeCmsHtml('<a href="data:text/html,%3Cscript%3Ealert(1)%3C/script%3E">click</a>')
    expect(out).not.toContain('data:')
    expect(out).toContain('click')
  })

  it('removes a protocol-relative href', () => {
    const out = sanitizeCmsHtml('<a href="//evil.example">click</a>')
    expect(out).not.toContain('//evil.example')
    expect(out).toContain('click')
  })

  it('strips onclick and style attributes from a <p>, keeping its text', () => {
    const out = sanitizeCmsHtml('<p onclick="x" style="color:red">text</p>')
    expect(out).not.toContain('onclick')
    expect(out).not.toContain('style=')
    expect(out).not.toContain('color:red')
    expect(out).toContain('text')
  })

  it('strips a <form> and its <input>', () => {
    const out = sanitizeCmsHtml('<p>text</p><form><input></form>')
    expect(out).not.toContain('<form')
    expect(out).not.toContain('<input')
    expect(out).toContain('text')
  })

  it('strips a <style> tag and its content', () => {
    const out = sanitizeCmsHtml('<p>text</p><style>p{color:red}</style>')
    expect(out).not.toContain('<style')
    expect(out).not.toContain('color:red')
    expect(out).toContain('text')
  })
})

describe('sanitizeCmsHtml — kept content (R4/T1)', () => {
  it('keeps ordinary rich text', () => {
    expect(sanitizeCmsHtml('<h2>Title</h2>')).toBe('<h2>Title</h2>')
    expect(sanitizeCmsHtml('<p>text</p>')).toBe('<p>text</p>')
    expect(sanitizeCmsHtml('<strong>bold</strong>')).toBe('<strong>bold</strong>')
    expect(sanitizeCmsHtml('<ul><li>one</li></ul>')).toBe('<ul><li>one</li></ul>')
  })

  it('keeps an https href unchanged', () => {
    expect(sanitizeCmsHtml('<a href="https://lero.al">lero</a>')).toBe('<a href="https://lero.al">lero</a>')
  })

  it('keeps a relative href unchanged', () => {
    expect(sanitizeCmsHtml('<a href="/sq/contact">contact</a>')).toBe('<a href="/sq/contact">contact</a>')
  })

  it('keeps a bare fragment href unchanged', () => {
    expect(sanitizeCmsHtml('<a href="#">top</a>')).toBe('<a href="#">top</a>')
  })

  it('keeps a fragment href with a target unchanged', () => {
    expect(sanitizeCmsHtml('<a href="#section">jump</a>')).toBe('<a href="#section">jump</a>')
  })

  it('keeps a mailto href unchanged', () => {
    expect(sanitizeCmsHtml('<a href="mailto:a@b.c">email</a>')).toBe('<a href="mailto:a@b.c">email</a>')
  })

  it('keeps a table with colspan unchanged', () => {
    const html = '<table><tr><td colspan="2">cell</td></tr></table>'
    expect(sanitizeCmsHtml(html)).toBe(html)
  })

  it('adds rel="noopener noreferrer" to a target="_blank" link', () => {
    const out = sanitizeCmsHtml('<a href="https://lero.al" target="_blank">lero</a>')
    expect(out).toContain('target="_blank"')
    expect(out).toContain('rel="noopener noreferrer"')
  })
})

describe('sanitizeCmsHtml — null/undefined/empty and idempotency (R2)', () => {
  it('returns "" for null, undefined and empty string', () => {
    expect(sanitizeCmsHtml(null)).toBe('')
    expect(sanitizeCmsHtml(undefined)).toBe('')
    expect(sanitizeCmsHtml('')).toBe('')
  })

  it('is idempotent over the removed/kept payload table', () => {
    const payloads = [
      '<script>alert(1)</script>',
      '<img src=x onerror=alert(1)>',
      '<svg onload=alert(1)></svg>',
      '<iframe src="https://x"></iframe>',
      '<a href="javascript:alert(1)">click</a>',
      '<p onclick="x" style="color:red">text</p>',
      '<form><input></form>',
      '<style>p{color:red}</style>',
      '<h2>Title</h2>',
      '<p>text</p>',
      '<ul><li>one</li></ul>',
      '<a href="https://lero.al">lero</a>',
      '<a href="/sq/contact">contact</a>',
      '<a href="#">top</a>',
      '<a href="mailto:a@b.c">email</a>',
      '<table><tr><td colspan="2">cell</td></tr></table>',
    ]
    for (const payload of payloads) {
      const once = sanitizeCmsHtml(payload)
      const twice = sanitizeCmsHtml(once)
      expect(twice).toBe(once)
    }
  })
})

// T1b — round-trip every real fixture body from CmsPageView.stories.tsx (869) byte-identical.
// Copied verbatim (not imported: FIXTURES is not exported and the Story file is out of this
// task's scope, §7) from src/stories/patterns/mantine/CmsPageView.stories.tsx:44-104, the
// `pageBody`/`richBody` values for each of the four locales.
function h2(text: string): string {
  return `<h2>${text}</h2>`
}
function p(text: string): string {
  return `<p>${text}</p>`
}
function ul(itemsHtml: string): string {
  return `<ul>${itemsHtml}</ul>`
}
function li(text: string): string {
  return `<li>${text}</li>`
}
function link(href: string, text: string): string {
  return `<a href="${href}">${text}</a>`
}

const STORY_FIXTURE_BODIES: string[] = [
  // en
  [
    h2('1. Introduction'),
    p('These terms govern your use of Lero.al. By using the site you agree to them.'),
    ul(li('You must be at least 18 years old.') + li('Listings must be accurate.')),
    p(`See our ${link('/en/privacy-policy', 'Privacy Policy')} for how we handle your data.`),
  ].join(''),
  [
    h2('Section heading'),
    p(`A paragraph with ${link('#', 'a link')} inside it.`),
    ul(li('First item') + li('Second item')),
    p(`A long unbroken token: https://example.com/${'a'.repeat(120)}`),
  ].join(''),
  // sq
  [
    h2('1. Hyrje'),
    p('Këto kushte rregullojnë përdorimin tuaj të Lero.al. Duke përdorur faqen, ju i pranoni ato.'),
    ul(li('Duhet të jeni mbi 18 vjeç.') + li('Shpalljet duhet të jenë të sakta.')),
    p(`Shihni ${link('/sq/politika-e-privatesise', 'Politikën e Privatësisë')} për më shumë.`),
  ].join(''),
  [
    h2('Titull i seksionit'),
    p(`Një paragraf me ${link('#', 'një lidhje')} brenda tij.`),
    ul(li('Artikulli i parë') + li('Artikulli i dytë')),
    p(`Një shenjë e gjatë e pandërprerë: https://example.com/${'a'.repeat(120)}`),
  ].join(''),
  // uk
  [
    h2('1. Вступ'),
    p('Ці умови регулюють використання Lero.al. Використовуючи сайт, ви погоджуєтесь із ними.'),
    ul(li('Вам має бути щонайменше 18 років.') + li('Оголошення мають бути точними.')),
    p(`Дивіться ${link('/uk/politika-konfidentsiynosti', 'Політику конфіденційності')} для деталей.`),
  ].join(''),
  [
    h2('Заголовок розділу'),
    p(`Абзац із ${link('#', 'посиланням')} всередині.`),
    ul(li('Перший пункт') + li('Другий пункт')),
    p(`Довгий нерозривний токен: https://example.com/${'a'.repeat(120)}`),
  ].join(''),
  // it
  [
    h2('1. Introduzione'),
    p('Questi termini disciplinano l’uso di Lero.al. Utilizzando il sito, li accetti.'),
    ul(li('Devi avere almeno 18 anni.') + li('Gli annunci devono essere accurati.')),
    p(`Consulta la ${link('/it/informativa-privacy', 'Informativa sulla privacy')} per i dettagli.`),
  ].join(''),
  [
    h2('Titolo della sezione'),
    p(`Un paragrafo con ${link('#', 'un link')} al suo interno.`),
    ul(li('Primo elemento') + li('Secondo elemento')),
    p(`Un token lungo ininterrotto: https://example.com/${'a'.repeat(120)}`),
  ].join(''),
]

describe('sanitizeCmsHtml — Story fixture round-trip (T1b, §3.4a)', () => {
  it.each(STORY_FIXTURE_BODIES.map((body, i) => [i, body] as const))(
    'fixture %i round-trips byte-identical',
    (_i, body) => {
      expect(sanitizeCmsHtml(body)).toBe(body)
    },
  )

  it('is idempotent over every Story fixture body', () => {
    for (const body of STORY_FIXTURE_BODIES) {
      expect(sanitizeCmsHtml(sanitizeCmsHtml(body))).toBe(sanitizeCmsHtml(body))
    }
  })
})

// ── Task 868 (R16, T7) — the allowlist grows by exactly columns, Cloudinary images and text-align ───────
const CLD = 'https://res.cloudinary.com/demo/image/upload/v1/cms/pages/a.jpg'
const COLUMNS_2 =
  '<div data-type="columns" data-cols="2"><div data-type="column"><p>left</p></div><div data-type="column"><p>right</p></div></div>'
const COLUMNS_3 =
  '<div data-type="columns" data-cols="3"><div data-type="column"><p>a</p></div><div data-type="column"><p>b</p></div><div data-type="column"><p>c</p></div></div>'

describe('sanitizeCmsHtml — Task 868 additions kept (T7)', () => {
  it.each([
    ['a 2-column block', COLUMNS_2],
    ['a 3-column block', COLUMNS_3],
    ['a Cloudinary image with alt', `<p>x</p><img src="${CLD}" alt="Fasada" />`],
    ['a Cloudinary image with width and height', `<img src="${CLD}" alt="x" width="640" height="480" />`],
    ['centred text', '<p style="text-align:center">x</p>'],
    ['justified H2 text', '<h2 style="text-align:justify">x</h2>'],
    ['right-aligned list item', '<ul><li style="text-align:right">x</li></ul>'],
  ])('keeps %s byte-identical', (_name, html) => {
    expect(sanitizeCmsHtml(html)).toBe(html)
  })

  it('is idempotent over the kept rows', () => {
    for (const html of [COLUMNS_2, COLUMNS_3, `<img src="${CLD}" alt="x" />`, '<p style="text-align:center">x</p>']) {
      expect(sanitizeCmsHtml(sanitizeCmsHtml(html))).toBe(sanitizeCmsHtml(html))
    }
  })
})

describe('sanitizeCmsHtml — Task 868 additions dropped (T7)', () => {
  it('drops an img from another host', () => {
    expect(sanitizeCmsHtml('<p>t</p><img src="https://evil.example/a.jpg" alt="x">')).toBe('<p>t</p>')
  })

  it('drops an img whose host only starts with the Cloudinary host', () => {
    expect(sanitizeCmsHtml('<img src="https://res.cloudinary.com.evil.example/a.jpg">')).toBe('')
    expect(sanitizeCmsHtml('<img src="https://res.cloudinary.com@evil.example/a.jpg">')).toBe('')
  })

  it.each([
    ['a data: URI', '<img src="data:image/png;base64,AAAA" alt="x">'],
    ['a relative path', '<img src="/uploads/a.jpg" alt="x">'],
    ['a protocol-relative URL', '<img src="//res.cloudinary.com/a.jpg" alt="x">'],
    ['an http (not https) Cloudinary URL', '<img src="http://res.cloudinary.com/a.jpg" alt="x">'],
    ['a javascript: URI', '<img src="javascript:alert(1)">'],
    ['an img with no src', '<img alt="x">'],
  ])('drops an img with %s', (_name, html) => {
    expect(sanitizeCmsHtml(html)).toBe('')
  })

  it('strips onerror and other attributes from a kept Cloudinary img', () => {
    const out = sanitizeCmsHtml(`<img src="${CLD}" alt="x" onerror="alert(1)" class="a" style="width:1px">`)
    expect(out).not.toContain('onerror')
    expect(out).not.toContain('class')
    expect(out).not.toContain('style')
    expect(out).toContain(`src="${CLD}"`)
  })

  it('drops any other data-* value or attribute on a div', () => {
    expect(sanitizeCmsHtml('<div data-type="evil"><p>x</p></div>')).toBe('<div><p>x</p></div>')
    expect(sanitizeCmsHtml('<div data-type="columns" data-cols="9"><p>x</p></div>')).toBe(
      '<div data-type="columns"><p>x</p></div>',
    )
    expect(sanitizeCmsHtml('<div data-x="1" class="c" onclick="x"><p>x</p></div>')).toBe('<div><p>x</p></div>')
  })

  it('still removes style="color:red" (884 contract) and any style other than text-align', () => {
    expect(sanitizeCmsHtml('<p style="color:red">x</p>')).toBe('<p>x</p>')
    expect(sanitizeCmsHtml('<p style="text-align:center;color:red">x</p>')).toBe('<p style="text-align:center">x</p>')
    expect(sanitizeCmsHtml('<p style="text-align:expression(alert(1))">x</p>')).toBe('<p>x</p>')
    expect(sanitizeCmsHtml('<div style="text-align:center"><p>x</p></div>')).toBe('<div><p>x</p></div>')
  })
})
