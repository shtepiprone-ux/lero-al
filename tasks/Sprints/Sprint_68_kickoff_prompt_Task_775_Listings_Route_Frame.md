# Task 775 — `/listings` route chrome → `ListingsPageFrame` (Mantine)

**Revision 3 — ready for current-tree verification**

## 1. Owner decision

Task 775 is a bounded frontend migration. It is verified against the **current committed tree** only.

- No baseline worktree, `pre-edit` capture, pre/post manifest, or historical waiver is required.
- No result may claim that a defect was "pre-existing" without evidence. Full-repository diagnostics are reported
  separately and are not Task-775 acceptance conditions.
- The rejected Revision-1 captures remain in `docs/sessions/evidence/task775/revision1/` as history only. They are
  not comparison evidence for this revision.
- Task 772 owns the existing mobile `ListingsSortBar` issue below 640px. Task 775 neither fixes nor waives it.

The current implementation is committed as `90f1412d8` plus `4254f3897`. The owner ran `npm.cmd run build` after
Phase-A2 changes with exit 0; `/[locale]/listings` remained dynamic. This revision changes only the verification
contract and the task-owned probe interface. Commit it before assigning the final verification to Sonnet.

## 2. Goal

Replace the `/[locale]/listings` route chrome with the Mantine server component `ListingsPageFrame`, while preserving
the existing `ListingsShell`, data loading, metadata and error handling. The frame supplies the page background,
breadcrumb band and responsive content gutter; it does not migrate the listings controls.

## 3. Binding implementation decisions

| ID | Decision |
|---|---|
| D775-A | The outer Mantine `Box` uses `maw="var(--width-page-max)"`, `mx="auto"`, `w="100%"`, and `px={{ base: 'md', sm: 'xl', lg: '2xl', xxl: '3xl' }}`. No Tailwind gutter class or new `globals.css` rule. |
| D775-B | Breadcrumb values remain: 14px text, link `gray.5`, current `gray.8`, separator `gray.4`, `/` separator and 6px separator gap. |
| D775-C | `theme.ts` has only the additive `2xl: 2rem` and `3xl: 3rem` spacing entries plus the seven-key type augmentation. |

## 4. Scope

Allowed implementation paths:

- `src/app/[locale]/listings/page.tsx`
- `src/modules/listings/components/ListingsPageFrame.tsx`
- `src/modules/listings/components/ListingsPageFrame.module.css`
- `src/design-system/mantine/theme.ts`
- `src/stories/patterns/mantine/ListingsPageFrame.stories.tsx`
- `scripts/mantine-migration-scope.json`
- `messages/en.json`, `messages/sq.json`, `messages/uk.json`, `messages/it.json`
- `scripts/task775-listings-frame-route-probe.mjs`
- `src/components/shared/Combobox.tsx` — only `data-value={opt.value}` on an existing option button
- `src/modules/listings/components/ListingsFilterBar.tsx` — only `data-testid="task775-advanced-filters"` on the
  existing advanced-filters button
- `docs/sessions/evidence/task775/**`, `docs/sessions/*task775*.md`, `docs/backlog.md`, and this kickoff

Out of scope: `ListingsShell`, `ListingsSortBar`, `ListingsPagination`, `ListingsStatusTabs`, Header, Footer,
`globals.css`, and every visual mobile-layout change below 640px. Task 772 owns that responsive defect.

## 5. Source constraints

In the Task-775-added lines of the frame, CSS module, theme, story, page, messages and scope manifest:

- no `1536`, `container-wide`, `--space-*`, raw colour hex or Tailwind utility class is introduced;
- the only `design-tokens-allow:` marker is exactly:

  ```css
  /* design-tokens-allow: padding-block: 0.625rem — preserved 10px breadcrumb-band block padding; no Mantine token matches */
  ```

- the CSS module has no container width, `max-width`, or breakpoint rule;
- no rendered gutter uses a raw `px`, `rem`, or bare number.

The route probe and its documentation are excluded from this source scan because it must query existing legacy
selectors for measurement.

## 6. Current route probe

Run one immutable capture of the current locally running tree. The probe is an evidence tool, not a package script.

```powershell
# In a terminal serving the current committed tree:
npm.cmd run dev

# In another terminal, from the same committed worktree:
$env:BASE_URL = 'http://127.0.0.1:3000'
node scripts/task775-listings-frame-route-probe.mjs current task775-final-<unique-id>
```

