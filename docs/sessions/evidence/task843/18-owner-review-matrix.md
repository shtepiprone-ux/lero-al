# Task 843 — owner visual review matrix

Storybook dev server running at `http://localhost:6006/`. Task 799 (viewport toolbar) is still open, so open each
`iframe.html` URL directly and resize the **browser window** (or DevTools device mode) to the given width — the
toolbar's viewport selector will not resize the preview.

| # | Story | State | Width | Locale | URL | Owner checks |
|---|---|---|---|---|---|---|
| 1 | DashboardStatCard | Default (all states) | 1440 | en | http://localhost:6006/iframe.html?id=patterns-mantine-dashboardstatcard--default&globals=locale:en | TailAdmin §6u look: grey 48px icon badge, 14px grey label, 30px bold value, flat bordered 16px-radius card, no shadow at rest |
| 2 | DashboardStatCard | Default | 1024 | sq | http://localhost:6006/iframe.html?id=patterns-mantine-dashboardstatcard--default&globals=locale:sq | 4-up grid readable; zero card reads as positive with icon + text |
| 3 | DashboardStatCard | Default | 768 | it | http://localhost:6006/iframe.html?id=patterns-mantine-dashboardstatcard--default&globals=locale:it | 2-up; long Italian labels wrap to ≤ 2 lines |
| 4 | DashboardStatCard | Default | 390 | uk | http://localhost:6006/iframe.html?id=patterns-mantine-dashboardstatcard--default&globals=locale:uk | 1-up full width; error Retry separate from the card link |
| 5 | DashboardStatCard | Default | 320 | uk | http://localhost:6006/iframe.html?id=patterns-mantine-dashboardstatcard--default&globals=locale:uk | no horizontal overflow; value not shrunk |
| 6 | DashboardStatRows | Default | 1440 / 390 | en / uk | http://localhost:6006/iframe.html?id=patterns-mantine-dashboardstatrows--default&globals=locale:en (then locale:uk) | three rows with counts + chevrons; all-zero empty state; tone badges carry text |
| 7 | DashboardCard | Default | 1280 / 480 | en / uk | http://localhost:6006/iframe.html?id=patterns-mantine-dashboardcard--default&globals=locale:en (then locale:uk) | title + scope label; loading skeleton without digits; error + Retry; stale warning badge |

Individual named states (also reachable without resizing per-state, useful for a quick look at one state only):

- Loading: `…?id=patterns-mantine-dashboardstatcard--loading` / `…dashboardstatrows--loading` / `…dashboardcard--loading`
- Error: `…--error` (all three patterns)
- Zero (StatCard only): `…dashboardstatcard--zero`

## Owner verdict

**2026-09-18, first pass:** the owner reviewed live via the running Storybook dev server and, across three
correction rounds in chat (Retry button chrome, error-text color consistency, Badge/Skeleton size/radius), accepted
the result. That acceptance predates review 1 (orchestrator), which returned `NEEDS REVISION` with findings F1–F6 —
F3 in particular changes the rendered error-state visuals (composes `MantineEmptyLoadingErrorState`'s `Alert`
instead of the bare `Text`+`Button` the owner had actually looked at). **AC9r / F5 requires tuples 1–7 to be
reviewed again after F1–F3 land, with the owner's verbatim words and the date recorded per tuple** — this file
records that re-review as still owed, not assumed carried over from the first pass. Storybook (dev server) reflects
all of Revision 1's changes as of this update; the URLs above are unchanged.

**2026-09-18, re-review after Revisions 1–2 (recorded by the orchestrator, review 4):** owner, verbatim: *"Візуально у Stories все ок."* Tuples 1–7: **accepted**.
