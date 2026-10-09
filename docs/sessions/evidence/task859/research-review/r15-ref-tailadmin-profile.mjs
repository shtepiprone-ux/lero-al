// Task 859 review 15b (Opus) - TailAdmin /profile at 390 and 1440: label -> value gap, value -> next label gap,
// font sizes/weights/colours of label and value, and avatar -> name -> subtitle stack (the reference record card).
import { chromium } from 'file:///C:/Claude_Code_Projects/lero-al/node_modules/playwright/index.mjs'
const b = await chromium.launch(); const out = []
for (const w of [390, 1440]) {
  const p = await b.newPage({ viewport: { width: w, height: 1400 } })
  await p.goto('https://demo.tailadmin.com/profile', { waitUntil: 'domcontentloaded', timeout: 45000 }); await p.waitForTimeout(3500)
  out.push({ w, ...(await p.evaluate(() => {
    const byText = t => [...document.querySelectorAll('p, span, h4, h3, div')].find(e => e.children.length === 0 && e.textContent.trim() === t)
    const pick = ['First Name', 'Chowdury', 'Last Name', 'Musharof', 'Email address', 'randomuser@pimjo.com', 'Phone', '+09 363 398 46']
    const el = Object.fromEntries(pick.map(t => [t, byText(t)]))
    const r = t => el[t]?.getBoundingClientRect(); const cs = t => el[t] && getComputedStyle(el[t])
    const st = t => cs(t) && `${cs(t).fontSize} ${cs(t).fontWeight} ${cs(t).color} lh ${cs(t).lineHeight}`
    return {
      labelToValue: [Math.round(r('Chowdury').top - r('First Name').bottom), Math.round(r('Musharof').top - r('Last Name').bottom)],
      valueToNextLabel: [Math.round(r('Last Name').top - r('Chowdury').bottom), Math.round(r('Phone').top - r('randomuser@pimjo.com').bottom)],
      sameColumn: Math.abs(r('Chowdury').left - r('First Name').left) < 1,
      label: st('First Name'), value: st('Chowdury'),
      labelClass: el['First Name']?.className, valueClass: el['Chowdury']?.className, gridClass: el['First Name']?.parentElement?.parentElement?.className,
    }
  })) })
  await p.close()
}
await b.close(); console.log(JSON.stringify(out, null, 1))
