/**
 * Task 1035 AC2: the one rule for "may this listing be indexed?". The integration fixtures name every synthetic listing `zz_synth_<run>-<tag>`; the prefix is a safe marker because
 * a session cannot write a slug with `_` (the database guard allows `^[a-z0-9]+(-[a-z0-9]+)*$`), so no real listing can start with it. The LIKE pattern the public filter sends to
 * the database must escape BOTH underscores: an unescaped `_` matches any character, and `zz-synth-house` is a valid user slug that must stay public. Every value is synthetic.
 */
import { describe, expect, it } from 'vitest'
import {
  SYNTHETIC_LISTING_SLUG_PREFIX,
  SYNTHETIC_LISTING_SLUG_LIKE,
  isSyntheticListingSlug,
  isListingIndexable,
} from '../indexing'

/** a LIKE pattern read the way PostgreSQL reads it: `\` makes the next character literal, `%` is any run of characters, `_` is any one character */
function likeToRegExp(pattern: string): RegExp {
  let source = ''
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i]
    if (ch === '\\') {
      i += 1
      source += (pattern[i] ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    } else if (ch === '%') {
      source += '.*'
    } else if (ch === '_') {
      source += '.'
    } else {
      source += ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    }
  }
  return new RegExp(`^${source}$`, 's')
}

const BACKSLASH = String.fromCharCode(92)

describe('synthetic listing slugs (Task 1035 AC2)', () => {
  it('the prefix is the one the integration fixtures use', () => {
    expect(SYNTHETIC_LISTING_SLUG_PREFIX).toBe('zz_synth_')
  })

  it('a slug that starts with the prefix is synthetic and not indexable', () => {
    for (const slug of ['zz_synth_abc-x', 'zz_synth_mi5k3a1f0b2c-delete-mine', 'zz_synth_']) {
      expect(isSyntheticListingSlug(slug), slug).toBe(true)
      expect(isListingIndexable({ slug }), slug).toBe(false)
    }
  })

  it('a real slug is indexable, however close to the prefix it looks', () => {
    for (const slug of ['zz-synth-house', 'zzsynth', 'apartament-1', 'zz-synth-', 'zz_synth', 'zz_synthx-flat', 'a-zz_synth_b', 'ZZ_SYNTH_ABC', '']) {
      expect(isSyntheticListingSlug(slug), slug).toBe(false)
      expect(isListingIndexable({ slug }), slug).toBe(true)
    }
  })

  it('the LIKE pattern is the prefix with BOTH underscores escaped, then a wildcard', () => {
    expect(SYNTHETIC_LISTING_SLUG_LIKE).toBe(`zz${BACKSLASH}_synth${BACKSLASH}_%`)
    expect(SYNTHETIC_LISTING_SLUG_LIKE.split(BACKSLASH + '_')).toHaveLength(3)
    expect(SYNTHETIC_LISTING_SLUG_LIKE.replace(/\\_/g, '')).not.toContain('_')
  })

  it('the LIKE pattern, read the way the database reads it, matches exactly what isSyntheticListingSlug says', () => {
    const like = likeToRegExp(SYNTHETIC_LISTING_SLUG_LIKE)
    for (const slug of ['zz_synth_abc-x', 'zz_synth_', 'zz_synth_mi5k3a1f0b2c-delete-mine']) {
      expect(like.test(slug), slug).toBe(true)
    }
    // an unescaped `_` would match each of these
    for (const slug of ['zz-synth-house', 'zzxsynthxabc', 'zz_synthxabc', 'zzxsynth_abc', 'zz-synth-flat-2', 'apartament-1', 'zzsynth']) {
      expect(like.test(slug), slug).toBe(false)
      expect(isSyntheticListingSlug(slug), slug).toBe(false)
    }
  })
})
