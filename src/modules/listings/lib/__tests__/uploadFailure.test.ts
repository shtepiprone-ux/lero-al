/**
 * Task 957 Revision 3 (owner decision O997-2): every refused or failed photo names its reason. Every case below is one kind of `uploadFailure.ts`.
 */
import { describe, expect, it } from 'vitest'
import { classifySignatureRefusal, classifyWidgetError, DAY_WINDOW_SECONDS } from '../uploadFailure'

describe('classifySignatureRefusal (what our signature route answered)', () => {
  it.each([
    [401, undefined, undefined, 'session'],
    [403, undefined, undefined, 'forbidden'],
    [429, 'rate_limited', 600, 'rate_limited'],
    [429, 'rate_limited', undefined, 'rate_limited'],
    [429, 'rate_limited', DAY_WINDOW_SECONDS, 'rate_limited_day'],
    [500, 'not_configured', undefined, 'not_configured'],
    [500, undefined, undefined, 'unavailable'],
    [503, 'unavailable', undefined, 'unavailable'],
    [400, 'invalid_body', undefined, 'unavailable'],
  ] as const)('%s %s retry-after %s -> %s', (status, code, retry, kind) => {
    expect(classifySignatureRefusal(status, code, retry)).toBe(kind)
  })
})

describe('classifyWidgetError (what the Cloudinary widget handed to onError)', () => {
  it.each([
    [{ status: 0, statusText: '' }, 'network'],
    [{ status: '0', statusText: 'error' }, 'network'],
    ['Network request failed', 'network'],
    ['timeout', 'network'],
    [{ status: 413, statusText: 'Payload Too Large' }, 'too_large'],
    [{ status: 400, statusText: 'File size too large. Got 12000000. Maximum is 10485760.' }, 'too_large'],
    ['File size exceeds the maximum', 'too_large'],
    [{ status: 400, statusText: 'Invalid image file' }, 'format'],
    [{ status: 400, statusText: 'Unsupported file type' }, 'format'],
    [{ status: 401, statusText: 'Unauthorized' }, 'rejected'],
    [{ status: 403, statusText: 'Forbidden' }, 'rejected'],
    [{ status: 420, statusText: 'Rate Limited' }, 'provider_busy'],
    [{ status: 429, statusText: 'Too Many Requests' }, 'provider_busy'],
    [{ status: 502, statusText: 'Bad Gateway' }, 'unavailable'],
    [{ status: 500, statusText: 'Internal Server Error' }, 'unavailable'],
    [{ status: 400, statusText: 'Something else' }, 'failed'],
    [null, 'failed'],
    [undefined, 'failed'],
    [{}, 'failed'],
    [42, 'failed'],
  ] as const)('%j -> %s', (error, kind) => {
    expect(classifyWidgetError(error)).toBe(kind)
  })

  it('the status wins over the words: a 429 that mentions the size is the busy service, not a large file', () => {
    expect(classifyWidgetError({ status: 429, statusText: 'file size quota' })).toBe('provider_busy')
  })
})
