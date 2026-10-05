# GR-7 — task execution (Sonnet), 2026-10-04: Task 741 Revision 3i (card badge and photo-count position, archived look, corner painting)

Scripts and data in this folder: `omah-badge-3i.mjs/.json` (Omah `/property-list` status badges, 1440 and 390), `gr7-rozetka-labels-3i.mjs/.json` and `rozetka-labels-{1440,390}.png` (headed Chrome, catalogue tile labels). The TailAdmin `/pagination` corner crops and the Omah toggle values were re-measured in Revision 3h (`rev3h/exec/research-exec/`) earlier today and are not re-run: this revision does not change the paginator or the card text styles.

| Page | Library row | Viewport | Observed | Result |
|---|---|---|---|---|
| Omah `/xhtml/property-list.html` | 013 | 1440 and 390 | `status badge badge-sm bg-primary` "For Rent": `position: absolute`, on the photo, 11px/400, radius 4px, `rgb(59,76,184)`, white text, 25px high | unchanged: the status label sits on the photo |
| Rozetka catalogue `/ua/notebooks/c80004/` (owner link) | not in library | 1440 and 390 | `tile-promo-label promo-label`: "ТОП ПРОДАЖІВ" (`rgb(255,169,0)`) and "АКЦІЯ" (`rgb(248,65,71)`), 10px/700, radius 50px (a pill), `position: absolute`, on the photo, at its top-left corner (offset 0,0), the same at 390 | the label sits on the photo, top-left |

Difference from the kickoff: none. §18.20.2 says the status labels sit on the photo, top-left, on the Rozetka tile and the Omah card; both are confirmed live.

## Options across references and choice

| Choice | Options <- pages | Chosen |
|---|---|---|
| Status label position | on the photo, top-left <- Rozetka, Omah (Omah's badge is on the photo too) | badges on the photo top-left, photo count bottom-right, visible in both layouts |
| Archived look | n/a: no reference shows an archived card | grayscale on the card, the fade on the photo only (R70, GR-11: no opacity on a bordered rounded shape) |

## Receipt

`GR-7 REFERENCE RESEARCH — moment: execution (741 Revision 3i); role: Sonnet; task: 741; subject: card badge and photo-count position, archived state, corner painting; references: Lahomes, Kamr, Omah, TailAdmin + Rozetka (owner); library: docs/research/references/2026-10-04; live-checked pages: Omah /property-list (013) → unchanged (status badge on the photo); Rozetka catalogue → promo labels on the photo top-left at 1440 and 390; TailAdmin /pagination and the Omah toggle values → measured in 3h today, not re-run; route inventory: Lahomes 106/106/0, Kamr 62/62/0, Omah 339/339/0, TailAdmin 88/88/0 (library), Rozetka 2/2/0; inspected in depth: the two pages above at 1440 and 390 (computed position, size, colour, offset from the photo corner, screenshots); workflow states operated: Rozetka scroll to the catalogue; options across references: labels on the photo top-left ← Rozetka, Omah; chosen 2026 best practice: badges on the photo top-left, photo count bottom-right, visible in both layouts; archived without fading the card's border; absent or unverified: Lahomes, Kamr and TailAdmin card pages not re-opened live (library rows and 3h's record stand); lero.al data map: ListingCard → MantineListingCardPattern (/listings, /favorites, home rails, cabinet); owner decisions: D46-9, D90-1; evidence: docs/sessions/evidence/task741r3/rev3i/exec/research-exec/.`
