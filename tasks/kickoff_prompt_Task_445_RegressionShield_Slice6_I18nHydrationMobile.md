# Task 445 — Regression Shield · SLICE 6: i18n / hydration / mobile contract (PREVENTION ONLY)

> **Part of Epic RS (Regression Shield).** See `tasks/Epics/Epic_RS_Regression_Shield.md` +
> `docs/critical-flow-registry.md` ("P1 — i18n / hydration / mobile contract (Slice 6 / Task 445)").
> **🔴 PREVENTION ONLY.** This slice does NOT fix or redesign any product code, component, route, message
> file, or formatter. It builds/extends the regression net for the i18n + hydration + mobile-overflow class.
> Tests assert the **existing shipped behavior**. No "while I'm here" fix (Epic RS hard boundary). It must NOT
> fix or touch the live local bugs (Task 433/434/435/437/439).
>
> **🔴🔴 SCOPE DECISION ALREADY MADE BY OWNER (2026-06-17) — DO NOT RE-OPEN, DO NOT WIDEN.**
> **(1) CI = deterministic blocking gates ONLY.** This slice adds NO CI step that boots a Next.js server. No
> `next start`/`next dev` in CI, no Playwright-against-live-routes CI job, no admin-auth cookie seeding in CI.
> Only stable, server-less, deterministic gates become blocking PR steps.
> **(2) Live-route checks are OWNER-RUN / native evidence**, documented in the session log with the EXACT
> command and PASS result — never as a mandatory CI boot step in this task. The planted-violation proof for
> hydration comes from the deterministic server-less `check:hydration:verify` / `--verify-gate` self-test —
> never from breaking a real live route/component.
> **(3) Registry rows flip to ✅ only where coverage is deterministic and needs no authenticated admin
> runtime.** The **admin live-route hydration** row is intentionally DEFERRED to **Slice 6b** (it requires an
> authenticated admin runtime harness this slice does not stably build) — keep it ❌/🟡 with an honest note.
> If you find yourself wanting a live CI server, admin auth in CI, a new product story, or any product change —
> **STOP and ASK.** That is the boundary, not the task.

> **🟦 ADDENDUM BEFORE EXECUTION (owner review 2026-06-17 — binding, read before AC6/AC7/AC8):**
> - **Do NOT invent owner-run live PASS evidence.** If a stable local runtime / real listing slug / required
>   story coverage is unavailable, the executor MUST NOT fabricate a PASS. Instead record the EXACT owner-native
>   command(s) to run and leave the affected registry row **🟡** until the owner provides the evidence.
> - **If G2 falls back to a test-only harness component**, the registry wording for the i18n row must say
>   **"runtime message-provider parity covered"** — it must NOT imply that every key route was rendered in jsdom.
> - **`screenshots:assert:fast` is acceptable ONLY** if it includes the required critical surfaces AND the
>   `uk@320/375/390` cells; otherwise run the full `screenshots:assert`.
> - **Missing mobile story coverage is NOT a task failure** if it is documented honestly AND the mobile-overflow
>   row is left 🟡 (not flipped to ✅). STOP-and-ASK before adding any story; an honest 🟡 + gap note is the
>   correct outcome, not a forced green.

## Why this slice exists (the regression class)

`build` / `tsc` / `lint` do NOT catch: (a) React **hydration mismatches** (Task 434 — admin date-format
SSR/CSR divergence shipped green and broke the page); (b) **i18n** missing-key / raw-key leaks at render
time across `sq`/`en`/`uk`/`it`; (c) **mobile horizontal overflow** at 320/375/390. This slice turns those
three classes into deterministic, non-flaky gates (CI-blocking where server-less, owner-run where a live
runtime is required), each with a planted-violation proof that it is not a no-op.

## Goal

1. A **deterministic date-format SSR/CSR parity** vitest guard over `src/lib/formatters.ts` (the exact Task 434
   class) — locale-explicit, timezone-pinned, byte-stable output for all four locales; fails if the SSR/CSR
   parity contract is broken.
