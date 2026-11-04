// Task 937 revision 3 probe: loaded through NODE_OPTIONS only in the probe's second run. It adds the paths of P11_ALLOW to the text
// that check-mojibake.mjs reads from scripts/mojibake-allowlist.json, in the memory of that process. It writes no file.
import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';

const original = fs.readFileSync;
const extra = JSON.parse(process.env.P11_ALLOW || '[]');
fs.readFileSync = function patched(path, ...rest) {
  const text = original.call(this, path, ...rest);
  // The scan of the file as text reads a Buffer; only loadAllowlist asks for utf8.
  if (typeof text !== 'string' || !String(path).replaceAll('\\', '/').endsWith('scripts/mojibake-allowlist.json')) return text;
  return JSON.stringify([...JSON.parse(String(text)), ...extra]);
};
syncBuiltinESMExports();
