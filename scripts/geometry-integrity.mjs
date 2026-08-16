/**
 * geometry-integrity.mjs — Element-geometry visual-integrity assertions (Task 467).
 *
 * Runs inside a Playwright page.evaluate() to detect interactive elements that are
 * visually broken: text clipped, off-viewport, overlapping, escaping containers,
 * or unreachable inside bottom-sheets. Each violation is reported with a specific
 * failReason, the selector that identifies the element, and a human-readable label.
 *
 * Three-bucket output (R1):
 *   violations — hard defects (true positives)
 *   ambiguous  — borderline cases needing owner decision (NOT clean PASS, NOT hard FAIL)
 *
 * Tolerance: ~1px for all rect comparisons to avoid anti-aliasing / sub-pixel flakiness.
 */

const TOLERANCE = 1; // px — sub-pixel rounding tolerance

/**
 * @param {import('playwright').Page} page
 * @param {number} viewportWidth
 * @param {Array<{storyId: string, selector?: string, failReason?: string, reason: string}>} allowlist
 *   Entries with a `selector` match that EXACT element (stable data-testid/data-slot/role
 *   selectors only — `selectorFor()` prefers `el.id`, and Mantine's auto-generated
 *   `mantine-XXXXX` IDs are non-deterministic across renders, so an exact-selector entry can
 *   never match a Mantine-ID'd element). Entries with NO `selector` but a `failReason` allow
 *   ALL violations of that failReason for the story (already scoped to one storyId by the
 *   caller) — the only reliable mechanism for Mantine elements (Task 529).
 * @returns {Promise<{pass: boolean, ambiguousOnly: boolean, violations: Array<{failReason: string, selector: string, label: string, details: string}>, ambiguous: Array<{failReason: string, selector: string, label: string, details: string, reason: string}>}>}
 */
