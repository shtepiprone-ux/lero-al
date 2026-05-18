# Storybook Visual Snapshots — Lero.al
**Phase 4 of Future Maintenance Direction Epic**
Established: 2026-05-18
Status: PHASE 4 CLOSED ✅ | PHASE 5 ESTABLISHED ✅

**Phase 5 (Responsive Regression Screenshots) is now complete.**
Screenshot capture infrastructure added in Task 62.
See `docs/responsive-screenshot-governance.md` and `docs/responsive-screenshot-matrix.md`.

---

## §1 — CURRENT PHASE 4 SNAPSHOT READINESS

**Readiness level: FOUNDATION ONLY**

Phase 4 establishes the snapshot infrastructure without running automated visual tests:

| Item | Status |
|---|---|
| Storybook configured for Next.js | ✅ Done |
| Global viewport matrix configured | ✅ Done (15 breakpoints) |
| Global locale matrix configured | ✅ Done (sq/en/uk/it) |
| Stable story fixtures | ✅ Done |
| `npm run build-storybook` | ✅ Pass (Vite-based, Task 61.1) |
| Automated screenshot capture | ✅ Phase 5 (`npm run screenshots:responsive`) |
| Visual diffing integration | ❌ Phase 6 (manual comparison now) |
| Chromatic / Percy | ❌ Phase 6 (optional) |
| `@storybook/addon-a11y` | ❌ Phase 6 |
| Interaction testing | ❌ Phase 6 |

---

## §2 — WHAT IS VALIDATED NOW (Phase 4)

- **Story compilation** — all stories compile without TypeScript errors
- **Storybook build** — `npm run build-storybook` produces a valid static build
- **Governance compliance** — `npm run governance` passes with story files included
- **Manual visual review** — Storybook can be run locally for visual inspection
- **Locale switching** — global locale toolbar works in Storybook preview
- **Viewport switching** — all 15 project breakpoints are selectable in Storybook toolbar

---

## §3 — INTENTIONALLY DEFERRED TO PHASE 5

The following are out of scope for Phase 4:

### Visual Regression Testing
Requires browser automation that would make CI flaky or slow.
Deferred to Phase 5: **Responsive Regression Screenshots**.

### Chromatic / Percy Integration
These are paid services. Deferred to Phase 5 with optional integration.
If integrated: must be optional (non-blocking for contributors without accounts).

### @storybook/addon-a11y
Automated accessibility testing via axe-core in Storybook.
Deferred to Phase 5 as it adds non-trivial CI overhead.

### @storybook/test (interaction testing)
Storybook interaction testing (`play` function stories).
Deferred to Phase 5.

### Committed Screenshots
No screenshots should be committed to the repository.
Snapshots must be generated at CI time and stored in CI artifacts, not git.

---

## §4 — RECOMMENDED FUTURE SNAPSHOT STRATEGY (Phase 5)

### Option A — Chromatic (recommended if budget allows)
```bash
npm install --save-dev @chromatic-com/storybook
```
- Automated per-PR visual diffing
- Free for open-source, paid for private repos
- Zero configuration for snapshot storage

### Option B — Storybook Test Runner with Playwright
```bash
npm install --save-dev @storybook/test-runner playwright
```
- Self-hosted visual testing
- Requires maintaining a baseline snapshot library
- No external service dependency

### Option C — Percy
Similar to Chromatic. Paid service with free tier.

### Phase 5 Decision Criteria
Choose based on:
1. Team size and review workflow
2. Budget for paid services
3. Acceptable CI time (Chromatic is fastest, Playwright is slowest)

---

## §5 — VIEWPORT MATRIX

All viewports are configured in `.storybook/preview.tsx`.

