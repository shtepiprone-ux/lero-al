import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
const [mode, target, find] = process.argv.slice(2);
const backup = `${target}.task815-orig`;
if (mode === 'apply') {
  const src = readFileSync(target, 'utf8');
  if (src.split(find).length !== 2) { console.error(`MUTATION TARGET NOT UNIQUE/FOUND: ${find}`); process.exit(2); }
  writeFileSync(backup, src);
  writeFileSync(target, src.replace(find, 'false'));
  console.log(`applied: "${find}" -> "false"`);
} else if (mode === 'restore') {
  writeFileSync(target, readFileSync(backup, 'utf8'));
  unlinkSync(backup);
  console.log('restored');
} else { process.exit(2); }
