# Task 762 Revision 1 — `@property` dependency probe

Produced by the orchestrator during the review of Task 762, 2026-08-21. This is **reviewer** evidence for
defect O-1 in `tasks/Sprints/Sprint_62_Task_762_revision_1_Category_C_And_Gate_Bypass.md`, not executor evidence.

## What it measures

`MobileBottomNavView.module.css:57,61` ships:

    --tw-shadow: 0 -2px 16px var(--tw-shadow-color, #00000014);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
    border-top-style: var(--tw-border-style);

Those four `--tw-*` names are never set by this project. They resolve today only because Tailwind's compiled
output registers them with `@property … initial-value`. `probe.html` and `probe-notw.html` are byte-identical
except that `probe-notw.html` has the `@property` rules removed — i.e. the state after Tailwind is removed.

## Result (`result.json`, Chromium via Playwright, `getComputedStyle`)

| | box-shadow | border-top-style | border-top-width |
|---|---|---|---|
| with `@property` | `rgba(0,0,0,0.08) 0px -2px 16px 0px` (+4 transparent layers) | `solid` | `1px` |
| without | `none` | `none` | `0px` |

## Why it matters

Category A (`--default-transition-*`, fixed by Task 762) degraded a *value* — `transition-duration` fell to `0s`
and the declaration survived. Category C removes the *declaration*: `var()` substitution fails, the declaration is
invalid at computed-value time, and the shadow and border disappear. `border-style: none` additionally forces the
used border width to `0`.

The original Task 762 kickoff deferred Category C as "a different remediation" without measuring this. It is the
more damaging of the two classes, not the less.

## Reproduce

    node run.mjs        # requires playwright + a Chromium executable in PW_EXE
