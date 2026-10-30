// Task 923 Revision 5 - GR-7 live check (moment: execution), run BEFORE the first Revision 5 write.
//   node docs/sessions/evidence/task923/r6-10-gr7-live.mjs > docs/sessions/evidence/task923/r6-10-gr7-live.json
// Subject: (R24) a carousel slide that is clipped away, hidden from assistive technology and out of the tab order is a
// correct hidden control; (R26) the focus after a Tab press inside a modal dialog is judged once it has settled; a
// modal dialog keeps Tab inside. 390x844. TailAdmin only (Lahomes / Kamr / Omah are not relied on for this subject).
// Primary sources: WAI-ARIA APG Carousel pattern, WAI-ARIA APG Dialog (Modal) pattern.
import { chromium } from 'playwright';

const out = [];

async function literal(url, patterns) {
  try {
    const res = await fetch(url);
    const html = await res.text();
    const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    return {
      source: url,
      status: res.status,
      literals: patterns.map((p) => {
        const i = text.search(p);
        return { pattern: String(p), literal: i >= 0 ? text.slice(Math.max(0, i - 100), i + 220) : 'NOT FOUND' };
      }),
    };
  } catch (e) {
    return { source: url, error: String(e.message).split('\n')[0] };
  }
}

out.push(await literal('https://www.w3.org/WAI/ARIA/apg/patterns/carousel/', [/incorrectly hidden/i]));
out.push(await literal('https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/', [/Tab: Moves focus to the next tabbable/i, /Shift \+ Tab/i, /Escape/i]));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

const classify = () => {
  const cs = (e) => getComputedStyle(e);
  const CONTROL = 'button, a[href], input, select, textarea, [role=button], [tabindex]:not([tabindex="-1"])';
  const frames = [...document.querySelectorAll('body *')].filter((e) => cs(e).overflowX !== 'visible' && /swiper|carousel|slick|owl|splide|embla/i.test(String(e.className)));
  const res = [];
  for (const f of frames.slice(0, 4)) {
    const k = f.getBoundingClientRect();
    if (k.width === 0) continue;
    const slides = [...f.querySelectorAll('[class*="slide"]')].filter((s) => s.parentElement && /wrapper|track|list/i.test(String(s.parentElement.className)));
    const rows = slides.slice(0, 12).map((s) => {
      const r = s.getBoundingClientRect();
      const inside = r.left >= k.left - 0.5 && r.right <= k.right + 0.5;
      const wholly = r.right <= k.left + 0.5 || r.left >= k.right - 0.5;
      const ctrls = [...s.querySelectorAll(CONTROL)];
      return {
        box: `${Math.round(r.left)}..${Math.round(r.right)}`,
        place: inside ? 'inside' : wholly ? 'wholly-out' : 'partly',
        text: (s.textContent || '').trim().length > 0,
        controls: ctrls.length,
        ariaHidden: !!s.closest('[aria-hidden="true"]'),
        tabindexNeg: ctrls.every((c) => c.getAttribute('tabindex') === '-1' || c.disabled),
      };
    });
    res.push({ frame: `${f.tagName.toLowerCase()}.${[...f.classList].slice(0, 2).join('.')} ${Math.round(k.left)}..${Math.round(k.right)}`, slides: rows });
  }
  return res;
};

try {
  await page.goto('https://demo.tailadmin.com/carousel', { waitUntil: 'load', timeout: 45000 });
  await page.waitForTimeout(1500);
  out.push({ ref: 'tailadmin-carousel', url: 'https://demo.tailadmin.com/carousel', viewport: '390x844', pageScrollW: await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]), frames: await page.evaluate(classify) });
} catch (e) {
  out.push({ ref: 'tailadmin-carousel', error: String(e.message).split('\n')[0] });
}

await browser.close();
console.log(JSON.stringify(out, null, 1));
