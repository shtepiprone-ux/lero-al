// Task 941 approver (review 3), read-only: independent AC1 run of the design probe p01-false-positive-probe.mjs with exactly
// the two substitutions AC1 names (Task 940 path tasks/Sprints/ -> tasks/Archive/; the probe's own result-file write
// removed, stdout kept). The edited copy runs from a temporary folder with import.meta.url bound to the probe's own URL,
// so its relative paths resolve as saved. Writes only the temporary copy; prints the probe output.
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const probeUrl = new URL('../design/p01-false-positive-probe.mjs', import.meta.url);
let source = readFileSync(fileURLToPath(probeUrl), 'utf8');
const substitute = (find, replace) => {
  const count = source.split(find).length - 1;
  if (count !== 1) throw new Error(`substitution must occur exactly once, found ${count}: ${find}`);
  source = source.replace(find, replace);
};
substitute("'tasks/Sprints/Sprint_92_kickoff_prompt_Task_940_", "'tasks/Archive/Sprint_92_kickoff_prompt_Task_940_");
substitute("writeFileSync(join(here, 'p01-false-positive-probe.txt'), text);", '');
source = source.replaceAll('import.meta.url', JSON.stringify(probeUrl.href));
const copy = join(mkdtempSync(join(tmpdir(), 'r3-p01-')), 'p01.mjs');
writeFileSync(copy, source);
process.stdout.write(execFileSync(process.execPath, [copy], { encoding: 'utf8' }));
