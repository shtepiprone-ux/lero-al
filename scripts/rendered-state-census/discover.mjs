/**
 * discover.mjs — `--discover` of the rendered state census (Task 923, R2, R14).
 *
 * Three lists, all of which must be empty before the registry is complete:
 *   (a) an in-scope Story that shows a visible `[data-portal="true"]` root on mount with no `mount` registry row;
 *   (b) an in-scope Story whose own file imports an overlay component, with no registry row, and one of whose triggers
 *       opens a portal (a file that imports an overlay but renders none of its triggers has nothing to register: it is
 *       printed, with the proof, as the informational "opens nothing" list);
 *   (c) a candidate trigger of ANY in-scope Story - registered or not - that opens a portal and is not the trigger of an
 *       in-range row of that Story at that width.
 * (a) loads every in-scope Story closed at 390 / en. (b) reads the Story file's imports statically. (c) clicks EVERY
 * candidate trigger of EVERY in-scope Story (no cap) at 390, at 1440 and at each `widths` bound of the Story's rows.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { appliesAtWidth, isScopeTitle } from './registry.mjs';
import { CLOSED_LOCALE, CLOSED_WIDTH, loadStory, runClosedJob, runPool, waitStable } from './runner.mjs';

export const MANTINE_CORE_OVERLAYS = ['Modal', 'Drawer', 'Popover', 'Menu', 'Combobox', 'Select', 'Tooltip', 'HoverCard'];
export const EXTRA_OVERLAY_NAMES = ['MantineCombobox', 'MantineSelect', 'RangeDatePicker'];

export function inScopeStories(index) {
  return Object.values(index.entries).filter((e) => e.type === 'story' && isScopeTitle(e.title));
}

/** Names the overlay-and-disclosure family registers (the file base name of each member). */
export function familyOverlayNames(patternRegistry) {
  const family = patternRegistry.componentFamilies.find((f) => f.id === 'overlay-and-disclosure');
  if (!family) throw new Error('scripts/mobile-adaptation-patterns.json has no "overlay-and-disclosure" family');
  return family.members.map((m) => m.split('/').pop().replace(/\.tsx?$/, ''));
}

/** The overlay components a Story file imports (empty when none). Pure given the file text. */
export function overlayImports(source, overlayNames) {
  const hits = new Set();
  for (const m of source.matchAll(/import\s+(?:type\s+)?\{([^}]*)\}\s+from\s+['"]([^'"]+)['"]/gs)) {
    const names = m[1].split(',').map((x) => x.trim().split(/\s+as\s+/)[0]).filter(Boolean);
    for (const name of names) {
      if (m[2] === '@mantine/core' ? MANTINE_CORE_OVERLAYS.includes(name) : overlayNames.includes(name)) hits.add(name);
    }
  }
  for (const m of source.matchAll(/import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g)) {
    if (overlayNames.includes(m[1])) hits.add(m[1]);
  }
  return [...hits];
}

/** The widths a Story is clicked through at: the compact sheet side, the wide side, and every `widths` bound of its rows. */
export function clickWidths(rows) {
  const widths = new Set([390, 1440]);
  for (const r of rows) for (const w of [r.widths?.min, r.widths?.max]) if (w !== undefined) widths.add(w);
  return [...widths].sort((a, b) => a - b);
}

const appRootHtml = () => document.querySelector('#storybook-root')?.innerHTML ?? '';

/**
 * Task 957 Revision 2 (R2-5, Review 2 F9): the candidate triggers that could not be operated and that nothing explains - the Story has no registered `mount` row at that width, so no overlay
 * the Story opens on render covers them. This is the list that fails `--discover`: a trigger the census cannot click is a trigger it cannot prove, and it used to be only informational,
 * so 52 triggers of the listing form timed out under a vendor frame and the run still passed. Triggers behind a registered `mount` overlay (a modal covers the page by design) are explained.
 */
export function unexplainedNotOperable(notOperable) {
  return notOperable.filter((n) => n.noMountRow);
}

/** The key of one element `__census.outsideRoot()` reports. */
const overlayKey = (o) => `${o.tag}|${o.id}|${o.title}`;

/** Clicks the element at a structural path of the app root; `{ ok: false, reason }` (Playwright's) when it cannot be operated. */
async function clickPath(page, path) {
  try {
    await page.locator('#storybook-root').locator(':scope > ' + path).first().click({ timeout: 2500 });
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: String(e.message ?? e).split('\n').find((l) => l.trim()).trim().slice(0, 160) };
  }
}

