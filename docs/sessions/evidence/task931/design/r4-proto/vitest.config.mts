// Task 931 revision 4 prototype. The project config, its include replaced by this folder, plus one in-memory break of a source file named by BREAK_FILE, BREAK_FROM and
// BREAK_TO (the BREAK_NTH occurrence, default 1). Nothing on disk changes. A break that does not apply fails the run, so a survivor is always a real one.
import { defineConfig, mergeConfig } from 'vitest/config';
import base from '../../../../../../vitest.config';

const { BREAK_FILE, BREAK_FROM, BREAK_TO, BREAK_NTH } = process.env;
const merged = mergeConfig(base, defineConfig({
  plugins: [{
    name: 'proto-break',
    enforce: 'pre',
    transform(code: string, id: string) {
      if (!BREAK_FILE || !id.replaceAll('\\', '/').split('?')[0].endsWith(BREAK_FILE)) return null;
      let at = -1;
      for (let i = 0; i < Number(BREAK_NTH ?? 1); i += 1) at = code.indexOf(BREAK_FROM as string, at + 1);
      if (at < 0) throw new Error(`break not applied: ${BREAK_FROM}`);
      return { code: `${code.slice(0, at)}${BREAK_TO}${code.slice(at + (BREAK_FROM as string).length)}`, map: null };
    },
  }],
}));
merged.test.include = ['test-results/task931-r4-proto/*.test.{ts,tsx}'];
merged.test.exclude = ['node_modules/**'];
export default merged;
