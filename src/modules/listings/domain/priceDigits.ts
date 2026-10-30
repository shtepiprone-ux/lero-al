/**
 * The price field takes digits only (Task 923 R102, owner decision D73). A browser number field cannot hold "20 000 000 000" and silently drops what it cannot parse,
 * so the legacy price field is a text field in numeric input mode and this pure helper turns what a person typed or pasted into the stored number.
 *
 * Task 907 moves the listing form to canonical Mantine and reuses this helper: it is the one owner of the parsing.
 */

/** The most digits a price keeps. 15 digits stay below `Number.MAX_SAFE_INTEGER`, so the number is exact. */
const MAX_PRICE_DIGITS = 15

/**
 * Removes every character that is not an ASCII digit 0-9 (spaces, U+00A0, U+202F, dots, commas, letters, signs), removes leading zeros, keeps the first
 * 15 digits and returns the number, or `undefined` when no digit is left.
 */
export function parsePriceDigits(raw: string): number | undefined {
  const digits = raw.replace(/[^0-9]/g, '').replace(/^0+/, '').slice(0, MAX_PRICE_DIGITS)
  return digits === '' ? undefined : Number(digits)
}
