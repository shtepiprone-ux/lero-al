import type { MantineColorsTuple } from '@mantine/core'

/**
 * Canonical brand color source (Task 661). This is the ONLY place the brand hex
 * scale is authored. `theme.ts` imports `brand` verbatim for Mantine; `globals.css`
 * aliases `--brand-*` to Mantine's generated `--mantine-color-brand-*` CSS variables
 * (derived from this same tuple at runtime); emails import BRAND_PRIMARY/BRAND_HOVER
 * because email clients cannot consume CSS variables and must bake the hex at render.
 *
 * Editing this tuple is the single knob: Mantine surfaces, CSS-var/Tailwind brand
 * surfaces, and (on rebuild) emails all move together.
 */
export const brand: MantineColorsTuple = [
  '#FDEEED', // 0 — brand-50
  '#FBDDDA', // 1 — brand-100
  '#F9CCC8', // 2 — brand-200
  '#F7BBB5', // 3 — brand-300
  '#F6AAA3', // 4 — brand-400
  '#F2877E', // 5 — brand-500
  '#F0766C', // 6 — brand-600
  '#EC5447', // 7 — brand-700 (primary)
  '#BD4339', // 8 — brand-800 (hover)
  '#8E322B', // 9 — brand-900
]

export const BRAND_PRIMARY = brand[7]
export const BRAND_HOVER = brand[8]