2. A **deterministic i18n render-parity** vitest smoke — renders a representative critical surface under the
   `next-intl` provider for `sq`/`en`/`uk`/`it` and fails on any missing-message / raw-key leak (the runtime
   half the static `check:i18n` parity scan cannot see).
3. **Public-route hydration coverage made real**: the existing `check:hydration:verify` self-test is wired as a
   **blocking** CI step (if not already), and the **owner-run live public-route** `check:hydration` run
   (en/sq/uk/listings + a real `HYDRATION_LISTING_PATH`) is documented in the session log **with PASS results
   IF a stable local runtime + real slug are available; otherwise the exact owner-native command(s) are recorded
   and the affected registry row is left 🟡 (never a fabricated PASS — see pre-execution addendum).** The
   planted-violation proof comes from `check:hydration:verify` / `--verify-gate`, not from breaking a live route.
4. **Mobile no-overflow** coverage: the deterministic story-level `screenshots:assert` (no h-scroll at 320,
   full-width <640, **uk@320/375/390 mandatory**) confirmed to cover the critical admin/user/listing surfaces;
   the **owner-run live route** overflow evidence at 320/375/390 documented in the session log.
5. Registry rows flipped per the owner scope decision; **admin live-route hydration deferred to Slice 6b**.

Smallest reliable guards. NOT every route, NOT every UI state, NOT flaky. Deterministic in CI; live = owner-run.

## Pre-read (rule-index → Regression/critical-flow + i18n/hydration/mobile)

- `docs/agent-contract.md` (clause 15), `docs/backlog.md`, `docs/critical-flow-registry.md` (the P1 section).
- `tasks/Epics/Epic_RS_Regression_Shield.md` (Slice 6 contract + Definition of done + hard boundary).
- `docs/qa-rules.md` — test/error-handling conventions; "Actionable Error-Toast Rule" + "Encoding hygiene".
- `docs/i18n-rules.md` + the four message files under the messages namespace — locale parity contract
  (`sq`/`en`/`uk`/`it` identical key sets); `check:i18n`, `check:locale-leak`, `check:i18n-dynamic` semantics.
- `docs/responsive-screenshot-governance.md` (§MQ machine-detection limits + manual-QA requirement) +
  `docs/responsive-screenshot-matrix.md` — what `screenshots:assert` does and does NOT prove.
- `docs/ai-behavior.md` (Note 18 self-validation).
- **Existing infra to MIRROR / EXTEND, do NOT reinvent:**
  - `scripts/check-hydration-console.mjs` (`check:hydration` / `check:hydration:verify --verify-gate`;
    `PUBLIC_ROUTES` = `/en`,`/en/listings`,`/sq`,`/uk` + `HYDRATION_LISTING_PATH`; `ADMIN_ROUTES` gated on
    `HYDRATION_GATE_COOKIES` + `HYDRATION_ADMIN_USER_ID`). Added by Task 436; admin live-route is the 6b piece.
  - `src/lib/formatters.ts` — `formatDate`, `formatDateTime` (TZ-pinned `UTC`), `formatListingDate`; all take an
    explicit `locale`. This is the deterministic date-format seam (Task 434 root cause = locale/TZ divergence).
  - `scripts/responsive-screenshots.mjs` (**Storybook-only** — does NOT take app routes) + `screenshots:assert`
    (`scripts/check-stories-rendered.mjs`). The deterministic mobile gate is **story-level**; live route overflow
    is owner-run. Do NOT build a live-route screenshot CI job (owner decision).
  - Slice 2/3/4/5 smokes + `package.json` `test:auth`/`test:listings`/`test:admin`/`test:rls-guards`;
    `.github/workflows/governance-pr.yml`.

## Required investigation (report in session log BEFORE writing tests)