/** What the overlay of a row's own trigger looks like: the Story is reloaded, the first visible match clicked. */
async function rowTriggerSignature(page, ctx, target, row) {
  const loaded = await loadStory(page, ctx, target);
  if (!loaded.ok) return null;
  try {
    await page.locator('#storybook-root').locator(row.open.selector).filter({ visible: true }).first().click({ timeout: 2500 });
    await waitStable(page, null, 1500);
    return await page.evaluate(() => window.__census.portalSignature());
  } catch {
    return null;
  }
}

/**
 * Clicks every candidate trigger of one Story at every width and returns those that open a portal without being the
 * trigger of an in-range row (R14 list (c)). A candidate INSIDE a row's trigger (a button in a clickable table row)
 * is covered only when it opens the same overlay as the row trigger does; a different overlay is a miss.
 * R17: every candidate is counted - found = clicked + not operable - and each one that cannot be operated is listed with
 * Playwright's reason and whether the Story has a `mount` row at that width (an overlay opened on mount covers the page).
 * Task 957 Revision 2 (R2-5): a click that makes an element outside the app root visible (a vendor widget's frame is a `body` child outside every `[data-portal="true"]` root) is reported in
 * `overlays` with the element, and the Story is reloaded, so the triggers after it are clicked on a page nothing covers; a candidate that cannot be clicked because such an element
 * appeared after the previous click's wait is reported the same way and clicked once more on a reloaded page.
 */
export async function clickThrough(page, ctx, story, rows) {
  const misses = [];
  const notOperable = [];
  const overlays = [];
  let clicks = 0;
  let found = 0;
  for (const width of clickWidths(rows)) {
    const target = { story, state: 'closed', locale: CLOSED_LOCALE, width };
    const loaded = await loadStory(page, ctx, target);
    if (!loaded.ok) return { misses, clicks, found, notOperable, overlays, error: loaded.reason };
    const inRange = rows.filter((r) => appliesAtWidth(r, width) && r.open.kind !== 'mount');
    const noMountRow = !rows.some((r) => r.open.kind === 'mount' && appliesAtWidth(r, width));
    const candidates = await page.evaluate(() => window.__census.candidates());
    let loadedOutside = await page.evaluate(() => window.__census.outsideRoot());
    found += candidates.length;
    const cover = await page.evaluate(
      ([paths, selectors]) => window.__census.coverage(paths, selectors),
      [candidates.map((c) => c.sel), inRange.map((r) => r.open.selector)],
    );
    const rowSignature = new Map();
    let previous = null; // the candidate clicked just before, for an element that appears after its wait
    for (let i = 0; i < candidates.length; i++) {
      const c = candidates[i];
      const baseline = await page.evaluate(appRootHtml);
      const outsideBefore = await page.evaluate(() => window.__census.outsideRoot());
      let clicked = await clickPath(page, c.sel);
      if (!clicked.ok) {
        // an element outside the app root that was not there before the previous click (a frame that arrived after that click's wait) covers the page now: report it,
        // reload, and click this candidate again; an element that was there from the start of the Story is no explanation
        const seenAtStart = loadedOutside;
        const late = outsideBefore.filter((o) => !seenAtStart.some((b) => overlayKey(b) === overlayKey(o)));
        if (late.length === 0) {
          notOperable.push({ story, width, tag: c.tag, label: c.label, sel: c.sel, reason: clicked.reason, noMountRow });
          continue;
        }
        overlays.push({ story, width, tag: previous?.tag ?? c.tag, label: previous?.label ?? c.label, late: true, overlay: late[0] });
        const again = await loadStory(page, ctx, target);
        if (!again.ok) {
          for (const rest of candidates.slice(i)) {
            notOperable.push({ story, width, tag: rest.tag, label: rest.label, sel: rest.sel, reason: `not attempted: the Story could not be reloaded (${again.reason})`, noMountRow });
          }
          break;
        }
        loadedOutside = await page.evaluate(() => window.__census.outsideRoot());
        clicked = await clickPath(page, c.sel);
        if (!clicked.ok) {
          notOperable.push({ story, width, tag: c.tag, label: c.label, sel: c.sel, reason: clicked.reason, noMountRow });
          continue;
        }
      }
      previous = c;
      clicks++;
      const count = await waitStable(page, null, 1500);
      const outsideAfter = await page.evaluate(() => window.__census.outsideRoot());
      const opened = outsideAfter.filter((o) => !outsideBefore.some((b) => overlayKey(b) === overlayKey(o)));
      for (const o of opened) overlays.push({ story, width, tag: c.tag, label: c.label, late: false, overlay: o });
      let reload = true;
      if (count > 0) {
        const relations = cover[i].rows;
        let covered = relations.some((x) => x.relation === 'self');
        if (!covered && relations.length) {
          const signature = await page.evaluate(() => window.__census.portalSignature());
          for (const x of relations) {
            if (!rowSignature.has(x.row)) rowSignature.set(x.row, await rowTriggerSignature(page, ctx, target, inRange[x.row]));
            if (rowSignature.get(x.row) !== null && rowSignature.get(x.row) === signature) covered = true;
          }
        }
        if (!covered) misses.push({ tag: c.tag, label: c.label, sel: c.sel, width, portals: count });
      } else {
        reload = opened.length > 0 || baseline !== (await page.evaluate(appRootHtml)); // a click that changed nothing needs no reload; one that put an element outside the app root does
      }
      if (reload && i < candidates.length - 1) {
        const again = await loadStory(page, ctx, target);
        loadedOutside = again.ok ? await page.evaluate(() => window.__census.outsideRoot()) : loadedOutside;
        if (!again.ok) {
          // the rest of this width's candidates cannot be attempted: they are counted, not silently dropped
          for (const rest of candidates.slice(i + 1)) {
            notOperable.push({ story, width, tag: rest.tag, label: rest.label, sel: rest.sel, reason: `not attempted: the Story could not be reloaded (${again.reason})`, noMountRow });
          }
          break;
        }
      }
    }
  }
  return { misses, clicks, found, notOperable, overlays };
}

