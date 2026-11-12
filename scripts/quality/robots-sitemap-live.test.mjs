// node --test scripts/quality/robots-sitemap-live.test.mjs   with BASE_URL=<a running production server>
// Task 964 AC5: search engines read robots.txt and every sitemap file. Measured 2026-11-07 and again 2026-11-11 on
// production: /robots.txt, /sitemap.xml and /sitemap/0.xml answered 307 to a language prefix, and /sq/robots.txt 404,
// because the proxy matcher routed them through next-intl, and robots.txt named a /sitemap.xml that does not exist.
//
// It needs a running server: the click-shield job of ci.yml runs it after `npm start` with BASE_URL and
// ROBOTS_LIVE_REQUIRED=1, so there it can never skip. Elsewhere (the quality job, a local run) it skips without BASE_URL.
import { test } from 'node:test';
import assert from 'node:assert/strict';

const BASE = process.env.BASE_URL;
// the origin robots.ts and sitemap.ts are built with: the same fallback as src/app/robots.ts
const SITE = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://lero.al').origin;
const required = process.env.ROBOTS_LIVE_REQUIRED === '1';
const live = { skip: BASE || required ? false : 'needs BASE_URL of a running production server (the click-shield job of ci.yml sets it)' };

const get = async (p) => {
  assert.ok(BASE, 'ROBOTS_LIVE_REQUIRED=1 but no BASE_URL: the live check cannot run');
  return fetch(new URL(p, BASE), { redirect: 'manual' });
};

test('robots.txt answers 200 with no redirect and names each sitemap file of the configured origin, never /sitemap.xml', live, async () => {
  const r = await get('/robots.txt');
  assert.equal(r.status, 200, `GET /robots.txt answered ${r.status}${r.headers.get('location') ? ` to ${r.headers.get('location')}` : ''}`);
  const urls = (await r.text()).split(/\r?\n/).filter((l) => /^sitemap:/i.test(l)).map((l) => new URL(l.replace(/^sitemap:\s*/i, '').trim()));
  assert.ok(urls.length > 0, 'robots.txt names no sitemap');
  for (const u of urls) {
    assert.equal(u.origin, SITE, `${u} is not on the configured origin ${SITE}`);
    assert.match(u.pathname, /^\/sitemap\/\d+\.xml$/, `${u} is not a sitemap file /sitemap/<id>.xml`);
  }
  assert.ok(urls.some((u) => u.pathname === '/sitemap/0.xml'), 'the first sitemap file /sitemap/0.xml is not named');
});

test('/sitemap/0.xml answers 200 with no redirect and is a sitemap urlset', live, async () => {
  const r = await get('/sitemap/0.xml');
  assert.equal(r.status, 200, `GET /sitemap/0.xml answered ${r.status}${r.headers.get('location') ? ` to ${r.headers.get('location')}` : ''}`);
  assert.match(await r.text(), /<urlset\b/, 'the answer is not a sitemap');
});

// Review 1 F2: AC3's unit test reads only the route configuration (`dynamicParams = false`); this is the served answer.
// robots.txt names the files 0..n-1 the build served; every one answers 200, and an id the build did not return (n, and
// `01`, which passes the proxy matcher as digits) answers 404 with no redirect.
test('robots.txt names exactly the files 0..n-1, each answers 200, and an id past the last file answers 404', live, async () => {
  const text = await (await get('/robots.txt')).text();
  const ids = text.split(/\r?\n/).filter((l) => /^sitemap:/i.test(l))
    .map((l) => Number(new URL(l.replace(/^sitemap:\s*/i, '').trim()).pathname.match(/^\/sitemap\/(\d+)\.xml$/)?.[1]));
  assert.deepEqual(ids, ids.map((_, i) => i), `robots.txt names the files ${ids.join(', ')}, not 0..${ids.length - 1}`);
  for (const id of ids) {
    const r = await get(`/sitemap/${id}.xml`);
    assert.equal(r.status, 200, `GET /sitemap/${id}.xml, named by robots.txt, answered ${r.status}`);
    await r.body?.cancel();
  }
  for (const p of [`/sitemap/${ids.length}.xml`, '/sitemap/01.xml']) {
    const r = await get(p);
    assert.equal(r.status, 404, `GET ${p} answered ${r.status}${r.headers.get('location') ? ` to ${r.headers.get('location')}` : ''}, not 404`);
    await r.body?.cancel();
  }
});
