export const revalidate = 3600 // ISR: re-fetch at most once per hour

import { getExchangeRates } from '@/lib/getExchangeRate'

export async function GET() {
  const rates = await getExchangeRates()
  return Response.json(
    {
      rates: rates ?? null,
      rate: rates?.EUR ?? null,   // backward-compat single rate field
      updated_at: new Date().toISOString(),
    },
    { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600' } }
  )
}