export async function discover({ root, index, registry, patternRegistry, ctx, browser, concurrency, log }) {
  const overlayNames = [...new Set([...familyOverlayNames(patternRegistry), ...EXTRA_OVERLAY_NAMES])];
  const stories = inScopeStories(index);
  const rowsByStory = new Map();
  for (const s of registry.states) rowsByStory.set(s.story, [...(rowsByStory.get(s.story) ?? []), s]);

  const fileCache = new Map();
  const importsByStory = new Map();
  for (const story of stories) {
    if (!fileCache.has(story.importPath)) {
      fileCache.set(story.importPath, overlayImports(readFileSync(resolve(root, story.importPath), 'utf8'), overlayNames));
    }
    importsByStory.set(story.id, fileCache.get(story.importPath));
  }

  // (a) every in-scope Story closed at 390 / en
  const unregisteredMount = [];
  const failed = [];
  const closedJobs = stories.map((story) => {
    const hasMountRow = (rowsByStory.get(story.id) ?? []).some((s) => s.open.kind === 'mount');
    return { target: { story: story.id, state: 'closed', locale: CLOSED_LOCALE, width: CLOSED_WIDTH }, run: (page) => runClosedJob(page, ctx, story.id, hasMountRow) };
  });
  await runPool(browser, closedJobs, concurrency, ([row]) => {
    if (row.rules['unregistered-portal'].length) unregisteredMount.push(`${row.story}  (${row.rules['unregistered-portal'][0]})`);
    if (row.rules['error-screen'].length) failed.push(`${row.story}  (${row.rules['error-screen'][0]})`);
  });

  // (c) every candidate trigger of every in-scope Story, then (b) from the same result
  const unregisteredTriggers = [];
  const unregisteredImport = [];
  const importOpensNothing = [];
  const missDetails = [];
  let totalClicks = 0;
  let totalFound = 0;
  const notOperable = [];
  const overlays = [];
  const clickJobs = stories.map((story) => ({
    target: { story: story.id, state: 'closed', locale: CLOSED_LOCALE, width: CLOSED_WIDTH },
    run: async (page) => {
      const rows = rowsByStory.get(story.id) ?? [];
      const r = await clickThrough(page, ctx, story.id, rows);
      totalClicks += r.clicks;
      totalFound += r.found;
      notOperable.push(...r.notOperable);
      overlays.push(...r.overlays);
      if (r.error) failed.push(`${story.id}  (${r.error})`);
      const text = r.misses.map((m) => `${m.tag} "${m.label}" at ${m.width}px`);
      if (r.misses.length) {
        unregisteredTriggers.push(`${story.id}: ${text.join('; ')}`);
        missDetails.push(...r.misses.map((m) => ({ story: story.id, ...m })));
      }
      const imports = importsByStory.get(story.id);
      if (imports.length > 0 && rows.length === 0) {
        const label = `${story.id}  (${story.importPath} imports ${imports.join(', ')})`;
        if (r.misses.length) unregisteredImport.push(`${label} - opens a portal via: ${text.join('; ')}`);
        else importOpensNothing.push(label);
      }
      return [];
    },
  }));
  await runPool(browser, clickJobs, concurrency, () => {});

  const flagged = unregisteredImport.length + importOpensNothing.length;
  log(`discovery: ${stories.length} in-scope Stories closed at ${CLOSED_WIDTH} / ${CLOSED_LOCALE}; ${registry.states.length} registry rows over ${rowsByStory.size} Stories; ${totalClicks} candidate trigger(s) clicked (no cap)`);
  const count = (key) => {
    const c = new Map();
    for (const s of registry.states) c.set(key(s), (c.get(key(s)) ?? 0) + 1);
    return [...c].sort().map(([k, n]) => `${k} ${n}`).join(', ');
  };
  log(`registry rows: ${registry.states.length}; per Story family: ${count((s) => index.entries[s.story].title.split('/').slice(0, 2).join('/'))}`);
  log(`  per open kind: ${count((s) => s.open.kind)}; per focus mode: ${count((s) => s.focus)}; with widths: ${registry.states.filter((s) => s.widths).length} (${count((s) => (s.widths ? JSON.stringify(s.widths) : 'none')).replace(/none \d+, ?/, '')})`);
  log(`(a) in-scope Stories showing a portal on mount with no "mount" row: ${unregisteredMount.length}`);
  for (const l of unregisteredMount.sort()) log(`  - ${l}`);
  log(`(b) in-scope Stories whose file imports an overlay component, with no registry row, one of whose triggers opens a portal: ${unregisteredImport.length}`);
  for (const l of unregisteredImport.sort()) log(`  - ${l}`);
  log(`    (informational, not a violation: ${importOpensNothing.length} of the ${flagged} Stories that import an overlay component and have no row render no trigger that opens a portal - every candidate was clicked)`);
  for (const l of importOpensNothing.sort()) log(`  - ${l}`);
  log(`(c) candidate triggers that open a portal and are not the trigger of an in-range row, at 390 / 1440 / each widths bound: ${unregisteredTriggers.length} Stories`);
  for (const l of unregisteredTriggers.sort()) log(`  - ${l}`);
  log(`Stories that failed to render: ${failed.length}`);
  for (const l of failed.sort()) log(`  - ${l}`);
  // R17: what discovery could not operate. Informational - a candidate under an overlay the Story opens on mount is
  // covered by that overlay; the ones in a Story with no mount row at that width are marked, because nothing explains them.
  notOperable.sort((a, b) => `${a.story}|${String(a.width).padStart(5, '0')}|${a.sel}`.localeCompare(`${b.story}|${String(b.width).padStart(5, '0')}|${b.sel}`));
  const unexplained = unexplainedNotOperable(notOperable);
  log(`(d) candidate triggers per Story x width: found ${totalFound}, clicked ${totalClicks}, not operable ${notOperable.length}; ${notOperable.length - unexplained.length} are behind a registered "mount" overlay (explained) and ${unexplained.length} have nothing to explain them (a Story with no "mount" row at that width) - those fail the run: ${unexplained.length}`);
  for (const n of notOperable) log(`  - ${n.story} @${n.width} ${n.tag} "${n.label}": ${n.reason}${n.noMountRow ? '  [NO MOUNT ROW AT THIS WIDTH - FAILS]' : '  [behind a registered mount overlay]'}`);
  // Task 957 Revision 2 (R2-5): what covered the page from outside the app root and every portal root after a click (informational: the Story was reloaded and the run went on)
  log(`(e, informational) clicks that put an element outside the app root and outside every portal root on the page, the Story reloaded after each: ${overlays.length}`);
  for (const o of overlays) log(`  - ${o.story} @${o.width} ${o.tag} "${o.label}"${o.late ? ' (seen after the next click)' : ''}: <${o.overlay.tag}${o.overlay.id ? ` id="${o.overlay.id}"` : ''}${o.overlay.title ? ` title="${o.overlay.title}"` : ''}> ${o.overlay.box}`);
  return { unregisteredMount, unregisteredImport, unregisteredTriggers, importOpensNothing, failed, missDetails, stories: stories.length, clicks: totalClicks, found: totalFound, notOperable, unexplained, overlays };
}
