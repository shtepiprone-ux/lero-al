/**
 * r12-60-story-pairs.mjs - the eight Story pairs of R55 (Task 923 Revision 12). Pattern of r8-60-story-loop.mjs.
 *
 *   node docs/sessions/evidence/task923/r12-60-story-pairs.mjs [--only <storyId>]
 * For each of the eight Stories (the two `delete-confirm` Stories of AC57 and the six `listingdetailview` Stories without the docs entry), one after the other:
 *   node scripts/check-rendered-state-census.mjs --stories <id> --jobs 10 --out docs/sessions/evidence/task923/r12-story/<id>-a
 * and the same into <id>-b, then compares the pair with r10-61-compare-full.mjs (transcript r12-story/<id>-compare.txt; the pair's -a run is the "new" run, -b the base).
 * One thing runs at a time. A census exit code of 1 is expected (product findings); only a crash (no rows, exit > 1) stops the driver.
 * A progress line per Story is appended to r12-story/progress.txt.
 */
import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';

const STORIES = [
  'patterns-mantine-listingpreviewdialogview--delete-confirm',
  'patterns-mantine-reportdetaildialogview--delete-confirm',
  'patterns-mantine-listingdetailview--public-listing',
  'patterns-mantine-listingdetailview--public-listing-not-reduced',
  'patterns-mantine-listingdetailview--public-listing-converted',
  'patterns-mantine-listingdetailview--staff-preview-unpublished',
  'patterns-mantine-listingdetailview--staff-preview-published',
  'patterns-mantine-listingdetailview--archived-listing',
];
const OUT = 'docs/sessions/evidence/task923/r12-story';
mkdirSync(OUT, { recursive: true });
const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null;
const log = (s) => { console.log(s); appendFileSync(`${OUT}/progress.txt`, `${s}\n`); };
log(`# ${new Date().toISOString()} platform ${process.platform} node ${process.version}; ${only ? `only ${only}` : `${STORIES.length} Stories`}`);

function run(id, dir) {
  const cmd = `node scripts/check-rendered-state-census.mjs --stories ${id} --jobs 10 --out ${dir}`;
  const t0 = Date.now();
  const r = spawnSync('node', ['scripts/check-rendered-state-census.mjs', '--stories', id, '--jobs', '10', '--out', dir], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  writeFileSync(`${dir}.txt`, `platform ${process.platform} node ${process.version}\ncmd ${cmd}\nstart ${new Date(t0).toISOString()}\n${r.stdout}${r.stderr}\nend ${new Date().toISOString()}\nEXIT_CODE=${r.status}\n`);
  return { status: r.status, ms: Date.now() - t0, rows: existsSync(`${dir}/rows.jsonl`) };
}

for (const id of STORIES.filter((s) => !only || s === only)) {
  const a = run(id, `${OUT}/${id}-a`);
  const b = run(id, `${OUT}/${id}-b`);
  if (!a.rows || !b.rows || a.status > 1 || b.status > 1) { log(`${id} CRASH a=${a.status}/${a.rows} b=${b.status}/${b.rows}`); process.exit(3); }
  const c = spawnSync('node', ['docs/sessions/evidence/task923/r10-61-compare-full.mjs', `${OUT}/${id}-a`, `${OUT}/${id}-b`], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  writeFileSync(`${OUT}/${id}-compare.txt`, `platform ${process.platform} node ${process.version}\ncmd node docs/sessions/evidence/task923/r10-61-compare-full.mjs ${OUT}/${id}-a ${OUT}/${id}-b\n${c.stdout}${c.stderr}\nEXIT_CODE=${c.status}\n`);
  const summary = (c.stdout.match(/rows (\d+); rows with a difference (\d+)/) ?? []).slice(1).join(' / ');
  log(`${id} a ${Math.round(a.ms / 1000)}s b ${Math.round(b.ms / 1000)}s census exit ${a.status}/${b.status}; rows/diff ${summary}; compare exit ${c.status}`);
}
log('# pairs finished');
