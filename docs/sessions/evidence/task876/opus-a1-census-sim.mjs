import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
const root = process.cwd();
const imp = (p) => import(pathToFileURL(resolve(root, p)).href);
const cc = await imp('scripts/check-surface-census-changed.mjs');
const mp = await imp('scripts/map-changed-surfaces.mjs');
const candidates = [
  'src/components/layout/Header.tsx',
  'src/components/layout/HeaderView.tsx',
  'src/components/layout/UserMenu.tsx',
  'src/modules/auth/context/AuthContext.tsx',
].sort();
const mappingFn = () => {
  const manifestSet = mp.loadManifestSet();
  const { renderedBy } = mp.buildRenderGraph();
  const included = new Set();
  for (const c of candidates) {
    const r = mp.resolveSurfacesFor(c, renderedBy, manifestSet);
    if (r.unresolved) throw new Error('unresolved ' + c);
    r.roots.forEach((x) => included.add(x));
  }
  return { failClosed: false, candidates, included: [...included].sort(), excluded: [] };
};
const res = cc.runPipeline({ base: 'HEAD', maxChangedFiles: 300, maxSurfaces: 60 }, undefined, undefined, mappingFn);
if (res.failClosed) { console.log('FAILCLOSED', JSON.stringify(res, null, 2)); process.exit(2); }
console.log('platform', process.platform, process.version);
console.log('mapped surfaces:', res.mapping.included);
console.log('re-census surfaces:', res.reCensusSurfaces);
const current = cc.dedupeBlocks(res.perSurfaceBlocks);
const censused = new Set([...res.mapping.included, ...res.reCensusSurfaces]);
const cmp = cc.compareToBaseline(current, res.baseline.blocks, censused);
console.log('new blocks:', cmp.newBlocks.length, cmp.newBlocks.map(b=>b.key ?? JSON.stringify(b)));
console.log('stale keys:', cmp.staleKeys.length); cmp.staleKeys.forEach(k=>console.log('  STALE', k));
console.log('baselined:', cmp.baselinedCount);
const upd = cc.computeBaselineUpdate(current, res.baseline.blocks, censused);
const before = Object.keys(res.baseline.blocks), after = Object.keys(upd.blocks);
const removed = before.filter(k=>!(k in upd.blocks)), added = after.filter(k=>!(k in res.baseline.blocks));
console.log('updater would remove', removed.length, 'add', added.length, 'refusedTier2', upd.refusedTier2.length);
removed.forEach(k=>console.log('  -', k)); added.forEach(k=>console.log('  +', k));
