// Task 945: the project's own Vitest configuration, with one change: the source of the module under test passes through the mutant first.
// A plugin of order `pre` receives the file's raw text, so the offsets of the mutant hold.
import { mergeConfig } from 'vitest/config';
import base from '../../vitest.config.ts';
import { applyMutant } from './mutation-loader.mjs';

export default mergeConfig(base, {
  plugins: [{
    name: 'code-check-mutant',
    enforce: 'pre',
    transform(code, id) {
      const mutated = applyMutant(code, id);
      return mutated === code ? null : { code: mutated, map: null };
    },
  }],
});
