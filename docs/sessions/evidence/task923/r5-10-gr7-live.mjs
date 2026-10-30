// Task 923 Revision 4 - GR-7 live check (moment: execution), run BEFORE the first Revision 4 write.
//   node docs/sessions/evidence/task923/r5-10-gr7-live.mjs > docs/sessions/evidence/task923/r5-10-gr7-live.json
// Subject: a transformed carousel track / slide that lies outside its clipping frame (R22): are the off-screen slides
// removed from assistive technology and from the tab sequence, and does a slide inside the frame stay visible content?
// 390x844. TailAdmin and Lahomes only; Kamr and Omah are not relied on. Primary source: WAI-ARIA APG Carousel pattern.
import { chromium } from 'playwright';

const out = [];

// 1. primary source, fetched live this session
try {
  const res = await fetch('https://www.w3.org/WAI/ARIA/apg/patterns/carousel/');
  const html = await res.text();
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const i = text.search(/incorrectly hidden/i);
  out.push({ source: 'https://www.w3.org/WAI/ARIA/apg/patterns/carousel/', status: res.status, literal: i >= 0 ? text.slice(Math.max(0, i - 120), i + 120) : 'NOT FOUND' });
} catch (e) {
  out.push({ source: 'wai-aria-apg-carousel', error: String(e.message).split('\n')[0] });
}

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
        role: s.getAttribute('role'),
        ariaLabel: s.getAttribute('aria-label'),
      };
    });
    res.push({ frame: `${f.tagName.toLowerCase()}.${[...f.classList].slice(0, 2).join('.')} ${Math.round(k.left)}..${Math.round(k.right)}`, slides: rows });
  }
  return res;
};

for (const [name, url] of [
  ['tailadmin-carousel', 'https://demo.tailadmin.com/carousel'],
  ['lahomes-ui-carousel', 'https://techzaa.in/lahomes/admin/ui-carousel.html'],
]) {
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 45000 });
    await page.waitForTimeout(1500);
    out.push({ ref: name, url, viewport: '390x844', pageScrollW: await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]), frames: await page.evaluate(classify) });
  } catch (e) {
    out.push({ ref: name, url, error: String(e.message).split('\n')[0] });
  }
}

await browser.close();
console.log(JSON.stringify(out, null, 1));
