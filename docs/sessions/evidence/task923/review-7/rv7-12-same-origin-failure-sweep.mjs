// Task 923 review 7 (Opus, diagnosis only). Every Story of the registry, loaded once at en 390 exactly as the gate loads it
// (loadStory + waitStable): which same-origin requests fail (`requestfailed`) or answer >= 400, by resource type?
// Answers whether "a same-origin script / stylesheet / document failure is a load failure" can turn a healthy Story red.
//   node docs/sessions/evidence/task923/review-7/rv7-12-same-origin-failure-sweep.mjs
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { startStaticServer, storybookContext, newMeasuringPage, loadStory, waitStable } from '../../../../../scripts/rendered-state-census/runner.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const registry = JSON.parse(readFileSync('scripts/rendered-interaction-states.json', 'utf8')).states;
const stories = [...new Set(registry.map((s) => s.story))].sort();
console.log(`platform ${process.platform} node ${process.version} ${new Date().toISOString()}; stories ${stories.length}`);
const server = await startStaticServer('storybook-static', 6079);
const browser = await chromium.launch();
const base = 'http://127.0.0.1:6079';
const ctx = storybookContext(base);
const byType = {};
const lines = [];
let next = 0;
async function worker() {
  while (next < stories.length) {
    const story = stories[next++];
    const page = await newMeasuringPage(browser);
    const bad = [];
    const sameOrigin = (u) => { try { return new URL(u).origin === base; } catch { return false; } };
    page.on('requestfailed', (r) => { if (sameOrigin(r.url())) bad.push(`${r.resourceType()} ${new URL(r.url()).pathname} failed ${r.failure()?.errorText}`); });
    page.on('response', (r) => { if (sameOrigin(r.url()) && r.status() >= 400) bad.push(`${r.request().resourceType()} ${new URL(r.url()).pathname} status ${r.status()}`); });
    const loaded = await loadStory(page, ctx, { story, state: 'closed', locale: 'en', width: 390 });
    await waitStable(page, null);
    for (const b of bad) { const t = b.split(' ')[0]; byType[t] = (byType[t] ?? 0) + 1; }
    if (bad.length || !loaded.ok) lines.push(`${story}: load ${loaded.ok ? 'ok' : loaded.reason} | ${bad.join(' ; ') || 'no same-origin failure'}`);
    await page.close();
  }
}
await Promise.all(Array.from({ length: 4 }, worker));
for (const l of lines.sort()) console.log(l);
console.log(`stories with a same-origin failure or a failed load: ${lines.length} of ${stories.length}; failures by resource type ${JSON.stringify(byType)}`);
await browser.close();
await new Promise((res) => server.close(res));
