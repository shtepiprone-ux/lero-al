/**
 * in-page.mjs — the measuring code of the rendered state census (Task 923, R3/R4).
 *
 * `installCensus` is serialised by Playwright (`page.addInitScript`) and runs inside the page, so it must stay
 * self-contained: no closure over module scope. It defines `window.__census` with
 *   - `portals()`          the visible `[data-portal="true"]` roots (a root with at least one visible descendant),
 *   - `measure(opts)`      one target (the app root or one portal root) -> `{ rules, nodes }`,
 *   - `focusState(sel)`    where the focus is, relative to the portals and to a trigger selector,
 *   - `settleFocus(sel)`   the same, read once the focus has settled (R26),
 *   - `runningAnimations()` the running animations that can end (R26),
 *   - `layoutSignature()`  the boxes of the app root and the portal roots, loaders left out (R31),
 *   - `tabbableCount(i)`   how many tabbable elements portal `i` holds.
 *
 * The app root (`#storybook-root`) and every portal root are measured as SEPARATE targets: one root's verdict
 * never stands in for another's. Each rule name is a key of every evidence row (see RULE_KEYS in runner.mjs).
 */
export function installCensus() {
  if (window.__census) return;

  const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'HEAD', 'META', 'LINK', 'TITLE', 'BR', 'WBR']);
  const ACTION = 'button, input:not([type=hidden]), select, textarea, [role=button], [role=menuitem], a[href]';
  const TABBABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const CAP = 12;

  const csOf = (e) => getComputedStyle(e);
  const inSvg = (e) => e.tagName.toLowerCase() !== 'svg' && !!e.closest('svg');
  const clip = (s, n = 48) => String(s).replace(/\s+/g, ' ').trim().slice(0, n);
  const describe = (e) => {
    const cls = typeof e.className === 'string' && e.className ? '.' + e.className.split(/\s+/)[0] : '';
    return e.tagName.toLowerCase() + cls;
  };
  const px = (n) => Math.round(n * 10) / 10;

  // A box that paints something a person can see (a 1px visually-hidden control does not count).
  function vis(e) {
    if (SKIP.has(e.tagName) || inSvg(e)) return false;
    const cs = csOf(e);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return false;
    const r = e.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return false;
    if (r.width <= 1 && r.height <= 1) return false;
    return true;
  }
  // Text boxes may legitimately be 0px wide when a defect squeezed them: only their height must be > 0.
  function visText(e) {
    if (SKIP.has(e.tagName) || inSvg(e)) return false;
    const cs = csOf(e);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return false;
    return e.getBoundingClientRect().height > 0;
  }

  // A portal root is "open" only when something with content is visible inside it, within the viewport: a bare
  // wrapper (a closed but kept-mounted Drawer root, the empty Notifications root, a backdrop) is not an overlay.
  function hasContent(e) {
    if (!vis(e)) return false;
    const r = e.getBoundingClientRect();
    if (r.right <= 0 || r.bottom <= 0 || r.left >= document.documentElement.clientWidth || r.top >= document.documentElement.clientHeight) return false;
    return /^(IMG|SVG|INPUT|BUTTON|SELECT|TEXTAREA|CANVAS|VIDEO)$/i.test(e.tagName) || [...e.childNodes].some((n) => n.nodeType === 3 && n.nodeValue.trim());
  }

  function portals() {
    const all = [...document.querySelectorAll('[data-portal="true"]')];
    return all.filter((p) => !p.parentElement?.closest('[data-portal="true"]') && [...p.querySelectorAll('*')].some(hasContent));
  }

  const ownText = (e) => [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.nodeValue).join(' ').replace(/\s+/g, ' ').trim();
  const hasText = (e) => (e.textContent || '').trim().length > 0;
  const isFormControl = (e) => /^(INPUT|TEXTAREA|SELECT)$/.test(e.tagName);
  const clipsOverflow = (cs) => /hidden|clip/.test(cs.overflowX + ' ' + cs.overflowY);
  // Content = readable text, a control or media. An empty decorative box (a full-bleed divider, a backdrop) is not
  // content, so it never counts as a component overflow.
  const holdsContent = (e) => hasText(e) || !!e.querySelector('img, svg, input, button, select, textarea, canvas, video') || /^(IMG|SVG|INPUT|BUTTON|SELECT|TEXTAREA|CANVAS|VIDEO)$/i.test(e.tagName);

  let canvas;
  function measureWord(word, cs) {
    canvas = canvas || document.createElement('canvas').getContext('2d');
    canvas.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    try { canvas.letterSpacing = cs.letterSpacing === 'normal' ? '0px' : cs.letterSpacing; } catch { /* older engines */ }
    let w = word;
    if (cs.textTransform === 'uppercase') w = w.toUpperCase();
    else if (cs.textTransform === 'lowercase') w = w.toLowerCase();
    return canvas.measureText(w).width;
  }
  // Break opportunities a browser takes between words: whitespace, after a hyphen or a slash.
  const segments = (text) => text.split(/\s+|(?<=[-‐‑–—/])/).filter(Boolean);

  // Nearest ancestor (inside the target) that scrolls the content it holds, for the vertical or any axis.
  function scrollRegion(e, root) {
    for (let p = e.parentElement; p && p !== document.documentElement; p = p.parentElement) {
      const cs = csOf(p);
      const sy = /auto|scroll/.test(cs.overflowY) && p.scrollHeight > p.clientHeight + 1;
      const sx = /auto|scroll/.test(cs.overflowX) && p.scrollWidth > p.clientWidth + 1;
      if (sy || sx) return p;
      if (p === root) break;
    }
    return null;
  }

  // Is any text of `el` outside `el`'s padding box? (the text is cut off, not merely a box taller than its content)
  // true when `e` or an ancestor up to `top` (both included) is `visibility: hidden` or fully transparent
  function notPainted(e, top) {
    for (let p = e; p; p = p.parentElement) {
      const s = csOf(p);
      if (s.visibility === 'hidden' || parseFloat(s.opacity) === 0) return true;
      if (p === top) break;
    }
    return false;
  }
  function textPastBox(el) {
    const box = el.getBoundingClientRect();
    const left = box.left + el.clientLeft;
    const top = box.top + el.clientTop;
    const right = left + el.clientWidth;
    const bottom = top + el.clientHeight;
    // only an axis the element CLIPS loses text: an `overflow-x: scroll` viewport holds a wide row reachable by scrolling, and only its
    // clipped (hidden) axis counts (Task 923 Revision 7, Story 073)
    const ecs = csOf(el);
    const clipX = /hidden|clip/.test(ecs.overflowX);
    const clipY = /hidden|clip/.test(ecs.overflowY);
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!n.nodeValue.trim()) continue;
      // text that is not painted (opacity 0, visibility hidden: Mantine's loading Button slides its label out under the spinner) is not
      // text a person loses to the clip (Task 923 Revision 7, Story 018)
      if (notPainted(n.parentElement, el)) continue;
      range.selectNodeContents(n);
      for (const r of range.getClientRects()) {
        if (r.width === 0 && r.height === 0) continue;
        if ((clipY && (r.bottom > bottom + 0.5 || r.top < top - 0.5)) || (clipX && (r.right > right + 0.5 || r.left < left - 0.5))) return true;
      }
    }
    return false;
  }
  const nearestClipper = (el, root) => { for (let p = el.parentElement; p; p = p.parentElement) { if (/hidden|clip|auto|scroll/.test(csOf(p).overflowX)) return p; if (p === root) break; } return null; };
  // The nearest `position: fixed` box of an element (itself included), or null: a fixed box never scrolls the page.
  const fixedPanel = (el) => { for (let p = el; p && p !== document.documentElement; p = p.parentElement) if (csOf(p).position === 'fixed') return p; return null; };
  // R11 bound: a slide is "clipped away by design" only inside a scroll region or a transformed track (a carousel).
  const transformedBetween = (el, clipper) => { for (let p = el; p && p !== clipper; p = p.parentElement) if (csOf(p).transform !== 'none') return true; return false; };
  // R19/R22: a control that takes focus or is announced - what a clipped-away slide may hold only when it is out of the
  // tab order and hidden from assistive technology.
  const BOUND_CONTROL = 'button, a[href], input, select, textarea, [role=button], [tabindex]:not([tabindex="-1"])';
  const outOfTabOrder = (c) => c.getAttribute('tabindex') === '-1' || c.matches(':disabled') || !!c.closest('[inert]');
  const hiddenFromAT = (c) => !!c.closest('[aria-hidden="true"], [inert]');
  // R22: the first element (the slide itself included) whose box is not wholly inside the bound's padding box (0.5px;
  // a zero-size box is ignored) that holds a text node of its own, or is a control still in the tab order or exposed to
  // assistive technology. Null when everything outside the bound is media and hidden, untabbable controls.
  function outsideBreak(slide, bl, bt, brt, bb) {
    for (const d of [slide, ...slide.querySelectorAll('*')]) {
      const r = d.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      if (r.left >= bl - 0.5 && r.right <= brt + 0.5 && r.top >= bt - 0.5 && r.bottom <= bb + 0.5) continue;
      const text = ownText(d);
      if (text) return { el: d, label: clip(text, 28) };
      if (d.matches(BOUND_CONTROL) && !(outOfTabOrder(d) && hiddenFromAT(d))) return { el: d, label: clip(d.getAttribute('aria-label') || '', 28) };
    }
    return null;
  }
  // R24: the first ancestor inside the target that clips its overflow (an `overflow` other than `visible` on either axis)
  // and whose padding box lies wholly past the action's box on one axis (0.5px), or null.
  function clippedAwayBy(a, root, r) {
    for (let p = a.parentElement; p; p = p.parentElement) {
      const pcs = csOf(p);
      if (pcs.overflowX !== 'visible' || pcs.overflowY !== 'visible') {
        const pr = p.getBoundingClientRect();
        const pl = pr.left + p.clientLeft;
        const pt = pr.top + p.clientTop;
        const prt = pl + p.clientWidth;
        const pb = pt + p.clientHeight;
        if (r.left >= prt - 0.5 || r.right <= pl + 0.5 || r.top >= pb - 0.5 || r.bottom <= pt + 0.5) return p;
      }
      if (p === root) break;
    }
    return null;
  }
  // R25: the box `r` lies wholly inside the padding box of `clip` (0.5px, both axes).
  function insidePaddingBox(r, clip) {
    const b = clip.getBoundingClientRect();
    const l = b.left + clip.clientLeft;
    const t = b.top + clip.clientTop;
    return r.left >= l - 0.5 && r.right <= l + clip.clientWidth + 0.5 && r.top >= t - 0.5 && r.bottom <= t + clip.clientHeight + 0.5;
  }
  const MEDIA_CONTROL = 'img, svg, input, button, select, textarea, canvas, video';
  const isMediaOrControl = (e) => e.matches(MEDIA_CONTROL) || !!e.querySelector(MEDIA_CONTROL);
  const fixedLayoutTable = (cell) => { for (let p = cell; p && p !== document.body; p = p.parentElement) { const d = csOf(p).display; if (d === 'table' || d === 'inline-table') return csOf(p).tableLayout === 'fixed'; } return false; };
  // R11 bound: a negative margin exempts at most its own size (a full-bleed pull), never a larger overflow.
  const overBeyond = (over, margin) => over > 0.5 && !(margin < 0 && over <= -margin + 0.5);
  // R15: the box an absolutely positioned, fixed or transformed element must stay inside. Its parent says nothing (an
  // offset badge sits past its avatar by design), so the bound is the nearest ancestor inside the target that clips its
  // overflow, or that is an overlay panel. No such ancestor (the panel itself, or the full-viewport wrapper that holds
  // the panel): the element is left to `viewport-overflow`.
  const OVERLAY_PANEL = '[role=dialog], [role=listbox], [role=menu], [role=tooltip], .mantine-Modal-content, .mantine-Drawer-content, .mantine-Popover-dropdown, .mantine-Combobox-dropdown, .mantine-Menu-dropdown, .mantine-Tooltip-tooltip';
  const positionedBound = (el, root) => {
    for (let p = el.parentElement; p; p = p.parentElement) {
      const pcs = csOf(p);
      if (p.matches(OVERLAY_PANEL) || pcs.overflowX !== 'visible' || pcs.overflowY !== 'visible') return p;
      if (p === root) break;
    }
    return null;
  };

  function measure({ kind, index, touch, appInert, exempt, exemptOverflow, exemptText }) {
    const root = kind === 'app' ? document.querySelector('#storybook-root') : portals()[index];
    const rules = {
      'text-clamp': [], 'text-ellipsis': [], 'text-hidden': [], 'word-split': [], 'text-overlap': [], 'svg-text-clipped': [],
      'viewport-overflow': [], 'component-overflow': [],
      'action-hidden': [], 'action-covered': [], 'target-small': [],
    };
    if (!root) return { rules, nodes: 0, missing: true };
    // a box the registry row exempts from component-overflow by a dated owner decision (`exemptOverflow`, an element or what lies inside a match) is counted in the row, not failed (Task 923 R33, D10)
    let exemptedOverflow = 0;
    const addOverflow = (el, message) => { if (exemptOverflow && el.closest(exemptOverflow)) exemptedOverflow++; else add('component-overflow', message); };
    // an ellipsis the registry row exempts from text-ellipsis by a dated owner decision (`exemptText`, an element or what lies inside a match) is counted in the row, not failed;
    // text-clamp and text-hidden still apply inside the match (Task 923 R136, D84)
    let exemptedText = 0;
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    // owner 2026-10-16: the project's mobile switch is BELOW 640px (theme.other.mobileGate = 40em / sm; mobile-adaptation-contract), so
    // the touch size is required below 640, not below 768 (kickoff R4 said 768; Task 923 Revision 7 deviation, recorded in the session log)
    const compact = vw < 640;
    // the project touch token (theme.other.touchTarget = 2.75rem = 44px at the 16px root)
    const touchPx = touch ?? 2.75 * parseFloat(csOf(document.documentElement).fontSize);
    const nodes = [root, ...root.querySelectorAll('*')];
    const visible = nodes.filter(vis);
    const counts = {};
    const add = (rule, detail) => {
      counts[rule] = (counts[rule] || 0) + 1;
      if (rules[rule].length < CAP) rules[rule].push(detail);
    };

    for (const e of visible) {
      if (e === root) continue;
      const cs = csOf(e);

      // ── text rules (an element that holds readable text, any depth) ──
      if (hasText(e) && !isFormControl(e)) {
        const clamp = cs.getPropertyValue('-webkit-line-clamp') || cs.getPropertyValue('line-clamp');
        if (clamp && clamp !== 'none' && clamp !== 'auto') add('text-clamp', `${describe(e)} "${clip(e.textContent)}" clamp ${clamp}`);
        if (cs.textOverflow === 'ellipsis' && /hidden|clip/.test(cs.overflowX) &&
            (/nowrap|pre\b/.test(cs.whiteSpace) || e.scrollWidth > e.clientWidth + 0.5)) {
          if (exemptText && e.closest(exemptText)) exemptedText++;
          else add('text-ellipsis', `${describe(e)} "${clip(e.textContent)}" ellipsis ${e.scrollWidth}>${e.clientWidth}`);
        }
        if (clipsOverflow(cs) && (e.scrollWidth > e.clientWidth + 0.5 || e.scrollHeight > e.clientHeight + 0.5) && textPastBox(e)) {
          add('text-hidden', `${describe(e)} "${clip(e.textContent)}" scroll ${e.scrollWidth}x${e.scrollHeight} > client ${e.clientWidth}x${e.clientHeight}`);
        }
      }

      // ── component overflow: a content element past its parent's padding box ──
      const pos = cs.position;
      const positioned = pos === 'absolute' || pos === 'fixed' || cs.transform !== 'none';
      if (positioned) {
        // R15: positioned / transformed content is measured against its clipping ancestor or overlay panel. An overlay
        // panel itself has no such bound inside the target: its box is `viewport-overflow`'s business.
        if (holdsContent(e) && !e.matches(OVERLAY_PANEL)) {
          const bound = positionedBound(e, root);
          if (bound && bound.clientWidth > 0 && bound.clientHeight > 0) {
            const bcs = csOf(bound);
            const br = bound.getBoundingClientRect();
            const bl = br.left + bound.clientLeft;
            const bt = br.top + bound.clientTop;
            const brt = bl + bound.clientWidth;
            const bb = bt + bound.clientHeight;
            const er = e.getBoundingClientRect();
            const kind = [pos === 'absolute' || pos === 'fixed' ? pos : '', cs.transform !== 'none' ? 'transformed' : ''].filter(Boolean).join('+');
            const scrollsYBound = /auto|scroll/.test(bcs.overflowY);
            const overX = er.right - brt > 0.5 || bl - er.left > 0.5;
            const overY = !overX && !scrollsYBound && (er.bottom - bb > 0.5 || bt - er.top > 0.5);
            if (overX || overY) {
              // R19: two bounded exemptions, nothing else. Both need a bound that clips (an overlay panel that does not
              // clip is never one). (a) a clipped-away slide: wholly outside the bound on the overflowing axis, on a
              // transformed track (the element itself included), holding no text and no control; (b) a media crop: an
              // image / video / picture / canvas with no text whose box covers the bound's padding box on both axes
              // (a hover zoom). A text block, a control, an svg or a shifted image past the bound fails as in R15.
              const bclips = bcs.overflowX !== 'visible' || bcs.overflowY !== 'visible';
              const wholly = overX ? (er.left >= brt - 0.5 || er.right <= bl + 0.5) : (er.top >= bb - 0.5 || er.bottom <= bt + 0.5);
              const covers = er.left <= bl + 0.5 && er.right >= brt - 0.5 && er.top <= bt + 0.5 && er.bottom >= bb - 0.5;
              // R22: the slide test judges only what lies OUTSIDE the bound - the element and every descendant whose box is
              // not wholly inside the bound's padding box. A descendant wholly inside is visible content, measured by its
              // own paths. What lies outside must hold no text and every control in it must be out of the tab order AND
              // hidden from assistive technology (WAI-ARIA APG Carousel: a slide that is only moved off-screen is
              // "incorrectly hidden").
              const slideShape = bclips && wholly && transformedBetween(e, bound);
              const slideBreak = slideShape ? outsideBreak(e, bl, bt, brt, bb) : null;
              const exemptSlide = slideShape && !slideBreak;
              const exemptMedia = bclips && /^(IMG|VIDEO|PICTURE|CANVAS)$/.test(e.tagName) && !hasText(e) && covers;
              if (!exemptSlide && !exemptMedia) {
                const holds = slideBreak ? ` holds ${describe(slideBreak.el)} "${slideBreak.label}"` : '';
                addOverflow(e, overX
                  ? `${describe(e)} "${clip(e.textContent, 28)}" (${kind}) x ${px(er.left)}..${px(er.right)} past ${describe(bound)} ${px(bl)}..${px(brt)}${holds}`
                  : `${describe(e)} "${clip(e.textContent, 28)}" (${kind}) y ${px(er.top)}..${px(er.bottom)} past ${describe(bound)} ${px(bt)}..${px(bb)}${holds}`);
              }
            }
          }
        }
      } else if (e.parentElement && e.parentElement !== document.body && holdsContent(e)) {
        const parent = e.parentElement;
        const pcs = csOf(parent);
        const pr = parent.getBoundingClientRect();
        const er = e.getBoundingClientRect();
        const left = pr.left + parent.clientLeft;
        const top = pr.top + parent.clientTop;
        const right = left + parent.clientWidth;
        const bottom = top + parent.clientHeight;
        const scrollsY = /auto|scroll/.test(pcs.overflowY);
        // a parent that scrolls horizontally holds its wide row by design: what lies past its right edge is reached by scrolling
        // (the left edge is not: nothing scrolls to a negative offset), Task 923 Revision 7, Story 021
        // visible overflow is clipped, or scrolled, by the first ancestor whose overflow is not `visible` (a ScrollArea's content wrapper sits
        // inside its scrolling viewport, Task 923 Revision 7, Story 073)
        let scrollsX = false;
        for (let q = parent; q; q = q.parentElement) {
          const ox = csOf(q).overflowX;
          if (ox !== 'visible') { scrollsX = /auto|scroll/.test(ox); break; }
          if (q === root) break;
        }
        // Every exemption below has a bound and a self-test pair (Task 923 R11, kickoff section 10):
        //  - a margin-pulled element (a full-bleed divider, a grid gutter) is exempt up to the size of its negative margin;
        //  - an element in a table box is exempt unless it is a control / media element in a cell of a fixed-layout table
        //    (auto layout grows the cell to its content; fixed layout does not);
        //  - an element wholly outside a clipping ancestor is clipped away by design only when that ancestor is a scroll
        //    region or the element rides a transformed track (a carousel slide); inside a plain overflow:hidden box it is
        //    content lost to the person.
        const marginL = parseFloat(cs.marginLeft);
        const marginR = parseFloat(cs.marginRight);
        const clipper = nearestClipper(e, root);
        let clippedAway = false;
        if (clipper) {
          const cr = clipper.getBoundingClientRect();
          const wholly = er.left >= cr.right - 0.5 || er.right <= cr.left + 0.5;
          clippedAway = wholly && (/auto|scroll/.test(csOf(clipper).overflowX) || transformedBetween(e, clipper));
        }
        const tableBox = /^table/.test(pcs.display);
        const tableExempt = tableBox && !(pcs.display === 'table-cell' && fixedLayoutTable(parent) && isMediaOrControl(e));
        // R25: a slide of a transformed track is judged against its frame, not against the displaced track box: when the
        // parent is transformed and the element lies wholly inside the padding box of its nearest clipping ancestor, it is
        // visible content in the frame and is not measured against the parent (the track box moves with the transform).
        const trackSlideInFrame = pcs.transform !== 'none' && !!clipper && insidePaddingBox(er, clipper);
        if (pcs.display !== 'contents' && pcs.display !== 'inline' && !tableExempt && parent.clientWidth > 0 && !clippedAway && !trackSlideInFrame) {
          const overR = er.right - right;
          const overL = left - er.left;
          const overB = er.bottom - bottom;
          const overT = top - er.top;
          if ((!scrollsX && overBeyond(overR, marginR)) || overBeyond(overL, marginL)) {
            addOverflow(e, `${describe(e)} "${clip(e.textContent, 28)}" x ${px(er.left)}..${px(er.right)} past ${describe(parent)} ${px(left)}..${px(right)}`);
          } else if (!scrollsY && parent.clientHeight > 0 && (overBeyond(overB, parseFloat(cs.marginBottom)) || overBeyond(overT, parseFloat(cs.marginTop)))) {
            addOverflow(e, `${describe(e)} "${clip(e.textContent, 28)}" y ${px(er.top)}..${px(er.bottom)} past ${describe(parent)} ${px(top)}..${px(bottom)}`);
          }
        }
      }
    }

    // ── word split: a text box narrower than its longest word ──
    const seenBox = new Set();
    for (const e of nodes) {
      if (e === root || !visText(e) || isFormControl(e)) continue;
      const text = ownText(e);
      if (!text) continue;
      const cs = csOf(e);
      if (/nowrap|pre\b/.test(cs.whiteSpace) || parseFloat(cs.fontSize) === 0) continue;
      let box = e;
      while (box.parentElement && /^(inline|contents)$/.test(csOf(box).display)) box = box.parentElement;
      const bcs = csOf(box);
      const br = box.getBoundingClientRect();
      const inner = br.width - parseFloat(bcs.paddingLeft) - parseFloat(bcs.paddingRight) - parseFloat(bcs.borderLeftWidth) - parseFloat(bcs.borderRightWidth);
      const content = Math.max(0, inner);
      let worst = null;
      for (const seg of segments(text)) {
        // an e-mail address or a URL is the documented exception: GR-3i "a long unbroken token breaks inside the word rather than
        // overflowing" and Task 859 R85 (D6) set that treatment for them; it is not a name cut by a squeezed box (Task 923 R33, Story 075)
        if (/@|:\/\/|^www\./.test(seg)) continue;
        const w = measureWord(seg, cs);
        if (w > content + 0.5 && (!worst || w > worst.w)) worst = { seg, w };
      }
      if (worst) {
        const key = describe(box) + worst.seg;
        if (seenBox.has(key)) continue;
        seenBox.add(key);
        add('word-split', `${describe(box)} "${clip(worst.seg, 24)}" needs ${px(worst.w)}px, box ${px(content)}px`);
      }
    }

    // ── text overlap and svg text (Task 923 Revision 7, owner 2026-10-17) ──
    // Everything inside an svg was skipped by every rule above (`inSvg`), so a chart whose axis labels were rotated and printed over one
    // another passed. Two rules read the text a person reads, in the page and in an svg:
    //  - `text-overlap`: two text runs of different elements whose boxes cross. HTML text is measured per line box (a Range over each text
    //    node); svg text per <text> as its own box turned by the element's real transform (separating-axis test, so a rotated label is not
    //    judged by its axis-aligned box), with 15% of its height off each side (a glyph box is taller than the glyphs);
    //  - `svg-text-clipped`: an svg <text> whose box leaves the svg's viewport while the svg hides its overflow (the default of an inline svg),
    //    or leaves the padding box of the nearest ancestor that hides its overflow: the label is cut.
    // Text that is not painted (display none, visibility hidden, opacity 0, fill none) is not text a person reads.
    const svgPainted = (t) => {
      for (let p = t; p && p !== root.parentElement; p = p.parentElement) {
        const s = csOf(p);
        if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) === 0) return false;
        if (p === t && (s.fill === 'none' || /^rgba\(\s*\d+,\s*\d+,\s*\d+,\s*0\s*\)$/.test(s.fill))) return false;
      }
      return !t.closest('defs, clipPath, mask, pattern, symbol');
    };
    const svgPoly = (t) => {
      let bb;
      try { bb = t.getBBox(); } catch { return null; }
      const m = t.getScreenCTM();
      if (!m || (bb.width === 0 && bb.height === 0)) return null;
      const inset = bb.height * 0.15;
      const corners = [[bb.x, bb.y + inset], [bb.x + bb.width, bb.y + inset], [bb.x + bb.width, bb.y + bb.height - inset], [bb.x, bb.y + bb.height - inset]];
      return corners.map(([x, y]) => ({ x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f }));
    };
    const aabb = (poly) => ({ l: Math.min(...poly.map((p) => p.x)), r: Math.max(...poly.map((p) => p.x)), t: Math.min(...poly.map((p) => p.y)), b: Math.max(...poly.map((p) => p.y)) });
    // the least overlap of two convex polygons along their edge normals; <= 0 when they do not cross
    const penetration = (a, b) => {
      let least = Infinity;
      for (const poly of [a, b]) {
        for (let i = 0; i < poly.length; i++) {
          const p = poly[i];
          const q = poly[(i + 1) % poly.length];
          const nx = q.y - p.y;
          const ny = p.x - q.x;
          const len = Math.hypot(nx, ny);
          if (len === 0) continue;
          const proj = (pg) => pg.map((v) => (v.x * nx + v.y * ny) / len);
          const pa = proj(a);
          const pb = proj(b);
          const o = Math.min(Math.max(...pa), Math.max(...pb)) - Math.max(Math.min(...pa), Math.min(...pb));
          if (o <= 0) return 0;
          least = Math.min(least, o);
        }
      }
      return least;
    };
    // the part of box `r` of `el` that no clipping ancestor cuts away, or null
    const visibleRect = (el, r) => {
      let l = r.left, t = r.top, rt = r.right, b = r.bottom;
      for (let p = el.parentElement; p && p !== document.documentElement; p = p.parentElement) {
        const ps = csOf(p);
        const cx = ps.overflowX !== 'visible';
        const cy = ps.overflowY !== 'visible';
        if (!cx && !cy) continue;
        const pr = p.getBoundingClientRect();
        if (cx) { l = Math.max(l, pr.left + p.clientLeft); rt = Math.min(rt, pr.left + p.clientLeft + p.clientWidth); }
        if (cy) { t = Math.max(t, pr.top + p.clientTop); b = Math.min(b, pr.top + p.clientTop + p.clientHeight); }
        if (rt - l <= 0 || b - t <= 0) return null;
      }
      return { left: l, top: t, right: rt, bottom: b, width: rt - l, height: b - t };
    };
    // is `el` hidden at (x, y) by an opaque box that lies above it and is PINNED or FLOATING over it (a sticky header over text that scrolled beneath it, a dialog or a menu over the page)?
    // The check exists for that and for nothing else: text under an opaque box of its OWN layer (a map control over a popup's title) is text a person can neither read nor scroll out from
    // under, so the pair stays reported (Task 923 R54, review 12 finding 2).
    // Task 923 R52 / R33 (i), two gate defects found by the final full run, and R53 / R54, the review of those fixes:
    //  - below the fold (R52): `elementsFromPoint` only answers for a point inside the viewport, so a text pair below the fold was never "covered" and its verdict depended on the
    //    viewport height. The point is brought into the viewport by scrolling the page, asked, and the scroll put back;
    //  - an inert layer (R52, R53): the text of an `inert` layer under a modal is not hit-testable, so it is missing from the stack. For the one query the `inert` attribute of the
    //    layer is taken off and put back in a `finally` of the same synchronous block (no await in between); the ordinary check then applies, so only the boxes painted ABOVE the text
    //    count (an opaque card of the page under the dialog is below it and decides nothing);
    //  - the cover (R54): see `isCover`.
    const COVER_OVERLAY = '[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"], [role="tooltip"], [data-portal]';
    const nearestCommonAncestor = (a, b) => { for (let p = a; p; p = p.parentElement) if (p.contains(b)) return p; return null; };
    // R54: the box `s` (or an ancestor of it below the nearest common ancestor of `s` and the text) is pinned (`fixed` / `sticky`) or an overlay (dialog, menu, listbox, tooltip, portal root)
    const isCover = (s, el) => {
      const common = nearestCommonAncestor(s, el);
      for (let p = s; p && p !== common; p = p.parentElement) {
        if (csOf(p).position === 'fixed' || csOf(p).position === 'sticky') return true; // R54 (a): pinned
        if (p.matches(COVER_OVERLAY)) return true; // R54 (b): floating
      }
      return false;
    };
    const coveredAt = (x, y, el) => {
      const sx = window.scrollX;
      const sy = window.scrollY;
      const outside = x < 0 || y < 0 || x >= vw || y >= vh;
      const unlocked = [];
      if (outside) { // R33 (i) R52 below-the-fold cover: bring the point into the viewport
        window.scrollTo({ left: sx + (x < 0 || x >= vw ? x - vw / 2 : 0), top: sy + (y < 0 || y >= vh ? y - vh / 2 : 0), behavior: 'instant' });
        x -= window.scrollX - sx;
        y -= window.scrollY - sy;
      }
      try {
        if (x < 0 || y < 0 || x >= vw || y >= vh) return false;
        let stack = document.elementsFromPoint(x, y);
        if (!stack.some((s) => s === el || el.contains(s))) {
          for (let p = el.parentElement; p; p = p.parentElement) { // R53 inert unlock: an inert layer is absent from the hit-test stack
            if (p.hasAttribute('inert')) { unlocked.push([p, p.getAttribute('inert')]); p.removeAttribute('inert'); }
          }
          if (unlocked.length) stack = document.elementsFromPoint(x, y);
        }
        const i = stack.findIndex((s) => s === el || el.contains(s));
        if (i < 0) return false;
        const upto = i; // R53: only what is painted above the text
        const covers = (s) => isCover(s, el); // R54: only a pinned or floating box
        for (let k = 0; k < upto; k++) {
          const s = stack[k];
          if (s.contains(el)) continue;
          const bg = csOf(s).backgroundColor;
          const m = /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/.exec(bg);
          if (m && (m[4] === undefined || parseFloat(m[4]) >= 0.95) && covers(s)) return true;
        }
        return false;
      } finally {
        for (const [p, v] of unlocked) p.setAttribute('inert', v);
        if (outside) window.scrollTo({ left: sx, top: sy, behavior: 'instant' });
      }
    };
    const runs = [];
    for (const t of root.querySelectorAll('svg text')) {
      const label = clip(t.textContent, 24);
      if (!label || !svgPainted(t)) continue;
      const poly = svgPoly(t);
      if (poly) runs.push({ el: t, svg: true, poly, label });
    }
    for (const e of visible) {
      if (isFormControl(e) || e === root) continue;
      const own = ownText(e);
      if (!own || notPainted(e, root)) continue;
      const range = document.createRange();
      for (const n of e.childNodes) {
        if (n.nodeType !== 3 || !n.nodeValue.trim()) continue;
        range.selectNodeContents(n);
        for (const r of range.getClientRects()) {
          if (r.width < 1 || r.height < 1) continue;
          // only the part of the line a person can see: cut by every ancestor that clips or scrolls (a nav list under its pinned footer, a carousel slide)
          const seen = visibleRect(e, r);
          if (!seen || seen.width < 1 || seen.height < 1) continue;
          runs.push({ el: e, svg: false, rect: seen, full: r, label: clip(own, 24) });
        }
      }
    }
    for (let i = 0; i < runs.length; i++) {
      for (let j = i + 1; j < runs.length; j++) {
        const a = runs[i];
        const b = runs[j];
        if (a.svg !== b.svg || a.el === b.el) continue;
        if (a.svg) {
          const d = penetration(a.poly, b.poly);
          if (d > 1.5) add('text-overlap', `svg text "${a.label}" overlaps "${b.label}" by ${px(d)}px`);
        } else {
          const w = Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left);
          const h = Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top);
          if (w > 2 && h > 0.35 * Math.min(a.rect.height, b.rect.height)) {
            const cx = (Math.max(a.rect.left, b.rect.left) + Math.min(a.rect.right, b.rect.right)) / 2;
            const cy = (Math.max(a.rect.top, b.rect.top) + Math.min(a.rect.bottom, b.rect.bottom)) / 2;
            if (coveredAt(cx, cy, a.el) || coveredAt(cx, cy, b.el)) continue;
          }
          if (w > 2 && h > 0.35 * Math.min(a.rect.height, b.rect.height)) add('text-overlap', `${describe(a.el)} "${a.label}" overlaps ${describe(b.el)} "${b.label}" by ${px(w)}x${px(h)}px`);
        }
      }
    }
    for (const run of runs) {
      if (!run.svg) continue;
      let outer = run.el.closest('svg');
      while (outer.parentElement && outer.parentElement.closest('svg')) outer = outer.parentElement.closest('svg');
      const box = aabb(run.poly);
      const sr = outer.getBoundingClientRect();
      const so = csOf(outer);
      const svgClips = /hidden|clip/.test(so.overflowX + ' ' + so.overflowY);
      if (svgClips && (box.l < sr.left - 1 || box.r > sr.right + 1 || box.t < sr.top - 1 || box.b > sr.bottom + 1)) {
        add('svg-text-clipped', `svg text "${run.label}" x ${px(box.l)}..${px(box.r)} y ${px(box.t)}..${px(box.b)} outside its svg ${px(sr.left)}..${px(sr.right)} x ${px(sr.top)}..${px(sr.bottom)}`);
        continue;
      }
      for (let p = outer.parentElement; p && p !== document.documentElement; p = p.parentElement) {
        const ps = csOf(p);
        if (/hidden|clip/.test(ps.overflowX + ' ' + ps.overflowY)) {
          const pr = p.getBoundingClientRect();
          const l = pr.left + p.clientLeft;
          const t = pr.top + p.clientTop;
          if (box.l < l - 1 || box.r > l + p.clientWidth + 1 || box.t < t - 1 || box.b > t + p.clientHeight + 1) {
            add('svg-text-clipped', `svg text "${run.label}" x ${px(box.l)}..${px(box.r)} y ${px(box.t)}..${px(box.b)} outside ${describe(p)} ${px(l)}..${px(l + p.clientWidth)} x ${px(t)}..${px(t + p.clientHeight)}`);
          }
          break;
        }
        if (p === root) break;
      }
    }

    // ── viewport overflow (R10): the deepest elements whose box leaves the viewport horizontally, the target root's
    // own box included, and - on the app row - the page's own horizontal scroll ──
    // Exemptions: (1) a CLOSED off-canvas panel - a `position: fixed` box wholly outside the viewport (an AppShell
    // navbar translated out of view); an in-flow transformed element past the edge scrolls the page and fails;
    // (2) an ancestor that hides its overflow while its own box sits inside the viewport (text-hidden owns the text).
    const offCanvas = (e, r) => {
      if (!(r.right <= 0.5 || r.left >= vw - 0.5)) return false;
      const panel = fixedPanel(e);
      if (!panel) return false;
      const pr = panel.getBoundingClientRect();
      return pr.right <= 0.5 || pr.left >= vw - 0.5;
    };
    const hiddenAwayFrom = (e, stopAt) => {
      for (let p = e.parentElement; p && p !== document.documentElement; p = p.parentElement) {
        // an ancestor that scrolls (`auto` / `scroll`: a carousel rail) holds its overflow as well as one that hides it (Task 923 Revision 7, Story 176)
        if (/hidden|clip|auto|scroll/.test(csOf(p).overflowX)) {
          const pr = p.getBoundingClientRect();
          if (pr.right <= vw + 0.5 && pr.left >= -0.5) return true;
        }
        if (p === stopAt) break;
      }
      return false;
    };
    const deepest = (list) => list.filter((o) => !list.some((x) => x.e !== o.e && o.e.contains(x.e)));
    const offenders = [];
    for (const e of visible) {
      const r = e.getBoundingClientRect();
      if (!(r.right > vw + 0.5 || r.left < -0.5)) continue;
      if (offCanvas(e, r) || hiddenAwayFrom(e, root)) continue;
      offenders.push({ e, r });
    }
    for (const { e, r } of deepest(offenders)) {
      add('viewport-overflow', `${describe(e)} "${clip(e.textContent, 28)}" x ${px(r.left)}..${px(r.right)} outside 0..${vw}`);
    }
    if (kind === 'app') {
      const de = document.documentElement;
      if (de.scrollWidth > de.clientWidth + 0.5) {
        // the document itself scrolls sideways: name the deepest in-flow element whose box reaches past the viewport
        const causes = [];
        for (const e of document.body.querySelectorAll('*')) {
          if (!vis(e) || fixedPanel(e)) continue;
          const r = e.getBoundingClientRect();
          if (r.right > vw + 0.5 && !hiddenAwayFrom(e, document.body)) causes.push({ e, r });
        }
        const names = deepest(causes).slice(0, 3).map(({ e, r }) => `${describe(e)} "${clip(e.textContent, 28)}" right edge ${px(r.right)}`);
        add('viewport-overflow', `the page scrolls sideways: scrollWidth ${de.scrollWidth} > clientWidth ${de.clientWidth}${names.length ? '; deepest cause: ' + names.join('; ') : '; no single element reaches past the viewport'}`);
      }
    }

    // ── actions ──
    // While a modal dialog or sheet is open the app root is inert (its focus is trapped, its scroll locked): its
    // actions are neither reachable nor meant to be, so they are not measured. A non-modal overlay leaves them live.
    const measureActions = !(kind === 'app' && appInert);
    const docScrolls = document.documentElement.scrollHeight > document.documentElement.clientHeight + 1 &&
      !/hidden|clip/.test(csOf(document.documentElement).overflowY + ' ' + csOf(document.body).overflowY);
    // a `position: fixed` / `sticky` box on the element or an ancestor (a page header that stays while the page scrolls)
    const pinned = (el) => { for (let q = el; q && q !== document.documentElement; q = q.parentElement) { const ps = csOf(q).position; if (ps === 'fixed' || ps === 'sticky') return true; } return false; };
    const fixedAncestor = (el) => { for (let p = el; p && p !== document.documentElement; p = p.parentElement) if (csOf(p).position === 'fixed') return true; return false; };
    let skippedActions = 0;
    let exemptedControls = 0;
    for (const a of measureActions ? (root.matches(ACTION) ? [root, ...root.querySelectorAll(ACTION)] : root.querySelectorAll(ACTION)) : []) {
      if (!vis(a)) continue;
      const cs = csOf(a);
      const isLink = a.tagName === 'A';
      const hasIcon = !!a.querySelector('svg, img');
      const inlineTextLink = isLink && !hasIcon && cs.display === 'inline'; // reach and cover only, never the touch size
      const r = a.getBoundingClientRect();
      // R24: an action is skipped by the three action rules only when it is (i) out of the tab order AND hidden from
      // assistive technology, and (ii) clipped away: an ancestor inside the target clips its overflow and its padding box
      // lies wholly past the action's box. A hidden control inside its frame, or a tabbable one clipped away, is measured.
      // a control in an `inert` subtree cannot be operated at all: the dialog that is covered by another one (`MantineModal` `covered`, WAI-ARIA)
      // is inert by contract and lies under that dialog's overlay by design (counted, never silent; Task 923 Revision 7, Story 199)
      if (a.closest('[inert]')) { skippedActions++; continue; }
      if (outOfTabOrder(a) && hiddenFromAT(a) && clippedAwayBy(a, root, r)) { skippedActions++; continue; }
      const region = scrollRegion(a, root);
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const name = `${describe(a)} "${clip(a.getAttribute('aria-label') || a.textContent || a.getAttribute('placeholder') || a.value || '', 24)}"`;
      const outsideX = cx < 0 || cx > vw;
      const outsideY = cy < 0 || cy > vh;
      // the page itself is a scroll region for what is not fixed to the viewport
      const pageScrollable = docScrolls && !fixedAncestor(a) && cy + window.scrollY >= 0 && cy + window.scrollY <= document.documentElement.scrollHeight;
      if (outsideX || outsideY) {
        if (!region && !(outsideY && !outsideX && pageScrollable)) add('action-hidden', `${name} centre ${px(cx)},${px(cy)} outside the ${vw}x${vh} viewport and no scroll region holds it`);
      } else {
        let seen = true;
        if (region) {
          const rr = region.getBoundingClientRect();
          seen = cx >= rr.left && cx <= rr.right && cy >= rr.top && cy <= rr.bottom;
        }
        if (seen) {
          const hit = document.elementFromPoint(cx, cy);
          // a dialog under another dialog (a delete confirmation over a preview) is covered by design - bounded (R11) to
          // a cover that lives in ANOTHER portal root than the action: the same root covering its own action is a defect
          const aPortal = a.closest('[data-portal="true"]');
          const hitPortal = hit && hit.closest('[data-portal="true"]');
          const stacked = !!aPortal && !!hitPortal && aPortal !== hitPortal;
          const ok = !hit || a.contains(hit) || (a.closest('label') && a.closest('label').contains(hit)) || stacked || (kind === 'app' && hit.closest('[data-portal="true"]'));
          // an action the page has scrolled under a pinned header is reached by scrolling the page (Task 923 Revision 7, Story 059): it is
          // scrolled to the middle of the viewport and measured again; the scroll position is put back
          let reachable = false;
          if (!ok && hit && docScrolls && !fixedAncestor(a) && pinned(hit)) {
            const sx = window.scrollX;
            const sy = window.scrollY;
            a.scrollIntoView({ block: 'center', inline: 'nearest' });
            const r2 = a.getBoundingClientRect();
            const hit2 = document.elementFromPoint(r2.left + r2.width / 2, r2.top + r2.height / 2);
            reachable = !hit2 || a.contains(hit2);
            window.scrollTo(sx, sy);
          }
          if (!ok && !reachable) add('action-covered', `${name} centre ${px(cx)},${px(cy)} is covered by ${describe(hit)}`);
        }
      }
      if (compact && !inlineTextLink) {
        const label = /^(checkbox|radio)$/.test(a.type || '') ? a.closest('label') : null;
        // the touch area of an `input` that sits in a bordered wrapper which is its field (a PasswordInput: the 44px outer div, its inner
        // input 42px inside the 1px borders) is the wrapper (Task 923 Revision 7, Story 149)
        const wrap = !label && a.tagName === 'INPUT' ? a.parentElement : null;
        const wcs = wrap ? csOf(wrap) : null;
        const bx = wcs ? (parseFloat(wcs.borderLeftWidth) || 0) + (parseFloat(wcs.borderRightWidth) || 0) : 0;
        const asField = !!wrap && bx > 0 && Math.abs(wrap.getBoundingClientRect().width - r.width - bx) <= 1;
        const box = label ? label.getBoundingClientRect() : asField ? wrap.getBoundingClientRect() : r;
        const small = Math.min(box.width, box.height);
        if (small < touchPx - 0.5) {
          // a control the registry row exempts by a dated owner decision (`exemptTargets`) is counted in the row, not failed (Task 923 R33, D9)
          if (exempt && a.matches(exempt)) exemptedControls++;
          else add('target-small', `${name} ${px(box.width)}x${px(box.height)} < ${px(touchPx)}px`);
        }
      }
    }

    for (const key of Object.keys(rules)) {
      if (counts[key] > rules[key].length) rules[key].push(`…+${counts[key] - rules[key].length} more (${counts[key]} in total)`);
    }
    return { rules, nodes: visible.length, skippedActions, exemptedControls, exemptedOverflow, exemptedText };
  }

  function focusState(triggerSelector) {
    const a = document.activeElement;
    const ps = portals();
    const portalIndex = a ? ps.findIndex((p) => p.contains(a)) : -1;
    let onTrigger = false;
    let triggerFocusable = true;
    if (a && triggerSelector) {
      const scope = document.querySelector('#storybook-root') || document;
      const matches = [...scope.querySelectorAll(triggerSelector.replace(/:scope\s*>/g, '#storybook-root >'))];
      const t = matches.find(vis) || matches[0] || null;
      onTrigger = !!t && (t === a || t.contains(a) || a.contains(t) && a !== document.body && a !== document.documentElement);
      // Mantine returns the focus to what held it when the overlay opened: a clicked element that cannot take focus
      // (a table cell) leaves it on the page, so there is nothing to return to.
      triggerFocusable = !!t && !!(t.matches(TABBABLE) || t.closest(TABBABLE));
    }
    return { triggerFocusable, active: a ? describe(a) + (a.getAttribute('aria-label') ? `[${clip(a.getAttribute('aria-label'), 16)}]` : '') : null, portalIndex, onTrigger, portals: ps.length };
  }

  // R26 (a): the running animations that can end - an animation whose effect has a finite `iterations`. An infinite one (a
  // loader, a pulse) never ends, so it never holds the page back from being "settled".
  function runningAnimations() {
    return document.getAnimations().filter((a) => {
      if (a.playState !== 'running') return false;
      const iterations = a.effect?.getTiming().iterations;
      return typeof iterations === 'number' && Number.isFinite(iterations);
    }).length;
  }

  // R31 (d): the layout signature the settle compares from poll to poll: the number of elements whose box is not empty in the app
  // root and in every visible portal root, and a sum over their boxes rounded to whole pixels (left, top, width, height). An
  // element that runs an infinite animation, and everything inside it, is left out, so a loader never holds the page. It sees
  // what neither the animation API nor the network sees: a block that grows frame by frame from script, a chart that mounts.
  function layoutSignature() {
    const infinite = new Set();
    for (const a of document.getAnimations()) {
      if (a.playState === 'running' && a.effect?.getTiming().iterations === Infinity && a.effect.target) infinite.add(a.effect.target);
    }
    let n = 0;
    let sum = 0;
    const take = (e) => {
      const r = e.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return;
      n++;
      sum += Math.round(r.left) + Math.round(r.top) * 3 + Math.round(r.width) * 7 + Math.round(r.height) * 11;
    };
    for (const root of [document.querySelector('#storybook-root'), ...portals()]) {
      if (!root || infinite.has(root)) continue;
      take(root);
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, { acceptNode: (e) => (infinite.has(e) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
      for (let e = walker.nextNode(); e; e = walker.nextNode()) take(e);
    }
    return `${n}/${sum}`;
  }

  // R26 (b): the focus once it has settled. Polls every 50ms until the same element is active on 3 consecutive polls,
  // bounded at 1 000ms; the settled element (at the bound, the last read) is described like `focusState`. A Tab press that
  // moves the focus through `body` for a moment (a control re-inserted by a framework) is not a leak a keyboard user meets.
  async function settleFocus(triggerSelector, { interval = 50, need = 3, bound = 1000 } = {}) {
    const t0 = performance.now();
    let last = null;
    let streak = 0;
    for (;;) {
      const a = document.activeElement;
      streak = a === last ? streak + 1 : 1;
      last = a;
      const settled = streak >= need;
      if (settled || performance.now() - t0 >= bound) return { ...focusState(triggerSelector), settled, waitedMs: Math.round(performance.now() - t0) };
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  }

  // How the open portals present themselves: a modal dialog or bottom sheet (Mantine Modal / Drawer, or
  // aria-modal) traps the focus whatever the state declared; a sheet has no close button of its own.
  function flavor(closeSelector) {
    const ps = portals();
    // only a modal that is SHOWN makes the overlay modal: a kept-mounted, closed Drawer (the admin navigation drawer below 1024px) shares
    // Mantine's one portal root with a popover and is `display: none` (Task 923 Revision 7, Story 059)
    const shown = (p, sel) => [...p.querySelectorAll(sel)].some(vis);
    const modal = ps.some((p) => shown(p, '.mantine-Modal-content, .mantine-Drawer-content, [aria-modal="true"]'));
    const sheet = ps.some((p) => shown(p, '.mantine-Drawer-content'));
    const hasClose = ps.some((p) => [...p.querySelectorAll(closeSelector)].some(vis));
    return { modal, sheet, hasClose };
  }

  // A structural path from the app root (`tag:nth-child(i) > ...`), the same shape the registry's selectors use once
  // `:scope > ` is put in front of it.
  const appRoot = () => document.querySelector('#storybook-root');
  function pathOf(el) {
    const root = appRoot();
    const parts = [];
    for (let e = el; e && e !== root; e = e.parentElement) {
      parts.unshift(e.tagName.toLowerCase() + ':nth-child(' + (Array.prototype.indexOf.call(e.parentElement.children, e) + 1) + ')');
    }
    return parts.join(' > ');
  }

  // Elements of the app root that may open an overlay when clicked (a button, a text input, a popup trigger,
  // a table row with a click handler is registered by hand and is found by its inner controls), one per tag + label,
  // each with a structural path from the app root. NO cap: discovery clicks every one (Task 923 R14). Used by
  // discovery, never by the metrics.
  function candidates() {
    const root = appRoot();
    if (!root) return [];
    const seen = new Set();
    const out = [];
    const sel = 'button, [role=button], input:not([type=checkbox]):not([type=radio]):not([type=hidden]), [aria-haspopup], [aria-expanded], select';
    for (const el of root.querySelectorAll(sel)) {
      if (!vis(el) || el.disabled) continue;
      const label = (el.getAttribute('aria-label') || el.textContent || el.placeholder || el.value || '').trim().slice(0, 30);
      const key = el.tagName + '|' + label;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ sel: pathOf(el), label, tag: el.tagName.toLowerCase() });
    }
    return out;
  }

  // The role and accessible name of an element, as far as a trigger needs them (R12: the same-named trigger at
  // another width). Explicit role, else the tag's implicit role; name from aria-label, aria-labelledby, an associated
  // label, the placeholder / value of a field, the title, else the text content.
  const IMPLICIT_ROLE = { BUTTON: 'button', A: 'link', SELECT: 'combobox', TEXTAREA: 'textbox', TR: 'row', TD: 'cell', TH: 'columnheader', LI: 'listitem', SUMMARY: 'button' };
  function identityOf(el) {
    const type = (el.getAttribute('type') || 'text').toLowerCase();
    const role = el.getAttribute('role') ||
      (el.tagName === 'INPUT' ? ({ checkbox: 'checkbox', radio: 'radio', button: 'button', submit: 'button', search: 'searchbox' }[type] || 'textbox') : IMPLICIT_ROLE[el.tagName] || el.tagName.toLowerCase());
    const labelled = (el.getAttribute('aria-labelledby') || '').split(/\s+/).filter(Boolean).map((id) => document.getElementById(id)?.textContent || '').join(' ');
    const forLabel = el.id ? document.querySelector('label[for="' + CSS.escape(el.id) + '"]')?.textContent : '';
    const raw = el.getAttribute('aria-label') || labelled || forLabel || el.getAttribute('placeholder') || el.getAttribute('title') ||
      (el.tagName === 'INPUT' ? el.value : '') || el.textContent || '';
    return { role, name: String(raw).replace(/\s+/g, ' ').trim().slice(0, 120) };
  }
  // Every visible element of the app root with that role and accessible name, as structural paths.
  function findByIdentity(role, name) {
    const root = appRoot();
    if (!root) return [];
    const out = [];
    for (const el of root.querySelectorAll('*')) {
      if (!vis(el)) continue;
      const id = identityOf(el);
      if (id.role === role && id.name === name) out.push(pathOf(el));
    }
    return out;
  }
  // For each candidate path and each row selector (`:scope > ...`, joined with ", "): is the candidate the row's
  // trigger ('self'), inside the row's trigger ('inside'), or unrelated (null)?
  function coverage(candidatePaths, rowSelectors) {
    const root = appRoot();
    if (!root) return [];
    const rowEls = rowSelectors.map((s) => {
      try { return [...root.querySelectorAll(s.replace(/:scope\s*>/g, '#storybook-root >'))].filter(vis); } catch { return []; }
    });
    return candidatePaths.map((p) => {
      const el = root.querySelector('#storybook-root > ' + p);
      const rows = [];
      rowEls.forEach((els, i) => {
        if (!el) return;
        if (els.includes(el)) rows.push({ row: i, relation: 'self' });
        else if (els.some((t) => t.contains(el))) rows.push({ row: i, relation: 'inside' });
      });
      return { path: p, rows };
    });
  }
  // What an open overlay looks like, to tell whether two clicks opened the same thing.
  function portalSignature() {
    return portals().map((p) => (p.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 160)).join(' || ');
  }

  function tabbableCount() {
    return portals().reduce((n, p) => n + [...p.querySelectorAll(TABBABLE)].filter(vis).length, 0);
  }

  window.__census = { portals, measure, focusState, settleFocus, runningAnimations, layoutSignature, tabbableCount, flavor, candidates, vis, identityOf, findByIdentity, coverage, portalSignature };
}
