import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: process.env.PW_EXE });
const p = await b.newPage();
const out = {};
for (const [k, f] of [['WITH_TAILWIND_@property','probe.html'],['WITHOUT_TAILWIND_@property','probe-notw.html']]) {
  await p.goto('file:///tmp/twproof/' + f);
  out[k] = await p.evaluate(() => {
    const cs = getComputedStyle(document.getElementById('withTw'));
    return { boxShadow: cs.boxShadow, borderTopStyle: cs.borderTopStyle, borderTopWidth: cs.borderTopWidth };
  });
}
console.log(JSON.stringify(out, null, 2));
await b.close();