1. **Date-format surfaces:** confirm the formatter functions in `src/lib/formatters.ts` and list the critical
   consumers (e.g. `AdminUserProfile.tsx`, `StatusChangeHistory.tsx`, `AdminUsersTable.tsx`, listing cards). Note
   which use `formatDateTime` (TZ-pinned) vs `formatDate`/`formatListingDate`. Identify the exact parity contract
   each guarantees (explicit locale in, deterministic text out, no `Date.now()`/`new Date()`-without-arg, no
   unpinned timezone for datetime).
2. **i18n render target:** pick ONE representative critical surface that exercises many keys across namespaces and
   renders cleanly in jsdom under the `next-intl` provider (no live data / no server action). Confirm the seam
   (provider + messages import) and that it does not require a running DB. If no component renders cleanly in
   jsdom without product changes, **STOP and ASK** — do not modify product code to make it testable.
3. **Hydration public routes:** confirm the `check:hydration:verify` self-test passes and whether it is already a
   blocking CI step in `governance-pr.yml` (Task 436 may have wired `:verify`). Confirm the live `check:hydration`
   public-route command + how to set a real `HYDRATION_LISTING_PATH`.
4. **Mobile overflow:** confirm `screenshots:assert` already covers stories for the critical admin/user/listing
   surfaces (uk@320/375/390 mandatory). If a critical surface has NO story, do NOT create one here — record the
   gap as a Slice 6b/follow-up item and **STOP and ASK** before adding any story/product code.
5. **6b boundary:** confirm exactly which row needs an authenticated admin runtime (the `/en/admin/users/[id]`
   live hydration row) and write the honest deferral note for it.

## Deterministic gates to build (server-less, CI-blocking)

### G1 — Date-format SSR/CSR parity (NEW vitest)
`src/lib/__tests__/date-format-ssr-parity.smoke.test.ts` (note any naming/location deviation):
- For each locale `sq`/`en`/`uk`/`it` and a FIXED ISO input, assert `formatDate`/`formatDateTime`/
  `formatListingDate` return the exact expected string (snapshot the literal, do not compute it the same way the
  source does — assert the concrete bytes). **Use an ISO timestamp near a day boundary, e.g.
  `2026-01-01T00:30:00.000Z`,** so that removing `timeZone:'UTC'` actually produces a byte difference in a
  non-UTC timezone (a midday timestamp could mask the regression).
- **TZ-invariance of `formatDateTime`:** assert identical output regardless of the ambient timezone (the whole
  point of the `timeZone:'UTC'` pin). **Prefer spawning a child Node process with explicit `TZ` env values
  (`TZ=UTC` and `TZ=America/New_York`) rather than mutating `process.env.TZ` inside the same Vitest process** —
  Node/V8 `Intl`/timezone state does not reliably re-initialize mid-process, which would make both the test AND
  the planted "remove `timeZone:'UTC'`" violation unreliable. Require byte-identical output across the two TZ
  child runs; the planted violation MUST then produce a real byte difference.
- Edge cases: `null`/`undefined`/invalid → `'—'`.

### G2 — i18n render parity (NEW vitest)
`src/i18n/__tests__/i18n-render-parity.smoke.test.ts` (note any deviation):
- Render the chosen representative surface under the `next-intl` provider once per locale `sq`/`en`/`uk`/`it`.
- **Representative-target selection order (pick the first that works without product change):**
  1. a critical listing/admin/user surface already renderable in jsdom (no DB/server-action dependency);
  2. a smaller shared component that consumes multiple `next-intl` namespaces;
  3. a **purpose-built test-only harness component inside the test file** that pulls the real message namespaces
     through `NextIntlClientProvider`. Option 3 is a test artifact, not product code, and is preferred over
     wrestling a DB/server-action-coupled component into jsdom.
  **Do NOT change product code to make a component testable** — fall down the order or use the harness instead.
- Spy on `console.error`/`console.warn`; assert NO `next-intl` missing-message error (e.g.
  `MISSING_MESSAGE`) and NO raw translation key leaking into the rendered text for any locale.
