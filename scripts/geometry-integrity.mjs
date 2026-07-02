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

    const allCandidates = [
      ...document.querySelectorAll(INTERACTIVE_SELECTOR),
      ...document.querySelectorAll(PORTAL_SELECTOR),
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
    function findClippingAncestor(el) {
      let parent = el.parentElement;
      while (parent && parent !== document.body && parent !== document.documentElement) {
        const cs = window.getComputedStyle(parent);
        const ov = cs.overflow + ' ' + cs.overflowX + ' ' + cs.overflowY;
        if (/hidden|clip|auto|scroll/.test(ov)) {
          const prect = parent.getBoundingClientRect();
          if (prect.width > 0 && prect.height > 0) return parent;
        }
        parent = parent.parentElement;
      }
      return null;
    }

    // ── Scrollable ancestor check (R1: for offscreen ambiguous) ──
    function hasHorizontalScrollAncestor(el) {
      let parent = el.parentElement;
      while (parent && parent !== document.body && parent !== document.documentElement) {
        const cs = window.getComputedStyle(parent);
        if (/auto|scroll/.test(cs.overflowX)) return true;
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

      if (escapeRight > tol || escapeBottom > tol || escapeLeft > tol || escapeTop > tol) {
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

        // Algorithmic exclusions
        if (isAncestorOf(a, b) || isAncestorOf(b, a)) continue;
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
