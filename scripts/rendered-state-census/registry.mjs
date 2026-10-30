/**
 * registry.mjs — validator of `scripts/rendered-interaction-states.json` (Task 923, R1, R12).
 *
 * The registry lists every interaction state that opens a portal (a Mantine Modal, Drawer, bottom sheet,
 * Popover, Menu, Combobox / Select dropdown, Tooltip) of the canonical Mantine Stories. The contract is
 * `.claude/rules/shared/rendered-state-census.md`. This module is pure: it reads no file, so a unit test can
 * feed it any registry; the runner passes the built Storybook index to also check the Story ids.
 *
 * Shape: `{ "version": 1, "states": [ { id, story, open, portals, focus, dismiss, trigger?, closeSelector?,
 * reason?, ownerDecision?, widths? } ] }`.
 *
 * `widths` (optional `{ min?, max? }`, inclusive viewport widths) is the one key beyond the kickoff's R1 list. A
 * responsive Story renders a trigger at one side of a layout switch only (the admin hamburger below 640px, the locale
 * dropdown above it); without `widths` such a state could not be registered, because the gate fails an `open`
 * selector that matches nothing. Absent = the state exists at every matrix width. The switch is a real one (R12): each
 * `min` is a theme breakpoint in px and each `max` is a theme breakpoint minus 1 (`theme.ts` `breakpoints`); the
 * validator receives that list as `options.breakpoints` and rejects any other value. The runner measures a `widths`
 * state at its in-range bound and fails `widths-mismatch` where the same-named trigger opens a portal outside it.
 */
import { MANTINE_STORY_TITLE_PREFIXES } from '../lib/mantine-story-scope.mjs';

export const REGISTRY_VERSION = 1;
export const STATE_KEYS = ['id', 'story', 'open', 'portals', 'focus', 'dismiss', 'trigger', 'closeSelector', 'reason', 'ownerDecision', 'exemptTargets', 'exemptOverflow', 'exemptText', 'widths'];
export const OPEN_KINDS = ['mount', 'click', 'keys'];
export const FOCUS_MODES = ['trap', 'trigger', 'inside'];
export const DISMISS_MECHANISMS = ['escape', 'close-control', 'outside'];

const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0;
const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

/** @param {string} title */
export function isScopeTitle(title) {
  return typeof title === 'string' && MANTINE_STORY_TITLE_PREFIXES.some((p) => title.startsWith(p));
}

function validateOpen(label, open, errors) {
  if (!isPlainObject(open)) {
    errors.push(`${label}: "open" must be an object { kind: mount | click | keys, ... }`);
    return;
  }
  const kind = open.kind;
  if (!OPEN_KINDS.includes(kind)) {
    errors.push(`${label}: open.kind "${String(kind)}" is not one of ${OPEN_KINDS.join(', ')}`);
    return;
  }
  const allowed = kind === 'mount' ? ['kind'] : kind === 'click' ? ['kind', 'selector'] : ['kind', 'selector', 'keys'];
  for (const key of Object.keys(open)) {
    if (!allowed.includes(key)) errors.push(`${label}: unknown key "open.${key}" for open.kind "${kind}"`);
  }
  if (kind !== 'mount' && !isNonEmptyString(open.selector)) errors.push(`${label}: open.kind "${kind}" needs a non-empty open.selector`);
  if (kind === 'keys' && !(Array.isArray(open.keys) && open.keys.length > 0 && open.keys.every(isNonEmptyString))) {
    errors.push(`${label}: open.kind "keys" needs a non-empty open.keys array of key names`);
  }
}

