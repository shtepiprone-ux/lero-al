// Task 923 Revision 3 - GR-7 live check (moment: execution), run BEFORE the first Revision 3 write.
//   node docs/sessions/evidence/task923/r4-10-gr7-live.mjs > docs/sessions/evidence/task923/r4-10-gr7-live.json
// Subject: positioned / transformed content inside a clipping frame (R19: a media-only slide translated wholly out of
// its frame, an image scaled past its frame) and, as in Revisions 1-2, the dialog box of a reference modal.
// 390x844. Lahomes and TailAdmin only; Kamr and Omah are not relied on.
import { chromium } from 'playwright';

const out = [];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

const classify = () => {
  const cs = (e) => getComputedStyle(e);
  const clipper = (e) => { for (let q = e.parentElement; q; q = q.parentElement) if (cs(q).overflowX !== 'visible') return q; return null; };
  const CONTROL = 'button, a[href], input, select, textarea, [role=button], [tabindex]:not([tabindex="-1"])';
  const res = { whollyOutMediaOnly: 0, whollyOutWithTextOrControl: 0, mediaCovering: 0, mediaNotCovering: 0, textOrOtherPast: 0, samples: [] };
  for (const e of document.querySelectorAll('body *')) {
    const s = cs(e);
    if (!(s.position === 'absolute' || s.position === 'fixed' || s.transform !== 'none')) continue;
    const c = clipper(e);
    if (!c) continue;
    const r = e.getBoundingClientRect();
    const k = c.getBoundingClientRect();
    if (r.width === 0 || k.width === 0) continue;
    if (!(r.right > k.right + 0.5 || r.left < k.left - 0.5)) continue;
    const wholly = r.right <= k.left + 0.5 || r.left >= k.right - 0.5;
    const hasText = (e.textContent || '').trim().length > 0;
    const hasControl = e.matches(CONTROL) || !!e.querySelector(CONTROL);
    const isMedia = e.matches('img,video,picture,canvas');
    const covers = r.left <= k.left + 0.5 && r.right >= k.right - 0.5 && r.top <= k.top + 0.5 && r.bottom >= k.bottom - 0.5;
    const d = `${e.tagName.toLowerCase()}.${[...e.classList].slice(0, 2).join('.')} x ${Math.round(r.left)}..${Math.round(r.right)} past ${c.tagName.toLowerCase()}.${[...c.classList].slice(0, 2).join('.')} ${Math.round(k.left)}..${Math.round(k.right)}`;
    let kind;
    if (wholly && !hasText && !hasControl) { res.whollyOutMediaOnly++; kind = 'slide-away'; }
    else if (wholly) { res.whollyOutWithTextOrControl++; kind = 'wholly-out-with-text-or-control'; }
    else if (isMedia && !hasText && covers) { res.mediaCovering++; kind = 'media-cover'; }
    else if (isMedia && !hasText) { res.mediaNotCovering++; kind = 'media-not-covering'; }
    else { res.textOrOtherPast++; kind = 'text-or-other'; }
    if (res.samples.length < 6) res.samples.push(`${kind}: ${d}`);
  }
  return res;
};

for (const [name, url, hover] of [
  ['lahomes-ui-carousel', 'https://techzaa.in/lahomes/admin/ui-carousel.html', null],
  ['lahomes-property-grid (hover a card image)', 'https://techzaa.in/lahomes/admin/property-grid.html', 'main img, .card img'],
  ['lahomes-property-details', 'https://techzaa.in/lahomes/admin/property-details.html', null],
  ['tailadmin-carousel', 'https://demo.tailadmin.com/carousel', null],
]) {
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 45000 });
    await page.waitForTimeout(1500);
    if (hover) {
      const img = page.locator(hover).first();
      if (await img.count()) { await img.hover({ timeout: 5000 }).catch(() => {}); await page.waitForTimeout(800); }
    }
    out.push({ ref: name, url, viewport: '390x844', pageScrollW: await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]), ...(await page.evaluate(classify)) });
  } catch (e) {
    out.push({ ref: name, url, error: String(e.message).split('\n')[0] });
  }
}

// the modal subject of Revisions 1-2: does the dialog box hold positioned content past it?
try {
  await page.goto('https://techzaa.in/lahomes/admin/ui-modal.html', { waitUntil: 'load', timeout: 45000 });
  await page.waitForTimeout(1200);
  await page.getByRole('button', { name: /launch demo modal/i }).first().click({ timeout: 8000 });
  await page.waitForTimeout(700);
  out.push({
    ref: 'lahomes-ui-modal', url: 'https://techzaa.in/lahomes/admin/ui-modal.html', viewport: '390x844',
    afterOpen: await page.evaluate(() => {
      const d = document.querySelector('.modal.show .modal-content');
      if (!d) return { dialog: null };
      const b = d.getBoundingClientRect();
      let n = 0; let past = 0;
      for (const e of d.querySelectorAll('*')) {
        const s = getComputedStyle(e);
        if (s.position === 'absolute' || s.position === 'fixed' || s.transform !== 'none') {
          n++;
          const r = e.getBoundingClientRect();
          if (r.right > b.right + 0.5 || r.left < b.left - 0.5) past++;
        }
      }
      return { dialog: 'div.modal-content', box: [Math.round(b.left), Math.round(b.right)], positionedOrTransformed: n, pastBox: past, pageScrollW: [document.documentElement.scrollWidth, document.documentElement.clientWidth] };
    }),
  });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  out[out.length - 1].afterEsc = { dialogsVisible: await page.locator('.modal.show').count() };
} catch (e) {
  out.push({ ref: 'lahomes-ui-modal', error: String(e.message).split('\n')[0] });
}

await browser.close();
console.log(JSON.stringify(out, null, 1));
