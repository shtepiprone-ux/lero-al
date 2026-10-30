import { startVitest } from 'vitest/node';
import { existsSync } from 'node:fs';
const [outputFile, ...args] = process.argv.slice(2);
const boundary = args.find(arg => arg.startsWith('--boundary='))?.slice('--boundary='.length) || 'unit';
if (!['unit', 'external'].includes(boundary)) throw new Error('Unknown security test boundary');
const files = args.filter(arg => !arg.startsWith('--boundary='));
if (!outputFile || !files.length) throw new Error('Explicit output file and security test paths required');
const config = boundary === 'unit' ? 'vitest.config.ts' : 'vitest.integration.config.ts';
if (!existsSync(config)) throw new Error('Required security test project configuration is missing');
// Use the actual dedicated project; neither project may auto-load .env.local.
const ctx = await startVitest('test', files, { config, run: true, watch: false, allowOnly: false,
  passWithNoTests: false, retry: 0, expect: { requireAssertions: true }, reporters: ['json'], outputFile }, { envDir: false });
if (!ctx) process.exitCode = 1;
else {
  const failed = ctx.state.getFiles().some(file => file.result?.state === 'fail') || ctx.state.getUnhandledErrors().length > 0;
  await ctx.close();
  if (failed) process.exitCode = 1;
}
