# Task 843 — canonical primitive audit (post owner correction)

Owner correction, 2026-09-18: the Retry buttons used `variant="outline" color="gray"`, a combination
absent from the enumerated canonical `Mantine/Primitives/Button` story (`filled · default · subtle ·
light(red) · transparent`). That story's own "Cancel" example uses `variant="default"` with no `color`
override — the actual canonical neutral/secondary chrome. Citing two production files that used the
same uncatalogued pairing was not a substitute for checking the primitive story itself.

Fixed: all three Retry buttons (`MantineDashboardCard`, `MantineDashboardStatCard`,
`MantineDashboardStatRows`) now use `variant="default"`, cited to `Mantine/Primitives/Button`'s Cancel
example.

Full re-audit of every other primitive against its own canonical story, done proactively after the
correction rather than waiting for the next one to be caught manually:

| Primitive | Usage in the three patterns | Canonical story | Result |
|---|---|---|---|
| `Button` (Retry) | `variant="default"` | `Mantine/Primitives/Button` — "Cancel" example (`variant="default"`, no color) | Fixed to match |
| `Badge` (stale warning, tone rows) | `color="yellow"` / `color={TONE_COLOR[tone]}` (green/yellow/red/gray) | `Mantine/Primitives/Badge` — demoes exactly `color="green"/"yellow"/"red"/"gray"/"brand"`, `variant="light"` (theme default) and `variant="filled"` | Matches enumerated set |
| `ThemeIcon` (icon badge, zero-state check) | `size="hero"/"sm" radius="xl" color="gray"/success variant="light"` | No dedicated primitive story; real production precedent in `MantineEmptyLoadingErrorState.tsx` (`size="hero" radius="xl" color="gray" variant="light"`) and `MantineNotificationPattern.tsx` (`VARIANT_COLORS`/success=green) | `color="gray"` matches `MantineEmptyLoadingErrorState`; zero-state success color refactored to import `VARIANT_COLORS.success` from `notificationVariants.ts` instead of a fresh literal `"green"` |
| `Card` (shell) | `withBorder`, `p={{ base:'lg', md:'xl' }}` (TailAdmin §6u, kickoff-authorized), `mih={theme.other.boxSize.dashboardStatCardMinHeight}` | `Mantine/Primitives/Card` — demoes exactly `<Card withBorder>` | Matches |
| `Skeleton` (loading geometry) | `height`/`width` sourced from `theme.fontSizes.*`, `theme.headings.sizes.h3.fontSize`, `theme.other.touchTarget`, `theme.other.iconSize.hero` | `Mantine/Primitives/Skeleton` — demo story itself uses raw numeric literals (acceptable there: it is illustrating the bare primitive, not a production pattern) | No raw literals in the patterns (AC4 grep exit 1) |
| `UnstyledButton` (StatRows row link) | `component={Link} href={row.href} mih={theme.other.touchTarget}` | `Mantine/Primitives/UnstyledButton` — demoes exactly `component="a" href="#"` polymorphism | Matches |

Re-verified after the fix: `npm run typecheck` exit 0, `npm run lint` exit 0 (0 errors), AC4 hardcode grep
exit 1 (no matches) on the three pattern files.

## Second owner correction — inconsistent error-text color across the three patterns

Owner correction, 2026-09-18: `MantineDashboardStatCard`'s error message used `c="red"`, while
`MantineDashboardCard` and `MantineDashboardStatRows` rendered the same semantic state (error message
text) with no color at all — the same defect class as the Button fix (an un-vetted, undocumented local
choice, this time inconsistent even between siblings written in the same task).

Canonical source found: `MantineFormSectionStack.tsx:135` already establishes the inline (non-`Alert`)
error-text convention — `<Text size="sm" c="red">`. Fixed all three patterns to use it identically:
`MantineDashboardCard`, `MantineDashboardStatCard`, `MantineDashboardStatRows` all now render their
error message as `<Text size="sm" c="red">{errorMessage}</Text>`, cited in a comment at each site.

Re-verified: `npm run typecheck` exit 0, AC4 hardcode grep exit 1 (no matches).

## Third pass — exhaustive prop-by-prop audit (owner instruction: "check the whole task, it's compromised")

Every single `color=`/`c=`/`variant=`/`size=`/`radius=`/`fw=` prop in the three pattern files was
re-checked against real precedent (an existing canonical Story or an existing production pattern),
not assumed. Findings:

| File:line (pre-fix) | Value | Issue | Fix |
|---|---|---|---|
| `MantineDashboardCard.tsx` stale `Badge` | `size="md"` | No existing Badge in the codebase uses `size="md"` — every real usage (Badge story, `MantineNotificationPattern`, `MantineDashboardStatRows`' own tone badges) relies on the theme default (`sm`). `size="md"` was reachable only per a theme.ts comment anticipating a *future* consumer, not an actual rendered precedent. | Removed — uses the theme default `sm`, like every other Badge in the app. |
| same `Badge` | explicit `variant="light"` | Redundant restatement of the Badge default (`defaultProps.variant: 'light'`); the canonical Badge story never restates a default prop. | Removed. |
| same `Badge` | explicit `radius="pill"` | Same — Badge's own default. | Removed. |
| `MantineDashboardStatRows.tsx` loading `Skeleton` | `radius="md"` | The theme's `Skeleton` default is `radius: 'xl'`; every Skeleton elsewhere in these three patterns (StatCard's loading geometry) uses the default, unoverridden. This one row alone diverged with no cited reason. | Removed — uses the theme default `xl`. |

Confirmed correct on re-check (real precedent found, not invented):
- `fw={700}` on the KPI value — matches `MantineListingCardPattern`/`MantineListingContactPattern`/`MantineListingDetailPattern`'s established price-emphasis weight.
- `c="gray.8"` on the KPI value and row text — matches `RangeDatePicker.tsx:678`, `responsiveBottomSheet.tsx:146`, `MantineNavigationMenu.tsx:171`.
- `c="gray.7"` on the DashboardCard story's body text — matches `MantineDataTableToCards.tsx:288`, `RangeDatePicker.tsx:701`.
- `theme.other.iconSize.compact` (14px) for the StatRows chevron — this is the kickoff's own §3.2 verified-context assignment ("`compact: 14 (chevron)`"), not a self-chosen value; `iconSize` is an unlabelled t-shirt scale (unlike `boxSize`, it carries no fixed one-to-one role), so the kickoff's per-task role assignment governs.
- `lineClamp={2}` — matches `MantineListingCardPattern.tsx:224/360`.
- `Check` (lucide-react) for the zero-state icon, not a raw glyph — `lucide-react` is the documented project icon set (kickoff §5); a pre-existing raw-Unicode checkmark in `MantineNotificationPattern.tsx` is legacy, not a convention to imitate.

Re-verified after all fixes: `npm run typecheck` exit 0, `npm run lint` exit 0 (0 errors), AC4 hardcode
grep exit 1, `check:stories`/`check:story-coverage`/`check:pattern-enrolment`/`check:design-tokens:strict`
all PASS.
