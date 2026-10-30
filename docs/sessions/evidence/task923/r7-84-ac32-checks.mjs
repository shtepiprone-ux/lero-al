// Task 923 Revision 6, AC32 checks on one full run (a rebuild of the checks printed in r6-84-ac18-checks.txt; the Revision 5 run
// did them by hand, this file is the record). Usage:  node docs/sessions/evidence/task923/r7-84-ac32-checks.mjs <run-dir>
import { readFileSync } from 'node:fs';

const dir = process.argv[2];
const rows = readFileSync(`${dir}/rows.jsonl`, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const RULES = ['text-clamp', 'text-ellipsis', 'text-hidden', 'text-overflow', 'word-split', 'viewport-overflow', 'component-overflow', 'action-hidden', 'action-covered', 'target-small', 'focus-open', 'focus-trap', 'focus-trigger', 'dismiss-escape', 'dismiss-close-control', 'dismiss-outside', 'unregistered-portal', 'portal-count', 'open-failed', 'error-screen', 'widths-mismatch'];
const key = (r) => [r.story, r.state, r.root, r.locale, r.width].join(' | ');
console.log(`platform ${process.platform} node ${process.version}; run ${dir}`);
const keys = new Set(rows.map(key));
const app = rows.filter((r) => r.root === 'app').length;
console.log(`rows ${rows.length}; app ${app}; portal ${rows.length - app}; unique ${keys.size}`);
const ruleKeys = new Set(rows.flatMap((r) => Object.keys(r.rules)));
const unknownKeys = [...ruleKeys].filter((k) => !RULES.includes(k));
console.log(`distinct rule keys across rows ${ruleKeys.size}${unknownKeys.length ? `; not in my list: ${unknownKeys.join(',')}` : ''}`);
const missing = rows.filter((r) => Object.keys(r.rules).length !== 20).length;
console.log(`rows without exactly 20 rule keys ${missing}`);
console.log(`rows without notApplicable ${rows.filter((r) => !r.notApplicable || typeof r.notApplicable !== 'object').length}`);
console.log(`rows without numeric skippedActions ${rows.filter((r) => typeof r.skippedActions !== 'number').length}`);
console.log(`rows without dismissMs object ${rows.filter((r) => !r.dismissMs || typeof r.dismissMs !== 'object').length}`);
console.log(`rows without settle {ms:number, bounded:boolean} ${rows.filter((r) => !r.settle || typeof r.settle.ms !== 'number' || typeof r.settle.bounded !== 'boolean').length}`);
console.log(`rows with a retry key ${rows.filter((r) => r.retry !== undefined).length}; retry not a string ${rows.filter((r) => r.retry !== undefined && typeof r.retry !== 'string').length}`);

const failing = (r) => Object.entries(r.rules).filter(([, v]) => v.length).map(([k]) => k);
const gate = ['open-failed', 'portal-count', 'widths-mismatch', 'error-screen'];
const owner = new Map();
let elsewhere = 0;
let at639 = 0;
const gateCells = new Set();
for (const r of rows) {
  for (const g of gate) {
    if (!r.rules[g]?.length) continue;
    const cell = `${r.story} | ${r.state} | ${r.locale} | ${r.width} | ${g}`;
    if (gateCells.has(cell)) continue;
    gateCells.add(cell);
    const is924 = r.width === 640 && g !== 'error-screen';
    const is925 = g === 'error-screen' && /custom-range-too-long/.test(r.story);
    const label = `${g} @${r.width} -> ${is924 ? '924' : is925 ? '925' : 'NEITHER'}`;
    owner.set(label, (owner.get(label) ?? 0) + 1);
    if (!is924 && !is925) { elsewhere++; if (r.width === 639) at639++; console.log(`  NEITHER: ${cell} :: ${r.rules[g][0].slice(0, 160)}`); }
  }
}
console.log(`gate-level cells by width and owner: ${JSON.stringify(Object.fromEntries(owner))}`);
console.log(`gate-level cells owned by neither 924 nor 925 (must be 0): ${elsewhere}, of which at 639: ${at639}`);

const imageLayer = rows.filter((r) => Object.values(r.rules).some((v) => v.some((d) => /image-layer/.test(d)))).length;
console.log(`rows with an image-layer detail (must be 0): ${imageLayer}`);

const ac4 = [['patterns-mantine-ticketdetaildialogview--support', 320], ['patterns-mantine-ticketdetaildialogview--support', 390], ['patterns-mantine-userpickerfieldview--results', 320], ['patterns-mantine-listingpreviewdialogview--active', 320]];
for (const [story, w] of ac4) {
  const sel = rows.filter((r) => r.story === story && r.width === w);
  const portal = sel.filter((r) => r.root !== 'app');
  const apps = sel.filter((r) => r.root === 'app');
  const set = new Set(portal.flatMap(failing));
  console.log(`AC4 ${story} @${w}: portal rows ${portal.length}, failing ${portal.filter((r) => failing(r).length).length} [${[...set].join(', ')}]; app rows failing ${apps.filter((r) => failing(r).length).length} of ${apps.length}`);
}
const bounded = rows.filter((r) => r.settle?.bounded);
const byState = new Map();
for (const r of bounded) byState.set(r.state, (byState.get(r.state) ?? new Set()).add(`${r.locale} ${r.width}`));
console.log(`settle-bounded rows ${bounded.length}; Story x state: ${[...byState].map(([s, v]) => `${s} (${[...v].join(', ')})`).join('; ') || 'none'}`);
const maxSettle = Math.max(...rows.map((r) => r.settle.ms));
console.log(`largest settle.ms ${maxSettle}; rows with settle.ms > 8000: ${rows.filter((r) => r.settle.ms > 8000).length}`);
const dm = rows.flatMap((r) => Object.values(r.dismissMs)).filter((v) => typeof v === 'number');
console.log(`dismissMs: ${dm.length} numeric, max ${Math.max(...dm)}; never closed (null): ${rows.flatMap((r) => Object.values(r.dismissMs)).filter((v) => v === null).length}`);
