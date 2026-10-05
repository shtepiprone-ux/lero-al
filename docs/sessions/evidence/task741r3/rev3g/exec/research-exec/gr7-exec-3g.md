# GR-7 — task execution (Sonnet), 2026-10-04: Task 741 Revision 3g (fill-to-width ladder, uncut focus ring)

Scripts: `gr7-exec-3g.mjs` (items, at 1440 and 390), `gr7-focus-3g.mjs` (real keyboard Tab until a page-number control is focused, `:focus-visible`, computed outline), `gr7-rozetka-3g.mjs` (headed Chrome). Data: `gr7-exec-3g.json`, `gr7-focus-3g.json`, `rozetka.txt`, `rozetka-paginator-{1440,390}.png`, `exec-NN-*.png`, `focus-*.png`. Kamr signed in with `demo@example.com`.

| Page | Library row | At 1440 | At 390 | Focus (Tab, `:focus-visible`) |
|---|---|---|---|---|
| Rozetka catalogue (owner link) | not in library | "1 2 3 4 ... 100" with arrows, 42px squares | the same row in a 359px block, 32x34 squares | not measured here (reviewer's record: 2px shadow ring) |
| Kamr `/ui-pagination` | 038 | "1(current) 2 3 4" | the same | computed `outline: 3px none` and no `box-shadow` on a page-number control; **difference from the reviewer's note** ("3px ring that is not cut"), I did not reproduce a ring on the page controls |
| TailAdmin `/pagination` | 076 | "Previous 1 2 3 ... 8 9 10 Next" | **"Page 1 of 10"** | `outline: 1px auto` offset 1px (browser default ring) on "1" |
| Lahomes `/ui-pagination.html` | 060 | "Previous 1 2 3 Next" | the same | `outline: 0px none`: no visible ring |

No page overflowed at 390.

## Options across references and choice

| Choice | Options <- pages | Chosen |
|---|---|---|
| Page numbers on a phone | neighbours that fit <- Rozetka, Kamr, Lahomes; "Page X of Y" <- TailAdmin 390 | fill to width (owner D46-8, the recommended option) |
| Focus ring | whole ring <- TailAdmin (default outline); none <- Lahomes, Kamr's page controls in my run | Mantine's own 2px ring at 2px offset, never clipped (WCAG 2.2 2.4.7) |

The one difference (Kamr's ring) does not change the choice: the rule is that a ring, wherever one is drawn, is never cut, and the chosen ring is Mantine's default. No kickoff conflict.

## Receipt

`GR-7 REFERENCE RESEARCH — moment: execution (741 Revision 3g); role: Sonnet; task: 741; subject: paginator page numbers per width, keyboard focus ring; references: Lahomes, Kamr, Omah, TailAdmin + Rozetka (owner); library: docs/research/references/2026-10-04; live-checked pages: Rozetka catalogue paginator at 390 and 1440 → "1 2 3 4 ... 100" unchanged; Kamr /ui-pagination (038) → unchanged, difference: no focus ring reproduced on page controls; TailAdmin /pagination (076) → unchanged ("Page 1 of 10" at 390); Lahomes /ui-pagination (060) → unchanged; route inventory: Lahomes 106/106/0, Kamr 62/62/0, Omah 339/339/0, TailAdmin 88/88/0 (library), Rozetka 1/1/0; inspected in depth: the 4 pages at 1440 and 390 (full-page screenshots, items, computed focus outline from a real Tab); workflow states operated: Kamr sign-in, Tab to a page control, Rozetka scroll to list end; options across references: neighbours that fit ← Rozetka, Kamr, Lahomes; Page X of Y ← TailAdmin 390; chosen 2026 best practice: fill-to-width ladder (D46-8) and an uncut focus ring; absent or unverified: Omah (no paginator page relied on; library row 013 stands), the Omah order-list ring recorded by the reviewer; lero.al data map: MantinePagination consumers ListingsPagination, AdminListingsView, AgentStatisticsView, MantineAdminSurfacePattern (Story only); owner decisions: D46-6, D46-7, D46-8; evidence: docs/sessions/evidence/task741r3/rev3g/exec/research-exec/.`
