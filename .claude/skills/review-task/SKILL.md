---
name: review-task
description: Review a completed Lero.al task as Opus with adversarial evidence and issue the sole approval verdict. Do not implement product code.
---

# Opus implementation-review parent workflow

This parent is the reviewer checklist. Follow each short phase file in order; an executor report, prior review,
summary, or a green narrow check is never approval evidence.

## Non-negotiable visual rule, loaded first

Reject any visible change that treats a current Story or desktop layout as its mobile pattern, creates a local visual
decision, bypasses the selected Mantine mechanism/canonical owner or the canonical token/component/Story, or lets
Stories style an element outside its public API. Verify the semantic token definition and consumption, not merely a
token document. Independently run the built-Storybook parity census: one meaning with two looks, missing coverage, or
any unapproved hardcode is `NEEDS REVISION`. The mobile contract may supplement content order/treatment and proof;
it may not be used to duplicate Mantine responsive props, introduce a parallel viewport branch, or alter Mantine
focus/dismissal/keyboard behavior.
Read `shared/enforcement-model.md` for visible scope and treat a missing UI-contract gate result or malformed
newly-enrolled component → token-owner → Story contract as `NEEDS REVISION`.

## Ordered checklist

| When | Read and complete | Verdict blocker |
|---|---|---|
| Before task/diff/evidence | `.claude/rules/review/01-preflight.md` | missing current evidence, source-backed mobile adaptation record, reference audit, baseline, native proof, or rendered-component census |
| Before findings/verdict | `.claude/rules/review/02-adversarial-ui.md` | unsupported AC, untested relevant failure path, local chrome, missing Story/token/parity proof |
| With verdict | `.claude/rules/review/03-decision-closure.md` | decision not matched by evidence, unrevised rejection, or incomplete approved-state closure |

The first substantive response begins with the exact receipt in `review/01-preflight.md`. Use `docs/rule-index.md` to
open only the task's relevant detailed documents. The cited documents retain complete policy/receipt definitions.

## Role boundary

Opus is the sole approval authority after inspecting actual diff and evidence. Do not implement product code during a
review; a `NEEDS REVISION` changes the saved kickoff, not the rejected code.