/**
 * @param {unknown} registry the parsed registry
 * @param {{ index?: Record<string, { id: string, title: string, type: string }>, breakpoints?: number[] }} [options]
 *   `index` = `storybook-static/index.json` `entries`; when given, every Story id is checked against it.
 *   `breakpoints` = the theme breakpoints in px; required to accept any state that carries `widths`.
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateRegistry(registry, { index, breakpoints } = {}) {
  const errors = [];
  if (!isPlainObject(registry)) return { ok: false, errors: ['registry must be a JSON object { version, states }'] };
  for (const key of Object.keys(registry)) {
    if (key !== 'version' && key !== 'states') errors.push(`unknown top-level key "${key}"`);
  }
  if (registry.version !== REGISTRY_VERSION) errors.push(`version must be ${REGISTRY_VERSION}`);
  if (!Array.isArray(registry.states)) {
    errors.push('"states" must be an array');
    return { ok: false, errors };
  }

  const seen = new Set();
  registry.states.forEach((state, position) => {
    const label = isPlainObject(state) && isNonEmptyString(state.id) ? `state "${state.id}"` : `states[${position}]`;
    if (!isPlainObject(state)) {
      errors.push(`${label}: must be an object`);
      return;
    }
    for (const key of Object.keys(state)) {
      if (!STATE_KEYS.includes(key)) errors.push(`${label}: unknown key "${key}"`);
    }
    if (!isNonEmptyString(state.id)) errors.push(`${label}: "id" must be a non-empty string`);
    else if (seen.has(state.id)) errors.push(`${label}: duplicate id "${state.id}"`);
    else seen.add(state.id);

    if (!isNonEmptyString(state.story)) errors.push(`${label}: "story" must be a Storybook story id`);
    else if (index) {
      const entry = index[state.story];
      if (!entry || entry.type !== 'story') errors.push(`${label}: story "${state.story}" is not in the Storybook build index`);
      else if (!isScopeTitle(entry.title)) {
        errors.push(`${label}: story "${state.story}" has the out-of-scope title "${entry.title}" (only ${MANTINE_STORY_TITLE_PREFIXES.join(' and ')})`);
      }
    }

    validateOpen(label, state.open, errors);

    if (!Number.isInteger(state.portals) || state.portals < 1) errors.push(`${label}: "portals" must be an integer >= 1`);
    if (!FOCUS_MODES.includes(state.focus)) errors.push(`${label}: focus "${String(state.focus)}" is not one of ${FOCUS_MODES.join(', ')}`);

    if (!Array.isArray(state.dismiss)) {
      errors.push(`${label}: "dismiss" must be an array of ${DISMISS_MECHANISMS.join(' | ')}`);
    } else {
      for (const m of state.dismiss) {
        if (!DISMISS_MECHANISMS.includes(m)) errors.push(`${label}: dismiss mechanism "${String(m)}" is not one of ${DISMISS_MECHANISMS.join(', ')}`);
      }
      if (new Set(state.dismiss).size !== state.dismiss.length) errors.push(`${label}: dismiss lists a mechanism twice`);
      if (state.dismiss.length === 0 && !isNonEmptyString(state.reason)) {
        errors.push(`${label}: an empty "dismiss" needs a non-empty "reason"`);
      }
    }

    const kind = isPlainObject(state.open) ? state.open.kind : undefined;
    if (kind === 'mount' && state.trigger !== undefined) errors.push(`${label}: a "mount" state has no "trigger"`);
    if ((kind === 'click' || kind === 'keys') && !isNonEmptyString(state.trigger)) {
      errors.push(`${label}: a "${kind}" state needs "trigger" (the selector focus returns to)`);
    }
    if (state.widths !== undefined) {
      const w = state.widths;
      if (!isPlainObject(w) || Object.keys(w).some((k) => k !== 'min' && k !== 'max') || (w.min === undefined && w.max === undefined)) {
        errors.push(`${label}: "widths" must be { min?, max? } with at least one bound`);
      } else if ([w.min, w.max].some((v) => v !== undefined && !Number.isInteger(v))) {
        errors.push(`${label}: "widths" bounds must be integers`);
      } else if (w.min !== undefined && w.max !== undefined && w.min > w.max) {
        errors.push(`${label}: "widths" min ${w.min} is above max ${w.max}`);
      } else if (!Array.isArray(breakpoints) || breakpoints.length === 0) {
        errors.push(`${label}: "widths" cannot be checked without the theme breakpoint list (pass options.breakpoints)`);
      } else {
        if (w.min !== undefined && !breakpoints.includes(w.min)) {
          errors.push(`${label}: widths.min ${w.min} is not a theme breakpoint (${breakpoints.join(', ')})`);
        }
        if (w.max !== undefined && !breakpoints.includes(w.max + 1)) {
          errors.push(`${label}: widths.max ${w.max} is not a theme breakpoint minus 1 (${breakpoints.map((b) => b - 1).join(', ')})`);
        }
      }
    }
    for (const optional of ['closeSelector', 'reason', 'ownerDecision', 'exemptTargets', 'exemptOverflow', 'exemptText']) {
      if (state[optional] !== undefined && !isNonEmptyString(state[optional])) errors.push(`${label}: "${optional}" must be a non-empty string when present`);
    }
    // Task 923 Revision 7 (owner D9, 2026-10-16): "exemptTargets" is a CSS selector of controls whose touch size (`target-small`) an owner
    // decision exempts; it is only valid with the dated owner decision named in the same row (rendered-state-census.md, contract 7)
    if (state.exemptTargets !== undefined && !isNonEmptyString(state.ownerDecision)) {
      errors.push(`${label}: "exemptTargets" needs a non-empty "ownerDecision" naming the dated owner decision`);
    }
    // Task 923 Revision 7 (owner D10, 2026-10-17): "exemptOverflow" is a CSS selector of boxes (and what lies inside them) whose `component-overflow` an owner decision exempts;
    // like "exemptTargets" it is only valid with the dated owner decision named in the same row
    if (state.exemptOverflow !== undefined && !isNonEmptyString(state.ownerDecision)) {
      errors.push(`${label}: "exemptOverflow" needs a non-empty "ownerDecision" naming the dated owner decision`);
    }
    // Task 923 Revision 40 (owner D84, 2026-10-23): "exemptText" is a CSS selector of elements (and what lies inside them) whose `text-ellipsis` an owner decision exempts;
    // like "exemptOverflow" it is only valid with the dated owner decision named in the same row
    if (state.exemptText !== undefined && !isNonEmptyString(state.ownerDecision)) {
      errors.push(`${label}: "exemptText" needs a non-empty "ownerDecision" naming the dated owner decision`);
    }
    if (state.closeSelector !== undefined && Array.isArray(state.dismiss) && !state.dismiss.includes('close-control')) {
      errors.push(`${label}: "closeSelector" is only meaningful with the "close-control" dismiss mechanism`);
    }
  });

  return { ok: errors.length === 0, errors };
}

/** Whether a state exists at a viewport width (`widths` absent = every width). */
export function appliesAtWidth(state, width) {
  const w = state.widths;
  if (!w) return true;
  return (w.min === undefined || width >= w.min) && (w.max === undefined || width <= w.max);
}

/** The viewport widths at which a `widths` state must be measured (its in-range bound) and the first widths outside it. */
export function rangeEdges(state) {
  const w = state.widths;
  if (!w) return { inRange: [], outside: [] };
  const inRange = [];
  const outside = [];
  if (w.min !== undefined) { inRange.push(w.min); outside.push(w.min - 1); }
  if (w.max !== undefined) { inRange.push(w.max); outside.push(w.max + 1); }
  return { inRange, outside };
}