The run creates `docs/sessions/evidence/task775/runs/<unique-id>/route-probe.current.json` and two 1440 PNGs. It
records 28 `/en` and `/uk` viewport cells, spacing variables, separator colour, overflow culprits and four real
interactions. It fails if a route cell is non-OK, a required route selector is missing or ambiguous, an interaction's
exact postcondition fails. It records `serverMode` as `development` or `production`; development mode is valid
current-route UI evidence, while `npm.cmd run build` remains the production-build gate. It performs the route check
before creating the run directory, so an unreachable or non-OK server does not consume a run ID.

At 1440 `/en`, the probe must verify:

| Control | Start URL | Required result |
|---|---|---|
| Advanced filters | `/en/listings` | Sheet opens and URL is unchanged. |
| Sort | `/en/listings?page=2` | `sort=price_asc`; `page` is absent or `1`. |
| Status tab | `/en/listings` | `tab=closed`. |
| Pagination | `/en/listings` | `page=2`. |

`route-probe.current.json` must contain `gitCommit`, `probeHash`, `serverMode`, 28 cells and all four interaction
results, with no `failReason`. Its run directory is append-only; never reuse a run ID.

## 7. Acceptance criteria

| AC | Current-tree requirement |
|---|---|
| AC1 | `page.tsx` has zero `className` literals, wraps `ListingsShell` in `ListingsPageFrame`, and keeps data, metadata and error handling unchanged. |
| AC2 | The frame is a server component with no Tailwind utility string, shadcn import or `cn()` call; `npm.cmd run build` exits 0 and `/[locale]/listings` is dynamic. |
| AC3 | `ListingsPageFrame` declares `maw="var(--width-page-max)"`; the current probe records its computed gutter at all Q3 widths. At 1200 the horizontal padding is 2rem; at 1440 it is 3rem. No historical before-value is required or claimed. |
| AC4 | The current probe records 14px, `rgb(102, 112, 133)`, `rgb(29, 41, 57)`, `rgb(152, 162, 179)` and 6px for the breadcrumb's font, link, current, separator and gap respectively. |
| AC5 | `npm.cmd run check:story-coverage` exits 0 and maps `Patterns/Mantine/ListingsPageFrame` to the frame source. |
| AC6 | `npm.cmd run check:i18n` and `npm.cmd run check:stories` exit 0. |
| AC7 | The four current-route interactions in §6 pass their exact postconditions. |
| AC8 | The diff stays within §4; the two selector-hook exceptions remain one attribute each. |
| AC9 | The current probe records every width. At every measured Q3 route width of 680px and above there is no horizontal overflow. Results below 640px are reported to Task 772, not used to accept or reject Task 775. |
| AC10 | Every required command in §8 exits 0 on the current tree. `npm.cmd test`, `npm.cmd run check:locale-leak:mantine-only`, and `npm.cmd run screenshots:assert -- --mantine-only` are optional repository-health diagnostics and are reported verbatim, not treated as Task-775 gates. |
| AC11 | The existing empty/error listings route still renders the frame and breadcrumb. |
| AC12 | The current probe records non-empty `--mantine-spacing-2xl` and `--mantine-spacing-3xl`; they resolve to 2rem and 3rem and match the 1200/1440 gutter padding. |

## 8. Required current-tree checks

Run after the final Task-775 edit and retain each output in `docs/sessions/evidence/task775/`:

```text
node --check scripts/task775-listings-frame-route-probe.mjs
npm.cmd run typecheck
npm.cmd run check:stories
npm.cmd run check:story-coverage
npm.cmd run check:i18n
npm.cmd run check:mojibake
npm.cmd run check:file-integrity
npm.cmd run check:design-tokens:strict
npm.cmd run governance:tailwind
npm.cmd run build-storybook
npm.cmd run build
```

The three optional diagnostics are useful repository information. Report their raw output separately, without using
it as historical-comparison evidence or as a Task-775 acceptance condition:

```text
npm.cmd run check:locale-leak:mantine-only
npm.cmd test
npm.cmd run screenshots:assert -- --mantine-only
```

## 9. Completion report

Sonnet reports:

1. `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` only when every required current-tree check and the current route
   probe pass; otherwise `PARTIALLY IMPLEMENTED` with exact failed commands or probe fields.
2. The exact changed-file list and the source-constraint scan output.
3. Each required command, exit code and transcript path; optional diagnostics separately, without calling them green.
4. The current probe JSON/PNG paths, its `gitCommit`, `probeHash`, cell count and interaction results.
5. Any below-640 overflow observation as a Task-772 finding, not a Task-775 waiver.

The reviewer compares the current implementation with this specification. No person creates a baseline worktree or
asserts historical equivalence for this task.
