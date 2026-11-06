// Task 945: puts one deliberate defect into one module as it loads, so that the defect's text is stored in memory only. It still runs and may write the disk,
// so mutation-check.mjs reads the tree after each run and restores what changed. A process that
// loads the module reports it, because a test run that never loaded the module says nothing about its tests. Vitest loads its modules through
// mutation-vitest.config.mjs; every plain Node process a run starts, a spawned script included, comes through the hook below.
import { appendFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const mutant = process.env.CODE_CHECK_MUTANT ? JSON.parse(process.env.CODE_CHECK_MUTANT) : null;

export const moduleKey = path => {
  const plain = path.replaceAll('\\', '/').split('?')[0];
  return process.platform === 'win32' ? plain.toLowerCase() : plain;
};

export function applyMutant(text, path) {
  if (!mutant || moduleKey(path) !== mutant.key) return text;
  // The text a run loads must be the text the mutant was made from; anything else would test another defect or none.
  if (text.slice(mutant.start, mutant.end) !== mutant.original) {
    appendFileSync(mutant.report, 'mismatch\n');
    return text;
  }
  appendFileSync(mutant.report, 'applied\n');
  return `${text.slice(0, mutant.start)}${mutant.replacement}${text.slice(mutant.end)}`;
}

if (mutant) {
  registerHooks({
    load(url, context, nextLoad) {
      const result = nextLoad(url, context);
      if (!url.startsWith('file:') || result.source === null || result.source === undefined) return result;
      const path = fileURLToPath(url);
      if (moduleKey(path) !== mutant.key) return result;
      return { ...result, source: applyMutant(typeof result.source === 'string' ? result.source : Buffer.from(result.source).toString('utf8'), path) };
    },
  });
}
