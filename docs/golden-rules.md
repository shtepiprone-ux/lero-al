# Golden Rules — non-negotiable, receipt-enforced

This is the compact Golden Rules index. The full, unchanged rule text and its exact receipts are split by rule under
[`docs/rules/golden/`](rules/golden/). Read the fragment selected by the role phase and task type; do not load every
Golden Rule by default. A required fragment, command, or receipt remains binding exactly as written.

The parent workflows in `.claude/skills/` and `.claude/rules/` decide the minimum order. For visible UI, all roles
read `gr-0-canonical-reuse.md`, `gr-3a-story-preflight.md`, `gr-9-review-depth.md`, and the GR-12 fragments, plus the
relevant GR-3b…GR-3i fragment. The operational token/parity decision tree is
`.claude/rules/shared/ui-token-contract.md`.

| Rule | Detailed fragment |
|---|---|
| GR-0 canonical reuse | [gr-0-canonical-reuse.md](rules/golden/gr-0-canonical-reuse.md) |
| GR-1 surface census | [gr-1-surface-census.md](rules/golden/gr-1-surface-census.md) |
| GR-2 gate blind spots | [gr-2-gate-blind-spots.md](rules/golden/gr-2-gate-blind-spots.md) |
| GR-3 direct Story / GR-3a preflight | [gr-3-direct-story.md](rules/golden/gr-3-direct-story.md), [gr-3a-story-preflight.md](rules/golden/gr-3a-story-preflight.md) |
| GR-3b…GR-3i visual Story checks | [responsive width](rules/golden/gr-3b-responsive-width.md), [type](rules/golden/gr-3c-responsive-type.md), [gutter](rules/golden/gr-3d-story-gutter.md), [actions](rules/golden/gr-3e-popup-actions.md), [circles](rules/golden/gr-3f-circles.md), [rounded lines](rules/golden/gr-3g-rounded-lines.md), [object spacing](rules/golden/gr-3h-object-spacing.md), [names wrap](rules/golden/gr-3i-names-wrap.md) |
| GR-4…GR-6 | [observable AC](rules/golden/gr-4-observable-acceptance.md), [state/archive](rules/golden/gr-5-state-archive.md), [owner Git handoff](rules/golden/gr-6-owner-git-handoff.md) |
| GR-7 references | [standing audit](rules/golden/gr-7-reference-research.md), [owner links](rules/golden/gr-7-owner-links.md) |
| GR-8 table anatomy | [gr-8-table-anatomy.md](rules/golden/gr-8-table-anatomy.md) |
| GR-9 review depth | [gr-9-review-depth.md](rules/golden/gr-9-review-depth.md) |
| GR-10 canonical parity | [gr-10-canonical-parity.md](rules/golden/gr-10-canonical-parity.md) |
| GR-11 rounded corners | [gr-11-rounded-corners.md](rules/golden/gr-11-rounded-corners.md) |
| GR-12 no hardcode and parity | [no hardcode](rules/golden/gr-12-no-hardcode.md), [parity census](rules/golden/gr-12-parity-census.md) |
| Enforcement map | [enforcement-status.md](rules/golden/enforcement-status.md) |

The provenance for receipt-enforced rules is retained in [the preamble](rules/golden/_preamble.md). No agent may
narrow, defer, or replace a Golden Rule without the owner decision required by that rule.
