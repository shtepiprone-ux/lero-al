# Rendered state census: the app root and every portal root

This contract is the rendered half of `mobile-adaptation-contract.md` and GR-3j for every Story whose component can
open an overlay. It is project-wide: no task may replace it with its own probe.

**Owner decision, 2026-10-10 (verbatim):** *"R94 буде достатнім лише якщо він робить це загальним контрактом, а не
латкою Task 859: реєстр interaction states, що відкривають portal/overlay; відкриття кожного стану в Storybook;
окремий target для app root і кожного portal-root; вимірювання тексту, viewport/component overflow, дій, focus і
dismiss; evidence Story × state × portal root × locale × viewport; planted violation: overflow або обрізання лише
всередині portal має падати, навіть коли page root зелений."*

**Why.** A Mantine `Modal`, `Drawer`, bottom sheet, `Popover`, `Menu`, `Combobox` / `Select` dropdown and `Tooltip`
render through `Portal`, a `<div data-portal="true">` under `<body>`, outside `#storybook-root`. A census of the app
root alone is green while the overlay is broken (Task 859 review 16: a squeezed sheet header, clamped dialog titles,
a picker name one letter per line — none of them seen by two censuses that read `#storybook-root` only).

## The contract

1. **Interaction-state registry** — `scripts/rendered-interaction-states.json`. One row per Story × state that
   opens a portal: `{ id, story, open, portals }`, where `open` is `mount` (open on render), `click` (a selector
   inside the app root) or `keys` (a key sequence on a selector), and `portals` is the number of portal roots the
   state must show. Every Story is also enumerated in its closed state.
2. **Every state is opened in Storybook** — on the built Storybook, through the registered action, never by editing
   the Story. A state that does not open its declared portals fails; a portal root that appears in a state with no
   registry row fails (an unregistered overlay is a gap, not a pass).
3. **Separate targets** — the app root (`#storybook-root`) and each `[data-portal="true"]` root are measured and
   reported separately. One root's result never stands in for another's.
4. **Measured per target** —
   - text: every visible text element with a line clamp, an ellipsis or hidden overflow (active, and latent where
     the text is required semantic content), text past its box, and a word split across lines because its box is
     narrower than the word (a name rendered one letter per line);
   - viewport overflow: page-level horizontal scroll, and the target's own box past the viewport;
   - component overflow: a descendant past its container's padding box (a declared local scroll region excepted);
   - actions: every button, link and form control visible, inside the viewport or a reachable scroll region, not
     covered, and at least the touch token below the project's card switch;
   - focus: on open, focus is inside the overlay; in a modal overlay, Tab and Shift+Tab stay inside it;
   - dismiss: Escape and the visible close control close the overlay where Mantine supports them, and focus
     returns to the trigger. These are Mantine's native behaviours: the census measures them, it never alters them.
5. **Evidence** — one JSONL row per Story × state × root × locale × viewport with every metric and its verdict, and
   a summary matrix. Matrix: 320 / 390 / 639 / 640 / 1440 at minimum, plus every actual component threshold of the
   task; locales sq, en, uk, it.
6. **Planted violations** (`--verify-gate`, CI) — the gate must fail on: overflow only inside a portal root;
   clipped text only inside a portal root (both while the app root is green); the same violation in the app root
   only; a portal that appears in an unregistered state; a registered state that opens nothing.
7. **Gate** — a blocking CI step on the built Storybook (the precedent is the card-track gate in
   `.github/workflows/governance-pr.yml`). No baseline, allowlist or inline suppression; a Story × state that must
   differ needs a dated owner decision named in the registry row.

## Roles

- **Opus (design):** the kickoff names, for each changed overlay surface, its registry rows and the gate command as
  the rendered proof; a one-off task probe is not accepted as that proof.
- **Sonnet (execution):** adds or updates the registry rows of the Stories it changes in the same change, runs the
  gate, saves its JSONL and summary. The gate script itself is changed only by a task that names it.
- **Opus (review):** re-runs the gate on the final build and opens at least one failing-path state by hand.

## Until the gate exists

Task 923 builds the registry and the gate. Until 923 is approved, a visible task whose surface opens an overlay
cannot be `APPROVED`: the review verdict is `BLOCKED — RENDERED STATE CENSUS (923)`. After that, such a task is
approved only when the gate is green on the registry rows of every Story it changes or renders (`--stories`), and the
CI step over the whole registry turns blocking the day its full run is green; every violation of the first full run
is owned by a numbered task. A task-local census is evidence for diagnosis only, never a substitute.
