/**
 * r8-60-story-loop.mjs - the Story loop driver of R33 (Task 923 Revision 7).
 *
 *   node docs/sessions/evidence/task923/r8-60-story-loop.mjs [--from <nnn>] [--to <nnn>] [--only <nnn>] [--skip <nnn,nnn>]
 * Numbers every Story of scripts/rendered-interaction-states.json in sorted id order (001...), and for each runs, one after the other,
 *   node scripts/check-rendered-state-census.mjs --stories <id> --jobs 10 --out docs/sessions/evidence/task923/r8-story/<nnn>-a
 * and the same into <nnn>-b, then compares the pair with r8-61-narrowed-compare.mjs (transcript r8-story/<nnn>-compare.txt).
 * One thing runs at a time. The driver STOPS (exit 2) at the first Story whose pair has a difference that is not allowed, so that the
 * cause is diagnosed (R33) before the loop goes on; it never stops on a census exit code of 1 (product findings are expected).
 * A progress line per Story is appended to r8-story/progress.txt.
 */
import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const REG = JSON.parse(readFileSync('scripts/rendered-interaction-states.json', 'utf8')).states;
const stories = [...new Set(REG.map((s) => s.story))].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
const OUT = 'docs/sessions/evidence/task923/r8-story';
mkdirSync(OUT, { recursive: true });
const arg = (n) => { const i = process.argv.indexOf(n); return i >= 0 ? Number(process.argv[i + 1]) : null; };
const from = arg('--from') ?? 1;
const to = arg('--to') ?? stories.length;
const only = arg('--only');
const skip = new Set((process.argv.includes('--skip') ? process.argv[process.argv.indexOf('--skip') + 1] : '').split(',').filter(Boolean).map(Number)); // Stories whose pair is already final (run after the last fix)
const num = (i) => String(i).padStart(3, '0');
const log = (s) => { console.log(s); appendFileSync(`${OUT}/progress.txt`, `${s}\n`); };

if (!existsSync(`${OUT}/index.txt`) || process.argv.includes('--write-index')) writeFileSync(`${OUT}/index.txt`, stories.map((s, i) => `${num(i + 1)} ${s}`).join('\n') + '\n');
log(`# ${new Date().toISOString()} platform ${process.platform} node ${process.version}; ${stories.length} Stories; from ${only ?? from} to ${only ?? to}`);

function run(id, dir) {
  const cmd = `node scripts/check-rendered-state-census.mjs --stories ${id} --jobs 10 --out ${dir}`;
  const t0 = Date.now();
  const r = spawnSync('node', ['scripts/check-rendered-state-census.mjs', '--stories', id, '--jobs', '10', '--out', dir], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  writeFileSync(`${dir}.txt`, `platform ${process.platform} node ${process.version}\ncmd ${cmd}\nstart ${new Date(t0).toISOString()}\n${r.stdout}${r.stderr}\nend ${new Date().toISOString()}\nEXIT_CODE=${r.status}\n`);
  return { status: r.status, ms: Date.now() - t0, rows: existsSync(`${dir}/rows.jsonl`) };
}

for (let i = only ?? from; i <= (only ?? to); i++) {
  if (skip.has(i)) { log(`${num(i)} ${stories[i - 1]} skipped: its pair was run after the last fix`); continue; }
  const id = stories[i - 1];
  const a = run(id, `${OUT}/${num(i)}-a`);
  const b = run(id, `${OUT}/${num(i)}-b`);
  if (!a.rows || !b.rows || a.status > 1 || b.status > 1) { log(`${num(i)} ${id} CRASH a=${a.status}/${a.rows} b=${b.status}/${b.rows}`); process.exit(3); }
  const c = spawnSync('node', ['docs/sessions/evidence/task923/r8-61-narrowed-compare.mjs', `${OUT}/${num(i)}-a`, `${OUT}/${num(i)}-b`], { encoding: 'utf8' });
  writeFileSync(`${OUT}/${num(i)}-compare.txt`, `${c.stdout}${c.stderr}\nEXIT_CODE=${c.status}\n`);
  const summary = (c.stdout.match(/rows (\d+); rows with a difference (\d+)/) ?? []).slice(1).join(' / ');
  log(`${num(i)} ${id} a ${Math.round(a.ms / 1000)}s b ${Math.round(b.ms / 1000)}s census exit ${a.status}/${b.status}; rows/diff ${summary}; compare exit ${c.status}`);
  if (c.status !== 0) { log(`${num(i)} ${id} STOP: a difference that is not allowed - diagnose it (R33)`); process.exit(2); }
  // owner 2026-10-16 (D8): a Story with a finding is fixed at once, the loop does not go on over it
  if (process.argv.includes('--stop-on-findings') && a.status !== 0) { log(`${num(i)} ${id} STOP-FINDINGS: the Story has violating rows - fix them, rebuild, rerun --only ${i}`); process.exit(4); }
}
log('# loop finished');
