// Is this module the script Node was started with? (Task 963 AC18.)
//
// Node gives `import.meta.url` the symlink-resolved path of the module but keeps `process.argv[1]` as it was typed, so
// comparing the two raw says "no" when a script is started through a symlinked or junctioned directory, and a gate
// that guards its run with that comparison exits 0 having checked nothing (found in the Task 939 review 2). Both sides
// are compared as real paths here; a path that cannot be resolved is not the entry point.
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const real = (p) => {
  try {
    return realpathSync(p);
  } catch {
    return null;
  }
};

/** True when the module at `metaUrl` (pass `import.meta.url`) is the entry point `argv1` names. */
export function isEntryPoint(metaUrl, argv1 = process.argv[1]) {
  if (!argv1) return false;
  const self = real(fileURLToPath(metaUrl));
  return self !== null && real(argv1) === self;
}
