import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const d = JSON.parse(await readFile(join(__dirname, 'compiled-before-overlay-candidates.json'), 'utf8'));

let report = `Compiled before-side, base ${d.baseRevision}, input ${d.compilerInput}\n\n`;
for (const c of d.candidates) {
  const lines = c.compiled.split('\n');
  const escapedClass = c.class.replace(/[.:/]/g, ch => '\\' + ch);
  const blocks = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('.' + escapedClass + '{') || lines[i].includes('.' + escapedClass + ',') || lines[i].includes('.' + escapedClass + ' {')) {
      let depth = 0;
      let endIdx = i;
      for (let j = i; j < lines.length; j++) {
        depth += (lines[j].match(/{/g) || []).length;
        depth -= (lines[j].match(/}/g) || []).length;
        if (depth <= 0) { endIdx = j; break; }
      }
      let start = i;
      if (i > 0 && (lines[i - 1].trim().startsWith('@supports') || lines[i - 1].trim().startsWith('@media'))) start = i - 1;
      blocks.push(lines.slice(start, endIdx + 1).join('\n'));
    }
  }
  const block = blocks.length ? blocks.join('\n\n') : '(selector not found in compiled output)';
  report += `=== ${c.class}  (${c.site}) ===\n${block}\n\n`;
}
await writeFile(join(__dirname, 'compiled-before-overlay-candidates.txt'), report);
console.log(report);
