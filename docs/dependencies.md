### Dependencies
- Before adding a new npm package — check: bundle size, maintenance status, weekly downloads, license, and whether the same problem is already solved by an existing project dependency.
- Prefer packages already in the ecosystem (e.g. use `date-fns` if already installed).
- Never add a package to solve a problem solvable with 10 lines of vanilla JS/TS.
- Preferred existing packages in the project: `zod`, `react-hook-form`, `@hookform/resolvers`, `date-fns`, `@sentry/nextjs`, `next-intl`, `@supabase/supabase-js`, `@supabase/ssr`.

### Approved additions

| Package | Version | Rationale |
|---------|---------|-----------|
| `react-easy-crop` | `^5.5.7` | Avatar crop UX — drag-to-pan + pinch/wheel zoom inside a 1:1 crop frame; ~25 kB gzipped, MIT, actively maintained, touch-gesture support included. Bespoke alternative would require ~150 LoC plus touch/accessibility edge cases. Loaded lazily via `next/dynamic({ ssr: false })`; zero impact on First Load JS of pages that render the avatar without opening the crop modal. |
| `@react-email/components` | `^1.0.12` | React Email component library + `render()` async function. Used in `BaseEmail.tsx` (shared email layout) and future transactional email templates. Renders React components to email-client-safe HTML. Production dependency because `BaseEmail.tsx` is imported in server actions that send email. Note: package marked deprecated by the react-email team (reorganizing package structure) but fully functional. |
| `react-email` (dev) | `^6.1.5` | React Email local preview server (`npm run email`). Scans `src/modules/notifications/lib/emails/` and renders all email templates at `localhost:3000` for development inspection. Dev-only; has no runtime impact. |