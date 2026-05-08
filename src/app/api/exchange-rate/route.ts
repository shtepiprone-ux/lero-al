export const revalidate = 3600 // ISR: re-fetch at most once per hour

async function fetchEurAllRate(): Promise<number | null> {
  try {
    const res = await fetch('https://iliria98.com/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; shtepi.al/1.0)' },
    })
    if (!res.ok) return null
    const html = await res.text()

    // iliria98.com lists buy/sell rates after the EUR flag image or EUR text.
    // HTML pattern: …EUR.png… followed by two numbers (buy, sell) e.g. 95.2 / 95.8
    // We collect all candidate numbers near "EUR" and return the midpoint.

    // Strategy 1: find numbers immediately after EUR flag image src or EUR text
    const eurBlock = html.match(/EUR\.png[\s\S]{0,200}/i)
      ?? html.match(/>EUR<[\s\S]{0,200}/i)
      ?? html.match(/EUR[^A-Z]{0,200}/i)

    if (eurBlock) {
      const nums = [...eurBlock[0].matchAll(/(\d{2,3}[.,]\d{1,2})/g)]
        .map(m => parseFloat(m[1].replace(',', '.')))
        .filter(n => n >= 80 && n <= 160)

      if (nums.length >= 2) {
        // Take midpoint of buy/sell
        return Math.round(((nums[0] + nums[1]) / 2) * 100) / 100
      }
      if (nums.length === 1) return nums[0]
    }

    // Strategy 2: generic scan — find any number in 80-160 range near "EUR"
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

export async function GET() {
  const rate = await fetchEurAllRate()
  return Response.json(
    { rate, updated_at: new Date().toISOString() },
    { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600' } }
  )
}
