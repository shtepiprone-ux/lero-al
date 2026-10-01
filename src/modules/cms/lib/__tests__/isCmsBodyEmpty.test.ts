/**
 * isCmsBodyEmpty.test.ts — Task 868 (R18, T8). An empty rich-text document is `<p></p>`, not `''`.
 */
import { describe, it, expect } from 'vitest'
import { isCmsBodyEmpty } from '../isCmsBodyEmpty'

const CLD = 'https://res.cloudinary.com/demo/image/upload/v1/cms/pages/a.jpg'

describe('isCmsBodyEmpty (T8)', () => {
  it.each([
    ['an empty string', ''],
    ['null', null],
    ['undefined', undefined],
    ['an empty paragraph', '<p></p>'],
    ['a whitespace paragraph and a break', '<p> </p><br>'],
    ['a non-breaking-space paragraph', '<p>&nbsp;</p>'],
    ['a numeric-entity nbsp', '<p>&#160;</p>'],
    ['empty nested columns', '<div data-type="columns" data-cols="2"><div data-type="column"><p></p></div></div>'],
    ['a lone script', '<script>alert(1)</script>'],
    ['an image from another host only', '<img src="https://evil.example/a.jpg" alt="x">'],
  ])('%s → empty', (_name, html) => {
    expect(isCmsBodyEmpty(html)).toBe(true)
  })

  it.each([
    ['a paragraph with text', '<p>x</p>'],
    ['plain text', 'Përmbajtje'],
    ['a Cloudinary image alone', `<img src="${CLD}" alt="x">`],
    ['text inside columns', '<div data-type="columns" data-cols="2"><div data-type="column"><p>x</p></div></div>'],
    ['a table cell with text', '<table><tbody><tr><td>x</td></tr></tbody></table>'],
  ])('%s → not empty', (_name, html) => {
    expect(isCmsBodyEmpty(html)).toBe(false)
  })
})
