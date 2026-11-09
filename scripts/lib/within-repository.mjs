// A path that comes from argv, or from a request URL in a detector's static server, must stay inside its root: the repository, or the directory the server serves.
// (Task 951 AC8, CodeQL js/path-injection.) Both the root and the candidate are resolved to REAL paths, so a "../", an absolute path elsewhere, a drive switch and a
// symlink or junction that leads out of the root are all refused. A candidate that does not exist yet is accepted when its nearest existing ancestor is inside the root.
import { realpathSync } from 'node:fs';
import path from 'node:path';

/** The real path of `target`; for a path that does not exist, the real path of its nearest existing ancestor plus the missing tail. */
function realPathOrNearest(target) {
  let current = path.resolve(target);
  const tail = [];
  for (;;) {
    try {
      return path.join(realpathSync.native(current), ...tail.reverse());
    } catch (error) {
      if (error?.code !== 'ENOENT' && error?.code !== 'ENOTDIR') throw error;
      const parent = path.dirname(current);
      if (parent === current) throw error;
      tail.push(path.basename(current));
      current = parent;
    }
  }
}

/**
 * Resolve `candidate` (relative to `root`, or absolute) and return its real path. Throws when the result is not `root` itself or something inside it.
 * @param {string} root the repository, or the directory a server serves
 * @param {string} candidate a path from argv or from a request
 */
export function withinRoot(root, candidate) {
  const realRoot = realpathSync.native(path.resolve(root));
  const resolved = realPathOrNearest(path.resolve(realRoot, String(candidate)));
  const relative = path.relative(realRoot, resolved);
  const leaves = relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative);
  if (leaves) throw new Error(`path is outside the root: ${JSON.stringify(String(candidate))} is not inside ${realRoot}`);
  return resolved;
}

/**
 * The path part of a request URL (already without the query string), decoded once and then held to `withinRoot`. A percent-encoded "../" is a "../", a malformed
 * escape, a NUL byte and a backslash are refused.
 * @param {string} root the directory the server serves
 * @param {string} requestPath for example "/assets/app.js" or "%2e%2e/x"
 */
export function requestPathWithin(root, requestPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(String(requestPath));
  } catch {
    throw new Error(`path is outside the root: malformed escape in ${JSON.stringify(String(requestPath))}`);
  }
  if (decoded.includes('\0') || decoded.includes('\\')) {
    throw new Error(`path is outside the root: ${JSON.stringify(String(requestPath))} holds a NUL or a backslash`);
  }
  // a leading slash names the root of the served tree, not the root of the disk
  return withinRoot(root, decoded.replace(/^\/+/, ''));
}
