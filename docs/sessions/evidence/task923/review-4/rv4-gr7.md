# Task 923 review 4 — GR-7 / primary source for the clipped-away track (Opus, 2026-10-15)

Subject: a transformed carousel track whose own box lies outside its clipping frame while its visible slide lies inside.
Standing references: the review-3 and executor live checks stand (`review-3/rv3-gr7-live.txt`, `r4-10-gr7-live.json`:
TailAdmin `/carousel` keeps media-only slides wholly outside its `div.swiper` frame). No new product-reference claim.

Primary source, fetched live this session:

- URL: https://www.w3.org/WAI/ARIA/apg/patterns/carousel/ (WAI-ARIA APG, Carousel pattern, "About" section)
- Literal: "slides that are not visible on screen are incorrectly hidden, e.g., displayed off-screen"
- Reading: an off-screen slide is correctly hidden only when it is also removed from assistive technology and from the
  tab sequence; being off-screen alone is the defect. The page prescribes no mechanism.

Applied in kickoff §13 R22: the off-screen part of a track is by design only when it holds no text and every control in
it is hidden from assistive technology (`aria-hidden="true"` on it or an ancestor, or `inert`) and out of the tab order
(`tabindex="-1"`, `disabled` or `inert`). The gallery pattern does exactly this (source lines 104-106 of the gallery
pattern file, cited in the kickoff ledger).
