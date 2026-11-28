import { theme } from '../theme'

/**
 * Task 990 — the text colours of the CMS editor: the theme's text colours at one shade, plus "default" (no colour) in the editor. No free colour (owner,
 * 2026-11-19: "yes!"): one semantic element has one visual contract. One list for the editor's palette and for `sanitizeCmsHtml`, which keeps a `span`
 * colour only when it equals one of these values exactly.
 *
 * The shade is the theme's `primaryShade` (7): the stop every tuple documents as its text and filled colour that passes WCAG AA (`theme.ts`).
 *
 * Each colour has two spellings of the same theme value: `value`, the theme's hex, which the editor sets; and `rgb`, the form the editor writes into the
 * stored HTML (ProseMirror writes a style through `style.cssText`, `prosemirror-model` `renderSpec`, and the browser's CSSOM serialises a hex colour as
 * `rgb(r, g, b)`).
 */
export const TEXT_COLOR_NAMES = ['brand', 'gray', 'red', 'orange', 'green', 'blueLight'] as const
export type TextColorName = (typeof TEXT_COLOR_NAMES)[number]

const shade = typeof theme.primaryShade === 'number' ? theme.primaryShade : theme.primaryShade?.light

function colorOf(name: TextColorName): { name: TextColorName; value: string; rgb: string } {
  const value = shade === undefined ? undefined : theme.colors?.[name]?.[shade]
  if (!value || !/^#[0-9a-f]{6}$/i.test(value)) throw new Error(`textColors: the theme has no six-digit hex ${name} colour at shade ${String(shade)}`)
  const n = Number.parseInt(value.slice(1), 16)
  return { name, value, rgb: `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})` } // design-tokens-allow: rgb( — the browser's serialization of a theme colour, computed from the theme hex; the sanitizer and the editor compare it, it is not a style value
}

export const TEXT_COLORS: ReadonlyArray<{ name: TextColorName; value: string; rgb: string }> = Object.freeze(
  TEXT_COLOR_NAMES.map(name => Object.freeze(colorOf(name))),
)
