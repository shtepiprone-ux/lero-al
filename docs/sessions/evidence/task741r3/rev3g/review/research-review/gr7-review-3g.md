# GR-7 — review (Opus), 2026-10-04: Task 741 Revision 3g (fill-to-width paginator, uncut focus ring)

Scripts: `gr7-review-3g.mjs` → `gr7-review-3g.json`, `.txt`, `rv-NN-*.png`; `gr7-review-3g-tailadmin.mjs` →
`gr7-review-3g-tailadmin.json`, `.txt`. Both are copies of the 3f review scripts. The 3g copy records `ring`, which is
true only when `outline-style` is not `none` or a `box-shadow` is set. `win32`, Node v22.22.3, Playwright Chromium;
Rozetka runs in headed Chrome. Library: `docs/research/references/2026-10-04/`. Kamr was signed in with
`demo@example.com`.

## RETRACTION (Opus)

- **Invalid prior claim:** the 3f review record `rev3f/review-3f/research-review/gr7-review-3f.md` and kickoff §18.17.1
  F47 / §18.17.3 say that Kamr and Omah draw a 3px focus ring that is not cut.
- **Why invalid:** that record's own output (`gr7-review-3f.txt`) gives `outline: none 3px` and `box-shadow: none` for
  both Kamr and Omah. With `outline-style: none`, no ring is drawn. I read the width and ignored the style. The executor's
  3g live check found the same thing for Kamr (`rev3g/exec/research-exec/gr7-exec-3g.md`).
- **Evidence:** `gr7-review-3g.txt` (this session) prints `ring=false` for Lahomes, Kamr and Omah, and `ring=true` for
  Rozetka (a 2px `box-shadow` ring). `gr7-review-3g-tailadmin.json` shows TailAdmin with an `auto 1px` outline and 260px
  of room.
- **Corrected status:** FACT. Two references draw a visible ring on a page control: Rozetka and TailAdmin. In both, the
  ring is not cut. Lahomes, Kamr and Omah draw no focus indicator, which fails WCAG 2.2 2.4.7, so they are not a
  practice to follow. The 3g choice (a whole, uncut ring) still stands, on the evidence of Rozetka, TailAdmin and
  WCAG 2.4.7. No requirement changes.

## Live-checked pages (1440 and 390)

| Ref | Page | Library row | Paginator | Focus indicator on a page control | Result |
|---|---|---|---|---|---|
| TailAdmin | `/pagination` | 076 | 1440: "Previous 1 2 3 … 8 9 10 Next"; 390: "Page 1 of 10" | `auto 1px` outline, not cut (260px room) | unchanged |
| TailAdmin | `/products-list` | 016 | 1440: "‹ 1 2 3 ›"; 390: no numbered paginator detected | — | unchanged |
| Lahomes | `/ui-pagination.html`, `/property-grid.html` | 060, 008 | "Previous 1 2 3 Next", same at 390 | none | unchanged |
| Kamr | `/ui-pagination` | 038 | "‹ 1 2 3 4 ›" in three sizes, same at 390 | none (`outline-style: none`) | unchanged |
| Omah | `/property-list.html` | 013 | no paginator | — | unchanged |
| Omah | `/order-list.html` | 006 | "‹ 1 2 ›" 30×30 | none | unchanged |
| Rozetka (owner) | `/ua/notebooks/c80004/` | not in library | "1 2 3 4 … 100" at 1440 and 390 | 2px `box-shadow` ring, no clipping ancestor | unchanged |

## Receipt

`GR-7 REFERENCE RESEARCH — moment: review (741 Revision 3g); role: Opus; task: 741; subject: paginator page numbers per width, keyboard focus ring; references: Lahomes, Kamr, Omah, TailAdmin + Rozetka (owner); library: docs/research/references/2026-10-04; live-checked pages: TailAdmin /pagination (076), /products-list (016); Lahomes /ui-pagination (060), /property-grid (008); Kamr /ui-pagination (038); Omah /property-list (013), /order-list (006); Rozetka catalogue → unchanged; route inventory: Lahomes 106/106/0, Kamr 62/62/0, Omah 339/339/0, TailAdmin 88/88/0 (library), Rozetka 1/1/0; inspected in depth: the 8 pages above at 1440 and 390, paginator items, control size, a Tab-focused page control with its indicator and clipping ancestor; workflow states operated: Kamr sign-in, Rozetka scroll to list end, Tab focus; options across references: neighbours that fit ← Rozetka, Kamr, Lahomes; Page X of Y ← TailAdmin 390; visible uncut ring ← Rozetka, TailAdmin; no indicator ← Lahomes, Kamr, Omah (fails WCAG 2.4.7); chosen 2026 best practice: fill-to-width ladder (D46-8) and a whole, uncut ring; absent or unverified: none; lero.al data map: MantinePagination consumers ListingsPagination (/listings, /favorites), AdminListingsView (/admin/listings), AgentStatisticsView (cabinet statistics), MantineAdminSurfacePattern (Story only); owner decisions: D46-6, D46-7, D46-8; evidence: docs/sessions/evidence/task741r3/rev3g/review/research-review/.`