- This is the deterministic runtime half of the i18n-parity row (static parity stays `check:i18n`).

### G3 — Hydration self-test (EXISTING — ensure blocking)
- Ensure `npm run check:hydration:verify` (server-less planted-violation self-test) is a **blocking** step in
  `governance-pr.yml`. If Task 436 already added it, confirm and reference it; do not duplicate.

### G4 — Mobile overflow (EXISTING — confirm coverage)
- The blocking deterministic mobile gate is the existing `screenshots:assert` (story-level: no h-scroll at 320,
  full-width <640, uk@320/375/390). Confirm the critical admin/user/listing stories are in its set. Do NOT add a
  live-route screenshot CI job and do NOT add new product stories without STOP-and-ASK.

### Gate wiring
- Add ONE new npm script bundling the new vitest guards, mirroring the `test:rls-guards` shape, e.g.
  `"test:i18n-hydration": "vitest run src/lib/__tests__/date-format-ssr-parity.smoke.test.ts src/i18n/__tests__/i18n-render-parity.smoke.test.ts"`
  (adjust paths to the real files). Wire `npm run test:i18n-hydration` into `governance-pr.yml` as a **blocking**
  step alongside the Slice 2–5 test steps. Ensure `check:hydration:verify` and `check:i18n` are blocking.
- Deterministic: no real Supabase/auth/network/Docker, no booted Next server, no timing flakiness.

## Owner-run LIVE evidence (documented in session log — NOT a CI step)

Provide the exact commands, paste results, and include a planted-violation proof where feasible:
- **Public-route hydration:** `BASE_URL=http://localhost:3000 npm run check:hydration` against a running
  `npm run dev`/`next start`, with `HYDRATION_LISTING_PATH=/en/listings/<real-slug>` set. Paste the **PASS** summary
  for en/sq/uk/listings + listing-detail. **Live-route evidence is PASS-only** — the "gate is real" proof comes
  from the server-less `npm run check:hydration:verify` / `--verify-gate` self-test (built-in planted violation).
  **Do NOT plant a mismatch by editing a product route/component** (that would violate prevention-only) — never
  break a real route to demonstrate the gate.
- **Mobile route overflow:** capture/inspect the critical admin/user/listing routes at 320/375/390 (uk@320
  mandatory) and confirm no horizontal scroll / full-width <640. Paste the evidence (matrix or screenshots note).

State explicitly that these are owner-run because they need a live runtime, per the 2026-06-17 scope decision.

## Positive flow

Clean tree: `npm run lint` + `npx tsc --noEmit` pass; `npm run test:i18n-hydration` runs the new G1+G2 guards
green; `npm run check:hydration:verify` PASS; `npm run check:i18n` PASS; `npm run screenshots:assert` (or
`:fast`) green for the critical surfaces; `npm run check:file-integrity:all` clean. The new CI step is present
and blocking. `docs/critical-flow-registry.md` P1 section updated per the owner scope decision. Owner-run live
evidence pasted in the session log.

## Negative flow (PROOF each new gate is real)

A planted-violation transcript for **each new deterministic gate** in the session log (break → FAIL → revert →
green). Concrete suggested plants:
- **G1 date-format:** remove `timeZone: 'UTC'` from `formatDateTime` (or feed a non-explicit locale) → the
  TZ-invariance / literal-bytes assertion FAILS under the non-UTC TZ run. Revert → green.
- **G2 i18n render:** temporarily delete one key from one locale's messages (or point the provider at an empty
  namespace) → the render smoke detects `MISSING_MESSAGE` / raw-key leak → FAILS. Revert → green.
- **G3 hydration:** `npm run check:hydration:verify` already self-tests (built-in planted violation) — paste it.
- **G4 mobile overflow (owner-run/story):** EITHER paste an existing documented `screenshots:assert`
  planted-violation transcript (a story forced non-full-width / overflowing at 320 fails the assert), OR
  explicitly state that no NEW G4 planted violation was performed because G4 is an existing gate, not a new
  deterministic gate built in this task. Do NOT imply a proof was produced if only the gate's known behavior is
  being cited.

