# CI baseline recovery — verification summary

Base revision: `92685011a23500caa05f7129193ec42fa1a94f8c`.

## Static checks

- `npm.cmd run lint` — PASS: 0 errors, 63 pre-existing warnings.
- `npm.cmd run typecheck` — PASS.
- `npm.cmd run build` with `CLICK_SHIELD_CI_FIXTURE=1` — PASS.

## Click-Shield production matrix

The locally built production server was started with `CLICK_SHIELD_CI_FIXTURE=1`. The fixture
route returned HTTP 200; without that workflow-only variable, its server component calls
`notFound()`.

- `node scripts/check-click-shield.mjs --scenario=base` — PASS: 16/16 cells, 444 controls checked,
  0 interceptions, 0 empty candidate cells. The 320px footer/nav collision is correctly measured
  as scroll-clearable after the fixed-interceptor traversal repair.
- `node scripts/check-click-shield.mjs --scenario=drawer` — PASS: 16/16 cells, 560 controls
  checked, 0 interceptions, 0 scenario-open failures.
- `node scripts/check-click-shield.mjs --scenario=modal` — PASS: 16/16 cells, 348 controls
  checked, 0 interceptions, 0 scenario-open failures. Every cell opened the real `LightboxView`
  dialog through the guarded CI fixture route.

## Homepage Grid

- `node scripts/check-homepage-grid.mjs` — PASS: 260/260 cells. The real Featured header is
  compact (`column` / `flex-start`) at 320px, then uses its CSS-module wide row (`row` / `center`)
  at 640px and 1440px across sq/en/uk/it.
- `npm.cmd run check:homepage-grid:verify` — PASS: the unmodified 260-cell matrix passed; all
  seven planted defects tripped their intended invariant; the final post-plant 260-cell matrix
  had 0 failures.
