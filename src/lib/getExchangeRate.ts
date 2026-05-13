/**
 * Server-side cached exchange rate fetcher.
 *
 * Reuses the same iliria98.com scraping logic as /api/exchange-rate
 * but wraps it in unstable_cache so Server Components can call it
 * without triggering a localhost fetch round-trip.
 *
 * Cache TTL: 1 hour — matches the API route's `revalidate = 3600`.
 */
import { unstable_cache } from 'next/cache'

async function scrapeEurAllRate(): Promise<number | null> {
  try {
    const res = await fetch('https://iliria98.com/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; lero.al/1.0)' },
    })
    if (!res.ok) return null
    const html = await res.text()

    const eurBlock =
      html.match(/EUR\.png[\s\S]{0,200}/i) ??
      html.match(/>EUR<[\s\S]{0,200}/i) ??
      html.match(/EUR[^A-Z]{0,200}/i)

    if (eurBlock) {
      const nums = [...eurBlock[0].matchAll(/(\d{2,3}[.,]\d{1,2})/g)]
        .map(m => parseFloat(m[1].replace(',', '.')))
        .filter(n => n >= 80 && n <= 160)
      if (nums.length >= 2) return Math.round(((nums[0] + nums[1]) / 2) * 100) / 100
      if (nums.length === 1) return nums[0]
    }

    const generic = html.match(/EUR[^<\d]{0,80}(\d{2,3}[.,]\d{1,2})/i)
    if (generic) {
      const rate = parseFloat(generic[1].replace(',', '.'))
      if (rate >= 80 && rate <= 160) return rate
    }
    return null
  } catch {
    return null
  }
}

export const getExchangeRate = unstable_cache(
  scrapeEurAllRate,
  ['exchange-rate'],
  { revalidate: 3600 },
)

/** Convert a price between ALL and EUR. Returns original price if rate is null. */
export function convertPrice(
  price: number,
  from: string,
  to: string,
  rate: number | null,
): number {
  if (!rate || from === to) return price
  if (to === 'EUR' && from === 'ALL') return Math.round(price / rate)
  if (to === 'ALL' && from === 'EUR') return Math.round(price * rate)
  return price
}