| Name | Width | Height | Use |
|---|---|---|---|
| Mobile 320px | 320px | 812px | Narrowest supported mobile |
| Mobile 360px | 360px | 800px | Common Android |
| Mobile 375px | 375px | 812px | iPhone SE / common |
| Mobile 390px | 390px | 844px | iPhone 14 |
| Mobile 412px | 412px | 915px | Common Android XL |
| Mobile 480px | 480px | 900px | Large mobile |
| Tablet 640px | 640px | 960px | Small tablet |
| Tablet 768px | 768px | 1024px | iPad / tablet |
| Desktop 1024px | 1024px | 768px | Laptop |
| Desktop 1280px | 1280px | 800px | Standard desktop (default) |
| Desktop 1440px | 1440px | 900px | Wide desktop |
| Huge Desktop 1720px | 1720px | 1080px | Large monitor |
| Huge Desktop 1920px | 1920px | 1080px | Full HD |
| Huge Desktop 2560px | 2560px | 1440px | 2K / QHD |
| Ultrawide 3440px | 3440px | 1440px | Ultrawide |

**Priority viewports for snapshot testing:**
- 375px (mobile baseline)
- 768px (tablet)
- 1280px (desktop baseline)
- 2560px (huge desktop — whitespace wasteland check)

---

## §6 — LOCALE MATRIX

| Locale | Label | Risk Level | Notes |
|---|---|---|---|
| `en` | English | LOW | Reference locale |
| `sq` | Albanian | LOW | Default app locale |
| `uk` | Ukrainian | HIGH | **Longest strings — primary stress test** |
| `it` | Italian | MEDIUM | Medium-length strings |

**Priority for visual snapshots:** All 4 locales at 375px and 1280px.
**Critical combination:** `uk` × `375px` — most likely to reveal overflow issues.

---

## §7 — SNAPSHOT STABILITY RULES (for Phase 5 implementation)

When implementing visual snapshots in Phase 5, follow these rules:

### Story stability requirements
- All stories MUST use fixed fixture data (no `Math.random()`, no `new Date()`)
- All stories MUST NOT depend on network calls
- All stories MUST NOT depend on browser storage (localStorage, sessionStorage, cookies)
- All stories MUST NOT depend on auth state
- All locales MUST produce deterministic renders

### What must NOT be committed
```
storybook-static/          — build output
.storybook-cache/          — Storybook cache
__snapshots__/             — if using jest-based snapshots
*.png / *.jpg / *.snap     — visual artifacts (store in CI artifacts instead)
```

### How to avoid flaky visual tests
1. Fix all dates in fixtures (use ISO strings, not `new Date()`)
2. Fix all animation durations to 0ms in story decorators
3. Disable CSS transitions in snapshot mode (`prefers-reduced-motion: reduce`)
4. Use stable IDs in fixture data
5. Avoid loading state stories for snapshots (use populated states)
6. Run snapshots only on Linux CI (font rendering differences by OS)

### Snapshot storage
- Store snapshots in CI artifacts (e.g., GitHub Actions artifacts)
- NEVER commit snapshot files to git
- Use Chromatic/Percy for hosted comparison (preferred over git-committed PNGs)

---

## §8 — GOVERNANCE SNAPSHOT CADENCE (Phase 5 target)

| Cadence | Scope | Trigger |
|---|---|---|
| Per-PR | Changed story files only | Automatic on PR |
| Weekly | Full story suite | Scheduled Monday 09:00 UTC |
| On-demand | Specific story | Manual workflow dispatch |

---

## §9 — KNOWN LIMITATIONS (Phase 4)

1. **`npm install` required** — Storybook packages are declared in `package.json` but `node_modules` may need refresh. Run `npm install` before `npm run build-storybook`.

2. **next-intl messages** — Stories import `messages/*.json` directly. If new i18n namespaces are added to the app, they should also be accessible in stories via the global decorator.

3. **Geist font in Storybook** — Uses CDN fallback in `preview-head.html` instead of Next.js font optimization. Stories may render slightly differently from production for font-sensitive measurements.

4. **Server components** — Components that are React Server Components cannot be used directly in Storybook stories. Create a client wrapper story if needed.

5. **next/navigation** — The `@storybook/nextjs` adapter mocks `useRouter`, `usePathname`, and `useSearchParams`. Complex navigation flows should be tested in the full app.
