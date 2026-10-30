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
})
