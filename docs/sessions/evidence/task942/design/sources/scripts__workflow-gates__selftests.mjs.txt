#!/usr/bin/env node
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { safePath } from './contract.mjs';
const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const files = readdirSync(new URL('.', import.meta.url)).filter(file => /^[a-z0-9_-]+\.selftest\.mjs$/.test(file))
  .sort().map(file => safePath(root, `scripts/workflow-gates/${file}`));
if (!files.length) throw new Error('Workflow gate self-test collection is empty');
const result = spawnSync(process.execPath, ['--test', ...files], { cwd: root, stdio: 'inherit', timeout: 180000 });
process.exitCode = result.status === 0 && !result.error ? 0 : 1;
