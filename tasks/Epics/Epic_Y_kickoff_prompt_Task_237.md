# Epic Y — Task 237 kickoff — Admin moderation preview: "Переглянути оголошення" must never 404

> **You are Claude Code Sonnet 4.6 in `lero-al`. Read `docs/agent-contract.md` (clauses 1–13) FIRST.** Conforms to
> the current P0 contract (mobile <640 full-width gate, rendered matrix, no-hardcode) + the Positive/Negative
> two-flow rule. No scope change; STOP & ASK if ambiguous. Implements Epic Y Task 237 (source: `issues.txt` #28).

```
Type:        bug + feature
Priority:    high
Area:        admin /admin/listings row action "Переглянути оголошення"
             src/components/admin/AdminListingsTable.tsx (row action)
             a NEW admin-only preview route (e.g. src/app/[locale]/admin/listings/[id]/preview/page.tsx)
             public detail renderer reuse: src/app/[locale]/listings/[slug]/page.tsx (READ for reuse; do not change its publish gate)
```

## Bug / Goal
From `/admin/listings`, an admin or moderator viewing a listing in `moderation` (or any non-published) status clicks
"Переглянути оголошення" and gets a **404** — the public detail page is not generated until publish. Provide a
**temporary admin-only preview** that renders the listing exactly as the public detail page would, with a clear
"PREVIEW — not published" banner (i18n ×4), role-gated (admin + moderator) and RLS-enforced. After publish, the
canonical public URL works as today; the admin preview link keeps working for as long as the row exists.

## Pre-read (mandatory)
1. `docs/agent-contract.md` (1–13) · `docs/backlog.md`
2. `docs/rule-index.md` → "DB / server action / RLS task" + "UI / layout / component task" (mixed) → `data-access-rules`,
   `rls-rules`, `domain-rules` (listing status lifecycle), `qa-rules`, `design-system.md` (§8 public layout, §14, §16).
3. `tasks/Epics/Epic_Y_Listing_Form_and_Lifecycle_UX.md` (Task 237 spec + dependencies).
4. Read before editing: `AdminListingsTable.tsx` (the row action + how it builds the target URL),
   `src/app/[locale]/listings/[slug]/page.tsx` (public renderer + its publish/notFound gate),
   listing status helpers in `src/modules/listings/*`, the admin route guard / middleware.
5. `package.json` validation scripts.

## Current behavior to preserve (Notes 19/20)
- `/admin/listings` row action "Переглянути оголошення" currently links to the public `/[locale]/listings/[slug]` URL.
- Public detail page returns `notFound()` for non-published listings (PRESERVE this gate — public must NOT expose
  drafts/moderation).
- Listing status lifecycle + helpers unchanged. The admin row's other actions (edit/delete/status/premium) unchanged.
- Inventory every AdminListingsTable row action before/after in the session log (Note 20) — only the preview link target
  changes; nothing removed.

## 🔴 Mobile <640 full-width gate (clause 11)
The preview page renders the public detail layout — it MUST be full-width at <640 like the public page (no centered
card, no h-scroll at 320). The "PREVIEW — not published" banner spans full width, labels wrap (sq/en/uk/it), ≥44px any
action. Any popup on the preview = full-width bottom sheet.

## Positive flow (happy path)
As admin/moderator at `uk` 375px:
1. On `/uk/admin/listings`, a listing in `moderation` status shows "Переглянути оголошення".
2. Click → navigates to the admin preview route (e.g. `/uk/admin/listings/<id>/preview`).
3. The listing renders with the SAME layout as the public detail page + a top "PREVIEW — not published" banner (i18n ×4).
4. RLS + route guard allow admin + moderator to view moderation/rejected/archived listings here.
5. After the listing is published, the public URL `/[locale]/listings/[slug]` works; the admin preview link still works.

## Negative flow (every branch needs a diff line)
- **Non-staff / unauthenticated** hits the preview URL directly → blocked (route guard + RLS), redirected to login or
  403; NEVER renders a non-published listing to a non-staff user.
- **Listing id not found / soft-deleted** → admin preview shows a not-found state (not a raw 500).
- **Published listing** preview → still renders (banner may switch to "Published" or hide — decide in kickoff; if
  ambiguous STOP & ASK). Public URL unaffected.
- **Wrong locale** → banner + any label resolves in active locale, no raw key.
- **RLS denies** (misconfigured) → graceful message, no crash, no data leak.

## Required investigation
1. Read how the public renderer fetches + gates the listing; design the preview to **reuse** the renderer with a
   `preview`/`isStaffPreview` flag rather than duplicating it (Note 14 — no forked component).
2. Confirm the RLS path that lets staff read non-published listings (or define the exact policy; EXACT idempotent SQL
   in the session log — single-writer, owner runs it). If a new policy is needed and ambiguous → STOP & ASK.
3. Confirm the admin route guard covers the new preview route for admin + moderator only.

## Acceptance criteria
- "Переглянути оголошення" from `/admin/listings` **never 404s** for any non-deleted listing in any lifecycle state.
- Admin + moderator can preview moderation/rejected/archived; non-staff cannot reach the preview URL (route guard + RLS).
- Public detail URL works only after publish (existing gate preserved).
- Preview reuses the public renderer (no forked duplicate); banner i18n ×4.
- Positive + every Negative branch verifiable in diff; before/after row-action inventory (Note 20).
- **Rendered matrix (clause 12)**: 320/375/390/768/1280/1440/2560 × sq/en/uk/it, uk@320/375/390 present.
- Any new RLS/route → exact SQL/guard in session log; `tsc=0`, `lint=0`, `check:i18n` parity PASS, `npm run build` passes.
- `docs/backlog.md` + `docs/sessions/` updated; **Files Changed table**; **no git from executor**.

## Out of scope
- Restructuring the public detail page. Listing lifecycle state changes (Y.3 / Epic R/I). Raw-key labels (Y.1, done).
- Changing the public publish/notFound gate. Any non-listing admin surface.