A gate that cannot be made to fail is a no-op = **TASK FAILURE.**

## Registry update (required — be honest, per owner scope decision)

In `docs/critical-flow-registry.md` "P1 — i18n / hydration / mobile contract (Slice 6 / Task 445)":
- **i18n parity on key routes** → ✅ — static `check:i18n` (parity) + G2 render-parity smoke (runtime) + owner-run
  live confirmation. Command(s) named. **If G2 used a test-only harness (not a real key route in jsdom), the row
  note must read "runtime message-provider parity covered" — do NOT imply every key route was rendered.**
- **Hydration — detector + self-test** → ✅ (already; confirm blocking) with `check:hydration:verify`.
- **Hydration — live public routes** → ✅ — basis: `check:hydration:verify` blocking in CI **plus** owner-run
  live `check:hydration` public-route evidence (en/sq/uk/listings + `HYDRATION_LISTING_PATH`) in the session log.
  State that the CI piece is the server-less self-test and the live run is owner-run (no booted-Next CI step).
- **Hydration — admin routes (`/en/admin/users/[id]`)** → keep **🟡/❌ → Slice 6b**, honest note: "live
  authenticated admin-route hydration requires an authenticated runtime harness; intentionally deferred to
  Slice 6b — not stably buildable as a deterministic CI gate this slice."
- **Date-format SSR/CSR match** → ✅ — G1 `test:i18n-hydration` (formatters parity + TZ-invariance). Command named.
- **Mobile no-overflow at 320/375/390** → ✅ **ONLY IF** `screenshots:assert` actually covers the named critical
  admin/user/listing surfaces at 320/375/390 **including uk**, plus owner-run live route evidence. **If that story
  coverage is missing, do NOT flip the row — leave it 🟡 and record the gap with a Slice 6b/follow-up note** (and
  STOP-and-ASK before adding any story). No false green.

Do NOT mark the admin live-route row ✅. Do NOT claim any live runtime is covered in CI.

## Out of scope

No product redesign or product-code change; **no booted-Next CI step, no live-route Playwright CI job, no admin
auth seeding in CI**; no new product Storybook stories (STOP-and-ASK if a critical surface lacks one); no fix to
Task 433/434/435/437/439; no incidental bug fixes; no edits to the existing Slice 2–5 smokes; no change to
`src/lib/formatters.ts` or any message file (tests READ them); no manifest/drift scanner. The admin live-route
hydration row stays deferred to Slice 6b. If a representative surface is untestable without a product change,
STOP and ASK and swap to a sibling — do not touch product code.

**No rendered product UI is modified (tests + gates + docs only), so the `<640` full-width product gate is N/A —
state this explicitly in the session log. The mobile-overflow ASSERTION (verifying existing surfaces) is in
scope; changing any surface is not.**

## Acceptance criteria

- **AC1** — NEW G1 vitest: `src/lib/__tests__/date-format-ssr-parity.smoke.test.ts` — literal-byte output for
  `formatDate`/`formatDateTime`/`formatListingDate` across `sq`/`en`/`uk`/`it`, TZ-invariance of `formatDateTime`
  (≥2 TZ settings, byte-identical), and `'—'` on null/invalid.
- **AC2** — NEW G2 vitest: `src/i18n/__tests__/i18n-render-parity.smoke.test.ts` — representative surface renders
  under `next-intl` for all four locales with NO missing-message error and NO raw-key leak (asserted via console
  spy + rendered-text check).
- **AC3** — `npm run check:hydration:verify` is a **blocking** CI step (confirm/wire); referenced, not duplicated.
- **AC4** — `test:i18n-hydration` script added to `package.json` (runs G1+G2) and wired into `governance-pr.yml`
  as a blocking step; `check:i18n` confirmed blocking; exact local commands documented.