export async function checkGeometryIntegrity(page, viewportWidth, allowlist = []) {
  const result = await page.evaluate(({ vw, tol }) => {
    const violations = [];
    const ambiguous = [];

    // ── Element discovery ──────────────────────────────────────────
    const INTERACTIVE_SELECTOR = [
      '#storybook-root button',
      '#storybook-root a[href]',
      '#storybook-root input',
      '#storybook-root select',
      '#storybook-root textarea',
      '#storybook-root [role="button"]',
      '#storybook-root [role="link"]',
      '#storybook-root [role="tab"]',
      '#storybook-root [role="menuitem"]',
      '#storybook-root [role="option"]',
      '#storybook-root [role="switch"]',
      '#storybook-root [role="checkbox"]',
      '#storybook-root [data-slot*="trigger"]',
    ].join(', ');

    const PORTAL_SELECTOR = [
      '[data-slot="dialog-content"] button',
      '[data-slot="dialog-content"] [role="button"]',
      '[data-slot="sheet-content"] button',
      '[data-slot="sheet-content"] [role="button"]',
      '[data-slot="select-content"] [role="option"]',
      '[data-slot="popover-content"] button',
      '[data-slot="popover-content"] [role="button"]',
      '[data-slot="dropdown-menu-content"] [role="menuitem"]',
    ].join(', ');

    // Task 538: Mantine overlay primitives (Select/Combobox/DropdownMenu/NavigationMenu/
    // Popover/Modal/Drawer — every `ResponsiveBottomSheet` consumer) render their opened
    // content via a React portal appended OUTSIDE `#storybook-root`, so neither
    // INTERACTIVE_SELECTOR (root-scoped) nor PORTAL_SELECTOR (legacy shadcn `data-slot`
    // names Mantine never renders) ever discovers it — confirmed empirically:
    // `#storybook-root button` returns 0 matches on an opened Mantine bottom sheet that has
    // 7 real buttons. Deliberately narrow: scoped ONLY to the bottom-sheet body itself
    // (`.mantine-Drawer-body`, the same Task 514 single-source marker used by
    // `hasHorizontalScrollAncestor` below), not a general Mantine-portal sweep — tooltips,
    // desktop dropdowns, and non-sheet overlay chrome are intentionally untouched.
    const BOTTOM_SHEET_BODY_SELECTOR = [
      '.mantine-Drawer-body button',
      '.mantine-Drawer-body [role="button"]',
      '.mantine-Drawer-body [role="option"]',
      '.mantine-Drawer-body [role="menuitem"]',
      '.mantine-Drawer-body a[href]',
      '.mantine-Drawer-body input',
    ].join(', ');

    const allCandidates = [
      ...document.querySelectorAll(INTERACTIVE_SELECTOR),
      ...document.querySelectorAll(PORTAL_SELECTOR),
      ...document.querySelectorAll(BOTTOM_SHEET_BODY_SELECTOR),
    ];

    const seen = new Set();
    const candidates = [];
    for (const el of allCandidates) {
      if (seen.has(el)) continue;
      seen.add(el);
      candidates.push(el);
    }

    // ── Visibility filter ─────────────────────────────────────────
    function isVisible(el) {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return false;
      const cs = window.getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return false;
      if (parseFloat(cs.opacity) === 0) return false;
      if (el.getAttribute('aria-hidden') === 'true') return false;
      let parent = el.parentElement;
      while (parent && parent !== document.body) {
        const ps = window.getComputedStyle(parent);
        if (ps.display === 'none' || ps.visibility === 'hidden') return false;
        parent = parent.parentElement;
      }
      return true;
    }

    function selectorFor(el) {
      if (el.id) return `#${el.id}`;
      const testid = el.getAttribute('data-testid');
      if (testid) return `[data-testid="${testid}"]`;
      const slot = el.getAttribute('data-slot');
      const role = el.getAttribute('role');
      const tag = el.tagName.toLowerCase();
      const text = (el.textContent ?? '').trim().slice(0, 30);
      if (slot) return `[data-slot="${slot}"]${text ? `("${text}")` : ''}`;
      if (role) return `[role="${role}"]${text ? `("${text}")` : ''}`;
      return `${tag}${text ? `("${text}")` : ''}`;
    }

    function labelFor(el) {
      const ariaLabel = el.getAttribute('aria-label');
      if (ariaLabel) return ariaLabel.slice(0, 60);
      return (el.textContent ?? '').trim().slice(0, 60) || '(empty)';
    }

    // ── Clipping ancestor walk ────────────────────────────────────
    // Task 569: shared predicate — an ancestor whose computed overflow can clip a
    // descendant's paint (hidden/clip = hard clip, auto/scroll = clips whatever is
    // scrolled out of the current viewport). Both `findClippingAncestor` (Check 3,
    // nearest ancestor only) and `getVisibleClippedRect` (Check 4, walks the full
    // ancestor chain) share this ONE test — do not duplicate the regex.
    function isClippingAncestor(el) {
      const cs = window.getComputedStyle(el);
      const ov = cs.overflow + ' ' + cs.overflowX + ' ' + cs.overflowY;
      return /hidden|clip|auto|scroll/.test(ov);
    }

    function findClippingAncestor(el) {
      let parent = el.parentElement;
      while (parent && parent !== document.body && parent !== document.documentElement) {
        if (isClippingAncestor(parent)) {
          const prect = parent.getBoundingClientRect();
          if (prect.width > 0 && prect.height > 0) return parent;
        }
        parent = parent.parentElement;
      }
      return null;
    }

    // Task 569 (Check 4 clip-awareness): an element inside an `overflow:auto|scroll`
    // ancestor taller/wider than itself can have scrolled-away content whose raw
    // `getBoundingClientRect()` still geometrically extends past the ancestor's own
    // clipped viewport — those pixels are never painted there. Returns the element's
    // rect intersected against EVERY clipping ancestor in its chain (progressively
    // narrowing it), or `null` if the intersection collapses to nothing (the element
    // is entirely clipped away at the current scroll position — not painted at all,
    // so it cannot visually overlap anything). An element with no clipping ancestor
    // (or one that doesn't clip it at all) gets its full, unmodified rect back —
    // this must never make a genuine, fully-painted overlap disappear.
    function getVisibleClippedRect(el) {
      let rect = el.getBoundingClientRect();
      let parent = el.parentElement;
      while (parent && parent !== document.body && parent !== document.documentElement) {
        if (isClippingAncestor(parent)) {
          const prect = parent.getBoundingClientRect();
          if (prect.width > 0 && prect.height > 0) {
            const left = Math.max(rect.left, prect.left);
            const top = Math.max(rect.top, prect.top);
            const right = Math.min(rect.right, prect.right);
            const bottom = Math.min(rect.bottom, prect.bottom);
            if (right <= left + tol || bottom <= top + tol) return null;
            rect = { left, top, right, bottom };
          }
        }
        parent = parent.parentElement;
      }
      return rect;
    }

    // ── Scrollable ancestor check (R1: for offscreen ambiguous) ──
    // Task 538: a `ResponsiveBottomSheet`/Drawer bottom-sheet body (single-source marker:
    // the static `.mantine-Drawer-body` class — Mantine's default `withStaticClassNames`
    // prefix, confirmed rendered by every Batch C overlay built on the Task 514 foundation)
    // sets ONLY `overflow-y: auto` (`bottomSheetDrawerStyles.body`). Per the CSS Overflow
    // spec's x/y computed-value coupling rule, a browser forces the *other* axis's
    // `visible` to `auto` once one axis is non-visible — so the sheet body's own vertical
    // scroll makes `getComputedStyle(...).overflowX` report `auto` too, even though the
    // sheet must never scroll horizontally. That falsely satisfied the old check below and
    // downgraded a real horizontal clip/offscreen defect inside a bottom sheet to
    // `ambiguous`. Fixed by (1) never granting the downgrade to anything inside a
    // bottom-sheet body, and (2) requiring the overflow-x ancestor to be a genuine
    // Mantine `ScrollArea` horizontal-swipe viewport (`data-scrollbars="x"|"xy"`, the
    // exact attribute `ScrollAreaViewport` renders for `scrollbars="x"` — the
    // SegmentedControl/Tabs swipe pattern), not merely "some ancestor has overflow-x auto".
    // Shared with Check 4's cross-overlay-boundary exemption below (same `.mantine-Drawer-body`
    // single-source marker — one helper, two consumers).
    function isInsideOverlayBody(el) {
      return !!el.closest('.mantine-Drawer-body');
    }

    // Task 663: verified backdrop element for the Check-4 cross-overlay-boundary downgrade
    // below. `.mantine-Overlay-root` is Mantine's default static-class name for the `Overlay`
    // component (`getStaticClassNames` → `${classNamesPrefix}-${componentName}-${selector}` =
    // `mantine-Overlay-root`; confirmed against @mantine/core/esm/components/Overlay/Overlay.mjs
    // useStyles({name:"Overlay"}) call). `DrawerOverlay` renders it via `ModalBaseOverlay` with
    // `fixed: true` and `zIndex: ctx.zIndex` (@mantine/core Drawer.mjs / DrawerOverlay.mjs /
    // ModalBaseOverlay.mjs) — confirmed compiled CSS (`Overlay.module.css`): `position:absolute`
    // by default, `position:fixed` under `[data-fixed]` (always set here), `inset:0` (full
    // viewport), `z-index:var(--overlay-z-index)` resolved from the same `zIndex` prop. The
    // sheet content wrapper shares the identical z-index variable (`ModalBase.css` `.m_60c222c7`
    // `z-index:var(--mb-z-index)`) and is rendered LATER in DOM order than the overlay
    // (`Drawer.mjs`: `DrawerOverlay` before `DrawerContent`), so with equal z-index the sheet
    // content paints above the backdrop — the backdrop sits strictly between the background page
    // and the sheet, exactly as required. A background element is provably unreachable only when
    // a real backdrop of this shape (fixed, visible, z-index at/above the background element's
    // own stacking, rect containing the background element's rect) is present — anything weaker
    // (no backdrop at all, `withOverlay={false}`, or a background element stacked above it) must
    // NOT be treated as covered.
    function isBackgroundCoveredByOverlayBackdrop(bgEl) {
      const bgRect = bgEl.getBoundingClientRect();
      const bgZRaw = parseInt(window.getComputedStyle(bgEl).zIndex, 10);
      const bgZIndex = Number.isNaN(bgZRaw) ? 0 : bgZRaw;
      const backdrops = document.querySelectorAll('.mantine-Overlay-root');
      for (const backdrop of backdrops) {
        const cs = window.getComputedStyle(backdrop);
        if (cs.position !== 'fixed') continue;
        if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) continue;
        const bdZRaw = parseInt(cs.zIndex, 10);
        const bdZIndex = Number.isNaN(bdZRaw) ? 0 : bdZRaw;
        if (bdZIndex < bgZIndex) continue;
        const bRect = backdrop.getBoundingClientRect();
        if (bRect.width === 0 || bRect.height === 0) continue;
        const covers =
          bRect.left <= bgRect.left + tol &&
          bRect.top <= bgRect.top + tol &&
          bRect.right >= bgRect.right - tol &&
          bRect.bottom >= bgRect.bottom - tol;
        if (covers) return true;
      }
      return false;
    }

    // Task 749 revision 2 — the shared per-node test for "is this a deliberate horizontal-scroll
    // container" (overflow-x:auto|scroll + Mantine ScrollArea's own data-scrollbars marker).
    // Extracted so Checks 1, 2, and 3 share one definition and cannot drift.
    function isHorizontalScrollContainer(node) {
      const cs = window.getComputedStyle(node);
      if (!/auto|scroll/.test(cs.overflowX)) return false;
      const scrollbars = node.getAttribute('data-scrollbars');
      return scrollbars === 'x' || scrollbars === 'xy';
    }

    function hasHorizontalScrollAncestor(el) {
      if (isInsideOverlayBody(el)) return false;
      let parent = el.parentElement;
      while (parent && parent !== document.body && parent !== document.documentElement) {
        if (isHorizontalScrollContainer(parent)) return true;
        parent = parent.parentElement;
      }
      return false;
    }

    // ── Library-internal / decorative overlap detection (R1) ──────
    function isLibraryInternal(el) {
      const id = el.id || '';
      if (/^:r|^base-ui|^radix-|^floating-/.test(id)) return true;
      const ds = el.dataset;
      if (ds && (ds.baseUi !== undefined || ds.radixId !== undefined)) return true;
      return false;
    }

    function isAbsoluteOverOwnTrigger(a, b) {
      const aCs = window.getComputedStyle(a);
      const bCs = window.getComputedStyle(b);
      const aPos = aCs.position;
      const bPos = bCs.position;
      const aPositioned = aPos === 'absolute' || aPos === 'fixed';
      const bPositioned = bPos === 'absolute' || bPos === 'fixed';
      // Only ambiguous when ONE is positioned over a NON-positioned sibling (popup-over-trigger)
      // Two positioned siblings are a real collision
      if (aPositioned && !bPositioned && a.parentElement === b.parentElement) return true;
      if (bPositioned && !aPositioned && a.parentElement === b.parentElement) return true;
      return false;
    }

    // ── Visually-hidden / sr-only detection (FP-CLASS A) ────────
    function isVisuallyHidden(el) {
      const cs = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      if (cs.position === 'absolute' && /hidden|clip/.test(cs.overflow) && rect.width <= 1 && rect.height <= 1) return true;
      if (cs.clip === 'rect(0px, 0px, 0px, 0px)') return true;
      if (cs.clipPath === 'inset(50%)') return true;
      return false;
    }

    // ── Text-bearing descendant ───────────────────────────────────
    function findTextBearingDescendant(el) {
      if (el.childNodes.length === 0) return el;
      for (const child of el.children) {
        const cs = window.getComputedStyle(child);
        if (cs.display === 'none' || cs.visibility === 'hidden') continue;
        if (isVisuallyHidden(child)) continue;
        const text = (child.textContent ?? '').trim();
        if (text.length > 0) {
          const deeper = findTextBearingDescendant(child);
          if (deeper) return deeper;
          return child;
        }
      }
      return el;
    }

    function isIconOnly(el) {
      const text = (el.textContent ?? '').trim();
      if (text.length > 0) return false;
      const ariaLabel = el.getAttribute('aria-label');
      return !!ariaLabel;
    }

    function hasOnlyScreenReaderText(el) {
      if (el.children.length === 0) return false;
      for (const child of el.childNodes) {
        if (child.nodeType === 3 && (child.textContent ?? '').trim().length > 0) return false;
        if (child.nodeType === 1) {
          const cs = window.getComputedStyle(child);
          if (cs.display === 'none' || cs.visibility === 'hidden') continue;
          if (isVisuallyHidden(child)) continue;
          if ((child.textContent ?? '').trim().length > 0) return false;
        }
      }
      return (el.textContent ?? '').trim().length > 0;
    }

    const visible = candidates.filter(isVisible)
      .filter(el => !el.closest('.leaflet-container'))
      .slice(0, 200);

    // ── Check 1: text-clipped (R2: ellipsis → ambiguous) ─────────
    for (const el of visible) {
      if (isIconOnly(el)) continue;
      if (hasOnlyScreenReaderText(el)) continue;
      const textEl = findTextBearingDescendant(el);
      if (!textEl) continue;
      const text = (textEl.textContent ?? '').trim();
      if (text.length === 0) continue;

      let found = false;
      let check = textEl;
      while (check && check !== document.body && check.id !== 'storybook-root') {
        const cs = window.getComputedStyle(check);
        const ov = cs.overflow + ' ' + cs.overflowX;
        if (/hidden|clip/.test(ov)) {
          if (check.scrollWidth > check.clientWidth + tol) {
            const hasEllipsis = cs.textOverflow === 'ellipsis';
            const hasAccessibleName = !!(el.getAttribute('aria-label') || el.getAttribute('title'));

            if (hasEllipsis && (hasAccessibleName || el.tagName === 'A')) {
              // R2: intentional ellipsis with accessible name → ambiguous, not hard FAIL
              ambiguous.push({
                failReason: 'text-clipped-ellipsis',
                selector: selectorFor(el),
                label: labelFor(el),
                details: `scrollWidth=${check.scrollWidth}, clientWidth=${check.clientWidth}, text="${text.slice(0, 40)}", textOverflow=ellipsis`,
                reason: 'intentional ellipsis with accessible name or content link',
              });
            } else if (isHorizontalScrollContainer(check) && !isInsideOverlayBody(el)) {
              // Task 749 revision 2 — the clipping ancestor being examined by THIS walk is
              // itself a deliberate horizontal-scroll container (e.g. Mantine ScrollArea): the
              // "clipped" text is reachable by scrolling, same R1 rule Check 2 already applies.
              // Only the examined node is tested, so an element clipped by a plain
              // overflow:hidden box that merely happens to sit inside a scroller further up is
              // NOT excused — the walk stops at the first clipping ancestor, which is the one
              // that actually clips it.
              ambiguous.push({
                failReason: 'ambiguous-text-clipped-scrollable',
                selector: selectorFor(el),
                label: labelFor(el),
                details: `scrollWidth=${check.scrollWidth}, clientWidth=${check.clientWidth}, text="${text.slice(0, 40)}", horizontal scroll container`,
                reason: 'text reachable by horizontal scrolling (carousel/scroll-tabs) — same R1 rule as Check 2',
              });
            } else {
              violations.push({
                failReason: 'text-clipped',
                selector: selectorFor(el),
                label: labelFor(el),
                details: `scrollWidth=${check.scrollWidth}, clientWidth=${check.clientWidth}, text="${text.slice(0, 40)}"`,
              });
            }
            found = true;
            break;
          }
        }
        check = check.parentElement;
      }
      if (found) continue;
    }

    // ── Check 2: offscreen-control (R1: scrollable → ambiguous) ──
    for (const el of visible) {
      const rect = el.getBoundingClientRect();
      if (rect.right > vw + tol) {
        if (hasHorizontalScrollAncestor(el)) {
          // R1: reachable by horizontal scroll → ambiguous
          ambiguous.push({
            failReason: 'ambiguous-offscreen',
            selector: selectorFor(el),
            label: labelFor(el),
            details: `right=${Math.round(rect.right)}, viewportWidth=${vw}, has overflow-x:auto|scroll ancestor`,
            reason: 'element reachable by horizontal scrolling (carousel/scroll-tabs)',
          });
        } else {
          violations.push({
            failReason: 'offscreen-control',
            selector: selectorFor(el),
            label: labelFor(el),
            details: `right=${Math.round(rect.right)}, viewportWidth=${vw}`,
          });
        }
      } else if (rect.left < -tol) {
        if (hasHorizontalScrollAncestor(el)) {
          ambiguous.push({
            failReason: 'ambiguous-offscreen',
            selector: selectorFor(el),
            label: labelFor(el),
            details: `left=${Math.round(rect.left)}, viewportWidth=${vw}, has overflow-x:auto|scroll ancestor`,
            reason: 'element reachable by horizontal scrolling (carousel/scroll-tabs)',
          });
        } else {
          violations.push({
            failReason: 'offscreen-control',
            selector: selectorFor(el),
            label: labelFor(el),
            details: `left=${Math.round(rect.left)}, viewportWidth=${vw}`,
          });
        }
      }
    }

    // ── Check 3: outside-container ────────────────────────────────
    for (const el of visible) {
      const clipParent = findClippingAncestor(el);
      if (!clipParent) continue;
      if (clipParent === document.body || clipParent === document.documentElement) continue;
      const cs = window.getComputedStyle(clipParent);
      const ov = cs.overflow + ' ' + cs.overflowX + ' ' + cs.overflowY;
      if (!/hidden|clip/.test(ov)) continue;

      const elRect = el.getBoundingClientRect();
      const parentRect = clipParent.getBoundingClientRect();

      const escapeRight = elRect.right - parentRect.right;
      const escapeBottom = elRect.bottom - parentRect.bottom;
      const escapeLeft = parentRect.left - elRect.left;
      const escapeTop = parentRect.top - elRect.top;

      // Task 749 revision 2 — a deliberate horizontal-scroll container's own horizontal escape
      // is not a defect (the content is reachable by scrolling); a vertical escape from the SAME
      // container still is, so escapeBottom/escapeTop are never gated here.
      const horizScroller = isHorizontalScrollContainer(clipParent);
      const hardEscapeRight = horizScroller ? 0 : escapeRight;
      const hardEscapeLeft = horizScroller ? 0 : escapeLeft;

      if (hardEscapeRight > tol || escapeBottom > tol || hardEscapeLeft > tol || escapeTop > tol) {
        const alreadyReported = violations.some(
          v => v.selector === selectorFor(el) && v.failReason === 'text-clipped'
        );
        if (!alreadyReported) {
          violations.push({
            failReason: 'outside-container',
            selector: selectorFor(el),
            label: labelFor(el),
            details: `escapes by R=${Math.round(escapeRight)} B=${Math.round(escapeBottom)} L=${Math.round(escapeLeft)} T=${Math.round(escapeTop)}px`,
          });
        }
      } else if (horizScroller && (escapeRight > tol || escapeLeft > tol)) {
        // The only escapes are horizontal, inside a deliberate scroller — visible debt, not a
        // silent pass. Never suppressed for an already-reported text-clipped selector, matching
        // the hard-violation arm's own guard, so a cell doesn't carry both a violation and an
        // ambiguous entry for the identical selector.
        const alreadyReported = violations.some(
          v => v.selector === selectorFor(el) && v.failReason === 'text-clipped'
        );
        if (!alreadyReported) {
          ambiguous.push({
            failReason: 'ambiguous-outside-scrollable',
            selector: selectorFor(el),
            label: labelFor(el),
            details: `escapes by R=${Math.round(escapeRight)} L=${Math.round(escapeLeft)}px, horizontal scroll container`,
            reason: 'element reachable by horizontal scrolling (carousel/scroll-tabs) — same R1 rule as Check 2',
          });
        }
      }
    }

    // ── Check 4: element-overlap (R1: library-internal → ambiguous)
    function rectsOverlap(a, b) {
      const overlapX = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
      const overlapY = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
      return overlapX > tol && overlapY > tol;
    }

    function isAncestorOf(a, b) {
      let p = b.parentElement;
      while (p) { if (p === a) return true; p = p.parentElement; }
      return false;
    }

    // Task 611 — bounding-box containment guard. A control fully nested inside another
    // element's own box (Mantine `rightSection`/`leftSection`/adornment pattern — e.g. an
    // input's rect visually reserves space for its section icon even though the icon is a DOM
    // SIBLING, not a descendant, of the `<input>`) is by-design, not a sibling collision.
    // `isAncestorOf` above only catches real DOM ancestor/descendant pairs; this catches the
    // sibling-but-geometrically-nested case generically (no story-id/selector hardcode) by
    // testing pure bbox containment. Deliberately one-directional-or-other (either fully
    // contains the other) so it never suppresses a REAL collision, where neither box contains
    // the other (partial overlap only).
    function isContained(inner, outer) {
      return inner.left >= outer.left - tol && inner.top >= outer.top - tol &&
        inner.right <= outer.right + tol && inner.bottom <= outer.bottom + tol;
    }

    function isLabelInputPair(a, b) {
      if (a.tagName === 'LABEL' && a.htmlFor && b.id === a.htmlFor) return true;
      if (b.tagName === 'LABEL' && b.htmlFor && a.id === b.htmlFor) return true;
      if (a.tagName === 'LABEL' && a.contains(b)) return true;
      if (b.tagName === 'LABEL' && b.contains(a)) return true;
      return false;
    }

    function hasPointerEventsNone(el) {
      return window.getComputedStyle(el).pointerEvents === 'none';
    }

    for (let i = 0; i < visible.length; i++) {
      for (let j = i + 1; j < visible.length; j++) {
        const a = visible[i];
        const b = visible[j];
        const aRect = a.getBoundingClientRect();
        const bRect = b.getBoundingClientRect();

        if (!rectsOverlap(aRect, bRect)) continue;

        // Task 569: the raw rects above can overlap on paper while one element is
        // actually scrolled out of view inside its own `overflow:auto`/`scroll`
        // ancestor (see `getVisibleClippedRect` above — the SAME false-positive class
        // Check 3/outside-container already exempts for the identical reason). Clip
        // both rects against their own ancestor chain and re-check before treating
        // this as a real (or even ambiguous) collision. An element that is NOT
        // clipped (or whose clip still leaves the overlap intact) is unaffected —
        // this must never suppress a genuine, fully-painted overlap.
        const aVisibleRect = getVisibleClippedRect(a);
        const bVisibleRect = getVisibleClippedRect(b);
        if (!aVisibleRect || !bVisibleRect || !rectsOverlap(aVisibleRect, bVisibleRect)) continue;

        // Algorithmic exclusions
        if (isAncestorOf(a, b) || isAncestorOf(b, a)) continue;
        if (isContained(aVisibleRect, bVisibleRect) || isContained(bVisibleRect, aVisibleRect)) continue;
        if (isLabelInputPair(a, b)) continue;
        if (a.getAttribute('aria-hidden') === 'true' || b.getAttribute('aria-hidden') === 'true') continue;
        if (a.hasAttribute('inert') || b.hasAttribute('inert')) continue;
        if (hasPointerEventsNone(a) || hasPointerEventsNone(b)) continue;

        // R1: library-internal or absolute-over-trigger → ambiguous
        if (isLibraryInternal(a) || isLibraryInternal(b) || isAbsoluteOverOwnTrigger(a, b)) {
          ambiguous.push({
            failReason: 'ambiguous-overlap',
            selector: `${selectorFor(a)} ↔ ${selectorFor(b)}`,
            label: `"${labelFor(a)}" ↔ "${labelFor(b)}"`,
            details: `a=[${Math.round(aRect.left)},${Math.round(aRect.top)},${Math.round(aRect.right)},${Math.round(aRect.bottom)}] b=[${Math.round(bRect.left)},${Math.round(bRect.top)},${Math.round(bRect.right)},${Math.round(bRect.bottom)}]`,
            reason: 'library-internal or position:absolute/fixed over own trigger/anchor',
          });
          continue;
        }

        // Task 538: a pair straddling the opened-overlay boundary — one element inside
        // `.mantine-Drawer-body`, the other not — is background page content sitting behind
        // the overlay's opaque backdrop (e.g. a sibling demo section's own trigger/input, or
        // the story's own trigger button), not a real collision a user could ever perceive.
        // Generalizes the same-parent `isAbsoluteOverOwnTrigger` popup-over-trigger exemption
        // to the portal case now reachable since Check 4 gained overlay-body candidates
        // (BOTTOM_SHEET_BODY_SELECTOR above). A pair fully on ONE side of the boundary (both
        // inside, or both outside) is unaffected — still a hard `element-overlap` violation.
        //
        // Task 663: the ambiguous downgrade above was a false positive whenever a real,
        // verified backdrop actually covers the outside-sheet (background) element — the
        // background control is then provably unreachable/unperceivable, so this is expected
        // modal behavior, not even an ambiguous case. Only downgrade further to a silent PASS
        // (no finding) when `isBackgroundCoveredByOverlayBackdrop` proves that; otherwise keep
        // the pre-existing `ambiguous-overlap` push unchanged (e.g. `withOverlay={false}`, or a
        // background element stacked above the backdrop) so a real bleed-through is never
        // silently hidden.
        if (isInsideOverlayBody(a) !== isInsideOverlayBody(b)) {
          const backgroundEl = isInsideOverlayBody(a) ? b : a;
          if (isBackgroundCoveredByOverlayBackdrop(backgroundEl)) {
            continue; // pass — background provably unreachable behind a real blocking backdrop
          }
          ambiguous.push({
            failReason: 'ambiguous-overlap',
            selector: `${selectorFor(a)} ↔ ${selectorFor(b)}`,
            label: `"${labelFor(a)}" ↔ "${labelFor(b)}"`,
            details: `a=[${Math.round(aRect.left)},${Math.round(aRect.top)},${Math.round(aRect.right)},${Math.round(aRect.bottom)}] b=[${Math.round(bRect.left)},${Math.round(bRect.top)},${Math.round(bRect.right)},${Math.round(bRect.bottom)}]`,
            reason: "background page content behind an opened overlay's backdrop",
          });
          continue;
        }

        violations.push({
          failReason: 'element-overlap',
          selector: `${selectorFor(a)} ↔ ${selectorFor(b)}`,
          label: `"${labelFor(a)}" ↔ "${labelFor(b)}"`,
          details: `a=[${Math.round(aRect.left)},${Math.round(aRect.top)},${Math.round(aRect.right)},${Math.round(aRect.bottom)}] b=[${Math.round(bRect.left)},${Math.round(bRect.top)},${Math.round(bRect.right)},${Math.round(bRect.bottom)}]`,
        });
      }
    }

    // ── Check 5: bottomsheet-overflow (only at <640) ──────────────
    if (vw < 640) {
      const sheetSelectors = [
        '[data-slot="dialog-content"]',
        '[data-slot="sheet-content"]',
      ];
      for (const sel of sheetSelectors) {
        for (const sheet of document.querySelectorAll(sel)) {
          const sheetRect = sheet.getBoundingClientRect();
          if (sheetRect.width === 0 || sheetRect.height === 0) continue;
          const sheetCs = window.getComputedStyle(sheet);
          const sheetScrollable = /auto|scroll/.test(sheetCs.overflow + ' ' + sheetCs.overflowY);

          const controls = sheet.querySelectorAll(
            'button, [role="button"], a[href], input, select, textarea, [data-slot*="trigger"]'
          );
          for (const ctrl of controls) {
            const ctrlRect = ctrl.getBoundingClientRect();
            if (ctrlRect.width === 0 || ctrlRect.height === 0) continue;
            const topPastSheet = ctrlRect.top > sheetRect.bottom + tol;
            const bottomPastSheet = ctrlRect.bottom > sheetRect.bottom + tol;
            if ((topPastSheet || bottomPastSheet) && !sheetScrollable) {
              violations.push({
                failReason: 'bottomsheet-overflow',
                selector: selectorFor(ctrl),
                label: labelFor(ctrl),
                details: `control top=${Math.round(ctrlRect.top)} bottom=${Math.round(ctrlRect.bottom)} vs sheet bottom=${Math.round(sheetRect.bottom)}, sheet not scrollable`,
              });
            }
          }
        }
      }
    }

    return { violations, ambiguous };
  }, { vw: viewportWidth, tol: TOLERANCE });

  // Apply allowlist — remove violations matching an exact selector OR a failReason-only entry
  // (Task 529 — see the failReason-only doc note above).
  const allowedSelectors = new Set(allowlist.map(a => a.selector).filter(Boolean));
  const allowedFailReasons = new Set(allowlist.filter(a => !a.selector && a.failReason).map(a => a.failReason));
  const filteredViolations = result.violations.filter(
    v => !allowedSelectors.has(v.selector) && !allowedFailReasons.has(v.failReason)
  );

  const hasViolations = filteredViolations.length > 0;
  const hasAmbiguous = result.ambiguous.length > 0;

  return {
    pass: !hasViolations && !hasAmbiguous,   // clean PASS only when BOTH are empty
    ambiguousOnly: !hasViolations && hasAmbiguous,  // third state: not green, not hard-FAIL
    violations: filteredViolations,
    ambiguous: result.ambiguous,
  };
}
