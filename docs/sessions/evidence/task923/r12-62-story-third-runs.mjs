/**
 * r12-62-story-third-runs.mjs - the third isolated run of the six `listingdetailview` Stories (R55, outcome (iv): "the same verdict in the full run and in three isolated runs").
 * The runs `a` and `b` are the pairs of r12-60-story-pairs.mjs; this makes run `c`:
 *   node scripts/check-rendered-state-census.mjs --stories <id> --jobs 10 --out docs/sessions/evidence/task923/r12-story/<id>-c      (transcript <id>-c.txt)
 * One thing runs at a time. Progress lines are appended to r12-story/progress-c.txt.
 */
import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, writeFileSync } from 'node:fs';

const STORIES = [
  'patterns-mantine-listingdetailview--public-listing',
  'patterns-mantine-listingdetailview--public-listing-not-reduced',
  'patterns-mantine-listingdetailview--public-listing-converted',
  'patterns-mantine-listingdetailview--staff-preview-unpublished',
  'patterns-mantine-listingdetailview--staff-preview-published',
  'patterns-mantine-listingdetailview--archived-listing',
];
const OUT = 'docs/sessions/evidence/task923/r12-story';
const log = (s) => { console.log(s); appendFileSync(`${OUT}/progress-c.txt`, `${s}\n`); };
log(`# ${new Date().toISOString()} platform ${process.platform} node ${process.version}; ${STORIES.length} Stories, run c`);
for (const id of STORIES) {
  const dir = `${OUT}/${id}-c`;
  const cmd = `node scripts/check-rendered-state-census.mjs --stories ${id} --jobs 10 --out ${dir}`;
  const t0 = Date.now();
  const r = spawnSync('node', ['scripts/check-rendered-state-census.mjs', '--stories', id, '--jobs', '10', '--out', dir], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  writeFileSync(`${dir}.txt`, `platform ${process.platform} node ${process.version}\ncmd ${cmd}\nstart ${new Date(t0).toISOString()}\n${r.stdout}${r.stderr}\nend ${new Date().toISOString()}\nEXIT_CODE=${r.status}\n`);
  log(`${id} c ${Math.round((Date.now() - t0) / 1000)}s census exit ${r.status}; rows ${existsSync(`${dir}/rows.jsonl`)}`);
  if (!existsSync(`${dir}/rows.jsonl`) || r.status > 1) { log(`${id} CRASH`); process.exit(3); }
}
log('# third runs finished');