- **AC5** — Each NEW deterministic gate (G1, G2) has a planted-violation FAIL → revert → PASS transcript in the
  session log. `check:hydration:verify` self-test transcript pasted.
- **AC6** — Owner-run LIVE evidence documented in the session log: public-route `check:hydration` with real
  `HYDRATION_LISTING_PATH` **PASS** results; the hydration planted-violation proof comes from
  `check:hydration:verify` (server-less self-test, not a broken live route); mobile route overflow at 320/375/390
  (uk@320 mandatory) documented. Clearly marked owner-run (no CI boot step added). **Per the pre-execution
  addendum: if no stable local runtime / real slug is available, do NOT invent a PASS — record the exact
  owner-native command(s) and leave the affected registry row 🟡.**
- **AC7** — `docs/critical-flow-registry.md` P1 section updated exactly per the owner scope decision: i18n-runtime
  ✅, public hydration ✅ (CI self-test + owner-run live), date-format ✅, mobile overflow ✅ **only if real story
  coverage exists (else 🟡 + gap note — see AC8)**; **admin live-route hydration kept 🟡/❌ → Slice 6b with honest
  deferral note.** No false green; no live-CI claim.
- **AC8** — Mobile-overflow coverage of the critical admin/user/listing surfaces confirmed via `screenshots:assert`
  (or the gap recorded + STOP-and-ASK if a story is missing); uk@320/375/390 present. **`:fast` is acceptable
  ONLY if it covers the required critical surfaces and the uk@320/375/390 cells (else run full
  `screenshots:assert`). Per the addendum, missing story coverage is NOT a task failure if documented honestly
  and the mobile-overflow row is left 🟡 (not flipped to ✅).**
- **AC9** — No product/message/formatter change; no booted-Next CI; no admin-auth-in-CI; no fix to live bugs; no
  new stories without STOP-and-ASK; existing Slice 2–5 smokes unedited.
- **AC10** — `npx tsc --noEmit` clean.
- **AC11** — `npm run lint` clean.
- **AC12** — `npm run check:file-integrity:all` clean (every touched file: 0 NUL, parses, not truncated).
- **AC13** — Investigation notes (date-format surfaces, i18n render target, hydration public-route confirmation,
  mobile-overflow story coverage, the 6b boundary, and confirmation that the `<640` product gate is N/A) in the
  session log.

## Validation

- `npm run lint`, `npx tsc --noEmit`, `npm run test:i18n-hydration`, `npm run check:hydration:verify`,
  `npm run check:i18n`, `npm run screenshots:assert` (or `:fast`), `npm run check:file-integrity:all` — all green
  on every touched file. Provide the AC-by-AC self-audit table + the **"Files Changed"** table in the session
  log. **Do NOT run git** — the orchestrator reviews the diff and emits the commit commands.

## Deliverables / expected Files Changed

- `src/lib/__tests__/date-format-ssr-parity.smoke.test.ts` — NEW (G1 date-format SSR/CSR parity guard)
- `src/i18n/__tests__/i18n-render-parity.smoke.test.ts` — NEW (G2 i18n render-parity smoke; path may adjust)
- `package.json` — MODIFIED (`test:i18n-hydration` script)
- `.github/workflows/governance-pr.yml` — MODIFIED (blocking `test:i18n-hydration` step; confirm
  `check:hydration:verify` + `check:i18n` blocking)
- `docs/critical-flow-registry.md` — MODIFIED (P1 rows per owner scope decision; admin live-route → Slice 6b)
- `docs/sessions/2026-06-17-task445-i18n-hydration-mobile-shield.md` — NEW (session log; adjust date to run day)
- `docs/backlog.md` — MODIFIED (Last Session + Task 445 status)

(Exact representative i18n surface, test file locations, and the single-vs-split test layout may adjust if the
investigation finds a cleaner seam — note any deviation in the Files Changed table and the session log. Any
need for product code, a new story, admin-auth-in-CI, or a booted-Next CI step → STOP and ASK, do not proceed.)
